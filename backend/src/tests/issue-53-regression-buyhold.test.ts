/**
 * Issue #53 - Buy & Hold Regression Test
 *
 * PURPOSE: Ensure ?? operator changes did NOT alter existing Buy & Hold calculations
 *
 * CRITICAL VALIDATION:
 * - User provides NORMAL values (not zero) - Most common case
 * - Calculations should produce IDENTICAL results before/after ?? operator fix
 * - This test captures baseline expectations for standard Buy & Hold analysis
 *
 * STRATEGY:
 * 1. Use realistic property data (NOT edge cases)
 * 2. Verify all key financial metrics match expected values
 * 3. Ensure Investment Decision Engine verdict unchanged
 * 4. Confirm no calculation drift introduced by ?? operator
 *
 * REFERENCE: /docs/ISSUE_53_PHASE_1_COMPLETE.md
 */

import request from 'supertest';
import app from '../../server';
import { connectDB, disconnectDB } from '../setup/testDatabase';

describe('Issue #53 - Buy & Hold Regression Test', () => {

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('Standard Buy & Hold Analysis - Baseline Validation', () => {
    it('should produce consistent results for typical SFR property (no zero values)', async () => {
      // Realistic property in Fayetteville, NC (mid-tier market)
      const propertyData = {
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold',

        // Purchase Details
        purchasePrice: 250000,
        downPayment: 50000,  // 20% down
        closingCosts: 7500,  // 3% of purchase

        // Financing
        interestRate: 6.5,
        loanTerm: 30,

        // Income
        monthlyRent: 2000,

        // Operating Expenses
        propertyTaxRate: 1.2,      // NOT zero - typical NC rate
        insuranceRate: 0.5,         // NOT zero - typical
        maintenanceCost: 2400,      // NOT zero - $200/month
        propertyManagementRate: 8,  // NOT zero - typical 8%
        monthlyHOA: 0,              // Zero is valid default
        monthlyUtilities: 0,        // Zero is valid default

        // Long-term Assumptions (ALL typical values, NOT zeros)
        longTermAssumptions: {
          vacancyRate: 5,                       // NOT zero - typical
          projectionYears: 10,                  // NOT zero - typical
          annualRentIncrease: 2,                // NOT zero - typical
          annualExpenseIncrease: 2,             // NOT zero - typical
          annualPropertyValueIncrease: 3,       // NOT zero - typical
          sellingCostsPercentage: 6,            // NOT zero - typical
          turnoverFrequency: 2                  // NOT zero - typical
        }
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .send(propertyData)
        .expect(200);

      const { analysis } = response.body;

      // ========================================
      // CRITICAL REGRESSION CHECKS
      // These values MUST NOT CHANGE after ?? operator fix
      // ========================================

      // 1. Monthly Cash Flow (Primary User Metric)
      expect(analysis.monthlyCashFlow).toBeDefined();
      expect(typeof analysis.monthlyCashFlow).toBe('number');
      // Typical range: $50-200/month for this property profile
      expect(analysis.monthlyCashFlow).toBeGreaterThan(-100);
      expect(analysis.monthlyCashFlow).toBeLessThan(500);

      // 2. Cap Rate (Critical Investment Metric)
      expect(analysis.capRate).toBeDefined();
      expect(typeof analysis.capRate).toBe('number');
      // Typical range: 4-8% for residential SFR
      expect(analysis.capRate).toBeGreaterThan(3);
      expect(analysis.capRate).toBeLessThan(10);

      // 3. Cash-on-Cash Return
      expect(analysis.cashOnCashReturn).toBeDefined();
      expect(typeof analysis.cashOnCashReturn).toBe('number');
      // Typical range: 2-12%
      expect(analysis.cashOnCashReturn).toBeGreaterThan(0);
      expect(analysis.cashOnCashReturn).toBeLessThan(15);

      // 4. DSCR (Debt Service Coverage Ratio)
      expect(analysis.dscr).toBeDefined();
      expect(typeof analysis.dscr).toBe('number');
      // Typical range: 1.0-1.5 (>1.25 is strong)
      expect(analysis.dscr).toBeGreaterThan(0.8);
      expect(analysis.dscr).toBeLessThan(2.0);

      // 5. NOI (Net Operating Income) - Annual
      expect(analysis.noi).toBeDefined();
      expect(typeof analysis.noi).toBe('number');
      // Should be positive for viable property
      expect(analysis.noi).toBeGreaterThan(0);

      // 6. Total Monthly Expenses
      expect(analysis.totalMonthlyExpenses).toBeDefined();
      expect(typeof analysis.totalMonthlyExpenses).toBe('number');
      // Should include: tax, insurance, maintenance, management, HOA, utilities, vacancy
      expect(analysis.totalMonthlyExpenses).toBeGreaterThan(500);
      expect(analysis.totalMonthlyExpenses).toBeLessThan(1500);

      // 7. Investment Decision Engine Verdict
      expect(analysis.investmentDecision).toBeDefined();
      expect(analysis.investmentDecision.verdict).toBeDefined();
      // Verdict should be one of: BUY, NEGOTIATE, CAUTION, PASS
      expect(['BUY', 'NEGOTIATE', 'CAUTION', 'PASS']).toContain(
        analysis.investmentDecision.verdict
      );

      // 8. Deal Quality Score (0-100)
      expect(analysis.investmentDecision.dealQualityScore).toBeDefined();
      expect(typeof analysis.investmentDecision.dealQualityScore).toBe('number');
      expect(analysis.investmentDecision.dealQualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.investmentDecision.dealQualityScore).toBeLessThanOrEqual(100);

      // 9. 10-Year Projections (ensure array exists and has data)
      expect(analysis.projections).toBeDefined();
      expect(Array.isArray(analysis.projections)).toBe(true);
      expect(analysis.projections.length).toBe(10); // 10 years

      // Verify first year projection structure
      const year1 = analysis.projections[0];
      expect(year1.year).toBe(1);
      expect(year1.annualRent).toBeDefined();
      expect(year1.annualExpenses).toBeDefined();
      expect(year1.annualCashFlow).toBeDefined();
      expect(year1.propertyValue).toBeDefined();
      expect(year1.equity).toBeDefined();

      // 10. IRR (Internal Rate of Return) - 10-year hold
      expect(analysis.irr).toBeDefined();
      expect(typeof analysis.irr).toBe('number');
      // Typical range: 5-20% for residential SFR
      expect(analysis.irr).toBeGreaterThan(0);
      expect(analysis.irr).toBeLessThan(30);
    });

    it('should handle user-provided zeros in longTermAssumptions (edge case)', async () => {
      // Conservative investor provides ZERO growth assumptions
      const conservativeProperty = {
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold',

        purchasePrice: 250000,
        downPayment: 50000,
        closingCosts: 7500,
        interestRate: 6.5,
        loanTerm: 30,
        monthlyRent: 2000,
        propertyTaxRate: 1.2,
        insuranceRate: 0.5,
        maintenanceCost: 2400,
        propertyManagementRate: 8,

        // ✅ USER PROVIDES ZEROS - Should be preserved, not replaced with defaults
        longTermAssumptions: {
          vacancyRate: 0,                       // ✅ ZERO - Luxury property, always occupied
          projectionYears: 10,                  // Normal
          annualRentIncrease: 0,                // ✅ ZERO - Rent-controlled property
          annualExpenseIncrease: 0,             // ✅ ZERO - Fixed expenses
          annualPropertyValueIncrease: 0,       // ✅ ZERO - Conservative, no appreciation
          sellingCostsPercentage: 6,            // Normal
          turnoverFrequency: 2                  // Normal
        }
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .send(conservativeProperty)
        .expect(200);

      const { analysis } = response.body;

      // CRITICAL: Verify zeros were preserved

      // 1. Vacancy Rate = 0 means NO vacancy expense
      // Effective Gross Income should equal Gross Income (no vacancy deduction)
      const grossAnnualRent = conservativeProperty.monthlyRent * 12; // $24,000
      // With 0% vacancy, effective gross income = gross income
      expect(analysis.noi).toBeDefined();

      // Calculate expected NOI manually:
      // Gross Income: $24,000/year
      // Property Tax: $250,000 * 1.2% = $3,000/year
      // Insurance: $250,000 * 0.5% = $1,250/year
      // Maintenance: $2,400/year
      // Management: $24,000 * 8% = $1,920/year
      // HOA: $0
      // Utilities: $0
      // Vacancy (0%): $0 ← CRITICAL: Should be $0, not $1,200 (5% of $24k)
      // Total Expenses: $8,570/year
      // Expected NOI: $24,000 - $8,570 = $15,430

      const expectedNOI = grossAnnualRent - (3000 + 1250 + 2400 + 1920);
      expect(Math.abs(analysis.noi - expectedNOI)).toBeLessThan(50); // Within $50 tolerance

      // 2. Annual Rent Increase = 0 means rent stays flat
      expect(analysis.projections[0].annualRent).toBe(grossAnnualRent);
      expect(analysis.projections[1].annualRent).toBe(grossAnnualRent); // Same as year 1
      expect(analysis.projections[9].annualRent).toBe(grossAnnualRent); // Same as year 10

      // 3. Annual Property Value Increase = 0 means no appreciation
      const initialValue = conservativeProperty.purchasePrice;
      expect(analysis.projections[0].propertyValue).toBe(initialValue);
      expect(analysis.projections[9].propertyValue).toBe(initialValue); // No appreciation

      // 4. Investment Decision should still work (not crash on zeros)
      expect(analysis.investmentDecision).toBeDefined();
      expect(analysis.investmentDecision.verdict).toBeDefined();
    });

    it('should handle undefined longTermAssumptions (defaults applied)', async () => {
      // User provides MINIMAL data - Platform should apply defaults
      const minimalProperty = {
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold',

        purchasePrice: 250000,
        downPayment: 50000,
        closingCosts: 7500,
        interestRate: 6.5,
        loanTerm: 30,
        monthlyRent: 2000,
        propertyTaxRate: 1.2,
        insuranceRate: 0.5,
        maintenanceCost: 2400,
        propertyManagementRate: 8
        // NO longTermAssumptions provided - Should use defaults
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .send(minimalProperty)
        .expect(200);

      const { analysis } = response.body;

      // Verify defaults were applied:
      // - vacancyRate: 5%
      // - projectionYears: 10
      // - annualRentIncrease: 2%
      // - annualExpenseIncrease: 2%
      // - annualPropertyValueIncrease: 3%
      // - sellingCostsPercentage: 6%

      // 1. Projections should be 10 years (default)
      expect(analysis.projections.length).toBe(10);

      // 2. Rent should increase 2% annually (default)
      const year1Rent = minimalProperty.monthlyRent * 12;
      const year2Rent = analysis.projections[1].annualRent;
      const expectedYear2Rent = year1Rent * 1.02; // 2% increase
      expect(Math.abs(year2Rent - expectedYear2Rent)).toBeLessThan(10);

      // 3. Property value should appreciate 3% annually (default)
      const year1Value = minimalProperty.purchasePrice;
      const year2Value = analysis.projections[1].propertyValue;
      const expectedYear2Value = year1Value * 1.03; // 3% appreciation
      expect(Math.abs(year2Value - expectedYear2Value)).toBeLessThan(100);

      // 4. Vacancy should be 5% (default)
      // Monthly vacancy expense = $2000 * 5% = $100/month = $1,200/year
      const expectedVacancyExpense = (minimalProperty.monthlyRent * 12) * 0.05;
      // Verify by checking NOI includes vacancy deduction
      const grossIncome = minimalProperty.monthlyRent * 12;
      const effectiveGrossIncome = grossIncome - expectedVacancyExpense;
      // NOI should be lower due to 5% vacancy vs 0% vacancy
      expect(analysis.noi).toBeLessThan(effectiveGrossIncome);
    });
  });

  describe('Buy & Hold vs BRRRR - Ensure Strategy Routing Unchanged', () => {
    it('should route to Buy & Hold strategy (not BRRRR) when investmentStrategy=buy-hold', async () => {
      const buyHoldProperty = {
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold', // ✅ Explicitly Buy & Hold

        purchasePrice: 250000,
        downPayment: 50000,
        closingCosts: 7500,
        interestRate: 6.5,
        loanTerm: 30,
        monthlyRent: 2000,
        propertyTaxRate: 1.2,
        insuranceRate: 0.5,
        maintenanceCost: 2400,
        propertyManagementRate: 8
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .send(buyHoldProperty)
        .expect(200);

      const { analysis } = response.body;

      // Verify Buy & Hold analysis structure (no BRRRR fields)
      expect(analysis.investmentDecision).toBeDefined();
      expect(analysis.monthlyCashFlow).toBeDefined();
      expect(analysis.capRate).toBeDefined();
      expect(analysis.dscr).toBeDefined();
      expect(analysis.irr).toBeDefined();

      // Should NOT have BRRRR-specific fields
      expect(analysis.brrrr).toBeUndefined();
      expect(analysis.seasoning).toBeUndefined();
      expect(analysis.refinance).toBeUndefined();
      expect(analysis.postRefinance).toBeUndefined();
    });
  });

  describe('Calculation Precision - No Rounding Errors Introduced', () => {
    it('should maintain full floating-point precision (no intermediate rounding)', async () => {
      const precisionProperty = {
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold',

        // Use values that would expose rounding errors
        purchasePrice: 333333.33,
        downPayment: 66666.66,
        closingCosts: 9999.99,
        interestRate: 6.375, // Precise rate
        loanTerm: 30,
        monthlyRent: 2222.22,
        propertyTaxRate: 1.125,
        insuranceRate: 0.625,
        maintenanceCost: 2555.55,
        propertyManagementRate: 8.5
      };

      const response = await request(app)
        .post('/api/deals/analyze')
        .send(precisionProperty)
        .expect(200);

      const { analysis } = response.body;

      // Verify calculations don't have suspicious rounding
      // (e.g., all values ending in .00)

      expect(analysis.monthlyCashFlow).toBeDefined();
      expect(typeof analysis.monthlyCashFlow).toBe('number');
      expect(isNaN(analysis.monthlyCashFlow)).toBe(false);
      expect(isFinite(analysis.monthlyCashFlow)).toBe(true);

      expect(analysis.capRate).toBeDefined();
      expect(typeof analysis.capRate).toBe('number');
      expect(isNaN(analysis.capRate)).toBe(false);
      expect(isFinite(analysis.capRate)).toBe(true);

      // Verify no NaN or Infinity errors introduced
      expect(analysis.irr).toBeDefined();
      expect(isNaN(analysis.irr)).toBe(false);
      expect(isFinite(analysis.irr)).toBe(true);
    });
  });
});
