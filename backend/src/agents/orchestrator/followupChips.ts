/**
 * followupChips — generate the 3-4 "what next" chips the chat surface
 * renders below each assistant response.
 *
 * Phase 3+4 — chat-first IA, Day 3.
 *
 * Why this exists:
 *   The chat is a blank-canvas surface. Without proactive next-step
 *   prompts, target users (per PRODUCT_CONTEXT.md — "active investors
 *   analyzing 3-30 deals/year, NOT beginners") don't discover platform
 *   breadth: stress-tests, sensitivity analysis, comparisons, tax
 *   optimization, audit trails. Chips ARE the discovery surface.
 *
 * Design constraints (from the user's review of Marcus's plan):
 *   1. EXPERIENCED-INVESTOR DEPTH. No "What's a cap rate?" — that
 *      insults the target user. Chips must reveal what the platform
 *      can actually DO that Excel cannot.
 *   2. Reveal platform-window-display capability — stress-tests,
 *      comparisons, projections, tax optimization, sensitivity.
 *   3. Bias toward engagement, not refusal — chips should give the
 *      user a productive next step, never dead-end them.
 *
 * Phase 3 implementation (deterministic, this file):
 *   Each routing target gets a curated chip set. No LLM call — fast,
 *   free, deterministic, easy to QA. The chip pool is small enough
 *   (~25 strings across all branches) that we can review every one for
 *   tone + accuracy.
 *
 * Phase 3.5+ (future):
 *   Once we see chip-click telemetry, we'll evolve hot chips to be
 *   dynamic (Haiku call seeded with the response + recent thread
 *   context). The function signature here is a stable contract — the
 *   wire shape (kind: 'suggested_followups', data: { chips: string[] })
 *   doesn't change when the generator does.
 */

import type { RoutingTarget } from './router';

export interface FollowupChipsInput {
  /** Where the turn routed — drives which chip set is selected. */
  routingTarget: RoutingTarget;
  /**
   * True if the orchestrator emitted a DealScoreCard structured output
   * on this turn. When TRUE, chips lean toward "interrogate THIS deal"
   * (stress-test, projection, audit-trail). When FALSE on a deal-
   * scoring route, the agent likely asked a clarifying question or
   * refused — chips lean toward "tell me what you need".
   */
  dealScoreCardEmitted: boolean;
}

export interface FollowupChipsResult {
  /**
   * 3-4 chip strings to render below the assistant response. Order is
   * priority — first chip is the most likely next action. Chips are
   * plain text the frontend tap-to-prefills into the input (NOT
   * auto-sends — user reads + edits + sends). See Day 4.
   */
  chips: string[];
}

// ===== Curated chip pools =====

/**
 * After a successful deal score card lands — the user just got a
 * Deal Quality score + breakdown. The next natural questions for an
 * experienced investor:
 *   - "Can this deal survive a rate shock?" (stress-test)
 *   - "What does this look like over time?" (10-yr projection)
 *   - "Why this exact score?" (audit trail / explainability)
 *   - "What's the optimal exit?" (tax-aware hold period)
 *
 * Why these four and not others — deliberately AVOIDS:
 *   - "What's a cap rate?" — insults target user
 *   - "Tell me more" — generic, reveals nothing
 *   - "Save this deal" — that's a CTA on the card itself, not a chip
 */
const CHIPS_AFTER_DEAL_SCORE: string[] = [
  'Stress-test at 7% mortgage rates',
  'Show the 10-year projection',
  'Why this score? Show the audit trail',
  'What hold period optimizes after-tax IRR?',
];

/**
 * Deal-scoring route taken but no card emitted — agent asked a
 * clarifying question or there wasn't enough info. Push the user back
 * into a productive next step rather than leaving them stuck.
 *
 * Strategy-comparison chip ("Compare buy-and-hold vs BRRRR") removed
 * 2026-05-16 — Issue #101 (strategy comparison) is backlogged. Chips
 * must only reference features we can actually deliver today.
 */
const CHIPS_DEAL_SCORING_NO_CARD: string[] = [
  'Use a typical 25% down 30-yr fixed setup',
  'Analyze this as buy-and-hold',
  'Analyze this as BRRRR',
  'Walk me through what numbers you need',
];

/**
 * QA agent route — the user asked a methodology / how-the-platform-
 * works question. Push them toward putting the platform to work.
 *
 * The "Compare two properties side-by-side" chip from the original
 * pool was REMOVED 2026-05-16 — property-to-property comparison is
 * Phase 4b (Issue #102), not yet shipped. Restored when CompareCard
 * lands.
 */
const CHIPS_AFTER_QA: string[] = [
  'Analyze a property',
  'Run a sensitivity analysis on a deal',
  'Show me a sample analysis',
  'How would this apply to my portfolio?',
];

/**
 * Adversarial critic ran — user got a bear-case / counter-perspective
 * review. Natural follow-ups are "respond to the critique" or
 * "explore alternatives".
 *
 * "Compare this to alternative strategies" removed 2026-05-16 —
 * strategy comparison is Issue #101, backlogged.
 */
const CHIPS_AFTER_CRITIC: string[] = [
  'What changes if rates spike 2 points?',
  'Refine my assumptions and re-score',
  "What's the biggest risk in this deal?",
  'Show me the bull-case version',
];

/**
 * Tool-only route (resolve_property_inputs, profile_extraction, etc.).
 * These are usually setup turns — the agent did something behind the
 * scenes. Push toward the analysis moment.
 *
 * "Compare against my saved properties" removed 2026-05-16 — property
 * comparison is Issue #102, Phase 4b (not yet shipped).
 */
const CHIPS_AFTER_TOOL: string[] = [
  'Score this deal',
  'Show me what data you found',
  'Adjust the assumptions before scoring',
  'What rent estimate did you use?',
];

/**
 * Off-topic deflection — user asked something outside scope. The
 * deflection text already redirects them; chips give concrete on-topic
 * entry points without making them retype.
 */
const CHIPS_AFTER_DEFLECTION: string[] = [
  'Analyze a rental property',
  'Show me a Deal Quality Score example',
  'Walk me through institutional underwriting',
  'What does this platform do that Excel cannot?',
];

// ===== Generator =====

export function generateFollowupChips(
  input: FollowupChipsInput
): FollowupChipsResult {
  const { routingTarget, dealScoreCardEmitted } = input;

  // 1. Deal-scoring branch — split on whether a card actually rendered.
  if (routingTarget === 'agent:deal_scoring') {
    return {
      chips: dealScoreCardEmitted
        ? CHIPS_AFTER_DEAL_SCORE
        : CHIPS_DEAL_SCORING_NO_CARD,
    };
  }

  // 2. QA agent branch.
  if (routingTarget === 'agent:qa') {
    return { chips: CHIPS_AFTER_QA };
  }

  // 3. Adversarial critic branch.
  if (routingTarget === 'agent:adversarial_critic') {
    return { chips: CHIPS_AFTER_CRITIC };
  }

  // 4. Off-topic deflection.
  if (routingTarget === 'deflection:off_topic') {
    return { chips: CHIPS_AFTER_DEFLECTION };
  }

  // 5. Anything starting with 'tool:' — generic tool-only branch.
  if (typeof routingTarget === 'string' && routingTarget.startsWith('tool:')) {
    return { chips: CHIPS_AFTER_TOOL };
  }

  // Fallback — unknown route. Surface the universal entry points so the
  // user is never stranded. (This branch is unreachable in practice;
  // the router covers every case exhaustively, but TS doesn't know
  // that here without a narrowed union.)
  return { chips: CHIPS_AFTER_QA };
}
