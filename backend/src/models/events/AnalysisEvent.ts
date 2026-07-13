/**
 * AnalysisEvent — second wave-1 event type (W1-S2 part 2).
 *
 * The heaviest payload in the events store. Captures the inputs + outputs
 * of a single analysis run: property data, market data, assumptions, all
 * 60+ computed metrics, monthly + long-term breakdown, and the walk-away
 * price. Self-contained snapshot so any historical decision can be
 * replayed without joining against mutable upstream collections.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.2.
 *
 * Architectural note — payload validation strategy (per events store §4.2):
 *   - Zod schema validates SHAPE at the repository layer: required fields
 *     present, primitive types correct, enums valid, numeric ranges sane.
 *   - DEEP type safety on nested complex objects (propertyData, marketData,
 *     metrics) lives at the TypeScript layer via existing types in
 *     /backend/src/types/. Zod treats these as opaque objects at runtime;
 *     the TypeScript interface (`AnalysisPayload`) declares them with
 *     proper deep types.
 *   - This is a deliberate decision: redefining the existing 200+ line
 *     TypeScript types as Zod schemas would duplicate the source of
 *     truth without proportional safety gain. Application code (wizard
 *     backend in wave 1.5, agent tools in wave 1) is responsible for
 *     constructing well-typed payloads before writing.
 *
 * Storage: Mongoose discriminator with payload as Schema.Types.Mixed.
 * Stored in the unified `events` collection alongside other event types.
 */

import { z } from 'zod';
import { Schema } from 'mongoose';
import { BaseEventModel } from './BaseEvent';
import { normalizeStrategy } from '../../domain/strategy';
import type {
  SFRData,
  MultiFamilyData,
  SFRMetrics,
  MultiFamilyMetrics,
} from '../../types/propertyTypes';
import type { MarketDataResponse } from '../../types/marketData';
// analysisShapes is referenced in the materializer for tolerant
// read-side parsing (Task #41 Tier 2). It's intentionally not imported
// here yet — Tier 1 (write-side enforcement) is deferred until the
// test fixtures conform.

// ===== Enum-like type for enrichment provenance =====

const EnrichmentSourceSchema = z.enum([
  'rentcast',
  'fred',
  'census',
  'fallback',
  'composite',
]);

export type EnrichmentSource = z.infer<typeof EnrichmentSourceSchema>;

// ===== Shallow runtime guard for complex nested objects =====

/**
 * Validates that a value is a non-null, non-array object. Used for nested
 * payload fields where the source of truth is a TypeScript type (e.g.,
 * SFRData, MarketDataResponse). The repository layer relies on this guard
 * to ensure application code didn't accidentally pass undefined / null /
 * array; deeper field-level validation lives in the calling code's type
 * system, not Zod.
 */
const ObjectShapeSchema = z.custom<Record<string, unknown>>(
  (val) => typeof val === 'object' && val !== null && !Array.isArray(val),
  { message: 'Expected a non-null object (not array, not primitive)' }
);

// ===== Zod payload schema (runtime validation) =====

/**
 * AnalysisPayloadSchema — runtime validation for AnalysisEvent payload.
 *
 * The repository layer (W1-S3) calls `.parse()` on this schema before
 * passing the payload to `AnalysisEventModel.create()`. Mongoose's Mixed
 * type then stores the validated object as-is.
 */
export const AnalysisPayloadSchema = z.object({
  // Inputs (snapshot — preserved so any decision can be replayed)
  //
  // Issue #243 (2026-07-12) — WRITE-boundary refinement on
  // `propertyData.investmentStrategy`. If present, the value MUST
  // canonicalize via `normalizeStrategy` (kebab / snake / SCREAMING /
  // spaced all accepted). This enforces the write contract without
  // fully-typing propertyData (still ObjectShape by design, per
  // /docs/PRODUCT_2.0_EVENTS_STORE.md §4.2). Historical reads are
  // unaffected — the refinement only fires on new writes.
  propertyData: ObjectShapeSchema.refine(
    (val) => {
      const strat = (val as Record<string, unknown>).investmentStrategy;
      if (strat === undefined || strat === null) return true;
      return normalizeStrategy(strat) !== null;
    },
    {
      message:
        'propertyData.investmentStrategy must be a canonical strategy (buy_hold | brrrr | house_hack) or a recognized alias',
    }
  ),
  marketData: ObjectShapeSchema,
  assumptions: ObjectShapeSchema,

  // Outputs
  //
  // Task #41 deferred-Tier-1 note (2026-06-13): the strict shapes from
  // analysisShapes.ts (MetricsShape / MonthlyAnalysisShape /
  // LongTermAnalysisShape) are intentionally NOT applied here yet.
  // Switching to them rejects ~22 existing test fixtures that don't
  // carry every load-bearing field. Tier 2 (materializer fix) closes
  // the user-visible bug class on its own; Tier 1's write-boundary
  // enforcement is deferred to a follow-up commit that also updates
  // those fixtures.
  //
  // The strict shapes are still load-bearing for the READ side: the
  // materializer (dealMaterializationService.projectAnalysis) parses
  // against them tolerantly via safeParseShape. If a substrate event
  // is missing fields, materializer logs and falls back — no crash.
  metrics: ObjectShapeSchema,
  monthlyAnalysis: ObjectShapeSchema,
  longTermAnalysis: ObjectShapeSchema,
  walkAwayPrice: z.number().finite(),

  // Provenance / observability
  enrichmentSource: EnrichmentSourceSchema,
  enrichmentCacheHit: z.boolean(),
  engineVersion: z.string().min(1),
  computeTimeMs: z.number().nonnegative(),

  // Day 11h (Task #13, 2026-05-20): canonical property identity, stamped at
  // write time from propertyData.propertyAddress. Lets the scenario fetch
  // query events by (userId, canonicalAddressKey) directly — the durable,
  // immutability-safe bridge to the Deal — instead of recomputing the key
  // from the address on every read. Optional: pre-stamp/legacy events lack
  // it (fetch falls back to recompute for those).
  canonicalAddressKey: z.string().optional(),

  // Issue #205 (2026-06-25) — strategy-specific engine output.
  // For BRRRR deals, this carries the BRRRRAnalyzer's full output:
  // capitalRecovery (capitalRecoveryRate, capitalRemaining, infiniteReturn),
  // postRefinanceMetrics (monthlyCashFlow, cashOnCashReturn, DSCR),
  // rule70Check (meets70Rule), exitScenarios, etc. Engine writes this
  // at `decision.strategySpecific = brrrAnalysis` (engine.ts:2172);
  // score_deal pulls it forward into the AnalysisPayload here, the
  // materializer projects it to Deal.analysis.strategySpecific, and
  // the workspace + chat + PDF all read engine-computed BRRRR numbers
  // instead of inline-derived approximations.
  strategySpecific: ObjectShapeSchema.optional(),
});

/**
 * AnalysisPayload — TypeScript type for AnalysisEvent payload.
 *
 * Declared explicitly (not via z.infer) to preserve deep types on the
 * nested complex objects. Application code that reads an AnalysisEvent
 * payload gets `SFRData | MultiFamilyData` for `propertyData`, not
 * `Record<string, unknown>`.
 *
 * The repository layer (W1-S3) provides typed read methods that cast
 * back to this interface; write-time Zod validation guarantees the shape
 * is correct, so the cast is safe.
 */
export interface AnalysisPayload {
  /** The property being analyzed (SFR or Multi-Family). */
  propertyData: SFRData | MultiFamilyData;

  /** Snapshot of enrichment data (RentCast comps, FRED, Census) at analysis time. */
  marketData: MarketDataResponse;

  /**
   * Snapshot of assumptions used by the engine (vacancy rate, maintenance %,
   * projection years, rent growth, etc.). Existing engine pulls these from
   * propertyData; this field captures the resolved values used for THIS
   * analysis run.
   */
  assumptions: Record<string, unknown>;

  /** All 60+ computed metrics from the engine (SFR or MF flavor). */
  metrics: SFRMetrics | MultiFamilyMetrics;

  /** Monthly cash flow breakdown (income, expenses, net). */
  monthlyAnalysis: Record<string, unknown>;

  /** Multi-year projection (yearly cash flow, equity, exit analysis, IRR). */
  longTermAnalysis: Record<string, unknown>;

  /** Walk-away price (max acceptable purchase price for this deal). */
  walkAwayPrice: number;

  /** Which external data sources contributed (or 'fallback' if all failed). */
  enrichmentSource: EnrichmentSource;

  /** True if any enrichment hit the MongoDB cache (vs. fresh API call). */
  enrichmentCacheHit: boolean;

  /** Engine version string (e.g., 'v3.0', 'v3.1'). Tracks engine evolution. */
  engineVersion: string;

  /** Time spent computing the analysis (ms). Performance observability. */
  computeTimeMs: number;

  /**
   * Canonical property key (Task #13, 2026-05-20) — `(userId,
   * canonicalAddressKey)` is the durable substrate↔Deal bridge. Stamped at
   * write time from propertyData.propertyAddress. Optional for legacy events.
   */
  canonicalAddressKey?: string;

  /**
   * Issue #205 (2026-06-25) — strategy-specific engine output. For BRRRR
   * deals, the BRRRRAnalyzer's full output (capitalRecovery, postRefinance
   * Metrics, rule70Check, exitScenarios). For buy-hold this is undefined.
   * Engine writes at `decision.strategySpecific`; score_deal forwards it
   * here; materializer projects to Deal.analysis.strategySpecific.
   */
  strategySpecific?: Record<string, unknown>;
}

// ===== Mongoose discriminator schema =====

const analysisEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

/**
 * AnalysisEventModel — Mongoose model for AnalysisEvents.
 *
 * Registered as a discriminator on BaseEventModel with discriminator value
 * `'analysis'`. All AnalysisEvents stored in the single `events` collection.
 *
 * Append-only enforcement (per BaseEvent.ts) inherits to this discriminator.
 */
export const AnalysisEventModel = BaseEventModel.discriminator(
  'analysis',
  analysisEventSchema
);
