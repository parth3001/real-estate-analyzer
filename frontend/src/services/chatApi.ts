/**
 * Chat API client — wraps POST /api/chat/turn (W6-S1).
 *
 * Engineer lens: reuses the existing `api` axios instance from
 * services/api.ts so the auth interceptor + base-URL handling are
 * shared with the wizard surfaces. Per FRONTEND_API_STANDARDS.md, all
 * frontend API calls go through this one axios instance — NEVER fetch,
 * NEVER a parallel client.
 */

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
 * Send one chat turn. Authentication header is attached automatically
 * by the shared axios interceptor.
 *
 * Returns the orchestrator's output as the wire shape (ObjectIds
 * already stringified by the backend).
 */
export async function sendChatTurn(
  request: ChatTurnRequest
): Promise<ChatTurnResponse> {
  const { data } = await api.post<ChatTurnResponse>('/chat/turn', request);
  return data;
}
