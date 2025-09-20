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
   * Generate personalized goal-based reasoning (V3.0 80/20 Architecture)
   * 80% Algorithmic Foundation + 20% AI Enhancement for user context
   */
  async generatePersonalizedGoalReasoning(
    decision: InvestmentDecision,
    analysis: any,
    propertyData?: any
  ): Promise<string> {
    // Extract algorithmic context (80% foundation)
    const algorithmicContext = {
      verdict: decision.verdict,
      dealQuality: decision.professionalAssessment?.dealQuality ?? 0,
      cashFlowScore: decision.professionalAssessment?.cashFlowScore ?? 0,
      irrScore: decision.professionalAssessment?.irrScore ?? 0,
      marketStrengthScore: decision.professionalAssessment?.marketStrengthScore ?? 0,
      debtStructureScore: decision.professionalAssessment?.debtStructureScore ?? 0,
      exitStrategyScore: decision.professionalAssessment?.exitStrategyScore ?? 0,
      capRateScore: decision.professionalAssessment?.capRateScore ?? 0,
      propertyRiskScore: decision.professionalAssessment?.propertyRiskScore ?? 0
    };

    // Extract user context (20% AI enhancement)
    const userContext = {
      freeTextStrategy: propertyData?.enhancedGoals?.strategy || propertyData?.exitStrategy?.strategy || 'Not specified',
      primaryExitStrategy: propertyData?.exitStrategy?.primaryExitStrategy || 'sale',
      portfolioStrategy: propertyData?.enhancedGoals?.portfolioStrategy || 'balanced',
      riskApproach: propertyData?.enhancedGoals?.riskTolerance || 'balanced',
      holdPeriod: propertyData?.enhancedGoals?.holdPeriod || propertyData?.exitStrategy?.holdPeriod || 10,
      experienceLevel: propertyData?.enhancedGoals?.experienceLevel || 'intermediate'
    };

    // Extract financial metrics for context
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const capRate = analysis?.keyMetrics?.capRate ?? 0;
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const purchasePrice = propertyData?.purchasePrice ?? 0;

    const prompt = `
You are a $20M portfolio manager explaining WHY our professional algorithm reached its ${algorithmicContext.verdict} verdict to a client with specific investment goals.

ALGORITHMIC FOUNDATION (80% - CANNOT BE CHANGED):
- VERDICT: ${algorithmicContext.verdict} (Deal Quality: ${algorithmicContext.dealQuality}/100)
- SCORING BREAKDOWN (Weighted Professional Assessment):
  • Cash Flow (35% weight): ${algorithmicContext.cashFlowScore}/100
  • IRR (25% weight): ${algorithmicContext.irrScore}/100
  • Market Strength (15% weight): ${algorithmicContext.marketStrengthScore}/100
  • Debt Structure (10% weight): ${algorithmicContext.debtStructureScore}/100
  • Exit Strategy (10% weight): ${algorithmicContext.exitStrategyScore}/100
  • Cap Rate (3% weight): ${algorithmicContext.capRateScore}/100
  • Property Risk (2% weight): ${algorithmicContext.propertyRiskScore}/100

PROPERTY FINANCIAL METRICS:
- Monthly Cash Flow: $${Math.round(cashFlow)}
- Cap Rate: ${capRate.toFixed(2)}%
- 10-Year IRR: ${irr.toFixed(1)}%
- Purchase Price: $${purchasePrice.toLocaleString()}

USER'S INVESTMENT STRATEGY (20% - YOUR FOCUS):
- Exit Strategy: ${userContext.primaryExitStrategy}
- Portfolio Goal: ${userContext.portfolioStrategy}
- Risk Approach: ${userContext.riskApproach}
- Hold Period: ${userContext.holdPeriod} years
- Experience: ${userContext.experienceLevel}
- Personal Strategy Notes: "${userContext.freeTextStrategy}"

CRITICAL INSTRUCTIONS:
1. RESPECT the algorithmic ${algorithmicContext.verdict} verdict - it cannot be changed
2. EXPLAIN WHY the algorithm reached this conclusion using the weighted scores
3. CONNECT the algorithmic reasoning to the user's personal strategy and notes
4. USE ONLY the actual numbers provided - no fictional data
5. BE SPECIFIC about which scoring factors drove the verdict
6. ACKNOWLEDGE the user's personal strategy context in your explanation

TASK: Write a single paragraph (2-3 sentences) that explains WHY our algorithm recommended ${algorithmicContext.verdict} and HOW this aligns with (or conflicts with) the user's stated investment goals and strategy notes.

FORMAT: Return ONLY the explanation text, no JSON wrapper.

EXAMPLE APPROACH:
"With your [user strategy context], this property's ${algorithmicContext.dealQuality}/100 deal quality driven primarily by [specific low/high scoring factors] results in our ${algorithmicContext.verdict} recommendation because [algorithmic reasoning that connects to user goals]."
`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback goal-based reasoning');
        return this.getFallbackGoalReasoning(algorithmicContext, userContext);
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('No AI response received');

      return content;
    } catch (error) {
      logger.error('AI Goal-based reasoning generation failed:', error);
      return this.getFallbackGoalReasoning(algorithmicContext, userContext);
    }
  }

  /**
   * Fallback goal-based reasoning when AI service fails
   */
  private getFallbackGoalReasoning(
    algorithmicContext: { verdict: string; dealQuality: number; cashFlowScore: number; irrScore: number },
    userContext: { portfolioStrategy?: string; riskApproach?: string; primaryExitStrategy?: string }
  ): string {
    const strategy = userContext.portfolioStrategy || 'investment';
    const risk = userContext.riskApproach || 'balanced';
    const exit = userContext.primaryExitStrategy || 'sale';

    if (algorithmicContext.verdict === 'BUY') {
      return `With your ${strategy} strategy and ${risk} risk approach targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 deal quality driven by strong fundamentals results in our BUY recommendation because the algorithmic assessment aligns with professional investment standards.`;
    }

    if (algorithmicContext.verdict === 'NEGOTIATE') {
      return `With your ${strategy} strategy targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 deal quality shows potential but requires negotiation to reach professional investment thresholds aligned with your ${risk} risk approach.`;
    }

    if (algorithmicContext.verdict === 'CAUTION') {
      return `With your ${risk} risk approach targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 deal quality suggests proceeding carefully as the algorithmic assessment indicates marginal returns that may not align with your ${strategy} strategy.`;
    }

    return `With your ${strategy} strategy targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 deal quality falls below professional investment standards, making our PASS recommendation the prudent choice for your ${risk} risk approach.`;
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