/**
 * BRRRR Type Definitions
 *
 * Frontend-local copy of backend BRRRR types for production builds.
 *
 * IMPORTANT: These types are duplicated from backend to avoid cross-directory
 * imports that break production builds on Render (winston dependency issue).
 *
 * Source: backend/src/services/investment/brrrAnalyzer.ts
 *
 * @author FSE from CLAUDE.md
 * @date January 8, 2026
 */

export interface BRRRRInputs {
  purchasePrice: number;
  closingCosts: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  brrrr: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV?: number;
    seasoningPeriod?: number;
    estimatedRehabTime?: number;
    arvAppraisalConfidence?: 'conservative' | 'moderate' | 'aggressive';
    refinanceInterestRate?: number;
  };
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  vacancyRate?: number;
  monthlyHOA?: number;
  monthlyUtilities?: number;
  monthlyCapEx?: number;
  capExReserveRate?: number;
  capExReserveFixed?: number;
  tenantTurnoverFees?: {
    prepFees?: number;
    realtorCommission?: number;
  };
  longTermAssumptions?: {
    projectionYears?: number;
    annualRentIncrease?: number;
    annualPropertyValueIncrease?: number;
    inflationRate?: number;
    vacancyRate?: number;
    sellingCostsPercentage?: number;
    turnoverFrequency?: number;
  };
}

export interface SeasoningCosts {
  mortgagePayments: number;
  propertyTax: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  propertyManagement: number;
  totalHoldingCosts: number;
  grossRentalIncome: number;
  netRentalIncome: number;
  seasoningNetCashFlow: number;
  /** @deprecated Use seasoningNetCashFlow instead */
  netSeasoningCost: number;
  months: number;
}

export interface RefinanceResults {
  afterRepairValue: number;
  refinanceLTV: number;
  newLoanAmount: number;
  existingLoanBalance: number;
  cashOutProceeds: number;
  refinanceClosingCosts: number;
  netCashOut: number;
}

export interface ExitScenario {
  year: number;
  salePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceeds: number;
  totalWealthCreated: number;
  breakdown: {
    capitalRecovered: number;
    cumulativeCashFlow: number;
    appreciation: number;
    principalPaid: number;
  };
  totalProfit: number;
  totalReturn: number;
  irr: number;
}

export interface CapitalRecovery {
  totalCapitalDeployed: number;
  capitalRecovered: number;
  capitalRemaining: number;
  capitalRecoveryRate: number;
  infiniteReturn: boolean;
}

export interface PostRefinanceMetrics {
  newMonthlyPayment: number;
  monthlyRent: number;
  monthlyOperatingExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number | null; // null = infinite return (capitalRemaining <= 0)
  annualNOI: number;
  postRefiDSCR: number;
  postRefiBreakEvenOccupancy: number; // Issue #80 fix - BEO using post-refi mortgage
}

export interface Rule70Check {
  afterRepairValue: number;
  rehabBudget: number;
  maxAllowablePurchase: number;
  actualPurchase: number;
  meets70Rule: boolean;
  margin: number;
  marginPercent: number;
}

export interface ScenarioResults {
  arv: number;
  rehabBudget: number;
  capitalRecoveryRate: number;
  monthlyCashFlow: number;
  infiniteReturn: boolean;
}

export interface ARVSensitivity {
  pessimistic: ScenarioResults;
  moderate: ScenarioResults;
  optimistic: ScenarioResults;
}

export interface RehabSensitivity {
  onBudget: ScenarioResults;
  overBudget10: ScenarioResults;
  overBudget20: ScenarioResults;
}

export interface BRRRRAnalysis {
  totalInvestment: number;
  downPayment: number;
  loanAmount: number;
  rehabBudget: number;
  closingCosts: number;
  seasoningCosts: SeasoningCosts;
  refinanceResults: RefinanceResults;
  capitalRecovery: CapitalRecovery;
  postRefinanceMetrics: PostRefinanceMetrics;
  scores: {
    capitalRecovery: number;
    arvReliability: number;
    rehabExecution: number;
  };
  sensitivity: {
    arv: ARVSensitivity;
    rehab: RehabSensitivity;
  };
  rule70Check: Rule70Check;
  exitScenarios?: ExitScenario[];
}
