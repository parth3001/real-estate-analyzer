import { BasePropertyData } from '../../types/propertyTypes';

export const mockUser = {
  email: 'test@example.com',
  password: 'Password123',
  firstName: 'Test',
  lastName: 'User',
  role: 'user' as const,
  dualModePreferences: {
    currentMode: 'novice' as const,
    personaMapping: {
      novice: 'learning' as const,
      pro: 'experienced' as const
    },
    onboardingCompleted: false,
    modeHistory: [],
    preferences: {
      showEducationalTooltips: true,
      showDetailedCalculations: false,
      autoSaveProgress: true
    }
  }
};

export const mockSFRProperty: BasePropertyData & {
  propertyName: string;
  yearBuilt: number;
  monthlyRent: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
} = {
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
  closingCosts: 11250,
  capitalInvestments: 0,
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  }
};

export const mockFredResponse = {
  mortgageRate: 6.75,
  inflationRate: 2.67,
  unemploymentRate: 4.1,
  housingIndex: 329.608,
  trends: {
    mortgageRateTrend: 'stable',
    inflationTrend: 'moderate',
    unemploymentTrend: 'stable'
  }
};

export const mockRentcastResponse = {
  rentEstimate: 2940,
  confidence: 80,
  rentRange: {
    min: 2500,
    max: 3200
  },
  comparableProperties: [
    {
      address: '456 Similar St',
      rent: 2850,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 2400
    }
  ],
  marketTrends: {
    medianRent: 2850,
    rentGrowthRate: 3.2,
    daysOnMarket: 45
  }
};

export const mockMarketIntelligence = {
  propertyData: mockRentcastResponse,
  economicData: mockFredResponse,
  marketInsights: [
    {
      type: 'market_position',
      description: 'Property rent is 3.2% above market median',
      impact: 'neutral',
      confidence: 80
    }
  ],
  investmentTiming: {
    recommendation: 'buy',
    confidence: 70,
    reasoning: 'Favorable market conditions with stable rates'
  }
};

// Mock Deal data that matches the actual Deal model structure
export const mockDealData = {
  // Direct properties from IDeal interface
  propertyName: mockSFRProperty.propertyName,
  propertyType: mockSFRProperty.propertyType,
  propertyAddress: mockSFRProperty.propertyAddress,
  purchasePrice: mockSFRProperty.purchasePrice,
  downPayment: mockSFRProperty.downPayment,
  interestRate: mockSFRProperty.interestRate,
  loanTerm: mockSFRProperty.loanTerm,
  propertyTaxRate: mockSFRProperty.propertyTaxRate,
  insuranceRate: mockSFRProperty.insuranceRate,
  propertyManagementRate: mockSFRProperty.propertyManagementRate,
  yearBuilt: mockSFRProperty.yearBuilt,
  
  // SFR specific properties
  monthlyRent: mockSFRProperty.monthlyRent,
  squareFootage: mockSFRProperty.squareFootage,
  bedrooms: mockSFRProperty.bedrooms,
  bathrooms: mockSFRProperty.bathrooms,
  maintenanceCost: mockSFRProperty.maintenanceCost,
  longTermAssumptions: {
    projectionYears: 30,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    turnoverFrequency: 2
  },

  // Analysis data that matches the Deal model structure
  analysis: {
    monthlyAnalysis: {
      expenses: {
        propertyTax: 450,
        insurance: 187.50,
        maintenance: 294,
        propertyManagement: 235.20,
        vacancy: 147,
        tenantTurnover: 25,
        total: 1338.70
      },
      income: {
        gross: 2940,
        effective: 2793
      },
      cashFlow: -286.40
    },
    annualAnalysis: {
      dscr: 0.79,
      cashOnCashReturn: -3.82,
      capRate: 2.88,
      totalInvestment: 101250,
      annualNOI: 12960,
      annualDebtService: 16396.80,
      effectiveGrossIncome: 33516
    },
    longTermAnalysis: {
      yearlyProjections: [
        {
          year: 1,
          cashFlow: -3436.80,
          propertyValue: 463500,
          equity: 103500,
          propertyTax: 450,
          insurance: 187.50,
          maintenance: 294,
          propertyManagement: 235.20,
          vacancy: 147,
          turnoverCosts: 25,
          capitalImprovements: 0,
          operatingExpenses: 1338.70,
          noi: 12960,
          debtService: 16396.80,
          grossRent: 35280,
          mortgageBalance: 351500,
          appreciation: 13500,
          totalReturn: 10063.20
        }
      ],
      projectionYears: 30,
      returns: {
        irr: -2.5,
        totalCashFlow: -15000,
        totalAppreciation: 135000,
        totalReturn: 120000
      }
    }
  },
  marketIntelligence: mockMarketIntelligence,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const validAuthToken = 'Bearer valid-jwt-token';
export const invalidAuthToken = 'Bearer invalid-jwt-token';

// Different property scenarios for testing
export const propertyScenarios = {
  profitable: {
    ...mockSFRProperty,
    purchasePrice: 200000,
    downPayment: 40000,
    monthlyRent: 2200,
    propertyName: 'Profitable Property'
  },
  breakEven: {
    ...mockSFRProperty,
    purchasePrice: 300000,
    downPayment: 60000,
    monthlyRent: 2500,
    propertyName: 'Break-Even Property'
  },
  cashFlowNegative: {
    ...mockSFRProperty,
    purchasePrice: 500000,
    downPayment: 100000,
    monthlyRent: 2200,
    propertyName: 'Negative Cash Flow Property'
  }
};