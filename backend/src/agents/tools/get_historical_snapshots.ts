/**
 * tool:get_historical_snapshots — Task #80 (2026-06-18).
 *
 * Returns the property's PRIOR analysis snapshots ordered by time —
 * a poor-man's trend view. Each row shows what the engine recorded
 * about market conditions + the property at that scoring moment.
 * Useful when the user asks "how have the numbers changed over
 * time?" / "what was my original analysis?" / "show me the history".
 *
 * IMPORTANT — we DO NOT have multi-year FRED/RentCast/Census trend
 * data. The engine stores only the SNAPSHOT current at each scoring.
 * So this tool surfaces only what's actually in substrate; for
 * decade-long market history, the agent must say "external sources
 * (FRED, Census directly) are authoritative."
 *
 * Same #31/#71/#79 pattern: substrate-backed read tool to prevent
 * the agent from inventing historical comparison numbers.
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

// ===== Input =====

export const GetHistoricalSnapshotsInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetHistoricalSnapshotsInput = z.input<typeof GetHistoricalSnapshotsInputSchema>;

// ===== Output =====

const SnapshotSchema = z.object({
  decisionEventId: z.string(),
  recordedAt: z.string(),
  purchasePrice: z.number().nullable(),
  monthlyRent: z.number().nullable(),
  dealQuality: z.number().nullable(),
  monthlyCashFlow: z.number().nullable(),
  capRate: z.number().nullable(),
  irrPercent: z.number().nullable(),
  fred30yrRate: z.number().nullable(),
  rentCastEstimatedRent: z.number().nullable(),
});

export const GetHistoricalSnapshotsOutputSchema = z.object({
  propertyAddress: z.string(),
  snapshotsCount: z.number(),
  snapshots: z.array(SnapshotSchema),
  /**
   * Mandatory disclaimer for the agent to surface: substrate carries
   * only what was scored, NOT multi-year independent trend data.
   */
  scopeDisclaimer: z.string(),
});

export type GetHistoricalSnapshotsOutput = z.infer<typeof GetHistoricalSnapshotsOutputSchema>;

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

// ===== Tool =====

export const getHistoricalSnapshots: Tool<
  GetHistoricalSnapshotsInput,
  GetHistoricalSnapshotsOutput
> = {
  name: 'get_historical_snapshots',
  description:
    "Returns the property's PRIOR analysis snapshots ordered by time — a substrate-backed view of how the numbers have changed across re-runs. Each row shows what the engine recorded at that scoring moment: purchase price, rent, Deal Quality, monthly cash flow, cap rate, IRR, FRED 30-yr mortgage rate at that time, RentCast estimated rent at that time. Use this whenever the user asks 'how have the numbers changed?' / 'show me my analysis history' / 'what did it look like last time?'. IMPORTANT: this is what THE ENGINE recorded at scoring time, NOT independent multi-year FRED/RentCast trend data — surface the scopeDisclaimer in the response so the user knows the scope.",
  inputSchema: GetHistoricalSnapshotsInputSchema,
  outputSchema: GetHistoricalSnapshotsOutputSchema as unknown as z.ZodSchema<GetHistoricalSnapshotsOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetHistoricalSnapshotsInput,
    ctx: ToolContext
  ): Promise<GetHistoricalSnapshotsOutput> {
    const validated = GetHistoricalSnapshotsInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getScenarioBundle(decisionId);
    if (!bundle?.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no analysis event; cannot fetch history.`
      );
    }
    const userId = bundle.decision.userId;
    const propertyData = ((bundle.analysis.payload as unknown) as { propertyData?: Record<string, unknown> }).propertyData ?? {};
    const address = propertyData.propertyAddress as { street?: string; city?: string; state?: string; zipCode?: string } | undefined;
    if (!address?.street || !address?.city || !address?.state) {
      return {
        propertyAddress: 'Unknown',
        snapshotsCount: 0,
        snapshots: [],
        scopeDisclaimer: 'No address — cannot fetch history.',
      };
    }
    const canonicalAddressKey = buildCanonicalAddressKey({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    });

    const bundles = await ctx.eventsReads.getScenariosForDeal(userId, canonicalAddressKey);
    // Sort by decision timestamp (chronological — oldest first)
    bundles.sort(
      (a, b) =>
        new Date(a.decision.timestamp).getTime() -
        new Date(b.decision.timestamp).getTime()
    );

    const snapshots = bundles.map((b) => {
      const ap = b.analysis?.payload && typeof b.analysis.payload === 'object'
        ? ((b.analysis.payload as unknown) as {
            propertyData?: { purchasePrice?: number; monthlyRent?: number };
            metrics?: { capRate?: number; irr?: number };
            monthlyAnalysis?: { cashFlow?: number };
            longTermAnalysis?: { returns?: { irr?: number } };
            marketData?: { fred?: { mortgage30yrRate?: number }; rentcast?: { estimatedRent?: number } };
          })
        : undefined;
      const irrDecimal = ap?.longTermAnalysis?.returns?.irr ?? ap?.metrics?.irr;
      const irrPercent =
        typeof irrDecimal === 'number' && Number.isFinite(irrDecimal)
          ? irrDecimal * 100
          : null;
      return {
        decisionEventId: b.decision._id.toString(),
        recordedAt: new Date(b.decision.timestamp).toISOString(),
        purchasePrice: num(ap?.propertyData?.purchasePrice),
        monthlyRent: num(ap?.propertyData?.monthlyRent),
        dealQuality: num(b.decision.payload.dealQuality),
        monthlyCashFlow: num(ap?.monthlyAnalysis?.cashFlow),
        capRate: num(ap?.metrics?.capRate),
        irrPercent,
        fred30yrRate: num(ap?.marketData?.fred?.mortgage30yrRate),
        rentCastEstimatedRent: num(ap?.marketData?.rentcast?.estimatedRent),
      };
    });

    return {
      propertyAddress: `${address.street}, ${address.city}, ${address.state}`,
      snapshotsCount: snapshots.length,
      snapshots,
      scopeDisclaimer:
        "These are what the engine recorded at scoring time for this property — not independent multi-year FRED, RentCast, or Census trend data. For decade-long market trends across a metro or zip, refer to FRED (fred.stlouisfed.org), the Census Bureau, or local MLS directly.",
    };
  },
};
