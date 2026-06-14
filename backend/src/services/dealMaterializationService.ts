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
import type { IDeal, Analysis } from '../models/Deal';
import { DealModel as Deal } from '../models/Deal';
import { User } from '../models/User';
import { buildCanonicalAddressKey } from '../utils/canonicalAddressKey';
import { eventsRepositoryReads } from '../repositories/EventsRepositoryReads';
import type { AnalysisPayload } from '../models/events/AnalysisEvent';
import {
  MonthlyAnalysisShape,
  MetricsShape,
  LongTermAnalysisShape,
  safeParseShape,
} from '../models/events/analysisShapes';
import type { DecisionPayload } from '../models/events/DecisionEvent';
import { DecisionEventModel } from '../models/events/DecisionEvent';
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

// Day 11h (2026-05-20, Task #2): the local addressFingerprint helper was
// removed. Deal dedup now uses buildCanonicalAddressKey (utils/) — the SAME
// canonical key DealLicense uses — so Deal identity == License identity ==
// one canonical property. The old fingerprint was also dead code in the
// query path (only ever logged), which is how duplicate Deals slipped
// through on address-string variance ("Daffodil St" vs "Daffodil Drive").

// Task #20: delegate to the property-type registry's shared isSFR. Keeping
// the local re-export so call sites in this file stay unchanged.
import { isSFR as _registryIsSFR } from './propertyType/registry';
function isSFR(p: SFRData | MultiFamilyData): p is SFRData {
  return _registryIsSFR(p);
}

/**
 * Map the engine's verdict string (legacy 'BUY' | 'PASS' | 'NEGOTIATE' |
 * 'CAUTION') from DecisionPayload's qualityLabel + dealQuality. The
 * substrate stores qualityLabel ("Above professional standards", etc.)
 * because the public-facing UI uses non-directive language per architecture
 * §1.5. The legacy Deal model still has a `verdict` field consumed by old
 * code paths; we synthesize it from the score.
 */
export function deriveVerdict(dealQuality: number): InvestmentVerdict {
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
 * Day 11h (2026-05-20, decision 1b): this is no longer called at WRITE
 * time. The Deal no longer stores investmentDecision in either location —
 * the score lives solely in the substrate DecisionEvent. This function is
 * now the READ-TIME assembler: the GET /deals endpoints import it to shape
 * an investmentDecision object from the DecisionEvent that
 * latestDecisionEventId points to, so the frontend keeps reading a
 * top-level `investmentDecision` that is always single-source and can
 * never diverge.
 */
export function buildInvestmentDecision(
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
 * READ-TIME decision assembler (Day 11h, decision 1b — the GET-endpoint
 * bridge). Given a Deal's latestDecisionEventId, load the DecisionEvent and
 * shape an investmentDecision from it. This is the SINGLE source of truth
 * for a 2.0 deal's score: it returns exactly what the engine computed and
 * recorded in the immutable event, so the displayed score can never diverge
 * from the engine's output.
 *
 * Returns null if the event is missing — caller falls back to any stored
 * legacy decision (legacy wizard deals have no latestDecisionEventId and
 * keep their stored analysis.investmentDecision untouched).
 */
export async function assembleDecisionFromEvent(
  decisionEventId: Types.ObjectId | string
): Promise<NonNullable<Analysis['investmentDecision']> | null> {
  const event = await DecisionEventModel.findById(decisionEventId).lean();
  if (!event) return null;
  const dp = (event as unknown as { payload: DecisionPayload }).payload;
  const verdict = deriveVerdict(dp.dealQuality);
  const pa = dp.professionalAssessment as ProfessionalAssessment;
  return buildInvestmentDecision(dp, verdict, pa);
}

/**
 * Batch version for list endpoints (getAllDeals) — ONE query for N events
 * instead of N round-trips. Returns a map of decisionEventId → assembled
 * investmentDecision.
 */
export async function assembleDecisionsForEvents(
  decisionEventIds: (Types.ObjectId | string)[]
): Promise<Map<string, NonNullable<Analysis['investmentDecision']>>> {
  const result = new Map<string, NonNullable<Analysis['investmentDecision']>>();
  if (decisionEventIds.length === 0) return result;
  const events = await DecisionEventModel.find({
    _id: { $in: decisionEventIds },
  }).lean();
  for (const event of events) {
    const dp = (event as unknown as { payload: DecisionPayload }).payload;
    const verdict = deriveVerdict(dp.dealQuality);
    const pa = dp.professionalAssessment as ProfessionalAssessment;
    result.set(
      String((event as { _id: unknown })._id),
      buildInvestmentDecision(dp, verdict, pa)
    );
  }
  return result;
}

/**
 * Project substrate AnalysisPayload (monthlyAnalysis + longTermAnalysis
 * + metrics) into the Deal model's Analysis shape.
 *
 * Task #41 (2026-06-13) — architectural fix, Option B (strict).
 *
 * BUG THIS REPLACES
 * ─────────────────
 *
 * The previous version was a hand-curated allowlist that explicitly
 * named ~7 fields from the analyzer's 23+ metric output and dropped
 * every other field silently. It also had five field-name mismatches
 * that produced `undefined` writes — most notably `lt.yearlyProjections`
 * reading what the substrate stores as `lt.projections` (the Task #32
 * sparse-projection bug). Object.assign downstream OVERWROTE any prior
 * good data with the undefined shape.
 *
 * Result: chat-driven saves silently dropped IRR, GRM, OER,
 * pricePerSqFt, rentPerSqFt, breakEvenOccupancy, equityMultiple,
 * onePercentRuleValue, debtToIncomeRatio, and (depending on prior Deal
 * state) the entire 10-year projection. The pricing page promise of
 * "28+ professional metrics" was structurally unfulfillable.
 *
 * FIX SHAPE
 * ─────────
 *
 * The substrate's analysis sub-objects are parsed via the strict Zod
 * schemas in `analysisShapes.ts` (whose types are derived via
 * `z.infer` from the same source-of-truth schemas). Parsed data is
 * fully typed — no `Record<string, unknown>`, no `num()` helpers, no
 * cast escape hatches. Field-name renames are explicit and listed
 * below. Adding a new analyzer metric to the Deal requires adding a
 * single line here, against typed parsed data — TypeScript catches
 * drift at build time.
 *
 * Tolerant parse semantics: if a substrate event predates Task #41's
 * tightened write schema, parse may fail. The materializer logs the
 * mismatch and falls back to undefined for the affected sub-object
 * (no crash, no data corruption — just partial projection). New
 * writes go through the tightened AnalysisPayloadSchema which rejects
 * malformed substrate writes at the source.
 *
 * RENAMES (substrate → Deal)
 * ──────────────────────────
 *
 *   longTermAnalysis.projections           → longTermAnalysis.yearlyProjections
 *   metrics.noi                            → annualAnalysis.annualNOI
 *   metrics.pricePerSqFt                   → keyMetrics.pricePerSqFtAtPurchase
 *   metrics.rentPerSqFt                    → keyMetrics.avgRentPerSqFt
 *   metrics.operatingExpenseRatio          → keyMetrics.expenseRatio
 *   monthlyAnalysis.expenses.debt × 12     → annualAnalysis.annualDebtService
 *   monthlyAnalysis.income.effective × 12  → annualAnalysis.effectiveGrossIncome
 *
 * Every other field passes through with the same name on both sides.
 */
function projectAnalysis(ap: AnalysisPayload): Analysis {
  const warn = (msg: string, meta: Record<string, unknown>) =>
    logger.warn(msg, meta);

  // Strict-but-tolerant parse: validate every sub-object against its
  // schema, log on mismatch, and return null so the projection
  // continues with undefined for that surface. This is the v1
  // safety-belt before Tier 1 (substrate-write boundary tightening)
  // makes mismatch impossible.
  const monthly = safeParseShape(
    MonthlyAnalysisShape,
    ap.monthlyAnalysis,
    'monthlyAnalysis',
    warn
  );
  const metrics = safeParseShape(
    MetricsShape,
    ap.metrics,
    'metrics',
    warn
  );
  const lt = safeParseShape(
    LongTermAnalysisShape,
    ap.longTermAnalysis,
    'longTermAnalysis',
    warn
  );

  // ===== Monthly expenses =====
  // Source-of-truth is the breakdown sub-object (analyzer always
  // populates it). SFRAnalyzer.normalizeOutput ALSO lifts each line
  // item to expenses.{X} as a convenience for legacy consumers; we
  // don't need that path here because we're reading from breakdown.
  const monthlyExpenses = monthly
    ? {
        propertyTax: monthly.expenses.breakdown.propertyTax,
        insurance: monthly.expenses.breakdown.insurance,
        maintenance: monthly.expenses.breakdown.maintenance,
        propertyManagement: monthly.expenses.breakdown.propertyManagement,
        vacancy: monthly.expenses.breakdown.vacancy,
        tenantTurnover: monthly.expenses.breakdown.tenantTurnover,
        total: monthly.expenses.total,
      }
    : {};

  const monthlyIncome = monthly
    ? { gross: monthly.income.gross, effective: monthly.income.effective }
    : {};

  // ===== Annual derivations =====
  // Substrate doesn't store annualAnalysis directly — derive from
  // monthly × 12 OR pull from metrics for fields that live there
  // (NOI lives on metrics; the rest derive from monthly).
  const annualAnalysis = {
    dscr: metrics?.dscr,
    cashOnCashReturn: metrics?.cashOnCashReturn,
    capRate: metrics?.capRate,
    totalInvestment: metrics?.totalInvestment,
    annualNOI: metrics?.noi,
    annualDebtService: monthly ? monthly.expenses.debt * 12 : undefined,
    effectiveGrossIncome: monthly ? monthly.income.effective * 12 : undefined,
  };

  // ===== Long-term analysis — THE RENAME =====
  // Substrate's `projections` (analyzer's name) maps to Deal's
  // `projections` (Mongoose schema name at Deal.ts line 653).
  //
  // NOTE: the TypeScript interface for `Analysis` at Deal.ts:68 says
  // `yearlyProjections` — but that name does NOT match the runtime
  // Mongoose schema at line 653 which uses `projections`. Mongoose's
  // strict mode strips the `yearlyProjections` field on save, which
  // was a contributing factor to Task #32's sparse-projection
  // symptom. The materializer writes to the Mongoose-schema name; the
  // TS interface should be corrected in a follow-up commit (Task #32
  // closure work). We cast through unknown because of the TS/runtime
  // mismatch.
  const longTermAnalysis = {
    projections: lt?.projections,
    projectionYears: lt?.projectionYears,
    returns: lt?.returns,
    exitAnalysis: lt?.exitAnalysis,
  } as unknown as Analysis['longTermAnalysis'];

  // ===== Key metrics — full passthrough + renames =====
  // ARCHITECTURAL POINT: every analyzer-produced metric maps to its
  // Deal field here. Renames are explicit. Adding a new metric to the
  // analyzer requires adding ONE line here; the strict schema in
  // analysisShapes.ts will surface the new field at build time once
  // it's added to the relevant Shape.
  //
  // The narrowing pattern: SFRMetricsShape and MultiFamilyMetricsShape
  // share CommonMetrics. SFR-only fields are read via optional chain
  // on the union — if metrics parsed as MF, the SFR-only fields are
  // undefined and don't surface on the Deal, which is correct.
  type SfrUnion =
    | (typeof metrics & { pricePerSqFt: number; rentPerSqFt: number })
    | null;
  const m = metrics as SfrUnion;

  const keyMetrics: Analysis['keyMetrics'] = {
    capRate: metrics?.capRate,
    cashOnCashReturn: metrics?.cashOnCashReturn,
    dscr: metrics?.dscr,
    grossRentMultiplier: m && 'grossRentMultiplier' in m
      ? (m as { grossRentMultiplier?: number }).grossRentMultiplier
      : undefined,
    breakEvenOccupancy: m && 'breakEvenOccupancy' in m
      ? (m as { breakEvenOccupancy?: number }).breakEvenOccupancy
      : undefined,
    equityMultiple: m && 'equityMultiple' in m
      ? (m as { equityMultiple?: number }).equityMultiple
      : undefined,
    onePercentRuleValue: m && 'onePercentRuleValue' in m
      ? (m as { onePercentRuleValue?: number }).onePercentRuleValue
      : undefined,
    fiftyRuleAnalysis: m && 'fiftyRuleAnalysis' in m
      ? (m as { fiftyRuleAnalysis?: boolean }).fiftyRuleAnalysis
      : undefined,
    rentToPriceRatio: m && 'rentToPriceRatio' in m
      ? (m as { rentToPriceRatio?: number }).rentToPriceRatio
      : undefined,
    pricePerBedroom: m && 'pricePerBedroom' in m
      ? (m as { pricePerBedroom?: number }).pricePerBedroom
      : undefined,
    debtToIncomeRatio: m && 'debtToIncomeRatio' in m
      ? (m as { debtToIncomeRatio?: number }).debtToIncomeRatio
      : undefined,
    returnOnImprovements: m && 'returnOnImprovements' in m
      ? (m as { returnOnImprovements?: number }).returnOnImprovements
      : undefined,
    turnoverCostImpact: m && 'turnoverCostImpact' in m
      ? (m as { turnoverCostImpact?: number }).turnoverCostImpact
      : undefined,
    // Renames (substrate → Deal field name)
    pricePerSqFtAtPurchase: m && 'pricePerSqFt' in m
      ? (m as { pricePerSqFt?: number }).pricePerSqFt
      : undefined,
    avgRentPerSqFt: m && 'rentPerSqFt' in m
      ? (m as { rentPerSqFt?: number }).rentPerSqFt
      : undefined,
    expenseRatio: metrics?.operatingExpenseRatio,
  };

  return {
    // Day 11h (Task #11, 2026-05-20): walkAwayPrice projection (was
    // historically dropped; fixed in #11).
    walkAwayPrice: (ap as { walkAwayPrice?: number }).walkAwayPrice,
    monthlyAnalysis: {
      expenses: monthlyExpenses,
      income: monthlyIncome,
      cashFlow: monthly?.cashFlow,
    },
    annualAnalysis,
    longTermAnalysis,
    keyMetrics,
    // AI insights left empty — substrate doesn't carry the legacy
    // aiInsights shape. The chat surface's reasoningTrail lives on
    // DecisionPayload and surfaces via DealScoreCard, not via Deal.aiInsights.
    aiInsights: undefined,
    // Day 11h (2026-05-20, decision 1b): Deal.analysis now stores ONLY the
    // math (cash flow, metrics, projections). The investmentDecision
    // (score + factor scores + reasoning) is NO LONGER embedded here — it
    // is derived at READ time from the DecisionEvent that
    // latestDecisionEventId points to (see the GET /deals endpoints, which
    // import buildInvestmentDecision to assemble it). This eliminates the
    // dual-write divergence that caused the two-scores bug: there is now
    // exactly one source of truth for the score — the substrate event.
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

  // Day 11h (2026-05-20, decision 1b): we NO LONGER build or store the
  // investmentDecision here. The score lives solely in the substrate
  // DecisionEvent; the Deal points to it via latestDecisionEventId and the
  // GET endpoints assemble the decision at read time. projectAnalysis now
  // stores only the math.
  const projectedAnalysis = projectAnalysis(analysisPayload);

  // Day 11h (2026-05-20, Task #2): canonical address key — the SAME key
  // DealLicense uses. Aligns Deal identity with License identity (one
  // canonical property = one Deal = one license) and fixes the dedup that
  // previously used exact case/whitespace-sensitive string match, which let
  // duplicate Deals through on RentCast address-string variance.
  const canonicalAddressKey = buildCanonicalAddressKey({
    street: property.propertyAddress.street,
    city: property.propertyAddress.city,
    state: property.propertyAddress.state,
    zipCode: property.propertyAddress.zipCode,
  });

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
    // Day 11h (2026-05-20): canonical address key for dedup + identity
    // alignment with DealLicense.
    canonicalAddressKey,
    // Day 11h (2026-05-20, decision 1b): NO top-level investmentDecision
    // stored. The score is derived at read time from the DecisionEvent
    // that latestDecisionEventId points to. Single source of truth.
  };

  // 4. Upsert by (userId, canonicalAddressKey) — Day 11h Task #2.
  //    Canonical-key match (not exact string) so address-string variance
  //    across chat turns resolves to the SAME Deal instead of spawning
  //    duplicates.
  const existing = await Deal.findOne({
    userId,
    canonicalAddressKey,
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
      canonicalAddressKey,
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
    canonicalAddressKey,
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
