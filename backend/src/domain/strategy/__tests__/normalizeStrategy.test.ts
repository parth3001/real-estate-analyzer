/**
 * normalizeStrategy unit tests — Issue #243 invariants (2026-07-12).
 *
 * Every invariant from the Architect's design is covered here — one
 * `it` per invariant so a regression is immediately identifiable.
 */

import {
  normalizeStrategy,
  assertCanonicalStrategy,
  toLegacyDealStrategy,
  fromLegacyDealStrategy,
  resetNonCanonicalInputCount,
  getNonCanonicalInputCount,
  CanonicalStrategy,
} from '..';

describe('normalizeStrategy — Issue #243 canonical strategy', () => {
  beforeEach(() => {
    resetNonCanonicalInputCount();
  });

  // Invariant #2 — every vocabulary maps to canonical snake.
  describe('vocabulary translation', () => {
    it('canonicalizes kebab-case buy-hold', () => {
      expect(normalizeStrategy('buy-hold')).toBe('buy_hold');
    });
    it('canonicalizes kebab-case house-hack', () => {
      expect(normalizeStrategy('house-hack')).toBe('house_hack');
    });
    it('canonicalizes SCREAMING_SNAKE BUY_HOLD', () => {
      expect(normalizeStrategy('BUY_HOLD')).toBe('buy_hold');
    });
    it('canonicalizes SCREAMING_SNAKE HOUSE_HACK', () => {
      expect(normalizeStrategy('HOUSE_HACK')).toBe('house_hack');
    });
    it('canonicalizes SCREAMING_SNAKE BRRRR', () => {
      expect(normalizeStrategy('BRRRR')).toBe('brrrr');
    });
    it("canonicalizes misspelling 'BRRR' → 'brrrr' (PipelineDeal alias)", () => {
      expect(normalizeStrategy('BRRR')).toBe('brrrr');
    });
    it("canonicalizes spaced 'Buy & Hold'", () => {
      expect(normalizeStrategy('Buy & Hold')).toBe('buy_hold');
    });
    it('canonical snake passes through unchanged', () => {
      expect(normalizeStrategy('buy_hold')).toBe('buy_hold');
      expect(normalizeStrategy('brrrr')).toBe('brrrr');
      expect(normalizeStrategy('house_hack')).toBe('house_hack');
    });
    it('case-insensitive fallback for mixed case', () => {
      expect(normalizeStrategy('Buy-Hold')).toBe('buy_hold');
      expect(normalizeStrategy('Brrrr')).toBe('brrrr');
    });
  });

  // Invariant #3 — philosophy values explicitly rejected.
  describe('philosophy values from DecisionEvent.userContext', () => {
    it('rejects "cashflow"', () => {
      expect(normalizeStrategy('cashflow')).toBeNull();
    });
    it('rejects "appreciation"', () => {
      expect(normalizeStrategy('appreciation')).toBeNull();
    });
    it('rejects "balanced"', () => {
      expect(normalizeStrategy('balanced')).toBeNull();
    });
  });

  // Empty / null / wrong shape.
  describe('non-string / empty input', () => {
    it('null → null', () => expect(normalizeStrategy(null)).toBeNull());
    it('undefined → null', () => expect(normalizeStrategy(undefined)).toBeNull());
    it('empty string → null', () => expect(normalizeStrategy('')).toBeNull());
    it('whitespace-only → null', () => expect(normalizeStrategy('   ')).toBeNull());
    it('number → null', () => expect(normalizeStrategy(42)).toBeNull());
    it('object → null', () => expect(normalizeStrategy({})).toBeNull());
  });

  // 'Multi-Family' is a propertyType, not a strategy.
  it("rejects 'Multi-Family' (propertyType, not strategy)", () => {
    expect(normalizeStrategy('Multi-Family')).toBeNull();
  });

  // Genuinely unknown.
  it('unknown input → null', () => {
    expect(normalizeStrategy('flip-and-hold')).toBeNull();
    expect(normalizeStrategy('not-a-strategy')).toBeNull();
  });

  // Invariant #2 (bottom) — idempotency.
  describe('idempotency (P10, invariant #2)', () => {
    const cases: Array<[string, CanonicalStrategy | null]> = [
      ['buy_hold', 'buy_hold'],
      ['buy-hold', 'buy_hold'],
      ['BUY_HOLD', 'buy_hold'],
      ['brrrr', 'brrrr'],
      ['house_hack', 'house_hack'],
      ['unknown', null],
    ];
    for (const [input, expected] of cases) {
      it(`normalize(normalize(${JSON.stringify(input)})) === normalize(${JSON.stringify(input)})`, () => {
        const first = normalizeStrategy(input);
        const second = normalizeStrategy(first);
        // null → normalize(null) === null; non-null → passes through.
        if (first === null) {
          expect(second).toBeNull();
        } else {
          expect(second).toBe(first);
          expect(first).toBe(expected);
        }
      });
    }
  });

  // Explicit regression: pre-flight silent-drop bug on house_hack.
  describe("regression — house_hack silent drop (#243)", () => {
    it("normalizeStrategy('house_hack') === 'house_hack'", () => {
      expect(normalizeStrategy('house_hack')).toBe('house_hack');
    });
    it("normalizeStrategy('house-hack') === 'house_hack'", () => {
      expect(normalizeStrategy('house-hack')).toBe('house_hack');
    });
  });

  // Observability — P16 (silent drops unacceptable).
  describe('observability counter (P16)', () => {
    it('increments on non-canonical alias', () => {
      resetNonCanonicalInputCount();
      normalizeStrategy('buy-hold');
      expect(getNonCanonicalInputCount()).toBe(1);
    });
    it('does NOT increment on canonical snake (idempotent read is quiet)', () => {
      resetNonCanonicalInputCount();
      normalizeStrategy('buy_hold');
      normalizeStrategy('brrrr');
      normalizeStrategy('house_hack');
      expect(getNonCanonicalInputCount()).toBe(0);
    });
    it('increments on unknown input', () => {
      resetNonCanonicalInputCount();
      normalizeStrategy('not-a-strategy');
      expect(getNonCanonicalInputCount()).toBe(1);
    });
  });
});

describe('assertCanonicalStrategy', () => {
  it('returns canonical when input is valid', () => {
    expect(assertCanonicalStrategy('buy-hold')).toBe('buy_hold');
  });
  it('throws when input is invalid and no default', () => {
    expect(() => assertCanonicalStrategy('not-a-strategy')).toThrow(/cannot canonicalize/);
  });
  it('falls back to default when supplied', () => {
    expect(
      assertCanonicalStrategy('not-a-strategy', { defaultTo: 'buy_hold' })
    ).toBe('buy_hold');
  });
});

describe('toLegacyDealStrategy / fromLegacyDealStrategy — Invariant #4', () => {
  it("toLegacyDealStrategy('buy_hold') === 'buy-hold'", () => {
    expect(toLegacyDealStrategy('buy_hold')).toBe('buy-hold');
  });
  it("toLegacyDealStrategy('brrrr') === 'brrrr'", () => {
    expect(toLegacyDealStrategy('brrrr')).toBe('brrrr');
  });
  it("toLegacyDealStrategy('house_hack') === 'house-hack'", () => {
    expect(toLegacyDealStrategy('house_hack')).toBe('house-hack');
  });

  // Round-trip for every canonical value.
  const canonicals: CanonicalStrategy[] = ['buy_hold', 'brrrr', 'house_hack'];
  for (const c of canonicals) {
    it(`round-trip normalizeStrategy(toLegacyDealStrategy('${c}')) === '${c}'`, () => {
      expect(normalizeStrategy(toLegacyDealStrategy(c))).toBe(c);
    });
  }

  it('fromLegacyDealStrategy composes with normalizeStrategy', () => {
    expect(fromLegacyDealStrategy('buy-hold')).toBe('buy_hold');
    expect(fromLegacyDealStrategy('house-hack')).toBe('house_hack');
    expect(fromLegacyDealStrategy(undefined)).toBeNull();
  });
});
