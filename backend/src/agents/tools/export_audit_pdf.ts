/**
 * tool:export_audit_pdf — W4-S8. Last wave-1 tool.
 *
 * Renders the audit-trail bundle for a decision as PDF / CSV / JSON
 * and emits an AuditTrailEvent capturing the export action.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 catalog row:
 *   export_audit_pdf | No | { decisionId, format } |
 *                     { pdfUrl, pdfSizeBytes } | AuditTrailEvent
 *
 * Naming note: the spec name is "export_audit_pdf" but the tool
 * supports three formats per the events store's ExportFormat enum
 * ('pdf' | 'csv' | 'json'). Name preserved for catalog compatibility;
 * "audit export" describes the actual behavior.
 *
 * SUBSTRATE EMISSION = THE ACTUAL DELIVERABLE
 * -------------------------------------------
 *
 * The B2B compliance surface (audit log for credit unions / community
 * banks) needs to know WHO exported WHAT and WHEN. That's the
 * AuditTrailEvent — it's what regulators care about, not the rendered
 * bytes.
 *
 * For wave 1, the rendered content is:
 *   - 'json' — JSON.stringify of the audit-trail bundle (works fully)
 *   - 'csv'  — flat one-row-per-event tabular projection (works fully)
 *   - 'pdf'  — minimal valid PDF wrapper around a text dump of the
 *              bundle (v1 placeholder; sufficient for substrate
 *              emission + downstream delivery testing; real
 *              styled-PDF rendering ships post-wave-1)
 *
 * Content is returned as base64 + a data URL so the chat surface can
 * deliver via temporary blob URL or direct download without needing
 * cloud storage. A future infra story replaces this with S3 + signed
 * URLs; the tool's input/output shape stays stable.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { objectIdHex } from './schemas/objectIdHex';
import {
  type Tool,
  type ToolContext,
  NO_RETRY,
} from './types';

// ===== Input schema =====

const ExportFormatSchema = z.enum(['pdf', 'csv', 'json']);

export const ExportAuditPdfInputSchema = z.object({
  // Task #16 (2026-05-23): strict hex pattern so the LLM-facing JSON
  // schema renders cleanly (the prior z.union collapsed to `{}`).
  decisionId: objectIdHex,
  format: ExportFormatSchema,
});

// Task #16 (2026-05-23): z.input (not z.infer) so internal callers can pass
// a Types.ObjectId for decisionId; the schema's preprocess coerces to hex
// before the regex validates. Other fields keep their narrow types.
export type ExportAuditPdfInput = z.input<typeof ExportAuditPdfInputSchema>;

// ===== Output schema =====

export const ExportAuditPdfOutputSchema = z.object({
  auditTrailEventId: z.custom<Types.ObjectId>(
    (v) => v instanceof Types.ObjectId
  ),
  format: ExportFormatSchema,
  /** Data URL the chat surface can deliver as a download. */
  pdfUrl: z.string().min(1),
  /** Byte length of the rendered content (real, not base64). */
  pdfSizeBytes: z.number().int().nonnegative(),
  /** Base64 of the rendered content. Convenient for tests + delivery. */
  contentBase64: z.string(),
  /** MIME type — matches `format`. */
  contentType: z.string(),
});

export type ExportAuditPdfOutput = z.infer<typeof ExportAuditPdfOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

function mimeTypeFor(format: 'pdf' | 'csv' | 'json'): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
  }
}

// ===== Renderers =====

/** Stringify the bundle as pretty JSON. */
function renderJson(bundle: unknown): Buffer {
  return Buffer.from(JSON.stringify(bundle, null, 2), 'utf8');
}

/**
 * Flatten the bundle to CSV: one row per event across all the
 * audit-trail categories (decision, analysis, overrides, critiques,
 * audit_trail). Payload is JSON-stringified into a single column
 * because columnar payload flattening across heterogeneous event
 * shapes is unreasonable; the consumer (analyst / regulator)
 * typically wants "what happened in order" not column-aligned data.
 */
function renderCsv(bundle: {
  decision: { _id: unknown; timestamp: Date; traceId: string; payload: unknown };
  analysis: { _id: unknown; timestamp: Date; traceId: string; payload: unknown } | null;
  overrides: Array<{ _id: unknown; timestamp: Date; traceId: string; payload: unknown }>;
  critiques: Array<{ _id: unknown; timestamp: Date; traceId: string; payload: unknown }>;
  auditEvents: Array<{ _id: unknown; timestamp: Date; traceId: string; payload: unknown }>;
}): Buffer {
  const rows: string[] = [];
  rows.push('eventType,timestamp,_id,traceId,payload_json');

  function pushRow(eventType: string, evt: {
    _id: unknown;
    timestamp: Date;
    traceId: string;
    payload: unknown;
  }): void {
    const ts = evt.timestamp instanceof Date
      ? evt.timestamp.toISOString()
      : String(evt.timestamp);
    const payloadJson = JSON.stringify(evt.payload).replace(/"/g, '""');
    rows.push(`${eventType},${ts},${String(evt._id)},${evt.traceId},"${payloadJson}"`);
  }

  pushRow('decision', bundle.decision);
  if (bundle.analysis) pushRow('analysis', bundle.analysis);
  for (const o of bundle.overrides) pushRow('override', o);
  for (const c of bundle.critiques) pushRow('critique', c);
  for (const a of bundle.auditEvents) pushRow('audit_trail', a);

  return Buffer.from(rows.join('\n') + '\n', 'utf8');
}

/**
 * V1 PDF renderer — wraps a JSON dump in a minimal valid PDF
 * structure. Sufficient for substrate emission and for the chat
 * surface to deliver as a download. Real styled-PDF rendering
 * (decision summary header, factor breakdown table, override
 * timeline, sign-off section) ships post-wave-1; the tool's API
 * stays stable.
 *
 * The PDF below renders a single text page with the bundle JSON.
 * Hand-crafted (no PDF lib dependency) because the wave-1 substrate
 * deliverable is the AuditTrailEvent emission, not the rendering
 * polish — and adding pdfkit/jspdf for a placeholder is wasteful.
 */
function renderPdfPlaceholder(bundle: unknown): Buffer {
  const text = JSON.stringify(bundle, null, 2);
  // Escape PDF-special chars in the text stream
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ') Tj T* (');

  const stream = `BT\n/F1 8 Tf\n50 750 Td\n14 TL\n(REanalyzr Audit Trail — wave-1 placeholder render) Tj T*\n(${escaped}) Tj\nET`;
  const streamLength = Buffer.byteLength(stream, 'utf8');

  // Minimal single-page PDF with a single text stream.
  // Object offsets are computed below for the xref table.
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += obj;
  }

  const xrefOffset = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (const off of offsets) {
    body += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, 'utf8');
}

// ===== Tool implementation =====

export const exportAuditPdf: Tool<ExportAuditPdfInput, ExportAuditPdfOutput> = {
  name: 'export_audit_pdf',
  description:
    'Exports a decision audit trail as PDF / CSV / JSON and emits an AuditTrailEvent. The substrate event is the actual compliance deliverable; the rendered content is delivered to the user as a data URL for download.',
  inputSchema: ExportAuditPdfInputSchema,
  outputSchema: ExportAuditPdfOutputSchema,
  invokeLLM: false,
  sideEffects: [{ type: 'event', eventType: 'audit_trail' }],
  retrySemantics: NO_RETRY,

  async execute(
    input: ExportAuditPdfInput,
    ctx: ToolContext
  ): Promise<ExportAuditPdfOutput> {
    // Task #16: objectIdHex.preprocess handles ObjectId → hex inside parse.
    const validated = ExportAuditPdfInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // ===== 1. Load the audit-trail bundle =====
    //
    // We call eventsReads directly rather than going through
    // tool:render_audit_trail. Reasons:
    //   - Avoids a tool-from-tool indirection that adds no value
    //     (no events written by render_audit_trail; same underlying
    //     read either way)
    //   - Keeps the runtime tool graph shallow (orchestrator-level
    //     concern: tools that depend on tools are harder to reason
    //     about for retry / cancellation policies)
    //   - Throws naturally via the read API if decisionId is invalid
    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);

    // ===== 2. Render to the requested format =====

    let content: Buffer;
    switch (validated.format) {
      case 'json':
        content = renderJson(bundle);
        break;
      case 'csv':
        content = renderCsv(bundle);
        break;
      case 'pdf':
        content = renderPdfPlaceholder(bundle);
        break;
    }

    const contentType = mimeTypeFor(validated.format);
    const contentBase64 = content.toString('base64');
    const pdfUrl = `data:${contentType};base64,${contentBase64}`;

    // ===== 3. Emit AuditTrailEvent =====
    //
    // actorType is 'user' — the export is a user action (initiated
    // from the chat surface or audit-trail UI). The tool is just the
    // mechanism; the audit log answers "who exported this?"
    const auditTrailEventId = await ctx.eventsRepo.writeAuditTrailEvent({
      traceId: ctx.traceId,
      actorType: 'user',
      userId: ctx.userId,
      institutionId: ctx.institutionId,
      payload: {
        decisionId,
        action: 'export_pdf',
        exportFormat: validated.format,
      },
    });

    return {
      auditTrailEventId,
      format: validated.format,
      pdfUrl,
      pdfSizeBytes: content.byteLength,
      contentBase64,
      contentType,
    };
  },
};
