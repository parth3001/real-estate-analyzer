#!/usr/bin/env node

/**
 * EXPERT VALIDATION DATA CAPTURE
 * 
 * Sr QE Tool: Captures actual analysis inputs/outputs for documentation
 * 
 * Purpose:
 * 1. Document exact inputs used in expert validation
 * 2. Capture real analysis results from deal workflow
 * 3. Provide clear audit trail of test data
 */

const { TestFramework, TestConfig } = require('./core/test-framework-core');
const axios = require('axios');
const fs = require('fs');

class ExpertValidationDataCapture {
  constructor() {
    this.framework = new TestFramework('Expert Validation Data Capture');
    this.logger = this.framework.logger;
    this.capturedData = [];
  }

  async run() {
    try {
      await this.framework.initialize();
      
      // Real Zillow properties from expert validation tests
      const realProperties = [
        {
          name: 'Jersey City, NJ Condo',
          address: '16 Belvidere Ave APT 3F, Jersey City, NJ 07304',
          purchasePrice: 255000,
          source: 'Zillow',
          notes: 'Urban market test case'
        },
        {
          name: 'Tampa, FL Single Family',
          address: '9476 Forest Hills Pl, Tampa, FL 33612',
          purchasePrice: 259000,
          source: 'Zillow',
          notes: 'Florida growth market test case'
        },
        {
          name: 'Anna, TX Property',
          address: '1837 Walnut Way, Anna, TX 75409',
          purchasePrice: 255000,
          source: 'Zillow', 
          notes: 'Texas suburban growth test case'
        }
      ];

      for (const property of realProperties) {
        this.logger.info(`Capturing data for: ${property.name}`);
        
        // Step 1: Property Wizard Lookup (real API call)
        const lookupResult = await this.capturePropertyLookup(property);
        
        // Step 2: Full Analysis (real API call)  
        const analysisResult = await this.captureAnalysis(property, lookupResult);
        
        // Step 3: Document the complete data flow
        this.capturedData.push({
          property: property,
          lookup: lookupResult,
          analysis: analysisResult,
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate comprehensive data report
      await this.generateDataReport();
      
      return await this.framework.finalize();
      
    } catch (error) {
      this.logger.error('Data capture failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async capturePropertyLookup(property) {
    try {
      this.logger.info('Step 1: Property Wizard Lookup', { address: property.address });
      
      const response = await axios.post(`${TestConfig.get('backend.baseUrl')}/api/wizard/property-lookup`, {
        address: property.address,
        includeComparables: true,
        includeMarketData: true
      }, {
        headers: this.framework.auth.getHeaders('testUser'),
        timeout: 30000
      });
      
      this.logger.success('Property lookup successful', {
        found: response.data.success,
        estimatedRent: response.data.estimatedRent,
        confidence: response.data.confidence
      });
      
      return {
        success: response.data.success,
        data: response.data,
        apiCall: 'POST /api/wizard/property-lookup',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Property lookup failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        apiCall: 'POST /api/wizard/property-lookup'
      };
    }
  }

  async captureAnalysis(property, lookupResult) {
    try {
      this.logger.info('Step 2: Full SFR Analysis', { property: property.name });
      
      // Use Property Wizard data if available, otherwise default values
      const analysisInput = {
        // Property basics
        address: property.address,
        purchasePrice: property.purchasePrice,
        
        // Financing (typical values)
        downPayment: property.purchasePrice * 0.2, // 20% down
        loanAmount: property.purchasePrice * 0.8,
        interestRate: 7.5, // Current market rate
        loanTermYears: 30,
        
        // Property expenses (market estimates)
        annualPropertyTax: property.purchasePrice * 0.015, // 1.5% typical
        monthlyInsurance: 200,
        monthlyHOA: lookupResult.data?.hoa || 0,
        monthlyMaintenance: property.purchasePrice * 0.01 / 12, // 1% annually
        
        // Rental estimates
        monthlyRent: lookupResult.data?.estimatedRent || 2200,
        vacancyRate: 5,
        propertyManagement: 8,
        
        // Analysis flags
        analysisType: 'rental_property',
        investmentStrategy: 'cash_flow'
      };
      
      this.logger.info('Analysis input constructed', {
        purchasePrice: analysisInput.purchasePrice,
        monthlyRent: analysisInput.monthlyRent,
        downPayment: analysisInput.downPayment,
        interestRate: analysisInput.interestRate
      });
      
      const response = await axios.post(`${TestConfig.get('backend.baseUrl')}/api/deals/analyze`, analysisInput, {
        headers: this.framework.auth.getHeaders('admin'),
        timeout: 60000 // Analysis can take time
      });
      
      // Extract key metrics for documentation
      const analysis = response.data;
      const keyResults = {
        verdict: analysis.investmentDecision?.verdict,
        score: analysis.investmentDecision?.score,
        monthlyFlow: analysis.monthlyAnalysis?.cashFlow,
        capRate: analysis.keyMetrics?.capRate,
        cocReturn: analysis.keyMetrics?.cocReturn,
        dscr: analysis.keyMetrics?.dscr,
        totalReturn: analysis.keyMetrics?.totalReturn
      };
      
      this.logger.success('Analysis complete', keyResults);
      
      return {
        input: analysisInput,
        output: analysis,
        keyResults: keyResults,
        apiCall: 'POST /api/deals/analyze',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Analysis failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        apiCall: 'POST /api/deals/analyze'
      };
    }
  }

  async generateDataReport() {
    const report = {
      testSuite: 'Expert Validation Data Capture',
      timestamp: new Date().toISOString(),
      purpose: 'Document actual inputs/outputs used in expert validation tests',
      totalProperties: this.capturedData.length,
      properties: this.capturedData.map(item => ({
        name: item.property.name,
        address: item.property.address,
        purchasePrice: item.property.purchasePrice,
        lookupSuccess: item.lookup.success,
        analysisSuccess: !!item.analysis.output,
        keyResults: item.analysis.keyResults,
        systemVerdict: item.analysis.keyResults?.verdict,
        monthlyFlow: item.analysis.keyResults?.monthlyFlow,
        capRate: item.analysis.keyResults?.capRate
      })),
      detailedData: this.capturedData
    };
    
    // Save detailed report
    const reportPath = 'test-results/expert-validation-data-capture.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logger.success('Data capture report generated', { 
      reportPath: reportPath,
      propertiesProcessed: this.capturedData.length 
    });
    
    // Log summary to console
    console.log('\n=== EXPERT VALIDATION DATA CAPTURE SUMMARY ===');
    report.properties.forEach(prop => {
      console.log(`\n${prop.name}:`);
      console.log(`  Address: ${prop.address}`);
      console.log(`  Purchase Price: $${prop.purchasePrice.toLocaleString()}`);
      console.log(`  System Verdict: ${prop.systemVerdict}`);
      console.log(`  Monthly Flow: $${prop.monthlyFlow || 'N/A'}`);
      console.log(`  Cap Rate: ${prop.capRate || 'N/A'}%`);
    });
    console.log('\n=== END SUMMARY ===\n');
    
    return report;
  }
}

// Run if called directly
async function runDataCapture() {
  const capture = new ExpertValidationDataCapture();
  
  try {
    const report = await capture.run();
    console.log('✅ Expert validation data capture completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data capture failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runDataCapture();
}

module.exports = { ExpertValidationDataCapture };