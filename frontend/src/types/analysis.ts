export interface MonthlyAnalysis {
  expenses: {
    [key: string]: number | { 
      total: number;
      downPayment?: number;
    } | undefined;
    mortgage?: { 
      total: number;
      downPayment?: number;
    };
    total?: number;
  };
  cashFlow?: number;
  cashFlowAfterTax?: number;
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

export interface LongTermAnalysis {
  yearlyProjections: Array<{
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
  }>;
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
  investmentScore?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  // Multi-family specific properties
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
  monthlyAnalysis?: MonthlyAnalysis;
  annualAnalysis?: AnnualAnalysis;
  longTermAnalysis?: LongTermAnalysis;
  aiInsights?: AIInsights;
  keyMetrics?: KeyMetrics;
  purchasePrice?: number;
} 