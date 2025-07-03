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

  return `You are a world-class real estate investment analyst with 25+ years of experience advising institutional investors, private equity firms, and high-net-worth individuals. You have deep expertise in single-family rental investments, market analysis, and financial optimization. Your analysis is known for being data-driven, nuanced, and highly strategic.

I need you to provide an in-depth, sophisticated analysis of this single-family rental property investment opportunity. Your analysis should be detailed, specific, and go far beyond basic metrics to provide truly valuable strategic insights.

PROPERTY DETAILS:
- Purchase Price: $${dealData.purchasePrice.toLocaleString()}
- Down Payment: $${dealData.downPayment.toLocaleString()} (${downPaymentPercent.toFixed(1)}%)
- Monthly Rent: $${dealData.monthlyRent.toLocaleString()}
- Property Type: Single Family Residential
- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
- Square Footage: ${dealData.squareFootage ? dealData.squareFootage.toLocaleString() : 'N/A'}
- Bedrooms: ${dealData.bedrooms || 'N/A'}
- Bathrooms: ${dealData.bathrooms || 'N/A'}
- Price per Bedroom: $${pricePerBedroom.toLocaleString(undefined, {maximumFractionDigits: 0})}
- Price per Square Foot: $${avgPricePerSqFt.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Location: ${dealData.propertyAddress?.city || 'N/A'}, ${dealData.propertyAddress?.state || 'N/A'}

FINANCIAL METRICS:
- Monthly NOI: $${monthlyNOI.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Monthly Cash Flow: $${(analysis?.monthlyAnalysis?.cashFlow ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
- Annual Cash Flow: $${annualCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Total Investment: $${totalInvestment.toLocaleString(undefined, {maximumFractionDigits: 2})}
- DSCR (Debt Service Coverage Ratio): ${dscr.toFixed(2)}
- Cap Rate: ${capRate.toFixed(2)}%
- Cash on Cash Return: ${cashOnCashReturn.toFixed(2)}%
- IRR (if available): ${analysis?.keyMetrics?.irr ? analysis.keyMetrics.irr.toFixed(2) + '%' : 'N/A'}

RISK METRICS:
- Expense Ratio: ${expenseRatio.toFixed(2)}% (operating expenses as % of income)
- Break-Even Occupancy: ${breakEvenOccupancy.toFixed(2)}% (min. occupancy needed to break even)
- Debt-to-Income Ratio: ${debtToIncomeRatio.toFixed(2)}%
- Best Case Annual Cash Flow: $${bestCaseCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Worst Case Annual Cash Flow: $${worstCaseCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}

INVESTMENT RULES OF THUMB:
- 1% Rule: ${onePercentRuleValue.toFixed(2)}% (goal: 1% or higher)
- 50% Rule Analysis: ${fiftyRuleAnalysis ? 'PASS' : 'FAIL'} (expenses ≤ 50% of income)
- Gross Rent Multiplier: ${grossRentMultiplier.toFixed(2)} (lower is better)
- Rent-to-Price Ratio: ${rentToPriceRatio.toFixed(2)}%
- Equity Multiple: ${equityMultiple.toFixed(2)}

${valueComparison || rentComparison || affordabilityIndex ? `
MARKET COMPARISONS:
${valueComparison ? `- Property Value vs. Area Median: ${valueComparison.relativeToMedian ? (valueComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${valueComparison.percentageDifference ? (valueComparison.percentageDifference > 0 ? '+' : '') + valueComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${rentComparison ? `- Rent vs. Area Median: ${rentComparison.relativeToMedian ? (rentComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${rentComparison.percentageDifference ? (rentComparison.percentageDifference > 0 ? '+' : '') + rentComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${affordabilityIndex ? `- Rent as % of Area Median Income: ${affordabilityIndex.percentOfMedianIncome ? affordabilityIndex.percentOfMedianIncome.toFixed(1) + '%' : 'N/A'} (${affordabilityIndex.isAffordable ? 'Affordable' : 'Less Affordable'})` : ''}
${investmentContext?.rentToValueRatio && investmentContext?.areaRentToValueRatio ? `- Rent-to-Value Ratio vs. Area: ${(investmentContext.rentToValueRatio * 100).toFixed(2)}% vs. ${(investmentContext.areaRentToValueRatio * 100).toFixed(2)}%` : ''}
` : ''}

OPERATING EXPENSES:
- Property Tax: $${(analysis?.monthlyAnalysis?.expenses?.propertyTax ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Insurance: $${(analysis?.monthlyAnalysis?.expenses?.insurance ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Maintenance: $${(analysis?.monthlyAnalysis?.expenses?.maintenance ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Property Management: $${(analysis?.monthlyAnalysis?.expenses?.propertyManagement ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Vacancy: $${(analysis?.monthlyAnalysis?.expenses?.vacancy ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Utilities: $${(analysis?.monthlyAnalysis?.expenses?.utilities ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Total Monthly Operating Expenses: $${(analysis?.monthlyAnalysis?.expenses?.total ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}

EXIT STRATEGY (Year ${projectionYears}):
- Projected Sale Price: $${projectedSalePrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Selling Costs: $${sellingCosts.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Mortgage Payoff: $${mortgagePayoff.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Net Proceeds From Sale: $${netProceedsFromSale.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Total Return: $${totalReturn.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Return on Investment: ${returnOnInvestment.toFixed(2)}%

LONG-TERM ASSUMPTIONS:
- Annual Rent Increase: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
- Annual Expense Increase: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
- Annual Property Value Increase: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
- Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}
- Vacancy Rate: ${dealData.longTermAssumptions?.vacancyRate ?? 5}%

ANALYSIS INSTRUCTIONS:

As a sophisticated real estate investment analyst, I need you to provide an exceptionally detailed, nuanced, and actionable analysis. Your analysis should:

1. BE EXTREMELY SPECIFIC AND DETAILED: Include specific numbers, percentages, and dollar amounts in your analysis. Avoid vague statements like "strong cash flow" - instead say "$350 monthly cash flow representing a 7.2% cash-on-cash return."

2. PROVIDE DEEP COMPARATIVE CONTEXT: Don't just state metrics - contextualize them against industry benchmarks, similar markets, and alternative investments. For example, "The 5.8% cap rate is 0.7% above the market average for similar properties in this submarket."

3. IDENTIFY SPECIFIC OPTIMIZATION OPPORTUNITIES: Provide detailed, actionable recommendations with quantified potential impact. For example, "Refinancing at current market rates could reduce the monthly payment by $175, increasing cash flow by 24%."

4. ANALYZE RISK-ADJUSTED RETURNS: Provide a sophisticated risk assessment that considers both property-specific factors and broader market dynamics. Quantify downside scenarios.

5. EVALUATE MARKET POSITIONING: Analyze how this property is positioned relative to market trends, tenant demographics, and economic indicators. Identify specific competitive advantages or vulnerabilities.

6. PROVIDE DETAILED VALUE-ADD STRATEGIES: Go beyond basic recommendations to provide specific, implementable strategies with ROI estimates, difficulty ratings, and priority levels.

7. DELIVER ACTIONABLE FINANCING INSIGHTS: Analyze the current financing structure and provide specific optimization recommendations with quantified impact on returns.

8. INCLUDE PRECISE INVESTOR PROFILE MATCHING: Identify exactly what type of investor would be best suited for this property and why, with specific reference to investment goals and risk tolerance.

9. OFFER DETAILED EXIT STRATEGY ANALYSIS: Provide specific timing recommendations based on equity buildup, market cycle projections, and tax considerations.

10. INCLUDE PORTFOLIO CONTEXT: Analyze how this property would fit within different portfolio strategies, considering diversification benefits, correlation with other assets, and overall risk-return profile.

${medianHomeValue || medianRent || medianIncome ? '11. PROVIDE DETAILED MARKET ANALYSIS: Use the census data to provide specific insights about how this property compares to local market metrics and what that means for future performance.' : ''}

Please provide your analysis in the following JSON format:
{
  "summary": "3-4 sentence summary of the investment opportunity that captures the most important strategic insights with specific numbers and percentages",
  "investorFit": "Detailed description of what type of investor this property is best suited for and why, with specific reference to investment goals and risk tolerance",
  "strengths": ["strength1 with specific metrics and comparisons", "strength2 with specific metrics and comparisons", "strength3 with specific metrics and comparisons", "strength4 with specific metrics and comparisons"],
  "weaknesses": ["weakness1 with specific metrics and comparisons", "weakness2 with specific metrics and comparisons", "weakness3 with specific metrics and comparisons", "weakness4 with specific metrics and comparisons"],
  "recommendations": ["detailed recommendation1 with specific action steps and quantified impact", "detailed recommendation2 with specific action steps and quantified impact", "detailed recommendation3 with specific action steps and quantified impact", "detailed recommendation4 with specific action steps and quantified impact"],
  "riskAssessment": "Detailed risk profile analysis including quantified downside scenarios and specific risk mitigation strategies",
  "investmentScore": 0-100,
  "strategicInsights": "4-5 sentences providing deeper strategic context about this investment opportunity with specific metrics, market comparisons, and actionable insights",
  "competitiveAdvantage": "Detailed analysis of this property's competitive advantages or disadvantages in its specific market with quantified comparisons",
  "wealthBuildingPotential": "Specific analysis of how this property contributes to long-term wealth building beyond just cash flow, including equity accumulation projections and tax advantages",
  "marketCycleAnalysis": "Detailed assessment of where this market is in the real estate cycle with specific indicators and implications for the investment strategy",
  "recommendedHoldPeriod": "Data-driven recommendation on optimal hold period with specific reasoning tied to equity buildup, market cycle projections, and tax considerations",
  "marketTrendPrediction": "Detailed prediction of future market trends for this property based on specific economic indicators, demographic shifts, and supply-demand dynamics",
  "optimalExitStrategy": "Comprehensive analysis of exit timing and strategy options with quantified returns under different scenarios",
  "financingRecommendations": "Specific recommendations for optimizing the financing structure with quantified impact on cash flow, returns, and risk profile",
  "portfolioFitAnalysis": "Detailed analysis of how this property would complement different investment portfolio strategies, with specific diversification benefits and risk-return considerations",
  "opportunityCostAnalysis": "Quantified comparison to alternative investments in the current economic environment, including stocks, bonds, REITs, and other real estate opportunities",
  "notes": "Additional specific insights about the property and local market context that don't fit into other categories",
  "valueAddOpportunities": [
    {
      "improvement": "Specific improvement opportunity",
      "estimatedCost": "Precise cost range with supporting details",
      "potentialRoiPercent": "Specific ROI percentage with calculation basis",
      "rentIncreasePotential": "Specific monthly rent increase with market justification",
      "valueIncreasePotential": "Specific property value increase with comparable evidence",
      "implementationDifficulty": "easy/medium/hard with specific considerations",
      "strategicPriority": "high/medium/low with specific reasoning"
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

STRATEGIC ANALYSIS GUIDELINES:

1. Investor Fit Analysis:
   - Provide a detailed investor profile with specific investment goals, risk tolerance, and experience level
   - Quantify how this property aligns with different investment strategies (cash flow vs. appreciation)
   - Specify how this property complements different portfolio compositions

2. Market Cycle Analysis:
   - Identify specific indicators of the current market cycle position
   - Provide quantified projections for different cycle phases
   - Specify how cycle position affects optimal hold period and exit strategy

3. Competitive Advantage Analysis:
   - Quantify specific advantages in terms of rent-to-value ratio, location premium, or property features
   - Compare to specific competing properties or submarkets
   - Assess the durability of competitive advantages with specific timeframes

4. Wealth Building Analysis:
   - Provide specific equity accumulation projections by year
   - Quantify tax advantages with specific dollar amounts
   - Calculate total wealth impact over different holding periods

5. Value-Add Opportunity Analysis:
   - Provide detailed cost estimates with specific ranges
   - Calculate precise ROI for each improvement
   - Prioritize improvements based on quantified impact and implementation difficulty

6. Financing Optimization:
   - Analyze current loan terms against market alternatives
   - Calculate specific impact of refinancing or restructuring
   - Recommend optimal debt strategy with quantified benefits

7. Portfolio Fit Analysis:
   - Specify correlation with other asset classes
   - Quantify diversification benefits
   - Recommend specific portfolio allocation percentages

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
}

export function mfAnalysisPrompt(dealData: any, analysis: any): string {
  // Existing metric calculations
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
  const annualCashFlow = (analysis?.monthlyAnalysis?.cashFlow ?? 0) * 12;
  const totalInvestment = dealData.downPayment + (dealData.closingCosts || 0);
  const capRate = analysis?.annualAnalysis?.capRate ?? 0;
  const cashOnCashReturn = analysis?.annualAnalysis?.cashOnCashReturn ?? 0;
  
  // Add new metrics to the prompt
  const expenseRatio = analysis?.keyMetrics?.operatingExpenseRatio ?? 0;
  const breakEvenOccupancy = analysis?.keyMetrics?.breakEvenOccupancy ?? 0;
  const pricePerUnit = analysis?.keyMetrics?.pricePerUnit ?? 0;
  const noiPerUnit = analysis?.keyMetrics?.noiPerUnit ?? 0;
  const averageRentPerUnit = analysis?.keyMetrics?.averageRentPerUnit ?? 0;
  const operatingExpensePerUnit = analysis?.keyMetrics?.operatingExpensePerUnit ?? 0;
  const economicVacancyRate = analysis?.keyMetrics?.economicVacancyRate ?? 0;
  
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
  
  // Unit mix data
  const unitMix = dealData.units || [];
  const totalUnits = unitMix.length;
  
  // Calculate unit mix summary
  const unitTypes = unitMix.reduce((acc: any, unit: any) => {
    const key = `${unit.bedrooms}BR/${unit.bathrooms}BA`;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        totalRent: 0,
        avgRent: 0,
        percentage: 0
      };
    }
    acc[key].count++;
    acc[key].totalRent += (unit.monthlyRent || 0);
    return acc;
  }, {});
  
  // Calculate averages and percentages
  Object.keys(unitTypes).forEach(key => {
    const type = unitTypes[key];
    type.avgRent = type.totalRent / type.count;
    type.percentage = (type.count / totalUnits) * 100;
  });
  
  // Format unit mix for prompt
  const unitMixSummary = Object.keys(unitTypes).map(key => {
    const type = unitTypes[key];
    return `${key}: ${type.count} units (${type.percentage.toFixed(1)}%), Avg. Rent: $${type.avgRent.toFixed(2)}`;
  }).join('\n');

  return `You are a world-class real estate investment analyst with 25+ years of experience advising institutional investors, private equity firms, and high-net-worth individuals. You have deep expertise in multi-family property investments, market analysis, and financial optimization. Your analysis is known for being data-driven, nuanced, and highly strategic.

I need you to provide an in-depth, sophisticated analysis of this multi-family property investment opportunity. Your analysis should be detailed, specific, and go far beyond basic metrics to provide truly valuable strategic insights.

PROPERTY DETAILS:
- Purchase Price: $${dealData.purchasePrice.toLocaleString()}
- Down Payment: $${dealData.downPayment.toLocaleString()} (${downPaymentPercent.toFixed(1)}%)
- Property Type: Multi-Family (${totalUnits} units)
- Year Built: ${dealData.yearBuilt || 'N/A'} ${propertyAge ? `(${propertyAge} years old)` : ''}
- Total Square Footage: ${dealData.squareFootage ? dealData.squareFootage.toLocaleString() : 'N/A'}
- Price per Unit: $${pricePerUnit.toLocaleString(undefined, {maximumFractionDigits: 0})}
- Location: ${dealData.propertyAddress?.city || 'N/A'}, ${dealData.propertyAddress?.state || 'N/A'}

UNIT MIX:
${unitMixSummary}

FINANCIAL METRICS:
- Monthly NOI: $${monthlyNOI.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Monthly Cash Flow: $${(analysis?.monthlyAnalysis?.cashFlow ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
- Annual Cash Flow: $${annualCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Total Investment: $${totalInvestment.toLocaleString(undefined, {maximumFractionDigits: 2})}
- DSCR (Debt Service Coverage Ratio): ${dscr.toFixed(2)}
- Cap Rate: ${capRate.toFixed(2)}%
- Cash on Cash Return: ${cashOnCashReturn.toFixed(2)}%
- NOI per Unit: $${noiPerUnit.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Average Rent per Unit: $${averageRentPerUnit.toLocaleString(undefined, {maximumFractionDigits: 2})}

RISK METRICS:
- Expense Ratio: ${expenseRatio.toFixed(2)}% (operating expenses as % of income)
- Break-Even Occupancy: ${breakEvenOccupancy.toFixed(2)}% (min. occupancy needed to break even)
- Economic Vacancy Rate: ${economicVacancyRate.toFixed(2)}%
- Operating Expense per Unit: $${operatingExpensePerUnit.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Best Case Annual Cash Flow: $${bestCaseCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Worst Case Annual Cash Flow: $${worstCaseCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}

${valueComparison || rentComparison || affordabilityIndex ? `
MARKET COMPARISONS:
${valueComparison ? `- Property Value vs. Area Median: ${valueComparison.relativeToMedian ? (valueComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${valueComparison.percentageDifference ? (valueComparison.percentageDifference > 0 ? '+' : '') + valueComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${rentComparison ? `- Rent vs. Area Median: ${rentComparison.relativeToMedian ? (rentComparison.relativeToMedian * 100).toFixed(1) + '%' : 'N/A'} (${rentComparison.percentageDifference ? (rentComparison.percentageDifference > 0 ? '+' : '') + rentComparison.percentageDifference.toFixed(1) + '%' : 'N/A'})` : ''}
${affordabilityIndex ? `- Rent as % of Area Median Income: ${affordabilityIndex.percentOfMedianIncome ? affordabilityIndex.percentOfMedianIncome.toFixed(1) + '%' : 'N/A'} (${affordabilityIndex.isAffordable ? 'Affordable' : 'Less Affordable'})` : ''}
${investmentContext?.rentToValueRatio && investmentContext?.areaRentToValueRatio ? `- Rent-to-Value Ratio vs. Area: ${(investmentContext.rentToValueRatio * 100).toFixed(2)}% vs. ${(investmentContext.areaRentToValueRatio * 100).toFixed(2)}%` : ''}
` : ''}

OPERATING EXPENSES:
- Property Tax: $${(analysis?.monthlyAnalysis?.expenses?.propertyTax ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Insurance: $${(analysis?.monthlyAnalysis?.expenses?.insurance ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Maintenance: $${(analysis?.monthlyAnalysis?.expenses?.maintenance ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Property Management: $${(analysis?.monthlyAnalysis?.expenses?.propertyManagement ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Vacancy: $${(analysis?.monthlyAnalysis?.expenses?.vacancy ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Utilities: $${(analysis?.monthlyAnalysis?.expenses?.utilities ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}/month
- Total Monthly Operating Expenses: $${(analysis?.monthlyAnalysis?.expenses?.total ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}

EXIT STRATEGY (Year ${projectionYears}):
- Projected Sale Price: $${projectedSalePrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Selling Costs: $${sellingCosts.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Mortgage Payoff: $${mortgagePayoff.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Net Proceeds From Sale: $${netProceedsFromSale.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Total Return: $${totalReturn.toLocaleString(undefined, {maximumFractionDigits: 2})}
- Return on Investment: ${returnOnInvestment.toFixed(2)}%

LONG-TERM ASSUMPTIONS:
- Annual Rent Increase: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
- Annual Expense Increase: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
- Annual Property Value Increase: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
- Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}
- Vacancy Rate: ${dealData.longTermAssumptions?.vacancyRate ?? 5}%

ANALYSIS INSTRUCTIONS:

As a sophisticated multi-family real estate investment analyst, I need you to provide an exceptionally detailed, nuanced, and actionable analysis. Your analysis should:

1. BE EXTREMELY SPECIFIC AND DETAILED: Include specific numbers, percentages, and dollar amounts in your analysis. Avoid vague statements like "strong cash flow" - instead say "$4,200 monthly cash flow representing a 7.2% cash-on-cash return."

2. PROVIDE DEEP COMPARATIVE CONTEXT: Don't just state metrics - contextualize them against industry benchmarks, similar markets, and alternative investments. For example, "The 5.8% cap rate is 0.7% above the market average for similar multi-family properties in this submarket."

3. ANALYZE UNIT MIX OPTIMIZATION: Provide specific recommendations for optimizing the unit mix to maximize returns, including potential unit reconfiguration, rent adjustments, or amenity additions with quantified ROI.

4. EVALUATE OPERATIONAL EFFICIENCY: Identify specific operational improvements that could reduce expenses or increase revenue, with quantified impact on NOI and valuation.

5. ASSESS SCALE ADVANTAGES/DISADVANTAGES: Analyze how the property's unit count affects operational efficiency, management costs, and overall returns compared to smaller or larger multi-family properties.

6. PROVIDE DETAILED VALUE-ADD STRATEGIES: Go beyond basic recommendations to provide specific, implementable strategies with ROI estimates, difficulty ratings, and priority levels.

7. DELIVER ACTIONABLE FINANCING INSIGHTS: Analyze the current financing structure and provide specific optimization recommendations with quantified impact on returns.

8. INCLUDE PRECISE INVESTOR PROFILE MATCHING: Identify exactly what type of investor would be best suited for this property and why, with specific reference to investment goals and risk tolerance.

9. OFFER DETAILED EXIT STRATEGY ANALYSIS: Provide specific timing recommendations based on equity buildup, market cycle projections, and tax considerations.

10. INCLUDE PORTFOLIO CONTEXT: Analyze how this property would fit within different portfolio strategies, considering diversification benefits, correlation with other assets, and overall risk-return profile.

${medianHomeValue || medianRent || medianIncome ? '11. PROVIDE DETAILED MARKET ANALYSIS: Use the census data to provide specific insights about how this property compares to local market metrics and what that means for future performance.' : ''}
${ownerOccupied && renterOccupied ? '12. ANALYZE OWNERSHIP/RENTAL MIX: Evaluate how the owner-occupied to renter-occupied ratio in the area impacts rental demand, tenant quality, and long-term appreciation potential.' : ''}

Please provide your analysis in the following JSON format:
{
  "summary": "3-4 sentence summary of the investment opportunity that captures the most important strategic insights with specific numbers and percentages",
  "investorFit": "Detailed description of what type of investor this property is best suited for and why, with specific reference to investment goals and risk tolerance",
  "strengths": ["strength1 with specific metrics and comparisons", "strength2 with specific metrics and comparisons", "strength3 with specific metrics and comparisons", "strength4 with specific metrics and comparisons"],
  "weaknesses": ["weakness1 with specific metrics and comparisons", "weakness2 with specific metrics and comparisons", "weakness3 with specific metrics and comparisons", "weakness4 with specific metrics and comparisons"],
  "recommendations": ["detailed recommendation1 with specific action steps and quantified impact", "detailed recommendation2 with specific action steps and quantified impact", "detailed recommendation3 with specific action steps and quantified impact", "detailed recommendation4 with specific action steps and quantified impact"],
  "riskAssessment": "Detailed risk profile analysis including quantified downside scenarios and specific risk mitigation strategies",
  "investmentScore": 0-100,
  "unitMixAnalysis": "Detailed analysis of the property's unit mix with specific recommendations for optimization and their quantified impact on returns",
  "marketPositionAnalysis": "Detailed analysis of how this property is positioned in the local market with specific competitive advantages and vulnerabilities",
  "strategicInsights": "4-5 sentences providing deeper strategic context about this investment opportunity with specific metrics, market comparisons, and actionable insights",
  "competitiveAdvantage": "Detailed analysis of this property's competitive advantages or disadvantages in its specific market with quantified comparisons",
  "wealthBuildingPotential": "Specific analysis of how this property contributes to long-term wealth building beyond just cash flow, including equity accumulation projections and tax advantages",
  "marketCycleAnalysis": "Detailed assessment of where this market is in the real estate cycle with specific indicators and implications for the investment strategy",
  "recommendedHoldPeriod": "Data-driven recommendation on optimal hold period with specific reasoning tied to equity buildup, market cycle projections, and tax considerations",
  "marketTrendPrediction": "Detailed prediction of future market trends for this property based on specific economic indicators, demographic shifts, and supply-demand dynamics",
  "optimalExitStrategy": "Comprehensive analysis of exit timing and strategy options with quantified returns under different scenarios",
  "financingRecommendations": "Specific recommendations for optimizing the financing structure with quantified impact on cash flow, returns, and risk profile",
  "portfolioFitAnalysis": "Detailed analysis of how this property would complement different investment portfolio strategies, with specific diversification benefits and risk-return considerations",
  "opportunityCostAnalysis": "Quantified comparison to alternative investments in the current economic environment, including stocks, bonds, REITs, and other real estate opportunities",
  "operationalEfficiencyAnalysis": "Detailed analysis of operational improvements that could reduce expenses or increase revenue, with quantified impact on NOI and valuation",
  "notes": "Additional specific insights about the property and local market context that don't fit into other categories",
  "valueAddOpportunities": [
    {
      "improvement": "Specific improvement opportunity",
      "estimatedCost": "Precise cost range with supporting details",
      "potentialRoiPercent": "Specific ROI percentage with calculation basis",
      "rentIncreasePotential": "Specific monthly rent increase with market justification",
      "valueIncreasePotential": "Specific property value increase with comparable evidence",
      "implementationDifficulty": "easy/medium/hard with specific considerations",
      "strategicPriority": "high/medium/low with specific reasoning"
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
3. NOI per unit and operational efficiency
4. Unit mix optimization potential
5. Location and market factors
6. Value-add opportunities
7. Exit strategy and total return potential
${medianHomeValue || medianRent || medianIncome ? '8. Market positioning compared to area averages' : ''}
${ownerOccupied && renterOccupied ? '9. Owner/renter ratio in the area and what it means for rental demand' : ''}

STRATEGIC ANALYSIS GUIDELINES:

1. Unit Mix Analysis:
   - Evaluate the current unit mix against market demand
   - Identify specific unit types that are underperforming or overperforming
   - Recommend specific optimization strategies with quantified ROI

2. Operational Efficiency Analysis:
   - Identify specific expense categories that are above industry benchmarks
   - Recommend specific operational improvements with quantified impact
   - Analyze management efficiency and potential for improvements

3. Market Cycle Analysis:
   - Identify specific indicators of the current market cycle position
   - Provide quantified projections for different cycle phases
   - Specify how cycle position affects optimal hold period and exit strategy

4. Competitive Advantage Analysis:
   - Quantify specific advantages in terms of rent-to-value ratio, location premium, or property features
   - Compare to specific competing properties or submarkets
   - Assess the durability of competitive advantages with specific timeframes

5. Value-Add Opportunity Analysis:
   - Provide detailed cost estimates with specific ranges
   - Calculate precise ROI for each improvement
   - Prioritize improvements based on quantified impact and implementation difficulty

6. Financing Optimization:
   - Analyze current loan terms against market alternatives
   - Calculate specific impact of refinancing or restructuring
   - Recommend optimal debt strategy with quantified benefits

7. Portfolio Fit Analysis:
   - Specify correlation with other asset classes
   - Quantify diversification benefits
   - Recommend specific portfolio allocation percentages

IMPORTANT: Return ONLY raw JSON without any markdown formatting (no \`\`\`json or \`\`\` tags), code blocks, or explanations.
Only return valid JSON.`;
} 