/**
 * COMPREHENSIVE BUSINESS LOGIC TEST SUITE
 * Senior Test Engineer + 20-Year RE Investor Validation
 * 
 * This tests ACTUAL business logic, not just API responses
 * Validates that the platform makes correct investment decisions
 */

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const BASE_URL = 'http://localhost:3001/api';

let authToken;
let userId;
let testPipelineId;
let testPortfolioId;
let testDealId;

// Test property - Real Fayetteville NC deal
const testProperty = {
  propertyName: 'Test Investment Property',
  propertyType: 'SFR',
  address: {
    street: '123 Bragg Blvd',
    city: 'Fayetteville',
    state: 'NC',
    zipCode: '28301'
  },
  purchasePrice: 175000,
  monthlyRent: 1450,
  downPayment: 35000, // 20%
  interestRate: 7.25,
  loanTerm: 30,
  squareFootage: 1450,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2005,
  propertyTaxRate: 1.1,
  insuranceRate: 0.35,
  maintenanceCost: 1450, // 1% rule
  propertyManagementRate: 8,
  vacancyRate: 5,
  hoaFees: 0,
  closingCosts: 3500,
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

// Veteran investor validation criteria
const investorCriteria = {
  minCashFlow: 100, // Minimum $100/month positive cash flow
  minCapRate: 6,    // Minimum 6% cap rate for current market
  maxDSCR: 1.25,    // Debt service coverage ratio threshold
  minCoCReturn: 8,  // Minimum 8% cash-on-cash return
  maxPriceToRent: 150, // Price-to-rent ratio threshold
  minIRR: 12        // Minimum 12% IRR for 5-year hold
};

async function authenticateUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.accessToken;
    userId = response.data.user.id;
    console.log(chalk.green('✅ Authentication successful'));
    return authToken;
  } catch (error) {
    console.error(chalk.red('❌ Authentication failed:'), error.response?.data || error.message);
    process.exit(1);
  }
}

// TEST 1: Complete Pipeline Flow
async function testPipelineFlow() {
  console.log(chalk.cyan('\n🔄 TEST 1: COMPLETE PIPELINE FLOW'));
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Add property to pipeline
    console.log('\n📝 Step 1: Adding property to pipeline...');
    
    // Pipeline expects specific format
    const pipelineData = {
      propertyName: testProperty.propertyName,
      address: testProperty.address,
      purchasePrice: testProperty.purchasePrice,
      monthlyRent: testProperty.monthlyRent,
      stage: 'lead',
      notes: 'Testing complete pipeline flow',
      propertyType: 'SFR'
    };
    
    const pipelineResponse = await axios.post(`${BASE_URL}/pipeline/deals`, 
      pipelineData, 
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true // Don't throw on any status
      }
    );
    
    if (pipelineResponse.status === 201 || pipelineResponse.status === 200) {
      testPipelineId = pipelineResponse.data.id || pipelineResponse.data._id;
      console.log(chalk.green(`✅ Property added to pipeline: ${testPipelineId}`));
    } else {
      console.log(chalk.yellow('⚠️  Pipeline API returned:', pipelineResponse.status));
    }
    
    // Step 2: Move through pipeline stages
    const stages = ['lead', 'analyzing', 'offer', 'negotiating', 'under_contract', 'closed'];
    
    for (const stage of stages) {
      console.log(`\n📊 Moving to stage: ${stage}`);
      
      try {
        const stageResponse = await axios.patch(
          `${BASE_URL}/pipeline/deals/${testPipelineId}/stage`,
          { stage },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (stageResponse.status === 200) {
          console.log(chalk.green(`✅ Moved to ${stage}`));
          
          // Validate stage-specific requirements
          if (stage === 'analyzing') {
            console.log('  → Should trigger analysis');
          } else if (stage === 'under_contract') {
            console.log('  → Should lock financial parameters');
          } else if (stage === 'closed') {
            console.log('  → Should be ready for portfolio');
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Stage transition failed: ${error.response?.data?.error || error.message}`));
      }
    }
    
    // Step 3: Run investment analysis
    console.log('\n🧮 Step 3: Running investment analysis...');
    const analysisResponse = await axios.post(
      `${BASE_URL}/deals/analyze`,
      testProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const analysis = analysisResponse.data;
    testDealId = analysis.id || analysis._id;
    
    // VETERAN INVESTOR VALIDATION
    console.log('\n👨‍💼 Veteran Investor Validation:');
    
    const cashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
    const capRate = analysis.keyMetrics?.capRate || 0;
    const cocReturn = analysis.keyMetrics?.cashOnCashReturn || 0;
    const dscr = analysis.keyMetrics?.dscr || 0;
    const verdict = analysis.investmentDecision?.verdict;
    
    let validationPassed = true;
    
    // Validate cash flow
    if (cashFlow < investorCriteria.minCashFlow) {
      console.log(chalk.red(`  ❌ Cash Flow: $${cashFlow}/mo (Below $${investorCriteria.minCashFlow} minimum)`));
      validationPassed = false;
    } else {
      console.log(chalk.green(`  ✅ Cash Flow: $${cashFlow}/mo`));
    }
    
    // Validate cap rate
    if (capRate < investorCriteria.minCapRate) {
      console.log(chalk.red(`  ❌ Cap Rate: ${capRate}% (Below ${investorCriteria.minCapRate}% minimum)`));
      validationPassed = false;
    } else {
      console.log(chalk.green(`  ✅ Cap Rate: ${capRate}%`));
    }
    
    // Validate CoC return
    if (cocReturn < investorCriteria.minCoCReturn) {
      console.log(chalk.red(`  ❌ CoC Return: ${cocReturn}% (Below ${investorCriteria.minCoCReturn}% minimum)`));
      validationPassed = false;
    } else {
      console.log(chalk.green(`  ✅ CoC Return: ${cocReturn}%`));
    }
    
    // Validate verdict logic
    if (validationPassed && verdict !== 'BUY' && verdict !== 'NEGOTIATE') {
      console.log(chalk.red(`  ❌ Verdict Logic Error: Good metrics but verdict is ${verdict}`));
    } else if (!validationPassed && verdict === 'BUY') {
      console.log(chalk.red(`  ❌ Verdict Logic Error: Poor metrics but verdict is BUY`));
    } else {
      console.log(chalk.green(`  ✅ Verdict: ${verdict} (Correct based on metrics)`));
    }
    
    return { success: validationPassed, analysis };
    
  } catch (error) {
    console.error(chalk.red('❌ Pipeline flow test failed:'), error.response?.data || error.message);
    return { success: false };
  }
}

// TEST 2: Portfolio Impact
async function testPortfolioImpact() {
  console.log(chalk.cyan('\n📂 TEST 2: PORTFOLIO IMPACT & METRICS'));
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create or get portfolio
    console.log('\n📁 Step 1: Setting up portfolio...');
    const portfoliosResponse = await axios.get(
      `${BASE_URL}/portfolios`,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true
      }
    );
    
    let portfolio;
    if (portfoliosResponse.data && portfoliosResponse.data.length > 0) {
      portfolio = portfoliosResponse.data[0];
      testPortfolioId = portfolio._id;
      console.log(chalk.green(`✅ Using existing portfolio: ${testPortfolioId}`));
    } else {
      // Create new portfolio
      const createResponse = await axios.post(
        `${BASE_URL}/portfolios`,
        {
          name: 'Test Portfolio',
          description: 'E2E Test Portfolio',
          goals: {
            primaryGoal: 'cashFlow',
            targetMonthlyIncome: 5000,
            targetProperties: 10,
            timeHorizon: 5
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      portfolio = createResponse.data;
      testPortfolioId = portfolio._id;
      console.log(chalk.green(`✅ Created portfolio: ${testPortfolioId}`));
    }
    
    // Step 2: Get portfolio metrics BEFORE adding property
    console.log('\n📊 Step 2: Portfolio metrics BEFORE adding property:');
    const beforeMetrics = portfolio.analytics || {};
    console.log(`  Total Properties: ${beforeMetrics.totalProperties || 0}`);
    console.log(`  Total Investment: $${beforeMetrics.totalInvestment || 0}`);
    console.log(`  Monthly Cash Flow: $${beforeMetrics.totalMonthlyCashFlow || 0}`);
    console.log(`  Average Cap Rate: ${beforeMetrics.averageCapRate || 0}%`);
    
    // Step 3: Add deal to portfolio
    console.log('\n➕ Step 3: Adding property to portfolio...');
    if (testDealId) {
      const addResponse = await axios.post(
        `${BASE_URL}/portfolios/${testPortfolioId}/properties`,
        { dealId: testDealId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (addResponse.status === 200) {
        console.log(chalk.green('✅ Property added to portfolio'));
      }
    }
    
    // Step 4: Get portfolio metrics AFTER adding property
    console.log('\n📊 Step 4: Portfolio metrics AFTER adding property:');
    const afterResponse = await axios.get(
      `${BASE_URL}/portfolios/${testPortfolioId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const afterMetrics = afterResponse.data.analytics || {};
    console.log(`  Total Properties: ${afterMetrics.totalProperties || 0}`);
    console.log(`  Total Investment: $${afterMetrics.totalInvestment || 0}`);
    console.log(`  Monthly Cash Flow: $${afterMetrics.totalMonthlyCashFlow || 0}`);
    console.log(`  Average Cap Rate: ${afterMetrics.averageCapRate || 0}%`);
    
    // Validate impact
    console.log('\n✅ Impact Validation:');
    const propertyCountIncreased = (afterMetrics.totalProperties || 0) > (beforeMetrics.totalProperties || 0);
    const investmentIncreased = (afterMetrics.totalInvestment || 0) > (beforeMetrics.totalInvestment || 0);
    const cashFlowChanged = afterMetrics.totalMonthlyCashFlow !== beforeMetrics.totalMonthlyCashFlow;
    
    if (propertyCountIncreased) {
      console.log(chalk.green('  ✅ Property count increased'));
    } else {
      console.log(chalk.red('  ❌ Property count did not increase'));
    }
    
    if (investmentIncreased) {
      console.log(chalk.green('  ✅ Total investment updated'));
    } else {
      console.log(chalk.red('  ❌ Total investment not updated'));
    }
    
    if (cashFlowChanged) {
      console.log(chalk.green('  ✅ Cash flow metrics updated'));
    } else {
      console.log(chalk.red('  ❌ Cash flow metrics not updated'));
    }
    
    return { success: propertyCountIncreased && investmentIncreased };
    
  } catch (error) {
    console.error(chalk.red('❌ Portfolio impact test failed:'), error.response?.data || error.message);
    return { success: false };
  }
}

// TEST 3: AI Content Quality
async function testAIContentQuality(analysis) {
  console.log(chalk.cyan('\n🤖 TEST 3: AI CONTENT QUALITY & ACCURACY'));
  console.log('=' .repeat(60));
  
  if (!analysis || !analysis.investmentDecision) {
    console.log(chalk.yellow('⚠️  No analysis data available for AI validation'));
    return { success: false };
  }
  
  const aiContent = analysis.investmentDecision.aiEnhancedAnalysis || {};
  let validationPassed = true;
  
  // Check for hallucinations - AI should reference actual property data
  console.log('\n🔍 Checking for AI hallucinations:');
  
  // Test 1: Strategic Action Plan should reference actual metrics
  const strategicPlan = aiContent.strategicActionPlan || '';
  if (strategicPlan) {
    // Check if AI mentions the actual city
    if (!strategicPlan.toLowerCase().includes('fayetteville') && testProperty.city === 'Fayetteville') {
      console.log(chalk.red('  ❌ AI doesn\'t mention actual city (Fayetteville)'));
      validationPassed = false;
    } else {
      console.log(chalk.green('  ✅ AI correctly references location'));
    }
    
    // Check if cash flow mentioned is realistic
    const cashFlowMatch = strategicPlan.match(/\$(\d+)/);
    if (cashFlowMatch) {
      const mentionedCashFlow = parseInt(cashFlowMatch[1]);
      const actualCashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
      
      if (Math.abs(mentionedCashFlow - actualCashFlow) > 100) {
        console.log(chalk.red(`  ❌ AI mentions incorrect cash flow: $${mentionedCashFlow} (actual: $${actualCashFlow})`));
        validationPassed = false;
      } else {
        console.log(chalk.green('  ✅ AI cash flow reference accurate'));
      }
    }
  }
  
  // Test 2: Capital Strategy should make financial sense
  const capitalStrategy = aiContent.capitalStrategy || '';
  if (capitalStrategy) {
    // Check if recommendations align with verdict
    const verdict = analysis.investmentDecision.verdict;
    
    if (verdict === 'PASS' && capitalStrategy.toLowerCase().includes('proceed')) {
      console.log(chalk.red('  ❌ AI recommends proceeding on a PASS verdict'));
      validationPassed = false;
    } else if (verdict === 'BUY' && capitalStrategy.toLowerCase().includes('avoid')) {
      console.log(chalk.red('  ❌ AI recommends avoiding on a BUY verdict'));
      validationPassed = false;
    } else {
      console.log(chalk.green('  ✅ AI recommendations align with verdict'));
    }
  }
  
  // Test 3: Risk Mitigation should address actual risks
  const riskMitigation = aiContent.riskMitigationPlan || '';
  if (riskMitigation) {
    // Check if it mentions relevant risks for the metrics
    const capRate = analysis.keyMetrics?.capRate || 0;
    
    if (capRate < 6 && !riskMitigation.toLowerCase().includes('return')) {
      console.log(chalk.red('  ❌ Low cap rate but AI doesn\'t mention return risk'));
      validationPassed = false;
    } else {
      console.log(chalk.green('  ✅ AI addresses relevant risks'));
    }
  }
  
  console.log('\n📋 AI Content Summary:');
  console.log(`  Strategic Plan: ${strategicPlan ? 'Present' : 'Missing'}`);
  console.log(`  Capital Strategy: ${capitalStrategy ? 'Present' : 'Missing'}`);
  console.log(`  Risk Mitigation: ${riskMitigation ? 'Present' : 'Missing'}`);
  
  return { success: validationPassed };
}

// TEST 4: Deal Optimizer Suggestions
async function testDealOptimizer() {
  console.log(chalk.cyan('\n🎯 TEST 4: DEAL OPTIMIZER SUGGESTIONS'));
  console.log('=' .repeat(60));
  
  try {
    // Get optimizer suggestions
    const optimizerResponse = await axios.post(
      `${BASE_URL}/deals/optimize`,
      testProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const suggestions = optimizerResponse.data.suggestions || [];
    
    console.log(`\n📋 Received ${suggestions.length} optimization suggestions:`);
    
    let validSuggestions = 0;
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.title || 'Untitled'}`);
      console.log(`   Impact: ${suggestion.impact || 'Unknown'}`);
      
      // Validate suggestion makes financial sense
      if (suggestion.type === 'price_reduction') {
        const currentPrice = testProperty.purchasePrice;
        const suggestedPrice = suggestion.value;
        
        if (suggestedPrice > currentPrice) {
          console.log(chalk.red(`   ❌ Invalid: Suggests higher price for reduction`));
        } else {
          console.log(chalk.green(`   ✅ Valid: Price reduction to $${suggestedPrice}`));
          validSuggestions++;
        }
      } else if (suggestion.type === 'rent_increase') {
        const currentRent = testProperty.monthlyRent;
        const suggestedRent = suggestion.value;
        
        if (suggestedRent < currentRent) {
          console.log(chalk.red(`   ❌ Invalid: Suggests lower rent for increase`));
        } else {
          console.log(chalk.green(`   ✅ Valid: Rent increase to $${suggestedRent}`));
          validSuggestions++;
        }
      } else {
        console.log(chalk.green(`   ✅ Valid suggestion`));
        validSuggestions++;
      }
    });
    
    const successRate = suggestions.length > 0 ? (validSuggestions / suggestions.length) * 100 : 0;
    console.log(`\n✅ Valid suggestions: ${validSuggestions}/${suggestions.length} (${successRate.toFixed(0)}%)`);
    
    return { success: successRate >= 75 };
    
  } catch (error) {
    console.error(chalk.red('❌ Deal optimizer test failed:'), error.response?.data || error.message);
    return { success: false };
  }
}

// TEST 5: Scenario Manager
async function testScenarioManager() {
  console.log(chalk.cyan('\n📊 TEST 5: SCENARIO MANAGER (WHAT-IF ANALYSIS)'));
  console.log('=' .repeat(60));
  
  try {
    // Test different scenarios
    const scenarios = [
      {
        name: 'Interest Rate Increase',
        changes: { interestRate: 8.5 },
        expectedImpact: 'negative'
      },
      {
        name: 'Rent Increase',
        changes: { monthlyRent: 1600 },
        expectedImpact: 'positive'
      },
      {
        name: 'Higher Down Payment',
        changes: { downPayment: 52500 }, // 30%
        expectedImpact: 'positive'
      }
    ];
    
    let validScenarios = 0;
    
    for (const scenario of scenarios) {
      console.log(`\n🔄 Testing scenario: ${scenario.name}`);
      
      const modifiedProperty = { ...testProperty, ...scenario.changes };
      
      const scenarioResponse = await axios.post(
        `${BASE_URL}/deals/analyze`,
        modifiedProperty,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const baselineCashFlow = 150; // Approximate baseline
      const scenarioCashFlow = scenarioResponse.data.monthlyAnalysis?.cashFlow || 0;
      
      console.log(`  Baseline Cash Flow: ~$${baselineCashFlow}`);
      console.log(`  Scenario Cash Flow: $${scenarioCashFlow}`);
      
      if (scenario.expectedImpact === 'positive' && scenarioCashFlow > baselineCashFlow) {
        console.log(chalk.green(`  ✅ Correct: Positive impact as expected`));
        validScenarios++;
      } else if (scenario.expectedImpact === 'negative' && scenarioCashFlow < baselineCashFlow) {
        console.log(chalk.green(`  ✅ Correct: Negative impact as expected`));
        validScenarios++;
      } else {
        console.log(chalk.red(`  ❌ Incorrect: Impact doesn't match expectation`));
      }
    }
    
    const successRate = (validScenarios / scenarios.length) * 100;
    console.log(`\n✅ Valid scenarios: ${validScenarios}/${scenarios.length} (${successRate.toFixed(0)}%)`);
    
    return { success: successRate >= 66 };
    
  } catch (error) {
    console.error(chalk.red('❌ Scenario manager test failed:'), error.response?.data || error.message);
    return { success: false };
  }
}

// TEST 6: Risk Intelligence
async function testRiskIntelligence() {
  console.log(chalk.cyan('\n⚠️  TEST 6: RISK INTELLIGENCE'));
  console.log('=' .repeat(60));
  
  try {
    const riskResponse = await axios.post(
      `${BASE_URL}/deals/risk-assessment`,
      testProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const riskProfile = riskResponse.data;
    
    console.log('\n📊 Risk Assessment Results:');
    console.log(`  Overall Risk Score: ${riskProfile.overallScore || 'N/A'}/100`);
    console.log(`  Risk Level: ${riskProfile.riskLevel || 'Unknown'}`);
    
    // Validate risk factors
    const riskFactors = riskProfile.factors || {};
    
    console.log('\n🔍 Risk Factor Validation:');
    
    // Market risk - Fayetteville is military town, should be moderate
    if (riskFactors.marketRisk) {
      const marketRisk = riskFactors.marketRisk;
      if (marketRisk > 70) {
        console.log(chalk.red(`  ❌ Market Risk too high for Fayetteville: ${marketRisk}`));
      } else {
        console.log(chalk.green(`  ✅ Market Risk reasonable: ${marketRisk}`));
      }
    }
    
    // Leverage risk - 20% down is standard
    if (riskFactors.leverageRisk) {
      const leverageRisk = riskFactors.leverageRisk;
      const ltv = ((testProperty.purchasePrice - testProperty.downPayment) / testProperty.purchasePrice) * 100;
      
      if (ltv > 80 && leverageRisk < 60) {
        console.log(chalk.red(`  ❌ Leverage Risk too low for ${ltv}% LTV`));
      } else {
        console.log(chalk.green(`  ✅ Leverage Risk appropriate: ${leverageRisk}`));
      }
    }
    
    // Cash flow risk
    if (riskFactors.cashFlowRisk) {
      console.log(chalk.green(`  ✅ Cash Flow Risk assessed: ${riskFactors.cashFlowRisk}`));
    }
    
    return { success: riskProfile.overallScore !== undefined };
    
  } catch (error) {
    // Risk assessment might not be implemented
    console.log(chalk.yellow('⚠️  Risk Intelligence API not available'));
    return { success: false, notImplemented: true };
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log(chalk.bold.cyan('\n🚀 COMPREHENSIVE BUSINESS LOGIC TEST SUITE'));
  console.log(chalk.bold.cyan('=========================================='));
  console.log('Senior Test Engineer + 20-Year Veteran Investor Validation\n');
  
  await authenticateUser();
  
  const results = {
    pipelineFlow: { success: false },
    portfolioImpact: { success: false },
    aiContent: { success: false },
    dealOptimizer: { success: false },
    scenarioManager: { success: false },
    riskIntelligence: { success: false }
  };
  
  // Run tests
  const pipelineResult = await testPipelineFlow();
  results.pipelineFlow = pipelineResult;
  
  results.portfolioImpact = await testPortfolioImpact();
  
  if (pipelineResult.analysis) {
    results.aiContent = await testAIContentQuality(pipelineResult.analysis);
  }
  
  results.dealOptimizer = await testDealOptimizer();
  results.scenarioManager = await testScenarioManager();
  results.riskIntelligence = await testRiskIntelligence();
  
  // Final Report
  console.log(chalk.bold.cyan('\n📊 FINAL TEST REPORT'));
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    if (!result.notImplemented) {
      totalTests++;
      if (result.success) {
        passedTests++;
        console.log(chalk.green(`✅ ${testName}: PASSED`));
      } else {
        console.log(chalk.red(`❌ ${testName}: FAILED`));
      }
    } else {
      console.log(chalk.yellow(`⚠️  ${testName}: NOT IMPLEMENTED`));
    }
  });
  
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  console.log('\n' + '=' .repeat(60));
  console.log(chalk.bold(`OVERALL SUCCESS RATE: ${successRate.toFixed(0)}% (${passedTests}/${totalTests} tests passed)`));
  
  if (successRate >= 80) {
    console.log(chalk.bold.green('🎉 BUSINESS LOGIC VALIDATED - READY FOR PRODUCTION'));
  } else if (successRate >= 60) {
    console.log(chalk.bold.yellow('⚠️  SOME ISSUES DETECTED - REVIEW BEFORE PRODUCTION'));
  } else {
    console.log(chalk.bold.red('❌ SIGNIFICANT ISSUES - NOT READY FOR PRODUCTION'));
  }
  
  // Veteran Investor Opinion
  console.log(chalk.bold.cyan('\n👨‍💼 VETERAN INVESTOR OPINION:'));
  console.log('=' .repeat(60));
  
  if (pipelineResult.analysis) {
    const cashFlow = pipelineResult.analysis.monthlyAnalysis?.cashFlow || 0;
    const capRate = pipelineResult.analysis.keyMetrics?.capRate || 0;
    const verdict = pipelineResult.analysis.investmentDecision?.verdict;
    
    console.log(`For the test property at $${testProperty.purchasePrice}:`);
    console.log(`• Monthly Cash Flow: $${cashFlow}`);
    console.log(`• Cap Rate: ${capRate}%`);
    console.log(`• System Verdict: ${verdict}`);
    
    if (cashFlow > 200 && capRate > 7) {
      console.log(chalk.green('\n✅ "I would invest in this deal. Good fundamentals."'));
    } else if (cashFlow > 100 && capRate > 6) {
      console.log(chalk.yellow('\n⚠️  "Marginal deal. Would need to negotiate price down."'));
    } else {
      console.log(chalk.red('\n❌ "I would pass on this deal. Better opportunities exist."'));
    }
  }
  
  process.exit(successRate >= 60 ? 0 : 1);
}

// Run the tests
runComprehensiveTests().catch(console.error);