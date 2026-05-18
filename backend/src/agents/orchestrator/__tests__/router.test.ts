/**
 * W2-S1 acceptance test — intent router (pure function).
 *
 * Exhaustively covers the routing table per agent mesh §2.3:
 *   - Each intent maps to the documented target
 *   - Low-confidence → agent:qa fallback
 *   - classifier-signaled fallback → agent:qa fallback
 *   - routedTo enum is the right substrate-shaped value
 */

import { routeIntent, CONFIDENCE_THRESHOLD } from '../router';
import type { ChatIntent } from '../intentClassifier';

describe('routeIntent (W2-S1)', () => {
  // ===== Main routing table (high confidence — above threshold) =====

  describe('main routing table — high confidence', () => {
    it.each<[ChatIntent, string, string]>([
      ['analyze_property', 'agent:deal_scoring', 'agent:deal_scoring'],
      // share_profile keeps the direct tool route — the tool accepts
      // free-form natural language as input; chat is fine with it.
      ['share_profile', 'tool:profile_extraction', 'tool_only'],
      ['qa_metric', 'agent:qa', 'agent:qa'],
      ['qa_decision', 'agent:qa', 'agent:qa'],
      ['qa_general', 'agent:qa', 'agent:qa'],
      // Issue #104 broader audit (2026-05-17): every tool-only route
      // that requires a structured payload (decisionId, etc.) chat
      // CAN'T construct now routes through an agent that resolves the
      // payload via recall_user_context, then calls the tool. Direct
      // tool routes stay in the registry for structured frontend use.
      ['override_assumption', 'agent:deal_scoring', 'agent:deal_scoring'],
      ['request_audit_trail', 'agent:qa', 'agent:qa'],
      ['request_export', 'agent:deal_scoring', 'agent:deal_scoring'],
      ['request_critique', 'agent:adversarial_critic', 'agent:adversarial_critic'],
      ['save_action', 'agent:deal_scoring', 'agent:deal_scoring'],
    ])(
      'intent %s @ conf 90 → target %s, routedTo %s',
      (intent, expectedTarget, expectedRoutedTo) => {
        const decision = routeIntent(intent, 90);
        expect(decision.target).toBe(expectedTarget);
        expect(decision.routedTo).toBe(expectedRoutedTo);
        expect(decision.fallbackReason).toBeUndefined();
        expect(decision.classifierIntent).toBe(intent);
        expect(decision.classifierConfidence).toBe(90);
      }
    );
  });

  // ===== Low-confidence fallback =====

  describe('low-confidence fallback', () => {
    it('routes to agent:qa when confidence is below threshold', () => {
      const decision = routeIntent('analyze_property', CONFIDENCE_THRESHOLD - 1);
      expect(decision.target).toBe('agent:qa');
      expect(decision.routedTo).toBe('agent:qa');
      expect(decision.fallbackReason).toBe('low_confidence');
      expect(decision.classifierIntent).toBe('analyze_property');
    });

    it('routes to agent:qa for ANY intent below threshold', () => {
      const intentsToTest: ChatIntent[] = [
        'analyze_property',
        'share_profile',
        'qa_metric',
        'override_assumption',
        'request_audit_trail',
        'request_export',
        'request_critique',
        'save_action',
      ];
      for (const intent of intentsToTest) {
        const decision = routeIntent(intent, 50);
        expect(decision.target).toBe('agent:qa');
        expect(decision.fallbackReason).toBe('low_confidence');
      }
    });

    it('exactly at threshold (confidence === 70) does NOT fall back', () => {
      const decision = routeIntent('analyze_property', CONFIDENCE_THRESHOLD);
      expect(decision.target).toBe('agent:deal_scoring');
      expect(decision.fallbackReason).toBeUndefined();
    });

    it('one below threshold (confidence === 69) DOES fall back', () => {
      const decision = routeIntent('analyze_property', CONFIDENCE_THRESHOLD - 1);
      expect(decision.target).toBe('agent:qa');
      expect(decision.fallbackReason).toBe('low_confidence');
    });
  });

  // ===== Classifier-signaled fallback =====

  describe('classifier-signaled fallback', () => {
    it('routes to agent:qa when intent is "fallback", regardless of confidence', () => {
      const high = routeIntent('fallback', 95);
      const low = routeIntent('fallback', 30);
      expect(high.target).toBe('agent:qa');
      expect(high.fallbackReason).toBe('classifier_fallback');
      expect(low.target).toBe('agent:qa');
      expect(low.fallbackReason).toBe('classifier_fallback');
    });
  });

  // ===== W6-S2.6 — off_topic short-circuit =====

  describe('off_topic deflection (W6-S2.6)', () => {
    it('routes off_topic to the templated deflection target — NOT an agent', () => {
      const decision = routeIntent('off_topic', 95);
      expect(decision.target).toBe('deflection:off_topic');
      expect(decision.routedTo).toBe('deflection:off_topic');
      // Crucially: no agent invoked. orchestrator short-circuits.
      expect(decision.target).not.toMatch(/^agent:/);
      expect(decision.target).not.toMatch(/^tool:/);
    });

    it('short-circuits even when classifier confidence is low (off_topic beats threshold check)', () => {
      // off_topic is checked BEFORE the low-confidence fallback. A
      // classifier with mild confidence in "this is off-topic" should
      // still short-circuit, NOT route to QA.
      const decision = routeIntent('off_topic', 55);
      expect(decision.target).toBe('deflection:off_topic');
      expect(decision.fallbackReason).toBeUndefined();
    });

    it('preserves classifierIntent + confidence for audit even on deflection', () => {
      const decision = routeIntent('off_topic', 88);
      expect(decision.classifierIntent).toBe('off_topic');
      expect(decision.classifierConfidence).toBe(88);
    });

    it('does NOT deflect adjacent education — qa_general routes to agent:qa', () => {
      // Sanity check: the adjacency examples we want to PRESERVE
      // (1031 exchanges, Fed rates → cap rates, stocks-vs-RE) all
      // come through as qa_general and must keep their agent route.
      const decision = routeIntent('qa_general', 90);
      expect(decision.target).toBe('agent:qa');
      expect(decision.routedTo).toBe('agent:qa');
      expect(decision.target).not.toBe('deflection:off_topic');
    });
  });

  // ===== Substrate enum mapping =====

  describe('routedTo substrate-enum mapping', () => {
    it('agent routes preserve the agent identifier in routedTo', () => {
      expect(routeIntent('analyze_property', 90).routedTo).toBe('agent:deal_scoring');
      expect(routeIntent('qa_metric', 90).routedTo).toBe('agent:qa');
      expect(routeIntent('request_critique', 90).routedTo).toBe('agent:adversarial_critic');
    });

    it('only share_profile remains a direct tool route — every other tool intent now goes through an agent (Issue #104 broader audit)', () => {
      // override_assumption / request_audit_trail / request_export /
      // save_action all moved to agent routing on 2026-05-17. The only
      // tool-only intent left is share_profile, which works because
      // its tool accepts free-form natural-language input directly.
      const toolIntents: ChatIntent[] = ['share_profile'];
      for (const intent of toolIntents) {
        expect(routeIntent(intent, 90).routedTo).toBe('tool_only');
      }
      // And the rerouted intents must NO LONGER hit tool_only.
      const reroutedIntents: ChatIntent[] = [
        'override_assumption',
        'request_audit_trail',
        'request_export',
        'save_action',
      ];
      for (const intent of reroutedIntents) {
        expect(routeIntent(intent, 90).routedTo).not.toBe('tool_only');
      }
    });
  });

  // ===== Audit fields =====

  describe('audit fields', () => {
    it('preserves classifierIntent and classifierConfidence even when falling back', () => {
      const decision = routeIntent('analyze_property', 65);
      expect(decision.classifierIntent).toBe('analyze_property');
      expect(decision.classifierConfidence).toBe(65);
    });
  });
});
