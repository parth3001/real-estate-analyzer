/**
 * Unit Tests for Financial Validation Layer
 * Ensures architectural safeguards prevent calculation errors
 */

import { FinancialValidator, TaxValidationData, IRRValidationData } from '../../utils/FinancialValidator';

describe('FinancialValidator', () => {
  describe('validateTaxCalculation', () => {
    it('should validate positive tax savings for longer hold periods', () => {
      const validData: TaxValidationData = {
        taxSavings: 20463, // Positive savings
        year1Tax: 38518,   // Higher short-term tax
        optimalTax: 18055, // Lower long-term tax
        holdPeriod: 10,
        afterTaxIRR: 0.08, // 8%
        pretaxIRR: 0.10    // 10%
      };

      const result = FinancialValidator.validateTaxCalculation(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag negative tax savings as error', () => {
      const invalidData: TaxValidationData = {
        taxSavings: -50415, // NEGATIVE savings (the bug we fixed)
        year1Tax: 18055,    // Lower tax (incorrect)
        optimalTax: 38518,  // Higher tax (incorrect)
        holdPeriod: 10,
        afterTaxIRR: 0.08,
        pretaxIRR: 0.10
      };

      const result = FinancialValidator.validateTaxCalculation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Unrealistic tax savings'));
    });

    it('should flag after-tax IRR higher than pre-tax IRR', () => {
      const invalidData: TaxValidationData = {
        taxSavings: 20463,
        year1Tax: 38518,
        optimalTax: 18055,
        holdPeriod: 10,
        afterTaxIRR: 0.12,  // Higher than pre-tax (impossible)
        pretaxIRR: 0.10
      };

      const result = FinancialValidator.validateTaxCalculation(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('After-tax IRR'));
    });
  });

  describe('validateIRR', () => {
    it('should validate reasonable IRR values', () => {
      const validData: IRRValidationData = {
        irr: 0.09623,  // 9.623% (reasonable)
        holdPeriod: 10,
        cashFlows: [],
        initialInvestment: 350000
      };

      const result = FinancialValidator.validateIRR(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag extreme IRR values as errors', () => {
      const invalidData: IRRValidationData = {
        irr: 9.623,  // 962.3% when formatted (double percentage bug)
        holdPeriod: 10,
        cashFlows: [],
        initialInvestment: 350000
      };

      const result = FinancialValidator.validateIRR(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('IRR too high'));
    });

    it('should warn about potential unit conversion errors', () => {
      const suspiciousData: IRRValidationData = {
        irr: 9.623,  // This value suggests decimal vs percentage confusion
        holdPeriod: 10,
        cashFlows: [],
        initialInvestment: 350000
      };

      const result = FinancialValidator.validateIRR(suspiciousData);

      expect(result.warnings).toContain(expect.stringContaining('unit conversion error'));
    });
  });

  describe('validateFinancialMetrics', () => {
    it('should validate reasonable financial metrics', () => {
      const metrics = {
        irr: 0.09,        // 9%
        capRate: 0.06,    // 6%
        cashOnCashReturn: 0.08, // 8%
        dscr: 1.25        // Healthy debt coverage
      };

      const result = FinancialValidator.validateFinancialMetrics(metrics);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag impossible DSCR values', () => {
      const metrics = {
        dscr: 0.3  // Cannot service debt
      };

      const result = FinancialValidator.validateFinancialMetrics(metrics);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('DSCR too low'));
    });

    it('should warn about unusual cap rates', () => {
      const metrics = {
        capRate: 0.30  // 30% cap rate is unusual
      };

      const result = FinancialValidator.validateFinancialMetrics(metrics);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(expect.stringContaining('Unusual cap rate'));
    });
  });
});

/**
 * Integration Tests for Tax Calculation Bug Fixes
 */
describe('Tax Calculation Bug Fixes - Integration Tests', () => {
  it('should calculate positive tax savings for Anna TX property scenario', () => {
    // Real scenario from the bug report
    const propertyData = {
      purchasePrice: 350000,
      salePrice: 470370,
      capitalGain: 120370,
      year1Tax: 120370 * 0.32,  // 32% ordinary income
      year10Tax: 120370 * 0.15, // 15% long-term cap gains
    };

    const expectedTaxSavings = propertyData.year1Tax - propertyData.year10Tax;

    expect(expectedTaxSavings).toBeGreaterThan(0);
    expect(expectedTaxSavings).toBeCloseTo(20462.9, 1);

    // This should pass validation
    const validationData: TaxValidationData = {
      taxSavings: expectedTaxSavings,
      year1Tax: propertyData.year1Tax,
      optimalTax: propertyData.year10Tax,
      holdPeriod: 10,
      afterTaxIRR: 0.09,
      pretaxIRR: 0.10
    };

    const result = FinancialValidator.validateTaxCalculation(validationData);
    expect(result.isValid).toBe(true);
  });

  it('should prevent the 962.3% IRR display bug', () => {
    // The bug: IRR stored as 9.623, formatted as 962.3%
    const correctDecimalIRR = 0.09623;  // Should be stored as decimal
    const buggyPercentageIRR = 9.623;   // The bug we fixed

    // Correct IRR should pass validation
    const validResult = FinancialValidator.validateIRR({
      irr: correctDecimalIRR,
      holdPeriod: 10,
      cashFlows: [],
      initialInvestment: 350000
    });
    expect(validResult.isValid).toBe(true);

    // Buggy IRR should fail validation
    const invalidResult = FinancialValidator.validateIRR({
      irr: buggyPercentageIRR,
      holdPeriod: 10,
      cashFlows: [],
      initialInvestment: 350000
    });
    expect(invalidResult.isValid).toBe(false);
  });
});