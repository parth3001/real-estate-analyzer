/**
 * dealMetrics/formulas/break_even_occupancy.ts — Issue #226.
 *
 * Answers: "at what occupancy rate does this deal break even?"
 *
 * Method:
 *   effective_rent × occupancy − monthlyOpEx − monthlyDebtService = 0
 *   occupancy = (monthlyOpEx + monthlyDebtService) / monthlyRent
 *
 * Where "effective_rent × occupancy" means "rent × (fraction of
 * months tenant is paying)". A break-even occupancy of 95% means
 * you can afford ~5% vacancy before cash flow turns negative.
 *
 * Note: this is DIFFERENT from the input `vacancyRate`. Break-even
 * occupancy is a RESULT that tells you the deal's fragility to
 * vacancy events. If break-even = 90%, you have a 10-percentage-
 * point cushion. If break-even = 100%, any vacancy sinks you.
 *
 * Strategy-aware:
 *   - buy_hold / house_hack: uses acquisition-loan debt service
 *   - brrrr: uses POST-REFI debt service (the ongoing obligation)
 *
 * Returns a percentage (e.g., 95 for 95%). Values > 100% mean the
 * deal is unlendable at any occupancy — flag it as an error.
 */

import type { DealSnapshot, MetricDef } from '../types';

export const breakEvenOccupancy: MetricDef<Record<string, never>> = {
  key: 'break_even_occupancy',
  label: 'Break-even occupancy rate',
  description:
    "Computes the occupancy percentage (0-100) at which monthly cash " +
    "flow equals zero. Below this occupancy, the deal loses money each " +
    "month. Use when the user asks 'how much vacancy can I handle?', " +
    "'what's my occupancy cushion?', or 'when does this deal break " +
    "even on vacancy?'. Strategy-aware: BRRRR uses post-refi debt " +
    "service (ongoing obligation), buy-hold uses acquisition debt.",
  supportedStrategies: ['buy_hold', 'brrrr', 'house_hack'],
  unit: 'percent',
  formula: (deal: DealSnapshot): number => {
    const monthlyDebtService =
      deal.strategy === 'brrrr'
        ? deal.computed.postRefiMonthlyDebtService
        : deal.computed.monthlyDebtService;

    if (
      typeof monthlyDebtService !== 'number' ||
      !Number.isFinite(monthlyDebtService)
    ) {
      throw new Error(
        `break_even_occupancy: monthly debt service missing ` +
          `(strategy=${deal.strategy}, value=${monthlyDebtService})`
      );
    }
    if (monthlyDebtService < 0) {
      throw new Error(
        `break_even_occupancy: monthly debt service must be non-negative, got ${monthlyDebtService}`
      );
    }
    if (deal.monthlyRent <= 0) {
      throw new Error(
        `break_even_occupancy: monthly rent must be positive, got ${deal.monthlyRent}`
      );
    }

    const monthlyOpEx = deal.computed.monthlyOperatingExpenses;
    const requiredEffectiveRent = monthlyOpEx + monthlyDebtService;
    const occupancy = (requiredEffectiveRent / deal.monthlyRent) * 100;

    if (occupancy > 100) {
      throw new Error(
        `break_even_occupancy: ${occupancy.toFixed(1)}% — ` +
          `deal cannot break even at ANY occupancy. ` +
          `Required effective rent ($${requiredEffectiveRent.toFixed(0)}/mo) ` +
          `exceeds gross rent ($${deal.monthlyRent}/mo). ` +
          `Either rent needs to increase or costs need to decrease.`
      );
    }
    return occupancy;
  },
};
