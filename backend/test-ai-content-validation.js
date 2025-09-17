/**
 * AI CONTENT VALIDATION TEST
 * Tests the AI-generated content in Investment Decision Engine tabs
 * Validates for hallucinations and contextual accuracy
 */

const axios = require('axios');
const chalk = require('chalk').default || require('chalk');

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const BASE_URL = 'http://localhost:3001/api';

let authToken;

// Test property with known values to check for hallucinations
const testProperty = {
  propertyName: 'Test Property for AI Validation',
  propertyType: 'SFR',
  address: {
    street: '789 Military Cutoff Rd',
    city: 'Fayetteville',
    state: 'NC',
    zipCode: '28301'
  },
  purchasePrice: 225000,
  monthlyRent: 1850,
  downPayment: 45000, // 20%
  interestRate: 7.25,
  loanTerm: 30,
  squareFootage: 1650,
  bedrooms: 4,
  bathrooms: 2.5,
  yearBuilt: 2012,
  propertyTaxRate: 1.15,
  insuranceRate: 0.35,
  maintenanceCost: 1800,
  propertyManagementRate: 8,
  vacancyRate: 5,
  hoaFees: 50,
  closingCosts: 4500,
  capitalInvestments: 8000,
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

async function validateAIContent() {
  console.log(chalk.bold.cyan('\n🤖 AI CONTENT VALIDATION TEST'));
  console.log('=' .repeat(60));
  
  try {
    // Run analysis
    const analysisResponse = await axios.post(
      `${BASE_URL}/deals/analyze`,
      testProperty,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const analysisData = analysisResponse.data;
    const investmentDecision = analysisData.investmentDecision;
    
    if (!investmentDecision) {
      console.log(chalk.red('❌ No investment decision in response'));
      return;
    }
    
    console.log(chalk.cyan('🔍 Checking AI Content Structure:'));
    console.log(`   Has aiEnhancedContent: ${!!investmentDecision.aiEnhancedContent}`);
    console.log(`   Has professionalAssessment: ${!!investmentDecision.professionalAssessment}`);
    console.log(`   Has portfolioContext: ${!!investmentDecision.portfolioContext}`);
    
    console.log(chalk.cyan('\n📊 Basic Analysis Results:'));
    console.log(`   Verdict: ${investmentDecision.verdict}`);
    console.log(`   Confidence: ${investmentDecision.confidence}%`);
    console.log(`   Deal Quality: ${investmentDecision.professionalAssessment?.dealQuality}/100`);
    
    // Extract actual metrics for validation
    const actualMetrics = {
      purchasePrice: testProperty.purchasePrice,
      monthlyRent: testProperty.monthlyRent,
      city: testProperty.address.city,
      cashFlow: analysisData.monthlyAnalysis?.cashFlow,
      capRate: analysisData.keyMetrics?.capRate,
      cocReturn: analysisData.keyMetrics?.cashOnCashReturn,
      dscr: analysisData.keyMetrics?.dscr
    };
    
    console.log(chalk.cyan('\n🔍 Actual Metrics for Validation:'));
    console.log(`   Purchase Price: $${actualMetrics.purchasePrice.toLocaleString()}`);
    console.log(`   Monthly Rent: $${actualMetrics.monthlyRent}`);
    console.log(`   Cash Flow: $${actualMetrics.cashFlow?.toFixed(2)}`);
    console.log(`   Cap Rate: ${actualMetrics.capRate?.toFixed(2)}%`);
    console.log(`   CoC Return: ${actualMetrics.cocReturn?.toFixed(2)}%`);
    
    // VALIDATE REASONING TAB (First tab in detailed view)
    console.log(chalk.cyan('\n1️⃣ REASONING TAB'));
    console.log('-'.repeat(40));
    
    const aiReasoning = investmentDecision.aiEnhancedContent?.reasoning;
    const fallbackReasons = {
      primary: investmentDecision.primaryReason,
      secondary: investmentDecision.secondaryReasons,
      risks: investmentDecision.keyRisks
    };
    
    if (aiReasoning) {
      console.log(`   AI-Enhanced Reasoning: Present`);
      console.log(`   Explanation: ${!!aiReasoning.explanation}`);
      console.log(`   Key Strengths: ${aiReasoning.keyStrengths?.length || 0}`);
      console.log(`   Key Concerns: ${aiReasoning.keyConcerns?.length || 0}`);
      console.log(`   Verdict Reasoning: ${!!aiReasoning.verdict}`);
      
      // Validate reasoning aligns with verdict
      if (aiReasoning.verdict) {
        const reasoningText = aiReasoning.verdict.toLowerCase();
        if (investmentDecision.verdict === 'BUY' && reasoningText.includes('avoid')) {
          console.log(chalk.red('   ❌ HALLUCINATION: Reasoning contradicts BUY verdict'));
        } else if (investmentDecision.verdict === 'PASS' && reasoningText.includes('recommend')) {
          console.log(chalk.red('   ❌ HALLUCINATION: Reasoning contradicts PASS verdict'));
        } else {
          console.log(chalk.green('   ✅ Reasoning aligns with verdict'));
        }
      }
    } else if (fallbackReasons.primary) {
      console.log(`   Fallback Reasoning: Present`);
      console.log(`   Primary Reason: ${!!fallbackReasons.primary}`);
      console.log(`   Secondary Reasons: ${fallbackReasons.secondary?.length || 0}`);
      console.log(`   Key Risks: ${fallbackReasons.risks?.length || 0}`);
    } else {
      console.log(chalk.yellow('   ⚠️  No reasoning content found'));
    }
    
    // VALIDATE PROFESSIONAL ANALYSIS TAB
    console.log(chalk.cyan('\n2️⃣ PROFESSIONAL ANALYSIS TAB'));
    console.log('-'.repeat(40));
    
    const professionalAnalysis = investmentDecision.professionalAssessment;
    if (professionalAnalysis) {
      // Check if scores make sense
      const scores = {
        dealQuality: professionalAnalysis.dealQuality,
        execution: professionalAnalysis.executionScore,
        dataQuality: professionalAnalysis.dataQualityScore
      };
      
      console.log(`   Deal Quality: ${scores.dealQuality}/100`);
      console.log(`   Execution: ${scores.execution}/100`);
      console.log(`   Data Quality: ${scores.dataQuality}/100`);
      
      // Validate scoring logic
      if (actualMetrics.cashFlow < 0 && scores.dealQuality > 70) {
        console.log(chalk.red('   ❌ HALLUCINATION: High deal quality with negative cash flow'));
      } else {
        console.log(chalk.green('   ✅ Deal quality score aligns with metrics'));
      }
    }
    
    // VALIDATE PORTFOLIO FIT TAB
    console.log(chalk.cyan('\n3️⃣ PORTFOLIO FIT TAB'));
    console.log('-'.repeat(40));
    
    const portfolioContext = investmentDecision.portfolioContext;
    if (portfolioContext) {
      console.log(`   Fit Analysis: ${portfolioContext.fitAnalysis ? 'Present' : 'Missing'}`);
      
      // Check for hallucinations in portfolio fit text
      if (portfolioContext.fitAnalysis) {
        const fitText = portfolioContext.fitAnalysis;
        
        // Check if it mentions actual cash flow
        if (fitText.includes('$')) {
          const mentionedAmounts = fitText.match(/\$[\d,]+\.?\d*/g);
          console.log(`   Mentioned amounts: ${mentionedAmounts?.join(', ') || 'None'}`);
          
          // Validate mentioned amounts are reasonable
          mentionedAmounts?.forEach(amount => {
            const value = parseFloat(amount.replace(/[$,]/g, ''));
            if (Math.abs(value - actualMetrics.cashFlow) < 5) {
              console.log(chalk.green(`   ✅ Cash flow amount accurate: ${amount}`));
            } else if (value === actualMetrics.monthlyRent) {
              console.log(chalk.green(`   ✅ Rent amount accurate: ${amount}`));
            } else if (value > actualMetrics.purchasePrice * 2) {
              console.log(chalk.red(`   ❌ HALLUCINATION: Unrealistic amount ${amount}`));
            }
          });
        }
      }
    }
    
    // VALIDATE ACTION PLAN TAB  
    console.log(chalk.cyan('\n4️⃣ ACTION PLAN TAB'));
    console.log('-'.repeat(40));
    
    const aiActionPlan = investmentDecision.aiEnhancedContent?.actionPlan;
    const fallbackActionPlan = investmentDecision.actionPlan;
    
    if (aiActionPlan) {
      console.log(`   AI-Enhanced Action Plan: Present`);
      console.log(`   Immediate Actions: ${aiActionPlan.immediateActions?.length || 0}`);
      console.log(`   Negotiation Focus: ${aiActionPlan.negotiationFocus?.length || 0}`);
      console.log(`   Preparation Items: ${aiActionPlan.preparationItems?.length || 0}`);
      
      // Check if recommendations align with verdict
      const allActions = [
        ...(aiActionPlan.immediateActions || []),
        ...(aiActionPlan.negotiationFocus || []),
        ...(aiActionPlan.preparationItems || [])
      ].join(' ').toLowerCase();
      
      if (investmentDecision.verdict === 'PASS' && allActions.includes('proceed')) {
        console.log(chalk.red('   ❌ HALLUCINATION: Recommends proceeding on PASS verdict'));
      } else if (investmentDecision.verdict === 'BUY' && allActions.includes('avoid')) {
        console.log(chalk.red('   ❌ HALLUCINATION: Recommends avoiding on BUY verdict'));
      } else {
        console.log(chalk.green('   ✅ Action plan aligns with verdict'));
      }
      
      // Check for specific property references
      if (allActions.includes(testProperty.address.city.toLowerCase())) {
        console.log(chalk.green(`   ✅ Correctly references ${testProperty.address.city}`));
      }
    } else if (fallbackActionPlan && fallbackActionPlan.length > 0) {
      console.log(`   Fallback Action Plan: ${fallbackActionPlan.length} items`);
    } else {
      console.log(chalk.yellow('   ⚠️  No action plan content found'));
    }
    
    // VALIDATE CAPITAL STRATEGY TAB
    console.log(chalk.cyan('\n5️⃣ CAPITAL STRATEGY TAB'));
    console.log('-'.repeat(40));
    
    const aiCapitalStrategy = investmentDecision.aiEnhancedContent?.capitalStrategy;
    const fallbackCapitalStrategy = investmentDecision.capitalStrategy;
    
    if (aiCapitalStrategy) {
      console.log(`   AI-Enhanced Capital Strategy: Present`);
      console.log(`   Current Assessment: ${!!aiCapitalStrategy.currentAssessment}`);
      console.log(`   Optimized Approach: ${!!aiCapitalStrategy.optimizedApproach}`);
      console.log(`   Alternative Options: ${aiCapitalStrategy.alternativeOptions?.length || 0}`);
      
      // Check if financing recommendations make sense
      const currentLTV = ((testProperty.purchasePrice - testProperty.downPayment) / testProperty.purchasePrice) * 100;
      console.log(`   Current LTV: ${currentLTV.toFixed(1)}%`);
      
      const allCapitalText = [
        aiCapitalStrategy.currentAssessment,
        aiCapitalStrategy.optimizedApproach,
        aiCapitalStrategy.recommendation,
        ...(aiCapitalStrategy.alternativeOptions || [])
      ].join(' ');
      
      if (allCapitalText.includes('90%') && currentLTV === 80) {
        console.log(chalk.yellow('   ⚠️  Suggests higher leverage (90% vs current 80%)'));
      }
      
      // Check for unrealistic cash requirements
      if (allCapitalText.match(/\$(\d+),?(\d+)/)) {
        const cashMatch = allCapitalText.match(/\$(\d+),?(\d+)/);
        const suggestedCash = parseInt(cashMatch[0].replace(/[$,]/g, ''));
        
        if (suggestedCash > testProperty.purchasePrice) {
          console.log(chalk.red(`   ❌ HALLUCINATION: Suggests cash > purchase price`));
        } else {
          console.log(chalk.green(`   ✅ Cash requirement reasonable: $${suggestedCash.toLocaleString()}`));
        }
      }
    } else if (fallbackCapitalStrategy) {
      console.log(`   Fallback Capital Strategy: Present`);
      console.log(`   Current Cash Required: $${fallbackCapitalStrategy.currentApproach?.cashRequired?.toLocaleString() || 'N/A'}`);
      console.log(`   Recommended Cash Required: $${fallbackCapitalStrategy.recommendedApproach?.cashRequired?.toLocaleString() || 'N/A'}`);
    } else {
      console.log(chalk.yellow('   ⚠️  No capital strategy content found'));
    }
    
    // VALIDATE TIMELINE TAB
    console.log(chalk.cyan('\n6️⃣ TIMELINE TAB'));
    console.log('-'.repeat(40));
    
    const aiTimeline = investmentDecision.aiEnhancedContent?.timeline;
    const fallbackTimeline = investmentDecision.timeline;
    
    if (aiTimeline) {
      console.log(`   AI-Enhanced Timeline: Present`);
      console.log(`   Optimal Hold Period: ${!!aiTimeline.optimalHoldPeriod}`);
      console.log(`   Rationale: ${!!aiTimeline.rationale}`);
      console.log(`   Exit Indicators: ${aiTimeline.exitIndicators?.length || 0}`);
      console.log(`   Market Timing: ${!!aiTimeline.marketTiming}`);
    } else if (fallbackTimeline) {
      console.log(`   Fallback Timeline: Present`);
      console.log(`   Immediate Actions: ${fallbackTimeline.immediateActions?.length || 0}`);
      console.log(`   Short-term Actions: ${fallbackTimeline.shortTermActions?.length || 0}`);  
      console.log(`   Long-term Strategy: ${fallbackTimeline.longTermStrategy?.length || 0}`);
      
      // Check if timeline makes sense
      if (fallbackTimeline.immediateActions && fallbackTimeline.immediateActions.some(action => action.includes('6-12 months'))) {
        console.log(chalk.green('   ✅ Reasonable immediate timeline'));
      }
    } else {
      console.log(chalk.yellow('   ⚠️  No timeline content found'));
    }
    
    // VALIDATE ALTERNATIVES TAB
    console.log(chalk.cyan('\n7️⃣ ALTERNATIVES TAB'));
    console.log('-'.repeat(40));
    
    const aiAlternatives = investmentDecision.aiEnhancedContent?.alternatives;
    const fallbackAlternatives = investmentDecision.alternativeOptions;
    
    if (aiAlternatives) {
      console.log(`   AI-Enhanced Alternatives: Present`);
      console.log(`   Better Property Type: ${!!aiAlternatives.betterPropertyType}`);
      console.log(`   Market Alternative: ${!!aiAlternatives.marketAlternative}`);
      console.log(`   Timing Strategy: ${!!aiAlternatives.timingStrategy}`);
      console.log(`   Risk Adjustment: ${!!aiAlternatives.riskAdjustment}`);
    } else if (fallbackAlternatives && fallbackAlternatives.length > 0) {
      console.log(`   Fallback Alternatives: ${fallbackAlternatives.length} options`);
      
      fallbackAlternatives.forEach((alt, index) => {
        console.log(`   Alternative ${index + 1}: ${alt.type || 'Unknown'} - ${alt.title}`);
        
        // Check if alternative suggestions are reasonable
        if (alt.description && alt.description.includes('REIT')) {
          console.log(chalk.green('     ✅ REIT alternative is reasonable'));
        }
      });
    } else {
      console.log(chalk.yellow('   ⚠️  No alternatives content found'));
    }
    
    // OVERALL VALIDATION SUMMARY
    console.log(chalk.cyan('\n📋 VALIDATION SUMMARY'));
    console.log('=' .repeat(60));
    
    let hallucinations = 0;
    let validations = 0;
    
    // Count validations vs hallucinations (now 7 tabs total)
    if (aiReasoning || fallbackReasons.primary) validations++;
    if (professionalAnalysis) validations++;
    if (portfolioContext) validations++;
    if (aiActionPlan || fallbackActionPlan) validations++;
    if (aiCapitalStrategy || fallbackCapitalStrategy) validations++;
    if (aiTimeline || fallbackTimeline) validations++;
    if (aiAlternatives || fallbackAlternatives) validations++;
    
    console.log(chalk.green(`✅ Valid AI content sections: ${validations}/7`));
    console.log(chalk.red(`❌ Hallucinations detected: ${hallucinations}`));
    
    if (hallucinations === 0 && validations >= 5) {
      console.log(chalk.bold.green('\n🎉 AI CONTENT VALIDATION PASSED'));
      console.log('No significant hallucinations detected');
    } else if (hallucinations > 2) {
      console.log(chalk.bold.red('\n❌ AI CONTENT VALIDATION FAILED'));
      console.log('Multiple hallucinations detected - review AI prompts');
    } else {
      console.log(chalk.bold.yellow('\n⚠️  AI CONTENT NEEDS IMPROVEMENT'));
      console.log('Some issues detected - minor adjustments needed');
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.response?.data || error.message);
  }
}

// Test scenario variations to check consistency
async function testScenarioConsistency() {
  console.log(chalk.cyan('\n🔄 SCENARIO CONSISTENCY TEST'));
  console.log('=' .repeat(60));
  
  // Test with different cash flow scenarios
  const scenarios = [
    { name: 'Negative Cash Flow', monthlyRent: 1400 }, // Will be negative
    { name: 'Positive Cash Flow', monthlyRent: 2200 }, // Will be positive
    { name: 'High Cap Rate', purchasePrice: 150000 }  // Better cap rate
  ];
  
  for (const scenario of scenarios) {
    console.log(chalk.cyan(`\n Testing: ${scenario.name}`));
    console.log('-'.repeat(40));
    
    const modifiedProperty = { ...testProperty, ...scenario };
    
    try {
      const response = await axios.post(
        `${BASE_URL}/deals/analyze`,
        modifiedProperty,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const verdict = response.data.investmentDecision?.verdict;
      const cashFlow = response.data.monthlyAnalysis?.cashFlow;
      
      console.log(`   Verdict: ${verdict}`);
      console.log(`   Cash Flow: $${cashFlow?.toFixed(2)}`);
      
      // Validate verdict makes sense
      if (cashFlow < -100 && verdict === 'BUY') {
        console.log(chalk.red('   ❌ LOGIC ERROR: BUY verdict with significant negative cash flow'));
      } else if (cashFlow > 500 && verdict === 'PASS') {
        console.log(chalk.red('   ❌ LOGIC ERROR: PASS verdict with strong positive cash flow'));
      } else {
        console.log(chalk.green('   ✅ Verdict aligns with metrics'));
      }
      
    } catch (error) {
      console.log(chalk.red(`   ❌ Scenario failed: ${error.message}`));
    }
  }
}

// Main execution
async function runTests() {
  console.log(chalk.bold.cyan('🏠 AI CONTENT VALIDATION TEST SUITE'));
  console.log(chalk.bold.cyan('Testing Investment Decision Engine AI Tabs'));
  console.log('=' .repeat(60));
  
  await authenticate();
  await validateAIContent();
  await testScenarioConsistency();
  
  console.log(chalk.cyan('\n' + '=' .repeat(60)));
  console.log(chalk.bold.green('✅ AI Content Validation Complete!'));
}

runTests().catch(console.error);