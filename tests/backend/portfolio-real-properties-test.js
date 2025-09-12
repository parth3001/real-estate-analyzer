#!/usr/bin/env node

/**
 * REAL PORTFOLIO AI TESTING WITH ZILLOW PROPERTIES
 * Senior QE Engineer Implementation - Amazon Best Practices
 * 
 * Tests Portfolio AI endpoints with ACTUAL properties provided by user:
 * 1. Creates Cash Flow optimized portfolio 
 * 2. Creates Wealth Building optimized portfolio
 * 3. Validates AI content for each portfolio strategy
 * 4. Tests all 4 Portfolio AI endpoints with real data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// CRITICAL QE FIX: Add Expert Domain Validator for Portfolio AI validation
const { ExpertDomainValidator } = require('./expert-validation/expert-domain-validator');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:3001',
  testOutputDir: './test-results',
  reportFile: './test-results/portfolio-real-properties-report.md'
};

// Test credentials
const TEST_USER = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025'
};

// Real Zillow properties provided by user
const REAL_ZILLOW_PROPERTIES = [
  {
    name: 'Anna, TX Single Family',
    address: '2110 Sweet Gum Dr, Anna, TX 75409',
    purchasePrice: 319999,
    propertyType: 'SFR',
    // Market data from testing
    monthlyRent: 1500,
    capRate: 2.61,
    cashFlow: -796.67,
    marketTier: 'Secondary'
  },
  {
    name: 'Jersey City, NJ Condo',
    address: '250 Van Horne St #2, Jersey City, NJ 07304', 
    purchasePrice: 425000,
    propertyType: 'SFR',
    // Market data from testing
    monthlyRent: 1500,
    capRate: 0.20,
    cashFlow: -1913.38,
    marketTier: 'Primary'
  },
  {
    name: 'East Lansing, MI Property',
    address: '3040 Hamlet Cir, East Lansing, MI 48823',
    purchasePrice: 349900,
    propertyType: 'SFR', 
    // Market data from testing
    monthlyRent: 1500,
    capRate: 2.23,
    cashFlow: -983.57,
    marketTier: 'College Town'
  }
];

// Portfolio configurations
const PORTFOLIO_CONFIGS = [
  {
    strategy: 'CASH_FLOW',
    name: 'Monthly Income Portfolio',
    description: 'Optimized for maximum monthly cash flow generation',
    goals: {
      primaryGoal: 'CASH_FLOW',
      targetMonthlyIncome: 3000,
      targetTimeline: '5 years', // Valid enum value
      riskTolerance: 'MODERATE'
    }
  },
  {
    strategy: 'WEALTH_BUILDING',
    name: 'Long-term Wealth Portfolio', 
    description: 'Focused on appreciation and long-term wealth accumulation',
    goals: {
      primaryGoal: 'WEALTH_BUILDING',
      targetNetWorth: 1000000,
      targetTimeline: '10-15 years', // Valid enum value
      riskTolerance: 'AGGRESSIVE'
    }
  }
];

let authToken;
let testResults = [];
let expertValidator;

// Ensure test results directory exists
if (!fs.existsSync(CONFIG.testOutputDir)) {
  fs.mkdirSync(CONFIG.testOutputDir, { recursive: true });
}

async function authenticate() {
  try {
    const response = await axios.post(`${CONFIG.backendUrl}/api/auth/login`, TEST_USER);
    authToken = response.data.accessToken;
    console.log('✅ Authentication successful');
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function createDealFromProperty(property) {
  const propertyData = {
    propertyName: property.name,
    propertyType: property.propertyType,
    propertyAddress: parseAddress(property.address),
    purchasePrice: property.purchasePrice,
    monthlyRent: property.monthlyRent,
    downPayment: Math.round(property.purchasePrice * 0.20), // 20% down
    interestRate: 7.25,
    loanTerm: 30,
    squareFootage: 1800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2005,
    propertyTaxRate: 1.2,
    insuranceRate: 0.7,
    maintenanceCost: Math.round(property.monthlyRent * 12 * 0.08), // 8% of rent
    propertyManagementRate: 8,
    vacancyRate: 5,
    hoaFees: 0,
    closingCosts: Math.round(property.purchasePrice * 0.025),
    capitalInvestments: 0,
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 3.5,
      sellingCostsPercentage: 6,
      vacancyRate: 5,
      turnoverFrequency: 2,
      inflationRate: 2.5
    }
  };

  try {
    const response = await axios.post(`${CONFIG.backendUrl}/api/deals/analyze`, propertyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Created deal for ${property.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create deal for ${property.name}:`, error.response?.data || error.message);
    throw error;
  }
}

function parseAddress(addressString) {
  const parts = addressString.split(', ');
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2]?.split(' ')[0] || '',
    zipCode: parts[2]?.split(' ')[1] || ''
  };
}

async function createPortfolio(config, dealIds) {
  const portfolioData = {
    name: config.name,
    description: config.description,
    goals: config.goals,
    deals: dealIds
  };

  try {
    const response = await axios.post(`${CONFIG.backendUrl}/api/portfolios`, portfolioData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Created ${config.strategy} portfolio: ${config.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create ${config.strategy} portfolio:`, error.response?.data || error.message);
    throw error;
  }
}

async function testPortfolioAIEndpoint(endpoint, portfolioId, portfolioName) {
  const endpointMap = {
    'health-check': `/api/portfolios/${portfolioId}/health-check`,
    'peer-comparison': `/api/portfolios/${portfolioId}/peer-comparison`, 
    'goal-path': `/api/portfolios/${portfolioId}/goal-path`,
    'comprehensive-insights': `/api/portfolios/${portfolioId}/comprehensive-insights`
  };

  try {
    console.log(`🔍 Testing ${endpoint} endpoint for ${portfolioName}...`);
    const url = `${CONFIG.backendUrl}${endpointMap[endpoint]}`;
    console.log(`🌐 Testing URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const aiContent = response.data;
    
    // Validate AI content quality
    const validation = validateAIContent(aiContent, endpoint, portfolioName);
    
    // CRITICAL QE FIX: Add expert validation to Portfolio AI testing
    const expertValidation = await validatePortfolioAIWithExpert(aiContent, { goals: { primaryGoal: portfolioName.includes('Cash Flow') ? 'CASH_FLOW' : 'WEALTH_BUILDING' } }, endpoint);
    
    console.log(`✅ ${endpoint} endpoint working - Content quality: ${validation.score}%`);
    console.log(`🧠 Sarah Mitchell Expert Approval: ${expertValidation.expertApproved ? 'APPROVED' : 'REJECTED'} (${expertValidation.expertScore}%)`);
    
    return {
      endpoint,
      portfolioName,
      success: true,
      contentQuality: validation.score,
      aiContent: aiContent,
      validation: validation,
      expertValidation: expertValidation
    };
    
  } catch (error) {
    console.error(`❌ ${endpoint} endpoint failed for ${portfolioName}:`, error.response?.status, error.message);
    
    return {
      endpoint,
      portfolioName, 
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

function validateAIContent(content, endpoint, portfolioName) {
  let score = 0;
  const issues = [];
  
  // Basic validation - content exists and not empty
  if (content && typeof content === 'object' && Object.keys(content).length > 0) {
    score += 25;
  } else {
    issues.push('Empty or invalid content structure');
    return { score: 0, issues };
  }
  
  // Check for meaningful text content (not just $0 values)
  const contentStr = JSON.stringify(content);
  if (contentStr.includes('$0') || contentStr.includes('undefined') || contentStr.includes('null')) {
    issues.push('Contains $0, undefined, or null values');
  } else {
    score += 25;
  }
  
  // Check for strategy-relevant content
  if (portfolioName.includes('Cash Flow')) {
    if (contentStr.toLowerCase().includes('cash flow') || contentStr.toLowerCase().includes('income')) {
      score += 25;
    } else {
      issues.push('Missing cash flow strategy context');
    }
  } else if (portfolioName.includes('Wealth')) {
    if (contentStr.toLowerCase().includes('wealth') || contentStr.toLowerCase().includes('appreciation')) {
      score += 25;
    } else {
      issues.push('Missing wealth building strategy context');
    }
  }
  
  // Check for actionable insights
  if (contentStr.length > 100 && (contentStr.includes('recommend') || contentStr.includes('consider') || contentStr.includes('suggest'))) {
    score += 25;
  } else {
    issues.push('Lacks actionable recommendations');
  }
  
  return { score, issues };
}

// CRITICAL QE FIX: Expert validation of Portfolio AI recommendations
async function validatePortfolioAIWithExpert(aiContent, portfolioData, endpoint) {
  try {
    console.log(`🧠 Running expert validation on ${endpoint} AI content...`);
    
    // Initialize expert validator if not already done
    if (!expertValidator) {
      expertValidator = new ExpertDomainValidator();
      await expertValidator.framework.initialize();
    }
    
    // Extract AI recommendations text for expert analysis
    let aiRecommendations = '';
    if (aiContent.healthCheck) {
      aiRecommendations += `Health Check: ${JSON.stringify(aiContent.healthCheck)}`;
    }
    if (aiContent.peerComparison) {
      aiRecommendations += ` Peer Analysis: ${JSON.stringify(aiContent.peerComparison)}`;
    }
    if (aiContent.goalPath) {
      aiRecommendations += ` Goal Path: ${JSON.stringify(aiContent.goalPath)}`;
    }
    if (aiContent.insights) {
      aiRecommendations += ` Insights: ${JSON.stringify(aiContent.insights)}`;
    }
    
    // Run expert validation using Sarah Mitchell's investment philosophy
    const expertValidation = await expertValidator.validateAIRecommendations({
      aiRecommendations: aiRecommendations,
      portfolioStrategy: portfolioData.goals?.primaryGoal || 'UNKNOWN',
      portfolioValue: portfolioData.analytics?.summary?.totalValue || 0,
      monthlyFlow: portfolioData.analytics?.summary?.monthlyNetCashFlow || 0,
      capRate: portfolioData.analytics?.summary?.averageCapRate || 0,
      endpoint: endpoint
    });
    
    console.log(`🧠 Expert validation result: ${expertValidation.approved ? 'APPROVED' : 'REJECTED'}`);
    
    return {
      expertApproved: expertValidation.approved,
      expertScore: expertValidation.score,
      expertConcerns: expertValidation.concerns || [],
      expertReasoning: expertValidation.reasoning,
      sarahMitchellVerdict: expertValidation.verdict
    };
    
  } catch (error) {
    console.error(`❌ Expert validation failed for ${endpoint}:`, error.message);
    return {
      expertApproved: false,
      expertScore: 0,
      expertConcerns: ['Expert validation system error'],
      expertReasoning: `Validation failed: ${error.message}`,
      sarahMitchellVerdict: 'VALIDATION_ERROR'
    };
  }
}

async function runPortfolioAITests() {
  console.log('🚀 Starting Real Portfolio AI Testing with Zillow Properties\n');
  
  // Step 1: Authenticate
  await authenticate();
  
  // Step 2: Create deals from real properties
  console.log('\n📊 Creating deals from real Zillow properties...');
  const deals = [];
  
  for (const property of REAL_ZILLOW_PROPERTIES) {
    try {
      const deal = await createDealFromProperty(property);
      deals.push({
        dealId: deal._id || deal.id,
        property: property,
        analysis: deal
      });
    } catch (error) {
      console.error(`Failed to create deal for ${property.name}, skipping...`);
    }
  }
  
  if (deals.length === 0) {
    console.error('❌ No deals created successfully. Exiting.');
    process.exit(1);
  }
  
  console.log(`✅ Created ${deals.length} deals from real properties`);
  
  // Step 3: Create portfolios with different strategies
  console.log('\n📁 Creating portfolios with real properties...');
  const dealIds = deals.map(d => d.dealId);
  const portfolios = [];
  
  for (const config of PORTFOLIO_CONFIGS) {
    try {
      const portfolioResponse = await createPortfolio(config, dealIds);
      // Handle response format: {success: true, portfolio: {...}}
      const portfolio = portfolioResponse.portfolio || portfolioResponse;
      const portfolioId = portfolio._id || portfolio.id;
      
      console.log(`📋 Created portfolio with ID: ${portfolioId}`);
      
      portfolios.push({
        portfolioId: portfolioId,
        config: config,
        portfolio: portfolio
      });
    } catch (error) {
      console.error(`Failed to create ${config.strategy} portfolio, skipping...`);
    }
  }
  
  if (portfolios.length === 0) {
    console.error('❌ No portfolios created successfully. Exiting.');
    process.exit(1);
  }
  
  console.log(`✅ Created ${portfolios.length} portfolios`);
  
  // Step 4: Test all Portfolio AI endpoints
  console.log('\n🤖 Testing Portfolio AI endpoints...');
  const aiEndpoints = ['health-check', 'peer-comparison', 'goal-path', 'comprehensive-insights'];
  
  for (const portfolio of portfolios) {
    console.log(`\n📋 Testing AI endpoints for: ${portfolio.config.name}`);
    
    for (const endpoint of aiEndpoints) {
      const result = await testPortfolioAIEndpoint(endpoint, portfolio.portfolioId, portfolio.config.name);
      testResults.push(result);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Step 5: Generate report
  await generateReport();
  
  console.log('\n✅ Portfolio AI testing completed!');
  console.log(`📄 Report saved to: ${CONFIG.reportFile}`);
}

async function generateReport() {
  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);
  const avgContentQuality = successfulTests.length > 0 ? 
    successfulTests.reduce((sum, r) => sum + r.contentQuality, 0) / successfulTests.length : 0;
    
  // CRITICAL QE FIX: Add expert validation metrics
  const expertApprovedTests = successfulTests.filter(r => r.expertValidation?.expertApproved);
  const avgExpertScore = successfulTests.length > 0 ? 
    successfulTests.reduce((sum, r) => sum + (r.expertValidation?.expertScore || 0), 0) / successfulTests.length : 0;
  
  const reportContent = `# Real Portfolio AI Testing Report
**Generated: ${new Date().toISOString()}**

## 🎯 Test Summary
- **Total Tests**: ${testResults.length}
- **Successful**: ${successfulTests.length}
- **Failed**: ${failedTests.length}
- **Success Rate**: ${((successfulTests.length / testResults.length) * 100).toFixed(1)}%
- **Avg Content Quality**: ${avgContentQuality.toFixed(1)}%
- **🧠 Expert Approved**: ${expertApprovedTests.length}/${successfulTests.length} (${expertApprovedTests.length > 0 ? ((expertApprovedTests.length / successfulTests.length) * 100).toFixed(1) : '0.0'}%)
- **🧠 Sarah Mitchell Score**: ${avgExpertScore.toFixed(1)}%

## 📊 Real Properties Tested
${REAL_ZILLOW_PROPERTIES.map(p => `- **${p.name}**: $${p.purchasePrice.toLocaleString()} (${p.marketTier})`).join('\n')}

## 📁 Portfolio Strategies  
${PORTFOLIO_CONFIGS.map(c => `- **${c.name}**: ${c.goals.primaryGoal} focused`).join('\n')}

## 🤖 AI Endpoint Results

### Successful Tests
${successfulTests.map(r => `
#### ${r.endpoint} - ${r.portfolioName}
- **Content Quality**: ${r.contentQuality}%
- **🧠 Sarah Mitchell**: ${r.expertValidation?.expertApproved ? '✅ APPROVED' : '❌ REJECTED'} (${r.expertValidation?.expertScore || 0}%)
- **Expert Concerns**: ${r.expertValidation?.concerns?.length > 0 ? r.expertValidation.concerns.join('; ') : 'None'}
- **Issues**: ${r.validation.issues.length > 0 ? r.validation.issues.join(', ') : 'None'}
`).join('')}

### Failed Tests  
${failedTests.map(r => `
#### ${r.endpoint} - ${r.portfolioName}
- **Status**: ${r.status || 'Unknown'}
- **Error**: ${r.error}
`).join('')}

## 🔍 QE Analysis
**Portfolio AI Infrastructure Status**: ${successfulTests.length >= 6 ? '✅ PRODUCTION READY' : '❌ NEEDS FIXES'}

### Key Findings
- Real property integration: ${successfulTests.length > 0 ? '✅ Working' : '❌ Failed'}
- AI content generation: ${avgContentQuality >= 70 ? '✅ Good quality' : '⚠️ Needs improvement'}
- Strategy differentiation: ${testResults.some(r => r.success && r.portfolioName.includes('Cash Flow')) && testResults.some(r => r.success && r.portfolioName.includes('Wealth')) ? '✅ Working' : '❌ Not working'}

### Recommendations
${failedTests.length > 0 ? '1. Fix failing endpoints before production deployment' : ''}
${avgContentQuality < 80 ? '2. Improve AI content quality and strategy alignment' : ''}
${successfulTests.length < 4 ? '3. Ensure all core portfolio endpoints are functional' : ''}

---
*Generated by Senior QE Engineer - Real Portfolio AI Testing Framework*
`;
  
  fs.writeFileSync(CONFIG.reportFile, reportContent);
}

// Run the tests
if (require.main === module) {
  runPortfolioAITests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runPortfolioAITests };