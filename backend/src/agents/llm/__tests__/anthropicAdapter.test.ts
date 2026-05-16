/**
 * W4-S7 acceptance test — Anthropic SDK adapter (shape only).
 *
 * The default adapter wraps the real SDK and is impractical to test
 * without network or API key. These tests verify:
 *   1. resolveModelName respects env vars + falls back to documented defaults
 *   2. The module-level adapter slot can be overridden + reset
 *   3. The adapter contract shape is what we expect
 */

import {
  resolveModelName,
  defaultAnthropicAdapter,
  getAnthropicAdapter,
  setAnthropicAdapter,
  resetAnthropicAdapter,
  makeTestAdapter,
  type AnthropicAdapter,
} from '../anthropicAdapter';

describe('anthropicAdapter (W4-S7)', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetAnthropicAdapter();
  });

  // ===== resolveModelName =====

  describe('resolveModelName', () => {
    it('returns documented default for haiku when env is unset', () => {
      delete process.env.ANTHROPIC_HAIKU_MODEL;
      expect(resolveModelName('haiku')).toBe('claude-haiku-4-5');
    });

    it('returns documented default for sonnet when env is unset', () => {
      delete process.env.ANTHROPIC_SONNET_MODEL;
      expect(resolveModelName('sonnet')).toBe('claude-sonnet-4-6');
    });

    it('returns documented default for opus when env is unset', () => {
      delete process.env.ANTHROPIC_OPUS_MODEL;
      expect(resolveModelName('opus')).toBe('claude-opus-4-7');
    });

    it('respects ANTHROPIC_HAIKU_MODEL override', () => {
      process.env.ANTHROPIC_HAIKU_MODEL = 'claude-haiku-5-0';
      expect(resolveModelName('haiku')).toBe('claude-haiku-5-0');
    });

    it('respects ANTHROPIC_SONNET_MODEL override', () => {
      process.env.ANTHROPIC_SONNET_MODEL = 'claude-sonnet-5-0';
      expect(resolveModelName('sonnet')).toBe('claude-sonnet-5-0');
    });

    it('respects ANTHROPIC_OPUS_MODEL override', () => {
      process.env.ANTHROPIC_OPUS_MODEL = 'claude-opus-5-0';
      expect(resolveModelName('opus')).toBe('claude-opus-5-0');
    });
  });

  // ===== Adapter slot =====

  describe('module-level adapter slot', () => {
    it('starts with the default adapter', () => {
      // Reset isn't strictly needed for the first test in the describe;
      // afterEach resets between tests, so first-test state is default.
      expect(getAnthropicAdapter()).toBe(defaultAnthropicAdapter);
    });

    it('setAnthropicAdapter swaps the active adapter', async () => {
      // setAnthropicAdapter accepts Partial<AnthropicAdapter> (per W6-S3
      // relaxation) and internally wraps with makeTestAdapter to fill in
      // missing methods. The stored reference is therefore the WRAPPED
      // adapter, not the input — so we assert behavior, not identity.
      setAnthropicAdapter({
        async call() {
          return {
            text: 'stub',
            usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
            model: 'stub-model',
            stopReason: 'end_turn',
          };
        },
      });
      const active = getAnthropicAdapter();
      expect(active).not.toBe(defaultAnthropicAdapter);
      const out = await active.call({
        tier: 'haiku',
        systemPrompt: '',
        userPrompt: '',
      });
      expect(out.text).toBe('stub');
      expect(out.model).toBe('stub-model');
    });

    it('resetAnthropicAdapter restores the default', () => {
      const fake = makeTestAdapter({
        async call() {
          return {
            text: '',
            usage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
            model: '',
            stopReason: null,
          };
        },
      });
      setAnthropicAdapter(fake);
      resetAnthropicAdapter();
      expect(getAnthropicAdapter()).toBe(defaultAnthropicAdapter);
    });

    it('a stub adapter satisfies the AnthropicAdapter contract', async () => {
      const fake = makeTestAdapter({
        async call(input) {
          return {
            text: `echo: ${input.userPrompt}`,
            usage: {
              inputTokens: 100,
              outputTokens: 50,
              cachedTokens: 0,
            },
            model: 'stub',
            stopReason: 'end_turn',
          };
        },
      });
      setAnthropicAdapter(fake);
      const result = await getAnthropicAdapter().call({
        tier: 'haiku',
        systemPrompt: 'system',
        userPrompt: 'hello',
      });
      expect(result.text).toBe('echo: hello');
      expect(result.usage).toEqual({
        inputTokens: 100,
        outputTokens: 50,
        cachedTokens: 0,
      });
    });
  });
});
