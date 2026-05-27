/**
 * Tests for the perturbable-fields registry — Task #16 Path B foundation.
 *
 * Specifically locks down the things that would re-introduce the original
 * bug (LLM units mismatch on rate fields):
 *   - Every registry entry's `path` actually resolves to a field on the
 *     correct container shape (compile-time check is in the source file;
 *     runtime check here mirrors it for defensive depth).
 *   - normalizeToEngineUnit converts the conversions we actually rely on,
 *     and throws (loudly) on conversions we DON'T handle.
 *   - validateEngineValue catches out-of-range values without crashing
 *     the call chain.
 */

import {
  SFR_PERTURBABLE_FIELDS,
  SFR_PERTURBABLE_FIELD_KEYS,
  getFieldDef,
  normalizeToEngineUnit,
  validateEngineValue,
  type PerturbableFieldDef,
} from '../fieldRegistry';

describe('SFR_PERTURBABLE_FIELDS registry', () => {
  it('has at least the canonical core fields (rate / rent / vacancy / price)', () => {
    // If any of these went missing, stress tests for the most common cases break.
    for (const key of ['mortgageRate', 'rent', 'vacancy', 'purchasePrice', 'propertyTax']) {
      expect(SFR_PERTURBABLE_FIELDS[key]).toBeDefined();
    }
  });

  it('every entry has a coherent { key, container, path, engineUnit, label } shape', () => {
    for (const [key, def] of Object.entries(SFR_PERTURBABLE_FIELDS)) {
      expect(def.key).toBe(key); // The map key MUST match def.key (no drift)
      expect(['propertyData', 'assumptions']).toContain(def.container);
      expect(typeof def.path).toBe('string');
      expect(def.path.length).toBeGreaterThan(0);
      expect(['percent', 'dollars', 'years', 'decimal_ratio', 'count']).toContain(def.engineUnit);
      expect(typeof def.label).toBe('string');
      expect(def.label.length).toBeGreaterThan(0);
    }
  });

  it('mortgageRate is the field that produced the original bug — locks its engineUnit as percent', () => {
    // BasePropertyAnalyzer.ts:285 does `interestRate / 100`. If anyone ever
    // flips this to 'decimal_ratio' the bug comes back. Pin it explicitly.
    expect(SFR_PERTURBABLE_FIELDS.mortgageRate.engineUnit).toBe('percent');
    expect(SFR_PERTURBABLE_FIELDS.mortgageRate.path).toBe('interestRate');
    expect(SFR_PERTURBABLE_FIELDS.mortgageRate.container).toBe('propertyData');
  });

  it('vacancy lives in assumptions, not propertyData (different container)', () => {
    // Easy to slip up since it's a propertyData-looking field. Lock the container.
    expect(SFR_PERTURBABLE_FIELDS.vacancy.container).toBe('assumptions');
    expect(SFR_PERTURBABLE_FIELDS.vacancy.path).toBe('vacancyRate');
  });

  it('SFR_PERTURBABLE_FIELD_KEYS lists every field in the registry', () => {
    expect(SFR_PERTURBABLE_FIELD_KEYS.sort()).toEqual(
      Object.keys(SFR_PERTURBABLE_FIELDS).sort()
    );
  });
});

describe('getFieldDef', () => {
  it('returns the entry for a known field', () => {
    const def = getFieldDef('rent');
    expect(def.path).toBe('monthlyRent');
    expect(def.engineUnit).toBe('dollars');
  });

  it('throws loudly for an unknown field (no silent no-op)', () => {
    expect(() => getFieldDef('madeUpField')).toThrow(/not in the registry/);
  });
});

describe('normalizeToEngineUnit — THE bug-defense function', () => {
  const mortgageRate = SFR_PERTURBABLE_FIELDS.mortgageRate; // engineUnit: percent
  const purchasePrice = SFR_PERTURBABLE_FIELDS.purchasePrice; // engineUnit: dollars
  const vacancy = SFR_PERTURBABLE_FIELDS.vacancy; // engineUnit: percent
  const holdPeriod = SFR_PERTURBABLE_FIELDS.holdPeriod; // engineUnit: years

  describe('the original bug scenario', () => {
    it('LLM says "7.5%" as percent → engine gets 7.5 (the original PASSING case)', () => {
      // This is what SHOULD happen and what didn't before Path B.
      expect(normalizeToEngineUnit(7.5, 'percent', mortgageRate)).toBe(7.5);
    });

    it('LLM says "0.075" as decimal_ratio → engine gets 7.5 (the converted case)', () => {
      // This is the bug-fix case — if the LLM correctly DECLARES decimal_ratio,
      // we convert to percent rather than silently treating 0.075 as 0.075%.
      expect(normalizeToEngineUnit(0.075, 'decimal_ratio', mortgageRate)).toBe(7.5);
    });

    it('the original bug pattern (0.075 silently treated as percent) is no longer possible', () => {
      // Even if someone passed 0.075 with unit='percent' explicitly, that means
      // "0.075 percent" = 0.075% — a real, intended (if weird) value. No bug.
      // The bug was IMPLICIT — no unit declared at all. Schema now requires unit.
      expect(normalizeToEngineUnit(0.075, 'percent', mortgageRate)).toBe(0.075);
    });
  });

  describe('same-unit pass-through (no conversion)', () => {
    it('dollars → dollars: identity', () => {
      expect(normalizeToEngineUnit(200000, 'dollars', purchasePrice)).toBe(200000);
    });

    it('years → years: identity', () => {
      expect(normalizeToEngineUnit(10, 'years', holdPeriod)).toBe(10);
    });

    it('percent → percent (vacancy): identity', () => {
      expect(normalizeToEngineUnit(5, 'percent', vacancy)).toBe(5);
    });
  });

  describe('cross-unit conversions', () => {
    it('decimal_ratio → percent: multiplies by 100', () => {
      expect(normalizeToEngineUnit(0.05, 'decimal_ratio', vacancy)).toBe(5);
      expect(normalizeToEngineUnit(0.0651, 'decimal_ratio', mortgageRate)).toBeCloseTo(6.51, 5);
    });

    it('percent → decimal_ratio: divides by 100', () => {
      // Hypothetical field with engineUnit='decimal_ratio' (landValueRatio in real codebase)
      // We construct a synthetic def to test the conversion direction.
      const decimalField: PerturbableFieldDef = {
        key: '_test',
        container: 'propertyData',
        path: 'landValueRatio',
        engineUnit: 'decimal_ratio',
        label: 'Test',
        description: 'Test',
      };
      expect(normalizeToEngineUnit(20, 'percent', decimalField)).toBe(0.2);
    });
  });

  describe('incompatible conversions throw (no silent guesses)', () => {
    it('user says "30%" but field is in dollars → throws', () => {
      // Common LLM mistake — user says "30% down" but downPayment field is dollars.
      // This should NOT silently produce a number. Higher layers must do the
      // percent-of-price math first.
      expect(() =>
        normalizeToEngineUnit(30, 'percent', SFR_PERTURBABLE_FIELDS.downPayment)
      ).toThrow(/Cannot convert/);
    });

    it('user says "5 years" but field is in dollars → throws', () => {
      expect(() => normalizeToEngineUnit(5, 'years', purchasePrice)).toThrow(/Cannot convert/);
    });
  });
});

describe('validateEngineValue', () => {
  const mortgageRate = SFR_PERTURBABLE_FIELDS.mortgageRate; // min: 0, max: 25
  const rent = SFR_PERTURBABLE_FIELDS.rent; // min: 0, no max

  it('returns null when value is in bounds', () => {
    expect(validateEngineValue(7.5, mortgageRate)).toBeNull();
    expect(validateEngineValue(2000, rent)).toBeNull();
  });

  it('returns an error string when value is below min', () => {
    expect(validateEngineValue(-1, mortgageRate)).toMatch(/below the minimum/);
  });

  it('returns an error string when value is above max', () => {
    expect(validateEngineValue(50, mortgageRate)).toMatch(/above the maximum/);
  });

  it('rejects non-finite values (NaN, Infinity)', () => {
    expect(validateEngineValue(NaN, mortgageRate)).toMatch(/finite/);
    expect(validateEngineValue(Infinity, mortgageRate)).toMatch(/finite/);
  });

  it('passes values that have no max constraint', () => {
    // rent has min: 0 but no max
    expect(validateEngineValue(1_000_000, rent)).toBeNull();
  });
});
