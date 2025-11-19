/**
 * Validation Warning Types
 *
 * Used to communicate data quality issues, input validation warnings,
 * and recommendations to users without blocking analysis.
 *
 * Created: November 8, 2025 - MF Phase 1 Commercial Plan
 */

/**
 * Severity levels for validation warnings
 * - LOW: Informational, minor concern
 * - MEDIUM: Should investigate, may affect results
 * - HIGH: Critical issue, strongly affects results
 */
export type ValidationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Categories of validation warnings
 */
export type ValidationCategory =
  | 'OPERATING_EXPENSES'   // Operating expense assumptions (too low/high for property type)
  | 'FINANCING'            // Financing assumptions (DSCR too low, LTV too high)
  | 'MARKET_DATA'          // Market data quality issues (stale data, limited comps)
  | 'INPUT_VALIDATION';    // General input validation (missing fields, unrealistic values)

/**
 * Validation Warning
 *
 * Returned in API response to inform users of potential data quality issues
 */
export interface ValidationWarning {
  /** Severity level */
  severity: ValidationSeverity;

  /** Category of warning */
  category: ValidationCategory;

  /** Human-readable warning message */
  message: string;

  /** Impact description (optional) - quantifies effect on analysis */
  impact?: string;

  /** Recommendation (optional) - suggests corrective action */
  recommendation?: string;

  /** Affected metric (optional) - helps frontend highlight specific fields */
  affectedMetric?: string;  // e.g., 'noi', 'capRate', 'dscr'
}

/**
 * Type guard to check if value is a valid ValidationSeverity
 */
export function isValidationSeverity(value: string): value is ValidationSeverity {
  return ['LOW', 'MEDIUM', 'HIGH'].includes(value);
}

/**
 * Type guard to check if value is a valid ValidationCategory
 */
export function isValidationCategory(value: string): value is ValidationCategory {
  return ['OPERATING_EXPENSES', 'FINANCING', 'MARKET_DATA', 'INPUT_VALIDATION'].includes(value);
}
