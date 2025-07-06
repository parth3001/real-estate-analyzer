// Enhanced AI prompt templates for property analysis

export function enhancedSfrAnalysisPrompt(dealData: any, analysis: any, marketAnalysis?: any): string {
  // Existing metric calculations
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
  const annualCashFlow = (analysis?.monthlyAnalysis?.cashFlow ?? 0) * 12;
  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
  const capRate = analysis?.keyMetrics?.capRate ?? (analysis?.annualAnalysis?.capRate ?? (analysis?.metrics?.capRate ?? 0));
  const cashOnCashReturn = analysis?.keyMetrics?.cashOnCashReturn ?? (analysis?.annualAnalysis?.cashOnCashReturn ?? (analysis?.metrics?.cashOnCashReturn ?? 0));
  
  // Log successful metric extraction for debugging if needed
  if (capRate === 0 || cashOnCashReturn === 0) {
    console.warn('AI Prompt: Some key metrics are zero', {
      capRate,
      cashOnCashReturn,
      hasKeyMetrics: !!analysis?.keyMetrics
    });
  }
  
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

  return `You are a sophisticated real estate investment analyst with deep expertise in single-family rental properties. Your analysis goes beyond basic metrics to provide strategic insights that help investors make informed decisions.

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

${marketAnalysis ? `
MARKET ANALYSIS INSIGHTS:
- Investment Score: ${marketAnalysis.investmentScore?.score}/100 (Grade ${marketAnalysis.investmentScore?.grade})
- Market Position: ${marketAnalysis.marketPositioning?.position} (${marketAnalysis.marketPositioning?.percentageDiff > 0 ? '+' : ''}${marketAnalysis.marketPositioning?.percentageDiff?.toFixed(1)}% vs median)
- Affordability Assessment: ${marketAnalysis.affordabilityAnalysis?.assessment} (${marketAnalysis.affordabilityAnalysis?.tenantPoolSize} tenant pool)
- Market Condition: ${marketAnalysis.marketDynamics?.marketCondition} market with ${marketAnalysis.marketDynamics?.demandLevel} demand
- Investment Timing: ${marketAnalysis.marketDynamics?.investmentTiming}
- Demographic Profile: ${marketAnalysis.demographicInsights?.marketPotential} potential (${marketAnalysis.demographicInsights?.populationTrend} population)
- Competitive Environment: ${marketAnalysis.marketDynamics?.competitiveEnvironment}
- Rent Optimization: ${marketAnalysis.rentOptimization?.justification}
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

ANALYSIS INSTRUCTIONS:

You are to provide a comprehensive investment analysis that goes beyond simply repeating the metrics. Your analysis should:

1. PROVIDE STRATEGIC CONTEXT: Explain what the metrics mean in the context of this specific investment. Don't just say "The cap rate is 5.2%"; explain what that means for this property type in this location.

2. IDENTIFY PATTERNS AND RELATIONSHIPS: Connect different metrics to reveal deeper insights. For example, how the expense ratio relates to the property's age, or how the cash flow metrics align with the local market positioning.

3. OFFER COMPARATIVE ANALYSIS: Place this investment in context by comparing it to typical returns for similar properties in similar markets. Indicate whether the metrics are above average, below average, or typical.

4. PREDICT FUTURE PERFORMANCE: Based on the property's characteristics, location, and current metrics, provide insights into how the investment might perform over time under different market conditions.

5. MATCH TO INVESTOR PROFILES: Identify what type of investor would be best suited for this property (e.g., cash flow focused, appreciation focused, value-add investor, etc.) and why.

6. SUGGEST RISK MITIGATION STRATEGIES: For any weaknesses identified, provide specific, actionable strategies to mitigate those risks.

7. IDENTIFY VALUE-ADD OPPORTUNITIES: Based on the property's characteristics and local market, suggest specific improvements that could increase value or cash flow, with estimated costs and returns.

8. OPTIMIZE EXIT STRATEGY: Analyze the optimal hold period and exit strategy based on mortgage paydown, projected appreciation, and market cycles.

Please provide your analysis in the following JSON format:
{
  "summary": "A strategic overview of the investment opportunity that highlights the most important aspects and overall investment thesis",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "riskAssessment": "A nuanced analysis of the risk profile, including specific risk factors and their potential impact",
  "investmentScore": 0-100,
  "recommendedHoldPeriod": "Strategic recommendation on optimal hold period with specific reasoning",
  "marketTrendPrediction": "Analysis of likely future market trends for this specific property and location",
  "optimalExitStrategy": "Detailed analysis of the optimal exit timing and strategy",
  "notes": "Additional insights about the property and local market context",
  "valueAddOpportunities": [
    {
      "improvement": "name of potential improvement",
      "estimatedCost": "estimated cost range",
      "potentialRoiPercent": "estimated ROI percentage",
      "rentIncreasePotential": "potential monthly rent increase",
      "valueIncreasePotential": "potential property value increase"
    }
  ],
  "comparativeMarketAnalysis": "Analysis of how this property compares to similar properties in the market",
  "investorProfileMatch": "Description of what type of investor this property would be best suited for",
  "riskMitigationStrategies": ["strategy1", "strategy2", "strategy3"]
}

Your investmentScore should be on a scale from 0-100, where:
- 0-20: Very poor investment, avoid (negative cash flow, extremely low returns)
- 21-40: Poor investment with significant issues (minimal cash flow, below-average returns)
- 41-60: Average investment with both pros and cons (modest cash flow, average returns)
- 61-80: Good investment with some minor concerns (good cash flow, above-average returns)
- 81-100: Excellent investment opportunity (strong cash flow, excellent returns)

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
}

export function enhancedMfAnalysisPrompt(dealData: any, analysis: any, marketAnalysis?: any): string {
  // Calculate key metrics
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
  // Extract metrics from analysis object with fallbacks
  const capRate = analysis?.keyMetrics?.capRate ?? (analysis?.annualAnalysis?.capRate ?? (analysis?.metrics?.capRate ?? 0));
  const cashOnCashReturn = analysis?.keyMetrics?.cashOnCashReturn ?? (analysis?.annualAnalysis?.cashOnCashReturn ?? (analysis?.metrics?.cashOnCashReturn ?? 0));
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

  return `You are a sophisticated multifamily real estate investment analyst with expertise in analyzing apartment complexes and other multi-unit properties. Your analysis goes beyond basic metrics to provide strategic insights that help investors make informed decisions.

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

ANALYSIS INSTRUCTIONS:

You are to provide a comprehensive multifamily investment analysis that goes beyond simply repeating the metrics. Your analysis should:

1. PROVIDE STRATEGIC CONTEXT: Explain what the metrics mean in the context of this specific multifamily investment. Don't just say "The cap rate is 5.2%"; explain what that means for this property class in this location.

2. ANALYZE UNIT MIX EFFICIENCY: Evaluate how well the unit mix matches local demand and identify opportunities for unit reconfiguration or rent optimization.

3. IDENTIFY OPERATIONAL IMPROVEMENTS: Suggest specific operational improvements that could increase NOI, with estimated impact on cash flow.

4. OFFER COMPARATIVE MARKET ANALYSIS: Place this investment in context by comparing it to typical returns for similar multifamily properties in similar markets. Indicate whether the metrics are above average, below average, or typical.

5. PREDICT FUTURE PERFORMANCE: Based on the property's characteristics, location, and current metrics, provide insights into how the investment might perform over time under different market conditions.

6. MATCH TO INVESTOR PROFILES: Identify what type of investor would be best suited for this property (e.g., cash flow focused, appreciation focused, value-add investor, etc.) and why.

7. SUGGEST RISK MITIGATION STRATEGIES: For any weaknesses identified, provide specific, actionable strategies to mitigate those risks.

8. IDENTIFY VALUE-ADD OPPORTUNITIES: Based on the property's characteristics and local market, suggest specific improvements that could increase value or cash flow, with estimated costs and returns.

9. OPTIMIZE EXIT STRATEGY: Analyze the optimal hold period and exit strategy based on mortgage paydown, projected appreciation, and market cycles.

Please provide your analysis in the following JSON format:
{
  "summary": "A strategic overview of the multifamily investment opportunity that highlights the most important aspects and overall investment thesis",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "riskAssessment": "A nuanced analysis of the risk profile, including specific risk factors and their potential impact",
  "investmentScore": 0-100,
  "unitMixAnalysis": "Strategic analysis of the property's unit mix and how it affects the investment potential",
  "marketPositionAnalysis": "Analysis of how this property is positioned in the local multifamily market",
  "valueAddOpportunities": [
    {
      "improvement": "name of potential improvement",
      "estimatedCost": "estimated cost range",
      "potentialRoiPercent": "estimated ROI percentage",
      "rentIncreasePotential": "potential monthly rent increase",
      "valueIncreasePotential": "potential property value increase"
    }
  ],
  "recommendedHoldPeriod": "Strategic recommendation on optimal hold period with specific reasoning",
  "marketTrendPrediction": "Analysis of likely future market trends for this specific multifamily property and location",
  "optimalExitStrategy": "Detailed analysis of the optimal exit timing and strategy",
  "notes": "Additional insights about the property and local market context",
  "comparativeMarketAnalysis": "Analysis of how this property compares to similar multifamily properties in the market",
  "investorProfileMatch": "Description of what type of investor this multifamily property would be best suited for",
  "riskMitigationStrategies": ["strategy1", "strategy2", "strategy3"]
}

Your investmentScore should be on a scale from 0-100, where:
- 0-20: Very poor investment, avoid
- 21-40: Poor investment with significant issues
- 41-60: Average investment with both pros and cons
- 61-80: Good investment with some minor concerns
- 81-100: Excellent investment opportunity

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
}
