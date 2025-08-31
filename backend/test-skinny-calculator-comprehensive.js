/**
 * Comprehensive Skinny Calculator Test via API Integration
 * Tests all supported property types through actual deal creation with portfolioId
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let authToken = null;
let testPortfolioId = null;

console.log(`${colors.bold}============================================================
Comprehensive Skinny Calculator API Test
Testing All Supported Property Types via Portfolio Integration
============================================================${colors.reset}`);

// Test data for all property types with proper schema format
const testProperties = {
  SFR: {
    propertyName: 'Test Single Family Home',
    propertyType: 'SFR',
    propertyAddress: {
      street: '123 Test Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    },
    purchasePrice: 450000,
    downPayment: 90000,
    interestRate: 7.5,
    loanTerm: 30,
    monthlyRent: 3200,
    propertyTaxRate: 2.1,
    insuranceRate: 0.8,
    propertyManagementRate: 8,
    yearBuilt: 2015,
    squareFootage: 2000,
    bedrooms: 4,
    bathrooms: 3,
    maintenanceCost: 300,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 4,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 5
    }
  },

  MF: {
    propertyName: 'Test Multi-Family Building',
    propertyType: 'MF',
    propertyAddress: {
      street: '456 Apartment Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201'
    },
    purchasePrice: 850000,
    downPayment: 170000,
    interestRate: 7.8,
    loanTerm: 30,
    propertyTaxRate: 2.3,
    insuranceRate: 1.0,
    propertyManagementRate: 8,
    yearBuilt: 2010,
    totalUnits: 8,
    totalSqft: 6400,
    maintenanceCostPerUnit: 100,
    unitTypes: [
      { type: '2BR', count: 4, monthlyRent: 1800, occupied: 4, sqft: 800 },
      { type: '1BR', count: 4, monthlyRent: 1400, occupied: 3, sqft: 600 }
    ],
    commonAreaUtilities: {
      electric: 200,
      water: 150,
      gas: 100,
      trash: 50
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 4,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 5,
      capitalExpenditureRate: 5,
      commonAreaMaintenanceRate: 2
    }
  },

  COMMERCIAL_OFFICE: {
    propertyName: 'Test Office Building',
    propertyType: 'COMMERCIAL_OFFICE',
    propertyAddress: {
      street: '789 Business Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77002'
    },
    purchasePrice: 1500000,
    downPayment: 450000,
    interestRate: 8.0,
    loanTerm: 25,
    propertyTaxRate: 2.5,
    insuranceRate: 0.6,
    propertyManagementRate: 5,
    yearBuilt: 2018,
    leasableSquareFootage: 8000,
    leaseRatePerSqft: 28,
    occupancyRate: 90,
    tenantPaysNNN: true,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 2.5,
      annualPropertyValueIncrease: 3.5,
      sellingCostsPercentage: 7,
      inflationRate: 2.5,
      vacancyRate: 10
    }
  },

  SELF_STORAGE: {
    propertyName: 'Test Self Storage Facility',
    propertyType: 'SELF_STORAGE',
    propertyAddress: {
      street: '321 Storage Way',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    },
    purchasePrice: 800000,
    downPayment: 240000,
    interestRate: 7.9,
    loanTerm: 30,
    propertyTaxRate: 2.0,
    insuranceRate: 0.9,
    propertyManagementRate: 8,
    yearBuilt: 2016,
    totalStorageUnits: 120,
    averageMonthlyRate: 85,
    occupancyRate: 88,
    maintenanceCost: 400,
    utilitiesCost: 200,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3.5,
      annualPropertyValueIncrease: 3,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 12
    }
  },

  LAND: {
    propertyName: 'Test Land Investment',
    propertyType: 'LAND',
    propertyAddress: {
      street: '555 Rural Route',
      city: 'Denver',
      state: 'CO',
      zipCode: '80203'
    },
    purchasePrice: 300000,
    downPayment: 90000,
    interestRate: 9.0,
    loanTerm: 15,
    propertyTaxRate: 1.0,
    insuranceRate: 0.1,
    propertyManagementRate: 0,
    yearBuilt: 2023,
    monthlyLandLease: 2500,
    maintenanceCost: 50,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 4,
      annualPropertyValueIncrease: 5,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 0
    }
  }
};

async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    authToken = response.data.accessToken || response.data.token || response.data.jwt;
    console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Authentication failed:${colors.reset}`, error.response?.data || error.message);
    return false;
  }
}

async function createTestPortfolio() {
  try {
    const response = await axios.post(`${BASE_URL}/portfolios`, {
      name: 'Comprehensive Skinny Calculator Test Portfolio',
      description: 'Testing skinny calculator for all property types',
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 10000,
        targetTimeline: '10-15 years',
        riskTolerance: 'MODERATE'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPortfolioId = response.data.portfolio?.id || response.data.id;
    console.log(`${colors.green}✓ Test portfolio created (ID: ${testPortfolioId})${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Portfolio creation failed:${colors.reset}`, error.response?.data || error.message);
    return false;
  }
}

async function testPropertyType(propertyType, propertyData) {
  console.log(`${colors.blue}\n=== Testing ${propertyType} Property ===${colors.reset}`);
  console.log(`Property: ${propertyData.propertyName}`);
  console.log(`Purchase Price: $${propertyData.purchasePrice.toLocaleString()}`);
  
  try {
    // Add property to portfolio (triggers skinny calculator)
    const payload = {
      ...propertyData,
      portfolioId: testPortfolioId
    };

    const response = await axios.post(`${BASE_URL}/deals`, payload, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const dealId = response.data?._id || response.data?.id;
    if (dealId) {
      console.log(`${colors.green}✓ Property created successfully (ID: ${dealId})${colors.reset}`);
      
      // Give skinny calculator time to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the created property to check analysis
      const dealResponse = await axios.get(`${BASE_URL}/deals/${dealId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const deal = dealResponse.data;
      if (deal.analysis) {
        console.log(`${colors.green}✓ Skinny analysis calculated${colors.reset}`);
        console.log(`  Cap Rate: ${deal.analysis.keyMetrics?.capRate?.toFixed(2) || 'N/A'}%`);
        console.log(`  Cash-on-Cash Return: ${deal.analysis.keyMetrics?.cashOnCashReturn?.toFixed(2) || 'N/A'}%`);
        console.log(`  Monthly Cash Flow: $${deal.analysis.monthlyAnalysis?.cashFlow?.toFixed(2) || 'N/A'}`);
        console.log(`  Is Full Analysis: ${deal.analysis.isFullAnalysis}`);
        
        // Validate no NaN values
        const keyMetrics = deal.analysis.keyMetrics || {};
        const monthlyAnalysis = deal.analysis.monthlyAnalysis || {};
        const annualAnalysis = deal.analysis.annualAnalysis || {};
        
        const hasValidMetrics = 
          isFinite(keyMetrics.capRate) &&
          isFinite(keyMetrics.cashOnCashReturn) &&
          isFinite(monthlyAnalysis.cashFlow) &&
          (deal.analysis.isFullAnalysis === false || deal.analysis.isFullAnalysis === undefined);
          
        if (hasValidMetrics) {
          console.log(`${colors.green}✓ All validations passed${colors.reset}`);
          return true;
        } else {
          console.log(`${colors.yellow}⚠ Some metrics invalid or missing${colors.reset}`);
          return false;
        }
      } else {
        console.log(`${colors.yellow}⚠ No analysis data found (skinny calculator may not have triggered)${colors.reset}`);
        return false;
      }
    } else {
      console.log(`${colors.red}✗ Property creation failed${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ Test failed:${colors.reset}`);
    if (error.response?.data) {
      console.log(`  Error details:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`  Error message:`, error.message);
    }
    return false;
  }
}

async function cleanup() {
  try {
    if (testPortfolioId) {
      await axios.delete(`${BASE_URL}/portfolios/${testPortfolioId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`${colors.green}✓ Test portfolio cleaned up${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Cleanup failed:${colors.reset}`, error.message);
  }
}

async function runAllTests() {
  // Setup
  const authenticated = await authenticate();
  if (!authenticated) return;
  
  const portfolioCreated = await createTestPortfolio();
  if (!portfolioCreated) return;
  
  // Run tests
  const results = {};
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [propertyType, propertyData] of Object.entries(testProperties)) {
    totalTests++;
    const passed = await testPropertyType(propertyType, propertyData);
    results[propertyType] = passed;
    if (passed) passedTests++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Cleanup
  await cleanup();
  
  // Results
  console.log(`${colors.bold}\n============================================================
TEST SUMMARY
============================================================${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
  console.log(`${colors.green}Pass Rate: ${((passedTests/totalTests)*100).toFixed(1)}%${colors.reset}`);
  
  console.log(`\n${colors.blue}Detailed Results:${colors.reset}`);
  for (const [propertyType, passed] of Object.entries(results)) {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`  ${propertyType}: ${status}`);
  }
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}🎉 All property types working correctly!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some property types need attention${colors.reset}`);
  }
}

// Run the tests
runAllTests().catch(console.error);