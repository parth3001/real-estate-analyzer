/**
 * Events store — base Mongoose schema (W1-S1).
 *
 * Implements the common envelope per /docs/PRODUCT_2.0_EVENTS_STORE.md §2 and §4.
 *
 * Discriminator pattern: all event types live in a single MongoDB collection
 * (`events`) with type-specific payload schemas registered as discriminators
 * (added in W1-S2 — ProfileEvent, AnalysisEvent, DecisionEvent, etc.).
 *
 * APPEND-ONLY ENFORCEMENT AT THREE LAYERS:
 *   1. Repository layer (W1-S3) — no update/delete methods exposed
 *   2. This schema — pre-hooks throw on every update/delete operation,
 *      including the document-save path for existing documents
 *   3. DB role (W1-S5) — `eventsAppendOnly` user has only `find` + `insert`
 *      privileges on the collection
 *
 * Each layer is a safety net for the one above it. Together they make it
 * essentially impossible to mutate a historical event accidentally.
 *
 * Known gap: `Model.bulkWrite()` bypasses pre-hooks. The repository layer
 * does NOT expose `bulkWrite`; admin-only direct DB access is the only way
 * to invoke it, and that path requires the admin DB user (not the
 * append-only user). Acceptable.
 */

import { Schema, model } from 'mongoose';
import type { EventType, ActorType } from './types';

export const APPEND_ONLY_ERROR =
  'Events are append-only — update/delete operations are not permitted on the events collection.';

/**
 * Schema-level options:
 *   - discriminatorKey: tells Mongoose to dispatch on `eventType`
 *   - timestamps with no updatedAt: reinforces append-only at the schema layer
 *   - strict: 'throw': reject unknown top-level fields on insert (no opaque
 *     blob fields per events store §1 principle 2)
 *   - collection: 'events' — single collection for all discriminators
 */
const baseEventOptions = {
  discriminatorKey: 'eventType' as const,
  timestamps: { createdAt: 'timestamp', updatedAt: false } as const,
  strict: 'throw' as const,
  collection: 'events',
};

export const baseEventSchema = new Schema(
  {
    traceId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    eventVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    actorType: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      // Compound `{ userId, timestamp }` index defined below subsumes this
      // single-field index; we keep it for direct userId equality queries
      // that don't need the sort key.
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution', // Forward-reference; Institution model is wave 2
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  baseEventOptions
);

// ===== W1-S6 — Index strategy per events store §7 =====
//
// Indexes are declared at the base schema so they apply to the unified
// `events` collection regardless of discriminator. Per-event-type sparse
// indexes use payload-paths (e.g., 'payload.sessionId') and are sparse so
// they only index documents that actually have the field.

// Compound: "Show recent events for this user" — most common read.
// Backs getRecentEventsForUser, getRecentDecisionsForUser, etc.
baseEventSchema.index({ userId: 1, timestamp: -1 });

// Compound: "Show this user's analyses / overrides / etc."
// Backs calibration and history queries that filter by event type.
baseEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });

// Sparse compound: "All events for a property over time."
// Backs getDecisionHistoryForDeal and any future per-deal feeds.
// Sparse so non-deal events (ProfileEvent, ConversationEvent without dealId)
// don't bloat the index.
baseEventSchema.index(
  { 'payload.dealId': 1, timestamp: -1 },
  { sparse: true, name: 'payload_dealId_timestamp' }
);

// Sparse compound: "Conversation event reload by session." ConversationEvent only.
// Backs getConversationHistory.
baseEventSchema.index(
  { 'payload.sessionId': 1, eventType: 1 },
  { sparse: true, name: 'payload_sessionId_eventType' }
);

// Sparse compound: "B2B compliance reports." Only events with institutionId.
// Backs the audit-trail surface for credit-union / community-bank tenants.
baseEventSchema.index(
  { institutionId: 1, eventType: 1, timestamp: -1 },
  { sparse: true, name: 'institutionId_eventType_timestamp' }
);

// Sparse compound: "Per-persona critic output." CritiqueEvent only.
// Backs the 4-week kill-criterion eval for adversarial personas.
baseEventSchema.index(
  { 'payload.criticPersona': 1, timestamp: -1 },
  { sparse: true, name: 'payload_criticPersona_timestamp' }
);

// Sparse: "All events related to a specific decision." OverrideEvent +
// CritiqueEvent (both have payload.originalDecisionId). Backs
// getCritiquesForDecision and the override list inside getAuditTrail.
baseEventSchema.index(
  { 'payload.originalDecisionId': 1, timestamp: 1 },
  { sparse: true, name: 'payload_originalDecisionId_timestamp' }
);

// Sparse: "Override frequency by field." OverrideEvent only.
// Backs getOverrideFrequencyByField — the calibration-drift signal.
baseEventSchema.index(
  { 'payload.fieldPath': 1, timestamp: -1 },
  { sparse: true, name: 'payload_fieldPath_timestamp' }
);

// ===== Append-only enforcement at the schema layer =====

function throwAppendOnly(): never {
  throw new Error(APPEND_ONLY_ERROR);
}

// Query-level mutation operations — all blocked.
baseEventSchema.pre('updateOne', throwAppendOnly);
baseEventSchema.pre('updateMany', throwAppendOnly);
baseEventSchema.pre('findOneAndUpdate', throwAppendOnly);
baseEventSchema.pre('findOneAndReplace', throwAppendOnly);
baseEventSchema.pre('replaceOne', throwAppendOnly);
baseEventSchema.pre('deleteOne', throwAppendOnly);
baseEventSchema.pre('deleteMany', throwAppendOnly);
baseEventSchema.pre('findOneAndDelete', throwAppendOnly);

// Document-save path: `doc.save()` is bypassed by query-level hooks.
// Allow save() only when the document is new (initial insert path).
// `this.isNew` is true on a freshly-constructed Document, false after the
// first successful save.
baseEventSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error(APPEND_ONLY_ERROR));
  }
  next();
});

/**
 * BaseEventModel — the base for all event-type discriminator models.
 *
 * In W1-S2, each event type registers a discriminator via:
 *   `BaseEventModel.discriminator('profile', profilePayloadSchema)`
 *
 * Until discriminators are registered, this model accepts documents with
 * arbitrary string `eventType` values and stores them in the `events`
 * collection without payload-specific validation. Type-specific payload
 * Zod validation runs at the repository layer (W1-S3).
 */
export const BaseEventModel = model('Event', baseEventSchema);

// Re-export for convenience.
export type { EventType, ActorType, EventEnvelope, AgentName } from './types';
