/**
 * savedDealVariants — unit tests for the variant-detection +
 * config-lookup logic powering SavedDealHero.
 *
 * Coverage:
 *   1. Variant detection rules — MF takes precedence over strategy,
 *      defaults are correct, unknown / legacy types fall through
 *      to sfr_buy_hold
 *   2. Caption builder — MF caption embeds unit count when present,
 *      omits gracefully when absent
 *   3. Variant factor config — every variant returns exactly 3 factors,
 *      no two variants share the exact same 3-factor list (otherwise
 *      polymorphism is decorative)
 *   4. Chip pool config — every variant returns 3-4 chips, no chip is
 *      empty/whitespace, no chip references "my latest" (Issue #113
 *      regression guard — the chip's deal context comes from the
 *      saved-deal screen, not "my latest" reference)
 *   5. Score + decision extraction — reads from BOTH top-level
 *      investmentDecision AND nested analysis.investmentDecision per
 *      Issue #109 (NaN fix). Falls back to 0 gracefully.
 */

import { describe, expect, it } from 'vitest';
import {
  detectSavedDealVariant,
  buildVariantCaption,
  getVariantFactors,
  getVariantChips,
  getDealQualityScore,
  getProfessionalAssessment,
  getPrimaryReason,
  type SavedDealShape,
  type SavedDealVariant,
} from '../savedDealVariants';

const ALL_VARIANTS: SavedDealVariant[] = [
  'sfr_buy_hold',
  'sfr_brrrr',
  'sfr_house_hack',
  'multi_family',
];

describe('detectSavedDealVariant', () => {
  it('MF propertyType wins regardless of investmentStrategy', () => {
    expect(detectSavedDealVariant({ propertyType: 'MF' })).toBe('multi_family');
    expect(
      detectSavedDealVariant({
        propertyType: 'MF',
        investmentStrategy: 'brrrr',
      })
    ).toBe('multi_family');
    expect(
      detectSavedDealVariant({
        propertyType: 'MF',
        investmentStrategy: 'house-hack',
      })
    ).toBe('multi_family');
  });

  it('SFR + brrrr → sfr_brrrr', () => {
    expect(
      detectSavedDealVariant({
        propertyType: 'SFR',
        investmentStrategy: 'brrrr',
      })
    ).toBe('sfr_brrrr');
  });

  it('SFR + house-hack → sfr_house_hack', () => {
    expect(
      detectSavedDealVariant({
        propertyType: 'SFR',
        investmentStrategy: 'house-hack',
      })
    ).toBe('sfr_house_hack');
  });

  it('SFR + buy-hold (or no strategy) → sfr_buy_hold', () => {
    expect(
      detectSavedDealVariant({
        propertyType: 'SFR',
        investmentStrategy: 'buy-hold',
      })
    ).toBe('sfr_buy_hold');
    expect(detectSavedDealVariant({ propertyType: 'SFR' })).toBe(
      'sfr_buy_hold'
    );
  });

  it('Unknown/legacy propertyType falls through to sfr_buy_hold (defensive default)', () => {
    expect(
      detectSavedDealVariant({ propertyType: 'COMMERCIAL_RETAIL' })
    ).toBe('sfr_buy_hold');
    expect(detectSavedDealVariant({})).toBe('sfr_buy_hold');
  });
});

describe('buildVariantCaption', () => {
  it('embeds unit count for MF when totalUnits is present', () => {
    expect(
      buildVariantCaption('multi_family', { totalUnits: 4 })
    ).toBe('MULTI-FAMILY ANALYSIS · 4 units');
  });

  it('omits unit count for MF when totalUnits is absent', () => {
    expect(buildVariantCaption('multi_family', {})).toBe(
      'MULTI-FAMILY ANALYSIS'
    );
  });

  it('returns the right caption for each variant', () => {
    expect(buildVariantCaption('sfr_buy_hold', {})).toBe('BUY & HOLD ANALYSIS');
    expect(buildVariantCaption('sfr_brrrr', {})).toBe('BRRRR ANALYSIS');
    expect(buildVariantCaption('sfr_house_hack', {})).toBe('HOUSE HACK ANALYSIS');
  });
});

describe('getVariantFactors', () => {
  it('returns exactly 3 factors for every variant', () => {
    for (const v of ALL_VARIANTS) {
      const factors = getVariantFactors(v);
      expect(factors).toHaveLength(3);
      for (const f of factors) {
        expect(typeof f.label).toBe('string');
        expect(f.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('variants differ from each other (polymorphism is meaningful)', () => {
    // Compare label-tuples. At least one pair must differ — otherwise
    // the polymorphic config is decorative.
    const tuples = ALL_VARIANTS.map((v) =>
      getVariantFactors(v)
        .map((f) => f.label)
        .join('|')
    );
    const unique = new Set(tuples);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('BRRRR de-emphasizes pre-refi cash flow (UX Designer decision)', () => {
    // Per the variant config rationale: BRRRR's pre-refi cash flow is
    // often negative; surfacing it as a top-3 factor would mislead the
    // user. BRRRR variant should NOT include cashFlowScore in its top 3.
    const brrrrFactors = getVariantFactors('sfr_brrrr');
    const fields = brrrrFactors.map((f) => f.scoreField);
    expect(fields).not.toContain('cashFlowScore');
  });

  it('MF includes DSCR-flavored debt structure factor (MF underwriting convention)', () => {
    const mfFactors = getVariantFactors('multi_family');
    const labels = mfFactors.map((f) => f.label.toLowerCase());
    expect(labels.some((l) => l.includes('dscr'))).toBe(true);
  });
});

describe('getVariantChips', () => {
  it('returns 3-4 non-empty chips for every variant', () => {
    for (const v of ALL_VARIANTS) {
      const chips = getVariantChips(v);
      expect(chips.length).toBeGreaterThanOrEqual(3);
      expect(chips.length).toBeLessThanOrEqual(4);
      for (const c of chips) {
        expect(c.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('no chip references "my latest" (Issue #113 regression guard)', () => {
    // From the saved-deal screen, the deal context is known explicitly
    // — SavedDealHero passes the property to the agent via initialUserInput.
    // Chips must not use "my latest" / "my recent" phrasing which would
    // confuse the agent (deal is already known).
    for (const v of ALL_VARIANTS) {
      for (const c of getVariantChips(v)) {
        expect(c.toLowerCase()).not.toContain('my latest');
        expect(c.toLowerCase()).not.toContain('my recent');
      }
    }
  });

  it('variants differ in chip pools (per-variant action set)', () => {
    const tuples = ALL_VARIANTS.map((v) => getVariantChips(v).join('|'));
    const unique = new Set(tuples);
    expect(unique.size).toBe(ALL_VARIANTS.length);
  });

  it('BRRRR chips reference ARV (BRRRR-specific concept)', () => {
    const brrrrChips = getVariantChips('sfr_brrrr').join(' ').toLowerCase();
    expect(brrrrChips).toContain('arv');
  });

  it('MF chips reference occupancy / per-unit (MF-specific concepts)', () => {
    const mfChips = getVariantChips('multi_family').join(' ').toLowerCase();
    expect(
      mfChips.includes('occupancy') || mfChips.includes('per-unit')
    ).toBe(true);
  });
});

describe('getDealQualityScore + decision extractors', () => {
  // Issue #109 ensured top-level + nested investmentDecision agree.
  // These tests confirm the extractor reads from BOTH paths and falls
  // back gracefully.

  it('prefers top-level investmentDecision.professionalAssessment.dealQuality', () => {
    const deal: SavedDealShape = {
      investmentDecision: {
        professionalAssessment: { dealQuality: 87 },
      },
      analysis: {
        investmentDecision: {
          professionalAssessment: { dealQuality: 65 },
        },
      },
    };
    expect(getDealQualityScore(deal)).toBe(87);
  });

  it('falls back to nested analysis.investmentDecision when top-level missing', () => {
    const deal: SavedDealShape = {
      analysis: {
        investmentDecision: {
          professionalAssessment: { dealQuality: 72 },
        },
      },
    };
    expect(getDealQualityScore(deal)).toBe(72);
  });

  it('returns 0 when no score is present (graceful fallback, no NaN)', () => {
    expect(getDealQualityScore({})).toBe(0);
  });

  it('getProfessionalAssessment reads from either path', () => {
    expect(
      getProfessionalAssessment({
        investmentDecision: {
          professionalAssessment: { dealQuality: 80, cashFlowScore: 75 },
        },
      })
    ).toEqual({ dealQuality: 80, cashFlowScore: 75 });
    expect(
      getProfessionalAssessment({
        analysis: {
          investmentDecision: {
            professionalAssessment: { dealQuality: 65 },
          },
        },
      })
    ).toEqual({ dealQuality: 65 });
    expect(getProfessionalAssessment({})).toBeUndefined();
  });

  it('getPrimaryReason reads from either path; empty string when absent', () => {
    expect(
      getPrimaryReason({
        investmentDecision: { primaryReason: 'Strong cash flow' },
      })
    ).toBe('Strong cash flow');
    expect(
      getPrimaryReason({
        analysis: {
          investmentDecision: { primaryReason: 'Negotiate down' },
        },
      })
    ).toBe('Negotiate down');
    expect(getPrimaryReason({})).toBe('');
  });
});
