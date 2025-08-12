#!/usr/bin/env node

/**
 * Test script for Phase 1: Strategic Timeline Integration
 * Tests:
 * 1. Timeline extraction from enhanced goals
 * 2. Proper cap rate display (not 700.2%)
 * 3. Strategic timeline in messaging vs 10-year financial calculations
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Test property data with strong fundamentals
const testProperty = {
  propertyType: 'SFR',
  propertyName: 'Test Strategic Timeline Property',
  address: '123 Test St',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
  
  // Financial inputs
  purchasePrice: 350000,  // Lower price for better fundamentals
  downPayment: 70000,  // 20% down
  interestRate: 7.0,
  loanTerm: 30,
  
  // Income
  monthlyRent: 3200,  // Same rent = better cap rate
  
  // Expenses
  propertyTaxRate: 1.2,
  insuranceRate: 0.35,
  maintenanceCost: 2400,
  propertyManagementRate: 8,
  hoaFees: 0,
  utilities: 0,
  
  // Property details
  yearBuilt: 2015,
  squareFootage: 2000,
  bedrooms: 3,
  bathrooms: 2,
  
  // Additional costs
  closingCosts: 5000,
  capitalInvestments: 10000,
  
  // Assumptions
  longTermAssumptions: {
    annualRentIncrease: 3,
    annualExpenseIncrease: 2,
    annualAppreciation: 4,
    vacancyRate: 5,
    sellingCostPercentage: 7,
    projectionYears: 10  // Keep at 10 for financial calculations
  },
  
  // Enhanced goals with strategic timeline
  enhancedGoals: {
    returnThreshold: 15,
    riskTolerance: 'medium',
    cashFlowPreference: 'high',
    appreciationExpectation: 'moderate',
    investmentStrategy: 'Buy and Hold',
    experience: 'intermediate',
    freeTextStrategy: 'Looking for strong cash flow property to hold for 3-7 years with potential for appreciation in growing Austin market'
  }
};

async function testImplementation() {
  console.log('🧪 Testing Phase 1 Implementation...\n');
  
  try {
    // First, login to get a token
    console.log('🔐 Logging in to get access token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'dualmode.test@example.com',
      password: 'TestUser123!'
    });
    
    const token = loginResponse.data.token || loginResponse.data.accessToken;
    console.log('✅ Login successful!');
    console.log('Token received:', token ? 'Yes' : 'No');
    console.log();
    
    // Make the API call with authentication
    console.log('📤 Sending property analysis request...');
    const response = await axios.post(`${API_URL}/deals/analyze`, testProperty, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const { data } = response;
    
    console.log('\n✅ Analysis completed successfully!\n');
    console.log('=' .repeat(60));
    
    // Debug: Show what we received
    console.log('\n🔍 DEBUG - Response structure:');
    console.log('Keys in response:', Object.keys(data));
    if (data.analysis) {
      console.log('Keys in analysis:', Object.keys(data.analysis));
    }
    
    // Test 1: Check Investment Decision Engine response
    console.log('\n📊 INVESTMENT DECISION ENGINE RESULTS:');
    console.log('-'.repeat(40));
    
    if (data.analysis?.investmentDecision || data.investmentDecision) {
      const decision = data.analysis?.investmentDecision || data.investmentDecision;
      
      console.log(`Verdict: ${decision.verdict}`);
      console.log(`Confidence: ${decision.confidence}%`);
      console.log(`AI Score: ${decision.aiScore || decision.score || 'N/A'}/100`);
      
      // Test 2: Check strategic timeline in messaging
      console.log('\n🕐 STRATEGIC TIMELINE TEST:');
      console.log('-'.repeat(40));
      
      const hasStrategicTimeline = decision.detailedAnalysis?.includes('3-7 year') || 
                                   decision.detailedAnalysis?.includes('3-7-year') ||
                                   decision.primaryReason?.includes('3-7 year') ||
                                   decision.primaryReason?.includes('3-7-year') ||
                                   decision.goalBasedReasoning?.includes('3-7 year') ||
                                   decision.goalBasedReasoning?.includes('3-7-year');
      
      if (hasStrategicTimeline) {
        console.log('✅ Strategic timeline (3-7 years) found in messaging!');
      } else {
        console.log('❌ Strategic timeline NOT found in messaging');
        console.log('Primary Reason:', decision.primaryReason);
      }
      
      // Test 3: Verify financial calculations still use 10 years
      console.log('\n💰 FINANCIAL PROJECTIONS TEST:');
      console.log('-'.repeat(40));
      
      const projectionYears = data.longTermAnalysis?.projections?.length || 
                            data.analysis?.projections?.length || 0;
      console.log(`Projection Years: ${projectionYears}`);
      
      if (projectionYears === 10) {
        console.log('✅ Financial calculations still using 10 years!');
      } else {
        console.log('❌ Financial calculations NOT using 10 years');
      }
      
      // Test 4: Check cap rate display
      console.log('\n📈 CAP RATE DISPLAY TEST:');
      console.log('-'.repeat(40));
      
      const capRate = data.keyMetrics?.capRate || 
                     data.analysis?.keyMetrics?.capRate || 
                     data.yearOneMetrics?.capRate || 0;
      
      console.log(`Cap Rate: ${capRate}%`);
      
      if (capRate > 0 && capRate < 100) {
        console.log('✅ Cap rate displaying correctly (not 700.2%)!');
      } else {
        console.log('❌ Cap rate display issue detected');
      }
      
      // Show detailed analysis for verification
      console.log('\n📝 DETAILED ANALYSIS:');
      console.log('-'.repeat(40));
      console.log('Primary Reason:', decision.primaryReason);
      console.log('\nSecondary Reasons:');
      decision.secondaryReasons?.forEach((reason, i) => {
        console.log(`${i + 1}. ${reason}`);
      });
      
      if (decision.detailedAnalysis) {
        console.log('\nFull Analysis (first 1000 chars):');
        console.log(decision.detailedAnalysis.substring(0, 1000) + '...');
      }
      
      // Debug: check what's in the decision object
      console.log('\n🔍 DEBUG - Decision object keys:');
      console.log(Object.keys(decision));
      
      // Check goalBasedReasoning for timeline
      if (decision.goalBasedReasoning) {
        console.log('\n📋 Goal-Based Reasoning:');
        console.log(decision.goalBasedReasoning);
      }
      
    } else {
      console.log('❌ No investment decision in response');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUMMARY:');
    console.log('Phase 1 implementation test complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testImplementation();