/**
 * dealMetrics/formulas/rent_for_target_dscr.ts — Issue #226.
 *
 * Answers: "what rent do I need to hit a X DSCR?"
 *
 * DSCR = NOI / annual_debt_service
 *   NOI = (rent × (1 − vacancyRate) − monthlyOpEx) × 12
 *
 * Solving for rent:
 *   NOI = targetDSCR × annual_debt_service
 *   rent × (1 − v) × 12 − monthlyOpEx × 12 = targetDSCR × annual_debt_service
 *   rent × (1 − v) × 12 = targetDSCR × annual_debt_service + monthlyOpEx × 12
 *   rent = (targetDSCR × annual_debt_service + monthlyOpEx × 12)
 *          / (12 × (1 − v))
 *
 * Strategy dispatch:
 *   - buy_hold / house_hack: uses acquisition-loan debt service
 *     (computed.monthlyDebtService × 12)
 *   - brrrr: uses POST-REFI debt service
 *     (computed.postRefiMonthlyDebtService × 12) since the DSCR
 *     that lenders actually evaluate is on the refi loan
 *
 * This is the multi-strategy dispatch test-case: same concept (rent
 * for DSCR), different math per strategy.
 */

import type { DealSnapshot, MetricDef } from '../types';

type Params = {
  targetDSCR: number;
} & Record<string, number>;

export const rentForTargetDSCR: MetricDef<Params> = {
  key: 'rent_for_target_dscr',
  label: 'Monthly rent for target DSCR',
  description:
    "Computes the monthly rent required to achieve a target debt " +
    "service coverage ratio (DSCR). Use this when the user asks " +
    "'what rent do I need for 1.20 DSCR?', 'what rent gets me " +
    "lender-approvable?', or any inverse-solve on rent against DSCR. " +
    "Strategy-aware: BRRRR uses POST-REFI debt service (what " +
    "lenders actually evaluate); buy-hold uses acquisition-loan " +
    "debt service.",
  supportedStrategies: ['buy_hold', 'brrrr', 'house_hack'],
  unit: 'dollars_per_month',
  parameters: {
    targetDSCR: {
      unit: 'ratio',
      description:
        "The target DSCR (e.g., 1.20 for 1.20x). Common lender " +
        "minimums: 1.0 (portfolio, aggressive), 1.20 (Fannie/Freddie " +
        "standard), 1.25 (conservative DSCR products).",
    },
  },
  formula: (deal: DealSnapshot, params: Params): number => {
    const { targetDSCR } = params;

    if (!Number.isFinite(targetDSCR) || targetDSCR <= 0) {
      throw new Error(
        `rent_for_target_dscr: targetDSCR must be positive, got ${targetDSCR}`
      );
    }
    if (targetDSCR > 10) {
      throw new Error(
        `rent_for_target_dscr: targetDSCR=${targetDSCR} is outside plausible range (0-10)`
      );
    }

    // Strategy-aware debt service pick.
    const monthlyDebtService =
      deal.strategy === 'brrrr'
        ? deal.computed.postRefiMonthlyDebtService
        : deal.computed.monthlyDebtService;

    if (
      typeof monthlyDebtService !== 'number' ||
      !Number.isFinite(monthlyDebtService) ||
      monthlyDebtService <= 0
    ) {
      throw new Error(
        `rent_for_target_dscr: monthly debt service missing or non-positive ` +
          `(strategy=${deal.strategy}, value=${monthlyDebtService})`
      );
    }

    const annualDebtService = monthlyDebtService * 12;
    const monthlyOpEx = deal.computed.monthlyOperatingExpenses;

    if (!Number.isFinite(monthlyOpEx) || monthlyOpEx < 0) {
      throw new Error(
        `rent_for_target_dscr: monthly OpEx must be non-negative, got ${monthlyOpEx}`
      );
    }

    const vacancy = deal.vacancyRate / 100;
    if (vacancy < 0 || vacancy >= 1) {
      throw new Error(
        `rent_for_target_dscr: vacancy rate must be [0, 1); got ${deal.vacancyRate}%`
      );
    }

    // Solve for gross monthly rent:
    // targetDSCR × annualDebtService = 12 × (rent × (1 − v) − monthlyOpEx)
    const requiredAnnualNOI = targetDSCR * annualDebtService;
    const requiredMonthlyNOI = requiredAnnualNOI / 12;
    const requiredEffectiveRent = requiredMonthlyNOI + monthlyOpEx;
    const requiredGrossRent = requiredEffectiveRent / (1 - vacancy);

    return requiredGrossRent;
  },
};
