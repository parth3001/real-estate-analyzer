/**
 * TIER 3 Test Fixture: Base BRRRR Property
 *
 * Purpose: Reusable test data for BRRRR strategy data flow validation
 * Issue: #53 - Platform-Wide Silent Fallback Defaults
 *
 * This fixture is designed to test that user-provided values are preserved
 * and NOT replaced with fallback defaults.
 */

export const baseBRRRProperty = {
  // Property identification
  address: '123 Test Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',

  // Purchase details
  purchasePrice: 100000,
  downPayment: 20000,
  closingCosts: 2000,
  interestRate: 7.5,
  loanTerm: 30,

  // Rental income
  monthlyRent: 1500,

  // BRRRR specific fields - TESTING CRITICAL DATA FLOW
  brrrr: {
    // ARV (After Repair Value)
    ARV: 150000,

    // Rehab budget
    rehabBudget: 30000,

    // CRITICAL TEST: Should use 9.25%, NOT fall back to interestRate (7.5%)
    // Issue #51 - This was the bug that triggered Issue #53 discovery
    refinanceInterestRate: 9.25,

    // CRITICAL TEST: Should use 80%, NOT fall back to default 75%
    refinanceLTV: 80,

    // CRITICAL TEST: Should use 18 months, NOT fall back to default 12
    seasoningPeriod: 18,

    // TEST: Should use 4 months, NOT fall back to default 6
    estimatedRehabTime: 4,

    // TEST: Should use 3%, NOT fall back to default 2%
    refinanceClosingCostPercentage: 3,

    // TEST: Should preserve $0 (no cash out desired)
    cashOutAmount: 0
  },

  // Long-term assumptions - TESTING NESTED OBJECT DATA FLOW
  longTermAssumptions: {
    // TEST: Should use 3.5%, NOT fall back to default 3%
    appreciationRate: 3.5,

    // TEST: Should use 2%, NOT fall back to default 3%
    rentGrowthRate: 2,

    // TEST: Should use 2.5%, NOT fall back to default 3%
    expenseGrowthRate: 2.5,

    // CRITICAL ZERO VALUE TEST: Should preserve 0% (guaranteed tenant, no vacancy)
    // Old bug: vacancyRate: 0 || 5 = 5 (WRONG)
    // New fix: vacancyRate: 0 ?? 5 = 0 (CORRECT)
    vacancyRate: 0,

    // TEST: Should use 5%, standard for this property
    capExReserve: 5,

    // TEST: Should use 2 years, NOT fall back to different default
    turnoverFrequency: 2,

    // TEST: Should use 0.5%, standard commission
    realtorCommission: 0.5
  },

  // Monthly expenses - TESTING ZERO VALUES
  monthlyPropertyTax: 200,
  monthlyInsurance: 100,

  // ZERO VALUE TEST: Should preserve $0 (no HOA for this property)
  monthlyHOA: 0,

  // ZERO VALUE TEST: Should preserve $0 (tenant pays utilities)
  monthlyUtilities: 0,

  propertyManagementFee: 10,
  maintenanceCostPerMonth: 150,
  tenantTurnoverFees: 1000,

  // Strategy
  investmentStrategy: 'BRRRR' as const
};

/**
 * Variant: BRRRR property with ALL defaults (for fallback testing)
 * This tests that when user DOESN'T provide values, defaults are used correctly
 */
export const brrrPropertyWithDefaults = {
  ...baseBRRRProperty,
  brrrr: {
    ARV: 150000,
    rehabBudget: 30000,
    // Intentionally omit refinanceInterestRate - should fall back to interestRate (7.5%)
    // Intentionally omit refinanceLTV - should fall back to 75%
    // Intentionally omit seasoningPeriod - should fall back to 12
    cashOutAmount: 0
  }
};

/**
 * Variant: BRRRR property with extreme edge cases
 */
export const brrrPropertyEdgeCases = {
  ...baseBRRRProperty,

  // Edge case: Very high down payment (50%)
  downPayment: 50000,

  // Edge case: 0% interest rate (promotional financing)
  interestRate: 0,

  brrrr: {
    ARV: 150000,
    rehabBudget: 30000,

    // Edge case: 0% refinance rate (special program)
    refinanceInterestRate: 0,

    // Edge case: Maximum LTV (95%)
    refinanceLTV: 95,

    // Edge case: Very long seasoning (24 months)
    seasoningPeriod: 24,

    // Edge case: Quick rehab (1 month)
    estimatedRehabTime: 1,

    cashOutAmount: 0
  },

  longTermAssumptions: {
    // Edge case: Negative appreciation (declining market)
    appreciationRate: -2,

    // Edge case: No rent growth
    rentGrowthRate: 0,

    // Edge case: High expense growth (inflation)
    expenseGrowthRate: 5,

    // Edge case: Zero vacancy (guaranteed lease)
    vacancyRate: 0,

    // Edge case: No CapEx reserve
    capExReserve: 0,

    turnoverFrequency: 3,
    realtorCommission: 0.6
  }
};
