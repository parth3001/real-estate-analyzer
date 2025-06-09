// Test script for verifying backend API connectivity
const fetch = require('node-fetch');

// Backend API URL
const API_URL = 'http://localhost:3001';

// Test data with properly formatted fields for SFR analysis
const testData = {
  propertyType: 'SFR',
  propertyName: 'Test Property',
  propertyAddress: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345'
  },
  purchasePrice: 300000,
  downPayment: 60000,
  interestRate: 4.5,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceCost: 200,
  propertyManagementRate: 8,
  monthlyRent: 2000,
  squareFootage: 1500,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2000,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5
  }
};

// Function to test the analyze endpoint
const testAnalyzeEndpoint = async () => {
  console.log('Testing /api/deals/analyze endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/api/deals/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('Analysis successful!');
    console.log('Monthly Cash Flow:', result.monthlyAnalysis.cashFlow);
    console.log('Annual Cash Flow:', result.annualAnalysis.cashFlow);
    console.log('Cap Rate:', result.keyMetrics.capRate);
    console.log('Cash on Cash Return:', result.keyMetrics.cashOnCashReturn);
    console.log('DSCR:', result.keyMetrics.dscr);
    
    return result;
  } catch (error) {
    console.error('Error testing analyze endpoint:', error);
    throw error;
  }
};

// Function to test creating a deal
const testCreateDeal = async (analysisResult) => {
  console.log('\nTesting /api/deals endpoint...');
  
  const dealData = {
    ...testData,
    analysis: analysisResult
  };
  
  try {
    const response = await fetch(`${API_URL}/api/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealData),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('Deal created successfully!');
    console.log('Deal ID:', result._id);
    
    return result;
  } catch (error) {
    console.error('Error testing create deal endpoint:', error);
    throw error;
  }
};

// Run the tests
const runTests = async () => {
  try {
    // First test the analyze endpoint
    const analysisResult = await testAnalyzeEndpoint();
    
    // Then test creating a deal with the analysis result
    await testCreateDeal(analysisResult);
    
    console.log('\nAll tests passed successfully! ✅');
  } catch (error) {
    console.error('\nTests failed:', error);
    console.log('\nMake sure the backend server is running on http://localhost:3001');
  }
};

runTests(); 