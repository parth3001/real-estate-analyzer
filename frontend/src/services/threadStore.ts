/**
 * threadStore — localStorage-backed thread index for the chat sidebar.
 *
 * WHY this exists (Phase 3+4 — chat-first IA):
 *
 * The new post-login experience lands users at /app (chat) and surfaces
 * recent threads in a left sidebar, time-grouped (Today / Yesterday /
 * This week / Earlier) and color-coded by deal-quality score. Eventually
 * this index lives server-side (queried from ConversationEvent and
 * DecisionEvent collections), but for Phase 3+4 we ship a localStorage
 * index that ChatOverlay writes on each turn — gets us the UX without a
 * new endpoint, and the migration path is clean: replace getThreads()
 * with a React-Query call to a future GET /api/chat/threads.
 *
 * Why localStorage (not sessionStorage like the sessionId):
 *   - The sidebar must survive tab close + reopen — that's the whole
 *     point of "your analyses are saved." sessionStorage would drop on
 *     tab close and the sidebar would always look empty.
 *   - Ghost users (anon) and authed users both write here; the claim
 *     flow rewrites the sessionId, but the thread records survive and
 *     just keep working (we re-key on the next write).
 *
 * Storage shape: an array of ThreadRecord, JSON-encoded under
 * `reanalyzr.chat.threads`. Last-write-wins on upsert. Capped at
 * MAX_THREADS to keep the sidebar useful (oldest pruned first).
 *
 * Subscription: a tiny pub/sub so the sidebar can re-render when
 * ChatOverlay writes a new entry mid-stream (no react-query, no zustand
 * — three lines of code does it).
 */

const STORAGE_KEY = 'reanalyzr.chat.threads';
const MAX_THREADS = 100;

export interface ThreadRecord {
  /** Stable thread id — for now, the chat sessionId. */
  id: string;
  /**
   * Display title — derived from the first user message in the thread,
   * truncated to ~60 chars. May be re-derived if the user edits later.
   */
  title: string;
  /** ISO timestamp of last activity (any message append). */
  lastActivityAt: string;
  /**
   * Last DecisionEvent.dealQuality score seen for this thread, if any.
   * Drives the score-color dot in the sidebar row. Per
   * PRODUCT_2.0_VISION / Apple HIG, this is the at-a-glance signal users
   * want when scanning their analysis history.
   */
  dealQualityScore?: number;
  /**
   * Optional preview snippet of the latest assistant message, ~80 chars.
   * Currently unused in the sidebar (title-only design), but stored for
   * future hover-card / search use.
   */
  preview?: string;
}

// ===== Internal =====

function safeRead(): ThreadRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Mild shape-validation — drop any malformed entries instead of
    // throwing, so a single corrupted record doesn't kill the sidebar.
    return parsed.filter(
      (r): r is ThreadRecord =>
        r != null &&
        typeof r === 'object' &&
        typeof (r as ThreadRecord).id === 'string' &&
        typeof (r as ThreadRecord).title === 'string' &&
        typeof (r as ThreadRecord).lastActivityAt === 'string'
    );
  } catch {
    return [];
  }
}

function safeWrite(records: ThreadRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    // Sort newest-first + cap to MAX_THREADS before persisting. The cap
    // happens here (not in upsert) so any future bulk-import path is
    // also bounded.
    const sorted = [...records].sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    );
    const capped = sorted.slice(0, MAX_THREADS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // Quota exceeded, private-mode Safari, etc. — fail soft. The sidebar
    // will just look like the in-memory state until next session.
  }
}

// ===== Pub/sub =====

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ===== Public API =====

export function getThreads(): ThreadRecord[] {
  return safeRead();
}

/**
 * Insert-or-update by id. Patch semantics — only the fields present in
 * `patch` overwrite; everything else is preserved. `lastActivityAt`
 * always advances to `now` unless the caller provides an explicit value.
 */
export function upsertThread(
  patch: Partial<ThreadRecord> & { id: string }
): void {
  const records = safeRead();
  const existing = records.find((r) => r.id === patch.id);
  const next: ThreadRecord = {
    id: patch.id,
    title: patch.title ?? existing?.title ?? 'New conversation',
    lastActivityAt: patch.lastActivityAt ?? new Date().toISOString(),
    dealQualityScore:
      patch.dealQualityScore !== undefined
        ? patch.dealQualityScore
        : existing?.dealQualityScore,
    preview: patch.preview !== undefined ? patch.preview : existing?.preview,
  };
  const without = records.filter((r) => r.id !== patch.id);
  safeWrite([next, ...without]);
  emit();
}

/**
 * Task #23: rename a thread. Thin wrapper around upsertThread that
 * normalizes the title (trim, truncate) and silently no-ops on empty
 * input so the row can't end up titled with whitespace from a
 * stray Enter press. Once renamed, the title survives subsequent
 * upserts because ChatOverlay only writes `title` on the first turn
 * (line 526-527) — all later turns patch lastActivityAt/score/preview
 * without touching title.
 */
export function renameThread(id: string, rawTitle: string): void {
  const cleaned = rawTitle.replace(/\s+/g, ' ').trim();
  if (!cleaned) return;
  const truncated = cleaned.length > 80 ? cleaned.slice(0, 79).trimEnd() + '…' : cleaned;
  upsertThread({ id, title: truncated });
}

export function removeThread(id: string): void {
  const records = safeRead().filter((r) => r.id !== id);
  safeWrite(records);
  emit();
}

export function clearThreads(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* fail soft */
  }
  emit();
}

// ===== Time-grouping helper =====

export interface ThreadGroups {
  today: ThreadRecord[];
  yesterday: ThreadRecord[];
  thisWeek: ThreadRecord[];
  earlier: ThreadRecord[];
}

/**
 * Bucket threads by recency. Buckets are exclusive: a thread shows up
 * in exactly one. "This week" is the calendar week up to yesterday
 * (today + yesterday are their own buckets), Monday-anchored is too
 * culture-specific so we just use rolling 7 days.
 */
export function groupByTime(
  records: ThreadRecord[],
  now: Date = new Date()
): ThreadGroups {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: ThreadGroups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const r of records) {
    const t = new Date(r.lastActivityAt).getTime();
    if (Number.isNaN(t)) {
      groups.earlier.push(r);
      continue;
    }
    if (t >= startOfToday.getTime()) groups.today.push(r);
    else if (t >= startOfYesterday.getTime()) groups.yesterday.push(r);
    else if (t >= sevenDaysAgo.getTime()) groups.thisWeek.push(r);
    else groups.earlier.push(r);
  }

  return groups;
}

// ===== Derive title from a user message =====

/**
 * Compress a user-typed message into a sidebar title. Strips leading
 * whitespace, collapses internal whitespace, truncates to maxLen with a
 * single-char ellipsis. Defensive against empty / whitespace-only input.
 */
export function deriveTitle(userMessage: string, maxLen = 60): string {
  const cleaned = userMessage.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New conversation';
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…';
}
