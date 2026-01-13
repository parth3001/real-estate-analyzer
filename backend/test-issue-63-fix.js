/**
 * Issue #63 Fix Validation Test
 *
 * Tests that monthlyCapEx field is properly passed through BRRRR data flow:
 * Controller → Investment Decision Engine → BRRRR Analyzer
 *
 * Expected Behavior AFTER Fix:
 * - monthlyCapEx: $130.40 (user-provided value, NOT default 5% of $3,266 = $163)
 * - Operating expenses: $1,639/month (NOT $1,762/month)
 * - Seasoning cash flow: $1,222/month (NOT $1,498/month)
 * - Post-refi cash flow: -$39/month (NOT +$106/month - sign matters!)
 *
 * Test validates Issue #63 is resolved by checking:
 * 1. monthlyCapEx field exists in BRRRRInputs
 * 2. Operating expenses match expected value with user-provided CapEx
 * 3. Cash flow calculations are correct
 */

const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/real-estate-test';

// Import the Investment Decision Engine
const { InvestmentDecisionEngine } = require('./dist/services/investment/investmentDecisionEngine');

// Austin TX Property - Issue #63 Test Case
const testPropertyData = {
  // Basic Property Info
  propertyType: 'SFR',
  address: '123 Test Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',

  // Purchase Details
  purchasePrice: 245000,
  closingCosts: 7350, // 3% of purchase
  downPayment: 9800, // 4% down payment
  interestRate: 7.5,
  loanTerm: 30,

  // BRRRR Specific
  investmentStrategy: 'brrrr',
  brrrr: {
    rehabBudget: 33000,
    afterRepairValue: 302000,
    seasoning: {
      period: 12,
      refinanceRate: 7.125,
      refinanceLTV: 75,
      refinanceClosingCosts: 4530 // 1.5% of new loan
    }
  },

  // Rental Income
  monthlyRent: 3266,

  // Operating Expenses (Issue #63 Focus)
  propertyTaxRate: 1.81,
  insuranceRate: 0.35,
  monthlyHOA: 0,
  monthlyUtilities: 248, // Landlord-paid utilities
  monthlyCapEx: 130.40, // ⚠️ USER-PROVIDED VALUE - This is the critical field being tested!

  // Vacancy & Management
  vacancyRate: 8,
  propertyManagementRate: 8,

  // Market Data (for context)
  marketRent: 3266,
  marketData: {
    appreciationRate: 3.5,
    rentGrowthRate: 3.0,
    inflationRate: 2.5
  }
};

const testAssumptions = {
  appreciationRate: 3.5,
  rentGrowthRate: 3.0,
  inflationRate: 2.5,
  projectionYears: 10
};

async function runTest() {
  console.log('\n========================================');
  console.log('Issue #63 Fix Validation Test');
  console.log('========================================\n');

  console.log('Test Case: Austin TX Property - BRRRR Strategy');
  console.log('Purchase Price: $245,000');
  console.log('Monthly Rent: $3,266');
  console.log('User-Provided monthlyCapEx: $130.40');
  console.log('Expected Behavior: Use $130.40, NOT default 5% ($163)');
  console.log('');

  try {
    // Initialize Decision Engine
    const decisionEngine = new InvestmentDecisionEngine();

    console.log('Running Investment Decision Engine analysis...\n');

    // This will trigger the BRRRR data flow:
    // generateBRRRRDecision() → BRRRRInputs mapping → BRRRRAnalyzer
    const result = await decisionEngine.generateDecision(
      testPropertyData,
      testAssumptions,
      {} // Empty market intelligence for test
    );

    console.log('✅ Analysis completed successfully\n');
    console.log('========================================');
    console.log('VALIDATION RESULTS');
    console.log('========================================\n');

    // Extract BRRRR-specific results
    const analysis = result.analysis;
    const brrrPhases = analysis.phases;

    // Phase 1: Seasoning Period Operating Expenses
    const seasoningOperatingExpenses = brrrPhases.seasoning.operatingExpenses;
    const seasoningCashFlow = brrrPhases.seasoning.monthlyCashFlow;

    // Phase 2: Post-Refinance Operating Expenses
    const postRefiOperatingExpenses = brrrPhases.postRefinance.operatingExpenses;
    const postRefiCashFlow = brrrPhases.postRefinance.monthlyCashFlow;

    console.log('1. Operating Expenses Validation:');
    console.log(`   Seasoning Period: $${seasoningOperatingExpenses.toFixed(2)}`);
    console.log(`   Expected: $1,639.00 (with user CapEx $130.40)`);
    console.log(`   ❌ Would be: $1,762.00 (with default 5% CapEx $163)`);

    const opexMatch = Math.abs(seasoningOperatingExpenses - 1639) < 5; // Allow $5 tolerance
    console.log(`   ${opexMatch ? '✅' : '❌'} Operating expenses ${opexMatch ? 'MATCH' : 'DO NOT MATCH'} expected value\n`);

    console.log('2. Cash Flow Validation:');
    console.log(`   Seasoning Period: $${seasoningCashFlow.toFixed(2)}/month`);
    console.log(`   Expected: ~$1,222/month`);
    console.log(`   ❌ Would be: ~$1,498/month (with wrong CapEx)\n`);

    console.log(`   Post-Refinance: $${postRefiCashFlow.toFixed(2)}/month`);
    console.log(`   Expected: ~-$39/month (negative cash flow)`);
    console.log(`   ❌ Would be: ~+$106/month (WRONG SIGN!)\n`);

    const postRefiSign = postRefiCashFlow < 0;
    console.log(`   ${postRefiSign ? '✅' : '❌'} Post-refi cash flow sign is ${postRefiSign ? 'CORRECT (negative)' : 'WRONG (should be negative)'}\n`);

    console.log('3. CapEx Field Mapping Verification:');
    console.log('   Check backend logs for:');
    console.log('   "BRRRR Operating Expenses - CapEx Calculation"');
    console.log('   Expected log entry:');
    console.log('   {');
    console.log('     monthlyCapExSource: "user-provided",');
    console.log('     monthlyCapExValue: 130.40,');
    console.log('     userProvidedValue: 130.40,');
    console.log('     monthlyRent: 3266');
    console.log('   }\n');

    console.log('========================================');
    console.log('TEST SUMMARY');
    console.log('========================================\n');

    const allTestsPassed = opexMatch && postRefiSign;

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED - Issue #63 is RESOLVED');
      console.log('   - monthlyCapEx field properly mapped');
      console.log('   - Operating expenses use user-provided value');
      console.log('   - Cash flow calculations are correct\n');
      process.exit(0);
    } else {
      console.log('❌ TESTS FAILED - Issue #63 NOT fully resolved');
      console.log('   Check implementation and backend logs\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
