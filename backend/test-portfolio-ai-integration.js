/**
 * Portfolio AI Integration Test
 * Tests if EnhancedPortfolioAI service properly receives and uses 
 * skinny calculator data from diverse property types
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3001/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let authToken = null;
let testPortfolioId = null;

console.log(`${colors.bold}============================================================
Portfolio AI Integration Test
Testing AI Service with Skinny Calculator Data
============================================================${colors.reset}`);

// Diverse property portfolio for AI testing
const testProperties = [
  {
    propertyName: 'Austin SFR Cash Cow',
    propertyType: 'SFR',
    propertyAddress: { street: '123 Oak St', city: 'Austin', state: 'TX', zipCode: '78701' },
    purchasePrice: 350000,
    downPayment: 70000,
    interestRate: 7.2,
    loanTerm: 30,
    monthlyRent: 2800,
    propertyTaxRate: 2.1,
    insuranceRate: 0.8,
    propertyManagementRate: 8,
    yearBuilt: 2018,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    maintenanceCost: 250,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 4,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 5
    }
  },
  {
    propertyName: 'Dallas Apartment Complex',
    propertyType: 'MF',
    propertyAddress: { street: '456 Elm Ave', city: 'Dallas', state: 'TX', zipCode: '75201' },
    purchasePrice: 1200000,
    downPayment: 300000,
    interestRate: 8.0,
    loanTerm: 30,
    propertyTaxRate: 2.3,
    insuranceRate: 1.0,
    propertyManagementRate: 8,
    yearBuilt: 2015,
    totalUnits: 12,
    totalSqft: 9600,
    maintenanceCostPerUnit: 120,
    unitTypes: [
      { type: '2BR', count: 8, monthlyRent: 1600, occupied: 7, sqft: 800 },
      { type: '1BR', count: 4, monthlyRent: 1200, occupied: 4, sqft: 600 }
    ],
    commonAreaUtilities: { electric: 300, water: 200, gas: 150, trash: 100 },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 4,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 5,
      capitalExpenditureRate: 5,
      commonAreaMaintenanceRate: 2
    }
  },
  {
    propertyName: 'Phoenix Self Storage Facility',
    propertyType: 'SELF_STORAGE',
    propertyAddress: { street: '789 Storage Way', city: 'Phoenix', state: 'AZ', zipCode: '85001' },
    purchasePrice: 800000,
    downPayment: 240000,
    interestRate: 7.9,
    loanTerm: 30,
    propertyTaxRate: 2.0,
    insuranceRate: 0.9,
    propertyManagementRate: 8,
    yearBuilt: 2016,
    totalStorageUnits: 120,
    averageMonthlyRate: 85,
    occupancyRate: 88,
    maintenanceCost: 400,
    utilitiesCost: 200,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3.5,
      annualPropertyValueIncrease: 3,
      sellingCostsPercentage: 6,
      inflationRate: 2.5,
      vacancyRate: 12
    }
  }
];

async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@realestateanalyzer.com',
      password: 'Spring@2025'
    });
    
    authToken = response.data.accessToken;
    console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Authentication failed:${colors.reset}`, error.response?.data || error.message);
    return false;
  }
}

async function createTestPortfolio() {
  try {
    const response = await axios.post(`${BASE_URL}/portfolios`, {
      name: 'AI Integration Test Portfolio',
      description: 'Diverse property types for AI analysis testing',
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 3000000,
        targetTimeline: '10-15 years',
        riskTolerance: 'MODERATE'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPortfolioId = response.data.portfolio.id;
    console.log(`${colors.green}✓ Test portfolio created (ID: ${testPortfolioId})${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Portfolio creation failed:${colors.reset}`, error.response?.data || error.message);
    return false;
  }
}

async function addPropertiesToPortfolio() {
  console.log(`${colors.blue}\n=== Adding Diverse Properties to Portfolio ===${colors.reset}`);
  
  const addedProperties = [];
  
  for (const property of testProperties) {
    try {
      const response = await axios.post(`${BASE_URL}/deals`, {
        ...property,
        portfolioId: testPortfolioId
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const dealId = response.data._id;
      addedProperties.push({ 
        name: property.propertyName, 
        id: dealId, 
        type: property.propertyType,
        city: property.propertyAddress.city
      });
      console.log(`${colors.green}✓ Added ${property.propertyType}: ${property.propertyName} (${property.propertyAddress.city})${colors.reset}`);
      
      // Small delay to ensure skinny calculator processes
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`${colors.red}✗ Failed to add ${property.propertyName}:${colors.reset}`, error.response?.data?.error || error.message);
    }
  }
  
  console.log(`${colors.green}✓ Added ${addedProperties.length} properties to portfolio${colors.reset}`);
  return addedProperties;
}

async function testPortfolioAIInsights() {
  console.log(`${colors.blue}\n=== Testing Portfolio AI Insights ===${colors.reset}`);
  
  // Wait for all skinny calculator processing to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const tests = [
    { name: 'Health Check', endpoint: 'health-check' },
    { name: 'Peer Comparison', endpoint: 'peer-comparison' },
    { name: 'Goal Path Analysis', endpoint: 'goal-path' }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      console.log(`${colors.blue}Testing ${test.name}...${colors.reset}`);
      
      const response = await axios.get(`${BASE_URL}/portfolios/${testPortfolioId}/${test.endpoint}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const insight = response.data[test.endpoint.replace('-', '')] || response.data;
      
      // Analyze AI insight quality
      const analysis = analyzeAIInsightQuality(insight, test.name);
      
      results[test.name] = {
        success: true,
        analysis,
        insight: insight,
        summary: getInsightSummary(insight)
      };
      
      console.log(`${colors.green}✓ ${test.name} completed${colors.reset}`);
      console.log(`  Property mentions: ${analysis.propertyMentions}`);
      console.log(`  Financial data: ${analysis.hasFinancials ? 'YES' : 'NO'}`);
      console.log(`  Location specific: ${analysis.hasLocations ? 'YES' : 'NO'}`);
      console.log(`  Quality grade: ${analysis.qualityGrade}`);
      
    } catch (error) {
      results[test.name] = {
        success: false,
        error: error.response?.data || error.message
      };
      console.log(`${colors.red}✗ ${test.name} failed:${colors.reset}`, error.response?.data || error.message);
    }
  }
  
  return results;
}

function analyzeAIInsightQuality(insight, testType) {
  const content = JSON.stringify(insight).toLowerCase();
  
  // Check for property type mentions
  const propertyTypes = ['sfr', 'single family', 'multi-family', 'apartment', 'self storage', 'storage', 'commercial'];
  const mentionedTypes = propertyTypes.filter(type => content.includes(type));
  
  // Check for financial metrics
  const financialTerms = ['cap rate', 'cash flow', 'return', 'noi', '$', 'investment', 'rent'];
  const hasFinancials = financialTerms.some(term => content.includes(term));
  
  // Check for location references
  const locations = ['austin', 'dallas', 'phoenix', 'texas', 'arizona'];
  const hasLocations = locations.some(loc => content.includes(loc));
  
  // Grade the quality
  let qualityGrade = 'POOR';
  if (mentionedTypes.length >= 2 && hasFinancials && hasLocations) {
    qualityGrade = 'EXCELLENT';
  } else if (mentionedTypes.length >= 1 && hasFinancials) {
    qualityGrade = 'GOOD';
  } else if (hasFinancials) {
    qualityGrade = 'FAIR';
  }
  
  return {
    propertyMentions: mentionedTypes.length,
    mentionedTypes,
    hasFinancials,
    hasLocations,
    qualityGrade,
    contentLength: content.length
  };
}

function getInsightSummary(insight) {
  if (typeof insight === 'string') {
    return insight.substring(0, 200) + '...';
  }
  
  if (insight.content) {
    return insight.content.substring(0, 200) + '...';
  }
  
  if (insight.summary) {
    return insight.summary;
  }
  
  return JSON.stringify(insight).substring(0, 200) + '...';
}

async function cleanup() {
  try {
    if (testPortfolioId) {
      await axios.delete(`${BASE_URL}/portfolios/${testPortfolioId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`${colors.green}✓ Test portfolio cleaned up${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Cleanup warning:${colors.reset}`, error.message);
  }
}

async function runIntegrationTest() {
  const authenticated = await authenticate();
  if (!authenticated) return;
  
  const portfolioCreated = await createTestPortfolio();
  if (!portfolioCreated) return;
  
  const properties = await addPropertiesToPortfolio();
  if (properties.length === 0) {
    console.log(`${colors.red}✗ No properties added, cannot test AI integration${colors.reset}`);
    return;
  }
  
  const aiResults = await testPortfolioAIInsights();
  
  await cleanup();
  
  // Final Analysis
  console.log(`${colors.bold}\n============================================================
INTEGRATION TEST RESULTS
============================================================${colors.reset}`);
  
  let successCount = 0;
  let excellentCount = 0;
  let goodCount = 0;
  
  for (const [testName, result] of Object.entries(aiResults)) {
    if (result.success) {
      successCount++;
      const grade = result.analysis.qualityGrade;
      if (grade === 'EXCELLENT') excellentCount++;
      if (grade === 'GOOD' || grade === 'EXCELLENT') goodCount++;
      
      console.log(`${colors.green}✓ ${testName}: ${grade}${colors.reset}`);
      console.log(`  Property types mentioned: ${result.analysis.mentionedTypes.join(', ')}`);
      console.log(`  Content: ${result.summary.substring(0, 100)}...`);
    } else {
      console.log(`${colors.red}✗ ${testName}: FAILED${colors.reset}`);
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }
  
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`AI Tests Passed: ${successCount}/3`);
  console.log(`Excellent Quality: ${excellentCount}/3`);
  console.log(`Good+ Quality: ${goodCount}/3`);
  console.log(`Properties Added: ${properties.length}/3`);
  console.log(`Property Types: ${properties.map(p => p.type).join(', ')}`);
  
  if (successCount === 3 && goodCount >= 2) {
    console.log(`${colors.green}\n🎉 PORTFOLIO AI INTEGRATION: EXCELLENT${colors.reset}`);
    console.log(`Skinny calculator data is properly feeding into AI insights!`);
    console.log(`AI is generating property-specific, location-aware insights!`);
  } else if (successCount >= 2) {
    console.log(`${colors.yellow}\n⚠️ PORTFOLIO AI INTEGRATION: GOOD${colors.reset}`);
    console.log(`Integration working but AI content quality needs improvement.`);
  } else {
    console.log(`${colors.red}\n❌ PORTFOLIO AI INTEGRATION: NEEDS WORK${colors.reset}`);
    console.log(`AI service may not be properly accessing skinny calculator data.`);
  }
}

runIntegrationTest().catch(console.error);