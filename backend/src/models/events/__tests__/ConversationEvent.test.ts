/**
 * W1-S2 part 6 acceptance test — ConversationEvent payload schema + discriminator.
 *
 * The highest-volume event type (one per chat turn). Tests cover:
 *   - Multi-turn session reconstruction (sessionId + turnNumber)
 *   - All 11 chat intents (analyze_property, share_profile, qa_*, etc.)
 *   - All 5 routedTo targets
 *   - All 3 inputMethod values (text / voice / paste)
 *   - Nested object validation (userInput, intentClassification,
 *     agentResponse, tokenUsage)
 *   - Cancelled turn handling
 *   - Cost rollup query pattern (per-user cost aggregation)
 *
 * Uses mongodb-memory-server (per project policy).
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  ConversationEventModel,
  ConversationPayloadSchema,
  ConversationPayload,
} from '../ConversationEvent';
import { APPEND_ONLY_ERROR } from '../BaseEvent';

const SETUP_TIMEOUT_MS = 90_000;

const TEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Representative turn 1 — user pastes a property address; orchestrator
 * routes to deal_scoring agent; analysis runs; deal score card emitted.
 */
function validTurn(overrides: Partial<ConversationPayload> = {}): ConversationPayload {
  return {
    sessionId: TEST_SESSION_ID,
    turnNumber: 1,
    userInput: {
      text: '1837 Walnut Way, Anna TX — listed at $425K',
      inputMethod: 'text',
    },
    intentClassification: {
      intent: 'analyze_property',
      confidence: 94,
      classifierModel: 'claude-haiku-4-5',
    },
    routedTo: 'agent:deal_scoring',
    toolCalls: [
      {
        toolName: 'enrich_property',
        inputHash: 'sha256:a1b2c3d4',
        success: true,
        durationMs: 850,
      },
      {
        toolName: 'compute_analysis',
        inputHash: 'sha256:e5f6g7h8',
        success: true,
        durationMs: 42,
      },
      {
        toolName: 'score_deal',
        inputHash: 'sha256:i9j0k1l2',
        success: true,
        durationMs: 18,
      },
    ],
    agentResponse: {
      text: 'Pulled data on 1837 Walnut Way. Here\'s the analysis...',
      structuredOutputs: ['PropertyPreview', 'DealScoreCard'],
      relatedEventIds: [new Types.ObjectId(), new Types.ObjectId()],
    },
    tokenUsage: {
      inputTokens: 5200,
      outputTokens: 520,
      cachedTokens: 4500,
      estimatedCostCents: 1, // ~$0.011
    },
    modelUsed: 'claude-sonnet-4-6 / deal-scoring v3',
    totalDurationMs: 1820,
    ...overrides,
  };
}

describe('ConversationEvent (W1-S2 part 6)', () => {
  let mongoServer: MongoMemoryServer;

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
  });

  // ===== Zod payload schema =====

  describe('ConversationPayloadSchema (runtime validation)', () => {
    it('parses a representative valid turn', () => {
      expect(() => ConversationPayloadSchema.parse(validTurn())).not.toThrow();
    });

    describe('sessionId (UUID required)', () => {
      it('accepts valid UUID v4', () => {
        const payload = { ...validTurn(), sessionId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' };
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects non-UUID string', () => {
        const payload = { ...validTurn(), sessionId: 'session-1234' };
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects empty string', () => {
        const payload = { ...validTurn(), sessionId: '' };
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('turnNumber (positive integer)', () => {
      it('accepts 1 (first turn)', () => {
        expect(() => ConversationPayloadSchema.parse(validTurn({ turnNumber: 1 }))).not.toThrow();
      });

      it('rejects 0', () => {
        expect(() => ConversationPayloadSchema.parse(validTurn({ turnNumber: 0 }))).toThrow();
      });

      it('rejects negative', () => {
        expect(() => ConversationPayloadSchema.parse(validTurn({ turnNumber: -1 }))).toThrow();
      });

      it('rejects non-integer', () => {
        expect(() => ConversationPayloadSchema.parse(validTurn({ turnNumber: 1.5 }))).toThrow();
      });
    });

    describe('userInput', () => {
      it('accepts empty text (cancelled mid-input)', () => {
        const payload = validTurn({ userInput: { text: '', inputMethod: 'text' } });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts "[REDACTED]" text (post-deletion redaction)', () => {
        const payload = validTurn({
          userInput: { text: '[REDACTED]', inputMethod: 'text', redactedPII: true },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts all 3 inputMethod values', () => {
        for (const inputMethod of ['text', 'voice', 'paste'] as const) {
          const payload = validTurn({ userInput: { text: 'sample', inputMethod } });
          expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid inputMethod', () => {
        const payload = {
          ...validTurn(),
          userInput: { text: 'foo', inputMethod: 'keyboard' as unknown as 'text' },
        };
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('intentClassification', () => {
      it('accepts all 11 valid intents', () => {
        const intents = [
          'analyze_property',
          'share_profile',
          'qa_metric',
          'qa_decision',
          'qa_general',
          'override_assumption',
          'request_audit_trail',
          'request_export',
          'request_critique',
          'save_action',
          'fallback',
        ] as const;
        for (const intent of intents) {
          const payload = validTurn({
            intentClassification: { intent, confidence: 85, classifierModel: 'claude-haiku-4-5' },
          });
          expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid intent', () => {
        const payload = validTurn({
          intentClassification: {
            intent: 'analyze_market' as unknown as 'analyze_property',
            confidence: 85,
            classifierModel: 'claude-haiku-4-5',
          },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects confidence out of 0-100', () => {
        const payload = validTurn({
          intentClassification: { intent: 'analyze_property', confidence: 101, classifierModel: 'm' },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects empty classifierModel', () => {
        const payload = validTurn({
          intentClassification: { intent: 'analyze_property', confidence: 85, classifierModel: '' },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('routedTo enum', () => {
      it('accepts all 5 valid routes', () => {
        const routes = [
          'agent:deal_scoring',
          'agent:qa',
          'agent:adversarial_critic',
          'tool_only',
          'fallback',
        ] as const;
        for (const routedTo of routes) {
          const payload = validTurn({ routedTo });
          expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
        }
      });

      it('rejects invalid route', () => {
        const payload = validTurn({ routedTo: 'agent:market_data' as unknown as 'agent:qa' });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('toolCalls', () => {
      it('accepts empty array (tool-less turn — e.g., simple Q&A)', () => {
        expect(() => ConversationPayloadSchema.parse(validTurn({ toolCalls: [] }))).not.toThrow();
      });

      it('rejects toolCalls entry missing inputHash', () => {
        const payload = validTurn({
          toolCalls: [
            { toolName: 'foo', success: true, durationMs: 10 } as unknown as ConversationPayload['toolCalls'][0],
          ],
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects negative durationMs', () => {
        const payload = validTurn({
          toolCalls: [
            { toolName: 'foo', inputHash: 'sha256:x', success: true, durationMs: -1 },
          ],
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('agentResponse', () => {
      it('accepts empty text + empty structuredOutputs (cancelled mid-stream)', () => {
        const payload = validTurn({
          agentResponse: { text: '', structuredOutputs: [], relatedEventIds: [] },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts multiple structured outputs', () => {
        const payload = validTurn({
          agentResponse: {
            text: 'response',
            structuredOutputs: ['DealScoreCard', 'AssumptionsPanel', 'OverrideSlider'],
            relatedEventIds: [],
          },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });
    });

    describe('tokenUsage', () => {
      it('requires integer tokens', () => {
        const payload = validTurn({
          tokenUsage: { inputTokens: 100.5, outputTokens: 10, cachedTokens: 0, estimatedCostCents: 0 },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('rejects negative tokens', () => {
        const payload = validTurn({
          tokenUsage: { inputTokens: -1, outputTokens: 10, cachedTokens: 0, estimatedCostCents: 0 },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });

      it('accepts all zeros (cached/free path)', () => {
        const payload = validTurn({
          tokenUsage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, estimatedCostCents: 0 },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('rejects negative cost', () => {
        const payload = validTurn({
          tokenUsage: { inputTokens: 100, outputTokens: 10, cachedTokens: 0, estimatedCostCents: -1 },
        });
        expect(() => ConversationPayloadSchema.parse(payload)).toThrow();
      });
    });

    describe('cancelled flag (optional)', () => {
      it('allows missing (normal completed turn)', () => {
        const payload = validTurn() as unknown as Record<string, unknown>;
        delete payload.cancelled;
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });

      it('accepts true (user cancelled mid-stream)', () => {
        const payload = validTurn({ cancelled: true });
        expect(() => ConversationPayloadSchema.parse(payload)).not.toThrow();
      });
    });
  });

  // ===== Mongoose discriminator =====

  describe('ConversationEventModel (discriminator)', () => {
    const validEnvelope = () => ({
      traceId: 'test-trace-conversation-1',
      eventVersion: 1,
      actorType: 'agent:deal_scoring' as const,
      userId: new Types.ObjectId(),
      payload: validTurn(),
    });

    it('creates a ConversationEvent with valid payload', async () => {
      const event = await ConversationEventModel.create(validEnvelope());
      expect(event.get('eventType')).toBe('conversation');
      expect(event.get('payload').sessionId).toBe(TEST_SESSION_ID);
      expect(event.get('payload').turnNumber).toBe(1);
    });

    it('stores ConversationEvent in the unified events collection', async () => {
      await ConversationEventModel.create(validEnvelope());
      expect(ConversationEventModel.collection.name).toBe('events');
    });

    it('inherits append-only enforcement on updateOne', async () => {
      const event = await ConversationEventModel.create(validEnvelope());
      await expect(
        ConversationEventModel.updateOne({ _id: event._id }, { 'payload.turnNumber': 2 })
      ).rejects.toThrow(APPEND_ONLY_ERROR);
    });

    it('preserves payload structure through round-trip (nested objects)', async () => {
      await ConversationEventModel.create(validEnvelope());
      const found = await ConversationEventModel.findOne({});
      const payload = found?.get('payload');

      expect(payload.sessionId).toBe(TEST_SESSION_ID);
      expect(payload.intentClassification.intent).toBe('analyze_property');
      expect(payload.routedTo).toBe('agent:deal_scoring');
      expect(payload.toolCalls).toHaveLength(3);
      expect(payload.toolCalls[0].toolName).toBe('enrich_property');
      expect(payload.agentResponse.structuredOutputs).toContain('DealScoreCard');
      expect(payload.tokenUsage.cachedTokens).toBe(4500);
    });

    it('supports multi-turn session reconstruction (sessionId + turnNumber ordering)', async () => {
      const userId = new Types.ObjectId();

      // Simulate 3 turns in the same session
      await ConversationEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'turn-1',
        payload: validTurn({ turnNumber: 1 }),
      });

      await ConversationEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'turn-2',
        payload: validTurn({
          turnNumber: 2,
          userInput: { text: 'why this score?', inputMethod: 'text' },
          intentClassification: {
            intent: 'qa_decision',
            confidence: 92,
            classifierModel: 'claude-haiku-4-5',
          },
          routedTo: 'agent:qa',
          toolCalls: [],
        }),
      });

      await ConversationEventModel.create({
        ...validEnvelope(),
        userId,
        traceId: 'turn-3',
        payload: validTurn({
          turnNumber: 3,
          userInput: { text: 'change vacancy to 8%', inputMethod: 'text' },
          intentClassification: {
            intent: 'override_assumption',
            confidence: 96,
            classifierModel: 'claude-haiku-4-5',
          },
          routedTo: 'tool_only',
        }),
      });

      // Reconstruct in order
      const turns = await ConversationEventModel.find({
        'payload.sessionId': TEST_SESSION_ID,
      }).sort({ 'payload.turnNumber': 1 });

      expect(turns).toHaveLength(3);
      expect(turns[0].get('payload').turnNumber).toBe(1);
      expect(turns[0].get('payload').intentClassification.intent).toBe('analyze_property');
      expect(turns[1].get('payload').intentClassification.intent).toBe('qa_decision');
      expect(turns[2].get('payload').intentClassification.intent).toBe('override_assumption');
    });

    it('demonstrates the per-user cost rollup query pattern', async () => {
      // Simulate 10 turns by one user with varied per-turn cost
      const userId = new Types.ObjectId();
      const costs = [1, 1, 2, 1, 1, 8, 1, 1, 1, 1]; // total 18 cents

      for (let i = 0; i < costs.length; i++) {
        await ConversationEventModel.create({
          ...validEnvelope(),
          userId,
          traceId: `cost-rollup-${i}`,
          payload: validTurn({
            turnNumber: i + 1,
            tokenUsage: {
              inputTokens: 1000,
              outputTokens: 100,
              cachedTokens: 800,
              estimatedCostCents: costs[i],
            },
          }),
        });
      }

      // Aggregate: sum cost across all this user's turns
      const result = await ConversationEventModel.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalCents: { $sum: '$payload.tokenUsage.estimatedCostCents' } } },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].totalCents).toBe(18);
      // This is per-user cost observability per cost doc §8.1
    });
  });
});
