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

// ===== MULTI-FAMILY TEST FIXTURES (Story 2.4) =====

/**
 * Mock Multi-Family Property: 8-Unit Apartment Building
 *
 * Property Details:
 * - Location: Nashville, TN (same as SFR for consistency)
 * - Type: Garden Style Apartments
 * - Units: 8 × 2BR/1BA @ 850 sqft each
 * - Rent: $1,200/unit/month ($9,600/month total)
 * - Purchase Price: $800,000
 * - Down Payment: $200,000 (25%)
 *
 * Expected Metrics (for validation):
 * - Gross Annual Income: $115,200 (8 units × $1,200 × 12)
 * - Operating Expenses: ~$40,000/year
 * - NOI: ~$75,200/year
 * - Cap Rate: 9.4% ($75,200 / $800,000)
 * - DSCR: 1.65 (NOI / Annual Debt Service)
 * - Walk-Away Price: ~$1,074,286 (NOI / 7% target cap rate)
 */
export const mockMFProperty = {
  propertyType: 'MF',
  propertyName: 'Test 8-Unit Apartment',
  propertyAddress: {
    street: '789 Multi Family Blvd',
    city: 'Nashville',
    state: 'TN',
    zipCode: '37203'
  },

  // Purchase & Financing
  purchasePrice: 800000,
  downPayment: 200000,      // 25% down ($600K loan)
  interestRate: 6.5,
  loanTerm: 30,
  closingCosts: 20000,      // 2.5% of purchase price

  // Property Details
  totalUnits: 8,
  totalSqft: 6800,          // 8 units × 850 sqft
  yearBuilt: 1995,
  buildingType: 'Garden Style Apartments',

  // Tax & Insurance
  propertyTaxRate: 1.2,     // 1.2% annual
  insuranceCost: 3000,      // $3,000/year annual insurance

  // Unit-level data (8 identical units for simplicity)
  units: [
    { unitNumber: '1', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '2', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '3', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '4', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '5', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '6', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '7', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '8', bedrooms: 2, bathrooms: 1, sqft: 850, currentRent: 1200, marketRent: 1250 }
  ],

  // Operating Expenses
  propertyManagementRate: 5,    // 5% for MF (lower than SFR 8%)
  maintenanceCost: 5760,        // $60/unit/month × 8 units × 12 months = $5,760/year

  // Common Area Utilities (MF-specific)
  commonAreaUtilities: {
    electric: 200,   // $200/month
    water: 150,      // $150/month
    gas: 100         // $100/month
  },

  // Long-term Assumptions
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 2,
    annualExpenseIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    vacancyRate: 5
  }
};

/**
 * Expected MF Metrics for Validation
 *
 * These values are pre-calculated based on the mockMFProperty data above.
 * Use these in tests to validate that the MultiFamilyAnalyzer is working correctly.
 */
export const expectedMFMetrics = {
  // Income
  grossMonthlyIncome: 9600,        // 8 units × $1,200/month
  grossAnnualIncome: 115200,       // $9,600 × 12

  // NOI Calculation (from MF Sprint 1 implementation)
  noi: 75200,                       // Approximate (actual will be calculated by analyzer)

  // Key Metrics
  capRate: 9.4,                     // $75,200 / $800,000 = 9.4%
  dscr: 1.65,                       // Approximate (NOI / Annual Debt Service)
  cashOnCashReturn: 14.9,           // Approximate

  // Walk-Away Price (MFDecisionEngine formula: NOI / target cap rate)
  walkAwayPrice: 1074286,           // $75,200 / 0.07 = $1,074,286
  targetCapRate: 0.07,              // 7% conservative target

  // Per-Unit Metrics
  noiPerUnit: 9400,                 // $75,200 / 8 units
  rentPerSqft: 1.41,                // $1,200 / 850 sqft

  // Monthly Debt Service (for DSCR validation)
  monthlyDebtService: 3792,         // $600K loan @ 6.5% for 30 years
  annualDebtService: 45504          // $3,792 × 12
};

/**
 * Mock MF Property with LOW DSCR (for testing critical warnings)
 *
 * This property has:
 * - Only 10% down payment (high leverage)
 * - 8% interest rate (expensive debt)
 * - Result: DSCR < 1.25 (commercial lender will reject)
 */
export const mockMFPropertyLowDSCR = {
  ...mockMFProperty,
  downPayment: 80000,       // 10% down (high leverage)
  interestRate: 8.0,        // High interest rate
  propertyName: 'Test 8-Unit Apartment (Low DSCR)'
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