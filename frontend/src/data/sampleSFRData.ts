import type { SFRDealData } from '../types/deal';

export const sampleSFRData: SFRDealData = {
  propertyType: 'SFR',
  propertyName: 'Sample SFR Property',
  propertyAddress: {
    street: '123 Sample Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
  },
  purchasePrice: 750000,
  downPayment: 150000,
  interestRate: 6.5,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  propertyManagementRate: 8,
  yearBuilt: 1985,
  monthlyRent: 4500,
  squareFootage: 1800,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 300,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    sellingCostsPercentage: 6,
    inflationRate: 2.5,
    vacancyRate: 5,
  }
}; 