/**
 * AI-Enhanced Messaging Service
 * 
 * Implements 80/20 approach: 80% algorithmic analysis + 20% AI enhancement
 * Generates dynamic, contextual content for InvestmentDecisionHero tabs
 */

import { getOpenAIClient } from './openai';
import { logger } from '../utils/logger';
import { InvestmentDecision, ProfessionalAssessment } from './investment/investmentDecisionEngine';

export interface AIEnhancedContent {
  reasoning: {
    explanation: string;
    keyStrengths: string[];
    keyConcerns: string[];
    verdict: string;
  };
  actionPlan: {
    immediateActions: string[];
    negotiationFocus: string[];
    preparationItems: string[];
    timeframe: string;
  };
  capitalStrategy: {
    currentAssessment: string;
    optimizedApproach: string;
    alternativeOptions: string[];
    recommendation: string;
  };
  timeline: {
    optimalHoldPeriod: string;
    rationale: string;
    exitIndicators: string[];
    marketTiming: string;
  };
  alternatives: {
    betterPropertyType: string;
    marketAlternative: string;
    timingStrategy: string;
    riskAdjustment: string;
  };
}

class AIEnhancedMessagingService {
  /**
   * Clean JSON content from markdown code blocks
   */
  private cleanJsonContent(content: string): string {
    return content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  }

  /**
   * Generate enhanced reasoning explanation
   */
  async generateReasoning(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent['reasoning']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const capRate = analysis?.keyMetrics?.capRate ?? 0;
    const interestRate = propertyData?.interestRate ?? analysis?.interestRate ?? 7; // Use original data first
    const purchasePrice = propertyData?.purchasePrice ?? analysis?.purchasePrice ?? 0; // Use original data first
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;

    const prompt = `
You are a $20M real estate portfolio manager explaining an investment decision to a client.

VALIDATED PROPERTY ANALYSIS:
- Recommendation: ${decision.verdict} 
- Deal Quality Score: ${dealQuality}/100
- Monthly Cash Flow: $${Math.round(cashFlow)}
- 10-Year IRR: ${irr.toFixed(1)}%
- Cap Rate: ${capRate.toFixed(2)}%
- Interest Rate: ${interestRate}%
- Purchase Price: $${purchasePrice.toLocaleString()}

WEIGHTED FACTOR SCORES (V3.0 Professional):
- Cash Flow (35%): ${decision.professionalAssessment?.cashFlowScore ?? 'Not calculated'}/100
- IRR (25%): ${decision.professionalAssessment?.irrScore ?? 'Not calculated'}/100  
- Debt Structure (10%): ${decision.professionalAssessment?.debtStructureScore ?? 'Not calculated'}/100
- Market Strength (15%): ${decision.professionalAssessment?.marketStrengthScore ?? 'Not calculated'}/100

CONSTRAINT: Only reference the ACTUAL numbers provided above. Do NOT create fictional data or make assumptions about missing values.

Task: Explain why our algorithm recommended "${decision.verdict}" using ONLY the verified data above. Focus on the most impactful factors from the weighted scores.

Format as JSON:
{
  "explanation": "Brief professional explanation using only the actual numbers provided",
  "keyStrengths": ["Strength with actual numbers from above", "Second strength with verified data"],
  "keyConcerns": ["Concern with actual numbers from above", "Second concern with verified data"],
  "verdict": "One sentence conclusion based on the verified analysis"
}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback reasoning');
        return this.getFallbackReasoning(decision, analysis);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      return JSON.parse(this.cleanJsonContent(content));
    } catch (error) {
      logger.error('AI Reasoning generation failed:', error);
      // Fallback to algorithmic reasoning
      return this.getFallbackReasoning(decision, analysis);
    }
  }

  /**
   * Generate tactical action plan with sensitivity analysis integration
   */
  async generateActionPlan(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent['actionPlan']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis  
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const purchasePrice = propertyData?.purchasePrice ?? analysis?.purchasePrice ?? 0; // Use original data first
    const monthlyRent = propertyData?.monthlyRent ?? analysis?.monthlyRent ?? 0; // CRITICAL: Get rent from original data
    const dscr = analysis?.keyMetrics?.dscr ?? 0;
    const totalInvestment = analysis?.keyMetrics?.totalInvestment ?? propertyData?.totalInvestment ?? 0;
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;

    // Extract sensitivity analysis if available
    const sensitivity = decision.sensitivityAnalysis;
    const pathToBuy = sensitivity?.pathToBuy;
    const negotiationGuidance = sensitivity?.negotiationGuidance;

    const prompt = `
You are a real estate acquisition manager creating a tactical action plan with verified data and sensitivity insights.

VALIDATED PROPERTY DATA:
- Recommendation: ${decision.verdict} (Score: ${dealQuality}/100)
- Monthly Cash Flow: $${Math.round(cashFlow)}
- Purchase Price: $${purchasePrice.toLocaleString()}
- Monthly Rent: $${monthlyRent.toLocaleString()}
- Total Investment Required: $${totalInvestment.toLocaleString()}
- DSCR: ${dscr.toFixed(2)}

SENSITIVITY ANALYSIS INSIGHTS:
${pathToBuy ? `
- Easiest Path to BUY: ${pathToBuy.easiest?.description || 'Not available'}
- Most Realistic Path: ${pathToBuy.mostRealistic?.description || 'Not available'}
- Negotiation Focus: ${negotiationGuidance?.focus || 'terms'} (${negotiationGuidance?.rationale || 'Multiple options available'})
` : 'Sensitivity analysis not available - provide general ${decision.verdict}-focused guidance'}

CONSTRAINT: Only reference the ACTUAL numbers provided above. Do NOT create fictional amounts, timelines, or costs.

Task: Create a practical 3-phase action plan using ONLY the verified data above. Base recommendations on the actual cash flow and deal quality metrics.

Format as JSON:
{
  "immediateActions": ["Action with actual context from data above", "Priority based on verified metrics"],
  "negotiationFocus": ["Specific target using actual purchase price/cash flow", "Alternative approach with real numbers"],  
  "preparationItems": ["Preparation based on actual total investment", "Reserves based on verified cash flow"],
  "timeframe": "Realistic timeline for this ${decision.verdict} recommendation"
}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback action plan');
        return this.getFallbackActionPlan(decision, analysis);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      return JSON.parse(this.cleanJsonContent(content));
    } catch (error) {
      logger.error('AI Action Plan generation failed:', error);
      return this.getFallbackActionPlan(decision, analysis);
    }
  }

  /**
   * Generate capital strategy recommendations
   */
  async generateCapitalStrategy(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent['capitalStrategy']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const dscr = analysis?.keyMetrics?.dscr ?? 0;
    const interestRate = propertyData?.interestRate ?? analysis?.interestRate ?? 7; // Use original data first
    const purchasePrice = propertyData?.purchasePrice ?? analysis?.purchasePrice ?? 0; // Use original data first  
    const downPayment = propertyData?.downPayment ?? analysis?.downPayment ?? 0; // Use original data first
    const monthlyRent = propertyData?.monthlyRent ?? 0; // CRITICAL: Get rent from original data
    const totalInvestment = analysis?.keyMetrics?.totalInvestment ?? propertyData?.totalInvestment ?? downPayment;
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;
    const verdict = decision?.verdict ?? 'UNKNOWN';
    
    // CALCULATE loan amount instead of accessing non-existent path
    const loanAmount = purchasePrice - downPayment;
    const monthlyPayment = analysis?.monthlyAnalysis?.expenses?.debt ?? 0;

    const prompt = `
You are a $20M portfolio manager's capital allocation specialist providing financing strategy for a ${verdict} deal.

VERIFIED DEAL STRUCTURE:
- Professional Score: ${dealQuality}/100 (${verdict})
- Monthly Cash Flow: $${Math.round(cashFlow)} ${cashFlow < 0 ? '(NEGATIVE - requires contribution)' : '(POSITIVE)'}
- DSCR: ${dscr.toFixed(2)} ${dscr < 1.25 ? '(LOW - payment stress risk)' : dscr > 1.4 ? '(STRONG)' : '(ACCEPTABLE)'}

ACTUAL FINANCING NUMBERS:
- Purchase Price: $${purchasePrice.toLocaleString()}
- Down Payment: $${downPayment.toLocaleString()} (${purchasePrice > 0 ? ((downPayment/purchasePrice)*100).toFixed(1) : 0}%)
- Loan Amount: $${loanAmount.toLocaleString()} (CALCULATED: Purchase Price - Down Payment)
- Interest Rate: ${interestRate}%
- Monthly P&I Payment: $${Math.round(monthlyPayment).toLocaleString()}
- Total Investment: $${totalInvestment.toLocaleString()}

CRITICAL CONSTRAINT: Only reference the ACTUAL numbers above. Do NOT create fictional loan amounts, payments, or percentages.

STRATEGY FOCUS: ${verdict === 'BUY' ? 'Optimize strong deal structure' : verdict === 'NEGOTIATE' ? 'Structure to reach BUY threshold' : 'Minimize risk or find alternative approach'}

Task: Provide capital strategy recommendations using ONLY the verified numbers above. Calculate realistic alternatives based on the actual $${purchasePrice.toLocaleString()} purchase price.

Format as JSON:
{
  "currentAssessment": "Assessment of the actual $${Math.round(cashFlow)} monthly cash flow and ${dscr.toFixed(2)} DSCR structure",
  "optimizedApproach": "Specific changes based on actual $${loanAmount.toLocaleString()} loan amount and $${monthlyPayment.toLocaleString()} payment",
  "alternativeOptions": ["Alternative 1 with realistic calculations from actual purchase price", "Alternative 2 using verified down payment amount"],
  "recommendation": "Best capital strategy for this ${verdict} deal with actual financial constraints"
}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback capital strategy');
        return this.getFallbackCapitalStrategy(decision, analysis);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      return JSON.parse(this.cleanJsonContent(content));
    } catch (error) {
      logger.error('AI Capital Strategy generation failed:', error);
      return this.getFallbackCapitalStrategy(decision, analysis);
    }
  }

  /**
   * Generate holding period and timeline recommendations
   */
  async generateTimeline(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent['timeline']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const purchasePrice = propertyData?.purchasePrice ?? analysis?.purchasePrice ?? 0; // Use original data first
    const verdict = decision?.verdict ?? 'UNKNOWN';
    const projectionYears = analysis?.longTermAnalysis?.projectionYears ?? 10;
    
    // Calculate total appreciation if projections exist
    const projections = analysis?.longTermAnalysis?.projections ?? [];
    const finalYear = projections[projections.length - 1];
    const totalAppreciationAmount = finalYear ? (finalYear.propertyValue - purchasePrice) : 0;
    const totalAppreciationPercent = purchasePrice > 0 ? (totalAppreciationAmount / purchasePrice * 100) : 0;

    const prompt = `
You are a portfolio strategist analyzing optimal holding periods for a ${verdict} recommendation.

VERIFIED INVESTMENT PROFILE:
- 10-Year IRR: ${irr.toFixed(1)}%
- Monthly Cash Flow: $${Math.round(cashFlow)}
- Purchase Price: $${purchasePrice.toLocaleString()}
- Total Appreciation: ${totalAppreciationPercent.toFixed(1)}% over ${projectionYears} years
- Professional Score: ${decision?.professionalAssessment?.dealQuality ?? 'N/A'}/100

CONSTRAINT: Only reference the ACTUAL numbers provided above. Do NOT create fictional market data or demographics.

Task: Recommend optimal holding period (3-5 years, 5-10 years, or 10+ years) based on the verified ${irr.toFixed(1)}% IRR and $${Math.round(cashFlow)} monthly cash flow.

Format as JSON:
{
  "optimalHoldPeriod": "Recommended period based on actual ${irr.toFixed(1)}% IRR and cash flow profile",
  "rationale": "Why this timeline works for this specific $${purchasePrice.toLocaleString()} investment with ${totalAppreciationPercent.toFixed(1)}% appreciation",
  "exitIndicators": ["Indicator based on actual cash flow performance", "Signal based on verified appreciation trend"],
  "marketTiming": "Timing strategy for this ${verdict} recommendation using actual metrics"
}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback timeline');
        return this.getFallbackTimeline(decision, analysis);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 350
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      return JSON.parse(this.cleanJsonContent(content));
    } catch (error) {
      logger.error('AI Timeline generation failed:', error);
      return this.getFallbackTimeline(decision, analysis);
    }
  }

  /**
   * Generate investment alternatives and strategy adjustments
   */
  async generateAlternatives(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent['alternatives']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis
    const propertyType = propertyData?.propertyType ?? analysis?.data?.propertyType ?? 'SFR';
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const capRate = analysis?.keyMetrics?.capRate ?? 0;
    const purchasePrice = analysis?.purchasePrice ?? 0;
    const verdict = decision?.verdict ?? 'UNKNOWN';
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;
    const interestRate = analysis?.interestRate ?? analysis?.data?.interestRate ?? 7;

    const prompt = `
You are an investment strategist suggesting alternatives for a ${verdict} recommendation.

VERIFIED CURRENT ANALYSIS:
- Property Type: ${propertyType}
- Purchase Price: $${purchasePrice.toLocaleString()}
- Monthly Cash Flow: $${Math.round(cashFlow)}
- 10-Year IRR: ${irr.toFixed(1)}%
- Cap Rate: ${capRate.toFixed(2)}%
- Interest Rate: ${interestRate}%
- Deal Quality: ${dealQuality}/100 (${verdict})

CONSTRAINT: Only reference the ACTUAL numbers provided above. Do NOT create fictional market data, rates, or property details.

Task: Suggest realistic alternatives based on the verified metrics above. Focus on practical adjustments for this specific ${purchasePrice.toLocaleString()} property with ${irr.toFixed(1)}% IRR.

Format as JSON:
{
  "betterPropertyType": "Alternative property type considering the actual ${propertyType} performance and $${purchasePrice.toLocaleString()} price point",
  "marketAlternative": "Market strategy adjustment based on actual ${capRate.toFixed(2)}% cap rate and ${interestRate}% financing", 
  "timingStrategy": "Timing approach for this ${verdict} deal with ${irr.toFixed(1)}% IRR potential",
  "riskAdjustment": "Risk strategy based on actual $${Math.round(cashFlow)} monthly cash flow performance"
}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback alternatives');
        return this.getFallbackAlternatives(decision, analysis);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      return JSON.parse(this.cleanJsonContent(content));
    } catch (error) {
      logger.error('AI Alternatives generation failed:', error);
      return this.getFallbackAlternatives(decision, analysis);
    }
  }

  /**
   * Generate complete AI-enhanced content for all tabs
   */
  async generateAllContent(decision: InvestmentDecision, analysis: any, propertyData?: any): Promise<AIEnhancedContent> {
    try {
      // Run all AI content generation in parallel for performance
      const [reasoning, actionPlan, capitalStrategy, timeline, alternatives] = await Promise.all([
        this.generateReasoning(decision, analysis, propertyData),
        this.generateActionPlan(decision, analysis, propertyData),
        this.generateCapitalStrategy(decision, analysis, propertyData),
        this.generateTimeline(decision, analysis, propertyData),
        this.generateAlternatives(decision, analysis, propertyData)
      ]);

      return {
        reasoning,
        actionPlan,
        capitalStrategy,
        timeline,
        alternatives
      };
    } catch (error) {
      console.error('AI content generation failed:', error);
      // Return fallback content if AI fails
      return this.getFallbackContent(decision, analysis);
    }
  }

  // Fallback methods for when AI fails
  private getFallbackReasoning(decision: InvestmentDecision, analysis: any): AIEnhancedContent['reasoning'] {
    return {
      explanation: `Our analysis recommends ${decision.verdict} based on weighted professional criteria.`,
      keyStrengths: [
        `Deal Quality Score: ${decision.professionalAssessment?.dealQuality || 'N/A'}/100`,
        `Monthly Cash Flow: $${analysis?.monthlyAnalysis?.cashFlow || 'N/A'}`
      ],
      keyConcerns: [
        decision.professionalAssessment?.riskMitigation?.[0] || 'Market conditions require attention',
        decision.professionalAssessment?.riskMitigation?.[1] || 'Financing structure needs optimization'
      ],
      verdict: `This ${decision.verdict} recommendation aligns with professional investment standards.`
    };
  }

  private getFallbackActionPlan(decision: InvestmentDecision, analysis: any): AIEnhancedContent['actionPlan'] {
    return {
      immediateActions: ['Review property inspection report', 'Verify rent comparables'],
      negotiationFocus: ['Purchase price adjustment', 'Closing cost negotiations'],
      preparationItems: ['Secure financing pre-approval', 'Build 6-month reserve fund'],
      timeframe: '30-45 days for due diligence and closing'
    };
  }

  private getFallbackCapitalStrategy(decision: InvestmentDecision, analysis: any): AIEnhancedContent['capitalStrategy'] {
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    const dscr = analysis?.keyMetrics?.dscr || 0;
    const verdict = decision?.verdict || 'UNKNOWN';
    
    const currentAssessment = cashFlow < 0 
      ? `Negative $${Math.abs(cashFlow)} monthly cash flow requires capital contribution. DSCR of ${dscr.toFixed(2)} indicates payment stress risk.`
      : `Positive $${cashFlow} monthly cash flow with DSCR of ${dscr.toFixed(2)} provides adequate debt coverage.`;
    
    const optimizedApproach = verdict === 'NEGOTIATE' 
      ? 'Increase down payment to improve cash flow or negotiate better loan terms to reduce monthly payment.'
      : 'Consider refinancing options to optimize interest rate and payment structure.';
    
    const alternatives = cashFlow < 0 
      ? [`Increase down payment by $50k to improve cash flow by ~$350/month`, `Owner financing at 6% to reduce monthly payments by ~$200`]
      : [`Portfolio lender for 5.5% rate (save ~$150/month)`, `Cash-out refinance after 2 years for next acquisition`];
    
    const recommendation = verdict === 'PASS' 
      ? 'Current structure not viable. Consider 100% cash purchase or find better deal.'
      : `${verdict === 'BUY' ? 'Strong' : 'Acceptable'} financing structure. ${cashFlow < 0 ? 'Budget $200/month reserves for contributions.' : 'Proceed with confidence.'}`;
    
    return {
      currentAssessment,
      optimizedApproach,
      alternativeOptions: alternatives,
      recommendation
    };
  }

  private getFallbackTimeline(decision: InvestmentDecision, analysis: any): AIEnhancedContent['timeline'] {
    return {
      optimalHoldPeriod: '7-10 years for balanced cash flow and appreciation',
      rationale: 'Allows time for property appreciation while generating steady income.',
      exitIndicators: ['Market cap rates compress significantly', 'Major market cycle shift'],
      marketTiming: 'Current market conditions support medium-term hold strategy.'
    };
  }

  private getFallbackAlternatives(decision: InvestmentDecision, analysis: any): AIEnhancedContent['alternatives'] {
    return {
      betterPropertyType: 'Consider multi-family properties for improved cash flow',
      marketAlternative: 'Explore emerging markets with stronger growth fundamentals',
      timingStrategy: 'Monitor interest rate trends for better financing opportunities',
      riskAdjustment: 'Increase down payment to improve cash flow and reduce leverage risk'
    };
  }

  private getFallbackContent(decision: InvestmentDecision, analysis: any): AIEnhancedContent {
    return {
      reasoning: this.getFallbackReasoning(decision, analysis),
      actionPlan: this.getFallbackActionPlan(decision, analysis),
      capitalStrategy: this.getFallbackCapitalStrategy(decision, analysis),
      timeline: this.getFallbackTimeline(decision, analysis),
      alternatives: this.getFallbackAlternatives(decision, analysis)
    };
  }
}

export const aiEnhancedMessagingService = new AIEnhancedMessagingService();