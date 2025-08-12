/**
 * Enhanced Investment Decision Engine Test Suite
 * 
 * Comprehensive test coverage for the enhanced Investment Decision Engine v2.1
 * including all phases of the upgrade:
 * 
 * Phase 2A: Market Intelligence - Market tier classification and relative analysis
 * Phase 2B: Property Classification - A/B/C property class with risk adjustments
 * Phase 3: Strategy Alignment - Strategy-market fit and alignment analysis
 * 
 * This test suite ensures all phases work together to provide institutional-grade
 * investment intelligence that transforms basic calculations into professional insights.
 */

import { InvestmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { SFRData } from '../../types/propertyTypes';
import { MarketTierService } from '../../services/investment/marketTierService';
import { PropertyClassificationService } from '../../services/investment/propertyClassificationService';
import { StrategyAlignmentService } from '../../services/investment/strategyAlignmentService';

describe('Investment Decision Engine v2.1 - Enhanced with All Phases', () => {
  let decisionEngine: InvestmentDecisionEngine;

  beforeEach(() => {
    decisionEngine = new InvestmentDecisionEngine();
  });

  // ===== PHASE 2A: MARKET INTELLIGENCE TESTS =====

  describe('Phase 2A: Market Intelligence Integration', () => {
    test('should apply Tier 1 market thresholds (Austin, TX)', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 650000,
        monthlyRent: 3400,
        propertyAddress: {
          street: '123 Tech Blvd',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        capRate: 0.055, // 5.5% cap rate
        cashOnCashReturn: 0.08
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should reference market tier in secondary reasons
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Tier 1') || reason.includes('Austin')
      )).toBe(true);

      // Should have market-relative analysis
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('market median') || reason.includes('market')
      )).toBe(true);
    });

    test('should apply Tier 3 market thresholds (Anna, TX)', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 320000,
        monthlyRent: 2400,
        propertyAddress: {
          city: 'Anna',
          state: 'TX',
          zipCode: '75409'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 600,
        capRate: 0.075, // 7.5% cap rate
        cashOnCashReturn: 0.12
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should reference Tier 3 cash flow market
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Tier 3') || reason.includes('Cash Flow')
      )).toBe(true);

      // Higher cap rates should be more acceptable in Tier 3 markets
      expect(decision.verdict).not.toBe('PASS');
    });

    test('should provide fair market value analysis', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 2800
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 400,
        capRate: 0.06,
        noi: 25000 // Annual NOI for fair market value calculation
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should include fair market value insights or pricing context
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('fair value') || 
        reason.includes('market value') ||
        reason.includes('Target price') ||
        reason.includes('Fair value')
      )).toBe(true);
    });
  });

  // ===== PHASE 2B: PROPERTY CLASSIFICATION TESTS =====

  describe('Phase 2B: Property Classification Integration', () => {
    test('should classify new luxury property as Class A', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 650000,
        monthlyRent: 4200,
        yearBuilt: 2020, // New construction
        squareFootage: 2800
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 1200,
        capRate: 0.045,
        cashOnCashReturn: 0.09
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should identify as Class A property
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Class A') && reason.includes('Premium')
      )).toBe(true);

      // Class A properties should boost confidence
      expect(decision.confidence).toBeGreaterThan(50);
    });

    test('should classify older property as Class C with warnings', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 185000,
        monthlyRent: 1650,
        yearBuilt: 1968, // Very old property
        squareFootage: 1400
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 350,
        capRate: 0.08,
        cashOnCashReturn: 0.10
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'novice' })
      );

      // Should identify as Class C property
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Class C') && reason.includes('Value property')
      )).toBe(true);

      // Should have management intensity warnings
      expect(decision.keyRisks.some(risk => 
        risk.includes('management') || risk.includes('experienced')
      )).toBe(true);

      // Should reduce confidence for novice + Class C
      expect(decision.confidence).toBeLessThan(70);
    });

    test('should apply property class risk adjustments to thresholds', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 250000,
        monthlyRent: 2000,
        yearBuilt: 1980 // Class C property
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 500,
        capRate: 0.07, // 7% cap rate
        cashOnCashReturn: 0.12
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Class C properties should require higher cap rate premiums
      // Should reference risk adjustments in analysis
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('maintenance') || 
        reason.includes('risk') ||
        reason.includes('Class C')
      )).toBe(true);
    });

    test('should provide property-specific insights based on classification', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 380000,
        monthlyRent: 2800,
        yearBuilt: 2010 // Class B property
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 650,
        capRate: 0.065,
        cashOnCashReturn: 0.09
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should provide Class B specific insights
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Class B') || 
        reason.includes('Standard investment-grade') ||
        reason.includes('balanced risk-return')
      )).toBe(true);
    });
  });

  // ===== PHASE 3: STRATEGY ALIGNMENT TESTS =====

  describe('Phase 3: Strategy Alignment Integration', () => {
    test('should detect cash flow strategy in appreciation market mismatch', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 680000,
        monthlyRent: 3400, // Lower cash flow for price
        propertyAddress: {
          city: 'Austin',
          state: 'TX' // Tier 1 appreciation market
        },
        exitStrategy: {
          portfolioStrategy: 'cashflow', // MISMATCH with market
          riskApproach: 'balanced'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 400, // Modest cash flow
        capRate: 0.04,
        cashOnCashReturn: 0.06
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should detect strategy-market misalignment
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Strategy Alignment') && 
        (reason.includes('FAIR') || reason.includes('POOR') || reason.includes('MISMATCH'))
      )).toBe(true);

      // Should provide strategy recommendations
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('cash flow') || 
        reason.includes('appreciation') ||
        reason.includes('strategy')
      )).toBe(true);
    });

    test('should detect novice investor with Class C property mismatch', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 185000,
        monthlyRent: 1650,
        yearBuilt: 1968, // Class C
        exitStrategy: {
          portfolioStrategy: 'first', // Novice investor
          riskApproach: 'conservative'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 350,
        capRate: 0.08,
        cashOnCashReturn: 0.10
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'novice' })
      );

      // Should detect experience-risk mismatch
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Strategy Alignment') && 
        reason.includes('MISMATCH')
      )).toBe(true);

      // Should warn about experience level vs property complexity
      expect(decision.keyRisks.some(risk => 
        risk.includes('management') || 
        risk.includes('experienced') ||
        risk.includes('novice')
      )).toBe(true);

      // Should significantly reduce confidence
      expect(decision.confidence).toBeLessThan(60);
    });

    test('should detect short-term hold with appreciation strategy conflict', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 475000,
        monthlyRent: 3200,
        longTermAssumptions: {
          projectionYears: 2 // Short hold period
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'appreciation', // MISMATCH with short hold
          riskApproach: 'aggressive'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 600,
        capRate: 0.055,
        cashOnCashReturn: 0.08
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should detect hold period alignment issues
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('hold period') || 
        reason.includes('2-year') ||
        reason.includes('short')
      )).toBe(true);

      // Should provide strategic recommendations
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('5-7 years') || 
        reason.includes('Extend')
      )).toBe(true);
    });

    test('should reward good strategy alignment', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 385000,
        monthlyRent: 2850,
        yearBuilt: 2012, // Class B
        propertyAddress: {
          city: 'Dallas',
          state: 'TX' // Tier 2 balanced market
        },
        longTermAssumptions: {
          projectionYears: 6 // Good medium-term hold
        },
        exitStrategy: {
          portfolioStrategy: 'balanced', // GOOD alignment with market
          riskApproach: 'balanced'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 700,
        capRate: 0.065,
        cashOnCashReturn: 0.09
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'intermediate' })
      );

      // Should show good or excellent alignment
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Strategy Alignment') && 
        (reason.includes('GOOD') || reason.includes('EXCELLENT'))
      )).toBe(true);

      // Good alignment should boost confidence
      expect(decision.confidence).toBeGreaterThan(60);
    });
  });

  // ===== INTEGRATED SYSTEM TESTS =====

  describe('Integrated System: All Phases Working Together', () => {
    test('should provide comprehensive analysis with all phases', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 420000,
        monthlyRent: 2900,
        yearBuilt: 2015,
        propertyAddress: {
          city: 'Frisco',
          state: 'TX'
        },
        longTermAssumptions: {
          projectionYears: 5
        },
        exitStrategy: {
          portfolioStrategy: 'balanced',
          riskApproach: 'balanced'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 650,
        capRate: 0.06,
        cashOnCashReturn: 0.08,
        noi: 28000
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'intermediate' })
      );

      // Should have insights from all phases
      const allReasons = decision.secondaryReasons.join(' ');
      
      // Phase 2A: Market Intelligence
      expect(allReasons).toMatch(/Tier \d|market|median/i);
      
      // Phase 2B: Property Classification  
      expect(allReasons).toMatch(/Class [ABC]|classification confidence/i);
      
      // Phase 3: Strategy Alignment
      expect(allReasons).toMatch(/Strategy Alignment|alignment/i);

      // Should have comprehensive risk assessment
      expect(decision.keyRisks.length).toBeGreaterThan(0);
      
      // Should have meaningful confidence score
      expect(decision.confidence).toBeGreaterThan(30);
      expect(decision.confidence).toBeLessThan(96);

      // Should have property quality score
      expect(decision.score).toBeGreaterThan(0);
      expect(decision.score).toBeLessThanOrEqual(100);
    });

    test('should handle complex mismatch scenario with multiple issues', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 150000,
        monthlyRent: 1400,
        yearBuilt: 1965, // Very old = Class C
        propertyAddress: {
          city: 'Anna', // Tier 3 cash flow market
          state: 'TX'
        },
        longTermAssumptions: {
          projectionYears: 2 // Short hold
        },
        exitStrategy: {
          portfolioStrategy: 'first', // Novice
          riskApproach: 'conservative' // Conservative + Class C mismatch
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 250,
        capRate: 0.09,
        cashOnCashReturn: 0.12
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'novice' })
      );

      // Should detect multiple misalignments
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Class C')
      )).toBe(true);
      
      expect(decision.secondaryReasons.some(reason => 
        reason.includes('Strategy Alignment') && 
        (reason.includes('MISMATCH') || reason.includes('POOR'))
      )).toBe(true);

      // Should have significant confidence penalty
      expect(decision.confidence).toBeLessThan(70);

      // Should have multiple risk factors
      expect(decision.keyRisks.length).toBeGreaterThan(2);
    });

    test('should provide premium analysis for excellent opportunities', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 450000,
        monthlyRent: 3500,
        yearBuilt: 2018, // Class A
        propertyAddress: {
          city: 'Plano', // Good Tier 2 market
          state: 'TX'
        },
        longTermAssumptions: {
          projectionYears: 7 // Good long-term hold
        },
        exitStrategy: {
          portfolioStrategy: 'balanced',
          riskApproach: 'balanced'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 1200, // Excellent cash flow
        capRate: 0.08, // Strong cap rate
        cashOnCashReturn: 0.12, // Excellent CoC
        noi: 35000
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext({ experienceLevel: 'experienced' })
      );

      // Should likely recommend BUY or NEGOTIATE
      expect(['BUY', 'NEGOTIATE']).toContain(decision.verdict);

      // Should have high confidence and score
      expect(decision.confidence).toBeGreaterThan(60);
      expect(decision.score).toBeGreaterThan(50);

      // Should highlight the opportunity quality
      expect(decision.primaryReason).toMatch(/strong|excellent|positive|good/i);
    });
  });

  // ===== EDGE CASES AND VALIDATION =====

  describe('Edge Cases and System Validation', () => {
    test('should handle missing optional data gracefully', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2200,
        // Missing yearBuilt, squareFootage, etc.
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 500,
        capRate: 0.065
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      // Should still provide analysis with defaults
      expect(decision.verdict).toMatch(/BUY|PASS|NEGOTIATE/);
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.secondaryReasons.length).toBeGreaterThan(0);
    });

    test('should maintain performance with complex analysis', async () => {
      const startTime = Date.now();

      const propertyData = createPropertyData({
        purchasePrice: 500000,
        monthlyRent: 3200
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        capRate: 0.055
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        createMockMarketIntelligence(),
        createUserContext()
      );

      const processingTime = Date.now() - startTime;

      // Should complete within reasonable time (2 seconds)
      expect(processingTime).toBeLessThan(2000);
      
      // Should still provide complete analysis
      expect(decision.secondaryReasons.length).toBeGreaterThan(2);
    });
  });
});

// ===== HELPER FUNCTIONS =====

function createPropertyData(overrides: Partial<SFRData> = {}): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 0.0725,
    loanTerm: 30,
    propertyTaxRate: 0.015,
    insuranceRate: 0.003,
    maintenanceCost: 2000,
    propertyManagementRate: 0.08,
    monthlyRent: 2400,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
    propertyAddress: {
      street: '123 Test Street',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201'
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 0.03,
      annualPropertyValueIncrease: 0.03,
      inflationRate: 0.025,
      vacancyRate: 0.05,
      sellingCostsPercentage: 0.06
    },
    ...overrides
  };
}

function createAnalysis(overrides: any = {}) {
  return {
    monthlyAnalysis: {
      grossRent: 2400,
      totalExpenses: 1200,
      netOperatingIncome: 1200,
      debtService: 800,
      cashFlow: 400,
      ...overrides
    },
    keyMetrics: {
      capRate: 0.065,
      cashOnCashReturn: 0.08,
      dscr: 1.5,
      operatingExpenseRatio: 0.35,
      rentToPriceRatio: 0.008,
      onePercentRuleValue: 0.008,
      noi: 25000,
      irr: 0.10,
      totalROI: 0.12,
      ...overrides
    }
  };
}

function createUserContext(overrides: any = {}) {
  return {
    availableCash: 150000,
    experienceLevel: 'intermediate',
    riskTolerance: 'moderate',
    investmentGoals: 'balanced',
    ...overrides
  };
}

function createMockMarketIntelligence() {
  return {
    marketTrends: {
      averageRent: 2500,
      priceGrowth: 0.04,
      rentGrowth: 0.035
    },
    economicIndicators: {
      medianHomePrice: 350000,
      unemploymentRate: 0.035,
      populationGrowth: 0.025
    },
    marketData: {
      medianCapRate: 0.06,
      daysOnMarket: 25,
      inventoryLevel: 'balanced'
    }
  };
}