const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { OpenAI } = require('openai');

// Initialize OpenAI client if API key is available
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  logger.warn('OpenAI API key not configured. AI insights will not be available.');
}

// Multi-family property analysis endpoint
router.post('/analyze/multifamily', async (req, res) => {
  try {
    const formData = req.body;
    logger.info('Received multi-family analysis request:', { data: formData });

    // Calculate key metrics
    const results = calculateMultiFamilyMetrics(formData);
    
    // Get AI analysis if OpenAI is configured
    if (openai) {
      try {
        const aiAnalysis = await getMultiFamilyAIAnalysis(formData, results);
        results.aiAnalysis = aiAnalysis;
        logger.info('AI analysis completed for multi-family property');
      } catch (aiError) {
        logger.error('Error getting AI analysis:', aiError);
        results.aiAnalysis = {
          summary: "Error generating AI analysis. Please try again later.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          investmentScore: null
        };
      }
    } else {
      results.aiAnalysis = {
        summary: "AI analysis not available. Please configure OpenAI API key.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        investmentScore: null
      };
    }
    
    logger.info('Multi-family analysis completed successfully');
    res.json(results);
  } catch (error) {
    logger.error('Error in multi-family analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to get AI analysis for a multi-family property
async function getMultiFamilyAIAnalysis(formData, results) {
  try {
    // Format all the required data for the AI prompt
    const monthlyMortgage = results.monthlyMortgagePayment;
    const annualMortgage = monthlyMortgage * 12;
    const downPaymentPercent = (formData.downPayment / formData.purchasePrice * 100).toFixed(2);
    const grossRentMultiplier = formData.purchasePrice / results.grossPotentialRent;
    const vacancyRatePercent = (formData.vacancyRate || 5).toFixed(2);

    // Unit mix data
    const unitMixDescription = formData.unitTypes.map(unit => 
      `${unit.count}x ${unit.type} (${unit.sqft} sqft) at $${unit.monthlyRent}/month`
    ).join(', ');

    // Construct the AI prompt
    const prompt = `
    Analyze this multi-family real estate investment deal with the following details:

    PROPERTY DETAILS:
    - Address: ${formData.propertyAddress || ''}, ${formData.propertyCity || ''}, ${formData.propertyState || ''} ${formData.propertyZip || ''}
    - Type: Multi-Family Property
    - Total Units: ${formData.totalUnits || 'N/A'}
    - Total Square Feet: ${formData.totalSqft || 'N/A'}
    - Year Built: ${formData.yearBuilt || 'N/A'}
    - Unit Mix: ${unitMixDescription}

    FINANCIAL DETAILS:
    - Purchase Price: $${formData.purchasePrice || 'N/A'}
    - Down Payment: $${formData.downPayment || 'N/A'} (${downPaymentPercent}%)
    - Price Per Unit: $${results.pricePerUnit ? results.pricePerUnit.toFixed(0) : 'N/A'}
    - Price Per Square Foot: $${results.pricePerSqft ? results.pricePerSqft.toFixed(2) : 'N/A'}
    - Loan Amount: $${formData.loanAmount || 'N/A'}
    - Interest Rate: ${formData.interestRate || 'N/A'}%
    - Loan Term: ${formData.loanTerm || 'N/A'} years
    - Monthly Mortgage Payment: $${monthlyMortgage ? monthlyMortgage.toFixed(2) : 'N/A'}

    INCOME:
    - Gross Potential Rent: $${results.grossPotentialRent ? results.grossPotentialRent.toFixed(0) : 'N/A'}/year
    - Vacancy Rate: ${vacancyRatePercent}%
    - Effective Gross Income: $${results.effectiveGrossIncome ? results.effectiveGrossIncome.toFixed(0) : 'N/A'}/year

    EXPENSES:
    - Property Taxes: $${results.propertyTaxExpense ? results.propertyTaxExpense.toFixed(0) : 'N/A'}/year
    - Insurance: $${results.insuranceExpense ? results.insuranceExpense.toFixed(0) : 'N/A'}/year
    - Property Management: $${results.propertyManagementExpense ? results.propertyManagementExpense.toFixed(0) : 'N/A'}/year (${formData.propertyManagement || 'N/A'}%)
    - Repairs & Maintenance: $${results.repairsMaintenanceExpense ? results.repairsMaintenanceExpense.toFixed(0) : 'N/A'}/year
    - Capital Expenditures: $${results.capExExpense ? results.capExExpense.toFixed(0) : 'N/A'}/year
    - Utilities (Common Areas): $${(results.waterSewerExpense || 0) + (results.garbageExpense || 0) + (results.commonElectricityExpense || 0)}/year
    - Total Operating Expenses: $${results.operatingExpenses ? results.operatingExpenses.toFixed(0) : 'N/A'}/year
    - Expense Ratio: ${results.expenseRatio ? results.expenseRatio.toFixed(2) : 'N/A'}%

    CASH FLOW:
    - Net Operating Income (NOI): $${results.noi ? results.noi.toFixed(0) : 'N/A'}/year
    - Annual Debt Service: $${annualMortgage ? annualMortgage.toFixed(0) : 'N/A'}/year
    - Monthly Cash Flow: $${results.monthlyCashFlow ? results.monthlyCashFlow.toFixed(0) : 'N/A'}/month
    - Annual Cash Flow: $${results.annualCashFlow && results.annualCashFlow.length > 0 ? results.annualCashFlow[0].toFixed(0) : 'N/A'}/year
    - Cash Flow Per Unit: $${results.cashFlowPerUnit ? results.cashFlowPerUnit.toFixed(0) : 'N/A'}/unit/year

    RETURNS:
    - Cap Rate: ${results.capRate ? results.capRate.toFixed(2) : 'N/A'}%
    - Cash on Cash Return: ${results.cashOnCashReturn ? results.cashOnCashReturn.toFixed(2) : 'N/A'}%
    - Internal Rate of Return (IRR): ${results.irr ? results.irr.toFixed(2) : 'N/A'}%
    - 5-Year ROI: ${results.fiveYearROI ? results.fiveYearROI.toFixed(2) : 'N/A'}%
    - Debt Service Coverage Ratio: ${results.debtServiceCoverageRatio ? results.debtServiceCoverageRatio.toFixed(2) : 'N/A'}
    - Gross Rent Multiplier: ${grossRentMultiplier ? grossRentMultiplier.toFixed(2) : 'N/A'}

    ASSUMPTIONS:
    - Vacancy Rate: ${formData.vacancyRate || 5}%
    - Annual Rent Growth: ${formData.annualRentGrowth || 3}%
    - Annual Expense Growth: ${formData.annualExpenseGrowth || 2}%
    - Annual Property Value Growth: ${formData.annualPropertyValueGrowth || 3}%
    - Holding Period: ${formData.holdingPeriod || 5} years
    - Selling Costs: ${formData.sellingCosts || 6}%
    - Broker Commission: ${formData.brokerCommission || 50}% of first month's rent

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "summary": "2-3 sentences overall summary of the multi-family investment",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "unitMixAnalysis": "1-2 sentences analyzing if the unit mix is optimal",
      "marketPositionAnalysis": "1-2 sentences about the property's positioning in the market",
      "valueAddOpportunities": ["opportunity1", "opportunity2"],
      "investmentScore": 0-100 score with 100 being excellent,
      "recommendedHoldPeriod": "recommendation on how long to hold this property"
    }

    The analysis should focus on the multi-family specific dynamics, financial viability, potential risks, and opportunities for improvement. Be specific, data-driven, and actionable in your recommendations. Pay special attention to unit mix optimization, property management strategies, and value-add opportunities specific to multi-family properties.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo for faster response time
      messages: [
        {
          role: "system",
          content: "You are a multi-family real estate investment expert and financial analyst. Your job is to analyze multi-family property deals and provide concise, actionable insights to investors. Your analysis should be data-driven, honest, and include specific recommendations tailored to multi-family properties."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    // Parse the JSON response
    const aiResponse = JSON.parse(response.choices[0].message.content);
    
    // Ensure all required fields are present
    return {
      summary: aiResponse.summary || "No summary provided",
      strengths: aiResponse.strengths || [],
      weaknesses: aiResponse.weaknesses || [],
      recommendations: aiResponse.recommendations || [],
      unitMixAnalysis: aiResponse.unitMixAnalysis || "No unit mix analysis provided",
      marketPositionAnalysis: aiResponse.marketPositionAnalysis || "No market position analysis provided",
      valueAddOpportunities: aiResponse.valueAddOpportunities || [],
      investmentScore: aiResponse.investmentScore || null,
      recommendedHoldPeriod: aiResponse.recommendedHoldPeriod || "No hold period recommendation provided"
    };
  } catch (error) {
    logger.error('Error getting multi-family AI analysis:', error);
    throw error;
  }
}

// Function to calculate multi-family property metrics
function calculateMultiFamilyMetrics(data) {
  // Destructure the form data
  const {
    purchasePrice,
    downPayment,
    closingCosts,
    loanAmount,
    interestRate,
    loanTerm,
    propertyTaxRate,
    propertyInsurance,
    repairsAndMaintenance,
    landscaping,
    propertyManagement,
    capEx,
    waterSewer,
    garbage,
    commonAreaElectricity,
    marketingAndAdvertising,
    otherExpenses,
    vacancyRate,
    annualRentGrowth,
    annualExpenseGrowth,
    annualPropertyValueGrowth,
    holdingPeriod,
    sellingCosts,
    totalUnits,
    unitTypes,
    totalGrossRent,
    totalSqft,
  } = data;

  // Convert to numbers where needed
  const purchasePriceNum = Number(purchasePrice) || 0;
  const downPaymentNum = Number(downPayment) || 0;
  const closingCostsNum = Number(closingCosts) || 0;
  const loanAmountNum = Number(loanAmount) || 0;
  const interestRateNum = Number(interestRate) || 0;
  const loanTermNum = Number(loanTerm) || 30;
  const propertyTaxRateNum = Number(propertyTaxRate) || 0;
  const propertyInsuranceNum = Number(propertyInsurance) || 0;
  const repairsAndMaintenanceNum = Number(repairsAndMaintenance) || 0;
  const landscapingNum = Number(landscaping) || 0;
  const propertyManagementNum = Number(propertyManagement) || 0;
  const capExNum = Number(capEx) || 0;
  const waterSewerNum = Number(waterSewer) || 0;
  const garbageNum = Number(garbage) || 0;
  const commonAreaElectricityNum = Number(commonAreaElectricity) || 0;
  const marketingAndAdvertisingNum = Number(marketingAndAdvertising) || 0;
  const otherExpensesNum = Number(otherExpenses) || 0;
  const vacancyRateNum = Number(vacancyRate) || 5;
  const annualRentGrowthNum = Number(annualRentGrowth) || 3;
  const annualExpenseGrowthNum = Number(annualExpenseGrowth) || 2;
  const annualPropertyValueGrowthNum = Number(annualPropertyValueGrowth) || 3;
  const holdingPeriodNum = Number(holdingPeriod) || 5;
  const sellingCostsNum = Number(sellingCosts) || 6;
  const totalUnitsNum = Number(totalUnits) || 0;
  const totalSqftNum = Number(totalSqft) || 0;

  // Calculate total investment
  const totalInvestment = downPaymentNum + closingCostsNum;

  // Calculate gross potential rent
  const grossPotentialRent = totalGrossRent || 
    unitTypes.reduce((sum, unit) => sum + (Number(unit.monthlyRent) * Number(unit.count) || 0), 0) * 12;

  // Calculate vacancy loss
  const vacancyLoss = grossPotentialRent * (vacancyRateNum / 100);

  // Calculate effective gross income
  const effectiveGrossIncome = grossPotentialRent - vacancyLoss;

  // Calculate property tax
  const propertyTaxExpense = purchasePriceNum * (propertyTaxRateNum / 100);

  // Calculate property management expense
  const propertyManagementExpense = effectiveGrossIncome * (propertyManagementNum / 100);

  // Sum all operating expenses
  const operatingExpenses = 
    propertyTaxExpense +
    propertyInsuranceNum +
    repairsAndMaintenanceNum +
    landscapingNum +
    propertyManagementExpense +
    capExNum +
    waterSewerNum +
    garbageNum +
    commonAreaElectricityNum +
    marketingAndAdvertisingNum +
    otherExpensesNum;

  // Calculate NOI (Net Operating Income)
  const noi = effectiveGrossIncome - operatingExpenses;

  // Calculate mortgage payment
  const monthlyInterestRate = interestRateNum / 100 / 12;
  const numberOfPayments = loanTermNum * 12;
  
  let monthlyMortgagePayment = 0;
  if (monthlyInterestRate > 0) {
    monthlyMortgagePayment = loanAmountNum * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  } else {
    monthlyMortgagePayment = loanAmountNum / numberOfPayments;
  }
  
  const annualDebtService = monthlyMortgagePayment * 12;

  // Calculate cash flow
  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;
  const cashFlowPerUnit = totalUnitsNum > 0 ? annualCashFlow / totalUnitsNum : 0;

  // Calculate returns
  const capRate = purchasePriceNum > 0 ? (noi / purchasePriceNum) * 100 : 0;
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
  
  // Calculate price metrics
  const pricePerUnit = totalUnitsNum > 0 ? purchasePriceNum / totalUnitsNum : 0;
  const pricePerSqft = totalSqftNum > 0 ? purchasePriceNum / totalSqftNum : 0;

  // Calculate expense ratio
  const expenseRatio = effectiveGrossIncome > 0 ? (operatingExpenses / effectiveGrossIncome) * 100 : 0;

  // Calculate Debt Service Coverage Ratio
  const debtServiceCoverageRatio = annualDebtService > 0 ? noi / annualDebtService : 0;

  // Calculate Gross Rent Multiplier
  const grossRentMultiplier = grossPotentialRent > 0 ? purchasePriceNum / grossPotentialRent : 0;

  // Calculate break-even occupancy
  const breakEvenOccupancy = grossPotentialRent > 0 ? 
    ((operatingExpenses + annualDebtService) / grossPotentialRent) * 100 : 0;

  // Calculate future projections
  const annualCashFlowProjection = [];
  let cumulativeCashFlow = 0;
  let currentPropertyValue = purchasePriceNum;
  let currentLoanBalance = loanAmountNum;
  let currentRent = grossPotentialRent;
  let currentExpenses = operatingExpenses;

  for (let year = 1; year <= holdingPeriodNum; year++) {
    // Increase rent by growth rate
    currentRent *= (1 + annualRentGrowthNum / 100);
    
    // Increase expenses by growth rate
    currentExpenses *= (1 + annualExpenseGrowthNum / 100);
    
    // Calculate vacancy loss for this year
    const yearlyVacancyLoss = currentRent * (vacancyRateNum / 100);
    
    // Calculate effective gross income for this year
    const yearlyEffectiveGrossIncome = currentRent - yearlyVacancyLoss;
    
    // Calculate NOI for this year
    const yearlyNOI = yearlyEffectiveGrossIncome - currentExpenses;
    
    // Annual cash flow remains the same (mortgage payment is fixed)
    const yearlyCashFlow = yearlyNOI - annualDebtService;
    
    // Add to cumulative cash flow
    cumulativeCashFlow += yearlyCashFlow;
    
    // Increase property value by growth rate
    currentPropertyValue *= (1 + annualPropertyValueGrowthNum / 100);
    
    // Calculate remaining loan balance
    if (year < loanTermNum) {
      const interestPaid = currentLoanBalance * (interestRateNum / 100);
      const principalPaid = annualDebtService - interestPaid;
      currentLoanBalance -= principalPaid;
      if (currentLoanBalance < 0) currentLoanBalance = 0;
    } else {
      currentLoanBalance = 0;
    }
    
    // Add this year's cash flow to the projection
    annualCashFlowProjection.push(yearlyCashFlow);
  }

  // Calculate 5-year ROI
  const projectedFiveYearValue = currentPropertyValue;
  const projectedFiveYearEquity = projectedFiveYearValue - currentLoanBalance;
  const sellingCostsAmount = projectedFiveYearValue * (sellingCostsNum / 100);
  const netProceedsFromSale = projectedFiveYearEquity - sellingCostsAmount;
  const totalReturn = cumulativeCashFlow + netProceedsFromSale - totalInvestment;
  const fiveYearROI = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
  
  // Calculate annual ROI
  const annualROI = fiveYearROI > 0 ? Math.pow(1 + fiveYearROI / 100, 1/holdingPeriodNum) - 1 : 0;
  const annualROIPercent = annualROI * 100;

  // Calculate IRR (simplified approach)
  const cashFlows = [-totalInvestment, ...annualCashFlowProjection];
  cashFlows[cashFlows.length - 1] += netProceedsFromSale;
  
  // Simple IRR estimation using bisection method
  let irr = estimateIRR(cashFlows);

  // Prepare unit breakdown data
  const unitBreakdown = unitTypes.map(unit => ({
    type: unit.type,
    count: Number(unit.count) || 0,
    monthlyRent: Number(unit.monthlyRent) || 0,
    annualIncome: (Number(unit.monthlyRent) || 0) * (Number(unit.count) || 0) * 12,
  }));

  // Return the analysis results
  return {
    // Property details
    purchasePrice: purchasePriceNum,
    downPayment: downPaymentNum,
    loanAmount: loanAmountNum,
    totalUnits: totalUnitsNum,
    totalSqft: totalSqftNum,
    pricePerUnit,
    pricePerSqft,
    
    // Income
    grossPotentialRent,
    vacancyLoss,
    effectiveGrossIncome,
    
    // Expenses
    operatingExpenses,
    propertyManagementExpense,
    propertyTaxExpense,
    insuranceExpense: propertyInsuranceNum,
    repairsMaintenanceExpense: repairsAndMaintenanceNum,
    capExExpense: capExNum,
    waterSewerExpense: waterSewerNum,
    garbageExpense: garbageNum,
    commonElectricityExpense: commonAreaElectricityNum,
    otherExpenses: otherExpensesNum,
    expenseRatio,
    
    // Cash Flow
    noi,
    annualDebtService,
    monthlyCashFlow,
    annualCashFlow: annualCashFlowProjection,
    cashFlowPerUnit,
    
    // Returns
    capRate,
    cashOnCashReturn,
    annualROI: annualROIPercent,
    fiveYearROI,
    irr: irr * 100,
    
    // Mortgage
    monthlyMortgagePayment,
    totalInvestment,
    
    // Additional metrics
    debtServiceCoverageRatio,
    grossRentMultiplier,
    projectedFiveYearValue,
    projectedFiveYearEquity,
    breakEvenOccupancy,
    
    // Unit breakdown
    unitBreakdown,
  };
}

// Helper function to estimate IRR using bisection method
function estimateIRR(cashFlows) {
  // Guard against invalid inputs
  if (!cashFlows || cashFlows.length < 2) return 0;
  
  // Simple check if project is profitable
  const totalSum = cashFlows.reduce((sum, flow) => sum + flow, 0);
  if (totalSum <= 0) return 0; // Not profitable
  
  const PRECISION = 0.0001;
  const MAX_ITERATIONS = 100;
  
  // Initial guesses
  let lowerRate = -0.99; // -99%
  let upperRate = 0.99;  // 99%
  
  // Check if the lower bound has the right sign
  const npvLower = calculateNPV(cashFlows, lowerRate);
  
  // If NPV at lower rate is positive, use a different approach
  if (npvLower > 0) {
    return estimateIRRPositive(cashFlows);
  }
  
  // Bisection method
  let guess;
  let npvAtGuess;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    guess = (lowerRate + upperRate) / 2;
    npvAtGuess = calculateNPV(cashFlows, guess);
    
    if (Math.abs(npvAtGuess) < PRECISION) {
      return guess;
    }
    
    if (npvAtGuess > 0) {
      lowerRate = guess;
    } else {
      upperRate = guess;
    }
    
    // Check for convergence
    if (Math.abs(upperRate - lowerRate) < PRECISION) {
      return guess;
    }
  }
  
  // If we couldn't converge, return the best guess
  return guess;
}

// Alternative IRR calculation for positive NPV at lower rate
function estimateIRRPositive(cashFlows) {
  const totalReturn = cashFlows.reduce((sum, flow) => sum + flow, 0);
  const initialInvestment = -cashFlows[0]; // Assuming first cash flow is negative
  
  if (initialInvestment <= 0) return 0.1; // Default to 10% if no initial investment
  
  const simpleROI = (totalReturn / initialInvestment) - 1;
  const years = cashFlows.length - 1;
  
  // Simplified annual return calculation
  return Math.pow(1 + simpleROI, 1/years) - 1;
}

// Calculate Net Present Value
function calculateNPV(cashFlows, rate) {
  return cashFlows.reduce((npv, flow, index) => npv + flow / Math.pow(1 + rate, index), 0);
}

module.exports = router; 