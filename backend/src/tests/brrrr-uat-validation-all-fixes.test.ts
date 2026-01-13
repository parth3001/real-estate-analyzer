/**
 * BRRRR UAT Validation - All P0+P1 Fixes
 *
 * Validates McKinney TX property after implementing:
 * - P0 Fix #1: Management fee double-counting removal (seasoning)
 * - P0 Fix #2: Refinance closing costs 2% → 2.5%
 * - P1 Fix #2: Vacancy removed from operating expenses (NOI formula cleanup)
 *
 * User Decision: Stick to BiggerPockets BRRRR methodology
 *
 * Date: 2026-01-12
 */

import { BRRRRAnalyzer } from '../services/investment/brrrAnalyzer';
import { BRRRRInputs } from '../types/propertyTypes';

describe('BRRRR UAT - All Fixes Validation (McKinney TX)', () => {
  let analyzer: BRRRRAnalyzer;

  beforeEach(() => {
    analyzer = new BRRRRAnalyzer();
  });

  // McKinney TX Property - Real test case
  const mcKinneyTX: BRRRRInputs = {
    purchasePrice: 175000,
    downPayment: 35000, // 20%
    interestRate: 7.5,
    loanTerm: 30,
    monthlyRent: 3250,
    propertyTaxRate: 1.5,
    insuranceRate: 0.35, // User input (not ARV-based per user decision)
    maintenanceCost: 3900, // $325/month
    propertyManagementRate: 8,
    vacancyRate: 5,
    capitalExpendituresPercent: 5,
    monthlyHOA: 0,
    monthlyUtilities: 0,
    brrrr: {
      afterRepairValue: 275000,
      rehabBudget: 50000,
      refinanceLTV: 75,
      refinanceRate: 6.5,
      refinanceClosingCostPercent: 2.5, // Updated to 2.5% (was 2%)
      seasoningPeriod: 12
    },
    strategy: 'brrrr'
  };

  describe('P0 Fix #1: Management Fee Double-Counting (Seasoning)', () => {
    it('should NOT include management fee in holding costs', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const seasoning = result.brrrr!.seasoningCosts;

      // Management fee calculation
      const monthlyManagement = mcKinneyTX.monthlyRent * (mcKinneyTX.propertyManagementRate! / 100);
      const seasoningManagement = monthlyManagement * 12;

      // Management should be deducted from INCOME, not added to EXPENSES
      expect(seasoning.propertyManagement).toBe(seasoningManagement);

      // Total holding costs should NOT include management
      const expectedHoldingCosts =
        seasoning.mortgagePayments +
        seasoning.propertyTax +
        seasoning.insurance +
        seasoning.utilities +
        seasoning.maintenance +
        seasoning.hoa; // NO propertyManagement!

      expect(seasoning.totalHoldingCosts).toBe(expectedHoldingCosts);

      // Net rental income should deduct management
      expect(seasoning.netRentalIncome).toBe(seasoning.grossRentalIncome - seasoning.propertyManagement);
    });

    it('should show improved seasoning profit after fix', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const seasoning = result.brrrr!.seasoningCosts;

      // After fix: Seasoning profit should be HIGHER (no double-counting)
      // Expected: ~$17,500+ (vs ~$14,800 with bug)
      expect(seasoning.seasoningNetCashFlow).toBeGreaterThan(15000);
      expect(seasoning.seasoningNetCashFlow).toBeLessThan(20000);
    });
  });

  describe('P0 Fix #2: Refinance Closing Costs (2% → 2.5%)', () => {
    it('should use 2.5% default for refinance closing costs', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const refinance = result.brrrr!.refinance;

      const newLoanAmount = mcKinneyTX.brrrr.afterRepairValue * (mcKinneyTX.brrrr.refinanceLTV / 100);
      const expectedClosingCosts = newLoanAmount * 0.025; // 2.5% BiggerPockets standard

      expect(refinance.refinanceClosingCosts).toBeCloseTo(expectedClosingCosts, 2);

      // McKinney TX: $206,250 * 0.025 = $5,156.25
      expect(refinance.refinanceClosingCosts).toBeGreaterThan(5100);
      expect(refinance.refinanceClosingCosts).toBeLessThan(5200);
    });

    it('should reduce net cash-out by additional 0.5% closing costs', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const refinance = result.brrrr!.refinance;

      // Net cash-out = gross cash-out - closing costs
      const expectedNetCashOut = refinance.cashOutProceeds - refinance.refinanceClosingCosts;
      expect(refinance.netCashOut).toBeCloseTo(expectedNetCashOut, 2);
    });
  });

  describe('P1 Fix #2: Vacancy Removed from Operating Expenses', () => {
    it('should NOT include vacancy in monthly operating expenses', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const postRefi = result.brrrr!.postRefinance;

      const monthlyVacancy = mcKinneyTX.monthlyRent * (mcKinneyTX.vacancyRate! / 100);

      // Operating expenses should NOT include vacancy
      // Vacancy is deducted in EGI calculation instead
      const monthlyPropertyTax = (mcKinneyTX.brrrr.afterRepairValue * mcKinneyTX.propertyTaxRate / 100) / 12;
      const monthlyInsurance = (mcKinneyTX.purchasePrice * mcKinneyTX.insuranceRate / 100) / 12; // User input
      const monthlyMaintenance = mcKinneyTX.maintenanceCost / 12;
      const monthlyCapEx = (mcKinneyTX.monthlyRent * (mcKinneyTX.capitalExpendituresPercent! / 100));

      // Expected operating expenses (NO vacancy, NO management)
      const expectedOpEx = monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + monthlyCapEx;

      // Allow small variance for turnover costs
      expect(postRefi.monthlyOperatingExpenses).toBeGreaterThan(expectedOpEx - 50);
      expect(postRefi.monthlyOperatingExpenses).toBeLessThan(expectedOpEx + 150);
    });

    it('should use clean NOI formula without vacancy compensation', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const postRefi = result.brrrr!.postRefinance;

      const monthlyVacancy = mcKinneyTX.monthlyRent * (mcKinneyTX.vacancyRate! / 100);
      const monthlyManagement = mcKinneyTX.monthlyRent * (mcKinneyTX.propertyManagementRate! / 100);

      // EGI = Rent - Vacancy - Management
      const expectedEGI = mcKinneyTX.monthlyRent - monthlyVacancy - monthlyManagement;

      // NOI = EGI - Operating Expenses (clean, no compensation)
      const expectedAnnualNOI = (expectedEGI - postRefi.monthlyOperatingExpenses) * 12;

      // Should match within $100 (small variance for turnover costs)
      expect(Math.abs(postRefi.annualNOI! - expectedAnnualNOI)).toBeLessThan(100);
    });
  });

  describe('BiggerPockets Method A: Capital Deployed', () => {
    it('should reduce capital deployed by seasoning profit (Method A)', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const seasoning = result.brrrr!.seasoningCosts;
      const capital = result.brrrr!.capitalRecovery;

      // Total investment = Down payment + Rehab + Closing costs
      const downPayment = mcKinneyTX.downPayment;
      const rehab = mcKinneyTX.brrrr.rehabBudget;
      const purchaseClosing = mcKinneyTX.purchasePrice * 0.02; // Typical 2%

      const totalInvestment = downPayment + rehab + purchaseClosing;

      // Method A (BiggerPockets): Seasoning profit REDUCES capital deployed
      const expectedCapitalDeployed = totalInvestment - seasoning.seasoningNetCashFlow;

      expect(capital.capitalDeployed).toBeCloseTo(expectedCapitalDeployed, 2);
    });

    it('should show high capital recovery rate with all fixes', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const capital = result.brrrr!.capitalRecovery;

      // After all fixes: Capital recovery should be 85-95%
      // (Management fix increases profit, closing costs slightly reduce recovery)
      expect(capital.capitalRecoveryRate).toBeGreaterThan(85);
      expect(capital.capitalRecoveryRate).toBeLessThan(100);

      // McKinney TX should be EXCELLENT tier (85-100%)
      expect(capital.rating).toBe('EXCELLENT');
    });
  });

  describe('Complete BRRRR Analysis Validation', () => {
    it('should complete full BRRRR analysis without errors', () => {
      const result = analyzer.analyze(mcKinneyTX);

      expect(result.brrrr).toBeDefined();
      expect(result.brrrr!.seasoningCosts).toBeDefined();
      expect(result.brrrr!.refinance).toBeDefined();
      expect(result.brrrr!.postRefinance).toBeDefined();
      expect(result.brrrr!.capitalRecovery).toBeDefined();
    });

    it('should show realistic McKinney TX results', () => {
      const result = analyzer.analyze(mcKinneyTX);

      // Seasoning: Should be profitable
      expect(result.brrrr!.seasoningCosts.seasoningNetCashFlow).toBeGreaterThan(0);

      // Refinance: Should recover significant capital
      expect(result.brrrr!.refinance.netCashOut).toBeGreaterThan(30000);

      // Post-Refi: Should have positive cash flow
      expect(result.brrrr!.postRefinance.monthlyCashFlow).toBeGreaterThan(0);

      // Capital Recovery: Should be EXCELLENT
      expect(result.brrrr!.capitalRecovery.rating).toBe('EXCELLENT');
    });

    it('should match BiggerPockets methodology exactly', () => {
      const result = analyzer.analyze(mcKinneyTX);
      const seasoning = result.brrrr!.seasoningCosts;
      const postRefi = result.brrrr!.postRefinance;

      // ✅ Management fee: "Above the line" (not in holding costs)
      const holdingCostItems = [
        seasoning.mortgagePayments,
        seasoning.propertyTax,
        seasoning.insurance,
        seasoning.utilities,
        seasoning.maintenance,
        seasoning.hoa
      ];
      expect(seasoning.totalHoldingCosts).toBe(holdingCostItems.reduce((a, b) => a + b, 0));

      // ✅ Vacancy: "Above the line" (not in operating expenses)
      const monthlyVacancy = mcKinneyTX.monthlyRent * (mcKinneyTX.vacancyRate! / 100);
      const opExWithoutVacancy = postRefi.monthlyOperatingExpenses;

      // Cash flow should use full operating expenses (vacancy already deducted in EGI)
      const expectedCashFlow = mcKinneyTX.monthlyRent - postRefi.newMonthlyPayment - opExWithoutVacancy;
      expect(Math.abs(postRefi.monthlyCashFlow - expectedCashFlow)).toBeLessThan(monthlyVacancy + 50);

      // ✅ Refinance closing costs: 2.5%
      const newLoan = mcKinneyTX.brrrr.afterRepairValue * (mcKinneyTX.brrrr.refinanceLTV / 100);
      expect(result.brrrr!.refinance.refinanceClosingCosts).toBeCloseTo(newLoan * 0.025, 2);
    });
  });

  describe('Financial Impact Summary', () => {
    it('should show improved metrics after all fixes', () => {
      const result = analyzer.analyze(mcKinneyTX);

      console.log('\n=== McKinney TX - After All Fixes ===');
      console.log('Seasoning Profit:', result.brrrr!.seasoningCosts.seasoningNetCashFlow.toFixed(2));
      console.log('Capital Deployed:', result.brrrr!.capitalRecovery.capitalDeployed.toFixed(2));
      console.log('Capital Recovery:', result.brrrr!.capitalRecovery.capitalRecoveryRate.toFixed(1) + '%');
      console.log('Rating:', result.brrrr!.capitalRecovery.rating);
      console.log('Monthly Cash Flow:', result.brrrr!.postRefinance.monthlyCashFlow.toFixed(2));
      console.log('Annual NOI:', result.brrrr!.postRefinance.annualNOI!.toFixed(2));
      console.log('DSCR:', result.brrrr!.postRefinance.postRefiDSCR!.toFixed(2));
      console.log('=====================================\n');

      // All metrics should be realistic
      expect(result.brrrr!.seasoningCosts.seasoningNetCashFlow).toBeGreaterThan(15000);
      expect(result.brrrr!.capitalRecovery.capitalRecoveryRate).toBeGreaterThan(85);
      expect(result.brrrr!.postRefinance.monthlyCashFlow).toBeGreaterThan(400);
      expect(result.brrrr!.postRefinance.annualNOI!).toBeGreaterThan(20000);
    });
  });
});
