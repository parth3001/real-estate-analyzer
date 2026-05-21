/**
 * EventsRepositoryReads — read API for the events store (W1-S4).
 *
 * Named query recipes per /docs/PRODUCT_2.0_EVENTS_STORE.md §8. Application
 * code (controllers, agents, services) NEVER constructs raw Mongoose queries
 * against the events collection — every read goes through a named method on
 * this class. Adding a new query = adding a new method here.
 *
 * Why this matters:
 *   1. Indexing strategy (events store §7) is derived from these query
 *      shapes; new queries that bypass this layer skip the index review.
 *   2. The audit-trail surface (§8.4) is one query shape powering three
 *      product surfaces (assumptions view, PDF export, B2B audit). The
 *      shape lives here exactly once.
 *   3. Calibration-drift signals (§8.3) are aggregation pipelines whose
 *      correctness matters for the deterministic-scoring non-negotiable
 *      (architecture §1.5). They get tested as a unit.
 *
 * Returns are `.lean()` (plain objects, not Mongoose documents) — readers
 * never mutate events anyway, and lean reads are ~3-5x faster.
 *
 * Writes are NOT in this file — see W1-S3 (EventsRepository.ts).
 */

import { Types } from 'mongoose';
import { BaseEventModel } from '../models/events/BaseEvent';
import { ProfileEventModel, type ProfilePayload } from '../models/events/ProfileEvent';
import { AnalysisEventModel, type AnalysisPayload } from '../models/events/AnalysisEvent';
import { DecisionEventModel, type DecisionPayload } from '../models/events/DecisionEvent';
import { OverrideEventModel, type OverridePayload } from '../models/events/OverrideEvent';
import { CritiqueEventModel, type CritiquePayload } from '../models/events/CritiqueEvent';
import {
  ConversationEventModel,
  type ConversationPayload,
} from '../models/events/ConversationEvent';
import { AuditTrailEventModel, type AuditTrailPayload } from '../models/events/AuditTrailEvent';
import type { EventType, ActorType } from '../models/events/types';

// ===== Shared envelope shape =====

/**
 * The envelope every read returns. Generic over the payload so callers
 * keep typed payloads after `.lean()`.
 *
 * Note: `_id` and `userId` are `Types.ObjectId` because that's what
 * Mongoose returns from `.lean()` even though TS thinks they'd be `any`.
 */
export interface EventDocument<TPayload> {
  _id: Types.ObjectId;
  traceId: string;
  eventType: EventType;
  eventVersion: number;
  timestamp: Date;
  actorType: ActorType;
  userId: Types.ObjectId;
  institutionId?: Types.ObjectId;
  payload: TPayload;
}

// Type aliases for per-event-type read results.
export type ProfileEventDocument = EventDocument<ProfilePayload>;
export type AnalysisEventDocument = EventDocument<AnalysisPayload>;
export type DecisionEventDocument = EventDocument<DecisionPayload>;
export type OverrideEventDocument = EventDocument<OverridePayload>;
export type CritiqueEventDocument = EventDocument<CritiquePayload>;
export type ConversationEventDocument = EventDocument<ConversationPayload>;
export type AuditTrailEventDocument = EventDocument<AuditTrailPayload>;

// ===== Aggregate result shapes =====

/**
 * Full audit-trail bundle for a single DecisionEvent — per events store §8.4.
 *
 * This is the data shape behind three product surfaces:
 *   - "Show me the assumptions" view (architecture §1.5)
 *   - PDF export
 *   - B2B audit-trail UI (compliance for credit unions / community banks)
 */
export interface AuditTrailBundle {
  decision: DecisionEventDocument;
  analysis: AnalysisEventDocument | null;
  overrides: OverrideEventDocument[];
  critiques: CritiqueEventDocument[];
  auditEvents: AuditTrailEventDocument[];
}

/**
 * One scenario = a (DecisionEvent, AnalysisEvent) pair for a property
 * (Task #13, 2026-05-20). The DecisionEvent holds the score + 7-factor
 * breakdown; the AnalysisEvent holds the inputs to diff. Backs the
 * scenario-scoped workspace + diff-based scenario indicator (Task #8).
 */
export interface ScenarioBundle {
  decision: DecisionEventDocument;
  analysis: AnalysisEventDocument | null;
}

// ===== Helpers =====

/**
 * Normalize an ObjectId-or-hex input to ObjectId — used by every read that
 * filters by userId / dealId / institutionId. Mongoose accepts both, but
 * explicit normalization makes index hits predictable.
 */
function toObjectId(id: Types.ObjectId | string): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

// ===== Repository =====

export class EventsRepositoryReads {
  // ===== 8.1 — Recent events / per-user feed =====

  /**
   * Most recent events for a user across ALL event types. Backs the
   * "what did this user do recently" view and seeds agent context.
   *
   * Hits index: `{ userId: 1, timestamp: -1 }` (events store §7).
   */
  async getRecentEventsForUser(
    userId: Types.ObjectId | string,
    limit = 50
  ): Promise<EventDocument<unknown>[]> {
    return BaseEventModel.find({ userId: toObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<EventDocument<unknown>[]>()
      .exec();
  }

  /**
   * All events sharing a traceId — i.e., one user interaction end-to-end.
   * Backs debug surfaces and the developer-facing trace viewer.
   *
   * Hits index: `{ traceId: 1 }`.
   */
  async getEventsByTraceId(traceId: string): Promise<EventDocument<unknown>[]> {
    return BaseEventModel.find({ traceId })
      .sort({ timestamp: 1 })
      .lean<EventDocument<unknown>[]>()
      .exec();
  }

  // ===== Profile (current state) =====

  /**
   * Most recent ProfileEvent payload for a user — the "current profile".
   *
   * Profiles are event-sourced (architecture §1.5): we never mutate the
   * historical event, we write a new one. "Current" = "most recent". This
   * is the projection callers actually want.
   *
   * Returns `null` if the user has never had a profile event written.
   */
  async getCurrentProfile(userId: Types.ObjectId | string): Promise<ProfilePayload | null> {
    const event = await ProfileEventModel.findOne({ userId: toObjectId(userId) })
      .sort({ timestamp: -1 })
      .lean<ProfileEventDocument | null>()
      .exec();
    return event ? event.payload : null;
  }

  // ===== 8.1 — Conversation history =====

  /**
   * Full turn-by-turn conversation for one session, ordered by turnNumber.
   * Backs the chat surface when a user returns mid-session.
   *
   * Hits index: `{ 'payload.sessionId': 1, eventType: 1 }`.
   */
  async getConversationHistory(sessionId: string): Promise<ConversationEventDocument[]> {
    return ConversationEventModel.find({ 'payload.sessionId': sessionId })
      .sort({ 'payload.turnNumber': 1 })
      .lean<ConversationEventDocument[]>()
      .exec();
  }

  // ===== 8.2 — Seed agent context at session start =====

  /**
   * Most-recent N DecisionEvents for a user (across all deals). Used by
   * the orchestrator to seed agent context: "what has this user looked at
   * recently, and how did the engine score those deals?"
   */
  async getRecentDecisionsForUser(
    userId: Types.ObjectId | string,
    limit = 10
  ): Promise<DecisionEventDocument[]> {
    return DecisionEventModel.find({ userId: toObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<DecisionEventDocument[]>()
      .exec();
  }

  /**
   * Most-recent N OverrideEvents for a user. Used by the orchestrator
   * (calibration-aware prompts) and by getOverrideFrequencyByField at
   * the user level if/when we expose per-user calibration drift.
   */
  async getRecentOverridesForUser(
    userId: Types.ObjectId | string,
    limit = 20
  ): Promise<OverrideEventDocument[]> {
    return OverrideEventModel.find({ userId: toObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<OverrideEventDocument[]>()
      .exec();
  }

  // ===== Per-deal decision history =====

  /**
   * All DecisionEvents for a single deal, oldest first. Backs the deal
   * timeline view (how the score evolved as user overrode assumptions).
   *
   * Hits index: `{ 'payload.dealId': 1, timestamp: -1 }`.
   */
  async getDecisionHistoryForDeal(
    dealId: Types.ObjectId | string
  ): Promise<DecisionEventDocument[]> {
    return DecisionEventModel.find({ 'payload.dealId': toObjectId(dealId) })
      .sort({ timestamp: 1 })
      .lean<DecisionEventDocument[]>()
      .exec();
  }

  /**
   * All scenarios for a property — every (DecisionEvent, AnalysisEvent)
   * pair sharing (userId, canonicalAddressKey), oldest first. Backs the
   * scenario-scoped workspace + diff-based scenario indicator (Task #8).
   *
   * INVESTOR ISOLATION (non-negotiable): ALWAYS scoped by userId. The
   * canonicalAddressKey is NEVER queried alone — two investors analyzing
   * the same physical property must never see each other's scenarios.
   *
   * Uses the canonicalAddressKey stamped on DecisionEvents at write time
   * (Task #13). Pre-stamp/legacy events lack the key and won't appear —
   * re-analyze the property to repopulate. (Prod has no 2.0 data yet, so
   * this only affects pre-stamp dev events.)
   *
   * Hits index `{ userId: 1, timestamp: -1 }`; a
   * `{ userId, 'payload.canonicalAddressKey' }` index is a future
   * optimization once scenario volume warrants it (events store §7).
   */
  async getScenariosForDeal(
    userId: Types.ObjectId | string,
    canonicalAddressKey: string
  ): Promise<ScenarioBundle[]> {
    const uid = toObjectId(userId);
    const decisions = await DecisionEventModel.find({
      userId: uid,
      'payload.canonicalAddressKey': canonicalAddressKey,
    })
      .sort({ timestamp: 1 })
      .lean<DecisionEventDocument[]>()
      .exec();

    if (decisions.length === 0) return [];

    // Batch-load the paired AnalysisEvents — ONE query for all scenarios,
    // not N round-trips.
    const analysisIds = decisions
      .map((d) => d.payload.analysisEventId)
      .filter((id): id is Types.ObjectId => Boolean(id));
    const analyses = await AnalysisEventModel.find({
      _id: { $in: analysisIds },
    })
      .lean<AnalysisEventDocument[]>()
      .exec();
    const analysisById = new Map(
      analyses.map((a) => [a._id.toHexString(), a])
    );

    return decisions.map((decision) => ({
      decision,
      analysis:
        analysisById.get(
          decision.payload.analysisEventId?.toHexString() ?? ''
        ) ?? null,
    }));
  }

  // ===== 8.3 — Calibration drift signal =====

  /**
   * Which fields are overridden most often, system-wide, in the last N
   * days. The signal that drives calibration tuning (events store §8.3).
   *
   * Returned as Map<fieldPath, count> sorted by count descending. A field
   * appearing here a lot is a candidate for either (a) re-tuning its
   * default, or (b) updating the prompt that asks for it.
   */
  async getOverrideFrequencyByField(daysBack: number): Promise<Map<string, number>> {
    const since = new Date(Date.now() - daysBack * 86400_000);
    const results = await OverrideEventModel.aggregate<{ _id: string; count: number }>([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$payload.fieldPath', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec();
    return new Map(results.map((r) => [r._id, r.count]));
  }

  // ===== Critiques for a decision =====

  /**
   * Both adversarial-critic personas' outputs for a single decision. Used
   * by the orchestrator when surfacing critic disagreement to the user.
   */
  async getCritiquesForDecision(
    decisionId: Types.ObjectId | string
  ): Promise<CritiqueEventDocument[]> {
    return CritiqueEventModel.find({
      'payload.originalDecisionId': toObjectId(decisionId),
    })
      .sort({ timestamp: 1 })
      .lean<CritiqueEventDocument[]>()
      .exec();
  }

  // ===== 8.4 — Full audit trail for one decision =====

  /**
   * One DecisionEvent + every related event (analysis, overrides,
   * critiques, audit-trail entries). The single query shape behind the
   * "show me the assumptions" view, the PDF export, and the B2B audit UI.
   *
   * Per events store §8.4 — "one query shape, three surfaces."
   *
   * Throws if the decision doesn't exist (callers should 404).
   */
  async getAuditTrail(decisionId: Types.ObjectId | string): Promise<AuditTrailBundle> {
    const oid = toObjectId(decisionId);
    const decision = await DecisionEventModel.findById(oid)
      .lean<DecisionEventDocument | null>()
      .exec();
    if (!decision) {
      throw new Error(`Decision not found: ${oid.toHexString()}`);
    }

    const [analysis, overrides, critiques, auditEvents] = await Promise.all([
      AnalysisEventModel.findById(decision.payload.analysisEventId)
        .lean<AnalysisEventDocument | null>()
        .exec(),
      OverrideEventModel.find({ 'payload.originalDecisionId': oid })
        .sort({ timestamp: 1 })
        .lean<OverrideEventDocument[]>()
        .exec(),
      CritiqueEventModel.find({ 'payload.originalDecisionId': oid })
        .sort({ timestamp: 1 })
        .lean<CritiqueEventDocument[]>()
        .exec(),
      AuditTrailEventModel.find({ 'payload.decisionId': oid })
        .sort({ timestamp: 1 })
        .lean<AuditTrailEventDocument[]>()
        .exec(),
    ]);

    return { decision, analysis, overrides, critiques, auditEvents };
  }

  // ===== Intentionally NOT exported =====
  //
  // - No raw `find(query)` passthrough — every query must be a named
  //   method here so its shape is reviewable against the index plan (§7).
  // - No `aggregate(pipeline)` passthrough — same reason.
  // - No write methods — see EventsRepository.ts (W1-S3).
}

// Singleton — most consumer code should use this.
export const eventsRepositoryReads = new EventsRepositoryReads();
