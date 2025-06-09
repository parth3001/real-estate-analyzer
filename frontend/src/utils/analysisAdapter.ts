/**
 * Analysis adapter utility
 * Converts backend API responses to frontend Analysis type
 */

import type { Analysis } from '../types/analysis';

/**
 * Backend response structure from API.md
 */
interface BackendResponse {
  monthlyAnalysis?: {
    income?: {
      gross?: number;
      effective?: number;
    };
    expenses?: {
      operating?: number;
      debt?: number;
      total?: number;
      breakdown?: {
        propertyTax?: number;
        insurance?: number;
        maintenance?: number;
        propertyManagement?: number;
        vacancy?: number;
        utilities?: number;
        [key: string]: number | undefined;
      };
    };
    cashFlow?: number;
  };
  annualAnalysis?: {
    income?: number;
    expenses?: number;
    noi?: number;
    debtService?: number;
    cashFlow?: number;
    dscr?: number;
    cashOnCashReturn?: number;
    capRate?: number;
    totalInvestment?: number;
  };
  longTermAnalysis?: {
    yearlyProjections?: Array<{
      year?: number;
      cashFlow?: number;
      propertyValue?: number;
      equity?: number;
      propertyTax?: number;
      insurance?: number;
      maintenance?: number;
      propertyManagement?: number;
      vacancy?: number;
      operatingExpenses?: number;
      noi?: number;
      debtService?: number;
      grossRent?: number;
      mortgageBalance?: number;
      appreciation?: number;
      totalReturn?: number;
      [key: string]: any;
    }>;
    projectionYears?: number;
    returns?: {
      irr?: number;
      totalCashFlow?: number;
      totalAppreciation?: number;
      totalReturn?: number;
    };
    exitAnalysis?: {
      projectedSalePrice?: number;
      sellingCosts?: number;
      mortgagePayoff?: number;
      netProceedsFromSale?: number;
    };
  };
  keyMetrics?: {
    noi?: number;
    capRate?: number;
    cashOnCashReturn?: number;
    irr?: number;
    dscr?: number;
    operatingExpenseRatio?: number;
    pricePerSqFt?: number;
    pricePerSqft?: number;
    rentPerSqFt?: number;
    rentPerUnit?: number;
    pricePerUnit?: number;
    averageUnitSize?: number;
    totalUnits?: number;
    totalSqft?: number;
    [key: string]: any;
  };
  metrics?: any; // Some backends might still return this instead of keyMetrics
  projections?: Array<any>; // Some backends might return this instead of longTermAnalysis.yearlyProjections
  exitAnalysis?: any; // Some backends might return this instead of longTermAnalysis.exitAnalysis
  aiInsights?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    investmentScore?: number;
  };
  requestData?: {
    purchasePrice?: number;
    downPayment?: number;
    closingCosts?: number;
    propertyType?: string;
    [key: string]: any;
  };
  analysis?: BackendResponse; // For MongoDB response where analysis is nested
  _id?: string; // MongoDB ID
}

/**
 * Create an empty analysis object with default values
 */
function createEmptyAnalysis(): Analysis {
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
    aiInsights: undefined,
  };
}

/**
 * Get a value safely with a default if not available
 */
function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  // Special case for MongoDB _id which might need to be mapped to id
  if (path === 'id' && obj._id) {
    return obj._id as T;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current !== undefined && current !== null ? current as T : defaultValue;
}

/**
 * Calculate total investment from available data
 */
function calculateTotalInvestment(response: BackendResponse): number {
  // Try to get from metrics or keyMetrics
  const totalInvestment = safeGet(response.keyMetrics, 'totalInvestment', 0) || 
                         safeGet(response.metrics, 'totalInvestment', 0) ||
                         safeGet(response.annualAnalysis, 'totalInvestment', 0);
  
  if (totalInvestment > 0) return totalInvestment;
  
  // Try to calculate from request data
  const downPayment = safeGet(response.requestData, 'downPayment', 0) ||
                     safeGet(response, 'downPayment', 0);
                     
  const closingCosts = safeGet(response.requestData, 'closingCosts', 0) ||
                      safeGet(response, 'closingCosts', 0);
  
  if (downPayment > 0) {
    return downPayment + closingCosts;
  }
  
  // Default to zero if we can't calculate
  return 0;
}

/**
 * Extract key metrics from the response
 */
function extractKeyMetrics(response: BackendResponse) {
  // Handle MongoDB nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    console.log('Found nested analysis structure, using it for metrics');
    response = { ...response, ...response.analysis };
  }
  
  // Use either keyMetrics or metrics field, whichever is available
  const metricsData = response.keyMetrics || response.metrics || {};
  
  console.log('Metrics data source:', metricsData);

  // Extract NOI from metrics or annual analysis
  const noi = safeGet(metricsData, 'noi', 0) || 
              safeGet(response.annualAnalysis, 'noi', 0);
  
  // Extract core metrics with fallbacks
  const dscr = safeGet(metricsData, 'dscr', 0) ||
               safeGet(response.annualAnalysis, 'dscr', 0);
               
  const cashOnCashReturn = safeGet(metricsData, 'cashOnCashReturn', 0) ||
                          safeGet(response.annualAnalysis, 'cashOnCashReturn', 0);
                          
  const capRate = safeGet(metricsData, 'capRate', 0) ||
                 safeGet(response.annualAnalysis, 'capRate', 0);
                 
  const irr = safeGet(metricsData, 'irr', 0) ||
             safeGet(response.longTermAnalysis, 'returns.irr', 0);
  
  // Calculate price per square foot metrics
  let pricePerSqFtAtPurchase = safeGet(metricsData, 'pricePerSqFt', 0) || 
                              safeGet(metricsData, 'pricePerSqft', 0);
                     
  // If we don't have price per sqft, try to calculate it
  if (pricePerSqFtAtPurchase === 0) {
    const purchasePrice = safeGet(response, 'purchasePrice', 0) || 
                         safeGet(response.requestData, 'purchasePrice', 0);
    
    const squareFootage = safeGet(response, 'squareFootage', 0) || 
                         safeGet(response.requestData, 'squareFootage', 0);
    
    if (purchasePrice > 0 && squareFootage > 0) {
      pricePerSqFtAtPurchase = purchasePrice / squareFootage;
      console.log(`Calculated pricePerSqFt: ${pricePerSqFtAtPurchase} from price ${purchasePrice} / sqft ${squareFootage}`);
    }
  }
  
  // Calculate projected sale price per sqft
  let pricePerSqFtAtSale = safeGet(metricsData, 'pricePerSqFtAtSale', 0);
  
  if (pricePerSqFtAtSale === 0) {
    const projectedSalePrice = safeGet(response.longTermAnalysis, 'exitAnalysis.projectedSalePrice', 0);
    
    const squareFootage = safeGet(response, 'squareFootage', 0) || 
                         safeGet(response.requestData, 'squareFootage', 0);
    
    if (projectedSalePrice > 0 && squareFootage > 0) {
      pricePerSqFtAtSale = projectedSalePrice / squareFootage;
      console.log(`Calculated pricePerSqFtAtSale: ${pricePerSqFtAtSale} from sale price ${projectedSalePrice} / sqft ${squareFootage}`);
    }
  }
  
  // Calculate avg rent per sqft
  let avgRentPerSqFt = safeGet(metricsData, 'rentPerSqFt', 0) || 
                      safeGet(metricsData, 'avgRentPerSqFt', 0);
  
  if (avgRentPerSqFt === 0) {
    const monthlyRent = safeGet(response, 'monthlyRent', 0) || 
                       safeGet(response.requestData, 'monthlyRent', 0);
    
    const squareFootage = safeGet(response, 'squareFootage', 0) || 
                         safeGet(response.requestData, 'squareFootage', 0);
    
    if (monthlyRent > 0 && squareFootage > 0) {
      avgRentPerSqFt = (monthlyRent * 12) / squareFootage;
      console.log(`Calculated avgRentPerSqFt: ${avgRentPerSqFt} from rent ${monthlyRent} * 12 / sqft ${squareFootage}`);
    }
  }
  
  // Calculate total investment
  const totalInvestment = calculateTotalInvestment(response);
  
  return {
    keyMetrics: {
      pricePerSqFtAtPurchase,
      pricePerSqFtAtSale,
      avgRentPerSqFt,
      cashOnCashReturn,
      capRate,
      dscr,
      irr,
      noi,
      totalInvestment
    }
  };
}

/**
 * Extract monthly analysis from the response
 */
function extractMonthlyAnalysis(response: BackendResponse) {
  // Handle MongoDB nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    response = { ...response, ...response.analysis };
  }
  
  const monthlyAnalysis = response.monthlyAnalysis || {};
  const expenses = monthlyAnalysis.expenses || {};
  const breakdown = expenses.breakdown || {};
  
  console.log('Monthly analysis data:', monthlyAnalysis);
  console.log('Monthly expenses:', expenses);
  console.log('Monthly expense breakdown:', breakdown);
  
  return {
    expenses: {
      propertyTax: safeGet(breakdown, 'propertyTax', 0),
      insurance: safeGet(breakdown, 'insurance', 0),
      maintenance: safeGet(breakdown, 'maintenance', 0),
      propertyManagement: safeGet(breakdown, 'propertyManagement', 0),
      vacancy: safeGet(breakdown, 'vacancy', 0),
      total: safeGet(expenses, 'total', 0),
    },
    cashFlow: safeGet(monthlyAnalysis, 'cashFlow', 0),
  };
}

/**
 * Extract annual analysis from the response
 */
function extractAnnualAnalysis(response: BackendResponse, extractedMetrics: any) {
  // Handle MongoDB nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    response = { ...response, ...response.analysis };
  }
  
  const annualAnalysis = response.annualAnalysis || {};
  
  console.log('Annual analysis data:', annualAnalysis);
  
  return {
    dscr: extractedMetrics.metrics.dscr,
    cashOnCashReturn: extractedMetrics.metrics.cashOnCashReturn,
    capRate: extractedMetrics.metrics.capRate,
    totalInvestment: extractedMetrics.metrics.totalInvestment,
    annualNOI: safeGet(annualAnalysis, 'noi', 0),
    annualDebtService: safeGet(annualAnalysis, 'debtService', 0),
    effectiveGrossIncome: safeGet(annualAnalysis, 'income', 0),
  };
}

/**
 * Extract long term analysis from the response
 */
function extractLongTermAnalysis(response: BackendResponse) {
  // Handle MongoDB nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    response = { ...response, ...response.analysis };
  }
  
  // Try both structure patterns
  let yearlyProjections = safeGet(response, 'longTermAnalysis.yearlyProjections', []);
  if (!yearlyProjections || yearlyProjections.length === 0) {
    yearlyProjections = safeGet(response, 'projections', []);
  }
  
  console.log('Yearly projections data source:', yearlyProjections);
  console.log('Projections count:', yearlyProjections?.length || 0);

  // Safely get values from longTermAnalysis with fallbacks
  const projectionYears = safeGet(response, 'longTermAnalysis.projectionYears', 10);
  const returns = safeGet(response, 'longTermAnalysis.returns', {});
  const exitAnalysis = safeGet(response, 'longTermAnalysis.exitAnalysis', {}) || 
                      safeGet(response, 'exitAnalysis', {});
  
  // Map projections to our expected structure with fallback values
  const mappedProjections = (yearlyProjections || []).map((p: any) => ({
    year: safeGet(p, 'year', 0),
    cashFlow: safeGet(p, 'cashFlow', 0),
    propertyValue: safeGet(p, 'propertyValue', 0),
    equity: safeGet(p, 'equity', 0),
    propertyTax: safeGet(p, 'propertyTax', 0),
    insurance: safeGet(p, 'insurance', 0),
    maintenance: safeGet(p, 'maintenance', 0),
    propertyManagement: safeGet(p, 'propertyManagement', 0),
    vacancy: safeGet(p, 'vacancy', 0),
    operatingExpenses: safeGet(p, 'operatingExpenses', 0),
    noi: safeGet(p, 'noi', 0),
    debtService: safeGet(p, 'debtService', 0),
    grossRent: safeGet(p, 'grossRent', 0),
    mortgageBalance: safeGet(p, 'mortgageBalance', 0),
    appreciation: safeGet(p, 'appreciation', 0),
    totalReturn: safeGet(p, 'totalReturn', 0),
  }));
  
  // Calculate total cash flow and appreciation if we have projections
  let totalCashFlow = 0;
  let totalAppreciation = 0;
  
  if (mappedProjections.length > 0) {
    totalCashFlow = mappedProjections.reduce((sum, p) => sum + p.cashFlow, 0);
    
    if (mappedProjections.length > 1) {
      const firstValue = mappedProjections[0].propertyValue;
      const lastValue = mappedProjections[mappedProjections.length - 1].propertyValue;
      totalAppreciation = lastValue - firstValue;
    }
  }
  
  return {
    yearlyProjections: mappedProjections,
    projectionYears: mappedProjections.length,
    returns: {
      irr: safeGet(returns, 'irr', 0),
      totalCashFlow: safeGet(returns, 'totalCashFlow', totalCashFlow),
      totalAppreciation: safeGet(returns, 'totalAppreciation', totalAppreciation),
      totalReturn: safeGet(returns, 'totalReturn', 0),
    },
    exitAnalysis: {
      projectedSalePrice: safeGet(exitAnalysis, 'projectedSalePrice', 0),
      sellingCosts: safeGet(exitAnalysis, 'sellingCosts', 0),
      mortgagePayoff: safeGet(exitAnalysis, 'mortgagePayoff', 0),
      netProceedsFromSale: safeGet(exitAnalysis, 'netProceedsFromSale', 0),
    },
  };
}

/**
 * Extract AI insights from the response
 */
function extractAIInsights(response: BackendResponse) {
  // Handle MongoDB nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    response = { ...response, ...response.analysis };
  }
  
  const aiInsights = response.aiInsights;
  
  if (!aiInsights) {
    console.log('No AI insights found in the response');
    return undefined;
  }
  
  console.log('AI insights found:', Object.keys(aiInsights).join(', '));
  
  return {
    investmentScore: safeGet(aiInsights, 'investmentScore', 0),
    summary: safeGet(aiInsights, 'summary', ''),
    strengths: safeGet(aiInsights, 'strengths', []),
    weaknesses: safeGet(aiInsights, 'weaknesses', []),
    recommendations: safeGet(aiInsights, 'recommendations', []),
  };
}

/**
 * Convert a backend response to the frontend Analysis type
 */
export function adaptAnalysisResponse(response: BackendResponse): Analysis {
  if (!response) {
    console.error('Invalid analysis response:', response);
    return createEmptyAnalysis();
  }
  
  console.log('Processing backend response:', response);
  
  // Handle MongoDB structure where analysis is nested
  if (response.analysis && typeof response.analysis === 'object') {
    console.log('Found nested MongoDB analysis structure');
    // We'll handle the nested structure in each extract function
  }
  
  try {
    // Extract all components of the analysis
    const extractedMetrics = extractKeyMetrics(response);
    const monthlyAnalysis = extractMonthlyAnalysis(response);
    const annualAnalysis = extractAnnualAnalysis(response, extractedMetrics);
    const longTermAnalysis = extractLongTermAnalysis(response);
    const aiInsights = extractAIInsights(response);
    
    // Combine into the final analysis object
    const result = {
      monthlyAnalysis,
      annualAnalysis,
      longTermAnalysis,
      keyMetrics: extractedMetrics.keyMetrics,
      aiInsights,
    };
    
    console.log('Final adapted analysis result:', result);
    return result;
  } catch (error) {
    console.error('Error adapting analysis response:', error);
    return createEmptyAnalysis();
  }
}

/**
 * Add a test function to verify the adapter is working
 */
export function testAdapter() {
  console.log('Testing analysis adapter...');
  
  // Sample backend response matching the MongoDB structure
  const sampleResponse = {
    _id: '12345',
    propertyName: 'Test Property',
    propertyType: 'SFR',
    propertyAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    purchasePrice: 300000,
    downPayment: 60000,
    analysis: {
      monthlyAnalysis: {
        income: {
          gross: 2000,
          effective: 1900
        },
        expenses: {
          operating: 885,
          debt: 1078,
          total: 1963,
          breakdown: {
            propertyTax: 300,
            insurance: 125,
            maintenance: 100,
            propertyManagement: 160,
            vacancy: 100,
            utilities: 0,
            repairsAndMaintenance: 100
          }
        },
        cashFlow: 37
      },
      annualAnalysis: {
        income: 24000,
        expenses: 10620,
        noi: 13380,
        debtService: 12936,
        cashFlow: 444,
        dscr: 1.03,
        cashOnCashReturn: 0.74,
        capRate: 4.46,
        totalInvestment: 60000
      },
      longTermAnalysis: {
        yearlyProjections: [
          {
            year: 1,
            cashFlow: 444,
            propertyValue: 300000,
            equity: 60000,
            propertyTax: 3600,
            insurance: 1500,
            maintenance: 1200,
            propertyManagement: 1920,
            vacancy: 1200,
            operatingExpenses: 10620,
            noi: 13380,
            debtService: 12936,
            grossRent: 24000,
            mortgageBalance: 240000,
            appreciation: 0,
            totalReturn: 444
          },
          {
            year: 2,
            cashFlow: 573,
            propertyValue: 309000,
            equity: 72573,
            propertyTax: 3708,
            insurance: 1545,
            maintenance: 1236,
            propertyManagement: 1958,
            vacancy: 1224,
            operatingExpenses: 10939,
            noi: 13541,
            debtService: 12936,
            grossRent: 24480,
            mortgageBalance: 236427,
            appreciation: 9000,
            totalReturn: 9573
          }
        ],
        returns: {
          irr: 8.5,
          totalCashFlow: 5730,
          totalAppreciation: 90000,
          totalReturn: 95730
        },
        exitAnalysis: {
          projectedSalePrice: 390000,
          sellingCosts: 23400,
          mortgagePayoff: 210000,
          netProceedsFromSale: 156600
        }
      },
      keyMetrics: {
        noi: 13380,
        capRate: 4.46,
        cashOnCashReturn: 0.74,
        irr: 8.5,
        dscr: 1.03,
        operatingExpenseRatio: 44.25,
        pricePerSqFt: 200,
        rentPerSqFt: 1.33
      },
      aiInsights: {
        summary: "This property has a marginal cash flow with a low cash-on-cash return.",
        strengths: ["Good location", "Below market purchase price", "New construction"],
        weaknesses: ["Low cash flow", "High property taxes", "Expensive insurance"],
        recommendations: ["Negotiate purchase price", "Shop for better insurance", "Increase rent"],
        investmentScore: 65
      }
    },
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2023-06-01T00:00:00.000Z'
  };
  
  // Run the adapter
  const result = adaptAnalysisResponse(sampleResponse);
  
  // Output the result to verify key fields
  console.log('Adapter test result:');
  console.log('Monthly cashFlow:', result.monthlyAnalysis.cashFlow);
  console.log('DSCR:', result.annualAnalysis.dscr);
  console.log('Cap Rate:', result.annualAnalysis.capRate);
  console.log('Cash on Cash Return:', result.annualAnalysis.cashOnCashReturn);
  console.log('Total Investment:', result.annualAnalysis.totalInvestment);
  console.log('NOI:', result.annualAnalysis.annualNOI);
  console.log('Total Projections:', result.longTermAnalysis.yearlyProjections.length);
  console.log('Price Per SqFt:', result.keyMetrics.pricePerSqFtAtPurchase);
  console.log('AI Investment Score:', result.aiInsights?.investmentScore);
  
  return result;
} 