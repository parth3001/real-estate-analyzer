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
  | 'assumption_default'; // our standard default (down %, term, insurance, etc.)

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
  /** 1.5% of purchase price — typical buyer closing costs. */
  closingCostsRatio: 0.015,
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
  purchasePrice: z.number().positive().finite(),
  propertyType: z.enum(['SFR']), // MF is a separate path — see file header
  /**
   * User-corrected field values. Anything here overrides the
   * resolved/defaulted value and is tagged 'user_provided' in the
   * provenance map. Keys are SFRData field names (monthlyRent,
   * downPayment, interestRate, etc.).
   */
  userOverrides: z.record(z.string(), z.number()).optional(),
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
    _ctx: ToolContext
  ): Promise<ResolvePropertyInputsOutput> {
    const validated = ResolvePropertyInputsInputSchema.parse(input);
    const overrides = validated.userOverrides ?? {};

    // ===== Fetch external data =====
    // validated.address is post-Zod-.parse() — all four fields present.
    // The cast narrows past a TS inference quirk on nested Zod objects.
    const address = validated.address as {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    const ext = await currentResolverAdapter.fetchExternalData({
      address,
      purchasePrice: validated.purchasePrice,
    });

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

    // ===== purchasePrice — always user_provided =====
    provenance.purchasePrice = 'user_provided';

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
      overrides.downPayment ?? validated.purchasePrice * DEFAULTS.downPaymentRatio;
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
      validated.purchasePrice * DEFAULTS.maintenanceRatio;
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
      validated.purchasePrice * DEFAULTS.closingCostsRatio;
    provenance.closingCosts =
      overrides.closingCosts !== undefined ? 'user_provided' : 'assumption_default';

    // ===== Assemble SFRData =====
    const propertyData: SFRData = {
      propertyType: 'SFR',
      purchasePrice: validated.purchasePrice,
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
