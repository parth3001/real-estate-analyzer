const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function checkPropertyFields() {
  try {
    // Login first
    console.log('🧪 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Authentication successful\n');
    
    // Get all portfolios
    const portfoliosResponse = await axios.get(`${BASE_URL}/portfolios`, { headers });
    const portfolios = portfoliosResponse.data.portfolios;
    
    if (!portfolios || portfolios.length === 0) {
      console.log('No portfolios found');
      return;
    }
    
    // Get the most recent portfolio
    const portfolio = portfolios[0];
    console.log(`Checking portfolio: ${portfolio.name} (${portfolio.id})`);
    console.log(`Total properties: ${portfolio.totalProperties}\n`);
    
    // Get portfolio details with properties
    const detailsResponse = await axios.get(`${BASE_URL}/portfolios/${portfolio.id}`, { headers });
    const properties = detailsResponse.data.properties;
    
    if (!properties || properties.length === 0) {
      console.log('No properties in portfolio');
      return;
    }
    
    console.log('PROPERTY FIELD INSPECTION:');
    console.log('===========================\n');
    
    // Check each property type
    const propertyTypes = ['COMMERCIAL_RETAIL', 'SELF_STORAGE', 'MOBILE_HOME_PARK'];
    
    for (const prop of properties) {
      if (propertyTypes.includes(prop.propertyType)) {
        console.log(`${prop.propertyName} (${prop.propertyType}):`);
        console.log('  Core fields:');
        console.log(`    - purchasePrice: ${prop.purchasePrice}`);
        console.log(`    - ownershipPercentage: ${prop.ownershipPercentage}`);
        console.log(`    - monthlyRent: ${prop.monthlyRent || 'undefined'}`);
        
        if (prop.propertyType.startsWith('COMMERCIAL')) {
          console.log('  Commercial fields:');
          console.log(`    - leasedSquareFeet: ${prop.leasedSquareFeet || 'undefined'}`);
          console.log(`    - avgRentPerSqFt: ${prop.avgRentPerSqFt || 'undefined'}`);
        }
        
        if (prop.propertyType === 'SELF_STORAGE') {
          console.log('  Storage fields:');
          console.log(`    - totalUnits: ${prop.totalUnits || 'undefined'}`);
          console.log(`    - averageRentPerUnit: ${prop.averageRentPerUnit || 'undefined'}`);
          console.log(`    - occupancyRate: ${prop.occupancyRate || 'undefined'}`);
        }
        
        if (prop.propertyType === 'MOBILE_HOME_PARK') {
          console.log('  MHP fields:');
          console.log(`    - occupiedLots: ${prop.occupiedLots || 'undefined'}`);
          console.log(`    - avgLotRent: ${prop.avgLotRent || 'undefined'}`);
          console.log(`    - parkOwnedHomes: ${prop.parkOwnedHomes || 'undefined'}`);
          console.log(`    - avgPOHRent: ${prop.avgPOHRent || 'undefined'}`);
        }
        
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkPropertyFields();