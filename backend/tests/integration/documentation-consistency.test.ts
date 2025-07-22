import { describe, test, expect } from '@jest/globals';
import { SFRAnalyzer } from '../../src/analysis/SFRAnalyzer';
import { SFRData } from '../../src/types/propertyTypes';
import { AnalysisAssumptions } from '../../src/analysis/BasePropertyAnalyzer';

describe('Documentation Consistency Tests', () => {
  // Sample SFR data for testing
  const sampleSFRData: SFRData = {
    propertyType: 'SFR',
    propertyAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    },
    purchasePrice: 300000,
    downPayment: 60000,
    closingCosts: 5000,
    capitalInvestments: 15000,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyRent: 2500,
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2000,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 200,
    propertyManagementRate: 8
  };

  const assumptions: AnalysisAssumptions = {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCosts: 6,
    vacancyRate: 5
  };

  describe('API Response Schema Validation', () => {
    test('SFRAnalyzer returns all documented keyMetrics fields', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Check that keyMetrics exists
      expect(result.keyMetrics).toBeDefined();

      // Verify all CommonMetrics fields are present
      expect(result.keyMetrics.noi).toBeDefined();
      expect(result.keyMetrics.capRate).toBeDefined();
      expect(result.keyMetrics.cashOnCashReturn).toBeDefined();
      expect(result.keyMetrics.irr).toBeDefined();
      expect(result.keyMetrics.dscr).toBeDefined();
      expect(result.keyMetrics.operatingExpenseRatio).toBeDefined();
      expect(result.keyMetrics.totalInvestment).toBeDefined();

      // Verify totalInvestment calculation
      const expectedTotalInvestment = sampleSFRData.downPayment + 
                                     (sampleSFRData.closingCosts || 0) + 
                                     (sampleSFRData.capitalInvestments || 0);
      expect(result.keyMetrics.totalInvestment).toBe(expectedTotalInvestment);
    });

    test('longTermAnalysis.returns includes new totalInvestment fields', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Check that longTermAnalysis.returns exists
      expect(result.longTermAnalysis).toBeDefined();
      expect(result.longTermAnalysis.returns).toBeDefined();

      // Verify new fields are present
      expect(result.longTermAnalysis.returns.totalInvestment).toBeDefined();
      expect(result.longTermAnalysis.returns.totalAdditionalInvestment).toBeDefined();

      // Verify values match
      expect(result.longTermAnalysis.returns.totalInvestment).toBe(80000); // 60000 + 5000 + 15000
      expect(result.longTermAnalysis.returns.totalAdditionalInvestment).toBe(15000); // capitalInvestments
    });

    test('Analysis result structure matches documented format', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Verify top-level structure
      expect(result).toHaveProperty('monthlyAnalysis');
      expect(result).toHaveProperty('annualAnalysis');
      expect(result).toHaveProperty('keyMetrics');
      expect(result).toHaveProperty('longTermAnalysis');

      // Verify monthlyAnalysis structure
      expect(result.monthlyAnalysis).toHaveProperty('income');
      expect(result.monthlyAnalysis).toHaveProperty('expenses');
      expect(result.monthlyAnalysis).toHaveProperty('cashFlow');

      // Verify annualAnalysis structure
      expect(result.annualAnalysis).toHaveProperty('income');
      expect(result.annualAnalysis).toHaveProperty('expenses');
      expect(result.annualAnalysis).toHaveProperty('noi');
      expect(result.annualAnalysis).toHaveProperty('debtService');
      expect(result.annualAnalysis).toHaveProperty('cashFlow');

      // Verify longTermAnalysis structure
      expect(result.longTermAnalysis).toHaveProperty('projections');
      expect(result.longTermAnalysis).toHaveProperty('exitAnalysis');
      expect(result.longTermAnalysis).toHaveProperty('returns');
      expect(result.longTermAnalysis).toHaveProperty('projectionYears');
    });
  });

  describe('Field Type Validation', () => {
    test('All numeric fields return numbers, not undefined or null', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Check keyMetrics
      Object.values(result.keyMetrics).forEach(value => {
        if (typeof value === 'number') {
          expect(value).not.toBeNaN();
          expect(value).toBeDefined();
        }
      });

      // Check returns
      Object.values(result.longTermAnalysis.returns).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).not.toBeNaN();
      });
    });
  });

  describe('Calculation Consistency', () => {
    test('totalInvestment is consistent across different parts of analysis', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      const keyMetricsTotalInvestment = result.keyMetrics.totalInvestment;
      const returnsTotalInvestment = result.longTermAnalysis.returns.totalInvestment;

      // Both should be the same
      expect(keyMetricsTotalInvestment).toBe(returnsTotalInvestment);
      
      // And should equal the calculated value
      const expected = sampleSFRData.downPayment + 
                      (sampleSFRData.closingCosts || 0) + 
                      (sampleSFRData.capitalInvestments || 0);
      expect(keyMetricsTotalInvestment).toBe(expected);
    });
  });
});