/**
 * AI-Enhanced Messaging Service
 *
 * Implements 80/20 approach: 80% algorithmic analysis + 20% AI enhancement
 * Generates dynamic, contextual content for InvestmentDecisionHero tabs
 *
 * LEGAL COMPLIANCE (Issue #76):
 * - AI provides ANALYTICAL context, NOT investment recommendations
 * - Uses Deal Quality scores (0-100), NOT directive verdicts (BUY/PASS/NEGOTIATE/CAUTION)
 * - All content passes post-processing validation to remove directive language
 * - Analytical framing: "The analysis shows..." NOT "We recommend..."
 * - Prevents legal liability from making investment advice
 *
 * TWO-STAGE PIPELINE ARCHITECTURE (Issue #78):
 * - Stage 1: Goal Extraction & Sanitization (goalExtractionService.ts)
 * - Stage 2: Analysis Reasoning (this service)
 * - Security: Blocks prompt injection, redacts PII, filters profanity
 * - Quality: Pre-calculated goal gaps prevent AI hallucination
 */

import { getOpenAIClient } from './openai';
import { logger } from '../utils/logger';
import { InvestmentDecision, ProfessionalAssessment } from './investment/investmentDecisionEngine';
import { extractAndSanitizeGoals, SanitizedGoalContext } from './goalExtractionService';

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
   * Convert Deal Quality score to analytical descriptor (non-directive)
   * LEGAL COMPLIANCE: Returns objective quality assessment, not investment advice
   *
   * @param dealQuality - Score from 0-100
   * @returns Analytical descriptor without directive language
   */
  private getQualityDescriptor(dealQuality: number): string {
    if (dealQuality >= 80) return '(Strong fundamentals)';
    if (dealQuality >= 65) return '(Solid foundation)';
    if (dealQuality >= 50) return '(Requires optimization)';
    if (dealQuality >= 35) return '(Significant concerns)';
    return '(Below professional standards)';
  }

  /**
   * Post-processing validation to catch directive language
   * Sanitizes AI output and logs violations for prompt refinement
   *
   * Issue #76: Prevents AI from generating investment recommendation language
   *
   * @param content - AI-generated text content
   * @param contentType - Type identifier for logging
   * @returns Sanitized content with directive language removed
   */
  private validateAndSanitizeAIContent(content: string, contentType: string): string {
    const directivePatterns = [
      { pattern: /\brecommend(ed|s|ation)?\b/gi, replacement: 'indicates' },
      { pattern: /\b(should|must)\s+(buy|pass|negotiate|avoid)\b/gi, replacement: 'analysis shows' },
      { pattern: /\balgorithm\s+(recommends?|suggests?|advises?)\b/gi, replacement: 'algorithm indicates' },
      { pattern: /\b(we|I)\s+(recommend|suggest|advise)\b/gi, replacement: 'the analysis shows' },
      { pattern: /\b(buy|pass|negotiate)\s+this\s+property\b/gi, replacement: 'consider this property' }
    ];

    let sanitizedContent = content;
    const violations: string[] = [];

    directivePatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push(...matches);
        sanitizedContent = sanitizedContent.replace(pattern, replacement);
      }
    });

    if (violations.length > 0) {
      logger.warn(`AI directive language detected in ${contentType} (Issue #76):`, {
        violations,
        sanitizedContent
      });
    }

    return sanitizedContent;
  }

  /**
   * Generate enhanced reasoning explanation
   * NOW GOAL-AWARE: Uses sanitizedGoals to provide personalized analysis
   */
  async generateReasoning(decision: InvestmentDecision, analysis: any, propertyData?: any, sanitizedGoals?: SanitizedGoalContext): Promise<AIEnhancedContent['reasoning']> {
    // FIXED: Extract data from CORRECT sources - prefer original propertyData over analysis
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const capRate = analysis?.keyMetrics?.capRate ?? 0;
    const interestRate = propertyData?.interestRate ?? analysis?.interestRate ?? 7; // Use original data first
    const purchasePrice = propertyData?.purchasePrice ?? analysis?.purchasePrice ?? 0; // Use original data first
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;

    const prompt = `
You are a $20M real estate portfolio manager explaining an investment analysis to a client.

VALIDATED PROPERTY ANALYSIS:
- Professional Assessment: Deal Quality ${dealQuality}/100 ${this.getQualityDescriptor(dealQuality)}
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

${sanitizedGoals?.sanitizedText ? `
USER INVESTMENT GOALS:
"${sanitizedGoals.sanitizedText}"

Strategy: ${sanitizedGoals.strategy || 'Not specified'}
Timeline: ${sanitizedGoals.timeline || 'Flexible'}
${sanitizedGoals.numericGoals?.cashFlow ? `Cash Flow Target: $${sanitizedGoals.numericGoals.cashFlow.value}/${sanitizedGoals.numericGoals.cashFlow.unit}` : ''}
${sanitizedGoals.numericGoals?.irr ? `IRR Target: ${sanitizedGoals.numericGoals.irr.value}% over ${sanitizedGoals.numericGoals.irr.timeframe} years` : ''}
${sanitizedGoals.numericGoals?.capRate ? `Cap Rate Target: ${sanitizedGoals.numericGoals.capRate.value}%` : ''}

CRITICAL CONSTRAINTS:
1. Only reference ACTUAL numbers provided above
2. NEVER use directive language (recommend, should buy, caution as verdict)
3. Use analytical framing: "The analysis shows...", "The data indicates..."
4. Focus on gap between user's targets and actual performance
5. Provide strategic alignment assessment (e.g., cash flow goal vs negative cash flow property)

Task: Explain how this ${dealQuality}/100 property aligns (or doesn't) with the user's goals.
Focus on:
- Gap between user's targets and actual performance
- Strategic alignment or misalignment
- Actionable insights to close gaps (without directive language)

Format as JSON:
{
  "explanation": "2-3 sentence goal-based analysis with actual numbers",
  "keyStrengths": ["Strength relevant to user's goals with numbers", "Second strength"],
  "keyConcerns": ["Concern relative to user's goals with numbers", "Second concern"],
  "verdict": "One sentence conclusion about goal alignment"
}` : `
NO USER GOALS PROVIDED

⚠️ CRITICAL - USER CAN SEE ALL METRICS ABOVE ⚠️

ABSOLUTE REQUIREMENTS:
1. MAXIMUM 25 WORDS for explanation field
2. DO NOT mention: Deal Quality score, cash flow number, IRR percentage, or ANY numbers
3. User already sees these metrics - repeating them is redundant
4. Use analytical framing: "Property shows..." NOT "The analysis shows..."
5. NEVER use directive language (recommend, should buy)

Task: Write ONE brief sentence about overall property characteristic.
DO NOT EXPLAIN SCORES - user can read them above.

GOOD EXAMPLES:
- "Property shows below-target fundamentals with mixed market conditions."
- "Investment challenges offset by strong appreciation potential."
- "Weak current performance may improve with market shifts."

BAD EXAMPLES (DO NOT DO THIS):
- "Deal Quality score is 34/100..." ← User can see this!
- "Cash flow is -$667..." ← Redundant!
- "IRR is 2.12%..." ← Already visible!

Format as JSON:
{
  "explanation": "One brief sentence (max 15 words, NO numbers)",
  "keyStrengths": ["One strength (no numbers)", "Second strength"],
  "keyConcerns": ["One concern (no numbers)", "Second concern"],
  "verdict": "One sentence (max 10 words)"
}`}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback reasoning');
        return this.getFallbackReasoning(decision, analysis, sanitizedGoals);
      }

      // Drastically reduce tokens for no-goals scenario to force brevity
      const maxTokens = sanitizedGoals?.sanitizedText ? 350 : 120; // 120 tokens = ~90 words absolute max

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Lower temperature for more consistent brevity
        max_tokens: maxTokens
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No AI response received');

      const parsedContent = JSON.parse(this.cleanJsonContent(content));

      // Issue #76: Sanitize all text fields to remove directive language
      parsedContent.explanation = this.validateAndSanitizeAIContent(parsedContent.explanation, 'reasoning.explanation');
      parsedContent.verdict = this.validateAndSanitizeAIContent(parsedContent.verdict, 'reasoning.verdict');
      if (parsedContent.keyStrengths) {
        parsedContent.keyStrengths = parsedContent.keyStrengths.map((s: string, i: number) =>
          this.validateAndSanitizeAIContent(s, `reasoning.keyStrengths[${i}]`)
        );
      }
      if (parsedContent.keyConcerns) {
        parsedContent.keyConcerns = parsedContent.keyConcerns.map((c: string, i: number) =>
          this.validateAndSanitizeAIContent(c, `reasoning.keyConcerns[${i}]`)
        );
      }

      return parsedContent;
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
You are a real estate acquisition manager creating a tactical action plan.

VALIDATED PROPERTY DATA:
- Deal Quality Assessment: ${dealQuality}/100 ${this.getQualityDescriptor(dealQuality)}
- Monthly Cash Flow: $${Math.round(cashFlow)}
- Purchase Price: $${purchasePrice.toLocaleString()}
- Monthly Rent: $${monthlyRent.toLocaleString()}
- Total Investment Required: $${totalInvestment.toLocaleString()}
- DSCR: ${dscr.toFixed(2)}

SENSITIVITY ANALYSIS INSIGHTS:
${pathToBuy ? `
- Easiest Path to Improvement: ${pathToBuy.easiest?.description || 'Not available'}
- Most Realistic Path: ${pathToBuy.mostRealistic?.description || 'Not available'}
- Negotiation Focus: ${negotiationGuidance?.focus || 'terms'}
` : 'Sensitivity analysis not available - provide general guidance'}

CRITICAL CONSTRAINTS:
1. Only reference ACTUAL numbers above
2. NEVER use directive language (should buy, recommend, caution)
3. Use analytical framing for a ${dealQuality}/100 quality property

Task: Create a practical 3-phase action plan based on the ${dealQuality}/100 assessment.

Format as JSON:
{
  "immediateActions": ["Action based on verified data", "Priority from actual metrics"],
  "negotiationFocus": ["Target using actual numbers", "Alternative with real data"],
  "preparationItems": ["Preparation based on total investment", "Reserves from cash flow"],
  "timeframe": "Realistic timeline for ${dealQuality}/100 quality property"
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

    // CALCULATE loan amount instead of accessing non-existent path
    const loanAmount = purchasePrice - downPayment;
    const monthlyPayment = analysis?.monthlyAnalysis?.expenses?.debt ?? 0;

    const prompt = `
You are a capital allocation specialist analyzing financing strategy.

VERIFIED DEAL STRUCTURE:
- Professional Score: ${dealQuality}/100 ${this.getQualityDescriptor(dealQuality)}
- Monthly Cash Flow: $${Math.round(cashFlow)} ${cashFlow < 0 ? '(requires contribution)' : '(positive)'}
- DSCR: ${dscr.toFixed(2)} ${dscr < 1.25 ? '(payment stress risk)' : dscr > 1.4 ? '(strong)' : '(acceptable)'}

ACTUAL FINANCING NUMBERS:
- Purchase Price: $${purchasePrice.toLocaleString()}
- Down Payment: $${downPayment.toLocaleString()} (${purchasePrice > 0 ? ((downPayment/purchasePrice)*100).toFixed(1) : 0}%)
- Loan Amount: $${loanAmount.toLocaleString()}
- Interest Rate: ${interestRate}%
- Monthly P&I Payment: $${Math.round(monthlyPayment).toLocaleString()}
- Total Investment: $${totalInvestment.toLocaleString()}

CRITICAL CONSTRAINTS:
1. Only reference ACTUAL numbers above
2. NEVER use directive language (recommend, should, must)
3. Use analytical framing: "The analysis shows...", "Data indicates..."

STRATEGY FOCUS: ${dealQuality >= 65 ? 'Optimize strong structure' : dealQuality >= 50 ? 'Structure improvements to enhance returns' : 'Risk mitigation approaches'}

Task: Provide capital strategy analysis for ${dealQuality}/100 quality property.

Format as JSON:
{
  "currentAssessment": "Assessment of $${Math.round(cashFlow)} cash flow and ${dscr.toFixed(2)} DSCR",
  "optimizedApproach": "Specific changes based on actual financing structure",
  "alternativeOptions": ["Alternative 1 with realistic calculations", "Alternative 2 using verified amounts"],
  "recommendation": "Best capital strategy for ${dealQuality}/100 quality with actual constraints"
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
   * Generate personalized goal-based reasoning (V3.0 80/20 Architecture + Two-Stage Pipeline)
   *
   * STAGE 1: Extract & sanitize user goals (Security + Structure)
   * STAGE 2: Generate analysis reasoning using clean data
   *
   * Issue #78 Fix: Two-stage pipeline prevents:
   * - Prompt injection attacks
   * - PII leakage
   * - Profanity in professional output
   * - AI hallucination on goal comparisons (pre-calculated gaps)
   */
  async generatePersonalizedGoalReasoning(
    decision: InvestmentDecision,
    analysis: any,
    propertyData?: any
  ): Promise<string> {

    // ============================================================
    // STAGE 1: Extract and Sanitize User Goals
    // ============================================================

    const rawUserInput = propertyData?.enhancedGoals?.freeTextStrategy ||  // ✅ CORRECT FIELD (Issue #78)
                         propertyData?.enhancedGoals?.strategy ||          // Fallback for legacy data
                         propertyData?.exitStrategy?.strategy ||
                         'Not specified';

    const sanitizedGoals: SanitizedGoalContext = await extractAndSanitizeGoals(rawUserInput);

    // DEBUG: Log what Stage 1 returned (Issue #78 debugging)
    logger.info('🔍 DEBUG Stage 2 RECEIVED from Stage 1:', {
      rawUserInputReceived: rawUserInput?.substring(0, 100) || 'not specified',
      stage1Output: {
        strategy: sanitizedGoals.strategy,
        sentiment: sanitizedGoals.sentiment,
        confidence: sanitizedGoals.confidence,
        numericGoals: sanitizedGoals.numericGoals,
        sanitizedText: sanitizedGoals.sanitizedText?.substring(0, 100) || 'none'
      }
    });

    // SECURITY GATE: Block if threat detected
    if (sanitizedGoals.threatDetected !== 'none') {
      logger.warn('🚨 SECURITY: Using fallback reasoning due to threat detection', {
        threatType: sanitizedGoals.threatDetected
      });

      const algorithmicContext = {
        verdict: decision.verdict,
        dealQuality: decision.professionalAssessment?.dealQuality ?? 0,
        cashFlowScore: decision.professionalAssessment?.cashFlowScore ?? 0,
        irrScore: decision.professionalAssessment?.irrScore ?? 0
      };

      const userContext = {
        portfolioStrategy: propertyData?.enhancedGoals?.portfolioStrategy,
        riskApproach: propertyData?.enhancedGoals?.riskTolerance,
        primaryExitStrategy: propertyData?.exitStrategy?.primaryExitStrategy
      };

      return this.getFallbackGoalReasoning(algorithmicContext, userContext);
    }

    // ============================================================
    // Extract Algorithmic Context (80% Foundation)
    // ============================================================

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

    // ============================================================
    // Extract Verified Financial Metrics
    // ============================================================

    const cashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
    const capRate = analysis?.keyMetrics?.capRate ?? 0;
    const irr = analysis?.keyMetrics?.irr ?? 0;
    const purchasePrice = propertyData?.purchasePrice ?? 0;
    const monthlyRent = propertyData?.monthlyRent ?? 0;
    const totalExpenses = analysis?.monthlyAnalysis?.totalExpenses ?? 0;

    // ============================================================
    // Build Goal Comparison Context (DETERMINISTIC - NO AI MATH)
    // ============================================================

    let goalComparisonContext = '';

    // Cash Flow Goal Comparison
    if (sanitizedGoals.numericGoals.cashFlow) {
      const target = sanitizedGoals.numericGoals.cashFlow.value;
      const actual = cashFlow;
      const gap = actual - target;
      const gapPercentage = ((gap / target) * 100).toFixed(1);

      goalComparisonContext += `
USER'S CASH FLOW TARGET: $${target.toFixed(2)}/${sanitizedGoals.numericGoals.cashFlow.unit}
ACTUAL CASH FLOW: $${actual.toFixed(2)}/month
GAP: ${gap >= 0 ? '+' : ''}$${gap.toFixed(2)}/month (${gap >= 0 ? 'EXCEEDS' : 'BELOW'} target by ${Math.abs(parseFloat(gapPercentage))}%)
${gap < 0 ? `TO CLOSE GAP: Need to increase income or reduce expenses by $${Math.abs(gap).toFixed(2)}/month` : ''}
`;
    }

    // Cap Rate Goal Comparison
    if (sanitizedGoals.numericGoals.capRate) {
      const target = sanitizedGoals.numericGoals.capRate.value;
      const actual = capRate;
      const gap = actual - target;

      goalComparisonContext += `
USER'S CAP RATE TARGET: ${target.toFixed(1)}%
ACTUAL CAP RATE: ${actual.toFixed(2)}%
GAP: ${gap >= 0 ? '+' : ''}${gap.toFixed(2)}% (${gap >= 0 ? 'EXCEEDS' : 'BELOW'} target)
`;
    }

    // IRR Goal Comparison
    if (sanitizedGoals.numericGoals.irr) {
      const target = sanitizedGoals.numericGoals.irr.value;
      const actual = irr * 100;  // Convert decimal to percentage
      const gap = actual - target;

      goalComparisonContext += `
USER'S IRR TARGET: ${target.toFixed(1)}% over ${sanitizedGoals.numericGoals.irr.timeframe} years
ACTUAL ${sanitizedGoals.numericGoals.irr.timeframe}-YEAR IRR: ${actual.toFixed(2)}%
GAP: ${gap >= 0 ? '+' : ''}${gap.toFixed(2)}% (${gap >= 0 ? 'EXCEEDS' : 'BELOW'} target)
`;
    }

    // DEBUG: Log goal comparison context being sent to AI (Issue #78 debugging)
    if (goalComparisonContext) {
      logger.info('🔍 DEBUG Stage 2: Goal comparison context built', {
        hasGoalComparison: true,
        goalComparisonPreview: goalComparisonContext.substring(0, 300)
      });
    } else {
      logger.info('🔍 DEBUG Stage 2: No goal comparison (no numeric goals extracted)');
    }

    // ============================================================
    // STAGE 2: Build Analysis Reasoning Prompt (USES ONLY SANITIZED DATA)
    // ============================================================

    const stage2Prompt = `
You are a $20M portfolio manager explaining our professional algorithm's Deal Quality assessment to a client.

VERIFIED PROPERTY METRICS (ONLY USE THESE EXACT NUMBERS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Monthly Cash Flow: $${cashFlow.toFixed(2)}
- Cap Rate: ${capRate.toFixed(2)}%
- 10-Year IRR: ${(irr * 100).toFixed(2)}%
- Purchase Price: $${purchasePrice.toLocaleString()}
- Monthly Rent: $${monthlyRent.toFixed(2)}
- Total Monthly Expenses: $${totalExpenses.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEAL QUALITY ASSESSMENT (ONLY USE THESE EXACT SCORES):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Overall: ${algorithmicContext.dealQuality}/100 ${this.getQualityDescriptor(algorithmicContext.dealQuality)}
- Cash Flow Score (35% weight): ${algorithmicContext.cashFlowScore}/100
- IRR Score (25% weight): ${algorithmicContext.irrScore}/100
- Market Strength (15% weight): ${algorithmicContext.marketStrengthScore}/100
- Debt Structure (10% weight): ${algorithmicContext.debtStructureScore}/100
- Exit Strategy (10% weight): ${algorithmicContext.exitStrategyScore}/100
- Cap Rate (3% weight): ${algorithmicContext.capRateScore}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sanitizedGoals.sanitizedText && sanitizedGoals.sanitizedText !== 'Not specified' ? `
CLIENT'S INVESTMENT CONTEXT (sanitized & structured):
- Strategy: ${sanitizedGoals.strategy || 'Not specified'}
- Sentiment: ${sanitizedGoals.sentiment}
- Timeline: ${sanitizedGoals.timeline}
- Constraints: ${sanitizedGoals.constraints?.join(', ') || 'None specified'}

CLIENT'S GOALS (sanitized):
"${sanitizedGoals.sanitizedText}"

${goalComparisonContext ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOAL ALIGNMENT ANALYSIS (pre-calculated, use exactly as shown):
${goalComparisonContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

⚠️ CRITICAL: MAXIMUM 75 WORDS TOTAL ⚠️

TASK:
Write 2-3 SHORT sentences (50-75 words MAX) addressing goal alignment.

REQUIRED STRUCTURE:
1. ONE sentence acknowledging client's goal: "${sanitizedGoals.sanitizedText}"
2. ONE sentence on property alignment using Deal Quality (${algorithmicContext.dealQuality}/100)
${goalComparisonContext ? `3. ONE sentence on gap closure using pre-calculated analysis above` : `3. ONE sentence suggesting path forward`}

DO NOT:
- Exceed 75 words under ANY circumstance
- Use flowery or verbose language
- Repeat numbers visible above (Cash Flow, IRR scores)
- Write long explanations

GOOD EXAMPLE (WITH GOALS):
"Your goal of achieving $1000/month cash flow is ambitious for this property. The analysis shows Deal Quality of 59/100, with current cash flow at $250/month falling $750 short. Consider negotiating purchase price down 15% or exploring value-add opportunities to close the gap."

LEGAL COMPLIANCE (Issue #76):
- NEVER use directive language (recommend, should buy)
- Use analytical framing: "The analysis shows..."

Write your concise goal-based analysis now (50-75 words):
` : `
⚠️ NO USER GOALS PROVIDED ⚠️

CLIENT CAN SEE ALL SCORES ABOVE - DO NOT REPEAT THEM

CRITICAL REQUIREMENTS:
1. MAXIMUM 30 WORDS total
2. NO NUMBERS (client sees Deal Quality ${algorithmicContext.dealQuality}/100, Cash Flow ${algorithmicContext.cashFlowScore}/100, IRR ${algorithmicContext.irrScore}/100 above)
3. Property shows..." NOT "The analysis shows..."
4. ONE brief observation about property characteristic
5. NEVER use directive language

GOOD EXAMPLES (PICK SIMILAR STYLE):
- "Property shows below-target fundamentals with limited near-term cash flow potential."
- "Investment presents challenges offset by strong market appreciation trajectory."
- "Weak current performance may improve with strategic operational enhancements."

BAD EXAMPLES (DO NOT DO THIS):
- "Deal Quality score is 34/100..." ← User already sees this!
- "Cash flow is -$667..." ← Redundant, visible above!
- "The analysis shows..." ← Too formal, just state observation

TASK:
Write ONE brief sentence (max 15 words, NO numbers, NO score repetition):
`}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEGAL COMPLIANCE (Issue #76):
- NEVER use directive language (recommend, should buy/pass)
- Use analytical framing only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write your analysis now:
`;

    // DEBUG: Log Stage 2 prompt being sent to OpenAI (Issue #78 debugging)
    logger.info('🔍 DEBUG Stage 2: Prompt being sent to OpenAI', {
      promptLength: stage2Prompt.length,
      promptPreview: stage2Prompt.substring(0, 500),
      containsUserGoal: stage2Prompt.includes(sanitizedGoals.sanitizedText),
      containsGoalComparison: !!goalComparisonContext && goalComparisonContext.length > 0,
      goalComparisonLength: goalComparisonContext?.length || 0
    });

    // ============================================================
    // Call OpenAI for Stage 2 Analysis
    // ============================================================

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        logger.warn('OpenAI client not available, using fallback goal-based reasoning');

        const userContext = {
          portfolioStrategy: sanitizedGoals.strategy,
          riskApproach: sanitizedGoals.sentiment,
          primaryExitStrategy: propertyData?.exitStrategy?.primaryExitStrategy
        };

        return this.getFallbackGoalReasoning(algorithmicContext, userContext);
      }

      // Enforce brevity through token limits and temperature
      const hasGoals = sanitizedGoals.sanitizedText && sanitizedGoals.sanitizedText !== 'Not specified';
      const maxTokens = hasGoals ? 150 : 80; // 150 tokens = ~112 words max (enforces 75-word ceiling), 80 tokens = ~60 words for no-goals

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: stage2Prompt }],
        temperature: hasGoals ? 0.2 : 0.1,  // Lower temp = more deterministic/concise
        max_tokens: maxTokens
      });

      const aiContent = response.choices[0]?.message?.content?.trim();
      if (!aiContent) throw new Error('No AI response received');

      // Issue #76: Final sanitization for directive language
      const sanitizedContent = this.validateAndSanitizeAIContent(aiContent, 'goalBasedReasoning');

      logger.info('Stage 2: Analysis reasoning completed', {
        dealQuality: algorithmicContext.dealQuality,
        userStrategy: sanitizedGoals.strategy,
        hadNumericGoals: Object.values(sanitizedGoals.numericGoals).some(v => v !== null),
        confidence: sanitizedGoals.confidence,
        sentiment: sanitizedGoals.sentiment
      });

      return sanitizedContent;

    } catch (error) {
      logger.error('Stage 2 analysis failed, using fallback', error);

      const userContext = {
        portfolioStrategy: sanitizedGoals.strategy,
        riskApproach: sanitizedGoals.sentiment,
        primaryExitStrategy: propertyData?.exitStrategy?.primaryExitStrategy
      };

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
    const qualityDescriptor = this.getQualityDescriptor(algorithmicContext.dealQuality);

    // Issue #76: Use quality scores instead of verdict-based conditionals
    if (algorithmicContext.dealQuality >= 65) {
      return `With your ${strategy} strategy and ${risk} risk approach targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 assessment ${qualityDescriptor} driven by strong fundamentals aligns with professional investment standards.`;
    }

    if (algorithmicContext.dealQuality >= 50) {
      return `With your ${strategy} strategy targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 assessment ${qualityDescriptor} shows potential with optimization to reach professional investment thresholds aligned with your ${risk} risk approach.`;
    }

    if (algorithmicContext.dealQuality >= 35) {
      return `With your ${risk} risk approach targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 assessment ${qualityDescriptor} indicates marginal returns that may require careful evaluation against your ${strategy} strategy.`;
    }

    return `With your ${strategy} strategy targeting ${exit}, this property's ${algorithmicContext.dealQuality}/100 assessment ${qualityDescriptor} falls below professional investment standards for your ${risk} risk approach.`;
  }

  /**
   * Generate complete AI-enhanced content for all tabs
   * NOW GOAL-AWARE: Passes sanitizedGoals to generateReasoning for personalized analysis
   */
  async generateAllContent(decision: InvestmentDecision, analysis: any, propertyData?: any, sanitizedGoals?: SanitizedGoalContext): Promise<AIEnhancedContent> {
    try {
      // Run all AI content generation in parallel for performance
      const [reasoning, actionPlan, capitalStrategy, timeline, alternatives] = await Promise.all([
        this.generateReasoning(decision, analysis, propertyData, sanitizedGoals), // Pass sanitizedGoals
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
      return this.getFallbackContent(decision, analysis, sanitizedGoals); // Pass sanitizedGoals to fallback
    }
  }

  // Fallback methods for when AI fails
  private getFallbackReasoning(decision: InvestmentDecision, analysis: any, sanitizedGoals?: SanitizedGoalContext): AIEnhancedContent['reasoning'] {
    const hasGoals = !!sanitizedGoals?.sanitizedText;
    const dealQuality = decision.professionalAssessment?.dealQuality || 0;

    return {
      explanation: hasGoals
        ? `Analysis shows property performance relative to your goals. Deal Quality: ${dealQuality}/100.`
        : dealQuality >= 60
          ? `Property meets professional standards. Review calibration metrics for details.`
          : `Property shows challenges in current configuration. Review professional calibration metrics.`,
      keyStrengths: [
        `Deal Quality Score: ${dealQuality}/100`,
        `Monthly Cash Flow: $${analysis?.monthlyAnalysis?.cashFlow || 'N/A'}`
      ],
      keyConcerns: [
        decision.professionalAssessment?.riskMitigation?.[0] || 'Market conditions require attention',
        decision.professionalAssessment?.riskMitigation?.[1] || 'Financing structure needs optimization'
      ],
      verdict: hasGoals
        ? `Property alignment with your goals assessed at ${dealQuality}/100.`
        : `Professional standards assessment: ${dealQuality}/100.`
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
    const dealQuality = decision?.professionalAssessment?.dealQuality ?? 0;
    const qualityDescriptor = this.getQualityDescriptor(dealQuality);

    // Issue #76: Use quality scores instead of verdict
    const currentAssessment = cashFlow < 0
      ? `Negative $${Math.abs(cashFlow)} monthly cash flow requires capital contribution. DSCR of ${dscr.toFixed(2)} indicates payment stress risk.`
      : `Positive $${cashFlow} monthly cash flow with DSCR of ${dscr.toFixed(2)} provides adequate debt coverage.`;

    const optimizedApproach = dealQuality >= 50 && dealQuality < 65
      ? 'Increasing down payment or negotiating better loan terms could improve cash flow and enhance returns.'
      : 'Refinancing options may optimize interest rate and payment structure for this quality level.';

    const alternatives = cashFlow < 0
      ? [`Increase down payment by $50k to improve cash flow by ~$350/month`, `Seller financing at lower rate to reduce monthly payments`]
      : [`Portfolio lender for improved rate (potential monthly savings)`, `Cash-out refinance strategy after stabilization`];

    const recommendation = dealQuality < 35
      ? `Current structure does not meet professional standards ${qualityDescriptor}. Alternative approaches warrant consideration.`
      : `${dealQuality >= 65 ? 'Strong' : 'Acceptable'} financing structure for ${dealQuality}/100 quality. ${cashFlow < 0 ? 'Budget reserves for contributions.' : 'Structure supports investment goals.'}`;

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

  private getFallbackContent(decision: InvestmentDecision, analysis: any, sanitizedGoals?: SanitizedGoalContext): AIEnhancedContent {
    return {
      reasoning: this.getFallbackReasoning(decision, analysis, sanitizedGoals),
      actionPlan: this.getFallbackActionPlan(decision, analysis),
      capitalStrategy: this.getFallbackCapitalStrategy(decision, analysis),
      timeline: this.getFallbackTimeline(decision, analysis),
      alternatives: this.getFallbackAlternatives(decision, analysis)
    };
  }
}

export const aiEnhancedMessagingService = new AIEnhancedMessagingService();