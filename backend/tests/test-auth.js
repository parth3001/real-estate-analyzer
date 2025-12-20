const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'dualmode.test@example.com',
  password: 'TestUser123!',
  firstName: 'Dual',
  lastName: 'Mode'
};

async function testAuth() {
  try {
    // Try login
    console.log('Attempting login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    console.log('\nToken:', token);
    
    // Test the token with a simple API call
    console.log('\nTesting token with /deals endpoint...');
    const testResponse = await axios.get(`${API_URL}/deals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Success! Got deals:', testResponse.data.length, 'deals');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth();
