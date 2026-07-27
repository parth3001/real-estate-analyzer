/**
 * stripeWebhook route — Task #34 (2026-07-14).
 *
 * Owner mount-point: `/api/webhooks/stripe`. Mounted in index.ts
 * BEFORE the global `express.json()` parser with an inline
 * `express.raw({type:'application/json'})` body parser, because
 * Stripe signature verification requires the exact raw bytes.
 * See stripeWebhookController's INV-1 for details.
 */

import express from 'express';
import { handleStripeWebhook } from '../controllers/stripeWebhookController';

const stripeWebhookRouter = express.Router();

stripeWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default stripeWebhookRouter;
