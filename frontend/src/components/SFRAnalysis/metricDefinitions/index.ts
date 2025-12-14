/**
 * Metric Definitions - Public API
 *
 * This file exports the public API for the metric definitions system.
 * Use these exports in AnalysisResults.tsx and other components.
 */

// Main strategy selector function
export { getMetricTiers, isStrategyImplemented, getAvailableStrategies } from './strategySelector';

// Type exports
export type { StrategyOptions, StrategyResult, InvestmentStrategy, PropertyType } from './strategySelector';
export type { MetricDefinition, MetricFormat, MetricStatus } from './metrics/buyHoldMetrics';
export type { MetricTier } from './strategies/sfr/buyHoldTiers';

// Helper functions (if needed for direct metric access)
export { getMetricById, getMetricsByTier } from './metrics/buyHoldMetrics';

// Strategy-specific exports (for future direct access if needed)
export { BUY_HOLD_TIERS, BUY_HOLD_STRATEGY_INFO } from './strategies/sfr/buyHoldTiers';
export { MF_CORE_TIERS, MF_CORE_STRATEGY_INFO } from './strategies/mf/coreMFTiers';
