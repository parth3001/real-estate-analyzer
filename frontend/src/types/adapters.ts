/**
 * Adapters to bridge the gap between frontend and backend types
 * This file provides functions to convert between the different type structures
 */

import type { Analysis } from './analysis';
import type { AnalysisResult, CommonMetrics } from './backendTypes';
import type { SFRMetrics, MultiFamilyMetrics } from './metrics';

/**
 * Type for extended metrics data that includes both standard and custom properties
 */
interface ExtendedMetrics extends CommonMetrics {
  pricePerSqFt?: number;
  pricePerSqft?: number;
  rentPerSqFt?: number;
  pricePerUnit?: number;
  averageUnitSize?: number;
  totalUnits?: number;
  totalSqft?: number;
  rentPerUnit?: number;
  downPayment?: number;
  closingCosts?: number;
  [key: string]: unknown;
}

/**
 * Converts an AnalysisResult from the backend to the frontend Analysis type
 */
export function adaptToAnalysis<T extends CommonMetrics>(result: AnalysisResult<T>): Analysis {
  // Add null checks to handle undefined metrics
  if (!result) {
    console.error('Invalid analysis result:', result);
    return createEmptyAnalysis();
  }
  
  // Extract data from the analysis result
  const monthlyAnalysis = result.monthlyAnalysis || { 
    income: { gross: 0, effective: 0 },
    expenses: { operating: 0, debt: 0, total: 0, breakdown: {} },
    cashFlow: 0
  };
  
  const annualAnalysis = result.annualAnalysis || {
    income: 0,
    expenses: 0,
    noi: 0,
    debtService: 0,
    cashFlow: 0
  };
  
  // Check for either metrics or keyMetrics in the response
  const metricsData = result.metrics || result.keyMetrics;
  
  // Check for either projections or longTermAnalysis in the response
  const projections = result.projections || (result.longTermAnalysis && Array.isArray(result.longTermAnalysis.yearlyProjections) ? 
    result.longTermAnalysis.yearlyProjections : []);
  
  const exitAnalysis = result.exitAnalysis || (result.longTermAnalysis && result.longTermAnalysis.exitAnalysis ?
    result.longTermAnalysis.exitAnalysis : {
      projectedSalePrice: 0,
      sellingCosts: 0,
      mortgagePayoff: 0,
      netProceedsFromSale: 0,
      totalReturn: 0
    });
  
  if (!metricsData) {
    console.error('Analysis result missing metrics data:', result);
    
    // Try to extract metrics from other fields
    if (annualAnalysis) {
      console.log('Attempting to create metrics from annual analysis:', annualAnalysis);
    }
    
    return createEmptyAnalysis();
  }
  
  console.log('Metrics data found:', metricsData);
  console.log('Request data available:', result.requestData);
  console.log('Projections found:', projections ? projections.length : 0);
  console.log('Exit analysis found:', exitAnalysis ? 'yes' : 'no');
  
  // Convert metrics data to our extended type
  const extendedMetrics = metricsData as unknown as ExtendedMetrics;
  
  // Determine if we're dealing with SFR or MF metrics by checking for SFR-specific fields
  const isSFR = 'pricePerSqFt' in metricsData && 'rentPerSqFt' in metricsData;
  console.log('Is SFR property:', isSFR);
  
  // Ensure breakdown exists
  const expenseBreakdown = monthlyAnalysis.expenses?.breakdown || {};
  
  // Extract price per square foot accounting for both spelling variations
  let pricePerSqFt = 0;
  let pricePerSqFtAtSale = 0;
  let avgRentPerSqFt = 0;
  
  if (isSFR) {
    // SFR metrics
    pricePerSqFt = extendedMetrics.pricePerSqFt || 0;
    pricePerSqFtAtSale = pricePerSqFt * 1.1; // Assume 10% appreciation at sale
    avgRentPerSqFt = extendedMetrics.rentPerSqFt || 0;
    console.log(`SFR metrics extracted: pricePerSqFt=${pricePerSqFt}, avgRentPerSqFt=${avgRentPerSqFt}`);
  } else {
    // MF metrics - check for both spelling variations and calculate from other metrics if needed
    pricePerSqFt = extendedMetrics.pricePerSqFt || extendedMetrics.pricePerSqft || 0;
    
    // If we still don't have a value, calculate it from price per unit and average unit size
    if (pricePerSqFt === 0 && extendedMetrics.pricePerUnit) {
      const averageUnitSize = extendedMetrics.averageUnitSize || 
                             (extendedMetrics.totalSqft && extendedMetrics.totalUnits ? 
                               extendedMetrics.totalSqft / extendedMetrics.totalUnits : 1000);
      pricePerSqFt = extendedMetrics.pricePerUnit / averageUnitSize;
    }
    
    pricePerSqFtAtSale = pricePerSqFt * 1.1; // Assume 10% appreciation at sale
    avgRentPerSqFt = extendedMetrics.rentPerUnit ? 
                     extendedMetrics.rentPerUnit / 
                     (extendedMetrics.averageUnitSize || 1000) : 0;
    
    console.log(`MF metrics extracted: pricePerSqFt=${pricePerSqFt}, avgRentPerSqFt=${avgRentPerSqFt}`);
  }
  
  // Calculate total investment from request data if available
  let totalInvestment = 0;
  if (result.requestData) {
    totalInvestment = result.requestData.downPayment + (result.requestData.closingCosts || 0);
    console.log(`Total investment calculated from request data: ${totalInvestment}`);
  } else {
    totalInvestment = calculateTotalInvestment(result);
  }
  
  // Ensure we have a valid NOI
  const noi = extendedMetrics.noi || annualAnalysis.noi || 0;
  
  // Ensure we have all required metrics
  const dscr = extendedMetrics.dscr || 0;
  const cashOnCashReturn = extendedMetrics.cashOnCashReturn || 0;
  const capRate = extendedMetrics.capRate || 0;
  const irr = extendedMetrics.irr || 0;
  
  console.log(`Final metrics values: dscr=${dscr}, cashOnCashReturn=${cashOnCashReturn}, capRate=${capRate}, noi=${noi}, totalInvestment=${totalInvestment}`);
  
  // For metrics that are inexplicably 0, calculate them ourselves
  const calculatedDSCR = dscr === 0 && noi > 0 && annualAnalysis.debtService > 0 ? 
    noi / annualAnalysis.debtService : dscr;
    
  const calculatedCapRate = capRate === 0 && noi > 0 && result.requestData?.purchasePrice ? 
    (noi / result.requestData.purchasePrice) * 100 : capRate;
    
  const calculatedCashOnCash = cashOnCashReturn === 0 && annualAnalysis.cashFlow > 0 && totalInvestment > 0 ? 
    (annualAnalysis.cashFlow / totalInvestment) * 100 : cashOnCashReturn;
  
  return {
    monthlyAnalysis: {
      expenses: {
        // Convert the expense breakdown to the format expected by the frontend
        propertyTax: expenseBreakdown.propertyTax || 0,
        insurance: expenseBreakdown.insurance || 0,
        maintenance: expenseBreakdown.maintenance || 0,
        propertyManagement: expenseBreakdown.propertyManagement || 0,
        vacancy: expenseBreakdown.vacancy || 0,
        total: monthlyAnalysis.expenses?.total || 0,
      },
      cashFlow: monthlyAnalysis.cashFlow || 0,
    },
    annualAnalysis: {
      dscr: calculatedDSCR,
      cashOnCashReturn: calculatedCashOnCash,
      capRate: calculatedCapRate,
      totalInvestment: totalInvestment,
      annualNOI: noi,
      annualDebtService: annualAnalysis.debtService || 0,
      effectiveGrossIncome: annualAnalysis.income || 0,
    },
    longTermAnalysis: {
      yearlyProjections: projections.map(p => ({
        year: p.year || 0,
        cashFlow: p.cashFlow || 0,
        propertyValue: p.propertyValue || 0,
        equity: p.equity || 0,
        propertyTax: p.propertyTax || 0,
        insurance: p.insurance || 0,
        maintenance: p.maintenance || 0,
        propertyManagement: p.propertyManagement || 0,
        vacancy: p.vacancy || 0,
        operatingExpenses: p.operatingExpenses || 0,
        noi: p.noi || 0,
        debtService: p.debtService || 0,
        grossRent: p.grossRent || 0,
        mortgageBalance: p.mortgageBalance || 0,
        appreciation: p.appreciation || 0,
        totalReturn: p.totalReturn || 0,
      })),
      projectionYears: projections.length || 0,
      returns: {
        irr: irr,
        totalCashFlow: projections.length > 0 ? 
          projections.reduce((sum, p) => sum + (p.cashFlow || 0), 0) : 0,
        totalAppreciation: projections.length > 1 ? 
          projections[projections.length - 1].propertyValue - projections[0].propertyValue : 0,
        totalReturn: exitAnalysis.totalReturn || 0,
      },
      exitAnalysis: {
        projectedSalePrice: exitAnalysis.projectedSalePrice || 0,
        sellingCosts: exitAnalysis.sellingCosts || 0,
        mortgagePayoff: exitAnalysis.mortgagePayoff || 0,
        netProceedsFromSale: exitAnalysis.netProceedsFromSale || 0,
      },
    },
    aiInsights: result.aiInsights ? {
      investmentScore: result.aiInsights.investmentScore || 0,
      summary: result.aiInsights.summary || '',
      strengths: result.aiInsights.strengths || [],
      weaknesses: result.aiInsights.weaknesses || [],
      recommendations: result.aiInsights.recommendations || [],
    } : undefined,
    keyMetrics: {
      pricePerSqFtAtPurchase: pricePerSqFt,
      pricePerSqFtAtSale: pricePerSqFtAtSale,
      avgRentPerSqFt: avgRentPerSqFt,
    },
  };
}

/**
 * Calculates total investment from available data
 */
function calculateTotalInvestment<T extends CommonMetrics>(result: AnalysisResult<T>): number {
  // Try to get from metrics if available
  if (result.metrics && 'totalInvestment' in result.metrics) {
    return (result.metrics as unknown as { totalInvestment: number }).totalInvestment || 0;
  }
  
  if (result.keyMetrics && 'totalInvestment' in result.keyMetrics) {
    return (result.keyMetrics as unknown as { totalInvestment: number }).totalInvestment || 0;
  }
  
  // Try to extract from the data directly if it exists
  const metricsData = result.metrics || result.keyMetrics;
  if (metricsData) {
    const extendedMetrics = metricsData as unknown as ExtendedMetrics;
    const downPayment = extendedMetrics.downPayment || 0;
    const closingCosts = extendedMetrics.closingCosts || 0;
    if (downPayment > 0) {
      return downPayment + closingCosts;
    }
  }
  
  // Use request data if available
  if (result.requestData) {
    return result.requestData.downPayment + (result.requestData.closingCosts || 0);
  }
  
  // Calculate from exit analysis if available
  if (result.exitAnalysis && result.exitAnalysis.totalReturn && 
      result.projections && result.projections.length > 0) {
    const cumulativeCashFlow = result.projections.reduce((sum, p) => sum + (p.cashFlow || 0), 0);
    const lastProjection = result.projections[result.projections.length - 1];
    const totalAppreciation = lastProjection.propertyValue - (result.projections[0].propertyValue || 0);
    
    // Approximate the total investment from total return and components
    if (cumulativeCashFlow + totalAppreciation > 0) {
      return (result.exitAnalysis.totalReturn / (cumulativeCashFlow + totalAppreciation)) * 100;
    }
  }
  
  // Default to a reasonable value if we can't calculate
  return 0;
}

/**
 * Creates an empty Analysis object with default values
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
  };
}

/**
 * Type guard to check if metrics are SFRMetrics
 */
export function isSFRMetrics(metrics: CommonMetrics): metrics is SFRMetrics {
  return 'pricePerSqFt' in metrics && 'rentPerSqFt' in metrics;
}

/**
 * Type guard to check if metrics are MultiFamilyMetrics
 */
export function isMultiFamilyMetrics(metrics: CommonMetrics): metrics is MultiFamilyMetrics {
  return 'pricePerUnit' in metrics && 'pricePerSqFt' in metrics;
} 