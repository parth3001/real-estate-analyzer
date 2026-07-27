/**
 * stripeWebhookController — Task #34 (2026-07-14).
 *
 * Receives Stripe's `checkout.session.completed` event when a user
 * completes a $4.99 Payment Link purchase, correlates the session
 * back to the Deal that triggered it (via `client_reference_id`),
 * and issues a DealLicense scoped to that property's canonical
 * address key. This is the moneyward half of Option A (workspace
 * gating + real payment flow — no coming-soon stub).
 *
 * ==================== INVARIANTS ====================
 *
 * INV-1 Raw-body integrity
 *   Stripe signature verification requires the exact bytes Stripe
 *   sent — a JSON.parse round-trip flips key ordering and breaks
 *   the HMAC. The webhook route in index.ts MUST mount
 *   `express.raw({type:'application/json'})` BEFORE the global
 *   `express.json()` parser. If a future refactor moves the mount
 *   order and the body arrives as a parsed object instead of Buffer,
 *   constructEvent throws — do NOT "fix" it by JSON.stringify'ing;
 *   fix the mount order.
 *
 * INV-2 Idempotency
 *   Stripe retries webhooks aggressively (up to 3 days) on any 5xx.
 *   `licenseRepository.purchaseLicense` dedupes on
 *   stripePaymentIntentId — a second delivery of the same event
 *   returns the existing license row, not a fresh one. We rely on
 *   that dedup; DO NOT add a second license lookup here.
 *
 * INV-3 200 on unrecoverable errors
 *   For errors that will NEVER succeed on retry (missing
 *   client_reference_id, deal not found, unhandled event type), we
 *   return 200. Returning 500 tells Stripe "please retry" — which
 *   invites a retry storm and pollutes ops logs. Log the anomaly
 *   and 200 out. 500 is reserved for TRANSIENT failures (DB down,
 *   license repo throws unexpectedly).
 *
 * INV-4 Fast response
 *   Stripe's timeout is 30s. Any downstream work that could exceed
 *   ~5s must be fire-and-forget (setImmediate/queue); the handler
 *   itself must reply promptly. License issuance is a single Mongo
 *   write — well within budget — so it runs inline for v1.
 *
 * INV-5 Signature secret is required
 *   If STRIPE_WEBHOOK_SECRET is unset, the handler returns 500
 *   without processing. NEVER fall back to "trust unsigned events"
 *   — that would let anyone with the endpoint URL issue free
 *   licenses.
 */

import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { DealModel } from '../models/Deal';
import { licenseRepository } from '../repositories/LicenseRepository';

// ===== Stripe client =====
//
// Lazy-init so a missing STRIPE_SECRET_KEY at boot doesn't crash the
// whole app (Stripe is one route among many). The webhook handler
// asserts the client exists before touching it.
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, {
    // Pin API version. Upgrading is deliberate — a silent API-version
    // bump can change payload shapes and break parsing. Matches the
    // SDK's current-generation default (`.dahlia`) so type overloads
    // line up cleanly.
    apiVersion: '2026-06-24.dahlia',
  });
  return stripeClient;
}

/**
 * Extract payment intent id from a Checkout Session — the field is
 * typed as `string | Stripe.PaymentIntent | null` because Stripe can
 * expand the reference into the full object when requested. Payment
 * Links don't expand, so we practically always see a string, but
 * handle the union for safety.
 */
function extractPaymentIntentId(
  session: Stripe.Checkout.Session
): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === 'string' ? pi : pi.id;
}

/**
 * POST /api/webhooks/stripe
 *
 * Route-level assumption: `req.body` is a `Buffer` (raw bytes),
 * because the router mounts `express.raw({type:'application/json'})`
 * BEFORE the global JSON parser (see index.ts). If you see
 * `req.body` as an object, INV-1 has been violated — do not "fix"
 * it here; fix the mount order.
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(
      '[stripeWebhook] STRIPE_SECRET_KEY not set — refusing to process'
    );
    res.status(500).send('Stripe not configured');
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // INV-5 — never trust an unsigned event.
    logger.error(
      '[stripeWebhook] STRIPE_WEBHOOK_SECRET not set — refusing to process'
    );
    res.status(500).send('Stripe webhook not configured');
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    logger.warn('[stripeWebhook] missing stripe-signature header');
    res.status(400).send('Missing signature');
    return;
  }

  // Parse + verify signature.
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      webhookSecret
    );
  } catch (err) {
    // Signature failure is either (a) a bad actor, or (b) our own
    // misconfig (wrong secret, wrong endpoint pair, JSON parser
    // running before us). Log + 400 either way; NEVER 200 an
    // unverified event through — that would let attackers issue
    // licenses by POSTing garbage.
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('[stripeWebhook] signature verification failed', {
      error: msg,
    });
    res.status(400).send(`Webhook signature verification failed: ${msg}`);
    return;
  }

  // For v1 we only care about checkout.session.completed. Other
  // events (charge.refunded, etc.) will be added as needed. Return
  // 200 for unhandled event types so Stripe stops retrying — INV-3.
  if (event.type !== 'checkout.session.completed') {
    logger.debug('[stripeWebhook] unhandled event type — acknowledging', {
      type: event.type,
      eventId: event.id,
    });
    res.status(200).send();
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const dealId = session.client_reference_id;
  const paymentIntentId = extractPaymentIntentId(session);
  const amountTotal = session.amount_total ?? 0;
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  // Missing correlation id is unrecoverable — this session was created
  // outside our app flow (someone hitting the raw Payment Link URL
  // manually). 200 so Stripe stops retrying; log for ops so a manual
  // grant can happen if needed. INV-3.
  if (!dealId) {
    logger.warn(
      '[stripeWebhook] checkout session missing client_reference_id — cannot correlate',
      {
        sessionId: session.id,
        customerEmail,
        paymentIntentId,
      }
    );
    res.status(200).send();
    return;
  }

  // Load the deal to derive userId + propertyAddress. Both fields
  // are the license's primary key together (unique compound index
  // on active status), so we can't issue without them.
  const deal = await DealModel.findById(dealId).lean();
  if (!deal) {
    // Deal was deleted between checkout and this webhook fire — rare
    // but possible. 200 to stop retries; log so ops can refund
    // manually if warranted. INV-3.
    logger.warn(
      '[stripeWebhook] deal not found for client_reference_id — cannot issue license',
      {
        dealId,
        sessionId: session.id,
        customerEmail,
        paymentIntentId,
        amountTotalCents: amountTotal,
      }
    );
    res.status(200).send();
    return;
  }

  // Issue the license. `purchaseLicense` is idempotent on
  // stripePaymentIntentId (INV-2), so Stripe's aggressive retry
  // policy won't produce duplicate licenses.
  try {
    // .lean() flattens ObjectId to a FlattenMaps<ObjectId> variant that
    // isn't structurally assignable to the repository's `ObjectId | string`
    // input — cast to string to normalize.
    const licenseId = await licenseRepository.purchaseLicense({
      userId: deal.userId.toString(),
      propertyAddress: deal.propertyAddress,
      stripePaymentIntentId: paymentIntentId ?? undefined,
      pricePaidCents: amountTotal,
    });
    logger.info('[stripeWebhook] license issued from Stripe payment', {
      licenseId: licenseId.toString(),
      dealId,
      userId: String(deal.userId),
      paymentIntentId,
      amountTotalCents: amountTotal,
      customerEmail,
      sessionId: session.id,
    });
    res.status(200).send();
    return;
  } catch (err) {
    // Transient failure (DB down, race condition on the unique
    // partial index) — 500 so Stripe retries. INV-3 exception:
    // we DO want retries here because the payment already
    // succeeded and the user is entitled to their license.
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(
      '[stripeWebhook] license issuance failed — returning 500 for Stripe retry',
      {
        error: msg,
        dealId,
        sessionId: session.id,
        paymentIntentId,
      }
    );
    res.status(500).send('License issuance failed');
    return;
  }
}
