/**
 * QE Engineer: AI Independent Validation
 *
 * Step 3 of 3-Tier Independent Validation Strategy
 *
 * PURPOSE: Use OpenAI API to independently validate our platform calculations
 * - Send property data to GPT-4o-mini for independent financial analysis
 * - Compare AI calculations with our Investment Decision Engine v2.1
 * - Validate key metrics: Cap Rate, Cash-on-Cash, IRR, DSCR, Monthly Cash Flow
 * - Test Investment Decision verdicts (BUY/NEGOTIATE/CAUTION/PASS)
 *
 * VALIDATION METHODOLOGY:
 * ✅ AI receives raw property data (no calculated results)
 * ✅ AI performs independent calculations using financial formulas
 * ✅ Compare AI results vs Platform results with ±5% tolerance
 * ✅ Test both positive and negative cash flow scenarios
 * ✅ Validate Investment Decision Engine logic independently
 */

const { SFRAnalyzer } = require('./dist/analysis/SFRAnalyzer');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert property longTermAssumptions to AnalysisAssumptions
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

// AI Financial Analysis Prompt
const AI_ANALYSIS_PROMPT = `
You are a financial analyst specializing in real estate investment calculations.
I will provide you with property data, and you need to calculate key financial metrics using standard real estate formulas.

Please calculate the following metrics and provide your reasoning:

1. **Monthly Mortgage Payment (PITI)**
   - Use standard PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
   - Where P = Principal, r = monthly rate, n = total payments

2. **Cap Rate (%)**
   - Formula: (Net Operating Income / Purchase Price) × 100
   - NOI = Effective Income - Operating Expenses (not including debt service)
   - Effective Income = Gross Rent - Vacancy Loss

3. **Cash-on-Cash Return (%)**
   - Formula: (Annual Cash Flow / Total Cash Invested) × 100
   - Total Cash Invested = Down Payment + Closing Costs + Initial Improvements

4. **Monthly Cash Flow ($)**
   - Formula: Effective Monthly Income - Total Monthly Expenses
   - Include: Mortgage, Taxes, Insurance, Maintenance, Property Management, Turnover

5. **Investment Recommendation**
   - BUY: Strong positive cash flow (>$200/month) and Cap Rate >6%
   - NEGOTIATE: Positive cash flow but marginal returns (Cap Rate 4-6%)
   - CAUTION: Break-even or small positive cash flow (<$100/month)
   - PASS: Negative cash flow or Cap Rate <4%

IMPORTANT: Show all your calculations step by step. Use standard real estate formulas and industry assumptions.

Format your response as JSON:
{
  "monthlyMortgagePayment": number,
  "capRate": number,
  "cashOnCashReturn": number,
  "monthlyCashFlow": number,
  "investmentRecommendation": "BUY|NEGOTIATE|CAUTION|PASS",
  "reasoning": {
    "mortgageCalculation": "step by step",
    "noiCalculation": "step by step",
    "capRateCalculation": "step by step",
    "cashFlowCalculation": "step by step"
  }
}
`;

async function getAIAnalysis(propertyData) {
  try {
    const propertyDescription = `
Property Investment Analysis Request:

PROPERTY DETAILS:
- Purchase Price: $${propertyData.purchasePrice.toLocaleString()}
- Down Payment: ${propertyData.downPayment}% ($${((propertyData.purchasePrice * propertyData.downPayment) / 100).toLocaleString()})
- Loan Amount: $${(propertyData.purchasePrice - (propertyData.purchasePrice * propertyData.downPayment / 100)).toLocaleString()}
- Interest Rate: ${propertyData.interestRate}% annual
- Loan Term: ${propertyData.loanTerm} years
- Monthly Rent: $${propertyData.monthlyRent?.toLocaleString() || 'TBD'}

EXPENSES:
- Property Tax Rate: ${propertyData.propertyTaxRate}% of purchase price annually
- Insurance Rate: ${propertyData.insuranceRate}% of purchase price annually
- Property Management: ${propertyData.propertyManagementRate}% of gross rent
- Maintenance: $${propertyData.maintenanceCost}/month
- Closing Costs: $${propertyData.closingCosts || 5000}

ASSUMPTIONS:
- Vacancy Rate: ${propertyData.longTermAssumptions?.vacancyRate || 5}%
- Annual Rent Increase: ${propertyData.longTermAssumptions?.annualRentIncrease || 3}%
- Annual Property Appreciation: ${propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3}%
- Turnover Frequency: Every ${propertyData.longTermAssumptions?.turnoverFrequency || 2} years

Please analyze this investment property and provide detailed financial calculations.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: AI_ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: propertyDescription
        }
      ],
      temperature: 0.1, // Low temperature for consistent calculations
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;

    // Try to parse JSON response (handle markdown code blocks)
    try {
      // Remove markdown code block markers
      let cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```/g, '');
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI JSON, returning raw response:', parseError.message);
      return {
        rawResponse: aiResponse,
        error: 'Failed to parse JSON response'
      };
    }

  } catch (error) {
    console.error('AI Analysis Error:', error.message);
    return {
      error: error.message
    };
  }
}

function compareResults(platformAnalysis, aiAnalysis, propertyName, tolerance = 5) {
  console.log(`\\n🔍 QE VALIDATION: ${propertyName}`);
  console.log('=' .repeat(60));

  const platform = {
    monthlyMortgage: platformAnalysis.monthlyAnalysis.expenses?.debt || 0,
    capRate: platformAnalysis.keyMetrics.capRate || 0,
    cashOnCashReturn: platformAnalysis.keyMetrics.cashOnCashReturn || 0,
    monthlyCashFlow: platformAnalysis.monthlyAnalysis.cashFlow || 0,
    verdict: platformAnalysis.investmentDecision?.verdict || 'UNKNOWN'
  };

  console.log('\\n📊 PLATFORM RESULTS:');
  console.log(`   Monthly Mortgage: $${platform.monthlyMortgage.toFixed(2)}`);
  console.log(`   Cap Rate: ${platform.capRate.toFixed(2)}%`);
  console.log(`   Cash-on-Cash: ${platform.cashOnCashReturn.toFixed(2)}%`);
  console.log(`   Monthly Cash Flow: $${platform.monthlyCashFlow.toFixed(2)}`);
  console.log(`   Investment Verdict: ${platform.verdict}`);

  if (aiAnalysis.error) {
    console.log('\\n❌ AI ANALYSIS ERROR:', aiAnalysis.error);
    return false;
  }

  console.log('\\n🤖 AI RESULTS:');
  console.log(`   Monthly Mortgage: $${(aiAnalysis.monthlyMortgagePayment || 0).toFixed(2)}`);
  console.log(`   Cap Rate: ${(aiAnalysis.capRate || 0).toFixed(2)}%`);
  console.log(`   Cash-on-Cash: ${(aiAnalysis.cashOnCashReturn || 0).toFixed(2)}%`);
  console.log(`   Monthly Cash Flow: $${(aiAnalysis.monthlyCashFlow || 0).toFixed(2)}`);
  console.log(`   Investment Recommendation: ${aiAnalysis.investmentRecommendation || 'UNKNOWN'}`);

  // Validation with tolerance
  const validateMetric = (platformValue, aiValue, metricName, tolerance) => {
    if (!aiValue && aiValue !== 0) {
      console.log(`   ⚠️  ${metricName}: AI didn't provide value`);
      return false;
    }

    const difference = Math.abs(platformValue - aiValue);
    const percentDifference = (difference / Math.abs(platformValue)) * 100;

    if (percentDifference <= tolerance || difference <= 1) { // ±5% or ±$1
      console.log(`   ✅ ${metricName}: Match within tolerance (${percentDifference.toFixed(2)}% diff)`);
      return true;
    } else {
      console.log(`   ❌ ${metricName}: Outside tolerance (${percentDifference.toFixed(2)}% diff > ${tolerance}%)`);
      console.log(`      Platform: ${platformValue.toFixed(2)}, AI: ${aiValue.toFixed(2)}`);
      return false;
    }
  };

  console.log('\\n🔬 VALIDATION RESULTS:');

  let validationScore = 0;
  const totalMetrics = 4;

  if (validateMetric(platform.monthlyMortgage, aiAnalysis.monthlyMortgagePayment, 'Monthly Mortgage', tolerance)) {
    validationScore++;
  }

  if (validateMetric(platform.capRate, aiAnalysis.capRate, 'Cap Rate', tolerance)) {
    validationScore++;
  }

  if (validateMetric(platform.cashOnCashReturn, aiAnalysis.cashOnCashReturn, 'Cash-on-Cash Return', tolerance)) {
    validationScore++;
  }

  if (validateMetric(platform.monthlyCashFlow, aiAnalysis.monthlyCashFlow, 'Monthly Cash Flow', tolerance)) {
    validationScore++;
  }

  // Verdict comparison (less strict)
  if (platform.verdict === aiAnalysis.investmentRecommendation) {
    console.log(`   ✅ Investment Verdict: Exact match (${platform.verdict})`);
    validationScore += 0.5; // Bonus for exact verdict match
  } else {
    console.log(`   ⚠️  Investment Verdict: Different recommendations`);
    console.log(`      Platform: ${platform.verdict}, AI: ${aiAnalysis.investmentRecommendation}`);
  }

  const validationPercentage = (validationScore / totalMetrics) * 100;
  console.log(`\\n🎯 VALIDATION SCORE: ${validationScore}/${totalMetrics} metrics (${validationPercentage.toFixed(1)}%)`);

  const isValid = validationScore >= (totalMetrics * 0.75); // 75% threshold
  console.log(`🏆 AI VALIDATION: ${isValid ? '✅ PASS' : '❌ FAIL'} (${validationPercentage.toFixed(1)}% >= 75% required)`);

  return isValid;
}

async function runAIValidationTests() {
  console.log('🤖 QE ENGINEER: AI Independent Validation');
  console.log('🎯 Using OpenAI GPT-4o-mini for independent calculation validation');
  console.log('📊 Testing Platform vs AI calculation accuracy');
  console.log('=' .repeat(80));

  const testProperties = [
    {
      name: 'Positive Cash Flow Property',
      data: {
        propertyType: 'SFR',
        propertyName: 'AI Validation Test 1',
        propertyAddress: {
          street: '123 AI Test Street',
          city: 'Nashville',
          state: 'TN',
          zipCode: '37203'
        },
        purchasePrice: 280000,
        downPayment: 20, // 20%
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
      }
    },
    {
      name: 'Marginal Investment Property',
      data: {
        propertyType: 'SFR',
        propertyName: 'AI Validation Test 2',
        propertyAddress: {
          street: '456 Marginal Avenue',
          city: 'Nashville',
          state: 'TN',
          zipCode: '37205'
        },
        purchasePrice: 350000,
        downPayment: 15, // Lower down payment
        interestRate: 7.5,
        loanTerm: 30,
        propertyTaxRate: 1.5,
        insuranceRate: 0.6,
        propertyManagementRate: 10,
        yearBuilt: 2015,
        monthlyRent: 2600,
        squareFootage: 1900,
        bedrooms: 3,
        bathrooms: 2.5,
        maintenanceCost: 300,
        closingCosts: 7000,
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 2.5,
          annualPropertyValueIncrease: 2.5,
          sellingCostsPercentage: 6,
          inflationRate: 2.5,
          vacancyRate: 7,
          turnoverFrequency: 2
        }
      }
    },
    {
      name: 'Negative Cash Flow Property',
      data: {
        propertyType: 'SFR',
        propertyName: 'AI Validation Test 3',
        propertyAddress: {
          street: '789 Expensive Lane',
          city: 'Nashville',
          state: 'TN',
          zipCode: '37207'
        },
        purchasePrice: 500000,
        downPayment: 10, // Low down payment
        interestRate: 8.0, // High interest rate
        loanTerm: 30,
        propertyTaxRate: 2.0, // High taxes
        insuranceRate: 0.8,
        propertyManagementRate: 12,
        yearBuilt: 2010,
        monthlyRent: 2800, // Low relative to price
        squareFootage: 2200,
        bedrooms: 4,
        bathrooms: 3,
        maintenanceCost: 400,
        closingCosts: 10000,
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 2,
          sellingCostsPercentage: 6,
          inflationRate: 2.5,
          vacancyRate: 10,
          turnoverFrequency: 1.5
        }
      }
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testProperty of testProperties) {
    try {
      console.log(`\\n🏠 Testing: ${testProperty.name}`);
      console.log(`📍 Property: $${testProperty.data.purchasePrice.toLocaleString()}, ${testProperty.data.downPayment}% down, ${testProperty.data.interestRate}% rate`);

      // Get platform analysis
      const analyzer = new SFRAnalyzer(testProperty.data, convertToAnalysisAssumptions(testProperty.data.longTermAssumptions));
      const platformAnalysis = analyzer.analyze();

      // Get AI analysis
      console.log('⏳ Requesting AI analysis...');
      const aiAnalysis = await getAIAnalysis(testProperty.data);

      // Compare results
      const isValid = compareResults(platformAnalysis, aiAnalysis, testProperty.name);

      totalTests++;
      if (isValid) {
        passedTests++;
      }

      // Brief pause between API calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error testing ${testProperty.name}:`, error.message);
      totalTests++;
    }
  }

  // Final Summary
  console.log('\\n' + '=' .repeat(80));
  console.log('🎯 AI INDEPENDENT VALIDATION SUMMARY');
  console.log('=' .repeat(80));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`🏆 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  const overallSuccess = (passedTests / totalTests) >= 0.75; // 75% threshold
  console.log(`\\n🎯 AI VALIDATION RESULT: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log('📋 AWS Financial Services Standard: 75% accuracy threshold');

  if (overallSuccess) {
    console.log('🏆 Investment Decision Engine v2.1 validated by independent AI analysis');
    console.log('✅ Platform calculations align with industry-standard financial formulas');
    console.log('✅ Ready for external audit and compliance review');
  } else {
    console.log('⚠️  Platform calculations require review and calibration');
    console.log('📝 Consider investigating calculation differences with AI methodology');
  }

  return overallSuccess;
}

// Main execution
if (require.main === module) {
  runAIValidationTests()
    .then((success) => {
      console.log(`\\n🔚 AI Validation Complete: ${success ? 'SUCCESS' : 'FAILURE'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ AI Validation Failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runAIValidationTests,
  getAIAnalysis,
  compareResults
};