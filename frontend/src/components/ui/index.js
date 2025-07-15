// UI Components Library
export { default as MetricCard, MetricCards, CashFlowCard, CapRateCard, CoCReturnCard, ROICard } from './MetricCard.tsx';

// Export all components for easy importing
export const UIComponents = {
  MetricCard: require('./MetricCard.tsx').default,
  MetricCards: require('./MetricCard.tsx').MetricCards,
};