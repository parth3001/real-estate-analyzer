import React from 'react';
import {
  BarChart,
  Bar,
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
  useTheme,
  Divider,
} from '@mui/material';

// Types for the component props
interface MarketComparisonChartProps {
  propertyData: {
    name: string;
    value: number;
  }[];
  censusData: {
    name: string;
    value: number;
  }[];
  title?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  isPercentage?: boolean;
}

/**
 * Market Comparison Chart Component
 * 
 * Displays side-by-side comparison between property metrics and local census averages.
 */
const MarketComparisonChart: React.FC<MarketComparisonChartProps> = ({
  propertyData = [],
  censusData = [],
  title = 'Market Comparison',
  valuePrefix = '$',
  valueSuffix = '',
  isPercentage = false,
}) => {
  const theme = useTheme();

  // Format value based on type
  const formatValue = (value: number): string => {
    if (isPercentage) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    if (valuePrefix === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    return `${valuePrefix}${value.toLocaleString()}${valueSuffix}`;
  };

  // Prepare data for the chart
  const chartData = propertyData.map(item => {
    const censusItem = censusData.find(c => c.name === item.name) || { name: item.name, value: 0 };
    
    // Calculate difference as percentage
    const difference = item.value - censusItem.value;
    const percentDiff = censusItem.value !== 0 
      ? (difference / censusItem.value) * 100 
      : 0;
    
    return {
      name: item.name,
      property: item.value,
      census: censusItem.value,
      difference,
      percentDiff,
    };
  });

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ color: theme.palette.primary.main, my: 0.5 }}>
            <Typography variant="body2">
              Property: {formatValue(payload[0].value)}
            </Typography>
          </Box>
          <Box sx={{ color: theme.palette.secondary.main, my: 0.5 }}>
            <Typography variant="body2">
              Local Average: {formatValue(payload[1].value)}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="body2">
            Difference: {formatValue(payload[0].payload.difference)} 
            ({payload[0].payload.percentDiff.toFixed(1)}%)
          </Typography>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Comparison between property metrics and local census averages
        </Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatValue(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="property" 
              name="Property" 
              fill={theme.palette.primary.main} 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="census" 
              name="Local Average" 
              fill={theme.palette.secondary.main} 
              radius={[4, 4, 0, 0]} 
            />
            {chartData.map((entry, index) => (
              <ReferenceLine 
                key={`diff-${index}`}
                segment={[
                  { x: index, y: entry.property },
                  { x: index, y: entry.census }
                ]}
                stroke={entry.property > entry.census ? theme.palette.success.main : theme.palette.error.main}
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MarketComparisonChart;
