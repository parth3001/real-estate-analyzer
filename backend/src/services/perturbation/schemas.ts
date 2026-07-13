/**
 * Zod schemas for the perturbation layer (Task #16, Path B).
 *
 * Layer 2 (the LLM extractor) emits values matching `PerturbationSpec` —
 * Zod-validated so the LLM CANNOT slip a string where a number belongs, or
 * skip the `unit` field, or invent a field name not in the registry.
 *
 * Layer 3 (the runner) consumes `StressTestRequest` and produces
 * `StressTestResult`. The structured handoff makes unit/field mismatches
 * structurally impossible: by the time Layer 3 receives the perturbation,
 * we know it has a real field key, a numeric value, and an explicit user-
 * unit declaration.
 *
 * The whole point: the bug that produced the 81/100 confabulation was the
 * LLM passing `interestRate: 0.075` (no unit declaration) and the engine
 * silently treating it as 0.075%. With `unit: z.enum(...)` required, the
 * LLM has to say "0.075 is a decimal_ratio" or "7.5 is a percent" — and
 * the runner converts deterministically. No more ambiguity.
 */

import { z } from 'zod';
import { SFR_PERTURBABLE_FIELD_KEYS } from './fieldRegistry';

// ===== Enums =====

/**
 * The full set of perturbable field keys. Generated FROM the registry so
 * any new registry entry is automatically allowed; any LLM-supplied key
 * NOT in the registry is rejected by Zod at the trust boundary.
 *
 * NOTE: z.enum requires a non-empty tuple of string literals at compile
 * time. We construct it from the runtime registry array — TypeScript can't
 * know at compile time that the array is non-empty, so we assert. If the
 * registry ever becomes empty (it shouldn't), parse() will throw a clear
 * error rather than producing a wrong-shape schema.
 */
export const FieldKeyEnum = z.enum(
  SFR_PERTURBABLE_FIELD_KEYS as unknown as [string, ...string[]]
);

/**
 * The unit the user (or LLM-on-behalf-of-user) DECLARED for their value.
 * Layer 3 converts this → the field's engine unit via normalizeToEngineUnit.
 *
 * 'percent' and 'decimal_ratio' are distinct on purpose. If a user says
 * "7.5%", the LLM emits unit='percent' value=7.5. If a user says "0.075",
 * the LLM emits unit='decimal_ratio' value=0.075. Both reduce to the same
 * engine-unit value but they say WHAT THE USER MEANT — which is the only
 * defense against the original bug.
 */
export const UserUnitEnum = z.enum(['percent', 'dollars', 'years', 'decimal_ratio', 'count']);

/**
 * Operation the user is requesting on the field.
 *   'set':           replace with this value          ("stress at 7.5%")
 *   'increase_by':   add this value to the prior      ("bump rate by 1 point")
 *   'decrease_by':   subtract this value from prior   ("drop rent by $200")
 *
 * 'set' is the default — the common case. The +/- operations let the user
 * speak in deltas naturally; Layer 3 resolves them against the prior value
 * loaded from the AnalysisEvent.
 */
export const OperationEnum = z.enum(['set', 'increase_by', 'decrease_by']);

// ===== Perturbation spec =====

/**
 * A single typed perturbation. Layer 2's LLM output MUST conform to this.
 */
export const PerturbationSpecSchema = z.object({
  field: FieldKeyEnum,
  value: z.number().finite(),
  unit: UserUnitEnum,
  operation: OperationEnum.default('set'),
  /**
   * Optional human-readable label the LLM may attach for narration
   * ("rent dropped from $1,800 to $1,500"). Layer 4 may use it; Layer 3
   * doesn't need it for math.
   */
  rationale: z.string().max(140).optional(),
});

export type PerturbationSpec = z.infer<typeof PerturbationSpecSchema>;

// ===== Stress test request (input to Layer 3) =====

/**
 * One stress test = one or more perturbations applied simultaneously
 * against a prior decision's full input set. Layer 3 loads the prior
 * AnalysisEvent payload, applies all perturbations atomically, re-runs
 * the engine, and returns the new result.
 */
export const StressTestRequestSchema = z.object({
  /** The decision being stress-tested. Layer 3 loads its AnalysisEvent. */
  priorDecisionId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, '24-char hex ObjectId expected'),
  /** Who's running the test (for substrate event provenance). */
  userId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, '24-char hex ObjectId expected'),
  /** The perturbations to apply atomically. Must have at least one. */
  perturbations: z.array(PerturbationSpecSchema).min(1).max(10),
});

export type StressTestRequest = z.infer<typeof StressTestRequestSchema>;

// ===== Stress test result (output from Layer 3 → Layer 4) =====

/**
 * The deterministic result Layer 3 produces. Layer 4 receives this as
 * STRUCTURED DATA and composes prose around it — the LLM cannot invent
 * numbers because every number it would cite is in this object.
 */
export interface StressTestResult {
  /** Score + headline metrics from the BASELINE (prior decision). */
  baseline: ScenarioSnapshot;
  /** Score + headline metrics AFTER applying the perturbations. */
  stressed: ScenarioSnapshot;
  /** Per-field deltas describing what changed. */
  deltas: PerturbationDelta[];
  /**
   * Validation warnings (e.g., "vacancy of 60% is above typical bound").
   * Empty array if everything was within bounds. Layer 4 surfaces these
   * to the user so they know the engine ran but the inputs were unusual.
   */
  warnings: string[];
}

/** A compact snapshot of the metrics that matter in a stress narration. */
export interface ScenarioSnapshot {
  dealQuality: number; // 0-100
  qualityLabel: string; // "Above professional standards" etc.
  factorScores: {
    cashFlow: number;
    irr: number;
    marketStrength: number;
    debtStructure: number;
    exitStrategy: number;
    capRate: number;
    propertyRisk: number;
  };
  monthlyCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  walkAwayPrice: number;
  irr: number;

  // Issue #219 (2026-07-02) — the stress-test snapshot was buy-hold-only.
  // On a BRRRR deal, perturbing refinanceRate produced "no change" in the
  // reported metrics because the narrator only saw buy-hold values (cash
  // flow, DSCR, IRR from the acquisition loan). Adding strategy field
  // + BRRRR-specific metrics so the narrator can report the actual
  // affected values. Fields are optional so buy-hold snapshots stay
  // backward-compatible.
  // Issue #243 (2026-07-12): canonical strategy vocabulary per P10.
  // Widened from the narrow `'buy_hold' | 'brrrr'` so `house_hack`
  // propagates end-to-end. Downstream narrator branches on the field
  // through `normalizeStrategy` (no raw string comparisons anywhere).
  strategy?: import('../../domain/strategy').CanonicalStrategy;
  brrrr?: {
    postRefiCashFlow: number;
    postRefiDSCR: number;
    postRefiCoC: number;
    capitalRecoveryRate: number;
    capitalRecovered: number;
    capitalRemaining: number;
    meets70Rule: boolean;
    /** BRRRR exit-scenario IRR at hold-period-year (e.g., Y10). Different from buy-hold IRR. */
    brrrrExitIrr: number;
  };
}

/** Per-field before/after for what changed. */
export interface PerturbationDelta {
  /** Friendly key from the registry. */
  field: string;
  /** Human-readable label ("Mortgage rate"). */
  label: string;
  /** Engine-unit value BEFORE the perturbation. */
  baselineValue: number;
  /** Engine-unit value AFTER the perturbation. */
  stressedValue: number;
  /** Engine's expected unit, so Layer 4 can format correctly. */
  engineUnit: 'percent' | 'dollars' | 'years' | 'decimal_ratio' | 'count';
}
