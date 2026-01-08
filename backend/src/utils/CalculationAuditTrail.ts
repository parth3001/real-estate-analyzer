/**
 * Calculation Audit Trail - Transparency and Debugging System
 *
 * Provides comprehensive audit trail for financial calculations:
 * - Step-by-step calculation logging
 * - Intermediate result tracking
 * - Validation result capture
 * - Replay capability for debugging
 * - Performance metrics
 *
 * Principal Software Architect: This ensures full transparency
 * and enables debugging when calculations seem incorrect
 */

import { logger } from './logger';
import type { ValidationResult } from './FinancialValidator';

export interface CalculationStep {
  stepNumber: number;
  stepName: string;
  description: string;
  inputs: Record<string, any>;
  calculation: string; // Human-readable formula
  result: number | Record<string, any> | any;
  timestamp: Date;
  executionTimeMs?: number;
  warnings?: string[];
}

export interface CalculationContext {
  calculationType: 'tax_analysis' | 'irr' | 'financial_metrics' | 'investment_decision';
  userId?: string;
  propertyId?: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalExecutionTimeMs?: number;
}

export interface AuditTrailRecord {
  id: string;
  context: CalculationContext;
  steps: CalculationStep[];
  validationResults: ValidationResult[];
  finalResults: Record<string, any>;
  metadata: {
    nodeEnv: string;
    version: string;
    inputs: Record<string, any>;
  };
}

export class CalculationAuditTrail {
  private static instance: CalculationAuditTrail;
  private auditRecords: Map<string, AuditTrailRecord> = new Map();
  private currentSession: string | null = null;
  private steps: CalculationStep[] = [];
  private context: CalculationContext | null = null;

  static getInstance(): CalculationAuditTrail {
    if (!CalculationAuditTrail.instance) {
      CalculationAuditTrail.instance = new CalculationAuditTrail();
    }
    return CalculationAuditTrail.instance;
  }

  /**
   * Start a new calculation audit session
   */
  startSession(context: CalculationContext): string {
    const sessionId = context.sessionId || this.generateSessionId();
    this.currentSession = sessionId;
    this.context = { ...context, sessionId };
    this.steps = [];

    logger.info('Started calculation audit session', {
      sessionId,
      calculationType: context.calculationType,
      userId: context.userId,
      propertyId: context.propertyId
    });

    return sessionId;
  }

  /**
   * Log a calculation step with full context
   */
  logStep(
    stepName: string,
    description: string,
    inputs: Record<string, any>,
    calculation: string,
    result: number | Record<string, number>,
    warnings?: string[]
  ): void {
    if (!this.currentSession) {
      logger.warn('Attempted to log step without active session');
      return;
    }

    const stepStart = Date.now();
    const step: CalculationStep = {
      stepNumber: this.steps.length + 1,
      stepName,
      description,
      inputs: { ...inputs }, // Deep copy to prevent mutations
      calculation,
      result,
      timestamp: new Date(),
      warnings: warnings || []
    };

    // Calculate execution time if this is within a timed operation
    const executionTime = Date.now() - stepStart;
    if (executionTime > 1) {
      step.executionTimeMs = executionTime;
    }

    this.steps.push(step);

    // Log significant steps or warnings
    if (warnings?.length || executionTime > 10) {
      logger.debug('Calculation step logged', {
        sessionId: this.currentSession,
        stepName,
        executionTime,
        warnings,
        result: typeof result === 'object' ? JSON.stringify(result) : result
      });
    }
  }

  /**
   * Log validation results for the current session
   */
  logValidation(validation: ValidationResult, context: string): void {
    if (!this.currentSession) {
      logger.warn('Attempted to log validation without active session');
      return;
    }

    if (!validation.isValid) {
      logger.warn('Validation failed during calculation', {
        sessionId: this.currentSession,
        context,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Store validation in current session context
    if (this.context) {
      // We'll store validations when ending the session
    }
  }

  /**
   * End calculation session and store complete audit record
   */
  endSession(finalResults: Record<string, any>, validationResults: ValidationResult[] = []): AuditTrailRecord | null {
    if (!this.currentSession || !this.context) {
      logger.warn('Attempted to end session without active session');
      return null;
    }

    const endTime = new Date();
    const totalExecutionTime = endTime.getTime() - this.context.startTime.getTime();

    const auditRecord: AuditTrailRecord = {
      id: this.currentSession,
      context: {
        ...this.context,
        endTime,
        totalExecutionTimeMs: totalExecutionTime
      },
      steps: [...this.steps], // Copy steps
      validationResults,
      finalResults: { ...finalResults },
      metadata: {
        nodeEnv: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        inputs: this.getSessionInputs()
      }
    };

    // Store audit record (in production, this would go to database)
    this.auditRecords.set(this.currentSession, auditRecord);

    // Log completion
    logger.info('Calculation audit session completed', {
      sessionId: this.currentSession,
      calculationType: this.context.calculationType,
      totalSteps: this.steps.length,
      totalExecutionTimeMs: totalExecutionTime,
      validationsPassed: validationResults.filter(v => v.isValid).length,
      validationsFailed: validationResults.filter(v => !v.isValid).length
    });

    // Clean up current session
    const completedRecord = auditRecord;
    this.currentSession = null;
    this.context = null;
    this.steps = [];

    return completedRecord;
  }

  /**
   * Get audit record for replay/debugging
   */
  getAuditRecord(sessionId: string): AuditTrailRecord | null {
    return this.auditRecords.get(sessionId) || null;
  }

  /**
   * Generate calculation replay for debugging
   */
  generateReplay(sessionId: string): string | null {
    const record = this.getAuditRecord(sessionId);
    if (!record) return null;

    let replay = `CALCULATION REPLAY - ${record.context.calculationType.toUpperCase()}\n`;
    replay += `Session: ${sessionId}\n`;
    replay += `Started: ${record.context.startTime.toISOString()}\n`;
    replay += `Duration: ${record.context.totalExecutionTimeMs}ms\n\n`;

    replay += `INPUTS:\n`;
    Object.entries(record.metadata.inputs).forEach(([key, value]) => {
      replay += `  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
    });

    replay += `\nCALCULATION STEPS:\n`;
    record.steps.forEach(step => {
      replay += `\n${step.stepNumber}. ${step.stepName}\n`;
      replay += `   Description: ${step.description}\n`;
      replay += `   Formula: ${step.calculation}\n`;

      replay += `   Inputs: `;
      Object.entries(step.inputs).forEach(([key, value]) => {
        replay += `${key}=${value} `;
      });

      replay += `\n   Result: ${typeof step.result === 'object' ? JSON.stringify(step.result) : step.result}\n`;

      if (step.warnings?.length) {
        replay += `   Warnings: ${step.warnings.join(', ')}\n`;
      }
    });

    replay += `\nVALIDATION RESULTS:\n`;
    record.validationResults.forEach((validation, index) => {
      replay += `  ${index + 1}. Valid: ${validation.isValid}\n`;
      if (validation.errors.length) {
        replay += `     Errors: ${validation.errors.join(', ')}\n`;
      }
      if (validation.warnings.length) {
        replay += `     Warnings: ${validation.warnings.join(', ')}\n`;
      }
    });

    replay += `\nFINAL RESULTS:\n`;
    Object.entries(record.finalResults).forEach(([key, value]) => {
      replay += `  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
    });

    return replay;
  }

  /**
   * Get performance metrics for a calculation type
   */
  getPerformanceMetrics(calculationType?: string): {
    averageExecutionTime: number;
    totalCalculations: number;
    successRate: number;
    commonWarnings: string[];
  } {
    const relevantRecords = Array.from(this.auditRecords.values())
      .filter(record => !calculationType || record.context.calculationType === calculationType);

    const totalCalculations = relevantRecords.length;
    const averageExecutionTime = totalCalculations > 0
      ? relevantRecords.reduce((sum, record) => sum + (record.context.totalExecutionTimeMs || 0), 0) / totalCalculations
      : 0;

    const successfulCalculations = relevantRecords.filter(record =>
      record.validationResults.every(validation => validation.isValid)
    ).length;
    const successRate = totalCalculations > 0 ? successfulCalculations / totalCalculations : 0;

    // Collect common warnings
    const allWarnings = relevantRecords.flatMap(record =>
      record.validationResults.flatMap(validation => validation.warnings)
    );
    const warningCounts = allWarnings.reduce((counts, warning) => {
      counts[warning] = (counts[warning] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const commonWarnings = Object.entries(warningCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([warning]) => warning);

    return {
      averageExecutionTime,
      totalCalculations,
      successRate,
      commonWarnings
    };
  }

  private generateSessionId(): string {
    return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionInputs(): Record<string, any> {
    if (!this.steps.length) return {};

    // Collect all unique inputs from the first few steps
    const inputs: Record<string, any> = {};
    this.steps.slice(0, 3).forEach(step => {
      Object.entries(step.inputs).forEach(([key, value]) => {
        if (!inputs.hasOwnProperty(key)) {
          inputs[key] = value;
        }
      });
    });

    return inputs;
  }
}

/**
 * Convenience function to create and use audit trail in a single operation
 */
export function withAuditTrail<T>(
  calculationType: CalculationContext['calculationType'],
  propertyId: string | undefined,
  calculation: (audit: CalculationAuditTrail) => T,
  validations: ValidationResult[] = []
): { result: T; auditRecord: AuditTrailRecord | null } {
  const audit = CalculationAuditTrail.getInstance();

  const sessionId = audit.startSession({
    calculationType,
    propertyId,
    sessionId: `${calculationType}_${Date.now()}`,
    startTime: new Date()
  });

  try {
    const result = calculation(audit);
    const auditRecord = audit.endSession({ result }, validations);
    return { result, auditRecord };
  } catch (error) {
    logger.error('Calculation failed with audit trail', {
      sessionId,
      calculationType,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const auditRecord = audit.endSession({ error: error instanceof Error ? error.message : 'Unknown error' }, validations);
    throw error;
  }
}