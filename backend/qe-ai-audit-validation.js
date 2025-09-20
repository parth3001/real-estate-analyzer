/**
 * QE Engineer: Independent AI Audit Validation Script
 *
 * This script validates Investment Decision Engine output against
 * industry standards and mathematical accuracy requirements.
 */

const fs = require('fs');
const path = require('path');

class QEAuditValidator {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      validationTests: [],
      overallStatus: 'PENDING',
      criticalIssues: [],
      recommendations: []
    };
  }

  // Load Investment Decision Engine data
  loadEngineData(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.addCriticalIssue(`Failed to load data: ${error.message}`);
      return null;
    }
  }

  // Validate financial calculations
  validateFinancialAccuracy(data) {
    const test = {
      testName: 'Financial Calculation Accuracy',
      status: 'PASS',
      details: [],
      issues: []
    };

    const { property, financialMetrics } = data;
    const { purchasePrice, downPayment, interestRate, loanTerm } = property;
    const { capRate, monthlyCashFlow, monthlyRent, dscr } = financialMetrics;

    // 1. Validate Cap Rate calculation
    if (capRate) {
      const loanAmount = purchasePrice * (1 - downPayment / 100);
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;
      const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                            (Math.pow(1 + monthlyRate, numPayments) - 1);

      // Estimated annual expenses (rough validation)
      const estimatedAnnualExpenses = purchasePrice * 0.012; // ~1.2% of property value
      const estimatedAnnualDebtService = monthlyPayment * 12;
      const estimatedNOI = (monthlyRent * 12) - estimatedAnnualExpenses;
      const calculatedCapRate = (estimatedNOI / purchasePrice) * 100;

      if (Math.abs(capRate - calculatedCapRate) > 2.0) {
        test.issues.push(`Cap rate ${capRate}% seems inconsistent with calculated ${calculatedCapRate.toFixed(1)}%`);
        test.status = 'WARNING';
      } else {
        test.details.push(`Cap rate ${capRate}% validated within acceptable range`);
      }
    }

    // 2. Validate Cash Flow reasonableness
    if (monthlyCashFlow && monthlyRent) {
      const cashFlowRatio = monthlyCashFlow / monthlyRent;
      if (cashFlowRatio > 0.5) {
        test.issues.push(`Cash flow ratio ${(cashFlowRatio * 100).toFixed(1)}% unusually high - may indicate underestimated expenses`);
        test.status = 'WARNING';
      } else if (cashFlowRatio < -0.1) {
        test.issues.push(`Significant negative cash flow ${monthlyCashFlow} may not align with positive verdict`);
        test.status = 'FAIL';
      } else {
        test.details.push(`Cash flow ratio ${(cashFlowRatio * 100).toFixed(1)}% within reasonable range`);
      }
    }

    // 3. Validate DSCR
    if (dscr) {
      if (dscr < 1.0) {
        test.issues.push(`DSCR ${dscr} below 1.0 indicates insufficient income to cover debt service`);
        test.status = 'FAIL';
      } else if (dscr < 1.2) {
        test.issues.push(`DSCR ${dscr} below 1.2 indicates tight cash flow margin`);
        test.status = 'WARNING';
      } else {
        test.details.push(`DSCR ${dscr} indicates healthy debt coverage`);
      }
    }

    this.auditResults.validationTests.push(test);
    return test;
  }

  // Validate verdict logic
  validateVerdictLogic(data) {
    const test = {
      testName: 'Investment Verdict Logic',
      status: 'PASS',
      details: [],
      issues: []
    };

    const { verdict, dealQualityScore, financialMetrics, investorProfile } = data;

    // 1. Score-verdict alignment
    if (dealQualityScore >= 80) {
      if (verdict !== 'BUY' && verdict !== 'STRONG BUY') {
        test.issues.push(`High score ${dealQualityScore} should typically result in BUY verdict, not ${verdict}`);
        test.status = 'WARNING';
      }
    } else if (dealQualityScore >= 60) {
      if (!['BUY', 'NEGOTIATE', 'CAUTION'].includes(verdict)) {
        test.issues.push(`Moderate score ${dealQualityScore} should not result in PASS verdict`);
        test.status = 'FAIL';
      }
    } else if (dealQualityScore < 40) {
      if (verdict !== 'PASS') {
        test.issues.push(`Low score ${dealQualityScore} should typically result in PASS verdict`);
        test.status = 'WARNING';
      }
    }

    // 2. Risk tolerance alignment
    if (investorProfile.riskTolerance === 'High' && verdict === 'PASS' && dealQualityScore > 50) {
      test.issues.push(`Aggressive investor should rarely PASS on deals scoring ${dealQualityScore}`);
      test.status = 'WARNING';
    }

    // 3. Cash flow and verdict consistency
    if (financialMetrics.monthlyCashFlow < -200 && ['BUY', 'STRONG BUY'].includes(verdict)) {
      test.issues.push(`Significant negative cash flow conflicts with positive verdict`);
      test.status = 'FAIL';
    }

    if (test.issues.length === 0) {
      test.details.push(`Verdict ${verdict} logically consistent with score ${dealQualityScore} and ${investorProfile.riskTolerance} risk tolerance`);
    }

    this.auditResults.validationTests.push(test);
    return test;
  }

  // Validate market context reasonableness
  validateMarketContext(data) {
    const test = {
      testName: 'Market Context Validation',
      status: 'PASS',
      details: [],
      issues: []
    };

    const { property, financialMetrics } = data;
    const { capRate, monthlyRent } = financialMetrics;

    // 1. Cap rate market reasonableness (Texas residential typically 4-10%)
    if (capRate) {
      if (capRate > 12) {
        test.issues.push(`Cap rate ${capRate}% unusually high for residential real estate`);
        test.status = 'WARNING';
      } else if (capRate < 3) {
        test.issues.push(`Cap rate ${capRate}% unusually low, may indicate overpriced property`);
        test.status = 'WARNING';
      } else {
        test.details.push(`Cap rate ${capRate}% within reasonable market range`);
      }
    }

    // 2. Rent reasonableness (rough validation for Anna, TX market)
    if (monthlyRent && property.bedrooms) {
      const rentPerBedroom = monthlyRent / property.bedrooms;
      if (rentPerBedroom > 1000) {
        test.issues.push(`Rent $${rentPerBedroom}/bedroom seems high for Anna, TX market`);
        test.status = 'WARNING';
      } else if (rentPerBedroom < 300) {
        test.issues.push(`Rent $${rentPerBedroom}/bedroom seems low, may indicate data error`);
        test.status = 'WARNING';
      } else {
        test.details.push(`Rent $${rentPerBedroom}/bedroom within reasonable range for market`);
      }
    }

    this.auditResults.validationTests.push(test);
    return test;
  }

  // Validate strategy adaptation
  validateStrategyAdaptation(data) {
    const test = {
      testName: 'Investment Strategy Adaptation',
      status: 'PASS',
      details: [],
      issues: []
    };

    const { investorProfile, verdict, financialMetrics } = data;

    if (investorProfile.strategy === 'Aggressive') {
      // Aggressive investors should accept higher risk for higher returns
      if (financialMetrics.irr && financialMetrics.irr < 8 && verdict === 'BUY') {
        test.issues.push(`Low IRR ${financialMetrics.irr}% may not align with aggressive growth strategy`);
        test.status = 'WARNING';
      }

      // Should prioritize wealth building metrics
      if (investorProfile.investmentGoal === 'Wealth Building' && financialMetrics.capRate < 5) {
        test.issues.push(`Low cap rate may not support wealth building objective for aggressive investor`);
        test.status = 'WARNING';
      }

      test.details.push(`Strategy adaptation appropriate for ${investorProfile.strategy} investor profile`);
    }

    this.auditResults.validationTests.push(test);
    return test;
  }

  // Add critical issue
  addCriticalIssue(issue) {
    this.auditResults.criticalIssues.push(issue);
  }

  // Add recommendation
  addRecommendation(recommendation) {
    this.auditResults.recommendations.push(recommendation);
  }

  // Generate final audit report
  generateAuditReport() {
    const failedTests = this.auditResults.validationTests.filter(t => t.status === 'FAIL');
    const warningTests = this.auditResults.validationTests.filter(t => t.status === 'WARNING');

    if (failedTests.length > 0) {
      this.auditResults.overallStatus = 'FAIL';
    } else if (warningTests.length > 0) {
      this.auditResults.overallStatus = 'WARNING';
    } else {
      this.auditResults.overallStatus = 'PASS';
    }

    // Generate recommendations
    if (failedTests.length > 0) {
      this.addRecommendation('Address critical calculation errors before production deployment');
    }
    if (warningTests.length > 0) {
      this.addRecommendation('Review warning-level issues for potential improvements');
    }
    this.addRecommendation('Consider expanding validation with larger dataset of properties');
    this.addRecommendation('Implement automated regression testing for financial calculations');

    return this.auditResults;
  }

  // Run complete audit
  runCompleteAudit(dataFilePath) {
    console.log('🔬 QE Engineer: Starting Independent AI Audit Validation');
    console.log('================================================================');

    const data = this.loadEngineData(dataFilePath);
    if (!data) {
      return this.generateAuditReport();
    }

    console.log(`📊 Auditing property: ${data.property?.address || 'Unknown'}`);
    console.log(`🎯 Engine verdict: ${data.verdict || 'Not found'}`);
    console.log(`🏆 Deal quality score: ${data.dealQualityScore || 'Not found'}/100`);
    console.log('================================================================');

    // Run validation tests
    this.validateFinancialAccuracy(data);
    this.validateVerdictLogic(data);
    this.validateMarketContext(data);
    this.validateStrategyAdaptation(data);

    const report = this.generateAuditReport();

    // Output results
    console.log('📋 AUDIT RESULTS:');
    report.validationTests.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${status} ${test.testName}: ${test.status}`);
      test.details.forEach(detail => console.log(`    ✓ ${detail}`));
      test.issues.forEach(issue => console.log(`    ⚠ ${issue}`));
    });

    const failedTests = report.validationTests.filter(t => t.status === 'FAIL');
    const warningTests = report.validationTests.filter(t => t.status === 'WARNING');

    console.log('================================================================');
    console.log(`🎯 OVERALL STATUS: ${report.overallStatus}`);
    console.log(`📊 Tests: ${report.validationTests.length} total, ${failedTests.length} failed, ${warningTests.length} warnings`);

    if (report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`    • ${rec}`));
    }

    console.log('================================================================');

    return report;
  }
}

// Main execution
if (require.main === module) {
  const validator = new QEAuditValidator();
  const dataPath = path.join(__dirname, '../cypress/fixtures/simulated-investment-engine-data.json');

  const auditReport = validator.runCompleteAudit(dataPath);

  // Save audit report
  const reportPath = path.join(__dirname, '../cypress/fixtures/qe-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`💾 Audit report saved to: ${reportPath}`);
}

module.exports = QEAuditValidator;