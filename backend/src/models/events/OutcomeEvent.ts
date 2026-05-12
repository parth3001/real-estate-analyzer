/**
 * OutcomeEvent — ninth wave-1 event type (W1-S2 part 9).
 *
 * **STATUS: Schema ships in wave 1; CAPTURE PIPELINE deferred** to wave 2+
 * per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.9. The shape is locked from
 * day one so when capture lights up (B2B LOS integration, retail
 * follow-up surveys, founder personal reporting), the data model is
 * already there with no migration pain.
 *
 * Architectural role:
 *   - Long-horizon ground truth — was the engine's prediction right?
 *   - Highest-leverage substrate event (when populated) — outcome data
 *     validates calibration; competitors can't backfill 18 months of
 *     closed-deal outcomes
 *   - Feeds Tier 3 moat value per the substrate doc (per-decision
 *     validation against actual performance)
 *
 * Cross-link: PipelineEvent.pipeline_deal_closed (§3.11) is the
 * lowest-friction precursor — a one-time backfill script can convert
 * historical close events to OutcomeEvents when the capture pipeline
 * activates.
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const OutcomeTypeSchema = z.enum([
  'closed',
  'passed',
  'walked',
  'fell_through',
  'defaulted',
]);
export type OutcomeType = z.infer<typeof OutcomeTypeSchema>;

const ReportedBySchema = z.enum([
  'self', // User self-reports via follow-up survey or settings
  'b2b_los_integration', // B2B pilot LOS integration push
  'survey_followup', // 6/12/24-month survey response
]);
export type ReportedBy = z.infer<typeof ReportedBySchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

const FinancialDeltaSchema = z.object({
  actualVsProjectedNOI: z.number().optional(),
  actualVsProjectedCashFlow: z.number().optional(),
  holdingPeriodMonths: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  exitIRR: z.number().optional(),
});

// ===== Zod payload schema =====

export const OutcomePayloadSchema = z.object({
  dealId: ObjectIdSchema,
  originalDecisionId: ObjectIdSchema,
  outcome: OutcomeTypeSchema,
  outcomeDate: z.coerce.date(), // accepts Date instance or ISO string
  reportedBy: ReportedBySchema,
  financialDelta: FinancialDeltaSchema.optional(),
  notes: z.string().optional(),
});

// ===== TypeScript interface =====

export interface OutcomePayload {
  dealId: Types.ObjectId;
  originalDecisionId: Types.ObjectId;
  outcome: OutcomeType;
  outcomeDate: Date;
  reportedBy: ReportedBy;
  financialDelta?: {
    actualVsProjectedNOI?: number;
    actualVsProjectedCashFlow?: number;
    holdingPeriodMonths?: number;
    salePrice?: number;
    exitIRR?: number;
  };
  notes?: string;
}

// ===== Mongoose discriminator =====

const outcomeEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

export const OutcomeEventModel = BaseEventModel.discriminator(
  'outcome',
  outcomeEventSchema
);
