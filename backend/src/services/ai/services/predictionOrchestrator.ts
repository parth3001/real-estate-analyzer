/**
 * Prediction Orchestrator - Manages parallel prediction services
 * Runs 4 focused predictions simultaneously
 * Target response time: 2000ms total (all running in parallel)
 */

import { logger } from '../../../utils/logger';
import { getOpenAIClient } from '../../openai';
import { SFRData, MultiFamilyData } from '../../../types/propertyTypes';

export interface MarketTimingPrediction {
  recommendation: string;
  confidence: number;
  keyReason: string;
  refinanceTrigger?: {
    targetRate: number;
    expectedDate: string;
    monthlySavings: number;
  };
}

export interface RentGrowthPrediction {
  predictions: {
    '6months': number;
    '1year': number;
    '2years': number;
    '3years': number;
  };
  confidence: number;
  factors: string[];
}

export interface RiskAssessmentPrediction {
  overallRiskScore: number;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  marketRisk: number;
  operationalRisk: number;
  financialRisk: number;
}

export interface ExitStrategyPrediction {
  optimalExitDate: string;
  expectedSalePrice: number;
  totalReturn: number;
  reasoning: string;
  alternativeStrategies: string[];
}

export class PredictionOrchestrator {
  private openai: any;

  constructor() {
    this.openai = getOpenAIClient();
  }

  async generateAllPredictions(
    dealData: SFRData | MultiFamilyData,
    analysis: any
  ): Promise<{
    marketTiming: MarketTimingPrediction | null;
    rentGrowth: RentGrowthPrediction | null;
    riskAssessment: RiskAssessmentPrediction | null;
    exitStrategy: ExitStrategyPrediction | null;
  }> {
    const startTime = Date.now();
    logger.info('Prediction Orchestrator: Starting parallel predictions');

    // Prepare shared context
    const context = this.prepareContext(dealData, analysis);

    // Run all predictions in parallel
    const [marketTiming, rentGrowth, riskAssessment, exitStrategy] = await Promise.allSettled([
      this.predictMarketTiming(context),
      this.predictRentGrowth(context),
      this.predictRiskAssessment(context),
      this.predictExitStrategy(context)
    ]);

    const results = {
      marketTiming: marketTiming.status === 'fulfilled' ? marketTiming.value : null,
      rentGrowth: rentGrowth.status === 'fulfilled' ? rentGrowth.value : null,
      riskAssessment: riskAssessment.status === 'fulfilled' ? riskAssessment.value : null,
      exitStrategy: exitStrategy.status === 'fulfilled' ? exitStrategy.value : null
    };

    const successCount = Object.values(results).filter(r => r !== null).length;
    const totalTime = Date.now() - startTime;

    logger.info('Prediction Orchestrator: Completed', {
      totalTime: `${totalTime}ms`,
      successfulPredictions: `${successCount}/4`,
      failed: Object.entries(results)
        .filter(([_, v]) => v === null)
        .map(([k, _]) => k)
    });

    return results;
  }

  private prepareContext(dealData: any, analysis: any): any {
    return {
      purchasePrice: dealData.purchasePrice,
      monthlyRent: this.getMonthlyRent(dealData),
      location: `${dealData.propertyAddress?.city}, ${dealData.propertyAddress?.state}`,
      capRate: analysis.keyMetrics?.capRate || 0,
      cashFlow: analysis.monthlyAnalysis?.cashFlow || 0,
      cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn || 0,
      mortgageRate: dealData.interestRate || 7.0,
      yearBuilt: dealData.yearBuilt || 2000,
      propertyType: dealData.propertyType,
      marketData: analysis.marketData,
      longTermProjections: analysis.longTermAnalysis?.projections?.slice(0, 5)
    };
  }

  private async predictMarketTiming(context: any): Promise<MarketTimingPrediction> {
    const prompt = `As a real estate market analyst, evaluate market timing for this property:
    
Location: ${context.location}
Current mortgage rate: ${context.mortgageRate}%
Property metrics: ${context.capRate}% cap rate, $${context.cashFlow}/mo cash flow
Market trends: ${context.marketData?.trends || 'stable'}

Provide market timing recommendation in JSON:
{
  "recommendation": "Buy now|Wait 3-6 months|Wait 6-12 months|Market too expensive",
  "confidence": <60-95>,
  "keyReason": "<one clear reason>",
  "refinanceTrigger": {
    "targetRate": <if rates should drop>,
    "expectedDate": "<timeframe>",
    "monthlySavings": <estimated savings>
  }
}`;

    try {
      const response = await this.callOpenAI(prompt, 300);
      return this.validateMarketTiming(response);
    } catch (error) {
      logger.error('Market timing prediction failed:', error);
      return this.getFallbackMarketTiming(context);
    }
  }

  private async predictRentGrowth(context: any): Promise<RentGrowthPrediction> {
    const currentRent = context.monthlyRent;
    
    const prompt = `Predict rent growth for this property:
    
Location: ${context.location}
Current rent: $${currentRent}/month
Property type: ${context.propertyType}
Year built: ${context.yearBuilt}

Based on market trends, provide rent predictions in JSON:
{
  "predictions": {
    "6months": <rent amount>,
    "1year": <rent amount>,
    "2years": <rent amount>,
    "3years": <rent amount>
  },
  "confidence": <70-90>,
  "factors": ["<factor1>", "<factor2>"]
}`;

    try {
      const response = await this.callOpenAI(prompt, 250);
      return this.validateRentGrowth(response, currentRent);
    } catch (error) {
      logger.error('Rent growth prediction failed:', error);
      return this.getFallbackRentGrowth(currentRent);
    }
  }

  private async predictRiskAssessment(context: any): Promise<RiskAssessmentPrediction> {
    const prompt = `Assess investment risks for this property:
    
Property: ${context.propertyType} in ${context.location}
Metrics: ${context.capRate}% cap rate, ${context.cashOnCashReturn}% CoC return
Cash flow: $${context.cashFlow}/month

Provide risk assessment in JSON:
{
  "overallRiskScore": <0-100, lower is better>,
  "risks": [
    {"type": "Market downturn", "severity": "low|medium|high", "mitigation": "<strategy>"},
    {"type": "<risk2>", "severity": "low|medium|high", "mitigation": "<strategy>"}
  ],
  "marketRisk": <0-100>,
  "operationalRisk": <0-100>,
  "financialRisk": <0-100>
}`;

    try {
      const response = await this.callOpenAI(prompt, 350);
      return this.validateRiskAssessment(response);
    } catch (error) {
      logger.error('Risk assessment prediction failed:', error);
      return this.getFallbackRiskAssessment(context);
    }
  }

  private async predictExitStrategy(context: any): Promise<ExitStrategyPrediction> {
    const projections = context.longTermProjections || [];
    const year5Value = projections[4]?.propertyValue || context.purchasePrice * 1.2;
    
    const prompt = `Recommend exit strategy for this investment:
    
Purchase price: $${context.purchasePrice}
Current cash flow: $${context.cashFlow}/month
5-year projected value: $${year5Value}
Location: ${context.location}

Provide exit strategy in JSON:
{
  "optimalExitDate": "Year X" or "Hold indefinitely",
  "expectedSalePrice": <amount>,
  "totalReturn": <amount>,
  "reasoning": "<clear explanation>",
  "alternativeStrategies": ["<option1>", "<option2>"]
}`;

    try {
      const response = await this.callOpenAI(prompt, 300);
      return this.validateExitStrategy(response, context);
    } catch (error) {
      logger.error('Exit strategy prediction failed:', error);
      return this.getFallbackExitStrategy(context);
    }
  }

  private async callOpenAI(prompt: string, maxTokens: number): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a real estate investment predictor. Always respond in valid JSON format.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Validation methods ensure responses meet expected structure
  private validateMarketTiming(response: any): MarketTimingPrediction {
    return {
      recommendation: response.recommendation || 'Buy now',
      confidence: Math.min(95, Math.max(60, response.confidence || 75)),
      keyReason: response.keyReason || 'Based on current market conditions',
      refinanceTrigger: response.refinanceTrigger
    };
  }

  private validateRentGrowth(response: any, currentRent: number): RentGrowthPrediction {
    const predictions = response.predictions || {};
    return {
      predictions: {
        '6months': predictions['6months'] || currentRent * 1.015,
        '1year': predictions['1year'] || currentRent * 1.03,
        '2years': predictions['2years'] || currentRent * 1.06,
        '3years': predictions['3years'] || currentRent * 1.09
      },
      confidence: Math.min(90, Math.max(70, response.confidence || 80)),
      factors: Array.isArray(response.factors) ? response.factors : ['Market trends', 'Location demand']
    };
  }

  private validateRiskAssessment(response: any): RiskAssessmentPrediction {
    return {
      overallRiskScore: Math.min(100, Math.max(0, response.overallRiskScore || 50)),
      risks: Array.isArray(response.risks) ? response.risks.slice(0, 5) : [],
      marketRisk: response.marketRisk || 40,
      operationalRisk: response.operationalRisk || 30,
      financialRisk: response.financialRisk || 35
    };
  }

  private validateExitStrategy(response: any, context: any): ExitStrategyPrediction {
    return {
      optimalExitDate: response.optimalExitDate || 'Year 5',
      expectedSalePrice: response.expectedSalePrice || context.purchasePrice * 1.3,
      totalReturn: response.totalReturn || context.purchasePrice * 0.5,
      reasoning: response.reasoning || 'Based on market appreciation trends',
      alternativeStrategies: Array.isArray(response.alternativeStrategies) ? 
        response.alternativeStrategies : ['Hold and refinance', 'Sell to upgrade']
    };
  }

  // Fallback methods for when AI fails
  private getFallbackMarketTiming(context: any): MarketTimingPrediction {
    const highRate = context.mortgageRate > 7;
    return {
      recommendation: highRate ? 'Wait 3-6 months' : 'Buy now',
      confidence: 70,
      keyReason: highRate ? 'Mortgage rates are elevated' : 'Favorable market conditions',
      refinanceTrigger: highRate ? {
        targetRate: 6.5,
        expectedDate: '6-12 months',
        monthlySavings: Math.round(context.cashFlow * 0.15)
      } : undefined
    };
  }

  private getFallbackRentGrowth(currentRent: number): RentGrowthPrediction {
    return {
      predictions: {
        '6months': Math.round(currentRent * 1.015),
        '1year': Math.round(currentRent * 1.03),
        '2years': Math.round(currentRent * 1.06),
        '3years': Math.round(currentRent * 1.09)
      },
      confidence: 75,
      factors: ['Historical 3% annual growth', 'Stable market conditions']
    };
  }

  private getFallbackRiskAssessment(context: any): RiskAssessmentPrediction {
    const cashFlowRisk = context.cashFlow < 200 ? 'high' : context.cashFlow < 500 ? 'medium' : 'low';
    return {
      overallRiskScore: cashFlowRisk === 'high' ? 65 : cashFlowRisk === 'medium' ? 45 : 30,
      risks: [
        {
          type: 'Cash flow volatility',
          severity: cashFlowRisk,
          mitigation: 'Maintain 6-month reserve fund'
        },
        {
          type: 'Market correction',
          severity: 'medium',
          mitigation: 'Focus on long-term appreciation'
        }
      ],
      marketRisk: 40,
      operationalRisk: 35,
      financialRisk: cashFlowRisk === 'high' ? 60 : 40
    };
  }

  private getFallbackExitStrategy(context: any): ExitStrategyPrediction {
    return {
      optimalExitDate: 'Year 5-7',
      expectedSalePrice: Math.round(context.purchasePrice * 1.25),
      totalReturn: Math.round(context.purchasePrice * 0.4),
      reasoning: 'Typical appreciation cycle with equity buildup',
      alternativeStrategies: ['Hold for cash flow', 'Refinance and reinvest']
    };
  }

  private getMonthlyRent(dealData: any): number {
    if (dealData.propertyType === 'SFR') {
      return dealData.monthlyRent;
    } else {
      return dealData.unitTypes?.reduce((total: number, unit: any) => 
        total + (unit.monthlyRent * unit.count), 0) || 0;
    }
  }
}