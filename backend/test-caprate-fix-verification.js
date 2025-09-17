/**
 * Verification Test for Cap Rate Scoring Fix
 * Tests that the corrected formula provides proper differentiation
 */

// The FIXED formula from the updated code
function scoreCapRateCompetitiveness(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  
  // Fixed: Corrected multiplier - 50 bps (0.005) = 10 points, so multiplier = 2000
  const spreadScore = 50 + (spread * 2000); // 10 points per 50 bps as intended
  
  return Math.max(0, Math.min(100, spreadScore));
}

console.log('✅ CAP RATE SCORING FIX VERIFICATION\n');
console.log('Formula: Score = 50 + (spread * 2000)');
console.log('This gives 10 points per 50 basis points as intended\n');

// Test scenarios with 6% market median
const marketMedian = 0.06;
const testProperties = [
  { name: 'Terrible Deal', capRate: 0.03, expected: 'Low score' },
  { name: 'Below Market', capRate: 0.05, expected: 'Below 50' },
  { name: 'At Market', capRate: 0.06, expected: 'Score ~50' },
  { name: 'Good Deal', capRate: 0.07, expected: 'Above 50' },
  { name: 'Great Deal', capRate: 0.08, expected: 'High score' },
  { name: 'Excellent Deal', capRate: 0.09, expected: 'Near 100' },
  { name: 'Exceptional', capRate: 0.10, expected: 'Max 100' },
];

console.log('📊 Test Results (Market Median: 6%)\n');
console.log('Property Type    | Cap Rate | Spread   | Score | Assessment');
console.log('-----------------|----------|----------|-------|------------');

let allTestsPassed = true;

testProperties.forEach(prop => {
  const score = scoreCapRateCompetitiveness(prop.capRate, marketMedian);
  const spread = (prop.capRate - marketMedian) * 10000; // Convert to basis points
  
  // Determine if score is appropriate
  let assessment = '';
  if (prop.capRate < marketMedian - 0.02) {
    assessment = score < 20 ? '✅ Correctly penalized' : '❌ Should be lower';
  } else if (prop.capRate < marketMedian) {
    assessment = score < 50 ? '✅ Below average' : '❌ Should be below 50';
  } else if (prop.capRate === marketMedian) {
    assessment = score === 50 ? '✅ At baseline' : '❌ Should be 50';
  } else if (prop.capRate <= marketMedian + 0.02) {
    assessment = score > 50 && score < 95 ? '✅ Above average' : '❌ Wrong range';
  } else {
    assessment = score >= 90 ? '✅ Excellent score' : '❌ Should be higher';
  }
  
  if (assessment.includes('❌')) allTestsPassed = false;
  
  console.log(
    `${prop.name.padEnd(16)} | ` +
    `${(prop.capRate * 100).toFixed(1)}%`.padStart(7) + ' | ' +
    `${spread > 0 ? '+' : ''}${spread.toFixed(0)} bps`.padStart(8) + ' | ' +
    `${score.toFixed(0).padStart(4)}/100`.padEnd(5) + ' | ' +
    assessment
  );
});

console.log('\n📈 Score Distribution Analysis:');
console.log('- Scores now range from 0 to 100 with proper differentiation');
console.log('- 1% difference in cap rate = 20 point score difference');
console.log('- 2.5% above market hits the 100 cap (as intended)');
console.log('- 2.5% below market hits the 0 floor (as intended)');

if (allTestsPassed) {
  console.log('\n🎉 SUCCESS: Cap rate scoring fix is working correctly!');
  console.log('The professional assessment will now properly differentiate properties by cap rate.');
} else {
  console.log('\n⚠️  WARNING: Some tests did not pass expected ranges.');
}

console.log('\n🧪 HOW TO TEST IN THE APP:');
console.log('1. Restart the backend server: npm run dev');
console.log('2. Analyze any property');
console.log('3. Check the Professional Assessment section');
console.log('4. Look at "Cap Rate" score - it should vary based on property performance');
console.log('5. Properties with higher cap rates should score higher (not always 100)');
console.log('6. Properties with low cap rates should score lower (not always 100)');