/**
 * dealMetrics/index.ts — Issue #226 (2026-07-03).
 *
 * Public API for compute_deal_metric.
 *
 * Consumers (LLM tools, workspace hero, PDF text, chat card):
 *   import { computeMetric, formatMetricValue } from '.../dealMetrics';
 *
 * NEVER: consumers reach into individual formula files. Everything
 * goes through the runner so validation + strategy dispatch happens
 * consistently.
 */

import { getFormula, listMetricKeys, listMetricsForStrategy } from './registry';
import type {
  DealSnapshot,
  MetricResult,
  MetricUnit,
  FormulaParameters,
} from './types';

export type { DealSnapshot, MetricResult, MetricUnit } from './types';
export { listMetricsForStrategy };

/**
 * The single compute entry point. Handles:
 *   1. Unknown metric key
 *   2. Strategy mismatch (formula doesn't support this deal's strategy)
 *   3. Parameter defaults + validation
 *   4. Formula execution + error catch
 *   5. Display formatting
 *   6. Full audit trail (which inputs from the deal fed the result)
 */
export function computeMetric(
  metricKey: string,
  deal: DealSnapshot,
  params: FormulaParameters = {}
): MetricResult {
  const def = getFormula(metricKey);
  if (!def) {
    return {
      kind: 'unknown_metric',
      metric: metricKey,
      availableMetrics: listMetricKeys(),
    };
  }

  if (!def.supportedStrategies.includes(deal.strategy)) {
    return {
      kind: 'unsupported_strategy',
      metric: metricKey,
      reason:
        `The metric '${def.key}' (${def.label}) applies to ` +
        `${def.supportedStrategies.join(', ')} deals, but this deal is ` +
        `${deal.strategy}.`,
      dealStrategy: deal.strategy,
      supportedStrategies: def.supportedStrategies,
    };
  }

  // Fill defaults where the LLM omitted a param.
  const finalParams: FormulaParameters = { ...params };
  if (def.parameters) {
    for (const [pKey, pDef] of Object.entries(def.parameters)) {
      if (finalParams[pKey] === undefined && pDef.defaultValue !== undefined) {
        finalParams[pKey] = pDef.defaultValue;
      }
    }
  }

  let result: number;
  try {
    result = def.formula(deal, finalParams);
  } catch (err) {
    return {
      kind: 'error',
      metric: metricKey,
      reason: err instanceof Error ? err.message : String(err),
    };
  }

  if (!Number.isFinite(result)) {
    return {
      kind: 'error',
      metric: metricKey,
      reason: `Formula produced a non-finite result (${result}).`,
    };
  }

  // Extract the subset of deal inputs the formula legitimately touched.
  // For v1 we surface a curated summary (per-formula whitelist would
  // be cleaner but adds boilerplate for each formula). This
  // approximation gives auditable provenance for the common metrics.
  const inputsUsed = pickInputsUsed(deal, metricKey);

  return {
    kind: 'success',
    metric: metricKey,
    label: def.label,
    result,
    unit: def.unit,
    formatted: formatMetricValue(result, def.unit),
    inputsUsed: { ...inputsUsed, ...finalParams },
    strategy: deal.strategy,
  };
}

/**
 * Format a number for user-visible display per its unit. Called by
 * the runner; also exposed for surfaces that need to format a value
 * that already came from a metric computation.
 *
 * FINANCIAL PRECISION PRINCIPLE (per CLAUDE.md):
 *   - Rounding here is for DISPLAY ONLY.
 *   - The raw `result` field on MetricSuccessResult carries full
 *     precision — downstream re-computation (chained formulas, PDF
 *     re-rendering with different formatting) should read `result`,
 *     not `formatted`.
 */
export function formatMetricValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'dollars':
    case 'dollars_per_month':
    case 'dollars_per_year': {
      const sign = value < 0 ? '-' : '';
      const abs = Math.abs(Math.round(value));
      const suffix =
        unit === 'dollars_per_month'
          ? '/mo'
          : unit === 'dollars_per_year'
            ? '/yr'
            : '';
      return `${sign}$${abs.toLocaleString('en-US')}${suffix}`;
    }
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'years':
      return `${value.toFixed(1)} yr`;
    case 'months':
      return `${Math.round(value)} mo`;
    case 'count':
      return String(Math.round(value));
    default: {
      const _exhaustive: never = unit;
      void _exhaustive;
      return String(value);
    }
  }
}

/**
 * Curated map of which deal inputs each metric legitimately reads.
 * Kept here (rather than declared on each formula) as a start; if
 * we grow to 30+ formulas and this map becomes unwieldy, promote
 * `inputsUsed` to a per-formula method.
 */
function pickInputsUsed(
  deal: DealSnapshot,
  metricKey: string
): Record<string, number | string | boolean> {
  switch (metricKey) {
    case 'seventy_rule_ceiling':
      return {
        afterRepairValue: deal.brrrr?.afterRepairValue ?? 0,
        rehabBudget: deal.brrrr?.rehabBudget ?? 0,
      };
    case 'price_for_target_cap_rate':
      return {
        annualNOI: deal.computed.annualNOI,
      };
    case 'rent_for_target_dscr':
      return {
        strategy: deal.strategy,
        monthlyDebtService:
          deal.strategy === 'brrrr'
            ? (deal.computed.postRefiMonthlyDebtService ?? 0)
            : deal.computed.monthlyDebtService,
        monthlyOperatingExpenses: deal.computed.monthlyOperatingExpenses,
        vacancyRate: deal.vacancyRate,
      };
    default:
      return {};
  }
}
