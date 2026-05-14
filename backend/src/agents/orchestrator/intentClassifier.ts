/**
 * Intent classifier — W2-S0.
 *
 * Maps free-form user input to one of the 11 ChatIntent labels.
 * Haiku-tier LLM call per /docs/PRODUCT_2.0_AGENT_MESH.md §2.2.
 *
 * COST DISCIPLINE
 * ---------------
 *
 * Runs on EVERY user turn that isn't a streaming continuation. At the
 * wave-1 budget assumption ($0.0003-$0.0005 per call per costs doc §3
 * row 1), even 1000 turns/day costs <$0.50. Cost lever is the prompt
 * cache: the system prompt + intent definitions are stable (cached at
 * ~10% rate), only the user input is fresh.
 *
 * NEVER routes to a verdict
 * -------------------------
 *
 * The classifier produces intent + confidence, nothing else. It does
 * not score deals, judge user input, or make recommendations. The
 * routing layer (W2-S1) maps intent → agent or tool path. The
 * deterministic-scoring non-negotiable (architecture §1.5) is held
 * upstream — this classifier just decides WHICH path runs.
 *
 * EMITS COSTEVENT, NOT CONVERSATIONEVENT
 * --------------------------------------
 *
 * The classifier writes a CostEvent for its Haiku call. The
 * ConversationEvent is the orchestrator's responsibility (it captures
 * the FULL turn — classifier + agent reasoning + tool calls). This
 * separation lets the classifier be reused outside the chat surface
 * (e.g., in evals, in offline classification jobs) without forcing
 * a conversation context.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  getAnthropicAdapter,
  type AnthropicAdapter,
} from '../llm/anthropicAdapter';
import { costEventRepository } from '../../repositories/CostEventRepository';
import { computeAnthropicCostCents } from '../../utils/anthropicPricing';
import { logger } from '../../utils/logger';

// ===== Intent enum (mirrors ChatIntentSchema in ConversationEvent.ts) =====

const CHAT_INTENTS = [
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
] as const;

export type ChatIntent = (typeof CHAT_INTENTS)[number];

const ChatIntentSchema = z.enum(CHAT_INTENTS);

// ===== Output shape =====

export const IntentClassificationSchema = z.object({
  intent: ChatIntentSchema,
  confidence: z.number().min(0).max(100),
  reasoning: z.string().optional(),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

export interface ClassifyResult extends IntentClassification {
  /** Anthropic model identifier used (e.g., 'claude-haiku-4-5'). */
  modelUsed: string;
  /** Token usage from the call. Used by the orchestrator for ConversationEvent. */
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  };
  /** Cost in cents — the CostEvent that was just written reflects this. */
  costCents: number;
  /** The CostEvent _id (for substrate correlation). */
  costEventId: Types.ObjectId;
}

// ===== System prompt =====

/**
 * Definitions per agent mesh §2.2 routing table. Examples chosen to
 * cover the boundary cases — e.g., "show me the assumptions" maps to
 * request_audit_trail, NOT qa_decision (subtle distinction the
 * classifier needs example shots for).
 *
 * Prompt-cache target: this prompt is stable across all classifier
 * calls; only the user input varies. Wave 1 prompt sits at ~700 tokens
 * — under the 1024-token Anthropic cache threshold. If classification
 * volume rises, pad with more example shots to cross the threshold
 * (per costs doc §6.1).
 */
const SYSTEM_PROMPT = `You are an intent classifier for a real estate investment platform.

Map the user's input to EXACTLY ONE intent label from this list. Output ONLY JSON
matching this schema (no markdown, no commentary):

{
  "intent": <one of the 11 labels below>,
  "confidence": <0-100, your confidence in the classification>,
  "reasoning": <optional, 1 sentence; for debug only>
}

INTENT LABELS
─────────────

- analyze_property: User wants to analyze a property. They share an address,
  listing link, price, or describe a property they're looking at.
  Examples: "look at 123 Main St Austin TX", "what about a 4-unit at $450K?",
            "I'm considering a duplex in Cleveland"

- share_profile: User shares context about themselves (investor type, goals,
  risk tolerance, experience) without asking for property analysis.
  Examples: "I'm a credit union lender", "I have 8 rentals already",
            "I'm just getting started", "looking for cash flow"

- qa_metric: User asks what a metric means or how it's computed.
  Examples: "what does cap rate mean?", "how is DSCR calculated?",
            "what's a good IRR?"

- qa_decision: User asks about a SPECIFIC decision the platform produced.
  Examples: "why did this score 67?", "why is the deal quality so low?",
            "what's hurting this property's score?"

- qa_general: Educational questions not tied to a specific metric or decision.
  Examples: "should I invest in cash flow or appreciation?",
            "how do I find good deals?", "what markets are hot right now?"

- override_assumption: User wants to change an input assumption.
  Examples: "change vacancy to 8%", "use $2800 rent instead",
            "make the cap rate 6%"

- request_audit_trail: User wants to see the assumptions and inputs behind a decision.
  Examples: "show me the assumptions", "what inputs did you use?",
            "show your work"

- request_export: User wants a PDF/CSV/JSON download of the audit trail.
  Examples: "export to PDF", "send this to my underwriter",
            "download the analysis"

- request_critique: User wants an adversarial review of a decision.
  Examples: "what could go wrong here?", "have a CPA look at this",
            "play devil's advocate"

- save_action: User wants to save a deal for later.
  Examples: "save this", "add to watchlist", "follow up on this one"

- fallback: Cannot be confidently classified into any of the above.
  Use this when the input is ambiguous, off-topic, or doesn't match
  any intent. Use confidence ≤ 50.

CONFIDENCE GUIDELINES
─────────────────────

- 90+: Explicit, unambiguous intent ("show me the PDF" → request_export)
- 70-89: Strong signal, minor ambiguity
- 50-69: Plausible but not certain; routing layer may treat as fallback
- 0-49: Use only for "fallback" intent
`;

// ===== Helpers =====

function parseClassifierResponse(text: string): IntentClassification {
  // Strip code fences if present (model sometimes adds them despite the prompt).
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `intentClassifier: LLM returned non-JSON output. ` +
        `First 200 chars: "${cleaned.slice(0, 200)}". ` +
        `Parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return IntentClassificationSchema.parse(parsed);
}

// ===== Public function =====

export interface ClassifyInput {
  userInput: string;
  /** For substrate correlation. Provided by the orchestrator. */
  traceId: string;
  userId: Types.ObjectId;
  institutionId?: Types.ObjectId;
}

/**
 * Classify a user input as one of the 11 ChatIntents. Always emits a
 * CostEvent for the Haiku call, even if parsing fails. The
 * orchestrator that calls this function emits the ConversationEvent
 * (which carries this classifier output along with the rest of the
 * turn).
 *
 * Throws on:
 *   - Empty userInput (Zod fails on the input schema)
 *   - Adapter call failure (network, rate limit, etc.)
 *   - Non-JSON or malformed LLM output (defended at the trust boundary)
 *
 * In all "we paid for the LLM call" failure modes, the CostEvent IS
 * written before the throw — same discipline as profile_extraction.
 */
export async function classifyIntent(input: ClassifyInput): Promise<ClassifyResult> {
  if (!input.userInput || input.userInput.trim().length === 0) {
    throw new Error('intentClassifier: userInput must not be empty');
  }

  const adapter: AnthropicAdapter = getAnthropicAdapter();
  const llmResponse = await adapter.call({
    tier: 'haiku',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: input.userInput,
    // Intent classification is a finite-output task; keep tokens cheap.
    maxTokens: 256,
    temperature: 0,
  });

  // Always emit CostEvent for the call (we paid for it)
  const costCents = computeAnthropicCostCents({
    tier: 'haiku',
    inputTokens: llmResponse.usage.inputTokens,
    outputTokens: llmResponse.usage.outputTokens,
    cachedTokens: llmResponse.usage.cachedTokens,
  });
  const costEventId = await costEventRepository.writeCostEvent({
    traceId: input.traceId,
    userId: input.userId,
    institutionId: input.institutionId,
    costType: 'llm',
    provider: 'anthropic',
    model: llmResponse.model,
    inputTokens: llmResponse.usage.inputTokens,
    outputTokens: llmResponse.usage.outputTokens,
    cachedTokens: llmResponse.usage.cachedTokens,
    costCents,
  });

  // Parse — throw AFTER CostEvent emission so failed parses still
  // surface in the cost dashboard
  let classification: IntentClassification;
  try {
    classification = parseClassifierResponse(llmResponse.text);
  } catch (err) {
    logger.warn('intentClassifier: parse failed', {
      traceId: input.traceId,
      userId: input.userId,
      firstChars: llmResponse.text.slice(0, 200),
    });
    throw err;
  }

  return {
    ...classification,
    modelUsed: llmResponse.model,
    tokenUsage: llmResponse.usage,
    costCents,
    costEventId,
  };
}
