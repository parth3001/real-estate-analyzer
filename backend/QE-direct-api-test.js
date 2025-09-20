/**
 * QE Engineer: Direct API Test for Investment Decision Engine
 *
 * This bypasses all UI issues and tests the Investment Decision Engine directly
 * via the REST API that the frontend uses.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class QEDirectAPITester {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.authToken = null;
    this.extractedData = null;
  }

  // Step 1: Authenticate to get token
  async authenticate() {
    try {
      console.log('🔐 QE: Authenticating with API...');

      const loginResponse = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'admin@realestateanalyzer.com',
        password: 'Spring@2025'
      });

      this.authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Step 2: Call Investment Decision Engine via API
  async analyzeProperty() {
    try {
      console.log('🔬 QE: Calling Investment Decision Engine via API...');

      // Test Property: Same as used in E2E tests
      const propertyData = {
        address: '1837 Walnut Way, Anna, TX 75409',
        purchasePrice: 245000,
        downPayment: 20,
        interestRate: 7.5,
        loanTerm: 30,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2005,
        investmentGoals: {
          riskTolerance: 'High',
          investmentGoal: 'Wealth Building',
          timeHorizon: 'Medium-term',
          strategy: 'Aggressive'
        }
      };

      console.log(`📍 Property: ${propertyData.address}`);
      console.log(`💰 Purchase Price: $${propertyData.purchasePrice.toLocaleString()}`);
      console.log('🔥 Investor Profile: Aggressive');

      const analysisResponse = await axios.post(
        `${this.baseURL}/deals/analyze`,
        propertyData,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for analysis
        }
      );

      console.log('✅ Investment Decision Engine API call successful');
      return analysisResponse.data;
    } catch (error) {
      console.error('❌ Investment Decision Engine API call failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      return null;
    }
  }

  // Step 3: Extract Investment Decision Engine data
  extractInvestmentDecisionData(analysisResult) {
    console.log('🔬 QE: Extracting Investment Decision Engine data...');

    if (!analysisResult) {
      console.error('❌ No analysis result to extract data from');
      return null;
    }

    // Log the full structure to understand what we received
    console.log('📋 API Response Structure:');
    console.log('Keys:', Object.keys(analysisResult));

    const extractedData = {
      timestamp: new Date().toISOString(),
      testType: 'QE_Direct_API_Investment_Decision_Engine_Test',
      property: {
        address: '1837 Walnut Way, Anna, TX 75409',
        purchasePrice: 245000
      },
      rawApiResponse: analysisResult,
      investmentDecision: null,
      financialMetrics: {},
      dealQuality: null,
      verdict: null,
      extractionSuccess: false
    };

    // Extract Investment Decision data based on API response structure
    // These paths are based on the codebase analysis
    if (analysisResult.investmentDecision) {
      extractedData.investmentDecision = analysisResult.investmentDecision;
      extractedData.verdict = analysisResult.investmentDecision.verdict;
      extractedData.dealQuality = analysisResult.investmentDecision.professionalAssessment?.dealQuality;
      extractedData.extractionSuccess = true;
    }

    // Extract financial metrics from wherever they're located in the response
    if (analysisResult.analysis) {
      const analysis = analysisResult.analysis;

      extractedData.financialMetrics = {
        capRate: analysis.keyMetrics?.capRate,
        irr: analysis.keyMetrics?.irr,
        cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn,
        monthlyCashFlow: analysis.monthlyAnalysis?.cashFlow,
        monthlyRent: analysis.monthlyAnalysis?.rent,
        dscr: analysis.keyMetrics?.dscr
      };
    }

    // Alternative extraction paths if the structure is different
    if (analysisResult.keyMetrics) {
      extractedData.financialMetrics = {
        ...extractedData.financialMetrics,
        capRate: analysisResult.keyMetrics.capRate,
        irr: analysisResult.keyMetrics.irr,
        cashOnCashReturn: analysisResult.keyMetrics.cashOnCashReturn,
        dscr: analysisResult.keyMetrics.dscr
      };
    }

    this.extractedData = extractedData;
    return extractedData;
  }

  // Step 4: Log and save results
  logResults() {
    if (!this.extractedData) {
      console.error('❌ No extracted data to log');
      return;
    }

    const data = this.extractedData;

    console.log('================================================================');
    console.log('🔬 QE DIRECT API TEST RESULTS');
    console.log('================================================================');
    console.log(`🎯 VERDICT: ${data.verdict || 'NOT FOUND'}`);
    console.log(`🏆 DEAL QUALITY: ${data.dealQuality || 'NOT FOUND'}/100`);
    console.log('💰 FINANCIAL METRICS:');

    Object.entries(data.financialMetrics).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        console.log(`   ${key}: ${value}`);
      }
    });

    console.log(`✅ EXTRACTION SUCCESS: ${data.extractionSuccess}`);
    console.log(`📊 RAW DATA KEYS: ${Object.keys(data.rawApiResponse).join(', ')}`);
    console.log('================================================================');

    // Save to file for AI audit
    const fileName = `QE-direct-api-extraction-${Date.now()}.json`;
    const filePath = path.join(__dirname, '../cypress/fixtures', fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Data saved to: ${filePath}`);
    } catch (error) {
      console.error('❌ Failed to save data:', error.message);
    }

    return data;
  }

  // Main test execution
  async runCompleteTest() {
    console.log('🚀 QE Engineer: Starting Direct API Test for Investment Decision Engine');
    console.log('================================================================');

    try {
      // Step 1: Authenticate
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        console.error('❌ Cannot proceed without authentication');
        return null;
      }

      // Step 2: Call Investment Decision Engine
      const analysisResult = await this.analyzeProperty();
      if (!analysisResult) {
        console.error('❌ Cannot proceed without analysis result');
        return null;
      }

      // Step 3: Extract data
      const extractedData = this.extractInvestmentDecisionData(analysisResult);
      if (!extractedData) {
        console.error('❌ Data extraction failed');
        return null;
      }

      // Step 4: Log and save results
      const finalData = this.logResults();

      console.log('🎯 QE Direct API Test completed successfully');
      return finalData;

    } catch (error) {
      console.error('💥 QE Direct API Test failed:', error.message);
      return null;
    }
  }
}

// Execute the test
if (require.main === module) {
  const tester = new QEDirectAPITester();
  tester.runCompleteTest().then(result => {
    if (result) {
      console.log('🎉 QE Test completed successfully');
      process.exit(0);
    } else {
      console.log('💥 QE Test failed');
      process.exit(1);
    }
  });
}

module.exports = QEDirectAPITester;