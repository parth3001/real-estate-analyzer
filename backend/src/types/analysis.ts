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
}

export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  aiInsights?: AIInsights;
}

export type { SFRData, MultiFamilyData, PropertyType }; 