#!/usr/bin/env node

/**
 * INTELLIGENT PORTFOLIO AI TESTING SYSTEM
 * 
 * Uses real-time AI API calls with professional RE investor personas to validate
 * portfolio AI insights across multiple scenarios and investment strategies.
 * 
 * Features:
 * - Multiple professional RE investor personas (20+ years experience)
 * - Real-time OpenAI API validation of portfolio AI outputs
 * - Comprehensive scenario testing (negative cash flow, high leverage, etc.)
 * - Professional quality scoring and actionability assessment
 * - Automated validation reports with specific improvement recommendations
 * 
 * Usage: OPENAI_API_KEY=your_key node intelligent-portfolio-ai-testing.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:3001',
  openaiApiKey: process.env.OPENAI_API_KEY,
  testOutputDir: './portfolio-ai-test-results',
  reportFile: './portfolio-ai-test-results/portfolio-ai-validation-report.md'
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: CONFIG.openaiApiKey,
});

// Professional RE Investor Personas for AI Validation
const RE_INVESTOR_PERSONAS = {
  EXPERIENCED_CASHFLOW_INVESTOR: {
    name: "Marcus Chen - Cash Flow Specialist",
    profile: `You are Marcus Chen, a 20-year veteran real estate investor with a $20M portfolio focused on cash flow optimization. 
    You own 85+ rental properties across 6 markets and generate $180K+ annual passive income.
    Your expertise: Cash flow analysis, expense optimization, tenant management, market timing.
    You're known for turning negative cash flow properties into profitable investments.
    You think strategically about every dollar spent and earned.`,
    focus: ["cash_flow_accuracy", "expense_optimization", "actionable_advice"]
  },
  
  PORTFOLIO_DIVERSIFICATION_EXPERT: {
    name: "Sarah Rodriguez - Portfolio Strategist", 
    profile: `You are Sarah Rodriguez, a sophisticated real estate investor with 22 years experience managing a $35M diversified portfolio.
    You own SFR, multifamily, commercial, and industrial properties across 12 states.
    Your expertise: Geographic diversification, risk management, portfolio optimization, market analysis.
    You focus on long-term wealth building through strategic asset allocation.
    You think like an institutional investor but with individual investor practicality.`,
    focus: ["diversification_strategy", "risk_assessment", "long_term_planning"]
  },

  TURNAROUND_SPECIALIST: {
    name: "David Kim - Distressed Portfolio Expert",
    profile: `You are David Kim, a real estate turnaround specialist with 18 years experience fixing underperforming portfolios.
    You've helped 200+ investors recover from negative cash flow situations and rebuild profitable portfolios.
    Your expertise: Problem diagnosis, cost reduction, revenue optimization, strategic restructuring.
    You're direct, practical, and focused on immediate actionable solutions.
    You never sugarcoat problems - you identify root causes and provide specific fix strategies.`,
    focus: ["problem_identification", "practical_solutions", "immediate_actions"]
  },

  SCALING_GROWTH_INVESTOR: {
    name: "Jennifer Thompson - Growth Strategy Expert",
    profile: `You are Jennifer Thompson, a growth-focused real estate investor who scaled from 0 to $25M portfolio in 15 years.
    You specialize in strategic acquisition, financing optimization, and rapid but sustainable portfolio growth.
    Your expertise: Market timing, deal evaluation, financing strategies, growth planning.
    You think systematically about scaling and have strong opinions on when to grow vs consolidate.
    You balance aggressive growth with risk management.`,
    focus: ["growth_strategy", "acquisition_planning", "market_timing"]
  }
};

// Test Scenarios - Different Portfolio Conditions
const PORTFOLIO_TEST_SCENARIOS = [
  {
    name: "NEGATIVE_CASH_FLOW_PORTFOLIO",
    description: "Portfolio bleeding money monthly - needs immediate fixes",
    portfolioData: {
      name: "Struggling Cash Flow Portfolio",
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 5000,
        targetTimeline: '5 years',
        riskTolerance: 'MODERATE'
      },
      properties: [
        {
          propertyName: "Houston Rental #1",
          propertyType: "SFR",
          propertyAddress: { city: "Houston", state: "TX", zipCode: "77001" },
          purchasePrice: 450000,
          downPayment: 90000,
          interestRate: 7.5,
          loanTerm: 30,
          propertyTaxRate: 2.2,
          insuranceRate: 0.8,
          propertyManagementRate: 10,
          yearBuilt: 1995,
          monthlyRent: 2400, // Low rent for price - negative cash flow
          squareFootage: 1800,
          maintenanceCost: 400,
          ownershipPercentage: 100
        },
        {
          propertyName: "Austin Rental #2", 
          propertyType: "SFR",
          propertyAddress: { city: "Austin", state: "TX", zipCode: "78701" },
          purchasePrice: 520000,
          downPayment: 104000,
          interestRate: 7.2,
          loanTerm: 30,
          propertyTaxRate: 2.0,
          insuranceRate: 0.7,
          propertyManagementRate: 9,
          yearBuilt: 2000,
          monthlyRent: 2600, // Still negative after expenses
          squareFootage: 2000,
          maintenanceCost: 350,
          ownershipPercentage: 100
        }
      ]
    },
    expectedInsights: {
      healthCheck: {
        shouldIdentify: "negative cash flow as primary risk",
        shouldRecommend: "fixing existing properties before expansion",
        shouldAvoid: "recommending more property acquisitions"
      },
      goalPath: {
        shouldRecommend: "zero new properties until existing are fixed",
        shouldFocus: "expense reduction and revenue optimization",
        shouldProvide: "specific improvement timeline"
      }
    }
  },

  {
    name: "HIGH_LEVERAGE_PORTFOLIO",
    description: "Highly leveraged portfolio with concentration risk",
    portfolioData: {
      name: "High Leverage Portfolio",
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 5000000,
        targetTimeline: '10 years', 
        riskTolerance: 'AGGRESSIVE'
      },
      properties: [
        {
          propertyName: "Dallas Investment #1",
          propertyType: "SFR", 
          propertyAddress: { city: "Dallas", state: "TX", zipCode: "75201" },
          purchasePrice: 400000,
          downPayment: 20000, // 5% down - high leverage
          interestRate: 7.8,
          loanTerm: 30,
          propertyTaxRate: 2.1,
          insuranceRate: 0.6,
          propertyManagementRate: 8,
          yearBuilt: 2010,
          monthlyRent: 3200,
          squareFootage: 2200,
          maintenanceCost: 250,
          ownershipPercentage: 100
        },
        {
          propertyName: "Dallas Investment #2",
          propertyType: "SFR",
          propertyAddress: { city: "Dallas", state: "TX", zipCode: "75202" },
          purchasePrice: 380000,
          downPayment: 19000, // 5% down - high leverage
          interestRate: 7.9,
          loanTerm: 30,
          propertyTaxRate: 2.1,
          insuranceRate: 0.6,
          propertyManagementRate: 8,
          yearBuilt: 2008,
          monthlyRent: 3100,
          squareFootage: 2100,
          maintenanceCost: 280,
          ownershipPercentage: 100
        },
        {
          propertyName: "Dallas Investment #3",
          propertyType: "SFR",
          propertyAddress: { city: "Dallas", state: "TX", zipCode: "75203" },
          purchasePrice: 420000,
          downPayment: 21000, // 5% down - high leverage
          interestRate: 8.0,
          loanTerm: 30,
          propertyTaxRate: 2.1,
          insuranceRate: 0.6,
          propertyManagementRate: 8,
          yearBuilt: 2012,
          monthlyRent: 3300,
          squareFootage: 2300,
          maintenanceCost: 300,
          ownershipPercentage: 100
        }
      ]
    },
    expectedInsights: {
      healthCheck: {
        shouldIdentify: "high leverage and geographic concentration as risks",
        shouldRecommend: "risk reduction strategies",
        shouldWarn: "about market downturn vulnerability"
      },
      peerComparison: {
        shouldShow: "higher than typical leverage ratios",
        shouldCompare: "to more conservative investor strategies"
      }
    }
  },

  {
    name: "STRONG_PERFORMING_PORTFOLIO",
    description: "Well-performing portfolio ready for strategic growth",
    portfolioData: {
      name: "Strong Growth Portfolio",
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 3000000,
        targetTimeline: '8 years',
        riskTolerance: 'MODERATE'
      },
      properties: [
        {
          propertyName: "Charlotte Rental #1",
          propertyType: "SFR",
          propertyAddress: { city: "Charlotte", state: "NC", zipCode: "28201" },
          purchasePrice: 320000,
          downPayment: 64000, // 20% down
          interestRate: 6.5,
          loanTerm: 30,
          propertyTaxRate: 1.1,
          insuranceRate: 0.4,
          propertyManagementRate: 8,
          yearBuilt: 2015,
          monthlyRent: 2800, // Strong rent-to-price ratio
          squareFootage: 2000,
          maintenanceCost: 200,
          ownershipPercentage: 100
        },
        {
          propertyName: "Raleigh Investment",
          propertyType: "SFR", 
          propertyAddress: { city: "Raleigh", state: "NC", zipCode: "27601" },
          purchasePrice: 280000,
          downPayment: 56000, // 20% down
          interestRate: 6.3,
          loanTerm: 30,
          propertyTaxRate: 1.0,
          insuranceRate: 0.4,
          propertyManagementRate: 8,
          yearBuilt: 2018,
          monthlyRent: 2500, // Strong cash flow
          squareFootage: 1900,
          maintenanceCost: 180,
          ownershipPercentage: 100
        },
        {
          propertyName: "Atlanta Growth Property",
          propertyType: "SFR",
          propertyAddress: { city: "Atlanta", state: "GA", zipCode: "30301" },
          purchasePrice: 350000,
          downPayment: 70000, // 20% down
          interestRate: 6.8,
          loanTerm: 30,
          propertyTaxRate: 1.3,
          insuranceRate: 0.5,
          propertyManagementRate: 8,
          yearBuilt: 2020,
          monthlyRent: 3000, // Excellent cash flow
          squareFootage: 2100,
          maintenanceCost: 220,
          ownershipPercentage: 100
        }
      ]
    },
    expectedInsights: {
      healthCheck: {
        shouldIdentify: "portfolio strengths and optimization opportunities",
        shouldRecommend: "strategic growth or diversification",
        shouldRecognize: "strong foundation for expansion"
      },
      goalPath: {
        shouldProvide: "realistic acquisition timeline",
        shouldRecommend: "specific property types and markets",
        shouldCalculate: "accurate capital requirements"
      }
    }
  }
];

// Validation criteria for AI insights
const AI_VALIDATION_CRITERIA = {
  HEALTH_CHECK: {
    data_accuracy: "Does the AI use actual portfolio metrics (not generic placeholders)?",
    problem_identification: "Does it correctly identify the biggest portfolio risk?",
    actionable_advice: "Are the recommendations specific and immediately actionable?", 
    timeline_realism: "Are the suggested timelines realistic for the portfolio condition?",
    risk_prioritization: "Does it focus on the most critical issues first?"
  },
  
  PEER_COMPARISON: {
    benchmark_accuracy: "Are the peer benchmarks realistic for this portfolio size/type?",
    strength_identification: "Does it accurately identify genuine portfolio advantages?",
    gap_analysis: "Are the performance gaps correctly calculated and explained?",
    contextual_relevance: "Is the comparison relevant to the investor's situation?",
    improvement_focus: "Does it highlight the most impactful areas for improvement?"
  },
  
  GOAL_PATH: {
    goal_alignment: "Do the recommendations align with the stated portfolio goals?",
    financial_realism: "Are the capital requirements and projections realistic?",
    market_strategy: "Is the recommended market/property strategy sound?",
    timeline_accuracy: "Is the suggested timeline achievable given current portfolio state?",
    risk_consideration: "Does it account for the investor's risk tolerance appropriately?"
  }
};

/**
 * Main testing function
 */
async function runPortfolioAIValidation() {
  console.log('\n🤖 INTELLIGENT PORTFOLIO AI VALIDATION SYSTEM');
  console.log('===============================================\n');
  
  // Validate OpenAI API key
  if (!CONFIG.openaiApiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    console.error('Usage: OPENAI_API_KEY=your_key node intelligent-portfolio-ai-testing.js');
    process.exit(1);
  }
  
  // Create output directory
  if (!fs.existsSync(CONFIG.testOutputDir)) {
    fs.mkdirSync(CONFIG.testOutputDir, { recursive: true });
  }
  
  const results = [];
  
  try {
    // Authenticate with backend
    const authToken = await authenticateWithBackend();
    
    // Test each portfolio scenario
    for (const scenario of PORTFOLIO_TEST_SCENARIOS) {
      console.log(`\n📊 TESTING SCENARIO: ${scenario.name}`);
      console.log(`Description: ${scenario.description}`);
      console.log('=' + '='.repeat(50));
      
      const scenarioResults = await testPortfolioScenario(scenario, authToken);
      results.push({
        scenario: scenario.name,
        description: scenario.description,
        ...scenarioResults
      });
    }
    
    // Generate comprehensive report
    await generateValidationReport(results);
    
    console.log('\n🎉 PORTFOLIO AI VALIDATION COMPLETED SUCCESSFULLY!');
    console.log('===================================================');
    console.log(`📝 Detailed report saved to: ${CONFIG.reportFile}`);
    console.log(`📊 Individual test results in: ${CONFIG.testOutputDir}/`);
    
  } catch (error) {
    console.error('\n❌ PORTFOLIO AI VALIDATION FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Authenticate with backend
 */
async function authenticateWithBackend() {
  console.log('🔐 Authenticating with backend...');
  
  const response = await axios.post(`${CONFIG.backendUrl}/api/auth/login`, {
    email: 'admin@realestateanalyzer.com',
    password: 'Spring@2025'
  });
  
  console.log('✅ Authentication successful');
  return response.data.accessToken;
}

/**
 * Test a specific portfolio scenario
 */
async function testPortfolioScenario(scenario, authToken) {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    // 1. Create test portfolio
    console.log(`\n🏗️  Creating test portfolio: ${scenario.portfolioData.name}`);
    const portfolioResponse = await axios.post(`${CONFIG.backendUrl}/api/portfolios`, scenario.portfolioData, { headers });
    const portfolioId = portfolioResponse.data.portfolio?.id;
    console.log(`✅ Portfolio created: ${portfolioId}`);
    
    // 2. Add properties to portfolio
    console.log('📋 Adding properties to portfolio...');
    for (const propertyData of scenario.portfolioData.properties) {
      await axios.post(`${CONFIG.backendUrl}/api/deals`, {
        ...propertyData,
        portfolioId: portfolioId,
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2.5,
          vacancyRate: 5
        }
      }, { headers });
      console.log(`  ✅ Added: ${propertyData.propertyName}`);
    }
    
    // 3. Calculate analytics
    console.log('🧮 Calculating portfolio analytics...');
    await axios.post(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}/recalculate-analytics`, {}, { headers });
    console.log('✅ Analytics calculated');
    
    // 4. Get AI insights
    console.log('\n🤖 Generating AI insights...');
    const aiInsights = await getPortfolioAIInsights(portfolioId, headers);
    
    // 5. Validate AI insights with professional personas
    console.log('\n🎓 Validating with professional RE investor personas...');
    const validationResults = await validateAIInsightsWithPersonas(scenario, aiInsights);
    
    // 6. Clean up - archive test portfolio  
    await axios.put(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}`, {
      status: 'ARCHIVED'
    }, { headers });
    
    return {
      portfolioId,
      aiInsights,
      validationResults,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Scenario ${scenario.name} failed:`, error.response?.data || error.message);
    return {
      error: error.message,
      success: false
    };
  }
}

/**
 * Get all AI insights for a portfolio
 */
async function getPortfolioAIInsights(portfolioId, headers) {
  console.log('  📊 Fetching Health Check...');
  const healthCheckResponse = await axios.get(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}/health-check`, { headers });
  
  console.log('  👥 Fetching Peer Comparison...');
  const peerResponse = await axios.get(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}/peer-comparison`, { headers });
  
  console.log('  🎯 Fetching Goal Achievement Path...');
  const goalPathResponse = await axios.get(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}/goal-path`, { headers });
  
  return {
    healthCheck: healthCheckResponse.data.healthCheck,
    peerComparison: peerResponse.data.peerComparison,
    goalPath: goalPathResponse.data.goalPath
  };
}

/**
 * Validate AI insights using professional RE investor personas
 */
async function validateAIInsightsWithPersonas(scenario, aiInsights) {
  const validationResults = {};
  
  // Test each persona against the AI insights
  for (const [personaKey, persona] of Object.entries(RE_INVESTOR_PERSONAS)) {
    console.log(`\n  🎭 Validating with: ${persona.name}`);
    
    try {
      const validation = await validateWithPersona(persona, scenario, aiInsights);
      validationResults[personaKey] = validation;
      
      console.log(`    ✅ Overall Score: ${validation.overallScore}/10`);
      console.log(`    📝 Key Issues: ${validation.keyIssues?.length || 0}`);
      
    } catch (error) {
      console.error(`    ❌ Validation failed: ${error.message}`);
      validationResults[personaKey] = {
        error: error.message,
        success: false
      };
    }
  }
  
  return validationResults;
}

/**
 * Validate AI insights with a specific professional persona
 */
async function validateWithPersona(persona, scenario, aiInsights) {
  const prompt = `${persona.profile}

SCENARIO: ${scenario.description}

You are reviewing AI-generated portfolio insights for this investor's portfolio. Please evaluate the quality, accuracy, and actionability of these AI recommendations:

HEALTH CHECK INSIGHTS:
${JSON.stringify(aiInsights.healthCheck, null, 2)}

PEER COMPARISON:
${JSON.stringify(aiInsights.peerComparison, null, 2)}

GOAL ACHIEVEMENT PATH:
${JSON.stringify(aiInsights.goalPath, null, 2)}

As a ${persona.name}, please provide a professional evaluation:

1. **ACCURACY SCORE (1-10)**: How accurate are these insights based on your experience?
2. **ACTIONABILITY SCORE (1-10)**: How actionable and specific are the recommendations?
3. **RELEVANCE SCORE (1-10)**: How relevant are these insights to this portfolio situation?

4. **KEY STRENGTHS**: What does the AI get right? (List 2-3 specific strengths)
5. **CRITICAL ISSUES**: What are the biggest problems with these insights? (List 2-3 critical issues)
6. **MISSING INSIGHTS**: What important insights is the AI missing for this portfolio?
7. **IMPROVEMENT RECOMMENDATIONS**: How can these AI insights be improved?

8. **OVERALL PROFESSIONAL ASSESSMENT**: Would you trust these insights to guide a real investment decision? Why or why not?

Provide your response in this JSON format:
{
  "accuracyScore": <1-10>,
  "actionabilityScore": <1-10>, 
  "relevanceScore": <1-10>,
  "overallScore": <average of above scores>,
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "criticalIssues": ["issue1", "issue2", "issue3"],
  "missingInsights": ["missing1", "missing2"],
  "improvementRecommendations": ["improvement1", "improvement2"],
  "professionalAssessment": "detailed assessment text",
  "trustScore": <1-10>,
  "wouldUseInRealInvestment": <true/false>
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.3
  });
  
  const aiResponse = response.choices[0].message.content;
  
  // Try to parse JSON response
  try {
    const jsonStart = aiResponse.indexOf('{');
    const jsonEnd = aiResponse.lastIndexOf('}') + 1;
    const jsonStr = aiResponse.substring(jsonStart, jsonEnd);
    const validation = JSON.parse(jsonStr);
    
    return {
      ...validation,
      persona: persona.name,
      success: true,
      rawResponse: aiResponse
    };
  } catch (parseError) {
    // If JSON parsing fails, return raw response
    return {
      persona: persona.name,
      success: false,
      error: 'Failed to parse AI validation response',
      rawResponse: aiResponse
    };
  }
}

/**
 * Generate comprehensive validation report
 */
async function generateValidationReport(results) {
  console.log('\n📝 Generating validation report...');
  
  let report = `# Portfolio AI Validation Report\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Executive Summary\n\n`;
  
  const totalScenarios = results.length;
  const successfulScenarios = results.filter(r => r.success).length;
  const failedScenarios = totalScenarios - successfulScenarios;
  
  report += `- **Total Scenarios Tested**: ${totalScenarios}\n`;
  report += `- **Successful Tests**: ${successfulScenarios}\n`;
  report += `- **Failed Tests**: ${failedScenarios}\n\n`;
  
  if (successfulScenarios > 0) {
    // Calculate average scores across all validations
    let totalScores = { accuracy: 0, actionability: 0, relevance: 0, overall: 0, trust: 0 };
    let scoreCount = 0;
    
    for (const result of results.filter(r => r.success)) {
      for (const [personaKey, validation] of Object.entries(result.validationResults)) {
        if (validation.success && validation.accuracyScore) {
          totalScores.accuracy += validation.accuracyScore;
          totalScores.actionability += validation.actionabilityScore;
          totalScores.relevance += validation.relevanceScore;
          totalScores.overall += validation.overallScore;
          totalScores.trust += validation.trustScore;
          scoreCount++;
        }
      }
    }
    
    if (scoreCount > 0) {
      report += `## Average Validation Scores\n\n`;
      report += `- **Accuracy**: ${(totalScores.accuracy / scoreCount).toFixed(1)}/10\n`;
      report += `- **Actionability**: ${(totalScores.actionability / scoreCount).toFixed(1)}/10\n`;
      report += `- **Relevance**: ${(totalScores.relevance / scoreCount).toFixed(1)}/10\n`;
      report += `- **Overall Quality**: ${(totalScores.overall / scoreCount).toFixed(1)}/10\n`;
      report += `- **Professional Trust**: ${(totalScores.trust / scoreCount).toFixed(1)}/10\n\n`;
    }
  }
  
  // Detail each scenario
  for (const result of results) {
    report += `## Scenario: ${result.scenario}\n`;
    report += `**Description**: ${result.description}\n\n`;
    
    if (!result.success) {
      report += `❌ **FAILED**: ${result.error}\n\n`;
      continue;
    }
    
    report += `✅ **SUCCESS**: Portfolio created and AI insights generated\n\n`;
    
    // Professional persona validations
    report += `### Professional Validations\n\n`;
    for (const [personaKey, validation] of Object.entries(result.validationResults)) {
      if (!validation.success) {
        report += `❌ **${validation.persona}**: Validation failed - ${validation.error}\n`;
        continue;
      }
      
      report += `#### ${validation.persona}\n`;
      report += `- **Overall Score**: ${validation.overallScore}/10\n`;
      report += `- **Would Use in Real Investment**: ${validation.wouldUseInRealInvestment ? '✅ Yes' : '❌ No'}\n\n`;
      
      if (validation.keyStrengths?.length > 0) {
        report += `**Key Strengths:**\n`;
        validation.keyStrengths.forEach(strength => report += `- ${strength}\n`);
        report += `\n`;
      }
      
      if (validation.criticalIssues?.length > 0) {
        report += `**Critical Issues:**\n`;
        validation.criticalIssues.forEach(issue => report += `- ${issue}\n`);
        report += `\n`;
      }
      
      if (validation.professionalAssessment) {
        report += `**Professional Assessment:**\n${validation.professionalAssessment}\n\n`;
      }
      
      report += `---\n\n`;
    }
  }
  
  // Write report to file
  fs.writeFileSync(CONFIG.reportFile, report);
  console.log(`✅ Report written to: ${CONFIG.reportFile}`);
}

// Run the validation system
if (require.main === module) {
  runPortfolioAIValidation().catch(console.error);
}

module.exports = {
  runPortfolioAIValidation,
  RE_INVESTOR_PERSONAS,
  PORTFOLIO_TEST_SCENARIOS,
  AI_VALIDATION_CRITERIA
};