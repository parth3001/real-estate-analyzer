/**
 * costGuards — runtime cost ceilings for the agent mesh (Issue #106).
 *
 * Layers shipped:
 *
 *   1. Per-turn cap (Phase A)       — enforced INSIDE the agent runner via
 *                                     maxTokensPerCall (≤ 2000) + maxTurns
 *                                     (≤ 8). Lives in agentRunner.ts.
 *   2. Per-session cap (Phase A)    — sum of CostEvents.costCents for a
 *                                     sessionId must stay below
 *                                     COST_CAP_SESSION_CENTS (default
 *                                     $1.00 = 100¢). Checked here.
 *   3. Per-license cap (Phase B)    — sum of CostEvents.costCents tagged
 *                                     with a DealLicense.licenseId must
 *                                     stay below COST_CAP_LICENSE_CENTS
 *                                     (default $2.00 = 200¢ — the COGS
 *                                     budget on a $4.99 license per
 *                                     Issue #105). Checked here when a
 *                                     licenseId is present on the input.
 *   4. Global daily cap (Phase A)   — sum of CostEvents.costCents for
 *                                     the current UTC day must stay
 *                                     below COST_CAP_DAILY_CENTS
 *                                     (default $20.00 = 2000¢).
 *
 * Phase C will add: per-IP cap (anon Layer-1 abuse) and anomaly alert.
 *
 * DESIGN NOTE — fail-closed, but with a friendly user-facing message
 * --------------------------------------------------------------------
 *
 * When a cap is hit, the orchestrator surfaces a tactful explanation
 * (NOT a stack trace) and skips the LLM call entirely. The Haiku
 * classifier is small (~$0.002/turn) but still costs real money under
 * abuse; guarding BEFORE the classifier is the only way to stop the
 * runaway-spend scenario the issue tracker calls out.
 *
 * READ COST
 * ---------
 *
 * Each guard does one indexed aggregate query against `cost_events`.
 * Session cap: `{ sessionId } → sum(costCents)` — sub-ms with the
 * sparse `{ sessionId: 1, timestamp: 1 }` index added on CostEvent.
 * Daily cap: `{ timestamp >= startOfDay() } → sum(costCents)` — uses
 * the existing `{ timestamp: -1 }` index. For high QPS we'll add a
 * Redis counter in Phase B, but at beta volumes the mongo query is
 * fine.
 */

import { Types } from 'mongoose';
import { CostEventModel } from '../../models/cost/CostEvent';
import { logger } from '../../utils/logger';
import { isBillingEnabled } from '../../config/billing';

// ===== Configuration =====
//
// Read once at module init. Env vars let ops dial caps up/down without
// a code deploy — useful when we want to relax for a specific test or
// tighten in response to an abuse incident.

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    logger.warn(`costGuards: invalid ${name} env var, using default`, {
      raw,
      fallback,
    });
    return fallback;
  }
  return n;
}

/** Per-session cap. Default $1.00 (100 cents). */
export const SESSION_CAP_CENTS = readNumberEnv('COST_CAP_SESSION_CENTS', 100);

/**
 * Per-license cap (Phase B). Default $2.00 = 200¢ — the COGS budget on
 * a $4.99 license. When this fires, the license is also auto-expired
 * by the orchestrator (status: active → expired) so subsequent turns
 * don't keep paying the classifier.
 */
export const LICENSE_CAP_CENTS = readNumberEnv('COST_CAP_LICENSE_CENTS', 200);

/** Global daily cap. Default $20.00 (2000 cents). */
export const DAILY_CAP_CENTS = readNumberEnv('COST_CAP_DAILY_CENTS', 2000);

/**
 * Master switch. When false, the guards short-circuit to "allowed" so
 * dev/test environments can exercise full flows without standing up the
 * cost-tracking infrastructure. Defaults to ENABLED in production.
 */
export const COST_GUARDS_ENABLED =
  (process.env.COST_GUARDS_ENABLED ?? 'true').toLowerCase() === 'true';

// ===== Error type =====

export type CostCapKind = 'session' | 'license' | 'daily';

/**
 * Thrown by `assertWithinCaps`. The orchestrator catches this and
 * converts to a user-facing message ("you've used today's free
 * allotment for this session — see /pricing"). NEVER surface the raw
 * dollar figures to the user; the message in `userFacingMessage` is
 * tuned for the surface.
 */
export class CostCapExceededError extends Error {
  readonly kind: CostCapKind;
  readonly spentCents: number;
  readonly capCents: number;
  readonly userFacingMessage: string;

  constructor(opts: {
    kind: CostCapKind;
    spentCents: number;
    capCents: number;
    userFacingMessage: string;
  }) {
    super(
      `costGuards: ${opts.kind} cap exceeded — spent ${opts.spentCents.toFixed(
        2
      )}¢ of ${opts.capCents}¢`
    );
    this.name = 'CostCapExceededError';
    this.kind = opts.kind;
    this.spentCents = opts.spentCents;
    this.capCents = opts.capCents;
    this.userFacingMessage = opts.userFacingMessage;
  }
}

// ===== Aggregate queries =====

/**
 * Sum of cost (cents) across all CostEvents for a given session.
 * Returns 0 if no events. Indexed: `{ sessionId: 1, timestamp: 1 }`.
 */
export async function getSessionSpendCents(sessionId: string): Promise<number> {
  if (!sessionId) return 0;
  const result = await CostEventModel.aggregate<{ total: number }>([
    { $match: { sessionId } },
    { $group: { _id: null, total: { $sum: '$costCents' } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * Sum of cost (cents) across all CostEvents for a given DealLicense.
 * Returns 0 if no events. Indexed: `{ licenseId: 1, timestamp: 1 }`.
 *
 * Used by Phase B's per-license cap — the $2 COGS budget on a $4.99
 * license. When this aggregate crosses LICENSE_CAP_CENTS, the
 * orchestrator surfaces the cap message AND auto-expires the license
 * so subsequent turns don't keep paying for retries on a dead license.
 */
export async function getLicenseSpendCents(
  licenseId: Types.ObjectId | string
): Promise<number> {
  if (!licenseId) return 0;
  // Aggregate matches the licenseId as an ObjectId — cast strings.
  const idAsObject =
    typeof licenseId === 'string' ? new Types.ObjectId(licenseId) : licenseId;
  const result = await CostEventModel.aggregate<{ total: number }>([
    { $match: { licenseId: idAsObject } },
    { $group: { _id: null, total: { $sum: '$costCents' } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * Sum of cost (cents) across all CostEvents emitted since UTC midnight
 * today. Uses the `{ timestamp: -1 }` index.
 *
 * UTC was chosen over server-local time because:
 *   - Multi-region deploys won't see ambiguous "today"
 *   - Ops dashboards (Datadog, Grafana) default to UTC
 *   - Aligns with how Anthropic bills (UTC days)
 */
export async function getDailySpendCents(): Promise<number> {
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);
  const result = await CostEventModel.aggregate<{ total: number }>([
    { $match: { timestamp: { $gte: startOfDayUtc } } },
    { $group: { _id: null, total: { $sum: '$costCents' } } },
  ]);
  return result[0]?.total ?? 0;
}

// ===== Guard =====

export interface AssertWithinCapsInput {
  sessionId: string;
  userId: Types.ObjectId;
  /**
   * License the current turn is being applied against. Present when
   * the chat surface (or orchestrator) has resolved an active
   * DealLicense for the property in scope. Absent for free-tier turns;
   * the per-license cap is skipped in that case (session + daily caps
   * still apply).
   */
  licenseId?: Types.ObjectId | string;
  /** For correlated logging. Optional. */
  traceId?: string;
}

/**
 * Throws CostCapExceededError if any cap is over budget. Order:
 *   1. Per-session cap   — cheapest, fires first
 *   2. Per-license cap   — only when a licenseId is provided
 *   3. Global daily cap  — checked last (ops protection)
 *
 * All three reads run in parallel for latency; the order above is
 * the THROW order (which kind we surface when multiple are over).
 *
 * The orchestrator should call this BEFORE the Haiku classifier —
 * otherwise a runaway user racks up ~$0.002/turn × thousands of
 * retries before we notice.
 */
export async function assertWithinCaps(input: AssertWithinCapsInput): Promise<void> {
  if (!COST_GUARDS_ENABLED) return;

  const [sessionSpend, licenseSpend, dailySpend] = await Promise.all([
    getSessionSpendCents(input.sessionId),
    input.licenseId ? getLicenseSpendCents(input.licenseId) : Promise.resolve(0),
    getDailySpendCents(),
  ]);

  if (sessionSpend >= SESSION_CAP_CENTS) {
    logger.warn('costGuards: session cap exceeded', {
      sessionId: input.sessionId,
      userId: input.userId.toString(),
      traceId: input.traceId,
      spentCents: sessionSpend,
      capCents: SESSION_CAP_CENTS,
    });
    throw new CostCapExceededError({
      kind: 'session',
      spentCents: sessionSpend,
      capCents: SESSION_CAP_CENTS,
      userFacingMessage: isBillingEnabled()
        ? "You've reached the chat usage limit for this session. " +
          'Start a new conversation, or pick up a Deal License at /pricing ' +
          'for unlimited deep-dive analysis.'
        : "You've reached the chat usage limit for this session. " +
          'Start a new conversation to keep going.',
    });
  }

  if (input.licenseId && licenseSpend >= LICENSE_CAP_CENTS) {
    logger.warn('costGuards: license cap exceeded', {
      licenseId: input.licenseId.toString(),
      userId: input.userId.toString(),
      traceId: input.traceId,
      spentCents: licenseSpend,
      capCents: LICENSE_CAP_CENTS,
    });
    throw new CostCapExceededError({
      kind: 'license',
      spentCents: licenseSpend,
      capCents: LICENSE_CAP_CENTS,
      userFacingMessage: isBillingEnabled()
        ? "You've used the full analytical budget for this property. " +
          'License a new property at /pricing, or open one of your other ' +
          'saved deals to keep going.'
        : "You've used the full analytical budget for this property. " +
          'Open one of your other saved deals to keep going.',
    });
  }

  if (dailySpend >= DAILY_CAP_CENTS) {
    logger.error('costGuards: GLOBAL DAILY CAP EXCEEDED', {
      userId: input.userId.toString(),
      traceId: input.traceId,
      spentCents: dailySpend,
      capCents: DAILY_CAP_CENTS,
    });
    throw new CostCapExceededError({
      kind: 'daily',
      spentCents: dailySpend,
      capCents: DAILY_CAP_CENTS,
      userFacingMessage:
        "We're experiencing unusually high demand right now. " +
        'Chat will resume shortly. In the meantime your saved analyses ' +
        'are unaffected.',
    });
  }
}

// ===== Diagnostics helper =====
//
// Exposed for tests + a future /admin/cost-snapshot endpoint. Returns
// the current spend numbers without throwing, so callers can decide
// what to do with them (display in a banner, gate a UI feature, etc.).

export interface CostSnapshot {
  sessionSpendCents: number;
  /** Present only when a licenseId was passed to getCostSnapshot. */
  licenseSpendCents?: number;
  dailySpendCents: number;
  sessionCapCents: number;
  licenseCapCents: number;
  dailyCapCents: number;
  guardsEnabled: boolean;
}

export async function getCostSnapshot(
  sessionId: string,
  licenseId?: Types.ObjectId | string
): Promise<CostSnapshot> {
  const [sessionSpend, licenseSpend, dailySpend] = await Promise.all([
    getSessionSpendCents(sessionId),
    licenseId ? getLicenseSpendCents(licenseId) : Promise.resolve(undefined),
    getDailySpendCents(),
  ]);
  return {
    sessionSpendCents: sessionSpend,
    licenseSpendCents: licenseSpend,
    dailySpendCents: dailySpend,
    sessionCapCents: SESSION_CAP_CENTS,
    licenseCapCents: LICENSE_CAP_CENTS,
    dailyCapCents: DAILY_CAP_CENTS,
    guardsEnabled: COST_GUARDS_ENABLED,
  };
}
