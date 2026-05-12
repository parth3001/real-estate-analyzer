/**
 * CritiqueEvent — fifth wave-1 event type (W1-S2 part 5).
 *
 * Captures output from the adversarial critic agent (W5). Two synthetic
 * personas — optimistic_flipper + skeptical_cpa — stress-test the
 * deal-scoring agent's decisions and produce structured disagreement.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.5 (with shape correction —
 * agent mesh §4.3 has the cleaner spec).
 *
 * Architectural role:
 *   - Auto-invoked on every BUY-band decision (dealQuality ≥ 80) — sanity
 *     check before user sees a strong recommendation
 *   - Manual invocation: user requests "have a critic look at this"
 *   - Batched runs: periodic offline pass over recent decisions for
 *     substrate seeding
 *   - Feeds the 4-week kill criterion eval (per evals doc §5)
 *
 * DELIBERATE OMISSION (consistent with architecture §1.5): NO `criticVerdict`
 * field. The events store §3.5 spec mentioned it as a legacy field.
 * The adversarial critic produces STRUCTURED disagreement (severityScore +
 * divergenceReasons + alternativeAssumptions) — not a categorical verdict.
 * The dealQuality score is the engine's deterministic output; the critic
 * disagrees ABOUT that score, doesn't produce its own categorical one.
 *
 * Cost discipline:
 *   - Opus 4.7 is expensive (~$0.05-0.15 per critique)
 *   - tokenCost field tracks per-invocation cost
 *   - triggerType field enables cost analysis per invocation path
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const CriticPersonaSchema = z.enum(['optimistic_flipper', 'skeptical_cpa']);
export type CriticPersona = z.infer<typeof CriticPersonaSchema>;

const TriggerTypeSchema = z.enum([
  'auto_buy_band', // Auto-invoked because deal-scoring returned BUY-band (≥80)
  'manual_request', // User explicitly asked for critique
  'batch_seeding', // Periodic offline batch run for substrate seeding
]);
export type TriggerType = z.infer<typeof TriggerTypeSchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

/**
 * Alternative assumption value — primitive only (consistent with
 * OverrideEvent.OverrideValue). Wave 1 doesn't support nested-object
 * suggestions; the critic suggests leaf-field values.
 */
const SuggestedValueSchema = z.union([z.number(), z.string(), z.boolean()]);

/**
 * AlternativeAssumption — one suggested change from the critic to the
 * engine's input. The critic isn't required to suggest alternatives;
 * a critic that disagrees without proposing fixes (e.g., "the deal
 * fundamentally doesn't work") is valid.
 */
const AlternativeAssumptionSchema = z.object({
  fieldPath: z.string().min(1),
  suggestedValue: SuggestedValueSchema,
  reasoning: z.string().min(1),
});

// ===== Zod payload schema =====

/**
 * CritiquePayloadSchema — runtime validation for CritiqueEvent payload.
 *
 * Schema enforces structured disagreement (no free-form verdict);
 * application layer (the critic agent in W5) constructs payloads
 * matching this shape before write.
 */
export const CritiquePayloadSchema = z.object({
  // What decision is being critiqued
  originalDecisionId: ObjectIdSchema,

  // Which persona produced the critique
  criticPersona: CriticPersonaSchema,

  // The structured disagreement
  agreementWithOriginal: z.boolean(),
  divergenceReasons: z.array(z.string().min(1)),
  alternativeAssumptions: z.array(AlternativeAssumptionSchema),

  /**
   * How strongly the persona disagrees (0-100). 0 = trivial disagreement
   * (essentially agrees but quibbles). 100 = fundamental disagreement
   * (would not have made this verdict at all). Used for kill-criterion
   * meta-eval and for ranking critique severity in the UI.
   */
  severityScore: z.number().min(0).max(100),

  // Why this critique was triggered
  triggerType: TriggerTypeSchema,

  // Cost observability
  modelUsed: z.string().min(1),
  tokenCost: z.number().nonnegative(),
});

// ===== TypeScript interface =====

/**
 * CritiquePayload — TypeScript type for CritiqueEvent payload.
 * Primitive-heavy; z.infer-equivalent type with explicit declaration
 * for symmetry with other event types.
 */
export interface CritiquePayload {
  /** The DecisionEvent being critiqued. */
  originalDecisionId: Types.ObjectId;

  /** Which adversarial persona produced this critique. */
  criticPersona: CriticPersona;

  /**
   * Does the critic agree with the engine's verdict (high-level outcome,
   * not the exact score)? `true` = critic broadly accepts the decision
   * even if minor disagreements exist. `false` = critic fundamentally
   * disagrees with the engine's call.
   */
  agreementWithOriginal: boolean;

  /** Specific points where the critic diverges from the engine. */
  divergenceReasons: string[];

  /** Specific input changes the critic suggests would change the outcome. */
  alternativeAssumptions: Array<{
    fieldPath: string;
    suggestedValue: number | string | boolean;
    reasoning: string;
  }>;

  /** Strength of disagreement (0-100). Feeds kill-criterion eval. */
  severityScore: number;

  /** Why this critique was run. */
  triggerType: TriggerType;

  /** Anthropic model identifier (e.g., 'claude-opus-4-7'). */
  modelUsed: string;

  /** Cost of this critique invocation (US dollars, e.g., 0.082). */
  tokenCost: number;
}

// ===== Mongoose discriminator =====

const critiqueEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * CritiqueEventModel — Mongoose model for CritiqueEvents.
 *
 * Registered as discriminator on BaseEventModel with `eventType: 'critique'`.
 * Stored in unified `events` collection. Append-only enforcement inherits.
 */
export const CritiqueEventModel = BaseEventModel.discriminator(
  'critique',
  critiqueEventSchema
);
