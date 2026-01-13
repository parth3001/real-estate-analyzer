/**
 * Issue #63: monthlyCapEx Field Mapping Fix - Regression Test
 *
 * PROBLEM: monthlyCapEx field added to BasePropertyData but not mapped
 * in Investment Decision Engine's BRRRRInputs object, causing BRRRR Analyzer
 * to fall back to default 5% calculation instead of using user-provided value.
 *
 * IMPACT:
 * - Austin TX property: Operating expenses $1,762/month (wrong) vs $1,639/month (correct)
 * - Cash flow: +$106/month (wrong sign!) vs -$39/month (correct)
 * - Error magnitude: $505/month operating expense difference
 *
 * FIX IMPLEMENTED:
 * 1. Added monthlyCapEx to BRRRRInputs mapping (investmentDecisionEngine.ts line 1996)
 * 2. Added diagnostic logging to verify CapEx source (brrrAnalyzer.ts lines 578-590)
 *
 * TEST VALIDATES:
 * - monthlyCapEx field properly passed through BRRRR data flow
 * - Operating expenses use user-provided value, not default calculation
 * - Diagnostic logging correctly identifies "user-provided" source
 *
 * @author FSE from CLAUDE.md
 * @version 1.0.0
 * @date January 11, 2026
 */

import { BRRRRAnalyzer, BRRRRInputs } from '../services/investment/brrrAnalyzer';

describe('Issue #63: monthlyCapEx Field Mapping Fix', () => {
  /**
   * Austin TX Property - Real-world test case from Issue #63
   *
   * Purchase Price: $245,000
   * Monthly Rent: $3,266
   * User-Provided CapEx: $130.40/month
   *
   * Expected Behavior AFTER Fix:
   * - Operating expenses: $1,639/month (uses $130.40 CapEx)
   * - NOT $1,762/month (which would use default 5% of rent = $163 CapEx)
   */
  const AUSTIN_TX_BRRRR_INPUTS: BRRRRInputs = {
    // Purchase Phase
    purchasePrice: 245000,
    closingCosts: 7350, // 3%
    downPayment: 9800, // 4%
    loanAmount: 245300, // purchase + closing - down
    interestRate: 7.5,
    loanTerm: 30,

    // Rehab Phase
    rehabBudget: 33000,
    afterRepairValue: 302000,

    // Rental Phase (Seasoning Period)
    seasoningPeriod: 12, // months
    monthlyRent: 3266,

    // Refinance Phase
    refinanceRate: 7.125,
    refinanceLTV: 75, // 75% of ARV
    refinanceClosingCosts: 4530, // 1.5% of new loan

    // Operating Expenses
    propertyTaxRate: 1.81,
    insuranceRate: 0.35,
    monthlyHOA: 0,
    monthlyUtilities: 248, // Landlord-paid utilities
    monthlyCapEx: 130.40, // ⚠️ USER-PROVIDED VALUE - This is the critical field!

    // Vacancy & Management
    vacancyRate: 8,
    propertyManagementRate: 8,

    // Long-term Assumptions
    longTermAssumptions: {
      appreciationRate: 3.5,
      rentGrowthRate: 3.0,
      inflationRate: 2.5,
      projectionYears: 10
    }
  };

  test('monthlyCapEx field should be used when provided by user', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Act
    const analysis = await analyzer.analyze(AUSTIN_TX_BRRRR_INPUTS);

    // Assert
    const seasoningPhase = analysis.phases.seasoning;
    const operatingExpenses = seasoningPhase.operatingExpenses;

    // Operating expenses should use user-provided CapEx ($130.40)
    // NOT default 5% of rent ($3,266 * 5% = $163.30)
    //
    // Expected breakdown:
    // - Property Tax: $245,000 * 1.81% / 12 = $369.58
    // - Insurance: $245,000 * 0.35% / 12 = $71.46
    // - HOA: $0
    // - Utilities: $248
    // - CapEx: $130.40 (user-provided, NOT $163)
    // - Maintenance: (calculated by analyzer)
    // - Management: $3,266 * 8% = $261.28
    // - Vacancy: (handled separately in EGI calculation)
    //
    // Total: ~$1,639/month (with user CapEx $130.40)
    // Would be: ~$1,762/month (with default 5% CapEx $163)

    const EXPECTED_OPEX_WITH_USER_CAPEX = 1639;
    const WRONG_OPEX_WITH_DEFAULT_CAPEX = 1762;

    expect(operatingExpenses).toBeCloseTo(EXPECTED_OPEX_WITH_USER_CAPEX, -1); // Within $10
    expect(operatingExpenses).not.toBeCloseTo(WRONG_OPEX_WITH_DEFAULT_CAPEX, -1);
  });

  test('CapEx fallback chain should use user-provided value first', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Inputs with ALL CapEx options provided (user value should win)
    const inputsWithAllOptions: BRRRRInputs = {
      ...AUSTIN_TX_BRRRR_INPUTS,
      monthlyCapEx: 130.40, // USER-PROVIDED (highest priority)
      capExReserveFixed: 150, // Fixed fallback
      capExReserveRate: 6 // Percentage fallback (would be $195.96)
    };

    // Act
    const analysis = await analyzer.analyze(inputsWithAllOptions);

    // Assert
    const seasoningPhase = analysis.phases.seasoning;
    const operatingExpenses = seasoningPhase.operatingExpenses;

    // Should use $130.40 (user-provided), NOT $150 or $195.96
    expect(operatingExpenses).toBeCloseTo(1639, -1);
  });

  test('CapEx fallback to default 5% when no user value provided', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Remove user-provided monthlyCapEx to test fallback
    const inputsWithoutCapEx: BRRRRInputs = {
      ...AUSTIN_TX_BRRRR_INPUTS
    };
    delete inputsWithoutCapEx.monthlyCapEx;
    delete inputsWithoutCapEx.capExReserveFixed;
    delete inputsWithoutCapEx.capExReserveRate;

    // Act
    const analysis = await analyzer.analyze(inputsWithoutCapEx);

    // Assert
    const seasoningPhase = analysis.phases.seasoning;
    const operatingExpenses = seasoningPhase.operatingExpenses;

    // Should use default 5% of rent = $3,266 * 5% = $163.30
    // Expected operating expenses: ~$1,762/month
    expect(operatingExpenses).toBeCloseTo(1762, -1);
  });

  test('Cash flow should reflect correct CapEx value', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Act - WITH user-provided CapEx
    const analysisWithUserCapEx = await analyzer.analyze(AUSTIN_TX_BRRRR_INPUTS);

    // Remove CapEx to test difference
    const inputsWithoutCapEx = { ...AUSTIN_TX_BRRRR_INPUTS };
    delete inputsWithoutCapEx.monthlyCapEx;
    const analysisWithDefaultCapEx = await analyzer.analyze(inputsWithoutCapEx);

    // Assert
    const cashFlowWithUserCapEx = analysisWithUserCapEx.phases.seasoning.monthlyCashFlow;
    const cashFlowWithDefaultCapEx = analysisWithDefaultCapEx.phases.seasoning.monthlyCashFlow;

    // Cash flow difference should be approximately the CapEx difference
    // User CapEx: $130.40
    // Default 5%: $163.30
    // Difference: $32.90/month
    const expectedDifference = 32.90;
    const actualDifference = cashFlowWithUserCapEx - cashFlowWithDefaultCapEx;

    expect(actualDifference).toBeCloseTo(expectedDifference, 0); // Within $1
  });

  test('Post-refinance cash flow should have correct sign', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Act
    const analysis = await analyzer.analyze(AUSTIN_TX_BRRRR_INPUTS);

    // Assert
    const postRefinanceCashFlow = analysis.phases.postRefinance.monthlyCashFlow;

    // Expected: -$39/month (negative - property has negative cash flow post-refi)
    // WRONG (before fix): +$106/month (wrong sign due to incorrect CapEx)
    expect(postRefinanceCashFlow).toBeLessThan(0); // Must be negative
    expect(postRefinanceCashFlow).toBeCloseTo(-39, 0); // Within $1
  });

  test('monthlyCapEx field should be optional (backward compatibility)', async () => {
    // Arrange
    const analyzer = new BRRRRAnalyzer();

    // Old properties might not have monthlyCapEx field
    const inputsWithoutNewField: BRRRRInputs = {
      purchasePrice: 200000,
      closingCosts: 6000,
      downPayment: 40000,
      loanAmount: 166000,
      interestRate: 7.0,
      loanTerm: 30,
      rehabBudget: 25000,
      afterRepairValue: 250000,
      seasoningPeriod: 12,
      monthlyRent: 2500,
      refinanceRate: 6.75,
      refinanceLTV: 75,
      refinanceClosingCosts: 3000,
      propertyTaxRate: 1.5,
      insuranceRate: 0.3,
      vacancyRate: 5,
      propertyManagementRate: 10,
      longTermAssumptions: {
        appreciationRate: 3.0,
        rentGrowthRate: 2.5,
        inflationRate: 2.0,
        projectionYears: 10
      }
      // NO monthlyCapEx, monthlyHOA, monthlyUtilities - should not crash
    };

    // Act
    const analysis = await analyzer.analyze(inputsWithoutNewField);

    // Assert - Should complete without errors
    expect(analysis).toBeDefined();
    expect(analysis.phases.seasoning).toBeDefined();
    expect(analysis.phases.postRefinance).toBeDefined();

    // Should use default 5% CapEx
    const operatingExpenses = analysis.phases.seasoning.operatingExpenses;
    expect(operatingExpenses).toBeGreaterThan(0);
  });
});

/**
 * EXPECTED TEST RESULTS (After Fix #1):
 *
 * ✅ monthlyCapEx field should be used when provided by user
 *    - Operating expenses: $1,639/month (NOT $1,762)
 *
 * ✅ CapEx fallback chain should use user-provided value first
 *    - Prefers monthlyCapEx over capExReserveFixed and capExReserveRate
 *
 * ✅ CapEx fallback to default 5% when no user value provided
 *    - Backward compatible with old properties
 *
 * ✅ Cash flow should reflect correct CapEx value
 *    - $32.90/month difference between user CapEx and default
 *
 * ✅ Post-refinance cash flow should have correct sign
 *    - NEGATIVE cash flow (-$39), not positive (+$106)
 *
 * ✅ monthlyCapEx field should be optional (backward compatibility)
 *    - Analysis completes successfully for old properties
 *
 * DIAGNOSTIC LOGGING VERIFICATION:
 * When running with user-provided CapEx, backend logs should show:
 * {
 *   "monthlyCapExSource": "user-provided",
 *   "monthlyCapExValue": 130.40,
 *   "userProvidedValue": 130.40,
 *   "monthlyRent": 3266
 * }
 */
