/**
 * tool:compute_deal_metric — Issue #226 (2026-07-03).
 *
 * The single point at which the LLM invokes a deal-specific
 * calculation. Enforces the deterministic-numbers principle:
 *
 *   The LLM never produces numeric values in user-visible output.
 *   Every dollar, percent, ratio, DSCR, IRR, cap rate, count must
 *   originate as a return field from a tool call in the same turn.
 *   LLM's authority is prose, tone, and structure — not arithmetic.
 *
 * The tool wraps the dealMetrics service (services/dealMetrics/index.ts).
 * When a formula isn't in the registry, the tool returns a clean
 * "unknown_metric" result with the list of available formulas — the
 * LLM sees the menu and either picks a covered formula OR gracefully
 * exits to the user ("I can't compute that reliably yet — here's
 * what I can do instead").
 *
 * Every result carries:
 *   - The raw numeric result (full precision)
 *   - A display-formatted string the LLM must cite verbatim
 *   - The specific inputs from the deal that fed the formula
 *     (audit trail)
 *   - The strategy the deal was scored against (BRRRR / buy-hold / etc)
 *
 * The LLM has NO PATH to compute a number without calling this. That
 * is the point.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';
import {
  computeMetric,
  listMetricsForStrategy,
  type DealSnapshot,
} from '../../services/dealMetrics';

// ===== Input schema =====

export const ComputeDealMetricInputSchema = z.object({
  /**
   * The DecisionEvent id of the analysis to compute against.
   * The tool loads the substrate bundle for this decision to build
   * the DealSnapshot.
   */
  decisionId: objectIdHex,

  /**
   * The registered metric key (e.g., 'seventy_rule_ceiling').
   * If the key doesn't exist, the tool returns kind='unknown_metric'
   * with the list of available metrics for this deal's strategy.
   */
  metric: z.string(),

  /**
   * Formula-specific parameters (e.g., { targetDSCR: 1.20 }). Optional.
   * Formulas that require params document them in their `description`
   * so the LLM knows to pass them. If a required param is missing and
   * has no default, the tool returns kind='error' with a helpful
   * reason.
   */
  parameters: z
    .record(z.union([z.number(), z.string(), z.boolean()]))
    .optional(),
});

export type ComputeDealMetricInput = z.input<typeof ComputeDealMetricInputSchema>;

// ===== Output schema =====

const InputsUsedSchema = z.record(
  z.union([z.number(), z.string(), z.boolean()])
);

const StrategySchema = z.enum(['buy_hold', 'brrrr', 'house_hack']);

const SuccessResultSchema = z.object({
  kind: z.literal('success'),
  metric: z.string(),
  label: z.string(),
  result: z.number(),
  unit: z.string(),
  formatted: z.string(),
  inputsUsed: InputsUsedSchema,
  strategy: StrategySchema,
});

const ErrorResultSchema = z.object({
  kind: z.literal('error'),
  metric: z.string(),
  reason: z.string(),
});

const UnsupportedStrategyResultSchema = z.object({
  kind: z.literal('unsupported_strategy'),
  metric: z.string(),
  reason: z.string(),
  dealStrategy: StrategySchema,
  supportedStrategies: z.array(StrategySchema),
});

const UnknownMetricResultSchema = z.object({
  kind: z.literal('unknown_metric'),
  metric: z.string(),
  /**
   * Metrics that DO apply to this deal's strategy (curated menu).
   * Each entry includes its parameters spec so the LLM can pick the
   * right formula AND know what to pass in the retry call.
   */
  availableMetricsForThisDeal: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      description: z.string(),
      parameters: z.array(
        z.object({
          name: z.string(),
          unit: z.string(),
          description: z.string(),
          required: z.boolean(),
          defaultValue: z
            .union([z.number(), z.string(), z.boolean()])
            .optional(),
        })
      ),
    })
  ),
});

export const ComputeDealMetricOutputSchema = z.union([
  SuccessResultSchema,
  ErrorResultSchema,
  UnsupportedStrategyResultSchema,
  UnknownMetricResultSchema,
]);

export type ComputeDealMetricOutput = z.output<
  typeof ComputeDealMetricOutputSchema
>;

// ===== Tool =====

export const computeDealMetric: Tool<
  ComputeDealMetricInput,
  ComputeDealMetricOutput
> = {
  name: 'compute_deal_metric',
  description:
    "Compute a deterministic financial metric on a deal — solve-for-X " +
    "questions, threshold calculations, cash-flow derivatives. Use this " +
    "instead of doing arithmetic yourself. Every numeric value in your " +
    "response about a specific deal must come from a tool call — this " +
    "one, get_decision_breakdown, or the initial analysis. Pass the " +
    "metric name (see menu returned on 'unknown_metric') and any " +
    "required parameters. The result's `formatted` field is the string " +
    "to cite verbatim — do not regenerate or round the raw `result`.",
  inputSchema: ComputeDealMetricInputSchema,
  outputSchema: ComputeDealMetricOutputSchema,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: ComputeDealMetricInput,
    ctx: ToolContext
  ): Promise<ComputeDealMetricOutput> {
    const validated = ComputeDealMetricInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // Load the DecisionEvent + AnalysisEvent via the same helper
    // other read tools use (getAuditTrail joins them).
    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);

    if (!bundle.analysis) {
      return {
        kind: 'error',
        metric: validated.metric,
        reason:
          `Decision ${decisionId.toHexString()} has no linked analysis event.`,
      };
    }

    const snapshot = buildDealSnapshot(bundle.analysis.payload);

    const result = computeMetric(
      validated.metric,
      snapshot,
      validated.parameters ?? {}
    );

    // If unknown_metric, enrich the result with the CURATED menu of
    // formulas that apply to THIS deal's strategy — so the LLM sees
    // options that are actually relevant, not the full catalogue.
    if (result.kind === 'unknown_metric') {
      return {
        kind: 'unknown_metric',
        metric: validated.metric,
        availableMetricsForThisDeal: listMetricsForStrategy(snapshot.strategy),
      };
    }

    return result;
  },
};

// ===== DealSnapshot builder =====

/**
 * Build a DealSnapshot from a substrate AnalysisEvent payload.
 * Kept in this file (not in dealMetrics/) because the shape depends
 * on how substrate is laid out — dealMetrics/ should stay agnostic
 * to the substrate representation.
 */
function buildDealSnapshot(payload: unknown): DealSnapshot {
  // The payload is Zod-validated at write time (AnalysisPayloadSchema),
  // but we read it with defensive optional chaining and a `Record<string,
  // unknown>` cast because the substrate uses Mongoose's `Mixed` type at
  // storage time.
  const p = (payload ?? {}) as Record<string, unknown>;
  const property = (p.propertyData ?? {}) as Record<string, unknown>;
  const assumptions = (p.assumptions ?? {}) as Record<string, unknown>;
  const monthlyAnalysis = (p.monthlyAnalysis ?? {}) as Record<string, unknown>;
  const monthlyExpenses = (monthlyAnalysis.expenses ?? {}) as Record<
    string,
    unknown
  >;
  const metrics = (p.metrics ?? {}) as Record<string, unknown>;
  const strategySpecific = (p.strategySpecific ?? {}) as Record<
    string,
    unknown
  >;

  const rawStrategy =
    (property.investmentStrategy as string | undefined) ?? 'buy_hold';
  const strategy: DealSnapshot['strategy'] =
    rawStrategy === 'brrrr'
      ? 'brrrr'
      : rawStrategy === 'house-hack' || rawStrategy === 'house_hack'
        ? 'house_hack'
        : 'buy_hold';

  const brrrrIn = (property.brrrr ?? {}) as Record<string, unknown>;

  const postRefinanceMetrics = (strategySpecific.postRefinanceMetrics ??
    {}) as Record<string, unknown>;
  const capitalRecovery = (strategySpecific.capitalRecovery ??
    {}) as Record<string, unknown>;

  return {
    strategy,
    purchasePrice: num(property.purchasePrice),
    monthlyRent: num(property.monthlyRent),
    downPayment: num(property.downPayment),
    closingCosts: num(property.closingCosts),
    interestRate: num(property.interestRate),
    loanTerm: num(property.loanTerm, 30),
    propertyTaxRate: num(property.propertyTaxRate),
    insuranceRate: num(property.insuranceRate),
    maintenanceCost: num(property.maintenanceCost),
    monthlyHOA: numOpt(property.monthlyHOA),
    monthlyUtilities: numOpt(property.monthlyUtilities),
    monthlyCapEx: numOpt(property.monthlyCapEx),
    propertyManagementRate: num(property.propertyManagementRate, 8),
    vacancyRate: num(
      property.vacancyRate ?? assumptions.vacancyRate,
      5
    ),
    brrrr:
      strategy === 'brrrr'
        ? {
            rehabBudget: num(brrrrIn.rehabBudget),
            afterRepairValue: num(brrrrIn.afterRepairValue),
            refinanceLTV: num(brrrrIn.refinanceLTV, 75),
            refinanceInterestRate: num(brrrrIn.refinanceInterestRate),
            seasoningPeriod: num(brrrrIn.seasoningPeriod, 12),
          }
        : undefined,
    computed: {
      monthlyOperatingExpenses: num(monthlyExpenses.operating),
      monthlyDebtService: num(monthlyExpenses.debt),
      annualNOI: num(metrics.noi ?? metrics.annualNOI),
      walkAwayPrice: num(
        (p as { walkAwayPrice?: number }).walkAwayPrice
      ),
      postRefiMonthlyDebtService: numOpt(
        postRefinanceMetrics.newMonthlyPayment
      ),
      postRefiMonthlyCashFlow: numOpt(postRefinanceMetrics.monthlyCashFlow),
      postRefiDSCR: numOpt(postRefinanceMetrics.postRefiDSCR),
      capitalRecoveryRate: numOpt(capitalRecovery.capitalRecoveryRate),
      capitalRecovered: numOpt(capitalRecovery.capitalRecovered),
      capitalRemaining: numOpt(capitalRecovery.capitalRemaining),
    },
  };
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function numOpt(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
