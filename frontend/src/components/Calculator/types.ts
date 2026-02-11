/**
 * Calculator-specific types
 * Separate from SFRPropertyData to avoid coupling calculator UI to backend types
 */

export interface CalculatorFormData {
  // Strategy
  investmentStrategy: 'brrrr' | 'buy-hold';

  // Purchase
  purchasePrice: number;
  downPayment: number;
  closingCosts: number;

  // BRRRR-specific
  rehabCosts?: number;
  arv?: number;
  refinanceLTV?: number;
  refinanceRate?: number;

  // Financing
  interestRate: number;
  loanTerm: number;

  // Rental Income
  monthlyRent: number;
  vacancy: number;

  // Operating Expenses
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  hoaFees?: number;
  utilities?: number;
  monthlyCapEx?: number;  // Capital Expenditures (CapEx) - Reserve for major repairs

  // Long-term assumptions
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualExpenseIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    vacancyRate: number;
  };
}

export const defaultBuyHoldData: CalculatorFormData = {
  investmentStrategy: 'buy-hold',
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 7.5,
  loanTerm: 30,
  closingCosts: 0,
  monthlyRent: 0,
  propertyTax: 0,
  insurance: 0,
  maintenance: 0,
  propertyManagement: 0,
  hoaFees: 0,
  utilities: 0,
  monthlyCapEx: 0,
  vacancy: 5,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 2,
    annualExpenseIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    vacancyRate: 5,
  },
};

export const defaultBRRRRData: CalculatorFormData = {
  investmentStrategy: 'brrrr',
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 8.5,
  loanTerm: 30,
  closingCosts: 0,
  rehabCosts: 0,
  arv: 0,
  refinanceLTV: 75,
  refinanceRate: 7.5,
  monthlyRent: 0,
  propertyTax: 0,
  insurance: 0,
  maintenance: 0,
  propertyManagement: 0,
  monthlyCapEx: 0,
  vacancy: 5,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 2,
    annualExpenseIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    vacancyRate: 5,
  },
};
