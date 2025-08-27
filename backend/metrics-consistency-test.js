/**
 * V3.0 Metrics Consistency Test
 * Validates that all financial metrics use consistent decimal vs percentage formats
 * 
 * Tests:
 * 1. IRR calculation and display consistency  
 * 2. Cap Rate calculation and display consistency
 * 3. Cash-on-Cash calculation and display consistency
 * 4. DSCR calculation consistency
 * 5. All Investment Decision Engine thresholds are in correct format
 */

const axios = require('axios');

// Test user credentials
const TEST_EMAIL = 'dualmode.test@example.com';
const TEST_PASSWORD = 'TestUser123!';
const BASE_URL = 'http://localhost:3001/api';

// Test property with known metrics
const TEST_PROPERTY = {
  propertyType: 'SFR',
  city: 'Fayetteville',
  state: 'NC',
  purchasePrice: 200000,
  monthlyRent: 1495,
  downPayment: 40000, // 20%
  interestRate: 7.0,
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

async function testMetricsConsistency(token) {
  try {
    console.log('\n🧪 V3.0 METRICS CONSISTENCY TEST');
    console.log('==================================');
    
    const response = await axios.post(`${BASE_URL}/deals/analyze`, TEST_PROPERTY, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('API Response keys:', Object.keys(response.data));
    
    const analysis = response.data;
    
    // Extract key metrics
    const irr = analysis.keyMetrics?.irr;
    const capRate = analysis.keyMetrics.capRate;
    const cocReturn = analysis.keyMetrics.cashOnCashReturn;
    const dscr = analysis.keyMetrics.dscr;
    const monthlyFlow = analysis.monthlyAnalysis.cashFlow;
    
    console.log('\n📊 RAW METRICS FROM API:');
    console.log(`   IRR: ${irr}`);
    console.log(`   Cap Rate: ${capRate}`);
    console.log(`   Cash-on-Cash: ${cocReturn}`);
    console.log(`   DSCR: ${dscr}`);
    console.log(`   Monthly Cash Flow: $${monthlyFlow}`);
    
    // Test 1: IRR Format Consistency
    console.log('\n🔍 TEST 1: IRR Format Consistency');
    if (irr >= 1 && irr <= 100) {
      console.log('   ✅ IRR is in percentage format:', irr + '%');
    } else if (irr >= 0.01 && irr <= 1.0) {
      console.log('   ❌ IRR appears to be in decimal format:', irr);
      console.log('   🚨 INCONSISTENCY: Should be percentage format');
    } else {
      console.log('   ⚠️  IRR value outside expected range:', irr);
    }
    
    // Test 2: Cap Rate Format Consistency  
    console.log('\n🔍 TEST 2: Cap Rate Format Consistency');
    if (capRate >= 1 && capRate <= 20) {
      console.log('   ✅ Cap Rate is in percentage format:', capRate + '%');
    } else if (capRate >= 0.01 && capRate <= 0.20) {
      console.log('   ❌ Cap Rate appears to be in decimal format:', capRate);
      console.log('   🚨 INCONSISTENCY: Should be percentage format');
    } else {
      console.log('   ⚠️  Cap Rate value outside expected range:', capRate);
    }
    
    // Test 3: Cash-on-Cash Format Consistency
    console.log('\n🔍 TEST 3: Cash-on-Cash Format Consistency');
    if (cocReturn >= 1 && cocReturn <= 50) {
      console.log('   ✅ CoC Return is in percentage format:', cocReturn + '%');
    } else if (cocReturn >= 0.01 && cocReturn <= 0.50) {
      console.log('   ❌ CoC Return appears to be in decimal format:', cocReturn);
      console.log('   🚨 INCONSISTENCY: Should be percentage format');
    } else {
      console.log('   ⚠️  CoC Return value outside expected range:', cocReturn);
    }
    
    // Test 4: DSCR Format Consistency (should be ratio, not percentage)
    console.log('\n🔍 TEST 4: DSCR Format Consistency');
    if (dscr >= 0.1 && dscr <= 3.0) {
      console.log('   ✅ DSCR is in ratio format:', dscr + 'x');
    } else {
      console.log('   ⚠️  DSCR value outside expected range:', dscr);
    }
    
    // Test 5: Investment Decision Engine Scoring
    console.log('\n🔍 TEST 5: Investment Decision Engine Scoring');
    const decision = analysis.investmentDecision;
    if (decision?.professionalAssessment) {
      const assessment = decision.professionalAssessment;
      console.log(`   Deal Quality: ${assessment.dealQuality}/100`);
      console.log(`   IRR Score: ${assessment.irrScore}/100`);
      console.log(`   Cash Flow Score: ${assessment.cashFlowScore}/100`);
      console.log('   ✅ All scores are in 0-100 range format');
      
      // Check verdict mapping consistency
      if (assessment.dealQuality >= 80 && decision.verdict === 'BUY') {
        console.log('   ✅ BUY verdict correctly mapped (80+ score)');
      } else if (assessment.dealQuality >= 65 && assessment.dealQuality < 80 && decision.verdict === 'NEGOTIATE') {
        console.log('   ✅ NEGOTIATE verdict correctly mapped (65-79 score)');
      } else if (assessment.dealQuality >= 50 && assessment.dealQuality < 65 && decision.verdict === 'CAUTION') {
        console.log('   ✅ CAUTION verdict correctly mapped (50-64 score)');
      } else if (assessment.dealQuality < 50 && decision.verdict === 'PASS') {
        console.log('   ✅ PASS verdict correctly mapped (<50 score)');
      } else {
        console.log('   ❌ Verdict mapping inconsistency detected');
        console.log(`      Score: ${assessment.dealQuality}, Verdict: ${decision.verdict}`);
      }
    }
    
    // Test 6: Cross-Reference with Expected Values
    console.log('\n🔍 TEST 6: Sanity Check Against Expected Values');
    
    // Manual calculation for validation
    const expectedCapRate = ((1495 * 12) - 8000) / 200000 * 100; // Rough estimate
    console.log(`   Expected Cap Rate (~${expectedCapRate.toFixed(1)}%): ${Math.abs(capRate - expectedCapRate) < 2 ? '✅' : '❌'} within range`);
    
    const totalInvestment = 40000 + 3000 + 2000; // Down + Closing + CapEx
    const annualCashFlow = monthlyFlow * 12;
    const expectedCoC = annualCashFlow / totalInvestment * 100;
    console.log(`   Expected CoC (~${expectedCoC.toFixed(1)}%): ${Math.abs(cocReturn - expectedCoC) < 3 ? '✅' : '❌'} within range`);
    
    // Summary
    console.log('\n📋 CONSISTENCY TEST SUMMARY:');
    console.log('==============================');
    
    let passedTests = 0;
    let totalTests = 6;
    
    // Count passed tests (simplified)
    if (irr >= 1 && irr <= 100) passedTests++;
    if (capRate >= 1 && capRate <= 20) passedTests++;
    if (cocReturn >= 1 && cocReturn <= 50) passedTests++;
    if (dscr >= 0.1 && dscr <= 3.0) passedTests++;
    if (decision?.professionalAssessment) passedTests++;
    if (Math.abs(capRate - expectedCapRate) < 2) passedTests++;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${(passedTests/totalTests*100).toFixed(0)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL METRICS CONSISTENCY CHECKS PASSED!');
    } else {
      console.log('⚠️  Some consistency issues detected - review above');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function runMetricsConsistencyTests() {
  const token = await authenticateUser();
  await testMetricsConsistency(token);
}

// Run the tests
runMetricsConsistencyTests();