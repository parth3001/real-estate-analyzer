/**
 * BRRRR Type Definitions
 *
 * Re-exports backend BRRRR types for frontend use.
 * This maintains a single source of truth (backend) while providing
 * type safety in frontend components.
 *
 * Architecture Decision: Import backend types rather than duplicate
 * - Rationale: Prevents type drift, ensures consistency
 * - Trade-off: Frontend depends on backend types (acceptable in monorepo)
 *
 * @author FSE from CLAUDE.md
 * @date December 27, 2025
 */

export type {
  BRRRRAnalysis,
  BRRRRInputs,
  CapitalRecovery,
  PostRefinanceMetrics,
  RefinanceResults,
  SeasoningCosts,
  Rule70Check,
  ARVSensitivity,
  RehabSensitivity,
  ScenarioResults,
  ExitScenario  // Tab 4 redesign: Exit scenario analysis
} from '../../../backend/src/services/investment/brrrAnalyzer';
