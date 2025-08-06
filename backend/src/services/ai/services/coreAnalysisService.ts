/**
 * Core Analysis Service - Provides fundamental investment insights
 * Target response time: 500ms
 * Token usage: ~500 tokens
 */

import { getOpenAIClient } from '../../openai';
import { logger } from '../../../utils/logger';
import { AIInsights } from '../../../types/analysis';
import { SFRData, MultiFamilyData } from '../../../types/propertyTypes';

export class CoreAnalysisService {
  private openai: any;

  constructor() {
    this.openai = getOpenAIClient();
  }

  async analyze(dealData: SFRData | MultiFamilyData, analysis: any): Promise<AIInsights> {
    const startTime = Date.now();
    
    try {
      // Extract key metrics for prompt
      const metrics = {
        capRate: analysis.keyMetrics?.capRate || 0,
        cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn || 0,
        monthlyCashFlow: analysis.monthlyAnalysis?.cashFlow || 0,
        dscr: analysis.keyMetrics?.dscr || 0,
        totalROI: analysis.keyMetrics?.totalROI || 0,
        rentToValue: analysis.keyMetrics?.rentToValue || 0,
        operatingExpenseRatio: analysis.keyMetrics?.operatingExpenseRatio || 0,
        irr: analysis.keyMetrics?.irr || 0,
        purchasePrice: dealData.purchasePrice,
        monthlyRent: this.getMonthlyRent(dealData),
        propertyType: dealData.propertyType
      };

      // Build focused prompt (much smaller than mega-prompt)
      const prompt = this.buildPrompt(metrics);

      if (!this.openai) {
        logger.warn('OpenAI client not available, using rule-based insights');
        return this.generateRuleBasedInsights(metrics);
      }

      // Call OpenAI with optimized settings
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster model for basic analysis
        messages: [{
          role: 'system',
          content: 'You are a real estate investment analyst. Provide concise, actionable insights in JSON format.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      const processingTime = Date.now() - startTime;
      logger.info('Core Analysis Service completed', {
        processingTime: `${processingTime}ms`,
        tokenUsage: completion.usage?.total_tokens || 0
      });

      return this.validateAndEnhanceResponse(response, metrics);

    } catch (error) {
      logger.error('Core Analysis Service error:', error);
      return this.generateRuleBasedInsights(this.extractMetrics(analysis));
    }
  }

  private buildPrompt(metrics: any): string {
    return `Analyze this ${metrics.propertyType} investment property:

Key Metrics:
- Purchase Price: $${metrics.purchasePrice.toLocaleString()}
- Monthly Rent: $${metrics.monthlyRent.toLocaleString()}
- Cap Rate: ${metrics.capRate.toFixed(2)}%
- Cash-on-Cash Return: ${metrics.cashOnCashReturn.toFixed(2)}%
- Monthly Cash Flow: $${metrics.monthlyCashFlow.toFixed(0)}
- DSCR: ${metrics.dscr.toFixed(2)}
- Operating Expense Ratio: ${metrics.operatingExpenseRatio.toFixed(1)}%
- IRR: ${metrics.irr.toFixed(1)}%

Provide analysis in this exact JSON format:
{
  "investmentScore": <0-100 based on metrics>,
  "summary": "<One sentence investment summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}

Focus on actionable insights. Be specific with numbers.`;
  }

  private getMonthlyRent(dealData: SFRData | MultiFamilyData): number {
    if (dealData.propertyType === 'SFR') {
      return (dealData as SFRData).monthlyRent;
    } else {
      const mfData = dealData as MultiFamilyData;
      return mfData.unitTypes?.reduce((total, unit) => 
        total + (unit.monthlyRent * unit.count), 0) || 0;
    }
  }

  private validateAndEnhanceResponse(response: any, metrics: any): AIInsights {
    // Ensure all required fields exist
    return {
      summary: response.summary || `Investment shows ${metrics.capRate.toFixed(1)}% cap rate.`,
      strengths: Array.isArray(response.strengths) ? response.strengths.slice(0, 5) : [],
      weaknesses: Array.isArray(response.weaknesses) ? response.weaknesses.slice(0, 5) : [],
      recommendations: Array.isArray(response.recommendations) ? response.recommendations.slice(0, 5) : [],
      investmentScore: this.validateScore(response.investmentScore, metrics),
      scoreBreakdown: this.generateScoreBreakdown(metrics)
    };
  }

  private validateScore(score: any, metrics: any): number {
    if (typeof score === 'number' && score >= 0 && score <= 100) {
      return Math.round(score);
    }
    // Calculate score based on metrics if not provided
    return this.calculateInvestmentScore(metrics);
  }

  private calculateInvestmentScore(metrics: any): number {
    let score = 50; // Base score

    // Cap rate contribution (0-25 points)
    if (metrics.capRate >= 10) score += 25;
    else if (metrics.capRate >= 8) score += 20;
    else if (metrics.capRate >= 6) score += 15;
    else if (metrics.capRate >= 4) score += 10;
    else if (metrics.capRate >= 2) score += 5;

    // Cash-on-cash contribution (0-25 points)
    if (metrics.cashOnCashReturn >= 15) score += 25;
    else if (metrics.cashOnCashReturn >= 12) score += 20;
    else if (metrics.cashOnCashReturn >= 9) score += 15;
    else if (metrics.cashOnCashReturn >= 6) score += 10;
    else if (metrics.cashOnCashReturn >= 3) score += 5;

    // Cash flow contribution (0-15 points)
    if (metrics.monthlyCashFlow >= 1000) score += 15;
    else if (metrics.monthlyCashFlow >= 500) score += 10;
    else if (metrics.monthlyCashFlow >= 200) score += 5;
    else if (metrics.monthlyCashFlow < 0) score -= 10;

    // DSCR contribution (0-10 points)
    if (metrics.dscr >= 1.5) score += 10;
    else if (metrics.dscr >= 1.25) score += 7;
    else if (metrics.dscr >= 1.0) score += 3;
    else if (metrics.dscr < 1.0) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  private generateScoreBreakdown(metrics: any): any {
    return {
      cashFlow: {
        score: metrics.monthlyCashFlow > 500 ? 20 : metrics.monthlyCashFlow > 0 ? 15 : 5,
        max: 25,
        reason: `Monthly cash flow of $${metrics.monthlyCashFlow.toFixed(0)}`
      },
      marketPosition: {
        score: metrics.capRate > 7 ? 20 : 15,
        max: 25,
        reason: `${metrics.capRate.toFixed(1)}% cap rate`
      },
      financialMetrics: {
        score: metrics.cashOnCashReturn > 10 ? 20 : 15,
        max: 25,
        reason: `${metrics.cashOnCashReturn.toFixed(1)}% cash-on-cash return`
      },
      riskAssessment: {
        score: metrics.dscr > 1.25 ? 20 : 15,
        max: 25,
        reason: `DSCR of ${metrics.dscr.toFixed(2)}`
      }
    };
  }

  private generateRuleBasedInsights(metrics: any): AIInsights {
    const insights: AIInsights = {
      summary: '',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: this.calculateInvestmentScore(metrics)
    };

    // Generate summary
    insights.summary = `This property offers a ${metrics.capRate.toFixed(1)}% cap rate with $${metrics.monthlyCashFlow.toFixed(0)}/month cash flow and ${metrics.cashOnCashReturn.toFixed(1)}% cash-on-cash return.`;

    // Determine strengths
    if (metrics.capRate >= 8) {
      insights.strengths.push(`Excellent cap rate of ${metrics.capRate.toFixed(1)}% exceeds market average`);
    }
    if (metrics.monthlyCashFlow >= 500) {
      insights.strengths.push(`Strong positive cash flow of $${metrics.monthlyCashFlow.toFixed(0)}/month`);
    }
    if (metrics.cashOnCashReturn >= 12) {
      insights.strengths.push(`Outstanding ${metrics.cashOnCashReturn.toFixed(1)}% cash-on-cash return`);
    }
    if (metrics.dscr >= 1.5) {
      insights.strengths.push(`Excellent debt coverage ratio of ${metrics.dscr.toFixed(2)}`);
    }

    // Determine weaknesses
    if (metrics.capRate < 5) {
      insights.weaknesses.push(`Low cap rate of ${metrics.capRate.toFixed(1)}% suggests overpricing`);
    }
    if (metrics.monthlyCashFlow < 200) {
      insights.weaknesses.push(`Minimal cash flow of $${metrics.monthlyCashFlow.toFixed(0)}/month`);
    }
    if (metrics.cashOnCashReturn < 8) {
      insights.weaknesses.push(`Below-average cash-on-cash return of ${metrics.cashOnCashReturn.toFixed(1)}%`);
    }

    // Generate recommendations
    if (metrics.capRate < 6) {
      insights.recommendations.push('Consider negotiating a lower purchase price to improve returns');
    }
    if (metrics.operatingExpenseRatio > 50) {
      insights.recommendations.push('Review operating expenses for potential cost savings');
    }
    if (metrics.monthlyCashFlow < 300) {
      insights.recommendations.push('Explore opportunities to increase rental income');
    }

    return insights;
  }

  private extractMetrics(analysis: any): any {
    return {
      capRate: analysis.keyMetrics?.capRate || 0,
      cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn || 0,
      monthlyCashFlow: analysis.monthlyAnalysis?.cashFlow || 0,
      dscr: analysis.keyMetrics?.dscr || 0,
      totalROI: analysis.keyMetrics?.totalROI || 0,
      rentToValue: analysis.keyMetrics?.rentToValue || 0,
      operatingExpenseRatio: analysis.keyMetrics?.operatingExpenseRatio || 0,
      irr: analysis.keyMetrics?.irr || 0
    };
  }
}