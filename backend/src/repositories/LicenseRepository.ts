/**
 * LicenseRepository — DealLicense + DealCredit read/write API.
 *
 * Mirrors the CostEventRepository / EventsRepository pattern: Zod-gated
 * writes at the trust boundary, strict-mode schemas, no escape hatches
 * around the sanctioned methods.
 *
 * Per Issue #105 substrate spec + Issue #106 Phase B prerequisite.
 *
 * READ vs WRITE split
 * -------------------
 *
 * Unlike substrate events, licenses MUTATE (active → expired → refunded).
 * That means this repository has BOTH writes AND state-transition methods.
 * Each transition method is its own function — no generic
 * `updateLicense(filter, update)` because every legal state change has
 * different invariants and audit semantics.
 *
 *   purchaseLicense       active license created from a Stripe charge
 *                         or first-free flow
 *   redeemCredit          a DealCredit is consumed → DealLicense created
 *   findActiveForProperty look up "does the user have a live license on
 *                         this property?" — the THE chat-turn read path
 *   markLicenseExpired    daily sweeper job + cost-budget exhaustion
 *   markLicenseRefunded   Stripe refund webhook
 *
 *   issueCredits          one row per bundle slot
 *   findRedeemableCredits user's outstanding credits, sorted FIFO
 *   markCreditExpired     daily sweeper
 *   markCreditRefunded    refund webhook
 */

import { Types } from 'mongoose';
import { logger } from '../utils/logger';
import {
  DealLicenseModel,
  DealLicenseSchema,
  type DealLicensePayload,
  type LicenseStatus,
  computeExpiry,
} from '../models/license/DealLicense';
import {
  DealCreditModel,
  DealCreditSchema,
  type DealCreditPayload,
  type CreditSourceType,
  type CreditStatus,
  computeCreditExpiry,
  creditsPerBundle,
} from '../models/license/DealCredit';
import {
  buildCanonicalAddressKey,
  type PropertyAddressInput,
} from '../utils/canonicalAddressKey';
import { DealModel } from '../models/Deal';

// ===== Inputs =====

/**
 * Caller-friendly input for purchaseLicense. The repo derives the
 * canonical key + expiry — callers stay address-shape-aware only.
 */
export interface PurchaseLicenseInput {
  userId: Types.ObjectId | string;
  propertyAddress: PropertyAddressInput;
  /** Stripe correlation. Required for paid purchases; optional for first-free. */
  stripePaymentIntentId?: string;
  /** What the user paid in cents. 0 for first-free. */
  pricePaidCents: number;
  /** Credit ID this license consumed, if redeemed from a bundle. */
  redeemedFromCreditId?: Types.ObjectId | string;
  /** Override the default $2.00 COGS budget. Used by ops for comp licenses. */
  costBudgetCentsStart?: number;
  /** Override default 30-day window. Used for promotional licenses. */
  windowDays?: number;
}

export interface IssueCreditsInput {
  userId: Types.ObjectId | string;
  sourceType: CreditSourceType;
  /** Per-credit price share (cents). See DealCreditSchema docs. */
  pricePaidCents: number;
  stripePaymentIntentId?: string;
  /**
   * Optional override of credit-count for the source. Defaults to
   * creditsPerBundle(sourceType). Used by ops for one-off promo grants.
   */
  count?: number;
  /** Stable purchase grouping ID. Generated if omitted. */
  bundlePurchaseId?: string;
  /** Override 365-day TTL. Used for first-free's shorter window. */
  windowDays?: number;
}

// ===== Repository =====

export class LicenseRepository {
  // ===== Licenses — writes =====

  /**
   * Purchase a license for (userId, property). Idempotent on
   * stripePaymentIntentId — if the same payment intent already
   * created a license, we return the existing row (Stripe's
   * "we'll deliver this webhook again" guarantee).
   *
   * Throws if the user already has an `active` license on this
   * property — the unique partial index enforces the same invariant
   * at the DB level, but we surface a friendlier message at the
   * application layer.
   */
  async purchaseLicense(
    input: PurchaseLicenseInput
  ): Promise<Types.ObjectId> {
    const canonicalKey = buildCanonicalAddressKey(input.propertyAddress);
    const purchasedAt = new Date();
    // Task #7 (2026-05-28): default window is now 180 days (was 30).
    // Task #35 (2026-06-22): env var override DEAL_LICENSE_WINDOW_DAYS lets
    // ops/QA force a short window (e.g. 0) for testing the expired-state
    // UX without waiting 180 days. Production leaves it unset → 180.
    // The explicit input.windowDays ?? still wins so per-tier overrides
    // (promotions, paid tiers) work as before.
    const envWindow = process.env.DEAL_LICENSE_WINDOW_DAYS
      ? Number(process.env.DEAL_LICENSE_WINDOW_DAYS)
      : undefined;
    const windowDays =
      input.windowDays ?? (Number.isFinite(envWindow) ? (envWindow as number) : 180);
    const expiresAt = computeExpiry(purchasedAt, windowDays);

    const payload: DealLicensePayload = {
      userId: input.userId,
      canonicalPropertyAddressKey: canonicalKey,
      propertyAddress: input.propertyAddress,
      purchasedAt,
      expiresAt,
      costBudgetCentsStart: input.costBudgetCentsStart ?? 200,
      pricePaidCents: input.pricePaidCents,
      stripePaymentIntentId: input.stripePaymentIntentId,
      redeemedFromCreditId: input.redeemedFromCreditId,
      status: 'active',
    };
    DealLicenseSchema.parse(payload);

    // Stripe idempotency check (only when we have a payment intent).
    if (input.stripePaymentIntentId) {
      const existing = await DealLicenseModel.findOne({
        stripePaymentIntentId: input.stripePaymentIntentId,
      }).lean();
      if (existing) {
        logger.info(
          'LicenseRepository: idempotent purchase — license already exists',
          {
            paymentIntent: input.stripePaymentIntentId,
            licenseId: existing._id.toString(),
          }
        );
        return existing._id as Types.ObjectId;
      }
    }

    const license = await DealLicenseModel.create(payload);
    logger.info('LicenseRepository: license purchased', {
      userId: input.userId.toString(),
      licenseId: license._id.toString(),
      pricePaidCents: input.pricePaidCents,
      address: canonicalKey,
    });
    // Task #112 / Model #6 (2026-07-19): no counter reset needed.
    // Model #6 gates chat via ConversationEvents-after-DecisionEvent
    // count + license state at check-time; issuing a license here
    // means the next chat turn's cap check finds an active license
    // and returns allow:true naturally. Self-healing, no state to
    // manually clear. (See routes/chat.ts computeChatCapAfterLastScore.)
    return license._id as Types.ObjectId;
  }

  /**
   * Atomically transition status from 'active' → 'expired'. No-op if
   * the license is already non-active. Used by the daily sweeper and
   * by the per-license cap-hit code path.
   */
  async markLicenseExpired(licenseId: Types.ObjectId | string): Promise<boolean> {
    const res = await DealLicenseModel.updateOne(
      { _id: licenseId, status: 'active' },
      { $set: { status: 'expired', expiredAt: new Date() } }
    );
    return res.modifiedCount === 1;
  }

  /**
   * Refund flow — license void. Mutates from any current status to
   * 'refunded' so a refund issued after expiry still records.
   */
  async markLicenseRefunded(
    licenseId: Types.ObjectId | string
  ): Promise<boolean> {
    const res = await DealLicenseModel.updateOne(
      { _id: licenseId, status: { $ne: 'refunded' } },
      { $set: { status: 'refunded', refundedAt: new Date() } }
    );
    return res.modifiedCount === 1;
  }

  // ===== Licenses — reads =====

  /**
   * The hot path: chat-turn lookup of "does this user have a live
   * license on the property they're analyzing?" Returns the license
   * document if found, null otherwise.
   *
   * Sub-ms thanks to the unique compound index on
   * (userId, canonicalPropertyAddressKey) with partial filter on
   * status='active'.
   */
  async findActiveForProperty(
    userId: Types.ObjectId | string,
    address: PropertyAddressInput
  ): Promise<DealLicenseDocument | null> {
    const canonicalKey = buildCanonicalAddressKey(address);
    // Task #35 (2026-06-22): also exclude time-expired licenses. Previously
    // a license with status='active' but expiresAt<now would still be
    // returned here, which let post-180-day workspaces keep mutating.
    // Filter by expiresAt > now so the active-license definition is
    // BOTH status-active AND within the window.
    const doc = await DealLicenseModel.findOne({
      userId,
      canonicalPropertyAddressKey: canonicalKey,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    return doc as DealLicenseDocument | null;
  }

  /**
   * Task #35 (2026-06-22) — find the most recent license for a property
   * REGARDLESS of expiry. Lets the GET endpoint surface a status='expired'
   * UX instead of conflating "no license ever" with "license lapsed."
   */
  async findLatestForProperty(
    userId: Types.ObjectId | string,
    address: PropertyAddressInput
  ): Promise<DealLicenseDocument | null> {
    const canonicalKey = buildCanonicalAddressKey(address);
    const doc = await DealLicenseModel.findOne({
      userId,
      canonicalPropertyAddressKey: canonicalKey,
    })
      .sort({ purchasedAt: -1 })
      .lean();
    return doc as DealLicenseDocument | null;
  }

  /** All licenses for a user, newest first. Powers /account view. */
  async findLicensesForUser(
    userId: Types.ObjectId | string,
    opts: { status?: LicenseStatus; limit?: number } = {}
  ): Promise<DealLicenseDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (opts.status) filter.status = opts.status;
    const cursor = DealLicenseModel.find(filter)
      .sort({ purchasedAt: -1 })
      .limit(opts.limit ?? 100)
      .lean();
    return (await cursor) as DealLicenseDocument[];
  }

  // ===== Credits — writes =====

  /**
   * Issue N credits for a purchase. N defaults to creditsPerBundle(sourceType).
   *
   * Returns the created credit IDs in insertion order. All credits
   * share the same bundlePurchaseId so ops can collapse them into
   * one purchase line.
   */
  async issueCredits(input: IssueCreditsInput): Promise<Types.ObjectId[]> {
    const count = input.count ?? creditsPerBundle(input.sourceType);
    if (count <= 0) {
      throw new Error('LicenseRepository.issueCredits: count must be ≥ 1');
    }
    const bundlePurchaseId =
      input.bundlePurchaseId ?? new Types.ObjectId().toHexString();
    const issuedAt = new Date();
    const expiresAt = computeCreditExpiry(issuedAt, input.windowDays ?? 365);

    const docs: DealCreditPayload[] = Array.from({ length: count }).map(() => ({
      userId: input.userId,
      bundlePurchaseId,
      sourceType: input.sourceType,
      stripePaymentIntentId: input.stripePaymentIntentId,
      pricePaidCents: input.pricePaidCents,
      issuedAt,
      expiresAt,
      status: 'issued',
    }));
    // Validate each
    docs.forEach((d) => DealCreditSchema.parse(d));

    const inserted = await DealCreditModel.insertMany(docs);
    logger.info('LicenseRepository: credits issued', {
      userId: input.userId.toString(),
      sourceType: input.sourceType,
      count,
      bundlePurchaseId,
    });
    return inserted.map((d) => d._id as Types.ObjectId);
  }

  /**
   * Mark a single credit redeemed and link it to the license that
   * consumed it. Atomic — uses a filter on status='issued' so two
   * concurrent redemption attempts can't both succeed.
   */
  async markCreditRedeemed(
    creditId: Types.ObjectId | string,
    licenseId: Types.ObjectId | string
  ): Promise<boolean> {
    const res = await DealCreditModel.updateOne(
      { _id: creditId, status: 'issued' },
      {
        $set: {
          status: 'redeemed',
          redeemedAt: new Date(),
          redeemedAsLicenseId: licenseId,
        },
      }
    );
    return res.modifiedCount === 1;
  }

  async markCreditExpired(
    creditId: Types.ObjectId | string
  ): Promise<boolean> {
    const res = await DealCreditModel.updateOne(
      { _id: creditId, status: 'issued' },
      { $set: { status: 'expired', expiredAt: new Date() } }
    );
    return res.modifiedCount === 1;
  }

  async markCreditRefunded(
    creditId: Types.ObjectId | string
  ): Promise<boolean> {
    const res = await DealCreditModel.updateOne(
      { _id: creditId, status: { $ne: 'refunded' } },
      { $set: { status: 'refunded', refundedAt: new Date() } }
    );
    return res.modifiedCount === 1;
  }

  // ===== Credits — reads =====

  /**
   * User's redeemable credits, sorted FIFO (earliest issuedAt first)
   * so we burn down the ones closest to expiry first.
   */
  async findRedeemableCredits(
    userId: Types.ObjectId | string,
    limit = 50
  ): Promise<DealCreditDocument[]> {
    const cursor = DealCreditModel.find({
      userId,
      status: 'issued',
      expiresAt: { $gt: new Date() },
    })
      .sort({ issuedAt: 1 })
      .limit(limit)
      .lean();
    return (await cursor) as DealCreditDocument[];
  }

  /** Count of user's redeemable credits. Cheap COUNT for UI badges. */
  async countRedeemableCredits(
    userId: Types.ObjectId | string
  ): Promise<number> {
    return DealCreditModel.countDocuments({
      userId,
      status: 'issued',
      expiresAt: { $gt: new Date() },
    });
  }

  // ===== High-level operation: redeem a credit for a property =====
  //
  // Two-write transaction: (1) create the DealLicense, (2) mark the
  // credit redeemed. Order matters — the license has to exist before
  // we can link it from the credit row. If step 2 fails, the license
  // exists orphaned (license created, credit still 'issued') — which
  // is the LESS bad failure mode (user gets the license they paid
  // for; we have an ops-fixable inconsistency to backfill). The
  // OPPOSITE failure (credit marked redeemed, license missing) would
  // silently consume a credit with no user value delivered.

  async redeemCreditForProperty(opts: {
    userId: Types.ObjectId | string;
    creditId: Types.ObjectId | string;
    propertyAddress: PropertyAddressInput;
  }): Promise<{ licenseId: Types.ObjectId }> {
    // Pre-flight: confirm credit is redeemable.
    const credit = await DealCreditModel.findOne({
      _id: opts.creditId,
      userId: opts.userId,
      status: 'issued',
    }).lean();
    if (!credit) {
      throw new Error(
        `LicenseRepository.redeemCreditForProperty: credit ${opts.creditId} not redeemable (not found, wrong user, or already consumed)`
      );
    }
    if (credit.expiresAt && credit.expiresAt < new Date()) {
      throw new Error(
        `LicenseRepository.redeemCreditForProperty: credit ${opts.creditId} expired`
      );
    }

    const licenseId = await this.purchaseLicense({
      userId: opts.userId,
      propertyAddress: opts.propertyAddress,
      pricePaidCents: credit.pricePaidCents,
      stripePaymentIntentId: credit.stripePaymentIntentId,
      redeemedFromCreditId: credit._id as Types.ObjectId,
    });

    const flipped = await this.markCreditRedeemed(opts.creditId, licenseId);
    if (!flipped) {
      // Atomic check-and-set lost — most likely a parallel redemption.
      // The license is now orphaned. Log loudly so ops can backfill.
      logger.error(
        'LicenseRepository.redeemCreditForProperty: credit-flip raced — orphan license created',
        {
          creditId: opts.creditId.toString(),
          orphanLicenseId: licenseId.toString(),
          userId: opts.userId.toString(),
        }
      );
      throw new Error(
        'Credit redemption race detected — please retry. Ops has been notified.'
      );
    }

    return { licenseId };
  }
}

// ===== Mongoose document shapes for return types =====

export interface DealLicenseDocument extends DealLicensePayload {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealCreditDocument extends DealCreditPayload {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Singleton — most consumer code should use this.
export const licenseRepository = new LicenseRepository();

// Re-exports for caller convenience.
export type { LicenseStatus, CreditStatus, CreditSourceType };
