/**
 * Anthropic SDK adapter — shared by every LLM-using tool.
 *
 * Wraps `@anthropic-ai/sdk` behind a minimal interface so:
 *   1. Tools depend on the contract, not on the SDK shape (insulates
 *      against SDK API churn)
 *   2. Tests substitute a fake adapter without mocking the module
 *      (no network calls in CI; no API key required)
 *   3. Cost computation has a single point of truth — the adapter
 *      always returns the {input, output, cached} token triple that
 *      anthropicPricing.computeAnthropicCostCents() consumes
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.3 (adapter pattern for legacy
 * services + LLM clients) and §6 (model-tier routing).
 *
 * MODEL IDENTIFIERS
 * -----------------
 *
 * Model names change as Anthropic ships new versions. Resolved via env
 * vars with documented defaults — keeps deployment flexibility without
 * forcing every tool to know which exact model string is current.
 *
 *   ANTHROPIC_HAIKU_MODEL    default: 'claude-haiku-4-5'
 *   ANTHROPIC_SONNET_MODEL   default: 'claude-sonnet-4-6'
 *   ANTHROPIC_OPUS_MODEL     default: 'claude-opus-4-7'
 *
 * SECURITY
 * --------
 *
 * The API key is read from ANTHROPIC_API_KEY at SDK-client construction
 * time. If unset, the SDK constructor throws. Tools that DON'T use this
 * adapter (i.e., the 7 deterministic-code tools) MUST NOT crash on
 * missing key — they don't touch the SDK at all.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ModelTier } from '../tools/types';
import { logger } from '../../utils/logger';

// ===== Prompt caching (Issue #106 Phase A) =====
//
// Anthropic caches system prompts when wrapped as a content-block array
// with `cache_control: { type: 'ephemeral' }` on the cached block. Read
// from cache costs ~10% of normal input tokens — a 30-50% effective
// discount on the typical agent turn since the system prompt is the
// bulk of input tokens.
//
// The cache MIN size is ~1024 tokens (Anthropic-documented). We use a
// character-count proxy of 2000 to stay comfortably above the floor
// (roughly 4 chars per token). Falling below it costs nothing — the
// SDK silently ignores cache_control on too-small blocks — but adding
// the wrapper unnecessarily noises the wire payload, hence the gate.
//
// We toggle via env var so tests can disable when not relevant.

const PROMPT_CACHE_MIN_CHARS = 2000;
const PROMPT_CACHE_ENABLED =
  (process.env.ANTHROPIC_PROMPT_CACHE_ENABLED ?? 'true').toLowerCase() ===
  'true';

/**
 * Format a system prompt for the SDK. Returns either:
 *   - a string (when below the cache threshold or feature off)
 *   - a content-block array with cache_control on the single block
 *     (when above the threshold + feature on)
 *
 * Both shapes are valid SDK inputs; the array form opts into caching.
 */
function formatSystemForCache(
  systemPrompt: string
): string | Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> {
  if (!PROMPT_CACHE_ENABLED || systemPrompt.length < PROMPT_CACHE_MIN_CHARS) {
    return systemPrompt;
  }
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

// ===== Resolved model names =====

export function resolveModelName(tier: ModelTier): string {
  switch (tier) {
    case 'haiku':
      return process.env.ANTHROPIC_HAIKU_MODEL ?? 'claude-haiku-4-5';
    case 'sonnet':
      return process.env.ANTHROPIC_SONNET_MODEL ?? 'claude-sonnet-4-6';
    case 'opus':
      return process.env.ANTHROPIC_OPUS_MODEL ?? 'claude-opus-4-7';
  }
}

// ===== Adapter contract =====

export interface AnthropicCallInput {
  /** Model tier — adapter resolves to the actual model string. */
  tier: ModelTier;
  /** System prompt. Cacheable above ~1024 tokens via SDK cache_control. */
  systemPrompt: string;
  /** User-turn content (single message — adapter wraps it as the user role). */
  userPrompt: string;
  /** Cap on response length; defaults to 1024. */
  maxTokens?: number;
  /** Temperature override; defaults to 0 for extraction tasks. */
  temperature?: number;
}

/**
 * Multi-turn tool-use call. Used by the agent runner where the model
 * issues tool_use blocks, the runner executes them, feeds results back,
 * and loops until the model emits final text.
 *
 * The adapter expects a fully-constructed messages array (the runner
 * builds it up across iterations) plus the tools the agent is allowed
 * to call.
 */
export interface AnthropicMultiTurnInput {
  tier: ModelTier;
  systemPrompt: string;
  /** Conversation so far — the runner builds this across iterations. */
  messages: Array<{
    role: 'user' | 'assistant';
    content:
      | string
      | Array<
          | { type: 'text'; text: string }
          | { type: 'tool_use'; id: string; name: string; input: unknown }
          | {
              type: 'tool_result';
              tool_use_id: string;
              content: string;
              is_error?: boolean;
            }
        >;
  }>;
  /** Tool definitions the model can call. JSON-schema input_schema. */
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  maxTokens?: number;
  temperature?: number;
}

/** Content block in the assistant's response. */
export type AnthropicResponseBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown };

/**
 * Response from a multi-turn call. The runner inspects `blocks` to
 * decide whether to loop (any tool_use present) or stop (text-only).
 */
export interface AnthropicMultiTurnOutput {
  blocks: AnthropicResponseBlock[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
  model: string;
  stopReason: string | null;
}

export interface AnthropicCallOutput {
  /** Concatenated text content from the response (joins all text blocks). */
  text: string;
  /** Token usage for cost computation. Cached count from the SDK if available. */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
  /** The actual model string the API was called with. */
  model: string;
  /** Stop reason from the API (for observability + debugging). */
  stopReason: string | null;
}

/**
 * Per-iteration stream event from `streamWithTools()`. The agent runner
 * converts these to the higher-level OrchestratorStreamEvent protocol
 * the SSE route emits to the browser.
 *
 *   text_delta — incremental tokens. Concatenate to build the running
 *                text snapshot. Emitted as the SDK pipes tokens through.
 *   iteration_end — sent once when the SDK reports `message_stop`. Carries
 *                   the final `blocks` (text + tool_use), usage counters,
 *                   and the stop reason. The runner uses this to (a) decide
 *                   whether to loop (any tool_use? → execute, loop again),
 *                   (b) write the per-iteration CostEvent.
 */
export type AnthropicStreamEvent =
  | { type: 'text_delta'; text: string }
  | {
      type: 'iteration_end';
      blocks: AnthropicResponseBlock[];
      usage: {
        inputTokens: number;
        outputTokens: number;
        cachedTokens: number;
      };
      model: string;
      stopReason: string | null;
    };

/**
 * Streaming variant of `callWithTools`. Yields normalized per-iteration
 * events as the SDK pipes them in. Honors the caller's AbortSignal:
 * cancelling the signal aborts the in-flight SDK request (Anthropic's
 * MessageStream exposes `controller.abort()`).
 *
 * NOTE: this is a SINGLE iteration — the agent runner's tool-use loop
 * calls this MULTIPLE times (once per iteration). The runner orchestrates
 * tool execution + message-append between iterations.
 */
export interface AnthropicStreamHandle {
  /** AsyncIterable of stream events for this iteration. */
  events: AsyncIterable<AnthropicStreamEvent>;
  /** Abort the underlying SDK request. Safe to call after iteration ends (no-op). */
  abort(): void;
}

export interface AnthropicAdapter {
  /** Single-shot call. Used by extraction-style tools (profile_extraction, intent classifier). */
  call(input: AnthropicCallInput): Promise<AnthropicCallOutput>;
  /** Multi-turn tool-use call. Used by the agent runner (non-streaming path). */
  callWithTools(input: AnthropicMultiTurnInput): Promise<AnthropicMultiTurnOutput>;
  /**
   * Streaming variant — W6-S3. Used by agentRunner.runAgentStream for the
   * chat overlay's SSE surface. ONE iteration per call; the runner loops
   * across iterations for tool-use.
   */
  streamWithTools(
    input: AnthropicMultiTurnInput,
    signal?: AbortSignal
  ): AnthropicStreamHandle;
}

// ===== Default adapter (wraps the real SDK) =====

/**
 * Lazy SDK-client construction so importing this module doesn't crash
 * when ANTHROPIC_API_KEY is absent (e.g., in tests using the stub
 * adapter, or in CI before any LLM tool is invoked).
 */
let lazyClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!lazyClient) {
    lazyClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    });
  }
  return lazyClient;
}

// ===== Transient-error retry =====
//
// Per /docs/PRODUCT_2.0_AGENT_MESH.md §2.6: transient errors retry
// with exponential backoff. The TOOLS carry retrySemantics, but the
// agent-level LLM calls didn't — a gap the W5 live test surfaced when
// a 529 overloaded_error killed an entire run.
//
// Retry on: 429 (rate limit), 500/502/503/529 (server / overloaded),
// and network-level errors (no .status). Do NOT retry on 400 (our
// malformed request — a bug to fix, not paper over), 401 (auth), 413.

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);
const MAX_LLM_ATTEMPTS = 3;
const RETRY_BASE_MS = 1000;

function isRetryableLlmError(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  if (typeof status === 'number') return RETRYABLE_STATUS.has(status);
  // No status — network/timeout error. Retryable.
  if (err instanceof Error) return true;
  return false;
}

/**
 * Run an Anthropic SDK call with exponential-backoff retry on transient
 * errors. Wraps both `call` and `callWithTools`.
 */
async function withLlmRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_LLM_ATTEMPTS || !isRetryableLlmError(err)) {
        throw err;
      }
      const status = (err as { status?: number } | undefined)?.status;
      const backoffMs = RETRY_BASE_MS * 2 ** (attempt - 1);
      logger.warn('anthropicAdapter: transient LLM error — retrying', {
        label,
        attempt,
        nextAttemptIn: `${backoffMs}ms`,
        status: status ?? 'network',
        error: err instanceof Error ? err.message.slice(0, 200) : String(err),
      });
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw lastErr;
}

/**
 * Build the Anthropic `messages.create` params, gating `temperature` on
 * caller opt-in (Task B2 / drifting-booping-ripple plan, 2026-06-14).
 *
 * Anthropic deprecated `temperature` on Opus 4.5+ — passing it to those
 * models returns 400 "temperature is deprecated for this model". The
 * adversarialCritic and dealScoring agents (both opus tier) were silently
 * broken by the adapter's `?? 0` default that always included it.
 *
 * Behavior:
 *   - Caller didn't pass temperature → omit from API call entirely;
 *     model uses its own default (already low for instruction-following).
 *   - Caller passed an explicit number (e.g., intentClassifier passes 0
 *     on haiku, which still accepts it) → forward as-is.
 *
 * Future-proof: when more models deprecate the param, no further change
 * is needed here — callers that explicitly want a non-default temperature
 * are responsible for picking a model that supports it.
 */
function maybeIncludeTemperature(
  params: Record<string, unknown>,
  temperature: number | undefined
): void {
  if (typeof temperature === 'number') {
    params.temperature = temperature;
  }
}

export const defaultAnthropicAdapter: AnthropicAdapter = {
  async call(input: AnthropicCallInput): Promise<AnthropicCallOutput> {
    const model = resolveModelName(input.tier);
    // Wrap the system prompt for prompt-caching when it's large enough
    // to be worth caching (Issue #106 Phase A). See formatSystemForCache.
    const systemForApi = formatSystemForCache(input.systemPrompt);
    const callParams: Record<string, unknown> = {
      model,
      max_tokens: input.maxTokens ?? 1024,
      // Cast through unknown: the SDK's `system` field accepts both
      // a string and an array-of-blocks, but the union type is
      // narrower in the TS bindings than the wire reality.
      system: systemForApi as unknown as string,
      messages: [{ role: 'user', content: input.userPrompt }],
    };
    maybeIncludeTemperature(callParams, input.temperature);
    const response = (await withLlmRetry(`call:${model}`, () =>
      getClient().messages.create(
        callParams as unknown as Parameters<Anthropic['messages']['create']>[0]
      )
    )) as Anthropic.Message;

    // Concatenate text blocks. Multi-block responses are unusual for
    // single-shot extraction but defensive merging is cheap.
    const text = response.content
      .filter(
        (block): block is Extract<typeof block, { type: 'text' }> =>
          block.type === 'text'
      )
      .map((block) => block.text)
      .join('');

    // Cache-read counts vary by SDK version. Read defensively.
    type UsageWithCache = typeof response.usage & {
      cache_read_input_tokens?: number;
    };
    const usage = response.usage as UsageWithCache;
    const cachedTokens = usage.cache_read_input_tokens ?? 0;

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cachedTokens,
      },
      model,
      stopReason: response.stop_reason ?? null,
    };
  },

  async callWithTools(
    input: AnthropicMultiTurnInput
  ): Promise<AnthropicMultiTurnOutput> {
    const model = resolveModelName(input.tier);

    // The SDK accepts our message shape directly. We cast through unknown
    // because the SDK's union types are deep and our minimal contract is
    // a subset.
    type SdkMessageCreate = Parameters<
      typeof getClient.prototype extends never
        ? Anthropic['messages']['create']
        : Anthropic['messages']['create']
    >[0];
    const callParams: Record<string, unknown> = {
      model,
      max_tokens: input.maxTokens ?? 4096,
      system: formatSystemForCache(input.systemPrompt),
      messages: input.messages,
      tools: input.tools,
    };
    maybeIncludeTemperature(callParams, input.temperature);
    const params = callParams as unknown as SdkMessageCreate;

    // Force the non-streaming return type. params has no `stream: true`,
    // so the SDK returns Message — but the overload union confuses TS.
    const response = (await withLlmRetry(`callWithTools:${model}`, () =>
      getClient().messages.create(params)
    )) as Anthropic.Message;

    const blocks: AnthropicResponseBlock[] = response.content
      .filter(
        (b): b is Extract<typeof b, { type: 'text' } | { type: 'tool_use' }> =>
          b.type === 'text' || b.type === 'tool_use'
      )
      .map((b) => {
        if (b.type === 'text') return { type: 'text', text: b.text };
        return {
          type: 'tool_use',
          id: b.id,
          name: b.name,
          input: b.input,
        };
      });

    type UsageWithCache = typeof response.usage & {
      cache_read_input_tokens?: number;
    };
    const usage = response.usage as UsageWithCache;
    return {
      blocks,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cachedTokens: usage.cache_read_input_tokens ?? 0,
      },
      model,
      stopReason: response.stop_reason ?? null,
    };
  },

  streamWithTools(
    input: AnthropicMultiTurnInput,
    signal?: AbortSignal
  ): AnthropicStreamHandle {
    const model = resolveModelName(input.tier);

    // Lazy-construct the SDK stream when iteration begins so a caller
    // that never iterates doesn't burn an API request.
    type SdkMessageCreate = Parameters<
      Anthropic['messages']['stream']
    >[0];
    const callParams: Record<string, unknown> = {
      model,
      max_tokens: input.maxTokens ?? 4096,
      system: formatSystemForCache(input.systemPrompt),
      messages: input.messages,
      tools: input.tools,
    };
    maybeIncludeTemperature(callParams, input.temperature);
    const params = callParams as unknown as SdkMessageCreate;

    // The SDK's stream() returns synchronously and runs in the background.
    // We attach our own AbortSignal so callers (the SSE route on client
    // disconnect, the orchestrator on cancellation) can halt mid-stream.
    const sdkStream = getClient().messages.stream(params);
    if (signal) {
      if (signal.aborted) {
        sdkStream.abort();
      } else {
        signal.addEventListener('abort', () => sdkStream.abort(), {
          once: true,
        });
      }
    }

    async function* iterate(): AsyncGenerator<AnthropicStreamEvent> {
      let accumulatedBlocks: AnthropicResponseBlock[] = [];
      let usage = { inputTokens: 0, outputTokens: 0, cachedTokens: 0 };
      let stopReason: string | null = null;

      try {
        for await (const event of sdkStream) {
          // Stream the visible text as it arrives — first-byte time win.
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta'
          ) {
            const textDelta = (event.delta as { text?: string }).text;
            if (typeof textDelta === 'string' && textDelta.length > 0) {
              yield { type: 'text_delta', text: textDelta };
            }
          }
          if (event.type === 'message_delta') {
            stopReason = event.delta?.stop_reason ?? stopReason;
            // The SDK emits updated `usage` (output_tokens grows
            // monotonically) on message_delta. We capture the final value
            // when message_stop fires.
            const u = (event as { usage?: { output_tokens?: number } }).usage;
            if (u?.output_tokens != null) {
              usage.outputTokens = u.output_tokens;
            }
          }
        }

        // After iteration completes, the SDK has the assembled final
        // Message. finalMessage() resolves synchronously at this point.
        const finalMessage = await sdkStream.finalMessage();
        accumulatedBlocks = finalMessage.content
          .filter(
            (b): b is Extract<typeof b, { type: 'text' } | { type: 'tool_use' }> =>
              b.type === 'text' || b.type === 'tool_use'
          )
          .map((b) => {
            if (b.type === 'text') return { type: 'text', text: b.text };
            return {
              type: 'tool_use',
              id: b.id,
              name: b.name,
              input: b.input,
            };
          });
        type UsageWithCache = typeof finalMessage.usage & {
          cache_read_input_tokens?: number;
        };
        const finalUsage = finalMessage.usage as UsageWithCache;
        usage = {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
          cachedTokens: finalUsage.cache_read_input_tokens ?? 0,
        };
        stopReason = finalMessage.stop_reason ?? stopReason;
      } catch (err) {
        // If the caller aborted, the SDK throws APIUserAbortError. We
        // surface that as a thrown error so the runner can clean up; the
        // outer try/catch in agentRunner.runAgentStream catches and emits
        // a `cancelled` orchestrator event.
        throw err;
      }

      yield {
        type: 'iteration_end',
        blocks: accumulatedBlocks,
        usage,
        model,
        stopReason,
      };
    }

    return {
      events: iterate(),
      abort(): void {
        sdkStream.abort();
      },
    };
  },
};

// ===== Module-level adapter slot (testability) =====

let currentAdapter: AnthropicAdapter = defaultAnthropicAdapter;

/**
 * Override the adapter at module level. Tests use this; production never
 * should. Accepts `Partial<AnthropicAdapter>` and auto-completes missing
 * methods with throwing stubs — that way a test that exercises a path
 * it didn't stub fails loudly with a clear message, but tests that only
 * use one method don't have to provide all three.
 */
export function setAnthropicAdapter(adapter: Partial<AnthropicAdapter>): void {
  currentAdapter = makeTestAdapter(adapter);
}

/** Reset to the default (real-SDK) adapter. */
export function resetAnthropicAdapter(): void {
  currentAdapter = defaultAnthropicAdapter;
}

/** Get the currently-active adapter (default or test-overridden). */
export function getAnthropicAdapter(): AnthropicAdapter {
  return currentAdapter;
}

/**
 * Test helper: completes a partial adapter with no-op default
 * implementations of any methods the caller didn't supply. Lets test
 * code stub ONLY the methods it cares about (e.g., just `call` when
 * testing a single-shot tool, just `callWithTools` when testing the
 * agent runner). The no-op default throws if invoked at test time —
 * if your test accidentally exercises a path it didn't stub, you find
 * out loudly.
 */
export function makeTestAdapter(
  partial: Partial<AnthropicAdapter>
): AnthropicAdapter {
  return {
    async call(input) {
      if (partial.call) return partial.call(input);
      throw new Error(
        'makeTestAdapter: `call` was invoked but no implementation was provided in the test stub'
      );
    },
    async callWithTools(input) {
      if (partial.callWithTools) return partial.callWithTools(input);
      throw new Error(
        'makeTestAdapter: `callWithTools` was invoked but no implementation was provided in the test stub'
      );
    },
    streamWithTools(input, signal) {
      if (partial.streamWithTools) return partial.streamWithTools(input, signal);
      throw new Error(
        'makeTestAdapter: `streamWithTools` was invoked but no implementation was provided in the test stub'
      );
    },
  };
}

/**
 * Test helper: build an AnthropicStreamHandle that yields a scripted
 * sequence of text deltas followed by an iteration_end. Saves boilerplate
 * in stream-related tests. Honors the AbortSignal so cancellation tests
 * can fire the signal mid-stream and expect the right cleanup behavior.
 */
export function makeScriptedStreamHandle(opts: {
  deltas: string[];
  blocks: AnthropicResponseBlock[];
  usage?: { inputTokens: number; outputTokens: number; cachedTokens: number };
  model?: string;
  stopReason?: string | null;
  /** Optional ms to wait between deltas — defaults to 0 (synchronous). */
  perDeltaDelayMs?: number;
  signal?: AbortSignal;
}): AnthropicStreamHandle {
  const usage = opts.usage ?? {
    inputTokens: 100,
    outputTokens: 50,
    cachedTokens: 0,
  };
  const model = opts.model ?? 'claude-sonnet-4-6';
  const stopReason = opts.stopReason ?? 'end_turn';
  let aborted = false;

  if (opts.signal) {
    opts.signal.addEventListener(
      'abort',
      () => {
        aborted = true;
      },
      { once: true }
    );
  }

  async function* iterate(): AsyncGenerator<AnthropicStreamEvent> {
    for (const text of opts.deltas) {
      if (aborted) {
        const err = new Error('aborted');
        (err as Error & { name: string }).name = 'AbortError';
        throw err;
      }
      if (opts.perDeltaDelayMs && opts.perDeltaDelayMs > 0) {
        await new Promise((r) => setTimeout(r, opts.perDeltaDelayMs));
      }
      yield { type: 'text_delta', text };
    }
    yield {
      type: 'iteration_end',
      blocks: opts.blocks,
      usage,
      model,
      stopReason,
    };
  }

  return {
    events: iterate(),
    abort(): void {
      aborted = true;
    },
  };
}
