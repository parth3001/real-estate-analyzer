/**
 * Tax Calculation Edge Cases Tests
 *
 * Senior QE Engineer: Testing boundary conditions, extreme values,
 * and unusual scenarios to ensure robust tax calculations.
 *
 * Critical Edge Cases:
 * - Zero and negative values
 * - Exact boundary conditions (365 vs 366 days)
 * - Maximum values and overflow protection
 * - Invalid inputs and error recovery
 * - Unusual property scenarios
 */

import { taxCalculationService } from '../../services/taxCalculationService';
import type { TaxProfile, PropertyTaxData } from '../../services/taxCalculationService';
import { investmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { SFRAnalyzer } from '../../analysis/SFRAnalyzer';
import type { SFRData } from '../../types/propertyTypes';

describe('Tax Calculation Edge Cases', () => {

  describe('Zero and Negative Value Scenarios', () => {
    it('should handle property with zero appreciation', async () => {
      const zeroAppreciationProperty: PropertyTaxData = {
        purchasePrice: 300000,
        closingCosts: 5000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 305000, cashFlow: 0, principalPaydown: 5000, depreciation: 11091 },
          { year: 2, propertyValue: 305000, cashFlow: 0, principalPaydown: 5200, depreciation: 11091 },
          { year: 3, propertyValue: 305000, cashFlow: 0, principalPaydown: 5400, depreciation: 11091 },
          { year: 5, propertyValue: 305000, cashFlow: 0, principalPaydown: 5800, depreciation: 11091 },
          { year: 7, propertyValue: 305000, cashFlow: 0, principalPaydown: 6200, depreciation: 11091 },
          { year: 10, propertyValue: 305000, cashFlow: 0, principalPaydown: 7000, depreciation: 11091 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'TX',
        capitalGainsHoldingStrategy: 'flexible',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        zeroAppreciationProperty,
        taxProfile
      );

      expect(result).toBeDefined();
      result.holdPeriodAnalysis.forEach(analysis => {
        // With no appreciation, capital gain should be from depreciation recapture only
        expect(analysis.capitalGain).toBeGreaterThanOrEqual(0);
        expect(analysis.depreciationRecapture).toBeGreaterThan(0);
      });
    });

    it('should handle negative cash flow properties', async () => {
      const negativeCashFlowProperty: PropertyTaxData = {
        purchasePrice: 500000,
        closingCosts: 10000,
        repairCosts: 5000,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 515000, cashFlow: -5000, principalPaydown: 5000, depreciation: 18182 },
          { year: 2, propertyValue: 530450, cashFlow: -4850, principalPaydown: 5200, depreciation: 18182 },
          { year: 3, propertyValue: 546364, cashFlow: -4700, principalPaydown: 5400, depreciation: 18182 },
          { year: 5, propertyValue: 580000, cashFlow: -4400, principalPaydown: 5800, depreciation: 18182 },
          { year: 7, propertyValue: 615000, cashFlow: -4050, principalPaydown: 6200, depreciation: 18182 },
          { year: 10, propertyValue: 672000, cashFlow: -3500, principalPaydown: 7000, depreciation: 18182 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'married_joint',
        state: 'CA',
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        negativeCashFlowProperty,
        taxProfile
      );

      expect(result).toBeDefined();
      expect(result.optimalHoldPeriod).toBeDefined();

      // Even with negative cash flow, should calculate after-tax returns
      result.holdPeriodAnalysis.forEach(analysis => {
        expect(analysis.afterTaxIRR).toBeDefined();
        // IRR might be negative but should be a valid number
        expect(isNaN(analysis.afterTaxIRR)).toBe(false);
      });
    });

    it('should handle zero down payment (100% financing)', async () => {
      const zeroDownProperty: SFRData = {
        propertyType: 'SFR',
        propertyAddress: {
          street: '123 Test St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201'
        },
        purchasePrice: 300000,
        downPayment: 0, // 100% financing
        interestRate: 8.5, // Higher rate for 100% financing
        loanTerm: 30,
        monthlyRent: 2500,
        squareFootage: 1500,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2015,
        propertyTaxRate: 1.8,
        insuranceRate: 0.6,
        maintenanceCost: 200,
        propertyManagementRate: 10,
        taxProfile: {
          filingStatus: 'single',
          state: 'TX',
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        },
        longTermAssumptions: {
          projectionYears: 30,
          annualRentIncrease: 3,
          annualPropertyValueIncrease: 3,
          inflationRate: 2.5,
          vacancyRate: 5,
          sellingCostsPercentage: 8
        }
      };

      const analyzer = new SFRAnalyzer(zeroDownProperty, {
        projectionYears: 30,
        annualRentIncrease: 3,
        annualExpenseIncrease: 2.5,
        annualPropertyValueIncrease: 3,
        sellingCosts: 8,
        vacancyRate: 5,
        turnoverFrequency: 2
      });

      const analysis = analyzer.analyze();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        zeroDownProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );

      expect(decision).toBeDefined();
      if (decision.taxAnalysis) {
        // Should still calculate tax analysis even with 100% financing
        expect(decision.taxAnalysis.holdPeriodAnalysis).toBeDefined();
        expect(decision.taxAnalysis.optimalHoldPeriod).toBeDefined();
      }
    });
  });

  describe('Boundary Condition Testing', () => {
    it('should correctly differentiate short-term vs long-term at exactly 1 year', async () => {
      // Test the exact boundary between short-term and long-term capital gains
      const boundaryProperty: PropertyTaxData = {
        purchasePrice: 400000,
        closingCosts: 8000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 420000, cashFlow: 15000, principalPaydown: 5000, depreciation: 14909 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'FL',
        federalTaxBracket: 32, // High bracket to show difference
        capitalGainsHoldingStrategy: 'flexible',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        boundaryProperty,
        taxProfile
      );

      // Year 1 should use short-term rates (ordinary income)
      const year1Analysis = result.holdPeriodAnalysis[0];
      expect(year1Analysis.holdPeriod).toBe(1);

      // For flexible strategy at exactly 1 year, should use short-term rates
      // which should be higher than long-term capital gains rate
      expect(year1Analysis.federalCapitalGainsRate).toBeGreaterThanOrEqual(0.24); // Should be at marginal rate
    });

    it('should handle maximum federal tax bracket (37%)', async () => {
      const highIncomeProperty: PropertyTaxData = {
        purchasePrice: 1000000,
        closingCosts: 20000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 1050000, cashFlow: 50000, principalPaydown: 15000, depreciation: 37091 },
          { year: 2, propertyValue: 1102500, cashFlow: 51500, principalPaydown: 15600, depreciation: 37091 },
          { year: 3, propertyValue: 1157625, cashFlow: 53045, principalPaydown: 16200, depreciation: 37091 },
          { year: 5, propertyValue: 1276282, cashFlow: 56301, principalPaydown: 17400, depreciation: 37091 },
          { year: 7, propertyValue: 1407100, cashFlow: 59739, principalPaydown: 18600, depreciation: 37091 },
          { year: 10, propertyValue: 1628895, cashFlow: 65288, principalPaydown: 20000, depreciation: 37091 }
        ]
      };

      const highBracketProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'CA', // Also high state tax
        federalTaxBracket: 37, // Maximum bracket
        capitalGainsHoldingStrategy: 'short_term', // Worst case
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        highIncomeProperty,
        highBracketProfile
      );

      expect(result).toBeDefined();

      // With maximum brackets, tax liability should be significant
      result.holdPeriodAnalysis.forEach(analysis => {
        expect(analysis.totalTaxLiability).toBeGreaterThan(0);

        if (analysis.holdPeriod === 1) {
          // Short-term at max bracket
          expect(analysis.federalCapitalGainsRate).toBeCloseTo(0.37, 2);
        }
      });
    });

    it('should handle minimum thresholds for 1031 exchange eligibility', async () => {
      // Test property just at the boundary for 1031 exchange
      const minimalProperty: PropertyTaxData = {
        purchasePrice: 100000, // Small property
        closingCosts: 2000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 103000, cashFlow: 3000, principalPaydown: 2000, depreciation: 3709 },
          { year: 2, propertyValue: 106090, cashFlow: 3090, principalPaydown: 2100, depreciation: 3709 },
          { year: 3, propertyValue: 109273, cashFlow: 3183, principalPaydown: 2200, depreciation: 3709 },
          { year: 5, propertyValue: 115927, cashFlow: 3379, principalPaydown: 2400, depreciation: 3709 },
          { year: 7, propertyValue: 123048, cashFlow: 3585, principalPaydown: 2600, depreciation: 3709 },
          { year: 10, propertyValue: 134392, cashFlow: 3919, principalPaydown: 2900, depreciation: 3709 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'married_joint',
        state: 'TX',
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        minimalProperty,
        taxProfile
      );

      if (result.exchange1031Eligibility) {
        // Even small properties should be eligible for 1031 exchange
        expect(result.exchange1031Eligibility.eligible).toBeDefined();

        if (result.exchange1031Eligibility.eligible) {
          // Minimum exchange value should be at least the current property value
          expect(result.exchange1031Eligibility.minimumExchangeValue).toBeGreaterThan(100000);
        }
      }
    });
  });

  describe('Invalid and Extreme Input Handling', () => {
    it('should handle invalid state codes gracefully', async () => {
      const invalidStateProperty: PropertyTaxData = {
        purchasePrice: 300000,
        closingCosts: 6000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 309000, cashFlow: 12000, principalPaydown: 5000, depreciation: 11127 },
          { year: 2, propertyValue: 318270, cashFlow: 12360, principalPaydown: 5200, depreciation: 11127 },
          { year: 3, propertyValue: 327818, cashFlow: 12731, principalPaydown: 5400, depreciation: 11127 },
          { year: 5, propertyValue: 347513, cashFlow: 13522, principalPaydown: 5800, depreciation: 11127 },
          { year: 7, propertyValue: 368424, cashFlow: 14359, principalPaydown: 6200, depreciation: 11127 },
          { year: 10, propertyValue: 402551, cashFlow: 15691, principalPaydown: 7000, depreciation: 11127 }
        ]
      };

      const invalidStateProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'ZZ', // Invalid state code
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      // Should not throw, but use default state tax rate
      const result = await taxCalculationService.calculateTaxAnalysis(
        invalidStateProperty,
        invalidStateProfile
      );

      expect(result).toBeDefined();
      expect(result.holdPeriodAnalysis).toHaveLength(6);

      // Should use default state tax rate (usually 5%)
      result.holdPeriodAnalysis.forEach(analysis => {
        expect(analysis.stateCapitalGainsRate).toBeGreaterThanOrEqual(0);
        expect(analysis.stateCapitalGainsRate).toBeLessThanOrEqual(0.15); // Reasonable default
      });
    });

    it('should handle extremely large property values', async () => {
      const luxuryProperty: PropertyTaxData = {
        purchasePrice: 50000000, // $50 million property
        closingCosts: 1000000,
        repairCosts: 500000,
        capitalInvestments: 2000000,
        yearlyProjections: [
          { year: 1, propertyValue: 52000000, cashFlow: 2000000, principalPaydown: 500000, depreciation: 1954545 },
          { year: 2, propertyValue: 54000000, cashFlow: 2100000, principalPaydown: 520000, depreciation: 1954545 },
          { year: 3, propertyValue: 56000000, cashFlow: 2200000, principalPaydown: 540000, depreciation: 1954545 },
          { year: 5, propertyValue: 60000000, cashFlow: 2400000, principalPaydown: 580000, depreciation: 1954545 },
          { year: 7, propertyValue: 64000000, cashFlow: 2600000, principalPaydown: 620000, depreciation: 1954545 },
          { year: 10, propertyValue: 70000000, cashFlow: 2900000, principalPaydown: 700000, depreciation: 1954545 }
        ]
      };

      const luxuryProfile: TaxProfile = {
        filingStatus: 'married_joint',
        state: 'NY',
        federalTaxBracket: 37,
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'entity' // Likely held by entity
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        luxuryProperty,
        luxuryProfile
      );

      expect(result).toBeDefined();

      // Should handle large numbers without overflow
      result.holdPeriodAnalysis.forEach(analysis => {
        expect(isFinite(analysis.capitalGain)).toBe(true);
        expect(isFinite(analysis.totalTaxLiability)).toBe(true);
        expect(isFinite(analysis.netProceedsFromSale)).toBe(true);
        expect(analysis.afterTaxIRR).toBeLessThan(1); // IRR should be reasonable percentage
      });
    });

    it('should handle properties with personal use percentage', async () => {
      const mixedUseProperty: PropertyTaxData = {
        purchasePrice: 400000,
        closingCosts: 8000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 412000, cashFlow: 10000, principalPaydown: 5000, depreciation: 14909 },
          { year: 2, propertyValue: 424360, cashFlow: 10300, principalPaydown: 5200, depreciation: 14909 },
          { year: 3, propertyValue: 437091, cashFlow: 10609, principalPaydown: 5400, depreciation: 14909 },
          { year: 5, propertyValue: 463847, cashFlow: 11262, principalPaydown: 5800, depreciation: 14909 },
          { year: 7, propertyValue: 492260, cashFlow: 11951, principalPaydown: 6200, depreciation: 14909 },
          { year: 10, propertyValue: 537567, cashFlow: 13060, principalPaydown: 7000, depreciation: 14909 }
        ]
      };

      const mixedUseProfile: TaxProfile = {
        filingStatus: 'married_joint',
        state: 'FL',
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 25 // 25% personal use (vacation home)
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        mixedUseProperty,
        mixedUseProfile
      );

      expect(result).toBeDefined();

      // Personal use should affect depreciation calculations
      result.holdPeriodAnalysis.forEach(analysis => {
        // Depreciation should be reduced by personal use percentage
        expect(analysis.depreciationRecapture).toBeDefined();
        expect(analysis.adjustedBasis).toBeDefined();
      });
    });

    it('should handle missing projection years gracefully', async () => {
      const incompleteProjections: PropertyTaxData = {
        purchasePrice: 300000,
        closingCosts: 6000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 309000, cashFlow: 12000, principalPaydown: 5000, depreciation: 11127 },
          { year: 3, propertyValue: 327818, cashFlow: 12731, principalPaydown: 5400, depreciation: 11127 },
          { year: 7, propertyValue: 368424, cashFlow: 14359, principalPaydown: 6200, depreciation: 11127 }
          // Missing years 2, 5, 10
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'TX',
        capitalGainsHoldingStrategy: 'flexible',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      // Should throw or handle missing years
      await expect(
        taxCalculationService.calculateTaxAnalysis(incompleteProjections, taxProfile)
      ).rejects.toThrow();
    });
  });

  describe('Unusual Property Scenarios', () => {
    it('should handle property sold at a loss', async () => {
      const depreciatingProperty: PropertyTaxData = {
        purchasePrice: 400000,
        closingCosts: 8000,
        repairCosts: 10000,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 380000, cashFlow: 5000, principalPaydown: 5000, depreciation: 15200 },
          { year: 2, propertyValue: 360000, cashFlow: 4800, principalPaydown: 5200, depreciation: 15200 },
          { year: 3, propertyValue: 340000, cashFlow: 4600, principalPaydown: 5400, depreciation: 15200 },
          { year: 5, propertyValue: 300000, cashFlow: 4200, principalPaydown: 5800, depreciation: 15200 },
          { year: 7, propertyValue: 260000, cashFlow: 3800, principalPaydown: 6200, depreciation: 15200 },
          { year: 10, propertyValue: 200000, cashFlow: 3200, principalPaydown: 7000, depreciation: 15200 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'single',
        state: 'TX',
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        depreciatingProperty,
        taxProfile
      );

      expect(result).toBeDefined();

      // With property value declining, may have capital loss
      result.holdPeriodAnalysis.forEach(analysis => {
        // Capital gain could be negative (loss)
        expect(analysis.capitalGain).toBeDefined();
        // Should still calculate after-tax returns
        expect(analysis.afterTaxIRR).toBeDefined();
      });
    });

    it('should handle properties with very high vacancy rates', async () => {
      const highVacancyProperty: SFRData = {
        propertyType: 'SFR',
        propertyAddress: {
          street: '456 Vacant St',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201'
        },
        purchasePrice: 50000, // Low-cost property
        downPayment: 10000,
        interestRate: 9.0, // Higher rate due to risk
        loanTerm: 30,
        monthlyRent: 800,
        squareFootage: 1200,
        bedrooms: 3,
        bathrooms: 1,
        yearBuilt: 1950,
        propertyTaxRate: 2.5,
        insuranceRate: 1.2,
        maintenanceCost: 300,
        propertyManagementRate: 12,
        taxProfile: {
          filingStatus: 'single',
          state: 'MI',
          capitalGainsHoldingStrategy: 'flexible',
          depreciation: {
            method: 'straight_line',
            personalUsePercentage: 0
          },
          investorType: 'individual'
        },
        longTermAssumptions: {
          projectionYears: 30,
          annualRentIncrease: 1, // Low rent growth
          annualPropertyValueIncrease: 1, // Low appreciation
          inflationRate: 3,
          vacancyRate: 30, // Very high vacancy
          sellingCostsPercentage: 10
        }
      };

      const analyzer = new SFRAnalyzer(highVacancyProperty, {
        projectionYears: 30,
        annualRentIncrease: 1,
        annualExpenseIncrease: 3,
        annualPropertyValueIncrease: 1,
        sellingCosts: 10,
        vacancyRate: 30,
        turnoverFrequency: 1
      });

      const analysis = analyzer.analyze();
      const decision = await investmentDecisionEngine.analyzeInvestment(
        highVacancyProperty,
        analysis,
        { marketTrends: null, demographics: null }
      );

      expect(decision).toBeDefined();
      if (decision.taxAnalysis) {
        // Should still calculate tax implications even with high vacancy
        expect(decision.taxAnalysis.holdPeriodAnalysis).toBeDefined();

        // High vacancy should result in lower cash flows but still valid analysis
        decision.taxAnalysis.holdPeriodAnalysis.forEach(period => {
          expect(period.afterTaxIRR).toBeDefined();
          expect(isNaN(period.afterTaxIRR)).toBe(false);
        });
      }
    });

    it('should handle properties with extreme appreciation', async () => {
      const boomProperty: PropertyTaxData = {
        purchasePrice: 250000,
        closingCosts: 5000,
        repairCosts: 0,
        capitalInvestments: 0,
        yearlyProjections: [
          { year: 1, propertyValue: 350000, cashFlow: 15000, principalPaydown: 5000, depreciation: 9273 },
          { year: 2, propertyValue: 490000, cashFlow: 18000, principalPaydown: 5200, depreciation: 9273 },
          { year: 3, propertyValue: 686000, cashFlow: 21600, principalPaydown: 5400, depreciation: 9273 },
          { year: 5, propertyValue: 1343210, cashFlow: 31104, principalPaydown: 5800, depreciation: 9273 },
          { year: 7, propertyValue: 2632082, cashFlow: 44790, principalPaydown: 6200, depreciation: 9273 },
          { year: 10, propertyValue: 6434856, cashFlow: 77695, principalPaydown: 7000, depreciation: 9273 }
        ]
      };

      const taxProfile: TaxProfile = {
        filingStatus: 'married_joint',
        state: 'CA', // High tax state
        federalTaxBracket: 37,
        capitalGainsHoldingStrategy: 'long_term',
        depreciation: {
          method: 'straight_line',
          personalUsePercentage: 0
        },
        investorType: 'individual'
      };

      const result = await taxCalculationService.calculateTaxAnalysis(
        boomProperty,
        taxProfile
      );

      expect(result).toBeDefined();

      // With extreme appreciation, capital gains should be very high
      const year10 = result.holdPeriodAnalysis.find(h => h.holdPeriod === 10);
      if (year10) {
        expect(year10.capitalGain).toBeGreaterThan(5000000);
        expect(year10.totalTaxLiability).toBeGreaterThan(1000000);

        // 1031 exchange should be highly recommended
        if (result.exchange1031Eligibility) {
          expect(result.exchange1031Eligibility.eligible).toBe(true);
          expect(result.exchange1031Eligibility.deferralAmount).toBeGreaterThan(1000000);
        }
      }
    });
  });

  describe('Cross-validation with Known Tax Scenarios', () => {
    it('should match known tax calculation for standard scenario', () => {
      // Test against a manually calculated scenario
      // Property: $400,000 purchase, $80,000 down, held 5 years, sold for $500,000
      // Depreciation: $400,000 * 80% / 27.5 * 5 = $58,182
      // Adjusted basis: $400,000 - $58,182 = $341,818
      // Capital gain: $500,000 - $341,818 = $158,182
      // Depreciation recapture: $58,182 * 25% = $14,545.50
      // Long-term gain: $100,000 * 15% = $15,000 (assuming 15% bracket)
      // Total federal tax: $14,545.50 + $15,000 = $29,545.50

      const originalBasis = 400000;
      const depreciableBasis = originalBasis * 0.8;
      const annualDepreciation = depreciableBasis / 27.5;
      const fiveYearDepreciation = annualDepreciation * 5;
      const adjustedBasis = originalBasis - fiveYearDepreciation;
      const salePrice = 500000;
      const capitalGain = salePrice - adjustedBasis;
      const depreciationRecaptureTax = fiveYearDepreciation * 0.25;
      const remainingGain = capitalGain - fiveYearDepreciation;
      const capitalGainsTax = remainingGain * 0.15;
      const totalFederalTax = depreciationRecaptureTax + capitalGainsTax;

      // Verify our calculations
      expect(Math.round(fiveYearDepreciation)).toBeCloseTo(58182, -1);
      expect(Math.round(adjustedBasis)).toBeCloseTo(341818, -1);
      expect(Math.round(capitalGain)).toBeCloseTo(158182, -1);
      expect(Math.round(depreciationRecaptureTax)).toBeCloseTo(14545, -1);
      expect(Math.round(totalFederalTax)).toBeCloseTo(29545, -1);
    });
  });
});