/**
 * MFDecisionEngine - Multi-Family property investment decision engine
 * Created: October 29, 2025 - Sprint 2, Story 2.3
 *
 * Purpose: Implements Multi-Family-specific investment decision logic
 * - Cap rate as PRIMARY metric (25% weight vs SFR 3%)
 * - DSCR as CRITICAL metric (20% weight vs SFR 10%)
 * - Walk-away price: NOI / Target Cap Rate (professional MF valuation)
 * - Commercial lending standards (DSCR 1.25+ required)
 *
 * Key Differences from SFR:
 * - MF values based on income (NOI), not comparable sales
 * - Commercial lenders focus on DSCR, not borrower income
 * - Cap rate compression in strong markets (4-6% A-Class)
 * - Diversification across units reduces property risk to 0%
 */

import { logger } from '../../utils/logger';
import { BaseDecisionEngine, ScoringWeights, PropertyScores } from './BaseDecisionEngine';
import { MultiFamilyData, MultiFamilyMetrics, AnalysisResult } from '../../types/propertyTypes';
import { MarketDataResponse } from '../../types/marketData';
import { aiEnhancedMessagingService } from '../aiEnhancedMessaging';

export class MFDecisionEngine extends BaseDecisionEngine<MultiFamilyMetrics> {
  // Type-narrowed property data for MF-specific access
  protected mfPropertyData: MultiFamilyData;

  // AI Enhancement context (Story 2.5)
  private predictions?: any;
  private userContext?: any;
  private enhancedGoals?: any;

  constructor(
    analysis: AnalysisResult<MultiFamilyMetrics>,
    propertyData: MultiFamilyData,
    marketData?: MarketDataResponse,
    predictions?: any,
    userContext?: any,
    enhancedGoals?: any
  ) {
    super(analysis, propertyData, marketData);

    // Store type-narrowed property data for MF-specific methods
    this.mfPropertyData = propertyData;

    // Store AI enhancement context
    this.predictions = predictions;
    this.userContext = userContext;
    this.enhancedGoals = enhancedGoals;

    logger.info('MFDecisionEngine initialized', {
      totalUnits: propertyData.totalUnits,
      purchasePrice: propertyData.purchasePrice,
      noi: analysis.metrics?.noi ?? 'undefined',
      capRate: analysis.metrics?.capRate ?? 'undefined',
      dscr: analysis.metrics?.dscr ?? 'undefined',
      hasAIContext: !!(userContext && enhancedGoals)
    });
  }

  /**
   * Generate investment decision with AI enhancement (Story 2.5)
   *
   * NEW METHOD (not overriding parent) - adds 20% AI layer on top of 80% core logic
   * - Calls parent generateDecision() for base verdict/scoring
   * - Adds AI-enhanced content if userContext/enhancedGoals provided
   * - Adds goal-based reasoning for personalized recommendations
   */
  public async generateDecisionWithAI(): Promise<any> {
    logger.info('MFDecisionEngine: Generating decision with AI enhancement');

    // Step 1: Get base decision from parent (verdict, scores, walk-away price)
    const baseDecision = super.generateDecision();

    logger.info('MFDecisionEngine: Base decision generated', {
      verdict: baseDecision.verdict,
      dealQuality: baseDecision.professionalAssessment?.dealQuality,
      walkAwayPrice: baseDecision.marketPosition?.walkAwayPrice
    });

    // Step 2: If no AI context, return base decision (80% core logic only)
    if (!this.userContext || !this.enhancedGoals) {
      logger.info('MFDecisionEngine: No AI context provided, returning base decision (80% core)');
      return baseDecision;
    }

    logger.info('MFDecisionEngine: AI context available, generating enhanced content (20% AI layer)');

    try {
      // Step 3: Generate AI-enhanced content (reasoning, action plan, capital strategy, etc.)
      // Note: Using 'as any' to handle type mismatch between BaseDecisionEngine and legacy types
      const aiEnhancedContent = await aiEnhancedMessagingService.generateAllContent(
        baseDecision as any,
        this.analysis,
        this.propertyData
      );

      logger.info('MFDecisionEngine: AI-enhanced content generated');

      // Step 4: Generate goal-based reasoning (personalized to investor goals)
      const goalBasedReasoning = await aiEnhancedMessagingService.generatePersonalizedGoalReasoning(
        baseDecision as any,
        this.analysis,
        this.propertyData
      );

      logger.info('MFDecisionEngine: Goal-based reasoning generated');

      // Step 5: Return enhanced decision (100% - Core + AI)
      return {
        ...baseDecision,
        aiEnhancedContent,
        goalBasedReasoning
      };

    } catch (aiError) {
      logger.error('MFDecisionEngine: AI enhancement failed, returning base decision', aiError);
      // Graceful degradation - return base decision if AI fails
      return baseDecision;
    }
  }

  // ===== IMPLEMENT 4 ABSTRACT METHODS =====

  /**
   * Get MF-specific scoring weights
   *
   * Key differences from SFR:
   * - Cap Rate: 25% (vs SFR 3%) - PRIMARY METRIC for commercial real estate
   * - DSCR: 20% (vs SFR 10%) - CRITICAL for commercial lenders
   * - Cash Flow: 20% (vs SFR 35%) - NOI matters more than monthly cash
   * - Property Risk: 0% (vs SFR 7%) - Diversified across units
   */
  protected getScoringWeights(): ScoringWeights {
    return {
      cashFlow: 0.20,      // Lower than SFR - NOI is what matters
      irr: 0.20,           // Same importance as SFR
      capRate: 0.25,       // PRIMARY METRIC - 8× higher than SFR!
      dscr: 0.20,          // CRITICAL - 2× higher than SFR
      marketStrength: 0.10, // Same as SFR
      exitStrategy: 0.05,  // Half of SFR - MF has good liquidity
      propertyRisk: 0.00   // ZERO - Diversified across units
    };
  }

  /**
   * Calculate walk-away price using NOI / Target Cap Rate formula
   *
   * This is THE professional method for valuing income-producing MF properties.
   * Unlike SFR (comparable sales), MF is valued on income generation.
   *
   * Formula: Walk-Away Price = NOI / Target Cap Rate
   *
   * Example:
   * - NOI: $100,000/year
   * - Target Cap Rate: 8% (B-Class market)
   * - Walk-Away: $100,000 / 0.08 = $1,250,000
   */
  protected calculateWalkAwayPrice(): number {
    const noi = this.analysis.metrics?.noi;

    // CRITICAL: Handle null/undefined/zero/negative NOI
    if (!noi || noi <= 0) {
      logger.warn('MF Walk-Away: NOI is invalid, using purchase price as conservative estimate', {
        noi: noi ?? 'undefined',
        purchasePrice: this.propertyData.purchasePrice,
        reason: !noi ? 'NOI is null/undefined' : 'NOI is zero or negative'
      });
      return this.propertyData.purchasePrice;
    }

    const targetCapRate = this.getTargetCapRate();
    const walkAwayPrice = noi / targetCapRate;

    // Add NaN check before rounding
    if (isNaN(walkAwayPrice) || !isFinite(walkAwayPrice)) {
      logger.error('Walk-Away Price calculation produced invalid result', {
        noi,
        targetCapRate,
        walkAwayPrice,
        purchasePrice: this.propertyData.purchasePrice
      });
      return this.propertyData.purchasePrice;
    }

    logger.info('MF Walk-Away Price Calculation', {
      noi: noi.toFixed(0),
      targetCapRate: (targetCapRate * 100).toFixed(1) + '%',
      walkAwayPrice: Math.round(walkAwayPrice).toLocaleString(),
      purchasePrice: this.propertyData.purchasePrice.toLocaleString(),
      pricingContext: walkAwayPrice > this.propertyData.purchasePrice ? 'Good deal' : 'Overpriced'
    });

    return Math.round(walkAwayPrice);
  }

  /**
   * Score all property metrics (0-100 each)
   *
   * Returns PropertyScores with MF-specific scoring logic for:
   * - Cash Flow: Per-unit basis using ACTUAL monthly cash flow (annualized)
   * - IRR: Long-term return potential
   * - Cap Rate: PRIMARY metric - compared to market targets
   * - DSCR: CRITICAL metric - commercial lender requirement
   * - Market Strength: Based on market tier (A/B/C)
   * - Exit Strategy: Based on unit count (institutional appeal)
   * - Property Risk: 0 (diversified across units)
   */
  protected scoreProperty(): PropertyScores {
    const metrics = this.analysis.metrics;

    // Defensive check: Ensure metrics exist
    if (!metrics) {
      logger.error('MFDecisionEngine: metrics is undefined in scoreProperty()');
      throw new Error('Analysis metrics are required but undefined');
    }

    // Use actual monthly cash flow from analysis (annualized for per-unit scoring)
    // This matches SFR engine approach: investmentDecisionEngine.ts:1903
    // Uses actual calculated cash flow (not estimation)
    // See Issue #21 in ISSUE_TRACKER.md for historical context
    const monthlyCashFlow = this.analysis.monthlyAnalysis?.cashFlow ?? 0;
    const annualCashFlow = monthlyCashFlow * 12;

    // Log only if cash flow is exactly 0 (potential data issue)
    if (annualCashFlow === 0) {
      logger.warn('MF Cash Flow is zero - verify if this is expected', {
        hasMonthlyAnalysis: !!this.analysis.monthlyAnalysis,
        monthlyCashFlow,
        totalUnits: this.mfPropertyData.totalUnits
      });
    }

    const scores = {
      cashFlow: this.scoreCashFlow(annualCashFlow),
      irr: this.scoreIRR(metrics.irr || 0),
      capRate: this.scoreCapRate(metrics.capRate || 0),
      dscr: this.scoreDSCR(metrics.dscr || 0),
      marketStrength: this.scoreMarketStrength(),
      exitStrategy: this.scoreExitStrategy(),
      propertyRisk: 0 // MF diversified across units = zero property risk
    };

    logger.info('MF Property Scoring', {
      scores,
      totalUnits: this.mfPropertyData.totalUnits,
      capRate: ((metrics.capRate || 0) * 100).toFixed(2) + '%',
      dscr: (metrics.dscr || 0).toFixed(2)
    });

    return scores;
  }

  /**
   * Get MF-specific risk factors
   *
   * Critical MF risks:
   * 1. DSCR < 1.25 - Commercial lender rejection risk
   * 2. Cap Rate < 4% - Premium pricing, exit difficulty
   * 3. High Vacancy (>10%) - Market weakness indicator
   * 4. 1-4 Units - Residential financing (harder to qualify)
   * 5. Old Property (>30 years) - Deferred maintenance
   * 6. Negative Cash Flow - Ongoing capital injection needed
   */
  protected getPropertyTypeSpecificRisks(): string[] {
    const risks: string[] = [];
    const metrics = this.analysis.metrics;

    // Defensive check: Ensure metrics exist
    if (!metrics) {
      logger.warn('MFDecisionEngine: metrics is undefined in getPropertyTypeSpecificRisks()');
      return ['Unable to assess property-specific risks - metrics unavailable'];
    }

    // RISK 1: DSCR below commercial lender threshold (MOST CRITICAL)
    if ((metrics.dscr || 0) < 1.25) {
      risks.push('⚠️ CRITICAL: DSCR < 1.25 - Commercial lender will likely reject loan');
    } else if ((metrics.dscr || 0) < 1.35) {
      risks.push('DSCR below 1.35 may require stronger borrower qualifications or larger down payment');
    }

    // RISK 2: Cap rate too low (premium pricing)
    if ((metrics.capRate || 0) < 0.04) {
      risks.push('Low cap rate (<4%) indicates premium pricing - exit may be difficult in market downturn');
    }

    // RISK 3: High vacancy rate
    if ((metrics.economicVacancyRate || 0) > 10) {
      risks.push('High vacancy rate (>10%) indicates market weakness or property management issues');
    } else if ((metrics.economicVacancyRate || 0) > 7) {
      risks.push('Elevated vacancy rate (>7%) requires investigation - market norm is 5-7%');
    }

    // RISK 4: 1-4 units financing complexity
    if (this.mfPropertyData.totalUnits < 5) {
      risks.push('1-4 units may require residential financing (harder to qualify, personal income matters)');
    }

    // RISK 5: Cash flow risk (per unit basis)
    // Use actual monthly cash flow from analysis (not estimation)
    // See Issue #21 in ISSUE_TRACKER.md for historical context
    const monthlyCashFlow = this.analysis.monthlyAnalysis?.cashFlow ?? 0;
    const monthlyCashFlowPerUnit = monthlyCashFlow / this.mfPropertyData.totalUnits;

    if (monthlyCashFlowPerUnit < 0) {
      risks.push('Negative cash flow per unit requires ongoing capital injection - budget for monthly losses');
    } else if (monthlyCashFlowPerUnit < 50) {
      risks.push('Low cash flow per unit (<$50/unit/month) provides minimal buffer for expenses');
    }

    // RISK 6: Property age and deferred maintenance
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - this.propertyData.yearBuilt;

    if (propertyAge > 30) {
      risks.push('Property age >30 years - budget $500-1000/unit/year for deferred maintenance and CapEx');
    } else if (propertyAge > 20) {
      risks.push('Property age >20 years - expect $250-500/unit/year in capital improvements');
    }

    // RISK 7: Unit count concentration
    if (this.mfPropertyData.totalUnits < 10) {
      risks.push('Fewer than 10 units increases single-tenant impact - each vacancy is 10%+ income loss');
    }

    return risks;
  }

  // ===== MF-SPECIFIC HELPER METHODS =====

  /**
   * Get market-adjusted target cap rate with building type adjustments (Phase 1)
   *
   * Cap rates vary significantly by market tier:
   * - A-Class (Dallas, Austin): 4-6% → Target: 5%
   * - B-Class (Phoenix, Tampa): 6-8% → Target: 7.5%
   * - C-Class (Memphis, Detroit): 8-11% → Target: 10%
   *
   * Building type adjustments (Phase 1 Commercial MF):
   * - GARDEN: 0 bps (baseline)
   * - MID_RISE: -150 bps (institutional appeal, better rent growth)
   * - COMPLEX: 0 bps (baseline)
   */
  private getTargetCapRate(): number {
    const marketTier = this.getMarketTier();
    const buildingType = this.mfPropertyData.buildingType;

    const targetCapRates = {
      'A': 0.05,  // A-Class: 5% (premium markets)
      'B': 0.075, // B-Class: 7.5% (balanced markets)
      'C': 0.10   // C-Class: 10% (cash flow markets)
    };

    const baseRate = targetCapRates[marketTier] || 0.08; // Default 8% if unknown

    // Phase 1: Apply building type adjustments if buildingType is specified
    if (!buildingType) {
      return baseRate; // No adjustment if building type not specified
    }

    const buildingTypeAdjustments = {
      'GARDEN': 0,        // Garden-style baseline (most common)
      'MID_RISE': -0.015, // Mid-rise gets -150 bps (4-9 stories, elevator, institutional appeal)
      'COMPLEX': 0        // Multi-building complex baseline
    };

    const adjustment = buildingTypeAdjustments[buildingType] || 0;
    return baseRate + adjustment;
  }

  /**
   * Determine market tier based on city/state
   *
   * Simplified classification (can be enhanced with market data):
   * - Tier A: High-growth, job-strong metros
   * - Tier B: Secondary markets with steady growth
   * - Tier C: Tertiary markets, cash flow focused
   */
  private getMarketTier(): 'A' | 'B' | 'C' {
    const city = this.propertyData.propertyAddress?.city?.toLowerCase() || '';
    const state = this.propertyData.propertyAddress?.state?.toLowerCase() || '';

    // A-Class markets: High growth, strong job markets
    const tier1Cities = [
      'dallas', 'austin', 'nashville', 'phoenix', 'charlotte',
      'raleigh', 'denver', 'seattle', 'portland', 'san antonio'
    ];

    // B-Class markets: Secondary growth markets
    const tier2Cities = [
      'tampa', 'orlando', 'atlanta', 'houston', 'fort worth',
      'jacksonville', 'las vegas', 'tucson', 'kansas city', 'indianapolis'
    ];

    if (tier1Cities.some(c => city.includes(c))) return 'A';
    if (tier2Cities.some(c => city.includes(c))) return 'B';

    return 'C'; // Default to C-Class
  }

  /**
   * Score cash flow (20% weight)
   *
   * For MF, we score on per-unit basis, not total cash flow.
   * This normalizes across different property sizes.
   *
   * Benchmarks (per unit per month):
   * - $200+: Excellent (100)
   * - $100+: Good (80)
   * - $50+: Fair (60)
   * - $0+: Marginal (40)
   * - Negative: Poor (0-20)
   */
  private scoreCashFlow(cashFlow: number): number {
    const cashFlowPerUnit = cashFlow / this.mfPropertyData.totalUnits;

    if (cashFlowPerUnit >= 200) return 100;
    if (cashFlowPerUnit >= 100) return 80;
    if (cashFlowPerUnit >= 50) return 60;
    if (cashFlowPerUnit >= 0) return 40;
    if (cashFlowPerUnit >= -50) return 20;
    return 0; // Severely negative cash flow
  }

  /**
   * Score IRR potential (20% weight)
   *
   * MF IRR expectations:
   * - 15%+: Excellent (100)
   * - 12%+: Very good (85)
   * - 10%+: Good (70)
   * - 8%+: Fair (55)
   * - 6%+: Below standard (40)
   * - <6%: Poor (20)
   */
  private scoreIRR(irr: number): number {
    // Handle both decimal (0.12) and percentage (12) formats
    const irrPercent = irr < 1 ? irr * 100 : irr;

    if (irrPercent >= 15) return 100; // Excellent
    if (irrPercent >= 12) return 85;  // Very good
    if (irrPercent >= 10) return 70;  // Good
    if (irrPercent >= 8) return 55;   // Fair
    if (irrPercent >= 6) return 40;   // Below standard
    return 20; // Poor
  }

  /**
   * Score cap rate competitiveness (25% weight - PRIMARY METRIC)
   *
   * Compares property cap rate to market-adjusted target.
   * This is THE most important metric for MF valuation.
   *
   * Scoring:
   * - 2%+ above target: 100 (Exceptional deal)
   * - 1%+ above target: 90 (Great deal)
   * - At target: 80 (Fair market)
   * - 1% below target: 60 (Premium pricing)
   * - 2% below target: 40 (Overpriced)
   * - 2%+ below target: 20 (Severely overpriced)
   */
  private scoreCapRate(capRate: number): number {
    // DEFENSIVE: Handle both percentage and decimal formats
    // FinancialCalculations returns percentage (2.99), but we need decimal (0.0299)
    // See Issue #19 in ISSUE_TRACKER.md for historical context
    const capRateDecimal = capRate > 1 ? capRate / 100 : capRate;

    const targetCapRate = this.getTargetCapRate();
    const spread = capRateDecimal - targetCapRate;

    // Use tolerances for floating point comparison
    const TOLERANCE = 0.0001;

    if (spread >= 0.02 - TOLERANCE) return 100; // 2%+ above target
    if (spread >= 0.01 - TOLERANCE) return 90;  // 1%+ above target
    if (spread >= -TOLERANCE) return 80;  // At or slightly above target
    if (spread > -0.02 + TOLERANCE) return 60;  // Less than 2% below target (premium pricing)
    if (spread >= -0.02 - TOLERANCE) return 40; // Approximately 2% below target (overpriced)
    return 20; // More than 2% below target (severely overpriced)
  }

  /**
   * Score DSCR (20% weight - CRITICAL METRIC)
   *
   * DSCR = Debt Service Coverage Ratio
   * = NOI / Annual Debt Service
   *
   * Commercial lender requirements:
   * - 1.50+: Excellent (100) - Lenders love this
   * - 1.35+: Very good (90) - Strong borrower position
   * - 1.25+: Good (75) - Standard lender minimum
   * - 1.15+: Borderline (50) - Some lenders may accept
   * - 1.00+: Poor (25) - Most lenders will reject
   * - <1.00: Critical (0) - Property doesn't cover debt
   */
  private scoreDSCR(dscr: number): number {
    if (dscr >= 1.50) return 100; // Excellent - lenders love this
    if (dscr >= 1.35) return 90;  // Very good
    if (dscr >= 1.25) return 75;  // Good - standard lender minimum
    if (dscr >= 1.15) return 50;  // Borderline
    if (dscr >= 1.00) return 25;  // Poor - most lenders reject
    return 0; // DSCR < 1.0 = doesn't cover debt service
  }

  /**
   * Score market strength (10% weight)
   *
   * Based on market tier classification:
   * - A-Class: 80 (strong job growth, appreciation potential)
   * - B-Class: 65 (steady growth, balanced)
   * - C-Class: 50 (cash flow focus, limited appreciation)
   */
  private scoreMarketStrength(): number {
    const marketTier = this.getMarketTier();

    const tierScores = {
      'A': 80,  // High-growth markets
      'B': 65,  // Secondary markets
      'C': 50   // Tertiary markets
    };

    return tierScores[marketTier];
  }

  /**
   * Score exit strategy (5% weight)
   *
   * Based on unit count and institutional buyer appeal:
   * - 20+ units: 90 (institutional buyers interested)
   * - 10+ units: 75 (good exit options)
   * - 5+ units: 60 (standard exit)
   * - 2-4 units: 40 (harder to sell, limited buyer pool)
   */
  private scoreExitStrategy(): number {
    const units = this.mfPropertyData.totalUnits;

    if (units >= 20) return 90;  // Institutional appeal
    if (units >= 10) return 75;  // Good exit options
    if (units >= 5) return 60;   // Standard commercial
    return 40; // 2-4 units - harder to sell
  }
}
