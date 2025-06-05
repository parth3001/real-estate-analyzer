/**
 * New Analysis Results Component (V2)
 * 
 * A completely rebuilt analysis results component with a cleaner design
 * and more reliable data handling
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  Alert,
  Stack,
  Grid as MuiGrid
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import {
  TrendingUp,
  AccountBalance,
  Timeline,
  AttachMoney,
  Home,
  Star,
  Warning,
  CheckCircle,
  PriceChange,
  ShowChart
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Analysis } from '../../types/analysis';

// Type cast for MuiGrid to work with the expected props in MUI v7
const Grid = MuiGrid as React.ComponentType<{
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
}>;

// Define props
interface AnalysisResultsV2Props {
  analysis: Analysis;
}

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const EXPENSE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

/**
 * The AnalysisResultsV2 component
 */
const AnalysisResultsV2: React.FC<AnalysisResultsV2Props> = ({ analysis }) => {
  // Tab state
  const [tabIndex, setTabIndex] = useState(0);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Helper functions for formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };

  // Tab panel component
  const TabPanel = (props: { children: React.ReactNode; index: number; value: number }) => {
    const { children, value, index } = props;
    return (
      <Box 
        role="tabpanel" 
        hidden={value !== index}
        id={`analysis-tabpanel-${index}`}
        aria-labelledby={`analysis-tab-${index}`}
        sx={{ py: 3 }}
      >
        {value === index && children}
      </Box>
    );
  };

  // Monthly expenses data for pie chart
  const getExpensesData = () => {
    const expenses = analysis.monthlyAnalysis.expenses;
    
    return [
      { name: 'Property Tax', value: expenses.propertyTax },
      { name: 'Insurance', value: expenses.insurance },
      { name: 'Maintenance', value: expenses.maintenance },
      { name: 'Property Mgmt', value: expenses.propertyManagement },
      { name: 'Vacancy', value: expenses.vacancy },
    ].filter(item => item.value > 0);
  };

  // Cash flow data for line chart
  const getCashFlowData = () => {
    return analysis.longTermAnalysis.yearlyProjections.map(year => ({
      year: `Year ${year.year}`,
      cashFlow: year.cashFlow,
      noi: year.noi
    }));
  };

  // Equity growth data for area chart
  const getEquityData = () => {
    return analysis.longTermAnalysis.yearlyProjections.map(year => ({
      year: `Year ${year.year}`,
      equity: year.equity,
      propertyValue: year.propertyValue,
      mortgageBalance: year.mortgageBalance
    }));
  };

  // Returns components data for bar chart
  const getReturnsData = () => {
    const { totalCashFlow, totalAppreciation } = analysis.longTermAnalysis.returns;
    
    return [
      { name: 'Cash Flow', value: totalCashFlow },
      { name: 'Appreciation', value: totalAppreciation }
    ];
  };

  // Render metrics card with icon, title, value, and subtitle
  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = 'primary.main',
    positive = true 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string; 
    subtitle?: string;
    color?: string;
    positive?: boolean;
  }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            color: color, 
            display: 'flex', 
            alignItems: 'center', 
            mr: 1 
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" component="div" sx={{ 
          fontWeight: 'bold',
          color: positive ? 'success.main' : 'error.main'
        }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Section titles
  const SectionTitle = ({ title }: { title: string }) => (
    <Box sx={{ mb: 3, mt: 4 }}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      <Divider />
    </Box>
  );

  // AI insights section
  const renderAIInsights = () => {
    if (!analysis.aiInsights) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          AI insights are not available for this analysis.
        </Alert>
      );
    }

    const { investmentScore, summary, strengths, weaknesses, recommendations } = analysis.aiInsights;
    
    // Determine score color
    let scoreColor = 'error.main';
    if (investmentScore >= 70) scoreColor = 'success.main';
    else if (investmentScore >= 50) scoreColor = 'warning.main';
    
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Card sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: scoreColor,
            color: 'white',
            mr: 3
          }}>
            <Typography variant="h4" fontWeight="bold">
              {investmentScore}
            </Typography>
          </Card>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Investment Score
            </Typography>
            <Typography variant="body1">
              {summary}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                Strengths
              </Typography>
              <Stack spacing={1}>
                {strengths.map((strength, index) => (
                  <Chip 
                    key={index} 
                    label={strength} 
                    color="success" 
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Warning color="error" sx={{ mr: 1 }} />
                Weaknesses
              </Typography>
              <Stack spacing={1}>
                {weaknesses.map((weakness, index) => (
                  <Chip 
                    key={index} 
                    label={weakness} 
                    color="error" 
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Star color="warning" sx={{ mr: 1 }} />
                Recommendations
              </Typography>
              <Stack spacing={1}>
                {recommendations.map((recommendation, index) => (
                  <Chip 
                    key={index} 
                    label={recommendation} 
                    color="primary" 
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Top metrics section
  const renderTopMetrics = () => {
    const { annualAnalysis, monthlyAnalysis } = analysis;
    const cashFlowPositive = monthlyAnalysis.cashFlow > 0;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AttachMoney />}
            title="Monthly Cash Flow"
            value={formatCurrency(monthlyAnalysis.cashFlow)}
            subtitle="Net monthly income after all expenses"
            positive={cashFlowPositive}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<PriceChange />}
            title="Cash on Cash Return"
            value={formatPercentage(annualAnalysis.cashOnCashReturn)}
            subtitle="Annual return relative to cash invested"
            positive={annualAnalysis.cashOnCashReturn > 4}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<AccountBalance />}
            title="Cap Rate"
            value={formatPercentage(annualAnalysis.capRate)}
            subtitle="NOI relative to property value"
            positive={annualAnalysis.capRate > 5}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<ShowChart />}
            title="DSCR"
            value={formatRatio(annualAnalysis.dscr)}
            subtitle="Debt Service Coverage Ratio"
            positive={annualAnalysis.dscr > 1}
          />
        </Grid>
      </Grid>
    );
  };

  // Annual analysis section
  const renderAnnualAnalysis = () => {
    const { annualAnalysis } = analysis;
    
    return (
      <>
        <SectionTitle title="Annual Financial Summary" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Annual Financial Metrics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Net Operating Income (NOI)</TableCell>
                      <TableCell align="right">{formatCurrency(annualAnalysis.annualNOI)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Effective Gross Income</TableCell>
                      <TableCell align="right">{formatCurrency(annualAnalysis.effectiveGrossIncome)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Annual Debt Service</TableCell>
                      <TableCell align="right">{formatCurrency(annualAnalysis.annualDebtService)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Annual Cash Flow</TableCell>
                      <TableCell align="right">
                        {formatCurrency(annualAnalysis.annualNOI - annualAnalysis.annualDebtService)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Investment</TableCell>
                      <TableCell align="right">{formatCurrency(annualAnalysis.totalInvestment)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Monthly Expenses Breakdown
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getExpensesData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {getExpensesData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  };

  // Long-term analysis section
  const renderLongTermAnalysis = () => {
    const { longTermAnalysis } = analysis;
    const { exitAnalysis, returns } = longTermAnalysis;
    
    return (
      <>
        <SectionTitle title="Long-Term Projections" />
        
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Cash Flow Projection
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getCashFlowData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="cashFlow" stroke="#8884d8" name="Cash Flow" />
                    <Line type="monotone" dataKey="noi" stroke="#82ca9d" name="NOI" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Equity Growth
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getEquityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area type="monotone" dataKey="propertyValue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Property Value" />
                    <Area type="monotone" dataKey="mortgageBalance" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Mortgage Balance" />
                    <Area type="monotone" dataKey="equity" stackId="3" stroke="#ffc658" fill="#ffc658" name="Equity" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Returns Summary
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getReturnsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8">
                      {getReturnsData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Exit Strategy
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Projected Sale Price</TableCell>
                      <TableCell align="right">{formatCurrency(exitAnalysis.projectedSalePrice)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Selling Costs</TableCell>
                      <TableCell align="right">{formatCurrency(exitAnalysis.sellingCosts)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mortgage Payoff</TableCell>
                      <TableCell align="right">{formatCurrency(exitAnalysis.mortgagePayoff)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Net Proceeds from Sale</TableCell>
                      <TableCell align="right">{formatCurrency(exitAnalysis.netProceedsFromSale)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Cash Flow (all years)</TableCell>
                      <TableCell align="right">{formatCurrency(returns.totalCashFlow)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Appreciation</TableCell>
                      <TableCell align="right">{formatCurrency(returns.totalAppreciation)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Return</TableCell>
                      <TableCell align="right">{formatCurrency(returns.totalReturn)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IRR</TableCell>
                      <TableCell align="right">{formatPercentage(returns.irr)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  };

  // Render property metrics section
  const renderPropertyMetrics = () => {
    const { keyMetrics } = analysis;
    
    return (
      <>
        <SectionTitle title="Property Metrics" />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MetricCard
              icon={<Home />}
              title="Price Per SqFt"
              value={formatCurrency(keyMetrics.pricePerSqFtAtPurchase)}
              subtitle="Property price per square foot"
              color="info.main"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <MetricCard
              icon={<TrendingUp />}
              title="Future Price Per SqFt"
              value={formatCurrency(keyMetrics.pricePerSqFtAtSale)}
              subtitle="Projected price per square foot at sale"
              color="info.main"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <MetricCard
              icon={<AttachMoney />}
              title="Rent Per SqFt"
              value={`$${keyMetrics.avgRentPerSqFt.toFixed(2)}`}
              subtitle="Average monthly rent per square foot"
              color="info.main"
            />
          </Grid>
        </Grid>
      </>
    );
  };

  // Main component render
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Analysis Results
      </Typography>

      {/* Top Metrics */}
      {renderTopMetrics()}

      {/* Tab Navigation */}
      <Box sx={{ mt: 4 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          aria-label="analysis tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<AccountBalance />} 
            label="Financial" 
            id="analysis-tab-0" 
            aria-controls="analysis-tabpanel-0"
            iconPosition="start"
          />
          <Tab 
            icon={<Timeline />} 
            label="Long-Term" 
            id="analysis-tab-1" 
            aria-controls="analysis-tabpanel-1"
            iconPosition="start"
          />
          <Tab 
            icon={<Home />} 
            label="Property" 
            id="analysis-tab-2" 
            aria-controls="analysis-tabpanel-2"
            iconPosition="start"
          />
          <Tab 
            icon={<Star />} 
            label="AI Insights" 
            id="analysis-tab-3" 
            aria-controls="analysis-tabpanel-3"
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={tabIndex} index={0}>
          {renderAnnualAnalysis()}
        </TabPanel>
        
        <TabPanel value={tabIndex} index={1}>
          {renderLongTermAnalysis()}
        </TabPanel>
        
        <TabPanel value={tabIndex} index={2}>
          {renderPropertyMetrics()}
        </TabPanel>
        
        <TabPanel value={tabIndex} index={3}>
          {renderAIInsights()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default AnalysisResultsV2; 