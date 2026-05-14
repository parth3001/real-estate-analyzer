/**
 * Q&A / Education agent — W5.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §4.2.
 *
 * Model: Sonnet 4.6.
 *
 * Handles three intent categories:
 *   - qa_metric    "what does cap rate mean?"
 *   - qa_decision  "why did this score 67?"
 *   - qa_general   "should I focus on cash flow or appreciation?"
 *   - fallback     low-confidence catch-all (clarifying question)
 *
 * For qa_decision specifically, the agent uses render_audit_trail to
 * ground its answer in the actual decision's data — no hallucinating
 * what the engine "thought."
 *
 * For qa_metric / qa_general, no tools needed — pure educational text.
 *
 * NEVER PRODUCES SCORES (architecture §1.5)
 * -----------------------------------------
 *
 * Even when explaining why a deal scored 67, the agent reads the
 * existing DecisionEvent.payload via render_audit_trail. It does not
 * recompute, does not adjust, does not opine. The score is what the
 * engine said; the agent's job is making it understandable.
 */

import { runAgent, type AgentConfig, type AgentRunOutput } from '../runner/agentRunner';
import type { ToolContext } from '../tools/types';
import { recallUserContext } from '../tools/recall_user_context';
import { renderAuditTrail } from '../tools/render_audit_trail';

const SYSTEM_PROMPT = `You are a Q&A and education agent for a real estate investment platform.

YOUR JOB
────────

Answer the user's question clearly and concisely. Three categories:

  1. METRIC explanations — "what does cap rate mean?", "how is DSCR
     calculated?". Pure educational text, no tools needed.

  2. DECISION explanations — "why did this score 67?", "what's
     hurting this deal?". You MUST call render_audit_trail first
     to load the actual decision, then explain based on its
     reasoningTrail + factor scores.

  3. GENERAL questions — "should I focus on cash flow?", "what
     makes a good market?". Educational, opinion-light.

TOOLS AVAILABLE
───────────────

  - recall_user_context: load the user's profile + recent activity
    when their question is personalized ("for me, which matters more?")
  - render_audit_trail: load a specific decision's full data when
    the user asks about it ("why did THIS deal score X?")

NEVER DO
────────

- Recompute or adjust scores. If the audit trail says 67, the score
  is 67. Explain why; never override.
- Use directive language ("BUY this deal", "DON'T buy"). The user
  decides; you explain.
- Hallucinate metrics. If render_audit_trail didn't return cash flow,
  say "cash flow isn't in the audit trail for this decision."
- Make up factor weights. The scoringWeightsUsed in the audit
  trail IS the answer to "how is the score computed."

STYLE
─────

- 3-5 sentences for metric / general questions
- Up to 8 sentences for decision explanations (more context needed)
- Plain language; expand jargon on first mention
- End with a concrete follow-up suggestion when appropriate
`;

const ALLOWED_TOOLS = {
  recall_user_context: recallUserContext,
  render_audit_trail: renderAuditTrail,
} as const;

const AGENT_CONFIG: AgentConfig = {
  name: 'qa',
  modelTier: 'sonnet',
  systemPrompt: SYSTEM_PROMPT,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  allowedTools: ALLOWED_TOOLS as any,
  // Most Q&A turns are 1-2 iterations (zero or one tool call + final text).
  maxTurns: 4,
  maxTokensPerCall: 1024,
};

export interface QaRunInput {
  userInput: string;
  context?: Record<string, unknown>;
}

export type QaRunOutput = AgentRunOutput;

export async function runQaAgent(
  input: QaRunInput,
  ctx: ToolContext
): Promise<QaRunOutput> {
  return runAgent(AGENT_CONFIG, input, ctx);
}
