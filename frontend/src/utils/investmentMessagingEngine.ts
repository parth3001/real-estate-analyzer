/**
 * Investment Messaging Engine - Deterministic Safety-First Architecture
 * 
 * This engine ensures that investment messages are ALWAYS accurate and never
 * misleading. It uses a three-tier validation system:
 * 
 * 1. Safety Validation: Prevents contradictory messages
 * 2. Message Generation: Uses templates for consistency
 * 3. Tone Adjustment: Matches message sentiment to verdict
 * 
 * @author Real Estate Investment Intelligence Platform
 * @version 2.0.0
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InvestmentMetrics {
  monthlyFlow: number;
  annualFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  totalInvestment: number;
  purchasePrice: number;
  totalWealth?: number; // Appreciation + cash flow over time
  operatingExpenseRatio?: number;
  dscr?: number;
  rentToPriceRatio?: number;
}

export interface GoalContext {
  exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  experienceLevel?: 'novice' | 'intermediate' | 'expert';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export type InvestmentVerdict = 'BUY' | 'NEGOTIATE' | 'PASS';

export interface MessageResult {
  header: string;
  primaryReason: string;
  verdictLabel: string;
  warnings: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: 'high' | 'medium' | 'low';
}

export interface SafetyViolation {
  code: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  metric?: string;
  threshold?: number;
  actual?: number;
}

// ============================================================================
// SAFETY THRESHOLDS
// ============================================================================

const SAFETY_THRESHOLDS = {
  // Cash Flow Thresholds
  MINIMUM_CASHFLOW: -200,              // Absolute minimum for any strategy
  CASHFLOW_STRATEGY_MIN: 100,          // Minimum for cash flow focused strategy
  FIRST_INVESTOR_MIN: 0,               // No negative for first-timers
  ESTATE_STRATEGY_MIN: 0,              // Must be sustainable for generational hold
  
  // Return Thresholds  
  MIN_CAP_RATE: 3.0,                   // Below this is generally unacceptable
  CASHFLOW_CAP_RATE_MIN: 5.0,          // Higher requirement for income strategy
  MIN_CASH_ON_CASH: 0,                 // Negative means losing money
  
  // Risk Thresholds
  MAX_EXPENSE_RATIO: 60,               // Operating expenses > 60% is dangerous
  MIN_DSCR: 1.0,                       // Below 1.0 can't cover debt
  MIN_RENT_TO_PRICE: 0.4,              // Below 0.4% is usually unviable
  
  // Experience-Based Adjustments
  NOVICE_MAX_NEGATIVE_FLOW: 0,         // No negative for beginners
  NOVICE_MIN_CAP_RATE: 5.0,            // Higher safety margin
} as const;

// ============================================================================
// SAFETY VALIDATOR
// ============================================================================

export class SafetyValidator {
  /**
   * Validates if the property metrics align with investment goals
   * Returns violations that would make positive messaging inappropriate
   */
  static validate(
    verdict: InvestmentVerdict,
    goal: GoalContext,
    metrics: InvestmentMetrics
  ): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    
    // ========== UNIVERSAL CHECKS (Apply to all strategies) ==========
    
    // Critical: Extreme negative cash flow
    if (metrics.monthlyFlow < SAFETY_THRESHOLDS.MINIMUM_CASHFLOW) {
      violations.push({
        code: 'EXTREME_NEGATIVE_CASHFLOW',
        severity: 'CRITICAL',
        message: 'Severe negative cash flow requires significant monthly capital injection',
        metric: 'monthlyFlow',
        threshold: SAFETY_THRESHOLDS.MINIMUM_CASHFLOW,
        actual: metrics.monthlyFlow
      });
    }
    
    // Critical: Very low cap rate
    if (metrics.capRate < SAFETY_THRESHOLDS.MIN_CAP_RATE) {
      violations.push({
        code: 'UNVIABLE_CAP_RATE',
        severity: 'CRITICAL',
        message: 'Cap rate below minimum investment threshold',
        metric: 'capRate',
        threshold: SAFETY_THRESHOLDS.MIN_CAP_RATE,
        actual: metrics.capRate
      });
    }
    
    // ========== STRATEGY-SPECIFIC CHECKS ==========
    
    // Cash Flow Strategy Violations
    if (goal.portfolioStrategy === 'cashflow') {
      if (metrics.monthlyFlow <= 0) {
        violations.push({
          code: 'CASHFLOW_STRATEGY_VIOLATION',
          severity: 'CRITICAL',
          message: 'Negative/zero cash flow contradicts income-focused investment strategy',
          metric: 'monthlyFlow',
          threshold: 0,
          actual: metrics.monthlyFlow
        });
      } else if (metrics.monthlyFlow < SAFETY_THRESHOLDS.CASHFLOW_STRATEGY_MIN) {
        violations.push({
          code: 'INSUFFICIENT_CASHFLOW',
          severity: 'WARNING',
          message: 'Cash flow below minimum threshold for income strategy',
          metric: 'monthlyFlow',
          threshold: SAFETY_THRESHOLDS.CASHFLOW_STRATEGY_MIN,
          actual: metrics.monthlyFlow
        });
      }
      
      if (metrics.capRate < SAFETY_THRESHOLDS.CASHFLOW_CAP_RATE_MIN) {
        violations.push({
          code: 'LOW_CAP_FOR_CASHFLOW',
          severity: 'WARNING',
          message: 'Cap rate too low for cash flow focused strategy',
          metric: 'capRate',
          threshold: SAFETY_THRESHOLDS.CASHFLOW_CAP_RATE_MIN,
          actual: metrics.capRate
        });
      }
    }
    
    // Estate/Generational Strategy Violations
    if (goal.exitStrategy === 'estate') {
      if (metrics.monthlyFlow < SAFETY_THRESHOLDS.ESTATE_STRATEGY_MIN) {
        violations.push({
          code: 'ESTATE_SUSTAINABILITY',
          severity: 'CRITICAL',
          message: 'Negative cash flow unsustainable for generational wealth strategy',
          metric: 'monthlyFlow',
          threshold: SAFETY_THRESHOLDS.ESTATE_STRATEGY_MIN,
          actual: metrics.monthlyFlow
        });
      }
      
      if (metrics.totalWealth && metrics.totalWealth < 0) {
        violations.push({
          code: 'WEALTH_DESTRUCTION',
          severity: 'CRITICAL',
          message: 'Property destroys wealth over time - unsuitable for estate planning',
          metric: 'totalWealth',
          threshold: 0,
          actual: metrics.totalWealth
        });
      }
    }
    
    // First-Time Investor Protections
    if (goal.portfolioStrategy === 'first' || goal.experienceLevel === 'novice') {
      if (metrics.monthlyFlow < SAFETY_THRESHOLDS.NOVICE_MAX_NEGATIVE_FLOW) {
        violations.push({
          code: 'NOVICE_RISK_PROTECTION',
          severity: 'CRITICAL',
          message: 'Negative cash flow too risky for first-time investors',
          metric: 'monthlyFlow',
          threshold: SAFETY_THRESHOLDS.NOVICE_MAX_NEGATIVE_FLOW,
          actual: metrics.monthlyFlow
        });
      }
      
      if (metrics.capRate < SAFETY_THRESHOLDS.NOVICE_MIN_CAP_RATE) {
        violations.push({
          code: 'NOVICE_RETURN_PROTECTION',
          severity: 'WARNING',
          message: 'Returns below recommended threshold for first-time investors',
          metric: 'capRate',
          threshold: SAFETY_THRESHOLDS.NOVICE_MIN_CAP_RATE,
          actual: metrics.capRate
        });
      }
    }
    
    // ========== VERDICT-MESSAGE CONSISTENCY ==========
    
    // PASS verdict should never have enthusiastic messaging
    if (verdict === 'PASS' && violations.length === 0) {
      violations.push({
        code: 'PASS_VERDICT_CONSTRAINT',
        severity: 'INFO',
        message: 'Property does not meet investment criteria',
        metric: 'verdict',
        threshold: 0,
        actual: 0
      });
    }
    
    return violations;
  }
  
  /**
   * Determines if positive messaging is safe given the violations
   */
  static isSafeForPositiveMessaging(violations: SafetyViolation[]): boolean {
    return !violations.some(v => v.severity === 'CRITICAL');
  }
  
  /**
   * Gets the most severe violation for primary messaging
   */
  static getMostSevereViolation(violations: SafetyViolation[]): SafetyViolation | null {
    const critical = violations.find(v => v.severity === 'CRITICAL');
    if (critical) return critical;
    
    const warning = violations.find(v => v.severity === 'WARNING');
    if (warning) return warning;
    
    return violations[0] || null;
  }
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export class MessageTemplates {
  // Header Templates based on verdict and safety
  private static readonly HEADERS = {
    // Positive Headers (only when safe)
    BUY_CASHFLOW: "Strong Income Producer for Your Portfolio",
    BUY_APPRECIATION: "Excellent Growth Investment Opportunity", 
    BUY_ESTATE: "Ideal for Generational Wealth Building",
    BUY_FIRST: "Great Starter Investment Property",
    BUY_GENERIC: "Recommended Investment Opportunity",
    
    // Neutral Headers (for NEGOTIATE)
    NEGOTIATE_CASHFLOW: "Potential Income Property with Improvements Needed",
    NEGOTIATE_APPRECIATION: "Growth Opportunity Requiring Negotiation",
    NEGOTIATE_ESTATE: "Estate Planning Candidate - Terms Needed",
    NEGOTIATE_FIRST: "Possible First Investment with Adjustments",
    NEGOTIATE_GENERIC: "Investment Opportunity Needs Improvement",
    
    // Negative Headers (for PASS or violations)
    PASS_CASHFLOW: "Does Not Meet Income Requirements",
    PASS_APPRECIATION: "Insufficient Growth Potential",
    PASS_ESTATE: "Unsuitable for Long-Term Holding",
    PASS_FIRST: "Not Recommended for First Investment",
    PASS_GENERIC: "Does Not Meet Investment Criteria",
    
    // Warning Headers (for critical violations)
    WARNING_NEGATIVE_FLOW: "⚠️ Warning: Negative Cash Flow Property",
    WARNING_LOW_RETURNS: "⚠️ Warning: Below Market Returns",
    WARNING_HIGH_RISK: "⚠️ Warning: High Risk Investment",
  };
  
  // Primary Reason Templates
  static readonly REASONS = {
    // Positive Cash Flow Reasons
    STRONG_CASHFLOW: "Generates ${monthlyFlow}/month (${annualFlow}/year) in positive cash flow with ${capRate}% cap rate, providing reliable income for your portfolio",
    MODERATE_CASHFLOW: "Produces ${monthlyFlow}/month in cash flow with ${capRate}% cap rate. While positive, consider optimizing for better returns",
    
    // Negative Cash Flow Reasons
    NEGATIVE_CASHFLOW: "Requires ${monthlyFlow}/month capital injection (${annualFlow}/year loss), making this property unsuitable for income generation",
    SEVERE_NEGATIVE: "Severe negative cash flow of ${monthlyFlow}/month would require ${annualFlow}/year in additional capital, creating unsustainable financial burden",
    
    // Estate Strategy Reasons
    ESTATE_POSITIVE: "Sustainable ${monthlyFlow}/month cash flow ensures this property can be held indefinitely for generational wealth transfer with ${totalWealth} projected wealth creation",
    ESTATE_NEGATIVE: "Negative cash flow of ${monthlyFlow}/month makes this property unsustainable for long-term generational holding",
    
    // First Investor Reasons
    FIRST_SAFE: "Conservative investment with ${monthlyFlow}/month positive cash flow and ${capRate}% cap rate provides safe learning opportunity",
    FIRST_RISKY: "This property's metrics present too much risk for a first investment. Consider properties with positive cash flow and stronger fundamentals",
    
    // Generic Fallbacks
    GENERIC_POSITIVE: "Property offers ${capRate}% cap rate with ${monthlyFlow}/month cash flow, meeting basic investment criteria",
    GENERIC_NEGATIVE: "Property metrics do not meet minimum investment thresholds with ${monthlyFlow}/month cash flow and ${capRate}% cap rate",
  };
  
  /**
   * Selects appropriate header based on verdict, goal, and safety
   */
  static getHeader(
    verdict: InvestmentVerdict,
    goal: GoalContext,
    _isSafe: boolean,
    primaryViolation?: SafetyViolation
  ): string {
    // Critical violations always get warning headers
    if (primaryViolation?.severity === 'CRITICAL') {
      if (primaryViolation.code.includes('CASHFLOW')) {
        return this.HEADERS.WARNING_NEGATIVE_FLOW;
      }
      if (primaryViolation.code.includes('CAP_RATE') || primaryViolation.code.includes('RETURN')) {
        return this.HEADERS.WARNING_LOW_RETURNS;
      }
      return this.HEADERS.WARNING_HIGH_RISK;
    }
    
    // Select based on verdict and strategy
    const strategyKey = goal.portfolioStrategy?.toUpperCase() || 
                       goal.exitStrategy?.toUpperCase() || 
                       'GENERIC';
    
    const headerKey = `${verdict}_${strategyKey}`;
    
    // Return appropriate header with fallbacks
    return MessageTemplates.HEADERS[headerKey as keyof typeof MessageTemplates.HEADERS] || 
           MessageTemplates.HEADERS[`${verdict}_GENERIC` as keyof typeof MessageTemplates.HEADERS] ||
           MessageTemplates.HEADERS.PASS_GENERIC;
  }
  
  /**
   * Fills template with actual values
   */
  static fillTemplate(template: string, metrics: InvestmentMetrics): string {
    return template
      .replace('${monthlyFlow}', this.formatCurrency(metrics.monthlyFlow))
      .replace('${annualFlow}', this.formatCurrency(metrics.annualFlow))
      .replace('${capRate}', metrics.capRate.toFixed(1))
      .replace('${cashOnCashReturn}', metrics.cashOnCashReturn.toFixed(1))
      .replace('${totalWealth}', this.formatCurrency(metrics.totalWealth || 0))
      .replace('${purchasePrice}', this.formatCurrency(metrics.purchasePrice));
  }
  
  /**
   * Format currency values
   */
  private static formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000) {
      return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${sign}$${(absValue / 1000).toFixed(0)}k`;
    } else {
      return `${sign}$${absValue.toLocaleString()}`;
    }
  }
}

// ============================================================================
// MAIN MESSAGING ENGINE
// ============================================================================

export class InvestmentMessagingEngine {
  /**
   * Main entry point - generates safe, accurate investment messages
   */
  static generateMessage(
    verdict: InvestmentVerdict,
    goal: GoalContext,
    metrics: InvestmentMetrics
  ): MessageResult {
    // Step 1: Run safety validation
    const violations = SafetyValidator.validate(verdict, goal, metrics);
    const primaryViolation = SafetyValidator.getMostSevereViolation(violations);
    
    // Step 2: Generate header
    const header = MessageTemplates.getHeader(verdict, goal, true, primaryViolation || undefined);
    
    // Step 3: Generate primary reason
    const primaryReason = this.generatePrimaryReason(
      verdict,
      goal,
      metrics,
      primaryViolation || undefined
    );
    
    // Step 4: Generate verdict label
    const verdictLabel = this.generateVerdictLabel(verdict, goal);
    
    // Step 5: Collect warnings
    const warnings = violations
      .filter(v => v.severity !== 'INFO')
      .map(v => v.message);
    
    // Step 6: Determine sentiment
    const sentiment = this.determineSentiment(verdict, violations);
    
    // Step 7: Determine confidence
    const confidence = this.determineConfidence(verdict, violations);
    
    return {
      header,
      primaryReason,
      verdictLabel,
      warnings,
      sentiment,
      confidence
    };
  }
  
  /**
   * Generates the primary reason message
   */
  private static generatePrimaryReason(
    _verdict: InvestmentVerdict,
    goal: GoalContext,
    metrics: InvestmentMetrics,
    primaryViolation?: SafetyViolation
  ): string {
    // If there's a critical violation, explain it
    if (primaryViolation?.severity === 'CRITICAL') {
      return this.explainViolation(primaryViolation, metrics);
    }
    
    // Select appropriate template based on strategy and metrics
    let template: string;
    
    // Cash flow strategy logic
    if (goal.portfolioStrategy === 'cashflow') {
      if (metrics.monthlyFlow > 500) {
        template = MessageTemplates.REASONS.STRONG_CASHFLOW;
      } else if (metrics.monthlyFlow > 0) {
        template = MessageTemplates.REASONS.MODERATE_CASHFLOW;
      } else if (metrics.monthlyFlow > -500) {
        template = MessageTemplates.REASONS.NEGATIVE_CASHFLOW;
      } else {
        template = MessageTemplates.REASONS.SEVERE_NEGATIVE;
      }
    }
    // Estate strategy logic
    else if (goal.exitStrategy === 'estate') {
      if (metrics.monthlyFlow >= 0) {
        template = MessageTemplates.REASONS.ESTATE_POSITIVE;
      } else {
        template = MessageTemplates.REASONS.ESTATE_NEGATIVE;
      }
    }
    // First investor logic
    else if (goal.portfolioStrategy === 'first' || goal.experienceLevel === 'novice') {
      if (metrics.monthlyFlow >= 0 && metrics.capRate >= 5) {
        template = MessageTemplates.REASONS.FIRST_SAFE;
      } else {
        template = MessageTemplates.REASONS.FIRST_RISKY;
      }
    }
    // Generic fallback
    else {
      if (metrics.monthlyFlow >= 0 && metrics.capRate >= 5) {
        template = MessageTemplates.REASONS.GENERIC_POSITIVE;
      } else {
        template = MessageTemplates.REASONS.GENERIC_NEGATIVE;
      }
    }
    
    return MessageTemplates.fillTemplate(template, metrics);
  }
  
  /**
   * Explains a safety violation in user-friendly terms
   */
  private static explainViolation(
    violation: SafetyViolation,
    _metrics: InvestmentMetrics
  ): string {
    const actual = MessageTemplates['formatCurrency'](violation.actual || 0);
    
    switch (violation.code) {
      case 'CASHFLOW_STRATEGY_VIOLATION':
        return `This property has negative cash flow of ${actual}/month, which directly contradicts your income-focused investment strategy. Properties for cash flow portfolios must generate positive monthly income.`;
      
      case 'WEALTH_DESTRUCTION':
        return `This property would lose ${actual} over your holding period, destroying wealth rather than building it. This is incompatible with generational wealth transfer goals.`;
      
      case 'NOVICE_RISK_PROTECTION':
        return `With ${actual}/month negative cash flow, this property presents too much financial risk for a first-time investor. Start with properties that generate positive cash flow to minimize risk while learning.`;
      
      case 'EXTREME_NEGATIVE_CASHFLOW':
        return `Severe negative cash flow of ${actual}/month would require substantial ongoing capital injection, creating an unsustainable financial burden.`;
      
      default:
        return violation.message;
    }
  }
  
  /**
   * Generates verdict label based on goal context
   */
  private static generateVerdictLabel(
    verdict: InvestmentVerdict,
    goal: GoalContext
  ): string {
    const action = verdict === 'BUY' ? 'Recommended' : 
                  verdict === 'NEGOTIATE' ? 'Negotiate' : 
                  'Not Recommended';
    
    let context = '';
    if (goal.portfolioStrategy === 'cashflow') {
      context = ' for Income Portfolio';
    } else if (goal.portfolioStrategy === 'first') {
      context = ' as First Investment';
    } else if (goal.exitStrategy === 'estate') {
      context = ' for Estate Planning';
    } else if (goal.exitStrategy === '1031exchange') {
      context = ' for 1031 Exchange';
    }
    
    return action + context;
  }
  
  /**
   * Determines message sentiment based on verdict and violations
   */
  private static determineSentiment(
    verdict: InvestmentVerdict,
    violations: SafetyViolation[]
  ): 'positive' | 'neutral' | 'negative' {
    if (violations.some(v => v.severity === 'CRITICAL')) {
      return 'negative';
    }
    
    if (verdict === 'BUY' && violations.length === 0) {
      return 'positive';
    }
    
    if (verdict === 'PASS') {
      return 'negative';
    }
    
    return 'neutral';
  }
  
  /**
   * Determines confidence level based on violations
   */
  private static determineConfidence(
    _verdict: InvestmentVerdict,
    violations: SafetyViolation[]
  ): 'high' | 'medium' | 'low' {
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    const warningCount = violations.filter(v => v.severity === 'WARNING').length;
    
    if (criticalCount > 0) return 'low';
    if (warningCount > 1) return 'low';
    if (warningCount === 1) return 'medium';
    
    return 'high';
  }
}

// ============================================================================
// EXPORT PUBLIC API
// ============================================================================

export default InvestmentMessagingEngine;