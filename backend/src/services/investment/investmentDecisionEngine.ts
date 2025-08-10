/**
 * Investment Decision Engine - Professional investment verdict generation
 * 
 * Synthesizes all analysis (leverage, market, predictions, AI) into clear professional advice:
 * - BUY / PASS / NEGOTIATE / HOLD / REFINANCE verdicts
 * - Specific action plans with priorities
 * - Capital deployment strategy
 * - Risk assessment and mitigation
 */

import { logger } from '../../utils/logger';
import { SFRData } from '../../types/propertyTypes';
import { LeverageOptimizer, LeverageAnalysis } from './leverageOptimizer';
import { MarketDataResponse } from '../../types/marketData';

export type InvestmentVerdict = 'BUY' | 'PASS' | 'NEGOTIATE';

export interface InvestmentDecision {
  verdict: InvestmentVerdict;
  confidence: number; // 0-100 confidence in the verdict decision
  score: number; // 0-100 property quality score
  primaryReason: string;
  secondaryReasons: string[];
  keyRisks: string[];
  actionPlan: ActionItem[];
  capitalStrategy: CapitalDeploymentAdvice;
  alternativeOptions: AlternativeInvestment[];
  marketContext: MarketContextAnalysis;
  timeline: InvestmentTimeline;
  goalContext?: GoalContext; // NEW: Goal context for frontend personalization
}

export interface GoalContext {
  exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility?: 'flexible' | 'somewhat' | 'constrained' | 'independent';
  riskApproach?: 'conservative' | 'balanced' | 'aggressive' | 'opportunistic';
  capitalDeployment?: 'reinvest_re' | 'diversify' | 'lifestyle' | 'business' | 'debt';
  projectionYears?: number;
}

export interface ActionItem {
  action: string;
  priority: 'immediate' | 'short-term' | 'long-term';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  timeframe: string;
}

export interface CapitalDeploymentAdvice {
  currentApproach: {
    description: string;
    cashRequired: number;
    expectedReturn: number;
    efficiency: 'poor' | 'fair' | 'good' | 'excellent';
  };
  recommendedApproach: {
    description: string;
    cashRequired: number;
    expectedReturn: number;
    efficiency: 'poor' | 'fair' | 'good' | 'excellent';
  };
  opportunityCost: {
    annualCost: number;
    description: string;
    alternativeUse: string;
  };
  portfolioStrategy: string;
}

export interface AlternativeInvestment {
  type: 'better_deal' | 'market_timing' | 'different_strategy' | 'diversification';
  title: string;
  description: string;
  expectedReturn: string;
  riskLevel: 'lower' | 'similar' | 'higher';
  timeframe: string;
}

export interface MarketContextAnalysis {
  marketStage: 'early' | 'mid' | 'late' | 'correction';
  pricingContext: 'undervalued' | 'fair' | 'overvalued' | 'bubble';
  competitiveIntensity: 'low' | 'moderate' | 'high' | 'extreme';
  recommendedStrategy: string;
}

export interface InvestmentTimeline {
  immediateActions: string[]; // Next 30 days
  shortTermActions: string[]; // 30-90 days  
  longTermStrategy: string[]; // 90+ days
}

export class InvestmentDecisionEngine {
  private leverageOptimizer: LeverageOptimizer;
  private readonly HURDLE_RATE = 0.065; // 6.5% minimum return requirement (will be adjusted by exit strategy)
  private readonly TREASURY_RATE = 0.045; // 4.5% risk-free rate
  private readonly MIN_RENT_TO_PRICE_RATIO = 0.004; // 0.4% minimum (PASS threshold)
  private readonly LOW_RENT_TO_PRICE_RATIO = 0.005; // 0.5% risk flag threshold
  private readonly HIGH_CAP_RATE_MULTIPLIER = 1.5; // "Too good to be true" threshold

  constructor() {
    this.leverageOptimizer = new LeverageOptimizer();
  }

  /**
   * Calculate market-relative cap rate threshold
   */
  private getMarketRelativeCapRateThreshold(marketIntelligence: any, propertyData: SFRData): {
    marketMedianCapRate: number;
    passThreshold: number;
    negotiateThreshold: number;
    buyThreshold: number;
  } {
    let marketMedianCapRate = 0.06; // Default 6%
    
    // Try to calculate from market intelligence
    if (marketIntelligence?.marketTrends?.averageRent && marketIntelligence?.economicIndicators?.medianHomePrice) {
      const avgRent = marketIntelligence.marketTrends.averageRent;
      const medianPrice = marketIntelligence.economicIndicators.medianHomePrice;
      marketMedianCapRate = (avgRent * 12) / medianPrice;
      
      // Cap between 3-10% for sanity
      marketMedianCapRate = Math.min(0.10, Math.max(0.03, marketMedianCapRate));
    }
    
    return {
      marketMedianCapRate,
      passThreshold: marketMedianCapRate - 0.015, // 1.5% below market
      negotiateThreshold: marketMedianCapRate - 0.005, // 0.5% below market  
      buyThreshold: marketMedianCapRate // At or above market
    };
  }

  /**
   * Calculate walk away price - maximum acceptable purchase price
   */
  private calculateWalkAwayPrice(propertyData: SFRData, analysis: any): number {
    const noi = analysis.keyMetrics?.noi || (propertyData.monthlyRent * 12 * 0.6); // Fallback NOI estimate
    const monthlyRent = propertyData.monthlyRent || 0;
    
    // Three price ceilings
    const treasuryBasedPrice = noi / (this.TREASURY_RATE + 0.03); // 300bps spread
    const onePercentRuleCeiling = monthlyRent * 100; // 1% rule
    const comparablesCeiling = propertyData.purchasePrice * 0.95; // 5% below asking (rough)
    
    // Take the minimum (most conservative)
    return Math.min(treasuryBasedPrice, onePercentRuleCeiling, comparablesCeiling);
  }

  /**
   * Check rent-to-price ratio flags
   */
  private assessRentToPriceRatio(monthlyRent: number, purchasePrice: number): {
    ratio: number;
    isAutoPass: boolean;
    isRiskFlag: boolean;
    isVerificationFlag: boolean;
  } {
    const ratio = monthlyRent / purchasePrice;
    
    return {
      ratio,
      isAutoPass: ratio < this.MIN_RENT_TO_PRICE_RATIO, // <0.4%
      isRiskFlag: ratio < this.LOW_RENT_TO_PRICE_RATIO, // <0.5%  
      isVerificationFlag: ratio > 0.012 // >1.2%
    };
  }

  /**
   * Check for "too good to be true" scenarios
   */
  private checkTooGoodToBeTrueFlags(
    capRate: number, 
    marketMedianCapRate: number,
    daysOnMarket: number = 30 // Default assumption
  ): {
    isSuspicious: boolean;
    confidencePenalty: number;
    warningMessage: string;
  } {
    const isSuspicious = capRate > (marketMedianCapRate * this.HIGH_CAP_RATE_MULTIPLIER) && daysOnMarket > 30;
    
    return {
      isSuspicious,
      confidencePenalty: isSuspicious ? 30 : 0,
      warningMessage: isSuspicious 
        ? `Unusually high ${(capRate * 100).toFixed(1)}% cap rate vs ${(marketMedianCapRate * 100).toFixed(1)}% market median - verify all assumptions`
        : ''
    };
  }

  /**
   * Calculate minimum cash flow buffer requirements
   */
  private calculateMinimumCashFlowBuffer(analysis: any, propertyData: SFRData): {
    minimumBuffer: number;
    bufferPercentage: number;
    isInsufficient: boolean;
    isCritical: boolean;
  } {
    const mortgagePayment = analysis.monthlyAnalysis?.debtService || (propertyData.purchasePrice * 0.8 * 0.07 / 12); // Rough estimate
    const bufferFromMortgage = mortgagePayment * 0.2; // 20% of mortgage payment
    const absoluteMinimum = 300;
    
    const minimumBuffer = Math.max(bufferFromMortgage, absoluteMinimum);
    const actualCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    const bufferPercentage = actualCashFlow / minimumBuffer;
    
    return {
      minimumBuffer,
      bufferPercentage,
      isInsufficient: bufferPercentage < 1.0, // Below 100% of requirement
      isCritical: bufferPercentage < 0.5 // Below 50% of requirement
    };
  }

  /**
   * Get adjusted hurdle rate based on exit strategy
   */
  private getAdjustedHurdleRate(exitStrategy?: any): number {
    if (!exitStrategy) return this.HURDLE_RATE;
    
    switch (exitStrategy.primaryExitStrategy) {
      case '1031exchange':
        return 0.055; // 5.5% for 1031 exchanges (tax benefits)
      case 'estate':
        return this.HURDLE_RATE; // Standard rate but require positive cash flow
      case 'sale':
        if (exitStrategy.timeframe && exitStrategy.timeframe <= 2) {
          return 0.12; // 12% for quick flips
        }
        return this.HURDLE_RATE;
      case 'refinance':
        return this.HURDLE_RATE - 0.005; // Slightly lower for cash-out refinance strategy
      default:
        return this.HURDLE_RATE;
    }
  }

  /**
   * Generate comprehensive investment decision
   */
  async generateInvestmentDecision(
    propertyData: SFRData,
    analysis: any,
    predictions: any,
    marketIntelligence: any,
    userContext: {
      availableCash: number;
      experienceLevel: 'novice' | 'intermediate' | 'experienced';
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      investmentGoals: 'cash_flow' | 'appreciation' | 'balanced';
    },
    enhancedGoals?: any // Enhanced goals from Step 5 for personalized messaging
  ): Promise<InvestmentDecision> {
    const startTime = Date.now();
    logger.info('Investment Decision Engine: Starting analysis', {
      propertyPrice: propertyData.purchasePrice,
      userCash: userContext.availableCash,
      experience: userContext.experienceLevel,
      exitStrategy: propertyData.exitStrategy?.primaryExitStrategy || 'not_specified',
      holdPeriod: propertyData.longTermAssumptions?.projectionYears || 10,
      portfolioStrategy: propertyData.exitStrategy?.portfolioStrategy || 'not_specified'
    });

    try {
      // 1. Analyze leverage optimization
      const leverageAnalysis = await this.leverageOptimizer.analyzeOptimalLeverage(
        propertyData, 
        analysis, 
        userContext.availableCash
      );

      // 2. Assess property fundamentals
      const fundamentals = this.assessPropertyFundamentals(analysis, propertyData);

      // 3. Analyze market context
      const marketContext = await this.analyzeMarketContext(
        analysis, 
        marketIntelligence, 
        predictions,
        propertyData
      );

      // 4. Generate verdict based on all factors
      const verdict = await this.generateVerdict(
        fundamentals,
        leverageAnalysis,
        marketContext,
        userContext,
        propertyData,
        analysis,
        marketIntelligence
      );

      // 5. Create action plan
      const actionPlan = this.createActionPlan(
        verdict,
        leverageAnalysis,
        fundamentals,
        userContext
      );

      // 6. Develop capital strategy
      const capitalStrategy = this.developCapitalStrategy(
        leverageAnalysis,
        userContext,
        propertyData.purchasePrice
      );

      // 7. Identify alternatives
      const alternativeOptions = this.identifyAlternatives(
        verdict,
        fundamentals,
        marketContext,
        userContext
      );

      // 8. Create timeline
      const timeline = this.createInvestmentTimeline(verdict, actionPlan);

      // 9. Extract goal context for frontend personalization - prioritize enhanced goals
      const goalContext: GoalContext = {
        exitStrategy: enhancedGoals?.exitStrategy || propertyData.exitStrategy?.primaryExitStrategy,
        portfolioStrategy: enhancedGoals?.portfolioStrategy || propertyData.exitStrategy?.portfolioStrategy,
        marketTimingFlexibility: propertyData.exitStrategy?.marketTimingFlexibility,
        riskApproach: propertyData.exitStrategy?.riskApproach,
        capitalDeployment: propertyData.exitStrategy?.capitalDeployment,
        projectionYears: propertyData.longTermAssumptions?.projectionYears
      };

      // Log enhanced goals integration
      logger.info('Investment Decision Engine: Enhanced goals integrated', {
        hasEnhancedGoals: !!enhancedGoals,
        exitStrategy: goalContext.exitStrategy,
        portfolioStrategy: goalContext.portfolioStrategy,
        enhancedExitStrategy: enhancedGoals?.exitStrategy,
        enhancedPortfolioStrategy: enhancedGoals?.portfolioStrategy
      });

      const decision: InvestmentDecision = {
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        score: verdict.score, // Property quality score
        primaryReason: verdict.primaryReason,
        secondaryReasons: verdict.secondaryReasons,
        keyRisks: verdict.keyRisks,
        actionPlan,
        capitalStrategy,
        alternativeOptions,
        marketContext,
        timeline,
        goalContext // NEW: Include goal context for frontend
      };

      const processingTime = Date.now() - startTime;
      logger.info('Investment Decision Engine: Decision generated', {
        processingTime: `${processingTime}ms`,
        verdict: decision.verdict,
        confidence: `${decision.confidence}%`,
        primaryReason: decision.primaryReason
      });

      return decision;

    } catch (error) {
      logger.error('Investment Decision Engine: Failed to generate decision', error);
      throw new Error('Failed to generate investment decision');
    }
  }

  /**
   * Assess property fundamentals
   */
  private assessPropertyFundamentals(analysis: any, propertyData: SFRData) {
    const metrics = analysis.keyMetrics || {};
    const monthlyAnalysis = analysis.monthlyAnalysis || {};

    // Extract all the metrics we already calculate
    const fundamentals = {
      // Core metrics from existing analysis
      capRate: metrics.capRate || 0,
      cashFlow: monthlyAnalysis.cashFlow || 0,
      cashOnCashReturn: metrics.cashOnCashReturn || 0,
      dscr: metrics.dscr || 0,
      totalROI: metrics.totalROI || 0,
      irr: metrics.irr || 0,
      operatingExpenseRatio: metrics.operatingExpenseRatio || 0,
      rentToValue: metrics.rentToValue || 0,
      
      // RE Analyst recommended metrics (already calculated!)
      onePercentRuleValue: metrics.onePercentRuleValue || 0,
      fiftyRuleAnalysis: metrics.fiftyRuleAnalysis || false,
      rentToPriceRatio: metrics.rentToPriceRatio || 0,
      
      // Additional useful metrics
      grossYield: metrics.grossYield || 0,
      debtYield: metrics.debtYield || 0,
      equityMultiple: metrics.equityMultiple || 0,
      
      // Derived assessments
      cashFlowQuality: this.assessCashFlowQuality(monthlyAnalysis.cashFlow || 0),
      returnQuality: this.assessReturnQuality(metrics.cashOnCashReturn || 0, metrics.irr || 0),
      riskLevel: this.assessRiskLevel(metrics, monthlyAnalysis),
      
      // Property specifics
      purchasePrice: propertyData.purchasePrice,
      monthlyRent: propertyData.monthlyRent,
      yearBuilt: propertyData.yearBuilt || new Date().getFullYear(),
      propertyType: propertyData.propertyType,
      propertyAddress: propertyData.propertyAddress,
      
      // RE Analyst validations
      expenseRatioValidation: this.validateExpenseRatio(metrics.operatingExpenseRatio || 0),
      onePercentRulePass: (metrics.onePercentRuleValue || 0) >= 0.7, // 0.7% is acceptable in hot markets
      propertyAgeRisk: this.assessPropertyAgeRisk(propertyData.yearBuilt || new Date().getFullYear())
    };

    return fundamentals;
  }

  /**
   * Validate expense ratio (RE Analyst recommendation)
   */
  private validateExpenseRatio(ratio: number): { valid: boolean; concern?: string } {
    if (ratio < 0.25) {
      return { 
        valid: false, 
        concern: 'Suspiciously low expenses - verify all costs included' 
      };
    }
    if (ratio > 0.50) {
      return { 
        valid: false, 
        concern: 'High expense ratio indicates operational inefficiency' 
      };
    }
    return { valid: true };
  }

  /**
   * Assess property age risk (RE Analyst recommendation)
   */
  private assessPropertyAgeRisk(yearBuilt: number): 'low' | 'moderate' | 'high' {
    const age = new Date().getFullYear() - yearBuilt;
    if (age <= 10) return 'low';
    if (age <= 30) return 'moderate';
    return 'high'; // Over 30 years = higher maintenance risk
  }

  /**
   * Calculate target cap rate from market intelligence data
   */
  private calculateTargetCapRate(marketIntelligence: any, propertyData: SFRData): number {
    // If we have market intelligence data, calculate from market trends
    if (marketIntelligence?.marketTrends?.averageRent && marketIntelligence?.economicIndicators?.medianHomePrice) {
      const avgRent = marketIntelligence.marketTrends.averageRent;
      const medianPrice = marketIntelligence.economicIndicators.medianHomePrice;
      const marketCapRate = (avgRent * 12) / medianPrice;
      
      // Add 10% premium for target (investor should beat market average)
      return Math.min(0.12, Math.max(0.04, marketCapRate * 1.1)); // Cap between 4-12%
    }
    
    // Fallback: Location-based estimates
    const city = propertyData.propertyAddress?.city?.toLowerCase() || '';
    const state = propertyData.propertyAddress?.state || '';
    
    // Basic location adjustments
    if (city.includes('austin') || city.includes('dallas') || city.includes('houston')) {
      return 0.05; // Major Texas metros - hot markets
    } else if (state === 'TX') {
      return 0.06; // Other Texas markets
    }
    
    return 0.06; // Default 6% target
  }

  private assessCashFlowQuality(cashFlow: number): 'excellent' | 'good' | 'moderate' | 'weak' | 'negative' {
    if (cashFlow >= 800) return 'excellent';
    if (cashFlow >= 400) return 'good'; 
    if (cashFlow >= 100) return 'moderate';
    if (cashFlow >= 0) return 'weak';
    return 'negative';
  }

  private assessReturnQuality(coc: number, irr: number): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgReturn = (coc + irr) / 2;
    if (avgReturn >= this.HURDLE_RATE + 0.04) return 'excellent'; // >10.5%
    if (avgReturn >= this.HURDLE_RATE + 0.02) return 'good'; // >8.5%
    if (avgReturn >= this.HURDLE_RATE) return 'fair'; // >6.5%
    return 'poor';
  }

  private assessRiskLevel(metrics: any, monthlyAnalysis: any): 'low' | 'moderate' | 'high' | 'very_high' {
    let riskScore = 0;
    
    // Cash flow risk
    const cashFlow = monthlyAnalysis.cashFlow || 0;
    if (cashFlow < 0) riskScore += 3;
    else if (cashFlow < 200) riskScore += 2;
    else if (cashFlow < 500) riskScore += 1;
    
    // DSCR risk
    const dscr = metrics.dscr || 0;
    if (dscr < 1.0) riskScore += 3;
    else if (dscr < 1.25) riskScore += 2;
    else if (dscr < 1.5) riskScore += 1;
    
    // Cap rate risk (market context dependent)
    const capRate = metrics.capRate || 0;
    if (capRate < 0.03) riskScore += 2; // Very low cap rates indicate speculation
    else if (capRate < 0.04) riskScore += 1;
    
    if (riskScore >= 6) return 'very_high';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }

  /**
   * Analyze market context
   */
  private async analyzeMarketContext(
    analysis: any, 
    marketIntelligence: any, 
    predictions: any,
    propertyData: SFRData
  ): Promise<MarketContextAnalysis> {
    const capRate = analysis.keyMetrics?.capRate || 0;
    const marketData = marketIntelligence?.marketData;
    
    // Calculate market-specific thresholds from existing Market Intelligence data  
    const targetCapRate = this.calculateTargetCapRate(marketIntelligence, propertyData);
    const minAcceptableCapRate = targetCapRate * 0.8; // 80% of target is minimum acceptable
    
    // Determine market stage (simplified - would use more data in production)
    let marketStage: MarketContextAnalysis['marketStage'] = 'mid';
    if (predictions?.marketTiming?.confidence > 75) {
      const timing = predictions.marketTiming.recommendation;
      if (timing?.includes('Wait')) marketStage = 'late';
      else if (timing?.includes('Buy now')) marketStage = 'early';
    }

    // Determine pricing context using market-specific thresholds
    let pricingContext: MarketContextAnalysis['pricingContext'] = 'fair';
    if (capRate < minAcceptableCapRate) {
      pricingContext = 'overvalued';
    } else if (capRate < targetCapRate * 0.9) { // Within 10% of target
      pricingContext = 'fair';
    } else if (capRate > targetCapRate * 1.2) { // 20% above target
      pricingContext = 'undervalued';
    } else {
      pricingContext = 'fair';
    }

    // Determine competitive intensity based on cap rate vs target
    let competitiveIntensity: MarketContextAnalysis['competitiveIntensity'] = 'moderate';
    if (capRate < targetCapRate * 0.8) {
      competitiveIntensity = 'high'; // Very competitive market
    } else if (capRate > targetCapRate * 1.2) {
      competitiveIntensity = 'low'; // Less competitive
    }

    // Recommended strategy based on context
    let recommendedStrategy = 'Standard buy-and-hold approach';
    if (marketStage === 'late' && pricingContext === 'overvalued') {
      recommendedStrategy = 'Wait for market correction or focus on value-add opportunities';
    } else if (marketStage === 'early' && pricingContext === 'undervalued') {
      recommendedStrategy = 'Aggressive acquisition with optimal leverage';
    } else if (competitiveIntensity === 'high') {
      recommendedStrategy = 'Growth market play - accept lower initial returns for appreciation';
    }

    return {
      marketStage,
      pricingContext,
      competitiveIntensity,
      recommendedStrategy
    };
  }

  /**
   * Calculate property quality score (0-100)
   * This is a comprehensive score of the property's investment quality
   */
  private calculatePropertyScore(
    fundamentals: any,
    marketContext: MarketContextAnalysis,
    leverageAnalysis: LeverageAnalysis
  ): number {
    let score = 50; // Base score
    
    // Cash flow scoring (0-25 points)
    const monthlyFlow = fundamentals.cashFlow || 0;
    if (monthlyFlow >= 500) score += 20;
    else if (monthlyFlow >= 250) score += 15;
    else if (monthlyFlow >= 100) score += 10;
    else if (monthlyFlow >= 0) score += 5;
    else if (monthlyFlow >= -100) score -= 5;
    else score -= 15;
    
    // Cap rate scoring (0-25 points)
    const capRate = fundamentals.capRate || 0;
    if (capRate >= 0.07) score += 20;
    else if (capRate >= 0.055) score += 15;
    else if (capRate >= 0.04) score += 10;
    else if (capRate >= 0.03) score += 5;
    else score -= 10;
    
    // Return scoring (0-20 points)
    const cocReturn = fundamentals.cashOnCashReturn || 0;
    if (cocReturn >= 0.10) score += 15;
    else if (cocReturn >= 0.07) score += 10;
    else if (cocReturn >= 0.05) score += 5;
    else if (cocReturn >= 0) score += 2;
    else score -= 10;
    
    // Risk scoring (0-20 points)
    const dscr = fundamentals.dscr || 0;
    if (dscr >= 1.5) score += 15;
    else if (dscr >= 1.25) score += 10;
    else if (dscr >= 1.0) score += 5;
    else score -= 15;
    
    // Market context bonus (0-10 points)
    if (marketContext.pricingContext === 'undervalued') score += 10;
    else if (marketContext.pricingContext === 'fair') score += 5;
    else if (marketContext.pricingContext === 'overvalued') score -= 5;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate investment verdict (ENHANCED VERSION)
   */
  private async generateVerdict(
    fundamentals: any,
    leverageAnalysis: LeverageAnalysis,
    marketContext: MarketContextAnalysis,
    userContext: any,
    propertyData: SFRData,
    analysis: any,
    marketIntelligence: any
  ) {
    let verdict: InvestmentVerdict = 'PASS';
    let confidence = 50;
    let primaryReason = 'Analysis inconclusive';
    let secondaryReasons: string[] = [];
    let keyRisks: string[] = [];

    // ===== ENHANCED VALIDATION CHECKS =====
    
    // 1. Get market-relative thresholds
    const marketThresholds = this.getMarketRelativeCapRateThreshold(marketIntelligence, propertyData);
    
    // 2. Check rent-to-price ratio
    const rentToPriceCheck = this.assessRentToPriceRatio(propertyData.monthlyRent || 0, propertyData.purchasePrice);
    
    // 3. Calculate walk away price
    const walkAwayPrice = this.calculateWalkAwayPrice(propertyData, analysis);
    
    // 4. Get adjusted hurdle rate based on exit strategy
    const adjustedHurdleRate = this.getAdjustedHurdleRate(propertyData.exitStrategy);
    
    // 5. Check cash flow buffer requirements
    const cashFlowBuffer = this.calculateMinimumCashFlowBuffer(analysis, propertyData);
    
    // 6. Check for "too good to be true" flags
    const tooGoodFlags = this.checkTooGoodToBeTrueFlags(
      fundamentals.capRate || 0, 
      marketThresholds.marketMedianCapRate
    );

    // ===== PRIMARY DECISION FACTORS (ENHANCED) =====
    const mainMonthlyCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    const hasPositiveCashFlow = mainMonthlyCashFlow > 0;
    const meetsAdjustedHurdleRate = fundamentals.cashOnCashReturn >= adjustedHurdleRate;
    const capRateBelowMarket = fundamentals.capRate < marketThresholds.passThreshold;
    const priceAboveWalkAway = propertyData.purchasePrice > (walkAwayPrice * 1.1);
    const hasLeverageOptions = leverageAnalysis.optimalScenario.leverageScore > 60;

    logger.info('Investment Decision: Enhanced analysis', {
      mainMonthlyCashFlow,
      adjustedHurdleRate: (adjustedHurdleRate * 100).toFixed(1) + '%',
      marketMedianCapRate: (marketThresholds.marketMedianCapRate * 100).toFixed(1) + '%',
      walkAwayPrice,
      currentPrice: propertyData.purchasePrice,
      rentToPriceRatio: (rentToPriceCheck.ratio * 100).toFixed(2) + '%',
      cashFlowBufferHealth: cashFlowBuffer.bufferPercentage.toFixed(2)
    });

    // ===== AUTOMATIC PASS SCENARIOS =====
    
    // 1. Rent-to-price ratio too low (premium markets exception)
    if (rentToPriceCheck.isAutoPass) {
      verdict = 'PASS';
      confidence = 90;
      primaryReason = `Rent-to-price ratio of ${(rentToPriceCheck.ratio * 100).toFixed(2)}% is below viable threshold`;
      secondaryReasons.push('Property does not generate sufficient income relative to price');
      keyRisks.push('Appreciation-dependent investment with poor fundamentals');
    }
    
    // 2. Price above walk-away threshold
    else if (priceAboveWalkAway) {
      verdict = 'PASS';
      confidence = 85;
      primaryReason = `Purchase price exceeds maximum acceptable value of $${Math.round(walkAwayPrice).toLocaleString()}`;
      secondaryReasons.push('Price fails multiple valuation methodologies');
      keyRisks.push('Overpaying reduces returns and increases downside risk');
    }
    
    // 3. Cap rate significantly below market
    else if (capRateBelowMarket) {
      verdict = 'PASS';
      confidence = 80;
      primaryReason = `Cap rate of ${(fundamentals.capRate * 100).toFixed(1)}% is ${((marketThresholds.passThreshold - fundamentals.capRate) * 100).toFixed(1)}% below market threshold`;
      secondaryReasons.push(`Market median cap rate: ${(marketThresholds.marketMedianCapRate * 100).toFixed(1)}%`);
      keyRisks.push('Significantly underperforming market returns');
    }
    
    // 4. No positive cash flow and no leverage solution
    else if (!hasPositiveCashFlow && !hasLeverageOptions) {
      verdict = 'PASS';
      confidence = 85;
      primaryReason = 'Property cannot generate positive cash flow with any reasonable leverage scenario';
      secondaryReasons.push('High risk of monthly capital injection requirements');
      keyRisks.push('Negative cash flow stress');
    }
    
    // 5. Critical cash flow buffer shortage
    else if (cashFlowBuffer.isCritical) {
      verdict = 'PASS';
      confidence = 75;
      primaryReason = `Cash flow of $${Math.round(mainMonthlyCashFlow)}/month provides insufficient buffer for expenses`;
      secondaryReasons.push(`Minimum buffer needed: $${Math.round(cashFlowBuffer.minimumBuffer)}/month`);
      keyRisks.push('High risk of financial stress from unexpected expenses');
    }

    // ===== NEGOTIATE SCENARIOS =====
    
    // 1. "Too good to be true" properties need verification
    else if (tooGoodFlags.isSuspicious) {
      verdict = 'NEGOTIATE';
      confidence = 60;
      primaryReason = tooGoodFlags.warningMessage;
      secondaryReasons.push('Recommend thorough inspection and due diligence');
      keyRisks.push('High returns may indicate hidden problems or incorrect data');
    }
    
    // 2. Cap rate slightly below market but positive cash flow
    else if (hasPositiveCashFlow && fundamentals.capRate < marketThresholds.negotiateThreshold) {
      verdict = 'NEGOTIATE';
      confidence = 70;
      
      // Calculate price reduction using improved methodology
      const noi = analysis.keyMetrics?.noi || (propertyData.monthlyRent * 12 * 0.6);
      const targetPrice = Math.round(noi / marketThresholds.buyThreshold);
      const priceReduction = propertyData.purchasePrice - targetPrice;
      
      primaryReason = `Negotiate $${priceReduction.toLocaleString()} reduction to align with ${(marketThresholds.buyThreshold * 100).toFixed(1)}% market cap rate`;
      secondaryReasons.push(`Current cap rate: ${(fundamentals.capRate * 100).toFixed(1)}% vs market: ${(marketThresholds.marketMedianCapRate * 100).toFixed(1)}%`);
      secondaryReasons.push(`Target price: $${targetPrice.toLocaleString()}`);
    }
    
    // 3. Positive cash flow but below adjusted hurdle rate  
    else if (hasPositiveCashFlow && !meetsAdjustedHurdleRate && fundamentals.capRate > 0.02) {
      verdict = 'NEGOTIATE';
      confidence = 65;
      
      // Enhanced price reduction calculation
      const currentInvestment = fundamentals.totalInvestment || (leverageAnalysis.currentScenario.downPaymentPercent * propertyData.purchasePrice / 100);
      const currentAnnualCashFlow = mainMonthlyCashFlow * 12;
      const targetAnnualCashFlow = currentInvestment * adjustedHurdleRate;
      const additionalCashFlowNeeded = targetAnnualCashFlow - currentAnnualCashFlow;
      
      // Use current cap rate to calculate price reduction (more accurate than multiplier)
      const priceReduction = Math.round(additionalCashFlowNeeded / fundamentals.capRate);
      
      primaryReason = `Positive cash flow but ${((adjustedHurdleRate - fundamentals.cashOnCashReturn) * 100).toFixed(1)}% below return target`;
      secondaryReasons.push(`Negotiate $${priceReduction.toLocaleString()} reduction to meet ${(adjustedHurdleRate * 100).toFixed(1)}% return goal`);
      secondaryReasons.push(`Monthly cash flow: $${Math.round(mainMonthlyCashFlow)}`);
    }
    
    // 4. Insufficient cash flow buffer
    else if (hasPositiveCashFlow && cashFlowBuffer.isInsufficient && !cashFlowBuffer.isCritical) {
      verdict = 'NEGOTIATE';
      confidence = 60;
      primaryReason = `Cash flow buffer below recommended minimum - negotiate for better terms`;
      secondaryReasons.push(`Current buffer: $${Math.round(mainMonthlyCashFlow)}/month vs recommended: $${Math.round(cashFlowBuffer.minimumBuffer)}/month`);
      keyRisks.push('Limited cushion for unexpected expenses or vacancy');
    }

    // ===== BUY SCENARIOS =====
    else if (hasPositiveCashFlow && meetsAdjustedHurdleRate && fundamentals.capRate >= marketThresholds.buyThreshold) {
      verdict = 'BUY';
      confidence = 80;
      primaryReason = `Strong fundamentals with ${(fundamentals.cashOnCashReturn * 100).toFixed(1)}% return exceeding ${(adjustedHurdleRate * 100).toFixed(1)}% target`;
      secondaryReasons.push(`Cap rate of ${(fundamentals.capRate * 100).toFixed(1)}% meets market standards`);
      secondaryReasons.push(`Monthly cash flow: $${Math.round(mainMonthlyCashFlow)}`);
      
      if (leverageAnalysis.opportunityCost.capitalEfficiencyGap > 1.5) {
        secondaryReasons.push('Leverage optimization enables portfolio expansion');
      }
    }

    // ===== ENHANCED CONFIDENCE ADJUSTMENTS AND RISK ASSESSMENT =====
    
    // Apply "too good to be true" penalty
    if (tooGoodFlags.isSuspicious) {
      confidence = Math.max(30, confidence - tooGoodFlags.confidencePenalty);
    }
    
    // Market context adjustments
    if (marketContext.marketStage === 'late' && marketContext.pricingContext === 'overvalued') {
      confidence = Math.max(40, confidence - 20);
      keyRisks.push('Late market cycle increases downside risk');
    }

    // Experience level adjustments with enhanced logic
    if (userContext.experienceLevel === 'novice') {
      if (fundamentals.riskLevel === 'high' || fundamentals.riskLevel === 'very_high') {
        confidence = Math.max(30, confidence - 25);
        keyRisks.push('Complex deal not suitable for novice investors');
      } else if (mainMonthlyCashFlow < 400) {
        confidence = Math.max(40, confidence - 15);
        keyRisks.push('Recommend higher cash flow buffer for first-time investors');
      }
      // Cap confidence for novices
      confidence = Math.min(70, confidence);
    }

    // Enhanced risk flags based on property metrics
    if (fundamentals.dscr < 1.25) {
      confidence = Math.max(35, confidence - 15);
      keyRisks.push('Low debt service coverage ratio increases payment stress risk');
    }
    
    if (rentToPriceCheck.isRiskFlag) {
      confidence = Math.max(40, confidence - 10);  
      keyRisks.push(`Low rent-to-price ratio of ${(rentToPriceCheck.ratio * 100).toFixed(2)}% increases income risk`);
    }
    
    if (rentToPriceCheck.isVerificationFlag) {
      confidence = Math.max(50, confidence - 5);
      keyRisks.push('Verify rent accuracy - unusually high for property price');
    }
    
    // Operating expense ratio checks
    const operatingExpenseRatio = fundamentals.operatingExpenseRatio || 0;
    if (operatingExpenseRatio > 0.50) {
      confidence = Math.max(35, confidence - 15);
      keyRisks.push('High operating expense ratio indicates operational inefficiency');
    } else if (operatingExpenseRatio < 0.25) {
      confidence = Math.max(45, confidence - 10);
      keyRisks.push('Suspiciously low expenses - verify all costs included');
    }
    
    // Property age risk (if available)
    const propertyAge = fundamentals.propertyAgeRisk;
    if (propertyAge === 'high' && fundamentals.capRate > marketThresholds.marketMedianCapRate) {
      confidence = Math.max(40, confidence - 15);
      keyRisks.push('Older property with high cap rate may have hidden deferred maintenance');
    }
    
    // Cash flow buffer warnings
    if (cashFlowBuffer.isInsufficient && !cashFlowBuffer.isCritical) {
      confidence = Math.max(45, confidence - 10);
      keyRisks.push('Limited cash flow buffer for unexpected expenses or vacancy');
    }

    // Exit Strategy Adjustments
    const exitStrategy = propertyData.exitStrategy;
    const holdPeriod = propertyData.longTermAssumptions?.projectionYears || 10;
    
    if (exitStrategy) {
      // Short-term exit strategy requires higher margins
      if (holdPeriod <= 3 && exitStrategy.primaryExitStrategy === 'sale') {
        if (verdict === 'BUY' && fundamentals.cashOnCashReturn < 0.12) {
          verdict = 'NEGOTIATE';
          confidence = Math.max(40, confidence - 20);
          primaryReason = `Short-term hold (${holdPeriod} years) requires higher returns - negotiate for better price`;
          keyRisks.push('Short-term exit increases market timing risk');
        }
      }

      // Refinance strategy allows more aggressive leverage
      if (exitStrategy.primaryExitStrategy === 'refinance' && exitStrategy.riskApproach === 'aggressive') {
        if (verdict === 'NEGOTIATE' && leverageAnalysis.optimalScenario.leverageScore > 75) {
          confidence = Math.min(85, confidence + 10);
          secondaryReasons.push('Refinance strategy supports higher leverage approach');
        }
      }

      // First-time investor protection
      if (exitStrategy.portfolioStrategy === 'first' && fundamentals.riskLevel === 'medium') {
        confidence = Math.max(35, confidence - 15);
        keyRisks.push('Consider more conservative first investment to build experience');
      }

      // Conservative approach adjustments
      const leverageRatio = leverageAnalysis.optimalScenario.loanAmount / (leverageAnalysis.optimalScenario.loanAmount + leverageAnalysis.optimalScenario.downPaymentAmount);
      if (exitStrategy.riskApproach === 'conservative' && leverageRatio > 0.75) {
        if (verdict === 'BUY') {
          secondaryReasons.push('Consider lower leverage to match conservative risk approach');
        }
        keyRisks.push('High leverage may not align with conservative strategy');
      }

      // Market timing sensitivity
      if (exitStrategy.marketTimingFlexibility === 'constrained' && marketContext.marketStage === 'late') {
        confidence = Math.max(30, confidence - 20);
        keyRisks.push('Limited timing flexibility in late market cycle increases risk');
      }
    }
    
    // RE Analyst validation checks
    if (!fundamentals.expenseRatioValidation.valid) {
      keyRisks.push(fundamentals.expenseRatioValidation.concern || 'Expense ratio outside normal range');
      confidence = Math.max(30, confidence - 10);
    }
    
    if (!fundamentals.onePercentRulePass && marketContext.competitiveIntensity !== 'high') {
      secondaryReasons.push(`Fails 1% rule (${(fundamentals.onePercentRuleValue * 100).toFixed(2)}%) - acceptable in growth markets`);
    }
    
    if (fundamentals.propertyAgeRisk === 'high') {
      keyRisks.push('Property age >30 years increases maintenance and capital expenditure risk');
      // Adjust cash flow requirements for older properties
      if (fundamentals.cashFlow < 600) {
        confidence = Math.max(40, confidence - 10);
        keyRisks.push('Insufficient cash flow buffer for older property maintenance needs');
      }
    }

    // Calculate property quality score
    const propertyScore = this.calculatePropertyScore(fundamentals, marketContext, leverageAnalysis);
    
    return {
      verdict,
      confidence: Math.round(confidence),
      score: propertyScore,
      primaryReason,
      secondaryReasons,
      keyRisks
    };
  }

  /**
   * Create detailed action plan
   */
  private createActionPlan(
    verdict: any,
    leverageAnalysis: LeverageAnalysis,
    fundamentals: any,
    userContext: any
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    switch (verdict.verdict) {
      case 'NEGOTIATE':
        actions.push({
          action: 'Submit reduced price offer based on income analysis',
          priority: 'immediate',
          impact: 'Transforms deal from poor to strong investment',
          effort: 'low',
          expectedOutcome: 'Price reduction of $50k-100k',
          timeframe: '1-2 weeks'
        });
        break;

      case 'BUY':
        actions.push({
          action: `Structure financing with ${leverageAnalysis.optimalScenario.downPaymentPercent}% down payment`,
          priority: 'immediate',
          impact: `Generates $${leverageAnalysis.optimalScenario.monthlyNetCashFlow.toFixed(0)}/month cash flow`,
          effort: 'medium',
          expectedOutcome: 'Optimal risk-adjusted returns',
          timeframe: '2-4 weeks'
        });
        
        if (leverageAnalysis.opportunityCost.opportunityCostAnnual > 5000) {
          actions.push({
            action: 'Deploy remaining capital in additional properties',
            priority: 'short-term',
            impact: `Additional $${leverageAnalysis.opportunityCost.opportunityCostAnnual.toFixed(0)}/year potential returns`,
            effort: 'high',
            expectedOutcome: 'Diversified portfolio with higher total returns',
            timeframe: '3-6 months'
          });
        }
        break;

      case 'PASS':
        actions.push({
          action: 'Continue property search with refined criteria',
          priority: 'immediate',
          impact: 'Avoid poor investment and find better opportunities',
          effort: 'medium',
          expectedOutcome: 'Higher quality investment alternatives',
          timeframe: '2-8 weeks'
        });
        break;
    }

    // Add universal actions based on analysis
    if (fundamentals.riskLevel === 'high' || fundamentals.riskLevel === 'very_high') {
      actions.push({
        action: 'Establish larger cash reserves (6-12 months expenses)',
        priority: 'short-term',
        impact: 'Reduces financial stress during vacancy or repairs',
        effort: 'low',
        expectedOutcome: 'Enhanced financial stability',
        timeframe: '1-3 months'
      });
    }

    return actions;
  }

  /**
   * Develop capital deployment strategy
   */
  private developCapitalStrategy(
    leverageAnalysis: LeverageAnalysis,
    userContext: any,
    purchasePrice: number
  ): CapitalDeploymentAdvice {
    const current = leverageAnalysis.currentScenario;
    const optimal = leverageAnalysis.optimalScenario;
    const opportunityCost = leverageAnalysis.opportunityCost;

    return {
      currentApproach: {
        description: `${current.downPaymentPercent}% down payment approach`,
        cashRequired: current.totalCashRequired,
        expectedReturn: current.cashOnCashReturn,
        efficiency: this.getEfficiencyRating(current.leverageScore)
      },
      recommendedApproach: {
        description: `${optimal.downPaymentPercent}% down payment for optimal leverage`,
        cashRequired: optimal.totalCashRequired,
        expectedReturn: optimal.cashOnCashReturn,
        efficiency: this.getEfficiencyRating(optimal.leverageScore)
      },
      opportunityCost: {
        annualCost: opportunityCost.opportunityCostAnnual,
        description: `Suboptimal capital deployment costs $${opportunityCost.opportunityCostAnnual.toFixed(0)}/year in lost returns`,
        alternativeUse: `Deploy excess capital across ${opportunityCost.optimalDeployment.propertiesControlled} properties`
      },
      portfolioStrategy: this.generatePortfolioStrategy(opportunityCost, userContext)
    };
  }

  private getEfficiencyRating(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private generatePortfolioStrategy(opportunityCost: any, userContext: any): string {
    const velocity = opportunityCost.optimalDeployment.portfolioVelocity;
    const properties = opportunityCost.optimalDeployment.propertiesControlled;

    if (velocity > 3 && properties > 2) {
      return `High-velocity strategy: Control $${(opportunityCost.optimalDeployment.totalAssetValue / 1000000).toFixed(1)}M in assets with optimal leverage across ${properties} properties`;
    } else if (velocity > 2) {
      return `Balanced growth: Use leverage to control ${properties} properties while maintaining conservative risk profile`;
    } else {
      return `Conservative approach: Focus on single property ownership with minimal leverage risk`;
    }
  }

  /**
   * Identify investment alternatives
   */
  private identifyAlternatives(
    verdict: any,
    fundamentals: any,
    marketContext: MarketContextAnalysis,
    userContext: any
  ): AlternativeInvestment[] {
    const alternatives: AlternativeInvestment[] = [];

    if (verdict.verdict === 'PASS' || verdict.verdict === 'NEGOTIATE') {
      alternatives.push({
        type: 'better_deal',
        title: 'Search for Higher Cap Rate Properties',
        description: `Target properties with 6%+ cap rates in similar markets`,
        expectedReturn: '8-12% total return',
        riskLevel: 'similar',
        timeframe: '2-6 months search time'
      });
    }

    if (marketContext.marketStage === 'late') {
      alternatives.push({
        type: 'market_timing',
        title: 'Wait for Market Correction',
        description: 'Deploy capital in high-yield savings while waiting for better pricing',
        expectedReturn: '4.5-5% risk-free return',
        riskLevel: 'lower',
        timeframe: '6-18 months'
      });
    }

    if (fundamentals.capRate < 0.04) {
      alternatives.push({
        type: 'different_strategy',
        title: 'Value-Add Investment Strategy',
        description: 'Target properties needing improvements to force appreciation',
        expectedReturn: '12-18% total return',
        riskLevel: 'higher',
        timeframe: '1-2 year project timeline'
      });
    }

    return alternatives;
  }

  /**
   * Create investment timeline
   */
  private createInvestmentTimeline(verdict: any, actionPlan: ActionItem[]): InvestmentTimeline {
    const immediateActions = actionPlan
      .filter(a => a.priority === 'immediate')
      .map(a => a.action);

    const shortTermActions = actionPlan
      .filter(a => a.priority === 'short-term')
      .map(a => a.action);

    const longTermStrategy = actionPlan
      .filter(a => a.priority === 'long-term')
      .map(a => a.action);

    // Add default timeline items based on verdict
    if (verdict.verdict === 'BUY') {
      longTermStrategy.push('Monitor property performance and market conditions quarterly');
      longTermStrategy.push('Evaluate refinancing opportunities when rates improve');
    }

    return {
      immediateActions,
      shortTermActions,
      longTermStrategy
    };
  }
}