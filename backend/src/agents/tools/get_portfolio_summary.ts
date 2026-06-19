/**
 * tool:get_portfolio_summary — Task #80 (2026-06-18).
 *
 * Aggregates the user's recent decisions into portfolio-level stats:
 * total properties analyzed, average Deal Quality Score, geographic
 * concentration (by state and by city), aggregate purchase price,
 * aggregate NOI, and a deal-quality distribution. Closes confabulation
 * when the user asks "how does this fit my portfolio?" / "what's my
 * average deal quality?" / "am I too concentrated in one market?".
 *
 * Same #31/#71/#79 pattern.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input schema =====

export const GetPortfolioSummaryInputSchema = z.object({
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'userId must be a 24-char hex string'),
  /** Number of most-recent unique-property decisions to include. */
  limit: z.number().int().positive().max(100).optional(),
});

export type GetPortfolioSummaryInput = z.input<typeof GetPortfolioSummaryInputSchema>;

// ===== Output schema =====

export const GetPortfolioSummaryOutputSchema = z.object({
  userId: z.string(),
  propertiesAnalyzed: z.number(),
  /** Average Deal Quality Score across most-recent decision per property. */
  averageDealQuality: z.number().nullable(),
  /** Distribution buckets — counts per quality band. */
  qualityDistribution: z.object({
    aboveStandards: z.number(),  // 80+
    meetsStandards: z.number(),  // 65-79
    requiresOptimization: z.number(),  // 50-64
    belowStandards: z.number(),  // <50
  }),
  /** Aggregate purchase price across all analyzed properties. */
  totalPurchasePrice: z.number(),
  /** Aggregate annual NOI (using metrics.noi from each analysis). */
  totalAnnualNOI: z.number(),
  /** Count by state — concentration signal. */
  byState: z.record(z.number()),
  /** Count by city — finer-grained concentration signal. */
  byCity: z.record(z.number()),
  /** Most-recent N property addresses for narrative reference. */
  recentProperties: z.array(z.object({
    address: z.string(),
    dealQuality: z.number(),
    purchasePrice: z.number(),
    analyzedAt: z.string(),
  })),
});

export type GetPortfolioSummaryOutput = z.infer<typeof GetPortfolioSummaryOutputSchema>;

// ===== Tool =====

export const getPortfolioSummary: Tool<
  GetPortfolioSummaryInput,
  GetPortfolioSummaryOutput
> = {
  name: 'get_portfolio_summary',
  description:
    "Returns aggregate stats across the user's recently analyzed properties: count, average Deal Quality Score, quality distribution by band, total purchase price, total annual NOI, geographic concentration (counts by state and city), plus the most-recent properties with score + price + date. Pure read. Use this whenever the user asks 'how does this fit my portfolio?' / 'what's my average deal quality?' / 'am I concentrated in one market?' / 'show me my portfolio overview' — narrate FROM these aggregated values. The portfolio is reconstructed from substrate DecisionEvents (most-recent decision per unique property), so it reflects what the user has actually analyzed, not a manually-curated list.",
  inputSchema: GetPortfolioSummaryInputSchema,
  outputSchema: GetPortfolioSummaryOutputSchema as unknown as z.ZodSchema<GetPortfolioSummaryOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetPortfolioSummaryInput,
    ctx: ToolContext
  ): Promise<GetPortfolioSummaryOutput> {
    const validated = GetPortfolioSummaryInputSchema.parse(input);
    const userObjectId = new Types.ObjectId(validated.userId);
    const limit = validated.limit ?? 50;

    const decisions = await ctx.eventsReads.getRecentDecisionsForUser(
      userObjectId,
      limit * 3 // over-fetch to allow dedup-by-property
    );

    // Group by canonicalAddressKey — keep MOST-RECENT decision per property.
    const byProperty = new Map<string, typeof decisions[number]>();
    for (const d of decisions) {
      const key = (d.payload as { canonicalAddressKey?: string }).canonicalAddressKey;
      if (!key) continue;
      const existing = byProperty.get(key);
      if (!existing || new Date(d.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
        byProperty.set(key, d);
      }
    }
    const uniqueDecisions = [...byProperty.values()].slice(0, limit);

    // Load paired AnalysisEvents for purchase price + NOI extraction.
    // Single batched query mirroring getScenariosForDeal.
    const analysisIds = uniqueDecisions
      .map((d) => d.payload.analysisEventId)
      .filter((id): id is Types.ObjectId => Boolean(id));
    const analyses = analysisIds.length > 0
      ? await Promise.all(
          analysisIds.map((id) => ctx.eventsReads.getAuditTrail(id).catch(() => null))
        )
      : [];
    const analysisById = new Map<string, typeof analyses[number]>();
    analyses.forEach((bundle, i) => {
      const id = analysisIds[i];
      if (bundle?.analysis) analysisById.set(id.toString(), bundle);
    });

    // Aggregate
    let qualitySum = 0;
    let qualityCount = 0;
    const dist = {
      aboveStandards: 0,
      meetsStandards: 0,
      requiresOptimization: 0,
      belowStandards: 0,
    };
    let totalPurchasePrice = 0;
    let totalAnnualNOI = 0;
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const recent: GetPortfolioSummaryOutput['recentProperties'] = [];

    for (const d of uniqueDecisions) {
      const q = d.payload.dealQuality;
      if (typeof q === 'number') {
        qualitySum += q;
        qualityCount++;
        if (q >= 80) dist.aboveStandards++;
        else if (q >= 65) dist.meetsStandards++;
        else if (q >= 50) dist.requiresOptimization++;
        else dist.belowStandards++;
      }

      const aId = d.payload.analysisEventId;
      const bundle = aId ? analysisById.get(aId.toString()) : null;
      const pd = bundle?.analysis?.payload && typeof bundle.analysis.payload === 'object'
        ? ((bundle.analysis.payload as unknown) as { propertyData?: { purchasePrice?: number; propertyAddress?: { street?: string; city?: string; state?: string } }; metrics?: { noi?: number } })
        : undefined;
      const pp = pd?.propertyData?.purchasePrice;
      const noi = pd?.metrics?.noi;
      if (typeof pp === 'number') totalPurchasePrice += pp;
      if (typeof noi === 'number') totalAnnualNOI += noi;

      const addr = pd?.propertyData?.propertyAddress;
      const state = addr?.state?.trim();
      const city = addr?.city?.trim();
      if (state) byState[state] = (byState[state] ?? 0) + 1;
      if (city) byCity[city] = (byCity[city] ?? 0) + 1;

      const addressLine = addr ? `${addr.street ?? ''}, ${addr.city ?? ''}, ${addr.state ?? ''}`.replace(/^, +|, +$/g, '') : 'Unknown';
      recent.push({
        address: addressLine,
        dealQuality: typeof q === 'number' ? q : 0,
        purchasePrice: typeof pp === 'number' ? pp : 0,
        analyzedAt: new Date(d.timestamp).toISOString(),
      });
    }

    return {
      userId: validated.userId,
      propertiesAnalyzed: uniqueDecisions.length,
      averageDealQuality: qualityCount > 0
        ? Math.round((qualitySum / qualityCount) * 10) / 10
        : null,
      qualityDistribution: dist,
      totalPurchasePrice,
      totalAnnualNOI,
      byState,
      byCity,
      recentProperties: recent.slice(0, 10),
    };
  },
};
