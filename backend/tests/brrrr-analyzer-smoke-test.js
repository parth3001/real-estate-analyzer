#!/usr/bin/env node

/**
 * BRRRR Analyzer Smoke Test - Phase 1.1 Validation
 *
 * Direct unit testing of BRRRRAnalyzer class (no API calls)
 *
 * Tests:
 * 1. Infinite return scenario (100%+ capital recovery)
 * 2. Partial recovery scenario (60% recovery)
 * 3. 70% Rule validation
 * 4. Sensitivity analysis
 *
 * Expected runtime: <1 second
 */

const { BRRRRAnalyzer } = require('../src/services/investment/brrrAnalyzer');

console.log('🧪 BRRRR Analyzer Smoke Test - Phase 1.1\n');

const analyzer = new BRRRRAnalyzer();
let passCount = 0;
let failCount = 0;

async function runTests() {

// =============================================================================
// Test 1: Infinite Return Scenario
// =============================================================================

console.log('Test 1: Infinite Return Scenario');
const infiniteReturnInputs = {
  purchasePrice: 100000,
  closingCosts: 3000,
  downPayment: 20000,
  interestRate: 7.0,
  loanTerm: 30,
  brrrr: {
    rehabBudget: 30000,
    afterRepairValue: 350000, // Massive ARV gain
    refinanceLTV: 75,
    seasoningPeriod: 12
  },
  monthlyRent: 1200,
  propertyTaxRate: 1.5,
  insuranceRate: 0.5,
  maintenanceCost: 1500,
  propertyManagementRate: 8,
  vacancyRate: 5
};

try {
  const result1 = await analyzer.analyze(infiniteReturnInputs);

  console.log('  Total Investment:', `$${result1.totalInvestment.toLocaleString()}`);
  console.log('  Capital Recovered:', `$${result1.capitalRecovery.capitalRecovered.toLocaleString()}`);
  console.log('  Capital Recovery Rate:', `${result1.capitalRecovery.capitalRecoveryRate.toFixed(1)}%`);
  console.log('  Infinite Return:', result1.capitalRecovery.infiniteReturn);
  console.log('  Capital Recovery Score:', `${result1.scores.capitalRecovery}/100`);
  console.log('  Post-Refi Cash Flow:', `$${result1.postRefinanceMetrics.monthlyCashFlow.toFixed(2)}/month`);

  // Assertions
  if (result1.capitalRecovery.infiniteReturn !== true) {
    console.log('  ❌ FAIL: Expected infinite return');
    failCount++;
  } else if (result1.scores.capitalRecovery !== 100) {
    console.log('  ❌ FAIL: Expected 100/100 score for infinite return');
    failCount++;
  } else {
    console.log('  ✅ PASS: Infinite return detected correctly\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message, '\n');
  failCount++;
}

// =============================================================================
// Test 2: Partial Recovery Scenario (60% recovery)
// =============================================================================

console.log('Test 2: Partial Recovery Scenario');
const partialRecoveryInputs = {
  purchasePrice: 200000,
  closingCosts: 6000,
  downPayment: 40000,
  interestRate: 7.0,
  loanTerm: 30,
  brrrr: {
    rehabBudget: 40000,
    afterRepairValue: 280000, // Moderate ARV gain
    refinanceLTV: 75,
    seasoningPeriod: 12
  },
  monthlyRent: 1800,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceCost: 2000,
  propertyManagementRate: 10,
  vacancyRate: 5
};

try {
  const result2 = await analyzer.analyze(partialRecoveryInputs);

  console.log('  Total Investment:', `$${result2.totalInvestment.toLocaleString()}`);
  console.log('  Capital Recovered:', `$${result2.capitalRecovery.capitalRecovered.toLocaleString()}`);
  console.log('  Capital Recovery Rate:', `${result2.capitalRecovery.capitalRecoveryRate.toFixed(1)}%`);
  console.log('  Infinite Return:', result2.capitalRecovery.infiniteReturn);
  console.log('  Capital Recovery Score:', `${result2.scores.capitalRecovery}/100`);
  console.log('  Capital Remaining:', `$${result2.capitalRecovery.capitalRemaining.toLocaleString()}`);

  // Assertions
  const recoveryRate = result2.capitalRecovery.capitalRecoveryRate;
  if (recoveryRate < 0 || recoveryRate >= 100) {
    console.log('  ❌ FAIL: Expected 0-99% recovery, got', `${recoveryRate.toFixed(1)}%`);
    failCount++;
  } else if (result2.capitalRecovery.infiniteReturn !== false) {
    console.log('  ❌ FAIL: Should not be infinite return');
    failCount++;
  } else {
    console.log('  ✅ PASS: Partial recovery calculated correctly\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message, '\n');
  failCount++;
}

// =============================================================================
// Test 3: 70% Rule Validation
// =============================================================================

console.log('Test 3: 70% Rule Validation');
const rule70TestInputs = {
  purchasePrice: 110000, // Should meet 70% rule
  closingCosts: 3000,
  downPayment: 22000,
  interestRate: 7.0,
  loanTerm: 30,
  brrrr: {
    rehabBudget: 30000,
    afterRepairValue: 200000,
    refinanceLTV: 75,
    seasoningPeriod: 12
  },
  monthlyRent: 1500,
  propertyTaxRate: 1.5,
  insuranceRate: 0.5,
  maintenanceCost: 1500,
  propertyManagementRate: 8,
  vacancyRate: 5
};

try {
  const result3 = await analyzer.analyze(rule70TestInputs);

  console.log('  ARV:', `$${result3.rule70Check.afterRepairValue.toLocaleString()}`);
  console.log('  Rehab Budget:', `$${result3.rule70Check.rehabBudget.toLocaleString()}`);
  console.log('  Max Allowable Purchase:', `$${result3.rule70Check.maxAllowablePurchase.toLocaleString()}`);
  console.log('  Actual Purchase:', `$${result3.rule70Check.actualPurchase.toLocaleString()}`);
  console.log('  Meets 70% Rule:', result3.rule70Check.meets70Rule);
  console.log('  Margin:', `$${result3.rule70Check.margin.toLocaleString()}`);

  // Max allowable = (200k * 0.70) - 30k = 110k
  const expectedMax = (200000 * 0.70) - 30000;
  if (Math.abs(result3.rule70Check.maxAllowablePurchase - expectedMax) > 1) {
    console.log('  ❌ FAIL: Max allowable calculation incorrect');
    failCount++;
  } else if (result3.rule70Check.meets70Rule !== true) {
    console.log('  ❌ FAIL: Should meet 70% rule');
    failCount++;
  } else {
    console.log('  ✅ PASS: 70% rule validation correct\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message, '\n');
  failCount++;
}

// =============================================================================
// Test 4: Sensitivity Analysis
// =============================================================================

console.log('Test 4: Sensitivity Analysis');

try {
  const result4 = await analyzer.analyze(infiniteReturnInputs);

  console.log('  ARV Sensitivity:');
  console.log('    Pessimistic (-10%):', `${result4.sensitivity.arv.pessimistic.capitalRecoveryRate.toFixed(1)}%`);
  console.log('    Moderate (base):', `${result4.sensitivity.arv.moderate.capitalRecoveryRate.toFixed(1)}%`);
  console.log('    Optimistic (+10%):', `${result4.sensitivity.arv.optimistic.capitalRecoveryRate.toFixed(1)}%`);

  console.log('  Rehab Sensitivity:');
  console.log('    On Budget:', `${result4.sensitivity.rehab.onBudget.capitalRecoveryRate.toFixed(1)}%`);
  console.log('    Over 10%:', `${result4.sensitivity.rehab.overBudget10.capitalRecoveryRate.toFixed(1)}%`);
  console.log('    Over 20%:', `${result4.sensitivity.rehab.overBudget20.capitalRecoveryRate.toFixed(1)}%`);

  // Assertions
  const arvPessimistic = result4.sensitivity.arv.pessimistic.capitalRecoveryRate;
  const arvOptimistic = result4.sensitivity.arv.optimistic.capitalRecoveryRate;
  const rehabOnBudget = result4.sensitivity.rehab.onBudget.capitalRecoveryRate;
  const rehabOver20 = result4.sensitivity.rehab.overBudget20.capitalRecoveryRate;

  if (arvPessimistic >= arvOptimistic) {
    console.log('  ❌ FAIL: Pessimistic ARV should be lower than optimistic');
    failCount++;
  } else if (rehabOnBudget <= rehabOver20) {
    console.log('  ❌ FAIL: Rehab overrun should decrease recovery rate');
    failCount++;
  } else {
    console.log('  ✅ PASS: Sensitivity analysis working correctly\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message, '\n');
  failCount++;
}

// =============================================================================
// Test 5: Scoring Functions
// =============================================================================

console.log('Test 5: Scoring Functions');

try {
  const result5 = await analyzer.analyze(partialRecoveryInputs);

  console.log('  Capital Recovery Score:', `${result5.scores.capitalRecovery}/100`);
  console.log('  ARV Reliability Score:', `${result5.scores.arvReliability}/100`);
  console.log('  Rehab Execution Score:', `${result5.scores.rehabExecution}/100`);

  // Assertions
  if (result5.scores.capitalRecovery < 0 || result5.scores.capitalRecovery > 100) {
    console.log('  ❌ FAIL: Capital recovery score out of range');
    failCount++;
  } else if (result5.scores.arvReliability < 0 || result5.scores.arvReliability > 100) {
    console.log('  ❌ FAIL: ARV reliability score out of range');
    failCount++;
  } else if (result5.scores.rehabExecution < 0 || result5.scores.rehabExecution > 100) {
    console.log('  ❌ FAIL: Rehab execution score out of range');
    failCount++;
  } else {
    console.log('  ✅ PASS: All scores in valid range (0-100)\n');
    passCount++;
  }
} catch (error) {
  console.log('  ❌ FAIL:', error.message, '\n');
  failCount++;
}

// =============================================================================
// Results Summary
// =============================================================================

console.log('========================================');
console.log('SMOKE TEST RESULTS');
console.log('========================================');
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`Passed: ${passCount} ✅`);
console.log(`Failed: ${failCount} ❌`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(0)}%\n`);

if (failCount === 0) {
  console.log('🎉 ALL SMOKE TESTS PASSED - Phase 1.1 VALIDATED');
  console.log('✅ Ready to proceed to Phase 1.2: Investment Decision Engine Integration\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Review BRRRRAnalyzer implementation\n');
  process.exit(1);
}

} // End of async function

// Run the tests
runTests().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
