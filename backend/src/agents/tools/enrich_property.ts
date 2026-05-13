/**
 * tool:enrich_property — W4-S5.
 *
 * First read-only tool that hits external APIs. Wraps the existing
 * MarketIntelligenceService (which orchestrates RentCast + FRED +
 * Census) and returns the enrichment bundle the agent uses to seed
 * compute_analysis + score_deal.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2.
 *
 * STRANGLER-FIG RESPECT
 * ---------------------
 *
 * MarketIntelligenceService is unchanged. The tool is a thin adapter
 * over its `getComprehensiveMarketData()` method, with:
 *   - Input shape normalized for the agent (`address` object instead
 *     of flat fields)
 *   - Output renamed to match the agent-mesh §3.2 catalog
 *     (`comps`, `marketTrends`, `economic`, `propertyData` —
 *     vs. the service's `comparables`, `marketTrends`,
 *     `economicIndicators`, `property`)
 *   - Provenance fields (`enrichmentSource`, `cacheHit`, `lastUpdated`)
 *     surfaced so callers can feed them directly into score_deal's
 *     AnalysisEvent inputs.
 *
 * NO EVENTS EMITTED
 * -----------------
 *
 * Enrichment is a read; it doesn't change substrate state. The data
 * gets captured later by score_deal's AnalysisEvent (which snapshots
 * the marketData it was scored against). Per events store §3.2 — the
 * substrate's source-of-truth for "what market data was the engine
 * looking at" is the AnalysisEvent.
 */

import { z } from 'zod';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';
import { marketIntelligenceService } from '../../services/marketIntelligenceService';
import type {
  MarketDataQuery,
  MarketDataResponse,
} from '../../types/marketData';

// ===== Adapter (mirrors the score_deal pattern) =====

/**
 * Adapter over MarketIntelligenceService. Decouples the tool from the
 * service so tests can substitute stubs without mocking modules. The
 * service itself is unchanged.
 */
export interface MarketIntelligenceAdapter {
  getComprehensiveMarketData(query: MarketDataQuery): Promise<MarketDataResponse>;
}

export const defaultMarketIntelligenceAdapter: MarketIntelligenceAdapter = {
  getComprehensiveMarketData: (query) =>
    marketIntelligenceService.getComprehensiveMarketData(query),
};

// Module-level slot (same pattern as score_deal — production never
// overrides, tests do).
let currentAdapter: MarketIntelligenceAdapter = defaultMarketIntelligenceAdapter;

export function setMarketIntelligenceAdapter(
  adapter: MarketIntelligenceAdapter
): void {
  currentAdapter = adapter;
}

export function resetMarketIntelligenceAdapter(): void {
  currentAdapter = defaultMarketIntelligenceAdapter;
}

// ===== Input schema =====

const PropertyTypeSchema = z.enum(['SFR', 'Condo', 'Townhouse', 'Multi-Family']);

export const EnrichPropertyInputSchema = z.object({
  /** Structured address — the four fields the upstream services need. */
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
  }),

  /** Property type — feeds the RentCast comparable filter. */
  propertyType: PropertyTypeSchema.optional(),

  /** Optional knobs forwarded to the underlying service. */
  radius: z.number().positive().max(50).optional(),
  maxComparables: z.number().int().positive().max(50).optional(),
  forceRefresh: z.boolean().optional(),
});

export type EnrichPropertyInput = z.infer<typeof EnrichPropertyInputSchema>;

// ===== Output schema =====

/**
 * Tool boundary uses shallow Zod for the four nested objects. Deep
 * types live in `MarketDataResponse` and are preserved by the
 * TypeScript output type below.
 */
const ObjectShape = z.custom<Record<string, unknown>>(
  (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
  { message: 'Expected a non-null object' }
);

const EnrichmentSourceSchema = z.enum([
  'rentcast',
  'fred',
  'census',
  'fallback',
  'composite',
]);

export const EnrichPropertyOutputSchema = z.object({
  /** RentCast comparable properties (may be empty). */
  comps: z.array(z.record(z.string(), z.unknown())),

  /** Market trend signal for the zip code. */
  marketTrends: ObjectShape,

  /** FRED economic indicators (mortgage rates, unemployment, etc.). */
  economic: ObjectShape,

  /** Subject property data from RentCast (rent estimate, beds/baths, etc.). */
  propertyData: ObjectShape,

  /** Provenance — what sources actually returned data. */
  enrichmentSource: EnrichmentSourceSchema,

  /** Did this hit the service's cache? Best-effort detection. */
  cacheHit: z.boolean(),

  /** When the underlying service compiled this response. */
  lastUpdated: z.date(),

  /** The full bundle (for downstream tools that want everything). */
  fullResponse: z.unknown(),
});

export type EnrichPropertyOutput = {
  comps: MarketDataResponse['comparables'];
  marketTrends: MarketDataResponse['marketTrends'];
  economic: MarketDataResponse['economicIndicators'];
  propertyData: MarketDataResponse['property'];
  enrichmentSource: z.infer<typeof EnrichmentSourceSchema>;
  cacheHit: boolean;
  lastUpdated: Date;
  fullResponse: MarketDataResponse;
};

// ===== Helpers =====

/**
 * Derives the substrate `enrichmentSource` from the service's
 * dataSource array. The service returns e.g.
 * ['rentcast', 'fred'] when both succeed, ['Fallback'] when nothing
 * succeeded, or ['rentcast'] when only one source returned. The
 * substrate enum is narrower; map down deliberately.
 */
function deriveEnrichmentSource(
  dataSources: string[]
): EnrichPropertyOutput['enrichmentSource'] {
  const lower = dataSources.map((s) => s.toLowerCase());
  if (lower.some((s) => s.includes('fallback'))) return 'fallback';

  const known = lower.filter((s) =>
    ['rentcast', 'fred', 'census'].includes(s)
  );
  if (known.length === 0) return 'fallback';
  if (known.length > 1) return 'composite';
  return known[0] as 'rentcast' | 'fred' | 'census';
}

/**
 * Best-effort cache-hit detection. The underlying service caches
 * internally but doesn't surface a hit flag. Heuristic: if the
 * lastUpdated date is meaningfully older than "now", it was served
 * from cache. Threshold: 5 seconds (generous — accounts for slow
 * networks where a fresh call could still be a few seconds old).
 *
 * v1 quality. Real cache-hit telemetry would require a small change
 * to the service to expose the hit flag; out of scope for the
 * strangler-fig wrapper.
 */
function inferCacheHit(lastUpdated: Date, callStartTime: number): boolean {
  const updatedMs = lastUpdated.getTime();
  return callStartTime - updatedMs > 5_000;
}

// ===== Tool implementation =====

export const enrichProperty: Tool<EnrichPropertyInput, EnrichPropertyOutput> = {
  name: 'enrich_property',
  description:
    'Fetches RentCast comparable properties, RentCast subject property data, FRED economic indicators, and market-trend signal for a given address. Read-only; emits no events. The market data captured here is later snapshotted into the AnalysisEvent by score_deal.',
  inputSchema: EnrichPropertyInputSchema,
  outputSchema: EnrichPropertyOutputSchema as unknown as z.ZodSchema<EnrichPropertyOutput>,
  invokeLLM: false,
  sideEffects: [
    { type: 'external_api', service: 'rentcast' },
    { type: 'external_api', service: 'fred' },
    { type: 'external_api', service: 'census' },
  ],
  // Read with external APIs — retry transient failures.
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: EnrichPropertyInput,
    _ctx: ToolContext
  ): Promise<EnrichPropertyOutput> {
    const validated = EnrichPropertyInputSchema.parse(input);

    const callStartTime = Date.now();

    const query: MarketDataQuery = {
      address: validated.address.street,
      zipCode: validated.address.zipCode,
      city: validated.address.city,
      state: validated.address.state,
      propertyType: validated.propertyType,
      radius: validated.radius,
      maxComparables: validated.maxComparables,
      forceRefresh: validated.forceRefresh,
      includeEconomicData: true,
    };

    const response = await currentAdapter.getComprehensiveMarketData(query);

    return {
      comps: response.comparables,
      marketTrends: response.marketTrends,
      economic: response.economicIndicators,
      propertyData: response.property,
      enrichmentSource: deriveEnrichmentSource(response.dataSource),
      cacheHit: inferCacheHit(response.lastUpdated, callStartTime),
      lastUpdated: response.lastUpdated,
      fullResponse: response,
    };
  },
};
