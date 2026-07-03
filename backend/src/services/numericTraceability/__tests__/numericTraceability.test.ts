/**
 * numericTraceability tests — Issue #226 Session 4.
 *
 * Uses the exact Test 2 confabulation cases as golden fixtures. If the
 * validator can catch these, it catches the bug class.
 */

import {
  extractNumericCandidates,
  collectNumericValues,
  numericMatch,
  validateNumericTraceability,
} from '../index';

// ===== Extraction =====

describe('extractNumericCandidates', () => {
  it('finds dollar amounts with commas', () => {
    const c = extractNumericCandidates('The price is $158,000.');
    expect(c).toHaveLength(1);
    expect(c[0].value).toBe(158000);
    expect(c[0].unit).toBe('dollars');
    expect(c[0].raw).toBe('$158,000');
  });

  it('parses k/M/B suffixes', () => {
    const c = extractNumericCandidates('At $250k or $1.5M for the deal.');
    expect(c.map((x) => x.value)).toEqual([250000, 1500000]);
  });

  it('finds percentages', () => {
    const c = extractNumericCandidates('DSCR-refi rate of 8.43% and vacancy 5%.');
    const values = c.filter((x) => x.unit === 'percent').map((x) => x.value);
    expect(values).toEqual([8.43, 5]);
  });

  it('finds DSCR / ratio phrases', () => {
    const c = extractNumericCandidates(
      'DSCR of 0.61 is unlendable; ratio 1.20 is standard.'
    );
    const ratios = c.filter((x) => x.unit === 'ratio').map((x) => x.value);
    expect(ratios).toEqual([0.61, 1.2]);
  });

  it('detects hedged phrasing (Category 2 market range)', () => {
    const c = extractNumericCandidates(
      'Renovated 3/2 SFRs in Garland typically rent $2,400-$2,550/mo.'
    );
    expect(c.every((x) => x.isHedged)).toBe(true);
  });

  it('detects hedged phrasing (Category 3 IRS fact)', () => {
    const c = extractNumericCandidates(
      'IRS depreciation is 27.5 years for residential rentals.'
    );
    expect(c.every((x) => x.isHedged)).toBe(true);
  });

  it('flags non-hedged deal-specific claims', () => {
    const c = extractNumericCandidates(
      'This deal recovered $80,321 at refi.'
    );
    expect(c[0].isHedged).toBe(false);
  });
});

// ===== Value collection from tool returns =====

describe('collectNumericValues', () => {
  it('finds raw numbers in nested objects', () => {
    const out = collectNumericValues({
      result: 158000,
      unit: 'dollars',
      formatted: '$158,000',
      inputsUsed: { afterRepairValue: 290000, rehabBudget: 45000 },
    });
    expect(out).toContain(158000);
    expect(out).toContain(290000);
    expect(out).toContain(45000);
  });

  it('parses numbers from formatted strings too', () => {
    const out = collectNumericValues({
      formatted: '$158,000',
      other: '93.08%',
    });
    expect(out).toContain(158000);
    expect(out).toContain(93.08);
  });

  it('traverses arrays', () => {
    const out = collectNumericValues([1, { x: 2 }, [3]]);
    expect(out.sort()).toEqual([1, 2, 3]);
  });
});

// ===== Fuzzy match tolerance =====

describe('numericMatch', () => {
  it('matches exact', () => {
    expect(numericMatch(158000, 158000)).toBe(true);
  });
  it('matches small floating-point drift', () => {
    expect(numericMatch(158000, 158000.01)).toBe(true);
  });
  it('matches rounding difference within default tolerance', () => {
    // Default tolerance 0.5%. 158000 vs 158790 = 0.5% exact.
    expect(numericMatch(158000, 158790, 0.005)).toBe(true);
  });
  it('rejects fundamentally different values', () => {
    // Test 2 A1 case: 253815 vs 158000 (the confabulation).
    expect(numericMatch(158000, 253815)).toBe(false);
  });
  it('handles zero strictly', () => {
    expect(numericMatch(0, 0)).toBe(true);
    expect(numericMatch(0, 0.001)).toBe(false);
  });
});

// ===== The full validator — golden fixtures from Test 2 =====

describe('validateNumericTraceability — Test 2 confabulation cases', () => {
  /**
   * GOLDEN CASE: Test 2 A1 — LLM invented "$253,815" as purchase
   * price when actual purchase was $185,000. Correct 70% rule answer
   * is $158,000. Validator MUST catch this class of drift.
   */
  it('CATCHES: LLM says $253,815 when only $185,000 and $158,000 are in tool returns', () => {
    const llmOutput =
      'The 70% rule answer: at $253,815 purchase price, this deal would clear the 70% rule.';
    const toolReturns = [
      {
        toolName: 'get_decision_breakdown',
        output: { purchasePrice: 185000, afterRepairValue: 290000 },
      },
      {
        toolName: 'compute_deal_metric',
        output: {
          kind: 'success',
          result: 158000,
          formatted: '$158,000',
          inputsUsed: { afterRepairValue: 290000, rehabBudget: 45000 },
        },
      },
    ];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    expect(report.violations.length).toBeGreaterThan(0);
    const violationValues = report.violations.map((v) => v.candidate.value);
    expect(violationValues).toContain(253815);
  });

  it('ACCEPTS: LLM correctly cites $158,000 from tool return', () => {
    const llmOutput =
      'At a purchase price of $158,000, this deal would clear the 70% rule ' +
      'you\'re $27,000 over your target.';
    const toolReturns = [
      {
        toolName: 'compute_deal_metric',
        output: {
          kind: 'success',
          result: 158000,
          formatted: '$158,000',
          inputsUsed: { afterRepairValue: 290000, rehabBudget: 45000 },
        },
      },
      // The $27,000 overage: 185000 − 158000 = 27000. If we ran a
      // second tool call that returned 27000, the LLM would be
      // traceable. Otherwise it's still LLM arithmetic. This test
      // documents that $27k IS NOT in the tool returns and would
      // be flagged.
    ];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    // $158,000 traces. $27,000 doesn't. So report has ONE violation
    // (the derived overage) — which is honest signal, not a false
    // positive: the LLM should call compute_deal_metric a second
    // time to derive the overage rather than subtract in its head.
    const traced = report.violations.filter(
      (v) => v.candidate.value === 158000
    );
    expect(traced.length).toBe(0); // $158,000 IS traceable
    const untraced = report.violations.filter(
      (v) => v.candidate.value === 27000
    );
    expect(untraced.length).toBe(1); // $27,000 is NOT (LLM subtracted)
  });

  it('IGNORES hedged Category 2 phrasing (market ranges)', () => {
    const llmOutput =
      'Renovated 3/2 SFRs in Garland typically rent $2,400-$2,550. ' +
      'A $30/sqft cosmetic rehab is normal.';
    const toolReturns: Array<{ toolName: string; output: unknown }> = [];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    expect(report.hedged).toBeGreaterThan(0);
    expect(report.violations.length).toBe(0);
  });

  it('IGNORES hedged Category 3 phrasing (IRS facts)', () => {
    const llmOutput =
      'IRS depreciation is 27.5 years for residential rental property. ' +
      'The recapture rate is 25% at sale.';
    const toolReturns: Array<{ toolName: string; output: unknown }> = [];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    expect(report.hedged).toBeGreaterThan(0);
    expect(report.violations.length).toBe(0);
  });

  /**
   * GOLDEN CASE: Test 2 D1 — LLM confabulated "$253,000" a second time
   * (cross-turn poisoning). Validator catches it independent of turn
   * history — just checks against current-turn tool returns.
   */
  it('CATCHES cross-turn poisoning: $253,000 not in tool returns even if it appeared last turn', () => {
    const llmOutput =
      'If you financed the $253,000 purchase, the loan balance would be lower.';
    const toolReturns = [
      {
        toolName: 'get_decision_breakdown',
        output: { purchasePrice: 185000 },
      },
    ];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    expect(report.violations.length).toBeGreaterThan(0);
    expect(
      report.violations.some((v) => v.candidate.value === 253000)
    ).toBe(true);
  });

  it('handles multi-tool provenance — number can come from any tool', () => {
    const llmOutput =
      'The deal has $80,321 recovered and a 93.08% recovery rate.';
    const toolReturns = [
      {
        toolName: 'get_decision_breakdown',
        output: { capitalRecovered: 80321 },
      },
      {
        toolName: 'compute_deal_metric',
        output: { result: 93.08, unit: 'percent', formatted: '93.08%' },
      },
    ];
    const report = validateNumericTraceability(llmOutput, toolReturns);
    expect(report.violations.length).toBe(0);
    expect(report.traced).toBe(2);
  });
});
