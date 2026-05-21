/**
 * scenarioDiff — field-agnostic comparison of two scenario input sets.
 *
 * Day 11h (Task #13, 2026-05-20). Powers the diff-based scenario indicator
 * and the scenario-comparison table (Task #8).
 *
 * DESIGN PRINCIPLE (founder directive, 2026-05-20): NO privileged axis.
 * Down payment is NOT special. A scenario's identity is *whatever changed*
 * from the baseline — could be purely rent, purely exit costs, purely hold
 * period, or any combination. This engine compares the ENTIRE underwriting
 * input set and surfaces only the fields that actually differ, each in its
 * natural unit.
 *
 * It returns STRUCTURED deltas (field / label / unit / values / formatted /
 * direction) — NOT a final label string. The UI decides how to render them
 * (chip, row, "+N more"), so this layer stays UX-independent and reusable.
 *
 * GOTCHAS handled (per substrate investigation):
 *   - Dollar/rate duals: we diff the canonical RATE side only
 *     (propertyTaxRate, insuranceRate) and ignore the dollar mirrors
 *     (annualPropertyTax, monthlyInsurance) — else identical scenarios show
 *     phantom changes.
 *   - No literal "exit cap" input exists — exit is modeled via
 *     sellingCostsPercentage + annualPropertyValueIncrease, both diffed.
 *   - Pure function: no DB, no LLM, no I/O. Safe to call N times.
 */

// ===== Types =====

export type ScenarioFieldUnit =
  | 'currency'
  | 'percent'
  | 'years'
  | 'months'
  | 'number';

export interface ScenarioDelta {
  /** Canonical field key, e.g. 'downPayment' or 'longTermAssumptions.vacancyRate'. */
  field: string;
  /** Human label, e.g. 'Down payment', 'Vacancy rate'. */
  label: string;
  unit: ScenarioFieldUnit;
  /** Raw baseline value (undefined if the field was absent in the baseline). */
  baseline: number | undefined;
  /** Raw scenario value (undefined if absent in the scenario). */
  scenario: number | undefined;
  /** Pre-formatted for display, in the field's natural unit. */
  formattedBaseline: string;
  formattedScenario: string;
  /** Direction of change. 'changed' when one side is undefined. */
  direction: 'up' | 'down' | 'changed';
}

export interface ScenarioDiff {
  /** Only the fields that actually changed, in config order. */
  deltas: ScenarioDelta[];
  changedCount: number;
}

// ===== Loose input shape =====
//
// propertyData is SFRData | MultiFamilyData at the type level, but the diff
// reads a known whitelist of fields defensively (substrate payloads are
// Mixed). Typing the getter input loosely keeps the engine resilient to
// shape drift.
type PropertyInput = Record<string, unknown>;

// ===== Formatters =====

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  // Round to 2 decimals, strip trailing zeros for a clean "6.4%" / "7%".
  return `${parseFloat(value.toFixed(2))}%`;
}

function formatByUnit(value: number | undefined, unit: ScenarioFieldUnit): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  switch (unit) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'years':
      return `${parseFloat(value.toFixed(1))} yr`;
    case 'months':
      return `${Math.round(value)} mo`;
    case 'number':
    default:
      return `${parseFloat(value.toFixed(2))}`;
  }
}

// ===== Field whitelist =====
//
// The complete set of inputs a user can vary. Every field is an equal
// citizen — the diff surfaces whichever ones changed. Dollar/rate duals are
// represented by the RATE side only (canonical) to avoid phantom changes.

interface FieldConfig {
  key: string;
  label: string;
  unit: ScenarioFieldUnit;
  get: (pd: PropertyInput) => number | undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
}

/** Safe nested-object field accessor for loose Record inputs. */
function nested(pd: PropertyInput, parent: string, child: string): unknown {
  const obj = pd[parent];
  return obj && typeof obj === 'object'
    ? (obj as Record<string, unknown>)[child]
    : undefined;
}

const FIELD_CONFIG: FieldConfig[] = [
  // --- Financing & price ---
  { key: 'purchasePrice', label: 'Purchase price', unit: 'currency', get: (pd) => num(pd.purchasePrice) },
  { key: 'downPayment', label: 'Down payment', unit: 'currency', get: (pd) => num(pd.downPayment) },
  { key: 'interestRate', label: 'Interest rate', unit: 'percent', get: (pd) => num(pd.interestRate) },
  { key: 'loanTerm', label: 'Loan term', unit: 'years', get: (pd) => num(pd.loanTerm) },
  // --- Income ---
  { key: 'monthlyRent', label: 'Monthly rent', unit: 'currency', get: (pd) => num(pd.monthlyRent) },
  // --- Operating costs (canonical rate side for the duals) ---
  { key: 'propertyTaxRate', label: 'Property tax rate', unit: 'percent', get: (pd) => num(pd.propertyTaxRate) },
  { key: 'insuranceRate', label: 'Insurance rate', unit: 'percent', get: (pd) => num(pd.insuranceRate) },
  { key: 'propertyManagementRate', label: 'Management rate', unit: 'percent', get: (pd) => num(pd.propertyManagementRate) },
  { key: 'maintenanceCost', label: 'Maintenance', unit: 'currency', get: (pd) => num(pd.maintenanceCost) },
  { key: 'monthlyHOA', label: 'HOA', unit: 'currency', get: (pd) => num(pd.monthlyHOA) },
  { key: 'monthlyUtilities', label: 'Utilities', unit: 'currency', get: (pd) => num(pd.monthlyUtilities) },
  { key: 'monthlyCapEx', label: 'CapEx', unit: 'currency', get: (pd) => num(pd.monthlyCapEx) },
  // --- Up-front costs ---
  { key: 'closingCosts', label: 'Closing costs', unit: 'currency', get: (pd) => num(pd.closingCosts) },
  { key: 'capitalInvestments', label: 'Capital investments', unit: 'currency', get: (pd) => num(pd.capitalInvestments) },
  { key: 'repairCosts', label: 'Repair costs', unit: 'currency', get: (pd) => num(pd.repairCosts) },
  { key: 'afterRepairValue', label: 'After-repair value', unit: 'currency', get: (pd) => num(pd.afterRepairValue) },
  // --- Long-term assumptions (hold, growth, vacancy, exit) ---
  { key: 'longTermAssumptions.projectionYears', label: 'Hold period', unit: 'years', get: (pd) => num(nested(pd, 'longTermAssumptions', 'projectionYears')) },
  { key: 'longTermAssumptions.annualRentIncrease', label: 'Rent growth', unit: 'percent', get: (pd) => num(nested(pd, 'longTermAssumptions', 'annualRentIncrease')) },
  { key: 'longTermAssumptions.annualPropertyValueIncrease', label: 'Appreciation', unit: 'percent', get: (pd) => num(nested(pd, 'longTermAssumptions', 'annualPropertyValueIncrease')) },
  { key: 'longTermAssumptions.inflationRate', label: 'Inflation', unit: 'percent', get: (pd) => num(nested(pd, 'longTermAssumptions', 'inflationRate')) },
  { key: 'longTermAssumptions.vacancyRate', label: 'Vacancy rate', unit: 'percent', get: (pd) => num(nested(pd, 'longTermAssumptions', 'vacancyRate')) },
  { key: 'longTermAssumptions.sellingCostsPercentage', label: 'Selling costs', unit: 'percent', get: (pd) => num(nested(pd, 'longTermAssumptions', 'sellingCostsPercentage')) },
  // --- BRRRR ---
  { key: 'brrrr.rehabBudget', label: 'Rehab budget', unit: 'currency', get: (pd) => num(nested(pd, 'brrrr', 'rehabBudget')) },
  { key: 'brrrr.afterRepairValue', label: 'ARV', unit: 'currency', get: (pd) => num(nested(pd, 'brrrr', 'afterRepairValue')) },
  { key: 'brrrr.refinanceLTV', label: 'Refi LTV', unit: 'percent', get: (pd) => num(nested(pd, 'brrrr', 'refinanceLTV')) },
  { key: 'brrrr.seasoningPeriod', label: 'Seasoning', unit: 'months', get: (pd) => num(nested(pd, 'brrrr', 'seasoningPeriod')) },
  { key: 'brrrr.refinanceInterestRate', label: 'Refi rate', unit: 'percent', get: (pd) => num(nested(pd, 'brrrr', 'refinanceInterestRate')) },
];

// ===== Comparison =====

/** Round to a unit-appropriate precision so float noise isn't a "change". */
function roundForCompare(value: number, unit: ScenarioFieldUnit): number {
  switch (unit) {
    case 'currency':
      return Math.round(value); // whole dollars
    case 'percent':
      return Math.round(value * 100) / 100; // 2 decimals
    case 'years':
      return Math.round(value * 10) / 10; // 1 decimal
    case 'months':
      return Math.round(value);
    case 'number':
    default:
      return Math.round(value * 100) / 100;
  }
}

/**
 * Diff two scenario input sets. Returns only the fields that actually
 * changed, each as a structured ScenarioDelta. Field-agnostic — no input
 * is privileged.
 *
 * @param baseline the reference scenario (typically the original analysis)
 * @param scenario the scenario being compared to the baseline
 */
export function diffScenarioInputs(
  baseline: PropertyInput,
  scenario: PropertyInput
): ScenarioDiff {
  const deltas: ScenarioDelta[] = [];

  for (const cfg of FIELD_CONFIG) {
    const b = cfg.get(baseline);
    const s = cfg.get(scenario);

    // Both absent → no change.
    if (b === undefined && s === undefined) continue;

    // One absent → genuine change (field added/removed).
    if (b === undefined || s === undefined) {
      deltas.push({
        field: cfg.key,
        label: cfg.label,
        unit: cfg.unit,
        baseline: b,
        scenario: s,
        formattedBaseline: formatByUnit(b, cfg.unit),
        formattedScenario: formatByUnit(s, cfg.unit),
        direction: 'changed',
      });
      continue;
    }

    // Both present → compare at unit precision.
    if (roundForCompare(b, cfg.unit) === roundForCompare(s, cfg.unit)) continue;

    deltas.push({
      field: cfg.key,
      label: cfg.label,
      unit: cfg.unit,
      baseline: b,
      scenario: s,
      formattedBaseline: formatByUnit(b, cfg.unit),
      formattedScenario: formatByUnit(s, cfg.unit),
      direction: s > b ? 'up' : 'down',
    });
  }

  return { deltas, changedCount: deltas.length };
}

// ===== Dedup signature =====

/**
 * Stable signature of a scenario's inputs over the diff whitelist. Two
 * scenarios with the same signature are the SAME logical scenario (e.g., an
 * identical re-run). Consumers group by this and keep the latest by
 * timestamp, so minor re-runs don't clutter the scenario list.
 *
 * Built from the same whitelist + unit-rounding as the diff, so "no diff"
 * and "same signature" are guaranteed consistent.
 */
export function scenarioInputSignature(propertyData: PropertyInput): string {
  const parts: string[] = [];
  for (const cfg of FIELD_CONFIG) {
    const v = cfg.get(propertyData);
    parts.push(`${cfg.key}=${v === undefined ? '∅' : roundForCompare(v, cfg.unit)}`);
  }
  // FIELD_CONFIG order is fixed, so the signature is already stable.
  return parts.join('|');
}
