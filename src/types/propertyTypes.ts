/**
 * Property type enum
 */
export type PropertyType = 'SFR' | 'MF';

/**
 * Base property address interface
 */
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Base property data interface
 */
export interface BasePropertyData {
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: PropertyAddress;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  yearBuilt: number;
  id?: string;
}

/**
 * Single-family residence data
 */
export interface SFRData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  propertyManagementRate: number;
  longTermAssumptions: LongTermAssumptions;
}

/**
 * Multi-family property data
 */
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
}

/**
 * Unit type for multi-family properties
 */
export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

/**
 * Long-term assumptions for property analysis
 */
export interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
}

/**
 * Multi-family specific long-term assumptions
 */
export interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

/**
 * Common area utilities for multi-family properties
 */
export interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

/**
 * Monthly analysis results
 */
export interface MonthlyAnalysis {
  expenses: {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    propertyManagement: number;
    vacancy: number;
    mortgage: {
      total: number;
      principal: number;
      interest: number;
    };
    total: number;
  };
  cashFlow: number;
  cashFlowAfterTax: number;
}

/**
 * Annual analysis results
 */
export interface AnnualAnalysis {
  dscr: number;
  cashOnCashReturn: number;
  capRate: number;
  totalInvestment: number;
  annualNOI: number;
  annualDebtService: number;
  effectiveGrossIncome: number;
}

/**
 * Common metrics interface
 */
export interface CommonMetrics {
  pricePerSqFt?: number;
  pricePerUnit?: number;
  averageRentPerUnit?: number;
  averageRentPerSqFt?: number;
}

/**
 * Long-term yearly projection
 */
export interface YearlyProjection {
  year: number;
  cashFlow: number;
  propertyValue: number;
  equity: number;
  noi: number;
  debtService: number;
  grossRent: number;
  mortgageBalance: number;
  appreciation: number;
  totalReturn: number;
}

/**
 * Exit analysis results
 */
export interface ExitAnalysis {
  projectedSalePrice: number;
  sellingCosts: number;
  mortgagePayoff: number;
  netProceedsFromSale: number;
}

/**
 * AI insights for property analysis
 */
export interface AIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  investmentScore: number | null;
}

/**
 * Complete analysis results
 */
export interface AnalysisResult<T extends CommonMetrics> {
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  metrics: T;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;
  aiInsights?: AIInsights;
} 