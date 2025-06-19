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
  tenantTurnover?: number;
  };
  total: number;
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
  grossRentalIncome?: number;
  effectiveGrossIncome?: number;
  operatingExpenses?: number;
  noi?: number;
  annualDebtService?: number;
  cashFlow?: number;
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

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number;
  unitMixAnalysis?: string;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[];
  recommendedHoldPeriod?: string;
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
  sensitivityAnalysis?: {
    bestCase: any;
    worstCase: any;
  };
} 