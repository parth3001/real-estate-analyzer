#!/usr/bin/env node

/**
 * Portfolio Analyzed Properties Test Suite
 * 
 * CRITICAL: Tests the real user workflow of analyzing properties then adding to portfolios
 * This test would have caught the bug where portfolio analytics recalculated instead of 
 * using existing analysis results.
 * 
 * Workflow: Property Analysis → Portfolio Addition → Validate Analytics Match
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'admin@realestateanalyzer.com', 
  password: 'Spring@2025'
};

// Real-world property scenarios that produce different cash flow outcomes
const testScenarios = [
  {
    name: "Positive Cash Flow Property",
    description: "Good rental in affordable market",
    propertyData: {
      propertyType: 'SFR',
      propertyName: 'Test Positive Cash Flow SFR',
      address: '123 Profitable St',
      city: 'Cleveland',
      state: 'OH',
      zipCode: '44101',
      
      // Financial inputs that should produce positive cash flow
      purchasePrice: 150000,
      downPayment: 30000, // 20%
      interestRate: 7.0,
      loanTerm: 30,
      
      // Income
      monthlyRent: 1800,
      
      // Expenses  
      propertyTaxRate: 1.5,
      insuranceRate: 0.8,
      maintenanceCost: 200,
      propertyManagementRate: 8,
      
      // Property details
      yearBuilt: 2010,
      squareFootage: 1600,
      bedrooms: 3,
      bathrooms: 2,
      
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3,
        sellingCostsPercentage: 6,
        vacancyRate: 5
      }
    }
  },
  {
    name: "Negative Cash Flow Property", 
    description: "Expensive market with low rent-to-price ratio",
    propertyData: {
      propertyType: 'SFR',
      propertyName: 'Test Negative Cash Flow SFR',
      address: '456 Expensive Ave',
      city: 'San Francisco',
      state: 'CA', 
      zipCode: '94101',
      
      // Financial inputs that should produce negative cash flow
      purchasePrice: 850000,
      downPayment: 170000, // 20%
      interestRate: 7.5,
      loanTerm: 30,
      
      // Income (low for price)
      monthlyRent: 4200,
      
      // Expenses (high for expensive area)
      propertyTaxRate: 1.2,
      insuranceRate: 0.6,
      maintenanceCost: 400,
      propertyManagementRate: 10,
      hoaFees: 300,
      
      // Property details
      yearBuilt: 2015,
      squareFootage: 1400,
      bedrooms: 2,
      bathrooms: 2,
      
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualPropertyValueIncrease: 4,
        sellingCostsPercentage: 6,
        vacancyRate: 4
      }
    }
  },
  {
    name: "Break-Even Property",
    description: "Marginal deal that barely breaks even", 
    propertyData: {
      propertyType: 'SFR',
      propertyName: 'Test Break-Even SFR',
      address: '789 Neutral St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      
      // Financial inputs designed for near break-even
      purchasePrice: 320000,
      downPayment: 64000, // 20%
      interestRate: 7.2,
      loanTerm: 30,
      
      // Income
      monthlyRent: 2600,
      
      // Expenses
      propertyTaxRate: 0.8,
      insuranceRate: 0.5,
      maintenanceCost: 250,
      propertyManagementRate: 8,
      
      // Property details
      yearBuilt: 2018,
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      
      longTermAssumptions: {
        projectionYears: 10,
        annualRentIncrease: 3,
        annualPropertyValueIncrease: 3.5,
        sellingCostsPercentage: 6,
        vacancyRate: 5
      }
    }
  }
];

class PortfolioAnalyzedPropertiesTest {
  constructor() {
    this.token = null;
    this.testResults = {
      analyzedProperties: [],
      portfolioAnalytics: null,
      validationResults: []
    };
  }

  /**
   * Authenticate with test user
   */
  async authenticate() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
      this.token = response.data.accessToken;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Analyze AND save a property (matching real user workflow)
   * This is what the real user does: analyze through UI which saves to database
   */
  async analyzeAndSaveProperty(scenario, portfolioId = null) {
    try {
      console.log(`🔬 Analyzing: ${scenario.name}`);
      
      // Step 1: Analyze the property (same as /deals/analyze)
      const analysisResponse = await axios.post(
        `${BASE_URL}/deals/analyze`,
        scenario.propertyData,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
          timeout: 30000
        }
      );

      const analysis = analysisResponse.data;
      const cashFlow = analysis.monthlyAnalysis?.cashFlow || 0;
      const verdict = analysis.investmentDecision?.verdict || 'UNKNOWN';
      
      console.log(`   💰 Monthly Cash Flow: $${cashFlow.toLocaleString()}`);
      console.log(`   🎯 Investment Verdict: ${verdict}`);
      
      // Step 2: Save the property with analysis data AND portfolioId (this is the key!)
      const saveData = {
        ...scenario.propertyData,
        propertyAddress: {
          street: scenario.propertyData.address,
          city: scenario.propertyData.city,
          state: scenario.propertyData.state,
          zipCode: scenario.propertyData.zipCode
        },
        analysis: analysis,
        portfolioId: portfolioId // This links the deal to the portfolio when saved
      };
      
      const saveResponse = await axios.post(
        `${BASE_URL}/deals`,
        saveData,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
          timeout: 30000
        }
      );

      const savedDeal = saveResponse.data;
      console.log(`   💾 Saved Deal ID: ${savedDeal._id}`);
      console.log(`   🔗 Portfolio ID in saved deal: ${savedDeal.portfolioId}`);
      
      this.testResults.analyzedProperties.push({
        scenario: scenario.name,
        dealId: savedDeal._id,
        expectedCashFlow: cashFlow,
        expectedIncome: analysis.monthlyAnalysis?.income?.gross || scenario.propertyData.monthlyRent,
        expectedExpenses: analysis.monthlyAnalysis?.expenses?.total || 0,
        verdict: verdict,
        analysis: analysis,
        savedDeal: savedDeal
      });
      
      return savedDeal;
      
    } catch (error) {
      console.error(`❌ Analysis/Save failed for ${scenario.name}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create portfolio first, then analyze and save properties with portfolioId
   * This matches the real user workflow more closely
   */
  async createPortfolioAndAnalyzeProperties() {
    try {
      console.log('\n🏗️  Creating test portfolio...');
      
      const portfolioResponse = await axios.post(`${BASE_URL}/portfolios`, {
        name: 'Analyzed Properties Test Portfolio',
        description: 'Testing portfolio analytics with pre-analyzed properties',
        goals: {
          primaryGoal: 'CASH_FLOW',
          targetMonthlyIncome: 5000,
          targetTimeline: '5 years',
          riskTolerance: 'MODERATE'
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const portfolioId = portfolioResponse.data.portfolio?.id;
      console.log(`✅ Portfolio created: ${portfolioId}`);

      // Now analyze and save each property with the portfolioId set
      console.log('\n🔬 Analyzing and saving properties with portfolio link...');
      for (const scenario of testScenarios) {
        console.log(`\n   Processing: ${scenario.name}`);
        await this.analyzeAndSaveProperty(scenario, portfolioId);
      }

      return portfolioId;
      
    } catch (error) {
      console.error('❌ Portfolio creation/analysis failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Validate portfolio analytics against individual analysis results
   */
  async validatePortfolioAnalytics(portfolioId) {
    try {
      console.log('\n📊 Calculating and validating portfolio analytics...');
      
      // Trigger portfolio analytics calculation
      await axios.post(`${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`, {}, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      // Get portfolio details with analytics
      const response = await axios.get(`${BASE_URL}/portfolios/${portfolioId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const portfolio = response.data;
      const analytics = portfolio.analytics?.summary;

      if (!analytics) {
        throw new Error('No portfolio analytics generated');
      }

      this.testResults.portfolioAnalytics = analytics;

      // Calculate expected totals from individual analyses
      let expectedTotalCashFlow = 0;
      let expectedTotalIncome = 0;
      let expectedTotalExpenses = 0;

      this.testResults.analyzedProperties.forEach(prop => {
        expectedTotalCashFlow += prop.expectedCashFlow;
        expectedTotalIncome += prop.expectedIncome;
        expectedTotalExpenses += prop.expectedExpenses;
      });

      console.log('\n🎯 VALIDATION RESULTS:');
      console.log('======================');

      // Validate cash flow
      const cashFlowMatch = Math.abs(expectedTotalCashFlow - analytics.monthlyNetCashFlow) < 50;
      console.log(`Expected Cash Flow: $${expectedTotalCashFlow.toLocaleString()}`);
      console.log(`Portfolio Cash Flow: $${analytics.monthlyNetCashFlow.toLocaleString()}`);
      console.log(`Cash Flow Match: ${cashFlowMatch ? '✅ PASS' : '❌ FAIL'}`);

      // Validate income  
      const incomeMatch = Math.abs(expectedTotalIncome - analytics.monthlyRentalIncome) < 50;
      console.log(`Expected Income: $${expectedTotalIncome.toLocaleString()}`);
      console.log(`Portfolio Income: $${analytics.monthlyRentalIncome.toLocaleString()}`);
      console.log(`Income Match: ${incomeMatch ? '✅ PASS' : '❌ FAIL'}`);

      // Store validation results
      this.testResults.validationResults.push(
        { metric: 'cashFlow', expected: expectedTotalCashFlow, actual: analytics.monthlyNetCashFlow, match: cashFlowMatch },
        { metric: 'income', expected: expectedTotalIncome, actual: analytics.monthlyRentalIncome, match: incomeMatch }
      );

      // Display individual property contributions
      console.log('\n📋 Individual Property Contributions:');
      console.log('====================================');
      this.testResults.analyzedProperties.forEach((prop, i) => {
        console.log(`${i + 1}. ${prop.scenario}:`);
        console.log(`   Cash Flow: $${prop.expectedCashFlow.toLocaleString()}`);
        console.log(`   Verdict: ${prop.verdict}`);
      });

      return {
        allValidationsPassed: this.testResults.validationResults.every(v => v.match),
        results: this.testResults.validationResults
      };

    } catch (error) {
      console.error('❌ Portfolio analytics validation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Clean up test data
   */
  async cleanup(portfolioId) {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      // Archive portfolio
      await axios.put(`${BASE_URL}/portfolios/${portfolioId}`, {
        status: 'ARCHIVED'
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      console.log('✅ Test portfolio archived');
    } catch (error) {
      console.log('⚠️  Cleanup warning:', error.message);
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 TEST EXECUTION REPORT');
    console.log('=========================');
    
    const totalProperties = this.testResults.analyzedProperties.length;
    const passedValidations = this.testResults.validationResults.filter(v => v.match).length;
    const totalValidations = this.testResults.validationResults.length;
    
    console.log(`Properties Analyzed: ${totalProperties}`);
    console.log(`Validations Passed: ${passedValidations}/${totalValidations}`);
    
    if (passedValidations === totalValidations) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Portfolio analytics correctly use individual analysis results');
      console.log('✅ No recalculation errors detected'); 
      console.log('✅ Cash flow aggregation working properly');
    } else {
      console.log('\n❌ SOME TESTS FAILED!');
      console.log('⚠️  Portfolio analytics may be recalculating instead of using analysis data');
      
      this.testResults.validationResults.forEach(result => {
        if (!result.match) {
          const diff = Math.abs(result.expected - result.actual);
          console.log(`❌ ${result.metric}: Expected ${result.expected}, got ${result.actual} (diff: ${diff})`);
        }
      });
    }
    
    return passedValidations === totalValidations;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 PORTFOLIO ANALYZED PROPERTIES TEST SUITE');
  console.log('============================================');
  console.log('Testing real user workflow: Analyze → Add to Portfolio → Validate\n');
  
  const tester = new PortfolioAnalyzedPropertiesTest();
  let allTestsPassed = false;
  let portfolioId = null;
  
  try {
    // Step 1: Authenticate
    const authenticated = await tester.authenticate();
    if (!authenticated) {
      process.exit(1);
    }
    
    // Step 2: Create portfolio and analyze properties with proper linking  
    console.log('\n🏗️  STEP 1: CREATING PORTFOLIO AND ANALYZING PROPERTIES');
    console.log('=====================================================');
    portfolioId = await tester.createPortfolioAndAnalyzeProperties();
    
    // Step 3: Validate portfolio analytics match individual analyses
    console.log('\n🎯 STEP 2: VALIDATING PORTFOLIO ANALYTICS');
    console.log('=========================================');
    const validationResult = await tester.validatePortfolioAnalytics(portfolioId);
    allTestsPassed = validationResult.allValidationsPassed;
    
    // Step 4: Generate report
    const reportPassed = tester.generateReport();
    allTestsPassed = allTestsPassed && reportPassed;
    
  } catch (error) {
    console.error('\n💥 TEST EXECUTION FAILED:', error.message);
    allTestsPassed = false;
  } finally {
    // Cleanup
    if (portfolioId) {
      await tester.cleanup(portfolioId);
    }
  }
  
  // Exit with appropriate code
  const exitCode = allTestsPassed ? 0 : 1;
  console.log(`\n${allTestsPassed ? '🎉' : '💥'} Test suite ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  process.exit(exitCode);
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { PortfolioAnalyzedPropertiesTest, testScenarios };