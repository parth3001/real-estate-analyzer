#!/usr/bin/env node

/**
 * Simple BRRRR Test - Direct API test to debug authentication
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function test() {
  console.log('🧪 Simple BRRRR Test\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  let token;
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'brrrr.phase1.2@gmail.com',
      password: 'TestUser123!'
    });
    console.log('✅ Login successful');
    console.log('   Response data keys:', Object.keys(loginResponse.data));
    console.log('   Full response:', JSON.stringify(loginResponse.data, null, 2));

    token = loginResponse.data.token || loginResponse.data.accessToken || loginResponse.data.jwt;
    if (!token) {
      console.error('❌ No token found in response');
      process.exit(1);
    }
    console.log('   Token length:', token.length);
    console.log('   Token preview:', token.substring(0, 20) + '...\n');
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    process.exit(1);
  }

  // Step 2: Test BRRRR analysis
  console.log('Step 2: Analyzing BRRRR property...');

  const propertyData = {
    propertyType: 'SFR', // Required field
    address: '123 BRRRR Lane, Anna, TX 75409',
    purchasePrice: 100000,
    closingCosts: 3000,
    downPayment: 20000,
    interestRate: 7.0,
    loanTerm: 30,
    investmentStrategy: 'brrrr',
    brrrr: {
      rehabBudget: 30000,
      afterRepairValue: 180000,
      refinanceLTV: 75,
      seasoningPeriod: 12,
      arvAppraisalConfidence: 'moderate'
    },
    monthlyRent: 1500,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 1500,
    propertyManagementRate: 8,
    longTermAssumptions: {
      vacancyRate: 5,
      projectionYears: 10
    }
  };

  try {
    const response = await axios.post(
      `${API_URL}/deals/analyze`,
      propertyData, // Send directly, not nested under propertyData
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Analysis successful\n');
    console.log('Response keys:', Object.keys(response.data));

    const decision = response.data.investmentDecision || response.data.decision;

    if (decision) {
      console.log('\n📊 Decision Results:');
      console.log('   Verdict:', decision.verdict);
      console.log('   Deal Quality/Score:', decision.dealQuality || decision.score || decision.professionalAssessment?.dealQuality || 'UNDEFINED');
      console.log('   Confidence:', decision.confidence || 'UNDEFINED');
      console.log('   Has strategySpecific:', !!decision.strategySpecific);

      if (decision.strategySpecific) {
        console.log('\n🎯 BRRRR Analysis:');
        const brrrr = decision.strategySpecific;
        console.log('   Capital Recovery Rate:', brrrr.capitalRecovery?.capitalRecoveryRate?.toFixed(1) + '%');
        console.log('   Infinite Return:', brrrr.capitalRecovery?.infiniteReturn);
        console.log('   Post-Refi Cash Flow:', '$' + brrrr.postRefinanceMetrics?.monthlyCashFlow?.toFixed(0) + '/month');
        console.log('   ARV Reliability Score:', brrrr.scores?.arvReliability + '/100');
        console.log('\n   ✅ BRRRR ROUTING WORKS!\n');
      } else {
        console.log('   ❌ Missing BRRRR analysis - routing may have failed\n');
      }
    } else {
      console.log('   ❌ No decision found in response\n');
    }

  } catch (error) {
    console.error('❌ Analysis failed');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', JSON.stringify(error.response?.data, null, 2));
    process.exit(1);
  }
}

test().catch(error => {
  console.error('FATAL:', error.message);
  process.exit(1);
});
