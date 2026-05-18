/**
 * fireCritiqueOnSave — T1 (Day 9a, 2026-05-18)
 *
 * Fire-and-forget background invocation of the adversarial critic, run
 * automatically after a deal is materialized to the user's saved
 * properties — regardless of the deal's score.
 *
 * WHY THIS EXISTS
 * ───────────────
 *
 * From the Business Expert consult (2026-05-18):
 *   "Most retail investors don't lose their first deal because of bad
 *    math. They lose it because nobody told them no."
 *
 * Pre-T1, the adversarial critic only fired on `auto_buy_band` deals
 * (score ≥ 80) or explicit `manual_request`. That misses the deals
 * users save BECAUSE THEY WANT TO DO THEM — even when the score is
 * 65 or 72, exactly the band where confirmation bias kicks in. T1
 * ensures every saved deal gets a 2-persona second opinion, regardless
 * of how the engine scored it.
 *
 * This is the operational realization of the discipline-layer
 * positioning ("the only tool willing to tell you NO"). The critic
 * arguing with every committed deal IS the differentiator.
 *
 * NON-BLOCKING DESIGN
 * ───────────────────
 *
 * Critique is run async / fire-and-forget. Materialization returns
 * immediately so the chat-turn latency stays unchanged. Without this
 * decoupling, every saved deal would add ~5-15s (two Opus calls in
 * parallel) to the chat response — a UX regression that would punish
 * the user for engaging.
 *
 * The critique appears on the SavedDealHero on next page load, fetched
 * via GET /api/deals/:dealId/critique.
 *
 * COST DISCIPLINE
 * ───────────────
 *
 * Auto-firing on every save means ~$0.10–0.30 of Opus cost per deal
 * (two persona runs × per-persona cost). Defense in depth:
 *
 *   - DAILY cap (Phase A, live): platform-wide ceiling protects
 *     against cascade if many users save many deals in one day.
 *     We pre-check the daily cap before firing — if already over,
 *     we skip rather than burn cost on something the orchestrator
 *     would have refused anyway.
 *
 *   - LICENSE cap (Phase B, dormant until chat-route wiring): per-deal
 *     COGS budget. Auto-on-save will be a primary consumer once live.
 *
 *   - Feature flag CRITIQUE_ON_SAVE_ENABLED defaults true; flip to
 *     false to disable globally without redeploy.
 *
 * If the daily cap is over, the critique is SKIPPED (not deferred /
 * retried). The user's deal still saves; they just don't get the
 * critique for that one. Better than queuing and surprising them
 * with cost later.
 *
 * ERROR DISCIPLINE
 * ────────────────
 *
 * This function NEVER throws. It's called from a hot code path
 * (materialization) where any error would compromise the deal save.
 * Failures inside the async body are logged at `error` level and
 * swallowed.
 */

import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { eventsRepository } from '../../repositories/EventsRepository';
import { eventsRepositoryReads } from '../../repositories/EventsRepositoryReads';
// IMPORTANT: do NOT import `toolRegistry` here — it transitively pulls
// in `score_deal` which imports `dealMaterializationService` (the
// caller of THIS file), creating a circular dependency that surfaces
// at module-load time as an undefined-`shape` Zod crash. The critic
// only needs two tools at runtime (render_audit_trail and
// recall_user_context); pass them explicitly via a thin ToolContext
// rather than the global registry.
import type { Tool, ToolContext } from '../tools/types';
import { renderAuditTrail } from '../tools/render_audit_trail';
import { recallUserContext } from '../tools/recall_user_context';
import { logger } from '../../utils/logger';
import { runAdversarialCritic } from './adversarialCriticAgent';
import {
  getDailySpendCents,
  DAILY_CAP_CENTS,
  COST_GUARDS_ENABLED,
} from '../runtime/costGuards';

/** Master kill-switch. Env-overridable; default ON. */
const CRITIQUE_ON_SAVE_ENABLED =
  (process.env.CRITIQUE_ON_SAVE_ENABLED ?? 'true').toLowerCase() === 'true';

export interface FireCritiqueOnSaveInput {
  decisionEventId: Types.ObjectId;
  userId: Types.ObjectId;
  /** Optional — passed through to CritiqueEvent metadata for B2B tracking. */
  institutionId?: Types.ObjectId;
}

/**
 * Trigger an adversarial critique in the background for a just-
 * materialized deal. Returns synchronously (void) — the actual
 * critique runs asynchronously and logs its own outcome.
 *
 * Safe to call when:
 *   - CRITIQUE_ON_SAVE_ENABLED is false → short-circuits, no work done
 *   - daily cost cap is hit          → skips with warn-level log
 *   - the critic itself errors        → logs at error level, swallows
 *
 * In NONE of those failure modes does the calling save flow see an
 * exception. The deal materialization completes; the critique is
 * best-effort.
 */
export function fireCritiqueOnSave(opts: FireCritiqueOnSaveInput): void {
  if (!CRITIQUE_ON_SAVE_ENABLED) {
    logger.debug('[critique-on-save] feature disabled, skipping', {
      decisionEventId: opts.decisionEventId.toHexString(),
    });
    return;
  }

  // Detach from the caller's promise chain. The `void` operator + IIFE
  // is intentional: it tells TS + lint that we DELIBERATELY don't await,
  // and it isolates any rejection from the parent context.
  void (async () => {
    try {
      // Cheap pre-check against the daily cap before paying for two
      // Opus calls. The cost guards do the same check inside the
      // orchestrator's main path; we mirror it here because this code
      // path bypasses the orchestrator entirely.
      if (COST_GUARDS_ENABLED) {
        const dailySpend = await getDailySpendCents();
        if (dailySpend >= DAILY_CAP_CENTS) {
          logger.warn(
            '[critique-on-save] daily cap reached, skipping critique',
            {
              decisionEventId: opts.decisionEventId.toHexString(),
              dailySpend,
              cap: DAILY_CAP_CENTS,
            }
          );
          return;
        }
      }

      // New traceId for the background job — it's its own trace, not
      // an extension of the chat turn that triggered it. CostEvents +
      // CritiqueEvents from the run all share this traceId so the run
      // is auditable end-to-end.
      //
      // Tools: minimal subset the critic needs. We do NOT pass the
      // global toolRegistry (would create a circular import — see file
      // header). The agent's own allowedTools governs which ones get
      // surfaced to the LLM; ctx.tools is just a registry handle for
      // any tool that needs to look up a sibling tool dynamically
      // (none of the critic's tools do).
      const critiqueTools: Record<string, Tool<unknown, unknown>> = {
        render_audit_trail: renderAuditTrail as unknown as Tool<unknown, unknown>,
        recall_user_context: recallUserContext as unknown as Tool<unknown, unknown>,
      };
      const ctx: ToolContext = {
        traceId: randomUUID(),
        userId: opts.userId,
        institutionId: opts.institutionId,
        eventsRepo: eventsRepository,
        eventsReads: eventsRepositoryReads,
        tools: critiqueTools,
      };

      const startMs = Date.now();
      const result = await runAdversarialCritic(
        {
          decisionId: opts.decisionEventId,
          triggerType: 'auto_on_save',
        },
        ctx
      );

      logger.info('[critique-on-save] critique completed', {
        decisionEventId: opts.decisionEventId.toHexString(),
        traceId: ctx.traceId,
        critiqueCount: result.critiques.length,
        totalCostCents: result.totalCostCents,
        durationMs: Date.now() - startMs,
      });
    } catch (err) {
      // Background job — NEVER re-throw. The save flow completed
      // already; this is best-effort enrichment that failed. Log at
      // error level so the failure is observable in ops dashboards.
      logger.error('[critique-on-save] critique failed', {
        decisionEventId: opts.decisionEventId.toHexString(),
        userId: opts.userId.toHexString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}
