/**
 * tool:compare_two_properties — Task #80 (2026-06-18).
 *
 * Side-by-side metric comparison of two decisions. Closes confabulation
 * when the user asks "should I buy A or B?" / "which is the stronger
 * deal?" / "compare 123 Main vs 456 Oak". The agent has historically
 * answered these by re-comparing fields from memory, which drifts as
 * soon as the conversation gets long.
 *
 * Returns headline metrics for each property + flags which property
 * "wins" each metric (where winning is unambiguous — e.g., higher
 * IRR / higher cap rate / higher DSCR / lower walk-away discount).
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input =====

export const CompareTwoPropertiesInputSchema = z.object({
  decisionIdA: objectIdHex,
  decisionIdB: objectIdHex,
});

export type CompareTwoPropertiesInput = z.input<typeof CompareTwoPropertiesInputSchema>;

// ===== Output =====

const PropertySnapshotSchema = z.object({
  decisionId: z.string(),
  address: z.string(),
  purchasePrice: z.number().nullable(),
  monthlyRent: z.number().nullable(),
  dealQuality: z.number().nullable(),
  monthlyCashFlow: z.number().nullable(),
  capRate: z.number().nullable(),
  irr: z.number().nullable(),
  cashOnCashReturn: z.number().nullable(),
  dscr: z.number().nullable(),
  annualNOI: z.number().nullable(),
  walkAwayPrice: z.number().nullable(),
});

const ComparisonSchema = z.object({
  metric: z.string(),
  valueA: z.number().nullable(),
  valueB: z.number().nullable(),
  winner: z.enum(['A', 'B', 'tie', 'undetermined']),
  note: z.string(),
});

export const CompareTwoPropertiesOutputSchema = z.object({
  propertyA: PropertySnapshotSchema,
  propertyB: PropertySnapshotSchema,
  comparisons: z.array(ComparisonSchema),
});

export type CompareTwoPropertiesOutput = z.infer<typeof CompareTwoPropertiesOutputSchema>;

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

async function snapshot(
  ctx: ToolContext,
  decisionId: Types.ObjectId
): Promise<z.infer<typeof PropertySnapshotSchema>> {
  const bundle = await ctx.eventsReads.getAuditTrail(decisionId);
  if (!bundle.analysis) {
    throw new Error(
      `Decision ${decisionId.toHexString()} has no linked analysis event; cannot snapshot.`
    );
  }
  const ap = (bundle.analysis.payload as unknown) as {
    propertyData?: {
      purchasePrice?: number;
      monthlyRent?: number;
      propertyAddress?: { street?: string; city?: string; state?: string };
    };
    metrics?: { capRate?: number; cashOnCashReturn?: number; dscr?: number; noi?: number; irr?: number };
    monthlyAnalysis?: { cashFlow?: number };
    longTermAnalysis?: { returns?: { irr?: number } };
    walkAwayPrice?: number;
  };
  const dp = bundle.decision.payload as { dealQuality?: number; marketPosition?: { walkAwayPrice?: number } };
  const addr = ap.propertyData?.propertyAddress;
  const addressLine = addr
    ? `${addr.street ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''}`.replace(/^, +|, +$/g, '')
    : 'Unknown';

  // IRR stored as decimal — convert to percent for comparison-friendly value.
  const irrDecimal = ap.longTermAnalysis?.returns?.irr ?? ap.metrics?.irr;
  const irrPercent = typeof irrDecimal === 'number' && Number.isFinite(irrDecimal)
    ? irrDecimal * 100
    : null;

  return {
    decisionId: decisionId.toHexString(),
    address: addressLine,
    purchasePrice: num(ap.propertyData?.purchasePrice),
    monthlyRent: num(ap.propertyData?.monthlyRent),
    dealQuality: num(dp.dealQuality),
    monthlyCashFlow: num(ap.monthlyAnalysis?.cashFlow),
    capRate: num(ap.metrics?.capRate),
    irr: irrPercent,
    cashOnCashReturn: num(ap.metrics?.cashOnCashReturn),
    dscr: num(ap.metrics?.dscr),
    annualNOI: num(ap.metrics?.noi),
    walkAwayPrice: num(dp.marketPosition?.walkAwayPrice ?? ap.walkAwayPrice),
  };
}

function compare(
  metric: string,
  a: number | null,
  b: number | null,
  higherIsBetter: boolean,
  note: string
): z.infer<typeof ComparisonSchema> {
  if (a === null || b === null) {
    return { metric, valueA: a, valueB: b, winner: 'undetermined', note };
  }
  if (a === b) return { metric, valueA: a, valueB: b, winner: 'tie', note };
  const aWins = higherIsBetter ? a > b : a < b;
  return { metric, valueA: a, valueB: b, winner: aWins ? 'A' : 'B', note };
}

// ===== Tool =====

export const compareTwoProperties: Tool<
  CompareTwoPropertiesInput,
  CompareTwoPropertiesOutput
> = {
  name: 'compare_two_properties',
  description:
    "Returns a side-by-side comparison of two scored decisions: each property's address + purchase price + headline metrics (Deal Quality Score, monthly cash flow, cap rate, IRR, cash-on-cash, DSCR, annual NOI, walk-away price) PLUS a per-metric comparison flagging which property wins each. Use this whenever the user asks 'should I buy A or B?' / 'compare 123 Main vs 456 Oak' / 'which is the stronger deal?' — narrate FROM the structured comparison rather than eyeballing from memory. Both decisions must be the user's own (caller-enforced isolation).",
  inputSchema: CompareTwoPropertiesInputSchema,
  outputSchema: CompareTwoPropertiesOutputSchema as unknown as z.ZodSchema<CompareTwoPropertiesOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: CompareTwoPropertiesInput,
    ctx: ToolContext
  ): Promise<CompareTwoPropertiesOutput> {
    const validated = CompareTwoPropertiesInputSchema.parse(input);
    const idA = resolveObjectId(validated.decisionIdA);
    const idB = resolveObjectId(validated.decisionIdB);

    const [propertyA, propertyB] = await Promise.all([
      snapshot(ctx, idA),
      snapshot(ctx, idB),
    ]);

    const comparisons: z.infer<typeof ComparisonSchema>[] = [
      compare('Deal Quality Score', propertyA.dealQuality, propertyB.dealQuality, true, 'Higher composite score'),
      compare('Monthly cash flow', propertyA.monthlyCashFlow, propertyB.monthlyCashFlow, true, 'Higher monthly cash flow'),
      compare('Cap rate', propertyA.capRate, propertyB.capRate, true, 'Higher cap rate — better yield on price'),
      compare('IRR (%)', propertyA.irr, propertyB.irr, true, 'Higher 10-year IRR'),
      compare('Cash-on-cash (%)', propertyA.cashOnCashReturn, propertyB.cashOnCashReturn, true, 'Higher cash return on cash invested'),
      compare('DSCR', propertyA.dscr, propertyB.dscr, true, 'Higher debt service coverage — lower lender risk'),
      compare('Annual NOI', propertyA.annualNOI, propertyB.annualNOI, true, 'Higher operating income'),
      // Walk-away vs offer: smaller "you-pay/walk-away" gap is better. We
      // compare the WALK-AWAY itself (higher walk-away on similarly-priced
      // properties = more headroom), but the agent should ALSO surface
      // each property's offer-to-walk-away delta in narration.
      compare('Walk-away price', propertyA.walkAwayPrice, propertyB.walkAwayPrice, true, 'Higher walk-away absolute value (also consider gap vs each offer)'),
    ];

    return { propertyA, propertyB, comparisons };
  },
};
