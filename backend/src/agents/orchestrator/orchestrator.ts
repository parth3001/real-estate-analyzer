/**
 * Orchestrator — W2-S2.
 *
 * Top-level entrypoint that turns a user chat message into:
 *   1. An intent classification (Haiku call)
 *   2. A routing decision
 *   3. (For tool-only routes) actual tool execution
 *   4. (For agent routes) a "wave 1.5 stub" response — agent
 *      execution lands in W5
 *   5. A ConversationEvent emitted to substrate capturing the full turn
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §2.
 *
 * WAVE-1 SCOPE
 * ------------
 *
 * The orchestrator's CONTROL FLOW is fully implemented:
 *   - Intent classification works (real Haiku call)
 *   - Routing works (pure function, exhaustive)
 *   - Tool-only paths EXECUTE end-to-end (substrate writes happen)
 *   - ConversationEvent emitted on every turn
 *   - CostEvent emitted on every Haiku call (via the classifier)
 *
 * What's STUBBED until W5:
 *   - Agent execution (deal_scoring, qa, adversarial_critic).
 *     Agent routes return a deterministic placeholder text. The
 *     ConversationEvent still gets written; the placeholder is honest
 *     about what's not yet implemented.
 *
 * This split is deliberate: the orchestrator's API surface is the
 * contract the chat overlay (W6) depends on. Shipping the control
 * flow + tool execution today means W6 can start without waiting for
 * W5. When agents land, the orchestrator's "execute" branch swaps
 * stubs for real agent calls — same return shape, no API change.
 */

import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { eventsRepository } from '../../repositories/EventsRepository';
import { classifyIntent } from './intentClassifier';
import {
  routeIntent,
  type RoutingDecision,
  type RoutingTarget,
} from './router';
import type { ToolContext, Tool } from '../tools/types';
import { toolRegistry } from '../tools/registry';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import { logger } from '../../utils/logger';
import { runDealScoringAgent } from '../dealScoring/dealScoringAgent';
import { runQaAgent } from '../qa/qaAgent';
import { runAdversarialCritic } from '../adversarialCritic/adversarialCriticAgent';
import {
  loadRecentTurns,
  type RecentTurn,
} from './conversationContext';

// ===== Input / output =====

export interface OrchestratorTurnInput {
  /** Free-form text from the user. */
  userInput: string;

  /** Who's chatting. Substrate ProvenAnce. */
  userId: Types.ObjectId;
  institutionId?: Types.ObjectId;

  /** Stable session identifier — survives across turns. UUID v4. */
  sessionId: string;

  /** 1-indexed turn number within the session. Orchestrator does NOT
   *  generate this — the chat surface (or the caller) tracks turn
   *  ordering so the orchestrator stays stateless. */
  turnNumber: number;

  /**
   * Optional input payload for tool-only routes that need structured
   * data the classifier can't extract from text (e.g.,
   * apply_override needs originalDecisionId + fieldPath + newValue).
   * The chat surface attaches these when the user manipulates UI
   * widgets (override sliders, export buttons, etc.). For pure-text
   * turns, this is undefined.
   */
  toolPayload?: Record<string, unknown>;

  /** Optional input method override. Defaults to 'text'. */
  inputMethod?: 'text' | 'voice' | 'paste';
}

export interface OrchestratorTurnOutput {
  /** UUID v4. Generated per turn unless reused for retries. */
  traceId: string;

  /** Agent / tool's textual response surfaced to the user. */
  responseText: string;

  /** Routing decision audit. */
  routing: RoutingDecision;

  /** Cross-event references — IDs of substrate events written this turn. */
  events: {
    conversationEventId: Types.ObjectId;
    /** IDs of any other events written by tool execution. */
    related: Types.ObjectId[];
  };

  /** Per-turn cost summary (sums classifier + any agent LLM calls). */
  totalCostCents: number;

  /** Was an agent execution stubbed (W5 not yet shipped)? */
  agentStubbed: boolean;
}

// ===== Orchestrator =====

/**
 * Generate a UUID v4 traceId. Stable across the whole turn so every
 * event written by this turn (CostEvent from classifier, possible
 * tool events, the final ConversationEvent) joins on traceId.
 */
function newTraceId(): string {
  return randomUUID();
}

/**
 * Execute a tool-only route. Returns the tool's output plus IDs of
 * any substrate events the tool emitted. Throws on tool failure;
 * caller (orchestrator) translates to user-facing error.
 */
async function executeToolRoute(
  target: RoutingTarget,
  toolPayload: Record<string, unknown> | undefined,
  ctx: ToolContext
): Promise<{ responseText: string; relatedEventIds: Types.ObjectId[] }> {
  // Strip the 'tool:' prefix to get the registry key
  const toolName = target.replace(/^tool:/, '');
  const tool = toolRegistry[toolName] as Tool<unknown, unknown> | undefined;
  if (!tool) {
    throw new Error(
      `orchestrator: tool '${toolName}' not found in registry`
    );
  }

  // Tool inputs vary per tool; the caller supplies via toolPayload.
  // We can't validate at the orchestrator layer because each tool's
  // schema is different — the tool's own Zod validation handles it.
  if (!toolPayload) {
    throw new Error(
      `orchestrator: tool '${toolName}' route requires toolPayload, but none was provided. ` +
        `The chat surface must include the structured payload (e.g., decisionId, fieldPath, newValue) ` +
        `for tool-only routes.`
    );
  }

  const result = (await tool.execute(toolPayload, ctx)) as Record<string, unknown>;

  // Surface a brief response text that varies per tool. Wave-1 stubs:
  // - profile_extraction: confirmation if hadNewFields
  // - apply_override: "score moved from X to Y"
  // - render_audit_trail: "Audit trail loaded"
  // - export_audit_pdf: "Export ready"
  // - save_to_watchlist: "Saved"
  const responseText = describeToolResult(toolName, result);
  const relatedEventIds = extractRelatedEventIds(toolName, result);

  return { responseText, relatedEventIds };
}

/**
 * Map each tool's output shape to a short user-facing message.
 * Centralized here so the orchestrator's response style is consistent
 * across tools, and so adding a new tool requires updating one place.
 */
function describeToolResult(
  toolName: string,
  result: Record<string, unknown>
): string {
  switch (toolName) {
    case 'profile_extraction': {
      const r = result as { hadNewFields?: boolean; confidence?: number };
      return r.hadNewFields
        ? `Got it — I'll remember that. (confidence ${r.confidence})`
        : "Got it. Nothing new to add to your profile yet.";
    }
    case 'apply_override': {
      const r = result as {
        priorDealQuality?: number;
        newDealQuality?: number;
        dealQualityDelta?: number;
      };
      const direction =
        (r.dealQualityDelta ?? 0) > 0
          ? 'improved'
          : (r.dealQualityDelta ?? 0) < 0
          ? 'dropped'
          : 'held';
      return `Override applied. Deal quality ${direction} from ${r.priorDealQuality} to ${r.newDealQuality} (Δ${r.dealQualityDelta}).`;
    }
    case 'render_audit_trail': {
      const r = result as { overrides?: unknown[]; critiques?: unknown[] };
      return `Audit trail loaded. ${(r.overrides ?? []).length} override(s), ${(r.critiques ?? []).length} critique(s) on record.`;
    }
    case 'export_audit_pdf': {
      const r = result as { format?: string; pdfSizeBytes?: number };
      return `Export ready (${r.format}, ${r.pdfSizeBytes} bytes). Download link in the response payload.`;
    }
    case 'save_to_watchlist':
      return 'Saved to your watchlist.';
    default:
      return `Tool '${toolName}' completed.`;
  }
}

/**
 * Pull event IDs from a tool's output for ConversationEvent.relatedEventIds.
 */
function extractRelatedEventIds(
  toolName: string,
  result: Record<string, unknown>
): Types.ObjectId[] {
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
  ];
  for (const key of candidates) {
    const v = (result as Record<string, unknown>)[key];
    if (v instanceof Types.ObjectId) ids.push(v);
  }
  return ids;
}

// Stub agent responses removed in W5 — real agent execution now
// happens via executeAgentRoute() below.

/**
 * The orchestrator's main entrypoint. ONE call per user turn.
 *
 * Substrate writes happen in this exact order:
 *   1. CostEvent (classifier Haiku call)              — via intentClassifier
 *   2. (tool-only routes) substrate events the tool emits
 *   3. ConversationEvent (this function)              — at the end
 *
 * The ConversationEvent's relatedEventIds field captures everything
 * emitted earlier in the turn, so the chat surface (or eval harness)
 * can join the full turn via traceId or via the ConversationEvent's
 * own references.
 */
export async function handleTurn(
  input: OrchestratorTurnInput
): Promise<OrchestratorTurnOutput> {
  const traceId = newTraceId();
  const turnStart = Date.now();

  const ctx: ToolContext = {
    traceId,
    userId: input.userId,
    institutionId: input.institutionId,
    eventsRepo: eventsRepository,
    eventsReads: eventsRepositoryReads,
    tools: toolRegistry,
  };

  // ===== 0. Load conversation context (Option A — orchestrator threads it) =====
  //
  // The current turn's ConversationEvent isn't written until step 4, so
  // this returns turns 1..N-1 — exactly the history a classifier /
  // agent needs to recognize "the assistant asked a question last turn,
  // and this input answers it."
  const recentTurns: RecentTurn[] = await loadRecentTurns(
    eventsRepositoryReads,
    input.sessionId
  );

  // ===== 1. Classify intent =====

  const classification = await classifyIntent({
    userInput: input.userInput,
    traceId,
    userId: input.userId,
    institutionId: input.institutionId,
    recentTurns,
  });

  // ===== 2. Route =====

  const routing = routeIntent(
    classification.intent,
    classification.confidence
  );

  logger.debug('orchestrator: routed turn', {
    traceId,
    intent: classification.intent,
    confidence: classification.confidence,
    target: routing.target,
    fallbackReason: routing.fallbackReason,
  });

  // ===== 3. Execute =====

  let responseText: string;
  let relatedEventIds: Types.ObjectId[] = [];
  let agentStubbed = false;
  // Aggregate cost + token usage across classifier + (optional) agent run
  let totalCostCents = classification.costCents;
  let totalInputTokens = classification.tokenUsage.inputTokens;
  let totalOutputTokens = classification.tokenUsage.outputTokens;
  let totalCachedTokens = classification.tokenUsage.cachedTokens;
  let modelUsed = classification.modelUsed;
  let toolCalls: Array<{
    toolName: string;
    inputHash: string;
    success: boolean;
    durationMs: number;
  }> = [];

  if (routing.target.startsWith('tool:')) {
    // Real tool execution
    const toolResult = await executeToolRoute(
      routing.target,
      input.toolPayload,
      ctx
    );
    responseText = toolResult.responseText;
    relatedEventIds = toolResult.relatedEventIds;
  } else {
    // Real agent execution (W5). recentTurns threaded in so the agent
    // can see clarifying-question exchanges (Option A context).
    const agentResult = await executeAgentRoute(
      routing.target,
      input,
      recentTurns,
      ctx
    );
    responseText = agentResult.responseText;
    relatedEventIds = agentResult.relatedEventIds;
    toolCalls = agentResult.toolCalls;
    totalCostCents += agentResult.costCents;
    totalInputTokens += agentResult.tokenUsage.inputTokens;
    totalOutputTokens += agentResult.tokenUsage.outputTokens;
    totalCachedTokens += agentResult.tokenUsage.cachedTokens;
    modelUsed = agentResult.modelUsed;
  }

  // ===== 4. Emit ConversationEvent =====

  const totalDurationMs = Date.now() - turnStart;
  const conversationEventId = await eventsRepository.writeConversationEvent({
    traceId,
    actorType: 'user',
    userId: input.userId,
    institutionId: input.institutionId,
    payload: {
      sessionId: input.sessionId,
      turnNumber: input.turnNumber,
      userInput: {
        text: input.userInput,
        inputMethod: input.inputMethod ?? 'text',
      },
      intentClassification: {
        intent: classification.intent,
        confidence: classification.confidence,
        classifierModel: classification.modelUsed,
      },
      routedTo: routing.routedTo,
      toolCalls,
      agentResponse: {
        text: responseText,
        structuredOutputs: [],
        relatedEventIds,
      },
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cachedTokens: totalCachedTokens,
        estimatedCostCents: totalCostCents,
      },
      modelUsed,
      totalDurationMs,
    },
  });

  return {
    traceId,
    responseText,
    routing,
    events: {
      conversationEventId,
      related: relatedEventIds,
    },
    totalCostCents,
    agentStubbed,
  };
}

// ===== Agent execution =====

/**
 * Dispatch to the right agent based on the routing target. Returns
 * the agent's text + structured outputs to surface in
 * ConversationEvent.
 *
 * For agent:adversarial_critic, the orchestrator requires a
 * `decisionId` in toolPayload (the critic needs to know what to
 * critique). For agent:deal_scoring + agent:qa, the user input
 * carries all the context.
 */
async function executeAgentRoute(
  target: RoutingTarget,
  turnInput: OrchestratorTurnInput,
  recentTurns: RecentTurn[],
  ctx: ToolContext
): Promise<{
  responseText: string;
  relatedEventIds: Types.ObjectId[];
  toolCalls: Array<{
    toolName: string;
    inputHash: string;
    success: boolean;
    durationMs: number;
  }>;
  costCents: number;
  tokenUsage: { inputTokens: number; outputTokens: number; cachedTokens: number };
  modelUsed: string;
}> {
  // Shared agent context — recentTurns lets the agent see
  // clarifying-question exchanges (e.g., "I asked about strategy last
  // turn; this input answers it").
  const agentContext =
    recentTurns.length > 0 ? { recentTurns } : undefined;

  if (target === 'agent:deal_scoring') {
    const result = await runDealScoringAgent(
      { userInput: turnInput.userInput, context: agentContext },
      ctx
    );
    return {
      responseText: result.text,
      relatedEventIds: result.relatedEventIds,
      toolCalls: result.toolCallsExecuted,
      costCents: result.totalCostCents,
      tokenUsage: result.tokenUsage,
      modelUsed: result.modelUsed,
    };
  }

  if (target === 'agent:qa') {
    const result = await runQaAgent(
      { userInput: turnInput.userInput, context: agentContext },
      ctx
    );
    return {
      responseText: result.text,
      relatedEventIds: result.relatedEventIds,
      toolCalls: result.toolCallsExecuted,
      costCents: result.totalCostCents,
      tokenUsage: result.tokenUsage,
      modelUsed: result.modelUsed,
    };
  }

  if (target === 'agent:adversarial_critic') {
    const decisionIdRaw = (turnInput.toolPayload ?? {}) as {
      decisionId?: Types.ObjectId | string;
      triggerType?: 'auto_buy_band' | 'manual_request' | 'batch_seeding';
    };
    if (!decisionIdRaw.decisionId) {
      throw new Error(
        'orchestrator: agent:adversarial_critic route requires toolPayload.decisionId. ' +
          'The critic needs to know which decision to critique.'
      );
    }
    const result = await runAdversarialCritic(
      {
        decisionId: decisionIdRaw.decisionId,
        triggerType: decisionIdRaw.triggerType ?? 'manual_request',
      },
      ctx
    );
    // Compose a brief summary of both personas for the chat response.
    const summary = result.critiques
      .map((c) => {
        const severity = c.structured.severityScore;
        const agreed = c.structured.agreementWithOriginal;
        const reasonCount = c.structured.divergenceReasons.length;
        return `${c.persona}: ${agreed ? 'agrees' : 'disagrees'} (severity ${severity}, ${reasonCount} divergence(s))`;
      })
      .join('\n');
    const responseText =
      `Critique complete. Two personas ran in parallel:\n${summary}\n\n` +
      `Full critique details persisted to substrate (CritiqueEvents).`;
    // Combine related event IDs from both personas
    const relatedEventIds = result.critiques.flatMap((c) => [
      c.critiqueEventId,
      ...c.runResult.relatedEventIds,
    ]);
    const toolCalls = result.critiques.flatMap((c) => c.runResult.toolCallsExecuted);
    const tokenUsage = result.critiques.reduce(
      (acc, c) => ({
        inputTokens: acc.inputTokens + c.runResult.tokenUsage.inputTokens,
        outputTokens: acc.outputTokens + c.runResult.tokenUsage.outputTokens,
        cachedTokens: acc.cachedTokens + c.runResult.tokenUsage.cachedTokens,
      }),
      { inputTokens: 0, outputTokens: 0, cachedTokens: 0 }
    );
    return {
      responseText,
      relatedEventIds,
      toolCalls,
      costCents: result.totalCostCents,
      tokenUsage,
      modelUsed: result.critiques[0]?.runResult.modelUsed ?? 'claude-opus-4-7',
    };
  }

  throw new Error(`orchestrator: unknown agent target '${target}'`);
}
