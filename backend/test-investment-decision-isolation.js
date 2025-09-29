/**
 * Test Investment Decision Engine Isolation
 *
 * Verifies that the Investment Decision Engine works correctly
 * without tax analysis integration
 */

const axios = require('axios');

console.log('🧪 Testing Investment Decision Engine Isolation\n');
console.log('Verifying that investment decisions are completely independent of tax analysis...\n');

const testProperty = {
  address: "123 Test St, Austin, TX 78701",
  purchasePrice: 350000,
  downPayment: 70000,
  closingCosts: 5250,
  repairCosts: 10000,
  monthlyRent: 2800,
  propertyTax: 4200,
  insurance: 1200,
  vacancy: 5,
  maintenance: 3,
  capEx: 2,
  propertyManagement: 8,
  monthlyUtilities: 0,
  loanAmount: 280000,
  interestRate: 7.0,
  loanTerm: 30,
  propertyAppreciation: 3,
  rentGrowth: 2.5,
  expenseInflation: 2.5
};

// Test 1: Property WITHOUT tax profile
async function testWithoutTaxProfile() {
  console.log('📝 Test 1: Analyzing property WITHOUT tax profile...');

  try {
    const startTime = Date.now();
    const response = await axios.post('http://localhost:3001/api/deals/analyze', testProperty, {
      timeout: 30000
    });
    const duration = Date.now() - startTime;

    const analysis = response.data;

    console.log('✅ Analysis completed successfully');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Investment Verdict: ${analysis.investmentDecision?.verdict}`);
    console.log(`   Deal Quality Score: ${analysis.investmentDecision?.professionalAssessment?.dealQuality}/100`);
    console.log(`   Has Tax Analysis: ${!!analysis.investmentDecision?.taxAnalysis}`);
    console.log(`   Has Tax Optimization: ${!!analysis.investmentDecision?.professionalAssessment?.taxOptimization}`);

    return {
      success: true,
      verdict: analysis.investmentDecision?.verdict,
      dealQuality: analysis.investmentDecision?.professionalAssessment?.dealQuality,
      hasTax: !!analysis.investmentDecision?.taxAnalysis
    };
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    return { success: false };
  }
}

// Test 2: Property WITH tax profile (should be ignored)
async function testWithTaxProfile() {
  console.log('\n📝 Test 2: Analyzing property WITH tax profile (should be ignored)...');

  const propertyWithTax = {
    ...testProperty,
    taxProfile: {
      filingStatus: 'single',
      state: 'TX',
      federalTaxBracket: 24,
      capitalGainsHoldingStrategy: 'long_term',
      depreciation: {
        method: 'straight_line',
        personalUsePercentage: 0
      },
      investorType: 'individual'
    }
  };

  try {
    const startTime = Date.now();
    const response = await axios.post('http://localhost:3001/api/deals/analyze', propertyWithTax, {
      timeout: 30000
    });
    const duration = Date.now() - startTime;

    const analysis = response.data;

    console.log('✅ Analysis completed successfully');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Investment Verdict: ${analysis.investmentDecision?.verdict}`);
    console.log(`   Deal Quality Score: ${analysis.investmentDecision?.professionalAssessment?.dealQuality}/100`);
    console.log(`   Has Tax Analysis: ${!!analysis.investmentDecision?.taxAnalysis}`);
    console.log(`   Has Tax Optimization: ${!!analysis.investmentDecision?.professionalAssessment?.taxOptimization}`);

    if (analysis.investmentDecision?.taxAnalysis) {
      console.log('⚠️  Warning: Tax analysis was generated despite being deprecated');
    }

    return {
      success: true,
      verdict: analysis.investmentDecision?.verdict,
      dealQuality: analysis.investmentDecision?.professionalAssessment?.dealQuality,
      hasTax: !!analysis.investmentDecision?.taxAnalysis
    };
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    return { success: false };
  }
}

// Test 3: Verify consistent decisions
async function testConsistency() {
  console.log('\n📝 Test 3: Verifying decision consistency...');

  const result1 = await testWithoutTaxProfile();
  const result2 = await testWithTaxProfile();

  if (result1.success && result2.success) {
    const verdictMatch = result1.verdict === result2.verdict;
    const scoreMatch = Math.abs(result1.dealQuality - result2.dealQuality) < 1; // Allow minor rounding differences

    console.log('\n📊 Consistency Check:');
    console.log(`   Verdict Match: ${verdictMatch ? '✅' : '❌'} (${result1.verdict} vs ${result2.verdict})`);
    console.log(`   Deal Quality Match: ${scoreMatch ? '✅' : '❌'} (${result1.dealQuality} vs ${result2.dealQuality})`);
    console.log(`   Tax Analysis Present: Without=${result1.hasTax}, With=${result2.hasTax}`);

    if (verdictMatch && scoreMatch && !result1.hasTax && !result2.hasTax) {
      console.log('\n🎉 SUCCESS: Investment Decision Engine is completely isolated from tax analysis!');
      console.log('   - Decisions are consistent regardless of tax profile presence');
      console.log('   - Tax analysis is not being generated');
      console.log('   - Investment decisions are based purely on property fundamentals');
    } else {
      console.log('\n⚠️  WARNING: Some issues detected');
      if (!verdictMatch) console.log('   - Verdicts don\'t match');
      if (!scoreMatch) console.log('   - Deal quality scores don\'t match');
      if (result1.hasTax || result2.hasTax) console.log('   - Tax analysis is still being generated');
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testConsistency();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

runAllTests();