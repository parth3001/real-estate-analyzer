/**
 * AuditTrailEvent — seventh wave-1 event type (W1-S2 part 7).
 *
 * B2B compliance event. Captures audit-relevant actions: PDF exports,
 * audit-trail view renders, sign-offs, committee submissions.
 *
 * Per /docs/PRODUCT_2.0_EVENTS_STORE.md §3.7.
 *
 * The "show me the assumptions" surface in the UI is rendered by querying
 * for this event type alongside the underlying Decision/Analysis/Override
 * events. Every B2B audit-trail consumption produces a trace here —
 * regulators / compliance reviewers can query "who looked at this deal,
 * when, what assumptions they saw."
 */

import { z } from 'zod';
import mongoose, { Schema, Types } from 'mongoose';
import { BaseEventModel } from './BaseEvent';

// ===== Enums =====

const AuditActionSchema = z.enum([
  'export_pdf',
  'view_assumptions',
  'sign_off',
  'submit_to_committee',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

const ExportFormatSchema = z.enum(['pdf', 'csv', 'json']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

// ===== Validators =====

const ObjectIdSchema = z.custom<Types.ObjectId | string>(
  (val) =>
    val instanceof mongoose.Types.ObjectId ||
    (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)),
  { message: 'Expected MongoDB ObjectId or valid 24-char hex ObjectId string' }
);

// ===== Zod payload schema =====

export const AuditTrailPayloadSchema = z.object({
  decisionId: ObjectIdSchema,
  action: AuditActionSchema,

  // Optional fields — depend on the action type
  exportFormat: ExportFormatSchema.optional(),
  viewedAssumptions: z.array(z.string().min(1)).optional(),
  approvedBy: ObjectIdSchema.optional(),
  approvalNote: z.string().optional(),
  recipient: z.string().optional(),
  ipAddress: z.string().optional(),
});

// ===== TypeScript interface =====

export interface AuditTrailPayload {
  decisionId: Types.ObjectId;
  action: AuditAction;
  exportFormat?: ExportFormat;
  viewedAssumptions?: string[];
  approvedBy?: Types.ObjectId;
  approvalNote?: string;
  recipient?: string;
  ipAddress?: string;
}

// ===== Mongoose discriminator =====

const auditTrailEventSchema = new Schema({
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

export const AuditTrailEventModel = BaseEventModel.discriminator(
  'audit_trail',
  auditTrailEventSchema
);
