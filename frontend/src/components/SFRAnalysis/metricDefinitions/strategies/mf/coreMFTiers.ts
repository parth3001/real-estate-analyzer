/**
 * Multi-Family Core Strategy - Minimal Wrapper
 *
 * This file provides a minimal wrapper around existing Multi-Family metrics.
 * NO CHANGES to MF implementation - maintains backward compatibility.
 *
 * Future Enhancement: When MF strategies are implemented (core, value-add, opportunistic),
 * this file will be expanded to support strategy-specific metric variations.
 *
 * Current Status: Deferred per user decision (focus on SFR Buy & Hold foundation first)
 */

import type { Analysis } from '../../../../../types/analysis';
import type { SFRPropertyData } from '../../../../../types/property';

/**
 * MF Metric Tier Structure (matches existing AnalysisResults.tsx lines 172-209)
 * This is a placeholder to maintain architecture consistency.
 * Actual MF metrics continue to be rendered directly in AnalysisResults.tsx
 */
export interface MFMetricTier {
  tierNumber: 1;
  title: string;
  description: string;
  renderExisting: true; // Flag to use existing AnalysisResults.tsx rendering
}

/**
 * Placeholder tier for Multi-Family properties
 * Returns flag indicating to use existing AnalysisResults.tsx implementation
 */
export const MF_CORE_TIER_1: MFMetricTier = {
  tierNumber: 1,
  title: 'Multi-Family Metrics',
  description: 'Institutional-grade metrics for multi-family properties',
  renderExisting: true
};

/**
 * MF tier structure (placeholder)
 * When strategy selector calls this, it knows to use existing AnalysisResults.tsx rendering
 */
export const MF_CORE_TIERS: MFMetricTier[] = [
  MF_CORE_TIER_1
];

/**
 * Future MF Strategy Types (not yet implemented)
 * These will be added when MF strategy variants are developed:
 * - 'core': Stable, class A/B properties with minimal value-add
 * - 'value-add': Class B/C properties requiring operational improvements
 * - 'opportunistic': Development or major repositioning plays
 */
export type MFStrategyType = 'core' | 'value-add' | 'opportunistic';

/**
 * Placeholder for future MF strategy info
 */
export const MF_CORE_STRATEGY_INFO = {
  strategyName: 'Multi-Family Core',
  strategyId: 'mf-core' as const,
  propertyType: 'MF' as const,
  description: 'Institutional-grade multi-family investment analysis',
  status: 'EXISTING_IMPLEMENTATION' as const,
  note: 'Uses existing AnalysisResults.tsx rendering - no changes in this phase'
};
