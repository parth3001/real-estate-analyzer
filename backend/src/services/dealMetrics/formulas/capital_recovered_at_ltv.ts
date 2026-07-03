/**
 * dealMetrics/formulas/capital_recovered_at_ltv.ts — Issue #226.
 *
 * Answers: "how much capital would I recover at refi if I chose X% LTV?"
 *
 * Method:
 *   capitalRecovered = refi_loan − acquisition_loan_balance
 *                    = ARV × (LTV/100) − acquisition_loan_balance
 *
 * Where acquisition_loan_balance ≈ purchasePrice − downPayment
 * (approximation ignoring the small seasoning-period paydown).
 *
 * Strategy: BRRRR only.
 *
 * Common LTV values to test:
 *   65% — very conservative (some portfolio lenders)
 *   70% — conservative (max some DSCR products offer)
 *   75% — Fannie/Freddie standard
 *   80% — aggressive DSCR products
 *
 * The result can be > totalCapitalDeployed (infinite return case) or
 * negative (LTV so low the refi doesn't even pay off the acquisition
 * loan). Both are valid outputs — no truncation.
 */

import type { DealSnapshot, MetricDef } from '../types';

type Params = {
  ltv: number; // percent, e.g., 70 for 70%
} & Record<string, number>;

export const capitalRecoveredAtLtv: MetricDef<Params> = {
  key: 'capital_recovered_at_ltv',
  label: 'Capital recovered at hypothetical refi LTV',
  description:
    "Computes the dollar amount of capital that would be recovered " +
    "at refi at a hypothetical LTV, given the current ARV. Use when " +
    "the user asks 'how much do I get out at 70% LTV?', 'how does " +
    "recovery change if I go conservative on LTV?', or any what-if " +
    "on refi LTV. BRRRR-only. Note: negative return means the refi " +
    "loan wouldn't even pay off the acquisition loan at that LTV.",
  supportedStrategies: ['brrrr'],
  unit: 'dollars',
  parameters: {
    ltv: {
      unit: 'percent',
      description:
        "The hypothetical refi LTV as a PERCENT (e.g., 70 for 70%). " +
        "Common values: 65 (very conservative portfolio), 70 " +
        "(conservative DSCR), 75 (Fannie/Freddie standard), 80 " +
        "(aggressive).",
    },
  },
  formula: (deal: DealSnapshot, params: Params): number => {
    if (!deal.brrrr) {
      throw new Error(
        "capital_recovered_at_ltv requires deal.brrrr (BRRRR-only)."
      );
    }
    const { ltv } = params;
    if (!Number.isFinite(ltv) || ltv <= 0 || ltv > 100) {
      throw new Error(
        `capital_recovered_at_ltv: LTV must be (0, 100]%; got ${ltv}`
      );
    }

    const refiLoan = deal.brrrr.afterRepairValue * (ltv / 100);
    const acquisitionLoanBalance = deal.purchasePrice - deal.downPayment;

    return refiLoan - acquisitionLoanBalance;
  },
};
