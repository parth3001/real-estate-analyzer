/**
 * Deal-scoring agent — W5.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §4.1.
 *
 * Model: Sonnet 4.6.
 *
 * The agent that handles the platform's primary user journey:
 *   "Analyze 123 Main St, Austin TX. List price $425K."
 *
 * Orchestrates the score-producing tool chain:
 *   1. recall_user_context  → load profile + recent decisions
 *   2. enrich_property      → comps + economic + demographics
 *   3. compute_analysis     → metrics + monthly + projection
 *   4. score_deal           → dealQuality + breakdown + substrate writes
 *
 * Emits text response describing the deal, with the substrate-written
 * AnalysisEvent + DecisionEvent IDs surfaced via the runner's
 * relatedEventIds.
 *
 * CRITICAL CONSTRAINT (architecture §1.5)
 * ---------------------------------------
 *
 * The agent NEVER produces the dealQuality score. The score is the
 * deterministic engine's output, surfaced through tool:score_deal.
 * The agent's job is reasoning about WHEN to call tools, in what
 * order, and how to explain the result. Score generation is
 * tool-only.
 */

import type { Types } from 'mongoose';
import { runAgent, type AgentConfig, type AgentRunOutput } from '../runner/agentRunner';
import type { ToolContext } from '../tools/types';
import { recallUserContext } from '../tools/recall_user_context';
import { enrichProperty } from '../tools/enrich_property';
import { computeAnalysis } from '../tools/compute_analysis';
import { scoreDeal } from '../tools/score_deal';

// ===== System prompt =====

const SYSTEM_PROMPT = `You are a deal-scoring agent for a real estate investment platform.

YOUR JOB
────────

When a user describes a property they want analyzed, you orchestrate
deterministic tools to produce an analysis + score, then explain the
result in clear, neutral language.

ORCHESTRATION
─────────────

Always work through these tools in this order:

  1. recall_user_context — load the user's current profile + recent
     decisions. Their riskTolerance / investorType / primaryGoal
     drives the engine's scoring weights.

  2. enrich_property — pull market data (comps, economic indicators,
     demographics) for the property's address.

  3. compute_analysis — compute the 60+ metrics (cap rate, DSCR, IRR,
     cash flow, etc.) from the property inputs + market data.

  4. score_deal — pass the analysis + property data + user context
     to the deterministic scoring engine. This emits AnalysisEvent +
     DecisionEvent to substrate and returns the dealQuality (0-100).

OUTPUT
──────

After score_deal returns, write a concise (3-5 sentence) explanation
covering:
  - The dealQuality score AS A NUMBER (e.g., "72/100") + its
    qualityLabel (e.g., "Meets professional standards")
  - The two or three highest-signal factor scores from the
    professionalAssessment (cashFlow, IRR, debt structure, etc.)
  - The walk-away price from marketPosition
  - One concrete next-step recommendation from reasoningTrail

DO NOT
──────

- Produce a dealQuality score yourself. The score is whatever
  score_deal returns. If score_deal returns 47, you say 47.
  Never round, never adjust, never override.
- Use directive language like "BUY" or "PASS". Use the
  qualityLabel ("Above professional standards" / "Meets" /
  "Requires optimization" / "Below professional standards") and
  the score itself. The user makes the decision.
- Invoke any tool not in your allowed set. If you need data the
  available tools can't produce, say so plainly.
- Make up numbers. Every number in your response must come from
  a tool result. If a metric is missing, say "not yet computed."

EXAMPLE OUTPUT
──────────────

"Score: 72/100 — Meets professional standards. Strongest factors:
cash flow (80/100, monthly $250) and debt structure (75/100). The
engine's walk-away price is $385K (you're paying $425K — 10% above).
Next step: see if a $400K offer changes the picture.
"
`;

// ===== Allowed tools =====

const ALLOWED_TOOLS = {
  recall_user_context: recallUserContext,
  enrich_property: enrichProperty,
  compute_analysis: computeAnalysis,
  score_deal: scoreDeal,
} as const;

// ===== Config =====

const AGENT_CONFIG: AgentConfig = {
  name: 'deal_scoring',
  modelTier: 'sonnet',
  systemPrompt: SYSTEM_PROMPT,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  allowedTools: ALLOWED_TOOLS as any,
  // 4-step chain + final text = 5 iterations expected; cap at 8 to
  // tolerate one retry or one extra exploratory call.
  maxTurns: 8,
  maxTokensPerCall: 2048,
};

// ===== Public interface =====

export interface DealScoringRunInput {
  userInput: string;
  /** Optional profile/recent-decisions context for the agent. */
  context?: Record<string, unknown>;
}

export interface DealScoringRunOutput extends AgentRunOutput {
  /** The DecisionEvent _id score_deal emitted, if score_deal was called. */
  decisionEventId?: Types.ObjectId;
  /** The AnalysisEvent _id score_deal emitted, if score_deal was called. */
  analysisEventId?: Types.ObjectId;
}

/**
 * Run the deal-scoring agent on a user input.
 */
export async function runDealScoringAgent(
  input: DealScoringRunInput,
  ctx: ToolContext
): Promise<DealScoringRunOutput> {
  const result = await runAgent(AGENT_CONFIG, input, ctx);

  // The runner's relatedEventIds includes Analysis + Decision IDs from
  // score_deal. Surface the two-per-tool IDs explicitly so the
  // orchestrator can wire structured-output rendering (DealScoreCard).
  // We can identify them by their tool-call sequence — score_deal is
  // the last tool called in a successful run.
  const scoreCall = [...result.toolCallsExecuted]
    .reverse()
    .find((c) => c.toolName === 'score_deal' && c.success);

  // For wave-1 simplicity, we pull the last 2 ObjectIds in relatedEventIds
  // assuming score_deal emits {analysisEventId, decisionEventId} in that
  // order. (Verified by score_deal's extractRelatedEventIds ordering.)
  const ids = result.relatedEventIds;
  const analysisEventId =
    scoreCall && ids.length >= 2 ? ids[ids.length - 2] : undefined;
  const decisionEventId =
    scoreCall && ids.length >= 1 ? ids[ids.length - 1] : undefined;

  return {
    ...result,
    analysisEventId,
    decisionEventId,
  };
}
