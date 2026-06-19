/**
 * Adversarial critic agent — W5.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §4.3.
 *
 * Model: Opus 4.7. The most expensive tier in the catalog. Justified
 * by rarity: runs only on auto-trigger (BUY-band deals, dealQuality ≥80)
 * or explicit user request. Per-persona cost ~$0.05-$0.15 (costs doc §4.2).
 *
 * TWO PERSONAS, TWO PARALLEL CALLS
 * --------------------------------
 *
 * Each invocation runs BOTH personas in parallel:
 *   - optimistic_flipper: argues for taking the deal aggressively
 *     ("you're being too conservative — this comp set supports a $50K
 *     higher exit")
 *   - skeptical_cpa: argues against taking the deal conservatively
 *     ("vacancy assumption is aggressive for this submarket; DSCR
 *     thins out at higher rates")
 *
 * The two personas exist to surface BLIND SPOTS that a single
 * neutral analyzer misses. Per the evals doc §5, a 4-week kill
 * criterion validates whether the personas earn their slot.
 *
 * OUTPUT: ONE CritiqueEvent PER PERSONA
 * ------------------------------------
 *
 * Two CritiqueEvents per invocation. Each emits via eventsRepository.
 * The agent does NOT recompute scores; it only flags disagreement
 * with structured fields (agreementWithOriginal, divergenceReasons,
 * alternativeAssumptions, severityScore). Architecture §1.5 holds.
 *
 * TOOLS: READ-ONLY
 * ----------------
 *
 * The critic has access to render_audit_trail (to see the decision
 * it's critiquing) and recall_user_context. It explicitly does NOT
 * have access to score_deal — a critic that could re-score would be
 * a competing scorer, which is exactly what the deterministic-scoring
 * non-negotiable forbids.
 */

import { runAgent, type AgentConfig, type AgentRunOutput } from '../runner/agentRunner';
import { eventsRepository } from '../../repositories/EventsRepository';
import { logger } from '../../utils/logger';
import { renderAuditTrail } from '../tools/render_audit_trail';
import { recallUserContext } from '../tools/recall_user_context';
import type { ToolContext } from '../tools/types';
import type {
  CriticPersona,
  TriggerType,
} from '../../models/events/CritiqueEvent';
import { z } from 'zod';
import { Types } from 'mongoose';

// ===== Critic-output schema =====
//
// The critic agent's final text response MUST be valid JSON matching
// this schema. The agent emits one structured response, the runner
// returns text, this module parses and writes the CritiqueEvent.

// Task #56 follow-up (2026-06-16): the LLM frequently emits
// alternativeAssumptions as plain strings (the reasoning text only) and
// occasionally omits severityScore. Both shapes are useful — refusing to
// store a critique because of a structural mismatch loses the LLM's
// actual reasoning. So the schema accepts BOTH the strict shape (object
// with fieldPath + suggestedValue + reasoning) AND the looser fallback
// shape (bare string = the reasoning, with placeholder fieldPath).
// severityScore defaults to 50 ('medium concern') when omitted, which
// matches the engine's calibration for an unspecified-severity finding.
//
// Pair this with the explicit JSON example in BASE_PROMPT_HEADER below
// that shows the strict shape — most calls now emit the correct shape;
// these fallbacks just catch the misses without dropping the critique.
const AlternativeAssumptionStrictShape = z.object({
  fieldPath: z.string().min(1),
  suggestedValue: z.union([z.number(), z.string(), z.boolean()]),
  reasoning: z.string().min(1),
});
type AlternativeAssumption = z.infer<typeof AlternativeAssumptionStrictShape>;
const AlternativeAssumptionPermissive = z.union([
  AlternativeAssumptionStrictShape,
  z.string().min(1).transform(
    (s): AlternativeAssumption => ({
      fieldPath: 'unspecified',
      suggestedValue: '',
      reasoning: s,
    })
  ),
]);

const StructuredCritiqueSchema = z.object({
  agreementWithOriginal: z.boolean(),
  divergenceReasons: z.array(z.string().min(1)),
  alternativeAssumptions: z.array(AlternativeAssumptionPermissive),
  severityScore: z.number().min(0).max(100).optional().default(50),
});

type StructuredCritique = z.infer<typeof StructuredCritiqueSchema>;

// ===== System prompts (one per persona) =====

const BASE_PROMPT_HEADER = `You are an adversarial critic for a real estate investment platform.

YOUR JOB
────────

The platform's scoring engine has produced a decision. You will read
the decision via render_audit_trail and produce a STRUCTURED critique
identifying where the engine's analysis is wrong, soft, or
under-stressed.

WORKFLOW
────────

1. Call render_audit_trail with the decisionId provided in the user
   message to load the full audit bundle (decision + analysis +
   overrides + critiques + audit_trail events).

2. Optionally call recall_user_context if the user's persona is
   relevant to your critique.

3. Emit ONE FINAL TEXT RESPONSE that is valid JSON matching this
   schema EXACTLY (no markdown, no commentary, no trailing text):

   {
     "agreementWithOriginal": true,
     "divergenceReasons": [
       "DSCR margin of 1.05 leaves no buffer for a 50bp rate increase",
       "Property tax growth assumption of 2% understates the 4.5%
        TX historical average"
     ],
     "alternativeAssumptions": [
       {
         "fieldPath": "assumptions.vacancyRate",
         "suggestedValue": 8,
         "reasoning": "Class C properties in this submarket run 7-9% vacancy
                       historically — engine's 5% assumption is too rosy"
       },
       {
         "fieldPath": "propertyData.monthlyRent",
         "suggestedValue": 2400,
         "reasoning": "Comps support $2,300-$2,500 not $2,800"
       }
     ],
     "severityScore": 35
   }

   CRITICAL FORMAT RULES:
   - "alternativeAssumptions" MUST be an array of OBJECTS, each with exactly
     these three fields: fieldPath (string), suggestedValue (number/string/
     boolean), reasoning (string). NEVER use bare strings here — strings
     belong in "divergenceReasons".
   - "severityScore" is REQUIRED — a number from 0 to 100. Pick a value
     even if you broadly agree.
   - "alternativeAssumptions" may be an empty array [] if you don't
     propose specific input changes; do not omit the field.

CONSTRAINTS
───────────

- You do NOT have access to score_deal. You CANNOT re-score the deal.
  Your job is to flag where the engine may be wrong, not to produce
  an alternative score.
- alternativeAssumptions must reference SPECIFIC inputs the engine
  consumed (e.g., "assumptions.vacancyRate", "propertyData.monthlyRent").
  No vague "use better data."
- divergenceReasons must be SPECIFIC and ACTIONABLE. Not "this is
  risky" — instead "DSCR margin of 1.05 leaves no buffer for a 50bp
  rate increase."
- If you basically agree with the engine, say so: agreementWithOriginal=true,
  severityScore low, divergenceReasons may be empty.

`;

const OPTIMISTIC_FLIPPER_PERSONA = `${BASE_PROMPT_HEADER}
YOUR PERSONA: optimistic_flipper
────────────────────────────────

You are an aggressive flipper who thinks the engine is too cautious.
You argue:
  - Comparables support stronger exit pricing than the engine assumes
  - Renovation costs include slack
  - Rents could be higher with light value-add work
  - Holding periods are over-conservative
  - "Walk-away price" is too low — the engine's leaving money on
    the table

You're contrarian in the BULL direction. If the engine says "below
professional standards," you're looking for what makes it work.
`;

const SKEPTICAL_CPA_PERSONA = `${BASE_PROMPT_HEADER}
YOUR PERSONA: skeptical_cpa
───────────────────────────

You are a senior CPA who thinks the engine is too optimistic. You argue:
  - Vacancy assumption doesn't reflect the submarket's reality
  - Operating expenses are under-budgeted (capex reserves, insurance
    creep, tenant turnover)
  - Debt structure is fragile — DSCR margin too thin, rate-shock
    exposure
  - IRR projection relies on optimistic appreciation
  - Tax efficiency assumptions are aggressive

You're contrarian in the BEAR direction. If the engine says "above
professional standards," you're looking for what could go wrong.
`;

// ===== Agent configs (one per persona) =====

const ALLOWED_TOOLS = {
  render_audit_trail: renderAuditTrail,
  recall_user_context: recallUserContext,
} as const;

const optimisticFlipperConfig: AgentConfig = {
  name: 'adversarial_critic',
  modelTier: 'opus',
  systemPrompt: OPTIMISTIC_FLIPPER_PERSONA,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  allowedTools: ALLOWED_TOOLS as any,
  maxTurns: 4, // typically: render_audit_trail → final JSON
  maxTokensPerCall: 1024,
};

const skepticalCpaConfig: AgentConfig = {
  name: 'adversarial_critic',
  modelTier: 'opus',
  systemPrompt: SKEPTICAL_CPA_PERSONA,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  allowedTools: ALLOWED_TOOLS as any,
  maxTurns: 4,
  maxTokensPerCall: 1024,
};

// ===== Helpers =====

function parseCritique(text: string): StructuredCritique {
  // Strip code fences (Opus sometimes wraps despite instruction)
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Task #56 (2026-06-16): the persona returns LLM-emitted JSON that
  // occasionally contains unescaped characters inside string values
  // (em-dashes, internal quotes, soft line breaks) — strict JSON.parse
  // breaks at the first violation, throwing away an otherwise-coherent
  // critique. The fallback uses `jsonrepair` to fix the common LLM
  // mistakes (trailing commas, single quotes, unescaped strings) and
  // re-parse. If even repair fails, we surface the error with detail.
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (strictErr) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { jsonrepair } = require('jsonrepair') as { jsonrepair: (s: string) => string };
      const repaired = jsonrepair(cleaned);
      parsed = JSON.parse(repaired);
    } catch (repairErr) {
      throw new Error(
        `adversarialCritic: persona returned non-JSON output (even after repair). ` +
          `First 300 chars: "${cleaned.slice(0, 300)}". ` +
          `Strict parse: ${strictErr instanceof Error ? strictErr.message : String(strictErr)}. ` +
          `Repair attempt: ${repairErr instanceof Error ? repairErr.message : String(repairErr)}`
      );
    }
  }
  return StructuredCritiqueSchema.parse(parsed);
}

// ===== Public interface =====

export interface AdversarialCriticInput {
  /** The decision to critique. */
  decisionId: Types.ObjectId | string;
  /** Why the critic was invoked. */
  triggerType: TriggerType;
  /** Optional structured context (profile, etc.). */
  context?: Record<string, unknown>;
}

export interface AdversarialCriticOutput {
  /** Two CritiqueEvents — one per persona. */
  critiques: Array<{
    persona: CriticPersona;
    critiqueEventId: Types.ObjectId;
    structured: StructuredCritique;
    runResult: AgentRunOutput;
  }>;
  /** Sum of cost across both personas. */
  totalCostCents: number;
}

/**
 * Run both critic personas in parallel against a decision. Emits two
 * CritiqueEvents (one per persona) to substrate, returns structured
 * outputs.
 */
export async function runAdversarialCritic(
  input: AdversarialCriticInput,
  ctx: ToolContext
): Promise<AdversarialCriticOutput> {
  // Resolve decisionId so we can pass a stable hex string into the
  // user prompt
  const decisionIdHex =
    typeof input.decisionId === 'string'
      ? input.decisionId
      : input.decisionId.toHexString();

  const userMessage = `Critique the decision with id "${decisionIdHex}". Load it via render_audit_trail, then emit your structured critique per the schema in your instructions.`;

  // Run both personas IN PARALLEL — independent calls, independent
  // events. They share the traceId so the chat surface can join them.
  const [flipperResult, cpaResult] = await Promise.all([
    runAgent(
      optimisticFlipperConfig,
      { userInput: userMessage, context: input.context },
      ctx
    ),
    runAgent(
      skepticalCpaConfig,
      { userInput: userMessage, context: input.context },
      ctx
    ),
  ]);

  // Parse structured outputs + write CritiqueEvents
  const personas: Array<{
    persona: CriticPersona;
    runResult: AgentRunOutput;
  }> = [
    { persona: 'optimistic_flipper', runResult: flipperResult },
    { persona: 'skeptical_cpa', runResult: cpaResult },
  ];

  // Task #63 (2026-06-18): switched from Promise.all to Promise.allSettled
  // so that one persona's parse failure doesn't drop the other's write.
  // Previously a JSON-broken CPA output (even after the #56 jsonrepair
  // fallback) would throw mid-flight, but the FLIPPER's write may have
  // already committed — leaving the workspace showing one persona of two.
  // Per-persona isolation fixes the orphan write AND surfaces a clear
  // log entry for ops when one persona consistently fails.
  const settled = await Promise.allSettled(
    personas.map(async ({ persona, runResult }) => {
      const structured = parseCritique(runResult.text);
      const originalDecisionId =
        input.decisionId instanceof Types.ObjectId
          ? input.decisionId
          : new Types.ObjectId(input.decisionId);
      const critiqueEventId = await eventsRepository.writeCritiqueEvent({
        traceId: ctx.traceId,
        actorType: 'agent:adversarial_critic',
        userId: ctx.userId,
        institutionId: ctx.institutionId,
        payload: {
          originalDecisionId,
          criticPersona: persona,
          agreementWithOriginal: structured.agreementWithOriginal,
          divergenceReasons: structured.divergenceReasons,
          alternativeAssumptions: structured.alternativeAssumptions.map((a) => ({
            fieldPath: a.fieldPath,
            suggestedValue: a.suggestedValue,
            reasoning: a.reasoning,
          })),
          severityScore: structured.severityScore,
          triggerType: input.triggerType,
          modelUsed: runResult.modelUsed,
          tokenCost: runResult.totalCostCents,
        },
      });
      return { persona, critiqueEventId, structured, runResult };
    })
  );

  const critiques: AdversarialCriticOutput['critiques'] = [];
  settled.forEach((res, idx) => {
    const { persona } = personas[idx];
    if (res.status === 'fulfilled') {
      critiques.push(res.value);
    } else {
      logger.warn(
        '[adversarialCritic] persona parse/write failed — other persona unaffected',
        {
          persona,
          decisionId: decisionIdHex,
          error: res.reason instanceof Error ? res.reason.message : String(res.reason),
        }
      );
    }
  });

  return {
    critiques,
    totalCostCents: flipperResult.totalCostCents + cpaResult.totalCostCents,
  };
}
