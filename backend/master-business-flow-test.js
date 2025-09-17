/**
 * MASTER BUSINESS FLOW TEST SUITE
 * Senior Test Engineer Design - Amazon-Grade E2E Testing
 * 
 * Tests: Pipeline → Analysis → Portfolio Complete Lifecycle
 * Validation: Investment engine, AI outputs, portfolio impact, user experience
 * Data: Uses veteran-validated deal scenarios for realistic testing
 */

const axios = require('axios');

console.log('🏗️ MASTER BUSINESS FLOW TEST SUITE');
console.log('=' .repeat(80));
console.log('Testing: Pipeline → Analysis → Portfolio Complete Lifecycle\n');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================
const BASE_URL = 'http://localhost:8000';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Consistent test user

// Veteran-validated test properties (known outcomes)
const testProperties = [
  {
    name: "Cash Cow Property",
    description: "Class C property with strong cash flow - veteran BUY rating",
    expectedVerdict: "BUY",
    expectedScore: "> 80",
    data: {
      propertyName: "Cash Cow Test Property",
      propertyAddress: {
        street: "123 Cash Flow St",
        city: "Memphis",
        state: "TN",
        zipCode: "38103"
      },
      purchasePrice: 80000,
      monthlyRent: 1100,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1200,
      yearBuilt: 1980,
      propertyType: "SFR",
      
      // Financing
      downPayment: 20000,
      interestRate: 8.0,
      loanTerm: 30,
      closingCosts: 3000,
      
      // Expenses (low for good cash flow)
      monthlyInsurance: 80,
      monthlyPropertyTax: 120,
      monthlyMaintenance: 90,
      monthlyPropertyManagement: 88, // 8% of rent
      monthlyUtilities: 0,
      vacancyRate: 5,
      
      // Long-term assumptions
      longTermAssumptions: {
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3,
        inflationRate: 2.5,
        projectionYears: 10,
        vacancyRate: 5
      }
    }
  },
  
  {
    name: "Rookie Trap Property", 
    description: "Pretty house in nice area but terrible cash flow - veteran PASS rating",
    expectedVerdict: "PASS",
    expectedScore: "< 40",
    data: {
      propertyName: "Rookie Trap Test Property",
      propertyAddress: {
        street: "456 Pretty Lane",
        city: "Frisco",
        state: "TX", 
        zipCode: "75034"
      },
      purchasePrice: 250000,
      monthlyRent: 1600,
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 2200,
      yearBuilt: 2010,
      propertyType: "SFR",
      
      // Financing
      downPayment: 50000,
      interestRate: 7.0,
      loanTerm: 30,
      closingCosts: 7500,
      
      // Expenses (high for nice area)
      monthlyInsurance: 150,
      monthlyPropertyTax: 450,
      monthlyMaintenance: 200,
      monthlyPropertyManagement: 128, // 8% of rent
      monthlyUtilities: 0,
      vacancyRate: 5,
      
      // Long-term assumptions
      longTermAssumptions: {
        annualRentIncrease: 2,
        annualPropertyValueIncrease: 4, // Appreciation play
        inflationRate: 2.5,
        projectionYears: 10,
        vacancyRate: 5
      }
    }
  }
];

// ============================================================================
// TEST EXECUTION ENGINE
// ============================================================================

class MasterBusinessFlowTester {
  constructor() {
    this.testResults = [];
    this.portfolioId = null;
    this.createdPropertyIds = [];
    this.createdPipelineIds = [];
  }
  
  async runCompleteTestSuite() {
    console.log('🚀 Starting Master Business Flow Test Suite\n');
    
    try {
      // Test each property through complete lifecycle
      for (const property of testProperties) {
        console.log(`📋 Testing: ${property.name}`);
        await this.testCompletePropertyLifecycle(property);
        console.log('');
      }
      
      await this.generateFinalReport();
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }
  
  async testCompletePropertyLifecycle(property) {
    const testResult = {
      propertyName: property.name,
      stages: {},
      overallPass: true,
      issues: []
    };
    
    try {
      // Stage 1: Add to Pipeline
      console.log('  Stage 1: Adding to Pipeline...');
      const pipelineResult = await this.testPipelineAddition(property);
      testResult.stages.pipeline = pipelineResult;
      if (!pipelineResult.success) testResult.overallPass = false;
      
      // Stage 2: Investment Decision Engine Analysis
      console.log('  Stage 2: Running Investment Analysis...');
      const analysisResult = await this.testInvestmentAnalysis(property);
      testResult.stages.analysis = analysisResult;
      if (!analysisResult.success) testResult.overallPass = false;
      
      // Stage 3: AI Output Validation
      console.log('  Stage 3: Validating AI Outputs...');
      const aiValidation = await this.testAIOutputs(analysisResult.data, property);
      testResult.stages.aiValidation = aiValidation;
      if (!aiValidation.success) testResult.overallPass = false;
      
      // Stage 4: Pipeline Stage Management
      console.log('  Stage 4: Testing Pipeline Flow...');
      const pipelineFlow = await this.testPipelineStageTransitions(pipelineResult.pipelineId);
      testResult.stages.pipelineFlow = pipelineFlow;
      if (!pipelineFlow.success) testResult.overallPass = false;
      
      // Stage 5: Portfolio Integration
      console.log('  Stage 5: Adding to Portfolio...');
      const portfolioResult = await this.testPortfolioIntegration(analysisResult.propertyId, property);
      testResult.stages.portfolio = portfolioResult;
      if (!portfolioResult.success) testResult.overallPass = false;
      
      // Stage 6: Portfolio Impact Validation
      console.log('  Stage 6: Validating Portfolio Impact...');
      const impactValidation = await this.testPortfolioImpact(property);
      testResult.stages.portfolioImpact = impactValidation;
      if (!impactValidation.success) testResult.overallPass = false;
      
      this.testResults.push(testResult);
      console.log(`  Result: ${testResult.overallPass ? '✅ PASS' : '❌ FAIL'}`);
      
    } catch (error) {
      console.error(`  ❌ ERROR in ${property.name}: ${error.message}`);
      testResult.overallPass = false;
      testResult.issues.push(`Fatal error: ${error.message}`);
      this.testResults.push(testResult);
    }
  }
  
  // ============================================================================
  // STAGE 1: PIPELINE ADDITION
  // ============================================================================
  async testPipelineAddition(property) {
    try {
      const response = await axios.post(`${BASE_URL}/api/pipeline`, {
        userId: TEST_USER_ID,
        propertyData: property.data
      });
      
      if (response.status === 201 && response.data.success) {
        this.createdPipelineIds.push(response.data.pipeline._id);
        return {
          success: true,
          pipelineId: response.data.pipeline._id,
          message: 'Property added to pipeline successfully'
        };
      } else {
        return {
          success: false,
          error: 'Pipeline addition failed',
          details: response.data
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Pipeline API error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // STAGE 2: INVESTMENT DECISION ENGINE ANALYSIS
  // ============================================================================
  async testInvestmentAnalysis(property) {
    try {
      const response = await axios.post(`${BASE_URL}/api/deals/analyze`, {
        userId: TEST_USER_ID,
        propertyData: property.data,
        skipSave: false // We want to save for portfolio testing
      });
      
      if (response.status === 200 && response.data.success) {
        const analysis = response.data.analysis;
        const decision = response.data.investmentDecision;
        
        // Validate core financial calculations
        const validationResult = this.validateFinancialCalculations(analysis, property);
        
        // Validate verdict matches veteran expectations
        const verdictValidation = this.validateVerdictAccuracy(decision, property);
        
        this.createdPropertyIds.push(response.data.dealId);
        
        return {
          success: validationResult.success && verdictValidation.success,
          propertyId: response.data.dealId,
          data: response.data,
          financialValidation: validationResult,
          verdictValidation: verdictValidation
        };
      } else {
        return {
          success: false,
          error: 'Analysis failed',
          details: response.data
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Analysis API error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // STAGE 3: AI OUTPUT VALIDATION
  // ============================================================================
  async testAIOutputs(analysisData, property) {
    try {
      const aiInsights = analysisData.aiInsights;
      const decision = analysisData.investmentDecision;
      
      const validations = {
        strategicActionPlan: this.validateStrategicActionPlan(aiInsights?.strategicActionPlan),
        capitalStrategy: this.validateCapitalStrategy(aiInsights?.capitalStrategy),
        portfolioContext: this.validatePortfolioContext(decision?.portfolioContext),
        aiRecommendations: this.validateAIRecommendations(aiInsights)
      };
      
      const allValid = Object.values(validations).every(v => v.success);
      
      return {
        success: allValid,
        validations: validations,
        message: allValid ? 'All AI outputs valid' : 'Some AI validations failed'
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'AI validation error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // STAGE 4: PIPELINE STAGE TRANSITIONS
  // ============================================================================
  async testPipelineStageTransitions(pipelineId) {
    try {
      const stages = ['analyzing', 'reviewed', 'closed'];
      
      for (const stage of stages) {
        const response = await axios.put(`${BASE_URL}/api/pipeline/${pipelineId}`, {
          userId: TEST_USER_ID,
          stage: stage
        });
        
        if (response.status !== 200 || !response.data.success) {
          return {
            success: false,
            error: `Failed to transition to ${stage}`,
            details: response.data
          };
        }
      }
      
      return {
        success: true,
        message: 'All pipeline stage transitions successful'
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Pipeline transition error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // STAGE 5: PORTFOLIO INTEGRATION
  // ============================================================================
  async testPortfolioIntegration(propertyId, property) {
    try {
      // Create portfolio if doesn't exist
      if (!this.portfolioId) {
        const portfolioResponse = await axios.post(`${BASE_URL}/api/portfolio`, {
          userId: TEST_USER_ID,
          name: "Master Test Portfolio",
          description: "Test portfolio for business flow validation",
          goals: {
            primaryGoal: "CASH_FLOW",
            riskTolerance: "MODERATE",
            targetTimeline: "10-15 years",
            targetMonthlyIncome: 5000
          }
        });
        
        if (portfolioResponse.status === 201) {
          this.portfolioId = portfolioResponse.data.portfolio._id;
        } else {
          throw new Error('Failed to create test portfolio');
        }
      }
      
      // Add property to portfolio
      const response = await axios.post(`${BASE_URL}/api/portfolio/${this.portfolioId}/properties`, {
        userId: TEST_USER_ID,
        propertyId: propertyId
      });
      
      if (response.status === 200 && response.data.success) {
        return {
          success: true,
          message: 'Property added to portfolio successfully',
          portfolioId: this.portfolioId
        };
      } else {
        return {
          success: false,
          error: 'Portfolio integration failed',
          details: response.data
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: 'Portfolio integration error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // STAGE 6: PORTFOLIO IMPACT VALIDATION
  // ============================================================================
  async testPortfolioImpact(property) {
    try {
      const response = await axios.get(`${BASE_URL}/api/portfolio/${this.portfolioId}/details`, {
        params: { userId: TEST_USER_ID }
      });
      
      if (response.status === 200 && response.data.success) {
        const portfolioDetails = response.data.portfolio;
        
        // Validate portfolio metrics updated correctly
        const impactValidation = this.validatePortfolioMetrics(portfolioDetails, property);
        
        return {
          success: impactValidation.success,
          portfolioDetails: portfolioDetails,
          validation: impactValidation
        };
      } else {
        return {
          success: false,
          error: 'Failed to get portfolio details',
          details: response.data
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: 'Portfolio impact validation error',
        details: error.message
      };
    }
  }
  
  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================
  
  validateFinancialCalculations(analysis, property) {
    const issues = [];
    
    // Validate cap rate calculation
    const expectedCapRate = ((property.data.monthlyRent * 12 - this.calculateExpenses(property.data) * 12) / property.data.purchasePrice) * 100;
    const actualCapRate = analysis.keyMetrics?.capRate || 0;
    if (Math.abs(expectedCapRate - actualCapRate) > 0.5) {
      issues.push(`Cap rate mismatch: expected ~${expectedCapRate.toFixed(1)}%, got ${actualCapRate.toFixed(1)}%`);
    }
    
    // Validate no Infinity or NaN values
    const metrics = analysis.keyMetrics || {};
    Object.entries(metrics).forEach(([key, value]) => {
      if (!isFinite(value)) {
        issues.push(`Invalid ${key}: ${value}`);
      }
    });
    
    return {
      success: issues.length === 0,
      issues: issues,
      message: issues.length === 0 ? 'Financial calculations valid' : `${issues.length} calculation issues found`
    };
  }
  
  validateVerdictAccuracy(decision, property) {
    const actualVerdict = decision.verdict;
    const expectedVerdict = property.expectedVerdict;
    
    if (actualVerdict === expectedVerdict) {
      return {
        success: true,
        message: `Verdict matches veteran expectation: ${actualVerdict}`
      };
    } else {
      return {
        success: false,
        message: `Verdict mismatch: expected ${expectedVerdict}, got ${actualVerdict}`,
        details: {
          expected: expectedVerdict,
          actual: actualVerdict,
          score: decision.professionalAssessment?.dealQuality
        }
      };
    }
  }
  
  validateStrategicActionPlan(actionPlan) {
    if (!actionPlan || !Array.isArray(actionPlan) || actionPlan.length === 0) {
      return {
        success: false,
        error: 'Strategic Action Plan missing or empty'
      };
    }
    
    // Check for $0 or undefined values (data corruption)
    const hasDataCorruption = actionPlan.some(item => 
      (item.description && item.description.includes('$0')) ||
      (item.expectedOutcome && item.expectedOutcome.includes('$0'))
    );
    
    return {
      success: !hasDataCorruption,
      message: hasDataCorruption ? 'Data corruption detected in Action Plan' : 'Strategic Action Plan valid'
    };
  }
  
  validateCapitalStrategy(capitalStrategy) {
    if (!capitalStrategy) {
      return {
        success: false,
        error: 'Capital Strategy missing'
      };
    }
    
    const current = capitalStrategy.currentApproach;
    const recommended = capitalStrategy.recommendedApproach;
    
    if (!current || !recommended || current.cashRequired === 0 || recommended.cashRequired === 0) {
      return {
        success: false,
        error: 'Capital Strategy contains $0 values (data corruption)'
      };
    }
    
    return {
      success: true,
      message: 'Capital Strategy valid'
    };
  }
  
  validatePortfolioContext(portfolioContext) {
    if (!portfolioContext || !portfolioContext.fitAnalysis) {
      return {
        success: false,
        error: 'Portfolio Context missing'
      };
    }
    
    // Check for precision issues (like $19.650000000000002)
    const hasPrecisionIssues = portfolioContext.fitAnalysis.includes('0000000');
    
    return {
      success: !hasPrecisionIssues,
      message: hasPrecisionIssues ? 'Portfolio Context has precision issues' : 'Portfolio Context valid'
    };
  }
  
  validateAIRecommendations(aiInsights) {
    const recommendations = aiInsights?.recommendations;
    if (!recommendations || recommendations.length === 0) {
      return {
        success: false,
        error: 'AI Recommendations missing'
      };
    }
    
    return {
      success: true,
      message: 'AI Recommendations present'
    };
  }
  
  validatePortfolioMetrics(portfolioDetails, property) {
    const issues = [];
    
    // Check if property count increased
    if (portfolioDetails.totalProperties === 0) {
      issues.push('Property count did not increase');
    }
    
    // Check for financial metric updates
    if (!portfolioDetails.analytics) {
      issues.push('Portfolio analytics not generated');
    }
    
    return {
      success: issues.length === 0,
      issues: issues,
      message: issues.length === 0 ? 'Portfolio metrics updated correctly' : `${issues.length} portfolio issues found`
    };
  }
  
  calculateExpenses(propertyData) {
    return (propertyData.monthlyInsurance || 0) +
           (propertyData.monthlyPropertyTax || 0) +
           (propertyData.monthlyMaintenance || 0) +
           (propertyData.monthlyPropertyManagement || 0) +
           (propertyData.monthlyUtilities || 0);
  }
  
  // ============================================================================
  // REPORTING & CLEANUP
  // ============================================================================
  
  async generateFinalReport() {
    console.log('\n' + '=' .repeat(80));
    console.log('📊 MASTER BUSINESS FLOW TEST RESULTS\n');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.overallPass).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Properties Tested: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
    
    // Detailed results
    this.testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.propertyName}: ${result.overallPass ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!result.overallPass) {
        console.log('   Issues:');
        result.issues.forEach(issue => console.log(`     • ${issue}`));
        
        // Show stage failures
        Object.entries(result.stages).forEach(([stage, stageResult]) => {
          if (!stageResult.success) {
            console.log(`     • ${stage}: ${stageResult.error || stageResult.message}`);
          }
        });
      }
      console.log('');
    });
    
    // Overall assessment
    console.log('🎯 OVERALL ASSESSMENT:');
    if (passedTests === totalTests) {
      console.log('✅ ALL TESTS PASSED - Platform ready for production');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('⚠️  MOSTLY PASSING - Minor issues to address');
    } else {
      console.log('❌ SIGNIFICANT ISSUES - Requires attention before production');
    }
    
    console.log('\n' + '=' .repeat(80));
  }
  
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete created properties
      for (const propertyId of this.createdPropertyIds) {
        await axios.delete(`${BASE_URL}/api/deals/${propertyId}`, {
          data: { userId: TEST_USER_ID }
        }).catch(err => console.log(`   Warning: Could not delete property ${propertyId}`));
      }
      
      // Delete created pipeline items
      for (const pipelineId of this.createdPipelineIds) {
        await axios.delete(`${BASE_URL}/api/pipeline/${pipelineId}`, {
          data: { userId: TEST_USER_ID }
        }).catch(err => console.log(`   Warning: Could not delete pipeline ${pipelineId}`));
      }
      
      // Delete test portfolio
      if (this.portfolioId) {
        await axios.delete(`${BASE_URL}/api/portfolio/${this.portfolioId}`, {
          data: { userId: TEST_USER_ID }
        }).catch(err => console.log(`   Warning: Could not delete portfolio ${this.portfolioId}`));
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.log('⚠️  Some cleanup operations failed - manual cleanup may be needed');
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
  const tester = new MasterBusinessFlowTester();
  await tester.runCompleteTestSuite();
}

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { MasterBusinessFlowTester };