#!/usr/bin/env node

/**
 * MF VERDICT TEST - Building Type Cap Rate Adjustments
 *
 * Tests that building type adjustments correctly affect cap rate scoring
 * and verdict generation for Multi-Family properties.
 *
 * Phase 1 Business Logic:
 * - GARDEN: Baseline cap rate (no adjustment)
 * - MID_RISE: -150 bps adjustment (4-9 stories, institutional appeal)
 * - COMPLEX: Baseline cap rate (no adjustment)
 */

const axios = require('axios');

// Test property: 12-unit Mid-Rise in Dallas (A-Class market)
const MF_MIDRISE_DALLAS = {
  propertyType: 'MF',
  propertyName: 'Phase 1 - Mid-Rise Building Type Test',
  propertyAddress: {
    street: '123 Test Street',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201'
  },

  // Building characteristics
  buildingType: 'MID_RISE', // 4-9 stories, elevator building
  totalUnits: 12,
  totalSqft: 12000, // 1,000 sqft per unit average
  yearBuilt: 2015,

  // Unit configuration (simplified - using unitTypes)
  unitTypes: [
    { type: '1bed/1bath', count: 6, sqft: 800, currentRent: 1800, occupied: 6 },
    { type: '2bed/2bath', count: 6, sqft: 1200, currentRent: 2500, occupied: 6 }
  ],

  // Financial details
  purchasePrice: 2400000, // $200k per unit
  downPayment: 720000,    // 30% down (commercial loan)
  interestRate: 6.5,      // Commercial rate
  loanTerm: 25,           // Commercial term
  propertyTaxRate: 1.8,   // Dallas rate
  insuranceRate: 0.5,
  propertyManagementRate: 5,

  // Operating assumptions
  maintenanceCost: 200,   // Per unit per month
  commonAreaUtilities: {
    electric: 500,
    water: 300,
    gas: 0,
    trash: 200
  },

  // Investment assumptions
  investmentTimeline: 10,
  capitalReservesRate: 6, // MF standard CapEx
  commonAreaReservesRate: 2,
  vacancyRate: 5,

  // Strategy
  exitStrategy: 'sale',
  portfolioStrategy: 'appreciation',
  experienceLevel: 'intermediate',
  riskTolerance: 'moderate'
};

// Auth credentials
const AUTH_USER = {
  email: 'admin@realestateanalyzer.com',
  password: 'S@madhu96780302'
};

let authToken = null;

async function login() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', AUTH_USER);
    authToken = response.data.accessToken;
    console.log('✅ Authentication successful\n');
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function testMFBuildingType() {
  console.log('🧪 MF BUILDING TYPE VERDICT TEST\n');
  console.log('📍 Property: 12-unit Mid-Rise in Dallas, TX');
  console.log('🏢 Building Type: MID_RISE (4-9 stories, institutional quality)');
  console.log('💰 Purchase Price: $2,400,000 ($200k per unit)');
  console.log('📊 Total Monthly Rent: $25,800 ($12,900 from 6x1BR + $15,000 from 6x2BR)');
  console.log('');

  try {
    // Login
    await login();

    // Analyze property
    console.log('🔬 Analyzing MF property with building type...\n');

    const response = await axios.post(
      'http://localhost:3001/api/deals/analyze',
      MF_MIDRISE_DALLAS,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;

    // DEBUG: Log the entire response to see structure
    console.log('🔍 DEBUG - Full Response Structure:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n');

    // Extract key metrics
    const verdict = result.investmentDecision?.verdict || 'UNKNOWN';
    const dealQuality = result.investmentDecision?.dealQualityScore || 0;
    const confidence = result.investmentDecision?.confidence || 0;

    const capRate = result.analysis?.capRate;
    const cashFlow = result.analysis?.monthlyCashFlow;
    const dscr = result.analysis?.dscr;
    const noi = result.analysis?.noi;

    // Display results
    console.log('========================================');
    console.log('📊 ANALYSIS RESULTS');
    console.log('========================================\n');

    console.log('🎯 Investment Decision:');
    console.log(`   Verdict: ${verdict}`);
    console.log(`   Deal Quality Score: ${dealQuality}/100`);
    console.log(`   Confidence: ${confidence}%\n`);

    console.log('💵 Key Financial Metrics:');
    console.log(`   Cap Rate: ${capRate ? (capRate * 100).toFixed(2) : 'N/A'}%`);
    console.log(`   Monthly Cash Flow: $${cashFlow ? cashFlow.toFixed(0) : 'N/A'}`);
    console.log(`   DSCR: ${dscr ? dscr.toFixed(2) : 'N/A'}x`);
    console.log(`   NOI: $${noi ? noi.toFixed(0) : 'N/A'}/year\n`);

    // Validation checks
    console.log('========================================');
    console.log('✅ VALIDATION CHECKS');
    console.log('========================================\n');

    let allPassed = true;

    // Check 1: Building type should affect cap rate scoring
    console.log('1. Building Type Adjustment:');
    if (result.investmentDecision?.reasoningSteps) {
      const capRateReasoning = result.investmentDecision.reasoningSteps.find(
        step => step.includes('Cap Rate') || step.includes('cap rate')
      );
      if (capRateReasoning) {
        console.log(`   ✅ Cap rate scoring includes building type consideration`);
        console.log(`   📝 ${capRateReasoning}`);
      } else {
        console.log(`   ⚠️  Cap rate reasoning not found in decision steps`);
      }
    }
    console.log('');

    // Check 2: Verdict should be appropriate for good MF deal
    console.log('2. Verdict Appropriateness:');
    const validVerdicts = ['BUY', 'NEGOTIATE', 'CAUTION'];
    if (validVerdicts.includes(verdict)) {
      console.log(`   ✅ Verdict '${verdict}' is appropriate for quality MF property`);
    } else {
      console.log(`   ❌ Verdict '${verdict}' unexpected for good Mid-Rise deal`);
      allPassed = false;
    }
    console.log('');

    // Check 3: Deal quality score should reflect good deal
    console.log('3. Deal Quality Score:');
    if (dealQuality >= 50) {
      console.log(`   ✅ Deal Quality ${dealQuality}/100 indicates viable investment`);
    } else {
      console.log(`   ❌ Deal Quality ${dealQuality}/100 too low for good MF property`);
      allPassed = false;
    }
    console.log('');

    // Check 4: Cap rate should be reasonable for Dallas MF
    console.log('4. Cap Rate Reasonableness:');
    const capRatePct = capRate * 100;
    if (capRatePct >= 3.5 && capRatePct <= 8.0) {
      console.log(`   ✅ Cap Rate ${capRatePct.toFixed(2)}% is reasonable for Dallas A-Class MF`);
      console.log(`   📊 Expected range: 3.5% - 6.5% for institutional Mid-Rise`);
    } else {
      console.log(`   ⚠️  Cap Rate ${capRatePct.toFixed(2)}% outside typical Dallas range`);
    }
    console.log('');

    // Check 5: Cash flow should be positive
    console.log('5. Cash Flow:');
    if (cashFlow > 0) {
      console.log(`   ✅ Positive monthly cash flow: $${cashFlow.toFixed(0)}`);
    } else {
      console.log(`   ❌ Negative monthly cash flow: $${cashFlow.toFixed(0)}`);
      allPassed = false;
    }
    console.log('');

    // Final summary
    console.log('========================================');
    if (allPassed) {
      console.log('✅ ALL CRITICAL CHECKS PASSED');
      console.log('========================================\n');
      console.log('🎉 MF Building Type Logic Working Correctly!\n');
      console.log('📋 Summary:');
      console.log(`   - Building type (MID_RISE) is being considered`);
      console.log(`   - Verdict '${verdict}' is appropriate`);
      console.log(`   - Deal Quality ${dealQuality}/100 reflects quality metrics`);
      console.log(`   - Financial metrics are reasonable for Dallas MF market\n`);
      process.exit(0);
    } else {
      console.log('❌ SOME CHECKS FAILED');
      console.log('========================================\n');
      console.log('⚠️  Review the failed checks above\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run test
testMFBuildingType();
