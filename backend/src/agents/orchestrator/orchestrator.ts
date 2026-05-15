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
  OFF_TOPIC_DEFLECTION_RESPONSE,
  type RoutingDecision,
  type RoutingTarget,
} from './router';
import type { ToolContext, Tool } from '../tools/types';
import { toolRegistry } from '../tools/registry';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
import { logger } from '../../utils/logger';
import { runDealScoringAgent, runDealScoringAgentStream } from '../dealScoring/dealScoringAgent';
import { runQaAgent, runQaAgentStream } from '../qa/qaAgent';
import { runAdversarialCritic } from '../adversarialCritic/adversarialCriticAgent';
import {
  loadRecentTurns,
  type RecentTurn,
} from './conversationContext';
import type { OrchestratorStreamEvent } from './streamEvents';
import type { AgentStreamEvent } from '../runner/agentRunner';
import {
  projectDealScoreCard,
  type DealScoreCardWireShape,
} from './dealScoreCardProjection';

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

  if (routing.target === 'deflection:off_topic') {
    // W6-S2.6 — off-topic short-circuit. No agent invoked: the classifier
    // already paid ~$0.002 to identify this; we don't pay another
    // ~$0.05-$0.15 for Sonnet to refuse on our behalf. Brand + legal
    // safety: the response copy is controlled here, not improvised by
    // an LLM.
    responseText = OFF_TOPIC_DEFLECTION_RESPONSE;
    logger.info('orchestrator: off_topic deflection', {
      traceId,
      sessionId: input.sessionId,
      turnNumber: input.turnNumber,
      classifierConfidence: classification.confidence,
    });
  } else if (routing.target.startsWith('tool:')) {
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

// ===== Structured output helper (W6-S4) =====

/**
 * Load a DecisionEvent + its AnalysisEvent via getAuditTrail and project
 * to the DealScoreCard wire shape. Returns null if the audit-trail load
 * fails — the orchestrator continues without the structured event.
 *
 * Strategy ('buy_hold' | 'brrrr') is read defensively off the property
 * data — score_deal's input shape allows an optional `investmentStrategy`
 * field that the BRRRR routing path uses. When absent, we default to
 * 'buy_hold'.
 */
async function buildDealScoreCardEvent(
  decisionEventId: Types.ObjectId,
  ctx: ToolContext
): Promise<DealScoreCardWireShape | null> {
  const bundle = await ctx.eventsReads.getAuditTrail(decisionEventId);
  if (!bundle.analysis) return null;
  const analysisPayload = bundle.analysis.payload;
  const decisionPayload = bundle.decision.payload;
  // investmentStrategy is an optional extension carried on score_deal's
  // inputs (W5-S2 BRRRR routing). It's preserved on AnalysisEvent.propertyData
  // but not declared on SFRData/MultiFamilyData; defensive read.
  const propertyDataAny = analysisPayload.propertyData as unknown as {
    investmentStrategy?: 'buy_hold' | 'brrrr';
  };
  const strategy: 'buy_hold' | 'brrrr' =
    propertyDataAny.investmentStrategy === 'brrrr' ? 'brrrr' : 'buy_hold';
  return projectDealScoreCard(analysisPayload, decisionPayload, strategy);
}

// ===== Streaming variant (W6-S3) =====

/**
 * Mirror of handleTurn that yields OrchestratorStreamEvents instead of
 * returning a single OrchestratorTurnOutput. Used by the SSE route at
 * POST /api/chat/turn/stream.
 *
 * Event sequence:
 *   1. routing — emitted ONCE after the classifier resolves the route.
 *      Tells the UI which path was taken (deal-scoring vs qa vs
 *      deflection vs tool-only) so it can show a path-specific hint.
 *   2. text_delta — emitted ZERO OR MORE TIMES as the agent's text
 *      streams from the LLM. For deflection / tool-only paths a single
 *      text_delta carries the entire response.
 *   3. tool_call — emitted ZERO OR MORE TIMES, AFTER each tool a
 *      streaming agent invokes finishes (UX hint: "Just called
 *      score_deal — analyzing...").
 *   4. done — emitted ONCE at the end of a successful turn with
 *      trace + conversation-event IDs the UI needs.
 *   5. error — emitted ONCE in place of `done` on fatal failure.
 *   6. cancelled — emitted ONCE in place of `done` when the caller's
 *      AbortSignal fires mid-stream.
 *
 * Cancellation contract:
 *   - opts.signal is forwarded into the agent runner. Mid-stream abort
 *     halts the SDK call and yields an AgentStreamEvent.cancelled with
 *     the partial accumulator.
 *   - We still write a ConversationEvent (with the partial text and
 *     `cancelled` annotation in the agent response) so substrate
 *     accounting stays accurate.
 *   - The terminal event is `cancelled` (not `done`).
 */
export async function* streamTurn(
  input: OrchestratorTurnInput,
  opts: { signal?: AbortSignal } = {}
): AsyncGenerator<OrchestratorStreamEvent, void, void> {
  const traceId = newTraceId();
  const turnStart = Date.now();
  const signal = opts.signal;

  const ctx: ToolContext = {
    traceId,
    userId: input.userId,
    institutionId: input.institutionId,
    eventsRepo: eventsRepository,
    eventsReads: eventsRepositoryReads,
    tools: toolRegistry,
  };

  try {
    // ===== 0. Load conversation context =====
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

    if (signal?.aborted) {
      yield {
        type: 'cancelled',
        partialText: '',
        traceId,
        partialCostCents: classification.costCents,
      };
      return;
    }

    // ===== 2. Route =====
    const routing = routeIntent(classification.intent, classification.confidence);

    yield {
      type: 'routing',
      target: routing.target,
      routedTo: routing.routedTo,
      classifierIntent: classification.intent,
      classifierConfidence: classification.confidence,
      fallbackReason: routing.fallbackReason,
    };

    logger.debug('orchestrator.streamTurn: routed turn', {
      traceId,
      intent: classification.intent,
      confidence: classification.confidence,
      target: routing.target,
    });

    // ===== 3. Execute =====
    let responseText = '';
    let relatedEventIds: Types.ObjectId[] = [];
    let totalCostCents = classification.costCents;
    let totalInputTokens = classification.tokenUsage.inputTokens;
    let totalOutputTokens = classification.tokenUsage.outputTokens;
    let totalCachedTokens = classification.tokenUsage.cachedTokens;
    let modelUsed = classification.modelUsed;
    let toolCallsRecord: Array<{
      toolName: string;
      inputHash: string;
      success: boolean;
      durationMs: number;
    }> = [];
    let wasCancelled = false;

    if (routing.target === 'deflection:off_topic') {
      // No LLM call, no streaming — just emit the locked text in one delta.
      responseText = OFF_TOPIC_DEFLECTION_RESPONSE;
      yield { type: 'text_delta', text: responseText };
      logger.info('orchestrator.streamTurn: off_topic deflection', {
        traceId,
        sessionId: input.sessionId,
        turnNumber: input.turnNumber,
      });
    } else if (routing.target.startsWith('tool:')) {
      // Tool routes — execute, emit single text_delta with the result.
      const toolResult = await executeToolRoute(
        routing.target,
        input.toolPayload,
        ctx
      );
      responseText = toolResult.responseText;
      relatedEventIds = toolResult.relatedEventIds;
      yield { type: 'text_delta', text: responseText };
    } else {
      // Agent routes — real token streaming via runAgentStream.
      const agentContext =
        recentTurns.length > 0 ? { recentTurns } : undefined;

      let agentStream: AsyncGenerator<AgentStreamEvent, void, void>;
      if (routing.target === 'agent:qa') {
        agentStream = runQaAgentStream(
          { userInput: input.userInput, context: agentContext },
          ctx,
          { signal }
        );
      } else if (routing.target === 'agent:deal_scoring') {
        agentStream = runDealScoringAgentStream(
          { userInput: input.userInput, context: agentContext },
          ctx,
          { signal }
        );
      } else if (routing.target === 'agent:adversarial_critic') {
        // adversarial_critic stays non-streaming for now (complex 2-persona
        // logic; structured output not text). Emit the result as a single
        // text_delta — protocol stays uniform.
        const decisionIdRaw = (input.toolPayload ?? {}) as {
          decisionId?: Types.ObjectId | string;
          triggerType?: 'auto_buy_band' | 'manual_request' | 'batch_seeding';
        };
        if (!decisionIdRaw.decisionId) {
          throw new Error(
            'orchestrator.streamTurn: agent:adversarial_critic requires toolPayload.decisionId.'
          );
        }
        const result = await runAdversarialCritic(
          {
            decisionId: decisionIdRaw.decisionId,
            triggerType: decisionIdRaw.triggerType ?? 'manual_request',
          },
          ctx
        );
        const summary = result.critiques
          .map((c) => {
            const severity = c.structured.severityScore;
            const agreed = c.structured.agreementWithOriginal;
            const reasonCount = c.structured.divergenceReasons.length;
            return `${c.persona}: ${agreed ? 'agrees' : 'disagrees'} (severity ${severity}, ${reasonCount} divergence(s))`;
          })
          .join('\n');
        responseText =
          `Critique complete. Two personas ran in parallel:\n${summary}\n\n` +
          `Full critique details persisted to substrate (CritiqueEvents).`;
        relatedEventIds = result.critiques.flatMap((c) => [
          c.critiqueEventId,
          ...c.runResult.relatedEventIds,
        ]);
        toolCallsRecord = result.critiques.flatMap(
          (c) => c.runResult.toolCallsExecuted
        );
        totalCostCents += result.totalCostCents;
        const aggUsage = result.critiques.reduce(
          (acc, c) => ({
            inputTokens: acc.inputTokens + c.runResult.tokenUsage.inputTokens,
            outputTokens: acc.outputTokens + c.runResult.tokenUsage.outputTokens,
            cachedTokens: acc.cachedTokens + c.runResult.tokenUsage.cachedTokens,
          }),
          { inputTokens: 0, outputTokens: 0, cachedTokens: 0 }
        );
        totalInputTokens += aggUsage.inputTokens;
        totalOutputTokens += aggUsage.outputTokens;
        totalCachedTokens += aggUsage.cachedTokens;
        modelUsed = result.critiques[0]?.runResult.modelUsed ?? modelUsed;
        yield { type: 'text_delta', text: responseText };
      } else {
        throw new Error(
          `orchestrator.streamTurn: unknown route '${routing.target}'`
        );
      }

      // Consume the streaming agent (only set when qa or deal_scoring).
      if (
        routing.target === 'agent:qa' ||
        routing.target === 'agent:deal_scoring'
      ) {
        // Capture this for the structured-output emission below (typed
        // boolean lets the post-loop block use it without re-checking
        // routing.target, which TS has narrowed away by that point).
        const isDealScoring = routing.target === 'agent:deal_scoring';
        for await (const ev of agentStream!) {
          if (ev.type === 'text_delta') {
            responseText += ev.text;
            yield { type: 'text_delta', text: ev.text };
          } else if (ev.type === 'tool_call_completed') {
            yield {
              type: 'tool_call',
              toolName: ev.toolName,
              success: ev.success,
              durationMs: ev.durationMs,
            };
          } else if (ev.type === 'final') {
            // Mirror runAgent's return shape into orchestrator-level
            // accumulators. Final text from the agent overrides the
            // accumulated deltas only if the agent emitted a final text
            // block at all — otherwise stick with the delta accumulation.
            if (ev.output.text.length > 0) {
              responseText = ev.output.text;
            }
            relatedEventIds = ev.output.relatedEventIds;
            toolCallsRecord = ev.output.toolCallsExecuted;
            totalCostCents += ev.output.totalCostCents;
            totalInputTokens += ev.output.tokenUsage.inputTokens;
            totalOutputTokens += ev.output.tokenUsage.outputTokens;
            totalCachedTokens += ev.output.tokenUsage.cachedTokens;
            modelUsed = ev.output.modelUsed;

            // ===== Structured output (W6-S4) =====
            //
            // For agent:deal_scoring we project the DecisionEvent +
            // AnalysisEvent into a DealScoreCard wire shape and emit
            // a structured_output event the frontend mounts as an
            // inline card. The projection lives in dealScoreCardProjection.ts
            // — orchestrator stays the source of truth for the
            // structured-output contract while substrate event schemas
            // evolve independently.
            //
            // The decisionEventId is the LAST relatedEventId per
            // dealScoringAgent's score_deal extraction logic. If the
            // agent didn't actually call score_deal (rare — the agent
            // may have refused or asked a clarifying question), there's
            // nothing to render; we silently skip.
            if (isDealScoring && relatedEventIds.length > 0) {
              const decisionEventId =
                relatedEventIds[relatedEventIds.length - 1];
              try {
                const card = await buildDealScoreCardEvent(
                  decisionEventId,
                  ctx
                );
                if (card) {
                  yield {
                    type: 'structured_output',
                    kind: 'deal_score_card',
                    data: card as unknown as Record<string, unknown>,
                  };
                }
              } catch (err) {
                logger.warn(
                  'orchestrator.streamTurn: DealScoreCard projection failed',
                  {
                    traceId,
                    decisionEventId: decisionEventId.toHexString(),
                    error: err instanceof Error ? err.message : String(err),
                  }
                );
                // No structured event — text response still streams.
              }
            }
          } else if (ev.type === 'cancelled') {
            wasCancelled = true;
            responseText = ev.partial.text || responseText;
            relatedEventIds = ev.partial.relatedEventIds;
            toolCallsRecord = ev.partial.toolCallsExecuted;
            totalCostCents += ev.partial.totalCostCents;
            totalInputTokens += ev.partial.tokenUsage.inputTokens;
            totalOutputTokens += ev.partial.tokenUsage.outputTokens;
            totalCachedTokens += ev.partial.tokenUsage.cachedTokens;
            modelUsed = ev.partial.modelUsed || modelUsed;
            break;
          }
        }
      }
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
        toolCalls: toolCallsRecord,
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

    if (wasCancelled) {
      yield {
        type: 'cancelled',
        partialText: responseText,
        traceId,
        conversationEventId: conversationEventId.toHexString(),
        partialCostCents: totalCostCents,
      };
      return;
    }

    // ===== 5. Done =====
    yield {
      type: 'done',
      traceId,
      conversationEventId: conversationEventId.toHexString(),
      relatedEventIds: relatedEventIds.map((id) => id.toHexString()),
      totalCostCents,
      agentStubbed: false,
    };
  } catch (err) {
    logger.error('orchestrator.streamTurn: failed', {
      traceId,
      sessionId: input.sessionId,
      turnNumber: input.turnNumber,
      error: err instanceof Error ? err.stack ?? err.message : String(err),
    });
    // Generic message; internal detail stays in logs.
    yield { type: 'error', message: 'Chat turn failed. Please try again.' };
  }
}
