/**
 * TIER 3 Test Fixture: Base Buy & Hold Property
 *
 * Purpose: Reusable test data for Buy & Hold strategy data flow validation
 * Issue: #53 - Platform-Wide Silent Fallback Defaults
 */

export const baseBuyHoldProperty = {
  // Property identification
  address: '456 Buy Hold Lane',
  city: 'Dallas',
  state: 'TX',
  zipCode: '75201',

  // Purchase details
  purchasePrice: 200000,
  downPayment: 40000,
  closingCosts: 4000,
  interestRate: 6.5,
  loanTerm: 30,

  // Rental income
  monthlyRent: 2000,

  // Long-term assumptions
  longTermAssumptions: {
    appreciationRate: 3,
    rentGrowthRate: 3,
    expenseGrowthRate: 3,

    // TEST: Should use 4%, NOT fall back to default 5%
    vacancyRate: 4,

    // TEST: Should use 6%, NOT fall back to default 5%
    capExReserve: 6,

    // TEST: Should use 3 years, NOT fall back to default 2
    turnoverFrequency: 3,

    // TEST: Should use 0.6%, NOT fall back to default 0.5%
    realtorCommission: 0.6
  },

  // Monthly expenses - TESTING SPECIFIC BUY & HOLD FIELDS
  monthlyPropertyTax: 350,
  monthlyInsurance: 150,

  // ZERO VALUE TEST: No HOA for this property
  monthlyHOA: 0,

  // ZERO VALUE TEST: Tenant pays utilities (owner pays $0)
  monthlyUtilities: 0,

  // TEST: Should use 8%, NOT fall back to default 10%
  propertyManagementFee: 8,

  maintenanceCostPerMonth: 200,

  // TEST: Should use $1500, NOT fall back to different default
  tenantTurnoverFees: 1500,

  // TEST: Should preserve $200 for other expenses
  otherMonthlyExpenses: 200,

  // Strategy
  investmentStrategy: 'Buy & Hold' as const
};

/**
 * Variant: Buy & Hold with zero monthly expenses (edge case)
 */
export const buyHoldPropertyZeroExpenses = {
  ...baseBuyHoldProperty,

  // ZERO VALUE TESTS: All these should be preserved as $0
  monthlyHOA: 0,
  monthlyUtilities: 0,
  otherMonthlyExpenses: 0,

  longTermAssumptions: {
    ...baseBuyHoldProperty.longTermAssumptions,

    // ZERO VALUE TEST: Zero vacancy (guaranteed tenant)
    vacancyRate: 0,

    // ZERO VALUE TEST: Zero CapEx (new construction with warranty)
    capExReserve: 0
  }
};

/**
 * Variant: Buy & Hold with maximum expenses (stress test)
 */
export const buyHoldPropertyMaxExpenses = {
  ...baseBuyHoldProperty,

  // High monthly expenses
  monthlyHOA: 500,
  monthlyUtilities: 300,
  propertyManagementFee: 12, // 12% (luxury property)
  maintenanceCostPerMonth: 400,
  tenantTurnoverFees: 2500,
  otherMonthlyExpenses: 500,

  longTermAssumptions: {
    ...baseBuyHoldProperty.longTermAssumptions,

    // High vacancy rate (challenging market)
    vacancyRate: 10,

    // High CapEx reserve (older property)
    capExReserve: 10,

    // Frequent turnover (1 year)
    turnoverFrequency: 1
  }
};
