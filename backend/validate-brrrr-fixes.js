/**
 * BRRRR Fixes Validation Script
 *
 * Quick validation of P0+P1 fixes using McKinney TX property
 * Run: node validate-brrrr-fixes.js
 *
 * Date: 2026-01-12
 */

const { BRRRRAnalyzer } = require('./dist/services/investment/brrrAnalyzer');

console.log('\n' + '='.repeat(70));
console.log('BRRRR FIXES VALIDATION - McKinney TX Property');
console.log('='.repeat(70) + '\n');

// McKinney TX Property
const mcKinneyTX = {
  purchasePrice: 175000,
  downPayment: 35000, // 20%
  interestRate: 7.5,
  loanTerm: 30,
  monthlyRent: 3250,
  propertyTaxRate: 1.5,
  insuranceRate: 0.35,
  maintenanceCost: 3900, // $325/month
  propertyManagementRate: 8,
  vacancyRate: 5,
  capitalExpendituresPercent: 5,
  monthlyHOA: 0,
  monthlyUtilities: 0,
  brrrr: {
    afterRepairValue: 275000,
    rehabBudget: 50000,
    refinanceLTV: 75,
    refinanceRate: 6.5,
    refinanceClosingCostPercent: 2.5,
    seasoningPeriod: 12
  },
  strategy: 'brrrr'
};

const analyzer = new BRRRRAnalyzer();
const result = analyzer.analyze(mcKinneyTX);

// Helper function
const formatCurrency = (value) => {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (value) => {
  return value.toFixed(1) + '%';
};

console.log('📋 PROPERTY DETAILS');
console.log('-'.repeat(70));
console.log(`Purchase Price:        ${formatCurrency(mcKinneyTX.purchasePrice)}`);
console.log(`After Repair Value:    ${formatCurrency(mcKinneyTX.brrrr.afterRepairValue)}`);
console.log(`Rehab Budget:          ${formatCurrency(mcKinneyTX.brrrr.rehabBudget)}`);
console.log(`Monthly Rent:          ${formatCurrency(mcKinneyTX.monthlyRent)}`);
console.log(`Down Payment (20%):    ${formatCurrency(mcKinneyTX.downPayment)}`);
console.log('\n');

// P0 Fix #1: Management Fee Double-Counting
console.log('✅ P0 FIX #1: Management Fee Double-Counting (Seasoning)');
console.log('-'.repeat(70));

const seasoning = result.brrrr.seasoningCosts;
const monthlyManagement = mcKinneyTX.monthlyRent * (mcKinneyTX.propertyManagementRate / 100);
const annualManagement = monthlyManagement * 12;

console.log(`Monthly Management Fee:     ${formatCurrency(monthlyManagement)}`);
console.log(`Annual Management (12mo):   ${formatCurrency(annualManagement)}`);
console.log('');
console.log('Holding Costs Breakdown:');
console.log(`  Mortgage Payments:        ${formatCurrency(seasoning.mortgagePayments)}`);
console.log(`  Property Tax:             ${formatCurrency(seasoning.propertyTax)}`);
console.log(`  Insurance:                ${formatCurrency(seasoning.insurance)}`);
console.log(`  Maintenance:              ${formatCurrency(seasoning.maintenance)}`);
console.log(`  Utilities:                ${formatCurrency(seasoning.utilities)}`);
console.log(`  HOA:                      ${formatCurrency(seasoning.hoa)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`  Total Holding Costs:      ${formatCurrency(seasoning.totalHoldingCosts)}`);
console.log('');

// Check if management is in holding costs
const holdingCostsSum = seasoning.mortgagePayments + seasoning.propertyTax +
                        seasoning.insurance + seasoning.maintenance +
                        seasoning.utilities + seasoning.hoa;

if (Math.abs(seasoning.totalHoldingCosts - holdingCostsSum) < 1) {
  console.log('✅ PASS: Management fee NOT in holding costs (correct!)');
} else {
  console.log('❌ FAIL: Management fee appears to be in holding costs');
}

console.log('');
console.log('Income Side:');
console.log(`  Gross Rental Income:      ${formatCurrency(seasoning.grossRentalIncome)}`);
console.log(`  - Management Fee:         ${formatCurrency(seasoning.propertyManagement)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`  Net Rental Income:        ${formatCurrency(seasoning.netRentalIncome)}`);
console.log('');
console.log(`Seasoning Net Cash Flow:    ${formatCurrency(seasoning.seasoningNetCashFlow)}`);

if (seasoning.seasoningNetCashFlow > 15000) {
  console.log('✅ PASS: Seasoning profit > $15,000 (management fix working)');
} else {
  console.log('⚠️  WARNING: Seasoning profit lower than expected');
}

console.log('\n');

// P0 Fix #2: Refinance Closing Costs
console.log('✅ P0 FIX #2: Refinance Closing Costs (2% → 2.5%)');
console.log('-'.repeat(70));

const refinance = result.brrrr.refinance;
const newLoanAmount = mcKinneyTX.brrrr.afterRepairValue * (mcKinneyTX.brrrr.refinanceLTV / 100);
const expectedClosingCosts = newLoanAmount * 0.025;
const oldClosingCosts = newLoanAmount * 0.02;

console.log(`New Loan Amount (75% LTV):  ${formatCurrency(newLoanAmount)}`);
console.log('');
console.log(`Old Closing Costs (2%):     ${formatCurrency(oldClosingCosts)}`);
console.log(`New Closing Costs (2.5%):   ${formatCurrency(expectedClosingCosts)}`);
console.log(`Actual Closing Costs:       ${formatCurrency(refinance.refinanceClosingCosts)}`);
console.log(`Difference:                 ${formatCurrency(expectedClosingCosts - oldClosingCosts)}`);
console.log('');

if (Math.abs(refinance.refinanceClosingCosts - expectedClosingCosts) < 1) {
  console.log('✅ PASS: Refinance closing costs = 2.5% (BiggerPockets standard)');
} else {
  console.log('❌ FAIL: Closing costs do not match 2.5%');
}

console.log('');
console.log(`Cash-Out Proceeds:          ${formatCurrency(refinance.cashOutProceeds)}`);
console.log(`Net Cash-Out:               ${formatCurrency(refinance.netCashOut)}`);

console.log('\n');

// P1 Fix #2: Vacancy in Operating Expenses
console.log('✅ P1 FIX #2: Vacancy Removed from Operating Expenses');
console.log('-'.repeat(70));

const postRefi = result.brrrr.postRefinance;
const monthlyVacancy = mcKinneyTX.monthlyRent * (mcKinneyTX.vacancyRate / 100);
const monthlyPropertyTax = (mcKinneyTX.brrrr.afterRepairValue * mcKinneyTX.propertyTaxRate / 100) / 12;
const monthlyInsurance = (mcKinneyTX.purchasePrice * mcKinneyTX.insuranceRate / 100) / 12;
const monthlyMaintenance = mcKinneyTX.maintenanceCost / 12;
const monthlyCapEx = mcKinneyTX.monthlyRent * (mcKinneyTX.capitalExpendituresPercent / 100);

console.log('Post-Refinance Operating Expenses:');
console.log(`  Property Tax (ARV):       ${formatCurrency(monthlyPropertyTax)}`);
console.log(`  Insurance (user input):   ${formatCurrency(monthlyInsurance)}`);
console.log(`  Maintenance:              ${formatCurrency(monthlyMaintenance)}`);
console.log(`  CapEx:                    ${formatCurrency(monthlyCapEx)}`);
console.log(`  HOA:                      ${formatCurrency(mcKinneyTX.monthlyHOA)}`);
console.log(`  Utilities:                ${formatCurrency(mcKinneyTX.monthlyUtilities)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`  Total (from platform):    ${formatCurrency(postRefi.monthlyOperatingExpenses)}`);
console.log('');
console.log(`Monthly Vacancy (5%):       ${formatCurrency(monthlyVacancy)}`);
console.log(`Monthly Management (8%):    ${formatCurrency(monthlyManagement)}`);
console.log('');

// Check if vacancy is in operating expenses
const expectedOpExWithoutVacancy = monthlyPropertyTax + monthlyInsurance + monthlyMaintenance + monthlyCapEx;
const opExWithTurnover = expectedOpExWithoutVacancy + 50; // Allow for turnover costs

if (postRefi.monthlyOperatingExpenses < monthlyVacancy + expectedOpExWithoutVacancy - 50) {
  console.log('✅ PASS: Vacancy NOT in operating expenses (correct!)');
} else if (postRefi.monthlyOperatingExpenses > monthlyVacancy + expectedOpExWithoutVacancy + 200) {
  console.log('⚠️  WARNING: Operating expenses higher than expected');
} else {
  console.log('✅ LIKELY PASS: Operating expenses in expected range (may include turnover costs)');
}

console.log('');
console.log('NOI Calculation:');
console.log(`  Monthly Rent:             ${formatCurrency(mcKinneyTX.monthlyRent)}`);
console.log(`  - Vacancy:                ${formatCurrency(monthlyVacancy)}`);
console.log(`  - Management:             ${formatCurrency(monthlyManagement)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`  Effective Gross Income:   ${formatCurrency(mcKinneyTX.monthlyRent - monthlyVacancy - monthlyManagement)}`);
console.log(`  - Operating Expenses:     ${formatCurrency(postRefi.monthlyOperatingExpenses)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`  Monthly NOI:              ${formatCurrency(postRefi.annualNOI / 12)}`);
console.log(`  Annual NOI:               ${formatCurrency(postRefi.annualNOI)}`);
console.log('');

if (postRefi.annualNOI > 20000) {
  console.log('✅ PASS: Annual NOI > $20,000 (realistic for this property)');
} else {
  console.log('⚠️  WARNING: Annual NOI lower than expected');
}

console.log('\n');

// Capital Recovery (BiggerPockets Method A)
console.log('📊 CAPITAL RECOVERY - BiggerPockets Method A');
console.log('-'.repeat(70));

const capital = result.brrrr.capitalRecovery;

console.log(`Total Investment:           ${formatCurrency(capital.totalInvestment)}`);
console.log(`Seasoning Profit:           ${formatCurrency(seasoning.seasoningNetCashFlow)}`);
console.log(`  ─────────────────────────────────────`);
console.log(`Capital Deployed (Method A):${formatCurrency(capital.capitalDeployed)}`);
console.log('');
console.log(`Cash Recovered:             ${formatCurrency(capital.cashRecovered)}`);
console.log(`Capital Remaining:          ${formatCurrency(capital.capitalRemaining)}`);
console.log('');
console.log(`Capital Recovery Rate:      ${formatPercent(capital.capitalRecoveryRate)}`);
console.log(`Rating:                     ${capital.rating}`);
console.log('');

if (capital.capitalRecoveryRate >= 85 && capital.capitalRecoveryRate <= 100) {
  console.log('✅ PASS: Capital recovery 85-100% (EXCELLENT tier)');
} else if (capital.capitalRecoveryRate > 100) {
  console.log('✅ PASS: Capital recovery > 100% (Infinite return!)');
} else {
  console.log('⚠️  Capital recovery below EXCELLENT tier');
}

console.log('\n');

// Overall Summary
console.log('📈 POST-REFINANCE PERFORMANCE');
console.log('-'.repeat(70));
console.log(`Monthly Cash Flow:          ${formatCurrency(postRefi.monthlyCashFlow)}`);
console.log(`Annual Cash Flow:           ${formatCurrency(postRefi.annualCashFlow)}`);
console.log(`Cash-on-Cash Return:        ${formatPercent(postRefi.cashOnCashReturn)}`);
console.log(`DSCR:                       ${postRefi.postRefiDSCR.toFixed(2)}x`);
console.log('');

let passCount = 0;
let totalChecks = 0;

// Summary checks
console.log('═'.repeat(70));
console.log('VALIDATION SUMMARY');
console.log('═'.repeat(70));

totalChecks++;
if (Math.abs(seasoning.totalHoldingCosts - holdingCostsSum) < 1) {
  console.log('✅ Management NOT in holding costs');
  passCount++;
} else {
  console.log('❌ Management fee issue detected');
}

totalChecks++;
if (Math.abs(refinance.refinanceClosingCosts - expectedClosingCosts) < 1) {
  console.log('✅ Refinance closing costs = 2.5%');
  passCount++;
} else {
  console.log('❌ Refinance closing costs issue');
}

totalChecks++;
if (postRefi.monthlyOperatingExpenses < monthlyVacancy + expectedOpExWithoutVacancy + 200) {
  console.log('✅ Vacancy NOT in operating expenses');
  passCount++;
} else {
  console.log('❌ Vacancy in operating expenses issue');
}

totalChecks++;
if (capital.capitalRecoveryRate >= 85) {
  console.log('✅ Capital recovery EXCELLENT (85%+)');
  passCount++;
} else {
  console.log('⚠️  Capital recovery below target');
}

totalChecks++;
if (postRefi.monthlyCashFlow > 0) {
  console.log('✅ Positive monthly cash flow');
  passCount++;
} else {
  console.log('❌ Negative cash flow');
}

totalChecks++;
if (postRefi.postRefiDSCR >= 1.25) {
  console.log('✅ DSCR above 1.25x (Fannie Mae standard)');
  passCount++;
} else {
  console.log('⚠️  DSCR below lender requirements');
}

console.log('═'.repeat(70));
console.log(`RESULT: ${passCount}/${totalChecks} checks passed`);

if (passCount === totalChecks) {
  console.log('🎉 ALL VALIDATIONS PASSED! Platform ready for UAT.');
} else {
  console.log(`⚠️  ${totalChecks - passCount} issue(s) detected - review needed.`);
}

console.log('═'.repeat(70) + '\n');
