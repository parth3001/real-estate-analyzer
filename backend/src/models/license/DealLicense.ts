/**
 * DealLicense — the unit of paid access in REanalyzr 2.0.
 *
 * Per the locked pricing decision in Issue #105:
 *   - One license = one property = one user = 30 days
 *   - $4.99 single OR consumed from a 5-/10-pack bundle
 *   - Covers ALL analytical actions on that property (overrides,
 *     stress tests, strategy switches, exports, etc.)
 *   - $2 COGS budget per license — the "per-license cap" Issue #106
 *     Phase B enforces by aggregating CostEvents tagged with licenseId
 *
 * KEY DESIGN: identity = (userId, canonicalPropertyAddressKey)
 * ------------------------------------------------------------
 *
 * Same user re-typing the same property in a slightly different way
 * MUST resolve to the same active license — otherwise we'd double-bill
 * the user for "123 Main St" and "123 main street". The
 * canonicalAddressKey helper produces a stable key for the (street,
 * city, state, zip) tuple. The unique compound index on
 * (userId, canonicalPropertyAddressKey, status='active') is the
 * single source of truth for "do I already have an active license on
 * this property?"
 *
 * Status state machine:
 *   active     → license is live; user can run any analysis
 *   expired    → 30 days elapsed OR cost-budget exhausted; read-only
 *   refunded   → Stripe refund processed; license void
 *
 * Transitions are write-once. We don't mutate `active → expired`
 * mid-document via updateOne — we emit a separate `LicenseEvent`
 * (future) and mark the document. For now (Phase B substrate),
 * status flips via `markExpired()` and `markRefunded()` which DO
 * mutate. That's a deliberate compromise: payments mutate state. We
 * keep the audit trail via timestamps (`expiredAt`, `refundedAt`).
 *
 * EVENT vs OPERATIONAL collection — same dilemma as CostEvent
 * -----------------------------------------------------------
 *
 * DealLicense lives in its OWN collection (`deal_licenses`), NOT the
 * substrate event store. Reasons match the CostEvent rationale
 * (different access patterns, retention, scaling), plus one more
 * specific to licenses: a license MUTATES (active → expired/refunded).
 * Substrate events are append-only. Mixing the two would either pollute
 * substrate with mutations or force licenses into a tortured emit-only
 * shape.
 *
 * Per Issue #105 spec (locked 2026-05-17).
 */

import { z } from 'zod';
import mongoose, { Schema, Types, model } from 'mongoose';

// ===== Status enum =====

export const LicenseStatusSchema = z.enum(['active', 'expired', 'refunded']);
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

// ===== ObjectId Zod validator =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or 24-char hex string' }
);

// ===== Address sub-schema =====

const AddressSchemaZ = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().optional(),
});

// ===== Payload schema =====

/**
 * The 30-day license window is computed at create-time from
 * `purchasedAt + 30 days`. We store both endpoints explicitly so
 * read queries don't have to compute the expiry on the fly.
 *
 * `costBudgetCentsStart` is the snapshot of the COGS budget at
 * purchase time. The CURRENT remaining budget is computed from
 * CostEvents aggregated by licenseId — not stored on the license
 * itself (would race with concurrent CostEvent writes). Lives here
 * only for ops visibility ("which licenses launched with the
 * non-default budget?").
 */
export const DealLicenseSchema = z.object({
  userId: ObjectIdSchema,
  /** Canonical key from canonicalAddressKey.buildCanonicalAddressKey(). */
  canonicalPropertyAddressKey: z.string().min(1),
  /** Raw address kept for display + receipts. */
  propertyAddress: AddressSchemaZ,

  /** Unix timestamps as Date objects. */
  purchasedAt: z.date(),
  expiresAt: z.date(),

  /** COGS budget snapshot at purchase. Defaults to 200¢ = $2.00. */
  costBudgetCentsStart: z.number().int().nonnegative(),

  /** What the user paid in cents. 0 for the first-free Layer-2 unlock. */
  pricePaidCents: z.number().int().nonnegative(),

  /**
   * Stripe correlation. Optional only for the first-free unlock
   * (which has no Stripe charge). Mandatory for every paid path.
   */
  stripePaymentIntentId: z.string().optional(),

  /**
   * If this license was redeemed from a bundle (DealCredit), the
   * source credit ID. NULL for direct $4.99 purchases and first-free.
   */
  redeemedFromCreditId: ObjectIdSchema.optional(),

  status: LicenseStatusSchema,
  /** When status flipped to 'expired'. NULL while active. */
  expiredAt: z.date().optional(),
  /** When status flipped to 'refunded'. NULL unless refunded. */
  refundedAt: z.date().optional(),
});

export type DealLicensePayload = z.infer<typeof DealLicenseSchema>;

// ===== Mongoose schema =====

const addressSubSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: false },
  },
  { _id: false }
);

const dealLicenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    canonicalPropertyAddressKey: {
      type: String,
      required: true,
    },
    propertyAddress: { type: addressSubSchema, required: true },

    purchasedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },

    costBudgetCentsStart: { type: Number, required: true, default: 200 },
    pricePaidCents: { type: Number, required: true, default: 0 },

    stripePaymentIntentId: { type: String },
    redeemedFromCreditId: {
      type: Schema.Types.ObjectId,
      ref: 'DealCredit',
    },

    status: {
      type: String,
      required: true,
      enum: ['active', 'expired', 'refunded'],
      default: 'active',
      index: true,
    },
    expiredAt: { type: Date },
    refundedAt: { type: Date },
  },
  {
    collection: 'deal_licenses',
    timestamps: true,
    strict: 'throw',
  }
);

// ===== Indexes =====
//
// THE critical compound: "does this user have an active license on
// this property?" — used on every chat turn that runs an analytical
// action. Unique on (userId, canonicalKey, status) ensures we never
// have two `active` licenses for the same property by the same user.
// Other statuses CAN exist (a user can have an expired + a new active
// license on the same property after their first license ran out).
//
// `partialFilterExpression: { status: 'active' }` keeps the unique
// constraint scoped to active rows so historical expired/refunded
// rows don't block a fresh purchase.
dealLicenseSchema.index(
  { userId: 1, canonicalPropertyAddressKey: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// "Find all licenses for this user, sorted by purchase date" —
// powers the /account licenses table.
dealLicenseSchema.index({ userId: 1, purchasedAt: -1 });

// "Find licenses expiring soon" — for the daily expiry sweeper job.
dealLicenseSchema.index({ status: 1, expiresAt: 1 });

// Stripe-correlation lookup for webhook idempotency.
dealLicenseSchema.index(
  { stripePaymentIntentId: 1 },
  { unique: true, sparse: true }
);

// ===== Helpers =====

/** Compute the 30-day expiry from a purchase date. */
export function computeExpiry(
  purchasedAt: Date,
  windowDays = 30
): Date {
  const ms = purchasedAt.getTime() + windowDays * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

// ===== Model =====

export const DealLicenseModel = model('DealLicense', dealLicenseSchema);
