/**
 * Test AI Content Fix - Validate that AI content uses correct property data
 * 
 * This test validates that the AI Enhanced Messaging Service now receives
 * the original property data and generates meaningful recommendations
 * instead of $0 nonsense.
 */

const axios = require('axios');

// Test user credentials
const TEST_EMAIL = 'dualmode.test@example.com';
const TEST_PASSWORD = 'TestUser123!';
const BASE_URL = 'http://localhost:3001/api';

// Test property with KNOWN values to validate against
const TEST_PROPERTY = {
  propertyType: 'SFR',
  city: 'Fayetteville',
  state: 'NC',
  purchasePrice: 250000, // Should appear in AI content
  monthlyRent: 1495, // Should appear in AI content (NOT $0)
  downPayment: 50000, // 20% - Should appear in AI content
  interestRate: 7.0, // Should appear in AI content
  loanTerm: 30,
  squareFootage: 1788,
  bedrooms: 3,
  bathrooms: 2.5,
  propertyTaxRate: 1.2,
  insuranceRate: 0.35,
  maintenanceCost: 1200,
  propertyManagementRate: 8,
  closingCosts: 3000,
  capitalInvestments: 2000,
  longTermAssumptions: {
    annualRentIncrease: 3.5,
    annualExpenseIncrease: 2.5,
    exitYear: 5,
    projectionYears: 10,
    sellingCosts: 6
  }
};

async function authenticateUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.accessToken) {
      console.log('✅ Authentication successful');
      return response.data.accessToken;
    }
    throw new Error('No access token received');
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testAIContentFix(token) {
  try {
    console.log('\n🤖 AI CONTENT FIX VALIDATION TEST');
    console.log('=====================================');
    
    console.log('\n📝 Test Property Data:');
    console.log(`   Purchase Price: $${TEST_PROPERTY.purchasePrice.toLocaleString()}`);
    console.log(`   Monthly Rent: $${TEST_PROPERTY.monthlyRent}`);
    console.log(`   Down Payment: $${TEST_PROPERTY.downPayment.toLocaleString()}`);
    console.log(`   Interest Rate: ${TEST_PROPERTY.interestRate}%`);
    
    const response = await axios.post(`${BASE_URL}/deals/analyze`, TEST_PROPERTY, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const analysis = response.data;
    const aiContent = analysis.investmentDecision?.aiEnhancedContent;
    
    if (!aiContent) {
      console.log('❌ No AI enhanced content found in response');
      return;
    }
    
    console.log('\n✅ AI Enhanced Content Generated Successfully!');
    
    // Test 1: Strategic Action Plan validation
    console.log('\n🔍 TEST 1: Strategic Action Plan Content');
    const actionPlan = aiContent.actionPlan;
    
    if (actionPlan?.immediateActions) {
      console.log('   ✅ Immediate Actions Generated:');
      actionPlan.immediateActions.forEach((action, i) => {
        console.log(`      ${i + 1}. ${action.substring(0, 80)}...`);
        
        // Check for $0 rent references (should NOT exist)
        if (action.includes('$0') || action.includes('rent is $0')) {
          console.log('      ❌ STILL CONTAINS $0 REFERENCES!');
        } else if (action.includes('$1,495') || action.includes('$250,000')) {
          console.log('      ✅ Contains actual property values');
        }
      });
    } else {
      console.log('   ❌ No immediate actions generated');
    }
    
    // Test 2: Capital Strategy validation  
    console.log('\n🔍 TEST 2: Capital Strategy Content');
    const capitalStrategy = aiContent.capitalStrategy;
    
    if (capitalStrategy?.currentAssessment) {
      console.log('   ✅ Current Assessment Generated:');
      console.log(`      ${capitalStrategy.currentAssessment.substring(0, 120)}...`);
      
      // Check for $0 purchase price references (should NOT exist)
      if (capitalStrategy.currentAssessment.includes('$0 purchase')) {
        console.log('      ❌ STILL CONTAINS $0 PURCHASE PRICE!');
      } else if (capitalStrategy.currentAssessment.includes('$250,000') || capitalStrategy.currentAssessment.includes('250000')) {
        console.log('      ✅ Contains actual purchase price');
      }
    } else {
      console.log('   ❌ No current assessment generated');
    }
    
    if (capitalStrategy?.recommendation) {
      console.log('   ✅ Professional Recommendation Generated:');
      console.log(`      ${capitalStrategy.recommendation.substring(0, 120)}...`);
    }
    
    // Test 3: Check for data validation in content
    console.log('\n🔍 TEST 3: Data Validation Check');
    const allContent = JSON.stringify(aiContent).toLowerCase();
    
    let dataIssues = [];
    if (allContent.includes('$0 purchase') || allContent.includes('purchase price') && allContent.includes('$0')) {
      dataIssues.push('$0 purchase price references found');
    }
    if (allContent.includes('rent is $0') || allContent.includes('$0/month')) {
      dataIssues.push('$0 rent references found');
    }
    if (allContent.includes('undefined') || allContent.includes('null')) {
      dataIssues.push('undefined/null values in content');
    }
    
    if (dataIssues.length === 0) {
      console.log('   ✅ No data corruption detected in AI content');
    } else {
      console.log('   ❌ Data issues still present:');
      dataIssues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    // Test 4: Meaningful content validation
    console.log('\n🔍 TEST 4: Content Meaningfulness Check');
    
    const hasRealisticNumbers = allContent.includes('250') || allContent.includes('1495') || allContent.includes('50000');
    const hasActionableAdvice = allContent.includes('negotiate') || allContent.includes('improve') || allContent.includes('consider');
    const hasSpecificRecommendations = (actionPlan?.immediateActions?.length || 0) > 0 && 
                                      (capitalStrategy?.alternativeOptions?.length || 0) > 0;
    
    console.log(`   Purchase/Rent Values Present: ${hasRealisticNumbers ? '✅' : '❌'}`);
    console.log(`   Actionable Advice Generated: ${hasActionableAdvice ? '✅' : '❌'}`);
    console.log(`   Specific Recommendations: ${hasSpecificRecommendations ? '✅' : '❌'}`);
    
    // Summary
    console.log('\n📋 AI CONTENT FIX TEST SUMMARY:');
    console.log('=================================');
    
    const tests = [
      actionPlan?.immediateActions?.length > 0,
      capitalStrategy?.currentAssessment?.length > 0,
      dataIssues.length === 0,
      hasRealisticNumbers && hasActionableAdvice && hasSpecificRecommendations
    ];
    
    const passedTests = tests.filter(Boolean).length;
    const totalTests = tests.length;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${Math.round(passedTests/totalTests*100)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 AI CONTENT FIX SUCCESSFUL - No more $0 data corruption!');
    } else if (passedTests >= totalTests * 0.75) {
      console.log('✅ AI CONTENT SIGNIFICANTLY IMPROVED - Minor issues remain');
    } else {
      console.log('⚠️  AI CONTENT STILL HAS ISSUES - Additional fixes needed');
    }
    
    // Optional: Show sample of actual content for manual validation
    if (process.env.SHOW_CONTENT) {
      console.log('\n📄 SAMPLE AI CONTENT (for manual validation):');
      console.log('Action Plan Sample:', actionPlan?.immediateActions?.[0] || 'None');
      console.log('Capital Strategy Sample:', capitalStrategy?.currentAssessment?.substring(0, 200) || 'None');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function runAIContentFixTest() {
  const token = await authenticateUser();
  await testAIContentFix(token);
}

// Run the test
runAIContentFixTest();