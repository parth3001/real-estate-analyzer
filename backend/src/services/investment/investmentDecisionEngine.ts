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
  confidence: number; // 0-100
  primaryReason: string;
  secondaryReasons: string[];
  keyRisks: string[];
  actionPlan: ActionItem[];
  capitalStrategy: CapitalDeploymentAdvice;
  alternativeOptions: AlternativeInvestment[];
  marketContext: MarketContextAnalysis;
  timeline: InvestmentTimeline;
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
  private readonly HURDLE_RATE = 0.065; // 6.5% minimum return requirement
  private readonly TREASURY_RATE = 0.045; // 4.5% risk-free rate

  constructor() {
    this.leverageOptimizer = new LeverageOptimizer();
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
    }
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
        propertyData
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

      const decision: InvestmentDecision = {
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        primaryReason: verdict.primaryReason,
        secondaryReasons: verdict.secondaryReasons,
        keyRisks: verdict.keyRisks,
        actionPlan,
        capitalStrategy,
        alternativeOptions,
        marketContext,
        timeline
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
   * Generate investment verdict
   */
  private async generateVerdict(
    fundamentals: any,
    leverageAnalysis: LeverageAnalysis,
    marketContext: MarketContextAnalysis,
    userContext: any,
    propertyData: SFRData
  ) {
    let verdict: InvestmentVerdict = 'PASS';
    let confidence = 50;
    let primaryReason = 'Analysis inconclusive';
    let secondaryReasons: string[] = [];
    let keyRisks: string[] = [];

    // Decision logic based on multiple factors
    const hasPositiveCashFlow = leverageAnalysis.optimalScenario.monthlyNetCashFlow > 0;
    const meetsHurdleRate = fundamentals.cashOnCashReturn >= this.HURDLE_RATE;
    const isOverpriced = fundamentals.capRate < 0.04 && marketContext.pricingContext === 'overvalued';
    const hasLeverageOptions = leverageAnalysis.optimalScenario.leverageScore > 60;

    // PASS scenarios
    if (!hasPositiveCashFlow && !hasLeverageOptions) {
      verdict = 'PASS';
      confidence = 85;
      primaryReason = 'Property cannot generate positive cash flow with any reasonable leverage scenario';
      secondaryReasons.push('High risk of monthly capital injection requirements');
      keyRisks.push('Negative cash flow stress');
    } else if (isOverpriced && fundamentals.returnQuality === 'poor') {
      verdict = 'PASS';
      confidence = 75;
      primaryReason = 'Property is overpriced for its income potential and market conditions';
      secondaryReasons.push(`Cap rate of ${(fundamentals.capRate * 100).toFixed(1)}% below market threshold`);
      keyRisks.push('Appreciation-dependent investment in late market cycle');
    }

    // NEGOTIATE scenarios
    else if (hasLeverageOptions && (isOverpriced || fundamentals.returnQuality === 'fair')) {
      verdict = 'NEGOTIATE';
      confidence = 70;
      
      // Use market-specific target cap rate (calculated from market context)
      const targetCapRate = 0.06; // Will be enhanced with market data in Phase 2
      
      // Calculate suggested price based on market-specific target
      const noi = (fundamentals.monthlyRent * 12) - (fundamentals.monthlyRent * 12 * fundamentals.operatingExpenseRatio);
      const suggestedPrice = Math.round(noi / targetCapRate);
      const priceReduction = fundamentals.purchasePrice - suggestedPrice;
      
      primaryReason = `Property becomes attractive with $${priceReduction.toLocaleString()} price reduction to $${suggestedPrice.toLocaleString()}`;
      secondaryReasons.push(`At lower price, optimal leverage generates strong returns`);
      secondaryReasons.push(`Current pricing requires excessive cash for minimal returns`);
      keyRisks.push('Seller may not accept reduced price in competitive market');
    }

    // BUY scenarios  
    else if (hasPositiveCashFlow && meetsHurdleRate && fundamentals.returnQuality !== 'poor') {
      verdict = 'BUY';
      confidence = 80;
      primaryReason = `Strong fundamentals with positive cash flow and returns above ${(this.HURDLE_RATE * 100).toFixed(1)}% hurdle rate`;
      secondaryReasons.push(`Optimal leverage: ${leverageAnalysis.optimalScenario.downPaymentPercent}% down`);
      secondaryReasons.push(`Monthly cash flow: $${leverageAnalysis.optimalScenario.monthlyNetCashFlow.toFixed(0)}`);
      
      if (leverageAnalysis.opportunityCost.capitalEfficiencyGap > 1.5) {
        secondaryReasons.push('Leverage optimization enables portfolio expansion');
      }
    }

    // Adjust confidence based on market context
    if (marketContext.marketStage === 'late' && marketContext.pricingContext === 'overvalued') {
      confidence = Math.max(40, confidence - 20);
      keyRisks.push('Late market cycle increases downside risk');
    }

    // Adjust for user experience
    if (userContext.experienceLevel === 'novice' && fundamentals.riskLevel === 'high') {
      confidence = Math.max(30, confidence - 15);
      keyRisks.push('Complex deal not suitable for novice investors');
    }

    // Add common risks
    if (fundamentals.dscr < 1.25) {
      keyRisks.push('Low debt service coverage ratio increases payment stress risk');
    }
    if (fundamentals.cashFlow < 300) {
      keyRisks.push('Limited cash flow buffer for unexpected expenses');
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

    return {
      verdict,
      confidence: Math.round(confidence),
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