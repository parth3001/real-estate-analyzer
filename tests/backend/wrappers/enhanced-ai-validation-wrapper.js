#!/usr/bin/env node

/**
 * ENHANCED AI VALIDATION WRAPPER
 * 
 * Senior Test Engineer Approach:
 * - Wraps existing AI validation tests (test-ai-content-validation.js)
 * - Wraps portfolio AI validation (intelligent-portfolio-ai-validation.js)
 * - Adds unified reporting and quality gates
 * - NO DUPLICATE TEST LOGIC - leverages existing comprehensive tests
 * 
 * Amazon Best Practice: Leverage and enhance, don't recreate
 */

const { TestFramework, TestConfig } = require('../core/test-framework-core');
const path = require('path');
const { spawn } = require('child_process');

class EnhancedAIValidationWrapper {
  constructor() {
    this.framework = new TestFramework('Enhanced AI Validation Suite');
    this.logger = this.framework.logger;
    
    // Paths to existing AI validation tests
    this.existingTests = {
      investmentDecisionAI: path.resolve(__dirname, '../../../backend/test-ai-content-validation.js'),
      portfolioAI: path.resolve(__dirname, '../../../backend/intelligent-portfolio-ai-validation.js'),
      dataCorruption: path.resolve(__dirname, '../../../backend/test-ai-content-fix.js')
    };
  }

  async run() {
    try {
      await this.framework.initialize();
      
      // Run all AI validation tests
      const results = {
        investmentDecisionAI: await this.runInvestmentDecisionAITests(),
        portfolioAI: await this.runPortfolioAITests(),
        dataCorruption: await this.runDataCorruptionTests(),
        summary: {
          hallucinationRate: 0,
          contentQuality: 0,
          dataIntegrity: 0
        }
      };
      
      // Calculate aggregate metrics
      results.summary = this.calculateAggregateMetrics(results);
      
      // Generate unified report
      const report = await this.framework.finalize();
      report.aiValidation = results;
      
      return report;
      
    } catch (error) {
      this.logger.error('Enhanced AI Validation failed', error);
      throw error;
    }
  }

  /**
   * Run existing test-ai-content-validation.js
   * Most comprehensive 7-tab Investment Decision Engine validation
   */
  async runInvestmentDecisionAITests() {
    return new Promise((resolve, reject) => {
      this.logger.info('Running Investment Decision AI validation (7 tabs)');
      const startTime = Date.now();
      
      const testProcess = spawn('node', [this.existingTests.investmentDecisionAI], {
        env: { ...process.env }
      });
      
      let output = '';
      let tabsValidated = 0;
      let hallucinations = 0;
      let validations = 0;
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
        const dataStr = data.toString();
        
        // Parse test output for key metrics
        if (dataStr.includes('REASONING TAB')) tabsValidated++;
        if (dataStr.includes('PROFESSIONAL ANALYSIS TAB')) tabsValidated++;
        if (dataStr.includes('PORTFOLIO FIT TAB')) tabsValidated++;
        if (dataStr.includes('ACTION PLAN TAB')) tabsValidated++;
        if (dataStr.includes('CAPITAL STRATEGY TAB')) tabsValidated++;
        if (dataStr.includes('TIMELINE TAB')) tabsValidated++;
        if (dataStr.includes('ALTERNATIVES TAB')) tabsValidated++;
        
        if (dataStr.includes('HALLUCINATION:')) {
          hallucinations++;
          this.logger.warn('Hallucination detected in AI content');
        }
        
        if (dataStr.includes('✅')) {
          validations++;
        }
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        // Extract validation summary from output
        const summaryMatch = output.match(/Valid AI content sections: (\d+)\/7/);
        const validSections = summaryMatch ? parseInt(summaryMatch[1]) : tabsValidated;
        
        const hallucinationMatch = output.match(/Hallucinations detected: (\d+)/);
        const detectedHallucinations = hallucinationMatch ? parseInt(hallucinationMatch[1]) : hallucinations;
        
        const result = {
          passed: code === 0,
          duration,
          tabsValidated: validSections,
          totalTabs: 7,
          hallucinations: detectedHallucinations,
          validations,
          verdict: this.determineAIContentVerdict(validSections, detectedHallucinations)
        };
        
        if (code === 0) {
          this.logger.success(`Investment Decision AI validation passed (${duration}ms)`, {
            tabsValidated: `${validSections}/7`,
            hallucinations: detectedHallucinations
          });
        } else {
          this.logger.error('Investment Decision AI validation failed', { code });
        }
        
        resolve(result);
      });
      
      testProcess.stderr.on('data', (data) => {
        this.logger.error('Test error output:', data.toString());
      });
    });
  }

  /**
   * Run existing intelligent-portfolio-ai-validation.js
   * Professional validation with Marcus Chen persona
   */
  async runPortfolioAITests() {
    return new Promise((resolve, reject) => {
      this.logger.info('Running Portfolio AI validation (4 endpoints)');
      const startTime = Date.now();
      
      const testProcess = spawn('node', [this.existingTests.portfolioAI], {
        env: { ...process.env, OPENAI_API_KEY: TestConfig.get('openai.apiKey') }
      });
      
      let output = '';
      let endpointsValidated = 0;
      let professionalApprovals = 0;
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
        const dataStr = data.toString();
        
        // Parse portfolio AI test output
        if (dataStr.includes('Health Check Generated Successfully')) endpointsValidated++;
        if (dataStr.includes('Peer Comparison Generated Successfully')) endpointsValidated++;
        if (dataStr.includes('Goal Achievement Path Generated Successfully')) endpointsValidated++;
        if (dataStr.includes('Comprehensive Insights Generated Successfully')) endpointsValidated++;
        
        if (dataStr.includes('AI Validation: PASS')) {
          professionalApprovals++;
        }
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        // Extract success rate from output
        const successMatch = output.match(/Success Rate: ([\d.]+)%/);
        const successRate = successMatch ? parseFloat(successMatch[1]) : 0;
        
        const result = {
          passed: code === 0,
          duration,
          endpointsValidated,
          totalEndpoints: 4,
          professionalApprovals,
          successRate,
          marcusChenApproval: successRate >= 80
        };
        
        if (code === 0) {
          this.logger.success(`Portfolio AI validation passed (${duration}ms)`, {
            endpointsValidated: `${endpointsValidated}/4`,
            professionalApproval: `${successRate}%`
          });
        } else {
          this.logger.error('Portfolio AI validation failed', { code });
        }
        
        resolve(result);
      });
      
      testProcess.stderr.on('data', (data) => {
        this.logger.error('Test error output:', data.toString());
      });
    });
  }

  /**
   * Run existing test-ai-content-fix.js
   * Data corruption regression testing ($0 values, undefined)
   */
  async runDataCorruptionTests() {
    return new Promise((resolve, reject) => {
      this.logger.info('Running data corruption regression tests');
      const startTime = Date.now();
      
      const testProcess = spawn('node', [this.existingTests.dataCorruption], {
        env: { ...process.env }
      });
      
      let output = '';
      let dataIssues = 0;
      let testsRun = 0;
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
        const dataStr = data.toString();
        
        // Parse data corruption test output
        if (dataStr.includes('TEST 1:')) testsRun++;
        if (dataStr.includes('TEST 2:')) testsRun++;
        if (dataStr.includes('TEST 3:')) testsRun++;
        if (dataStr.includes('TEST 4:')) testsRun++;
        
        if (dataStr.includes('$0 REFERENCES')) {
          dataIssues++;
          this.logger.warn('$0 reference detected in AI content');
        }
        
        if (dataStr.includes('undefined') || dataStr.includes('null values')) {
          dataIssues++;
          this.logger.warn('Undefined/null values in AI content');
        }
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        // Extract success rate
        const successMatch = output.match(/Success Rate: ([\d.]+)%/);
        const successRate = successMatch ? parseFloat(successMatch[1]) : 0;
        
        const result = {
          passed: code === 0 && dataIssues === 0,
          duration,
          testsRun,
          dataIssues,
          successRate,
          dataIntegrity: dataIssues === 0
        };
        
        if (result.passed) {
          this.logger.success(`Data corruption tests passed (${duration}ms)`, {
            testsRun,
            dataIssues: 0
          });
        } else {
          this.logger.error('Data corruption detected', { dataIssues });
        }
        
        resolve(result);
      });
      
      testProcess.stderr.on('data', (data) => {
        this.logger.error('Test error output:', data.toString());
      });
    });
  }

  /**
   * Calculate aggregate AI validation metrics
   */
  calculateAggregateMetrics(results) {
    // Hallucination rate (should be 0%)
    const totalAIResponses = results.investmentDecisionAI.tabsValidated + 
                            results.portfolioAI.endpointsValidated;
    const hallucinationRate = results.investmentDecisionAI.hallucinations / totalAIResponses;
    
    // Content quality (average of all validations)
    const investmentQuality = results.investmentDecisionAI.tabsValidated / 7;
    const portfolioQuality = results.portfolioAI.successRate / 100;
    const contentQuality = (investmentQuality + portfolioQuality) / 2;
    
    // Data integrity
    const dataIntegrity = results.dataCorruption.dataIntegrity ? 1.0 : 0.0;
    
    return {
      hallucinationRate: (hallucinationRate * 100).toFixed(2) + '%',
      contentQuality: (contentQuality * 100).toFixed(2) + '%',
      dataIntegrity: (dataIntegrity * 100).toFixed(2) + '%',
      overallAIHealth: ((1 - hallucinationRate) * contentQuality * dataIntegrity * 100).toFixed(2) + '%'
    };
  }

  /**
   * Determine AI content verdict based on validation results
   */
  determineAIContentVerdict(validSections, hallucinations) {
    if (hallucinations === 0 && validSections >= 6) {
      return 'EXCELLENT';
    } else if (hallucinations <= 1 && validSections >= 5) {
      return 'GOOD';
    } else if (hallucinations <= 2 && validSections >= 4) {
      return 'NEEDS_IMPROVEMENT';
    } else {
      return 'POOR';
    }
  }
}

// ====================
// MAIN EXECUTION
// ====================

async function runEnhancedAIValidation() {
  const wrapper = new EnhancedAIValidationWrapper();
  
  try {
    const report = await wrapper.run();
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 ENHANCED AI VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Investment Decision AI Results
    const investmentAI = report.aiValidation.investmentDecisionAI;
    console.log('\n📊 INVESTMENT DECISION AI (7 Tabs):');
    console.log(`   Status: ${investmentAI.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Tabs Validated: ${investmentAI.tabsValidated}/${investmentAI.totalTabs}`);
    console.log(`   Hallucinations: ${investmentAI.hallucinations}`);
    console.log(`   Verdict: ${investmentAI.verdict}`);
    console.log(`   Duration: ${investmentAI.duration}ms`);
    
    // Portfolio AI Results
    const portfolioAI = report.aiValidation.portfolioAI;
    console.log('\n🏢 PORTFOLIO AI INTELLIGENCE (4 Endpoints):');
    console.log(`   Status: ${portfolioAI.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Endpoints Validated: ${portfolioAI.endpointsValidated}/${portfolioAI.totalEndpoints}`);
    console.log(`   Professional Approval: ${portfolioAI.successRate}%`);
    console.log(`   Marcus Chen Approval: ${portfolioAI.marcusChenApproval ? '✅ YES' : '❌ NO'}`);
    console.log(`   Duration: ${portfolioAI.duration}ms`);
    
    // Data Corruption Results
    const dataCorruption = report.aiValidation.dataCorruption;
    console.log('\n🛡️ DATA CORRUPTION TESTS:');
    console.log(`   Status: ${dataCorruption.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Tests Run: ${dataCorruption.testsRun}`);
    console.log(`   Data Issues: ${dataCorruption.dataIssues}`);
    console.log(`   Data Integrity: ${dataCorruption.dataIntegrity ? '✅ INTACT' : '❌ CORRUPTED'}`);
    console.log(`   Duration: ${dataCorruption.duration}ms`);
    
    // Aggregate Metrics
    const summary = report.aiValidation.summary;
    console.log('\n📈 AGGREGATE AI METRICS:');
    console.log(`   Hallucination Rate: ${summary.hallucinationRate}`);
    console.log(`   Content Quality: ${summary.contentQuality}`);
    console.log(`   Data Integrity: ${summary.dataIntegrity}`);
    console.log(`   Overall AI Health: ${summary.overallAIHealth}`);
    
    // Quality Gates
    console.log('\n🎯 QUALITY GATES:');
    const hallucinationGate = parseFloat(summary.hallucinationRate) === 0;
    const contentGate = parseFloat(summary.contentQuality) >= 95;
    const integrityGate = parseFloat(summary.dataIntegrity) === 100;
    
    console.log(`   ${hallucinationGate ? '✅' : '❌'} Zero Hallucinations: ${summary.hallucinationRate}`);
    console.log(`   ${contentGate ? '✅' : '❌'} Content Quality ≥95%: ${summary.contentQuality}`);
    console.log(`   ${integrityGate ? '✅' : '❌'} Data Integrity 100%: ${summary.dataIntegrity}`);
    
    // Overall determination
    const allPassed = investmentAI.passed && portfolioAI.passed && dataCorruption.passed;
    const gatesPassed = hallucinationGate && contentGate && integrityGate;
    
    if (allPassed && gatesPassed) {
      console.log('\n🎉 AI VALIDATION SUITE PASSED - PRODUCTION READY');
      console.log('All AI systems generating high-quality, hallucination-free content');
      process.exit(0);
    } else {
      console.log('\n⚠️  AI VALIDATION NEEDS ATTENTION');
      console.log('Some AI content quality issues detected');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ENHANCED AI VALIDATION FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use in master test runner
module.exports = { EnhancedAIValidationWrapper };

// Run if called directly
if (require.main === module) {
  runEnhancedAIValidation();
}