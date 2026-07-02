/**
 * savedDealVariants — polymorphic config for the SavedDealHero card.
 *
 * One visual shell (the DealScoreCard), four content variants. The
 * variant is detected from a Deal's `propertyType` + `investmentStrategy`
 * fields and drives:
 *   - The card's caption label ("BRRRR ANALYSIS" / "MULTI-FAMILY · 4 units")
 *   - Which 3 factors render in the "Top factors" section
 *   - Which 3-4 chips appear in the action row below the card
 *
 * Why a config file (not inline JSX):
 *   - Each variant's design decisions live in ONE place. When BRRRR's
 *     factor priorities change ("Capital Recovery is now THE factor"),
 *     it's a 1-line change here, not a search-and-replace across
 *     components.
 *   - Unit-testable. Tests assert "BRRRR variant shows Capital Recovery
 *     first" by reading the config, not by mounting the whole card.
 *   - New variants (commercial later) slot in by adding a config object.
 *
 * Per Issue #117 (UX Designer pass 2026-05-17) — all four variants
 * ship together. Half-supported polymorphism on a saved-deal page is
 * worse than no polymorphism: a user with one BRRRR saved deal gets a
 * broken card on every visit until the variant lands.
 */

// ===== Deal-shape contract =====
//
// The actual Deal type at the model level is huge (60+ optional fields)
// and tightly Mongoose-coupled. This local shape captures only what
// the saved-deal hero needs — kept as a structural type so it accepts
// the API response without forcing a runtime conversion.

export interface SavedDealShape {
  /**
   * Deal Mongo _id. Optional in the type because some callers
   * construct partial SavedDealShape for tests / previews; the real
   * API-returned shape always has it. Used by T1 CritiqueCard to
   * fetch `/api/deals/:id/critique`.
   */
  _id?: string;
  propertyType?: string;
  investmentStrategy?: string;
  propertyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  purchasePrice?: number;
  // MF unit count — used in the caption for the MF variant
  totalUnits?: number;
  // Embedded analysis (projected by dealMaterializationService)
  analysis?: {
    keyMetrics?: {
      capRate?: number;
      cashOnCashReturn?: number;
      dscr?: number;
      grossRentMultiplier?: number;
      breakEvenOccupancy?: number;
    };
    monthlyAnalysis?: {
      cashFlow?: number;
    };
    annualAnalysis?: {
      annualNOI?: number;
    };
    longTermAnalysis?: {
      yearlyProjections?: Array<{
        year?: number;
        cashFlow?: number;
        propertyValue?: number;
        equity?: number;
      }>;
    };
    // Materialization embeds investmentDecision here too (Issue #109)
    investmentDecision?: SavedDealDecision;
  };
  // Top-level investmentDecision (chat-first reads here; legacy reads
  // both paths). Issue #109 ensured both stay in sync.
  investmentDecision?: SavedDealDecision;
  // BRRRR-specific block
  brrrr?: {
    rehabBudget?: number;
    afterRepairValue?: number;
    refinanceLTV?: number;
    seasoningPeriod?: number;
  };
}

interface SavedDealDecision {
  score?: number;
  primaryReason?: string;
  professionalAssessment?: {
    dealQuality?: number;
    cashFlowScore?: number;
    irrScore?: number;
    marketStrengthScore?: number;
    debtStructureScore?: number;
    exitStrategyScore?: number;
    capRateScore?: number;
    propertyRiskScore?: number;
  };
}

// ===== Variant detection =====

export type SavedDealVariant =
  | 'sfr_buy_hold'
  | 'sfr_brrrr'
  | 'sfr_house_hack'
  | 'multi_family';

/**
 * Detect the variant from a Deal's propertyType + investmentStrategy.
 *
 * Defaults:
 *   - Unknown propertyType + buy-hold strategy → sfr_buy_hold (safest)
 *   - Anything not MF and not BRRRR/house-hack → sfr_buy_hold
 *   - MF takes precedence (different engine, different metrics)
 *
 * Commercial property types (COMMERCIAL_RETAIL etc.) fall through to
 * sfr_buy_hold until we ship dedicated commercial variants. The
 * factors still render meaningfully (cash flow / IRR / market still
 * apply) even if the LABEL says "Buy & Hold."
 */
export function detectSavedDealVariant(deal: SavedDealShape): SavedDealVariant {
  if (deal.propertyType === 'MF') return 'multi_family';
  if (deal.investmentStrategy === 'brrrr') return 'sfr_brrrr';
  if (deal.investmentStrategy === 'house-hack') return 'sfr_house_hack';
  return 'sfr_buy_hold';
}

// ===== Caption builder =====

export function buildVariantCaption(
  variant: SavedDealVariant,
  deal: SavedDealShape
): string {
  switch (variant) {
    case 'multi_family': {
      const units = deal.totalUnits;
      return units ? `MULTI-FAMILY ANALYSIS · ${units} units` : 'MULTI-FAMILY ANALYSIS';
    }
    case 'sfr_brrrr':
      return 'BRRRR ANALYSIS';
    case 'sfr_house_hack':
      return 'HOUSE HACK ANALYSIS';
    case 'sfr_buy_hold':
    default:
      return 'BUY & HOLD ANALYSIS';
  }
}

// ===== Top-factors selection =====

export interface VariantFactor {
  label: string;
  /** Field path on `professionalAssessment` to read the 0-100 score. */
  scoreField: keyof NonNullable<SavedDealDecision['professionalAssessment']>;
}

/**
 * The 3 factors most users care about for each variant. The legacy
 * scoring engine (and MF engine) populate the same `professionalAssessment`
 * field set today — variant differentiation is purely WHICH THREE we
 * surface in the card.
 *
 * When the engines start emitting strategy-specific factor scores
 * (e.g., a dedicated capitalRecoveryScore for BRRRR, perUnitNOIScore
 * for MF), the scoreField can point at the new field. No card
 * code change.
 */
const VARIANT_FACTORS: Record<SavedDealVariant, VariantFactor[]> = {
  sfr_buy_hold: [
    { label: 'Cash flow', scoreField: 'cashFlowScore' },
    { label: 'IRR', scoreField: 'irrScore' },
    { label: 'Market strength', scoreField: 'marketStrengthScore' },
  ],
  sfr_brrrr: [
    // Issue #213 (2026-06-30) — Prior config used `irrScore` for the
    // top factor, labeled "IRR (post-refi)". The engine INTENTIONALLY
    // sets irrScore=0 for BRRRR (see investmentDecisionEngine.ts:2265
    // "irrScore: 0, // Not applicable for BRRRR"). Rendering 0/100
    // for an intentionally-unset metric was deeply misleading — read
    // to users as "your deal has zero IRR" (catastrophic) instead of
    // "IRR isn't the BRRRR framework's primary metric."
    //
    // Swap to `exitStrategyScore` which the BRRRR engine populates
    // with `brrrAnalysis.scores.capitalRecovery` (see
    // investmentDecisionEngine.ts:2268). That's the RIGHT top-of-funnel
    // BRRRR signal — capital recovery IS the BRRRR thesis.
    { label: 'Capital recovery', scoreField: 'exitStrategyScore' },
    { label: 'Market strength', scoreField: 'marketStrengthScore' },
    { label: 'Debt structure (refi viability)', scoreField: 'debtStructureScore' },
  ],
  sfr_house_hack: [
    { label: 'Cash flow (offset)', scoreField: 'cashFlowScore' },
    { label: 'Market strength', scoreField: 'marketStrengthScore' },
    { label: 'Debt structure', scoreField: 'debtStructureScore' },
  ],
  multi_family: [
    // MF uses the same professionalAssessment shape but the meaning
    // shifts: cashFlow = aggregate (not per-unit), debtStructure
    // weighs DSCR + leverage heavily. Show the three signals an MF
    // underwriter would lead with.
    { label: 'Cash flow', scoreField: 'cashFlowScore' },
    { label: 'Debt structure (DSCR)', scoreField: 'debtStructureScore' },
    { label: 'Market strength', scoreField: 'marketStrengthScore' },
  ],
};

export function getVariantFactors(variant: SavedDealVariant): VariantFactor[] {
  return VARIANT_FACTORS[variant];
}

// ===== Action chips =====

/**
 * Chips below the SavedDealHero. Tap routes the user to /app with the
 * chip text as initialUserInput — the agent picks up the property
 * context from the current chat session (if continuing) or from the
 * chip's natural language ("Stress-test 336 Highland Ridge at 7%").
 *
 * Each chip MUST be something the agent can handle today. Same
 * discipline as the chat-flow chip pools — no dead-end chips that
 * imply unshipped capabilities (see Issues #101, #102, #113).
 */
const VARIANT_CHIPS: Record<SavedDealVariant, string[]> = {
  sfr_buy_hold: [
    'Stress-test this deal at 7% mortgage rates',
    'Show me the 10-year projection',
    'Why this score? Walk me through it',
    'What hold period optimizes after-tax IRR?',
  ],
  sfr_brrrr: [
    'Stress-test ARV at -10%',
    'Show me the capital-recovery timeline',
    'What rehab budget breaks this deal?',
    'Refinance at 7.5% — what changes?',
  ],
  sfr_house_hack: [
    'Move-out scenario: what happens at 100% rented?',
    'Stress-test at 80% rent collection',
    'Tax angle of owner-occupied',
    'How long until I should refinance out of FHA?',
  ],
  multi_family: [
    'Stress-test at 80% occupancy',
    'Show me per-unit cash flow',
    'Loan-sizing at 1.25x DSCR',
    'Compare to MF cap-rate benchmarks',
  ],
};

export function getVariantChips(variant: SavedDealVariant): string[] {
  return VARIANT_CHIPS[variant];
}

// ===== Score + decision data extraction =====
//
// Reads top-level `investmentDecision` FIRST, then falls back to the
// nested `analysis.investmentDecision`.
//
// Why top-level first (Day 11h Stage 2, 2026-05-19):
// The DealMaterializationService writes the freshest decision to the
// top-level path on every projection — including follow-up DecisionEvents
// like "show me 100% cash". The nested path was historically kept in
// sync by Issue #109, but that fix only covered the FIRST projection;
// follow-up projections updated top-level only, leaving nested stale.
// Concrete example: 1105 Daffodil St had top-level dealQuality=28
// (fresh, post-100%-cash follow-up) while nested still showed 81
// (stale, from the original leveraged analysis).
//
// Top-level is canonical. The nested-path fallback is a safety net for
// any Deal documents materialized before Stage 1 ships the schema
// cleanup + backfill. After Stage 1 + backfill complete, the nested
// path will not exist and these fallbacks become dead code (to remove
// in follow-up cleanup).

export function getDealQualityScore(deal: SavedDealShape): number {
  return (
    deal.investmentDecision?.professionalAssessment?.dealQuality ??
    deal.analysis?.investmentDecision?.professionalAssessment?.dealQuality ??
    deal.investmentDecision?.score ??
    deal.analysis?.investmentDecision?.score ??
    0
  );
}

export function getProfessionalAssessment(
  deal: SavedDealShape
): NonNullable<SavedDealDecision['professionalAssessment']> | undefined {
  return (
    deal.investmentDecision?.professionalAssessment ??
    deal.analysis?.investmentDecision?.professionalAssessment
  );
}

export function getPrimaryReason(deal: SavedDealShape): string {
  return (
    deal.investmentDecision?.primaryReason ??
    deal.analysis?.investmentDecision?.primaryReason ??
    ''
  );
}

/**
 * Pick milestone-year projection rows from a saved Deal for the
 * SavedDealHero card. Mirrors the backend projection-milestone
 * sampler in dealScoreCardProjection.ts:
 *   - Targets years 1 / 3 / 5 / 7 / 10
 *   - Looks up by `year` field for defensiveness against sparse arrays
 *   - Returns [] when the data is missing / malformed / has NaN values
 *     — the DealScoreCard hides the section cleanly when projection
 *     is empty
 *
 * Stays in sync with the backend sampler. A future refactor could
 * have the materialization service write the milestone-sampled
 * projection directly to the Deal record so both sides read the
 * same pre-computed array.
 */
export function getProjectionMilestones(
  deal: SavedDealShape
): Array<{ year: number; cashFlow: number; propertyValue: number; equity: number }> {
  const rows = deal.analysis?.longTermAnalysis?.yearlyProjections;
  if (!Array.isArray(rows)) return [];
  const targetYears = [1, 3, 5, 7, 10];
  const out: Array<{ year: number; cashFlow: number; propertyValue: number; equity: number }> = [];
  for (const target of targetYears) {
    const row = rows.find((r) => Number(r?.year) === target);
    if (!row) continue;
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
  return out;
}
