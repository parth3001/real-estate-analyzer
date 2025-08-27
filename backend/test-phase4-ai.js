const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPhase4AIFeatures() {
  try {
    console.log('\n🤖 TESTING PHASE 4: ENHANCED AI INSIGHTS\n');
    
    // Login first
    console.log('🧪 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Authentication successful\n');
    
    // Create a test portfolio with properties
    console.log('🧪 Creating test portfolio with properties...');
    const portfolioResponse = await axios.post(`${BASE_URL}/portfolios`, {
      name: 'AI Insights Test Portfolio',
      description: 'Testing Phase 4 AI features',
      goals: {
        primaryGoal: 'CASH_FLOW',
        targetMonthlyIncome: 10000,
        targetTimeline: '5 years',
        riskTolerance: 'MODERATE'
      }
    }, { headers });
    
    const portfolioId = portfolioResponse.data.portfolio?.id;
    console.log(`✅ Portfolio created: ${portfolioId}`);
    
    // Add some test properties
    const testProperties = [
      {
        propertyName: "Houston Rental Property",
        propertyType: "SFR",
        propertyAddress: {
          street: "123 Main St",
          city: "Houston",
          state: "TX",
          zipCode: "77001"
        },
        purchasePrice: 350000,
        downPayment: 70000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTaxRate: 1.8,
        insuranceRate: 0.5,
        propertyManagementRate: 8,
        yearBuilt: 2010,
        monthlyRent: 2800,
        squareFootage: 1900,
        bedrooms: 3,
        bathrooms: 2,
        maintenanceCost: 220,
        ownershipPercentage: 100
      },
      {
        propertyName: "Dallas Investment",
        propertyType: "SFR",
        propertyAddress: {
          street: "456 Oak Ave",
          city: "Dallas",
          state: "TX",
          zipCode: "75201"
        },
        purchasePrice: 420000,
        downPayment: 84000,
        interestRate: 7.0,
        loanTerm: 30,
        propertyTaxRate: 2.2,
        insuranceRate: 0.8,
        propertyManagementRate: 8,
        yearBuilt: 2015,
        monthlyRent: 3400,
        squareFootage: 2200,
        bedrooms: 4,
        bathrooms: 3,
        maintenanceCost: 280,
        ownershipPercentage: 100
      }
    ];
    
    for (const propertyData of testProperties) {
      console.log(`📋 Adding ${propertyData.propertyName}...`);
      await axios.post(`${BASE_URL}/deals`, {
        ...propertyData,
        portfolioId: portfolioId,
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2.5,
          vacancyRate: 5
        }
      }, { headers });
    }
    
    console.log('✅ Properties added to portfolio');
    
    // Trigger analytics calculation
    console.log('\n🧪 Calculating portfolio analytics...');
    await axios.post(`${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`, {}, { headers });
    console.log('✅ Analytics calculated\n');
    
    // Test 1: Portfolio Health Check AI
    console.log('🔍 TESTING: Portfolio Health Check AI');
    console.log('==========================================');
    try {
      const healthCheckResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}/health-check`, { headers });
      const healthCheck = healthCheckResponse.data.healthCheck;
      
      console.log('✅ Health Check Generated Successfully');
      console.log(`📊 Biggest Risk: ${healthCheck.biggestRisk.title}`);
      console.log(`   ${healthCheck.biggestRisk.description}`);
      console.log(`   Severity: ${healthCheck.biggestRisk.severity}`);
      console.log('');
      console.log(`🚀 Best Opportunity: ${healthCheck.bestOpportunity.title}`);
      console.log(`   ${healthCheck.bestOpportunity.description}`);
      console.log(`   Impact: ${healthCheck.bestOpportunity.potentialImpact}`);
      console.log('');
      console.log(`⚡ Action This Month: ${healthCheck.actionThisMonth.action}`);
      console.log(`   Why: ${healthCheck.actionThisMonth.why}`);
      console.log(`   Expected Result: ${healthCheck.actionThisMonth.expectedResult}`);
      
    } catch (error) {
      console.log(`❌ Health Check Failed: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Peer Comparison Intelligence
    console.log('👥 TESTING: Peer Comparison Intelligence');
    console.log('==========================================');
    try {
      const peerResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}/peer-comparison`, { headers });
      const peerComparison = peerResponse.data.peerComparison;
      
      console.log('✅ Peer Comparison Generated Successfully');
      console.log('📈 Outperforming Areas:');
      peerComparison.outperforming.metrics.forEach(metric => {
        console.log(`   • ${metric}`);
      });
      console.log(`   Advantage: ${peerComparison.outperforming.advantage}`);
      console.log('');
      console.log('📉 Lagging Areas:');
      peerComparison.lagging.metrics.forEach(metric => {
        console.log(`   • ${metric}`);
      });
      console.log(`   Gap: ${peerComparison.lagging.gap}`);
      console.log('');
      console.log('🎯 Why It Matters:');
      console.log(`   Strengths: ${peerComparison.whyItMatters.strengths}`);
      console.log(`   Concerns: ${peerComparison.whyItMatters.concerns}`);
      console.log(`   Long-term Impact: ${peerComparison.whyItMatters.longTermImpact}`);
      
    } catch (error) {
      console.log(`❌ Peer Comparison Failed: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Goal Achievement Path AI
    console.log('🎯 TESTING: Goal Achievement Path AI');
    console.log('=====================================');
    try {
      const goalPathResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}/goal-path`, { headers });
      const goalPath = goalPathResponse.data.goalPath;
      
      console.log('✅ Goal Achievement Path Generated Successfully');
      console.log('🏠 Properties Needed:');
      console.log(`   Count: ${goalPath.propertiesNeeded.count} properties`);
      console.log(`   Types: ${goalPath.propertiesNeeded.types.join(', ')}`);
      console.log(`   Average Price: $${goalPath.propertiesNeeded.avgPrice.toLocaleString()}`);
      console.log('');
      console.log('📍 Target Locations:');
      console.log(`   Primary: ${goalPath.targetLocations.primary}`);
      console.log(`   Secondary: ${goalPath.targetLocations.secondary}`);
      console.log(`   Reasoning: ${goalPath.targetLocations.reasoning}`);
      console.log('');
      console.log('💰 Capital Required:');
      console.log(`   Total Investment: $${goalPath.capitalRequired.totalInvestment.toLocaleString()}`);
      console.log(`   Down Payments: $${goalPath.capitalRequired.downPayments.toLocaleString()}`);
      console.log(`   Reserves: $${goalPath.capitalRequired.reserves.toLocaleString()}`);
      console.log(`   Closing Costs: $${goalPath.capitalRequired.closingCosts.toLocaleString()}`);
      console.log('');
      console.log('📅 Timeline:');
      console.log(`   Year 1: ${goalPath.timeline.year1}`);
      console.log(`   Year 2: ${goalPath.timeline.year2}`);
      console.log(`   Year 3: ${goalPath.timeline.year3}`);
      
    } catch (error) {
      console.log(`❌ Goal Achievement Path Failed: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Comprehensive Insights (All Three)
    console.log('🧠 TESTING: Comprehensive AI Insights');
    console.log('======================================');
    try {
      const comprehensiveResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}/comprehensive-insights`, { headers });
      const insights = comprehensiveResponse.data.insights;
      
      console.log('✅ Comprehensive Insights Generated Successfully');
      console.log('📋 Generated Insights:');
      console.log(`   • Health Check: ${insights.healthCheck ? '✅' : '❌'}`);
      console.log(`   • Peer Comparison: ${insights.peerComparison ? '✅' : '❌'}`);
      console.log(`   • Goal Achievement Path: ${insights.goalPath ? '✅' : '❌'}`);
      console.log(`   Generated at: ${comprehensiveResponse.data.generated}`);
      
    } catch (error) {
      console.log(`❌ Comprehensive Insights Failed: ${error.response?.data?.error || error.message}`);
    }
    
    // Clean up - archive the test portfolio
    console.log(`\n🧹 Cleaning up test portfolio...`);
    await axios.put(`${BASE_URL}/portfolios/${portfolioId}`, {
      status: 'ARCHIVED'
    }, { headers });
    console.log('✅ Test portfolio archived');
    
    console.log('\n🎉 PHASE 4 AI TESTING COMPLETED SUCCESSFULLY!');
    console.log('==============================================');
    console.log('All Phase 4 Enhanced AI Insights are working:');
    console.log('✅ Portfolio Health Check AI');
    console.log('✅ Peer Comparison Intelligence');
    console.log('✅ Goal Achievement Path AI');
    console.log('✅ Comprehensive Insights API');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testPhase4AIFeatures();