/**
 * dealMaterializationService — Phase 2 of the chat-first strategy.
 *
 * Projects substrate events (AnalysisEvent + DecisionEvent) into a legacy
 * Deal document so the existing `/saved-properties` page can render
 * chat-created deals seamlessly alongside wizard-created deals.
 *
 * THE STRATEGIC ROLE (Marcus + Architect lens, 2026-05-15)
 * ────────────────────────────────────────────────────────
 *
 * The chat surface (W6) persists every analysis as substrate events:
 * AnalysisEvent + DecisionEvent + ConversationEvent + CostEvent. Rich,
 * append-only audit trail. Great for the substrate-native future.
 *
 * The CURRENT UI surfaces — /saved-properties, /portfolio, /pipeline,
 * /dashboard — all read from the legacy `Deal` model. Until those
 * rewrite to substrate-native (Phase 7, deep future), we bridge by
 * materializing a Deal row from each chat analysis.
 *
 * One canonical Deal per (userId, propertyAddress) pair. Multiple chat
 * runs on the same property UPSERT the existing Deal rather than
 * creating duplicates — a user refining assumptions sees ONE deal in
 * their saved list, with the latest analysis attached.
 *
 * INVOCATION POINTS
 * ─────────────────
 *
 *   1. score_deal tool — after a successful chat analysis for an
 *      AUTHENTICATED user, materialize immediately. Anonymous (ghost)
 *      users skip this path; their Deals materialize at claim-time.
 *
 *   2. chatSessionMergeService — after a magic-link claim reassigns the
 *      ghost's events to the real user, iterate the just-claimed
 *      DecisionEvents and materialize each. The user lands on /app
 *      authenticated AND their /saved-properties page lights up with
 *      everything they analyzed pre-signup.
 *
 * IDEMPOTENCE
 * ───────────
 *
 * Safe to call multiple times for the same (decisionEventId, userId):
 *   - First call → creates Deal
 *   - Subsequent calls (e.g., re-claim path) → updates the Deal in-place
 *     via address-matched upsert
 *
 * No duplicate Deal rows for a single property.
 */

import { Types } from 'mongoose';
import type { IDeal, PropertyAddress, Analysis } from '../models/Deal';
import { DealModel as Deal } from '../models/Deal';
import { User } from '../models/User';
import { eventsRepositoryReads } from '../repositories/EventsRepositoryReads';
import type { AnalysisPayload } from '../models/events/AnalysisEvent';
import type { DecisionPayload } from '../models/events/DecisionEvent';
import type { SFRData, MultiFamilyData } from '../types/propertyTypes';
import type {
  ProfessionalAssessment,
  InvestmentVerdict,
} from '../services/investment/BaseDecisionEngine';
import { logger } from '../utils/logger';
import { fireCritiqueOnSave } from '../agents/adversarialCritic/triggerOnSave';

// ===== Result shape =====

export interface MaterializeDealResult {
  /** The persisted Deal document. Null when materialization was SKIPPED. */
  deal: IDeal | null;
  /** True if this call created a new Deal; false if it updated an existing one. */
  created: boolean;
  /**
   * True when the user was anonymous (ghost) at the time of the call
   * and materialization was deliberately skipped. Caller is expected to
   * re-materialize at claim-time when the user becomes authenticated.
   */
  skipped: boolean;
}

// ===== Helpers =====

/**
 * Normalize an address for upsert dedup. Same property typed two
 * different ways ("123 main st" vs "123 Main Street") should resolve
 * to the same Deal, so we lowercase + collapse whitespace + strip
 * trailing punctuation. Imperfect — a future GeoLocation-keyed dedup
 * would be stronger — but good enough at this stage.
 */
function addressFingerprint(addr: PropertyAddress): string {
  const norm = (s: string | undefined): string =>
    (s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  return `${norm(addr.street)}|${norm(addr.city)}|${norm(addr.state)}|${norm(
    addr.zipCode
  )}`;
}

function isSFR(p: SFRData | MultiFamilyData): p is SFRData {
  return p.propertyType === 'SFR';
}

/**
 * Map the engine's verdict string (legacy 'BUY' | 'PASS' | 'NEGOTIATE' |
 * 'CAUTION') from DecisionPayload's qualityLabel + dealQuality. The
 * substrate stores qualityLabel ("Above professional standards", etc.)
 * because the public-facing UI uses non-directive language per architecture
 * §1.5. The legacy Deal model still has a `verdict` field consumed by old
 * code paths; we synthesize it from the score.
 */
function deriveVerdict(dealQuality: number): InvestmentVerdict {
  if (dealQuality >= 80) return 'BUY';
  if (dealQuality >= 65) return 'NEGOTIATE';
  if (dealQuality >= 50) return 'CAUTION';
  return 'PASS';
}

/**
 * Build the `investmentDecision` block shared by both the Deal model's
 * top-level `investmentDecision` AND the nested `analysis.investmentDecision`.
 *
 * Both shapes are identical per /backend/src/models/Deal.ts (Analysis
 * interface line 319, IDeal line 464). The legacy SFRAnalysis components
 * (InvestmentDecisionHero, DealQualityHeader, ProgressiveMetricsSystem,
 * DynamicSliders) read from `analysis.investmentDecision.professionalAssessment.dealQuality`
 * via prop drilling — if it's missing there, every legacy view shows the
 * Deal Quality Score as NaN (Issue #109). Earlier versions of this
 * service wrote the top-level field only and left the nested one empty,
 * which is what produced the NaN bug observed during e2e testing 2026-05-17.
 *
 * Centralizing the constructor here ensures the two locations stay in
 * sync. ANY future field added to the substrate→Deal projection lands
 * in both places automatically.
 */
function buildInvestmentDecision(
  dp: DecisionPayload,
  verdict: InvestmentVerdict,
  pa: ProfessionalAssessment
): NonNullable<Analysis['investmentDecision']> {
  return {
    verdict,
    confidence: dp.confidence,
    score: dp.dealQuality,
    primaryReason: dp.reasoningTrail.primaryInsight,
    secondaryReasons: dp.reasoningTrail.strategicRecommendations,
    keyRisks: dp.reasoningTrail.keyRisks,
    professionalAssessment: {
      dealQuality: pa.dealQuality,
      executionDifficulty: pa.executionDifficulty,
      dataReliability: pa.dataReliability,
      cashFlowScore: pa.cashFlowScore,
      irrScore: pa.irrScore,
      marketStrengthScore: pa.marketStrengthScore,
      debtStructureScore: pa.debtStructureScore,
      exitStrategyScore: pa.exitStrategyScore,
      capRateScore: pa.capRateScore,
      propertyRiskScore: pa.propertyRiskScore,
      primaryInsight: pa.primaryInsight,
      strategicRecommendations: pa.strategicRecommendations,
      riskMitigation: pa.riskMitigation,
      opportunityMaximization: pa.opportunityMaximization,
    },
    // `actionPlan` is required by the Analysis interface (not optional)
    // but the chat flow doesn't produce one yet — default to an empty
    // array so schema validation passes and the legacy view doesn't
    // crash on a missing field.
    actionPlan: [],
  } as NonNullable<Analysis['investmentDecision']>;
}

/**
 * Project substrate AnalysisPayload.monthlyAnalysis + .longTermAnalysis
 * + .metrics into the Deal model's Analysis shape. The substrate stores
 * everything as Record<string, unknown> at the schema level; we cast
 * defensively here.
 */
function projectAnalysis(
  ap: AnalysisPayload,
  dp: DecisionPayload,
  investmentDecision: NonNullable<Analysis['investmentDecision']>
): Analysis {
  // Substrate's nested analysis structures are Record<string, unknown>
  // at the schema level — Mongoose / Zod read paths may surface them as
  // undefined if they were omitted at write time. Default to {} so the
  // field accesses below never throw on optional content.
  const m = (ap.monthlyAnalysis ?? {}) as {
    cashFlow?: number;
    grossIncome?: number;
    effectiveGrossIncome?: number;
    expenses?: Record<string, number | undefined>;
    propertyTax?: number;
    insurance?: number;
    maintenance?: number;
    propertyManagement?: number;
    vacancy?: number;
  };

  const metricsAny = (ap.metrics ?? {}) as unknown as Record<
    string,
    number | undefined
  >;

  const monthlyExpenses = {
    propertyTax: m.expenses?.propertyTax ?? m.propertyTax,
    insurance: m.expenses?.insurance ?? m.insurance,
    maintenance: m.expenses?.maintenance ?? m.maintenance,
    propertyManagement:
      m.expenses?.propertyManagement ?? m.propertyManagement,
    vacancy: m.expenses?.vacancy ?? m.vacancy,
    total: m.expenses?.total,
  };

  const lt = (ap.longTermAnalysis ?? {}) as {
    yearlyProjections?: Analysis['longTermAnalysis']['yearlyProjections'];
    projectionYears?: number;
    returns?: Analysis['longTermAnalysis']['returns'];
    exitAnalysis?: Analysis['longTermAnalysis']['exitAnalysis'];
  };

  return {
    monthlyAnalysis: {
      expenses: monthlyExpenses,
      income: {
        gross: m.grossIncome,
        effective: m.effectiveGrossIncome,
      },
      cashFlow: m.cashFlow,
    },
    annualAnalysis: {
      dscr: metricsAny.dscr,
      cashOnCashReturn: metricsAny.cashOnCashReturn,
      capRate: metricsAny.capRate,
      totalInvestment: metricsAny.totalInvestment,
      annualNOI: metricsAny.noi,
      annualDebtService: metricsAny.annualDebtService,
      effectiveGrossIncome: metricsAny.effectiveGrossIncome,
    },
    longTermAnalysis: {
      yearlyProjections: lt.yearlyProjections,
      projectionYears: lt.projectionYears,
      returns: lt.returns,
      exitAnalysis: lt.exitAnalysis,
    },
    keyMetrics: {
      capRate: metricsAny.capRate,
      cashOnCashReturn: metricsAny.cashOnCashReturn,
      dscr: metricsAny.dscr,
    },
    // AI insights left empty — substrate doesn't carry the legacy
    // aiInsights shape. The chat surface's reasoningTrail lives on
    // DecisionPayload and surfaces via DealScoreCard, not via Deal.aiInsights.
    aiInsights: undefined,
    // Surface the decision payload's reasoning at the Deal level for
    // legacy /saved-properties detail-page consumers.
    investmentDecisionMeta: {
      primaryInsight: dp.reasoningTrail.primaryInsight,
    } as unknown as Analysis['aiInsights'],
    // Embed the full investmentDecision INSIDE the analysis as well —
    // the legacy SFRAnalysis components read the Deal Quality Score
    // via `analysis.investmentDecision.professionalAssessment.dealQuality`
    // (prop-drilled from AnalysisDetails → AnalysisResults → ...).
    // Without this, those views show NaN (Issue #109).
    investmentDecision,
  } as Analysis;
}

/**
 * Strategy normalization. score_deal accepts 'buy_hold' | 'brrrr' (chat
 * convention with underscore). The legacy Deal model uses 'buy-hold' |
 * 'brrrr' | 'house-hack' (hyphenated). We convert.
 */
function normalizeStrategy(
  strategy: 'buy_hold' | 'brrrr' | undefined
): IDeal['investmentStrategy'] {
  if (strategy === 'brrrr') return 'brrrr';
  return 'buy-hold';
}

// ===== Public API =====

/**
 * Materialize (or update) a Deal from a substrate DecisionEvent.
 *
 * Upserts on (userId, normalized propertyAddress). Re-running the chat
 * for the same property updates the same Deal — keeps /saved-properties
 * clean.
 */
export async function materializeDealFromDecision(
  decisionEventId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MaterializeDealResult> {
  // 0. Ghost-user short-circuit. score_deal calls this for EVERY chat
  //    analysis; for anonymous ghosts, we deliberately defer Deal
  //    creation to claim-time (when the user becomes a real, addressable
  //    account). Avoids orphaned Deals under ghost userIds that the user
  //    can never see.
  //
  //    Also short-circuit if the user can't be found — defensive against
  //    test environments that mock identity middleware without seeding
  //    the User collection, and against the race where score_deal runs
  //    after a User was just deleted (e.g., the merge service deleting
  //    the ghost mid-flight).
  const user = await User.findById(userId).select('anonymous').lean();
  if (!user || user.anonymous === true) {
    logger.debug('[dealMaterialization] skipped — ghost or missing user', {
      userId: userId.toHexString(),
      decisionEventId: decisionEventId.toHexString(),
      reason: !user ? 'user_not_found' : 'anonymous',
    });
    return { deal: null, created: false, skipped: true };
  }

  // 1. Load decision + analysis pair via the audit-trail helper
  const bundle = await eventsRepositoryReads.getAuditTrail(decisionEventId);
  if (!bundle.analysis) {
    throw new Error(
      `materializeDealFromDecision: AnalysisEvent missing for decision ${decisionEventId.toHexString()}`
    );
  }
  const analysisPayload = bundle.analysis.payload;
  const decisionPayload = bundle.decision.payload;
  const property = analysisPayload.propertyData;

  // 2. Strategy (defensive read — score_deal's optional extension)
  const propertyDataAny = property as unknown as {
    investmentStrategy?: 'buy_hold' | 'brrrr';
    brrrr?: {
      rehabBudget: number;
      afterRepairValue: number;
      refinanceLTV: number;
      seasoningPeriod: number;
      arvAppraisalConfidence: 'conservative' | 'moderate' | 'aggressive';
      refinanceInterestRate?: number;
    };
  };
  const investmentStrategy = normalizeStrategy(propertyDataAny.investmentStrategy);

  // 3. Build the Partial<IDeal> from substrate
  const propertyName = `${property.propertyAddress.street}, ${property.propertyAddress.city}, ${property.propertyAddress.state}`;
  const verdict = deriveVerdict(decisionPayload.dealQuality);
  const pa = decisionPayload.professionalAssessment as ProfessionalAssessment;
  // Build the investmentDecision block ONCE and embed it in BOTH the
  // Deal's top-level `investmentDecision` AND the nested
  // `analysis.investmentDecision`. Legacy views read from the nested
  // path (Issue #109); chat-first views read the top level.
  const investmentDecision = buildInvestmentDecision(decisionPayload, verdict, pa);
  const projectedAnalysis = projectAnalysis(analysisPayload, decisionPayload, investmentDecision);

  // Typed as a loose record because SFR-specific fields (monthlyRent,
  // bedrooms, etc.) live on ISFRDeal not IDeal. Mongoose validates the
  // shape at save() time per the discriminator's required-when rules.
  const dealFields: Record<string, unknown> = {
    userId: userId as unknown as IDeal['userId'],
    // T1 (2026-05-18): persist the substrate link so the SavedDealHero
    // can fetch critiques + audit trail by DecisionEvent without a
    // userId+address join.
    latestDecisionEventId: decisionEventId,
    propertyName,
    propertyType: property.propertyType,
    propertyAddress: property.propertyAddress,
    purchasePrice: property.purchasePrice,
    downPayment: property.downPayment,
    interestRate: property.interestRate,
    loanTerm: property.loanTerm,
    propertyTaxRate: property.propertyTaxRate,
    insuranceRate: property.insuranceRate,
    propertyManagementRate: property.propertyManagementRate,
    maintenanceCost: property.maintenanceCost,
    yearBuilt: isSFR(property)
      ? property.yearBuilt
      : ('yearBuilt' in property
          ? (property as { yearBuilt?: number }).yearBuilt
          : undefined) ?? new Date().getFullYear(),
    closingCosts: property.closingCosts,
    investmentStrategy,
    // BRRRR-specific block, schema-required when investmentStrategy is
    // 'brrrr'. Pulled from substrate's SFRData extension; defaulted to
    // sensible values when the agent didn't capture full BRRRR detail
    // (rare — score_deal's BRRRR path requires it, but defensive).
    ...(investmentStrategy === 'brrrr'
      ? {
          brrrr: propertyDataAny.brrrr ?? {
            rehabBudget: 0,
            afterRepairValue: property.purchasePrice,
            refinanceLTV: 75,
            seasoningPeriod: 12,
            arvAppraisalConfidence: 'moderate' as const,
          },
        }
      : {}),
    // SFR-specific required fields (schema enforces these when
    // propertyType === 'SFR'). Pulled from SFRData.
    ...(isSFR(property)
      ? {
          monthlyRent: property.monthlyRent,
          squareFootage: property.squareFootage,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          // longTermAssumptions is schema-required. SFRData may carry it;
          // fall back to assumption snapshot from AnalysisPayload, then
          // sane defaults so the schema validation passes.
          longTermAssumptions:
            property.longTermAssumptions ?? {
              projectionYears: 10,
              annualRentIncrease: 3,
              annualPropertyValueIncrease: 3.5,
              inflationRate: 2.5,
              vacancyRate: 5,
              sellingCostsPercentage: 6,
            },
        }
      : {}),
    analysis: projectedAnalysis,
    // Top-level investmentDecision (read by chat-first views); same
    // object as analysis.investmentDecision (read by legacy SFR views)
    // — built once via buildInvestmentDecision().
    investmentDecision,
  };

  // 4. Upsert by (userId, normalized address)
  const fingerprint = addressFingerprint(property.propertyAddress);
  const existing = await Deal.findOne({
    userId,
    'propertyAddress.street': property.propertyAddress.street,
    'propertyAddress.city': property.propertyAddress.city,
    'propertyAddress.state': property.propertyAddress.state,
    'propertyAddress.zipCode': property.propertyAddress.zipCode,
  }).exec();

  if (existing) {
    // Update in place. Mongoose's findOneAndUpdate skips middleware for
    // some operations — using assign + save() gives us full validation.
    Object.assign(existing as unknown as Record<string, unknown>, dealFields);
    await existing.save();
    logger.info('[dealMaterialization] updated existing Deal', {
      dealId: existing._id?.toString(),
      userId: userId.toHexString(),
      decisionEventId: decisionEventId.toHexString(),
      addressFingerprint: fingerprint,
      dealQuality: decisionPayload.dealQuality,
    });
    // T1 (2026-05-18): Fire adversarial critique in background even on
    // updates — re-analysis may have shifted the deal's profile enough
    // to warrant a fresh second opinion. The function is fire-and-
    // forget and cost-cap-aware; no impact on this code path's latency.
    fireCritiqueOnSave({ decisionEventId, userId });
    return { deal: existing, created: false, skipped: false };
  }

  // 5. Create new
  const created = await Deal.create(dealFields as Partial<IDeal>);
  logger.info('[dealMaterialization] created new Deal', {
    dealId: created._id?.toString(),
    userId: userId.toHexString(),
    decisionEventId: decisionEventId.toHexString(),
    addressFingerprint: fingerprint,
    dealQuality: decisionPayload.dealQuality,
  });
  // T1 (2026-05-18): Fire adversarial critique in background. New saves
  // are the primary auto_on_save trigger — every materialized deal gets
  // a 2-persona second opinion regardless of score. Fire-and-forget,
  // bounded by the daily cost cap; no impact on this function's latency.
  fireCritiqueOnSave({ decisionEventId, userId });
  return { deal: created, created: true, skipped: false };
}

/**
 * Bulk-materialize multiple DecisionEvents — used by the
 * chatSessionMergeService claim path which discovers all the just-claimed
 * decisions and materializes each. Order-independent; errors on a single
 * decision are logged but don't fail the batch (the user still gets the
 * deals that DID materialize).
 */
export async function materializeDealsForUser(
  decisionEventIds: Types.ObjectId[],
  userId: Types.ObjectId
): Promise<{
  successCount: number;
  failureCount: number;
  results: MaterializeDealResult[];
}> {
  const results: MaterializeDealResult[] = [];
  let failureCount = 0;
  for (const decisionEventId of decisionEventIds) {
    try {
      const result = await materializeDealFromDecision(decisionEventId, userId);
      results.push(result);
    } catch (err) {
      failureCount++;
      logger.warn('[dealMaterialization] single decision materialization failed', {
        decisionEventId: decisionEventId.toHexString(),
        userId: userId.toHexString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return {
    successCount: results.length,
    failureCount,
    results,
  };
}
