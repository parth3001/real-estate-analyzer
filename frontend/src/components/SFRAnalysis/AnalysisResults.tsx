import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import type { Analysis } from '../../types/analysis';
import type { SFRPropertyData } from '../../types/property';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalysisResultsProps {
  analysis: Analysis;
  propertyData: SFRPropertyData;
}

// Format number as currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format number as percentage
const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Add formatDecimal function near the other formatting functions at the top
const formatDecimal = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, propertyData }) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Validate analysis data structure
  React.useEffect(() => {
    try {
      // Log the analysis structure to help debug
      console.log('Analysis data:', analysis);
      
      // Validate essential structure
      if (!analysis.monthlyAnalysis?.expenses) {
        setError('Monthly analysis expenses data is missing');
        return;
      }
      
      if (!analysis.longTermAnalysis?.projections) {
        setError('Long-term projections data is missing');
        return;
      }
      
      setError(null);
    } catch (err) {
      console.error('Error validating analysis data:', err);
      setError('Error processing analysis data');
    }
  }, [analysis]);
  
  // Safely prepare expense breakdown data
  let expenseBreakdownData: Array<{ name: string; value: number }> = [];
  try {
    expenseBreakdownData = [
      { name: 'Mortgage', value: analysis.monthlyAnalysis.expenses.mortgage?.total || 0 },
      { name: 'Property Tax', value: analysis.monthlyAnalysis.expenses.propertyTax || 0 },
      { name: 'Insurance', value: analysis.monthlyAnalysis.expenses.insurance || 0 },
      { name: 'Maintenance', value: analysis.monthlyAnalysis.expenses.maintenance || 0 },
      { name: 'Property Management', value: analysis.monthlyAnalysis.expenses.propertyManagement || 0 },
      { name: 'Vacancy', value: analysis.monthlyAnalysis.expenses.vacancy || 0 }
    ].filter(item => item.value > 0);
  } catch (err) {
    console.error('Error preparing expense breakdown data:', err);
    expenseBreakdownData = [];
  }
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];
  
  // Safely prepare cash flow chart data
  let cashFlowData: Array<{ name: string; cashFlow: number; propertyValue: number }> = [];
  try {
    if (Array.isArray(analysis.longTermAnalysis.projections)) {
      cashFlowData = analysis.longTermAnalysis.projections.map(year => ({
        name: `Year ${year.year}`,
        cashFlow: year.cashFlow,
        propertyValue: year.propertyValue
      }));
    }
  } catch (err) {
    console.error('Error preparing cash flow data:', err);
    cashFlowData = [];
  }

  // Display error if validation failed
  if (error) {
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Displaying Analysis
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Get data from analysis object
  const mortgagePayment = analysis.monthlyAnalysis.expenses.mortgage?.total || 0;
  const monthlyRent = propertyData.monthlyRent || 0;
  const vacancyRate = propertyData.longTermAssumptions?.vacancyRate || 5;
  const vacancyLoss = monthlyRent * (vacancyRate / 100);
  const effectiveRentalIncome = monthlyRent - vacancyLoss;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Analysis Results: {propertyData.propertyName || 'Property'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {propertyData.propertyAddress?.street}, {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state} {propertyData.propertyAddress?.zipCode}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Expanded Key Metrics Section */}
        <Typography variant="h6" gutterBottom>Key Metrics</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cap Rate
                  <Tooltip title="Net Operating Income / Property Value">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.capRate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on Purchase Price
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cash on Cash Return
                  <Tooltip title="Annual Cash Flow / Total Investment">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.cashOnCashReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  DSCR
                  <Tooltip title="Net Operating Income / Annual Debt Service">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {analysis.keyMetrics.dscr.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Debt Service Coverage Ratio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {propertyData.longTermAssumptions?.projectionYears || 10}-Year IRR
                  <Tooltip title="Internal Rate of Return over the projection period">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.keyMetrics.irr)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Internal Rate of Return
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Cash Flow
                  <Tooltip title="Monthly Income - Monthly Expenses">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.monthlyAnalysis.cashFlow)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First Year Average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total ROI ({propertyData.longTermAssumptions?.projectionYears || 10} yr)
                  <Tooltip title="Total Return on Investment over projection period">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercent(analysis.longTermAnalysis.exitAnalysis.returnOnInvestment)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {propertyData.longTermAssumptions?.projectionYears || 10} Year Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price/SqFt
                  <Tooltip title="Purchase Price per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(propertyData.purchasePrice / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Initial Purchase
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Price/SqFt at Sale
                  <Tooltip title="Projected Sale Price per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Year 10 Projection
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Avg Rent/SqFt
                  <Tooltip title="Monthly Rent per Square Foot">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(monthlyRent / (propertyData.squareFootage || 1))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly Average
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Return
                  <Tooltip title="Net Proceeds + Total Cash Flow">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(analysis.longTermAnalysis.returns.totalReturn || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  10 Year Projection
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Investment
                  <Tooltip title="Down Payment + Closing Costs + Repair Costs">
                    <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(propertyData.downPayment + (propertyData.closingCosts || 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Down Payment + Costs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {analysis.aiInsights?.investmentScore !== undefined && (
            <Grid item xs={6} sm={4} md={2}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    AI Investment Score
                    <Tooltip title="AI-Generated Investment Quality Score (0-100)">
                      <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </Typography>
                  <Typography variant="h5" component="div">
                    {analysis.aiInsights.investmentScore}/100
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    AI Recommendation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Tabs for different sections */}
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange}
            aria-label="Analysis detail tabs"
          >
            <Tab label="Monthly Analysis" />
            <Tab label="Annual Analysis" />
            <Tab label="Year-by-Year Projections" />
            <Tab label="Exit Analysis" />
            {analysis.aiInsights && <Tab label="AI Insights" />}
          </Tabs>
        </Box>
        
        {/* Monthly Analysis Tab */}
        {tabIndex === 0 && (
          <Box>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Income & Expenses</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Gross Rental Income</TableCell>
                        <TableCell align="right">{formatCurrency(monthlyRent)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vacancy Loss ({formatPercent(vacancyRate)})</TableCell>
                        <TableCell align="right">-{formatCurrency(vacancyLoss)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Effective Rental Income</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(effectiveRentalIncome)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}><Divider /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mortgage Payment</TableCell>
                        <TableCell align="right">-{formatCurrency(mortgagePayment)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Tax</TableCell>
                        <TableCell align="right">-{formatCurrency(analysis.monthlyAnalysis.expenses.breakdown.propertyTax)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Insurance</TableCell>
                        <TableCell align="right">-{formatCurrency(analysis.monthlyAnalysis.expenses.breakdown.insurance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maintenance</TableCell>
                        <TableCell align="right">-{formatCurrency(analysis.monthlyAnalysis.expenses.breakdown.maintenance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Management</TableCell>
                        <TableCell align="right">-{formatCurrency(analysis.monthlyAnalysis.expenses.breakdown.propertyManagement)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Total Monthly Expenses</strong></TableCell>
                        <TableCell align="right"><strong>-{formatCurrency(analysis.monthlyAnalysis.expenses.total)}</strong></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}><Divider /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Monthly Cash Flow</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(analysis.monthlyAnalysis.cashFlow)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Monthly Expense Breakdown</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Annual Analysis Tab */}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Annual Financial Summary</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Gross Rental Income</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.annualAnalysis.income)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Effective Gross Income</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.annualAnalysis.income * (1 - vacancyRate/100))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Operating Expenses</TableCell>
                    <TableCell align="right">-{formatCurrency(Math.abs(analysis.annualAnalysis.expenses))}</TableCell>
                  </TableRow>
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell><strong>Net Operating Income (NOI)</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.annualAnalysis.noi)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Annual Debt Service</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis.annualAnalysis.debtService)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell><strong>Annual Cash Flow</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.annualAnalysis.cashFlow)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2}><Divider /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Total Investment
                      <Tooltip title="Down Payment + Closing Costs + Repair Costs">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(propertyData.downPayment + (propertyData.closingCosts || 0))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Cap Rate
                      <Tooltip title="NOI / Property Value">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatPercent(analysis.keyMetrics.capRate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Cash on Cash Return
                      <Tooltip title="Annual Cash Flow / Total Investment">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{formatPercent(analysis.keyMetrics.cashOnCashReturn)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Debt Service Coverage Ratio
                      <Tooltip title="NOI / Annual Debt Service">
                        <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{analysis.keyMetrics.dscr.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Monthly Cash Flow</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.monthlyAnalysis.cashFlow)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Year-by-Year Projections Tab */}
        {tabIndex === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Year-by-Year Projections</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.longTermAnalysis.projections.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell>{year.year}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyValue)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.grossRent || year.grossIncome)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyTax)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.insurance)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.maintenance)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.propertyManagement)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.vacancy)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.operatingExpenses)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.noi)}</TableCell>
                      <TableCell align="right">{formatCurrency(year.debtService)}</TableCell>
                      <TableCell align="right" sx={{ color: year.cashFlow < 0 ? 'error.main' : 'success.main' }}>
                        {year.cashFlow < 0 ? '-' : ''}{formatCurrency(Math.abs(year.cashFlow))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Exit Analysis Tab */}
        {tabIndex === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Exit Analysis</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Projected Sale Price (Year {propertyData.longTermAssumptions.projectionYears})</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Selling Costs ({formatPercent(propertyData.longTermAssumptions.sellingCostsPercentage)})</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.sellingCosts)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mortgage Payoff</TableCell>
                    <TableCell align="right">-{formatCurrency(analysis.longTermAnalysis.exitAnalysis.mortgagePayoff)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Net Proceeds from Sale</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Cash Flow (All Years)</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns.totalCashFlow)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Appreciation</TableCell>
                    <TableCell align="right">{formatCurrency(analysis.longTermAnalysis.returns.totalAppreciation)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total Return</strong></TableCell>
                    <TableCell align="right"><strong>{formatCurrency(analysis.longTermAnalysis.returns.totalReturn)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>IRR (Internal Rate of Return)</strong></TableCell>
                    <TableCell align="right"><strong>{formatPercent(analysis.longTermAnalysis.returns.irr)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* AI Insights Tab */}
        {tabIndex === 4 && analysis.aiInsights && (
          <Box>
            <Typography variant="h6" gutterBottom>AI Analysis Summary</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1">{analysis.aiInsights.summary}</Typography>
            </Paper>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Investment Strengths</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  {Array.isArray(analysis.aiInsights.strengths) && analysis.aiInsights.strengths.map((strength, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {strength}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.strengths) || analysis.aiInsights.strengths.length === 0) && (
                    <Typography variant="body2">No strengths available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Investment Weaknesses</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  {Array.isArray(analysis.aiInsights.weaknesses) && analysis.aiInsights.weaknesses.map((weakness, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {weakness}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.weaknesses) || analysis.aiInsights.weaknesses.length === 0) && (
                    <Typography variant="body2">No weaknesses available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {Array.isArray(analysis.aiInsights.recommendations) && analysis.aiInsights.recommendations.map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {rec}
                    </Typography>
                  ))}
                  {(!Array.isArray(analysis.aiInsights.recommendations) || analysis.aiInsights.recommendations.length === 0) && (
                    <Typography variant="body2">No recommendations available</Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Investment Score</Typography>
                    <Typography variant="h3" align="center">
                      {analysis.aiInsights.investmentScore || 0}/100
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {analysis.aiInsights.recommendedHoldPeriod && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Recommended Hold Period</Typography>
                      <Typography variant="h5" align="center">
                        {analysis.aiInsights.recommendedHoldPeriod}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AnalysisResults; 