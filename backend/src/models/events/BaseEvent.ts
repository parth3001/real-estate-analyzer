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
