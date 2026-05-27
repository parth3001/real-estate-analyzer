/**
 * Layer 4 — narrative composer (Task #16, Path B).
 *
 * Takes a deterministic StressTestResult (from Layer 3 — the runner) and
 * composes a natural-language response. The LLM's only job here is prose;
 * every number it cites MUST come from the structured input. It cannot
 * invent numbers, do new math, or score the deal.
 *
 * Why this is bounded
 * -------------------
 * The original 81/100 bug was the LLM confabulating numbers because it
 * had control over math. Path B's defense is that math only happens in
 * Layer 3 (deterministic, no LLM). Layer 4 receives the result and
 * narrates it — but is structurally prevented from making up new
 * numbers because:
 *
 *   1. The system prompt explicitly forbids it.
 *   2. The user-turn payload is a JSON dump of the StressTestResult —
 *      the LLM literally sees every number it's allowed to cite.
 *   3. Post-generation sanity check (optional, defense-in-depth): we
 *      could scan the response for numeric tokens not present in the
 *      input. For v1 we rely on prompt + low temperature; can add the
 *      scanner later if drift shows up in production.
 *
 * Out-of-band facts the LLM can still surface
 * --------------------------------------------
 *   - Directional commentary ("score dropped", "cash flow got worse")
 *   - Bounded interpretation ("at 7.5%, the deal is now cash-flow-negative")
 *   - Honest "what's next" ("rate is the biggest lever here", "want to
 *     try a higher rent?")
 *
 * The LLM CANNOT surface:
 *   - New numeric values (e.g., "if you went to 8% it would score ~30")
 *   - Predictions about scenarios not in the result
 *   - Investment advice beyond what the score implies
 */

import type { AnthropicAdapter } from '../../agents/llm/anthropicAdapter';
import { logger } from '../../utils/logger';
import type { StressTestResult } from './schemas';

// ===== Output =====

export interface ComposedNarrative {
  /** The natural-language response the user will see. */
  text: string;
  /** Token usage for cost tracking. */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
}

// ===== System prompt =====

const SYSTEM_PROMPT = `You are a narrative composer for a real-estate stress-test agent.

You will receive a structured stress-test result: a baseline score, a
stressed score, per-field deltas, and warnings. Your job is to compose a
clear, concise natural-language response that helps the user understand
what changed and why.

HARD RULES (THESE ARE LOAD-BEARING)
====================================
1. You CAN ONLY cite numbers that appear in the structured input.
   Every dollar amount, every percentage, every score must be traceable
   to the JSON you were given.
2. You CANNOT invent scenarios. Don't say "if you went to 8% you'd see X"
   unless 8% is in the result. Don't speculate about scenarios not tested.
3. You CANNOT do math the engine didn't already do. Don't compute new
   ratios, derived metrics, or break-even points unless they're in the
   result.
4. You CANNOT pass moral judgment on the deal. No "this is a bad deal" or
   "you should walk away." Stick to what the numbers say.

WHAT YOU SHOULD DO
==================
- Lead with the headline: what the user asked you to stress, and how the
  score moved. ("At 7.5% rate, the deal scores 32 — down from 49.")
- Cite 2–3 supporting numbers from the deltas (cash flow, DSCR, IRR —
  whichever moved most).
- If the directional move is counterintuitive (e.g., score went up), note
  it honestly. ("This actually improved the score because...")
- If warnings were attached, surface them ("Note: vacancy of 60% is above
  typical range — engine ran the math but flag this assumption.")
- End with one short, neutral suggestion for what to try next IF
  appropriate — but only if it's grounded ("Rate seems to be the biggest
  lever here. Want to try a different rate or a lower purchase price?")

LENGTH
======
Keep it tight. 2–4 short paragraphs. Markdown-light: bold the score and
key numbers, maybe a bullet list for the deltas, no headers, no horizontal
rules. The DealScoreCard in the UI shows the structured numbers; your
prose is the interpretation, not a replica.

OUTPUT
======
Return ONLY the narrative text. No JSON, no system commentary, no markdown
fences.`;

// ===== Helpers =====

/** Format a number as currency for the structured input the LLM sees. */
function fmtDollars(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

/** Format engine-unit values per their unit type. */
function formatDelta(d: StressTestResult['deltas'][number]): string {
  const before =
    d.engineUnit === 'percent'
      ? `${d.baselineValue.toFixed(2)}%`
      : d.engineUnit === 'dollars'
      ? fmtDollars(d.baselineValue)
      : d.engineUnit === 'years'
      ? `${d.baselineValue} yr`
      : String(d.baselineValue);
  const after =
    d.engineUnit === 'percent'
      ? `${d.stressedValue.toFixed(2)}%`
      : d.engineUnit === 'dollars'
      ? fmtDollars(d.stressedValue)
      : d.engineUnit === 'years'
      ? `${d.stressedValue} yr`
      : String(d.stressedValue);
  return `${d.label}: ${before} → ${after}`;
}

/**
 * Render the structured StressTestResult as a tight JSON-y block for the
 * LLM. We don't use literal JSON.stringify because the LLM treats prose
 * with key/value pairs more cooperatively than raw JSON. Both work; this
 * is slightly more token-efficient.
 */
function renderResultForLlm(
  result: StressTestResult,
  userMessage: string
): string {
  const lines: string[] = [];
  lines.push('USER MESSAGE:');
  lines.push(`  "${userMessage}"`);
  lines.push('');
  lines.push('BASELINE (before perturbation):');
  lines.push(`  Deal score: ${result.baseline.dealQuality}/100 (${result.baseline.qualityLabel})`);
  lines.push(`  Monthly cash flow: ${fmtDollars(result.baseline.monthlyCashFlow)}`);
  lines.push(`  DSCR: ${result.baseline.dscr.toFixed(2)}`);
  lines.push(`  Cap rate: ${result.baseline.capRate.toFixed(2)}%`);
  lines.push(`  Cash-on-cash: ${result.baseline.cashOnCashReturn.toFixed(2)}%`);
  lines.push(`  IRR (10-yr): ${(result.baseline.irr * 100).toFixed(2)}%`);
  lines.push(`  Walk-away price: ${fmtDollars(result.baseline.walkAwayPrice)}`);
  lines.push('');
  lines.push('STRESSED (after perturbation):');
  lines.push(`  Deal score: ${result.stressed.dealQuality}/100 (${result.stressed.qualityLabel})`);
  lines.push(`  Monthly cash flow: ${fmtDollars(result.stressed.monthlyCashFlow)}`);
  lines.push(`  DSCR: ${result.stressed.dscr.toFixed(2)}`);
  lines.push(`  Cap rate: ${result.stressed.capRate.toFixed(2)}%`);
  lines.push(`  Cash-on-cash: ${result.stressed.cashOnCashReturn.toFixed(2)}%`);
  lines.push(`  IRR (10-yr): ${(result.stressed.irr * 100).toFixed(2)}%`);
  lines.push(`  Walk-away price: ${fmtDollars(result.stressed.walkAwayPrice)}`);
  lines.push('');
  lines.push('PER-FIELD DELTAS:');
  for (const d of result.deltas) {
    lines.push(`  ${formatDelta(d)}`);
  }
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('WARNINGS (the engine flagged these but proceeded):');
    for (const w of result.warnings) {
      lines.push(`  - ${w}`);
    }
  }
  return lines.join('\n');
}

// ===== Public API =====

export interface ComposeNarrativeInput {
  /** The original user message — gives the LLM context for what was asked. */
  userMessage: string;
  /** The deterministic result from Layer 3. */
  result: StressTestResult;
  /** Anthropic adapter — injected for testability. */
  adapter: AnthropicAdapter;
}

/**
 * Compose a natural-language response for a stress-test result.
 *
 * Bounded: the LLM can only narrate numbers in `result`. It cannot
 * invent. The whole point of Path B is keeping the LLM out of the math
 * path; this layer is the LLM's ONLY job in the stress-test flow.
 */
export async function composeNarrative(
  input: ComposeNarrativeInput
): Promise<ComposedNarrative> {
  const userTurn = renderResultForLlm(input.result, input.userMessage);

  const response = await input.adapter.call({
    tier: 'haiku', // Composition is cheap; haiku is fine for the prose layer
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: userTurn,
    maxTokens: 600, // Cap prose length — keep responses concise
    temperature: 0.2, // Slight warmth for natural prose, low enough to stay disciplined
  });

  logger.info('composeNarrative: composed', {
    userMessage: input.userMessage,
    baselineScore: input.result.baseline.dealQuality,
    stressedScore: input.result.stressed.dealQuality,
    deltaCount: input.result.deltas.length,
    warningCount: input.result.warnings.length,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
  });

  return {
    text: response.text.trim(),
    usage: response.usage,
  };
}

// ===== Internal helpers exported for tests =====

export const _internal = {
  SYSTEM_PROMPT,
  renderResultForLlm,
  fmtDollars,
  formatDelta,
} as const;
