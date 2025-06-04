import { getOpenAIClient } from './openai';
import { logger } from '../utils/logger';
import { SFRData, MultiFamilyData } from '../types/propertyTypes';
import { AIInsights } from '../types/analysis';

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

    // Generate prompt based on property type
    const prompt = generatePrompt(dealData, analysis);

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

function generatePrompt(dealData: SFRData | MultiFamilyData, analysis: any): string {
  // Calculate common metrics
  const downPaymentPercent = ((dealData.downPayment / dealData.purchasePrice) * 100).toFixed(2);

  // Base prompt with common fields
  const basePrompt = `
    PROPERTY DETAILS:
    - Address: ${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}, ${dealData.propertyAddress.state} ${dealData.propertyAddress.zipCode}
    - Purchase Price: $${dealData.purchasePrice || 'N/A'}
    - Down Payment: $${dealData.downPayment || 'N/A'} (${downPaymentPercent}%)
    - Interest Rate: ${dealData.interestRate || 'N/A'}%
    - Loan Term: ${dealData.loanTerm || 'N/A'} years

    METRICS:
    - Cap Rate: ${analysis.annualAnalysis?.capRate?.toFixed(2) || 'N/A'}%
    - Cash on Cash Return: ${analysis.annualAnalysis?.cashOnCashReturn?.toFixed(2) || 'N/A'}%
    - NOI: $${analysis.annualAnalysis?.noi?.toFixed(2) || 'N/A'}/year
  `;

  // Add property-specific details
  if ('bedrooms' in dealData) {
    // SFR-specific details
    const sfrData = dealData as SFRData;
    const grossRentMultiplier = (sfrData.purchasePrice / (sfrData.monthlyRent * 12)).toFixed(2);
    const onePercentRule = ((sfrData.monthlyRent / sfrData.purchasePrice) * 100).toFixed(2);

    return `
    Analyze this single-family real estate investment deal with the following details:

    ${basePrompt}
    
    ADDITIONAL PROPERTY DETAILS:
    - Type: Single-Family Residence
    - Square Feet: ${sfrData.squareFootage || 'N/A'}
    - Year Built: ${sfrData.yearBuilt || 'N/A'}
    - Bedrooms: ${sfrData.bedrooms || 'N/A'}
    - Bathrooms: ${sfrData.bathrooms || 'N/A'}
    - Monthly Rent: $${sfrData.monthlyRent || 'N/A'}

    ADDITIONAL METRICS:
    - Gross Rent Multiplier: ${grossRentMultiplier}
    - 1% Rule: ${onePercentRule}%

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "summary": "2-3 sentences overall summary of the investment",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "investmentScore": 0-100 score with 100 being excellent
    }

    Focus on the financial viability, potential risks, and opportunities for improvement.
    Consider the property's location, condition, and potential for appreciation.
    Be specific, data-driven, and actionable in your recommendations.
    `;
  } else {
    // Multi-family specific details
    const mfData = dealData as MultiFamilyData;
    const totalUnits = mfData.unitTypes.reduce((sum, unit) => sum + unit.count, 0);
    const avgRentPerUnit = mfData.unitTypes.reduce((sum, unit) => sum + (unit.monthlyRent * unit.count), 0) / totalUnits;
    const pricePerUnit = mfData.purchasePrice / totalUnits;

    return `
    Analyze this multi-family real estate investment deal with the following details:

    ${basePrompt}

    PROPERTY DETAILS:
    - Type: Multi-Family Property
    - Total Units: ${totalUnits}
    - Average Rent Per Unit: $${avgRentPerUnit.toFixed(2)}
    - Price Per Unit: $${pricePerUnit.toFixed(2)}

    UNIT MIX:
    ${mfData.unitTypes.map(unit => `- ${unit.count}x ${unit.type} @ $${unit.monthlyRent}/month`).join('\n')}

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "summary": "2-3 sentences overall summary of the investment",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "investmentScore": 0-100 score with 100 being excellent
    }

    Focus on:
    1. Unit mix optimization and rental strategy
    2. Operational efficiency and expense management
    3. Value-add opportunities and renovation potential
    4. Market positioning and competitive analysis
    5. Risk factors specific to multi-family properties
    
    Be specific, data-driven, and actionable in your recommendations.
    Consider local market conditions, tenant demographics, and management requirements.
    `;
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