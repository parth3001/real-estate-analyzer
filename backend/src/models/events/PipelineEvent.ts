/**
 * PipelineEvent — eleventh wave-1 event type (W1-S2 part 11).
 *
 * **STATUS: Schema ships in wave 1; CAPTURE lights up in wave 1.5**
 * via instrumentation pass on existing pipeline services. See
 * /docs/PRODUCT_2.0_ARCHITECTURE.md §11.5.1.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.11.
 *
 * **Critical alignment:** `pipeline_deal_closed.finalOutcome` is
 * intentionally schema-aligned with OutcomeEvent.outcome. When the
 * outcome capture pipeline activates (wave 2 or 3), a one-time backfill
 * script converts historical `pipeline_deal_closed` events with
 * `finalOutcome: 'closed'` into corresponding OutcomeEvents — seeding
 * the substrate's outcome-validation surface with real data.
 *
 * Uses a DISCRIMINATED UNION on `subType` (same pattern as PortfolioEvent).
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

// ===== Sub-type union =====

/**
 * pipeline_deal_closed.finalOutcome values are aligned with
 * OutcomeEvent.outcome (per file header note above). This enables
 * the future backfill from pipeline-close to outcome-event.
 */
const PipelineFinalOutcomeSchema = z.enum([
  'closed', // Deal closed — aligns with OutcomeEvent.outcome='closed'
  'walked', // User walked away — aligns with OutcomeEvent.outcome='walked'
  'fell_through', // Deal fell through after offer — aligns with OutcomeEvent.outcome='fell_through'
  'expired', // Pipeline entry timed out without action (pipeline-specific)
]);
export type PipelineFinalOutcome = z.infer<typeof PipelineFinalOutcomeSchema>;

export const PipelinePayloadSchema = z.discriminatedUnion('subType', [
  z.object({
    subType: z.literal('deal_added_to_pipeline'),
    pipelineDealId: ObjectIdSchema,
    dealId: ObjectIdSchema,
    stage: z.string().min(1),
  }),
  z.object({
    subType: z.literal('pipeline_stage_changed'),
    pipelineDealId: ObjectIdSchema,
    oldStage: z.string().min(1),
    newStage: z.string().min(1),
    reason: z.string().optional(),
  }),
  z.object({
    subType: z.literal('next_action_set'),
    pipelineDealId: ObjectIdSchema,
    action: z.string().min(1),
    dueDate: z.coerce.date(),
  }),
  z.object({
    subType: z.literal('pipeline_deal_closed'),
    pipelineDealId: ObjectIdSchema,
    finalOutcome: PipelineFinalOutcomeSchema,
  }),
  z.object({
    subType: z.literal('pipeline_note_added'),
    pipelineDealId: ObjectIdSchema,
    noteId: ObjectIdSchema,
  }),
]);

// ===== TypeScript types =====

export type PipelineSubType =
  | 'deal_added_to_pipeline'
  | 'pipeline_stage_changed'
  | 'next_action_set'
  | 'pipeline_deal_closed'
  | 'pipeline_note_added';

export type PipelinePayload = z.infer<typeof PipelinePayloadSchema>;

// ===== Mongoose discriminator =====

const pipelineEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

export const PipelineEventModel = BaseEventModel.discriminator(
  'pipeline',
  pipelineEventSchema
);
