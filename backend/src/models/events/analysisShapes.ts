/**
 * analysisShapes — Zod schemas for the substrate write boundary.
 *
 * Task #41 (2026-06-13). Architect-level fix for the silent-drop bug
 * class found at the substrate ↔ Deal boundary.
 *
 * THE PROBLEM THESE SCHEMAS REPLACE
 * ──────────────────────────────────
 *
 * Pre-Task-#41, AnalysisPayloadSchema declared its three analysis
 * sub-objects (metrics, monthlyAnalysis, longTermAnalysis) as
 * ObjectShapeSchema — a Zod `z.custom` predicate that only checks
 * "is this an object?". It does NOT validate ANY field shape.
 *
 * The result: every analyzer field that the materializer's read-side
 * cast didn't explicitly name was silently dropped on chat-driven
 * saves. Worse, the cast's expected field NAMES had drifted from what
 * the analyzer actually emits (substrate stores `projections`, cast
 * read `yearlyProjections` — undefined every time). No compile error.
 * No runtime error. Just blank fields on the saved deal page.
 *
 * THE FIX
 * ───────
 *
 * These schemas mirror the analyzer's actual TypeScript types from
 * `types/analysis.ts`. They are the single source of truth for what
 * the substrate write boundary expects:
 *
 *   1. Required fields — the load-bearing ones (NOI, capRate, dscr,
 *      cashFlow, projections, etc.) — fail loudly at write time if
 *      missing.
 *   2. Optional fields — analyzer-specific extras (rehabROI, etc.) —
 *      validated when present.
 *   3. `.passthrough()` — analyzer additions (new metrics shipped
 *      after these schemas were written) flow through without
 *      validation failure. The schema is a floor, not a ceiling.
 *
 * The materializer uses `z.infer<typeof Shape>` types so its
 * field reads are compile-time-checked against the SAME schema that
 * substrate writes validate against. Drift on either side fails the
 * TypeScript build, not silently corrupts data.
 *
 * DESIGN CHOICE: WHY NOT BUILD A FULL TYPED PIPELINE NOW
 * ──────────────────────────────────────────────────────
 *
 * A full v2 architecture would replace the entire analyzer's
 * TypeScript-only output with Zod-derived types throughout, deleting
 * `types/analysis.ts` and the legacy `Deal` model. That's Tier 4 of
 * #41 and is deferred. For v1, these schemas are the load-bearing
 * minimum:
 *   - Tighten the substrate write boundary (this file + AnalysisEvent.ts)
 *   - Tighten the materializer's read side to use these schemas
 *   - That closes the silent-drop bug class
 */

import { z } from 'zod';

// ===== Helpers =====

/**
 * A finite number. NaN and ±Infinity fail. The analyzer should never
 * emit either; if it does, that's a calculation bug we want to surface
 * at write time, not corrupt downstream displays with.
 */
const finiteNumber = z.number().finite();

// ===== Expense breakdown — line items per the analyzer's
// ExpenseBreakdown interface in types/analysis.ts =====

/**
 * Monthly expense breakdown line items. Per the analyzer:
 *   - SFR has propertyTax, insurance, maintenance, propertyManagement,
 *     tenantTurnover, and zeros on the MF-specific fields
 *   - MF has the MF-specific fields populated (utilities,
 *     commonAreaElectricity, landscaping, etc.)
 * Both shapes share the same schema — fields are required when the
 * analyzer always emits them and optional when they're feature-flagged
 * (HOA, landlordUtilities, sfrCapEx — added Jan 2026 for Josh's
 * feature; older analyses may lack them).
 */
export const ExpenseBreakdownShape = z
  .object({
    propertyTax: finiteNumber,
    insurance: finiteNumber,
    maintenance: finiteNumber,
    propertyManagement: finiteNumber,
    vacancy: finiteNumber,
    tenantTurnover: finiteNumber.optional(),
    utilities: finiteNumber,
    commonAreaElectricity: finiteNumber,
    landscaping: finiteNumber,
    waterSewer: finiteNumber,
    garbage: finiteNumber,
    marketingAndAdvertising: finiteNumber,
    repairsAndMaintenance: finiteNumber,
    capEx: finiteNumber,
    other: finiteNumber.optional(),
    // SFR-specific operating expenses (Jan 2026)
    hoa: finiteNumber.optional(),
    landlordUtilities: finiteNumber.optional(),
    sfrCapEx: finiteNumber.optional(),
  })
  .passthrough();

export type ExpenseBreakdown = z.infer<typeof ExpenseBreakdownShape>;

// ===== Monthly analysis — matches MonthlyAnalysis in types/analysis.ts =====

/**
 * Monthly analysis shape. Note that SFRAnalyzer.normalizeOutput LIFTS
 * each breakdown line item up to `expenses.{propertyTax, ...}` at the
 * top level (Issue #1 fix). MF analyzer does NOT lift. So the lifted
 * top-level fields are optional — the breakdown sub-object is the
 * source of truth.
 */
export const MonthlyAnalysisShape = z
  .object({
    income: z
      .object({
        gross: finiteNumber,
        effective: finiteNumber,
      })
      .passthrough(),
    expenses: z
      .object({
        operating: finiteNumber,
        debt: finiteNumber,
        total: finiteNumber,
        breakdown: ExpenseBreakdownShape,
        // Lifted top-level convenience fields (SFR only); MF leaves these absent
        propertyTax: finiteNumber.optional(),
        insurance: finiteNumber.optional(),
        maintenance: finiteNumber.optional(),
        propertyManagement: finiteNumber.optional(),
        vacancy: finiteNumber.optional(),
      })
      .passthrough(),
    cashFlow: finiteNumber,
  })
  .passthrough();

export type MonthlyAnalysisShape_t = z.infer<typeof MonthlyAnalysisShape>;

// ===== Yearly projection — matches YearlyProjection in types/analysis.ts =====

/**
 * One year of the long-term projection. Required fields are the ones
 * BasePropertyAnalyzer.calculateProjections() pushes on every iteration.
 * Optional fields are post-Jan-2026 additions and per-strategy-only
 * fields (BRRRR-specific principal tracking, SFR-specific per-sqft).
 */
export const YearlyProjectionShape = z
  .object({
    year: z.number().int().positive(),
    propertyValue: finiteNumber,
    grossIncome: finiteNumber,
    operatingExpenses: finiteNumber,
    noi: finiteNumber,
    debtService: finiteNumber,
    cashFlow: finiteNumber,
    equity: finiteNumber,
    mortgageBalance: finiteNumber,
    totalReturn: finiteNumber,
    propertyTax: finiteNumber,
    insurance: finiteNumber,
    maintenance: finiteNumber,
    propertyManagement: finiteNumber,
    vacancy: finiteNumber,
    realtorBrokerageFee: finiteNumber,
    grossRent: finiteNumber,
    appreciation: finiteNumber,
    // Optional additions
    principalPaidThisYear: finiteNumber.optional(),
    totalPrincipalPaidToDate: finiteNumber.optional(),
    cashOnCashReturnThisYear: finiteNumber.optional(),
    pricePerSqFtAtThisPoint: finiteNumber.optional(),
    turnoverCosts: finiteNumber.optional(),
    capitalImprovements: finiteNumber.optional(),
  })
  .passthrough();

export type YearlyProjectionShape_t = z.infer<typeof YearlyProjectionShape>;

// ===== Long-term analysis — matches LongTermAnalysis in types/analysis.ts =====

/**
 * NOTE ON FIELD NAME: substrate stores the projection array as
 * `projections` (the analyzer's output field name). The legacy `Deal`
 * model uses `yearlyProjections`. The materializer renames at the
 * projection boundary. Both names exist in `LongTermAnalysis` for
 * "frontend compatibility" — but the canonical, analyzer-emitted name
 * is `projections`.
 */
export const LongTermAnalysisShape = z
  .object({
    projections: z.array(YearlyProjectionShape),
    exitAnalysis: z
      .object({
        projectedSalePrice: finiteNumber,
        sellingCosts: finiteNumber,
        mortgagePayoff: finiteNumber,
        netProceedsFromSale: finiteNumber,
        totalReturn: finiteNumber,
      })
      .passthrough(),
    returns: z
      .object({
        irr: finiteNumber,
        totalCashFlow: finiteNumber,
        totalAppreciation: finiteNumber,
        totalReturn: finiteNumber,
        totalInvestment: finiteNumber,
        totalAdditionalInvestment: finiteNumber.optional(),
      })
      .passthrough(),
    projectionYears: z.number().int().positive(),
  })
  .passthrough();

export type LongTermAnalysisShape_t = z.infer<typeof LongTermAnalysisShape>;

// ===== Metrics — matches CommonMetrics + SFRMetrics in types/analysis.ts =====

/**
 * Metrics common to every property type. The analyzer ALWAYS produces
 * these for any SFR or MF deal (per CommonMetrics interface).
 */
const CommonMetricsShape = z
  .object({
    noi: finiteNumber,
    capRate: finiteNumber,
    cashOnCashReturn: finiteNumber,
    irr: finiteNumber,
    dscr: finiteNumber,
    operatingExpenseRatio: finiteNumber,
    totalInvestment: finiteNumber,
  })
  .passthrough();

/**
 * SFR-specific metrics layered on top of CommonMetrics. The optional
 * fields are conditional on the property strategy (BRRRR-only metrics,
 * sometimes-omitted reserves analysis).
 */
export const SFRMetricsShape = CommonMetricsShape.extend({
  pricePerSqFt: finiteNumber,
  rentPerSqFt: finiteNumber,
  grossRentMultiplier: finiteNumber,
  afterRepairValueRatio: finiteNumber.optional(),
  rehabROI: finiteNumber.optional(),
  breakEvenOccupancy: finiteNumber,
  equityMultiple: finiteNumber,
  onePercentRuleValue: finiteNumber,
  fiftyRuleAnalysis: z.boolean(),
  rentToPriceRatio: finiteNumber,
  pricePerBedroom: finiteNumber,
  debtToIncomeRatio: finiteNumber,
  returnOnImprovements: finiteNumber,
  turnoverCostImpact: finiteNumber,
  debtYield: finiteNumber,
  grossYield: finiteNumber,
  // reservesAnalysis is a nested object; we passthrough it untyped for
  // now (rare optional surface). Add a strict shape if/when it's
  // load-bearing.
});

export type SFRMetricsShape_t = z.infer<typeof SFRMetricsShape>;

/**
 * Multi-family metrics layered on top of CommonMetrics. Per
 * MultiFamilyMetrics in types/analysis.ts.
 */
export const MultiFamilyMetricsShape = CommonMetricsShape.extend({
  pricePerUnit: finiteNumber,
  pricePerSqft: finiteNumber,
  noiPerUnit: finiteNumber,
  averageRentPerUnit: finiteNumber,
  operatingExpensePerUnit: finiteNumber,
  commonAreaExpenseRatio: finiteNumber,
  unitMixEfficiency: finiteNumber,
  economicVacancyRate: finiteNumber,
});

export type MultiFamilyMetricsShape_t = z.infer<typeof MultiFamilyMetricsShape>;

/**
 * Union — substrate accepts SFR OR MF metrics. The discriminator is
 * which shape's required fields are present; both extend CommonMetrics
 * so the seven common fields are always asserted.
 */
export const MetricsShape = z.union([SFRMetricsShape, MultiFamilyMetricsShape]);

export type MetricsShape_t = z.infer<typeof MetricsShape>;

// ===== Safe-parse helpers — used by the materializer =====

/**
 * Tolerant parse for the materializer's read side. Returns the parsed
 * shape on success; returns null + logs a structured warning on
 * failure. Callers fall back to partial projection so a single bad
 * substrate event doesn't break the entire save pipeline.
 *
 * The substrate write boundary uses strict `.parse()` instead (in
 * AnalysisEvent.ts after Task #41 Tier 1 ships). That makes new
 * writes fail loudly, while legacy data that pre-dates the schema
 * still flows through the materializer cleanly.
 */
export function safeParseShape<TOut>(
  schema: z.ZodSchema<TOut>,
  value: unknown,
  context: string,
  onWarn: (msg: string, meta: Record<string, unknown>) => void
): TOut | null {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  onWarn(`[analysisShapes] ${context} schema mismatch`, {
    issues: result.error.issues.slice(0, 5),
  });
  return null;
}
