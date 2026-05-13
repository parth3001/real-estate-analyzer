/**
 * tool:apply_override — W4-S2.
 *
 * Captures a single-field override on a previous DecisionEvent and
 * re-runs scoring. Emits THREE events, in order:
 *
 *   1. new AnalysisEvent  (via score_deal — modified inputs snapshot)
 *   2. new DecisionEvent  (via score_deal — new dealQuality)
 *   3. OverrideEvent       (this tool — links 1+2 back to the original
 *                           decision and carries the calibration-drift
 *                           signal: fieldPath + dealQualityDelta)
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 (apply_override row) and
 * /docs/PRODUCT_2.0_EVENTS_STORE.md §3.4 (OverrideEvent shape).
 *
 * WHY THIS TOOL EXISTS
 * --------------------
 *
 * Overrides are the calibration-drift signal that makes the engine
 * better over time (architecture §1.5). The OverrideEvent's
 * `fieldPath` + `dealQualityDelta` answer two questions:
 *   - Which assumptions do users overwrite most often? → tuning targets
 *   - When they do, does the score actually move? → assumption salience
 *
 * The substrate read `getOverrideFrequencyByField` (W1-S4) aggregates
 * these. Without `apply_override` writing OverrideEvents on every
 * override action, the calibration signal is silent.
 *
 * THE LEAN BOUNDARY
 * -----------------
 *
 * apply_override does NOT recompute the analysis from raw propertyData.
 * The caller (orchestrator / wizard backend) is responsible for:
 *   1. Loading the original AnalysisEvent's snapshot
 *   2. Applying the override to the relevant input (propertyData /
 *      assumptions / userContext)
 *   3. Re-running compute_analysis (or the legacy SFRAnalyzer path)
 *      to produce the new analysisResult
 *   4. Calling apply_override with the modified inputs
 *
 * This keeps apply_override focused on substrate semantics
 * (event linkage + delta computation) rather than re-implementing
 * compute_analysis. The compute_analysis tool ships separately;
 * until then, the legacy controller path supplies the analysisResult.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';
import { scoreDeal, ScoreDealInputSchema } from './score_deal';
import { DecisionEventModel } from '../../models/events/DecisionEvent';
import type { DecisionEventDocument } from '../../repositories/EventsRepositoryReads';

// ===== Input schema =====

const ObjectShape = z.custom<Record<string, unknown>>(
  (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
  { message: 'Expected a non-null object' }
);

const OverrideValueSchema = z.union([z.number(), z.string(), z.boolean()]);
const InputMethodSchema = z.enum(['inline_chat', 'structured_modal']);

/**
 * apply_override input — the override metadata + the re-score inputs.
 *
 * Re-score inputs intentionally mirror score_deal's input. The caller
 * has already applied the override to these inputs; apply_override
 * just persists the substrate + computes the delta.
 */
export const ApplyOverrideInputSchema = z.object({
  // ===== Override metadata =====

  /** The decision being overridden. */
  originalDecisionId: z.union([z.instanceof(Types.ObjectId), z.string()]),

  /**
   * Dot-path of the overridden field. Free-form string at this layer;
   * application-level whitelist of "known overridable paths" is enforced
   * by the orchestrator before calling this tool.
   */
  fieldPath: z.string().min(1),

  /** Value before the override (for substrate audit). */
  originalValue: OverrideValueSchema,

  /** Value the user set. */
  newValue: OverrideValueSchema,

  /** UI surface that produced the override. */
  inputMethod: InputMethodSchema,

  /** Optional free-text reasoning. Structured-modal path's UI may require this. */
  justification: z.string().optional(),

  // ===== Re-score inputs (caller has already applied the override) =====

  propertyData: ObjectShape,
  analysisResult: z.object({
    metrics: ObjectShape,
    monthlyAnalysis: ObjectShape,
    longTermAnalysis: ObjectShape,
  }),
  marketData: ObjectShape.optional(),
  assumptions: ObjectShape.optional(),
  userContext: ScoreDealInputSchema.shape.userContext,
  walkAwayPrice: z.number().finite().optional(),
  dealId: z.union([z.instanceof(Types.ObjectId), z.string()]).optional(),
  enrichmentSource: ScoreDealInputSchema.shape.enrichmentSource,
  enrichmentCacheHit: z.boolean().optional(),
  marketIntelligence: z.unknown().optional(),
  predictions: z.unknown().optional(),
});

export type ApplyOverrideInput = z.infer<typeof ApplyOverrideInputSchema>;

// ===== Output schema =====

export const ApplyOverrideOutputSchema = z.object({
  /** The OverrideEvent _id (this tool's own emission). */
  overrideEventId: z.custom<Types.ObjectId>((v) => v instanceof Types.ObjectId),

  /** The new AnalysisEvent _id (written by score_deal). */
  newAnalysisEventId: z.custom<Types.ObjectId>((v) => v instanceof Types.ObjectId),

  /** The new DecisionEvent _id (written by score_deal). */
  newDecisionEventId: z.custom<Types.ObjectId>((v) => v instanceof Types.ObjectId),

  /** Score on the original decision (before override). */
  priorDealQuality: z.number().min(0).max(100),

  /** Score on the new decision (after override + re-run). */
  newDealQuality: z.number().min(0).max(100),

  /** newDealQuality - priorDealQuality. Positive = override helped; negative = hurt. */
  dealQualityDelta: z.number(),
});

export type ApplyOverrideOutput = z.infer<typeof ApplyOverrideOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const applyOverride: Tool<ApplyOverrideInput, ApplyOverrideOutput> = {
  name: 'apply_override',
  description:
    'Records a single-field override on a previous decision and re-runs scoring. Emits new AnalysisEvent + new DecisionEvent (via score_deal) plus the OverrideEvent linking them back to the original decision and carrying the calibration-drift signal (fieldPath + dealQualityDelta).',
  inputSchema: ApplyOverrideInputSchema,
  outputSchema: ApplyOverrideOutputSchema,
  invokeLLM: false,
  sideEffects: [
    // score_deal writes the first two; apply_override writes the third.
    // Declared in the order they're emitted to substrate.
    { type: 'event', eventType: 'analysis' },
    { type: 'event', eventType: 'decision' },
    { type: 'event', eventType: 'override' },
  ],
  // No retry: three-write coupling. A partial emission scenario (e.g.,
  // score_deal succeeded but the OverrideEvent write failed) is detectable
  // by the caller (presence of newAnalysisEventId / newDecisionEventId in
  // substrate without a matching OverrideEvent) and can be reconciled by
  // a follow-up OverrideEvent write. Auto-retry would risk duplicate
  // analyses.
  retrySemantics: NO_RETRY,

  async execute(input: ApplyOverrideInput, ctx: ToolContext): Promise<ApplyOverrideOutput> {
    const validated = ApplyOverrideInputSchema.parse(input);
    const originalDecisionId = resolveObjectId(validated.originalDecisionId);

    // ===== 1. Load the original decision (need priorDealQuality) =====

    const originalDecision = await DecisionEventModel.findById(originalDecisionId)
      .lean<DecisionEventDocument | null>()
      .exec();
    if (!originalDecision) {
      throw new Error(
        `apply_override: original DecisionEvent not found: ${originalDecisionId.toHexString()}`
      );
    }
    const priorDealQuality = originalDecision.payload.dealQuality;

    // ===== 2. Re-score via score_deal — writes new AnalysisEvent + DecisionEvent =====

    const scoreOutput = await scoreDeal.execute(
      {
        propertyData: validated.propertyData,
        analysisResult: validated.analysisResult,
        marketData: validated.marketData,
        assumptions: validated.assumptions,
        userContext: validated.userContext,
        walkAwayPrice: validated.walkAwayPrice,
        dealId: validated.dealId,
        enrichmentSource: validated.enrichmentSource,
        enrichmentCacheHit: validated.enrichmentCacheHit,
        marketIntelligence: validated.marketIntelligence,
        predictions: validated.predictions,
      },
      ctx
    );

    const newDealQuality = scoreOutput.dealQuality;
    const dealQualityDelta = newDealQuality - priorDealQuality;

    // ===== 3. Write OverrideEvent linking everything =====

    // OverrideEvent.actorType = 'user' — the override is a user-driven
    // decision (orchestrated via chat / modal). score_deal tagged its
    // own events with 'tool:score_deal'; that's how substrate audits
    // distinguish "tool wrote this" from "user caused this."
    const overrideEventId = await ctx.eventsRepo.writeOverrideEvent({
      traceId: ctx.traceId,
      actorType: 'user',
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      payload: {
        originalDecisionId,
        fieldPath: validated.fieldPath,
        originalValue: validated.originalValue,
        newValue: validated.newValue,
        inputMethod: validated.inputMethod,
        justification: validated.justification,
        resultingAnalysisEventId: scoreOutput.analysisEventId,
        resultingDecisionEventId: scoreOutput.decisionEventId,
        priorDealQuality,
        newDealQuality,
        dealQualityDelta,
      },
    });

    return {
      overrideEventId,
      newAnalysisEventId: scoreOutput.analysisEventId,
      newDecisionEventId: scoreOutput.decisionEventId,
      priorDealQuality,
      newDealQuality,
      dealQualityDelta,
    };
  },
};
