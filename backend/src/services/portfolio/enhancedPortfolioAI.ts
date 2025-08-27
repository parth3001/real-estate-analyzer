import OpenAI from 'openai';
import { portfolioAnalyticsService } from './portfolioAnalyticsService';
import { portfolioService } from './portfolioService';
import { Portfolio } from '../../models/Portfolio';

// Initialize OpenAI
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enhanced Portfolio AI Service - Phase 4 Implementation
 * Provides sophisticated AI insights for portfolio intelligence
 */
export class EnhancedPortfolioAI {
  
  /**
   * Generate comprehensive portfolio health check
   */
  async generatePortfolioHealthCheck(portfolioId: string): Promise<HealthCheckInsights> {
    try {
      const portfolio = await this.getPortfolioWithContext(portfolioId);
      const marketData = await this.getCurrentMarketConditions();
      const userProfile = await this.getUserProfile(portfolio.userId);
      
      const prompt = this.buildHealthCheckPrompt(portfolio, marketData, userProfile);
      
      const response = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      });
      
      return this.parseHealthCheckResponse(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating portfolio health check:', error);
      throw new Error(`Failed to generate health check: ${error.message}`);
    }
  }
  
  /**
   * Generate peer comparison analysis
   */
  async generatePeerComparison(portfolioId: string): Promise<PeerComparisonInsights> {
    try {
      const portfolio = await this.getPortfolioWithContext(portfolioId);
      const benchmarks = await this.getPeerBenchmarks(portfolio);
      
      const prompt = this.buildPeerComparisonPrompt(portfolio, benchmarks);
      
      const response = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3
      });
      
      return this.parsePeerComparisonResponse(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating peer comparison:', error);
      throw new Error(`Failed to generate peer comparison: ${error.message}`);
    }
  }
  
  /**
   * Generate goal achievement path
   */
  async generateGoalAchievementPath(portfolioId: string): Promise<GoalPathInsights> {
    try {
      const portfolio = await this.getPortfolioWithContext(portfolioId);
      const userProfile = await this.getUserProfile(portfolio.userId);
      
      const prompt = this.buildGoalPathPrompt(portfolio, userProfile);
      
      const response = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      });
      
      return this.parseGoalPathResponse(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating goal achievement path:', error);
      throw new Error(`Failed to generate goal path: ${error.message}`);
    }
  }
  
  /**
   * Generate all enhanced insights at once
   */
  async generateAllInsights(portfolioId: string): Promise<ComprehensiveInsights> {
    try {
      const [healthCheck, peerComparison, goalPath] = await Promise.all([
        this.generatePortfolioHealthCheck(portfolioId),
        this.generatePeerComparison(portfolioId),
        this.generateGoalAchievementPath(portfolioId)
      ]);
      
      return { healthCheck, peerComparison, goalPath };
    } catch (error) {
      console.error('Error generating comprehensive insights:', error);
      throw new Error(`Failed to generate comprehensive insights: ${error.message}`);
    }
  }
  
  // ==================== PRIVATE METHODS ====================
  
  /**
   * Get portfolio with full context for AI analysis
   */
  private async getPortfolioWithContext(portfolioId: string): Promise<PortfolioContext> {
    // First get basic portfolio info to get userId
    const basicPortfolio = await Portfolio.findById(portfolioId);
    if (!basicPortfolio) {
      throw new Error('Portfolio not found');
    }
    
    const userId = basicPortfolio.userId.toString();
    const portfolio = await portfolioService.getPortfolioDetails(portfolioId, userId);
    const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
    
    return {
      userId: userId,
      goals: portfolio.portfolio.goals,
      analytics: analytics,
      ...portfolio
    };
  }
  
  /**
   * Build Portfolio Health Check prompt
   */
  private buildHealthCheckPrompt(portfolio: any, marketData: any, userProfile: any): string {
    const monthlyFlow = portfolio.analytics?.summary?.monthlyNetCashFlow || 0;
    const isNegative = monthlyFlow < 0;
    
    return `ROLE: You are an experienced real estate investment advisor analyzing a portfolio.

PORTFOLIO DATA:
- Properties: ${portfolio.analytics?.summary?.totalProperties || 0}
- Total Value: $${(portfolio.analytics?.summary?.totalValue || 0).toLocaleString()}
- Monthly Cash Flow: $${monthlyFlow.toLocaleString()} ${isNegative ? '(NEGATIVE - BLEEDING MONEY)' : '(POSITIVE)'}
- Cap Rate: ${(portfolio.analytics?.summary?.averageCapRate || 0).toFixed(1)}%
- Geographic Distribution: ${this.formatGeographicDistribution(portfolio.analytics?.risk)}
- Leverage: ${((portfolio.analytics?.risk?.leverageRatio || 0) * 100).toFixed(1)}%

MARKET CONDITIONS:
- Current Interest Rates: ${marketData.currentRates || '7.0'}%
- Market Trends: ${marketData.trends || 'Mixed signals with elevated rates'}
- Economic Indicators: ${marketData.indicators || 'Moderate inflation, stable employment'}

INVESTOR PROFILE:
- Primary Goal: ${portfolio.goals?.primaryGoal || 'CASH_FLOW'}
- Risk Tolerance: ${portfolio.goals?.riskTolerance || 'MODERATE'}
- Target: ${this.formatGoalTarget(portfolio.goals)}

${isNegative ? 'CRITICAL: This portfolio has NEGATIVE cash flow. The investor is losing money monthly. Focus on fixing existing properties, NOT acquiring more.' : ''}

PROVIDE EXACTLY 3 INSIGHTS:

**Biggest Risk**: [One sentence describing the top risk]
[One sentence explaining why this matters]

**Best Opportunity**: [One sentence describing the best improvement opportunity] 
[One sentence explaining the potential impact]

**Action This Month**: [One specific action to take in next 30 days]
[One sentence explaining why this action matters]

${isNegative ? 'IMPORTANT: Do NOT recommend acquiring more properties when cash flow is negative.' : ''}`;
  }
  
  /**
   * Build Peer Comparison prompt
   */
  private buildPeerComparisonPrompt(portfolio: any, benchmarks: any): string {
    return `ROLE: You are a real estate market analyst comparing investor performance.

THIS INVESTOR:
- Portfolio Value: $${(portfolio.analytics?.summary?.totalValue || 0).toLocaleString()}
- Properties: ${portfolio.analytics?.summary?.totalProperties || 0}
- Monthly Cash Flow: $${(portfolio.analytics?.summary?.monthlyNetCashFlow || 0).toLocaleString()}
- Cap Rate: ${(portfolio.analytics?.summary?.averageCapRate || 0).toFixed(1)}%
- Cash-on-Cash: ${(portfolio.analytics?.summary?.averageCashOnCash || 0).toFixed(1)}%
- Geographic Focus: ${this.getTopMarkets(portfolio.analytics?.risk)}

SIMILAR INVESTOR BENCHMARKS:
- Typical Portfolio Value: $${benchmarks.averagePortfolioValue.toLocaleString()}
- Typical Property Count: ${benchmarks.averagePropertyCount}
- Typical Monthly Cash Flow: $${benchmarks.averageMonthlyCashFlow.toLocaleString()}
- Typical Cap Rate: ${benchmarks.averageCapRate.toFixed(1)}%
- Typical Cash-on-Cash: ${benchmarks.averageCashOnCash.toFixed(1)}%

EXPLAIN IN PLAIN ENGLISH:
**Outperforming**: Where this investor beats similar portfolios and by how much
**Lagging**: Where this investor falls behind peers and the gap size  
**Why It Matters**: What these differences mean for long-term wealth building

Keep explanations simple and avoid jargon. Focus on practical implications.`;
  }
  
  /**
   * Build Goal Achievement Path prompt
   */
  private buildGoalPathPrompt(portfolio: any, userProfile: any): string {
    const monthlyFlow = portfolio.analytics?.summary?.monthlyNetCashFlow || 0;
    const isNegative = monthlyFlow < 0;
    
    return `ROLE: You are a real estate investment strategist creating a specific action plan.

CURRENT SITUATION:
- Monthly Passive Income: $${monthlyFlow.toLocaleString()} ${isNegative ? '(LOSING MONEY)' : ''}
- Portfolio Value: $${(portfolio.analytics?.summary?.totalValue || 0).toLocaleString()}
- Properties: ${portfolio.analytics?.summary?.totalProperties || 0}
- Current Property Mix: ${this.getPropertyMix(portfolio)}
- Current Cap Rate: ${(portfolio.analytics?.summary?.averageCapRate || 0).toFixed(1)}%

GOAL & TIMELINE:
- Target: ${this.formatGoalTargetForPath(portfolio.goals)}
- Investment Timeline: ${portfolio.goals?.targetTimeline || '10-15 years'} (USER SELECTED - MUST RESPECT)
- Strategy: ${portfolio.goals?.primaryGoal || 'CASH_FLOW'}
- Risk Tolerance: ${portfolio.goals?.riskTolerance || 'MODERATE'}

${isNegative ? 'CRITICAL: Portfolio currently LOSES money monthly. FIRST PRIORITY: Fix existing properties to break even before any expansion.' : ''}

PROVIDE SPECIFIC PATH:

**Properties Needed**: ${isNegative ? 'ZERO new properties until existing ones are fixed' : 'Exact number and types of properties to acquire'}
**Target Locations**: ${isNegative ? 'Focus on optimizing current properties in existing markets' : 'Best markets based on current portfolio and goals'}
**Capital Required**: ${isNegative ? 'Capital for property improvements and expense reduction' : 'Total investment needed including down payments and reserves'}

**Year 1 Action Plan**: ${isNegative ? 'Fix cash flow on existing properties' : 'Strategic growth planning'}
**Year 2 Action Plan**: ${isNegative ? 'Achieve break-even status on portfolio' : 'Controlled expansion'}  
**Year 3 Action Plan**: ${isNegative ? 'Begin selective acquisition after portfolio is profitable' : 'Accelerated growth'}

${isNegative ? 'IMPORTANT: Do NOT recommend acquiring properties until monthly cash flow is positive.' : ''}

Make recommendations realistic. If portfolio loses money, focus on improvement, not expansion.`;
  }
  
  /**
   * Get current market conditions (simplified for MVP)
   */
  private async getCurrentMarketConditions(): Promise<any> {
    // For MVP, return reasonable defaults
    // In production, this would integrate with FRED API and other market data
    return {
      currentRates: '7.2',
      trends: 'Elevated interest rates creating buying opportunities',
      indicators: 'Inflation moderating, employment stable, housing inventory improving'
    };
  }
  
  /**
   * Get user profile (simplified for MVP)
   */
  private async getUserProfile(userId: string): Promise<any> {
    // For MVP, return reasonable defaults
    // In production, this would query user preferences and financial data
    return {
      experienceLevel: 'intermediate',
      availableCapital: 'Market-dependent'
    };
  }
  
  /**
   * Get peer benchmarks (simplified for MVP)
   */
  private async getPeerBenchmarks(portfolio: any): Promise<any> {
    const propertyCount = portfolio.analytics?.summary?.totalProperties || 1;
    
    // Simplified benchmarks based on property count
    if (propertyCount <= 2) {
      return {
        averagePortfolioValue: 450000,
        averagePropertyCount: 2,
        averageMonthlyCashFlow: 800,
        averageCapRate: 3.2,
        averageCashOnCash: 2.1
      };
    } else if (propertyCount <= 5) {
      return {
        averagePortfolioValue: 1200000,
        averagePropertyCount: 4,
        averageMonthlyCashFlow: 2100,
        averageCapRate: 3.8,
        averageCashOnCash: 2.4
      };
    } else {
      return {
        averagePortfolioValue: 2800000,
        averagePropertyCount: 8,
        averageMonthlyCashFlow: 5200,
        averageCapRate: 4.1,
        averageCashOnCash: 2.7
      };
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  private formatGeographicDistribution(risk: any): string {
    if (!risk) return 'Unknown distribution';
    return risk.topMarket || 'Multiple markets';
  }
  
  private formatGoalTarget(goals: any): string {
    if (!goals) return 'No specific target set';
    
    if (goals.targetMonthlyIncome) {
      return `$${goals.targetMonthlyIncome.toLocaleString()}/month passive income`;
    } else if (goals.targetNetWorth) {
      return `$${goals.targetNetWorth.toLocaleString()} net worth`;
    } else {
      return 'General wealth building';
    }
  }
  
  private formatGoalTargetForPath(goals: any): string {
    if (!goals) return 'Wealth building goal';
    
    if (goals.targetMonthlyIncome) {
      return `$${goals.targetMonthlyIncome.toLocaleString()}/month passive income`;
    } else if (goals.targetNetWorth) {
      return `$${goals.targetNetWorth.toLocaleString()} net worth`;
    } else {
      return 'Build investment portfolio';
    }
  }
  
  private getTopMarkets(risk: any): string {
    if (!risk?.topMarket) return 'Diversified';
    return risk.topMarket;
  }
  
  private getPropertyMix(portfolio: any): string {
    const count = portfolio.analytics?.summary?.totalProperties || 0;
    return count > 1 ? `${count} properties` : `${count} property`;
  }
  
  
  // ==================== RESPONSE PARSERS ====================
  
  private parseHealthCheckResponse(content: string): HealthCheckInsights {
    console.log('Raw AI Health Check Response:', content);
    
    // Extract sections using cleaner patterns
    const riskMatch = content.match(/\*\*Biggest Risk\*\*:\s*(.*?)(?=\*\*Best Opportunity|$)/is);
    const opportunityMatch = content.match(/\*\*Best Opportunity\*\*:\s*(.*?)(?=\*\*Action This Month|$)/is);
    const actionMatch = content.match(/\*\*Action This Month\*\*:\s*(.*?)(?=$)/is);
    
    // Clean up and split descriptions
    const riskText = riskMatch?.[1]?.trim() || '';
    const opportunityText = opportunityMatch?.[1]?.trim() || '';
    const actionText = actionMatch?.[1]?.trim() || '';
    
    // Split each section into sentences
    const riskSentences = riskText.split('.').filter(s => s.trim().length > 10);
    const opportunitySentences = opportunityText.split('.').filter(s => s.trim().length > 10);
    const actionSentences = actionText.split('.').filter(s => s.trim().length > 10);
    
    return {
      biggestRisk: {
        title: riskSentences[0]?.trim() || 'Portfolio Risk Assessment',
        description: riskText,
        severity: 'MEDIUM' as const,
        impact: riskSentences[1]?.trim() || 'Impact assessment pending'
      },
      bestOpportunity: {
        title: opportunitySentences[0]?.trim() || 'Growth Opportunity',
        description: opportunityText,
        potentialImpact: opportunitySentences[1]?.trim() || 'Impact assessment pending',
        timeframe: 'Next 3-6 months'
      },
      actionThisMonth: {
        action: actionSentences[0]?.trim() || 'Monthly Action Item',
        why: actionSentences[1]?.trim() || 'Action rationale pending',
        expectedResult: actionSentences[1]?.trim() || 'Result assessment pending'
      }
    };
  }
  
  private parsePeerComparisonResponse(content: string): PeerComparisonInsights {
    // Improved parsing for peer comparison
    console.log('Raw AI Peer Comparison Response:', content);
    
    const outperformingMatch = content.match(/\*\*Outperforming\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    const laggingMatch = content.match(/\*\*Lagging\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    const whyItMattersMatch = content.match(/\*\*Why It Matters\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    
    return {
      outperforming: {
        metrics: ['Portfolio Performance Metrics'],
        advantage: outperformingMatch?.[1]?.trim() || 'Performance analysis in progress'
      },
      lagging: {
        metrics: ['Areas for Improvement'],
        gap: laggingMatch?.[1]?.trim() || 'Gap analysis in progress'
      },
      whyItMatters: {
        strengths: this.extractFirstSentence(whyItMattersMatch?.[1] || 'Strengths assessment pending'),
        concerns: this.extractDescription(whyItMattersMatch?.[1] || 'Concerns assessment pending'),
        longTermImpact: 'Focus on portfolio balance for sustainable growth'
      }
    };
  }
  
  private parseGoalPathResponse(content: string): GoalPathInsights {
    // Improved parsing for goal path with better timeline extraction
    console.log('Raw AI Goal Path Response:', content);
    
    const propertiesMatch = content.match(/\*\*Properties Needed\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    const locationsMatch = content.match(/\*\*Target Locations\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    const capitalMatch = content.match(/\*\*Capital Required\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    
    // Better timeline extraction for action plans
    const year1Match = content.match(/\*\*Year 1 Action Plan\*\*[:\s]*(.*?)(?=\*\*Year 2|\*\*|$)/is);
    const year2Match = content.match(/\*\*Year 2 Action Plan\*\*[:\s]*(.*?)(?=\*\*Year 3|\*\*|$)/is);
    const year3Match = content.match(/\*\*Year 3 Action Plan\*\*[:\s]*(.*?)(?=\*\*|$)/is);
    
    // Extract numbers from content
    const propertyCount = this.extractNumber(propertiesMatch?.[1] || '', 4);
    const avgPrice = this.extractNumber(propertiesMatch?.[1] || '', 350000);
    
    return {
      propertiesNeeded: {
        count: propertyCount,
        types: [this.extractDescription(propertiesMatch?.[1] || 'Mixed property types')],
        avgPrice: avgPrice
      },
      targetLocations: {
        primary: this.extractFirstSentence(locationsMatch?.[1] || 'Primary growth markets'),
        secondary: 'Secondary growth markets',
        reasoning: this.extractDescription(locationsMatch?.[1] || 'Strategic market selection')
      },
      capitalRequired: {
        totalInvestment: avgPrice * propertyCount,
        downPayments: Math.round((avgPrice * propertyCount) * 0.2),
        reserves: Math.round((avgPrice * propertyCount) * 0.05),
        closingCosts: Math.round((avgPrice * propertyCount) * 0.02)
      },
      timeline: {
        year1: this.cleanActionPlan(year1Match?.[1]) || 'Research target markets and prepare financing for first acquisition',
        year2: this.cleanActionPlan(year2Match?.[1]) || 'Execute strategic acquisition based on market analysis',
        year3: this.cleanActionPlan(year3Match?.[1]) || 'Evaluate portfolio performance and plan next phase'
      }
    };
  }
  
  // ==================== TEXT EXTRACTION HELPERS ====================
  
  private extractTitle(text: string, fallback: string): string {
    const match = text.match(/^([^:]+):/);
    return match ? match[1].trim() : fallback;
  }
  
  private extractDescription(text: string): string {
    const sentences = text.split('.').filter(s => s.length > 10);
    return sentences[0]?.trim() + '.' || 'Analysis pending';
  }
  
  private extractImpact(text: string): string {
    const sentences = text.split('.').filter(s => s.length > 5);
    return sentences[sentences.length - 1]?.trim() || 'Impact assessment pending';
  }
  
  private extractFirstSentence(text: string): string {
    const sentence = text.split('.')[0]?.trim();
    return sentence || 'Analysis pending';
  }
  
  private extractNumber(text: string, fallback: number): number {
    const match = text.match(/\$?(\d{1,3}(?:,\d{3})*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : fallback;
  }
  
  private extractTimelineYear(text: string, year: number): string | null {
    const patterns = [
      new RegExp(`Year ${year}[:\s]*(.*?)(?=Year|$)`, 'i'),
      new RegExp(`${year}\\.[:\s]*(.*?)(?=\\d\\.|$)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim().split('.')[0];
      }
    }
    return null;
  }
  
  private cleanActionPlan(text: string | undefined): string | null {
    if (!text) return null;
    
    // Clean up the action plan text
    const cleaned = text.trim()
      .replace(/^[-\s]*/, '') // Remove leading dashes and spaces
      .replace(/\n\s*-/g, '; ') // Convert bullet points to semicolon separated
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    // Return first meaningful sentence or paragraph
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length > 0 ? sentences[0].trim() + '.' : null;
  }
}

// ==================== TYPE DEFINITIONS ====================

export interface HealthCheckInsights {
  biggestRisk: {
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: string;
  };
  bestOpportunity: {
    title: string;
    description: string;
    potentialImpact: string;
    timeframe: string;
  };
  actionThisMonth: {
    action: string;
    why: string;
    expectedResult: string;
  };
}

export interface PeerComparisonInsights {
  outperforming: {
    metrics: string[];
    advantage: string;
  };
  lagging: {
    metrics: string[];
    gap: string;
  };
  whyItMatters: {
    strengths: string;
    concerns: string;
    longTermImpact: string;
  };
}

export interface GoalPathInsights {
  propertiesNeeded: {
    count: number;
    types: string[];
    avgPrice: number;
  };
  targetLocations: {
    primary: string;
    secondary: string;
    reasoning: string;
  };
  capitalRequired: {
    totalInvestment: number;
    downPayments: number;
    reserves: number;
    closingCosts: number;
  };
  timeline: {
    year1: string;
    year2: string;
    year3: string;
  };
}

export interface ComprehensiveInsights {
  healthCheck: HealthCheckInsights;
  peerComparison: PeerComparisonInsights;
  goalPath: GoalPathInsights;
}

interface PortfolioContext {
  userId: string;
  goals: any;
  analytics: any;
  [key: string]: any;
}

// Export service instance
export const enhancedPortfolioAI = new EnhancedPortfolioAI();