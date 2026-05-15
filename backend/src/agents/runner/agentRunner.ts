/**
 * Agent runner — W5 shared abstraction.
 *
 * Implements the tool-use loop that every wave-1 agent uses:
 *
 *   1. Call Anthropic with { systemPrompt, userMessage, tools=[...allowedTools] }
 *   2. If response contains tool_use blocks → execute each tool via the
 *      ToolContext, append tool_result to messages, GOTO 1
 *   3. If response is text-only → return final response
 *
 * Emits ONE CostEvent per API call (so an agent that loops 3x produces
 * 3 CostEvents; the chat surface aggregates via traceId for per-turn
 * spend dashboards).
 *
 * Tracks every tool call executed for the ConversationEvent's
 * toolCalls array (per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.6).
 *
 * DETERMINISTIC-SCORING NON-NEGOTIABLE
 * ------------------------------------
 *
 * The runner does NOT compute any scores. Agents call score_deal (which
 * wraps the engine); the runner just orchestrates the tool-use loop.
 * Architecture §1.5 is enforced upstream — score_deal is a tool, the
 * agent decides WHEN to call it, but the agent never produces the
 * score itself.
 *
 * SAFETY CAP
 * ----------
 *
 * The loop has a maxTurns cap (default 10) to prevent runaway agents.
 * If the cap is hit, the runner returns whatever text has been emitted
 * with a hadMaxTurnsHit flag — the orchestrator decides whether to
 * surface this as a fallback message or retry.
 */

import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  getAnthropicAdapter,
  type AnthropicMultiTurnInput,
} from '../llm/anthropicAdapter';
import { costEventRepository } from '../../repositories/CostEventRepository';
import { computeAnthropicCostCents } from '../../utils/anthropicPricing';
import type { ModelTier, Tool, ToolContext } from '../tools/types';
import { logger } from '../../utils/logger';

// ===== Agent configuration =====

export interface AgentConfig {
  /** Globally unique agent name. Tagged into substrate actorType. */
  name: 'deal_scoring' | 'qa' | 'adversarial_critic';
  /** Model tier — passed to the adapter for resolution. */
  modelTier: ModelTier;
  /** System prompt. Stable across calls — cacheable above ~1024 tokens. */
  systemPrompt: string;
  /** Tool registry subset the agent is allowed to call. */
  allowedTools: Record<string, Tool<unknown, unknown>>;
  /** Hard cap on tool-use loop iterations. Default 10. */
  maxTurns?: number;
  /** Cap on response tokens per API call. Default 2048. */
  maxTokensPerCall?: number;
}

// ===== Input / output =====

export interface AgentRunInput {
  /** Free-form user input. */
  userInput: string;
  /** Optional structured context the agent should see (profile, recent
   *  decisions, etc.). Stringified into a "system context" prefix. */
  context?: Record<string, unknown>;
}

export interface AgentToolCallTrace {
  toolName: string;
  /** SHA-256 of stringified input. Substrate never stores raw input. */
  inputHash: string;
  success: boolean;
  durationMs: number;
}

export interface AgentRunOutput {
  /** Final response text the agent emitted (last text block). */
  text: string;
  /** Every tool the agent called, in order. */
  toolCallsExecuted: AgentToolCallTrace[];
  /** IDs of substrate events the executed tools emitted. */
  relatedEventIds: Types.ObjectId[];
  /** Sum of all API calls in this run. */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
  /** All CostEvent IDs emitted during this run (one per API call). */
  costEventIds: Types.ObjectId[];
  /** Sum of costCents across this run. */
  totalCostCents: number;
  /** Model identifier the adapter resolved (e.g., 'claude-sonnet-4-6'). */
  modelUsed: string;
  /** True if maxTurns was hit (agent didn't reach final text). */
  hadMaxTurnsHit: boolean;
  /** Number of API call iterations this run made. */
  iterations: number;
}

// ===== Helpers =====

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function extractToolEventIds(
  toolName: string,
  result: Record<string, unknown>
): Types.ObjectId[] {
  // Same shape as orchestrator.extractRelatedEventIds — centralized
  // here too so the agent runner doesn't depend on orchestrator internals.
  const ids: Types.ObjectId[] = [];
  const candidates = [
    'analysisEventId',
    'decisionEventId',
    'overrideEventId',
    'profileEventId',
    'watchlistEventId',
    'auditTrailEventId',
    'newAnalysisEventId',
    'newDecisionEventId',
    'costEventId',
  ];
  for (const key of candidates) {
    const v = result[key];
    if (v instanceof Types.ObjectId) ids.push(v);
  }
  return ids;
  // Note: toolName parameter reserved for future per-tool extraction logic
  // (e.g., critique events emit different ID shapes).
  void toolName;
}

/**
 * Convert a Tool's Zod inputSchema to JSON schema for Anthropic
 * tool_use. The library handles enums, optionals, nested objects.
 */
function toolToDefinition(name: string, tool: Tool<unknown, unknown>): {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
} {
  const jsonSchema = zodToJsonSchema(tool.inputSchema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  }) as Record<string, unknown>;
  // Anthropic expects an object schema at the top level. Strip $schema
  // and definitions for cleanliness; keep type, properties, required.
  delete jsonSchema.$schema;
  return {
    name,
    description: tool.description,
    input_schema: jsonSchema,
  };
}

// ===== Runner =====

/**
 * Run an agent's full tool-use loop. Returns when the model emits
 * a text-only response (no tool_use), or when maxTurns is hit.
 */
export async function runAgent(
  config: AgentConfig,
  input: AgentRunInput,
  ctx: ToolContext
): Promise<AgentRunOutput> {
  const adapter = getAnthropicAdapter();
  const maxTurns = config.maxTurns ?? 10;
  const maxTokensPerCall = config.maxTokensPerCall ?? 2048;

  // Build tool definitions from allowed tools
  const toolDefinitions = Object.entries(config.allowedTools).map(([name, t]) =>
    toolToDefinition(name, t)
  );

  // Initial user message — context (if any) prefixes the actual input
  const initialUserMessage = input.context
    ? `Context:\n${JSON.stringify(input.context, null, 2)}\n\nUser: ${input.userInput}`
    : input.userInput;

  const messages: AnthropicMultiTurnInput['messages'] = [
    { role: 'user', content: initialUserMessage },
  ];

  // Accumulators
  let finalText = '';
  const toolCallsExecuted: AgentToolCallTrace[] = [];
  const relatedEventIds: Types.ObjectId[] = [];
  const costEventIds: Types.ObjectId[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCachedTokens = 0;
  let totalCostCents = 0;
  let modelUsed = '';
  let hadMaxTurnsHit = false;
  let iterations = 0;

  for (let i = 0; i < maxTurns; i++) {
    iterations++;
    const response = await adapter.callWithTools({
      tier: config.modelTier,
      systemPrompt: config.systemPrompt,
      messages,
      tools: toolDefinitions,
      maxTokens: maxTokensPerCall,
    });

    // Update accumulators
    modelUsed = response.model;
    totalInputTokens += response.usage.inputTokens;
    totalOutputTokens += response.usage.outputTokens;
    totalCachedTokens += response.usage.cachedTokens;
    const callCost = computeAnthropicCostCents({
      tier: config.modelTier,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cachedTokens: response.usage.cachedTokens,
    });
    totalCostCents += callCost;
    const costEventId = await costEventRepository.writeCostEvent({
      traceId: ctx.traceId,
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      costType: 'llm',
      provider: 'anthropic',
      model: response.model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      cachedTokens: response.usage.cachedTokens,
      costCents: callCost,
    });
    costEventIds.push(costEventId);

    // Append assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.blocks,
    });

    // Collect text + check for tool_use
    const textBlocks = response.blocks.filter(
      (b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text'
    );
    const toolUseBlocks = response.blocks.filter(
      (b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use'
    );
    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => b.text).join('\n');
    }

    if (toolUseBlocks.length === 0) {
      // No tool_use → final response, exit loop
      break;
    }

    // Execute each tool_use block
    const toolResults: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }> = [];
    for (const block of toolUseBlocks) {
      const tool = config.allowedTools[block.name];
      const inputHash = sha256(JSON.stringify(block.input));
      const toolStart = Date.now();
      if (!tool) {
        toolCallsExecuted.push({
          toolName: block.name,
          inputHash,
          success: false,
          durationMs: 0,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Error: tool '${block.name}' is not in this agent's allowed-tools set.`,
          is_error: true,
        });
        continue;
      }
      try {
        const result = (await tool.execute(block.input, ctx)) as Record<
          string,
          unknown
        >;
        const durationMs = Date.now() - toolStart;
        toolCallsExecuted.push({
          toolName: block.name,
          inputHash,
          success: true,
          durationMs,
        });
        relatedEventIds.push(...extractToolEventIds(block.name, result));
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        const durationMs = Date.now() - toolStart;
        const errMsg = err instanceof Error ? err.message : String(err);
        toolCallsExecuted.push({
          toolName: block.name,
          inputHash,
          success: false,
          durationMs,
        });
        // Surface the failure at warn level. Inside the tool-use loop a
        // tool error is fed back to the LLM (which often recovers by
        // retrying with corrected input) — but the failure is otherwise
        // invisible. Logging it makes "tool X fails on first call every
        // time" debuggable. The input is logged to diagnose WHY the
        // LLM's first attempt was malformed.
        logger.warn('agentRunner: tool call failed', {
          agent: config.name,
          traceId: ctx.traceId,
          toolName: block.name,
          iteration: i + 1,
          error: errMsg,
          // Truncate the input — LLM tool inputs can be large
          toolInput: JSON.stringify(block.input).slice(0, 800),
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Error: ${errMsg}`,
          is_error: true,
        });
      }
    }

    // Append tool results as the next user message
    messages.push({ role: 'user', content: toolResults });
  }

  if (iterations === maxTurns) {
    hadMaxTurnsHit = true;
    logger.warn('agentRunner: maxTurns cap hit', {
      agent: config.name,
      traceId: ctx.traceId,
      iterations,
    });
  }

  return {
    text: finalText,
    toolCallsExecuted,
    relatedEventIds,
    tokenUsage: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cachedTokens: totalCachedTokens,
    },
    costEventIds,
    totalCostCents,
    modelUsed,
    hadMaxTurnsHit,
    iterations,
  };
}
