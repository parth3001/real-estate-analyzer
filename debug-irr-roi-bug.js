/**
 * Debug script to investigate IRR vs ROI calculation discrepancy
 * User reports: Total ROI 1.48% vs IRR 8.51%
 */

const { SFRAnalyzer } = require('./backend/dist/analysis/SFRAnalyzer');

console.log('🔍 DEBUGGING IRR vs ROI CALCULATION DISCREPANCY\n');
console.log('=' .repeat(60));

// Create test property that might produce negative cash flow with positive IRR
const testProperty = {
  purchasePrice: 250000,
  downPayment: 50000,
  interestRate: 7.0,
  loanTerm: 30,
  monthlyRent: 2000,
  closingCosts: 5000,
  
  // Operating expenses
  propertyTaxRate: 1.2,
  insuranceRate: 0.4,
  maintenanceCost: 2000,
  propertyManagementRate: 8,
  
  propertyAddress: {
    city: 'Memphis',
    state: 'TN'
  }
};

const assumptions = {
  vacancyRate: 5,
  annualRentIncrease: 3,
  annualExpenseIncrease: 2.5, // MISSING FIELD - causing NaN in projections!
  annualPropertyValueIncrease: 3,
  sellingCosts: 6,
  projectionYears: 10
};

try {
  console.log('📊 Test Property Data:');
  console.log(`  Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
  console.log(`  Down Payment: $${testProperty.downPayment.toLocaleString()}`);
  console.log(`  Monthly Rent: $${testProperty.monthlyRent.toLocaleString()}`);
  console.log(`  Interest Rate: ${testProperty.interestRate}%`);
  console.log(`  Projection Years: ${assumptions.projectionYears} years\n`);

  const analyzer = new SFRAnalyzer(testProperty, assumptions);
  const result = analyzer.analyze();

  console.log('📈 KEY METRICS COMPARISON:');
  console.log('=' .repeat(40));
  console.log(`IRR (from keyMetrics):     ${(result.keyMetrics.irr).toFixed(2)}%`);
  console.log(`Total ROI (from exit):     ${result.exitAnalysis.returnOnInvestment.toFixed(2)}%`);
  console.log(`Monthly Cash Flow:         $${result.monthlyAnalysis.cashFlow.toFixed(0)}`);
  console.log(`Annual Cash Flow:          $${(result.monthlyAnalysis.cashFlow * 12).toFixed(0)}`);

  console.log('\n💰 EXIT ANALYSIS BREAKDOWN:');
  console.log('=' .repeat(40));
  console.log(`Projected Sale Price:      $${result.exitAnalysis.projectedSalePrice.toLocaleString()}`);
  console.log(`Selling Costs:             -$${result.exitAnalysis.sellingCosts.toLocaleString()}`);
  console.log(`Mortgage Payoff:           -$${result.exitAnalysis.mortgagePayoff.toLocaleString()}`);
  console.log(`Net Proceeds from Sale:    $${result.exitAnalysis.netProceedsFromSale.toLocaleString()}`);
  console.log(`Total Return:              $${result.exitAnalysis.totalReturn.toLocaleString()}`);
  
  // Calculate the investment components
  const totalInvestment = testProperty.downPayment + (testProperty.closingCosts || 0);
  console.log(`\nTotal Investment:          $${totalInvestment.toLocaleString()}`);
  
  // Show the Total ROI calculation
  const calculatedROI = (result.exitAnalysis.totalReturn / totalInvestment) * 100;
  console.log(`Calculated ROI:            ${calculatedROI.toFixed(2)}% (${result.exitAnalysis.totalReturn.toLocaleString()} / ${totalInvestment.toLocaleString()})`);

  console.log('\n🔄 IRR CALCULATION COMPONENTS:');
  console.log('=' .repeat(40));
  
  // Show year-by-year projections to understand the cash flows
  if (result.projections && result.projections.length > 0) {
    console.log('Year-by-Year Cash Flows:');
    console.log(`Year 0 (Initial):          -$${totalInvestment.toLocaleString()}`);
    
    result.projections.forEach((projection, index) => {
      console.log(`Year ${index + 1}:                   $${projection.cashFlow.toLocaleString()}`);
    });
    
    console.log(`Year ${result.projections.length} (Exit):      +$${result.exitAnalysis.netProceedsFromSale.toLocaleString()}`);
    
    // Calculate total cash flows for verification
    const totalCashFlows = result.projections.reduce((sum, p) => sum + p.cashFlow, 0);
    console.log(`\nTotal Annual Cash Flows:   $${totalCashFlows.toLocaleString()}`);
    console.log(`Exit Proceeds:             $${result.exitAnalysis.netProceedsFromSale.toLocaleString()}`);
    console.log(`Total Inflows:             $${(totalCashFlows + result.exitAnalysis.netProceedsFromSale).toLocaleString()}`);
    console.log(`Net Gain:                  $${(totalCashFlows + result.exitAnalysis.netProceedsFromSale - totalInvestment).toLocaleString()}`);
  }

  console.log('\n🎯 ANALYSIS CONCLUSION:');
  console.log('=' .repeat(40));
  
  if (result.keyMetrics.irr > result.exitAnalysis.returnOnInvestment) {
    console.log('✅ IRR > Total ROI: This is NORMAL for negative/low cash flow properties');
    console.log('   → IRR accounts for TIME VALUE of money');
    console.log('   → Total ROI is simple: (Total Return / Investment) * 100');
    console.log('   → IRR shows annualized return considering when cash flows occur');
  } else {
    console.log('⚠️  Total ROI > IRR: This suggests positive cash flow throughout');
  }
  
  if (result.monthlyAnalysis.cashFlow < 0) {
    console.log('🔴 Negative Cash Flow: Property requires monthly contributions');
    console.log('   → IRR can still be positive due to appreciation and exit proceeds');
    console.log('   → Total ROI reflects the overall profit over the entire period');
  }

} catch (error) {
  console.error('❌ Error running IRR/ROI debug analysis:', error.message);
  console.error(error.stack);
}