/**
 * tool:recall_user_context — W4-S0.
 *
 * Reads the user's current profile + recent decisions + recent overrides
 * so the orchestrator can seed agent context at session start. Per
 * /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 and the events-store query
 * recipe §8.2 (which getCurrentProfile + getRecentDecisionsForUser +
 * getRecentOverridesForUser collectively implement).
 *
 * Why this is the first tool:
 *   - Pure read — no event emission, so it exercises the Tool contract
 *     without depending on the deterministic engine (score_deal) yet.
 *   - Wraps EventsRepositoryReads — the boundary we just shipped in W1-S4.
 *   - Validates the in/out Zod schemas + ToolContext injection pattern
 *     that every subsequent tool will follow.
 *
 * Wave 1 tool catalog row this implements (agent-mesh §3.2):
 *   recall_user_context | No | { userId } | { profile, recentDecisions, recentOverrides } | None
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input schema =====

/**
 * Input — just the userId. The orchestrator passes it from the session
 * context. Accepts ObjectId or 24-char hex string (mirrors the repository
 * read API ergonomics).
 */
export const RecallUserContextInputSchema = z.object({
  userId: z.union([
    z.instanceof(Types.ObjectId),
    z.string().refine((s) => Types.ObjectId.isValid(s), {
      message: 'Expected 24-char hex ObjectId string',
    }),
  ]),
  /** Optional override for how many decisions to pull (default 10 per §8.2). */
  decisionsLimit: z.number().int().positive().max(100).optional(),
  /** Optional override for how many overrides to pull (default 20 per §8.2). */
  overridesLimit: z.number().int().positive().max(100).optional(),
});

export type RecallUserContextInput = z.infer<typeof RecallUserContextInputSchema>;

// ===== Output schema =====

/**
 * Output shape. Payload typing is shallow at the tool boundary because:
 *   - The orchestrator pipes these into the LLM as context; deep types
 *     don't survive the JSON serialization anyway.
 *   - Per-event-payload types live in models/events/*Event.ts and are
 *     the source of truth for downstream consumers that need them.
 *
 * We DO preserve _id and traceId on each event so the agent can refer
 * back to specific events in subsequent tool calls.
 */
const EventSummarySchema = z.object({
  _id: z.unknown(), // ObjectId; opaque at this layer
  traceId: z.string(),
  eventType: z.string(),
  timestamp: z.date(),
  payload: z.record(z.string(), z.unknown()),
});

export const RecallUserContextOutputSchema = z.object({
  /** Most recent ProfileEvent payload, or null if user has none yet. */
  profile: z.record(z.string(), z.unknown()).nullable(),
  /** Most recent N DecisionEvents (newest first). May be empty array. */
  recentDecisions: z.array(EventSummarySchema),
  /** Most recent N OverrideEvents (newest first). May be empty array. */
  recentOverrides: z.array(EventSummarySchema),
});

export type RecallUserContextOutput = z.infer<typeof RecallUserContextOutputSchema>;

// ===== Tool implementation =====

export const recallUserContext: Tool<RecallUserContextInput, RecallUserContextOutput> = {
  name: 'recall_user_context',
  description:
    'Loads the user current profile, recent decisions, and recent overrides — used by the orchestrator to seed agent context at the start of a session. Pure read; emits no events.',
  inputSchema: RecallUserContextInputSchema,
  outputSchema: RecallUserContextOutputSchema,
  invokeLLM: false,
  sideEffects: [], // Pure read — no events, no external APIs
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(input: RecallUserContextInput, ctx: ToolContext): Promise<RecallUserContextOutput> {
    // Trust boundary: validate input even though TS thinks it's clean.
    const validated = RecallUserContextInputSchema.parse(input);
    const decisionsLimit = validated.decisionsLimit ?? 10;
    const overridesLimit = validated.overridesLimit ?? 20;

    // Three parallel reads — see events store §8.2 for the recipe.
    const [profile, recentDecisions, recentOverrides] = await Promise.all([
      ctx.eventsReads.getCurrentProfile(validated.userId),
      ctx.eventsReads.getRecentDecisionsForUser(validated.userId, decisionsLimit),
      ctx.eventsReads.getRecentOverridesForUser(validated.userId, overridesLimit),
    ]);

    // Output validation — same trust boundary, return side.
    return RecallUserContextOutputSchema.parse({
      profile: profile as Record<string, unknown> | null,
      recentDecisions: recentDecisions.map((e) => ({
        _id: e._id,
        traceId: e.traceId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        payload: e.payload as unknown as Record<string, unknown>,
      })),
      recentOverrides: recentOverrides.map((e) => ({
        _id: e._id,
        traceId: e.traceId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        payload: e.payload as unknown as Record<string, unknown>,
      })),
    });
  },
};
