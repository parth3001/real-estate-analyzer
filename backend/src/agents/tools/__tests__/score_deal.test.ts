/**
 * W4-S1 acceptance test — tool:score_deal end-to-end.
 *
 * Uses a fake ScoringEngineAdapter (engine is sealed per user directive)
 * + mongodb-memory-server. Verifies:
 *   1. Tool contract conformance
 *   2. Engine output flows through the projector and into substrate writes
 *   3. AnalysisEvent + DecisionEvent are written, in that order, with
 *      DecisionEvent.analysisEventId referencing the AnalysisEvent
 *   4. Both events carry actorType 'tool:score_deal' and share the
 *      ToolContext's traceId
 *   5. The tool returns BOTH the slim agent-mesh surface AND the full
 *      engine output (lean substrate, fat return)
 *   6. Trust boundary rejects malformed inputs
 *   7. Engine outputs missing professionalAssessment fail loudly
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import {
  scoreDeal,
  setEngineAdapter,
  resetEngineAdapter,
  type ScoringEngineAdapter,
  type ScoreDealInput,
} from '../score_deal';
import type { ToolContext } from '../types';
import type { EngineOutputForProjection } from '../projectToEventPayloads';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:score_deal (W4-S1)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-score'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  function makeStubAdapter(
    output: EngineOutputForProjection & Record<string, unknown> = stubEngineOutput()
  ): ScoringEngineAdapter & { calls: Array<unknown> } {
    const calls: Array<unknown> = [];
    return {
      calls,
      async generateDecision(args) {
        calls.push(args);
        return output;
      },
    };
  }

  function stubEngineOutput(
    overrides: Partial<EngineOutputForProjection & Record<string, unknown>> = {}
  ): EngineOutputForProjection & Record<string, unknown> {
    return {
      professionalAssessment: {
        dealQuality: 72,
        cashFlowScore: 80,
        irrScore: 60,
        marketStrengthScore: 70,
        debtStructureScore: 75,
        exitStrategyScore: 65,
        capRateScore: 55,
        propertyRiskScore: 80,
        primaryInsight: 'OK',
        strategicRecommendations: ['rec1'],
        riskMitigation: ['risk1'],
        opportunityMaximization: ['opp1'],
      },
      confidence: 82,
      marketContext: {
        marketStage: 'mid',
        pricingContext: 'fair',
        competitiveIntensity: 'moderate',
      },
      primaryReason: 'reason',
      secondaryReasons: [],
      keyRisks: [],
      // Extra fields the engine emits — should be RETURNED but NOT persisted.
      verdict: 'BUY',
      actionPlan: ['action'],
      aiEnhancedContent: { html: '...' },
      ...overrides,
    };
  }

  function makeInput(overrides: Partial<ScoreDealInput> = {}): ScoreDealInput {
    return {
      propertyData: { purchasePrice: 425000, propertyType: 'SFR' } as unknown as ScoreDealInput['propertyData'],
      analysisResult: {
        metrics: { capRate: 5.2 },
        monthlyAnalysis: { cashFlow: -120 },
        longTermAnalysis: { projectionYears: 10 },
      },
      marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] },
      assumptions: { vacancyRate: 0.05 },
      userContext: { riskTolerance: 'moderate' },
      walkAwayPrice: 385000,
      enrichmentSource: 'rentcast',
      enrichmentCacheHit: false,
      ...overrides,
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    writes = new EventsRepository();
    reads = new EventsRepositoryReads();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    resetEngineAdapter();
  });

  // ===== Contract conformance =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false (deterministic-scoring non-negotiable)', () => {
      expect(scoreDeal.invokeLLM).toBe(false);
    });

    it('declares both event side effects (analysis + decision)', () => {
      expect(scoreDeal.sideEffects).toEqual([
        { type: 'event', eventType: 'analysis' },
        { type: 'event', eventType: 'decision' },
      ]);
    });

    it('uses NO_RETRY (two-write coupling — caller decides on full re-score)', () => {
      expect(scoreDeal.retrySemantics.maxAttempts).toBe(1);
    });

    it('has the stable global name', () => {
      expect(scoreDeal.name).toBe('score_deal');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('writes AnalysisEvent and DecisionEvent in that order', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      const out = await scoreDeal.execute(makeInput(), makeCtx(userId));

      const events = await reads.getEventsByTraceId('trace-score');
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('analysis');
      expect(events[1].eventType).toBe('decision');
      expect(out.analysisEventId.toString()).toBe(events[0]._id.toString());
      expect(out.decisionEventId.toString()).toBe(events[1]._id.toString());
    });

    it('DecisionEvent.analysisEventId references the AnalysisEvent _id', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      const out = await scoreDeal.execute(makeInput(), makeCtx(userId));

      const events = await reads.getEventsByTraceId('trace-score');
      const decisionDoc = events.find((e) => e.eventType === 'decision');
      expect(
        (decisionDoc!.payload as { analysisEventId: Types.ObjectId }).analysisEventId.toString()
      ).toBe(out.analysisEventId.toString());
    });

    it("uses actorType 'tool:score_deal' on both events", async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      await scoreDeal.execute(makeInput(), makeCtx(userId));

      const events = await reads.getEventsByTraceId('trace-score');
      expect(events[0].actorType).toBe('tool:score_deal');
      expect(events[1].actorType).toBe('tool:score_deal');
    });

    it('returns the slim agent-mesh surface (dealQuality, label, color, etc.)', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      const out = await scoreDeal.execute(makeInput(), makeCtx(userId));

      expect(out.dealQuality).toBe(72);
      expect(out.qualityLabel).toBe('Meets professional standards');
      expect(out.qualityColor).toBe('yellow');
      expect(out.professionalAssessment).toMatchObject({ dealQuality: 72 });
      expect(out.marketPosition).toMatchObject({ walkAwayPrice: 385000 });
      expect(out.reasoningTrail.primaryInsight).toBe('OK');
    });

    it('returns the FULL engine output (lean substrate, fat return)', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      const out = await scoreDeal.execute(makeInput(), makeCtx(userId));

      // Engine's verdict, actionPlan, aiEnhancedContent come back to the caller…
      expect((out.fullDecision as Record<string, unknown>).verdict).toBe('BUY');
      expect((out.fullDecision as Record<string, unknown>).actionPlan).toEqual([
        'action',
      ]);
      expect(
        (out.fullDecision as Record<string, unknown>).aiEnhancedContent
      ).toEqual({ html: '...' });
    });

    it('…but NEVER persists the legacy verdict to substrate', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      await scoreDeal.execute(makeInput(), makeCtx(userId));

      const events = await reads.getEventsByTraceId('trace-score');
      for (const event of events) {
        expect((event.payload as Record<string, unknown>).verdict).toBeUndefined();
        expect(
          (event.payload as Record<string, unknown>).actionPlan
        ).toBeUndefined();
        expect(
          (event.payload as Record<string, unknown>).aiEnhancedContent
        ).toBeUndefined();
      }
    });
  });

  // ===== Engine adapter wiring =====

  describe('engine adapter', () => {
    it('passes documented inputs to the adapter', async () => {
      const adapter = makeStubAdapter();
      setEngineAdapter(adapter);

      const userId = new Types.ObjectId();
      await scoreDeal.execute(makeInput(), makeCtx(userId));

      expect(adapter.calls).toHaveLength(1);
      const args = adapter.calls[0] as Record<string, unknown>;
      expect(args.propertyData).toMatchObject({ purchasePrice: 425000 });
      expect(args.userContext).toMatchObject({ riskTolerance: 'moderate' });
    });

    it('propagates engine errors and writes NO events', async () => {
      const failingAdapter: ScoringEngineAdapter = {
        async generateDecision() {
          throw new Error('Engine boom');
        },
      };
      setEngineAdapter(failingAdapter);

      const userId = new Types.ObjectId();
      await expect(
        scoreDeal.execute(makeInput(), makeCtx(userId, 'trace-fail'))
      ).rejects.toThrow(/Engine boom/);

      const events = await reads.getEventsByTraceId('trace-fail');
      expect(events).toHaveLength(0);
    });

    it('fails loudly when engine output is missing professionalAssessment', async () => {
      const adapter = makeStubAdapter(
        stubEngineOutput({ professionalAssessment: undefined })
      );
      setEngineAdapter(adapter);

      const userId = new Types.ObjectId();
      await expect(
        scoreDeal.execute(makeInput(), makeCtx(userId, 'trace-malformed'))
      ).rejects.toThrow(/missing professionalAssessment/);

      // Critical: no orphan AnalysisEvent — we throw BEFORE writing
      // because the projector runs before the writes. Verify.
      const events = await reads.getEventsByTraceId('trace-malformed');
      expect(events).toHaveLength(0);
    });
  });

  // ===== Walk-away price fallback =====

  describe('walkAwayPrice resolution', () => {
    it('uses the explicit walkAwayPrice when provided', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      await scoreDeal.execute(
        makeInput({ walkAwayPrice: 350000 }),
        makeCtx(userId)
      );
      const events = await reads.getEventsByTraceId('trace-score');
      const analysisDoc = events.find((e) => e.eventType === 'analysis')!;
      expect(
        (analysisDoc.payload as { walkAwayPrice: number }).walkAwayPrice
      ).toBe(350000);
    });

    it('falls back to purchasePrice * 0.9 when walkAwayPrice is omitted', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      const input = makeInput();
      delete input.walkAwayPrice;
      await scoreDeal.execute(input, makeCtx(userId));
      const events = await reads.getEventsByTraceId('trace-score');
      const analysisDoc = events.find((e) => e.eventType === 'analysis')!;
      // 425000 * 0.9 = 382500
      expect(
        (analysisDoc.payload as { walkAwayPrice: number }).walkAwayPrice
      ).toBeCloseTo(382500);
    });
  });

  // ===== Trust boundary =====

  describe('input validation', () => {
    it('rejects missing propertyData', async () => {
      setEngineAdapter(makeStubAdapter());
      const ctx = makeCtx(new Types.ObjectId());
      // Cast to bypass TS — Zod runtime check is the trust boundary we test.
      const malformed = { analysisResult: makeInput().analysisResult } as unknown as ScoreDealInput;
      await expect(scoreDeal.execute(malformed, ctx)).rejects.toThrow();
    });

    it('rejects analysisResult without all three sub-fields', async () => {
      setEngineAdapter(makeStubAdapter());
      const ctx = makeCtx(new Types.ObjectId());
      const malformed = {
        ...makeInput(),
        analysisResult: { metrics: {} } as unknown as ScoreDealInput['analysisResult'],
      };
      await expect(scoreDeal.execute(malformed, ctx)).rejects.toThrow();
    });
  });

  // ===== Correlation =====

  describe('substrate correlation', () => {
    it('joins to recall_user_context via the same userId', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      await scoreDeal.execute(makeInput(), makeCtx(userId));

      // The decision should appear in getRecentDecisionsForUser(userId)
      const recent = await reads.getRecentDecisionsForUser(userId, 5);
      expect(recent).toHaveLength(1);
      expect(recent[0].payload.dealQuality).toBe(72);
    });

    it('joins both events through traceId', async () => {
      setEngineAdapter(makeStubAdapter());
      const userId = new Types.ObjectId();
      await scoreDeal.execute(makeInput(), makeCtx(userId, 'trace-join'));

      const all = await reads.getEventsByTraceId('trace-join');
      expect(all.map((e) => e.eventType)).toEqual(['analysis', 'decision']);
    });
  });
});
