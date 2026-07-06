/**
 * dealMetrics/registry.ts — Issue #226 (2026-07-03).
 *
 * The formula registry. Add a new formula by importing it and adding
 * it to `formulas`. That's the only file that changes when we grow
 * the coverage.
 *
 * Registry is intentionally hand-maintained (not auto-discovered)
 * so new formulas are code-reviewed deliberately and the LLM-facing
 * catalogue stays curated.
 */

import type { MetricDef } from './types';
import { sevenTyRuleCeiling } from './formulas/seventy_rule_ceiling';
import { priceForTargetCapRate } from './formulas/price_for_target_cap_rate';
import { rentForTargetDSCR } from './formulas/rent_for_target_dscr';
import { priceForPositiveCashFlow } from './formulas/price_for_positive_cash_flow';
import { arvForFullCapitalRecovery } from './formulas/arv_for_full_capital_recovery';
import { breakEvenOccupancy } from './formulas/break_even_occupancy';
import { capitalRecoveredAtLtv } from './formulas/capital_recovered_at_ltv';
import { annualCashFlow } from './formulas/annual_cash_flow';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formulas: MetricDef<any>[] = [
  sevenTyRuleCeiling,
  priceForTargetCapRate,
  rentForTargetDSCR,
  priceForPositiveCashFlow,
  arvForFullCapitalRecovery,
  breakEvenOccupancy,
  capitalRecoveredAtLtv,
  annualCashFlow,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const byKey: Map<string, MetricDef<any>> = new Map(
  formulas.map((f) => [f.key, f])
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFormula(key: string): MetricDef<any> | undefined {
  return byKey.get(key);
}

export function listMetricKeys(): string[] {
  return formulas.map((f) => f.key);
}

/**
 * List all metrics that apply to a given strategy — used to help the
 * LLM see the menu when it's picking a formula.
 *
 * IMPORTANT (2026-07-06): each menu entry INCLUDES the parameters
 * spec so the LLM knows exactly what to pass. Prior to this, the
 * LLM saw {key, label, description} and had to guess parameter
 * names — observed: 3 back-to-back rent_for_target_dscr calls all
 * missing the targetDSCR param, agent hit maxTurns and produced no
 * final text.
 */
export function listMetricsForStrategy(
  strategy: 'buy_hold' | 'brrrr' | 'house_hack'
): Array<{
  key: string;
  label: string;
  description: string;
  parameters: Array<{ name: string; unit: string; description: string; required: boolean; defaultValue?: number | string | boolean }>;
}> {
  return formulas
    .filter((f) => f.supportedStrategies.includes(strategy))
    .map((f) => ({
      key: f.key,
      label: f.label,
      description: f.description,
      parameters: f.parameters
        ? Object.entries(f.parameters).map(([name, spec]) => ({
            name,
            unit: spec.unit,
            description: spec.description,
            required: spec.defaultValue === undefined,
            defaultValue: spec.defaultValue,
          }))
        : [],
    }));
}
