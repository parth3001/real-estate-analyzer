// Apple-Style MetricCard with full backward compatibility
// This component bridges the existing MetricCard interface with Apple design system

import React from 'react';
import { AppleMetricCard as BaseAppleMetricCard } from './AppleComponents';
import { MetricCardProps } from './MetricCard';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

// Enhanced AppleMetricCard that supports all existing MetricCard props
interface AppleMetricCardProps extends Omit<MetricCardProps, 'change' | 'changeLabel'> {
  // Apple-specific props
  format?: 'currency' | 'percent' | 'number';
  trend?: number; // Percentage trend (positive or negative)
  // Keep existing props for compatibility
  change?: number;
  changeLabel?: string;
}

export const AppleMetricCard: React.FC<AppleMetricCardProps> = ({
  title,
  value,
  subtitle,
  status = 'neutral',
  change,
  changeLabel,
  tooltip,
  loading = false,
  size = 'medium',
  onClick,
  highlight = false,
  icon,
  trend: trendProp,
  format,
  ...props
}) => {
  // Convert status to highlight for Apple component
  const isHighlighted = highlight || status === 'positive';
  
  // Convert change to trend percentage
  const trendValue = change !== undefined ? change : trendProp;
  
  // Auto-detect format from value if not provided
  const autoFormat = format || (() => {
    const valueStr = String(value);
    if (valueStr.includes('$')) return 'currency';
    if (valueStr.includes('%')) return 'percent';
    return 'number';
  })();

  // Clean value for Apple component (remove formatting if already formatted)
  const cleanValue = (() => {
    if (typeof value === 'number') return value;
    const str = String(value);
    
    // Remove currency symbols and commas
    const cleaned = str.replace(/[$,%]/g, '');
    
    // If it ends with %, extract the number
    if (str.includes('%')) {
      return parseFloat(cleaned);
    }
    
    // Try to parse as number, fallback to original
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? value : parsed;
  })();

  if (loading) {
    return (
      <BaseAppleMetricCard
        label={title}
        value={0}
        size={size}
        highlight={isHighlighted}
        icon={icon}
      />
    );
  }

  return (
    <BaseAppleMetricCard
      label={title}
      value={cleanValue}
      format={autoFormat}
      trend={trendValue}
      highlight={isHighlighted}
      icon={icon}
      size={size}
    />
  );
};

// Backward compatible preset variants using Apple design
export const CashFlowCard: React.FC<Omit<AppleMetricCardProps, 'title' | 'icon' | 'tooltip'>> = (props) => (
  <AppleMetricCard
    title="Monthly Cash Flow"
    status={Number(props.value) >= 0 ? 'positive' : 'negative'}
    icon={<TrendingUp />}
    format="currency"
    {...props}
  />
);

export const CapRateCard: React.FC<Omit<AppleMetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <AppleMetricCard
    title="Cap Rate"
    status={Number(props.value) >= 8 ? 'positive' : Number(props.value) >= 6 ? 'neutral' : 'negative'}
    format="percent"
    {...props}
  />
);

export const CoCReturnCard: React.FC<Omit<AppleMetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <AppleMetricCard
    title="Cash-on-Cash Return"
    status={Number(props.value) >= 10 ? 'positive' : Number(props.value) >= 7 ? 'neutral' : 'negative'}
    format="percent"
    {...props}
  />
);

export const ROICard: React.FC<Omit<AppleMetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <AppleMetricCard
    title="Total ROI"
    status={Number(props.value) >= 15 ? 'positive' : Number(props.value) >= 10 ? 'neutral' : 'negative'}
    format="percent"
    {...props}
  />
);

// Export group for easy importing
export const AppleMetricCards = {
  CashFlow: CashFlowCard,
  CapRate: CapRateCard,
  CoCReturn: CoCReturnCard,
  ROI: ROICard,
};

export default AppleMetricCard;