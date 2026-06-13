/**
 * projectToEventPayloads — pure mapper from the legacy engine's sprawling
 * output to lean substrate payloads.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.2 (AnalysisEvent) and §3.3
 * (DecisionEvent). Lean substrate per user directive 2026-05-12:
 *   "Lean substrate writes, zero changes to InvestmentDecisionEngine."
 *
 * WHAT GETS PROJECTED (kept in substrate)
 * ---------------------------------------
 * AnalysisPayload — inputs + outputs needed to replay an analysis:
 *   propertyData, marketData, assumptions, metrics, monthlyAnalysis,
 *   longTermAnalysis, walkAwayPrice, enrichmentSource, enrichmentCacheHit,
 *   engineVersion, computeTimeMs
 *
 * DecisionPayload — score + structured rationale:
 *   dealQuality, qualityLabel, qualityColor, professionalAssessment,
 *   marketPosition, reasoningTrail, confidence, scoringWeightsUsed,
 *   engineVersion, criticalFlags?, userContext?
 *
 * WHAT GETS DROPPED (engine returns it; substrate doesn't store it)
 * ----------------------------------------------------------------
 *   - actionPlan, capitalStrategy, alternativeOptions, timeline
 *   - aiEnhancedContent (presentation artifact; not signal)
 *   - sensitivityAnalysis, taxAnalysis (recomputable, not substrate signal)
 *   - goalContext, portfolioContext (snapshotted in userContext + profile)
 *   - confidenceDescription, primaryReason/secondaryReasons (free text)
 *   - LEGACY verdict (deliberately excluded — substrate is score-only per
 *     architecture §1.5)
 *
 * These remain on the engine's return value (which the tool surfaces back
 * to its caller); they just don't get persisted. If a future query needs
 * one of them, bump eventVersion + extend the schema (events store §9.2).
 */

import type { Types } from 'mongoose';
import type {
  AnalysisPayload,
  EnrichmentSource,
} from '../../models/events/AnalysisEvent';
import type {
  DecisionPayload,
  QualityLabel,
  QualityColor,
} from '../../models/events/DecisionEvent';
import type {
  SFRData,
  MultiFamilyData,
  SFRMetrics,
  MultiFamilyMetrics,
} from '../../types/propertyTypes';
import type { MarketDataResponse } from '../../types/marketData';
import { buildCanonicalAddressKey } from '../../utils/canonicalAddressKey';

// ===== Engine-output shape (what we project FROM) =====

/**
 * The fields of the engine's output that we actually read in the mapper.
 *
 * We deliberately type this narrowly — NOT importing the full legacy
 * `InvestmentDecision` interface — so the projector is decoupled from
 * the engine's evolving surface. If the engine grows new optional
 * fields, the projector doesn't have to change. If it removes one we
 * read here, TS will catch it.
 */
export interface EngineOutputForProjection {
  /** V3.0 professional-calibration breakdown (required for substrate write). */
  professionalAssessment?: {
    dealQuality: number;
    cashFlowScore: number;
    irrScore: number;
    marketStrengthScore: number;
    debtStructureScore: number;
    exitStrategyScore: number;
    capRateScore: number;
    propertyRiskScore: number;
    primaryInsight?: string;
    strategicRecommendations?: string[];
    riskMitigation?: string[];
    opportunityMaximization?: string[];
    [key: string]: unknown; // Engine grows fields; we tolerate them in the input
  };

  /** Engine confidence in the score (0-100). */
  confidence?: number;

  /** Engine's structured market view (legacy field — different from MarketPosition). */
  marketContext?: {
    marketStage?: 'early' | 'mid' | 'late' | 'correction';
    pricingContext?: 'undervalued' | 'fair' | 'overvalued' | 'bubble';
    competitiveIntensity?: 'low' | 'moderate' | 'high' | 'extreme';
    recommendedStrategy?: string;
  };

  /** Engine's top-level rationale (free text — picked up into reasoningTrail). */
  primaryReason?: string;
  secondaryReasons?: string[];
  keyRisks?: string[];
}

// ===== Mapper inputs =====

export interface ProjectionInput {
  // Substrate inputs (what AnalysisPayload needs)
  propertyData: SFRData | MultiFamilyData;
  marketData: MarketDataResponse;
  assumptions: Record<string, unknown>;

  // Analysis result (what AnalysisPayload's output fields need)
  analysisResult: {
    metrics: SFRMetrics | MultiFamilyMetrics;
    monthlyAnalysis: Record<string, unknown>;
    longTermAnalysis: Record<string, unknown>;
  };

  // Engine output (what DecisionPayload needs)
  engineOutput: EngineOutputForProjection;

  // Persona context that drove deterministic weight selection
  userContext?: DecisionPayload['userContext'];

  // Scoring weights actually used (from the engine; passed in by the tool)
  scoringWeightsUsed: DecisionPayload['scoringWeightsUsed'];

  // Optional dealId for cross-event correlation
  dealId?: Types.ObjectId;

  // Provenance
  enrichmentSource: EnrichmentSource;
  enrichmentCacheHit: boolean;
  walkAwayPrice: number;
  engineVersion: string;
  computeTimeMs: number;

  // Score-affecting flags (already computed by the engine — we just persist them)
  criticalFlags?: DecisionPayload['criticalFlags'];
}

/**
 * The mapper's output. The DecisionPayload field is "draft" because it
 * still lacks `analysisEventId` — that comes from writing the
 * AnalysisEvent first. The score_deal tool fills it in.
 */
export interface ProjectionResult {
  analysisPayload: AnalysisPayload;
  decisionPayloadDraft: Omit<DecisionPayload, 'analysisEventId'>;
}

// ===== Quality-label / color derivation =====

/**
 * Derives the substrate qualityLabel from the 0-100 dealQuality score.
 * Bins per events store §3.3 and architecture §1.5 (the
 * deterministic-scoring non-negotiable's display contract).
 */
export function deriveQualityLabel(dealQuality: number): QualityLabel {
  if (dealQuality >= 80) return 'Above professional standards';
  if (dealQuality >= 65) return 'Meets professional standards';
  if (dealQuality >= 50) return 'Requires optimization';
  return 'Below professional standards';
}

/** Same bins, color variant. Used by the surface for visual treatment. */
export function deriveQualityColor(dealQuality: number): QualityColor {
  if (dealQuality >= 80) return 'green';
  if (dealQuality >= 65) return 'yellow';
  if (dealQuality >= 50) return 'orange';
  return 'red';
}

// ===== Market-position synthesis =====

/**
 * Synthesizes a MarketPosition shape from the engine's `marketContext`
 * (legacy field) + a walkAwayPrice supplied by the caller. The
 * MarketPosition shape comes from BaseDecisionEngine; the legacy engine
 * never produced it directly, so we adapt here at the boundary.
 *
 * Defaults are intentional — they're chosen so a deal with NO market
 * data still produces a valid (if cautious) payload rather than
 * throwing. The lean-substrate principle: capture what you have, fall
 * back to neutral for what you don't.
 */
function synthesizeMarketPosition(
  marketContext: EngineOutputForProjection['marketContext'],
  walkAwayPrice: number
): DecisionPayload['marketPosition'] {
  return {
    walkAwayPrice,
    pricingContext: marketContext?.pricingContext ?? 'fair',
    marketStage: marketContext?.marketStage ?? 'mid',
    competitiveIntensity: marketContext?.competitiveIntensity ?? 'moderate',
  } as DecisionPayload['marketPosition'];
}

// ===== Reasoning trail extraction =====

/**
 * Builds the substrate's reasoningTrail from the engine output. Prefers
 * professionalAssessment fields (V3.0 structured) over the legacy
 * primaryReason/secondaryReasons free-text fields.
 */
function extractReasoningTrail(
  engineOutput: EngineOutputForProjection
): DecisionPayload['reasoningTrail'] {
  const pa = engineOutput.professionalAssessment;
  return {
    primaryInsight:
      pa?.primaryInsight ??
      engineOutput.primaryReason ??
      'No primary insight captured by engine.',
    strategicRecommendations:
      pa?.strategicRecommendations ?? engineOutput.secondaryReasons ?? [],
    riskMitigation: pa?.riskMitigation ?? [],
    opportunityMaximization: pa?.opportunityMaximization ?? [],
    keyRisks: engineOutput.keyRisks ?? [],
  };
}

// ===== Canonical key stamping (Task #13) =====

/**
 * Compute the canonical property key from propertyData, guarded against
 * incomplete addresses. Stamped onto BOTH event payloads at write time so
 * the scenario fetch can query by (userId, canonicalAddressKey) directly —
 * the durable, immutability-safe substrate↔Deal bridge. Returns undefined
 * for incomplete addresses (the fetch falls back to recompute for those).
 */
function stampCanonicalKey(
  propertyData: SFRData | MultiFamilyData
): string | undefined {
  const addr = (
    propertyData as {
      propertyAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      };
    }
  ).propertyAddress;
  if (!addr?.street || !addr?.city || !addr?.state) return undefined;
  try {
    return buildCanonicalAddressKey({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
    });
  } catch {
    return undefined;
  }
}

// ===== Main projector =====

/**
 * Project the legacy engine's output into the lean substrate payloads.
 *
 * Throws if the engine output lacks professionalAssessment — the V3.0
 * deterministic-scoring non-negotiable requires it. Older code paths
 * that don't populate it should fail loudly here, not silently write
 * malformed substrate.
 */
export function projectEngineOutputToEventPayloads(
  input: ProjectionInput
): ProjectionResult {
  const pa = input.engineOutput.professionalAssessment;

  if (!pa || typeof pa.dealQuality !== 'number') {
    throw new Error(
      'projectEngineOutputToEventPayloads: engine output is missing ' +
        'professionalAssessment.dealQuality — substrate cannot be written ' +
        'without the V3.0 score. This is a deterministic-scoring ' +
        'non-negotiable (architecture §1.5).'
    );
  }

  // Clamp to [0, 100] defensively. Engine bugs that produce out-of-range
  // values must NOT poison the substrate; the schema would reject them
  // anyway via z.number().min(0).max(100).
  const dealQuality = Math.max(0, Math.min(100, pa.dealQuality));

  // Day 11h (Task #13): stamp the canonical property key on both payloads
  // at write time. Same value on both so scenario grouping is consistent.
  const canonicalAddressKey = stampCanonicalKey(input.propertyData);

  // Task #32 (2026-06-09) — diagnostic for the sparse-projection bug. The
  // saved-deal detail page shows only 2-3 projection rows (vs the 10+ the
  // analyzer pushes) and Years 5/10 lack NOI. Verified the corruption is at
  // substrate write-time, but couldn't pinpoint upstream code path via grep.
  // This log captures the exact shape arriving at the write boundary so the
  // next chat-analyze run tells us in one turn whether projections arrive
  // already sparse (analyzer-side bug) or full (write-time mutation).
  // Remove once root cause is fixed.
  const lt = input.analysisResult.longTermAnalysis as Record<string, unknown> | undefined;
  const ltProjections = Array.isArray(lt?.projections)
    ? (lt.projections as Array<Record<string, unknown>>)
    : null;
  console.log('[Task #32] projectToEventPayloads — projection shape at write boundary:', {
    projectionsCount: ltProjections?.length ?? 0,
    firstRowKeys: ltProjections?.[0] ? Object.keys(ltProjections[0]) : null,
    middleRowKeys:
      ltProjections && ltProjections.length > 2
        ? Object.keys(ltProjections[Math.floor(ltProjections.length / 2)])
        : null,
    lastRowKeys:
      ltProjections && ltProjections.length > 0
        ? Object.keys(ltProjections[ltProjections.length - 1])
        : null,
    projectionYears: lt?.projectionYears,
    assumptionsProjectionYears: (input.assumptions as Record<string, unknown> | undefined)
      ?.projectionYears,
  });

  const analysisPayload: AnalysisPayload = {
    propertyData: input.propertyData,
    marketData: input.marketData,
    assumptions: input.assumptions,
    metrics: input.analysisResult.metrics,
    monthlyAnalysis: input.analysisResult.monthlyAnalysis,
    longTermAnalysis: input.analysisResult.longTermAnalysis,
    walkAwayPrice: input.walkAwayPrice,
    enrichmentSource: input.enrichmentSource,
    enrichmentCacheHit: input.enrichmentCacheHit,
    engineVersion: input.engineVersion,
    computeTimeMs: input.computeTimeMs,
    canonicalAddressKey,
  };

  const decisionPayloadDraft: Omit<DecisionPayload, 'analysisEventId'> = {
    dealId: input.dealId,
    canonicalAddressKey,
    dealQuality,
    qualityLabel: deriveQualityLabel(dealQuality),
    qualityColor: deriveQualityColor(dealQuality),
    professionalAssessment:
      pa as unknown as DecisionPayload['professionalAssessment'],
    marketPosition: synthesizeMarketPosition(
      input.engineOutput.marketContext,
      input.walkAwayPrice
    ),
    reasoningTrail: extractReasoningTrail(input.engineOutput),
    confidence: input.engineOutput.confidence ?? 50,
    scoringWeightsUsed: input.scoringWeightsUsed,
    engineVersion: input.engineVersion,
    criticalFlags: input.criticalFlags,
    userContext: input.userContext,
  };

  return { analysisPayload, decisionPayloadDraft };
}
