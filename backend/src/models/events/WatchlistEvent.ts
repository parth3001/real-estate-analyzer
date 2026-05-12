/**
 * WatchlistEvent — eighth wave-1 event type (W1-S2 part 8).
 *
 * Lightweight save-to-watchlist event. Activation signal — counts toward
 * the platform's "activation moment" metric (first interaction produces
 * a visible substrate write).
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.8.
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const WatchlistSourceSchema = z.enum(['chat', 'wizard', 'import', 'shared_link']);
export type WatchlistSource = z.infer<typeof WatchlistSourceSchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

// ===== Zod payload schema =====

export const WatchlistPayloadSchema = z.object({
  dealId: ObjectIdSchema,
  source: WatchlistSourceSchema,
  decisionIdAtSave: ObjectIdSchema.optional(),
  note: z.string().optional(),
});

// ===== TypeScript interface =====

export interface WatchlistPayload {
  dealId: Types.ObjectId;
  source: WatchlistSource;
  decisionIdAtSave?: Types.ObjectId;
  note?: string;
}

// ===== Mongoose discriminator =====

const watchlistEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

export const WatchlistEventModel = BaseEventModel.discriminator(
  'watchlist',
  watchlistEventSchema
);
