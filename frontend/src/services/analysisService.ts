/**
 * Analysis Service
 * 
 * Handles all analysis-related API calls and data transformation
 * This is a complete rewrite focusing on reliability and clear data flow
 */

import { Analysis } from '../types/analysis';

// Fix environment variable access to be compatible with both CRA and Vite
const API_URL = 
  // Try Vite style env vars
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  // Try CRA style env vars
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  // Fallback
  'http://localhost:3001';

/**
 * Analyze a property deal
 */
export async function analyzeDeal(dealData: any): Promise<Analysis> {
  try {
    console.log('Analyzing deal:', dealData);
    
    // Format the data according to the backend API requirements
    // The backend expects { propertyType, propertyData } structure
    const formattedData = {
      propertyType: dealData.propertyType || 'SFR',
      propertyData: {
        ...dealData,
        // Ensure these critical fields are present
        propertyName: dealData.propertyName || 'Property',
        propertyAddress: dealData.propertyAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        propertyType: dealData.propertyType || 'SFR'
      }
    };
    
    console.log('Formatted data for API:', formattedData);
    
    // Send the analysis request to the backend
    const response = await fetch(`${API_URL}/api/deals/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the default error message
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse the response
    const rawData = await response.json();
    console.log('Raw API response:', rawData);
    
    // Add detailed JSON logging of the response
    console.log('API response stringified:', JSON.stringify(rawData, null, 2));
    console.log('API response keys:', Object.keys(rawData));
    
    if (rawData.monthlyAnalysis) {
      console.log('Monthly Analysis:', JSON.stringify(rawData.monthlyAnalysis, null, 2));
    }
    
    if (rawData.annualAnalysis) {
      console.log('Annual Analysis:', JSON.stringify(rawData.annualAnalysis, null, 2));
    }
    
    if (rawData.keyMetrics) {
      console.log('Key Metrics:', JSON.stringify(rawData.keyMetrics, null, 2));
    }
    
    if (rawData.aiInsights) {
      console.log('AI Insights:', JSON.stringify(rawData.aiInsights, null, 2));
    }
    
    // Transform the backend response to our frontend model
    const analysis = transformAnalysisData(rawData, dealData);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing deal:', error);
    throw error;
  }
}

/**
 * Transform API response data to frontend Analysis model
 */
function transformAnalysisData(apiResponse: any, requestData: any): Analysis {
  // If API response is empty or invalid, return a default Analysis object
  if (!apiResponse) {
    console.error('Invalid API response', apiResponse);
    return createDefaultAnalysis();
  }
  
  try {
    console.log('Starting transformation of API response...');
    
    // Store key response properties with null-safe access
    const monthlyAnalysis = apiResponse.monthlyAnalysis || {};
    const annualAnalysis = apiResponse.annualAnalysis || {};
    const longTermAnalysis = apiResponse.longTermAnalysis || {};
    const keyMetrics = apiResponse.keyMetrics || apiResponse.metrics || {};
    const aiInsights = apiResponse.aiInsights;
    
    // Explicitly check for the rental income in various possible locations
    const monthlyRentalIncome = Number(getValueOrDefault(
      monthlyAnalysis.income?.gross,
      monthlyAnalysis.grossRentalIncome,
      requestData.monthlyRent,
      0
    ));
    console.log('Monthly Rental Income:', monthlyRentalIncome);
    
    // Expenses breakdown with safe access
    const expenses = monthlyAnalysis.expenses || {};
    // The backend might send expenses directly rather than in a breakdown object
    // Try to get values from multiple possible locations in the response
    
    console.log('Expenses data structure:', expenses);
    
    const propertyTax = Number(getValueOrDefault(
      expenses.propertyTax,
      expenses.breakdown?.propertyTax,
      0
    ));
    console.log('Property Tax:', propertyTax);
    
    const insurance = Number(getValueOrDefault(
      expenses.insurance,
      expenses.breakdown?.insurance,
      0
    ));
    console.log('Insurance:', insurance);
    
    const maintenance = Number(getValueOrDefault(
      expenses.maintenance,
      expenses.breakdown?.maintenance,
      0
    ));
    console.log('Maintenance:', maintenance);
    
    const propertyManagement = Number(getValueOrDefault(
      expenses.propertyManagement,
      expenses.breakdown?.propertyManagement,
      0
    ));
    console.log('Property Management:', propertyManagement);
    
    const vacancy = Number(getValueOrDefault(
      expenses.vacancy,
      expenses.breakdown?.vacancy,
      0
    ));
    console.log('Vacancy:', vacancy);
    
    const totalExpenses = Number(getValueOrDefault(expenses.total, 0));
    console.log('Total Expenses:', totalExpenses);
    
    // Extract or calculate key financial metrics with proper type casting
    const noi = Number(getValueOrDefault(
      annualAnalysis.noi,
      annualAnalysis.annualNOI,
      keyMetrics.noi,
      0
    ));
    console.log('NOI:', noi);
    
    const dscr = Number(getValueOrDefault(
      annualAnalysis.dscr,
      keyMetrics.dscr,
      0
    ));
    console.log('DSCR:', dscr);
    
    const capRate = Number(getValueOrDefault(
      annualAnalysis.capRate,
      keyMetrics.capRate,
      0
    ));
    console.log('Cap Rate:', capRate);
    
    const cashOnCashReturn = Number(getValueOrDefault(
      annualAnalysis.cashOnCashReturn,
      keyMetrics.cashOnCashReturn,
      0
    ));
    console.log('Cash on Cash Return:', cashOnCashReturn);
    
    const totalInvestment = calculateTotalInvestment(requestData, keyMetrics);
    console.log('Total Investment:', totalInvestment);
    
    // Monthly cash flow - try different possible locations
    const monthlyCashFlow = Number(getValueOrDefault(
      monthlyAnalysis.cashFlow,
      monthlyAnalysis.income?.net,
      0
    ));
    console.log('Monthly Cash Flow:', monthlyCashFlow);
    
    // Get annual debt service from multiple possible locations
    const annualDebtService = Number(getValueOrDefault(
      annualAnalysis.debtService,
      annualAnalysis.annualDebtService,
      0
    ));
    console.log('Annual Debt Service:', annualDebtService);
    
    // Handle property-specific metrics with proper type casting
    const pricePerSqFt = Number(getValueOrDefault(
      keyMetrics.pricePerSqFt, 
      keyMetrics.pricePerSqft, 
      0
    ));
    console.log('Price Per Sq Ft:', pricePerSqFt);
    
    // Get projections safely - try multiple possible locations
    const yearlyProjections = longTermAnalysis.yearlyProjections || 
                           apiResponse.projections || 
                           apiResponse.yearlyProjections || 
                           [];
    console.log('Yearly Projections count:', yearlyProjections.length);
    
    // If we have projections, log the first one to see its structure
    if (yearlyProjections && yearlyProjections.length > 0) {
      console.log('First year projection:', yearlyProjections[0]);
    }
    
    // Get exit analysis safely - try multiple possible locations
    const exitAnalysis = longTermAnalysis.exitAnalysis || 
                       apiResponse.exitAnalysis || 
                       {};
    console.log('Exit Analysis found:', Object.keys(exitAnalysis).length > 0);
    
    // Get effective gross income
    const effectiveGrossIncome = Number(getValueOrDefault(
      annualAnalysis.effectiveGrossIncome,
      annualAnalysis.income,
      0
    ));
    console.log('Effective Gross Income:', effectiveGrossIncome);
    
    // Transform to frontend Analysis model
    console.log('Creating analysis object with collected values...');
    const analysis: Analysis = {
      monthlyAnalysis: {
        income: {
          gross: monthlyRentalIncome,
          effective: monthlyRentalIncome * (1 - vacancy / monthlyRentalIncome)
        },
        expenses: {
          propertyTax,
          insurance,
          maintenance,
          propertyManagement,
          vacancy,
          total: totalExpenses,
        },
        cashFlow: monthlyCashFlow,
      },
      annualAnalysis: {
        dscr: calculateDSCR(dscr, noi, annualDebtService),
        cashOnCashReturn: calculateCashOnCash(cashOnCashReturn, monthlyCashFlow * 12, totalInvestment),
        capRate: calculateCapRate(capRate, noi, Number(requestData.purchasePrice || 0)),
        totalInvestment,
        annualNOI: noi,
        annualDebtService,
        effectiveGrossIncome,
      },
      longTermAnalysis: {
        yearlyProjections: yearlyProjections.map(transformYearlyProjection),
        projectionYears: yearlyProjections.length,
        returns: {
          irr: Number(getValueOrDefault(keyMetrics.irr, 0)),
          totalCashFlow: calculateTotalCashFlow(yearlyProjections),
          totalAppreciation: calculateTotalAppreciation(yearlyProjections),
          totalReturn: Number(getValueOrDefault(exitAnalysis.totalReturn, 0)),
        },
        exitAnalysis: {
          projectedSalePrice: Number(getValueOrDefault(exitAnalysis.projectedSalePrice, 0)),
          sellingCosts: Number(getValueOrDefault(exitAnalysis.sellingCosts, 0)),
          mortgagePayoff: Number(getValueOrDefault(exitAnalysis.mortgagePayoff, 0)),
          netProceedsFromSale: Number(getValueOrDefault(exitAnalysis.netProceedsFromSale, 0)),
        },
      },
      keyMetrics: {
        pricePerSqFtAtPurchase: pricePerSqFt,
        pricePerSqFtAtSale: pricePerSqFt * 1.1, // Assuming 10% appreciation
        avgRentPerSqFt: Number(getValueOrDefault(keyMetrics.rentPerSqFt, 0)),
      },
    };
    
    // Add AI insights if available
    if (aiInsights) {
      analysis.aiInsights = {
        investmentScore: Number(getValueOrDefault(aiInsights.investmentScore, 0)),
        summary: String(getValueOrDefault(aiInsights.summary, '')),
        strengths: Array.isArray(aiInsights.strengths) ? aiInsights.strengths : [],
        weaknesses: Array.isArray(aiInsights.weaknesses) ? aiInsights.weaknesses : [],
        recommendations: Array.isArray(aiInsights.recommendations) ? aiInsights.recommendations : [],
      };
    }
    
    console.log('Final analysis result - Monthly Cash Flow:', analysis.monthlyAnalysis.cashFlow);
    console.log('Final analysis result - Cap Rate:', analysis.annualAnalysis.capRate);
    console.log('Final analysis result - Cash on Cash Return:', analysis.annualAnalysis.cashOnCashReturn);
    
    return analysis;
  } catch (error) {
    console.error('Error transforming analysis data:', error);
    return createDefaultAnalysis();
  }
}

/**
 * Transform a yearly projection from the API to our frontend model
 */
function transformYearlyProjection(projection: any): any {
  return {
    year: Number(getValueOrDefault(projection.year, 0)),
    cashFlow: Number(getValueOrDefault(projection.cashFlow, 0)),
    propertyValue: Number(getValueOrDefault(projection.propertyValue, 0)),
    equity: Number(getValueOrDefault(projection.equity, 0)),
    propertyTax: Number(getValueOrDefault(projection.propertyTax, 0)),
    insurance: Number(getValueOrDefault(projection.insurance, 0)),
    maintenance: Number(getValueOrDefault(projection.maintenance, 0)),
    propertyManagement: Number(getValueOrDefault(projection.propertyManagement, 0)),
    vacancy: Number(getValueOrDefault(projection.vacancy, 0)),
    operatingExpenses: Number(getValueOrDefault(projection.operatingExpenses, 0)),
    noi: Number(getValueOrDefault(projection.noi, 0)),
    debtService: Number(getValueOrDefault(projection.debtService, 0)),
    grossRent: Number(getValueOrDefault(projection.grossRent, 0)),
    mortgageBalance: Number(getValueOrDefault(projection.mortgageBalance, 0)),
    appreciation: Number(getValueOrDefault(projection.appreciation, 0)),
    totalReturn: Number(getValueOrDefault(projection.totalReturn, 0)),
  };
}

/**
 * Calculate total investment from available data
 */
function calculateTotalInvestment(requestData: any, metrics: any): number {
  // If metrics has totalInvestment, use it
  if (metrics && typeof metrics.totalInvestment === 'number' && metrics.totalInvestment > 0) {
    return metrics.totalInvestment;
  }
  
  // Otherwise calculate from request data
  const downPayment = Number(getValueOrDefault(requestData.downPayment, 0));
  const closingCosts = Number(getValueOrDefault(requestData.closingCosts, 0));
  
  return downPayment + closingCosts;
}

/**
 * Calculate DSCR with fallbacks
 */
function calculateDSCR(existingDSCR: number, noi: number, debtService: number): number {
  if (existingDSCR > 0) {
    return existingDSCR;
  }
  
  if (noi > 0 && debtService > 0) {
    return noi / debtService;
  }
  
  return 0;
}

/**
 * Calculate Cap Rate with fallbacks
 */
function calculateCapRate(existingCapRate: number, noi: number, purchasePrice: number): number {
  if (existingCapRate > 0) {
    return existingCapRate;
  }
  
  if (noi > 0 && purchasePrice > 0) {
    return (noi / purchasePrice) * 100;
  }
  
  return 0;
}

/**
 * Calculate Cash on Cash Return with fallbacks
 */
function calculateCashOnCash(existingCashOnCash: number, cashFlow: number, totalInvestment: number): number {
  if (existingCashOnCash > 0) {
    return existingCashOnCash;
  }
  
  if (cashFlow > 0 && totalInvestment > 0) {
    return (cashFlow / totalInvestment) * 100;
  }
  
  return 0;
}

/**
 * Calculate total cash flow from projections
 */
function calculateTotalCashFlow(projections: any[]): number {
  if (!projections || projections.length === 0) {
    return 0;
  }
  
  return projections.reduce((sum, p) => sum + Number(getValueOrDefault(p.cashFlow, 0)), 0);
}

/**
 * Calculate total appreciation from projections
 */
function calculateTotalAppreciation(projections: any[]): number {
  if (!projections || projections.length <= 1) {
    return 0;
  }
  
  const firstValue = Number(getValueOrDefault(projections[0].propertyValue, 0));
  const lastValue = Number(getValueOrDefault(projections[projections.length - 1].propertyValue, 0));
  
  return lastValue - firstValue;
}

/**
 * Safe value getter with default
 */
function getValueOrDefault<T>(...args: any[]): T {
  for (const arg of args) {
    if (arg !== undefined && arg !== null) {
      return arg as T;
    }
  }
  
  // Last argument is the default value
  return args[args.length - 1] as T;
}

/**
 * Create a default Analysis object
 */
function createDefaultAnalysis(): Analysis {
  return {
    monthlyAnalysis: {
      expenses: {
        propertyTax: 0,
        insurance: 0,
        maintenance: 0,
        propertyManagement: 0,
        vacancy: 0,
        total: 0,
      },
      cashFlow: 0,
    },
    annualAnalysis: {
      dscr: 0,
      cashOnCashReturn: 0,
      capRate: 0,
      totalInvestment: 0,
      annualNOI: 0,
      annualDebtService: 0,
      effectiveGrossIncome: 0,
    },
    longTermAnalysis: {
      yearlyProjections: [],
      projectionYears: 0,
      returns: {
        irr: 0,
        totalCashFlow: 0,
        totalAppreciation: 0,
        totalReturn: 0,
      },
      exitAnalysis: {
        projectedSalePrice: 0,
        sellingCosts: 0,
        mortgagePayoff: 0,
        netProceedsFromSale: 0,
      },
    },
    keyMetrics: {
      pricePerSqFtAtPurchase: 0,
      pricePerSqFtAtSale: 0,
      avgRentPerSqFt: 0,
    },
  };
}

/**
 * Get sample SFR data for testing
 */
export async function getSampleSFR(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/deals/sample-sfr`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample SFR: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching sample SFR:', error);
    throw error;
  }
}

/**
 * Get sample MF data for testing
 */
export async function getSampleMF(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/deals/sample-mf`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample MF: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching sample MF:', error);
    throw error;
  }
} 