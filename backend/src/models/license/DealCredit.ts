/**
 * DealCredit — a pre-paid, not-yet-redeemed deal unlock.
 *
 * Bundles (5-pack $19.99, 10-pack $34.99) issue N credits at purchase
 * time. Each credit can be redeemed for ONE DealLicense on the user's
 * choice of property within 365 days.
 *
 * State machine:
 *   issued     → purchased but not yet redeemed
 *   redeemed   → consumed; `redeemedAsLicenseId` points at the DealLicense
 *   expired    → 365 days elapsed without redemption
 *   refunded   → Stripe refund processed
 *
 * Per Issue #105 spec.
 *
 * BUNDLE INTEGRITY
 * ----------------
 *
 * When a user buys a 5-pack, we create 5 DealCredit rows with the SAME
 * `bundlePurchaseId` (a UUID we generate). That lets ops queries say
 * "show me the user's purchase history" by collapsing credits from the
 * same bundle into one purchase line. The Stripe payment intent ID is
 * the same across all 5 rows (one charge, five credits).
 *
 * Why N rows instead of `{ count: 5, redeemed: 2 }`? Two reasons:
 *   1. Redemption is naturally per-row — we can mark a single credit
 *      redeemed without a complex partial-update.
 *   2. Refund semantics: if Stripe refunds the bundle and 2 are already
 *      redeemed against $4.99-quality licenses, ops needs a row-level
 *      view to handle the partial-refund / chargeback edge cases.
 */

import { z } from 'zod';
import mongoose, { Schema, Types, model } from 'mongoose';

// ===== Status enum =====

export const CreditStatusSchema = z.enum([
  'issued',
  'redeemed',
  'expired',
  'refunded',
]);
export type CreditStatus = z.infer<typeof CreditStatusSchema>;

export const CreditSourceTypeSchema = z.enum([
  'bundle_5',
  'bundle_10',
  'single', // the $4.99 single — modeled as 1-credit bundle for uniformity
  'promo', // ops-issued comp credit
  'first_free', // the Layer-2 first-paid-unlock-free credit (per Issue #105)
]);
export type CreditSourceType = z.infer<typeof CreditSourceTypeSchema>;

// ===== ObjectId Zod validator =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or 24-char hex string' }
);

// ===== Payload schema =====

export const DealCreditSchema = z.object({
  userId: ObjectIdSchema,

  /** Stable UUID grouping credits from the same purchase. */
  bundlePurchaseId: z.string().min(1),

  sourceType: CreditSourceTypeSchema,
  /**
   * Stripe payment intent. Missing only for `promo` and `first_free`
   * which have no charge.
   */
  stripePaymentIntentId: z.string().optional(),

  /**
   * What the USER paid for this single credit (cents). 0 for promo
   * + first_free; 999 for a 10-pack credit ($34.99 / 10 ≈ $3.50);
   * 499 for a single. We store the per-credit slice for accounting
   * symmetry with DealLicense.pricePaidCents.
   */
  pricePaidCents: z.number().int().nonnegative(),

  issuedAt: z.date(),
  /** 365 days from issuedAt unless the source defines a different TTL. */
  expiresAt: z.date(),

  status: CreditStatusSchema,
  redeemedAt: z.date().optional(),
  redeemedAsLicenseId: ObjectIdSchema.optional(),

  expiredAt: z.date().optional(),
  refundedAt: z.date().optional(),
});

export type DealCreditPayload = z.infer<typeof DealCreditSchema>;

// ===== Mongoose schema =====

const dealCreditSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    bundlePurchaseId: { type: String, required: true, index: true },

    sourceType: {
      type: String,
      required: true,
      enum: ['bundle_5', 'bundle_10', 'single', 'promo', 'first_free'],
    },
    stripePaymentIntentId: { type: String },
    pricePaidCents: { type: Number, required: true, default: 0 },

    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },

    status: {
      type: String,
      required: true,
      enum: ['issued', 'redeemed', 'expired', 'refunded'],
      default: 'issued',
      index: true,
    },
    redeemedAt: { type: Date },
    redeemedAsLicenseId: {
      type: Schema.Types.ObjectId,
      ref: 'DealLicense',
    },

    expiredAt: { type: Date },
    refundedAt: { type: Date },
  },
  {
    collection: 'deal_credits',
    timestamps: true,
    strict: 'throw',
  }
);

// ===== Indexes =====

// "How many credits does this user have left?" — most common query
// on the /account page and at chat-time when deciding whether to
// auto-redeem on a new analysis.
dealCreditSchema.index({ userId: 1, status: 1 });

// "Show me all credits from this purchase" — receipt + refund.
dealCreditSchema.index({ bundlePurchaseId: 1 });

// Daily expiry sweeper.
dealCreditSchema.index({ status: 1, expiresAt: 1 });

// ===== Helpers =====

/** Default 365-day credit TTL. */
export function computeCreditExpiry(
  issuedAt: Date,
  windowDays = 365
): Date {
  return new Date(issuedAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
}

/** Map sourceType → number of credits the bundle issues. */
export function creditsPerBundle(sourceType: CreditSourceType): number {
  switch (sourceType) {
    case 'bundle_10':
      return 10;
    case 'bundle_5':
      return 5;
    case 'single':
    case 'promo':
    case 'first_free':
      return 1;
  }
}

// ===== Model =====

export const DealCreditModel = model('DealCredit', dealCreditSchema);
