/**
 * Test Pipeline Deal Linking
 */

const axios = require('axios');

async function testPipelineLinking() {
  try {
    console.log('Testing Pipeline Deal Analysis Linking...\n');
    
    // Step 1: Create a pipeline deal first
    const pipelineDeal = {
      dealName: "Test Pipeline Deal",
      propertyType: "SFR",
      strategy: "BUY_HOLD",
      address: {
        street: "123 Test St",
        city: "Test City", 
        state: "TX",
        zip: "12345"
      },
      askingPrice: 300000,
      sourceInfo: {
        source: "DIRECT",
        agent: "Test Agent",
        leadSource: "TEST"
      }
    };
    
    console.log('1. Creating pipeline deal...');
    const pipelineResponse = await axios.post('http://localhost:3000/api/pipeline/deals', pipelineDeal, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE` // You'll need to add a real token
      }
    });
    
    const pipelineDealId = pipelineResponse.data.data._id;
    console.log('✅ Pipeline deal created:', pipelineDealId);
    
    // Step 2: Create a property analysis 
    const propertyData = {
      propertyType: 'SFR',
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 7.5,
      loanTerm: 30,
      monthlyRent: 2500,
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      maintenanceCost: 2000,
      propertyManagementRate: 8,
      longTermAssumptions: {
        vacancyRate: 5
      }
    };
    
    console.log('2. Creating property analysis...');
    const analysisResponse = await axios.post('http://localhost:3000/api/deals/analyze', propertyData, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`
      }
    });
    
    const analysisId = analysisResponse.data.data._id;
    console.log('✅ Analysis created:', analysisId);
    
    // Step 3: Link the analysis to the pipeline deal
    console.log('3. Linking analysis to pipeline deal...');
    const linkResponse = await axios.post(`http://localhost:3000/api/pipeline/deals/${pipelineDealId}/link-analysis`, {
      analysisId: analysisId
    }, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`
      }
    });
    
    console.log('✅ Link response:', linkResponse.data);
    
    // Step 4: Verify the link worked
    console.log('4. Verifying pipeline deal was updated...');
    const verifyResponse = await axios.get(`http://localhost:3000/api/pipeline/deals/${pipelineDealId}`, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`
      }
    });
    
    const updatedDeal = verifyResponse.data.data;
    console.log('✅ Updated pipeline deal:', {
      analysisId: updatedDeal.analysisId,
      analysisStatus: updatedDeal.analysisStatus,
      quickMetrics: updatedDeal.quickMetrics
    });
    
    if (updatedDeal.analysisId === analysisId) {
      console.log('\n🎉 SUCCESS: Pipeline deal properly linked to analysis!');
      console.log('The duplicate creation issue must be elsewhere.');
    } else {
      console.log('\n❌ FAILURE: Pipeline deal was not linked to analysis!');
      console.log('This could be causing duplicate creation.');
    }
    
  } catch (error) {
    console.error('Error testing pipeline linking:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️ Authentication required. Update the token in the test file.');
    }
  }
}

// testPipelineLinking();

console.log('⚠️ This test requires authentication token. Please:');
console.log('1. Replace "YOUR_TOKEN_HERE" with actual token');  
console.log('2. Run: node test-pipeline-link.js');
console.log('3. Or investigate the frontend flow directly');

module.exports = { testPipelineLinking };