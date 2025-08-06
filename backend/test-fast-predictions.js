/**
 * Test script to demonstrate the new fast AI predictions
 * Usage: node test-fast-predictions.js
 */

const fs = require('fs');
const path = require('path');

// Sample property data for testing
const sampleProperty = {
  propertyType: 'SFR',
  propertyAddress: {
    street: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201'
  },
  purchasePrice: 250000,
  downPayment: 50000,
  monthlyRent: 2100,
  interestRate: 7.0,
  loanTerm: 30,
  closingCosts: 7500,
  propertyTaxRate: 1.8,
  insuranceRate: 0.7,
  maintenanceCost: 2500,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3.5,
    sellingCostsPercentage: 6,
    vacancyRate: 5
  },
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1800,
  yearBuilt: 2015
};

async function testFastPredictions() {
  console.log('🚀 Testing Fast AI Predictions vs Traditional Mega-Prompt');
  console.log('='.repeat(60));
  
  try {
    const startTime = Date.now();
    
    // Test the new fast predictions endpoint
    const response = await fetch('http://localhost:5001/api/deals/quick-predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You would need actual auth token in real test
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(sampleProperty)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Fast Predictions SUCCESS!');
      console.log(`⚡ Response Time: ${responseTime}ms`);
      console.log(`🎯 Performance: ${data.performance.improvement}`);
      console.log('');
      
      console.log('📊 PREDICTIONS GENERATED:');
      console.log('- Market Timing:', data.data.predictions.marketTiming ? '✅' : '❌');
      console.log('- Rent Growth:', data.data.predictions.rentGrowth ? '✅' : '❌');
      console.log('- Risk Assessment:', data.data.predictions.riskAssessment ? '✅' : '❌');
      console.log('- Exit Strategy:', data.data.predictions.exitStrategy ? '✅' : '❌');
      console.log('');
      
      console.log('🧠 BASIC INSIGHTS:');
      console.log(`- Investment Score: ${data.data.basicInsights.investmentScore}/100`);
      console.log(`- Summary: ${data.data.basicInsights.summary}`);
      console.log(`- Strengths: ${data.data.basicInsights.strengths.length}`);
      console.log(`- Weaknesses: ${data.data.basicInsights.weaknesses.length}`);
      console.log('');
      
      // Compare with traditional approach
      const traditionalTime = 76000; // 76+ seconds
      const improvement = Math.round((traditionalTime - responseTime) / traditionalTime * 100);
      
      console.log('📈 PERFORMANCE COMPARISON:');
      console.log(`- Traditional Mega-Prompt: ~${traditionalTime/1000}s`);
      console.log(`- New Fast Predictions: ${responseTime/1000}s`);
      console.log(`- Improvement: ${improvement}% faster`);
      console.log(`- Time Saved: ${(traditionalTime - responseTime)/1000}s per analysis`);
      
    } else {
      console.log('❌ Request failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('1. Backend server is running (npm start)');
    console.log('2. OpenAI API key is configured');
    console.log('3. All dependencies are installed');
  }
}

console.log('Phase 1: AI Performance Revolution - Fast Predictions Test');
console.log('Target: Reduce 76+ second responses to 3-4 seconds');
console.log('');

// Uncomment to run test (requires running backend server)
// testFastPredictions();

console.log('⚠️  To run this test:');
console.log('1. Start the backend server: npm start');
console.log('2. Uncomment the testFastPredictions() call');
console.log('3. Run: node test-fast-predictions.js');
console.log('');
console.log('🎯 Expected Results:');
console.log('- Response time: 3-4 seconds (vs 76+ seconds)');
console.log('- 4 parallel predictions generated');
console.log('- Basic insights with investment score');
console.log('- 95%+ performance improvement');