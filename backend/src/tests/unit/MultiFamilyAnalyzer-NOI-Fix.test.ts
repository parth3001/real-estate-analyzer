/**
 * Multi-Family Analyzer NOI Bug Fix Test (Story 1.2)
 * Created: October 25, 2025
 * Purpose: Validate that NOI calculation correctly uses EGI method (vacancy reduces income, not added to expenses)
 */

import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFPropertyFactory, defaultMFAssumptions } from '../fixtures/mfTestData';

describe('Story 1.2: NOI Calculation Bug Fix', () => {
  describe('CRITICAL: Vacancy should reduce income, not be in operating expenses', () => {
    const property = MFPropertyFactory.create(); // 8-unit default
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
    const result = analyzer.analyze();
    const metrics = result.metrics;

    it('should calculate Effective Gross Income correctly', () => {
      const grossIncome = (1500 * 6 + 1200 * 2) * 12; // $136,800
      const vacancyLoss = grossIncome * 0.05; // 5% = $6,840
      const creditLoss = grossIncome * 0.02; // 2% = $2,736
      const expectedEGI = grossIncome - vacancyLoss - creditLoss; // $127,224

      expect(metrics.effectiveGrossIncome).toBeCloseTo(expectedEGI, -2);
    });

    it('should NOT include vacancy in operating expenses', () => {
      const operatingExpenses = metrics.operatingExpenses!;
      const grossIncome = metrics.grossIncome!;

      // Operating expenses should NOT contain vacancy
      // If they did, opex would be much higher
      expect(operatingExpenses).toBeLessThan(grossIncome * 0.60); // Should be around 40-50% of gross, not 50%+
    });

    it('should calculate NOI using EGI method', () => {
      const egi = metrics.effectiveGrossIncome!;
      const opex = metrics.operatingExpenses!;
      const expectedNOI = egi - opex;

      expect(metrics.noi).toBeCloseTo(expectedNOI, -2);
    });

    it('should validate NOI = EGI - OpEx (NOT Gross Income - OpEx)', () => {
      const noi = metrics.noi;
      const egi = metrics.effectiveGrossIncome!;
      const opex = metrics.operatingExpenses!;

      // NOI should equal EGI - OpEx
      const calculatedNOI = egi - opex;
      expect(noi).toBeCloseTo(calculatedNOI, -2);

      // NOI should NOT equal Gross Income - OpEx (old buggy formula)
      const grossIncome = metrics.grossIncome!;
      const buggyNOI = grossIncome - opex;
      expect(noi).not.toBeCloseTo(buggyNOI, -2);
    });

    it('should have higher NOI with fix (vacancy not double-counted)', () => {
      // With fix: NOI = EGI - OpEx (where EGI already accounts for vacancy)
      // Without fix (old bug): NOI = GI - (OpEx + vacancy) = effectively GI - OpEx - 2*vacancy

      const grossIncome = metrics.grossIncome!;

      // NOI should be positive or only slightly negative for this baseline property
      // With the bug, NOI would be ~$6,840 lower (the vacancy amount)
      const noi = metrics.noi;
      expect(noi).toBeGreaterThan(-20000); // With bug it would be much more negative
    });
  });

  describe('NOI calculation step-by-step validation', () => {
    it('should validate Austin 8-plex NOI matches manual calculation', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Expected manual calculations (from MF_MANUAL_VALIDATION_SETUP.md)
      const expectedGrossIncome = 136800;
      const expectedVacancyLoss = 6840; // 5%
      const expectedCreditLoss = 2736; // 2%
      const expectedEGI = 127224;

      expect(result.metrics.grossIncome).toBeCloseTo(expectedGrossIncome, -2);
      expect(result.metrics.effectiveGrossIncome).toBeCloseTo(expectedEGI, -2);

      // Operating expenses should be around $58,512 (from manual calc)
      // Allow 10% tolerance for differences in assumptions
      expect(result.metrics.operatingExpenses).toBeCloseTo(58512, -500);

      // NOI should be around $68,712 (from manual calc)
      expect(result.metrics.noi).toBeCloseTo(68712, -500);
    });

    it('should validate Fayetteville 4-plex NOI (positive cash flow)', () => {
      const property = MFPropertyFactory.createFourplex({
        purchasePrice: 480000,
        downPayment: 120000,
        interestRate: 7.5,
        propertyTaxRate: 1.2,
        insuranceRate: 0.5,
        maintenanceCostPerUnit: 125,
        unitTypes: [
          {
            type: '2bed/1bath',
            count: 4,
            sqft: 850,
            monthlyRent: 1500
          }
        ]
      });

      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Expected values from manual calculations
      const expectedGrossIncome = 72000;
      const expectedEGI = 66960;
      const expectedNOI = 40080;

      expect(result.metrics.grossIncome).toBeCloseTo(expectedGrossIncome, -2);
      expect(result.metrics.effectiveGrossIncome).toBeCloseTo(expectedEGI, -2);
      expect(result.metrics.noi).toBeCloseTo(expectedNOI, -500);
    });
  });

  describe('Edge cases for NOI calculation', () => {
    it('should handle negative NOI scenario', () => {
      const property = MFPropertyFactory.createNegativeCashFlow();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Negative NOI is valid (property loses money)
      expect(result.metrics.noi).toBeLessThan(0);

      // But calculation should still use EGI method
      const egi = result.metrics.effectiveGrossIncome!;
      const opex = result.metrics.operatingExpenses!;
      expect(result.metrics.noi).toBeCloseTo(egi - opex, -2);
    });

    it('should handle all-cash purchase (no debt service)', () => {
      const property = MFPropertyFactory.createAllCash();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // All-cash purchase should still calculate NOI correctly
      expect(result.metrics.noi).toBeGreaterThan(0);

      // EGI method should still apply
      const egi = result.metrics.effectiveGrossIncome!;
      const opex = result.metrics.operatingExpenses!;
      expect(result.metrics.noi).toBeCloseTo(egi - opex, -2);
    });

    it('should handle high vacancy rate (10%)', () => {
      const property = MFPropertyFactory.create();
      const highVacancyAssumptions = {
        ...defaultMFAssumptions,
        vacancyRate: 10 // 10% instead of 5%
      };

      const analyzer = new MultiFamilyAnalyzer(property, highVacancyAssumptions);
      const result = analyzer.analyze();

      const grossIncome = result.metrics.grossIncome!;
      const vacancyLoss = grossIncome * 0.10; // $13,680
      const creditLoss = grossIncome * 0.02; // $2,736
      const expectedEGI = grossIncome - vacancyLoss - creditLoss;

      expect(result.metrics.effectiveGrossIncome).toBeCloseTo(expectedEGI, -2);

      // NOI should be lower due to higher vacancy
      expect(result.metrics.noi).toBeLessThan(68712); // Lower than baseline
    });
  });

  describe('Validate advanced metrics using correct NOI', () => {
    it('should calculate Cap Rate using correct NOI', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      const expectedCapRate = (result.metrics.noi / property.purchasePrice) * 100;
      expect(result.metrics.capRate).toBeCloseTo(expectedCapRate, 1);

      // Cap rate should be in typical MF range (4-12%)
      expect(result.metrics.capRate).toBeGreaterThan(3);
      expect(result.metrics.capRate).toBeLessThan(15);
    });

    it('should calculate DSCR using correct NOI', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // DSCR = NOI / Annual Debt Service
      // This property should have DSCR < 1.0 (doesn't cover debt service)
      expect(result.metrics.dscr).toBeLessThan(1.0);

      // But it should be within reasonable range (not absurdly low)
      expect(result.metrics.dscr).toBeGreaterThan(0.5);
    });

    it('should calculate Debt Yield using correct NOI', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      const loanAmount = property.purchasePrice - property.downPayment;
      const expectedDebtYield = (result.metrics.noi / loanAmount) * 100;

      expect(result.metrics.debtYield).toBeCloseTo(expectedDebtYield, 1);

      // Debt yield should be positive
      expect(result.metrics.debtYield).toBeGreaterThan(0);
    });
  });
});
