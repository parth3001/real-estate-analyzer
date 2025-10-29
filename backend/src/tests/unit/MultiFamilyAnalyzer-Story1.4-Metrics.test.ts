import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFPropertyFactory, defaultMFAssumptions } from '../fixtures/mfTestData';
import { MultiFamilyData } from '../../types/propertyTypes';

/**
 * Story 1.4 Test Suite - Advanced MF Metrics Implementation
 *
 * Tests the 9 advanced MF metrics extracted from inline calculations:
 * 1. Gross Rent Multiplier (GRM)
 * 2. Debt Yield
 * 3. Break-Even Occupancy (BEO)
 * 4. Rent per Square Foot
 * 5. Gross Yield
 * 6. Unit Mix Efficiency (FIXED)
 * 7. Economic Vacancy Rate (FIXED)
 * 8. Per-unit metrics
 * 9. Common area expense ratio
 */

describe('Story 1.4: Advanced MF Metrics Implementation', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console to suppress output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Metric 1: Gross Rent Multiplier (GRM)', () => {
    it('should calculate GRM correctly for standard 8-unit property', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Expected: GRM = $1,200,000 / $136,800 = 8.77
      // Note: Gross income = (6 units * $1500 * 12) + (2 units * $1200 * 12) = $108,000 + $28,800 = $136,800
      expect(results.keyMetrics.grm).toBeCloseTo(8.77, 2);
    });

    it('should log warning for high GRM (>7)', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 1500000, // Higher price = higher GRM
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('High GRM')
      );
    });

    it('should log warning for unusually low GRM (<4)', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 400000, // Very low price = low GRM
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unusually low GRM')
      );
    });
  });

  describe('Metric 2: Debt Yield', () => {
    it('should calculate Debt Yield correctly', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Loan Amount = $1,200,000 - $240,000 = $960,000
      // Expected Debt Yield = (NOI / $960,000) * 100
      // Should be around 8-10% for this property
      expect(results.keyMetrics.debtYield).toBeGreaterThan(0);
      expect(results.keyMetrics.debtYield).toBeLessThan(20); // Reasonable range
    });

    it('should return 0 for all-cash purchase (no debt)', () => {
      const property = MFPropertyFactory.create({
        downPayment: 1200000, // 100% down = all cash
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      expect(results.keyMetrics.debtYield).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('100% cash')
      );
    });

    it('should warn when debt yield < 10%', () => {
      const property = MFPropertyFactory.create({
        downPayment: 60000, // Only 5% down = high loan amount = low debt yield
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low debt yield')
      );
    });
  });

  describe('Metric 3: Break-Even Occupancy (BEO)', () => {
    it('should calculate BEO correctly', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // BEO = (Operating Expenses + Debt Service) / Gross Income * 100
      // For this property: BEO is around 100% (marginal property)
      expect(results.keyMetrics.breakEvenOccupancy).toBeGreaterThan(50);
      expect(results.keyMetrics.breakEvenOccupancy).toBeLessThan(110); // Allow for marginal properties
    });

    it('should warn when BEO > 85% (risky)', () => {
      const property = MFPropertyFactory.create({
        downPayment: 60000, // Low down = high debt service = high BEO
        propertyTaxRate: 3.0, // High taxes
        insuranceRate: 1.2, // High insurance
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('High break-even occupancy')
      );
    });

    it('should log success message when BEO < 60% (excellent)', () => {
      const property = MFPropertyFactory.create({
        downPayment: 1000000, // 83% down = very low debt service = low BEO
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Verify BEO is actually < 60%
      expect(results.keyMetrics.breakEvenOccupancy).toBeLessThan(60);

      // Check that the console.log was called with the excellent message
      // The message is split across multiple console.log calls, so check for the key part
      const allLogs = consoleLogSpy.mock.calls.map((call: any[]) => call.join(' '));
      const hasExcellentMessage = allLogs.some((log: string) => log.includes('Excellent break-even occupancy'));
      expect(hasExcellentMessage).toBe(true);
    });
  });

  describe('Metric 4: Rent per Square Foot', () => {
    it('should calculate rent per sqft correctly', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Gross monthly income = $136,800 / 12 = $11,400
      // Total sqft = 7,200
      // Expected: $11,400 / 7,200 = $1.58/sqft/month
      expect(results.keyMetrics.rentPerSqft).toBeCloseTo(1.58, 2);
    });
  });

  describe('Metric 5: Gross Yield', () => {
    it('should calculate gross yield correctly', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Gross Yield = ($136,800 / $1,200,000) * 100 = 11.4%
      expect(results.keyMetrics.grossYield).toBeCloseTo(11.4, 1);
    });

    it('should warn when gross yield < 6%', () => {
      const property = MFPropertyFactory.create({
        purchasePrice: 2500000, // Very high price = low yield
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low gross yield')
      );
    });
  });

  describe('Metric 6: Unit Mix Efficiency (FIXED in Story 1.4)', () => {
    it('should calculate 100% efficiency when no market rent data', () => {
      const property = MFPropertyFactory.create();
      // Default factory doesn't include marketRent, so efficiency should be 100%
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      expect(results.keyMetrics.unitMixEfficiency).toBe(100);
    });

    it('should calculate efficiency correctly with below-market rents', () => {
      const property = MFPropertyFactory.createWithGranularUnits({
        units: [
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1200, marketRent: 1500 },
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1200, marketRent: 1500 },
        ],
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Efficiency = ($1200 + $1200) / ($1500 + $1500) * 100 = 80%
      expect(results.keyMetrics.unitMixEfficiency).toBeCloseTo(80, 1);
    });

    it('should warn when efficiency < 95%', () => {
      const property = MFPropertyFactory.createWithGranularUnits({
        units: [
          { bedrooms: 2, bathrooms: 1, squareFeet: 900, currentRent: 1200, marketRent: 1500 },
        ],
      });
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Below-market rents detected')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Monthly upside')
      );
    });
  });

  describe('Metric 7: Economic Vacancy Rate (FIXED in Story 1.4)', () => {
    it('should calculate economic vacancy rate correctly', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Economic Vacancy = (Gross Income - EGI) / Gross Income * 100
      // With 5% vacancy + 2% credit loss = ~7%
      expect(results.keyMetrics.economicVacancyRate).toBeCloseTo(7, 1);
    });

    it('should warn when economic vacancy rate > 10%', () => {
      const highVacancyAssumptions = {
        ...defaultMFAssumptions,
        vacancyRate: 12, // High vacancy
      };
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, highVacancyAssumptions);
      analyzer.analyze();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('High economic vacancy rate')
      );
    });
  });

  describe('Integration: All Metrics Calculated', () => {
    it('should calculate all 9 advanced MF metrics without errors', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      const results = analyzer.analyze();

      // Verify all metrics are present and numeric
      expect(results.keyMetrics.grm).toBeGreaterThan(0);
      expect(results.keyMetrics.debtYield).toBeGreaterThan(0);
      expect(results.keyMetrics.breakEvenOccupancy).toBeGreaterThan(0);
      expect(results.keyMetrics.rentPerSqft).toBeGreaterThan(0);
      expect(results.keyMetrics.grossYield).toBeGreaterThan(0);
      expect(results.keyMetrics.unitMixEfficiency).toBeGreaterThan(0);
      expect(results.keyMetrics.economicVacancyRate).toBeGreaterThan(0);
      expect(results.keyMetrics.commonAreaExpenseRatio).toBeGreaterThanOrEqual(0);
    });

    it('should log all metric calculations with Story 1.5 logging pattern', () => {
      const property = MFPropertyFactory.create();
      const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
      analyzer.analyze();

      // Verify Story 1.4 section markers - check using stringContaining for flexibility
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ADVANCED MF METRICS')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('END ADVANCED MF METRICS')
      );

      // Verify individual metric logging
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Gross Rent Multiplier (GRM) Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Debt Yield Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Break-Even Occupancy Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Rent per Square Foot Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Gross Yield Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Unit Mix Efficiency Calculation:');
      expect(consoleLogSpy).toHaveBeenCalledWith('[MF] Economic Vacancy Rate Calculation:');
    });
  });
});
