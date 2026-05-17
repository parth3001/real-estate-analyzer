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

// Number of recent threads we consider for personalization. Three is
// plenty — we surface the latest as "Continue", and the latest two for
// the comparison chip. Anything past that is sidebar territory.
const PERSONALIZED_PEEK = 3;

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

/**
 * Compress a thread title into a chip-friendly fragment. Strips the
 * "analyze" verb if present (the chip already has "Continue:" framing,
 * the verb is redundant), and truncates to ~40 chars so the chip stays
 * on one line in the sidebar/empty-state.
 */
function compressTitleForChip(title: string, maxLen = 40): string {
  // Strip a leading "analyze" / "analyse" verb to keep the chip terse.
  const stripped = title.replace(/^analyz[es]e?\s+/i, '');
  const cleaned = stripped.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…';
}

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

  // ===== Returning user — personalize =====
  const recent = threads.slice(0, PERSONALIZED_PEEK);
  const latest = recent[0];
  const second = recent[1];

  const chips: string[] = [];

  // 1. Continue the most recent thread.
  chips.push(`Continue: ${compressTitleForChip(latest.title)}`);

  // 2. Mention there are more if 2+ threads exist — but DO NOT offer
  //    the "Compare A vs B" chip yet. Property-to-property comparison
  //    is Phase 4b (Issue #102), not yet shipped. Surfacing the chip
  //    here would lead users to a dead-end answer from the agent.
  //    Replaced with a "review prior" prompt that the chat CAN handle.
  if (second) {
    chips.push(`Review my ${compressTitleForChip(second.title, 30)}`);
  }

  // 3. Platform-level depth chip. For users without a portfolio /
  //    pipeline yet, the "how's my portfolio doing" chip would be a
  //    dead end — Phase 3 doesn't know yet. Keep it depth-flavored
  //    but not data-dependent.
  chips.push('Stress-test my latest deal at 7% rates');

  // 4. One more cross-cutting capability chip.
  chips.push("What's the bear case on my latest analysis?");

  // Cap at 4 — keeps the empty state visually calm.
  const finalChips = chips.slice(0, 4);

  const greeting =
    firstName && firstName.trim().length > 0
      ? `Welcome back, ${firstName.trim().split(/\s+/)[0]}.`
      : 'Welcome back.';
  // Subhead nudges toward continuing recent work without prescribing.
  const subhead = isAuthed
    ? `Your last ${threads.length === 1 ? 'analysis is' : `${recent.length} analyses are`} in the sidebar — or start something new.`
    : 'Pick up where you left off, or start something new.';

  return {
    chips: finalChips,
    headline: greeting,
    subhead,
  };
}
