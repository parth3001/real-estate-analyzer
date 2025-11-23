/**
 * Unit Mix Charts Component
 *
 * Contains Income Concentration Chart and Per-Unit Economics Chart.
 * Uses Recharts for data visualization.
 *
 * @component
 */

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Grid,
  useTheme
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

interface IncomeDistribution {
  name: string;
  value: number;
  percentage: number;
}

interface PerUnitMetric {
  unitType: string;
  income: number;
  opex: number;
  noi: number;
  cashFlow: number;
}

interface UnitMixChartsProps {
  incomeDistribution: IncomeDistribution[];
  perUnitMetrics: PerUnitMetric[];
}

export const UnitMixCharts: React.FC<UnitMixChartsProps> = ({
  incomeDistribution,
  perUnitMetrics
}) => {
  const theme = useTheme();

  // 🔍 DIAGNOSTIC LOGGING - Issue #5 Investigation
  console.log('🔍 [UnitMixCharts] ========== DIAGNOSTIC START ==========');
  console.log('🔍 [UnitMixCharts] perUnitMetrics received:', perUnitMetrics);
  console.log('🔍 [UnitMixCharts] perUnitMetrics.length:', perUnitMetrics?.length);
  if (perUnitMetrics && perUnitMetrics.length > 0) {
    console.log('🔍 [UnitMixCharts] Sample data (first item):', perUnitMetrics[0]);
    console.log('🔍 [UnitMixCharts] Data keys:', Object.keys(perUnitMetrics[0]));
    console.log('🔍 [UnitMixCharts] Data values breakdown:');
    perUnitMetrics.forEach((metric, index) => {
      console.log(`  Unit ${index + 1} (${metric.unitType}):`);
      console.log(`    - income: $${metric.income?.toLocaleString() || 'MISSING'}`);
      console.log(`    - opex: $${metric.opex?.toLocaleString() || 'MISSING'}`);
      console.log(`    - noi: $${metric.noi?.toLocaleString() || 'MISSING'}`);
      console.log(`    - cashFlow: $${metric.cashFlow?.toLocaleString() || 'MISSING'}`);
      console.log(`    - cashFlow is negative? ${(metric.cashFlow || 0) < 0}`);
    });
  } else {
    console.warn('⚠️ [UnitMixCharts] NO perUnitMetrics data received!');
  }
  console.log('🔍 [UnitMixCharts] ========== DIAGNOSTIC END ==========');

  // Color palette
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ];

  // Calculate concentration risk
  const maxConcentration = Math.max(...incomeDistribution.map(d => d.percentage));
  const concentrationRisk = maxConcentration > 70 ? 'high' : maxConcentration > 50 ? 'moderate' : 'low';

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Paper sx={{ padding: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.value.toFixed(1)}% of income
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ padding: 1.5 }}>
          <Typography variant="body2" fontWeight="bold" marginBottom={0.5}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ marginBottom: 3 }}>
      <Grid container spacing={3}>
        {/* Left: Income Concentration Pie Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
        <Paper sx={{ padding: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Income Concentration
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Diversification across unit types
          </Typography>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={incomeDistribution}
                dataKey="percentage"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {incomeDistribution.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Risk Alert */}
          <Alert
            severity={concentrationRisk === 'high' ? 'error' : concentrationRisk === 'moderate' ? 'warning' : 'success'}
            sx={{ marginTop: 2 }}
          >
            <Typography variant="body2">
              {concentrationRisk === 'high' && `${maxConcentration.toFixed(0)}% income concentration - high risk`}
              {concentrationRisk === 'moderate' && `${maxConcentration.toFixed(0)}% income concentration - moderate risk`}
              {concentrationRisk === 'low' && 'Well-diversified income across unit types'}
            </Typography>
          </Alert>
        </Paper>
      </Grid>

      {/* Right: Per-Unit Economics Bar Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ padding: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Per-Unit Economics
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Profitability by unit type (annual)
            </Typography>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={perUnitMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="unitType"
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => {
                    // Handle negative values in formatter
                    const absValue = Math.abs(value);
                    const sign = value < 0 ? '-' : '';
                    return `${sign}$${(absValue / 1000).toFixed(0)}k`;
                  }}
                  // Allow negative values on Y-axis (Issue #5: Negative cash flow fix)
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" fill={theme.palette.success.main} name="Gross Income" />
                <Bar dataKey="opex" fill={theme.palette.warning.main} name="Operating Exp" />
                <Bar dataKey="noi" fill={theme.palette.primary.main} name="NOI" />
                {/* Issue #5 Fix: Use conditional fill for cash flow (red if negative, green if positive) */}
                <Bar
                  dataKey="cashFlow"
                  fill={theme.palette.error.main}
                  name="Cash Flow"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Key Insight */}
            {perUnitMetrics.length >= 2 && (() => {
              // Issue #8: Find highest and lowest NOI unit types for meaningful comparison
              const sortedByNOI = [...perUnitMetrics].sort((a, b) => b.noi - a.noi);
              const highestNOI = sortedByNOI[0];
              const lowestNOI = sortedByNOI[sortedByNOI.length - 1];
              const noiDifference = highestNOI.noi - lowestNOI.noi;

              return (
                <Box sx={{ marginTop: 2, padding: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography variant="body2">
                    💡 <strong>Insight:</strong> {highestNOI.unitType} units generate{' '}
                    {formatCurrency(Math.abs(noiDifference))}{' '}
                    more NOI/year than {lowestNOI.unitType} units
                  </Typography>
                </Box>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnitMixCharts;
