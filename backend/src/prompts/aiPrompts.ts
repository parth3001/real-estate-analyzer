// AI prompt templates for property analysis

export function sfrAnalysisPrompt(dealData: any, analysis: any): string {
  // Existing metric calculations
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
  const annualCashFlow = (analysis?.monthlyAnalysis?.cashFlow ?? 0) * 12;
  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
  const capRate = analysis?.annualAnalysis?.capRate ?? (analysis?.metrics?.capRate ?? 0);
  const cashOnCashReturn = analysis?.annualAnalysis?.cashOnCashReturn ?? (analysis?.metrics?.cashOnCashReturn ?? 0);
  
  // Add new metrics to the prompt
  const expenseRatio = analysis?.keyMetrics?.operatingExpenseRatio ?? 0;
  const breakEvenOccupancy = analysis?.keyMetrics?.breakEvenOccupancy ?? 0;
  const grossRentMultiplier = analysis?.keyMetrics?.grossRentMultiplier ?? 0;
  const onePercentRuleValue = analysis?.keyMetrics?.onePercentRuleValue ?? 0;
  const fiftyRuleAnalysis = analysis?.keyMetrics?.fiftyRuleAnalysis ?? false;
  const rentToPriceRatio = analysis?.keyMetrics?.rentToPriceRatio ?? 0;
  const pricePerBedroom = analysis?.keyMetrics?.pricePerBedroom ?? 0;
  const equityMultiple = analysis?.keyMetrics?.equityMultiple ?? 0;
  const debtToIncomeRatio = analysis?.keyMetrics?.debtToIncomeRatio ?? 0;
  
  // Extract info from sensitivity analysis if available
  const bestCaseCashFlow = analysis?.sensitivityAnalysis?.bestCase?.cashFlow ?? (annualCashFlow * 1.1);
  const worstCaseCashFlow = analysis?.sensitivityAnalysis?.worstCase?.cashFlow ?? (annualCashFlow * 0.9);
  
  // Extract exit analysis data
  const exitAnalysis = analysis?.longTermAnalysis?.exitAnalysis || {};
  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
  const projectedSalePrice = exitAnalysis.projectedSalePrice || 0;
  const sellingCosts = exitAnalysis.sellingCosts || 0;
  const mortgagePayoff = exitAnalysis.mortgagePayoff || 0;
  const netProceedsFromSale = exitAnalysis.netProceedsFromSale || 0;
  const totalReturn = exitAnalysis.totalReturn || 0;
  const returnOnInvestment = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
  
  // Calculate property age
  const currentYear = new Date().getFullYear();
  const propertyAge = dealData.yearBuilt ? currentYear - dealData.yearBuilt : null;
  
  // Calculate potential value-add metrics
  const avgPricePerSqFt = dealData.squareFootage > 0 ? dealData.purchasePrice / dealData.squareFootage : 0;
  const potentialRentIncrease = dealData.monthlyRent * 0.1; // Assume 10% potential increase with improvements
  
  // Extract Census data if available
  const censusData = dealData.censusData || {};
  const censusInsights = dealData.censusInsights || {};
  
  // Census data metrics
  const medianHomeValue = censusData.housing?.medianHomeValue;
  const medianRent = censusData.housing?.medianRent;
  const medianIncome = censusData.income?.medianHouseholdIncome;
  const vacancyRate = censusData.housing?.vacancyRate;
  const totalPopulation = censusData.demographics?.totalPopulation;
  
  // Census insights
  const valueComparison = censusInsights.valueComparison;
  const rentComparison = censusInsights.rentComparison;
  const affordabilityIndex = censusInsights.affordabilityIndex;
  const investmentContext = censusInsights.investmentContext;

  return `Analyze this single-family rental property investment:

PROPERTY DETAILS:
- Purchase Price: $${dealData.purchasePrice}
- Down Payment: $${dealData.downPayment} (${downPaymentPercent.toFixed(1)}%)
- Monthly Rent: $${dealData.monthlyRent}
- Property Type: Single Family Residential
- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
- Square Footage: ${dealData.squareFootage || 'N/A'}
- Bedrooms: ${dealData.bedrooms || 'N/A'}
- Bathrooms: ${dealData.bathrooms || 'N/A'}
- Price per Bedroom: $${pricePerBedroom.toFixed(2)}
- Price per Square Foot: $${avgPricePerSqFt.toFixed(2)}
- Location: ${dealData.propertyAddress?.city || 'N/A'}, ${dealData.propertyAddress?.state || 'N/A'}

FINANCIAL METRICS:
- Monthly NOI: $${monthlyNOI.toFixed(2)}
- Monthly Cash Flow: $${(analysis?.monthlyAnalysis?.cashFlow ?? 0).toFixed(2)}
- Annual Cash Flow: $${annualCashFlow.toFixed(2)}
- Total Investment: $${totalInvestment.toFixed(2)}
- DSCR (Debt Service Coverage Ratio): ${dscr.toFixed(2)}
- Cap Rate: ${capRate.toFixed(2)}%
- Cash on Cash Return: ${cashOnCashReturn.toFixed(2)}%
- IRR (if available): ${analysis?.keyMetrics?.irr ? analysis.keyMetrics.irr.toFixed(2) + '%' : 'N/A'}

RISK METRICS:
- Expense Ratio: ${expenseRatio.toFixed(2)}% (operating expenses as % of income)
- Break-Even Occupancy: ${breakEvenOccupancy.toFixed(2)}% (min. occupancy needed to break even)
- Debt-to-Income Ratio: ${debtToIncomeRatio.toFixed(2)}%
- Best Case Annual Cash Flow: $${bestCaseCashFlow.toFixed(2)}
- Worst Case Annual Cash Flow: $${worstCaseCashFlow.toFixed(2)}

INVESTMENT RULES OF THUMB:
- 1% Rule: ${onePercentRuleValue.toFixed(2)}% (goal: 1% or higher)
- 50% Rule Analysis: ${fiftyRuleAnalysis ? 'PASS' : 'FAIL'} (expenses ≤ 50% of income)
- Gross Rent Multiplier: ${grossRentMultiplier.toFixed(2)} (lower is better)
- Rent-to-Price Ratio: ${rentToPriceRatio.toFixed(2)}%
- Equity Multiple: ${equityMultiple.toFixed(2)}x (total return / initial investment)

${medianHomeValue || medianRent || medianIncome ? `
CENSUS DATA (MARKET CONTEXT):
${medianHomeValue ? `- Area Median Home Value: $${medianHomeValue.toLocaleString()}` : ''}
${medianRent ? `- Area Median Monthly Rent: $${medianRent.toLocaleString()}` : ''}
${medianIncome ? `- Area Median Household Income: $${medianIncome.toLocaleString()}` : ''}
${vacancyRate ? `- Area Vacancy Rate: ${(vacancyRate * 100).toFixed(1)}%` : ''}
${totalPopulation ? `- Area Population: ${totalPopulation.toLocaleString()}` : ''}
` : ''}

${valueComparison || rentComparison || affordabilityIndex ? `
MARKET COMPARISONS:
${valueComparison ? `- Property Value vs. Area Median: ${valueComparison.relativeToMedian ? (valueComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${valueComparison.percentageDifference ? (valueComparison.percentageDifference > 0 ? '+' : '') + valueComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${rentComparison ? `- Rent vs. Area Median: ${rentComparison.relativeToMedian ? (rentComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${rentComparison.percentageDifference ? (rentComparison.percentageDifference > 0 ? '+' : '') + rentComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${affordabilityIndex ? `- Rent as % of Area Median Income: ${affordabilityIndex.percentOfMedianIncome ? affordabilityIndex.percentOfMedianIncome.toFixed(1) + '%' : 'N/A'} (${affordabilityIndex.isAffordable ? 'Affordable' : 'Less Affordable'})` : ''}
${investmentContext?.rentToValueRatio && investmentContext?.areaRentToValueRatio ? `- Rent-to-Value Ratio vs. Area: ${(investmentContext.rentToValueRatio * 100).toFixed(2)}% vs. ${(investmentContext.areaRentToValueRatio * 100).toFixed(2)}%` : ''}
` : ''}

EXIT STRATEGY (Year ${projectionYears}):
- Projected Sale Price: $${projectedSalePrice.toFixed(2)}
- Selling Costs: $${sellingCosts.toFixed(2)}
- Mortgage Payoff: $${mortgagePayoff.toFixed(2)}
- Net Proceeds From Sale: $${netProceedsFromSale.toFixed(2)}
- Total Return: $${totalReturn.toFixed(2)}
- Return on Investment: ${returnOnInvestment.toFixed(2)}%

MONTHLY EXPENSES:
- Mortgage: $${monthlyMortgage.toFixed(2)}
- Property Tax: $${(analysis?.monthlyAnalysis?.expenses?.propertyTax ?? 0).toFixed(2)}
- Insurance: $${(analysis?.monthlyAnalysis?.expenses?.insurance ?? 0).toFixed(2)}
- Maintenance: $${(analysis?.monthlyAnalysis?.expenses?.maintenance ?? 0).toFixed(2)}
- Property Management: $${(analysis?.monthlyAnalysis?.expenses?.propertyManagement ?? 0).toFixed(2)}
- Vacancy Loss: $${(dealData.monthlyRent * (dealData.longTermAssumptions?.vacancyRate ?? 5) / 100).toFixed(2)}

LONG-TERM ASSUMPTIONS:
- Annual Rent Growth: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
- Annual Expense Growth: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
- Annual Property Value Growth: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
- Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}

IMPORTANT SCORING GUIDELINES:
1. Financial metrics should be the PRIMARY factor in determining the investment score.
2. Higher financial returns (Cap Rate, Cash on Cash Return, DSCR, IRR) should ALWAYS result in a higher investment score.
3. DO NOT penalize a property for having an attractive purchase price. A below-market price is a POSITIVE attribute, not a reason for suspicion.
4. Cash flow is the most important metric - positive cash flow should significantly increase the investment score.
5. The 1% Rule and 50% Rule are useful guidelines but should NOT override actual financial performance metrics.
6. Assess the risk profile using the expense ratio and break-even occupancy metrics.
7. Consider both best and worst case scenarios when evaluating the investment's resilience.
8. Evaluate the exit strategy and long-term potential based on projected sale price and total return.
${medianHomeValue || medianRent || medianIncome ? '9. Consider how the property compares to area averages - properties priced below market with above-market rents should receive higher scores.' : ''}

CENSUS DATA ANALYSIS INSTRUCTIONS:
1. If census data is provided, INCLUDE AT LEAST ONE STRENGTH OR WEAKNESS related to how the property compares to local market averages.
2. For properties priced below local median with above-average rents, highlight this as a STRENGTH.
3. For properties priced above local median with below-average rents, highlight this as a WEAKNESS.
4. Consider affordability metrics and how they might affect tenant stability and rental demand.
5. Use the "notes" field to provide additional insights about the local market that don't fit into strengths or weaknesses.

Please provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence summary of the investment opportunity",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "riskAssessment": "1-2 sentences analyzing the risk profile of this investment",
  "investmentScore": 0-100,
  "recommendedHoldPeriod": "recommendation on how long to hold this property based on exit analysis",
  "marketTrendPrediction": "2-3 sentences predicting future market trends for this property based on location, property type, and current metrics",
  "optimalExitStrategy": "detailed analysis of the optimal exit timing and strategy, considering projected appreciation, mortgage payoff, and market cycles",
  "notes": "Free-form additional insights about the property and local market context that don't fit into other categories",
  "valueAddOpportunities": [
    {
      "improvement": "name of potential improvement",
      "estimatedCost": "estimated cost range",
      "potentialRoiPercent": "estimated ROI percentage",
      "rentIncreasePotential": "potential monthly rent increase",
      "valueIncreasePotential": "potential property value increase"
    }
  ]
}

Your investmentScore should be on a scale from 0-100, where:
- 0-20: Very poor investment, avoid (negative cash flow, extremely low returns)
- 21-40: Poor investment with significant issues (minimal cash flow, below-average returns)
- 41-60: Average investment with both pros and cons (modest cash flow, average returns)
- 61-80: Good investment with some minor concerns (good cash flow, above-average returns)
- 81-100: Excellent investment opportunity (strong cash flow, excellent returns)

SCORING PRIORITIES (from highest to lowest importance):
1. Cash flow and DSCR
2. Cap rate and Cash on Cash Return
3. IRR and appreciation potential
4. Risk metrics (Expense Ratio, Break-Even Occupancy)
5. Investment rules of thumb (1% Rule, 50% Rule, GRM)
6. Property condition and market factors
7. Exit strategy and total return potential
${medianHomeValue || medianRent || medianIncome ? '8. Market positioning (how the property compares to area averages)' : ''}

PREDICTIVE ANALYSIS GUIDELINES:
1. Market Trend Prediction:
   - Consider the property's location, age, and type
   - Analyze how the property might perform relative to market averages
   - Consider demographic trends that could impact future value
   - Predict whether the area is likely to appreciate faster or slower than average

2. Optimal Exit Strategy:
   - Identify the mathematical sweet spot for exit timing
   - Consider mortgage payoff trajectory vs. appreciation
   - Analyze when equity position would be maximized
   - Consider potential market cycles and their impact on exit timing

3. Value-Add Opportunities:
   - Based on property age, condition, and type, suggest specific improvements
   - For each improvement, estimate cost range, ROI percentage, and impact on rent/value
   - Prioritize improvements by ROI potential
   - Consider which improvements would be most appealing to the local rental market

Focus your analysis on:
1. Cash flow potential and financial stability
2. Return metrics compared to market averages
3. Risk factors and mitigations
4. Value-add opportunities with specific ROI estimates
5. Long-term appreciation potential with market-specific factors
6. Resilience to market downturns (based on Break-Even Occupancy and sensitivity analysis)
7. Exit strategy and optimal hold period
8. Predictive insights on future performance
${medianHomeValue || medianRent || medianIncome ? '9. How the property compares to local market metrics and what that means for the investment' : ''}

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
}

export function mfAnalysisPrompt(dealData: any, analysis: any): string {
  // Calculate key metrics
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
  // Extract metrics from analysis object with fallbacks
  const capRate = analysis?.annualAnalysis?.capRate ?? (analysis?.metrics?.capRate ?? 0);
  const cashOnCashReturn = analysis?.annualAnalysis?.cashOnCashReturn ?? (analysis?.metrics?.cashOnCashReturn ?? 0);
  const irr = analysis?.metrics?.irr ?? 0;
  const annualCashFlow = (analysis?.monthlyAnalysis?.cashFlow ?? 0) * 12;
  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
  
  // Calculate unit mix metrics
  const totalUnits = dealData.unitTypes.reduce((sum: number, unit: any) => sum + unit.count, 0);
  const avgRentPerUnit = dealData.unitTypes.reduce((sum: number, unit: any) => sum + (unit.monthlyRent * unit.count), 0) / totalUnits;
  const pricePerUnit = dealData.purchasePrice / totalUnits;
  const pricePerSqft = dealData.purchasePrice / dealData.totalSqft;

  // Extract exit analysis data
  const exitAnalysis = analysis?.longTermAnalysis?.exitAnalysis || {};
  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
  const projectedSalePrice = exitAnalysis.projectedSalePrice || 0;
  const sellingCosts = exitAnalysis.sellingCosts || 0;
  const mortgagePayoff = exitAnalysis.mortgagePayoff || 0;
  const netProceedsFromSale = exitAnalysis.netProceedsFromSale || 0;
  const totalReturn = exitAnalysis.totalReturn || 0;
  const returnOnInvestment = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

  // Extract Census data if available
  const censusData = dealData.censusData || {};
  const censusInsights = dealData.censusInsights || {};
  
  // Census data metrics
  const medianHomeValue = censusData.housing?.medianHomeValue;
  const medianRent = censusData.housing?.medianRent;
  const medianIncome = censusData.income?.medianHouseholdIncome;
  const vacancyRate = censusData.housing?.vacancyRate;
  const totalPopulation = censusData.demographics?.totalPopulation;
  const ownerOccupied = censusData.housing?.ownerOccupied;
  const renterOccupied = censusData.housing?.renterOccupied;
  
  // Census insights
  const valueComparison = censusInsights.valueComparison;
  const rentComparison = censusInsights.rentComparison;
  const affordabilityIndex = censusInsights.affordabilityIndex;
  const investmentContext = censusInsights.investmentContext;

  return `Analyze this multi-family property investment:

PROPERTY DETAILS:
- Address: ${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}, ${dealData.propertyAddress.state} ${dealData.propertyAddress.zipCode}
- Total Units: ${totalUnits}
- Total Square Feet: ${dealData.totalSqft}
- Year Built: ${dealData.yearBuilt}
- Price Per Unit: $${pricePerUnit.toFixed(2)}
- Price Per Square Foot: $${pricePerSqft.toFixed(2)}

UNIT MIX:
${dealData.unitTypes.map((unit: any) => 
  `- ${unit.count}x ${unit.type} (${unit.sqft} sqft) @ $${unit.monthlyRent}/month`
).join('\n')}

FINANCIAL METRICS:
- Purchase Price: $${dealData.purchasePrice}
- Down Payment: $${dealData.downPayment} (${downPaymentPercent.toFixed(1)}%)
- Interest Rate: ${dealData.interestRate}%
- Loan Term: ${dealData.loanTerm} years
- Monthly Mortgage: $${monthlyMortgage.toFixed(2)}
- Monthly NOI: $${monthlyNOI.toFixed(2)}
- Annual Cash Flow: $${annualCashFlow.toFixed(2)}
- Total Investment: $${totalInvestment.toFixed(2)}
- Average Rent Per Unit: $${avgRentPerUnit.toFixed(2)}
- DSCR (Debt Service Coverage Ratio): ${dscr.toFixed(2)} (below 1.0 indicates negative cash flow)
- Cap Rate: ${capRate.toFixed(2)}%
- Cash on Cash Return: ${cashOnCashReturn.toFixed(2)}%
- IRR (if available): ${irr ? irr.toFixed(2) + '%' : 'N/A'}

${medianHomeValue || medianRent || medianIncome ? `
CENSUS DATA (MARKET CONTEXT):
${medianHomeValue ? `- Area Median Home Value: $${medianHomeValue.toLocaleString()}` : ''}
${medianRent ? `- Area Median Monthly Rent: $${medianRent.toLocaleString()}` : ''}
${medianIncome ? `- Area Median Household Income: $${medianIncome.toLocaleString()}` : ''}
${vacancyRate ? `- Area Vacancy Rate: ${(vacancyRate * 100).toFixed(1)}%` : ''}
${totalPopulation ? `- Area Population: ${totalPopulation.toLocaleString()}` : ''}
${ownerOccupied && renterOccupied ? `- Owner/Renter Ratio: ${Math.round((ownerOccupied / (ownerOccupied + renterOccupied)) * 100)}% / ${Math.round((renterOccupied / (ownerOccupied + renterOccupied)) * 100)}%` : ''}
` : ''}

${valueComparison || rentComparison || affordabilityIndex ? `
MARKET COMPARISONS:
${valueComparison ? `- Property Value vs. Area Median: ${valueComparison.relativeToMedian ? (valueComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${valueComparison.percentageDifference ? (valueComparison.percentageDifference > 0 ? '+' : '') + valueComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${rentComparison ? `- Rent vs. Area Median: ${rentComparison.relativeToMedian ? (rentComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${rentComparison.percentageDifference ? (rentComparison.percentageDifference > 0 ? '+' : '') + rentComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${affordabilityIndex ? `- Rent as % of Area Median Income: ${affordabilityIndex.percentOfMedianIncome ? affordabilityIndex.percentOfMedianIncome.toFixed(1) + '%' : 'N/A'} (${affordabilityIndex.isAffordable ? 'Affordable' : 'Less Affordable'})` : ''}
${investmentContext?.rentToValueRatio && investmentContext?.areaRentToValueRatio ? `- Rent-to-Value Ratio vs. Area: ${(investmentContext.rentToValueRatio * 100).toFixed(2)}% vs. ${(investmentContext.areaRentToValueRatio * 100).toFixed(2)}%` : ''}
` : ''}

OPERATING EXPENSES:
- Property Tax: $${(analysis?.monthlyAnalysis?.expenses?.propertyTax ?? 0).toFixed(2)}/month
- Insurance: $${(analysis?.monthlyAnalysis?.expenses?.insurance ?? 0).toFixed(2)}/month
- Maintenance: $${(analysis?.monthlyAnalysis?.expenses?.maintenance ?? 0).toFixed(2)}/month
- Property Management: $${(analysis?.monthlyAnalysis?.expenses?.propertyManagement ?? 0).toFixed(2)}/month
- Vacancy: $${(analysis?.monthlyAnalysis?.expenses?.vacancy ?? 0).toFixed(2)}/month
- Utilities: $${(analysis?.monthlyAnalysis?.expenses?.utilities ?? 0).toFixed(2)}/month
- Total Monthly Operating Expenses: $${(analysis?.monthlyAnalysis?.expenses?.total ?? 0).toFixed(2)}

EXIT STRATEGY (Year ${projectionYears}):
- Projected Sale Price: $${projectedSalePrice.toFixed(2)}
- Selling Costs: $${sellingCosts.toFixed(2)}
- Mortgage Payoff: $${mortgagePayoff.toFixed(2)}
- Net Proceeds From Sale: $${netProceedsFromSale.toFixed(2)}
- Total Return: $${totalReturn.toFixed(2)}
- Return on Investment: ${returnOnInvestment.toFixed(2)}%

LONG-TERM ASSUMPTIONS:
- Annual Rent Increase: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
- Annual Expense Increase: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
- Annual Property Value Increase: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
- Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}
- Vacancy Rate: ${dealData.longTermAssumptions?.vacancyRate ?? 5}%

Please provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence summary of the investment opportunity",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "riskAssessment": "1-2 sentences analyzing the risk profile of this investment",
  "investmentScore": 0-100,
  "unitMixAnalysis": "analysis of the property's unit mix and how it affects the investment",
  "marketPositionAnalysis": "analysis of how this property is positioned in the local market",
  "valueAddOpportunities": [
    {
      "improvement": "name of potential improvement",
      "estimatedCost": "estimated cost range",
      "potentialRoiPercent": "estimated ROI percentage",
      "rentIncreasePotential": "potential monthly rent increase",
      "valueIncreasePotential": "potential property value increase"
    }
  ],
  "recommendedHoldPeriod": "recommendation on how long to hold this property"
}

Your investmentScore should be on a scale from 0-100, where:
- 0-20: Very poor investment, avoid
- 21-40: Poor investment with significant issues
- 41-60: Average investment with both pros and cons
- 61-80: Good investment with some minor concerns
- 81-100: Excellent investment opportunity

SCORING PRIORITIES (from highest to lowest importance):
1. Cash flow and DSCR
2. Cap rate and Cash on Cash Return
3. IRR and appreciation potential
4. Unit mix and occupancy potential
5. Location and market factors
6. Value-add opportunities
7. Exit strategy and total return potential
${medianHomeValue || medianRent || medianIncome ? '8. Market positioning compared to area averages' : ''}

IMPORTANT CONSIDERATIONS:
1. Multi-family properties should be evaluated primarily on their income potential and operational efficiency
2. Unit mix should be analyzed for market fit and potential for rent increases
3. Value-add opportunities should be identified and quantified
4. Local market conditions, including supply/demand dynamics, should be considered
5. Management efficiency and potential for operational improvements should be assessed
${medianHomeValue || medianRent || medianIncome ? '6. How the property compares to area averages in terms of value and rent' : ''}
${ownerOccupied && renterOccupied ? '7. The owner/renter ratio in the area and what it means for rental demand' : ''}

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
} 