/**
 * W5 acceptance test — shared agent runner.
 *
 * Verifies the tool-use loop:
 *   1. Single-iteration (text-only response, no tools)
 *   2. Multi-iteration (model emits tool_use, runner executes, loops)
 *   3. CostEvent emitted PER API call (so 3 iterations = 3 CostEvents)
 *   4. Tool call traces captured for ConversationEvent
 *   5. maxTurns safety cap
 *   6. Tool execution failures propagated as tool_result errors
 *   7. Tools not in the allowed set rejected
 */

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runAgent } from '../agentRunner';
import {
  setAnthropicAdapter,
  resetAnthropicAdapter,
  type AnthropicAdapter,
  type AnthropicMultiTurnOutput,
} from '../../llm/anthropicAdapter';
import { recallUserContext } from '../../tools/recall_user_context';
import { eventsRepository } from '../../../repositories/EventsRepository';
import { eventsRepositoryReads } from '../../../repositories/EventsRepositoryReads';
import type { ToolContext, Tool } from '../../tools/types';

const SETUP_TIMEOUT_MS = 90_000;

describe('agentRunner (W5)', () => {
  let mongoServer: MongoMemoryServer;

  function ctxFor(traceId: string): ToolContext {
    return {
      traceId,
      userId: new Types.ObjectId(),
      eventsRepo: eventsRepository,
      eventsReads: eventsRepositoryReads,
      tools: {},
    };
  }

  /** Returns an adapter whose callWithTools cycles through the given
   *  scripted responses one per call. */
  function scriptedAdapter(
    responses: AnthropicMultiTurnOutput[]
  ): AnthropicAdapter {
    let i = 0;
    return {
      async call() {
        throw new Error('not used in runner tests');
      },
      async callWithTools() {
        const r = responses[i] ?? responses[responses.length - 1];
        i++;
        return r;
      },
    };
  }

  function textBlock(text: string): AnthropicMultiTurnOutput {
    return {
      blocks: [{ type: 'text', text }],
      usage: { inputTokens: 1000, outputTokens: 100, cachedTokens: 700 },
      model: 'claude-sonnet-4-6',
      stopReason: 'end_turn',
    };
  }

  function toolUseBlock(
    name: string,
    input: unknown
  ): AnthropicMultiTurnOutput {
    return {
      blocks: [
        {
          type: 'tool_use',
          id: `toolu_${name}_${Math.random().toString(36).slice(2, 9)}`,
          name,
          input,
        },
      ],
      usage: { inputTokens: 1200, outputTokens: 50, cachedTokens: 900 },
      model: 'claude-sonnet-4-6',
      stopReason: 'tool_use',
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

  // ===== Single-iteration (no tools) =====

  describe('single-iteration: text-only response', () => {
    it('returns the text + 1 CostEvent', async () => {
      setAnthropicAdapter(scriptedAdapter([textBlock('Hello there.')]));
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: 'you are an assistant',
          allowedTools: {},
        },
        { userInput: 'hi' },
        ctxFor('trace-single')
      );
      expect(result.text).toBe('Hello there.');
      expect(result.toolCallsExecuted).toHaveLength(0);
      expect(result.iterations).toBe(1);
      expect(result.hadMaxTurnsHit).toBe(false);
      expect(result.costEventIds).toHaveLength(1);

      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-single' })
        .toArray();
      expect(costDocs).toHaveLength(1);
    });
  });

  // ===== Multi-iteration: tool_use loop =====

  describe('multi-iteration: tool_use loop', () => {
    it('executes a single tool call, then returns final text (2 iterations, 2 CostEvents)', async () => {
      const userId = new Types.ObjectId();
      // Seed a profile so recall_user_context returns something
      await eventsRepository.writeProfileEvent({
        traceId: 'seed',
        actorType: 'user',
        userId,
        payload: { investorType: 'retail' },
      });
      setAnthropicAdapter(
        scriptedAdapter([
          toolUseBlock('recall_user_context', { userId: userId.toHexString() }),
          textBlock("Based on your profile, you're retail. Got it."),
        ])
      );
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: 'you are an assistant',
          allowedTools: { recall_user_context: recallUserContext as unknown as Tool<unknown, unknown> },
        },
        { userInput: 'who am i' },
        {
          traceId: 'trace-multi',
          userId,
          eventsRepo: eventsRepository,
          eventsReads: eventsRepositoryReads,
          tools: {},
        }
      );
      expect(result.text).toContain('retail');
      expect(result.iterations).toBe(2);
      expect(result.toolCallsExecuted).toHaveLength(1);
      expect(result.toolCallsExecuted[0].toolName).toBe('recall_user_context');
      expect(result.toolCallsExecuted[0].success).toBe(true);
      expect(result.costEventIds).toHaveLength(2);

      // Each CostEvent has a unique _id, both for trace-multi
      const costDocs = await mongoose.connection.db
        .collection('cost_events')
        .find({ traceId: 'trace-multi' })
        .toArray();
      expect(costDocs).toHaveLength(2);
    });

    it('aggregates token usage across iterations', async () => {
      setAnthropicAdapter(
        scriptedAdapter([
          toolUseBlock('recall_user_context', {
            userId: new Types.ObjectId().toHexString(),
          }),
          textBlock('done'),
        ])
      );
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: 'you are an assistant',
          allowedTools: { recall_user_context: recallUserContext as unknown as Tool<unknown, unknown> },
        },
        { userInput: 'q' },
        ctxFor('trace-agg')
      );
      // toolUseBlock: 1200 input + 50 output + 900 cached
      // textBlock:    1000 input + 100 output + 700 cached
      expect(result.tokenUsage.inputTokens).toBe(2200);
      expect(result.tokenUsage.outputTokens).toBe(150);
      expect(result.tokenUsage.cachedTokens).toBe(1600);
      expect(result.totalCostCents).toBeGreaterThan(0);
    });
  });

  // ===== Safety: maxTurns cap =====

  describe('safety cap', () => {
    it('halts at maxTurns even if model keeps requesting tools', async () => {
      // Always returns a tool_use → infinite loop without the cap
      setAnthropicAdapter({
        async call() {
          throw new Error('unused');
        },
        async callWithTools() {
          return toolUseBlock('recall_user_context', {
            userId: new Types.ObjectId().toHexString(),
          });
        },
      });
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: 'you are an assistant',
          allowedTools: { recall_user_context: recallUserContext as unknown as Tool<unknown, unknown> },
          maxTurns: 3,
        },
        { userInput: 'loop' },
        ctxFor('trace-cap')
      );
      expect(result.iterations).toBe(3);
      expect(result.hadMaxTurnsHit).toBe(true);
    });
  });

  // ===== Tool execution failures =====

  describe('tool failures', () => {
    it('captures tool execution failures in toolCallsExecuted', async () => {
      const failingTool: Tool<unknown, unknown> = {
        ...recallUserContext,
        async execute() {
          throw new Error('Boom inside tool');
        },
      } as unknown as Tool<unknown, unknown>;

      setAnthropicAdapter(
        scriptedAdapter([
          toolUseBlock('failing_tool', {}),
          textBlock("Sorry, that didn't work."),
        ])
      );
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: '',
          allowedTools: { failing_tool: failingTool },
        },
        { userInput: 'try' },
        ctxFor('trace-fail')
      );
      expect(result.toolCallsExecuted).toHaveLength(1);
      expect(result.toolCallsExecuted[0].success).toBe(false);
      // Runner reaches final text because model emits text after tool failure
      expect(result.text).toContain("didn't work");
    });

    it('rejects tools not in the allowed set', async () => {
      setAnthropicAdapter(
        scriptedAdapter([
          toolUseBlock('unauthorized_tool', {}),
          textBlock('cant use that'),
        ])
      );
      const result = await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: '',
          allowedTools: {},
        },
        { userInput: 'try' },
        ctxFor('trace-unauth')
      );
      expect(result.toolCallsExecuted).toHaveLength(1);
      expect(result.toolCallsExecuted[0].success).toBe(false);
      expect(result.toolCallsExecuted[0].toolName).toBe('unauthorized_tool');
    });
  });

  // ===== Context prefix =====

  describe('context injection', () => {
    it('prefixes user message with stringified context when provided', async () => {
      let observedUserMessage: string | undefined;
      setAnthropicAdapter({
        async call() {
          throw new Error('unused');
        },
        async callWithTools(input) {
          observedUserMessage = input.messages[0].content as string;
          return textBlock('ack');
        },
      });
      await runAgent(
        {
          name: 'qa',
          modelTier: 'sonnet',
          systemPrompt: '',
          allowedTools: {},
        },
        { userInput: 'hello', context: { profile: { investorType: 'pro' } } },
        ctxFor('trace-ctx')
      );
      expect(observedUserMessage).toContain('Context');
      expect(observedUserMessage).toContain('"pro"');
      expect(observedUserMessage).toContain('hello');
    });
  });
});
