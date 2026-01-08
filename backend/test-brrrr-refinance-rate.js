/**
 * Direct BRRRR Refinance Rate Test
 * Tests if refinanceInterestRate: 9.25 is preserved vs fallback to 7.5
 */

// Simulate the inputs object that would be passed to BRRRR analyzer
const testInputs = {
  purchasePrice: 100000,
  downPayment: 20000,
  closingCosts: 2000,
  interestRate: 7.5,  // Purchase loan rate
  loanTerm: 30,
  monthlyRent: 2100,
  brrrr: {
    rehabBudget: 30000,
    afterRepairValue: 150000,
    refinanceLTV: 75,
    seasoningPeriod: 12,
    refinanceInterestRate: 9.25  // USER-PROVIDED REFINANCE RATE
  }
};

console.log('='.repeat(80));
console.log('DIRECT BRRRR REFINANCE RATE TEST');
console.log('='.repeat(80));

console.log('\n📥 INPUT DATA:');
console.log('Purchase Interest Rate:', testInputs.interestRate + '%');
console.log('Refinance Interest Rate:', testInputs.brrrr.refinanceInterestRate + '%');

console.log('\n🧪 TESTING ?? OPERATOR BEHAVIOR:');

// Test 1: ?? operator with 9.25
const refinanceRate1 = testInputs.brrrr.refinanceInterestRate ?? testInputs.interestRate;
console.log('Test 1 - User provided 9.25:');
console.log('  Formula: refinanceInterestRate ?? interestRate');
console.log('  Result:', refinanceRate1 + '%');
console.log('  Expected: 9.25% ✅');
console.log('  Status:', refinanceRate1 === 9.25 ? '✅ PASS' : '❌ FAIL');

// Test 2: ?? operator with undefined (user didn't provide)
const testInputs2 = { ...testInputs, brrrr: { ...testInputs.brrrr, refinanceInterestRate: undefined } };
const refinanceRate2 = testInputs2.brrrr.refinanceInterestRate ?? testInputs2.interestRate;
console.log('\nTest 2 - User did NOT provide (undefined):');
console.log('  Formula: undefined ?? interestRate');
console.log('  Result:', refinanceRate2 + '%');
console.log('  Expected: 7.5% ✅');
console.log('  Status:', refinanceRate2 === 7.5 ? '✅ PASS' : '❌ FAIL');

// Test 3: ?? operator with 0 (promotional rate)
const testInputs3 = { ...testInputs, brrrr: { ...testInputs.brrrr, refinanceInterestRate: 0 } };
const refinanceRate3 = testInputs3.brrrr.refinanceInterestRate ?? testInputs3.interestRate;
console.log('\nTest 3 - User provided 0% promotional rate:');
console.log('  Formula: 0 ?? interestRate');
console.log('  Result:', refinanceRate3 + '%');
console.log('  Expected: 0% ✅');
console.log('  Status:', refinanceRate3 === 0 ? '✅ PASS' : '❌ FAIL');

// Test 4: OLD BUGGY || operator with 9.25
const refinanceRateBuggy = testInputs.brrrr.refinanceInterestRate || testInputs.interestRate;
console.log('\n🐛 OLD BUGGY || OPERATOR (for comparison):');
console.log('  Formula: refinanceInterestRate || interestRate');
console.log('  Result:', refinanceRateBuggy + '%');
console.log('  Expected: 9.25% (but || would also work here)');

// Test 5: Calculate expected mortgage payment
console.log('\n💰 MORTGAGE PAYMENT CALCULATIONS:');

function calculateMortgage(principal, annualRate, years) {
  const monthlyRate = (annualRate / 100) / 12;
  const numberOfPayments = years * 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                 (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  return payment.toFixed(2);
}

const newLoanAmount = testInputs.brrrr.afterRepairValue * (testInputs.brrrr.refinanceLTV / 100);
console.log('New Loan Amount:', '$' + newLoanAmount.toLocaleString());

const paymentAt7_5 = calculateMortgage(newLoanAmount, 7.5, 30);
const paymentAt9_25 = calculateMortgage(newLoanAmount, 9.25, 30);

console.log('\nExpected Monthly Payments:');
console.log('  At 7.5% (purchase rate):', '$' + paymentAt7_5);
console.log('  At 9.25% (user rate):   ', '$' + paymentAt9_25);
console.log('  Difference:             ', '$' + (parseFloat(paymentAt9_25) - parseFloat(paymentAt7_5)).toFixed(2) + '/month');

console.log('\n🎯 CRITICAL TEST QUESTION:');
console.log('What payment did the backend return in the response?');
console.log('  If $' + paymentAt7_5 + ' → Bug exists (using 7.5%)');
console.log('  If $' + paymentAt9_25 + ' → Bug fixed (using 9.25%)');

console.log('\n' + '='.repeat(80));
