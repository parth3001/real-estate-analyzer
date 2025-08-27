#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testPortfolioId = '';
let testPropertyId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.blue}🧪 ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}\n`)
};

// Test data - using admin user that exists
const testUser = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025',
  name: 'Admin User'
};

const testPortfolio = {
  name: 'My First Portfolio',
  description: 'Test portfolio for rental properties',
  goals: {
    primaryGoal: 'CASH_FLOW',
    targetMonthlyIncome: 5000,
    riskTolerance: 'MODERATE'
  },
  settings: {
    includeInSFRAnalysis: true,
    alertsEnabled: true
  }
};

const updatedPortfolio = {
  name: 'Updated Portfolio Name',
  description: 'Updated description',
  goals: {
    primaryGoal: 'WEALTH_BUILDING',
    targetNetWorth: 1000000,
    riskTolerance: 'AGGRESSIVE'
  }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, requireAuth = true) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {}
  };

  if (requireAuth && authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status 
    };
  }
}

// Test functions
async function testAuthentication() {
  log.section('Testing Authentication');

  // Login with admin user
  log.test('Logging in with admin user...');
  const loginResult = await apiCall('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  }, false);
  
  if (loginResult.success) {
    log.success('Login successful');
    authToken = loginResult.data.token || loginResult.data.accessToken;
    if (authToken) {
      log.info(`Auth token received: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      log.error('No token received in response');
      log.info('Response data:', JSON.stringify(loginResult.data, null, 2));
      return false;
    }
  } else {
    log.error(`Login failed: ${loginResult.error}`);
    return false;
  }
}

async function testCreatePortfolio() {
  log.section('Testing Portfolio Creation');

  log.test('Creating portfolio...');
  const result = await apiCall('POST', '/portfolios', testPortfolio);
  
  if (result.success) {
    log.success('Portfolio created successfully');
    log.info(`Portfolio ID: ${result.data.portfolio.id}`);
    log.info(`Name: ${result.data.portfolio.name}`);
    log.info(`Primary Goal: ${result.data.portfolio.goals.primaryGoal}`);
    testPortfolioId = result.data.portfolio.id;
    return true;
  } else {
    log.error(`Failed to create portfolio: ${result.error}`);
    return false;
  }
}

async function testGetUserPortfolios() {
  log.section('Testing Get User Portfolios');

  log.test('Fetching user portfolios...');
  const result = await apiCall('GET', '/portfolios');
  
  if (result.success) {
    log.success(`Retrieved ${result.data.portfolios.length} portfolio(s)`);
    result.data.portfolios.forEach((portfolio, index) => {
      log.info(`Portfolio ${index + 1}: ${portfolio.name} (${portfolio.primaryGoal})`);
      log.info(`  - Properties: ${portfolio.totalProperties}`);
      log.info(`  - Monthly Cash Flow: $${portfolio.monthlyNetCashFlow}`);
      log.info(`  - Total Value: $${portfolio.totalValue}`);
    });
    return true;
  } else {
    log.error(`Failed to get portfolios: ${result.error}`);
    return false;
  }
}

async function testGetPortfolioDetails() {
  log.section('Testing Get Portfolio Details');

  if (!testPortfolioId) {
    log.error('No portfolio ID available for testing');
    return false;
  }

  log.test(`Fetching details for portfolio ${testPortfolioId}...`);
  const result = await apiCall('GET', `/portfolios/${testPortfolioId}`);
  
  if (result.success) {
    log.success('Portfolio details retrieved successfully');
    log.info(`Name: ${result.data.portfolio.name}`);
    log.info(`Description: ${result.data.portfolio.description}`);
    log.info(`Goals: ${JSON.stringify(result.data.portfolio.goals, null, 2)}`);
    log.info(`Total Properties: ${result.data.totalProperties}`);
    log.info(`Has Analytics: ${result.data.analytics ? 'Yes' : 'No'}`);
    log.info(`Recommendations Count: ${result.data.recommendations.length}`);
    return true;
  } else {
    log.error(`Failed to get portfolio details: ${result.error}`);
    return false;
  }
}

async function testUpdatePortfolio() {
  log.section('Testing Portfolio Update');

  if (!testPortfolioId) {
    log.error('No portfolio ID available for testing');
    return false;
  }

  log.test('Updating portfolio...');
  const result = await apiCall('PUT', `/portfolios/${testPortfolioId}`, updatedPortfolio);
  
  if (result.success) {
    log.success('Portfolio updated successfully');
    log.info(`New Name: ${result.data.portfolio.name}`);
    log.info(`New Goal: ${result.data.portfolio.goals.primaryGoal}`);
    log.info(`New Risk Tolerance: ${result.data.portfolio.goals.riskTolerance}`);
    return true;
  } else {
    log.error(`Failed to update portfolio: ${result.error}`);
    return false;
  }
}

async function testGetAvailablePortfolios() {
  log.section('Testing Get Available Portfolios');

  log.test('Fetching available portfolios for property addition...');
  const result = await apiCall('GET', '/portfolios/available');
  
  if (result.success) {
    log.success(`Found ${result.data.portfolios.length} available portfolio(s)`);
    result.data.portfolios.forEach((portfolio, index) => {
      log.info(`${index + 1}. ${portfolio.name} (${portfolio.primaryGoal})`);
    });
    return true;
  } else {
    log.error(`Failed to get available portfolios: ${result.error}`);
    return false;
  }
}

async function testPropertyManagement() {
  log.section('Testing Property Management in Portfolio');

  // Note: This would require creating a test property first
  // For now, we'll just test the endpoint structure
  
  if (!testPortfolioId) {
    log.error('No portfolio ID available for testing');
    return false;
  }

  // Test with a fake property ID to verify endpoint is working
  const fakePropertyId = '507f1f77bcf86cd799439011';
  
  log.test('Testing add property endpoint (expecting property not found)...');
  const addResult = await apiCall('POST', `/portfolios/${testPortfolioId}/properties`, {
    propertyId: fakePropertyId
  });
  
  if (addResult.success) {
    log.info('Property added (unexpected success with fake ID)');
  } else if (addResult.error.includes('Property not found')) {
    log.success('Add property endpoint working correctly (rejected fake property)');
  } else {
    log.error(`Add property failed with unexpected error: ${addResult.error}`);
  }

  log.test('Testing remove property endpoint structure...');
  const removeResult = await apiCall('DELETE', `/portfolios/${testPortfolioId}/properties/${fakePropertyId}`);
  
  if (removeResult.success) {
    log.info('Property removed (unexpected success)');
  } else if (removeResult.error.includes('Property not found')) {
    log.success('Remove property endpoint working correctly');
  } else {
    log.error(`Remove property failed with unexpected error: ${removeResult.error}`);
  }

  return true;
}

async function testArchivePortfolio() {
  log.section('Testing Portfolio Archive');

  if (!testPortfolioId) {
    log.error('No portfolio ID available for testing');
    return false;
  }

  log.test('Archiving portfolio...');
  const result = await apiCall('DELETE', `/portfolios/${testPortfolioId}`);
  
  if (result.success) {
    log.success('Portfolio archived successfully');
    log.info(result.data.message);
    
    // Verify it's no longer in active portfolios
    log.test('Verifying portfolio is archived...');
    const listResult = await apiCall('GET', '/portfolios');
    if (listResult.success) {
      const found = listResult.data.portfolios.find(p => p.id === testPortfolioId);
      if (!found) {
        log.success('Portfolio no longer appears in active list');
      } else {
        log.error('Portfolio still appears in active list after archiving');
      }
    }
    
    return true;
  } else {
    log.error(`Failed to archive portfolio: ${result.error}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(colors.cyan + '\n' + '='.repeat(60));
  console.log('       PORTFOLIO API TEST SUITE');
  console.log('='.repeat(60) + colors.reset);

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Create Portfolio', fn: testCreatePortfolio },
    { name: 'Get User Portfolios', fn: testGetUserPortfolios },
    { name: 'Get Portfolio Details', fn: testGetPortfolioDetails },
    { name: 'Update Portfolio', fn: testUpdatePortfolio },
    { name: 'Get Available Portfolios', fn: testGetAvailablePortfolios },
    { name: 'Property Management', fn: testPropertyManagement },
    { name: 'Archive Portfolio', fn: testArchivePortfolio }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log.error(`${test.name} threw an error: ${error.message}`);
      failed++;
    }
  }

  // Summary
  log.section('TEST SUMMARY');
  log.info(`Total Tests: ${tests.length}`);
  log.success(`Passed: ${passed}`);
  if (failed > 0) {
    log.error(`Failed: ${failed}`);
  }
  
  const successRate = ((passed / tests.length) * 100).toFixed(1);
  if (failed === 0) {
    log.success(`✨ All tests passed! Success rate: ${successRate}%`);
  } else {
    log.error(`Some tests failed. Success rate: ${successRate}%`);
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Test suite error: ${error.message}`);
  process.exit(1);
});