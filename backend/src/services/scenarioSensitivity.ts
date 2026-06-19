/**
 * scenarioSensitivity — REAL sensitivity analysis for the scenario workspace.
 *
 * Day 11h (Task #8, 2026-05-21). Perturbs underwriting inputs and RE-RUNS
 * the actual analyzer→engine pipeline per perturbation — no faked math.
 *
 * WHY FROM SCRATCH (not the existing sensitivityAnalysisService):
 * that service's recalculateAnalysis() is a heuristic approximation
 * ("monthlyPaymentDiff = priceDiff * 0.8 * 0.007") that never re-runs the
 * analyzer, and it leaks verdict/PASS/BUY (violates the no-verdict policy).
 * Faked sensitivity defeats the whole point — "metrics are downstream of
 * assumptions," so the recompute must be the genuine engine, not a guess.
 *
 * HOW IT'S CHEAP: SFRAnalyzer.analyze() is pure deterministic math (no I/O),
 * market data is injected (fetched once, held constant), and the decision
 * engine runs with skipEnhancements=true (no LLM — the goalBasedReasoning
 * gate added 2026-05-21 makes that fully LLM-free). ~13 recomputes per
 * report, all pure CPU.
 *
 * REDDIT-VALIDATED DESIGN: single-variable curves on the make-or-break
 * inputs (exit/appreciation, vacancy, rent, rehab, rate) AND a STACKED
 * "realistic downside" preset — several small adverse moves at once,
 * because real misses are correlated, not isolated (412_properties:
 * "each looks fine in isolation; they don't fail in isolation").
 *
 * SFR ONLY for now. MF needs MFDecisionEngine skipEnhancements gating
 * verified first (follow-up).
 */

import { SFRAnalyzer } from '../analysis';
import { InvestmentDecisionEngine } from './investment/investmentDecisionEngine';
import type { SFRData } from '../types/propertyTypes';
import type { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

// ===== Types =====

export interface SensitivityInputs {
  /** Base scenario inputs (from the AnalysisEvent being perturbed). */
  propertyData: SFRData;
  assumptions: AnalysisAssumptions;
  /** Injected, held constant across perturbations (never re-fetched). */
  marketIntelligence: unknown;
  /** Persona context — reproduces the original weight selection. */
  userContext: unknown;
}

export interface SensitivityPoint {
  /** Applied delta (percent or points per the variable's mode). */
  delta: number;
  label: string;
  dealQuality: number;
}

export interface SensitivityVariable {
  field: string;
  label: string;
  unit: 'currency' | 'percent' | 'years';
  baseValue: number;
  points: SensitivityPoint[];
}

export interface StackedPerturbation {
  field: string;
  label: string;
  from: number;
  to: number;
}

export interface SensitivityReport {
  /** Recomputed base score (internally consistent baseline for the deltas). */
  baseDealQuality: number;
  variables: SensitivityVariable[];
  stackedDownside: {
    label: string;
    perturbations: StackedPerturbation[];
    dealQuality: number;
  };
}

// ===== Perturbation specs =====
//
// `mode: 'percent'` multiplies (rent -10% → ×0.90); `mode: 'points'` adds
// (vacancy +3 → +3 percentage points). Deltas are downside-weighted (the
// "show me the bad side" framing) but include 0 (base) for the curve.

type Target = 'propertyData' | 'assumptions';

interface SpecEntry {
  target: Target;
  field: string;
  label: string;
  unit: 'currency' | 'percent' | 'years';
  mode: 'percent' | 'points';
  deltas: number[];
}

const SENSITIVITY_SPEC: SpecEntry[] = [
  // Exit assumptions — the #1 underweighted input. Lower appreciation
  // is the proxy for "exit cap expanded" (no literal exit-cap input
  // exists; exit is modeled via appreciation + selling costs). Task
  // #75 (2026-06-18): added a third tier at −3pts to surface the
  // 2008-style tail risk specifically. For appreciation-led deals in
  // path-of-growth submarkets this is THE risk an institutional
  // underwriter would stress most.
  { target: 'assumptions', field: 'annualPropertyValueIncrease', label: 'Appreciation', unit: 'percent', mode: 'points', deltas: [0, -1, -2, -3] },
  { target: 'assumptions', field: 'sellingCosts', label: 'Selling costs', unit: 'percent', mode: 'points', deltas: [0, 2, 4] },
  // Vacancy — investors say model 8-12%, not 5%.
  { target: 'assumptions', field: 'vacancyRate', label: 'Vacancy', unit: 'percent', mode: 'points', deltas: [0, 3, 6] },
  // Rent — the income side; confirmation bias inflates it.
  { target: 'propertyData', field: 'monthlyRent', label: 'Rent', unit: 'currency', mode: 'percent', deltas: [0, -5, -10] },
  // Financing. Task #75: added +2pts tier — 2022-style fed-shock
  // magnitude. +0.5 and +1 alone understate the systemic risk
  // investors actually carry on floating rate environments.
  { target: 'propertyData', field: 'interestRate', label: 'Interest rate', unit: 'percent', mode: 'points', deltas: [0, 0.5, 1, 2] },
  // Rehab — "the input you control least after closing" (no-ops if 0).
  { target: 'propertyData', field: 'repairCosts', label: 'Rehab', unit: 'currency', mode: 'percent', deltas: [0, 15, 30] },
];

// The "realistic downside" — several small adverse moves at once. Correlated
// drift, not isolated stress (412_properties + e_management's "6mo longer +
// 20% more" insight).
const STACKED_DOWNSIDE: Array<{ target: Target; field: string; mode: 'percent' | 'points'; delta: number; label: string }> = [
  { target: 'propertyData', field: 'monthlyRent', mode: 'percent', delta: -3, label: 'Rent −3%' },
  { target: 'assumptions', field: 'vacancyRate', mode: 'points', delta: 3, label: 'Vacancy +3pts' },
  { target: 'propertyData', field: 'repairCosts', mode: 'percent', delta: 15, label: 'Rehab +15%' },
  { target: 'assumptions', field: 'annualPropertyValueIncrease', mode: 'points', delta: -1.5, label: 'Appreciation −1.5pts' },
  { target: 'propertyData', field: 'interestRate', mode: 'points', delta: 0.5, label: 'Rate +0.5pts' },
  { target: 'assumptions', field: 'sellingCosts', mode: 'points', delta: 1, label: 'Selling costs +1pt' },
];

// ===== Helpers =====

function applyDelta(value: number, mode: 'percent' | 'points', delta: number): number {
  return mode === 'percent' ? value * (1 + delta / 100) : value + delta;
}

function deltaLabel(mode: 'percent' | 'points', delta: number): string {
  if (delta === 0) return 'Base';
  const sign = delta > 0 ? '+' : '';
  return mode === 'percent' ? `${sign}${delta}%` : `${sign}${delta}pts`;
}

/**
 * Score one input set — the genuine analyzer→engine pipeline, LLM-free.
 * SFRAnalyzer.analyze() is pure math; the engine runs skipEnhancements=true.
 */
async function scoreOnce(
  propertyData: SFRData,
  assumptions: AnalysisAssumptions,
  marketIntelligence: unknown,
  userContext: unknown
): Promise<number> {
  const analyzer = new SFRAnalyzer(propertyData, assumptions);
  const analysis = analyzer.analyze();
  const engine = new InvestmentDecisionEngine();
  const decision = await engine.generateInvestmentDecision(
    propertyData,
    analysis,
    null, // predictions — not needed for the score
    (marketIntelligence ?? null) as never,
    userContext as never,
    undefined, // enhancedGoals
    true // skipEnhancements — no LLM, no AI content, no nested sensitivity
  );
  return (
    (decision as { professionalAssessment?: { dealQuality?: number } })
      .professionalAssessment?.dealQuality ?? 0
  );
}

// ===== Public API =====

/**
 * Run the full sensitivity report for a base scenario. Re-runs the real
 * analyzer→engine pipeline for each single-variable point plus the stacked
 * downside. Pure CPU, no LLM, no per-iteration I/O.
 */
export async function runScenarioSensitivity(
  inputs: SensitivityInputs
): Promise<SensitivityReport> {
  const { propertyData, assumptions, marketIntelligence, userContext } = inputs;

  const baseDealQuality = await scoreOnce(
    propertyData,
    assumptions,
    marketIntelligence,
    userContext
  );

  // ---- Single-variable curves ----
  const variables: SensitivityVariable[] = [];
  for (const spec of SENSITIVITY_SPEC) {
    const source =
      spec.target === 'propertyData'
        ? (propertyData as unknown as Record<string, unknown>)
        : (assumptions as unknown as Record<string, unknown>);
    const baseValue = source[spec.field];
    // Skip inputs absent or zero (e.g., rehab on a no-rehab buy-hold) —
    // perturbing 0 yields no movement and just clutters the report.
    if (typeof baseValue !== 'number' || baseValue === 0) continue;

    const points: SensitivityPoint[] = [];
    for (const delta of spec.deltas) {
      if (delta === 0) {
        points.push({ delta, label: 'Base', dealQuality: baseDealQuality });
        continue;
      }
      const pd = { ...propertyData };
      const as = { ...assumptions };
      const target =
        spec.target === 'propertyData'
          ? (pd as unknown as Record<string, unknown>)
          : (as as unknown as Record<string, unknown>);
      target[spec.field] = applyDelta(baseValue, spec.mode, delta);
      const dq = await scoreOnce(pd, as, marketIntelligence, userContext);
      points.push({ delta, label: deltaLabel(spec.mode, delta), dealQuality: dq });
    }
    variables.push({
      field: spec.field,
      label: spec.label,
      unit: spec.unit,
      baseValue,
      points,
    });
  }

  // ---- Stacked "realistic downside" ----
  const pdDown = { ...propertyData };
  const asDown = { ...assumptions };
  const applied: StackedPerturbation[] = [];
  for (const p of STACKED_DOWNSIDE) {
    const target =
      p.target === 'propertyData'
        ? (pdDown as unknown as Record<string, unknown>)
        : (asDown as unknown as Record<string, unknown>);
    const cur = target[p.field];
    if (typeof cur !== 'number' || cur === 0) continue;
    const to = applyDelta(cur, p.mode, p.delta);
    target[p.field] = to;
    applied.push({ field: p.field, label: p.label, from: cur, to });
  }
  const stackedDealQuality = await scoreOnce(
    pdDown,
    asDown,
    marketIntelligence,
    userContext
  );

  return {
    baseDealQuality,
    variables,
    stackedDownside: {
      label: 'Realistic downside',
      perturbations: applied,
      dealQuality: stackedDealQuality,
    },
  };
}
