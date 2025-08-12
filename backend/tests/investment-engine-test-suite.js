#!/usr/bin/env node

/**
 * JPMorgan-Grade Investment Decision Engine Test Suite
 * 
 * Test Architecture Design:
 * 1. Scenario Matrix Coverage - All decision paths (BUY/NEGOTIATE/PASS)
 * 2. Property Archetypes - Representative investment scenarios
 * 3. Market Conditions - Bull/Bear/Stable markets
 * 4. Timeline Variations - Short/Medium/Long hold periods
 * 5. Goal Combinations - All investor profiles
 * 6. Edge Cases - Boundary conditions and stress tests
 * 7. Regression Suite - Ensure no backward compatibility breaks
 * 
 * @author Test Architecture Team
 * @version 2.0.0
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_USER = {
  email: 'dualmode.test@example.com',
  password: 'TestUser123!'
};

// =============================================================================
// TEST SCENARIO ARCHETYPES - Financial Industry Standard
// =============================================================================

const PropertyArchetypes = {
  // High Cash Flow Properties
  CASH_COW: {
    name: 'Cash Cow - Midwest Rental',
    description: 'High cash flow, low appreciation market',
    baseData: {
      city: 'Cleveland',
      state: 'OH',
      purchasePrice: 150000,
      monthlyRent: 1800,
      propertyTaxRate: 1.5,
      expectedVerdict: 'BUY',
      expectedConfidenceRange: [70, 90]
    }
  },
  
  // Appreciation Play
  APPRECIATION_PLAY: {
    name: 'Appreciation Play - Tech Hub',
    description: 'Low/negative cash flow, high appreciation potential',
    baseData: {
      city: 'San Francisco',
      state: 'CA',
      purchasePrice: 850000,
      monthlyRent: 4500,
      propertyTaxRate: 1.2,
      expectedVerdict: 'PASS',
      expectedConfidenceRange: [60, 80]
    }
  },
  
  // Balanced Property
  BALANCED_PERFORMER: {
    name: 'Balanced - Sunbelt Growth',
    description: 'Moderate cash flow and appreciation',
    baseData: {
      city: 'Austin',
      state: 'TX',
      purchasePrice: 350000,
      monthlyRent: 3000,
      propertyTaxRate: 1.8,
      expectedVerdict: 'NEGOTIATE',
      expectedConfidenceRange: [40, 60]
    }
  },
  
  // House Hack Scenario
  HOUSE_HACK: {
    name: 'House Hack - Duplex',
    description: 'Owner-occupied with rental income',
    baseData: {
      city: 'Denver',
      state: 'CO',
      purchasePrice: 450000,
      monthlyRent: 2200, // One unit only
      propertyTaxRate: 0.7,
      expectedVerdict: 'BUY',
      expectedConfidenceRange: [60, 75]
    }
  },
  
  // Overpriced Property
  OVERPRICED: {
    name: 'Overpriced - Seller Market',
    description: 'Good fundamentals but 20% overpriced',
    baseData: {
      city: 'Phoenix',
      state: 'AZ',
      purchasePrice: 420000, // Should be 350k
      monthlyRent: 2800,
      propertyTaxRate: 0.8,
      expectedVerdict: 'PASS',
      expectedConfidenceRange: [70, 90]
    }
  },
  
  // Distressed Property
  DISTRESSED: {
    name: 'Distressed - Value Add',
    description: 'Needs work but great bones',
    baseData: {
      city: 'Memphis',
      state: 'TN',
      purchasePrice: 120000,
      monthlyRent: 1400, // After repairs
      propertyTaxRate: 1.9,
      capitalInvestments: 30000,
      expectedVerdict: 'BUY',
      expectedConfidenceRange: [50, 70]
    }
  },
  
  // Luxury Property
  LUXURY: {
    name: 'Luxury - High End Market',
    description: 'Premium property with lower yields',
    baseData: {
      city: 'Miami',
      state: 'FL',
      purchasePrice: 1200000,
      monthlyRent: 7500,
      propertyTaxRate: 1.0,
      expectedVerdict: 'PASS',
      expectedConfidenceRange: [60, 80]
    }
  },
  
  // Student Housing
  STUDENT_HOUSING: {
    name: 'Student Housing - College Town',
    description: 'Near university, seasonal vacancy',
    baseData: {
      city: 'Ann Arbor',
      state: 'MI',
      purchasePrice: 280000,
      monthlyRent: 3200, // Multiple students
      propertyTaxRate: 1.4,
      expectedVerdict: 'BUY',
      expectedConfidenceRange: [55, 75]
    }
  }
};

// =============================================================================
// MARKET CONDITIONS - Economic Scenarios
// =============================================================================

const MarketConditions = {
  BULL_MARKET: {
    name: 'Bull Market - High Growth',
    adjustments: {
      annualAppreciation: 7,
      annualRentIncrease: 5,
      vacancyRate: 3,
      interestRate: 6.5
    }
  },
  
  BEAR_MARKET: {
    name: 'Bear Market - Recession',
    adjustments: {
      annualAppreciation: -2,
      annualRentIncrease: 0,
      vacancyRate: 12,
      interestRate: 8.5
    }
  },
  
  STABLE_MARKET: {
    name: 'Stable Market - Normal',
    adjustments: {
      annualAppreciation: 3,
      annualRentIncrease: 3,
      vacancyRate: 5,
      interestRate: 7.0
    }
  },
  
  STAGFLATION: {
    name: 'Stagflation - High Inflation Low Growth',
    adjustments: {
      annualAppreciation: 1,
      annualRentIncrease: 6,
      annualExpenseIncrease: 8,
      interestRate: 9.0
    }
  }
};

// =============================================================================
// INVESTOR PROFILES - Goal Combinations
// =============================================================================

const InvestorProfiles = {
  NOVICE_CONSERVATIVE: {
    name: 'Novice Conservative',
    enhancedGoals: {
      returnThreshold: 10,
      riskTolerance: 'low',
      cashFlowPreference: 'high',
      appreciationExpectation: 'low',
      investmentStrategy: 'Buy and Hold',
      experience: 'beginner',
      freeTextStrategy: 'First rental property, looking for stable cash flow for 5-7 years'
    }
  },
  
  AGGRESSIVE_FLIPPER: {
    name: 'Aggressive Flipper',
    enhancedGoals: {
      returnThreshold: 25,
      riskTolerance: 'high',
      cashFlowPreference: 'low',
      appreciationExpectation: 'high',
      investmentStrategy: 'Fix and Flip',
      experience: 'expert',
      freeTextStrategy: 'Quick flip in 6-12 months for maximum profit'
    }
  },
  
  CASH_FLOW_FOCUSED: {
    name: 'Cash Flow Investor',
    enhancedGoals: {
      returnThreshold: 15,
      riskTolerance: 'medium',
      cashFlowPreference: 'high',
      appreciationExpectation: 'low',
      investmentStrategy: 'Buy and Hold',
      experience: 'intermediate',
      freeTextStrategy: 'Building rental portfolio for passive income over 10+ years'
    }
  },
  
  APPRECIATION_HUNTER: {
    name: 'Appreciation Hunter',
    enhancedGoals: {
      returnThreshold: 20,
      riskTolerance: 'high',
      cashFlowPreference: 'low',
      appreciationExpectation: 'high',
      investmentStrategy: 'Buy and Hold',
      experience: 'advanced',
      freeTextStrategy: 'Targeting high-growth markets for 3-5 year appreciation play'
    }
  },
  
  BALANCED_INVESTOR: {
    name: 'Balanced Investor',
    enhancedGoals: {
      returnThreshold: 15,
      riskTolerance: 'medium',
      cashFlowPreference: 'medium',
      appreciationExpectation: 'moderate',
      investmentStrategy: 'Buy and Hold',
      experience: 'intermediate',
      freeTextStrategy: 'Seeking balanced returns with 5-10 year investment horizon'
    }
  },
  
  HOUSE_HACKER: {
    name: 'House Hacker',
    enhancedGoals: {
      returnThreshold: 8,
      riskTolerance: 'low',
      cashFlowPreference: 'medium',
      appreciationExpectation: 'moderate',
      investmentStrategy: 'House Hack',
      experience: 'beginner',
      freeTextStrategy: 'Live in one unit and rent others for 2-3 years then convert to rental'
    }
  }
};

// =============================================================================
// EDGE CASES - Boundary Conditions
// =============================================================================

const EdgeCases = {
  ZERO_CAP_RATE: {
    name: 'Zero Cap Rate',
    description: 'Property with break-even NOI',
    overrides: {
      monthlyRent: 1500,
      maintenanceCost: 8000,
      propertyManagementRate: 10
    }
  },
  
  NEGATIVE_CASH_FLOW: {
    name: 'Negative Cash Flow',
    description: 'High expenses exceed income',
    overrides: {
      monthlyRent: 2000,
      propertyTaxRate: 3.5,
      insuranceRate: 2.0,
      hoaFees: 500
    }
  },
  
  EXTREME_LEVERAGE: {
    name: 'Extreme Leverage',
    description: '5% down payment scenario',
    overrides: {
      downPayment: null, // Will be calculated as 5% of purchase price
      downPaymentPercent: 5,
      interestRate: 8.5
    }
  },
  
  CASH_PURCHASE: {
    name: 'Cash Purchase',
    description: 'No financing scenario',
    overrides: {
      downPayment: null, // Will be 100% of purchase price
      downPaymentPercent: 100,
      interestRate: 0,
      loanTerm: 0
    }
  },
  
  HIGH_VACANCY: {
    name: 'High Vacancy Market',
    description: '20% vacancy rate scenario',
    overrides: {
      longTermAssumptions: {
        vacancyRate: 20
      }
    }
  },
  
  RENT_CONTROL: {
    name: 'Rent Control Market',
    description: 'Limited rent increase potential',
    overrides: {
      longTermAssumptions: {
        annualRentIncrease: 1.5 // Capped at 1.5%
      }
    }
  }
};

// =============================================================================
// TEST EXECUTION ENGINE
// =============================================================================

class InvestmentEngineTestRunner {
  constructor() {
    this.token = null;
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Authenticate and get token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      this.token = response.data.token || response.data.accessToken;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Generate complete property data from archetype, market, and profile
   */
  generateTestProperty(archetype, market, profile, edgeCase = null) {
    const base = PropertyArchetypes[archetype].baseData;
    const marketAdj = MarketConditions[market].adjustments;
    const goals = InvestorProfiles[profile].enhancedGoals;
    
    // Build complete property data
    let property = {
      propertyType: 'SFR',
      propertyName: `Test: ${PropertyArchetypes[archetype].name}`,
      address: '123 Test Street',
      city: base.city,
      state: base.state,
      zipCode: '12345',
      
      // Financial inputs
      purchasePrice: base.purchasePrice,
      downPayment: base.downPayment || base.purchasePrice * 0.20,
      interestRate: marketAdj.interestRate,
      loanTerm: 30,
      
      // Income
      monthlyRent: base.monthlyRent,
      
      // Expenses
      propertyTaxRate: base.propertyTaxRate,
      insuranceRate: base.insuranceRate || 0.35,
      maintenanceCost: base.maintenanceCost || 2400,
      propertyManagementRate: base.propertyManagementRate || 8,
      hoaFees: base.hoaFees || 0,
      utilities: base.utilities || 0,
      
      // Property details
      yearBuilt: base.yearBuilt || 2015,
      squareFootage: base.squareFootage || 2000,
      bedrooms: base.bedrooms || 3,
      bathrooms: base.bathrooms || 2,
      
      // Additional costs
      closingCosts: base.closingCosts || 5000,
      capitalInvestments: base.capitalInvestments || 0,
      
      // Market-adjusted assumptions
      longTermAssumptions: {
        annualRentIncrease: marketAdj.annualRentIncrease,
        annualExpenseIncrease: marketAdj.annualExpenseIncrease || 3,
        annualAppreciation: marketAdj.annualAppreciation,
        vacancyRate: marketAdj.vacancyRate,
        sellingCostPercentage: 7,
        projectionYears: 10
      },
      
      // Investor goals
      enhancedGoals: goals
    };
    
    // Apply edge case overrides if specified
    if (edgeCase && EdgeCases[edgeCase]) {
      const overrides = EdgeCases[edgeCase].overrides;
      
      // Handle special cases
      if (overrides.downPaymentPercent !== undefined) {
        property.downPayment = property.purchasePrice * (overrides.downPaymentPercent / 100);
      }
      
      // Apply other overrides
      Object.keys(overrides).forEach(key => {
        if (key !== 'downPaymentPercent') {
          if (key === 'longTermAssumptions') {
            property.longTermAssumptions = {
              ...property.longTermAssumptions,
              ...overrides.longTermAssumptions
            };
          } else if (overrides[key] !== null) {
            property[key] = overrides[key];
          }
        }
      });
    }
    
    return property;
  }

  /**
   * Run single test scenario
   */
  async runTest(testName, property, expectedVerdict = null, expectedConfidenceRange = null) {
    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${API_URL}/deals/analyze`,
        property,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
          timeout: 30000
        }
      );
      
      const executionTime = Date.now() - startTime;
      const decision = response.data.investmentDecision;
      
      // Validate results
      const result = {
        testName,
        status: 'PASS',
        executionTime,
        verdict: decision.verdict,
        confidence: decision.confidence,
        score: decision.score,
        expectedVerdict,
        expectedConfidenceRange,
        issues: []
      };
      
      // Check verdict match
      if (expectedVerdict && decision.verdict !== expectedVerdict) {
        result.status = 'FAIL';
        result.issues.push(`Verdict mismatch: Expected ${expectedVerdict}, got ${decision.verdict}`);
      }
      
      // Check confidence range
      if (expectedConfidenceRange) {
        if (decision.confidence < expectedConfidenceRange[0] || 
            decision.confidence > expectedConfidenceRange[1]) {
          result.status = 'WARN';
          result.issues.push(`Confidence outside range: ${decision.confidence}% not in [${expectedConfidenceRange[0]}, ${expectedConfidenceRange[1]}]`);
        }
      }
      
      // Check for missing fields
      if (!decision.primaryReason) {
        result.status = 'FAIL';
        result.issues.push('Missing primary reason');
      }
      
      if (!decision.goalBasedReasoning) {
        result.status = 'WARN';
        result.issues.push('Missing goal-based reasoning');
      }
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      const result = {
        testName,
        status: 'ERROR',
        error: error.message,
        issues: [`Test execution failed: ${error.message}`]
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run complete test matrix
   */
  async runTestMatrix() {
    console.log('\n🧪 INVESTMENT ENGINE TEST MATRIX EXECUTION');
    console.log('=' . repeat(60));
    
    let passCount = 0;
    let failCount = 0;
    let warnCount = 0;
    let errorCount = 0;
    
    // Test each archetype with different market conditions and investor profiles
    for (const [archKey, archetype] of Object.entries(PropertyArchetypes)) {
      console.log(`\n📊 Testing: ${archetype.name}`);
      console.log('-'.repeat(40));
      
      for (const [marketKey, market] of Object.entries(MarketConditions)) {
        for (const [profileKey, profile] of Object.entries(InvestorProfiles)) {
          const testName = `${archKey}_${marketKey}_${profileKey}`;
          const property = this.generateTestProperty(archKey, marketKey, profileKey);
          
          const result = await this.runTest(
            testName,
            property,
            archetype.baseData.expectedVerdict,
            archetype.baseData.expectedConfidenceRange
          );
          
          // Update counters
          switch(result.status) {
            case 'PASS': passCount++; break;
            case 'FAIL': failCount++; break;
            case 'WARN': warnCount++; break;
            case 'ERROR': errorCount++; break;
          }
          
          // Display result
          const statusIcon = {
            'PASS': '✅',
            'FAIL': '❌',
            'WARN': '⚠️',
            'ERROR': '🔥'
          }[result.status];
          
          console.log(`${statusIcon} ${market.name} + ${profile.name}: ${result.verdict} (${result.confidence}%)`);
          
          if (result.issues.length > 0) {
            result.issues.forEach(issue => console.log(`   → ${issue}`));
          }
        }
      }
    }
    
    // Test edge cases
    console.log('\n🔬 Testing Edge Cases');
    console.log('-'.repeat(40));
    
    for (const [edgeKey, edge] of Object.entries(EdgeCases)) {
      const property = this.generateTestProperty(
        'BALANCED_PERFORMER',
        'STABLE_MARKET',
        'BALANCED_INVESTOR',
        edgeKey
      );
      
      const result = await this.runTest(
        `EDGE_${edgeKey}`,
        property
      );
      
      switch(result.status) {
        case 'PASS': passCount++; break;
        case 'FAIL': failCount++; break;
        case 'WARN': warnCount++; break;
        case 'ERROR': errorCount++; break;
      }
      
      const statusIcon = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️',
        'ERROR': '🔥'
      }[result.status];
      
      console.log(`${statusIcon} ${edge.name}: ${result.verdict} (${result.confidence}%)`);
    }
    
    // Generate summary report
    const totalTests = this.results.length;
    const passRate = ((passCount / totalTests) * 100).toFixed(1);
    const executionTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passCount} (${passRate}%)`);
    console.log(`⚠️  Warnings: ${warnCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`🔥 Errors: ${errorCount}`);
    console.log(`⏱️  Execution Time: ${executionTime}s`);
    console.log('='.repeat(60));
    
    // Save detailed results to file
    this.saveResults();
    
    return {
      passCount,
      failCount,
      warnCount,
      errorCount,
      passRate,
      executionTime
    };
  }

  /**
   * Save test results to JSON file
   */
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(__dirname, 'results', filename);
    
    // Create results directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const report = {
      executionDate: new Date().toISOString(),
      executionTime: Date.now() - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARN').length,
        errors: this.results.filter(r => r.status === 'ERROR').length
      },
      results: this.results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Detailed results saved to: ${filename}`);
  }

  /**
   * Run regression tests for backward compatibility
   */
  async runRegressionTests() {
    console.log('\n🔄 REGRESSION TEST SUITE');
    console.log('=' . repeat(60));
    
    // Test known good scenarios that should always pass
    const regressionScenarios = [
      {
        name: 'High Cash Flow Should Always BUY',
        property: this.generateTestProperty('CASH_COW', 'STABLE_MARKET', 'CASH_FLOW_FOCUSED'),
        expectedVerdict: 'BUY'
      },
      {
        name: 'Overpriced Should Always PASS',
        property: this.generateTestProperty('OVERPRICED', 'STABLE_MARKET', 'BALANCED_INVESTOR'),
        expectedVerdict: 'PASS'
      },
      {
        name: 'Timeline Should Appear in Reasoning',
        property: this.generateTestProperty('BALANCED_PERFORMER', 'STABLE_MARKET', 'BALANCED_INVESTOR'),
        validateFunction: (result) => {
          return result.goalBasedReasoning && 
                 (result.goalBasedReasoning.includes('year') || 
                  result.goalBasedReasoning.includes('timeline'));
        }
      }
    ];
    
    for (const scenario of regressionScenarios) {
      const result = await this.runTest(scenario.name, scenario.property, scenario.expectedVerdict);
      
      if (scenario.validateFunction) {
        const customValidation = scenario.validateFunction(result);
        if (!customValidation) {
          result.status = 'FAIL';
          result.issues.push('Custom validation failed');
        }
      }
      
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${scenario.name}: ${result.status}`);
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🏦 JPMorgan-Grade Investment Engine Test Suite v2.0');
  console.log('Starting comprehensive test execution...\n');
  
  const runner = new InvestmentEngineTestRunner();
  
  // Authenticate
  const authenticated = await runner.authenticate();
  if (!authenticated) {
    console.error('Failed to authenticate. Exiting.');
    process.exit(1);
  }
  
  // Run full test matrix
  await runner.runTestMatrix();
  
  // Run regression tests
  await runner.runRegressionTests();
  
  console.log('\n✅ Test suite execution complete!');
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  PropertyArchetypes,
  MarketConditions,
  InvestorProfiles,
  EdgeCases,
  InvestmentEngineTestRunner
};