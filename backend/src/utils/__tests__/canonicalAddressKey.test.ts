/**
 * canonicalAddressKey — unit tests.
 *
 * The whole point of this helper is collapsing user-typed variants
 * to a stable key. Each test pair is a "these MUST resolve to the
 * same key" claim — driven by the real-world ambiguities we see in
 * the SFR + MF wizard inputs and RentCast responses.
 */

import { buildCanonicalAddressKey } from '../canonicalAddressKey';

describe('canonicalAddressKey', () => {
  it('produces a stable joined key for a complete address', () => {
    const key = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
    });
    expect(key).toBe('123 main st|austin|TX|78701');
  });

  it('collapses "Street" and "St" to the same key', () => {
    const a = buildCanonicalAddressKey({
      street: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
    });
    const b = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
    });
    expect(a).toBe(b);
  });

  it('collapses "Avenue" and "Ave"', () => {
    const a = buildCanonicalAddressKey({
      street: '500 Elm Avenue',
      city: 'Denver',
      state: 'CO',
    });
    const b = buildCanonicalAddressKey({
      street: '500 elm ave',
      city: 'Denver',
      state: 'CO',
    });
    expect(a).toBe(b);
  });

  it('strips punctuation and lowercases', () => {
    const key = buildCanonicalAddressKey({
      street: '123 Main St.',
      city: 'Austin,',
      state: 'TX',
    });
    expect(key).toBe('123 main st|austin|TX|');
  });

  it('normalizes capitalization differences in city', () => {
    const a = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'NEW YORK',
      state: 'NY',
    });
    const b = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'new york',
      state: 'NY',
    });
    expect(a).toBe(b);
  });

  it('keeps state uppercase + 2 letters', () => {
    expect(
      buildCanonicalAddressKey({
        street: '123 Main St',
        city: 'Austin',
        state: 'tx',
      })
    ).toContain('|TX|');
  });

  it('truncates ZIP+4 to 5 digits', () => {
    const key = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701-1234',
    });
    expect(key).toBe('123 main st|austin|TX|78701');
  });

  it('collapses whitespace runs in the street', () => {
    const a = buildCanonicalAddressKey({
      street: '123   Main    St',
      city: 'Austin',
      state: 'TX',
    });
    const b = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
    });
    expect(a).toBe(b);
  });

  it('does NOT smush suffix variants inside other words', () => {
    // "Lakelane Dr" must NOT collapse into "lakeln dr"
    const key = buildCanonicalAddressKey({
      street: '500 Lakelane Dr',
      city: 'Austin',
      state: 'TX',
    });
    expect(key).toBe('500 lakelane dr|austin|TX|');
  });

  it('handles missing zipCode as empty trailing segment', () => {
    const key = buildCanonicalAddressKey({
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
    });
    expect(key.endsWith('|')).toBe(true);
  });

  it('throws on missing required fields', () => {
    expect(() =>
      buildCanonicalAddressKey({
        street: '',
        city: 'Austin',
        state: 'TX',
      })
    ).toThrow(/street is required/);
    expect(() =>
      buildCanonicalAddressKey({
        street: '123 Main',
        city: '',
        state: 'TX',
      })
    ).toThrow(/city is required/);
    expect(() =>
      buildCanonicalAddressKey({
        street: '123 Main',
        city: 'Austin',
        state: '',
      })
    ).toThrow(/state is required/);
  });
});
