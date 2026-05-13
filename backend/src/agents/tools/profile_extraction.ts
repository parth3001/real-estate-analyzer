/**
 * tool:profile_extraction — W4-S7.
 *
 * The ONLY wave-1 tool that calls an LLM. Per
 * /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 and §6:
 *
 *   profile_extraction | Haiku 4.5 | { userInput, currentProfile } |
 *                       { extractedProfile, confidence } |
 *                       ProfileEvent if new fields
 *
 * WHY HAIKU AND NOT A REGEX
 * -------------------------
 *
 * Profile fields are typed (enums + structured object) but the user
 * input is free-form chat. "I run a credit union in Wichita, we close
 * about 30 deals a year" needs to map to:
 *   - investorType: 'lender'
 *   - role: 'loan_officer' or similar
 *   - institutionContext.institutionType: 'credit_union'
 *   - institutionContext.typicalDealVolume: 'medium'
 *   - primaryMarkets: ['Wichita']
 *
 * Regex / rule-based extraction does this poorly (variants, synonyms,
 * implicit info). Haiku does it well at $0.0002-$0.0005 per call.
 *
 * THE THREE EVENTS THIS TOOL TOUCHES
 * ---------------------------------
 *
 *   ✅ Always: CostEvent (one Haiku call → one CostEvent with token
 *      usage and computed costCents). Tracked through the W9-S1
 *      CostEventRepository.
 *
 *   ⚠️ Conditional: ProfileEvent — only when the extraction yielded
 *      AT LEAST ONE field that the user didn't already have in their
 *      current profile. Avoids substrate noise from "user said hi"
 *      style turns that don't surface persona signal.
 *
 *   ❌ Never: ConversationEvent. The orchestrator handles that at
 *      turn-close (per chat-surface concerns); this tool runs on a
 *      single user input fragment and shouldn't write conversation
 *      substrate.
 *
 * DETERMINISTIC-SCORING NON-NEGOTIABLE
 * ------------------------------------
 *
 * This tool's `invokeLLM` is 'haiku' (truthy). It DOES NOT produce a
 * dealQuality score or any other scoring-path output. The score-
 * producing path (score_deal, apply_override) is 100% deterministic
 * code — see architecture §1.5. Profile-extraction's persona output
 * feeds the engine as `userContext`, which the engine consumes for
 * weight selection. The engine is still deterministic.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';
import {
  ProfilePayloadSchema,
  type ProfilePayload,
} from '../../models/events/ProfileEvent';
import { costEventRepository } from '../../repositories/CostEventRepository';
import { computeAnthropicCostCents } from '../../utils/anthropicPricing';
import {
  getAnthropicAdapter,
  type AnthropicAdapter,
} from '../llm/anthropicAdapter';
import { logger } from '../../utils/logger';

// ===== Input schema =====

export const ProfileExtractionInputSchema = z.object({
  /** Raw chat text from the user. Free-form. */
  userInput: z.string().min(1),
  /** Optional current profile to diff against. If absent, treat as empty. */
  currentProfile: ProfilePayloadSchema.optional(),
});

export type ProfileExtractionInput = z.infer<
  typeof ProfileExtractionInputSchema
>;

// ===== Output schema =====

export const ProfileExtractionOutputSchema = z.object({
  /** Newly extracted profile fields (only fields the LLM populated). */
  extractedProfile: ProfilePayloadSchema,
  /** Model's self-reported confidence (0-100). */
  confidence: z.number().min(0).max(100),
  /** True if any extracted field differs from currentProfile. */
  hadNewFields: z.boolean(),
  /** Set only when a ProfileEvent was emitted (i.e., hadNewFields). */
  profileEventId: z
    .custom<Types.ObjectId>((v) => v instanceof Types.ObjectId)
    .optional(),
  /** Always set — every LLM call emits a CostEvent. */
  costEventId: z.custom<Types.ObjectId>((v) => v instanceof Types.ObjectId),
});

export type ProfileExtractionOutput = z.infer<
  typeof ProfileExtractionOutputSchema
>;

// ===== Prompt =====

/**
 * System prompt for Haiku. Pinned here (not in a separate file) so the
 * tool's contract — input + prompt + output schema — stays auditable
 * in one place. Future LLM-using tools may extract prompts to a
 * shared registry; for now, inline.
 *
 * Cacheable: above ~1024 tokens, this prompt qualifies for prompt
 * caching (10% rate). Currently sits at ~600 tokens — under the
 * cache threshold. Acceptable for v1; if profile_extraction becomes
 * high-volume, pad the prompt with stable example shots to cross the
 * threshold (per costs doc §6.1).
 */
const SYSTEM_PROMPT = `You extract structured investor profile fields from a single user message.

Output ONLY a JSON object matching this exact schema (no markdown, no commentary):

{
  "investorType": "retail" | "pro" | "lender" | "consultancy" | null,
  "portfolioSize": "none" | "1-3" | "4-10" | "11-30" | "30+" | null,
  "primaryMarkets": string[] | null,
  "role": "principal" | "loan_officer" | "underwriter" | "analyst" | "other" | null,
  "institutionContext": {
    "name": string | null,
    "institutionType": "credit_union" | "community_bank" | "hard_money" | "consultancy" | null,
    "typicalDealVolume": "low" | "medium" | "high" | null
  } | null,
  "riskTolerance": "conservative" | "moderate" | "aggressive" | null,
  "primaryGoal": "cash_flow" | "wealth_building" | "diversification" | "tax_optimization" | null,
  "confidence": number  // 0-100, your confidence in this extraction
}

Rules:
- Use null (not empty string, not omitted) for fields the message doesn't address.
- Be conservative — when in doubt, null. Don't invent.
- "I'm just learning" → investorType: "retail", riskTolerance often "conservative"
- "credit union loan officer" → investorType: "lender", role: "loan_officer", institutionContext.institutionType: "credit_union"
- "I own 5 rentals" → portfolioSize: "4-10", investorType: "pro" if context suggests active investing
- typicalDealVolume mapping: <5/year = "low", 5-30/year = "medium", >30/year = "high"
- primaryMarkets: extract city/region names only (no states alone, no "everywhere")
- confidence: 90+ for explicit statements, 50-80 for inferred, 30-50 for uncertain
`;

// ===== LLM response parsing =====

/**
 * The schema the LLM is asked to return. Slightly different from
 * ProfilePayloadSchema:
 *   - Allows null for absent fields (LLM nulls are mapped to undefined)
 *   - Includes top-level `confidence`
 */
const LlmResponseSchema = z.object({
  investorType: z
    .enum(['retail', 'pro', 'lender', 'consultancy'])
    .nullable()
    .optional(),
  portfolioSize: z
    .enum(['none', '1-3', '4-10', '11-30', '30+'])
    .nullable()
    .optional(),
  primaryMarkets: z.array(z.string()).nullable().optional(),
  role: z
    .enum(['principal', 'loan_officer', 'underwriter', 'analyst', 'other'])
    .nullable()
    .optional(),
  institutionContext: z
    .object({
      name: z.string().nullable().optional(),
      institutionType: z
        .enum(['credit_union', 'community_bank', 'hard_money', 'consultancy'])
        .nullable()
        .optional(),
      typicalDealVolume: z.enum(['low', 'medium', 'high']).nullable().optional(),
    })
    .nullable()
    .optional(),
  riskTolerance: z
    .enum(['conservative', 'moderate', 'aggressive'])
    .nullable()
    .optional(),
  primaryGoal: z
    .enum(['cash_flow', 'wealth_building', 'diversification', 'tax_optimization'])
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(100),
});

type LlmResponse = z.infer<typeof LlmResponseSchema>;

/**
 * Convert LLM response (nullable fields) to a ProfilePayload
 * (optional fields). Strips nulls, strips empty objects/arrays.
 */
function llmResponseToProfilePayload(response: LlmResponse): ProfilePayload {
  const payload: ProfilePayload = {};
  if (response.investorType) payload.investorType = response.investorType;
  if (response.portfolioSize) payload.portfolioSize = response.portfolioSize;
  if (response.primaryMarkets && response.primaryMarkets.length > 0) {
    payload.primaryMarkets = response.primaryMarkets;
  }
  if (response.role) payload.role = response.role;
  if (response.institutionContext) {
    const ic: NonNullable<ProfilePayload['institutionContext']> = {};
    if (response.institutionContext.name) ic.name = response.institutionContext.name;
    if (response.institutionContext.institutionType) {
      ic.institutionType = response.institutionContext.institutionType;
    }
    if (response.institutionContext.typicalDealVolume) {
      ic.typicalDealVolume = response.institutionContext.typicalDealVolume;
    }
    if (Object.keys(ic).length > 0) payload.institutionContext = ic;
  }
  if (response.riskTolerance) payload.riskTolerance = response.riskTolerance;
  if (response.primaryGoal) payload.primaryGoal = response.primaryGoal;
  return payload;
}

/**
 * Parse the LLM's text output. Tolerates markdown code fences (some
 * model versions add them even when told not to).
 */
function parseLlmResponse(text: string): LlmResponse {
  // Strip ```json ... ``` and ``` ... ``` fences if present.
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
      `profile_extraction: LLM returned non-JSON output. ` +
        `First 200 chars: ${cleaned.slice(0, 200)}. Parse error: ${
          err instanceof Error ? err.message : String(err)
        }`
    );
  }
  return LlmResponseSchema.parse(parsed);
}

// ===== Diff =====

/**
 * Identify which fields in `extracted` differ from `current`. Returns
 * the subset of `extracted` that's "new" (different or absent in current).
 *
 * Empty result means no new fields → no ProfileEvent should be written.
 */
function diffProfile(
  extracted: ProfilePayload,
  current: ProfilePayload | undefined
): { newFields: ProfilePayload; hasAny: boolean } {
  if (!current) {
    return {
      newFields: extracted,
      hasAny: Object.keys(extracted).length > 0,
    };
  }
  const newFields: ProfilePayload = {};
  let hasAny = false;
  const keys = Object.keys(extracted) as Array<keyof ProfilePayload>;
  for (const key of keys) {
    if (JSON.stringify(extracted[key]) !== JSON.stringify(current[key])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newFields as any)[key] = extracted[key];
      hasAny = true;
    }
  }
  return { newFields, hasAny };
}

// ===== Tool implementation =====

export const profileExtraction: Tool<
  ProfileExtractionInput,
  ProfileExtractionOutput
> = {
  name: 'profile_extraction',
  description:
    "Extracts structured investor-profile fields (investor type, role, risk tolerance, primary markets, etc.) from a free-form chat message using a Haiku-tier LLM call. Emits a ProfileEvent only if extraction surfaced new fields beyond the user's current profile. Always emits a CostEvent for the LLM call.",
  inputSchema: ProfileExtractionInputSchema,
  outputSchema: ProfileExtractionOutputSchema,
  // The ONLY wave-1 tool with invokeLLM != false. Justified per
  // agent-mesh §3.2: structured extraction from unstructured input is
  // exactly what Haiku is good at, and the alternative (regex/rules)
  // performs poorly across the variety of user phrasings.
  invokeLLM: 'haiku',
  sideEffects: [
    { type: 'external_api', service: 'anthropic' },
    // ProfileEvent emission is CONDITIONAL (only if new fields). The
    // manifest declares it because the orchestrator's retry policy
    // needs to know substrate writes are possible from this tool.
    { type: 'event', eventType: 'profile' },
    // CostEvent is always emitted but lives in a separate operational
    // collection (not part of the EventType union). Implicit for any
    // external_api call.
  ],
  retrySemantics: NO_RETRY,

  async execute(
    input: ProfileExtractionInput,
    ctx: ToolContext
  ): Promise<ProfileExtractionOutput> {
    const validated = ProfileExtractionInputSchema.parse(input);

    // ===== 1. Call Haiku =====

    const adapter: AnthropicAdapter = getAnthropicAdapter();
    const llmResponse = await adapter.call({
      tier: 'haiku',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: validated.userInput,
      // Default temperature 0 + maxTokens 1024 — set in the adapter
    });

    // ===== 2. Emit CostEvent (always) =====

    const costCents = computeAnthropicCostCents({
      tier: 'haiku',
      inputTokens: llmResponse.usage.inputTokens,
      outputTokens: llmResponse.usage.outputTokens,
      cachedTokens: llmResponse.usage.cachedTokens,
    });
    const costEventId = await costEventRepository.writeCostEvent({
      traceId: ctx.traceId,
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      costType: 'llm',
      provider: 'anthropic',
      model: llmResponse.model,
      inputTokens: llmResponse.usage.inputTokens,
      outputTokens: llmResponse.usage.outputTokens,
      cachedTokens: llmResponse.usage.cachedTokens,
      costCents,
    });

    // ===== 3. Parse extracted profile =====

    let parsed: LlmResponse;
    try {
      parsed = parseLlmResponse(llmResponse.text);
    } catch (err) {
      // We've already paid for the LLM call (CostEvent emitted above).
      // Surface the parse failure so the orchestrator can fall back to
      // either re-asking or a regex stub.
      logger.warn('profile_extraction: LLM response parse failed', {
        traceId: ctx.traceId,
        userId: ctx.userId,
        firstChars: llmResponse.text.slice(0, 200),
      });
      throw err;
    }

    const extractedProfile = llmResponseToProfilePayload(parsed);
    const confidence = parsed.confidence;

    // ===== 4. Diff against currentProfile =====

    const { newFields, hasAny } = diffProfile(
      extractedProfile,
      validated.currentProfile
    );

    // ===== 5. Emit ProfileEvent (conditional) =====

    let profileEventId: Types.ObjectId | undefined;
    if (hasAny) {
      profileEventId = await ctx.eventsRepo.writeProfileEvent({
        traceId: ctx.traceId,
        actorType: 'tool:profile_extraction',
        userId: ctx.userId,
        institutionId: ctx.institutionId,
        payload: {
          ...newFields,
          extractedFromInput: validated.userInput,
          extractionConfidence: confidence,
        },
      });
    }

    return {
      extractedProfile,
      confidence,
      hadNewFields: hasAny,
      profileEventId,
      costEventId,
    };
  },
};
