/**
 * Custom Jest Matchers for Multi-Family Analysis Testing
 * Created: October 25, 2025
 * Purpose: Provide specialized assertions for financial calculations and MF metrics
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Check if a value is within a percentage range of expected value
       * @param expected The expected value
       * @param percentTolerance Tolerance as percentage (default: 1%)
       * @example expect(100).toBeWithinPercent(102, 5) // Pass: within 5%
       */
      toBeWithinPercent(expected: number, percentTolerance?: number): R;

      /**
       * Check if DSCR meets lender requirements (>= 1.25)
       * @example expect(1.30).toMeetLenderDSCR() // Pass
       */
      toMeetLenderDSCR(): R;

      /**
       * Check if Debt Yield meets lender requirements (>= 10%)
       * @example expect(12.5).toMeetLenderDebtYield() // Pass
       */
      toMeetLenderDebtYield(): R;

      /**
       * Check if Cap Rate is within typical MF range (4-12%)
       * @example expect(8.5).toBeTypicalCapRate() // Pass
       */
      toBeTypicalCapRate(): R;

      /**
       * Check if Break-Even Occupancy is safe (<= 85%)
       * @example expect(78).toBeSafeBEO() // Pass
       */
      toBeSafeBEO(): R;

      /**
       * Check if GRM is within typical range (4-12)
       * @example expect(7.5).toBeTypicalGRM() // Pass
       */
      toBeTypicalGRM(): R;

      /**
       * Check if NOI is positive (financially viable)
       * @example expect(50000).toBePositiveNOI() // Pass
       */
      toBePositiveNOI(): R;

      /**
       * Check if unit mix efficiency is good (90-110%)
       * @example expect(105).toHaveGoodUnitMixEfficiency() // Pass
       */
      toHaveGoodUnitMixEfficiency(): R;

      /**
       * Check if economic vacancy is within acceptable range (<= 15%)
       * @example expect(8).toHaveAcceptableVacancy() // Pass
       */
      toHaveAcceptableVacancy(): R;

      /**
       * Validate complete MF metrics object structure
       * @example expect(metrics).toHaveValidMFMetrics()
       */
      toHaveValidMFMetrics(): R;
    }
  }
}

export const mfMatchers = {
  /**
   * Check if value is within percentage tolerance
   */
  toBeWithinPercent(
    received: number,
    expected: number,
    percentTolerance: number = 1
  ): jest.CustomMatcherResult {
    const tolerance = Math.abs(expected * (percentTolerance / 100));
    const difference = Math.abs(received - expected);
    const pass = difference <= tolerance;

    const message = () => {
      const percentDiff = ((difference / expected) * 100).toFixed(2);
      return pass
        ? `Expected ${received} NOT to be within ${percentTolerance}% of ${expected} (difference: ${percentDiff}%)`
        : `Expected ${received} to be within ${percentTolerance}% of ${expected} (difference: ${percentDiff}%)`;
    };

    return {
      pass,
      message
    };
  },

  /**
   * Check if DSCR meets lender requirements
   */
  toMeetLenderDSCR(received: number): jest.CustomMatcherResult {
    const LENDER_MIN_DSCR = 1.25;
    const pass = received >= LENDER_MIN_DSCR;

    const message = () =>
      pass
        ? `Expected DSCR ${received.toFixed(2)} NOT to meet lender requirements (>= ${LENDER_MIN_DSCR})`
        : `Expected DSCR ${received.toFixed(2)} to meet lender requirements (>= ${LENDER_MIN_DSCR})`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if Debt Yield meets lender requirements
   */
  toMeetLenderDebtYield(received: number): jest.CustomMatcherResult {
    const LENDER_MIN_DEBT_YIELD = 10;
    const pass = received >= LENDER_MIN_DEBT_YIELD;

    const message = () =>
      pass
        ? `Expected Debt Yield ${received.toFixed(2)}% NOT to meet lender requirements (>= ${LENDER_MIN_DEBT_YIELD}%)`
        : `Expected Debt Yield ${received.toFixed(2)}% to meet lender requirements (>= ${LENDER_MIN_DEBT_YIELD}%)`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if Cap Rate is within typical MF range
   */
  toBeTypicalCapRate(received: number): jest.CustomMatcherResult {
    const MIN_CAP = 4;
    const MAX_CAP = 12;
    const pass = received >= MIN_CAP && received <= MAX_CAP;

    const message = () =>
      pass
        ? `Expected Cap Rate ${received.toFixed(2)}% NOT to be within typical range (${MIN_CAP}%-${MAX_CAP}%)`
        : `Expected Cap Rate ${received.toFixed(2)}% to be within typical range (${MIN_CAP}%-${MAX_CAP}%)`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if Break-Even Occupancy is safe
   */
  toBeSafeBEO(received: number): jest.CustomMatcherResult {
    const SAFE_THRESHOLD = 85;
    const pass = received <= SAFE_THRESHOLD;

    const message = () =>
      pass
        ? `Expected BEO ${received.toFixed(1)}% NOT to be safe (<= ${SAFE_THRESHOLD}%)`
        : `Expected BEO ${received.toFixed(1)}% to be safe (<= ${SAFE_THRESHOLD}%) - High risk property!`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if GRM is within typical range
   */
  toBeTypicalGRM(received: number): jest.CustomMatcherResult {
    const MIN_GRM = 4;
    const MAX_GRM = 12;
    const pass = received >= MIN_GRM && received <= MAX_GRM;

    const message = () =>
      pass
        ? `Expected GRM ${received.toFixed(2)} NOT to be within typical range (${MIN_GRM}-${MAX_GRM})`
        : `Expected GRM ${received.toFixed(2)} to be within typical range (${MIN_GRM}-${MAX_GRM})`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if NOI is positive
   */
  toBePositiveNOI(received: number): jest.CustomMatcherResult {
    const pass = received > 0;

    const message = () =>
      pass
        ? `Expected NOI $${received.toFixed(2)} NOT to be positive`
        : `Expected NOI $${received.toFixed(2)} to be positive - Property loses money!`;

    return {
      pass,
      message
    };
  },

  /**
   * Check if unit mix efficiency is good
   */
  toHaveGoodUnitMixEfficiency(received: number): jest.CustomMatcherResult {
    const MIN_EFFICIENCY = 90;
    const MAX_EFFICIENCY = 110;
    const pass = received >= MIN_EFFICIENCY && received <= MAX_EFFICIENCY;

    const message = () => {
      if (pass) {
        return `Expected Unit Mix Efficiency ${received.toFixed(1)}% NOT to be good (${MIN_EFFICIENCY}%-${MAX_EFFICIENCY}%)`;
      } else if (received < MIN_EFFICIENCY) {
        return `Expected Unit Mix Efficiency ${received.toFixed(1)}% to be good (${MIN_EFFICIENCY}%-${MAX_EFFICIENCY}%) - Below market!`;
      } else {
        return `Expected Unit Mix Efficiency ${received.toFixed(1)}% to be good (${MIN_EFFICIENCY}%-${MAX_EFFICIENCY}%) - Above market pricing (potential value-add)`;
      }
    };

    return {
      pass,
      message
    };
  },

  /**
   * Check if economic vacancy is acceptable
   */
  toHaveAcceptableVacancy(received: number): jest.CustomMatcherResult {
    const MAX_VACANCY = 15;
    const pass = received <= MAX_VACANCY;

    const message = () =>
      pass
        ? `Expected Economic Vacancy ${received.toFixed(1)}% NOT to be acceptable (<= ${MAX_VACANCY}%)`
        : `Expected Economic Vacancy ${received.toFixed(1)}% to be acceptable (<= ${MAX_VACANCY}%) - High vacancy concern!`;

    return {
      pass,
      message
    };
  },

  /**
   * Validate complete MF metrics object structure
   */
  toHaveValidMFMetrics(received: any): jest.CustomMatcherResult {
    const requiredFields = [
      'noi',
      'capRate',
      'dscr',
      'grm',
      'debtYield',
      'breakEvenOccupancy',
      'pricePerUnit',
      'noiPerUnit',
      'cashFlowPerUnit',
      'rentPerSqft',
      'unitMixEfficiency',
      'economicVacancyRate',
      'grossYield'
    ];

    const missingFields = requiredFields.filter(field => !(field in received));
    const pass = missingFields.length === 0;

    // Check for invalid values (NaN, Infinity)
    const invalidFields: string[] = [];
    requiredFields.forEach(field => {
      const value = received[field];
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        invalidFields.push(`${field}=${value}`);
      }
    });

    const hasInvalidValues = invalidFields.length > 0;

    const message = () => {
      if (!pass) {
        return `Expected metrics to have all required MF fields. Missing: ${missingFields.join(', ')}`;
      } else if (hasInvalidValues) {
        return `Expected metrics to have valid numeric values. Invalid: ${invalidFields.join(', ')}`;
      } else {
        return `Expected metrics NOT to have all valid MF fields`;
      }
    };

    return {
      pass: pass && !hasInvalidValues,
      message
    };
  }
};

/**
 * Helper function to register matchers with Jest
 * Usage in test files:
 * ```typescript
 * import { registerMFMatchers } from './helpers/mfMatchers';
 * beforeAll(() => registerMFMatchers());
 * ```
 */
export function registerMFMatchers(): void {
  expect.extend(mfMatchers);
}

/**
 * Utility function for comparing financial calculations with tolerance
 */
export function expectFinancialMatch(
  actual: number,
  expected: number,
  percentTolerance: number = 1,
  label?: string
): void {
  const tolerance = Math.abs(expected * (percentTolerance / 100));
  const difference = Math.abs(actual - expected);

  if (difference > tolerance) {
    const percentDiff = ((difference / expected) * 100).toFixed(2);
    const labelText = label ? `${label}: ` : '';
    throw new Error(
      `${labelText}Expected ${actual} to be within ${percentTolerance}% of ${expected} (difference: ${percentDiff}%)`
    );
  }
}

/**
 * Validate NOI calculation step-by-step
 */
export function validateNOICalculation(
  analysis: any,
  expectedGrossIncome: number,
  expectedVacancyRate: number = 5,
  expectedCreditLoss: number = 2,
  percentTolerance: number = 1
): void {
  const { effectiveGrossIncome, operatingExpenses, noi, grossIncome } = analysis;

  // Step 1: Validate Gross Income
  expectFinancialMatch(grossIncome, expectedGrossIncome, percentTolerance, 'Gross Income');

  // Step 2: Validate EGI calculation
  const expectedVacancyLoss = expectedGrossIncome * (expectedVacancyRate / 100);
  const expectedCreditLossAmount = expectedGrossIncome * (expectedCreditLoss / 100);
  const expectedEGI = expectedGrossIncome - expectedVacancyLoss - expectedCreditLossAmount;

  expectFinancialMatch(effectiveGrossIncome, expectedEGI, percentTolerance, 'EGI');

  // Step 3: Validate NOI calculation
  const expectedNOI = effectiveGrossIncome - operatingExpenses;
  expectFinancialMatch(noi, expectedNOI, percentTolerance, 'NOI');

  // Step 4: Ensure vacancy is NOT in operating expenses
  const vacancyInExpenses = operatingExpenses > (effectiveGrossIncome - noi);
  if (vacancyInExpenses) {
    throw new Error(
      'Operating expenses appear to include vacancy (they should not!) ' +
      `OpEx: ${operatingExpenses}, EGI-NOI: ${effectiveGrossIncome - noi}`
    );
  }
}

/**
 * Validate all 9 advanced MF metrics are present and valid
 */
export function validateAdvancedMFMetrics(metrics: any): void {
  const advancedMetrics = [
    'grm',
    'debtYield',
    'breakEvenOccupancy',
    'pricePerUnit',
    'noiPerUnit',
    'cashFlowPerUnit',
    'rentPerSqft',
    'unitMixEfficiency',
    'economicVacancyRate'
  ];

  advancedMetrics.forEach(metric => {
    if (!(metric in metrics)) {
      throw new Error(`Missing advanced MF metric: ${metric}`);
    }

    const value = metrics[metric];
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new Error(`Invalid value for ${metric}: ${value}`);
    }
  });

  // Validate ranges
  if (metrics.grm < 0 || metrics.grm > 100) {
    throw new Error(`GRM out of valid range: ${metrics.grm}`);
  }

  if (metrics.breakEvenOccupancy < 0 || metrics.breakEvenOccupancy > 200) {
    throw new Error(`BEO out of valid range: ${metrics.breakEvenOccupancy}%`);
  }

  if (metrics.unitMixEfficiency < 0 || metrics.unitMixEfficiency > 300) {
    throw new Error(`Unit Mix Efficiency out of valid range: ${metrics.unitMixEfficiency}%`);
  }
}
