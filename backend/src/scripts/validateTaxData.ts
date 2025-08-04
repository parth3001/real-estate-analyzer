/**
 * Tax Data Validation Framework
 * 
 * Comprehensive validation system for property tax assessment ratio data
 * Ensures data quality, consistency, and reliability across all sources
 */

import * as dotenv from 'dotenv';
import { TaxAssessmentRatio, ITaxAssessmentRatio } from '../models/TaxAssessmentRatio';
import { assessmentRatioService } from '../services/assessmentRatioService';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';

// Load environment variables
dotenv.config();
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  issues: ValidationIssue[];
  recommendations: string[];
  metadata: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warningRecords: number;
  };
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'major' | 'minor';
  field?: string;
  record?: string;
  message: string;
  suggestion?: string;
}

export interface DataQualityMetrics {
  completeness: number; // Percentage of required fields filled
  accuracy: number; // Percentage of records within expected ranges
  consistency: number; // Percentage of records consistent with peers
  timeliness: number; // Percentage of records that are current
  uniqueness: number; // Percentage of unique records (no duplicates)
}

export class TaxDataValidator {
  private readonly EXPECTED_RANGES = {
    assessmentRatio: { min: 0.01, max: 1.0 },
    dataAge: { maxMonths: 24 }, // Data older than 2 years is considered stale
    stateCount: { min: 25 }, // Minimum number of states for good coverage
    recordsPerState: { min: 1, recommended: 3 }
  };

  private readonly KNOWN_STATE_RATIOS = {
    'TX': { expected: 1.0, tolerance: 0.0 },
    'CA': { expected: 1.0, tolerance: 0.0 },
    'IL': { expected: 0.3333, tolerance: 0.02 },
    'NY': { expected: 0.9, tolerance: 0.1 },
    'FL': { expected: 1.0, tolerance: 0.0 },
    'PA': { expected: 1.0, tolerance: 0.05 },
    'OH': { expected: 0.35, tolerance: 0.05 },
    'GA': { expected: 0.4, tolerance: 0.05 },
    'NC': { expected: 1.0, tolerance: 0.0 },
    'MI': { expected: 0.5, tolerance: 0.05 }
  };

  /**
   * Validate all assessment ratio data in the database
   */
  async validateAllData(): Promise<ValidationResult> {
    // Initialize database connection
    await connectToDatabase();
    logger.info('Starting comprehensive data validation');

    try {
      // Get all assessment ratio records
      const allRatios = await TaxAssessmentRatio.find().sort({ state: 1, county: 1 });
      
      const result: ValidationResult = {
        isValid: true,
        score: 100,
        issues: [],
        recommendations: [],
        metadata: {
          totalRecords: allRatios.length,
          validRecords: 0,
          invalidRecords: 0,
          warningRecords: 0
        }
      };

      if (allRatios.length === 0) {
        result.isValid = false;
        result.score = 0;
        result.issues.push({
          type: 'error',
          severity: 'critical',
          message: 'No assessment ratio data found in database',
          suggestion: 'Run data collection script to populate initial data'
        });
        return result;
      }

      // Perform validation checks
      await this.validateDataCompleteness(allRatios, result);
      await this.validateDataAccuracy(allRatios, result);
      await this.validateDataConsistency(allRatios, result);
      await this.validateDataTimeliness(allRatios, result);
      await this.validateDataUniqueness(allRatios, result);
      await this.validateCoverage(allRatios, result);

      // Calculate final scores and metadata
      this.calculateFinalScore(result);
      this.generateRecommendations(result);

      logger.info('Data validation completed', {
        score: result.score,
        totalIssues: result.issues.length,
        isValid: result.isValid
      });

      return result;

    } catch (error) {
      logger.error('Data validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        score: 0,
        issues: [{
          type: 'error',
          severity: 'critical',
          message: `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check database connectivity and data integrity'
        }],
        recommendations: ['Investigate validation system failure'],
        metadata: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          warningRecords: 0
        }
      };
    }
  }

  /**
   * Validate data for a specific state
   */
  async validateStateData(state: string): Promise<ValidationResult> {
    logger.info('Validating state data', { state });

    try {
      const stateRatios = await TaxAssessmentRatio.find({
        state: state.toUpperCase()
      }).sort({ effectiveDate: -1 });
      
      const result: ValidationResult = {
        isValid: true,
        score: 100,
        issues: [],
        recommendations: [],
        metadata: {
          totalRecords: stateRatios.length,
          validRecords: 0,
          invalidRecords: 0,
          warningRecords: 0
        }
      };

      if (stateRatios.length === 0) {
        result.isValid = false;
        result.score = 0;
        result.issues.push({
          type: 'error',
          severity: 'major',
          message: `No assessment ratio data found for state ${state}`,
          suggestion: `Collect assessment ratio data for ${state}`
        });
        return result;
      }

      // Validate individual records
      for (const ratio of stateRatios) {
        await this.validateSingleRecord(ratio, result);
      }

      // State-specific validations
      await this.validateKnownStateRatio(state, stateRatios, result);

      this.calculateFinalScore(result);
      this.generateStateRecommendations(state, result);

      return result;

    } catch (error) {
      logger.error('State validation failed', {
        state,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        score: 0,
        issues: [{
          type: 'error',
          severity: 'critical',
          message: `State validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        recommendations: [],
        metadata: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          warningRecords: 0
        }
      };
    }
  }

  /**
   * Validate a single assessment ratio record
   */
  async validateSingleRecord(ratio: ITaxAssessmentRatio, result: ValidationResult): Promise<void> {
    const recordId = `${ratio.state}${ratio.county ? `-${ratio.county}` : ''}`;
    let recordValid = true;

    // Validate assessment ratio range
    if (ratio.assessmentRatio < this.EXPECTED_RANGES.assessmentRatio.min || 
        ratio.assessmentRatio > this.EXPECTED_RANGES.assessmentRatio.max) {
      
      result.issues.push({
        type: 'error',
        severity: 'major',
        field: 'assessmentRatio',
        record: recordId,
        message: `Assessment ratio ${ratio.assessmentRatio} is outside valid range (${this.EXPECTED_RANGES.assessmentRatio.min} - ${this.EXPECTED_RANGES.assessmentRatio.max})`,
        suggestion: 'Verify the assessment ratio value against official sources'
      });
      recordValid = false;
    }

    // Validate effective date
    const now = new Date();
    const maxAge = new Date();
    maxAge.setMonth(maxAge.getMonth() - this.EXPECTED_RANGES.dataAge.maxMonths);

    if (ratio.effectiveDate > now) {
      result.issues.push({
        type: 'warning',
        severity: 'minor',
        field: 'effectiveDate',
        record: recordId,
        message: `Effective date ${ratio.effectiveDate.toISOString()} is in the future`,
        suggestion: 'Verify the effective date accuracy'
      });
    }

    if (ratio.lastUpdated < maxAge) {
      result.issues.push({
        type: 'warning',
        severity: 'minor',
        field: 'lastUpdated',
        record: recordId,
        message: `Data is stale (last updated: ${ratio.lastUpdated.toISOString()})`,
        suggestion: 'Consider updating this assessment ratio data'
      });
    }

    // Validate source URL
    if (!ratio.sourceUrl || !this.isValidURL(ratio.sourceUrl)) {
      result.issues.push({
        type: 'warning',
        severity: 'minor',
        field: 'sourceUrl',
        record: recordId,
        message: 'Invalid or missing source URL',
        suggestion: 'Provide a valid source URL for verification'
      });
    }

    // Update counters
    if (recordValid) {
      result.metadata.validRecords++;
    } else {
      result.metadata.invalidRecords++;
    }

    if (result.issues.some(issue => issue.record === recordId && issue.type === 'warning')) {
      result.metadata.warningRecords++;
    }
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport(state?: string): Promise<string> {
    const validation = state ? 
      await this.validateStateData(state) : 
      await this.validateAllData();

    const reportLines: string[] = [
      '# Tax Assessment Ratio Data Validation Report',
      `Generated: ${new Date().toISOString()}`,
      state ? `State: ${state}` : 'Scope: All States',
      '',
      '## Summary',
      `Overall Score: ${validation.score}/100`,
      `Status: ${validation.isValid ? 'VALID' : 'INVALID'}`,
      `Total Records: ${validation.metadata.totalRecords}`,
      `Valid Records: ${validation.metadata.validRecords}`,
      `Invalid Records: ${validation.metadata.invalidRecords}`,
      `Records with Warnings: ${validation.metadata.warningRecords}`,
      ''
    ];

    if (validation.issues.length > 0) {
      reportLines.push('## Issues Found');
      
      const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
      const majorIssues = validation.issues.filter(i => i.severity === 'major');
      const minorIssues = validation.issues.filter(i => i.severity === 'minor');

      if (criticalIssues.length > 0) {
        reportLines.push('### Critical Issues');
        criticalIssues.forEach(issue => {
          reportLines.push(`- **${issue.message}**`);
          if (issue.suggestion) reportLines.push(`  - Suggestion: ${issue.suggestion}`);
        });
        reportLines.push('');
      }

      if (majorIssues.length > 0) {
        reportLines.push('### Major Issues');
        majorIssues.forEach(issue => {
          reportLines.push(`- ${issue.message}`);
          if (issue.suggestion) reportLines.push(`  - Suggestion: ${issue.suggestion}`);
        });
        reportLines.push('');
      }

      if (minorIssues.length > 0) {
        reportLines.push('### Minor Issues');
        minorIssues.forEach(issue => {
          reportLines.push(`- ${issue.message}`);
          if (issue.suggestion) reportLines.push(`  - Suggestion: ${issue.suggestion}`);
        });
        reportLines.push('');
      }
    }

    if (validation.recommendations.length > 0) {
      reportLines.push('## Recommendations');
      validation.recommendations.forEach(rec => {
        reportLines.push(`- ${rec}`);
      });
      reportLines.push('');
    }

    return reportLines.join('\n');
  }

  // Private validation methods

  private async validateDataCompleteness(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    const requiredFields = ['state', 'assessmentRatio', 'effectiveDate', 'source', 'sourceUrl'];
    
    for (const ratio of ratios) {
      for (const field of requiredFields) {
        if (!(ratio as any)[field]) {
          result.issues.push({
            type: 'error',
            severity: 'major',
            field,
            record: `${ratio.state}${ratio.county ? `-${ratio.county}` : ''}`,
            message: `Missing required field: ${field}`,
            suggestion: `Provide value for ${field}`
          });
        }
      }
    }
  }

  private async validateDataAccuracy(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    for (const ratio of ratios) {
      await this.validateSingleRecord(ratio, result);
    }
  }

  private async validateDataConsistency(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    // Check for duplicate records
    const seen = new Set<string>();
    
    for (const ratio of ratios) {
      const key = `${ratio.state}:${ratio.county || 'STATE'}:${ratio.effectiveDate.toISOString()}`;
      
      if (seen.has(key)) {
        result.issues.push({
          type: 'error',
          severity: 'major',
          record: `${ratio.state}${ratio.county ? `-${ratio.county}` : ''}`,
          message: 'Duplicate assessment ratio record found',
          suggestion: 'Remove duplicate records'
        });
      }
      
      seen.add(key);
    }
  }

  private async validateDataTimeliness(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - this.EXPECTED_RANGES.dataAge.maxMonths);

    const staleRecords = ratios.filter(r => r.lastUpdated < cutoffDate);
    
    if (staleRecords.length > 0) {
      result.issues.push({
        type: 'warning',
        severity: 'minor',
        message: `${staleRecords.length} records have stale data (older than ${this.EXPECTED_RANGES.dataAge.maxMonths} months)`,
        suggestion: 'Update stale assessment ratio data'
      });
    }
  }

  private async validateDataUniqueness(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    // This is handled in validateDataConsistency
  }

  private async validateCoverage(ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    const statesWithData = new Set(ratios.map(r => r.state));
    
    if (statesWithData.size < this.EXPECTED_RANGES.stateCount.min) {
      result.issues.push({
        type: 'warning',
        severity: 'major',
        message: `Limited state coverage: ${statesWithData.size} states (recommended: ${this.EXPECTED_RANGES.stateCount.min}+)`,
        suggestion: 'Collect assessment ratio data for more states'
      });
    }
  }

  private async validateKnownStateRatio(state: string, ratios: ITaxAssessmentRatio[], result: ValidationResult): Promise<void> {
    const knownRatio = this.KNOWN_STATE_RATIOS[state as keyof typeof this.KNOWN_STATE_RATIOS];
    
    if (knownRatio) {
      const stateRatio = ratios.find(r => !r.county);
      
      if (stateRatio) {
        const difference = Math.abs(stateRatio.assessmentRatio - knownRatio.expected);
        
        if (difference > knownRatio.tolerance) {
          result.issues.push({
            type: 'warning',
            severity: 'major',
            field: 'assessmentRatio',
            record: state,
            message: `Assessment ratio ${stateRatio.assessmentRatio} differs from known value ${knownRatio.expected} by ${difference.toFixed(4)}`,
            suggestion: 'Verify against official state sources'
          });
        }
      }
    }
  }

  private calculateFinalScore(result: ValidationResult): void {
    let score = 100;
    
    // Deduct points for issues
    for (const issue of result.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 2;
          break;
      }
    }

    result.score = Math.max(0, score);
    result.isValid = result.score >= 70 && !result.issues.some(i => i.severity === 'critical');
  }

  private generateRecommendations(result: ValidationResult): void {
    const recommendations: string[] = [];

    if (result.metadata.invalidRecords > 0) {
      recommendations.push('Review and fix invalid assessment ratio records');
    }

    if (result.metadata.warningRecords > result.metadata.totalRecords * 0.1) {
      recommendations.push('Address warning issues to improve data quality');
    }

    if (result.score < 90) {
      recommendations.push('Implement data quality improvements to achieve excellent score');
    }

    result.recommendations = recommendations;
  }

  private generateStateRecommendations(state: string, result: ValidationResult): void {
    const recommendations: string[] = [];

    if (result.metadata.totalRecords < this.EXPECTED_RANGES.recordsPerState.recommended) {
      recommendations.push(`Collect more assessment ratio data for ${state} (current: ${result.metadata.totalRecords}, recommended: ${this.EXPECTED_RANGES.recordsPerState.recommended}+)`);
    }

    if (result.issues.some(i => i.field === 'sourceUrl')) {
      recommendations.push(`Improve source URL documentation for ${state} records`);
    }

    result.recommendations = recommendations;
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
}

// CLI interface for manual execution
if (require.main === module) {
  const validator = new TaxDataValidator();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'validate-all':
      (async () => {
        try {
          await connectToDatabase();
          const result = await validator.validateAllData();
          console.log('Validation completed:', {
            score: result.score,
            isValid: result.isValid,
            totalIssues: result.issues.length
          });
          process.exit(result.isValid ? 0 : 1);
        } catch (error) {
          console.error('Validation failed:', error);
          process.exit(1);
        }
      })();
      break;

    case 'validate-state':
      const state = args[1];
      if (!state) {
        console.error('Usage: npm run validate-tax-data validate-state <STATE>');
        process.exit(1);
      }
      
      validator.validateStateData(state)
        .then(result => {
          console.log(`State ${state} validation:`, {
            score: result.score,
            isValid: result.isValid,
            totalIssues: result.issues.length
          });
          process.exit(result.isValid ? 0 : 1);
        })
        .catch(error => {
          console.error('State validation failed:', error);
          process.exit(1);
        });
      break;

    case 'generate-report':
      const reportState = args[1];
      validator.generateValidationReport(reportState)
        .then(report => {
          console.log(report);
          process.exit(0);
        })
        .catch(error => {
          console.error('Report generation failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('Available commands:');
      console.log('  validate-all              - Validate all assessment ratio data');
      console.log('  validate-state <STATE>    - Validate data for specific state');
      console.log('  generate-report [STATE]   - Generate validation report');
      break;
  }
}

export default TaxDataValidator;