/**
 * CostEventRepository — write API for the cost_events collection (W9-S1).
 *
 * Mirrors the substrate EventsRepository pattern: insert-only, Zod-gated,
 * schema-level pre-hooks for defense-in-depth, no update/delete methods.
 *
 * Reads are intentionally NOT in this file yet. Cost dashboards (per-user
 * spend, anomaly detection, cap enforcement) ship as a follow-up story
 * (W9-S2) once the orchestrator is writing CostEvents at every LLM call
 * point. Until then there's nothing to read; building reads against an
 * empty collection is overkill.
 *
 * Per /docs/PRODUCT_2.0_COSTS.md §7.4 (CostEvent schema + lifecycle).
 */

import { Types } from 'mongoose';
import { logger } from '../utils/logger';
import {
  CostEventModel,
  CostEventSchema,
  type CostEventPayload,
} from '../models/cost/CostEvent';

// ===== Write input =====

/**
 * Write input mirrors CostEventPayload, with the timestamp set by the
 * Mongoose default (Date.now). All other fields are caller-supplied so
 * upstream call sites stay explicit about provenance.
 */
export type WriteCostEventInput = CostEventPayload;

// ===== Repository =====

export class CostEventRepository {
  /**
   * Write a CostEvent. Returns the new event's _id.
   *
   * Zod-validates the payload at the trust boundary (same discipline as
   * substrate writes) before passing to Mongoose's strict-mode schema
   * which throws on unknown fields.
   *
   * Logs a debug line per write — useful for tracing exactly which call
   * sites are emitting how much spend during early bring-up. Demote to
   * trace-level once volumes ramp.
   */
  async writeCostEvent(input: WriteCostEventInput): Promise<Types.ObjectId> {
    const validated = CostEventSchema.parse(input);
    const event = await CostEventModel.create({
      traceId: validated.traceId,
      sessionId: validated.sessionId,
      licenseId: validated.licenseId,
      userId: validated.userId,
      institutionId: validated.institutionId,
      costType: validated.costType,
      provider: validated.provider,
      model: validated.model,
      inputTokens: validated.inputTokens,
      outputTokens: validated.outputTokens,
      cachedTokens: validated.cachedTokens,
      costCents: validated.costCents,
      capHit: validated.capHit,
    });

    logger.debug('CostEvent written', {
      traceId: validated.traceId,
      provider: validated.provider,
      model: validated.model,
      costCents: validated.costCents,
      capHit: validated.capHit,
    });

    return event._id as Types.ObjectId;
  }

  // ===== Intentionally NOT exported =====
  //
  // - No updateCostEvent — cost events are append-only.
  // - No deleteCostEvent — same reason.
  // - No bulkWrite — bypasses pre-hooks.
  // - No read API yet — see file header.
}

// Singleton — most consumer code should use this.
export const costEventRepository = new CostEventRepository();
