import type { MultiFamilyDealData } from '../types/deal';

export const sampleMultiFamilyData: MultiFamilyDealData = {
  propertyType: 'MF',
  propertyName: 'Sample Multi-Family Property',
  propertyAddress: {
    street: '456 Apartment Way',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
  },
  purchasePrice: 2500000,
  downPayment: 500000,
  interestRate: 6.0,
  loanTerm: 30,
  propertyTaxRate: 1.5,
  insuranceRate: 0.6,
  propertyManagementRate: 7,
  yearBuilt: 1995,
  totalUnits: 10,
  totalSqft: 12000,
  maintenanceCostPerUnit: 200,
  unitTypes: [
    {
      type: '1BR',
      count: 4,
      sqft: 800,
      monthlyRent: 1500,
      occupied: 4
    },
    {
      type: '2BR',
      count: 4,
      sqft: 1100,
      monthlyRent: 2000,
      occupied: 3
    },
    {
      type: '3BR',
      count: 2,
      sqft: 1400,
      monthlyRent: 2500,
      occupied: 2
    }
  ],
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    sellingCostsPercentage: 5,
    inflationRate: 2.5,
    vacancyRate: 7,
    capitalExpenditureRate: 5,
    commonAreaMaintenanceRate: 2
  },
  commonAreaUtilities: {
    electric: 400,
    water: 300,
    gas: 200,
    trash: 150
  }
}; 