/**
 * Buy & Hold Metric Definitions - Single Source of Truth for Buy & Hold Strategy
 *
 * Field Mappings Source: /docs/METRICS_REORGANIZATION_PLAN.md (lines 50-66)
 * Architect: As documented in METRICS_REORGANIZATION_PLAN.md
 *
 * This file contains all metric definitions for Single-Family Residential (SFR) Buy & Hold properties.
 * Each metric includes:
 * - id: Unique identifier
 * - label: User-facing display name
 * - description: Educational tooltip content
 * - getValue: Function to extract value from analysis object (EXACT backend field mappings)
 * - format: Display format matching existing AnalysisResults.tsx patterns
 * - tier: Progressive disclosure tier (1, 2, or 3)
 * - applicableStrategies: Which strategies use this metric (undefined = all strategies)
 *
 * CRITICAL: This is presentation logic only. All calculations come from backend.
 * See Issue #31 for technical debt regarding frontend calculation duplication.
 */

import type { Analysis } from '../../../../types/analysis';
import type { SFRPropertyData } from '../../../../types/property';

export type MetricFormat = 'currency' | 'percent' | 'decimal' | 'score' | 'number';
export type MetricStatus = 'positive' | 'negative' | 'warning' | 'neutral';
export type InvestmentStrategy = 'buy-hold' | 'house-hack' | 'brrrr';

export interface MetricDefinition {
  id: string;
  label: string | ((analysis: Analysis, propertyData?: SFRPropertyData) => string); // Support dynamic labels
  description: string | ((analysis: Analysis, propertyData?: SFRPropertyData) => string); // Support dynamic descriptions
  getValue: (analysis: Analysis, propertyData?: SFRPropertyData) => number;
  format: MetricFormat;
  tier: 1 | 2 | 3;
  getStatus?: (value: number) => MetricStatus; // Optional status logic
  applicableStrategies?: InvestmentStrategy[]; // If undefined, applies to all strategies
}

/**
 * Tier 1: Critical Decision Metrics (Always Visible)
 * These 3 metrics answer: "Should I pursue this deal?"
 * Source: Lines 211-244 in AnalysisResults.tsx
 */
export const TIER_1_METRICS: MetricDefinition[] = [
  {
    id: 'monthlyCashFlow',
    label: 'Monthly Cash Flow',
    description: 'Net monthly income after all expenses',
    // Source: METRICS_REORGANIZATION_PLAN.md line 49
    getValue: (analysis) => analysis?.monthlyAnalysis?.cashFlow || 0,
    format: 'currency',
    tier: 1,
    getStatus: (value) => value >= 0 ? 'positive' : 'negative',
    // Applies to all strategies (Buy & Hold, BRRRR, House Hack)
    applicableStrategies: undefined
  },
  {
    id: 'capRate',
    label: 'Cap Rate',
    description: 'Annual return based on property value',
    // Source: METRICS_REORGANIZATION_PLAN.md line 48 (matches MF line 174)
    getValue: (analysis) => analysis?.keyMetrics?.capRate || 0,
    format: 'percent',
    tier: 1,
    getStatus: (value) => value >= 5 ? 'positive' : value >= 3 ? 'warning' : 'negative',
    // Applies to all strategies
    applicableStrategies: undefined
  },
  {
    id: 'totalInvestment',
    label: 'Total Cash Needed',
    description: 'Total upfront investment required',
    // Source: METRICS_REORGANIZATION_PLAN.md line 54
    getValue: (analysis, propertyData) => {
      // Backend first, frontend fallback
      if (analysis?.keyMetrics?.totalInvestment) {
        return analysis.keyMetrics.totalInvestment;
      }
      // Fallback calculation (matches line 274)
      return (propertyData?.downPayment || 0) +
             (propertyData?.closingCosts || 0) +
             (propertyData?.repairCosts || 0);
    },
    format: 'currency',
    tier: 1,
    getStatus: () => 'neutral',
    // Applies to all strategies
    applicableStrategies: undefined
  }
];

/**
 * Tier 2: Professional Financial Metrics (Collapsible)
 * These 7 metrics answer: "How strong is this investment financially?"
 * Source: Lines 246-335 in AnalysisResults.tsx
 */
export const TIER_2_METRICS: MetricDefinition[] = [
  {
    id: 'cashOnCashReturn',
    label: 'Cash-on-Cash Return',
    description: 'Annual cash return on invested capital',
    // Source: AnalysisResults.tsx line 230 (SFR) and line 203 (MF)
    getValue: (analysis) => analysis?.keyMetrics?.cashOnCashReturn || 0,
    format: 'percent',
    tier: 2,
    getStatus: (value) => value >= 8 ? 'positive' : value >= 0 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'irr',
    // Issue #25 fix: Dynamic label based on hold period
    label: (analysis, propertyData) => {
      // Extract hold period: propertyData first (user input), then analysis (backend calculation)
      const holdPeriod = propertyData?.longTermAssumptions?.projectionYears
                      || analysis?.longTermAnalysis?.projectionYears
                      || 10; // Default to 10 years if not specified
      return `${holdPeriod}-Year IRR`;
    },
    description: 'Internal Rate of Return - Time-weighted annualized return rate',
    // Source: METRICS_REORGANIZATION_PLAN.md line 51, AnalysisResults.tsx line 252
    getValue: (analysis) => {
      // Backend returns IRR as decimal (0.05 = 5%), convert to percentage for display
      return (analysis?.keyMetrics?.irr || analysis?.longTermAnalysis?.returns?.irr || 0) * 100;
    },
    format: 'percent',
    tier: 2,
    getStatus: (value) => value >= 15 ? 'positive' : value >= 8 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'dscr',
    label: 'DSCR',
    description: 'Debt Service Coverage Ratio',
    // Source: METRICS_REORGANIZATION_PLAN.md line 53, AnalysisResults.tsx line 267
    getValue: (analysis) => analysis?.keyMetrics?.dscr || 0,
    format: 'decimal',
    tier: 2,
    getStatus: (value) => value >= 1.25 ? 'positive' : value >= 1.0 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'pricePerSqFt',
    label: 'Price/SqFt',
    description: 'Purchase price per square foot',
    // Source: METRICS_REORGANIZATION_PLAN.md line 55 ⚠️ TECH DEBT (Issue #31)
    getValue: (analysis, propertyData) => {
      // TECH DEBT: Backend calculates (line 783), but frontend re-calculates
      const backendValue = analysis?.keyMetrics?.pricePerSqft; // Note: backend uses 'pricePerSqft'
      if (backendValue !== undefined && backendValue !== null) {
        return backendValue;
      }
      // Fallback (matches line 281)
      if (propertyData?.squareFootage && propertyData?.purchasePrice) {
        console.warn('⚠️ TECH DEBT: Using frontend fallback for Price/SqFt. See Issue #31.');
        return propertyData.purchasePrice / propertyData.squareFootage;
      }
      return 0;
    },
    format: 'currency',
    tier: 2,
    getStatus: () => 'neutral',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'rentPerSqFt',
    label: 'Rent/SqFt (Monthly)',
    description: 'Monthly rent per square foot',
    // Source: METRICS_REORGANIZATION_PLAN.md line 56 ⚠️ TECH DEBT (Issue #31)
    getValue: (analysis, propertyData) => {
      // TECH DEBT: Backend calculates annual (line 784), frontend shows monthly
      const backendValue = analysis?.keyMetrics?.rentPerSqFt; // Backend uses annual
      if (backendValue !== undefined && backendValue !== null) {
        return backendValue / 12; // Convert annual to monthly for display
      }
      // Fallback (matches line 288)
      if (propertyData?.squareFootage && propertyData?.monthlyRent) {
        console.warn('⚠️ TECH DEBT: Using frontend fallback for Rent/SqFt. See Issue #31.');
        return propertyData.monthlyRent / propertyData.squareFootage;
      }
      return 0;
    },
    format: 'currency',
    tier: 2,
    getStatus: () => 'neutral',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'grossRentMultiplier',
    label: 'GRM',
    description: 'Gross Rent Multiplier - Purchase price divided by annual rent',
    // Source: METRICS_REORGANIZATION_PLAN.md line 61
    getValue: (analysis, propertyData) => {
      // Backend first (line 785)
      if (analysis?.keyMetrics?.grossRentMultiplier) {
        return analysis.keyMetrics.grossRentMultiplier;
      }
      // Fallback calculation (matches line 307-311)
      if (propertyData?.monthlyRent && propertyData?.purchasePrice) {
        console.warn('⚠️ TECH DEBT: Using frontend fallback for GRM. See Issue #31.');
        return propertyData.purchasePrice / (propertyData.monthlyRent * 12);
      }
      return 0;
    },
    format: 'decimal',
    tier: 2,
    getStatus: () => 'neutral',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'onePercentRule',
    label: '1% Rule',
    description: 'Monthly rent as percentage of purchase price (1%+ is strong)',
    // Source: METRICS_REORGANIZATION_PLAN.md line 60
    getValue: (analysis, propertyData) => {
      // Backend first (line 786)
      if (analysis?.keyMetrics?.onePercentRuleValue) {
        return analysis.keyMetrics.onePercentRuleValue;
      }
      // Fallback calculation (matches line 300-304)
      if (propertyData?.monthlyRent && propertyData?.purchasePrice) {
        console.warn('⚠️ TECH DEBT: Using frontend fallback for 1% Rule. See Issue #31.');
        return (propertyData.monthlyRent / propertyData.purchasePrice) * 100;
      }
      return 0;
    },
    format: 'percent',
    tier: 2,
    getStatus: (value) => value >= 1 ? 'positive' : value >= 0.7 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  }
];

/**
 * Tier 3: Advanced Risk & Operational Analytics (Collapsible)
 * These 8 metrics answer: "What are the risks and operational considerations?"
 * Source: Lines 290-360 in AnalysisResults.tsx (Advanced Metrics section)
 */
export const TIER_3_METRICS: MetricDefinition[] = [
  {
    id: 'totalROI',
    // Issue #25 fix: Dynamic label based on hold period
    label: (analysis, propertyData) => {
      const holdPeriod = propertyData?.longTermAssumptions?.projectionYears
                      || analysis?.longTermAnalysis?.projectionYears
                      || 10;
      return `Total ROI (${holdPeriod} yr)`;
    },
    // Issue #25 fix: Dynamic description based on hold period
    description: (analysis, propertyData) => {
      const holdPeriod = propertyData?.longTermAssumptions?.projectionYears
                      || analysis?.longTermAnalysis?.projectionYears
                      || 10;
      return `Total cumulative return percentage over ${holdPeriod} years`;
    },
    // Source: METRICS_REORGANIZATION_PLAN.md line 52, AnalysisResults.tsx line 260
    getValue: (analysis) => analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0,
    format: 'percent',
    tier: 3,
    getStatus: (value) => value >= 100 ? 'positive' : value >= 50 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'breakEvenOccupancy',
    label: 'Break-Even Occupancy',
    description: 'Minimum occupancy % needed to cover all expenses',
    // Source: METRICS_REORGANIZATION_PLAN.md line 59, backend line 789
    getValue: (analysis) => analysis?.keyMetrics?.breakEvenOccupancy || 0,
    format: 'percent',
    tier: 3,
    getStatus: (value) => value <= 75 ? 'positive' : value <= 85 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'operatingExpenseRatio',
    label: 'Operating Expense Ratio',
    description: 'Operating expenses as % of gross rental income (target: 35-45%)',
    // Source: METRICS_REORGANIZATION_PLAN.md line 62
    getValue: (analysis) => {
      // Backend first
      if (analysis?.keyMetrics?.operatingExpenseRatio) {
        return analysis.keyMetrics.operatingExpenseRatio;
      }
      // Fallback calculation from longTermAnalysis (matches line 314-320)
      const year1 = analysis?.longTermAnalysis?.projections?.[0];
      if (year1?.operatingExpenses && year1?.grossIncome) {
        console.warn('⚠️ Using fallback calculation for Operating Expense Ratio');
        return (year1.operatingExpenses / year1.grossIncome) * 100;
      }
      return 0;
    },
    format: 'percent',
    tier: 3,
    getStatus: (value) => value <= 45 ? 'positive' : value <= 55 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'pricePerBedroom',
    label: 'Price/Bedroom',
    description: 'Purchase price divided by number of bedrooms',
    // Source: METRICS_REORGANIZATION_PLAN.md line 63 ⚠️ TECH DEBT (Issue #31)
    getValue: (analysis, propertyData) => {
      // Backend first (line 788)
      if (analysis?.keyMetrics?.pricePerBedroom) {
        return analysis.keyMetrics.pricePerBedroom;
      }
      // Fallback (matches line 323-327)
      if (propertyData?.bedrooms && propertyData?.purchasePrice) {
        console.warn('⚠️ TECH DEBT: Using frontend fallback for Price/Bedroom. See Issue #31.');
        return propertyData.purchasePrice / propertyData.bedrooms;
      }
      return 0;
    },
    format: 'currency',
    tier: 3,
    getStatus: () => 'neutral',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'debtToIncomeRatio',
    label: 'DTI Ratio',
    description: 'Debt-to-Income ratio (total debt ÷ gross income)',
    // Source: METRICS_REORGANIZATION_PLAN.md line 64
    getValue: (analysis) => {
      // Backend first (line 803)
      if (analysis?.keyMetrics?.debtToIncomeRatio) {
        return analysis.keyMetrics.debtToIncomeRatio;
      }
      // Fallback calculation from longTermAnalysis (matches line 330-336)
      const year1 = analysis?.longTermAnalysis?.projections?.[0];
      if (year1?.debtService && year1?.grossIncome) {
        console.warn('⚠️ Using fallback calculation for DTI Ratio');
        return (year1.debtService / year1.grossIncome) * 100;
      }
      return 0;
    },
    format: 'percent',
    tier: 3,
    getStatus: (value) => value <= 36 ? 'positive' : value <= 43 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'downPaymentPercent',
    label: 'Down Payment %',
    description: 'Down payment as percentage of purchase price',
    // Source: METRICS_REORGANIZATION_PLAN.md line 65 (Frontend ONLY)
    getValue: (analysis, propertyData) => {
      if (propertyData?.downPayment && propertyData?.purchasePrice) {
        return (propertyData.downPayment / propertyData.purchasePrice) * 100;
      }
      return 0;
    },
    format: 'percent',
    tier: 3,
    getStatus: (value) => value >= 25 ? 'positive' : value >= 20 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'equityMultiple',
    label: 'Equity Multiple',
    description: 'Total cash returned ÷ total cash invested over holding period',
    // Source: METRICS_REORGANIZATION_PLAN.md line 58, AnalysisResults.tsx line 282
    getValue: (analysis) => analysis?.keyMetrics?.equityMultiple || 0,
    format: 'decimal',
    tier: 3,
    getStatus: (value) => value >= 2.0 ? 'positive' : value >= 1.5 ? 'warning' : 'negative',
    applicableStrategies: undefined // All strategies
  },
  {
    id: 'loanAmount',
    label: 'Loan Amount',
    description: 'Total mortgage loan amount',
    // Source: METRICS_REORGANIZATION_PLAN.md line 66 (Frontend ONLY)
    getValue: (analysis, propertyData) => {
      if (propertyData?.purchasePrice && propertyData?.downPayment) {
        return propertyData.purchasePrice - propertyData.downPayment;
      }
      return 0;
    },
    format: 'currency',
    tier: 3,
    getStatus: () => 'neutral',
    applicableStrategies: undefined // All strategies
  }
];

/**
 * Complete metric library for SFR Buy & Hold strategy
 * Total: 18 metrics (3 + 7 + 8)
 */
export const ALL_SFR_BUYHOLD_METRICS: MetricDefinition[] = [
  ...TIER_1_METRICS,
  ...TIER_2_METRICS,
  ...TIER_3_METRICS
];

/**
 * Helper function to get metric by ID
 */
export function getMetricById(id: string): MetricDefinition | undefined {
  return ALL_SFR_BUYHOLD_METRICS.find(metric => metric.id === id);
}

/**
 * Helper function to get all metrics by tier
 */
export function getMetricsByTier(tier: 1 | 2 | 3): MetricDefinition[] {
  return ALL_SFR_BUYHOLD_METRICS.filter(metric => metric.tier === tier);
}
