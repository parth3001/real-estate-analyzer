/**
 * tool:get_license_budget — Task #79 (2026-06-18).
 *
 * THE BUG THIS PREVENTS
 * ---------------------
 * When the user asks "how much have I spent on this deal?" / "what's
 * my budget remaining?" / "am I close to the cost cap?" the agent
 * has no tool to fetch the DealLicense budget state. It would
 * confabulate numbers or claim it doesn't know — both wrong, because
 * the LicenseStatusBadge in the workspace shows this in real time.
 *
 * Returns the active license's budget snapshot: starting budget,
 * cents spent so far, remaining budget, days until expiry. The agent
 * narrates from these exact values so the user knows precisely
 * where they stand on per-property COGS consumption.
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

export const GetLicenseBudgetInputSchema = z.object({
  decisionId: objectIdHex,
});

export type GetLicenseBudgetInput = z.input<typeof GetLicenseBudgetInputSchema>;

// ===== Output schema =====

export const GetLicenseBudgetOutputSchema = z.object({
  decisionId: z.string(),
  hasActiveLicense: z.boolean(),
  /** Identifying the license — useful for ops debug. */
  licenseId: z.string().nullable(),
  /** Cents start (e.g. 200 = $2.00). */
  costBudgetCentsStart: z.number().nullable(),
  /** Cents consumed so far on this license. */
  costSpentCents: z.number().nullable(),
  /** Cents remaining (start − spent). Floored at 0. */
  costRemainingCents: z.number().nullable(),
  /** Percent of budget used (0–100). */
  pctUsed: z.number().nullable(),
  /** Days until license expires. Negative if expired. */
  daysUntilExpiry: z.number().nullable(),
  /** ISO timestamp of expiry. */
  expiresAt: z.string().nullable(),
});

export type GetLicenseBudgetOutput = z.infer<typeof GetLicenseBudgetOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const getLicenseBudget: Tool<
  GetLicenseBudgetInput,
  GetLicenseBudgetOutput
> = {
  name: 'get_license_budget',
  description:
    'Returns the active DealLicense budget state for the property associated with a decision: starting analytical budget, cents spent so far, cents remaining, percent used, and days until expiry. Pure read. Use this whenever the user asks "how much have I spent on this deal?" / "what\'s my budget remaining?" / "am I close to the cost cap?" / "when does my access expire?" — narrate FROM these exact values rather than guessing. If no active license is found, hasActiveLicense=false and the user is on the free tier (no per-deal license consumed).',
  inputSchema: GetLicenseBudgetInputSchema,
  outputSchema: GetLicenseBudgetOutputSchema as unknown as z.ZodSchema<GetLicenseBudgetOutput>,
  invokeLLM: false,
  sideEffects: [],
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: GetLicenseBudgetInput,
    ctx: ToolContext
  ): Promise<GetLicenseBudgetOutput> {
    const validated = GetLicenseBudgetInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // Need property address from the decision's analysis to look up
    // the active license by canonicalized address.
    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);
    if (!bundle.analysis) {
      throw new Error(
        `Decision ${decisionId.toHexString()} has no linked analysis event; cannot look up license budget.`
      );
    }
    const propertyData = (bundle.analysis.payload as { propertyData?: { propertyAddress?: unknown } }).propertyData ?? {};
    const propertyAddress = propertyData.propertyAddress as
      | { street?: string; city?: string; state?: string; zipCode?: string }
      | undefined;
    if (!propertyAddress?.street || !propertyAddress?.city || !propertyAddress?.state) {
      return {
        decisionId: decisionId.toHexString(),
        hasActiveLicense: false,
        licenseId: null,
        costBudgetCentsStart: null,
        costSpentCents: null,
        costRemainingCents: null,
        pctUsed: null,
        daysUntilExpiry: null,
        expiresAt: null,
      };
    }

    const userId = bundle.analysis.userId;

    // Dynamic imports mirror the controller pattern at deals.ts:972 — the
    // license + cost modules carry hot-path code we don't want pulled
    // into every cold-tool registration cycle.
    const { licenseRepository } = await import('../../repositories/LicenseRepository');
    const { getLicenseSpendCents } = await import('../runtime/costGuards');

    const active = await licenseRepository.findActiveForProperty(userId, {
      street: propertyAddress.street,
      city: propertyAddress.city,
      state: propertyAddress.state,
      zipCode: propertyAddress.zipCode,
    });
    if (!active) {
      return {
        decisionId: decisionId.toHexString(),
        hasActiveLicense: false,
        licenseId: null,
        costBudgetCentsStart: null,
        costSpentCents: null,
        costRemainingCents: null,
        pctUsed: null,
        daysUntilExpiry: null,
        expiresAt: null,
      };
    }

    const spent = await getLicenseSpendCents(active._id);
    const start = active.costBudgetCentsStart ?? 0;
    const remaining = Math.max(0, start - spent);
    const pctUsed = start > 0 ? Math.min(100, Math.round((spent / start) * 1000) / 10) : null;
    const daysUntilExpiry = active.expiresAt
      ? Math.round(
          (new Date(active.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      decisionId: decisionId.toHexString(),
      hasActiveLicense: true,
      licenseId: active._id.toString(),
      costBudgetCentsStart: start,
      costSpentCents: Math.round(spent * 100) / 100,
      costRemainingCents: Math.round(remaining * 100) / 100,
      pctUsed,
      daysUntilExpiry,
      expiresAt: active.expiresAt ? new Date(active.expiresAt).toISOString() : null,
    };
  },
};
