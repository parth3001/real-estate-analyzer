/**
 * tool:get_market_context — Task #79 (2026-06-18).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When the user asks "what's the current rate environment?" / "what
 * are comps showing for Anna TX?" / "what's the median rent" — the
 * agent has no tool to fetch the cached marketData that was scored
 * against. It would generate confident-sounding numbers from training
 * data that may be months or years out of date.
 *
 * Returns the EXACT market snapshot the engine used at score time —
 * FRED rates, RentCast rental comps, Census demographics — pulled
 * from the AnalysisEvent payload. NOT a live re-fetch; the agent
 * narrates what the engine actually scored against.
 *
 * Same pattern as #31, #71, get_critique_for_decision: any
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

// ===== Input schema =====

export const GetMarketContextInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetMarketContextInput = z.input<typeof GetMarketContextInputSchema>;

// ===== Output schema =====

export const GetMarketContextOutputSchema = z.object({
  decisionId: z.string(),
  /**
   * As-of date for this market snapshot. The agent must qualify any
   * narration with this date ("as of 2026-06-18, the 30-yr mortgage
   * rate was 6.5%...") so users understand the data isn't real-time.
   */
  snapshotDate: z.string().nullable(),
  /** Whether the engine used live cache vs fallback at score time. */
  enrichmentSource: z.string().nullable(),
  fred: z.object({
    mortgage30yrRate: z.number().nullable(),
    inflationRate: z.number().nullable(),
    unemploymentRate: z.number().nullable(),
    housingPriceIndex: z.number().nullable(),
  }),
  rentcast: z.object({
    estimatedRent: z.number().nullable(),
    rentLow: z.number().nullable(),
    rentHigh: z.number().nullable(),
    comparablesCount: z.number().nullable(),
    medianRent: z.number().nullable(),
  }),
  census: z.object({
    medianHouseholdIncome: z.number().nullable(),
    medianHomeValue: z.number().nullable(),
    populationGrowth: z.number().nullable(),
    medianAge: z.number().nullable(),
  }),
  /** Free-form market insights the engine stamped (rare; may be empty). */
  marketInsights: z.array(z.string()),
});

export type GetMarketContextOutput = z.infer<typeof GetMarketContextOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// ===== Tool implementation =====

export const getMarketContext: Tool<
  GetMarketContextInput,
  GetMarketContextOutput
> = {
  name: 'get_market_context',
  description:
    'Returns the EXACT market snapshot the engine scored this decision against — FRED economic data (mortgage rates, inflation, unemployment, housing price index), RentCast rental estimates and comparables, Census demographics. Pulled from the AnalysisEvent payload, NOT a live re-fetch. Use this whenever the user asks "what\'s the rate environment?" / "what are comps showing?" / "what\'s the median rent?" / "what does the market data look like for this area?" — narrate FROM these snapshot values rather than guessing current numbers from training data. ALWAYS qualify the narration with the snapshot date so users understand the data isn\'t real-time.',
  inputSchema: GetMarketContextInputSchema,
  outputSchema: GetMarketContextOutputSchema as unknown as z.ZodSchema<GetMarketContextOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetMarketContextInput,
    ctx: ToolContext
  ): Promise<GetMarketContextOutput> {
    const validated = GetMarketContextInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);
    if (!bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no linked analysis event; cannot return market context.`
      );
    }

    const ap = bundle.analysis.payload as unknown as {
      marketData?: Record<string, unknown>;
      marketInsights?: unknown[];
      enrichmentSource?: string;
    };

    const md = (ap.marketData ?? {}) as Record<string, unknown>;
    const fred = (md.fred ?? md.fredData ?? {}) as Record<string, unknown>;
    const rentcast = (md.rentcast ?? md.rentCast ?? {}) as Record<string, unknown>;
    const census = (md.census ?? md.censusData ?? {}) as Record<string, unknown>;

    const insightsRaw = Array.isArray(ap.marketInsights) ? ap.marketInsights : [];
    const marketInsights = insightsRaw
      .map((i) => {
        if (typeof i === 'string') return i;
        if (i && typeof i === 'object' && 'description' in i) {
          return String((i as { description?: unknown }).description ?? '');
        }
        return '';
      })
      .filter((s) => s.length > 0);

    return {
      decisionId: decisionId.toHexString(),
      snapshotDate: str((md.lastUpdated ?? md.snapshotDate) as unknown),
      enrichmentSource: str(ap.enrichmentSource),
      fred: {
        mortgage30yrRate: num(fred.mortgage30yrRate ?? fred.mortgageRate ?? fred.rate30yr),
        inflationRate: num(fred.inflationRate ?? fred.cpi),
        unemploymentRate: num(fred.unemploymentRate ?? fred.unemployment),
        housingPriceIndex: num(fred.housingPriceIndex ?? fred.hpi),
      },
      rentcast: {
        estimatedRent: num(rentcast.estimatedRent ?? rentcast.rent),
        rentLow: num(rentcast.rentLow ?? rentcast.rangeLow),
        rentHigh: num(rentcast.rentHigh ?? rentcast.rangeHigh),
        comparablesCount: num(rentcast.comparablesCount ?? rentcast.compsCount),
        medianRent: num(rentcast.medianRent),
      },
      census: {
        medianHouseholdIncome: num(census.medianHouseholdIncome ?? census.medianIncome),
        medianHomeValue: num(census.medianHomeValue),
        populationGrowth: num(census.populationGrowth ?? census.popGrowth),
        medianAge: num(census.medianAge),
      },
      marketInsights,
    };
  },
};
