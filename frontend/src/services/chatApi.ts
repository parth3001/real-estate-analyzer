/**
 * Chat API client — wraps POST /api/chat/turn (W6-S1) +
 * POST /api/chat/turn/stream (W6-S3).
 *
 * Engineer lens: the non-streaming `sendChatTurn` reuses the existing
 * `api` axios instance — auth header + baseURL shared with the wizard
 * surfaces per FRONTEND_API_STANDARDS.md.
 *
 * SSE EXCEPTION (W6-S3)
 * ─────────────────────
 *
 * `streamChatTurn` uses `fetch` because:
 *   1. axios cannot read a response body as a stream in the browser
 *      (the XHR-backed transport doesn't expose ReadableStream)
 *   2. EventSource is GET-only — we need POST for auth headers + body
 *      (our chatIdentityMiddleware reads sessionId from req.body)
 *
 * The fetch call mirrors the axios instance's behavior:
 *   - baseURL: same VITE_API_URL / VITE_REACT_APP_API_URL resolution
 *   - Bearer token: pulled from tokenUtils so authed users still
 *     bypass the session rate limit
 *   - 401 handling: forwards to /login the same way the axios
 *     interceptor does, to keep the auth UX consistent across
 *     transports.
 */

import axios from 'axios';
import api from './api';
import { tokenUtils } from './api';

// ===== Wire shapes — mirror backend/src/routes/chat.ts ChatTurnResponse =====

/**
 * One message from a prior conversation (Day 11f / Issue C).
 * Returned by `loadChatHistory` and used by ChatOverlay to restore
 * a thread on mount when the user navigates back to it via the sidebar.
 *
 * Minimal wire shape — text + role + ordering. structuredOutputs
 * (DealScoreCards from prior turns) are NOT included in v1; deferred
 * to a follow-up that reconstructs cards from substrate audit trails.
 */
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
  turnNumber: number;
  traceId?: string;
  conversationEventId?: string;
}

export interface ChatTurnRequest {
  userInput: string;
  sessionId: string;
  turnNumber: number;
  inputMethod?: 'text' | 'voice' | 'paste';
  toolPayload?: Record<string, unknown>;
  /**
   * Optional Deal id the chat turn is operating against (Day 9b, 2026-05-18).
   * When the user is in a specific deal's context (chat opened from
   * /analysis/:id, from a SavedDealHero chip, or from any other
   * deal-scoped surface), include the Deal's _id here so the backend
   * can resolve the user's active DealLicense and apply the per-license
   * cost cap to this turn.
   *
   * Free-tier turns and turns initiated from /app top-level should
   * omit this. The backend treats absence gracefully — session +
   * daily caps still apply.
   */
  dealId?: string;
}

export interface ChatTurnRouting {
  target: string;
  routedTo: string;
  classifierIntent: string;
  classifierConfidence: number;
  fallbackReason?: string;
}

export interface ChatTurnResponse {
  traceId: string;
  responseText: string;
  routing: ChatTurnRouting;
  events: {
    conversationEventId: string;
    related: string[];
  };
  totalCostCents: number;
  agentStubbed: boolean;
}

// ===== Public function =====

/**
 * Send one chat turn. Authentication header (if present) is attached
 * automatically by the shared axios interceptor. For anonymous users,
 * the backend's chatIdentityMiddleware resolves identity via the
 * sessionId in the request body (ghost-user pattern — W6-S2.5).
 *
 * Error surface:
 *   - 429 (session rate limit reached) → throws Error with the
 *     human-readable message from the backend ("You've reached the free
 *     analysis limit..."). ChatOverlay surfaces this as an error bubble
 *     and we'll wire it to the signup CTA in W6-S5.
 *   - All other failures → re-thrown for the caller to handle.
 *
 * Returns the orchestrator's output as the wire shape (ObjectIds
 * already stringified by the backend).
 */
export async function sendChatTurn(
  request: ChatTurnRequest
): Promise<ChatTurnResponse> {
  try {
    const { data } = await api.post<ChatTurnResponse>('/chat/turn', request);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      const body = err.response.data as { error?: string } | undefined;
      throw new Error(body?.error ?? 'Free analysis limit reached for this session.');
    }
    throw err;
  }
}

/**
 * Load the prior conversation for a session (Day 11f / Issue C).
 *
 * Used by ChatOverlay on mount when the user navigates back to an
 * existing thread (via sidebar selection). Returns an empty messages
 * array when the session has no history (fresh / unknown session).
 *
 * Error surface:
 *   - 403 → the session belongs to a different user; we return empty
 *     so the UI shows the empty state rather than an error
 *   - 401 → auth failed; should never happen if the user got this far
 *   - Other → returns empty + logs; we don't want a history-load
 *     failure to block the user from typing a new message
 */
export async function loadChatHistory(
  sessionId: string
): Promise<ChatHistoryMessage[]> {
  try {
    const { data } = await api.get<{ messages: ChatHistoryMessage[] }>(
      `/chat/sessions/${encodeURIComponent(sessionId)}/messages`
    );
    return Array.isArray(data?.messages) ? data.messages : [];
  } catch (err) {
    // Silent degrade — empty history is the same UX as never-existed.
    // The user can still start typing. console.error keeps it observable.
    console.error('loadChatHistory failed', err);
    return [];
  }
}

// ===== Streaming endpoint (W6-S3) =====

/**
 * Stream event the chat overlay consumes. Mirrors the backend
 * OrchestratorStreamEvent discriminated union in
 * `agents/orchestrator/streamEvents.ts` — one source of truth lives
 * server-side; this is the wire-typed mirror.
 */
export type ChatStreamEvent =
  | {
      type: 'routing';
      target: string;
      routedTo: string;
      classifierIntent: string;
      classifierConfidence: number;
      fallbackReason?: 'low_confidence' | 'classifier_fallback';
    }
  | { type: 'text_delta'; text: string }
  | {
      type: 'tool_call';
      toolName: string;
      success: boolean;
      durationMs: number;
    }
  | {
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
  | { type: 'error'; message: string }
  | {
      type: 'cancelled';
      partialText: string;
      traceId: string;
      conversationEventId?: string;
      partialCostCents: number;
    };

/**
 * Resolve the SSE endpoint URL. Mirrors the axios instance's baseURL
 * fallback chain so dev / prod / Render env vars all flow through one
 * resolver. The trailing `/chat/turn/stream` is added here.
 */
function resolveStreamUrl(): string {
  const base =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    (import.meta.env.REACT_APP_API_URL as string | undefined) ??
    '/api';
  // axios appends '/chat/turn' as path; we mirror with the stream suffix.
  return `${base.replace(/\/$/, '')}/chat/turn/stream`;
}

/**
 * SSE frame parser. Reads from a ReadableStream<Uint8Array> and yields
 * one JSON payload per `data: {...}\n\n` frame. Handles partial reads
 * (a single network chunk may contain N frames, or half a frame —
 * standard SSE wire-protocol handling).
 */
async function* parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<ChatStreamEvent, void, void> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Frames are delimited by a blank line (\n\n). Split, keeping any
    // trailing partial frame in the buffer for the next iteration.
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);

      // A frame is one or more `field: value` lines. We only care
      // about `data:` lines per the orchestrator's wire format.
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (dataLines.length === 0) continue;
      const json = dataLines.join('\n');
      try {
        const parsed = JSON.parse(json) as ChatStreamEvent;
        yield parsed;
      } catch {
        // Malformed frame — skip rather than blow up the stream.
        // Backend test contract pins JSON.stringify, so this is a
        // defensive guard for proxies that occasionally mangle frames.
        continue;
      }
    }
  }
}

/**
 * Stream a chat turn. Returns an AsyncIterable of ChatStreamEvents.
 * Caller iterates with `for await` and updates UI state per event.
 *
 * Cancellation: pass an `AbortSignal`. Aborting the signal closes the
 * fetch connection — the backend detects via `req.on('close')` and
 * halts the in-flight LLM call (CostEvent for partial usage is still
 * written; substrate accounting stays honest).
 *
 * Error surface mirrors sendChatTurn:
 *   - 429 → throws Error with the human-readable backend message
 *   - 401 → behaves like the axios interceptor (token cleanup +
 *     redirect to /login). The fetch call short-circuits the redirect
 *     for now because the chat surface is anonymous-by-design (W6-S2.5);
 *     a 401 on a streaming call means the auth token went stale mid-
 *     conversation — let the caller surface it.
 *   - Other non-2xx → throws Error with the body's `error` field.
 */
// ===== Email-summary endpoint (W6-S4) =====

/**
 * "Email me this analysis" — POST /api/chat/email-summary.
 *
 * Captures the user's email + the conversationEventId of the chat turn
 * that produced the analysis. Backend resolves the underlying Decision /
 * Analysis substrate events and sends a lightweight summary via the
 * existing Resend-backed emailService. Anonymous-friendly: no auth
 * required, sessionId scopes the request to a ghost user.
 */
export interface ChatEmailSummaryRequest {
  email: string;
  sessionId: string;
  conversationEventId: string;
}

export async function sendChatEmailSummary(
  request: ChatEmailSummaryRequest
): Promise<{ sent: true }> {
  try {
    const { data } = await api.post<{ sent: true }>(
      '/chat/email-summary',
      request
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { error?: string } | undefined;
      throw new Error(body?.error ?? 'Email send failed.');
    }
    throw err;
  }
}

// ===== Claim-session endpoint (W6-S5) =====

/**
 * Result returned by POST /api/chat/claim-session.
 * Mirrors backend MergeResult shape (services/chatSessionMergeService.ts).
 */
export interface ChatClaimSessionResult {
  /** True if a ghost user was found + its events reassigned. */
  merged: boolean;
  /** Number of substrate events reassigned (0 when merged=false). */
  eventsMerged: number;
  /** Number of CostEvents reassigned (0 when merged=false). */
  costEventsMerged: number;
  /** Reassigned ghost's _id (hex) — null when merged=false. */
  ghostUserId: string | null;
}

/**
 * "Claim my anonymous chat session" — W6-S5.
 *
 * Auth-required (the shared axios interceptor attaches the Bearer JWT).
 * Idempotent: if there's no ghost user for the sessionId (already
 * claimed, never existed), the server returns merged=false and the
 * caller proceeds normally.
 *
 * Wire moment: called immediately after magic-link verify succeeds,
 * before navigating to the post-auth destination.
 */
export async function claimChatSession(
  sessionId: string
): Promise<ChatClaimSessionResult> {
  try {
    const { data } = await api.post<ChatClaimSessionResult>(
      '/chat/claim-session',
      { sessionId }
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { error?: string } | undefined;
      throw new Error(body?.error ?? 'Could not claim chat session.');
    }
    throw err;
  }
}

// ===== Task #40 (2026-06-18): persist stress test as a saved scenario =====

export interface SaveStressScenarioResult {
  newDecisionEventId: string;
  newAnalysisEventId: string;
  dealQuality: number;
}

/**
 * Persist a stress-test as a substrate scenario. Anchored on the
 * priorDecisionId (the baseline the stress test ran against) plus the
 * user's original prompt (the backend re-extracts perturbations from it
 * so the saved scenario matches what the narrative cited).
 */
export async function saveStressScenario(input: {
  priorDecisionId: string;
  userMessage: string;
}): Promise<SaveStressScenarioResult> {
  try {
    const { data } = await api.post<SaveStressScenarioResult>(
      '/chat/stress-test/save',
      input
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { error?: string } | undefined;
      throw new Error(body?.error ?? 'Could not save stress scenario.');
    }
    throw err;
  }
}

export async function* streamChatTurn(
  request: ChatTurnRequest,
  opts: { signal?: AbortSignal } = {}
): AsyncGenerator<ChatStreamEvent, void, void> {
  const url = resolveStreamUrl();
  const token = tokenUtils.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: opts.signal,
  });

  if (!response.ok) {
    // Drain the body for diagnostics; backend returns JSON error shapes.
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }
    let parsedError: { error?: string } | null = null;
    try {
      parsedError = bodyText ? (JSON.parse(bodyText) as { error?: string }) : null;
    } catch {
      // body wasn't JSON
    }
    if (response.status === 429) {
      throw new Error(
        parsedError?.error ?? 'Free analysis limit reached for this session.'
      );
    }
    throw new Error(
      parsedError?.error ??
        `Chat stream failed with status ${response.status}.`
    );
  }

  if (!response.body) {
    throw new Error('Chat stream: response body is empty.');
  }

  const reader = response.body.getReader();
  try {
    for await (const event of parseSseStream(reader)) {
      yield event;
    }
  } finally {
    // Release the reader. If we exited because of an abort, the fetch
    // is already closing; cancel() is safe and idempotent.
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
  }
}
