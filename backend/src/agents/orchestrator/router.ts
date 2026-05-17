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
  /** Set when the classifier's confidence was below threshold. */
  fallbackReason?: 'low_confidence' | 'classifier_fallback';
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
 * Routing table per agent mesh §2.3:
 *
 *   analyze_property      → agent:deal_scoring
 *   share_profile         → tool:profile_extraction
 *   qa_metric / qa_decision / qa_general → agent:qa
 *   override_assumption   → agent:deal_scoring (chat-flow path — the agent
 *                            recalls recent decision context + re-runs
 *                            resolve_property_inputs with userOverrides;
 *                            updated 2026-05-16 from the old direct
 *                            tool:apply_override route, which required a
 *                            structured payload chat can't construct.
 *                            For a future structured slider UI on the
 *                            score card, the tool route is still
 *                            invocable directly from the frontend.)
 *   request_audit_trail   → tool:render_audit_trail
 *   request_export        → tool:export_audit_pdf
 *   request_critique      → agent:adversarial_critic
 *   save_action           → tool:save_to_watchlist
 *   fallback              → agent:qa
 *   off_topic             → deflection:off_topic (templated, NO agent call)
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
      return {
        target: 'tool:render_audit_trail',
        routedTo: 'tool_only',
        classifierIntent: intent,
        classifierConfidence: confidence,
      };

    case 'request_export':
      return {
        target: 'tool:export_audit_pdf',
        routedTo: 'tool_only',
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
      return {
        target: 'tool:save_to_watchlist',
        routedTo: 'tool_only',
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
