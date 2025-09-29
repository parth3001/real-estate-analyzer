// Quick test for strategy-aware weights functionality
const { InvestmentDecisionEngine } = require('./dist/services/investment/investmentDecisionEngine');

async function testStrategyWeights() {
  console.log('🧪 TESTING STRATEGY-AWARE WEIGHTS');
  console.log('================================');

  const engine = new InvestmentDecisionEngine();

  // Test data
  const testContexts = [
    { riskTolerance: 'conservative', name: 'Conservative' },
    { riskTolerance: 'moderate', name: 'Moderate' },
    { riskTolerance: 'aggressive', name: 'Aggressive' }
  ];

  // Complete property data for testing (Anna, TX property)
  const propertyData = {
    purchasePrice: 245000,
    address: { street: '1837 Walnut Way', city: 'Anna', state: 'TX', zipCode: '75409' },
    downPayment: 49000,
    interestRate: 0.075,
    loanTerm: 30,
    monthlyRent: 1590
  };

  const fundamentals = {
    cashFlow: -560,
    irr: 3.21,
    capRate: 3.97,
    totalInvestment: 53900,
    dscr: 0.59,
    cocReturn: -12.47
  };

  const mockAnalysis = {
    marketTier: 'C+',
    marketMedianCapRate: 5.5,
    appreciationPotential: 'Moderate',
    marketTrends: 'Stable'
  };

  const propertyClassification = {
    propertyAge: 20,
    condition: 'Good',
    location: 'Suburban'
  };

  const strategyAlignment = {
    score: 75,
    factors: ['Growing market', 'Stable rental demand']
  };

  const leverageAnalysis = {
    optimalScenario: {
      ltvRatio: 0.8,
      interestRate: 0.075,
      loanTermYears: 30
    }
  };

  for (const context of testContexts) {
    console.log(`\n📋 Testing ${context.name} Investor:`);
    console.log(`   Risk Tolerance: ${context.riskTolerance}`);

    try {
      // Prepare complete data for generateInvestmentDecision
      const sfrData = {
        propertyType: 'SFR',
        purchasePrice: propertyData.purchasePrice,
        downPayment: propertyData.downPayment,
        interestRate: propertyData.interestRate,
        loanTerm: propertyData.loanTerm,
        monthlyRent: propertyData.monthlyRent,
        propertyAddress: propertyData.address
      };

      const analysis = { fundamentals };
      const predictions = { appreciation: 3.5 };
      const marketIntelligence = mockAnalysis;

      // Call the public method that uses our strategy-aware weights
      const result = await engine.generateInvestmentDecision(
        sfrData,
        analysis,
        predictions,
        marketIntelligence,
        context,  // This should trigger our strategy-aware weights
        null      // No enhanced goals for this test
      );

      console.log(`   Deal Quality Score: ${result.professionalAssessment.dealQuality}/100`);
      console.log(`   Verdict: ${result.verdict}`);
      console.log(`   Confidence: ${result.confidence}%`);

    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

testStrategyWeights().catch(console.error);