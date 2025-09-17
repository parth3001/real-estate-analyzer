/**
 * Test Cap Rate Scoring Issue
 * Investigating why cap rate always shows 100/100 in professional analysis
 */

// Simulate the scoreCapRateCompetitiveness function from Investment Decision Engine
function scoreCapRateCompetitiveness(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  
  // Convert spread to score (50 basis points = 10 points)
  const spreadScore = 50 + (spread * 100 * 0.2); // 20 points per 100 bps
  
  return Math.max(0, Math.min(100, spreadScore));
}

console.log('🔍 Cap Rate Scoring Investigation\n');
console.log('Current scoring formula:');
console.log('- Base score: 50');
console.log('- Spread bonus/penalty: (capRate - marketMedian) * 100 * 0.2');
console.log('- This means: 20 points per 1% (100 basis points) difference');
console.log('- Score is capped between 0 and 100\n');

// Test various cap rate scenarios
const testScenarios = [
  { property: 0.03, market: 0.06, name: 'Poor cap rate (3% vs 6% market)' },
  { property: 0.05, market: 0.06, name: 'Below market (5% vs 6% market)' },
  { property: 0.06, market: 0.06, name: 'At market (6% vs 6% market)' },
  { property: 0.07, market: 0.06, name: 'Above market (7% vs 6% market)' },
  { property: 0.08, market: 0.06, name: 'Good cap rate (8% vs 6% market)' },
  { property: 0.10, market: 0.06, name: 'Excellent cap rate (10% vs 6% market)' },
  { property: 0.12, market: 0.06, name: 'Exceptional cap rate (12% vs 6% market)' },
  { property: 0.15, market: 0.06, name: 'Suspicious cap rate (15% vs 6% market)' }
];

console.log('📊 Cap Rate Scoring Test Results:\n');

testScenarios.forEach(scenario => {
  const score = scoreCapRateCompetitiveness(scenario.property, scenario.market);
  const spread = (scenario.property - scenario.market) * 10000; // Convert to basis points
  
  console.log(`${scenario.name}`);
  console.log(`  Property: ${(scenario.property * 100).toFixed(1)}%, Market: ${(scenario.market * 100).toFixed(1)}%`);
  console.log(`  Spread: ${spread > 0 ? '+' : ''}${spread.toFixed(0)} basis points`);
  console.log(`  Score: ${score}/100`);
  console.log(`  ${score === 100 ? '⚠️  CAPPED AT 100' : score === 0 ? '⚠️  CAPPED AT 0' : '✅ Within range'}`);
  console.log('');
});

console.log('🔴 PROBLEM IDENTIFIED:\n');
console.log('Any cap rate that is 2.5% or more above market median will hit the 100/100 cap.');
console.log('Calculation: 50 + (2.5 * 100 * 0.2) = 50 + 50 = 100');
console.log('\nThis means properties with cap rates of 8.5% or higher (when market is 6%) all get 100/100!');
console.log('This is TOO GENEROUS and doesn\'t differentiate between good and exceptional properties.');

console.log('\n💡 RECOMMENDED FIX:');
console.log('Reduce the multiplier from 0.2 to 0.1 (10 points per 100 bps instead of 20)');
console.log('This would require a 5% spread to hit 100/100, which is more reasonable.');

// Test with proposed fix
function scoreCapRateCompetitivenessFixed(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  
  // FIXED: Reduced multiplier to 0.1 (10 points per 100 bps)
  const spreadScore = 50 + (spread * 100 * 0.1);
  
  return Math.max(0, Math.min(100, spreadScore));
}

console.log('\n📊 With Proposed Fix (0.1 multiplier):\n');

testScenarios.forEach(scenario => {
  const score = scoreCapRateCompetitivenessFixed(scenario.property, scenario.market);
  const spread = (scenario.property - scenario.market) * 100;
  
  console.log(`${scenario.name}`);
  console.log(`  Score: ${score}/100 (was ${scoreCapRateCompetitiveness(scenario.property, scenario.market)}/100)`);
});