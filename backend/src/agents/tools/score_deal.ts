/**
 * tool:score_deal — W4-S1 (LOAD-BEARING).
 *
 * The only sanctioned path for the agent mesh to produce a Deal Quality
 * Score. Wraps the existing InvestmentDecisionEngine (unchanged), runs
 * the lean substrate projection, writes AnalysisEvent + DecisionEvent.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2.
 *
 * INVARIANTS
 * ----------
 *
 *   1. invokeLLM: false. Score is 100% deterministic code. The agent
 *      decides WHEN to call this tool; it never produces the score
 *      itself (architecture §1.5).
 *
 *   2. Engine is untouched. The legacy InvestmentDecisionEngine is
 *      wrapped behind a `ScoringEngineAdapter` interface — the default
 *      adapter calls the engine's `generateInvestmentDecision()` and
 *      returns its output as-is. Tests substitute fake adapters; the
 *      engine sees no test code, ever.
 *
 *   3. Lean substrate. AnalysisPayload + DecisionPayload preserve only
 *      what future queries actually need; the engine's full output is
 *      RETURNED to the caller (so the chat surface, results page, PDF
 *      still get everything they need) — but not persisted. See
 *      projectToEventPayloads.ts for the kept-vs-dropped manifest.
 *
 *   4. Two events, in order. AnalysisEvent is written first (so its
 *      _id can be embedded in DecisionPayload.analysisEventId).
 *      DecisionEvent is written second. Failure between the two leaves
 *      an "orphan" AnalysisEvent in substrate — acceptable per
 *      append-only semantics (we can't roll back a write; we just don't
 *      reference it from anywhere). The tool throws and the caller
 *      decides whether to retry the full score_deal call.
 *
 *   5. Same actorType for both writes: 'tool:score_deal'. Makes
 *      substrate joins by actorType trivial during audits.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';
import {
  projectEngineOutputToEventPayloads,
  type EngineOutputForProjection,
} from './projectToEventPayloads';
import type {
  SFRData,
  MultiFamilyData,
  SFRMetrics,
  MultiFamilyMetrics,
} from '../../types/propertyTypes';
import type { MarketDataResponse } from '../../types/marketData';
import type {
  DecisionPayload,
  QualityLabel,
  QualityColor,
} from '../../models/events/DecisionEvent';
import type { EnrichmentSource } from '../../models/events/AnalysisEvent';
import { InvestmentDecisionEngine } from '../../services/investment/investmentDecisionEngine';
import { MFDecisionEngine } from '../../services/investment/MFDecisionEngine';
import { materializeDealFromDecision } from '../../services/dealMaterializationService';
import { logger } from '../../utils/logger';

// ===== Engine adapter =====

/**
 * Adapter interface that score_deal calls. Decouples the tool from the
 * legacy engine's specific constructor / method signature so:
 *   - The engine can evolve without touching the tool
 *   - Tests can substitute a fake adapter without mocking modules
 *
 * The contract: take inputs, return whatever the engine returns. The
 * engine's return type is intentionally `unknown`-ish at this seam
 * because score_deal's projector reads only the fields it needs via
 * `EngineOutputForProjection`.
 */
export interface ScoringEngineAdapter {
  generateDecision(args: {
    propertyData: SFRData | MultiFamilyData;
    analysisResult: {
      metrics: SFRMetrics | MultiFamilyMetrics;
      monthlyAnalysis: Record<string, unknown>;
      longTermAnalysis: Record<string, unknown>;
      [key: string]: unknown;
    };
    userContext: {
      availableCash: number;
      experienceLevel: 'novice' | 'intermediate' | 'experienced';
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      investmentGoals: 'cash_flow' | 'appreciation' | 'balanced';
    };
    marketIntelligence?: unknown;
    predictions?: unknown;
  }): Promise<EngineOutputForProjection & Record<string, unknown>>;
}

/**
 * Default adapter — thin shim over the legacy engines. Both engines are
 * untouched per the user directive 2026-05-12.
 *
 * PROPERTY-TYPE ROUTING
 * ---------------------
 *
 * SFR  → InvestmentDecisionEngine.generateInvestmentDecision()
 *        (which itself routes BRRRR vs buy-hold on investmentStrategy)
 * MF   → MFDecisionEngine.generateDecisionWithAI()
 *        (a separate engine with a different constructor — mirrors how
 *         the legacy controller routes MF, see deals.ts ~line 1106)
 *
 * Both engines return the same decision shape (verdict,
 * professionalAssessment, marketPosition, ...), so the projector
 * downstream doesn't care which produced it.
 */
export const defaultEngineAdapter: ScoringEngineAdapter = {
  async generateDecision(args) {
    const isMF =
      (args.propertyData as { propertyType?: string }).propertyType === 'MF';

    if (isMF) {
      // MF path — mirrors the legacy controller's MF branch. The MF
      // engine wants `metrics` on the analysis; the MF analyzer emits
      // `keyMetrics`, so normalize (same as deals.ts does).
      const ar = args.analysisResult as Record<string, unknown>;
      const normalizedAnalysis = {
        ...ar,
        metrics: ar.metrics ?? ar.keyMetrics,
      };
      const mfEngine = new MFDecisionEngine(
        normalizedAnalysis as unknown as ConstructorParameters<
          typeof MFDecisionEngine
        >[0],
        args.propertyData as MultiFamilyData,
        args.marketIntelligence as
          | ConstructorParameters<typeof MFDecisionEngine>[2]
          | undefined,
        args.predictions,
        args.userContext,
        undefined // enhancedGoals — not exposed at this layer
      );
      const decision = await mfEngine.generateDecisionWithAI();
      return decision as unknown as EngineOutputForProjection &
        Record<string, unknown>;
    }

    // SFR path — the legacy engine's signature is positional + has more
    // knobs we don't expose at this layer (enhancedGoals,
    // skipEnhancements). We pass through the documented inputs and let
    // internal defaults handle the rest — strangler-fig respect.
    const engine = new InvestmentDecisionEngine();
    const decision = await engine.generateInvestmentDecision(
      args.propertyData as SFRData,
      args.analysisResult,
      args.predictions ?? null,
      args.marketIntelligence ?? null,
      args.userContext
    );
    return decision as unknown as EngineOutputForProjection & Record<string, unknown>;
  },
};

// ===== Module-level adapter slot (testability) =====

let currentAdapter: ScoringEngineAdapter = defaultEngineAdapter;

/**
 * Override the engine adapter at module level. Tests use this; production
 * code never should. The override persists until the next call (or
 * resetEngineAdapter()).
 *
 * Module-level injection is intentional here: agent tools are stateless
 * singletons, so per-call DI through ToolContext is overkill. The reset
 * pattern works for the in-process test environment.
 */
export function setEngineAdapter(adapter: ScoringEngineAdapter): void {
  currentAdapter = adapter;
}

export function resetEngineAdapter(): void {
  currentAdapter = defaultEngineAdapter;
}

// ===== Input schema =====

/**
 * Shallow Zod for complex nested objects (per AnalysisEvent.ts pattern).
 * Deep TS types are the source of truth; Zod validates non-null object
 * shape at the trust boundary.
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

/**
 * userContext schema — INTENTIONALLY NOT .strict().
 *
 * This input comes from an LLM (the deal-scoring agent), which has the
 * full recall_user_context output in its context window — profile,
 * recent decisions, overrides. When it assembles `userContext` for
 * score_deal it routinely copies extra profile fields (portfolioSize,
 * primaryMarkets, role, institutionContext, ...). A .strict() schema
 * rejects ANY unknown key, so score_deal would throw on the first
 * attempt and the agent would burn a round-trip recovering.
 *
 * The W5 live test (2026-05-14) showed exactly this: score_deal failed
 * ~50% of the time on first call. Zod's default .strip() behavior
 * (drop unknown keys) is the right posture for LLM-facing tool input —
 * be forgiving of what the model assembles. The downstream projector
 * (projectEngineOutputToEventPayloads) explicitly picks only the 5
 * known persona fields anyway, so extra keys never reach substrate.
 *
 * .strict() stays where it belongs: substrate-WRITE schemas
 * (DecisionPayloadSchema etc.) — there, an unexpected field IS a bug.
 */
const UserContextZodSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  investmentStrategy: z.enum(['cashflow', 'appreciation', 'balanced']).optional(),
  experienceLevel: z
    .enum(['novice', 'intermediate', 'experienced', 'expert'])
    .optional(),
  investorType: z.enum(['retail', 'pro', 'lender', 'consultancy']).optional(),
  primaryGoal: z
    .enum(['cash_flow', 'wealth_building', 'diversification', 'tax_optimization'])
    .optional(),
  availableCash: z.number().nonnegative().optional(),
});

export const ScoreDealInputSchema = z.object({
  /** Property under analysis (SFR or MF). */
  propertyData: ObjectShape,

  /**
   * Already-computed analysis (from compute_analysis tool or legacy
   * analyzer).
   *
   * SHAPE NORMALIZATION
   * -------------------
   *
   * Two valid input shapes are accepted because the codebase has two
   * conflicting "AnalysisResult" definitions:
   *
   *   1. Tool/agent shape (substrate-aligned):
   *        { metrics, monthlyAnalysis, longTermAnalysis }
   *   2. Legacy analyzer shape (BasePropertyAnalyzer.analyze()):
   *        { keyMetrics, monthlyAnalysis, longTermAnalysis, annualAnalysis, ... }
   *
   * Zod accepts EITHER `metrics` OR `keyMetrics` (one is required).
   * `.passthrough()` preserves all extra fields (annualAnalysis,
   * projections, etc.) so the engine adapter sees the full picture.
   * Internal normalization (in execute()) maps keyMetrics → metrics for
   * the substrate projection.
   */
  analysisResult: z
    .object({
      monthlyAnalysis: ObjectShape,
      longTermAnalysis: ObjectShape,
      metrics: ObjectShape.optional(),
      keyMetrics: ObjectShape.optional(),
    })
    .passthrough()
    .refine(
      (v) => !!v.metrics || !!v.keyMetrics,
      { message: 'analysisResult must include either `metrics` or `keyMetrics`' }
    ),

  /**
   * Snapshot of market data used (from enrich_property). Optional in v1
   * because the strangler-fig path may invoke score_deal without prior
   * enrichment; a stub marketData is captured to keep AnalysisPayload valid.
   */
  marketData: ObjectShape.optional(),

  /**
   * Resolved assumptions for this analysis run (vacancy, maintenance,
   * projection years, etc.). Optional; if missing, an empty object is
   * persisted with a warning in the engineVersion tag.
   */
  assumptions: ObjectShape.optional(),

  /** Persona context that drives deterministic weight selection. */
  userContext: UserContextZodSchema.optional(),

  /** Walk-away price. If omitted, defaults to purchasePrice * 0.9 (SFR convention). */
  walkAwayPrice: z.number().finite().optional(),

  /** Cross-event correlation — the deal this analysis is for. */
  // Task #16 (2026-05-23): use objectIdHex so the LLM sees a strict
  // pattern instead of `{}` (the old union collapsed in zod-to-json-schema).
  dealId: objectIdHex.optional(),

  /** Provenance for the substrate AnalysisEvent. */
  enrichmentSource: EnrichmentSourceSchema.optional(),
  enrichmentCacheHit: z.boolean().optional(),

  /** Engine input passthroughs (forwarded to the adapter; not persisted directly). */
  marketIntelligence: z.unknown().optional(),
  predictions: z.unknown().optional(),
});

// Task #16 (2026-05-23): z.input so internal callers can pass ObjectId for dealId.
export type ScoreDealInput = z.input<typeof ScoreDealInputSchema>;

// ===== Output schema =====

/**
 * Output mirrors the agent-mesh §3.2 catalog — the "slim" surface the
 * agent emits — PLUS the event IDs (so the agent can reference the
 * decision in subsequent tool calls) PLUS the full engine output (so
 * the calling surface can render rich UI without re-running the engine).
 */
export const ScoreDealOutputSchema = z.object({
  // Slim surface (agent-mesh §3.2)
  dealQuality: z.number().min(0).max(100),
  qualityLabel: z.enum([
    'Above professional standards',
    'Meets professional standards',
    'Requires optimization',
    'Below professional standards',
  ]),
  qualityColor: z.enum(['green', 'yellow', 'orange', 'red']),
  professionalAssessment: ObjectShape,
  marketPosition: ObjectShape,
  reasoningTrail: z.object({
    primaryInsight: z.string(),
    strategicRecommendations: z.array(z.string()),
    riskMitigation: z.array(z.string()),
    opportunityMaximization: z.array(z.string()),
    keyRisks: z.array(z.string()),
  }),
  criticalFlags: ObjectShape.optional(),

  // Cross-event references (so the agent can recall by id)
  analysisEventId: z.custom<Types.ObjectId>(
    (v) => v instanceof Types.ObjectId,
    { message: 'Expected ObjectId' }
  ),
  decisionEventId: z.custom<Types.ObjectId>(
    (v) => v instanceof Types.ObjectId,
    { message: 'Expected ObjectId' }
  ),

  // Full engine output — NOT persisted, but returned for downstream surfaces.
  fullDecision: z.unknown(),
});

export type ScoreDealOutput = {
  dealQuality: number;
  qualityLabel: QualityLabel;
  qualityColor: QualityColor;
  professionalAssessment: DecisionPayload['professionalAssessment'];
  marketPosition: DecisionPayload['marketPosition'];
  reasoningTrail: DecisionPayload['reasoningTrail'];
  criticalFlags?: DecisionPayload['criticalFlags'];
  analysisEventId: Types.ObjectId;
  decisionEventId: Types.ObjectId;
  fullDecision: EngineOutputForProjection & Record<string, unknown>;
};

// ===== Constants =====

const ENGINE_VERSION = 'v3.0';

/**
 * Default scoring weights — only used as a fallback for the substrate
 * `scoringWeightsUsed` field when the engine output doesn't expose its
 * weights. Engine itself may use strategy-aware variants; this default
 * is the moderate baseline (architecture §1.5).
 */
const DEFAULT_SCORING_WEIGHTS = {
  cashFlow: 0.35,
  irr: 0.25,
  marketStrength: 0.15,
  debtStructure: 0.1,
  exitStrategy: 0.1,
  capRate: 0.03,
  propertyRisk: 0.02,
} as const;

// ===== Helpers =====

function resolveDealId(raw: string | undefined): Types.ObjectId | undefined {
  // Task #16 (2026-05-23): callers pass `validated.dealId` (the POST-parse
  // hex string), so the param type is `string | undefined`. The schema's
  // preprocess + regex have already coerced any internal-caller ObjectId
  // to hex and validated it; this function only needs string→ObjectId.
  if (!raw) return undefined;
  return Types.ObjectId.isValid(raw) ? new Types.ObjectId(raw) : undefined;
}

/**
 * Compute the walk-away price — the engine's max-recommended purchase
 * anchored in property economics, NOT the buyer's offer.
 *
 * Issue #114 (2026-05-17): the old fallback was `purchasePrice * 0.9`,
 * which made walk-away a fixed 11% spread below whatever the user
 * offered — meaningless. User pasted the same property at $223K, $250K,
 * $300K and walk-away "moved with them," each time landing 11% below.
 * That undermines the entire "honest analysis" trust position: the
 * walk-away number is what tells the user whether they're overpaying,
 * and it MUST be independent of their offer.
 *
 * Correct anchor: income approach. Fair value = NOI ÷ target cap rate.
 * The target cap rate ideally comes from market intelligence (market
 * median + risk premium); when that's unavailable we fall back to a
 * conservative 6.5% default (mid-market residential).
 *
 * Resolution order:
 *   1. Caller-provided explicit walkAwayPrice (rare from chat; honored
 *      when present for tests + structured frontend callers)
 *   2. Engine output's marketIntelligence.fairMarketValue.fairValue
 *      if the engine attached it (current engine doesn't expose this
 *      publicly, but we read defensively in case it lands later)
 *   3. NOI / target cap rate computed locally
 *   4. As an absolute last resort, return 0 (let the UI show "—" rather
 *      than a misleading number tied to the offer)
 */
function resolveWalkAwayPrice(
  explicit: number | undefined,
  propertyData: Record<string, unknown>,
  engineOutput: Record<string, unknown>,
  analysisResult: Record<string, unknown>
): number {
  // 1. Explicit override from caller (structured frontend, tests)
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return explicit;
  }

  // 2. Engine-attached fairMarketValue (defensive — current engine
  //    doesn't expose this top-level, but we read it if/when it does)
  const marketIntel = (engineOutput as { marketIntelligence?: unknown })
    .marketIntelligence;
  if (marketIntel && typeof marketIntel === 'object') {
    const fmv = (marketIntel as { fairMarketValue?: { fairValue?: unknown } })
      .fairMarketValue;
    if (fmv && typeof fmv === 'object') {
      const fv = (fmv as { fairValue?: unknown }).fairValue;
      if (typeof fv === 'number' && Number.isFinite(fv) && fv > 0) {
        return Math.round(fv);
      }
    }
  }

  // 3. Income approach — fair value = NOI / target cap rate
  const metrics =
    (analysisResult as { metrics?: Record<string, unknown> }).metrics ??
    (analysisResult as { keyMetrics?: Record<string, unknown> }).keyMetrics;
  const noi = metrics
    ? (metrics as { noi?: unknown; annualNOI?: unknown }).noi ??
      (metrics as { annualNOI?: unknown }).annualNOI
    : undefined;
  if (typeof noi === 'number' && Number.isFinite(noi) && noi > 0) {
    // Target cap rate: prefer engine-derived market median if exposed;
    // fall back to 6.5% (mid-market residential, calibrated against
    // CoStar / Real Capital Analytics SFR benchmarks).
    const engineMarketCapRate = (engineOutput as {
      marketContext?: { marketMedianCapRate?: unknown };
    }).marketContext?.marketMedianCapRate;
    let targetCapRate = 6.5; // default percentage
    if (
      typeof engineMarketCapRate === 'number' &&
      Number.isFinite(engineMarketCapRate) &&
      engineMarketCapRate > 0
    ) {
      // marketMedianCapRate may be expressed as a percentage (6.5) OR
      // a decimal (0.065). Detect and normalize to percentage.
      targetCapRate =
        engineMarketCapRate <= 1 ? engineMarketCapRate * 100 : engineMarketCapRate;
    }
    return Math.round(noi / (targetCapRate / 100));
  }

  // 4. No NOI available — defensive fallback. We deliberately do NOT
  //    use purchasePrice here; tying walk-away to the offer is the
  //    bug we're fixing. Return 0 so the UI can render "—" or hide
  //    the field; better to show nothing than something misleading.
  return 0;
}

/**
 * Normalize the two valid analysisResult shapes into a consistent
 * form: ensure `metrics` is set (using `keyMetrics` as fallback) so
 * the projector and the substrate AnalysisPayload always see the same
 * field name. All other fields pass through unchanged so the engine
 * adapter can still read e.g. `keyMetrics` if it expects to.
 */
function normalizeAnalysisResult(
  analysisResult: Record<string, unknown>
): Record<string, unknown> {
  if (analysisResult.metrics) return analysisResult;
  if (analysisResult.keyMetrics) {
    // Keep keyMetrics for the engine; also expose as metrics for the projector.
    return { ...analysisResult, metrics: analysisResult.keyMetrics };
  }
  return analysisResult;
}

function resolveUserContextForEngine(
  uc: ScoreDealInput['userContext']
): Parameters<ScoringEngineAdapter['generateDecision']>[0]['userContext'] {
  return {
    availableCash: uc?.availableCash ?? 0,
    experienceLevel:
      uc?.experienceLevel === 'expert'
        ? 'experienced'
        : (uc?.experienceLevel ?? 'intermediate'),
    riskTolerance: uc?.riskTolerance ?? 'moderate',
    investmentGoals:
      uc?.primaryGoal === 'cash_flow'
        ? 'cash_flow'
        : uc?.investmentStrategy === 'appreciation'
        ? 'appreciation'
        : 'balanced',
  };
}

// ===== Tool implementation =====

export const scoreDeal: Tool<ScoreDealInput, ScoreDealOutput> = {
  name: 'score_deal',
  description:
    'Produces the deterministic 0-100 Deal Quality Score for a property analysis and persists AnalysisEvent + DecisionEvent to substrate. Wraps the InvestmentDecisionEngine. Never calls an LLM — score is pure code.',
  inputSchema: ScoreDealInputSchema,
  outputSchema: ScoreDealOutputSchema as unknown as z.ZodSchema<ScoreDealOutput>,
  invokeLLM: false,
  sideEffects: [
    { type: 'event', eventType: 'analysis' },
    { type: 'event', eventType: 'decision' },
  ],
  // Two-write transactionally-coupled side effect. No retry — a partial
  // write leaves an orphan AnalysisEvent; the caller decides whether to
  // re-score (which will produce a fresh AnalysisEvent + DecisionEvent
  // pair, by design).
  retrySemantics: NO_RETRY,

  async execute(input: ScoreDealInput, ctx: ToolContext): Promise<ScoreDealOutput> {
    // Trust boundary. Task #16: objectIdHex.preprocess handles ObjectId →
    // hex coercion inside .parse(), so internal callers passing an ObjectId
    // instance for dealId still validate cleanly.
    const validated = ScoreDealInputSchema.parse(input);

    // Normalize analysisResult — handles both shapes (keyMetrics vs metrics)
    // so the engine and the projector see consistent data.
    const normalizedAnalysisResult = normalizeAnalysisResult(
      validated.analysisResult as unknown as Record<string, unknown>
    );

    // Call the engine via the adapter (engine itself is unchanged)
    const startTime = Date.now();
    const engineOutput = await currentAdapter.generateDecision({
      propertyData: validated.propertyData as unknown as SFRData,
      analysisResult: normalizedAnalysisResult as unknown as Parameters<
        ScoringEngineAdapter['generateDecision']
      >[0]['analysisResult'],
      userContext: resolveUserContextForEngine(validated.userContext),
      marketIntelligence: validated.marketIntelligence,
      predictions: validated.predictions,
    });
    const computeTimeMs = Date.now() - startTime;

    // Project to lean substrate payloads.
    // walkAwayPrice now uses the income approach (NOI / target cap rate)
    // instead of the previous purchasePrice * 0.9 offer-anchored fallback
    // — see resolveWalkAwayPrice for the full rationale (Issue #114).
    const propertyDataAsObject = validated.propertyData as Record<string, unknown>;
    const walkAwayPrice = resolveWalkAwayPrice(
      validated.walkAwayPrice,
      propertyDataAsObject,
      engineOutput as unknown as Record<string, unknown>,
      normalizedAnalysisResult as unknown as Record<string, unknown>
    );

    const { analysisPayload, decisionPayloadDraft } =
      projectEngineOutputToEventPayloads({
        propertyData: validated.propertyData as unknown as SFRData,
        marketData: (validated.marketData ?? {
          lastUpdated: new Date(),
          dataSource: ['fallback'],
        }) as unknown as MarketDataResponse,
        assumptions: validated.assumptions ?? {},
        analysisResult: normalizedAnalysisResult as unknown as {
          metrics: SFRMetrics;
          monthlyAnalysis: Record<string, unknown>;
          longTermAnalysis: Record<string, unknown>;
        },
        engineOutput,
        // DecisionPayload's userContext is strict — drop availableCash
        // (it's an engine-call concern, not substrate signal).
        userContext: validated.userContext
          ? {
              riskTolerance: validated.userContext.riskTolerance,
              investmentStrategy: validated.userContext.investmentStrategy,
              experienceLevel: validated.userContext.experienceLevel,
              investorType: validated.userContext.investorType,
              primaryGoal: validated.userContext.primaryGoal,
            }
          : undefined,
        scoringWeightsUsed:
          DEFAULT_SCORING_WEIGHTS as unknown as DecisionPayload['scoringWeightsUsed'],
        dealId: resolveDealId(validated.dealId),
        enrichmentSource: (validated.enrichmentSource ??
          'fallback') as EnrichmentSource,
        enrichmentCacheHit: validated.enrichmentCacheHit ?? false,
        walkAwayPrice,
        engineVersion: ENGINE_VERSION,
        computeTimeMs,
      });

    // Write AnalysisEvent FIRST — its _id seeds DecisionPayload.analysisEventId
    const analysisEventId = await ctx.eventsRepo.writeAnalysisEvent({
      traceId: ctx.traceId,
      actorType: 'tool:score_deal',
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      payload: analysisPayload,
    });

    // Write DecisionEvent SECOND, referencing the AnalysisEvent
    const decisionEventId = await ctx.eventsRepo.writeDecisionEvent({
      traceId: ctx.traceId,
      actorType: 'tool:score_deal',
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      payload: { ...decisionPayloadDraft, analysisEventId },
    });

    // ===== Phase 2 (chat-first strategy, 2026-05-15) =====
    //
    // Materialize a Deal row from the just-written substrate events so
    // /saved-properties (legacy Deal-model UI) shows chat-analyzed deals
    // alongside wizard-analyzed ones.
    //
    // The materialization service short-circuits for anonymous ghost
    // users — they get materialization at claim-time via
    // chatSessionMergeService, not here. For authenticated users it
    // creates (or upserts) a Deal row keyed on (userId, propertyAddress).
    //
    // Best-effort: a materialization failure is logged but never blocks
    // the tool's return. The substrate event IS the source of truth;
    // Deal is a denormalized read model.
    try {
      const result = await materializeDealFromDecision(decisionEventId, ctx.userId);
      if (!result.skipped) {
        logger.info('[score_deal] Deal materialized', {
          traceId: ctx.traceId,
          dealId: result.deal?._id?.toString(),
          created: result.created,
        });
      }
    } catch (materializeErr) {
      logger.warn('[score_deal] Deal materialization failed (non-fatal)', {
        traceId: ctx.traceId,
        decisionEventId: decisionEventId.toHexString(),
        error:
          materializeErr instanceof Error
            ? materializeErr.message
            : String(materializeErr),
      });
    }

    return {
      dealQuality: decisionPayloadDraft.dealQuality,
      qualityLabel: decisionPayloadDraft.qualityLabel,
      qualityColor: decisionPayloadDraft.qualityColor,
      professionalAssessment: decisionPayloadDraft.professionalAssessment,
      marketPosition: decisionPayloadDraft.marketPosition,
      reasoningTrail: decisionPayloadDraft.reasoningTrail,
      criticalFlags: decisionPayloadDraft.criticalFlags,
      analysisEventId,
      decisionEventId,
      fullDecision: engineOutput,
    };
  },
};
