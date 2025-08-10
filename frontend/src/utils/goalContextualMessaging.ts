/**
 * Goal-Contextual Messaging Engine
 * 
 * Transforms generic investment advice into personalized recommendations
 * based on user's specific investment goals and strategy.
 */

export interface GoalContext {
  exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  marketTimingFlexibility?: 'flexible' | 'somewhat' | 'constrained' | 'independent';
  riskApproach?: 'conservative' | 'balanced' | 'aggressive' | 'opportunistic';
  capitalDeployment?: 'reinvest_re' | 'diversify' | 'lifestyle' | 'business' | 'debt';
  projectionYears?: number;
}

export interface AnalysisData {
  monthlyAnalysis?: {
    cashFlow?: number;
  };
  keyMetrics?: {
    capRate?: number;
    cashOnCashReturn?: number;
  };
  financing?: {
    loanToValue?: number;
  };
  longTermAnalysis?: {
    totalAppreciation?: number;
    totalCashFlow?: number;
    totalReturn?: number;
  };
}

export class GoalContextualMessaging {
  
  /**
   * Generate goal-contextual header for Investment Decision Hero
   */
  static getGoalContextualHeader(goalContext: GoalContext): string {
    const { exitStrategy, portfolioStrategy } = goalContext;
    
    // Primary goal mapping - most specific wins
    if (exitStrategy === 'estate') {
      return "Perfect for Your Generational Wealth Strategy";
    }
    
    if (portfolioStrategy === 'cashflow') {
      return "Excellent for Your Cash Flow Portfolio";
    }
    
    if (portfolioStrategy === 'first') {
      return "Great First Investment Property";
    }
    
    if (exitStrategy === '1031exchange') {
      return "Strong 1031 Exchange Candidate";
    }
    
    if (portfolioStrategy === 'appreciation') {
      return "Solid Appreciation Play for Your Goals";
    }
    
    if (portfolioStrategy === 'geographic') {
      return "Great Addition to Your Geographic Strategy";
    }
    
    if (portfolioStrategy === 'diversification') {
      return "Perfect for Portfolio Diversification";
    }
    
    // Fallback based on exit strategy
    if (exitStrategy === 'refinance') {
      return "Excellent for Cash-Out Refinance Strategy";
    }
    
    if (exitStrategy === 'flexible') {
      return "Versatile Property for Your Flexible Strategy";
    }
    
    // Ultimate fallback
    return "Recommended for Your Investment Strategy";
  }

  /**
   * Generate goal-contextual primary reason
   */
  static getGoalContextualReason(
    goalContext: GoalContext,
    analysis: AnalysisData
  ): string {
    const { exitStrategy, portfolioStrategy, projectionYears = 10 } = goalContext;
    
    // Extract key metrics with fallbacks
    const monthlyFlow = Math.round(analysis.monthlyAnalysis?.cashFlow || 0);
    const capRate = analysis.keyMetrics?.capRate || 0;
    const cashOnCash = analysis.keyMetrics?.cashOnCashReturn || 0;
    const loanToValue = analysis.financing?.loanToValue || 75;
    const totalAppreciation = analysis.longTermAnalysis?.totalAppreciation || 0;
    const totalCashFlow = analysis.longTermAnalysis?.totalCashFlow || 0;
    
    // Estate/Generational focus - emphasize total wealth creation
    if (exitStrategy === 'estate') {
      const totalWealth = totalAppreciation + totalCashFlow;
      const formattedWealth = this.formatCurrency(totalWealth);
      return `This property will generate ${formattedWealth} in total wealth over ${projectionYears} years, perfect for passing to heirs with stepped-up basis benefits and ongoing income stream`;
    }
    
    // Cash flow focus - emphasize monthly income
    if (portfolioStrategy === 'cashflow') {
      const annualCashFlow = monthlyFlow * 12;
      return `Generates $${monthlyFlow.toLocaleString()}/month ($${annualCashFlow.toLocaleString()}/year) toward your income-focused portfolio strategy with solid ${capRate.toFixed(1)}% cap rate`;
    }
    
    // First property - emphasize learning and safety
    if (portfolioStrategy === 'first') {
      const isPositiveCashFlow = monthlyFlow > 0;
      const safetyNote = loanToValue <= 80 ? 'conservative' : 'moderate';
      return `${safetyNote.charAt(0).toUpperCase() + safetyNote.slice(1)} ${loanToValue}% financing with ${isPositiveCashFlow ? '$' + monthlyFlow.toLocaleString() + '/month positive' : 'minimal negative'} cash flow - ideal learning property for new investors with manageable risk`;
    }
    
    // 1031 Exchange - emphasize improvement metrics
    if (exitStrategy === '1031exchange') {
      const returnMetric = cashOnCash > 0 ? `${cashOnCash.toFixed(1)}% cash-on-cash return` : `${capRate.toFixed(1)}% cap rate`;
      return `Strong ${returnMetric} with excellent appreciation potential justifies your 1031 exchange timeline and provides improved income generation for your growing portfolio`;
    }
    
    // Appreciation focus - emphasize wealth building
    if (portfolioStrategy === 'appreciation') {
      const formattedAppreciation = this.formatCurrency(totalAppreciation);
      const appreciationRate = projectionYears > 0 ? ((totalAppreciation / (analysis as any)?.purchasePrice || 400000) / projectionYears * 100) : 3;
      return `${formattedAppreciation} projected appreciation over ${projectionYears} years (${appreciationRate.toFixed(1)}% annually) aligns perfectly with your wealth-building focus and long-term growth strategy`;
    }
    
    // Geographic diversification
    if (portfolioStrategy === 'geographic') {
      return `Solid fundamentals with $${monthlyFlow.toLocaleString()}/month cash flow and ${capRate.toFixed(1)}% cap rate provide excellent geographic diversification for your expanding portfolio reach`;
    }
    
    // Portfolio diversification  
    if (portfolioStrategy === 'diversification') {
      return `Balanced ${capRate.toFixed(1)}% cap rate with $${monthlyFlow.toLocaleString()}/month cash flow offers excellent risk diversification across your multi-property investment strategy`;
    }
    
    // Refinance strategy
    if (exitStrategy === 'refinance') {
      const equityBuild = totalAppreciation * 0.7; // Assume 70% LTV refinance
      return `Strong cash flow foundation with ${this.formatCurrency(equityBuild)} potential equity extraction through future refinancing, perfect for capital recycling strategy`;
    }
    
    // Flexible strategy
    if (exitStrategy === 'flexible') {
      return `Versatile property with $${monthlyFlow.toLocaleString()}/month cash flow and ${capRate.toFixed(1)}% cap rate provides multiple exit options to match changing market conditions and opportunities`;
    }
    
    // Fallback - comprehensive but generic
    return `Strong investment fundamentals with $${monthlyFlow.toLocaleString()}/month cash flow and ${capRate.toFixed(1)}% cap rate align well with your investment objectives and risk profile`;
  }

  /**
   * Generate goal-contextual verdict label
   */
  static getGoalContextualVerdictLabel(
    goalContext: GoalContext,
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE'
  ): string {
    const { exitStrategy, portfolioStrategy } = goalContext;
    
    const baseAction = verdict === 'BUY' ? 'Recommended' : verdict === 'NEGOTIATE' ? 'Negotiate' : 'Pass';
    
    // Specific goal labeling
    if (exitStrategy === 'estate') {
      return `${baseAction} for Generational Hold`;
    }
    
    if (portfolioStrategy === 'cashflow') {
      return `${baseAction} for Income Portfolio`;
    }
    
    if (portfolioStrategy === 'first') {
      return `${baseAction} Starter Property`;
    }
    
    if (exitStrategy === '1031exchange') {
      return `${baseAction} Exchange Property`;
    }
    
    if (portfolioStrategy === 'appreciation') {
      return `${baseAction} for Appreciation Focus`;
    }
    
    if (portfolioStrategy === 'geographic') {
      return `${baseAction} for Geographic Expansion`;
    }
    
    if (portfolioStrategy === 'diversification') {
      return `${baseAction} for Portfolio Diversification`;
    }
    
    if (exitStrategy === 'refinance') {
      return `${baseAction} for Refinance Strategy`;
    }
    
    // Generic fallback
    return `${baseAction} Investment`;
  }

  /**
   * Generate goal-specific secondary insights
   */
  static getGoalSpecificInsights(goalContext: GoalContext, _analysis: AnalysisData): string[] {
    const { exitStrategy, portfolioStrategy, riskApproach } = goalContext;
    const insights: string[] = [];
    
    // Add goal-specific insights
    if (exitStrategy === 'estate') {
      insights.push('🏛️ Estate Planning: Consider LLC or trust structure for tax optimization');
      insights.push('📈 Wealth Transfer: Stepped-up basis eliminates capital gains for heirs');
    }
    
    if (portfolioStrategy === 'first') {
      insights.push('🎓 Learning Opportunity: Start with property management basics');
      insights.push('🛡️ Risk Management: Build 6-month reserve fund for unexpected expenses');
    }
    
    if (exitStrategy === '1031exchange') {
      insights.push('⏱️ Exchange Timeline: Complete within 180-day requirement');
      insights.push('💼 Professional Help: Qualified intermediary required for compliance');
    }
    
    if (riskApproach === 'conservative') {
      insights.push('🛡️ Conservative Approach: Property meets your low-risk investment criteria');
    }
    
    return insights;
  }

  /**
   * Helper: Format currency values
   */
  private static formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    } else {
      return `$${Math.round(value).toLocaleString()}`;
    }
  }

}