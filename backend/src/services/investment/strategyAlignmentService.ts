/**
 * Strategy Alignment Service (Phase 3)
 * 
 * Analyzes alignment between user investment strategy and market/property characteristics:
 * - Investment strategy (cashflow, appreciation, balanced) vs market tier
 * - Hold period vs market cycle and property type
 * - Experience level vs property complexity
 * - Risk tolerance vs property/market risk profile
 * 
 * Provides strategic recommendations and opportunity cost analysis
 */

import { logger } from '../../utils/logger';
import { MarketTier } from './marketTierService';
import { PropertyClassification } from './propertyClassificationService';

export type InvestmentStrategy = 'cashflow' | 'appreciation' | 'balanced';
export type ExperienceLevel = 'novice' | 'intermediate' | 'experienced' | 'expert';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive' | 'opportunistic';

export interface StrategyAlignment {
  alignment: 'excellent' | 'good' | 'fair' | 'poor' | 'mismatch';
  alignmentScore: number; // 0-100
  confidence: number; // 0-100
  primaryAlignment: string;
  misalignments: StrategyMisalignment[];
  recommendations: StrategyRecommendation[];
  opportunityCost?: OpportunityCostAnalysis;
}

export interface StrategyMisalignment {
  type: 'strategy_market' | 'hold_period' | 'experience_risk' | 'risk_tolerance';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  impact: string;
  suggestion: string;
}

export interface StrategyRecommendation {
  type: 'alternative_market' | 'strategy_adjustment' | 'hold_period_change' | 'risk_mitigation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: string;
}

export interface OpportunityCostAnalysis {
  currentApproachReturn: number;
  optimalApproachReturn: number;
  annualOpportunityCost: number;
  cumulativeOpportunityCost: number;
  alternativeDescription: string;
  timeToOptimal: string;
}

export interface UserStrategy {
  investmentStrategy: InvestmentStrategy;
  holdPeriod: number; // years
  experienceLevel: ExperienceLevel;
  riskTolerance: RiskTolerance;
  portfolioStrategy?: string;
  geographicFocus?: string;
  capitalAvailable?: number;
}

/**
 * Strategy Alignment Service
 * 
 * Implements institutional-grade strategy alignment analysis
 * based on proven real estate investment methodologies
 */
export class StrategyAlignmentService {

  /**
   * Analyze strategy alignment with market and property
   */
  static analyzeStrategyAlignment(
    userStrategy: UserStrategy,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification,
    propertyMetrics: {
      capRate: number;
      cashFlow: number;
      expectedAppreciation: number;
      managementComplexity: 'low' | 'medium' | 'high';
    }
  ): StrategyAlignment {
    
    logger.info('Phase 3: Strategy Alignment Analysis', {
      userStrategy: userStrategy.investmentStrategy,
      holdPeriod: userStrategy.holdPeriod,
      experienceLevel: userStrategy.experienceLevel,
      marketTier: marketTier.tier,
      marketFocus: marketTier.focusType,
      propertyClass: propertyClassification.propertyClass,
      propertyRisk: propertyClassification.riskLevel
    });
    
    const misalignments: StrategyMisalignment[] = [];
    const recommendations: StrategyRecommendation[] = [];
    
    // 1. Analyze strategy-market alignment
    const strategyMarketAlignment = this.analyzeStrategyMarketFit(
      userStrategy.investmentStrategy,
      marketTier,
      propertyMetrics
    );
    if (strategyMarketAlignment.misalignment) {
      misalignments.push(strategyMarketAlignment.misalignment);
    }
    if (strategyMarketAlignment.recommendation) {
      recommendations.push(strategyMarketAlignment.recommendation);
    }
    
    // 2. Analyze hold period alignment
    const holdPeriodAlignment = this.analyzeHoldPeriodAlignment(
      userStrategy.holdPeriod,
      userStrategy.investmentStrategy,
      marketTier,
      propertyClassification
    );
    if (holdPeriodAlignment.misalignment) {
      misalignments.push(holdPeriodAlignment.misalignment);
    }
    if (holdPeriodAlignment.recommendation) {
      recommendations.push(holdPeriodAlignment.recommendation);
    }
    
    // 3. Analyze experience-risk alignment
    const experienceAlignment = this.analyzeExperienceRiskAlignment(
      userStrategy.experienceLevel,
      propertyClassification,
      propertyMetrics.managementComplexity
    );
    if (experienceAlignment.misalignment) {
      misalignments.push(experienceAlignment.misalignment);
    }
    if (experienceAlignment.recommendation) {
      recommendations.push(experienceAlignment.recommendation);
    }
    
    // 4. Analyze risk tolerance alignment
    const riskAlignment = this.analyzeRiskToleranceAlignment(
      userStrategy.riskTolerance,
      marketTier,
      propertyClassification,
      propertyMetrics
    );
    if (riskAlignment.misalignment) {
      misalignments.push(riskAlignment.misalignment);
    }
    if (riskAlignment.recommendation) {
      recommendations.push(riskAlignment.recommendation);
    }
    
    // 5. Calculate overall alignment score
    const alignmentScore = this.calculateAlignmentScore(misalignments, userStrategy, marketTier, propertyClassification);
    
    // 6. Determine overall alignment level
    const alignment = this.determineAlignmentLevel(alignmentScore);
    
    // 7. Generate primary alignment summary
    const primaryAlignment = this.generatePrimaryAlignmentSummary(
      alignment,
      userStrategy,
      marketTier,
      propertyClassification,
      misalignments
    );
    
    // 8. Calculate opportunity cost if significant misalignment
    let opportunityCost;
    if (alignmentScore < 70 && misalignments.some(m => m.severity === 'major' || m.severity === 'critical')) {
      opportunityCost = this.calculateOpportunityCost(
        userStrategy,
        marketTier,
        propertyClassification,
        propertyMetrics
      );
    }
    
    const confidence = this.calculateConfidence(misalignments, alignmentScore);
    
    return {
      alignment,
      alignmentScore,
      confidence,
      primaryAlignment,
      misalignments,
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
      opportunityCost
    };
  }

  // Private analysis methods

  private static analyzeStrategyMarketFit(
    strategy: InvestmentStrategy,
    marketTier: MarketTier,
    propertyMetrics: any
  ): { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } {
    
    const result: { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } = {};
    
    // Cash flow strategy in appreciation markets
    if (strategy === 'cashflow' && marketTier.focusType === 'appreciation') {
      result.misalignment = {
        type: 'strategy_market',
        severity: 'major',
        description: `Cash flow strategy in ${marketTier.name} (appreciation-focused market)`,
        impact: 'Lower yields and limited cash flow potential relative to market premium',
        suggestion: 'Consider appreciation strategy or relocate to Tier 3 cash flow markets'
      };
      
      result.recommendation = {
        type: 'alternative_market',
        priority: 'high',
        title: 'Consider Cash Flow Markets',
        description: 'Target Tier 3 markets (smaller cities) for better cash flow opportunities',
        expectedImprovement: '2-4% higher cap rates and stronger monthly cash flow'
      };
    }
    
    // Appreciation strategy in cash flow markets
    else if (strategy === 'appreciation' && marketTier.focusType === 'cashflow') {
      result.misalignment = {
        type: 'strategy_market',
        severity: 'major',
        description: `Appreciation strategy in ${marketTier.name} (cash flow-focused market)`,
        impact: 'Limited appreciation potential and opportunity cost vs growth markets',
        suggestion: 'Consider cash flow strategy or target Tier 1/2 growth markets'
      };
      
      result.recommendation = {
        type: 'alternative_market',
        priority: 'high',
        title: 'Consider Growth Markets',
        description: 'Target Tier 1/2 markets (major metros) for appreciation potential',
        expectedImprovement: '3-5% annual appreciation vs 2-3% in current market'
      };
    }
    
    // Balanced strategy misaligned with extreme markets
    else if (strategy === 'balanced' && (propertyMetrics.capRate > 0.08 || propertyMetrics.capRate < 0.04)) {
      const severity = propertyMetrics.capRate > 0.08 ? 'moderate' : 'minor';
      result.misalignment = {
        type: 'strategy_market',
        severity,
        description: `Balanced strategy in ${propertyMetrics.capRate > 0.08 ? 'high-yield' : 'low-yield'} market`,
        impact: propertyMetrics.capRate > 0.08 ? 'Missing cash flow optimization opportunities' : 'Missing appreciation focus benefits',
        suggestion: `Consider ${propertyMetrics.capRate > 0.08 ? 'cash flow' : 'appreciation'} focus for this market`
      };
    }
    
    return result;
  }

  private static analyzeHoldPeriodAlignment(
    holdPeriod: number,
    strategy: InvestmentStrategy,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification
  ): { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } {
    
    const result: { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } = {};
    
    // Short hold period (1-3 years) with appreciation strategy
    if (holdPeriod <= 3 && strategy === 'appreciation') {
      result.misalignment = {
        type: 'hold_period',
        severity: 'major',
        description: `${holdPeriod}-year hold period too short for appreciation strategy`,
        impact: 'Market timing risk and insufficient time for appreciation to compound',
        suggestion: 'Extend hold period to 5-7 years or switch to cash flow focus'
      };
      
      result.recommendation = {
        type: 'hold_period_change',
        priority: 'high',
        title: 'Extend Hold Period for Appreciation',
        description: 'Appreciation strategies require 5-7+ years to realize full potential',
        expectedImprovement: 'Reduce market timing risk and capture full appreciation cycle'
      };
    }
    
    // Long hold period (10+ years) with cash flow strategy in volatile markets
    else if (holdPeriod >= 10 && strategy === 'cashflow' && marketTier.tier === 3) {
      result.misalignment = {
        type: 'hold_period',
        severity: 'minor',
        description: `${holdPeriod}-year hold period may be unnecessarily long for cash flow strategy`,
        impact: 'Opportunity cost vs shorter cycles with reinvestment',
        suggestion: 'Consider 5-7 year cycles with reinvestment for portfolio growth'
      };
    }
    
    // Short hold period with Class C properties
    if (holdPeriod <= 3 && propertyClassification.propertyClass === 'C') {
      result.misalignment = {
        type: 'hold_period',
        severity: 'moderate',
        description: 'Short hold period with higher-maintenance Class C property',
        impact: 'Insufficient time to recoup management setup costs and improvements',
        suggestion: 'Extend to 5+ years or target Class B properties for shorter holds'
      };
    }
    
    return result;
  }

  private static analyzeExperienceRiskAlignment(
    experienceLevel: ExperienceLevel,
    propertyClassification: PropertyClassification,
    managementComplexity: 'low' | 'medium' | 'high'
  ): { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } {
    
    const result: { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } = {};
    
    // Novice with high-risk/high-management properties
    if (experienceLevel === 'novice' && 
        (propertyClassification.riskLevel === 'high' || managementComplexity === 'high')) {
      result.misalignment = {
        type: 'experience_risk',
        severity: 'critical',
        description: `Novice investor with ${propertyClassification.classDescription}`,
        impact: 'High probability of management issues, unexpected costs, and poor returns',
        suggestion: 'Start with Class B properties in stable markets or partner with experienced investor'
      };
      
      result.recommendation = {
        type: 'risk_mitigation',
        priority: 'high',
        title: 'Consider Lower-Risk Properties',
        description: 'Build experience with Class B properties before tackling Class C investments',
        expectedImprovement: 'Reduce management complexity and improve success probability'
      };
    }
    
    // Intermediate with very high complexity
    else if (experienceLevel === 'intermediate' && 
             propertyClassification.riskLevel === 'very_high') {
      result.misalignment = {
        type: 'experience_risk',
        severity: 'major',
        description: 'Intermediate investor with very high-risk property',
        impact: 'May exceed current skill level and risk management capabilities',
        suggestion: 'Consider lower-risk alternatives or seek expert guidance'
      };
    }
    
    // Expert with low-risk (opportunity cost)
    else if (experienceLevel === 'expert' && 
             propertyClassification.riskLevel === 'low' && managementComplexity === 'low') {
      result.misalignment = {
        type: 'experience_risk',
        severity: 'minor',
        description: 'Expert investor with low-complexity property',
        impact: 'Underutilizing expertise - could handle more complex/higher-return opportunities',
        suggestion: 'Consider value-add properties or more complex strategies'
      };
    }
    
    return result;
  }

  private static analyzeRiskToleranceAlignment(
    riskTolerance: RiskTolerance,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification,
    propertyMetrics: any
  ): { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } {
    
    const result: { misalignment?: StrategyMisalignment; recommendation?: StrategyRecommendation } = {};
    
    // Conservative risk tolerance with high-risk property/market
    if (riskTolerance === 'conservative' && 
        (propertyClassification.riskLevel === 'high' || marketTier.tier === 1)) {
      const severity = propertyClassification.riskLevel === 'high' ? 'major' : 'moderate';
      result.misalignment = {
        type: 'risk_tolerance',
        severity,
        description: `Conservative risk profile with ${propertyClassification.riskLevel}-risk property`,
        impact: 'Risk level exceeds comfort zone and may cause stress-driven poor decisions',
        suggestion: 'Target Class B properties in Tier 2 markets for balanced risk-return'
      };
    }
    
    // Aggressive risk tolerance with low-risk property
    else if (riskTolerance === 'aggressive' && 
             propertyClassification.riskLevel === 'low' && propertyMetrics.capRate < 0.05) {
      result.misalignment = {
        type: 'risk_tolerance',
        severity: 'minor',
        description: 'Aggressive risk profile with low-risk, low-yield property',
        impact: 'Missing opportunities for higher returns commensurate with risk tolerance',
        suggestion: 'Consider value-add properties or higher-yield markets'
      };
      
      result.recommendation = {
        type: 'strategy_adjustment',
        priority: 'medium',
        title: 'Consider Higher-Yield Opportunities',
        description: 'Your risk tolerance allows for higher-return strategies',
        expectedImprovement: '2-3% additional returns with appropriate risk management'
      };
    }
    
    return result;
  }

  private static calculateAlignmentScore(
    misalignments: StrategyMisalignment[],
    userStrategy: UserStrategy,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification
  ): number {
    let score = 100; // Start with perfect alignment
    
    // Deduct points for misalignments
    misalignments.forEach(misalignment => {
      switch (misalignment.severity) {
        case 'critical': score -= 40; break;
        case 'major': score -= 25; break;
        case 'moderate': score -= 15; break;
        case 'minor': score -= 5; break;
      }
    });
    
    // Bonus points for good alignments
    if (userStrategy.investmentStrategy === marketTier.focusType) {
      score += 10; // Strategy-market alignment bonus
    }
    
    if (userStrategy.experienceLevel === 'experienced' && propertyClassification.managementIntensity === 'medium') {
      score += 5; // Experience-complexity match bonus
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private static determineAlignmentLevel(alignmentScore: number): StrategyAlignment['alignment'] {
    if (alignmentScore >= 90) return 'excellent';
    if (alignmentScore >= 75) return 'good';
    if (alignmentScore >= 60) return 'fair';
    if (alignmentScore >= 40) return 'poor';
    return 'mismatch';
  }

  private static generatePrimaryAlignmentSummary(
    alignment: StrategyAlignment['alignment'],
    userStrategy: UserStrategy,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification,
    misalignments: StrategyMisalignment[]
  ): string {
    
    const strategy = userStrategy.investmentStrategy;
    const holdPeriod = userStrategy.holdPeriod;
    const experience = userStrategy.experienceLevel;
    
    if (alignment === 'excellent' || alignment === 'good') {
      return `Strong alignment: ${strategy} strategy in ${marketTier.name} with ${holdPeriod}-year ${experience} investor approach`;
    }
    
    if (alignment === 'fair') {
      const mainIssue = misalignments.find(m => m.severity === 'major') || misalignments[0];
      return `Fair alignment with ${mainIssue ? 'opportunity to optimize ' + mainIssue.type.replace('_', ' ') : 'minor adjustments needed'}`;
    }
    
    const criticalIssue = misalignments.find(m => m.severity === 'critical' || m.severity === 'major');
    if (criticalIssue) {
      return `Strategy mismatch: ${criticalIssue.description}`;
    }
    
    return `Multiple alignment issues require strategic adjustments for optimal results`;
  }

  private static calculateOpportunityCost(
    userStrategy: UserStrategy,
    marketTier: MarketTier,
    propertyClassification: PropertyClassification,
    propertyMetrics: any
  ): OpportunityCostAnalysis {
    
    const currentReturn = propertyMetrics.cashFlow * 12; // Annual cash flow
    
    // Estimate optimal approach return based on strategy adjustments
    let optimalReturn = currentReturn;
    let alternativeDescription = '';
    
    // Strategy-market misalignment opportunity cost
    if (userStrategy.investmentStrategy === 'cashflow' && marketTier.focusType === 'appreciation') {
      optimalReturn = currentReturn * 1.5; // 50% better cash flow in appropriate market
      alternativeDescription = 'Target Tier 3 cash flow markets';
    } else if (userStrategy.investmentStrategy === 'appreciation' && marketTier.focusType === 'cashflow') {
      optimalReturn = currentReturn + (propertyMetrics.purchasePrice || 400000) * 0.02; // 2% additional appreciation
      alternativeDescription = 'Target Tier 1/2 appreciation markets';
    }
    
    const annualOpportunityCost = Math.max(0, optimalReturn - currentReturn);
    const cumulativeOpportunityCost = annualOpportunityCost * userStrategy.holdPeriod;
    
    return {
      currentApproachReturn: currentReturn,
      optimalApproachReturn: optimalReturn,
      annualOpportunityCost,
      cumulativeOpportunityCost,
      alternativeDescription,
      timeToOptimal: '6-12 months to reposition strategy'
    };
  }

  private static calculateConfidence(
    misalignments: StrategyMisalignment[],
    alignmentScore: number
  ): number {
    let confidence = 85; // Base confidence
    
    // Reduce confidence for critical misalignments
    const criticalCount = misalignments.filter(m => m.severity === 'critical').length;
    const majorCount = misalignments.filter(m => m.severity === 'major').length;
    
    confidence -= (criticalCount * 20) + (majorCount * 10);
    
    // Adjust based on alignment score
    if (alignmentScore >= 80) confidence += 10;
    else if (alignmentScore < 50) confidence -= 15;
    
    return Math.max(60, Math.min(95, confidence));
  }
}

export default StrategyAlignmentService;