/**
 * Metrics Library - Public API
 *
 * This folder contains strategy-specific metric definitions.
 * Each strategy has its own file with metric definitions.
 */

// Buy & Hold Metrics (Phase 1)
export {
  TIER_1_METRICS as BUY_HOLD_TIER_1_METRICS,
  TIER_2_METRICS as BUY_HOLD_TIER_2_METRICS,
  TIER_3_METRICS as BUY_HOLD_TIER_3_METRICS,
  ALL_SFR_BUYHOLD_METRICS,
  getMetricById,
  getMetricsByTier
} from './buyHoldMetrics';

// Type exports
export type { MetricDefinition, MetricFormat, MetricStatus, InvestmentStrategy } from './buyHoldMetrics';

// Future: BRRRR Metrics (Phase 2)
// export { ... } from './brrrrMetrics';

// Future: House Hack Metrics (Phase 2)
// export { ... } from './houseHackMetrics';
