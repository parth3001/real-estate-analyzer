/**
 * Validation Warning Types (Phase 1: Multi-Family)
 */
export type ValidationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ValidationCategory = 'OPERATING_EXPENSES' | 'FINANCING' | 'MARKET_DATA' | 'INPUT_VALIDATION';

export interface ValidationWarning {
  severity: ValidationSeverity;
  category: ValidationCategory;
  message: string;
  impact?: string;
  recommendation?: string;
  affectedMetric?: string;
}

export interface MonthlyExpenses {
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  mortgage?: {
    principal: number;
    interest: number;
    total: number;
  };
  total: number;
  tenantTurnover?: number;
}

export interface MonthlyAnalysis {
  income: {
    gross: number;
    effective: number;
  };
  expenses: MonthlyExpenses;
  cashFlow?: number;
  cashFlowAfterTax?: number;
}

export interface AnnualAnalysis {
  income: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  // Legacy fields for backward compatibility
  grossRentalIncome?: number;
  effectiveGrossIncome?: number;
  operatingExpenses?: number;
  annualDebtService?: number;
  dscr?: number;
  capRate?: number;
  cashOnCashReturn?: number;
  totalInvestment?: number;
}

export interface YearlyProjection {
  year: number;
  grossRent: number;
  grossIncome: number;
  effectiveIncome?: number;
  operatingExpenses?: number;
  noi?: number;
  debtService: number;
  cashFlow?: number;
  propertyValue: number;
  equity: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  realtorBrokerageFee?: number;
  turnoverCosts?: number;
  capitalImprovements?: number;
}

export interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  totalProfit: number;
  returnOnInvestment: number;
}

export interface ScoreBreakdownItem {
  score: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  cashFlow?: ScoreBreakdownItem;
  marketPosition?: ScoreBreakdownItem;
  riskAssessment?: ScoreBreakdownItem;
  financialMetrics?: ScoreBreakdownItem;
}

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number;
  scoreBreakdown?: ScoreBreakdown;  // New score breakdown for detailed analysis
  unitMixAnalysis?: string;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[] | ValueAddOpportunity[];
  recommendedHoldPeriod?: string;
  // New predictive analysis fields
  marketTrendPrediction?: string;
  optimalExitStrategy?: string | any; // Can be string or object from AI
  riskAssessment?: string;
  // Enhanced strategic analysis fields
  investorFit?: string;
  strategicInsights?: string;
  competitiveAdvantage?: string;
  wealthBuildingPotential?: string;
  marketCycleAnalysis?: string;
  financingRecommendations?: string;
  portfolioFitAnalysis?: string;
  opportunityCostAnalysis?: string;
  notes?: string;
  boldPredictions?: {
    wealthCreation?: {
      year3Value?: string;
      year5Value?: string;
      year10Value?: string;
      totalWealthCreated?: string;
    };
    cashFlowGrowth?: {
      currentMonthly?: string;
      year2Monthly?: string;
      year5Monthly?: string;
      doubleDate?: string;
      reach5kDate?: string;
    };
    rentGrowthForecast?: {
      currentRent?: string;
      year3Rent?: string;
      year5Rent?: string;
      year7Rent?: string;
    };
    exitStrategy?: {
      optimalExitYear?: string;
      predictedSalePrice?: string;
      totalProfit?: string;
      annualizedReturn?: string;
    };
  };
}

export interface ValueAddOpportunity {
  improvement: string;
  estimatedCost: string;
  potentialRoiPercent: string;
  rentIncreasePotential: string;
  valueIncreasePotential: string;
  implementationDifficulty?: string; // 'easy', 'medium', or 'hard'
  strategicPriority?: string; // 'high', 'medium', or 'low'
}

export interface KeyMetrics {
  dscr?: number;
  capRate?: number;
  cashOnCashReturn?: number;
  irr: number;
  totalROI: number;
  paybackPeriod: number;
  avgMonthlyRent?: number;
  pricePerUnit?: number;
  pricePerSqft: number;
  rentToValue: number;
  totalInvestment?: number;
  operatingExpenseRatio?: number;
  breakEvenOccupancy?: number;
  equityMultiple?: number;
  onePercentRuleValue?: number;
  fiftyRuleAnalysis?: boolean;
  rentToPriceRatio?: number;
  pricePerBedroom?: number;
  debtToIncomeRatio?: number;
  grossRentMultiplier?: number;
  returnOnImprovements?: number;
  turnoverCostImpact?: number;
}

export interface Analysis {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: {
    projections: YearlyProjection[];
    projectionYears: number;
    returns: {
      irr: number;
      totalCashFlow: number;
      totalAppreciation: number;
      totalReturn: number;
    };
    exitAnalysis: ExitAnalysis;
  };
  keyMetrics: KeyMetrics;
  aiInsights?: AIInsights;
  // Phase 1: Validation warnings for data quality
  validationWarnings?: ValidationWarning[];
  sensitivityAnalysis?: {
    bestCase: any;
    worstCase: any;
  };
  // NEW: Market Intelligence Data
  marketData?: import('./marketData').MarketDataResponse;
  marketInsights?: import('./marketData').MarketInsight[];
  investmentTiming?: import('./marketData').InvestmentTimingAnalysis;
  // NEW: Fast AI Predictions data
  predictions?: any;
  performance?: any;
  // Investment Decision Engine results
  investmentDecision?: {
    verdict: 'BUY' | 'NEGOTIATE' | 'PASS' | 'CAUTION';
    confidence: number;
    score?: number;
    primaryReason: string;
    secondaryReasons: string[];
    keyRisks: string[];
    confidenceDescription?: string;
    goalBasedReasoning?: string;
    portfolioContext?: any;
    actionPlan?: any;
    timeline?: any;
    goalContext?: any;
    professionalAssessment?: {
      dealQuality: number;
      riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
      marketConditions: 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE';
      categoryScores: {
        financial: number;
        market: number;
        risk: number;
      };
      weightedComponents: {
        cashFlow: { score: number; weight: number; };
        capRate: { score: number; weight: number; };
        irr: { score: number; weight: number; };
        market: { score: number; weight: number; };
        risk: { score: number; weight: number; };
      };
      reasoning: string;
      actionableInsights: string[];
    };
  };
} 
