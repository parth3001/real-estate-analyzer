const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data for testing ownership percentage functionality
const testProperties = [
  {
    propertyName: "Test SFR 100% Ownership",
    propertyType: "SFR",
    propertyAddress: {
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701"
    },
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    propertyManagementRate: 8,
    yearBuilt: 2010,
    monthlyRent: 2500,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 200,
    ownershipPercentage: 100
  },
  {
    propertyName: "Test SFR 50% Syndication",
    propertyType: "SFR", 
    propertyAddress: {
      street: "456 Oak Ave",
      city: "Dallas",
      state: "TX", 
      zipCode: "75201"
    },
    purchasePrice: 400000,
    downPayment: 80000,
    interestRate: 7.0,
    loanTerm: 30,
    propertyTaxRate: 2.2,
    insuranceRate: 0.8,
    propertyManagementRate: 8,
    yearBuilt: 2015,
    monthlyRent: 3200,
    squareFootage: 2200,
    bedrooms: 4,
    bathrooms: 3,
    maintenanceCost: 250,
    ownershipPercentage: 50 // 50% ownership in syndication
  },
  {
    propertyName: "Test SFR 25% Partnership",
    propertyType: "SFR",
    propertyAddress: {
      street: "789 Pine St",
      city: "Houston", 
      state: "TX",
      zipCode: "77001"
    },
    purchasePrice: 350000,
    downPayment: 70000,
    interestRate: 6.8,
    loanTerm: 30,
    propertyTaxRate: 1.5,
    insuranceRate: 0.6,
    propertyManagementRate: 8,
    yearBuilt: 2018,
    monthlyRent: 2800,
    squareFootage: 1900,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 220,
    ownershipPercentage: 25 // 25% ownership in partnership
  }
];

async function testMultiPropertyCalculations() {
  try {
    console.log('\n🔄 TESTING OWNERSHIP PERCENTAGE CALCULATIONS\n');
    
    // Login first
    console.log('🧪 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Authentication successful\n');
    
    // Create a test portfolio
    console.log('🧪 Creating test portfolio...');
    const portfolioResponse = await axios.post(`${BASE_URL}/portfolios`, {
      name: 'Ownership Percentage Test Portfolio',
      description: 'Testing fractional ownership calculations',
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 8000,
        targetTimeline: '5 years',
        riskTolerance: 'MODERATE'
      }
    }, { headers });
    
    const portfolioId = portfolioResponse.data.portfolio?.id || portfolioResponse.data._id || portfolioResponse.data.id;
    console.log(`✅ Portfolio created: ${portfolioId}\n`);
    
    // Create properties of different types
    const createdProperties = [];
    for (const [index, propertyData] of testProperties.entries()) {
      console.log(`🧪 Creating ${propertyData.propertyType} property...`);
      
      try {
        // Create the property via deals endpoint
        const dealResponse = await axios.post(`${BASE_URL}/deals`, {
          ...propertyData,
          portfolioId: portfolioId,
          longTermAssumptions: {
            projectionYears: 10,
            annualRentIncrease: 3,
            annualPropertyValueIncrease: 3,
            sellingCostsPercentage: 6,
            inflationRate: 2.5,
            vacancyRate: 5
          }
        }, { headers });
        
        createdProperties.push(dealResponse.data);
        console.log(`✅ ${propertyData.propertyType} property created: ${dealResponse.data._id}`);
        console.log(`   - Ownership: ${propertyData.ownershipPercentage}%`);
        console.log(`   - Purchase Price: $${propertyData.purchasePrice.toLocaleString()}`);
        
        if (propertyData.propertyType === 'SFR') {
          console.log(`   - Monthly Rent: $${propertyData.monthlyRent}`);
        } else if (propertyData.propertyType === 'COMMERCIAL_OFFICE') {
          console.log(`   - Leased SqFt: ${propertyData.leasedSquareFeet} @ $${propertyData.avgRentPerSqFt}/sqft/year`);
        } else if (propertyData.propertyType === 'SELF_STORAGE') {
          console.log(`   - Units: ${propertyData.totalUnits} @ $${propertyData.averageRentPerUnit}/unit @ ${propertyData.occupancyRate}% occupancy`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to create ${propertyData.propertyType}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(`\n🧪 Calculating portfolio analytics for ${createdProperties.length} properties...`);
    
    // Manually trigger analytics calculation
    await axios.post(`${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`, {}, { headers });
    console.log('✅ Analytics recalculation triggered');
    
    // Get portfolio details to view analytics
    const detailsResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}`, { headers });
    const portfolio = detailsResponse.data;
    
    if (portfolio.analytics) {
      console.log('\n📊 PORTFOLIO ANALYTICS RESULTS:');
      console.log('=====================================');
      
      const analytics = portfolio.analytics;
      const summary = analytics.summary;
      
      console.log(`Total Properties: ${summary.totalProperties}`);
      console.log(`Total Value: $${summary.totalValue.toLocaleString()}`);
      console.log(`Total Equity: $${summary.totalEquity.toLocaleString()}`);
      console.log(`Monthly Rental Income: $${summary.monthlyRentalIncome.toLocaleString()}`);
      console.log(`Monthly Net Cash Flow: $${summary.monthlyNetCashFlow.toLocaleString()}`);
      console.log(`Average Cap Rate: ${summary.averageCapRate.toFixed(2)}%`);
      console.log(`Average Cash-on-Cash: ${summary.averageCashOnCash.toFixed(2)}%`);
      
      console.log('\n📍 OWNERSHIP PERCENTAGE VALIDATION:');
      console.log('=====================================');
      
      // Calculate expected values manually for validation
      let expectedTotalValue = 0;
      let expectedMonthlyIncome = 0;
      
      testProperties.forEach(prop => {
        const ownershipFactor = prop.ownershipPercentage / 100;
        expectedTotalValue += prop.purchasePrice * ownershipFactor;
        
        if (prop.propertyType === 'SFR') {
          expectedMonthlyIncome += prop.monthlyRent * ownershipFactor;
        } else if (prop.propertyType === 'COMMERCIAL_OFFICE') {
          expectedMonthlyIncome += (prop.avgRentPerSqFt * prop.leasedSquareFeet / 12) * ownershipFactor;
        } else if (prop.propertyType === 'SELF_STORAGE') {
          expectedMonthlyIncome += (prop.totalUnits * prop.averageRentPerUnit * prop.occupancyRate / 100) * ownershipFactor;
        }
      });
      
      console.log(`Expected Total Value: $${expectedTotalValue.toLocaleString()}`);
      console.log(`Calculated Total Value: $${summary.totalValue.toLocaleString()}`);
      console.log(`Value Match: ${Math.abs(expectedTotalValue - summary.totalValue) < 1000 ? '✅' : '❌'}`);
      
      console.log(`Expected Monthly Income: $${expectedMonthlyIncome.toLocaleString()}`);
      console.log(`Calculated Monthly Income: $${summary.monthlyRentalIncome.toLocaleString()}`);
      console.log(`Income Match: ${Math.abs(expectedMonthlyIncome - summary.monthlyRentalIncome) < 100 ? '✅' : '❌'}`);
      
      if (analytics.risk) {
        console.log('\n🎯 RISK ANALYSIS:');
        console.log('=================');
        console.log(`Geographic Concentration: ${analytics.risk.geographicConcentration.toFixed(1)}%`);
        console.log(`Top Market: ${analytics.risk.topMarket}`);
        console.log(`Leverage Ratio: ${(analytics.risk.leverageRatio * 100).toFixed(1)}%`);
        if (analytics.risk.concentrationWarning) {
          console.log(`⚠️  Warning: ${analytics.risk.concentrationWarning}`);
        }
      }
      
      if (analytics.aiInsights) {
        console.log('\n🤖 AI INSIGHTS:');
        console.log('===============');
        console.log(`Strength: ${analytics.aiInsights.portfolioStrength}`);
        console.log(`Opportunity: ${analytics.aiInsights.mainOpportunity}`);
        console.log(`Goal Alignment: ${analytics.aiInsights.goalAlignment}`);
        if (analytics.aiInsights.nextSteps && analytics.aiInsights.nextSteps.length > 0) {
          console.log('Next Steps:');
          analytics.aiInsights.nextSteps.forEach((step, i) => {
            console.log(`  ${i + 1}. ${step}`);
          });
        }
      }
      
    } else {
      console.log('❌ No analytics generated');
    }
    
    // Clean up - archive the test portfolio
    console.log(`\n🧹 Cleaning up test portfolio...`);
    await axios.put(`${BASE_URL}/portfolios/${portfolioId}`, {
      status: 'ARCHIVED'
    }, { headers });
    console.log('✅ Test portfolio archived');
    
    console.log('\n🎉 MULTI-PROPERTY TYPE TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testMultiPropertyCalculations();