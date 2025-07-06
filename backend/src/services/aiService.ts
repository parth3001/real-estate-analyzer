import { getOpenAIClient, generateAnalysis } from './openai';
import { logger } from '../utils/logger';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { AIInsights, ScoreBreakdown } from '../types/analysis';
import { enhancedSfrAnalysisPrompt, enhancedMfAnalysisPrompt } from '../prompts/enhancedAIPrompts';
import { 
  performComprehensiveMarketAnalysis,
  calculateMarketPositioning,
  calculateAffordabilityAnalysis,
  analyzeMarketDynamics,
  generateDemographicInsights
} from '../utils/marketAnalysis';

export async function getAIInsights(dealData: SFRData | MultiFamilyData, analysis: any): Promise<AIInsights> {
  try {
    logger.info('Enhanced AI insights generation started');
    const openai = getOpenAIClient();
    if (!openai) {
      return {
        summary: "AI insights are not available. Please check your OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }

    // Calculate comprehensive market analysis if census data is available
    let marketAnalysis = null;
    if (analysis.censusData) {
      try {
        // Get monthly rent based on property type
        const monthlyRent = dealData.propertyType === 'SFR' 
          ? (dealData as SFRData).monthlyRent 
          : (dealData as MultiFamilyData).unitTypes?.reduce((total, unit) => total + (unit.monthlyRent * unit.count), 0) || 0;
        
        marketAnalysis = performComprehensiveMarketAnalysis({
          propertyPrice: dealData.purchasePrice,
          monthlyRent: monthlyRent,
          marketMedianValue: analysis.censusData.housing?.medianHomeValue || dealData.purchasePrice,
          marketMedianRent: analysis.censusData.housing?.medianRent || monthlyRent,
          medianHouseholdIncome: analysis.censusData.income?.medianHouseholdIncome || 70000,
          vacancyRate: analysis.censusData.housing?.vacancyRate || 5,
          medianAge: analysis.censusData.demographics?.medianAge || 35,
          populationGrowth: analysis.censusData.demographics?.populationGrowth,
          propertyQuality: 5 // Default property quality score
        });
        
        logger.info('Market analysis calculated successfully for AI insights');
      } catch (error) {
        logger.warn('Could not calculate market analysis for AI insights:', error);
      }
    }

    // Generate score breakdown based on analysis and market data
    const scoreBreakdown = generateScoreBreakdown(analysis, marketAnalysis);
    
    // Generate prompt based on property type using enhanced prompts from enhancedAIPrompts.ts
    let prompt: string;
    
    // Log successful integration of market analysis
    if (marketAnalysis) {
      logger.info('Market analysis integrated with AI prompt generation', {
        investmentScore: marketAnalysis.investmentScore?.score,
        marketPosition: marketAnalysis.marketPositioning?.position,
        hasAffordabilityAnalysis: !!marketAnalysis.affordabilityAnalysis
      });
    }
    
    if (dealData.propertyType === 'SFR') {
      prompt = enhancedSfrAnalysisPrompt(dealData, analysis, marketAnalysis);
    } else {
      prompt = enhancedMfAnalysisPrompt(dealData, analysis, marketAnalysis);
    }

    logger.info(`Generated ${dealData.propertyType} analysis prompt (${prompt.length} chars)`);

    try {
      // Use the updated generateAnalysis function from openai.ts
      const aiResponse = await generateAnalysis(prompt);
      
      return {
        // Basic insights
        summary: aiResponse.summary || "No summary provided",
        strengths: aiResponse.strengths || [],
        weaknesses: aiResponse.weaknesses || [],
        recommendations: aiResponse.recommendations || [],
        riskAssessment: aiResponse.riskAssessment,
        investmentScore: aiResponse.investmentScore || null,
        scoreBreakdown: scoreBreakdown, // Add the calculated score breakdown
        
        // Property-specific insights
        unitMixAnalysis: aiResponse.unitMixAnalysis,
        marketPositionAnalysis: aiResponse.marketPositionAnalysis,
        
        // Value-add and hold period
        valueAddOpportunities: aiResponse.valueAddOpportunities,
        recommendedHoldPeriod: aiResponse.recommendedHoldPeriod,
        
        // Predictive analysis fields
        marketTrendPrediction: aiResponse.marketTrendPrediction,
        optimalExitStrategy: aiResponse.optimalExitStrategy,
        
        // Enhanced strategic analysis fields
        investorFit: aiResponse.investorFit,
        strategicInsights: aiResponse.strategicInsights,
        competitiveAdvantage: aiResponse.competitiveAdvantage,
        wealthBuildingPotential: aiResponse.wealthBuildingPotential,
        marketCycleAnalysis: aiResponse.marketCycleAnalysis,
        financingRecommendations: aiResponse.financingRecommendations,
        portfolioFitAnalysis: aiResponse.portfolioFitAnalysis,
        opportunityCostAnalysis: aiResponse.opportunityCostAnalysis,
        
        // Additional notes
        notes: aiResponse.notes
      };
    } catch (error) {
      logger.error('Error generating AI insights:', error);
      return {
        summary: "Error generating AI insights. Please try again later.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
  } catch (error) {
    logger.error('Unexpected error in getAIInsights:', error);
    return {
      summary: "An unexpected error occurred during AI analysis.",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: null
    };
  }
}

export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      logger.warn('OpenAI client not initialized');
      return 'AI service is not available';
    }

    // Use the new OpenAI v5+ API format with chat completions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful real estate investment assistant. Provide clear, concise responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0].message?.content?.trim() || 'No response generated';
  } catch (error) {
    logger.error('Error generating AI response:', error);
    return 'Error generating AI response';
  }
}; 

/**
 * Generate score breakdown for AI insights based on financial analysis and market data
 */
function generateScoreBreakdown(analysis: any, marketAnalysis: any): ScoreBreakdown {
  const scoreBreakdown: ScoreBreakdown = {};
  
  try {
    // Cash Flow Score (0-100)
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    const cashFlowScore = Math.min(100, Math.max(0, (cashFlow > 0 ? 70 : 30) + (cashFlow / 500 * 30)));
    scoreBreakdown.cashFlow = {
      score: Math.round(cashFlowScore),
      max: 100,
      reason: cashFlow > 0 ? 
        `Positive cash flow of $${cashFlow.toFixed(0)}/month indicates good rental performance` :
        `Negative cash flow of $${Math.abs(cashFlow).toFixed(0)}/month requires careful consideration`
    };

    // Market Position Score (0-100) 
    let marketPositionScore = 60; // Default neutral score
    let marketPositionReason = 'Market position analysis based on available data';
    
    if (marketAnalysis?.investmentScore) {
      marketPositionScore = marketAnalysis.investmentScore.score;
      marketPositionReason = `${marketAnalysis.marketPositioning.position} - ${marketAnalysis.marketPositioning.competitiveAdvantage}`;
    } else if (analysis?.keyMetrics?.capRate) {
      const capRate = analysis.keyMetrics.capRate;
      if (capRate >= 8) {
        marketPositionScore = 85;
        marketPositionReason = `Excellent cap rate of ${capRate.toFixed(2)}% indicates strong market positioning`;
      } else if (capRate >= 6) {
        marketPositionScore = 70;
        marketPositionReason = `Good cap rate of ${capRate.toFixed(2)}% shows solid market positioning`;
      } else if (capRate >= 4) {
        marketPositionScore = 55;
        marketPositionReason = `Moderate cap rate of ${capRate.toFixed(2)}% suggests average market positioning`;
      } else {
        marketPositionScore = 35;
        marketPositionReason = `Low cap rate of ${capRate.toFixed(2)}% may indicate challenging market positioning`;
      }
    }
    
    scoreBreakdown.marketPosition = {
      score: Math.round(marketPositionScore),
      max: 100,
      reason: marketPositionReason
    };

    // Financial Metrics Score (0-100)
    const keyMetrics = analysis?.keyMetrics || {};
    let financialScore = 50; // Base score
    let financialFactors: string[] = [];
    
    // Cap Rate component (25 points)
    if (keyMetrics.capRate) {
      if (keyMetrics.capRate >= 8) {
        financialScore += 25;
        financialFactors.push('excellent cap rate');
      } else if (keyMetrics.capRate >= 6) {
        financialScore += 15;
        financialFactors.push('good cap rate');
      } else if (keyMetrics.capRate >= 4) {
        financialScore += 5;
        financialFactors.push('moderate cap rate');
      } else {
        financialScore -= 10;
        financialFactors.push('low cap rate');
      }
    }
    
    // Cash-on-Cash Return component (25 points)
    if (keyMetrics.cashOnCashReturn) {
      if (keyMetrics.cashOnCashReturn >= 12) {
        financialScore += 25;
        financialFactors.push('excellent CoC return');
      } else if (keyMetrics.cashOnCashReturn >= 8) {
        financialScore += 15;
        financialFactors.push('good CoC return');
      } else if (keyMetrics.cashOnCashReturn >= 4) {
        financialScore += 5;
        financialFactors.push('moderate CoC return');
      } else {
        financialScore -= 10;
        financialFactors.push('low CoC return');
      }
    }
    
    financialScore = Math.min(100, Math.max(0, financialScore));
    scoreBreakdown.financialMetrics = {
      score: Math.round(financialScore),
      max: 100,
      reason: `Financial strength based on ${financialFactors.join(', ')}`
    };

    // Risk Assessment Score (0-100)
    let riskScore = 70; // Start with moderate risk score
    let riskFactors: string[] = [];
    
    // DSCR Risk Factor
    if (keyMetrics.dscr) {
      if (keyMetrics.dscr >= 1.5) {
        riskScore += 15;
        riskFactors.push('strong debt coverage');
      } else if (keyMetrics.dscr >= 1.2) {
        riskScore += 5;
        riskFactors.push('adequate debt coverage');
      } else if (keyMetrics.dscr < 1.0) {
        riskScore -= 20;
        riskFactors.push('insufficient debt coverage');
      }
    }
    
    // Market Conditions Risk
    if (marketAnalysis?.marketDynamics) {
      if (marketAnalysis.marketDynamics.investmentTiming === 'Favorable') {
        riskScore += 10;
        riskFactors.push('favorable market timing');
      } else if (marketAnalysis.marketDynamics.investmentTiming === 'Challenging') {
        riskScore -= 10;
        riskFactors.push('challenging market conditions');
      }
    }
    
    // Affordability Risk  
    if (marketAnalysis?.affordabilityAnalysis) {
      if (marketAnalysis.affordabilityAnalysis.tenantPoolSize === 'Large') {
        riskScore += 10;
        riskFactors.push('large tenant pool');
      } else if (marketAnalysis.affordabilityAnalysis.tenantPoolSize === 'Very Limited') {
        riskScore -= 15;
        riskFactors.push('limited tenant pool');
      }
    }
    
    riskScore = Math.min(100, Math.max(0, riskScore));
    scoreBreakdown.riskAssessment = {
      score: Math.round(riskScore),
      max: 100,
      reason: `Risk assessment based on ${riskFactors.length > 0 ? riskFactors.join(', ') : 'available risk indicators'}`
    };

    logger.info('Score breakdown generated successfully', { 
      cashFlow: scoreBreakdown.cashFlow?.score,
      marketPosition: scoreBreakdown.marketPosition?.score,
      financialMetrics: scoreBreakdown.financialMetrics?.score,
      riskAssessment: scoreBreakdown.riskAssessment?.score
    });

  } catch (error) {
    logger.error('Error generating score breakdown:', error);
    // Return default scores if calculation fails
    scoreBreakdown.cashFlow = { score: 50, max: 100, reason: 'Score calculation unavailable' };
    scoreBreakdown.marketPosition = { score: 50, max: 100, reason: 'Score calculation unavailable' };
    scoreBreakdown.financialMetrics = { score: 50, max: 100, reason: 'Score calculation unavailable' };
    scoreBreakdown.riskAssessment = { score: 50, max: 100, reason: 'Score calculation unavailable' };
  }
  
  return scoreBreakdown;
}
