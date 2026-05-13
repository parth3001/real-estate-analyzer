/**
 * tool:save_to_watchlist — W4-S3.
 *
 * Emits a single WatchlistEvent when the user saves a decision for
 * later. Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 and the events store
 * §3.8 (WatchlistEvent schema).
 *
 * INPUT vs PAYLOAD SHAPE
 * ----------------------
 *
 * The agent-mesh catalog declares the input as { decisionId, source, note? }
 * but the WatchlistEvent payload is keyed on `dealId` (the property)
 * with `decisionIdAtSave` as optional context. The tool reads the
 * referenced DecisionEvent to derive `dealId` — keeps the agent's
 * API simple while preserving the event-store invariant that
 * watchlist entries point at a property (not a transient decision).
 *
 * WHY THE WATCHLIST EVENT MATTERS
 * -------------------------------
 *
 * Saving is the platform's first activation moment — the user
 * declares "this deal is worth my attention." Substrate-tagged saves
 * feed downstream:
 *   - The user's watchlist UI (read recent WatchlistEvents)
 *   - Activation funnel metrics (% of users who save within 1 session)
 *   - Personalized prompts ("you saved 3 cash-flow deals last week —
 *     try the cash-flow-aware mode") via persona inference
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';
import { DecisionEventModel } from '../../models/events/DecisionEvent';
import type { DecisionEventDocument } from '../../repositories/EventsRepositoryReads';

// ===== Input schema =====

const WatchlistSourceSchema = z.enum(['chat', 'wizard', 'import', 'shared_link']);

export const SaveToWatchlistInputSchema = z.object({
  /** The decision being saved (its dealId is captured into the event). */
  decisionId: z.union([z.instanceof(Types.ObjectId), z.string()]),

  /** Which surface produced the save. */
  source: WatchlistSourceSchema,

  /** Optional free-text note (user reasoning, "follow up next week", etc.). */
  note: z.string().optional(),
});

export type SaveToWatchlistInput = z.infer<typeof SaveToWatchlistInputSchema>;

// ===== Output schema =====

export const SaveToWatchlistOutputSchema = z.object({
  watchlistEventId: z.custom<Types.ObjectId>(
    (v) => v instanceof Types.ObjectId,
    { message: 'Expected ObjectId' }
  ),
  /** The dealId that the watchlist now points at (derived from the decision). */
  dealId: z.custom<Types.ObjectId>(
    (v) => v instanceof Types.ObjectId,
    { message: 'Expected ObjectId' }
  ),
});

export type SaveToWatchlistOutput = z.infer<typeof SaveToWatchlistOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const saveToWatchlist: Tool<SaveToWatchlistInput, SaveToWatchlistOutput> = {
  name: 'save_to_watchlist',
  description:
    'Records that the user saved a decision for later attention. Reads the referenced DecisionEvent to extract the property dealId, then emits a WatchlistEvent.',
  inputSchema: SaveToWatchlistInputSchema,
  outputSchema: SaveToWatchlistOutputSchema,
  invokeLLM: false,
  sideEffects: [{ type: 'event', eventType: 'watchlist' }],
  retrySemantics: NO_RETRY,

  async execute(input: SaveToWatchlistInput, ctx: ToolContext): Promise<SaveToWatchlistOutput> {
    const validated = SaveToWatchlistInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // Load the referenced decision to extract dealId
    const decision = await DecisionEventModel.findById(decisionId)
      .lean<DecisionEventDocument | null>()
      .exec();
    if (!decision) {
      throw new Error(
        `save_to_watchlist: referenced DecisionEvent not found: ${decisionId.toHexString()}`
      );
    }
    const dealId = decision.payload.dealId;
    if (!dealId) {
      throw new Error(
        `save_to_watchlist: DecisionEvent ${decisionId.toHexString()} has no dealId; ` +
          `watchlist saves require a property reference (events store §3.8).`
      );
    }

    const watchlistEventId = await ctx.eventsRepo.writeWatchlistEvent({
      traceId: ctx.traceId,
      actorType: 'user',
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      payload: {
        dealId,
        source: validated.source,
        decisionIdAtSave: decisionId,
        note: validated.note,
      },
    });

    return { watchlistEventId, dealId };
  },
};
