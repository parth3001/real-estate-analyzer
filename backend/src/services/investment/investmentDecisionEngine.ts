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
import { aiEnhancedMessagingService, AIEnhancedContent } from '../aiEnhancedMessaging';
import { sensitivityAnalysisService, SensitivityAnalysis } from './sensitivityAnalysisService';
import { taxCalculationService, TaxAnalysisResult, TaxProfile, PropertyTaxData } from '../taxCalculationService';

export type InvestmentVerdict = 'BUY' | 'PASS' | 'NEGOTIATE' | 'CAUTION'; // V3.0 adds CAUTION (50-64 score range)

// V3.0 Professional Assessment Interface
export interface ProfessionalAssessment {
  dealQuality: number; // 0-100 weighted score of deal fundamentals
  executionDifficulty: number; // 0-100 complexity of executing this investment
  dataReliability: number; // 0-100 confidence in input data quality

  // Factor breakdown (sum = 100%)
  cashFlowScore: number; // 35% weight - monthly income stability
  irrScore: number; // 25% weight - total return potential (pre-tax)
  marketStrengthScore: number; // 15% weight - market tier and trends
  debtStructureScore: number; // 10% weight - financing quality
  exitStrategyScore: number; // 10% weight - liquidity and exit options
  capRateScore: number; // 3% weight - current yield vs market
  propertyRiskScore: number; // 2% weight - property quality and age

  // Professional recommendations
  primaryInsight: string;
  strategicRecommendations: string[];
  riskMitigation: string[];
  opportunityMaximization: string[];

  // Enhanced debt structure analysis
  debtAnalysis?: {
    dscr: number;
    interestRate: number;
    marketSpread: number; // in basis points
    leverageRatio: number;
    loanTerm: number;
    isBalloonLoan: boolean;
    balloonYears?: number;
    riskFactors: string[];
    strengthFactors: string[];
  };

  // Tax Intelligence Enhancement (NEW)
  taxOptimization?: {
    afterTaxIRR: number; // After-tax IRR vs pre-tax IRR
    afterTaxDealQuality: number; // Tax-adjusted deal quality score
    optimalHoldPeriod: number; // Years to hold for optimal after-tax returns
    taxEfficiencyScore: number; // 0-100 how tax-efficient this investment is
    stateTaxAdvantage: boolean; // True if investor is in favorable tax state
    holdPeriodTaxSavings: number; // Dollar amount saved by holding optimal period vs year 1
    exchange1031Eligible: boolean; // True if eligible for 1031 exchange
    primaryTaxInsight: string; // Key tax optimization insight
    taxOptimizationRecommendations: string[]; // Tax-specific action items
  };
}

export interface InvestmentDecision {
  verdict: InvestmentVerdict;
  confidence: number; // 0-100 confidence in the verdict decision (LEGACY - deprecated)
  score: number; // 0-100 property quality score (LEGACY - deprecated)
  professionalAssessment?: ProfessionalAssessment; // V3.0 Professional Calibration
  primaryReason: string;
  secondaryReasons: string[];
  keyRisks: string[];
  actionPlan: ActionItem[];
  capitalStrategy: CapitalDeploymentAdvice;
  alternativeOptions: AlternativeInvestment[];
  marketContext: MarketContextAnalysis;
  timeline: InvestmentTimeline;
  goalContext?: GoalContext; // NEW: Goal context for frontend personalization
  portfolioContext?: PortfolioContext; // Portfolio Fit analysis
  confidenceDescription?: string; // Human-readable confidence explanation
  goalBasedReasoning?: string; // Explanation tied to user's specific goals
  aiEnhancedContent?: AIEnhancedContent; // AI-generated tab content (80/20 approach)
  sensitivityAnalysis?: SensitivityAnalysis; // Deal sensitivity analysis for negotiation intelligence
  taxAnalysis?: TaxAnalysisResult; // Tax Intelligence analysis with hold period optimization
}

export interface GoalContext {
  exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility?: 'flexible' | 'somewhat' | 'constrained' | 'independent';
  riskApproach?: 'conservative' | 'balanced' | 'aggressive' | 'opportunistic';
  capitalDeployment?: 'reinvest_re' | 'diversify' | 'lifestyle' | 'business' | 'debt';
  projectionYears?: number;
}

export interface PortfolioContext {
  fitScore: number; // 0-100 how well this property fits the portfolio strategy
  fitLevel: 'excellent' | 'good' | 'fair' | 'poor';
  fitAnalysis: string; // Detailed explanation of portfolio fit
  diversificationImpact: string; // How this adds to or reduces portfolio diversification
  riskContribution: 'reduces' | 'maintains' | 'increases'; // Impact on overall portfolio risk
  recommendations: string[]; // Portfolio-level recommendations
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
  private readonly HURDLE_RATE = 0.055; // 5.5% minimum return requirement (2025 calibration: reduced by 1%)
  private readonly TREASURY_RATE = 0.050; // 5.0% risk-free rate (2025 market reality)
  
  // V3.0 Professional Calibration Constants - Base weights for moderate risk tolerance
  private readonly PROFESSIONAL_WEIGHTS = {
    cashFlow: 0.35,      // 35% - Monthly income stability
    irr: 0.25,           // 25% - Total return potential
    marketStrength: 0.15, // 15% - Market tier and trends
    debtStructure: 0.10,  // 10% - Financing quality
    exitStrategy: 0.10,   // 10% - Liquidity and exit options
    capRate: 0.03,        // 3% - Current yield vs market
    propertyRisk: 0.02    // 2% - Property quality and age
  };
  
  private readonly IRR_THRESHOLDS = {
    poor: 0.04,      // 4% - Below investment grade (2025 market reality)
    fair: 0.06,      // 6% - Acceptable minimum return
    good: 0.08,      // 8% - Good professional standard
    excellent: 0.12  // 12% - Excellent professional standard (decimal format for consistency)
  };

  /**
   * Strategy-aware weights based on AI-enhanced user context
   * Adapts scoring to match investor risk tolerance and goals
   */
  private getStrategyAwareWeights(userContext: any) {
    const baseWeights = this.PROFESSIONAL_WEIGHTS;

    // Default to moderate (base weights) if no context or unknown risk tolerance
    if (!userContext || !userContext.riskTolerance) {
      console.log('🔍 STRATEGY WEIGHTS DEBUG: No userContext or riskTolerance, using base weights');
      return baseWeights;
    }

    console.log(`🔍 STRATEGY WEIGHTS DEBUG: Risk tolerance detected: ${userContext.riskTolerance}`);

    switch (userContext.riskTolerance) {
      case 'conservative':
        // Conservative investors prioritize cash flow stability and safety
        console.log('🔍 STRATEGY WEIGHTS DEBUG: Using CONSERVATIVE weights - cash flow emphasis');
        return {
          cashFlow: 0.45,        // +10% emphasis on monthly income stability
          debtStructure: 0.15,   // +5% emphasis on safe financing
          irr: 0.15,            // -10% de-emphasis on total return speculation
          marketStrength: 0.10,  // -5% de-emphasis on market timing
          exitStrategy: 0.10,    // Maintain liquidity importance
          capRate: 0.03,         // Maintain current yield focus
          propertyRisk: 0.02     // Maintain property quality focus
        };

      case 'aggressive':
        // Aggressive investors prioritize total returns and growth potential
        console.log('🔍 STRATEGY WEIGHTS DEBUG: Using AGGRESSIVE weights - IRR emphasis');
        return {
          irr: 0.35,            // +10% emphasis on total return potential
          marketStrength: 0.20,  // +5% emphasis on market opportunities
          cashFlow: 0.25,       // -10% de-emphasis on immediate cash flow
          debtStructure: 0.05,   // -5% de-emphasis on conservative financing
          exitStrategy: 0.10,    // Maintain exit strategy importance
          capRate: 0.03,         // Maintain current yield focus
          propertyRisk: 0.02     // Maintain property quality focus
        };

      case 'moderate':
      default:
        // Moderate investors use balanced approach (base weights)
        console.log('🔍 STRATEGY WEIGHTS DEBUG: Using MODERATE weights (base weights)');
        return baseWeights;
    }
  }
  private readonly MIN_RENT_TO_PRICE_RATIO = 0.0035; // 0.35% minimum (2025 adjustment: slightly more forgiving)
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
   * Map AI-extracted intent to enhanced user context for algorithmic decision making
   *
   * This bridges the AI extraction (Step 5 wizard) to the algorithmic engine,
   * maintaining the 80/20 rule: Algorithm decides, AI detects intent.
   */
  private mapAIIntentToUserContext(
    baseUserContext: {
      availableCash: number;
      experienceLevel: 'novice' | 'intermediate' | 'experienced';
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      investmentGoals: 'cash_flow' | 'appreciation' | 'balanced';
    },
    enhancedGoals?: any
  ): typeof baseUserContext {
    // Start with dropdown selections as base
    const enhanced = { ...baseUserContext };

    // Only apply AI overrides when we have high-confidence AI extraction
    if (!enhancedGoals?.strategicInsights?.length && !enhancedGoals?.riskAdjustments?.length) {
      logger.info('AI Intent Mapping: No AI insights available, using dropdown selections only');
      return enhanced;
    }

    logger.info('AI Intent Mapping: Processing AI-extracted insights', {
      originalRiskTolerance: baseUserContext.riskTolerance,
      originalInvestmentGoals: baseUserContext.investmentGoals,
      aiInsightsCount: enhancedGoals.strategicInsights?.length || 0,
      aiRiskAdjustments: enhancedGoals.riskAdjustments?.length || 0
    });

    // Combine all AI text for pattern detection
    const allAIText = [
      ...(enhancedGoals.strategicInsights || []),
      ...(enhancedGoals.riskAdjustments || []),
      enhancedGoals.aiEnhancedStrategy || '',
      enhancedGoals.freeTextStrategy || ''
    ].join(' ').toLowerCase();

    // Investment Goals Pattern Detection (AI intent → algorithm input)
    if (allAIText.includes('cash flow') ||
        allAIText.includes('monthly income') ||
        allAIText.includes('passive income') ||
        allAIText.includes('replace w2') ||
        allAIText.includes('rental income')) {
      enhanced.investmentGoals = 'cash_flow';
      logger.info('AI Intent Mapping: Detected cash flow focus strategy');
    }

    if (allAIText.includes('appreciation') ||
        allAIText.includes('growth') ||
        allAIText.includes('brrrr') ||
        allAIText.includes('equity buildup') ||
        allAIText.includes('wealth building') ||
        allAIText.includes('force appreciation')) {
      enhanced.investmentGoals = 'appreciation';
      logger.info('AI Intent Mapping: Detected appreciation focus strategy');
    }

    if (allAIText.includes('balanced') ||
        allAIText.includes('diversif') ||
        allAIText.includes('mix of') ||
        allAIText.includes('both cash flow and appreciation')) {
      enhanced.investmentGoals = 'balanced';
      logger.info('AI Intent Mapping: Detected balanced strategy');
    }

    // Risk Tolerance Refinement (AI insights → refined risk profile)
    const riskIndicators = enhancedGoals.riskAdjustments || [];
    const conservativeIndicators = riskIndicators.filter(risk =>
      risk.toLowerCase().includes('conservative') ||
      risk.toLowerCase().includes('safe') ||
      risk.toLowerCase().includes('low risk') ||
      risk.toLowerCase().includes('stability')
    );

    const aggressiveIndicators = riskIndicators.filter(risk =>
      risk.toLowerCase().includes('aggressive') ||
      risk.toLowerCase().includes('high risk') ||
      risk.toLowerCase().includes('leverage') ||
      risk.toLowerCase().includes('risky')
    );

    // Apply risk tolerance adjustments based on AI confidence
    if (conservativeIndicators.length > aggressiveIndicators.length && conservativeIndicators.length >= 2) {
      enhanced.riskTolerance = 'conservative';
      logger.info('AI Intent Mapping: Adjusted to conservative risk tolerance based on AI analysis');
    } else if (aggressiveIndicators.length > conservativeIndicators.length && aggressiveIndicators.length >= 2) {
      enhanced.riskTolerance = 'aggressive';
      logger.info('AI Intent Mapping: Adjusted to aggressive risk tolerance based on AI analysis');
    }

    // Experience Level Refinement (AI strategy complexity → experience adjustment)
    if (allAIText.includes('brrrr') ||
        allAIText.includes('syndication') ||
        allAIText.includes('1031 exchange') ||
        allAIText.includes('complex') ||
        allAIText.includes('portfolio') && enhanced.experienceLevel === 'novice') {
      enhanced.experienceLevel = 'intermediate';
      logger.info('AI Intent Mapping: Upgraded experience level based on strategy complexity');
    }

    logger.info('AI Intent Mapping: Final enhanced context', {
      enhancedRiskTolerance: enhanced.riskTolerance,
      enhancedInvestmentGoals: enhanced.investmentGoals,
      enhancedExperienceLevel: enhanced.experienceLevel,
      changesApplied: {
        riskChanged: enhanced.riskTolerance !== baseUserContext.riskTolerance,
        goalsChanged: enhanced.investmentGoals !== baseUserContext.investmentGoals,
        experienceChanged: enhanced.experienceLevel !== baseUserContext.experienceLevel
      }
    });

    return enhanced;
  }

  /**
   * V3.0 Professional Assessment - Replace penalty stacking with weighted scoring
   */
  private calculateProfessionalAssessment(
    fundamentals: any,
    marketIntelligenceAnalysis: any,
    propertyClassificationAnalysis: any,
    strategyAlignmentAnalysis: any,
    leverageAnalysis: any,
    propertyData: SFRData,
    userContext: any
  ): ProfessionalAssessment {
    console.log('🔍 PROFESSIONAL ASSESSMENT DEBUG: userContext received:', JSON.stringify(userContext, null, 2));
    const weights = this.getStrategyAwareWeights(userContext);
    const irrThresholds = this.IRR_THRESHOLDS;
    
    // 1. Cash Flow Score (strategy-aware weight) - Monthly income stability
    const monthlyNetCashFlow = fundamentals.cashFlow || 0;
    const cashFlowScore = this.scoreCashFlowStability(
      monthlyNetCashFlow,
      fundamentals.totalInvestment || propertyData.purchasePrice * 0.25,
      marketIntelligenceAnalysis.marketTier
    );
    
    // 2. IRR Score (strategy-aware weight) - Total return potential with 2025 reality
    const irr = fundamentals.irr || 0;
    const irrScore = this.scoreIRRPotential(irr, irrThresholds);
    
    // 3. Market Strength Score (strategy-aware weight)  
    const marketScore = this.scoreMarketStrength(
      marketIntelligenceAnalysis.marketTier,
      fundamentals.capRate,
      marketIntelligenceAnalysis.marketMedianCapRate
    );
    
    // 4. Debt Structure Score (10% weight) - Enhanced with detailed analysis
    const debtStructureResult = this.scoreDebtStructureWithAnalysis(
      leverageAnalysis.optimalScenario,
      fundamentals.dscr || 1.0
    );
    const debtScore = debtStructureResult.score;
    
    // 5. Exit Strategy Score (10% weight)
    const exitScore = this.scoreExitStrategy(
      strategyAlignmentAnalysis.alignment.alignmentScore,
      propertyData.exitStrategy?.primaryExitStrategy || 'sale'
    );
    
    // 6. Cap Rate Score (3% weight)
    const capRateScore = this.scoreCapRateCompetitiveness(
      fundamentals.capRate || 0,
      marketIntelligenceAnalysis.marketMedianCapRate
    );
    
    // 7. Property Risk Score (2% weight)  
    const propertyRiskScore = this.scorePropertyRisk(
      propertyClassificationAnalysis.classification,
      propertyData.yearBuilt || new Date().getFullYear() - 10
    );
    
    // Calculate weighted deal quality score (no penalty stacking!)
    const dealQuality = Math.round(
      (cashFlowScore * weights.cashFlow) +
      (irrScore * weights.irr) +
      (marketScore * weights.marketStrength) +  
      (debtScore * weights.debtStructure) +
      (exitScore * weights.exitStrategy) +
      (capRateScore * weights.capRate) +
      (propertyRiskScore * weights.propertyRisk)
    );
    
    // Execution difficulty (separate from deal quality)
    const executionDifficulty = this.assessExecutionDifficulty(
      propertyClassificationAnalysis.classification,
      userContext.experienceLevel || 'intermediate',
      strategyAlignmentAnalysis.alignment.misalignments
    );
    
    // Data reliability assessment
    const dataReliability = this.assessDataReliability(
      fundamentals,
      propertyData,
      marketIntelligenceAnalysis
    );
    
    // Generate professional insights
    const insights = this.generateProfessionalInsights(
      dealQuality,
      executionDifficulty,
      dataReliability,
      {
        cashFlowScore,
        irrScore,
        marketScore,
        debtScore,
        exitScore,
        capRateScore,
        propertyRiskScore
      }
    );
    
    return {
      dealQuality,
      executionDifficulty, 
      dataReliability,
      cashFlowScore,
      irrScore: irrScore,
      marketStrengthScore: marketScore,
      debtStructureScore: debtScore,
      exitStrategyScore: exitScore,
      capRateScore,
      propertyRiskScore,
      primaryInsight: insights.primary,
      strategicRecommendations: insights.strategic,
      riskMitigation: insights.riskMitigation,
      opportunityMaximization: insights.opportunities,
      debtAnalysis: debtStructureResult.analysis
    };
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
        capRatePremium: (riskAdjustments.capRatePremium * 10000).toFixed(0) + 'bps',
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
   * Get market tier from property address (2025 calibration helper)
   */
  private getMarketTierFromAddress(address?: { city?: string; state?: string }): 1 | 2 | 3 {
    if (!address?.city) return 3; // Default to Tier 3 if no address
    
    const city = address.city.toLowerCase();
    const state = address.state?.toLowerCase() || '';
    
    // Tier 1: Premium appreciation markets
    const tier1Cities = ['austin', 'san francisco', 'seattle', 'new york', 'los angeles', 
                        'boston', 'washington', 'san diego', 'denver', 'portland', 
                        'miami', 'san jose', 'honolulu', 'santa ana', 'oakland'];
    
    // Tier 2: Balanced growth markets  
    const tier2Cities = ['dallas', 'phoenix', 'atlanta', 'charlotte', 'nashville', 
                        'tampa', 'orlando', 'raleigh', 'salt lake city', 'minneapolis', 
                        'houston', 'chicago', 'philadelphia', 'detroit', 'cleveland'];
    
    if (tier1Cities.some(t1City => city.includes(t1City))) return 1;
    if (tier2Cities.some(t2City => city.includes(t2City))) return 2;
    
    return 3; // Default to Tier 3 for other cities
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
   * V2.1 LEGACY METHOD - DISABLED FOR V3.0
   * Calculate walk away price - maximum acceptable purchase price
   * V3.0 uses Deal Quality scoring instead of rigid price thresholds
   */
  private calculateWalkAwayPrice(propertyData: SFRData, analysis: any): number {
    // V2.1 LEGACY - This method is disabled in V3.0
    // V3.0 uses Professional Assessment Deal Quality scoring
    return propertyData.purchasePrice; // Return current price to avoid breaking existing calls
    
    /* V2.1 LEGACY CODE - COMMENTED OUT FOR V3.0
    const noi = analysis.keyMetrics?.noi || (propertyData.monthlyRent * 12 * 0.6); // Fallback NOI estimate
    const monthlyRent = propertyData.monthlyRent || 0;
    
    // 2025 Calibration: Market-intelligent spread based on market tier
    const marketTier = this.getMarketTierFromAddress(propertyData.propertyAddress);
    const intelligentSpread = marketTier === 1 ? 0.020 :   // Tier 1: 2% spread (7% target)
                             marketTier === 2 ? 0.025 :   // Tier 2: 2.5% spread (7.5% target)  
                             0.030;                       // Tier 3: 3% spread (8% target)
    
    const treasuryBasedPrice = noi / (this.TREASURY_RATE + intelligentSpread);
    
    // 2025 Calibration V2: More realistic rent multipliers for current market
    // The 1% rule is completely dead even in Tier 3 markets
    const adaptiveRentMultiplier = 
      marketTier === 1 ? (monthlyRent < 2500 ? 200 : 250) :  // Tier 1: 0.50%-0.40% rule
      marketTier === 2 ? (monthlyRent < 2000 ? 167 : 200) :  // Tier 2: 2.60%-0.50% rule
      (monthlyRent < 2000 ? 143 : 167);                      // Tier 3: 0.70%-0.60% rule
    const rentBasedCeiling = monthlyRent * adaptiveRentMultiplier;
    
    // Use actual comps or a more realistic discount from asking
    const comparablesCeiling = propertyData.purchasePrice * 1.05; // Allow up to 5% above asking if fundamentals support it
    
    // 2025 Calibration V2: Use more intelligent price selection
    // Don't blindly take minimum - consider market reality
    const baseWalkAway = rentBasedCeiling < treasuryBasedPrice * 0.7 ? 
      treasuryBasedPrice * 0.85 :  // If rent rule gives unrealistic price, use 85% of treasury
      Math.min(treasuryBasedPrice, rentBasedCeiling);
    
    // DEBUG: Add detailed logging to trace calculation
    logger.info('🔍 WALK AWAY PRICE CALCULATION DEBUG:', {
      noi,
      monthlyRent,
      marketTier,
      intelligentSpread: (intelligentSpread * 100).toFixed(1) + '%',
      treasuryRate: (this.TREASURY_RATE * 100).toFixed(1) + '%',
      combinedRate: ((this.TREASURY_RATE + intelligentSpread) * 100).toFixed(1) + '%',
      treasuryBasedPrice: Math.round(treasuryBasedPrice),
      adaptiveRentMultiplier,
      rentBasedCeiling: Math.round(rentBasedCeiling),
      comparablesCeiling: Math.round(comparablesCeiling),
      rentCeilingVsTreasuryCheck: rentBasedCeiling < treasuryBasedPrice * 0.7,
      treasurySeventyPercent: Math.round(treasuryBasedPrice * 0.7),
      calculatedBaseWalkAway: Math.round(baseWalkAway)
    });
    
    // If property has positive cash flow and decent cap rate, be less restrictive
    const capRate = analysis.keyMetrics?.capRate || 0;
    const monthlyCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    
    if (monthlyCashFlow > 500 && capRate > 0.05) {
      // Strong cash flow properties get more flexibility
      const finalPrice = Math.max(baseWalkAway, comparablesCeiling);
      logger.info('🔍 WALK AWAY PRICE - STRONG CASH FLOW OVERRIDE:', {
        monthlyCashFlow,
        capRate: capRate.toFixed(2) + '%',
        baseWalkAway: Math.round(baseWalkAway),
        comparablesCeiling: Math.round(comparablesCeiling),
        finalPrice: Math.round(finalPrice)
      });
      return finalPrice;
    }
    
    logger.info('🔍 WALK AWAY PRICE - FINAL RESULT:', {
      monthlyCashFlow,
      capRate: capRate.toFixed(2) + '%',
      meetsStrongCashFlowCriteria: false,
      finalWalkAwayPrice: Math.round(baseWalkAway)
    });
    
    return baseWalkAway;
    */ // End V2.1 legacy code block
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
    
    // 2025 Calibration: IRR-based buffer requirements
    const irr = analysis.keyMetrics?.irr || 0;
    const absoluteMinimum = irr > 0.15 ? 150 :  // High IRR = lower cash flow requirement
                            irr > 0.12 ? 200 :  // Good IRR = moderate requirement  
                            250;                // Standard IRR = reduced from 300 to 250
    
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

  // ===== V3.0 Professional Scoring Methods =====
  
  /**
   * Score cash flow stability (35% weight)
   * Professional standard: Monthly net income relative to investment and market
   */
  private scoreCashFlowStability(
    monthlyNetCashFlow: number,
    totalInvestment: number,
    marketTier: any
  ): number {
    if (monthlyNetCashFlow <= 0) return 0;
    
    // Calculate monthly return on investment
    const monthlyROI = monthlyNetCashFlow / totalInvestment;
    const annualROI = monthlyROI * 12;
    
    // Market-adjusted expectations (2025 reality)
    const tierExpectations = {
      1: { poor: 0.02, fair: 0.04, good: 0.06, excellent: 0.08 }, // Tier 1: Lower cash expectations
      2: { poor: 0.04, fair: 0.06, good: 0.08, excellent: 0.10 }, // Tier 2: Balanced
      3: { poor: 0.06, fair: 0.08, good: 0.10, excellent: 0.12 }  // Tier 3: Cash flow focus
    };
    
    const expectations = tierExpectations[marketTier.tier] || tierExpectations[2];
    
    if (annualROI >= expectations.excellent) return 100;
    if (annualROI >= expectations.good) return 85;
    if (annualROI >= expectations.fair) return 70;
    if (annualROI >= expectations.poor) return 50;
    return 25; // Below professional minimum
  }
  
  /**
   * Score IRR potential (25% weight)
   * 2025 Market Reality: 8% good, 12% excellent (realistic post-2022 standards)
   * Note: IRR is expected in percentage format (e.g., 12 for 12%)
   */
  private scoreIRRPotential(irr: number, thresholds: any): number {
    if (irr >= thresholds.excellent) return 100; // 12%+
    if (irr >= thresholds.good) return 85;       // 8-12%
    if (irr >= thresholds.fair) return 70;       // 6-8%  
    if (irr >= thresholds.poor) return 50;       // 4-6%
    return Math.max(0, (irr / thresholds.poor) * 50); // Below 4%
  }
  
  /**
   * Score market strength (15% weight)
   */
  private scoreMarketStrength(
    marketTier: any,
    propertyCapRate: number,
    marketMedianCapRate: number
  ): number {
    // Base score by market tier quality
    const tierScore = marketTier.tier === 1 ? 85 : marketTier.tier === 2 ? 70 : 55;
    
    // Adjust for property performance vs market
    const capRateAdvantage = propertyCapRate - marketMedianCapRate;
    const advantageScore = Math.max(-30, Math.min(30, capRateAdvantage * 1000)); // Convert to basis points effect
    
    return Math.max(0, Math.min(100, tierScore + advantageScore));
  }
  
  /**
   * Score debt structure quality (10% weight)
   * Enhanced with professional debt analysis: rates, terms, balloon risk
   */
  private scoreDebtStructure(optimalScenario: any, dscr: number): number {
    let score = 50; // Base score
    
    // 1. DSCR scoring (40% of debt score - most critical)
    if (dscr >= 1.5) score += 20;       // Excellent coverage
    else if (dscr >= 1.25) score += 15; // Good coverage  
    else if (dscr >= 1.1) score += 5;   // Adequate coverage
    else score -= 15; // Poor coverage
    
    // 2. Interest Rate Competitiveness (25% of debt score)
    const interestRate = optimalScenario.interestRate || 0.07;
    const currentTreasuryRate = 0.05; // 5% current rate
    const marketSpread = interestRate - currentTreasuryRate;
    
    if (marketSpread <= 0.015) score += 12;      // Excellent rate (150bps or less)
    else if (marketSpread <= 0.025) score += 8;  // Good rate (250bps or less)
    else if (marketSpread <= 0.035) score += 3;  // Market rate (350bps or less)
    else score -= 7; // High rate (over 350bps)
    
    // 3. Leverage Ratio Analysis (20% of debt score)
    const leverageRatio = optimalScenario.ltvRatio || 0.8;
    if (leverageRatio <= 0.70) score += 10;      // Conservative leverage - recession resilient
    else if (leverageRatio <= 0.75) score += 7;  // Prudent leverage
    else if (leverageRatio <= 0.80) score += 3;  // Standard leverage
    else if (leverageRatio <= 0.85) score -= 2;  // Aggressive leverage
    else score -= 8; // Very high leverage risk
    
    // 4. Loan Term Structure (10% of debt score)
    const loanTerm = optimalScenario.loanTermYears || 30;
    if (loanTerm >= 30) score += 5;              // Long-term stability
    else if (loanTerm >= 20) score += 3;         // Medium-term acceptable
    else if (loanTerm >= 15) score -= 2;         // Short-term refinancing risk
    else score -= 5; // High refinancing risk
    
    // 5. Balloon Payment Risk Assessment (5% of debt score)
    const isBalloonLoan = optimalScenario.isBalloonLoan || false;
    const balloonYears = optimalScenario.balloonPaymentYears || 0;
    
    if (!isBalloonLoan) {
      score += 2; // No balloon risk
    } else {
      if (balloonYears >= 10) score += 1;        // Long balloon acceptable
      else if (balloonYears >= 7) score -= 1;    // Medium balloon caution
      else if (balloonYears >= 5) score -= 3;    // Short balloon risky
      else score -= 5; // Very short balloon - high refinancing risk
    }
    
    // Professional debt structure insights
    let riskFactors = [];
    let strengthFactors = [];
    
    // Identify risk factors
    if (dscr < 1.25) riskFactors.push('DSCR below professional standard');
    if (leverageRatio > 0.8) riskFactors.push('High leverage increases interest rate risk');
    if (interestRate > 0.08) riskFactors.push('Above-market interest rate');
    if (isBalloonLoan && balloonYears < 7) riskFactors.push('Short balloon payment creates refinancing risk');
    
    // Identify strength factors  
    if (dscr >= 1.4) strengthFactors.push('Strong debt service coverage');
    if (leverageRatio <= 0.75) strengthFactors.push('Conservative leverage provides downside protection');
    if (marketSpread <= 0.02) strengthFactors.push('Competitive interest rate');
    if (!isBalloonLoan && loanTerm >= 30) strengthFactors.push('Long-term fixed debt eliminates refinancing risk');
    
    // Store analysis for insights (would be passed to decision object)
    const debtAnalysis = {
      dscr,
      interestRate,
      marketSpread: marketSpread * 100, // Convert to basis points
      leverageRatio,
      loanTerm,
      isBalloonLoan,
      balloonYears,
      riskFactors,
      strengthFactors,
      overallScore: Math.max(0, Math.min(100, score))
    };
    
    return debtAnalysis.overallScore;
  }

  /**
   * Enhanced debt structure scoring with detailed analysis
   * Returns both score and professional debt analysis
   */
  private scoreDebtStructureWithAnalysis(optimalScenario: any, dscr: number): {
    score: number;
    analysis: {
      dscr: number;
      interestRate: number;
      marketSpread: number;
      leverageRatio: number;
      loanTerm: number;
      isBalloonLoan: boolean;
      balloonYears?: number;
      riskFactors: string[];
      strengthFactors: string[];
    };
  } {
    let score = 50; // Base score
    
    // 1. DSCR scoring (40% of debt score - most critical)
    if (dscr >= 1.5) score += 20;       // Excellent coverage
    else if (dscr >= 1.25) score += 15; // Good coverage  
    else if (dscr >= 1.1) score += 5;   // Adequate coverage
    else score -= 15; // Poor coverage
    
    // 2. Interest Rate Competitiveness (25% of debt score)
    const interestRate = optimalScenario.interestRate || 0.07;
    const currentTreasuryRate = 0.05; // 5% current rate
    const marketSpread = interestRate - currentTreasuryRate;
    
    if (marketSpread <= 0.015) score += 12;      // Excellent rate (150bps or less)
    else if (marketSpread <= 0.025) score += 8;  // Good rate (250bps or less)
    else if (marketSpread <= 0.035) score += 3;  // Market rate (350bps or less)
    else score -= 7; // High rate (over 350bps)
    
    // 3. Leverage Ratio Analysis (20% of debt score)
    const leverageRatio = optimalScenario.ltvRatio || 0.8;
    if (leverageRatio <= 0.70) score += 10;      // Conservative leverage - recession resilient
    else if (leverageRatio <= 0.75) score += 7;  // Prudent leverage
    else if (leverageRatio <= 0.80) score += 3;  // Standard leverage
    else if (leverageRatio <= 0.85) score -= 2;  // Aggressive leverage
    else score -= 8; // Very high leverage risk
    
    // 4. Loan Term Structure (10% of debt score)
    const loanTerm = optimalScenario.loanTermYears || 30;
    if (loanTerm >= 30) score += 5;              // Long-term stability
    else if (loanTerm >= 20) score += 3;         // Medium-term acceptable
    else if (loanTerm >= 15) score -= 2;         // Short-term refinancing risk
    else score -= 5; // High refinancing risk
    
    // 5. Balloon Payment Risk Assessment (5% of debt score)
    const isBalloonLoan = optimalScenario.isBalloonLoan || false;
    const balloonYears = optimalScenario.balloonPaymentYears || 0;
    
    if (!isBalloonLoan) {
      score += 2; // No balloon risk
    } else {
      if (balloonYears >= 10) score += 1;        // Long balloon acceptable
      else if (balloonYears >= 7) score -= 1;    // Medium balloon caution
      else if (balloonYears >= 5) score -= 3;    // Short balloon risky
      else score -= 5; // Very short balloon - high refinancing risk
    }
    
    // Professional debt structure insights
    let riskFactors = [];
    let strengthFactors = [];
    
    // Identify risk factors
    if (dscr < 1.25) riskFactors.push('DSCR below professional standard');
    if (leverageRatio > 0.8) riskFactors.push('High leverage increases interest rate risk');
    if (interestRate > 0.08) riskFactors.push('Above-market interest rate');
    if (isBalloonLoan && balloonYears < 7) riskFactors.push('Short balloon payment creates refinancing risk');
    
    // Identify strength factors  
    if (dscr >= 1.4) strengthFactors.push('Strong debt service coverage');
    if (leverageRatio <= 0.75) strengthFactors.push('Conservative leverage provides downside protection');
    if (marketSpread <= 0.02) strengthFactors.push('Competitive interest rate');
    if (!isBalloonLoan && loanTerm >= 30) strengthFactors.push('Long-term fixed debt eliminates refinancing risk');
    
    const finalScore = Math.max(0, Math.min(100, score));
    
    return {
      score: finalScore,
      analysis: {
        dscr,
        interestRate,
        marketSpread: marketSpread * 10000, // Convert to basis points
        leverageRatio,
        loanTerm,
        isBalloonLoan,
        balloonYears: isBalloonLoan ? balloonYears : undefined,
        riskFactors,
        strengthFactors
      }
    };
  }
  
  /**
   * Score exit strategy alignment (10% weight)
   */
  private scoreExitStrategy(alignmentScore: number, exitStrategy: string): number {
    // Base score from strategy alignment
    let score = alignmentScore * 0.8; // Convert 0-100 alignment to 0-80
    
    // Bonus for liquid exit strategies
    if (exitStrategy === 'sale') score += 15;           // Most liquid
    else if (exitStrategy === 'refinance') score += 10; // Moderately liquid
    else if (exitStrategy === '1031exchange') score += 5; // Tax efficient
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Score cap rate competitiveness (3% weight)
   */
  private scoreCapRateCompetitiveness(propertyCapRate: number, marketMedian: number): number {
    const spread = propertyCapRate - marketMedian;
    
    // Convert spread to score (50 basis points = 10 points)
    // Fixed: Corrected multiplier to match comment - 50 bps (0.005) = 10 points, so multiplier = 2000
    const spreadScore = 50 + (spread * 2000); // 10 points per 50 bps as intended
    
    return Math.max(0, Math.min(100, spreadScore));
  }
  
  /**
   * Score property risk factors (2% weight)
   */
  private scorePropertyRisk(classification: any, yearBuilt: number): number {
    let score = 50; // Base score
    
    // Property class scoring
    if (classification.propertyClass === 'A') score += 40;
    else if (classification.propertyClass === 'B') score += 20;
    else score -= 20; // Class C penalty
    
    // Age scoring
    const age = new Date().getFullYear() - yearBuilt;
    if (age <= 10) score += 10;      // New property
    else if (age <= 20) score += 5;   // Modern property
    else if (age >= 40) score -= 15; // Old property risk
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Assess execution difficulty (separate from deal quality)
   */
  private assessExecutionDifficulty(
    classification: any,
    experienceLevel: string,
    misalignments: any[]
  ): number {
    let difficulty = 30; // Base difficulty
    
    // Experience vs property complexity
    const complexityMap = { 'A': 10, 'B': 30, 'C': 60 };
    const experienceMap = { 'novice': 0, 'intermediate': 25, 'experienced': 50, 'expert': 75 };
    
    const propertyComplexity = complexityMap[classification.propertyClass] || 30;
    const investorCapability = experienceMap[experienceLevel] || 25;
    
    difficulty = propertyComplexity + Math.max(0, 50 - investorCapability);
    
    // Misalignment complexity
    const criticalMisalignments = misalignments.filter(m => m.severity === 'critical').length;
    difficulty += criticalMisalignments * 15;
    
    return Math.max(0, Math.min(100, difficulty));
  }
  
  /**
   * Assess data reliability
   */
  private assessDataReliability(
    fundamentals: any,
    propertyData: SFRData,
    marketIntelligence: any
  ): number {
    let reliability = 80; // Base reliability
    
    // Required fields check
    if (!propertyData.monthlyRent) reliability -= 15;
    if (!propertyData.purchasePrice) reliability -= 15;
    if (!propertyData.yearBuilt) reliability -= 10;
    
    // Market data availability
    if (!marketIntelligence.marketTier) reliability -= 10;
    if (!fundamentals.capRate) reliability -= 10;
    
    // Reasonable value checks
    const rentToPrice = propertyData.monthlyRent / propertyData.purchasePrice;
    if (rentToPrice < 0.003 || rentToPrice > 0.02) reliability -= 15; // Suspicious ratios
    
    return Math.max(50, Math.min(100, reliability));
  }
  
  /**
   * Generate professional insights from scores
   */
  private generateProfessionalInsights(
    dealQuality: number,
    executionDifficulty: number,
    dataReliability: number,
    scores: any
  ): {
    primary: string;
    strategic: string[];
    riskMitigation: string[];
    opportunities: string[];
  } {
    // Primary insight based on overall assessment
    let primary = '';
    if (dealQuality >= 80) primary = 'Institutional-quality investment opportunity';
    else if (dealQuality >= 65) primary = 'Strong fundamentals with professional potential';  
    else if (dealQuality >= 50) primary = 'Acceptable deal requiring optimization';
    else primary = 'Below professional investment standards';
    
    const strategic: string[] = [];
    const riskMitigation: string[] = [];
    const opportunities: string[] = [];
    
    // Strategic recommendations based on factor scores
    if (scores.cashFlowScore < 60) {
      strategic.push('Negotiate rent increases or reduce purchase price');
      riskMitigation.push('Low cash flow increases execution risk');
    }
    
    if (scores.irrScore < 60) {
      strategic.push('Target longer hold period or value-add opportunities');
    }
    
    if (scores.debtScore < 60) {
      strategic.push('Improve loan terms or increase down payment');
      riskMitigation.push('Debt service coverage requires monitoring');
    }
    
    if (executionDifficulty > 70) {
      riskMitigation.push('High execution complexity - consider professional management');
    }
    
    if (dataReliability < 70) {
      riskMitigation.push('Verify all financial assumptions with documentation');
    }
    
    // Opportunity identification
    if (scores.marketScore > 75) {
      opportunities.push('Strong market position supports portfolio expansion');
    }
    
    if (scores.exitScore > 75) {
      opportunities.push('Multiple exit strategies provide flexibility');
    }
    
    return { primary, strategic, riskMitigation, opportunities };
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
    enhancedGoals?: any, // Enhanced goals from Step 5 for personalized messaging
    skipEnhancements: boolean = false // Skip AI content and sensitivity analysis for recursive calls
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

      // 2D. V3.0 Professional Assessment with AI-Enhanced Context
      // Bridge AI-extracted intent to algorithmic decision making (80/20 rule)
      console.log('🔧 QE DEBUG: About to call mapAIIntentToUserContext');
      console.log('🔧 QE DEBUG: Original userContext:', JSON.stringify(userContext, null, 2));
      console.log('🔧 QE DEBUG: Enhanced goals received:', JSON.stringify(enhancedGoals, null, 2));

      const enhancedUserContext = this.mapAIIntentToUserContext(userContext, enhancedGoals);

      console.log('🔧 QE DEBUG: Enhanced userContext result:', JSON.stringify(enhancedUserContext, null, 2));

      const professionalAssessment = this.calculateProfessionalAssessment(
        fundamentals,
        marketIntelligenceAnalysis,
        propertyClassificationAnalysis,
        strategyAlignmentAnalysis,
        leverageAnalysis,
        propertyData,
        enhancedUserContext  // Use AI-enhanced context instead of basic userContext
      );

      logger.info('V3.0 Professional Assessment Complete', {
        dealQuality: professionalAssessment.dealQuality,
        executionDifficulty: professionalAssessment.executionDifficulty,
        dataReliability: professionalAssessment.dataReliability,
        primaryInsight: professionalAssessment.primaryInsight,
        factorBreakdown: {
          cashFlow: professionalAssessment.cashFlowScore,
          irr: professionalAssessment.irrScore,
          market: professionalAssessment.marketStrengthScore,
          debt: professionalAssessment.debtStructureScore,
          exit: professionalAssessment.exitStrategyScore,
          capRate: professionalAssessment.capRateScore,
          propertyRisk: professionalAssessment.propertyRiskScore
        }
      });

      // DEPRECATED: Tax Intelligence Integration - Being replaced with educational approach
      // Feature flag to control tax optimization (disabled by default)
      const TAX_OPTIMIZATION_ENABLED = process.env.TAX_OPTIMIZATION_ENABLED === 'true';

      let taxAnalysis: TaxAnalysisResult | undefined;
      let taxEnhancedAssessment = professionalAssessment;

      // Only run tax analysis if explicitly enabled via feature flag
      if (TAX_OPTIMIZATION_ENABLED && propertyData.taxProfile) {
        logger.warn('Tax optimization is deprecated and will be removed. Using educational tax content instead.');

        // Legacy tax optimization code - DO NOT USE FOR NEW FEATURES
        // This code will be removed in the next release
        /*
        try {
          // Prepare tax calculation data
          const landRatio = propertyData.landValueRatio || 0.20;
          const propertyTaxData: PropertyTaxData = {
            purchasePrice: propertyData.purchasePrice,
            closingCosts: propertyData.closingCosts || 0,
            repairCosts: propertyData.repairCosts || 0,
            capitalInvestments: propertyData.capitalInvestments || 0,
            landValueRatio: landRatio,
            yearlyProjections: analysis.longTermAnalysis?.projections?.map((projection: any) => ({
              year: projection.year,
              propertyValue: projection.propertyValue,
              cashFlow: projection.cashFlow,
              principalPaydown: projection.principalPaidThisYear || 0,
              depreciation: (propertyData.purchasePrice * (1 - landRatio)) / 27.5
            })) || []
          };

          taxAnalysis = await taxCalculationService.calculateTaxAnalysis(
            propertyTaxData,
            propertyData.taxProfile
          );

          const taxOptimization = this.calculateTaxOptimization(taxAnalysis, professionalAssessment, propertyData);

          taxEnhancedAssessment = {
            ...professionalAssessment,
            taxOptimization
          };

          logger.info('Tax Intelligence: Legacy analysis complete (deprecated)', {
            optimalHoldPeriod: taxAnalysis.optimalHoldPeriod,
            afterTaxIRR: taxAnalysis.holdPeriodAnalysis.find(h => h.holdPeriod === taxAnalysis.optimalHoldPeriod)?.afterTaxIRR,
            taxSavings: taxAnalysis.totalTaxSavingsAtOptimal,
            exchange1031Eligible: taxAnalysis.exchange1031Eligibility?.eligible
          });

        } catch (error) {
          logger.warn('Tax Intelligence: Legacy analysis failed', error);
        }
        */
      } else if (propertyData.taxProfile) {
        logger.info('Tax profile detected but optimization disabled. Educational tax content will be available separately.');
      }

      // V3.0 VERDICT MAPPING: Use Tax-Enhanced Professional Assessment Deal Quality as single source of truth
      let v3Verdict: InvestmentVerdict;
      let v3PrimaryReason: string;

      const dealQuality = taxEnhancedAssessment.dealQuality;
      if (dealQuality >= 80) {
        v3Verdict = 'BUY';
        v3PrimaryReason = `Institutional-quality deal with ${dealQuality}/100 professional score`;
      } else if (dealQuality >= 65) {
        v3Verdict = 'NEGOTIATE';
        v3PrimaryReason = `Strong fundamentals (${dealQuality}/100) - negotiate for optimal terms`;
      } else if (dealQuality >= 50) {
        v3Verdict = 'CAUTION';
        v3PrimaryReason = `Acceptable deal (${dealQuality}/100) requiring optimization`;
      } else {
        v3Verdict = 'PASS';
        v3PrimaryReason = `Below professional standards (${dealQuality}/100) - seek better opportunities`;
      }
      
      // V3.0 CONFIDENCE CALCULATION: Independent from Deal Quality, based on analysis certainty
      let v3Confidence = this.calculateAnalysisConfidence(
        taxEnhancedAssessment,
        marketIntelligence,
        fundamentals,
        propertyData,
        analysis
      );
      
      logger.info('V3.0 Verdict Mapping Applied', {
        dealQuality: `${dealQuality}/100`,
        v3Verdict,
        v3Confidence,
        v3PrimaryReason
      });

      // 3. Analyze market context (legacy + enhanced)
      const marketContext = await this.analyzeMarketContext(
        analysis, 
        marketIntelligence, 
        predictions,
        propertyData
      );

      // 4. Use V3.0 Professional Assessment verdict (single source of truth)
      const verdict = {
        verdict: v3Verdict,
        confidence: v3Confidence,
        primaryReason: v3PrimaryReason,
        secondaryReasons: [taxEnhancedAssessment.primaryInsight],
        keyRisks: taxEnhancedAssessment.riskMitigation.slice(0, 3), // Top 3 risks
        score: dealQuality // Add Deal Quality as the score for legacy compatibility
      };

      // 5. Create action plan
      const actionPlan = this.createActionPlan(
        verdict,
        leverageAnalysis,
        fundamentals,
        enhancedUserContext
      );

      // 6. Develop capital strategy
      const capitalStrategy = this.developCapitalStrategy(
        leverageAnalysis,
        enhancedUserContext,
        propertyData.purchasePrice
      );

      // 7. Identify alternatives
      const alternativeOptions = this.identifyAlternatives(
        verdict,
        fundamentals,
        marketContext,
        enhancedUserContext
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

      // Generate portfolio context for portfolio fit analysis
      const portfolioContext = this.generatePortfolioContext(propertyData, fundamentals, verdict.verdict, enhancedUserContext);

      // Generate AI-enhanced goal reasoning (V3.0 80/20 Architecture)
      let goalBasedReasoning: string;
      try {
        goalBasedReasoning = await aiEnhancedMessagingService.generatePersonalizedGoalReasoning(
          { verdict: verdict.verdict, professionalAssessment } as InvestmentDecision,
          analysis,
          propertyData
        );
      } catch (error) {
        logger.warn('AI goal-based reasoning failed, using fallback', error);
        goalBasedReasoning = this.getGoalBasedReasoning(verdict.verdict, propertyData, fundamentals, enhancedGoals, professionalAssessment);
      }

      const decision: InvestmentDecision = {
        verdict: verdict.verdict,
        confidence: verdict.confidence, // LEGACY - maintained for backwards compatibility
        score: verdict.score, // LEGACY - property quality score
        professionalAssessment: taxEnhancedAssessment, // V3.0 Professional Calibration (tax optimization removed)
        primaryReason: verdict.primaryReason,
        secondaryReasons: verdict.secondaryReasons,
        keyRisks: verdict.keyRisks,
        actionPlan,
        capitalStrategy,
        alternativeOptions,
        marketContext,
        timeline,
        goalContext, // NEW: Include goal context for frontend
        portfolioContext, // Portfolio Fit analysis
        confidenceDescription: this.getConfidenceDescription(verdict.verdict, verdict.confidence),
        goalBasedReasoning
        // taxAnalysis REMOVED - Tax optimization deprecated in favor of educational content
      };

      const processingTime = Date.now() - startTime;
      logger.info('Investment Decision Engine: Decision generated (V3.0 Professional Calibration)', {
        processingTime: `${processingTime}ms`,
        verdict: decision.verdict,
        legacyConfidence: `${decision.confidence}%`, // Old penalty stacking system
        legacyScore: decision.score, // Old property score
        professionalAssessment: {
          dealQuality: `${professionalAssessment.dealQuality}/100`,
          executionDifficulty: `${professionalAssessment.executionDifficulty}/100`,
          dataReliability: `${professionalAssessment.dataReliability}/100`,
          primaryInsight: professionalAssessment.primaryInsight
        },
        primaryReason: decision.primaryReason,
        v3Enhancement: 'Professional weighted scoring replaces penalty stacking'
      });

      // Generate AI-enhanced content and sensitivity analysis (skip for recursive calls)
      if (!skipEnhancements) {
        // Generate AI-enhanced content (20% of 80/20 approach)
        try {
          logger.info('Generating AI-enhanced tab content');
          // FIXED: Pass propertyData to AI service so it has access to original input data
          const aiEnhancedContent = await aiEnhancedMessagingService.generateAllContent(decision, analysis, propertyData);
          decision.aiEnhancedContent = aiEnhancedContent;
          logger.info('AI-enhanced content generation completed');
        } catch (error) {
          logger.warn('AI-enhanced content generation failed, using fallback', error);
          // Fallback is handled within the AI service
        }

        // Generate sensitivity analysis for negotiation intelligence
        try {
          logger.info('Generating sensitivity analysis for negotiation intelligence');
          const sensitivityAnalysis = await sensitivityAnalysisService.generateSensitivityAnalysis(
            propertyData, analysis, predictions, marketIntelligence, enhancedUserContext, enhancedGoals, this
          );
          decision.sensitivityAnalysis = sensitivityAnalysis;
          logger.info('Sensitivity analysis generation completed');
        } catch (error) {
          logger.warn('Sensitivity analysis generation failed:', error);
          // Continue without sensitivity analysis - it's not critical for basic decision
        }
      }

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
   * V3.0 Calculate analysis confidence independent from Deal Quality
   * Confidence measures certainty in our analysis, not property quality
   */
  private calculateAnalysisConfidence(
    professionalAssessment: ProfessionalAssessment,
    marketIntelligence: any,
    fundamentals: any,
    propertyData: SFRData,
    analysis: any
  ): number {
    let baseConfidence = 75; // Start with moderate confidence
    
    // Factor 1: Data Quality & Completeness (0-20 points adjustment)
    let dataQualityScore = 0;
    
    // Required property data completeness
    if (propertyData.purchasePrice > 0) dataQualityScore += 3;
    if (propertyData.monthlyRent > 0) dataQualityScore += 3;
    if (propertyData.downPayment > 0) dataQualityScore += 2;
    if (propertyData.propertyTaxRate > 0) dataQualityScore += 2;
    
    // Market data availability
    if (marketIntelligence?.marketTrends?.averageRent) dataQualityScore += 3;
    if (marketIntelligence?.economicIndicators?.medianHomePrice) dataQualityScore += 3;
    if (marketIntelligence?.marketData?.capRates?.length > 0) dataQualityScore += 2;
    if (marketIntelligence?.marketData?.demographics) dataQualityScore += 2;
    
    baseConfidence += Math.min(20, dataQualityScore);
    
    // Factor 2: Input Validation Results (0-15 points adjustment)
    let validationScore = 0;
    
    // Property fundamentals validation
    const rentToPriceRatio = (propertyData.monthlyRent * 12) / propertyData.purchasePrice;
    if (rentToPriceRatio >= 0.005 && rentToPriceRatio <= 0.02) validationScore += 5; // Reasonable range
    else validationScore -= 5; // Suspicious ratio
    
    // Operating expense validation
    const operatingExpenseRatio = fundamentals?.operatingExpenseRatio || 0;
    if (operatingExpenseRatio >= 0.25 && operatingExpenseRatio <= 0.55) validationScore += 5; // Reasonable range
    else validationScore -= 5; // Suspicious expenses
    
    // Cash flow reasonableness
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    const grossRent = propertyData.monthlyRent || 0;
    if (grossRent > 0) {
      const cashFlowRatio = Math.abs(cashFlow) / grossRent;
      if (cashFlowRatio <= 0.8) validationScore += 5; // Reasonable cash flow vs rent
      else validationScore -= 5; // Suspicious cash flow
    }
    
    baseConfidence += Math.min(15, validationScore);
    
    // Factor 3: Market Context Certainty (0-10 points adjustment) 
    let marketContextScore = 0;
    
    // Market tier confidence
    if (marketIntelligence?.marketTier?.tier) {
      marketContextScore += 3; // We have market tier classification
    }
    
    // Economic data availability
    if (marketIntelligence?.economicIndicators?.unemployment !== undefined) marketContextScore += 2;
    if (marketIntelligence?.economicIndicators?.populationGrowth !== undefined) marketContextScore += 2;
    if (marketIntelligence?.marketTrends?.priceGrowth !== undefined) marketContextScore += 3;
    
    baseConfidence += Math.min(10, marketContextScore);
    
    // Factor 4: Analysis Complexity Penalty (0-10 points reduction)
    let complexityPenalty = 0;
    
    // Unusual property characteristics reduce confidence
    if (propertyData.yearBuilt && (new Date().getFullYear() - propertyData.yearBuilt) > 50) complexityPenalty += 3;
    if (fundamentals?.dscr && fundamentals.dscr < 1.1) complexityPenalty += 3;
    if (operatingExpenseRatio > 0.60 || operatingExpenseRatio < 0.20) complexityPenalty += 4;
    
    baseConfidence -= Math.min(10, complexityPenalty);
    
    // Factor 5: Professional Assessment Internal Consistency (0-5 points adjustment)
    let consistencyScore = 0;
    
    // Check if component scores align with overall assessment
    const avgComponentScore = (
      professionalAssessment.cashFlowScore + 
      professionalAssessment.irrScore + 
      professionalAssessment.marketStrengthScore + 
      professionalAssessment.debtStructureScore + 
      professionalAssessment.exitStrategyScore + 
      professionalAssessment.capRateScore + 
      professionalAssessment.propertyRiskScore
    ) / 7;
    
    const scoreDifference = Math.abs(professionalAssessment.dealQuality - avgComponentScore);
    if (scoreDifference <= 5) consistencyScore += 5; // High consistency
    else if (scoreDifference <= 10) consistencyScore += 2; // Moderate consistency
    else consistencyScore -= 3; // Poor consistency reduces confidence
    
    baseConfidence += consistencyScore;
    
    // Ensure confidence stays within reasonable bounds (30-95)
    return Math.max(30, Math.min(95, Math.round(baseConfidence)));
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
    
    if (verdict === 'CAUTION') {
      if (confidence >= 70) return 'Acceptable deal requiring strategic optimization';
      if (confidence >= 50) return 'Consider with specific investment strategy alignment';
      return 'Marginal deal - evaluate alternatives first';
    }
    
    // PASS verdict
    if (confidence >= 80) return 'Strong indicators against this investment';
    if (confidence >= 65) return 'Multiple concerns outweigh benefits';
    if (confidence >= 40) return 'May work for specific strategies but has significant risks';
    // 30% or below
    return 'Too many serious risk factors to recommend this investment';
  }

  /**
   * Generate strategy-aware personalized message templates
   * 80/20 Architecture: Algorithm decides (dealQuality), messaging personalizes
   */
  private getPersonalizedMessageTemplate(
    verdict: InvestmentVerdict,
    dealQuality: number,
    riskTolerance: string,
    timelineDisplayText: string,
    investmentGoal: string,
    fundamentals: any
  ): string {
    const capRate = fundamentals.capRate.toFixed(1);
    const cashFlow = Math.round(fundamentals.cashFlow);

    // Strategy-aware thresholds based on risk tolerance
    const getThresholds = (riskTolerance: string) => {
      switch (riskTolerance) {
        case 'conservative': return { good: 65, acceptable: 50 };
        case 'moderate': return { good: 60, acceptable: 45 };
        case 'aggressive': return { good: 55, acceptable: 40 };
        default: return { good: 60, acceptable: 45 };
      }
    };

    const thresholds = getThresholds(riskTolerance);

    // Generate persona-specific messaging based on actual deal quality score
    const verdictStr = verdict.toString();
    if (verdictStr === 'PASS' || verdictStr === 'CAUTION') {
      if (dealQuality >= thresholds.acceptable) {
        // Marginal deal - persona affects advice
        switch (riskTolerance) {
          case 'conservative':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality suggests seeking safer opportunities with stronger cash flow buffers and lower risk exposure.`;
          case 'moderate':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality requires careful evaluation of market timing risks and potential for improvement.`;
          case 'aggressive':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality shows acceptable risk for aggressive growth strategies, but significant price reduction would improve prospects.`;
          default:
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality requires careful risk assessment.`;
        }
      } else {
        // Poor deal - universal avoid but different reasoning
        switch (riskTolerance) {
          case 'conservative':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality falls well below conservative investment standards. Seek properties with stronger fundamentals and safety margins.`;
          case 'moderate':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality indicates excessive risk relative to potential returns. Better balanced opportunities available.`;
          case 'aggressive':
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality suggests poor fundamentals that even aggressive risk tolerance cannot justify. Pass and seek better opportunities.`;
          default:
            return `With your ${timelineDisplayText} ${investmentGoal} strategy, this property's ${dealQuality}/100 deal quality is below investment standards.`;
        }
      }
    }

    if (verdictStr === 'BUY') {
      switch (riskTolerance) {
        case 'conservative':
          return `Excellent match for your ${timelineDisplayText} ${investmentGoal} strategy. This property's ${dealQuality}/100 deal quality provides strong safety margins and reliable returns that align with conservative investment principles.`;
        case 'moderate':
          return `Strong opportunity for your ${timelineDisplayText} ${investmentGoal} strategy. This property's ${dealQuality}/100 deal quality offers balanced risk-return profile with solid fundamentals and growth potential.`;
        case 'aggressive':
          return `Outstanding potential for your ${timelineDisplayText} ${investmentGoal} strategy. This property's ${dealQuality}/100 deal quality justifies aggressive positioning with excellent growth prospects relative to risk.`;
        default:
          return `Strong opportunity for your ${timelineDisplayText} ${investmentGoal} strategy with ${dealQuality}/100 deal quality.`;
      }
    }

    if (verdictStr === 'NEGOTIATE') {
      switch (riskTolerance) {
        case 'conservative':
          return `This property could work for your ${timelineDisplayText} ${investmentGoal} strategy with significant improvements. Current ${dealQuality}/100 deal quality requires price reduction to meet conservative safety standards.`;
        case 'moderate':
          return `Potential fit for your ${timelineDisplayText} ${investmentGoal} strategy with right adjustments. Current ${dealQuality}/100 deal quality needs optimization to balance risk and return appropriately.`;
        case 'aggressive':
          return `Viable opportunity for your ${timelineDisplayText} ${investmentGoal} strategy with strategic negotiation. Current ${dealQuality}/100 deal quality can be improved to maximize aggressive growth potential.`;
        default:
          return `This property could work for your ${timelineDisplayText} ${investmentGoal} strategy with price adjustments to improve the ${dealQuality}/100 deal quality.`;
      }
    }

    // Fallback with persona consideration
    const meetsCriteria = verdictStr === 'BUY' || verdictStr === 'NEGOTIATE' ? 'aligns with' : 'does not meet';
    return `Based on your ${riskTolerance} approach to ${investmentGoal} investing over ${timelineDisplayText}, this property's ${dealQuality}/100 deal quality ${meetsCriteria} your investment criteria.`;
  }

  /**
   * Generate goal-based reasoning explanation with strategy-aware messaging
   * Enhanced to use 80/20 architecture: Algorithm decides, messaging personalizes
   */
  private getGoalBasedReasoning(
    verdict: InvestmentVerdict,
    propertyData: SFRData,
    fundamentals: any,
    enhancedGoals: any,
    professionalAssessment?: any
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

    // Extract risk tolerance for strategy-aware messaging
    const riskTolerance = enhancedGoals?.riskTolerance || 'moderate';

    // Get deal quality score from professional assessment (80% algorithmic foundation)
    const dealQuality = professionalAssessment?.dealQuality || 50;

    logger.info('Strategy-aware goal-based reasoning context:', {
      verdict,
      dealQuality,
      riskTolerance,
      strategicHoldPeriod,
      timelineDisplayText,
      financialProjectionYears,
      exitStrategy,
      investmentGoal,
      capRate: fundamentals.capRate.toFixed(1) + '%',
      cashFlow: Math.round(fundamentals.cashFlow)
    });

    // 80/20 Architecture: Use algorithmic deal quality to drive personalized messaging (20%)
    return this.getPersonalizedMessageTemplate(
      verdict,
      dealQuality,
      riskTolerance,
      timelineDisplayText,
      investmentGoal,
      fundamentals
    );
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
    
    // V2.1 walk-away price calculation removed - V3.0 uses Deal Quality scoring
    
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
    // V2.1 walk-away price check removed - V3.0 uses Deal Quality scoring
    const hasLeverageOptions = leverageAnalysis.optimalScenario.leverageScore > 60;
    
    // CRITICAL: Log to ensure we're using updated analysis data
    logger.info('Investment Decision: Using latest analysis data', {
      currentCashFlow: mainMonthlyCashFlow,
      analysisTimestamp: analysis?.timestamp || 'unknown',
      fundamentalsCashFlow: fundamentals?.cashFlow || 'not provided',
      hasPositiveCashFlow,
      capRate: fundamentals.capRate,
      cashOnCashReturn: fundamentals.cashOnCashReturn
    });
    
    logger.info('Investment Decision: Enhanced analysis with Phase 2A + 2B', {
      mainMonthlyCashFlow,
      adjustedHurdleRate: adjustedHurdleRate.toFixed(1) + '%',
      // Phase 2A - Market Intelligence
      marketTier: marketIntelligenceAnalysis.marketTier.tier,
      marketTierName: marketIntelligenceAnalysis.marketTier.name,
      marketMedianCapRate: marketThresholds.marketMedianCapRate.toFixed(1) + '%',
      fairMarketValue: marketIntelligenceAnalysis.fairMarketValue?.fairValue,
      overpriced: marketIntelligenceAnalysis.fairMarketValue?.overpriced,
      overpricedBy: marketIntelligenceAnalysis.fairMarketValue?.overpricedBy,
      // Phase 2B - Property Classification
      propertyClass: propertyClassificationAnalysis.classification.propertyClass,
      classConfidence: propertyClassificationAnalysis.classification.confidence + '%',
      riskLevel: propertyClassificationAnalysis.classification.riskLevel,
      managementIntensity: propertyClassificationAnalysis.classification.managementIntensity,
      capRateAdjustment: (classRiskAdjustments.capRatePremium * 10000).toFixed(0) + 'bps',
      confidenceAdjustment: classRiskAdjustments.confidenceBoost,
      // General metrics
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
    // V3.0 CHANGE: Walk-away price override DISABLED - Professional weighted scoring is the single source of truth
    // The rigid walk-away price logic was replaced by sophisticated risk/reward balance optimization
    // else if (priceAboveWalkAway) {
    //   verdict = 'PASS';
    //   confidence = 85;
    //   primaryReason = `Purchase price exceeds maximum acceptable value of $${Math.round(walkAwayPrice).toLocaleString()}`;
    //   secondaryReasons.push('Price fails multiple valuation methodologies');
    //   keyRisks.push('Overpaying reduces returns and increases downside risk');
    // }
    
    // 3. Cap rate significantly below market (enhanced with market tier + property class intelligence)
    else if (capRateBelowMarket) {
      verdict = 'PASS';
      confidence = 80;
      primaryReason = `Cap rate of ${fundamentals.capRate.toFixed(1)}% is ${((finalMarketThresholds.passThreshold - fundamentals.capRate) * 100).toFixed(0)}bps below ${marketIntelligenceAnalysis.marketTier.name} threshold`;
      secondaryReasons.push(`${marketIntelligenceAnalysis.cityName}, ${marketIntelligenceAnalysis.stateName} market median: ${finalMarketThresholds.marketMedianCapRate.toFixed(1)}%`);
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
      
      secondaryReasons.push(`Current cap rate: ${fundamentals.capRate.toFixed(1)}% vs ${marketIntelligenceAnalysis.marketTier.name} median: ${finalMarketThresholds.marketMedianCapRate.toFixed(1)}%`);
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
      
      primaryReason = `Positive cash flow but ${(adjustedHurdleRate - fundamentals.cashOnCashReturn).toFixed(1)}% below return target`;
      secondaryReasons.push(`Negotiate $${priceReduction.toLocaleString()} reduction to meet ${adjustedHurdleRate.toFixed(1)}% return goal`);
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
      primaryReason = `Strong fundamentals with ${fundamentals.cashOnCashReturn.toFixed(1)}% return exceeding ${adjustedHurdleRate.toFixed(1)}% target`;
      secondaryReasons.push(`Cap rate of ${fundamentals.capRate.toFixed(1)}% exceeds ${marketIntelligenceAnalysis.marketTier.name} median (${marketThresholds.marketMedianCapRate.toFixed(1)}%)`);
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
      secondaryReasons.push(`Property offers ${fundamentals.cashOnCashReturn.toFixed(1)}% cash-on-cash return`);
    }
    // Tertiary BUY scenario: Good cash flow with market-appropriate pricing
    else if (hasPositiveCashFlow && mainMonthlyCashFlow >= 750 && 
             fundamentals.capRate >= (marketThresholds.marketMedianCapRate - 0.01) &&
             true) { // V2.1 walk-away price condition removed
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
    
    // 2025 Calibration: Apply professional investor override logic
    const professionalOverride = this.applyProfessionalOverride({
      verdict,
      confidence,
      primaryReason,
      secondaryReasons,
      keyRisks
    }, analysis, fundamentals);
    
    verdict = professionalOverride.verdict;
    confidence = professionalOverride.confidence;
    primaryReason = professionalOverride.primaryReason;
    secondaryReasons = professionalOverride.secondaryReasons;
    keyRisks = professionalOverride.keyRisks;
    
    logger.info('Verdict generation complete (with 2025 calibration):', {
      verdict,
      confidence: Math.round(confidence),
      propertyScore,
      cashFlow: fundamentals.cashFlow,
      capRate: fundamentals.capRate,
      dscr: fundamentals.dscr,
      professionalOverrideApplied: verdict !== professionalOverride.verdict
    });
    
    // Deduplicate secondary reasons and key risks to prevent repetitive messages
    const deduplicateMessages = (messages: string[]): string[] => {
      const seen = new Set<string>();
      const result: string[] = [];
      
      for (const msg of messages) {
        // Normalize message for comparison (lowercase, trim)
        const normalized = msg.toLowerCase().trim();
        
        // Skip if we've seen this exact message
        if (seen.has(normalized)) continue;
        
        // Skip if a similar message exists (check for substring matches)
        let isDuplicate = false;
        for (const existing of seen) {
          if (normalized.includes('expense ratio') && existing.includes('expense ratio')) {
            isDuplicate = true;
            break;
          }
          if (normalized.includes('overpaying') && existing.includes('overpaying')) {
            isDuplicate = true;
            break;
          }
          if (normalized.includes('price fails') && existing.includes('price fails')) {
            isDuplicate = true;
            break;
          }
        }
        
        if (!isDuplicate) {
          seen.add(normalized);
          result.push(msg);
        }
      }
      
      return result;
    };
    
    const finalResult = {
      verdict,
      confidence: Math.round(confidence),
      score: propertyScore,
      primaryReason,
      secondaryReasons: deduplicateMessages(secondaryReasons),
      keyRisks: deduplicateMessages(keyRisks)
    };

    // DEBUG: Log what we're sending to frontend
    logger.info('🔍 INVESTMENT DECISION - FINAL MESSAGES BEING SENT:', {
      verdict: finalResult.verdict,
      confidence: finalResult.confidence,
      primaryReason: finalResult.primaryReason,
      secondaryReasons: finalResult.secondaryReasons,
      keyRisks: finalResult.keyRisks,
      secondaryReasonsCount: finalResult.secondaryReasons.length,
      keyRisksCount: finalResult.keyRisks.length
    });

    return finalResult;
  }

  /**
   * Apply professional investor override logic (2025 calibration)
   */
  private applyProfessionalOverride(
    verdictData: {
      verdict: InvestmentVerdict;
      confidence: number;
      primaryReason: string;
      secondaryReasons: string[];
      keyRisks: string[];
    },
    analysis: any,
    fundamentals: any
  ) {
    const irr = fundamentals.irr || 0;
    const monthlyFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    const capRate = fundamentals.capRate || 0;
    
    let { verdict, confidence, primaryReason, secondaryReasons, keyRisks } = verdictData;
    
    // Override 1: High IRR exceptional deals (15%+ IRR)
    if (verdict === 'NEGOTIATE' && 
        irr >= 0.15 && 
        monthlyFlow >= 150) {
      
      verdict = 'BUY';
      confidence = Math.min(85, confidence + 10);
      primaryReason = `Exceptional ${irr.toFixed(1)}% IRR justifies investment despite modest cash flow`;
      secondaryReasons.unshift('2025 Calibration: Professional investors prioritize total returns over monthly minimums');
      
      logger.info('Professional Override Applied: High IRR Deal', {
        originalVerdict: 'NEGOTIATE',
        newVerdict: 'BUY',
        irr: irr.toFixed(1) + '%',
        monthlyFlow,
        reason: 'High IRR Override'
      });
    }
    
    // Override 2a: Very high IRR with positive cash flow (18%+ IRR)
    else if (verdict === 'PASS' && 
             irr >= 0.18 && 
             monthlyFlow > 0) {
      
      verdict = 'NEGOTIATE';
      confidence = 75;
      primaryReason = `Extraordinary ${irr.toFixed(1)}% IRR with positive cash flow - negotiate price for better returns`;
      secondaryReasons.unshift('2025 Calibration: Exceptional returns with positive cash flow justify aggressive negotiation');
      
      logger.info('Professional Override Applied: Extraordinary IRR + Positive Cash Flow', {
        originalVerdict: 'PASS',
        newVerdict: 'NEGOTIATE',
        irr: irr.toFixed(1) + '%',
        monthlyFlow,
        reason: 'Extraordinary IRR + Positive Cash Flow Override'
      });
    }
    
    // Override 2b: Very high IRR with minimal negative cash flow (18%+ IRR)
    else if (verdict === 'PASS' && 
             irr >= 0.18 && 
             monthlyFlow >= -200 && 
             monthlyFlow <= 0) {
      
      verdict = 'NEGOTIATE';
      confidence = 70;
      primaryReason = `Extraordinary ${irr.toFixed(1)}% IRR warrants negotiation despite negative cash flow`;
      secondaryReasons.unshift('2025 Calibration: Exceptional returns can justify modest monthly contribution in professional portfolios');
      
      logger.info('Professional Override Applied: Extraordinary IRR + Negative Cash Flow', {
        originalVerdict: 'PASS',
        newVerdict: 'NEGOTIATE',
        irr: irr.toFixed(1) + '%',
        monthlyFlow,
        reason: 'Extraordinary IRR + Negative Cash Flow Override'
      });
    }
    
    // Override 3: Good IRR with reasonable cash flow (12%+ IRR)
    else if (verdict === 'NEGOTIATE' && 
             irr >= 0.12 && 
             monthlyFlow >= 200 &&
             capRate >= 0.04) {
      
      verdict = 'BUY';
      confidence = Math.min(80, confidence + 5);
      primaryReason = `Strong ${irr.toFixed(1)}% IRR with positive cash flow meets professional investment criteria`;
      secondaryReasons.push('2025 Calibration: Solid total returns with adequate cash flow');
      
      logger.info('Professional Override Applied: Good IRR Deal', {
        originalVerdict: 'NEGOTIATE',
        newVerdict: 'BUY',
        irr: irr.toFixed(1) + '%',
        monthlyFlow,
        capRate: capRate.toFixed(1) + '%',
        reason: 'Good IRR Override'
      });
    }

    // V3.0 Professional Assessment integration will be handled by the main analysis flow
    // The key fix here is disabling the V2.1 walk-away price override above
    
    logger.info('V2.1 Walk-away Price Override Disabled', {
      finalVerdict: verdict,
      confidence,
      primaryReason,
      v3Transition: 'Legacy walk-away price logic disabled for V3.0 compatibility'
    });
    
    return {
      verdict,
      confidence,
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

  /**
   * Generate portfolio context analysis
   */
  private generatePortfolioContext(
    propertyData: SFRData, 
    fundamentals: any, 
    verdict: InvestmentVerdict,
    userContext: any
  ): PortfolioContext {
    const portfolioStrategy = propertyData.exitStrategy?.portfolioStrategy || 'first';
    const experienceLevel = userContext.experienceLevel || 'novice';
    const riskTolerance = userContext.riskTolerance || 'moderate';
    
    // Calculate portfolio fit score based on multiple factors
    let fitScore = 60; // Base score
    const recommendations: string[] = [];
    
    // Strategy alignment scoring
    if (portfolioStrategy === 'cashflow' && fundamentals.cashFlow > 500) {
      fitScore += 20;
    } else if (portfolioStrategy === 'appreciation' && fundamentals.capRate < 0.06) {
      fitScore += 15;
    } else if (portfolioStrategy === 'first' && fundamentals.cashFlow > 200) {
      fitScore += 25;
    } else if (portfolioStrategy === 'geographic' && verdict === 'BUY') {
      fitScore += 15;
    }
    
    // Experience level adjustments
    if (experienceLevel === 'novice' && fundamentals.riskLevel === 'low') {
      fitScore += 10;
      recommendations.push('Beginner-friendly property with stable fundamentals');
    } else if (experienceLevel === 'experienced' && fundamentals.riskLevel === 'high') {
      fitScore += 15;
      recommendations.push('Advanced investment opportunity requiring expertise');
    }
    
    // Risk tolerance alignment
    if (riskTolerance === 'conservative' && fundamentals.riskLevel === 'low') {
      fitScore += 10;
    } else if (riskTolerance === 'aggressive' && fundamentals.returnQuality === 'high') {
      fitScore += 10;
    }
    
    // Cap the score at 100
    fitScore = Math.min(fitScore, 100);
    
    // Determine fit level
    let fitLevel: 'excellent' | 'good' | 'fair' | 'poor';
    if (fitScore >= 85) fitLevel = 'excellent';
    else if (fitScore >= 70) fitLevel = 'good';
    else if (fitScore >= 55) fitLevel = 'fair';
    else fitLevel = 'poor';
    
    // Generate fit analysis with proper number formatting
    let fitAnalysis = '';
    console.log('🔧 PORTFOLIO FIT DEBUG:', {
      originalCashFlow: fundamentals.cashFlow,
      cashFlowType: typeof fundamentals.cashFlow,
      isNumber: !isNaN(fundamentals.cashFlow)
    });
    
    // More aggressive rounding to handle floating-point precision issues
    const roundedCashFlow = Number(Math.round(fundamentals.cashFlow * 100) / 100);
    console.log('🔧 ROUNDING DEBUG:', {
      original: fundamentals.cashFlow,
      rounded: roundedCashFlow,
      formatted: roundedCashFlow.toFixed(2)
    });
    
    if (portfolioStrategy === 'first') {
      fitAnalysis = `This property serves as a ${fitLevel} starter investment with ${fundamentals.cashFlow > 0 ? 'positive' : 'negative'} cash flow of $${Math.abs(roundedCashFlow).toFixed(2)}/month. `;
    } else if (portfolioStrategy === 'cashflow') {
      fitAnalysis = `Strong cash flow property generating $${roundedCashFlow.toFixed(2)}/month aligns ${fitLevel} with your income-focused strategy. `;
    } else if (portfolioStrategy === 'appreciation') {
      fitAnalysis = `${fundamentals.capRate < 0.06 ? 'Lower cap rate suggests good' : 'Higher cap rate may limit'} appreciation potential for your growth-focused strategy. `;
    } else {
      fitAnalysis = `This property represents a ${fitLevel} addition to your diversified portfolio strategy. `;
    }
    
    // Add experience context
    if (experienceLevel === 'novice') {
      fitAnalysis += `As a newer investor, this ${fundamentals.riskLevel}-risk property ${fitLevel === 'excellent' || fitLevel === 'good' ? 'matches' : 'may challenge'} your current expertise level.`;
    }
    
    // Generate diversification impact
    const diversificationImpact = this.getDiversificationImpact(propertyData, portfolioStrategy, fundamentals);
    
    // Determine risk contribution
    const riskContribution = this.getRiskContribution(fundamentals, portfolioStrategy, experienceLevel);
    
    // Add portfolio-specific recommendations
    if (portfolioStrategy === 'first') {
      recommendations.push('Consider setting aside 6 months of expenses before purchase');
      recommendations.push('Focus on building property management skills');
    } else if (portfolioStrategy === 'cashflow') {
      recommendations.push('Monitor cash-on-cash returns across your portfolio');
      recommendations.push('Ensure geographic diversification for income stability');
    }
    
    return {
      fitScore,
      fitLevel,
      fitAnalysis,
      diversificationImpact,
      riskContribution,
      recommendations
    };
  }
  
  private getDiversificationImpact(propertyData: SFRData, portfolioStrategy: string, fundamentals: any): string {
    const city = propertyData.propertyAddress?.city || 'Unknown';
    const state = propertyData.propertyAddress?.state || 'Unknown';
    
    if (portfolioStrategy === 'first') {
      return `Establishes your real estate investment foundation in ${city}, ${state}.`;
    } else if (portfolioStrategy === 'geographic') {
      return `Expands geographic diversification by adding ${city}, ${state} market exposure.`;
    } else if (portfolioStrategy === 'cashflow') {
      return `Adds consistent income stream to your cash flow-focused portfolio.`;
    } else {
      return `Contributes to portfolio diversification across different property types and markets.`;
    }
  }
  
  private getRiskContribution(fundamentals: any, portfolioStrategy: string, experienceLevel: string): 'reduces' | 'maintains' | 'increases' {
    if (fundamentals.riskLevel === 'low' && fundamentals.cashFlow > 300) {
      return 'reduces';
    } else if (fundamentals.riskLevel === 'high' || fundamentals.cashFlow < 0) {
      return 'increases';
    } else {
      return 'maintains';
    }
  }

  /**
   * @deprecated This method is deprecated and will be removed in the next release.
   * Tax optimization is being replaced with educational tax content that doesn't affect investment decisions.
   * Calculate tax optimization metrics for professional assessment
   */
  private calculateTaxOptimization(
    taxAnalysis: TaxAnalysisResult,
    professionalAssessment: ProfessionalAssessment,
    propertyData: SFRData
  ): ProfessionalAssessment['taxOptimization'] {
    const optimalAnalysis = taxAnalysis.holdPeriodAnalysis.find(
      h => h.holdPeriod === taxAnalysis.optimalHoldPeriod
    );
    const year1Analysis = taxAnalysis.holdPeriodAnalysis.find(h => h.holdPeriod === 1);

    if (!optimalAnalysis || !year1Analysis) {
      throw new Error('Tax analysis missing required hold period data');
    }

    // Calculate tax efficiency score (0-100)
    const maxTaxRate = 0.5; // Assume 50% as worst-case total tax rate
    const effectiveTaxRate = optimalAnalysis.totalTaxLiability / Math.max(optimalAnalysis.capitalGain, 1);
    const taxEfficiencyScore = Math.max(0, Math.min(100, (1 - effectiveTaxRate / maxTaxRate) * 100));

    // State tax advantage check
    const stateTaxRate = taxAnalysis.userTaxProfile.stateTaxRate || 0;
    const stateTaxAdvantage = stateTaxRate === 0; // No state tax = advantage

    // Calculate after-tax deal quality adjustment
    const pretaxIRR = professionalAssessment.irrScore / 25 * 0.12; // Estimate pre-tax IRR from score
    const afterTaxIRRAdjustmentFactor = optimalAnalysis.afterTaxIRR / Math.max(pretaxIRR, 0.01);
    const afterTaxDealQuality = Math.round(professionalAssessment.dealQuality * afterTaxIRRAdjustmentFactor);

    // Primary tax insight - focus on after-tax returns, not tax minimization
    let primaryTaxInsight: string;
    if (taxAnalysis.optimalHoldPeriod === 1) {
      primaryTaxInsight = `Hold period optimization not beneficial - exit when market conditions are favorable`;
    } else if (taxAnalysis.totalTaxSavingsAtOptimal >= 0) {
      // Traditional positive tax savings case
      primaryTaxInsight = `Hold ${taxAnalysis.optimalHoldPeriod} years to save $${taxAnalysis.totalTaxSavingsAtOptimal.toLocaleString()} in taxes (${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% after-tax IRR)`;
    } else {
      // Negative tax savings - focus on superior after-tax returns
      const afterTaxAdvantage = ((optimalAnalysis.afterTaxIRR - year1Analysis.afterTaxIRR) * 100).toFixed(1);
      primaryTaxInsight = `Best strategy: Hold ${taxAnalysis.optimalHoldPeriod} years for ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% annual returns vs only ${(year1Analysis.afterTaxIRR * 100).toFixed(1)}% if you sell in Year 1`;
    }

    // Tax optimization recommendations with smart hints
    const recommendations: string[] = [];

    // Smart Hint 1: Hold period benefit - adaptive messaging for positive/negative tax scenarios
    if (taxAnalysis.totalTaxSavingsAtOptimal > 10000) {
      recommendations.push(`💡 Holding for ${taxAnalysis.optimalHoldPeriod} years could save $${taxAnalysis.totalTaxSavingsAtOptimal.toLocaleString()} in taxes`);
    } else if (taxAnalysis.totalTaxSavingsAtOptimal < -10000) {
      const afterTaxAdvantage = ((optimalAnalysis.afterTaxIRR - year1Analysis.afterTaxIRR) * 100).toFixed(1);
      recommendations.push(`💡 Despite ${Math.abs(taxAnalysis.totalTaxSavingsAtOptimal).toLocaleString()} higher taxes, holding ${taxAnalysis.optimalHoldPeriod} years maximizes after-tax returns (+${afterTaxAdvantage} percentage points)`);
    }

    // Smart Hint 2: Year-end timing for capital gains (if close to 1 year)
    if (taxAnalysis.optimalHoldPeriod === 2 && taxAnalysis.totalTaxSavingsAtOptimal > 5000) {
      recommendations.push(`💡 Consider timing sale after 1-year mark to qualify for long-term capital gains rates`);
    }

    // Smart Hint 3: High bracket tax strategy value
    const federalTaxBracket = taxAnalysis.userTaxProfile.federalTaxBracket || 24; // Default 24%
    const federalMarginalRate = federalTaxBracket / 100;
    if (federalMarginalRate >= 0.32) {
      recommendations.push(`⚠️ Your high tax bracket (${federalTaxBracket}%) makes tax-deferred strategies particularly valuable`);
    }

    // Smart Hint 4: NIIT awareness
    if (taxAnalysis.highIncomeWarning?.applies) {
      recommendations.push(`💰 High earners: Consider timing and structuring to minimize 3.8% Net Investment Income Tax`);
    }

    // Legacy recommendations
    if (taxAnalysis.exchange1031Eligibility?.eligible) {
      recommendations.push(`Eligible for 1031 exchange - defer $${taxAnalysis.exchange1031Eligibility.deferralAmount.toLocaleString()} in taxes`);
    }

    if (taxAnalysis.stateArbitrageOpportunities.length > 0) {
      recommendations.push(taxAnalysis.stateArbitrageOpportunities[0]); // First opportunity
    }

    recommendations.push(...taxAnalysis.taxOptimizationRecommendations.slice(0, 2)); // Top 2 additional recommendations

    return {
      afterTaxIRR: optimalAnalysis.afterTaxIRR,
      afterTaxDealQuality: Math.min(100, Math.max(0, afterTaxDealQuality)),
      optimalHoldPeriod: taxAnalysis.optimalHoldPeriod,
      taxEfficiencyScore,
      stateTaxAdvantage,
      holdPeriodTaxSavings: taxAnalysis.totalTaxSavingsAtOptimal,
      exchange1031Eligible: taxAnalysis.exchange1031Eligibility?.eligible || false,
      primaryTaxInsight,
      taxOptimizationRecommendations: recommendations
    };
  }
}