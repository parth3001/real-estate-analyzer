/**
 * AI Expert Validation Task for Cypress
 *
 * Validates financial calculations using multiple AI expert personas
 * to cross-check backend calculations and flag potential discrepancies.
 *
 * Expert Personas:
 * 1. Real Estate Financial Analyst (20 years experience)
 * 2. Commercial Real Estate Appraiser (15 years experience)
 * 3. Investment Property CPA (25 years experience)
 * 4. Institutional Real Estate Investor (Portfolio Manager)
 */

const axios = require('axios');

class AIExpertValidator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.experts = {
      analyst: {
        name: "Senior Real Estate Financial Analyst",
        experience: "20 years analyzing investment properties",
        specialty: "Cash flow analysis, cap rates, investment returns"
      },
      appraiser: {
        name: "Certified Commercial Real Estate Appraiser",
        experience: "15 years in property valuation",
        specialty: "Market comparables, property valuations, risk assessment"
      },
      cpa: {
        name: "Investment Property CPA",
        experience: "25 years in real estate taxation and finance",
        specialty: "Tax implications, depreciation, long-term projections"
      },
      investor: {
        name: "Institutional Portfolio Manager",
        experience: "Managing $500M+ real estate portfolio",
        specialty: "Investment strategy, portfolio optimization, risk management"
      }
    };
  }

  async validateCalculations(propertyData, calculatedMetrics) {
    const validations = await Promise.all([
      this.validateWithAnalyst(propertyData, calculatedMetrics),
      this.validateWithAppraiser(propertyData, calculatedMetrics),
      this.validateWithCPA(propertyData, calculatedMetrics),
      this.validateWithInvestor(propertyData, calculatedMetrics)
    ]);

    return this.analyzeConsensus(validations, calculatedMetrics);
  }

  async validateWithAnalyst(propertyData, metrics) {
    const prompt = `
ROLE: You are a Senior Real Estate Financial Analyst with 20 years of experience analyzing investment properties.

PROPERTY DATA:
- Address: ${propertyData.address}
- Purchase Price: $${propertyData.purchasePrice?.toLocaleString()}
- Monthly Rent: $${propertyData.monthlyRent?.toLocaleString()}
- Down Payment: ${propertyData.downPaymentPercent || 25}%
- Interest Rate: ${propertyData.interestRate || 5.75}%
- Property Tax Rate: ${propertyData.propertyTaxRate || 1.8}%
- Insurance Rate: ${propertyData.insuranceRate || 0.7}%

CALCULATED METRICS TO VALIDATE:
- Monthly Cash Flow: $${metrics.monthlyCashFlow}
- Cap Rate: ${metrics.capRate}%
- Cash-on-Cash Return: ${metrics.cashOnCashReturn}%
- 10-Year IRR: ${metrics.irr}%
- Investment Verdict: ${metrics.verdict}

TASK: Validate these calculations using industry-standard formulas:

1. Calculate expected monthly cash flow:
   - Monthly rent: $${propertyData.monthlyRent}
   - Less vacancy (assume 5-10%): $___
   - Less operating expenses (property tax, insurance, maintenance, management): $___
   - Less mortgage payment: $___
   - Expected monthly cash flow: $___

2. Calculate expected cap rate:
   - Formula: (Net Operating Income ÷ Purchase Price) × 100
   - Expected cap rate: ___%

3. Calculate expected cash-on-cash return:
   - Formula: (Annual Cash Flow ÷ Total Cash Invested) × 100
   - Expected cash-on-cash return: ___%

4. Investment verdict assessment:
   - Based on calculated metrics, would you recommend BUY, NEGOTIATE, CAUTION, or PASS?
   - Reasoning: ___

RESPOND IN JSON FORMAT:
{
  "expertValidation": {
    "monthlyCashFlow": { "calculated": XXX, "matches": true/false, "variance": X% },
    "capRate": { "calculated": XXX, "matches": true/false, "variance": X% },
    "cashOnCashReturn": { "calculated": XXX, "matches": true/false, "variance": X% },
    "verdict": { "recommendation": "BUY/NEGOTIATE/CAUTION/PASS", "matches": true/false },
    "overallAssessment": "ACCURATE/QUESTIONABLE/INCORRECT",
    "confidence": 0.XX,
    "notes": "Key observations or concerns"
  }
}`;

    return await this.callOpenAI(prompt, 'analyst');
  }

  async validateWithAppraiser(propertyData, metrics) {
    const prompt = `
ROLE: You are a Certified Commercial Real Estate Appraiser with 15 years of experience in property valuation.

PROPERTY DETAILS:
- Location: ${propertyData.address}
- Purchase Price: $${propertyData.purchasePrice?.toLocaleString()}
- Monthly Rent: $${propertyData.monthlyRent?.toLocaleString()}
- Square Footage: ${propertyData.squareFootage || 'Not provided'}
- Bedrooms: ${propertyData.bedrooms || 'Not provided'}
- Year Built: ${propertyData.yearBuilt || 'Not provided'}

CALCULATED METRICS TO VALIDATE:
- Cap Rate: ${metrics.capRate}%
- Gross Rent Multiplier: ${metrics.grossRentMultiplier || 'Not provided'}
- Price per Bedroom: $${metrics.pricePerBedroom || 'Not provided'}
- 1% Rule Value: ${metrics.onePercentRule || 'Not provided'}%

APPRAISAL ANALYSIS:

1. Market Value Assessment:
   - Is $${propertyData.purchasePrice?.toLocaleString()} reasonable for Anna, TX market?
   - Typical price per sqft for this area: $___
   - Market assessment: BELOW/AT/ABOVE market value

2. Rent Analysis:
   - Is $${propertyData.monthlyRent} realistic for this property?
   - Typical rent per sqft for Anna, TX: $___
   - Rent assessment: BELOW/AT/ABOVE market rate

3. Key Ratios Validation:
   - Expected cap rate for Anna, TX market: ___%
   - Expected gross rent multiplier: ___
   - 1% rule compliance (rent should be ≥1% of price): ___

4. Investment Grade Assessment:
   - Property quality: A/B/C class
   - Market strength: Strong/Moderate/Weak
   - Investment recommendation: ___

RESPOND IN JSON FORMAT:
{
  "appraisalValidation": {
    "marketValue": { "assessment": "BELOW/AT/ABOVE", "confidence": 0.XX },
    "rentAnalysis": { "assessment": "BELOW/AT/ABOVE", "confidence": 0.XX },
    "capRateValidation": { "expected": XXX, "calculated": ${metrics.capRate}, "reasonable": true/false },
    "overallProperty": "EXCELLENT/GOOD/FAIR/POOR",
    "riskFactors": ["factor1", "factor2"],
    "confidence": 0.XX,
    "notes": "Appraiser observations"
  }
}`;

    return await this.callOpenAI(prompt, 'appraiser');
  }

  async validateWithCPA(propertyData, metrics) {
    const prompt = `
ROLE: You are an Investment Property CPA with 25 years of experience in real estate taxation and financial analysis.

PROPERTY FINANCIAL STRUCTURE:
- Purchase Price: $${propertyData.purchasePrice?.toLocaleString()}
- Down Payment: ${propertyData.downPaymentPercent || 25}% ($${(propertyData.purchasePrice * 0.25)?.toLocaleString()})
- Loan Amount: $${(propertyData.purchasePrice * 0.75)?.toLocaleString()}
- Interest Rate: ${propertyData.interestRate || 5.75}%
- Monthly Rent: $${propertyData.monthlyRent?.toLocaleString()}

CALCULATED METRICS TO VALIDATE:
- Monthly Cash Flow: $${metrics.monthlyCashFlow}
- Cash-on-Cash Return: ${metrics.cashOnCashReturn}%
- 10-Year IRR: ${metrics.irr}%
- DSCR: ${metrics.dscr || 'Not provided'}

TAX & FINANCIAL ANALYSIS:

1. Cash Flow Validation:
   - Monthly mortgage payment (P&I): $___
   - Monthly operating expenses estimate: $___
   - Expected monthly cash flow: $___
   - Variance from calculated: ___%

2. Tax Considerations:
   - Annual depreciation deduction: $___
   - Tax-adjusted cash flow impact: ___
   - After-tax cash-on-cash return: ___%

3. Long-term Return Analysis:
   - Is ${metrics.irr}% IRR realistic for this market?
   - Expected IRR range for similar properties: ___% to ___%
   - Assessment: CONSERVATIVE/REALISTIC/OPTIMISTIC

4. Financial Risk Assessment:
   - DSCR adequacy (should be >1.25): ___
   - Cash flow stability: HIGH/MEDIUM/LOW
   - Financial recommendation: ___

RESPOND IN JSON FORMAT:
{
  "cpaValidation": {
    "cashFlowCheck": { "calculated": XXX, "expected": XXX, "variance": X%, "acceptable": true/false },
    "irrAssessment": { "calculated": ${metrics.irr}, "expectedRange": "X%-Y%", "realistic": true/false },
    "taxImplications": { "benefit": "SIGNIFICANT/MODERATE/MINIMAL" },
    "financialRisk": "LOW/MEDIUM/HIGH",
    "confidence": 0.XX,
    "recommendations": "CPA insights and recommendations"
  }
}`;

    return await this.callOpenAI(prompt, 'cpa');
  }

  async validateWithInvestor(propertyData, metrics) {
    const prompt = `
ROLE: You are an Institutional Portfolio Manager managing $500M+ in real estate investments.

INVESTMENT OPPORTUNITY:
- Property: ${propertyData.address}
- Investment: $${propertyData.purchasePrice?.toLocaleString()}
- Strategy: Buy & Hold Rental
- Market: Anna, TX (Dallas-Fort Worth Metroplex)

CALCULATED PERFORMANCE METRICS:
- Monthly Cash Flow: $${metrics.monthlyCashFlow}
- Cap Rate: ${metrics.capRate}%
- Cash-on-Cash Return: ${metrics.cashOnCashReturn}%
- Investment Verdict: ${metrics.verdict}

INSTITUTIONAL INVESTMENT ANALYSIS:

1. Market Assessment:
   - Anna, TX market outlook: STRONG/MODERATE/WEAK
   - Population growth trends: ___
   - Job market stability: ___
   - Investment grade: A/B/C/D

2. Return Benchmarking:
   - Institutional cap rate requirements: ___%
   - Minimum cash-on-cash return: ___%
   - Risk-adjusted return assessment: ___

3. Portfolio Fit Analysis:
   - Property class: A/B/C
   - Geographic diversification value: HIGH/MEDIUM/LOW
   - Scale considerations: INSTITUTIONAL/INDIVIDUAL investor appropriate

4. Investment Decision:
   - Investment committee recommendation: APPROVE/CONDITIONAL/REJECT
   - Required improvements/negotiations: ___
   - Risk mitigation strategies: ___

RESPOND IN JSON FORMAT:
{
  "institutionalValidation": {
    "marketOutlook": "STRONG/MODERATE/WEAK",
    "returnBenchmark": { "meetsInstitutionalStandards": true/false, "reasoning": "..." },
    "riskAssessment": "LOW/MEDIUM/HIGH",
    "investmentDecision": "APPROVE/CONDITIONAL/REJECT",
    "verdictAlignment": { "agrees": true/false, "institutionalVerdict": "BUY/NEGOTIATE/CAUTION/PASS" },
    "confidence": 0.XX,
    "strategicNotes": "Portfolio manager insights"
  }
}`;

    return await this.callOpenAI(prompt, 'investor');
  }

  async callOpenAI(prompt, expertType) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a highly experienced real estate professional. Provide accurate, detailed financial analysis. Always respond in valid JSON format.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1 // Low temperature for consistent, analytical responses
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;

      try {
        return {
          expert: expertType,
          result: JSON.parse(content),
          success: true
        };
      } catch (parseError) {
        return {
          expert: expertType,
          result: { error: 'Failed to parse JSON response', rawContent: content },
          success: false
        };
      }
    } catch (error) {
      return {
        expert: expertType,
        result: { error: error.message },
        success: false
      };
    }
  }

  analyzeConsensus(validations, originalMetrics) {
    const consensus = {
      validations: validations,
      discrepancies: [],
      overallConfidence: 0,
      recommendation: 'REVIEW_REQUIRED',
      summary: {}
    };

    // Analyze each metric across all experts
    const metrics = ['monthlyCashFlow', 'capRate', 'cashOnCashReturn', 'irr'];

    metrics.forEach(metric => {
      const expertOpinions = validations
        .filter(v => v.success && v.result)
        .map(v => this.extractMetricOpinion(v, metric))
        .filter(opinion => opinion !== null);

      if (expertOpinions.length > 0) {
        const agreement = this.calculateAgreement(expertOpinions);
        consensus.summary[metric] = {
          expertCount: expertOpinions.length,
          agreement: agreement,
          averageVariance: this.calculateAverageVariance(expertOpinions),
          flagged: agreement < 0.75 // Flag if less than 75% agreement
        };

        if (agreement < 0.75) {
          consensus.discrepancies.push({
            metric: metric,
            originalValue: originalMetrics[metric],
            expertOpinions: expertOpinions,
            agreement: agreement,
            severity: agreement < 0.5 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    });

    // Calculate overall confidence
    const confidenceScores = validations
      .filter(v => v.success && v.result)
      .map(v => this.extractConfidence(v))
      .filter(c => c !== null);

    if (confidenceScores.length > 0) {
      consensus.overallConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
    }

    // Determine overall recommendation
    if (consensus.discrepancies.length === 0 && consensus.overallConfidence > 0.8) {
      consensus.recommendation = 'CALCULATIONS_VALIDATED';
    } else if (consensus.discrepancies.filter(d => d.severity === 'HIGH').length > 0) {
      consensus.recommendation = 'MAJOR_DISCREPANCIES_FOUND';
    } else if (consensus.discrepancies.length > 0) {
      consensus.recommendation = 'MINOR_DISCREPANCIES_FOUND';
    }

    return consensus;
  }

  extractMetricOpinion(validation, metric) {
    try {
      const result = validation.result;

      // Try different possible paths for the metric
      const paths = [
        `expertValidation.${metric}`,
        `appraisalValidation.${metric}Validation`,
        `cpaValidation.${metric}Check`,
        `institutionalValidation.returnBenchmark`
      ];

      for (const path of paths) {
        const value = this.getNestedValue(result, path);
        if (value) {
          return {
            expert: validation.expert,
            matches: value.matches || value.reasonable || value.acceptable,
            variance: value.variance || 0,
            confidence: value.confidence || 0.5
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  extractConfidence(validation) {
    try {
      const result = validation.result;
      return result.confidence ||
             result.expertValidation?.confidence ||
             result.appraisalValidation?.confidence ||
             result.cpaValidation?.confidence ||
             result.institutionalValidation?.confidence ||
             null;
    } catch (error) {
      return null;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  calculateAgreement(opinions) {
    if (opinions.length === 0) return 0;
    const agreements = opinions.filter(op => op.matches === true).length;
    return agreements / opinions.length;
  }

  calculateAverageVariance(opinions) {
    if (opinions.length === 0) return 0;
    const variances = opinions.map(op => Math.abs(op.variance || 0));
    return variances.reduce((sum, v) => sum + v, 0) / variances.length;
  }
}

// Cypress task
module.exports = (on, config) => {
  const validator = new AIExpertValidator();

  on('task', {
    async validateWithAIExperts(data) {
      console.log('🤖 Running AI Expert Validation...');
      const result = await validator.validateCalculations(data.propertyData, data.calculatedMetrics);
      console.log('✅ AI Expert Validation Complete');
      return result;
    }
  });
};