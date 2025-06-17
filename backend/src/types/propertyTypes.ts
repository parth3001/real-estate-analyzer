export type PropertyType = 'SFR' | 'MF';

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BasePropertyData {
  propertyType: PropertyType;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  propertyAddress: PropertyAddress;
  closingCosts?: number;
  capitalInvestments?: number;
  tenantTurnoverFees?: {
    prepFees: number;
    realtorCommission: number;
  };
}

export interface CommonMetrics {
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  dscr: number;
  operatingExpenseRatio: number;
}

export interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  condition?: string;
  afterRepairValue?: number;
  renovationCosts?: number;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
}

export interface SFRMetrics extends CommonMetrics {
  pricePerSqFt: number;
  rentPerSqFt: number;
  grossRentMultiplier: number;
  afterRepairValueRatio?: number;
  rehabROI?: number;
}

export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  unitTypes: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;
  maintenanceCostPerUnit: number;
  commonAreaUtilities: {
    electric: number;
    water: number;
    gas: number;
    trash: number;
  };
  yearBuilt: number;
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    inflationRate: number;
    vacancyRate: number;
    sellingCostsPercentage: number;
    turnoverFrequency?: number;
  };
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

export interface ProjectionAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualExpenseIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  vacancyRate: number;
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
  turnoverCosts?: number;
  capitalImprovements?: number;
}

export interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
  totalReturn: number;
  equityMultiple: number;
}

export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: {
    income: {
      gross: number;
      effective: number;
      other?: number;
    };
    expenses: {
      operating: number;
      debt: number;
      total: number;
      breakdown: Record<string, number>;
    };
    cashFlow: number;
  };
  annualAnalysis: {
    income: number;
    expenses: number;
    noi: number;
    debtService: number;
    cashFlow: number;
  };
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
}

export interface PropertyTypeThresholds {
  capRate: number;
  cashOnCash: number;
  dscr: number;
  operatingExpenseRatio: number;
}

// Unified DealData interface for both SFR and MF
export type DealData = SFRData | MultiFamilyData; 