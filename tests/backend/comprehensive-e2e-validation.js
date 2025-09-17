#!/usr/bin/env node

/**
 * COMPREHENSIVE END-TO-END VALIDATION TEST
 * 
 * Sr QE Implementation: Complete test of real estate analysis platform
 * Following exact flow from expert-domain-validator.js
 * 
 * Purpose:
 * 1. Test complete property analysis workflow with real data
 * 2. Capture actual system verdicts and financial metrics
 * 3. Validate with all 3 expert personas
 * 4. Document all inputs and outputs for audit trail
 */

const { TestFramework, TestConfig } = require('./core/test-framework-core');
const axios = require('axios');
const fs = require('fs');

class ComprehensiveE2EValidation {
  constructor() {
    this.framework = new TestFramework('Comprehensive E2E Validation');
    this.logger = this.framework.logger;
    this.testResults = [];
    
    // Expert personas for validation
    this.experts = [
      { name: 'Sarah Mitchell (Conservative)', type: 'conservative' },
      { name: 'Mike Chen (Aggressive)', type: 'aggressive' },
      { name: 'Jennifer Rodriguez (Balanced)', type: 'balanced' }
    ];
  }

  async run() {
    try {
      await this.framework.initialize();
      
      // Real Zillow properties
      const realProperties = [
        {
          name: 'Jersey City, NJ Condo',
          address: '16 Belvidere Ave APT 3F, Jersey City, NJ 07304',
          purchasePrice: 255000,
          source: 'Zillow'
        },
        {
          name: 'Tampa, FL Single Family',
          address: '9476 Forest Hills Pl, Tampa, FL 33612',
          purchasePrice: 259000,
          source: 'Zillow'
        },
        {
          name: 'Anna, TX Property',
          address: '1837 Walnut Way, Anna, TX 75409',
          purchasePrice: 255000,
          source: 'Zillow'
        }
      ];

      this.logger.info('🚀 Starting Comprehensive E2E Validation');
      this.logger.info(`Testing ${realProperties.length} properties with ${this.experts.length} expert personas`);

      for (const property of realProperties) {
        const result = await this.testCompletePropertyFlow(property);
        this.testResults.push(result);
      }
      
      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
      return await this.framework.finalize();
      
    } catch (error) {
      this.logger.error('E2E Validation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async testCompletePropertyFlow(property) {
    this.logger.info(`\n━━━ Testing: ${property.name} ━━━`);
    
    const result = {
      property: property,
      timestamp: new Date().toISOString(),
      steps: {}
    };
    
    try {
      // Step 1: Property Wizard Lookup (same as expert validator)
      result.steps.propertyLookup = await this.propertyLookup(property);
      
      // Step 2: Smart Defaults API
      result.steps.smartDefaults = await this.getSmartDefaults(property);
      
      // Step 3: Build Complete Property Data (following expert validator pattern)
      result.steps.propertyData = this.buildWizardDataFromAPIResponses(
        property,
        result.steps.propertyLookup,
        result.steps.smartDefaults
      );
      
      // Step 4: Full Analysis
      result.steps.analysis = await this.analyzeProperty(result.steps.propertyData);
      
      // Step 5: Expert Validation
      if (result.steps.analysis.success) {
        result.steps.expertValidation = await this.validateWithExperts(
          property,
          result.steps.analysis.data
        );
      }
      
      // Log summary
      this.logPropertySummary(property, result);
      
    } catch (error) {
      this.logger.error(`Failed to test ${property.name}`, { error: error.message });
      result.error = error.message;
    }
    
    return result;
  }

  async propertyLookup(property) {
    try {
      this.logger.info('Step 1: Property Wizard Lookup', { address: property.address });
      
      const response = await axios.post(
        `${TestConfig.get('backend.baseUrl')}/api/wizard/property-lookup`,
        {
          address: property.address,
          includeComparables: true,
          includeMarketData: true
        },
        {
          headers: this.framework.auth.getHeaders('testUser'),
          timeout: 30000
        }
      );
      
      this.logger.success('Property lookup successful', {
        found: response.data.success,
        sqft: response.data.propertyDetails?.squareFootage,
        bedrooms: response.data.propertyDetails?.bedrooms
      });
      
      return {
        success: response.data.success,
        propertyDetails: response.data.propertyDetails,
        rentEstimate: response.data.rentEstimate,
        apiResponse: response.data
      };
      
    } catch (error) {
      this.logger.error('Property lookup failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getSmartDefaults(property) {
    try {
      this.logger.info('Step 2: Getting Smart Defaults');
      
      const response = await axios.post(
        `${TestConfig.get('backend.baseUrl')}/api/wizard/smart-defaults`,
        {
          purchasePrice: property.purchasePrice,
          zipCode: this.extractZipCode(property.address)
        },
        {
          headers: this.framework.auth.getHeaders('testUser'),
          timeout: 10000
        }
      );
      
      this.logger.success('Smart defaults retrieved', {
        mortgageRate: response.data.defaults?.currentMortgageRate,
        downPayment: response.data.defaults?.downPaymentPercentage
      });
      
      return {
        success: response.data.success,
        defaults: response.data.defaults
      };
      
    } catch (error) {
      this.logger.error('Smart defaults failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  buildWizardDataFromAPIResponses(property, lookupResult, smartDefaultsResult) {
    // Following exact pattern from expert-domain-validator.js
    
    const propertyData = {
      // Required fields
      propertyName: property.name,
      propertyType: 'SFR',
      purchasePrice: property.purchasePrice,
      
      // Address (parsed from lookup or manual)
      propertyAddress: lookupResult?.success && lookupResult.propertyDetails?.address?.standardized 
        ? lookupResult.propertyDetails.address.standardized
        : this.parseZillowAddress(property.address),
      
      // Property characteristics
      squareFootage: lookupResult?.propertyDetails?.squareFootage || 1800,
      bedrooms: lookupResult?.propertyDetails?.bedrooms || 3,
      bathrooms: lookupResult?.propertyDetails?.bathrooms || 2,
      yearBuilt: lookupResult?.propertyDetails?.yearBuilt || 2000,
      
      // Rent estimate
      monthlyRent: lookupResult?.rentEstimate?.monthlyRent || 
                   lookupResult?.rentEstimate?.range?.low || 
                   2200, // Default if no estimate
      
      // Financial parameters
      downPayment: smartDefaultsResult?.success 
        ? Math.round(property.purchasePrice * (smartDefaultsResult.defaults.downPaymentPercentage / 100))
        : Math.round(property.purchasePrice * 0.20),
      
      interestRate: smartDefaultsResult?.defaults?.currentMortgageRate || 7.25,
      loanTerm: 30,
      
      // Operating expenses (using smart defaults or fallbacks)
      propertyTaxRate: smartDefaultsResult?.defaults?.propertyTaxRate || 1.2,
      insuranceRate: smartDefaultsResult?.defaults?.insuranceRate || 0.35,
      maintenanceCost: smartDefaultsResult?.defaults?.maintenancePercentage || 1.0,
      propertyManagementRate: 8,
      vacancyRate: 5,
      monthlyHOA: 0,
      
      // Strategy defaults
      exitStrategy: {
        primaryExitStrategy: 'flexible',
        portfolioStrategy: 'balanced',
        riskApproach: 'balanced',
        holdPeriod: 7
      }
    };
    
    this.logger.info('Property data constructed', {
      purchasePrice: propertyData.purchasePrice,
      monthlyRent: propertyData.monthlyRent,
      downPayment: propertyData.downPayment,
      interestRate: propertyData.interestRate
    });
    
    return propertyData;
  }

  async analyzeProperty(propertyData) {
    try {
      this.logger.info('Step 4: Full Property Analysis');
      
      const response = await axios.post(
        `${TestConfig.get('backend.baseUrl')}/api/deals/analyze`,
        propertyData,
        {
          headers: this.framework.auth.getHeaders('admin'),
          timeout: 60000
        }
      );
      
      const analysis = response.data;
      
      // Extract key metrics
      const keyMetrics = {
        verdict: analysis.investmentDecision?.verdict,
        score: analysis.investmentDecision?.score,
        monthlyFlow: analysis.monthlyAnalysis?.cashFlow,
        capRate: analysis.keyMetrics?.capRate,
        cocReturn: analysis.keyMetrics?.cocReturn,
        dscr: analysis.keyMetrics?.dscr,
        totalReturn: analysis.keyMetrics?.totalReturn,
        walkAwayPrice: analysis.investmentDecision?.walkAwayPrice
      };
      
      this.logger.success('Analysis complete', keyMetrics);
      
      return {
        success: true,
        data: analysis,
        keyMetrics: keyMetrics
      };
      
    } catch (error) {
      this.logger.error('Analysis failed', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        errorData: error.response?.data
      };
    }
  }

  async validateWithExperts(property, analysis) {
    const expertOpinions = [];
    
    for (const expert of this.experts) {
      const opinion = this.getExpertOpinion(expert, property, analysis);
      expertOpinions.push(opinion);
      
      this.logger.info(`${expert.name} verdict`, {
        systemVerdict: analysis.investmentDecision?.verdict,
        expertOpinion: opinion.verdict,
        alignment: opinion.alignment
      });
    }
    
    return {
      systemVerdict: analysis.investmentDecision?.verdict,
      expertOpinions: expertOpinions,
      consensus: this.calculateConsensus(expertOpinions)
    };
  }

  getExpertOpinion(expert, property, analysis) {
    const verdict = analysis.investmentDecision?.verdict;
    const monthlyFlow = analysis.monthlyAnalysis?.cashFlow;
    const capRate = analysis.keyMetrics?.capRate;
    
    // Simple expert logic based on type
    let expertVerdict = 'PASS';
    let reasoning = '';
    
    if (expert.type === 'conservative') {
      // Conservative: Requires positive cash flow and >5% cap rate
      if (monthlyFlow > 200 && capRate > 5) {
        expertVerdict = 'BUY';
        reasoning = 'Meets conservative cash flow and cap rate requirements';
      } else {
        expertVerdict = 'PASS';
        reasoning = `Cash flow ${monthlyFlow} or cap rate ${capRate}% too low for conservative standards`;
      }
    } else if (expert.type === 'aggressive') {
      // Aggressive: Will accept negative cash flow for appreciation
      if (capRate > 2 || monthlyFlow > -500) {
        expertVerdict = 'BUY';
        reasoning = 'Acceptable for aggressive growth strategy';
      } else {
        expertVerdict = 'PASS';
        reasoning = 'Too risky even for aggressive approach';
      }
    } else {
      // Balanced: Middle ground
      if (monthlyFlow > 0 && capRate > 3.5) {
        expertVerdict = 'BUY';
        reasoning = 'Balanced investment with acceptable returns';
      } else {
        expertVerdict = 'PASS';
        reasoning = 'Does not meet balanced investment criteria';
      }
    }
    
    // Check alignment with system
    const alignment = (verdict === 'PASS' && expertVerdict === 'PASS') ||
                     (verdict !== 'PASS' && expertVerdict === 'BUY');
    
    return {
      expert: expert.name,
      verdict: expertVerdict,
      reasoning: reasoning,
      alignment: alignment
    };
  }

  calculateConsensus(expertOpinions) {
    const buyCount = expertOpinions.filter(o => o.verdict === 'BUY').length;
    const passCount = expertOpinions.filter(o => o.verdict === 'PASS').length;
    const alignmentCount = expertOpinions.filter(o => o.alignment).length;
    
    return {
      buyVotes: buyCount,
      passVotes: passCount,
      consensus: buyCount > passCount ? 'BUY' : 'PASS',
      alignmentRate: (alignmentCount / expertOpinions.length * 100).toFixed(1) + '%'
    };
  }

  logPropertySummary(property, result) {
    const divider = '─'.repeat(60);
    
    console.log(`\n${divider}`);
    console.log(`📊 ${property.name}`);
    console.log(`${divider}`);
    
    if (result.steps.analysis?.success) {
      const metrics = result.steps.analysis.keyMetrics;
      console.log(`System Verdict: ${metrics.verdict || 'N/A'}`);
      console.log(`Deal Score: ${metrics.score || 'N/A'}`);
      console.log(`Monthly Cash Flow: $${metrics.monthlyFlow || 'N/A'}`);
      console.log(`Cap Rate: ${metrics.capRate || 'N/A'}%`);
      console.log(`CoC Return: ${metrics.cocReturn || 'N/A'}%`);
      
      if (result.steps.expertValidation) {
        console.log(`\nExpert Consensus: ${result.steps.expertValidation.consensus.consensus}`);
        console.log(`System-Expert Alignment: ${result.steps.expertValidation.consensus.alignmentRate}`);
      }
    } else {
      console.log(`❌ Analysis Failed: ${result.steps.analysis?.error || 'Unknown error'}`);
    }
    
    console.log(divider);
  }

  async generateComprehensiveReport() {
    const report = {
      testSuite: 'Comprehensive E2E Validation',
      timestamp: new Date().toISOString(),
      totalProperties: this.testResults.length,
      successfulAnalyses: this.testResults.filter(r => r.steps.analysis?.success).length,
      
      summary: this.testResults.map(r => ({
        property: r.property.name,
        analysisSuccess: r.steps.analysis?.success || false,
        systemVerdict: r.steps.analysis?.keyMetrics?.verdict || 'N/A',
        monthlyFlow: r.steps.analysis?.keyMetrics?.monthlyFlow || 'N/A',
        capRate: r.steps.analysis?.keyMetrics?.capRate || 'N/A',
        expertConsensus: r.steps.expertValidation?.consensus?.consensus || 'N/A',
        alignment: r.steps.expertValidation?.consensus?.alignmentRate || 'N/A'
      })),
      
      detailedResults: this.testResults
    };
    
    // Save report
    const reportPath = 'test-results/comprehensive-e2e-validation.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logger.success('Comprehensive report generated', { 
      reportPath: reportPath,
      successRate: `${report.successfulAnalyses}/${report.totalProperties}`
    });
    
    // Print final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎯 COMPREHENSIVE E2E VALIDATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Properties Tested: ${report.totalProperties}`);
    console.log(`Successful Analyses: ${report.successfulAnalyses}`);
    console.log(`Expert Personas: ${this.experts.length}`);
    
    report.summary.forEach(s => {
      console.log(`\n${s.property}:`);
      console.log(`  System Verdict: ${s.systemVerdict}`);
      console.log(`  Expert Consensus: ${s.expertConsensus}`);
      console.log(`  Alignment: ${s.alignment}`);
    });
    
    console.log('\n' + '='.repeat(70));
    
    return report;
  }

  // Helper methods
  extractZipCode(address) {
    const match = address.match(/\b(\d{5})\b/);
    return match ? match[1] : '75001'; // Default ZIP
  }

  parseZillowAddress(address) {
    const parts = address.split(',');
    return {
      street: parts[0]?.trim() || '',
      city: parts[1]?.trim() || '',
      state: parts[2]?.trim().split(' ')[0] || '',
      zipCode: this.extractZipCode(address),
      formattedAddress: address
    };
  }
}

// Run if called directly
async function runComprehensiveE2E() {
  const validator = new ComprehensiveE2EValidation();
  
  try {
    const report = await validator.run();
    console.log('\n✅ Comprehensive E2E Validation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runComprehensiveE2E();
}

module.exports = { ComprehensiveE2EValidation };