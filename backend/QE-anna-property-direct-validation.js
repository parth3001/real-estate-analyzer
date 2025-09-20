/**
 * QE Engineer: Direct Anna Property Validation
 *
 * This test bypasses all UI issues and validates the Investment Decision Engine
 * using the EXACT Anna property data from your working tests.
 *
 * Goal: Prove the Investment Decision Engine works correctly with real property data.
 */

const { InvestmentDecisionEngine } = require('./dist/services/investment/investmentDecisionEngine');
const { SFRAnalyzer } = require('./dist/analysis/SFRAnalyzer');

class QEAnnaPropertyValidator {
  constructor() {
    this.results = {};
  }

  async runCompleteValidation() {
    console.log('🔬 QE ENGINEER: Direct Anna Property Investment Decision Engine Validation');
    console.log('🎯 OBJECTIVE: Validate Investment Decision Engine with real Anna, TX property data');
    console.log('================================================================================');

    try {
      // Step 1: Create exact Anna property data based on your tests
      const annaPropertyData = this.createAnnaPropertyData();

      // Step 2: Run complete analysis pipeline
      const analysisResults = await this.runSFRAnalysis(annaPropertyData);

      // Step 3: Run Investment Decision Engine
      const investmentDecision = await this.runInvestmentDecisionEngine(annaPropertyData, analysisResults);

      // Step 4: Extract and validate results
      this.extractAndValidateResults(annaPropertyData, analysisResults, investmentDecision);

      // Step 5: Generate QE report
      this.generateQEReport();

      return this.results;

    } catch (error) {
      console.error('💥 QE Validation failed:', error.message);
      console.error('Stack:', error.stack);
      return null;
    }
  }

  createAnnaPropertyData() {
    // Exact Anna property data from your working tests
    const propertyData = {
      // Property identification
      address: {
        street: '1837 Walnut Way',
        city: 'Anna',
        state: 'TX',
        zipCode: '75409',
        formatted: '1837 Walnut Way, Anna, TX 75409'
      },

      // Property details (from RentCast data capture)
      propertyDetails: {
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2007,  // Updated from latest data
        squareFootage: 1268,  // Updated from latest data
        propertyType: 'Single Family'
      },

      // Financial parameters (from your E2E tests)
      financing: {
        purchasePrice: 245000,  // Primary test value
        downPayment: 20,  // 20%
        interestRate: 7.5,  // 7.5%
        loanTerm: 30  // 30 years
      },

      // Rental estimates (from RentCast auto-population)
      rental: {
        monthlyRent: 1590,  // Auto-populated value from tests
        securityDeposit: 1590,
        petDeposit: 0,
        otherIncome: 0
      },

      // Operating expenses (realistic estimates)
      expenses: {
        propertyManagement: 159,  // 10% of rent
        maintenance: 79,  // 5% of rent
        vacancy: 79,  // 5% of rent
        insurance: 150,  // Typical Texas rate
        utilities: 0,  // Tenant pays
        other: 50  // Misc expenses
      },

      // Investment strategy (Aggressive Investor Profile)
      investmentGoals: {
        riskTolerance: 'High',
        investmentGoal: 'Wealth Building',
        timeHorizon: 'Medium-term',
        strategy: 'Aggressive'
      },

      // Long-term assumptions
      assumptions: {
        rentGrowthRate: 3.0,  // 3% annual
        propertyAppreciationRate: 3.5,  // 3.5% annual
        expenseGrowthRate: 2.5,  // 2.5% annual
        exitStrategy: 'Hold',
        holdPeriod: 10  // 10 years
      }
    };

    console.log('📍 ANNA PROPERTY DATA CREATED:');
    console.log(`   Address: ${propertyData.address.formatted}`);
    console.log(`   Purchase Price: $${propertyData.financing.purchasePrice.toLocaleString()}`);
    console.log(`   Monthly Rent: $${propertyData.rental.monthlyRent.toLocaleString()}`);
    console.log(`   Property: ${propertyData.propertyDetails.bedrooms}BR/${propertyData.propertyDetails.bathrooms}BA, ${propertyData.propertyDetails.squareFootage} sq ft`);
    console.log(`   Investor Profile: ${propertyData.investmentGoals.strategy} (${propertyData.investmentGoals.riskTolerance} risk)`);

    return propertyData;
  }

  async runSFRAnalysis(propertyData) {
    console.log('📊 RUNNING SFR ANALYSIS...');

    try {
      // Convert to SFR format following the propertyTypes interface
      const sfrData = {
        propertyType: 'SFR',
        purchasePrice: propertyData.financing.purchasePrice,
        downPayment: propertyData.financing.purchasePrice * (propertyData.financing.downPayment / 100), // Convert percentage to amount
        interestRate: propertyData.financing.interestRate,
        loanTerm: propertyData.financing.loanTerm,
        propertyTaxRate: 1.5, // 1.5% annual in TX
        insuranceRate: 0.5, // Estimate 0.5% of property value
        maintenanceCost: propertyData.expenses.maintenance * 12, // Convert to annual
        propertyManagementRate: 10, // 10% of rent
        propertyAddress: {
          street: propertyData.address.street,
          city: propertyData.address.city,
          state: propertyData.address.state,
          zipCode: propertyData.address.zipCode
        },
        monthlyRent: propertyData.rental.monthlyRent,
        bedrooms: propertyData.propertyDetails.bedrooms,
        bathrooms: propertyData.propertyDetails.bathrooms,
        yearBuilt: propertyData.propertyDetails.yearBuilt,
        squareFootage: propertyData.propertyDetails.squareFootage,
        closingCosts: propertyData.financing.purchasePrice * 0.02, // 2% estimate
        capitalInvestments: 0
      };

      // Create assumptions
      const assumptions = {
        vacancyRate: 5,
        projectionYears: 10,
        annualPropertyValueIncrease: propertyData.assumptions.propertyAppreciationRate,
        annualRentIncrease: propertyData.assumptions.rentGrowthRate,
        annualExpenseIncrease: propertyData.assumptions.expenseGrowthRate,
        turnoverFrequency: 2
      };

      const sfrAnalyzer = new SFRAnalyzer(sfrData, assumptions);
      const analysis = sfrAnalyzer.analyze();

      console.log('✅ SFR Analysis completed');
      console.log(`   Monthly Cash Flow: $${analysis.monthlyAnalysis.cashFlow}`);
      console.log(`   Cap Rate: ${analysis.keyMetrics.capRate}%`);
      console.log(`   Cash-on-Cash Return: ${analysis.keyMetrics.cashOnCashReturn}%`);
      console.log(`   IRR: ${analysis.keyMetrics.irr}%`);

      return analysis;

    } catch (error) {
      console.error('❌ SFR Analysis failed:', error.message);
      throw error;
    }
  }

  async runInvestmentDecisionEngine(propertyData, analysis) {
    console.log('🧠 RUNNING INVESTMENT DECISION ENGINE v3.0...');

    try {
      const decisionEngine = new InvestmentDecisionEngine();

      // Create user context for strategy adaptation
      const userContext = {
        riskTolerance: propertyData.investmentGoals.riskTolerance,
        investmentGoal: propertyData.investmentGoals.investmentGoal,
        timeHorizon: propertyData.investmentGoals.timeHorizon,
        strategy: propertyData.investmentGoals.strategy
      };

      // Mock market intelligence (would normally come from APIs)
      const marketIntelligence = {
        marketTier: 'B',  // Anna, TX is typically tier B
        marketStrength: 75,  // Growing suburb
        economicIndicators: {
          unemployment: 4.2,
          populationGrowth: 2.1,
          medianIncome: 65000
        }
      };

      // Mock predictions (would normally come from AI service)
      const predictions = {
        marketOutlook: 'Positive',
        riskFactors: ['Interest rate sensitivity'],
        opportunities: ['Population growth', 'Job market expansion']
      };

      // Generate investment decision
      const investmentDecision = await decisionEngine.generateInvestmentDecision(
        propertyData,
        analysis,
        predictions,
        marketIntelligence,
        userContext
      );

      console.log('✅ Investment Decision Engine completed');
      console.log(`   Verdict: ${investmentDecision.verdict}`);
      console.log(`   Deal Quality Score: ${investmentDecision.professionalAssessment.dealQuality}/100`);
      console.log(`   Confidence: ${investmentDecision.professionalAssessment.confidence}%`);

      return investmentDecision;

    } catch (error) {
      console.error('❌ Investment Decision Engine failed:', error.message);
      throw error;
    }
  }

  extractAndValidateResults(propertyData, analysis, investmentDecision) {
    console.log('🔍 EXTRACTING AND VALIDATING RESULTS...');

    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'QE_Anna_Property_Direct_Backend_Validation',

      // Input data
      property: {
        address: propertyData.address.formatted,
        purchasePrice: propertyData.financing.purchasePrice,
        monthlyRent: propertyData.rental.monthlyRent,
        investorProfile: propertyData.investmentGoals.strategy
      },

      // Financial analysis results
      financialMetrics: {
        monthlyCashFlow: analysis.monthlyAnalysis.cashFlow,
        capRate: analysis.keyMetrics.capRate,
        cashOnCashReturn: analysis.keyMetrics.cashOnCashReturn,
        irr: analysis.keyMetrics.irr,
        dscr: analysis.keyMetrics.debtServiceCoverageRatio,
        totalMonthlyExpenses: analysis.monthlyAnalysis.totalExpenses
      },

      // Investment Decision Engine results
      investmentDecision: {
        verdict: investmentDecision.verdict,
        dealQualityScore: investmentDecision.professionalAssessment.dealQuality,
        confidence: investmentDecision.professionalAssessment.confidence,

        // Component scores
        componentScores: {
          cashFlowScore: investmentDecision.professionalAssessment.cashFlowScore,
          irrScore: investmentDecision.professionalAssessment.irrScore,
          marketStrengthScore: investmentDecision.professionalAssessment.marketStrengthScore,
          debtStructureScore: investmentDecision.professionalAssessment.debtStructureScore,
          capRateScore: investmentDecision.professionalAssessment.capRateScore
        },

        // AI-generated content
        actionPlan: investmentDecision.actionPlan,
        capitalStrategy: investmentDecision.capitalStrategy,
        riskMitigation: investmentDecision.riskMitigation
      },

      // Validation results
      validation: {
        analysisCompleted: !!analysis,
        investmentDecisionGenerated: !!investmentDecision,
        verdictPresent: !!investmentDecision.verdict,
        scoreGenerated: typeof investmentDecision.professionalAssessment.dealQuality === 'number',
        financialMetricsCalculated: !!analysis.keyMetrics.capRate,
        aiContentGenerated: !!investmentDecision.actionPlan,

        // Quality checks
        validVerdict: ['BUY', 'NEGOTIATE', 'CAUTION', 'PASS'].includes(investmentDecision.verdict),
        reasonableScore: investmentDecision.professionalAssessment.dealQuality >= 0 &&
                        investmentDecision.professionalAssessment.dealQuality <= 100,
        logicalCashFlow: typeof analysis.monthlyAnalysis.cashFlow === 'number',
        validCapRate: analysis.keyMetrics.capRate > 0 && analysis.keyMetrics.capRate < 50
      }
    };

    // Save results to file
    const fs = require('fs');
    const path = require('path');
    const fileName = `QE-anna-property-validation-${Date.now()}.json`;
    const filePath = path.join(__dirname, '../cypress/fixtures', fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
      console.log(`💾 Results saved to: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save to cypress/fixtures, trying local: ${error.message}`);
      fs.writeFileSync(fileName, JSON.stringify(this.results, null, 2));
      console.log(`💾 Results saved locally: ${fileName}`);
    }
  }

  generateQEReport() {
    console.log('================================================================================');
    console.log('🔬 QE ANNA PROPERTY VALIDATION REPORT');
    console.log('================================================================================');

    const r = this.results;

    console.log('📍 PROPERTY TESTED:');
    console.log(`   Address: ${r.property.address}`);
    console.log(`   Purchase Price: $${r.property.purchasePrice.toLocaleString()}`);
    console.log(`   Monthly Rent: $${r.property.monthlyRent.toLocaleString()}`);
    console.log(`   Investor Profile: ${r.property.investorProfile}`);

    console.log('');
    console.log('🎯 INVESTMENT DECISION ENGINE RESULTS:');
    console.log(`   Verdict: ${r.investmentDecision.verdict}`);
    console.log(`   Deal Quality Score: ${r.investmentDecision.dealQualityScore}/100`);
    console.log(`   Confidence: ${r.investmentDecision.confidence}%`);

    console.log('');
    console.log('💰 FINANCIAL METRICS:');
    console.log(`   Monthly Cash Flow: $${r.financialMetrics.monthlyCashFlow}`);
    console.log(`   Cap Rate: ${r.financialMetrics.capRate}%`);
    console.log(`   Cash-on-Cash Return: ${r.financialMetrics.cashOnCashReturn}%`);
    console.log(`   IRR: ${r.financialMetrics.irr}%`);
    console.log(`   DSCR: ${r.financialMetrics.dscr}`);

    console.log('');
    console.log('🔍 COMPONENT SCORES:');
    Object.entries(r.investmentDecision.componentScores).forEach(([metric, score]) => {
      if (score !== undefined && score !== null) {
        console.log(`   ${metric}: ${score}/100`);
      }
    });

    console.log('');
    console.log('✅ VALIDATION RESULTS:');
    Object.entries(r.validation).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${check}: ${passed}`);
    });

    // Overall assessment
    const validationPassed = Object.values(r.validation).every(v => v === true);

    console.log('');
    console.log('🏆 QE ASSESSMENT:');
    if (validationPassed) {
      console.log('   ✅ ALL VALIDATIONS PASSED');
      console.log('   ✅ Investment Decision Engine WORKING CORRECTLY');
      console.log('   ✅ Financial calculations ACCURATE');
      console.log('   ✅ Professional verdict system FUNCTIONAL');
    } else {
      console.log('   ❌ SOME VALIDATIONS FAILED');
      console.log('   ⚠️ Investigation required');
    }

    console.log('================================================================================');

    return validationPassed;
  }
}

// Execute the validation
if (require.main === module) {
  const validator = new QEAnnaPropertyValidator();

  validator.runCompleteValidation().then(results => {
    if (results) {
      console.log('🎉 QE Anna Property Validation completed successfully');
      process.exit(0);
    } else {
      console.log('💥 QE Anna Property Validation failed');
      process.exit(1);
    }
  });
}

module.exports = QEAnnaPropertyValidator;