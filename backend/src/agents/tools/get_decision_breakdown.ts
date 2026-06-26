/**
 * tool:get_decision_breakdown — Task #31 (2026-06-09).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When a user asks the chat agent "how did you arrive at this number?"
 * or "show me the breakdown," the agent previously had NO tool to fetch
 * the underlying line items. It would confabulate a plausible-looking
 * audit trail from training-data patterns + conversation context. The
 * synthesized line items would NOT reconcile to the stated cash flow
 * (verified gap of ~$120/mo on the 1837 Walnut Way test case).
 *
 * Read-only wrapper. Loads the DecisionEvent + its source AnalysisEvent
 * via EventsRepositoryReads.getAuditTrail() and returns a focused, flat
 * shape of the *actual* monthly breakdown — gross rent, vacancy loss,
 * each operating expense line item, mortgage P&I, and net cash flow.
 *
 * THE ARCHITECTURAL POINT
 * -----------------------
 * The agent's instruction is now "never invent a number — call this
 * tool and narrate from the result." That makes the audit-trail
 * narrative deterministic: same decision in → same line items out.
 * Confabulation cannot happen if the data exists; the agent can only
 * report what the engine actually computed.
 *
 * The narration itself is still LLM-generated (the agent chooses which
 * line items to highlight, how to phrase the trade-offs). The NUMBERS
 * are not.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input schema =====

export const GetDecisionBreakdownInputSchema = z.object({
  decisionId: objectIdHex,
});

// z.input so internal callers can pass ObjectId for decisionId.
export type GetDecisionBreakdownInput = z.input<typeof GetDecisionBreakdownInputSchema>;

// ===== Output schema =====

/**
 * Monthly expense line items. Mirrors `ExpenseBreakdown` shape from
 * BasePropertyAnalyzer.getExpenseBreakdown(). Each value is the monthly
 * amount the engine actually computed (not annualized, not a guess).
 *
 * `otherOperating` rolls up the secondary line items (utilities,
 * commonAreaElectricity, landscaping, etc.) that are typically zero for
 * SFR but non-zero for MF — exposing them as a single bucket keeps the
 * shape small for the agent to narrate.
 */
const MonthlyExpensesSchema = z.object({
  propertyTax: z.number(),
  insurance: z.number(),
  maintenance: z.number(),
  propertyManagement: z.number(),
  tenantTurnover: z.number(),
  capEx: z.number(),
  hoa: z.number(),
  utilities: z.number(),
  otherOperating: z.number(),
  totalOperating: z.number(),
  mortgagePayment: z.number(),
  total: z.number(),
});

const PropertyAddressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  })
  .nullable();

export const GetDecisionBreakdownOutputSchema = z.object({
  decisionId: z.string(),
  analysisEventId: z.string(),

  // Issue #203 (2026-06-25) — strategy + BRRRR-specific inputs so the
  // agent narrating a breakdown knows whether to lead with buy-hold
  // framing ("monthly cash flow + cap rate") or BRRRR framing ("monthly
  // cash flow during seasoning + projected refi recovery").
  strategy: z.enum(['buy_hold', 'brrrr']).optional(),
  brrrr: z
    .object({
      rehabBudget: z.number(),
      afterRepairValue: z.number(),
      refinanceLTV: z.number(),
      refinanceInterestRate: z.number(),
      seasoningPeriod: z.number(),
      // Derived for the agent's convenience; matches the BRRRR plan
      // panel in the workspace (#201).
      totalCashDeployed: z.number(),
      refiLoan: z.number(),
      capitalRecoveredAtRefi: z.number(),
      capitalRemaining: z.number(),
      capitalRecoveryPct: z.number(),
      meets70Rule: z.boolean(),
    })
    .optional(),

  property: z.object({
    address: PropertyAddressSchema,
    purchasePrice: z.number(),
    downPayment: z.number(),
    monthlyRent: z.number(),
  }),

  loan: z.object({
    loanAmount: z.number(),
    interestRate: z.number(),
    termYears: z.number(),
    monthlyPayment: z.number(),
  }),

  monthly: z.object({
    grossRent: z.number(),
    vacancyLoss: z.number(),
    effectiveRent: z.number(),
    expenses: MonthlyExpensesSchema,
    netCashFlow: z.number(),
  }),

  metrics: z.object({
    dscr: z.number().nullable(),
    capRate: z.number().nullable(),
    monthlyNOI: z.number(),
  }),
});

export type GetDecisionBreakdownOutput = z.infer<typeof GetDecisionBreakdownOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

/**
 * Read a numeric field from a possibly-undefined nested path. Returns 0
 * when the field is absent or not a finite number — used for legacy
 * AnalysisEvents that predate certain breakdown fields. We default to 0
 * rather than throwing because the engine never recorded the value;
 * surfacing 0 is honest, throwing would be inaccurate.
 */
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Sum the breakdown's "secondary" line items into a single bucket. SFR
 * typically has zero across these; MF has non-zero. Keeping them as one
 * bucket reduces the agent's narrative surface.
 *
 * Excludes line items already surfaced as their own field (utilities,
 * hoa, capEx) — otherwise the tool would double-count them in
 * totalOperating reconciliation.
 */
function sumOtherOperating(b: Record<string, unknown>): number {
  return (
    num(b.commonAreaElectricity) +
    num(b.landscaping) +
    num(b.waterSewer) +
    num(b.garbage) +
    num(b.marketingAndAdvertising) +
    num(b.repairsAndMaintenance) +
    num(b.other)
  );
}

// ===== Tool implementation =====

export const getDecisionBreakdown: Tool<
  GetDecisionBreakdownInput,
  GetDecisionBreakdownOutput
> = {
  name: 'get_decision_breakdown',
  description:
    'Returns the actual line-item monthly breakdown for a scored decision: gross rent, vacancy loss, each operating expense (property tax, insurance, maintenance, mgmt, etc.), mortgage P&I, and net cash flow — pulled from the materialized AnalysisEvent. Pure read. Use this whenever the user asks "how did you arrive at..." / "show me the breakdown" / "where do these numbers come from" — narrate FROM these values rather than inventing line items.',
  inputSchema: GetDecisionBreakdownInputSchema,
  outputSchema: GetDecisionBreakdownOutputSchema as unknown as z.ZodSchema<GetDecisionBreakdownOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetDecisionBreakdownInput,
    ctx: ToolContext
  ): Promise<GetDecisionBreakdownOutput> {
    const validated = GetDecisionBreakdownInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // Reuse the existing named query — getAuditTrail does the
    // DecisionEvent → AnalysisEvent join we need. The overrides /
    // critiques / auditEvents arrays are ignored here; carrying that
    // small extra payload is cheaper than introducing a new named
    // repo method for the same join (per events store §5.1 — every
    // query must be a named method, not a raw passthrough).
    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);

    if (!bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no linked analysis event; ` +
          `cannot return a line-item breakdown. This usually means the analysis ` +
          `event was never written or has been pruned.`
      );
    }

    // ===== Pull from substrate =====

    const analysisPayload = bundle.analysis.payload as unknown as {
      propertyData: Record<string, unknown>;
      metrics: Record<string, unknown>;
      monthlyAnalysis: {
        income?: { gross?: number; effective?: number };
        expenses?: {
          operating?: number;
          debt?: number;
          total?: number;
          breakdown?: Record<string, unknown>;
        };
        cashFlow?: number;
      };
    };
    const propertyData = analysisPayload.propertyData ?? {};
    const monthly = analysisPayload.monthlyAnalysis ?? {};
    const breakdown = monthly.expenses?.breakdown ?? {};

    // ===== Build the focused shape =====

    const grossRent = num(monthly.income?.gross);
    const effectiveRent = num(monthly.income?.effective);
    const vacancyLoss = Math.max(0, grossRent - effectiveRent);

    const totalOperating = num(monthly.expenses?.operating);
    const mortgagePayment = num(monthly.expenses?.debt);
    const totalExpenses = num(monthly.expenses?.total);
    const netCashFlow = num(monthly.cashFlow);

    const purchasePrice = num(propertyData.purchasePrice);
    const downPayment = num(propertyData.downPayment);

    // Loan amount: prefer explicit field if engine recorded one;
    // otherwise derive from purchasePrice - downPayment.
    const loanAmount =
      num(propertyData.loanAmount) ||
      Math.max(0, purchasePrice - downPayment);

    // monthlyNOI: by definition, effectiveRent - operating expenses
    // (excludes debt service). Derived here so the agent doesn't have
    // to recompute it.
    const monthlyNOI = effectiveRent - totalOperating;

    const metrics = analysisPayload.metrics ?? {};

    // Issue #203 (2026-06-25) — strategy + BRRRR-specific fields so
    // the breakdown narration can lead with strategy-appropriate
    // framing (capital recovery for BRRRR, vs cash-on-cash for
    // buy-hold). Derived from substrate propertyData.
    const strategyAny = (propertyData as { investmentStrategy?: unknown })
      .investmentStrategy;
    const strategy: 'buy_hold' | 'brrrr' | undefined =
      strategyAny === 'brrrr' ? 'brrrr' : strategyAny === 'buy_hold' ? 'buy_hold' : undefined;
    let brrrrOut: GetDecisionBreakdownOutput['brrrr'];
    if (strategy === 'brrrr') {
      const brrrrIn = (propertyData as { brrrr?: Record<string, unknown> }).brrrr ?? {};
      const rehabBudget = num(brrrrIn.rehabBudget);
      const arv = num(brrrrIn.afterRepairValue);
      const refinanceLTV = num(brrrrIn.refinanceLTV) || 75;
      const refinanceInterestRate = num(brrrrIn.refinanceInterestRate);
      const seasoningPeriod = num(brrrrIn.seasoningPeriod) || 12;
      const closingCosts = num(propertyData.closingCosts);
      const totalCashDeployed = downPayment + rehabBudget + closingCosts;
      const refiLoan = arv * (refinanceLTV / 100);
      const originalLoanBalance = Math.max(0, purchasePrice - downPayment);
      const capitalRecoveredAtRefi = Math.max(0, refiLoan - originalLoanBalance);
      const capitalRemaining = Math.max(0, totalCashDeployed - capitalRecoveredAtRefi);
      const capitalRecoveryPct =
        totalCashDeployed > 0
          ? Math.min(100, (capitalRecoveredAtRefi / totalCashDeployed) * 100)
          : 0;
      const meets70Rule = arv > 0 ? purchasePrice + rehabBudget <= arv * 0.7 : false;
      brrrrOut = {
        rehabBudget,
        afterRepairValue: arv,
        refinanceLTV,
        refinanceInterestRate,
        seasoningPeriod,
        totalCashDeployed,
        refiLoan,
        capitalRecoveredAtRefi,
        capitalRemaining,
        capitalRecoveryPct,
        meets70Rule,
      };
    }

    const out: GetDecisionBreakdownOutput = {
      decisionId: decisionId.toHexString(),
      analysisEventId:
        (bundle.analysis._id as Types.ObjectId)?.toHexString?.() ??
        String(bundle.analysis._id),
      strategy,
      brrrr: brrrrOut,

      property: {
        address:
          (propertyData.propertyAddress as GetDecisionBreakdownOutput['property']['address']) ??
          null,
        purchasePrice,
        downPayment,
        monthlyRent: num(propertyData.monthlyRent) || grossRent,
      },

      loan: {
        loanAmount,
        interestRate: num(propertyData.interestRate),
        termYears: num(propertyData.loanTerm),
        monthlyPayment: mortgagePayment,
      },

      monthly: {
        grossRent,
        vacancyLoss,
        effectiveRent,
        expenses: {
          propertyTax: num(breakdown.propertyTax),
          insurance: num(breakdown.insurance),
          maintenance: num(breakdown.maintenance),
          propertyManagement: num(breakdown.propertyManagement),
          tenantTurnover: num(breakdown.tenantTurnover),
          capEx: num(breakdown.capEx),
          hoa: num(breakdown.hoa) || num(propertyData.hoaFee) || num(propertyData.hoa),
          utilities: num(breakdown.utilities),
          otherOperating: sumOtherOperating(breakdown),
          totalOperating,
          mortgagePayment,
          total: totalExpenses,
        },
        netCashFlow,
      },

      metrics: {
        dscr:
          typeof metrics.dscr === 'number' && Number.isFinite(metrics.dscr)
            ? (metrics.dscr as number)
            : null,
        capRate:
          typeof metrics.capRate === 'number' && Number.isFinite(metrics.capRate)
            ? (metrics.capRate as number)
            : null,
        monthlyNOI,
      },
    };

    return out;
  },
};
