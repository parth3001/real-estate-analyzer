/**
 * threadStore — unit tests covering:
 *   - upsert / get / remove round-trip with localStorage persistence
 *   - last-write-wins patch semantics on partial upserts
 *   - lastActivityAt sort + capping
 *   - subscription / change notifications
 *   - groupByTime bucketing across day boundaries
 *   - deriveTitle whitespace + truncation behavior
 *
 * These tests are deliberately small + deterministic — threadStore is
 * the source of truth for the chat sidebar (Phase 3+4) and we want any
 * regression in its persistence semantics to fail loudly in CI.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearThreads,
  deriveTitle,
  getThreads,
  groupByTime,
  removeThread,
  subscribe,
  upsertThread,
} from '../threadStore';

beforeEach(() => {
  localStorage.clear();
});

describe('threadStore — upsert / get', () => {
  it('returns [] when nothing has been written', () => {
    expect(getThreads()).toEqual([]);
  });

  it('persists a thread and reads it back', () => {
    upsertThread({ id: 't1', title: 'Analyze 123 Main St' });
    const threads = getThreads();
    expect(threads).toHaveLength(1);
    expect(threads[0].id).toBe('t1');
    expect(threads[0].title).toBe('Analyze 123 Main St');
    expect(typeof threads[0].lastActivityAt).toBe('string');
  });

  it('patches existing fields without dropping unrelated ones', () => {
    upsertThread({ id: 't1', title: 'First version', preview: 'hello' });
    upsertThread({ id: 't1', dealQualityScore: 87 });
    const t = getThreads().find((r) => r.id === 't1')!;
    expect(t.title).toBe('First version');
    expect(t.preview).toBe('hello');
    expect(t.dealQualityScore).toBe(87);
  });

  it('keeps the most-recent record at index 0', async () => {
    upsertThread({ id: 'old', title: 'A' });
    // Small delay so the timestamps differ at ms resolution.
    await new Promise((resolve) => setTimeout(resolve, 5));
    upsertThread({ id: 'new', title: 'B' });
    expect(getThreads()[0].id).toBe('new');
  });

  it('removeThread deletes by id', () => {
    upsertThread({ id: 't1', title: 'A' });
    upsertThread({ id: 't2', title: 'B' });
    removeThread('t1');
    const remaining = getThreads();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('t2');
  });

  it('clearThreads wipes the index', () => {
    upsertThread({ id: 't1', title: 'A' });
    clearThreads();
    expect(getThreads()).toEqual([]);
  });
});

describe('threadStore — subscription', () => {
  it('notifies subscribers on upsert and remove', () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    upsertThread({ id: 't1', title: 'A' });
    expect(fn).toHaveBeenCalledTimes(1);
    upsertThread({ id: 't1', preview: 'x' });
    expect(fn).toHaveBeenCalledTimes(2);
    removeThread('t1');
    expect(fn).toHaveBeenCalledTimes(3);
    unsub();
  });

  it('unsubscribe stops further notifications', () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    unsub();
    upsertThread({ id: 't1', title: 'A' });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('threadStore — groupByTime', () => {
  // Anchor "now" to a known moment so all assertions are deterministic
  // regardless of when the test runs.
  const now = new Date('2026-05-16T15:00:00.000Z');

  function makeRecord(id: string, lastActivityAt: string) {
    return { id, title: id, lastActivityAt };
  }

  it('buckets today / yesterday / this week / earlier correctly', () => {
    const today = makeRecord('today', '2026-05-16T08:00:00.000Z');
    const yesterday = makeRecord('yesterday', '2026-05-15T20:00:00.000Z');
    const fourDaysAgo = makeRecord('four', '2026-05-12T10:00:00.000Z');
    const ancient = makeRecord('ancient', '2026-01-01T00:00:00.000Z');

    const groups = groupByTime(
      [today, yesterday, fourDaysAgo, ancient],
      now
    );

    expect(groups.today.map((r) => r.id)).toEqual(['today']);
    expect(groups.yesterday.map((r) => r.id)).toEqual(['yesterday']);
    expect(groups.thisWeek.map((r) => r.id)).toEqual(['four']);
    expect(groups.earlier.map((r) => r.id)).toEqual(['ancient']);
  });

  it('puts records with invalid timestamps in "earlier" rather than dropping', () => {
    const bad = makeRecord('bad', 'not-a-date');
    const groups = groupByTime([bad], now);
    expect(groups.earlier).toHaveLength(1);
    expect(groups.today).toHaveLength(0);
  });
});

describe('threadStore — deriveTitle', () => {
  it('falls back to placeholder for empty / whitespace input', () => {
    expect(deriveTitle('')).toBe('New conversation');
    expect(deriveTitle('   \n  ')).toBe('New conversation');
  });

  it('collapses internal whitespace', () => {
    expect(deriveTitle('Analyze   123\nMain St')).toBe('Analyze 123 Main St');
  });

  it('truncates with ellipsis past maxLen', () => {
    const long = 'a'.repeat(120);
    const title = deriveTitle(long, 20);
    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(20);
  });
});
