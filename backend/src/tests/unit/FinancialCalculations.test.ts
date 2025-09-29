/**
 * Unit Tests for Financial Calculations
 * Validates IRR calculation returns decimal format consistently
 */

import { FinancialCalculations } from '../../utils/financialCalculations';

describe('FinancialCalculations', () => {
  describe('calculateIRR', () => {
    it('should return IRR as decimal format (not percentage)', () => {
      // Simple cash flows: -100k investment, +10k annually for 12 years
      const cashFlows = [
        -100000, // Initial investment
        10000, 10000, 10000, 10000, 10000, 10000,  // Years 1-6
        10000, 10000, 10000, 10000, 10000, 110000  // Years 7-12 (last includes principal)
      ];

      const irr = FinancialCalculations.calculateIRR(cashFlows);

      // Should be approximately 10% (0.10), not 10 or 1000%
      expect(irr).toBeGreaterThan(0.08);   // Greater than 8%
      expect(irr).toBeLessThan(0.12);      // Less than 12%
      expect(irr).toBeCloseTo(0.10, 2);    // Approximately 10%

      // Key assertion: Should NOT be in percentage format
      expect(irr).toBeLessThan(1.0);       // Should be decimal, not percentage
    });

    it('should handle real estate investment scenario', () => {
      // Realistic RE scenario: $350k investment, modest cash flow, appreciation
      const cashFlows = [
        -350000,  // Initial investment
        -6000,    // Year 1: Negative cash flow
        -3000,    // Year 2: Small negative
        1000,     // Year 3: Break even
        5000,     // Year 4-9: Positive cash flow
        8000, 12000, 15000, 18000, 20000,
        420000    // Year 10: Sale proceeds + final cash flow
      ];

      const irr = FinancialCalculations.calculateIRR(cashFlows);

      // Should be reasonable real estate return (5-15%)
      expect(irr).toBeGreaterThan(0.03);   // > 3%
      expect(irr).toBeLessThan(0.20);      // < 20%

      // Key assertion: Decimal format
      expect(irr).toBeLessThan(1.0);
    });

    it('should handle edge case: break-even scenario', () => {
      const cashFlows = [
        -100000,  // Investment
        10000, 10000, 10000, 10000, 10000,  // Returns exactly equal investment
        10000, 10000, 10000, 10000, 10000
      ];

      const irr = FinancialCalculations.calculateIRR(cashFlows);

      // Should be close to 0% (break-even)
      expect(irr).toBeGreaterThan(-0.05);  // > -5%
      expect(irr).toBeLessThan(0.05);      // < 5%
      expect(irr).toBeLessThan(1.0);       // Decimal format
    });

    it('should prevent the 962.3% formatting bug', () => {
      // This test ensures we don't accidentally return percentage-formatted values
      const typicalCashFlows = [
        -250000,  // Property investment
        25000, 30000, 35000, 40000, 45000,  // Growing cash flows
        300000    // Sale proceeds
      ];

      const irr = FinancialCalculations.calculateIRR(typicalCashFlows);

      // The bug would return something like 9.623 (for 9.623%)
      // Which gets formatted as 962.3% in the frontend

      // Correct behavior: return 0.09623 (decimal)
      expect(irr).toBeLessThan(1.0);           // Must be decimal
      expect(irr).toBeGreaterThan(0.0);        // Should be positive for this scenario

      // If IRR is ~10%, should be ~0.10, NOT ~10
      if (irr > 0.08 && irr < 0.12) {
        // This is the expected range - should be decimal
        expect(irr * 100).toBeCloseTo(10, 1);  // When multiplied by 100, should be ~10%
      }

      // Failure case: if function returned 9.623 instead of 0.09623
      expect(irr).toBeLessThan(5.0);  // Should never be a large number like 9.623
    });

    it('should maintain precision for small IRR values', () => {
      // Low-return scenario
      const cashFlows = [
        -1000000,  // Large investment
        30000, 32000, 34000, 36000, 38000,  // Small relative returns
        1050000    // Small gain on exit
      ];

      const irr = FinancialCalculations.calculateIRR(cashFlows);

      // Should be small positive decimal
      expect(irr).toBeGreaterThan(0.0);
      expect(irr).toBeLessThan(0.10);     // Less than 10%
      expect(irr).toBeLessThan(1.0);      // Decimal format

      // Should have reasonable precision
      expect(Number.isFinite(irr)).toBe(true);
      expect(irr).not.toBeNaN();
    });
  });
});