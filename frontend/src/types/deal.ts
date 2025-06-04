import type { AnalysisResult, SFRMetrics } from './backendTypes';
import type { MultiFamilyMetrics } from './metrics';

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
}

export interface SFRDealData extends BasePropertyData {
  propertyType: 'SFR';
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  maintenanceCost: number;
  longTermAssumptions: LongTermAssumptions;
  analysisResult?: AnalysisResult<SFRMetrics>;
}

export interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  occupied: number;
}

interface MFLongTermAssumptions extends LongTermAssumptions {
  capitalExpenditureRate: number;
  commonAreaMaintenanceRate: number;
}

interface CommonAreaUtilities {
  electric: number;
  water: number;
  gas: number;
  trash: number;
}

export interface MultiFamilyDealData extends BasePropertyData {
  propertyType: 'MF';
  totalUnits: number;
  totalSqft: number;
  maintenanceCostPerUnit: number;
  unitTypes: UnitType[];
  longTermAssumptions: MFLongTermAssumptions;
  commonAreaUtilities: CommonAreaUtilities;
  analysisResult?: AnalysisResult<MultiFamilyMetrics>;
}

export type DealData = SFRDealData | MultiFamilyDealData;

export interface SavedDeal {
  id: string;
  name: string;
  type: PropertyType;
  data: {
    id?: string;
    analysisResult?: AnalysisResult<SFRMetrics>;
    [key: string]: any;
  };
  savedAt: string;
  lastModified: string;
}

export interface Deal {
  id: string | number;
  name: string;
  type: PropertyType;
  data: {
    propertyAddress?: PropertyAddress;
    purchasePrice: number;
    downPayment: number;
    totalUnits?: number;
    monthlyRent?: number;
    unitTypes?: Array<{
      type: string;
      count: number;
      monthlyRent: number;
    }>;
    analysisResult?: AnalysisResult<SFRMetrics>;
  };
} 