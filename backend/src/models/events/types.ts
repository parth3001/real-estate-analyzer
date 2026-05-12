/**
 * Events store — TypeScript type definitions for the common envelope.
 *
 * See /docs/PRODUCT_2.0_EVENTS_STORE.md §2 for the architectural overview
 * and §3 for per-event-type payload schemas (added in W1-S2).
 *
 * Architectural invariants (enforced at three layers — repository, schema,
 * DB role — per /docs/PRODUCT_2.0_EVENTS_STORE.md §6):
 *   1. Append-only — events are never updated or deleted after write
 *   2. Typed — each event type has a strict Zod payload schema (W1-S2)
 *   3. Versioned — `eventVersion` enables schema evolution without mutation
 *   4. Correlated — `traceId` links events from one user interaction
 *   5. Provenance — `actorType` + `userId` + (optionally) `institutionId`
 *      always answer "who did this?"
 */

import type { Types } from 'mongoose';

/**
 * The 11 wave 1 event types. Discriminator value on every event in the
 * `events` collection.
 *
 * Outcome, Portfolio, Pipeline ship as schemas in wave 1 but their write
 * paths light up in wave 1.5 (Portfolio + Pipeline) and wave 2+ (Outcome).
 * See events store doc §3.9–§3.11.
 */
export type EventType =
  | 'profile'
  | 'analysis'
  | 'decision'
  | 'override'
  | 'critique'
  | 'conversation'
  | 'audit_trail'
  | 'watchlist'
  | 'outcome'
  | 'portfolio'
  | 'pipeline';

/**
 * Wave 1 agent names — exhaustive. Wave 2 will extend this union with
 * `portfolio`, `pipeline`, `market_data` agents.
 */
export type AgentName = 'deal_scoring' | 'qa' | 'adversarial_critic';

/**
 * Who or what wrote this event. Combined with `userId` it gives full
 * provenance — important for the audit-trail surface (B2B compliance).
 */
export type ActorType =
  | 'user'
  | `agent:${AgentName}`
  | `tool:${string}`
  | 'system';

/**
 * Common envelope on every event in the `events` collection.
 *
 * Per-event-type payloads (`ProfilePayload`, `AnalysisPayload`, etc.) are
 * defined alongside their Mongoose discriminator schemas in W1-S2 and
 * extend this envelope with a typed `payload` field.
 */
export interface EventEnvelope {
  _id: Types.ObjectId;
  traceId: string;
  eventType: EventType;
  eventVersion: number;
  timestamp: Date;
  actorType: ActorType;
  userId: Types.ObjectId;
  institutionId?: Types.ObjectId;
  // payload: <discriminator-specific>; declared per event type in W1-S2
}
