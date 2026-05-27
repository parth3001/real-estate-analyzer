/**
 * Tests for Layer 4 (narrative composer) — Task #16, Path B.
 *
 * Focus: the prompt + structured input the LLM sees, and the handling
 * of the response. The LLM itself is mocked — we trust the prompt
 * design and verify everything around it. End-to-end LLM behavior is
 * the Step 5 integration test's job.
 */

import { composeNarrative, _internal } from '../narrativeComposer';
import type { AnthropicAdapter } from '../../../agents/llm/anthropicAdapter';
import type { StressTestResult } from '../schemas';

function mockAdapter(textResponse: string): AnthropicAdapter {
  return {
    call: jest.fn().mockResolvedValue({
      text: textResponse,
      usage: { inputTokens: 200, outputTokens: 100, cachedTokens: 0 },
      model: 'claude-haiku-test',
      stopReason: 'end_turn',
    }),
    callWithTools: jest.fn(),
    stream: jest.fn(),
  } as unknown as AnthropicAdapter;
}

function fakeResult(): StressTestResult {
  return {
    baseline: {
      dealQuality: 49,
      qualityLabel: 'Below professional standards',
      factorScores: {
        cashFlow: 0,
        irr: 65,
        marketStrength: 85,
        debtStructure: 53,
        exitStrategy: 70,
        capRate: 40,
        propertyRisk: 60,
      },
      monthlyCashFlow: -119,
      capRate: 4.2,
      cashOnCashReturn: -1.1,
      dscr: 0.88,
      walkAwayPrice: 157646,
      irr: 0.053,
    },
    stressed: {
      dealQuality: 32,
      qualityLabel: 'Below professional standards',
      factorScores: {
        cashFlow: 0,
        irr: 50,
        marketStrength: 85,
        debtStructure: 38,
        exitStrategy: 70,
        capRate: 35,
        propertyRisk: 60,
      },
      monthlyCashFlow: -210,
      capRate: 4.2,
      cashOnCashReturn: -3.5,
      dscr: 0.79,
      walkAwayPrice: 157646,
      irr: 0.038,
    },
    deltas: [
      {
        field: 'mortgageRate',
        label: 'Mortgage rate',
        baselineValue: 6.51,
        stressedValue: 7.5,
        engineUnit: 'percent',
      },
    ],
    warnings: [],
  };
}

describe('composeNarrative — Layer 4', () => {
  it('passes a structured input that includes the baseline + stressed + deltas', async () => {
    const adapter = mockAdapter("At 7.5% rate, the deal scores **32** — down from **49**.");
    const call = (adapter.call as jest.Mock);

    await composeNarrative({
      userMessage: 'stress at 7.5%',
      result: fakeResult(),
      adapter,
    });

    expect(call).toHaveBeenCalledTimes(1);
    const callArgs = call.mock.calls[0][0];
    const userTurn = callArgs.userPrompt;

    // The user-turn payload must contain the baseline + stressed numbers
    // and the delta. Without these in the prompt, the LLM has nothing to
    // narrate from.
    expect(userTurn).toMatch(/BASELINE/);
    expect(userTurn).toMatch(/STRESSED/);
    expect(userTurn).toMatch(/49/);
    expect(userTurn).toMatch(/32/);
    expect(userTurn).toMatch(/Mortgage rate/);
    expect(userTurn).toMatch(/6\.51%/);
    expect(userTurn).toMatch(/7\.50%/);
  });

  it('includes the user message so the LLM has request context', async () => {
    const adapter = mockAdapter('Narrative text.');
    const call = (adapter.call as jest.Mock);

    await composeNarrative({
      userMessage: 'stress at 7.5%',
      result: fakeResult(),
      adapter,
    });

    const userTurn = call.mock.calls[0][0].userPrompt;
    expect(userTurn).toMatch(/USER MESSAGE/);
    expect(userTurn).toMatch(/stress at 7\.5%/);
  });

  it('surfaces warnings in the prompt when present', async () => {
    const result = fakeResult();
    result.warnings = ['Mortgage rate of 50% is above the maximum of 25.'];

    const adapter = mockAdapter('Narrative.');
    const call = (adapter.call as jest.Mock);

    await composeNarrative({
      userMessage: 'stress at 50%',
      result,
      adapter,
    });

    const userTurn = call.mock.calls[0][0].userPrompt;
    expect(userTurn).toMatch(/WARNINGS/);
    expect(userTurn).toMatch(/above the maximum/);
  });

  it('uses haiku tier + low temperature (bounded prose generation)', async () => {
    const adapter = mockAdapter('Narrative.');
    const call = (adapter.call as jest.Mock);

    await composeNarrative({
      userMessage: 'stress at 7.5%',
      result: fakeResult(),
      adapter,
    });

    const callArgs = call.mock.calls[0][0];
    expect(callArgs.tier).toBe('haiku');
    expect(callArgs.temperature).toBeLessThanOrEqual(0.3);
  });

  it('passes the strict system prompt enforcing "no invented numbers"', async () => {
    const adapter = mockAdapter('Narrative.');
    const call = (adapter.call as jest.Mock);

    await composeNarrative({
      userMessage: 'stress at 7.5%',
      result: fakeResult(),
      adapter,
    });

    const sys = call.mock.calls[0][0].systemPrompt;
    expect(sys).toMatch(/HARD RULES/);
    expect(sys).toMatch(/CAN ONLY cite numbers/i);
    expect(sys).toMatch(/CANNOT invent/i);
  });

  it('returns the LLM text trimmed + usage counts', async () => {
    const adapter = mockAdapter('  At 7.5%, the deal scores 32.  \n');
    const out = await composeNarrative({
      userMessage: 'stress at 7.5%',
      result: fakeResult(),
      adapter,
    });

    expect(out.text).toBe('At 7.5%, the deal scores 32.');
    expect(out.usage.inputTokens).toBe(200);
    expect(out.usage.outputTokens).toBe(100);
  });
});

describe('renderResultForLlm — formatting', () => {
  it('formats dollar values with $ prefix and thousands separators', () => {
    expect(_internal.fmtDollars(157646)).toBe('$157,646');
    expect(_internal.fmtDollars(-119)).toBe('-$119');
    expect(_internal.fmtDollars(0)).toBe('$0');
  });

  it('formats percent deltas with two decimals', () => {
    const out = _internal.formatDelta({
      field: 'mortgageRate',
      label: 'Mortgage rate',
      baselineValue: 6.51,
      stressedValue: 7.5,
      engineUnit: 'percent',
    });
    expect(out).toBe('Mortgage rate: 6.51% → 7.50%');
  });

  it('formats dollar deltas with $ prefix', () => {
    const out = _internal.formatDelta({
      field: 'rent',
      label: 'Monthly rent',
      baselineValue: 1800,
      stressedValue: 1500,
      engineUnit: 'dollars',
    });
    expect(out).toBe('Monthly rent: $1,800 → $1,500');
  });

  it('formats years deltas with "yr" suffix', () => {
    const out = _internal.formatDelta({
      field: 'holdPeriod',
      label: 'Hold period',
      baselineValue: 10,
      stressedValue: 7,
      engineUnit: 'years',
    });
    expect(out).toBe('Hold period: 10 yr → 7 yr');
  });
});
