/**
 * Test script for Pipeline Deal API
 * Tests Tier 1 functionality: Basic CRUD and stage management
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = null;
let createdDealId = null;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

// Test pipeline deal data
const TEST_DEAL = {
  dealName: 'Test Property - 123 Main St',
  propertyType: 'SFR',
  strategy: 'BUY_HOLD',
  address: {
    street: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701'
  },
  askingPrice: 350000,
  sourceInfo: {
    channel: 'MLS',
    referrer: 'John Smith Realty',
    notes: 'Listed 3 days ago'
  },
  propertyDetails: {
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    yearBuilt: 2015
  },
  notes: 'Great location, needs minor updates'
};

async function login() {
  try {
    console.log('\n🔐 Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    console.log('   Please ensure test user exists or create one first');
    return false;
  }
}

async function testCreateDeal() {
  console.log('\n📝 Testing: Create Pipeline Deal');
  try {
    const response = await axios.post(
      `${API_URL}/pipeline/deals`,
      TEST_DEAL,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    createdDealId = response.data.data._id;
    console.log('✅ Deal created successfully');
    console.log('   Deal ID:', createdDealId);
    console.log('   Name:', response.data.data.dealName);
    console.log('   Stage:', response.data.data.currentStage);
    console.log('   Stage History:', response.data.data.stageHistory.length, 'entries');
    return true;
  } catch (error) {
    console.log('❌ Failed to create deal:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetAllDeals() {
  console.log('\n📋 Testing: Get All Pipeline Deals');
  try {
    const response = await axios.get(
      `${API_URL}/pipeline/deals`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Deals fetched successfully');
    console.log('   Total deals:', response.data.total);
    console.log('   Deals in response:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstDeal = response.data.data[0];
      console.log('   First deal:', firstDeal.dealName, '-', firstDeal.currentStage);
    }
    return true;
  } catch (error) {
    console.log('❌ Failed to fetch deals:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetDealById() {
  console.log('\n🔍 Testing: Get Deal by ID');
  if (!createdDealId) {
    console.log('⚠️  Skipping - no deal ID available');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/pipeline/deals/${createdDealId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Deal fetched successfully');
    console.log('   Deal:', response.data.data.dealName);
    console.log('   Price:', '$' + response.data.data.askingPrice.toLocaleString());
    console.log('   Days in stage:', response.data.data.daysInCurrentStage || 0);
    return true;
  } catch (error) {
    console.log('❌ Failed to fetch deal:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUpdateDeal() {
  console.log('\n✏️  Testing: Update Deal');
  if (!createdDealId) {
    console.log('⚠️  Skipping - no deal ID available');
    return false;
  }
  
  try {
    const updates = {
      askingPrice: 325000,
      notes: 'Price reduced! Seller motivated.'
    };
    
    const response = await axios.put(
      `${API_URL}/pipeline/deals/${createdDealId}`,
      updates,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Deal updated successfully');
    console.log('   New price:', '$' + response.data.data.askingPrice.toLocaleString());
    console.log('   Updated notes:', response.data.data.notes);
    console.log('   Price history entries:', response.data.data.priceHistory?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ Failed to update deal:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUpdateStage() {
  console.log('\n🎯 Testing: Update Deal Stage');
  if (!createdDealId) {
    console.log('⚠️  Skipping - no deal ID available');
    return false;
  }
  
  try {
    const stageUpdate = {
      stage: 'ANALYZING',
      notes: 'Running financial analysis'
    };
    
    const response = await axios.put(
      `${API_URL}/pipeline/deals/${createdDealId}/stage`,
      stageUpdate,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Stage updated successfully');
    console.log('   New stage:', response.data.data.currentStage);
    console.log('   Stage history entries:', response.data.data.stageHistory.length);
    console.log('   Latest stage note:', response.data.data.stageHistory[response.data.data.stageHistory.length - 1].notes);
    return true;
  } catch (error) {
    console.log('❌ Failed to update stage:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetKanbanData() {
  console.log('\n📊 Testing: Get Kanban Board Data');
  try {
    const response = await axios.get(
      `${API_URL}/pipeline/kanban`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Kanban data fetched successfully');
    const stages = Object.keys(response.data.data);
    stages.forEach(stage => {
      console.log(`   ${stage}: ${response.data.data[stage].length} deals`);
    });
    return true;
  } catch (error) {
    console.log('❌ Failed to fetch Kanban data:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetAnalytics() {
  console.log('\n📈 Testing: Get Pipeline Analytics');
  try {
    const response = await axios.get(
      `${API_URL}/pipeline/analytics`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Analytics fetched successfully');
    console.log('   Total pipeline value:', '$' + (response.data.data.totalPipelineValue || 0).toLocaleString());
    console.log('   Stage distribution:', response.data.data.stageDistribution?.length || 0, 'stages');
    console.log('   Property types:', response.data.data.propertyTypeDistribution?.length || 0, 'types');
    return true;
  } catch (error) {
    console.log('❌ Failed to fetch analytics:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testDeleteDeal() {
  console.log('\n🗑️  Testing: Delete Deal');
  if (!createdDealId) {
    console.log('⚠️  Skipping - no deal ID available');
    return false;
  }
  
  try {
    const response = await axios.delete(
      `${API_URL}/pipeline/deals/${createdDealId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Deal deleted successfully');
    console.log('   Message:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Failed to delete deal:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Pipeline API Tests');
  console.log('================================');
  
  // Check if server is running
  try {
    await axios.get(`${API_URL}/health`);
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend first.');
    process.exit(1);
  }
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n⚠️  Cannot proceed without authentication');
    console.log('   Create a test user with: npm run create-test-user');
    process.exit(1);
  }
  
  // Run tests
  const results = [];
  results.push(await testCreateDeal());
  results.push(await testGetAllDeals());
  results.push(await testGetDealById());
  results.push(await testUpdateDeal());
  results.push(await testUpdateStage());
  results.push(await testGetKanbanData());
  results.push(await testGetAnalytics());
  results.push(await testDeleteDeal());
  
  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary');
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}/${results.length}`);
  }
  
  if (passed === results.length) {
    console.log('\n🎉 All tests passed! Pipeline API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});