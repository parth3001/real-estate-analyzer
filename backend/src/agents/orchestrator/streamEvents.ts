/**
 * Orchestrator stream events — W6-S3.
 *
 * Discriminated union of everything `orchestrator.streamTurn()` yields
 * to the SSE route handler, which serializes each event as a single
 * `data: <json>\n\n` SSE frame to the browser.
 *
 * Wire contract (single source of truth — frontend mirrors this):
 *
 *   routing           — sent ONCE at the start, before any text. Tells
 *                       the UI which path was taken (deal-scoring vs
 *                       qa vs deflection vs tool-only).
 *   text_delta        — incremental text chunks from the LLM. The UI
 *                       appends them to the live assistant bubble.
 *                       For non-streamable paths (tool-only, off-topic
 *                       deflection) a single text_delta with the full
 *                       payload is emitted — protocol stays uniform.
 *   tool_call         — best-effort UX hint when an agent invokes a
 *                       tool ("Calling score_deal..."). Sent AFTER the
 *                       tool completes so we know the name + outcome.
 *   structured_output — reserved for W6-S4: a JSON payload the UI
 *                       should render as a structured card (DealScoreCard,
 *                       AuditTrail, etc.). Not emitted in S3.
 *   done              — sent ONCE at the end of a successful turn,
 *                       carries the trace + persistence IDs the UI
 *                       needs for follow-up actions (save, share).
 *   error             — fatal failure mid-stream. Carries a generic
 *                       message — internal detail stays in logs.
 *   cancelled         — client closed the connection mid-stream OR
 *                       called .abort() on the SDK call. Carries the
 *                       partial text + the partial-cost CostEvent IDs
 *                       so substrate accounting stays honest.
 */

export type OrchestratorStreamEvent =
  | {
      type: 'routing';
      target: string;
      routedTo: string;
      classifierIntent: string;
      classifierConfidence: number;
      fallbackReason?: 'low_confidence' | 'classifier_fallback';
    }
  | {
      type: 'text_delta';
      text: string;
    }
  | {
      type: 'tool_call';
      toolName: string;
      success: boolean;
      /** Milliseconds the tool ran. */
      durationMs: number;
    }
  | {
      /**
       * Reserved for W6-S4. The `kind` field tells the UI which renderer
       * to mount; `data` is the typed payload the renderer needs. The
       * shape is intentionally open here — each renderer in the frontend
       * narrows it via its own type guard. Not emitted in W6-S3 itself.
       */
      type: 'structured_output';
      kind: string;
      data: Record<string, unknown>;
    }
  | {
      type: 'done';
      traceId: string;
      conversationEventId: string;
      relatedEventIds: string[];
      totalCostCents: number;
      agentStubbed: boolean;
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'cancelled';
      /** Partial text emitted before cancellation, if any. */
      partialText: string;
      /** Trace + persistence IDs IF substrate write completed before cancel. */
      traceId: string;
      conversationEventId?: string;
      partialCostCents: number;
    };

export type StreamEventType = OrchestratorStreamEvent['type'];

/**
 * Type predicate for narrowing a parsed SSE payload back to one of the
 * event variants. Used in tests and the frontend consumer.
 */
export function isStreamEvent(
  value: unknown
): value is OrchestratorStreamEvent {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return (
    t === 'routing' ||
    t === 'text_delta' ||
    t === 'tool_call' ||
    t === 'structured_output' ||
    t === 'done' ||
    t === 'error' ||
    t === 'cancelled'
  );
}
