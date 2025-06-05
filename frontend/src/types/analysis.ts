export interface MonthlyAnalysis {
  expenses: {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    propertyManagement: number;
    vacancy: number;
    total: number;
    [key: string]: any;
  };
  income?: {
    gross: number;
    effective: number;
    [key: string]: any;
  };
  cashFlow: number;
}

export interface AnnualAnalysis {
  dscr: number;
  cashOnCashReturn: number;
  capRate: number;
  totalInvestment: number;
  annualNOI: number;
  annualDebtService: number;
  effectiveGrossIncome: number;
}

export interface YearlyProjection {
  year: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  grossRent: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
}

export interface LongTermAnalysis {
  yearlyProjections: YearlyProjection[];
  projectionYears: number;
  returns: {
    irr: number;
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
  };
  exitAnalysis: {
    projectedSalePrice: number;
    sellingCosts: number;
    mortgagePayoff: number;
    netProceedsFromSale: number;
  };
}

export interface AIInsights {
  investmentScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  // Multi-family specific properties (optional)
  unitMixAnalysis?: string;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[];
  recommendedHoldPeriod?: string;
}

export interface KeyMetrics {
  pricePerSqFtAtPurchase: number;
  pricePerSqFtAtSale: number;
  avgRentPerSqFt: number;
}

export interface Analysis {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: LongTermAnalysis;
  keyMetrics: KeyMetrics;
  aiInsights?: AIInsights;
} 