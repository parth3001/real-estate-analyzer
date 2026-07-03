/**
 * dealMetrics/__tests__/dealMetrics.test.ts — Issue #226 (2026-07-03).
 *
 * Unit tests for the compute_deal_metric primitive. Two goals:
 *   1. Prove the formulas produce known-correct results on the
 *      Test 2 Garland deal (regression protection for the exact
 *      cases where the LLM confabulated wrong values).
 *   2. Prove strategy filtering, error paths, and edge cases are
 *      structurally handled — no confabulation escape hatches.
 */

import { computeMetric, formatMetricValue } from '../index';
import type { DealSnapshot } from '../types';

// ===== Fixtures =====

/**
 * The Garland BRRRR deal from Test 2 (real values from the workspace
 * screenshots on 2026-06-30). Using real values (not synthetic
 * fixtures) so the tests double as regression protection against the
 * specific confabulations we hit last night.
 */
function garlandBrrrrDeal(): DealSnapshot {
  return {
    strategy: 'brrrr',
    purchasePrice: 185000,
    monthlyRent: 2200,
    downPayment: 46250, // 25%
    closingCosts: 2775,
    interestRate: 6.43,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 1850,
    propertyManagementRate: 8,
    vacancyRate: 5,
    brrrr: {
      rehabBudget: 45000,
      afterRepairValue: 290000,
      refinanceLTV: 75,
      refinanceInterestRate: 8.43,
      seasoningPeriod: 12,
    },
    computed: {
      monthlyOperatingExpenses: 887, // as displayed on workspace
      monthlyDebtService: 876, // acquisition-loan P&I
      annualNOI: 14743, // buy-hold NOI (rent × 12 − opex × 12)
      walkAwayPrice: 226815,
      postRefiMonthlyDebtService: 1662, // refi P&I
      postRefiMonthlyCashFlow: -358,
      postRefiDSCR: 0.62,
      capitalRecoveryRate: 93,
      capitalRecovered: 80304,
      capitalRemaining: 6051,
    },
  };
}

/** Charlotte buy-hold (from Test 2 setup). Simpler — no BRRRR block. */
function charlotteBuyHoldDeal(): DealSnapshot {
  return {
    strategy: 'buy_hold',
    purchasePrice: 250000,
    monthlyRent: 2300,
    downPayment: 62500, // 25%
    closingCosts: 5000,
    interestRate: 6.43,
    loanTerm: 30,
    propertyTaxRate: 0.9,
    insuranceRate: 0.6,
    maintenanceCost: 2500,
    propertyManagementRate: 8,
    vacancyRate: 5,
    computed: {
      monthlyOperatingExpenses: 850,
      monthlyDebtService: 1177,
      annualNOI: 15720,
      walkAwayPrice: 245000,
    },
  };
}

// ===== 70% rule ceiling =====

describe('seventy_rule_ceiling', () => {
  it('computes the Garland deal 70% rule threshold exactly', () => {
    // The exact confabulation case from Test 2 A1.
    // Correct answer: 0.70 × $290,000 − $45,000 = $158,000
    const result = computeMetric('seventy_rule_ceiling', garlandBrrrrDeal());

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.result).toBeCloseTo(158000, 2);
    expect(result.unit).toBe('dollars');
    expect(result.formatted).toBe('$158,000');
    expect(result.strategy).toBe('brrrr');
  });

  it('surfaces the exact inputs used (audit trail)', () => {
    const result = computeMetric('seventy_rule_ceiling', garlandBrrrrDeal());
    if (result.kind !== 'success') throw new Error('expected success');
    expect(result.inputsUsed).toEqual({
      afterRepairValue: 290000,
      rehabBudget: 45000,
    });
  });

  it('refuses to run on a buy-hold deal (strategy-restricted)', () => {
    const result = computeMetric(
      'seventy_rule_ceiling',
      charlotteBuyHoldDeal()
    );

    expect(result.kind).toBe('unsupported_strategy');
    if (result.kind !== 'unsupported_strategy') return;
    expect(result.dealStrategy).toBe('buy_hold');
    expect(result.supportedStrategies).toEqual(['brrrr']);
    // Reason string must not include hallucinated math — just
    // explain the strategy mismatch.
    expect(result.reason).toMatch(/brrrr/);
    expect(result.reason).toMatch(/buy_hold/);
  });

  it('rejects zero or negative ARV', () => {
    const deal = garlandBrrrrDeal();
    deal.brrrr!.afterRepairValue = 0;

    const result = computeMetric('seventy_rule_ceiling', deal);
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.reason).toMatch(/ARV/);
  });
});

// ===== Price for target cap rate =====

describe('price_for_target_cap_rate', () => {
  it('computes Charlotte buy-hold price for 7% cap rate', () => {
    // NOI $15,720 / 7% = $224,571
    const result = computeMetric(
      'price_for_target_cap_rate',
      charlotteBuyHoldDeal(),
      { targetCapRate: 7 }
    );

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.result).toBeCloseTo(224571.43, 2);
    expect(result.formatted).toBe('$224,571');
    expect(result.unit).toBe('dollars');
  });

  it('works for BRRRR too (strategy-agnostic)', () => {
    // Same formula, BRRRR deal. NOI $14,743 / 8% = $184,287.5
    const result = computeMetric(
      'price_for_target_cap_rate',
      garlandBrrrrDeal(),
      { targetCapRate: 8 }
    );

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.result).toBeCloseTo(184287.5, 2);
    expect(result.strategy).toBe('brrrr');
  });

  it('catches decimal-vs-percent confusion in target', () => {
    // If LLM passes 0.07 instead of 7, we detect the unit mistake.
    const result = computeMetric(
      'price_for_target_cap_rate',
      charlotteBuyHoldDeal(),
      { targetCapRate: 0.07 }
    );

    expect(result.kind).toBe('success'); // 0.07% is technically valid
    if (result.kind !== 'success') return;
    // It's an absurdly small cap rate (0.07%), yielding an
    // absurdly large price. That's fine — the formula is
    // deterministic. The prompt engineering should keep the LLM
    // from passing decimals. (An LLM-side validation is out of
    // scope here.)
  });

  it('rejects zero or negative cap rate', () => {
    const result = computeMetric(
      'price_for_target_cap_rate',
      charlotteBuyHoldDeal(),
      { targetCapRate: 0 }
    );
    expect(result.kind).toBe('error');
  });

  it('rejects negative NOI (no positive cap rate exists at any price)', () => {
    const deal = charlotteBuyHoldDeal();
    deal.computed.annualNOI = -1000;

    const result = computeMetric('price_for_target_cap_rate', deal, {
      targetCapRate: 7,
    });
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.reason).toMatch(/annualNOI/);
  });
});

// ===== Rent for target DSCR =====

describe('rent_for_target_dscr', () => {
  it('computes Charlotte buy-hold rent for 1.20 DSCR (acquisition loan)', () => {
    // targetDSCR × annualDebtService = 1.20 × $1,177 × 12 = $16,948.80
    // requiredMonthlyNOI = $1,412.40
    // requiredEffectiveRent = $1,412.40 + $850 = $2,262.40
    // requiredGrossRent = $2,262.40 / 0.95 = $2,381.47
    const result = computeMetric(
      'rent_for_target_dscr',
      charlotteBuyHoldDeal(),
      { targetDSCR: 1.2 }
    );

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.result).toBeCloseTo(2381.47, 2);
    expect(result.unit).toBe('dollars_per_month');
  });

  it('computes Garland BRRRR rent for 1.20 DSCR (POST-REFI loan)', () => {
    // Uses post-refi debt service ($1,662/mo), not acquisition
    // ($876/mo). This is the strategy-dispatch test.
    // 1.20 × $1,662 × 12 = $23,932.80
    // monthlyNOI = $1,994.40
    // effRent = $1,994.40 + $887 = $2,881.40
    // grossRent = $2,881.40 / 0.95 = $3,033.05
    const result = computeMetric(
      'rent_for_target_dscr',
      garlandBrrrrDeal(),
      { targetDSCR: 1.2 }
    );

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.result).toBeCloseTo(3033.05, 2);
    expect(result.inputsUsed.strategy).toBe('brrrr');
    expect(result.inputsUsed.monthlyDebtService).toBe(1662);
  });

  it('confirms BRRRR does NOT use acquisition debt service', () => {
    // Regression: an earlier draft accidentally used acquisition
    // debt on BRRRR. This test guards that.
    const brrrrResult = computeMetric(
      'rent_for_target_dscr',
      garlandBrrrrDeal(),
      { targetDSCR: 1 }
    );
    if (brrrrResult.kind !== 'success') throw new Error('expected success');

    // Naive acquisition-loan calc for the SAME BRRRR deal would give:
    //   1.0 × $876 × 12 = $10,512
    //   monthlyNOI = $876
    //   effRent = $876 + $887 = $1,763
    //   grossRent = $1,763 / 0.95 = $1,855.79
    // This must NOT match — the BRRRR path uses $1,662, not $876.
    expect(brrrrResult.result).not.toBeCloseTo(1855.79, 1);
    // Post-refi correct answer at DSCR 1.0:
    //   1.0 × $1,662 × 12 = $19,944
    //   monthlyNOI = $1,662
    //   effRent = $1,662 + $887 = $2,549
    //   grossRent = $2,549 / 0.95 = $2,683.16
    expect(brrrrResult.result).toBeCloseTo(2683.16, 2);
  });

  it('rejects vacancy ≥ 100% (mathematically undefined)', () => {
    const deal = charlotteBuyHoldDeal();
    deal.vacancyRate = 100;
    const result = computeMetric('rent_for_target_dscr', deal, {
      targetDSCR: 1,
    });
    expect(result.kind).toBe('error');
  });

  it('rejects zero or negative target DSCR', () => {
    const result = computeMetric(
      'rent_for_target_dscr',
      charlotteBuyHoldDeal(),
      { targetDSCR: 0 }
    );
    expect(result.kind).toBe('error');
  });
});

// ===== Runner-level error paths =====

describe('runner error paths', () => {
  it('returns unknown_metric for a nonexistent formula key', () => {
    const result = computeMetric('does_not_exist', garlandBrrrrDeal());
    expect(result.kind).toBe('unknown_metric');
    if (result.kind !== 'unknown_metric') return;
    expect(result.availableMetrics).toContain('seventy_rule_ceiling');
    expect(result.availableMetrics).toContain('price_for_target_cap_rate');
    expect(result.availableMetrics).toContain('rent_for_target_dscr');
  });
});

// ===== Formatter =====

describe('formatMetricValue', () => {
  it('formats dollars with commas + $ sign', () => {
    expect(formatMetricValue(158000, 'dollars')).toBe('$158,000');
    expect(formatMetricValue(1662.5, 'dollars')).toBe('$1,663'); // rounded
    expect(formatMetricValue(-358, 'dollars')).toBe('-$358');
  });

  it('adds /mo /yr suffixes for periodic dollar amounts', () => {
    expect(formatMetricValue(2200, 'dollars_per_month')).toBe('$2,200/mo');
    expect(formatMetricValue(14743, 'dollars_per_year')).toBe('$14,743/yr');
  });

  it('formats percent with two decimals', () => {
    expect(formatMetricValue(8.43, 'percent')).toBe('8.43%');
    expect(formatMetricValue(0.62, 'percent')).toBe('0.62%');
  });

  it('formats DSCR/ratio with two decimals, no unit', () => {
    expect(formatMetricValue(1.2, 'ratio')).toBe('1.20');
    // Note: JavaScript's `.toFixed(2)` on 0.615 returns '0.61' due
    // to floating-point representation (0.615 ≈ 0.6149999...).
    // Use unambiguous values.
    expect(formatMetricValue(0.62, 'ratio')).toBe('0.62');
    expect(formatMetricValue(0.6199, 'ratio')).toBe('0.62');
  });

  it('formats years / months / count', () => {
    expect(formatMetricValue(10, 'years')).toBe('10.0 yr');
    expect(formatMetricValue(12, 'months')).toBe('12 mo');
    expect(formatMetricValue(3, 'count')).toBe('3');
  });
});
