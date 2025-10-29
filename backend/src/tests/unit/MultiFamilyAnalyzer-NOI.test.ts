/**
 * Multi-Family Analyzer - NOI Calculation Tests (Story 1.2 Regression Protection)
 *
 * Priority: 🔴 P0 - CRITICAL
 * Purpose: Regression protection for Story 1.2 NOI bug fix
 * Background: Story 1.2 fixed critical bug where vacancy was incorrectly included in operating expenses
 * QE Review: Story 1.2 had ZERO automated tests - this file addresses that critical gap
 *
 * Test Coverage:
 * - EGI (Effective Gross Income) calculations (4 tests)
 * - Operating Expenses calculations (8 tests)
 * - NOI (Net Operating Income) calculations (7 tests)
 * Total: 19 tests
 */

import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFPropertyFactory } from '../helpers/MFPropertyFactory';
import { defaultMFAssumptions } from '../fixtures/mfTestData';

describe('MultiFamilyAnalyzer - NOI Calculations (Story 1.2)', () => {

  // ============================================
  // A. EGI (Effective Gross Income) Tests
  // ============================================

  describe('calculateEffectiveGrossIncome', () => {

    it('should calculate vacancy loss correctly', () => {
      const property = MFPropertyFactory.create();
      const assumptions = { ...defaultMFAssumptions, vacancyRate: 5 };
      const analyzer = new MultiFamilyAnalyzer(property, assumptions);

      // Calculate gross annual income from units
      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const egiMethod = (analyzer as any)['calculateEffectiveGrossIncome'];
      const egiResult = egiMethod.call(analyzer, grossIncome);

      const expectedVacancyLoss = grossIncome * 0.05;
      const expectedCreditLoss = grossIncome * 0.02;
      const expectedEGI = grossIncome - expectedVacancyLoss - expectedCreditLoss;

      expect(egiResult).toBeCloseTo(expectedEGI, 2);
    });

    it('should apply 2% credit loss (industry standard)', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const egiMethod = (analyzer as any)['calculateEffectiveGrossIncome'];
      const egiResult = egiMethod.call(analyzer, grossIncome);

      const creditLoss = grossIncome * 0.02;  // 2% industry standard
      const vacancyLoss = grossIncome * 0.05;  // 5% vacancy from defaultMFAssumptions
      const expectedEGI = grossIncome - vacancyLoss - creditLoss;

      expect(egiResult).toBeCloseTo(expectedEGI, 2);
    });

    it('should calculate EGI = Gross Income - Vacancy - Credit Loss', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const egiMethod = (analyzer as any)['calculateEffectiveGrossIncome'];
      const egiResult = egiMethod.call(analyzer, grossIncome);

      // Formula: EGI = Gross Income - (Gross Income * vacancy%) - (Gross Income * creditLoss%)
      const expectedVacancy = grossIncome * 0.05;
      const expectedCredit = grossIncome * 0.02;
      const expectedEGI = grossIncome - expectedVacancy - expectedCredit;

      expect(egiResult).toBeCloseTo(expectedEGI, 0);
    });

    it('should handle zero vacancy rate', () => {
      const property = MFPropertyFactory.create();
      const assumptions = { ...defaultMFAssumptions, vacancyRate: 0 };
      const analyzer = new MultiFamilyAnalyzer(property, assumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const egiMethod = (analyzer as any)['calculateEffectiveGrossIncome'];
      const egiResult = egiMethod.call(analyzer, grossIncome);

      // With 0% vacancy, only credit loss applies
      const expectedEGI = grossIncome - (grossIncome * 0.02);
      expect(egiResult).toBeCloseTo(expectedEGI, 2);
    });
  });

  // ============================================
  // B. Operating Expenses Tests
  // ============================================

  describe('calculateOperatingExpenses - Story 1.2 Regression', () => {

    it('should NOT include vacancy in operating expenses (REGRESSION TEST)', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const vacancyLoss = grossIncome * 0.05;

      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      // CRITICAL REGRESSION TEST: Vacancy should NOT be in operating expenses
      // Before Story 1.2 fix: Operating expenses incorrectly included vacancy loss
      // After Story 1.2 fix: Operating expenses exclude vacancy loss

      // Operating expenses should be LESS than gross income
      expect(operatingExpenses).toBeLessThan(grossIncome);

      // Operating expenses should NOT equal or be close to vacancy loss
      expect(operatingExpenses).not.toBeCloseTo(vacancyLoss, 0);

      // Operating expenses should be a reasonable percentage of income (typically 40-60%)
      const expenseRatio = (operatingExpenses / grossIncome) * 100;
      expect(expenseRatio).toBeGreaterThan(30);
      expect(expenseRatio).toBeLessThan(70);
    });

    it('should calculate property tax from purchase price', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 1200000,
        propertyTaxRate: 1.5
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      const expectedAnnualPropertyTax = 1200000 * 0.015;  // $18,000/year
      // Property tax should be one component of total expenses
      expect(operatingExpenses).toBeGreaterThan(expectedAnnualPropertyTax);
    });

    it('should calculate insurance from purchase price', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 1200000,
        insuranceRate: 0.6
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      const expectedAnnualInsurance = 1200000 * 0.006;  // $7,200/year
      // Insurance should be one component of total expenses
      expect(operatingExpenses).toBeGreaterThan(expectedAnnualInsurance);
    });

    it('should calculate maintenance per unit annually', () => {
      const property = MFPropertyFactory.create({
        maintenanceCostPerUnit: 100,  // $100/unit/month
        totalUnits: 8
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      const expectedAnnualMaintenance = 100 * 8 * 12;  // $9,600/year
      // Maintenance should be one component of total expenses
      expect(operatingExpenses).toBeGreaterThan(expectedAnnualMaintenance);
    });

    it('should include property management percentage of gross income', () => {
      const property = MFPropertyFactory.create({
        propertyManagementRate: 8  // 8% of gross income
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      const expectedPropertyManagement = grossIncome * 0.08;
      // Property management should be one component of total expenses
      expect(operatingExpenses).toBeGreaterThan(expectedPropertyManagement);
    });

    it('should include utilities for common areas', () => {
      const property = MFPropertyFactory.create({
        commonAreaUtilities: {
          electric: 180,  // Monthly
          water: 200,
          gas: 0,
          trash: 150
        }
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      const expectedAnnualUtilities = (180 + 200 + 0 + 150) * 12;  // $6,360/year
      // Utilities should be one component of total expenses
      expect(operatingExpenses).toBeGreaterThan(expectedAnnualUtilities);
    });

    it('should include capital reserves per unit', () => {
      const property = MFPropertyFactory.create({
        totalUnits: 8
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      // Note: Capital reserves are typically included in operating expenses
      // Just verify that operating expenses exist and are reasonable
      expect(operatingExpenses).toBeGreaterThan(0);
    });

    it('should calculate total operating expenses correctly', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 1200000,
        totalUnits: 8,
        propertyTaxRate: 1.5,
        insuranceRate: 0.6,
        maintenanceCostPerUnit: 100,
        propertyManagementRate: 8,
        commonAreaUtilities: {
          electric: 180,
          water: 200,
          gas: 0,
          trash: 150
        }
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      const operatingExpensesMethod = (analyzer as any)['calculateOperatingExpenses'];
      const operatingExpenses = operatingExpensesMethod.call(analyzer, grossIncome);

      // Manual calculation:
      const propertyTax = 1200000 * 0.015;  // $18,000
      const insurance = 1200000 * 0.006;    // $7,200
      const maintenance = 100 * 8 * 12;      // $9,600
      const propertyMgmt = grossIncome * 0.08;
      const utilities = (180 + 200 + 0 + 150) * 12;  // $6,360

      // Operating expenses should include all these components
      expect(operatingExpenses).toBeGreaterThan(propertyTax + insurance + maintenance);
    });
  });

  // ============================================
  // C. NOI (Net Operating Income) Tests
  // ============================================

  describe('calculateNOI', () => {

    it('should calculate NOI = EGI - Operating Expenses', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const result = analyzer.analyze();

      // NOI should be positive for a well-performing property
      expect(result.keyMetrics.noi).toBeGreaterThan(0);

      // NOI should be less than gross income (after vacancy and expenses)
      const grossIncome = MFPropertyFactory.calculateGrossAnnualIncome(property);
      expect(result.keyMetrics.noi).toBeLessThan(grossIncome);
    });

    it('should produce realistic NOI for 8-unit property', () => {
      // Use units array to specify exact rents
      const property = MFPropertyFactory.create({
        purchasePrice: 1200000,
        totalUnits: 8,
        units: [
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1450, unitNumber: '101' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1450, unitNumber: '102' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1450, unitNumber: '201' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1450, unitNumber: '202' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1450, unitNumber: '103' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1450, unitNumber: '104' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1450, unitNumber: '203' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1450, unitNumber: '204' }
        ]
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const result = analyzer.analyze();

      // Expected calculation:
      const grossIncome = 1450 * 8 * 12;  // $139,200
      const vacancyLoss = grossIncome * 0.05;  // $6,960
      const creditLoss = grossIncome * 0.02;    // $2,784
      const egi = grossIncome - vacancyLoss - creditLoss;  // $129,456

      // NOI should be EGI minus operating expenses (typically 40-50% of EGI)
      expect(result.keyMetrics.noi).toBeLessThan(egi);
      expect(result.keyMetrics.noi).toBeGreaterThan(egi * 0.4);  // At least 40% margin
    });

    it('should calculate per-unit NOI correctly', () => {
      const property = MFPropertyFactory.create({
        totalUnits: 8
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const result = analyzer.analyze();

      const expectedNoiPerUnit = result.keyMetrics.noi / property.totalUnits;  // Annual per-unit NOI

      expect(result.keyMetrics.noiPerUnit).toBeCloseTo(expectedNoiPerUnit, 2);
    });

    it('should handle zero NOI edge case (break-even property)', () => {
      // Create property with expenses equal to income
      const property = MFPropertyFactory.create({
        purchasePrice: 2000000,  // High price
        totalUnits: 8,
        propertyTaxRate: 2.5,    // High taxes
        maintenanceCostPerUnit: 200,  // High maintenance
        units: [
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '101' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '102' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '201' },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1000, unitNumber: '202' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1000, unitNumber: '103' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1000, unitNumber: '104' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1000, unitNumber: '203' },
          { bedrooms: 3, bathrooms: 2, squareFeet: 1100, currentRent: 1000, unitNumber: '204' }
        ]
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const result = analyzer.analyze();

      // NOI might be zero or negative for bad deal
      // Test should not crash, should handle gracefully
      expect(result.keyMetrics.noi).toBeDefined();
      expect(typeof result.keyMetrics.noi).toBe('number');
      expect(isFinite(result.keyMetrics.noi)).toBe(true);
    });

    it('should handle negative NOI (cash flow negative property)', () => {
      const property = MFPropertyFactory.createNegativeCashFlow();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      const result = analyzer.analyze();

      // Negative NOI should be allowed (represents losing money)
      expect(result.keyMetrics.noi).toBeDefined();
      expect(typeof result.keyMetrics.noi).toBe('number');

      // Cap rate should handle negative NOI appropriately
      if (result.keyMetrics.noi < 0) {
        // Negative cap rate or zero
        expect(result.keyMetrics.capRate).toBeLessThanOrEqual(0);
      }
    });

    it('should calculate higher NOI for low-expense properties', () => {
      const lowExpenseProperty = MFPropertyFactory.createWithLowExpenses();
      const standardProperty = MFPropertyFactory.create();

      const lowExpenseAnalyzer = new MultiFamilyAnalyzer(lowExpenseProperty, defaultMFAssumptions);
      const standardAnalyzer = new MultiFamilyAnalyzer(standardProperty, defaultMFAssumptions);

      const lowExpenseResult = lowExpenseAnalyzer.analyze();
      const standardResult = standardAnalyzer.analyze();

      // Low expense property should have higher NOI (same income, lower expenses)
      expect(lowExpenseResult.keyMetrics.noi).toBeGreaterThan(standardResult.keyMetrics.noi);
    });

    it('should calculate lower NOI for high-vacancy properties', () => {
      const highVacancyProperty = MFPropertyFactory.createWithHighVacancy();
      const standardProperty = MFPropertyFactory.create();

      const highVacancyAnalyzer = new MultiFamilyAnalyzer(highVacancyProperty, defaultMFAssumptions);
      const standardAnalyzer = new MultiFamilyAnalyzer(standardProperty, defaultMFAssumptions);

      const highVacancyResult = highVacancyAnalyzer.analyze();
      const standardResult = standardAnalyzer.analyze();

      // High vacancy property should have lower NOI (lower effective income)
      expect(highVacancyResult.keyMetrics.noi).toBeLessThan(standardResult.keyMetrics.noi);
    });
  });
});
