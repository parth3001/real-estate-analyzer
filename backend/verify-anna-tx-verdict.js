/**
 * QE Engineer: Verify Anna TX Property with actual Investment Decision Engine
 * Let's see what our platform ACTUALLY calculates for this property
 */

const { SFRAnalyzer } = require('./dist/analysis/SFRAnalyzer');

// Anna, TX property from our tests
const annaTxProperty = {
  propertyType: 'SFR',
  propertyName: 'Anna TX Test Property',
  propertyAddress: {
    street: '1837 Walnut Way',
    city: 'Anna',
    state: 'TX',
    zipCode: '75409'
  },
  purchasePrice: 245000,
  downPayment: 49000, // 20% = $49,000 actual dollars
  interestRate: 7.5,
  loanTerm: 30,
  propertyTaxRate: 1.8, // Texas property tax
  insuranceRate: 0.6,
  propertyManagementRate: 8,
  yearBuilt: 2018,
  monthlyRent: 2100, // From test data
  squareFootage: 1650,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 150,
  closingCosts: 5000,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2.5,
    vacancyRate: 5,
    turnoverFrequency: 2
  }
};

function convertToAnalysisAssumptions(longTermAssumptions) {
  return {
    projectionYears: longTermAssumptions.projectionYears,
    annualRentIncrease: longTermAssumptions.annualRentIncrease,
    annualExpenseIncrease: longTermAssumptions.inflationRate || 2.5,
    annualPropertyValueIncrease: longTermAssumptions.annualPropertyValueIncrease,
    sellingCosts: longTermAssumptions.sellingCostsPercentage,
    vacancyRate: longTermAssumptions.vacancyRate,
    turnoverFrequency: longTermAssumptions.turnoverFrequency || 2
  };
}

console.log('🔬 QE ENGINEER: Verifying Anna TX Property with Real Platform Engine');
console.log('=' .repeat(80));

console.log('\n📊 PROPERTY INPUT DATA:');
console.log(`   Address: ${annaTxProperty.propertyAddress.street}, ${annaTxProperty.propertyAddress.city}, ${annaTxProperty.propertyAddress.state}`);
console.log(`   Purchase Price: $${annaTxProperty.purchasePrice.toLocaleString()}`);
console.log(`   Down Payment: $${annaTxProperty.downPayment.toLocaleString()} (20%)`);
console.log(`   Loan Amount: $${(annaTxProperty.purchasePrice - annaTxProperty.downPayment).toLocaleString()}`);
console.log(`   Interest Rate: ${annaTxProperty.interestRate}%`);
console.log(`   Monthly Rent: $${annaTxProperty.monthlyRent.toLocaleString()}`);
console.log(`   Property Tax: ${annaTxProperty.propertyTaxRate}% (Texas rate)`);

// Run actual SFRAnalyzer
const analyzer = new SFRAnalyzer(annaTxProperty, convertToAnalysisAssumptions(annaTxProperty.longTermAssumptions));
const analysis = analyzer.analyze();

console.log('\n=' .repeat(80));
console.log('🖥️  ACTUAL PLATFORM CALCULATION RESULTS:');
console.log('=' .repeat(80));

console.log('\n💰 MONTHLY BREAKDOWN:');
console.log(`   Gross Monthly Income: $${annaTxProperty.monthlyRent.toFixed(2)}`);
console.log(`   Effective Income (5% vacancy): $${(annaTxProperty.monthlyRent * 0.95).toFixed(2)}`);
console.log(`   Mortgage Payment: $${(analysis.monthlyAnalysis.expenses?.debt || 0).toFixed(2)}`);
console.log(`   Property Tax: $${((annaTxProperty.purchasePrice * annaTxProperty.propertyTaxRate / 100) / 12).toFixed(2)}`);
console.log(`   Insurance: $${((annaTxProperty.purchasePrice * annaTxProperty.insuranceRate / 100) / 12).toFixed(2)}`);
console.log(`   Maintenance: $${annaTxProperty.maintenanceCost.toFixed(2)}`);
console.log(`   Property Management: $${(annaTxProperty.monthlyRent * annaTxProperty.propertyManagementRate / 100).toFixed(2)}`);

console.log('\n📊 KEY METRICS:');
console.log(`   Monthly Cash Flow: $${(analysis.monthlyAnalysis.cashFlow || 0).toFixed(2)}`);
console.log(`   Cap Rate: ${(analysis.keyMetrics.capRate || 0).toFixed(2)}%`);
console.log(`   Cash-on-Cash Return: ${(analysis.keyMetrics.cashOnCashReturn || 0).toFixed(2)}%`);
console.log(`   IRR: ${(analysis.keyMetrics.irr || 0).toFixed(2)}%`);
console.log(`   DSCR: ${(analysis.keyMetrics.dscr || 0).toFixed(2)}x`);

console.log('\n🎯 INVESTMENT DECISION ENGINE VERDICT:');
if (analysis.investmentDecision) {
  console.log(`   Verdict: ${analysis.investmentDecision.verdict || 'UNKNOWN'}`);
  console.log(`   Deal Quality Score: ${analysis.investmentDecision.dealQualityScore || 0}/100`);
  console.log(`   Confidence: ${analysis.investmentDecision.confidence || 'N/A'}`);
} else {
  console.log('   ⚠️  No investment decision found in analysis');
}

console.log('\n🔍 REALITY CHECK:');
const monthlyExpenses = (analysis.monthlyAnalysis.expenses?.debt || 0) +
  ((annaTxProperty.purchasePrice * annaTxProperty.propertyTaxRate / 100) / 12) +
  ((annaTxProperty.purchasePrice * annaTxProperty.insuranceRate / 100) / 12) +
  annaTxProperty.maintenanceCost +
  (annaTxProperty.monthlyRent * annaTxProperty.propertyManagementRate / 100);

const effectiveIncome = annaTxProperty.monthlyRent * 0.95;
const calculatedCashFlow = effectiveIncome - monthlyExpenses;

console.log(`   Total Monthly Expenses: $${monthlyExpenses.toFixed(2)}`);
console.log(`   Effective Monthly Income: $${effectiveIncome.toFixed(2)}`);
console.log(`   Calculated Cash Flow: $${calculatedCashFlow.toFixed(2)}`);
console.log(`   Platform Cash Flow: $${(analysis.monthlyAnalysis.cashFlow || 0).toFixed(2)}`);

console.log('\n⚠️  QE VALIDATION CONCERN:');
if (calculatedCashFlow < -500) {
  console.log(`   With -$${Math.abs(calculatedCashFlow).toFixed(2)}/month cash flow, BUY verdict seems incorrect`);
  console.log(`   Even for aggressive investors, this level of negative cash flow is concerning`);
  console.log(`   Our Investment Decision Engine should likely return CAUTION or PASS`);
} else if (calculatedCashFlow < 0) {
  console.log(`   Negative cash flow of -$${Math.abs(calculatedCashFlow).toFixed(2)}/month`);
  console.log(`   Aggressive investors might accept this, but BUY seems optimistic`);
  console.log(`   NEGOTIATE or CAUTION would be more appropriate`);
} else {
  console.log(`   Positive cash flow of $${calculatedCashFlow.toFixed(2)}/month`);
  console.log(`   This could justify NEGOTIATE for conservative, BUY for aggressive`);
}

console.log('\n=' .repeat(80));
console.log('🔚 ACTUAL PLATFORM VERIFICATION COMPLETE');
console.log('=' .repeat(80));