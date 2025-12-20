#!/usr/bin/env node

/**
 * BRRRR - SFR Regression Test Suite
 *
 * PURPOSE: Ensure adding BRRRR strategy does NOT break existing Buy & Hold functionality
 *
 * CRITICAL RULE: These tests must pass BEFORE any BRRRR code is written
 *
 * Test Coverage:
 * 1. Existing Buy & Hold analysis still works (20 tests)
 * 2. Default strategy assignment works (backward compatibility)
 * 3. Investment Decision Engine routing works
 * 4. MongoDB reads/writes function correctly
 * 5. API endpoints return expected structure
 *
 * @author FSE from CLAUDE.md
 * @version 1.0.0
 * @date December 17, 2025
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// =============================================================================
// TEST DATA - Buy & Hold Properties (Existing Functionality)
// =============================================================================

const BUY_HOLD_TEST_PROPERTY = {
  propertyType: 'SFR',
  address: {
    street: '123 Regression Test Lane',
    city: 'Cleveland',
    state: 'OH',
    zipCode: '44101'
  },
  purchasePrice: 150000,
  closingCosts: 4500,
  downPaymentPercent: 20,
  interestRate: 7.0,
  loanTerm: 30,
  monthlyRent: 1500,
  squareFeet: 1800,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2005,
  annualPropertyTax: 2250, // 1.5% of purchase price
  annualInsurance: 900,
  monthlyHOA: 0,
  annualMaintenance: 1500,
  propertyManagementPercent: 8,
  vacancyRate: 5,
  annualAppreciationRate: 3,
  projectionYears: 10
};

// Property with NO investmentStrategy field (old deals)
const OLD_DEAL_PROPERTY = {
  propertyType: 'SFR',
  purchasePrice: 200000,
  monthlyRent: 1800,
  downPaymentPercent: 25,
  interestRate: 6.5,
  loanTerm: 30,
  annualPropertyTax: 3000,
  annualInsurance: 1200,
  propertyManagementPercent: 10,
  vacancyRate: 5
  // NOTE: NO investmentStrategy field - should default to 'buy-hold'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let authToken = null;

/**
 * Authenticate test user and get JWT token
 */
async function authenticate() {
  const testEmail = 'brrrr.regression@gmail.com'; // Use real domain
  const testPassword = 'TestUser123!';

  try {
    // Try to login first
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    console.log('✅ Logged in with existing test user');
    return response.data.token;
  } catch (error) {
    // If user doesn't exist (401), try to register
    if (error.response?.status === 401 || error.response?.data?.error?.includes('Invalid')) {
      try {
        console.log('Creating new test user...');
        await axios.post(`${API_URL}/auth/register`, {
          email: testEmail,
          password: testPassword,
          firstName: 'BRRRR',
          lastName: 'RegressionTest'
        });

        console.log('✅ Test user registered successfully');

        // Now login with new user
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: testEmail,
          password: testPassword
        });

        console.log('✅ Logged in with new test user');
        return loginResponse.data.token;
      } catch (registerError) {
        console.error('❌ Registration failed:', registerError.response?.data || registerError.message);
        throw registerError;
      }
    }
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * API request helper with authentication
 */
async function apiRequest(method, endpoint, data = null) {
  // Always get fresh token on first call or if previous failed
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
    // If 401, token might be expired - try refreshing once
    if (error.response?.status === 401) {
      console.log('Token expired, re-authenticating...');
      authToken = null; // Clear token
      authToken = await authenticate(); // Get new token

      // Retry request with new token
      config.headers['Authorization'] = `Bearer ${authToken}`;
      return await axios(config);
    }
    throw error;
  }
}


/**
 * Test result tracking
 */
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (error) {
      console.error(`   Error: ${error.message}`);
      testResults.errors.push({ test: testName, error: error.message });
    }
  }
}

// =============================================================================
// REGRESSION TEST SUITE
// =============================================================================

async function runRegressionTests() {
  console.log('\n========================================');
  console.log('BRRRR - SFR REGRESSION TEST SUITE');
  console.log('========================================\n');
  console.log('PURPOSE: Verify existing Buy & Hold functionality remains intact\n');

  try {
    // Test Group 1: Buy & Hold Analysis (8 tests)
    await testBuyHoldAnalysisStillWorks();

    // Test Group 2: Default Strategy Assignment (4 tests)
    await testDefaultStrategyAssignment();

    // Test Group 3: Investment Decision Engine (4 tests)
    await testInvestmentDecisionEngineRouting();

    // Test Group 4: MongoDB Operations (4 tests)
    await testMongoDBOperations();

    // Results summary
    console.log('\n========================================');
    console.log('REGRESSION TEST RESULTS');
    console.log('========================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);

    if (testResults.failed > 0) {
      console.log('FAILED TESTS:');
      testResults.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.test}`);
        console.log(`   ${err.error}\n`);
      });
      process.exit(1); // Exit with failure code
    } else {
      console.log('🎉 ALL REGRESSION TESTS PASSED - SFR FUNCTIONALITY INTACT');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR IN REGRESSION TEST SUITE:');
    console.error(error);
    process.exit(1);
  }
}

// =============================================================================
// TEST GROUP 1: Buy & Hold Analysis Still Works (8 tests)
// =============================================================================

async function testBuyHoldAnalysisStillWorks() {
  console.log('\n--- Test Group 1: Buy & Hold Analysis (8 tests) ---\n');

  // Test 1.1: Basic Buy & Hold analysis endpoint works
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const passed = response.status === 200 && response.data.analysis;
    logTest('1.1: Buy & Hold analysis endpoint responds', passed);
  } catch (error) {
    logTest('1.1: Buy & Hold analysis endpoint responds', false, error);
  }

  // Test 1.2: Monthly analysis calculations present
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const monthlyAnalysis = response.data.analysis?.monthlyAnalysis;
    const passed = monthlyAnalysis &&
                   monthlyAnalysis.expenses &&
                   monthlyAnalysis.cashFlow !== undefined;

    logTest('1.2: Monthly analysis calculations present', passed);
  } catch (error) {
    logTest('1.2: Monthly analysis calculations present', false, error);
  }

  // Test 1.3: Annual metrics (DSCR, Cap Rate, Cash-on-Cash) calculated
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const annualAnalysis = response.data.analysis?.annualAnalysis;
    const passed = annualAnalysis &&
                   annualAnalysis.dscr !== undefined &&
                   annualAnalysis.capRate !== undefined &&
                   annualAnalysis.cashOnCashReturn !== undefined;

    logTest('1.3: Annual metrics (DSCR, Cap Rate, CoC) calculated', passed);
  } catch (error) {
    logTest('1.3: Annual metrics (DSCR, Cap Rate, CoC) calculated', false, error);
  }

  // Test 1.4: Long-term projections generated
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const longTermAnalysis = response.data.analysis?.longTermAnalysis;
    const passed = longTermAnalysis &&
                   longTermAnalysis.yearlyProjections &&
                   longTermAnalysis.yearlyProjections.length === 10 &&
                   longTermAnalysis.returns?.irr !== undefined;

    logTest('1.4: Long-term projections (10 years, IRR) generated', passed);
  } catch (error) {
    logTest('1.4: Long-term projections (10 years, IRR) generated', false, error);
  }

  // Test 1.5: Investment Decision verdict generated
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const decision = response.data.investmentDecision;
    const validVerdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
    const passed = decision &&
                   validVerdicts.includes(decision.verdict) &&
                   decision.professionalAssessment?.dealQuality !== undefined;

    logTest('1.5: Investment Decision verdict generated', passed);
  } catch (error) {
    logTest('1.5: Investment Decision verdict generated', false, error);
  }

  // Test 1.6: Professional assessment scoring works
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const assessment = response.data.investmentDecision?.professionalAssessment;
    const passed = assessment &&
                   assessment.dealQuality >= 0 &&
                   assessment.dealQuality <= 100 &&
                   assessment.cashFlowScore !== undefined &&
                   assessment.irrScore !== undefined;

    logTest('1.6: Professional assessment scoring (0-100) works', passed);
  } catch (error) {
    logTest('1.6: Professional assessment scoring (0-100) works', false, error);
  }

  // Test 1.7: Financial calculations maintain precision
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const monthlyAnalysis = response.data.analysis?.monthlyAnalysis;
    // Check that values are not rounded to integers (should have decimal precision)
    const cashFlow = monthlyAnalysis?.cashFlow;
    const passed = cashFlow !== undefined &&
                   !Number.isInteger(cashFlow) && // Should have decimal precision
                   Math.abs(cashFlow) < 10000; // Sanity check

    logTest('1.7: Financial calculations maintain precision', passed);
  } catch (error) {
    logTest('1.7: Financial calculations maintain precision', false, error);
  }

  // Test 1.8: Cap rate calculation accurate
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const capRate = response.data.analysis?.annualAnalysis?.capRate;
    // Cleveland property should have reasonable cap rate (4-12%)
    const passed = capRate !== undefined &&
                   capRate >= 4 &&
                   capRate <= 12;

    logTest('1.8: Cap rate calculation in reasonable range (4-12%)', passed);
  } catch (error) {
    logTest('1.8: Cap rate calculation in reasonable range (4-12%)', false, error);
  }
}

// =============================================================================
// TEST GROUP 2: Default Strategy Assignment (4 tests)
// =============================================================================

async function testDefaultStrategyAssignment() {
  console.log('\n--- Test Group 2: Default Strategy Assignment (4 tests) ---\n');

  // Test 2.1: Property with NO investmentStrategy field defaults to 'buy-hold'
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: OLD_DEAL_PROPERTY // No investmentStrategy field
    });

    // Analysis should succeed (backward compatibility)
    const passed = response.status === 200 && response.data.analysis;
    logTest('2.1: Old property (no strategy field) analysis succeeds', passed);
  } catch (error) {
    logTest('2.1: Old property (no strategy field) analysis succeeds', false, error);
  }

  // Test 2.2: Explicit 'buy-hold' strategy works
  try {
    const propertyWithStrategy = {
      ...BUY_HOLD_TEST_PROPERTY,
      investmentStrategy: 'buy-hold'
    };

    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: propertyWithStrategy
    });

    const passed = response.status === 200 && response.data.analysis;
    logTest('2.2: Explicit "buy-hold" strategy works', passed);
  } catch (error) {
    logTest('2.2: Explicit "buy-hold" strategy works', false, error);
  }

  // Test 2.3: Saved deal defaults to 'buy-hold' strategy when retrieved
  try {
    // Save a deal without investmentStrategy field
    const saveResponse = await apiRequest('POST', '/deals/analyze', {
      propertyData: OLD_DEAL_PROPERTY, // No investmentStrategy
      saveDeal: true
    });

    const dealId = saveResponse.data.dealId || saveResponse.data.deal?._id;

    // Retrieve and verify it has 'buy-hold' strategy
    const getResponse = await apiRequest('GET', `/deals/${dealId}`);
    const strategy = getResponse.data.propertyData?.investmentStrategy;

    const passed = !strategy || strategy === 'buy-hold'; // Either undefined or 'buy-hold'

    // Cleanup
    try {
      await apiRequest('DELETE', `/deals/${dealId}`);
    } catch (e) {
      // Ignore cleanup errors
    }

    logTest('2.3: Saved deal defaults to "buy-hold" strategy', passed);
  } catch (error) {
    logTest('2.3: Saved deal defaults to "buy-hold" strategy', false, error);
  }

  // Test 2.4: Invalid strategy value rejected
  try {
    const invalidProperty = {
      ...BUY_HOLD_TEST_PROPERTY,
      investmentStrategy: 'invalid-strategy'
    };

    try {
      await apiRequest('POST', '/deals/analyze', {
        propertyData: invalidProperty
      });

      // Should have thrown error
      logTest('2.4: Invalid strategy value rejected', false, new Error('Should reject invalid strategy'));
    } catch (error) {
      // Expected to fail with 400
      const passed = error.response?.status === 400;
      logTest('2.4: Invalid strategy value rejected', passed);
    }
  } catch (error) {
    logTest('2.4: Invalid strategy value rejected', false, error);
  }
}

// =============================================================================
// TEST GROUP 3: Investment Decision Engine Routing (4 tests)
// =============================================================================

async function testInvestmentDecisionEngineRouting() {
  console.log('\n--- Test Group 3: Investment Decision Engine Routing (4 tests) ---\n');

  // Test 3.1: Decision engine generates verdict for Buy & Hold
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const decision = response.data.investmentDecision;
    const validVerdicts = ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'];
    const passed = decision && validVerdicts.includes(decision.verdict);

    logTest('3.1: Decision engine generates verdict for Buy & Hold', passed);
  } catch (error) {
    logTest('3.1: Decision engine generates verdict for Buy & Hold', false, error);
  }

  // Test 3.2: Deal quality score in valid range (0-100)
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const dealQuality = response.data.investmentDecision?.professionalAssessment?.dealQuality;
    const passed = dealQuality !== undefined &&
                   dealQuality >= 0 &&
                   dealQuality <= 100;

    logTest('3.2: Deal quality score in valid range (0-100)', passed);
  } catch (error) {
    logTest('3.2: Deal quality score in valid range (0-100)', false, error);
  }

  // Test 3.3: Professional assessment includes all required fields
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const assessment = response.data.investmentDecision?.professionalAssessment;
    const passed = assessment &&
                   assessment.dealQuality !== undefined &&
                   assessment.cashFlowScore !== undefined &&
                   assessment.irrScore !== undefined &&
                   assessment.marketStrengthScore !== undefined &&
                   assessment.primaryInsight !== undefined;

    logTest('3.3: Professional assessment includes all required fields', passed);
  } catch (error) {
    logTest('3.3: Professional assessment includes all required fields', false, error);
  }

  // Test 3.4: AI-enhanced content generated (if available)
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY
    });

    const aiContent = response.data.investmentDecision?.aiEnhancedContent;
    // AI content is optional but if present should have structure
    const passed = !aiContent || (aiContent.strategicActionPlan && aiContent.capitalStrategy);

    logTest('3.4: AI-enhanced content structure valid (if present)', passed);
  } catch (error) {
    logTest('3.4: AI-enhanced content structure valid (if present)', false, error);
  }
}

// =============================================================================
// TEST GROUP 4: MongoDB Operations (4 tests)
// =============================================================================

async function testMongoDBOperations() {
  console.log('\n--- Test Group 4: MongoDB Operations (4 tests) ---\n');

  // Test 4.1: Save Buy & Hold deal to database
  try {
    const response = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY,
      saveDeal: true
    });

    const dealId = response.data.dealId || response.data.deal?._id;
    const passed = response.status === 200 && dealId !== undefined;

    logTest('4.1: Save Buy & Hold deal to database', passed);

    // Cleanup
    if (dealId) {
      try {
        await apiRequest('DELETE', `/deals/${dealId}`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    logTest('4.1: Save Buy & Hold deal to database', false, error);
  }

  // Test 4.2: Retrieve saved Buy & Hold deal
  try {
    // First save a deal
    const saveResponse = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY,
      saveDeal: true
    });

    const dealId = saveResponse.data.dealId || saveResponse.data.deal?._id;

    // Then retrieve it
    const getResponse = await apiRequest('GET', `/deals/${dealId}`);

    const passed = getResponse.status === 200 &&
                   getResponse.data.propertyData.purchasePrice === BUY_HOLD_TEST_PROPERTY.purchasePrice;

    logTest('4.2: Retrieve saved Buy & Hold deal', passed);

    // Cleanup
    await apiRequest('DELETE', `/deals/${dealId}`);
  } catch (error) {
    logTest('4.2: Retrieve saved Buy & Hold deal', false, error);
  }

  // Test 4.3: Update existing Buy & Hold deal
  try {
    // Save a deal
    const saveResponse = await apiRequest('POST', '/deals/analyze', {
      propertyData: BUY_HOLD_TEST_PROPERTY,
      saveDeal: true
    });

    const dealId = saveResponse.data.dealId || saveResponse.data.deal?._id;

    // Update it
    const updatedProperty = {
      ...BUY_HOLD_TEST_PROPERTY,
      monthlyRent: 1600 // Changed rent
    };

    const updateResponse = await apiRequest('PUT', `/deals/${dealId}`, {
      propertyData: updatedProperty
    });

    const passed = updateResponse.status === 200;

    logTest('4.3: Update existing Buy & Hold deal', passed);

    // Cleanup
    await apiRequest('DELETE', `/deals/${dealId}`);
  } catch (error) {
    logTest('4.3: Update existing Buy & Hold deal', false, error);
  }

  // Test 4.4: List user deals (pagination works)
  try {
    const response = await apiRequest('GET', '/deals?page=1&limit=10');

    const passed = response.status === 200 &&
                   Array.isArray(response.data.deals || response.data);

    logTest('4.4: List user deals (pagination works)', passed);
  } catch (error) {
    logTest('4.4: List user deals (pagination works)', false, error);
  }
}

// =============================================================================
// RUN TESTS
// =============================================================================

// Run the test suite
runRegressionTests().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
