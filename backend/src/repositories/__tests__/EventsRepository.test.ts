/**
 * W1-S3 acceptance test — EventsRepository write API.
 *
 * Repository is the only sanctioned write path to the events collection.
 * Each write method:
 *   - Parses payload with Zod before write (rejects invalid)
 *   - Constructs envelope (traceId, eventVersion, actorType, userId)
 *   - Returns the new event's ObjectId
 *   - Writes to the unified `events` collection
 *
 * Tests below cover one method in depth (writeAnalysisEvent — most
 * common path) and one method smoke-style per remaining event type
 * (proves the pattern works; full schema validation already tested
 * in models/events/__tests__/*.test.ts).
 *
 * Uses mongodb-memory-server (project policy: Atlas-only for dev/prod,
 * memory-server for unit tests).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventsRepository } from '../EventsRepository';
import type { ProfilePayload } from '../../models/events/ProfileEvent';
import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { OverridePayload } from '../../models/events/OverrideEvent';
import type { CritiquePayload } from '../../models/events/CritiqueEvent';
import type { ConversationPayload } from '../../models/events/ConversationEvent';
import type { AuditTrailPayload } from '../../models/events/AuditTrailEvent';
import type { WatchlistPayload } from '../../models/events/WatchlistEvent';
import type { OutcomePayload } from '../../models/events/OutcomeEvent';
import type { PortfolioPayload } from '../../models/events/PortfolioEvent';
import type { PipelinePayload } from '../../models/events/PipelineEvent';

const SETUP_TIMEOUT_MS = 90_000;
const TEST_USER_ID = new Types.ObjectId();

describe('EventsRepository write API (W1-S3)', () => {
  let mongoServer: MongoMemoryServer;
  let repo: EventsRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repo = new EventsRepository();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // ===== Deep coverage on writeAnalysisEvent (most common path) =====

  describe('writeAnalysisEvent (canonical write path)', () => {
    function validInput() {
      return {
        traceId: 'test-trace-1',
        actorType: 'tool:score_deal' as const,
        userId: TEST_USER_ID,
        payload: {
          propertyData: { propertyType: 'SFR', purchasePrice: 425000 } as unknown as AnalysisPayload['propertyData'],
          marketData: { lastUpdated: new Date(), dataSource: ['rentcast'] } as unknown as AnalysisPayload['marketData'],
          assumptions: { vacancyRate: 0.05 },
          metrics: { capRate: 5.2 } as unknown as AnalysisPayload['metrics'],
          monthlyAnalysis: { cashFlow: -120 },
          longTermAnalysis: { projectionYears: 10 },
          walkAwayPrice: 385000,
          enrichmentSource: 'rentcast' as const,
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 142,
        },
      };
    }

    it('returns an ObjectId on successful write', async () => {
      const id = await repo.writeAnalysisEvent(validInput());
      expect(id).toBeInstanceOf(Types.ObjectId);
    });

    it('persists event in unified events collection with eventType: analysis', async () => {
      await repo.writeAnalysisEvent(validInput());
      const docs = await mongoose.connection.db.collection('events').find({}).toArray();
      expect(docs).toHaveLength(1);
      expect(docs[0].eventType).toBe('analysis');
      expect(docs[0].traceId).toBe('test-trace-1');
      expect(docs[0].eventVersion).toBe(1);
      expect(docs[0].actorType).toBe('tool:score_deal');
    });

    it('propagates traceId from input to written event', async () => {
      const customTraceId = '550e8400-e29b-41d4-a716-446655440000';
      await repo.writeAnalysisEvent({ ...validInput(), traceId: customTraceId });
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.traceId).toBe(customTraceId);
    });

    it('preserves the validated payload exactly', async () => {
      await repo.writeAnalysisEvent(validInput());
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.payload.walkAwayPrice).toBe(385000);
      expect(doc?.payload.enrichmentSource).toBe('rentcast');
      expect(doc?.payload.engineVersion).toBe('v3.0');
    });

    it('THROWS on Zod parse failure (invalid enrichmentSource)', async () => {
      const invalid = validInput();
      // @ts-expect-error — intentionally invalid for runtime test
      invalid.payload.enrichmentSource = 'attom';
      await expect(repo.writeAnalysisEvent(invalid)).rejects.toThrow();
    });

    it('THROWS when no event is written if Zod fails (no partial-write)', async () => {
      const invalid = validInput();
      // @ts-expect-error — intentionally invalid for runtime test
      invalid.payload.walkAwayPrice = 'not a number';
      await expect(repo.writeAnalysisEvent(invalid)).rejects.toThrow();
      const count = await mongoose.connection.db.collection('events').countDocuments({});
      expect(count).toBe(0);
    });

    it('accepts institutionId for B2B events', async () => {
      const input = validInput();
      const institutionId = new Types.ObjectId();
      await repo.writeAnalysisEvent({ ...input, institutionId });
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.institutionId?.toString()).toBe(institutionId.toString());
    });
  });

  // ===== Smoke tests — one write per remaining event type =====
  //
  // Each verifies: ObjectId returned, event in collection with correct
  // eventType. Full schema validation lives in models/events/__tests__/.

  describe('writeProfileEvent', () => {
    it('writes a ProfileEvent', async () => {
      const payload: ProfilePayload = {
        investorType: 'retail',
        riskTolerance: 'moderate',
      };
      const id = await repo.writeProfileEvent({
        traceId: 't-profile',
        actorType: 'tool:profile_extraction',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('profile');
    });
  });

  describe('writeDecisionEvent', () => {
    it('writes a DecisionEvent (load-bearing path)', async () => {
      const payload: DecisionPayload = {
        analysisEventId: new Types.ObjectId(),
        dealQuality: 67,
        qualityLabel: 'Meets professional standards',
        qualityColor: 'yellow',
        professionalAssessment: {} as DecisionPayload['professionalAssessment'],
        marketPosition: {} as DecisionPayload['marketPosition'],
        reasoningTrail: {
          primaryInsight: 'Solid foundation',
          strategicRecommendations: [],
          riskMitigation: [],
          opportunityMaximization: [],
          keyRisks: [],
        },
        confidence: 78,
        scoringWeightsUsed: {} as DecisionPayload['scoringWeightsUsed'],
        engineVersion: 'v3.0',
      };
      const id = await repo.writeDecisionEvent({
        traceId: 't-decision',
        actorType: 'tool:score_deal',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('decision');
      expect(doc?.payload.dealQuality).toBe(67);
    });
  });

  describe('writeOverrideEvent', () => {
    it('writes an OverrideEvent (highest-signal type)', async () => {
      const payload: OverridePayload = {
        originalDecisionId: new Types.ObjectId(),
        fieldPath: 'assumptions.vacancyRate',
        originalValue: 0.05,
        newValue: 0.08,
        inputMethod: 'inline_chat',
        priorDealQuality: 67,
      };
      const id = await repo.writeOverrideEvent({
        traceId: 't-override',
        actorType: 'tool:apply_override',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('override');
    });
  });

  describe('writeCritiqueEvent', () => {
    it('writes a CritiqueEvent', async () => {
      const payload: CritiquePayload = {
        originalDecisionId: new Types.ObjectId(),
        criticPersona: 'skeptical_cpa',
        agreementWithOriginal: false,
        divergenceReasons: ['Maintenance reserve too low'],
        alternativeAssumptions: [],
        severityScore: 60,
        triggerType: 'auto_buy_band',
        modelUsed: 'claude-opus-4-7',
        tokenCost: 0.09,
      };
      const id = await repo.writeCritiqueEvent({
        traceId: 't-critique',
        actorType: 'agent:adversarial_critic',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('critique');
    });
  });

  describe('writeConversationEvent', () => {
    it('writes a ConversationEvent', async () => {
      const payload: ConversationPayload = {
        sessionId: '550e8400-e29b-41d4-a716-446655440001',
        turnNumber: 1,
        userInput: { text: 'analyze this property', inputMethod: 'text' },
        intentClassification: {
          intent: 'analyze_property',
          confidence: 94,
          classifierModel: 'claude-haiku-4-5',
        },
        routedTo: 'agent:deal_scoring',
        toolCalls: [],
        agentResponse: { text: 'Pulling data...', structuredOutputs: [], relatedEventIds: [] },
        tokenUsage: { inputTokens: 100, outputTokens: 10, cachedTokens: 80, estimatedCostCents: 1 },
        modelUsed: 'claude-sonnet-4-6',
        totalDurationMs: 850,
      };
      const id = await repo.writeConversationEvent({
        traceId: 't-conversation',
        actorType: 'agent:deal_scoring',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('conversation');
    });
  });

  describe('writeAuditTrailEvent', () => {
    it('writes an AuditTrailEvent', async () => {
      const payload: AuditTrailPayload = {
        decisionId: new Types.ObjectId(),
        action: 'export_pdf',
        exportFormat: 'pdf',
      };
      const id = await repo.writeAuditTrailEvent({
        traceId: 't-audit',
        actorType: 'tool:export_audit_pdf',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('audit_trail');
    });
  });

  describe('writeWatchlistEvent', () => {
    it('writes a WatchlistEvent', async () => {
      const payload: WatchlistPayload = {
        dealId: new Types.ObjectId(),
        source: 'chat',
      };
      const id = await repo.writeWatchlistEvent({
        traceId: 't-watchlist',
        actorType: 'tool:save_to_watchlist',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('watchlist');
    });
  });

  describe('writeOutcomeEvent', () => {
    it('writes an OutcomeEvent', async () => {
      const payload: OutcomePayload = {
        dealId: new Types.ObjectId(),
        originalDecisionId: new Types.ObjectId(),
        outcome: 'closed',
        outcomeDate: new Date(),
        reportedBy: 'self',
      };
      const id = await repo.writeOutcomeEvent({
        traceId: 't-outcome',
        actorType: 'system',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('outcome');
    });
  });

  describe('writePortfolioEvent (discriminated union)', () => {
    it('writes a portfolio_created PortfolioEvent', async () => {
      const payload: PortfolioPayload = {
        subType: 'portfolio_created',
        portfolioId: new Types.ObjectId(),
        goals: { primaryGoal: 'cash_flow' },
      };
      const id = await repo.writePortfolioEvent({
        traceId: 't-portfolio',
        actorType: 'system',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('portfolio');
      expect(doc?.payload.subType).toBe('portfolio_created');
    });
  });

  describe('writePipelineEvent (discriminated union)', () => {
    it('writes a pipeline_deal_closed PipelineEvent', async () => {
      const payload: PipelinePayload = {
        subType: 'pipeline_deal_closed',
        pipelineDealId: new Types.ObjectId(),
        finalOutcome: 'closed',
      };
      const id = await repo.writePipelineEvent({
        traceId: 't-pipeline',
        actorType: 'system',
        userId: TEST_USER_ID,
        payload,
      });
      expect(id).toBeInstanceOf(Types.ObjectId);
      const doc = await mongoose.connection.db.collection('events').findOne({});
      expect(doc?.eventType).toBe('pipeline');
    });
  });

  // ===== Cross-cutting tests =====

  describe('cross-cutting concerns', () => {
    it('correlates multiple events written under the same traceId', async () => {
      const sharedTraceId = 'turn-trace-shared';

      // Simulate one user turn that produces 3 events: ProfileEvent +
      // AnalysisEvent + DecisionEvent
      await repo.writeProfileEvent({
        traceId: sharedTraceId,
        actorType: 'tool:profile_extraction',
        userId: TEST_USER_ID,
        payload: { investorType: 'retail' },
      });

      await repo.writeAnalysisEvent({
        traceId: sharedTraceId,
        actorType: 'tool:score_deal',
        userId: TEST_USER_ID,
        payload: {
          propertyData: { propertyType: 'SFR' } as unknown as AnalysisPayload['propertyData'],
          marketData: {} as unknown as AnalysisPayload['marketData'],
          assumptions: {},
          metrics: {} as unknown as AnalysisPayload['metrics'],
          monthlyAnalysis: {},
          longTermAnalysis: {},
          walkAwayPrice: 385000,
          enrichmentSource: 'rentcast',
          enrichmentCacheHit: false,
          engineVersion: 'v3.0',
          computeTimeMs: 100,
        },
      });

      await repo.writeDecisionEvent({
        traceId: sharedTraceId,
        actorType: 'tool:score_deal',
        userId: TEST_USER_ID,
        payload: {
          analysisEventId: new Types.ObjectId(),
          dealQuality: 67,
          qualityLabel: 'Meets professional standards',
          qualityColor: 'yellow',
          professionalAssessment: {} as DecisionPayload['professionalAssessment'],
          marketPosition: {} as DecisionPayload['marketPosition'],
          reasoningTrail: {
            primaryInsight: 'ok',
            strategicRecommendations: [],
            riskMitigation: [],
            opportunityMaximization: [],
            keyRisks: [],
          },
          confidence: 78,
          scoringWeightsUsed: {} as DecisionPayload['scoringWeightsUsed'],
          engineVersion: 'v3.0',
        },
      });

      // Query by traceId — should get all 3 events
      const events = await mongoose.connection.db
        .collection('events')
        .find({ traceId: sharedTraceId })
        .toArray();
      expect(events).toHaveLength(3);

      const eventTypes = events.map((e) => e.eventType).sort();
      expect(eventTypes).toEqual(['analysis', 'decision', 'profile']);
    });

    it('repository does NOT expose update or delete methods (TS compile + runtime check)', () => {
      // Compile-time: no update/delete methods exist on the class.
      // The following compile-time check is for documentation; it does not
      // execute meaningfully but proves the methods are not present.
      const repoAny = repo as unknown as Record<string, unknown>;
      expect(repoAny.updateEvent).toBeUndefined();
      expect(repoAny.deleteEvent).toBeUndefined();
      expect(repoAny.bulkWrite).toBeUndefined();
      expect(repoAny.updateOne).toBeUndefined();
      expect(repoAny.deleteOne).toBeUndefined();
    });

    it('default export `eventsRepository` is the same class', async () => {
      const { eventsRepository } = await import('../EventsRepository');
      expect(eventsRepository).toBeInstanceOf(EventsRepository);
    });
  });
});
