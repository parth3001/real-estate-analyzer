/**
 * W2-S2 acceptance test — orchestrator.handleTurn() end-to-end.
 *
 * Uses stub Anthropic adapter (no real LLM). Verifies the orchestrator's
 * full control flow:
 *   1. Classify intent (Haiku call → CostEvent)
 *   2. Route per §2.3
 *   3. Execute (real tool call OR stub agent response)
 *   4. Emit ConversationEvent
 *   5. Return turn output with substrate-event IDs
 *
 * Key invariants tested:
 *   - Every turn writes exactly one ConversationEvent
 *   - Tool-only routes write real tool events (relatedEventIds populated)
 *   - Agent routes are stubbed (agentStubbed: true, no agent events)
 *   - Low-confidence falls back to agent:qa
 *   - traceId joins all substrate writes for the turn
 *   - inputMethod default + override
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { handleTurn } from '../orchestrator';
import {
  setAnthropicAdapter,
  resetAnthropicAdapter,
  type AnthropicAdapter,
} from '../../llm/anthropicAdapter';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import { eventsRepository } from '../../../repositories/EventsRepository';
import type { ChatIntent } from '../intentClassifier';
import type { DecisionPayload } from '../../../models/events/DecisionEvent';

const SETUP_TIMEOUT_MS = 90_000;
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

describe('orchestrator.handleTurn (W2-S2)', () => {
  let mongoServer: MongoMemoryServer;

  function classifierStub(intent: ChatIntent, confidence: number): AnthropicAdapter {
    return {
      async call() {
        return {
          text: JSON.stringify({ intent, confidence }),
          usage: { inputTokens: 800, outputTokens: 50, cachedTokens: 600 },
          model: 'claude-haiku-4-5',
          stopReason: 'end_turn',
        };
      },
    };
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    resetAnthropicAdapter();
  });

  // ===== Universal invariants =====

  describe('every turn writes a ConversationEvent', () => {
    it('writes exactly one ConversationEvent per turn', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'what is cap rate?',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.filter((e) => e.eventType === 'conversation');
      expect(conv).toHaveLength(1);
      expect(conv[0]._id.toString()).toBe(out.events.conversationEventId.toString());
    });

    it('ConversationEvent captures intent + confidence + routedTo', async () => {
      setAnthropicAdapter(classifierStub('qa_metric', 88));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'explain DSCR',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.find((e) => e.eventType === 'conversation')!;
      const payload = conv.payload as {
        intentClassification: { intent: string; confidence: number };
        routedTo: string;
        sessionId: string;
        turnNumber: number;
      };
      expect(payload.intentClassification.intent).toBe('qa_metric');
      expect(payload.intentClassification.confidence).toBe(88);
      expect(payload.routedTo).toBe('agent:qa');
      expect(payload.sessionId).toBe(SESSION_ID);
      expect(payload.turnNumber).toBe(1);
    });

    it('totalDurationMs is captured and non-negative', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'hello',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.find((e) => e.eventType === 'conversation')!;
      const dur = (conv.payload as { totalDurationMs: number }).totalDurationMs;
      expect(dur).toBeGreaterThanOrEqual(0);
    });

    it('defaults inputMethod to "text" when not provided', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'hi',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.find((e) => e.eventType === 'conversation')!;
      expect(
        (conv.payload as { userInput: { inputMethod: string } }).userInput.inputMethod
      ).toBe('text');
    });

    it('accepts inputMethod override (voice / paste)', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'hi',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
        inputMethod: 'voice',
      });
      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.find((e) => e.eventType === 'conversation')!;
      expect(
        (conv.payload as { userInput: { inputMethod: string } }).userInput.inputMethod
      ).toBe('voice');
    });
  });

  // ===== Agent routes (stubbed) =====

  describe('agent routes are stubbed', () => {
    it('analyze_property → agent:deal_scoring stub response', async () => {
      setAnthropicAdapter(classifierStub('analyze_property', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'look at 123 Main St',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.agentStubbed).toBe(true);
      expect(out.responseText).toContain('deal-scoring');
      expect(out.routing.target).toBe('agent:deal_scoring');
      expect(out.events.related).toHaveLength(0);
    });

    it('qa_general → agent:qa stub response', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'general question',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.agentStubbed).toBe(true);
      expect(out.responseText).toContain('Q&A');
    });

    it('request_critique → agent:adversarial_critic stub response', async () => {
      setAnthropicAdapter(classifierStub('request_critique', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'have a critic look at this',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.agentStubbed).toBe(true);
      expect(out.responseText).toContain('critic');
    });
  });

  // ===== Tool-only routes (real execution) =====

  describe('tool-only routes execute end-to-end', () => {
    it('save_action → tool:save_to_watchlist writes WatchlistEvent', async () => {
      setAnthropicAdapter(classifierStub('save_action', 92));
      const userId = new Types.ObjectId();

      // First seed a DecisionEvent so save_to_watchlist has something to point at
      const dealId = new Types.ObjectId();
      const decisionPayload: DecisionPayload = {
        analysisEventId: new Types.ObjectId(),
        dealId,
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
      const decisionId = await eventsRepository.writeDecisionEvent({
        traceId: 'seed',
        actorType: 'agent:deal_scoring',
        userId,
        payload: decisionPayload,
      });

      const out = await handleTurn({
        userInput: 'save this',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
        toolPayload: { decisionId, source: 'chat' },
      });

      expect(out.agentStubbed).toBe(false);
      expect(out.routing.target).toBe('tool:save_to_watchlist');
      expect(out.routing.routedTo).toBe('tool_only');
      expect(out.responseText).toMatch(/saved/i);

      // The WatchlistEvent should appear in the orchestrator's relatedEventIds
      expect(out.events.related.length).toBeGreaterThan(0);

      // Verify substrate
      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const watchlist = events.find((e) => e.eventType === 'watchlist');
      expect(watchlist).toBeDefined();
    });

    it('throws when tool-only route has no toolPayload', async () => {
      setAnthropicAdapter(classifierStub('save_action', 92));
      const userId = new Types.ObjectId();
      await expect(
        handleTurn({
          userInput: 'save this',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
          // toolPayload intentionally missing
        })
      ).rejects.toThrow(/requires toolPayload/);
    });
  });

  // ===== Low-confidence fallback =====

  describe('low-confidence fallback to agent:qa', () => {
    it('falls back to agent:qa when confidence < 70', async () => {
      setAnthropicAdapter(classifierStub('analyze_property', 50));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'something ambiguous',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.routing.target).toBe('agent:qa');
      expect(out.routing.fallbackReason).toBe('low_confidence');
      expect(out.routing.routedTo).toBe('agent:qa');
    });

    it('classifier_fallback → agent:qa', async () => {
      setAnthropicAdapter(classifierStub('fallback', 30));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'gobbledygook',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.routing.target).toBe('agent:qa');
      expect(out.routing.fallbackReason).toBe('classifier_fallback');
    });
  });

  // ===== traceId correlation =====

  describe('traceId joins all turn writes', () => {
    it('CostEvent (classifier) + ConversationEvent share the orchestrator-generated traceId', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'hi',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      expect(events.find((e) => e.eventType === 'conversation')).toBeDefined();

      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: out.traceId })
        .toArray();
      expect(costDocs).toHaveLength(1);
    });

    it('orchestrator generates a fresh UUID traceId per turn', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const a = await handleTurn({
        userInput: 'q1',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      const b = await handleTurn({
        userInput: 'q2',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 2,
      });
      expect(a.traceId).not.toBe(b.traceId);
      // Both should be valid UUIDs
      expect(a.traceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  // ===== Cost tracking =====

  describe('cost tracking', () => {
    it('totalCostCents reflects the classifier call cost', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 85));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'hi',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.totalCostCents).toBeGreaterThan(0);
      expect(out.totalCostCents).toBeLessThan(1); // Haiku — fractions of a cent
    });
  });
});
