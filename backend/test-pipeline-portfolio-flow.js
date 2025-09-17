/**
 * PROPER PIPELINE & PORTFOLIO FLOW TEST
 * Testing complete business flow with correct API usage
 */

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const BASE_URL = 'http://localhost:3001/api';

let authToken;
let userId;

// Test properties
const fullyAnalyzedProperty = {
  propertyName: 'Fully Analyzed Property',
  propertyType: 'SFR',
  address: {
    street: '123 Main St',
    city: 'Fayetteville',
    state: 'NC',
    zipCode: '28301'
  },
  purchasePrice: 185000,
  monthlyRent: 1650,
  downPayment: 37000, // 20%
  interestRate: 7.0,
  loanTerm: 30,
  squareFootage: 1500,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2010,
  propertyTaxRate: 1.1,
  insuranceRate: 0.35,
  maintenanceCost: 1500,
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

const skinnyCalculatorProperty = {
  propertyName: 'Quick Analysis Property',
  address: {
    street: '456 Oak Ave',
    city: 'Raleigh',
    state: 'NC',
    zipCode: '27601'
  },
  purchasePrice: 220000,
  monthlyRent: 1800,
  downPayment: 44000,
  interestRate: 7.25,
  propertyType: 'SFR'
};

async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    authToken = response.data.accessToken;
    userId = response.data.user.id;
    console.log(chalk.green('✅ Authentication successful'));
    console.log(`   User ID: ${userId}`);
    return authToken;
  } catch (error) {
    console.error(chalk.red('❌ Authentication failed:'), error.response?.data || error.message);
    process.exit(1);
  }
}

async function testCompleteFlow() {
  console.log(chalk.bold.cyan('\n🚀 TESTING COMPLETE PIPELINE → PORTFOLIO FLOW'));
  console.log('=' .repeat(60));
  
  // Step 1: Analyze AND Save Property as Deal (Proper Flow)
  console.log(chalk.cyan('\n📊 STEP 1: Analyze & Save Property as Deal'));
  console.log('-'.repeat(40));
  
  let fullAnalysisId;
  let fullAnalysisResult;
  
  try {
    // 1a: Analyze property first
    console.log(chalk.cyan('🔍 Running property analysis...'));
    const analysisResponse = await axios.post(
      `${BASE_URL}/deals/analyze`,
      fullyAnalyzedProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    fullAnalysisResult = analysisResponse.data;
    
    console.log(chalk.green('✅ Analysis completed'));
    console.log(`   Verdict: ${fullAnalysisResult.investmentDecision?.verdict}`);
    console.log(`   Cash Flow: $${fullAnalysisResult.monthlyAnalysis?.cashFlow?.toFixed(2)}`);
    console.log(`   Cap Rate: ${fullAnalysisResult.keyMetrics?.capRate?.toFixed(2)}%`);
    
    // 1b: Save analysis as deal (CRITICAL STEP I was missing)
    console.log(chalk.cyan('💾 Saving analysis as deal...'));
    const dealData = {
      ...fullyAnalyzedProperty,
      propertyAddress: fullyAnalyzedProperty.address, // Deal schema expects propertyAddress
      analysis: fullAnalysisResult,
      notes: 'Created from comprehensive test analysis'
    };
    delete dealData.address; // Remove the old field
    
    const saveDealResponse = await axios.post(
      `${BASE_URL}/deals`,
      dealData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    fullAnalysisId = saveDealResponse.data.data?._id || saveDealResponse.data._id;
    
    console.log(chalk.green('✅ Deal saved successfully'));
    console.log(`   Deal ID: ${fullAnalysisId}`);
    
    // ✅ COMPREHENSIVE AI CONTENT VALIDATION (All 7 Investment Decision Tabs)
    console.log(chalk.cyan('\n🤖 Comprehensive AI Content Validation:'));
    const investmentDecision = fullAnalysisResult.investmentDecision;
    
    const aiValidation = {
      reasoning: !!investmentDecision?.aiEnhancedContent?.reasoning,
      professional: !!investmentDecision?.professionalAssessment,
      portfolio: !!investmentDecision?.portfolioContext,
      actionPlan: !!investmentDecision?.aiEnhancedContent?.actionPlan,
      capitalStrategy: !!investmentDecision?.aiEnhancedContent?.capitalStrategy,
      timeline: !!investmentDecision?.aiEnhancedContent?.timeline,
      alternatives: !!investmentDecision?.aiEnhancedContent?.alternatives
    };
    
    const validTabs = Object.values(aiValidation).filter(Boolean).length;
    console.log(`   AI Content Tabs: ${validTabs}/7`);
    
    Object.entries(aiValidation).forEach(([tab, present]) => {
      const status = present ? chalk.green('✅') : chalk.red('❌');
      console.log(`   ${tab}: ${status}`);
    });
    
    // Quality validation for AI content
    if (investmentDecision?.aiEnhancedContent?.reasoning) {
      const reasoning = investmentDecision.aiEnhancedContent.reasoning;
      console.log(`   Reasoning Quality: ${reasoning.keyStrengths?.length || 0} strengths, ${reasoning.keyConcerns?.length || 0} concerns`);
      
      // Hallucination detection
      if (reasoning.verdict && investmentDecision.verdict === 'BUY' && reasoning.verdict.toLowerCase().includes('avoid')) {
        console.log(chalk.red('   ❌ HALLUCINATION: Reasoning contradicts BUY verdict'));
      } else if (reasoning.verdict && investmentDecision.verdict === 'PASS' && reasoning.verdict.toLowerCase().includes('recommend')) {
        console.log(chalk.red('   ❌ HALLUCINATION: Reasoning contradicts PASS verdict'));
      } else {
        console.log(chalk.green('   ✅ No hallucinations detected'));
      }
    }
    
    // Professional Assessment validation
    if (investmentDecision?.professionalAssessment) {
      const prof = investmentDecision.professionalAssessment;
      console.log(`   Professional Scores: Deal ${prof.dealQuality}/100, Execution ${100 - (prof.executionDifficulty || 0)}/100`);
      
      // Validate scoring makes sense
      if (fullAnalysisResult.monthlyAnalysis?.cashFlow < 0 && prof.dealQuality > 70) {
        console.log(chalk.red('   ❌ INCONSISTENCY: High deal quality with negative cash flow'));
      } else {
        console.log(chalk.green('   ✅ Professional scoring aligns with metrics'));
      }
    }
    
    // Action plan validation
    if (investmentDecision?.aiEnhancedContent?.actionPlan) {
      const actionPlan = investmentDecision.aiEnhancedContent.actionPlan;
      const actionCount = (actionPlan.immediateActions?.length || 0) + 
                         (actionPlan.negotiationFocus?.length || 0) + 
                         (actionPlan.preparationItems?.length || 0);
      console.log(`   Action Plan: ${actionCount} total actions across all categories`);
    }
    
    const overallAIScore = validTabs >= 5 ? 'PASSED' : (validTabs >= 3 ? 'PARTIAL' : 'FAILED');
    console.log(chalk.cyan(`   Overall AI Validation: ${overallAIScore} (${validTabs}/7 tabs)`));
    
  } catch (error) {
    console.error(chalk.red('❌ Full analysis failed:'), error.response?.data || error.message);
    return;
  }
  
  // Step 2: Add to Pipeline
  console.log(chalk.cyan('\n🔄 STEP 2: Pipeline Management'));
  console.log('-'.repeat(40));
  
  let pipelineId;
  
  try {
    // First, check existing pipeline deals
    const existingDeals = await axios.get(
      `${BASE_URL}/pipeline/deals`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`   Existing pipeline deals: ${existingDeals.data.total || existingDeals.data.data?.length || 0}`);
    
    // Add analyzed deal to pipeline with REQUIRED fields
    const pipelineData = {
      dealName: fullyAnalyzedProperty.propertyName, // REQUIRED
      propertyType: 'SFR', // REQUIRED
      stage: 'ANALYZING', // REQUIRED - use enum value
      address: fullyAnalyzedProperty.address, // REQUIRED
      askingPrice: fullyAnalyzedProperty.purchasePrice, // REQUIRED
      sourceInfo: { // REQUIRED
        channel: 'ONLINE',
        notes: 'Added from full analysis'
      },
      monthlyRent: fullyAnalyzedProperty.monthlyRent,
      analysisId: fullAnalysisId, // Link to analysis
      notes: 'Added from full analysis test'
    };
    
    const pipelineResponse = await axios.post(
      `${BASE_URL}/pipeline/deals`,
      pipelineData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (pipelineResponse.data.success) {
      pipelineId = pipelineResponse.data.data._id || pipelineResponse.data.data.id;
      console.log(chalk.green('✅ Property added to pipeline'));
      console.log(`   Pipeline ID: ${pipelineId}`);
      console.log(`   Stage: ${pipelineResponse.data.data.stage}`);
    }
    
    // Move through pipeline stages using correct enum values
    const stages = ['NEGOTIATING', 'UNDER_CONTRACT', 'CLOSED'];
    
    for (const stage of stages) {
      try {
        const stageResponse = await axios.put(
          `${BASE_URL}/pipeline/deals/${pipelineId}/stage`,
          { stage },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (stageResponse.data.success) {
          console.log(chalk.green(`   ✅ Moved to stage: ${stage}`));
        }
      } catch (error) {
        console.log(chalk.yellow(`   ⚠️  Could not move to ${stage}: ${error.response?.data?.error || error.message}`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Pipeline operation failed:'), error.response?.data || error.message);
  }
  
  // Step 3: Create/Get Portfolio
  console.log(chalk.cyan('\n📂 STEP 3: Portfolio Setup'));
  console.log('-'.repeat(40));
  
  let portfolioId;
  
  try {
    // Check existing portfolios
    const portfoliosResponse = await axios.get(
      `${BASE_URL}/portfolios`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const portfolios = portfoliosResponse.data.portfolios || portfoliosResponse.data.data || [];
    
    if (portfolios.length > 0) {
      portfolioId = portfolios[0]._id || portfolios[0].id;
      console.log(chalk.green('✅ Using existing portfolio'));
      console.log(`   Portfolio ID: ${portfolioId}`);
      console.log(`   Name: ${portfolios[0].name}`);
    } else {
      // Create new portfolio with EXACT schema requirements
      const portfolioData = {
        name: 'Test Investment Portfolio',
        description: 'E2E Test Portfolio',
        goals: {
          primaryGoal: 'CASH_FLOW', // Exact enum value
          targetMonthlyIncome: 5000, // Required for CASH_FLOW goal
          targetTimeline: '5 years',
          riskTolerance: 'MODERATE' // Uppercase enum
        },
        settings: {
          includeInSFRAnalysis: true,
          alertsEnabled: true,
          currency: 'USD'
        }
      };
      
      const createResponse = await axios.post(
        `${BASE_URL}/portfolios`,
        portfolioData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (createResponse.data.success) {
        const portfolio = createResponse.data.portfolio || createResponse.data.data;
        portfolioId = portfolio._id || portfolio.id;
        console.log(chalk.green('✅ Portfolio created'));
        console.log(`   Portfolio ID: ${portfolioId}`);
        console.log(`   Name: ${portfolio.name}`);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Portfolio setup failed:'), error.response?.data || error.message);
    return;
  }
  
  // Step 4: Get portfolio metrics BEFORE adding property
  console.log(chalk.cyan('\n📊 STEP 4: Portfolio Metrics BEFORE'));
  console.log('-'.repeat(40));
  
  let beforeMetrics;
  
  try {
    const beforeResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const portfolio = beforeResponse.data.portfolio || beforeResponse.data.data || beforeResponse.data;
    beforeMetrics = portfolio.analytics || portfolio.metrics || {};
    
    console.log('Portfolio metrics before adding property:');
    console.log(`   Total Properties: ${beforeMetrics.totalProperties || 0}`);
    console.log(`   Total Investment: $${(beforeMetrics.totalInvestment || 0).toLocaleString()}`);
    console.log(`   Monthly Cash Flow: $${(beforeMetrics.totalMonthlyCashFlow || 0).toFixed(2)}`);
    console.log(`   Average Cap Rate: ${(beforeMetrics.averageCapRate || 0).toFixed(2)}%`);
    console.log(`   Portfolio Value: $${(beforeMetrics.totalValue || 0).toLocaleString()}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Could not get portfolio metrics:'), error.response?.data || error.message);
  }
  
  // Step 5: Add properties to portfolio
  console.log(chalk.cyan('\n➕ STEP 5: Adding Properties to Portfolio'));
  console.log('-'.repeat(40));
  
  try {
    // Add the fully analyzed property
    if (fullAnalysisId) {
      console.log(chalk.cyan(`🏠 Adding deal ${fullAnalysisId} to portfolio ${portfolioId}...`));
      const addResponse = await axios.post(
        `${BASE_URL}/portfolios/${portfolioId}/properties`,
        { 
          propertyId: fullAnalysisId, // Controller expects propertyId, not dealId
          notes: 'Added from comprehensive test'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (addResponse.data.success) {
        console.log(chalk.green('✅ Added fully analyzed property to portfolio'));
      }
    }
    
    // Test skinny calculator property
    console.log('\n📱 Testing Skinny Calculator Property:');
    
    // First do quick analysis
    const quickAnalysisResponse = await axios.post(
      `${BASE_URL}/quick-analysis/calculate`, // or whatever the skinny calculator endpoint is
      skinnyCalculatorProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (quickAnalysisResponse.data) {
      console.log(chalk.green('✅ Quick analysis completed'));
      console.log(`   Monthly Cash Flow: $${quickAnalysisResponse.data.monthlyFlow || 'N/A'}`);
      console.log(`   Cap Rate: ${quickAnalysisResponse.data.capRate || 'N/A'}%`);
      
      // Add to portfolio
      const addQuickResponse = await axios.post(
        `${BASE_URL}/portfolios/${portfolioId}/properties`,
        {
          property: skinnyCalculatorProperty,
          quickMetrics: quickAnalysisResponse.data,
          propertyType: 'quick' // Indicate it's from skinny calculator
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (addQuickResponse.data.success) {
        console.log(chalk.green('✅ Added quick analysis property to portfolio'));
      }
    }
    
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not add all properties:'), error.response?.data?.error || error.message);
  }
  
  // Step 6: Recalculate Analytics & Get Updated Portfolio Metrics
  console.log(chalk.cyan('\n📊 STEP 6: Portfolio Metrics AFTER (With Analytics Recalculation)'));
  console.log('-'.repeat(40));
  
  try {
    // 6a: Manually recalculate analytics (correct workflow)
    console.log(chalk.cyan('🔄 Recalculating portfolio analytics...'));
    const recalcResponse = await axios.post(
      `${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (recalcResponse.data.success) {
      console.log(chalk.green('✅ Portfolio analytics recalculated'));
    }
    
    // 6b: Get updated portfolio with fresh analytics
    console.log(chalk.cyan('📊 Fetching updated portfolio metrics...'));
    const afterResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const portfolio = afterResponse.data.portfolio || afterResponse.data.data || afterResponse.data;
    const afterMetrics = portfolio.analytics || portfolio.metrics || {};
    
    console.log('Portfolio metrics after adding properties:');
    console.log(`   Total Properties: ${afterMetrics.totalProperties || 0}`);
    console.log(`   Total Investment: $${(afterMetrics.totalInvestment || 0).toLocaleString()}`);
    console.log(`   Monthly Cash Flow: $${(afterMetrics.totalMonthlyCashFlow || 0).toFixed(2)}`);
    console.log(`   Average Cap Rate: ${(afterMetrics.averageCapRate || 0).toFixed(2)}%`);
    console.log(`   Portfolio Value: $${(afterMetrics.totalValue || 0).toLocaleString()}`);
    
    // Calculate impact
    console.log(chalk.cyan('\n📈 Impact Analysis:'));
    const propertyIncrease = (afterMetrics.totalProperties || 0) - (beforeMetrics.totalProperties || 0);
    const cashFlowIncrease = (afterMetrics.totalMonthlyCashFlow || 0) - (beforeMetrics.totalMonthlyCashFlow || 0);
    const investmentIncrease = (afterMetrics.totalInvestment || 0) - (beforeMetrics.totalInvestment || 0);
    
    console.log(`   Properties Added: ${propertyIncrease}`);
    console.log(`   Cash Flow Change: $${cashFlowIncrease.toFixed(2)}/month`);
    console.log(`   Investment Change: $${investmentIncrease.toLocaleString()}`);
    
    if (propertyIncrease > 0) {
      console.log(chalk.green('✅ Portfolio successfully updated with new properties'));
    } else {
      console.log(chalk.yellow('⚠️  No change in portfolio metrics'));
    }
    
    // Check for AI insights
    if (portfolio.aiInsights) {
      console.log(chalk.cyan('\n🤖 Portfolio AI Insights:'));
      console.log(`   Health Score: ${portfolio.aiInsights.healthScore || 'N/A'}`);
      console.log(`   Risk Level: ${portfolio.aiInsights.riskLevel || 'N/A'}`);
      console.log(`   Recommendations: ${portfolio.aiInsights.recommendations?.length || 0} suggestions`);
      
      if (portfolio.aiInsights.summary) {
        console.log(chalk.gray(`   Summary: "${portfolio.aiInsights.summary.substring(0, 100)}..."`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Could not get final portfolio metrics:'), error.response?.data || error.message);
  }
  
  // Step 7: Test Portfolio AI Intelligence (Using Correct Endpoints)
  console.log(chalk.cyan('\n🧠 STEP 7: Portfolio AI Intelligence'));
  console.log('-'.repeat(40));
  
  try {
    // Test Portfolio Health Check AI (correct endpoint)
    console.log(chalk.cyan('🏥 Testing Portfolio Health Check AI...'));
    const healthResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}/health-check`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (healthResponse.data.success) {
      console.log(chalk.green('✅ Portfolio Health Check AI:'));
      const health = healthResponse.data.data || healthResponse.data;
      console.log(`   Overall Health: ${health.overallHealth || 'N/A'}`);
      console.log(`   Diversification Score: ${health.diversificationScore || 'N/A'}`);
      console.log(`   Performance Rating: ${health.performanceRating || 'N/A'}`);
      console.log(`   Risk Assessment: ${health.riskAssessment || 'N/A'}`);
    }
    
    // Test Comprehensive AI Insights (correct endpoint)  
    console.log(chalk.cyan('🤖 Testing Comprehensive AI Insights...'));
    const insightsResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}/comprehensive-insights`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (insightsResponse.data.success) {
      console.log(chalk.green('✅ Comprehensive AI Insights:'));
      const insights = insightsResponse.data.data || insightsResponse.data.insights || {};
      console.log(`   AI-Generated Recommendations: ${insights.recommendations?.length || 0}`);
      console.log(`   Risk Warnings: ${insights.risks?.length || 0}`);
      console.log(`   Growth Opportunities: ${insights.opportunities?.length || 0}`);
      console.log(`   Optimization Strategies: ${insights.optimizations?.length || 0}`);
      
      // Portfolio AI Content Quality Validation
      if (insights.summary) {
        console.log(chalk.green('✅ Portfolio AI Summary Generated'));
        console.log(chalk.gray(`   Summary: "${insights.summary.substring(0, 80)}..."`));
        
        // Check for portfolio AI hallucinations
        if (insights.summary.includes('$0') || 
            insights.summary.includes('undefined') ||
            insights.summary.includes('null') ||
            insights.summary.includes('NaN')) {
          console.log(chalk.red('   ❌ PORTFOLIO AI HALLUCINATION: Contains invalid data'));
        } else {
          console.log(chalk.green('   ✅ Portfolio AI content quality validated'));
        }
      }
      
      // Display sample recommendations
      if (insights.recommendations && insights.recommendations.length > 0) {
        console.log(chalk.green(`   Sample AI Recommendations:`));
        insights.recommendations.slice(0, 2).forEach((rec, index) => {
          const title = rec.title || rec.recommendation || rec;
          console.log(chalk.gray(`     ${index + 1}. ${title.substring(0, 60)}...`));
        });
      }
    }
    
    // Test Goal Achievement Path AI
    console.log(chalk.cyan('🎯 Testing Goal Achievement Path AI...'));
    const goalPathResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}/goal-path`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (goalPathResponse.data.success) {
      console.log(chalk.green('✅ Goal Achievement Path AI Available'));
      const goalPath = goalPathResponse.data.data || {};
      console.log(`   Goal Progress: ${goalPath.currentProgress || 'N/A'}%`);
      console.log(`   Recommended Actions: ${goalPath.nextSteps?.length || 0}`);
      console.log(`   Timeline to Goal: ${goalPath.timelineToGoal || 'N/A'}`);
    }
    
    // Test Peer Comparison Intelligence
    console.log(chalk.cyan('📊 Testing Peer Comparison Intelligence...'));
    const peerResponse = await axios.get(
      `${BASE_URL}/portfolios/${portfolioId}/peer-comparison`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (peerResponse.data.success) {
      console.log(chalk.green('✅ Peer Comparison Intelligence Available'));
      const peerData = peerResponse.data.data || {};
      console.log(`   Peer Ranking: ${peerData.ranking || 'N/A'}`);
      console.log(`   Performance vs Peers: ${peerData.performanceVsPeers || 'N/A'}`);
    }
    
  } catch (error) {
    console.log(chalk.yellow('⚠️  Portfolio AI endpoint error:'), error.response?.status, error.response?.data?.error || error.message);
  }
}

// Main execution
async function runTests() {
  console.log(chalk.bold.cyan('🏠 REAL ESTATE ANALYZER - PIPELINE & PORTFOLIO TEST'));
  console.log(chalk.bold.cyan('=' .repeat(60)));
  
  await authenticate();
  await testCompleteFlow();
  
  console.log(chalk.cyan('\n' + '=' .repeat(60)));
  console.log(chalk.bold.green('✅ Test Complete!'));
}

runTests().catch(console.error);