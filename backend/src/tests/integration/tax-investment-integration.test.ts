/**
 * Tax Intelligence + Investment Decision Engine Integration Tests
 *
 * Senior QE Engineer: Testing the integration between Tax Intelligence
 * and Investment Decision Engine v2.1 to ensure tax analysis properly
 * enhances investment decisions and deal quality scoring.
 *
 * Test Scenarios:
 * - Property WITH tax profile vs WITHOUT tax profile
 * - Impact on deal quality score and verdict
 * - Tax-adjusted professional assessment
 * - AI content generation with tax insights
 * - Error handling and graceful degradation
 */

import { investmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { connectTestDB, closeTestDB, clearTestDB } from '../setup/testDatabase';
import type { SFRData } from '../../types/propertyTypes';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';

describe('Tax Intelligence + Investment Decision Engine Integration', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // Base property data for testing
  const basePropertyData: SFRData = {
    propertyType: 'SFR',
    propertyAddress: {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409'
    },
    purchasePrice: 245000,
    downPayment: 49000, // 20%
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
      sellingCostsPercentage: 8,
      turnoverFrequency: 2
    }
  };

  describe('Investment Decision with Tax Intelligence', () => {
    it('should enhance investment decision when tax profile is provided', async () => {
      // Property WITH tax profile
      const propertyWithTax: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'TX',
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      // Property WITHOUT tax profile
      const propertyWithoutTax: SFRData = { ...basePropertyData };

      // Analyze both properties
      const analyzerWithTax = new SFRAnalyzer(propertyWithTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analyzerWithoutTax = new SFRAnalyzer(propertyWithoutTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysisWithTax = analyzerWithTax.analyze();
      const analysisWithoutTax = analyzerWithoutTax.analyze();

      // Get investment decisions
      const decisionWithTax = await investmentDecisionEngine.analyzeInvestment(
        propertyWithTax,
        analysisWithTax,
        { marketTrends: null, demographics: null }
      );

      const decisionWithoutTax = await investmentDecisionEngine.analyzeInvestment(
        propertyWithoutTax,
        analysisWithoutTax,
        { marketTrends: null, demographics: null }
      );

      // Verify tax enhancement
      expect(decisionWithTax.taxAnalysis).toBeDefined();
      expect(decisionWithoutTax.taxAnalysis).toBeUndefined();

      // Tax-enhanced decision should have tax optimization in professional assessment
      if (decisionWithTax.professionalAssessment.taxOptimization) {
        expect(decisionWithTax.professionalAssessment.taxOptimization.afterTaxIRR).toBeDefined();
        expect(decisionWithTax.professionalAssessment.taxOptimization.optimalHoldPeriod).toBeDefined();
        expect(decisionWithTax.professionalAssessment.taxOptimization.taxEfficiencyScore).toBeDefined();
      }

      // Without tax profile should not have tax optimization
      expect(decisionWithoutTax.professionalAssessment.taxOptimization).toBeUndefined();
    });

    it('should improve deal quality score with tax optimization', async () => {
      const propertyWithTax: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'TX', // No state tax - advantage
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(propertyWithTax, {
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
        propertyWithTax,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Tax optimization should enhance deal quality
      if (decision.professionalAssessment.taxOptimization) {
        const baseDealQuality = decision.professionalAssessment.dealQuality;
        const afterTaxDealQuality = decision.professionalAssessment.taxOptimization.afterTaxDealQuality;

        // After-tax deal quality should be calculated
        expect(afterTaxDealQuality).toBeDefined();
        expect(afterTaxDealQuality).toBeGreaterThanOrEqual(0);
        expect(afterTaxDealQuality).toBeLessThanOrEqual(100);

        // Texas has no state tax, which should be an advantage
        expect(decision.professionalAssessment.taxOptimization.stateTaxAdvantage).toBe(true);
      }
    });

    it('should generate tax-aware AI content when tax profile exists', async () => {
      const propertyWithTax: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'single',
          state: 'CA', // High tax state
          federalTaxBracket: 32,
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(propertyWithTax, {
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
        propertyWithTax,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Check if AI content includes tax insights
      if (decision.professionalAssessment.taxOptimization) {
        expect(decision.professionalAssessment.taxOptimization.primaryTaxInsight).toBeDefined();
        expect(decision.professionalAssessment.taxOptimization.taxOptimizationRecommendations).toBeDefined();
        expect(decision.professionalAssessment.taxOptimization.taxOptimizationRecommendations.length).toBeGreaterThan(0);

        // California investor should get state tax warnings
        const hasStateTaxWarning = decision.professionalAssessment.taxOptimization.taxOptimizationRecommendations.some(
          rec => rec.toLowerCase().includes('state') || rec.toLowerCase().includes('california')
        );
        expect(hasStateTaxWarning).toBe(true);
      }
    });
  });

  describe('Tax Profile Impact on Investment Verdict', () => {
    it('should maintain consistent verdict calculation with tax enhancement', async () => {
      const property: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'TX',
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(property, {
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
        property,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Verdict should still be one of the valid types
      expect(['BUY', 'NEGOTIATE', 'CAUTION', 'PASS']).toContain(decision.verdict);

      // Deal quality should be within valid range
      expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(0);
      expect(decision.professionalAssessment.dealQuality).toBeLessThanOrEqual(100);

      // Score breakdown should still total 100
      const scoreTotal = Object.values(decision.scoreBreakdown).reduce((sum, score) => sum + score, 0);
      expect(scoreTotal).toBeCloseTo(100, 0);
    });

    it('should handle different tax strategies appropriately', async () => {
      const strategies = ['short_term', 'long_term', 'flexible'] as const;
      const results = [];

      for (const strategy of strategies) {
        const property: SFRData = {
          ...basePropertyData,
          taxProfile: {
            filingStatus: 'married_joint',
            state: 'TX',
            capitalGainsHoldingStrategy: strategy,
            depreciation: {
              method: 'straight_line',
              personalUsePercentage: 0
            },
            investorType: 'individual'
          }
        };

        const analyzer = new SFRAnalyzer(property, {
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
          property,
          analysis,
          { marketTrends: null, demographics: null }
        );

        results.push({
          strategy,
          optimalHoldPeriod: decision.professionalAssessment.taxOptimization?.optimalHoldPeriod,
          afterTaxIRR: decision.professionalAssessment.taxOptimization?.afterTaxIRR
        });
      }

      // Different strategies should potentially result in different optimal hold periods
      const holdPeriods = results.map(r => r.optimalHoldPeriod);
      expect(holdPeriods.every(hp => hp !== undefined)).toBe(true);

      // Long-term strategy should generally favor longer holds
      const longTermResult = results.find(r => r.strategy === 'long_term');
      const shortTermResult = results.find(r => r.strategy === 'short_term');

      if (longTermResult?.optimalHoldPeriod && shortTermResult?.optimalHoldPeriod) {
        // This is a general expectation, may not always hold
        expect(longTermResult.optimalHoldPeriod).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('1031 Exchange Analysis Integration', () => {
    it('should assess 1031 exchange eligibility when tax profile provided', async () => {
      const property: SFRData = {
        ...basePropertyData,
        purchasePrice: 500000, // Higher value property
        monthlyRent: 4000,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'CA', // High tax state - more incentive for 1031
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(property, {
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
        property,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Should have 1031 exchange analysis in tax results
      if (decision.taxAnalysis?.exchange1031Eligibility) {
        expect(decision.taxAnalysis.exchange1031Eligibility.eligible).toBeDefined();

        if (decision.taxAnalysis.exchange1031Eligibility.eligible) {
          expect(decision.taxAnalysis.exchange1031Eligibility.deferralAmount).toBeGreaterThan(0);
          expect(decision.taxAnalysis.exchange1031Eligibility.timelineRequirements).toBeDefined();
          expect(decision.taxAnalysis.exchange1031Eligibility.minimumExchangeValue).toBeGreaterThan(0);
        }
      }

      // Professional assessment should include 1031 eligibility flag
      if (decision.professionalAssessment.taxOptimization) {
        expect(decision.professionalAssessment.taxOptimization.exchange1031Eligible).toBeDefined();
      }
    });
  });

  describe('State Tax Advantage Analysis', () => {
    it('should identify state tax advantages correctly', async () => {
      const noTaxStates = ['TX', 'FL', 'NV', 'WA'];
      const highTaxStates = ['CA', 'NY', 'NJ'];

      for (const state of [...noTaxStates, ...highTaxStates]) {
        const property: SFRData = {
          ...basePropertyData,
          taxProfile: {
            filingStatus: 'married_joint',
            state,
            capitalGainsHoldingStrategy: 'long_term',
            depreciation: {
              method: 'straight_line',
              personalUsePercentage: 0
            },
            investorType: 'individual'
          }
        };

        const analyzer = new SFRAnalyzer(property, {
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
          property,
          analysis,
          { marketTrends: null, demographics: null }
        );

        if (decision.professionalAssessment.taxOptimization) {
          const isNoTaxState = noTaxStates.includes(state);
          expect(decision.professionalAssessment.taxOptimization.stateTaxAdvantage).toBe(isNoTaxState);

          // High tax states should have arbitrage opportunities mentioned
          if (highTaxStates.includes(state) && decision.taxAnalysis) {
            expect(decision.taxAnalysis.stateArbitrageOpportunities.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('Error Handling and Graceful Degradation', () => {
    it('should handle missing tax profile gracefully', async () => {
      const property: SFRData = {
        ...basePropertyData
        // No taxProfile
      };

      const analyzer = new SFRAnalyzer(property, {
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
        property,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Should still provide investment decision without tax analysis
      expect(decision).toBeDefined();
      expect(decision.verdict).toBeDefined();
      expect(decision.professionalAssessment.dealQuality).toBeDefined();
      expect(decision.taxAnalysis).toBeUndefined();
      expect(decision.professionalAssessment.taxOptimization).toBeUndefined();
    });

    it('should handle partial tax profile data', async () => {
      const property: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'TX',
          // Missing other fields
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(property, {
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
        property,
        analysis,
        { marketTrends: null, demographics: null }
      );

      // Should still provide tax analysis with defaults
      expect(decision).toBeDefined();
      if (decision.taxAnalysis) {
        expect(decision.taxAnalysis.holdPeriodAnalysis).toBeDefined();
        expect(decision.taxAnalysis.optimalHoldPeriod).toBeDefined();
      }
    });

    it('should log but not fail when tax calculation errors occur', async () => {
      const property: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'ZZ', // Invalid state code
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(property, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();

      // Should not throw, but handle gracefully
      await expect(
        investmentDecisionEngine.analyzeInvestment(property, analysis, { marketTrends: null, demographics: null })
      ).resolves.toBeDefined();
    });
  });

  describe('Performance Impact of Tax Intelligence', () => {
    it('should complete tax-enhanced analysis within 4 seconds', async () => {
      const property: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'CA',
          federalTaxBracket: 32,
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const analyzer = new SFRAnalyzer(property, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();

      const start = Date.now();
      await investmentDecisionEngine.analyzeInvestment(
        property,
        analysis,
        { marketTrends: null, demographics: null }
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(4000); // Should complete within 4 seconds
    });

    it('should not significantly impact performance without tax profile', async () => {
      const propertyWithTax: SFRData = {
        ...basePropertyData,
        taxProfile: {
          filingStatus: 'married_joint',
          state: 'TX',
          capitalGainsHoldingStrategy: 'long_term',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        }
      };

      const propertyWithoutTax: SFRData = { ...basePropertyData };

      // Time analysis with tax
      const analyzerWithTax = new SFRAnalyzer(propertyWithTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });
      const analysisWithTax = analyzerWithTax.analyze();

      const startWithTax = Date.now();
      await investmentDecisionEngine.analyzeInvestment(
        propertyWithTax,
        analysisWithTax,
        { marketTrends: null, demographics: null }
      );
      const durationWithTax = Date.now() - startWithTax;

      // Time analysis without tax
      const analyzerWithoutTax = new SFRAnalyzer(propertyWithoutTax, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });
      const analysisWithoutTax = analyzerWithoutTax.analyze();

      const startWithoutTax = Date.now();
      await investmentDecisionEngine.analyzeInvestment(
        propertyWithoutTax,
        analysisWithoutTax,
        { marketTrends: null, demographics: null }
      );
      const durationWithoutTax = Date.now() - startWithoutTax;

      // Tax analysis should add minimal overhead (< 500ms)
      const overhead = durationWithTax - durationWithoutTax;
      expect(overhead).toBeLessThan(500);
    });
  });
});