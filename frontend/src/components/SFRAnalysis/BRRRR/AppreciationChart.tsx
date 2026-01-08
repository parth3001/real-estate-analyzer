/**
 * Appreciation Chart Component
 *
 * Interactive Recharts visualization comparing BRRRR vs Buy & Hold appreciation curves
 *
 * Business Context:
 * - BRRRR (Purple line): Starts from ARV ($320K), compounds from higher base
 * - Buy & Hold (Blue dashed line): Starts from purchase price ($200K)
 * - Year 10: BRRRR $430K vs Buy & Hold $268K (60% difference)
 *
 * Design: Recharts with Apple design system colors, responsive, interactive tooltips
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface AppreciationChartProps {
  /** BRRRR property data */
  brrrData: {
    year: number;
    propertyValue: number;
    equity?: number;
  }[];

  /** Buy & Hold comparison data (optional) */
  buyHoldData?: {
    year: number;
    propertyValue: number;
    equity?: number;
  }[];

  /** Chart height in pixels (default: 400) */
  height?: number;

  /** Show equity lines (default: false - only show property value) */
  showEquity?: boolean;
}

/**
 * Custom Tooltip Component
 */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: `1px solid ${brrrColors.neutral.medium}`,
        borderRadius: '8px',
        p: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        Year {label}
      </Typography>
      {payload.map((entry: any, index: number) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <Typography variant="caption" sx={{ flex: 1 }}>
            {entry.name}:
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            ${(entry.value as number).toLocaleString()}
          </Typography>
        </Box>
      ))}

      {/* Show difference if both values present */}
      {payload.length === 2 && (
        <Box
          sx={{
            mt: 1,
            pt: 1,
            borderTop: `1px solid ${brrrColors.neutral.light}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            BRRRR Advantage: ${((payload[0].value as number) - (payload[1].value as number)).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const AppreciationChart: React.FC<AppreciationChartProps> = ({
  brrrData,
  buyHoldData,
  height = 400,
  showEquity = false,
}) => {
  // Combine data for chart (match by year)
  const chartData = brrrData.map((brrrPoint) => {
    const buyHoldPoint = buyHoldData?.find((point) => point.year === brrrPoint.year);

    return {
      year: brrrPoint.year,
      brrrValue: brrrPoint.propertyValue,
      brrrEquity: brrrPoint.equity,
      buyHoldValue: buyHoldPoint?.propertyValue,
      buyHoldEquity: buyHoldPoint?.equity,
    };
  });

  // Format currency for Y-axis
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  return (
    <Box>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={brrrColors.neutral.light} />

          <XAxis
            dataKey="year"
            label={{
              value: 'Year',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: '14px', fill: brrrColors.neutral.dark },
            }}
            tick={{ fontSize: 12, fill: brrrColors.neutral.dark }}
          />

          <YAxis
            tickFormatter={formatCurrency}
            label={{
              value: 'Property Value',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '14px', fill: brrrColors.neutral.dark },
            }}
            tick={{ fontSize: 12, fill: brrrColors.neutral.dark }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
            }}
          />

          {/* BRRRR Property Value Line (Purple, solid) */}
          <Line
            type="monotone"
            dataKey="brrrValue"
            stroke={brrrColors.postRefinance.primary}
            strokeWidth={3}
            name="BRRRR Property"
            dot={{ fill: brrrColors.postRefinance.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Buy & Hold Comparison Line (Blue, dashed) */}
          {buyHoldData && (
            <Line
              type="monotone"
              dataKey="buyHoldValue"
              stroke={brrrColors.initialPeriod.primary}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Buy & Hold"
              dot={{ fill: brrrColors.initialPeriod.primary, r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}

          {/* Equity Lines (if enabled) */}
          {showEquity && (
            <>
              <Line
                type="monotone"
                dataKey="brrrEquity"
                stroke={brrrColors.capitalRecovery.primary}
                strokeWidth={2}
                name="BRRRR Equity"
                dot={false}
              />
              {buyHoldData && (
                <Line
                  type="monotone"
                  dataKey="buyHoldEquity"
                  stroke={brrrColors.capitalRecovery.medium}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  name="Buy & Hold Equity"
                  dot={false}
                />
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Legend/Explanation */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: brrrColors.neutral.light,
          borderRadius: '8px',
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
          <strong>Chart Interpretation:</strong> The gap between purple (BRRRR) and blue (Buy & Hold) lines shows
          the compounding advantage of starting from a higher After Repair Value (ARV). BRRRR properties appreciate
          from the ARV achieved through forced appreciation, while Buy & Hold properties appreciate from the lower
          purchase price.
        </Typography>
      </Box>
    </Box>
  );
};

export default AppreciationChart;
