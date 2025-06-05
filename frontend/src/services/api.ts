// API service for backend deal analysis and sample endpoints

import type { DealData } from '../types/deal';
import type { Analysis } from '../types/analysis';
import { adaptAnalysisResponse } from '../utils/analysisAdapter';
import { testAdapter } from '../utils/analysisAdapter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function analyzeDeal(dealData: DealData): Promise<Analysis> {
  console.log('Sending analysis request with data:', dealData);
  
  try {
    const response = await fetch(`${API_URL}/api/deals/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealData),
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