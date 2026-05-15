/**
 * chatIdentityMiddleware — W6-S2.5.
 *
 * Resolves the request to ONE of two identity sources:
 *
 *   1. Authenticated user (Bearer JWT present) — delegate to authMiddleware.
 *      Sets `req.user.anonymous = false`.
 *
 *   2. Anonymous user (no Bearer JWT, but valid `sessionId` in body) —
 *      find-or-create a "ghost" User record keyed by the sessionId, attach
 *      it to `req.user`. Sets `req.user.anonymous = true`.
 *
 * The ghost-user pattern exists because the substrate event collections
 * (BaseEvent and all 11 derived types) require `userId: ObjectId` —
 * dropping authMiddleware alone breaks the event-persist step in
 * `handleTurn()`. Synthesizing a User record per anon session gives every
 * substrate write a stable, queryable identity, AND turns "save the deal
 * from a public URL" into a free side-effect: every chat turn already
 * persists a conversation_event under the ghost; magic-link signup just
 * sets the real email and flips `anonymous: false`. The deal is
 * "claimed," not migrated.
 *
 * Cost containment:
 *   - One Mongo write per FIRST anon turn per session (find-or-create).
 *     Subsequent turns are find-only (sub-millisecond on the indexed
 *     anonymousSessionId field).
 *   - Ghost rows are clearly distinguishable (`anonymous: true` index)
 *     so a TTL/cleanup job can sweep abandoned sessions later.
 *
 * Failure modes:
 *   - Bearer token present but invalid → authMiddleware 401s (correct;
 *     stale token is a client bug, not "anonymous").
 *   - No Bearer AND no sessionId → 400 (the chat client always sends one;
 *     the absence indicates a request that doesn't belong on this route).
 *   - No Bearer AND malformed sessionId → 400.
 */

import { type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from './auth';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const SessionIdSchema = z.string().uuid();

/**
 * Synthetic email for ghost users. Format chosen to:
 *   1. Pass the User schema's email regex (`.app` TLD = 3 chars, fits `\w{2,3}`)
 *   2. Be visually obvious in admin tools (`anon-...@anon.app`)
 *   3. Be globally unique (UUID guarantees no collision)
 */
function ghostEmailFor(sessionId: string): string {
  return `anon-${sessionId}@anon.app`;
}

export async function chatIdentityMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Path A — Bearer token present → real auth flow
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Delegate. authMiddleware sets req.user from JWT or 401s.
    // We wrap `next` to tag the resolved user as non-anonymous so
    // downstream middleware (rate limit) and handlers can distinguish.
    const wrappedNext: NextFunction = (err) => {
      if (!err && req.user) {
        req.user.anonymous = false;
      }
      next(err);
    };
    return authMiddleware(req, res, wrappedNext);
  }

  // Path B — anonymous, find-or-create ghost user keyed by sessionId
  const sessionIdRaw = (req.body as { sessionId?: unknown })?.sessionId;
  const parsed = SessionIdSchema.safeParse(sessionIdRaw);
  if (!parsed.success) {
    res.status(400).json({
      error: 'sessionId required for anonymous requests',
    });
    return;
  }
  const sessionId = parsed.data;

  try {
    let ghost = await User.findOne({ anonymousSessionId: sessionId }).select(
      '_id email anonymous anonymousSessionId'
    );
    if (!ghost) {
      ghost = await User.create({
        email: ghostEmailFor(sessionId),
        firstName: '',
        lastName: '',
        anonymous: true,
        anonymousSessionId: sessionId,
        role: 'user',
        isVerified: false,
      });
      logger.info('[chatIdentity] ghost user created', {
        userId: ghost._id.toString(),
        sessionId,
      });
    }

    req.user = {
      id: (ghost._id as { toString(): string }).toString(),
      email: ghost.email,
      role: 'user',
      anonymous: true,
    };
    next();
  } catch (err) {
    logger.error('[chatIdentity] ghost lookup/create failed', {
      sessionId,
      error: err instanceof Error ? err.stack ?? err.message : String(err),
    });
    res.status(500).json({ error: 'Identity resolution failed.' });
  }
}
