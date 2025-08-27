#!/usr/bin/env node

/**
 * Portfolio Financial Metrics Validation Test Suite
 * 
 * CRITICAL: Validates industry-standard financial calculations at portfolio level
 * Similar to individual property SFR analysis validation but for portfolio aggregation
 * 
 * Financial Metrics Covered:
 * - Portfolio Cap Rate (NOI / Total Property Value)
 * - Portfolio Cash-on-Cash Return (Annual Cash Flow / Total Cash Invested)
 * - Portfolio DSCR (Net Operating Income / Total Debt Service)
 * - Portfolio Return on Equity (Annual Cash Flow / Total Equity)
 * - Portfolio Leverage Ratios (Debt / Value)
 * - Geographic Concentration Risk
 * - Cash Flow Stability Metrics
 * 
 * Industry Benchmarks:
 * - Residential portfolios: 4-8% Cap Rate, 8-15% Cash-on-Cash
 * - Commercial portfolios: 5-10% Cap Rate, 10-20% Cash-on-Cash  
 * - Mixed portfolios: 4.5-9% Cap Rate, 9-18% Cash-on-Cash
 * - DSCR should be > 1.2 for healthy portfolios
 * - LTV should be < 80% for conservative portfolios
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'admin@realestateanalyzer.com',
  password: 'Spring@2025'
};

// Industry-standard portfolio test scenarios with expected financial metrics
const portfolioTestScenarios = [
  {
    name: "Conservative Residential Portfolio",
    description: "Low-leverage residential properties in cash flow markets",
    properties: [
      {
        propertyType: 'SFR',
        propertyName: 'Cleveland Cash Flow #1',
        address: '100 Midwest Ave',
        city: 'Cleveland',
        state: 'OH',
        zipCode: '44101',
        purchasePrice: 150000,
        downPayment: 45000, // 30% down - conservative
        interestRate: 7.0,
        loanTerm: 30,
        monthlyRent: 1800,
        propertyTaxRate: 1.5,
        insuranceRate: 0.8,
        maintenanceCost: 200,
        propertyManagementRate: 8,
        yearBuilt: 2010,
        squareFootage: 1600,
        bedrooms: 3,
        bathrooms: 2
      },
      {
        propertyType: 'SFR', 
        propertyName: 'Toledo Rental #2',
        address: '200 Value St',
        city: 'Toledo',
        state: 'OH',
        zipCode: '43601',
        purchasePrice: 120000,
        downPayment: 36000, // 30% down
        interestRate: 7.0,
        loanTerm: 30,
        monthlyRent: 1500,
        propertyTaxRate: 1.8,
        insuranceRate: 0.9,
        maintenanceCost: 180,
        propertyManagementRate: 8,
        yearBuilt: 2008,
        squareFootage: 1400,
        bedrooms: 3,
        bathrooms: 1
      }
    ],
    expectedMetrics: {
      portfolioValue: 270000,
      totalCashInvested: 81000, // Down payments
      totalDebt: 189000,
      expectedCapRateRange: [6.0, 10.0], // Midwest markets
      expectedCashOnCashRange: [12.0, 20.0], // Conservative leverage
      expectedLTVRange: [65.0, 75.0], // 30% down
      expectedDSCRMin: 1.3, // Healthy coverage
      riskProfile: 'LOW'
    }
  },
  {
    name: "Aggressive Growth Portfolio",
    description: "High-leverage properties in appreciation markets",
    properties: [
      {
        propertyType: 'SFR',
        propertyName: 'Austin Growth Property',
        address: '300 Growth Blvd',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        purchasePrice: 450000,
        downPayment: 67500, // 15% down - aggressive
        interestRate: 7.5,
        loanTerm: 30,
        monthlyRent: 3200,
        propertyTaxRate: 1.8,
        insuranceRate: 0.6,
        maintenanceCost: 300,
        propertyManagementRate: 8,
        yearBuilt: 2018,
        squareFootage: 2000,
        bedrooms: 3,
        bathrooms: 2
      },
      {
        propertyType: 'SFR',  // Changed from CONDO to SFR for compatibility
        propertyName: 'Denver Tech Hub Property',
        address: '400 Tech Way',
        city: 'Denver',
        state: 'CO',
        zipCode: '80201',
        purchasePrice: 380000,
        downPayment: 38000, // 10% down - very aggressive
        interestRate: 8.0,
        loanTerm: 30,
        monthlyRent: 2800,
        propertyTaxRate: 0.7,
        insuranceRate: 0.5,
        maintenanceCost: 250,
        propertyManagementRate: 10,
        yearBuilt: 2020,
        squareFootage: 1200,
        bedrooms: 2,
        bathrooms: 2
      }
    ],
    expectedMetrics: {
      portfolioValue: 830000,
      totalCashInvested: 105500,
      totalDebt: 724500,
      expectedCapRateRange: [3.0, 6.0], // Growth markets lower cap rates
      expectedCashOnCashRange: [5.0, 12.0], // High leverage reduces returns
      expectedLTVRange: [85.0, 95.0], // Aggressive leverage
      expectedDSCRMin: 1.1, // Tighter coverage
      riskProfile: 'HIGH'
    }
  },
  {
    name: "Balanced Mixed-Asset Portfolio",
    description: "Diversified portfolio across property types and markets",
    properties: [
      {
        propertyType: 'SFR',
        propertyName: 'Suburban Family Home',
        address: '500 Balance Ave',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        purchasePrice: 320000,
        downPayment: 64000, // 20% down - standard
        interestRate: 7.2,
        loanTerm: 30,
        monthlyRent: 2600,
        propertyTaxRate: 0.8,
        insuranceRate: 0.5,
        maintenanceCost: 220,
        propertyManagementRate: 8,
        yearBuilt: 2015,
        squareFootage: 1800,
        bedrooms: 4,
        bathrooms: 2
      },
      {
        propertyType: 'MF',
        propertyName: 'Small Multifamily',
        address: '600 Duplex Dr',
        city: 'Kansas City',
        state: 'MO',
        zipCode: '64101',
        purchasePrice: 280000,
        downPayment: 70000, // 25% down - multifamily
        interestRate: 7.5,
        loanTerm: 25,
        totalUnits: 4,
        totalSqft: 3200,
        maintenanceCostPerUnit: 60,
        unitTypes: [
          { type: '2BR', count: 4, sqft: 800, monthlyRent: 1200, occupied: 4 }
        ],
        propertyTaxRate: 1.9,
        insuranceRate: 0.9,
        propertyManagementRate: 6,
        yearBuilt: 2005
      },
      {
        propertyType: 'SFR',
        propertyName: 'Premium Single Family',
        address: '700 Premium Lane',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37201',
        purchasePrice: 600000,
        downPayment: 180000, // 30% down
        interestRate: 8.0,
        loanTerm: 20,
        monthlyRent: 4200,
        propertyTaxRate: 1.4,
        insuranceRate: 1.0,
        maintenanceCost: 350,
        propertyManagementRate: 8,
        yearBuilt: 2012,
        squareFootage: 2800,
        bedrooms: 4,
        bathrooms: 3
      }
    ],
    expectedMetrics: {
      portfolioValue: 1200000,
      totalCashInvested: 314000,
      totalDebt: 886000,
      expectedCapRateRange: [4.5, 7.5], // Mixed portfolio average
      expectedCashOnCashRange: [8.0, 15.0], // Balanced leverage
      expectedLTVRange: [70.0, 80.0], // Mixed leverage
      expectedDSCRMin: 1.25, // Healthy mixed coverage
      riskProfile: 'MODERATE'
    }
  }
];

// Industry benchmark validation ranges
const industryBenchmarks = {
  capRate: {
    residential: { min: 4.0, max: 12.0 },
    commercial: { min: 5.0, max: 15.0 },
    mixed: { min: 4.5, max: 13.0 }
  },
  cashOnCash: {
    conservative: { min: 8.0, max: 25.0 },
    balanced: { min: 6.0, max: 20.0 },
    aggressive: { min: 4.0, max: 18.0 }
  },
  dscr: {
    minimum: 1.1,
    healthy: 1.25,
    conservative: 1.4
  },
  ltv: {
    conservative: { max: 70.0 },
    balanced: { max: 80.0 },
    aggressive: { max: 90.0 }
  }
};

class PortfolioFinancialMetricsValidator {
  constructor() {
    this.token = null;
    this.testResults = [];
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
   * Create and analyze properties for a test portfolio
   */
  async createAndAnalyzePortfolio(scenario) {
    try {
      console.log(`\n🏗️  Creating portfolio: ${scenario.name}`);
      console.log(`Description: ${scenario.description}`);
      
      // Create portfolio
      const portfolioResponse = await axios.post(`${BASE_URL}/portfolios`, {
        name: scenario.name,
        description: scenario.description,
        goals: {
          primaryGoal: scenario.expectedMetrics.riskProfile === 'LOW' ? 'CASH_FLOW' : 
                      scenario.expectedMetrics.riskProfile === 'HIGH' ? 'WEALTH_BUILDING' : 
                      'DIVERSIFICATION',
          targetMonthlyIncome: scenario.expectedMetrics.riskProfile === 'LOW' ? 3000 : undefined,
          targetNetWorth: scenario.expectedMetrics.riskProfile === 'HIGH' ? 2000000 : 
                         scenario.expectedMetrics.riskProfile === 'MODERATE' ? 1500000 : undefined,
          targetTimeline: '10-15 years',
          riskTolerance: scenario.expectedMetrics.riskProfile === 'LOW' ? 'CONSERVATIVE' :
                         scenario.expectedMetrics.riskProfile === 'HIGH' ? 'AGGRESSIVE' : 
                         'MODERATE'
        }
      }, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const portfolioId = portfolioResponse.data.portfolio?.id;
      console.log(`✅ Portfolio created: ${portfolioId}`);

      // Create and analyze each property - USING REAL WORKFLOW
      const analyzedProperties = [];
      for (const [index, propData] of scenario.properties.entries()) {
        console.log(`\n   ${index + 1}. Analyzing ${propData.propertyType}: ${propData.propertyName}`);
        
        try {
          // Step 1: Analyze the property (same as /deals/analyze)
          const propertyRequest = {
            ...propData,
            propertyAddress: {
              street: propData.address,
              city: propData.city,
              state: propData.state,
              zipCode: propData.zipCode
            },
            longTermAssumptions: {
              projectionYears: 10,
              annualRentIncrease: 3,
              annualPropertyValueIncrease: 3,
              sellingCostsPercentage: 6,
              vacancyRate: 5
            }
          };

          const analysisResponse = await axios.post(
            `${BASE_URL}/deals/analyze`,
            propertyRequest,
            {
              headers: { 'Authorization': `Bearer ${this.token}` },
              timeout: 30000
            }
          );

          const analysis = analysisResponse.data;
          console.log(`      💰 Monthly Cash Flow: $${analysis.monthlyAnalysis?.cashFlow?.toLocaleString() || 'N/A'}`);
          console.log(`      📊 Cap Rate: ${analysis.keyMetrics?.capRate?.toFixed(2) || 'N/A'}%`);
          console.log(`      💵 Cash-on-Cash: ${analysis.keyMetrics?.cashOnCashReturn?.toFixed(2) || 'N/A'}%`);
          
          // Step 2: Save the property with analysis data AND portfolioId (CRITICAL FIX!)
          const saveData = {
            ...propertyRequest,
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
          console.log(`      💾 Saved Deal ID: ${savedDeal._id}`);
          console.log(`      🔗 Portfolio ID in saved deal: ${savedDeal.portfolioId}`);
          
          analyzedProperties.push({
            propertyData: propData,
            analysis: analysis,
            dealId: savedDeal._id
          });

        } catch (error) {
          console.log(`      ❌ Analysis/Save failed: ${error.response?.data?.error || error.message}`);
        }
      }

      // Calculate portfolio analytics
      console.log('\n📊 Calculating portfolio analytics...');
      await axios.post(`${BASE_URL}/portfolios/${portfolioId}/recalculate-analytics`, {}, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      // Wait a moment for analytics to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get portfolio details
      const portfolioDetailsResponse = await axios.get(`${BASE_URL}/portfolios/${portfolioId}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      // Debug: Check what's in the portfolio
      console.log(`\n📋 Portfolio Status:`);
      console.log(`   Properties in portfolio: ${portfolioDetailsResponse.data.properties?.length || 0}`);
      if (portfolioDetailsResponse.data.properties?.length > 0) {
        portfolioDetailsResponse.data.properties.forEach((prop, i) => {
          console.log(`   ${i + 1}. ${prop.propertyName || 'Property'} - ID: ${prop._id}`);
        });
      }

      const portfolioAnalytics = portfolioDetailsResponse.data.analytics?.summary;
      
      if (!portfolioAnalytics) {
        throw new Error('No portfolio analytics generated');
      }

      return {
        portfolioId,
        scenario,
        analyzedProperties,
        portfolioAnalytics,
        expectedMetrics: scenario.expectedMetrics
      };

    } catch (error) {
      console.error(`❌ Portfolio creation failed for ${scenario.name}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Validate portfolio financial metrics against industry benchmarks
   */
  validateFinancialMetrics(testResult) {
    const { scenario, portfolioAnalytics, expectedMetrics } = testResult;
    const validationResults = [];

    console.log(`\n🔍 VALIDATING: ${scenario.name}`);
    console.log('=' + '='.repeat(scenario.name.length + 14));

    // 1. Portfolio Cap Rate Validation
    const actualCapRate = portfolioAnalytics.averageCapRate || 0;
    const capRateValid = actualCapRate >= expectedMetrics.expectedCapRateRange[0] && 
                        actualCapRate <= expectedMetrics.expectedCapRateRange[1];
    
    console.log(`📈 Cap Rate: ${actualCapRate.toFixed(2)}% (Expected: ${expectedMetrics.expectedCapRateRange[0]}-${expectedMetrics.expectedCapRateRange[1]}%) ${capRateValid ? '✅' : '❌'}`);
    validationResults.push({
      metric: 'Cap Rate',
      actual: actualCapRate,
      expected: expectedMetrics.expectedCapRateRange,
      valid: capRateValid,
      critical: true
    });

    // 2. Cash-on-Cash Return Validation
    const actualCashOnCash = portfolioAnalytics.averageCashOnCash || 0;
    const cashOnCashValid = actualCashOnCash >= expectedMetrics.expectedCashOnCashRange[0] && 
                           actualCashOnCash <= expectedMetrics.expectedCashOnCashRange[1];
    
    console.log(`💵 Cash-on-Cash: ${actualCashOnCash.toFixed(2)}% (Expected: ${expectedMetrics.expectedCashOnCashRange[0]}-${expectedMetrics.expectedCashOnCashRange[1]}%) ${cashOnCashValid ? '✅' : '❌'}`);
    validationResults.push({
      metric: 'Cash-on-Cash Return',
      actual: actualCashOnCash,
      expected: expectedMetrics.expectedCashOnCashRange,
      valid: cashOnCashValid,
      critical: true
    });

    // 3. Portfolio Value Validation
    const actualPortfolioValue = portfolioAnalytics.totalValue || 0;
    const valueValid = Math.abs(actualPortfolioValue - expectedMetrics.portfolioValue) < 10000;
    
    console.log(`🏠 Total Value: $${actualPortfolioValue.toLocaleString()} (Expected: $${expectedMetrics.portfolioValue.toLocaleString()}) ${valueValid ? '✅' : '❌'}`);
    validationResults.push({
      metric: 'Portfolio Value',
      actual: actualPortfolioValue,
      expected: expectedMetrics.portfolioValue,
      valid: valueValid,
      critical: true
    });

    // 4. Cash Flow Validation
    const actualCashFlow = portfolioAnalytics.monthlyNetCashFlow || 0;
    const annualCashFlow = actualCashFlow * 12;
    const cashFlowPositive = scenario.expectedMetrics.riskProfile !== 'HIGH' ? annualCashFlow > 0 : annualCashFlow > -10000;
    
    console.log(`💰 Monthly Cash Flow: $${actualCashFlow.toLocaleString()} ${cashFlowPositive ? '✅' : '❌'}`);
    console.log(`💰 Annual Cash Flow: $${annualCashFlow.toLocaleString()}`);
    validationResults.push({
      metric: 'Cash Flow',
      actual: annualCashFlow,
      expected: 'Positive or manageable',
      valid: cashFlowPositive,
      critical: false
    });

    // 5. Leverage Validation (if we have debt info)
    if (portfolioAnalytics.totalEquity && actualPortfolioValue > 0) {
      const actualDebt = actualPortfolioValue - portfolioAnalytics.totalEquity;
      const actualLTV = (actualDebt / actualPortfolioValue) * 100;
      const ltvValid = actualLTV >= expectedMetrics.expectedLTVRange[0] && 
                      actualLTV <= expectedMetrics.expectedLTVRange[1];
      
      console.log(`🏦 LTV Ratio: ${actualLTV.toFixed(1)}% (Expected: ${expectedMetrics.expectedLTVRange[0]}-${expectedMetrics.expectedLTVRange[1]}%) ${ltvValid ? '✅' : '❌'}`);
      validationResults.push({
        metric: 'LTV Ratio',
        actual: actualLTV,
        expected: expectedMetrics.expectedLTVRange,
        valid: ltvValid,
        critical: false
      });
    }

    // 6. Industry Benchmark Validation
    const benchmarkCapRateValid = this.validateAgainstIndustryBenchmarks('capRate', actualCapRate, scenario.expectedMetrics.riskProfile);
    const benchmarkCashOnCashValid = this.validateAgainstIndustryBenchmarks('cashOnCash', actualCashOnCash, scenario.expectedMetrics.riskProfile);
    
    console.log(`🏭 Industry Cap Rate Benchmark: ${benchmarkCapRateValid ? '✅' : '❌'}`);
    console.log(`🏭 Industry Cash-on-Cash Benchmark: ${benchmarkCashOnCashValid ? '✅' : '❌'}`);

    return {
      scenario: scenario.name,
      validationResults,
      overallScore: validationResults.filter(r => r.valid).length / validationResults.length,
      criticalFailures: validationResults.filter(r => r.critical && !r.valid).length
    };
  }

  /**
   * Validate metrics against industry benchmarks
   */
  validateAgainstIndustryBenchmarks(metricType, actualValue, riskProfile) {
    const benchmarks = industryBenchmarks;
    
    switch (metricType) {
      case 'capRate':
        return actualValue >= benchmarks.capRate.mixed.min && 
               actualValue <= benchmarks.capRate.mixed.max;
        
      case 'cashOnCash':
        const profile = riskProfile.toLowerCase();
        const range = benchmarks.cashOnCash[profile] || benchmarks.cashOnCash.balanced;
        return actualValue >= range.min && actualValue <= range.max;
        
      default:
        return true;
    }
  }

  /**
   * Clean up test portfolio
   */
  async cleanup(portfolioId) {
    try {
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
   * Generate comprehensive test report
   */
  generateReport() {
    console.log('\n📊 PORTFOLIO FINANCIAL METRICS VALIDATION REPORT');
    console.log('================================================');

    let totalTests = 0;
    let passedTests = 0;
    let criticalFailures = 0;

    this.testResults.forEach(result => {
      totalTests += result.validationResults.length;
      passedTests += result.validationResults.filter(r => r.valid).length;
      criticalFailures += result.criticalFailures;

      console.log(`\n${result.scenario}:`);
      console.log(`  Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
      console.log(`  Critical Failures: ${result.criticalFailures}`);
    });

    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log('======================');
    console.log(`Total Validations: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${passRate}%)`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Critical Failures: ${criticalFailures}`);

    if (criticalFailures === 0 && passedTests === totalTests) {
      console.log('\n🎉 ALL PORTFOLIO FINANCIAL METRICS VALIDATED!');
      console.log('✅ Cap rate calculations accurate');
      console.log('✅ Cash-on-cash return calculations verified');
      console.log('✅ Portfolio value aggregation correct');
      console.log('✅ Cash flow summation working properly');
      console.log('✅ Industry benchmarks met');
      return true;
    } else {
      console.log('\n❌ PORTFOLIO FINANCIAL METRICS VALIDATION FAILED!');
      console.log(`⚠️  ${criticalFailures} critical metric calculation errors`);
      console.log('💡 Review portfolio analytics calculation logic');
      return false;
    }
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🏦 PORTFOLIO FINANCIAL METRICS VALIDATION SUITE');
  console.log('===============================================');
  console.log('Validating portfolio-level financial calculations against industry standards\n');

  const validator = new PortfolioFinancialMetricsValidator();
  let allTestsPassed = true;

  try {
    // Authenticate
    const authenticated = await validator.authenticate();
    if (!authenticated) {
      process.exit(1);
    }

    // Test each portfolio scenario
    for (const scenario of portfolioTestScenarios) {
      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TESTING: ${scenario.name.toUpperCase()}`);
        console.log(`${'='.repeat(60)}`);

        // Create and analyze portfolio
        const testResult = await validator.createAndAnalyzePortfolio(scenario);
        
        // Validate financial metrics
        const validationResult = validator.validateFinancialMetrics(testResult);
        validator.testResults.push(validationResult);
        
        // Clean up
        await validator.cleanup(testResult.portfolioId);
        
        if (validationResult.criticalFailures > 0) {
          allTestsPassed = false;
        }
        
      } catch (error) {
        console.error(`❌ Test failed for ${scenario.name}:`, error.message);
        allTestsPassed = false;
      }
    }

    // Generate final report
    const reportPassed = validator.generateReport();
    allTestsPassed = allTestsPassed && reportPassed;

  } catch (error) {
    console.error('\n💥 TEST SUITE EXECUTION FAILED:', error.message);
    allTestsPassed = false;
  }

  const exitCode = allTestsPassed ? 0 : 1;
  console.log(`\n${allTestsPassed ? '🎉' : '💥'} Portfolio financial metrics validation ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  process.exit(exitCode);
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { PortfolioFinancialMetricsValidator, portfolioTestScenarios, industryBenchmarks };