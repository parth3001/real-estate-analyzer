/**
 * W4-S2 acceptance test — tool:apply_override end-to-end.
 *
 * Uses the same fake engine adapter pattern as score_deal's tests (the
 * engine is sealed per user directive 2026-05-12; apply_override calls
 * score_deal internally, which calls the adapter).
 *
 * Verifies:
 *   1. Tool contract conformance
 *   2. Three events written in correct order:
 *      AnalysisEvent → DecisionEvent → OverrideEvent
 *   3. OverrideEvent.resultingAnalysisEventId/resultingDecisionEventId
 *      reference the score_deal-emitted events
 *   4. priorDealQuality / newDealQuality / dealQualityDelta computed
 *      correctly
 *   5. OverrideEvent uses actorType: 'user' (vs score_deal's 'tool:score_deal')
 *   6. All three events share the ToolContext.traceId
 *   7. Trust boundary rejects missing originalDecisionId
 *   8. Calibration drift query (getOverrideFrequencyByField) finds
 *      the override
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import {
  applyOverride,
  type ApplyOverrideInput,
} from '../apply_override';
import {
  setEngineAdapter,
  resetEngineAdapter,
  type ScoringEngineAdapter,
} from '../score_deal';
import type { ToolContext } from '../types';
import type { EngineOutputForProjection } from '../projectToEventPayloads';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:apply_override (W4-S2)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-override'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  function stubEngineOutput(
    dealQuality: number,
    overrides: Partial<EngineOutputForProjection & Record<string, unknown>> = {}
  ): EngineOutputForProjection & Record<string, unknown> {
    return {
      professionalAssessment: {
        dealQuality,
        cashFlowScore: 80,
        irrScore: 60,
        marketStrengthScore: 70,
        debtStructureScore: 75,
        exitStrategyScore: 65,
        capRateScore: 55,
        propertyRiskScore: 80,
        primaryInsight: 'ok',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
      },
      confidence: 80,
      marketContext: { marketStage: 'mid', pricingContext: 'fair', competitiveIntensity: 'moderate' },
      primaryReason: 'reason',
      secondaryReasons: [],
      keyRisks: [],
      ...overrides,
    };
  }

  function makeAdapter(
    output: EngineOutputForProjection & Record<string, unknown>
  ): ScoringEngineAdapter {
    return {
      async generateDecision() {
        return output;
      },
    };
  }

  function makeOverrideInput(
    originalDecisionId: Types.ObjectId,
    overrides: Partial<ApplyOverrideInput> = {}
  ): ApplyOverrideInput {
    return {
      originalDecisionId,
      fieldPath: 'assumptions.vacancyRate',
      originalValue: 0.05,
      newValue: 0.08,
      inputMethod: 'structured_modal',
      justification: 'Conservative submarket; bump vacancy',

      // Re-score inputs (caller has applied the override)
      propertyData: { purchasePrice: 425000, propertyType: 'SFR' } as unknown as ApplyOverrideInput['propertyData'],
      analysisResult: {
        metrics: { capRate: 5.0 },
        monthlyAnalysis: { cashFlow: -250 }, // worse than original because vacancy ↑
        longTermAnalysis: { projectionYears: 10 },
      },
      marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] },
      assumptions: { vacancyRate: 0.08 }, // ← reflects the override
      userContext: { riskTolerance: 'moderate' },
      walkAwayPrice: 385000,
      enrichmentSource: 'rentcast',
      enrichmentCacheHit: false,
      ...overrides,
    };
  }

  /** Helper: seed an original DecisionEvent and return its _id. */
  async function seedOriginalDecision(
    userId: Types.ObjectId,
    dealQuality: number
  ): Promise<Types.ObjectId> {
    // Use score_deal to write — that way the original substrate is
    // shaped exactly like apply_override will see it later.
    const { scoreDeal } = await import('../score_deal');
    setEngineAdapter(makeAdapter(stubEngineOutput(dealQuality)));
    const result = await scoreDeal.execute(
      {
        propertyData: { purchasePrice: 425000, propertyType: 'SFR' } as unknown as ApplyOverrideInput['propertyData'],
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
      },
      makeCtx(userId, 'trace-seed')
    );
    return result.decisionEventId;
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
    it('declares invokeLLM: false', () => {
      expect(applyOverride.invokeLLM).toBe(false);
    });

    it('declares three event side effects in emission order', () => {
      expect(applyOverride.sideEffects).toEqual([
        { type: 'event', eventType: 'analysis' },
        { type: 'event', eventType: 'decision' },
        { type: 'event', eventType: 'override' },
      ]);
    });

    it('uses NO_RETRY (three-write coupling)', () => {
      expect(applyOverride.retrySemantics.maxAttempts).toBe(1);
    });

    it('has the stable global name', () => {
      expect(applyOverride.name).toBe('apply_override');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('writes three events in order: analysis → decision → override', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);

      // Now apply an override that lowers the score
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));
      const out = await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-apply')
      );

      const events = await reads.getEventsByTraceId('trace-apply');
      expect(events.map((e) => e.eventType)).toEqual([
        'analysis',
        'decision',
        'override',
      ]);
      expect(out.newAnalysisEventId.toString()).toBe(events[0]._id.toString());
      expect(out.newDecisionEventId.toString()).toBe(events[1]._id.toString());
      expect(out.overrideEventId.toString()).toBe(events[2]._id.toString());
    });

    it('OverrideEvent links to the new analysis + new decision IDs', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      const out = await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-link')
      );

      const events = await reads.getEventsByTraceId('trace-link');
      const overrideDoc = events.find((e) => e.eventType === 'override')!;
      const payload = overrideDoc.payload as {
        resultingAnalysisEventId: Types.ObjectId;
        resultingDecisionEventId: Types.ObjectId;
        originalDecisionId: Types.ObjectId;
        fieldPath: string;
      };
      expect(payload.resultingAnalysisEventId.toString()).toBe(
        out.newAnalysisEventId.toString()
      );
      expect(payload.resultingDecisionEventId.toString()).toBe(
        out.newDecisionEventId.toString()
      );
      expect(payload.originalDecisionId.toString()).toBe(originalDecisionId.toString());
      expect(payload.fieldPath).toBe('assumptions.vacancyRate');
    });

    it('computes priorDealQuality, newDealQuality, dealQualityDelta correctly', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 80);
      setEngineAdapter(makeAdapter(stubEngineOutput(60))); // new score after override

      const out = await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-delta')
      );

      expect(out.priorDealQuality).toBe(80);
      expect(out.newDealQuality).toBe(60);
      expect(out.dealQualityDelta).toBe(-20);
    });

    it('positive delta when the override improves the score', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 55);
      setEngineAdapter(makeAdapter(stubEngineOutput(75)));

      const out = await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-pos')
      );

      expect(out.dealQualityDelta).toBe(20);
    });

    it("OverrideEvent.actorType is 'user' (not 'tool:score_deal')", async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-actor')
      );

      const events = await reads.getEventsByTraceId('trace-actor');
      const overrideDoc = events.find((e) => e.eventType === 'override')!;
      const analysisDoc = events.find((e) => e.eventType === 'analysis')!;
      const decisionDoc = events.find((e) => e.eventType === 'decision')!;

      expect(overrideDoc.actorType).toBe('user');
      // score_deal's events keep their own actorType
      expect(analysisDoc.actorType).toBe('tool:score_deal');
      expect(decisionDoc.actorType).toBe('tool:score_deal');
    });

    it('all three events share the ToolContext.traceId', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      await applyOverride.execute(
        makeOverrideInput(originalDecisionId),
        makeCtx(userId, 'trace-shared')
      );

      const events = await reads.getEventsByTraceId('trace-shared');
      expect(events).toHaveLength(3);
      for (const e of events) expect(e.traceId).toBe('trace-shared');
    });

    it('forwards the override metadata to the OverrideEvent payload', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      await applyOverride.execute(
        makeOverrideInput(originalDecisionId, {
          fieldPath: 'propertyData.monthlyRent',
          originalValue: 2500,
          newValue: 2800,
          inputMethod: 'inline_chat',
          justification: 'Comparable came in higher',
        }),
        makeCtx(userId, 'trace-meta')
      );

      const events = await reads.getEventsByTraceId('trace-meta');
      const overrideDoc = events.find((e) => e.eventType === 'override')!;
      expect(overrideDoc.payload).toMatchObject({
        fieldPath: 'propertyData.monthlyRent',
        originalValue: 2500,
        newValue: 2800,
        inputMethod: 'inline_chat',
        justification: 'Comparable came in higher',
      });
    });
  });

  // ===== Trust boundary =====

  describe('error handling', () => {
    it('throws when the original DecisionEvent does not exist', async () => {
      const userId = new Types.ObjectId();
      const fakeId = new Types.ObjectId();
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      await expect(
        applyOverride.execute(
          makeOverrideInput(fakeId),
          makeCtx(userId, 'trace-missing')
        )
      ).rejects.toThrow(/original DecisionEvent not found/);

      // Critical: throws BEFORE writing anything — no orphan analyses
      const events = await reads.getEventsByTraceId('trace-missing');
      expect(events).toHaveLength(0);
    });

    it('rejects malformed fieldPath (empty string)', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      await expect(
        applyOverride.execute(
          makeOverrideInput(originalDecisionId, { fieldPath: '' }),
          makeCtx(userId)
        )
      ).rejects.toThrow();
    });

    it('rejects invalid inputMethod', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      const malformed = makeOverrideInput(originalDecisionId, {
        inputMethod: 'voice' as unknown as ApplyOverrideInput['inputMethod'],
      });
      await expect(
        applyOverride.execute(malformed, makeCtx(userId))
      ).rejects.toThrow();
    });

    it('rejects newValue of an unsupported type (e.g., array)', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);
      setEngineAdapter(makeAdapter(stubEngineOutput(60)));

      const malformed = makeOverrideInput(originalDecisionId, {
        newValue: [0.08] as unknown as ApplyOverrideInput['newValue'],
      });
      await expect(
        applyOverride.execute(malformed, makeCtx(userId))
      ).rejects.toThrow();
    });

    it('propagates score_deal failures and writes NO OverrideEvent', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);

      // Failing adapter
      setEngineAdapter({
        async generateDecision() {
          throw new Error('Engine boom during re-score');
        },
      });

      await expect(
        applyOverride.execute(
          makeOverrideInput(originalDecisionId),
          makeCtx(userId, 'trace-fail')
        )
      ).rejects.toThrow(/Engine boom/);

      const events = await reads.getEventsByTraceId('trace-fail');
      expect(events).toHaveLength(0);
    });
  });

  // ===== Calibration drift signal =====

  describe('calibration drift signal (events store §8.3)', () => {
    it('multiple overrides on the same field show up in getOverrideFrequencyByField', async () => {
      const userId = new Types.ObjectId();
      const originalDecisionId = await seedOriginalDecision(userId, 72);

      // Three overrides on vacancyRate, two on monthlyRent
      for (let i = 0; i < 3; i++) {
        setEngineAdapter(makeAdapter(stubEngineOutput(60 + i)));
        await applyOverride.execute(
          makeOverrideInput(originalDecisionId, { fieldPath: 'assumptions.vacancyRate' }),
          makeCtx(userId, `vac-${i}`)
        );
      }
      for (let i = 0; i < 2; i++) {
        setEngineAdapter(makeAdapter(stubEngineOutput(70 + i)));
        await applyOverride.execute(
          makeOverrideInput(originalDecisionId, { fieldPath: 'propertyData.monthlyRent' }),
          makeCtx(userId, `rent-${i}`)
        );
      }

      const freq = await reads.getOverrideFrequencyByField(30);
      expect(freq.get('assumptions.vacancyRate')).toBe(3);
      expect(freq.get('propertyData.monthlyRent')).toBe(2);
      // Highest-count field ranks first (Map insertion order = sort desc)
      expect(Array.from(freq.keys())[0]).toBe('assumptions.vacancyRate');
    });
  });
});
