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

function isUsableChip(chip: string): boolean {
  return typeof chip === 'string' && chip.trim().length > 0;
}

function hasBeginnerCopy(chip: string): boolean {
  const lower = chip.toLowerCase();
  return BEGINNER_BLACKLIST.some((bad) => lower.includes(bad));
}

describe('generateEmptyStateChips — brand-new state', () => {
  it('returns generic depth chips + platform headline when no threads', () => {
    const result = generateEmptyStateChips({ isAuthed: false, threads: [] });
    expect(result.headline.toLowerCase()).toContain('institutional');
    expect(result.chips.length).toBe(4);
    // Every chip should be usable and pro-depth.
    for (const c of result.chips) {
      expect(isUsableChip(c)).toBe(true);
      expect(hasBeginnerCopy(c)).toBe(false);
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

describe('generateEmptyStateChips — returning user (1 thread)', () => {
  it('top chip is "Continue: <title>" and greeting includes firstName', () => {
    const threads = [
      makeThread({ id: 't1', title: 'analyze 1837 Walnut Way Anna TX' }),
    ];
    const result = generateEmptyStateChips({
      isAuthed: true,
      threads,
      firstName: 'Parth',
    });
    expect(result.headline).toMatch(/Welcome back, Parth/);
    expect(result.chips[0].startsWith('Continue:')).toBe(true);
    // The "analyze" verb should be stripped from the chip text.
    expect(result.chips[0].toLowerCase()).not.toMatch(/continue: analyz/);
    expect(result.chips[0]).toContain('1837 Walnut Way');
  });

  it('falls back to a generic greeting when firstName is missing', () => {
    const threads = [makeThread({ id: 't1', title: '5 Oak Ave' })];
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    expect(result.headline).toMatch(/Welcome back/);
    expect(result.headline).not.toMatch(/undefined|null/);
  });
});

describe('generateEmptyStateChips — returning user (2+ threads)', () => {
  it('includes a "Compare A vs B" chip referencing the top two titles', () => {
    const threads = [
      makeThread({ id: 't1', title: '411 Oak Boulevard' }),
      makeThread({ id: 't2', title: '336 Highland Drive' }),
      makeThread({ id: 't3', title: '12 Pine Street' }),
    ];
    const result = generateEmptyStateChips({
      isAuthed: true,
      threads,
      firstName: 'Parth',
    });
    const compareChip = result.chips.find((c) => c.startsWith('Compare '));
    expect(compareChip).toBeDefined();
    expect(compareChip).toContain('411 Oak');
    expect(compareChip).toContain('336 Highland');
  });

  it('caps chip count at 4 even with many threads', () => {
    const threads: ThreadRecord[] = Array.from({ length: 10 }).map((_, i) =>
      makeThread({ id: `t${i}`, title: `Property ${i}` })
    );
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    expect(result.chips.length).toBeLessThanOrEqual(4);
  });

  it('subhead references the user thread count when authed', () => {
    const threads = [
      makeThread({ id: 't1', title: 'Deal A' }),
      makeThread({ id: 't2', title: 'Deal B' }),
    ];
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    expect(result.subhead.toLowerCase()).toMatch(/analyses|sidebar/);
  });
});

describe('generateEmptyStateChips — title compression', () => {
  it('truncates a very long thread title with an ellipsis', () => {
    const longTitle = 'a'.repeat(200);
    const threads = [makeThread({ id: 't1', title: longTitle })];
    const result = generateEmptyStateChips({ isAuthed: true, threads });
    const continueChip = result.chips[0];
    expect(continueChip.length).toBeLessThan(60);
    expect(continueChip.endsWith('…')).toBe(true);
  });
});
