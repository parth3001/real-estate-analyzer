import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  change?: number;
  changeLabel?: string;
  tooltip?: string;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  highlight?: boolean;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  sx?: any;
}
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  IconButton,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';

/**
 * MetricCard Component
 * 
 * A reusable card component for displaying financial metrics with context
 * 
 * @param {string} title - The metric name (e.g., "Monthly Cash Flow")
 * @param {string|number} value - The metric value (e.g., "$523" or "8.2%")
 * @param {string} subtitle - Additional context (e.g., "After all expenses")
 * @param {string} status - 'positive', 'negative', 'neutral', or 'warning'
 * @param {number} change - Percentage change (e.g., 12.5 for +12.5%)
 * @param {string} changeLabel - Label for the change (e.g., "vs last month")
 * @param {string} tooltip - Detailed explanation for info icon
 * @param {boolean} loading - Show loading skeleton
 * @param {string} size - 'small', 'medium', or 'large'
 * @param {function} onClick - Click handler for interactive cards
 * @param {boolean} highlight - Whether to highlight this card
 * @param {object} icon - Custom icon component
 * @param {string} trend - 'up', 'down', or 'flat' for trend indicator
 */
const MetricCard: React.FC<MetricCardProps> = ({
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
  trend,
  ...props
}) => {
  const theme = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      padding: 2,
      titleSize: 'body2',
      valueSize: 'h6',
      subtitleSize: 'caption',
      minHeight: 100,
    },
    medium: {
      padding: 3,
      titleSize: 'body1',
      valueSize: 'h4',
      subtitleSize: 'body2',
      minHeight: 140,
    },
    large: {
      padding: 4,
      titleSize: 'h6',
      valueSize: 'h3',
      subtitleSize: 'body1',
      minHeight: 180,
    },
  };

  const config = sizeConfig[size];

  // Status color mapping
  const statusColors = {
    positive: theme.palette.success.main,
    negative: theme.palette.error.main,
    warning: theme.palette.warning.main,
    neutral: theme.palette.text.secondary,
  };

  const statusBgColors = {
    positive: alpha(theme.palette.success.main, 0.08),
    negative: alpha(theme.palette.error.main, 0.08),
    warning: alpha(theme.palette.warning.main, 0.08),
    neutral: alpha(theme.palette.grey[500], 0.08),
  };

  // Trend icons
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;
  const ChangeIcon = (change || 0) > 0 ? ArrowUpward : ArrowDownward;

  if (loading) {
    return (
      <Card sx={{ minHeight: config.minHeight, ...props.sx }}>
        <CardContent sx={{ p: config.padding }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ my: 1 }} />
          <Skeleton variant="text" width="40%" height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        minHeight: config.minHeight,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        border: highlight ? `2px solid ${theme.palette.primary.main}` : '1px solid',
        borderColor: highlight ? theme.palette.primary.main : 'divider',
        bgcolor: highlight ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.light,
        } : {},
        ...props.sx,
      }}
    >
      <CardContent sx={{ p: config.padding, '&:last-child': { pb: config.padding } }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && (
              <Box sx={{ color: statusColors[status], display: 'flex' }}>
                {icon}
              </Box>
            )}
            <Typography
              variant={config.titleSize as any}
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
          </Box>
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <IconButton size="small" sx={{ ml: 'auto', p: 0.5 }}>
                <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Value Row */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: subtitle ? 1 : 0 }}>
          <Typography
            variant={config.valueSize as any}
            sx={{
              fontWeight: 700,
              color: statusColors[status],
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {trend && (
            <TrendIcon
              sx={{
                fontSize: size === 'large' ? 24 : 20,
                color: statusColors[status],
                ml: 0.5,
              }}
            />
          )}
        </Box>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant={config.subtitleSize as any}
            color="text.secondary"
            sx={{ mb: change !== undefined ? 1 : 0 }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Change Indicator */}
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              icon={<ChangeIcon sx={{ fontSize: 14 }} />}
              label={`${(change || 0) > 0 ? '+' : ''}${change || 0}%`}
              sx={{
                bgcolor: statusBgColors[(change || 0) > 0 ? 'positive' : 'negative'],
                color: statusColors[(change || 0) > 0 ? 'positive' : 'negative'],
                fontWeight: 600,
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
            {changeLabel && (
              <Typography variant="caption" color="text.secondary">
                {changeLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Preset metric card variants for common use cases
export const CashFlowCard: React.FC<Omit<MetricCardProps, 'title' | 'icon' | 'tooltip'>> = (props) => (
  <MetricCard
    title="Monthly Cash Flow"
    status={Number(props.value) >= 0 ? 'positive' : 'negative'}
    icon={<TrendingUp />}
    tooltip="Net income after all expenses, debt service, and reserves"
    {...props}
  />
);

export const CapRateCard: React.FC<Omit<MetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <MetricCard
    title="Cap Rate"
    status={Number(props.value) >= 8 ? 'positive' : Number(props.value) >= 6 ? 'neutral' : 'negative'}
    tooltip="Net Operating Income divided by purchase price"
    {...props}
  />
);

export const CoCReturnCard: React.FC<Omit<MetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <MetricCard
    title="Cash-on-Cash Return"
    status={Number(props.value) >= 10 ? 'positive' : Number(props.value) >= 7 ? 'neutral' : 'negative'}
    tooltip="Annual pre-tax cash flow divided by total cash invested"
    {...props}
  />
);

export const ROICard: React.FC<Omit<MetricCardProps, 'title' | 'tooltip'>> = (props) => (
  <MetricCard
    title="Total ROI"
    status={Number(props.value) >= 15 ? 'positive' : Number(props.value) >= 10 ? 'neutral' : 'negative'}
    trend="up"
    tooltip="Total return including cash flow, appreciation, and tax benefits"
    {...props}
  />
);

// Export group for easy importing
export const MetricCards = {
  CashFlow: CashFlowCard,
  CapRate: CapRateCard,
  CoCReturn: CoCReturnCard,
  ROI: ROICard,
};

export default MetricCard;