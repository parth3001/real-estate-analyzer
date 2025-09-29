// Simple test to compare Deal Quality scores across personas
const { InvestmentDecisionEngine } = require('./dist/services/investment/investmentDecisionEngine');

async function comparePersonaScores() {
  console.log('🎯 STRATEGY-AWARE SCORING COMPARISON');
  console.log('=====================================');

  const engine = new InvestmentDecisionEngine();

  const personas = [
    { riskTolerance: 'conservative', name: 'Conservative' },
    { riskTolerance: 'moderate', name: 'Moderate' },
    { riskTolerance: 'aggressive', name: 'Aggressive' }
  ];

  const sfrData = {
    propertyType: 'SFR',
    purchasePrice: 245000,
    downPayment: 49000,
    interestRate: 0.075,
    loanTerm: 30,
    monthlyRent: 1590,
    propertyAddress: { street: '1837 Walnut Way', city: 'Anna', state: 'TX', zipCode: '75409' }
  };

  const analysis = {
    fundamentals: {
      cashFlow: -560,
      irr: 3.21,
      capRate: 3.97,
      totalInvestment: 53900,
      dscr: 0.59,
      cocReturn: -12.47
    }
  };

  const predictions = { appreciation: 3.5 };
  const marketIntelligence = { marketTier: 'C+', marketMedianCapRate: 5.5 };

  console.log('\n📋 Property: 1837 Walnut Way, Anna, TX - $245,000');
  console.log('💰 Financial Profile: -$560 cash flow, 3.97% cap rate, 3.21% IRR\n');

  for (const persona of personas) {
    try {
      // Suppress verbose logging for clean output
      const originalLog = console.log;
      console.log = () => {};

      const result = await engine.generateInvestmentDecision(
        sfrData,
        analysis,
        predictions,
        marketIntelligence,
        persona,
        null
      );

      // Restore logging
      console.log = originalLog;

      console.log(`${persona.name.toUpperCase()} INVESTOR:`);
      console.log(`   💯 Deal Quality: ${result.professionalAssessment.dealQuality}/100`);
      console.log(`   🎯 Verdict: ${result.verdict}`);
      console.log(`   🔒 Confidence: ${result.confidence}%`);
      console.log(`   ⚖️  Weights Used: ${persona.riskTolerance.toUpperCase()} strategy`);
      console.log('');

    } catch (error) {
      console.log(`${persona.name}: ERROR - ${error.message}\n`);
    }
  }

  console.log('🔍 Strategy Impact:');
  console.log('   Conservative: Emphasizes cash flow safety (+10% weight)');
  console.log('   Moderate: Uses balanced base weights');
  console.log('   Aggressive: Emphasizes IRR potential (+10% weight)');
}

comparePersonaScores().catch(console.error);