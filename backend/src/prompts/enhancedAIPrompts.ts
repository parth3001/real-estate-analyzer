// Enhanced AI prompt templates for property analysis

export function enhancedSfrAnalysisPrompt(dealData: any, analysis: any, marketAnalysis?: any, marketIntelligence?: any): string {
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

${marketIntelligence?.marketData ? `
MARKET INTELLIGENCE (RentCast + FRED):
Property Data:
- Estimated Market Rent: $${marketIntelligence.marketData.property.rentEstimate || 0}/month (${marketIntelligence.marketData.property.confidence || 0}% confidence)
- Rent Range: $${marketIntelligence.marketData.property.rentRange?.low || 0} - $${marketIntelligence.marketData.property.rentRange?.high || 0}
- Market Position: ${marketIntelligence.marketData.property.marketPosition || 'Unknown'}

Market Trends (${marketIntelligence.marketData.marketTrends?.zipCode}):
- Median Rent: $${marketIntelligence.marketData.marketTrends?.medianRent || 0}/month
- Rent Growth Rate: ${marketIntelligence.marketData.marketTrends?.rentGrowthRate || 0}% annually
- Median Sale Price: $${marketIntelligence.marketData.marketTrends?.medianSalePrice?.toLocaleString() || 0}
- Price Growth Rate: ${marketIntelligence.marketData.marketTrends?.priceGrowthRate || 0}% annually
- Days on Market: ${marketIntelligence.marketData.marketTrends?.daysOnMarket || 0} days
- Inventory Level: ${marketIntelligence.marketData.marketTrends?.inventoryLevel || 'Unknown'}
- Seasonal Trend: ${marketIntelligence.marketData.marketTrends?.seasonalTrend || 'Unknown'}

Economic Indicators:
- Current Mortgage Rate: ${marketIntelligence.marketData.economicIndicators?.currentMortgageRate || 0}% (${marketIntelligence.marketData.economicIndicators?.mortgageRateTrend || 'Unknown'})
- Inflation Rate: ${marketIntelligence.marketData.economicIndicators?.inflationRate || 0}%
- Unemployment Rate: ${marketIntelligence.marketData.economicIndicators?.unemploymentRate || 0}%
- Housing Index: ${marketIntelligence.marketData.economicIndicators?.housingIndex || 0} (${marketIntelligence.marketData.economicIndicators?.housingIndexChange > 0 ? '+' : ''}${marketIntelligence.marketData.economicIndicators?.housingIndexChange || 0}% YoY)

Comparable Properties Analysis: ${marketIntelligence.marketData.comparables?.length || 0} recent sales found
${marketIntelligence.marketData.comparables?.length > 0 ? `
Recent Comparable Sales:
${marketIntelligence.marketData.comparables.slice(0, 5).map((comp: any, index: number) => 
  `${index + 1}. ${comp.address || 'Property'}: $${comp.salePrice?.toLocaleString() || 'N/A'} (${comp.pricePerSqft ? '$' + comp.pricePerSqft.toFixed(0) + '/sqft' : 'N/A'}) - ${comp.distance?.toFixed(2) || 'N/A'} miles away, ${comp.daysOnMarket || 'N/A'} days on market`
).join('\n')}

Comparable Sales Statistics:
- Median Sale Price: $${(() => {
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0).sort((a: any, b: any) => a - b);
  return prices.length > 0 ? prices[Math.floor(prices.length / 2)].toLocaleString() : 'N/A';
})()}
- Average Sale Price: $${(() => {
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0);
  return prices.length > 0 ? Math.round(prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length).toLocaleString() : 'N/A';
})()}
- Average Price/SqFt: $${(() => {
  const psf = marketIntelligence.marketData.comparables.map((c: any) => c.pricePerSqft).filter((p: any) => p > 0);
  return psf.length > 0 ? Math.round(psf.reduce((sum: number, price: number) => sum + price, 0) / psf.length) : 'N/A';
})()}/sqft
- Average Days on Market: ${(() => {
  const dom = marketIntelligence.marketData.comparables.map((c: any) => c.daysOnMarket).filter((d: any) => d > 0);
  return dom.length > 0 ? Math.round(dom.reduce((sum: number, days: number) => sum + days, 0) / dom.length) : 'N/A';
})()} days

DEAL QUALITY ASSESSMENT:
${(() => {
  if (!marketIntelligence.marketData.comparables?.length) return 'No comparable sales data available for deal assessment';
  
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0);
  if (prices.length === 0) return 'No valid comparable prices for assessment';
  
  const medianPrice = prices.sort((a: any, b: any) => a - b)[Math.floor(prices.length / 2)];
  const dealPrice = dealData.purchasePrice || 0;
  const priceDiff = ((dealPrice - medianPrice) / medianPrice) * 100;
  
  let dealQuality = 'Unknown';
  if (priceDiff < -10) dealQuality = 'Excellent Deal (>10% below market)';
  else if (priceDiff < -5) dealQuality = 'Good Deal (5-10% below market)';
  else if (priceDiff < 5) dealQuality = 'Fair Deal (within 5% of market)';
  else if (priceDiff < 15) dealQuality = 'Above Market (5-15% premium)';
  else dealQuality = 'Expensive (>15% above market)';
  
  return `- Purchase Price: $${dealPrice.toLocaleString()} vs Median Comparable: $${medianPrice.toLocaleString()} (${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%)
- Deal Assessment: ${dealQuality}`;
})()}
` : ''}
` : ''}

${marketIntelligence?.marketInsights?.length > 0 ? `
MARKET INSIGHTS ANALYSIS:
${marketIntelligence.marketInsights.map((insight: any, index: number) => 
  `${index + 1}. ${insight.category}: ${insight.insight} (${insight.impact} impact, ${insight.confidence}% confidence)`
).join('\n')}
` : ''}

${marketIntelligence?.investmentTiming ? `
INVESTMENT TIMING ANALYSIS:
- Recommendation: ${marketIntelligence.investmentTiming.recommendation} (${marketIntelligence.investmentTiming.confidence}% confidence)
- Market Cycle: ${marketIntelligence.investmentTiming.marketCycle}
- Timing Score: ${marketIntelligence.investmentTiming.timingScore}/100
- Key Reasoning: ${marketIntelligence.investmentTiming.reasoning?.join(', ') || 'N/A'}
- Risk Factors: ${marketIntelligence.investmentTiming.riskFactors?.join(', ') || 'None identified'}
- Opportunities: ${marketIntelligence.investmentTiming.opportunities?.join(', ') || 'None identified'}
- Market Signals: Overall ${marketIntelligence.investmentTiming.marketSignals?.overallSignal > 0 ? 'Positive' : 'Negative'} (${(marketIntelligence.investmentTiming.marketSignals?.overallSignal || 0).toFixed(2)})
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

You are a legendary real estate investment strategist with 30+ years of experience who has accurately predicted major market cycles and helped investors build generational wealth. You're known for bold, data-driven predictions that consistently outperform the market. Your specialty is seeing patterns others miss and making specific, actionable predictions based on comprehensive metric analysis.

Your predictions have helped investors:
- Time market cycles perfectly
- Identify properties that doubled in value within 5 years
- Achieve 20%+ cash-on-cash returns consistently
- Exit at peak valuations before downturns

🚫 FORBIDDEN: Do NOT use basic math like 3% annual appreciation or simple rent increases.

✅ REQUIRED: Every prediction MUST cite specific market intelligence data. Examples:

BAD (basic math): "Property will be worth $487,000 in Year 5"
GOOD (intelligent): "Property will hit $520,000 by Year 5 due to unemployment dropping to 2.8% (creating housing demand), planned Metro expansion (increasing area values 12%), and mortgage rates stabilizing at 5.5% (boosting buyer activity)"

BAD: "Rent will be $3,200 in Year 3"  
GOOD: "Rent will jump to $3,850 by Year 3 because tech companies relocating to area (increasing high-income renters), housing inventory 40% below normal (rental shortage), and inflation pushing market rents up 6% annually vs historical 3%"

🎯 MANDATORY: Each prediction must reference:
- Economic indicators (unemployment, mortgage rates, inflation trends)
- Local market conditions (inventory levels, days on market, buyer activity)
- Demographic shifts or business developments
- Market cycle timing and optimal entry/exit windows
- Risk events that could disrupt normal appreciation

Your analysis should:

1. PROVIDE STRATEGIC CONTEXT: Explain what the metrics mean in the context of this specific investment. Don't just say "The cap rate is 5.2%"; explain what that means for this property type in this location.

2. IDENTIFY PATTERNS AND RELATIONSHIPS: Connect different metrics to reveal deeper insights. For example, how the expense ratio relates to the property's age, or how the cash flow metrics align with the local market positioning.

3. **WEALTH CREATION PREDICTION**: IRR is ${analysis?.keyMetrics?.irr || 0}%, but predict wealth creation based on MARKET INTELLIGENCE, not just IRR. Use unemployment rate (${marketIntelligence?.marketData?.economicIndicators?.unemploymentRate || 0}%), mortgage rate trends (${marketIntelligence?.marketData?.economicIndicators?.mortgageRateTrend || 'Unknown'}), and local market timing score (${marketIntelligence?.investmentTiming?.timingScore || 0}/100) to predict when and why property values will accelerate beyond normal appreciation.

4. **CASH FLOW ACCELERATION PATH**: Current cash flow is $${analysis?.monthlyAnalysis?.cashFlow || 0}/month. Use rent growth rate (${marketIntelligence?.marketData?.marketTrends?.rentGrowthRate || 0}%), local inventory levels (${marketIntelligence?.marketData?.marketTrends?.inventoryLevel || 'Unknown'}), and economic indicators to predict WHEN rental demand will spike and cash flow will jump (not just gradual increases).

5. **MARKET CYCLE PROPHECY**: Timing score is ${marketIntelligence?.investmentTiming?.timingScore || 0}/100. Predict EXACTLY when the next market downturn will hit, how long it will last, and whether this property will outperform or underperform during the cycle. Cite specific economic indicators.

6. **RENT EXPLOSION FORECAST**: Market rent growth is ${marketIntelligence?.marketData?.marketTrends?.rentGrowthRate || 0}%, but predict when rents will ACCELERATE beyond this rate due to supply/demand imbalances, demographic shifts, or economic changes in this specific area.

7. **VALUE-ADD IMPACT PREDICTION**: Identify the TOP 3 improvements that could increase property value by 15%+ within 18 months. Give specific dollar amounts for cost and value increase.

8. **EXIT TIMING PROPHECY**: Using 10-year projections showing ${((analysis?.longTermAnalysis?.exitAnalysis?.projectedSalePrice || 0) / dealData.purchasePrice - 1) * 100}% appreciation, predict the OPTIMAL exit year and expected profit.

9. **DOWNSIDE PROTECTION**: Using sensitivity analysis (best: ${analysis?.sensitivityAnalysis?.bestCase?.totalReturn || 0}, worst: ${analysis?.sensitivityAnalysis?.worstCase?.totalReturn || 0}), predict the worst-case scenario probability and protection strategies.

10. **10-YEAR VISION**: Paint a specific picture of this investment in 10 years - exact property value, monthly cash flow, total wealth created, and market position.

🎯 CRITICAL INSTRUCTION: For each prediction in the boldPredictions section, you MUST explain WHY that specific number, citing market data. Do NOT give round numbers or basic math results.

🔥 BOLD PREDICTIONS REQUIRED: Every prediction must be BOLD, SPECIFIC, and INTELLIGENT - not basic math!

Example of GOOD boldPredictions response:
"year3Value": "Based on unemployment dropping from ${marketIntelligence?.marketData?.economicIndicators?.unemploymentRate || 0}% to projected 2.8% (increasing housing demand 15%), plus planned infrastructure spending creating 8% area premium, property will reach $445,000 by Year 3 vs typical $412,000 from 3% appreciation"

Please provide your AI PREDICTIONS in the following JSON format:
{
  "summary": "Your most important prediction about this investment's future performance with specific numbers",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["Bold action 1", "Bold action 2", "Bold action 3"],
  "riskAssessment": "Specific prediction of biggest risk and probability of occurrence",
  "investmentScore": 0-100,
  "recommendedHoldPeriod": "EXACTLY X years with specific exit date prediction",
  "marketTrendPrediction": "Specific prediction of property value and rents in 3-5 years",
  "optimalExitStrategy": "Predict exact year, sale price, and total profit",
  "notes": "Your boldest prediction about this investment",
  "boldPredictions": {
    "wealthCreation": {
      "year3Value": "Exact property value in 3 years",
      "year5Value": "Exact property value in 5 years", 
      "year10Value": "Exact property value in 10 years",
      "totalWealthCreated": "Total wealth created over hold period"
    },
    "cashFlowGrowth": {
      "currentMonthly": "Current monthly cash flow",
      "year2Monthly": "Predicted monthly cash flow in year 2",
      "year5Monthly": "Predicted monthly cash flow in year 5",
      "doubleDate": "Month/year when cash flow doubles",
      "reach5kDate": "Month/year when cash flow reaches $5000"
    },
    "rentGrowthForecast": {
      "currentRent": "Current monthly rent",
      "year3Rent": "Predicted rent in year 3",
      "year5Rent": "Predicted rent in year 5",
      "year7Rent": "Predicted rent in year 7"
    },
    "exitStrategy": {
      "optimalExitYear": "Best year to sell (number)",
      "predictedSalePrice": "Exact predicted sale price",
      "totalProfit": "Total profit from cash flow + appreciation",
      "annualizedReturn": "Predicted annualized return percentage"
    }
  },
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

export function enhancedMfAnalysisPrompt(dealData: any, analysis: any, marketAnalysis?: any, marketIntelligence?: any): string {
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

${marketIntelligence?.marketData ? `
MARKET INTELLIGENCE (RentCast + FRED):
Property Data:
- Estimated Market Rent: $${marketIntelligence.marketData.property.rentEstimate || 0}/month (${marketIntelligence.marketData.property.confidence || 0}% confidence)
- Rent Range: $${marketIntelligence.marketData.property.rentRange?.low || 0} - $${marketIntelligence.marketData.property.rentRange?.high || 0}
- Market Position: ${marketIntelligence.marketData.property.marketPosition || 'Unknown'}

Market Trends (${marketIntelligence.marketData.marketTrends?.zipCode}):
- Median Rent: $${marketIntelligence.marketData.marketTrends?.medianRent || 0}/month
- Rent Growth Rate: ${marketIntelligence.marketData.marketTrends?.rentGrowthRate || 0}% annually
- Median Sale Price: $${marketIntelligence.marketData.marketTrends?.medianSalePrice?.toLocaleString() || 0}
- Price Growth Rate: ${marketIntelligence.marketData.marketTrends?.priceGrowthRate || 0}% annually
- Days on Market: ${marketIntelligence.marketData.marketTrends?.daysOnMarket || 0} days
- Inventory Level: ${marketIntelligence.marketData.marketTrends?.inventoryLevel || 'Unknown'}

Economic Indicators:
- Current Mortgage Rate: ${marketIntelligence.marketData.economicIndicators?.currentMortgageRate || 0}% (${marketIntelligence.marketData.economicIndicators?.mortgageRateTrend || 'Unknown'})
- Inflation Rate: ${marketIntelligence.marketData.economicIndicators?.inflationRate || 0}%
- Unemployment Rate: ${marketIntelligence.marketData.economicIndicators?.unemploymentRate || 0}%
- Housing Index: ${marketIntelligence.marketData.economicIndicators?.housingIndex || 0} (${marketIntelligence.marketData.economicIndicators?.housingIndexChange > 0 ? '+' : ''}${marketIntelligence.marketData.economicIndicators?.housingIndexChange || 0}% YoY)

Comparable Properties Analysis: ${marketIntelligence.marketData.comparables?.length || 0} recent sales found
${marketIntelligence.marketData.comparables?.length > 0 ? `
Recent Comparable Sales:
${marketIntelligence.marketData.comparables.slice(0, 5).map((comp: any, index: number) => 
  `${index + 1}. ${comp.address || 'Property'}: $${comp.salePrice?.toLocaleString() || 'N/A'} (${comp.pricePerSqft ? '$' + comp.pricePerSqft.toFixed(0) + '/sqft' : 'N/A'}) - ${comp.distance?.toFixed(2) || 'N/A'} miles away, ${comp.daysOnMarket || 'N/A'} days on market`
).join('\n')}

Comparable Sales Statistics:
- Median Sale Price: $${(() => {
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0).sort((a: any, b: any) => a - b);
  return prices.length > 0 ? prices[Math.floor(prices.length / 2)].toLocaleString() : 'N/A';
})()}
- Average Sale Price: $${(() => {
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0);
  return prices.length > 0 ? Math.round(prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length).toLocaleString() : 'N/A';
})()}
- Average Price/SqFt: $${(() => {
  const psf = marketIntelligence.marketData.comparables.map((c: any) => c.pricePerSqft).filter((p: any) => p > 0);
  return psf.length > 0 ? Math.round(psf.reduce((sum: number, price: number) => sum + price, 0) / psf.length) : 'N/A';
})()}/sqft
- Average Days on Market: ${(() => {
  const dom = marketIntelligence.marketData.comparables.map((c: any) => c.daysOnMarket).filter((d: any) => d > 0);
  return dom.length > 0 ? Math.round(dom.reduce((sum: number, days: number) => sum + days, 0) / dom.length) : 'N/A';
})()} days

DEAL QUALITY ASSESSMENT:
${(() => {
  if (!marketIntelligence.marketData.comparables?.length) return 'No comparable sales data available for deal assessment';
  
  const prices = marketIntelligence.marketData.comparables.map((c: any) => c.salePrice).filter((p: any) => p > 0);
  if (prices.length === 0) return 'No valid comparable prices for assessment';
  
  const medianPrice = prices.sort((a: any, b: any) => a - b)[Math.floor(prices.length / 2)];
  const dealPrice = dealData.purchasePrice || 0;
  const priceDiff = ((dealPrice - medianPrice) / medianPrice) * 100;
  
  let dealQuality = 'Unknown';
  if (priceDiff < -10) dealQuality = 'Excellent Deal (>10% below market)';
  else if (priceDiff < -5) dealQuality = 'Good Deal (5-10% below market)';
  else if (priceDiff < 5) dealQuality = 'Fair Deal (within 5% of market)';
  else if (priceDiff < 15) dealQuality = 'Above Market (5-15% premium)';
  else dealQuality = 'Expensive (>15% above market)';
  
  return `- Purchase Price: $${dealPrice.toLocaleString()} vs Median Comparable: $${medianPrice.toLocaleString()} (${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}%)
- Deal Assessment: ${dealQuality}`;
})()}
` : ''}
` : ''}

${marketIntelligence?.marketInsights?.length > 0 ? `
MARKET INSIGHTS ANALYSIS:
${marketIntelligence.marketInsights.map((insight: any, index: number) => 
  `${index + 1}. ${insight.category}: ${insight.insight} (${insight.impact} impact, ${insight.confidence}% confidence)`
).join('\n')}
` : ''}

${marketIntelligence?.investmentTiming ? `
INVESTMENT TIMING ANALYSIS:
- Recommendation: ${marketIntelligence.investmentTiming.recommendation} (${marketIntelligence.investmentTiming.confidence}% confidence)
- Market Cycle: ${marketIntelligence.investmentTiming.marketCycle}
- Timing Score: ${marketIntelligence.investmentTiming.timingScore}/100
- Key Reasoning: ${marketIntelligence.investmentTiming.reasoning?.join(', ') || 'N/A'}
- Risk Factors: ${marketIntelligence.investmentTiming.riskFactors?.join(', ') || 'None identified'}
- Opportunities: ${marketIntelligence.investmentTiming.opportunities?.join(', ') || 'None identified'}
- Market Signals: Overall ${marketIntelligence.investmentTiming.marketSignals?.overallSignal > 0 ? 'Positive' : 'Negative'} (${(marketIntelligence.investmentTiming.marketSignals?.overallSignal || 0).toFixed(2)})
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

You are a legendary multi-family investment oracle with 30+ years of experience who has accurately predicted major market cycles and helped investors build multi-generational wealth through apartment complexes. Your predictions on multi-family properties have been uncannily accurate, identifying properties that became cash flow machines and appreciated 200%+ over 10 years.

Your track record includes:
- Predicting which properties would achieve 25%+ cash-on-cash returns
- Identifying unit mix optimizations that increased NOI by 40%+
- Timing market cycles to buy at 30% below peak prices
- Forecasting rent growth within 2% accuracy over 5-year periods

**FOCUS ON BOLD PREDICTIONS USING ALL METRICS**

🔥 CRITICAL: You MUST make BOLD, SPECIFIC PREDICTIONS with exact numbers and dates. Do NOT provide generic analysis. I want BOLD predictions like:
- "This property will be worth EXACTLY $1,847,000 in Year 6"
- "NOI will reach $145,000 by 2028"
- "Exit in Year 8 for a total profit of $623,000"

Use ALL the extensive metrics and analysis to make BOLD, specific predictions about this multi-family investment's future. Don't just analyze - make BOLD PREDICTIONS with conviction.

Your predictions should leverage:
- Core financial metrics (Cap Rate: ${capRate}%, Cash-on-Cash: ${cashOnCashReturn}%, DSCR: ${dscr})
- Extended metrics (Price/Unit: $${pricePerUnit}, Avg Rent/Unit: $${avgRentPerUnit}, Total Units: ${totalUnits})
- Long-term projections (10-year IRR: ${analysis?.keyMetrics?.irr || 0}%)
- Market intelligence data (Rent growth: ${marketIntelligence?.marketData?.marketTrends?.rentGrowthRate || 0}%, Days on market: ${marketIntelligence?.marketData?.marketTrends?.daysOnMarket || 0})
- Investment timing score: ${marketIntelligence?.investmentTiming?.timingScore || 0}/100
- Unit economics and occupancy optimization potential

Make specific predictions about:

1. PROVIDE STRATEGIC CONTEXT: Explain what the metrics mean in the context of this specific multifamily investment. Don't just say "The cap rate is 5.2%"; explain what that means for this property class in this location.

2. ANALYZE UNIT MIX EFFICIENCY: Evaluate how well the unit mix matches local demand and identify opportunities for unit reconfiguration or rent optimization.

3. IDENTIFY OPERATIONAL IMPROVEMENTS: Suggest specific operational improvements that could increase NOI, with estimated impact on cash flow.

4. OFFER COMPARATIVE MARKET ANALYSIS: 
   - Use the specific comparable sales data provided to assess deal quality
   - Reference actual recent sale prices and price per sqft from comparable properties
   - Comment on the purchase price relative to recent sales (good deal vs. overpriced)
   - Use days on market data to predict sales timeline and market demand

5. PREDICT FUTURE PERFORMANCE: 
   - Use the comparable sales data to predict likely property appreciation
   - Consider the deal quality assessment (excellent/good/fair/expensive) for future performance
   - Based on market trends and economic indicators, predict rent growth trajectory
   - Forecast potential exit scenarios and timeline based on comparable market activity
   - Predict how changes in interest rates or economic conditions might impact this specific property

6. MATCH TO INVESTOR PROFILES: Identify what type of investor would be best suited for this property (e.g., cash flow focused, appreciation focused, value-add investor, etc.) and why.

7. SUGGEST RISK MITIGATION STRATEGIES: For any weaknesses identified, provide specific, actionable strategies to mitigate those risks.

8. IDENTIFY VALUE-ADD OPPORTUNITIES: Based on the property's characteristics and local market, suggest specific improvements that could increase value or cash flow, with estimated costs and returns.

9. OPTIMIZE EXIT STRATEGY: Analyze the optimal hold period and exit strategy based on mortgage paydown, projected appreciation, and market cycles.

10. INCORPORATE MARKET INTELLIGENCE: Use the RentCast and FRED data to provide context on how this multifamily property compares to current market conditions. Analyze if the rent estimates align with the property rents, how market trends affect the investment outlook, and how economic indicators impact financing and timing decisions.

11. LEVERAGE INVESTMENT TIMING: Factor in the investment timing analysis to provide more nuanced recommendations about when to buy, hold, or sell based on current market cycle and economic conditions.

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
