/**
 * ConversationEvent — sixth wave-1 event type (W1-S2 part 6).
 *
 * Per-turn chat capture. The highest-VOLUME event type in the substrate
 * (one per chat turn). Each event captures both sides of the exchange
 * — the user input and the agent response — plus the orchestrator's
 * intent routing, tool calls executed during the turn, model used,
 * token usage, and latency.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.6.
 *
 * Architectural role:
 *   - Conversation memory — orchestrator queries these to reconstruct
 *     thread history when a returning user opens /app
 *   - Cost observability — tokenUsage feeds per-user cost rollups
 *   - Intent analytics — which intents fire most often; classifier
 *     accuracy validation
 *   - Eval source — real conversation turns are golden-set candidates
 *
 * Privacy note: `userInput.text` and `agentResponse.text` are stored in
 * full for substrate value. PII redaction happens at the agent input
 * layer before write (per agent mesh §6 pre-processing pipeline);
 * if a user requests deletion, the values are redacted to `'[REDACTED]'`
 * while preserving the event envelope.
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const InputMethodSchema = z.enum(['text', 'voice', 'paste']);
export type ConversationInputMethod = z.infer<typeof InputMethodSchema>;

/**
 * Chat intents per agent mesh §2.2 routing table.
 *
 * `off_topic` (W6-S2.6) is distinct from `fallback`:
 *   - fallback   = "I'm not sure WHICH real-estate intent this is"
 *                  → route to QA agent for graceful disambiguation
 *   - off_topic  = "This is clearly NOT a real-estate question"
 *                  → router short-circuits with a templated deflection,
 *                    no LLM call (cost + brand + abuse containment).
 *
 * Off-topic examples: politics, recipes, code, stocks-by-ticker.
 * In-scope-adjacent education (1031 exchanges, Fed rates → cap rates,
 * stocks-vs-real-estate strategy) stays `qa_general`. Bias toward
 * engagement; off_topic is reserved for clearly unrelated input.
 */
const ChatIntentSchema = z.enum([
  'analyze_property',
  'share_profile',
  'qa_metric',
  'qa_decision',
  'qa_general',
  'override_assumption',
  'request_audit_trail',
  'request_export',
  'request_critique',
  'save_action',
  'fallback',
  'off_topic',
]);
export type ChatIntent = z.infer<typeof ChatIntentSchema>;

const RoutedToSchema = z.enum([
  'agent:deal_scoring',
  'agent:qa',
  'agent:adversarial_critic',
  'tool_only',
  'fallback',
  // W6-S2.6 — router short-circuits off-topic turns to a templated
  // deflection response. No agent invoked; substrate records the routed-to
  // value for activation-funnel queries ("how often are we deflecting?").
  'deflection:off_topic',
]);
export type RoutedTo = z.infer<typeof RoutedToSchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

// ===== Sub-schemas =====

const UserInputSchema = z.object({
  text: z.string(), // empty allowed (cancelled turn / "[REDACTED]" post-deletion)
  inputMethod: InputMethodSchema,
  redactedPII: z.boolean().optional(),
});

const IntentClassificationSchema = z.object({
  intent: ChatIntentSchema,
  confidence: z.number().min(0).max(100),
  classifierModel: z.string().min(1),
});

const ToolCallSchema = z.object({
  toolName: z.string().min(1),
  inputHash: z.string().min(1), // SHA-256 hash; never the raw input
  success: z.boolean(),
  durationMs: z.number().nonnegative(),
});

const AgentResponseSchema = z.object({
  text: z.string(), // empty allowed (cancelled mid-stream / "[REDACTED]")
  structuredOutputs: z.array(z.string()), // component-type names emitted
  relatedEventIds: z.array(ObjectIdSchema), // AnalysisEvent, DecisionEvent, etc. this turn produced
});

const TokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative(),
  estimatedCostCents: z.number().nonnegative(),
});

// ===== Zod payload schema =====

/**
 * ConversationPayloadSchema — runtime validation for ConversationEvent payload.
 *
 * Validates the conversation-turn structure strictly. Token usage and
 * cost fields are non-negative; intent confidence is 0-100; sessionId
 * must be a valid UUID; turnNumber is a positive integer.
 */
export const ConversationPayloadSchema = z.object({
  /** UUID v4 grouping turns into a single chat session. */
  sessionId: z.string().uuid(),

  /** 1-indexed turn number within the session. */
  turnNumber: z.number().int().positive(),

  // The exchange
  userInput: UserInputSchema,
  intentClassification: IntentClassificationSchema,
  routedTo: RoutedToSchema,
  toolCalls: z.array(ToolCallSchema), // may be empty (tool-less turn)
  agentResponse: AgentResponseSchema,

  // Cost + latency observability
  tokenUsage: TokenUsageSchema,
  modelUsed: z.string().min(1),
  totalDurationMs: z.number().nonnegative(),

  /** True if the turn was cancelled mid-stream by the user. */
  cancelled: z.boolean().optional(),
});

// ===== TypeScript interface =====

export interface ConversationPayload {
  sessionId: string;
  turnNumber: number;

  userInput: {
    text: string;
    inputMethod: ConversationInputMethod;
    redactedPII?: boolean;
  };

  intentClassification: {
    intent: ChatIntent;
    confidence: number;
    classifierModel: string;
  };

  routedTo: RoutedTo;

  toolCalls: Array<{
    toolName: string;
    inputHash: string;
    success: boolean;
    durationMs: number;
  }>;

  agentResponse: {
    text: string;
    structuredOutputs: string[];
    relatedEventIds: Types.ObjectId[];
  };

  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    estimatedCostCents: number;
  };

  modelUsed: string;
  totalDurationMs: number;

  /** True if the turn was cancelled by the user before completion. */
  cancelled?: boolean;
}

// ===== Mongoose discriminator =====

const conversationEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * ConversationEventModel — Mongoose model for ConversationEvents.
 *
 * Registered as discriminator on BaseEventModel with `eventType: 'conversation'`.
 * Stored in unified `events` collection. Append-only enforcement inherits.
 */
export const ConversationEventModel = BaseEventModel.discriminator(
  'conversation',
  conversationEventSchema
);
