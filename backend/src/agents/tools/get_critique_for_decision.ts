/**
 * tool:get_critique_for_decision — Task #71 follow-up (2026-06-18).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When a user asks "what does the adversarial critic say?" / "show me
 * the bear case" / "what's the CPA flagging?" the chat agent has no
 * tool to fetch the actual CritiqueEvents. It would generate a
 * plausible-sounding bear/bull commentary from training-data patterns
 * — but the workspace has REAL critique data (two personas: optimistic
 * flipper + skeptical CPA) that the agent should be narrating from.
 *
 * Same architectural pattern as #31 (get_decision_breakdown) and #71
 * (get_long_term_projection): any substrate-backed read surface needs
 * a tool. Otherwise the agent fills the gap with statistical guesses.
 *
 * Returns BOTH persona critiques (if both ran) so the agent can present
 * the bull/bear balance. Each has agreementWithOriginal + divergence
 * reasons + alternative assumptions + severity score — the structured
 * disagreement the persona produced.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input schema =====

export const GetCritiqueForDecisionInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetCritiqueForDecisionInput = z.input<typeof GetCritiqueForDecisionInputSchema>;

// ===== Output schema =====

const AlternativeAssumptionSchema = z.object({
  fieldPath: z.string(),
  suggestedValue: z.union([z.number(), z.string(), z.boolean()]),
  reasoning: z.string(),
});

const CritiqueShapeSchema = z.object({
  criticPersona: z.enum(['optimistic_flipper', 'skeptical_cpa']),
  agreementWithOriginal: z.boolean(),
  divergenceReasons: z.array(z.string()),
  alternativeAssumptions: z.array(AlternativeAssumptionSchema),
  severityScore: z.number(),
});

export const GetCritiqueForDecisionOutputSchema = z.object({
  decisionId: z.string(),
  /**
   * Critiques for this decision. Length 0–2 — typically 2 when the
   * adversarialCritic fired both personas in parallel; sometimes 1 if
   * one persona's structured parse failed; 0 for pre-T1 deals (no
   * critique pipeline) or when the cost cap blocked the run.
   */
  critiques: z.array(CritiqueShapeSchema),
  /**
   * Convenience flag for the agent: true when critique generation was
   * EXPECTED (a CritiqueEvent.fire was logged for this decision) but
   * the events themselves haven't materialized yet (background job
   * still running). When true and critiques is empty, the agent
   * should say "the second-opinion review is still running" rather
   * than "there's no critique."
   */
  pending: z.boolean(),
});

export type GetCritiqueForDecisionOutput = z.infer<typeof GetCritiqueForDecisionOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const getCritiqueForDecision: Tool<
  GetCritiqueForDecisionInput,
  GetCritiqueForDecisionOutput
> = {
  name: 'get_critique_for_decision',
  description:
    'Returns the adversarial second-opinion critiques for a scored decision: the optimistic_flipper persona (argues the deal is BETTER than the engine scored — bull case) and the skeptical_cpa persona (argues the deal is WORSE than the engine scored — bear case). Each critique includes the persona\'s disagreement reasons, suggested alternative assumptions (with reasoning), and a severity score (0-100). Pure read. Use this whenever the user asks "what does the bear case say?" / "show me the critique" / "what would a CPA flag?" / "what could go wrong?" / "what\'s the optimistic take?" — narrate FROM these structured critiques instead of generating plausible-sounding bear/bull commentary from general patterns. The agent should present BOTH personas when available so the user gets the bull/bear balance that the product promises.',
  inputSchema: GetCritiqueForDecisionInputSchema,
  outputSchema: GetCritiqueForDecisionOutputSchema as unknown as z.ZodSchema<GetCritiqueForDecisionOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetCritiqueForDecisionInput,
    ctx: ToolContext
  ): Promise<GetCritiqueForDecisionOutput> {
    const validated = GetCritiqueForDecisionInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);
    const critiquesRaw = bundle.critiques ?? [];

    const critiques = critiquesRaw.map((c) => {
      const payload = c.payload as {
        criticPersona: 'optimistic_flipper' | 'skeptical_cpa';
        agreementWithOriginal: boolean;
        divergenceReasons: string[];
        alternativeAssumptions: Array<{
          fieldPath: string;
          suggestedValue: number | string | boolean;
          reasoning: string;
        }>;
        severityScore: number;
      };
      return {
        criticPersona: payload.criticPersona,
        agreementWithOriginal: payload.agreementWithOriginal,
        divergenceReasons: payload.divergenceReasons,
        alternativeAssumptions: payload.alternativeAssumptions,
        severityScore: payload.severityScore,
      };
    });

    // Pending heuristic: if critiques.length === 0, check whether the
    // decision was recent enough that the background critique job may
    // still be in flight. Bundle's decision payload carries the
    // recordedAt; if within ~60s and we have NO critiques, treat as
    // pending. This is the same posture the CritiqueCard component
    // uses on the frontend.
    let pending = false;
    if (critiques.length === 0 && bundle.decision) {
      const recordedAt = (bundle.decision as { recordedAt?: Date }).recordedAt;
      if (recordedAt) {
        const ageMs = Date.now() - new Date(recordedAt).getTime();
        if (ageMs < 60_000) pending = true;
      }
    }

    return {
      decisionId: decisionId.toHexString(),
      critiques,
      pending,
    };
  },
};
