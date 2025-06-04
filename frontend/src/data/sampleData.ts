import { SFRDealData, MultiFamilyDealData } from '../types/deal';

export const sampleSFRData: SFRDealData = {
  propertyType: 'SFR',
  propertyName: 'Sample Single Family Home',
  propertyAddress: {
    street: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701'
  },
  purchasePrice: 350000,
  downPayment: 70000,
  interestRate: 6.5,
  loanTerm: 30,
  propertyTaxRate: 1.25,
  insuranceRate: 0.5,
  maintenanceCost: 250,
  propertyManagementRate: 8,
  monthlyRent: 2800,
  squareFootage: 1800,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2005,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    inflationRate: 2,
    vacancyRate: 5,
    sellingCostsPercentage: 6
  }
};

export const sampleMFData: MultiFamilyDealData = {
  propertyType: 'MF',
  propertyName: 'Sample Multi-Family Complex',
  propertyAddress: {
    street: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702'
  },
  purchasePrice: 1200000,
  downPayment: 300000,
  interestRate: 6.75,
  loanTerm: 30,
  propertyTaxRate: 1.25,
  insuranceRate: 0.6,
  maintenanceCostPerUnit: 200,
  propertyManagementRate: 7,
  totalUnits: 8,
  totalSqft: 7200,
  yearBuilt: 2000,
  unitTypes: [
    {
      type: '1BR/1BA',
      count: 4,
      sqft: 750,
      monthlyRent: 1200,
      occupied: 4
    },
    {
      type: '2BR/2BA',
      count: 4,
      sqft: 1050,
      monthlyRent: 1600,
      occupied: 3
    }
  ],
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    inflationRate: 2,
    vacancyRate: 7,
    sellingCostsPercentage: 5,
    capitalExpenditureRate: 5,
    commonAreaMaintenanceRate: 3
  },
  commonAreaUtilities: {
    electric: 300,
    water: 200,
    gas: 100,
    trash: 150
  }
}; 