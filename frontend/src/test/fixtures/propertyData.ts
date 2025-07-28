import type { SFRPropertyData } from '../../types/property'
import type { Analysis } from '../../types/analysis'

export const mockSFRPropertyData: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: 'Test Property',
  propertyAddress: {
    street: '123 Test Street',
    city: 'Nashville',
    state: 'TN',
    zipCode: '37203'
  },
  purchasePrice: 450000,
  downPayment: 90000,
  interestRate: 6.75,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  propertyManagementRate: 8,
  yearBuilt: 2000,
  monthlyRent: 2940,
  squareFootage: 2450,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 294,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    turnoverFrequency: 2
  },
  closingCosts: 11250,
  capitalInvestments: 0,
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  }
}

export const mockAnalysisResult: Analysis = {
  monthlyAnalysis: {
    grossIncome: 2940,
    operatingExpenses: 1860,
    netOperatingIncome: 1080,
    debtService: 1366.40,
    cashFlow: -286.40
  },
  annualAnalysis: {
    grossIncome: 35280,
    operatingExpenses: 22320,
    netOperatingIncome: 12960,
    debtService: 16396.80,
    cashFlow: -3436.80,
    totalExpenses: 38716.80
  },
  keyMetrics: {
    capRate: 2.88,
    cashOnCashReturn: -3.82,
    debtServiceCoverageRatio: 0.79,
    operatingExpenseRatio: 63.27,
    grossRentMultiplier: 12.76,
    onePercentRuleValue: 0.65,
    pricePerSquareFoot: 183.67,
    rentToValueRatio: 0.65,
    breakEvenOccupancy: 126.5
  },
  longTermAnalysis: {
    projections: Array.from({ length: 10 }, (_, i) => ({
      year: i + 1,
      propertyValue: 450000 * Math.pow(1.03, i + 1),
      monthlyRent: 2940 * Math.pow(1.03, i + 1),
      grossIncome: 2940 * 12 * Math.pow(1.03, i + 1),
      operatingExpenses: 22320 * Math.pow(1.02, i + 1),
      netOperatingIncome: (2940 * 12 * Math.pow(1.03, i + 1)) - (22320 * Math.pow(1.02, i + 1)),
      debtService: 16396.80,
      cashFlow: ((2940 * 12 * Math.pow(1.03, i + 1)) - (22320 * Math.pow(1.02, i + 1))) - 16396.80,
      cumulativeCashFlow: 0 // Will be calculated properly in real analyzer
    })),
    totalInvestment: 101250,
    totalCashFlow: -15000, // Approximate
    averageAnnualReturn: -2.5,
    exitStrategy: {
      projectedSalePrice: 604762,
      sellingCosts: 36286,
      mortgagePayoff: 280000,
      netProceeds: 288476,
      totalReturn: 187226,
      annualizedReturn: 4.8
    }
  },
  aiInsights: {
    summary: 'Test property analysis showing negative cash flow but potential for appreciation',
    strengths: ['Good location', 'Strong rental market'],
    weaknesses: ['Negative cash flow', 'High expense ratio'],
    recommendations: ['Consider negotiating purchase price', 'Explore rent increase opportunities'],
    investmentScore: 55,
    riskLevel: 'Medium-High'
  }
}

export const mockUserData = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user' as const,
  preferences: {
    mode: 'novice' as const
  }
}

// Different property scenarios for comprehensive testing
export const propertyScenarios = {
  // Positive cash flow property
  profitable: {
    ...mockSFRPropertyData,
    purchasePrice: 200000,
    downPayment: 40000,
    monthlyRent: 2200,
    propertyName: 'Profitable Property'
  },
  
  // Break-even property
  breakEven: {
    ...mockSFRPropertyData,
    purchasePrice: 300000,
    downPayment: 60000,
    monthlyRent: 2500,
    propertyName: 'Break-Even Property'
  },

  // High-end property
  luxury: {
    ...mockSFRPropertyData,
    purchasePrice: 800000,
    downPayment: 160000,
    monthlyRent: 4500,
    squareFootage: 4000,
    bedrooms: 5,
    bathrooms: 4,
    propertyName: 'Luxury Property'
  }
}