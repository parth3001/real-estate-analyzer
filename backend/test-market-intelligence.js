const axios = require('axios');

async function testMarketIntelligence() {
  try {
    console.log('Testing Market Intelligence Integration...\n');
    
    const testData = {
      propertyAddress: {
        street: "123 Test Street",
        city: "Austin",
        state: "TX", 
        zipCode: "78701"
      },
      purchasePrice: 400000,
      downPayment: 80000,
      monthlyRent: 2800,
      interestRate: 6.5,
      loanTerm: 30,
      propertyTaxRate: 1.8,
      insuranceRate: 0.25,
      maintenanceCost: 2000,
      propertyManagementRate: 8,
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      closingCosts: 8000,
      capitalInvestments: 5000,
      propertyType: "SFR"
    };

    console.log('Sending analysis request...');
    const response = await axios.post('http://localhost:5001/api/deals/analyze', testData);
    
    console.log('Response status:', response.status);
    console.log('Analysis result structure:');
    console.log('- Has marketData:', !!response.data.marketData);
    console.log('- Has marketInsights:', !!response.data.marketInsights);
    console.log('- Has investmentTiming:', !!response.data.investmentTiming);
    
    if (response.data.marketData) {
      console.log('\nMarket Data Details:');
      console.log('- Data sources:', response.data.marketData.dataSource);
      console.log('- Property rent estimate:', response.data.marketData.property?.rentEstimate);
      console.log('- Median rent:', response.data.marketData.marketTrends?.medianRent);
      console.log('- Mortgage rate:', response.data.marketData.economicIndicators?.currentMortgageRate);
      console.log('- Using fallback data:', response.data.marketData.dataSource?.includes('Fallback'));
    }
    
    if (response.data.marketInsights) {
      console.log('\nMarket Insights:', response.data.marketInsights.length, 'insights');
      response.data.marketInsights.forEach((insight, i) => {
        console.log(`- ${i+1}. ${insight.category}: ${insight.impact}`);
      });
    }
    
    if (response.data.investmentTiming) {
      console.log('\nInvestment Timing:');
      console.log('- Recommendation:', response.data.investmentTiming.recommendation);
      console.log('- Timing Score:', response.data.investmentTiming.timingScore);
      console.log('- Market Cycle:', response.data.investmentTiming.marketCycle);
    }
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMarketIntelligence();