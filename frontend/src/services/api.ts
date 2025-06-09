// API service for backend deal analysis and sample endpoints

import type { DealData, SFRDealData, MultiFamilyDealData } from '../types/deal';
import type { Analysis } from '../types/analysis';
import { adaptAnalysisResponse } from '../utils/analysisAdapter';
import { testAdapter } from '../utils/analysisAdapter';

const API_URL = 
  // Try Vite style env vars
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  // Try CRA style env vars
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  // Fallback
  'http://localhost:3001';

// Define a type for the formatted payload to avoid using 'any'
interface FormattedPayload {
  propertyType: string;
  propertyName: string;
  propertyAddress: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  yearBuilt: number;
  propertyTaxRate: number;
  insuranceRate: number;
  propertyManagementRate: number;
  // SFR specific
  monthlyRent?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  maintenanceCost?: number;
  // MF specific
  totalUnits?: number;
  totalSqft?: number;
  maintenanceCostPerUnit?: number;
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
    occupied: number;
  }>;
  commonAreaUtilities?: {
    electric?: number;
    water?: number;
    gas?: number;
    trash?: number;
    [key: string]: number | undefined;
  };
  // Common
  longTermAssumptions?: {
    projectionYears: number;
    annualRentIncrease: number;
    annualPropertyValueIncrease: number;
    sellingCostsPercentage: number;
    inflationRate: number;
    vacancyRate: number;
  };
}

export async function analyzeDeal(dealData: DealData): Promise<Analysis> {
  console.log('Sending analysis request with raw data:', dealData);
  
  // Create properly formatted payload with explicit number conversions
  const formattedPayload: FormattedPayload = {
    propertyType: dealData.propertyType,
    propertyName: dealData.propertyAddress?.street 
      ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}` 
      : 'Property Analysis',
    propertyAddress: dealData.propertyAddress,
    purchasePrice: Number(dealData.purchasePrice) || 0,
    downPayment: Number(dealData.downPayment) || 0, 
    interestRate: Number(dealData.interestRate) || 0,
    loanTerm: Number(dealData.loanTerm) || 30,
    yearBuilt: Number(dealData.yearBuilt) || 0,
    propertyTaxRate: Number(dealData.propertyTaxRate) || 0,
    insuranceRate: Number(dealData.insuranceRate) || 0,
    propertyManagementRate: Number(dealData.propertyManagementRate) || 0
  };
  
  // Add SFR-specific properties if it's an SFR deal
  if (dealData.propertyType === 'SFR') {
    const sfrData = dealData as SFRDealData;
    formattedPayload.monthlyRent = Number(sfrData.monthlyRent) || 0;
    formattedPayload.squareFootage = Number(sfrData.squareFootage) || 0;
    formattedPayload.bedrooms = Number(sfrData.bedrooms) || 0;
    formattedPayload.bathrooms = Number(sfrData.bathrooms) || 0;
    // Convert monthly maintenanceCost to annual by multiplying by 12
    const monthlyMaintenance = Number(sfrData.maintenanceCost) || 0;
    formattedPayload.maintenanceCost = monthlyMaintenance * 12;
    console.log('Monthly maintenance:', monthlyMaintenance, 'Annual:', formattedPayload.maintenanceCost);
  } else if (dealData.propertyType === 'MF') {
    // Add MF-specific properties if it's an MF deal
    const mfData = dealData as MultiFamilyDealData;
    formattedPayload.totalUnits = Number(mfData.totalUnits) || 0;
    formattedPayload.totalSqft = Number(mfData.totalSqft) || 0;
    formattedPayload.maintenanceCostPerUnit = Number(mfData.maintenanceCostPerUnit) || 0;
    formattedPayload.unitTypes = mfData.unitTypes || [];
    
    // Handle commonAreaUtilities with proper typing
    const utilities = mfData.commonAreaUtilities || {};
    formattedPayload.commonAreaUtilities = {
      electric: utilities.electric || 0,
      water: utilities.water || 0,
      gas: utilities.gas || 0,
      trash: utilities.trash || 0
    };
  }
  
  // Add longTermAssumptions
  if (dealData.longTermAssumptions) {
    formattedPayload.longTermAssumptions = {
      projectionYears: Number(dealData.longTermAssumptions.projectionYears) || 10,
      annualRentIncrease: Number(dealData.longTermAssumptions.annualRentIncrease) || 2,
      annualPropertyValueIncrease: Number(dealData.longTermAssumptions.annualPropertyValueIncrease) || 3,
      sellingCostsPercentage: Number(dealData.longTermAssumptions.sellingCostsPercentage) || 6,
      inflationRate: Number(dealData.longTermAssumptions.inflationRate) || 2,
      vacancyRate: Number(dealData.longTermAssumptions.vacancyRate) || 5
    };
  }
  
  console.log('Using formatted payload:', formattedPayload);
  
  try {
    const response = await fetch(`${API_URL}/api/deals/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
      
      // Store important request data in the result for the adapter to use
      if (!result.requestData) {
        result.requestData = {
          downPayment: dealData.downPayment,
          purchasePrice: dealData.purchasePrice,
          closingCosts: dealData.closingCosts || 0,
          propertyType: dealData.propertyType
        };
      }
    } catch (error) {
      console.error('Error parsing API response:', error);
      throw new Error('Invalid response format from API');
    }
    
    console.log('Parsed API response:', result);
    console.log('Response structure check:');
    console.log('- Has metrics:', !!result.metrics);
    console.log('- Has keyMetrics:', !!result.keyMetrics);
    console.log('- MonthlyAnalysis present:', !!result.monthlyAnalysis);
    console.log('- AnnualAnalysis present:', !!result.annualAnalysis);
    console.log('- LongTermAnalysis present:', !!result.longTermAnalysis);
    console.log('- Projections present:', !!result.projections);
    console.log('- ExitAnalysis present:', !!result.exitAnalysis);
    console.log('- AI Insights present:', !!result.aiInsights);
    console.log('- Request data preserved:', result.requestData);
    
    // Convert the backend response to our frontend Analysis type
    const analysis = adaptAnalysisResponse(result);
    console.log('Converted analysis result:', analysis);
    
    // Ensure longTermAnalysis.yearlyProjections is properly transferred
    if (result.longTermAnalysis && result.longTermAnalysis.yearlyProjections && 
        (!analysis.longTermAnalysis || !analysis.longTermAnalysis.yearlyProjections)) {
      if (!analysis.longTermAnalysis) {
        analysis.longTermAnalysis = {
          yearlyProjections: [],
          projectionYears: result.longTermAnalysis.projectionYears || 10,
          returns: result.longTermAnalysis.returns || {},
          exitAnalysis: result.longTermAnalysis.exitAnalysis || {}
        };
      }
      analysis.longTermAnalysis.yearlyProjections = result.longTermAnalysis.yearlyProjections;
      console.log('Added yearlyProjections data:', analysis.longTermAnalysis.yearlyProjections);
    }
    
    // Check key fields in the converted analysis with null checks
    console.log('Analysis validation:');
    console.log('- Monthly cashFlow:', analysis?.monthlyAnalysis?.cashFlow);
    console.log('- DSCR:', analysis?.annualAnalysis?.dscr);
    console.log('- CapRate:', analysis?.annualAnalysis?.capRate);
    console.log('- CashOnCash:', analysis?.annualAnalysis?.cashOnCashReturn);
    console.log('- NOI:', analysis?.annualAnalysis?.annualNOI);
    console.log('- KeyMetrics:', analysis?.keyMetrics ? JSON.stringify(analysis.keyMetrics, null, 2) : 'undefined');
    
    return analysis;
  } catch (error) {
    console.error('Error in analyzeDeal:', error);
    throw error;
  }
}

export async function getSampleSFR(): Promise<DealData> {
  try {
    const response = await fetch(`${API_URL}/api/deals/sample-sfr`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample SFR: ${response.status}`);
    }
    const data = await response.json();
    console.log('Sample SFR data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching sample SFR:', error);
    throw error;
  }
}

export async function getSampleMF(): Promise<DealData> {
  try {
    const response = await fetch(`${API_URL}/api/deals/sample-mf`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sample MF: ${response.status}`);
    }
    const data = await response.json();
    console.log('Sample MF data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching sample MF:', error);
    throw error;
  }
}

// Only run the test in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Running adapter test in development mode...');
  const testResult = testAdapter();
  console.log('Test completed successfully:', !!testResult);
} 