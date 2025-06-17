import { SFRData, MultiFamilyData, PropertyType } from './propertyTypes';

export interface MonthlyAnalysis {
  income: {
    gross: number;
    effective: number;
  };
  expenses: {
    operating: number;
    debt: number;
    total: number;
    breakdown: ExpenseBreakdown;
  };
  cashFlow: number;
}

export interface ExpenseBreakdown {
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  tenantTurnover?: number;
  utilities: number;
  commonAreaElectricity: number;
  landscaping: number;
  waterSewer: number;
  garbage: number;
  marketingAndAdvertising: number;
  repairsAndMaintenance: number;
  capEx: number;
  other?: number;
}

export interface AnnualAnalysis {
  income: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
}

export interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
}

export interface SFRMetrics extends CommonMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
  
  // New metrics
  breakEvenOccupancy: number;
  equityMultiple: number;
  onePercentRuleValue: number;
  fiftyRuleAnalysis: boolean;
  rentToPriceRatio: number;
  pricePerBedroom: number;
  debtToIncomeRatio: number;
  returnOnImprovements: number; // Return on capital improvements as percentage
  turnoverCostImpact: number;   // Turnover costs as percentage of gross income
}

export interface MultiFamilyMetrics extends CommonMetrics {
  pricePerUnit: number;
  pricePerSqft: number;
  noiPerUnit: number;
  averageRentPerUnit: number;
  operatingExpensePerUnit: number;
  commonAreaExpenseRatio: number;
  unitMixEfficiency: number;
  economicVacancyRate: number;
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  grossIncome: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  equity: number;
  mortgageBalance: number;
  totalReturn: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  realtorBrokerageFee: number;
  grossRent: number;
  appreciation: number;
  
  // New projection fields
  principalPaidThisYear?: number;
  totalPrincipalPaidToDate?: number;
  cashOnCashReturnThisYear?: number;
  pricePerSqFtAtThisPoint?: number;
  turnoverCosts?: number; // Annual tenant turnover costs
  capitalImprovements?: number; // Capital investments (only in year 1)
}

export interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  totalReturn: number;
}

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[];
  recommendedHoldPeriod?: string;
  unitMixAnalysis?: string;
}

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
  riskAssessment?: string;
  marketPositionAnalysis?: string;
  valueAddOpportunities?: string[];
  recommendedHoldPeriod?: string;
  unitMixAnalysis?: string;
}

export interface LongTermAnalysis {
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  returns: {
    irr: number;
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
  };
  projectionYears: number;
}

export interface SensitivityAnalysis {
  bestCase: {
    cashFlow: number;
    cashOnCashReturn: number;
    totalReturn: number;
    noi: number;
    dscr: number;
    vacancyRate: number;
    interestRate: number;
    appreciationRate: number;
  };
  worstCase: {
    cashFlow: number;
    cashOnCashReturn: number;
    totalReturn: number;
    noi: number;
    dscr: number;
    vacancyRate: number;
    interestRate: number;
    appreciationRate: number;
  };
}

export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  keyMetrics: T;
  longTermAnalysis: LongTermAnalysis;
  aiInsights?: AIInsights;
  sensitivityAnalysis?: SensitivityAnalysis;
}

export type { SFRData, MultiFamilyData, PropertyType }; 