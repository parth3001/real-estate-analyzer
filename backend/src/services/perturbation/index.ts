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

import { Types } from 'mongoose';
import type { AnthropicAdapter } from '../../agents/llm/anthropicAdapter';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import { logger } from '../../utils/logger';
import { extractPerturbations } from './extractor';
import {
  runStressTest,
  StressTestNotFoundError,
  StressTestForbiddenError,
  StressTestIncompleteError,
  StressTestUnsupportedError,
} from './runner';
import { composeNarrative } from './narrativeComposer';
import type { StressTestResult } from './schemas';

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
