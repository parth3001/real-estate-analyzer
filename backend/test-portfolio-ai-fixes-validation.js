/**
 * Portfolio AI Response Quality Validation Test
 * 
 * Purpose: Validates recent AI improvements for peer comparison and goal path features
 * - Tests dynamic parsing vs hardcoded responses
 * - Validates property-specific content generation
 * - Uses Marcus Chen professional validation
 * 
 * Recent Fixes Being Validated:
 * 1. Peer comparison: Dynamic property data extraction vs generic responses
 * 2. Goal path: Property type-specific recommendations vs identical outputs
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025'
};

let authToken = null;
let testPortfolioId = null;

// Color helpers
const colors = {
  success: '\x1b[32m',
  warning: '\x1b[33m',
  error: '\x1b[31m',
  info: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(systemPrompt, userContent) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`${colors.error}OpenAI API error:`, error.response?.data || error.message, colors.reset);
    throw error;
  }
}

async function authenticateUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    console.log(`${colors.info}Login response:`, JSON.stringify(response.data, null, 2), colors.reset);
    authToken = response.data.token || response.data.accessToken || response.data.jwt;
    console.log(`${colors.success}✓ Authentication successful${colors.reset}`);
    console.log(`${colors.info}Token: ${authToken ? 'Valid' : 'Missing'}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.error}✗ Authentication failed:`, error.response?.data || error.message, colors.reset);
    return false;
  }
}

async function createTestPortfolio() {
  try {
    // Use correct Portfolio model structure
    const portfolio = {
      name: 'AI Response Quality Test Portfolio',
      description: 'Testing AI response quality for peer comparison and goal path',
      goals: {
        primaryGoal: 'WEALTH_BUILDING',
        targetNetWorth: 2000000,
        targetTimeline: '10-15 years',
        riskTolerance: 'MODERATE'
      },
      settings: {
        includeInSFRAnalysis: true,
        alertsEnabled: false,
        currency: 'USD'
      }
    };

    console.log(`${colors.info}Creating portfolio with token: ${authToken ? 'Present' : 'Missing'}${colors.reset}`);
    
    const response = await axios.post(`${BASE_URL}/portfolios`, portfolio, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`${colors.info}Portfolio response:`, JSON.stringify(response.data, null, 2), colors.reset);
    testPortfolioId = response.data.portfolio?.id || response.data._id || response.data.id;
    console.log(`${colors.success}✓ Test portfolio created (ID: ${testPortfolioId})${colors.reset}`);
    return testPortfolioId;
  } catch (error) {
    console.error(`${colors.error}✗ Portfolio creation failed:`, error.response?.data || error.message, colors.reset);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Headers:`, error.response.headers);
    }
    throw error;
  }
}

async function addPropertyToPortfolio(propertyData) {
  try {
    const payload = {
      ...propertyData,
      portfolioId: testPortfolioId
      // No analysis data - triggers skinny calculation like working test
    };

    const response = await axios.post(`${BASE_URL}/deals`, payload, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    return response.data;
  } catch (error) {
    console.error(`${colors.error}✗ Property creation failed:`, error.response?.data || error.message, colors.reset);
    throw error;
  }
}

async function getPortfolioInsights() {
  try {
    // Get REAL peer comparison insights from actual endpoint
    const peerResponse = await axios.get(`${BASE_URL}/portfolios/${testPortfolioId}/peer-comparison`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Get REAL goal path insights from actual endpoint
    const goalResponse = await axios.get(`${BASE_URL}/portfolios/${testPortfolioId}/goal-path`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`${colors.info}Real AI insights received!${colors.reset}`);
    console.log(`${colors.info}Peer comparison keys:`, Object.keys(peerResponse.data), colors.reset);
    console.log(`${colors.info}Goal path keys:`, Object.keys(goalResponse.data), colors.reset);
    
    return {
      comparisons: {
        peerComparison: peerResponse.data.peerComparison,
        goalPath: goalResponse.data.goalPath
      }
    };
  } catch (error) {
    console.error(`${colors.error}✗ Failed to get portfolio insights:`, error.response?.data || error.message, colors.reset);
    throw error;
  }
}

async function validatePeerComparisonDynamicContent() {
  console.log(`\n${colors.bold}=== Testing Peer Comparison Dynamic Content ===${colors.reset}`);
  
  // Add diverse property types using exact working structure
  const properties = [
    {
      propertyName: 'AI Test SFR Property',
      propertyType: 'SFR',
      propertyAddress: {
        street: '123 Oak Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701'
      },
      purchasePrice: 450000,
      downPayment: 90000,
      closingCosts: 11250,
      capitalInvestments: 5000,
      interestRate: 7.5,
      loanTerm: 30,
      monthlyRent: 3200,
      propertyTaxRate: 2.1,
      insuranceRate: 0.8,
      maintenanceCost: 300,
      propertyManagementRate: 8,
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 2400,
      yearBuilt: 2015,
      longTermAssumptions: {
        appreciationRate: 3.5,
        maintenanceInflation: 2.5,
        rentGrowthRate: 3.0,
        insuranceInflation: 4.0,
        propertyTaxInflation: 2.0
      }
    },
    {
      propertyName: 'AI Test Multi-Family Property',
      propertyType: 'MF',
      propertyAddress: {
        street: '789 Maple Avenue',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28202'
      },
      purchasePrice: 850000,
      downPayment: 170000,
      closingCosts: 21250,
      capitalInvestments: 8000,
      interestRate: 7.8,
      loanTerm: 30,
      totalUnits: 4,
      averageRentPerUnit: 2125,
      occupancyRate: 95,
      maintenanceCostPerUnit: 75,
      propertyManagementRate: 8,
      propertyTaxRate: 1.3,
      insuranceRate: 0.6,
      totalSqft: 4800,
      yearBuilt: 2018,
      commonAreaUtilities: 150,
      longTermAssumptions: {
        appreciationRate: 3.2,
        maintenanceInflation: 2.8,
        rentGrowthRate: 2.8,
        insuranceInflation: 4.2,
        propertyTaxInflation: 2.2
      }
    }
  ];

  console.log(`${colors.info}Adding test properties...${colors.reset}`);
  for (const property of properties) {
    const result = await addPropertyToPortfolio(property);
    console.log(`${colors.info}Added property: ${property.propertyName} - ID: ${result.deal?._id || result._id}${colors.reset}`);
  }
  
  // Wait a moment for database operations to complete
  console.log(`${colors.info}Waiting for database operations to complete...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get insights with peer comparison
  const insights = await getPortfolioInsights();
  const peerComparison = insights.comparisons?.peerComparison;

  if (!peerComparison) {
    console.error(`${colors.error}✗ No peer comparison data returned${colors.reset}`);
    return { passed: false, reason: 'No peer comparison data' };
  }

  // Validate with Marcus Chen
  const validationPrompt = `You are Marcus Chen, a seasoned real estate advisor with 15 years of experience.

Analyze this peer comparison AI output for quality and accuracy:

${JSON.stringify(peerComparison, null, 2)}

Portfolio contains:
- Single-family in Austin, TX ($450K, $3,200/mo rent)  
- 4-unit Multi-family in Charlotte, NC ($850K, $8,500/mo rent)

Check for:
1. Dynamic content using actual property data (prices, rents, locations)
2. Property-specific insights (not generic templates)
3. Meaningful peer comparisons relevant to the portfolio
4. Numerical accuracy where data is referenced

Respond with JSON:
{
  "verdict": "PASS" or "FAIL",
  "dynamicContent": true/false,
  "propertySpecific": true/false,
  "issues": ["list of issues if any"]
}`;

  const aiResponse = await callOpenAI(
    'You are a professional real estate validation system. Analyze the content and respond only in JSON format.',
    validationPrompt
  );

  try {
    const validation = JSON.parse(aiResponse);
    
    if (validation.verdict === 'PASS') {
      console.log(`${colors.success}✓ Peer comparison shows dynamic, property-specific content${colors.reset}`);
      return { passed: true };
    } else {
      console.log(`${colors.warning}⚠ Peer comparison issues:${colors.reset}`);
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      return { passed: false, issues: validation.issues };
    }
  } catch (e) {
    console.error(`${colors.error}✗ Failed to parse AI validation${colors.reset}`);
    return { passed: false, reason: 'AI validation parse error' };
  }
}

async function validateGoalPathDynamicContent() {
  console.log(`\n${colors.bold}=== Testing Goal Path Dynamic Content ===${colors.reset}`);
  
  // Get insights with goal path
  const insights = await getPortfolioInsights();
  const goalPath = insights.comparisons?.goalPath;

  if (!goalPath) {
    console.error(`${colors.error}✗ No goal path data returned${colors.reset}`);
    return { passed: false, reason: 'No goal path data' };
  }

  // Validate with Marcus Chen
  const validationPrompt = `You are Marcus Chen, a seasoned real estate advisor analyzing goal path recommendations.

Analyze this goal path AI output for quality:

${JSON.stringify(goalPath, null, 2)}

Portfolio context:
- Goal: Wealth Building ($2M equity target in 10 years)
- Current properties: SFR in Austin ($450K) + 4-unit MF in Charlotte ($850K)
- Risk tolerance: Moderate
- Preferred locations: Austin, Charlotte, Denver

Check for:
1. Recommendations specific to wealth-building goal
2. Property type recommendations matching portfolio (SFR + MF)
3. Location-specific suggestions using preferred cities
4. Realistic timeline considerations for 10-year horizon
5. NO generic/template language

Respond with JSON:
{
  "verdict": "PASS" or "FAIL",
  "goalSpecific": true/false,
  "propertyTypeRelevant": true/false,
  "locationAware": true/false,
  "issues": ["list of issues if any"]
}`;

  const aiResponse = await callOpenAI(
    'You are a professional real estate validation system. Analyze the content and respond only in JSON format.',
    validationPrompt
  );

  try {
    const validation = JSON.parse(aiResponse);
    
    if (validation.verdict === 'PASS') {
      console.log(`${colors.success}✓ Goal path shows dynamic, goal-specific content${colors.reset}`);
      return { passed: true };
    } else {
      console.log(`${colors.warning}⚠ Goal path issues:${colors.reset}`);
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      return { passed: false, issues: validation.issues };
    }
  } catch (e) {
    console.error(`${colors.error}✗ Failed to parse AI validation${colors.reset}`);
    return { passed: false, reason: 'AI validation parse error' };
  }
}

async function validateCrossPropertyConsistency() {
  console.log(`\n${colors.bold}=== Testing Cross-Property Consistency ===${colors.reset}`);
  
  // Add a commercial property to test variety
  const commercialProperty = {
    address: '555 Business Park Drive',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    purchasePrice: 1500000,
    monthlyRent: 15000,
    propertyType: 'commercial',
    propertySubType: 'office',
    squareFeet: 8000,
    yearBuilt: 2020
  };

  await addPropertyToPortfolio(commercialProperty);
  
  const insights = await getPortfolioInsights();
  
  // Validate all AI sections for consistency
  const validationPrompt = `You are Marcus Chen validating AI consistency across different sections.

Full AI insights output:
${JSON.stringify(insights, null, 2)}

Portfolio now has 3 properties:
1. SFR in Austin ($450K)
2. 4-unit MF in Charlotte ($850K)  
3. Office in Denver ($1.5M)

Check for:
1. Consistent property counts across sections
2. Accurate financial totals (should sum to $2.8M total investment)
3. No contradictions between different AI sections
4. Property types correctly identified throughout

Respond with JSON:
{
  "verdict": "PASS" or "FAIL",
  "consistent": true/false,
  "accurateTotals": true/false,
  "contradictions": ["list any contradictions found"],
  "issues": ["list of issues if any"]
}`;

  const aiResponse = await callOpenAI(
    'You are a professional real estate validation system. Analyze the content and respond only in JSON format.',
    validationPrompt
  );

  try {
    const validation = JSON.parse(aiResponse);
    
    if (validation.verdict === 'PASS') {
      console.log(`${colors.success}✓ AI content is consistent across all sections${colors.reset}`);
      return { passed: true };
    } else {
      console.log(`${colors.warning}⚠ Consistency issues found:${colors.reset}`);
      if (validation.contradictions.length > 0) {
        console.log(`  Contradictions:`);
        validation.contradictions.forEach(c => console.log(`    - ${c}`));
      }
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      return { passed: false, issues: validation.issues };
    }
  } catch (e) {
    console.error(`${colors.error}✗ Failed to parse AI validation${colors.reset}`);
    return { passed: false, reason: 'AI validation parse error' };
  }
}

async function cleanup() {
  if (testPortfolioId) {
    try {
      await axios.delete(`${BASE_URL}/portfolios/${testPortfolioId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`${colors.info}✓ Test portfolio cleaned up${colors.reset}`);
    } catch (error) {
      console.error(`${colors.warning}⚠ Cleanup failed:`, error.message, colors.reset);
    }
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${'='.repeat(60)}`);
  console.log('Portfolio AI Response Quality Validation');
  console.log('Testing Recent Fixes: Peer Comparison & Goal Path');
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  try {
    // Setup
    if (!await authenticateUser()) {
      throw new Error('Authentication failed');
    }

    await createTestPortfolio();

    // Test 1: Peer Comparison Dynamic Content
    console.log(`\n${colors.info}Test 1: Peer Comparison Dynamic Content${colors.reset}`);
    const test1 = await validatePeerComparisonDynamicContent();
    results.total++;
    if (test1.passed) {
      results.passed++;
      console.log(`${colors.success}✅ PASSED${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.error}❌ FAILED${colors.reset}`);
    }

    // Test 2: Goal Path Dynamic Content
    console.log(`\n${colors.info}Test 2: Goal Path Dynamic Content${colors.reset}`);
    const test2 = await validateGoalPathDynamicContent();
    results.total++;
    if (test2.passed) {
      results.passed++;
      console.log(`${colors.success}✅ PASSED${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.error}❌ FAILED${colors.reset}`);
    }

    // Test 3: Cross-Property Consistency
    console.log(`\n${colors.info}Test 3: Cross-Property Consistency${colors.reset}`);
    const test3 = await validateCrossPropertyConsistency();
    results.total++;
    if (test3.passed) {
      results.passed++;
      console.log(`${colors.success}✅ PASSED${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.error}❌ FAILED${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.error}Test execution error:`, error.message, colors.reset);
  } finally {
    await cleanup();
  }

  // Final summary
  console.log(`\n${colors.bold}${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(60)}${colors.reset}`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.success}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.error}Failed: ${results.failed}${colors.reset}`);
  
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(0) : 0;
  const statusColor = passRate >= 80 ? colors.success : passRate >= 60 ? colors.warning : colors.error;
  console.log(`${statusColor}Pass Rate: ${passRate}%${colors.reset}`);

  if (passRate >= 80) {
    console.log(`\n${colors.success}✨ AI Response Quality Validation SUCCESSFUL ✨${colors.reset}`);
    console.log('Recent fixes for peer comparison and goal path are working correctly!');
  } else {
    console.log(`\n${colors.error}⚠️  AI Response Quality Needs Attention ⚠️${colors.reset}`);
    console.log('Some AI fixes may need additional refinement.');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  validatePeerComparisonDynamicContent,
  validateGoalPathDynamicContent,
  validateCrossPropertyConsistency
};