/**
 * TIER 3 Test Fixture: Base Multi-Family Property
 *
 * Purpose: Reusable test data for Multi-Family strategy data flow validation
 * Issue: #53 - Platform-Wide Silent Fallback Defaults
 *
 * Note: Multi-Family has KNOWN bugs from TIER 1 audit:
 * - maintenanceCostPerUnit inconsistency (|| 0 vs || 100)
 * - Complex data structures (units[] vs unitTypes[])
 */

export const baseMultiFamilyProperty = {
  // Property identification
  address: '789 Multifamily Complex',
  city: 'Houston',
  state: 'TX',
  zipCode: '77001',

  // Purchase details
  purchasePrice: 800000,
  downPayment: 200000,
  closingCosts: 16000,
  interestRate: 7.0,
  loanTerm: 30,

  // Multi-Family specific fields
  totalUnits: 8,
  totalSqft: 6400, // 800 sqft per unit average

  // Building details
  yearBuilt: 2010,
  buildingType: 'Garden Style Apartments',

  // CRITICAL TEST: maintenanceCostPerUnit (KNOWN BUG - Issue #53 TIER 1)
  // Should use $150/unit, NOT fall back to $100 (or worse, $0)
  maintenanceCostPerUnit: 150,

  // TEST: Should use 3%, NOT fall back to default 5%
  vacancyRate: 3,

  // Unit-level data (granular method) - TESTING COMPLEX DATA STRUCTURE
  units: [
    // 4 one-bedroom units
    { unitNumber: '101', bedrooms: 1, bathrooms: 1, sqft: 650, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '102', bedrooms: 1, bathrooms: 1, sqft: 650, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '201', bedrooms: 1, bathrooms: 1, sqft: 650, currentRent: 1200, marketRent: 1250 },
    { unitNumber: '202', bedrooms: 1, bathrooms: 1, sqft: 650, currentRent: 1200, marketRent: 1250 },

    // 4 two-bedroom units
    { unitNumber: '103', bedrooms: 2, bathrooms: 2, sqft: 950, currentRent: 1600, marketRent: 1650 },
    { unitNumber: '104', bedrooms: 2, bathrooms: 2, sqft: 950, currentRent: 1600, marketRent: 1650 },
    { unitNumber: '203', bedrooms: 2, bathrooms: 2, sqft: 950, currentRent: 1600, marketRent: 1650 },
    { unitNumber: '204', bedrooms: 2, bathrooms: 2, sqft: 950, currentRent: 1600, marketRent: 1650 }
  ],

  // Common area expenses - TESTING MULTI-FAMILY SPECIFIC FIELDS
  commonAreaUtilities: {
    electric: 200,
    water: 150,
    gas: 100,
    trash: 80,
    internet: 70
  },

  // Additional income sources - TESTING OPTIONAL REVENUE FIELDS
  parkingIncome: 200,   // $25/space × 8 spaces
  laundryIncome: 100,   // Coin laundry
  otherIncome: 50,      // Pet fees, storage

  // Long-term assumptions
  longTermAssumptions: {
    appreciationRate: 3,
    rentGrowthRate: 3,
    expenseGrowthRate: 3,
    vacancyRate: 5,
    capExReserve: 5,
    turnoverFrequency: 3,
    realtorCommission: 0.5
  },

  // Monthly expenses
  monthlyPropertyTax: 800,
  monthlyInsurance: 400,
  monthlyHOA: 0, // No HOA for MF
  monthlyUtilities: 0, // Separate from common area
  propertyManagementFee: 10,

  // Strategy
  investmentStrategy: 'Multi-Family' as const
};

/**
 * Variant: Multi-Family using unitTypes (bulk method) instead of individual units
 * TESTING ALTERNATIVE DATA STRUCTURE
 */
export const multiFamilyPropertyUnitTypes = {
  ...baseMultiFamilyProperty,

  // Remove individual units array
  units: undefined,

  // Use unitTypes instead - TESTING BULK INPUT METHOD
  unitTypes: [
    {
      type: 'Studio',
      count: 2,
      avgSqft: 500,
      avgCurrentRent: 900,
      avgMarketRent: 950
    },
    {
      type: '1BR/1BA',
      count: 3,
      avgSqft: 650,
      avgCurrentRent: 1200,
      avgMarketRent: 1250
    },
    {
      type: '2BR/2BA',
      count: 3,
      avgSqft: 950,
      avgCurrentRent: 1600,
      avgMarketRent: 1650
    }
  ]
};

/**
 * Variant: Multi-Family with ZERO maintenance (edge case to catch TIER 1 bug)
 * CRITICAL TEST: This should trigger the maintenanceCostPerUnit || 0 vs || 100 bug
 */
export const multiFamilyPropertyZeroMaintenance = {
  ...baseMultiFamilyProperty,

  // ZERO VALUE TEST: User sets $0 maintenance (new construction with warranty)
  // OLD BUG: Line 1010 uses || 0, so 0 || 0 = 0 (BUT Line 410 uses || 100)
  // This should expose the inconsistency!
  maintenanceCostPerUnit: 0
};

/**
 * Variant: Multi-Family with maximum complexity (stress test)
 */
export const multiFamilyPropertyComplex = {
  ...baseMultiFamilyProperty,

  // Large property
  totalUnits: 32,
  totalSqft: 28000,

  // High maintenance
  maintenanceCostPerUnit: 200,

  // High vacancy
  vacancyRate: 8,

  // Complex common area utilities
  commonAreaUtilities: {
    electric: 800,
    water: 600,
    gas: 400,
    trash: 300,
    internet: 200,
    landscaping: 500,
    poolMaintenance: 300,
    elevatorMaintenance: 200
  },

  // Significant other income
  parkingIncome: 800,   // Covered parking, garage spaces
  laundryIncome: 400,   // 32 units with laundry
  otherIncome: 300,     // Pet fees, storage, vending
  storageIncome: 200,   // Storage units

  longTermAssumptions: {
    appreciationRate: 2.5,
    rentGrowthRate: 2.5,
    expenseGrowthRate: 4, // Higher expense growth
    vacancyRate: 7,
    capExReserve: 8,
    turnoverFrequency: 2, // Higher turnover
    realtorCommission: 0.5
  }
};

/**
 * Helper: Calculate expected total monthly rent from units array
 */
export function calculateExpectedMonthlyRent(units: any[]): number {
  return units.reduce((total, unit) => total + unit.currentRent, 0);
}

/**
 * Helper: Calculate expected total monthly rent from unitTypes array
 */
export function calculateExpectedMonthlyRentFromTypes(unitTypes: any[]): number {
  return unitTypes.reduce((total, type) => total + (type.avgCurrentRent * type.count), 0);
}
