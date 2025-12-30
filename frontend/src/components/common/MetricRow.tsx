/**
 * MetricRow Component
 *
 * Reusable component for displaying financial metrics in a consistent format
 * across all property types and strategies (Buy & Hold, BRRRR, Multi-Family)
 *
 * Design Philosophy: Apple Design System - Clear hierarchy, tabular numbers, subtle deltas
 *
 * Used in:
 * - BRRRR Financial Details (Tab 2) - dual-period comparison
 * - Buy & Hold financial breakdowns
 * - Multi-Family operating expense details
 */

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { brrrColors, brrrTypography, getDeltaBadgeStyles } from '../../theme/brrrDesignTokens';

export interface MetricRowProps {
  /** Metric label (e.g., "Monthly Mortgage", "Property Tax") */
  label: string;

  /** Metric value (number will be formatted according to format prop) */
  value: string | number;

  /** Display format for numeric values */
  format?: 'currency' | 'percent' | 'number' | 'text';

  /** Optional sublabel for additional context (e.g., "Previous: $1,049") */
  sublabel?: string;

  /** Optional delta value for showing change (raw number, not percentage) */
  deltaValue?: number;

  /** Optional delta label (e.g., "+$548/month") */
  deltaLabel?: string;

  /** True if metric represents an expense (affects delta color logic - increases are bad) */
  isExpense?: boolean;

  /** Optional icon to display before label */
  icon?: React.ReactNode;

  /** Optional tooltip text for educational context */
  tooltip?: string;

  /** Emphasis level - affects font weight */
  emphasis?: 'normal' | 'medium' | 'strong';

  /** Show border bottom (default true) */
  showBorder?: boolean;
}

/**
 * Format value based on format type
 */
const formatValue = (value: string | number, format?: string): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percent':
      return `${value.toFixed(1)}%`;

    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);

    default:
      return String(value);
  }
};

export const MetricRow: React.FC<MetricRowProps> = ({
  label,
  value,
  format = 'currency',
  sublabel,
  deltaValue,
  deltaLabel,
  isExpense = false,
  icon,
  tooltip,
  emphasis = 'normal',
  showBorder = true,
}) => {
  const formattedValue = formatValue(value, format);

  // Calculate delta percentage if deltaValue provided
  const deltaPercent = deltaValue && typeof value === 'number' && value !== 0
    ? (deltaValue / Math.abs(value)) * 100
    : 0;

  // Determine delta color and icon
  const hasDelta = deltaValue !== undefined && deltaValue !== 0;
  const deltaIsPositive = deltaValue ? deltaValue > 0 : false;
  const deltaIcon = deltaIsPositive ? <ArrowUpIcon sx={{ fontSize: 14 }} /> : <ArrowDownIcon sx={{ fontSize: 14 }} />;

  // Font weight based on emphasis
  const valueFontWeight = emphasis === 'strong' ? 700 : emphasis === 'medium' ? 600 : 500;
  const labelFontWeight = emphasis === 'strong' ? 600 : emphasis === 'medium' ? 500 : 400;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: showBorder ? `1px solid ${brrrColors.neutral.light}` : 'none',
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      {/* Left Side: Label + Icon + Tooltip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        {icon && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: brrrColors.neutral.primary }}>
            {icon}
          </Box>
        )}

        <Box>
          <Typography
            variant="body2"
            sx={{
              ...brrrTypography.metricLabel,
              fontWeight: labelFontWeight,
              color: emphasis === 'strong' ? 'text.primary' : brrrTypography.metricLabel.color,
            }}
          >
            {label}
            {tooltip && (
              <Tooltip title={tooltip} arrow placement="top">
                <InfoIcon
                  sx={{
                    fontSize: 14,
                    ml: 0.5,
                    verticalAlign: 'middle',
                    color: brrrColors.neutral.primary,
                    cursor: 'help',
                  }}
                />
              </Tooltip>
            )}
          </Typography>

          {sublabel && (
            <Typography
              variant="caption"
              sx={{
                ...brrrTypography.caption,
                display: 'block',
                mt: 0.25,
              }}
            >
              {sublabel}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right Side: Value + Delta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          variant="body1"
          sx={{
            ...brrrTypography.metricValue,
            fontWeight: valueFontWeight,
            fontVariantNumeric: 'tabular-nums', // Aligned numbers
            textAlign: 'right',
            minWidth: '100px', // Consistent alignment
          }}
        >
          {formattedValue}
        </Typography>

        {hasDelta && (
          <Box
            sx={{
              ...getDeltaBadgeStyles(deltaPercent, isExpense),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: '80px',
              justifyContent: 'center',
            }}
          >
            {deltaIcon}
            <Typography
              variant="caption"
              sx={{
                ...brrrTypography.delta,
                fontWeight: 600,
              }}
            >
              {deltaLabel || formatValue(Math.abs(deltaValue!), format)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MetricRow;
