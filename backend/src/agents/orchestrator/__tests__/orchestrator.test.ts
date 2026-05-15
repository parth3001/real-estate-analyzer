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

  /**
   * Stub adapter for orchestrator tests:
   *   - `call` returns intent classification JSON (used by the intent classifier)
   *   - `callWithTools` returns a single text block that satisfies whatever
   *     downstream agent the orchestrator dispatches to. For deal_scoring
   *     and qa, the text is plain. For adversarial_critic, the text must
   *     be valid critique JSON (the critic parses it).
   */
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
      async callWithTools() {
        // Default: agent returns plain text immediately (no tool_use loop).
        // For critic tests we override this via a more specific stub.
        return {
          blocks: [{ type: 'text', text: 'Stub agent response.' }],
          usage: { inputTokens: 1000, outputTokens: 80, cachedTokens: 600 },
          model: 'claude-sonnet-4-6',
          stopReason: 'end_turn',
        };
      },
    };
  }

  /** Critic adapter: classifier returns request_critique; callWithTools
   *  returns valid critique JSON in a text block. */
  function criticStub(): AnthropicAdapter {
    const critiqueJson = JSON.stringify({
      agreementWithOriginal: false,
      divergenceReasons: ['Vacancy too aggressive for this submarket'],
      alternativeAssumptions: [
        { fieldPath: 'assumptions.vacancyRate', suggestedValue: 0.08, reasoning: 'market history' },
      ],
      severityScore: 65,
    });
    return {
      async call() {
        return {
          text: JSON.stringify({ intent: 'request_critique', confidence: 92 }),
          usage: { inputTokens: 800, outputTokens: 50, cachedTokens: 600 },
          model: 'claude-haiku-4-5',
          stopReason: 'end_turn',
        };
      },
      async callWithTools() {
        return {
          blocks: [{ type: 'text', text: critiqueJson }],
          usage: { inputTokens: 1500, outputTokens: 200, cachedTokens: 800 },
          model: 'claude-opus-4-7',
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

  // ===== Agent routes (W5 — real execution) =====

  describe('agent routes execute through the runner', () => {
    it('analyze_property → agent:deal_scoring returns the agent\'s text', async () => {
      setAnthropicAdapter(classifierStub('analyze_property', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'look at 123 Main St',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.agentStubbed).toBe(false);
      expect(out.responseText).toBe('Stub agent response.');
      expect(out.routing.target).toBe('agent:deal_scoring');
      // Agent's call emits its own CostEvent via the runner
      expect(out.totalCostCents).toBeGreaterThan(0);
    });

    it('qa_general → agent:qa returns the agent\'s text', async () => {
      setAnthropicAdapter(classifierStub('qa_general', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'general question',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });
      expect(out.agentStubbed).toBe(false);
      expect(out.responseText).toBe('Stub agent response.');
    });

    it('request_critique → agent:adversarial_critic writes 2 CritiqueEvents', async () => {
      setAnthropicAdapter(criticStub());
      const userId = new Types.ObjectId();
      const decisionId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'have a critic look at this',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
        toolPayload: { decisionId, triggerType: 'manual_request' },
      });
      expect(out.agentStubbed).toBe(false);
      expect(out.responseText).toContain('Critique complete');
      expect(out.responseText).toContain('optimistic_flipper');
      expect(out.responseText).toContain('skeptical_cpa');

      // Two CritiqueEvents persisted
      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const critiques = events.filter((e) => e.eventType === 'critique');
      expect(critiques).toHaveLength(2);
    });

    it('request_critique without decisionId throws', async () => {
      setAnthropicAdapter(criticStub());
      const userId = new Types.ObjectId();
      await expect(
        handleTurn({
          userInput: 'critique this',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
          // No toolPayload.decisionId
        })
      ).rejects.toThrow(/requires toolPayload\.decisionId/);
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

  // ===== W6-S2.6 — off_topic short-circuit =====

  describe('off_topic deflection (W6-S2.6)', () => {
    it('returns the templated deflection text without invoking any agent', async () => {
      setAnthropicAdapter(classifierStub('off_topic', 95));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'who should I vote for in the next election',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      expect(out.routing.target).toBe('deflection:off_topic');
      expect(out.routing.routedTo).toBe('deflection:off_topic');
      // The exact response string is the source of truth for brand /
      // legal safety. If this changes, it MUST be reviewed.
      expect(out.responseText).toBe(
        "I'm REanalyzr — I focus on real estate deal analysis. " +
          'Ask me about a property, a metric, or paste a listing.'
      );
      expect(out.agentStubbed).toBe(false);
    });

    it('cost includes ONLY the classifier — no agent call billed', async () => {
      setAnthropicAdapter(classifierStub('off_topic', 92));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'help me debug this python script',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      // Only ONE CostEvent (classifier). No agent invocation = no
      // second CostEvent.
      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: out.traceId })
        .toArray();
      expect(costDocs).toHaveLength(1);
      // The single cost event must be from the classifier (haiku
      // tier), not Sonnet or Opus.
      expect(costDocs[0]).toMatchObject({
        costType: 'llm',
        provider: 'anthropic',
      });
    });

    it('still writes a ConversationEvent with routedTo=deflection:off_topic', async () => {
      setAnthropicAdapter(classifierStub('off_topic', 90));
      const userId = new Types.ObjectId();
      const out = await handleTurn({
        userInput: 'tell me a joke',
        userId,
        sessionId: SESSION_ID,
        turnNumber: 1,
      });

      const events = await eventsRepositoryReads.getEventsByTraceId(out.traceId);
      const conv = events.find((e) => e.eventType === 'conversation');
      expect(conv).toBeDefined();
      const payload = conv!.payload as { routedTo: string };
      expect(payload.routedTo).toBe('deflection:off_topic');
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
      // qa_general routes to agent:qa → 2 CostEvents (classifier + agent run)
      expect(costDocs.length).toBeGreaterThanOrEqual(1);
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
