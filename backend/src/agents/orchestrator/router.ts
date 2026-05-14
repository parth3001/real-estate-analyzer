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

export type RoutingTarget = AgentTarget | ToolTarget | 'fallback';

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
  | 'fallback';

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
 *   override_assumption   → tool:apply_override (orchestrator chains to qa for explanation)
 *   request_audit_trail   → tool:render_audit_trail
 *   request_export        → tool:export_audit_pdf
 *   request_critique      → agent:adversarial_critic
 *   save_action           → tool:save_to_watchlist
 *   fallback              → agent:qa
 *
 * Confidence < threshold → agent:qa (low_confidence fallback)
 */
export function routeIntent(
  intent: ChatIntent,
  confidence: number
): RoutingDecision {
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
      // The override itself is deterministic (apply_override tool); the
      // orchestrator then chains to qa for a natural-language explanation
      // of the new score. For W2 scaffolding we route to the tool; the
      // chained Q&A explanation lands when the Q&A agent ships (W5).
      return {
        target: 'tool:apply_override',
        routedTo: 'tool_only',
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
