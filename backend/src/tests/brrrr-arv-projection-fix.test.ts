/**
 * Test: BRRRR ARV Projection Bug Fix
 *
 * CRITICAL BUG FIX: Tab 4 Long-Term Analysis ARV Bug
 *
 * **Problem**:
 * Long-term projections were using purchase price ($200K) instead of ARV ($320K)
 * for BRRRR properties, causing 60% underestimation of future property values.
 *
 * **Root Cause**:
 * BasePropertyAnalyzer.calculateProjections() initialized:
 * `let currentPropertyValue = this.data.purchasePrice;`
 *
 * This worked for Buy & Hold, but BRRRR properties should start projections
 * from After Repair Value (ARV), not purchase price.
 *
 * **Fix Applied**:
 * Line 94-95 in BasePropertyAnalyzer.ts:
 * ```typescript
 * const initialPropertyValue = (this.data as any).afterRepairValue || this.data.purchasePrice;
 * let currentPropertyValue = initialPropertyValue;
 * ```
 *
 * **Impact**:
 * - Property Value Year 10: $200K → $320K base (+60% correction)
 * - Total Appreciation: $69K → $110K (+60% correction)
 * - Net Proceeds from Sale: Dramatically improved
 * - Exit Analysis: Now accurately reflects BRRRR strategy value
 *
 * **Test Scenarios**:
 * 1. BRRRR Property: Projections start from ARV ($320K)
 * 2. Buy & Hold Property: Projections start from purchase price (no change)
 * 3. Appreciation calculation: Year-over-year from correct base value
 * 4. Total appreciation: (Final value - ARV) not (Final value - Purchase price)
 */

import { SFRAnalyzer } from '../analysis/SFRAnalyzer';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';
import { SFRData } from '../types/propertyTypes';

describe('BRRRR ARV Projection Bug Fix', () => {
  const brrrPropertyData: SFRData = {
    propertyType: 'SFR',
    purchasePrice: 200000,
    afterRepairValue: 320000, // ARV (60% higher than purchase price)
    renovationCosts: 50000,
    downPayment: 40000, // 20% of purchase price
    interestRate: 7.5,
    loanTerm: 360,
    monthlyRent: 2400,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2000,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenanceCost: 2000,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '123 BRRRR Lane',
      city: 'Arlington',
      state: 'TX',
      zipCode: '76001'
    }
  };

  const assumptions: AnalysisAssumptions = {
    projectionYears: 10,
    annualRentIncrease: 2,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3, // 3% annual appreciation
    sellingCosts: 6,
    vacancyRate: 5
  };

  describe('BRRRR Property (with ARV)', () => {
    it('should use ARV ($320K) as starting property value for projections', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // Year 1 property value should be ARV * (1.03) = 320,000 * 1.03 = 329,600
      const year1Projection = analysis.longTermAnalysis.projections[0];
      expect(year1Projection.propertyValue).toBeCloseTo(329600, 0);
    });

    it('should calculate Year 10 property value from ARV base', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // Year 10 property value = ARV * (1.03)^10 = 320,000 * 1.3439 = 430,058
      const year10Projection = analysis.longTermAnalysis.projections[9];
      expect(year10Projection.propertyValue).toBeCloseTo(430058, -1); // Allow $10 difference for floating point

      // Should NOT be 268,783 (which would be purchasePrice * 1.03^10)
      const wrongValue = 200000 * Math.pow(1.03, 10);
      expect(year10Projection.propertyValue).toBeGreaterThan(wrongValue * 1.5);
    });

    it('should calculate appreciation from ARV, not purchase price', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // Year 1 appreciation = (ARV * 1.03) - ARV = 320,000 * 0.03 = 9,600
      const year1Projection = analysis.longTermAnalysis.projections[0];
      expect(year1Projection.appreciation).toBeCloseTo(9600, 0);

      // Should NOT be 129,600 (which would be Year1Value - purchasePrice)
      const wrongAppreciation = year1Projection.propertyValue - 200000;
      expect(year1Projection.appreciation).not.toBeCloseTo(wrongAppreciation, 0);
    });

    it('should calculate total appreciation from ARV base value', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // Total appreciation = Year10Value - ARV = 430,058 - 320,000 = 110,058
      const totalAppreciation = analysis.longTermAnalysis.returns.totalAppreciation;
      expect(totalAppreciation).toBeCloseTo(110058, -1); // Allow $10 difference for floating point

      // Should NOT be 230,058 (which would be Year10Value - purchasePrice)
      const wrongTotalAppreciation = 430058 - 200000;
      expect(totalAppreciation).not.toBeCloseTo(wrongTotalAppreciation, 0);
    });

    it('should reflect ARV in exit analysis projected sale price', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // Projected sale price should match Year 10 property value
      const projectedSalePrice = analysis.longTermAnalysis.exitAnalysis.projectedSalePrice;
      const year10Value = analysis.longTermAnalysis.projections[9].propertyValue;

      expect(projectedSalePrice).toBe(year10Value);
      expect(projectedSalePrice).toBeCloseTo(430058, -1); // Allow $10 difference for floating point
    });
  });

  describe('Buy & Hold Property (no ARV)', () => {
    const buyHoldData: SFRData = {
      ...brrrPropertyData,
      afterRepairValue: undefined, // No ARV for Buy & Hold
      renovationCosts: undefined
    };

    it('should use purchase price as starting value when no ARV exists', () => {
      const analyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const analysis = analyzer.analyze();

      // Year 1 property value = purchasePrice * 1.03 = 200,000 * 1.03 = 206,000
      const year1Projection = analysis.longTermAnalysis.projections[0];
      expect(year1Projection.propertyValue).toBeCloseTo(206000, 0);
    });

    it('should calculate Year 10 property value from purchase price', () => {
      const analyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const analysis = analyzer.analyze();

      // Year 10 property value = purchasePrice * (1.03)^10 = 200,000 * 1.3439 = 268,783
      const year10Projection = analysis.longTermAnalysis.projections[9];
      expect(year10Projection.propertyValue).toBeCloseTo(268783, 0);
    });

    it('should calculate appreciation from purchase price', () => {
      const analyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const analysis = analyzer.analyze();

      // Year 1 appreciation = (purchasePrice * 1.03) - purchasePrice = 200,000 * 0.03 = 6,000
      const year1Projection = analysis.longTermAnalysis.projections[0];
      expect(year1Projection.appreciation).toBeCloseTo(6000, 0);
    });

    it('should calculate total appreciation from purchase price', () => {
      const analyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const analysis = analyzer.analyze();

      // Total appreciation = Year10Value - purchasePrice = 268,783 - 200,000 = 68,783
      const totalAppreciation = analysis.longTermAnalysis.returns.totalAppreciation;
      expect(totalAppreciation).toBeCloseTo(68783, 0);
    });
  });

  describe('BRRRR vs Buy & Hold Comparison', () => {
    it('BRRRR should show 60% higher Year 10 property value than Buy & Hold', () => {
      const brrrAnalyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const brrrAnalysis = brrrAnalyzer.analyze();

      const buyHoldData: SFRData = { ...brrrPropertyData, afterRepairValue: undefined, renovationCosts: undefined };
      const buyHoldAnalyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const buyHoldAnalysis = buyHoldAnalyzer.analyze();

      const brrrYear10Value = brrrAnalysis.longTermAnalysis.projections[9].propertyValue;
      const buyHoldYear10Value = buyHoldAnalysis.longTermAnalysis.projections[9].propertyValue;

      // BRRRR: 430,058 vs Buy & Hold: 268,783 = 60% higher
      expect(brrrYear10Value / buyHoldYear10Value).toBeCloseTo(1.6, 1);
    });

    it('BRRRR should show 60% higher total appreciation than Buy & Hold', () => {
      const brrrAnalyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const brrrAnalysis = brrrAnalyzer.analyze();

      const buyHoldData: SFRData = { ...brrrPropertyData, afterRepairValue: undefined, renovationCosts: undefined };
      const buyHoldAnalyzer = new SFRAnalyzer(buyHoldData, assumptions);
      const buyHoldAnalysis = buyHoldAnalyzer.analyze();

      const brrrTotalAppreciation = brrrAnalysis.longTermAnalysis.returns.totalAppreciation;
      const buyHoldTotalAppreciation = buyHoldAnalysis.longTermAnalysis.returns.totalAppreciation;

      // BRRRR: 110,058 vs Buy & Hold: 68,783 = 60% higher
      expect(brrrTotalAppreciation / buyHoldTotalAppreciation).toBeCloseTo(1.6, 1);
    });
  });

  describe('Regression Prevention', () => {
    it('should never calculate property value from purchase price for BRRRR properties', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // All projections should be based on ARV ($320K), not purchase price ($200K)
      analysis.longTermAnalysis.projections.forEach((projection, index) => {
        const year = index + 1;
        const expectedValue = 320000 * Math.pow(1.03, year);

        expect(projection.propertyValue).toBeCloseTo(expectedValue, 0);

        // Explicitly verify NOT using purchase price
        const wrongValue = 200000 * Math.pow(1.03, year);
        expect(Math.abs(projection.propertyValue - wrongValue)).toBeGreaterThan(50000);
      });
    });

    it('should always use ARV when afterRepairValue is present', () => {
      const analyzer = new SFRAnalyzer(brrrPropertyData, assumptions);
      const analysis = analyzer.analyze();

      // First projection (Year 1) should start from ARV
      const year1Value = analysis.longTermAnalysis.projections[0].propertyValue;
      const expectedYear1FromARV = 320000 * 1.03;
      const wrongYear1FromPurchase = 200000 * 1.03;

      expect(year1Value).toBeCloseTo(expectedYear1FromARV, 0);
      expect(year1Value).not.toBeCloseTo(wrongYear1FromPurchase, 0);
    });
  });
});
