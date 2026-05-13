/**
 * Tool contract — the foundation every wave 1 agent tool implements.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.1.
 *
 * Architectural invariants (enforced by this contract):
 *
 *   1. **Tools are the only place state changes happen.** Agents reason,
 *      tools act. An agent without a tool call is observation-only.
 *
 *   2. **Side effects are declared, not discovered.** Every event a tool
 *      writes is listed in `sideEffects`; every external API it hits is
 *      listed too. This is the contract that lets us reason about a
 *      tool's behavior without reading its implementation.
 *
 *   3. **`invokeLLM: false` is the default and the rule for scoring.**
 *      The score-producing path (compute_analysis → score_deal) is pure
 *      code. This is enforcement of the deterministic-scoring
 *      non-negotiable (architecture §1.5). Only `profile_extraction`
 *      flips it to a model tier — and that tool doesn't touch the score.
 *
 *   4. **Input + output Zod schemas are runtime-validated.** TypeScript
 *      types are the developer ergonomic; the schemas are the trust
 *      boundary. Agents call tools across an LLM boundary, where TS
 *      types don't follow — the .parse() inside .execute() is what
 *      keeps malformed agent output from poisoning the substrate.
 *
 *   5. **Tool name is the global identifier.** Used by the agent's
 *      Anthropic SDK tool definitions, by the MCP server exposure, and
 *      by eval/regression harnesses. Renaming a tool is a breaking change.
 */

import type { ZodSchema } from 'zod';
import type { Types } from 'mongoose';
import type { EventType } from '../../models/events/types';
import type { EventsRepository } from '../../repositories/EventsRepository';
import type { EventsRepositoryReads } from '../../repositories/EventsRepositoryReads';

// ===== Model tier (re-exported here for tool-author ergonomics) =====

/**
 * Which Anthropic model tier a tool invokes (if any). Per architecture
 * §6 (model-tier routing). Tools that score are 'never'. Cheap parsing
 * tools (profile_extraction) use 'haiku'. No tool in wave 1 uses 'opus'.
 */
export type ModelTier = 'haiku' | 'sonnet' | 'opus';

// ===== Side-effect taxonomy =====

/**
 * Declarative side-effect descriptor. The orchestrator inspects this
 * before invoking a tool to decide on retry policy, tracing tags, and
 * whether the tool is safe in a "preview" / dry-run mode.
 */
export type SideEffect =
  | { type: 'event'; eventType: EventType }
  | { type: 'external_api'; service: string }
  | { type: 'cache_write'; cache: string };

// ===== Retry policy =====

/**
 * Retry policy for transient failures (network, timeout). Permanent
 * failures (validation errors, business-logic rejections) never retry.
 *
 * `maxAttempts: 1` = no retry. Backoff applies to attempts AFTER the first.
 */
export interface RetryPolicy {
  /** Total attempts including the first try. Set to 1 for no retry. */
  maxAttempts: number;
  /** Wait strategy between attempts. */
  backoff: 'none' | 'linear' | 'exponential';
  /** Base wait in ms (multiplied by attempt # for linear, 2^attempt for exponential). */
  baseMs: number;
}

/** Sensible default for read-only tools that hit an external API. */
export const DEFAULT_READ_RETRY: RetryPolicy = {
  maxAttempts: 3,
  backoff: 'exponential',
  baseMs: 500,
};

/** No retry — for tools that emit events (idempotency is not free at this layer). */
export const NO_RETRY: RetryPolicy = {
  maxAttempts: 1,
  backoff: 'none',
  baseMs: 0,
};

// ===== Tool context =====

/**
 * Execution context the orchestrator passes to every `tool.execute()`
 * call. Carries:
 *   - traceId    correlates every event a tool writes to the user
 *                interaction that triggered the call
 *   - userId     the user this interaction is "about" (event provenance)
 *   - institutionId  optional B2B context
 *   - eventsRepo / eventsReads  injected so tools don't reach for the
 *                singleton — makes unit-testing trivial
 *   - tools      lets tools call other tools (e.g., score_deal calling
 *                compute_analysis internally). Populated by the registry.
 */
export interface ToolContext {
  traceId: string;
  userId: Types.ObjectId;
  institutionId?: Types.ObjectId;
  eventsRepo: EventsRepository;
  eventsReads: EventsRepositoryReads;
  /** Other tools available for invocation. Wired up by the registry. */
  tools: Record<string, Tool<unknown, unknown>>;
}

// ===== Tool interface =====

/**
 * The contract every tool implements. Generic over input and output
 * types so consumers get typed agent-side ergonomics.
 *
 * **A tool MUST:**
 *   - Validate `input` against `inputSchema` (do this inside `execute()`
 *     — the runtime check is the trust boundary).
 *   - Validate its return value against `outputSchema` before returning.
 *   - Declare every event it writes in `sideEffects`.
 *   - Set `invokeLLM: false` unless the tool fundamentally requires
 *     an LLM (in which case justify in the description).
 *
 * **A tool MUST NOT:**
 *   - Mutate historical events. The repository layer (W1-S3) doesn't
 *     expose update/delete — but a tool author bypassing it via raw
 *     mongoose access would still hit the schema-level pre-hooks
 *     (W1-S1) and the DB role (W1-S5). Three safety nets, in order.
 *   - Make a decision that lands a `dealQuality` score without going
 *     through the deterministic engine. The score IS the engine's
 *     output; tools that call the engine pass it through unchanged.
 */
export interface Tool<TInput, TOutput> {
  /** Globally unique name. Used by Anthropic SDK + MCP server + evals. */
  name: string;

  /** Human-readable purpose. Read by the LLM when deciding to invoke. */
  description: string;

  /** Runtime input validation. Parsed at the start of execute(). */
  inputSchema: ZodSchema<TInput>;

  /** Runtime output validation. Parsed before returning. */
  outputSchema: ZodSchema<TOutput>;

  /**
   * Does this tool call an LLM internally? `false` is the default and the
   * rule for scoring tools. Only `profile_extraction` uses 'haiku'.
   */
  invokeLLM: false | ModelTier;

  /** Declarative side-effect manifest. */
  sideEffects: SideEffect[];

  /** Retry policy for transient failures. */
  retrySemantics: RetryPolicy;

  /** The actual implementation. */
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>;
}
