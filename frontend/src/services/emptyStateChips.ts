/**
 * emptyStateChips — chip set rendered in the chat's empty state.
 *
 * Phase 3+4 — chat-first IA, Day 5.
 *
 * Three target states (matching the rendering the user approved):
 *
 *   1. ANON or BRAND NEW USER, zero threads:
 *        Generic depth-revealing chips. Reveal platform breadth
 *        (stress-tests, comparisons, projections) at experienced-
 *        investor depth. No "What's a cap rate?" — see PRODUCT_CONTEXT
 *        target user notes.
 *
 *   2. RETURNING USER with 1+ thread, no current message:
 *        Top chip is "Continue: <latest title>" — surfaces the user's
 *        most recent work directly. Then 2-3 personalized cross-thread
 *        chips ("Compare <a> vs <b>" when 2+ threads exist) plus
 *        platform-level prompts ("How's my pipeline?", "Stress-test
 *        at 7% rates").
 *
 *   3. RETURNING USER with 1 thread:
 *        Hybrid — surface the one thread + the generic depth chips.
 *
 * The generator is pure and side-effect-free. The host (ChatOverlay
 * empty state) reads threadStore + auth context, calls this, renders
 * the chips. Tap-to-prefill semantics are shared with the in-thread
 * chip row (FollowupChips component).
 *
 * Why deterministic, not LLM-driven:
 *   Empty state runs on every cold load — we don't want to fire a
 *   Haiku call per page visit. The chip pool here is small and curated
 *   enough that personalization can stay rule-based.
 */

import type { ThreadRecord } from './threadStore';

export interface EmptyStateChipsInput {
  /** Whether the user is authenticated (has a real account, not ghost). */
  isAuthed: boolean;
  /**
   * The user's prior threads, sorted newest-first. Empty array means
   * brand-new user. Used to surface "Continue: ..." + cross-thread
   * comparison chips. We only look at the first N — see PERSONALIZED_PEEK.
   */
  threads: ThreadRecord[];
  /** Optional first name for greeting copy. Not used for chips themselves. */
  firstName?: string;
}

export interface EmptyStateChipsResult {
  /** 3-5 chips for the empty state. */
  chips: string[];
  /**
   * Greeting headline copy. Returning users get a personalized line;
   * new users get the platform-positioning headline.
   */
  headline: string;
  /** Subhead — secondary line below the headline. */
  subhead: string;
}

// Chip pool for the brand-new / anon state. Each is at experienced-
// investor depth, reveals a different platform capability, and is
// phrased as a productive starting prompt (NOT a question to the
// platform — the user is the one asking).
//
// "Compare buy-and-hold vs BRRRR for the same property" removed
// 2026-05-16 — strategy comparison (Issue #101) is backlogged.
// Chips must only reference features we can deliver today.
const GENERIC_DEPTH_CHIPS: string[] = [
  'Analyze a rental property',
  'Paste a Zillow / Redfin listing URL',
  'Stress-test a deal at 7% mortgage rates',
  "Show me what institutional underwriting looks like",
];

// Cross-thread + platform-level chips for returning users. These
// assume the user has data — so we can reference "my portfolio" etc.
const RETURNING_PLATFORM_CHIPS: string[] = [
  "How's my portfolio doing this quarter?",
  'Stress-test my pipeline at 7% rates',
  "What's the bear case on my latest deal?",
  'Run a sensitivity analysis on my last property',
];

/*
 * Note: a `compressTitleForChip()` helper used to live here for the
 * "Continue: <title>" / "Review my <title>" personalized chips. Those
 * chips were removed 2026-05-17 (Issue #113) because the agent has no
 * mechanism today to resolve thread-title references back to specific
 * DecisionEvents. When that capability ships, restore the helper +
 * the personalized chips together.
 */

export function generateEmptyStateChips(
  input: EmptyStateChipsInput
): EmptyStateChipsResult {
  const { isAuthed, threads, firstName } = input;

  // ===== Brand-new / anon — generic depth chips =====
  if (threads.length === 0) {
    return {
      chips: GENERIC_DEPTH_CHIPS,
      headline: 'Institutional-grade analysis, in plain English.',
      subhead:
        'Tell me about a property, paste a listing, or ask anything about underwriting.',
    };
  }

  // ===== Returning user =====
  //
  // The sidebar already shows their recent threads, time-grouped. The
  // empty-state chips should NOT duplicate that picker — they should
  // offer NEW actions the agent can ACTUALLY handle today.
  //
  // What we removed 2026-05-17 (and why):
  //   - "Continue: <title>" — semi-dead-end. The chip text was the
  //     thread TITLE, which (when sent as a chat message) becomes a
  //     new user turn the agent has no way to resolve as "open that
  //     thread." The sidebar is the right way to resume; chips
  //     shouldn't duplicate it.
  //   - "Review my <title>" — same problem.
  //   - "Stress-test my latest deal at 7% rates" — the agent has NO
  //     mechanism today to resolve "my latest deal" to a specific
  //     DecisionEvent and re-run with overrides. Tapping the chip
  //     produced "Chat turn failed." (Issue #113.)
  //   - "What's the bear case on my latest analysis?" — same root cause.
  //
  // Until we ship the "look up my latest deal" agent capability
  // (Issue #113), returning-user empty-state shows the SAME chip set
  // as a brand-new user. Personalization lives in the sidebar (thread
  // history is the personalization). The greeting + subhead address
  // the user by name; the chips give them safe new actions.
  const greeting =
    firstName && firstName.trim().length > 0
      ? `Welcome back, ${firstName.trim().split(/\s+/)[0]}.`
      : 'Welcome back.';
  const subhead = isAuthed
    ? `Your prior ${threads.length === 1 ? 'analysis is' : 'analyses are'} in the sidebar — or start a new one.`
    : 'Pick up where you left off, or start something new.';

  return {
    chips: GENERIC_DEPTH_CHIPS,
    headline: greeting,
    subhead,
  };
}
