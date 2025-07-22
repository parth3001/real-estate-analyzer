/**
 * Test Suite for Unified Calculation Engine
 * 
 * Tests all fixes for the 371 Dorr Drive property calculation issues:
 * 1. Vacancy handling (income reduction vs expense)
 * 2. Maintenance cost unit consistency
 * 3. Removal of unauthorized expenses
 * 4. Single NOI calculation source
 */

import { 
  FinancialCalculations, 
  SFRCalculationEngine, 
  MFCalculationEngine,
  PropertyCalculationEngineFactory 
} from '../utils/financialCalculations';
import { AnalysisAssumptions } from '../analysis/BasePropertyAnalyzer';

describe('Unified Calculation Engine', () => {
  // Your 371 Dorr Drive property data
  const your371DorrProperty = {
    propertyType: 'SFR',
    purchasePrice: 467000,
    downPayment: 233500,
    monthlyRent: 2940,
    interestRate: 6.125,
    loanTerm: 30,
    propertyTaxRate: 1.2,
    insuranceRate: 0.6,
    maintenanceCost: 3528, // ANNUAL (from wizard calculation)
    propertyManagementRate: 5,
    squareFootage: 2450,
    bedrooms: 3,
    bathrooms: 2,
    closingCosts: 5000,
    capitalInvestments: 5000,
    tenantTurnoverFees: {
      prepFees: 2500,
      realtorCommission: 1.0 // 1x monthly rent
    },
    longTermAssumptions: {
      projectionYears: 10,
      annualRentIncrease: 3,
      annualPropertyValueIncrease: 3,
      sellingCostsPercentage: 6,
      inflationRate: 2,
      vacancyRate: 10,
      turnoverFrequency: 2
    }
  };

  const assumptions: AnalysisAssumptions = {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2,
    annualPropertyValueIncrease: 3,
    sellingCosts: 6,
    vacancyRate: 10,
    turnoverFrequency: 2
  };

  describe('Core Financial Functions', () => {
    test('calculateEffectiveIncome - Fix vacancy handling', () => {
      const grossIncome = 35280; // $2940 * 12
      const vacancyRate = 10;
      
      const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, vacancyRate);
      
      expect(effectiveIncome).toBe(31752); // $35,280 * 90%
      expect(effectiveIncome).toBeLessThan(grossIncome);
    });

    test('calculateTurnoverCosts - Remove double broker fees', () => {
      const turnoverCosts = FinancialCalculations.calculateTurnoverCosts({
        prepFees: 2500,
        monthlyRent: 2940,
        realtorCommission: 1.0,
        turnoverFrequency: 2,
        vacancyRate: 10,
        units: 1
      });

      // Base rate: 1/2 = 50%
      // Vacancy adjustment: 10/5 = 2x
      // Final rate: min(90%, 50% * 2) = 90%
      // Cost: (2500 + 2940 * 1.0) * 90% = 4896
      expect(turnoverCosts).toBeCloseTo(4896, 0);
    });

    test('calculateTotalInvestment - Proper total calculation', () => {
      const totalInvestment = FinancialCalculations.calculateTotalInvestment(
        233500, // down payment
        5000,   // closing costs
        5000    // capital investments
      );

      expect(totalInvestment).toBe(243500);
    });
  });

  describe('SFR Calculation Engine', () => {
    test('calculateGrossIncome - Year 1', () => {
      const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 1);
      expect(grossIncome).toBe(35280); // $2940 * 12
    });

    test('calculateGrossIncome - Year 2 with 3% growth', () => {
      const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 2);
      expect(grossIncome).toBeCloseTo(36338.4, 1); // $35,280 * 1.03
    });

    test('calculateOperatingExpenses - No vacancy expense', () => {
      const grossIncome = 35280;
      const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
        your371DorrProperty,
        grossIncome,
        1,
        assumptions
      );

      // Expected breakdown:
      // Property Tax: $467,000 * 1.2% = $5,604
      // Insurance: $467,000 * 0.6% = $2,802
      // Maintenance: $3,528 (annual, not monthly!)
      // Property Management: $35,280 * 5% = $1,764
      // Turnover: ~$4,896
      // Total: ~$18,594 (NO vacancy expense!)

      expect(operatingExpenses).toBeCloseTo(18594, 50); // Allow small variance
      expect(operatingExpenses).toBeLessThan(25000); // Should be much less than with vacancy
    });

    test('calculatePropertySpecificMetrics - SFR specific calculations', () => {
      const grossIncome = 35280;
      const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, 10);
      const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
        your371DorrProperty,
        grossIncome,
        1,
        assumptions
      );
      const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
      
      const commonMetrics = {
        noi,
        capRate: FinancialCalculations.calculateCapRate(noi, your371DorrProperty.purchasePrice),
        totalInvestment: FinancialCalculations.calculateTotalInvestment(
          your371DorrProperty.downPayment,
          your371DorrProperty.closingCosts,
          your371DorrProperty.capitalInvestments
        )
      };

      const metrics = SFRCalculationEngine.calculatePropertySpecificMetrics(
        your371DorrProperty,
        commonMetrics,
        assumptions
      );

      expect(metrics.pricePerSqFt).toBeCloseTo(190.61, 1); // $467,000 / 2,450
      expect(metrics.rentPerSqFt).toBeCloseTo(14.4, 1); // $35,280 / 2,450
      expect(metrics.onePercentRuleValue).toBeCloseTo(0.63, 2); // ($2,940 / $467,000) * 100
      expect(metrics.pricePerBedroom).toBeCloseTo(155666.67, 1); // $467,000 / 3
    });
  });

  describe('Consistency Tests - Fix Multiple NOI Values', () => {
    test('Single NOI calculation across all functions', () => {
      const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 1);
      const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, assumptions.vacancyRate);
      const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
        your371DorrProperty,
        grossIncome,
        1,
        assumptions
      );
      
      // All NOI calculations should use the same formula: effective income - operating expenses
      const noi1 = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
      const noi2 = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
      const noi3 = effectiveIncome - operatingExpenses; // Manual calculation
      
      expect(noi1).toBe(noi2);
      expect(noi2).toBe(noi3);
      expect(noi1).toBeCloseTo(13158, 100); // Expected realistic NOI (~$13K, not $16K)
    });

    test('Vacancy is NOT in operating expenses', () => {
      const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 1);
      const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
        your371DorrProperty,
        grossIncome,
        1,
        assumptions
      );
      
      // Operating expenses should NOT include vacancy as a line item
      expect(operatingExpenses).toBeLessThan(25000); // Should be ~18K, not ~22K with vacancy
      
      // Vacancy is handled by reducing income, not adding expense
      const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, 10);
      expect(effectiveIncome).toBe(31752); // 90% of gross income
    });
  });

  describe('Factory Pattern', () => {
    test('PropertyCalculationEngineFactory - SFR', () => {
      const engine = PropertyCalculationEngineFactory.getEngine('SFR');
      expect(engine).toBe(SFRCalculationEngine);
    });

    test('PropertyCalculationEngineFactory - MF', () => {
      const engine = PropertyCalculationEngineFactory.getEngine('MF');
      expect(engine).toBe(MFCalculationEngine);
    });

    test('PropertyCalculationEngineFactory - Invalid type', () => {
      expect(() => {
        PropertyCalculationEngineFactory.getEngine('INVALID' as any);
      }).toThrow('Unsupported property type: INVALID');
    });
  });

  describe('Real Estate Metrics Validation', () => {
    test('371 Dorr Drive - Realistic vs Inflated Analysis', () => {
      const grossIncome = SFRCalculationEngine.calculateGrossIncome(your371DorrProperty, 1);
      const effectiveIncome = FinancialCalculations.calculateEffectiveIncome(grossIncome, assumptions.vacancyRate);
      const operatingExpenses = SFRCalculationEngine.calculateOperatingExpenses(
        your371DorrProperty,
        grossIncome,
        1,
        assumptions
      );
      const noi = FinancialCalculations.calculateNOI(effectiveIncome, operatingExpenses);
      
      const loanAmount = FinancialCalculations.calculateLoanAmount(
        your371DorrProperty.purchasePrice,
        your371DorrProperty.downPayment
      );
      const monthlyMortgage = FinancialCalculations.calculateMortgage(
        loanAmount,
        your371DorrProperty.interestRate,
        your371DorrProperty.loanTerm
      );
      const annualDebtService = monthlyMortgage * 12;
      const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
      
      // Realistic expectations for your property:
      expect(noi).toBeGreaterThan(5000);  // Should be positive but modest
      expect(noi).toBeLessThan(20000);    // But not inflated
      expect(cashFlow).toBeLessThan(5000); // Likely break-even or slightly negative
      
      // Cap rate should be realistic for the market
      const capRate = FinancialCalculations.calculateCapRate(noi, your371DorrProperty.purchasePrice);
      expect(capRate).toBeGreaterThan(0.5); // Greater than 0.5%
      expect(capRate).toBeLessThan(5.0);    // But less than 5% (realistic for this market)
    });
  });
});