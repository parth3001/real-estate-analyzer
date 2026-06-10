/**
 * Tests for the deterministic stress-test runner — Task #16, Path B.
 *
 * Two kinds of coverage:
 *
 *   A) Trust-boundary & error paths — schema validation, not-found,
 *      forbidden (investor isolation), incomplete, unsupported. These
 *      should never reach the engine.
 *
 *   B) The REGRESSION LOCK for the original bug — the 81/100 confabulation.
 *      A real SFR fixture is built mimicking the 1837 Walnut Way case
 *      (~$205K, $1,800 rent, marginal-to-negative cash flow at 6.51%).
 *      We stress at 7.5% with explicit unit='percent' and assert:
 *        - Cash flow gets WORSE (not better — the bug had it improving).
 *        - DSCR goes DOWN (not the 0.88→1.98 inversion from the bug).
 *        - Score stays in the same neighborhood or drops (NEVER 49→81).
 *      If anyone ever regresses Path B, THIS test fails loud.
 */

import { Types } from 'mongoose';
import {
  runStressTest,
  StressTestNotFoundError,
  StressTestForbiddenError,
  StressTestIncompleteError,
  StressTestUnsupportedError,
} from '../runner';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import type { SFRData } from '../../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../../analysis/BasePropertyAnalyzer';

// ===== Test fixtures =====

/**
 * Mirrors the 1837 Walnut Way deal that produced the original bug. Marginal
 * cash flow at 6.51% — a small rate move should degrade it, not flip it.
 */
function fixtureSFR(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 205_000,
    downPayment: 51_250, // 25% down
    interestRate: 6.51, // PERCENT — engine divides by 100
    loanTerm: 30,
    propertyTaxRate: 1.8, // PERCENT
    insuranceRate: 0.5, // PERCENT
    maintenanceCost: 2_050, // annual ($/yr; engine divides by 12)
    propertyManagementRate: 8, // PERCENT
    closingCosts: 6_150, // 3% of price
    propertyAddress: {
      street: '1837 Walnut Way',
      city: 'Anna',
      state: 'TX',
      zipCode: '75409',
    },
    monthlyRent: 1_800,
    squareFootage: 1_268,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2007,
  };
}

function fixtureAssumptions(): AnalysisAssumptions {
  return {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualExpenseIncrease: 2.5,
    annualPropertyValueIncrease: 3.5,
    sellingCosts: 6,
    vacancyRate: 5,
  };
}

function fixtureBundle(opts: {
  userId: string;
  decisionId: string;
  propertyData?: SFRData;
  assumptions?: AnalysisAssumptions;
}): {
  decision: {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    timestamp: Date;
    eventType: string;
    payload: Record<string, unknown>;
  };
  analysis: {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    timestamp: Date;
    eventType: string;
    payload: Record<string, unknown>;
  } | null;
} {
  return {
    decision: {
      _id: new Types.ObjectId(opts.decisionId),
      userId: new Types.ObjectId(opts.userId),
      timestamp: new Date(),
      eventType: 'decision',
      payload: {
        dealQuality: 49,
        analysisEventId: new Types.ObjectId(),
        professionalAssessment: {
          dealQuality: 49,
        },
      },
    },
    analysis: {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(opts.userId),
      timestamp: new Date(),
      eventType: 'analysis',
      payload: {
        propertyData: opts.propertyData ?? fixtureSFR(),
        assumptions: opts.assumptions ?? fixtureAssumptions(),
        marketData: {},
        metrics: {},
        monthlyAnalysis: {},
        longTermAnalysis: {},
        walkAwayPrice: 157_646,
        enrichmentSource: 'fallback',
        enrichmentCacheHit: false,
        engineVersion: 'test',
        computeTimeMs: 0,
      },
    },
  };
}

// ===== Mocks =====

jest.mock('../../../repositories/EventsRepositoryReads', () => ({
  eventsRepositoryReads: {
    getScenarioBundle: jest.fn(),
  },
}));

const mockGetScenarioBundle = eventsRepositoryReads.getScenarioBundle as jest.MockedFunction<
  typeof eventsRepositoryReads.getScenarioBundle
>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===== A. Trust-boundary & error paths =====

describe('runStressTest — boundary and error paths', () => {
  const validHex = 'a'.repeat(24);
  const userId = '0'.repeat(24);

  it('rejects a malformed request at the schema boundary (no LLM-shaped errors leak through)', async () => {
    await expect(
      runStressTest({
        priorDecisionId: 'not-an-id',
        userId,
        perturbations: [{ field: 'mortgageRate', value: 7.5, unit: 'percent' }],
      })
    ).rejects.toThrow();
  });

  it('throws NotFound when the bundle does not exist', async () => {
    mockGetScenarioBundle.mockResolvedValue(null);
    await expect(
      runStressTest({
        priorDecisionId: validHex,
        userId,
        perturbations: [{ field: 'mortgageRate', value: 7.5, unit: 'percent' }],
      })
    ).rejects.toThrow(StressTestNotFoundError);
  });

  it('throws Forbidden when the decision belongs to another user', async () => {
    const otherUser = '1'.repeat(24);
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId: otherUser, decisionId: validHex }) as never
    );
    await expect(
      runStressTest({
        priorDecisionId: validHex,
        userId,
        perturbations: [{ field: 'mortgageRate', value: 7.5, unit: 'percent' }],
      })
    ).rejects.toThrow(StressTestForbiddenError);
  });

  it('throws Incomplete when the bundle has no AnalysisEvent linked', async () => {
    const bundle = fixtureBundle({ userId, decisionId: validHex });
    bundle.analysis = null;
    mockGetScenarioBundle.mockResolvedValue(bundle as never);
    await expect(
      runStressTest({
        priorDecisionId: validHex,
        userId,
        perturbations: [{ field: 'mortgageRate', value: 7.5, unit: 'percent' }],
      })
    ).rejects.toThrow(StressTestIncompleteError);
  });

  it('throws Unsupported when the property is not SFR (MF deferred)', async () => {
    const sfr = fixtureSFR();
    const mf = { ...sfr, propertyType: 'MF' } as unknown as SFRData;
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex, propertyData: mf }) as never
    );
    await expect(
      runStressTest({
        priorDecisionId: validHex,
        userId,
        perturbations: [{ field: 'mortgageRate', value: 7.5, unit: 'percent' }],
      })
    ).rejects.toThrow(StressTestUnsupportedError);
  });
});

// ===== B. Regression lock — the original-bug scenario =====

describe('runStressTest — original-bug regression lock', () => {
  const validHex = 'a'.repeat(24);
  const userId = '0'.repeat(24);

  it('rate stress 6.51% → 7.5% (PERCENT) makes cash flow WORSE, not better', async () => {
    // This is the test that would have caught the original 81/100 bug at PR time.
    // The bug: LLM passed interestRate as decimal (0.075), engine read it as
    // 0.075%, monthly P&I collapsed to ~$427, cash flow flipped positive,
    // DSCR jumped to 1.98, score went 49→81.
    //
    // Correct behavior: with unit='percent' value=7.5, the engine actually
    // computes a 30yr P&I at 7.5% on $153,750 ≈ $1,074/mo (vs ~$972 at 6.51%).
    // That's $102/mo MORE debt → cash flow drops by ~$102 → score should go
    // down or stay similar, NEVER jump up.

    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
      ],
    });

    // ---- The directional assertions that would have caught the bug ----
    // Cash flow MUST be worse (more negative or less positive) — not better.
    expect(result.stressed.monthlyCashFlow).toBeLessThan(result.baseline.monthlyCashFlow);

    // DSCR MUST go down (debt grew, NOI unchanged → DSCR drops).
    expect(result.stressed.dscr).toBeLessThan(result.baseline.dscr);

    // Score must NOT improve by anything more than a tiny rounding wobble.
    // The original bug had it improving by ~32 points; that's structurally impossible
    // when only rate changed upward.
    expect(result.stressed.dealQuality).toBeLessThanOrEqual(
      result.baseline.dealQuality + 2
    );

    // Delta record contains the perturbation we requested.
    expect(result.deltas).toHaveLength(1);
    expect(result.deltas[0].field).toBe('mortgageRate');
    expect(result.deltas[0].engineUnit).toBe('percent');
    expect(result.deltas[0].stressedValue).toBe(7.5); // unit already engine-unit
  });

  it('rate stress as decimal_ratio (0.075) converts correctly to 7.5 percent and stays directional', async () => {
    // Same directional assertion, but via the OTHER user-unit path.
    // If we accept unit='decimal_ratio' value=0.075, runner converts to 7.5
    // percent — and the result should match the percent-input case directionally.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'mortgageRate', value: 0.075, unit: 'decimal_ratio', operation: 'set' },
      ],
    });

    // Same direction — rate up means cash flow down.
    expect(result.stressed.monthlyCashFlow).toBeLessThan(result.baseline.monthlyCashFlow);
    // The applied engine value should be 7.5 (converted from 0.075 decimal_ratio).
    expect(result.deltas[0].stressedValue).toBeCloseTo(7.5, 5);
  });

  it('rent drop $1,800 → $1,500 makes cash flow worse and score lower', async () => {
    // Sanity check on a dollar field that does NOT need unit conversion —
    // confirms the registry routes dollar perturbations correctly too.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [{ field: 'rent', value: 1_500, unit: 'dollars', operation: 'set' }],
    });

    expect(result.stressed.monthlyCashFlow).toBeLessThan(result.baseline.monthlyCashFlow);
    expect(result.deltas[0].stressedValue).toBe(1_500);
    expect(result.deltas[0].baselineValue).toBe(1_800);
  });

  it('multi-field perturbation (rate UP + rent DOWN + vacancy UP) lands all three changes', async () => {
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'mortgageRate', value: 8, unit: 'percent' },
        { field: 'rent', value: 1_500, unit: 'dollars' },
        { field: 'vacancy', value: 10, unit: 'percent' },
      ],
    });

    expect(result.deltas).toHaveLength(3);
    const byField = Object.fromEntries(result.deltas.map((d) => [d.field, d]));
    expect(byField.mortgageRate.stressedValue).toBe(8);
    expect(byField.rent.stressedValue).toBe(1_500);
    expect(byField.vacancy.stressedValue).toBe(10);
    // All three are degrading → cash flow MUST be worse.
    expect(result.stressed.monthlyCashFlow).toBeLessThan(result.baseline.monthlyCashFlow);
  });

  it('increase_by 1 percent on rate adds exactly 1 percent in engine-unit terms', async () => {
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'mortgageRate', value: 1, unit: 'percent', operation: 'increase_by' },
      ],
    });

    expect(result.deltas[0].baselineValue).toBeCloseTo(6.51, 5);
    expect(result.deltas[0].stressedValue).toBeCloseTo(7.51, 5);
  });

  it('Task #27: walkAwayPrice is NON-ZERO on stress-test snapshots (was always $0)', async () => {
    // Regression lock: before #27, the runner left walkAwayPrice as 0
    // because the engine's marketPosition.walkAwayPrice was undefined on
    // re-runs. Now the runner computes it via resolveWalkAwayPrice
    // (NOI / target cap rate). Both baseline and stressed snapshots
    // must surface a real number.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
      ],
    });

    expect(result.baseline.walkAwayPrice).toBeGreaterThan(0);
    expect(result.stressed.walkAwayPrice).toBeGreaterThan(0);
    // Sanity: walk-away is an income-anchored value, not a fraction of
    // purchase price. For our $205K / $1,800-rent fixture, NOI / 6.5%
    // target cap should land somewhere in the $130k-$170k range.
    expect(result.baseline.walkAwayPrice).toBeGreaterThan(80_000);
    expect(result.baseline.walkAwayPrice).toBeLessThan(300_000);
  });

  it("contextual conversion: '50% down' → dollars using baseline purchasePrice (Task #27 follow-up)", async () => {
    // User says "50% down" → LLM extracts { downPayment, 0.5, decimal_ratio }.
    // The field is dollars. Without contextual conversion, this throws.
    // With the fix: read baseline purchasePrice ($205K) and compute
    // 0.5 * 205000 = $102,500.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'downPayment', value: 0.5, unit: 'decimal_ratio', operation: 'set' },
      ],
    });

    expect(result.deltas).toHaveLength(1);
    expect(result.deltas[0].field).toBe('downPayment');
    expect(result.deltas[0].engineUnit).toBe('dollars');
    expect(result.deltas[0].stressedValue).toBe(102_500); // 0.5 * $205K
    // Bigger down = smaller loan = less debt service = better cash flow.
    expect(result.stressed.monthlyCashFlow).toBeGreaterThan(
      result.baseline.monthlyCashFlow
    );
  });

  it("contextual conversion: '50 percent down' (percent unit) → same dollar result", async () => {
    // Same intent, different unit declaration. Result must match.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        { field: 'downPayment', value: 50, unit: 'percent', operation: 'set' },
      ],
    });

    expect(result.deltas[0].stressedValue).toBe(102_500); // 50/100 * $205K
  });

  it('graceful failure: ONE bad perturbation does NOT crash the turn — others still apply', async () => {
    // Mixed batch: a valid rate stress + a perturbation with an
    // unconvertible unit pair for a field that has no contextual
    // converter. Pre-fix this would have thrown and the chat turn
    // would have failed. Post-fix: the bad one becomes a warning,
    // the rate stress still runs.
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [
        // Valid — should apply.
        { field: 'mortgageRate', value: 8, unit: 'percent', operation: 'set' },
        // Invalid — 'rent' is dollars, no contextual converter for "% rent",
        // normalizeToEngineUnit throws. Should become a warning, not crash.
        { field: 'rent', value: 10, unit: 'years', operation: 'set' },
      ],
    });

    // The good perturbation applied.
    const rateDelta = result.deltas.find((d) => d.field === 'mortgageRate');
    expect(rateDelta).toBeDefined();
    expect(rateDelta?.stressedValue).toBe(8);

    // The bad one became a warning.
    expect(result.warnings.some((w) => w.includes("'rent'"))).toBe(true);

    // The turn produced a result (didn't throw).
    expect(result.stressed.dealQuality).toBeDefined();
  });

  it('out-of-range value generates a warning but does NOT block the run', async () => {
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId: validHex }) as never
    );

    const result = await runStressTest({
      priorDecisionId: validHex,
      userId,
      perturbations: [{ field: 'mortgageRate', value: 50, unit: 'percent' }], // > max of 25
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/above the maximum/i);
    // But the run still produced a result.
    expect(result.stressed.dealQuality).toBeDefined();
  });
});
