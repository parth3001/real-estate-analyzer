/**
 * chatSessionMergeService — W6-S5.
 *
 * The "claim my anonymous chat session" operation. Triggered by the
 * frontend AFTER magic-link signup completes:
 *
 *   1. Anonymous user types a property on /app
 *   2. Backend creates a ghost User (`anonymous: true`, keyed by
 *      `anonymousSessionId`). Substrate writes every event under
 *      that ghost's _id.
 *   3. User clicks "Add to my portfolio" → magic-link signup
 *   4. Magic link verified → real User now exists for the email
 *   5. Frontend calls POST /api/chat/claim-session { sessionId }
 *      → THIS SERVICE runs the merge: reassign every event from
 *        ghost → real user, then delete the ghost
 *
 * The merge is the architectural payoff from the W6-S2.5 ghost-user
 * decision — the deal is ALREADY persisted at this point. We're not
 * re-running analysis; we're re-attributing rows.
 *
 * IDEMPOTENCE
 * ───────────
 * - If no ghost exists for `sessionId` → no-op, return { merged: false }.
 *   (The user already claimed in a previous flow, or never had an anon
 *   session under this sessionId — fine either way.)
 * - If the ghost exists but the requesting authenticated user already
 *   has events tagged with that same sessionId, the update is still
 *   safe — the WHERE clause only touches rows with userId = ghost._id.
 *
 * CONCURRENCY
 * ───────────
 * MongoDB doesn't give us transactions across collections without a
 * replica set. We accept this risk because:
 *   - A user typically claims a session ONCE
 *   - Even if a partial failure occurs, the events stay queryable under
 *     either userId; the ghost row sticks around but is harmless until
 *     a cleanup job sweeps it
 *   - The operation is monotonic: rows can be re-claimed, but never
 *     un-claimed
 *
 * APPEND-ONLY BYPASS
 * ──────────────────
 * The substrate enforces append-only at the Mongoose middleware layer
 * (BaseEvent.ts pre('updateMany') etc.). That guard protects APPLICATION
 * code from rewriting history; an identity-merge is infrastructure-level
 * — the same level migrations operate at. We deliberately go through
 * `mongoose.connection.db.collection('events').updateMany(...)` which
 * talks to the driver directly, skipping the Mongoose model middleware.
 * This is the established escape hatch (see scripts/migrations/* for
 * the pattern).
 *
 * SECURITY
 * ────────
 * The caller MUST be authenticated. The route handler is responsible
 * for that gate; this service trusts `targetUserId` as the resolved
 * authenticated user.
 */

import mongoose, { Types } from 'mongoose';
import { User } from '../models/User';
import { materializeDealsForUser } from './dealMaterializationService';
import { logger } from '../utils/logger';

export interface MergeResult {
  /** True if a ghost user was found and its events reassigned. */
  merged: boolean;
  /** Number of substrate event rows reassigned (0 when merged=false). */
  eventsMerged: number;
  /** Number of CostEvent rows reassigned (0 when merged=false). */
  costEventsMerged: number;
  /** The reassigned ghost's _id (hex) — null when merged=false. */
  ghostUserId: string | null;
  /**
   * Number of legacy Deal rows materialized from the just-claimed
   * DecisionEvents (Phase 2 of chat-first strategy).
   * Each materialized Deal makes the analysis visible in /saved-properties.
   * 0 when merged=false; can be 0 when merged=true if no DecisionEvents
   * existed in this session (e.g., Q&A-only conversation).
   */
  dealsMaterialized: number;
}

/**
 * Merge an anonymous chat session into a real (authenticated) user.
 *
 * @param sessionId    — the chat sessionId the ghost is keyed by
 * @param targetUserId — the authenticated user's _id (the merge target)
 */
export async function mergeAnonymousSessionIntoUser(
  sessionId: string,
  targetUserId: Types.ObjectId
): Promise<MergeResult> {
  // 1. Find the ghost. Restrict to anonymous: true so this can never
  //    accidentally merge real users together if a sessionId collision
  //    ever occurs (sparse-unique index makes that impossible today;
  //    defense in depth).
  const ghost = await User.findOne({
    anonymousSessionId: sessionId,
    anonymous: true,
  })
    .select('_id email')
    .exec();

  if (!ghost) {
    return {
      merged: false,
      eventsMerged: 0,
      costEventsMerged: 0,
      ghostUserId: null,
      dealsMaterialized: 0,
    };
  }

  const ghostId = ghost._id as Types.ObjectId;

  // 2. Don't merge a ghost into itself — paranoid but cheap to check.
  if (ghostId.equals(targetUserId)) {
    logger.warn(
      '[chatSessionMerge] ghost._id === targetUserId — refusing to merge',
      { sessionId, userId: targetUserId.toHexString() }
    );
    return {
      merged: false,
      eventsMerged: 0,
      costEventsMerged: 0,
      ghostUserId: ghostId.toHexString(),
      dealsMaterialized: 0,
    };
  }

  // 3. Reassign substrate events via the raw driver (bypasses the
  //    Mongoose middleware that enforces append-only — see APPEND-ONLY
  //    BYPASS doc block at top of file). One updateMany hits every
  //    discriminator type because they all share the `events` collection.
  if (!mongoose.connection.db) {
    throw new Error('chatSessionMerge: mongoose.connection.db is null — not connected?');
  }
  const eventsCol = mongoose.connection.db.collection('events');
  const eventsRes = await eventsCol.updateMany(
    { userId: ghostId },
    { $set: { userId: targetUserId } }
  );

  // 4. Reassign cost events (separate `cost_events` collection).
  const costCol = mongoose.connection.db.collection('cost_events');
  const costRes = await costCol.updateMany(
    { userId: ghostId },
    { $set: { userId: targetUserId } }
  );

  // 5. Delete the ghost. Its email (`anon-{uuid}@anon.app`) is synthetic
  //    and would block the real user from registering it again — clean
  //    up so the unique index stays free of stale anon-* synthetic rows.
  await User.deleteOne({ _id: ghostId }).exec();

  // 6. Phase 2 — materialize Deal rows for each DecisionEvent in this
  //    session so /saved-properties (legacy Deal-model UI) shows the
  //    user's chat-analyzed deals immediately after signup.
  //
  //    Discovery: walk ConversationEvents for this session (now owned by
  //    targetUserId after step 3), collect their relatedEventIds, filter
  //    to events that are decisions, materialize each.
  //
  //    Best-effort: materialization failures are logged but don't fail
  //    the merge. The substrate events ARE the source of truth.
  let dealsMaterialized = 0;
  try {
    const convs = await mongoose.connection.db
      .collection('events')
      .find({
        eventType: 'conversation',
        userId: targetUserId,
        'payload.sessionId': sessionId,
      })
      .toArray();

    const candidateIds = convs.flatMap((c) => {
      const payload = c.payload as
        | { agentResponse?: { relatedEventIds?: Types.ObjectId[] } }
        | undefined;
      return payload?.agentResponse?.relatedEventIds ?? [];
    });

    if (candidateIds.length > 0) {
      const decisions = await mongoose.connection.db
        .collection('events')
        .find({
          _id: { $in: candidateIds.map((id) => new Types.ObjectId(id)) },
          eventType: 'decision',
        })
        .project({ _id: 1 })
        .toArray();

      const decisionIds = decisions.map((d) => d._id as Types.ObjectId);
      if (decisionIds.length > 0) {
        const result = await materializeDealsForUser(decisionIds, targetUserId);
        dealsMaterialized = result.successCount;
        if (result.failureCount > 0) {
          logger.warn(
            '[chatSessionMerge] some Deal materializations failed during claim',
            {
              sessionId,
              targetUserId: targetUserId.toHexString(),
              successCount: result.successCount,
              failureCount: result.failureCount,
            }
          );
        }
      }
    }
  } catch (materializeErr) {
    logger.warn(
      '[chatSessionMerge] Deal materialization step failed (non-fatal — merge already complete)',
      {
        sessionId,
        targetUserId: targetUserId.toHexString(),
        error:
          materializeErr instanceof Error
            ? materializeErr.message
            : String(materializeErr),
      }
    );
  }

  logger.info('[chatSessionMerge] merge completed', {
    sessionId,
    ghostUserId: ghostId.toHexString(),
    targetUserId: targetUserId.toHexString(),
    eventsMerged: eventsRes.modifiedCount ?? 0,
    costEventsMerged: costRes.modifiedCount ?? 0,
    dealsMaterialized,
  });

  return {
    merged: true,
    eventsMerged: eventsRes.modifiedCount ?? 0,
    costEventsMerged: costRes.modifiedCount ?? 0,
    ghostUserId: ghostId.toHexString(),
    dealsMaterialized,
  };
}
