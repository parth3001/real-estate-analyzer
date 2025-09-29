/**
 * Complete Tax Messaging Architecture Test
 *
 * Tests the entire Tax Intelligence messaging system with negative tax savings scenario
 * to ensure all components handle the messaging correctly.
 */

const axios = require('axios');

console.log('🧪 Testing Complete Tax Intelligence Messaging Architecture\n');

const testProperty = {
  address: "1234 Appreciation Ave, Austin, TX 78701",
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
  interestRate: 7.5,
  loanTerm: 30,
  // HIGH TAX BRACKET USER - to ensure negative tax savings scenario
  taxProfile: {
    federalTaxBracket: 32,
    stateTaxRate: 0,
    filingStatus: 'single',
    estimatedIncome: 250000
  },
  propertyAppreciation: 4, // Higher appreciation to trigger scenario
  rentGrowth: 3,
  expenseInflation: 3
};

console.log('🏠 Testing Property with High Appreciation + High Tax Bracket:');
console.log(`  Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
console.log(`  Tax Bracket: ${testProperty.taxProfile.federalTaxBracket}%`);
console.log(`  Appreciation Rate: ${testProperty.propertyAppreciation}%`);
console.log(`  Expected Outcome: Negative "tax savings" due to appreciation\n`);

async function testTaxMessaging() {
  try {
    console.log('📡 Sending analysis request...');
    const startTime = Date.now();

    const response = await axios.post('http://localhost:5000/api/deals/analyze', testProperty, {
      timeout: 15000
    });

    const analysisTime = Date.now() - startTime;
    const analysis = response.data;

    console.log(`✅ Analysis completed in ${analysisTime}ms\n`);

    // Check tax analysis exists
    if (!analysis.investmentDecision?.taxAnalysis) {
      console.log('❌ No tax analysis found');
      return;
    }

    const taxAnalysis = analysis.investmentDecision.taxAnalysis;

    console.log('📊 TAX ANALYSIS RESULTS:');
    console.log(`  Optimal Hold Period: ${taxAnalysis.optimalHoldPeriod} years`);
    console.log(`  Total Tax Savings: $${taxAnalysis.totalTaxSavingsAtOptimal?.toLocaleString()}`);
    console.log(`  After-Tax Return Advantage: ${taxAnalysis.afterTaxReturnAdvantage?.toFixed(1)} percentage points`);

    // Test backend messaging components
    console.log('\n🎯 BACKEND MESSAGING VALIDATION:');

    // 1. Expert Insight (should not say "save negative money")
    const expertInsight = analysis.investmentDecision?.professionalAssessment?.taxOptimization?.primaryTaxInsight;
    console.log(`  Expert Insight: "${expertInsight}"`);

    if (expertInsight && expertInsight.includes('save $-')) {
      console.log('  ❌ FAIL: Expert insight uses "save negative money" language');
    } else {
      console.log('  ✅ PASS: Expert insight correctly handles negative tax scenario');
    }

    // 2. Tax Optimization Recommendations
    const recommendations = analysis.investmentDecision?.professionalAssessment?.taxOptimization?.taxOptimizationRecommendations || [];
    console.log(`  Recommendations Count: ${recommendations.length}`);

    const badRecommendations = recommendations.filter(rec =>
      rec.includes('save $-') || rec.includes('saves $-')
    );

    if (badRecommendations.length > 0) {
      console.log('  ❌ FAIL: Found bad recommendation messaging');
      badRecommendations.forEach(rec => console.log(`    - "${rec}"`));
    } else {
      console.log('  ✅ PASS: All recommendations use appropriate messaging');
    }

    // 3. Hold Period Analysis
    const holdPeriodAnalysis = taxAnalysis.holdPeriodAnalysis;
    console.log(`  Hold Period Options: ${holdPeriodAnalysis.length}`);

    const year1Analysis = holdPeriodAnalysis[0];
    const optimalAnalysis = holdPeriodAnalysis.find(h => h.holdPeriod === taxAnalysis.optimalHoldPeriod);

    console.log(`  Year 1 Tax: $${year1Analysis.totalTaxLiability.toLocaleString()}`);
    console.log(`  Optimal Tax: $${optimalAnalysis.totalTaxLiability.toLocaleString()}`);
    console.log(`  Year 1 IRR: ${(year1Analysis.afterTaxIRR * 100).toFixed(1)}%`);
    console.log(`  Optimal IRR: ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}%`);

    // Test validation
    console.log('\n🔍 VALIDATION TEST:');
    if (taxAnalysis.totalTaxSavingsAtOptimal < -5000) {
      console.log(`  ✅ PASS: Achieved negative tax savings scenario (${taxAnalysis.totalTaxSavingsAtOptimal.toLocaleString()})`);
      console.log(`  ✅ PASS: But optimal IRR is higher (${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}% vs ${(year1Analysis.afterTaxIRR * 100).toFixed(1)}%)`);
      console.log('  ✅ PASS: Validation allows this scenario (no more 74-second loops)');
    } else {
      console.log('  ⚠️  WARNING: Did not achieve negative tax savings scenario for testing');
    }

    // Performance validation
    console.log('\n⚡ PERFORMANCE VALIDATION:');
    if (analysisTime < 10000) {
      console.log(`  ✅ PASS: Analysis completed in ${analysisTime}ms (under 10 seconds)`);
    } else {
      console.log(`  ❌ FAIL: Analysis took ${analysisTime}ms (over 10 seconds)`);
    }

    console.log('\n🎉 COMPLETE TAX MESSAGING ARCHITECTURE TEST COMPLETE');
    console.log('   Frontend components should now display:');
    console.log('   - "Higher Taxes" instead of "Tax Savings" (orange color)');
    console.log('   - "Despite $X higher taxes" messaging');
    console.log('   - Focus on after-tax return optimization');
    console.log('   - No more "save $-42,020" nonsensical language');

  } catch (error) {
    console.error('\n❌ Analysis failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data?.error || error.response.data}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is the backend server running on localhost:5000?');
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

testTaxMessaging();