/**
 * tool:get_long_term_projection — Task #71 (2026-06-18).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When a user asks "show me the 10-year projection" or "what does Y10
 * look like" or "when does this turn cash-flow positive," the chat agent
 * previously had NO tool to fetch the substrate's long-term analysis. It
 * would CONFABULATE a directional answer from "standard assumptions" and
 * get nearly every number wrong AND wrong in the same direction (more
 * pessimistic than reality). Verified on 1837 Walnut Way 2026-06-18:
 *
 *   Agent said: "appreciation 3%, Y10 value ~$335K, equity ~$102K,
 *                break-even Y4-5, cumulative outflow $10-12K"
 *   Engine had: "appreciation 3.5%, Y10 value $352,650, equity $130K,
 *                break-even Y8, cumulative outflow $7,965 + TURNS positive Y8"
 *
 * A user could pass on a deal based on the agent's invented numbers and
 * never know the engine had better numbers. That defeats the entire
 * "institutional-grade analysis you can trust" positioning.
 *
 * Same pattern, same fix as #31 (get_decision_breakdown): read-only
 * wrapper over the existing audit-trail repo method, returning the
 * year-by-year projections + returns block + exit analysis exactly as
 * the engine produced them.
 *
 * THE ARCHITECTURAL POINT
 * -----------------------
 * Any time the agent doesn't have a read tool for substrate data, it
 * confabulates. The agent's instruction is now "never estimate a
 * projection — call this tool and narrate from the result."
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

export const GetLongTermProjectionInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetLongTermProjectionInput = z.input<typeof GetLongTermProjectionInputSchema>;

// ===== Output schema =====

/**
 * One year of the YBY projection. Mirrors YearlyProjection in
 * backend/src/types/analysis.ts. Optional fields stay optional — older
 * AnalysisEvents may not carry every line; defaulting to undefined is
 * honest, defaulting to 0 would imply "engine computed zero" which is a
 * different claim.
 */
const YearProjectionSchema = z.object({
  year: z.number(),
  propertyValue: z.number(),
  grossIncome: z.number(),
  operatingExpenses: z.number(),
  noi: z.number(),
  debtService: z.number(),
  cashFlow: z.number(),
  equity: z.number(),
  mortgageBalance: z.number(),
  totalReturn: z.number().optional(),
  appreciation: z.number().optional(),
  principalPaidThisYear: z.number().optional(),
  totalPrincipalPaidToDate: z.number().optional(),
  cashOnCashReturnThisYear: z.number().optional(),
});

const ReturnsSchema = z.object({
  irr: z.number().nullable(),
  totalCashFlow: z.number().nullable(),
  totalAppreciation: z.number().nullable(),
  totalReturn: z.number().nullable(),
  totalInvestment: z.number().nullable(),
  totalAdditionalInvestment: z.number().nullable(),
});

const ExitAnalysisSchema = z.object({
  projectedSalePrice: z.number().nullable(),
  sellingCosts: z.number().nullable(),
  mortgagePayoff: z.number().nullable(),
  netProceedsFromSale: z.number().nullable(),
  totalReturn: z.number().nullable(),
});

const AssumptionsSchema = z.object({
  projectionYears: z.number().nullable(),
  annualRentIncrease: z.number().nullable(),
  annualPropertyValueIncrease: z.number().nullable(),
  annualExpenseIncrease: z.number().nullable(),
  vacancyRate: z.number().nullable(),
  sellingCosts: z.number().nullable(),
});

export const GetLongTermProjectionOutputSchema = z.object({
  decisionId: z.string(),
  analysisEventId: z.string(),

  // The assumptions the engine projected against. Surface so the agent
  // can correctly state "appreciation 3.5%" rather than guessing "3%."
  assumptions: AssumptionsSchema,

  // Every projected year, in order. Length === assumptions.projectionYears
  // when well-formed (10 for standard SFR buy-hold).
  projections: z.array(YearProjectionSchema),

  // Aggregated returns over the projection horizon.
  returns: ReturnsSchema,

  // Exit / sale calculations at the end of the projection horizon.
  exitAnalysis: ExitAnalysisSchema,

  // Convenience field: the first year where cashFlow >= 0. Null if the
  // projection never turns positive. The agent will often need this for
  // "when does it cash-flow positive?" questions, and computing it once
  // here is cheaper + safer than letting the agent scan the array.
  breakEvenYear: z.number().nullable(),
});

export type GetLongTermProjectionOutput = z.infer<typeof GetLongTermProjectionOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function reqNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

// ===== Tool implementation =====

export const getLongTermProjection: Tool<
  GetLongTermProjectionInput,
  GetLongTermProjectionOutput
> = {
  name: 'get_long_term_projection',
  description:
    'Returns the actual year-by-year long-term projection for a scored decision: yearly cash flow, NOI, equity, property value, total return + the IRR / total returns block + exit-sale analysis — all pulled from the materialized AnalysisEvent. Pure read. Use this whenever the user asks about year-by-year projections, the 10-year picture, break-even year, Y10 value, exit proceeds, IRR walk-through, equity buildup, or any "long-term" question. NEVER estimate from standard assumptions — always call this tool and narrate FROM the returned numbers. The engine\'s real numbers will frequently differ from "directional" guesses (verified case: agent guessed 3% appreciation when engine used 3.5%, said break-even Y4-5 when actual was Y8, said cumulative outflow $10-12K when actual was $7,965 + turned positive by Y8).',
  inputSchema: GetLongTermProjectionInputSchema,
  outputSchema: GetLongTermProjectionOutputSchema as unknown as z.ZodSchema<GetLongTermProjectionOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetLongTermProjectionInput,
    ctx: ToolContext
  ): Promise<GetLongTermProjectionOutput> {
    const validated = GetLongTermProjectionInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);

    if (!bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no linked analysis event; ` +
          `cannot return a long-term projection. This usually means the analysis ` +
          `event was never written or has been pruned.`
      );
    }

    const analysisPayload = bundle.analysis.payload as unknown as {
      assumptions?: Record<string, unknown>;
      longTermAnalysis?: {
        projections?: Array<Record<string, unknown>>;
        projectionYears?: number;
        returns?: Record<string, unknown>;
        exitAnalysis?: Record<string, unknown>;
      };
    };

    const lt = analysisPayload.longTermAnalysis ?? {};
    const ap = (analysisPayload.assumptions ?? {}) as Record<string, unknown>;
    const projectionsRaw = Array.isArray(lt.projections) ? lt.projections : [];
    const returnsRaw = lt.returns ?? {};
    const exitRaw = lt.exitAnalysis ?? {};

    // Map each year row to the strict output shape. The agent gets EXACTLY
    // what the engine produced — no inference, no zero-filling beyond what
    // the engine itself wrote.
    const projections = projectionsRaw.map((row) => ({
      year: reqNum(row.year),
      propertyValue: reqNum(row.propertyValue),
      grossIncome: reqNum(row.grossIncome),
      operatingExpenses: reqNum(row.operatingExpenses),
      noi: reqNum(row.noi),
      debtService: reqNum(row.debtService),
      cashFlow: reqNum(row.cashFlow),
      equity: reqNum(row.equity),
      mortgageBalance: reqNum(row.mortgageBalance),
      totalReturn: num(row.totalReturn) ?? undefined,
      appreciation: num(row.appreciation) ?? undefined,
      principalPaidThisYear: num(row.principalPaidThisYear) ?? undefined,
      totalPrincipalPaidToDate: num(row.totalPrincipalPaidToDate) ?? undefined,
      cashOnCashReturnThisYear: num(row.cashOnCashReturnThisYear) ?? undefined,
    }));

    const breakEvenYear =
      projections.find((p) => p.cashFlow >= 0)?.year ?? null;

    const out: GetLongTermProjectionOutput = {
      decisionId: decisionId.toHexString(),
      analysisEventId:
        (bundle.analysis._id as Types.ObjectId)?.toHexString?.() ??
        String(bundle.analysis._id),
      assumptions: {
        projectionYears: num(ap.projectionYears),
        annualRentIncrease: num(ap.annualRentIncrease),
        annualPropertyValueIncrease: num(ap.annualPropertyValueIncrease),
        annualExpenseIncrease: num(ap.annualExpenseIncrease),
        vacancyRate: num(ap.vacancyRate),
        sellingCosts: num(ap.sellingCosts),
      },
      projections,
      returns: {
        irr: num(returnsRaw.irr),
        totalCashFlow: num(returnsRaw.totalCashFlow),
        totalAppreciation: num(returnsRaw.totalAppreciation),
        totalReturn: num(returnsRaw.totalReturn),
        totalInvestment: num(returnsRaw.totalInvestment),
        totalAdditionalInvestment: num(returnsRaw.totalAdditionalInvestment),
      },
      exitAnalysis: {
        projectedSalePrice: num(exitRaw.projectedSalePrice),
        sellingCosts: num(exitRaw.sellingCosts),
        mortgagePayoff: num(exitRaw.mortgagePayoff),
        netProceedsFromSale: num(exitRaw.netProceedsFromSale),
        totalReturn: num(exitRaw.totalReturn),
      },
      breakEvenYear,
    };

    return out;
  },
};
