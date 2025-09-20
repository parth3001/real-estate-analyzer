/**
 * QE Engineer: Get ACTUAL Investment Decision Engine verdict for Anna TX property
 * Using the real platform calculation engine
 */

const { SFRAnalyzer } = require('./dist/analysis/SFRAnalyzer');
const { InvestmentDecisionEngine } = require('./dist/services/investment/investmentDecisionEngine');

// Anna TX property data from test
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
  downPayment: 49000, // 20%
  interestRate: 7.5,
  loanTerm: 30,
  propertyTaxRate: 1.8, // Texas
  insuranceRate: 0.6,
  propertyManagementRate: 8,
  yearBuilt: 2018,
  monthlyRent: 2100,
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

console.log('🔬 QE ENGINEER: Getting ACTUAL Investment Decision Engine Verdicts');
console.log('=' .repeat(70));
console.log('\n🏠 ANNA TX PROPERTY (1837 Walnut Way, Anna, TX 75409)');
console.log(`Purchase: $${annaTxProperty.purchasePrice.toLocaleString()}, Monthly Rent: $${annaTxProperty.monthlyRent}`);

// Get base analysis
const analyzer = new SFRAnalyzer(annaTxProperty, convertToAnalysisAssumptions(annaTxProperty.longTermAssumptions));
const baseAnalysis = analyzer.analyze();

console.log('\n📊 BASE FINANCIAL METRICS:');
console.log(`   Monthly Cash Flow: $${(baseAnalysis.monthlyAnalysis.cashFlow || 0).toFixed(2)}`);
console.log(`   Cap Rate: ${(baseAnalysis.keyMetrics.capRate || 0).toFixed(2)}%`);
console.log(`   Cash-on-Cash: ${(baseAnalysis.keyMetrics.cashOnCashReturn || 0).toFixed(2)}%`);
console.log(`   IRR: ${(baseAnalysis.keyMetrics.irr || 0).toFixed(2)}%`);

// Initialize Investment Decision Engine
const decisionEngine = new InvestmentDecisionEngine();

// Test with different investor strategies
const strategies = [
  {
    name: 'DEFAULT (No Strategy)',
    strategy: null
  },
  {
    name: 'CONSERVATIVE',
    strategy: {
      riskTolerance: 'Low',
      investmentGoal: 'Cash Flow',
      timeHorizon: 'Long-term',
      preferredMarkets: null
    }
  },
  {
    name: 'AGGRESSIVE',
    strategy: {
      riskTolerance: 'High',
      investmentGoal: 'Wealth Building',
      timeHorizon: 'Medium-term',
      preferredMarkets: null
    }
  }
];

console.log('\n=' .repeat(70));
console.log('🎯 ACTUAL INVESTMENT DECISION ENGINE VERDICTS:');
console.log('=' .repeat(70));

strategies.forEach(({ name, strategy }) => {
  // Create property data with strategy
  const propertyWithStrategy = {
    ...annaTxProperty,
    strategy
  };

  // Get decision (using async method)
  const decision = await decisionEngine.generateInvestmentDecision(
    baseAnalysis,
    propertyWithStrategy,
    null, // marketData
    null  // marketPredictions
  );

  console.log(`\n${name}:`);
  console.log(`   Verdict: ${decision.verdict}`);
  console.log(`   Score: ${decision.dealQualityScore}/100`);
  console.log(`   Confidence: ${decision.confidence}`);

  if (decision.keyFactors && decision.keyFactors.length > 0) {
    console.log(`   Key Factors:`);
    decision.keyFactors.slice(0, 3).forEach(factor => {
      console.log(`   - ${factor}`);
    });
  }
});

console.log('\n=' .repeat(70));
console.log('🔍 QE ANALYSIS:');
console.log(`With monthly cash flow of $${(baseAnalysis.monthlyAnalysis.cashFlow || 0).toFixed(2)}:`);
if (baseAnalysis.monthlyAnalysis.cashFlow < -500) {
  console.log('❌ This should NOT be BUY even for aggressive investors');
  console.log('   Expected: CAUTION or PASS');
} else if (baseAnalysis.monthlyAnalysis.cashFlow < -200) {
  console.log('⚠️  Significant negative cash flow');
  console.log('   Conservative: PASS, Aggressive: CAUTION/NEGOTIATE');
} else if (baseAnalysis.monthlyAnalysis.cashFlow < 0) {
  console.log('📊 Minor negative cash flow');
  console.log('   Conservative: CAUTION/PASS, Aggressive: NEGOTIATE');
} else {
  console.log('✅ Positive cash flow');
  console.log('   Conservative: NEGOTIATE/BUY, Aggressive: BUY');
}

console.log('\n=' .repeat(70));
console.log('✅ ACTUAL VERDICTS EXTRACTED');