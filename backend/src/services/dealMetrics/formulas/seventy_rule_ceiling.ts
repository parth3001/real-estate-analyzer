/**
 * dealMetrics/formulas/seventy_rule_ceiling.ts — Issue #226 (2026-07-03).
 *
 * Answers: "at what purchase price would this deal pass the 70% rule?"
 *
 * Formula: max_purchase = 0.70 × ARV − rehab_budget
 *
 * Motivation:
 *   - Test 2 A1 confabulation. LLM was asked this exact question and
 *     invented "$253,815" (using wrong reasoning against walk-away
 *     price). This formula makes that failure mode impossible: the
 *     LLM can only cite the deterministic result.
 *
 * Strategy: BRRRR-only. The 70% rule is a BRRRR heuristic (accounts
 * for rehab against ARV). Runner rejects the call on buy-hold deals.
 */

import type { DealSnapshot, MetricDef } from '../types';

export const sevenTyRuleCeiling: MetricDef<Record<string, never>> = {
  key: 'seventy_rule_ceiling',
  label: '70% rule maximum purchase price',
  description:
    "Computes the maximum purchase price for a BRRRR deal to satisfy " +
    "the 70% rule: (0.70 × ARV) − rehab budget. Use this when the " +
    "user asks 'at what price does the 70% rule pass?', 'what's my " +
    "70% rule target?', or any inverse-solve on price against the " +
    "70% rule. BRRRR-only.",
  supportedStrategies: ['brrrr'],
  unit: 'dollars',
  formula: (deal: DealSnapshot): number => {
    if (!deal.brrrr) {
      throw new Error(
        "seventy_rule_ceiling requires deal.brrrr to be populated (BRRRR-only)."
      );
    }
    const arv = deal.brrrr.afterRepairValue;
    const rehab = deal.brrrr.rehabBudget;
    if (!Number.isFinite(arv) || arv <= 0) {
      throw new Error(
        `seventy_rule_ceiling: ARV must be positive, got ${arv}`
      );
    }
    if (!Number.isFinite(rehab) || rehab < 0) {
      throw new Error(
        `seventy_rule_ceiling: rehab budget must be non-negative, got ${rehab}`
      );
    }
    return 0.7 * arv - rehab;
  },
};
