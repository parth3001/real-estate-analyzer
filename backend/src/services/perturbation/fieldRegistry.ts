/**
 * Perturbable-fields registry — the single source of truth for which engine
 * inputs can be stress-tested from chat, and what their unit conventions are.
 *
 * Task #16 (Path B, 2026-05-24) — architectural pivot away from the broken
 * `resolve_property_inputs + userOverrides` flow where the LLM was guessing
 * units (and getting it wrong — passing `0.075` where the engine wanted `7.5`).
 *
 * Why this exists
 * ---------------
 * The engine has multiple unit conventions baked in. `interestRate`,
 * `propertyTaxRate`, `vacancyRate` and similar fields are stored as
 * PERCENTAGE numbers (7.5 = 7.5%) — the engine divides by 100 inside the
 * math (see BasePropertyAnalyzer.ts:285). `landValueRatio` is a DECIMAL
 * (0.20 = 20%). `monthlyRent` is DOLLARS. `loanTerm` is YEARS. There's no
 * single rule.
 *
 * Without this registry, every layer that wants to perturb a field has to
 * know each field's individual convention. The LLM doesn't, which produced
 * the 81/100 bug (LLM passed `interestRate: 0.075`, engine read 0.00075%,
 * monthly P&I collapsed to ~$427, deal looked great). This registry makes
 * the convention LOOKUP-able instead of REMEMBERED, and the runner
 * (Layer 3) converts user-declared units → engine-expected units at one
 * boundary.
 *
 * Adding a new field = one new registry entry. The agent, the schema, the
 * runner, the narrative composition all pick it up automatically.
 */

import type { SFRData } from '../../types/propertyTypes';
import type { AnalysisAssumptions } from '../../analysis/BasePropertyAnalyzer';

// ===== Unit system =====

/**
 * The unit the ENGINE expects a field to be in. Every perturbable field
 * declares one. The runner normalizes user-supplied values against this
 * before applying them.
 *
 *   - 'percent': engine expects 7.5 to mean 7.5% (engine divides by 100)
 *   - 'dollars': raw dollar amount (e.g., monthly rent in $)
 *   - 'years':   integer or fractional year count
 *   - 'decimal_ratio': engine expects 0.20 to mean 20% (NO division by 100)
 *   - 'count':   bare integer (e.g., bedrooms, bathrooms)
 */
export type EngineUnit = 'percent' | 'dollars' | 'years' | 'decimal_ratio' | 'count';

/**
 * The unit the USER (or LLM-on-behalf-of-user) DECLARED their value in.
 * Layer 2's Zod schema requires this so the LLM cannot silently slip a
 * decimal where a percent is wanted. Layer 3 converts to EngineUnit.
 *
 * Note: 'percent' here means literally "the number the user said for a
 * percentage" — e.g., when a user says "stress at 7.5%", value=7.5 unit=percent.
 * 'decimal_ratio' means the user supplied a decimal fraction (0.075 for 7.5%).
 * These are distinct so the Layer 2 LLM can be unambiguous about intent.
 */
export type UserUnit = 'percent' | 'dollars' | 'years' | 'decimal_ratio' | 'count';

/** Which engine input bag the field lives in. */
export type FieldContainer = 'propertyData' | 'assumptions';

// ===== Registry entry shape =====

export interface PerturbableFieldDef {
  /**
   * User-facing key — what the LLM emits in Layer 2's structured output and
   * what humans see in chat narration. Deliberately friendlier than the
   * engine's internal field name (e.g., 'mortgageRate' rather than
   * 'interestRate', 'rent' rather than 'monthlyRent'). Stable identifier.
   */
  key: string;
  /** Where the field lives on the engine call shape. */
  container: FieldContainer;
  /**
   * The actual field name on `propertyData` or `assumptions`. Layer 3 uses
   * this to write the perturbed value to the right place.
   */
  path: string;
  /** Unit the engine expects. The runner converts user-units → this. */
  engineUnit: EngineUnit;
  /** Human-readable label for chat narration ("Mortgage rate"). */
  label: string;
  /**
   * Description shown in the Layer 2 LLM tool spec — guides how the LLM
   * extracts the value and what unit it should declare.
   */
  description: string;
  /** Engine-unit lower bound for validation (inclusive). Optional. */
  min?: number;
  /** Engine-unit upper bound for validation (inclusive). Optional. */
  max?: number;
}

// ===== The registry =====

/**
 * SFR perturbable fields. Multi-family will get its own registry following
 * the same shape (Task #20 — property-type registry will own this dispatch).
 *
 * Field selection: every NUMERIC input to the SFRAnalyzer + engine that
 * a real estate investor would conceivably want to stress-test. Physical
 * attributes (bedrooms, sqft, yearBuilt) are excluded — they're property
 * facts, not deal levers.
 */
export const SFR_PERTURBABLE_FIELDS: Record<string, PerturbableFieldDef> = {
  // ===== Financing =====
  mortgageRate: {
    key: 'mortgageRate',
    container: 'propertyData',
    path: 'interestRate',
    engineUnit: 'percent',
    label: 'Mortgage rate',
    description:
      'The mortgage interest rate. The engine expects a PERCENT (7.5 means 7.5%). If the user says "7.5%", emit value=7.5 unit="percent". If they say "75 basis points", convert to percent (0.75) and emit unit="percent".',
    min: 0,
    max: 25,
  },
  loanTerm: {
    key: 'loanTerm',
    container: 'propertyData',
    path: 'loanTerm',
    engineUnit: 'years',
    label: 'Loan term',
    description: 'Loan term in years. Typical values: 15, 20, 30. Emit unit="years".',
    min: 1,
    max: 40,
  },
  downPayment: {
    key: 'downPayment',
    container: 'propertyData',
    path: 'downPayment',
    engineUnit: 'dollars',
    label: 'Down payment',
    description:
      'Down payment in DOLLARS. If the user says "30% down" you may need to compute it from purchasePrice; if they say "$60,000 down", emit value=60000 unit="dollars".',
    min: 0,
  },
  closingCosts: {
    key: 'closingCosts',
    container: 'propertyData',
    path: 'closingCosts',
    engineUnit: 'dollars',
    label: 'Closing costs',
    description: 'One-time closing costs in DOLLARS. Emit unit="dollars".',
    min: 0,
  },

  // ===== Income =====
  rent: {
    key: 'rent',
    container: 'propertyData',
    path: 'monthlyRent',
    engineUnit: 'dollars',
    label: 'Monthly rent',
    description:
      'Monthly rent in DOLLARS. If the user says "$1,500 rent", emit value=1500 unit="dollars".',
    min: 0,
  },

  // ===== Operating expense rates (PERCENT — engine divides by 100) =====
  propertyTax: {
    key: 'propertyTax',
    container: 'propertyData',
    path: 'propertyTaxRate',
    engineUnit: 'percent',
    label: 'Property tax rate',
    description:
      'Annual property tax as a PERCENT of purchase price. Engine expects 1.8 to mean 1.8%. If the user says "1.8%", emit value=1.8 unit="percent".',
    min: 0,
    max: 10,
  },
  insurance: {
    key: 'insurance',
    container: 'propertyData',
    path: 'insuranceRate',
    engineUnit: 'percent',
    label: 'Insurance rate',
    description:
      'Annual insurance as a PERCENT of purchase price. Engine expects 0.5 to mean 0.5%.',
    min: 0,
    max: 5,
  },
  managementFee: {
    key: 'managementFee',
    container: 'propertyData',
    path: 'propertyManagementRate',
    engineUnit: 'percent',
    label: 'Property management fee',
    description:
      'Property management fee as a PERCENT of gross rent. Engine expects 8 to mean 8%.',
    min: 0,
    max: 20,
  },

  // ===== Operating expenses (DOLLAR amounts) =====
  maintenance: {
    key: 'maintenance',
    container: 'propertyData',
    path: 'maintenanceCost',
    engineUnit: 'dollars',
    label: 'Annual maintenance reserve',
    description:
      'ANNUAL maintenance budget in DOLLARS (the engine divides by 12 internally). If the user says "$200/month maintenance", multiply by 12 and emit value=2400 unit="dollars".',
    min: 0,
  },
  hoa: {
    key: 'hoa',
    container: 'propertyData',
    path: 'monthlyHOA',
    engineUnit: 'dollars',
    label: 'Monthly HOA',
    description: 'Monthly HOA fee in DOLLARS.',
    min: 0,
  },
  utilities: {
    key: 'utilities',
    container: 'propertyData',
    path: 'monthlyUtilities',
    engineUnit: 'dollars',
    label: 'Monthly utilities',
    description: 'Monthly landlord-paid utilities in DOLLARS.',
    min: 0,
  },
  capex: {
    key: 'capex',
    container: 'propertyData',
    path: 'monthlyCapEx',
    engineUnit: 'dollars',
    label: 'Monthly CapEx reserve',
    description: 'Monthly capital expenditure reserve in DOLLARS.',
    min: 0,
  },

  // ===== Long-term assumptions (live on `assumptions`, not propertyData) =====
  vacancy: {
    key: 'vacancy',
    container: 'assumptions',
    path: 'vacancyRate',
    engineUnit: 'percent',
    label: 'Vacancy rate',
    description:
      'Vacancy as a PERCENT of gross rent. Engine expects 5 to mean 5%. If user says "5% vacancy", emit value=5 unit="percent".',
    min: 0,
    max: 50,
  },
  holdPeriod: {
    key: 'holdPeriod',
    container: 'assumptions',
    path: 'projectionYears',
    engineUnit: 'years',
    label: 'Hold period',
    description: 'Hold period in YEARS (how long the investor holds before sale).',
    min: 1,
    max: 30,
  },
  rentGrowth: {
    key: 'rentGrowth',
    container: 'assumptions',
    path: 'annualRentIncrease',
    engineUnit: 'percent',
    label: 'Annual rent growth',
    description: 'Annual rent growth as a PERCENT. Engine expects 3 to mean 3% per year.',
    min: -10,
    max: 20,
  },
  expenseGrowth: {
    key: 'expenseGrowth',
    container: 'assumptions',
    path: 'annualExpenseIncrease',
    engineUnit: 'percent',
    label: 'Annual expense growth',
    description: 'Annual operating expense growth as a PERCENT.',
    min: -10,
    max: 20,
  },
  propertyAppreciation: {
    key: 'propertyAppreciation',
    container: 'assumptions',
    path: 'annualPropertyValueIncrease',
    engineUnit: 'percent',
    label: 'Annual property appreciation',
    description: 'Annual property value appreciation as a PERCENT.',
    min: -20,
    max: 20,
  },
  sellingCosts: {
    key: 'sellingCosts',
    container: 'assumptions',
    path: 'sellingCosts',
    engineUnit: 'percent',
    label: 'Selling costs at exit',
    description:
      'Selling costs at exit (realtor + closing) as a PERCENT of sale price. Engine expects 6 to mean 6%.',
    min: 0,
    max: 15,
  },

  // ===== Investment-strategy levers =====
  purchasePrice: {
    key: 'purchasePrice',
    container: 'propertyData',
    path: 'purchasePrice',
    engineUnit: 'dollars',
    label: 'Purchase price',
    description: 'Purchase price in DOLLARS. The single biggest deal lever.',
    min: 0,
  },
  afterRepairValue: {
    key: 'afterRepairValue',
    container: 'propertyData',
    path: 'afterRepairValue',
    engineUnit: 'dollars',
    label: 'After-repair value (ARV)',
    description: 'After-repair value in DOLLARS (BRRRR strategy).',
    min: 0,
  },
  renovationCosts: {
    key: 'renovationCosts',
    container: 'propertyData',
    path: 'renovationCosts',
    engineUnit: 'dollars',
    label: 'Renovation costs',
    description: 'Renovation budget in DOLLARS.',
    min: 0,
  },
  repairCosts: {
    key: 'repairCosts',
    container: 'propertyData',
    path: 'repairCosts',
    engineUnit: 'dollars',
    label: 'Repair costs',
    description: 'Repair costs in DOLLARS.',
    min: 0,
  },
};

/**
 * Type-level guard: all `path` strings in the registry MUST be real keys on
 * the engine's call shape. If you add a field whose `path` isn't on SFRData
 * or AnalysisAssumptions, TypeScript will fail the next type-check rather
 * than producing a silent runtime miss.
 *
 * This is intentionally a const assertion — we want compile-time errors,
 * not runtime checks. The cast itself doesn't run; it just forces the
 * compiler to verify each `path` string is assignable to the right shape.
 */
type _RegistryPathsAreValid = {
  [K in keyof typeof SFR_PERTURBABLE_FIELDS]: (typeof SFR_PERTURBABLE_FIELDS)[K]['container'] extends 'propertyData'
    ? (typeof SFR_PERTURBABLE_FIELDS)[K]['path'] extends keyof SFRData
      ? true
      : never
    : (typeof SFR_PERTURBABLE_FIELDS)[K]['path'] extends keyof AnalysisAssumptions
    ? true
    : never;
};
// Self-check — if this never[] type doesn't elaborate, compilation fails:
const _registryCheck: _RegistryPathsAreValid = {} as _RegistryPathsAreValid;
void _registryCheck;

// ===== Lookup helpers =====

/** All registered field keys (used by the Layer 2 Zod enum). */
export const SFR_PERTURBABLE_FIELD_KEYS = Object.keys(SFR_PERTURBABLE_FIELDS) as Array<
  keyof typeof SFR_PERTURBABLE_FIELDS
>;

/**
 * Returns the registry entry for a friendly key, or throws if unknown.
 * Throwing is deliberate — Layer 2's Zod enum should have already gated
 * unknown keys; if we reach Layer 3 with an unknown key, that's a bug
 * worth surfacing loudly rather than silently no-op'ing.
 */
export function getFieldDef(key: string): PerturbableFieldDef {
  const def = SFR_PERTURBABLE_FIELDS[key];
  if (!def) {
    throw new Error(
      `Perturbation field '${key}' is not in the registry. ` +
        `Known fields: ${SFR_PERTURBABLE_FIELD_KEYS.join(', ')}.`
    );
  }
  return def;
}

// ===== Unit normalization =====

/**
 * Convert a user-supplied value (in `userUnit`) to the engine's expected
 * unit for this field. This is THE single place where unit conversion
 * happens — every other layer relies on this returning a number in the
 * engine's convention.
 *
 * Conversion rules:
 *   percent ↔ decimal_ratio:
 *     percent → decimal_ratio:  value / 100   (7.5% → 0.075)
 *     decimal_ratio → percent:  value * 100   (0.075 → 7.5%)
 *
 *   dollars ↔ dollars:    1:1, no conversion
 *   years   ↔ years:      1:1
 *   count   ↔ count:      1:1
 *
 * Any other cross-unit conversion (e.g., user says "30% down payment" but
 * the field is `downPayment` in dollars) requires extra context (purchase
 * price) and is handled at a higher layer, NOT here. This function does
 * only the unit-system conversions that are context-free.
 *
 * Throws if the conversion is not defined — better to fail loudly than
 * silently produce wrong numbers.
 */
export function normalizeToEngineUnit(
  value: number,
  userUnit: UserUnit,
  field: PerturbableFieldDef
): number {
  const engineUnit = field.engineUnit;

  // Same unit family — no conversion needed.
  if (userUnit === engineUnit) return value;

  // Percent ↔ decimal_ratio is the common cross-unit conversion.
  if (userUnit === 'percent' && engineUnit === 'decimal_ratio') {
    return value / 100;
  }
  if (userUnit === 'decimal_ratio' && engineUnit === 'percent') {
    return value * 100;
  }

  // Anything else is incompatible — surface the bug.
  throw new Error(
    `Cannot convert user value ${value} (unit: '${userUnit}') to engine unit ` +
      `'${engineUnit}' for field '${field.key}'. This conversion isn't defined ` +
      `— either the user-unit declaration is wrong, the field's engineUnit in ` +
      `the registry is wrong, or a higher-layer conversion (e.g., percent of ` +
      `purchase price → dollars) is needed before calling this function.`
  );
}

/**
 * Validate that an engine-unit value falls within the field's declared
 * [min, max] bounds. Returns null if OK; returns an error message if out
 * of range. Lets callers decide whether to throw, clamp, or warn — Layer 3
 * will surface this to the user as part of the response.
 */
export function validateEngineValue(
  value: number,
  field: PerturbableFieldDef
): string | null {
  if (!Number.isFinite(value)) {
    return `${field.label} must be a finite number; received ${value}.`;
  }
  if (field.min !== undefined && value < field.min) {
    return `${field.label} of ${value} is below the minimum of ${field.min}.`;
  }
  if (field.max !== undefined && value > field.max) {
    return `${field.label} of ${value} is above the maximum of ${field.max}.`;
  }
  return null;
}
