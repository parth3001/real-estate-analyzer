/**
 * Cypress Plugins Configuration
 *
 * Integrates AI Expert Validation for comprehensive testing
 */

const aiExpertValidation = require('./ai-expert-validation');
const Tier1NPMValidator = require('./tier1-npm-validation');
const Tier2AIValidator = require('./tier2-ai-validation');
const Tier3BiggerPocketsValidator = require('./tier3-biggerpockets-validation');

module.exports = (on, config) => {
  // Register AI Expert Validation tasks
  aiExpertValidation(on, config);

  // Initialize validators
  const npmValidator = new Tier1NPMValidator();
  const aiValidator = new Tier2AIValidator();
  const bpValidator = new Tier3BiggerPocketsValidator();

  // Additional Cypress tasks for enhanced validation
  on('task', {
    // Tier 1: NPM Financial Libraries Validation
    async validateTier1NPM(data) {
      try {
        console.log('🔧 Running Tier 1 NPM Financial Libraries Validation...');
        const results = await npmValidator.validateCalculations(data.propertyData, data.backendResults);
        console.log(`📊 NPM Validation: ${results.summary.successRate.toFixed(1)}% success rate`);
        return results;
      } catch (error) {
        console.error('❌ Tier 1 NPM Validation Error:', error.message);
        return {
          tier: 'NPM Financial Libraries',
          error: error.message,
          validations: [],
          summary: { successRate: 0, errors: 1 }
        };
      }
    },

    // Tier 2: AI Independent Calculation Validation
    async validateTier2AI(data) {
      try {
        console.log('🤖 Running Tier 2 AI Independent Calculation Validation...');
        const results = await aiValidator.validateAllMetrics(data.propertyInputs, data.ourCalculations);
        console.log(`🤖 AI Validation: ${results.summary.successRate.toFixed(1)}% success rate (${results.totalMetricsValidated} metrics)`);

        if (results.summary.criticalFailures > 0) {
          console.warn(`⚠️ ${results.summary.criticalFailures} critical discrepancies found!`);
        }

        return results;
      } catch (error) {
        console.error('❌ Tier 2 AI Validation Error:', error.message);
        return {
          tier: 'AI Independent Calculation',
          error: error.message,
          validations: [],
          summary: { successRate: 0, errors: 1 }
        };
      }
    },

    // Tier 3: BiggerPockets API Cross-Reference
    async validateTier3BiggerPockets(data) {
      try {
        console.log('🏢 Running Tier 3 BiggerPockets API Cross-Reference...');
        const results = await bpValidator.validateAgainstBiggerPockets(data.propertyData, data.ourResults);
        console.log(`🏢 BP Validation: ${results.summary.successRate.toFixed(1)}% success rate (${results.validations.length} core metrics)`);

        if (results.status === 'FALLBACK_MODE') {
          console.warn('⚠️ BiggerPockets API not available, using simulated calculations');
        }

        return results;
      } catch (error) {
        console.error('❌ Tier 3 BiggerPockets Validation Error:', error.message);
        return {
          tier: 'BiggerPockets API',
          error: error.message,
          validations: [],
          summary: { successRate: 0, errors: 1 }
        };
      }
    },

    // Log detailed validation results
    logValidationResults(results) {
      console.log('\n🔍 COMPREHENSIVE VALIDATION RESULTS');
      console.log('=====================================');

      if (results.uiValidation) {
        console.log('\n✅ UI-Backend Validation:');
        console.log(`   Metrics Validated: ${results.uiValidation.metricsCount}`);
        console.log(`   Discrepancies: ${results.uiValidation.discrepancies?.length || 0}`);
      }

      if (results.aiValidation) {
        console.log('\n🤖 AI Expert Validation:');
        console.log(`   Expert Consensus: ${(results.aiValidation.overallConfidence * 100).toFixed(1)}%`);
        console.log(`   Recommendation: ${results.aiValidation.recommendation}`);

        if (results.aiValidation.discrepancies?.length > 0) {
          console.log('\n⚠️  Flagged Discrepancies:');
          results.aiValidation.discrepancies.forEach((disc, index) => {
            console.log(`   ${index + 1}. ${disc.metric}: ${disc.severity} severity`);
            console.log(`      Agreement: ${(disc.agreement * 100).toFixed(1)}%`);
          });
        }
      }

      console.log('\n=====================================\n');
      return null;
    },

    // Generate validation report
    generateValidationReport(data) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = `cypress/reports/validation-report-${timestamp}.json`;

      const report = {
        timestamp: new Date().toISOString(),
        property: data.propertyData,
        backendCalculations: data.calculatedMetrics,
        uiValidation: data.uiResults,
        aiExpertValidation: data.aiResults,
        summary: {
          overallStatus: this.determineOverallStatus(data),
          criticalIssues: this.findCriticalIssues(data),
          recommendations: this.generateRecommendations(data)
        }
      };

      // In a real implementation, you'd write this to a file
      console.log(`📄 Validation report generated: ${reportPath}`);
      return report;
    },

    // Check for critical calculation errors
    validateCriticalMetrics(metrics) {
      const critical = [];

      // Check for NaN or Infinity values
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (isNaN(value)) {
            critical.push(`${key}: NaN value detected`);
          }
          if (!isFinite(value)) {
            critical.push(`${key}: Infinity value detected`);
          }
        }
      });

      // Check for unrealistic values
      if (metrics.capRate && (metrics.capRate < 0 || metrics.capRate > 50)) {
        critical.push(`Cap Rate: ${metrics.capRate}% is outside realistic range (0-50%)`);
      }

      if (metrics.cashOnCashReturn && (metrics.cashOnCashReturn < -100 || metrics.cashOnCashReturn > 100)) {
        critical.push(`Cash-on-Cash Return: ${metrics.cashOnCashReturn}% is outside realistic range (-100% to 100%)`);
      }

      if (metrics.irr && (metrics.irr < -50 || metrics.irr > 100)) {
        critical.push(`IRR: ${metrics.irr}% is outside realistic range (-50% to 100%)`);
      }

      return critical.length > 0 ? critical : null;
    }
  });

  return config;
};