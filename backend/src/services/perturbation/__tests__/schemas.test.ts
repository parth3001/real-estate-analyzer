/**
 * Tests for the perturbation Zod schemas — Task #16 Path B.
 *
 * The schemas are the trust boundary between Layer 2 (LLM extractor) and
 * Layer 3 (deterministic runner). These tests lock down that:
 *   - The LLM cannot omit the unit (the original bug's root)
 *   - The LLM cannot invent field names not in the registry
 *   - The LLM cannot pass a string where a number is expected
 *   - Out-of-range and malformed inputs are rejected at the boundary
 */

import {
  PerturbationSpecSchema,
  StressTestRequestSchema,
} from '../schemas';

describe('PerturbationSpecSchema — the Layer-2 trust boundary', () => {
  describe('happy path', () => {
    it('accepts a well-formed perturbation', () => {
      const result = PerturbationSpecSchema.parse({
        field: 'mortgageRate',
        value: 7.5,
        unit: 'percent',
        operation: 'set',
      });
      expect(result.field).toBe('mortgageRate');
      expect(result.value).toBe(7.5);
      expect(result.unit).toBe('percent');
    });

    it("defaults operation to 'set' when omitted", () => {
      const result = PerturbationSpecSchema.parse({
        field: 'rent',
        value: 1500,
        unit: 'dollars',
      });
      expect(result.operation).toBe('set');
    });

    it('accepts an optional rationale up to 140 chars', () => {
      const result = PerturbationSpecSchema.parse({
        field: 'vacancy',
        value: 8,
        unit: 'percent',
        rationale: 'Stress-testing higher vacancy as a market-softening scenario',
      });
      expect(result.rationale).toBeDefined();
    });
  });

  describe('the original-bug defenses', () => {
    it('REJECTS missing unit (the exact shape that caused the 81/100 bug)', () => {
      // Before Path B, the LLM was passing { field, value } without a unit
      // declaration. Engine silently treated 0.075 as 0.075%. This schema
      // closes that hole.
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'mortgageRate',
          value: 0.075,
          // unit: omitted — bug shape
        })
      ).toThrow();
    });

    it('rejects a field name not in the registry', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'schoolDistrictRating', // not a perturbable engine input
          value: 9,
          unit: 'count',
        })
      ).toThrow();
    });

    it('rejects a string value where number is required', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'rent',
          value: '$1,500', // LLM is sloppy and includes formatting
          unit: 'dollars',
        })
      ).toThrow();
    });

    it('rejects an unknown unit', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'mortgageRate',
          value: 7.5,
          unit: 'bps', // basis points — not in our enum (caller must convert)
        })
      ).toThrow();
    });

    it('rejects NaN and Infinity', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'rent',
          value: NaN,
          unit: 'dollars',
        })
      ).toThrow();
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'rent',
          value: Infinity,
          unit: 'dollars',
        })
      ).toThrow();
    });

    it('rejects an unknown operation', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'rent',
          value: 100,
          unit: 'dollars',
          operation: 'multiply_by', // not in the enum
        })
      ).toThrow();
    });

    it('rejects a rationale exceeding 140 chars (keeps narration compact)', () => {
      expect(() =>
        PerturbationSpecSchema.parse({
          field: 'rent',
          value: 1500,
          unit: 'dollars',
          rationale: 'a'.repeat(141),
        })
      ).toThrow();
    });
  });
});

describe('StressTestRequestSchema — the Layer-3 input boundary', () => {
  const validHex = 'a'.repeat(24);

  it('accepts a well-formed request', () => {
    const result = StressTestRequestSchema.parse({
      priorDecisionId: validHex,
      userId: validHex,
      perturbations: [
        { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
      ],
    });
    expect(result.perturbations).toHaveLength(1);
  });

  it('accepts multiple perturbations (the multi-field stress-test case)', () => {
    const result = StressTestRequestSchema.parse({
      priorDecisionId: validHex,
      userId: validHex,
      perturbations: [
        { field: 'mortgageRate', value: 8, unit: 'percent' },
        { field: 'rent', value: 1500, unit: 'dollars' },
        { field: 'vacancy', value: 10, unit: 'percent' },
      ],
    });
    expect(result.perturbations).toHaveLength(3);
  });

  it('requires at least one perturbation', () => {
    expect(() =>
      StressTestRequestSchema.parse({
        priorDecisionId: validHex,
        userId: validHex,
        perturbations: [],
      })
    ).toThrow();
  });

  it('caps perturbations at 10 (sanity bound; prevents runaway combinatorial)', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({
      field: 'rent' as const,
      value: 1000 + i,
      unit: 'dollars' as const,
    }));
    expect(() =>
      StressTestRequestSchema.parse({
        priorDecisionId: validHex,
        userId: validHex,
        perturbations: eleven,
      })
    ).toThrow();
  });

  it('rejects malformed priorDecisionId (not 24-char hex)', () => {
    expect(() =>
      StressTestRequestSchema.parse({
        priorDecisionId: 'not-a-real-id',
        userId: validHex,
        perturbations: [{ field: 'rent', value: 1500, unit: 'dollars' }],
      })
    ).toThrow();
  });

  it('rejects malformed userId (not 24-char hex)', () => {
    expect(() =>
      StressTestRequestSchema.parse({
        priorDecisionId: validHex,
        userId: 'whoami',
        perturbations: [{ field: 'rent', value: 1500, unit: 'dollars' }],
      })
    ).toThrow();
  });
});
