/**
 * W2-S0 acceptance test — intent classifier (uses stub adapter; no
 * real API calls).
 *
 * Verifies:
 *   1. Adapter wiring + structured response parsing
 *   2. CostEvent always emitted (even when parsing fails)
 *   3. Empty input rejected at the trust boundary
 *   4. All 11 ChatIntent enum values accepted via stub responses
 *   5. Markdown fence stripping
 *   6. Confidence range enforced
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { classifyIntent, type ChatIntent } from '../intentClassifier';
import {
  setAnthropicAdapter,
  resetAnthropicAdapter,
  makeTestAdapter,
  type AnthropicAdapter,
} from '../../llm/anthropicAdapter';

const SETUP_TIMEOUT_MS = 90_000;

describe('classifyIntent (W2-S0)', () => {
  let mongoServer: MongoMemoryServer;

  function makeStub(
    text: string,
    usage = { inputTokens: 800, outputTokens: 80, cachedTokens: 600 }
  ): AnthropicAdapter {
    return makeTestAdapter({
      async call() {
        return {
          text,
          usage,
          model: 'claude-haiku-4-5',
          stopReason: 'end_turn',
        };
      },
    });
  }

  function makeJson(payload: Record<string, unknown>): string {
    return JSON.stringify(payload);
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

  // ===== Happy path =====

  describe('happy path', () => {
    it('classifies analyze_property from address-shaped input', async () => {
      setAnthropicAdapter(
        makeStub(
          makeJson({
            intent: 'analyze_property',
            confidence: 92,
            reasoning: 'Address mentioned',
          })
        )
      );
      const out = await classifyIntent({
        userInput: 'Look at 123 Main St, Austin TX',
        traceId: 'trace-1',
        userId: new Types.ObjectId(),
      });
      expect(out.intent).toBe('analyze_property');
      expect(out.confidence).toBe(92);
      expect(out.modelUsed).toBe('claude-haiku-4-5');
      expect(out.costEventId).toBeInstanceOf(Types.ObjectId);
      expect(out.costCents).toBeGreaterThan(0);
    });

    it('writes a CostEvent to the cost_events collection', async () => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent: 'qa_general', confidence: 80 }))
      );
      await classifyIntent({
        userInput: 'what is cap rate',
        traceId: 'trace-cost',
        userId: new Types.ObjectId(),
      });
      const docs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-cost' })
        .toArray();
      expect(docs).toHaveLength(1);
      expect(docs[0]).toMatchObject({
        costType: 'llm',
        provider: 'anthropic',
      });
    });

    it.each<ChatIntent>([
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
      'off_topic',
    ])('accepts intent: %s', async (intent) => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent, confidence: 80 }))
      );
      const out = await classifyIntent({
        userInput: 'sample',
        traceId: `trace-${intent}`,
        userId: new Types.ObjectId(),
      });
      expect(out.intent).toBe(intent);
    });

    it('returns tokenUsage from the adapter response', async () => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent: 'qa_general', confidence: 80 }), {
          inputTokens: 1234,
          outputTokens: 56,
          cachedTokens: 1000,
        })
      );
      const out = await classifyIntent({
        userInput: 'sample',
        traceId: 'trace-tokens',
        userId: new Types.ObjectId(),
      });
      expect(out.tokenUsage).toEqual({
        inputTokens: 1234,
        outputTokens: 56,
        cachedTokens: 1000,
      });
    });
  });

  // ===== Conversation context threading (W5-S2) =====

  describe('recentTurns context threading', () => {
    it('includes the conversation context block in the prompt when recentTurns provided', async () => {
      let observedPrompt: string | undefined;
      setAnthropicAdapter(
        makeTestAdapter({
          async call(input) {
            observedPrompt = input.userPrompt;
            return {
              text: makeJson({ intent: 'analyze_property', confidence: 90 }),
              usage: { inputTokens: 900, outputTokens: 40, cachedTokens: 700 },
              model: 'claude-haiku-4-5',
              stopReason: 'end_turn',
            };
          },
        })
      );

      await classifyIntent({
        userInput: 'BRRRR',
        traceId: 'trace-ctx',
        userId: new Types.ObjectId(),
        recentTurns: [
          {
            turnNumber: 1,
            userText: 'analyze 123 Main St',
            agentText: 'Quick question — BRRRR or buy-and-hold?',
            intent: 'analyze_property',
            routedTo: 'agent:deal_scoring',
          },
        ],
      });

      expect(observedPrompt).toContain('Conversation so far:');
      expect(observedPrompt).toContain('BRRRR or buy-and-hold?');
      expect(observedPrompt).toContain('Current input: BRRRR');
    });

    it('omits the context block when recentTurns is empty or absent', async () => {
      let observedPrompt: string | undefined;
      setAnthropicAdapter(
        makeTestAdapter({
          async call(input) {
            observedPrompt = input.userPrompt;
            return {
              text: makeJson({ intent: 'qa_general', confidence: 80 }),
              usage: { inputTokens: 800, outputTokens: 40, cachedTokens: 600 },
              model: 'claude-haiku-4-5',
              stopReason: 'end_turn',
            };
          },
        })
      );

      await classifyIntent({
        userInput: 'what is cap rate',
        traceId: 'trace-no-ctx',
        userId: new Types.ObjectId(),
      });

      expect(observedPrompt).toBe('what is cap rate');
      expect(observedPrompt).not.toContain('Conversation so far');
    });
  });

  // ===== Markdown fence handling =====

  describe('LLM output cleaning', () => {
    it('strips ```json fences', async () => {
      const wrapped = '```json\n' + makeJson({ intent: 'qa_metric', confidence: 75 }) + '\n```';
      setAnthropicAdapter(makeStub(wrapped));
      const out = await classifyIntent({
        userInput: 'sample',
        traceId: 'trace',
        userId: new Types.ObjectId(),
      });
      expect(out.intent).toBe('qa_metric');
    });

    it('strips plain ``` fences', async () => {
      const wrapped = '```\n' + makeJson({ intent: 'save_action', confidence: 85 }) + '\n```';
      setAnthropicAdapter(makeStub(wrapped));
      const out = await classifyIntent({
        userInput: 'save this',
        traceId: 'trace',
        userId: new Types.ObjectId(),
      });
      expect(out.intent).toBe('save_action');
    });
  });

  // ===== Trust boundary =====

  describe('error handling', () => {
    it('rejects empty userInput before calling LLM (no CostEvent written)', async () => {
      const calls: number[] = [];
      setAnthropicAdapter(
        makeTestAdapter({
          async call() {
            calls.push(1);
            return {
              text: '',
              usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
              model: '',
              stopReason: null,
            };
          },
        })
      );
      await expect(
        classifyIntent({
          userInput: '',
          traceId: 'trace-empty',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow(/must not be empty/);
      expect(calls).toHaveLength(0);
      const docs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-empty' })
        .toArray();
      expect(docs).toHaveLength(0);
    });

    it('rejects whitespace-only userInput', async () => {
      await expect(
        classifyIntent({
          userInput: '   ',
          traceId: 'trace-ws',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow();
    });

    it('throws on non-JSON LLM output, but CostEvent IS written (we paid)', async () => {
      setAnthropicAdapter(makeStub("I'm sorry, I cannot classify."));
      await expect(
        classifyIntent({
          userInput: 'hi',
          traceId: 'trace-badjson',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow(/no parseable JSON object/);

      const docs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-badjson' })
        .toArray();
      expect(docs).toHaveLength(1);
    });

    it('TOLERATES markdown code fences + trailing commentary (production bug 2026-05-17)', async () => {
      // Real production failure: the model returned
      //   ```json\n{...}\n```\n\nAdditional commentary the model decided to add
      // The OLD regex-based cleaner only stripped trailing fences at the
      // VERY END of the string. Any text after the fence broke
      // JSON.parse with "non-whitespace character after JSON at
      // position N." Caused "Chat turn failed" errors across multiple
      // chips.
      //
      // The new extractor walks brace depth + returns the first
      // balanced {...} regardless of surrounding text. This test pins
      // the behavior.
      const messyOutput =
        '```json\n' +
        '{\n' +
        '  "intent": "analyze_property",\n' +
        '  "confidence": 90,\n' +
        '  "reasoning": "User pasted a Zillow URL"\n' +
        '}\n' +
        '```\n' +
        '\n' +
        'Additional commentary the model decided to add after the JSON.';

      setAnthropicAdapter(makeStub(messyOutput));
      const result = await classifyIntent({
        userInput: 'analyze 123 Main',
        traceId: 'trace-messy-output',
        userId: new Types.ObjectId(),
      });
      expect(result.intent).toBe('analyze_property');
      expect(result.confidence).toBe(90);
    });

    it('throws on unknown intent enum value', async () => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent: 'analyze_market', confidence: 80 }))
      );
      await expect(
        classifyIntent({
          userInput: 'sample',
          traceId: 'trace',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow();
    });

    it('throws when confidence is out of range (>100)', async () => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent: 'qa_general', confidence: 150 }))
      );
      await expect(
        classifyIntent({
          userInput: 'sample',
          traceId: 'trace',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow();
    });

    it('throws when confidence is missing', async () => {
      setAnthropicAdapter(
        makeStub(makeJson({ intent: 'qa_general' }))
      );
      await expect(
        classifyIntent({
          userInput: 'sample',
          traceId: 'trace',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow();
    });

    it('propagates adapter failures (no CostEvent — we did not pay)', async () => {
      setAnthropicAdapter(
        makeTestAdapter({
          async call() {
            throw new Error('Anthropic API down');
          },
        })
      );
      await expect(
        classifyIntent({
          userInput: 'sample',
          traceId: 'trace-down',
          userId: new Types.ObjectId(),
        })
      ).rejects.toThrow(/Anthropic API down/);

      const docs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-down' })
        .toArray();
      expect(docs).toHaveLength(0);
    });
  });
});
