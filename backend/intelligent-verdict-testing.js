#!/usr/bin/env node

/**
 * INTELLIGENT VERDICT TESTING SYSTEM
 * 
 * Uses saved property parameters with strategic price manipulation to test
 * all verdict categories (PASS, CAUTION, NEGOTIATE, BUY) and validates
 * each result through Claude AI as a professional RE analyst.
 * 
 * Features:
 * - Boundary testing (deal quality thresholds: 50, 65, 80)
 * - AI-powered validation of verdict reasoning
 * - Professional real estate analyst perspective 
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
  reportFile: './test-results/verdict-validation-report.md'
};

// Base property from your working example (56/100 Deal Quality CAUTION)
const BASE_PROPERTY = {
  propertyType: 'SFR',
  propertyName: 'Test Property - Verdict Validation',
  propertyAddress: {
    street: '123 Test Street',
    city: 'Nashville', 
    state: 'TN',
    zipCode: '37203'
  },
  purchasePrice: 450000, // This will be manipulated for testing
  downPayment: 90000,    // 20% - will adjust proportionally
  interestRate: 6.75,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  propertyManagementRate: 8,
  yearBuilt: 2000,
  monthlyRent: 2940,
  squareFootage: 2450,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 294,
  closingCosts: 11250,
  capitalInvestments: 0,
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  },
  longTermAssumptions: {
    projectionYears: 30,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    turnoverFrequency: 2
  }
};

// Test scenarios designed to hit different verdict ranges
const TEST_SCENARIOS = [
  {
    name: 'BUY_Scenario_High',
    description: 'Should trigger BUY verdict (Deal Quality 80+)',
    purchasePrice: 300000,  // Lower price should boost Deal Quality
    expectedVerdict: 'BUY',
    expectedDealQuality: { min: 80, max: 100 }
  },
  {
    name: 'BUY_Scenario_Moderate', 
    description: 'Should trigger BUY verdict (Deal Quality 80-85)',
    purchasePrice: 320000,
    expectedVerdict: 'BUY',
    expectedDealQuality: { min: 80, max: 85 }
  },
  {
    name: 'NEGOTIATE_Scenario_High',
    description: 'Should trigger NEGOTIATE verdict (Deal Quality 65-79)',
    purchasePrice: 380000,
    expectedVerdict: 'NEGOTIATE', 
    expectedDealQuality: { min: 65, max: 79 }
  },
  {
    name: 'NEGOTIATE_Scenario_Boundary',
    description: 'Should trigger NEGOTIATE verdict (Deal Quality ~65)',
    purchasePrice: 400000,
    expectedVerdict: 'NEGOTIATE',
    expectedDealQuality: { min: 65, max: 70 }
  },
  {
    name: 'CAUTION_Scenario_High',
    description: 'Should trigger CAUTION verdict (Deal Quality 50-64)', 
    purchasePrice: 450000, // Original scenario
    expectedVerdict: 'CAUTION',
    expectedDealQuality: { min: 50, max: 64 }
  },
  {
    name: 'CAUTION_Scenario_Boundary',
    description: 'Should trigger CAUTION verdict (Deal Quality ~50)',
    purchasePrice: 480000,
    expectedVerdict: 'CAUTION',
    expectedDealQuality: { min: 50, max: 55 }
  },
  {
    name: 'PASS_Scenario_High',
    description: 'Should trigger PASS verdict (Deal Quality <50)',
    purchasePrice: 550000,  // High price should lower Deal Quality
    expectedVerdict: 'PASS',
    expectedDealQuality: { min: 0, max: 49 }
  },
  {
    name: 'PASS_Scenario_Extreme',
    description: 'Should trigger PASS verdict (Deal Quality <30)', 
    purchasePrice: 650000,
    expectedVerdict: 'PASS',
    expectedDealQuality: { min: 0, max: 30 }
  }
];

class IntelligentVerdictTester {
  constructor() {
    this.results = [];
    this.aiValidations = [];
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(CONFIG.testOutputDir)) {
      fs.mkdirSync(CONFIG.testOutputDir, { recursive: true });
    }
  }

  /**
   * Create property data for specific test scenario
   */
  createTestProperty(scenario) {
    const property = { ...BASE_PROPERTY };
    
    // Adjust purchase price
    property.purchasePrice = scenario.purchasePrice;
    
    // Adjust down payment proportionally (maintain 20%)
    property.downPayment = Math.round(scenario.purchasePrice * 0.20);
    
    // Adjust closing costs proportionally (2.5% of purchase price)
    property.closingCosts = Math.round(scenario.purchasePrice * 0.025);
    
    // Update property name for identification
    property.propertyName = `${BASE_PROPERTY.propertyName} - ${scenario.name}`;
    
    return property;
  }

  /**
   * Call backend investment decision API
   */
  async analyzeProperty(propertyData) {
    try {
      const response = await axios.post(`${CONFIG.backendUrl}/api/deals/analyze`, {
        propertyData,
        userContext: {
          availableCash: 150000,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate', 
          investmentGoals: 'cash_flow'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Backend API Error:', error.message);
      throw error;
    }
  }

  /**
   * Validate verdict using Claude AI as RE analyst
   */
  async validateVerdictWithAI(scenario, result) {
    if (!CONFIG.openaiApiKey) {
      console.warn('OpenAI API key not provided - skipping AI validation');
      return { validated: false, reason: 'No API key' };
    }

    const prompt = `You are a seasoned real estate investment analyst reviewing an algorithmic investment decision. Please evaluate whether the verdict makes sense from a professional real estate perspective.

PROPERTY DETAILS:
- Purchase Price: $${result.propertyData.purchasePrice.toLocaleString()}
- Monthly Rent: $${result.propertyData.monthlyRent.toLocaleString()}
- Down Payment: $${result.propertyData.downPayment.toLocaleString()} (${((result.propertyData.downPayment/result.propertyData.purchasePrice)*100).toFixed(1)}%)
- Monthly Cash Flow: $${result.analysis.monthlyAnalysis.cashFlow}
- Cap Rate: ${(result.analysis.annualAnalysis.capRate).toFixed(2)}%
- Cash-on-Cash Return: ${result.analysis.annualAnalysis.cashOnCashReturn.toFixed(2)}%
- DSCR: ${result.analysis.annualAnalysis.dscr.toFixed(2)}
- Location: ${result.propertyData.propertyAddress.city}, ${result.propertyData.propertyAddress.state}

ALGORITHM DECISION:
- Verdict: ${result.investmentDecision.verdict}
- Deal Quality Score: ${result.investmentDecision.professionalAssessment?.dealQuality || 'N/A'}/100
- Confidence: ${result.investmentDecision.confidence}%
- Primary Reason: ${result.investmentDecision.primaryReason}

EXPECTED OUTCOME:
- Expected Verdict: ${scenario.expectedVerdict}
- Expected Deal Quality Range: ${scenario.expectedDealQuality.min}-${scenario.expectedDealQuality.max}

Please analyze:
1. Does the verdict align with standard real estate investment criteria?
2. Is the Deal Quality score reasonable given the property metrics?
3. Are there any red flags or concerns with this decision?
4. Does the primary reasoning make sense from a professional perspective?
5. Would you personally make the same decision as an experienced investor?

Respond with:
- VALIDATION: [PASS/FAIL/QUESTIONABLE]
- REASONING: [2-3 sentence explanation]
- PROFESSIONAL_NOTES: [Any additional insights]`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
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
   * Run comprehensive test suite
   */
  async runTestSuite() {
    console.log('🚀 Starting Intelligent Verdict Testing System...\n');
    
    for (const scenario of TEST_SCENARIOS) {
      console.log(`📊 Testing: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Purchase Price: $${scenario.purchasePrice.toLocaleString()}`);
      
      try {
        // Create test property
        const propertyData = this.createTestProperty(scenario);
        
        // Analyze with backend
        const result = await this.analyzeProperty(propertyData);
        
        // Extract key results
        const actualVerdict = result.investmentDecision.verdict;
        const actualDealQuality = result.investmentDecision.professionalAssessment?.dealQuality || null;
        const actualConfidence = result.investmentDecision.confidence;
        
        // Check expectations
        const verdictMatch = actualVerdict === scenario.expectedVerdict;
        const dealQualityInRange = actualDealQuality >= scenario.expectedDealQuality.min && 
                                  actualDealQuality <= scenario.expectedDealQuality.max;
        
        // Validate with AI
        const aiValidation = await this.validateVerdictWithAI(scenario, result);
        
        // Store results
        const testResult = {
          scenario,
          propertyData,
          actualResults: {
            verdict: actualVerdict,
            dealQuality: actualDealQuality,
            confidence: actualConfidence,
            primaryReason: result.investmentDecision.primaryReason,
            monthlyFlow: result.analysis.monthlyAnalysis.cashFlow,
            capRate: result.analysis.annualAnalysis.capRate,
            cashOnCash: result.analysis.annualAnalysis.cashOnCashReturn
          },
          expectations: {
            verdictMatch,
            dealQualityInRange,
            overallPass: verdictMatch && dealQualityInRange
          },
          aiValidation,
          timestamp: new Date().toISOString()
        };
        
        this.results.push(testResult);
        
        // Log results
        console.log(`   ✅ Actual: ${actualVerdict} (Deal Quality: ${actualDealQuality}/100)`);
        console.log(`   🎯 Expected: ${scenario.expectedVerdict} (${scenario.expectedDealQuality.min}-${scenario.expectedDealQuality.max})`);
        console.log(`   📈 Verdict Match: ${verdictMatch ? '✅' : '❌'}`);
        console.log(`   📊 Deal Quality In Range: ${dealQualityInRange ? '✅' : '❌'}`);
        console.log(`   🤖 AI Validation: ${aiValidation.validated ? '✅' : '⏭️ Skipped'}`);
        console.log('');
        
      } catch (error) {
        console.error(`   ❌ Test Failed: ${error.message}\n`);
        
        this.results.push({
          scenario,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Brief pause between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await this.generateReport();
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    const passedTests = this.results.filter(r => r.expectations?.overallPass).length;
    const totalTests = this.results.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    let report = `# V3.0 Investment Decision Engine - Verdict Validation Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Test Results:** ${passedTests}/${totalTests} passed (${successRate}%)\n\n`;
    
    report += `## Executive Summary\n\n`;
    report += `This report validates the V3.0 Professional Assessment system by testing verdict boundaries\n`;
    report += `and using AI analysis to ensure verdicts align with professional real estate standards.\n\n`;
    
    report += `### Verdict Distribution\n\n`;
    const verdictCounts = {};
    this.results.forEach(r => {
      if (r.actualResults?.verdict) {
        verdictCounts[r.actualResults.verdict] = (verdictCounts[r.actualResults.verdict] || 0) + 1;
      }
    });
    
    Object.entries(verdictCounts).forEach(([verdict, count]) => {
      report += `- **${verdict}**: ${count} properties\n`;
    });
    
    report += `\n## Detailed Test Results\n\n`;
    
    this.results.forEach((result, index) => {
      if (result.error) {
        report += `### ${index + 1}. ${result.scenario.name} ❌ FAILED\n\n`;
        report += `**Error:** ${result.error}\n\n`;
        return;
      }
      
      const { scenario, actualResults, expectations, aiValidation } = result;
      const status = expectations.overallPass ? '✅ PASSED' : '❌ FAILED';
      
      report += `### ${index + 1}. ${scenario.name} ${status}\n\n`;
      report += `**Scenario:** ${scenario.description}\n`;
      report += `**Purchase Price:** $${scenario.purchasePrice.toLocaleString()}\n\n`;
      
      report += `#### Results\n`;
      report += `- **Verdict:** ${actualResults.verdict} (Expected: ${scenario.expectedVerdict}) ${expectations.verdictMatch ? '✅' : '❌'}\n`;
      report += `- **Deal Quality:** ${actualResults.dealQuality}/100 (Expected: ${scenario.expectedDealQuality.min}-${scenario.expectedDealQuality.max}) ${expectations.dealQualityInRange ? '✅' : '❌'}\n`;
      report += `- **Monthly Cash Flow:** $${actualResults.monthlyFlow}\n`;
      report += `- **Cap Rate:** ${actualResults.capRate.toFixed(2)}%\n`;
      report += `- **Cash-on-Cash Return:** ${actualResults.cashOnCash.toFixed(2)}%\n\n`;
      
      report += `#### Algorithm Reasoning\n`;
      report += `*"${actualResults.primaryReason}"*\n\n`;
      
      if (aiValidation.validated) {
        report += `#### AI Professional Validation\n`;
        report += `${aiValidation.aiResponse}\n\n`;
      }
      
      report += `---\n\n`;
    });
    
    report += `## Recommendations\n\n`;
    const failedTests = this.results.filter(r => !r.expectations?.overallPass);
    if (failedTests.length > 0) {
      report += `### Issues Identified\n\n`;
      failedTests.forEach(test => {
        if (!test.expectations.verdictMatch) {
          report += `- **Verdict Mismatch:** ${test.scenario.name} expected ${test.scenario.expectedVerdict}, got ${test.actualResults.verdict}\n`;
        }
        if (!test.expectations.dealQualityInRange) {
          report += `- **Deal Quality Range:** ${test.scenario.name} deal quality ${test.actualResults.dealQuality} outside expected range ${test.scenario.expectedDealQuality.min}-${test.scenario.expectedDealQuality.max}\n`;
        }
      });
      report += `\n`;
    }
    
    if (successRate >= 90) {
      report += `### ✅ System Status: EXCELLENT\n`;
      report += `The V3.0 Investment Decision Engine is performing exceptionally well with ${successRate}% accuracy.\n`;
    } else if (successRate >= 75) {
      report += `### ⚠️ System Status: GOOD\n`;
      report += `The V3.0 system is performing well but may need minor calibration adjustments.\n`;
    } else {
      report += `### ❌ System Status: NEEDS ATTENTION\n`;
      report += `The V3.0 system requires immediate review and calibration improvements.\n`;
    }
    
    // Write report to file
    fs.writeFileSync(CONFIG.reportFile, report);
    
    // Also save raw results as JSON
    fs.writeFileSync(
      path.join(CONFIG.testOutputDir, 'raw-test-results.json'), 
      JSON.stringify(this.results, null, 2)
    );
    
    console.log(`📋 Test Report Generated:`);
    console.log(`   📄 Report: ${CONFIG.reportFile}`);
    console.log(`   🗂️ Raw Data: ${path.join(CONFIG.testOutputDir, 'raw-test-results.json')}`);
    console.log(`   📊 Success Rate: ${successRate}%`);
  }
}

// Main execution
async function main() {
  try {
    const tester = new IntelligentVerdictTester();
    await tester.runTestSuite();
    
    console.log('\n🎉 Intelligent Verdict Testing Complete!');
  } catch (error) {
    console.error('❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { IntelligentVerdictTester, TEST_SCENARIOS, BASE_PROPERTY };