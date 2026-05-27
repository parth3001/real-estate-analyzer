/**
 * Tests for the Layer 2 perturbation extractor — Task #16, Path B.
 *
 * Two main coverage goals:
 *
 *   A) Bug-regression locks. The original 81/100 bug happened because the
 *      LLM passed a unit-less value (0.075 interpreted as 7.5%). These
 *      tests assert that:
 *        - The schema REJECTS extractions without explicit units.
 *        - Hallucinated field names are rejected.
 *        - Malformed LLM responses fall back to empty + reasoning, not crash.
 *
 *   B) Happy paths. Common stress-test phrasings extract to the right
 *      typed perturbation. Multi-field, increase_by/decrease_by, and unit
 *      variants all round-trip correctly.
 *
 * The AnthropicAdapter is mocked — we're testing extraction logic, not
 * the LLM. The real LLM gets tested via the integration tests at Step 5.
 */

import { extractPerturbations, _internal } from '../extractor';
import type { AnthropicAdapter } from '../../../agents/llm/anthropicAdapter';

// ===== Mock adapter =====

/**
 * Build a fake adapter that returns a fixed text response. Most tests use
 * this to simulate what the LLM would produce for a given prompt.
 */
function mockAdapter(textResponse: string): AnthropicAdapter {
  return {
    call: jest.fn().mockResolvedValue({
      text: textResponse,
      usage: { inputTokens: 100, outputTokens: 50, cachedTokens: 0 },
      model: 'claude-haiku-test',
      stopReason: 'end_turn',
    }),
    callWithTools: jest.fn(),
    stream: jest.fn(),
  } as unknown as AnthropicAdapter;
}

// ===== A. Happy paths =====

describe('extractPerturbations — happy paths', () => {
  it('extracts a single rate stress with explicit percent unit', async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'User requested a rate stress at 7.5%.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'stress at 7.5%',
      adapter,
    });

    expect(result.perturbations).toHaveLength(1);
    expect(result.perturbations[0].field).toBe('mortgageRate');
    expect(result.perturbations[0].value).toBe(7.5);
    expect(result.perturbations[0].unit).toBe('percent');
  });

  it('extracts a multi-field perturbation', async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 8, unit: 'percent', operation: 'set' },
          { field: 'rent', value: 1500, unit: 'dollars', operation: 'set' },
          { field: 'vacancy', value: 10, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Three-field stress request.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'rate 8%, rent $1,500, vacancy 10%',
      adapter,
    });

    expect(result.perturbations).toHaveLength(3);
    const fields = result.perturbations.map((p) => p.field);
    expect(fields).toEqual(['mortgageRate', 'rent', 'vacancy']);
  });

  it('extracts an increase_by perturbation', async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 1, unit: 'percent', operation: 'increase_by' },
        ],
        reasoning: 'User wants to increase rate by 1 percentage point.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'bump rate by 1 point',
      adapter,
    });

    expect(result.perturbations[0].operation).toBe('increase_by');
    expect(result.perturbations[0].value).toBe(1);
  });

  it('tolerates markdown code-fence wrapping', async () => {
    // LLMs sometimes wrap JSON in ```json ... ``` despite being told not to.
    const adapter = mockAdapter(
      '```json\n' +
        JSON.stringify({
          perturbations: [
            { field: 'rent', value: 2000, unit: 'dollars', operation: 'set' },
          ],
          reasoning: 'Rent set to $2,000.',
        }) +
        '\n```'
    );

    const result = await extractPerturbations({
      userMessage: 'rent at $2,000',
      adapter,
    });

    expect(result.perturbations).toHaveLength(1);
    expect(result.perturbations[0].field).toBe('rent');
  });

  it('tolerates a preamble before the JSON', async () => {
    const adapter = mockAdapter(
      'Here is the extraction:\n\n' +
        JSON.stringify({
          perturbations: [
            { field: 'vacancy', value: 8, unit: 'percent', operation: 'set' },
          ],
          reasoning: 'Vacancy at 8 percent.',
        }) +
        '\n\nLet me know if you need more.'
    );

    const result = await extractPerturbations({
      userMessage: 'stress at 8% vacancy',
      adapter,
    });

    expect(result.perturbations).toHaveLength(1);
    expect(result.perturbations[0].field).toBe('vacancy');
  });
});

// ===== B. Bug-regression locks =====

describe('extractPerturbations — bug-defense (the original 81/100 scenario)', () => {
  it('REJECTS extractions without an explicit unit (the exact bug shape)', async () => {
    // The bug was: LLM passed value without unit declaration, engine
    // silently mis-interpreted. Schema MUST reject this.
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          {
            field: 'mortgageRate',
            value: 0.075, // user said 7.5%, LLM "helpfully" converted to decimal
            // unit: omitted — bug shape
            operation: 'set',
          },
        ],
        reasoning: 'Rate stress.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'stress at 7.5%',
      adapter,
    });

    // Schema validation failure → empty perturbations + reasoning fallback.
    expect(result.perturbations).toEqual([]);
    expect(result.reasoning).toMatch(/didn't match the expected shape/i);
  });

  it("REJECTS a hallucinated field name not in the registry", async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          {
            field: 'schoolDistrictRating', // not in the registry
            value: 9,
            unit: 'count',
            operation: 'set',
          },
        ],
        reasoning: 'User wants to set school district rating.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'what if the school district was a 9?',
      adapter,
    });

    expect(result.perturbations).toEqual([]);
    expect(result.reasoning).toMatch(/didn't match the expected shape/i);
  });

  it('honors the user-declared unit even when value is small (NO silent conversion)', async () => {
    // Defensive: if the user genuinely says "0.5% rate" the LLM should
    // emit value=0.5 unit='percent', not value=0.005 unit='decimal_ratio'.
    // The schema accepts this faithfully because the unit is declared.
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 0.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Half-percent rate (very low, but user was explicit).',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'stress at 0.5% rate',
      adapter,
    });

    expect(result.perturbations[0].value).toBe(0.5);
    expect(result.perturbations[0].unit).toBe('percent');
  });

  it('also accepts decimal_ratio when the LLM correctly identifies it', async () => {
    // If the user genuinely typed "0.075" (a decimal), the LLM should
    // emit value=0.075 unit='decimal_ratio' — Layer 3 converts to percent.
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          {
            field: 'mortgageRate',
            value: 0.075,
            unit: 'decimal_ratio',
            operation: 'set',
          },
        ],
        reasoning: 'User wrote a decimal value.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'rate at 0.075',
      adapter,
    });

    expect(result.perturbations[0].unit).toBe('decimal_ratio');
    expect(result.perturbations[0].value).toBe(0.075);
  });

  it('rejects a stringified currency value (e.g., "$1,500" instead of 1500)', async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'rent', value: '$1,500', unit: 'dollars', operation: 'set' },
        ],
        reasoning: 'Rent at fifteen hundred dollars.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'rent at $1500',
      adapter,
    });

    expect(result.perturbations).toEqual([]);
  });
});

// ===== C. Graceful failures =====

describe('extractPerturbations — graceful failures', () => {
  it('returns empty + reasoning when the LLM returns malformed JSON', async () => {
    const adapter = mockAdapter('this is not JSON at all');

    const result = await extractPerturbations({
      userMessage: 'stress at 7%',
      adapter,
    });

    expect(result.perturbations).toEqual([]);
    expect(result.reasoning).toMatch(/couldn't parse/i);
  });

  it("returns empty + reasoning when the LLM legitimately can't extract", async () => {
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [],
        reasoning:
          'User asked a question rather than requesting a perturbation. Could not extract a valid stress test.',
      })
    );

    const result = await extractPerturbations({
      userMessage: 'can I stress-test rates?',
      adapter,
    });

    expect(result.perturbations).toEqual([]);
    expect(result.reasoning).toMatch(/asked a question/i);
  });

  it('does NOT throw on empty perturbations — empty is a valid output', async () => {
    const adapter = mockAdapter(
      JSON.stringify({ perturbations: [], reasoning: 'No perturbation detected.' })
    );

    await expect(
      extractPerturbations({ userMessage: 'hello', adapter })
    ).resolves.toMatchObject({ perturbations: [] });
  });
});

// ===== D. Token cost reporting =====

describe('extractPerturbations — usage reporting', () => {
  it('returns adapter usage counts for cost tracking', async () => {
    const adapter = mockAdapter(
      JSON.stringify({ perturbations: [], reasoning: 'noop' })
    );
    const result = await extractPerturbations({ userMessage: 'hi', adapter });

    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
  });
});

// ===== E. Internal helpers =====

describe('extractPerturbations — internal helpers', () => {
  it('renderFieldCatalog includes every registered field', () => {
    const catalog = _internal.renderFieldCatalog();
    for (const key of _internal.registryKeys) {
      expect(catalog).toContain(key);
    }
  });

  it('extractJsonObject handles bare JSON', () => {
    expect(_internal.extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('extractJsonObject handles JSON wrapped in code fences', () => {
    expect(_internal.extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('extractJsonObject throws on garbage', () => {
    expect(() => _internal.extractJsonObject('not json')).toThrow();
  });
});
