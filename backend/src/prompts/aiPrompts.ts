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
  
  return `Analyze this single-family rental property investment:

PROPERTY DETAILS:
- Purchase Price: $${dealData.purchasePrice}
- Down Payment: $${dealData.downPayment} (${downPaymentPercent.toFixed(1)}%)
- Monthly Rent: $${dealData.monthlyRent}
- Property Type: Single Family Residential
- Year Built: ${dealData.yearBuilt || 'N/A'}
- Square Footage: ${dealData.squareFootage || 'N/A'}
- Bedrooms: ${dealData.bedrooms || 'N/A'}
- Bathrooms: ${dealData.bathrooms || 'N/A'}
- Price per Bedroom: $${pricePerBedroom.toFixed(2)}

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

MONTHLY EXPENSES:
- Mortgage: $${monthlyMortgage.toFixed(2)}
- Property Tax: $${(analysis?.monthlyAnalysis?.expenses?.propertyTax ?? 0).toFixed(2)}
- Insurance: $${(analysis?.monthlyAnalysis?.expenses?.insurance ?? 0).toFixed(2)}
- Maintenance: $${(analysis?.monthlyAnalysis?.expenses?.maintenance ?? 0).toFixed(2)}
- Property Management: $${(analysis?.monthlyAnalysis?.expenses?.propertyManagement ?? 0).toFixed(2)}
- Vacancy Loss: $${(dealData.monthlyRent * (dealData.longTermAssumptions?.vacancyRate ?? 5) / 100).toFixed(2)}

IMPORTANT SCORING GUIDELINES:
1. Financial metrics should be the PRIMARY factor in determining the investment score.
2. Higher financial returns (Cap Rate, Cash on Cash Return, DSCR, IRR) should ALWAYS result in a higher investment score.
3. DO NOT penalize a property for having an attractive purchase price. A below-market price is a POSITIVE attribute, not a reason for suspicion.
4. Cash flow is the most important metric - positive cash flow should significantly increase the investment score.
5. The 1% Rule and 50% Rule are useful guidelines but should NOT override actual financial performance metrics.
6. Assess the risk profile using the expense ratio and break-even occupancy metrics.
7. Consider both best and worst case scenarios when evaluating the investment's resilience.

Please provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence summary of the investment opportunity",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "riskAssessment": "1-2 sentences analyzing the risk profile of this investment",
  "investmentScore": 0-100
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

Focus your analysis on:
1. Cash flow potential and financial stability
2. Return metrics compared to market averages
3. Risk factors and mitigations
4. Value-add opportunities
5. Long-term appreciation potential
6. Resilience to market downturns (based on Break-Even Occupancy and sensitivity analysis)

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

OPERATING EXPENSES:
- Property Management: ${dealData.propertyManagementRate}%
- Vacancy Rate: ${dealData.longTermAssumptions?.vacancyRate ?? 5}%
- Maintenance: $${dealData.maintenanceCost}/month
- Utilities: $${dealData.utilities || 0}/month
- Common Area Expenses: $${(dealData.commonAreaElectricity || 0) + (dealData.landscaping || 0)}/month

LONG-TERM ASSUMPTIONS:
- Annual Rent Growth: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
- Annual Expense Growth: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
- Annual Property Value Growth: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
- Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}
- Selling Costs: ${dealData.longTermAssumptions?.sellingCostsPercentage ?? 6}%

IMPORTANT: Based on these metrics, provide a comprehensive analysis of this multi-family investment opportunity. Pay special attention to the DSCR value, unit mix optimization, and economies of scale.

Please provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence summary of the investment opportunity",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "unitMixAnalysis": "1-2 sentences analyzing if the unit mix is optimal",
  "marketPositionAnalysis": "1-2 sentences about the property's positioning in the market",
  "valueAddOpportunities": ["opportunity1", "opportunity2"],
  "investmentScore": 0-100,
  "recommendedHoldPeriod": "recommendation on how long to hold this property"
}

Your investmentScore should be on a scale from 0-100, where:
- 0-20: Very poor investment, avoid
- 21-40: Poor investment with significant issues
- 41-60: Average investment with both pros and cons
- 61-80: Good investment with some minor concerns
- 81-100: Excellent investment opportunity

Focus your analysis on:
1. Unit mix optimization and rental strategy
2. Operational efficiency and expense management
3. Value-add opportunities and renovation potential
4. Market positioning and competitive analysis
5. Risk factors specific to multi-family properties
6. Property management considerations
7. Economies of scale and efficiency metrics

Be specific, data-driven, and actionable in your recommendations.
Consider local market conditions, tenant demographics, and management requirements.
Only return valid JSON.`;
} 