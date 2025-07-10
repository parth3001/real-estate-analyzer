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
      
      // Since we're now getting text instead of JSON, we'll create a structured response
      // based on the text content while preserving the strategic insights
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
        investmentScore: typeof aiResponse.investmentScore === 'number' ? aiResponse.investmentScore : null,
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
        
        // AI predictions for enhanced analysis
        boldPredictions: aiResponse.boldPredictions,
        
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

/**
 * Parse text AI response into structured format for frontend compatibility
 * NEW APPROACH: Preserve AI's natural structure instead of forcing into predefined sections
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
    if (textResponse.trim().startsWith('{')) {
      const parsed = JSON.parse(textResponse);
      logger.info('Successfully parsed AI response as JSON');
      return parsed;
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
      logger.info(`Extracted investment score: ${investmentScore} using pattern: ${pattern}`);
      break;
    }
  }

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
        .replace(/[🎯📈🔨⚡🛡️🏦💡]/g, '')
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
    .replace(/([🎯📈🔨⚡🛡️🏦💡])\s*/g, '\n\n$1 ')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract a brief summary from the first meaningful paragraph
  const summaryMatch = formattedResponse.match(/^([^🎯📈🔨⚡🛡️🏦💡\n]{100,500})/);
  const briefSummary = summaryMatch ? summaryMatch[1].trim() : "Strategic AI analysis with market intelligence and data-driven insights.";

  const structuredResponse = {
    summary: briefSummary,
    strengths: ["Strategic analysis provided - see detailed insights below"],
    weaknesses: ["Market considerations noted in analysis"],
    recommendations: ["See strategic insights for actionable recommendations"],
    investmentScore: investmentScore,
    strategicAnalysis: formattedResponse, // NEW: Single comprehensive analysis
    riskAssessment: "Risk analysis included in strategic assessment",
    marketTrendPrediction: "Market timing and trend analysis provided",
    optimalExitStrategy: "Exit strategy recommendations included",
    portfolioFitAnalysis: "Portfolio integration strategy analyzed",
    strategicInsights: formattedResponse, // Full analysis as strategic insights
    notes: 'Complete strategic analysis provided'
  };

  logger.info('Parsed structured response with new approach:', {
    hasScore: !!structuredResponse.investmentScore,
    score: structuredResponse.investmentScore,
    originalLength: textResponse.length,
    cleanedLength: formattedResponse.length,
    reductionRatio: ((textResponse.length - formattedResponse.length) / textResponse.length * 100).toFixed(1) + '%'
  });

  // LOG PARSED CONTENT FOR DEBUGGING
  logger.info('=== PARSED AI CONTENT (strategicAnalysis) ===');
  logger.info(structuredResponse.strategicAnalysis);
  logger.info('=== END PARSED CONTENT ===');

  // LOG COMPARISON OF ORIGINAL vs CLEANED
  logger.info('=== CONTENT COMPARISON ===');
  logger.info(`Original length: ${textResponse.length} chars`);
  logger.info(`Cleaned length: ${formattedResponse.length} chars`);
  logger.info(`Reduction: ${((textResponse.length - formattedResponse.length) / textResponse.length * 100).toFixed(1)}%`);
  logger.info('=== END COMPARISON ===');

  return structuredResponse;
}
