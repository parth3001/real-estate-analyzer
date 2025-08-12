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
import { MarketTierService, MarketTier, MarketContext } from './marketTierService';
import { PropertyClassificationService, PropertyClass, PropertyClassification, PropertyClassRiskAdjustments } from './propertyClassificationService';
import { StrategyAlignmentService, StrategyAlignment, UserStrategy } from './strategyAlignmentService';

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
  confidenceDescription?: string; // Human-readable confidence explanation
  goalBasedReasoning?: string; // Explanation tied to user's specific goals
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
   * Analyze market intelligence using Market Tier Service (Phase 2A)
   */
  private analyzeMarketIntelligence(
    propertyData: SFRData,
    marketIntelligence: any,
    fundamentals: any
  ): MarketContext & {
    marketMedianCapRate: number;
    passThreshold: number;
    negotiateThreshold: number;
    buyThreshold: number;
    marketInsights: string[];
    fairMarketValue?: { fairValue: number; targetCapRate: number; reasoning: string; overpriced?: boolean; overpricedBy?: number };
  } {
    const city = propertyData.propertyAddress?.city || '';
    const state = propertyData.propertyAddress?.state || '';
    
    // Get market tier classification
    const marketTier = MarketTierService.getMarketTier(city, state);
    
    logger.info('Phase 2A: Market Intelligence Analysis', {
      city,
      state,
      marketTier: marketTier.tier,
      tierName: marketTier.name,
      focusType: marketTier.focusType
    });
    
    // Calculate market median cap rate from existing data sources
    let marketMedianCapRate = this.getTierTargetCapRate(marketTier.tier);
    
    // Override with actual market data if available
    if (marketIntelligence?.marketTrends?.averageRent && marketIntelligence?.economicIndicators?.medianHomePrice) {
      const avgRent = marketIntelligence.marketTrends.averageRent;
      const medianPrice = marketIntelligence.economicIndicators.medianHomePrice;
      const calculatedCapRate = (avgRent * 12) / medianPrice;
      
      // Use calculated rate if reasonable, otherwise stick with tier-based rate
      if (calculatedCapRate >= 0.03 && calculatedCapRate <= 0.12) {
        marketMedianCapRate = calculatedCapRate;
      }
    }
    
    // Apply market tier thresholds with tier-specific adjustments
    const tierThresholds = MarketTierService.calculateAdaptiveThresholds(
      marketTier,
      'balanced', // Default strategy - will be enhanced in Phase 3
      'intermediate', // Default experience - could be from user context
      6 // Default hold period - could be from enhanced goals
    );
    
    const passThreshold = marketMedianCapRate - 0.015; // 1.5% below market
    const negotiateThreshold = marketMedianCapRate - 0.005; // 0.5% below market  
    const buyThreshold = marketMedianCapRate + tierThresholds.capRatePremium; // Tier-adjusted target
    
    // Generate market intelligence insights
    const propertyCapRate = fundamentals.capRate || 0;
    const propertyRentToPriceRatio = fundamentals.rentToPriceRatio || 0;
    
    const marketInsights = MarketTierService.generateMarketInsights(
      {
        marketTier,
        cityName: city,
        stateName: state,
        marketMedianCapRate,
        relativePerformance: {
          capRateVsMarket: propertyCapRate - marketMedianCapRate,
          rentVsMarket: 0, // Will be enhanced with RentCast data
          priceVsMarket: 0  // Will be enhanced with comparable data
        }
      },
      propertyCapRate,
      propertyRentToPriceRatio
    );
    
    // Calculate fair market value using market tier analysis
    const noi = fundamentals.noi || (propertyData.monthlyRent * 12 * 0.6); // Net Operating Income estimate
    let fairMarketValue;
    
    if (noi > 0) {
      const fmvResult = MarketTierService.calculateFairMarketValue(
        noi,
        marketTier,
        marketMedianCapRate
      );
      
      const overpriced = propertyData.purchasePrice > fmvResult.fairValue;
      const overpricedBy = overpriced ? 
        Math.round(((propertyData.purchasePrice - fmvResult.fairValue) / fmvResult.fairValue) * 100) : 
        undefined;
      
      fairMarketValue = {
        ...fmvResult,
        overpriced,
        overpricedBy
      };
      
      logger.info('Fair Market Value Analysis', {
        purchasePrice: propertyData.purchasePrice,
        fairValue: fmvResult.fairValue,
        targetCapRate: fmvResult.targetCapRate,
        overpriced,
        overpricedBy: overpricedBy ? `${overpricedBy}%` : 'N/A'
      });
    }
    
    const marketContext: MarketContext = {
      marketTier,
      cityName: city,
      stateName: state,
      marketMedianCapRate,
      relativePerformance: {
        capRateVsMarket: propertyCapRate - marketMedianCapRate,
        rentVsMarket: 0, // To be enhanced with RentCast data
        priceVsMarket: 0  // To be enhanced with comparable data
      }
    };
    
    return {
      ...marketContext,
      marketMedianCapRate, // Ensure it's required, not optional
      passThreshold,
      negotiateThreshold,
      buyThreshold,
      marketInsights,
      fairMarketValue
    };
  }

  /**
   * Analyze strategy alignment using Strategy Alignment Service (Phase 3)
   */
  private analyzeStrategyAlignment(
    propertyData: SFRData,
    marketIntelligenceAnalysis: any,
    propertyClassificationAnalysis: any,
    fundamentals: any
  ): {
    alignment: StrategyAlignment;
    insights: string[];
  } {
    // Extract user strategy from enhanced goals and property data
    const userStrategy: UserStrategy = {
      investmentStrategy: this.extractInvestmentStrategy(propertyData),
      holdPeriod: propertyData.longTermAssumptions?.projectionYears || 6,
      experienceLevel: this.extractExperienceLevel(propertyData),
      riskTolerance: this.extractRiskTolerance(propertyData),
      portfolioStrategy: propertyData.exitStrategy?.portfolioStrategy,
      geographicFocus: `${propertyData.propertyAddress?.city}, ${propertyData.propertyAddress?.state}`,
      capitalAvailable: undefined // Would be enhanced with user context
    };
    
    // Prepare property metrics for strategy alignment
    const propertyMetrics = {
      capRate: fundamentals.capRate || 0,
      cashFlow: fundamentals.cashFlow || 0,
      expectedAppreciation: propertyData.longTermAssumptions?.annualPropertyValueIncrease || 0.03,
      managementComplexity: this.assessManagementComplexity(
        propertyClassificationAnalysis.classification,
        propertyData.yearBuilt || new Date().getFullYear() - 10
      )
    };
    
    // Analyze strategy alignment
    const alignment = StrategyAlignmentService.analyzeStrategyAlignment(
      userStrategy,
      marketIntelligenceAnalysis.marketTier,
      propertyClassificationAnalysis.classification,
      propertyMetrics
    );
    
    // Generate strategy alignment insights
    const insights = this.generateStrategyAlignmentInsights(alignment, userStrategy);
    
    logger.info('Phase 3: Strategy Alignment Analysis Complete', {
      userStrategy: userStrategy.investmentStrategy,
      holdPeriod: userStrategy.holdPeriod,
      experienceLevel: userStrategy.experienceLevel,
      alignmentScore: alignment.alignmentScore,
      alignmentLevel: alignment.alignment,
      misalignmentCount: alignment.misalignments.length,
      recommendationCount: alignment.recommendations.length
    });
    
    return {
      alignment,
      insights
    };
  }

  /**
   * Extract investment strategy from property data and enhanced goals
   */
  private extractInvestmentStrategy(propertyData: SFRData): 'cashflow' | 'appreciation' | 'balanced' {
    // Enhanced goals would be passed separately in a full implementation
    // For now, use exit strategy as primary source
    
    // Fallback to exit strategy analysis
    if (propertyData.exitStrategy?.portfolioStrategy === 'cashflow') return 'cashflow';
    if (propertyData.exitStrategy?.portfolioStrategy === 'appreciation') return 'appreciation';
    
    // Default to balanced
    return 'balanced';
  }

  /**
   * Extract experience level from property data context
   */
  private extractExperienceLevel(propertyData: SFRData): 'novice' | 'intermediate' | 'experienced' | 'expert' {
    // Check portfolio strategy for experience indicators
    if (propertyData.exitStrategy?.portfolioStrategy === 'first') return 'novice';
    if (propertyData.exitStrategy?.riskApproach === 'conservative') return 'intermediate';
    if (propertyData.exitStrategy?.riskApproach === 'aggressive' || 
        propertyData.exitStrategy?.riskApproach === 'opportunistic') return 'experienced';
    
    // Default to intermediate
    return 'intermediate';
  }

  /**
   * Extract risk tolerance from property data
   */
  private extractRiskTolerance(propertyData: SFRData): 'conservative' | 'moderate' | 'aggressive' | 'opportunistic' {
    // Map from exit strategy risk approach
    const riskApproach = propertyData.exitStrategy?.riskApproach;
    if (riskApproach === 'conservative') return 'conservative';
    if (riskApproach === 'balanced') return 'moderate';
    if (riskApproach === 'aggressive') return 'aggressive';
    if (riskApproach === 'opportunistic') return 'opportunistic';
    
    // Default to moderate
    return 'moderate';
  }

  /**
   * Assess management complexity based on property classification and age
   */
  private assessManagementComplexity(
    classification: PropertyClassification,
    yearBuilt: number
  ): 'low' | 'medium' | 'high' {
    const propertyAge = new Date().getFullYear() - yearBuilt;
    
    // Class A properties generally low complexity
    if (classification.propertyClass === 'A' && propertyAge <= 15) return 'low';
    
    // Class C properties or old properties = high complexity
    if (classification.propertyClass === 'C' || propertyAge > 40) return 'high';
    
    // Class B properties or moderate age = medium complexity
    return 'medium';
  }

  /**
   * Generate strategy alignment insights
   */
  private generateStrategyAlignmentInsights(
    alignment: StrategyAlignment,
    userStrategy: UserStrategy
  ): string[] {
    const insights: string[] = [];
    
    // Primary alignment insight
    insights.push(`Strategy Alignment: ${alignment.alignment.toUpperCase()} (${alignment.alignmentScore}/100) - ${alignment.primaryAlignment}`);
    
    // Add top misalignments
    const criticalMisalignments = alignment.misalignments.filter(
      m => m.severity === 'critical' || m.severity === 'major'
    ).slice(0, 2);
    
    criticalMisalignments.forEach(misalignment => {
      insights.push(`⚠️ ${misalignment.description}: ${misalignment.suggestion}`);
    });
    
    // Add top recommendations
    const highPriorityRecommendations = alignment.recommendations.filter(
      r => r.priority === 'high'
    ).slice(0, 1);
    
    highPriorityRecommendations.forEach(recommendation => {
      insights.push(`💡 ${recommendation.title}: ${recommendation.expectedImprovement}`);
    });
    
    // Opportunity cost analysis if significant
    if (alignment.opportunityCost && alignment.opportunityCost.annualOpportunityCost > 5000) {
      insights.push(
        `Opportunity Cost: $${Math.round(alignment.opportunityCost.annualOpportunityCost).toLocaleString()}/year vs ${alignment.opportunityCost.alternativeDescription}`
      );
    }
    
    return insights;
  }

  /**
   * Analyze property classification using Property Classification Service (Phase 2B)
   */
  private analyzePropertyClassification(
    propertyData: SFRData,
    marketIntelligenceAnalysis: any,
    fundamentals: any
  ): {
    classification: PropertyClassification;
    riskAdjustments: PropertyClassRiskAdjustments;
    insights: string[];
  } {
    // Estimate market median price (would be enhanced with actual market data)
    const estimatedMarketMedian = this.estimateMarketMedianPrice(
      marketIntelligenceAnalysis.marketTier,
      propertyData.propertyAddress?.city || ''
    );
    
    // Classify property
    const classification = PropertyClassificationService.classifyProperty(
      propertyData.yearBuilt || new Date().getFullYear() - 10, // Default if not provided
      propertyData.purchasePrice,
      estimatedMarketMedian,
      marketIntelligenceAnalysis.marketTier,
      propertyData.squareFootage,
      undefined, // lotSize - not available in SFRData interface
      false // hasUpdates - would be enhanced with actual data
    );
    
    // Get risk adjustments
    const riskAdjustments = PropertyClassificationService.getPropertyClassRiskAdjustments(
      classification.propertyClass,
      marketIntelligenceAnalysis.marketTier
    );
    
    // Generate insights
    const insights = PropertyClassificationService.generatePropertyClassInsights(
      classification,
      propertyData.yearBuilt || new Date().getFullYear() - 10,
      propertyData.purchasePrice,
      riskAdjustments
    );
    
    logger.info('Phase 2B: Property Classification Analysis', {
      propertyClass: classification.propertyClass,
      confidence: classification.confidence,
      riskLevel: classification.riskLevel,
      managementIntensity: classification.managementIntensity,
      yearBuilt: propertyData.yearBuilt,
      propertyAge: new Date().getFullYear() - (propertyData.yearBuilt || new Date().getFullYear() - 10),
      priceVsMarket: (propertyData.purchasePrice / estimatedMarketMedian).toFixed(2),
      riskAdjustments: {
        capRatePremium: (riskAdjustments.capRatePremium * 100).toFixed(0) + 'bps',
        maintenanceMultiplier: riskAdjustments.maintenanceMultiplier,
        confidenceBoost: riskAdjustments.confidenceBoost
      }
    });
    
    return {
      classification,
      riskAdjustments,
      insights
    };
  }

  /**
   * Estimate market median price (fallback method - would be enhanced with real data)
   */
  private estimateMarketMedianPrice(marketTier: MarketTier, city: string): number {
    // Basic estimates based on market tier and city
    const basePrice = marketTier.tier === 1 ? 800000 : marketTier.tier === 2 ? 400000 : 250000;
    
    // City-specific adjustments (simplified)
    const cityLower = city.toLowerCase();
    if (cityLower.includes('austin') || cityLower.includes('dallas')) {
      return basePrice * 1.1;
    } else if (cityLower.includes('houston')) {
      return basePrice * 1.05;
    }
    
    return basePrice;
  }

  /**
   * Get tier-appropriate target cap rate (fallback method)
   */
  private getTierTargetCapRate(tier: 1 | 2 | 3): number {
    // Conservative baseline cap rates by tier
    switch (tier) {
      case 1: return 0.04;  // 4% for premium markets
      case 2: return 0.05;  // 5% for balanced markets  
      case 3: return 0.07;  // 7% for cash flow markets
    }
  }

  /**
   * Calculate market-relative cap rate threshold (LEGACY - will be deprecated)
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
    
    // Three price ceilings - adjusted for modern market realities
    const treasuryBasedPrice = noi / (this.TREASURY_RATE + 0.03); // 300bps spread
    
    // Adaptive rent-to-price rule (0.7% to 1% based on market conditions)
    // In high-cost markets, 0.7% rule is more realistic than strict 1% rule
    const adaptiveRentMultiplier = monthlyRent < 2000 ? 100 : 143; // 0.7% rule for higher rents
    const rentBasedCeiling = monthlyRent * adaptiveRentMultiplier;
    
    // Use actual comps or a more realistic discount from asking
    const comparablesCeiling = propertyData.purchasePrice * 1.05; // Allow up to 5% above asking if fundamentals support it
    
    // Take the minimum of treasury and rent-based, but allow comps to override if property cash flows well
    const baseWalkAway = Math.min(treasuryBasedPrice, rentBasedCeiling);
    
    // If property has positive cash flow and decent cap rate, be less restrictive
    const capRate = analysis.keyMetrics?.capRate || 0;
    const monthlyCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    
    if (monthlyCashFlow > 500 && capRate > 0.05) {
      // Strong cash flow properties get more flexibility
      return Math.max(baseWalkAway, comparablesCeiling);
    }
    
    return baseWalkAway;
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
        ? `Unusually high ${capRate.toFixed(1)}% cap rate vs ${marketMedianCapRate.toFixed(1)}% market median - verify all assumptions`
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

      // 2A. Phase 2A: Market Intelligence Analysis
      const marketIntelligenceAnalysis = this.analyzeMarketIntelligence(
        propertyData,
        marketIntelligence,
        fundamentals
      );

      // 2B. Phase 2B: Property Classification Analysis
      const propertyClassificationAnalysis = this.analyzePropertyClassification(
        propertyData,
        marketIntelligenceAnalysis,
        fundamentals
      );

      // 2C. Phase 3: Strategy Alignment Analysis
      const strategyAlignmentAnalysis = this.analyzeStrategyAlignment(
        propertyData,
        marketIntelligenceAnalysis,
        propertyClassificationAnalysis,
        fundamentals
      );

      // 3. Analyze market context (legacy + enhanced)
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
        marketIntelligenceAnalysis, // Phase 2A
        propertyClassificationAnalysis, // Phase 2B
        strategyAlignmentAnalysis // Phase 3
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
        goalContext, // NEW: Include goal context for frontend
        confidenceDescription: this.getConfidenceDescription(verdict.verdict, verdict.confidence),
        goalBasedReasoning: this.getGoalBasedReasoning(verdict.verdict, propertyData, fundamentals, enhancedGoals)
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
   * Generate confidence description based on verdict and confidence level
   */
  private getConfidenceDescription(verdict: InvestmentVerdict, confidence: number): string {
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
    
    // PASS verdict
    if (confidence >= 80) return 'Strong indicators against this investment';
    if (confidence >= 65) return 'Multiple concerns outweigh benefits';
    if (confidence >= 40) return 'May work for specific strategies but has significant risks';
    // 30% or below
    return 'Too many serious risk factors to recommend this investment';
  }

  /**
   * Generate goal-based reasoning explanation
   */
  private getGoalBasedReasoning(
    verdict: InvestmentVerdict,
    propertyData: SFRData,
    fundamentals: any,
    enhancedGoals: any
  ): string {
    const exitStrategy = enhancedGoals?.processedGoals?.exitStrategy?.strategy || 
                        propertyData.exitStrategy?.primaryExitStrategy || 
                        'sale';
    
    // CRITICAL: Keep financial calculations at 10 years (DO NOT CHANGE)
    const financialProjectionYears = propertyData.longTermAssumptions?.projectionYears || 10;
    
    // Extract user's strategic timeline for MESSAGING ONLY (separate from financial calculations)
    let strategicHoldPeriod = 6; // Default: 6 years (most common investor timeline)
    let timelineDisplayText = `${strategicHoldPeriod}-year`; // For messaging
    
    // Parse free text for strategic timeline hints (e.g., "4-5 years", "3-7 years")
    if (enhancedGoals?.freeTextStrategy) {
      const timelineMatch = enhancedGoals.freeTextStrategy.match(/(\d+)[-–](\d+)\s*years?/i);
      if (timelineMatch) {
        const minYears = parseInt(timelineMatch[1]);
        const maxYears = parseInt(timelineMatch[2]);
        strategicHoldPeriod = Math.round((minYears + maxYears) / 2); // Use average
        timelineDisplayText = timelineMatch[0]; // Use original text like "3-7 years"
        logger.info('Extracted strategic timeline from free text (messaging only):', {
          match: timelineMatch[0],
          minYears,
          maxYears,
          strategicHoldPeriod,
          financialProjectionYears // Log but don't change
        });
      } else {
        // Look for single year mentions (e.g., "5 years")
        const singleYearMatch = enhancedGoals.freeTextStrategy.match(/(\d+)\s*years?/i);
        if (singleYearMatch) {
          strategicHoldPeriod = parseInt(singleYearMatch[1]);
          timelineDisplayText = `${strategicHoldPeriod}-year`;
          logger.info('Extracted single strategic timeline (messaging only):', {
            match: singleYearMatch[0],
            strategicHoldPeriod,
            financialProjectionYears // Log but don't change
          });
        }
      }
    }
    
    // Map from enhanced goals portfolio strategy to investment goal
    let investmentGoal = enhancedGoals?.processedGoals?.investmentGoal || 'balanced';
    if (enhancedGoals?.portfolioStrategy === 'cashflow') investmentGoal = 'cashflow';
    else if (enhancedGoals?.portfolioStrategy === 'appreciation') investmentGoal = 'appreciation';
    else if (enhancedGoals?.portfolioStrategy === 'first' || enhancedGoals?.portfolioStrategy === 'geographic' || enhancedGoals?.portfolioStrategy === 'diversification') investmentGoal = 'balanced';
    
    // Basic hold period business logic context
    let holdPeriodContext = '';
    if (strategicHoldPeriod <= 3) {
      holdPeriodContext = 'short-term hold requires premium returns due to market timing risk';
    } else if (strategicHoldPeriod >= 8) {
      holdPeriodContext = 'long-term hold allows for time arbitrage and appreciation focus';  
    } else {
      holdPeriodContext = 'medium-term hold offers balanced risk/return profile';
    }
    
    logger.info('Goal-based reasoning context:', {
      verdict,
      strategicHoldPeriod,
      timelineDisplayText,
      financialProjectionYears,
      exitStrategy,
      investmentGoal,
      holdPeriodContext,
      capRate: fundamentals.capRate.toFixed(1) + '%',
      cashFlow: Math.round(fundamentals.cashFlow)
    });
    
    if (verdict === 'PASS') {
      if (exitStrategy === 'sale' && strategicHoldPeriod <= 7) {
        return `With your ${timelineDisplayText} appreciation strategy, this property's ${fundamentals.capRate.toFixed(1)}% cap rate is too low for the risk. Better opportunities exist in growing markets.`;
      }
      if (investmentGoal === 'cashflow') {
        return `For cash flow focused investing, the monthly cash flow of $${Math.round(fundamentals.cashFlow)} doesn't justify the investment risk and capital requirements.`;
      }
      if (investmentGoal === 'appreciation') {
        return `While you're focused on appreciation, the market indicators and property fundamentals suggest limited growth potential relative to the risk.`;
      }
      // Short-term hold specific messaging
      if (strategicHoldPeriod <= 3) {
        return `Short-term ${timelineDisplayText} strategy requires premium returns and strong market timing - this property's fundamentals insufficient for timing risk.`;
      }
    }
    
    if (verdict === 'BUY') {
      if (exitStrategy === 'sale' && strategicHoldPeriod <= 7) {
        return `Strong opportunity for your ${timelineDisplayText} hold strategy with projected appreciation and positive cash flow buffering market volatility.`;
      }
      if (investmentGoal === 'cashflow') {
        return `Excellent cash flow property generating $${Math.round(fundamentals.cashFlow)}/month with stable tenant demand and manageable expenses.`;
      }
      // Long-term hold specific messaging
      if (strategicHoldPeriod >= 8) {
        return `Excellent long-term ${timelineDisplayText} opportunity with time to benefit from appreciation and cash flow compound growth.`;
      }
    }
    
    if (verdict === 'NEGOTIATE') {
      if (strategicHoldPeriod <= 3) {
        return `Short-term ${timelineDisplayText} strategy could work with significant price reduction to justify timing risk.`;
      }
      // Include timeline in all NEGOTIATE messaging
      return `This property could work for your ${timelineDisplayText} ${investmentGoal} strategy with the right price adjustments. Focus negotiation on improving the ${fundamentals.capRate < 0.05 ? 'cap rate' : 'cash flow'}.`;
    }
    
    // Default fallback - use strategic timeline for messaging
    return `Based on your ${investmentGoal} investment goals and ${timelineDisplayText} timeline, this property ${verdict === 'PASS' ? 'does not meet' : 'meets'} your investment criteria.`;
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
    let scoreBreakdown: any = { base: 50 };
    
    // Cash flow scoring (0-25 points)
    const monthlyFlow = fundamentals.cashFlow || 0;
    let cashFlowPoints = 0;
    if (monthlyFlow >= 500) cashFlowPoints = 20;
    else if (monthlyFlow >= 250) cashFlowPoints = 15;
    else if (monthlyFlow >= 100) cashFlowPoints = 10;
    else if (monthlyFlow >= 0) cashFlowPoints = 5;
    else if (monthlyFlow >= -100) cashFlowPoints = -5;
    else cashFlowPoints = -15;
    score += cashFlowPoints;
    scoreBreakdown.cashFlow = cashFlowPoints;
    
    // Cap rate scoring (0-25 points)
    const capRate = fundamentals.capRate || 0;
    let capRatePoints = 0;
    if (capRate >= 0.07) capRatePoints = 20;
    else if (capRate >= 0.055) capRatePoints = 15;
    else if (capRate >= 0.04) capRatePoints = 10;
    else if (capRate >= 0.03) capRatePoints = 5;
    else capRatePoints = -10;
    score += capRatePoints;
    scoreBreakdown.capRate = capRatePoints;
    
    // Return scoring (0-20 points)
    const cocReturn = fundamentals.cashOnCashReturn || 0;
    let returnPoints = 0;
    if (cocReturn >= 0.10) returnPoints = 15;
    else if (cocReturn >= 0.07) returnPoints = 10;
    else if (cocReturn >= 0.05) returnPoints = 5;
    else if (cocReturn >= 0) returnPoints = 2;
    else returnPoints = -10;
    score += returnPoints;
    scoreBreakdown.cashOnCash = returnPoints;
    
    // Risk scoring (0-20 points)
    const dscr = fundamentals.dscr || 0;
    let riskPoints = 0;
    if (dscr >= 1.5) riskPoints = 15;
    else if (dscr >= 1.25) riskPoints = 10;
    else if (dscr >= 1.0) riskPoints = 5;
    else riskPoints = -15;
    score += riskPoints;
    scoreBreakdown.risk = riskPoints;
    
    // Market context bonus (0-10 points)
    let marketPoints = 0;
    if (marketContext.pricingContext === 'undervalued') marketPoints = 10;
    else if (marketContext.pricingContext === 'fair') marketPoints = 5;
    else if (marketContext.pricingContext === 'overvalued') marketPoints = -5;
    score += marketPoints;
    scoreBreakdown.market = marketPoints;
    
    logger.info('Property Score Calculation:', {
      inputs: {
        monthlyFlow,
        capRate: capRate.toFixed(2) + '%',
        cocReturn: cocReturn.toFixed(2) + '%',
        dscr: dscr.toFixed(2),
        marketContext: marketContext.pricingContext
      },
      scoreBreakdown,
      totalScore: score,
      finalScore: Math.max(0, Math.min(100, Math.round(score)))
    });
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate investment verdict (ENHANCED VERSION with Phase 2A + 2B + 3)
   */
  private async generateVerdict(
    fundamentals: any,
    leverageAnalysis: LeverageAnalysis,
    marketContext: MarketContextAnalysis,
    userContext: any,
    propertyData: SFRData,
    analysis: any,
    marketIntelligenceAnalysis: any, // Phase 2A
    propertyClassificationAnalysis: any, // Phase 2B
    strategyAlignmentAnalysis: any // Phase 3
  ) {
    let verdict: InvestmentVerdict = 'PASS';
    let confidence = 50;
    let primaryReason = 'Analysis inconclusive';
    let secondaryReasons: string[] = [];
    let keyRisks: string[] = [];

    // ===== ENHANCED VALIDATION CHECKS WITH PHASE 2A =====
    
    // 1. Get market-relative thresholds from Market Intelligence Analysis
    const marketThresholds = {
      marketMedianCapRate: marketIntelligenceAnalysis.marketMedianCapRate,
      passThreshold: marketIntelligenceAnalysis.passThreshold,
      negotiateThreshold: marketIntelligenceAnalysis.negotiateThreshold,
      buyThreshold: marketIntelligenceAnalysis.buyThreshold
    };
    
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

    // Apply property class risk adjustments to thresholds and confidence
    const classRiskAdjustments = propertyClassificationAnalysis.riskAdjustments;
    const adjustedMarketThresholds = {
      ...marketThresholds,
      buyThreshold: marketThresholds.buyThreshold + classRiskAdjustments.capRatePremium
    };
    
    // Use adjusted thresholds for decision logic
    const finalMarketThresholds = adjustedMarketThresholds;

    // ===== PRIMARY DECISION FACTORS (ENHANCED) =====
    const mainMonthlyCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    const hasPositiveCashFlow = mainMonthlyCashFlow > 0;
    const meetsAdjustedHurdleRate = fundamentals.cashOnCashReturn >= adjustedHurdleRate;
    const capRateBelowMarket = fundamentals.capRate < finalMarketThresholds.passThreshold;
    const priceAboveWalkAway = propertyData.purchasePrice > (walkAwayPrice * 1.1);
    const hasLeverageOptions = leverageAnalysis.optimalScenario.leverageScore > 60;
    
    logger.info('Investment Decision: Enhanced analysis with Phase 2A + 2B', {
      mainMonthlyCashFlow,
      adjustedHurdleRate: (adjustedHurdleRate * 100).toFixed(1) + '%',
      // Phase 2A - Market Intelligence
      marketTier: marketIntelligenceAnalysis.marketTier.tier,
      marketTierName: marketIntelligenceAnalysis.marketTier.name,
      marketMedianCapRate: (marketThresholds.marketMedianCapRate * 100).toFixed(1) + '%',
      fairMarketValue: marketIntelligenceAnalysis.fairMarketValue?.fairValue,
      overpriced: marketIntelligenceAnalysis.fairMarketValue?.overpriced,
      overpricedBy: marketIntelligenceAnalysis.fairMarketValue?.overpricedBy,
      // Phase 2B - Property Classification
      propertyClass: propertyClassificationAnalysis.classification.propertyClass,
      classConfidence: propertyClassificationAnalysis.classification.confidence + '%',
      riskLevel: propertyClassificationAnalysis.classification.riskLevel,
      managementIntensity: propertyClassificationAnalysis.classification.managementIntensity,
      capRateAdjustment: (classRiskAdjustments.capRatePremium * 100).toFixed(0) + 'bps',
      confidenceAdjustment: classRiskAdjustments.confidenceBoost,
      // General metrics
      walkAwayPrice,
      currentPrice: propertyData.purchasePrice,
      rentToPriceRatio: (rentToPriceCheck.ratio * 100).toFixed(2) + '%',
      cashFlowBufferHealth: cashFlowBuffer.bufferPercentage.toFixed(2),
      marketInsights: marketIntelligenceAnalysis.marketInsights.length
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
    
    // 3. Cap rate significantly below market (enhanced with market tier + property class intelligence)
    else if (capRateBelowMarket) {
      verdict = 'PASS';
      confidence = 80;
      primaryReason = `Cap rate of ${fundamentals.capRate.toFixed(1)}% is ${((finalMarketThresholds.passThreshold - fundamentals.capRate) * 100).toFixed(1)}bps below ${marketIntelligenceAnalysis.marketTier.name} threshold`;
      secondaryReasons.push(`${marketIntelligenceAnalysis.cityName}, ${marketIntelligenceAnalysis.stateName} market median: ${(finalMarketThresholds.marketMedianCapRate * 100).toFixed(1)}%`);
      secondaryReasons.push(`${marketIntelligenceAnalysis.marketTier.name} focus: ${marketIntelligenceAnalysis.marketTier.focusType}`);
      secondaryReasons.push(`${propertyClassificationAnalysis.classification.classDescription}`);
      keyRisks.push('Significantly underperforming market returns');
      // Add property class insights
      if (propertyClassificationAnalysis.insights.length > 0) {
        secondaryReasons.push(propertyClassificationAnalysis.insights[0]);
      }
      // Add market insights as secondary reasons
      if (marketIntelligenceAnalysis.marketInsights.length > 0) {
        secondaryReasons.push(...marketIntelligenceAnalysis.marketInsights.slice(0, 1));
      }
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
    
    // 2. Cap rate slightly below market but positive cash flow (enhanced with fair market value)
    else if (hasPositiveCashFlow && fundamentals.capRate < finalMarketThresholds.negotiateThreshold) {
      verdict = 'NEGOTIATE';
      confidence = 70;
      
      // Use fair market value calculation from market intelligence
      let targetPrice: number;
      let priceReduction: number;
      
      if (marketIntelligenceAnalysis.fairMarketValue) {
        targetPrice = marketIntelligenceAnalysis.fairMarketValue.fairValue;
        priceReduction = propertyData.purchasePrice - targetPrice;
        
        primaryReason = `Negotiate $${priceReduction.toLocaleString()} reduction to align with fair market value`;
        secondaryReasons.push(marketIntelligenceAnalysis.fairMarketValue.reasoning);
        secondaryReasons.push(`Fair value: $${targetPrice.toLocaleString()} (${marketIntelligenceAnalysis.fairMarketValue.targetCapRate.toFixed(1)}% target cap rate)`);
      } else {
        // Fallback to original calculation
        const noi = analysis.keyMetrics?.noi || (propertyData.monthlyRent * 12 * 0.6);
        targetPrice = Math.round(noi / finalMarketThresholds.buyThreshold);
        priceReduction = propertyData.purchasePrice - targetPrice;
        
        primaryReason = `Negotiate $${priceReduction.toLocaleString()} reduction to align with ${(finalMarketThresholds.buyThreshold * 100).toFixed(1)}% market cap rate`;
        secondaryReasons.push(`Target price: $${targetPrice.toLocaleString()}`);
      }
      
      secondaryReasons.push(`Current cap rate: ${fundamentals.capRate.toFixed(1)}% vs ${marketIntelligenceAnalysis.marketTier.name} median: ${(finalMarketThresholds.marketMedianCapRate * 100).toFixed(1)}%`);
      // Add property class context
      if (propertyClassificationAnalysis.classification.propertyClass === 'C') {
        secondaryReasons.push(`${propertyClassificationAnalysis.classification.classDescription} - factor in higher management costs`);
      }
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
    // Primary BUY scenario: Strong cash flow and returns (enhanced with market intelligence + property class)
    else if (hasPositiveCashFlow && meetsAdjustedHurdleRate && fundamentals.capRate >= finalMarketThresholds.buyThreshold) {
      verdict = 'BUY';
      confidence = 80;
      primaryReason = `Strong fundamentals with ${(fundamentals.cashOnCashReturn * 100).toFixed(1)}% return exceeding ${(adjustedHurdleRate * 100).toFixed(1)}% target`;
      secondaryReasons.push(`Cap rate of ${fundamentals.capRate.toFixed(1)}% exceeds ${marketIntelligenceAnalysis.marketTier.name} median (${(marketThresholds.marketMedianCapRate * 100).toFixed(1)}%)`);
      secondaryReasons.push(`Monthly cash flow: $${Math.round(mainMonthlyCashFlow)}`);
      
      // Add market intelligence insights
      if (marketIntelligenceAnalysis.marketInsights.length > 0) {
        secondaryReasons.push(marketIntelligenceAnalysis.marketInsights[0]); // Add first insight
      }
      
      if (leverageAnalysis.opportunityCost.capitalEfficiencyGap > 1.5) {
        secondaryReasons.push('Leverage optimization enables portfolio expansion');
      }
    }
    // Secondary BUY scenario: Exceptional cash flow even if slightly below hurdle rate
    else if (mainMonthlyCashFlow >= 1500 && fundamentals.capRate >= 0.05) {
      verdict = 'BUY';
      confidence = 75;
      primaryReason = `Exceptional cash flow of $${Math.round(mainMonthlyCashFlow)}/month with ${fundamentals.capRate.toFixed(1)}% cap rate`;
      secondaryReasons.push('Strong income generation offsets slightly lower returns');
      secondaryReasons.push(`Property offers ${(fundamentals.cashOnCashReturn * 100).toFixed(1)}% cash-on-cash return`);
    }
    // Tertiary BUY scenario: Good cash flow with market-appropriate pricing
    else if (hasPositiveCashFlow && mainMonthlyCashFlow >= 750 && 
             fundamentals.capRate >= (marketThresholds.marketMedianCapRate - 0.01) &&
             !priceAboveWalkAway) {
      verdict = 'BUY';
      confidence = 70;
      primaryReason = `Solid cash flow property with $${Math.round(mainMonthlyCashFlow)}/month income`;
      secondaryReasons.push(`${fundamentals.capRate.toFixed(1)}% cap rate near ${marketThresholds.marketMedianCapRate.toFixed(1)}% market median`);
      secondaryReasons.push('Price aligns with valuation models');
    }

    // ===== ENHANCED CONFIDENCE ADJUSTMENTS AND RISK ASSESSMENT =====
    
    // Apply property class confidence adjustments (Phase 2B)
    confidence = Math.max(20, Math.min(95, confidence + classRiskAdjustments.confidenceBoost));
    
    // Add property classification information to ALL verdicts (Phase 2B)
    secondaryReasons.push(`${propertyClassificationAnalysis.classification.classDescription} (${propertyClassificationAnalysis.classification.confidence}% classification confidence)`);
    
    // Add property class insights to secondary reasons
    if (propertyClassificationAnalysis.insights.length > 0) {
      secondaryReasons.push(...propertyClassificationAnalysis.insights.slice(0, 2));
    }
    
    // Phase 3: Add strategy alignment insights to secondary reasons
    if (strategyAlignmentAnalysis.insights.length > 0) {
      secondaryReasons.push(...strategyAlignmentAnalysis.insights.slice(0, 2));
    }
    
    // Phase 3: Apply strategy alignment confidence adjustments
    const strategyAlignment = strategyAlignmentAnalysis.alignment;
    if (strategyAlignment.alignmentScore < 60) {
      confidence = Math.max(30, confidence - 15);
      keyRisks.push('Strategy misalignment increases execution risk');
    } else if (strategyAlignment.alignmentScore >= 85) {
      confidence = Math.min(95, confidence + 5);
    }
    
    // Phase 3: Add strategy-specific risk factors
    const criticalMisalignments = strategyAlignment.misalignments.filter(
      m => m.severity === 'critical'
    );
    
    criticalMisalignments.forEach(misalignment => {
      keyRisks.push(misalignment.impact);
      if (misalignment.type === 'experience_risk') {
        confidence = Math.max(25, confidence - 20);
      }
    });
    
    // Add property class risk factors
    if (propertyClassificationAnalysis.classification.riskLevel === 'high' || 
        propertyClassificationAnalysis.classification.riskLevel === 'very_high') {
      keyRisks.push(`${propertyClassificationAnalysis.classification.classDescription} requires experienced management`);
    }
    
    if (propertyClassificationAnalysis.classification.managementIntensity === 'high') {
      keyRisks.push('High management intensity - budget for additional time and costs');
    }
    
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
    let propertyScore;
    try {
      propertyScore = this.calculatePropertyScore(fundamentals, marketContext, leverageAnalysis);
      logger.info('Property score calculated successfully:', { 
        propertyScore,
        fundamentalsExists: !!fundamentals,
        marketContextExists: !!marketContext,
        leverageAnalysisExists: !!leverageAnalysis 
      });
    } catch (scoreError) {
      logger.error('Error calculating property score, using fallback:', scoreError);
      propertyScore = 35; // Fallback score instead of potentially undefined
    }
    
    logger.info('Verdict generation complete:', {
      verdict,
      confidence: Math.round(confidence),
      propertyScore,
      cashFlow: fundamentals.cashFlow,
      capRate: fundamentals.capRate,
      dscr: fundamentals.dscr
    });
    
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