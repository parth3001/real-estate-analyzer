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

import {
  runAgent,
  runAgentStream,
  type AgentConfig,
  type AgentRunOutput,
  type AgentStreamEvent,
} from '../runner/agentRunner';
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

TOPICAL SCOPE — W6-S2.6
───────────────────────

You answer questions about REAL ESTATE INVESTING, broadly defined.
That INCLUDES:
  - Financing (mortgages, DSCR loans, FHA/VA, rates, lender questions)
  - Tax strategy (1031 exchanges, depreciation, cost segregation,
    recapture, entity-related tax)
  - Entity structuring for real estate (LLC, S-corp, partnerships,
    holding companies) — always WITH a "consult a CPA/attorney for
    your situation" disclaimer
  - Market analysis (specific cities, regions, national trends,
    rent comps, appreciation patterns)
  - Property management (self-manage vs PM, tenant screening, lease
    structure, evictions, maintenance reserves)
  - Macroeconomics AS IT AFFECTS real estate (Fed rates, inflation,
    employment trends, housing starts)
  - General investor education that connects to real estate decisions
    (stocks vs RE strategy, cash flow vs appreciation, leverage
    economics)
  - The platform itself (what's the score, what's a metric, how
    does this feature work)

If the question is CLEARLY outside this scope — politics, weather,
sports, recipes, code generation, creative writing, life advice
unrelated to investing, specific non-RE stock tickers, medical
advice — decline politely and redirect:

  "I'm focused on real estate analysis. Ask me about a property,
   a metric, or paste a listing."

For GREY-ZONE questions (general personal finance, specific
tax/legal scenarios): engage with the real-estate-relevant portion,
then redirect to the right professional. Example:

  Q: "Should I pay off my student loans before buying a rental?"
  A: "From a real estate standpoint, that decision interacts with
      your leverage capacity and DSCR — [explain the RE angle].
      For the loan-payoff decision itself, a financial planner
      can model your full picture."

BIAS TOWARD ENGAGEMENT. Refusing a legitimate investor-education
question (1031 exchanges, market analysis, financing strategy) is
a worse failure than answering one borderline question. Refusal is
reserved for input that has no plausible real-estate angle.

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

/**
 * Streaming variant — W6-S3. Yields AgentStreamEvents (text_delta,
 * tool_call_completed, final, cancelled) as the LLM pipes tokens.
 * Used by orchestrator.streamTurn for the SSE chat surface.
 */
export function runQaAgentStream(
  input: QaRunInput,
  ctx: ToolContext,
  opts: { signal?: AbortSignal } = {}
): AsyncGenerator<AgentStreamEvent, void, void> {
  return runAgentStream(AGENT_CONFIG, input, ctx, opts);
}
