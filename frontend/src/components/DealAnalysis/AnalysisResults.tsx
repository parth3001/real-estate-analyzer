import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Grid as MuiGrid
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import {
  AddCircleOutline,
  ErrorOutline,
  LightbulbOutlined,
  TrendingUp,
  Assessment
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
import { CompleteExtendedAnalysis } from '../../types/analysisExtended';

interface AnalysisResultsProps {
  analysis?: CompleteExtendedAnalysis;
}

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
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
}>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis = {} as CompleteExtendedAnalysis }) => {
  const [mainTab, setMainTab] = useState(0);
  const [chartTab, setChartTab] = useState(0);

  // Safely destructure and provide default values with proper typing
  const monthlyAnalysis = analysis?.monthlyAnalysis || { 
    expenses: {
      propertyTax: 0,
      insurance: 0,
      maintenance: 0,
      propertyManagement: 0,
      vacancy: 0,
      total: 0
    },
    cashFlow: 0
  };
  
  const annualAnalysis = analysis?.annualAnalysis || {
    dscr: 0,
    cashOnCashReturn: 0,
    capRate: 0,
    totalInvestment: 0,
    annualNOI: 0,
    annualDebtService: 0,
    effectiveGrossIncome: 0
  };
  
  const longTermAnalysis = analysis?.longTermAnalysis || {
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
  
  const aiInsights = analysis?.aiInsights;
  const purchasePrice = analysis?.purchasePrice || 0;
  const keyMetrics = analysis?.keyMetrics || {
    pricePerSqFtAtPurchase: 0,
    pricePerSqFtAtSale: 0,
    avgRentPerSqFt: 0
  };
  
  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | undefined): string => {
    if (!value && value !== 0) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  // Calculate cash on cash return safely
  const calculateCashOnCashReturn = (cashFlow: number): string => {
    if (!purchasePrice || purchasePrice <= 0) return '0.00%';
    // Don't use purchase price for CoC calculation, use actual investment amount
    const totalInvestment = annualAnalysis.totalInvestment;
    if (!totalInvestment || totalInvestment <= 0) return '0.00%';
    
    // Calculate annual return percentage
    const annualReturn = (cashFlow / totalInvestment) * 100;
    return formatPercentage(annualReturn);
  };

  // Update the expense breakdown chart data preparation
  const getExpenseChartData = (): ChartData[] => {
    if (!monthlyAnalysis?.expenses) return [];
    
    return Object.entries(monthlyAnalysis.expenses)
      .filter(([key]) => key !== 'total')
      .map(([key, value]) => {
        // Handle the mortgage object which has a different structure
        if (key === 'mortgage' && value && typeof value === 'object' && 'total' in value) {
          return {
            name: 'Mortgage',
            value: value.total
          };
        }
        return {
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: typeof value === 'number' ? value : 0
        };
      })
      .filter(item => item.value > 0);
  };

  // Calculate total return
  const calculateTotalReturn = (): string => {
    const totalReturn = (longTermAnalysis.returns.totalCashFlow || 0) + 
                       (longTermAnalysis.returns.totalAppreciation || 0);
    return formatCurrency(totalReturn);
  };

  // Update calculateTotalInvestment to use safe expenses
  const calculateTotalInvestment = (): string => {
    // Get down payment from mortgage object
    const mortgageData = monthlyAnalysis.expenses.mortgage;
    const downPayment = typeof mortgageData === 'object' && mortgageData?.downPayment ? mortgageData.downPayment : 0;
    
    // Get closing costs - ensure it's a number
    const closingCosts = typeof monthlyAnalysis.expenses.closingCosts === 'number' ? monthlyAnalysis.expenses.closingCosts : 0;
    
    // Get any repair/renovation costs - ensure it's a number
    const repairCosts = typeof monthlyAnalysis.expenses.repairCosts === 'number' ? monthlyAnalysis.expenses.repairCosts : 0;
    
    // Sum all investment costs
    const totalInvestment = downPayment + closingCosts + repairCosts;
    
    return formatCurrency(totalInvestment);
  };

  // Chart Tabs
  const renderChartTabs = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={chartTab}
          onChange={(_, newValue) => setChartTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="CASH FLOW & VALUE" />
          <Tab label="EXPENSE BREAKDOWN" />
          <Tab label="EQUITY GROWTH" />
          <Tab label="RETURN COMPONENTS" />
        </Tabs>

        <TabPanel value={chartTab} index={0}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={longTermAnalysis?.yearlyProjections || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(data) => `Year ${data?.year || 0}`} />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cashFlow" 
                  name="Monthly Cash Flow" 
                  stroke="#8884d8" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="propertyValue" 
                  name="Property Value" 
                  stroke="#82ca9d" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="equity" 
                  name="Equity" 
                  stroke="#ffc658" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={chartTab} index={1}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={getExpenseChartData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label
                >
                  {getExpenseChartData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={chartTab} index={2}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer>
              <AreaChart data={longTermAnalysis?.yearlyProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(data) => `Year ${data.year}`} />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="propertyValue" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Property Value" 
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Equity" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        <TabPanel value={chartTab} index={3}>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={longTermAnalysis?.yearlyProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(data) => `Year ${data.year}`} />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cashFlow" fill="#8884d8" name="Cash Flow" />
                <Bar dataKey="appreciation" fill="#82ca9d" name="Appreciation" />
                <Bar dataKey="totalReturn" fill="#ffc658" name="Total Return" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>
      </Box>
    );
  };

  // Main Tabs
  const renderMainTabs = () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Tabs 
          value={mainTab}
          onChange={(_, newValue) => setMainTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="MONTHLY ANALYSIS" />
          <Tab label="ANNUAL PROJECTIONS" />
          <Tab label="EXIT ANALYSIS" />
          <Tab label="AI INSIGHTS" />
        </Tabs>

        {/* Monthly Analysis Tab */}
        <TabPanel value={mainTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">% of Rent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Calculate total rent for percentage calculations */}
                {(() => {
                  const expenses = monthlyAnalysis.expenses;
                  const grossRent = typeof expenses.rent === 'number' ? expenses.rent : 0;
                  
                  // Helper function to calculate percentage
                  const calcPercentage = (value: number) => {
                    if (grossRent === 0) return '0.00';
                    return ((value / grossRent) * 100).toFixed(2);
                  };

                  // Helper function to safely get numeric value
                  type NumericValue = number | { total: number } | undefined | null;

                  const getNumericValue = (value: NumericValue): number => {
                    if (typeof value === 'number') return value;
                    if (typeof value === 'object' && value && 'total' in value) return value.total;
                    return 0;
                  };
                  
                  return (
                    <>
                      <TableRow>
                        <TableCell>Gross Rent</TableCell>
                        <TableCell align="right">{formatCurrency(grossRent)}</TableCell>
                        <TableCell align="right">100%</TableCell>
                      </TableRow>
                      
                      {/* Property Tax */}
                      {expenses.propertyTax !== undefined && (
                        <TableRow>
                          <TableCell>Property Tax</TableCell>
                          <TableCell align="right">{formatCurrency(getNumericValue(expenses.propertyTax))}</TableCell>
                          <TableCell align="right">{calcPercentage(getNumericValue(expenses.propertyTax))}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Insurance */}
                      {expenses.insurance !== undefined && (
                        <TableRow>
                          <TableCell>Insurance</TableCell>
                          <TableCell align="right">{formatCurrency(getNumericValue(expenses.insurance))}</TableCell>
                          <TableCell align="right">{calcPercentage(getNumericValue(expenses.insurance))}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Maintenance */}
                      {expenses.maintenance !== undefined && (
                        <TableRow>
                          <TableCell>Maintenance</TableCell>
                          <TableCell align="right">{formatCurrency(getNumericValue(expenses.maintenance))}</TableCell>
                          <TableCell align="right">{calcPercentage(getNumericValue(expenses.maintenance))}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Property Management */}
                      {expenses.propertyManagement !== undefined && (
                        <TableRow>
                          <TableCell>Property Management</TableCell>
                          <TableCell align="right">{formatCurrency(getNumericValue(expenses.propertyManagement))}</TableCell>
                          <TableCell align="right">{calcPercentage(getNumericValue(expenses.propertyManagement))}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Vacancy */}
                      {expenses.vacancy !== undefined && (
                        <TableRow>
                          <TableCell>Vacancy</TableCell>
                          <TableCell align="right">{formatCurrency(getNumericValue(expenses.vacancy))}</TableCell>
                          <TableCell align="right">{calcPercentage(getNumericValue(expenses.vacancy))}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Mortgage Payment (Principal & Interest) */}
                      {expenses.mortgage && typeof expenses.mortgage === 'object' && (
                        <TableRow>
                          <TableCell>Principal & Interest</TableCell>
                          <TableCell align="right">{formatCurrency(expenses.mortgage.total)}</TableCell>
                          <TableCell align="right">{calcPercentage(expenses.mortgage.total)}%</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Net Cash Flow */}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Net Cash Flow</TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: (monthlyAnalysis.cashFlow || 0) >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatCurrency(monthlyAnalysis.cashFlow)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: (monthlyAnalysis.cashFlow || 0) >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {calcPercentage(monthlyAnalysis.cashFlow || 0)}%
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Annual Projections Tab */}
        <TabPanel value={mainTab} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Property Value</TableCell>
                  <TableCell align="right">Gross Rent</TableCell>
                  <TableCell align="right">Property Tax</TableCell>
                  <TableCell align="right">Insurance</TableCell>
                  <TableCell align="right">Maintenance</TableCell>
                  <TableCell align="right">Property Management</TableCell>
                  <TableCell align="right">Vacancy</TableCell>
                  <TableCell align="right">Total Expenses</TableCell>
                  <TableCell align="right">NOI</TableCell>
                  <TableCell align="right">Debt Service</TableCell>
                  <TableCell align="right">Cash Flow</TableCell>
                  <TableCell align="right">Cash on Cash Return</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {longTermAnalysis?.yearlyProjections.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell>{year.year}</TableCell>
                    <TableCell align="right">{formatCurrency(year.propertyValue)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.grossRent)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.propertyTax)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.insurance)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.maintenance)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.propertyManagement)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.vacancy)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.operatingExpenses)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.noi)}</TableCell>
                    <TableCell align="right">{formatCurrency(year.debtService)}</TableCell>
                    <TableCell align="right" sx={{ color: year.cashFlow >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(year.cashFlow)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: year.cashFlow >= 0 ? 'success.main' : 'error.main' }}>
                      {calculateCashOnCashReturn(year.cashFlow)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Exit Analysis Tab */}
        <TabPanel value={mainTab} index={2}>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Projected Sale Price</TableCell>
                  <TableCell align="right">{formatCurrency(longTermAnalysis.exitAnalysis.projectedSalePrice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Selling Costs</TableCell>
                  <TableCell align="right">{formatCurrency(longTermAnalysis.exitAnalysis.sellingCosts)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mortgage Payoff</TableCell>
                  <TableCell align="right">{formatCurrency(longTermAnalysis.exitAnalysis.mortgagePayoff)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Net Proceeds</TableCell>
                  <TableCell align="right">{formatCurrency(longTermAnalysis.exitAnalysis.netProceedsFromSale)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Return</TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ color: longTermAnalysis.returns.totalReturn >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {formatCurrency(longTermAnalysis.returns.totalReturn)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>IRR</TableCell>
                  <TableCell align="right">{formatPercentage(longTermAnalysis.returns.irr)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* AI Insights Tab */}
        <TabPanel value={mainTab} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              <LightbulbOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
              AI Investment Analysis
            </Typography>

            {/* Investment Score */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={aiInsights?.investmentScore || 0}
                  size={80}
                  thickness={4}
                  sx={{ 
                    color: (aiInsights?.investmentScore || 0) >= 80 ? 'success.main' :
                           (aiInsights?.investmentScore || 0) >= 60 ? 'warning.main' : 
                           'error.main'
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
                  <Typography variant="h5">{aiInsights?.investmentScore || 0}</Typography>
                </Box>
              </Box>
              <Typography variant="subtitle1" color="text.secondary">
                {(aiInsights?.investmentScore || 0) >= 80 ? 'Excellent Investment' :
                 (aiInsights?.investmentScore || 0) >= 70 ? 'Very Good Investment' :
                 (aiInsights?.investmentScore || 0) >= 60 ? 'Good Investment' :
                 (aiInsights?.investmentScore || 0) >= 50 ? 'Average Investment' :
                 'Below Average Investment'}
              </Typography>
            </Box>

            {/* Investment Summary */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Investment Summary
              </Typography>
              <Typography variant="body1">
                {aiInsights?.summary || 'AI insights are not available for this analysis.'}
              </Typography>
            </Paper>

            {/* Strengths */}
            {aiInsights?.strengths && aiInsights.strengths.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'success.dark' }}>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Strengths
                </Typography>
                <List dense>
                  {aiInsights.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AddCircleOutline sx={{ color: 'success.dark' }} />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Weaknesses */}
            {aiInsights?.weaknesses && aiInsights.weaknesses.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.dark' }}>
                  <ErrorOutline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Weaknesses
                </Typography>
                <List dense>
                  {aiInsights.weaknesses.map((weakness, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorOutline sx={{ color: 'error.dark' }} />
                      </ListItemIcon>
                      <ListItemText primary={weakness} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Recommendations */}
            {aiInsights?.recommendations && aiInsights.recommendations.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.dark' }}>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recommendations
                </Typography>
                <List dense>
                  {aiInsights.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <LightbulbOutlined sx={{ color: 'primary.dark' }} />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </TabPanel>
      </Box>
    );
  };

  // Tab Panel Component
  const TabPanel = (props: { children: React.ReactNode; value: number; index: number }) => {
    const { children, value, index } = props;
    return (
      <div role="tabpanel" hidden={value !== index}>
        {value === index && <Box>{children}</Box>}
      </div>
    );
  };

  // Key Metrics Section
  const renderKeyMetrics = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Key Metrics
        </Typography>
        <Grid container spacing={3}>
          {/* DSCR */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Debt Service Coverage Ratio: Measures the property's ability to cover its debt payments. A ratio above 1.2 is generally considered good. Calculated as Net Operating Income divided by Annual Debt Service." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  DSCR
                </Typography>
                <Typography variant="h5" color={annualAnalysis.dscr >= 1.2 ? 'success.main' : 'error.main'}>
                  {annualAnalysis.dscr.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Debt Service Coverage Ratio
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* 10-Year IRR */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Internal Rate of Return: The annual rate of growth an investment is expected to generate. Takes into account all cash flows including the eventual sale of the property. A higher IRR indicates a more profitable investment." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {longTermAnalysis.projectionYears}-Year IRR
                </Typography>
                <Typography variant="h5" color={longTermAnalysis.returns.irr >= 8 ? 'success.main' : 'error.main'}>
                  {formatPercentage(longTermAnalysis.returns.irr)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Internal Rate of Return
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Cash on Cash Return */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Cash on Cash Return: The annual cash flow divided by the total cash invested. Measures the cash income earned on the cash invested in the property. A CoC return above 8% is generally considered good for residential properties." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cash on Cash Return
                </Typography>
                <Typography variant="h5" color={annualAnalysis.cashOnCashReturn >= 8 ? 'success.main' : 'error.main'}>
                  {formatPercentage(annualAnalysis.cashOnCashReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Cap Rate */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Capitalization Rate: The ratio of a property's net operating income (NOI) to its purchase price. Measures the property's natural rate of return without considering financing. A cap rate above 5% is generally considered good for residential properties." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cap Rate
                </Typography>
                <Typography variant="h5" color={annualAnalysis.capRate >= 5 ? 'success.main' : 'error.main'}>
                  {formatPercentage(annualAnalysis.capRate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on Purchase Price
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Price/SqFt at Purchase */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Price per Square Foot at Purchase: The purchase price divided by the total square footage. Used to compare property values and assess if the purchase price is reasonable for the market." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Price/SqFt at Purchase
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(keyMetrics.pricePerSqFtAtPurchase)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Initial Purchase
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Price/SqFt at Sale */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Projected Price per Square Foot at Sale: The estimated sale price divided by the total square footage. Shows potential appreciation in property value per square foot." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Price/SqFt at Sale
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(keyMetrics.pricePerSqFtAtSale)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Year {longTermAnalysis.projectionYears} Projection
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Avg Rent/SqFt */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Average Rent per Square Foot: Monthly rent divided by total square footage. Used to compare rental rates and assess if the rent is reasonable for the market." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Rent/SqFt
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(keyMetrics.avgRentPerSqFt)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly Average
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Monthly Cash Flow */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Monthly Cash Flow: The money left over each month after all expenses and mortgage payments. Positive cash flow indicates the property is generating income, while negative means it's costing money monthly." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Monthly Cash Flow
                </Typography>
                <Typography variant="h5" color={(monthlyAnalysis.cashFlow || 0) >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(monthlyAnalysis.cashFlow)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year Average
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Total Return */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Total Return: The sum of all cash flows plus the equity gained from property appreciation over the investment period. Represents the total profit potential of the investment." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Return
                </Typography>
                <Typography variant="h5" color={longTermAnalysis.returns.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                  {calculateTotalReturn()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {longTermAnalysis.projectionYears} Year Total
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>

          {/* Total Investment */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title="Total Investment: The total amount of cash invested in the property, including down payment and closing costs. This is the actual amount of money you need to invest initially." arrow placement="top">
              <Paper sx={{ p: 2, cursor: 'help' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Investment
                </Typography>
                <Typography variant="h5">
                  {calculateTotalInvestment()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Down Payment + Costs
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {renderKeyMetrics()}
      {renderChartTabs()}
      {renderMainTabs()}
    </Box>
  );
};

export default AnalysisResults; 