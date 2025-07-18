// Apple UI Components - Export Index
// Centralized exports for all Apple-style components

// Apple Components
export {
  AppleMetricCard,
  AppleButton,
  AppleInput,
  AppleProgressIndicator,
  AppleCard,
  AppleLoadingSpinner,
  AppleStatusBadge,
  AppleComponentsExample
} from './AppleComponents';

// Apple MetricCard with backward compatibility
export {
  AppleMetricCard as AppleMetricCardCompat,
  CashFlowCard as AppleCashFlowCard,
  CapRateCard as AppleCapRateCard,
  CoCReturnCard as AppleCoCReturnCard,
  ROICard as AppleROICard,
  AppleMetricCards
} from './AppleMetricCard';

// Original MetricCard (still available)
export {
  default as MetricCard,
  CashFlowCard,
  CapRateCard,
  CoCReturnCard,
  ROICard,
  MetricCards
} from './MetricCard';

// Re-export types
export type { MetricCardProps } from './MetricCard';