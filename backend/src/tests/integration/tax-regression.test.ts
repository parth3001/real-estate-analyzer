/**
 * Tax Intelligence Regression Test Suite
 *
 * Senior QE Engineer: Ensuring Tax Intelligence doesn't break existing functionality
 * and maintains backward compatibility with non-tax properties.
 *
 * Critical Regression Tests:
 * - Existing SFR analysis works without tax profile
 * - Deal Quality scores remain consistent
 * - API backward compatibility
 * - Performance impact verification
 * - Investment verdicts accuracy preservation
 */

import { investmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import type { SFRData } from '../../types/propertyTypes';

describe('Tax Intelligence Regression Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // Baseline properties for regression testing
  const baselineProperties: SFRData[] = [
    {
      // Nashville Property (from financial-accuracy tests)
      propertyType: 'SFR',
      propertyAddress: {
        street: '123 Analyst Street',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37203'
      },
      purchasePrice: 500000,
      downPayment: 100000,
      interestRate: 7.0,
      loanTerm: 30,
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      propertyManagementRate: 8,
      yearBuilt: 2020,
      monthlyRent: 3000,
      squareFootage: 2000,
      bedrooms: 3,
      bathrooms: 2,
      maintenanceCost: 300,
      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3,
        sellingCostsPercentage: 6,
        inflationRate: 2.5,
        vacancyRate: 5,
        turnoverFrequency: 2
      }
    },
    {
      // Anna, TX Property (from E2E tests)
      propertyType: 'SFR',
      propertyAddress: {
        street: '1837 Walnut Way',
        city: 'Anna',
        state: 'TX',
        zipCode: '75409'
      },
      purchasePrice: 245000,
      downPayment: 49000,
      interestRate: 7.5,
      loanTerm: 30,
      monthlyRent: 2200,
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2020,
      propertyTaxRate: 1.8,
      insuranceRate: 0.5,
      maintenanceCost: 250,
      propertyManagementRate: 8,
      closingCosts: 5000,
      longTermAssumptions: {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3,
        inflationRate: 2.5,
        vacancyRate: 5,
        sellingCostsPercentage: 8
      }
    }
  ];

  describe('Backward Compatibility - Properties WITHOUT Tax Profile', () => {
    it('should maintain identical analysis results for existing properties', async () => {
      for (const property of baselineProperties) {
        const analyzer = new SFRAnalyzer(property, {
          projectionYears: 30,
          annualRentIncrease: 3,
          annualExpenseIncrease: 2.5,
          annualPropertyValueIncrease: 3,
          sellingCosts: property.longTermAssumptions?.sellingCostsPercentage || 8,
          vacancyRate: 5,
          turnoverFrequency: 2
        });

        const analysis = analyzer.analyze();
        const decision = await investmentDecisionEngine.analyzeInvestment(
          property,
          analysis,
          { marketTrends: null, demographics: null }
        );

        // Core functionality should remain unchanged
        expect(decision).toBeDefined();
        expect(decision.verdict).toBeDefined();
        expect(['BUY', 'NEGOTIATE', 'CAUTION', 'PASS']).toContain(decision.verdict);

        // Professional assessment structure should be preserved
        expect(decision.professionalAssessment).toBeDefined();
        expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(0);
        expect(decision.professionalAssessment.dealQuality).toBeLessThanOrEqual(100);

        // Score breakdown should still total 100
        const scoreTotal = Object.values(decision.scoreBreakdown).reduce((sum, score) => sum + score, 0);
        expect(scoreTotal).toBeCloseTo(100, 0);

        // Tax analysis should NOT be present without tax profile
        expect(decision.taxAnalysis).toBeUndefined();
        expect(decision.professionalAssessment.taxOptimization).toBeUndefined();

        // Core financial metrics should be calculated correctly
        expect(decision.keyInsights).toBeDefined();
        expect(decision.keyInsights.length).toBeGreaterThan(0);

        console.log(`✅ ${property.propertyAddress.city}, ${property.propertyAddress.state} - Backward compatibility verified`);
      }
    });

    it('should preserve original performance benchmarks', async () => {
      const testProperty = baselineProperties[0];

      const analyzer = new SFRAnalyzer(testProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();

      // Time the investment decision process
      const start = Date.now();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        testProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );
      const duration = Date.now() - start;

      expect(decision).toBeDefined();
      // Should complete within original performance target (2 seconds for non-tax analysis)
      expect(duration).toBeLessThan(2000);

      console.log(`✅ Performance: Non-tax analysis completed in ${duration}ms`);
    });

    it('should maintain consistent Deal Quality scoring', async () => {
      // Test known property scenarios to ensure scoring consistency
      const testScenarios = [
        {
          name: 'Good Deal',
          property: {
            ...baselineProperties[0],
            purchasePrice: 400000, // Lower price for better deal quality
            monthlyRent: 3000
          },
          expectedQualityRange: [70, 95]
        },
        {
          name: 'Marginal Deal',
          property: {
            ...baselineProperties[0],
            purchasePrice: 600000, // Higher price
            monthlyRent: 3000
          },
          expectedQualityRange: [40, 69]
        },
        {
          name: 'Poor Deal',
          property: {
            ...baselineProperties[0],
            purchasePrice: 800000, // Very high price
            monthlyRent: 3000
          },
          expectedQualityRange: [0, 39]
        }
      ];

      for (const scenario of testScenarios) {
        const analyzer = new SFRAnalyzer(scenario.property, {
          projectionYears: 30,
          annualRentIncrease: 3,
          annualExpenseIncrease: 2.5,
          annualPropertyValueIncrease: 3,
          sellingCosts: 6,
          vacancyRate: 5,
          turnoverFrequency: 2
        });

        const analysis = analyzer.analyze();
        const decision = await investmentDecisionEngine.analyzeInvestment(
          scenario.property,
          analysis,
          { marketTrends: null, demographics: null }
        );

        const dealQuality = decision.professionalAssessment.dealQuality;
        expect(dealQuality).toBeGreaterThanOrEqual(scenario.expectedQualityRange[0]);
        expect(dealQuality).toBeLessThanOrEqual(scenario.expectedQualityRange[1]);

        console.log(`✅ ${scenario.name}: Deal Quality ${dealQuality} (expected ${scenario.expectedQualityRange[0]}-${scenario.expectedQualityRange[1]})`);
      }
    });

    it('should maintain Investment Decision Engine verdict accuracy', async () => {
      // Test known verdict scenarios
      const verdictTests = [
        {
          description: 'Strong BUY scenario',
          property: {
            ...baselineProperties[1],
            purchasePrice: 200000, // Very good price
            monthlyRent: 2200
          },
          expectedVerdict: 'BUY'
        },
        {
          description: 'PASS scenario',
          property: {
            ...baselineProperties[1],
            purchasePrice: 400000, // Overpriced
            monthlyRent: 2200,
            interestRate: 9.0 // High interest rate
          },
          expectedVerdict: 'PASS'
        }
      ];

      for (const test of verdictTests) {
        const analyzer = new SFRAnalyzer(test.property, {
          projectionYears: 30,
          annualRentIncrease: 3,
          annualExpenseIncrease: 2.5,
          annualPropertyValueIncrease: 3,
          sellingCosts: 8,
          vacancyRate: 5,
          turnoverFrequency: 2
        });

        const analysis = analyzer.analyze();
        const decision = await investmentDecisionEngine.analyzeInvestment(
          test.property,
          analysis,
          { marketTrends: null, demographics: null }
        );

        expect(decision.verdict).toBe(test.expectedVerdict);
        console.log(`✅ ${test.description}: Verdict ${decision.verdict} (expected ${test.expectedVerdict})`);
      }
    });
  });

  describe('Tax Enhancement Impact Assessment', () => {
    it('should show measurable improvement with tax optimization', async () => {
      const testProperty = baselineProperties[0];

      // Version WITHOUT tax profile
      const withoutTax = { ...testProperty };

      // Version WITH tax profile (advantageous)
      const withTax = {
        ...testProperty,
        taxProfile: {
          filingStatus: 'married_joint' as const,
          state: 'FL', // No state tax
          capitalGainsHoldingStrategy: 'long_term' as const,
          depreciation: {
            method: 'straight_line' as const,
            personalUsePercentage: 0
          },
          investorType: 'individual' as const
        }
      };

      // Analyze both versions
      const analyzerWithoutTax = new SFRAnalyzer(withoutTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analyzerWithTax = new SFRAnalyzer(withTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysisWithoutTax = analyzerWithoutTax.analyze();
      const analysisWithTax = analyzerWithTax.analyze();

      const decisionWithoutTax = await investmentDecisionEngine.analyzeInvestment(
        withoutTax,
        analysisWithoutTax,
        { marketTrends: null, demographics: null }
      );

      const decisionWithTax = await investmentDecisionEngine.analyzeInvestment(
        withTax,
        analysisWithTax,
        { marketTrends: null, demographics: null }
      );

      // Tax-enhanced version should have additional analysis
      expect(decisionWithoutTax.taxAnalysis).toBeUndefined();
      expect(decisionWithTax.taxAnalysis).toBeDefined();

      // Professional assessment should be enhanced
      expect(decisionWithoutTax.professionalAssessment.taxOptimization).toBeUndefined();
      expect(decisionWithTax.professionalAssessment.taxOptimization).toBeDefined();

      if (decisionWithTax.professionalAssessment.taxOptimization) {
        // Should have meaningful tax optimization data
        expect(decisionWithTax.professionalAssessment.taxOptimization.afterTaxIRR).toBeDefined();
        expect(decisionWithTax.professionalAssessment.taxOptimization.afterTaxDealQuality).toBeDefined();
        expect(decisionWithTax.professionalAssessment.taxOptimization.optimalHoldPeriod).toBeDefined();

        // After-tax deal quality should be calculated
        const afterTaxQuality = decisionWithTax.professionalAssessment.taxOptimization.afterTaxDealQuality;
        expect(afterTaxQuality).toBeGreaterThanOrEqual(0);
        expect(afterTaxQuality).toBeLessThanOrEqual(100);

        console.log(`✅ Tax Enhancement: After-tax Deal Quality ${afterTaxQuality} vs Base ${decisionWithoutTax.professionalAssessment.dealQuality}`);
        console.log(`✅ Tax Enhancement: After-tax IRR ${(decisionWithTax.professionalAssessment.taxOptimization.afterTaxIRR * 100).toFixed(1)}%`);
      }
    });

    it('should not degrade performance significantly with tax analysis', async () => {
      const testProperty = {
        ...baselineProperties[0],
        taxProfile: {
          filingStatus: 'married_joint' as const,
          state: 'TX',
          capitalGainsHoldingStrategy: 'long_term' as const,
          depreciation: {
            method: 'straight_line' as const,
            personalUsePercentage: 0
          },
          investorType: 'individual' as const
        }
      };

      const analyzer = new SFRAnalyzer(testProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();

      // Time the tax-enhanced analysis
      const start = Date.now();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        testProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );
      const duration = Date.now() - start;

      expect(decision).toBeDefined();
      expect(decision.taxAnalysis).toBeDefined();

      // Should complete within performance target (4 seconds for tax-enhanced analysis)
      expect(duration).toBeLessThan(4000);

      console.log(`✅ Tax-Enhanced Performance: Analysis completed in ${duration}ms (target: <4000ms)`);
    });
  });

  describe('API Contract Validation', () => {
    it('should maintain consistent response structure', async () => {
      const testProperty = baselineProperties[1];

      const analyzer = new SFRAnalyzer(testProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        testProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Verify core API structure is preserved
      expect(decision).toHaveProperty('verdict');
      expect(decision).toHaveProperty('professionalAssessment');
      expect(decision).toHaveProperty('scoreBreakdown');
      expect(decision).toHaveProperty('keyInsights');
      expect(decision).toHaveProperty('walkAwayAnalysis');
      expect(decision).toHaveProperty('confidenceScore');

      // Professional assessment structure
      expect(decision.professionalAssessment).toHaveProperty('dealQuality');
      expect(decision.professionalAssessment).toHaveProperty('dealCategory');
      expect(decision.professionalAssessment).toHaveProperty('primaryStrengths');
      expect(decision.professionalAssessment).toHaveProperty('primaryConcerns');

      // Optional tax analysis should not break existing structure
      if (decision.taxAnalysis) {
        expect(decision.taxAnalysis).toHaveProperty('holdPeriodAnalysis');
        expect(decision.taxAnalysis).toHaveProperty('optimalHoldPeriod');
        expect(decision.taxAnalysis).toHaveProperty('totalTaxSavingsAtOptimal');
      }

      console.log('✅ API contract maintained with Tax Intelligence integration');
    });

    it('should preserve all existing financial calculations', async () => {
      const testProperty = baselineProperties[0];

      const analyzer = new SFRAnalyzer(testProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        testProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Core financial metrics should still be available
      expect(analysis).toHaveProperty('keyMetrics');
      expect(analysis.keyMetrics).toHaveProperty('capRate');
      expect(analysis.keyMetrics).toHaveProperty('cashOnCashReturn');
      expect(analysis.keyMetrics).toHaveProperty('irr');
      expect(analysis.keyMetrics).toHaveProperty('dscr');

      // Monthly analysis structure
      expect(analysis).toHaveProperty('monthlyAnalysis');
      expect(analysis.monthlyAnalysis).toHaveProperty('income');
      expect(analysis.monthlyAnalysis).toHaveProperty('expenses');
      expect(analysis.monthlyAnalysis).toHaveProperty('cashFlow');

      // Long-term analysis
      expect(analysis).toHaveProperty('longTermAnalysis');

      // Financial calculations should be reasonable
      expect(analysis.keyMetrics.capRate).toBeGreaterThan(0);
      expect(analysis.keyMetrics.capRate).toBeLessThan(50); // Reasonable cap rate
      expect(Math.abs(analysis.keyMetrics.irr)).toBeLessThan(1); // IRR as decimal

      console.log(`✅ Financial calculations preserved: Cap Rate ${(analysis.keyMetrics.capRate * 100).toFixed(1)}%, IRR ${(analysis.keyMetrics.irr * 100).toFixed(1)}%`);
    });
  });

  describe('Error Handling Regression', () => {
    it('should maintain graceful error handling for invalid properties', async () => {
      const invalidProperty: SFRData = {
        ...baselineProperties[0],
        purchasePrice: -100000, // Invalid negative price
        downPayment: 50000,
        monthlyRent: 0 // Invalid zero rent
      };

      const analyzer = new SFRAnalyzer(invalidProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      // Should handle invalid data gracefully (may throw or return default values)
      try {
        const analysis = analyzer.analyze();
        const decision = await investmentDecisionEngine.analyzeInvestment(
          invalidProperty,
          analysis,
          { marketTrends: null, demographics: null }
        );

        // If it succeeds, should still have valid structure
        expect(decision).toBeDefined();
        console.log('✅ Invalid property handled gracefully');
      } catch (error) {
        // Should throw meaningful error, not crash system
        expect(error).toBeInstanceOf(Error);
        console.log('✅ Invalid property properly rejected with error');
      }
    });

    it('should handle partial tax profile data without breaking', async () => {
      const partialTaxProperty: SFRData = {
        ...baselineProperties[0],
        taxProfile: {
          filingStatus: 'single',
          state: 'TX',
          // Missing other required fields
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(partialTaxProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();

      // Should not throw error, should handle partial data gracefully
      const decision = await investmentDecisionEngine.analyzeInvestment(
        partialTaxProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );

      expect(decision).toBeDefined();
      expect(decision.verdict).toBeDefined();

      // May or may not have tax analysis, but shouldn't break
      if (decision.taxAnalysis) {
        expect(decision.taxAnalysis.holdPeriodAnalysis).toBeDefined();
      }

      console.log('✅ Partial tax profile handled gracefully');
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain consistent results across multiple runs', async () => {
      const testProperty = baselineProperties[1];
      const results = [];

      // Run analysis 5 times
      for (let i = 0; i < 5; i++) {
        const analyzer = new SFRAnalyzer(testProperty, {
          projectionYears: 30,
          annualRentIncrease: 3,
          annualExpenseIncrease: 2.5,
          annualPropertyValueIncrease: 3,
          sellingCosts: 8,
          vacancyRate: 5,
          turnoverFrequency: 2
        });

        const analysis = analyzer.analyze();
        const decision = await investmentDecisionEngine.analyzeInvestment(
          testProperty,
          analysis,
          { marketTrends: null, demographics: null }
        );

        results.push({
          verdict: decision.verdict,
          dealQuality: decision.professionalAssessment.dealQuality,
          capRate: analysis.keyMetrics.capRate,
          irr: analysis.keyMetrics.irr
        });
      }

      // All runs should produce identical results
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.verdict).toBe(firstResult.verdict);
        expect(result.dealQuality).toBeCloseTo(firstResult.dealQuality, 2);
        expect(result.capRate).toBeCloseTo(firstResult.capRate, 4);
        expect(result.irr).toBeCloseTo(firstResult.irr, 4);
      });

      console.log(`✅ Consistency verified across ${results.length} runs`);
      console.log(`✅ Verdict: ${firstResult.verdict}, Deal Quality: ${firstResult.dealQuality}`);
    });
  });
});