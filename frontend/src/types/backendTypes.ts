// Define backend types locally instead of importing directly
// This avoids build issues and path resolution problems

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
  pricePerSqFt: number;
  rentPerUnit: number;
  averageUnitSize: number;
  totalUnits: number;
  occupancyRate?: number;
  grossRentMultiplier?: number;
}

export interface MonthlyAnalysis {
  income: {
    gross: number;
    effective: number;
  };
  expenses: {
    operating: number;
    debt: number;
    total: number;
    breakdown: {
      propertyTax?: number;
      insurance?: number;
      maintenance?: number;
      propertyManagement?: number;
      vacancy?: number;
      utilities?: number;
      commonAreaElectricity?: number;
      landscaping?: number;
      waterSewer?: number;
      garbage?: number;
      marketingAndAdvertising?: number;
      repairsAndMaintenance?: number;
      capEx?: number;
      other?: number;
    };
  };
  cashFlow: number;
}

export interface AnnualAnalysis {
  income: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
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

export interface LongTermAnalysis {
  yearlyProjections?: YearlyProjection[];
  projectionYears?: number;
  returns?: {
    irr: number;
    totalCashFlow: number;
    totalAppreciation: number;
    totalReturn: number;
  };
  exitAnalysis?: ExitAnalysis;
}

export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number;
}

export interface RequestData {
  downPayment: number;
  purchasePrice: number;
  propertyType: string;
  closingCosts?: number;
  [key: string]: any;
}

export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  metrics?: T;
  keyMetrics?: T;
  projections?: YearlyProjection[];
  exitAnalysis?: ExitAnalysis;
  longTermAnalysis?: LongTermAnalysis;
  aiInsights?: AIInsights;
  requestData?: RequestData;
} 