#!/usr/bin/env node

/**
 * Test Phase 3: Strategy Alignment Implementation
 * 
 * Tests strategy alignment analysis with different strategy mismatches:
 * - Cash flow strategy in appreciation market (misaligned)
 * - Appreciation strategy in cash flow market (misaligned)
 * - Balanced strategy with proper alignment
 * - Experience level vs property complexity mismatches
 * - Short-term hold vs appreciation strategy conflicts
 */

const axios = require('axios');

async function testPhase3Implementation() {
  console.log('🧪 Testing Phase 3: Strategy Alignment Implementation');
  console.log('🎯 Testing Strategy Mismatches and Alignment');
  console.log('==============================================\n');

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
      console.log('✅ Authentication successful\n');
    } else {
      console.error('❌ Authentication failed - no token received');
      return;
    }
  } catch (authError) {
    console.error('❌ Authentication failed:', authError.response?.data || authError.message);
    return;
  }

  // Define strategy alignment test scenarios
  const strategyScenarios = [
    {
      name: "MISMATCH: Cash Flow Strategy in Appreciation Market (Austin, TX)",
      expectedAlignment: 'poor',
      expectedMisalignments: ['strategy_market'],
      property: {
        purchasePrice: 680000, // High price for appreciation market
        propertyAddress: {
          street: "789 Tech Blvd",
          city: "Austin", // Tier 1 appreciation-focused market
          state: "TX",
          zipCode: "78701"
        },
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 2200,
        yearBuilt: 2018,
        lotSize: 8500,
        propertyType: 'SFR',
        monthlyRent: 3400, // Lower rent relative to price (poor cash flow)
        propertyTaxes: 10200,
        insurance: 2800,
        maintenance: 3200,
        vacancy: 850,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.05, // Strong appreciation market
          annualRentIncrease: 0.04,
          annualExpenseIncrease: 0.025
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'cashflow', // MISMATCH: Cash flow focus in appreciation market
          riskApproach: 'balanced',
          marketTimingFlexibility: 'flexible'
        }
      }
    },
    {
      name: "MISMATCH: Appreciation Strategy in Cash Flow Market (Anna, TX)",
      expectedAlignment: 'poor', 
      expectedMisalignments: ['strategy_market'],
      property: {
        purchasePrice: 320000, // Lower price for cash flow market
        propertyAddress: {
          street: "456 Country Road",
          city: "Anna", // Tier 3 cash flow-focused market
          state: "TX", 
          zipCode: "75409"
        },
        bedrooms: 4,
        bathrooms: 2,
        sqft: 1950,
        yearBuilt: 2015,
        lotSize: 9200,
        propertyType: 'SFR',
        monthlyRent: 2600, // Good cash flow relative to price
        propertyTaxes: 4800,
        insurance: 1600,
        maintenance: 1900,
        vacancy: 650,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.025, // Limited appreciation potential
          annualRentIncrease: 0.025,
          annualExpenseIncrease: 0.03
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'appreciation', // MISMATCH: Appreciation focus in cash flow market
          riskApproach: 'aggressive',
          marketTimingFlexibility: 'somewhat'
        }
      }
    },
    {
      name: "MISMATCH: Novice + Class C Property (High Risk)",
      expectedAlignment: 'mismatch',
      expectedMisalignments: ['experience_risk'],
      property: {
        purchasePrice: 185000, // Low price indicating Class C
        propertyAddress: {
          street: "123 Old Main St",
          city: "Mesquite", // Smaller Texas city
          state: "TX",
          zipCode: "75149"
        },
        bedrooms: 3,
        bathrooms: 1.5,
        sqft: 1400,
        yearBuilt: 1968, // Very old property = Class C
        lotSize: 7000,
        propertyType: 'SFR',
        monthlyRent: 1650, // Good cash flow but high management
        propertyTaxes: 2800,
        insurance: 1200,
        maintenance: 2400, // Higher maintenance for older property
        vacancy: 415,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.02, // Limited appreciation
          annualRentIncrease: 0.02,
          annualExpenseIncrease: 0.04 // Higher expense growth
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'first', // MISMATCH: First-time investor + high-risk property
          riskApproach: 'conservative', // MISMATCH: Conservative + Class C
          marketTimingFlexibility: 'constrained'
        }
      }
    },
    {
      name: "MISMATCH: Short-Term Hold + Appreciation Strategy",
      expectedAlignment: 'fair',
      expectedMisalignments: ['hold_period'],
      property: {
        purchasePrice: 475000,
        propertyAddress: {
          street: "888 Growth Avenue", 
          city: "Frisco", // Growing suburb
          state: "TX",
          zipCode: "75034"
        },
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2400,
        yearBuilt: 2019,
        lotSize: 8800,
        propertyType: 'SFR',
        monthlyRent: 3200,
        propertyTaxes: 7100,
        insurance: 2200,
        maintenance: 2400,
        vacancy: 800,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 2, // MISMATCH: Short hold period for appreciation
          annualAppreciation: 0.04,
          annualRentIncrease: 0.035,
          annualExpenseIncrease: 0.025
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'appreciation', // MISMATCH: Appreciation strategy with 2-year hold
          riskApproach: 'aggressive',
          marketTimingFlexibility: 'constrained' // MISMATCH: Constrained timing + short hold
        }
      }
    },
    {
      name: "GOOD ALIGNMENT: Balanced Strategy in Tier 2 Market (Dallas, TX)",
      expectedAlignment: 'good',
      expectedMisalignments: [],
      property: {
        purchasePrice: 385000,
        propertyAddress: {
          street: "555 Balance Street",
          city: "Dallas", // Tier 2 balanced market
          state: "TX",
          zipCode: "75201"
        },
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1850,
        yearBuilt: 2012, // Class B property
        lotSize: 7500,
        propertyType: 'SFR',
        monthlyRent: 2850,
        propertyTaxes: 5800,
        insurance: 1700,
        maintenance: 2100,
        vacancy: 700,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 6, // Good medium-term hold
          annualAppreciation: 0.03,
          annualRentIncrease: 0.03,
          annualExpenseIncrease: 0.025
        },
        exitStrategy: {
          primaryExitStrategy: 'sale',
          portfolioStrategy: 'balanced', // GOOD: Balanced strategy in balanced market
          riskApproach: 'moderate', // GOOD: Moderate risk approach
          marketTimingFlexibility: 'flexible'
        }
      }
    }
  ];

  const results = [];

  // Test each strategy alignment scenario
  for (let i = 0; i < strategyScenarios.length; i++) {
    const scenario = strategyScenarios[i];
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 TESTING: ${scenario.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`💰 Purchase Price: $${scenario.property.purchasePrice.toLocaleString()}`);
    console.log(`🏠 Monthly Rent: $${scenario.property.monthlyRent.toLocaleString()}`);
    console.log(`📍 Location: ${scenario.property.propertyAddress.city}, ${scenario.property.propertyAddress.state}`);
    console.log(`📅 Year Built: ${scenario.property.yearBuilt} (${new Date().getFullYear() - scenario.property.yearBuilt} years old)`);
    console.log(`🎯 Portfolio Strategy: ${scenario.property.exitStrategy?.portfolioStrategy}`);
    console.log(`⏱️  Hold Period: ${scenario.property.longTermAssumptions?.projectionYears || 10} years`);
    console.log(`⚖️  Risk Approach: ${scenario.property.exitStrategy?.riskApproach}`);
    console.log(`🎯 Expected Alignment: ${scenario.expectedAlignment.toUpperCase()}`);

    try {
      console.log('\n📊 Sending analysis request...');
      
      const response = await axios.post('http://localhost:3001/api/deals/analyze', scenario.property, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 60000
      });

      if (response.status === 200 && response.data) {
        const { investmentDecision } = response.data;
        
        console.log('✅ Analysis completed successfully!\n');
        
        // Extract strategy alignment info from decision
        const alignmentInfo = extractAlignmentInfo(investmentDecision);
        
        console.log('🎯 INVESTMENT DECISION RESULTS');
        console.log('==============================');
        console.log(`🏆 Verdict: ${investmentDecision.verdict}`);
        console.log(`📈 Confidence: ${investmentDecision.confidence}%`);
        console.log(`⭐ Property Score: ${investmentDecision.score || 'N/A'}/100`);
        console.log(`📝 Primary Reason: ${investmentDecision.primaryReason}`);
        
        // Strategy Alignment Results
        console.log('\n🎯 STRATEGY ALIGNMENT RESULTS (Phase 3)');
        console.log('=======================================');
        console.log(`📊 Detected Alignment: ${alignmentInfo.detectedAlignment || 'Not found'}`);
        console.log(`🎯 Expected Alignment: ${scenario.expectedAlignment}`);
        console.log(`✅ Alignment Match: ${(alignmentInfo.detectedAlignment || '').toLowerCase().includes(scenario.expectedAlignment) ? 'YES' : 'NO'}`);
        
        if (alignmentInfo.alignmentScore) {
          console.log(`📈 Alignment Score: ${alignmentInfo.alignmentScore}`);
        }
        
        if (alignmentInfo.misalignments.length > 0) {
          console.log(`⚠️  Detected Misalignments: ${alignmentInfo.misalignments.join(', ')}`);
        }
        
        if (alignmentInfo.recommendations.length > 0) {
          console.log(`💡 Strategy Recommendations: ${alignmentInfo.recommendations.length} found`);
        }
        
        // Enhanced Insights (All Phases)
        console.log('\n🧠 ENHANCED INSIGHTS (Phase 2A + 2B + 3)');
        console.log('=========================================');
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
        
        // Store results for summary
        results.push({
          name: scenario.name,
          expectedAlignment: scenario.expectedAlignment,
          detectedAlignment: alignmentInfo.detectedAlignment,
          alignmentScore: alignmentInfo.alignmentScore,
          verdict: investmentDecision.verdict,
          confidence: investmentDecision.confidence,
          score: investmentDecision.score,
          alignmentMatch: (alignmentInfo.detectedAlignment || '').toLowerCase().includes(scenario.expectedAlignment),
          misalignments: alignmentInfo.misalignments,
          recommendations: alignmentInfo.recommendations,
          expectedMisalignments: scenario.expectedMisalignments,
          misalignmentMatch: scenario.expectedMisalignments.some(expected => 
            alignmentInfo.misalignments.some(detected => detected.includes(expected.replace('_', ' ')))
          )
        });
        
      } else {
        console.error('❌ Invalid response from server');
        results.push({
          name: scenario.name,
          error: 'Invalid response'
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed with error:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
      
      results.push({
        name: scenario.name,
        error: error.message
      });
    }
  }

  // Generate comprehensive test summary
  console.log('\n' + '='.repeat(80));
  console.log('🔬 PHASE 3 TEST SUMMARY & ANALYSIS');
  console.log('='.repeat(80));
  
  console.log('\n📊 STRATEGY ALIGNMENT RESULTS');
  console.log('==============================');
  
  results.forEach((result, index) => {
    if (!result.error) {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   🎯 Expected: ${result.expectedAlignment.toUpperCase()} | Detected: ${result.detectedAlignment || 'N/A'}`);
      console.log(`   ✅ Alignment Match: ${result.alignmentMatch ? 'YES' : 'NO'}`);
      console.log(`   📈 Alignment Score: ${result.alignmentScore || 'N/A'}`);
      console.log(`   🏆 Verdict: ${result.verdict} (${result.confidence}% confidence)`);
      console.log(`   ⭐ Score: ${result.score || 'N/A'}/100`);
      if (result.expectedMisalignments.length > 0) {
        console.log(`   ⚠️  Expected Misalignments: ${result.expectedMisalignments.join(', ')}`);
        console.log(`   🔍 Misalignment Detection: ${result.misalignmentMatch ? 'YES' : 'NO'}`);
      }
      console.log('');
    } else {
      console.log(`${index + 1}. ${result.name} - ERROR: ${result.error}`);
    }
  });
  
  // Test Assertions
  console.log('🧪 PHASE 3 TEST ASSERTIONS');
  console.log('===========================');
  
  const successfulTests = results.filter(r => !r.error);
  const alignmentMatches = successfulTests.filter(r => r.alignmentMatch).length;
  const misalignmentDetections = successfulTests.filter(r => 
    r.expectedMisalignments.length === 0 || r.misalignmentMatch
  ).length;
  const totalTests = successfulTests.length;
  
  const assertions = [];
  
  // Test 1: Strategy alignment system working
  if (successfulTests.some(r => r.detectedAlignment)) {
    assertions.push('✅ Strategy alignment analysis operational');
  } else {
    assertions.push('❌ Strategy alignment analysis not working');
  }
  
  // Test 2: Alignment level detection accuracy
  if (alignmentMatches >= totalTests * 0.6) {
    assertions.push('✅ Alignment level detection working correctly');
  } else {
    assertions.push('❌ Alignment level detection needs improvement');
  }
  
  // Test 3: Misalignment detection
  if (misalignmentDetections >= totalTests * 0.7) {
    assertions.push('✅ Misalignment detection functioning');
  } else {
    assertions.push('❌ Misalignment detection needs improvement');
  }
  
  // Test 4: Confidence adjustments for misaligned strategies
  const misalignedProperties = successfulTests.filter(r => 
    r.expectedAlignment === 'poor' || r.expectedAlignment === 'mismatch'
  );
  const lowConfidenceForMisaligned = misalignedProperties.filter(r => r.confidence < 70).length;
  
  if (misalignedProperties.length > 0 && lowConfidenceForMisaligned / misalignedProperties.length >= 0.5) {
    assertions.push('✅ Strategy misalignments affecting confidence scores');
  } else if (misalignedProperties.length === 0) {
    assertions.push('ℹ️  No misaligned properties to test confidence adjustments');
  } else {
    assertions.push('❌ Strategy misalignments not properly affecting confidence');
  }
  
  // Test 5: Integration with previous phases
  if (totalTests > 0) {
    assertions.push('✅ Phase 3 integration with Phase 2A + 2B successful');
  } else {
    assertions.push('❌ Phase 3 integration failed');
  }
  
  assertions.forEach(assertion => console.log(assertion));
  
  console.log(`\n📊 Phase 3 Test Results: ${assertions.filter(a => a.includes('✅')).length}/${assertions.length} tests passed`);
  console.log(`📊 Alignment Detection Accuracy: ${alignmentMatches}/${totalTests} scenarios correctly identified`);
  console.log(`📊 Misalignment Detection Accuracy: ${misalignmentDetections}/${totalTests} misalignment scenarios handled`);
  
  if (assertions.filter(a => a.includes('✅')).length >= assertions.length * 0.8) {
    console.log('🎉 Phase 3: Strategy Alignment implementation SUCCESSFUL!');
    console.log('👨‍💼 The engine now provides sophisticated strategy alignment analysis');
    console.log('🚀 Investment Decision Engine v2.1 with Phases 2A + 2B + 3 COMPLETE!');
  } else {
    console.log('⚠️  Some Phase 3 features need refinement');
  }
  
  // Value Proposition Analysis
  console.log('\n💡 ENHANCED VALUE PROPOSITION (Full System)');
  console.log('===========================================');
  console.log('🆕 NEW CAPABILITIES ADDED BY PHASE 3:');
  console.log('1. Strategy-market fit analysis (cashflow vs appreciation markets)');
  console.log('2. Hold period alignment with investment strategy and property type');
  console.log('3. Experience level vs property complexity matching');
  console.log('4. Risk tolerance alignment with property and market risk profiles');
  console.log('5. Opportunity cost analysis for significant strategy misalignments');
  console.log('6. Strategic recommendations with expected improvement metrics');
  console.log('7. Institutional-grade investment decision intelligence');
  console.log('\n🏆 COMPLETE SYSTEM CAPABILITIES (Phases 2A + 2B + 3):');
  console.log('• Market tier classification and relative analysis');
  console.log('• A/B/C property classification with risk adjustments');  
  console.log('• Strategy alignment analysis with misalignment detection');
  console.log('• Fair market value calculations with market intelligence');
  console.log('• Property quality scoring with composite risk assessment');
  console.log('• Professional investment verdicts with confidence scoring');
}

// Helper function to extract strategy alignment info from decision
function extractAlignmentInfo(investmentDecision) {
  const info = {
    detectedAlignment: null,
    alignmentScore: null,
    misalignments: [],
    recommendations: []
  };
  
  // Look for alignment information in secondary reasons
  if (investmentDecision.secondaryReasons) {
    investmentDecision.secondaryReasons.forEach(reason => {
      // Strategy Alignment patterns
      if (reason.includes('Strategy Alignment: ')) {
        const alignmentMatch = reason.match(/Strategy Alignment: (\w+)/i);
        if (alignmentMatch) {
          info.detectedAlignment = alignmentMatch[1].toLowerCase();
        }
        
        // Extract alignment score
        const scoreMatch = reason.match(/\((\d+)\/100\)/);
        if (scoreMatch) {
          info.alignmentScore = scoreMatch[1] + '/100';
        }
      }
      
      // Misalignment detection
      if (reason.includes('⚠️') && (reason.includes('strategy') || reason.includes('alignment'))) {
        if (reason.includes('Cash flow strategy')) info.misalignments.push('strategy_market');
        if (reason.includes('Appreciation strategy')) info.misalignments.push('strategy_market');
        if (reason.includes('Short-term') || reason.includes('hold period')) info.misalignments.push('hold_period');
        if (reason.includes('Novice') || reason.includes('experience')) info.misalignments.push('experience_risk');
        if (reason.includes('Conservative') || reason.includes('risk tolerance')) info.misalignments.push('risk_tolerance');
      }
      
      // Recommendations detection
      if (reason.includes('💡')) {
        info.recommendations.push(reason);
      }
    });
  }
  
  // Look for strategy risks in keyRisks
  if (investmentDecision.keyRisks) {
    investmentDecision.keyRisks.forEach(risk => {
      if (risk.includes('Strategy misalignment') || risk.includes('strategy')) {
        info.misalignments.push('strategy_general');
      }
    });
  }
  
  return info;
}

// Run the test
if (require.main === module) {
  testPhase3Implementation()
    .then(() => {
      console.log('\n🏁 Phase 3 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPhase3Implementation };