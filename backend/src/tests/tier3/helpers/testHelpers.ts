/**
 * TIER 3 Test Helpers
 *
 * Purpose: Shared utilities for data flow validation testing
 * Issue: #53 - Platform-Wide Silent Fallback Defaults
 */

import { InvestmentDecisionEngine } from '../../../services/investment/investmentDecisionEngine';

/**
 * Helper to run full analysis and return complete result
 *
 * @param propertyData - Property input matching frontend payload structure
 * @returns Complete investment decision with all analysis data
 */
export async function runAnalysis(propertyData: any): Promise<any> {
  const engine = new InvestmentDecisionEngine();
  const result = await engine.analyze(propertyData);
  return result;
}

/**
 * Helper to extract a nested field value from analysis result
 *
 * Supports dot notation for nested fields:
 * - 'brrrr.refinanceInterestRate'
 * - 'analysis.longTermAnalysis.projections[0].value'
 *
 * @param analysisResult - Complete analysis result object
 * @param fieldPath - Dot-notation path to field
 * @returns Extracted field value
 */
export function extractField(analysisResult: any, fieldPath: string): any {
  return fieldPath.split('.').reduce((obj, key) => {
    // Handle array access like 'projections[0]'
    const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      return obj?.[arrayName]?.[parseInt(index)];
    }
    return obj?.[key];
  }, analysisResult);
}

/**
 * Verify that user input was preserved and NOT replaced with fallback default
 *
 * @param userInput - Value user provided
 * @param actualValue - Value extracted from analysis result
 * @param defaultValue - Known fallback default
 * @param fieldName - Field name for logging
 */
export function expectNoFallback(
  userInput: any,
  actualValue: any,
  defaultValue: any,
  fieldName: string
): void {
  expect(actualValue).toBe(userInput);
  expect(actualValue).not.toBe(defaultValue);

  console.log(
    `✅ ${fieldName}: User input "${userInput}" preserved (NOT fallback "${defaultValue}")`
  );
}

/**
 * Verify that zero value was preserved correctly
 *
 * Critical for Issue #53 - Zero values should NOT be treated as falsy
 *
 * @param actualValue - Value extracted from analysis result
 * @param fieldName - Field name for logging
 */
export function expectZeroPreserved(
  actualValue: any,
  fieldName: string
): void {
  expect(actualValue).toBe(0);
  expect(actualValue).not.toBe(null);
  expect(actualValue).not.toBe(undefined);
  expect(actualValue).not.toBeNaN();

  console.log(`✅ ${fieldName}: Zero value preserved correctly`);
}

/**
 * Verify that a field value falls within expected range
 *
 * @param actualValue - Value to check
 * @param min - Minimum acceptable value
 * @param max - Maximum acceptable value
 * @param fieldName - Field name for logging
 */
export function expectInRange(
  actualValue: number,
  min: number,
  max: number,
  fieldName: string
): void {
  expect(actualValue).toBeGreaterThanOrEqual(min);
  expect(actualValue).toBeLessThanOrEqual(max);

  console.log(`✅ ${fieldName}: Value ${actualValue} within range [${min}, ${max}]`);
}

/**
 * Verify that fallback was used correctly when user did NOT provide value
 *
 * @param actualValue - Value extracted from analysis result
 * @param expectedDefault - Expected fallback default
 * @param fieldName - Field name for logging
 */
export function expectCorrectFallback(
  actualValue: any,
  expectedDefault: any,
  fieldName: string
): void {
  expect(actualValue).toBe(expectedDefault);

  console.log(
    `✅ ${fieldName}: Fallback default "${expectedDefault}" correctly applied (user did not provide value)`
  );
}

/**
 * Verify that a field exists and is not null/undefined
 *
 * @param actualValue - Value to check
 * @param fieldName - Field name for logging
 */
export function expectFieldExists(
  actualValue: any,
  fieldName: string
): void {
  expect(actualValue).toBeDefined();
  expect(actualValue).not.toBeNull();

  console.log(`✅ ${fieldName}: Field exists with value "${actualValue}"`);
}

/**
 * Verify that calculation result matches expected value within tolerance
 *
 * Useful for floating-point calculations
 *
 * @param actualValue - Calculated value
 * @param expectedValue - Expected value
 * @param tolerance - Acceptable difference (default: 0.01 for currency)
 * @param fieldName - Field name for logging
 */
export function expectNearlyEqual(
  actualValue: number,
  expectedValue: number,
  tolerance: number = 0.01,
  fieldName: string
): void {
  const difference = Math.abs(actualValue - expectedValue);
  expect(difference).toBeLessThan(tolerance);

  console.log(
    `✅ ${fieldName}: ${actualValue} ≈ ${expectedValue} (within tolerance ${tolerance})`
  );
}

/**
 * Extract BRRRR-specific fields from analysis result
 *
 * @param analysisResult - Complete analysis result
 * @returns BRRRR analysis object
 */
export function extractBRRRRAnalysis(analysisResult: any): any {
  return analysisResult?.analysis?.brrrAnalysis || analysisResult?.brrrAnalysis;
}

/**
 * Extract long-term projections from analysis result
 *
 * @param analysisResult - Complete analysis result
 * @returns Long-term projections array
 */
export function extractProjections(analysisResult: any): any[] {
  return (
    analysisResult?.analysis?.longTermAnalysis?.projections ||
    analysisResult?.longTermAnalysis?.projections ||
    []
  );
}

/**
 * Extract property quality score from analysis result
 *
 * @param analysisResult - Complete analysis result
 * @returns Property quality score (0-100)
 */
export function extractQualityScore(analysisResult: any): number {
  return (
    analysisResult?.propertyQualityScore ||
    analysisResult?.analysis?.propertyQualityScore ||
    0
  );
}

/**
 * Extract investment verdict from analysis result
 *
 * @param analysisResult - Complete analysis result
 * @returns Verdict string (BUY, NEGOTIATE, CAUTION, PASS)
 */
export function extractVerdict(analysisResult: any): string {
  return (
    analysisResult?.verdict ||
    analysisResult?.analysis?.verdict ||
    'UNKNOWN'
  );
}

/**
 * Helper to verify BRRRR refinance interest rate data flow
 * This is the critical test that exposed Issue #53
 *
 * @param analysisResult - Complete analysis result
 * @param expectedRate - User-provided refinance rate
 */
export function verifyBRRRRRefinanceRate(
  analysisResult: any,
  expectedRate: number
): void {
  const brrrAnalysis = extractBRRRRAnalysis(analysisResult);

  // Check that refinance rate was used in calculations
  const postRefinanceMortgage = brrrAnalysis?.postRefinance?.monthlyMortgage;
  expect(postRefinanceMortgage).toBeDefined();
  expect(postRefinanceMortgage).toBeGreaterThan(0);

  // Verify the rate itself was preserved
  const actualRate = brrrAnalysis?.refinanceInterestRate || brrrAnalysis?.inputs?.refinanceInterestRate;

  if (actualRate !== undefined) {
    expectNoFallback(
      expectedRate,
      actualRate,
      7.5, // Known fallback rate from Issue #51
      'BRRRR refinanceInterestRate'
    );
  }

  console.log(`✅ BRRRR refinance rate verification complete for rate ${expectedRate}%`);
}

/**
 * Helper to log test section header
 *
 * @param sectionName - Name of test section
 */
export function logTestSection(sectionName: string): void {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${sectionName}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Helper to summarize test results
 *
 * @param testName - Name of the test suite
 * @param passedCount - Number of passed assertions
 * @param totalCount - Total number of assertions
 */
export function logTestSummary(
  testName: string,
  passedCount: number,
  totalCount: number
): void {
  const percentage = Math.round((passedCount / totalCount) * 100);

  console.log('\n' + '-'.repeat(80));
  console.log(`  ${testName} Summary: ${passedCount}/${totalCount} tests passed (${percentage}%)`);
  console.log('-'.repeat(80) + '\n');
}
