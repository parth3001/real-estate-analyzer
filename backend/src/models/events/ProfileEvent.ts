/**
 * ProfileEvent — first wave-1 event type (W1-S2).
 *
 * Captures investor / underwriter profile state. Multiple ProfileEvents per
 * user over time — the most recent represents current state; the full
 * history reveals how a user's profile evolved.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.1.
 *
 * Persona dimensions captured here flow into the deterministic scoring
 * engine via getStrategyAwareWeights() and related entry points (per
 * /docs/PRODUCT_2.0_ARCHITECTURE.md §1.5 — AI never produces the score;
 * persona context is deterministic configuration only):
 *
 *   - `riskTolerance` — current engine uses this (clean lift)
 *   - `primaryGoal` — partial in current engine GoalContext; threaded
 *     fully in 2.0
 *   - `investorType` — 2.0 extension (retail / pro / lender / consultancy);
 *     enables B2B-aware threshold defaults
 *   - `institutionContext` — 2.0 extension (B2B-only)
 *
 * Architectural notes:
 *   - Payload is stored as Mongoose `Mixed` (no per-field schema enforcement
 *     at the Mongoose layer). Runtime validation happens at the repository
 *     layer via `ProfilePayloadSchema.parse()` before write (W1-S3).
 *   - Discriminator value: `'profile'` — matches EventType union in types.ts.
 *   - Stored in single `events` collection alongside all other event types
 *     per discriminator pattern.
 */

import { z } from 'zod';
import { Schema } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Zod payload schema (runtime validation) =====

/**
 * ProfilePayloadSchema — runtime validation for ProfileEvent payload.
 *
 * Repository layer (W1-S3) calls `.parse()` on this schema before passing
 * the payload to `ProfileEventModel.create()`. Mongoose's Mixed type then
 * stores the validated object as-is.
 *
 * All fields are optional — a ProfileEvent can capture as little as a
 * single field update (e.g., user shares "I'm a credit union lender" →
 * write ProfileEvent with just investorType + institutionContext).
 * Most recent ProfileEvent merged with prior events gives current state.
 */
export const ProfilePayloadSchema = z.object({
  investorType: z
    .enum(['retail', 'pro', 'lender', 'consultancy'])
    .optional(),

  portfolioSize: z
    .enum(['none', '1-3', '4-10', '11-30', '30+'])
    .optional(),

  primaryMarkets: z
    .array(z.string())
    .optional(),

  role: z
    .enum(['principal', 'loan_officer', 'underwriter', 'analyst', 'other'])
    .optional(),

  institutionContext: z
    .object({
      name: z.string().optional(),
      institutionType: z
        .enum(['credit_union', 'community_bank', 'hard_money', 'consultancy'])
        .optional(),
      typicalDealVolume: z.enum(['low', 'medium', 'high']).optional(),
    })
    .optional(),

  riskTolerance: z
    .enum(['conservative', 'moderate', 'aggressive'])
    .optional(),

  primaryGoal: z
    .enum(['cash_flow', 'wealth_building', 'diversification', 'tax_optimization'])
    .optional(),

  // Audit trail: when extracted by `tool:profile_extraction`, capture the
  // original chat input + extraction confidence. Enables debug + future
  // re-extraction if the tool's NLP improves.
  extractedFromInput: z.string().optional(),
  extractionConfidence: z.number().min(0).max(100).optional(),
});

/** TypeScript type derived from the Zod schema — single source of truth. */
export type ProfilePayload = z.infer<typeof ProfilePayloadSchema>;

// ===== Mongoose discriminator schema =====

const profileEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * ProfileEventModel — Mongoose model for inserting and reading ProfileEvents.
 *
 * Registered as a discriminator on `BaseEventModel` with discriminator
 * value `'profile'`. All ProfileEvents are stored in the single `events`
 * collection alongside other event types; the `eventType: 'profile'`
 * discriminator field routes queries.
 *
 * Append-only enforcement (per BaseEvent.ts pre-hooks) inherits to this
 * discriminator — updateOne, deleteOne, save-on-existing, etc. all throw
 * the same APPEND_ONLY_ERROR.
 */
export const ProfileEventModel = BaseEventModel.discriminator(
  'profile',
  profileEventSchema
);
