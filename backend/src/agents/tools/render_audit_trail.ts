/**
 * tool:render_audit_trail — W4-S4.
 *
 * Read-only tool. Wraps EventsRepositoryReads.getAuditTrail() so the
 * agent can answer "show me the assumptions and overrides behind this
 * decision" without bypassing the read API.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.2 and events store §8.4
 * ("one query shape, three surfaces").
 *
 * THE THREE SURFACES
 * ------------------
 *
 * This is the substrate query that powers three product features off
 * the same shape:
 *   1. "Show me the assumptions" view in the chat overlay
 *   2. PDF export bundle (via tool:export_audit_pdf, which calls this
 *      tool internally then renders + emits an AuditTrailEvent)
 *   3. B2B audit-trail UI for credit unions / community banks
 *
 * Centralizing the read here means a new fourth surface (e.g., an
 * email digest) doesn't need its own substrate query — it just calls
 * this tool.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  type Tool,
  type ToolContext,
  DEFAULT_READ_RETRY,
} from './types';

// ===== Input schema =====

export const RenderAuditTrailInputSchema = z.object({
  decisionId: z.union([z.instanceof(Types.ObjectId), z.string()]),
});

export type RenderAuditTrailInput = z.infer<typeof RenderAuditTrailInputSchema>;

// ===== Output schema =====

/**
 * The output mirrors EventsRepositoryReads.AuditTrailBundle but uses
 * shallow z.record at the tool boundary — deep types come from the
 * underlying read API, which the tool returns verbatim.
 */
const EventDocShape = z
  .object({
    _id: z.unknown(),
    traceId: z.string(),
    eventType: z.string(),
    timestamp: z.date(),
    payload: z.record(z.string(), z.unknown()),
  })
  .passthrough();

export const RenderAuditTrailOutputSchema = z.object({
  decision: EventDocShape,
  analysis: EventDocShape.nullable(),
  overrides: z.array(EventDocShape),
  critiques: z.array(EventDocShape),
  auditEvents: z.array(EventDocShape),
});

export type RenderAuditTrailOutput = z.infer<typeof RenderAuditTrailOutputSchema>;

// ===== Helpers =====

function resolveObjectId(raw: Types.ObjectId | string): Types.ObjectId {
  if (raw instanceof Types.ObjectId) return raw;
  if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
    return new Types.ObjectId(raw);
  }
  throw new Error(`Invalid ObjectId: ${String(raw)}`);
}

// ===== Tool implementation =====

export const renderAuditTrail: Tool<RenderAuditTrailInput, RenderAuditTrailOutput> = {
  name: 'render_audit_trail',
  description:
    'Returns the full audit-trail bundle for a decision: the decision itself, its source analysis, all overrides that targeted it, all critiques run against it, and any audit-trail events (sign-offs, exports). Pure read; emits no events. Powers the assumptions view, PDF export, and B2B audit UI.',
  inputSchema: RenderAuditTrailInputSchema,
  outputSchema: RenderAuditTrailOutputSchema as unknown as z.ZodSchema<RenderAuditTrailOutput>,
  invokeLLM: false,
  sideEffects: [], // Pure read
  retrySemantics: DEFAULT_READ_RETRY,

  async execute(
    input: RenderAuditTrailInput,
    ctx: ToolContext
  ): Promise<RenderAuditTrailOutput> {
    const validated = RenderAuditTrailInputSchema.parse(input);
    const decisionId = resolveObjectId(validated.decisionId);

    // Underlying read enforces "no raw query access from controllers /
    // agents" (events store §5.1). All we do is forward.
    const bundle = await ctx.eventsReads.getAuditTrail(decisionId);

    // Cast to the tool's output shape. The read API's typed return
    // already has the right structure; the tool's Zod schema treats
    // event documents as opaque at this boundary (caller can deep-cast
    // back to typed payloads via the underlying read types).
    return bundle as unknown as RenderAuditTrailOutput;
  },
};
