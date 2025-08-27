#!/usr/bin/env node

/**
 * REALISTIC VERDICT TESTING - Using Real Saved Properties
 * 
 * Uses actual saved properties from test user account for realistic V3.0 calibration testing
 */

const axios = require('axios');

// Real property from test user's account (Fayetteville, NC)
const FAYETTEVILLE_BASE = {
  propertyType: 'SFR',
  propertyName: 'V3.0 Calibration - Fayetteville NC',
  propertyAddress: {
    street: '1020 Test St',
    city: 'Fayetteville', 
    state: 'NC',
    zipCode: '28314'
  },
  purchasePrice: 220000, // Will be adjusted
  downPayment: 55000,    // 25%
  interestRate: 4,
  loanTerm: 30,
  propertyTaxRate: 0.84,
  insuranceRate: 0.7,
  propertyManagementRate: 5,
  yearBuilt: 2005,
  monthlyRent: 1495,     // Realistic for Fayetteville market
  squareFootage: 1788,
  bedrooms: 3,
  bathrooms: 2.5,
  maintenanceCost: 149,  // ~10% of rent
  closingCosts: 5500,    // Will be adjusted
  capitalInvestments: 0,
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  }
};

// Test scenarios using realistic Fayetteville market pricing
const REALISTIC_TESTS = [
  {
    name: 'BUY_Scenario_Great_Deal',
    description: 'Below market price - should trigger BUY',
    price: 180000, // 1.0% rent rule, great cash flow
    expectedVerdict: 'BUY',
    expectedDQ: 80
  },
  {
    name: 'NEGOTIATE_Scenario_Fair', 
    description: 'Market price - should trigger NEGOTIATE',
    price: 220000, // 0.82% rent rule, marginal cash flow
    expectedVerdict: 'NEGOTIATE',
    expectedDQ: 65
  },
  {
    name: 'CAUTION_Scenario_High',
    description: 'Above market - should trigger CAUTION',
    price: 250000, // 0.72% rent rule, negative cash flow
    expectedVerdict: 'CAUTION', 
    expectedDQ: 55
  },
  {
    name: 'PASS_Scenario_Overpriced',
    description: 'Significantly overpriced - should trigger PASS',
    price: 300000, // 0.60% rent rule, very negative cash flow
    expectedVerdict: 'PASS',
    expectedDQ: 30
  }
];

// Auth credentials
const AUTH_USER = {
  email: 'dualmode.test@example.com',
  password: 'TestUser123!'
};

let authToken = null;

async function login() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', AUTH_USER);
    authToken = response.data.accessToken;
    console.log('✅ Authentication successful');
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function testRealisticProperty(testCase) {
  const property = { ...FAYETTEVILLE_BASE };
  
  // Adjust price and related fields
  property.purchasePrice = testCase.price;
  property.downPayment = Math.round(testCase.price * 0.25); // 25% down
  property.closingCosts = Math.round(testCase.price * 0.025); // 2.5% closing
  property.propertyName = `${FAYETTEVILLE_BASE.propertyName} - ${testCase.name}`;
  
  try {
    // Build request body matching API expectations
    const requestBody = {
      propertyType: property.propertyType,
      propertyName: property.propertyName,
      propertyAddress: property.propertyAddress,
      purchasePrice: property.purchasePrice,
      downPayment: property.downPayment,
      interestRate: property.interestRate,
      loanTerm: property.loanTerm,
      propertyTaxRate: property.propertyTaxRate,
      insuranceRate: property.insuranceRate,
      propertyManagementRate: property.propertyManagementRate,
      yearBuilt: property.yearBuilt,
      monthlyRent: property.monthlyRent,
      squareFootage: property.squareFootage,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maintenanceCost: property.maintenanceCost,
      closingCosts: property.closingCosts,
      capitalInvestments: property.capitalInvestments,
      tenantTurnoverFees: property.tenantTurnoverFees
    };
    
    const response = await axios.post('http://localhost:3001/api/deals/analyze', requestBody, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = response.data;
    
    // Extract results from API response
    const actualVerdict = result.investmentDecision?.verdict;
    const actualDQ = result.investmentDecision?.professionalAssessment?.dealQuality || 0;
    const confidence = result.investmentDecision?.confidence;
    const cashFlow = result.monthlyAnalysis?.cashFlow;
    const capRate = result.keyMetrics?.capRate || result.annualAnalysis?.capRate || 0;
    
    // Calculate rent-to-price ratio
    const rentToPriceRatio = (property.monthlyRent / property.purchasePrice * 100).toFixed(2);
    
    // Check expectations
    const verdictMatch = actualVerdict === testCase.expectedVerdict;
    const dqClose = Math.abs(actualDQ - testCase.expectedDQ) <= 15; // Within 15 points
    
    console.log(`\n📊 ${testCase.name}:`);
    console.log(`   💰 Price: $${testCase.price.toLocaleString()} (${rentToPriceRatio}% rent/price)`);
    console.log(`   🎯 Expected: ${testCase.expectedVerdict} (DQ ~${testCase.expectedDQ})`);
    console.log(`   ✅ Actual: ${actualVerdict} (DQ ${actualDQ}/100, ${confidence}% confidence)`);
    console.log(`   💵 Cash Flow: $${Math.round(cashFlow)}/month`);
    console.log(`   📈 Cap Rate: ${capRate.toFixed(2)}%`);
    console.log(`   ✅ Verdict: ${verdictMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   📊 Deal Quality: ${dqClose ? '✅ REASONABLE' : '⚠️ UNEXPECTED'}`);
    
    // Professional scoring breakdown if available
    if (result.investmentDecision?.professionalAssessment) {
      const pa = result.investmentDecision.professionalAssessment;
      console.log(`   🔍 Score Breakdown:`);
      console.log(`      Cash Flow: ${pa.cashFlowScore}/100 (35% weight)`);
      console.log(`      IRR: ${pa.irrScore}/100 (25% weight)`);
      console.log(`      Market: ${pa.marketStrengthScore}/100 (15% weight)`);
      console.log(`      Debt: ${pa.debtStructureScore}/100 (10% weight)`);
    }
    
    return {
      testCase,
      actualVerdict,
      actualDQ,
      verdictMatch,
      dqClose,
      cashFlow,
      capRate,
      confidence,
      rentToPriceRatio,
      professionalScores: result.investmentDecision?.professionalAssessment
    };
    
  } catch (error) {
    console.log(`\n❌ ${testCase.name}: ERROR - ${error.message}`);
    if (error.response?.data) {
      console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return { testCase, error: error.message };
  }
}

async function runRealisticTests() {
  console.log('🚀 V3.0 Realistic Verdict Testing - Fayetteville NC Property\n');
  console.log('Base Property: 3BR/2.5BA, 1,788 sq ft, $1,495/month rent');
  console.log('Market Context: Fayetteville, NC (Fort Bragg area)\n');
  
  // Authenticate first
  try {
    await login();
  } catch (error) {
    console.error('❌ Cannot proceed without authentication');
    return [];
  }
  
  const results = [];
  
  for (const test of REALISTIC_TESTS) {
    const result = await testRealisticProperty(test);
    results.push(result);
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Analysis Summary
  const passed = results.filter(r => r.verdictMatch && r.dqClose && !r.error).length;
  const total = results.length;
  
  console.log(`\n📋 REALISTIC TEST SUMMARY:`);
  console.log(`   ✅ Verdict Accuracy: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  
  // V3.0 Calibration Analysis
  console.log(`\n🔍 V3.0 CALIBRATION ANALYSIS:`);
  const validResults = results.filter(r => !r.error);
  const dealQualities = validResults.map(r => r.actualDQ);
  const minDQ = Math.min(...dealQualities);
  const maxDQ = Math.max(...dealQualities);
  const avgDQ = (dealQualities.reduce((a,b) => a+b, 0) / dealQualities.length).toFixed(1);
  
  console.log(`   📊 Deal Quality Range: ${minDQ} - ${maxDQ} (avg: ${avgDQ})`);
  console.log(`   🎯 Expected Range: 30 - 80+ for full verdict spectrum`);
  
  if (maxDQ - minDQ < 30) {
    console.log(`   ⚠️  CALIBRATION ISSUE: Insufficient range (${maxDQ - minDQ} points)`);
    console.log(`   💡 Recommendation: Adjust scoring for better price sensitivity`);
  } else {
    console.log(`   ✅ Good calibration range (${maxDQ - minDQ} points)`);
  }
  
  // Check for plateau issue
  const plateauCount = dealQualities.filter(dq => Math.abs(dq - dealQualities[0]) <= 5).length;
  if (plateauCount >= 3) {
    console.log(`   🚨 PLATEAU DETECTED: ${plateauCount} properties have similar scores`);
    console.log(`   🔧 This indicates the scoring algorithm needs refinement`);
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runRealisticTests().catch(console.error);
}

module.exports = { runRealisticTests, REALISTIC_TESTS, FAYETTEVILLE_BASE };