import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  return `${value.toFixed(2)}%`;
};

const MetricCard = ({ title, value, subtitle }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalysisResults = ({ analysis }) => {
  const [selectedChart, setSelectedChart] = useState('cashflow');
  const [selectedTab, setSelectedTab] = useState(0);

  const {
    monthlyAnalysis,
    annualAnalysis,
    longTermAnalysis,
  } = analysis;

  // Prepare data for different charts
  const cashFlowData = longTermAnalysis.yearlyProjections.map(year => ({
    name: `Year ${year.year}`,
    'Monthly Cash Flow': year.cashFlow / 12,
    'Property Value': year.propertyValue,
    'Equity': year.equity,
  }));

  const monthlyExpensesData = Object.entries(monthlyAnalysis.expenses)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    }));

  const equityGrowthData = longTermAnalysis.yearlyProjections.map(year => ({
    name: `Year ${year.year}`,
    'Principal Paydown': year.propertyValue - year.mortgageBalance,
    'Appreciation': year.propertyValue - analysis.purchasePrice,
  }));

  const returnMetricsData = [
    { name: 'Cash Flow', value: longTermAnalysis.returns.totalCashFlow },
    { name: 'Appreciation', value: longTermAnalysis.returns.totalAppreciation },
    { name: 'Principal Paydown', value: longTermAnalysis.exitAnalysis.mortgagePayoff },
  ];

  const handleChartChange = (event, newChart) => {
    if (newChart !== null) {
      setSelectedChart(newChart);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'cashflow':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Monthly Cash Flow"
                stroke="#8884d8"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Property Value"
                stroke="#82ca9d"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Equity"
                stroke="#ffc658"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'expenses':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={monthlyExpensesData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {monthlyExpensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'equity':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={equityGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Principal Paydown"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="Appreciation"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'returns':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={returnMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {returnMetricsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Key Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="10-Year IRR"
                value={formatPercent(longTermAnalysis.returns.irr)}
                subtitle="Internal Rate of Return"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cash on Cash Return"
                value={formatPercent(annualAnalysis.cashOnCashReturn)}
                subtitle="First Year"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cap Rate"
                value={formatPercent(annualAnalysis.capRate)}
                subtitle="Based on Purchase Price"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Monthly Cash Flow"
                value={formatCurrency(monthlyAnalysis.cashFlow)}
                subtitle="First Year Average"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Chart Selection and Visualization */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box mb={2}>
                <ToggleButtonGroup
                  value={selectedChart}
                  exclusive
                  onChange={handleChartChange}
                  aria-label="chart selection"
                >
                  <ToggleButton value="cashflow" aria-label="cash flow">
                    Cash Flow & Value
                  </ToggleButton>
                  <ToggleButton value="expenses" aria-label="expenses">
                    Expense Breakdown
                  </ToggleButton>
                  <ToggleButton value="equity" aria-label="equity">
                    Equity Growth
                  </ToggleButton>
                  <ToggleButton value="returns" aria-label="returns">
                    Return Components
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {renderChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Tabs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="Monthly Analysis" />
                <Tab label="Annual Projections" />
                <Tab label="Exit Analysis" />
              </Tabs>
              
              <Box mt={2}>
                {selectedTab === 0 && (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">% of Rent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Gross Rent</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis.income.baseRent)}
                          </TableCell>
                          <TableCell align="right">100%</TableCell>
                        </TableRow>
                        {Object.entries(monthlyAnalysis.expenses)
                          .filter(([key]) => key !== 'total')
                          .map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                              <TableCell align="right">{formatCurrency(value)}</TableCell>
                              <TableCell align="right">
                                {formatPercent((value / monthlyAnalysis.income.baseRent) * 100)}
                              </TableCell>
                            </TableRow>
                          ))}
                        <TableRow>
                          <TableCell><strong>Net Cash Flow</strong></TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(monthlyAnalysis.cashFlow)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              {formatPercent((monthlyAnalysis.cashFlow / monthlyAnalysis.income.baseRent) * 100)}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {selectedTab === 1 && (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Year</TableCell>
                          <TableCell align="right">Property Value</TableCell>
                          <TableCell align="right">Annual Cash Flow</TableCell>
                          <TableCell align="right">Equity</TableCell>
                          <TableCell align="right">ROI</TableCell>
                          <TableCell align="right">Cumulative Return</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {longTermAnalysis.yearlyProjections.map((year) => (
                          <TableRow key={year.year}>
                            <TableCell>{year.year}</TableCell>
                            <TableCell align="right">{formatCurrency(year.propertyValue)}</TableCell>
                            <TableCell align="right">{formatCurrency(year.cashFlow)}</TableCell>
                            <TableCell align="right">{formatCurrency(year.equity)}</TableCell>
                            <TableCell align="right">
                              {formatPercent((year.cashFlow / year.equity) * 100)}
                            </TableCell>
                            <TableCell align="right">
                              {formatPercent(((year.equity - analysis.purchasePrice + year.cashFlow) / analysis.purchasePrice) * 100)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {selectedTab === 2 && (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Projected Sale Price</TableCell>
                          <TableCell align="right">
                            {formatCurrency(longTermAnalysis.exitAnalysis.projectedSalePrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Selling Costs</TableCell>
                          <TableCell align="right">
                            {formatCurrency(longTermAnalysis.exitAnalysis.sellingCosts)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mortgage Payoff</TableCell>
                          <TableCell align="right">
                            {formatCurrency(longTermAnalysis.exitAnalysis.mortgagePayoff)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Net Proceeds</TableCell>
                          <TableCell align="right">
                            {formatCurrency(longTermAnalysis.exitAnalysis.netProceedsFromSale)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Return</TableCell>
                          <TableCell align="right">
                            {formatCurrency(longTermAnalysis.returns.totalReturn)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>IRR</TableCell>
                          <TableCell align="right">
                            {formatPercent(longTermAnalysis.returns.irr)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisResults; 