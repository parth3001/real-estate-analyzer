/**
 * W1-S4 acceptance test — EventsRepositoryReads read API.
 *
 * Validates the named query recipes per events store §8:
 *   §8.1 — getRecentEventsForUser, getEventsByTraceId, getConversationHistory
 *   §8.2 — getCurrentProfile, getRecentDecisionsForUser, getRecentOverridesForUser
 *   §8.3 — getOverrideFrequencyByField (calibration drift signal)
 *   §8.4 — getAuditTrail (one query shape, three surfaces)
 *
 * Plus auxiliary reads:
 *   - getDecisionHistoryForDeal
 *   - getCritiquesForDecision
 *
 * Uses mongodb-memory-server. Each test seeds via the write API so we
 * exercise the full insert→read path the application uses.
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../EventsRepository';
import { EventsRepositoryReads } from '../EventsRepositoryReads';
import type { ProfilePayload } from '../../models/events/ProfileEvent';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { OverridePayload } from '../../models/events/OverrideEvent';
import type { CritiquePayload } from '../../models/events/CritiqueEvent';
import type { ConversationPayload } from '../../models/events/ConversationEvent';
import type { AuditTrailPayload } from '../../models/events/AuditTrailEvent';

const SETUP_TIMEOUT_MS = 90_000;

describe('EventsRepositoryReads (W1-S4)', () => {
  let mongoServer: MongoMemoryServer;
  let writes: EventsRepository;
  let reads: EventsRepositoryReads;

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

  // ===== Fixture builders =====

  function buildAnalysisPayload(): AnalysisPayload {
    return {
      propertyData: { propertyType: 'SFR', purchasePrice: 425000 } as unknown as AnalysisPayload['propertyData'],
      marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as AnalysisPayload['marketData'],
      assumptions: { vacancyRate: 0.05 },
      metrics: { capRate: 5.2 } as unknown as AnalysisPayload['metrics'],
      monthlyAnalysis: { cashFlow: -120 },
      longTermAnalysis: { projectionYears: 10 },
      walkAwayPrice: 385000,
      enrichmentSource: 'rentcast',
      enrichmentCacheHit: false,
      engineVersion: 'v3.0',
      computeTimeMs: 142,
    };
  }

  function buildDecisionPayload(overrides: Partial<DecisionPayload> = {}): DecisionPayload {
    return {
      analysisEventId: new Types.ObjectId(),
      dealId: new Types.ObjectId(),
      dealQuality: 72,
      qualityLabel: 'Meets professional standards',
      qualityColor: 'yellow',
      professionalAssessment: { dealQuality: 72 } as unknown as DecisionPayload['professionalAssessment'],
      marketPosition: { walkAwayPrice: 385000 } as unknown as DecisionPayload['marketPosition'],
      reasoningTrail: {
        primaryInsight: 'Solid cash flow with modest cap-rate spread.',
        strategicRecommendations: [],
        riskMitigation: [],
        opportunityMaximization: [],
        keyRisks: [],
      },
      confidence: 80,
      scoringWeightsUsed: { cashFlow: 0.3 } as unknown as DecisionPayload['scoringWeightsUsed'],
      engineVersion: 'v3.0',
      ...overrides,
    };
  }

  function buildOverridePayload(
    originalDecisionId: Types.ObjectId,
    fieldPath: string,
    priorDealQuality = 72
  ): OverridePayload {
    return {
      originalDecisionId,
      fieldPath,
      originalValue: 0.05,
      newValue: 0.08,
      inputMethod: 'structured_modal',
      priorDealQuality,
    };
  }

  function buildCritiquePayload(originalDecisionId: Types.ObjectId): CritiquePayload {
    return {
      originalDecisionId,
      criticPersona: 'skeptical_cpa',
      agreementWithOriginal: false,
      divergenceReasons: ['Vacancy assumption too aggressive for this submarket.'],
      alternativeAssumptions: [
        { fieldPath: 'assumptions.vacancyRate', suggestedValue: 0.08, reasoning: 'Market history.' },
      ],
      severityScore: 65,
      triggerType: 'auto_buy_band',
      modelUsed: 'claude-opus-4-7',
      tokenCost: 0.08,
    };
  }

  function buildConversationPayload(
    sessionId: string,
    turnNumber: number
  ): ConversationPayload {
    return {
      sessionId,
      turnNumber,
      userInput: { text: `Turn ${turnNumber}`, inputMethod: 'text' },
      intentClassification: { intent: 'qa_general', confidence: 90, classifierModel: 'haiku-4' },
      routedTo: 'agent:qa',
      toolCalls: [],
      agentResponse: { text: 'Answer.', structuredOutputs: [], relatedEventIds: [] },
      tokenUsage: { inputTokens: 100, outputTokens: 200, cachedTokens: 0, estimatedCostCents: 1 },
      modelUsed: 'haiku-4',
      totalDurationMs: 1200,
    };
  }

  function buildAuditTrailPayload(decisionId: Types.ObjectId): AuditTrailPayload {
    return { decisionId, action: 'view_assumptions', viewedAssumptions: ['vacancyRate'] };
  }

  // ===== §8.1 — Recent events =====

  describe('getRecentEventsForUser (§8.1)', () => {
    it('returns events in newest-first order', async () => {
      const userId = new Types.ObjectId();
      await writes.writeAnalysisEvent({ traceId: 't1', actorType: 'tool:score_deal', userId, payload: buildAnalysisPayload() });
      // tiny delay to ensure distinct timestamps
      await new Promise((r) => setTimeout(r, 5));
      await writes.writeDecisionEvent({ traceId: 't1', actorType: 'agent:deal_scoring', userId, payload: buildDecisionPayload() });

      const events = await reads.getRecentEventsForUser(userId);
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('decision');
      expect(events[1].eventType).toBe('analysis');
    });

    it('respects the limit parameter', async () => {
      const userId = new Types.ObjectId();
      for (let i = 0; i < 5; i++) {
        await writes.writeWatchlistEvent({
          traceId: `t-${i}`,
          actorType: 'user',
          userId,
          payload: { dealId: new Types.ObjectId(), source: 'wizard' },
        });
      }
      const events = await reads.getRecentEventsForUser(userId, 3);
      expect(events).toHaveLength(3);
    });

    it('scopes to the requested user (no cross-user leakage)', async () => {
      const userA = new Types.ObjectId();
      const userB = new Types.ObjectId();
      await writes.writeAnalysisEvent({ traceId: 'a', actorType: 'tool:score_deal', userId: userA, payload: buildAnalysisPayload() });
      await writes.writeAnalysisEvent({ traceId: 'b', actorType: 'tool:score_deal', userId: userB, payload: buildAnalysisPayload() });

      const eventsA = await reads.getRecentEventsForUser(userA);
      expect(eventsA).toHaveLength(1);
      expect(eventsA[0].userId.toString()).toBe(userA.toString());
    });

    it('accepts a hex-string userId', async () => {
      const userId = new Types.ObjectId();
      await writes.writeAnalysisEvent({ traceId: 'h', actorType: 'tool:score_deal', userId, payload: buildAnalysisPayload() });
      const events = await reads.getRecentEventsForUser(userId.toHexString());
      expect(events).toHaveLength(1);
    });
  });

  // ===== §8.1 — traceId =====

  describe('getEventsByTraceId (§8.1)', () => {
    it('returns all events for one interaction, oldest first', async () => {
      const userId = new Types.ObjectId();
      const traceId = 'interaction-abc';
      await writes.writeAnalysisEvent({ traceId, actorType: 'tool:score_deal', userId, payload: buildAnalysisPayload() });
      await new Promise((r) => setTimeout(r, 5));
      await writes.writeDecisionEvent({ traceId, actorType: 'agent:deal_scoring', userId, payload: buildDecisionPayload() });

      const events = await reads.getEventsByTraceId(traceId);
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('analysis');
      expect(events[1].eventType).toBe('decision');
    });

    it('returns empty array when traceId is unknown', async () => {
      expect(await reads.getEventsByTraceId('does-not-exist')).toEqual([]);
    });
  });

  // ===== Current profile =====

  describe('getCurrentProfile (event-sourced projection)', () => {
    it('returns the most recent ProfileEvent payload', async () => {
      const userId = new Types.ObjectId();
      const first: ProfilePayload = { investorType: 'retail', riskTolerance: 'moderate' };
      const second: ProfilePayload = { investorType: 'pro', riskTolerance: 'aggressive' };

      await writes.writeProfileEvent({ traceId: 'p1', actorType: 'user', userId, payload: first });
      await new Promise((r) => setTimeout(r, 5));
      await writes.writeProfileEvent({ traceId: 'p2', actorType: 'user', userId, payload: second });

      const current = await reads.getCurrentProfile(userId);
      expect(current).toMatchObject(second);
    });

    it('returns null when the user has no profile events', async () => {
      const current = await reads.getCurrentProfile(new Types.ObjectId());
      expect(current).toBeNull();
    });
  });

  // ===== Conversation history =====

  describe('getConversationHistory (§8.1)', () => {
    it('returns turns ordered by turnNumber for the session', async () => {
      const userId = new Types.ObjectId();
      const sessionId = '11111111-2222-4333-8444-555555555555';

      // Write turns out of order to prove the sort is by turnNumber, not timestamp.
      await writes.writeConversationEvent({ traceId: 'c1', actorType: 'user', userId, payload: buildConversationPayload(sessionId, 2) });
      await writes.writeConversationEvent({ traceId: 'c2', actorType: 'user', userId, payload: buildConversationPayload(sessionId, 1) });
      await writes.writeConversationEvent({ traceId: 'c3', actorType: 'user', userId, payload: buildConversationPayload(sessionId, 3) });

      const turns = await reads.getConversationHistory(sessionId);
      expect(turns.map((t) => t.payload.turnNumber)).toEqual([1, 2, 3]);
    });

    it('only returns turns for the requested session', async () => {
      const userId = new Types.ObjectId();
      const sessionA = '11111111-2222-4333-8444-aaaaaaaaaaaa';
      const sessionB = '11111111-2222-4333-8444-bbbbbbbbbbbb';

      await writes.writeConversationEvent({ traceId: 'a', actorType: 'user', userId, payload: buildConversationPayload(sessionA, 1) });
      await writes.writeConversationEvent({ traceId: 'b', actorType: 'user', userId, payload: buildConversationPayload(sessionB, 1) });

      const aTurns = await reads.getConversationHistory(sessionA);
      expect(aTurns).toHaveLength(1);
      expect(aTurns[0].payload.sessionId).toBe(sessionA);
    });
  });

  // ===== §8.2 — Agent context seed =====

  describe('getRecentDecisionsForUser / getRecentOverridesForUser (§8.2)', () => {
    it('returns the most recent N DecisionEvents, newest first', async () => {
      const userId = new Types.ObjectId();
      for (let i = 0; i < 12; i++) {
        await writes.writeDecisionEvent({
          traceId: `d-${i}`,
          actorType: 'agent:deal_scoring',
          userId,
          payload: buildDecisionPayload({ dealQuality: 50 + i }),
        });
      }
      const decisions = await reads.getRecentDecisionsForUser(userId, 5);
      expect(decisions).toHaveLength(5);
      expect(decisions[0].payload.dealQuality).toBe(61); // newest
      expect(decisions[4].payload.dealQuality).toBe(57);
    });

    it('returns the most recent N OverrideEvents, newest first', async () => {
      const userId = new Types.ObjectId();
      const decisionId = new Types.ObjectId();
      for (let i = 0; i < 25; i++) {
        await writes.writeOverrideEvent({
          traceId: `o-${i}`,
          actorType: 'user',
          userId,
          payload: buildOverridePayload(decisionId, `assumptions.field${i}`),
        });
      }
      const overrides = await reads.getRecentOverridesForUser(userId, 20);
      expect(overrides).toHaveLength(20);
    });
  });

  // ===== Per-deal decision history =====

  describe('getDecisionHistoryForDeal', () => {
    it('returns all DecisionEvents for a deal, oldest first', async () => {
      const userId = new Types.ObjectId();
      const dealId = new Types.ObjectId();
      await writes.writeDecisionEvent({
        traceId: 'h1',
        actorType: 'agent:deal_scoring',
        userId,
        payload: buildDecisionPayload({ dealId, dealQuality: 60 }),
      });
      await new Promise((r) => setTimeout(r, 5));
      await writes.writeDecisionEvent({
        traceId: 'h2',
        actorType: 'agent:deal_scoring',
        userId,
        payload: buildDecisionPayload({ dealId, dealQuality: 75 }),
      });

      const history = await reads.getDecisionHistoryForDeal(dealId);
      expect(history).toHaveLength(2);
      expect(history[0].payload.dealQuality).toBe(60);
      expect(history[1].payload.dealQuality).toBe(75);
    });

    it('does not return DecisionEvents for other deals', async () => {
      const userId = new Types.ObjectId();
      const dealA = new Types.ObjectId();
      const dealB = new Types.ObjectId();

      await writes.writeDecisionEvent({ traceId: 'a', actorType: 'agent:deal_scoring', userId, payload: buildDecisionPayload({ dealId: dealA }) });
      await writes.writeDecisionEvent({ traceId: 'b', actorType: 'agent:deal_scoring', userId, payload: buildDecisionPayload({ dealId: dealB }) });

      const aHistory = await reads.getDecisionHistoryForDeal(dealA);
      expect(aHistory).toHaveLength(1);
      expect(aHistory[0].payload.dealId?.toString()).toBe(dealA.toString());
    });
  });

  // ===== §8.3 — Calibration drift =====

  describe('getOverrideFrequencyByField (§8.3)', () => {
    it('groups overrides by fieldPath and ranks by count', async () => {
      const userId = new Types.ObjectId();
      const decisionId = new Types.ObjectId();

      // vacancyRate overridden 4x, monthlyRent 2x, taxRate 1x
      for (let i = 0; i < 4; i++) {
        await writes.writeOverrideEvent({ traceId: `v-${i}`, actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'assumptions.vacancyRate') });
      }
      for (let i = 0; i < 2; i++) {
        await writes.writeOverrideEvent({ traceId: `r-${i}`, actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'propertyData.monthlyRent') });
      }
      await writes.writeOverrideEvent({ traceId: 'tx', actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'assumptions.taxRate') });

      const freq = await reads.getOverrideFrequencyByField(30);
      expect(freq.get('assumptions.vacancyRate')).toBe(4);
      expect(freq.get('propertyData.monthlyRent')).toBe(2);
      expect(freq.get('assumptions.taxRate')).toBe(1);

      // Map preserves insertion order; insertion was sorted desc by count.
      expect(Array.from(freq.keys())[0]).toBe('assumptions.vacancyRate');
    });

    it('excludes overrides outside the time window', async () => {
      const userId = new Types.ObjectId();
      const decisionId = new Types.ObjectId();
      await writes.writeOverrideEvent({ traceId: 'w', actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'assumptions.vacancyRate') });

      // Window of 0 days = since "now", so the just-written event is on the boundary;
      // use -1 days (i.e., since 1 day in the future) to make the window exclude everything.
      const freq = await reads.getOverrideFrequencyByField(-1);
      expect(freq.size).toBe(0);
    });
  });

  // ===== Critiques for a decision =====

  describe('getCritiquesForDecision', () => {
    it('returns critiques for the requested decision only', async () => {
      const userId = new Types.ObjectId();
      const decisionA = new Types.ObjectId();
      const decisionB = new Types.ObjectId();

      await writes.writeCritiqueEvent({ traceId: 'a', actorType: 'agent:adversarial_critic', userId, payload: buildCritiquePayload(decisionA) });
      await writes.writeCritiqueEvent({ traceId: 'b', actorType: 'agent:adversarial_critic', userId, payload: buildCritiquePayload(decisionB) });

      const aCritiques = await reads.getCritiquesForDecision(decisionA);
      expect(aCritiques).toHaveLength(1);
      expect(aCritiques[0].payload.originalDecisionId.toString()).toBe(decisionA.toString());
    });
  });

  // ===== §8.4 — Audit trail bundle =====

  describe('getAuditTrail (§8.4 — one query shape, three surfaces)', () => {
    it('returns the bundle: decision + analysis + overrides + critiques + audit events', async () => {
      const userId = new Types.ObjectId();

      // Seed an analysis
      const analysisId = await writes.writeAnalysisEvent({
        traceId: 't',
        actorType: 'tool:score_deal',
        userId,
        payload: buildAnalysisPayload(),
      });

      // Seed a decision pointing at that analysis
      const decisionId = await writes.writeDecisionEvent({
        traceId: 't',
        actorType: 'agent:deal_scoring',
        userId,
        payload: buildDecisionPayload({ analysisEventId: analysisId }),
      });

      // Two overrides and one critique and one audit entry on that decision
      await writes.writeOverrideEvent({ traceId: 'o1', actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'assumptions.vacancyRate') });
      await writes.writeOverrideEvent({ traceId: 'o2', actorType: 'user', userId, payload: buildOverridePayload(decisionId, 'propertyData.monthlyRent') });
      await writes.writeCritiqueEvent({ traceId: 'c', actorType: 'agent:adversarial_critic', userId, payload: buildCritiquePayload(decisionId) });
      await writes.writeAuditTrailEvent({ traceId: 'a', actorType: 'user', userId, payload: buildAuditTrailPayload(decisionId) });

      const bundle = await reads.getAuditTrail(decisionId);
      expect(bundle.decision._id.toString()).toBe(decisionId.toString());
      expect(bundle.analysis?._id.toString()).toBe(analysisId.toString());
      expect(bundle.overrides).toHaveLength(2);
      expect(bundle.critiques).toHaveLength(1);
      expect(bundle.auditEvents).toHaveLength(1);
    });

    it('returns null analysis when the linked AnalysisEvent does not exist', async () => {
      const userId = new Types.ObjectId();
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'orphan',
        actorType: 'agent:deal_scoring',
        userId,
        payload: buildDecisionPayload({ analysisEventId: new Types.ObjectId() }),
      });

      const bundle = await reads.getAuditTrail(decisionId);
      expect(bundle.analysis).toBeNull();
    });

    it('throws when the decision does not exist', async () => {
      const missing = new Types.ObjectId();
      await expect(reads.getAuditTrail(missing)).rejects.toThrow(/Decision not found/);
    });

    it('accepts a hex-string decisionId', async () => {
      const userId = new Types.ObjectId();
      const decisionId = await writes.writeDecisionEvent({
        traceId: 'hex',
        actorType: 'agent:deal_scoring',
        userId,
        payload: buildDecisionPayload(),
      });
      const bundle = await reads.getAuditTrail(decisionId.toHexString());
      expect(bundle.decision._id.toString()).toBe(decisionId.toString());
    });
  });
});
