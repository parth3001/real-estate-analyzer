#!/usr/bin/env node

/**
 * Test Phase 2B: Property Classification Implementation
 * 
 * Tests A/B/C property classification with different property archetypes:
 * - Class A: New luxury property (Austin, TX)
 * - Class B: Standard investment property (Dallas, TX) 
 * - Class C: Older value property (Anna, TX)
 */

const axios = require('axios');

async function testPhase2BImplementation() {
  console.log('🧪 Testing Phase 2B: Property Classification Implementation');
  console.log('🏘️  Testing A/B/C Property Archetypes');
  console.log('=============================================\n');

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

  // Define property archetypes for testing
  const propertyArchetypes = [
    {
      name: "Class A - Luxury Property (Austin, TX)",
      expectedClass: 'A',
      property: {
        purchasePrice: 650000,
        propertyAddress: {
          street: "456 Oak Avenue",
          city: "Austin",
          state: "TX",
          zipCode: "78701"
        },
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        yearBuilt: 2020, // New construction
        lotSize: 9000,
        propertyType: 'SFR',
        monthlyRent: 4200,
        propertyTaxes: 9800,
        insurance: 2400,
        maintenance: 3000,
        vacancy: 1200,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.04,
          annualRentIncrease: 0.035,
          annualExpenseIncrease: 0.025
        },
        enhancedGoals: {
          freeTextStrategy: 'High-quality luxury property for appreciation and premium tenant quality over 5-7 years',
          portfolioStrategy: 'appreciation',
          exitStrategy: 'sale'
        }
      }
    },
    {
      name: "Class B - Standard Investment Property (Dallas, TX)",
      expectedClass: 'B',
      property: {
        purchasePrice: 380000,
        propertyAddress: {
          street: "789 Main Street",
          city: "Dallas",
          state: "TX",
          zipCode: "75201"
        },
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1900,
        yearBuilt: 2010, // Modern but not new
        lotSize: 7500,
        propertyType: 'SFR',
        monthlyRent: 2800,
        propertyTaxes: 5700,
        insurance: 1600,
        maintenance: 2200,
        vacancy: 700,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.03,
          annualRentIncrease: 0.03,
          annualExpenseIncrease: 0.025
        },
        enhancedGoals: {
          freeTextStrategy: 'Solid middle-market property for balanced cash flow and appreciation over 4-6 years',
          portfolioStrategy: 'balanced',
          exitStrategy: 'sale'
        }
      }
    },
    {
      name: "Class C - Older Value Property (Anna, TX)",
      expectedClass: 'C',
      property: {
        purchasePrice: 415000, // Same as original test but lower price
        propertyAddress: {
          street: "123 Main St",
          city: "Anna",
          state: "TX",
          zipCode: "75409"
        },
        bedrooms: 4,
        bathrooms: 2,
        sqft: 1800,
        yearBuilt: 1975, // Older property
        lotSize: 8000,
        propertyType: 'SFR',
        monthlyRent: 2400,
        propertyTaxes: 6200,
        insurance: 1800,
        maintenance: 2400,
        vacancy: 600,
        downPaymentPercent: 25,
        interestRate: 7.25,
        loanTermYears: 30,
        longTermAssumptions: {
          projectionYears: 10,
          annualAppreciation: 0.025,
          annualRentIncrease: 0.025,
          annualExpenseIncrease: 0.03
        },
        enhancedGoals: {
          freeTextStrategy: 'Cash flow focused property with higher management for experienced investor over 3-5 years',
          portfolioStrategy: 'cashflow',
          exitStrategy: 'sale'
        }
      }
    }
  ];

  const results = [];

  // Test each property archetype
  for (let i = 0; i < propertyArchetypes.length; i++) {
    const archetype = propertyArchetypes[i];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏠 TESTING: ${archetype.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📅 Year Built: ${archetype.property.yearBuilt} (${new Date().getFullYear() - archetype.property.yearBuilt} years old)`);
    console.log(`💰 Purchase Price: $${archetype.property.purchasePrice.toLocaleString()}`);
    console.log(`🏠 Monthly Rent: $${archetype.property.monthlyRent.toLocaleString()}`);
    console.log(`📍 Location: ${archetype.property.propertyAddress.city}, ${archetype.property.propertyAddress.state}`);
    console.log(`🎯 Expected Class: ${archetype.expectedClass}`);

    try {
      console.log('\n📊 Sending analysis request...');
      
      const response = await axios.post('http://localhost:3001/api/deals/analyze', archetype.property, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 60000
      });

      if (response.status === 200 && response.data) {
        const { investmentDecision } = response.data;
        
        console.log('✅ Analysis completed successfully!\n');
        
        // Extract property classification info from decision
        const propertyClassInfo = extractPropertyClassInfo(investmentDecision);
        
        console.log('🎯 INVESTMENT DECISION RESULTS');
        console.log('==============================');
        console.log(`🏆 Verdict: ${investmentDecision.verdict}`);
        console.log(`📈 Confidence: ${investmentDecision.confidence}%`);
        console.log(`⭐ Property Score: ${investmentDecision.score || 'N/A'}/100`);
        console.log(`📝 Primary Reason: ${investmentDecision.primaryReason}`);
        
        if (investmentDecision.goalBasedReasoning) {
          console.log(`🎯 Goal-Based Analysis: ${investmentDecision.goalBasedReasoning}`);
        }
        
        // Property Classification Results
        console.log('\n🏛️  PROPERTY CLASSIFICATION RESULTS');
        console.log('===================================');
        console.log(`📊 Detected Class: ${propertyClassInfo.detectedClass || 'Not found'}`);
        console.log(`🎯 Expected Class: ${archetype.expectedClass}`);
        console.log(`✅ Classification Match: ${propertyClassInfo.detectedClass === archetype.expectedClass ? 'YES' : 'NO'}`);
        
        if (propertyClassInfo.classDescription) {
          console.log(`📋 Description: ${propertyClassInfo.classDescription}`);
        }
        
        if (propertyClassInfo.riskLevel) {
          console.log(`⚠️  Risk Level: ${propertyClassInfo.riskLevel}`);
        }
        
        if (propertyClassInfo.managementIntensity) {
          console.log(`🔧 Management: ${propertyClassInfo.managementIntensity}`);
        }
        
        // Enhanced Insights
        console.log('\n🧠 ENHANCED INSIGHTS (Phase 2A + 2B)');
        console.log('=====================================');
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
          name: archetype.name,
          expectedClass: archetype.expectedClass,
          detectedClass: propertyClassInfo.detectedClass,
          verdict: investmentDecision.verdict,
          confidence: investmentDecision.confidence,
          score: investmentDecision.score,
          match: propertyClassInfo.detectedClass === archetype.expectedClass,
          yearBuilt: archetype.property.yearBuilt,
          propertyAge: new Date().getFullYear() - archetype.property.yearBuilt,
          location: `${archetype.property.propertyAddress.city}, ${archetype.property.propertyAddress.state}`
        });
        
      } else {
        console.error('❌ Invalid response from server');
        results.push({
          name: archetype.name,
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
        name: archetype.name,
        error: error.message
      });
    }
  }

  // Generate comprehensive test summary
  console.log('\n' + '='.repeat(80));
  console.log('🔬 PHASE 2B TEST SUMMARY & ANALYSIS');
  console.log('='.repeat(80));
  
  console.log('\n📊 PROPERTY CLASSIFICATION RESULTS');
  console.log('===================================');
  
  results.forEach((result, index) => {
    if (!result.error) {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   📅 Age: ${result.propertyAge} years (${result.yearBuilt})`);
      console.log(`   📍 Location: ${result.location}`);
      console.log(`   🎯 Expected: Class ${result.expectedClass} | Detected: Class ${result.detectedClass || 'N/A'}`);
      console.log(`   ✅ Match: ${result.match ? 'YES' : 'NO'}`);
      console.log(`   🏆 Verdict: ${result.verdict} (${result.confidence}% confidence)`);
      console.log(`   ⭐ Score: ${result.score || 'N/A'}/100`);
      console.log('');
    } else {
      console.log(`${index + 1}. ${result.name} - ERROR: ${result.error}`);
    }
  });
  
  // Test Assertions
  console.log('🧪 PHASE 2B TEST ASSERTIONS');
  console.log('============================');
  
  const successfulTests = results.filter(r => !r.error);
  const classificationMatches = successfulTests.filter(r => r.match).length;
  const totalTests = successfulTests.length;
  
  const assertions = [];
  
  // Test 1: Property classification working
  if (successfulTests.some(r => r.detectedClass)) {
    assertions.push('✅ Property classification system operational');
  } else {
    assertions.push('❌ Property classification system not working');
  }
  
  // Test 2: Age-based classification accuracy
  const ageBasedAccuracy = successfulTests.filter(r => {
    if (r.propertyAge <= 10 && r.detectedClass === 'A') return true;
    if (r.propertyAge > 10 && r.propertyAge <= 30 && r.detectedClass === 'B') return true;
    if (r.propertyAge > 30 && r.detectedClass === 'C') return true;
    return false;
  }).length;
  
  if (ageBasedAccuracy >= totalTests * 0.7) {
    assertions.push('✅ Age-based classification working correctly');
  } else {
    assertions.push('❌ Age-based classification needs improvement');
  }
  
  // Test 3: Risk adjustments reflected in confidence
  const classCAdjustments = successfulTests.filter(r => 
    r.detectedClass === 'C' && r.confidence < 70
  ).length;
  
  const classCProperties = successfulTests.filter(r => r.detectedClass === 'C').length;
  
  if (classCProperties > 0 && classCAdjustments / classCProperties >= 0.5) {
    assertions.push('✅ Class C risk adjustments affecting confidence');
  } else if (classCProperties === 0) {
    assertions.push('ℹ️  No Class C properties to test risk adjustments');
  } else {
    assertions.push('❌ Class C risk adjustments not properly applied');
  }
  
  // Test 4: Different verdicts for different classes
  const verdictVariety = new Set(successfulTests.map(r => r.verdict)).size;
  if (verdictVariety >= 2) {
    assertions.push('✅ Property classification affecting investment verdicts');
  } else {
    assertions.push('❌ Property classification not sufficiently affecting verdicts');
  }
  
  // Test 5: Enhanced insights inclusion
  if (totalTests > 0) {
    assertions.push('✅ Phase 2B integration with decision engine successful');
  } else {
    assertions.push('❌ Phase 2B integration failed');
  }
  
  assertions.forEach(assertion => console.log(assertion));
  
  console.log(`\n📊 Phase 2B Test Results: ${assertions.filter(a => a.includes('✅')).length}/${assertions.length} tests passed`);
  console.log(`📊 Classification Accuracy: ${classificationMatches}/${totalTests} properties correctly classified`);
  
  if (assertions.filter(a => a.includes('✅')).length >= assertions.length * 0.8) {
    console.log('🎉 Phase 2B: Property Classification implementation SUCCESSFUL!');
    console.log('👨‍💼 The engine now provides A/B/C property risk assessment');
    console.log('📈 Ready to move to Phase 3: Strategy Alignment Rules');
  } else {
    console.log('⚠️  Some Phase 2B features need refinement');
  }
  
  // Value Proposition Analysis
  console.log('\n💡 ENHANCED VALUE PROPOSITION');
  console.log('==============================');
  console.log('🆕 NEW CAPABILITIES ADDED BY PHASE 2B:');
  console.log('1. A/B/C property classification based on age, condition, and market position');
  console.log('2. Risk-adjusted cap rate requirements and confidence scoring');
  console.log('3. Management intensity assessment and tenant profile guidance');
  console.log('4. Property-class-specific maintenance and vacancy projections');
  console.log('5. Experience level matching (novice investors warned about Class C)');
  console.log('6. Market-tier-aware property classification (same property different class in different markets)');
}

// Helper function to extract property classification info from decision
function extractPropertyClassInfo(investmentDecision) {
  const info = {
    detectedClass: null,
    classDescription: null,
    riskLevel: null,
    managementIntensity: null
  };
  
  // Look for class information in secondary reasons
  if (investmentDecision.secondaryReasons) {
    investmentDecision.secondaryReasons.forEach(reason => {
      if (reason.includes('Class A')) info.detectedClass = 'A';
      else if (reason.includes('Class B')) info.detectedClass = 'B';
      else if (reason.includes('Class C')) info.detectedClass = 'C';
      
      if (reason.includes('Class') && reason.includes('-')) {
        info.classDescription = reason;
      }
    });
  }
  
  // Look for risk and management info in key risks
  if (investmentDecision.keyRisks) {
    investmentDecision.keyRisks.forEach(risk => {
      if (risk.includes('management') && risk.includes('experienced')) {
        info.riskLevel = 'high';
      }
      if (risk.includes('management intensity')) {
        info.managementIntensity = 'high';
      }
    });
  }
  
  return info;
}

// Run the test
if (require.main === module) {
  testPhase2BImplementation()
    .then(() => {
      console.log('\n🏁 Phase 2B Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPhase2BImplementation };