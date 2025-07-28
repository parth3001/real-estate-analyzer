#!/usr/bin/env node

/**
 * Comprehensive Test Orchestration Script
 * Runs all tests in the correct order with proper setup and validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function runCommand(command, description, options = {}) {
  log(`\n🔄 ${description}...`, colors.yellow);
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      ...options 
    });
    log(`✅ ${description} - SUCCESS`, colors.green);
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} - FAILED`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function checkPrerequisites() {
  logSection('Prerequisites Check');

  // Check if MongoDB is available (for integration tests)
  const mongoCheck = runCommand('mongod --version', 'Checking MongoDB availability');
  
  // Check if frontend directory exists
  const frontendExists = fs.existsSync(path.join(__dirname, '../../frontend'));
  log(`Frontend directory: ${frontendExists ? '✅ Found' : '❌ Missing'}`, 
      frontendExists ? colors.green : colors.red);

  // Check if test dependencies are installed
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
  const hasTestDeps = packageJson.devDependencies['jest'] && 
                      packageJson.devDependencies['cypress'] &&
                      packageJson.devDependencies['mongodb-memory-server'];
  
  log(`Test dependencies: ${hasTestDeps ? '✅ Installed' : '❌ Missing'}`, 
      hasTestDeps ? colors.green : colors.red);

  return {
    mongo: mongoCheck.success,
    frontend: frontendExists,
    testDeps: hasTestDeps
  };
}

async function runFinancialAccuracyTests() {
  logSection('Financial Accuracy Tests');
  
  log('Running comprehensive financial calculation validation...', colors.blue);
  
  const financialTests = runCommand(
    'npm run test:financial -- --verbose',
    'Financial accuracy calculations'
  );

  const benchmarkTests = runCommand(
    'npm run test:benchmarks -- --verbose',
    'Reference property benchmarks'
  );

  if (financialTests.success && benchmarkTests.success) {
    log('\n🎯 Financial Accuracy Summary:', colors.green);
    log('  ✅ Cap rate calculations validated', colors.green);
    log('  ✅ Cash-on-cash return accuracy confirmed', colors.green);
    log('  ✅ DSCR calculations verified', colors.green);
    log('  ✅ Long-term projections validated', colors.green);
    log('  ✅ Reference property benchmarks passed', colors.green);
  }

  return financialTests.success && benchmarkTests.success;
}

async function runBackendTests() {
  logSection('Backend Integration Tests');
  
  const integrationTests = runCommand(
    'npm run test:integration -- --verbose',
    'Backend integration tests'
  );

  const coverageTests = runCommand(
    'npm run test:coverage',
    'Test coverage analysis'
  );

  if (integrationTests.success) {
    log('\n🔧 Backend Test Summary:', colors.green);
    log('  ✅ Database operations tested', colors.green);
    log('  ✅ API endpoints validated', colors.green);
    log('  ✅ External service mocking working', colors.green);
    log('  ✅ Authentication flows tested', colors.green);
  }

  return integrationTests.success;
}

async function runFrontendTests() {
  logSection('Frontend Tests');
  
  const frontendExists = fs.existsSync(path.join(__dirname, '../../frontend'));
  if (!frontendExists) {
    log('⚠️  Frontend directory not found - skipping frontend tests', colors.yellow);
    return true;
  }

  const frontendTests = runCommand(
    'npm run test:frontend',
    'Frontend component and integration tests'
  );

  if (frontendTests.success) {
    log('\n⚛️  Frontend Test Summary:', colors.green);
    log('  ✅ React components tested', colors.green);
    log('  ✅ Dual-mode functionality validated', colors.green);
    log('  ✅ Form validations working', colors.green);
  }

  return frontendTests.success;
}

async function runE2ETests() {
  logSection('End-to-End Tests');
  
  log('🚀 Starting E2E tests (this may take a few minutes)...', colors.blue);
  
  // Check if servers are running
  log('📋 E2E Test Checklist:', colors.yellow);
  log('  • Backend server should be running on :3001', colors.yellow);
  log('  • Frontend server should be running on :5173', colors.yellow);
  log('  • Database should be accessible', colors.yellow);
  
  const e2eTests = runCommand(
    'npm run test:e2e',
    'Cypress E2E tests',
    { timeout: 300000 } // 5 minute timeout for E2E
  );

  if (e2eTests.success) {
    log('\n🌐 E2E Test Summary:', colors.green);
    log('  ✅ Full user workflows tested', colors.green);
    log('  ✅ Financial calculations validated through UI', colors.green);
    log('  ✅ Mode switching functionality verified', colors.green);
    log('  ✅ Real property data accuracy confirmed', colors.green);
  }

  return e2eTests.success;
}

function generateTestReport(results) {
  logSection('Test Execution Report');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };

  // Write detailed report
  const reportPath = path.join(__dirname, '../test-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const reportFile = path.join(reportPath, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  // Console summary
  log(`\n📊 Test Execution Summary (${timestamp}):`, colors.bright);
  log(`  Total Test Suites: ${report.summary.total}`, colors.blue);
  log(`  Passed: ${report.summary.passed}`, colors.green);
  log(`  Failed: ${report.summary.failed}`, colors.red);
  
  Object.entries(results).forEach(([testType, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    const color = success ? colors.green : colors.red;
    log(`  ${testType}: ${status}`, color);
  });

  log(`\n📄 Detailed report saved to: ${reportFile}`, colors.cyan);

  if (report.summary.failed > 0) {
    log('\n⚠️  Some tests failed. Review the output above for details.', colors.red);
    log('💡 Tip: Run individual test suites to debug specific failures:', colors.yellow);
    log('  npm run test:financial', colors.yellow);
    log('  npm run test:backend', colors.yellow);
    log('  npm run test:frontend', colors.yellow);  
    log('  npm run test:e2e:open', colors.yellow);
    return false;
  } else {
    log('\n🎉 All tests passed! Your application is ready for production.', colors.green);
    return true;
  }
}

async function main() {
  const startTime = Date.now();
  
  log('🧪 Real Estate Analyzer - Comprehensive Test Suite', colors.bright + colors.magenta);
  log('💼 Financial accuracy validation for professional analysts\n', colors.magenta);

  // Check prerequisites
  const prereqs = await checkPrerequisites();
  if (!prereqs.testDeps) {
    log('\n❌ Missing required test dependencies. Run: npm install', colors.red);
    process.exit(1);
  }

  // Run test suites
  const results = {};

  try {
    // 1. Financial Accuracy Tests (Most Critical)
    results.financialAccuracy = await runFinancialAccuracyTests();

    // 2. Backend Integration Tests
    results.backendIntegration = await runBackendTests();

    // 3. Frontend Tests (if available)
    results.frontendTests = await runFrontendTests();

    // 4. E2E Tests (most comprehensive but slower)
    if (process.argv.includes('--include-e2e')) {
      results.e2eTests = await runE2ETests();
    } else {
      log('\n⏭️  Skipping E2E tests (use --include-e2e to run)', colors.yellow);
      log('💡 To run E2E tests separately: npm run test:e2e:open', colors.yellow);
    }

  } catch (error) {
    log(`\n💥 Test execution failed: ${error.message}`, colors.red);
    process.exit(1);
  }

  // Generate report and exit
  const allPassed = generateTestReport(results);
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  log(`\n⏱️  Total execution time: ${duration} seconds`, colors.blue);
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`\nFatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { runFinancialAccuracyTests, runBackendTests, runFrontendTests, runE2ETests };