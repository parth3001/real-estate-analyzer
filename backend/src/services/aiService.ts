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

/**
 * Normalize risk level to match schema enum values
 */
function normalizeRiskLevel(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
  const normalized = riskLevel?.toLowerCase().trim();
  
  // Map variations to valid enum values
  switch (normalized) {
    case 'low':
      return 'low';
    case 'medium':
    case 'moderate':
      return 'medium';
    case 'high':
    case 'very high':
      return 'high';
    case 'critical':
    case 'extreme':
    case 'severe':
      return 'critical';
    default:
      return 'medium'; // Default to medium if unknown
  }
}

export async function getAIInsights(dealData: SFRData | MultiFamilyData, analysis: any): Promise<AIInsights> {
  try {
    logger.info('Enhanced AI insights generation started with market intelligence');
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
    } else {
      logger.warn('No census data available for market analysis - AI will use basic analysis data only');
    }

    // Extract market intelligence data for enhanced AI prompts
    const marketIntelligence = {
      marketData: analysis.marketData,
      marketInsights: analysis.marketInsights,
      investmentTiming: analysis.investmentTiming
    };

    logger.info('Market intelligence data extracted for AI enhancement', {
      hasMarketData: !!marketIntelligence.marketData,
      insightsCount: marketIntelligence.marketInsights?.length || 0,
      hasTimingAnalysis: !!marketIntelligence.investmentTiming
    });

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
      prompt = enhancedSfrAnalysisPrompt(dealData, analysis, marketAnalysis, marketIntelligence);
    } else {
      prompt = enhancedMfAnalysisPrompt(dealData, analysis, marketAnalysis, marketIntelligence);
    }

    logger.info(`Generated ${dealData.propertyType} analysis prompt (${prompt.length} chars)`);

    // LOG FULL PROMPT FOR DEBUGGING
    logger.info('=== FULL AI PROMPT ===');
    logger.info(prompt);
    logger.info('=== END PROMPT ===');

    try {
      // Use the updated generateAnalysis function from openai.ts (now returns text)
      const aiTextResponse = await generateAnalysis(prompt);

      // LOG FULL AI RESPONSE FOR DEBUGGING
      logger.info('=== FULL AI RESPONSE ===');
      logger.info(aiTextResponse);
      logger.info('=== END AI RESPONSE ===');
      
      // Parse the AI response - use different logic for JSON vs text responses
      const aiResponse = parseTextResponseToStructured(aiTextResponse);
      
      // Log the AI response for debugging
      logger.info('AI Text Response received:', {
        hasResponse: !!aiTextResponse,
        responseLength: aiTextResponse?.length || 0,
        parsedResponse: !!aiResponse,
        aiResponseType: typeof aiResponse,
        aiResponseKeys: aiResponse ? Object.keys(aiResponse) : [],
        investmentScore: aiResponse?.investmentScore,
        summary: aiResponse?.summary,
        strengthsType: typeof aiResponse?.strengths,
        strengthsLength: Array.isArray(aiResponse?.strengths) ? aiResponse.strengths.length : 'Not array',
        rawResponsePreview: aiTextResponse ? aiTextResponse.substring(0, 500) + '...' : 'No response'
      });
      
      // Log specific content for debugging
      logger.info('AI content analysis:', {
        summary: aiResponse?.summary?.substring(0, 100),
        firstStrength: Array.isArray(aiResponse?.strengths) ? aiResponse.strengths[0] : aiResponse?.strengths,
        firstWeakness: Array.isArray(aiResponse?.weaknesses) ? aiResponse.weaknesses[0] : aiResponse?.weaknesses,
        firstRecommendation: Array.isArray(aiResponse?.recommendations) ? aiResponse.recommendations[0] : aiResponse?.recommendations
      });
      
      // Log the full response for debugging the parsing issue
      logger.debug('Full AI text response:', aiTextResponse);
      logger.debug('Parsed AI response object:', JSON.stringify(aiResponse, null, 2));
      
      return {
        // Basic insights
        summary: aiResponse.summary || "No summary provided",
        strengths: aiResponse.strengths || [],
        weaknesses: aiResponse.weaknesses || [],
        recommendations: aiResponse.recommendations || [],
        riskAssessment: aiResponse.riskAssessment,
        investmentScore: (() => {
          // CRITICAL: Override AI investment score if deal has red flags
          let finalScore = typeof aiResponse.investmentScore === 'number' ? aiResponse.investmentScore : null;
          
          if (finalScore !== null) {
            const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
            const cocReturn = analysis?.keyMetrics?.cashOnCashReturn;
            const dscr = analysis?.keyMetrics?.dscr;
            
            // Apply critical override logic
            if (cashFlow < 0 && cocReturn < 0 && dscr < 1.0) {
              finalScore = Math.min(finalScore, 15); // Triple red flag
              logger.warn('AI score overridden: Triple red flags detected', { originalScore: aiResponse.investmentScore, finalScore });
            } else if ((cashFlow < 0 && cocReturn < 0) || (cashFlow < 0 && dscr < 1.0) || (cocReturn < 0 && dscr < 1.0)) {
              finalScore = Math.min(finalScore, 25); // Double red flag
              logger.warn('AI score overridden: Double red flags detected', { originalScore: aiResponse.investmentScore, finalScore });
            } else if (cashFlow < 0 || cocReturn < 0 || dscr < 1.0) {
              finalScore = Math.min(finalScore, 35); // Single red flag
              logger.warn('AI score overridden: Single red flag detected', { originalScore: aiResponse.investmentScore, finalScore });
            }
          }
          
          return finalScore;
        })(),
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
        competitiveAdvantage: typeof aiResponse.competitiveAdvantage === 'object' 
          ? JSON.stringify(aiResponse.competitiveAdvantage) 
          : aiResponse.competitiveAdvantage,
        wealthBuildingPotential: aiResponse.wealthBuildingPotential,
        marketCycleAnalysis: aiResponse.marketCycleAnalysis,
        financingRecommendations: aiResponse.financingRecommendations,
        portfolioFitAnalysis: aiResponse.portfolioFitAnalysis,
        opportunityCostAnalysis: aiResponse.opportunityCostAnalysis,
        
        // AI predictions for enhanced analysis
        // Handle case where AI returns string instead of structured object
        boldPredictions: typeof aiResponse.boldPredictions === 'string' ? 
          {
            wealthCreation: {
              year10Value: aiResponse.boldPredictions
            }
          } : aiResponse.boldPredictions,
        
        // Intelligence Multiplier fields
        // Normalize risk levels to match schema enum
        metricIntelligence: aiResponse.metricIntelligence?.map((metric: any) => ({
          ...metric,
          riskLevel: normalizeRiskLevel(metric.riskLevel)
        })) || aiResponse.metricIntelligence,
        riskBlindSpots: aiResponse.riskBlindSpots,
        opportunityAlternatives: aiResponse.opportunityAlternatives,
        advancedStrategies: aiResponse.advancedStrategies,
        competitiveIntelligence: aiResponse.competitiveIntelligence,
        intelligenceScore: aiResponse.intelligenceScore,
        sophisticationLevel: aiResponse.sophisticationLevel,
        transformationInsights: aiResponse.transformationInsights,
        professionalEquivalent: aiResponse.professionalEquivalent,
        
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
        investmentScore: 0
      };
    }
  } catch (error) {
    logger.error('Unexpected error in getAIInsights:', error);
    return {
      summary: "An unexpected error occurred during AI analysis.",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: 0
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
    // Cash Flow Score (0-100) - CRITICAL: Negative cash flow should severely penalize score
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    let cashFlowScore: number;
    let cashFlowReason: string;
    
    if (cashFlow >= 500) {
      cashFlowScore = 90 + Math.min(10, cashFlow / 1000 * 10); // Excellent: 90-100
      cashFlowReason = `Excellent cash flow of $${cashFlow.toFixed(0)}/month indicates strong rental performance`;
    } else if (cashFlow >= 200) {
      cashFlowScore = 70 + (cashFlow - 200) / 300 * 20; // Good: 70-90
      cashFlowReason = `Good cash flow of $${cashFlow.toFixed(0)}/month shows solid rental performance`;
    } else if (cashFlow >= 0) {
      cashFlowScore = 50 + cashFlow / 200 * 20; // Break-even to fair: 50-70
      cashFlowReason = `Break-even cash flow of $${cashFlow.toFixed(0)}/month - minimal rental returns`;
    } else {
      // CRITICAL: Negative cash flow should be heavily penalized
      cashFlowScore = Math.max(5, 25 + (cashFlow / 500 * 20)); // Poor: 5-25
      cashFlowReason = `NEGATIVE cash flow of $${Math.abs(cashFlow).toFixed(0)}/month creates wealth drain - requires immediate attention`;
    }
    
    scoreBreakdown.cashFlow = {
      score: Math.round(Math.max(0, Math.min(100, cashFlowScore))),
      max: 100,
      reason: cashFlowReason
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
    
    // Cash-on-Cash Return component (25 points) - CRITICAL: Negative returns should kill the score
    if (keyMetrics.cashOnCashReturn !== undefined) {
      if (keyMetrics.cashOnCashReturn >= 12) {
        financialScore += 25;
        financialFactors.push('excellent CoC return');
      } else if (keyMetrics.cashOnCashReturn >= 8) {
        financialScore += 15;
        financialFactors.push('good CoC return');
      } else if (keyMetrics.cashOnCashReturn >= 4) {
        financialScore += 5;
        financialFactors.push('moderate CoC return');
      } else if (keyMetrics.cashOnCashReturn >= 0) {
        financialScore -= 5;
        financialFactors.push('low CoC return');
      } else {
        // CRITICAL: Negative cash-on-cash return should severely penalize
        financialScore -= 30;
        financialFactors.push('NEGATIVE CoC return - wealth destroyer');
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
    
    // DSCR Risk Factor - CRITICAL: DSCR below 1.0 means can't cover debt payments
    if (keyMetrics.dscr !== undefined) {
      if (keyMetrics.dscr >= 1.5) {
        riskScore += 15;
        riskFactors.push('strong debt coverage');
      } else if (keyMetrics.dscr >= 1.25) {
        riskScore += 5;
        riskFactors.push('adequate debt coverage');
      } else if (keyMetrics.dscr >= 1.0) {
        riskScore -= 5;
        riskFactors.push('marginal debt coverage');
      } else {
        // CRITICAL: DSCR below 1.0 is extremely dangerous
        riskScore -= 35;
        riskFactors.push(`DANGEROUS: DSCR of ${keyMetrics.dscr.toFixed(2)} means insufficient income to cover debt payments`);
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

    // CRITICAL OVERRIDE: Apply deal-killer logic
    const dealKillers = [];
    let overallScoreReduction = 0;
    
    // Deal Killer 1: Negative Cash Flow
    if (cashFlow < 0) {
      dealKillers.push(`Negative cash flow: $${Math.abs(cashFlow).toFixed(0)}/month`);
      overallScoreReduction += 25; // Major penalty
    }
    
    // Deal Killer 2: Negative Cash-on-Cash Return  
    if (keyMetrics.cashOnCashReturn && keyMetrics.cashOnCashReturn < 0) {
      dealKillers.push(`Negative cash-on-cash return: ${keyMetrics.cashOnCashReturn.toFixed(2)}%`);
      overallScoreReduction += 20; // Major penalty
    }
    
    // Deal Killer 3: DSCR below 1.0 (can't cover debt payments)
    if (keyMetrics.dscr && keyMetrics.dscr < 1.0) {
      dealKillers.push(`Insufficient debt coverage: DSCR ${keyMetrics.dscr.toFixed(2)}`);
      overallScoreReduction += 30; // Severe penalty
    }
    
    // Deal Killer 4: Multiple red flags compound the problem
    if (dealKillers.length >= 2) {
      overallScoreReduction += 15; // Additional penalty for multiple issues
    }
    
    // Apply the reduction to all component scores
    if (overallScoreReduction > 0) {
      scoreBreakdown.cashFlow.score = Math.max(5, scoreBreakdown.cashFlow.score - overallScoreReduction);
      scoreBreakdown.financialMetrics.score = Math.max(5, scoreBreakdown.financialMetrics.score - overallScoreReduction);
      scoreBreakdown.riskAssessment.score = Math.max(5, scoreBreakdown.riskAssessment.score - overallScoreReduction);
      
      // Add deal killer warning to breakdown
      scoreBreakdown.dealKillers = {
        score: Math.max(5, 100 - overallScoreReduction),
        max: 100,
        reason: `CRITICAL ISSUES: ${dealKillers.join('; ')}. This property has fundamental problems that make it a poor investment.`
      };
    }

    logger.info('Score breakdown generated with deal-killer analysis', { 
      cashFlow: scoreBreakdown.cashFlow?.score,
      marketPosition: scoreBreakdown.marketPosition?.score,
      financialMetrics: scoreBreakdown.financialMetrics?.score,
      riskAssessment: scoreBreakdown.riskAssessment?.score,
      dealKillersCount: dealKillers.length,
      overallScoreReduction,
      dealKillers
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

/**
 * Parse Intelligence Multiplier data from AI response
 */
const parseIntelligenceMultiplier = (text: string) => {
  const intelligence = {
    metricIntelligence: [],
    riskBlindSpots: [],
    opportunityAlternatives: [],
    advancedStrategies: [],
    competitiveIntelligence: null,
    intelligenceScore: 85,
    sophisticationLevel: 'professional'
  };

  try {
    // Parse Metric Intelligence - look for JSON in the metrics array
    const metricSection = text.match(/```json\s*\{\s*"metrics":\s*\[(.*?)\]\s*\}/s);
    if (metricSection) {
      try {
        const metricsJson = `{"metrics":[${metricSection[1]}]}`;
        const parsed = JSON.parse(metricsJson);
        intelligence.metricIntelligence = parsed.metrics || [];
        logger.info(`Successfully parsed ${intelligence.metricIntelligence.length} metric intelligence items`);
      } catch (e) {
        logger.warn('Failed to parse metrics JSON block:', e);
      }
    }

    // Parse Risk Blind Spots - look for JSON in the risks array
    const riskSection = text.match(/```json\s*\{\s*"risks":\s*\[(.*?)\]\s*\}/s);
    if (riskSection) {
      try {
        const risksJson = `{"risks":[${riskSection[1]}]}`;
        const parsed = JSON.parse(risksJson);
        intelligence.riskBlindSpots = parsed.risks || [];
        logger.info(`Successfully parsed ${intelligence.riskBlindSpots.length} risk blind spots`);
      } catch (e) {
        logger.warn('Failed to parse risks JSON block:', e);
      }
    }

    // Alternative: Parse individual JSON objects for metrics if array parsing fails
    if (intelligence.metricIntelligence.length === 0) {
      const metricJsonMatches = text.match(/\{\s*"metricName":[^}]+\}/g) || [];
      intelligence.metricIntelligence = metricJsonMatches.map((jsonStr: string) => {
        try {
          return JSON.parse(jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' '));
        } catch (e) {
          logger.warn('Failed to parse individual metric:', e);
          return null;
        }
      }).filter(Boolean);
      logger.info(`Fallback parsed ${intelligence.metricIntelligence.length} individual metrics`);
    }

    // Alternative: Parse individual JSON objects for risks if array parsing fails
    if (intelligence.riskBlindSpots.length === 0) {
      const riskJsonMatches = text.match(/\{\s*"riskType":[^}]+\}/g) || [];
      intelligence.riskBlindSpots = riskJsonMatches.map((jsonStr: string) => {
        try {
          return JSON.parse(jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' '));
        } catch (e) {
          logger.warn('Failed to parse individual risk:', e);
          return null;
        }
      }).filter(Boolean);
      logger.info(`Fallback parsed ${intelligence.riskBlindSpots.length} individual risks`);
    }

    // If we couldn't parse structured data, create fallback data
    if (intelligence.metricIntelligence.length === 0) {
      intelligence.metricIntelligence = createFallbackMetricIntelligence(text);
    }
    if (intelligence.riskBlindSpots.length === 0) {
      intelligence.riskBlindSpots = createFallbackRiskBlindSpots(text);
    }

  } catch (error) {
    logger.error('Error parsing intelligence multiplier data:', error);
  }

  return intelligence;
};

// Fallback functions for when JSON parsing fails
const createFallbackMetricIntelligence = (text: string) => {
  const fallbackMetrics = [
    {
      metricName: "Monthly Cash Flow",
      noviceView: "Shows monthly profit/loss",
      proInsight: "Critical for cash-on-cash return calculation and debt service coverage",
      actionItem: "Verify occupancy assumptions and build reserves",
      benchmark: "Professional investors target $500+ monthly for SFR",
      warning: "Negative cash flow creates wealth drain",
      riskLevel: "medium"
    },
    {
      metricName: "Cap Rate",
      noviceView: "Annual return percentage",
      proInsight: "Indicates market positioning and pricing premium/discount",
      actionItem: "Compare to local market cap rates",
      benchmark: "Market average varies by location (3-8%)",
      warning: "Below-market cap rates may signal overpricing",
      riskLevel: "medium"
    }
  ];
  return fallbackMetrics;
};

const createFallbackRiskBlindSpots = (text: string) => {
  const fallbackRisks = [
    {
      riskType: "Vacancy Risk",
      description: "Property may sit vacant between tenants",
      probability: "Medium (6-8% annually)",
      impact: "High (lost rental income)",
      mitigation: "Build vacancy reserves, screen tenants carefully",
      priority: "high"
    },
    {
      riskType: "Expense Surprise Risk",
      description: "Unexpected maintenance and repair costs",
      probability: "High (especially first year)",
      impact: "Medium ($2,000-8,000 annually)",
      mitigation: "Professional inspection, maintenance reserves",
      priority: "high"
    }
  ];
  return fallbackRisks;
};

/**
 * Parse text AI response into structured format for frontend compatibility
 * ENHANCED: Now includes Intelligence Multiplier parsing for professional-level insights
 */
function parseTextResponseToStructured(textResponse: string): any {
  if (!textResponse || textResponse.trim().length === 0) {
    logger.warn('Empty or null text response from AI');
    return {
      summary: "AI analysis is temporarily unavailable. Please try again.",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      investmentScore: null,
      strategicAnalysis: "Strategic analysis will be available shortly."
    };
  }

  logger.info('Parsing AI text response with length:', textResponse.length);

  try {
    // Try to parse as JSON first (in case AI still returns JSON format)
    logger.info('Checking if response starts with JSON:', {
      startsWithBrace: textResponse.trim().startsWith('{'),
      firstChars: textResponse.trim().substring(0, 50)
    });
    
    if (textResponse.trim().startsWith('{') || textResponse.trim().startsWith('```json')) {
      // Extract JSON from markdown code block if needed
      let jsonText = textResponse.trim();
      if (jsonText.startsWith('```json')) {
        // More robust extraction - find the opening brace and match it with closing brace
        const startIndex = jsonText.indexOf('{');
        if (startIndex !== -1) {
          let braceCount = 0;
          let endIndex = startIndex;
          
          for (let i = startIndex; i < jsonText.length; i++) {
            if (jsonText[i] === '{') braceCount++;
            if (jsonText[i] === '}') braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
          
          if (braceCount === 0) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
            logger.info('Extracted JSON from markdown:', {
              originalLength: textResponse.length,
              extractedLength: jsonText.length,
              extractedStart: jsonText.substring(0, 100)
            });
          }
        }
      }
      
      const parsed = JSON.parse(jsonText);
      logger.info('Successfully parsed AI response as JSON', {
        parsedInvestmentScore: parsed.investmentScore,
        parsedKeys: Object.keys(parsed)
      });
      
      // For JSON responses, parse the Intelligence Multiplier data separately
      const intelligenceData = parseIntelligenceMultiplier(textResponse);
      
      const finalResponse = {
        ...parsed,
        ...intelligenceData,
        // Ensure we keep the actual AI insights from the JSON response, not generic text
        summary: parsed.summary || parsed.investmentSummary || "Investment analysis complete",
        strengths: parsed.strengths || parsed.keyStrengths || [],
        weaknesses: parsed.weaknesses || parsed.keyWeaknesses || [],
        recommendations: parsed.recommendations || parsed.keyRecommendations || [],
        // Keep the exact investmentScore from JSON - no pattern matching needed
        investmentScore: parsed.investmentScore || parsed.aiInvestmentScore || null,
        // Keep all the other parsed fields
        transformationInsights: `Analysis elevated from basic metrics to professional-grade insights with ${intelligenceData.metricIntelligence.length} metric transformations, ${intelligenceData.riskBlindSpots.length} risk assessments, and ${intelligenceData.advancedStrategies.length} strategic recommendations.`,
        professionalEquivalent: "This analysis would typically cost $1,500-3,000 from a professional real estate analyst."
      };
      
      logger.info('JSON Response Scores:', {
        aiInvestmentScore: parsed.investmentScore,
        intelligenceScore: intelligenceData.intelligenceScore,
        sophisticationLevel: intelligenceData.sophisticationLevel
      });
      
      // Log the investment score being returned
      logger.info('AI Service returning investment score:', {
        investmentScore: finalResponse.investmentScore,
        fromParsed: parsed.investmentScore,
        fromAIScore: parsed.aiInvestmentScore,
        finalScore: finalResponse.investmentScore,
        type: typeof finalResponse.investmentScore
      });
      
      // Return the properly parsed JSON response - don't continue to text parsing
      return finalResponse;
    }
  } catch (jsonError) {
    logger.info('AI response is not JSON, parsing as text format');
  }

  // Extract investment score from text - try multiple patterns
  const scorePatterns = [
    /investment[\s\-_]*score[:\s]*(\d+)/i,
    /\*\*investment[\s\-_]*score[:\s\*]*(\d+)/i,
    /score[:\s]*(\d+)/i,
    /(\d+)\/100/,
    /rate.*?(\d+)/i
  ];
  
  let investmentScore = null;
  for (const pattern of scorePatterns) {
    const match = textResponse.match(pattern);
    if (match) {
      investmentScore = parseInt(match[1], 10);
      logger.info(`Extracted investment score: ${investmentScore} using pattern: ${pattern}`, {
        fullMatch: match[0],
        extractedValue: match[1],
        matchIndex: textResponse.indexOf(match[0])
      });
      break;
    }
  }

  // Parse the Intelligence Multiplier data
  const intelligenceData = parseIntelligenceMultiplier(textResponse);

  // NEW APPROACH: Clean and deduplicate the full response instead of parsing into sections
  const cleanFullResponse = (content: string): string => {
    if (!content) return content;
    
    // Split into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const uniqueParagraphs: string[] = [];
    const seenContent = new Set<string>();
    
    for (const paragraph of paragraphs) {
      const cleanParagraph = paragraph.trim();
      
      // Create a normalized version for comparison (remove formatting, emojis, etc.)
      const normalizedParagraph = cleanParagraph
        .replace(/[🎯📈🔨⚡🛡️🏦💡🧠🚨]/g, '')
        .replace(/\*\*/g, '')
        .replace(/---/g, '')
        .replace(/####/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      // Skip if we've seen this content before (allowing for slight variations)
      if (normalizedParagraph.length > 20 && !seenContent.has(normalizedParagraph)) {
        uniqueParagraphs.push(cleanParagraph);
        seenContent.add(normalizedParagraph);
      }
    }
    
    return uniqueParagraphs.join('\n\n');
  };

  // Clean the full response
  const cleanedResponse = cleanFullResponse(textResponse);
  
  // Format the response for better readability
  const formattedResponse = cleanedResponse
    // Keep markdown formatting for better structure
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Clean up section separators
    .replace(/---+/g, '')
    // Ensure proper spacing around emoji headers and preserve emojis
    .replace(/([🎯📈🔨⚡🛡️🏦💡🧠🚨])\s*/g, '\n\n$1 ')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract a brief summary from the first meaningful paragraph
  const summaryMatch = formattedResponse.match(/^([^🎯📈🔨⚡🛡️🏦💡🧠🚨\n]{100,500})/);
  const briefSummary = summaryMatch ? summaryMatch[1].trim() : "Strategic AI analysis with market intelligence and data-driven insights.";

  // Log the investment score being used
  logger.info('AI Service (text parsing) setting investment score:', {
    investmentScore: investmentScore,
    type: typeof investmentScore,
    isNull: investmentScore === null,
    isNumber: typeof investmentScore === 'number'
  });
  
  const structuredResponse = {
    summary: briefSummary,
    strengths: ["Strategic analysis provided - see detailed insights below"],
    weaknesses: ["Market considerations noted in analysis"],
    recommendations: ["See strategic insights for actionable recommendations"],
    investmentScore: (() => {
      // CRITICAL: Apply conservative scoring for text-parsed results
      let finalScore = investmentScore;
      
      if (finalScore !== null && finalScore > 40) {
        // For text parsing without direct access to analysis data,
        // be conservative with high scores
        finalScore = Math.min(finalScore, 40);
        logger.info('Text-parsed AI score conservatively capped at 40', { 
          originalScore: investmentScore, 
          finalScore,
          reason: 'Text parsing cannot validate critical financial metrics' 
        });
      }
      
      return finalScore;
    })(),
    strategicAnalysis: formattedResponse, // NEW: Single comprehensive analysis
    strategicInsights: formattedResponse, // Full analysis as strategic insights
    notes: 'Complete strategic analysis provided',
    
    // Add the new intelligence multiplier data FIRST so it can override any generic content
    ...intelligenceData,
    
    // Professional transformation summary
    transformationInsights: `Analysis elevated from basic metrics to professional-grade insights with ${intelligenceData.metricIntelligence.length} metric transformations, ${intelligenceData.riskBlindSpots.length} risk assessments, and ${intelligenceData.advancedStrategies.length} strategic recommendations.`,
    professionalEquivalent: "This analysis would typically cost $1,500-3,000 from a professional real estate analyst."
  };

  logger.info('Parsed structured response with Intelligence Multiplier:', {
    hasScore: !!structuredResponse.investmentScore,
    score: structuredResponse.investmentScore,
    originalLength: textResponse.length,
    cleanedLength: formattedResponse.length,
    metricIntelligenceCount: intelligenceData.metricIntelligence.length,
    riskBlindSpotsCount: intelligenceData.riskBlindSpots.length,
    advancedStrategiesCount: intelligenceData.advancedStrategies.length,
    hasCompetitiveIntelligence: !!intelligenceData.competitiveIntelligence,
    reductionRatio: ((textResponse.length - formattedResponse.length) / textResponse.length * 100).toFixed(1) + '%'
  });

  // LOG PARSED CONTENT FOR DEBUGGING
  logger.info('=== PARSED AI CONTENT (strategicAnalysis) ===');
  logger.info(structuredResponse.strategicAnalysis);
  logger.info('=== END PARSED CONTENT ===');

  // LOG INTELLIGENCE MULTIPLIER DATA
  logger.info('=== INTELLIGENCE MULTIPLIER DATA ===');
  logger.info('Metric Intelligence:', JSON.stringify(intelligenceData.metricIntelligence, null, 2));
  logger.info('Risk Blind Spots:', JSON.stringify(intelligenceData.riskBlindSpots, null, 2));
  logger.info('Advanced Strategies:', JSON.stringify(intelligenceData.advancedStrategies, null, 2));
  logger.info('=== END INTELLIGENCE DATA ===');

  return structuredResponse;
}
