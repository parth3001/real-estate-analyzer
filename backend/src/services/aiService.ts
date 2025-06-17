import { getOpenAIClient, generateAnalysis } from './openai';
import { logger } from '../utils/logger';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { AIInsights } from '../types/analysis';
import { sfrAnalysisPrompt, mfAnalysisPrompt } from '../prompts/aiPrompts';

export async function getAIInsights(dealData: SFRData | MultiFamilyData, analysis: any): Promise<AIInsights> {
  try {
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

    // Generate prompt based on property type using specialized prompts from aiPrompts.ts
    let prompt: string;
    if (dealData.propertyType === 'SFR') {
      prompt = sfrAnalysisPrompt(dealData, analysis);
    } else {
      prompt = mfAnalysisPrompt(dealData, analysis);
    }

    logger.info(`Generated ${dealData.propertyType} analysis prompt (${prompt.length} chars)`);

    try {
      // Use the updated generateAnalysis function from openai.ts
      const aiResponse = await generateAnalysis(prompt);
      
      return {
        summary: aiResponse.summary || "No summary provided",
        strengths: aiResponse.strengths || [],
        weaknesses: aiResponse.weaknesses || [],
        recommendations: aiResponse.recommendations || [],
        riskAssessment: aiResponse.riskAssessment,
        investmentScore: aiResponse.investmentScore || null,
        // For MF properties, include additional fields if they exist
        unitMixAnalysis: aiResponse.unitMixAnalysis,
        marketPositionAnalysis: aiResponse.marketPositionAnalysis,
        valueAddOpportunities: aiResponse.valueAddOpportunities,
        recommendedHoldPeriod: aiResponse.recommendedHoldPeriod
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

    // Use the v3 API format for chat completions
    const completion = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for real estate analysis.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.data.choices[0].message?.content?.trim() || 'No response generated';
  } catch (error) {
    logger.error('Error generating AI response:', error);
    return 'Error generating AI response';
  }
}; 