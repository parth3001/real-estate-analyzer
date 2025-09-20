/**
 * QE Engineer: Quick Anna TX Cash Flow Check
 */

// Quick calculation for Anna TX property
const purchasePrice = 245000;
const downPayment = 49000;
const loanAmount = 196000;
const interestRate = 7.5;
const monthlyRent = 2100;
const propertyTaxRate = 1.8;
const insuranceRate = 0.6;
const maintenance = 150;
const propertyMgmt = 8; // 8% of rent
const vacancy = 5; // 5%

// Calculate monthly mortgage (PMT formula)
const monthlyRate = interestRate / 100 / 12;
const numberOfPayments = 30 * 12;
const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

// Calculate expenses
const monthlyPropertyTax = (purchasePrice * propertyTaxRate / 100) / 12;
const monthlyInsurance = (purchasePrice * insuranceRate / 100) / 12;
const monthlyPropMgmt = monthlyRent * propertyMgmt / 100;

// Calculate income
const effectiveIncome = monthlyRent * (1 - vacancy / 100);

// Total expenses
const totalExpenses = monthlyMortgage + monthlyPropertyTax + monthlyInsurance +
                     maintenance + monthlyPropMgmt;

// Cash flow
const monthlyCashFlow = effectiveIncome - totalExpenses;

console.log('🔍 ANNA TX PROPERTY - QUICK CASH FLOW CHECK');
console.log('=' .repeat(50));
console.log('\n💰 INCOME:');
console.log(`   Gross Monthly Rent: $${monthlyRent.toFixed(2)}`);
console.log(`   Vacancy (${vacancy}%): -$${(monthlyRent * vacancy / 100).toFixed(2)}`);
console.log(`   Effective Income: $${effectiveIncome.toFixed(2)}`);

console.log('\n📊 EXPENSES:');
console.log(`   Mortgage Payment: $${monthlyMortgage.toFixed(2)}`);
console.log(`   Property Tax: $${monthlyPropertyTax.toFixed(2)}`);
console.log(`   Insurance: $${monthlyInsurance.toFixed(2)}`);
console.log(`   Maintenance: $${maintenance.toFixed(2)}`);
console.log(`   Property Mgmt (${propertyMgmt}%): $${monthlyPropMgmt.toFixed(2)}`);
console.log(`   ----------------------`);
console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`);

console.log('\n🎯 CASH FLOW:');
console.log(`   Monthly Cash Flow: $${monthlyCashFlow.toFixed(2)}`);

console.log('\n⚠️  QE ANALYSIS:');
if (monthlyCashFlow < -500) {
  console.log(`   SEVERE negative cash flow of -$${Math.abs(monthlyCashFlow).toFixed(2)}/month`);
  console.log(`   This should NEVER be a BUY, even for aggressive investors`);
  console.log(`   Expected verdict: PASS or CAUTION at best`);
} else if (monthlyCashFlow < -200) {
  console.log(`   Significant negative cash flow of -$${Math.abs(monthlyCashFlow).toFixed(2)}/month`);
  console.log(`   Aggressive investors MIGHT accept this with strong appreciation`);
  console.log(`   Expected verdict: CAUTION or NEGOTIATE`);
} else if (monthlyCashFlow < 0) {
  console.log(`   Minor negative cash flow of -$${Math.abs(monthlyCashFlow).toFixed(2)}/month`);
  console.log(`   Aggressive investors could accept this`);
  console.log(`   Expected verdict: NEGOTIATE for conservative, possible BUY for aggressive`);
} else if (monthlyCashFlow < 200) {
  console.log(`   Marginal positive cash flow of $${monthlyCashFlow.toFixed(2)}/month`);
  console.log(`   Conservative: NEGOTIATE, Aggressive: BUY makes sense`);
} else {
  console.log(`   Strong positive cash flow of $${monthlyCashFlow.toFixed(2)}/month`);
  console.log(`   This could be BUY for most investor types`);
}