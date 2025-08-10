/**
 * Quick test for the new AI Goal Analysis endpoint
 */

const testGoalAnalysis = async () => {
  console.log('🎯 Testing Goal Analysis Endpoint');
  
  // Test 1: Pattern Matching (BRRRR Strategy)
  console.log('\n📋 Test 1: Pattern Matching - BRRRR Strategy');
  const testData1 = {
    structuredGoals: {
      exitStrategy: 'refinance',
      portfolioStrategy: 'cashflow',
      experienceLevel: 'intermediate',
      riskTolerance: 'moderate'
    },
    freeTextStrategy: 'I want to use the BRRRR strategy to buy fix and hold rental properties then refinance to pull out capital and repeat the process to build a portfolio of 5 properties in 3 years'
  };
  
  console.log('Input:', JSON.stringify(testData1, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/deals/analyze-goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to adjust this
      },
      body: JSON.stringify(testData1)
    });
    
    const result = await response.json();
    console.log('✅ Pattern Matching Result:');
    console.log('- Processing Method:', result.data?.enhancedGoals?.processingMethod);
    console.log('- Confidence Score:', result.data?.enhancedGoals?.confidenceScore);
    console.log('- Strategic Insights:', result.data?.enhancedGoals?.strategicInsights?.length || 0);
    console.log('- Processing Time:', result.performance?.processingTime);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: AI Analysis (Complex Strategy)
  console.log('\n📋 Test 2: AI Analysis - Complex Strategy');
  const testData2 = {
    structuredGoals: {
      exitStrategy: 'estate',
      portfolioStrategy: 'diversification',
      experienceLevel: 'expert',
      riskTolerance: 'aggressive'
    },
    freeTextStrategy: 'I am building a generational wealth strategy focused on geographic arbitrage between California and Midwest markets while house hacking my first property and transitioning to commercial multifamily within 5 years. I plan to leverage 1031 exchanges to defer taxes and create multiple income streams for my children.'
  };
  
  console.log('Input:', JSON.stringify(testData2, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/deals/analyze-goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData2)
    });
    
    const result = await response.json();
    console.log('✅ AI Analysis Result:');
    console.log('- Processing Method:', result.data?.enhancedGoals?.processingMethod);
    console.log('- Confidence Score:', result.data?.enhancedGoals?.confidenceScore);
    console.log('- Strategic Insights:', result.data?.enhancedGoals?.strategicInsights?.length || 0);
    console.log('- Has AI Enhancement:', result.data?.analysis?.hasAiEnhancement);
    console.log('- Processing Time:', result.performance?.processingTime);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n✅ Goal Analysis Endpoint Testing Complete!');
};

// Run tests
testGoalAnalysis();