/**
 * CostEvent — operational collection for per-call cost tracking (W9-S1).
 *
 * Per /docs/PRODUCT_2.0_COSTS.md §7.4.
 *
 * IMPORTANT: CostEvent is NOT a substrate event. It lives in a separate
 * collection (`cost_events`) with a separate lifecycle:
 *
 *   - Substrate events are permanent (events store §0). Used for moat
 *     calibration, audits, and product analytics.
 *   - CostEvents are operational. Rolled up quarterly; can be archived
 *     after 90 days. Used for ops dashboards, anomaly detection, and
 *     unit-economics tracking.
 *
 * Why separate at all (rather than just adding a costType to the event
 * taxonomy)?
 *
 *   1. Different access patterns: cost is an ops/finance query; substrate
 *      is a product/calibration query. Mixing them noises both surfaces.
 *   2. Different retention: substrate never deletes; cost rolls up.
 *   3. Different scaling profile: cost emits N times per query (once per
 *      LLM call), substrate emits ~3 (analysis + decision + conversation).
 *      Separation lets us index for the access pattern that matters.
 *
 * Append-only at the schema layer for the same reason substrate is:
 * billing data that "changes" silently is unauditable. Re-corrections
 * are emitted as new events with a compensating costCents, not by
 * mutating the original.
 */

import { z } from 'zod';
import mongoose, { Schema, Types, model } from 'mongoose';

export const COST_EVENT_APPEND_ONLY_ERROR =
  'CostEvent is append-only — update/delete operations are not permitted.';

// ===== Enum-like type definitions =====

const CostTypeSchema = z.enum(['llm', 'external_api']);
export type CostType = z.infer<typeof CostTypeSchema>;

const ProviderSchema = z.enum([
  'anthropic',
  'openai',
  'rentcast',
  'fred',
  'voyage',
]);
export type CostProvider = z.infer<typeof ProviderSchema>;

// ===== ObjectId Zod validator =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or 24-char hex string' }
);

// ===== Zod schema (runtime validation) =====

/**
 * CostEventSchema — runtime validation for CostEvent payload.
 *
 * The repository layer calls .parse() before writing.
 *
 * Token-count fields are optional because external_api costs (RentCast,
 * FRED, Census) don't have token semantics — only LLM calls do.
 *
 * `costCents` is a non-negative number (decimal allowed — Haiku calls
 * cost fractions of a cent). Stored in cents (not dollars) to keep
 * aggregate sums safe from float drift over millions of events.
 */
export const CostEventSchema = z.object({
  traceId: z.string().min(1),
  /**
   * Session identifier (Issue #106 Phase A). One sessionId can span many
   * traceIds (one per turn). Optional only because pre-#106 events
   * predate the field; new writes from the orchestrator + agent runner
   * always supply it. Indexed for the per-session cap query.
   */
  sessionId: z.string().min(1).optional(),
  /**
   * License identifier (Issue #106 Phase B + Issue #105 substrate).
   * Set when the chat surface has resolved the user's active
   * DealLicense for the property being analyzed in this trace. Lets
   * the per-license $2 COGS cap aggregate spend across all turns
   * spent on the same property. Optional: free-tier turns (no license
   * yet purchased) have no licenseId.
   */
  licenseId: ObjectIdSchema.optional(),
  userId: ObjectIdSchema,
  institutionId: ObjectIdSchema.optional(),

  costType: CostTypeSchema,
  provider: ProviderSchema,

  /** Provider-specific model identifier. Required for LLM costs. */
  model: z.string().min(1).optional(),

  /** Token counts — required for LLM costs, omitted for external_api. */
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  cachedTokens: z.number().int().nonnegative().optional(),

  /** Cost in cents (not dollars). Decimal allowed. See file header. */
  costCents: z.number().nonnegative().finite(),

  /** True if this call's cost contributed to a cap hit. */
  capHit: z.boolean().optional(),
});

export type CostEventPayload = z.infer<typeof CostEventSchema>;

// ===== Mongoose schema =====

const costEventSchema = new Schema(
  {
    traceId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    licenseId: {
      type: Schema.Types.ObjectId,
      ref: 'DealLicense',
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    costType: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: String,
    inputTokens: Number,
    outputTokens: Number,
    cachedTokens: Number,
    costCents: {
      type: Number,
      required: true,
      min: 0,
    },
    capHit: Boolean,
  },
  {
    collection: 'cost_events',
    timestamps: { createdAt: 'timestamp', updatedAt: false },
    strict: 'throw',
  }
);

// ===== Append-only enforcement at the schema layer =====

function throwAppendOnly(): never {
  throw new Error(COST_EVENT_APPEND_ONLY_ERROR);
}

costEventSchema.pre('updateOne', throwAppendOnly);
costEventSchema.pre('updateMany', throwAppendOnly);
costEventSchema.pre('findOneAndUpdate', throwAppendOnly);
costEventSchema.pre('findOneAndReplace', throwAppendOnly);
costEventSchema.pre('replaceOne', throwAppendOnly);
costEventSchema.pre('deleteOne', throwAppendOnly);
costEventSchema.pre('deleteMany', throwAppendOnly);
costEventSchema.pre('findOneAndDelete', throwAppendOnly);

costEventSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error(COST_EVENT_APPEND_ONLY_ERROR));
  }
  next();
});

// ===== Indexes (cost-dashboard access patterns) =====

// "Per-user current month cost vs cap" — most common ops query.
costEventSchema.index({ userId: 1, timestamp: -1 });

// "All cost events for one trace" — debug + per-query cost breakdown.
costEventSchema.index({ traceId: 1, timestamp: 1 });

// "Per-session cumulative spend" — Issue #106 Phase A session cap.
// Sparse so we don't index pre-#106 documents (no sessionId).
costEventSchema.index({ sessionId: 1, timestamp: 1 }, { sparse: true });

// "Per-license cumulative spend" — Issue #106 Phase B per-license cap.
// Sparse: only events emitted while the user had an active license
// are indexed.
costEventSchema.index({ licenseId: 1, timestamp: 1 }, { sparse: true });

// "Per-provider per-day spend" — finance/ops rollup.
costEventSchema.index({ provider: 1, timestamp: -1 });

// "Cap-hit incidents" — anomaly detection. Sparse: only events with
// capHit: true are indexed, keeping the index small.
costEventSchema.index({ capHit: 1, timestamp: -1 }, { sparse: true });

// ===== Model =====

export const CostEventModel = model('CostEvent', costEventSchema);
