import { TooltipProps } from 'recharts';

// Base chart data type
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Specific chart data types
export interface ExpenseChartData extends ChartDataPoint {
  propertyTax: number;
  insurance: number;
  maintenance: number;
  propertyManagement: number;
  vacancy: number;
  mortgage: number;
}

export interface CashFlowChartData extends ChartDataPoint {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
}

export interface EquityChartData extends ChartDataPoint {
  propertyValue: number;
  mortgageBalance: number;
  equity: number;
}

export interface ReturnMetricsChartData extends ChartDataPoint {
  cashFlow: number;
  appreciation: number;
  principalPaydown: number;
}

// Chart data arrays
export type ExpenseChartDataArray = ExpenseChartData[];
export type CashFlowChartDataArray = CashFlowChartData[];
export type EquityChartDataArray = EquityChartData[];
export type ReturnMetricsChartDataArray = ReturnMetricsChartData[];

// Custom tooltip types
export type CustomTooltipProps = TooltipProps<number, string>;

export interface ChartTooltipData {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

// Chart component props
export interface ChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  nameKey?: string;
  tooltipFormatter?: (value: number, name: string) => string;
}

// Chart label props
export interface ChartLabelProps {
  name: string;
  value: number;
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
} 