import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  Divider,
} from '@mui/material';

// Types for the component props
interface CashFlowChartProps {
  annualCashFlow?: {
    year: number;
    cashFlow: number;
    noi: number;
    cumulativeCashFlow: number;
  }[];
  monthlyCashFlow?: {
    month: number;
    year: number;
    cashFlow: number;
    noi: number;
  }[];
  title?: string;
}

// Format currency for tooltips and labels
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Cash Flow Chart Component
 * 
 * Displays cash flow data over time using a line chart.
 * Supports both monthly and annual views with toggle functionality.
 */
const CashFlowChart: React.FC<CashFlowChartProps> = ({
  annualCashFlow = [],
  monthlyCashFlow = [],
  title = 'Cash Flow Projection',
}) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState<'annual' | 'monthly'>('annual');

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2">
            {timeframe === 'annual' ? `Year ${label}` : `Month ${label % 12 || 12}, Year ${Math.ceil(label / 12)}`}
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          {payload.map((entry: any) => (
            <Box key={entry.name} sx={{ color: entry.color, my: 0.5 }}>
              <Typography variant="body2">
                {entry.name}: {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  // Handle timeframe toggle
  const handleTimeframeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeframe: 'annual' | 'monthly' | null,
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  // Prepare data for the chart based on selected timeframe
  const chartData = timeframe === 'annual' ? annualCashFlow : monthlyCashFlow;
  
  // Calculate min and max values for better Y-axis scaling
  const allValues = chartData.flatMap(item => [item.cashFlow, item.noi]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yAxisDomain = [
    Math.floor(minValue * 1.1), // Add 10% padding below
    Math.ceil(maxValue * 1.1),  // Add 10% padding above
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <ToggleButtonGroup
            value={timeframe}
            exclusive
            onChange={handleTimeframeChange}
            size="small"
          >
            <ToggleButton value="annual">Annual</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={timeframe === 'annual' ? 'year' : 'month'} 
              label={{ 
                value: timeframe === 'annual' ? 'Year' : 'Month', 
                position: 'insideBottomRight', 
                offset: -10 
              }} 
            />
            <YAxis 
              domain={yAxisDomain}
              tickFormatter={formatCurrency}
              label={{ 
                value: 'Amount ($)', 
                angle: -90, 
                position: 'insideLeft' 
              }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="cashFlow"
              name="Cash Flow"
              stroke={theme.palette.primary.main}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="noi"
              name="NOI"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
            />
            {timeframe === 'annual' && (
              <Line
                type="monotone"
                dataKey="cumulativeCashFlow"
                name="Cumulative Cash Flow"
                stroke={theme.palette.success.main}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
