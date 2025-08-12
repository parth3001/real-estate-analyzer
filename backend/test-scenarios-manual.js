#!/usr/bin/env node

/**
 * Interactive Manual Test Tool for Investment Decision Engine
 * Quick scenarios you can run one at a time
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:3001/api';

// Pre-configured test scenarios
const TEST_SCENARIOS = {
  1: {
    name: '🏆 STRONG BUY - Cash Flow Monster',
    description: 'Cleveland rental with excellent cash flow',
    data: {
      city: 'Cleveland',
      state: 'OH',
      purchasePrice: 150000,
      downPayment: 30000,
      monthlyRent: 1800,
      propertyTaxRate: 1.5,
      interestRate: 7.0,
      enhancedGoals: {
        freeTextStrategy: 'Looking for strong cash flow properties to hold for 5-10 years'
      }
    },
    expectedVerdict: 'BUY',
    expectedConfidence: '70-90%'
  },
  
  2: {
    name: '❌ CLEAR PASS - Overpriced California',
    description: 'San Francisco property with negative cash flow',
    data: {
      city: 'San Francisco',
      state: 'CA',
      purchasePrice: 850000,
      downPayment: 170000,
      monthlyRent: 4500,
      propertyTaxRate: 1.2,
      interestRate: 7.0,
      enhancedGoals: {
        freeTextStrategy: 'Need positive cash flow for my first investment property'
      }
    },
    expectedVerdict: 'PASS',
    expectedConfidence: '60-80%'
  },
  
  3: {
    name: '🤝 NEGOTIATE - Austin Balanced',
    description: 'Good property but slightly overpriced',
    data: {
      city: 'Austin',
      state: 'TX',
      purchasePrice: 400000,
      downPayment: 80000,
      monthlyRent: 3200,
      propertyTaxRate: 1.8,
      interestRate: 7.0,
      enhancedGoals: {
        freeTextStrategy: 'Balanced investment for 3-7 years with appreciation potential'
      }
    },
    expectedVerdict: 'NEGOTIATE',
    expectedConfidence: '40-60%'
  },
  
  4: {
    name: '🏠 HOUSE HACK - Denver Duplex',
    description: 'Live in one unit, rent the other',
    data: {
      city: 'Denver',
      state: 'CO',
      purchasePrice: 450000,
      downPayment: 22500, // 5% down for owner-occupied
      monthlyRent: 2200, // One unit rental income
      propertyTaxRate: 0.7,
      interestRate: 6.5, // Better rate for owner-occupied
      utilities: -150, // You pay some utilities
      enhancedGoals: {
        freeTextStrategy: 'House hack for 2-3 years then convert to full rental'
      }
    },
    expectedVerdict: 'BUY',
    expectedConfidence: '60-75%'
  },
  
  5: {
    name: '🔨 VALUE ADD - Memphis Fixer',
    description: 'Distressed property with upside',
    data: {
      city: 'Memphis',
      state: 'TN',
      purchasePrice: 120000,
      downPayment: 24000,
      monthlyRent: 1400, // After repairs
      propertyTaxRate: 1.9,
      capitalInvestments: 30000,
      interestRate: 7.5,
      enhancedGoals: {
        freeTextStrategy: 'Fix and hold strategy for 5+ years'
      }
    },
    expectedVerdict: 'BUY',
    expectedConfidence: '50-70%'
  },
  
  6: {
    name: '💎 LUXURY - Miami High-End',
    description: 'Premium property with lower yields',
    data: {
      city: 'Miami',
      state: 'FL',
      purchasePrice: 1200000,
      downPayment: 360000, // 30% down for jumbo
      monthlyRent: 7500,
      propertyTaxRate: 1.0,
      hoaFees: 800,
      interestRate: 7.75, // Jumbo rate
      enhancedGoals: {
        freeTextStrategy: 'Trophy property for long-term appreciation in premium market'
      }
    },
    expectedVerdict: 'PASS',
    expectedConfidence: '60-80%'
  },
  
  7: {
    name: '🎓 STUDENT HOUSING - College Town',
    description: 'Near university with multiple tenants',
    data: {
      city: 'Ann Arbor',
      state: 'MI',
      purchasePrice: 280000,
      downPayment: 56000,
      monthlyRent: 3200, // 4 students at $800 each
      propertyTaxRate: 1.4,
      maintenanceCost: 4000, // Higher for student housing
      interestRate: 7.0,
      enhancedGoals: {
        freeTextStrategy: 'Student rental with 9-month leases, hold for 5-7 years'
      }
    },
    expectedVerdict: 'BUY',
    expectedConfidence: '55-75%'
  },
  
  8: {
    name: '📉 NEGATIVE CASH FLOW - Appreciation Play',
    description: 'Betting on appreciation only',
    data: {
      city: 'Seattle',
      state: 'WA',
      purchasePrice: 650000,
      downPayment: 130000,
      monthlyRent: 3500,
      propertyTaxRate: 1.1,
      interestRate: 7.0,
      enhancedGoals: {
        freeTextStrategy: 'Tech hub appreciation play for 3-5 years, can handle negative cash flow'
      }
    },
    expectedVerdict: 'PASS/NEGOTIATE',
    expectedConfidence: '40-60%'
  },
  
  9: {
    name: '💰 ALL CASH - No Financing',
    description: 'Cash purchase with no leverage',
    data: {
      city: 'Phoenix',
      state: 'AZ',
      purchasePrice: 250000,
      downPayment: 250000, // All cash
      monthlyRent: 2100,
      propertyTaxRate: 0.8,
      interestRate: 0,
      loanTerm: 0,
      enhancedGoals: {
        freeTextStrategy: 'All cash purchase for stable returns over 10+ years'
      }
    },
    expectedVerdict: 'BUY',
    expectedConfidence: '70-85%'
  },
  
  10: {
    name: '⚠️  HIGH LEVERAGE - 5% Down',
    description: 'Maximum leverage scenario',
    data: {
      city: 'Las Vegas',
      state: 'NV',
      purchasePrice: 320000,
      downPayment: 16000, // 5% down
      monthlyRent: 2400,
      propertyTaxRate: 0.7,
      interestRate: 8.5, // Higher rate for low down payment
      enhancedGoals: {
        freeTextStrategy: 'Maximize leverage for multiple properties, 5-year hold'
      }
    },
    expectedVerdict: 'NEGOTIATE',
    expectedConfidence: '30-50%'
  }
};

// Helper function to build complete property data
function buildPropertyData(scenario) {
  const base = scenario.data;
  
  return {
    propertyType: 'SFR',
    propertyName: scenario.name,
    address: '123 Test Street',
    city: base.city,
    state: base.state,
    zipCode: '12345',
    
    // Financial
    purchasePrice: base.purchasePrice,
    downPayment: base.downPayment,
    interestRate: base.interestRate,
    loanTerm: base.loanTerm || 30,
    
    // Income
    monthlyRent: base.monthlyRent,
    
    // Expenses
    propertyTaxRate: base.propertyTaxRate,
    insuranceRate: base.insuranceRate || 0.35,
    maintenanceCost: base.maintenanceCost || 2400,
    propertyManagementRate: base.propertyManagementRate || 8,
    hoaFees: base.hoaFees || 0,
    utilities: base.utilities || 0,
    
    // Property details
    yearBuilt: 2015,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    
    // Additional
    closingCosts: 5000,
    capitalInvestments: base.capitalInvestments || 0,
    
    // Assumptions
    longTermAssumptions: {
      annualRentIncrease: 3,
      annualExpenseIncrease: 2,
      annualAppreciation: 4,
      vacancyRate: 5,
      sellingCostPercentage: 7,
      projectionYears: 10
    },
    
    // Goals
    enhancedGoals: {
      returnThreshold: 15,
      riskTolerance: 'medium',
      cashFlowPreference: 'medium',
      appreciationExpectation: 'moderate',
      investmentStrategy: 'Buy and Hold',
      experience: 'intermediate',
      ...base.enhancedGoals
    }
  };
}

// Main interactive test function
async function runInteractiveTest() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🏦 Investment Decision Engine - Manual Test Tool');
  console.log('=' . repeat(60));
  console.log('\nAvailable Test Scenarios:\n');
  
  Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
    console.log(`${key}. ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Expected: ${scenario.expectedVerdict} (${scenario.expectedConfidence})\n`);
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    // Get user choice
    const choice = await question('Enter scenario number (1-10) or "all" to run all: ');
    
    // Login
    console.log('\n🔐 Authenticating...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'dualmode.test@example.com',
      password: 'TestUser123!'
    });
    const token = loginResponse.data.token || loginResponse.data.accessToken;
    console.log('✅ Authentication successful!\n');
    
    // Run selected tests
    if (choice.toLowerCase() === 'all') {
      // Run all scenarios
      for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
        await runSingleTest(scenario, token);
        console.log('-'.repeat(60) + '\n');
      }
    } else {
      // Run single scenario
      const scenarioNum = parseInt(choice);
      if (TEST_SCENARIOS[scenarioNum]) {
        await runSingleTest(TEST_SCENARIOS[scenarioNum], token);
      } else {
        console.log('❌ Invalid scenario number');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

async function runSingleTest(scenario, token) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  console.log('-'.repeat(40));
  
  const propertyData = buildPropertyData(scenario);
  
  console.log(`📍 Location: ${propertyData.city}, ${propertyData.state}`);
  console.log(`💰 Price: $${propertyData.purchasePrice.toLocaleString()}`);
  console.log(`🏠 Rent: $${propertyData.monthlyRent.toLocaleString()}/month`);
  console.log(`📊 Cap Rate: ${((propertyData.monthlyRent * 12 * 0.95 - propertyData.purchasePrice * 0.02) / propertyData.purchasePrice * 100).toFixed(2)}%`);
  console.log(`📝 Strategy: ${propertyData.enhancedGoals.freeTextStrategy}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/deals/analyze`,
      propertyData,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    const decision = response.data.investmentDecision;
    
    console.log('\n📊 RESULTS:');
    console.log(`Verdict: ${decision.verdict}`);
    console.log(`Confidence: ${decision.confidence}%`);
    console.log(`AI Score: ${decision.score}/100`);
    console.log(`\nPrimary Reason: ${decision.primaryReason}`);
    
    if (decision.secondaryReasons && decision.secondaryReasons.length > 0) {
      console.log('\nSecondary Reasons:');
      decision.secondaryReasons.forEach((reason, i) => {
        console.log(`${i + 1}. ${reason}`);
      });
    }
    
    if (decision.goalBasedReasoning) {
      console.log(`\nGoal-Based Analysis: ${decision.goalBasedReasoning}`);
    }
    
    // Check if timeline appears
    const hasTimeline = decision.goalBasedReasoning && 
                       (decision.goalBasedReasoning.includes('year') || 
                        decision.goalBasedReasoning.includes('timeline'));
    console.log(`\n✅ Timeline in messaging: ${hasTimeline ? 'Yes' : 'No'}`);
    
    // Validate against expectations
    console.log('\n📋 VALIDATION:');
    console.log(`Expected: ${scenario.expectedVerdict} (${scenario.expectedConfidence})`);
    console.log(`Actual: ${decision.verdict} (${decision.confidence}%)`);
    
    const verdictMatch = scenario.expectedVerdict.includes(decision.verdict);
    console.log(`Result: ${verdictMatch ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the interactive test
if (require.main === module) {
  runInteractiveTest();
}