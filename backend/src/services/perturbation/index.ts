/**
 * Public entry point — wires Layer 2 (extract) → Layer 3 (run) → Layer 4
 * (narrate) into a single deterministic stress-test service call.
 *
 * Task #16, Path B. The chat orchestrator routes `override_assumption`
 * intent here. This is the ONLY function the orchestrator needs to call
 * — everything else is internal.
 *
 * Flow:
 *   1. extractPerturbations(userMessage)       → Layer 2 (LLM-bounded)
 *   2. resolve user's most recent decisionId   → substrate lookup
 *   3. runStressTest({decisionId, perturbations}) → Layer 3 (deterministic, no LLM)
 *   4. composeNarrative(result, userMessage)   → Layer 4 (LLM-bounded prose)
 *
 * What's deterministic vs LLM-bounded
 * -----------------------------------
 *   Step 1 (extract):  LLM-bounded. Output Zod-validated; cannot return
 *                      malformed shapes or hallucinate field names.
 *   Step 2 (resolve):  Deterministic database lookup. No LLM.
 *   Step 3 (run):      Deterministic engine + analyzer. No LLM.
 *                      Numbers come from SFRAnalyzer + InvestmentDecisionEngine.
 *   Step 4 (narrate):  LLM-bounded. The LLM sees ONLY the structured
 *                      StressTestResult — every number it cites is
 *                      traceable to a deterministic source.
 *
 * The original 81/100 bug is structurally impossible at every step.
 */

import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import type { AnthropicAdapter } from '../../agents/llm/anthropicAdapter';
import { eventsRepository } from '../../repositories/EventsRepository';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import { logger } from '../../utils/logger';
import { extractPerturbations } from './extractor';
import {
  runStressTest,
  applyPerturbations,
  buildEngineUserContext,
  StressTestNotFoundError,
  StressTestForbiddenError,
  StressTestIncompleteError,
  StressTestUnsupportedError,
} from './runner';
import { composeNarrative } from './narrativeComposer';
import type { PerturbationSpec, StressTestResult } from './schemas';
import { scoreDeal } from '../../agents/tools/score_deal';
import type { ToolContext } from '../../agents/tools/types';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

// Re-export the typed errors so the chat orchestrator can branch on them.
export {
  StressTestNotFoundError,
  StressTestForbiddenError,
  StressTestIncompleteError,
  StressTestUnsupportedError,
};

// Re-export schemas + types for any caller that wants them.
export type { StressTestResult, PerturbationSpec } from './schemas';
export {
  PerturbationSpecSchema,
  StressTestRequestSchema,
} from './schemas';

// ===== Service-call types =====

export interface HandleStressTestInput {
  /** The user's free-form stress-test request. */
  userMessage: string;
  /** Authenticated user. */
  userId: string;
  /**
   * Adapter for the two LLM-bounded calls (Layer 2 + Layer 4).
   * Injected so tests can substitute a deterministic fake.
   */
  adapter: AnthropicAdapter;
}

/** Discriminated-union result so the chat orchestrator can render cleanly. */
export type HandleStressTestOutput =
  | {
      kind: 'success';
      /** The structured result Layer 3 produced. */
      result: StressTestResult;
      /** Natural-language response from Layer 4. */
      narrative: string;
      /** Per-layer token usage (for cost tracking). */
      usage: {
        extractionTokens: number;
        narrativeTokens: number;
      };
      /** The decisionEventId the stress test was anchored on (for traceability). */
      priorDecisionId: string;
    }
  | {
      kind: 'no_prior_decision';
      /** Layer 4 narrates this for the user. */
      reason: string;
    }
  | {
      kind: 'extraction_failed';
      /** Layer 2's reasoning (why it couldn't extract). */
      reason: string;
    }
  | {
      kind: 'unsupported_property_type';
      /** Layer 3 said "MF not supported yet" etc. */
      reason: string;
    };

// ===== Internal helpers =====

/**
 * Find the user's most recent DecisionEvent. The stress test will be
 * anchored on this — perturbations apply on top of its frozen
 * AnalysisEvent payload.
 *
 * Returns null if the user has never scored a deal. The chat
 * orchestrator surfaces a guidance message in that case ("analyze a
 * property first, then I can stress-test it").
 */
async function resolveLatestDecisionId(
  userId: string
): Promise<Types.ObjectId | null> {
  const userObjectId = new Types.ObjectId(userId);
  // 1 recent decision is enough — the most recent is the anchor.
  const recent = await eventsRepositoryReads.getRecentDecisionsForUser(
    userObjectId,
    1
  );
  if (recent.length === 0) return null;
  return recent[0]._id as Types.ObjectId;
}

// ===== Public API =====

/**
 * Handle an `override_assumption` (stress-test) chat turn end to end.
 * Returns a discriminated-union output the chat orchestrator can render.
 *
 * Errors thrown:
 *   - Adapter or substrate failures (unexpected runtime issues) bubble up.
 *
 * Non-error outcomes (returned as discriminated kinds):
 *   - 'no_prior_decision'        — user hasn't scored a deal yet
 *   - 'extraction_failed'        — Layer 2 couldn't parse a perturbation
 *   - 'unsupported_property_type' — MF not yet supported
 *   - 'success'                  — full path completed
 */
export async function handleStressTest(
  input: HandleStressTestInput
): Promise<HandleStressTestOutput> {
  // ===== Layer 2: extract typed perturbations =====
  const extraction = await extractPerturbations({
    userMessage: input.userMessage,
    adapter: input.adapter,
  });

  if (extraction.perturbations.length === 0) {
    logger.info('handleStressTest: extraction returned no perturbations', {
      userId: input.userId,
      reasoning: extraction.reasoning,
    });
    return { kind: 'extraction_failed', reason: extraction.reasoning };
  }

  // ===== Resolve the anchor decision =====
  const priorDecisionObjId = await resolveLatestDecisionId(input.userId);
  if (!priorDecisionObjId) {
    return {
      kind: 'no_prior_decision',
      reason:
        "I don't see any prior property analysis for you yet. " +
        'Analyze a property first, then I can stress-test it against ' +
        'different assumptions.',
    };
  }
  const priorDecisionId = priorDecisionObjId.toHexString();

  // ===== Layer 3: deterministic run =====
  let result: StressTestResult;
  try {
    result = await runStressTest({
      priorDecisionId,
      userId: input.userId,
      perturbations: extraction.perturbations,
    });
  } catch (err) {
    if (err instanceof StressTestUnsupportedError) {
      return { kind: 'unsupported_property_type', reason: err.message };
    }
    // NotFound / Forbidden / Incomplete: these shouldn't happen for the
    // user's own most-recent decision, but if they do, surface them as
    // typed errors to the orchestrator caller (not silently swallowed).
    throw err;
  }

  // ===== Layer 4: narrate =====
  const narrative = await composeNarrative({
    userMessage: input.userMessage,
    result,
    adapter: input.adapter,
  });

  logger.info('handleStressTest: success', {
    userId: input.userId,
    priorDecisionId,
    baselineScore: result.baseline.dealQuality,
    stressedScore: result.stressed.dealQuality,
    perturbationCount: extraction.perturbations.length,
    extractionTokens: extraction.usage.outputTokens,
    narrativeTokens: narrative.usage.outputTokens,
  });

  return {
    kind: 'success',
    result,
    narrative: narrative.text,
    usage: {
      extractionTokens: extraction.usage.outputTokens,
      narrativeTokens: narrative.usage.outputTokens,
    },
    priorDecisionId,
  };
}

// ===== Task #40: Save stress scenario as a real substrate decision =====

export interface PersistStressScenarioInput {
  /** The DecisionEvent the stress test was anchored on. */
  priorDecisionId: string;
  /** Authenticated user — must own the prior decision. */
  userId: string;
  /** Perturbations to apply; same shape extractPerturbations returns. */
  perturbations: PerturbationSpec[];
}

export interface PersistStressScenarioOutput {
  newDecisionEventId: string;
  newAnalysisEventId: string;
  dealQuality: number;
}

/**
 * Task #40 (2026-06-18) — persist a stress-test as a saved scenario.
 *
 * Pipeline mirrors runStressTest's input-prep stage, then hands the
 * stressed inputs to score_deal. score_deal runs the analyzer +
 * engine internally, writes AnalysisEvent + DecisionEvent, and the
 * dealMaterializationService hook materializes the Deal + fires
 * first_free auto-redeem (#14). The new scenario appears in the
 * workspace's scenario-comparison spine automatically — no separate
 * write path.
 *
 * Why not extend runStressTest with a `persist: true` flag: the
 * runner's scoreOnce is a thin engine call; score_deal does the
 * substrate writes + Deal materialization + critique fire-off. The
 * two paths have different responsibilities; keeping them separate
 * keeps each readable.
 *
 * Errors mirror runStressTest: NotFound / Forbidden / Incomplete /
 * Unsupported. The caller (HTTP controller) maps them to status codes.
 */
export async function persistStressScenario(
  input: PersistStressScenarioInput
): Promise<PersistStressScenarioOutput> {
  // 1. Load the anchor bundle (decision + analysis) — same as runner.
  let bundle;
  try {
    bundle = await eventsRepositoryReads.getScenarioBundle(
      new Types.ObjectId(input.priorDecisionId)
    );
  } catch (err) {
    logger.warn('persistStressScenario: getScenarioBundle threw', {
      priorDecisionId: input.priorDecisionId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new StressTestNotFoundError(input.priorDecisionId);
  }
  if (!bundle) throw new StressTestNotFoundError(input.priorDecisionId);

  // 2. Investor isolation.
  if (bundle.decision.userId?.toString() !== input.userId) {
    throw new StressTestForbiddenError();
  }
  if (!bundle.analysis) {
    throw new StressTestIncompleteError(input.priorDecisionId);
  }

  // 3. Extract prior inputs; SFR-only for now.
  const priorPropertyData = bundle.analysis.payload.propertyData as SFRData & {
    propertyType?: string;
  };
  if (priorPropertyData?.propertyType !== 'SFR') {
    throw new StressTestUnsupportedError(
      `Saving stress scenarios is only supported for single-family (SFR) deals today; ` +
        `this deal is ${priorPropertyData?.propertyType ?? 'unknown'}.`
    );
  }
  const priorAssumptions = (bundle.analysis.payload.assumptions ?? {}) as AnalysisAssumptions;
  const engineUserContext = buildEngineUserContext(
    priorPropertyData,
    (bundle.decision.payload as { userContext?: unknown })?.userContext
  );

  // 4. Clone + apply perturbations (same logic the runner uses for the
  // stressed snapshot — but here we KEEP the stressed inputs and feed
  // them to score_deal instead of a one-shot engine call).
  const stressedPropertyData = JSON.parse(JSON.stringify(priorPropertyData)) as SFRData;
  const stressedAssumptions = JSON.parse(JSON.stringify(priorAssumptions)) as AnalysisAssumptions;
  applyPerturbations(
    stressedPropertyData as unknown as Record<string, unknown>,
    stressedAssumptions as unknown as Record<string, unknown>,
    priorPropertyData as unknown as Record<string, unknown>,
    priorAssumptions as unknown as Record<string, unknown>,
    input.perturbations
  );

  // 5. Build the ToolContext score_deal expects, then invoke. score_deal
  // writes both substrate events, materializes the Deal, and fires the
  // auto-redeem / critique side effects. We deliberately omit
  // analysisResult so score_deal runs the analyzer internally per #51
  // (no LLM transit; no chance of stale numbers).
  const ctx: ToolContext = {
    traceId: randomUUID(),
    userId: new Types.ObjectId(input.userId),
    eventsRepo: eventsRepository,
    eventsReads: eventsRepositoryReads,
    tools: {},
  };

  const scoreOutput = await scoreDeal.execute(
    {
      propertyData: stressedPropertyData as unknown as Record<string, unknown>,
      propertyType: 'SFR',
      assumptions: stressedAssumptions as unknown as Record<string, unknown>,
      userContext: engineUserContext as unknown as Record<string, unknown>,
      // Pull market enrichment from the anchor analysis so the stressed
      // scenario inherits the same FRED / RentCast snapshot rather than
      // racing a fresh fetch. Engine version stays comparable.
      marketData: bundle.analysis.payload.marketData,
      walkAwayPrice: (bundle.analysis.payload as { walkAwayPrice?: number }).walkAwayPrice,
      enrichmentSource: bundle.analysis.payload.enrichmentSource,
      enrichmentCacheHit: bundle.analysis.payload.enrichmentCacheHit,
    },
    ctx
  );

  logger.info('persistStressScenario: scenario persisted', {
    userId: input.userId,
    priorDecisionId: input.priorDecisionId,
    newDecisionEventId: scoreOutput.decisionEventId.toString(),
    dealQuality: scoreOutput.dealQuality,
    perturbationCount: input.perturbations.length,
  });

  return {
    newDecisionEventId: scoreOutput.decisionEventId.toString(),
    newAnalysisEventId: scoreOutput.analysisEventId.toString(),
    dealQuality: scoreOutput.dealQuality,
  };
}
