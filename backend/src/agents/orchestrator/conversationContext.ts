/**
 * Conversation context — W5-S2 (Option A: stateless agents, orchestrator
 * threads context).
 *
 * The orchestrator fetches recent ConversationEvents for the session and
 * shapes them into a compact `RecentTurn[]` that gets threaded into BOTH:
 *
 *   1. The intent classifier — so a terse turn-2 reply ("BRRRR") after
 *      the agent asked a clarifying question classifies as a CONTINUATION
 *      of the original intent (analyze_property), not a fresh
 *      share_profile / fallback.
 *
 *   2. The deal-scoring agent — so it can see "I already asked about
 *      strategy last turn; the user just answered" and proceed with the
 *      analysis instead of re-asking.
 *
 * Per the user's design decision 2026-05-14: agents stay stateless;
 * the orchestrator owns context assembly. The substrate (ConversationEvent)
 * is the source of truth — no separate session store needed for wave 1.
 *
 * WHY COMPACT
 * -----------
 *
 * ConversationEvent payloads are heavy (token usage, tool-call traces,
 * structured outputs). Threading raw events into an LLM prompt wastes
 * tokens. RecentTurn keeps just what a classifier / agent needs to
 * understand the conversation thread: who said what, and how it routed.
 */

import type { EventsRepositoryReads } from '../../repositories/EventsRepositoryReads';

// ===== Compact turn shape =====

export interface RecentTurn {
  turnNumber: number;
  /** What the user said this turn. */
  userText: string;
  /** What the agent / tool responded. */
  agentText: string;
  /** Classified intent for this turn. */
  intent: string;
  /** Where the turn routed (agent:deal_scoring, tool_only, etc.). */
  routedTo: string;
}

// ===== Fetch + shape =====

/**
 * Load the most recent N turns for a session, oldest-first, shaped for
 * LLM context. Returns [] for a brand-new session.
 *
 * Default limit is 4 — enough to capture a clarifying-question exchange
 * (agent asks → user answers) plus a turn of lead-in, without bloating
 * the prompt. The chat-overlay's full-history view uses the unbounded
 * getConversationHistory directly; this is the LLM-context slice.
 */
export async function loadRecentTurns(
  reads: EventsRepositoryReads,
  sessionId: string,
  limit = 4
): Promise<RecentTurn[]> {
  const events = await reads.getConversationHistory(sessionId);
  // getConversationHistory returns turns sorted by turnNumber ascending.
  // Take the last `limit`.
  const recent = events.slice(-limit);
  return recent.map((e) => {
    const payload = e.payload as {
      turnNumber: number;
      userInput: { text: string };
      agentResponse: { text: string };
      intentClassification: { intent: string };
      routedTo: string;
    };
    return {
      turnNumber: payload.turnNumber,
      userText: payload.userInput.text,
      agentText: payload.agentResponse.text,
      intent: payload.intentClassification.intent,
      routedTo: payload.routedTo,
    };
  });
}

/**
 * Render RecentTurn[] as a compact text block for an LLM prompt.
 * Empty array → empty string (no "Conversation so far:" header for a
 * fresh session).
 */
export function renderRecentTurns(turns: RecentTurn[]): string {
  if (turns.length === 0) return '';
  const lines = turns.map(
    (t) =>
      `  Turn ${t.turnNumber} [${t.intent} → ${t.routedTo}]\n` +
      `    User: ${t.userText}\n` +
      `    Assistant: ${t.agentText}`
  );
  return `Conversation so far:\n${lines.join('\n')}`;
}
