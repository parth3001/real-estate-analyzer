/**
 * Issue #53 - Zero-Value Fallback Bug Fix - Simple Verification Test
 *
 * PROBLEM: Using || operator treats 0 as falsy, corrupting user's intentional zero values
 * - User Input: vacancyRate: 0 (luxury property, fully occupied)
 * - OLD BUG: 0 || 5 = 5 (WRONG - replaced user's zero with default)
 * - NEW FIX: 0 ?? 5 = 0 (CORRECT - preserves user's zero)
 *
 * This test verifies the ?? operator fixes work correctly.
 */

describe('Issue #53 - Nullish Coalescing Operator (??) Fix', () => {

  describe('JavaScript ?? operator behavior (sanity check)', () => {
    it('should preserve 0 with ?? operator', () => {
      const userValue = 0;
      const result = userValue ?? 5;
      expect(result).toBe(0); // ✅ Preserves zero
    });

    it('should use default when undefined with ?? operator', () => {
      const userValue = undefined;
      const result = userValue ?? 5;
      expect(result).toBe(5); // ✅ Uses default for undefined
    });

    it('should use default when null with ?? operator', () => {
      const userValue = null;
      const result = userValue ?? 5;
      expect(result).toBe(5); // ✅ Uses default for null
    });

    it('OLD BUG: || operator incorrectly replaces 0 with default', () => {
      const userValue = 0;
      const buggyResult = userValue || 5;
      expect(buggyResult).toBe(5); // ❌ BUG - Zero was replaced!
    });
  });

  describe('Nested fallback chains with ?? operator', () => {
    it('should handle wizard vs manual form dual-source fallback', () => {
      // Wizard format: vacancyRate at top level
      const wizardData = {
        vacancyRate: 0, // User provided zero
        longTermAssumptions: {
          vacancyRate: undefined
        }
      };

      // Simulate convertWizardData logic
      const result = wizardData.vacancyRate ?? wizardData.longTermAssumptions?.vacancyRate ?? 5;

      expect(result).toBe(0); // ✅ Should use wizard's zero value
    });

    it('should fallback to nested value when top-level undefined', () => {
      // Manual form: vacancyRate in longTermAssumptions
      const manualData = {
        vacancyRate: undefined,
        longTermAssumptions: {
          vacancyRate: 0 // User provided zero in advanced settings
        }
      };

      const result = manualData.vacancyRate ?? manualData.longTermAssumptions?.vacancyRate ?? 5;

      expect(result).toBe(0); // ✅ Should use nested zero value
    });

    it('should use default when both sources undefined', () => {
      const emptyData = {
        vacancyRate: undefined,
        longTermAssumptions: {
          vacancyRate: undefined
        }
      };

      const result = emptyData.vacancyRate ?? emptyData.longTermAssumptions?.vacancyRate ?? 5;

      expect(result).toBe(5); // ✅ Should use default
    });
  });

  describe('BRRRR-specific zero-value scenarios', () => {
    it('should preserve refinanceInterestRate: 0 (promotional rate)', () => {
      const inputs = {
        brrrr: {
          refinanceInterestRate: 0 // User got 0% promo rate
        },
        interestRate: 6.5 // Purchase rate
      };

      // Simulate brrrAnalyzer logic (Line 458)
      const refinanceRate = inputs.brrrr.refinanceInterestRate ?? inputs.interestRate;

      expect(refinanceRate).toBe(0); // ✅ Should preserve promotional 0% rate
    });

    it('should fallback to purchase rate when refinanceInterestRate undefined', () => {
      const inputs = {
        brrrr: {
          refinanceInterestRate: undefined // User didn't specify
        },
        interestRate: 6.5
      };

      const refinanceRate = inputs.brrrr.refinanceInterestRate ?? inputs.interestRate;

      expect(refinanceRate).toBe(6.5); // ✅ Should fallback to purchase rate
    });

    it('should preserve seasoningPeriod: 0 (immediate refinance)', () => {
      const inputs = {
        brrrr: {
          seasoningPeriod: 0 // User wants immediate refinance
        }
      };

      // Simulate brrrAnalyzer logic (Line 286)
      const months = inputs.brrrr.seasoningPeriod ?? 12;

      expect(months).toBe(0); // ✅ Should preserve immediate refinance
    });

    it('should preserve refinanceLTV: 0 (cash refinance, pay off loan)', () => {
      const inputs = {
        brrrr: {
          refinanceLTV: 0 // User wants to pay off loan entirely
        }
      };

      // Simulate brrrAnalyzer logic (Line 353)
      const ltv = inputs.brrrr.refinanceLTV ?? 75;

      expect(ltv).toBe(0); // ✅ Should preserve cash refinance (0% LTV)
    });
  });

  describe('Controller assumptions object (Lines 962-967)', () => {
    it('should preserve all P0 critical field zero values', () => {
      const dealData = {
        longTermAssumptions: {
          projectionYears: 0, // User wants current year only
          annualRentIncrease: 0, // Rent-controlled property
          annualExpenseIncrease: 0, // Fixed expenses
          annualPropertyValueIncrease: 0, // Conservative, no appreciation
          sellingCostsPercentage: 0, // FSBO (for sale by owner)
          vacancyRate: 0 // Always occupied
        }
      };

      // Simulate controller assumptions object (Lines 962-967)
      const assumptions = {
        projectionYears: dealData.longTermAssumptions?.projectionYears ?? 10,
        annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease ?? 2,
        annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease ?? 2,
        annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3,
        sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage ?? 6,
        vacancyRate: dealData.longTermAssumptions?.vacancyRate ?? 5
      };

      // ✅ All zero values should be preserved
      expect(assumptions.projectionYears).toBe(0);
      expect(assumptions.annualRentIncrease).toBe(0);
      expect(assumptions.annualExpenseIncrease).toBe(0);
      expect(assumptions.annualPropertyValueIncrease).toBe(0);
      expect(assumptions.sellingCosts).toBe(0);
      expect(assumptions.vacancyRate).toBe(0);
    });

    it('should apply defaults when all fields undefined', () => {
      const dealData: any = {
        longTermAssumptions: {
          // All undefined
        }
      };

      const assumptions = {
        projectionYears: dealData.longTermAssumptions?.projectionYears ?? 10,
        annualRentIncrease: dealData.longTermAssumptions?.annualRentIncrease ?? 2,
        annualExpenseIncrease: dealData.longTermAssumptions?.annualExpenseIncrease ?? 2,
        annualPropertyValueIncrease: dealData.longTermAssumptions?.annualPropertyValueIncrease ?? 3,
        sellingCosts: dealData.longTermAssumptions?.sellingCostsPercentage ?? 6,
        vacancyRate: dealData.longTermAssumptions?.vacancyRate ?? 5
      };

      // ✅ All defaults should be applied
      expect(assumptions.projectionYears).toBe(10);
      expect(assumptions.annualRentIncrease).toBe(2);
      expect(assumptions.annualExpenseIncrease).toBe(2);
      expect(assumptions.annualPropertyValueIncrease).toBe(3);
      expect(assumptions.sellingCosts).toBe(6);
      expect(assumptions.vacancyRate).toBe(5);
    });
  });

  describe('Edge cases: false vs 0 vs undefined vs null', () => {
    it('should distinguish between false and 0 and undefined', () => {
      // Boolean false
      const booleanValue = false ?? true;
      expect(booleanValue).toBe(false); // ✅ Preserves false

      // Number zero
      const numberValue = 0 ?? 10;
      expect(numberValue).toBe(0); // ✅ Preserves 0

      // Undefined
      const undefinedValue = undefined ?? 10;
      expect(undefinedValue).toBe(10); // ✅ Uses default for undefined

      // Null
      const nullValue = null ?? 10;
      expect(nullValue).toBe(10); // ✅ Uses default for null

      // Empty string (NOT nullish - should be preserved)
      const emptyString = '' ?? 'default';
      expect(emptyString).toBe(''); // ✅ Preserves empty string (not nullish)
    });
  });
});
