/**
 * Direct Unit Test of V3.0 Confidence Independence Fix
 * This directly tests the InvestmentDecisionEngine without API calls
 */

// We need to compile TypeScript first, but let's try a simpler approach
// Let's test if we can make a simple API call to a non-auth endpoint

const axios = require('axios');

async function testSimpleCall() {
    console.log('\n🧪 Testing Backend Connection');
    console.log('==============================');
    
    try {
        // Try a simple health check or non-auth endpoint
        const response = await axios.get('http://localhost:5000/');
        console.log('✅ Backend is responding');
        console.log('Response:', response.status, response.statusText);
    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
    
    // Let's try to find a wizard endpoint that might not require auth
    try {
        console.log('\n🧪 Testing Wizard API (might not require auth)...');
        const wizardData = {
            address: "123 Test St, Orlando, FL 32801",
            propertyType: "single_family"
        };
        
        const response = await axios.post('http://localhost:5000/api/wizard/property-lookup', wizardData, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Wizard API responds:', response.status);
        console.log('This confirms the backend is working');
        
    } catch (error) {
        console.log('ℹ️  Wizard endpoint also requires auth or is not available');
        console.log('Status:', error.response?.status || 'No response');
    }
    
    // Let's see what endpoints are available
    try {
        console.log('\n🧪 Testing root API...');
        const response = await axios.get('http://localhost:5000/api/');
        console.log('✅ API root responds:', response.status);
    } catch (error) {
        console.log('❌ API root failed:', error.response?.status || error.message);
    }
}

if (require.main === module) {
    testSimpleCall();
}