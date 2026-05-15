/**
 * chatSessionRateLimit — W6-S2.5.
 *
 * Per-session turn quota for ANONYMOUS chat users.
 *
 *   - Authenticated users skip this limit (they have IP-scoped
 *     `calculationRateLimit` already; once they're paying customers we
 *     trust them to behave).
 *   - Anonymous (ghost-user) sessions get **10 turns per 24h**, keyed on
 *     the chat client's `sessionId` (UUID, sent in every POST body).
 *   - 429 response carries `retryAfterSeconds` so the chat overlay can
 *     surface a clear "you've used your free analyses" message that
 *     becomes the natural signup prompt.
 *
 * Cost rationale (Marcus 2026-05-14 conversation):
 *   At ~$0.05-0.15 per orchestrator turn (LLM tokens for the agent
 *   mesh), 10 turns/session = ~$0.50-$1.50 max cost per anonymous
 *   visitor. Generous enough to feel exploratory, tight enough to cap
 *   the unit-economics downside at zero conversions.
 *
 * Storage:
 *   In-memory Map. Process restart resets quotas (feature, not bug, at
 *   this stage — fresh limits on deploys is fine). When this becomes
 *   the bottleneck, swap to Redis with the same key shape.
 */

import { type Response, type NextFunction } from 'express';
import { type AuthenticatedRequest } from './auth';
import { logger } from '../utils/logger';

interface SessionQuotaEntry {
  count: number;
  resetAt: number; // epoch ms
}

const MAX_TURNS_PER_SESSION = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const sessionQuotas = new Map<string, SessionQuotaEntry>();

/**
 * Lightweight LRU-ish cleanup. We could let the Map grow unbounded since
 * memory pressure is tiny (each entry is ~50 bytes), but a sweep on each
 * write keeps it self-healing during long-running processes.
 */
function sweepExpired(now: number): void {
  for (const [sid, entry] of sessionQuotas) {
    if (entry.resetAt < now) sessionQuotas.delete(sid);
  }
}

export function chatSessionRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Authenticated users bypass — they have their own IP limit and are
  // converting/paying. Anonymous-only quota.
  if (!req.user?.anonymous) {
    next();
    return;
  }

  const sessionId = (req.body as { sessionId?: string })?.sessionId;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    // chatIdentityMiddleware should have rejected this already; defense
    // in depth — pass through to body validation.
    next();
    return;
  }

  const now = Date.now();
  // Cheap periodic sweep (only on first session-write per minute is
  // overkill; doing it on every call is also fine at our scale).
  sweepExpired(now);

  const entry = sessionQuotas.get(sessionId);

  // Fresh window
  if (!entry || entry.resetAt < now) {
    sessionQuotas.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  // Quota exhausted
  if (entry.count >= MAX_TURNS_PER_SESSION) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    logger.info('[chatSessionRateLimit] quota hit', {
      sessionId,
      count: entry.count,
      retryAfterSeconds,
    });
    res.status(429).json({
      error:
        "You've reached the free analysis limit for this session. " +
        'Sign up to keep going — no payment required during beta.',
      retryAfterSeconds,
    });
    return;
  }

  entry.count += 1;
  next();
}

/**
 * Test-only helper. Clears in-memory quota state so tests can run in
 * isolation. Not exported from any index — callers must import directly.
 */
export function __resetChatSessionRateLimitForTests(): void {
  sessionQuotas.clear();
}
