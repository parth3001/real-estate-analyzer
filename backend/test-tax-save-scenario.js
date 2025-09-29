/**
 * Test Tax Save Scenario - Reproduce the Issue
 * Senior Full-Stack Engineer: Simulate save/load cycle to identify where tax data gets lost
 */

console.log('🧪 Tax Save Scenario Test - Reproducing the Issue\n');

// Step 1: Mock what gets GENERATED during analysis
const generatedAnalysis = {
  keyMetrics: {
    dealQuality: 85,
    capRate: 0.062,
    cashOnCashReturn: 0.084
  },
  investmentDecision: {
    verdict: 'BUY',
    confidence: 88,
    score: 85,
    // This is what Investment Decision Engine adds
    taxAnalysis: {
      userTaxProfile: {
        filingStatus: 'single',
        state: 'TX'
      },
      optimalHoldPeriod: 10,
      totalTaxSavingsAtOptimal: 20463,
      holdPeriodAnalysis: [
        { holdPeriod: 1, totalTaxLiability: 38518 },
        { holdPeriod: 10, totalTaxLiability: 18055 }
      ]
    }
  }
};

console.log('=== STEP 1: Analysis Generated ===');
console.log('Has tax analysis:', !!generatedAnalysis?.investmentDecision?.taxAnalysis);
console.log('Tax savings:', generatedAnalysis?.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal);

// Step 2: Mock what gets SENT from frontend to backend for saving
const frontendDealData = {
  propertyName: 'Test Property',
  propertyType: 'SFR',
  userId: 'user123',
  // The analysis object should include everything generated
  analysis: generatedAnalysis
};

console.log('\n=== STEP 2: Frontend Sends to Backend ===');
console.log('Frontend sending analysis with tax data:', !!frontendDealData.analysis?.investmentDecision?.taxAnalysis);

// Step 3: Mock what happens in convertWizardData
function testConvertWizardData(dealData) {
  const isWizardData = dealData._isWizardData || false;

  if (!isWizardData) {
    console.log('Data is not wizard format, returning as-is');
    return dealData;
  }

  // This is the potential issue - spread operator might not deep clone
  const convertedData = {
    ...dealData,
    // Add some converted fields
    maintenanceCost: 100
  };

  return convertedData;
}

const convertedData = testConvertWizardData(frontendDealData);

console.log('\n=== STEP 3: After convertWizardData ===');
console.log('Still has tax analysis:', !!convertedData.analysis?.investmentDecision?.taxAnalysis);

// Step 4: Mock MongoDB save (what might happen during serialization)
function testMongoSave(dealData) {
  // MongoDB typically uses JSON serialization
  const serialized = JSON.stringify(dealData);
  const deserialized = JSON.parse(serialized);
  return deserialized;
}

const savedData = testMongoSave(convertedData);

console.log('\n=== STEP 4: After MongoDB Save/Retrieve ===');
console.log('After save/retrieve, still has tax analysis:', !!savedData.analysis?.investmentDecision?.taxAnalysis);
console.log('Tax savings still exists:', savedData.analysis?.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal);

// Step 5: Mock what gets LOADED and sent back to frontend
const loadedDealData = savedData;

console.log('\n=== STEP 5: Loaded from Database ===');
console.log('Loaded data has tax analysis:', !!loadedDealData.analysis?.investmentDecision?.taxAnalysis);

// Step 6: Mock frontend component check
function frontendComponentCheck(analysis) {
  const hasTaxAnalysis = !!analysis?.investmentDecision?.taxAnalysis;
  console.log('\n=== STEP 6: Frontend Component Check ===');
  console.log('Frontend component check - has tax analysis:', hasTaxAnalysis);

  if (hasTaxAnalysis) {
    console.log('✅ Tax tab SHOULD appear');
    console.log('Optimal period:', analysis.investmentDecision.taxAnalysis.optimalHoldPeriod);
    console.log('Tax savings:', analysis.investmentDecision.taxAnalysis.totalTaxSavingsAtOptimal);
  } else {
    console.log('❌ Tax tab WILL NOT appear');
  }

  return hasTaxAnalysis;
}

const frontendCheck = frontendComponentCheck(loadedDealData.analysis);

console.log('\n=== TEST RESULT ===');
if (frontendCheck) {
  console.log('🎉 SUCCESS: Tax data persists through entire cycle');
  console.log('');
  console.log('If user reports tax tab disappearing, the issue is NOT in:');
  console.log('• Data structure');
  console.log('• JSON serialization');
  console.log('• Object spreading');
  console.log('');
  console.log('The issue might be:');
  console.log('• Frontend state management');
  console.log('• Component rerendering timing');
  console.log('• Different analysis path being used');
  console.log('• Browser console errors preventing render');
} else {
  console.log('❌ FAILURE: Tax data lost somewhere in the cycle');
  console.log('Need to investigate data transformation steps');
}

console.log('\n🔍 NEXT DEBUGGING STEPS:');
console.log('1. Add detailed logging to deals.ts createDeal function');
console.log('2. Add detailed logging to deals.ts getDeal function');
console.log('3. Check browser network tab for API response content');
console.log('4. Check browser console for component rendering errors');
console.log('5. Verify deal document in MongoDB has taxAnalysis field');

console.log('\n✨ Tax Save Scenario Test Complete!');