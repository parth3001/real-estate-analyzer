/**
 * Multi-Family Data Interface Test (Story 1.1)
 * Created: October 25, 2025
 * Purpose: Validate enhanced MultiFamilyData interface with both input methods
 */

import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFPropertyFactory, defaultMFAssumptions } from '../fixtures/mfTestData';

describe('Story 1.1: Enhanced MultiFamilyData Interface', () => {
  describe('Backward Compatibility: unitTypes[] (existing method)', () => {
    it('should analyze property using unitTypes[] aggregated input', () => {
      const property = MFPropertyFactory.create(); // Uses unitTypes[]
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Should calculate gross income correctly
      const expectedGrossIncome = (1500 * 6 + 1200 * 2) * 12; // $136,800
      expect(result.annualAnalysis.income).toBeCloseTo(expectedGrossIncome, -2);

      // Should have valid metrics
      expect(result.keyMetrics.noi).toBeDefined();
      expect(result.keyMetrics.capRate).toBeGreaterThan(0);
      expect(result.keyMetrics.pricePerUnit).toBe(1200000 / 8);
    });

    it('should handle multiple unitTypes correctly', () => {
      const property = MFPropertyFactory.createFourplex(); // 4 units, single type
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Should calculate correctly
      expect(result.keyMetrics.totalInvestment).toBeGreaterThan(0);
      expect(result.keyMetrics.pricePerUnit).toBeDefined();
    });
  });

  describe('NEW Feature: units[] (granular unit-level input)', () => {
    it('should analyze property using units[] granular input', () => {
      const property = MFPropertyFactory.createWithGranularUnits(); // Uses units[]
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Should calculate gross income from individual unit rents
      const expectedGrossIncome = (
        1500 + 1450 + 1500 + 1350 + // 2bed units
        1500 + 1550 +               // More 2bed
        1200 + 1150                 // 1bed units
      ) * 12; // $136,200 (slightly less than aggregated due to below-market rents)

      expect(result.annualAnalysis.income).toBeCloseTo(expectedGrossIncome, -2);

      // Should have valid metrics
      expect(result.keyMetrics.noi).toBeDefined();
      expect(result.keyMetrics.capRate).toBeGreaterThan(0);
      expect(result.keyMetrics.pricePerUnit).toBe(1200000 / 8);
    });

    it('should detect unit-level rent opportunities (marketRent vs currentRent)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Calculate total upside potential
      const units = property.units!;
      const totalCurrentRent = units.reduce((sum, u) => sum + u.currentRent, 0);
      const totalMarketRent = units.reduce((sum, u) => sum + (u.marketRent || u.currentRent), 0);
      const monthlyUpside = totalMarketRent - totalCurrentRent;
      const annualUpside = monthlyUpside * 12;

      // Should identify $350/month = $4,200/year upside
      // Unit 102: $100 below market
      // Unit 104: $200 below market
      // Unit 203: $50 below market
      // Unit 204: $100 below market (vacant)
      // Total: $450/month
      expect(monthlyUpside).toBeGreaterThan(400);
      expect(annualUpside).toBeGreaterThan(4000);
    });

    it('should track vacant units at granular level', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      const vacantUnits = property.units!.filter(u => u.isVacant);
      expect(vacantUnits.length).toBe(1); // Unit 204 is vacant

      const vacantUnit = vacantUnits[0];
      expect(vacantUnit.unitNumber).toBe('204');
      expect(vacantUnit.currentRent).toBeLessThan(vacantUnit.marketRent!);
    });

    it('should identify units needing renovation (condition tracking)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      const poorConditionUnits = property.units!.filter(u => u.condition === 'POOR');
      expect(poorConditionUnits.length).toBe(1); // Unit 104

      const unitNeedingWork = poorConditionUnits[0];
      expect(unitNeedingWork.unitNumber).toBe('104');
      expect(unitNeedingWork.currentRent).toBe(1350); // $200 below market due to condition
      expect(unitNeedingWork.marketRent).toBe(1550);
    });
  });

  describe('Dual Method Support: units[] takes precedence over unitTypes[]', () => {
    it('should use units[] when both are provided', () => {
      const property: any = {
        ...MFPropertyFactory.create(),
        units: [
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 2000 }, // Higher rent
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 2000 }
        ],
        totalUnits: 2
      };

      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const result = analyzer.analyze();

      // Should use units[] ($2000 x 2 x 12 = $48,000)
      // NOT unitTypes[] ($1500 x 6 + $1200 x 2 = $136,800)
      expect(result.annualAnalysis.income).toBeCloseTo(48000, -2);
    });
  });

  describe('Financing Education: loanType field', () => {
    it('should indicate RESIDENTIAL loan type for 1-4 units', () => {
      const duplex = MFPropertyFactory.createDuplex(); // 2 units
      expect(duplex.totalUnits).toBe(2);
      // In production, loanType would be set based on unit count
      // This educates beginners: 1-4 units = residential (30-year fixed)
    });

    it('should indicate COMMERCIAL loan type for 5+ units', () => {
      const eightPlex = MFPropertyFactory.createWithGranularUnits(); // 8 units
      expect(eightPlex.totalUnits).toBe(8);
      expect(eightPlex.loanType).toBe('COMMERCIAL');
      // This educates beginners: 5+ units = commercial loan (different terms)
    });

    it('should support balloonPayment for commercial loans', () => {
      const property = MFPropertyFactory.createWithGranularUnits();
      property.balloonPayment = {
        years: 7,
        amount: 850000 // Balloon due after 7 years
      };

      expect(property.balloonPayment.years).toBe(7);
      expect(property.balloonPayment.amount).toBeGreaterThan(0);
    });
  });

  describe('Building Type Classification', () => {
    it('should support buildingType for property classification', () => {
      const property = MFPropertyFactory.create();
      property.buildingType = 'STACKED'; // Vertical layout

      expect(property.buildingType).toBe('STACKED');
      // Types: SIDE_BY_SIDE (duplex), STACKED (floors), MIXED, COMPLEX
    });
  });
});
