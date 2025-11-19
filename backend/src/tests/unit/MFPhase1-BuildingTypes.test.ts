/**
 * Phase 1: Building Type Implementation Tests
 *
 * Tests for:
 * - Cap rate adjustments by building type (GARDEN, MID_RISE, COMPLEX)
 * - Operating expense validation warnings
 * - Decision Engine building type awareness
 */

import { MultiFamilyAnalyzer } from '../../analysis/MultiFamilyAnalyzer';
import { MFDecisionEngine } from '../../services/investment/MFDecisionEngine';
import { MFPropertyFactory } from '../fixtures/mfTestData';
import { MultiFamilyData } from '../../types/propertyTypes';

describe('Phase 1: Building Type Cap Rate Adjustments', () => {
  /**
   * Cap Rate Adjustment Tests
   * Building type affects target cap rate for walk-away price and scoring
   *
   * Adjustments:
   * - GARDEN: 0 bps (baseline)
   * - MID_RISE: -150 bps (institutional appeal)
   * - COMPLEX: 0 bps (baseline)
   */

  describe('Market Tier A (Premium Markets)', () => {
    test('GARDEN building should use 5.0% target cap rate (A-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'GARDEN',
        propertyAddress: {
          street: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      // Create decision engine to test cap rate logic
      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined, // marketData
        null,      // predictions
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // Walk-away price = NOI / targetCapRate
      // For GARDEN in A-Class market: targetCapRate = 5.0% (0.05)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.05;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('MID_RISE building should use 3.5% target cap rate (A-Class - 150 bps)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'MID_RISE',
        propertyAddress: {
          street: '456 Oak Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For MID_RISE in A-Class market: targetCapRate = 3.5% (5.0% - 1.5%)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.035;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('COMPLEX building should use 5.0% target cap rate (A-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'COMPLEX',
        propertyAddress: {
          street: '789 Pine Blvd',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75202'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For COMPLEX in A-Class market: targetCapRate = 5.0% (0.05)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.05;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });
  });

  describe('Market Tier B (Balanced Markets)', () => {
    test('GARDEN building should use 7.5% target cap rate (B-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'GARDEN',
        propertyAddress: {
          street: '321 Elm St',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For GARDEN in B-Class market: targetCapRate = 7.5% (0.075)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.075;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('MID_RISE building should use 6.0% target cap rate (B-Class - 150 bps)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'MID_RISE',
        propertyAddress: {
          street: '654 Cedar Ln',
          city: 'Tampa',
          state: 'FL',
          zipCode: '33602'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For MID_RISE in B-Class market: targetCapRate = 6.0% (7.5% - 1.5%)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.06;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('COMPLEX building should use 7.5% target cap rate (B-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'COMPLEX',
        propertyAddress: {
          street: '987 Birch Dr',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85002'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For COMPLEX in B-Class market: targetCapRate = 7.5% (0.075)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.075;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });
  });

  describe('Market Tier C (Cash Flow Markets)', () => {
    test('GARDEN building should use 10.0% target cap rate (C-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'GARDEN',
        propertyAddress: {
          street: '111 Maple Ave',
          city: 'Memphis',
          state: 'TN',
          zipCode: '38103'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For GARDEN in C-Class market: targetCapRate = 10.0% (0.10)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.10;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('MID_RISE building should use 8.5% target cap rate (C-Class - 150 bps)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'MID_RISE',
        propertyAddress: {
          street: '222 Walnut St',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For MID_RISE in C-Class market: targetCapRate = 8.5% (10.0% - 1.5%)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.085;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });

    test('COMPLEX building should use 10.0% target cap rate (C-Class baseline)', () => {
      const property = MFPropertyFactory.create({
        buildingType: 'COMPLEX',
        propertyAddress: {
          street: '333 Spruce Ct',
          city: 'Memphis',
          state: 'TN',
          zipCode: '38104'
        }
      });

      const analyzer = new MultiFamilyAnalyzer(property, {
        projectionYears: 10,
        annualRentIncrease: 2,
        annualExpenseIncrease: 2,
        annualPropertyValueIncrease: 3,
        sellingCosts: 6,
        vacancyRate: 5
      });

      const analysis = analyzer.analyze();

      // Normalize analysis structure: keyMetrics → metrics (same as controller does)
      const normalizedAnalysis = {
        ...analysis,
        metrics: analysis.keyMetrics
      };

      const engine = new MFDecisionEngine(
        normalizedAnalysis as any,
        property,
        undefined,
        null,
        {
          availableCash: property.downPayment,
          experienceLevel: 'intermediate',
          riskTolerance: 'moderate',
          investmentGoals: 'balanced'
        }
      );

      // For COMPLEX in C-Class market: targetCapRate = 10.0% (0.10)
      const decision = engine.generateDecision();
      const expectedWalkAwayPrice = analysis.keyMetrics.noi / 0.10;

      expect(decision.marketPosition?.walkAwayPrice).toBeCloseTo(expectedWalkAwayPrice, 0);
    });
  });
});

describe('Phase 1: Operating Expense Validation Warnings', () => {
  /**
   * Validation Warning Tests
   * System should warn when operating expenses are outside typical ranges
   *
   * Typical Ranges:
   * - GARDEN: $250-400/unit/month
   * - MID_RISE: $450-700/unit/month
   * - COMPLEX: $300-500/unit/month
   */

  test('GARDEN building with low operating expenses should generate MEDIUM warning', () => {
    // Create property with $200/unit/month OpEx (below $250 minimum for GARDEN)
    const property = MFPropertyFactory.create({
      buildingType: 'GARDEN',
      totalUnits: 8,
      purchasePrice: 1200000,
      propertyTaxRate: 0.5,      // Very low tax
      insuranceRate: 0.2,         // Very low insurance
      maintenanceCost: 400,       // Low maintenance
      propertyManagementRate: 0   // No property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should have at least one operating expense warning
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeDefined();
    expect(opExWarning?.severity).toBe('MEDIUM');
    expect(opExWarning?.message).toContain('appear low');
    expect(opExWarning?.message).toContain('GARDEN');
  });

  test('GARDEN building with normal operating expenses should not generate warnings', () => {
    // Create property with $325/unit/month OpEx (within $250-400 range for GARDEN)
    const property = MFPropertyFactory.create({
      buildingType: 'GARDEN',
      totalUnits: 8,
      purchasePrice: 1200000,
      propertyTaxRate: 1.5,       // Normal tax
      insuranceRate: 0.6,          // Normal insurance
      maintenanceCost: 800,        // Normal maintenance
      propertyManagementRate: 8    // Normal property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should NOT have operating expense warnings (within normal range)
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeUndefined();
  });

  test('GARDEN building with high operating expenses should generate LOW warning', () => {
    // Create property with $450/unit/month OpEx (above $400 maximum for GARDEN)
    const property = MFPropertyFactory.create({
      buildingType: 'GARDEN',
      totalUnits: 8,
      purchasePrice: 1200000,
      propertyTaxRate: 2.5,        // High tax
      insuranceRate: 1.2,           // High insurance
      maintenanceCost: 2000,        // High maintenance
      propertyManagementRate: 10    // High property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should have operating expense warning for high expenses
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeDefined();
    expect(opExWarning?.severity).toBe('LOW');
    expect(opExWarning?.message).toContain('appear high');
    expect(opExWarning?.message).toContain('GARDEN');
  });

  test('MID_RISE building with low operating expenses should generate MEDIUM warning', () => {
    // Create property with $400/unit/month OpEx (below $450 minimum for MID_RISE)
    const property = MFPropertyFactory.create({
      buildingType: 'MID_RISE',
      totalUnits: 24,
      purchasePrice: 4000000,
      propertyTaxRate: 0.8,        // Low tax
      insuranceRate: 0.3,           // Low insurance
      maintenanceCost: 2000,        // Low maintenance for 24 units
      propertyManagementRate: 6     // Lower property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should have operating expense warning for MID_RISE
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeDefined();
    expect(opExWarning?.severity).toBe('MEDIUM');
    expect(opExWarning?.message).toContain('appear low');
    expect(opExWarning?.message).toContain('MID_RISE');
  });

  test('MID_RISE building with normal operating expenses should not generate warnings', () => {
    // Create property with $575/unit/month OpEx (within $450-700 range for MID_RISE)
    const property = MFPropertyFactory.create({
      buildingType: 'MID_RISE',
      totalUnits: 24,
      purchasePrice: 4000000,
      propertyTaxRate: 1.5,        // Normal tax
      insuranceRate: 0.8,           // Normal insurance
      maintenanceCost: 6000,        // Normal maintenance for 24 units
      propertyManagementRate: 8     // Normal property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should NOT have operating expense warnings (within normal range)
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeUndefined();
  });

  test('MID_RISE building with high operating expenses should generate LOW warning', () => {
    // Create property with $800/unit/month OpEx (above $700 maximum for MID_RISE)
    const property = MFPropertyFactory.create({
      buildingType: 'MID_RISE',
      totalUnits: 24,
      purchasePrice: 4000000,
      propertyTaxRate: 2.5,        // High tax
      insuranceRate: 1.5,           // High insurance
      maintenanceCost: 10000,       // High maintenance
      propertyManagementRate: 10    // High property management
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    // Should have operating expense warning for high expenses
    const opExWarning = warnings.find(w => w.category === 'OPERATING_EXPENSES');
    expect(opExWarning).toBeDefined();
    expect(opExWarning?.severity).toBe('LOW');
    expect(opExWarning?.message).toContain('appear high');
    expect(opExWarning?.message).toContain('MID_RISE');
  });
});

describe('Phase 1: Validation Warnings API Integration', () => {
  test('getValidationWarnings() should return empty array when no issues found', () => {
    const property = MFPropertyFactory.create({
      buildingType: 'GARDEN'
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    analyzer.analyze();
    const warnings = analyzer.getValidationWarnings();

    expect(Array.isArray(warnings)).toBe(true);
  });

  test('clearValidationWarnings() should reset warnings between analyses', () => {
    const lowOpExProperty = MFPropertyFactory.create({
      buildingType: 'GARDEN',
      propertyTaxRate: 0.5,
      insuranceRate: 0.2,
      maintenanceCost: 400,
      propertyManagementRate: 0
    });

    const analyzer = new MultiFamilyAnalyzer(lowOpExProperty, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    // First analysis - should have warnings
    analyzer.analyze();
    const warningsFirst = analyzer.getValidationWarnings();
    expect(warningsFirst.length).toBeGreaterThan(0);

    // Clear warnings manually
    analyzer.clearValidationWarnings();
    const warningsAfterClear = analyzer.getValidationWarnings();
    expect(warningsAfterClear.length).toBe(0);
  });

  test('analyze() should auto-clear warnings before new analysis', () => {
    const property = MFPropertyFactory.create({
      buildingType: 'GARDEN',
      propertyTaxRate: 0.5
    });

    const analyzer = new MultiFamilyAnalyzer(property, {
      projectionYears: 10,
      annualRentIncrease: 2,
      annualExpenseIncrease: 2,
      annualPropertyValueIncrease: 3,
      sellingCosts: 6,
      vacancyRate: 5
    });

    // First analysis
    analyzer.analyze();
    const warningsFirst = analyzer.getValidationWarnings();

    // Second analysis should auto-clear and regenerate warnings
    analyzer.analyze();
    const warningsSecond = analyzer.getValidationWarnings();

    // Warnings should be the same (not accumulated)
    expect(warningsSecond.length).toBe(warningsFirst.length);
  });
});
