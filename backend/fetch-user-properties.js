#!/usr/bin/env node

const axios = require('axios');

async function fetchUserProperties() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'dualmode.test@example.com',
      password: 'TestUser123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully\n');
    
    // Fetch user's saved deals
    const dealsResponse = await axios.get('http://localhost:3001/api/deals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const deals = dealsResponse.data;
    console.log(`📊 Found ${deals.length} saved properties:\n`);
    
    // Display each property with key metrics
    deals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.propertyName || 'Unnamed Property'}`);
      console.log(`   📍 Location: ${deal.propertyAddress?.city}, ${deal.propertyAddress?.state}`);
      console.log(`   💰 Price: $${deal.purchasePrice?.toLocaleString()}`);
      console.log(`   🏠 Rent: $${deal.monthlyRent?.toLocaleString()}/month`);
      console.log(`   📈 Cap Rate: ${deal.analysis?.annualAnalysis?.capRate?.toFixed(2)}%`);
      console.log(`   💵 Monthly Cash Flow: $${deal.analysis?.monthlyAnalysis?.cashFlow?.toFixed(0)}`);
      console.log(`   🎯 Verdict: ${deal.investmentDecision?.verdict}`);
      console.log(`   📊 Deal Quality: ${deal.investmentDecision?.professionalAssessment?.dealQuality}/100`);
      console.log(`   🆔 Deal ID: ${deal._id}`);
      console.log('');
    });
    
    // Pick the most recent property for detailed analysis
    if (deals.length > 0) {
      const latestDeal = deals[0];
      console.log('📋 Latest Property Details for Testing:');
      console.log('=====================================');
      console.log(JSON.stringify({
        propertyName: latestDeal.propertyName,
        propertyType: latestDeal.propertyType,
        propertyAddress: latestDeal.propertyAddress,
        purchasePrice: latestDeal.purchasePrice,
        downPayment: latestDeal.downPayment,
        interestRate: latestDeal.interestRate,
        loanTerm: latestDeal.loanTerm,
        monthlyRent: latestDeal.monthlyRent,
        squareFootage: latestDeal.squareFootage,
        bedrooms: latestDeal.bedrooms,
        bathrooms: latestDeal.bathrooms,
        yearBuilt: latestDeal.yearBuilt,
        propertyTaxRate: latestDeal.propertyTaxRate,
        insuranceRate: latestDeal.insuranceRate,
        propertyManagementRate: latestDeal.propertyManagementRate,
        maintenanceCost: latestDeal.maintenanceCost
      }, null, 2));
    }
    
    return deals;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return [];
  }
}

// Run if called directly
if (require.main === module) {
  fetchUserProperties();
}

module.exports = { fetchUserProperties };