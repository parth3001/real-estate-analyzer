/**
 * tool:get_tax_education_context — Task #80 (2026-06-18).
 *
 * Returns the STANDARD tax considerations for U.S. real estate
 * investment in EDUCATIONAL form — NOT computed tax liability.
 * Includes the property's purchase price + estimated depreciation
 * basis for context, plus the relevant rates/rules/concepts, plus
 * the mandatory CPA-consult disclaimer.
 *
 * Why this is read-only and educational:
 *   - Actual tax liability depends on the user's filing status,
 *     state of residence, entity structure (LLC / S-corp / etc.),
 *     other income / passive activity rules, AT-risk rules, NIIT,
 *     AMT, prior-year carryovers, and 50+ other inputs the engine
 *     doesn't have.
 *   - Per CLAUDE.md Tax Expert persona: "Platform cannot provide tax
 *     advice — only educational calculations."
 *   - Per ToS draft §11: tax calcs are educational only; consult CPA.
 *
 * The agent uses this tool to ground tax-related narration in
 * standard rates + rules (so it doesn't quote wrong percentages) and
 * to surface the disclaimer language consistently.
 *
 * Closes confabulation on: "what's the depreciation impact?" /
 * "explain Section 1031" / "what's the optimal hold period for
 * after-tax IRR?" / "how does recapture work?".
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input =====

export const GetTaxEducationContextInputSchema = z.object({
  decisionId: objectIdHex,
  /**
   * Optional land-value percentage (default 20%) used to derive the
   * depreciable basis. Land is NOT depreciable per IRS rules.
   */
  landValuePct: z.number().min(0).max(60).optional(),
});

export type GetTaxEducationContextInput = z.input<typeof GetTaxEducationContextInputSchema>;

// ===== Output =====

export const GetTaxEducationContextOutputSchema = z.object({
  decisionId: z.string(),
  purchasePrice: z.number(),
  /** 20% default — IRS allocation between land/improvements varies; this is a typical starting estimate. */
  landValuePct: z.number(),
  /** Purchase price × (1 − landValuePct). Land is NOT depreciable. */
  depreciableBasis: z.number(),
  /** 27.5-year straight-line per IRS Section 168 for residential rentals. */
  annualDepreciation: z.number(),

  /** Standard rates the agent should cite. */
  standardRates: z.object({
    residentialDepreciationYears: z.number(),  // 27.5
    depreciationRecaptureRate: z.number(),     // 25% (Section 1250)
    longTermCapitalGainsBrackets: z.array(z.object({
      label: z.string(),
      rate: z.number(),
    })),
    netInvestmentIncomeTaxRate: z.number(),    // 3.8% NIIT
  }),

  /**
   * Standard concepts the agent should explain when asked. Each
   * entry is a key concept with a one-sentence definition the agent
   * can lean on without paraphrasing into something inaccurate.
   */
  concepts: z.array(z.object({
    name: z.string(),
    summary: z.string(),
  })),

  /** MANDATORY disclaimer the agent MUST include in every tax response. */
  mandatoryDisclaimer: z.string(),
});

export type GetTaxEducationContextOutput = z.infer<typeof GetTaxEducationContextOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool =====

export const getTaxEducationContext: Tool<
  GetTaxEducationContextInput,
  GetTaxEducationContextOutput
> = {
  name: 'get_tax_education_context',
  description:
    "Returns EDUCATIONAL tax context for a property — standard IRS rates (27.5yr residential depreciation, 25% Section 1250 depreciation recapture, current long-term capital gains brackets, 3.8% NIIT), depreciable-basis estimate from the property's purchase price + a typical 20% land allocation, plus definitions of key concepts (depreciation, recapture, Section 1031 exchange, capital gains, passive activity losses, NIIT). DOES NOT compute the user's actual tax liability — that requires their filing status, state, entity, prior-year carryovers, and 50+ other inputs the platform doesn't have. Use this whenever the user asks 'what's the depreciation impact?' / 'explain Section 1031' / 'how does recapture work?' / 'what's the optimal hold period for after-tax IRR?' — narrate FROM the standard rates and concepts, INCLUDE the mandatoryDisclaimer in your response, and ALWAYS recommend a CPA for actual tax planning. Per platform Terms §11: tax content is educational only; never give tax advice.",
  inputSchema: GetTaxEducationContextInputSchema,
  outputSchema: GetTaxEducationContextOutputSchema as unknown as z.ZodSchema<GetTaxEducationContextOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetTaxEducationContextInput,
    ctx: ToolContext
  ): Promise<GetTaxEducationContextOutput> {
    const validated = GetTaxEducationContextInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);
    if (!bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no linked analysis event; cannot return tax context.`
      );
    }
    const purchasePrice =
      ((bundle.analysis.payload as unknown) as { propertyData?: { purchasePrice?: number } })
        .propertyData?.purchasePrice ?? 0;

    const landValuePct = validated.landValuePct ?? 0.20;
    const depreciableBasis = purchasePrice * (1 - landValuePct);
    const annualDepreciation = depreciableBasis / 27.5;

    return {
      decisionId: decisionId.toHexString(),
      purchasePrice,
      landValuePct,
      depreciableBasis,
      annualDepreciation,
      standardRates: {
        residentialDepreciationYears: 27.5,
        depreciationRecaptureRate: 0.25,
        longTermCapitalGainsBrackets: [
          { label: '0% (low-bracket)', rate: 0.00 },
          { label: '15% (most middle/high earners)', rate: 0.15 },
          { label: '20% (high earners)', rate: 0.20 },
        ],
        netInvestmentIncomeTaxRate: 0.038,
      },
      concepts: [
        {
          name: 'Depreciation',
          summary:
            "Residential rentals are depreciated straight-line over 27.5 years per IRS Section 168. Annual deduction is the depreciable basis (purchase price minus land value) divided by 27.5. Reduces taxable income year-over-year.",
        },
        {
          name: 'Depreciation Recapture',
          summary:
            "On sale, ALL prior depreciation taken is recaptured at a flat 25% (Section 1250) — regardless of your ordinary income bracket. This is on top of capital gains tax on appreciation.",
        },
        {
          name: 'Capital Gains',
          summary:
            "Long-term (held >1 year) capital gains on real estate are taxed at 0%/15%/20% depending on bracket. Short-term (held ≤1 year) are taxed at ordinary income rates. Hold period is a major lever for after-tax return.",
        },
        {
          name: 'Section 1031 Exchange',
          summary:
            "Defer capital gains + recapture by exchanging into a like-kind property within 45 days (identify) + 180 days (close). Real-estate-for-real-estate is broad; primary residence excluded. Strict timeline rules — miss them, lose the deferral.",
        },
        {
          name: 'Passive Activity Losses (PAL)',
          summary:
            "Rental losses are generally 'passive' and can only offset passive income — not W-2 income. Exception: $25K of losses can offset ordinary income if AGI <$100K (phases out at $150K). Real estate professionals (750+ hours, >50% of work) escape PAL.",
        },
        {
          name: 'Net Investment Income Tax (NIIT)',
          summary:
            "Additional 3.8% on net rental income for filers with AGI >$200K single / $250K married. Stacks on top of regular income tax. Often overlooked in rental cash flow projections.",
        },
        {
          name: 'Optimal Hold Period',
          summary:
            "Pre-tax IRR usually rises with hold period as appreciation compounds; after-tax IRR is more nuanced because depreciation deductions accumulate (more recapture at exit) and selling-cost amortization improves. There's no universal 'optimal' — depends on the user's tax bracket, recapture exposure, and reinvestment alternatives. ALWAYS recommend CPA modeling for this question.",
        },
      ],
      mandatoryDisclaimer:
        "This is educational only — not tax advice. Actual tax impact depends on your filing status, state of residence, entity structure, other income, prior-year carryovers, AMT/NIIT exposure, and details only a licensed CPA can assess. ALWAYS consult a qualified CPA before making decisions based on tax expectations.",
    };
  },
};
