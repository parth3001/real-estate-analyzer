#!/usr/bin/env node

/**
 * QUICK VERDICT BOUNDARY TESTING
 * 
 * Tests V3.0 verdict boundaries without external AI validation
 * Perfect for immediate validation after code changes
 */

const axios = require('axios');

const BASE_PROPERTY = {
  propertyType: 'SFR',
  propertyName: 'Boundary Test Property',
  propertyAddress: {
    street: '123 Test Street',
    city: 'Nashville',
    state: 'TN', 
    zipCode: '37203'
  },
  purchasePrice: 450000, // Will be adjusted
  downPayment: 90000,
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
  }
};

const QUICK_TESTS = [
  { name: 'BUY_Test', price: 300000, expectedVerdict: 'BUY', expectedDQ: 80 },
  { name: 'NEGOTIATE_Test', price: 380000, expectedVerdict: 'NEGOTIATE', expectedDQ: 65 }, 
  { name: 'CAUTION_Test', price: 450000, expectedVerdict: 'CAUTION', expectedDQ: 50 },
  { name: 'PASS_Test', price: 550000, expectedVerdict: 'PASS', expectedDQ: 30 }
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
    console.log('Login response keys:', Object.keys(response.data));
    // Try different possible token field names
    authToken = response.data.token || response.data.accessToken || response.data.authToken || response.data.jwt;
    console.log('✅ Authentication successful');
    console.log('Token received:', authToken ? 'Yes' : 'No');
    if (!authToken) {
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }
    return authToken;
  } catch (error) {
    console.log('⚠️ Login failed:', error.message);
    
    // Check if it's a 409 (user exists) - then just try login with the right credentials
    if (error.response && error.response.status === 401) {
      console.log('Trying with correct credentials...');
      // The test user might already exist with these credentials
      try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
          email: 'dualmode.test@example.com',
          password: 'TestUser123!'
        });
        authToken = response.data.token;
        console.log('✅ Authentication successful with test credentials');
        return authToken;
      } catch (loginError) {
        console.error('❌ Authentication failed:', loginError.message);
        throw loginError;
      }
    }
    
    throw error;
  }
}

async function testProperty(testCase) {
  const property = { ...BASE_PROPERTY };
  property.purchasePrice = testCase.price;
  property.downPayment = Math.round(testCase.price * 0.20);
  property.closingCosts = Math.round(testCase.price * 0.025);
  
  try {
    // Build the request body
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
    
    // The response has the data directly at top level
    const actualVerdict = result.investmentDecision?.verdict;
    const actualDQ = result.investmentDecision?.professionalAssessment?.dealQuality || 0;
    const confidence = result.investmentDecision?.confidence;
    const cashFlow = result.monthlyAnalysis?.cashFlow;
    const capRate = result.keyMetrics?.capRate || result.annualAnalysis?.capRate || 0;
    
    const verdictMatch = actualVerdict === testCase.expectedVerdict;
    const dqClose = Math.abs(actualDQ - testCase.expectedDQ) <= 15; // Within 15 points
    
    console.log(`\n📊 ${testCase.name}:`);
    console.log(`   💰 Price: $${testCase.price.toLocaleString()}`);
    console.log(`   🎯 Expected: ${testCase.expectedVerdict} (DQ ~${testCase.expectedDQ})`);
    console.log(`   ✅ Actual: ${actualVerdict} (DQ ${actualDQ}/100, ${confidence}% confidence)`);
    console.log(`   💵 Cash Flow: $${Math.round(cashFlow)}/month`);
    console.log(`   📈 Cap Rate: ${capRate.toFixed(2)}%`);
    console.log(`   ✅ Verdict: ${verdictMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   📊 Deal Quality: ${dqClose ? '✅ REASONABLE' : '⚠️ UNEXPECTED'}`);
    
    return {
      testCase,
      actualVerdict,
      actualDQ,
      verdictMatch,
      dqClose,
      cashFlow,
      capRate,
      confidence
    };
    
  } catch (error) {
    console.log(`\n❌ ${testCase.name}: ERROR - ${error.message}`);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Auth header sent:', authToken ? 'Yes' : 'No');
      if (error.response.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    return { testCase, error: error.message };
  }
}

async function runQuickTests() {
  console.log('🚀 V3.0 Quick Verdict Boundary Testing\n');
  console.log('Testing all 4 verdict categories with strategic price points...\n');
  
  // Authenticate first
  try {
    await login();
  } catch (error) {
    console.error('❌ Cannot proceed without authentication');
    return [];
  }
  
  const results = [];
  
  for (const test of QUICK_TESTS) {
    const result = await testProperty(test);
    results.push(result);
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  const passed = results.filter(r => r.verdictMatch && r.dqClose && !r.error).length;
  const total = results.length;
  
  console.log(`\n📋 SUMMARY:`);
  console.log(`   ✅ Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  
  if (passed === total) {
    console.log('   🎉 V3.0 VERDICT SYSTEM: WORKING PERFECTLY!');
  } else if (passed >= total * 0.75) {
    console.log('   ⚠️  V3.0 VERDICT SYSTEM: MOSTLY WORKING - MINOR CALIBRATION NEEDED');
  } else {
    console.log('   ❌ V3.0 VERDICT SYSTEM: NEEDS ATTENTION');
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { runQuickTests, QUICK_TESTS, BASE_PROPERTY };