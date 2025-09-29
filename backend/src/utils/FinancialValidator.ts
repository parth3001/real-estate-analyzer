/**
 * Financial Validation Layer - Architectural Safeguard
 * Prevents impossible financial calculations from reaching users
 *
 * As Principal Software Architect: This layer ensures data integrity
 * and prevents calculation errors from destroying user trust
 */

import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TaxValidationData {
  taxSavings: number;
  year1Tax: number;
  optimalTax: number;
  holdPeriod: number;
  afterTaxIRR: number;
  pretaxIRR: number;
}

export interface IRRValidationData {
  irr: number;
  holdPeriod: number;
  cashFlows: number[];
  initialInvestment: number;
}

export class FinancialValidator {
  private static readonly IRR_REASONABLE_RANGE = {
    min: -0.50, // -50% (complete loss scenarios)
    max: 0.50   // 50% (exceptional returns)
  };

  private static readonly TAX_SAVINGS_THRESHOLD = {
    minReasonable: -50000,  // Negative "savings" ok when property appreciation outweighs tax timing benefits
    maxReasonable: 100000   // $100k max reasonable savings
  };

  /**
   * Validate Tax Calculation Results
   */
  static validateTaxCalculation(data: TaxValidationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Tax savings validation with context-aware logic
    if (data.taxSavings < this.TAX_SAVINGS_THRESHOLD.minReasonable) {
      errors.push(`Extreme tax savings value: $${data.taxSavings.toLocaleString()}. Value outside reasonable range (${this.TAX_SAVINGS_THRESHOLD.minReasonable} to ${this.TAX_SAVINGS_THRESHOLD.maxReasonable}).`);
    }

    // 1a. Add context for negative tax savings (common with appreciating properties)
    if (data.holdPeriod > 1 && data.taxSavings < -5000) {
      warnings.push(`Negative tax savings ($${data.taxSavings.toLocaleString()}) - longer hold period results in higher total taxes due to property appreciation and accumulated depreciation. This may still be optimal for after-tax returns.`);
    }

    // 2. Year 1 vs optimal tax comparison with appreciation context
    if (data.holdPeriod > 1 && data.year1Tax < data.optimalTax) {
      const taxDifference = data.optimalTax - data.year1Tax;
      if (taxDifference > data.year1Tax * 2) {
        // Only flag as potential error if optimal tax is >2x year 1 tax (extreme case)
        warnings.push(`Optimal period tax ($${data.optimalTax.toLocaleString()}) significantly higher than year 1 tax ($${data.year1Tax.toLocaleString()}). This can occur with high property appreciation and accumulated depreciation.`);
      }
    }

    // 3. After-tax IRR should be lower than pre-tax IRR
    if (data.afterTaxIRR > data.pretaxIRR) {
      errors.push(`After-tax IRR (${(data.afterTaxIRR * 100).toFixed(1)}%) cannot exceed pre-tax IRR (${(data.pretaxIRR * 100).toFixed(1)}%)`);
    }

    // 4. IRR values should be reasonable
    const irrValidation = this.validateIRR({
      irr: data.afterTaxIRR,
      holdPeriod: data.holdPeriod,
      cashFlows: [], // Not available in this context
      initialInvestment: 0
    });
    errors.push(...irrValidation.errors);
    warnings.push(...irrValidation.warnings);

    // 5. Tax savings magnitude check
    if (Math.abs(data.taxSavings) > this.TAX_SAVINGS_THRESHOLD.maxReasonable) {
      warnings.push(`Very large tax savings: $${data.taxSavings.toLocaleString()}. Verify calculation inputs.`);
    }

    if (errors.length > 0) {
      logger.error('Tax calculation validation failed', {
        data,
        errors,
        warnings
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate IRR Calculation Results
   */
  static validateIRR(data: IRRValidationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. IRR should be within reasonable range
    if (data.irr < this.IRR_REASONABLE_RANGE.min) {
      errors.push(`IRR too low: ${(data.irr * 100).toFixed(1)}%. Below reasonable minimum of ${this.IRR_REASONABLE_RANGE.min * 100}%`);
    }

    if (data.irr > this.IRR_REASONABLE_RANGE.max) {
      errors.push(`IRR too high: ${(data.irr * 100).toFixed(1)}%. Above reasonable maximum of ${this.IRR_REASONABLE_RANGE.max * 100}%`);
    }

    // 2. Check for calculation artifacts (e.g., 962.3% suggests unit conversion error)
    if (Math.abs(data.irr) > 1 && Math.abs(data.irr) < 20) {
      warnings.push(`IRR value ${data.irr} suggests possible unit conversion error (decimal vs percentage)`);
    }

    // 3. Very high negative IRR suggests calculation error
    if (data.irr < -0.90) {
      errors.push(`Extremely negative IRR (${(data.irr * 100).toFixed(1)}%) suggests calculation error`);
    }

    // 4. Warning for very high positive IRR
    if (data.irr > 0.30) {
      warnings.push(`Very high IRR (${(data.irr * 100).toFixed(1)}%). Verify cash flow inputs and calculation logic.`);
    }

    if (errors.length > 0) {
      logger.error('IRR validation failed', {
        data,
        errors,
        warnings
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate General Financial Metrics
   */
  static validateFinancialMetrics(metrics: {
    irr?: number;
    capRate?: number;
    cashOnCashReturn?: number;
    dscr?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Cap Rate validation (typically 2-20%)
    if (metrics.capRate !== undefined) {
      if (metrics.capRate < 0.01 || metrics.capRate > 0.25) {
        warnings.push(`Unusual cap rate: ${(metrics.capRate * 100).toFixed(2)}%. Typical range is 2-20%.`);
      }
    }

    // DSCR validation (should be > 1.0 for positive cash flow)
    if (metrics.dscr !== undefined) {
      if (metrics.dscr < 0.5) {
        errors.push(`DSCR too low: ${metrics.dscr.toFixed(2)}. Property cannot service debt.`);
      }
      if (metrics.dscr < 1.0) {
        warnings.push(`DSCR below 1.0: ${metrics.dscr.toFixed(2)}. Negative cash flow situation.`);
      }
    }

    // Cash-on-Cash Return validation
    if (metrics.cashOnCashReturn !== undefined) {
      if (metrics.cashOnCashReturn < -0.50 || metrics.cashOnCashReturn > 0.30) {
        warnings.push(`Unusual cash-on-cash return: ${(metrics.cashOnCashReturn * 100).toFixed(1)}%`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Log validation results for monitoring
   */
  static logValidationResults(context: string, result: ValidationResult): void {
    if (!result.isValid) {
      logger.warn(`Financial validation failed for ${context}`, {
        errors: result.errors,
        warnings: result.warnings
      });
    } else if (result.warnings.length > 0) {
      logger.info(`Financial validation warnings for ${context}`, {
        warnings: result.warnings
      });
    }
  }
}