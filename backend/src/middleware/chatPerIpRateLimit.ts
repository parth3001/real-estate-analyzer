/**
 * chatPerIpRateLimit — Day 11e (Issue E2, 2026-05-19).
 *
 * Per-IP analysis quota for ANONYMOUS chat users — closes the
 * cookie-clearing bypass on `chatSessionRateLimit`.
 *
 * THE PROBLEM
 * ───────────
 *
 * `chatSessionRateLimit` caps anonymous SESSIONS at 10 turns/24h —
 * but a user who hits that cap can clear cookies, get a fresh
 * sessionId, and run another 10 turns. The session-level cap was
 * never an abuse-prevention layer; it was a per-conversation
 * politeness boundary.
 *
 * Per Issue #105's locked pricing model, Layer 1 anonymous access is
 * supposed to be **5 free DEAL SCORES per IP / 24h**. The "5" is the
 * abuse line — beyond that, you sign up or you wait.
 *
 * THE IMPLEMENTATION
 * ──────────────────
 *
 * Keyed on the client's IP address. We track the SET of unique
 * sessionIds that have submitted chat turns from each IP. When that
 * set crosses 5, we return 429 with a friendly conversion prompt.
 *
 * Why count unique sessionIds (not turns)? A "score" is roughly one
 * session — the chat-first flow analyzes one property per
 * conversation. Counting turns would be more correct but harder to
 * count (would need to inspect tool calls per turn). Sessions are a
 * cleaner proxy and align with the user's mental model of "I ran
 * five deals today, now I have to sign up."
 *
 * AUTHENTICATED USERS BYPASS
 * ──────────────────────────
 *
 * `req.user.anonymous === false` (or absent) → no limit. Once a user
 * signs up, their abuse signal moves to per-user quotas (handled by
 * the orchestrator's cost-cap layer).
 *
 * STORAGE
 * ───────
 *
 * In-memory Map<ip, { sessions: Set<sessionId>; firstAt: number }>.
 * Process restart resets the table (feature, not bug — fresh limits
 * on deploys). When this becomes the bottleneck, swap to Redis with
 * the same key shape.
 *
 * IP DETECTION
 * ────────────
 *
 * Express's `req.ip` resolves via `trust proxy` (set in app.ts).
 * Falls back to `req.socket.remoteAddress` defensively. We do NOT
 * trust the X-Forwarded-For header directly — Express handles that
 * via trust-proxy config.
 *
 * Cost rationale: 5 anonymous scores × ~$0.30 worst-case per score
 * = $1.50 max anonymous spend per IP per day. Bounded.
 */

import { type Response, type NextFunction } from 'express';
import { type AuthenticatedRequest } from './auth';
import { logger } from '../utils/logger';

interface IpQuotaEntry {
  sessions: Set<string>;
  firstAt: number; // epoch ms — when the window started for this IP
}

/**
 * Max unique sessionIds per IP per window. Env-overridable so ops can
 * dial up/down without a redeploy. Default 5 per Issue #105.
 */
const MAX_SESSIONS_PER_IP = Number(
  process.env.CHAT_PER_IP_LIMIT ?? '5'
);
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const ipQuotas = new Map<string, IpQuotaEntry>();

/**
 * Master kill-switch. Defaults to ENABLED. Set to false to disable
 * per-IP limiting in incident response (e.g., legitimate testing
 * traffic from a single office IP).
 */
const ENABLED =
  (process.env.CHAT_PER_IP_LIMIT_ENABLED ?? 'true').toLowerCase() ===
  'true';

function sweepExpired(now: number): void {
  for (const [ip, entry] of ipQuotas) {
    if (entry.firstAt + WINDOW_MS < now) ipQuotas.delete(ip);
  }
}

/**
 * Resolve the client IP from the request. Honors Express's trust-proxy
 * config (set in app.ts based on deployment). Falls back to the raw
 * socket address. Returns 'unknown' if neither resolves — those
 * requests effectively share a quota, which is acceptable for a
 * defense-in-depth layer.
 */
function resolveClientIp(req: AuthenticatedRequest): string {
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

export function chatPerIpRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!ENABLED) {
    next();
    return;
  }

  // Authenticated users bypass. The per-IP layer exists ONLY to bound
  // anonymous abuse (cookie-clearing to reset the session cap).
  if (!req.user?.anonymous) {
    next();
    return;
  }

  const sessionId = (req.body as { sessionId?: string })?.sessionId;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    // chatIdentityMiddleware should have rejected this; defense in depth.
    next();
    return;
  }

  const ip = resolveClientIp(req);
  const now = Date.now();
  sweepExpired(now);

  let entry = ipQuotas.get(ip);
  if (!entry || entry.firstAt + WINDOW_MS < now) {
    // Fresh window for this IP — start tracking.
    entry = { sessions: new Set(), firstAt: now };
    ipQuotas.set(ip, entry);
  }

  // Add this session to the IP's tracked set. Adding an existing
  // sessionId is a no-op (Set semantics) — same session can keep
  // sending turns without burning quota.
  entry.sessions.add(sessionId);

  if (entry.sessions.size > MAX_SESSIONS_PER_IP) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.firstAt + WINDOW_MS - now) / 1000)
    );
    logger.warn('chatPerIpRateLimit: per-IP limit exceeded', {
      ip,
      sessions: entry.sessions.size,
      limit: MAX_SESSIONS_PER_IP,
      retryAfterSeconds,
    });
    res.status(429).json({
      error:
        `You've reached the daily limit of ${MAX_SESSIONS_PER_IP} free analyses. ` +
        'Sign up to keep analyzing — free during beta, no payment required.',
      retryAfterSeconds,
    });
    return;
  }

  next();
}

/**
 * Test-only helper to reset the in-memory store. Mirrors the
 * chatSessionRateLimit pattern so tests can run independently.
 */
export function __resetChatPerIpRateLimitForTests(): void {
  ipQuotas.clear();
}
