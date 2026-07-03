/**
 * dealMetrics/formulas/annual_cash_flow.ts — Issue #226.
 *
 * Answers: "what's this deal's annual cash flow?"
 *
 * Method:
 *   annualCashFlow = 12 × (effectiveRent − monthlyOpEx − monthlyDebtService)
 *   where effectiveRent = rent × (1 − vacancy)
 *
 * Strategy-aware:
 *   - buy_hold / house_hack: acquisition-loan debt service
 *   - brrrr: POST-REFI debt service (the ongoing obligation for 10+ years)
 *
 * Rationale for including this as an explicit formula (even though
 * the engine already computes monthlyCashFlow): the LLM often asks
 * "what's the annual cash flow?" and would otherwise compute
 * `monthly × 12` in its head — creating an arithmetic opportunity
 * for confabulation. Explicit tool eliminates that surface.
 */

import type { DealSnapshot, MetricDef } from '../types';

export const annualCashFlow: MetricDef<Record<string, never>> = {
  key: 'annual_cash_flow',
  label: 'Annual cash flow',
  description:
    "Computes the deal's annual cash flow (12 × monthly cash flow). " +
    "Strategy-aware: BRRRR uses post-refi cash flow (what you live " +
    "with for the hold period), buy-hold uses acquisition-loan cash " +
    "flow. Use when the user asks 'what's the yearly cash flow?', " +
    "'how much do I make/lose each year?', or any conversion between " +
    "monthly and annual cash-flow figures.",
  supportedStrategies: ['buy_hold', 'brrrr', 'house_hack'],
  unit: 'dollars_per_year',
  formula: (deal: DealSnapshot): number => {
    const vacancy = deal.vacancyRate / 100;
    if (vacancy < 0 || vacancy >= 1) {
      throw new Error(
        `annual_cash_flow: vacancy must be [0, 1); got ${deal.vacancyRate}%`
      );
    }
    const effectiveRent = deal.monthlyRent * (1 - vacancy);
    const monthlyOpEx = deal.computed.monthlyOperatingExpenses;

    const monthlyDebtService =
      deal.strategy === 'brrrr'
        ? deal.computed.postRefiMonthlyDebtService
        : deal.computed.monthlyDebtService;

    if (
      typeof monthlyDebtService !== 'number' ||
      !Number.isFinite(monthlyDebtService)
    ) {
      throw new Error(
        `annual_cash_flow: monthly debt service missing ` +
          `(strategy=${deal.strategy}, value=${monthlyDebtService})`
      );
    }

    const monthlyCashFlow = effectiveRent - monthlyOpEx - monthlyDebtService;
    return monthlyCashFlow * 12;
  },
};
