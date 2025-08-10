/**
 * Comprehensive Investment Decision Engine Test Suite
 * 
 * Tests all acceptance criteria from the Enhanced Investment Decision Logic user story.
 * This is a critical feature test suite covering market-aware investment recommendations.
 * 
 * Test Categories:
 * 1. Market-Relative Analysis
 * 2. Price Reduction Calculations  
 * 3. Too Good to Be True Detection
 * 4. Rent-to-Price Ratio Validation
 * 5. Operating Expense Validation
 * 6. Walk Away Price Calculation
 * 7. Property Age Risk Assessment
 * 8. Exit Strategy Optimization
 * 9. Experience Level Adjustments
 * 10. Cash Flow Buffer Requirements
 * 11. Confidence Score Framework
 * 12. Edge Cases & Error Handling
 */

import { InvestmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { SFRData } from '../../types/propertyTypes';

describe('Investment Decision Engine - Comprehensive Test Suite', () => {
  let decisionEngine: InvestmentDecisionEngine;

  beforeEach(() => {
    decisionEngine = new InvestmentDecisionEngine();
  });

  // ===== CATEGORY 1: MARKET-RELATIVE ANALYSIS =====

  describe('AC1: Market-Relative Cap Rate Analysis', () => {
    test('should pass high-value market with below-market cap rate', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 1200000,
        monthlyRent: 4500, // 3.375% cap rate
        location: { city: 'San Francisco', state: 'CA', zipCode: '94105' }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 1200,
        capRate: 0.03375,
        marketMedianCapRate: 0.038 // Market median is 3.8%
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { marketIntelligence: { medianCapRate: 0.038 } },
        createUserContext({ experienceLevel: 'intermediate' })
      );

      expect(decision.verdict).not.toBe('PASS'); // Should not fail on fixed 4% rule
      expect(decision.primaryReason).toContain('market');
      expect(decision.marketContext).toBeDefined();
    });

    test('should negotiate when cap rate is 0.5-1.5% below market median', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2000, // 8% cap rate
        location: { city: 'Austin', state: 'TX', zipCode: '78701' }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        capRate: 0.06, // 6% cap rate
        marketMedianCapRate: 0.07 // Market median is 7%
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { marketIntelligence: { medianCapRate: 0.07 } },
        createUserContext()
      );

      expect(decision.verdict).toBe('NEGOTIATE');
      expect(decision.primaryReason).toContain('below market median');
    });

    test('should pass when cap rate is >1.5% below market median', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 1500, // 4.5% cap rate
        marketMedianCapRate: 0.08 // Market median is 8%
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 200,
        capRate: 0.045, // 4.5% cap rate, 3.5% below median
        marketMedianCapRate: 0.08
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { marketIntelligence: { medianCapRate: 0.08 } },
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('significantly below market');
    });
  });

  // ===== CATEGORY 2: PRICE REDUCTION CALCULATIONS =====

  describe('AC2: Price Reduction Calculations', () => {
    test('should calculate accurate price reduction using cap rate method', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2200
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 400, // Needs $200 more to reach $600 target
        capRate: 0.06,
        targetMonthlyCashFlow: 600
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      if (decision.verdict === 'NEGOTIATE') {
        expect(decision.priceReduction).toBeDefined();
        expect(decision.targetPrice).toBeDefined();
        expect(decision.negotiationRange).toBeDefined();
        
        // Should use formula: (Additional Annual Cash Flow Needed) / Cap Rate
        const additionalAnnual = (600 - 400) * 12; // $2,400 annual
        const expectedReduction = additionalAnnual / 0.06; // $40,000
        
        expect(decision.priceReduction).toBeCloseTo(expectedReduction, -3);
        expect(decision.targetPrice).toBe(300000 - expectedReduction);
      }
    });

    test('should provide negotiation range with min/max bounds', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 250000,
        monthlyRent: 2000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 300,
        capRate: 0.08
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      if (decision.verdict === 'NEGOTIATE') {
        expect(decision.negotiationRange?.minimum).toBeDefined();
        expect(decision.negotiationRange?.maximum).toBeDefined();
        expect(decision.negotiationRange?.maximum).toBeGreaterThan(decision.negotiationRange?.minimum);
      }
    });
  });

  // ===== CATEGORY 3: TOO GOOD TO BE TRUE DETECTION =====

  describe('AC3: Too Good to Be True Detection', () => {
    test('should detect suspicious high returns with long days on market', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 80000,
        monthlyRent: 1200, // 18% cap rate
        daysOnMarket: 45
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        capRate: 0.18, // 18% cap rate
        marketMedianCapRate: 0.07 // Market median 7%
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { marketIntelligence: { medianCapRate: 0.07 } },
        createUserContext()
      );

      // Should downgrade from BUY to NEGOTIATE
      expect(decision.verdict).toBe('NEGOTIATE');
      expect(decision.confidence).toBeLessThan(50); // Reduced by 30 points
      expect(decision.riskFlags).toContain('Unusually high returns');
      expect(decision.primaryReason).toContain('verify all assumptions');
    });

    test('should not flag high returns for new listings', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 80000,
        monthlyRent: 1200, // 18% cap rate
        daysOnMarket: 5 // New listing
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        capRate: 0.18,
        marketMedianCapRate: 0.07
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { marketIntelligence: { medianCapRate: 0.07 } },
        createUserContext()
      );

      // Should not be flagged as "too good to be true"
      expect(decision.riskFlags).not.toContain('Unusually high returns');
    });
  });

  // ===== CATEGORY 4: RENT-TO-PRICE RATIO VALIDATION =====

  describe('AC4: Rent-to-Price Ratio Validation', () => {
    test('should pass properties with rent-to-price ratio < 0.4%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 500000,
        monthlyRent: 1500 // 0.36% ratio
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 100,
        capRate: 0.035
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('rent-to-price ratio');
      expect(decision.metrics?.rentToPriceRatio).toBeCloseTo(0.36, 1);
    });

    test('should flag high risk for ratio < 0.5%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 1600 // 0.48% ratio
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 200,
        capRate: 0.045
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.riskFlags).toContain('rent-to-price ratio below 0.5%');
      expect(decision.confidence).toBeLessThan(70);
    });

    test('should flag verify rent for ratio > 1.2%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 100000,
        monthlyRent: 1300 // 1.56% ratio
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 900,
        capRate: 0.12
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.riskFlags).toContain('verify rent accuracy');
    });
  });

  // ===== CATEGORY 5: OPERATING EXPENSE VALIDATION =====

  describe('AC5: Operating Expense Validation', () => {
    test('should flag high operating expense ratio > 50%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 200000,
        monthlyRent: 2000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 200,
        totalOperatingExpenses: 1200, // 60% of rent
        operatingExpenseRatio: 0.60
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.riskFlags).toContain('operating expense ratio > 50%');
      expect(decision.confidence).toBeLessThan(70); // Reduced by 15 points
    });

    test('should flag suspiciously low operating expenses < 25%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 200000,
        monthlyRent: 2000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 1200,
        totalOperatingExpenses: 400, // 20% of rent
        operatingExpenseRatio: 0.20
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.riskFlags).toContain('suspiciously low');
      expect(decision.industryBenchmark?.operatingExpenseRange).toEqual('30-45%');
    });
  });

  // ===== CATEGORY 6: WALK AWAY PRICE CALCULATION =====

  describe('AC6: Walk Away Price Calculation', () => {
    test('should calculate walk away price using multiple methods', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2500
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        noi: 18000, // $1,500/month net operating income
        comparableAverage: 280000
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { treasuryRate: 0.045 },
        createUserContext()
      );

      expect(decision.walkAwayPrice).toBeDefined();
      expect(decision.walkAwayCalculation).toBeDefined();
      
      // Should be minimum of:
      // 1. NOI / (Treasury + 3%) = 18000 / 0.075 = $240,000
      // 2. Comparables × 0.95 = 280000 × 0.95 = $266,000  
      // 3. Monthly Rent × 100 = 2500 × 100 = $250,000
      
      expect(decision.walkAwayPrice).toBe(240000); // Minimum of the three
      expect(decision.walkAwayCalculation?.method).toBe('treasury_spread');
    });

    test('should pass when purchase price > walk away price × 1.1', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 350000, // Above walk away price
        monthlyRent: 2200
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 400,
        noi: 15000 // Would create walk away price of ~$200k
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        { treasuryRate: 0.045 },
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('exceeds maximum viable price');
    });
  });

  // ===== CATEGORY 7: EXIT STRATEGY OPTIMIZATION =====

  describe('AC8: Exit Strategy Optimization', () => {
    test('should use 5.5% hurdle rate for 1031 exchange', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 3000,
        exitStrategy: {
          primaryExitStrategy: '1031exchange',
          portfolioStrategy: 'appreciation'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 600,
        cashOnCashReturn: 0.058 // 5.8%, above 5.5% but below 6.5%
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).not.toBe('PASS'); // Should pass 5.5% hurdle, not 6.5%
      expect(decision.hurdleRate).toBe(0.055);
      expect(decision.primaryReason).toContain('tax benefits');
    });

    test('should require 12% minimum for quick flip strategy', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 150000,
        monthlyRent: 1800,
        exitStrategy: {
          primaryExitStrategy: 'sale',
          marketTimingFlexibility: 'constrained' // Indicates quick flip
        },
        longTermAssumptions: {
          projectionYears: 1 // Quick flip
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 700,
        cashOnCashReturn: 0.10 // 10%, good but below 12% requirement
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('12% minimum');
      expect(decision.riskFlags).toContain('short-term capital gains');
    });

    test('should require positive cash flow for estate/generational hold', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 350000,
        monthlyRent: 2800,
        exitStrategy: {
          primaryExitStrategy: 'estate',
          portfolioStrategy: 'cashflow'
        }
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: -50, // Negative cash flow
        cashOnCashReturn: 0.08 // Good CoC return due to appreciation
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('sustainability');
      expect(decision.cashFlowBuffer?.required).toBeGreaterThanOrEqual(500);
    });
  });

  // ===== CATEGORY 8: EXPERIENCE LEVEL ADJUSTMENTS =====

  describe('AC11: Experience Level Adjustments', () => {
    test('should protect novice investors with higher hurdle rates', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 250000,
        monthlyRent: 2200
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 350, // Below $400 minimum
        cashOnCashReturn: 0.07 // 7%, good but below novice requirement
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext({ experienceLevel: 'novice' })
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.confidence).toBeLessThanOrEqual(70);
      expect(decision.hurdleRate).toBe(0.075); // 7.5% (6.5% + 1%)
      expect(decision.primaryReason).toContain('minimum $400');
    });

    test('should cap confidence at 85% for intermediate investors', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 200000,
        monthlyRent: 2000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 800,
        cashOnCashReturn: 0.12, // Excellent returns
        capRate: 0.10
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext({ experienceLevel: 'intermediate' })
      );

      expect(decision.confidence).toBeLessThanOrEqual(85);
    });

    test('should allow up to 95% confidence for experienced investors', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 3000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 1200,
        cashOnCashReturn: 0.15,
        capRate: 0.12,
        appreciationPotential: 'high'
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext({ experienceLevel: 'experienced' })
      );

      if (decision.verdict === 'BUY') {
        expect(decision.confidence).toBeLessThanOrEqual(95);
        expect(decision.confidence).toBeGreaterThan(85);
      }
    });
  });

  // ===== CATEGORY 9: CASH FLOW BUFFER REQUIREMENTS =====

  describe('AC10: Cash Flow Buffer Requirements', () => {
    test('should calculate minimum buffer as max of 20% mortgage or $300', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        downPayment: 80000, // $320k loan at 7% = ~$2,130/month mortgage
        interestRate: 0.07,
        monthlyRent: 3200
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 500, // Above $300 but below $426 (20% of mortgage)
        monthlyMortgagePayment: 2130
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.cashFlowBuffer?.required).toBe(426); // 20% of $2,130
      expect(decision.cashFlowBuffer?.current).toBe(500);
      expect(decision.cashFlowBuffer?.status).toBe('adequate');
    });

    test('should negotiate when buffer is 50-100% of requirement', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2400
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 350, // Between 50-100% of $300 minimum
        monthlyMortgagePayment: 1600
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('NEGOTIATE');
      expect(decision.primaryReason).toContain('cash flow buffer');
    });

    test('should pass when buffer < 50% of requirement', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 3000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 120, // Less than 50% of $300 minimum
        monthlyMortgagePayment: 2000
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('insufficient cash flow buffer');
    });
  });

  // ===== CATEGORY 10: CONFIDENCE SCORE FRAMEWORK =====

  describe('AC12: Confidence Score Framework', () => {
    test('should start with appropriate base confidence scores', async () => {
      const basePropertyData = createPropertyData({
        purchasePrice: 200000,
        monthlyRent: 1800
      });

      // Test BUY verdict base confidence (80%)
      const buyAnalysis = createAnalysis({
        monthlyNetCashFlow: 800,
        cashOnCashReturn: 0.15,
        capRate: 0.12
      });

      const buyDecision = await decisionEngine.generateInvestmentDecision(
        basePropertyData,
        buyAnalysis,
        null,
        {},
        createUserContext()
      );

      if (buyDecision.verdict === 'BUY') {
        expect(buyDecision.confidence).toBeCloseTo(80, -1); // Base 80% ±10
      }
    });

    test('should floor confidence at 30% and ceiling at 95%', async () => {
      // Test floor - worst case scenario
      const worstPropertyData = createPropertyData({
        purchasePrice: 500000,
        monthlyRent: 800, // Terrible rent-to-price ratio
        daysOnMarket: 365
      });

      const worstAnalysis = createAnalysis({
        monthlyNetCashFlow: -500,
        cashOnCashReturn: -0.05,
        capRate: 0.01,
        operatingExpenseRatio: 0.80 // 80% expense ratio
      });

      const worstDecision = await decisionEngine.generateInvestmentDecision(
        worstPropertyData,
        worstAnalysis,
        null,
        {},
        createUserContext({ experienceLevel: 'novice' })
      );

      expect(worstDecision.confidence).toBeGreaterThanOrEqual(30);

      // Test ceiling - best case scenario
      const bestPropertyData = createPropertyData({
        purchasePrice: 100000,
        monthlyRent: 2000 // Excellent ratio
      });

      const bestAnalysis = createAnalysis({
        monthlyNetCashFlow: 1500,
        cashOnCashReturn: 0.25,
        capRate: 0.20,
        operatingExpenseRatio: 0.30 // Perfect expense ratio
      });

      const bestDecision = await decisionEngine.generateInvestmentDecision(
        bestPropertyData,
        bestAnalysis,
        null,
        {},
        createUserContext({ experienceLevel: 'experienced' })
      );

      expect(bestDecision.confidence).toBeLessThanOrEqual(95);
    });

    test('should downgrade verdict when confidence < 40%', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 400000,
        monthlyRent: 1200, // Poor ratio
        daysOnMarket: 90
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 100, // Barely positive
        cashOnCashReturn: 0.03,
        capRate: 0.045,
        operatingExpenseRatio: 0.70 // Very high expenses
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext({ experienceLevel: 'novice' })
      );

      if (decision.confidence < 40) {
        // Should downgrade verdict one level
        expect(['PASS']).toContain(decision.verdict);
      }
    });
  });

  // ===== CATEGORY 11: EDGE CASES & ERROR HANDLING =====

  describe('Edge Cases & Error Handling', () => {
    test('should handle missing market data gracefully', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 300000,
        monthlyRent: 2400
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 600,
        capRate: 0.06
      });

      // No market intelligence provided
      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {}, // Empty market data
        createUserContext()
      );

      expect(decision).toBeDefined();
      expect(decision.verdict).toMatch(/^(BUY|NEGOTIATE|PASS)$/);
      expect(decision.confidence).toBeGreaterThanOrEqual(30);
    });

    test('should handle zero or negative values safely', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 0, // Edge case
        monthlyRent: 2000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 0,
        capRate: 0
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision.verdict).toBe('PASS');
      expect(decision.primaryReason).toContain('invalid');
    });

    test('should handle extremely high values', async () => {
      const propertyData = createPropertyData({
        purchasePrice: 50000000, // $50M property
        monthlyRent: 200000
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 150000,
        capRate: 0.04
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      expect(decision).toBeDefined();
      expect(decision.confidence).toBeLessThanOrEqual(95);
    });
  });

  // ===== PERFORMANCE & INTEGRATION TESTS =====

  describe('Performance & Integration', () => {
    test('should complete decision calculation in < 2 seconds', async () => {
      const startTime = Date.now();
      
      const propertyData = createPropertyData({
        purchasePrice: 350000,
        monthlyRent: 2800
      });

      const analysis = createAnalysis({
        monthlyNetCashFlow: 700,
        capRate: 0.08
      });

      const decision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        null,
        {},
        createUserContext()
      );

      const processingTime = Date.now() - startTime;
      
      expect(decision).toBeDefined();
      expect(processingTime).toBeLessThan(2000); // < 2 seconds
    });

    test('should handle concurrent decision calculations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const propertyData = createPropertyData({
          purchasePrice: 200000 + (i * 50000),
          monthlyRent: 2000 + (i * 200)
        });

        const analysis = createAnalysis({
          monthlyNetCashFlow: 500 + (i * 100),
          capRate: 0.06 + (i * 0.01)
        });

        return decisionEngine.generateInvestmentDecision(
          propertyData,
          analysis,
          null,
          {},
          createUserContext()
        );
      });

      const decisions = await Promise.all(promises);
      
      expect(decisions).toHaveLength(5);
      decisions.forEach(decision => {
        expect(decision.verdict).toMatch(/^(BUY|NEGOTIATE|PASS)$/);
        expect(decision.confidence).toBeGreaterThanOrEqual(30);
        expect(decision.confidence).toBeLessThanOrEqual(95);
      });
    });
  });
});

// ===== HELPER FUNCTIONS =====

function createPropertyData(overrides: Partial<SFRData> = {}): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 0.07,
    loanTerm: 30,
    propertyTaxRate: 0.012,
    insuranceRate: 0.004,
    maintenanceCost: 2000,
    propertyManagementRate: 0.08,
    monthlyRent: 2500,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2000,
    propertyAddress: {
      street: '123 Test St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 0.03,
      annualPropertyValueIncrease: 0.04,
      inflationRate: 0.025,
      vacancyRate: 0.05,
      sellingCostsPercentage: 0.08
    },
    ...overrides
  } as SFRData;
}

function createAnalysis(overrides: any = {}) {
  return {
    monthlyAnalysis: {
      cashFlow: overrides.monthlyNetCashFlow || 600,
      totalExpenses: 1900,
      netOperatingIncome: overrides.noi || (overrides.monthlyNetCashFlow + 1300) || 1900
    },
    keyMetrics: {
      capRate: overrides.capRate || 0.08,
      cashOnCashReturn: overrides.cashOnCashReturn || 0.12,
      operatingExpenseRatio: overrides.operatingExpenseRatio || 0.35,
      dscr: 1.35
    },
    totalInvestment: 62000,
    ...overrides
  };
}

function createUserContext(overrides: any = {}) {
  return {
    availableCash: 500000,
    experienceLevel: 'intermediate' as const,
    riskTolerance: 'moderate' as const,
    investmentGoals: 'balanced' as const,
    ...overrides
  };
}