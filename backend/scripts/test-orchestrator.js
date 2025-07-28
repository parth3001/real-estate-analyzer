#!/usr/bin/env node

/**
 * Production-Grade E2E Test Orchestrator
 * Amazon-level reliability and reporting
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestOrchestrator {
  constructor() {
    this.config = {
      frontend: {
        url: 'http://localhost:3000',
        healthEndpoint: '/',
        timeout: 30000,
        retries: 5
      },
      backend: {
        url: 'http://localhost:3001',
        healthEndpoint: '/api/health',
        timeout: 30000,
        retries: 5
      },
      database: {
        timeout: 15000,
        retries: 3
      }
    };
    
    this.testResults = {
      startTime: new Date(),
      endTime: null,
      duration: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      performance: {},
      coverage: {},
      allPassed: false,
      categoryResults: []
    };
    
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  // Amazon-grade logging with structured format
  log(level, message, data = {}) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.logLevel.toLowerCase()] || 2;
    
    if (levels[level] <= currentLevel) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...data
      };
      
      console.log(JSON.stringify(logEntry));
    }
  }

  // Robust health check with exponential backoff
  async healthCheck(service, attempt = 1) {
    const config = this.config[service];
    const maxAttempts = config.retries;
    
    this.log('info', `Health check attempt ${attempt}/${maxAttempts} for ${service}`, {
      service,
      attempt,
      url: config.url + config.healthEndpoint
    });

    try {
      const response = await axios.get(config.url + config.healthEndpoint, {
        timeout: config.timeout,
        validateStatus: (status) => status < 500 // Accept any non-5xx status
      });
      
      this.log('info', `${service} health check passed`, {
        service,
        status: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown'
      });
      
      return true;
    } catch (error) {
      this.log('warn', `${service} health check failed`, {
        service,
        attempt,
        error: error.message,
        code: error.code
      });

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        this.log('info', `Retrying ${service} health check in ${delay}ms`, { service, delay });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.healthCheck(service, attempt + 1);
      }
      
      throw new Error(`${service} failed health check after ${maxAttempts} attempts: ${error.message}`);
    }
  }

  // Comprehensive service validation
  async validateInfrastructure() {
    this.log('info', '🔍 Starting infrastructure validation...');
    
    const services = ['frontend', 'backend'];
    const healthChecks = services.map(service => 
      this.healthCheck(service).catch(error => ({ service, error }))
    );
    
    const results = await Promise.allSettled(healthChecks);
    const failures = results
      .filter(result => result.status === 'rejected' || result.value?.error)
      .map(result => result.reason || result.value?.error);
    
    if (failures.length > 0) {
      this.log('error', '❌ Infrastructure validation failed', {
        failures: failures.map(f => f.message || f.toString())
      });
      throw new Error(`Infrastructure not ready: ${failures.map(f => f.message || f).join(', ')}`);
    }
    
    this.log('info', '✅ All services healthy and ready');
    return true;
  }

  // Advanced database health and seeding
  async prepareDatabaseEnvironment() {
    this.log('info', '🗄️ Preparing database environment...');
    
    try {
      // Test database connectivity first
      await this.testDatabaseConnection();
      
      // Use Cypress task for database operations (existing implementation)
      this.log('info', 'Database operations will be handled by Cypress tasks');
      this.log('info', '✅ Database environment ready');
      
    } catch (error) {
      this.log('error', '❌ Database preparation failed', { error: error.message });
      throw error;
    }
  }
  
  // Test database connectivity
  async testDatabaseConnection() {
    try {
      const response = await axios.get(`${this.config.backend.url}/api/health`, {
        timeout: 10000
      });
      
      if (response.status === 200) {
        this.log('info', '✅ Database connectivity verified');
        return true;
      }
    } catch (error) {
      this.log('warn', '⚠️ Database health check failed', { error: error.message });
      throw new Error('Database not accessible');
    }
  }

  // Enhanced Cypress execution with connection retry
  async executeCypressWithRetry(specs, options = {}, attempt = 1) {
    const maxAttempts = 3;
    const retryDelay = 5000;
    
    try {
      return await this.executeCypressSpecs(specs, options);
    } catch (error) {
      // Check if it's a connection error
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
        if (attempt < maxAttempts) {
          this.log('warn', `Connection failed, retrying in ${retryDelay}ms (attempt ${attempt}/${maxAttempts})`, {
            error: error.message,
            attempt,
            specs
          });
          
          // Wait and re-validate infrastructure
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          await this.validateInfrastructure();
          
          return this.executeCypressWithRetry(specs, options, attempt + 1);
        }
      }
      
      throw error;
    }
  }

  // Run comprehensive test suite with categorization
  async executeTestSuite() {
    this.log('info', '🧪 Starting comprehensive E2E test execution...');
    
    // Use existing Cypress tests with production-grade orchestration
    const testCategories = [
      {
        name: 'System Health Checks',
        specs: ['cypress/e2e/health-check.cy.js'],
        priority: 'P0',
        timeout: 30000,
        retries: 2
      },
      {
        name: 'Production-Grade Journey Tests',
        specs: ['cypress/e2e/04-production-grade-user-journey.cy.js'],
        priority: 'P0',
        timeout: 90000,
        retries: 2
      },
      {
        name: 'API Integration Tests',
        specs: ['cypress/e2e/01-api-integration.cy.js'],
        priority: 'P1',
        timeout: 60000,
        retries: 2
      },
      {
        name: 'Authentication Tests',
        specs: ['cypress/e2e/02-authentication.cy.js'], 
        priority: 'P1',
        timeout: 45000,
        retries: 1
      },
      {
        name: 'UI Component Tests',
        specs: ['cypress/e2e/03-ui-components.cy.js'],
        priority: 'P2',
        timeout: 30000,
        retries: 1
      }
    ];

    let allPassed = true;
    const categoryResults = [];

    for (const category of testCategories) {
      this.log('info', `Running ${category.name} (${category.priority})...`);
      
      try {
        const result = await this.runTestCategory(category);
        categoryResults.push({ ...category, result, status: 'passed' });
        
        this.log('info', `✅ ${category.name} completed successfully`, {
          category: category.name,
          testsRun: result.stats?.tests || 0,
          duration: result.stats?.duration || 0
        });
        
      } catch (error) {
        allPassed = false;
        categoryResults.push({ ...category, error, status: 'failed' });
        
        this.log('error', `❌ ${category.name} failed`, {
          category: category.name,
          error: error.message
        });
        
        // For P0 tests, fail fast
        if (category.priority === 'P0') {
          this.log('error', 'Critical test failure - stopping execution');
          break;
        }
      }
    }

    this.testResults.categoryResults = categoryResults;
    this.testResults.allPassed = allPassed;
    
    return allPassed;
  }

  // Run individual test category with enhanced retry logic
  async runTestCategory(category, attempt = 1) {
    const maxAttempts = category.retries + 1;
    
    this.log('info', `🏃 Running ${category.name} (Priority: ${category.priority}, Attempt: ${attempt}/${maxAttempts})`);
    
    try {
      const startTime = Date.now();
      const result = await this.executeCypressWithRetry(category.specs, {
        timeout: category.timeout
      });
      
      const duration = Date.now() - startTime;
      this.log('info', `✅ ${category.name} completed successfully in ${duration}ms`);
      
      return { ...result, duration, category: category.name };
      
    } catch (error) {
      if (attempt < maxAttempts) {
        const delay = Math.min(5000 * attempt, 15000); // Progressive delay
        this.log('warn', `❌ ${category.name} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`, {
          error: error.message,
          category: category.name
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Re-validate infrastructure before retry
        try {
          await this.validateInfrastructure();
        } catch (infraError) {
          this.log('error', 'Infrastructure validation failed during retry', {
            category: category.name,
            infraError: infraError.message
          });
          throw infraError;
        }
        
        return this.runTestCategory(category, attempt + 1);
      }
      
      this.log('error', `💥 ${category.name} failed after ${maxAttempts} attempts`, {
        error: error.message,
        category: category.name
      });
      throw error;
    }
  }

  // Execute Cypress specs with comprehensive reporting and connection handling
  async executeCypressSpecs(specs, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'cypress', 'run',
        '--spec', specs.join(','),
        '--reporter', 'spec',
        '--reporter-options', 'mochaFile=cypress/reports/results-[hash].xml',
        '--env', `apiUrl=http://localhost:3001/api`
      ];

      // Enhanced configuration
      const configOptions = [
        `defaultCommandTimeout=${options.timeout || 10000}`,
        'responseTimeout=30000',
        'requestTimeout=15000',
        'pageLoadTimeout=30000',
        'video=true',
        'screenshotOnRunFailure=true'
      ];
      
      args.push('--config', configOptions.join(','));

      this.log('info', 'Starting Cypress execution', {
        specs,
        args: args.join(' ')
      });

      const cypress = spawn('npx', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';
      let testResults = { passed: 0, failed: 0, pending: 0, skipped: 0 };

      cypress.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Real-time parsing for better monitoring
        if (output.includes('✓') || output.includes('passing')) {
          testResults.passed++;
        }
        if (output.includes('✗') || output.includes('failing')) {
          testResults.failed++;
        }
        if (output.includes('pending')) {
          testResults.pending++;
        }
      });

      cypress.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        
        // Log connection errors immediately
        if (error.includes('ECONNREFUSED') || error.includes('connect ECONNREFUSED')) {
          this.log('warn', '🔌 Connection error detected during test execution', {
            error: error.trim()
          });
        }
      });

      cypress.on('close', (code) => {
        const executionSummary = {
          exitCode: code,
          stdout: stdout.substring(stdout.length - 1000), // Last 1000 chars
          stderr: stderr.substring(stderr.length - 500),   // Last 500 chars
          testResults,
          specs
        };
        
        this.log('info', `Cypress execution completed with code ${code}`, executionSummary);
        
        if (code === 0) {
          resolve({
            success: true,
            stats: testResults,
            exitCode: code,
            summary: `${testResults.passed} passed, ${testResults.failed} failed`
          });
        } else {
          // Enhanced error reporting
          let errorMessage = `Tests failed with exit code ${code}`;
          
          if (stderr.includes('ECONNREFUSED')) {
            errorMessage += '\n🔌 Connection Error: Backend service not accessible';
          }
          if (stderr.includes('Cannot resolve')) {
            errorMessage += '\n🌐 DNS/Network Error: Cannot resolve host';
          }
          if (stdout.includes('No specs found')) {
            errorMessage += '\n📁 File Error: Test specs not found';
          }
          
          reject(new Error(errorMessage + `\nTest Results: ${testResults.passed} passed, ${testResults.failed} failed`));
        }
      });

      cypress.on('error', (error) => {
        this.log('error', 'Failed to start Cypress process', {
          error: error.message,
          specs
        });
        reject(new Error(`Failed to start Cypress: ${error.message}`));
      });
      
      // Graceful shutdown handling
      process.on('SIGINT', () => {
        this.log('warn', 'Received SIGINT, terminating Cypress...');
        cypress.kill('SIGTERM');
      });
    });
  }

  // Generate Amazon-grade comprehensive test report
  generateReport() {
    this.testResults.endTime = new Date();
    this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
    
    const categoryResults = this.testResults.categoryResults || [];
    const totalTests = categoryResults.reduce((sum, cat) => sum + (cat.result?.stats?.passed || 0) + (cat.result?.stats?.failed || 0), 0);
    const totalPassed = categoryResults.reduce((sum, cat) => sum + (cat.result?.stats?.passed || 0), 0);
    const totalFailed = categoryResults.reduce((sum, cat) => sum + (cat.result?.stats?.failed || 0), 0);
    
    const report = {
      metadata: {
        testRunId: `e2e-${Date.now()}`,
        timestamp: this.testResults.startTime.toISOString(),
        duration: {
          total: this.testResults.duration,
          formatted: `${Math.round(this.testResults.duration / 1000)}s`
        },
        environment: {
          frontend: this.config.frontend.url,
          backend: this.config.backend.url,
          node: process.version,
          platform: process.platform,
          cypress: 'latest'
        }
      },
      summary: {
        status: this.testResults.allPassed ? 'PASSED' : 'FAILED',
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? `${Math.round((totalPassed / totalTests) * 100)}%` : '0%',
        categories: {
          total: categoryResults.length,
          passed: categoryResults.filter(cat => cat.status === 'passed').length,
          failed: categoryResults.filter(cat => cat.status === 'failed').length
        }
      },
      categoryDetails: categoryResults.map(cat => ({
        name: cat.name,
        priority: cat.priority,
        status: cat.status,
        duration: cat.result?.duration || 0,
        tests: {
          passed: cat.result?.stats?.passed || 0,
          failed: cat.result?.stats?.failed || 0
        },
        error: cat.error?.message || null
      })),
      insights: this.generateInsights(categoryResults),
      recommendations: this.generateRecommendations(),
      cicdMetrics: {
        shouldFailBuild: !this.testResults.allPassed,
        criticalFailures: categoryResults.filter(cat => cat.priority === 'P0' && cat.status === 'failed').length,
        performanceFlag: this.testResults.duration > 300000 // > 5 minutes
      }
    };

    // Write comprehensive reports
    const reportDir = path.join(__dirname, '../cypress/reports');
    fs.mkdirSync(reportDir, { recursive: true });
    
    // Main JSON report
    const jsonReportPath = path.join(reportDir, 'e2e-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    // CI/CD friendly summary
    const cicdSummary = {
      status: report.summary.status,
      tests: `${totalPassed}/${totalTests}`,
      duration: report.metadata.duration.formatted,
      criticalFailures: report.cicdMetrics.criticalFailures,
      buildShouldFail: report.cicdMetrics.shouldFailBuild
    };
    
    const cicdReportPath = path.join(reportDir, 'cicd-summary.json');
    fs.writeFileSync(cicdReportPath, JSON.stringify(cicdSummary, null, 2));
    
    // Human-readable summary
    this.generateHumanReadableReport(report, reportDir);
    
    this.log('info', '📊 Amazon-grade test execution complete', {
      status: report.summary.status,
      tests: `${totalPassed}/${totalTests} passed`,
      duration: report.metadata.duration.formatted,
      reportPath: jsonReportPath
    });
    
    return report;
  }
  
  // Generate human-readable report
  generateHumanReadableReport(report, reportDir) {
    const lines = [
      '# E2E Test Execution Report',
      `**Status:** ${report.summary.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`,
      `**Duration:** ${report.metadata.duration.formatted}`,
      `**Tests:** ${report.summary.passed}/${report.summary.totalTests} passed (${report.summary.successRate})`,
      '',
      '## Category Results',
      ''
    ];
    
    report.categoryDetails.forEach(cat => {
      const icon = cat.status === 'passed' ? '✅' : '❌';
      lines.push(`### ${icon} ${cat.name} (${cat.priority})`);
      lines.push(`- **Status:** ${cat.status}`);
      lines.push(`- **Tests:** ${cat.tests.passed} passed, ${cat.tests.failed} failed`);
      if (cat.duration) {
        lines.push(`- **Duration:** ${Math.round(cat.duration / 1000)}s`);
      }
      if (cat.error) {
        lines.push(`- **Error:** ${cat.error}`);
      }
      lines.push('');
    });
    
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      report.recommendations.forEach(rec => {
        const icon = rec.type === 'critical' ? '🚨' : rec.type === 'performance' ? '⚡' : '💡';
        lines.push(`${icon} **${rec.type.toUpperCase()}:** ${rec.message}`);
        lines.push(`   - Action: ${rec.action}`);
        lines.push('');
      });
    }
    
    const readableReportPath = path.join(reportDir, 'EXECUTION_SUMMARY.md');
    fs.writeFileSync(readableReportPath, lines.join('\n'));
  }
  
  // Generate insights from test execution
  generateInsights(categoryResults) {
    const insights = [];
    
    // Performance insights
    const totalDuration = categoryResults.reduce((sum, cat) => sum + (cat.result?.duration || 0), 0);
    if (totalDuration > 0) {
      const avgDuration = totalDuration / categoryResults.length;
      insights.push({
        type: 'performance',
        metric: 'averageTestDuration',
        value: `${Math.round(avgDuration / 1000)}s`,
        message: avgDuration > 60000 ? 'Tests are running slower than optimal' : 'Test performance is good'
      });
    }
    
    // Reliability insights
    const p0Failures = categoryResults.filter(cat => cat.priority === 'P0' && cat.status === 'failed').length;
    if (p0Failures > 0) {
      insights.push({
        type: 'reliability',
        metric: 'criticalFailures',
        value: p0Failures,
        message: 'Critical test failures detected - immediate attention required'
      });
    }
    
    return insights;
  }

  // Generate Amazon-grade actionable recommendations
  generateRecommendations() {
    const recommendations = [];
    const categoryResults = this.testResults.categoryResults || [];
    
    // Critical failures
    const criticalFailures = categoryResults.filter(cat => cat.priority === 'P0' && cat.status === 'failed');
    if (criticalFailures.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `${criticalFailures.length} critical test categories failed`,
        action: `Fix P0 failures immediately: ${criticalFailures.map(c => c.name).join(', ')}`,
        impact: 'Deployment should be blocked until resolved'
      });
    }
    
    // Connection issues
    const connectionErrors = categoryResults.filter(cat => 
      cat.error && cat.error.message && cat.error.message.includes('ECONNREFUSED')
    );
    if (connectionErrors.length > 0) {
      recommendations.push({
        type: 'infrastructure',
        message: 'Connection errors detected during test execution',
        action: 'Verify all services are running and accessible before test execution',
        impact: 'Tests may be failing due to infrastructure issues, not code problems'
      });
    }
    
    // Performance recommendations
    if (this.testResults.duration > 300000) { // > 5 minutes
      recommendations.push({
        type: 'performance',
        message: `Test execution took ${Math.round(this.testResults.duration / 1000)}s (exceeds 5min threshold)`,
        action: 'Optimize slow tests, implement parallel execution, or review test scope',
        impact: 'Slow tests reduce development velocity and CI/CD efficiency'
      });
    }
    
    // Flaky test detection
    const retriedTests = categoryResults.filter(cat => cat.result && cat.result.retryCount > 0);
    if (retriedTests.length > 0) {
      recommendations.push({
        type: 'reliability',
        message: `${retriedTests.length} test categories required retries`,
        action: 'Investigate and fix flaky tests to improve reliability',
        impact: 'Flaky tests reduce confidence and increase maintenance overhead'
      });
    }
    
    // Coverage recommendations
    const p2Failures = categoryResults.filter(cat => cat.priority === 'P2' && cat.status === 'failed');
    if (p2Failures.length > 0) {
      recommendations.push({
        type: 'quality',
        message: 'Low-priority tests are failing',
        action: 'Review P2 test failures - may indicate edge case issues',
        impact: 'Could affect user experience in less common scenarios'
      });
    }
    
    return recommendations;
  }

  // Main Amazon-grade orchestration method
  async run() {
    const orchestrationId = `orchestration-${Date.now()}`;
    
    try {
      this.log('info', '🚀 Starting Amazon-grade E2E test orchestration...', {
        orchestrationId,
        nodeVersion: process.version,
        platform: process.platform
      });
      
      // Step 1: Pre-flight checks
      this.log('info', '🔍 Step 1: Pre-flight infrastructure validation');
      await this.validateInfrastructure();
      
      // Step 2: Environment preparation
      this.log('info', '🏭 Step 2: Database environment preparation');
      await this.prepareDatabaseEnvironment();
      
      // Step 3: Test suite execution with comprehensive monitoring
      this.log('info', '🧪 Step 3: Comprehensive test suite execution');
      const success = await this.executeTestSuite();
      
      // Step 4: Comprehensive reporting and analysis
      this.log('info', '📊 Step 4: Generating comprehensive reports');
      const report = this.generateReport();
      
      // Step 5: Final analysis and exit strategy
      this.log('info', '🏁 Step 5: Execution analysis and exit strategy');
      
      if (success) {
        this.log('info', '✅ All tests passed - deployment ready', {
          orchestrationId,
          totalTests: report.summary.totalTests,
          duration: report.metadata.duration.formatted
        });
        
        console.log('\n🎉 SUCCESS: All E2E tests passed!');
        console.log(`📈 Report: ${path.join(__dirname, '../cypress/reports/EXECUTION_SUMMARY.md')}`);
        process.exit(0);
        
      } else {
        this.log('error', '❌ Test failures detected - deployment blocked', {
          orchestrationId,
          criticalFailures: report.cicdMetrics.criticalFailures,
          recommendations: report.recommendations.length
        });
        
        console.log('\n🚨 FAILURE: E2E tests failed!');
        console.log(`🔍 Details: ${path.join(__dirname, '../cypress/reports/EXECUTION_SUMMARY.md')}`);
        
        // Show critical recommendations
        const criticalRecs = report.recommendations.filter(r => r.type === 'critical');
        if (criticalRecs.length > 0) {
          console.log('\n🚨 CRITICAL ACTIONS REQUIRED:');
          criticalRecs.forEach(rec => {
            console.log(`  - ${rec.message}`);
            console.log(`    Action: ${rec.action}`);
            console.log('');
          });
        }
        
        process.exit(1);
      }
      
    } catch (error) {
      this.log('error', '💥 Test orchestration failed catastrophically', {
        orchestrationId,
        error: error.message,
        stack: error.stack
      });
      
      console.log('\n💥 CATASTROPHIC FAILURE: Test orchestration crashed!');
      console.log(`Error: ${error.message}`);
      
      // Generate failure report
      try {
        const failureReport = {
          status: 'CATASTROPHIC_FAILURE',
          error: error.message,
          timestamp: new Date().toISOString(),
          orchestrationId
        };
        
        const reportDir = path.join(__dirname, '../cypress/reports');
        fs.mkdirSync(reportDir, { recursive: true });
        fs.writeFileSync(
          path.join(reportDir, 'failure-report.json'),
          JSON.stringify(failureReport, null, 2)
        );
      } catch (reportError) {
        console.log('Failed to generate failure report:', reportError.message);
      }
      
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const orchestrator = new TestOrchestrator();
  orchestrator.run();
}

module.exports = TestOrchestrator;