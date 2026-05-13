/**
 * W9-S1 acceptance test — Anthropic pricing helper.
 *
 * Pure function; no Mongo, no LLM. Pins the pricing table values as
 * a tripwire: if Anthropic raises prices and the table doesn't update,
 * cost computations silently drift. These tests are the canary.
 */

import {
  computeAnthropicCostCents,
  ANTHROPIC_PRICING_USD_PER_M_TOKENS,
} from '../anthropicPricing';

describe('anthropicPricing (W9-S1)', () => {
  // ===== Pricing-table tripwire =====

  describe('ANTHROPIC_PRICING_USD_PER_M_TOKENS table', () => {
    it('pins Haiku at $1 input / $5 output / $0.10 cached (May 2026)', () => {
      expect(ANTHROPIC_PRICING_USD_PER_M_TOKENS.haiku).toEqual({
        input: 1,
        output: 5,
        cached: 0.1,
      });
    });

    it('pins Sonnet at $3 input / $15 output / $0.30 cached', () => {
      expect(ANTHROPIC_PRICING_USD_PER_M_TOKENS.sonnet).toEqual({
        input: 3,
        output: 15,
        cached: 0.3,
      });
    });

    it('pins Opus at $15 input / $75 output / $1.50 cached', () => {
      expect(ANTHROPIC_PRICING_USD_PER_M_TOKENS.opus).toEqual({
        input: 15,
        output: 75,
        cached: 1.5,
      });
    });

    it('cached rate is 10% of input rate for every tier', () => {
      for (const tier of ['haiku', 'sonnet', 'opus'] as const) {
        const p = ANTHROPIC_PRICING_USD_PER_M_TOKENS[tier];
        expect(p.cached).toBeCloseTo(p.input * 0.1, 6);
      }
    });
  });

  // ===== Cost computation =====

  describe('computeAnthropicCostCents', () => {
    // Intent classifier example from costs doc §4.1
    it('computes a Haiku call with cache: 1500 input / 300 output / 1500 cached → ~0.165¢', () => {
      const cents = computeAnthropicCostCents({
        tier: 'haiku',
        inputTokens: 1500,
        outputTokens: 300,
        cachedTokens: 1500,
      });
      // uncached=0; cost_$ = (0*1 + 300*5 + 1500*0.1) / 1M = 0.00165
      // costCents = 0.165
      expect(cents).toBeCloseTo(0.165, 6);
    });

    // Sonnet call example
    it('computes a Sonnet call: 6000 input / 200 output / 5000 cached → ~0.75¢', () => {
      const cents = computeAnthropicCostCents({
        tier: 'sonnet',
        inputTokens: 6000,
        outputTokens: 200,
        cachedTokens: 5000,
      });
      // uncached=1000; cost_$ = (1000*3 + 200*15 + 5000*0.3) / 1M = 0.0075
      // costCents = 0.75
      expect(cents).toBeCloseTo(0.75, 6);
    });

    // Opus call example
    it('computes an Opus call: 3000 input / 600 output / 0 cached → ~9¢', () => {
      const cents = computeAnthropicCostCents({
        tier: 'opus',
        inputTokens: 3000,
        outputTokens: 600,
      });
      // cost_$ = (3000*15 + 600*75) / 1M = 0.045 + 0.045 = 0.09
      // costCents = 9
      expect(cents).toBeCloseTo(9, 6);
    });

    it('treats cachedTokens=undefined as zero-cached', () => {
      const a = computeAnthropicCostCents({
        tier: 'haiku',
        inputTokens: 1000,
        outputTokens: 100,
      });
      const b = computeAnthropicCostCents({
        tier: 'haiku',
        inputTokens: 1000,
        outputTokens: 100,
        cachedTokens: 0,
      });
      expect(a).toBeCloseTo(b, 8);
    });

    it('zero tokens → zero cost', () => {
      expect(
        computeAnthropicCostCents({ tier: 'haiku', inputTokens: 0, outputTokens: 0 })
      ).toBe(0);
    });

    it('clamps cachedTokens to inputTokens (defensive against caller bugs)', () => {
      // Caller passes inconsistent counts: 100 input but 200 cached.
      // Function clamps cached to 100 rather than computing negative uncached.
      const cents = computeAnthropicCostCents({
        tier: 'haiku',
        inputTokens: 100,
        outputTokens: 0,
        cachedTokens: 200,
      });
      // Equivalent to: 100 fully cached, 0 uncached, 0 output
      // cost_$ = 100 * 0.1 / 1M = 0.00001
      // costCents = 0.001
      expect(cents).toBeCloseTo(0.001, 8);
    });
  });

  // ===== Validation =====

  describe('input validation', () => {
    it('throws on negative inputTokens', () => {
      expect(() =>
        computeAnthropicCostCents({ tier: 'haiku', inputTokens: -1, outputTokens: 0 })
      ).toThrow(/inputTokens/);
    });

    it('throws on negative outputTokens', () => {
      expect(() =>
        computeAnthropicCostCents({ tier: 'haiku', inputTokens: 0, outputTokens: -1 })
      ).toThrow(/outputTokens/);
    });

    it('throws on negative cachedTokens', () => {
      expect(() =>
        computeAnthropicCostCents({
          tier: 'haiku',
          inputTokens: 100,
          outputTokens: 0,
          cachedTokens: -1,
        })
      ).toThrow(/cachedTokens/);
    });

    it('throws on NaN tokens', () => {
      expect(() =>
        computeAnthropicCostCents({
          tier: 'haiku',
          inputTokens: NaN,
          outputTokens: 0,
        })
      ).toThrow();
    });

    it('throws on unknown tier', () => {
      expect(() =>
        computeAnthropicCostCents({
          tier: 'gemini' as unknown as 'haiku',
          inputTokens: 100,
          outputTokens: 100,
        })
      ).toThrow(/unknown tier/);
    });
  });

  // ===== Monotonicity (sanity invariants) =====

  describe('monotonicity invariants', () => {
    it('more output tokens → strictly higher cost', () => {
      const a = computeAnthropicCostCents({ tier: 'sonnet', inputTokens: 1000, outputTokens: 100 });
      const b = computeAnthropicCostCents({ tier: 'sonnet', inputTokens: 1000, outputTokens: 200 });
      expect(b).toBeGreaterThan(a);
    });

    it('more cached (less uncached) → strictly lower cost (cache discount works)', () => {
      const a = computeAnthropicCostCents({
        tier: 'sonnet',
        inputTokens: 5000,
        outputTokens: 0,
        cachedTokens: 0,
      });
      const b = computeAnthropicCostCents({
        tier: 'sonnet',
        inputTokens: 5000,
        outputTokens: 0,
        cachedTokens: 4500,
      });
      expect(b).toBeLessThan(a);
    });

    it('Opus call costs strictly more than Sonnet for identical token counts', () => {
      const sonnet = computeAnthropicCostCents({
        tier: 'sonnet',
        inputTokens: 1000,
        outputTokens: 1000,
      });
      const opus = computeAnthropicCostCents({
        tier: 'opus',
        inputTokens: 1000,
        outputTokens: 1000,
      });
      expect(opus).toBeGreaterThan(sonnet);
    });

    it('Sonnet > Haiku for identical token counts', () => {
      const haiku = computeAnthropicCostCents({
        tier: 'haiku',
        inputTokens: 1000,
        outputTokens: 1000,
      });
      const sonnet = computeAnthropicCostCents({
        tier: 'sonnet',
        inputTokens: 1000,
        outputTokens: 1000,
      });
      expect(sonnet).toBeGreaterThan(haiku);
    });
  });
});
