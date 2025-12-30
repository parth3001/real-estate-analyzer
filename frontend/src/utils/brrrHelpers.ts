/**
 * BRRRR Strategy Helper Functions
 *
 * Utility functions for BRRRR-specific calculations and formatting
 * Used across BRRRR display tabs (Financial Details, Capital Recovery, Long-term Analysis, Tax Intelligence)
 *
 * Design Philosophy:
 * - DRY (Don't Repeat Yourself): Centralized calculation logic
 * - Type Safety: Full TypeScript support with proper types
 * - Financial Precision: Full floating-point precision, round only for display
 * - Business Logic Separation: Pure functions, no side effects
 */

import { formatCurrency } from './formatters';

/**
 * BRRRR Capital Recovery Calculation
 *
 * Calculates how much of the initial investment is recovered through refinancing
 *
 * Formula: (Refinance Proceeds - Mortgage Payoff) / Total Investment × 100
 *
 * @param refinanceProceeds - Cash received from refinance (ARV × refinanceLTV)
 * @param mortgagePayoff - Remaining mortgage balance at refinance
 * @param totalInvestment - Down payment + closing costs + rehab budget
 * @returns Capital recovery rate as percentage (0-100+)
 *
 * Business Context:
 * - 100%+ = "Infinite Return" - All capital recovered
 * - 75-99% = Excellent capital recovery
 * - 50-74% = Good capital recovery
 * - <50% = Poor capital recovery, consider longer hold
 */
export function calculateCapitalRecoveryRate(
  refinanceProceeds: number,
  mortgagePayoff: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  const capitalRecovered = refinanceProceeds - mortgagePayoff;
  return (capitalRecovered / totalInvestment) * 100;
}

/**
 * Calculate capital recovered (dollar amount)
 *
 * @param refinanceProceeds - Cash received from refinance
 * @param mortgagePayoff - Remaining mortgage balance
 * @returns Dollar amount of capital recovered
 */
export function calculateCapitalRecovered(
  refinanceProceeds: number,
  mortgagePayoff: number
): number {
  return refinanceProceeds - mortgagePayoff;
}

/**
 * Calculate capital remaining in deal
 *
 * @param totalInvestment - Total capital invested
 * @param capitalRecovered - Capital pulled out via refinance
 * @returns Dollar amount still invested in property
 */
export function calculateCapitalRemaining(
  totalInvestment: number,
  capitalRecovered: number
): number {
  return Math.max(0, totalInvestment - capitalRecovered);
}

/**
 * Calculate effective Cash-on-Cash return after refinance
 *
 * For infinite return scenarios (100%+ capital recovery), this returns Infinity
 * For partial recovery, uses remaining capital as denominator
 *
 * @param annualCashFlow - Post-refinance annual cash flow
 * @param capitalRemaining - Capital still invested after refinance
 * @returns Effective CoC as percentage, or Infinity if no capital remains
 */
export function calculateEffectiveCashOnCash(
  annualCashFlow: number,
  capitalRemaining: number
): number {
  if (capitalRemaining === 0 || capitalRemaining < 1) {
    // Infinite return scenario
    return Infinity;
  }
  return (annualCashFlow / capitalRemaining) * 100;
}

/**
 * Format dual-period metric (Initial Hold vs Post-Refinance)
 *
 * @param initialValue - Value during initial hold period
 * @param postRefinanceValue - Value after refinance
 * @param type - 'currency' or 'percentage'
 * @returns Formatted string showing both values and delta
 *
 * Example: "$1,200/mo → $950/mo (-21%)"
 */
export interface DualPeriodMetric {
  initial: number;
  postRefinance: number;
  delta: number; // Absolute difference
  deltaPercent: number; // Percentage change
}

export function calculateDualPeriodDelta(
  initialValue: number,
  postRefinanceValue: number
): DualPeriodMetric {
  const delta = postRefinanceValue - initialValue;
  const deltaPercent = initialValue !== 0 ? (delta / initialValue) * 100 : 0;

  return {
    initial: initialValue,
    postRefinance: postRefinanceValue,
    delta,
    deltaPercent
  };
}

/**
 * Format dual period metric for display
 *
 * @param metric - DualPeriodMetric object
 * @param type - 'currency' or 'percentage'
 * @returns Formatted string
 */
export function formatDualPeriodMetric(
  metric: DualPeriodMetric,
  type: 'currency' | 'percentage' = 'currency'
): string {
  const formatter = type === 'currency' ? formatCurrency : (v: number) => `${v.toFixed(2)}%`;

  const initialFormatted = formatter(metric.initial);
  const postRefinanceFormatted = formatter(metric.postRefinance);
  const deltaSign = metric.delta >= 0 ? '+' : '';
  const deltaPercentFormatted = `${deltaSign}${metric.deltaPercent.toFixed(1)}%`;

  return `${initialFormatted} → ${postRefinanceFormatted} (${deltaPercentFormatted})`;
}

/**
 * Get color for delta indicator
 *
 * Business logic:
 * - Cash flow increase = good (green)
 * - Cash flow decrease = bad (red)
 * - Expenses decrease = good (green)
 * - Expenses increase = bad (red)
 *
 * @param deltaPercent - Percentage change
 * @param isExpense - True if metric represents an expense (inverts color logic)
 * @returns Color code for Apple Design System
 */
export function getDeltaColor(
  deltaPercent: number,
  isExpense: boolean = false
): 'green' | 'red' | 'gray' {
  if (Math.abs(deltaPercent) < 0.5) return 'gray'; // No meaningful change

  const isPositive = deltaPercent > 0;

  if (isExpense) {
    // For expenses: decrease is good (green), increase is bad (red)
    return isPositive ? 'red' : 'green';
  } else {
    // For income: increase is good (green), decrease is bad (red)
    return isPositive ? 'green' : 'red';
  }
}

/**
 * Calculate refinance proceeds
 *
 * @param afterRepairValue - ARV after rehab
 * @param refinanceLTV - Loan-to-Value ratio (65-85%)
 * @returns Refinance loan amount
 */
export function calculateRefinanceProceeds(
  afterRepairValue: number,
  refinanceLTV: number
): number {
  return afterRepairValue * (refinanceLTV / 100);
}

/**
 * Calculate total BRRRR investment
 *
 * @param purchasePrice - Original purchase price
 * @param downPayment - Down payment amount
 * @param closingCosts - Purchase closing costs
 * @param rehabBudget - Total rehab/renovation costs
 * @returns Total capital invested
 */
export function calculateTotalBRRRRInvestment(
  purchasePrice: number,
  downPayment: number,
  closingCosts: number,
  rehabBudget: number
): number {
  return downPayment + closingCosts + rehabBudget;
}

/**
 * Determine BRRRR verdict based on capital recovery rate
 *
 * @param capitalRecoveryRate - Percentage of capital recovered (0-100+)
 * @returns Verdict object with label and color
 */
export interface BRRRRVerdict {
  label: string;
  color: 'green' | 'blue' | 'orange' | 'red';
  description: string;
}

export function getBRRRRVerdict(capitalRecoveryRate: number): BRRRRVerdict {
  if (capitalRecoveryRate >= 100) {
    return {
      label: 'INFINITE RETURN',
      color: 'green',
      description: 'All capital recovered - Infinite return achieved!'
    };
  } else if (capitalRecoveryRate >= 75) {
    return {
      label: 'EXCELLENT',
      color: 'blue',
      description: 'Exceptional capital recovery for BRRRR strategy'
    };
  } else if (capitalRecoveryRate >= 50) {
    return {
      label: 'GOOD',
      color: 'orange',
      description: 'Solid capital recovery, consider holding longer for more'
    };
  } else {
    return {
      label: 'POOR',
      color: 'red',
      description: 'Low capital recovery - Hold longer or reconsider refinance timing'
    };
  }
}

/**
 * Calculate forced appreciation (equity created through rehab)
 *
 * @param afterRepairValue - ARV after rehab
 * @param purchasePrice - Original purchase price
 * @param rehabBudget - Total rehab costs
 * @returns Forced appreciation amount and ROI
 */
export interface ForcedAppreciation {
  equityCreated: number; // ARV - Purchase Price
  rehabROI: number; // (Equity Created - Rehab Cost) / Rehab Cost × 100
  netGain: number; // Equity Created - Rehab Cost
}

export function calculateForcedAppreciation(
  afterRepairValue: number,
  purchasePrice: number,
  rehabBudget: number
): ForcedAppreciation {
  const equityCreated = afterRepairValue - purchasePrice;
  const netGain = equityCreated - rehabBudget;
  const rehabROI = rehabBudget > 0 ? (netGain / rehabBudget) * 100 : 0;

  return {
    equityCreated,
    rehabROI,
    netGain
  };
}

/**
 * Calculate time to refinance (includes rehab time + seasoning period)
 *
 * @param estimatedRehabTime - Months to complete rehab (default 2)
 * @param seasoningPeriod - Lender seasoning requirement in months (6-24)
 * @returns Total months from purchase to refinance
 */
export function calculateTimeToRefinance(
  estimatedRehabTime: number = 2,
  seasoningPeriod: number = 12
): number {
  return estimatedRehabTime + seasoningPeriod;
}

/**
 * Estimate carrying costs during initial hold period
 *
 * @param monthlyMortgage - Purchase mortgage payment
 * @param monthlyExpenses - Property taxes, insurance, utilities during rehab
 * @param monthsToRefinance - Total months from purchase to refinance
 * @returns Total carrying costs
 */
export function calculateCarryingCosts(
  monthlyMortgage: number,
  monthlyExpenses: number,
  monthsToRefinance: number
): number {
  return (monthlyMortgage + monthlyExpenses) * monthsToRefinance;
}

/**
 * Check if property qualifies for infinite return status
 *
 * @param capitalRecoveryRate - Percentage of capital recovered
 * @returns True if infinite return achieved (100%+)
 */
export function isInfiniteReturn(capitalRecoveryRate: number): boolean {
  return capitalRecoveryRate >= 100;
}

/**
 * Format infinite return display value
 *
 * For infinite return scenarios, shows "∞" instead of percentage
 *
 * @param value - CoC percentage value
 * @param isInfinite - Whether this is an infinite return scenario
 * @returns Formatted string
 */
export function formatInfiniteReturn(value: number, isInfinite: boolean): string {
  if (isInfinite || value === Infinity) {
    return '∞';
  }
  return `${value.toFixed(1)}%`;
}
