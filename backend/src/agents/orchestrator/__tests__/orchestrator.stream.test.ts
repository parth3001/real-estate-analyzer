/**
 * orchestrator.streamTurn — W6-S3 acceptance test.
 *
 * Covers the streaming variant of handleTurn:
 *   - Yields `routing` once, with the resolved target
 *   - Yields `text_delta` events as the agent produces tokens
 *   - Yields `done` at the end with traceId + conversationEventId
 *   - Off-topic deflection: emits the locked text in one delta + done
 *   - Cancellation: AbortSignal fires → yields `cancelled` with partial state
 *   - Still writes a ConversationEvent on cancellation (substrate accounting)
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  setAnthropicAdapter,
  resetAnthropicAdapter,
  makeTestAdapter,
  makeScriptedStreamHandle,
  type AnthropicAdapter,
} from '../../llm/anthropicAdapter';
import type { ChatIntent } from '../intentClassifier';
import { streamTurn } from '../orchestrator';
import type { OrchestratorStreamEvent } from '../streamEvents';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';

const SETUP_TIMEOUT_MS = 90_000;
const SESSION_ID = '11111111-2222-4333-8444-555555555555';

describe('orchestrator.streamTurn (W6-S3)', () => {
  let mongoServer: MongoMemoryServer;

  /**
   * Adapter for streaming tests:
   *   - `call` returns the classifier JSON
   *   - `streamWithTools` returns a scripted token stream
   *
   * Notably `callWithTools` is NOT stubbed for routes that should go
   * through the streaming path — if it gets invoked, that's a regression
   * (the orchestrator picked the wrong code path).
   */
  function streamingStub(opts: {
    intent: ChatIntent;
    confidence: number;
    /** Scripted token deltas for the agent stream. */
    deltas: string[];
    /** Optional per-delta delay so cancellation tests have time to abort. */
    perDeltaDelayMs?: number;
  }): Partial<AnthropicAdapter> {
    return {
      async call() {
        return {
          text: JSON.stringify({
            intent: opts.intent,
            confidence: opts.confidence,
          }),
          usage: { inputTokens: 800, outputTokens: 50, cachedTokens: 600 },
          model: 'claude-haiku-4-5',
          stopReason: 'end_turn',
        };
      },
      streamWithTools(_input, signal) {
        return makeScriptedStreamHandle({
          deltas: opts.deltas,
          blocks: [
            {
              type: 'text',
              text: opts.deltas.join(''),
            },
          ],
          perDeltaDelayMs: opts.perDeltaDelayMs,
          signal,
        });
      },
    };
  }

  async function collect(
    gen: AsyncGenerator<OrchestratorStreamEvent, void, void>
  ): Promise<OrchestratorStreamEvent[]> {
    const out: OrchestratorStreamEvent[] = [];
    for await (const ev of gen) out.push(ev);
    return out;
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

  // ===== Happy paths =====

  describe('agent:qa happy path', () => {
    it('yields routing, then text_delta(s), then done', async () => {
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_metric',
          confidence: 90,
          deltas: ['Cap rate', ' is NOI', ' divided by price.'],
        })
      );

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'what is cap rate?',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );

      // Routing first
      expect(events[0]).toMatchObject({
        type: 'routing',
        target: 'agent:qa',
        routedTo: 'agent:qa',
        classifierIntent: 'qa_metric',
      });

      // Text deltas in order
      const deltas = events.filter((e) => e.type === 'text_delta');
      expect(deltas.map((d) => (d as { text: string }).text)).toEqual([
        'Cap rate',
        ' is NOI',
        ' divided by price.',
      ]);

      // Terminal event = done (NOT cancelled, NOT error)
      const last = events[events.length - 1];
      expect(last.type).toBe('done');
      if (last.type === 'done') {
        expect(last.traceId).toMatch(/^[0-9a-f-]+$/);
        expect(last.conversationEventId).toMatch(/^[0-9a-f]{24}$/);
        expect(last.agentStubbed).toBe(false);
        expect(last.totalCostCents).toBeGreaterThan(0);
      }
    });

    it('writes a ConversationEvent capturing the streamed response text', async () => {
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_general',
          confidence: 85,
          deltas: ['Hello', ' world'],
        })
      );

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'hi',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );
      const done = events[events.length - 1];
      expect(done.type).toBe('done');
      if (done.type !== 'done') return;

      const persisted = await eventsRepositoryReads.getEventsByTraceId(done.traceId);
      const conv = persisted.find((e) => e.eventType === 'conversation');
      expect(conv).toBeDefined();
      const payload = conv!.payload as {
        agentResponse: { text: string };
        routedTo: string;
      };
      expect(payload.agentResponse.text).toBe('Hello world');
      expect(payload.routedTo).toBe('agent:qa');
    });
  });

  // ===== Off-topic =====

  describe('off_topic deflection', () => {
    it('emits the locked deflection text in a single delta — no agent stream', async () => {
      // Only `call` (classifier) is stubbed. streamWithTools is NOT —
      // if the orchestrator accidentally invokes the agent for off_topic
      // it'll throw the makeTestAdapter "not implemented" error.
      setAnthropicAdapter({
        async call() {
          return {
            text: JSON.stringify({ intent: 'off_topic', confidence: 95 }),
            usage: { inputTokens: 100, outputTokens: 10, cachedTokens: 0 },
            model: 'claude-haiku-4-5',
            stopReason: 'end_turn',
          };
        },
      });

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'who should I vote for?',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );

      // Should be: routing → text_delta → suggested_followups → done
      // (suggested_followups is the Phase 3+4 Day 3 chip stream event;
      // emitted on every successful path before `done`.)
      expect(events.map((e) => e.type)).toEqual([
        'routing',
        'text_delta',
        'structured_output',
        'done',
      ]);
      const delta = events[1] as { type: 'text_delta'; text: string };
      expect(delta.text).toContain('real estate');
      expect(delta.text).toContain('property, a metric, or paste a listing');
    });
  });

  // ===== Cancellation =====

  describe('cancellation via AbortSignal', () => {
    it('mid-stream abort yields cancelled with partial text + writes ConversationEvent', async () => {
      // Use per-delta delay so we can fire abort between deltas.
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_general',
          confidence: 90,
          deltas: ['part1 ', 'part2 ', 'part3'],
          perDeltaDelayMs: 50,
        })
      );

      const controller = new AbortController();
      const userId = new Types.ObjectId();
      const gen = streamTurn(
        {
          userInput: 'tell me about cash flow',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        },
        { signal: controller.signal }
      );

      // Schedule abort after a brief delay so we receive some deltas first.
      setTimeout(() => controller.abort(), 75);

      const events: OrchestratorStreamEvent[] = [];
      for await (const ev of gen) events.push(ev);

      const last = events[events.length - 1];
      expect(last.type).toBe('cancelled');
      if (last.type === 'cancelled') {
        // We got SOMETHING through before the abort fired
        expect(last.partialText.length).toBeGreaterThan(0);
        expect(last.traceId).toMatch(/^[0-9a-f-]+$/);
        expect(last.conversationEventId).toMatch(/^[0-9a-f]{24}$/);
      }
    });

    it('pre-flight abort (signal already aborted) yields cancelled before routing', async () => {
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_general',
          confidence: 90,
          deltas: ['ignored'],
        })
      );

      const controller = new AbortController();
      controller.abort(); // already aborted

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn(
          {
            userInput: 'this never runs',
            userId,
            sessionId: SESSION_ID,
            turnNumber: 1,
          },
          { signal: controller.signal }
        )
      );

      const last = events[events.length - 1];
      expect(last.type).toBe('cancelled');
    });
  });

  // ===== Suggested follow-up chips (Phase 3+4, Day 3) =====

  describe('suggested_followups stream event', () => {
    it('emits a chips structured_output right before `done` on the qa happy path', async () => {
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_general',
          confidence: 90,
          deltas: ['Hi.'],
        })
      );

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'hi',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );

      // The event immediately before `done` should be the chips event.
      const done = events[events.length - 1];
      const beforeDone = events[events.length - 2];
      expect(done.type).toBe('done');
      expect(beforeDone.type).toBe('structured_output');
      if (beforeDone.type === 'structured_output') {
        expect(beforeDone.kind).toBe('suggested_followups');
        const data = beforeDone.data as { chips?: unknown };
        expect(Array.isArray(data.chips)).toBe(true);
        const chips = data.chips as string[];
        expect(chips.length).toBeGreaterThanOrEqual(3);
        expect(chips.length).toBeLessThanOrEqual(4);
        // Sanity — qa chips should reference real-estate / property actions.
        const joined = chips.join(' ').toLowerCase();
        expect(joined).toMatch(/property|portfolio|deal|sensitivity/);
      }
    });

    it('emits deflection chips on off_topic route', async () => {
      setAnthropicAdapter({
        async call() {
          return {
            text: JSON.stringify({ intent: 'off_topic', confidence: 95 }),
            usage: { inputTokens: 100, outputTokens: 10, cachedTokens: 0 },
            model: 'claude-haiku-4-5',
            stopReason: 'end_turn',
          };
        },
      });

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'who should I vote for?',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );

      const chipsEvent = events.find(
        (e) => e.type === 'structured_output' && e.kind === 'suggested_followups'
      );
      expect(chipsEvent).toBeDefined();
      const chips = (chipsEvent as unknown as { data: { chips: string[] } })
        .data.chips;
      // Off-topic chips should redirect users back to a productive
      // on-topic next step (per the followupChips on-topic-cue test).
      const joined = chips.join(' ').toLowerCase();
      expect(joined).toMatch(/property|rental|deal|underwriting|platform/);
    });

    it('does NOT emit chips when the turn is cancelled mid-stream', async () => {
      setAnthropicAdapter(
        streamingStub({
          intent: 'qa_general',
          confidence: 90,
          deltas: ['part1 ', 'part2 ', 'part3'],
          perDeltaDelayMs: 50,
        })
      );

      const controller = new AbortController();
      const userId = new Types.ObjectId();
      const gen = streamTurn(
        {
          userInput: 'tell me',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        },
        { signal: controller.signal }
      );
      setTimeout(() => controller.abort(), 75);

      const events: OrchestratorStreamEvent[] = [];
      for await (const ev of gen) events.push(ev);

      const last = events[events.length - 1];
      expect(last.type).toBe('cancelled');
      // No chips event should appear — surfacing a "what next" nudge
      // after a user explicitly stopped feels presumptuous.
      const chipsEvent = events.find(
        (e) => e.type === 'structured_output' && e.kind === 'suggested_followups'
      );
      expect(chipsEvent).toBeUndefined();
    });
  });

  // ===== Error path =====

  describe('error path', () => {
    it('emits a generic error event when classifier throws (no internal detail leaked)', async () => {
      // Adapter throws on `call` — classifier failure.
      setAnthropicAdapter(
        makeTestAdapter({
          async call() {
            throw new Error('Sensitive: DB at mongo://prod-host refused');
          },
        })
      );

      const userId = new Types.ObjectId();
      const events = await collect(
        streamTurn({
          userInput: 'hi',
          userId,
          sessionId: SESSION_ID,
          turnNumber: 1,
        })
      );

      const last = events[events.length - 1];
      expect(last.type).toBe('error');
      if (last.type === 'error') {
        expect(last.message).toBe('Chat turn failed. Please try again.');
        // Internal detail must not leak
        expect(JSON.stringify(last)).not.toContain('DB at mongo');
      }
    });
  });
});
