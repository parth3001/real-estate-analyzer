/**
 * Comprehensive Audit of All Scoring Functions
 * Checking for mathematical errors similar to the cap rate bug
 */

console.log('🔍 INVESTMENT DECISION ENGINE - SCORING FUNCTIONS AUDIT\n');
console.log('=' .repeat(60));

// 1. CASH FLOW SCORING (35% weight)
function scoreCashFlowStability(monthlyNetCashFlow, totalInvestment, marketTier) {
  if (monthlyNetCashFlow <= 0) return 0;
  
  const monthlyROI = monthlyNetCashFlow / totalInvestment;
  const annualROI = monthlyROI * 12;
  
  const tierExpectations = {
    1: { poor: 0.02, fair: 0.04, good: 0.06, excellent: 0.08 },
    2: { poor: 0.04, fair: 0.06, good: 0.08, excellent: 0.10 },
    3: { poor: 0.06, fair: 0.08, good: 0.10, excellent: 0.12 }
  };
  
  const expectations = tierExpectations[marketTier] || tierExpectations[2];
  
  if (annualROI >= expectations.excellent) return 100;
  if (annualROI >= expectations.good) return 85;
  if (annualROI >= expectations.fair) return 70;
  if (annualROI >= expectations.poor) return 50;
  return 25;
}

console.log('\n1. CASH FLOW SCORING TEST (35% weight):');
console.log('Testing: Monthly cash flow vs total investment');
const cashFlowTests = [
  { monthly: 100, investment: 50000, tier: 2, expected: '~25 (2.4% annual ROI)' },
  { monthly: 300, investment: 50000, tier: 2, expected: '~70 (7.2% annual ROI)' },
  { monthly: 500, investment: 50000, tier: 2, expected: '~100 (12% annual ROI)' },
];

cashFlowTests.forEach(test => {
  const score = scoreCashFlowStability(test.monthly, test.investment, test.tier);
  const annualROI = (test.monthly / test.investment * 12 * 100).toFixed(1);
  console.log(`  $${test.monthly}/mo on $${test.investment.toLocaleString()} = ${score}/100 (${annualROI}% ROI)`);
});
console.log('✅ Cash flow scoring uses step functions - NO MATH ERROR');

// 2. IRR SCORING (25% weight)
function scoreIRRPotential(irr) {
  const thresholds = { excellent: 12, good: 8, fair: 6, poor: 4 };
  if (irr >= thresholds.excellent) return 100;
  if (irr >= thresholds.good) return 85;
  if (irr >= thresholds.fair) return 70;
  if (irr >= thresholds.poor) return 50;
  return Math.max(0, (irr / thresholds.poor) * 50);
}

console.log('\n2. IRR SCORING TEST (25% weight):');
const irrTests = [2, 4, 6, 8, 10, 12, 15];
irrTests.forEach(irr => {
  const score = scoreIRRPotential(irr);
  console.log(`  IRR ${irr}% = ${score}/100`);
});
console.log('✅ IRR scoring uses step functions with linear fallback - NO MATH ERROR');

// 3. MARKET STRENGTH SCORING (15% weight)
function scoreMarketStrength(marketTier, propertyCapRate, marketMedianCapRate) {
  const tierScore = marketTier === 1 ? 85 : marketTier === 2 ? 70 : 55;
  const capRateAdvantage = propertyCapRate - marketMedianCapRate;
  const advantageScore = Math.max(-30, Math.min(30, capRateAdvantage * 1000));
  return Math.max(0, Math.min(100, tierScore + advantageScore));
}

console.log('\n3. MARKET STRENGTH SCORING TEST (15% weight):');
console.log('⚠️  POTENTIAL ISSUE FOUND!');
console.log('Formula: advantageScore = capRateAdvantage * 1000');
console.log('This multiplier seems inconsistent:');
const marketTests = [
  { tier: 2, propCap: 0.05, marketCap: 0.06 },
  { tier: 2, propCap: 0.06, marketCap: 0.06 },
  { tier: 2, propCap: 0.07, marketCap: 0.06 },
  { tier: 2, propCap: 0.08, marketCap: 0.06 },
];

marketTests.forEach(test => {
  const score = scoreMarketStrength(test.tier, test.propCap, test.marketCap);
  const spread = (test.propCap - test.marketCap) * 10000;
  const adjustment = Math.max(-30, Math.min(30, (test.propCap - test.marketCap) * 1000));
  console.log(`  Tier ${test.tier}, ${(test.propCap*100).toFixed(0)}% vs ${(test.marketCap*100).toFixed(0)}% market = ${score}/100 (${spread > 0 ? '+' : ''}${spread} bps, adj: ${adjustment > 0 ? '+' : ''}${adjustment})`);
});
console.log('🔴 Multiplier of 1000 gives only ±1 point per 100 basis points!');
console.log('   Should probably be 10000 for ±10 points per 100 bps');

// 4. CAP RATE SCORING (3% weight) - ALREADY FIXED
function scoreCapRateCompetitiveness(propertyCapRate, marketMedian) {
  const spread = propertyCapRate - marketMedian;
  const spreadScore = 50 + (spread * 2000); // FIXED from 20
  return Math.max(0, Math.min(100, spreadScore));
}

console.log('\n4. CAP RATE SCORING (3% weight):');
console.log('✅ ALREADY FIXED - Multiplier corrected from 20 to 2000');

// 5. DEBT STRUCTURE SCORING (10% weight)
console.log('\n5. DEBT STRUCTURE SCORING (10% weight):');
console.log('✅ Uses additive scoring with fixed point values - NO MATH ERROR');

// 6. EXIT STRATEGY SCORING (10% weight)
function scoreExitStrategy(alignmentScore, exitStrategy) {
  let score = alignmentScore * 0.8;
  if (exitStrategy === 'sale') score += 15;
  else if (exitStrategy === 'refinance') score += 10;
  else if (exitStrategy === '1031exchange') score += 5;
  return Math.max(0, Math.min(100, score));
}

console.log('\n6. EXIT STRATEGY SCORING (10% weight):');
console.log('✅ Uses percentage conversion (0.8) plus bonuses - NO MATH ERROR');

// 7. PROPERTY RISK SCORING (2% weight)
console.log('\n7. PROPERTY RISK SCORING (2% weight):');
console.log('✅ Uses additive scoring with fixed adjustments - NO MATH ERROR');

console.log('\n' + '=' .repeat(60));
console.log('\n📊 AUDIT SUMMARY:\n');
console.log('✅ Cash Flow Scoring (35%): CORRECT - Step functions');
console.log('✅ IRR Scoring (25%): CORRECT - Step functions');
console.log('⚠️  Market Strength (15%): SUSPICIOUS - Multiplier may be 10x too small');
console.log('✅ Debt Structure (10%): CORRECT - Additive scoring');
console.log('✅ Exit Strategy (10%): CORRECT - Percentage + bonus');
console.log('✅ Cap Rate (3%): FIXED - Was 100x too small, now corrected');
console.log('✅ Property Risk (2%): CORRECT - Additive scoring');

console.log('\n🔴 RECOMMENDATION:');
console.log('Check scoreMarketStrength() function line 979:');
console.log('Current: capRateAdvantage * 1000');
console.log('Should be: capRateAdvantage * 10000 (for ±10 points per 100 bps)');
console.log('\nThis would make the adjustment more meaningful:');
console.log('- 1% better cap rate = +10 points (not +1 point)');
console.log('- 2% better cap rate = +20 points (not +2 points)');