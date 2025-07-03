import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';

// Types for the component props
interface ExpenseBreakdownChartProps {
  expenses: {
    name: string;
    value: number;
    color?: string;
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

// Format percentage for tooltips and labels
const formatPercent = (value: number, total: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / total);
};

/**
 * Expense Breakdown Chart Component
 * 
 * Displays expense categories as a pie chart with interactive features.
 * Supports both pie and donut chart views with toggle functionality.
 */
const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  expenses = [],
  title = 'Expense Breakdown',
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'pie' | 'donut'>('pie');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Default colors if not provided in the data
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.error.light,
    theme.palette.warning.light,
  ];

  // Calculate total expenses for percentage calculations
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2">{data.name}</Typography>
          <Typography variant="body2" sx={{ color: data.color || payload[0].color }}>
            {formatCurrency(data.value)} ({formatPercent(data.value, totalExpenses)})
          </Typography>
        </Card>
      );
    }
    return null;
  };

  // Handle chart type toggle
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'pie' | 'donut' | null,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Handle sector hover/click
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  // Render active sector with special styling
  const renderActiveShape = (props: any) => {
    const {
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, value
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 15}
          fill={fill}
        />
        <text x={cx} y={cy - 20} textAnchor="middle" fill={theme.palette.text.primary}>
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill={theme.palette.text.primary}>
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill={theme.palette.text.secondary}>
          {formatPercent(value, totalExpenses)}
        </text>
      </g>
    );
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="pie">Pie</ToggleButton>
            <ToggleButton value="donut">Donut</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={expenses}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={chartType === 'donut' ? 60 : 0}
              outerRadius={80}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {expenses.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || defaultColors[index % defaultColors.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseBreakdownChart;
