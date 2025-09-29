/**
 * Test: Tax Calculation Fixes Validation
 *
 * Validates both critical fixes:
 * 1. Capital gains holding period logic (<=1 year = short-term rates)
 * 2. Tax savings calculations (should be positive)
 */

const { taxCalculationService } = require('./src/services/taxCalculationService');

async function testTaxCalculationFixes() {
  console.log('🧪 TESTING: Tax Calculation Fixes Validation');
  console.log('=' .repeat(60));

  try {
    // Test data that should show the fixes working
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
      state: 'TX', // No state tax
      capitalGainsHoldingStrategy: 'long_term',
      depreciation: {
        method: 'straight_line',
        personalUsePercentage: 0
      },
      investorType: 'individual'
    };

    console.log('🔄 Running Tax Analysis with Fixes...');
    const result = await taxCalculationService.calculateTaxAnalysis(propertyTaxData, taxProfile);

    console.log();
    console.log('📊 TAX CALCULATION RESULTS:');
    console.log('─' .repeat(40));

    // Test Fix #1: Capital Gains Holding Period Logic
    const year1Analysis = result.holdPeriodAnalysis.find(h => h.holdPeriod === 1);
    const year2Analysis = result.holdPeriodAnalysis.find(h => h.holdPeriod === 2);

    console.log('🎯 FIX #1 TEST: Capital Gains Holding Period Logic');
    console.log(`Year 1 Capital Gains Rate: ${(year1Analysis.federalCapitalGainsRate * 100).toFixed(1)}%`);
    console.log(`Year 2 Capital Gains Rate: ${(year2Analysis.federalCapitalGainsRate * 100).toFixed(1)}%`);

    if (year1Analysis.federalCapitalGainsRate > year2Analysis.federalCapitalGainsRate) {
      console.log('✅ PASS: Year 1 uses higher short-term rates, Year 2+ uses lower long-term rates');
    } else {
      console.log('❌ FAIL: Capital gains rates should be higher for year 1 (short-term)');
    }

    console.log();

    // Test Fix #2: Tax Savings Should Be Positive
    console.log('🎯 FIX #2 TEST: Tax Savings Calculation');
    console.log(`Year 1 Total Tax: $${year1Analysis.totalTaxLiability.toLocaleString()}`);
    console.log(`Optimal (${result.optimalHoldPeriod} yr) Tax: $${result.holdPeriodAnalysis.find(h => h.holdPeriod === result.optimalHoldPeriod).totalTaxLiability.toLocaleString()}`);
    console.log(`Total Tax Savings: $${result.totalTaxSavingsAtOptimal.toLocaleString()}`);

    if (result.totalTaxSavingsAtOptimal >= 0) {
      console.log('✅ PASS: Tax savings are positive (or zero)');
    } else {
      console.log('❌ FAIL: Tax savings are still negative');
    }

    console.log();
    console.log('📈 ANALYSIS SUMMARY:');
    console.log(`Optimal Hold Period: ${result.optimalHoldPeriod} years`);
    console.log(`Tax Savings vs Year 1: $${result.totalTaxSavingsAtOptimal.toLocaleString()}`);
    console.log(`Recommendation Count: ${result.taxOptimizationRecommendations.length}`);

    console.log();
    console.log('💡 TAX OPTIMIZATION RECOMMENDATIONS:');
    result.taxOptimizationRecommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    console.log();
    console.log('🎉 Tax calculation fixes validation completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.message.includes('validation failed')) {
      console.log('🔍 This suggests the fixes may need additional work');
    }
  }
}

testTaxCalculationFixes();