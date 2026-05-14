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
      ['share_profile', 'tool:profile_extraction', 'tool_only'],
      ['qa_metric', 'agent:qa', 'agent:qa'],
      ['qa_decision', 'agent:qa', 'agent:qa'],
      ['qa_general', 'agent:qa', 'agent:qa'],
      ['override_assumption', 'tool:apply_override', 'tool_only'],
      ['request_audit_trail', 'tool:render_audit_trail', 'tool_only'],
      ['request_export', 'tool:export_audit_pdf', 'tool_only'],
      ['request_critique', 'agent:adversarial_critic', 'agent:adversarial_critic'],
      ['save_action', 'tool:save_to_watchlist', 'tool_only'],
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

  // ===== Substrate enum mapping =====

  describe('routedTo substrate-enum mapping', () => {
    it('agent routes preserve the agent identifier in routedTo', () => {
      expect(routeIntent('analyze_property', 90).routedTo).toBe('agent:deal_scoring');
      expect(routeIntent('qa_metric', 90).routedTo).toBe('agent:qa');
      expect(routeIntent('request_critique', 90).routedTo).toBe('agent:adversarial_critic');
    });

    it('tool routes collapse to "tool_only" in routedTo (specific tool is in toolCalls)', () => {
      const toolIntents: ChatIntent[] = [
        'share_profile',
        'override_assumption',
        'request_audit_trail',
        'request_export',
        'save_action',
      ];
      for (const intent of toolIntents) {
        expect(routeIntent(intent, 90).routedTo).toBe('tool_only');
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
