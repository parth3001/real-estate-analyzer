/**
 * Tool registry — the single source of truth for which tools exist
 * and what they're called.
 *
 * Per /docs/PRODUCT_2.0_AGENT_MESH.md §3.4.
 *
 * Consumers of this registry:
 *   1. **Agent constructors** — each agent (deal-scoring, qa, critic)
 *      takes a SUBSET of these tools as its allowed set. Anthropic SDK
 *      `tool_use` definitions are generated from the entries.
 *   2. **MCP server** — every entry here gets exposed as an MCP tool
 *      (see agent-mesh §6.1).
 *   3. **Eval harnesses** — golden sets target tools by name; the
 *      registry is what the harness iterates over.
 *
 * Adding a new tool = adding it here. The orchestrator never imports
 * a tool module directly; it goes through the registry so the registry
 * stays the contract.
 *
 * Wave 1 tools (per agent-mesh §3.2):
 *   enrich_property        — wraps MarketIntelligenceService
 *   compute_analysis       — wraps SFRAnalyzer / MFAnalyzer
 *   score_deal             — wraps InvestmentDecisionEngine (LOAD-BEARING)
 *   apply_override         — re-runs scoring after a field change
 *   profile_extraction     — Haiku call: chat text → typed profile fields
 *   recall_user_context    — pulls profile + recent decisions + overrides
 *   save_to_watchlist      — emits WatchlistEvent
 *   render_audit_trail     — wraps EventsRepositoryReads.getAuditTrail
 *   export_audit_pdf       — emits AuditTrailEvent on export
 *
 * Currently registered: recall_user_context (W4-S0), score_deal (W4-S1),
 * apply_override (W4-S2). Remaining tools land per the W4 backlog.
 */

import type { Tool } from './types';
import { recallUserContext } from './recall_user_context';
import { scoreDeal } from './score_deal';
import { applyOverride } from './apply_override';

/**
 * The wave-1 tool registry. Keys are the global tool names (stable
 * identifiers). Values are the tool implementations.
 *
 * Typed as `Record<string, Tool<unknown, unknown>>` for the
 * orchestrator (which doesn't know the concrete tool types). Specific
 * consumers that DO know the type can re-cast:
 *
 *   const recall = toolRegistry.recall_user_context as typeof recallUserContext;
 */
export const toolRegistry: Record<string, Tool<unknown, unknown>> = {
  recall_user_context: recallUserContext as unknown as Tool<unknown, unknown>,
  score_deal: scoreDeal as unknown as Tool<unknown, unknown>,
  apply_override: applyOverride as unknown as Tool<unknown, unknown>,
};

/**
 * Type-safe accessor for tools whose concrete type is known at the call site.
 *
 * Usage:
 *   const recall = getTool('recall_user_context', recallUserContext);
 */
export function getTool<T extends Tool<unknown, unknown>>(
  name: string,
  _typeHint: T
): T {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Tool '${name}' is not registered`);
  return tool as T;
}

/** List of all currently registered tool names. */
export function listToolNames(): string[] {
  return Object.keys(toolRegistry);
}
