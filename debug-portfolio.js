#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test data - using admin user
const testUser = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025'
};

async function debugPortfolio() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    const authToken = loginResponse.data.token;
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Get portfolios
    console.log('📁 Getting portfolios...');
    const portfoliosResponse = await axios.get(`${API_BASE_URL}/portfolios`, { headers });
    const portfolios = portfoliosResponse.data.portfolios;
    
    console.log(`Found ${portfolios.length} portfolios:`);
    portfolios.forEach(p => {
      console.log(`- ${p.name} (${p.id}) - ${p.totalProperties} properties, $${p.totalValue} value`);
    });

    // Find Test1 portfolio
    const test1Portfolio = portfolios.find(p => p.name.includes('Test1') || p.name === 'Test1');
    if (!test1Portfolio) {
      console.log('❌ Test1 portfolio not found');
      return;
    }

    console.log(`\n🎯 Found Test1 portfolio: ${test1Portfolio.id}`);

    // Get portfolio details
    console.log('📊 Getting portfolio details...');
    const detailsResponse = await axios.get(`${API_BASE_URL}/portfolios/${test1Portfolio.id}`, { headers });
    const details = detailsResponse.data;
    
    console.log('Portfolio Details:');
    console.log(`- Name: ${details.portfolio.name}`);
    console.log(`- Properties: ${details.totalProperties}`);
    console.log(`- Has Analytics: ${details.analytics ? 'Yes' : 'No'}`);
    
    if (details.properties && details.properties.length > 0) {
      console.log('\n🏠 Properties:');
      details.properties.forEach(prop => {
        console.log(`- ${prop.propertyName}: $${prop.purchasePrice?.toLocaleString()}`);
      });
    }

    if (details.analytics) {
      console.log('\n📈 Current Analytics:');
      console.log(`- Total Value: $${details.analytics.metrics?.totalValue || 0}`);
      console.log(`- Monthly Cash Flow: $${details.analytics.metrics?.monthlyNetCashFlow || 0}`);
      console.log(`- Properties: ${details.analytics.metrics?.totalProperties || 0}`);
    }

    // Manually trigger analytics recalculation
    console.log('\n🔄 Manually recalculating analytics...');
    try {
      const analyticsResponse = await axios.post(`${API_BASE_URL}/portfolios/${test1Portfolio.id}/recalculate-analytics`, {}, { headers });
      console.log('✅ Analytics recalculated successfully!');
      
      const newAnalytics = analyticsResponse.data.analytics;
      console.log('\n📈 New Analytics:');
      console.log(`- Total Value: $${newAnalytics.metrics?.totalValue?.toLocaleString() || 0}`);
      console.log(`- Monthly Cash Flow: $${newAnalytics.metrics?.monthlyNetCashFlow?.toLocaleString() || 0}`);
      console.log(`- Properties: ${newAnalytics.metrics?.totalProperties || 0}`);
      console.log(`- Total Equity: $${newAnalytics.metrics?.totalEquity?.toLocaleString() || 0}`);
      console.log(`- Monthly Rental Income: $${newAnalytics.metrics?.monthlyRentalIncome?.toLocaleString() || 0}`);
      
    } catch (analyticsError) {
      console.error('❌ Analytics recalculation failed:', analyticsError.response?.data || analyticsError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugPortfolio();