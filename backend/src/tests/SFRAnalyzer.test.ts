import { SFRAnalyzer } from '../analysis/SFRAnalyzer';
import { SFRData } from '../types/propertyTypes';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

describe('SFRAnalyzer', () => {
  // Sample SFR data for testing
  const sampleSFRData: SFRData = {
    propertyType: 'SFR',
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 4.5,
    loanTerm: 30,
    monthlyRent: 2500,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    propertyManagementRate: 8,
    maintenanceCost: 1200, // Annual
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2000,
    closingCosts: 5000,
    propertyAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    }
  };

  // Sample analysis assumptions
  const assumptions: AnalysisAssumptions = {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    annualExpenseIncrease: 2,
    sellingCosts: 6,
    vacancyRate: 5
  };

  describe('analyze', () => {
    it('should return a complete analysis result with all required fields', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Check that all required sections are present
      expect(result.monthlyAnalysis).toBeDefined();
      expect(result.annualAnalysis).toBeDefined();
      expect(result.keyMetrics).toBeDefined();
      expect(result.longTermAnalysis).toBeDefined();
      expect(result.sensitivityAnalysis).toBeDefined();
    });

    it('should calculate basic metrics correctly', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Basic metrics
      expect(result.keyMetrics.capRate).toBeGreaterThan(0);
      expect(result.keyMetrics.cashOnCashReturn).toBeGreaterThan(0);
      expect(result.keyMetrics.dscr).toBeGreaterThan(1); // Healthy DSCR
      expect(result.keyMetrics.irr).toBeGreaterThan(0);
    });

    it('should calculate new metrics correctly', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // New metrics
      expect(result.keyMetrics.breakEvenOccupancy).toBeDefined();
      expect(result.keyMetrics.breakEvenOccupancy).toBeGreaterThan(0);
      expect(result.keyMetrics.breakEvenOccupancy).toBeLessThan(100); // Should be less than 100%

      expect(result.keyMetrics.equityMultiple).toBeDefined();
      expect(result.keyMetrics.equityMultiple).toBeGreaterThan(0);

      expect(result.keyMetrics.onePercentRuleValue).toBeDefined();
      // For $2500 monthly rent on $300,000 property, should be close to 0.83%
      expect(result.keyMetrics.onePercentRuleValue).toBeCloseTo(0.83, 1);

      expect(result.keyMetrics.fiftyRuleAnalysis).toBeDefined();
      expect(typeof result.keyMetrics.fiftyRuleAnalysis).toBe('boolean');

      expect(result.keyMetrics.rentToPriceRatio).toBeDefined();
      expect(result.keyMetrics.rentToPriceRatio).toBeGreaterThan(0);

      expect(result.keyMetrics.pricePerBedroom).toBeDefined();
      // $300,000 / 3 bedrooms = $100,000 per bedroom
      expect(result.keyMetrics.pricePerBedroom).toEqual(100000);

      expect(result.keyMetrics.debtToIncomeRatio).toBeDefined();
      expect(result.keyMetrics.debtToIncomeRatio).toBeGreaterThan(0);
      expect(result.keyMetrics.debtToIncomeRatio).toBeLessThan(100); // Should be less than 100%
    });

    it('should calculate sensitivity analysis correctly', () => {
      const analyzer = new SFRAnalyzer(sampleSFRData, assumptions);
      const result = analyzer.analyze();

      // Sensitivity analysis
      expect(result.sensitivityAnalysis).toBeDefined();
      expect(result.sensitivityAnalysis?.bestCase).toBeDefined();
      expect(result.sensitivityAnalysis?.worstCase).toBeDefined();
      
      // Best case should be better than worst case
      expect(result.sensitivityAnalysis?.bestCase.cashFlow).toBeGreaterThan(result.sensitivityAnalysis?.worstCase.cashFlow || 0);
      expect(result.sensitivityAnalysis?.bestCase.cashOnCashReturn).toBeGreaterThan(result.sensitivityAnalysis?.worstCase.cashOnCashReturn || 0);
      expect(result.sensitivityAnalysis?.bestCase.totalReturn).toBeGreaterThan(result.sensitivityAnalysis?.worstCase.totalReturn || 0);
    });
  });
}); 