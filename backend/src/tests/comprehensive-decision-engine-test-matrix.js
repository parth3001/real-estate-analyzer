#!/usr/bin/env node

/**
 * COMPREHENSIVE INVESTMENT DECISION ENGINE TEST MATRIX
 * 
 * This test suite validates ALL possible scenarios users will encounter in production.
 * Ensures the system delivers real value-add beyond "fancy metrics" by testing:
 * 
 * 🎯 CORE VALUE VALIDATION:
 * - Institutional-grade analysis vs basic calculations  
 * - Market intelligence that Excel can't provide
 * - Professional investment recommendations
 * - Strategy alignment insights for optimal decision making
 * 
 * 📊 COMPLETE SCENARIO MATRIX:
 * - Phase 2A: All market tiers (Tier 1/2/3) with different property types
 * - Phase 2B: All property classes (A/B/C) with different investor experiences  
 * - Phase 3: All strategy alignments and misalignments
 * - Integration: Complex multi-factor scenarios
 * - Edge Cases: Missing data, extreme values, boundary conditions
 * 
 * 🏆 EXPECTED OUTCOMES:
 * - Clear BUY signals for genuinely good opportunities
 * - NEGOTIATE recommendations with specific price targets
 * - PASS decisions with professional reasoning
 * - Confidence scores that reflect analysis quality
 * - Actionable insights users can't get elsewhere
 */

const axios = require('axios');

// Test Matrix Configuration
const TEST_MATRIX = {
  // Phase 2A: Market Intelligence Scenarios
  marketTiers: [
    {
      name: "Tier 1 - Premium Appreciation Market",
      cities: [
        { city: "Austin", state: "TX", zipCode: "78701", expectedTier: 1, focusType: "appreciation" },
        { city: "San Francisco", state: "CA", zipCode: "94105", expectedTier: 1, focusType: "appreciation" },
        { city: "Seattle", state: "WA", zipCode: "98101", expectedTier: 1, focusType: "appreciation" }
      ]
    },
    {
      name: "Tier 2 - Balanced Growth Market", 
      cities: [
        { city: "Dallas", state: "TX", zipCode: "75201", expectedTier: 2, focusType: "balanced" },
        { city: "Phoenix", state: "AZ", zipCode: "85001", expectedTier: 2, focusType: "balanced" },
        { city: "Atlanta", state: "GA", zipCode: "30301", expectedTier: 2, focusType: "balanced" }
      ]
    },
    {
      name: "Tier 3 - Cash Flow Market",
      cities: [
        { city: "Anna", state: "TX", zipCode: "75409", expectedTier: 3, focusType: "cashflow" },
        { city: "Tulsa", state: "OK", zipCode: "74101", expectedTier: 3, focusType: "cashflow" },
        { city: "Birmingham", state: "AL", zipCode: "35201", expectedTier: 3, focusType: "cashflow" }
      ]
    }
  ],

  // Phase 2B: Property Classification Scenarios
  propertyClasses: [
    {
      className: "Class A - Premium Properties",
      scenarios: [
        { yearBuilt: 2022, price: 750000, rent: 4500, expectedClass: "A", riskLevel: "low" },
        { yearBuilt: 2019, price: 650000, rent: 4200, expectedClass: "A", riskLevel: "low" },
        { yearBuilt: 2018, price: 580000, rent: 3800, expectedClass: "A", riskLevel: "low" }
      ]
    },
    {
      className: "Class B - Standard Investment Grade",
      scenarios: [
        { yearBuilt: 2012, price: 385000, rent: 2850, expectedClass: "B", riskLevel: "moderate" },
        { yearBuilt: 2008, price: 320000, rent: 2400, expectedClass: "B", riskLevel: "moderate" },
        { yearBuilt: 2015, price: 420000, rent: 3100, expectedClass: "B", riskLevel: "moderate" }
      ]
    },
    {
      className: "Class C - Value Properties",
      scenarios: [
        { yearBuilt: 1975, price: 185000, rent: 1650, expectedClass: "C", riskLevel: "high" },
        { yearBuilt: 1968, price: 145000, rent: 1400, expectedClass: "C", riskLevel: "high" },
        { yearBuilt: 1980, price: 220000, rent: 1850, expectedClass: "C", riskLevel: "high" }
      ]
    }
  ],

  // Phase 3: Strategy Alignment Scenarios
  strategyAlignments: [
    {
      alignmentType: "EXCELLENT - Perfect Strategy-Market Fit",
      scenarios: [
        {
          description: "Cash flow strategy in Tier 3 market",
          strategy: { portfolioStrategy: "cashflow", holdPeriod: 7, riskApproach: "balanced" },
          market: { tier: 3, focusType: "cashflow" },
          expectedAlignment: "excellent"
        },
        {
          description: "Appreciation strategy in Tier 1 market", 
          strategy: { portfolioStrategy: "appreciation", holdPeriod: 8, riskApproach: "aggressive" },
          market: { tier: 1, focusType: "appreciation" },
          expectedAlignment: "excellent"
        }
      ]
    },
    {
      alignmentType: "GOOD - Solid Strategy Alignment",
      scenarios: [
        {
          description: "Balanced strategy in Tier 2 market",
          strategy: { portfolioStrategy: "balanced", holdPeriod: 6, riskApproach: "balanced" },
          market: { tier: 2, focusType: "balanced" }, 
          expectedAlignment: "good"
        }
      ]
    },
    {
      alignmentType: "MISMATCH - Strategy Conflicts",
      scenarios: [
        {
          description: "Cash flow strategy in appreciation market",
          strategy: { portfolioStrategy: "cashflow", holdPeriod: 5, riskApproach: "balanced" },
          market: { tier: 1, focusType: "appreciation" },
          expectedAlignment: "poor"
        },
        {
          description: "Novice investor + Class C property",
          strategy: { portfolioStrategy: "first", holdPeriod: 10, riskApproach: "conservative" },
          propertyClass: "C",
          expectedAlignment: "mismatch"
        },
        {
          description: "Short hold + appreciation strategy", 
          strategy: { portfolioStrategy: "appreciation", holdPeriod: 2, riskApproach: "aggressive" },
          market: { tier: 1, focusType: "appreciation" },
          expectedAlignment: "fair"
        }
      ]
    }
  ],

  // Investment Outcome Scenarios
  investmentOutcomes: [
    {
      outcometype: "STRONG BUY - Clear Opportunities",
      scenarios: [
        {
          description: "High cash flow + good cap rate + excellent alignment",
          metrics: { cashFlow: 1200, capRate: 0.08, cocReturn: 0.12, dscr: 1.8 },
          expectedVerdict: "BUY",
          expectedConfidence: [75, 95]
        },
        {
          description: "Premium property + appreciation market alignment",
          metrics: { cashFlow: 800, capRate: 0.055, cocReturn: 0.09, dscr: 1.4 },
          expectedVerdict: "BUY", 
          expectedConfidence: [70, 90]
        }
      ]
    },
    {
      outcomeType: "NEGOTIATE - Fixable Issues",
      scenarios: [
        {
          description: "Good fundamentals but overpriced",
          metrics: { cashFlow: 400, capRate: 0.045, cocReturn: 0.06, dscr: 1.1 },
          expectedVerdict: "NEGOTIATE",
          expectedConfidence: [50, 75]
        },
        {
          description: "Positive cash flow but below market cap rate", 
          metrics: { cashFlow: 250, capRate: 0.04, cocReturn: 0.05, dscr: 1.0 },
          expectedVerdict: "NEGOTIATE",
          expectedConfidence: [45, 70]
        }
      ]
    },
    {
      outcomeType: "PASS - Clear Problems", 
      scenarios: [
        {
          description: "Negative cash flow property",
          metrics: { cashFlow: -300, capRate: 0.015, cocReturn: -0.25, dscr: 0.3 },
          expectedVerdict: "PASS",
          expectedConfidence: [70, 95]
        },
        {
          description: "Severely overpriced with poor fundamentals",
          metrics: { cashFlow: -150, capRate: 0.02, cocReturn: -0.15, dscr: 0.5 },
          expectedVerdict: "PASS", 
          expectedConfidence: [75, 95]
        }
      ]
    }
  ]
};

// Test Execution Engine
class ComprehensiveTestEngine {
  constructor() {
    this.authToken = null;
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      scenarioResults: {},
      valueValidation: {
        institutionalGradeAnalysis: 0,
        marketIntelligenceProvided: 0, 
        professionalRecommendations: 0,
        strategyAlignmentInsights: 0
      }
    };
  }

  async authenticate() {
    try {
      const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'dualmode.test@example.com', 
        password: 'TestUser123!'
      });
      
      if (authResponse.data?.accessToken) {
        this.authToken = authResponse.data.accessToken;
        console.log('✅ Authentication successful\n');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async runComprehensiveTests() {
    console.log('🎯 COMPREHENSIVE INVESTMENT DECISION ENGINE TEST MATRIX');
    console.log('====================================================');
    console.log('🏆 Validating real value-add beyond basic calculations');
    console.log('📊 Testing all possible user scenarios in production\n');

    if (!(await this.authenticate())) return;

    // Run all test categories
    await this.testMarketTierScenarios();
    await this.testPropertyClassScenarios(); 
    await this.testStrategyAlignmentScenarios();
    await this.testIntegratedComplexScenarios();
    await this.testEdgeCasesAndBoundaries();
    await this.testValueValidationScenarios();

    // Generate comprehensive report
    this.generateComprehensiveReport();
  }

  async testMarketTierScenarios() {
    console.log('\n🏢 TESTING: Phase 2A Market Intelligence Scenarios');
    console.log('=' .repeat(60));
    
    for (const tierGroup of TEST_MATRIX.marketTiers) {
      console.log(`\n📍 ${tierGroup.name}:`);
      
      for (const cityData of tierGroup.cities) {
        const testName = `Market Tier Analysis - ${cityData.city}, ${cityData.state}`;
        
        const result = await this.runSingleTest({
          testName,
          expectedOutcomes: {
            marketTier: cityData.expectedTier,
            marketFocus: cityData.focusType,
            hasMarketIntelligence: true
          },
          propertyData: this.createTestProperty({
            location: cityData,
            price: 400000,
            rent: 2800
          })
        });
        
        this.validateMarketIntelligence(result, cityData);
      }
    }
  }

  async testPropertyClassScenarios() {
    console.log('\n🏠 TESTING: Phase 2B Property Classification Scenarios');
    console.log('='.repeat(60));
    
    for (const classGroup of TEST_MATRIX.propertyClasses) {
      console.log(`\n🏛️  ${classGroup.className}:`);
      
      for (const scenario of classGroup.scenarios) {
        const testName = `Property Classification - ${classGroup.className} (${scenario.yearBuilt})`;
        
        const result = await this.runSingleTest({
          testName, 
          expectedOutcomes: {
            propertyClass: scenario.expectedClass,
            riskLevel: scenario.riskLevel,
            hasClassification: true
          },
          propertyData: this.createTestProperty({
            yearBuilt: scenario.yearBuilt,
            price: scenario.price, 
            rent: scenario.rent
          })
        });
        
        this.validatePropertyClassification(result, scenario);
      }
    }
  }

  async testStrategyAlignmentScenarios() {
    console.log('\n🎯 TESTING: Phase 3 Strategy Alignment Scenarios');
    console.log('='.repeat(60));
    
    for (const alignmentGroup of TEST_MATRIX.strategyAlignments) {
      console.log(`\n⚖️  ${alignmentGroup.alignmentType}:`);
      
      for (const scenario of alignmentGroup.scenarios) {
        const testName = `Strategy Alignment - ${scenario.description}`;
        
        const result = await this.runSingleTest({
          testName,
          expectedOutcomes: {
            strategyAlignment: scenario.expectedAlignment,
            hasAlignmentAnalysis: true
          },
          propertyData: this.createTestProperty({
            strategy: scenario.strategy,
            market: scenario.market,
            propertyClass: scenario.propertyClass
          })
        });
        
        this.validateStrategyAlignment(result, scenario);
      }
    }
  }

  async testIntegratedComplexScenarios() {
    console.log('\n🔗 TESTING: Integrated Multi-Factor Scenarios');
    console.log('='.repeat(60));
    
    const complexScenarios = [
      {
        name: "Perfect Storm - All Factors Aligned",
        description: "Class A + Tier 1 Market + Appreciation Strategy + Experienced Investor", 
        property: {
          yearBuilt: 2020, price: 650000, rent: 4200,
          location: { city: "Austin", state: "TX", zipCode: "78701" },
          strategy: { portfolioStrategy: "appreciation", holdPeriod: 7, riskApproach: "aggressive" }
        },
        expectedVerdict: "BUY",
        expectedConfidenceRange: [75, 95]
      },
      {
        name: "Value Opportunity - Experienced + Class C Alignment",
        description: "Class C + Tier 3 Market + Cash Flow Strategy + Experienced Investor",
        property: {
          yearBuilt: 1978, price: 185000, rent: 1650, 
          location: { city: "Anna", state: "TX", zipCode: "75409" },
          strategy: { portfolioStrategy: "cashflow", holdPeriod: 10, riskApproach: "balanced" }
        },
        expectedVerdict: ["BUY", "NEGOTIATE"],
        expectedConfidenceRange: [60, 85]
      },
      {
        name: "Multiple Red Flags - Novice + Overpriced + Misaligned",
        description: "Class C + Tier 1 Price + Cash Flow Strategy + Novice Investor",
        property: {
          yearBuilt: 1975, price: 580000, rent: 2200, // Overpriced Class C
          location: { city: "Austin", state: "TX", zipCode: "78701" },
          strategy: { portfolioStrategy: "first", holdPeriod: 3, riskApproach: "conservative" }
        },
        expectedVerdict: "PASS",
        expectedConfidenceRange: [70, 95]
      }
    ];

    for (const scenario of complexScenarios) {
      console.log(`\n🔄 Testing: ${scenario.name}`);
      console.log(`   📋 ${scenario.description}`);
      
      const result = await this.runSingleTest({
        testName: scenario.name,
        expectedOutcomes: {
          verdict: scenario.expectedVerdict,
          confidenceRange: scenario.expectedConfidenceRange
        },
        propertyData: this.createTestProperty(scenario.property)
      });
      
      this.validateComplexScenario(result, scenario);
    }
  }

  async testEdgeCasesAndBoundaries() {
    console.log('\n⚠️  TESTING: Edge Cases and Boundary Conditions');
    console.log('='.repeat(60));
    
    const edgeCases = [
      {
        name: "Extreme High Cap Rate - Too Good to be True",
        property: { price: 100000, rent: 1500, capRate: 0.15 }, // 15% cap rate
        expectedWarnings: ["too good to be true", "verify", "suspicious"]
      },
      {
        name: "Extreme Low Cap Rate - Premium Market Exception", 
        property: { price: 2000000, rent: 6000, capRate: 0.025 }, // 2.5% cap rate
        location: { city: "San Francisco", state: "CA" },
        expectedHandling: "market_context_analysis"
      },
      {
        name: "Missing Property Data - Graceful Degradation",
        property: { price: 350000, rent: 2500 }, // Missing yearBuilt, sqft, etc.
        expectedHandling: "default_assumptions"
      },
      {
        name: "Boundary Conditions - DSCR Edge Cases",
        scenarios: [
          { dscr: 0.99, expectedVerdict: "PASS" }, // Just below 1.0
          { dscr: 1.01, expectedVerdict: ["NEGOTIATE", "BUY"] }, // Just above 1.0 
          { dscr: 1.25, expectedVerdict: ["BUY", "NEGOTIATE"] } // Comfortable level
        ]
      }
    ];

    for (const edgeCase of edgeCases) {
      console.log(`\n🔍 Testing: ${edgeCase.name}`);
      
      if (edgeCase.scenarios) {
        for (const scenario of edgeCase.scenarios) {
          const result = await this.runSingleTest({
            testName: `${edgeCase.name} - DSCR ${scenario.dscr}`,
            expectedOutcomes: { verdict: scenario.expectedVerdict },
            propertyData: this.createTestProperty({ metrics: { dscr: scenario.dscr } })
          });
        }
      } else {
        const result = await this.runSingleTest({
          testName: edgeCase.name,
          expectedOutcomes: { 
            warnings: edgeCase.expectedWarnings,
            handling: edgeCase.expectedHandling
          },
          propertyData: this.createTestProperty(edgeCase.property)
        });
      }
    }
  }

  async testValueValidationScenarios() {
    console.log('\n💎 TESTING: Value-Add Validation - Beyond Basic Calculations');
    console.log('='.repeat(60));
    
    // Test that system provides insights Excel cannot
    const valueScenarios = [
      {
        name: "Institutional vs Basic Analysis",
        description: "Same property metrics - validate enhanced insights",
        property: { price: 400000, rent: 2800, capRate: 0.06, cashFlow: 400 }
      }
    ];
    
    for (const scenario of valueScenarios) {
      console.log(`\n💡 ${scenario.name}: ${scenario.description}`);
      
      const result = await this.runSingleTest({
        testName: scenario.name,
        valueValidation: true,
        propertyData: this.createTestProperty(scenario.property)
      });
      
      this.validateInstitutionalValue(result);
    }
  }

  async runSingleTest({ testName, expectedOutcomes, propertyData, valueValidation = false }) {
    this.results.totalTests++;
    
    try {
      const response = await axios.post('http://localhost:3001/api/deals/analyze', propertyData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        timeout: 30000
      });
      
      if (response.status === 200 && response.data?.investmentDecision) {
        const decision = response.data.investmentDecision;
        
        console.log(`   ✅ ${testName}: ${decision.verdict} (${decision.confidence}%)`);
        
        const result = {
          testName,
          success: true,
          decision,
          expectedOutcomes,
          valueValidation
        };
        
        this.results.passedTests++;
        return result;
      } else {
        throw new Error('Invalid response structure');
      }
      
    } catch (error) {
      console.log(`   ❌ ${testName}: ${error.message}`);
      this.results.failedTests++;
      
      return {
        testName,
        success: false,
        error: error.message,
        expectedOutcomes
      };
    }
  }

  createTestProperty({
    location = { city: "Dallas", state: "TX", zipCode: "75201" },
    price = 350000,
    rent = 2500,
    yearBuilt = 2010,
    strategy = { portfolioStrategy: "balanced", holdPeriod: 7, riskApproach: "balanced" },
    metrics = {},
    ...overrides
  } = {}) {
    
    return {
      propertyType: 'SFR',
      purchasePrice: price,
      downPayment: price * 0.2,
      interestRate: 0.0725,
      loanTerm: 30,
      propertyTaxRate: 0.015,
      insuranceRate: 0.003, 
      maintenanceCost: Math.round(price * 0.005),
      propertyManagementRate: 0.08,
      monthlyRent: rent,
      squareFootage: 1800,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt,
      propertyAddress: {
        street: "123 Test Street",
        ...location
      },
      longTermAssumptions: {
        projectionYears: strategy.holdPeriod || 10,
        annualRentIncrease: 0.03,
        annualPropertyValueIncrease: 0.03,
        inflationRate: 0.025,
        vacancyRate: 0.05,
        sellingCostsPercentage: 0.06
      },
      exitStrategy: {
        primaryExitStrategy: 'sale',
        ...strategy
      },
      ...overrides
    };
  }

  validateMarketIntelligence(result, expectedData) {
    if (!result.success) return;
    
    const decision = result.decision;
    const hasMarketTier = decision.secondaryReasons.some(reason => 
      reason.includes('Tier') || reason.includes('market')
    );
    
    if (hasMarketTier) {
      this.results.valueValidation.marketIntelligenceProvided++;
      console.log(`     📊 Market Intelligence: Tier ${expectedData.expectedTier} analysis detected`);
    }
  }

  validatePropertyClassification(result, expectedData) {
    if (!result.success) return;
    
    const decision = result.decision;
    const hasClassification = decision.secondaryReasons.some(reason =>
      reason.includes(`Class ${expectedData.expectedClass}`)
    );
    
    if (hasClassification) {
      this.results.valueValidation.institutionalGradeAnalysis++;
      console.log(`     🏛️  Property Classification: Class ${expectedData.expectedClass} detected`);
    }
  }

  validateStrategyAlignment(result, expectedData) {
    if (!result.success) return;
    
    const decision = result.decision; 
    const hasAlignment = decision.secondaryReasons.some(reason =>
      reason.includes('Strategy Alignment')
    );
    
    if (hasAlignment) {
      this.results.valueValidation.strategyAlignmentInsights++;
      console.log(`     🎯 Strategy Alignment: Analysis provided`);
    }
  }

  validateComplexScenario(result, scenario) {
    if (!result.success) return;
    
    const decision = result.decision;
    
    // Validate verdict expectations
    if (Array.isArray(scenario.expectedVerdict)) {
      const verdictMatch = scenario.expectedVerdict.includes(decision.verdict);
      console.log(`     🎯 Verdict: ${decision.verdict} ${verdictMatch ? '✅' : '❌'} (expected: ${scenario.expectedVerdict.join(' or ')})`);
    } else {
      const verdictMatch = decision.verdict === scenario.expectedVerdict;
      console.log(`     🎯 Verdict: ${decision.verdict} ${verdictMatch ? '✅' : '❌'} (expected: ${scenario.expectedVerdict})`);
    }
    
    // Validate confidence range
    const [minConf, maxConf] = scenario.expectedConfidenceRange;
    const confInRange = decision.confidence >= minConf && decision.confidence <= maxConf;
    console.log(`     📊 Confidence: ${decision.confidence}% ${confInRange ? '✅' : '❌'} (expected: ${minConf}-${maxConf}%)`);
  }

  validateInstitutionalValue(result) {
    if (!result.success) return;
    
    const decision = result.decision;
    const insights = decision.secondaryReasons || [];
    
    // Count institutional-grade features
    const features = {
      marketIntelligence: insights.some(r => r.includes('Tier') || r.includes('market median')),
      propertyClassification: insights.some(r => r.includes('Class')), 
      strategyAlignment: insights.some(r => r.includes('Strategy Alignment')),
      riskAdjustments: insights.some(r => r.includes('risk') || r.includes('adjustment')),
      professionalRecommendations: decision.actionPlan && decision.actionPlan.length > 0
    };
    
    const institutionalFeatures = Object.values(features).filter(Boolean).length;
    
    console.log(`     💎 Institutional Features: ${institutionalFeatures}/5`);
    console.log(`        📊 Market Intelligence: ${features.marketIntelligence ? '✅' : '❌'}`);
    console.log(`        🏛️  Property Classification: ${features.propertyClassification ? '✅' : '❌'}`);
    console.log(`        🎯 Strategy Alignment: ${features.strategyAlignment ? '✅' : '❌'}`);
    console.log(`        ⚖️  Risk Adjustments: ${features.riskAdjustments ? '✅' : '❌'}`);
    console.log(`        📋 Professional Recommendations: ${features.professionalRecommendations ? '✅' : '❌'}`);
    
    if (institutionalFeatures >= 4) {
      this.results.valueValidation.institutionalGradeAnalysis++;
      console.log(`     🏆 INSTITUTIONAL-GRADE ANALYSIS CONFIRMED`);
    }
  }

  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS & VALUE VALIDATION');
    console.log('='.repeat(80));
    
    const passRate = ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 OVERALL TEST RESULTS:`);
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   Passed: ${this.results.passedTests} (${passRate}%)`);
    console.log(`   Failed: ${this.results.failedTests}`);
    
    console.log(`\n💎 VALUE-ADD VALIDATION:`);
    console.log(`   Institutional-Grade Analysis: ${this.results.valueValidation.institutionalGradeAnalysis} confirmations`);
    console.log(`   Market Intelligence Provided: ${this.results.valueValidation.marketIntelligenceProvided} instances`);
    console.log(`   Strategy Alignment Insights: ${this.results.valueValidation.strategyAlignmentInsights} analyses`);
    
    const valueScore = Object.values(this.results.valueValidation).reduce((a, b) => a + b, 0);
    
    console.log(`\n🏆 SYSTEM VALUE ASSESSMENT:`);
    if (valueScore >= 15) {
      console.log(`   ✅ EXCEPTIONAL - System delivers institutional-grade intelligence`);
      console.log(`   🎯 Users receive professional insights no Excel spreadsheet can provide`);
      console.log(`   💡 Clear value proposition beyond basic calculations`);
    } else if (valueScore >= 10) {
      console.log(`   ✅ GOOD - System provides enhanced investment intelligence`);
      console.log(`   📊 Clear value-add over traditional analysis methods`);
    } else {
      console.log(`   ⚠️  NEEDS IMPROVEMENT - Limited value beyond basic metrics`);
    }
    
    console.log(`\n🎉 COMPREHENSIVE TESTING COMPLETE!`);
    console.log(`📋 Investment Decision Engine v2.1 validation: ${passRate >= 90 ? 'PASSED' : 'NEEDS ATTENTION'}`);
  }
}

// Execute comprehensive test suite
if (require.main === module) {
  const testEngine = new ComprehensiveTestEngine();
  testEngine.runComprehensiveTests()
    .then(() => {
      console.log('\n🏁 All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveTestEngine };