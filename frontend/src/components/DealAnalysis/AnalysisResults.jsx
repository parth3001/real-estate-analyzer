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
  List,
  Tooltip,
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RecommendIcon from '@mui/icons-material/Recommend';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';

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

// Definitions for key metrics
const metricDefinitions = {
  DSCR: "Debt Service Coverage Ratio measures how well the property's income can cover its debt payments. A ratio above 1.0 means the property generates enough income to cover debt.",
  IRR: "Internal Rate of Return is the annual rate of growth an investment is expected to generate. It accounts for all cash flows including the initial investment, rental income, and eventual sale.",
  "Cash on Cash Return": "This measures the annual return on the cash invested in the property. It's calculated by dividing the annual pre-tax cash flow by the total cash invested.",
  "Cap Rate": "Capitalization Rate measures the rate of return on a real estate investment property based on the income that the property is expected to generate. It's calculated by dividing the net operating income by the current market value.",
  "Price/SqFt at Purchase": "The price per square foot at the time of purchase, calculated by dividing the purchase price by the total square footage.",
  "Price/SqFt at Sale": "The projected price per square foot at the time of sale, calculated by dividing the projected sale price by the total square footage.",
  "Avg Rent/SqFt": "The average monthly rental income per square foot, calculated by dividing the monthly rent by the total square footage.",
  "Monthly Cash Flow": "The monthly income remaining after all operating expenses and mortgage payments are paid. A positive cash flow indicates the property is generating profit."
};

const MetricCard = ({ title, value, subtitle }) => (
  <Tooltip 
    title={metricDefinitions[title] || ""}
    arrow
    placement="top"
    enterTouchDelay={0}
    leaveTouchDelay={3000}
  >
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
  </Tooltip>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalysisResults = ({ analysis }) => {
  const [selectedChart, setSelectedChart] = useState('cashflow');
  const [selectedTab, setSelectedTab] = useState(0);

  if (!analysis) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          No analysis data available
        </Typography>
      </Box>
    );
  }

  const {
    monthlyAnalysis = {},
    annualAnalysis = {},
    longTermAnalysis = { yearlyProjections: [] },
  } = analysis;

  // Prepare data for different charts
  const cashFlowData = longTermAnalysis.yearlyProjections?.map(year => ({
    name: `Year ${year.year}`,
    'Monthly Cash Flow': year.cashFlow / 12,
    'Property Value': year.propertyValue,
    'Equity': year.equity,
  })) || [];

  const monthlyExpensesData = Object.entries(monthlyAnalysis.expenses || {})
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => {
      // Handle the mortgage object which has a different structure
      if (key === 'mortgage' && typeof value === 'object') {
        return {
          name: 'Mortgage',
          value: value.total || 0
        };
      }
      return {
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: isNaN(value) ? 0 : value,
      };
    })
    .filter(item => item.value !== 0);

  const equityGrowthData = longTermAnalysis.yearlyProjections?.map(year => ({
    name: `Year ${year.year}`,
    'Principal Paydown': year.propertyValue - year.mortgageBalance,
    'Appreciation': year.propertyValue - (analysis.purchasePrice || 0),
  })) || [];

  const returnMetricsData = [
    { 
      name: 'Cash Flow', 
      value: longTermAnalysis?.returns?.totalCashFlow || 0 
    },
    { 
      name: 'Appreciation', 
      value: longTermAnalysis?.returns?.totalAppreciation || 0 
    },
    { 
      name: 'Principal Paydown', 
      value: longTermAnalysis?.exitAnalysis?.mortgagePayoff || 0 
    },
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
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
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
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
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
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
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
              <RechartsTooltip formatter={(value) => formatCurrency(value)} />
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
                title="DSCR"
                value={formatPercent(annualAnalysis?.dscr || 0)}
                subtitle="Debt Service Coverage Ratio"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={`${longTermAnalysis?.projectionYears || 10}-Year IRR`}
                value={formatPercent(longTermAnalysis?.returns?.irr || 0)}
                subtitle="Internal Rate of Return"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cash on Cash Return"
                value={formatPercent(annualAnalysis?.cashOnCashReturn || 0)}
                subtitle="First Year"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Cap Rate"
                value={formatPercent(annualAnalysis?.capRate || 0)}
                subtitle="Based on Purchase Price"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Price/SqFt at Purchase"
                value={formatCurrency(analysis?.keyMetrics?.pricePerSqFtAtPurchase || 0)}
                subtitle="Initial Purchase"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Price/SqFt at Sale"
                value={formatCurrency(analysis?.keyMetrics?.pricePerSqFtAtSale || 0)}
                subtitle="Year 10 Projection"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Rent/SqFt"
                value={formatCurrency(analysis?.keyMetrics?.avgRentPerSqFt || 0)}
                subtitle="Monthly Average"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Monthly Cash Flow"
                value={formatCurrency(monthlyAnalysis?.cashFlow || 0)}
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
                <Tab label="AI Insights" />
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
                            {formatCurrency(monthlyAnalysis?.income?.baseRent || 0)}
                          </TableCell>
                          <TableCell align="right">100%</TableCell>
                        </TableRow>
                        
                        {/* Property Operating Expenses */}
                        <TableRow>
                          <TableCell>PropertyTax</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis?.expenses?.propertyTax || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent((monthlyAnalysis?.expenses?.propertyTax || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Insurance</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis?.expenses?.insurance || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent((monthlyAnalysis?.expenses?.insurance || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Maintenance</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis?.expenses?.maintenance || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent((monthlyAnalysis?.expenses?.maintenance || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>PropertyManagement</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis?.expenses?.propertyManagement || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent((monthlyAnalysis?.expenses?.propertyManagement || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                          </TableCell>
                        </TableRow>

                        {/* Mortgage Payment */}
                        <TableRow>
                          <TableCell>Principal & Interest</TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthlyAnalysis?.expenses?.mortgage?.total || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent((monthlyAnalysis?.expenses?.mortgage?.total || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                          </TableCell>
                        </TableRow>

                        {/* Net Cash Flow */}
                        <TableRow>
                          <TableCell><strong>Net Cash Flow</strong></TableCell>
                          <TableCell align="right">
                            <strong>{formatCurrency(monthlyAnalysis?.cashFlow || 0)}</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              {formatPercent((monthlyAnalysis?.cashFlow || 0) / (monthlyAnalysis?.income?.baseRent || 1) * 100)}
                            </strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {selectedTab === 1 && (
                  <Box sx={{ 
                    height: '500px', // Fixed height for the tab content
                    position: 'relative',
                    overflow: 'hidden' // Prevent outer scroll
                  }}>
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflowX: 'auto',
                        overflowY: 'auto',
                        '& table': {
                          minWidth: 1400,
                          tableLayout: 'fixed',
                        },
                        '& thead': {
                          position: 'sticky',
                          top: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 2,
                        },
                        '& th, & td': {
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 120,
                        },
                        '& th:first-of-type, & td:first-of-type': {
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 1,
                          width: 80,
                          minWidth: 80,
                        },
                        '& th:first-of-type': {
                          zIndex: 3,
                        },
                        '& tr:last-child': {
                          position: 'sticky',
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          zIndex: 1,
                        },
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                position: 'sticky', 
                                left: 0, 
                                backgroundColor: 'background.paper', 
                                zIndex: 1,
                                whiteSpace: 'normal',
                                width: '80px',
                                padding: '16px 8px'
                              }}
                            >
                              Year
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '120px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              Property Value
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              Gross Rent
                            </TableCell>
                            {/* Expense Breakdown */}
                            <TableCell 
                              align="right" 
                              sx={{ 
                                borderLeft: '1px solid rgba(224, 224, 224, 1)',
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Property</span>
                              <span>Tax</span>
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              Insurance
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              Maintenance
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '120px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Property</span>
                              <span>Management</span>
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              Vacancy
                            </TableCell>
                            <TableCell 
                              align="right" 
                              sx={{ 
                                borderRight: '1px solid rgba(224, 224, 224, 1)',
                                whiteSpace: 'normal',
                                minWidth: '120px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Total</span>
                              <span>Expenses</span>
                            </TableCell>
                            {/* Financial Metrics */}
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2
                              }}
                            >
                              NOI
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '120px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Debt</span>
                              <span>Service</span>
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '100px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Cash</span>
                              <span>Flow</span>
                            </TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                whiteSpace: 'normal',
                                minWidth: '120px',
                                padding: '16px 8px',
                                lineHeight: 1.2,
                                '& span': {
                                  display: 'block',
                                  textAlign: 'right'
                                }
                              }}
                            >
                              <span>Cash on</span>
                              <span>Cash Return</span>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {longTermAnalysis.yearlyProjections.map((year) => (
                            <TableRow key={year.year}>
                              <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>{year.year}</TableCell>
                              <TableCell align="right">{formatCurrency(year.propertyValue)}</TableCell>
                              <TableCell align="right">{formatCurrency(year.grossRent)}</TableCell>
                              {/* Expense Breakdown */}
                              <TableCell align="right" style={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                                {formatCurrency(year.propertyTax)}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(year.insurance)}</TableCell>
                              <TableCell align="right">{formatCurrency(year.maintenance)}</TableCell>
                              <TableCell align="right">{formatCurrency(year.propertyManagement)}</TableCell>
                              <TableCell align="right">{formatCurrency(year.vacancy)}</TableCell>
                              <TableCell align="right" style={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                                {formatCurrency(year.operatingExpenses)}
                              </TableCell>
                              {/* Financial Metrics */}
                              <TableCell align="right">{formatCurrency(year.noi)}</TableCell>
                              <TableCell align="right">{formatCurrency(year.debtService)}</TableCell>
                              <TableCell align="right" style={{
                                color: year.cashFlow >= 0 ? 'green' : 'red',
                                fontWeight: 'bold'
                              }}>
                                {formatCurrency(year.cashFlow)}
                              </TableCell>
                              <TableCell align="right" style={{
                                color: year.cashOnCash >= 0 ? 'green' : 'red',
                                fontWeight: 'bold'
                              }}>
                                {formatPercent(year.cashOnCash)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Summary Row */}
                          <TableRow style={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                            <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                              <strong>{longTermAnalysis?.projectionYears || 10}-Year Total</strong>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections[longTermAnalysis.yearlyProjections.length - 1].propertyValue)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.grossRent, 0))}
                            </TableCell>
                            {/* Expense Totals */}
                            <TableCell align="right" style={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.propertyTax, 0))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.insurance, 0))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.maintenance, 0))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.propertyManagement, 0))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.vacancy, 0))}
                            </TableCell>
                            <TableCell align="right" style={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.operatingExpenses, 0))}
                            </TableCell>
                            {/* Financial Metric Totals */}
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.noi, 0))}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(longTermAnalysis.yearlyProjections.reduce((sum, year) => sum + year.debtService, 0))}
                            </TableCell>
                            <TableCell align="right" style={{
                              color: longTermAnalysis.returns.totalCashFlow >= 0 ? 'green' : 'red',
                              fontWeight: 'bold'
                            }}>
                              {formatCurrency(longTermAnalysis.returns.totalCashFlow)}
                            </TableCell>
                            <TableCell align="right">-</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
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

                {selectedTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <LightbulbOutlinedIcon sx={{ mr: 1, color: 'primary.main' }} />
                      AI Investment Analysis
                    </Typography>
                    
                    {!analysis.aiInsights ? (
                      <Typography variant="body1">
                        AI insights are currently unavailable. This feature requires a valid OpenAI API key.
                      </Typography>
                    ) : (
                      <Grid container spacing={3}>
                        {/* Investment Score and Summary */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Typography variant="subtitle1" gutterBottom>Investment Score</Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress 
                                variant="determinate" 
                                value={analysis.aiInsights.investmentScore || 0} 
                                size={100} 
                                thickness={5}
                                sx={{ 
                                  color: 
                                    analysis.aiInsights.investmentScore >= 80 ? 'success.main' :
                                    analysis.aiInsights.investmentScore >= 60 ? 'warning.main' : 'error.main',
                                  mb: 1
                                }}
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  component="div"
                                  color={
                                    analysis.aiInsights.investmentScore >= 80 ? 'success.main' :
                                    analysis.aiInsights.investmentScore >= 60 ? 'warning.main' : 'error.main'
                                  }
                                >
                                  {analysis.aiInsights.investmentScore || 0}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {analysis.aiInsights.investmentScore >= 80 ? 'Excellent Investment' : 
                               analysis.aiInsights.investmentScore >= 70 ? 'Very Good Investment' :
                               analysis.aiInsights.investmentScore >= 60 ? 'Good Investment' :
                               analysis.aiInsights.investmentScore >= 50 ? 'Average Investment' :
                               'Below Average Investment'}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Summary */}
                        <Grid item xs={12} md={8}>
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Investment Summary
                            </Typography>
                            <Typography variant="body1" paragraph>
                              {analysis.aiInsights.summary}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {/* Strengths */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '100%',
                            bgcolor: 'success.light',
                            color: 'success.contrastText'
                          }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUpIcon sx={{ mr: 1 }} />
                              Strengths
                            </Typography>
                            <List dense disablePadding>
                              {analysis.aiInsights.strengths.map((strength, index) => (
                                <ListItem key={index} disableGutters>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <AddCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={strength} 
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Grid>
                        
                        {/* Weaknesses */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '100%',
                            bgcolor: 'error.light',
                            color: 'error.contrastText'
                          }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingDownIcon sx={{ mr: 1 }} />
                              Weaknesses
                            </Typography>
                            <List dense disablePadding>
                              {analysis.aiInsights.weaknesses.map((weakness, index) => (
                                <ListItem key={index} disableGutters>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <RemoveCircleIcon fontSize="small" sx={{ color: 'error.main' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={weakness} 
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Grid>
                        
                        {/* Recommendations */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider',
                            borderRadius: 1,
                            height: '100%',
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText'
                          }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <RecommendIcon sx={{ mr: 1 }} />
                              Recommendations
                            </Typography>
                            <List dense disablePadding>
                              {analysis.aiInsights.recommendations.map((recommendation, index) => (
                                <ListItem key={index} disableGutters>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <ScoreboardIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={recommendation} 
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
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