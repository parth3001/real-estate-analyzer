export type PropertyType = 'SFR' | 'MF';

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LongTermAssumptions {
  projectionYears: number;
  annualRentIncrease: number;
  annualPropertyValueIncrease: number;
  sellingCostsPercentage: number;
  inflationRate: number;
  vacancyRate: number;
}

export interface BasePropertyData {
  id?: string;
  propertyName: string;
  propertyAddress: PropertyAddress;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTaxRate: number;
  insuranceRate: number;
  propertyManagementRate: number;
  yearBuilt: number;
  closingCosts?: number;
}

export interface SFRPropertyData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
}

export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

export interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

export interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

export interface MultiFamilyPropertyData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
}

export type PropertyData = SFRPropertyData | MultiFamilyPropertyData;

/**
 * Represents a saved property from the backend
 */
export interface SavedProperty {
  _id: string;
  propertyName: string;
  propertyType: 'SFR' | 'MF';
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTax: number;
  insurance: number;
  // SFR specific
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  // MF specific
  totalUnits?: number;
  totalSqft?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;
  analysis: {
    monthlyAnalysis: {
      expenses: {
        mortgage?: {
          total: number;
        };
        propertyTax?: number;
        insurance?: number;
        maintenance?: number;
        propertyManagement?: number;
        vacancy?: number;
        total?: number;
      };
      income?: number;
      cashFlow?: number;
    };
    annualAnalysis?: {
      dscr?: number;
      cashOnCashReturn?: number;
      capRate?: number;
      totalInvestment?: number;
      annualNOI?: number;
    };
    longTermAnalysis?: {
      projections?: Array<any>;
      exitAnalysis?: {
        projectedSalePrice?: number;
        sellingCosts?: number;
        mortgagePayoff?: number;
        netProceedsFromSale?: number;
      };
    };
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      grossRentMultiplier?: number;
      netOperatingIncome?: number;
      totalInvestment?: number;
    };
    aiInsights?: {
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      recommendations?: string[];
      investmentScore?: number | null;
    };
  };
  createdAt: string;
  updatedAt: string;
} 