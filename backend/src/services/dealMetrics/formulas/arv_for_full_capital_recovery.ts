/**
 * dealMetrics/formulas/arv_for_full_capital_recovery.ts — Issue #226.
 *
 * Answers: "at what ARV would I recover 100% of my capital at refi?"
 *
 * Method:
 *   capitalRecovered = refi_loan − acquisition_loan_balance
 *                    = ARV × (refiLTV/100) − acquisition_loan_balance
 *   For "full recovery", we want:
 *     capitalRecovered = totalCapitalDeployed
 *   Where totalCapitalDeployed = downPayment + rehab + closing
 *
 *   Solving for ARV:
 *     ARV = (totalCapitalDeployed + acquisition_loan_balance) / (refiLTV/100)
 *
 * SIMPLIFYING ASSUMPTION: acquisition_loan_balance is approximated
 * as the ORIGINAL loan amount (purchasePrice − downPayment). Loan
 * paydown over a typical 12-month seasoning is <1% of principal, so
 * this understates ARV by a similar tiny fraction. Precise version
 * with amortized balance can be added later.
 *
 * Strategy: BRRRR only — "capital recovery" is a BRRRR concept.
 */

import type { DealSnapshot, MetricDef } from '../types';

export const arvForFullCapitalRecovery: MetricDef<Record<string, never>> = {
  key: 'arv_for_full_capital_recovery',
  label: 'ARV for 100% capital recovery',
  description:
    "Computes the after-repair value at which the refi cash-out fully " +
    "recovers all capital deployed (down payment + rehab + closing). " +
    "Use when the user asks 'what ARV do I need for full BRRRR?' or " +
    "'at what appraisal does capital recovery hit 100%?'. BRRRR-only.",
  supportedStrategies: ['brrrr'],
  unit: 'dollars',
  formula: (deal: DealSnapshot): number => {
    if (!deal.brrrr) {
      throw new Error(
        "arv_for_full_capital_recovery requires deal.brrrr (BRRRR-only)."
      );
    }

    const totalCapitalDeployed =
      deal.downPayment + deal.brrrr.rehabBudget + deal.closingCosts;
    const acquisitionLoanBalance = deal.purchasePrice - deal.downPayment;

    if (acquisitionLoanBalance < 0) {
      throw new Error(
        `arv_for_full_capital_recovery: acquisition loan balance is negative — ` +
          `down payment (${deal.downPayment}) exceeds purchase price (${deal.purchasePrice}).`
      );
    }

    const refiLTV = deal.brrrr.refinanceLTV / 100;
    if (refiLTV <= 0 || refiLTV >= 1) {
      throw new Error(
        `arv_for_full_capital_recovery: refi LTV must be (0, 100)%; got ${deal.brrrr.refinanceLTV}%`
      );
    }

    return (totalCapitalDeployed + acquisitionLoanBalance) / refiLTV;
  },
};
