/**
 * Runner — Layer 3 of the chat stress-test architecture (Task #16, Path B).
 *
 * Deterministic, LLM-free. Given a prior decision and a set of typed
 * perturbations, this service:
 *
 *   1. Loads the prior AnalysisEvent payload VERBATIM (propertyData +
 *      assumptions exactly as they were scored), scoped by userId for
 *      investor isolation.
 *   2. Clones the loaded inputs (no in-place mutation of cached events).
 *   3. Applies each perturbation:
 *        - looks up the field in the registry
 *        - converts user-declared unit → engine-expected unit
 *        - validates against bounds (warnings, not errors)
 *        - writes to the right container/path
 *        - handles set / increase_by / decrease_by operations
 *   4. Re-runs the genuine SFRAnalyzer + InvestmentDecisionEngine on
 *      BOTH baseline and stressed inputs (same engine version → comparable
 *      results).
 *   5. Returns a structured StressTestResult — every number Layer 4 can
 *      narrate is grounded in this object.
 *
 * The LLM never sees this code path's math. Layer 2 extracts intent into a
 * typed schema; Layer 3 runs the engine; Layer 4 narrates. The 81/100
 * confabulation failure mode is structurally prevented because no math
 * happens outside the engine.
 *
 * SFR-only for now. MF needs MFDecisionEngine with skipEnhancements; tracked
 * as a follow-up (Task #21 — MF WIP messaging + property-type registry #20
 * will pick up the dispatch).
 */

import { Types } from 'mongoose';
import { SFRAnalyzer } from '../../analysis';
import { InvestmentDecisionEngine } from '../investment/investmentDecisionEngine';
// Task #27: reuse score_deal's walk-away resolver so stress narratives get
// a real number (NOI / target cap rate) instead of $0.
import { resolveWalkAwayPrice } from '../../agents/tools/score_deal';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';
import { logger } from '../../utils/logger';
import {
  getFieldDef,
  normalizeToEngineUnit,
  validateEngineValue,
  type PerturbableFieldDef,
} from './fieldRegistry';
import {
  StressTestRequestSchema,
  type StressTestRequest,
  type StressTestResult,
  type ScenarioSnapshot,
  type PerturbationDelta,
  type PerturbationSpec,
} from './schemas';

// ===== Typed errors (so orchestrator + tests can branch cleanly) =====

export class StressTestNotFoundError extends Error {
  constructor(decisionId: string) {
    super(`Prior decision ${decisionId} not found.`);
    this.name = 'StressTestNotFoundError';
  }
}

export class StressTestForbiddenError extends Error {
  constructor() {
    // Generic message — never leak existence of another user's decision.
    super('Prior decision not found.');
    this.name = 'StressTestForbiddenError';
  }
}

export class StressTestIncompleteError extends Error {
  constructor(decisionId: string) {
    super(
      `Prior decision ${decisionId} has no linked AnalysisEvent — cannot reproduce inputs.`
    );
    this.name = 'StressTestIncompleteError';
  }
}

export class StressTestUnsupportedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'StressTestUnsupportedError';
  }
}

// ===== Helpers =====

/**
 * Deep-clone via structured JSON — substrate payloads are plain JSON-y
 * objects (no Dates/Maps/Sets at the leaves the engine reads), so this
 * is safe and isolates downstream mutation from the cached event.
 */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Resolve the value at a registry-defined path on the engine call shape.
 * Used by 'increase_by' / 'decrease_by' to read the prior value.
 *
 * The registry constrains `path` to keys on either SFRData or
 * AnalysisAssumptions, so this is type-safe in practice; we widen here
 * because the helper handles both containers generically.
 */
function readEngineField(
  propertyData: Record<string, unknown>,
  assumptions: Record<string, unknown>,
  def: PerturbableFieldDef
): number | undefined {
  const bag = def.container === 'propertyData' ? propertyData : assumptions;
  // Issue #203 (2026-06-25): nested-path support for BRRRR fields
  // (propertyData.brrrr.X). Flat fields omit subPath and continue to
  // read bag[path] directly.
  let v: unknown;
  if (def.subPath) {
    const sub = bag[def.path] as Record<string, unknown> | undefined;
    v = sub ? sub[def.subPath] : undefined;
  } else {
    v = bag[def.path];
  }
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * Write a value to the registry-defined path on the engine call shape.
 * Mutates the bag — the runner clones BEFORE calling this so the original
 * cached payload stays clean.
 */
function writeEngineField(
  propertyData: Record<string, unknown>,
  assumptions: Record<string, unknown>,
  def: PerturbableFieldDef,
  value: number
): void {
  const bag = def.container === 'propertyData' ? propertyData : assumptions;
  // Issue #203 (2026-06-25): nested-path write for BRRRR sub-fields.
  // Lazily creates the sub-object if missing so a stress-test on a
  // legacy buy-hold deal that's being pivoted to BRRRR doesn't NPE.
  if (def.subPath) {
    let sub = bag[def.path] as Record<string, unknown> | undefined;
    if (!sub || typeof sub !== 'object') {
      sub = {};
      bag[def.path] = sub;
    }
    sub[def.subPath] = value;
  } else {
    bag[def.path] = value;
  }
}

/**
 * Higher-layer unit conversions that require context (e.g., a purchase
 * price) and therefore can't live in the registry's context-free
 * normalizeToEngineUnit helper.
 *
 * Currently handles:
 *   downPayment / closingCosts (dollars):
 *     User says "50% down" or "3% closing" → compute from baseline
 *     purchasePrice. Common, natural way users describe these fields.
 *
 * Returns the converted engine-unit value, or `undefined` if no context-
 * aware conversion applies for this (field, user-unit) pair. Callers
 * fall back to the registry's standard normalizeToEngineUnit when this
 * returns undefined.
 */
function contextualConversion(
  field: string,
  userValue: number,
  userUnit: PerturbationSpec['unit'],
  baselinePropertyData: Record<string, unknown>
): number | undefined {
  // Percent or decimal_ratio → dollars (% of purchase price).
  // Applies to fields that users commonly express as "% of price".
  const percentOfPriceFields = new Set(['downPayment', 'closingCosts']);
  if (
    percentOfPriceFields.has(field) &&
    (userUnit === 'percent' || userUnit === 'decimal_ratio')
  ) {
    const price = baselinePropertyData.purchasePrice;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      // No baseline price to multiply against — caller falls back, which
      // will surface a clear "couldn't apply" warning to the user.
      return undefined;
    }
    // percent: 50 → 0.50; decimal_ratio: 0.5 → 0.5
    const fraction = userUnit === 'percent' ? userValue / 100 : userValue;
    return Math.round(price * fraction);
  }

  return undefined;
}

/**
 * Apply ALL perturbations atomically against cloned propertyData +
 * assumptions. Returns the per-field deltas (baseline → stressed) for
 * Layer 4 to narrate, plus any validation warnings.
 *
 * Resilience: each perturbation runs in a try/catch so one bad
 * extraction (e.g., the LLM declared a unit that can't be converted
 * for the field) degrades gracefully — a warning is recorded for that
 * field but the rest of the perturbations still apply. Without this,
 * a chat turn with 3 perturbations would crash on the first failure
 * and the user would see "Chat turn failed" with no result.
 *
 * 'set' replaces. 'increase_by' / 'decrease_by' read the current value
 * (post-clone, but before THIS perturbation's write) and apply the delta.
 * If two perturbations target the same field, the second one wins for
 * 'set' and stacks for 'increase_by' — same behavior as if a human had
 * applied them in order.
 */
export function applyPerturbations(
  propertyData: Record<string, unknown>,
  assumptions: Record<string, unknown>,
  baselinePropertyData: Record<string, unknown>,
  baselineAssumptions: Record<string, unknown>,
  perturbations: PerturbationSpec[]
): { deltas: PerturbationDelta[]; warnings: string[] } {
  const deltas: PerturbationDelta[] = [];
  const warnings: string[] = [];

  for (const p of perturbations) {
    try {
      const def = getFieldDef(p.field);
      const baselineValue = readEngineField(baselinePropertyData, baselineAssumptions, def);

      // 1) Try a context-aware conversion first (e.g., "50% down" needs
      //    the baseline purchasePrice to compute the dollar amount).
      // 2) Fall back to the registry's context-free unit normalization.
      const contextual = contextualConversion(
        p.field,
        p.value,
        p.unit,
        baselinePropertyData
      );
      const userValueInEngineUnit =
        contextual !== undefined
          ? contextual
          : normalizeToEngineUnit(p.value, p.unit, def);

      let stressedValue: number;
      if (p.operation === 'set') {
        stressedValue = userValueInEngineUnit;
      } else {
        // increase_by / decrease_by — must have a baseline to perturb against.
        if (baselineValue === undefined) {
          warnings.push(
            `Cannot ${p.operation} ${def.label}: no baseline value found in prior analysis. ` +
              `Treated as 'set' instead.`
          );
          stressedValue = userValueInEngineUnit;
        } else {
          stressedValue =
            p.operation === 'increase_by'
              ? baselineValue + userValueInEngineUnit
              : baselineValue - userValueInEngineUnit;
        }
      }

      const validationError = validateEngineValue(stressedValue, def);
      if (validationError) {
        // Soft warning — proceed with the value but flag it. Engine itself
        // will produce whatever number the formula yields; the user sees
        // both the result AND the warning so nothing's hidden.
        warnings.push(validationError);
      }

      writeEngineField(propertyData, assumptions, def, stressedValue);

      deltas.push({
        field: def.key,
        label: def.label,
        baselineValue: baselineValue ?? NaN,
        stressedValue,
        engineUnit: def.engineUnit,
      });
    } catch (err) {
      // ONE perturbation failed (incompatible unit pair, unknown field,
      // etc.). Record a user-facing warning and continue with the rest.
      // Crashing the whole turn on a single bad extraction is the worst
      // possible UX — better to apply what we can and explain what we
      // couldn't.
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(
        `Couldn't apply the change to '${p.field}' (${p.value} ${p.unit}). ` +
          `Try expressing it differently — e.g., in dollars for amounts, ` +
          `percent for rates. Detail: ${msg.split('.')[0]}.`
      );
    }
  }

  return { deltas, warnings };
}

/** Engine's userContext shape — required parameter. */
export interface EngineUserContext {
  availableCash: number;
  experienceLevel: 'novice' | 'intermediate' | 'experienced';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: 'cash_flow' | 'appreciation' | 'balanced';
}

/**
 * Build the engine's userContext from the prior decision's substrate snapshot
 * (DecisionPayload.userContext) plus the propertyData. The substrate stores a
 * slightly different shape than the engine accepts (no availableCash, slightly
 * different field names), so we translate here. Both baseline and stressed
 * receive IDENTICAL context — guarantees the only variable is the perturbation.
 */
export function buildEngineUserContext(
  propertyData: SFRData,
  priorUserContext: unknown
): EngineUserContext {
  const pc = (priorUserContext ?? {}) as {
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    investmentStrategy?: 'cashflow' | 'appreciation' | 'balanced';
    experienceLevel?: 'novice' | 'intermediate' | 'experienced' | 'expert';
  };

  // availableCash: not in substrate; reconstruct from the deal's own committed
  // capital (down + closing). This is what the user was willing to invest at
  // analysis time and matches the engine's affordability checks.
  const availableCash =
    (propertyData.downPayment ?? 0) + (propertyData.closingCosts ?? 0);

  // experienceLevel: engine doesn't accept 'expert' — clamp to 'experienced'.
  const experienceLevel: EngineUserContext['experienceLevel'] =
    pc.experienceLevel === 'expert' ? 'experienced' : pc.experienceLevel ?? 'intermediate';

  // investmentGoals: substrate uses 'cashflow'; engine expects 'cash_flow'.
  const investmentGoals: EngineUserContext['investmentGoals'] =
    pc.investmentStrategy === 'cashflow'
      ? 'cash_flow'
      : pc.investmentStrategy === 'appreciation'
      ? 'appreciation'
      : 'balanced';

  return {
    availableCash,
    experienceLevel,
    riskTolerance: pc.riskTolerance ?? 'moderate',
    investmentGoals,
  };
}

/**
 * Run the analyzer + engine once and project the result into the
 * ScenarioSnapshot shape. LLM-free (`skipEnhancements=true`) — pure math.
 *
 * Throws if the engine returns a malformed result; deal-quality must exist
 * for the narration to be honest.
 */
async function scoreOnce(
  propertyData: SFRData,
  assumptions: AnalysisAssumptions,
  userContext: EngineUserContext
): Promise<ScenarioSnapshot> {
  const analyzer = new SFRAnalyzer(propertyData, assumptions);
  const analysis = analyzer.analyze();

  const engine = new InvestmentDecisionEngine();
  const decision = await engine.generateInvestmentDecision(
    propertyData,
    analysis,
    null, // predictions — not needed for the deterministic score
    null, // marketIntelligence — not needed for stress-only
    userContext, // identical for baseline + stressed — only perturbation varies
    undefined, // enhancedGoals
    true // skipEnhancements — NO LLM. THIS IS THE WHOLE POINT.
  );

  // Defensively unwrap. The engine's TypeScript type is broad; we narrow.
  const d = decision as {
    professionalAssessment?: {
      dealQuality?: number;
      cashFlowScore?: number;
      irrScore?: number;
      marketStrengthScore?: number;
      debtStructureScore?: number;
      exitStrategyScore?: number;
      capRateScore?: number;
      propertyRiskScore?: number;
    };
    marketPosition?: { walkAwayPrice?: number };
  };

  const pa = d.professionalAssessment;
  if (!pa || typeof pa.dealQuality !== 'number') {
    throw new Error(
      'scoreOnce: engine returned no professionalAssessment.dealQuality — cannot proceed.'
    );
  }

  // The legacy analyzer's runtime return shape uses `keyMetrics`, not the
  // typed-interface `metrics`. compute_analysis also handles this (see
  // backend/src/agents/tools/compute_analysis.ts → extractMetrics). Read
  // both with fallback so we survive either shape and don't reproduce the
  // empty-metrics bug that showed up on the first runner test pass.
  const a = analysis as {
    monthlyAnalysis?: { cashFlow?: number };
    metrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      irr?: number;
    };
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      irr?: number;
    };
  };
  const m = a.keyMetrics ?? a.metrics ?? {};

  // Task #27: compute walkAwayPrice the same way score_deal does
  // (NOI / target cap rate with sensible fallbacks). The engine's
  // marketPosition.walkAwayPrice is typically undefined on stress runs
  // because we don't pass marketIntelligence through (it's a fresh re-run
  // of the analyzer + engine, not a full freshly-enriched scoring pass).
  // Without this, stress narratives reported "$0 walk-away" — a real
  // trust-killer because users use walk-away to know if they're overpaying.
  const walkAwayPrice = resolveWalkAwayPrice(
    undefined, // no explicit override — let the helper compute from NOI
    propertyData as unknown as Record<string, unknown>,
    decision as unknown as Record<string, unknown>,
    analysis as unknown as Record<string, unknown>
  );

  // Issue #219 (2026-07-02) — surface BRRRR-specific metrics when the
  // engine produced them. Without this, the stress-test narrator on a
  // BRRRR deal only saw buy-hold values (monthlyCashFlow from acquisition
  // loan, DSCR 1.41 from the same loan, IRR 20.71% baseline). Perturbing
  // the refi rate produced "no change" because the narrator couldn't see
  // any BRRRR values to change. Now the engine's decision.strategySpecific
  // (populated by generateBRRRRDecision at investmentDecisionEngine.ts:
  // 2267) is unpacked into the snapshot.
  const ss = (decision as unknown as { strategySpecific?: {
    capitalRecovery?: {
      capitalRecoveryRate?: number;
      capitalRecovered?: number;
      capitalRemaining?: number;
    };
    postRefinanceMetrics?: {
      monthlyCashFlow?: number;
      postRefiDSCR?: number;
      cashOnCashReturn?: number;
    };
    rule70Check?: { meets70Rule?: boolean };
    exitScenarios?: Array<{ year: number; irr: number }>;
  } }).strategySpecific;

  const strategy = (propertyData as unknown as { investmentStrategy?: string })
    .investmentStrategy === 'brrrr' ? 'brrrr' : 'buy_hold';

  const projectionYears = (assumptions as { projectionYears?: number })
    .projectionYears ?? 10;

  // Pick the exit scenario closest to the deal's hold period. Standard
  // scenarios: [3, 5, 7, 10, 15]. On a 10-year hold this returns Y10 IRR.
  const brrrrExitIrr = ss?.exitScenarios && ss.exitScenarios.length > 0
    ? (() => {
        const best = ss.exitScenarios!.reduce((a, b) =>
          Math.abs(a.year - projectionYears) <= Math.abs(b.year - projectionYears)
            ? a : b
        );
        return best.irr;
      })()
    : 0;

  return {
    dealQuality: pa.dealQuality,
    qualityLabel: deriveQualityLabel(pa.dealQuality),
    factorScores: {
      cashFlow: pa.cashFlowScore ?? 0,
      irr: pa.irrScore ?? 0,
      marketStrength: pa.marketStrengthScore ?? 0,
      debtStructure: pa.debtStructureScore ?? 0,
      exitStrategy: pa.exitStrategyScore ?? 0,
      capRate: pa.capRateScore ?? 0,
      propertyRisk: pa.propertyRiskScore ?? 0,
    },
    monthlyCashFlow: a.monthlyAnalysis?.cashFlow ?? 0,
    capRate: m.capRate ?? 0,
    cashOnCashReturn: m.cashOnCashReturn ?? 0,
    dscr: m.dscr ?? 0,
    walkAwayPrice,
    irr: m.irr ?? 0,
    strategy,
    ...(ss && strategy === 'brrrr'
      ? {
          brrrr: {
            postRefiCashFlow: ss.postRefinanceMetrics?.monthlyCashFlow ?? 0,
            postRefiDSCR: ss.postRefinanceMetrics?.postRefiDSCR ?? 0,
            postRefiCoC: ss.postRefinanceMetrics?.cashOnCashReturn ?? 0,
            capitalRecoveryRate: ss.capitalRecovery?.capitalRecoveryRate ?? 0,
            capitalRecovered: ss.capitalRecovery?.capitalRecovered ?? 0,
            capitalRemaining: ss.capitalRecovery?.capitalRemaining ?? 0,
            meets70Rule: ss.rule70Check?.meets70Rule ?? false,
            brrrrExitIrr,
          },
        }
      : {}),
  };
}

/** Same bins the projector uses — kept in lockstep with the substrate. */
function deriveQualityLabel(dealQuality: number): string {
  if (dealQuality >= 80) return 'Above professional standards';
  if (dealQuality >= 65) return 'Meets professional standards';
  if (dealQuality >= 50) return 'Requires optimization';
  return 'Below professional standards';
}

// ===== Public API =====

/**
 * Run a deterministic stress test.
 *
 *   - Loads the prior AnalysisEvent for `priorDecisionId` (scoped by `userId`).
 *   - Applies typed perturbations with explicit unit conversion via the
 *     registry. The unit-mismatch failure mode (the 0.075-vs-7.5 bug) is
 *     structurally impossible at this layer.
 *   - Re-runs the engine on BOTH baseline and stressed inputs (same engine
 *     version → numbers are directly comparable).
 *   - Returns the structured result for Layer 4 narration.
 *
 * Throws typed errors that the orchestrator translates to user-facing
 * messages:
 *   - StressTestNotFoundError       — decisionId is gibberish or unknown
 *   - StressTestForbiddenError      — decision belongs to another user
 *   - StressTestIncompleteError     — decision lacks linked AnalysisEvent
 *   - StressTestUnsupportedError    — property type isn't SFR (MF TBD)
 */
export async function runStressTest(
  rawRequest: unknown
): Promise<StressTestResult> {
  // Trust boundary — even if the caller is internal, parse before trusting.
  const request: StressTestRequest = StressTestRequestSchema.parse(rawRequest);

  // ===== 1. Load prior bundle (decision + analysis) =====
  let bundle;
  try {
    bundle = await eventsRepositoryReads.getScenarioBundle(
      new Types.ObjectId(request.priorDecisionId)
    );
  } catch (err) {
    logger.warn('runStressTest: getScenarioBundle threw', {
      priorDecisionId: request.priorDecisionId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new StressTestNotFoundError(request.priorDecisionId);
  }
  if (!bundle) {
    throw new StressTestNotFoundError(request.priorDecisionId);
  }

  // ===== 2. Investor isolation — decision must belong to this user =====
  if (bundle.decision.userId?.toString() !== request.userId) {
    // Same generic message as NotFound — never confirm "exists but not yours."
    throw new StressTestForbiddenError();
  }

  if (!bundle.analysis) {
    throw new StressTestIncompleteError(request.priorDecisionId);
  }

  // ===== 3. Extract prior inputs verbatim =====
  const priorPropertyData = bundle.analysis.payload.propertyData as SFRData & {
    propertyType?: string;
  };

  if (priorPropertyData?.propertyType !== 'SFR') {
    throw new StressTestUnsupportedError(
      `Stress-testing is only supported for single-family (SFR) deals today; ` +
        `this deal is ${priorPropertyData?.propertyType ?? 'unknown'}.`
    );
  }

  const priorAssumptions = (bundle.analysis.payload.assumptions ?? {}) as AnalysisAssumptions;

  // Reconstruct the engine userContext from the prior decision's substrate
  // snapshot. Both baseline AND stressed get the SAME context — the only
  // variable across the two runs is the perturbation set.
  const engineUserContext = buildEngineUserContext(
    priorPropertyData,
    (bundle.decision.payload as { userContext?: unknown })?.userContext
  );

  // ===== 4. Score baseline (re-run for same-version comparability) =====
  const baselineSnapshot = await scoreOnce(
    priorPropertyData,
    priorAssumptions,
    engineUserContext
  );

  // ===== 5. Apply perturbations to a clone, score stressed =====
  const stressedPropertyData = deepClone(priorPropertyData);
  const stressedAssumptions = deepClone(priorAssumptions);

  const { deltas, warnings } = applyPerturbations(
    stressedPropertyData as unknown as Record<string, unknown>,
    stressedAssumptions as unknown as Record<string, unknown>,
    priorPropertyData as unknown as Record<string, unknown>,
    priorAssumptions as unknown as Record<string, unknown>,
    request.perturbations
  );

  const stressedSnapshot = await scoreOnce(
    stressedPropertyData,
    stressedAssumptions,
    engineUserContext
  );

  logger.info('runStressTest: completed', {
    priorDecisionId: request.priorDecisionId,
    userId: request.userId,
    perturbationCount: request.perturbations.length,
    baselineScore: baselineSnapshot.dealQuality,
    stressedScore: stressedSnapshot.dealQuality,
    warningCount: warnings.length,
    strategy: stressedSnapshot.strategy,
    // Issue #219 (2026-07-02) — log when a perturbation was a NO-OP
    // (baseline == stressed). Common when user asks "what if X = 10?"
    // but substrate already has 10. Narrator now handles this case
    // explicitly.
    noOpPerturbations: (() => {
      const noOps: string[] = [];
      for (const d of deltas) {
        if (d.baselineValue === d.stressedValue) noOps.push(d.field);
      }
      return noOps;
    })(),
  });

  return {
    baseline: baselineSnapshot,
    stressed: stressedSnapshot,
    deltas,
    warnings,
  };
}
