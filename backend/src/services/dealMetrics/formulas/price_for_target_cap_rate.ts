/**
 * dealMetrics/formulas/price_for_target_cap_rate.ts — Issue #226.
 *
 * Answers: "at what purchase price would this deal hit a X% cap rate?"
 *
 * Formula: max_purchase = annualNOI / targetCapRate
 *
 * (Cap rate = NOI / price → solve for price given target cap rate.)
 *
 * Strategy: strategy-agnostic. Every strategy has an NOI. The
 * meaning of "purchase price for target cap rate" is the same
 * regardless. This is the test-case for the strategy-agnostic path.
 *
 * Parameters:
 *   targetCapRate: percent (e.g., 7 for 7%). Required from user or LLM.
 */

import type { DealSnapshot, MetricDef } from '../types';

type Params = {
  targetCapRate: number;
} & Record<string, number>;

export const priceForTargetCapRate: MetricDef<Params> = {
  key: 'price_for_target_cap_rate',
  label: 'Purchase price for target cap rate',
  description:
    "Computes the maximum purchase price to achieve a target cap " +
    "rate given the deal's current NOI. Use this when the user asks " +
    "'at what price does this hit an X% cap rate?', 'what's the max " +
    "I can pay for X% cap rate?', or any solve-for-price against a " +
    "cap rate target. Strategy-agnostic — works for buy-hold, BRRRR " +
    "(pre-refi context), and house-hack.",
  supportedStrategies: ['buy_hold', 'brrrr', 'house_hack'],
  unit: 'dollars',
  parameters: {
    targetCapRate: {
      unit: 'percent',
      description:
        "The target cap rate in PERCENT (e.g., 7 for 7%, not 0.07). " +
        "Common values: 5-6% (competitive markets), 7-8% (typical " +
        "cash-flow-focused), 9%+ (aggressive / distressed).",
    },
  },
  formula: (deal: DealSnapshot, params: Params): number => {
    const { targetCapRate } = params;
    const noi = deal.computed.annualNOI;

    if (!Number.isFinite(targetCapRate) || targetCapRate <= 0) {
      throw new Error(
        `price_for_target_cap_rate: targetCapRate must be positive, got ${targetCapRate}`
      );
    }
    if (targetCapRate > 100) {
      throw new Error(
        `price_for_target_cap_rate: targetCapRate=${targetCapRate}% appears to be in decimal form. ` +
          `Use 7 (not 0.07) for 7%.`
      );
    }
    if (!Number.isFinite(noi)) {
      throw new Error(
        `price_for_target_cap_rate: annualNOI missing or non-finite (got ${noi})`
      );
    }
    if (noi <= 0) {
      throw new Error(
        `price_for_target_cap_rate: annualNOI must be positive to solve for price; ` +
          `deal has NOI=${noi} (negative or zero — deal has no positive cap rate at any price).`
      );
    }

    // targetCapRate is a percent (7 means 7%), so divide by 100 to
    // get the decimal used in `NOI / rate = price`.
    return noi / (targetCapRate / 100);
  },
};
