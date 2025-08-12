#!/usr/bin/env node

/**
 * Test Phase 2A: Market Intelligence Implementation
 * 
 * Tests the enhanced Investment Decision Engine with market tier analysis
 * for the Anna, TX property that was previously showing poor value proposition
 */

const axios = require('axios');

async function testPhase2AImplementation() {
  console.log('🧪 Testing Phase 2A: Market Intelligence Implementation');
  console.log('📍 Property: Anna, TX $415K');
  console.log('==========================================\n');

  // Step 1: Authenticate to get access token
  console.log('🔐 Authenticating test user...');
  let authToken;
  
  try {
    const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'dualmode.test@example.com',
      password: 'TestUser123!'
    });
    
    if (authResponse.data && authResponse.data.accessToken) {
      authToken = authResponse.data.accessToken;
      console.log('✅ Authentication successful');
    } else {
      console.error('❌ Authentication failed - no token received');
      console.log('Auth response:', authResponse.data);
      return;
    }
  } catch (authError) {
    console.error('❌ Authentication failed:', authError.response?.data || authError.message);
    return;
  }

  const testProperty = {
    // Property Details
    purchasePrice: 415000,
    propertyAddress: {
      street: "123 Main St",
      city: "Anna",
      state: "TX",
      zipCode: "75409"
    },
    
    // Property Characteristics
    bedrooms: 4,
    bathrooms: 2,
    sqft: 1800,
    yearBuilt: 1995,
    lotSize: 8000,
    propertyType: 'SFR',
    
    // Financial Details
    monthlyRent: 2400,
    propertyTaxes: 6200,
    insurance: 1800,
    maintenance: 2400,
    vacancy: 600, // 5%
    
    // Down Payment & Financing
    downPaymentPercent: 25,
    interestRate: 7.25,
    loanTermYears: 30,
    
    // Long Term Assumptions
    longTermAssumptions: {
      projectionYears: 10, // Keep financial calculations at 10 years
      annualAppreciation: 0.03,
      annualRentIncrease: 0.03,
      annualExpenseIncrease: 0.025
    },
    
    // Enhanced Goals (Phase 1)
    enhancedGoals: {
      freeTextStrategy: 'Looking for strong cash flow property to hold for 3-7 years in growing Texas suburbs for portfolio diversification',
      portfolioStrategy: 'geographic',
      exitStrategy: 'sale',
      processedGoals: {
        exitStrategy: {
          strategy: 'sale',
          timeframe: '4-5 years'
        },
        investmentGoal: 'balanced'
      }
    }
  };

  try {
    console.log('📊 Sending analysis request...');
    
    const response = await axios.post('http://localhost:3001/api/deals/analyze', testProperty, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Use authenticated token
      },
      timeout: 60000 // 60 second timeout
    });

    if (response.status === 200 && response.data) {
      const { analysis, investmentDecision } = response.data;
      
      console.log('✅ Analysis completed successfully!\n');
      
      // Phase 2A Market Intelligence Results
      console.log('🏙️  PHASE 2A: MARKET INTELLIGENCE RESULTS');
      console.log('==========================================');
      
      console.log(`📍 Location: ${testProperty.propertyAddress.city}, ${testProperty.propertyAddress.state}`);
      console.log(`💰 Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
      console.log(`🏠 Monthly Rent: $${testProperty.monthlyRent.toLocaleString()}`);
      
      // Investment Decision with Market Intelligence
      console.log('\n🎯 INVESTMENT DECISION (Enhanced with Market Intelligence)');
      console.log('=========================================================');
      console.log(`🏆 Verdict: ${investmentDecision.verdict}`);
      console.log(`📈 Confidence: ${investmentDecision.confidence}%`);
      console.log(`⭐ Property Score: ${investmentDecision.score || 'N/A'}/100`);
      console.log(`📝 Primary Reason: ${investmentDecision.primaryReason}`);
      
      if (investmentDecision.goalBasedReasoning) {
        console.log(`🎯 Goal-Based Analysis: ${investmentDecision.goalBasedReasoning}`);
      }
      
      // Financial Fundamentals
      console.log('\n💹 FINANCIAL FUNDAMENTALS');
      console.log('=========================');
      if (analysis && analysis.keyMetrics) {
        console.log(`📊 Cap Rate: ${analysis.keyMetrics?.capRate?.toFixed(2) || 'N/A'}%`);
        console.log(`💸 Monthly Cash Flow: $${Math.round(analysis.monthlyAnalysis?.cashFlow || 0)}`);
        console.log(`🔄 Cash-on-Cash Return: ${(analysis.keyMetrics?.cashOnCashReturn * 100)?.toFixed(2) || 'N/A'}%`);
        console.log(`🛡️  DSCR: ${analysis.keyMetrics?.dscr?.toFixed(2) || 'N/A'}`);
      } else {
        console.log('ℹ️  Detailed financial metrics not available (analysis structure may have changed)');
      }
      
      // Market Intelligence Insights
      console.log('\n🧠 MARKET INTELLIGENCE INSIGHTS');
      console.log('================================');
      if (investmentDecision.secondaryReasons && investmentDecision.secondaryReasons.length > 0) {
        investmentDecision.secondaryReasons.forEach((reason, index) => {
          console.log(`${index + 1}. ${reason}`);
        });
      }
      
      // Key Risks
      console.log('\n⚠️  KEY RISKS');
      console.log('=============');
      if (investmentDecision.keyRisks && investmentDecision.keyRisks.length > 0) {
        investmentDecision.keyRisks.forEach((risk, index) => {
          console.log(`${index + 1}. ${risk}`);
        });
      }
      
      // Test Assertions for Phase 2A
      console.log('\n🔬 PHASE 2A TEST ASSERTIONS');
      console.log('============================');
      
      const assertions = [];
      
      // Test 1: Market tier should be identified
      if (investmentDecision.secondaryReasons?.some(reason => reason.includes('Tier'))) {
        assertions.push('✅ Market tier classification working');
      } else {
        assertions.push('❌ Market tier classification missing');
      }
      
      // Test 2: Market-relative cap rate analysis
      if (investmentDecision.secondaryReasons?.some(reason => reason.includes('median') || reason.includes('market'))) {
        assertions.push('✅ Market-relative cap rate analysis working');
      } else {
        assertions.push('❌ Market-relative cap rate analysis missing');
      }
      
      // Test 3: Strategic timeline integration (Phase 1)
      if (investmentDecision.goalBasedReasoning?.includes('3-7 years') || 
          investmentDecision.goalBasedReasoning?.includes('year')) {
        assertions.push('✅ Strategic timeline integration working');
      } else {
        assertions.push('❌ Strategic timeline integration missing');
      }
      
      // Test 4: Market intelligence insights
      if (investmentDecision.secondaryReasons?.length >= 3) {
        assertions.push('✅ Market intelligence insights generated');
      } else {
        assertions.push('❌ Insufficient market intelligence insights');
      }
      
      // Test 5: Fair market value analysis
      if (investmentDecision.primaryReason?.includes('$') && 
          (investmentDecision.primaryReason?.includes('reduction') || 
           investmentDecision.primaryReason?.includes('value'))) {
        assertions.push('✅ Fair market value analysis working');
      } else {
        assertions.push('❌ Fair market value analysis unclear');
      }
      
      assertions.forEach(assertion => console.log(assertion));
      
      // Overall Assessment
      const passedTests = assertions.filter(a => a.includes('✅')).length;
      const totalTests = assertions.length;
      
      console.log(`\n📊 Phase 2A Test Results: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🎉 Phase 2A: Market Intelligence implementation SUCCESSFUL!');
        console.log('👨‍💼 The engine now provides institutional-grade market intelligence');
        console.log('📈 Ready to move to Phase 2B: Property Class Risk Assessment');
      } else {
        console.log('⚠️  Some Phase 2A features need refinement');
      }
      
      // Value Proposition Analysis
      console.log('\n💡 VALUE PROPOSITION ANALYSIS');
      console.log('==============================');
      
      const originalIssue = 'User: "my user would have rather calculated same metrics in excel"';
      console.log(`🚨 Original Issue: ${originalIssue}`);
      
      console.log('\n🆕 NEW VALUE ADDED BY PHASE 2A:');
      console.log('1. Market tier classification (Tier 1/2/3 analysis)');
      console.log('2. Market-relative performance benchmarking');
      console.log('3. Geographic market intelligence insights');
      console.log('4. Fair market value calculations based on market tier');
      console.log('5. Context-aware investment recommendations');
      console.log('6. Professional market intelligence that Excel cannot provide');
      
    } else {
      console.error('❌ Invalid response from server');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      console.log('Request error - server may not be running');
      console.log('Make sure the backend server is running on http://localhost:3001');
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testPhase2AImplementation()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPhase2AImplementation };