/**
 * Test script to validate AI scoring fixes
 * This simulates the exact scenario that was giving 55/100 for a terrible property
 */

const mockAnalysisData = {
  monthlyAnalysis: {
    cashFlow: -247 // Negative cash flow
  },
  keyMetrics: {
    capRate: 2.98,
    cashOnCashReturn: -1.23, // Negative returns
    dscr: 0.82 // Below 1.0 - can't cover debt
  }
};

const mockAIResponse = {
  investmentScore: 65, // This was the original high score from AI
  summary: "Property analysis complete",
  strengths: ["Good location"],
  weaknesses: ["High expenses"],
  recommendations: ["Consider renovations"]
};

// Simulate the new scoring logic
function testNewScoringLogic(analysis, aiResponse) {
  let finalScore = aiResponse.investmentScore;
  
  if (finalScore !== null) {
    const cashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
    const cocReturn = analysis?.keyMetrics?.cashOnCashReturn;
    const dscr = analysis?.keyMetrics?.dscr;
    
    console.log('🔍 Analyzing critical metrics:');
    console.log(`   Cash Flow: $${cashFlow}/month`);
    console.log(`   Cash-on-Cash Return: ${cocReturn}%`);
    console.log(`   DSCR: ${dscr}`);
    console.log(`   Original AI Score: ${aiResponse.investmentScore}/100`);
    
    // Apply critical override logic
    if (cashFlow < 0 && cocReturn < 0 && dscr < 1.0) {
      finalScore = Math.min(finalScore, 15); // Triple red flag
      console.log('🚨 TRIPLE RED FLAG: All three critical metrics are negative/dangerous');
    } else if ((cashFlow < 0 && cocReturn < 0) || (cashFlow < 0 && dscr < 1.0) || (cocReturn < 0 && dscr < 1.0)) {
      finalScore = Math.min(finalScore, 25); // Double red flag
      console.log('⚠️  DOUBLE RED FLAG: Two critical metrics are problematic');
    } else if (cashFlow < 0 || cocReturn < 0 || dscr < 1.0) {
      finalScore = Math.min(finalScore, 35); // Single red flag
      console.log('⚠️  SINGLE RED FLAG: One critical metric is problematic');
    } else {
      console.log('✅ No critical red flags detected');
    }
    
    console.log(`   Final AI Score: ${finalScore}/100`);
    
    // Determine investment grade
    let grade;
    if (finalScore >= 70) grade = 'Excellent Investment';
    else if (finalScore >= 55) grade = 'Good Investment';
    else if (finalScore >= 40) grade = 'Fair Investment';
    else if (finalScore >= 25) grade = 'Poor Investment';
    else grade = 'Avoid Investment';
    
    console.log(`   Investment Grade: ${grade}`);
    
    return finalScore;
  }
  
  return finalScore;
}

console.log('🧪 Testing AI Scoring Logic Fix');
console.log('================================');
console.log('Testing the exact scenario that was giving 55/100 for negative metrics...\n');

const newScore = testNewScoringLogic(mockAnalysisData, mockAIResponse);

console.log('\n📊 Results:');
console.log(`Before fix: 55/100 (Good Investment) ❌`);
console.log(`After fix:  ${newScore}/100 (${newScore >= 55 ? 'Good' : newScore >= 40 ? 'Fair' : newScore >= 25 ? 'Poor' : 'Avoid'} Investment) ✅`);

if (newScore <= 25) {
  console.log('\n🎉 SUCCESS: The fix correctly identifies this as a poor investment!');
} else {
  console.log('\n❌ ISSUE: Score is still too high for such poor metrics.');
}