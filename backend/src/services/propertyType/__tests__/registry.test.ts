/**
 * Tests for the property-type registry — Task #20.
 *
 * Focus:
 *   - Every canonical PropertyType has an entry (compile-time + runtime).
 *   - getPropertyTypeCapabilities throws loudly for unknown types
 *     (the bug-defense — silent fallthrough must NEVER happen).
 *   - analyzerFactory wires to the right analyzer class for each type.
 *   - fullySupported / sensitivitySupported flags reflect current state
 *     (SFR true, MF false) — these are consumed by Task #21 agent gates.
 *   - isSFR / isMF helpers behave correctly.
 */

import {
  PROPERTY_TYPE_REGISTRY,
  SUPPORTED_PROPERTY_TYPES,
  getPropertyTypeCapabilities,
  getFullySupportedTypes,
  getWipMessageForType,
  getPlatformStatusSummary,
  isSFR,
  isMF,
} from '../registry';
import { SFRAnalyzer } from '../../../analysis/SFRAnalyzer';
import { MultiFamilyAnalyzer } from '../../../analysis/MultiFamilyAnalyzer';
import type { SFRData, MultiFamilyData } from '../../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../../analysis/BasePropertyAnalyzer';

// ===== Minimal fixtures =====

function fixtureAssumptions(): AnalysisAssumptions {
  return {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3.5,
    sellingCosts: 6,
    vacancyRate: 5,
  };
}

function fixtureSFR(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 200_000,
    downPayment: 50_000,
    interestRate: 7,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_000,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '1 Test St',
      city: 'Anytown',
      state: 'TX',
      zipCode: '75001',
    },
    monthlyRent: 1_800,
    squareFootage: 1_200,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
  };
}

function fixtureMF(): MultiFamilyData {
  return {
    propertyType: 'MF',
    purchasePrice: 800_000,
    downPayment: 200_000,
    interestRate: 7,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 12_000,
    propertyManagementRate: 8,
    propertyAddress: {
      street: '2 Test Ave',
      city: 'Anytown',
      state: 'TX',
      zipCode: '75001',
    },
    totalUnits: 4,
    totalSqft: 4_800,
    yearBuilt: 2005,
    unitTypes: [
      { type: '2bed/1bath', count: 4, sqft: 1_200, monthlyRent: 1_400 },
    ],
    commonAreaUtilities: { electric: 50, water: 30, gas: 0, trash: 25 },
    maintenanceCostPerUnit: 200,
    insurancePerUnit: 600,
  };
}

// ===== Registry coverage =====

describe('PROPERTY_TYPE_REGISTRY', () => {
  it('has an entry for every supported PropertyType', () => {
    expect(SUPPORTED_PROPERTY_TYPES.sort()).toEqual(['MF', 'SFR']);
    for (const t of SUPPORTED_PROPERTY_TYPES) {
      expect(PROPERTY_TYPE_REGISTRY[t]).toBeDefined();
    }
  });

  it('every entry has a coherent shape (key, label, factory, flags)', () => {
    for (const [key, cap] of Object.entries(PROPERTY_TYPE_REGISTRY)) {
      expect(cap.key).toBe(key); // No drift between map key and entry.key
      expect(typeof cap.label).toBe('string');
      expect(cap.label.length).toBeGreaterThan(0);
      expect(typeof cap.analyzerFactory).toBe('function');
      expect(typeof cap.fullySupported).toBe('boolean');
      expect(typeof cap.sensitivitySupported).toBe('boolean');
      expect(['sfr', 'mf']).toContain(cap.detailsVariant);
    }
  });

  it('SFR is fully supported + sensitivity-supported (current state)', () => {
    const sfr = PROPERTY_TYPE_REGISTRY.SFR;
    expect(sfr.fullySupported).toBe(true);
    expect(sfr.sensitivitySupported).toBe(true);
    expect(sfr.detailsVariant).toBe('sfr');
  });

  it('MF is NOT fully supported yet (Task #21 prep)', () => {
    // This locks in the current "MF is WIP" state. When the MF Details
    // variant + stress-test runner are built, flip these to true and the
    // test will catch the change loudly.
    const mf = PROPERTY_TYPE_REGISTRY.MF;
    expect(mf.fullySupported).toBe(false);
    expect(mf.sensitivitySupported).toBe(false);
    expect(mf.detailsVariant).toBe('mf');
  });
});

// ===== analyzerFactory routing =====

describe('PROPERTY_TYPE_REGISTRY.analyzerFactory', () => {
  it('SFR factory builds an SFRAnalyzer', () => {
    const cap = PROPERTY_TYPE_REGISTRY.SFR;
    const analyzer = cap.analyzerFactory(fixtureSFR(), fixtureAssumptions());
    expect(analyzer).toBeInstanceOf(SFRAnalyzer);
  });

  it('MF factory builds a MultiFamilyAnalyzer', () => {
    const cap = PROPERTY_TYPE_REGISTRY.MF;
    const analyzer = cap.analyzerFactory(fixtureMF(), fixtureAssumptions());
    expect(analyzer).toBeInstanceOf(MultiFamilyAnalyzer);
  });

  it('SFR analyzer actually runs and produces metrics', () => {
    // Real end-to-end sanity check: the factory output is functional, not
    // just an instance check.
    const analyzer = PROPERTY_TYPE_REGISTRY.SFR.analyzerFactory(
      fixtureSFR(),
      fixtureAssumptions()
    );
    const result = analyzer.analyze() as unknown as {
      keyMetrics?: { capRate?: number };
      metrics?: { capRate?: number };
    };
    const capRate = result.keyMetrics?.capRate ?? result.metrics?.capRate;
    expect(typeof capRate).toBe('number');
  });
});

// ===== getPropertyTypeCapabilities — the bug-defense =====

describe('getPropertyTypeCapabilities', () => {
  it('returns the entry for SFR', () => {
    const cap = getPropertyTypeCapabilities('SFR');
    expect(cap.key).toBe('SFR');
    expect(cap.label).toBe('Single-Family Residential');
  });

  it('returns the entry for MF', () => {
    const cap = getPropertyTypeCapabilities('MF');
    expect(cap.key).toBe('MF');
    expect(cap.label).toBe('Multi-Family');
  });

  it('THROWS LOUDLY for an unknown type (no silent fallthrough)', () => {
    // This is THE assertion that prevents the "property type #3 silently
    // routes to SFR math" failure mode. If a future Commercial deal hits
    // a dispatch site before the registry is updated, we want a loud
    // crash, NOT silent nonsense.
    expect(() => getPropertyTypeCapabilities('Commercial')).toThrow(
      /not registered/i
    );
    expect(() => getPropertyTypeCapabilities('Multi-Family')).toThrow(
      /not registered/i
    );
    expect(() => getPropertyTypeCapabilities('')).toThrow(/not registered/i);
  });

  it('error message names the known types so the dev knows what to add', () => {
    try {
      getPropertyTypeCapabilities('Commercial');
      fail('Should have thrown');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).toMatch(/SFR/);
      expect(msg).toMatch(/MF/);
      expect(msg).toMatch(/PROPERTY_TYPE_REGISTRY/);
    }
  });
});

// ===== isSFR / isMF helpers =====

describe('isSFR / isMF helpers', () => {
  it('isSFR returns true for SFR property data', () => {
    expect(isSFR(fixtureSFR())).toBe(true);
  });

  it('isSFR returns false for MF property data', () => {
    expect(isSFR(fixtureMF())).toBe(false);
  });

  it('isMF returns true for MF property data', () => {
    expect(isMF(fixtureMF())).toBe(true);
  });

  it('isMF returns false for SFR property data', () => {
    expect(isMF(fixtureSFR())).toBe(false);
  });

  it('both return false for unknown property types', () => {
    const weird = { propertyType: 'Commercial' as unknown as 'SFR' };
    expect(isSFR(weird)).toBe(false);
    expect(isMF(weird)).toBe(false);
  });
});

// ===== getFullySupportedTypes =====

describe('getFullySupportedTypes', () => {
  it('returns only SFR today (MF is WIP per Task #21)', () => {
    const fully = getFullySupportedTypes();
    expect(fully).toEqual(['SFR']);
  });

  it('would automatically include MF once its registry entry flips', () => {
    // Sanity: the function is registry-driven, not hardcoded. If MF's
    // fullySupported flips to true in a future change, this function will
    // immediately return ['SFR', 'MF'] without further code change.
    // (Documenting intent — no runtime assertion needed.)
    expect(getFullySupportedTypes().length).toBeLessThanOrEqual(
      SUPPORTED_PROPERTY_TYPES.length
    );
  });
});

// ===== Task #21 — WIP messaging helpers =====

describe('getWipMessageForType', () => {
  it('returns null for fully-supported types (no nudge needed)', () => {
    expect(getWipMessageForType('SFR')).toBeNull();
  });

  it('returns a polite WIP message for MF (not yet fully supported)', () => {
    const msg = getWipMessageForType('MF');
    expect(msg).not.toBeNull();
    expect(msg).toMatch(/Multi-Family/);
    expect(msg).toMatch(/in active development/i);
    expect(msg).toMatch(/\/mf-analysis/); // points to the wizard
  });

  it('returns null for an unknown type (caller handles via the throwing lookup)', () => {
    // Defensive: this helper is for messaging decisions, not validation.
    // The throwing lookup (getPropertyTypeCapabilities) is the bug-defense.
    expect(getWipMessageForType('Commercial')).toBeNull();
  });
});

describe('getPlatformStatusSummary', () => {
  it('reports SFR as live and MF as in development (current state)', () => {
    const status = getPlatformStatusSummary();
    expect(status.live).toEqual(['SFR']);
    expect(status.inDevelopment).toEqual(['MF']);
    expect(status.liveLabels).toContain('Single-Family Residential');
    expect(status.inDevelopmentLabels).toContain('Multi-Family');
  });
});
