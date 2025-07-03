/**
 * Manual test script for Census API integration
 * 
 * This script tests the Census API service directly without requiring a running server.
 * It can be used to verify that the Census API key is working correctly.
 * 
 * Run with: npx ts-node src/tests/manualCensusTest.ts
 */

import { censusService } from '../services/censusService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Check if Census API key is set
const censusApiKey = process.env.CENSUS_API_KEY;
console.log('Census API Key exists:', !!censusApiKey);
if (!censusApiKey) {
  console.error('Census API Key is not set in .env file');
  process.exit(1);
}

// Test locations with real ZIP codes
const testLocations = [
  {
    name: 'Mountain View, CA',
    zip: '94043',
    state: 'CA',
    county: '085'
  },
  {
    name: 'Manhattan, NY',
    zip: '10001',
    state: 'NY',
    county: '061'
  },
  {
    name: 'Austin, TX',
    zip: '78701',
    state: 'TX',
    county: '453'
  },
  {
    name: 'Miami, FL',
    zip: '33131',
    state: 'FL',
    county: '086'
  },
  {
    name: 'Seattle, WA',
    zip: '98101',
    state: 'WA',
    county: '033'
  }
];

// Test function
async function testCensusApi() {
  console.log('Testing Census API integration...\n');
  
  // Test only the first location for now
  const location = testLocations[0];
  console.log(`\n========== Testing ${location.name} ==========`);
  
  try {
    // Test demographic data
    console.log(`\nFetching demographic data for ${location.name}...`);
    const demographicData = await censusService.getDemographicData({ zip: location.zip });
    console.log('Demographic data:', JSON.stringify(demographicData, null, 2));
    
    // Test income data
    console.log(`\nFetching income data for ${location.name}...`);
    const incomeData = await censusService.getIncomeData({ 
      state: location.state, 
      county: location.county 
    });
    console.log('Income data:', JSON.stringify(incomeData, null, 2));
    
    // Test housing data
    console.log(`\nFetching housing data for ${location.name}...`);
    const housingData = await censusService.getHousingData({ zip: location.zip });
    console.log('Housing data:', JSON.stringify(housingData, null, 2));
    
    // Test comprehensive data
    console.log(`\nFetching comprehensive census data for ${location.name}...`);
    const comprehensiveData = await censusService.getComprehensiveCensusData({ zip: location.zip });
    console.log('Comprehensive data:', JSON.stringify(comprehensiveData, null, 2));
    
  } catch (error) {
    console.error(`Error testing ${location.name}:`, error);
  }
  
  console.log('\nAll tests completed!');
}

// Run the test
testCensusApi(); 