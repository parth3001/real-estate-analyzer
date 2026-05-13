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
 * Default adapter — thin shim over the legacy engine. The engine itself
 * is untouched per the user directive 2026-05-12.
 */
export const defaultEngineAdapter: ScoringEngineAdapter = {
  async generateDecision(args) {
    const engine = new InvestmentDecisionEngine();
    // The legacy engine's signature is positional + has more knobs we
    // don't expose at this layer (enhancedGoals, skipEnhancements). We
    // pass through the documented inputs and let internal defaults
    // handle the rest — strangler-fig respect.
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

const UserContextZodSchema = z
  .object({
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
  })
  .strict();

export const ScoreDealInputSchema = z.object({
  /** Property under analysis (SFR or MF). */
  propertyData: ObjectShape,

  /** Already-computed analysis (from compute_analysis tool or legacy analyzer). */
  analysisResult: z.object({
    metrics: ObjectShape,
    monthlyAnalysis: ObjectShape,
    longTermAnalysis: ObjectShape,
  }),

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
  dealId: z.union([z.instanceof(Types.ObjectId), z.string()]).optional(),

  /** Provenance for the substrate AnalysisEvent. */
  enrichmentSource: EnrichmentSourceSchema.optional(),
  enrichmentCacheHit: z.boolean().optional(),

  /** Engine input passthroughs (forwarded to the adapter; not persisted directly). */
  marketIntelligence: z.unknown().optional(),
  predictions: z.unknown().optional(),
});

export type ScoreDealInput = z.infer<typeof ScoreDealInputSchema>;

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

function resolveDealId(
  raw: ScoreDealInput['dealId']
): Types.ObjectId | undefined {
  if (!raw) return undefined;
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  return undefined;
}

function resolveWalkAwayPrice(
  explicit: number | undefined,
  propertyData: Record<string, unknown>
): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  const purchasePrice = (propertyData as { purchasePrice?: unknown }).purchasePrice;
  if (typeof purchasePrice === 'number' && Number.isFinite(purchasePrice)) {
    return purchasePrice * 0.9; // SFR convention: comparables - 10%
  }
  return 0;
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
    // Trust boundary
    const validated = ScoreDealInputSchema.parse(input);

    // Call the engine via the adapter (engine itself is unchanged)
    const startTime = Date.now();
    const engineOutput = await currentAdapter.generateDecision({
      propertyData: validated.propertyData as unknown as SFRData,
      analysisResult: validated.analysisResult as unknown as Parameters<
        ScoringEngineAdapter['generateDecision']
      >[0]['analysisResult'],
      userContext: resolveUserContextForEngine(validated.userContext),
      marketIntelligence: validated.marketIntelligence,
      predictions: validated.predictions,
    });
    const computeTimeMs = Date.now() - startTime;

    // Project to lean substrate payloads
    const propertyDataAsObject = validated.propertyData as Record<string, unknown>;
    const walkAwayPrice = resolveWalkAwayPrice(
      validated.walkAwayPrice,
      propertyDataAsObject
    );

    const { analysisPayload, decisionPayloadDraft } =
      projectEngineOutputToEventPayloads({
        propertyData: validated.propertyData as unknown as SFRData,
        marketData: (validated.marketData ?? {
          lastUpdated: new Date(),
          dataSource: ['fallback'],
        }) as unknown as MarketDataResponse,
        assumptions: validated.assumptions ?? {},
        analysisResult: validated.analysisResult as unknown as {
          metrics: SFRMetrics;
          monthlyAnalysis: Record<string, unknown>;
          longTermAnalysis: Record<string, unknown>;
        },
        engineOutput,
        userContext: validated.userContext,
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
