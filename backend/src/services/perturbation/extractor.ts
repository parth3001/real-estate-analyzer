/**
 * Layer 2 — typed perturbation extractor (Task #16, Path B).
 *
 * Natural language in → Zod-validated `PerturbationSpec[]` out.
 *
 * THIS IS THE ONLY PLACE THE LLM TOUCHES THE STRESS-TEST FLOW.
 * The LLM's job here is intent translation: take the user's free-form
 * request ("stress at 7%", "drop rent by $300 and bump rate to 8%") and
 * map it to a strict typed schema with explicit units.
 *
 * Why explicit units matter (the bug this layer prevents)
 * -------------------------------------------------------
 * The original 81/100 confabulation came from the LLM passing
 * `interestRate: 0.075` (decimal) where the engine expected `7.5` (percent).
 * No unit declaration → engine divides 0.075/100 = 0.00075 (effectively
 * zero rate) → cash flow flips positive → score jumps to 81.
 *
 * Path B's defense: the LLM MUST declare its unit. The schema rejects
 * extractions without a `unit` field. If the LLM is unsure, it returns
 * empty perturbations with reasoning — better an honest "I'm not sure"
 * than a confident wrong answer.
 *
 * Output guarantees
 * -----------------
 *   - Every returned PerturbationSpec is Zod-validated.
 *   - `field` is constrained to the registry enum (no hallucinated fields).
 *   - `unit` is always one of {percent, dollars, years, decimal_ratio, count}.
 *   - `value` is a finite number, NOT a string with a "%" or "$".
 *   - If the LLM can't extract a valid perturbation, the result is empty
 *     with a `reasoning` string explaining why — never a malformed array.
 */

import { z } from 'zod';
import type { AnthropicAdapter } from '../../agents/llm/anthropicAdapter';
import { logger } from '../../utils/logger';
import { SFR_PERTURBABLE_FIELDS, type PerturbableFieldDef } from './fieldRegistry';
import { PerturbationSpecSchema, type PerturbationSpec } from './schemas';

// ===== Output =====

export interface ExtractedPerturbations {
  /** Zod-validated perturbations ready to hand to Layer 3 (the runner). */
  perturbations: PerturbationSpec[];
  /**
   * LLM's reasoning for what it extracted (or for declining to extract).
   * Surfaced to the user via Layer 4 narrative when extraction fails;
   * useful for the agent to say "I think you meant X — confirm?" rather
   * than silently no-op'ing.
   */
  reasoning: string;
  /** Token usage for cost tracking. */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
}

// ===== Wire schema (what the LLM returns) =====

/**
 * The shape the LLM MUST return. Wrapped in a top-level object so the
 * LLM can also surface reasoning. Zod-validated at the boundary; any
 * extraction that doesn't match this shape is rejected.
 */
const LlmExtractionSchema = z.object({
  perturbations: z.array(PerturbationSpecSchema),
  reasoning: z.string(),
});

// ===== System prompt builder =====

/**
 * Render the perturbable-fields registry as an LLM-readable spec. Auto-
 * generated from the registry so adding a new field automatically extends
 * what the extractor can handle — no separate prompt update needed.
 */
function renderFieldCatalog(): string {
  const lines: string[] = [];
  for (const def of Object.values(SFR_PERTURBABLE_FIELDS)) {
    lines.push(`  - ${def.key} (${def.engineUnit}) — ${def.label}: ${def.description}`);
  }
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are a typed-extraction service for a real-estate stress-test agent.

Your single job: read a user's natural-language request and extract zero or
more typed perturbations to apply to a prior property analysis. You DO NOT
do math. You DO NOT score deals. You DO NOT interpret results. You ONLY
extract structured intent.

THE FIELDS YOU CAN PERTURB
==========================
Each field has a canonical key, an expected unit (engine convention), a
human label, and a description that tells you when the user is referring
to it.

${renderFieldCatalog()}

OUTPUT SHAPE (STRICT — your response must be exactly this JSON)
==============================================================
{
  "perturbations": [
    {
      "field": "<one of the keys above>",
      "value": <finite number — NOT a string, NOT formatted>,
      "unit": "<one of: percent, dollars, years, decimal_ratio, count>",
      "operation": "<one of: set, increase_by, decrease_by — default 'set'>",
      "rationale": "<optional, ≤140 chars, human-readable>"
    }
  ],
  "reasoning": "<one or two sentences explaining what you extracted, or why you couldn't>"
}

UNIT RULES (CRITICAL — read these twice)
=========================================
The engine has unit conventions baked in. You MUST declare the unit you
extracted in, and you MUST use the units the USER said — not the engine's.
A separate layer converts user-units to engine-units; your job is faithful
extraction, not conversion.

- "stress at 7.5%" → value: 7.5, unit: "percent"  (because the user said a percent)
- "stress at 0.075" → value: 0.075, unit: "decimal_ratio"  (because the user said a decimal)
- "rent at $1,500" → value: 1500, unit: "dollars"  (strip formatting)
- "drop rent by $300" → value: 300, unit: "dollars", operation: "decrease_by"
- "10 year hold" → value: 10, unit: "years"
- "increase rate by 1 point" → value: 1, unit: "percent", operation: "increase_by"
- "vacancy of 8%" → value: 8, unit: "percent"

NEVER do this:
- "stress at 7.5%" → value: 0.075, unit: "decimal_ratio" (You converted! Don't.)
- "rent at $1,500" → value: "$1,500" (Strip the formatting; return a number.)
- "stress at 7%" → field: "interestRate" (Use the KEY from the catalog: "mortgageRate".)

OPERATION RULES
===============
- "set X to Y" / "stress at Y" / "what if Y" → operation: "set"
- "increase X by Y" / "bump X up by Y" → operation: "increase_by"
- "decrease X by Y" / "drop X by Y" / "X down Y" → operation: "decrease_by"
- If unclear, default to "set".

MULTI-FIELD REQUESTS
====================
"stress at 7% AND rent at $1,500" → return TWO perturbations in the array.
"rate up to 8 and vacancy of 10%" → return TWO perturbations.

WHEN TO RETURN EMPTY perturbations: []
======================================
If the user's request doesn't map cleanly to a perturbation, return:
  { "perturbations": [], "reasoning": "<why you couldn't extract>" }

Examples of empty-return situations:
- The user said "30% down payment" but downPayment in the catalog wants
  dollars and you have no purchase price to convert. Return empty with
  reasoning: "User specified down payment as 30 percent, but the field
  expects dollars and I don't have the purchase price to convert. Please
  confirm the dollar amount."
- The user is asking a question, not requesting a perturbation
  ("can I stress-test rates?"). Return empty with reasoning.
- The user named a field not in the catalog ("change the school
  district"). Return empty with reasoning naming the supported fields.
- The user's value is ambiguous ("stress at high rate"). Return empty
  with reasoning asking for a specific number.

Honest "I'm not sure" beats a confident wrong extraction every time.

FINAL OUTPUT
============
Return ONLY the JSON object. No prose before or after. No markdown code
fences. The orchestrator parses your response with JSON.parse and Zod
strictly; any deviation breaks the pipeline.`;

// ===== JSON extraction helper =====

/**
 * Pull a JSON object out of the LLM's response, tolerant of common
 * deviations (markdown code fences, leading/trailing whitespace, the
 * occasional "here's the JSON:" preamble). Throws if no parseable JSON
 * object is found.
 */
function extractJsonObject(raw: string): unknown {
  // Strip markdown code fences if present.
  let s = raw.trim();
  const fenceMatch = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) s = fenceMatch[1].trim();

  // Find the first '{' and the matching last '}'. This survives a
  // leading "here's the JSON:" preamble or a trailing comment.
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('Layer-2 extractor: no JSON object found in LLM response.');
  }
  const candidate = s.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `Layer-2 extractor: JSON.parse failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

// ===== Public API =====

export interface ExtractPerturbationsInput {
  /** Natural-language user message ("stress at 7.5%", etc.). */
  userMessage: string;
  /** Anthropic adapter — injected for testability. */
  adapter: AnthropicAdapter;
}

/**
 * Extract typed perturbations from a natural-language stress-test request.
 *
 * Returns { perturbations: [], reasoning: "..." } if the LLM couldn't
 * extract anything — Layer 4 narrates that honestly to the user instead
 * of silently no-op'ing.
 *
 * Throws only on adapter failure or unrecoverable schema violation. All
 * "I can't extract" cases come back as empty arrays + reasoning, NOT as
 * exceptions.
 */
export async function extractPerturbations(
  input: ExtractPerturbationsInput
): Promise<ExtractedPerturbations> {
  const response = await input.adapter.call({
    tier: 'haiku', // Cheap + fast model — extraction is a constrained task, no need for sonnet/opus
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: input.userMessage,
    maxTokens: 512, // Extractions are small; cap to control cost
    temperature: 0, // Deterministic — extraction is not a creative task
  });

  let parsed: unknown;
  try {
    parsed = extractJsonObject(response.text);
  } catch (err) {
    // Malformed LLM output — return empty with the error as reasoning so
    // Layer 4 can fall back to "I couldn't understand your request" rather
    // than crashing.
    logger.warn('extractPerturbations: malformed LLM response', {
      userMessage: input.userMessage,
      rawResponse: response.text.slice(0, 300),
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      perturbations: [],
      reasoning:
        "I couldn't parse a structured stress-test request from your message. " +
        'Try something like "stress at 7% rate" or "what if rent dropped to $1,500?"',
      usage: response.usage,
    };
  }

  let validated: z.infer<typeof LlmExtractionSchema>;
  try {
    validated = LlmExtractionSchema.parse(parsed);
  } catch (err) {
    // Schema violation — the LLM returned something shaped wrong (wrong
    // field name, missing unit, etc.). Same fallback as malformed JSON.
    logger.warn('extractPerturbations: schema validation failed', {
      userMessage: input.userMessage,
      parsed: JSON.stringify(parsed).slice(0, 300),
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      perturbations: [],
      reasoning:
        "I extracted something from your request, but it didn't match the " +
        'expected shape. Try rephrasing — e.g., "stress at 7.5% rate" or ' +
        '"drop rent by $200."',
      usage: response.usage,
    };
  }

  logger.info('extractPerturbations: extracted', {
    userMessage: input.userMessage,
    perturbationCount: validated.perturbations.length,
    fields: validated.perturbations.map((p) => p.field),
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
  });

  return {
    perturbations: validated.perturbations,
    reasoning: validated.reasoning,
    usage: response.usage,
  };
}

// ===== Internal helpers exported for tests =====

export const _internal = {
  SYSTEM_PROMPT,
  extractJsonObject,
  renderFieldCatalog,
  // Tests verify the catalog stays in sync with the registry without
  // having to reproduce the rendering logic.
  registryKeys: Object.keys(SFR_PERTURBABLE_FIELDS) as Array<keyof typeof SFR_PERTURBABLE_FIELDS>,
} as const;

// Keep PerturbableFieldDef in scope for the type-level check above.
// (Imported but only used as a reference at this layer.)
void (null as unknown as PerturbableFieldDef);
