/**
 * dealMetrics/formulas/price_for_positive_cash_flow.ts — Issue #226.
 *
 * Answers: "at what purchase price does this deal have positive
 * monthly cash flow?" or "at what price does cash flow hit $X/mo?"
 *
 * Method:
 *   effective_rent = monthlyRent × (1 − vacancy)
 *   cash_flow = effective_rent − monthlyOpEx − monthlyDebtService
 *   monthlyDebtService = loanAmount × factor
 *   where factor = [r(1+r)^n] / [(1+r)^n − 1], r = monthly rate,
 *   n = loanTerm × 12
 *
 * Setting cash_flow = targetCashFlow and solving for loanAmount:
 *   loanAmount = (effective_rent − monthlyOpEx − targetCashFlow) / factor
 *   purchasePrice = loanAmount + downPayment
 *
 * Strategy: buy_hold + house_hack. For BRRRR, "cash flow" is post-
 * refi, which depends on the refi loan (ARV × refi LTV), NOT the
 * purchase price. So this formula isn't meaningful for BRRRR (refi
 * cash flow is invariant to purchase price). BRRRR investors who
 * want a similar answer should use `refi_rate_for_positive_cf` or
 * `rent_for_target_dscr`.
 *
 * SIMPLIFYING ASSUMPTION: monthlyOpEx from `deal.computed` is
 * treated as fixed. In reality, property tax + insurance scale
 * with purchase price. For a first-order approximation, this is
 * accurate within 5-10% for reasonable price ranges (±20% of
 * current). Deeper solves that recompute tax + insurance can be
 * added later as a separate formula (`price_for_positive_cash_flow_precise`).
 */

import type { DealSnapshot, MetricDef } from '../types';

type Params = {
  targetCashFlow?: number; // dollars per month, default 0
} & Record<string, number>;

export const priceForPositiveCashFlow: MetricDef<Params> = {
  key: 'price_for_positive_cash_flow',
  label: 'Max purchase price for target cash flow',
  description:
    "Computes the maximum purchase price at which monthly cash flow " +
    "equals the target (default: break-even). Use this when the user " +
    "asks 'at what price does cash flow turn positive?', 'max I can " +
    "pay to still have $X/mo cash flow?', or any solve-for-price " +
    "against cash flow. Buy-hold and house-hack only — BRRRR post-refi " +
    "cash flow is invariant to purchase price.",
  supportedStrategies: ['buy_hold', 'house_hack'],
  unit: 'dollars',
  parameters: {
    targetCashFlow: {
      unit: 'dollars_per_month',
      description:
        "Target monthly cash flow after debt service. Default 0 " +
        "(break-even). Pass a positive value to require a cushion " +
        "(e.g., 200 for $200/mo cash flow).",
      defaultValue: 0,
    },
  },
  formula: (deal: DealSnapshot, params: Params): number => {
    const target = params.targetCashFlow ?? 0;

    const vacancy = deal.vacancyRate / 100;
    if (vacancy < 0 || vacancy >= 1) {
      throw new Error(
        `price_for_positive_cash_flow: vacancy must be [0, 1); got ${deal.vacancyRate}%`
      );
    }

    const effectiveRent = deal.monthlyRent * (1 - vacancy);
    const monthlyOpEx = deal.computed.monthlyOperatingExpenses;

    // Available for debt service after opex and target cushion.
    const maxMonthlyDebtService = effectiveRent - monthlyOpEx - target;

    if (maxMonthlyDebtService <= 0) {
      throw new Error(
        `price_for_positive_cash_flow: effective rent ($${effectiveRent.toFixed(0)}) ` +
          `minus OpEx ($${monthlyOpEx.toFixed(0)}) minus target cash flow ($${target}) ` +
          `is ≤ 0 — no purchase price makes this deal work at these inputs.`
      );
    }

    // Amortization factor for the acquisition loan terms.
    const r = deal.interestRate / 100 / 12;
    const n = deal.loanTerm * 12;
    if (r <= 0 || n <= 0) {
      throw new Error(
        `price_for_positive_cash_flow: invalid loan terms r=${r}, n=${n}`
      );
    }
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Max loan amount that produces the target debt service.
    const maxLoanAmount = maxMonthlyDebtService / factor;

    // Purchase price = loan + down payment.
    return maxLoanAmount + deal.downPayment;
  },
};
