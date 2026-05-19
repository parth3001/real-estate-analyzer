/**
 * DealScoreCard projection — W6-S4.
 *
 * Projects (AnalysisPayload, DecisionPayload) → the wire shape the
 * frontend DealScoreCard component consumes. The projection lives in
 * the orchestrator layer (not in score_deal or the engine) for one
 * reason: the orchestrator is the source-of-truth for the chat's
 * structured-output contract, and the wire shape can evolve
 * independently of the substrate event schemas.
 *
 * The frontend mirrors this shape in services/chatApi.ts as the
 * `data` field of a `structured_output` event with kind = `deal_score_card`.
 */

import type { AnalysisPayload } from '../../models/events/AnalysisEvent';
import type { DecisionPayload } from '../../models/events/DecisionEvent';
import type { SFRData, MultiFamilyData } from '../../types/propertyTypes';
import type { ProfessionalAssessment } from '../../services/investment/BaseDecisionEngine';

// ===== Wire shape =====
//
// Mirrors frontend DealScoreCardProps (frontend/src/components/Chat/DealScoreCard.tsx).
// Field-by-field parity is enforced by tests in dealScoreCardProjection.test.ts.

export interface DealScoreCardWireShape {
  strategy: 'buy_hold' | 'brrrr';
  address: {
    street: string;
    city: string;
    state: string;
  };
  dealQuality: number;
  topFactors: Array<{ label: string; score: number; tail?: string }>;
  walkAwayPrice: number;
  purchasePrice: number;
  nextStep: string;
  assumptions: Array<{ label: string; value?: string; source?: string }>;
  /**
   * 10-year projection milestones (Issue #112, shipped 2026-05-18).
   * Surfaces year-by-year cash flow, property value, and equity buildup
   * — the chart investors actually want to show their partner / lender
   * / spouse. We sample 5 milestone years (1 / 3 / 5 / 7 / 10) rather
   * than all 10 so the inline table stays compact and readable inside
   * the card. Optional: omitted when the engine didn't compute one
   * (e.g., a malformed turn) so the section just doesn't render.
   */
  projection?: Array<{
    year: number;
    cashFlow: number;
    propertyValue: number;
    equity: number;
  }>;
  /**
   * Key metrics block (Day 11d / Issue F, 2026-05-18). The actual
   * financial numbers behind the engine's scoring. Rendered in the
   * email so a CPA / partner / spouse can read the deal AS NUMBERS
   * (e.g., "cash flow -$358/mo, IRR 7.9%") not just AS SCORES
   * (e.g., "cash flow 0/100, IRR 60/100"). The audit-trail surface
   * already shows the actual numbers — this is the same data piped
   * to the email artifact.
   *
   * Percentages are decimal values (e.g., 0.052 for 5.2%) so the
   * frontend / email template formats consistently. Cents are
   * dollars (e.g., -358 for -$358/mo).
   *
   * Optional — older analyses may lack any of these fields. The
   * email template hides individual rows gracefully when undefined.
   */
  keyMetrics?: {
    /** Monthly cash flow in dollars. Negative = bleeds. */
    monthlyCashFlow?: number;
    /** Cap rate as a percentage (e.g., 5.2 for 5.2%). */
    capRate?: number;
    /** 10-year IRR as a percentage (e.g., 7.9 for 7.9%). */
    irr?: number;
    /** Debt-service coverage ratio (e.g., 1.25). */
    dscr?: number;
    /** Cash-on-cash return as a percentage (e.g., -5.89 for -5.89%). */
    cashOnCashReturn?: number;
    /** Annual NOI in dollars. */
    annualNOI?: number;
    /** Total cash investment in dollars (down + closing + reserves). */
    totalInvestment?: number;
    /** Monthly debt service in dollars. */
    monthlyDebtService?: number;
  };
}

// ===== Helpers =====

function isSFR(p: SFRData | MultiFamilyData): p is SFRData {
  return p.propertyType === 'SFR';
}

/**
 * Pick the 3 factor scores most informative for the user. We surface
 * the SPREAD — both very-high and very-low scores carry signal (the
 * card's job is honest analysis, not just positive framing). Sort by
 * distance from 50 (centered baseline) descending.
 */
function pickTopFactors(
  pa: ProfessionalAssessment
): DealScoreCardWireShape['topFactors'] {
  const candidates: Array<{ label: string; score: number }> = [
    { label: 'Cash flow', score: pa.cashFlowScore },
    { label: 'IRR', score: pa.irrScore },
    { label: 'Market strength', score: pa.marketStrengthScore },
    { label: 'Debt structure', score: pa.debtStructureScore },
    { label: 'Exit strategy', score: pa.exitStrategyScore },
    { label: 'Cap rate', score: pa.capRateScore },
    { label: 'Property risk', score: pa.propertyRiskScore },
  ];
  return [...candidates]
    .filter((c) => Number.isFinite(c.score))
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, 3)
    .map((c) => ({ label: c.label, score: Math.round(c.score) }));
}

/**
 * Derive a ONE-sentence concrete next step from the decision payload.
 * Priority order:
 *   1. First strategic recommendation (if present + reasonably short)
 *   2. Primary insight (if it ends in a clear directive sentence)
 *   3. Fallback: "Review the assumptions before making an offer."
 *
 * The card slot is for an actionable next step, not a paragraph — we
 * keep it under ~160 chars.
 */
function deriveNextStep(decision: DecisionPayload): string {
  const MAX_LEN = 160;
  const rec = decision.reasoningTrail.strategicRecommendations?.[0];
  if (rec && rec.trim().length > 0 && rec.length <= MAX_LEN) {
    return rec.trim();
  }
  const insight = decision.reasoningTrail.primaryInsight;
  if (insight && insight.trim().length > 0 && insight.length <= MAX_LEN) {
    return insight.trim();
  }
  return 'Review the assumptions before making an offer.';
}

/**
 * Format a dollar value as a compact display string.
 */
function fmtCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Format a percentage. Input is the percentage value itself (e.g., 25
 * for 25%, NOT 0.25). If a decimal like 0.25 sneaks through we detect
 * and scale — defensive against the historic decimal-vs-percentage bug
 * (see CLAUDE.md "Cap rate scoring formula fix").
 */
function fmtPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.abs(value) <= 1 ? value * 100 : value;
  return `${v.toFixed(1)}%`;
}

/**
 * Derive the "disclose-after" assumption rows. We surface a small,
 * curated set — the values most likely to drive the score, not every
 * input the engine consumed.
 */
function deriveAssumptions(
  analysis: AnalysisPayload,
  property: SFRData | MultiFamilyData
): DealScoreCardWireShape['assumptions'] {
  const out: DealScoreCardWireShape['assumptions'] = [];

  // Down payment — derived from property data
  if (property.purchasePrice > 0 && property.downPayment > 0) {
    const pct = (property.downPayment / property.purchasePrice) * 100;
    out.push({
      label: `${pct.toFixed(0)}% down`,
      value: fmtCurrency(property.downPayment),
    });
  }

  // Mortgage rate
  if (Number.isFinite(property.interestRate)) {
    out.push({
      label: 'Mortgage rate',
      value: fmtPercent(property.interestRate),
      source: 'FRED 30yr avg',
    });
  }

  // Vacancy rate — from assumptions snapshot, falls back to property
  const assumptionVacancy = (analysis.assumptions as { vacancyRate?: number })?.vacancyRate;
  if (assumptionVacancy != null && Number.isFinite(assumptionVacancy)) {
    out.push({
      label: 'Vacancy',
      value: fmtPercent(assumptionVacancy),
    });
  } else if (isSFR(property) && property.longTermAssumptions?.vacancyRate != null) {
    out.push({
      label: 'Vacancy',
      value: fmtPercent(property.longTermAssumptions.vacancyRate),
    });
  }

  // SFR-specific: monthly rent
  if (isSFR(property) && Number.isFinite(property.monthlyRent)) {
    out.push({
      label: 'Monthly rent',
      value: fmtCurrency(property.monthlyRent),
      source: 'RentCast estimate',
    });
  }

  // Property tax rate
  if (Number.isFinite(property.propertyTaxRate)) {
    out.push({
      label: 'Property tax',
      value: fmtPercent(property.propertyTaxRate),
    });
  }

  return out;
}

// ===== Public API =====

/**
 * Sample milestone-year projection rows for the card's projection
 * section (Issue #112). The full yearlyProjections array can have
 * 10-30 entries; the card surface only needs anchor points the user
 * scans at a glance.
 *
 * Milestones: years 1, 3, 5, 7, 10 (or the closest available). If
 * the array is shorter than expected (rare; usually means malformed
 * engine output), we return whatever entries exist up to year 10 —
 * empty array signals "no projection" to the frontend.
 */
function pickProjectionMilestones(
  yearlyProjections: unknown
): NonNullable<DealScoreCardWireShape['projection']> {
  if (!Array.isArray(yearlyProjections)) return [];
  const targetYears = [1, 3, 5, 7, 10];
  const out: NonNullable<DealScoreCardWireShape['projection']> = [];
  for (const target of targetYears) {
    // The yearlyProjections array is typically 0-indexed by year-1.
    // We look up by year field rather than index for defensiveness —
    // some legacy code paths produce sparse arrays.
    const row = (yearlyProjections as Array<Record<string, unknown>>).find(
      (r) => Number(r.year) === target
    );
    if (row) {
      const cashFlow = Number(row.cashFlow);
      const propertyValue = Number(row.propertyValue);
      const equity = Number(row.equity);
      if (
        Number.isFinite(cashFlow) &&
        Number.isFinite(propertyValue) &&
        Number.isFinite(equity)
      ) {
        out.push({
          year: target,
          cashFlow: Math.round(cashFlow),
          propertyValue: Math.round(propertyValue),
          equity: Math.round(equity),
        });
      }
    }
  }
  return out;
}

/**
 * Project an analysis + decision pair into the DealScoreCard wire shape.
 *
 * Throws if the inputs are obviously malformed (missing propertyData,
 * missing dealQuality) — the orchestrator catches and degrades to a
 * plain text response in that edge case.
 */
export function projectDealScoreCard(
  analysis: AnalysisPayload,
  decision: DecisionPayload,
  strategy: 'buy_hold' | 'brrrr'
): DealScoreCardWireShape {
  const property = analysis.propertyData;
  if (!property?.propertyAddress) {
    throw new Error('projectDealScoreCard: analysis.propertyData.propertyAddress is required');
  }
  if (!Number.isFinite(decision.dealQuality)) {
    throw new Error('projectDealScoreCard: decision.dealQuality is required');
  }

  const walkAwayPrice =
    decision.marketPosition?.walkAwayPrice ?? analysis.walkAwayPrice ?? 0;

  // Pick milestone projection rows for the card. The full
  // yearlyProjections array (10-30 entries) gets sampled to
  // 5 anchor years for compact display.
  const yearlyProjections =
    (analysis.longTermAnalysis as { yearlyProjections?: unknown } | undefined)
      ?.yearlyProjections ?? null;
  const projection = pickProjectionMilestones(yearlyProjections);

  // Day 11d — Key metrics block (Issue F). The actual financial
  // numbers behind each scoring factor. analysis.metrics has the
  // CommonMetrics shape (noi, capRate, cashOnCashReturn, irr, dscr,
  // totalInvestment); analysis.monthlyAnalysis carries the per-month
  // breakdowns. We pull defensively — older analyses may lack some
  // fields, and the wire shape's `?:` defaults handle absence
  // gracefully downstream.
  // AnalysisPayload exposes `metrics` (CommonMetrics shape) and
  // `monthlyAnalysis` (income/expenses/cashFlow). NOI lives on
  // `metrics.noi`; annualAnalysis isn't part of the substrate payload
  // (per AnalysisEvent.ts — only metrics + monthlyAnalysis +
  // longTermAnalysis are in the schema).
  const metricsAny = (analysis.metrics ?? {}) as Record<string, unknown>;
  const monthlyAny = (analysis.monthlyAnalysis ?? {}) as Record<string, unknown>;
  const numOrUndef = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  const monthlyDebt =
    typeof (monthlyAny.expenses as { debt?: number } | undefined)?.debt === 'number'
      ? (monthlyAny.expenses as { debt: number }).debt
      : undefined;
  const keyMetrics = {
    monthlyCashFlow: numOrUndef(monthlyAny.cashFlow),
    capRate: numOrUndef(metricsAny.capRate),
    irr: numOrUndef(metricsAny.irr),
    dscr: numOrUndef(metricsAny.dscr),
    cashOnCashReturn: numOrUndef(metricsAny.cashOnCashReturn),
    annualNOI: numOrUndef(metricsAny.noi),
    totalInvestment: numOrUndef(metricsAny.totalInvestment),
    monthlyDebtService: monthlyDebt,
  };
  // Only attach if at least one field has data — keeps the wire shape
  // tight and the email template's "render this block" check simple.
  const hasAnyKeyMetric = Object.values(keyMetrics).some(
    (v) => v !== undefined
  );

  return {
    strategy,
    address: {
      street: property.propertyAddress.street ?? '',
      city: property.propertyAddress.city ?? '',
      state: property.propertyAddress.state ?? '',
    },
    dealQuality: Math.round(decision.dealQuality),
    topFactors: pickTopFactors(decision.professionalAssessment),
    walkAwayPrice: Math.round(walkAwayPrice),
    purchasePrice: Math.round(property.purchasePrice),
    nextStep: deriveNextStep(decision),
    assumptions: deriveAssumptions(analysis, property),
    // Only include the projection key when we actually have rows —
    // omitting cleanly is better than an empty array on the wire.
    ...(projection.length > 0 ? { projection } : {}),
    ...(hasAnyKeyMetric ? { keyMetrics } : {}),
  };
}
