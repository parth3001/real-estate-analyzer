/**
 * tool:resolve_property_inputs — W5-Phase1 (chat-flow input gathering).
 *
 * The bridge between "user typed an address + a purchase price" and
 * "the engine needs a complete SFRData with ~20 fields."
 *
 * Per the design conversation 2026-05-14 (Architect + Marcus Chen):
 *
 *   - The ONLY irreducible user input is purchasePrice. Everything else
 *     is knowable (RentCast, FRED, the tax service) or defaultable
 *     (25% down, 30yr term, insurance/closing %, engine assumptions).
 *
 *   - Every field carries PROVENANCE — where it came from. This is the
 *     trust mechanism: the agent surfaces the assumptions, the user
 *     sees exactly what was inferred vs. defaulted, and can override
 *     anything (override regenerates the score via apply_override).
 *
 *   - Two-bucket transparency (Marcus Chen's "confirm what could
 *     embarrass you, disclose what's just housekeeping"):
 *       confirmBeforeScoring  — score-critical + likely-wrong fields
 *                                the agent should confirm with the user
 *                                BEFORE scoring (monthlyRent — RentCast
 *                                estimate, moves cash flow hardest)
 *       discloseAfterScoring  — defaulted-but-usually-fine fields the
 *                                agent discloses AFTER scoring, collapsed
 *
 * DETERMINISTIC. No LLM. Given the same adapter outputs + the same
 * userOverrides, this produces the identical SFRData every time —
 * which is what preserves the deterministic-scoring moat: chat-flow
 * inputs are transparent + overridable + provenance-tracked, not
 * magically identical to wizard inputs.
 *
 * SCOPE: SFR only. Multi-family routes to a separate engine path; the
 * deal-scoring agent handles MF detection separately. This tool
 * rejects propertyType !== 'SFR' with a clear error.
 *
 * EVENTS: none. Like enrich_property + compute_analysis, this is a
 * read/compute tool — it fetches + assembles, it does not write
 * substrate. score_deal (downstream) is what persists.
 */

import { z } from 'zod';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';
import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';
import { marketIntelligenceService } from '../../services/marketIntelligenceService';
import { rentcastService } from '../../services/rentcastService';
import { propertyTaxEstimationService } from '../../services/propertyTaxEstimationService';
import { logger } from '../../utils/logger';

// ===== Provenance taxonomy =====

/**
 * Where a resolved field's value came from. Threaded into the
 * provenance map so the agent can surface it and the substrate can
 * (later) record it for calibration analysis.
 */
export type FieldProvenance =
  | 'user_provided' // user typed it (purchasePrice) or corrected it (userOverrides)
  | 'rentcast_estimate' // RentCast rent/value estimate
  | 'rentcast_property_record' // RentCast property record (beds/baths/sqft/yearBuilt)
  | 'fred_market' // FRED current mortgage rate
  | 'tax_service' // propertyTaxEstimationService
  | 'assumption_default' // our standard default (down %, term, insurance, etc.)
  | 'prior_analysis'; // Day 11b: loaded from a prior AnalysisEvent
//                       (stress-test reproducibility — Issue A fix)

// ===== External-data adapter =====

/**
 * Bundles the three external fetches the resolver needs. Single method
 * (matches the codebase's adapter pattern — see ScoringEngineAdapter,
 * MarketIntelligenceAdapter). Tests substitute a fake; production uses
 * the default which wires the real services.
 *
 * All fields optional — the resolver defends against any source
 * returning nothing and falls back with `assumption_default` provenance.
 */
export interface ResolverExternalData {
  rentEstimate?: number;
  valueEstimate?: number;
  currentMortgageRate?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  effectiveTaxRate?: number; // percentage, e.g. 1.8
  enrichmentSource: string;
}

export interface PropertyResolverAdapter {
  fetchExternalData(input: {
    address: { street: string; city: string; state: string; zipCode: string };
    purchasePrice: number;
  }): Promise<ResolverExternalData>;
}

/**
 * Default adapter — wires marketIntelligenceService (rent + mortgage
 * rate), rentcastService.getEnhancedPropertyDetails (property record),
 * and propertyTaxEstimationService (tax rate). Each fetch is defended:
 * a failure in one source doesn't sink the others — the resolver falls
 * back per-field.
 */
export const defaultPropertyResolverAdapter: PropertyResolverAdapter = {
  async fetchExternalData(input) {
    const addressStr = `${input.address.street}, ${input.address.city}, ${input.address.state} ${input.address.zipCode}`;
    const result: ResolverExternalData = { enrichmentSource: 'composite' };

    // 1. Market data — rent estimate + economic indicators (mortgage rate)
    try {
      const market = await marketIntelligenceService.getComprehensiveMarketData({
        address: addressStr,
        zipCode: input.address.zipCode,
        propertyType: 'SFR',
      } as unknown as Parameters<
        typeof marketIntelligenceService.getComprehensiveMarketData
      >[0]);
      result.rentEstimate = market.property?.rentEstimate;
      result.valueEstimate = market.property?.valueEstimate;
      result.currentMortgageRate = market.economicIndicators?.currentMortgageRate;
    } catch (err) {
      logger.warn('resolve_property_inputs: market data fetch failed', {
        address: addressStr,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 2. Property record — beds/baths/sqft/yearBuilt
    try {
      const details = await rentcastService.getEnhancedPropertyDetails(addressStr);
      if (details?.propertyDetails) {
        result.bedrooms = details.propertyDetails.bedrooms;
        result.bathrooms = details.propertyDetails.bathrooms;
        result.squareFootage = details.propertyDetails.squareFootage;
        result.yearBuilt = details.propertyDetails.yearBuilt;
      }
    } catch (err) {
      logger.warn('resolve_property_inputs: property-record fetch failed', {
        address: addressStr,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 3. Property tax rate
    try {
      const tax = await propertyTaxEstimationService.generatePropertyTaxEstimate({
        address: addressStr,
        purchasePrice: input.purchasePrice,
        zipCode: input.address.zipCode,
        state: input.address.state,
      });
      result.effectiveTaxRate = tax.effectiveTaxRate;
    } catch (err) {
      logger.warn('resolve_property_inputs: tax estimate fetch failed', {
        address: addressStr,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return result;
  },
};

// ===== Module-level adapter slot (testability) =====

let currentResolverAdapter: PropertyResolverAdapter = defaultPropertyResolverAdapter;

export function setPropertyResolverAdapter(adapter: PropertyResolverAdapter): void {
  currentResolverAdapter = adapter;
}

export function resetPropertyResolverAdapter(): void {
  currentResolverAdapter = defaultPropertyResolverAdapter;
}

// ===== Unit-convention defense (2026-07-06) =====

/**
 * Rate fields the engine expects as PERCENTAGES (e.g., 6.5 for 6.5%,
 * 2 for 2%, 0.5 for 0.5%). The LLM occasionally sends decimals
 * (0.065, 0.02) after re-reading the prompt more literally under
 * attention shift from an upstream section. When that happens the
 * engine treats 0.065 as 0.065% and produces analyses that are ~100×
 * too optimistic.
 *
 * We coerce here rather than reject, because rejecting would fail
 * the analysis entirely — the user's stated intent ("6.5% rate") is
 * unambiguous even when the encoding is wrong. Coercion + a loud
 * warning preserves UX while flagging the drift for repair.
 *
 * SAFE THRESHOLDS:
 *   interestRate            valid 1.0-15.0% → any value < 1.0 is a decimal miscoded
 *   propertyTaxRate         valid 0.3-5.0%  → any value < 0.3 is a decimal miscoded
 *                                             (Hawaii is 0.28%, floor a hair above)
 *   insuranceRate           valid 0.2-2.0%  → any value < 0.2 is likely a decimal
 *                                             miscoded (0.5% typical)
 *   propertyManagementRate  valid 5-15%     → any value < 1 is a decimal miscoded
 *   vacancyRate             valid 2-15%     → any value < 1 is a decimal miscoded
 *   refinanceInterestRate   valid 1-15%     → any value < 1 is a decimal miscoded
 *   refinanceLTV            valid 60-100    → any value < 1 is a decimal miscoded
 *
 * Anything under the guard threshold gets multiplied by 100 and
 * logged so we can trace where the drift is coming from.
 */
const PERCENTAGE_FIELDS_GUARDS: Record<
  string,
  { minValid: number; label: string }
> = {
  interestRate: { minValid: 1.0, label: '% (e.g., 6.5 for 6.5%)' },
  propertyTaxRate: { minValid: 0.3, label: '% (e.g., 2 for 2%)' },
  insuranceRate: { minValid: 0.2, label: '% (e.g., 0.5 for 0.5%)' },
  propertyManagementRate: { minValid: 1.0, label: '% (e.g., 8 for 8%)' },
  vacancyRate: { minValid: 1.0, label: '% (e.g., 5 for 5%)' },
  refinanceInterestRate: { minValid: 1.0, label: '% (e.g., 7.5 for 7.5%)' },
  refinanceLTV: { minValid: 1.0, label: '% (e.g., 75 for 75%)' },
};

/**
 * Coerce likely-decimal rate values into percentages with a loud
 * warning. Mutates the input object in place. Returns the number of
 * coercions applied so callers can decide whether to log at the run
 * level too.
 */
function coerceRatePercentagesAndWarn(
  overrides: Record<string, unknown>,
  source: string,
  traceId: string
): number {
  let coercions = 0;
  for (const [field, guard] of Object.entries(PERCENTAGE_FIELDS_GUARDS)) {
    const raw = overrides[field];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    if (raw > 0 && raw < guard.minValid) {
      const corrected = raw * 100;
      logger.warn('resolve_property_inputs: coerced likely-decimal rate to percentage', {
        field,
        source,
        traceId,
        received: raw,
        corrected,
        expectedUnit: guard.label,
      });
      overrides[field] = corrected;
      coercions++;
    }
  }
  return coercions;
}

// ===== Defaults =====

/**
 * Standard assumption defaults — the "housekeeping" bucket. Each is
 * disclosed to the user after scoring and is overridable. These are
 * the chat-flow equivalent of the wizard's pre-filled fields.
 */
const DEFAULTS = {
  /** 25% down — standard investment-property down payment. */
  downPaymentRatio: 0.25,
  /** 30-year fixed — the default loan product. */
  loanTermYears: 30,
  /** 0.5% of value annually — typical landlord insurance. */
  insuranceRatePct: 0.5,
  /** 1% of purchase price annually — common maintenance rule of thumb. */
  maintenanceRatio: 0.01,
  /** 8% of rent — typical third-party PM fee. */
  propertyMgmtRatePct: 8,
  /**
   * Buyer closing costs — 2% of purchase price with a $2,500 floor
   * (Issue #231, 2026-07-07). Prior default was a flat 1.5% ratio,
   * which returned $900 on a $60K BRRRR purchase — half the real
   * market cost. Lender fees, title, inspection, and appraisal are
   * largely FIXED cost floors, not percentage-scaled, so the true
   * distribution has both a percentage AND a floor. Real BRRRR
   * closing on a $60K purchase runs $2,500–$4,000; buy-hold on
   * a $250K purchase runs $5,000. `max(price * ratio, floor)`
   * captures both. Bumping ratio from 1.5% → 2% also brings the
   * higher end of the range in line with BiggerPockets guidance.
   */
  closingCostsRatio: 0.02,
  closingCostsFloor: 2500,
  /** Fallback mortgage rate if FRED is unavailable (current-ish market). */
  fallbackMortgageRate: 7.0,
  /** Fallback tax rate if the tax service is unavailable (matches its own default). */
  fallbackTaxRate: 1.2,
  /** Fallback property-record values when RentCast has no record. */
  fallbackBedrooms: 3,
  fallbackBathrooms: 2,
  fallbackSquareFootage: 1500,
  fallbackYearBuilt: 1990,
} as const;

/** Standard projection assumptions — the engine-assumption bucket. */
const DEFAULT_ASSUMPTIONS: AnalysisAssumptions = {
  projectionYears: 10,
  annualRentIncrease: 3,
  annualExpenseIncrease: 2.5,
  annualPropertyValueIncrease: 3.5,
  sellingCosts: 6,
  vacancyRate: 5,
};

// ===== Input schema =====

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(5),
});

export const ResolvePropertyInputsInputSchema = z.object({
  address: AddressSchema,
  /**
   * Task #15 (2026-05-28): purchasePrice is OPTIONAL when the user gave
   * only an address. The resolver falls back to RentCast's valueEstimate
   * (AVM) so the agent doesn't have to interrupt the conversation asking
   * for a number that's publicly knowable. If RentCast has no AVM for
   * the address either, the resolver throws a clear "specify a price"
   * error the agent surfaces to the user. Provenance is tagged
   * `external_data` when the AVM was used, `user_provided` otherwise.
   */
  purchasePrice: z.number().positive().finite().optional(),
  propertyType: z.enum(['SFR']), // MF is a separate path — see file header
  /**
   * Phase 1 BRRRR (Issue #200 — 2026-06-25): investment strategy controls
   * which decision engine runs. 'buy_hold' (default) uses the standard
   * SFR Buy & Hold engine; 'brrrr' uses the BRRRRAnalyzer which models
   * rehab + cash-out refinance + capital recovery. When 'brrrr', the
   * `brrrr` field below is REQUIRED (rehabBudget + afterRepairValue).
   * Defaults for refi rate / refi LTV / seasoning are applied if not
   * supplied.
   */
  strategy: z.enum(['buy_hold', 'brrrr']).optional(),
  /**
   * Phase 1 BRRRR (Issue #200 — 2026-06-25): BRRRR-specific inputs.
   * rehabBudget + afterRepairValue are USER-CRITICAL (no sane defaults —
   * they reflect the specific deal's rehab scope and projected post-rehab
   * value). refinanceLTV / refinanceInterestRate / seasoningPeriod have
   * institutional defaults (75% / current+2% / 12mo) and the agent should
   * disclose them after scoring.
   */
  brrrr: z
    .object({
      rehabBudget: z.number().positive().finite(),
      afterRepairValue: z.number().positive().finite(),
      refinanceLTV: z.number().positive().max(100).optional(),
      refinanceInterestRate: z.number().positive().finite().optional(),
      seasoningPeriod: z.number().positive().int().optional(),
    })
    .optional(),
  /**
   * User-corrected field values. Anything here overrides the
   * resolved/defaulted value and is tagged 'user_provided' in the
   * provenance map. Keys are SFRData field names (monthlyRent,
   * downPayment, interestRate, etc.).
   */
  userOverrides: z.record(z.string(), z.number()).optional(),
  /**
   * Day 11b (Issue A — stress-test reproducibility fix, 2026-05-18):
   *
   * Optional. When set, the resolver SKIPS all external API calls
   * (RentCast, FRED, tax service) and instead loads the prior
   * AnalysisEvent via this decisionId. Uses the prior propertyData +
   * assumptions verbatim as the base, then applies `userOverrides`
   * on top.
   *
   * This is the "stress-test / change one parameter" path. Without it,
   * the agent re-ran fresh API calls on every stress-test turn, which
   * could return different values (FRED rate drift, RentCast cache
   * misses, tax service variability) — producing inconsistent scores
   * between turns that should be deterministically ordered.
   *
   * 24-char hex Mongo ObjectId.
   */
  priorDecisionId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'priorDecisionId must be a 24-char hex ObjectId')
    .optional(),
});

export type ResolvePropertyInputsInput = z.infer<
  typeof ResolvePropertyInputsInputSchema
>;

// ===== Output schema =====

const ObjectShape = z.custom<Record<string, unknown>>(
  (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
  { message: 'Expected a non-null object' }
);

export const ResolvePropertyInputsOutputSchema = z.object({
  /** Complete SFRData — ready to feed compute_analysis + score_deal. */
  propertyData: ObjectShape,
  /** Standard projection assumptions — ready for compute_analysis. */
  assumptions: ObjectShape,
  /** field name → where the value came from. */
  provenance: z.record(z.string(), z.string()),
  /**
   * Score-critical + likely-wrong fields the agent should CONFIRM
   * with the user before scoring (Marcus Chen's bucket 1).
   */
  confirmBeforeScoring: z.array(
    z.object({
      field: z.string(),
      value: z.unknown(),
      source: z.string(),
      prompt: z.string(),
    })
  ),
  /**
   * Defaulted-but-usually-fine fields the agent should DISCLOSE
   * after scoring, collapsed (Marcus Chen's bucket 2).
   */
  discloseAfterScoring: z.array(
    z.object({
      field: z.string(),
      value: z.unknown(),
      source: z.string(),
    })
  ),
});

export type ResolvePropertyInputsOutput = {
  propertyData: SFRData;
  assumptions: AnalysisAssumptions;
  provenance: Record<string, FieldProvenance>;
  confirmBeforeScoring: Array<{
    field: string;
    value: unknown;
    source: FieldProvenance;
    prompt: string;
  }>;
  discloseAfterScoring: Array<{
    field: string;
    value: unknown;
    source: FieldProvenance;
  }>;
};

// ===== Resolver core =====

/**
 * Pick a field's value + provenance: userOverride wins, then the
 * external source, then the default. Returns [value, provenance].
 */
function pick<T>(
  override: T | undefined,
  external: T | undefined,
  externalProvenance: FieldProvenance,
  fallback: T
): [T, FieldProvenance] {
  if (override !== undefined) return [override, 'user_provided'];
  if (external !== undefined && external !== null) return [external, externalProvenance];
  return [fallback, 'assumption_default'];
}

// ===== Day 11b — resolve from a prior AnalysisEvent =====
//
// Load the prior AnalysisEvent via the audit-trail read (already used by
// render_audit_trail + adversarial_critic), take its propertyData +
// assumptions as the reproducibility BASE, apply only the user's
// explicit overrides on top, and return.
//
// Provenance: fields taken from prior are tagged 'prior_analysis';
// overridden fields are 'user_provided'. The output matches the same
// shape the fresh path returns so the agent flow continues unchanged.
//
// Transparency lists are minimal here — there's no fresh data to
// confirm or disclose. The user already saw + accepted these
// assumptions on the prior turn; the only NEW thing this turn is the
// override they explicitly made. Empty confirmBeforeScoring +
// minimal discloseAfterScoring keeps the agent's response focused on
// "you changed X — here's the new score" rather than re-listing every
// assumption.

async function resolveFromPriorDecision(
  input: ResolvePropertyInputsInput,
  ctx: ToolContext
): Promise<ResolvePropertyInputsOutput> {
  if (!input.priorDecisionId) {
    // Defensive — the caller branched on this; should never happen.
    throw new Error(
      'resolve_property_inputs: resolveFromPriorDecision called without priorDecisionId'
    );
  }
  const overrides: Record<string, number> = { ...(input.userOverrides ?? {}) };
  coerceRatePercentagesAndWarn(
    overrides as unknown as Record<string, unknown>,
    'stress-test override',
    ctx.traceId
  );

  const bundle = await ctx.eventsReads.getAuditTrail(input.priorDecisionId);
  if (!bundle.analysis) {
    throw new Error(
      `resolve_property_inputs: prior AnalysisEvent missing for decisionId ${input.priorDecisionId} — ` +
        'cannot reproduce the prior scoring context.'
    );
  }

  // Pull propertyData + assumptions from the prior analysis verbatim.
  // The substrate payload types are intentionally shallow at the tool
  // boundary; we re-narrow to the resolver's output shape here.
  const priorPropertyData = bundle.analysis.payload.propertyData as unknown as Record<
    string,
    unknown
  >;
  const priorAssumptions = (bundle.analysis.payload.assumptions ?? {}) as unknown as Record<
    string,
    unknown
  >;

  // Apply the user's overrides. Each override key is matched against
  // BOTH propertyData and assumptions — the schemas overlap, and we
  // want a single override key (e.g., "interestRate") to flow to
  // wherever the field actually lives. Provenance is tagged per-field.
  const provenance: Record<string, FieldProvenance> = {};
  const propertyData: Record<string, unknown> = { ...priorPropertyData };
  const assumptions: Record<string, unknown> = { ...priorAssumptions };

  // Initial provenance: everything that came from prior is tagged.
  for (const key of Object.keys(priorPropertyData)) provenance[key] = 'prior_analysis';
  for (const key of Object.keys(priorAssumptions)) provenance[key] = 'prior_analysis';

  // Apply overrides. If a key exists in propertyData OR assumptions,
  // write it to the matching block (or both). If it doesn't exist in
  // either, it goes onto propertyData (caller may be introducing a new
  // field — rare but supported).
  for (const [key, value] of Object.entries(overrides)) {
    const inPropertyData = key in priorPropertyData;
    const inAssumptions = key in priorAssumptions;
    if (inPropertyData) propertyData[key] = value;
    if (inAssumptions) assumptions[key] = value;
    if (!inPropertyData && !inAssumptions) propertyData[key] = value;
    provenance[key] = 'user_provided';
  }

  // Issue #202 (2026-06-25) — STRATEGY PIVOT support on the
  // prior-decision branch. When the user starts a buy-hold analysis,
  // walks the property, and decides it's actually a BRRRR play, the
  // agent passes strategy='brrrr' + the brrrr sub-object as overrides
  // on top of the prior analysis. We don't re-fetch externals — the
  // property facts (sqft, year, taxes, insurance, etc.) are property-
  // attached and unchanged. Only the strategy + BRRRR-specific inputs
  // change. Same architectural pattern as the stress-test override.
  //
  // The reverse pivot (BRRRR → buy-hold) is symmetric: strategy='buy_hold'
  // removes the investmentStrategy + brrrr block from propertyData so
  // the engine routes through the standard buy-hold branch.
  if (input.strategy !== undefined) {
    if (input.strategy === 'brrrr') {
      if (!input.brrrr) {
        throw new Error(
          'resolve_property_inputs: strategy=brrrr on a pivot requires the `brrrr` ' +
            'sub-object with rehabBudget and afterRepairValue. Ask the user for the ' +
            'rehab cost and after-repair value before retrying.'
        );
      }
      // Use the prior interestRate (not a fresh FRED fetch) to compute
      // the refi rate default — the user's mortgage rate context is
      // already in the prior analysis, and we want pivot determinism.
      const priorInterestRate = Number(priorPropertyData.interestRate) || 7;
      const refinanceLTV = input.brrrr.refinanceLTV ?? 75;
      const refinanceInterestRate =
        input.brrrr.refinanceInterestRate ??
        Number((priorInterestRate + 2).toFixed(3));
      const seasoningPeriod = input.brrrr.seasoningPeriod ?? 12;

      propertyData.investmentStrategy = 'brrrr';
      propertyData.brrrr = {
        rehabBudget: input.brrrr.rehabBudget,
        afterRepairValue: input.brrrr.afterRepairValue,
        refinanceLTV,
        refinanceInterestRate,
        seasoningPeriod,
      };
      provenance.investmentStrategy = 'user_provided';
      provenance.rehabBudget = 'user_provided';
      provenance.afterRepairValue = 'user_provided';
      provenance.refinanceLTV =
        input.brrrr.refinanceLTV !== undefined ? 'user_provided' : 'assumption_default';
      provenance.refinanceInterestRate =
        input.brrrr.refinanceInterestRate !== undefined
          ? 'user_provided'
          : 'assumption_default';
      provenance.seasoningPeriod =
        input.brrrr.seasoningPeriod !== undefined
          ? 'user_provided'
          : 'assumption_default';
    } else if (input.strategy === 'buy_hold') {
      // Reverse pivot — strip the BRRRR-specific block so the engine
      // routes through the standard buy-hold branch.
      propertyData.investmentStrategy = 'buy_hold';
      delete propertyData.brrrr;
      provenance.investmentStrategy = 'user_provided';
    }
  }

  // Disclose just the OVERRIDES (the only thing that changed this
  // turn). The agent's TRANSPARENCY prompt rules know what to do
  // with this list.
  const discloseAfterScoring = Object.entries(overrides).map(([field, value]) => ({
    field,
    value,
    source: 'user_provided' as FieldProvenance,
  }));

  logger.info('resolve_property_inputs: resolved from prior decision', {
    priorDecisionId: input.priorDecisionId,
    overrideCount: Object.keys(overrides).length,
    overrideFields: Object.keys(overrides),
  });

  return {
    // Cast to the typed shapes — the substrate-side payloads have
    // looser types than the resolver's output, but the field set
    // matches by construction (the prior analysis was itself produced
    // by this same resolver).
    propertyData: propertyData as unknown as SFRData,
    assumptions: assumptions as unknown as AnalysisAssumptions,
    provenance,
    confirmBeforeScoring: [], // No fresh data to confirm — user already saw these last turn.
    discloseAfterScoring,
  };
}

// ===== Tool implementation =====

export const resolvePropertyInputs: Tool<
  ResolvePropertyInputsInput,
  ResolvePropertyInputsOutput
> = {
  name: 'resolve_property_inputs',
  description:
    'Turns a user-supplied address + purchase price into a complete SFRData the scoring engine needs. Auto-populates property facts (RentCast), the mortgage rate (FRED), and the property tax rate (tax service); fills the rest with standard defaults. Returns a per-field provenance map plus a two-bucket transparency split: fields to confirm with the user before scoring vs. defaults to disclose after. SFR only — multi-family is a separate path.',
  inputSchema: ResolvePropertyInputsInputSchema,
  outputSchema:
    ResolvePropertyInputsOutputSchema as unknown as z.ZodSchema<ResolvePropertyInputsOutput>,
  invokeLLM: false,
  // Read/compute tool — fetches + assembles, writes no substrate.
  sideEffects: [
    { type: 'external_api', service: 'rentcast' },
    { type: 'external_api', service: 'fred' },
  ],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: ResolvePropertyInputsInput,
    ctx: ToolContext
  ): Promise<ResolvePropertyInputsOutput> {
    const validated = ResolvePropertyInputsInputSchema.parse(input);
    const overrides: Record<string, number> = {
      ...(validated.userOverrides ?? {}),
    };
    // Unit-convention guard: if the LLM slipped and sent a rate as a
    // decimal (0.065 instead of 6.5), coerce here + warn loudly.
    coerceRatePercentagesAndWarn(
      overrides as unknown as Record<string, unknown>,
      'initial resolution override',
      ctx.traceId
    );

    // Phase 1 BRRRR (Issue #200): if strategy is 'brrrr' but no brrrr
    // sub-object was supplied, throw with a clear message the agent can
    // surface — those values reflect a specific deal's plan and we won't
    // guess. Agent prompt is wired to ask the user for rehabBudget +
    // afterRepairValue when strategy is brrrr; this is the runtime
    // backstop.
    const strategy = validated.strategy ?? 'buy_hold';
    if (strategy === 'brrrr' && !validated.brrrr) {
      throw new Error(
        'resolve_property_inputs: strategy=brrrr requires the `brrrr` ' +
          'sub-object with rehabBudget and afterRepairValue. Ask the user ' +
          "for the rehab cost and after-repair value before retrying — we don't " +
          'guess these.'
      );
    }

    // ===== Day 11b — stress-test / re-score branch =====
    //
    // When `priorDecisionId` is set, the caller is running a "change one
    // parameter from the prior analysis" flow (e.g., stress-test at 7%
    // mortgage rate). Reproducibility REQUIRES that we use the EXACT
    // same propertyData + assumptions as the prior turn, only applying
    // the user's explicit overrides on top — NOT re-fetching from
    // RentCast / FRED / tax service (those return drifting values).
    //
    // Pre-Day-11b, the agent re-resolved fresh on every stress test,
    // which caused score-vs-rate inversions (Issue A). This branch
    // makes single-parameter overrides deterministic.
    if (validated.priorDecisionId) {
      return await resolveFromPriorDecision(validated, ctx);
    }

    // ===== Fetch external data =====
    // validated.address is post-Zod-.parse() — all four fields present.
    // The cast narrows past a TS inference quirk on nested Zod objects.
    const address = validated.address as {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    // Task #15 (2026-05-28): when the user hasn't specified a price,
    // pass 0 to fetchExternalData. The tax service tolerates 0 (it
    // returns the state-level effective rate independently of the
    // dollar amount), and we'll resolve the true price from
    // ext.valueEstimate (RentCast AVM) immediately after.
    const ext = await currentResolverAdapter.fetchExternalData({
      address,
      purchasePrice: validated.purchasePrice ?? 0,
    });

    // Task #15: resolve purchasePrice — user input wins; otherwise the
    // RentCast AVM (valueEstimate); otherwise we cannot proceed and the
    // agent must ask the user.
    const resolvedPurchasePrice =
      validated.purchasePrice ??
      (ext.valueEstimate && ext.valueEstimate > 0 ? ext.valueEstimate : undefined);
    if (resolvedPurchasePrice === undefined) {
      throw new Error(
        'resolve_property_inputs: no purchase price provided AND no RentCast ' +
          'AVM (valueEstimate) available for this address. The agent must ask ' +
          'the user for the purchase price.'
      );
    }

    const provenance: Record<string, FieldProvenance> = {};

    // ===== monthlyRent — the one CONFIRM-BEFORE field =====
    // Rent drives cash flow hardest and the RentCast estimate is the
    // single most-likely-wrong input. No sane fallback — if RentCast
    // returns nothing AND the user didn't supply it, that's an error
    // state (we won't guess rent).
    let monthlyRent: number;
    if (overrides.monthlyRent !== undefined) {
      monthlyRent = overrides.monthlyRent;
      provenance.monthlyRent = 'user_provided';
    } else if (ext.rentEstimate !== undefined && ext.rentEstimate > 0) {
      monthlyRent = ext.rentEstimate;
      provenance.monthlyRent = 'rentcast_estimate';
    } else {
      throw new Error(
        'resolve_property_inputs: no rent estimate available from RentCast and ' +
          'none supplied in userOverrides. Monthly rent is too central to guess — ' +
          'the agent must ask the user for it.'
      );
    }

    // ===== purchasePrice — user_provided if specified, else from RentCast AVM =====
    provenance.purchasePrice = validated.purchasePrice !== undefined
      ? 'user_provided'
      : 'rentcast_estimate';

    // ===== Property-record fields (RentCast property record or default) =====
    const [bedrooms, bedroomsProv] = pick(
      overrides.bedrooms,
      ext.bedrooms,
      'rentcast_property_record',
      DEFAULTS.fallbackBedrooms
    );
    provenance.bedrooms = bedroomsProv;

    const [bathrooms, bathroomsProv] = pick(
      overrides.bathrooms,
      ext.bathrooms,
      'rentcast_property_record',
      DEFAULTS.fallbackBathrooms
    );
    provenance.bathrooms = bathroomsProv;

    const [squareFootage, sqftProv] = pick(
      overrides.squareFootage,
      ext.squareFootage,
      'rentcast_property_record',
      DEFAULTS.fallbackSquareFootage
    );
    provenance.squareFootage = sqftProv;

    const [yearBuilt, yearBuiltProv] = pick(
      overrides.yearBuilt,
      ext.yearBuilt,
      'rentcast_property_record',
      DEFAULTS.fallbackYearBuilt
    );
    provenance.yearBuilt = yearBuiltProv;

    // ===== interestRate — FRED market or default =====
    const [interestRate, interestRateProv] = pick(
      overrides.interestRate,
      ext.currentMortgageRate,
      'fred_market',
      DEFAULTS.fallbackMortgageRate
    );
    provenance.interestRate = interestRateProv;

    // ===== propertyTaxRate — tax service or default =====
    const [propertyTaxRate, taxRateProv] = pick(
      overrides.propertyTaxRate,
      ext.effectiveTaxRate,
      'tax_service',
      DEFAULTS.fallbackTaxRate
    );
    provenance.propertyTaxRate = taxRateProv;

    // ===== Assumption-default fields =====
    const downPayment =
      overrides.downPayment ?? resolvedPurchasePrice * DEFAULTS.downPaymentRatio;
    provenance.downPayment =
      overrides.downPayment !== undefined ? 'user_provided' : 'assumption_default';

    const loanTerm = overrides.loanTerm ?? DEFAULTS.loanTermYears;
    provenance.loanTerm =
      overrides.loanTerm !== undefined ? 'user_provided' : 'assumption_default';

    const insuranceRate = overrides.insuranceRate ?? DEFAULTS.insuranceRatePct;
    provenance.insuranceRate =
      overrides.insuranceRate !== undefined ? 'user_provided' : 'assumption_default';

    const maintenanceCost =
      overrides.maintenanceCost ??
      resolvedPurchasePrice * DEFAULTS.maintenanceRatio;
    provenance.maintenanceCost =
      overrides.maintenanceCost !== undefined
        ? 'user_provided'
        : 'assumption_default';

    const propertyManagementRate =
      overrides.propertyManagementRate ?? DEFAULTS.propertyMgmtRatePct;
    provenance.propertyManagementRate =
      overrides.propertyManagementRate !== undefined
        ? 'user_provided'
        : 'assumption_default';

    const closingCosts =
      overrides.closingCosts ??
      Math.max(
        resolvedPurchasePrice * DEFAULTS.closingCostsRatio,
        DEFAULTS.closingCostsFloor,
      );
    provenance.closingCosts =
      overrides.closingCosts !== undefined ? 'user_provided' : 'assumption_default';

    // ===== Assemble SFRData =====
    const propertyData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: resolvedPurchasePrice,
      downPayment,
      interestRate,
      loanTerm,
      monthlyRent,
      propertyTaxRate,
      insuranceRate,
      maintenanceCost,
      propertyManagementRate,
      squareFootage,
      bedrooms,
      bathrooms,
      yearBuilt,
      closingCosts,
      propertyAddress: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
    };

    // Phase 1 BRRRR (Issue #200): when strategy='brrrr', stamp
    // `investmentStrategy` + the `brrrr` sub-object on propertyData. The
    // InvestmentDecisionEngine routes on propertyData.investmentStrategy
    // (engine line 1610: `if (investmentStrategy === 'brrrr')`) and
    // BRRRRAnalyzer reads from propertyData.brrrr. Defaults for refi
    // rate / refi LTV / seasoning are applied here — refi rate defaults
    // to the current mortgage rate + 200bps (typical cash-out spread),
    // refi LTV to 75% (Fannie/Freddie standard), seasoning to 12 months
    // (most conservative — many lenders accept 6).
    if (strategy === 'brrrr') {
      const brrrrIn = validated.brrrr!; // existence checked above
      const refinanceLTV = brrrrIn.refinanceLTV ?? 75;
      const refinanceInterestRate =
        brrrrIn.refinanceInterestRate ?? Number((interestRate + 2).toFixed(3));
      const seasoningPeriod = brrrrIn.seasoningPeriod ?? 12;

      // Stamp the routing field. Cast to a wider shape because SFRData
      // doesn't currently have investmentStrategy in its declared keys
      // (it's read by the engine via `(propertyData as any)`).
      (propertyData as unknown as Record<string, unknown>).investmentStrategy = 'brrrr';
      (propertyData as unknown as Record<string, unknown>).brrrr = {
        rehabBudget: brrrrIn.rehabBudget,
        afterRepairValue: brrrrIn.afterRepairValue,
        refinanceLTV,
        refinanceInterestRate,
        seasoningPeriod,
      };

      provenance.rehabBudget = 'user_provided';
      provenance.afterRepairValue = 'user_provided';
      provenance.refinanceLTV =
        brrrrIn.refinanceLTV !== undefined ? 'user_provided' : 'assumption_default';
      provenance.refinanceInterestRate =
        brrrrIn.refinanceInterestRate !== undefined
          ? 'user_provided'
          : 'assumption_default';
      provenance.seasoningPeriod =
        brrrrIn.seasoningPeriod !== undefined
          ? 'user_provided'
          : 'assumption_default';
    }

    // ===== Two-bucket transparency (Marcus Chen's model) =====
    //
    // confirmBeforeScoring: score-critical + likely-wrong. monthlyRent
    // is the canonical case — but ONLY when it's a RentCast estimate.
    // If the user already supplied it, there's nothing to confirm.
    const confirmBeforeScoring: ResolvePropertyInputsOutput['confirmBeforeScoring'] =
      [];
    if (provenance.monthlyRent === 'rentcast_estimate') {
      confirmBeforeScoring.push({
        field: 'monthlyRent',
        value: monthlyRent,
        source: 'rentcast_estimate',
        prompt: `RentCast estimates rent around $${Math.round(
          monthlyRent
        ).toLocaleString()}/mo — does that match what you're seeing?`,
      });
    }

    // discloseAfterScoring: everything that was inferred or defaulted
    // (NOT user_provided — the user already knows what they typed).
    const discloseAfterScoring: ResolvePropertyInputsOutput['discloseAfterScoring'] =
      [];
    const discloseFields: Array<[string, unknown]> = [
      ['downPayment', downPayment],
      ['interestRate', interestRate],
      ['loanTerm', loanTerm],
      ['propertyTaxRate', propertyTaxRate],
      ['insuranceRate', insuranceRate],
      ['maintenanceCost', maintenanceCost],
      ['propertyManagementRate', propertyManagementRate],
      ['closingCosts', closingCosts],
      ['bedrooms', bedrooms],
      ['bathrooms', bathrooms],
      ['squareFootage', squareFootage],
      ['yearBuilt', yearBuilt],
    ];
    // Phase 1 BRRRR (Issue #200): refi rate / refi LTV / seasoning have
    // institutional defaults; surface them in the post-score disclosure
    // so the user knows what assumptions are baked into the BRRRR math.
    if (strategy === 'brrrr') {
      const brrrrData = (propertyData as unknown as Record<string, unknown>).brrrr as {
        refinanceLTV: number;
        refinanceInterestRate: number;
        seasoningPeriod: number;
      };
      discloseFields.push(
        ['refinanceLTV', brrrrData.refinanceLTV],
        ['refinanceInterestRate', brrrrData.refinanceInterestRate],
        ['seasoningPeriod', brrrrData.seasoningPeriod]
      );
    }
    for (const [field, value] of discloseFields) {
      const src = provenance[field];
      // Only disclose what we inferred/defaulted — skip user_provided
      // (the user doesn't need their own input "disclosed" back to them).
      if (src && src !== 'user_provided') {
        discloseAfterScoring.push({ field, value, source: src });
      }
    }

    return {
      propertyData,
      assumptions: { ...DEFAULT_ASSUMPTIONS },
      provenance,
      confirmBeforeScoring,
      discloseAfterScoring,
    };
  },
};
