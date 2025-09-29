/**
 * Quick Test: Verify Tax Savings Calculation Fix
 *
 * Tests the critical bug fix for negative tax savings values
 * Root Cause: Line 334 had calculation backwards (optimalTax - year1Tax instead of year1Tax - optimalTax)
 */

const { taxCalculationService } = require('./src/services/taxCalculationService');

async function testTaxSavingsFix() {
  console.log('🧪 TESTING: Tax Savings Calculation Fix');
  console.log('=' .repeat(60));

  try {
    // Test with realistic property data that should show positive tax savings
    const propertyTaxData = {
      purchasePrice: 300000,
      closingCosts: 6000,
      repairCosts: 0,
      capitalInvestments: 0,
      yearlyProjections: [
        { year: 1, propertyValue: 315000, cashFlow: 6000, principalPaydown: 3000, depreciation: 8727 },
        { year: 2, propertyValue: 330000, cashFlow: 6500, principalPaydown: 3200, depreciation: 8727 },
        { year: 3, propertyValue: 346000, cashFlow: 7000, principalPaydown: 3400, depreciation: 8727 },
        { year: 5, propertyValue: 382000, cashFlow: 8000, principalPaydown: 3800, depreciation: 8727 },
        { year: 7, propertyValue: 422000, cashFlow: 9000, principalPaydown: 4200, depreciation: 8727 },
        { year: 10, propertyValue: 487000, cashFlow: 10500, principalPaydown: 4800, depreciation: 8727 }
      ]
    };

    const taxProfile = {
      filingStatus: 'married_joint',
      state: 'TX', // No state capital gains tax
      capitalGainsHoldingStrategy: 'long_term',
      depreciation: {
        method: 'straight_line',
        personalUsePercentage: 0
      },
      investorType: 'individual'
    };

    console.log('📊 INPUT DATA:');
    console.log(`Purchase Price: $${propertyTaxData.purchasePrice.toLocaleString()}`);
    console.log(`Tax Profile: ${taxProfile.filingStatus}, ${taxProfile.state}, ${taxProfile.capitalGainsHoldingStrategy}`);
    console.log();

    console.log('🔄 Running Tax Analysis...');
    const result = await taxCalculationService.calculateTaxAnalysis(propertyTaxData, taxProfile);

    // Extract key results
    const year1Analysis = result.holdPeriodAnalysis.find(h => h.holdPeriod === 1);
    const optimalAnalysis = result.holdPeriodAnalysis.find(h => h.holdPeriod === result.optimalHoldPeriod);

    console.log();
    console.log('📈 TAX ANALYSIS RESULTS:');
    console.log('─' .repeat(40));
    console.log(`Optimal Hold Period: ${result.optimalHoldPeriod} years`);
    console.log();
    console.log(`Year 1 Analysis:`);
    console.log(`  Sale Price: $${year1Analysis.salePrice.toLocaleString()}`);
    console.log(`  Capital Gain: $${year1Analysis.capitalGain.toLocaleString()}`);
    console.log(`  Total Tax Liability: $${year1Analysis.totalTaxLiability.toLocaleString()}`);
    console.log(`  After-tax IRR: ${(year1Analysis.afterTaxIRR * 100).toFixed(2)}%`);
    console.log();
    console.log(`Optimal Period Analysis (${result.optimalHoldPeriod} years):`);
    console.log(`  Sale Price: $${optimalAnalysis.salePrice.toLocaleString()}`);
    console.log(`  Capital Gain: $${optimalAnalysis.capitalGain.toLocaleString()}`);
    console.log(`  Total Tax Liability: $${optimalAnalysis.totalTaxLiability.toLocaleString()}`);
    console.log(`  After-tax IRR: ${(optimalAnalysis.afterTaxIRR * 100).toFixed(2)}%`);
    console.log();

    // The critical test - tax savings should be POSITIVE
    console.log('🎯 CRITICAL TEST - Tax Savings Calculation:');
    console.log('─' .repeat(40));
    console.log(`Year 1 Tax: $${year1Analysis.totalTaxLiability.toLocaleString()}`);
    console.log(`Optimal Tax: $${optimalAnalysis.totalTaxLiability.toLocaleString()}`);
    console.log(`Calculation: $${year1Analysis.totalTaxLiability.toLocaleString()} - $${optimalAnalysis.totalTaxLiability.toLocaleString()}`);
    console.log(`Tax Savings: $${result.totalTaxSavingsAtOptimal.toLocaleString()}`);
    console.log();

    // Validation
    if (result.totalTaxSavingsAtOptimal >= 0) {
      console.log('✅ SUCCESS: Tax savings is POSITIVE (fix worked!)');
      console.log(`💰 Holding ${result.optimalHoldPeriod} years saves $${result.totalTaxSavingsAtOptimal.toLocaleString()}`);
    } else {
      console.log('❌ FAILURE: Tax savings is still NEGATIVE');
      console.log(`🚨 This indicates the fix may not have resolved the issue`);
    }

    console.log();
    console.log('📋 TAX OPTIMIZATION RECOMMENDATIONS:');
    result.taxOptimizationRecommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    console.log();
    console.log('🏁 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testTaxSavingsFix();