import { getOpenAIClient } from './openai';
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

    const completion = await openai.completions.create({
      model: "text-davinci-003",
      prompt,
      max_tokens: 800,
      temperature: 0.7
    });

    const response = completion.choices[0].text?.trim() || '';
    
    try {
      const aiResponse = JSON.parse(response);
      return {
        summary: aiResponse.summary || "No summary provided",
        strengths: aiResponse.strengths || [],
        weaknesses: aiResponse.weaknesses || [],
        recommendations: aiResponse.recommendations || [],
        investmentScore: aiResponse.investmentScore || null
      };
    } catch (parseError) {
      logger.error('Error parsing AI response:', parseError);
      return {
        summary: "Error parsing AI response. Please try again later.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
  } catch (error) {
    logger.error('Error getting AI insights:', error);
    return {
      summary: "Error generating AI analysis. Please try again later.",
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

    const completion = await openai.completions.create({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0].text?.trim() || 'No response generated';
  } catch (error) {
    logger.error('Error generating AI response:', error);
    return 'Error generating AI response';
  }
}; 