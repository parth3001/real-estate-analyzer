/**
 * Multi-Family Property Test Data Factory
 *
 * Purpose: Provides consistent, realistic test data for MultiFamilyAnalyzer tests
 * Based on: Actual Anna, TX market data (8-unit property, October 2025)
 *
 * Usage:
 *   const property = MFPropertyFactory.create();  // Default realistic property
 *   const property = MFPropertyFactory.create({ totalUnits: 12 });  // Override specific fields
 *   const property = MFPropertyFactory.createWithHighVacancy();  // Pre-configured variation
 */

import { MultiFamilyData } from '../../types/propertyTypes';

export class MFPropertyFactory {
  /**
   * Create a realistic 8-unit multi-family property in Anna, TX
   * All values based on actual market data as of October 2025
   */
  static create(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    const defaults: MultiFamilyData = {
      // Property type
      propertyType: 'MF' as const,

      // Property identification
      propertyAddress: {
        street: '123 Main St',
        city: 'Anna',
        state: 'TX',
        zipCode: '75409'
      },

      // Purchase details
      purchasePrice: 1200000,        // $150K per unit (market rate)
      closingCosts: 36000,           // 3% of purchase price
      capitalInvestments: 0,         // Stabilized property, no rehab needed

      // Financing
      downPayment: 300000,           // 25% down payment
      interestRate: 6.5,             // Current market rate for commercial MF loans
      loanTerm: 30,                  // 30-year amortization

      // Building details
      totalUnits: 8,
      totalSqft: 8000,               // (4*900 + 4*1100)
      yearBuilt: 2015,               // 10-year-old property (good condition)

      // Unit configuration (8 units: 4x 2BR, 4x 3BR)
      units: [
        // Four 2BR/1BA units @ $1,400/month
        {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          currentRent: 1400,
          unitNumber: '101'
        },
        {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          currentRent: 1400,
          unitNumber: '102'
        },
        {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          currentRent: 1400,
          unitNumber: '201'
        },
        {
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          currentRent: 1400,
          unitNumber: '202'
        },
        // Four 3BR/2BA units @ $1,500/month
        {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1100,
          currentRent: 1500,
          unitNumber: '103'
        },
        {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1100,
          currentRent: 1500,
          unitNumber: '104'
        },
        {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1100,
          currentRent: 1500,
          unitNumber: '203'
        },
        {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1100,
          currentRent: 1500,
          unitNumber: '204'
        }
      ],

      // Operating expenses (annual basis)
      propertyTaxRate: 1.8,          // Collin County, TX rate (1.8%)
      insuranceRate: 0.6,            // Texas market rate (0.6% of property value)
      insurancePerUnit: 600,         // ✅ ADDED: $600/year per unit (Issue #3 fix)
      maintenanceCost: 9600,         // $100/unit/month × 8 units × 12 months
      maintenanceCostPerUnit: 100,   // $100/unit/month
      propertyManagementRate: 8,     // 8% of gross rent (typical for 8-unit property)

      // Utilities (landlord-paid common areas) - monthly
      commonAreaUtilities: {
        electric: 180,               // Common area electricity per month
        water: 200,                  // Common area water/sewer per month
        gas: 0,                      // No gas
        trash: 150                   // Garbage service for 8 units per month
      },

      // Long-term assumptions
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 3.0,
        annualPropertyValueIncrease: 3.0,
        inflationRate: 2.5,
        vacancyRate: 5.0,            // 5% vacancy assumption
        sellingCostsPercentage: 6.0,
        turnoverFrequency: 3         // Tenant turnover every 3 years
      }
    };

    // Merge overrides with defaults
    const property = { ...defaults, ...overrides };

    // If units were overridden, recalculate derived fields
    if (overrides?.units && overrides.units.length > 0) {
      property.totalUnits = overrides.units.length;
      property.totalSqft = overrides.units.reduce((sum, unit) => sum + unit.squareFeet, 0);
    }

    return property;
  }

  /**
   * Create property with high vacancy (below-market rents)
   * Use case: Testing worst-case scenarios, distressed properties
   */
  static createWithHighVacancy(): MultiFamilyData {
    return this.create({
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 2.0,
        annualPropertyValueIncrease: 2.0,
        inflationRate: 2.5,
        vacancyRate: 25.0,           // 25% vacancy (high vacancy scenario)
        sellingCostsPercentage: 6.0,
        turnoverFrequency: 2         // More frequent turnover
      },
      units: [
        // Reduce all rents by 15%
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1190, unitNumber: '101' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1190, unitNumber: '102' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1190, unitNumber: '201' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1190, unitNumber: '202' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1275, unitNumber: '103' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1275, unitNumber: '104' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1275, unitNumber: '203' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1275, unitNumber: '204' }
      ]
    });
  }

  /**
   * Create property with low operating expenses
   * Use case: Testing best-case scenarios, well-maintained properties
   */
  static createWithLowExpenses(): MultiFamilyData {
    return this.create({
      propertyTaxRate: 1.2,          // Lower tax rate (different municipality)
      insuranceRate: 0.4,            // Lower insurance (better claims history)
      maintenanceCostPerUnit: 75,    // Lower maintenance (newer property)
      maintenanceCost: 7200,         // $75/unit/month × 8 units × 12 months
      propertyManagementRate: 6,     // Lower management fee (owner involved)
      commonAreaUtilities: {
        electric: 120,               // Lower utilities (energy-efficient)
        water: 150,                  // Lower water costs
        gas: 0,
        trash: 100                   // Lower garbage costs
      }
    });
  }

  /**
   * Create property with high debt (aggressive financing)
   * Use case: Testing leverage scenarios, DSCR calculations
   */
  static createWithHighDebt(): MultiFamilyData {
    return this.create({
      downPayment: 120000,           // Only 10% down (90% LTV - aggressive)
      interestRate: 7.5,             // Higher rate due to higher LTV
      loanTerm: 25                   // Shorter term (higher monthly payment)
    });
  }

  /**
   * Create property with zero debt (all cash purchase)
   * Use case: Testing cash-on-cash return edge cases, no DSCR
   */
  static createWithNoDebt(): MultiFamilyData {
    return this.create({
      downPayment: 1200000,          // 100% down = no loan
      interestRate: 0,               // No loan = no interest
      loanTerm: 0                    // No loan term
    });
  }

  /**
   * Create large multi-family property (50 units)
   * Use case: Testing scalability, large property scenarios
   */
  static createLargeProperty(): MultiFamilyData {
    const units = [];

    // Create 50 units (25x 2BR, 25x 3BR)
    for (let i = 1; i <= 25; i++) {
      units.push({
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 900,
        currentRent: 1400,
        unitNumber: `${i}`
      });
    }
    for (let i = 26; i <= 50; i++) {
      units.push({
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1100,
        currentRent: 1500,
        unitNumber: `${i}`
      });
    }

    return this.create({
      purchasePrice: 7500000,        // $150K per unit × 50
      downPayment: 1875000,          // 25% down
      totalUnits: 50,
      units,
      totalSqft: 50000,
      maintenanceCostPerUnit: 90,    // Economies of scale
      maintenanceCost: 54000,        // $90/unit/month × 50 units × 12 months
      propertyManagementRate: 6      // Lower rate for larger property
    });
  }

  /**
   * Create property with negative cash flow (bad deal)
   * Use case: Testing negative NOI scenarios
   */
  static createNegativeCashFlow(): MultiFamilyData {
    return this.create({
      purchasePrice: 2000000,        // High price
      downPayment: 400000,           // 20% down
      interestRate: 8.0,             // High interest
      propertyTaxRate: 2.5,          // High taxes
      insuranceRate: 1.0,            // High insurance
      maintenanceCostPerUnit: 200,   // High maintenance
      maintenanceCost: 19200,        // $200/unit/month × 8 units × 12 months
      units: [
        // Low rents
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '101' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '102' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '201' },
        { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '202' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1100, unitNumber: '103' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1100, unitNumber: '104' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1100, unitNumber: '203' },
        { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1100, unitNumber: '204' }
      ]
    });
  }

  /**
   * Helper: Calculate average rent per unit from units array
   */
  static calculateAverageRent(property: MultiFamilyData): number {
    if (!property.units || property.units.length === 0) {
      return 0;
    }
    const totalRent = property.units.reduce((sum, unit) => sum + unit.currentRent, 0);
    return totalRent / property.units.length;
  }

  /**
   * Helper: Calculate gross annual income from units array
   */
  static calculateGrossAnnualIncome(property: MultiFamilyData): number {
    return this.calculateAverageRent(property) * property.totalUnits * 12;
  }
}
