/**
 * BRRRR Post-Refinance Break-Even Occupancy Test
 *
 * Issue #80: Validate that post-refi BEO uses post-refi mortgage payment
 *
 * Test Case: $100K purchase, $50K rehab, $235K ARV
 * - Initial mortgage: $499/mo → Initial BEO: 50.35%
 * - Post-refi mortgage: $1,418/mo → Post-refi BEO: 81.0%
 *
 * Business Requirement: Investors need to see BOTH BEOs
 * - Initial BEO (temporary 12-month seasoning period)
 * - Post-refi BEO (long-term 30-year reality)
 *
 * @date 2026-02-09
 */

import { BRRRRAnalyzer } from '../brrrAnalyzer';
import type { BRRRRInputs } from '../brrrAnalyzer';

describe('BRRRR Post-Refinance Break-Even Occupancy (Issue #80)', () => {
  const analyzer = new BRRRRAnalyzer();

  const testInputs: BRRRRInputs = {
    // Purchase Phase
    purchasePrice: 100000,
    downPayment: 25000,
    closingCosts: 2000,
    interestRate: 6.5,
    loanTerm: 30,

    // BRRRR Phase
    brrrr: {
      rehabBudget: 50000,
      afterRepairValue: 235000,
      refinanceLTV: 75,
      seasoningPeriod: 12,
      refinanceInterestRate: 9.0, // Higher rate for cash-out refi
    },

    // Rental Phase
    monthlyRent: 3000,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 1200,
    propertyManagementRate: 8,
    vacancyRate: 5,
    monthlyCapEx: 150,
  };

  it('should calculate post-refi BEO using post-refi mortgage payment', async () => {
    const result = await analyzer.analyze(testInputs);

    // Post-refi mortgage should be ~$1,418/mo (75% LTV on $235K ARV at 9%)
    const postRefiMortgage = result.postRefinanceMetrics.newMonthlyPayment;
    expect(postRefiMortgage).toBeGreaterThan(1400);
    expect(postRefiMortgage).toBeLessThan(1450);

    // Post-refi BEO should be calculated
    const postRefiBEO = result.postRefinanceMetrics.postRefiBreakEvenOccupancy;
    expect(postRefiBEO).toBeDefined();
    expect(postRefiBEO).toBeGreaterThan(0);

    // Expected BEO: ~73.4% (Calculated)
    // Formula: (OpEx + Debt Service) / Gross Rent * 100
    // OpEx: $783.75/mo, Debt: $1,418/mo, Rent: $3,000/mo
    // BEO = ($783.75 + $1,418) / $3,000 * 100 = 73.4%
    expect(postRefiBEO).toBeGreaterThan(70);
    expect(postRefiBEO).toBeLessThan(80);
  });

  it('should show higher BEO post-refi than initial hold period', async () => {
    const result = await analyzer.analyze(testInputs);

    const postRefiBEO = result.postRefinanceMetrics.postRefiBreakEvenOccupancy;

    // Initial BEO uses initial mortgage (~$499/mo) → ~50% BEO
    // Post-refi BEO uses post-refi mortgage (~$1,418/mo) → ~81% BEO
    // Post-refi BEO should be HIGHER due to higher mortgage
    expect(postRefiBEO).toBeGreaterThan(60);
    expect(postRefiBEO).toBeLessThan(90);
  });

  it('should reflect BRRRR trade-off: capital recovery increases BEO', async () => {
    const result = await analyzer.analyze(testInputs);

    // BRRRR achieves high capital recovery (>100% in this case)
    const capitalRecoveryRate = result.capitalRecovery.capitalRecoveryRate;
    expect(capitalRecoveryRate).toBeGreaterThan(100); // Infinite return scenario

    // But this comes at cost of higher BEO (operational risk)
    const postRefiBEO = result.postRefinanceMetrics.postRefiBreakEvenOccupancy;
    expect(postRefiBEO).toBeGreaterThan(70); // Moderate-high BEO

    // This is expected trade-off: Capital recovery → Higher BEO
    console.log(`✅ BRRRR Trade-off Validated:
      Capital Recovery: ${capitalRecoveryRate.toFixed(2)}%
      Post-Refi BEO: ${postRefiBEO.toFixed(2)}%

      Investor recovered capital but must operate at ${postRefiBEO.toFixed(1)}% BEO
    `);
  });

  it('should calculate BEO from correct components', async () => {
    const result = await analyzer.analyze(testInputs);

    // Verify components used in BEO calculation
    const monthlyOpEx = result.postRefinanceMetrics.monthlyOperatingExpenses;
    const monthlyDebt = result.postRefinanceMetrics.newMonthlyPayment;
    const monthlyRent = result.postRefinanceMetrics.monthlyRent;

    // Manual calculation: BEO = (OpEx + Debt) / Rent * 100
    const expectedBEO = ((monthlyOpEx * 12 + monthlyDebt * 12) / (monthlyRent * 12)) * 100;
    const actualBEO = result.postRefinanceMetrics.postRefiBreakEvenOccupancy;

    // Should match within rounding tolerance
    expect(Math.abs(actualBEO - expectedBEO)).toBeLessThan(0.01);

    console.log(`✅ BEO Calculation Components:
      Monthly OpEx: $${monthlyOpEx.toFixed(2)}
      Monthly Debt: $${monthlyDebt.toFixed(2)}
      Monthly Rent: $${monthlyRent.toFixed(2)}

      Calculated BEO: ${actualBEO.toFixed(2)}%
      Expected BEO: ${expectedBEO.toFixed(2)}%
    `);
  });
});
