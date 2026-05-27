/**
 * Integration tests for the service-level wiring (handleStressTest) —
 * Task #16, Path B Step 4.
 *
 * Focus: the discriminated-union output. The three Layers underneath
 * each have their own deep coverage; here we verify they're wired
 * together correctly and that the four output kinds (success,
 * no_prior_decision, extraction_failed, unsupported_property_type)
 * are returned for the right scenarios.
 */

import { Types } from 'mongoose';
import { handleStressTest } from '../index';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import type { AnthropicAdapter } from '../../../agents/llm/anthropicAdapter';
import type { SFRData } from '../../../types/propertyTypes';

// ===== Mock setup =====

jest.mock('../../../repositories/EventsRepositoryReads', () => ({
  eventsRepositoryReads: {
    getRecentDecisionsForUser: jest.fn(),
    getScenarioBundle: jest.fn(),
  },
}));

const mockGetRecentDecisions =
  eventsRepositoryReads.getRecentDecisionsForUser as jest.MockedFunction<
    typeof eventsRepositoryReads.getRecentDecisionsForUser
  >;
const mockGetScenarioBundle =
  eventsRepositoryReads.getScenarioBundle as jest.MockedFunction<
    typeof eventsRepositoryReads.getScenarioBundle
  >;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===== Fixtures =====

function fixtureSFR(): SFRData {
  return {
    propertyType: 'SFR',
    purchasePrice: 205_000,
    downPayment: 51_250,
    interestRate: 6.51,
    loanTerm: 30,
    propertyTaxRate: 1.8,
    insuranceRate: 0.5,
    maintenanceCost: 2_050,
    propertyManagementRate: 8,
    closingCosts: 6_150,
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

function fixtureBundle(opts: {
  userId: string;
  decisionId: string;
  propertyType?: string;
}) {
  const sfr = fixtureSFR();
  const propertyData =
    opts.propertyType && opts.propertyType !== 'SFR'
      ? ({ ...sfr, propertyType: opts.propertyType } as unknown as SFRData)
      : sfr;
  return {
    decision: {
      _id: new Types.ObjectId(opts.decisionId),
      userId: new Types.ObjectId(opts.userId),
      timestamp: new Date(),
      eventType: 'decision',
      payload: {
        dealQuality: 49,
        analysisEventId: new Types.ObjectId(),
        professionalAssessment: { dealQuality: 49 },
      },
    },
    analysis: {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(opts.userId),
      timestamp: new Date(),
      eventType: 'analysis',
      payload: {
        propertyData,
        assumptions: {
          projectionYears: 10,
          annualRentIncrease: 3,
          annualExpenseIncrease: 2.5,
          annualPropertyValueIncrease: 3.5,
          sellingCosts: 6,
          vacancyRate: 5,
        },
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

/**
 * Build a mock adapter that returns two scripted responses:
 * - First call (extractor / Layer 2) returns `extractionJson`
 * - Second call (narrative / Layer 4) returns `narrativeText`
 *
 * If either side isn't needed (e.g., extraction failed → Layer 4 skipped),
 * the second response just goes unused.
 */
function mockAdapter(
  extractionJson: string,
  narrativeText: string = 'Narrative response.'
): AnthropicAdapter {
  let callCount = 0;
  return {
    call: jest.fn().mockImplementation(() => {
      callCount++;
      const text = callCount === 1 ? extractionJson : narrativeText;
      return Promise.resolve({
        text,
        usage: { inputTokens: 100, outputTokens: 50, cachedTokens: 0 },
        model: 'claude-haiku-test',
        stopReason: 'end_turn',
      });
    }),
    callWithTools: jest.fn(),
    stream: jest.fn(),
  } as unknown as AnthropicAdapter;
}

// ===== Tests =====

describe('handleStressTest — discriminated outputs', () => {
  const userId = '0'.repeat(24);
  const decisionId = 'a'.repeat(24);

  it("returns 'no_prior_decision' when the user has no prior decisions", async () => {
    mockGetRecentDecisions.mockResolvedValue([]);
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Rate stress at 7.5%.',
      })
    );

    const out = await handleStressTest({
      userMessage: 'stress at 7.5%',
      userId,
      adapter,
    });

    expect(out.kind).toBe('no_prior_decision');
    if (out.kind === 'no_prior_decision') {
      expect(out.reason).toMatch(/analyze a property first/i);
    }
    // Layer 4 must NOT have been called when there's no prior decision.
    expect((adapter.call as jest.Mock).mock.calls.length).toBe(1); // only extractor
  });

  it("returns 'extraction_failed' when Layer 2 returns empty perturbations", async () => {
    // Don't even need the recent-decisions mock; extraction fails first.
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [],
        reasoning: 'User asked a question, not a stress test.',
      })
    );

    const out = await handleStressTest({
      userMessage: 'how does this work?',
      userId,
      adapter,
    });

    expect(out.kind).toBe('extraction_failed');
    if (out.kind === 'extraction_failed') {
      expect(out.reason).toMatch(/asked a question/i);
    }
    // Layer 3 + Layer 4 must NOT run.
    expect(mockGetRecentDecisions).not.toHaveBeenCalled();
    expect(mockGetScenarioBundle).not.toHaveBeenCalled();
  });

  it("returns 'unsupported_property_type' for MF deals (SFR-only for now)", async () => {
    mockGetRecentDecisions.mockResolvedValue([
      { _id: new Types.ObjectId(decisionId) } as never,
    ]);
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId, propertyType: 'MF' }) as never
    );
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Rate stress.',
      })
    );

    const out = await handleStressTest({
      userMessage: 'stress at 7.5%',
      userId,
      adapter,
    });

    expect(out.kind).toBe('unsupported_property_type');
    if (out.kind === 'unsupported_property_type') {
      expect(out.reason).toMatch(/single-family/i);
    }
  });

  it("returns 'success' end-to-end with verified deltas and a narrative", async () => {
    mockGetRecentDecisions.mockResolvedValue([
      { _id: new Types.ObjectId(decisionId) } as never,
    ]);
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId }) as never
    );
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Rate stress at 7.5%.',
      }),
      'At 7.5%, the deal scores lower than at 6.51%. Cash flow is now more negative.'
    );

    const out = await handleStressTest({
      userMessage: 'stress at 7.5%',
      userId,
      adapter,
    });

    expect(out.kind).toBe('success');
    if (out.kind === 'success') {
      // Decision was anchored on the prior decisionId.
      expect(out.priorDecisionId).toBe(decisionId);
      // Result includes the typed StressTestResult.
      expect(out.result.baseline).toBeDefined();
      expect(out.result.stressed).toBeDefined();
      expect(out.result.deltas).toHaveLength(1);
      expect(out.result.deltas[0].field).toBe('mortgageRate');
      // Layer 4 narrative was composed and returned.
      expect(out.narrative).toMatch(/7\.5%/);
      expect(out.narrative.length).toBeGreaterThan(10);
      // Token usage from both LLM-bounded layers.
      expect(out.usage.extractionTokens).toBeGreaterThan(0);
      expect(out.usage.narrativeTokens).toBeGreaterThan(0);
    }
    // Both Layer 2 + Layer 4 LLM calls were made.
    expect((adapter.call as jest.Mock).mock.calls.length).toBe(2);
  });

  it('directional sanity: rate stress UP makes the stressed cash flow WORSE', async () => {
    // This is the integration-level version of the runner's bug-defense
    // regression test. End-to-end: extractor → runner → narrative MUST
    // produce a directionally-correct delta even with all the wiring
    // in place.
    mockGetRecentDecisions.mockResolvedValue([
      { _id: new Types.ObjectId(decisionId) } as never,
    ]);
    mockGetScenarioBundle.mockResolvedValue(
      fixtureBundle({ userId, decisionId }) as never
    );
    const adapter = mockAdapter(
      JSON.stringify({
        perturbations: [
          { field: 'mortgageRate', value: 7.5, unit: 'percent', operation: 'set' },
        ],
        reasoning: 'Rate stress.',
      }),
      'Narrative.'
    );

    const out = await handleStressTest({
      userMessage: 'stress at 7.5%',
      userId,
      adapter,
    });

    expect(out.kind).toBe('success');
    if (out.kind === 'success') {
      // Rate went UP, so cash flow MUST go down (not invert like the original bug).
      expect(out.result.stressed.monthlyCashFlow).toBeLessThan(
        out.result.baseline.monthlyCashFlow
      );
      // Score must NOT jump up by more than rounding wobble.
      expect(out.result.stressed.dealQuality).toBeLessThanOrEqual(
        out.result.baseline.dealQuality + 2
      );
    }
  });
});
