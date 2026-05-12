/**
 * EventsRepository — write API for the events store (W1-S3).
 *
 * The repository layer is the ONLY way application code talks to the
 * events collection. It enforces:
 *
 *   1. Append-only access — there are no update/delete methods. The
 *      compiler prevents callers from invoking mutations on event docs;
 *      the schema-level pre-hooks (BaseEvent.ts) catch any attempt that
 *      bypasses the repository (e.g., direct Mongoose usage); the
 *      MongoDB role (W1-S5) catches anything that bypasses both.
 *
 *   2. Runtime payload validation — every write method calls the
 *      corresponding Zod schema's `.parse()` before passing data to
 *      Mongoose. Schema violations throw before any DB write happens.
 *
 *   3. Versioned schemas — events are written with explicit eventVersion.
 *      Readers handle multiple versions; old events never get rewritten.
 *
 *   4. Correlation IDs — every write requires a `traceId` so events
 *      from one user interaction are joinable.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §5.1.
 *
 * Reads are NOT in this file — see W1-S4 (EventsRepositoryReads.ts).
 */

import { Types } from 'mongoose';
import { logger } from '../utils/logger';
import type { ActorType } from '../models/events/types';

// Event-type schemas + models
import {
  ProfileEventModel,
  ProfilePayloadSchema,
  type ProfilePayload,
} from '../models/events/ProfileEvent';
import {
  AnalysisEventModel,
  AnalysisPayloadSchema,
  type AnalysisPayload,
} from '../models/events/AnalysisEvent';
import {
  DecisionEventModel,
  DecisionPayloadSchema,
  type DecisionPayload,
} from '../models/events/DecisionEvent';
import {
  OverrideEventModel,
  OverridePayloadSchema,
  type OverridePayload,
} from '../models/events/OverrideEvent';
import {
  CritiqueEventModel,
  CritiquePayloadSchema,
  type CritiquePayload,
} from '../models/events/CritiqueEvent';
import {
  ConversationEventModel,
  ConversationPayloadSchema,
  type ConversationPayload,
} from '../models/events/ConversationEvent';
import {
  AuditTrailEventModel,
  AuditTrailPayloadSchema,
  type AuditTrailPayload,
} from '../models/events/AuditTrailEvent';
import {
  WatchlistEventModel,
  WatchlistPayloadSchema,
  type WatchlistPayload,
} from '../models/events/WatchlistEvent';
import {
  OutcomeEventModel,
  OutcomePayloadSchema,
  type OutcomePayload,
} from '../models/events/OutcomeEvent';
import {
  PortfolioEventModel,
  PortfolioPayloadSchema,
  type PortfolioPayload,
} from '../models/events/PortfolioEvent';
import {
  PipelineEventModel,
  PipelinePayloadSchema,
  type PipelinePayload,
} from '../models/events/PipelineEvent';

// ===== Common envelope input =====

/**
 * Generic write input — common envelope fields plus a typed payload.
 * Each write method specifies its own TPayload via type parameter.
 */
export interface WriteEventInput<TPayload> {
  /** Correlation ID — links events from one user interaction. */
  traceId: string;

  /** Who/what wrote this event. */
  actorType: ActorType;

  /** User this event is about. ObjectId or 24-char hex string accepted. */
  userId: Types.ObjectId | string;

  /** Optional B2B institution context. */
  institutionId?: Types.ObjectId | string;

  /** Per-event-type typed payload. */
  payload: TPayload;
}

// ===== Event-version constants =====

/**
 * Schema version per event type. Bump when adding new fields or changing
 * existing ones; readers must handle multiple versions. See events store
 * §9 for the evolution playbook.
 */
const EVENT_VERSIONS = {
  profile: 1,
  analysis: 1,
  decision: 1,
  override: 1,
  critique: 1,
  conversation: 1,
  audit_trail: 1,
  watchlist: 1,
  outcome: 1,
  portfolio: 1,
  pipeline: 1,
} as const;

// ===== Repository =====

/**
 * EventsRepository — write methods only (insert-only access pattern).
 *
 * Consumers instantiate per request or use the singleton:
 *   `const repo = new EventsRepository()`
 *   or
 *   `import { eventsRepository } from '...'`
 *
 * No update/delete methods exist by design. Attempting to add them
 * triggers architect review per the deterministic-scoring + append-only
 * non-negotiables.
 */
export class EventsRepository {
  // ===== ProfileEvent =====

  async writeProfileEvent(input: WriteEventInput<ProfilePayload>): Promise<Types.ObjectId> {
    const validated = ProfilePayloadSchema.parse(input.payload);
    const event = await ProfileEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.profile,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('ProfileEvent written', { traceId: input.traceId, eventId: event._id });
    return event._id as Types.ObjectId;
  }

  // ===== AnalysisEvent =====

  async writeAnalysisEvent(input: WriteEventInput<AnalysisPayload>): Promise<Types.ObjectId> {
    const validated = AnalysisPayloadSchema.parse(input.payload);
    const event = await AnalysisEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.analysis,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('AnalysisEvent written', { traceId: input.traceId, eventId: event._id });
    return event._id as Types.ObjectId;
  }

  // ===== DecisionEvent =====

  async writeDecisionEvent(input: WriteEventInput<DecisionPayload>): Promise<Types.ObjectId> {
    const validated = DecisionPayloadSchema.parse(input.payload);
    const event = await DecisionEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.decision,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('DecisionEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      dealQuality: validated.dealQuality,
    });
    return event._id as Types.ObjectId;
  }

  // ===== OverrideEvent =====

  async writeOverrideEvent(input: WriteEventInput<OverridePayload>): Promise<Types.ObjectId> {
    const validated = OverridePayloadSchema.parse(input.payload);
    const event = await OverrideEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.override,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('OverrideEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      fieldPath: validated.fieldPath,
    });
    return event._id as Types.ObjectId;
  }

  // ===== CritiqueEvent =====

  async writeCritiqueEvent(input: WriteEventInput<CritiquePayload>): Promise<Types.ObjectId> {
    const validated = CritiquePayloadSchema.parse(input.payload);
    const event = await CritiqueEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.critique,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('CritiqueEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      persona: validated.criticPersona,
      severityScore: validated.severityScore,
    });
    return event._id as Types.ObjectId;
  }

  // ===== ConversationEvent =====

  async writeConversationEvent(
    input: WriteEventInput<ConversationPayload>
  ): Promise<Types.ObjectId> {
    const validated = ConversationPayloadSchema.parse(input.payload);
    const event = await ConversationEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.conversation,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('ConversationEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      sessionId: validated.sessionId,
      turnNumber: validated.turnNumber,
    });
    return event._id as Types.ObjectId;
  }

  // ===== AuditTrailEvent =====

  async writeAuditTrailEvent(input: WriteEventInput<AuditTrailPayload>): Promise<Types.ObjectId> {
    const validated = AuditTrailPayloadSchema.parse(input.payload);
    const event = await AuditTrailEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.audit_trail,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('AuditTrailEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      action: validated.action,
    });
    return event._id as Types.ObjectId;
  }

  // ===== WatchlistEvent =====

  async writeWatchlistEvent(input: WriteEventInput<WatchlistPayload>): Promise<Types.ObjectId> {
    const validated = WatchlistPayloadSchema.parse(input.payload);
    const event = await WatchlistEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.watchlist,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('WatchlistEvent written', { traceId: input.traceId, eventId: event._id });
    return event._id as Types.ObjectId;
  }

  // ===== OutcomeEvent =====

  async writeOutcomeEvent(input: WriteEventInput<OutcomePayload>): Promise<Types.ObjectId> {
    const validated = OutcomePayloadSchema.parse(input.payload);
    const event = await OutcomeEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.outcome,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('OutcomeEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      outcome: validated.outcome,
    });
    return event._id as Types.ObjectId;
  }

  // ===== PortfolioEvent =====

  async writePortfolioEvent(input: WriteEventInput<PortfolioPayload>): Promise<Types.ObjectId> {
    const validated = PortfolioPayloadSchema.parse(input.payload);
    const event = await PortfolioEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.portfolio,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('PortfolioEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      subType: validated.subType,
    });
    return event._id as Types.ObjectId;
  }

  // ===== PipelineEvent =====

  async writePipelineEvent(input: WriteEventInput<PipelinePayload>): Promise<Types.ObjectId> {
    const validated = PipelinePayloadSchema.parse(input.payload);
    const event = await PipelineEventModel.create({
      traceId: input.traceId,
      eventVersion: EVENT_VERSIONS.pipeline,
      actorType: input.actorType,
      userId: input.userId,
      institutionId: input.institutionId,
      payload: validated,
    });
    logger.debug('PipelineEvent written', {
      traceId: input.traceId,
      eventId: event._id,
      subType: validated.subType,
    });
    return event._id as Types.ObjectId;
  }

  // ===== Intentionally NOT exported =====
  //
  // - No `updateEvent()` — events are append-only.
  // - No `deleteEvent()` — events are append-only.
  // - No `bulkWrite()` exposure — bypasses pre-hooks.
  //
  // Schema-level pre-hooks (BaseEvent.ts) and DB role (W1-S5) catch
  // any attempt that bypasses the repository.
}

// Singleton instance — most consumer code should use this.
export const eventsRepository = new EventsRepository();
