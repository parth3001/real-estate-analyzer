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

export interface AnthropicAdapter {
  call(input: AnthropicCallInput): Promise<AnthropicCallOutput>;
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

export const defaultAnthropicAdapter: AnthropicAdapter = {
  async call(input: AnthropicCallInput): Promise<AnthropicCallOutput> {
    const model = resolveModelName(input.tier);
    const response = await getClient().messages.create({
      model,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0,
      system: input.systemPrompt,
      messages: [{ role: 'user', content: input.userPrompt }],
    });

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
};

// ===== Module-level adapter slot (testability) =====

let currentAdapter: AnthropicAdapter = defaultAnthropicAdapter;

/** Override the adapter at module level. Tests use this; production never should. */
export function setAnthropicAdapter(adapter: AnthropicAdapter): void {
  currentAdapter = adapter;
}

/** Reset to the default (real-SDK) adapter. */
export function resetAnthropicAdapter(): void {
  currentAdapter = defaultAnthropicAdapter;
}

/** Get the currently-active adapter (default or test-overridden). */
export function getAnthropicAdapter(): AnthropicAdapter {
  return currentAdapter;
}
