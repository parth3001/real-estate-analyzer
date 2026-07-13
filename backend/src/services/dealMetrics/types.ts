/**
 * dealMetrics/types.ts — Issue #226 (2026-07-03).
 *
 * The deterministic-numbers principle:
 *
 *   The LLM never produces a numeric value in user-visible output.
 *   Every dollar, percent, ratio, DSCR, IRR, cap rate, count, etc.
 *   must originate as a return field from a tool call in the same
 *   turn. LLM's authority is prose, tone, and structure — not
 *   arithmetic.
 *
 * `compute_deal_metric` is the primitive that enforces this principle.
 * Instead of building a separate tool per calculation pattern (which
 * would produce whack-a-mole tool proliferation), we have ONE tool
 * with a formula registry. Each formula is a pure function that reads
 * from a deal payload and returns a deterministic result.
 *
 * ARCHITECTURAL COMPARISON to peer registries:
 *   - services/perturbation/fieldRegistry.ts — registers WHICH fields
 *     can be perturbed in a stress test. Same pattern, different
 *     domain (perturbation vs computation).
 *   - services/propertyType/registry.ts — registers WHICH analyzers
 *     handle which property types. Same pattern, higher level.
 *
 * WHY REGISTRY (not per-formula tool):
 *   - LLM picks metric by name, tool computes deterministically
 *   - Adding a new formula = one new file, no tool schema changes
 *   - Every formula's inputs/formula/unit are declarative + testable
 *   - Strategy-awareness handled per-formula (declares which
 *     strategies it applies to), tool refuses to run mismatched
 *     combos rather than confabulating
 */

/**
 * The engine strategies a formula may support. A formula that only
 * makes sense for BRRRR (e.g., 70% rule ceiling) declares
 * `['brrrr']`. A strategy-agnostic formula (e.g., break-even
 * occupancy) declares all three.
 *
 * CANONICAL strategy enum for the entire codebase per
 * `/docs/ARCHITECTURE_PRINCIPLES.md` §P10. Re-exported by
 * `backend/src/domain/strategy/canonicalStrategy.ts` — new code should
 * import `CanonicalStrategy` from `domain/strategy` (not this file) so
 * the anchor location can move without downstream churn.
 */
export type DealStrategy = 'buy_hold' | 'brrrr' | 'house_hack';

/**
 * Engine-unit taxonomy — same convention as perturbation/fieldRegistry
 * so any downstream consumer (LLM output formatter, PDF renderer,
 * chat card) has one place to look up how to display each metric.
 */
export type MetricUnit =
  | 'dollars' // e.g. 158000 → "$158,000"
  | 'percent' // engine stores as 10 (meaning 10%), not 0.1
  | 'ratio' // dimensionless, e.g. DSCR 1.20
  | 'years' // e.g. 10
  | 'months' // e.g. 12
  | 'count' // integer, e.g. 3
  | 'dollars_per_month' // e.g. 2200 → "$2,200/mo"
  | 'dollars_per_year';

/**
 * The subset of a substrate AnalysisEvent payload that a formula
 * may read from. Kept intentionally narrow — formulas should NOT
 * touch deep engine internals; if a metric needs a value that
 * isn't here, promote it into DealSnapshot deliberately (with a
 * comment explaining why) rather than reaching in.
 *
 * Every path resolves via `readSnapshotPath` helper — snapshot's
 * shape is enforced by tests, not by direct type coupling to the
 * engine's InvestmentDecision interface.
 */
export interface DealSnapshot {
  strategy: DealStrategy;

  /** Property basics — always present. */
  purchasePrice: number;
  monthlyRent: number;
  downPayment: number;
  closingCosts: number;
  interestRate: number; // percent, e.g. 6.43
  loanTerm: number; // years

  /** Assumptions used at analysis time (snapshotted). */
  propertyTaxRate: number; // percent
  insuranceRate: number; // percent
  maintenanceCost: number; // dollars per year
  monthlyHOA?: number;
  monthlyUtilities?: number;
  monthlyCapEx?: number;
  propertyManagementRate: number; // percent of rent
  vacancyRate: number; // percent

  /**
   * BRRRR-specific inputs — undefined for buy-hold / house-hack.
   * Formulas that require these should declare `['brrrr']` in their
   * `supportedStrategies` so the runner refuses to invoke them on
   * non-BRRRR deals rather than confabulating.
   */
  brrrr?: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV: number; // percent
    refinanceInterestRate: number; // percent
    seasoningPeriod: number; // months
  };

  /**
   * Pre-computed engine values — read-only view of what the engine
   * already produced. Formulas that reference computed values (e.g.,
   * "what rent hits target DSCR post-refi?") read them here rather
   * than re-running the engine.
   */
  computed: {
    monthlyOperatingExpenses: number; // opex ex-debt-service
    monthlyDebtService: number; // acquisition loan P&I
    annualNOI: number;
    walkAwayPrice: number;
    /** BRRRR-only. Undefined for buy-hold. */
    postRefiMonthlyDebtService?: number;
    postRefiMonthlyCashFlow?: number;
    postRefiDSCR?: number;
    capitalRecoveryRate?: number;
    capitalRecovered?: number;
    capitalRemaining?: number;
  };
}

/**
 * User-supplied parameters for a formula (e.g., targetDSCR: 1.20).
 * Optional and formula-specific. Each formula declares its expected
 * shape via a Zod schema for validation.
 */
export type FormulaParameters = Record<string, number | string | boolean>;

/**
 * A single formula's declaration.
 */
export interface MetricDef<P extends FormulaParameters = FormulaParameters> {
  /**
   * Unique key. Use snake_case. Referenced by the LLM in tool calls.
   * Kept short but descriptive.
   * Examples: 'seventy_rule_ceiling', 'rent_for_target_dscr'.
   */
  key: string;

  /** Short human label — surfaced to the LLM as tool description. */
  label: string;

  /**
   * LLM-facing description — helps the classifier + agent pick the
   * right formula. Should include:
   *   - What the formula answers
   *   - When to use it (natural-language triggers)
   *   - What parameters it needs (if any)
   */
  description: string;

  /** Which strategies this formula applies to. */
  supportedStrategies: DealStrategy[];

  /** Formula-specific parameters. Empty object if none. */
  parameters?: {
    [K in keyof P]: {
      unit: MetricUnit;
      description: string;
      /** If unspecified, the LLM must provide. If specified, used as default. */
      defaultValue?: P[K];
    };
  };

  /**
   * The pure function that computes the metric.
   *
   * MUST be deterministic (no random, no time, no I/O).
   * MUST return a finite number.
   * Throws if inputs make the formula impossible (e.g., division by
   * zero, negative-only outputs when the metric must be positive).
   * Runner catches these and surfaces a helpful error.
   */
  formula: (deal: DealSnapshot, params: P) => number;

  /** Unit of the returned value. Used for display formatting. */
  unit: MetricUnit;
}

/**
 * Success result — every field an LLM narrator or downstream
 * consumer might need to cite the value with full provenance.
 */
export interface MetricSuccessResult {
  kind: 'success';
  metric: string;
  label: string;

  /**
   * The raw computed number. Full float precision — do NOT round
   * here. Rounding happens at display (per financial precision
   * principle in CLAUDE.md).
   */
  result: number;

  unit: MetricUnit;

  /**
   * The display-formatted string. This is what an LLM must cite
   * verbatim in narration (never regenerate from the raw number).
   * Format is unit-specific: dollars → "$158,000", percent → "8.43%".
   */
  formatted: string;

  /**
   * The specific input values from the deal that fed the formula.
   * For audit / debug / transparent narration.
   */
  inputsUsed: Record<string, number | string | boolean>;

  /**
   * The strategy of the deal being computed against.
   * (Prevents the LLM from applying a BRRRR result to a buy-hold deal.)
   */
  strategy: DealStrategy;
}

/** Formula errored during computation. */
export interface MetricErrorResult {
  kind: 'error';
  metric: string;
  reason: string;
}

/** Formula doesn't apply to this deal's strategy. */
export interface MetricUnsupportedStrategyResult {
  kind: 'unsupported_strategy';
  metric: string;
  reason: string;
  dealStrategy: DealStrategy;
  supportedStrategies: DealStrategy[];
}

/** Unknown metric key. */
export interface MetricUnknownResult {
  kind: 'unknown_metric';
  metric: string;
  availableMetrics: string[];
}

export type MetricResult =
  | MetricSuccessResult
  | MetricErrorResult
  | MetricUnsupportedStrategyResult
  | MetricUnknownResult;
