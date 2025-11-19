/**
 * BaseDecisionEngine - Abstract base class for property-type-specific investment decision engines
 * Created: October 29, 2025 - Sprint 2, Story 2.1
 *
 * Purpose: Polymorphic inheritance pattern for supporting multiple property types (SFR, MF, Commercial)
 * - Provides common orchestration logic and weighted scoring calculation
 * - Defines abstract methods for property-type-specific logic
 * - Ensures type safety through generics
 * - Maintains backward compatibility with existing SFR analysis
 *
 * Architecture:
 * - BaseDecisionEngine<T> (abstract) → SFRDecisionEngine | MFDecisionEngine | CommercialDecisionEngine
 * - 90% common logic in base class (orchestration, verdict determination, scoring calculation)
 * - 10% property-specific logic in subclasses (scoring weights, walk-away price, risk factors)
 */

import { logger } from '../../utils/logger';
import { SFRData, MultiFamilyData, AnalysisResult, CommonMetrics } from '../../types/propertyTypes';
import { MarketDataResponse } from '../../types/marketData';

// ===== TYPE DEFINITIONS =====

export type InvestmentVerdict = 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION';

/**
 * Scoring weights interface - must sum to 1.0 (100%)
 */
export interface ScoringWeights {
  cashFlow: number;      // Weight for monthly cash flow stability
  irr: number;           // Weight for total return potential
  capRate: number;       // Weight for current yield vs market
  dscr: number;          // Weight for debt service coverage (MF emphasis)
  marketStrength: number; // Weight for market tier and trends
  exitStrategy: number;  // Weight for liquidity and exit options
  propertyRisk: number;  // Weight for property quality and age
}

/**
 * Property scores from individual scoring methods
 */
export interface PropertyScores {
  cashFlow: number;      // 0-100
  irr: number;           // 0-100
  capRate: number;       // 0-100
  dscr: number;          // 0-100
  marketStrength: number; // 0-100
  exitStrategy: number;  // 0-100
  propertyRisk: number;  // 0-100
}

/**
 * Professional assessment returned by the decision engine
 */
export interface ProfessionalAssessment {
  dealQuality: number; // 0-100 weighted score of deal fundamentals
  executionDifficulty: number; // 0-100 complexity of executing this investment
  dataReliability: number; // 0-100 confidence in input data quality

  // Factor breakdown (sum = 100%)
  cashFlowScore: number;
  irrScore: number;
  marketStrengthScore: number;
  debtStructureScore: number; // DSCR for MF
  exitStrategyScore: number;
  capRateScore: number;
  propertyRiskScore: number;

  // Professional recommendations
  primaryInsight: string;
  strategicRecommendations: string[];
  riskMitigation: string[];
  opportunityMaximization: string[];

  confidenceLevel: number; // 0-100 overall confidence
  keyStrengths: string[];
  keyRisks: string[];
}

/**
 * Market position analysis
 */
export interface MarketPosition {
  walkAwayPrice: number; // Property-type-specific calculation
  pricingContext: 'undervalued' | 'fair' | 'overvalued' | 'bubble';
  marketStage: 'early' | 'mid' | 'late' | 'correction';
  competitiveIntensity: 'low' | 'moderate' | 'high' | 'extreme';
}

/**
 * Investment decision returned by generateDecision()
 */
export interface InvestmentDecision {
  verdict: InvestmentVerdict;
  professionalAssessment: ProfessionalAssessment;
  marketPosition: MarketPosition;
  primaryReason: string;
  secondaryReasons: string[];
  keyRisks: string[];
  confidence: number; // 0-100 confidence in the verdict
  confidenceDescription: string;
}

// ===== ABSTRACT BASE CLASS =====

/**
 * BaseDecisionEngine<T extends CommonMetrics>
 *
 * Abstract base class providing common orchestration logic for investment decisions.
 * Subclasses must implement 4 property-type-specific abstract methods.
 *
 * Generic Type Parameter:
 * - T extends CommonMetrics: The metrics type for the specific property type
 *   (e.g., SFRMetrics, MultiFamilyMetrics)
 */
export abstract class BaseDecisionEngine<T extends CommonMetrics> {
  // Protected members accessible to subclasses
  protected analysis: AnalysisResult<T>;
  protected propertyData: SFRData | MultiFamilyData;
  protected marketData?: MarketDataResponse;

  // V3.0 Professional Calibration Constants
  protected readonly HURDLE_RATE = 0.055; // 5.5% minimum return requirement
  protected readonly TREASURY_RATE = 0.050; // 5.0% risk-free rate

  /**
   * Constructor validates scoring weights to ensure they sum to 1.0
   * This prevents subtle bugs where weights don't add up correctly
   */
  constructor(
    analysis: AnalysisResult<T>,
    propertyData: SFRData | MultiFamilyData,
    marketData?: MarketDataResponse
  ) {
    this.analysis = analysis;
    this.propertyData = propertyData;
    this.marketData = marketData;

    // CRITICAL: Validate scoring weights sum to 1.0 (with floating-point tolerance)
    this.validateScoringWeights();
  }

  // ===== ABSTRACT METHODS (MUST BE IMPLEMENTED BY SUBCLASSES) =====

  /**
   * Get property-type-specific scoring weights
   *
   * Examples:
   * - SFR: cashFlow 35%, IRR 25%, capRate 3%, DSCR 10%
   * - MF: cashFlow 20%, IRR 20%, capRate 25%, DSCR 20%
   *
   * @returns ScoringWeights object (must sum to 1.0)
   */
  protected abstract getScoringWeights(): ScoringWeights;

  /**
   * Calculate walk-away price (maximum acceptable purchase price)
   *
   * Property-type-specific formulas:
   * - SFR: Comparable sales - 10% discount
   * - MF: NOI / Target Cap Rate (professional commercial valuation)
   *
   * @returns Walk-away price in dollars
   */
  protected abstract calculateWalkAwayPrice(): number;

  /**
   * Score property-specific metrics
   *
   * Each subclass implements its own scoring logic based on:
   * - Cash flow stability
   * - IRR potential
   * - Cap rate competitiveness
   * - DSCR strength (especially for MF)
   * - Market strength
   * - Exit strategy
   * - Property risk factors
   *
   * @returns PropertyScores object with 0-100 scores for each factor
   */
  protected abstract scoreProperty(): PropertyScores;

  /**
   * Get property-type-specific risk factors
   *
   * Examples:
   * - SFR: Single tenant risk, property management burden
   * - MF: Unit mix concentration, tenant turnover, CapEx reserves
   *
   * @returns Array of risk factor descriptions
   */
  protected abstract getPropertyTypeSpecificRisks(): string[];

  // ===== COMMON ORCHESTRATION METHODS (SHARED ACROSS ALL PROPERTY TYPES) =====

  /**
   * Main entry point: Generate complete investment decision
   *
   * This method orchestrates the entire decision generation process:
   * 1. Score the property using property-type-specific logic
   * 2. Calculate weighted deal quality score
   * 3. Determine verdict based on deal quality thresholds
   * 4. Generate professional assessment with insights
   * 5. Calculate market position and walk-away price
   *
   * @returns Complete InvestmentDecision object
   */
  public generateDecision(): InvestmentDecision {
    logger.info('BaseDecisionEngine: Generating investment decision', {
      propertyType: this.propertyData.propertyType,
      purchasePrice: this.propertyData.purchasePrice
    });

    // Step 1: Get property-type-specific scores
    const scores = this.scoreProperty();

    // Step 2: Calculate weighted deal quality
    const professionalAssessment = this.calculateProfessionalAssessment(scores);

    // Step 3: Determine verdict based on deal quality thresholds
    const verdict = this.determineVerdict(professionalAssessment.dealQuality);

    // Step 4: Generate reasoning and insights
    const { primaryReason, secondaryReasons, keyRisks } = this.generateReasoningAndInsights(
      verdict,
      professionalAssessment,
      scores
    );

    // Step 5: Calculate market position
    const marketPosition = this.calculateMarketPosition();

    // Step 6: Calculate confidence
    const confidence = this.calculateConfidence(professionalAssessment, scores);
    const confidenceDescription = this.getConfidenceDescription(verdict, confidence);

    logger.info('BaseDecisionEngine: Decision generated', {
      verdict,
      dealQuality: professionalAssessment.dealQuality,
      confidence,
      walkAwayPrice: marketPosition.walkAwayPrice
    });

    return {
      verdict,
      professionalAssessment,
      marketPosition,
      primaryReason,
      secondaryReasons,
      keyRisks,
      confidence,
      confidenceDescription
    };
  }

  // ===== PROTECTED HELPER METHODS =====

  /**
   * Validate that scoring weights sum to 1.0 (with floating-point tolerance)
   * Throws error if weights are invalid
   */
  private validateScoringWeights(): void {
    const weights = this.getScoringWeights();
    const sum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);

    // Allow 0.0001 tolerance for floating-point precision errors
    const TOLERANCE = 0.0001;

    if (Math.abs(sum - 1.0) > TOLERANCE) {
      throw new Error(
        `Scoring weights must sum to 1.0 (got ${sum.toFixed(4)}). ` +
        `Weights: ${JSON.stringify(weights)}`
      );
    }

    logger.info('Scoring weights validated', {
      propertyType: this.propertyData.propertyType,
      weights,
      sum: sum.toFixed(4)
    });
  }

  /**
   * Calculate professional assessment with weighted deal quality score
   *
   * This is the core scoring algorithm that combines all factors using
   * property-type-specific weights to produce a 0-100 deal quality score
   */
  protected calculateProfessionalAssessment(scores: PropertyScores): ProfessionalAssessment {
    const weights = this.getScoringWeights();

    // Calculate weighted deal quality score (0-100)
    const dealQuality = Math.round(
      (scores.cashFlow * weights.cashFlow) +
      (scores.irr * weights.irr) +
      (scores.capRate * weights.capRate) +
      (scores.dscr * weights.dscr) +
      (scores.marketStrength * weights.marketStrength) +
      (scores.exitStrategy * weights.exitStrategy) +
      (scores.propertyRisk * weights.propertyRisk)
    );

    // Execution difficulty (simplified - can be enhanced by subclasses)
    const executionDifficulty = this.assessExecutionDifficulty();

    // Data reliability (simplified - can be enhanced by subclasses)
    const dataReliability = this.assessDataReliability();

    // Generate insights
    const keyStrengths = this.identifyKeyStrengths(scores);
    const keyRisks = this.identifyKeyRisks(scores);

    const primaryInsight = this.generatePrimaryInsight(dealQuality, scores);
    const strategicRecommendations = this.generateStrategicRecommendations(scores);
    const riskMitigation = this.generateRiskMitigation(scores);
    const opportunityMaximization = this.generateOpportunityMaximization(scores);

    return {
      dealQuality,
      executionDifficulty,
      dataReliability,
      cashFlowScore: scores.cashFlow,
      irrScore: scores.irr,
      marketStrengthScore: scores.marketStrength,
      debtStructureScore: scores.dscr,
      exitStrategyScore: scores.exitStrategy,
      capRateScore: scores.capRate,
      propertyRiskScore: scores.propertyRisk,
      primaryInsight,
      strategicRecommendations,
      riskMitigation,
      opportunityMaximization,
      confidenceLevel: this.calculateConfidence({ dealQuality } as ProfessionalAssessment, scores),
      keyStrengths,
      keyRisks
    };
  }

  /**
   * Determine verdict based on V3.0 deal quality thresholds
   *
   * Thresholds (2025 Professional Calibration):
   * - BUY: 80-100 (institutional-quality deal)
   * - NEGOTIATE: 65-79 (strong fundamentals, room for improvement)
   * - CAUTION: 50-64 (acceptable with optimization)
   * - PASS: 0-49 (below professional standards)
   *
   * CRITICAL DEAL KILLER OVERRIDES (Architect Fix - Business Expert Feedback):
   * These conditions override normal scoring to prevent fundamentally broken deals
   */
  protected determineVerdict(dealQuality: number): InvestmentVerdict {
    // ===== CRITICAL DEAL KILLER CHECKS (applies to both SFR and MF) =====
    const monthlyCashFlow = this.analysis.monthlyAnalysis?.cashFlow || 0;
    const dscr = this.analysis.metrics?.dscr || 0;
    // breakEvenOccupancy only exists on MultiFamilyMetrics, safe to access with type assertion
    const breakEvenOccupancy = (this.analysis.metrics as any)?.breakEvenOccupancy || 0;

    // Critical Failure 1: DSCR < 1.0 means property cannot cover debt service
    const criticalDSCRFailure = dscr < 1.0 && dscr > 0;

    // Critical Failure 2: Negative cash flow with no path to profitability
    const severeNegativeCashFlow = monthlyCashFlow < -1000;

    // Critical Failure 3: Break-even occupancy > 100% (mathematically impossible)
    const impossibleBreakEven = breakEvenOccupancy > 100;

    // Critical Failure 4: Combination of negative cash flow + low DSCR
    const combinedCriticalFailure = monthlyCashFlow < 0 && dscr < 1.25;

    // AUTO-PASS: If any critical deal killer exists, override score-based verdict
    if (criticalDSCRFailure || severeNegativeCashFlow || impossibleBreakEven || combinedCriticalFailure) {
      const failures = [];
      if (criticalDSCRFailure) failures.push(`DSCR ${dscr.toFixed(2)} < 1.0 (unlendable)`);
      if (severeNegativeCashFlow) failures.push(`severe negative cash flow ($${Math.abs(monthlyCashFlow).toFixed(0)}/mo)`);
      if (impossibleBreakEven) failures.push(`break-even occupancy ${breakEvenOccupancy.toFixed(0)}% (impossible)`);
      if (combinedCriticalFailure && !criticalDSCRFailure && !severeNegativeCashFlow) {
        failures.push(`negative cash flow + insufficient debt coverage`);
      }

      logger.info('🚨 CRITICAL DEAL KILLER AUTO-PASS TRIGGERED', {
        propertyType: this.propertyData.propertyType,
        dealQuality,
        originalVerdict: dealQuality >= 50 ? 'CAUTION' : 'PASS',
        overriddenTo: 'PASS',
        failures,
        monthlyCashFlow,
        dscr,
        breakEvenOccupancy
      });

      return 'PASS'; // Override any score-based verdict
    }

    // Normal score-based verdict (only if no critical failures)
    if (dealQuality >= 80) return 'BUY';
    if (dealQuality >= 65) return 'NEGOTIATE';
    if (dealQuality >= 50) return 'CAUTION';
    return 'PASS';
  }

  /**
   * Calculate market position and walk-away price
   */
  protected calculateMarketPosition(): MarketPosition {
    const walkAwayPrice = this.calculateWalkAwayPrice();

    // Simple pricing context based on purchase price vs walk-away
    const priceRatio = this.propertyData.purchasePrice / walkAwayPrice;
    let pricingContext: MarketPosition['pricingContext'];

    if (priceRatio <= 0.90) pricingContext = 'undervalued';
    else if (priceRatio <= 1.05) pricingContext = 'fair';
    else if (priceRatio <= 1.15) pricingContext = 'overvalued';
    else pricingContext = 'bubble';

    return {
      walkAwayPrice,
      pricingContext,
      marketStage: 'mid', // Simplified - can be enhanced with market data
      competitiveIntensity: 'moderate' // Simplified - can be enhanced with market data
    };
  }

  /**
   * Generate primary reason, secondary reasons, and key risks
   */
  protected generateReasoningAndInsights(
    verdict: InvestmentVerdict,
    assessment: ProfessionalAssessment,
    scores: PropertyScores
  ): { primaryReason: string; secondaryReasons: string[]; keyRisks: string[] } {
    let primaryReason: string;

    // Generate verdict-specific primary reason
    switch (verdict) {
      case 'BUY':
        primaryReason = `Institutional-quality deal with ${assessment.dealQuality}/100 professional score`;
        break;
      case 'NEGOTIATE':
        primaryReason = `Strong fundamentals (${assessment.dealQuality}/100) - negotiate for optimal terms`;
        break;
      case 'CAUTION':
        primaryReason = `Acceptable deal (${assessment.dealQuality}/100) requiring optimization`;
        break;
      case 'PASS':
        primaryReason = `Below professional standards (${assessment.dealQuality}/100) - seek better opportunities`;
        break;
    }

    // Secondary reasons from top scoring factors
    const secondaryReasons: string[] = [];
    if (scores.cashFlow >= 70) secondaryReasons.push(`Strong cash flow score: ${scores.cashFlow}/100`);
    if (scores.irr >= 70) secondaryReasons.push(`Solid IRR potential: ${scores.irr}/100`);
    if (scores.capRate >= 70) secondaryReasons.push(`Competitive cap rate: ${scores.capRate}/100`);
    if (scores.dscr >= 70) secondaryReasons.push(`Healthy debt coverage: ${scores.dscr}/100`);

    // Key risks from property-type-specific method + low scores
    const keyRisks = [...this.getPropertyTypeSpecificRisks()];
    if (scores.cashFlow < 50) keyRisks.push('Weak cash flow generation');
    if (scores.dscr < 50) keyRisks.push('Insufficient debt service coverage');
    if (scores.propertyRisk < 50) keyRisks.push('Property quality concerns');

    return { primaryReason, secondaryReasons, keyRisks };
  }

  /**
   * Calculate overall confidence in the decision
   */
  protected calculateConfidence(assessment: ProfessionalAssessment, scores: PropertyScores): number {
    // Base confidence from data reliability
    let confidence = assessment.dataReliability || 70;

    // Adjust based on score consistency
    const scoresArray = Object.values(scores);
    const avgScore = scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length;
    const variance = scoresArray.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scoresArray.length;
    const stdDev = Math.sqrt(variance);

    // Lower confidence if scores are highly variable (indicates mixed signals)
    if (stdDev > 25) confidence -= 10;
    else if (stdDev > 15) confidence -= 5;

    return Math.max(30, Math.min(95, confidence));
  }

  /**
   * Get human-readable confidence description
   */
  protected getConfidenceDescription(verdict: InvestmentVerdict, confidence: number): string {
    if (verdict === 'BUY') {
      if (confidence >= 80) return 'High certainty this is a good investment';
      if (confidence >= 65) return 'Good opportunity with standard due diligence';
      return 'Positive but requires careful review';
    }

    if (verdict === 'NEGOTIATE') {
      if (confidence >= 70) return 'Specific adjustments needed for viability';
      if (confidence >= 50) return 'Multiple factors require adjustment';
      return 'Major adjustments required to make this work';
    }

    if (verdict === 'CAUTION') {
      if (confidence >= 70) return 'Acceptable deal requiring strategic optimization';
      if (confidence >= 50) return 'Consider with specific investment strategy alignment';
      return 'Marginal deal - evaluate alternatives first';
    }

    // PASS verdict
    if (confidence >= 80) return 'Strong indicators against this investment';
    if (confidence >= 65) return 'Multiple concerns outweigh benefits';
    return 'Significant risk factors suggest avoiding this investment';
  }

  // ===== SIMPLIFIED HELPER METHODS (CAN BE OVERRIDDEN BY SUBCLASSES) =====

  protected assessExecutionDifficulty(): number {
    // Simplified - subclasses can provide more sophisticated logic
    return 50;
  }

  protected assessDataReliability(): number {
    // Simplified - subclasses can provide more sophisticated logic
    return 70;
  }

  protected identifyKeyStrengths(scores: PropertyScores): string[] {
    const strengths: string[] = [];
    if (scores.cashFlow >= 80) strengths.push('Exceptional cash flow generation');
    if (scores.irr >= 80) strengths.push('Outstanding return potential');
    if (scores.dscr >= 80) strengths.push('Excellent debt service coverage');
    if (scores.capRate >= 80) strengths.push('Superior cap rate vs market');
    return strengths;
  }

  protected identifyKeyRisks(scores: PropertyScores): string[] {
    const risks: string[] = [];
    if (scores.cashFlow < 40) risks.push('Weak cash flow threatens financial stability');
    if (scores.dscr < 40) risks.push('Poor debt coverage increases default risk');
    if (scores.propertyRisk < 40) risks.push('Significant property quality concerns');
    return risks;
  }

  protected generatePrimaryInsight(dealQuality: number, scores: PropertyScores): string {
    if (dealQuality >= 80) {
      return 'This is an institutional-quality investment opportunity with strong fundamentals across all key metrics';
    } else if (dealQuality >= 65) {
      return 'Solid investment opportunity that could be optimized through strategic negotiation';
    } else if (dealQuality >= 50) {
      return 'Acceptable deal that requires careful evaluation and potential improvements';
    } else {
      return 'Property does not meet professional investment standards';
    }
  }

  protected generateStrategicRecommendations(scores: PropertyScores): string[] {
    const recommendations: string[] = [];
    if (scores.cashFlow < 60) recommendations.push('Focus on improving cash flow through rent optimization or expense reduction');
    if (scores.dscr < 60) recommendations.push('Negotiate better financing terms to improve debt coverage');
    if (scores.capRate < 60) recommendations.push('Target price reduction to achieve market-competitive cap rate');
    return recommendations;
  }

  protected generateRiskMitigation(scores: PropertyScores): string[] {
    const mitigation: string[] = [];
    if (scores.cashFlow < 50) mitigation.push('Build larger cash reserves for negative cash flow periods');
    if (scores.dscr < 50) mitigation.push('Consider larger down payment to reduce debt service burden');
    if (scores.propertyRisk < 50) mitigation.push('Budget for immediate capital improvements and deferred maintenance');
    return mitigation;
  }

  protected generateOpportunityMaximization(scores: PropertyScores): string[] {
    const opportunities: string[] = [];
    if (scores.cashFlow >= 70) opportunities.push('Leverage strong cash flow for additional property acquisitions');
    if (scores.irr >= 70) opportunities.push('Consider accelerated equity buildup through extra principal payments');
    if (scores.marketStrength >= 70) opportunities.push('Position for value appreciation in strong market');
    return opportunities;
  }
}
