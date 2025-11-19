import { MultiFamilyData } from '../../types/propertyTypes';
import { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

/**
 * Multi-Family Property Test Data Factory
 * Created: October 25, 2025
 * Purpose: Provide consistent, realistic MF property data for unit and integration tests
 *
 * Usage:
 * ```typescript
 * const property = MFPropertyFactory.create(); // 8-unit default
 * const duplex = MFPropertyFactory.createDuplex();
 * const custom = MFPropertyFactory.create({ totalUnits: 16, purchasePrice: 2400000 });
 * ```
 */

export class MFPropertyFactory {
  /**
   * Create a realistic 8-unit multi-family property (default)
   * @param overrides Partial property data to override defaults
   */
  static create(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    const defaults: MultiFamilyData = {
      propertyType: 'MF',
      totalUnits: 8,
      totalSqft: 7200, // 900 sqft per unit average
      purchasePrice: 1200000, // $150K per unit
      downPayment: 240000, // 20% down
      interestRate: 7.25, // Commercial rate (higher than SFR)
      loanTerm: 30,
      propertyTaxRate: 1.5, // Slightly higher than SFR
      insuranceRate: 0.6,
      insurancePerUnit: 600, // ✅ ADDED: $600/year per unit (Issue #3 fix)
      maintenanceCost: 800, // $800/month total (from BasePropertyData requirement)
      propertyManagementRate: 8, // 8% of gross income
      maintenanceCostPerUnit: 100, // $100/month per unit
      buildingType: 'GARDEN', // Phase 1: Garden-style (most common commercial MF)

      propertyAddress: {
        street: '456 Rental Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701'
      },

      unitTypes: [
        {
          type: '2bed/1bath',
          count: 6,
          sqft: 900,
          monthlyRent: 1500
        },
        {
          type: '1bed/1bath',
          count: 2,
          sqft: 700,
          monthlyRent: 1200
        }
      ],

      commonAreaUtilities: {
        electric: 150,  // Monthly
        water: 100,
        gas: 50,
        trash: 80
      },

      yearBuilt: 2010,
      closingCosts: 30000, // 2.5% of purchase price
      capitalInvestments: 0,

      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3.5,
        inflationRate: 2.5,
        vacancyRate: 5,
        sellingCostsPercentage: 6,
        turnoverFrequency: 3 // Years between tenant turnover
      }
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create a 2-unit duplex (minimum MF property)
   */
  static createDuplex(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 2,
      totalSqft: 2000,
      purchasePrice: 400000,
      downPayment: 80000, // 20%
      unitTypes: [
        {
          type: '2bed/1bath',
          count: 2,
          sqft: 1000,
          monthlyRent: 1500
        }
      ],
      maintenanceCostPerUnit: 150, // Higher per-unit cost for small properties
      commonAreaUtilities: {
        electric: 50,
        water: 40,
        gas: 20,
        trash: 30
      },
      ...overrides
    });
  }

  /**
   * Create a 4-unit fourplex
   */
  static createFourplex(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 4,
      totalSqft: 3600,
      purchasePrice: 600000,
      downPayment: 120000,
      unitTypes: [
        {
          type: '2bed/1bath',
          count: 4,
          sqft: 900,
          monthlyRent: 1500
        }
      ],
      commonAreaUtilities: {
        electric: 80,
        water: 60,
        gas: 30,
        trash: 50
      },
      ...overrides
    });
  }

  /**
   * Create a 32-unit apartment complex (maximum target range)
   */
  static createLargeComplex(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 32,
      totalSqft: 28800, // 900 sqft average
      purchasePrice: 4800000, // $150K per unit
      downPayment: 1200000, // 25% down (commercial typical)
      interestRate: 6.75, // Better rate for larger property
      unitTypes: [
        {
          type: '3bed/2bath',
          count: 8,
          sqft: 1200,
          monthlyRent: 2000
        },
        {
          type: '2bed/2bath',
          count: 12,
          sqft: 1000,
          monthlyRent: 1700
        },
        {
          type: '2bed/1bath',
          count: 8,
          sqft: 850,
          monthlyRent: 1400
        },
        {
          type: '1bed/1bath',
          count: 4,
          sqft: 650,
          monthlyRent: 1100
        }
      ],
      maintenanceCostPerUnit: 80, // Economies of scale
      commonAreaUtilities: {
        electric: 600,  // Hallways, parking, common areas
        water: 400,
        gas: 200,
        trash: 300
      },
      closingCosts: 120000, // 2.5%
      ...overrides
    });
  }

  /**
   * Create a negative cash flow property (high price, low rents)
   */
  static createNegativeCashFlow(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      purchasePrice: 2000000, // Overpriced
      downPayment: 400000,
      totalUnits: 8,
      totalSqft: 6400,
      unitTypes: [
        {
          type: '1bed/1bath',
          count: 8,
          sqft: 800,
          monthlyRent: 1200 // Low rent for price
        }
      ],
      propertyTaxRate: 2.0, // High taxes
      maintenanceCostPerUnit: 150, // High maintenance
      ...overrides
    });
  }

  /**
   * Create a high-performing property (strong cash flow, high DSCR)
   */
  static createHighPerformer(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      purchasePrice: 800000, // Good price
      downPayment: 200000, // 25%
      totalUnits: 8,
      totalSqft: 7200,
      unitTypes: [
        {
          type: '2bed/1bath',
          count: 8,
          sqft: 900,
          monthlyRent: 1800 // Strong rents
        }
      ],
      propertyTaxRate: 1.0, // Low taxes
      insuranceRate: 0.4,
      maintenanceCostPerUnit: 75, // Well-maintained, newer property
      interestRate: 6.5, // Good rate
      ...overrides
    });
  }

  /**
   * Create an all-cash purchase (no mortgage)
   */
  static createAllCash(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    const property = MFPropertyFactory.create(overrides);
    return {
      ...property,
      downPayment: property.purchasePrice, // 100% down
      interestRate: 0,
      loanTerm: 0
    };
  }

  /**
   * Create a mixed-use property (commercial + residential)
   */
  static createMixedUse(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 10,
      totalSqft: 12000,
      purchasePrice: 2000000,
      downPayment: 500000, // 25%
      unitTypes: [
        {
          type: '2bed/1bath residential',
          count: 8,
          sqft: 900,
          monthlyRent: 1600
        },
        {
          type: 'commercial retail',
          count: 2,
          sqft: 1200,
          monthlyRent: 3000 // Higher rent for commercial
        }
      ],
      maintenanceCostPerUnit: 120,
      commonAreaUtilities: {
        electric: 250,
        water: 150,
        gas: 80,
        trash: 120
      },
      ...overrides
    });
  }

  /**
   * Create a value-add opportunity (below-market rents, upside potential)
   */
  static createValueAdd(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      purchasePrice: 1000000,
      downPayment: 250000, // 25%
      totalUnits: 8,
      totalSqft: 7200,
      unitTypes: [
        {
          type: '2bed/1bath',
          count: 8,
          sqft: 900,
          monthlyRent: 1200 // Below market (market is $1500-1600)
        }
      ],
      capitalInvestments: 80000, // $10K per unit renovation
      maintenanceCostPerUnit: 150, // Higher initially (deferred maintenance)
      yearBuilt: 1985, // Older property
      ...overrides
    });
  }

  /**
   * Create a property with edge case: zero units (for error testing)
   */
  static createZeroUnits(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 0,
      totalSqft: 0,
      unitTypes: [],
      ...overrides
    });
  }

  /**
   * Create a property with edge case: 1 unit (technically SFR, not MF)
   */
  static createSingleUnit(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 1,
      totalSqft: 1200,
      purchasePrice: 250000,
      downPayment: 50000,
      unitTypes: [
        {
          type: '3bed/2bath',
          count: 1,
          sqft: 1200,
          monthlyRent: 2000
        }
      ],
      ...overrides
    });
  }

  /**
   * Create a property outside target range: 50 units (above 32-unit max)
   */
  static createOversized(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return MFPropertyFactory.create({
      totalUnits: 50,
      totalSqft: 45000,
      purchasePrice: 7500000,
      downPayment: 2250000, // 30%
      interestRate: 6.25, // Better rate for large property
      unitTypes: [
        {
          type: '2bed/2bath',
          count: 30,
          sqft: 950,
          monthlyRent: 1600
        },
        {
          type: '1bed/1bath',
          count: 20,
          sqft: 750,
          monthlyRent: 1300
        }
      ],
      maintenanceCostPerUnit: 70,
      commonAreaUtilities: {
        electric: 1000,
        water: 600,
        gas: 300,
        trash: 500
      },
      ...overrides
    });
  }

  /**
   * Create property with GRANULAR unit-level data (Story 1.1 - NEW feature)
   * Demonstrates competitive advantage: unit-by-unit tracking with market rent comparison
   */
  static createWithGranularUnits(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return {
      propertyType: 'MF',
      totalUnits: 8,
      totalSqft: 7200,
      purchasePrice: 1200000,
      downPayment: 240000,
      interestRate: 7.25,
      loanTerm: 30,
      propertyTaxRate: 1.5,
      insuranceRate: 0.6,
      insurancePerUnit: 600, // ✅ ADDED: $600/year per unit (Issue #3 fix)
      maintenanceCost: 800, // $800/month total (BasePropertyData requirement)
      propertyManagementRate: 8,
      maintenanceCostPerUnit: 100,
      yearBuilt: 2010,

      propertyAddress: {
        street: '456 Rental Ave',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701'
      },

      // ✨ GRANULAR UNITS - Competitive Moat Feature
      units: [
        { unitNumber: '101', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1500, marketRent: 1550, isVacant: false, condition: 'GOOD' },
        { unitNumber: '102', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1450, marketRent: 1550, isVacant: false, condition: 'FAIR' }, // $100 below market!
        { unitNumber: '103', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1500, marketRent: 1550, isVacant: false, condition: 'GOOD' },
        { unitNumber: '104', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1350, marketRent: 1550, isVacant: false, condition: 'POOR' }, // $200 below market! Needs work
        { unitNumber: '201', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1500, marketRent: 1550, isVacant: false, condition: 'GOOD' },
        { unitNumber: '202', bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1550, marketRent: 1550, isVacant: false, condition: 'EXCELLENT' },
        { unitNumber: '203', bedrooms: 1, bathrooms: 1, squareFeet: 700, currentRent: 1200, marketRent: 1250, isVacant: false, condition: 'GOOD' },
        { unitNumber: '204', bedrooms: 1, bathrooms: 1, squareFeet: 700, currentRent: 1150, marketRent: 1250, isVacant: true, condition: 'FAIR' } // Vacant + below market
      ],

      commonAreaUtilities: {
        electric: 150,
        water: 100,
        gas: 50,
        trash: 80
      },

      loanType: 'COMMERCIAL', // 5+ units = commercial loan
      closingCosts: 30000,
      capitalInvestments: 0,

      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3.5,
        inflationRate: 2.5,
        vacancyRate: 5,
        sellingCostsPercentage: 6,
        turnoverFrequency: 3
      },

      ...overrides
    };
  }
}

/**
 * Standard analysis assumptions for MF properties
 */
export const defaultMFAssumptions: AnalysisAssumptions = {
  projectionYears: 30,
  annualRentIncrease: 3,
  annualExpenseIncrease: 2.5,
  annualPropertyValueIncrease: 3.5,
  sellingCosts: 6,
  vacancyRate: 5,
  turnoverFrequency: 3
};

/**
 * Conservative assumptions (stress test scenario)
 */
export const conservativeMFAssumptions: AnalysisAssumptions = {
  projectionYears: 30,
  annualRentIncrease: 2,
  annualExpenseIncrease: 4,
  annualPropertyValueIncrease: 2,
  sellingCosts: 7,
  vacancyRate: 8,
  turnoverFrequency: 2
};

/**
 * Aggressive assumptions (best case scenario)
 */
export const aggressiveMFAssumptions: AnalysisAssumptions = {
  projectionYears: 30,
  annualRentIncrease: 5,
  annualExpenseIncrease: 2,
  annualPropertyValueIncrease: 5,
  sellingCosts: 5,
  vacancyRate: 3,
  turnoverFrequency: 4
};

/**
 * Real property scenarios for realistic testing
 */
export const mfPropertyScenarios = {
  /**
   * Austin, TX - 8-unit complex (default baseline)
   */
  austinEightPlex: MFPropertyFactory.create(),

  /**
   * Fayetteville, NC - 4-unit investment property
   */
  fayettevilleFourplex: MFPropertyFactory.createFourplex({
    propertyAddress: {
      street: '123 Bragg Blvd',
      city: 'Fayetteville',
      state: 'NC',
      zipCode: '28301'
    },
    purchasePrice: 480000,
    downPayment: 96000,
    interestRate: 7.5,
    unitTypes: [
      {
        type: '2bed/1bath',
        count: 4,
        sqft: 850,
        monthlyRent: 1300
      }
    ]
  }),

  /**
   * Nashville, TN - 16-unit apartment building
   */
  nashvilleSixteenUnit: MFPropertyFactory.create({
    totalUnits: 16,
    totalSqft: 14400,
    purchasePrice: 2800000,
    downPayment: 700000, // 25%
    interestRate: 6.875,
    propertyAddress: {
      street: '789 Music Row',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203'
    },
    unitTypes: [
      {
        type: '2bed/2bath',
        count: 10,
        sqft: 1000,
        monthlyRent: 1800
      },
      {
        type: '1bed/1bath',
        count: 6,
        sqft: 750,
        monthlyRent: 1400
      }
    ],
    propertyTaxRate: 1.2,
    maintenanceCostPerUnit: 90
  }),

  /**
   * High cash flow property (strong performer)
   */
  strongCashFlow: MFPropertyFactory.createHighPerformer({
    propertyAddress: {
      street: '321 Investment Way',
      city: 'Fort Worth',
      state: 'TX',
      zipCode: '76102'
    }
  }),

  /**
   * Negative cash flow (distressed/overpriced)
   */
  distressed: MFPropertyFactory.createNegativeCashFlow({
    propertyAddress: {
      street: '999 Loss Lane',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    }
  }),

  /**
   * Value-add opportunity
   */
  valueAdd: MFPropertyFactory.createValueAdd({
    propertyAddress: {
      street: '555 Potential Pl',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303'
    }
  })
};

/**
 * Expected NOI calculations for validation
 * (Use these to validate analyzer output)
 */
export const expectedNOICalculations = {
  austinEightPlex: {
    grossIncome: 117600, // (1500*6 + 1200*2) * 12
    vacancyLoss: 5880, // 5%
    creditLoss: 2352, // 2%
    effectiveGrossIncome: 109368, // 117600 - 5880 - 2352
    operatingExpenses: 79380, // Calculated from property data
    noi: 29988 // 109368 - 79380
  }
};
