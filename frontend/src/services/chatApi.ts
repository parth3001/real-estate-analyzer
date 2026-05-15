/**
 * Chat API client — wraps POST /api/chat/turn (W6-S1).
 *
 * Engineer lens: reuses the existing `api` axios instance from
 * services/api.ts so the auth interceptor + base-URL handling are
 * shared with the wizard surfaces. Per FRONTEND_API_STANDARDS.md, all
 * frontend API calls go through this one axios instance — NEVER fetch,
 * NEVER a parallel client.
 */

import axios from 'axios';
import api from './api';

// ===== Wire shapes — mirror backend/src/routes/chat.ts ChatTurnResponse =====

export interface ChatTurnRequest {
  userInput: string;
  sessionId: string;
  turnNumber: number;
  inputMethod?: 'text' | 'voice' | 'paste';
  toolPayload?: Record<string, unknown>;
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
