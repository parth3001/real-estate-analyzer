/**
 * Intent router — W2-S1.
 *
 * Pure function: maps (intent, confidence) → routing decision.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §2.3 routing table. Confidence
 * threshold from §2.2: low-confidence intents fall back to the Q&A
 * agent rather than executing potentially-wrong tool paths.
 *
 * WHY A PURE FUNCTION
 * -------------------
 *
 * The routing decision has no side effects, no state, and is heavily
 * tested. Keeping it pure means:
 *   - Trivially unit-testable (no Mongo, no LLM, no adapter)
 *   - Reusable from CI evals (W8 routing-eval surface, future story)
 *   - Decision boundary is explicit — every (intent, confidence) →
 *     decision mapping is in one place, code-reviewable
 */

import type { ChatIntent } from './intentClassifier';

// ===== Decision shape =====

export type AgentTarget =
  | 'agent:deal_scoring'
  | 'agent:qa'
  | 'agent:adversarial_critic';

export type ToolTarget =
  | 'tool:profile_extraction'
  | 'tool:apply_override'
  | 'tool:render_audit_trail'
  | 'tool:export_audit_pdf'
  | 'tool:save_to_watchlist';

export type RoutingTarget = AgentTarget | ToolTarget | 'fallback' | 'deflection:off_topic';

/**
 * The routed-to enum that gets persisted on the ConversationEvent
 * (per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.6). Note: ConversationEvent
 * stores 'tool_only' for ANY tool-target route — the specific tool is
 * captured in the toolCalls array, not the routedTo enum.
 */
export type RoutedTo =
  | 'agent:deal_scoring'
  | 'agent:qa'
  | 'agent:adversarial_critic'
  | 'tool_only'
  | 'fallback'
  | 'deflection:off_topic';

export interface RoutingDecision {
  /** Specific target — agent or tool — the orchestrator should execute. */
  target: RoutingTarget;
  /** The substrate-shaped enum value for the ConversationEvent.routedTo field. */
  routedTo: RoutedTo;
  /**
   * Set when the classifier's confidence was below threshold OR when
   * the orchestrator short-circuited for cost / safety reasons before
   * even reaching the classifier (Issue #106 Phase A — `cost_cap_*`
   * variants). Kept as an open enum so future fallback sources don't
   * need a parallel field.
   */
  fallbackReason?:
    | 'low_confidence'
    | 'classifier_fallback'
    | 'cost_cap_session'
    | 'cost_cap_license'
    | 'cost_cap_daily';
  /** Original classifier output (for audit). */
  classifierIntent: ChatIntent;
  classifierConfidence: number;
}

/**
 * Templated deflection response for off_topic input (W6-S2.6).
 *
 * Returned by the orchestrator WITHOUT invoking any agent — saves
 * ~$0.05-0.15 per off-topic turn (Sonnet QA cost) and eliminates the
 * brand/legal risk of Claude answering a political/medical/legal
 * question with REanalyzr's voice.
 *
 * Copy locked in 2026-05-15 with the user: tight, on-brand, redirects
 * to a concrete action.
 */
export const OFF_TOPIC_DEFLECTION_RESPONSE =
  "I'm REanalyzr — I focus on real estate deal analysis. " +
  'Ask me about a property, a metric, or paste a listing.';

// ===== Constants =====

/**
 * Per agent mesh §2.2: "if classifier confidence < 70, route to
 * agent:qa as fallback". Below this threshold, the classifier's
 * pick is treated as untrusted — Q&A agent disambiguates via
 * clarifying question.
 */
export const CONFIDENCE_THRESHOLD = 70;

// ===== Router =====

/**
 * Route an intent classification to its target. Pure function — no
 * side effects. The orchestrator (W2-S2) consumes this output and
 * executes accordingly.
 *
 * Routing table per agent mesh §2.3 (updated 2026-05-17, Issue #104 broader audit):
 *
 *   analyze_property      → agent:deal_scoring
 *   share_profile         → tool:profile_extraction (the tool accepts
 *                            free-form profile text — safe from chat)
 *   qa_metric / qa_decision / qa_general → agent:qa
 *   override_assumption   → agent:deal_scoring (chat-flow path —
 *                            agent recalls decision context + re-runs
 *                            with overrides. Direct tool:apply_override
 *                            stays invocable from a future structured
 *                            frontend.)
 *   request_audit_trail   → agent:qa (recalls decision + explains
 *                            assumptions naturally. Direct
 *                            tool:render_audit_trail still invocable
 *                            from structured frontend.)
 *   request_export        → agent:deal_scoring (agent calls
 *                            export_audit_pdf with the decisionId
 *                            resolved from context.)
 *   request_critique      → agent:adversarial_critic
 *   save_action           → agent:deal_scoring (agent resolves "save
 *                            this deal" to a specific decisionId from
 *                            context + calls save_to_watchlist.)
 *   fallback              → agent:qa
 *   off_topic             → deflection:off_topic (templated, NO agent call)
 *
 * Why so many tool intents moved to agents: tool-only routes require a
 * structured `toolPayload` (decisionId, fieldPath, etc.) that the chat
 * surface CAN'T construct from free-form text. Routing through an agent
 * gives us the natural-language → structured-payload bridge: the agent
 * recalls context via recall_user_context, then calls the tool with
 * the right payload. The deterministic tools stay in the registry —
 * any future structured frontend (slider drags, button clicks with
 * known decisionId) calls them directly.
 *
 * Confidence < threshold → agent:qa (low_confidence fallback),
 * EXCEPT off_topic which short-circuits regardless of confidence.
 */
export function routeIntent(
  intent: ChatIntent,
  confidence: number
): RoutingDecision {
  // W6-S2.6 — off_topic is a deterministic short-circuit. The
  // orchestrator returns OFF_TOPIC_DEFLECTION_RESPONSE without invoking
  // any agent. We check this BEFORE the low-confidence branch so a
  // confidently-classified off_topic skips the QA agent (cost + brand
  // safety) even if its confidence happens to be below threshold.
  if (intent === 'off_topic') {
    return {
      target: 'deflection:off_topic',
      routedTo: 'deflection:off_topic',
      classifierIntent: intent,
      classifierConfidence: confidence,
    };
  }

  // Low-confidence fallback — Q&A agent disambiguates
  if (intent !== 'fallback' && confidence < CONFIDENCE_THRESHOLD) {
    return {
      target: 'agent:qa',
      routedTo: 'agent:qa',
      fallbackReason: 'low_confidence',
      classifierIntent: intent,
      classifierConfidence: confidence,
    };
  }

  // Classifier itself signaled fallback
  if (intent === 'fallback') {
    return {
      target: 'agent:qa',
      routedTo: 'agent:qa',
      fallbackReason: 'classifier_fallback',
      classifierIntent: intent,
      classifierConfidence: confidence,
    };
  }

  // Main routing table
  switch (intent) {
    case 'analyze_property':
      return {
        target: 'agent:deal_scoring',
        routedTo: 'agent:deal_scoring',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'share_profile':
      return {
        target: 'tool:profile_extraction',
        routedTo: 'tool_only',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'qa_metric':
    case 'qa_decision':
    case 'qa_general':
      return {
        target: 'agent:qa',
        routedTo: 'agent:qa',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'override_assumption':
      // Chat-flow overrides go through the deal-scoring agent — it
      // recalls the recent decision context (via recall_user_context)
      // and re-runs resolve_property_inputs with userOverrides set,
      // then re-scores. apply_override (the deterministic tool) is
      // still in the registry and callable directly from the
      // frontend (e.g., a future drag-the-slider UI on DealScoreCard)
      // when the caller has a structured `{ decisionId, fieldPath,
      // newValue }` payload. Updated 2026-05-16 (Issue #104) — the
      // old direct tool:apply_override route fails for chat input
      // because the chat surface has no way to construct the
      // structured payload.
      return {
        target: 'agent:deal_scoring',
        routedTo: 'agent:deal_scoring',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'request_audit_trail':
      // Chat-flow path: route to QA agent — it can recall the recent
      // decision context via recall_user_context and explain the
      // assumptions / inputs naturally. The deterministic
      // render_audit_trail tool stays in the registry for any future
      // structured frontend (slider on DealScoreCard, etc.) that has
      // the decisionId payload to call it directly. Updated 2026-05-17
      // (Issue #104 broader audit) — old direct tool:render_audit_trail
      // route failed for chat input ("Chat turn failed" on chips like
      // "Show the 10-year projection" / "Show the audit trail").
      return {
        target: 'agent:qa',
        routedTo: 'agent:qa',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'request_export':
      // Chat-flow path: route to deal-scoring agent — it has tool
      // access to call export_audit_pdf with the right decisionId
      // resolved from conversation context. The deterministic tool
      // stays in the registry for direct frontend invocation (e.g., a
      // future "Export PDF" button with a known decisionId). Updated
      // 2026-05-17 (Issue #104 broader audit).
      return {
        target: 'agent:deal_scoring',
        routedTo: 'agent:deal_scoring',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'request_critique':
      return {
        target: 'agent:adversarial_critic',
        routedTo: 'agent:adversarial_critic',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'save_action':
      // Chat-flow path: route to deal-scoring agent — it can resolve
      // "save this deal" to a specific decisionId from conversation
      // context and call save_to_watchlist with the proper payload.
      // The DealScoreCard's "Save this deal" button still calls the
      // tool directly (with the known decisionId), so the structured
      // payload path is preserved for the frontend. Updated 2026-05-17
      // (Issue #104 broader audit).
      return {
        target: 'agent:deal_scoring',
        routedTo: 'agent:deal_scoring',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };
  }
}

// ===== Decision predicates (small helpers for the orchestrator) =====

export function isAgentTarget(t: RoutingTarget): t is AgentTarget {
  return t.startsWith('agent:');
}

export function isToolTarget(t: RoutingTarget): t is ToolTarget {
  return t.startsWith('tool:');
}

/**
 * True when the router short-circuited the request as off-topic
 * (W6-S2.6). The orchestrator returns OFF_TOPIC_DEFLECTION_RESPONSE
 * without invoking any agent.
 */
export function isOffTopicDeflection(t: RoutingTarget): t is 'deflection:off_topic' {
  return t === 'deflection:off_topic';
}
