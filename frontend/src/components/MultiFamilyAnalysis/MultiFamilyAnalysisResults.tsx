import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid as MuiGrid,
  Tabs,
  Tab,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import {
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Apartment as ApartmentIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  Assessment as AssessmentIcon
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
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import type { Analysis } from '../../types/analysis';

// Define types for chart data
interface ExpenseDataItem extends Record<string, unknown> {
  name: string;
  value: number;
}

interface YearlyProjectionData extends Record<string, unknown> {
  year: string;
  cashFlow: number;
  equity: number;
  propertyValue: number;
}

const Grid = MuiGrid as React.ComponentType<{
  container?: boolean;
  item?: boolean;
  xs?: number;
  md?: number;
  sm?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  key?: React.Key;
}>;

interface MultiFamilyAnalysisResultsProps {
  results: Analysis;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MultiFamilyAnalysisResults: React.FC<MultiFamilyAnalysisResultsProps> = ({ results }) => {
  const [mainTab, setMainTab] = useState(0);
  const [chartTab, setChartTab] = useState(0);

  if (!results) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" align="center">
            No analysis results available. Please analyze a deal first.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Safely destructure and provide default values
  const monthlyAnalysis = results.monthlyAnalysis || { expenses: {} };
  const annualAnalysis = results.annualAnalysis || {
    dscr: 0,
    cashOnCashReturn: 0,
    capRate: 0,
    totalInvestment: 0,
    annualNOI: 0,
    annualDebtService: 0,
    effectiveGrossIncome: 0
  };
  const longTermAnalysis = results.longTermAnalysis || {
    yearlyProjections: [],
    projectionYears: 0,
    returns: {
      irr: 0,
      totalCashFlow: 0,
      totalAppreciation: 0,
      totalReturn: 0
    },
    exitAnalysis: {
      projectedSalePrice: 0,
      sellingCosts: 0,
      mortgagePayoff: 0,
      netProceedsFromSale: 0
    }
  };
  const aiInsights = results.aiInsights;
  const keyMetrics = results.keyMetrics || {
    pricePerSqFtAtPurchase: 0,
    pricePerSqFtAtSale: 0,
    avgRentPerSqFt: 0
  };

  // Formatting helpers
  const formatCurrency = (value: number | undefined): string => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined): string => {
    if (!value && value !== 0) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  // Handle tab changes
  const handleMainTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  const handleChartTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setChartTab(newValue);
  };

  const renderMainMetrics = () => {
    const metrics = [
      {
        label: 'Cap Rate',
        value: annualAnalysis.capRate,
        format: 'percent',
        icon: <AssessmentIcon color="primary" />,
        tooltip: 'Net Operating Income divided by property value'
      },
      {
        label: 'Cash on Cash Return',
        value: annualAnalysis.cashOnCashReturn,
        format: 'percent',
        icon: <TrendingUpIcon color="primary" />,
        tooltip: 'Annual cash flow divided by total investment'
      },
      {
        label: 'DSCR',
        value: annualAnalysis.dscr,
        format: 'number',
        icon: <AccountBalanceIcon color="primary" />,
        tooltip: 'Debt Service Coverage Ratio - NOI divided by annual debt service'
      },
      {
        label: 'Total Investment',
        value: annualAnalysis.totalInvestment,
        format: 'currency',
        icon: <PieChartIcon color="primary" />,
        tooltip: 'Total initial investment including down payment, closing costs, and repairs'
      },
      {
        label: 'Annual NOI',
        value: annualAnalysis.annualNOI,
        format: 'currency',
        icon: <BarChartIcon color="primary" />,
        tooltip: 'Annual Net Operating Income'
      },
      {
        label: 'Monthly Cash Flow',
        value: monthlyAnalysis.cashFlow || 0,
        format: 'currency',
        icon: <TimelineIcon color="primary" />,
        tooltip: 'Monthly cash flow after all expenses and debt service'
      }
    ];

    return (
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Tooltip title={metric.tooltip} arrow placement="top">
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {metric.icon}
                    <Typography variant="h6" component="div" ml={1}>
                      {metric.label}
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {metric.format === 'percent' 
                      ? formatPercentage(metric.value)
                      : metric.format === 'currency'
                        ? formatCurrency(metric.value)
                        : metric.value.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderExpenseChart = () => {
    if (!monthlyAnalysis?.expenses) return null;
    
    const expenseData: ExpenseDataItem[] = Object.entries(monthlyAnalysis.expenses)
      .filter(([key]) => key !== 'total' && typeof monthlyAnalysis.expenses[key] === 'number')
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeof value === 'number' ? value : 0
      }))
      .filter(item => item.value > 0);

    return (
      <Box mt={4} height={300}>
        <Typography variant="h6" gutterBottom>
          Monthly Expense Breakdown
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={expenseData as any}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {expenseData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderCashFlowChart = () => {
    if (!longTermAnalysis?.yearlyProjections?.length) return null;
    
    const data: YearlyProjectionData[] = longTermAnalysis.yearlyProjections.map(year => ({
      year: `Year ${year.year}`,
      cashFlow: year.cashFlow,
      equity: year.equity,
      propertyValue: year.propertyValue
    }));

    return (
      <Box mt={4} height={300}>
        <Typography variant="h6" gutterBottom>
          Long-Term Cash Flow and Equity Growth
        </Typography>
        <Tabs
          value={chartTab}
          onChange={handleChartTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Cash Flow" />
          <Tab label="Equity" />
          <Tab label="Property Value" />
        </Tabs>
        <ResponsiveContainer width="100%" height="100%">
          {chartTab === 0 ? (
            <BarChart 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={data as any}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="cashFlow" fill="#8884d8" name="Annual Cash Flow" />
            </BarChart>
          ) : chartTab === 1 ? (
            <AreaChart 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={data as any}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="equity" fill="#82ca9d" stroke="#82ca9d" name="Equity" />
            </AreaChart>
          ) : (
            <LineChart 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={data as any}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="propertyValue" stroke="#ff7300" name="Property Value" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderYearlyProjections = () => {
    if (!longTermAnalysis?.yearlyProjections?.length) return null;

    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Yearly Projections
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell align="right">Cash Flow</TableCell>
                <TableCell align="right">Property Value</TableCell>
                <TableCell align="right">Equity</TableCell>
                <TableCell align="right">NOI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {longTermAnalysis.yearlyProjections.map((projection) => (
                <TableRow key={projection.year}>
                  <TableCell component="th" scope="row">
                    Year {projection.year}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(projection.cashFlow)}</TableCell>
                  <TableCell align="right">{formatCurrency(projection.propertyValue)}</TableCell>
                  <TableCell align="right">{formatCurrency(projection.equity)}</TableCell>
                  <TableCell align="right">{formatCurrency(projection.noi)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderExitAnalysis = () => {
    if (!longTermAnalysis?.exitAnalysis) return null;

    const exitData = [
      { name: 'Projected Sale Price', value: longTermAnalysis.exitAnalysis.projectedSalePrice },
      { name: 'Selling Costs', value: longTermAnalysis.exitAnalysis.sellingCosts },
      { name: 'Mortgage Payoff', value: longTermAnalysis.exitAnalysis.mortgagePayoff },
      { name: 'Net Proceeds', value: longTermAnalysis.exitAnalysis.netProceedsFromSale }
    ];

    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Exit Analysis
        </Typography>
        <Grid container spacing={3}>
          {exitData.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(item.value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderMultiFamilySpecificMetrics = () => {
    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Multi-Family Specific Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ApartmentIcon color="primary" />
                  <Typography variant="subtitle1" ml={1}>
                    Price Per Unit
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {formatCurrency(keyMetrics.pricePerSqFtAtPurchase * 1000)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ApartmentIcon color="primary" />
                  <Typography variant="subtitle1" ml={1}>
                    Price Per SqFt
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {formatCurrency(keyMetrics.pricePerSqFtAtPurchase)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ApartmentIcon color="primary" />
                  <Typography variant="subtitle1" ml={1}>
                    GRM (Gross Rent Multiplier)
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {(annualAnalysis.totalInvestment / annualAnalysis.effectiveGrossIncome).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderAIAnalysis = () => {
    if (!aiInsights) return null;

    return (
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          AI Analysis
        </Typography>
        
        {aiInsights.investmentScore !== undefined && (
          <Box mb={3} display="flex" alignItems="center">
            <Typography variant="h6" mr={2}>
              Investment Score:
            </Typography>
            <Typography variant="h4" color={aiInsights.investmentScore > 70 ? 'success.main' : aiInsights.investmentScore > 50 ? 'warning.main' : 'error.main'}>
              {aiInsights.investmentScore}/100
            </Typography>
          </Box>
        )}
        
        {aiInsights.summary && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography>{aiInsights.summary}</Typography>
          </Paper>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Strengths
              </Typography>
              <List>
                {aiInsights.strengths?.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Areas for Improvement
              </Typography>
              <List>
                {aiInsights.weaknesses?.map((weakness, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={weakness} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {aiInsights.unitMixAnalysis && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Unit Mix Analysis
                </Typography>
                <Typography>{aiInsights.unitMixAnalysis}</Typography>
              </Paper>
            </Grid>
          )}
          
          {aiInsights.marketPositionAnalysis && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Market Position
                </Typography>
                <Typography>{aiInsights.marketPositionAnalysis}</Typography>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <List>
                {aiInsights.recommendations?.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {aiInsights.valueAddOpportunities && aiInsights.valueAddOpportunities.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Value-Add Opportunities
                </Typography>
                <List>
                  {aiInsights.valueAddOpportunities.map((opportunity, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TrendingUpIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={opportunity} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
          
          {aiInsights.recommendedHoldPeriod && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recommended Hold Period
                </Typography>
                <Typography variant="body1">{aiInsights.recommendedHoldPeriod}</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // TabPanel component for main tabs
  const TabPanel = (props: { children: React.ReactNode; value: number; index: number }) => {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <Box mt={4}>
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={mainTab} onChange={handleMainTabChange} variant="fullWidth">
              <Tab label="Key Metrics" />
              <Tab label="Projections" />
              <Tab label="AI Analysis" />
            </Tabs>
          </Box>
          
          <TabPanel value={mainTab} index={0}>
            {renderMainMetrics()}
            {renderMultiFamilySpecificMetrics()}
            {renderExpenseChart()}
          </TabPanel>
          
          <TabPanel value={mainTab} index={1}>
            {renderCashFlowChart()}
            {renderYearlyProjections()}
            {renderExitAnalysis()}
          </TabPanel>
          
          <TabPanel value={mainTab} index={2}>
            {renderAIAnalysis()}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MultiFamilyAnalysisResults; 