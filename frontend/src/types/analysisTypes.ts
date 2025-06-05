// Analysis Result Types

// Basic key metrics
export interface KeyMetrics {
  capRate?: number;
  cashOnCashReturn?: number;
  dscr?: number;
  noi?: number;
  irr?: number;
  pricePerSqFtAtPurchase?: number;
  pricePerSqFtAtSale?: number;
  avgRentPerSqFt?: number;
  [key: string]: number | undefined;
}

// Monthly analysis
export interface MonthlyAnalysis {
  income?: {
    gross?: number;
    effective?: number;
  };
  expenses?: {
    propertyTax?: number;
    insurance?: number;
    maintenance?: number;
    propertyManagement?: number;
    vacancy?: number;
    mortgage?: {
      total: number;
      principal?: number;
      interest?: number;
    };
    total?: number;
    [key: string]: any;
  };
  cashFlow?: number;
  cashFlowAfterTax?: number;
  [key: string]: any;
}

// Annual analysis
export interface AnnualAnalysis {
  noi?: number;
  capRate?: number;
  cashOnCashReturn?: number;
  dscr?: number;
  totalInvestment?: number;
  annualNOI?: number;
  annualDebtService?: number;
  effectiveGrossIncome?: number;
  [key: string]: number | undefined;
}

// Long-term analysis
export interface LongTermAnalysis {
  yearlyProjections?: Array<{
    year?: number;
    cashFlow?: number;
    propertyValue?: number;
    equity?: number;
    mortgageBalance?: number;
    [key: string]: number | undefined;
  }>;
  projectionYears?: number;
  returns?: {
    irr?: number;
    totalCashFlow?: number;
    totalAppreciation?: number;
    totalReturn?: number;
    [key: string]: number | undefined;
  };
  exitAnalysis?: {
    projectedSalePrice?: number;
    sellingCosts?: number;
    mortgagePayoff?: number;
    netProceedsFromSale?: number;
    [key: string]: number | undefined;
  };
  [key: string]: any;
}

// AI Insights
export interface AIInsights {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  investmentScore?: number;
  [key: string]: string | string[] | number | undefined;
}

// Complete Analysis Result
export interface AnalysisResult {
  keyMetrics?: KeyMetrics;
  monthlyAnalysis?: MonthlyAnalysis;
  annualAnalysis?: AnnualAnalysis;
  longTermAnalysis?: LongTermAnalysis;
  aiInsights?: AIInsights;
  [key: string]: any;
} 