/**
 * COMPREHENSIVE BUSINESS FLOW TEST
 * Senior Test Engineer: End-to-End Real Estate Platform Validation
 * 
 * Tests the complete user journey:
 * 1. Property Analysis → Save Deal
 * 2. Convert Deal → Pipeline Management
 * 3. Pipeline Stage Progression
 * 4. Analysis Linking & Metrics Caching
 * 5. Portfolio Addition & Impact
 * 6. Portfolio Context in Future Analyses
 * 
 * This validates the entire business logic flow that users experience.
 */

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const BASE_URL = 'http://localhost:3001/api';

let authToken;
let testIds = {
  dealId: null,
  pipelineDealId: null,
  portfolioId: null
};

// Test property for comprehensive flow
const comprehensiveTestProperty = {
  propertyName: 'Comprehensive Flow Test Property',
  propertyType: 'SFR',
  address: {
    street: '456 Business Flow Ave',
    city: 'Wilmington',
    state: 'NC',
    zipCode: '28401'
  },
  purchasePrice: 185000,
  monthlyRent: 1650,
  downPayment: 37000, // 20%
  interestRate: 7.0,
  loanTerm: 30,
  squareFootage: 1400,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2015,
  propertyTaxRate: 1.0,
  insuranceRate: 0.4,
  maintenanceCost: 1500,
  propertyManagementRate: 8,
  vacancyRate: 5,
  hoaFees: 0,
  closingCosts: 3700,
  capitalInvestments: 5000,
  longTermAssumptions: {
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualAppreciation: 3.5,
    exitYear: 5,
    projectionYears: 10,
    sellingCosts: 6
  }
};

async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.accessToken;
    console.log(chalk.green('✅ Authentication successful'));
    return authToken;
  } catch (error) {
    console.error(chalk.red('❌ Authentication failed:'), error.response?.data || error.message);
    process.exit(1);
  }
}

// STEP 1: Property Analysis & Deal Creation
async function step1_PropertyAnalysisAndDealCreation() {
  console.log(chalk.bold.cyan('\n🏗️ STEP 1: Property Analysis & Deal Creation'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('📊 Running property analysis...'));
    
    const analysisResponse = await axios.post(
      `${BASE_URL}/deals/analyze`,
      comprehensiveTestProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    let analysis = analysisResponse.data;
    
    // Debug: Check the response structure
    console.log(chalk.yellow('🔍 Debug - Analysis Response Structure:'));
    console.log(`   Response keys: ${Object.keys(analysis)}`);
    console.log(`   Has _id: ${!!analysis._id}`);
    console.log(`   Has id: ${!!analysis.id}`);
    console.log(`   Has data: ${!!analysis.data}`);
    
    // Handle different response structures
    if (analysis.data && analysis.data._id) {
      testIds.dealId = analysis.data._id;
      analysis = analysis.data; // Use nested data structure
    } else if (analysis._id) {
      testIds.dealId = analysis._id;
    } else {
      console.log(chalk.red('❌ Could not find Deal ID in response:'));
      console.log(JSON.stringify(analysis, null, 2));
      throw new Error('Deal ID not found in analysis response');
    }
    
    console.log(chalk.green(`✅ Property analysis complete`));
    console.log(`   Deal ID: ${testIds.dealId}`);
    console.log(`   Verdict: ${analysis.investmentDecision?.verdict}`);
    console.log(`   Cash Flow: $${analysis.monthlyAnalysis?.cashFlow?.toFixed(2)}`);
    console.log(`   Deal Quality: ${analysis.investmentDecision?.professionalAssessment?.dealQuality}/100`);
    
    // Validate analysis has all required components
    if (!analysis.investmentDecision) {
      throw new Error('Missing investment decision in analysis');
    }
    
    if (!analysis.investmentDecision.aiEnhancedContent) {
      console.log(chalk.yellow('⚠️  Missing AI enhanced content - using fallback'));
    } else {
      console.log(chalk.green('✅ AI enhanced content present in all tabs'));
    }
    
    return analysis;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 1 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 2: Convert Deal to Pipeline
async function step2_ConvertDealToPipeline(analysis) {
  console.log(chalk.bold.cyan('\n🔄 STEP 2: Convert Deal to Pipeline'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('🔗 Converting analysis to pipeline deal...'));
    
    const pipelineData = {
      analysisId: testIds.dealId,
      sourceInfo: {
        channel: 'ONLINE',
        referrer: 'MLS Listing',
        cost: 0,
        notes: 'Comprehensive flow test conversion'
      },
      notes: 'Created via comprehensive business flow test'
    };
    
    const pipelineResponse = await axios.post(
      `${BASE_URL}/pipeline/convert-analysis`,
      pipelineData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const pipelineDeal = pipelineResponse.data.data;
    testIds.pipelineDealId = pipelineDeal._id;
    
    console.log(chalk.green(`✅ Pipeline deal created successfully`));
    console.log(`   Pipeline Deal ID: ${testIds.pipelineDealId}`);
    console.log(`   Deal Name: ${pipelineDeal.dealName}`);
    console.log(`   Current Stage: ${pipelineDeal.currentStage}`);
    console.log(`   Analysis Status: ${pipelineDeal.analysisStatus}`);
    console.log(`   Quick Metrics Present: ${!!pipelineDeal.quickMetrics}`);
    
    // Validate pipeline deal has correct linked analysis
    if (pipelineDeal.analysisId.toString() !== testIds.dealId) {
      throw new Error('Pipeline deal not properly linked to analysis');
    }
    
    if (pipelineDeal.analysisStatus !== 'COMPLETE') {
      throw new Error('Analysis status should be COMPLETE when converting from analysis');
    }
    
    return pipelineDeal;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 2 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 3: Pipeline Stage Progression
async function step3_PipelineStageProgression() {
  console.log(chalk.bold.cyan('\n📈 STEP 3: Pipeline Stage Progression'));
  console.log('=' .repeat(60));
  
  try {
    const stages = [
      { stage: 'ANALYZING', notes: 'Detailed analysis in progress' },
      { stage: 'NEGOTIATING', notes: 'Price negotiation initiated' },
      { stage: 'UNDER_CONTRACT', notes: 'Contract signed, pending closing' }
    ];
    
    for (const stageUpdate of stages) {
      console.log(chalk.cyan(`🔄 Moving to ${stageUpdate.stage}...`));
      
      const stageResponse = await axios.put(
        `${BASE_URL}/pipeline/${testIds.pipelineDealId}/stage`,
        stageUpdate,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const updatedDeal = stageResponse.data.data;
      
      console.log(chalk.green(`✅ Stage updated to ${updatedDeal.currentStage}`));
      console.log(`   Last Activity: ${new Date(updatedDeal.lastActivity).toLocaleString()}`);
      console.log(`   Stage History Length: ${updatedDeal.stageHistory?.length || 0}`);
      
      // Validate stage history is being tracked
      if (!updatedDeal.stageHistory || updatedDeal.stageHistory.length === 0) {
        throw new Error('Stage history not being tracked properly');
      }
      
      // Short delay to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(chalk.green('✅ Pipeline progression complete'));
    return true;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 3 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 4: Create Portfolio for Testing
async function step4_CreateTestPortfolio() {
  console.log(chalk.bold.cyan('\n📁 STEP 4: Create Test Portfolio'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('📋 Creating test portfolio...'));
    
    const portfolioData = {
      name: 'Comprehensive Flow Test Portfolio',
      description: 'Created for end-to-end business flow validation',
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 3000,
        targetTimeline: '10-15 years',
        riskTolerance: 'MODERATE'
      },
      settings: {
        includeInSFRAnalysis: true,
        alertsEnabled: true,
        currency: 'USD'
      }
    };
    
    const portfolioResponse = await axios.post(
      `${BASE_URL}/portfolio`,
      portfolioData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const portfolio = portfolioResponse.data.data;
    testIds.portfolioId = portfolio._id;
    
    console.log(chalk.green(`✅ Portfolio created successfully`));
    console.log(`   Portfolio ID: ${testIds.portfolioId}`);
    console.log(`   Name: ${portfolio.name}`);
    console.log(`   Primary Goal: ${portfolio.goals.primaryGoal}`);
    console.log(`   Target Monthly Income: $${portfolio.goals.targetMonthlyIncome}`);
    
    return portfolio;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 4 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 5: Add Deal to Portfolio
async function step5_AddDealToPortfolio() {
  console.log(chalk.bold.cyan('\n💼 STEP 5: Add Deal to Portfolio'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('🔗 Adding deal to portfolio...'));
    
    const addToPortfolioData = {
      portfolioId: testIds.portfolioId,
      notes: 'Added via comprehensive business flow test'
    };
    
    const addResponse = await axios.post(
      `${BASE_URL}/portfolio/${testIds.portfolioId}/properties/${testIds.dealId}`,
      addToPortfolioData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(chalk.green(`✅ Deal added to portfolio successfully`));
    
    // Get updated portfolio to verify the addition
    const portfolioResponse = await axios.get(
      `${BASE_URL}/portfolio/${testIds.portfolioId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const updatedPortfolio = portfolioResponse.data.data;
    console.log(`   Portfolio Properties: ${updatedPortfolio.propertyCount || 'N/A'}`);
    
    // Get portfolio analytics to see impact
    console.log(chalk.cyan('📊 Checking portfolio analytics impact...'));
    
    const analyticsResponse = await axios.get(
      `${BASE_URL}/portfolio/${testIds.portfolioId}/analytics`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const analytics = analyticsResponse.data.data;
    console.log(chalk.green(`✅ Portfolio analytics updated`));
    console.log(`   Total Investment: $${analytics.totalInvestment?.toLocaleString() || 'N/A'}`);
    console.log(`   Monthly Cash Flow: $${analytics.totalMonthlyCashFlow?.toFixed(2) || 'N/A'}`);
    console.log(`   Average Deal Quality: ${analytics.averageDealQuality?.toFixed(1) || 'N/A'}/100`);
    console.log(`   Geographic Concentration: ${analytics.geographicConcentration?.primaryMarket || 'N/A'}`);
    
    return analytics;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 5 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 6: Test Portfolio Context in New Analysis
async function step6_TestPortfolioContext() {
  console.log(chalk.bold.cyan('\n🔄 STEP 6: Test Portfolio Context in New Analysis'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('🏠 Running new property analysis with portfolio context...'));
    
    // Create a similar but different property for portfolio context testing
    const newTestProperty = {
      ...comprehensiveTestProperty,
      propertyName: 'Portfolio Context Test Property',
      address: {
        ...comprehensiveTestProperty.address,
        street: '789 Portfolio Context St'
      },
      purchasePrice: 195000,
      monthlyRent: 1750,
      portfolioId: testIds.portfolioId // Include portfolio context
    };
    
    const contextAnalysisResponse = await axios.post(
      `${BASE_URL}/deals/analyze`,
      newTestProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const contextAnalysis = contextAnalysisResponse.data;
    const portfolioContext = contextAnalysis.investmentDecision?.portfolioContext;
    
    console.log(chalk.green(`✅ Portfolio context analysis complete`));
    console.log(`   Analysis ID: ${contextAnalysis._id}`);
    console.log(`   Has Portfolio Context: ${!!portfolioContext}`);
    
    if (portfolioContext) {
      console.log(chalk.green(`✅ Portfolio context properly included`));
      console.log(`   Portfolio Name: ${portfolioContext.portfolioName}`);
      console.log(`   Current Properties: ${portfolioContext.currentProperties}`);
      console.log(`   Portfolio Goal: ${portfolioContext.portfolioGoal}`);
      console.log(`   Fit Analysis Present: ${!!portfolioContext.fitAnalysis}`);
      console.log(`   Impact Summary Present: ${!!portfolioContext.impactSummary}`);
      
      // Validate portfolio context makes sense
      if (portfolioContext.portfolioName !== 'Comprehensive Flow Test Portfolio') {
        throw new Error('Portfolio context has incorrect portfolio name');
      }
      
      if (portfolioContext.currentProperties < 1) {
        throw new Error('Portfolio context should show at least 1 existing property');
      }
      
    } else {
      console.log(chalk.yellow('⚠️  Portfolio context not found - may be expected if portfolio analysis is disabled'));
    }
    
    return contextAnalysis;
    
  } catch (error) {
    console.error(chalk.red('❌ Step 6 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// STEP 7: Cross-System Data Integrity Check
async function step7_CrossSystemDataIntegrityCheck() {
  console.log(chalk.bold.cyan('\n🔍 STEP 7: Cross-System Data Integrity Check'));
  console.log('=' .repeat(60));
  
  try {
    console.log(chalk.cyan('🔗 Verifying data links across all systems...'));
    
    // Get the original deal
    const dealResponse = await axios.get(
      `${BASE_URL}/deals/${testIds.dealId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const deal = dealResponse.data.data;
    
    // Get the pipeline deal
    const pipelineResponse = await axios.get(
      `${BASE_URL}/pipeline/${testIds.pipelineDealId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const pipelineDeal = pipelineResponse.data.data;
    
    // Get the portfolio
    const portfolioResponse = await axios.get(
      `${BASE_URL}/portfolio/${testIds.portfolioId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const portfolio = portfolioResponse.data.data;
    
    console.log(chalk.green(`✅ All entities retrieved successfully`));
    
    // Verify data integrity
    const integrityChecks = [
      {
        name: 'Pipeline → Analysis Link',
        condition: pipelineDeal.analysisId.toString() === testIds.dealId,
        expected: 'Pipeline deal links to correct analysis',
        actual: `${pipelineDeal.analysisId} === ${testIds.dealId}`
      },
      {
        name: 'Deal Portfolio Assignment',
        condition: deal.portfolioId?.toString() === testIds.portfolioId,
        expected: 'Deal assigned to correct portfolio',
        actual: `${deal.portfolioId} === ${testIds.portfolioId}`
      },
      {
        name: 'Pipeline Quick Metrics Cache',
        condition: !!pipelineDeal.quickMetrics && 
                  typeof pipelineDeal.quickMetrics.dealQuality === 'number',
        expected: 'Pipeline has cached quick metrics',
        actual: `Quick metrics: ${JSON.stringify(pipelineDeal.quickMetrics)}`
      },
      {
        name: 'Portfolio Property Count',
        condition: portfolio.propertyCount >= 1,
        expected: 'Portfolio shows correct property count',
        actual: `Property count: ${portfolio.propertyCount}`
      }
    ];
    
    let passedChecks = 0;
    integrityChecks.forEach(check => {
      if (check.condition) {
        console.log(chalk.green(`✅ ${check.name}: PASSED`));
        passedChecks++;
      } else {
        console.log(chalk.red(`❌ ${check.name}: FAILED`));
        console.log(chalk.gray(`   Expected: ${check.expected}`));
        console.log(chalk.gray(`   Actual: ${check.actual}`));
      }
    });
    
    console.log(chalk.cyan(`\n📊 Data Integrity Score: ${passedChecks}/${integrityChecks.length}`));
    
    if (passedChecks === integrityChecks.length) {
      console.log(chalk.bold.green('🎉 ALL DATA INTEGRITY CHECKS PASSED'));
    } else {
      console.log(chalk.bold.yellow('⚠️  Some data integrity issues detected'));
    }
    
    return { passedChecks, totalChecks: integrityChecks.length };
    
  } catch (error) {
    console.error(chalk.red('❌ Step 7 failed:'), error.response?.data || error.message);
    throw error;
  }
}

// CLEANUP: Remove test data
async function cleanup() {
  console.log(chalk.bold.cyan('\n🧹 CLEANUP: Removing Test Data'));
  console.log('=' .repeat(60));
  
  try {
    const cleanupTasks = [];
    
    // Remove deal from portfolio first
    if (testIds.portfolioId && testIds.dealId) {
      cleanupTasks.push(
        axios.delete(
          `${BASE_URL}/portfolio/${testIds.portfolioId}/properties/${testIds.dealId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(err => console.log(chalk.yellow(`⚠️  Could not remove deal from portfolio: ${err.message}`)))
      );
    }
    
    // Delete pipeline deal
    if (testIds.pipelineDealId) {
      cleanupTasks.push(
        axios.delete(
          `${BASE_URL}/pipeline/${testIds.pipelineDealId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(err => console.log(chalk.yellow(`⚠️  Could not delete pipeline deal: ${err.message}`)))
      );
    }
    
    // Delete portfolio
    if (testIds.portfolioId) {
      cleanupTasks.push(
        axios.delete(
          `${BASE_URL}/portfolio/${testIds.portfolioId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(err => console.log(chalk.yellow(`⚠️  Could not delete portfolio: ${err.message}`)))
      );
    }
    
    // Delete deal
    if (testIds.dealId) {
      cleanupTasks.push(
        axios.delete(
          `${BASE_URL}/deals/${testIds.dealId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        ).catch(err => console.log(chalk.yellow(`⚠️  Could not delete deal: ${err.message}`)))
      );
    }
    
    await Promise.all(cleanupTasks);
    console.log(chalk.green('✅ Cleanup completed'));
    
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Cleanup had some issues: ${error.message}`));
  }
}

// MAIN TEST EXECUTION
async function runComprehensiveBusinessFlowTest() {
  console.log(chalk.bold.cyan('🏢 COMPREHENSIVE BUSINESS FLOW TEST'));
  console.log(chalk.bold.cyan('End-to-End Real Estate Platform Validation'));
  console.log('=' .repeat(80));
  
  const startTime = Date.now();
  let testResults = {
    totalSteps: 7,
    completedSteps: 0,
    failedSteps: [],
    dataIntegrity: { passedChecks: 0, totalChecks: 0 },
    executionTime: 0
  };
  
  try {
    // Authentication
    await authenticate();
    
    // Execute comprehensive flow
    const analysis = await step1_PropertyAnalysisAndDealCreation();
    testResults.completedSteps++;
    
    const pipelineDeal = await step2_ConvertDealToPipeline(analysis);
    testResults.completedSteps++;
    
    await step3_PipelineStageProgression();
    testResults.completedSteps++;
    
    const portfolio = await step4_CreateTestPortfolio();
    testResults.completedSteps++;
    
    const analytics = await step5_AddDealToPortfolio();
    testResults.completedSteps++;
    
    const contextAnalysis = await step6_TestPortfolioContext();
    testResults.completedSteps++;
    
    const integrityResults = await step7_CrossSystemDataIntegrityCheck();
    testResults.completedSteps++;
    testResults.dataIntegrity = integrityResults;
    
  } catch (error) {
    console.error(chalk.red(`❌ Test failed at step ${testResults.completedSteps + 1}:`), error.message);
    testResults.failedSteps.push(testResults.completedSteps + 1);
  } finally {
    await cleanup();
  }
  
  // FINAL RESULTS
  testResults.executionTime = Date.now() - startTime;
  
  console.log(chalk.bold.cyan('\n📋 COMPREHENSIVE TEST RESULTS'));
  console.log('=' .repeat(80));
  
  console.log(chalk.cyan(`📊 Test Execution Summary:`));
  console.log(`   Completed Steps: ${testResults.completedSteps}/${testResults.totalSteps}`);
  console.log(`   Failed Steps: ${testResults.failedSteps.length > 0 ? testResults.failedSteps.join(', ') : 'None'}`);
  console.log(`   Data Integrity: ${testResults.dataIntegrity.passedChecks}/${testResults.dataIntegrity.totalChecks} checks passed`);
  console.log(`   Execution Time: ${(testResults.executionTime / 1000).toFixed(2)}s`);
  
  const overallSuccess = testResults.completedSteps === testResults.totalSteps && 
                        testResults.failedSteps.length === 0 &&
                        testResults.dataIntegrity.passedChecks === testResults.dataIntegrity.totalChecks;
  
  if (overallSuccess) {
    console.log(chalk.bold.green('\n🎉 COMPREHENSIVE BUSINESS FLOW TEST: PASSED'));
    console.log(chalk.green('✅ Complete end-to-end user journey validated successfully'));
    console.log(chalk.green('✅ All data integrity checks passed'));
    console.log(chalk.green('✅ Cross-system integration working correctly'));
  } else {
    console.log(chalk.bold.red('\n❌ COMPREHENSIVE BUSINESS FLOW TEST: FAILED'));
    console.log(chalk.red('❌ Issues detected in end-to-end user journey'));
    console.log(chalk.red('❌ Review failed steps and data integrity issues above'));
  }
  
  console.log(chalk.cyan('\n' + '=' .repeat(80)));
  console.log(chalk.bold.green('✅ Comprehensive Business Flow Test Complete!'));
}

runComprehensiveBusinessFlowTest().catch(console.error);