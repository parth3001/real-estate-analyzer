/**
 * OverrideEvent — fourth wave-1 event type (W1-S2 part 4).
 *
 * **The highest-signal event type for the substrate moat** (per thesis §2.3).
 * Captures user disagreement with the engine: when an investor or
 * underwriter looks at the engine's assumptions and says "no, the
 * vacancy rate should be 8%, not 5%," that disagreement is the most
 * valuable training data the platform produces.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.4.
 *
 * Why this event type matters more than any other:
 *   - Tells us what the engine is wrong about (override patterns aggregate
 *     to calibration drift signals)
 *   - Tells us what underwriters with deep market knowledge actually do
 *   - Cannot be backfilled by competitors — requires 18+ months of real
 *     user override behavior on real deals
 *   - Tagged with persona context (via priorDecision → userContext lookup)
 *     so we can see HOW different investor types disagree with the engine
 *
 * DELIBERATE OMISSION (consistent with DecisionEvent): no `priorVerdict`
 * or `newVerdict` fields. The events store §3.4 spec mentioned these as
 * legacy fields — they conflict with the deterministic-scoring
 * non-negotiable (architecture §1.5). Instead this event captures:
 *   - `priorDealQuality` (the score before override)
 *   - `newDealQuality` (optional — the score after re-analysis, when complete)
 *   - `dealQualityDelta` (optional — convenience for aggregation queries)
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const InputMethodSchema = z.enum(['inline_chat', 'structured_modal']);
export type InputMethod = z.infer<typeof InputMethodSchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

/**
 * Override values are primitive — number / string / boolean. Wave 1 does not
 * support overriding nested objects directly (e.g., overriding the whole
 * `institutionContext`). Object-level overrides would be modeled as multiple
 * OverrideEvents on the leaf fields.
 */
const OverrideValueSchema = z.union([z.number(), z.string(), z.boolean()]);
export type OverrideValue = z.infer<typeof OverrideValueSchema>;

// ===== Zod payload schema =====

/**
 * OverridePayloadSchema — runtime validation for OverrideEvent payload.
 *
 * Repository layer (W1-S3) calls `.parse()` before write. Some validation
 * is intentionally NOT enforced here and is the application layer's job:
 *   - `originalValue` and `newValue` having the SAME primitive type
 *     (number → number; not number → string). Repository can check.
 *   - `originalValue !== newValue` (no-op override). Repository can check;
 *     events store accepts no-op overrides for explicitness.
 */
export const OverridePayloadSchema = z.object({
  // What decision is being overridden
  originalDecisionId: ObjectIdSchema,

  // What field — uses dot-path notation (e.g., 'assumptions.vacancyRate',
  // 'propertyData.monthlyRent'). Free-form string; application layer
  // validates against known overridable paths.
  fieldPath: z.string().min(1),

  // The values being changed
  originalValue: OverrideValueSchema,
  newValue: OverrideValueSchema,

  // Capture path — UI surface that produced the override
  inputMethod: InputMethodSchema,

  // Optional justification (free-form text); required by the structured
  // modal path's UI, but enforcement is at the application layer
  justification: z.string().optional(),

  // Resulting re-analysis IDs (populated when re-analysis completes)
  resultingAnalysisEventId: ObjectIdSchema.optional(),
  resultingDecisionEventId: ObjectIdSchema.optional(),

  // Score context — what was before, what's after
  priorDealQuality: z.number().min(0).max(100),
  newDealQuality: z.number().min(0).max(100).optional(),

  // Convenience field — populated by application layer when both quality
  // scores are known. Useful for aggregate queries:
  // "show me overrides where the score moved by >10 points"
  dealQualityDelta: z.number().optional(),
});

// ===== TypeScript interface (deep-typed) =====

/**
 * OverridePayload — TypeScript type for OverrideEvent payload.
 *
 * Most fields are primitive-typed and z.infer would produce the same
 * type. Declaring explicitly for symmetry with other event types and
 * for documentation purposes.
 */
export interface OverridePayload {
  /** The DecisionEvent this override targets. */
  originalDecisionId: Types.ObjectId;

  /** Dot-path of the overridden field. */
  fieldPath: string;

  /** Original value (before override). */
  originalValue: OverrideValue;

  /** New value the user wants. */
  newValue: OverrideValue;

  /** How the override was captured. */
  inputMethod: InputMethod;

  /** Optional reasoning. UI may require this for structured-modal path. */
  justification?: string;

  /** New AnalysisEvent created by re-analysis (populated when complete). */
  resultingAnalysisEventId?: Types.ObjectId;

  /** New DecisionEvent created by re-scoring (populated when complete). */
  resultingDecisionEventId?: Types.ObjectId;

  /** Deal Quality Score before the override (0-100). */
  priorDealQuality: number;

  /**
   * Deal Quality Score after re-analysis with the override applied (0-100).
   * Optional — populated when the resulting re-analysis completes.
   */
  newDealQuality?: number;

  /**
   * Convenience: newDealQuality - priorDealQuality.
   * Populated by application layer when both are known.
   */
  dealQualityDelta?: number;
}

// ===== Mongoose discriminator =====

const overrideEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * OverrideEventModel — Mongoose model for OverrideEvents.
 *
 * Registered as discriminator on BaseEventModel with `eventType: 'override'`.
 * Stored in unified `events` collection. Append-only enforcement inherits.
 */
export const OverrideEventModel = BaseEventModel.discriminator(
  'override',
  overrideEventSchema
);
