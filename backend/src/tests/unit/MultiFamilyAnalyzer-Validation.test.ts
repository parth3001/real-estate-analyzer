/**
 * Story 1.5: Comprehensive Logging & Validation Tests
 *
 * Tests validation warnings and error handling for MultiFamilyAnalyzer
 * Based on Architect and QE feedback from Story 1.1
 */

import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFPropertyFactory, defaultMFAssumptions } from '../fixtures/mfTestData';
import { MultiFamilyData } from '../../types/propertyTypes';

describe('Story 1.5: MultiFamilyAnalyzer Validation & Logging', () => {
  // Spy on console methods to capture validation warnings
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Validation 1: Unit Count Mismatch (Architect Feedback)', () => {
    it('should warn when units[] length does not match totalUnits', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Deliberately create mismatch: totalUnits says 8, but units[] has only 5
      const mismatchedProperty: MultiFamilyData = {
        ...property,
        totalUnits: 8,
        units: property.units!.slice(0, 5) // Only 5 units instead of 8
      };

      const analyzer = new MultiFamilyAnalyzer(mismatchedProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged validation warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION WARNING: Unit count mismatch')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('totalUnits field: 8')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('units[] array length: 5')
      );
    });

    it('should warn when unitTypes[] aggregated count does not match totalUnits', () => {
      const property = MFPropertyFactory.create();

      // Deliberately create mismatch: totalUnits says 8, but unitTypes sum to 10
      const mismatchedProperty: MultiFamilyData = {
        ...property,
        totalUnits: 8,
        unitTypes: [
          { type: '2bed/1bath', sqft: 900, monthlyRent: 1500, count: 6 },
          { type: '1bed/1bath', sqft: 750, monthlyRent: 1200, count: 4 } // 6 + 4 = 10
        ]
      };

      const analyzer = new MultiFamilyAnalyzer(mismatchedProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged validation warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unitTypes[] count mismatch')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('totalUnits field: 8')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sum of unitTypes[].count: 10')
      );
    });
  });

  describe('Validation 2: Square Footage Mismatch (Architect Feedback)', () => {
    it('should warn when units[] sqft sum differs from totalSqft by >5%', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Create >5% mismatch: totalSqft says 7200, but units sum to 6000
      const mismatchedProperty: MultiFamilyData = {
        ...property,
        totalSqft: 7200,
        units: property.units!.map(unit => ({
          ...unit,
          squareFeet: 750 // 8 units * 750 = 6000 (16.7% difference)
        }))
      };

      const analyzer = new MultiFamilyAnalyzer(mismatchedProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged validation warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Square footage mismatch')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('totalSqft field: 7,200')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sum of units[].squareFeet: 6,000')
      );
    });

    it('should NOT warn when sqft difference is <5% (within tolerance)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Create <5% mismatch: totalSqft says 7200, units sum to 7100 (1.4% difference)
      const acceptableProperty: MultiFamilyData = {
        ...property,
        totalSqft: 7200,
        units: property.units!.map((unit, index) => ({
          ...unit,
          squareFeet: index === 0 ? 788 : 900 // Slight variation, but within 5%
        }))
      };

      const analyzer = new MultiFamilyAnalyzer(acceptableProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should NOT have logged square footage warning
      const sqftWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes('Square footage mismatch')
      );
      expect(sqftWarnings.length).toBe(0);
    });

    it('should warn when unitTypes[] sqft sum differs from totalSqft by >5%', () => {
      const property = MFPropertyFactory.create();

      // Create >5% mismatch
      const mismatchedProperty: MultiFamilyData = {
        ...property,
        totalSqft: 8000, // Says 8000
        unitTypes: [
          { type: '2bed/1bath', sqft: 900, monthlyRent: 1500, count: 6 },
          { type: '1bed/1bath', sqft: 750, monthlyRent: 1200, count: 2 }
        ] // Actual: (900*6) + (750*2) = 6900 (13.75% difference)
      };

      const analyzer = new MultiFamilyAnalyzer(mismatchedProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged validation warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unitTypes[] square footage mismatch')
      );
    });
  });

  describe('Validation 3: Rent Reasonability Checks', () => {
    it('should error when unit has invalid rent ($0 or negative)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Set one unit to $0 rent (invalid)
      const invalidProperty: MultiFamilyData = {
        ...property,
        units: property.units!.map((unit, index) =>
          index === 0 ? { ...unit, currentRent: 0 } : unit
        )
      };

      const analyzer = new MultiFamilyAnalyzer(invalidProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Unit 1 has invalid rent')
      );
    });

    it('should warn when unit rent is >3x average (likely data entry error)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Set one unit to extremely high rent (5x average)
      const unusualProperty: MultiFamilyData = {
        ...property,
        units: property.units!.map((unit, index) =>
          index === 0 ? { ...unit, currentRent: 7500 } : unit // $7500 vs ~$1500 average
        )
      };

      const analyzer = new MultiFamilyAnalyzer(unusualProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('rent appears unusual')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unit rent: $7,500/month')
      );
    });

    it('should warn when unit rent is <0.3x average (suspiciously low)', () => {
      const property = MFPropertyFactory.createWithGranularUnits();

      // Set one unit to extremely low rent (0.2x average)
      const unusualProperty: MultiFamilyData = {
        ...property,
        units: property.units!.map((unit, index) =>
          index === 0 ? { ...unit, currentRent: 300 } : unit // $300 vs ~$1500 average
        )
      };

      const analyzer = new MultiFamilyAnalyzer(unusualProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('rent appears unusual')
      );
    });
  });

  describe('Validation 4: Financial Data Reasonability', () => {
    it('should error when purchase price is $0 or negative', () => {
      const property = MFPropertyFactory.create();

      const invalidProperty: MultiFamilyData = {
        ...property,
        purchasePrice: 0
      };

      const analyzer = new MultiFamilyAnalyzer(invalidProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Purchase price must be greater than $0')
      );
    });

    it('should error when down payment is negative', () => {
      const property = MFPropertyFactory.create();

      const invalidProperty: MultiFamilyData = {
        ...property,
        downPayment: -50000
      };

      const analyzer = new MultiFamilyAnalyzer(invalidProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Down payment cannot be negative')
      );
    });

    it('should error when down payment exceeds purchase price', () => {
      const property = MFPropertyFactory.create();

      const invalidProperty: MultiFamilyData = {
        ...property,
        purchasePrice: 500000,
        downPayment: 600000 // More than purchase price!
      };

      const analyzer = new MultiFamilyAnalyzer(invalidProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Down payment ($600,000) exceeds purchase price ($500,000)')
      );
    });

    it('should warn when down payment <15% for commercial property (5+ units)', () => {
      const property = MFPropertyFactory.create();

      // 8-unit property (commercial) with only 10% down
      const lowDownProperty: MultiFamilyData = {
        ...property,
        totalUnits: 8,
        purchasePrice: 800000,
        downPayment: 80000 // 10% down
      };

      const analyzer = new MultiFamilyAnalyzer(lowDownProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low down payment for commercial property')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Commercial loans (5+ units) typically require 20-25% down')
      );
    });

    it('should NOT warn when down payment is adequate for commercial property', () => {
      const property = MFPropertyFactory.create();

      // 8-unit property with 25% down (adequate)
      const adequateProperty: MultiFamilyData = {
        ...property,
        totalUnits: 8,
        purchasePrice: 800000,
        downPayment: 200000 // 25% down
      };

      const analyzer = new MultiFamilyAnalyzer(adequateProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should NOT have logged commercial loan warning
      const commercialWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes('Low down payment for commercial')
      );
      expect(commercialWarnings.length).toBe(0);
    });
  });

  describe('Validation 5: Parsing Edge Cases (QE Feedback)', () => {
    it('should warn when bedroom parsing fails and defaults are used', () => {
      const property = MFPropertyFactory.create();

      // Use unit type with unparseable format
      const edgeCaseProperty: MultiFamilyData = {
        ...property,
        unitTypes: [
          { type: 'Penthouse Suite', sqft: 1500, monthlyRent: 2500, count: 2 },
          { type: 'Studio', sqft: 500, monthlyRent: 900, count: 4 }
        ]
      };

      const analyzer = new MultiFamilyAnalyzer(edgeCaseProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should have logged parsing warnings
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing warning for "Penthouse Suite"')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('(default)')
      );
    });

    it('should successfully parse various bedroom/bathroom formats', () => {
      const property = MFPropertyFactory.create();

      const wellFormattedProperty: MultiFamilyData = {
        ...property,
        unitTypes: [
          { type: '2bed/1bath', sqft: 900, monthlyRent: 1500, count: 3 },
          { type: '3BR 2BA', sqft: 1100, monthlyRent: 1800, count: 2 },
          { type: '1 Bedroom 1 Bath', sqft: 750, monthlyRent: 1200, count: 3 }
        ]
      };

      const analyzer = new MultiFamilyAnalyzer(wellFormattedProperty, defaultMFAssumptions);
      analyzer.analyze();

      // Should NOT have logged parsing warnings for these formats
      const parsingWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes('Parsing warning')
      );
      expect(parsingWarnings.length).toBe(0);
    });
  });

  describe('Comprehensive Logging (Story 1.5)', () => {
    it('should log analysis start with property summary', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged analysis start
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('MULTI-FAMILY ANALYSIS START')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Property: ${property.totalUnits}-unit building`)
      );
    });

    it('should log validation complete message', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged validation complete
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Data validation complete')
      );
    });

    it('should log getNormalizedUnits input method detection', () => {
      const property = MFPropertyFactory.createWithGranularUnits();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged input method
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Using granular units[] input')
      );
    });

    it('should log detailed NOI calculation (Story 1.2 fix)', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged NOI calculation details (console.log uses separate params)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[MF] NOI Calculation (Story 1.2 - CRITICAL FIX):'
      );
      // Check that Gross Income was logged (second param is the value)
      const grossIncomeCall = consoleLogSpy.mock.calls.find(call =>
        call[0] === '  Gross Income:'
      );
      expect(grossIncomeCall).toBeDefined();

      // Check that EGI was logged
      const egiCall = consoleLogSpy.mock.calls.find(call =>
        call[0] === '  EGI (after vacancy + credit loss):'
      );
      expect(egiCall).toBeDefined();
    });

    it('should log all key investment metrics', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged key metrics (console.log uses separate params)
      const keyMetricsCall = consoleLogSpy.mock.calls.find(call =>
        call[0] && call[0].includes('Key Investment Metrics:')
      );
      expect(keyMetricsCall).toBeDefined();

      // Check individual metrics were logged
      const capRateCall = consoleLogSpy.mock.calls.find(call =>
        call[0] === '  Cap Rate:'
      );
      expect(capRateCall).toBeDefined();

      const cashOnCashCall = consoleLogSpy.mock.calls.find(call =>
        call[0] === '  Cash-on-Cash Return:'
      );
      expect(cashOnCashCall).toBeDefined();

      const dscrCall = consoleLogSpy.mock.calls.find(call =>
        call[0] === '  DSCR:'
      );
      expect(dscrCall).toBeDefined();
    });

    it('should log analysis completion', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

      analyzer.analyze();

      // Should have logged completion messages
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Multi-family analysis complete')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('MULTI-FAMILY ANALYSIS END')
      );
    });
  });

  describe('Error Handling (Story 1.5)', () => {
    it('should handle missing unit data gracefully', () => {
      const property = MFPropertyFactory.create();

      // Remove both units[] and unitTypes[]
      const noUnitsProperty: MultiFamilyData = {
        ...property,
        units: undefined,
        unitTypes: undefined
      };

      const analyzer = new MultiFamilyAnalyzer(noUnitsProperty, defaultMFAssumptions);

      // Should not throw, but should log critical error
      expect(() => analyzer.analyze()).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL ERROR: No unit data provided')
      );
    });

    it('should handle IRR calculation errors gracefully', () => {
      const property = MFPropertyFactory.create();

      // Create property that might cause IRR calculation issues
      const edgeCaseProperty: MultiFamilyData = {
        ...property,
        purchasePrice: 1000000,
        downPayment: 900000, // Very high down payment
        interestRate: 0.01 // Very low interest
      };

      const analyzer = new MultiFamilyAnalyzer(edgeCaseProperty, defaultMFAssumptions);

      // Should not throw
      expect(() => analyzer.analyze()).not.toThrow();

      // If IRR fails, should use default value
      const result = analyzer.analyze();
      expect(result.annualAnalysis).toBeDefined();
    });
  });
});
