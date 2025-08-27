#!/usr/bin/env node

/**
 * DEBUG: Check actual IRR values being calculated
 */

const axios = require('axios');

const AUTH_USER = {
  email: 'dualmode.test@example.com',
  password: 'TestUser123!'
};

async function debugIRRValues() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', AUTH_USER);
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in\n');
    
    // Test different price points for Fayetteville property
    const baseProperty = {
      propertyType: 'SFR',
      propertyName: 'IRR Debug Test',
      propertyAddress: {
        street: '1020 Test St',
        city: 'Fayetteville',
        state: 'NC',
        zipCode: '28314'
      },
      interestRate: 4,
      loanTerm: 30,
      propertyTaxRate: 0.84,
      insuranceRate: 0.7,
      propertyManagementRate: 5,
      yearBuilt: 2005,
      monthlyRent: 1495,
      squareFootage: 1788,
      bedrooms: 3,
      bathrooms: 2.5,
      maintenanceCost: 149,
      capitalInvestments: 0,
      tenantTurnoverFees: {
        prepFees: 500,
        realtorCommission: 0.5
      }
    };
    
    const testPrices = [180000, 220000, 250000, 300000, 400000]; // Include extreme case
    
    for (const price of testPrices) {
      const property = { ...baseProperty };
      property.purchasePrice = price;
      property.downPayment = Math.round(price * 0.25);
      property.closingCosts = Math.round(price * 0.025);
      
      const response = await axios.post('http://localhost:3001/api/deals/analyze', property, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = response.data;
      const irr = result.longTermAnalysis?.returns?.irr || result.keyMetrics?.irr || 'N/A';
      const cashFlow = result.monthlyAnalysis?.cashFlow || 0;
      const capRate = result.keyMetrics?.capRate || result.annualAnalysis?.capRate || 0;
      
      console.log(`💰 $${price.toLocaleString()}:`);
      console.log(`   IRR: ${typeof irr === 'number' ? (irr * 100).toFixed(1) + '%' : irr}`);
      console.log(`   Cash Flow: $${Math.round(cashFlow)}/month`);
      console.log(`   Cap Rate: ${capRate.toFixed(2)}%`);
      console.log(`   Rent-to-Price: ${(1495/price*100).toFixed(2)}%`);
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugIRRValues();