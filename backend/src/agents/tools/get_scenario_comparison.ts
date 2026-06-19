/**
 * tool:get_scenario_comparison — Task #79 (2026-06-18).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When the user asks "what changed between scenarios?" / "why did
 * Scenario B score lower than baseline?" / "show me my saved
 * stress tests" — the agent has no tool to fetch the substrate's
 * scenario spine. It would guess based on conversation history. The
 * workspace has REAL scenario diffs (each saved analysis = one
 * scenario, with field-level deltas vs baseline).
 *
 * Same pattern as #31 + #71 + get_critique_for_decision: any
 * substrate-backed read surface needs a tool.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';
import { buildCanonicalAddressKey } from '../../utils/canonicalAddressKey';
import { diffScenarioInputs, scenarioInputSignature } from '../../services/scenarioDiff';

// ===== Input schema =====

export const GetScenarioComparisonInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetScenarioComparisonInput = z.input<typeof GetScenarioComparisonInputSchema>;

// ===== Output schema =====

const FactorScoresSchema = z.object({
  cashFlow: z.number().nullable(),
  irr: z.number().nullable(),
  marketStrength: z.number().nullable(),
});

const DeltaSchema = z.object({
  field: z.string(),
  label: z.string(),
  baseline: z.union([z.number(), z.string(), z.boolean(), z.null()]),
  scenario: z.union([z.number(), z.string(), z.boolean(), z.null()]),
});

const ScenarioRowSchema = z.object({
  decisionEventId: z.string(),
  isBaseline: z.boolean(),
  isCurrent: z.boolean(),
  dealQuality: z.number(),
  factorScores: FactorScoresSchema,
  deltas: z.array(DeltaSchema),
});

export const GetScenarioComparisonOutputSchema = z.object({
  propertyAddress: z.string(),
  scenarios: z.array(ScenarioRowSchema),
});

export type GetScenarioComparisonOutput = z.infer<typeof GetScenarioComparisonOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const getScenarioComparison: Tool<
  GetScenarioComparisonInput,
  GetScenarioComparisonOutput
> = {
  name: 'get_scenario_comparison',
  description:
    'Returns the full scenario spine for the property associated with a decision: every saved analysis (baseline + stress tests + re-runs) with its Deal Quality Score, factor scores, and field-level deltas vs the baseline. Pure read. Use this whenever the user asks "what scenarios do I have on this property?" / "what changed between A and B?" / "why did Scenario B score lower?" / "show me my stress tests" / "compare my scenarios" — narrate FROM these structured rows instead of guessing from chat history. Each row includes which inputs were changed and the magnitude of each change.',
  inputSchema: GetScenarioComparisonInputSchema,
  outputSchema: GetScenarioComparisonOutputSchema as unknown as z.ZodSchema<GetScenarioComparisonOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetScenarioComparisonInput,
    ctx: ToolContext
  ): Promise<GetScenarioComparisonOutput> {
    const validated = GetScenarioComparisonInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getScenarioBundle(decisionId);
    if (!bundle?.decision || !bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} not found or missing analysis — cannot fetch scenario spine.`
      );
    }

    const userId = bundle.decision.userId;
    const propertyData = ((bundle.analysis.payload as unknown) as { propertyData?: Record<string, unknown> }).propertyData ?? {};
    const address = propertyData.propertyAddress as
      | { street?: string; city?: string; state?: string; zipCode?: string }
      | undefined;
    if (!address?.street || !address?.city || !address?.state) {
      return { propertyAddress: 'Unknown', scenarios: [] };
    }
    const canonicalAddressKey = buildCanonicalAddressKey({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    });

    const bundles = await ctx.eventsReads.getScenariosForDeal(userId, canonicalAddressKey);
    if (bundles.length === 0) {
      return {
        propertyAddress: `${address.street}, ${address.city}, ${address.state}`,
        scenarios: [],
      };
    }

    // Dedup by input signature — identical re-runs collapse to one,
    // keeping the latest timestamp. Same posture as the workspace
    // scenario-comparison endpoint.
    const bySig = new Map<string, (typeof bundles)[number]>();
    for (const b of bundles) {
      const pd = (b.analysis?.payload?.propertyData ?? {}) as Record<string, unknown>;
      const sig = scenarioInputSignature(pd);
      const existing = bySig.get(sig);
      if (
        !existing ||
        new Date(b.decision.timestamp).getTime() >
          new Date(existing.decision.timestamp).getTime()
      ) {
        bySig.set(sig, b);
      }
    }
    const ordered = [...bySig.values()].sort(
      (x, y) =>
        new Date(x.decision.timestamp).getTime() -
        new Date(y.decision.timestamp).getTime()
    );

    const baselinePd = (ordered[0].analysis?.payload?.propertyData ?? {}) as Record<string, unknown>;
    const latestTs = Math.max(...ordered.map((b) => new Date(b.decision.timestamp).getTime()));

    const scenarios = ordered.map((b, idx) => {
      const pd = (b.analysis?.payload?.propertyData ?? {}) as Record<string, unknown>;
      const dp = b.decision.payload;
      const pa = dp.professionalAssessment;
      const diff = idx === 0
        ? { deltas: [], changedCount: 0 }
        : diffScenarioInputs(baselinePd, pd);

      type Delta = { field: string; label: string; baseline: unknown; scenario: unknown };
      const typedDiff = diff as { deltas: Delta[] };
      return {
        decisionEventId: b.decision._id.toString(),
        isBaseline: idx === 0,
        isCurrent: new Date(b.decision.timestamp).getTime() === latestTs,
        dealQuality: dp.dealQuality,
        factorScores: {
          cashFlow: typeof pa?.cashFlowScore === 'number' ? pa.cashFlowScore : null,
          irr: typeof pa?.irrScore === 'number' ? pa.irrScore : null,
          marketStrength: typeof pa?.marketStrengthScore === 'number' ? pa.marketStrengthScore : null,
        },
        deltas: typedDiff.deltas.map((d) => ({
          field: d.field,
          label: d.label,
          baseline: (d.baseline as string | number | boolean | null) ?? null,
          scenario: (d.scenario as string | number | boolean | null) ?? null,
        })),
      };
    });

    return {
      propertyAddress: `${address.street}, ${address.city}, ${address.state}`,
      scenarios,
    };
  },
};
