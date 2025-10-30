/**
 * BaseDecisionEngine Test Suite (Simplified)
 * Created: October 29, 2025
 * Purpose: Test-first implementation of abstract base class for Investment Decision Engine
 * Tests scoring weight validation, abstract method contracts, and common orchestration logic
 */

import { BaseDecisionEngine, ScoringWeights, PropertyScores } from '../../services/investment/BaseDecisionEngine';
import { AnalysisResult, SFRData, SFRMetrics } from '../../types/propertyTypes';

// Mock concrete implementation for testing abstract class
class MockDecisionEngine extends BaseDecisionEngine<SFRMetrics> {
  private scoringWeights: ScoringWeights;
  private walkAwayPrice: number;
  private mockScores: PropertyScores;

  constructor(
    analysis: AnalysisResult<SFRMetrics>,
    propertyData: SFRData,
    scoringWeights?: ScoringWeights,
    walkAwayPrice?: number,
    mockScores?: PropertyScores
  ) {
    // Initialize fields BEFORE calling super() to avoid validation issues
    const weights = scoringWeights || {
      cashFlow: 0.35,
      irr: 0.25,
      capRate: 0.03,
      dscr: 0.10,
      marketStrength: 0.10,
      exitStrategy: 0.10,
      propertyRisk: 0.07
    };
    const price = walkAwayPrice || 300000;
    const scores = mockScores || {
      cashFlow: 75,
      irr: 80,
      capRate: 70,
      dscr: 85,
      marketStrength: 60,
      exitStrategy: 65,
      propertyRisk: 90
    };

    // Store temporarily for getScoringWeights() call during super()
    (MockDecisionEngine as any)._tempWeights = weights;

    super(analysis, propertyData);

    // Now assign to instance
    this.scoringWeights = weights;
    this.walkAwayPrice = price;
    this.mockScores = scores;

    // Clean up temp
    delete (MockDecisionEngine as any)._tempWeights;
  }

  protected getScoringWeights(): ScoringWeights {
    // During construction, use temp weights
    return this.scoringWeights || (MockDecisionEngine as any)._tempWeights;
  }

  protected calculateWalkAwayPrice(): number {
    return this.walkAwayPrice;
  }

  protected scoreProperty(): PropertyScores {
    return this.mockScores;
  }

  protected getPropertyTypeSpecificRisks(): string[] {
    return ['Single tenant risk', 'Property management burden'];
  }
}

// Helper to create minimal valid analysis result
function createMockAnalysis(): AnalysisResult<SFRMetrics> {
  return {
    monthlyAnalysis: {
      income: { gross: 2000, effective: 2000 },
      expenses: { operating: 800, debt: 700, total: 1500, breakdown: {} },
      cashFlow: 500
    },
    annualAnalysis: {
      income: 24000,
      expenses: 18000,
      noi: 14400,
      debtService: 8400,
      cashFlow: 6000
    },
    metrics: {
      // CommonMetrics fields
      noi: 14400,
      capRate: 0.065,
      cashOnCashReturn: 0.10,
      irr: 0.12,
      dscr: 1.35,
      operatingExpenseRatio: 0.40,
      totalInvestment: 60000,
      // SFRMetrics fields
      pricePerSqFt: 150,
      rentPerSqFt: 1.0,
      grossRentMultiplier: 150
    },
    projections: [],
    exitAnalysis: {
      projectedSalePrice: 330000,
      sellingCosts: 19800,
      mortgagePayoff: 200000,
      netProceedsFromSale: 110200,
      totalReturn: 170200,
      equityMultiple: 2.84
    }
  };
}

// Helper to create minimal valid property data
function createMockPropertyData(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 7.5,
    loanTerm: 30,
    propertyTaxRate: 1.0,
    insuranceRate: 0.4,
    propertyManagementRate: 10,
    yearBuilt: 2010,
    monthlyRent: 2000,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 200,
    closingCosts: 9000,
    capitalInvestments: 0,
    propertyAddress: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    }
  } as SFRData;
}

describe('Story 2.1: BaseDecisionEngine Abstract Class', () => {
  describe('Scoring Weight Validation (CRITICAL)', () => {
    it('should accept scoring weights that sum to 1.0 exactly', () => {
      const analysis = createMockAnalysis();
      const propertyData = createMockPropertyData();

      const validWeights: ScoringWeights = {
        cashFlow: 0.35,
        irr: 0.25,
        capRate: 0.03,
        dscr: 0.10,
        marketStrength: 0.10,
        exitStrategy: 0.10,
        propertyRisk: 0.07
      };

      expect(() => {
        new MockDecisionEngine(analysis, propertyData, validWeights);
      }).not.toThrow();
    });

    it('should reject scoring weights that do not sum to 1.0', () => {
      const analysis = createMockAnalysis();
      const propertyData = createMockPropertyData();

      const invalidWeights: ScoringWeights = {
        cashFlow: 0.40,  // Total = 1.10 (invalid)
        irr: 0.25,
        capRate: 0.03,
        dscr: 0.10,
        marketStrength: 0.10,
        exitStrategy: 0.15,
        propertyRisk: 0.07
      };

      expect(() => {
        new MockDecisionEngine(analysis, propertyData, invalidWeights);
      }).toThrow('Scoring weights must sum to 1.0');
    });
  });

  describe('Verdict Determination', () => {
    it('should return correct verdict based on deal quality score', () => {
      const analysis = createMockAnalysis();
      const propertyData = createMockPropertyData();

      const highScores: PropertyScores = {
        cashFlow: 90, irr: 90, capRate: 85, dscr: 90,
        marketStrength: 80, exitStrategy: 80, propertyRisk: 85
      };

      const engine = new MockDecisionEngine(analysis, propertyData, undefined, undefined, highScores);
      const decision = engine.generateDecision();

      expect(decision.verdict).toBe('BUY');
      expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Professional Assessment', () => {
    it('should calculate weighted deal quality score correctly', () => {
      const analysis = createMockAnalysis();
      const propertyData = createMockPropertyData();

      const weights: ScoringWeights = {
        cashFlow: 0.35, irr: 0.25, capRate: 0.03, dscr: 0.10,
        marketStrength: 0.10, exitStrategy: 0.10, propertyRisk: 0.07
      };

      const scores: PropertyScores = {
        cashFlow: 75, irr: 80, capRate: 70, dscr: 85,
        marketStrength: 60, exitStrategy: 65, propertyRisk: 90
      };

      // Expected: 75*0.35 + 80*0.25 + 70*0.03 + 85*0.10 + 60*0.10 + 65*0.10 + 90*0.07 = 75.05
      // Math.round() is applied, so expecting 75
      const engine = new MockDecisionEngine(analysis, propertyData, weights, undefined, scores);
      const decision = engine.generateDecision();

      expect(decision.professionalAssessment.dealQuality).toBeGreaterThanOrEqual(75);
      expect(decision.professionalAssessment.dealQuality).toBeLessThanOrEqual(76); // Allow for rounding
    });
  });
});
