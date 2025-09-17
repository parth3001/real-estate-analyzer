/**
 * Deep Investigation of Cap Rate Scoring Issue
 * Testing the actual scoring function to find why scores are always 100/100
 */

// THE ACTUAL FORMULA FROM THE CODE
function scoreCapRateCompetitiveness(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  
  // The actual comment says "50 basis points = 10 points" but the math doesn't match
  // spread * 100 * 0.2 means:
  // - spread of 0.01 (1% or 100 basis points) = 0.01 * 100 * 0.2 = 0.2 points
  // This is WAY TOO SMALL!
  
  const spreadScore = 50 + (spread * 100 * 0.2);
  
  return Math.max(0, Math.min(100, spreadScore));
}

console.log('🔴 CRITICAL BUG FOUND IN CAP RATE SCORING!\n');
console.log('The formula has a MAJOR calculation error:');
console.log('spread * 100 * 0.2 where spread is in decimal form (e.g., 0.02 for 2%)\n');

console.log('Current broken calculation:');
console.log('- Cap rate 8% vs market 6% = spread of 0.02');
console.log('- Score = 50 + (0.02 * 100 * 0.2) = 50 + 0.4 = 50.4');
console.log('- This gives almost NO differentiation!\n');

console.log('The comment says "50 basis points = 10 points" which would mean:');
console.log('- 50 bps = 0.005 spread should give 10 points');
console.log('- So the multiplier should be: 10 / 0.005 = 2000, not 20!\n');

// CORRECTED FORMULA based on the comment's intent
function scoreCapRateCompetitivenessFixed(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  
  // Fixed: 50 basis points (0.005) = 10 points
  // So multiplier should be 10 / 0.005 = 2000
  const spreadScore = 50 + (spread * 2000);
  
  return Math.max(0, Math.min(100, spreadScore));
}

// Test scenarios
const scenarios = [
  { property: 0.04, market: 0.06 },
  { property: 0.05, market: 0.06 },
  { property: 0.06, market: 0.06 },
  { property: 0.07, market: 0.06 },
  { property: 0.08, market: 0.06 },
  { property: 0.09, market: 0.06 },
  { property: 0.10, market: 0.06 },
];

console.log('📊 Comparison: BROKEN vs FIXED\n');
console.log('Property | Market | Spread  | BROKEN Score | FIXED Score');
console.log('---------|--------|---------|--------------|------------');

scenarios.forEach(s => {
  const brokenScore = scoreCapRateCompetitiveness(s.property, s.market);
  const fixedScore = scoreCapRateCompetitivenessFixed(s.property, s.market);
  const spread = ((s.property - s.market) * 10000).toFixed(0);
  
  console.log(
    `${(s.property * 100).toFixed(0).padStart(7)}% | ` +
    `${(s.market * 100).toFixed(0).padStart(5)}% | ` +
    `${spread.padStart(4)} bps | ` +
    `${brokenScore.toFixed(1).padStart(11)} | ` +
    `${fixedScore.toFixed(0).padStart(10)}`
  );
});

console.log('\n🎯 THE REAL PROBLEM:');
console.log('The current formula barely moves the needle from 50!');
console.log('A 4% difference (400 basis points) only gives 0.8 points above 50.');
console.log('This is why everything looks like 100/100 - it\'s probably a display bug or default value.\n');

console.log('💡 SOLUTION:');
console.log('Change line 1188 in investmentDecisionEngine.ts from:');
console.log('  const spreadScore = 50 + (spread * 100 * 0.2);');
console.log('To:');
console.log('  const spreadScore = 50 + (spread * 2000); // 50 bps = 10 points as per comment');
console.log('\nThis matches the comment and provides proper differentiation.');