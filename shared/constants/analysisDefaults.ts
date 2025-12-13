/**
 * Analysis Defaults - Shared Constants
 *
 * Single source of truth for default values used in both frontend wizard
 * and backend analysis calculations.
 *
 * Phase 1: Static constants (instant load, no API dependency)
 * Phase 2: Will add dynamic backend API `/api/analysis/defaults?zipCode=XXX`
 * Phase 3: Regional customization with RentCast data
 */

export const STATIC_ANALYSIS_DEFAULTS = {
  // Long-term projection assumptions
  projectionYears: 10,
  annualRentIncrease: 3,          // % per year (historical average)
  annualPropertyValueIncrease: 3, // % per year (historical average)
  inflationRate: 2.5,             // % per year (Fed target)
  vacancyRate: 5,                 // % (industry standard for residential)
  sellingCostsPercentage: 6,      // % (typical realtor commission)
  turnoverFrequency: 2,           // years between tenant changes

  // Operating expense assumptions
  propertyManagementRate: 8,      // % of gross rent (industry standard 8-10%)
  maintenanceReservePercentage: 1, // % of property value annually
  capitalExpenditurePercentage: 1, // % of property value annually (roof, HVAC, etc.)

  // Financing assumptions
  downPaymentPercentage: 25,      // % (conventional investment property)
  closingCostPercentage: 2.5,     // % of purchase price
  loanTerm: 30,                   // years (standard mortgage)

  // Property tax & insurance (will be replaced by ZIP-based API in most cases)
  propertyTaxRate: 1.2,           // % (national average fallback)
  insuranceRatePercentage: 0.35,  // % of property value annually (0.35% rule)

  // Tenant turnover costs
  prepFees: 500,                  // $ per turnover (cleaning, painting, repairs)
  realtorCommission: 0.5          // months of rent for tenant placement
} as const;

/**
 * Get default value with optional override
 * Useful for future Phase 2 dynamic defaults
 */
export const getDefault = <K extends keyof typeof STATIC_ANALYSIS_DEFAULTS>(
  key: K,
  override?: typeof STATIC_ANALYSIS_DEFAULTS[K]
): typeof STATIC_ANALYSIS_DEFAULTS[K] => {
  return override !== undefined ? override : STATIC_ANALYSIS_DEFAULTS[key];
};

/**
 * Phase 2: Hook for dynamic defaults (to be implemented)
 *
 * Usage:
 * const defaults = useSmartDefaults(zipCode);
 *
 * Will fetch from GET /api/analysis/defaults?zipCode=78701
 * Falls back to STATIC_ANALYSIS_DEFAULTS if API fails
 */
// export const useSmartDefaults = (zipCode?: string) => {
//   const [defaults, setDefaults] = useState(STATIC_ANALYSIS_DEFAULTS);
//
//   useEffect(() => {
//     if (!zipCode) return;
//
//     fetchDynamicDefaults(zipCode, { timeout: 2000 })
//       .then(setDefaults)
//       .catch(() => console.log('Using static defaults'));
//   }, [zipCode]);
//
//   return defaults;
// };
