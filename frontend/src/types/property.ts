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

export interface SavedProperty {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  price: number;
  createdAt: string;
  updatedAt: string;
} 