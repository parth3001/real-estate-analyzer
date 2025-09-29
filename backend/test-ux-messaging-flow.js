/**
 * UX Messaging Flow Test - Validates the new Tax Intelligence design
 *
 * Tests that the messaging follows the Product Designer's specifications:
 * 1. Primary: Strategic choice (Year 1 vs Year 10)
 * 2. Secondary: Tax implications
 * 3. Tertiary: Time commitment
 */

const axios = require('axios');

console.log('🎨 Testing UX Messaging Flow - Tax Intelligence Redesign\n');
console.log('Product Designer Requirements:');
console.log('  ✓ Clear strategic choice (Year 1 vs Optimal)');
console.log('  ✓ No confusing pre-tax/after-tax comparison');
console.log('  ✓ Tax impact as secondary context');
console.log('  ✓ Simple, layman-friendly messaging\n');

const testProperty = {
  address: "789 Design Test Dr, Austin, TX 78701",
  purchasePrice: 400000,
  downPayment: 80000,
  closingCosts: 6000,
  repairCosts: 15000,
  monthlyRent: 3200,
  propertyTax: 5000,
  insurance: 1400,
  vacancy: 5,
  maintenance: 3,
  capEx: 2,
  propertyManagement: 8,
  monthlyUtilities: 0,
  loanAmount: 320000,
  interestRate: 7.0,
  loanTerm: 30,
  // High tax bracket for negative tax savings scenario
  taxProfile: {
    federalTaxBracket: 35,
    stateTaxRate: 0,
    filingStatus: 'single',
    estimatedIncome: 300000
  },
  propertyAppreciation: 5, // High appreciation
  rentGrowth: 3,
  expenseInflation: 3
};

async function testUXMessaging() {
  try {
    console.log('📡 Sending analysis request...\n');
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
    const taxOptimization = analysis.investmentDecision.professionalAssessment?.taxOptimization;

    // Get Year 1 and Optimal analysis
    const year1Analysis = taxAnalysis.holdPeriodAnalysis[0];
    const optimalAnalysis = taxAnalysis.holdPeriodAnalysis.find(
      h => h.holdPeriod === taxAnalysis.optimalHoldPeriod
    );

    console.log('📊 UX MESSAGING VALIDATION:\n');

    console.log('1️⃣ PRIMARY: Strategic Choice');
    console.log(`   Year 1 Returns: ${(year1Analysis.afterTaxIRR * 100).toFixed(1)}%`);
    console.log(`   Year ${taxAnalysis.optimalHoldPeriod} Returns: ${(optimalAnalysis.afterTaxIRR * 100).toFixed(1)}%`);
    console.log(`   Return Advantage: ${((optimalAnalysis.afterTaxIRR - year1Analysis.afterTaxIRR) * 100).toFixed(1)} percentage points`);

    if (year1Analysis.afterTaxIRR < 0) {
      console.log('   ⚠️  Year 1 IRR is negative - this explains the "-9.4%" issue');
    } else {
      console.log('   ✅ Year 1 IRR is positive - good for comparison');
    }

    console.log('\n2️⃣ SECONDARY: Tax Impact Context');
    console.log(`   Tax Difference: $${Math.abs(taxAnalysis.totalTaxSavingsAtOptimal).toLocaleString()}`);
    if (taxAnalysis.totalTaxSavingsAtOptimal < 0) {
      console.log('   Type: Higher taxes at optimal period (due to appreciation)');
      console.log('   Context: But returns more than compensate for higher taxes');
    } else {
      console.log('   Type: Tax savings at optimal period');
      console.log('   Context: Better returns AND tax savings');
    }

    console.log('\n3️⃣ TERTIARY: Time Commitment');
    console.log(`   Hold Period: ${taxAnalysis.optimalHoldPeriod} years`);
    console.log(`   Strategy Type: ${taxAnalysis.optimalHoldPeriod > 3 ? 'Patient investor' : 'Quick opportunity'}`);

    console.log('\n📝 BOTTOM LINE MESSAGE:');
    console.log(`   "${taxOptimization?.primaryTaxInsight || 'No message found'}"`);

    // Validate messaging quality
    console.log('\n✅ UX VALIDATION CHECKS:');

    const checks = [
      {
        name: 'No confusing pre-tax comparison',
        pass: !taxOptimization?.primaryTaxInsight.includes('Before tax')
      },
      {
        name: 'Clear Year 1 vs Optimal comparison',
        pass: taxOptimization?.primaryTaxInsight.includes('Year 1') ||
              taxOptimization?.primaryTaxInsight.includes('sell in Year 1')
      },
      {
        name: 'No "save negative money" language',
        pass: !taxOptimization?.primaryTaxInsight.includes('save $-')
      },
      {
        name: 'Focus on returns not taxes',
        pass: taxOptimization?.primaryTaxInsight.includes('returns')
      }
    ];

    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const passedChecks = checks.filter(c => c.pass).length;
    console.log(`\n🎯 UX Score: ${passedChecks}/${checks.length} checks passed`);

    if (passedChecks === checks.length) {
      console.log('🎉 Perfect! UX messaging meets all Product Designer requirements');
    } else {
      console.log('⚠️  Some UX improvements still needed');
    }

    // Performance check
    console.log(`\n⚡ Performance: ${analysisTime}ms (Target: <10s)`);
    if (analysisTime < 10000) {
      console.log('✅ Performance target met');
    }

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${error.response.data?.error || error.response.data}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is the backend server running on localhost:5000?');
      console.error('\nTo run the backend server:');
      console.error('  cd backend');
      console.error('  npm run dev');
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

testUXMessaging();