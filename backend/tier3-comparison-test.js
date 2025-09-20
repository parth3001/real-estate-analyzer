/**
 * QE Engineer: Tier 3 Side-by-Side Comparison
 * Shows exact platform vs AI calculations for a sample property
 */

const { SFRAnalyzer } = require('./dist/analysis/SFRAnalyzer');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert assumptions
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

async function runSideBySideComparison() {
  console.log('🔬 QE ENGINEER: TIER 3 SIDE-BY-SIDE COMPARISON');
  console.log('=' .repeat(80));
  console.log('📊 Testing same property with Platform vs AI calculations\n');

  // Sample Property: Nashville Investment Property
  const testProperty = {
    propertyType: 'SFR',
    propertyName: 'Nashville Investment Property',
    propertyAddress: {
      street: '123 Music Row',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203'
    },
    purchasePrice: 300000,
    downPayment: 20, // 20% = $60,000 down
    interestRate: 7.0,
    loanTerm: 30,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    propertyManagementRate: 8,
    yearBuilt: 2020,
    monthlyRent: 2500,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 200,
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

  console.log('🏠 PROPERTY DETAILS:');
  console.log(`   Address: ${testProperty.propertyAddress.street}, ${testProperty.propertyAddress.city}, ${testProperty.propertyAddress.state}`);
  console.log(`   Purchase Price: $${testProperty.purchasePrice.toLocaleString()}`);
  console.log(`   Down Payment: ${testProperty.downPayment}% ($${(testProperty.purchasePrice * testProperty.downPayment / 100).toLocaleString()})`);
  console.log(`   Loan Amount: $${(testProperty.purchasePrice * (1 - testProperty.downPayment / 100)).toLocaleString()}`);
  console.log(`   Interest Rate: ${testProperty.interestRate}%`);
  console.log(`   Monthly Rent: $${testProperty.monthlyRent.toLocaleString()}`);
  console.log(`   Property Management: ${testProperty.propertyManagementRate}%`);
  console.log(`   Vacancy Rate: ${testProperty.longTermAssumptions.vacancyRate}%\n`);

  console.log('=' .repeat(80));
  console.log('🖥️  PLATFORM CALCULATION (SFRAnalyzer)');
  console.log('=' .repeat(80));

  // Get Platform Analysis
  const analyzer = new SFRAnalyzer(testProperty, convertToAnalysisAssumptions(testProperty.longTermAssumptions));
  const platformAnalysis = analyzer.analyze();

  console.log('\n📊 Platform Results:');
  console.log(`   Monthly Mortgage Payment: $${(platformAnalysis.monthlyAnalysis.expenses?.debt || 0).toFixed(2)}`);
  console.log(`   Monthly Property Tax: $${((testProperty.purchasePrice * testProperty.propertyTaxRate / 100) / 12).toFixed(2)}`);
  console.log(`   Monthly Insurance: $${((testProperty.purchasePrice * testProperty.insuranceRate / 100) / 12).toFixed(2)}`);
  console.log(`   Monthly Maintenance: $${testProperty.maintenanceCost.toFixed(2)}`);
  console.log(`   Monthly Property Mgmt: $${(testProperty.monthlyRent * testProperty.propertyManagementRate / 100).toFixed(2)}`);
  console.log(`   Effective Monthly Income: $${(testProperty.monthlyRent * (1 - testProperty.longTermAssumptions.vacancyRate / 100)).toFixed(2)}`);
  console.log(`   ----------------------------------------`);
  console.log(`   Cap Rate: ${(platformAnalysis.keyMetrics.capRate || 0).toFixed(2)}%`);
  console.log(`   Cash-on-Cash Return: ${(platformAnalysis.keyMetrics.cashOnCashReturn || 0).toFixed(2)}%`);
  console.log(`   Monthly Cash Flow: $${(platformAnalysis.monthlyAnalysis.cashFlow || 0).toFixed(2)}`);
  console.log(`   IRR: ${(platformAnalysis.keyMetrics.irr || 0).toFixed(2)}%`);
  console.log(`   DSCR: ${(platformAnalysis.keyMetrics.dscr || 0).toFixed(2)}x`);
  console.log(`   Investment Decision: ${platformAnalysis.investmentDecision?.verdict || 'N/A'}`);
  console.log(`   Deal Quality Score: ${platformAnalysis.investmentDecision?.dealQualityScore || 0}/100`);

  console.log('\n=' .repeat(80));
  console.log('🤖 AI CALCULATION (OpenAI GPT-4o-mini)');
  console.log('=' .repeat(80));

  // Prepare AI prompt
  const aiPrompt = `
You are a real estate financial analyst. Calculate these metrics for this investment property.

PROPERTY DETAILS:
- Purchase Price: $${testProperty.purchasePrice.toLocaleString()}
- Down Payment: ${testProperty.downPayment}% ($${(testProperty.purchasePrice * testProperty.downPayment / 100).toLocaleString()})
- Loan Amount: $${(testProperty.purchasePrice * (1 - testProperty.downPayment / 100)).toLocaleString()}
- Interest Rate: ${testProperty.interestRate}% annual
- Loan Term: ${testProperty.loanTerm} years
- Monthly Rent: $${testProperty.monthlyRent.toLocaleString()}

EXPENSES:
- Property Tax: ${testProperty.propertyTaxRate}% annually ($${(testProperty.purchasePrice * testProperty.propertyTaxRate / 100).toFixed(2)}/year)
- Insurance: ${testProperty.insuranceRate}% annually ($${(testProperty.purchasePrice * testProperty.insuranceRate / 100).toFixed(2)}/year)
- Property Management: ${testProperty.propertyManagementRate}% of gross rent
- Maintenance: $${testProperty.maintenanceCost}/month
- Closing Costs: $${testProperty.closingCosts}
- Vacancy Rate: ${testProperty.longTermAssumptions.vacancyRate}%

Please calculate:
1. Monthly mortgage payment using PMT formula
2. Cap Rate (NOI / Purchase Price × 100)
3. Cash-on-Cash Return (Annual Cash Flow / Total Cash Invested × 100)
4. Monthly Cash Flow
5. Investment verdict (BUY/NEGOTIATE/CAUTION/PASS)

Show your calculations step by step and return results in JSON format:
{
  "monthlyMortgagePayment": number,
  "monthlyPropertyTax": number,
  "monthlyInsurance": number,
  "monthlyMaintenance": number,
  "monthlyPropertyManagement": number,
  "effectiveMonthlyIncome": number,
  "capRate": number,
  "cashOnCashReturn": number,
  "monthlyCashFlow": number,
  "investmentRecommendation": "BUY/NEGOTIATE/CAUTION/PASS",
  "calculations": {
    "mortgageFormula": "string",
    "noiCalculation": "string",
    "capRateFormula": "string",
    "cashFlowBreakdown": "string"
  }
}
`;

  try {
    console.log('\n⏳ Requesting AI analysis...\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: aiPrompt }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse AI response
    let cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```/g, '');
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const aiResults = JSON.parse(jsonMatch[0]);

      console.log('📊 AI Results:');
      console.log(`   Monthly Mortgage Payment: $${(aiResults.monthlyMortgagePayment || 0).toFixed(2)}`);
      console.log(`   Monthly Property Tax: $${(aiResults.monthlyPropertyTax || 0).toFixed(2)}`);
      console.log(`   Monthly Insurance: $${(aiResults.monthlyInsurance || 0).toFixed(2)}`);
      console.log(`   Monthly Maintenance: $${(aiResults.monthlyMaintenance || 0).toFixed(2)}`);
      console.log(`   Monthly Property Mgmt: $${(aiResults.monthlyPropertyManagement || 0).toFixed(2)}`);
      console.log(`   Effective Monthly Income: $${(aiResults.effectiveMonthlyIncome || 0).toFixed(2)}`);
      console.log(`   ----------------------------------------`);
      console.log(`   Cap Rate: ${(aiResults.capRate || 0).toFixed(2)}%`);
      console.log(`   Cash-on-Cash Return: ${(aiResults.cashOnCashReturn || 0).toFixed(2)}%`);
      console.log(`   Monthly Cash Flow: $${(aiResults.monthlyCashFlow || 0).toFixed(2)}`);
      console.log(`   Investment Recommendation: ${aiResults.investmentRecommendation || 'N/A'}`);

      console.log('\n=' .repeat(80));
      console.log('📊 SIDE-BY-SIDE COMPARISON');
      console.log('=' .repeat(80));

      console.log('\n| Metric                  | Platform Result | AI Result      | Difference |');
      console.log('|-------------------------|-----------------|----------------|------------|');

      // Monthly Mortgage
      const mortgageDiff = Math.abs((platformAnalysis.monthlyAnalysis.expenses?.debt || 0) - (aiResults.monthlyMortgagePayment || 0));
      console.log(`| Monthly Mortgage        | $${(platformAnalysis.monthlyAnalysis.expenses?.debt || 0).toFixed(2).padEnd(13)} | $${(aiResults.monthlyMortgagePayment || 0).toFixed(2).padEnd(12)} | $${mortgageDiff.toFixed(2).padEnd(9)} |`);

      // Cap Rate
      const capRateDiff = Math.abs((platformAnalysis.keyMetrics.capRate || 0) - (aiResults.capRate || 0));
      console.log(`| Cap Rate                | ${(platformAnalysis.keyMetrics.capRate || 0).toFixed(2).padEnd(13)}% | ${(aiResults.capRate || 0).toFixed(2).padEnd(12)}% | ${capRateDiff.toFixed(2).padEnd(9)}% |`);

      // Cash-on-Cash
      const cocDiff = Math.abs((platformAnalysis.keyMetrics.cashOnCashReturn || 0) - (aiResults.cashOnCashReturn || 0));
      console.log(`| Cash-on-Cash Return     | ${(platformAnalysis.keyMetrics.cashOnCashReturn || 0).toFixed(2).padEnd(13)}% | ${(aiResults.cashOnCashReturn || 0).toFixed(2).padEnd(12)}% | ${cocDiff.toFixed(2).padEnd(9)}% |`);

      // Monthly Cash Flow
      const cashFlowDiff = Math.abs((platformAnalysis.monthlyAnalysis.cashFlow || 0) - (aiResults.monthlyCashFlow || 0));
      console.log(`| Monthly Cash Flow       | $${(platformAnalysis.monthlyAnalysis.cashFlow || 0).toFixed(2).padEnd(13)} | $${(aiResults.monthlyCashFlow || 0).toFixed(2).padEnd(12)} | $${cashFlowDiff.toFixed(2).padEnd(9)} |`);

      // Investment Decision
      const verdictMatch = (platformAnalysis.investmentDecision?.verdict === aiResults.investmentRecommendation) ? '✅ MATCH' : '❌ DIFFER';
      console.log(`| Investment Decision     | ${(platformAnalysis.investmentDecision?.verdict || 'N/A').padEnd(15)} | ${(aiResults.investmentRecommendation || 'N/A').padEnd(14)} | ${verdictMatch.padEnd(10)} |`);

      console.log('\n=' .repeat(80));
      console.log('🎯 VALIDATION SUMMARY');
      console.log('=' .repeat(80));

      // Calculate validation scores
      const tolerances = {
        mortgage: 10, // $10 tolerance
        capRate: 0.5, // 0.5% tolerance
        cashOnCash: 2.0, // 2% tolerance
        cashFlow: 50, // $50 tolerance
      };

      let validationScore = 0;
      const totalMetrics = 4;

      if (mortgageDiff <= tolerances.mortgage) {
        console.log(`✅ Monthly Mortgage: Within tolerance ($${mortgageDiff.toFixed(2)} ≤ $${tolerances.mortgage})`);
        validationScore++;
      } else {
        console.log(`❌ Monthly Mortgage: Outside tolerance ($${mortgageDiff.toFixed(2)} > $${tolerances.mortgage})`);
      }

      if (capRateDiff <= tolerances.capRate) {
        console.log(`✅ Cap Rate: Within tolerance (${capRateDiff.toFixed(2)}% ≤ ${tolerances.capRate}%)`);
        validationScore++;
      } else {
        console.log(`❌ Cap Rate: Outside tolerance (${capRateDiff.toFixed(2)}% > ${tolerances.capRate}%)`);
      }

      if (cocDiff <= tolerances.cashOnCash) {
        console.log(`✅ Cash-on-Cash: Within tolerance (${cocDiff.toFixed(2)}% ≤ ${tolerances.cashOnCash}%)`);
        validationScore++;
      } else {
        console.log(`❌ Cash-on-Cash: Outside tolerance (${cocDiff.toFixed(2)}% > ${tolerances.cashOnCash}%)`);
      }

      if (cashFlowDiff <= tolerances.cashFlow) {
        console.log(`✅ Monthly Cash Flow: Within tolerance ($${cashFlowDiff.toFixed(2)} ≤ $${tolerances.cashFlow})`);
        validationScore++;
      } else {
        console.log(`❌ Monthly Cash Flow: Outside tolerance ($${cashFlowDiff.toFixed(2)} > $${tolerances.cashFlow})`);
      }

      const validationPercentage = (validationScore / totalMetrics) * 100;
      console.log(`\n📊 Overall Validation Score: ${validationScore}/${totalMetrics} metrics (${validationPercentage.toFixed(1)}%)`);
      console.log(`🏆 Tier 3 Validation: ${validationPercentage >= 75 ? '✅ PASS' : '❌ FAIL'} (75% threshold)`);

      // Show AI calculation details if available
      if (aiResults.calculations) {
        console.log('\n=' .repeat(80));
        console.log('🤖 AI CALCULATION DETAILS');
        console.log('=' .repeat(80));
        console.log('Mortgage Formula:', aiResults.calculations.mortgageFormula || 'N/A');
        console.log('NOI Calculation:', aiResults.calculations.noiCalculation || 'N/A');
        console.log('Cap Rate Formula:', aiResults.calculations.capRateFormula || 'N/A');
        console.log('Cash Flow Breakdown:', aiResults.calculations.cashFlowBreakdown || 'N/A');
      }

    } else {
      console.log('❌ Failed to parse AI response');
    }

  } catch (error) {
    console.error('❌ AI Analysis Error:', error.message);
  }

  console.log('\n=' .repeat(80));
  console.log('🔚 TIER 3 SIDE-BY-SIDE COMPARISON COMPLETE');
  console.log('=' .repeat(80));
}

// Run the comparison
if (require.main === module) {
  runSideBySideComparison()
    .then(() => {
      console.log('\n✅ Comparison test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}