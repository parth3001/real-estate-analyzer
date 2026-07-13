/**
 * formatStrategyLabel unit tests — Issue #243 iteration-2 (2026-07-12).
 *
 * Every canonical value maps to the expected human-readable label.
 * Companion of `formatStrategyLabel.ts` — the single strategy display
 * projector per P10.
 */

import { formatStrategyLabel } from '..';
import type { CanonicalStrategy } from '..';

describe('formatStrategyLabel — Issue #243 iteration-2', () => {
  const cases: Array<[CanonicalStrategy, string]> = [
    ['buy_hold', 'Buy & Hold'],
    ['brrrr', 'BRRRR'],
    ['house_hack', 'House Hack'],
  ];

  for (const [canonical, expected] of cases) {
    it(`formatStrategyLabel(${JSON.stringify(canonical)}) === ${JSON.stringify(expected)}`, () => {
      expect(formatStrategyLabel(canonical)).toBe(expected);
    });
  }

  it('returns a stable label for every canonical value (no undefined)', () => {
    const all: CanonicalStrategy[] = ['buy_hold', 'brrrr', 'house_hack'];
    for (const s of all) {
      const label = formatStrategyLabel(s);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
