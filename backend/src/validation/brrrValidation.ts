/**
 * BRRRR Data Validation Layer
 *
 * PURPOSE: Validate BRRRR-specific inputs before analysis
 *
 * Validation Types:
 * - ERRORS (blocking): Invalid data that prevents analysis
 * - WARNINGS (non-blocking): Risky assumptions worth flagging
 *
 * Industry Standards Referenced:
 * - Fannie Mae underwriting guidelines (seasoning period)
 * - 70% Rule (wholesale investor standard)
 * - Typical refinance LTV ranges (65-80%)
 * - ARV lift reasonability (15-100% range)
 *
 * @author FSE from CLAUDE.md
 * @version 1.0.0
 * @date December 17, 2025
 */

// =============================================================================
// VALIDATION RULES (Industry Standards)
// =============================================================================

export const BRRRR_VALIDATION_RULES = {
  // ARV Validation
  arvMustExceedPurchasePrice: true,
  arvMinimumLiftPercent: 15,     // At least 15% value add required
  arvMaximumLiftPercent: 100,    // Flag deals claiming >100% gains as aggressive

  // Rehab Budget
  rehabBudgetMinimum: 5000,      // Minimum meaningful rehab
  rehabBudgetMaxPercent: 70,     // Max 70% of purchase price (sanity check)

  // Refinance Terms
  refinanceLTVMin: 65,           // Conservative lender minimum
  refinanceLTVMax: 80,           // Standard maximum (some lenders go to 85%)
  refinanceLTVDefault: 75,       // Industry standard for cash-out refinance

  // Seasoning Period (Fannie Mae April 2023)
  seasoningPeriodStandard: 12,   // 12 months standard
  seasoningPeriodMin: 6,         // Some portfolio lenders allow 6 months
  seasoningPeriodMax: 24,        // Extended seasoning (conservative)

  // 70% Rule
  rule70Enabled: true            // Validate deal meets 70% rule
} as const;

// =============================================================================
// TYPES
// =============================================================================

export type ValidationSeverity = 'error' | 'warning';
export type ValidationCode =
  | 'ARV_TOO_LOW'
  | 'ARV_LIFT_TOO_SMALL'
  | 'ARV_LIFT_AGGRESSIVE'
  | 'REHAB_BUDGET_TOO_LOW'
  | 'REHAB_BUDGET_TOO_HIGH'
  | 'REFINANCE_LTV_TOO_LOW'
  | 'REFINANCE_LTV_TOO_HIGH'
  | 'SEASONING_PERIOD_SHORT'
  | 'SEASONING_PERIOD_LONG'
  | 'VIOLATES_70_RULE'
  | 'MISSING_REQUIRED_FIELD';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
  code: ValidationCode;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
  code: ValidationCode;
  value?: any;
  recommendation?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];       // Blocking - cannot proceed
  warnings: ValidationWarning[];   // Non-blocking - can proceed with caution
  score: number;                   // 0-100 data quality score
}

export interface BRRRRInputs {
  purchasePrice: number;
  closingCosts?: number;
  brrrr: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV?: number;
    seasoningPeriod?: number;
    estimatedRehabTime?: number;
    arvAppraisalConfidence?: 'conservative' | 'moderate' | 'aggressive';
  };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Main BRRRR input validation function
 */
export function validateBRRRRInputs(inputs: BRRRRInputs): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate required fields
  validateRequiredFields(inputs, errors);

  // Validate ARV
  validateARV(inputs, errors, warnings);

  // Validate rehab budget
  validateRehabBudget(inputs, errors, warnings);

  // Validate refinance LTV
  validateRefinanceLTV(inputs, errors, warnings);

  // Validate seasoning period
  validateSeasoningPeriod(inputs, warnings);

  // Validate 70% Rule
  validate70Rule(inputs, warnings);

  // Calculate data quality score
  const score = calculateDataQualityScore(inputs, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validate required fields are present
 */
function validateRequiredFields(inputs: BRRRRInputs, errors: ValidationError[]): void {
  if (!inputs.purchasePrice || inputs.purchasePrice <= 0) {
    errors.push({
      field: 'purchasePrice',
      message: 'Purchase price is required and must be greater than 0',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      value: inputs.purchasePrice
    });
  }

  if (!inputs.brrrr) {
    errors.push({
      field: 'brrrr',
      message: 'BRRRR data object is required for BRRRR strategy',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    return; // Cannot continue validation without brrrr object
  }

  if (!inputs.brrrr.rehabBudget || inputs.brrrr.rehabBudget <= 0) {
    errors.push({
      field: 'brrrr.rehabBudget',
      message: 'Rehab budget is required and must be greater than 0',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      value: inputs.brrrr.rehabBudget
    });
  }

  if (!inputs.brrrr.afterRepairValue || inputs.brrrr.afterRepairValue <= 0) {
    errors.push({
      field: 'brrrr.afterRepairValue',
      message: 'After Repair Value (ARV) is required and must be greater than 0',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      value: inputs.brrrr.afterRepairValue
    });
  }
}

/**
 * Validate After Repair Value (ARV)
 */
function validateARV(
  inputs: BRRRRInputs,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!inputs.brrrr || !inputs.purchasePrice) return;

  const { afterRepairValue } = inputs.brrrr;
  const { purchasePrice } = inputs;

  // BLOCKING ERROR: ARV must exceed purchase price
  if (afterRepairValue <= purchasePrice) {
    errors.push({
      field: 'brrrr.afterRepairValue',
      message: 'After Repair Value must exceed purchase price for BRRRR strategy',
      severity: 'error',
      code: 'ARV_TOO_LOW',
      value: afterRepairValue
    });
    return; // Don't run further ARV validations if this fails
  }

  // Calculate ARV lift percentage
  const arvLift = ((afterRepairValue - purchasePrice) / purchasePrice) * 100;

  // WARNING: ARV lift too small (< 15%)
  if (arvLift < BRRRR_VALIDATION_RULES.arvMinimumLiftPercent) {
    warnings.push({
      field: 'brrrr.afterRepairValue',
      message: `ARV lift is only ${arvLift.toFixed(1)}% - typically need 15%+ for BRRRR to work`,
      severity: 'warning',
      code: 'ARV_LIFT_TOO_SMALL',
      value: arvLift,
      recommendation: 'Consider if this property has enough upside for BRRRR strategy'
    });
  }

  // WARNING: ARV lift very aggressive (> 50%)
  if (arvLift > 50) {
    warnings.push({
      field: 'brrrr.afterRepairValue',
      message: `ARV assumes ${arvLift.toFixed(0)}% value increase - verify comps carefully`,
      severity: 'warning',
      code: 'ARV_LIFT_AGGRESSIVE',
      value: arvLift,
      recommendation: 'Get multiple professional appraisal estimates to validate ARV'
    });
  }

  // WARNING: ARV lift extremely aggressive (> 100%)
  if (arvLift > BRRRR_VALIDATION_RULES.arvMaximumLiftPercent) {
    warnings.push({
      field: 'brrrr.afterRepairValue',
      message: `ARV assumes ${arvLift.toFixed(0)}% value increase - extremely aggressive assumption`,
      severity: 'warning',
      code: 'ARV_LIFT_AGGRESSIVE',
      value: arvLift,
      recommendation: 'Triple-check ARV comps - 100%+ gains are rare'
    });
  }
}

/**
 * Validate rehab budget
 */
function validateRehabBudget(
  inputs: BRRRRInputs,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!inputs.brrrr || !inputs.purchasePrice) return;

  const { rehabBudget } = inputs.brrrr;
  const { purchasePrice } = inputs;

  // BLOCKING ERROR: Rehab budget too low
  if (rehabBudget < BRRRR_VALIDATION_RULES.rehabBudgetMinimum) {
    errors.push({
      field: 'brrrr.rehabBudget',
      message: `Rehab budget must be at least $${BRRRR_VALIDATION_RULES.rehabBudgetMinimum.toLocaleString()}`,
      severity: 'error',
      code: 'REHAB_BUDGET_TOO_LOW',
      value: rehabBudget
    });
  }

  // WARNING: Rehab budget very high (> 70% of purchase price)
  const rehabPercent = (rehabBudget / purchasePrice) * 100;
  if (rehabPercent > BRRRR_VALIDATION_RULES.rehabBudgetMaxPercent) {
    warnings.push({
      field: 'brrrr.rehabBudget',
      message: `Rehab budget is ${rehabPercent.toFixed(0)}% of purchase price - verify this is accurate`,
      severity: 'warning',
      code: 'REHAB_BUDGET_TOO_HIGH',
      value: rehabBudget,
      recommendation: 'Double-check rehab scope - very high rehab budgets increase risk'
    });
  }

  // WARNING: Rehab budget unusually high (> 100% of purchase price)
  if (rehabPercent > 100) {
    warnings.push({
      field: 'brrrr.rehabBudget',
      message: `Rehab budget exceeds purchase price - consider new construction instead`,
      severity: 'warning',
      code: 'REHAB_BUDGET_TOO_HIGH',
      value: rehabBudget,
      recommendation: 'Verify if rehab makes sense vs. buying newer property'
    });
  }
}

/**
 * Validate refinance LTV
 */
function validateRefinanceLTV(
  inputs: BRRRRInputs,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!inputs.brrrr) return;

  const refinanceLTV = inputs.brrrr.refinanceLTV || BRRRR_VALIDATION_RULES.refinanceLTVDefault;

  // BLOCKING ERROR: LTV too low
  if (refinanceLTV < BRRRR_VALIDATION_RULES.refinanceLTVMin) {
    errors.push({
      field: 'brrrr.refinanceLTV',
      message: `Refinance LTV must be at least ${BRRRR_VALIDATION_RULES.refinanceLTVMin}%`,
      severity: 'error',
      code: 'REFINANCE_LTV_TOO_LOW',
      value: refinanceLTV
    });
  }

  // BLOCKING ERROR: LTV too high
  if (refinanceLTV > BRRRR_VALIDATION_RULES.refinanceLTVMax) {
    errors.push({
      field: 'brrrr.refinanceLTV',
      message: `Refinance LTV cannot exceed ${BRRRR_VALIDATION_RULES.refinanceLTVMax}% (standard maximum)`,
      severity: 'error',
      code: 'REFINANCE_LTV_TOO_HIGH',
      value: refinanceLTV
    });
  }

  // WARNING: Conservative LTV (< 70%)
  if (refinanceLTV < 70) {
    warnings.push({
      field: 'brrrr.refinanceLTV',
      message: `${refinanceLTV}% LTV is conservative - most BRRRR deals use 75-80% LTV`,
      severity: 'warning',
      code: 'REFINANCE_LTV_TOO_LOW',
      value: refinanceLTV,
      recommendation: 'Consider if you could recover more capital with higher LTV'
    });
  }
}

/**
 * Validate seasoning period
 */
function validateSeasoningPeriod(inputs: BRRRRInputs, warnings: ValidationWarning[]): void {
  if (!inputs.brrrr) return;

  const seasoningPeriod = inputs.brrrr.seasoningPeriod || BRRRR_VALIDATION_RULES.seasoningPeriodStandard;

  // WARNING: Short seasoning period (< 12 months)
  if (seasoningPeriod < BRRRR_VALIDATION_RULES.seasoningPeriodStandard) {
    warnings.push({
      field: 'brrrr.seasoningPeriod',
      message: `${seasoningPeriod} month seasoning - Fannie Mae requires 12 months for cash-out refinance`,
      severity: 'warning',
      code: 'SEASONING_PERIOD_SHORT',
      value: seasoningPeriod,
      recommendation: 'Verify lender allows shorter seasoning (portfolio lenders may accept 6 months)'
    });
  }

  // WARNING: Very short seasoning (< 6 months)
  if (seasoningPeriod < BRRRR_VALIDATION_RULES.seasoningPeriodMin) {
    warnings.push({
      field: 'brrrr.seasoningPeriod',
      message: `${seasoningPeriod} month seasoning is very short - most lenders require 6-12 months minimum`,
      severity: 'warning',
      code: 'SEASONING_PERIOD_SHORT',
      value: seasoningPeriod,
      recommendation: 'Confirm lender pre-approval for this short seasoning period'
    });
  }

  // WARNING: Long seasoning period (> 24 months)
  if (seasoningPeriod > BRRRR_VALIDATION_RULES.seasoningPeriodMax) {
    warnings.push({
      field: 'brrrr.seasoningPeriod',
      message: `${seasoningPeriod} month seasoning is unusually long - consider if this delays capital recovery too much`,
      severity: 'warning',
      code: 'SEASONING_PERIOD_LONG',
      value: seasoningPeriod,
      recommendation: 'Verify if extended seasoning period is necessary'
    });
  }
}

/**
 * Validate 70% Rule
 */
function validate70Rule(inputs: BRRRRInputs, warnings: ValidationWarning[]): void {
  if (!inputs.brrrr || !inputs.purchasePrice) return;
  if (!BRRRR_VALIDATION_RULES.rule70Enabled) return;

  const { afterRepairValue, rehabBudget } = inputs.brrrr;
  const { purchasePrice } = inputs;

  // Calculate 70% Rule
  const maxAllowablePurchase = (afterRepairValue * 0.70) - rehabBudget;
  const meets70Rule = purchasePrice <= maxAllowablePurchase;

  if (!meets70Rule) {
    const overage = purchasePrice - maxAllowablePurchase;
    const overagePercent = (overage / purchasePrice) * 100;

    warnings.push({
      field: 'purchasePrice',
      message: `Property violates 70% Rule - paying $${overage.toLocaleString()} (${overagePercent.toFixed(1)}%) too much`,
      severity: 'warning',
      code: 'VIOLATES_70_RULE',
      value: purchasePrice,
      recommendation: `Negotiate purchase price down to $${maxAllowablePurchase.toLocaleString()} or verify ARV is accurate`
    });
  }
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQualityScore(
  inputs: BRRRRInputs,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number {
  let score = 100;

  // Errors reduce score by 25 points each (blocking)
  score -= errors.length * 25;

  // Warnings reduce score by 10 points each (non-blocking)
  score -= warnings.length * 10;

  // Additional scoring factors

  // ARV confidence level
  if (inputs.brrrr?.arvAppraisalConfidence === 'conservative') {
    score += 5; // Bonus for conservative ARV
  } else if (inputs.brrrr?.arvAppraisalConfidence === 'aggressive') {
    score -= 5; // Penalty for aggressive ARV
  }

  // Seasoning period reasonability
  const seasoningPeriod = inputs.brrrr?.seasoningPeriod || BRRRR_VALIDATION_RULES.seasoningPeriodStandard;
  if (seasoningPeriod >= 12) {
    score += 3; // Bonus for standard seasoning
  }

  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

export class BRRRRValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public value?: any,
    public code?: ValidationCode
  ) {
    super(message);
    this.name = 'BRRRRValidationError';
  }
}

export class BRRRRCalculationError extends Error {
  constructor(
    message: string,
    public calculation: string,
    public inputs?: any
  ) {
    super(message);
    this.name = 'BRRRRCalculationError';
  }
}
