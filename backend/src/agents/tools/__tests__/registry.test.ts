/**
 * W4-S0 acceptance test — tool registry.
 *
 * The registry is the contract that:
 *   - Agents iterate over to build their Anthropic SDK tool definitions
 *   - The MCP server iterates over to expose tools to external clients
 *   - Eval harnesses iterate over to drive regression suites
 *
 * Tests below verify the contract surface — adding a tool, retrieving
 * it by name, listing all registered names, and the "no LLM in scoring
 * tools" invariant once score_deal lands.
 */

import { toolRegistry, getTool, listToolNames } from '../registry';
import { recallUserContext } from '../recall_user_context';

describe('toolRegistry (W4-S0)', () => {
  it('registers recall_user_context under its global name', () => {
    expect(toolRegistry.recall_user_context).toBeDefined();
    expect(toolRegistry.recall_user_context.name).toBe('recall_user_context');
  });

  it('getTool returns the typed tool by name', () => {
    const tool = getTool('recall_user_context', recallUserContext);
    expect(tool).toBe(recallUserContext);
  });

  it('getTool throws when the tool is unknown', () => {
    expect(() => getTool('does_not_exist', recallUserContext)).toThrow(
      /Tool 'does_not_exist' is not registered/
    );
  });

  it('listToolNames returns all currently registered tool names', () => {
    expect(listToolNames()).toContain('recall_user_context');
  });

  /**
   * Invariant: every tool in the registry must satisfy the contract
   * shape. This catches regressions where a future PR adds a tool
   * with a missing field.
   */
  it('every registered tool has the required contract fields', () => {
    for (const [name, tool] of Object.entries(toolRegistry)) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name).toBe(name);
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(['boolean', 'string']).toContain(typeof tool.invokeLLM);
      expect(Array.isArray(tool.sideEffects)).toBe(true);
      expect(tool.retrySemantics).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    }
  });
});
