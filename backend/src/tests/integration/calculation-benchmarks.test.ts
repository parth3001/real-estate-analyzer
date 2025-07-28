import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import { SFRAnalyzer } from '../../analyzers/sfrAnalyzer';
import fs from 'fs';
import path from 'path';

describe('Calculation Benchmarks - Reference Property Validation', () => {
  let referenceProperty: any;
  let comparisonProperties: any[];

  beforeAll(async () => {
    await connectTestDB();
    
    // Load reference property data from Cypress fixtures
    const fixtureData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../cypress/fixtures/reference-property.json'),
        'utf8'
      )
    );
    
    referenceProperty = fixtureData.nashville_sfr_2024;
    comparisonProperties = fixtureData.comparison_properties;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Nashville Reference Property - 2024 Market Data', () => {
    it('should calculate exact financial metrics for reference property', async () => {
      const property = referenceProperty.propertyData;
      const expected = referenceProperty.expectedCalculations;

      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(property);

      // Validate monthly analysis with exact values
      expect(analysis.monthlyAnalysis.income?.gross).toBeCloseTo(expected.monthlyAnalysis.grossIncome, 0);
      
      // Property tax: (Purchase Price * Tax Rate) / 12
      const expectedPropertyTax = (property.purchasePrice * property.propertyTaxRate / 100) / 12;
      expect(analysis.monthlyAnalysis.expenses.propertyTax).toBeCloseTo(expectedPropertyTax, 2);
      
      // Insurance: (Purchase Price * Insurance Rate) / 12
      const expectedInsurance = (property.purchasePrice * property.insuranceRate / 100) / 12;
      expect(analysis.monthlyAnalysis.expenses.insurance).toBeCloseTo(expectedInsurance, 2);
      
      // Property Management: (Monthly Rent * Management Rate) / 100
      const expectedPropMgmt = (property.monthlyRent * property.propertyManagementRate) / 100;
      expect(analysis.monthlyAnalysis.expenses.propertyManagement).toBeCloseTo(expectedPropMgmt, 2);
      
      // Vacancy: (Monthly Rent * Vacancy Rate) / 100
      const expectedVacancy = (property.monthlyRent * property.longTermAssumptions.vacancyRate) / 100;
      expect(analysis.monthlyAnalysis.expenses.vacancy).toBeCloseTo(expectedVacancy, 2);

      // Cash Flow calculation
      expect(analysis.monthlyAnalysis.cashFlow).toBeCloseTo(expected.monthlyAnalysis.cashFlow, 2);

      // Key metrics validation
      expect(analysis.keyMetrics.capRate).toBeCloseTo(expected.keyMetrics.capRate, 0.1);
      expect(analysis.keyMetrics.cashOnCashReturn).toBeCloseTo(expected.keyMetrics.cashOnCashReturn, 0.1);
      expect(analysis.keyMetrics.debtServiceCoverageRatio).toBeCloseTo(expected.keyMetrics.debtServiceCoverageRatio, 0.02);
      expect(analysis.keyMetrics.onePercentRuleValue).toBeCloseTo(expected.keyMetrics.onePercentRuleValue, 0.01);
    });

    it('should validate debt service calculation accuracy', async () => {
      const property = referenceProperty.propertyData;
      
      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(property);

      // Manual debt service calculation for validation
      const loanAmount = property.purchasePrice - property.downPayment; // $340,000
      const monthlyRate = property.interestRate / 100 / 12; // 7.125% / 12
      const numberOfPayments = property.loanTerm * 12; // 30 * 12 = 360

      // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
      const expectedMonthlyDebtService = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      expect(analysis.monthlyAnalysis.debtService).toBeCloseTo(expectedMonthlyDebtService, 2);
      expect(analysis.annualAnalysis.annualDebtService).toBeCloseTo(expectedMonthlyDebtService * 12, 2);
    });

    it('should validate NOI calculation components', async () => {
      const property = referenceProperty.propertyData;
      
      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(property);

      // Calculate expected NOI manually
      const annualGrossIncome = property.monthlyRent * 12;
      const annualPropertyTax = (property.purchasePrice * property.propertyTaxRate / 100);
      const annualInsurance = (property.purchasePrice * property.insuranceRate / 100);
      const annualMaintenance = property.maintenanceCost * 12;
      const annualPropMgmt = (annualGrossIncome * property.propertyManagementRate / 100);
      const annualVacancy = (annualGrossIncome * property.longTermAssumptions.vacancyRate / 100);

      const expectedNOI = annualGrossIncome - (
        annualPropertyTax + annualInsurance + annualMaintenance + annualPropMgmt + annualVacancy
      );

      expect(analysis.annualAnalysis.annualNOI).toBeCloseTo(expectedNOI, 2);
      
      // Validate Cap Rate: NOI / Purchase Price * 100
      const expectedCapRate = (expectedNOI / property.purchasePrice) * 100;
      expect(analysis.keyMetrics.capRate).toBeCloseTo(expectedCapRate, 0.1);
    });

    it('should handle edge case scenarios from reference data', async () => {
      const edgeCases = referenceProperty.edgeCaseTests;

      for (const edgeCase of edgeCases) {
        const modifiedProperty = {
          ...referenceProperty.propertyData,
          ...edgeCase.modification
        };

        const analyzer = new SFRAnalyzer();
        const analysis = await analyzer.analyze(modifiedProperty);

        // Validate based on scenario
        switch (edgeCase.scenario) {
          case 'interest_rate_change':
            // Higher interest rate should result in lower cash flow
            expect(analysis.monthlyAnalysis.cashFlow).toBeLessThan(
              referenceProperty.expectedCalculations.monthlyAnalysis.cashFlow
            );
            expect(analysis.keyMetrics.debtServiceCoverageRatio).toBeLessThan(
              referenceProperty.expectedCalculations.keyMetrics.debtServiceCoverageRatio
            );
            break;

          case 'rent_increase':
            // Higher rent should improve cash flow and cap rate
            expect(analysis.monthlyAnalysis.cashFlow).toBeGreaterThan(
              referenceProperty.expectedCalculations.monthlyAnalysis.cashFlow
            );
            expect(analysis.keyMetrics.capRate).toBeGreaterThan(
              referenceProperty.expectedCalculations.keyMetrics.capRate
            );
            break;

          case 'higher_vacancy':
            // Higher vacancy should reduce cash flow
            expect(analysis.monthlyAnalysis.cashFlow).toBeLessThan(
              referenceProperty.expectedCalculations.monthlyAnalysis.cashFlow
            );
            break;
        }
      }
    });
  });

  describe('Comparative Property Analysis', () => {
    it('should correctly rank properties by investment quality', async () => {
      const analyzer = new SFRAnalyzer();
      const results = [];

      // Analyze all properties
      for (const property of comparisonProperties) {
        const analysis = await analyzer.analyze(property.propertyData);
        results.push({
          name: property.name,
          expectedClassification: property.expectedClassification,
          analysis: analysis,
          monthlyIncome: analysis.monthlyAnalysis.cashFlow || 0,
          cocrReturn: analysis.keyMetrics.cashOnCashReturn || 0
        });
      }

      // Sort by cash-on-cash return
      results.sort((a, b) => b.cocrReturn - a.cocrReturn);

      // High cash flow property should rank first
      const topProperty = results[0];
      expect(topProperty.name).toBe('High Cash Flow Property');
      expect(topProperty.monthlyIncome).toBeGreaterThan(200);
      expect(topProperty.cocrReturn).toBeGreaterThan(5); // Should be positive

      // Break even property should have DSCR near 1.0
      const breakEvenProperty = results.find(r => r.name === 'Break Even Property');
      expect(breakEvenProperty?.analysis.keyMetrics.debtServiceCoverageRatio).toBeCloseTo(1.0, 0.1);
      expect(Math.abs(breakEvenProperty?.monthlyIncome || 0)).toBeLessThan(100);
    });

    it('should validate 1% rule across all test properties', async () => {
      const analyzer = new SFRAnalyzer();

      for (const property of comparisonProperties) {
        const analysis = await analyzer.analyze(property.propertyData);
        
        // Calculate 1% rule manually
        const onePercentRule = (property.propertyData.monthlyRent / property.propertyData.purchasePrice) * 100;
        
        expect(analysis.keyMetrics.onePercentRuleValue).toBeCloseTo(onePercentRule, 0.01);

        // Properties meeting 1% rule should generally perform better
        if (onePercentRule >= 1.0) {
          expect(analysis.keyMetrics.capRate).toBeGreaterThan(4.0);
        }
      }
    });
  });

  describe('Long-term Projection Validation', () => {
    it('should project compound appreciation accurately', async () => {
      const property = referenceProperty.propertyData;
      
      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(property);

      expect(analysis.longTermAnalysis.projections).toBeDefined();
      
      if (analysis.longTermAnalysis.projections && analysis.longTermAnalysis.projections.length > 0) {
        const projections = analysis.longTermAnalysis.projections;
        
        // Validate year-over-year appreciation
        const appreciationRate = property.longTermAssumptions.annualPropertyValueIncrease / 100;
        
        for (let i = 1; i < Math.min(projections.length, 10); i++) {
          const expectedValue = property.purchasePrice * Math.pow(1 + appreciationRate, i);
          expect(projections[i - 1].propertyValue).toBeCloseTo(expectedValue, -2); // Within $100
        }

        // Validate rent growth
        const rentGrowthRate = property.longTermAssumptions.annualRentIncrease / 100;
        
        for (let i = 1; i < Math.min(projections.length, 10); i++) {
          const expectedRent = property.monthlyRent * Math.pow(1 + rentGrowthRate, i) * 12;
          expect(projections[i - 1].grossRent).toBeCloseTo(expectedRent, -2);
        }
      }
    });

    it('should calculate IRR within reasonable bounds', async () => {
      const property = referenceProperty.propertyData;
      
      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(property);

      if (analysis.longTermAnalysis.returns?.irr) {
        // IRR should be realistic for real estate investments
        expect(analysis.longTermAnalysis.returns.irr).toBeGreaterThan(-15);
        expect(analysis.longTermAnalysis.returns.irr).toBeLessThan(25);
      }

      // Total return should include cash flow and appreciation
      if (analysis.longTermAnalysis.returns?.totalReturn) {
        expect(analysis.longTermAnalysis.returns.totalReturn).toBeDefined();
        expect(typeof analysis.longTermAnalysis.returns.totalReturn).toBe('number');
      }
    });
  });

  describe('Extreme Value Testing', () => {
    it('should handle very expensive properties', async () => {
      const expensiveProperty = {
        ...referenceProperty.propertyData,
        purchasePrice: 2000000,
        downPayment: 400000,
        monthlyRent: 8000
      };

      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(expensiveProperty);

      // Should calculate without errors
      expect(analysis.keyMetrics.capRate).toBeDefined();
      expect(analysis.keyMetrics.cashOnCashReturn).toBeDefined();
      
      // Values should be reasonable
      expect(analysis.keyMetrics.capRate).toBeGreaterThan(0);
      expect(analysis.keyMetrics.capRate).toBeLessThan(20);
    });

    it('should handle very cheap properties', async () => {
      const cheapProperty = {
        ...referenceProperty.propertyData,
        purchasePrice: 50000,
        downPayment: 10000,
        monthlyRent: 800,
        maintenanceCost: 80
      };

      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(cheapProperty);

      // Should calculate very high returns due to low price
      expect(analysis.keyMetrics.capRate).toBeGreaterThan(10);
      expect(analysis.keyMetrics.onePercentRuleValue).toBeGreaterThan(1.0);
    });

    it('should handle zero down payment scenarios', async () => {
      const zeroDownProperty = {
        ...referenceProperty.propertyData,
        downPayment: 0 // 100% financing
      };

      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(zeroDownProperty);

      // Cash-on-cash return should be infinite or undefined for zero down
      // But analysis should not crash
      expect(analysis.monthlyAnalysis.cashFlow).toBeDefined();
      expect(analysis.keyMetrics.capRate).toBeDefined();
    });
  });

  describe('Calculation Precision Testing', () => {
    it('should maintain precision across multiple property analyses', async () => {
      const analyzer = new SFRAnalyzer();
      const testProperty = referenceProperty.propertyData;

      // Run same analysis multiple times
      const analyses = await Promise.all([
        analyzer.analyze(testProperty),
        analyzer.analyze(testProperty),
        analyzer.analyze(testProperty)
      ]);

      // All results should be identical
      expect(analyses[0].keyMetrics.capRate).toEqual(analyses[1].keyMetrics.capRate);
      expect(analyses[1].keyMetrics.capRate).toEqual(analyses[2].keyMetrics.capRate);
      
      expect(analyses[0].monthlyAnalysis.cashFlow).toEqual(analyses[1].monthlyAnalysis.cashFlow);
      expect(analyses[1].monthlyAnalysis.cashFlow).toEqual(analyses[2].monthlyAnalysis.cashFlow);
    });

    it('should handle decimal precision in financial calculations', async () => {
      const precisionProperty = {
        ...referenceProperty.propertyData,
        purchasePrice: 333333.33,
        downPayment: 66666.67,
        monthlyRent: 2777.78,
        interestRate: 6.875
      };

      const analyzer = new SFRAnalyzer();
      const analysis = await analyzer.analyze(precisionProperty);

      // Should handle decimals without precision loss
      expect(analysis.keyMetrics.capRate).toBeDefined();
      expect(analysis.keyMetrics.cashOnCashReturn).toBeDefined();
      
      // Values should be numbers, not NaN
      expect(isNaN(analysis.keyMetrics.capRate)).toBe(false);
      expect(isNaN(analysis.keyMetrics.cashOnCashReturn)).toBe(false);
    });
  });
});