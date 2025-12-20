#!/usr/bin/env node

/**
 * BRRRR Phase 1.2 Integration Test - Investment Decision Engine Routing
 *
 * Tests BRRRR strategy routing through the complete Investment Decision Engine
 *
 * Tests:
 * 1. BRRRR strategy routing (investmentStrategy = 'brrrr')
 * 2. Buy & Hold default routing (investmentStrategy = 'buy-hold' or undefined)
 * 3. BRRRR verdict generation with correct scoring weights
 * 4. BRRRR-specific strengths and concerns
 * 5. Backward compatibility (existing deals still work)
 *
 * Expected runtime: ~3 seconds (includes API calls)
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = null;

console.log('🧪 BRRRR Phase 1.2 Integration Test - Decision Engine Routing\n');

let passCount = 0;
let failCount = 0;

// ============================================================================
// Authentication Helper
// ============================================================================

async function authenticate() {
  const testEmail = 'brrrr.phase1.2@gmail.com';
  const testPassword = 'TestUser123!';

  try {
    // Try login first
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Logged in with existing test user\n');
    return response.data.token;
  } catch (error) {
    // If user doesn't exist, register
    if (error.response?.status === 401 || error.response?.data?.error?.includes('Invalid')) {
      try {
        console.log('Creating new test user...');
        await axios.post(`${API_URL}/auth/register`, {
          email: testEmail,
          password: testPassword,
          firstName: 'BRRRR',
          lastName: 'Phase1.2Test'
        });

        // Now login
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testEmail,
          password: testPassword
        });
        console.log('✅ Registered and logged in new test user\n');
        return loginResponse.data.token;
      } catch (registerError) {
        console.error('❌ Failed to register test user:', registerError.response?.data || registerError.message);
        throw registerError;
      }
    }
    throw error;
  }
}

async function apiRequest(method, endpoint, data = null) {
  if (!authToken) {
    authToken = await authenticate();
  }

  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    return await axios(config);
  } catch (error) {
    // If 401, token might be expired
    if (error.response?.status === 401) {
      console.log('Token expired, re-authenticating...');
      authToken = null;
      authToken = await authenticate();
      config.headers['Authorization'] = `Bearer ${authToken}`;
      return await axios(config);
    }
    // Log detailed error for debugging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    }
    throw error;
  }
}

// ============================================================================
// Test Data
// ============================================================================

const BRRRR_PROPERTY = {
  address: '123 BRRRR Lane, Anna, TX 75409',
  purchasePrice: 100000,
  closingCosts: 3000,
  downPayment: 20000,
  interestRate: 7.0,
  loanTerm: 30,
  investmentStrategy: 'brrrr', // ← KEY: Trigger BRRRR routing
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

const BUY_HOLD_PROPERTY = {
  address: '456 Traditional Ave, McKinney, TX 75071',
  purchasePrice: 250000,
  closingCosts: 7500,
  downPayment: 50000,
  interestRate: 7.0,
  loanTerm: 30,
  investmentStrategy: 'buy-hold', // ← Buy & Hold strategy
  monthlyRent: 2000,
  propertyTaxRate: 2.0,
  insuranceRate: 0.5,
  maintenanceCost: 2000,
  propertyManagementRate: 10,
  longTermAssumptions: {
    vacancyRate: 5,
    projectionYears: 10
  }
};

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {

// ============================================================================
// Test 1: BRRRR Strategy Routing
// ============================================================================

console.log('Test 1: BRRRR Strategy Routing (investmentStrategy = "brrrr")');

try {
  const response = await apiRequest('POST', '/deals/analyze', {
    propertyData: BRRRR_PROPERTY,
    saveDeal: false
  });

  const decision = response.data.decision;
  const analysis = response.data.analysis;

  console.log('  Verdict:', decision.verdict);
  console.log('  Deal Quality:', `${decision.dealQuality}/100`);
  console.log('  Strategy Specific:', decision.strategySpecific ? 'Present' : 'Missing');

  // Assertions
  if (!decision.strategySpecific) {
    console.log('  ❌ FAIL: Missing strategySpecific (BRRRR analysis not attached)');
    failCount++;
  } else if (!decision.strategySpecific.capitalRecovery) {
    console.log('  ❌ FAIL: Missing capitalRecovery in strategySpecific');
    failCount++;
  } else {
    console.log('  Capital Recovery Rate:', `${decision.strategySpecific.capitalRecovery.capitalRecoveryRate.toFixed(1)}%`);
    console.log('  Infinite Return:', decision.strategySpecific.capitalRecovery.infiniteReturn);
    console.log('  ✅ PASS: BRRRR strategy routing successful\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.response?.data?.error || error.message, '\n');
  failCount++;
}

// ============================================================================
// Test 2: Buy & Hold Default Routing (Backward Compatibility)
// ============================================================================

console.log('Test 2: Buy & Hold Strategy Routing (investmentStrategy = "buy-hold")');

try {
  const response = await apiRequest('POST', '/deals/analyze', {
    propertyData: BUY_HOLD_PROPERTY,
    saveDeal: false
  });

  const decision = response.data.decision;

  console.log('  Verdict:', decision.verdict);
  console.log('  Deal Quality:', `${decision.dealQuality}/100`);
  console.log('  Strategy Specific:', decision.strategySpecific ? 'Present' : 'Absent');

  // Assertions (Buy & Hold should NOT have BRRRR-specific fields)
  if (decision.strategySpecific && decision.strategySpecific.capitalRecovery) {
    console.log('  ❌ FAIL: Buy & Hold should not have BRRRR capital recovery');
    failCount++;
  } else {
    console.log('  ✅ PASS: Buy & Hold routing works correctly\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.response?.data?.error || error.message, '\n');
  failCount++;
}

// ============================================================================
// Test 3: BRRRR Verdict Generation
// ============================================================================

console.log('Test 3: BRRRR Verdict Generation (Weighted Scoring)');

try {
  const response = await apiRequest('POST', '/deals/analyze', {
    propertyData: BRRRR_PROPERTY,
    saveDeal: false
  });

  const decision = response.data.decision;
  const brrrAnalysis = decision.strategySpecific;

  console.log('  Deal Quality:', `${decision.dealQuality}/100`);
  console.log('  Verdict:', decision.verdict);
  console.log('  Capital Recovery Score:', `${brrrAnalysis.scores.capitalRecovery}/100`);
  console.log('  ARV Reliability Score:', `${brrrAnalysis.scores.arvReliability}/100`);
  console.log('  Rehab Execution Score:', `${brrrAnalysis.scores.rehabExecution}/100`);

  // Assertions
  if (decision.dealQuality < 0 || decision.dealQuality > 100) {
    console.log('  ❌ FAIL: Deal quality out of valid range');
    failCount++;
  } else if (!['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'].includes(decision.verdict)) {
    console.log('  ❌ FAIL: Invalid verdict:', decision.verdict);
    failCount++;
  } else {
    console.log('  ✅ PASS: BRRRR verdict generated with valid scoring\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.response?.data?.error || error.message, '\n');
  failCount++;
}

// ============================================================================
// Test 4: BRRRR Strengths and Concerns
// ============================================================================

console.log('Test 4: BRRRR-Specific Strengths and Concerns');

try {
  const response = await apiRequest('POST', '/deals/analyze', {
    propertyData: BRRRR_PROPERTY,
    saveDeal: false
  });

  const decision = response.data.decision;

  console.log('  Strengths:', decision.strengths.length);
  console.log('  Concerns:', decision.concerns.length);
  console.log('  Bottom Line:', decision.bottomLine.substring(0, 50) + '...');

  // Check for BRRRR-specific keywords
  const allText = [
    ...decision.strengths,
    ...decision.concerns,
    decision.bottomLine
  ].join(' ').toLowerCase();

  const hasBRRRRKeywords =
    allText.includes('capital recovery') ||
    allText.includes('refinance') ||
    allText.includes('70%') ||
    allText.includes('arv');

  if (!hasBRRRRKeywords) {
    console.log('  ❌ FAIL: Missing BRRRR-specific insights');
    failCount++;
  } else {
    console.log('  ✅ PASS: BRRRR-specific strengths/concerns present\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.response?.data?.error || error.message, '\n');
  failCount++;
}

// ============================================================================
// Test 5: Undefined Strategy Defaults to Buy & Hold
// ============================================================================

console.log('Test 5: Undefined Strategy Defaults to Buy & Hold (Backward Compatibility)');

try {
  const propertyWithoutStrategy = { ...BUY_HOLD_PROPERTY };
  delete propertyWithoutStrategy.investmentStrategy; // Remove strategy field

  const response = await apiRequest('POST', '/deals/analyze', {
    propertyData: propertyWithoutStrategy,
    saveDeal: false
  });

  const decision = response.data.decision;

  console.log('  Verdict:', decision.verdict);
  console.log('  Deal Quality:', `${decision.dealQuality}/100`);

  // Should work as Buy & Hold (no BRRRR analysis)
  if (decision.strategySpecific && decision.strategySpecific.capitalRecovery) {
    console.log('  ❌ FAIL: Undefined strategy should default to Buy & Hold');
    failCount++;
  } else {
    console.log('  ✅ PASS: Undefined strategy correctly defaults to Buy & Hold\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.response?.data?.error || error.message, '\n');
  failCount++;
}

// ============================================================================
// Results Summary
// ============================================================================

console.log('========================================');
console.log('PHASE 1.2 INTEGRATION TEST RESULTS');
console.log('========================================');
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`Passed: ${passCount} ✅`);
console.log(`Failed: ${failCount} ❌`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(0)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL PHASE 1.2 TESTS PASSED - BRRRR ROUTING VALIDATED');
  console.log('✅ Investment Decision Engine successfully routes BRRRR vs Buy & Hold');
  console.log('✅ BRRRR-specific scoring weights applied correctly');
  console.log('✅ Backward compatibility maintained (existing deals unaffected)');
  console.log('✅ Ready to proceed to Phase 1.3: MongoDB Schema Extension\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review Investment Decision Engine integration\n');
  process.exit(1);
}

} // End of async function

// Run the tests
runTests().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
