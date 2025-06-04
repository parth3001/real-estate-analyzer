// AI prompt templates for property analysis

export function sfrAnalysisPrompt(dealData: any, analysis: any): string {
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;

  return `Analyze this single-family rental property investment:
    Purchase Price: $${dealData.purchasePrice}
    Down Payment: ${downPaymentPercent.toFixed(1)}%
    Monthly Rent: $${dealData.monthlyRent}
    Monthly NOI: $${monthlyNOI}
    DSCR: ${dscr.toFixed(2)}
    Cap Rate: ${analysis.annualAnalysis?.capRate?.toFixed(2) ?? 'N/A'}%
    Cash on Cash Return: ${analysis.annualAnalysis?.cashOnCashReturn?.toFixed(2) ?? 'N/A'}%

    Please provide your analysis in the following JSON format:
    {
      "summary": "2-3 sentence summary",
      "strengths": ["...", "...", "..."],
      "weaknesses": ["...", "...", "..."],
      "recommendations": ["...", "...", "..."],
      "investmentScore": 0-100
    }
    Only return valid JSON.`;
}

export function mfAnalysisPrompt(dealData: any, analysis: any): string {
  // Calculate key metrics
  const downPaymentPercent = (dealData.downPayment / dealData.purchasePrice) * 100;
  const monthlyMortgage = analysis?.monthlyAnalysis?.expenses?.mortgage?.total ?? 0;
  const monthlyNOI = (analysis?.monthlyAnalysis?.cashFlow ?? 0) + monthlyMortgage;
  const dscr = monthlyMortgage !== 0 ? monthlyNOI / monthlyMortgage : 0;
  
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
    - Average Rent Per Unit: $${avgRentPerUnit.toFixed(2)}
    - Monthly NOI: $${monthlyNOI.toFixed(2)}
    - DSCR: ${dscr.toFixed(2)}
    - Cap Rate: ${analysis.annualAnalysis?.capRate?.toFixed(2) ?? 'N/A'}%
    - Cash on Cash Return: ${analysis.annualAnalysis?.cashOnCashReturn?.toFixed(2) ?? 'N/A'}%

    OPERATING EXPENSES:
    - Property Management: ${dealData.propertyManagementRate}%
    - Vacancy Rate: ${dealData.longTermAssumptions?.vacancyRate ?? 5}%
    - Maintenance: $${dealData.maintenanceCost}/month
    - Utilities: $${dealData.utilities}/month
    - Common Area Expenses: $${dealData.commonAreaElectricity + dealData.landscaping}/month

    LONG-TERM ASSUMPTIONS:
    - Annual Rent Growth: ${dealData.longTermAssumptions?.annualRentIncrease ?? 2}%
    - Annual Expense Growth: ${dealData.longTermAssumptions?.inflationRate ?? 2}%
    - Annual Property Value Growth: ${dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3}%
    - Projection Years: ${dealData.longTermAssumptions?.projectionYears ?? 10}
    - Selling Costs: ${dealData.longTermAssumptions?.sellingCostsPercentage ?? 6}%

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