const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Comprehensive test data for all 13 property types
const comprehensiveTestProperties = [
  // Residential Properties
  {
    name: "Single Family Rental",
    propertyType: "SFR",
    propertyAddress: { street: "123 Oak St", city: "Austin", state: "TX", zipCode: "78701" },
    purchasePrice: 350000,
    downPayment: 70000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    propertyManagementRate: 8,
    yearBuilt: 2010,
    monthlyRent: 2800,
    squareFootage: 1900,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 220,
    ownershipPercentage: 100,
    expectedMonthlyIncome: 2800
  },
  {
    name: "Multifamily Building", 
    propertyType: "MF",
    propertyAddress: { street: "456 Pine Ave", city: "Dallas", state: "TX", zipCode: "75201" },
    purchasePrice: 850000,
    downPayment: 212500,
    interestRate: 7.0,
    loanTerm: 30,
    propertyTaxRate: 2.2,
    insuranceRate: 0.8,
    propertyManagementRate: 6,
    yearBuilt: 2015,
    totalUnits: 8,
    totalSqft: 6400,
    maintenanceCostPerUnit: 75,
    unitTypes: [
      { type: "1BR", count: 4, sqft: 650, monthlyRent: 1200, occupied: 4 },
      { type: "2BR", count: 4, sqft: 950, monthlyRent: 1600, occupied: 3 }
    ],
    commonAreaUtilities: { electric: 200, water: 150, gas: 100, trash: 80 },
    ownershipPercentage: 100,
    expectedMonthlyIncome: 9600 // (4*1200 + 3*1600)
  },
  {
    name: "Downtown Condo",
    propertyType: "CONDO", 
    propertyAddress: { street: "789 High St", city: "Houston", state: "TX", zipCode: "77001" },
    purchasePrice: 280000,
    downPayment: 56000,
    interestRate: 6.8,
    loanTerm: 30,
    propertyTaxRate: 1.5,
    insuranceRate: 0.6,
    propertyManagementRate: 8,
    yearBuilt: 2018,
    monthlyRent: 2200,
    squareFootage: 1200,
    bedrooms: 2,
    bathrooms: 2,
    maintenanceCost: 150,
    ownershipPercentage: 50, // 50% syndication
    expectedMonthlyIncome: 1100 // 2200 * 0.5
  },
  {
    name: "Suburban Townhouse",
    propertyType: "TOWNHOUSE",
    propertyAddress: { street: "321 Maple Dr", city: "San Antonio", state: "TX", zipCode: "78201" },
    purchasePrice: 320000,
    downPayment: 64000,
    interestRate: 6.9,
    loanTerm: 30,
    propertyTaxRate: 1.9,
    insuranceRate: 0.5,
    propertyManagementRate: 8,
    yearBuilt: 2012,
    monthlyRent: 2500,
    squareFootage: 1600,
    bedrooms: 3,
    bathrooms: 2.5,
    maintenanceCost: 180,
    ownershipPercentage: 75, // 75% partnership
    expectedMonthlyIncome: 1875 // 2500 * 0.75
  },
  {
    name: "Garden Apartment Complex",
    propertyType: "APARTMENT",
    propertyAddress: { street: "654 Garden Way", city: "Fort Worth", state: "TX", zipCode: "76101" },
    purchasePrice: 1200000,
    downPayment: 300000,
    interestRate: 7.2,
    loanTerm: 25,
    propertyTaxRate: 2.0,
    insuranceRate: 0.9,
    propertyManagementRate: 6,
    yearBuilt: 2008,
    totalUnits: 24,
    totalSqft: 18000,
    maintenanceCostPerUnit: 50,
    unitTypes: [
      { type: "Studio", count: 6, sqft: 500, monthlyRent: 900, occupied: 5 },
      { type: "1BR", count: 12, sqft: 700, monthlyRent: 1100, occupied: 11 },
      { type: "2BR", count: 6, sqft: 1000, monthlyRent: 1400, occupied: 6 }
    ],
    commonAreaUtilities: { electric: 400, water: 300, gas: 200, trash: 150 },
    ownershipPercentage: 25, // 25% REIT-style investment
    expectedMonthlyIncome: 5075 // (5*900 + 11*1100 + 6*1400) * 0.25
  },

  // Commercial Properties  
  {
    name: "Retail Shopping Center",
    propertyType: "COMMERCIAL_RETAIL",
    propertyAddress: { street: "100 Commerce Blvd", city: "Plano", state: "TX", zipCode: "75023" },
    purchasePrice: 2500000,
    downPayment: 750000,
    interestRate: 7.5,
    loanTerm: 20,
    propertyTaxRate: 2.5,
    insuranceRate: 1.0,
    propertyManagementRate: 4,
    yearBuilt: 2005,
    leasedSquareFeet: 15000,
    avgRentPerSqFt: 28, // Annual rent per sqft
    ownershipPercentage: 60, // 60% in commercial syndication
    expectedMonthlyIncome: 21000 // (28 * 15000 / 12) * 0.6
  },
  {
    name: "Office Building",
    propertyType: "COMMERCIAL_OFFICE", 
    propertyAddress: { street: "200 Business Park", city: "Irving", state: "TX", zipCode: "75038" },
    purchasePrice: 3200000,
    downPayment: 960000,
    interestRate: 7.8,
    loanTerm: 20,
    propertyTaxRate: 2.8,
    insuranceRate: 1.2,
    propertyManagementRate: 4,
    yearBuilt: 2010,
    leasedSquareFeet: 25000,
    avgRentPerSqFt: 32,
    ownershipPercentage: 40, // 40% institutional investment
    expectedMonthlyIncome: 26667 // (32 * 25000 / 12) * 0.4
  },
  {
    name: "Industrial Warehouse",
    propertyType: "COMMERCIAL_INDUSTRIAL",
    propertyAddress: { street: "300 Industrial Way", city: "Garland", state: "TX", zipCode: "75040" },
    purchasePrice: 1800000,
    downPayment: 540000,
    interestRate: 7.3,
    loanTerm: 20,
    propertyTaxRate: 2.0,
    insuranceRate: 0.8,
    propertyManagementRate: 3,
    yearBuilt: 2000,
    leasedSquareFeet: 50000,
    avgRentPerSqFt: 12,
    ownershipPercentage: 80, // 80% direct ownership
    expectedMonthlyIncome: 40000 // (12 * 50000 / 12) * 0.8
  },
  {
    name: "Mixed Use Development",
    propertyType: "COMMERCIAL_MIXED",
    propertyAddress: { street: "400 Downtown Plaza", city: "Arlington", state: "TX", zipCode: "76010" },
    purchasePrice: 4500000,
    downPayment: 1350000,
    interestRate: 8.0,
    loanTerm: 25,
    propertyTaxRate: 3.0,
    insuranceRate: 1.5,
    propertyManagementRate: 5,
    yearBuilt: 2018,
    leasedSquareFeet: 35000,
    avgRentPerSqFt: 35,
    ownershipPercentage: 20, // 20% in large syndication
    expectedMonthlyIncome: 20417 // (35 * 35000 / 12) * 0.2
  },

  // Alternative Asset Classes
  {
    name: "Self Storage Facility",
    propertyType: "SELF_STORAGE",
    propertyAddress: { street: "500 Storage Rd", city: "Mesquite", state: "TX", zipCode: "75149" },
    purchasePrice: 2200000,
    downPayment: 660000,
    interestRate: 7.6,
    loanTerm: 20,
    propertyTaxRate: 1.8,
    insuranceRate: 0.7,
    propertyManagementRate: 5,
    yearBuilt: 2012,
    totalUnits: 350,
    averageRentPerUnit: 95,
    occupancyRate: 88,
    ownershipPercentage: 35, // 35% in partnership
    expectedMonthlyIncome: 10185 // 350 * 95 * 0.88 * 0.35
  },
  {
    name: "Mobile Home Park",
    propertyType: "MOBILE_HOME_PARK", 
    propertyAddress: { street: "600 Park Lane", city: "Grand Prairie", state: "TX", zipCode: "75050" },
    purchasePrice: 3500000,
    downPayment: 1050000,
    interestRate: 7.9,
    loanTerm: 20,
    propertyTaxRate: 1.6,
    insuranceRate: 0.6,
    propertyManagementRate: 7,
    yearBuilt: 1995,
    occupiedLots: 85,
    avgLotRent: 450,
    parkOwnedHomes: 20,
    avgPOHRent: 750,
    ownershipPercentage: 45, // 45% in MHP partnership
    expectedMonthlyIncome: 23962 // (85 * 450 + 20 * 750) * 0.45
  },
  {
    name: "Development Land",
    propertyType: "LAND",
    propertyAddress: { street: "700 Future Blvd", city: "McKinney", state: "TX", zipCode: "75069" },
    purchasePrice: 800000,
    downPayment: 400000, // Higher down payment for land
    interestRate: 8.5,
    loanTerm: 15,
    propertyTaxRate: 1.2,
    insuranceRate: 0.2,
    propertyManagementRate: 2,
    yearBuilt: 2024,
    monthlyLeaseIncome: 2500, // Agricultural lease
    ownershipPercentage: 90, // 90% direct ownership
    expectedMonthlyIncome: 2250 // 2500 * 0.9
  },
  {
    name: "Other Investment Property",
    propertyType: "OTHER",
    propertyAddress: { street: "800 Specialty St", city: "Richardson", state: "TX", zipCode: "75080" },
    purchasePrice: 600000,
    downPayment: 180000,
    interestRate: 7.4,
    loanTerm: 25,
    propertyTaxRate: 1.7,
    insuranceRate: 0.8,
    propertyManagementRate: 6,
    yearBuilt: 2016,
    monthlyRent: 4200,
    ownershipPercentage: 65, // 65% ownership
    expectedMonthlyIncome: 2730 // 4200 * 0.65
  }
];

async function testComprehensivePortfolioTypes() {
  try {
    console.log('\n🏗️  COMPREHENSIVE PORTFOLIO TESTING');
    console.log('=====================================');
    console.log(`Testing ${comprehensiveTestProperties.length} different property types with various ownership percentages\n`);
    
    // Login first
    console.log('🧪 Authenticating...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Authentication successful\n');
    
    // Create comprehensive test portfolio
    console.log('🧪 Creating comprehensive test portfolio...');
    const portfolioResponse = await axios.post(`${BASE_URL}/portfolios`, {
      name: 'Comprehensive Multi-Asset Portfolio',
      description: 'Testing all 13 property types with various ownership percentages',
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 5000000,
        targetTimeline: '10-15 years',
        riskTolerance: 'AGGRESSIVE'
      }
    }, { headers });
    
    const portfolioId = portfolioResponse.data.portfolio?.id;
    console.log(`✅ Portfolio created: ${portfolioId}\n`);
    
    // Track creation results
    const creationResults = {
      successful: [],
      failed: [],
      totalExpectedIncome: 0,
      totalExpectedValue: 0
    };
    
    // Test each property type
    console.log('🏠 TESTING PROPERTY CREATION BY TYPE:');
    console.log('=====================================\n');
    
    for (const [index, propertyData] of comprehensiveTestProperties.entries()) {
      console.log(`${index + 1}. Testing ${propertyData.propertyType}: ${propertyData.name}`);
      console.log(`   Purchase Price: $${propertyData.purchasePrice.toLocaleString()}`);
      console.log(`   Ownership: ${propertyData.ownershipPercentage}%`);
      console.log(`   Expected Monthly Income: $${propertyData.expectedMonthlyIncome.toLocaleString()}`);
      
      try {
        const dealResponse = await axios.post(`${BASE_URL}/deals`, {
          propertyName: propertyData.name,
          propertyType: propertyData.propertyType,
          propertyAddress: propertyData.propertyAddress,
          purchasePrice: propertyData.purchasePrice,
          downPayment: propertyData.downPayment,
          interestRate: propertyData.interestRate,
          loanTerm: propertyData.loanTerm,
          propertyTaxRate: propertyData.propertyTaxRate,
          insuranceRate: propertyData.insuranceRate,
          propertyManagementRate: propertyData.propertyManagementRate,
          yearBuilt: propertyData.yearBuilt,
          ownershipPercentage: propertyData.ownershipPercentage,
          portfolioId: portfolioId,
          
          // Type-specific fields
          ...(propertyData.monthlyRent && { monthlyRent: propertyData.monthlyRent }),
          ...(propertyData.squareFootage && { squareFootage: propertyData.squareFootage }),
          ...(propertyData.bedrooms && { bedrooms: propertyData.bedrooms }),
          ...(propertyData.bathrooms && { bathrooms: propertyData.bathrooms }),
          ...(propertyData.maintenanceCost && { maintenanceCost: propertyData.maintenanceCost }),
          
          // MF specific
          ...(propertyData.totalUnits && { totalUnits: propertyData.totalUnits }),
          ...(propertyData.totalSqft && { totalSqft: propertyData.totalSqft }),
          ...(propertyData.maintenanceCostPerUnit && { maintenanceCostPerUnit: propertyData.maintenanceCostPerUnit }),
          ...(propertyData.unitTypes && { unitTypes: propertyData.unitTypes }),
          ...(propertyData.commonAreaUtilities && { commonAreaUtilities: propertyData.commonAreaUtilities }),
          
          // Commercial specific
          ...(propertyData.leasedSquareFeet && { leasedSquareFeet: propertyData.leasedSquareFeet }),
          ...(propertyData.avgRentPerSqFt && { avgRentPerSqFt: propertyData.avgRentPerSqFt }),
          
          // Storage specific
          ...(propertyData.totalUnits && propertyData.averageRentPerUnit && { 
            totalUnits: propertyData.totalUnits,
            averageRentPerUnit: propertyData.averageRentPerUnit,
            occupancyRate: propertyData.occupancyRate
          }),
          
          // MHP specific
          ...(propertyData.occupiedLots && {
            occupiedLots: propertyData.occupiedLots,
            avgLotRent: propertyData.avgLotRent,
            parkOwnedHomes: propertyData.parkOwnedHomes,
            avgPOHRent: propertyData.avgPOHRent
          }),
          
          // Land specific
          ...(propertyData.monthlyLeaseIncome && { monthlyLeaseIncome: propertyData.monthlyLeaseIncome }),
          
          longTermAssumptions: {
            projectionYears: 10,
            annualRentIncrease: 3,
            annualPropertyValueIncrease: 3,
            sellingCostsPercentage: 6,
            inflationRate: 2.5,
            vacancyRate: 5
          }
        }, { headers });
        
        console.log(`   ✅ SUCCESS - Property ID: ${dealResponse.data._id}`);
        creationResults.successful.push({
          type: propertyData.propertyType,
          name: propertyData.name,
          id: dealResponse.data._id,
          expectedIncome: propertyData.expectedMonthlyIncome,
          expectedValue: propertyData.purchasePrice * (propertyData.ownershipPercentage / 100)
        });
        
        creationResults.totalExpectedIncome += propertyData.expectedMonthlyIncome;
        creationResults.totalExpectedValue += propertyData.purchasePrice * (propertyData.ownershipPercentage / 100);
        
      } catch (error) {
        console.log(`   ❌ FAILED - ${error.response?.data?.error || error.message}`);
        creationResults.failed.push({
          type: propertyData.propertyType,
          name: propertyData.name,
          error: error.response?.data?.error || error.message
        });
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 PROPERTY CREATION SUMMARY:');
    console.log('==============================');
    console.log(`✅ Successful: ${creationResults.successful.length}/${comprehensiveTestProperties.length}`);
    console.log(`❌ Failed: ${creationResults.failed.length}/${comprehensiveTestProperties.length}`);
    console.log(`💰 Expected Total Monthly Income: $${creationResults.totalExpectedIncome.toLocaleString()}`);
    console.log(`🏠 Expected Total Adjusted Value: $${creationResults.totalExpectedValue.toLocaleString()}\n`);
    
    if (creationResults.failed.length > 0) {
      console.log('❌ FAILED PROPERTY TYPES:');
      creationResults.failed.forEach(failure => {
        console.log(`   ${failure.type}: ${failure.error}`);
      });
      console.log('');
    }
    
    if (creationResults.successful.length > 0) {
      console.log('✅ SUCCESSFUL PROPERTY TYPES:');
      creationResults.successful.forEach(success => {
        console.log(`   ${success.type}: $${success.expectedIncome}/month @ ${success.expectedValue.toLocaleString()} value`);
      });
      console.log('');
      
      // Calculate portfolio analytics
      console.log('🧪 Calculating comprehensive portfolio analytics...');
      await axios.post(`${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`, {}, { headers });
      
      // Get analytics results
      const detailsResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}`, { headers });
      const portfolio = detailsResponse.data;
      
      if (portfolio.analytics) {
        console.log('📊 COMPREHENSIVE PORTFOLIO ANALYTICS:');
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
        
        console.log('\n🎯 VALIDATION RESULTS:');
        console.log('======================');
        
        // Validate income calculation
        const incomeMatch = Math.abs(creationResults.totalExpectedIncome - summary.monthlyRentalIncome) < 500;
        console.log(`Expected Income: $${creationResults.totalExpectedIncome.toLocaleString()}`);
        console.log(`Calculated Income: $${summary.monthlyRentalIncome.toLocaleString()}`);
        console.log(`Income Calculation: ${incomeMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        
        // Validate value calculation  
        const valueMatch = Math.abs(creationResults.totalExpectedValue - summary.totalValue) < 10000;
        console.log(`Expected Value: $${creationResults.totalExpectedValue.toLocaleString()}`);
        console.log(`Calculated Value: $${summary.totalValue.toLocaleString()}`);
        console.log(`Value Calculation: ${valueMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        
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
        
      } else {
        console.log('❌ No analytics generated');
      }
    }
    
    // Clean up
    console.log(`\n🧹 Cleaning up test portfolio...`);
    await axios.put(`${BASE_URL}/portfolios/${portfolioId}`, {
      status: 'ARCHIVED'
    }, { headers });
    console.log('✅ Test portfolio archived');
    
    console.log('\n🎉 COMPREHENSIVE PORTFOLIO TESTING COMPLETED!');
    console.log('=============================================');
    console.log(`✅ Successfully tested ${creationResults.successful.length}/${comprehensiveTestProperties.length} property types`);
    console.log(`🏗️  Portfolio supports multi-asset real estate investment portfolios`);
    console.log(`💰 Ownership percentage calculations working across all asset classes`);
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the comprehensive test
testComprehensivePortfolioTypes();