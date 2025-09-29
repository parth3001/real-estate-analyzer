/**
 * Tax Calculation Debug Test
 * Principal Software Architect Investigation
 *
 * Purpose: Reproduce the exact negative tax savings issue
 * Target: -$49,854.828 as seen in logs
 */

const { TaxCalculationService } = require('./src/services/taxCalculationService');
const taxService = new TaxCalculationService();

async function debugTaxCalculation() {
  console.log('🔍 PRINCIPAL SOFTWARE ARCHITECT: Tax Calculation Debug Test');
  console.log('==========================================');

  // Simulate the property data that's causing the issue
  const propertyTaxData = {
    purchasePrice: 200000,
    closingCosts: 5000,
    repairCosts: 10000,
    capitalInvestments: 5000,
    yearlyProjections: [
      { year: 1, propertyValue: 220000, cashFlow: 5000, principalPaydown: 2000, depreciation: 5818 },
      { year: 2, propertyValue: 235000, cashFlow: 5200, principalPaydown: 2100, depreciation: 5818 },
      { year: 3, propertyValue: 250000, cashFlow: 5400, principalPaydown: 2200, depreciation: 5818 },
      { year: 5, propertyValue: 280000, cashFlow: 5800, principalPaydown: 2400, depreciation: 5818 },
      { year: 7, propertyValue: 310000, cashFlow: 6200, principalPaydown: 2600, depreciation: 5818 },
      { year: 10, propertyValue: 360000, cashFlow: 6800, principalPaydown: 2900, depreciation: 5818 }
    ]
  };

  // Tax profile similar to what's causing the issue
  const taxProfile = {
    filingStatus: 'single',
    state: 'TX', // No state tax
    federalTaxBracket: 24, // 24% marginal rate
    capitalGainsHoldingStrategy: 'optimize'
  };

  try {
    console.log('📊 Input Data:');
    console.log('- Purchase Price: $' + propertyTaxData.purchasePrice.toLocaleString());
    console.log('- Federal Tax Bracket: ' + taxProfile.federalTaxBracket + '%');
    console.log('- Filing Status: ' + taxProfile.filingStatus);
    console.log('- State: ' + taxProfile.state);
    console.log('');

    const result = await taxService.calculateTaxAnalysis(propertyTaxData, taxProfile);

    console.log('✅ CALCULATION COMPLETED');
    console.log('========================');
    console.log('🎯 Key Results:');
    console.log('- Optimal Hold Period: ' + result.optimalHoldPeriod + ' years');
    console.log('- Tax Savings vs Year 1: $' + result.totalTaxSavingsAtOptimal.toLocaleString());
    console.log('');

    // Detailed analysis of each hold period
    console.log('📋 HOLD PERIOD BREAKDOWN:');
    console.log('=========================');
    result.holdPeriodAnalysis.forEach(analysis => {
      console.log(`\n${analysis.holdPeriod} Year${analysis.holdPeriod !== 1 ? 's' : ''}:`);
      console.log(`  Sale Price: $${analysis.salePrice.toLocaleString()}`);
      console.log(`  Capital Gain: $${analysis.capitalGain.toLocaleString()}`);
      console.log(`  Federal Rate: ${(analysis.federalCapitalGainsRate * 100).toFixed(1)}%`);
      console.log(`  Total Tax: $${analysis.totalTaxLiability.toLocaleString()}`);
      console.log(`  After-tax IRR: ${(analysis.afterTaxIRR * 100).toFixed(2)}%`);
    });

    // Focus on the Year 1 vs Optimal comparison
    const year1Analysis = result.holdPeriodAnalysis[0];
    const optimalAnalysis = result.holdPeriodAnalysis.find(a => a.holdPeriod === result.optimalHoldPeriod);

    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('=======================');
    console.log(`Year 1 Tax: $${year1Analysis.totalTaxLiability.toFixed(2)}`);
    console.log(`Optimal Tax: $${optimalAnalysis.totalTaxLiability.toFixed(2)}`);
    console.log(`Tax Savings: $${(year1Analysis.totalTaxLiability - optimalAnalysis.totalTaxLiability).toFixed(2)}`);
    console.log('');

    console.log('🔍 TAX RATE COMPARISON:');
    console.log(`Year 1 (Short-term): ${(year1Analysis.federalCapitalGainsRate * 100).toFixed(1)}% federal`);
    console.log(`Optimal (Long-term): ${(optimalAnalysis.federalCapitalGainsRate * 100).toFixed(1)}% federal`);

    if (year1Analysis.federalCapitalGainsRate < optimalAnalysis.federalCapitalGainsRate) {
      console.log('');
      console.log('🚨 ARCHITECTURAL FLAW CONFIRMED:');
      console.log('Year 1 rate is LOWER than optimal rate - this violates tax law!');
      console.log('Short-term gains should be taxed higher than long-term gains.');
    }

  } catch (error) {
    console.log('❌ CALCULATION FAILED:');
    console.log('Error:', error.message);
    console.log('');

    // This means our validation is working - let's see the details
    if (error.message.includes('validation failed')) {
      console.log('✅ VALIDATION SYSTEM WORKING:');
      console.log('The system correctly detected unrealistic tax calculations');
      console.log('and blocked them from reaching the user.');
      console.log('');
      console.log('🎯 NEXT STEP: Fix the underlying tax rate calculation logic');
    }
  }
}

// Run the debug test
debugTaxCalculation();