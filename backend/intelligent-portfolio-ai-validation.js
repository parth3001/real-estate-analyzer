#!/usr/bin/env node

/**
 * INTELLIGENT PORTFOLIO AI VALIDATION SYSTEM
 * 
 * Uses fixed portfolio scenarios to test AI-enhanced portfolio insights 
 * and validates each result through Claude AI as a professional RE investor.
 * 
 * Features:
 * - Portfolio health check AI validation
 * - Peer comparison intelligence validation  
 * - Goal achievement path AI validation
 * - AI-powered validation of insight accuracy
 * - Professional real estate investor perspective
 * - Automated report generation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:3001',
  openaiApiKey: process.env.OPENAI_API_KEY,
  testOutputDir: './test-results',
  reportFile: './test-results/portfolio-ai-validation-report.md'
};

// Test user credentials (admin user that works)
const TEST_USER = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025'
};

// Fixed portfolio test scenarios designed to trigger different AI insights
const PORTFOLIO_SCENARIOS = [
  {
    name: 'NEGATIVE_CASH_FLOW_SCENARIO',
    description: 'Portfolio with negative cash flow should trigger cash flow concerns',
    portfolioConfig: {
      name: 'Struggling Cash Flow Portfolio',
      description: 'Portfolio with negative monthly cash flow',
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 5000,
        targetTimeline: '5 years',
        riskTolerance: 'CONSERVATIVE'
      }
    },
    properties: [
      {
        propertyName: "High Cost Austin Property",
        propertyType: "SFR",
        propertyAddress: { street: "123 Expensive St", city: "Austin", state: "TX", zipCode: "78701" },
        purchasePrice: 650000,
        downPayment: 130000,
        interestRate: 7.5,
        loanTerm: 30,
        propertyTaxRate: 2.1,
        insuranceRate: 0.8,
        propertyManagementRate: 10,
        yearBuilt: 2020,
        monthlyRent: 3200, // Negative cash flow scenario
        squareFootage: 2200,
        bedrooms: 3,
        bathrooms: 2,
        maintenanceCost: 400,
        ownershipPercentage: 100
      }
    ],
    expectedInsights: {
      healthCheck: {
        shouldIdentify: ['cash flow', 'negative', 'expenses'],
        biggestRisk: 'cash flow'
      }
    }
  },
  {
    name: 'HIGH_LEVERAGE_CONCENTRATION_SCENARIO',
    description: 'High leverage portfolio concentrated in one market',
    portfolioConfig: {
      name: 'High Leverage Concentration Portfolio',
      description: 'Aggressive leverage concentrated in Dallas market',
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 2000000,
        targetTimeline: '5 years', 
        riskTolerance: 'AGGRESSIVE'
      }
    },
    properties: [
      {
        propertyName: "Dallas Property 1",
        propertyType: "SFR",
        propertyAddress: { street: "123 Dallas St", city: "Dallas", state: "TX", zipCode: "75201" },
        purchasePrice: 400000,
        downPayment: 20000, // Only 5% down - high leverage
        interestRate: 7.0,
        loanTerm: 30,
        propertyTaxRate: 2.2,
        insuranceRate: 0.6,
        propertyManagementRate: 8,
        yearBuilt: 2015,
        monthlyRent: 3200,
        squareFootage: 1900,
        bedrooms: 3,
        bathrooms: 2,
        maintenanceCost: 250,
        ownershipPercentage: 100
      },
      {
        propertyName: "Dallas Property 2", 
        propertyType: "SFR",
        propertyAddress: { street: "456 Dallas Ave", city: "Dallas", state: "TX", zipCode: "75202" },
        purchasePrice: 450000,
        downPayment: 22500, // Only 5% down - high leverage
        interestRate: 7.2,
        loanTerm: 30,
        propertyTaxRate: 2.2,
        insuranceRate: 0.6,
        propertyManagementRate: 8,
        yearBuilt: 2018,
        monthlyRent: 3500,
        squareFootage: 2100,
        bedrooms: 4,
        bathrooms: 3,
        maintenanceCost: 280,
        ownershipPercentage: 100
      }
    ],
    expectedInsights: {
      healthCheck: {
        shouldIdentify: ['leverage', 'concentration', 'geographic'],
        biggestRisk: 'concentration'
      },
      peerComparison: {
        shouldIdentify: ['leverage ratio', 'diversification']
      }
    }
  },
  {
    name: 'STRONG_PERFORMER_SCENARIO',
    description: 'Well-diversified portfolio performing above benchmarks',
    portfolioConfig: {
      name: 'Strong Performer Portfolio',
      description: 'Diversified portfolio with strong metrics',
      goals: {
        primaryGoal: 'DIVERSIFICATION',
        targetMonthlyIncome: 6000,
        targetTimeline: '10-15 years',
        riskTolerance: 'MODERATE'
      }
    },
    properties: [
      {
        propertyName: "Nashville Cash Cow",
        propertyType: "SFR", 
        propertyAddress: { street: "123 Music Row", city: "Nashville", state: "TN", zipCode: "37203" },
        purchasePrice: 320000,
        downPayment: 64000, // 20% down
        interestRate: 6.5,
        loanTerm: 30,
        propertyTaxRate: 1.2,
        insuranceRate: 0.4,
        propertyManagementRate: 8,
        yearBuilt: 2010,
        monthlyRent: 2800, // Strong cash flow
        squareFootage: 1800,
        bedrooms: 3,
        bathrooms: 2,
        maintenanceCost: 180,
        ownershipPercentage: 100
      },
      {
        propertyName: "Atlanta Growth Property",
        propertyType: "SFR",
        propertyAddress: { street: "456 Peach St", city: "Atlanta", state: "GA", zipCode: "30309" },
        purchasePrice: 380000,
        downPayment: 76000, // 20% down
        interestRate: 6.8,
        loanTerm: 30,
        propertyTaxRate: 1.1,
        insuranceRate: 0.5,
        propertyManagementRate: 8,
        yearBuilt: 2015,
        monthlyRent: 3200,
        squareFootage: 2000,
        bedrooms: 4,
        bathrooms: 3,
        maintenanceCost: 200,
        ownershipPercentage: 100
      }
    ],
    expectedInsights: {
      healthCheck: {
        shouldIdentify: ['strong performance', 'diversification', 'cash flow'],
        bestOpportunity: 'expansion'
      },
      peerComparison: {
        shouldIdentify: ['outperforming', 'above average']
      },
      goalPath: {
        shouldIdentify: ['on track', 'growth potential']
      }
    }
  }
];

class IntelligentPortfolioAITester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  /**
   * Authenticate with backend
   */
  async authenticate() {
    try {
      const response = await axios.post(`${CONFIG.backendUrl}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });

      this.authToken = response.data.accessToken;
      console.log('✅ Authentication successful');
      return this.authToken;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create test portfolio with properties - using exact pattern from test-phase4-ai.js
   */
  async createTestPortfolio(scenario) {
    try {
      const headers = { Authorization: `Bearer ${this.authToken}` };

      // Create portfolio using exact same structure as working test
      console.log(`📁 Creating portfolio: ${scenario.portfolioConfig.name}...`);
      const portfolioResponse = await axios.post(`${CONFIG.backendUrl}/api/portfolios`, 
        scenario.portfolioConfig,
        { headers }
      );

      const portfolioId = portfolioResponse.data.portfolio?.id;
      console.log(`✅ Portfolio created: ${portfolioId}`);

      // Add properties to portfolio using exact same structure as working test
      for (const propertyData of scenario.properties) {
        const propertyWithPortfolio = {
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
        };

        await axios.post(`${CONFIG.backendUrl}/api/deals`, propertyWithPortfolio, { headers });
        console.log(`🏠 Added property: ${propertyData.propertyName}`);
      }

      // Trigger analytics calculation
      console.log('🧪 Calculating portfolio analytics...');
      await axios.post(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}/recalculate-analytics`, {}, { headers });
      console.log('✅ Analytics calculated');

      return portfolioId;

    } catch (error) {
      console.error('Backend API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive portfolio AI insights
   */
  async getPortfolioAIInsights(portfolioId) {
    try {
      const headers = { Authorization: `Bearer ${this.authToken}` };
      
      // Get comprehensive insights (includes health check, peer comparison, goal path)
      const insightsResponse = await axios.get(
        `${CONFIG.backendUrl}/api/portfolios/${portfolioId}/comprehensive-insights`,
        { headers }
      );

      return {
        comprehensive: insightsResponse.data.insights,
        portfolioId: portfolioId
      };

    } catch (error) {
      console.error('Portfolio AI API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Validate portfolio AI insights using Claude AI as professional RE investor
   */
  async validatePortfolioAIWithClaude(scenario, aiInsights) {
    if (!CONFIG.openaiApiKey) {
      console.warn('OpenAI API key not provided - skipping AI validation');
      return { validated: false, reason: 'No API key' };
    }

    // Extract key data for validation prompt
    const healthCheck = aiInsights.comprehensive.healthCheck;
    const peerComparison = aiInsights.comprehensive.peerComparison;
    const goalPath = aiInsights.comprehensive.goalPath;

    const prompt = `You are Marcus Chen, a seasoned real estate investment advisor with 15 years of experience managing institutional and private portfolios. Please evaluate whether these AI-generated portfolio insights are professionally sound and actionable.

PORTFOLIO SCENARIO:
- Scenario: ${scenario.name}  
- Description: ${scenario.description}
- Primary Goal: ${scenario.portfolioConfig.goals.primaryGoal}
- Target Monthly Income: $${scenario.portfolioConfig.goals.targetMonthlyIncome || 'N/A'}
- Target Net Worth: $${scenario.portfolioConfig.goals.targetNetWorth?.toLocaleString() || 'N/A'}
- Risk Tolerance: ${scenario.portfolioConfig.goals.riskTolerance}
- Properties: ${scenario.properties.length} properties

AI-GENERATED HEALTH CHECK:
- Biggest Risk: ${healthCheck?.biggestRisk?.title || 'N/A'}
  Risk Description: ${healthCheck?.biggestRisk?.description || 'N/A'}
  Risk Severity: ${healthCheck?.biggestRisk?.severity || 'N/A'}
- Best Opportunity: ${healthCheck?.bestOpportunity?.title || 'N/A'}
  Opportunity Description: ${healthCheck?.bestOpportunity?.description || 'N/A'}
- Action This Month: ${healthCheck?.actionThisMonth?.action || 'N/A'}

AI-GENERATED PEER COMPARISON:
- Outperforming Areas: ${peerComparison?.outperforming?.metrics?.join(', ') || 'N/A'}
- Lagging Areas: ${peerComparison?.lagging?.metrics?.join(', ') || 'N/A'}
- Key Advantage: ${peerComparison?.outperforming?.advantage || 'N/A'}
- Performance Gap: ${peerComparison?.lagging?.gap || 'N/A'}

AI-GENERATED GOAL PATH:
- Properties Needed: ${goalPath?.propertiesNeeded?.count || 'N/A'} properties
- Target Property Types: ${goalPath?.propertiesNeeded?.types?.join(', ') || 'N/A'}
- Primary Target Location: ${goalPath?.targetLocations?.primary || 'N/A'}
- Total Capital Required: $${goalPath?.capitalRequired?.totalInvestment?.toLocaleString() || 'N/A'}

EXPECTED INSIGHTS (Test Validation):
Expected Health Check Identifiers: ${scenario.expectedInsights.healthCheck?.shouldIdentify?.join(', ') || 'N/A'}
Expected Biggest Risk: ${scenario.expectedInsights.healthCheck?.biggestRisk || 'N/A'}

Please analyze as a professional RE investor:
1. Are the identified risks and opportunities realistic for this portfolio scenario?
2. Do the peer comparison insights align with professional benchmarks?
3. Is the goal achievement path financially feasible and strategically sound?
4. Are the recommendations actionable and appropriate for the stated risk tolerance?
5. Would you personally provide similar advice to a client with this portfolio?

Respond with:
- VALIDATION: [PASS/FAIL/QUESTIONABLE]
- REASONING: [2-3 sentence professional assessment]
- PROFESSIONAL_NOTES: [Any specific concerns or recommendations]`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${CONFIG.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        validated: true,
        aiResponse: response.data.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      return {
        validated: false,
        reason: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clean up test portfolio
   */
  async cleanupPortfolio(portfolioId) {
    try {
      await axios.put(`${CONFIG.backendUrl}/api/portfolios/${portfolioId}`, 
        { status: 'ARCHIVED' },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      console.log(`🗑️  Portfolio ${portfolioId} archived`);
    } catch (error) {
      console.warn(`Warning: Could not cleanup portfolio ${portfolioId}:`, error.message);
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite() {
    console.log('🚀 Starting Intelligent Portfolio AI Validation System...\n');
    
    // Authenticate first
    await this.authenticate();
    
    for (const scenario of PORTFOLIO_SCENARIOS) {
      console.log(`📊 Testing: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Properties: ${scenario.properties.length} properties`);
      console.log(`   Primary Goal: ${scenario.portfolioConfig.goals.primaryGoal}`);
      
      let portfolioId = null;
      
      try {
        // Create test portfolio with properties
        portfolioId = await this.createTestPortfolio(scenario);
        
        // Get AI insights
        const aiInsights = await this.getPortfolioAIInsights(portfolioId);
        
        // Validate with professional RE investor AI
        const validation = await this.validatePortfolioAIWithClaude(scenario, aiInsights);
        
        // Extract key results for reporting
        const result = {
          scenarioName: scenario.name,
          scenarioDescription: scenario.description,
          portfolioId: portfolioId,
          aiInsights: {
            healthCheck: {
              biggestRisk: aiInsights.comprehensive.healthCheck?.biggestRisk?.title || 'N/A',
              bestOpportunity: aiInsights.comprehensive.healthCheck?.bestOpportunity?.title || 'N/A',
              actionThisMonth: aiInsights.comprehensive.healthCheck?.actionThisMonth?.action || 'N/A'
            },
            peerComparison: {
              outperforming: aiInsights.comprehensive.peerComparison?.outperforming?.metrics?.join(', ') || 'N/A',
              lagging: aiInsights.comprehensive.peerComparison?.lagging?.metrics?.join(', ') || 'N/A'
            },
            goalPath: {
              propertiesNeeded: aiInsights.comprehensive.goalPath?.propertiesNeeded?.count || 'N/A',
              totalInvestment: aiInsights.comprehensive.goalPath?.capitalRequired?.totalInvestment || 'N/A'
            }
          },
          validation: validation,
          timestamp: new Date().toISOString()
        };

        this.results.push(result);

        // Display results
        console.log(`   ✅ Portfolio AI Generated:`);
        console.log(`      Biggest Risk: ${result.aiInsights.healthCheck.biggestRisk}`);
        console.log(`      Best Opportunity: ${result.aiInsights.healthCheck.bestOpportunity}`);
        console.log(`      Outperforming: ${result.aiInsights.peerComparison.outperforming}`);
        
        if (validation.validated) {
          console.log(`   🤖 AI Validation: ${this.extractValidationResult(validation.aiResponse)}`);
          console.log(`      Professional Assessment: ${this.extractReasoning(validation.aiResponse)}`);
        } else {
          console.log(`   ⚠️  AI Validation Failed: ${validation.reason}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
        this.results.push({
          scenarioName: scenario.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } finally {
        // Clean up portfolio
        if (portfolioId) {
          await this.cleanupPortfolio(portfolioId);
        }
      }
      
      console.log(''); // Empty line between tests
    }

    // Generate final report
    this.generateReport();
  }

  /**
   * Extract validation result from AI response
   */
  extractValidationResult(aiResponse) {
    const match = aiResponse.match(/VALIDATION:\s*(PASS|FAIL|QUESTIONABLE)/i);
    return match ? match[1] : 'UNKNOWN';
  }

  /**
   * Extract reasoning from AI response
   */
  extractReasoning(aiResponse) {
    const match = aiResponse.match(/REASONING:\s*([^-\n]+)/i);
    return match ? match[1].trim().substring(0, 100) + '...' : 'No reasoning provided';
  }

  /**
   * Generate test report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    const passedTests = this.results.filter(r => 
      r.validation?.validated && this.extractValidationResult(r.validation.aiResponse) === 'PASS'
    ).length;
    
    const report = `# Portfolio AI Validation Report

**Generated:** ${timestamp}
**Total Tests:** ${this.results.length}  
**Passed:** ${passedTests}
**Success Rate:** ${Math.round(passedTests/this.results.length*100)}%

## Test Results

${this.results.map(result => {
  if (result.error) {
    return `### ❌ ${result.scenarioName}
**Error:** ${result.error}
**Timestamp:** ${result.timestamp}
`;
  }

  const validationResult = result.validation?.validated ? 
    this.extractValidationResult(result.validation.aiResponse) : 'SKIPPED';
    
  return `### ${validationResult === 'PASS' ? '✅' : validationResult === 'FAIL' ? '❌' : '⚠️'} ${result.scenarioName}

**Description:** ${result.scenarioDescription}
**Portfolio ID:** ${result.portfolioId}

**AI Insights Generated:**
- Biggest Risk: ${result.aiInsights.healthCheck.biggestRisk}
- Best Opportunity: ${result.aiInsights.healthCheck.bestOpportunity}
- Action This Month: ${result.aiInsights.healthCheck.actionThisMonth}
- Outperforming Areas: ${result.aiInsights.peerComparison.outperforming}
- Lagging Areas: ${result.aiInsights.peerComparison.lagging}
- Properties Needed: ${result.aiInsights.goalPath.propertiesNeeded}
- Total Investment: $${result.aiInsights.goalPath.totalInvestment?.toLocaleString() || 'N/A'}

**Professional Validation:** ${validationResult}
${result.validation?.validated ? `**Reasoning:** ${this.extractReasoning(result.validation.aiResponse)}` : ''}

**Timestamp:** ${result.timestamp}
`;
}).join('\n')}

## Summary

${passedTests === this.results.length ? 
  '🎉 **All portfolio AI tests passed!** The AI-generated insights are professionally validated.' :
  passedTests >= this.results.length * 0.8 ?
  '✅ **Portfolio AI performing well** with most tests passing. Minor improvements may be needed.' :
  '⚠️ **Portfolio AI needs attention** - several validation failures detected.'
}

Generated by Intelligent Portfolio AI Validation System
`;

    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.testOutputDir)) {
      fs.mkdirSync(CONFIG.testOutputDir, { recursive: true });
    }

    // Write report
    fs.writeFileSync(CONFIG.reportFile, report);
    console.log(`📋 Test report generated: ${CONFIG.reportFile}`);
    console.log(`📊 Results: ${passedTests}/${this.results.length} tests passed (${Math.round(passedTests/this.results.length*100)}%)`);
  }
}

// Main execution
async function runPortfolioAIValidation() {
  const tester = new IntelligentPortfolioAITester();
  await tester.runTestSuite();
}

// Run the tests
if (require.main === module) {
  runPortfolioAIValidation().catch(console.error);
}

module.exports = { IntelligentPortfolioAITester };