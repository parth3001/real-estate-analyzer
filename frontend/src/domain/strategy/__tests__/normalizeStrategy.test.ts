/**
 * Frontend normalizeStrategy parity tests — Issue #243 (2026-07-12).
 *
 * Mirrors backend behavior. Any new alias added must pass both suites.
 */

import {
  normalizeStrategy,
  assertCanonicalStrategy,
  toLegacyDealStrategy,
  type CanonicalStrategy,
} from '..';
import parityFixture from '../__fixtures__/strategyNormalizerCases.json';

describe('frontend normalizeStrategy — parity with backend', () => {
  it('canonicalizes kebab', () => {
    expect(normalizeStrategy('buy-hold')).toBe('buy_hold');
    expect(normalizeStrategy('house-hack')).toBe('house_hack');
  });
  it('canonicalizes SCREAMING', () => {
    expect(normalizeStrategy('BUY_HOLD')).toBe('buy_hold');
    expect(normalizeStrategy('BRRRR')).toBe('brrrr');
    expect(normalizeStrategy('BRRR')).toBe('brrrr');
    expect(normalizeStrategy('HOUSE_HACK')).toBe('house_hack');
  });
  it("canonicalizes 'Buy & Hold'", () => {
    expect(normalizeStrategy('Buy & Hold')).toBe('buy_hold');
  });
  it('canonical snake passes through', () => {
    expect(normalizeStrategy('buy_hold')).toBe('buy_hold');
    expect(normalizeStrategy('brrrr')).toBe('brrrr');
    expect(normalizeStrategy('house_hack')).toBe('house_hack');
  });
  it('rejects philosophy values', () => {
    expect(normalizeStrategy('cashflow')).toBeNull();
    expect(normalizeStrategy('appreciation')).toBeNull();
    expect(normalizeStrategy('balanced')).toBeNull();
  });
  it('rejects Multi-Family (propertyType, not strategy)', () => {
    expect(normalizeStrategy('Multi-Family')).toBeNull();
  });
  it('rejects unknown', () => {
    expect(normalizeStrategy('flip-and-hold')).toBeNull();
    expect(normalizeStrategy('')).toBeNull();
    expect(normalizeStrategy(null)).toBeNull();
    expect(normalizeStrategy(undefined)).toBeNull();
  });
  it('is idempotent', () => {
    const values = ['buy-hold', 'BUY_HOLD', 'Buy & Hold', 'house_hack'];
    for (const v of values) {
      const once = normalizeStrategy(v);
      const twice = normalizeStrategy(once);
      expect(twice).toBe(once);
    }
  });

  it('regression: house_hack does not collapse to buy_hold (#243)', () => {
    expect(normalizeStrategy('house_hack')).toBe('house_hack');
    expect(normalizeStrategy('house-hack')).toBe('house_hack');
  });

  it('toLegacyDealStrategy round-trips', () => {
    expect(toLegacyDealStrategy('buy_hold')).toBe('buy-hold');
    expect(toLegacyDealStrategy('brrrr')).toBe('brrrr');
    expect(toLegacyDealStrategy('house_hack')).toBe('house-hack');
    expect(normalizeStrategy(toLegacyDealStrategy('house_hack'))).toBe('house_hack');
  });

  it('assertCanonicalStrategy throws on unknown, respects defaultTo', () => {
    expect(() => assertCanonicalStrategy('nope')).toThrow();
    expect(assertCanonicalStrategy('nope', { defaultTo: 'buy_hold' })).toBe('buy_hold');
  });
});

// Iteration-2 (Issue #243, 2026-07-12, INV-5 FE/BE parity) — this
// suite iterates the SAME shared JSON fixture as
// `backend/src/domain/strategy/__tests__/normalizeStrategy.test.ts`.
// If backend AND frontend both pass, the two normalizers are provably
// aligned on the canonical vocabulary + alias table. Drift between
// the two JSON copies is guarded by
// `scripts/verify-strategy-parity-fixture.js`.
describe('parity fixture (P10, INV-5)', () => {
  const cases = (parityFixture as {
    cases: Array<{ raw: unknown; expected: CanonicalStrategy | null }>;
  }).cases;

  for (const { raw, expected } of cases) {
    it(`normalize(${JSON.stringify(raw)}) === ${JSON.stringify(expected)}`, () => {
      expect(normalizeStrategy(raw)).toBe(expected);
    });
  }

  it('idempotency across the entire fixture', () => {
    for (const { raw } of cases) {
      const first = normalizeStrategy(raw);
      const second = normalizeStrategy(first);
      expect(second).toBe(first);
    }
  });
});
