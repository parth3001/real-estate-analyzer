/**
 * emptyStateChips — unit tests.
 *
 * Coverage:
 *   1. Brand-new user (zero threads): generic depth chips + platform
 *      headline
 *   2. Returning user with 1 thread: "Continue: ..." chip + greeting
 *      with firstName
 *   3. Returning user with 2+ threads: "Continue" + "Compare A vs B"
 *      chips, both pulling from the right thread records
 *   4. Title compression strips a leading "analyze" verb
 *   5. Long titles truncate with an ellipsis
 *   6. No chip is empty / whitespace
 *   7. No chip embeds beginner copy (mirror of the backend chip-pool
 *      regression guard — see followupChips.test.ts)
 */

import { describe, expect, it } from 'vitest';
import { generateEmptyStateChips } from '../emptyStateChips';
import type { ThreadRecord } from '../threadStore';

function makeThread(
  partial: Partial<ThreadRecord> & { id: string; title: string }
): ThreadRecord {
  return {
    lastActivityAt: new Date().toISOString(),
    ...partial,
  };
}

const BEGINNER_BLACKLIST = [
  "what's a cap rate",
  'what is cap rate',
  'beginner',
];

// Mirror of the backend chip-pool guard — chips MUST NOT reference
// features we haven't shipped. Strategy comparison (Issue #101) +
// property-to-property comparison (Issue #102) are out until they
// ship. See backend/src/agents/orchestrator/__tests__/followupChips.test.ts
// for the same guard on the in-thread chip pools.
const UNSHIPPED_FEATURE_BLACKLIST = [
  'buy-and-hold vs brrrr',
  'brrrr vs buy-and-hold',
  'compare two properties',
  'compare against my saved',
  'side-by-side',
  // Issue #113 — the agent has no mechanism today to resolve
  // "my latest deal" or "my latest analysis" to a specific DecisionEvent
  // and re-run with overrides. Chips making this assumption produce
  // "Chat turn failed" when tapped. Restore when the recall capability
  // ships.
  'my latest deal',
  'my latest analysis',
];

function isUsableChip(chip: string): boolean {
  return typeof chip === 'string' && chip.trim().length > 0;
}

function hasBeginnerCopy(chip: string): boolean {
  const lower = chip.toLowerCase();
  return BEGINNER_BLACKLIST.some((bad) => lower.includes(bad));
}

function hasUnshippedFeatureCopy(chip: string): boolean {
  const lower = chip.toLowerCase();
  return UNSHIPPED_FEATURE_BLACKLIST.some((bad) => lower.includes(bad));
}

describe('generateEmptyStateChips — brand-new state', () => {
  it('returns generic depth chips + platform headline when no threads', () => {
    const result = generateEmptyStateChips({ isAuthed: false, threads: [] });
    expect(result.headline.toLowerCase()).toContain('institutional');
    expect(result.chips.length).toBe(4);
    // Every chip should be usable, pro-depth, and reference a feature
    // we actually ship.
    for (const c of result.chips) {
      expect(isUsableChip(c)).toBe(true);
      expect(hasBeginnerCopy(c)).toBe(false);
      expect(hasUnshippedFeatureCopy(c)).toBe(false);
    }
  });

  it('chip set surfaces platform-window-display capabilities', () => {
    const result = generateEmptyStateChips({ isAuthed: false, threads: [] });
    const joined = result.chips.join(' ').toLowerCase();
    // Stress-test / compare / institutional underwriting are the
    // capability tells.
    expect(joined).toMatch(/stress|compare|institutional|brrrr/);
  });
});

describe('generateEmptyStateChips — returning user (1+ threads)', () => {
  it('uses the SAME generic chip set as brand-new users (Issue #113)', () => {
    // Personalized chips like "Continue: <title>" and "Stress-test my
    // latest deal at 7% rates" were removed 2026-05-17 — they implied
    // capabilities (recall + open a prior thread, resolve "my latest
    // deal" to a DecisionEvent and apply overrides) the agent doesn't
    // have today. Tapping them produced "Chat turn failed" because the
    // agent received a chat message it couldn't resolve.
    //
    // Until Issue #113 ships the "look up my latest deal" agent
    // capability, returning users see the same safe generic chips.
    // The sidebar IS the personalization — recent threads are listed
    // there.
    const threads = [
      makeThread({ id: 't1', title: 'analyze 1837 Walnut Way Anna TX' }),
    ];
    const result = generateEmptyStateChips({
      isAuthed: true,
      threads,
      firstName: 'Parth',
    });

    // Personalized "Continue:" and "Review my" chips must NOT appear.
    expect(result.chips.some((c) => c.startsWith('Continue:'))).toBe(false);
    expect(result.chips.some((c) => c.startsWith('Review my'))).toBe(false);
    expect(
      result.chips.some((c) => c.toLowerCase().includes('my latest'))
    ).toBe(false);
    expect(
      result.chips.some((c) => c.toLowerCase().includes('my latest deal'))
    ).toBe(false);

    // Greeting still personalizes (sidebar + greeting carry the
    // "we know you" signal, not chips).
    expect(result.headline).toMatch(/Welcome back, Parth/);
  });

  it('falls back to a generic greeting when firstName is missing', () => {
    const threads = [makeThread({ id: 't1', title: '5 Oak Ave' })];
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    expect(result.headline).toMatch(/Welcome back/);
    expect(result.headline).not.toMatch(/undefined|null/);
  });

  it('subhead references the sidebar for prior analyses when authed', () => {
    const threads = [
      makeThread({ id: 't1', title: 'Deal A' }),
      makeThread({ id: 't2', title: 'Deal B' }),
    ];
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    expect(result.subhead.toLowerCase()).toMatch(/sidebar/);
  });

  it('returns the same chip set regardless of thread count (1, 2, or 10)', () => {
    const oneThread = generateEmptyStateChips({
      isAuthed: true,
      threads: [makeThread({ id: 't1', title: 'A' })],
    }).chips;
    const tenThreads = generateEmptyStateChips({
      isAuthed: true,
      threads: Array.from({ length: 10 }).map((_, i) =>
        makeThread({ id: `t${i}`, title: `Property ${i}` })
      ),
    }).chips;
    expect(oneThread).toEqual(tenThreads);
  });
});
