/**
 * W4-S4 acceptance test — tool:render_audit_trail.
 *
 * Read-only wrapper over EventsRepositoryReads.getAuditTrail. The
 * underlying read already has its own thorough test (W1-S4); these
 * tests verify the TOOL boundary:
 *   1. Contract conformance (invokeLLM: false, no side effects)
 *   2. Forwards inputs correctly
 *   3. Returns the full bundle shape
 *   4. Trust boundary on input
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../../../repositories/EventsRepository';
import { EventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { renderAuditTrail } from '../render_audit_trail';
import type { ToolContext } from '../types';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('tool:render_audit_trail (W4-S4)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

  function makeCtx(userId: Types.ObjectId, traceId = 'trace-audit'): ToolContext {
    return {
      traceId,
      userId,
      eventsRepo: writes,
      eventsReads: reads,
      tools: {},
    };
  }

  /** Seed a full audit trail: analysis + decision + override + critique + audit_trail. */
  async function seedFullAuditTrail(userId: Types.ObjectId): Promise<{
    analysisEventId: Types.ObjectId;
    decisionEventId: Types.ObjectId;
  }> {
    const analysisEventId = await writes.writeAnalysisEvent({
      traceId: 'seed',
      actorType: 'tool:score_deal',
      userId,
      payload: {
        propertyData: { propertyType: 'SFR', purchasePrice: 425000 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['propertyData'],
        marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['marketData'],
        assumptions: { vacancyRate: 0.05 },
        metrics: { capRate: 5.2 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['metrics'],
        monthlyAnalysis: { cashFlow: -120 },
        longTermAnalysis: { projectionYears: 10 },
        walkAwayPrice: 385000,
        enrichmentSource: 'rentcast',
        enrichmentCacheHit: false,
        engineVersion: 'v3.0',
        computeTimeMs: 142,
      },
    });

    const decisionPayload: DecisionPayload = {
      analysisEventId,
      dealId: new Types.ObjectId(),
      dealQuality: 72,
      qualityLabel: 'Meets professional standards',
      qualityColor: 'yellow',
      professionalAssessment: { dealQuality: 72 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 385000 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'ok',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: { cashFlow: 0.3 } as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
    };
    const decisionEventId = await writes.writeDecisionEvent({
      traceId: 'seed',
      actorType: 'agent:deal_scoring',
      userId,
      payload: decisionPayload,
    });

    await writes.writeOverrideEvent({
      traceId: 'seed',
      actorType: 'user',
      userId,
      payload: {
        originalDecisionId: decisionEventId,
        fieldPath: 'assumptions.vacancyRate',
        originalValue: 0.05,
        newValue: 0.08,
        inputMethod: 'structured_modal',
        priorDealQuality: 72,
      },
    });

    await writes.writeCritiqueEvent({
      traceId: 'seed',
      actorType: 'agent:adversarial_critic',
      userId,
      payload: {
        originalDecisionId: decisionEventId,
        criticPersona: 'skeptical_cpa',
        agreementWithOriginal: false,
        divergenceReasons: ['Vacancy too aggressive'],
        alternativeAssumptions: [
          { fieldPath: 'assumptions.vacancyRate', suggestedValue: 0.08, reasoning: 'market' },
        ],
        severityScore: 65,
        triggerType: 'auto_buy_band',
        modelUsed: 'claude-opus-4-7',
        tokenCost: 0.08,
      },
    });

    await writes.writeAuditTrailEvent({
      traceId: 'seed',
      actorType: 'user',
      userId,
      payload: {
        decisionId: decisionEventId,
        action: 'view_assumptions',
        viewedAssumptions: ['vacancyRate'],
      },
    });

    return { analysisEventId, decisionEventId };
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
  });

  // ===== Contract =====

  describe('Tool contract', () => {
    it('declares invokeLLM: false', () => {
      expect(renderAuditTrail.invokeLLM).toBe(false);
    });
    it('declares no side effects (pure read)', () => {
      expect(renderAuditTrail.sideEffects).toEqual([]);
    });
    it('has the stable global name', () => {
      expect(renderAuditTrail.name).toBe('render_audit_trail');
    });
  });

  // ===== Happy path =====

  describe('execute() — happy path', () => {
    it('returns the full audit-trail bundle', async () => {
      const userId = new Types.ObjectId();
      const { decisionEventId, analysisEventId } = await seedFullAuditTrail(userId);

      const out = await renderAuditTrail.execute(
        { decisionId: decisionEventId },
        makeCtx(userId)
      );

      expect((out.decision._id as Types.ObjectId).toString()).toBe(
        decisionEventId.toString()
      );
      expect((out.analysis?._id as Types.ObjectId).toString()).toBe(
        analysisEventId.toString()
      );
      expect(out.overrides).toHaveLength(1);
      expect(out.critiques).toHaveLength(1);
      expect(out.auditEvents).toHaveLength(1);
    });

    it('returns empty arrays for overrides/critiques/auditEvents when decision is bare', async () => {
      const userId = new Types.ObjectId();
      // Seed only an analysis + decision (no overrides, critiques, audits)
      const analysisEventId = await writes.writeAnalysisEvent({
        traceId: 'bare',
        actorType: 'tool:score_deal',
        userId,
        payload: {
          propertyData: { propertyType: 'SFR', purchasePrice: 425000 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['propertyData'],
          marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['marketData'],
          assumptions: {},
          metrics: { capRate: 5 } as unknown as Parameters<typeof writes.writeAnalysisEvent>[0]['payload']['metrics'],
          monthlyAnalysis: {},
          longTermAnalysis: {},
          walkAwayPrice: 385000,
          enrichmentSource: 'rentcast',
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 50,
        },
      });
      const decisionPayload: DecisionPayload = {
        analysisEventId,
        dealQuality: 50,
        qualityLabel: 'Requires optimization',
        qualityColor: 'orange',
        professionalAssessment: {} as unknown as DecisionPayload['professionalAssessment'],
        marketPosition: { walkAwayPrice: 385000 } as unknown as DecisionPayload['marketPosition'],
        reasoningTrail: {
          primaryInsight: 'bare',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 50,
        scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
        engineVersion: 'v3.0',
      };
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'bare',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload,
      });

      const out = await renderAuditTrail.execute(
        { decisionId },
        makeCtx(userId)
      );
      expect(out.overrides).toEqual([]);
      expect(out.critiques).toEqual([]);
      expect(out.auditEvents).toEqual([]);
      expect(out.analysis).not.toBeNull();
    });

    it('returns analysis: null when the linked AnalysisEvent is missing', async () => {
      const userId = new Types.ObjectId();
      // Decision with an analysisEventId that points nowhere
      const decisionPayload: DecisionPayload = {
        analysisEventId: new Types.ObjectId(),
        dealQuality: 60,
        qualityLabel: 'Requires optimization',
        qualityColor: 'orange',
        professionalAssessment: {} as unknown as DecisionPayload['professionalAssessment'],
        marketPosition: { walkAwayPrice: 0 } as unknown as DecisionPayload['marketPosition'],
        reasoningTrail: {
          primaryInsight: 'orphan',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 50,
        scoringWeightsUsed: {} as unknown as DecisionPayload['scoringWeightsUsed'],
        engineVersion: 'v3.0',
      };
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'orphan',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload,
      });

      const out = await renderAuditTrail.execute(
        { decisionId },
        makeCtx(userId)
      );
      expect(out.analysis).toBeNull();
    });

    it('accepts a hex-string decisionId', async () => {
      const userId = new Types.ObjectId();
      const { decisionEventId } = await seedFullAuditTrail(userId);

      const out = await renderAuditTrail.execute(
        { decisionId: decisionEventId.toHexString() },
        makeCtx(userId)
      );
      expect((out.decision._id as Types.ObjectId).toString()).toBe(
        decisionEventId.toString()
      );
    });
  });

  // ===== Error handling =====

  describe('error handling', () => {
    it('throws when decisionId references a non-existent decision', async () => {
      const userId = new Types.ObjectId();
      const fake = new Types.ObjectId();
      await expect(
        renderAuditTrail.execute({ decisionId: fake }, makeCtx(userId))
      ).rejects.toThrow(/Decision not found/);
    });
  });
});
