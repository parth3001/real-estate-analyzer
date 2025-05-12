import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import RecommendIcon from '@mui/icons-material/Recommend';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StarIcon from '@mui/icons-material/Star';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Format currency values
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0';
  return '$' + value.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Format percentage values
const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%';
  return value.toFixed(2) + '%';
};

// Get color based on investment score
const getScoreColor = (score) => {
  if (score >= 80) return 'success.main';
  if (score >= 60) return 'warning.main';
  return 'error.main';
};

const MultiFamilyAnalysisResults = ({ results }) => {
  const theme = useTheme();

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

  // Prepare data for the expense breakdown pie chart
  const getExpenseBreakdownData = () => {
    if (!results || !results.propertyManagementExpense) {
      // Return sample data if real data is missing
      return [
        { name: 'Property Management', value: 500 },
        { name: 'Property Tax', value: 800 },
        { name: 'Insurance', value: 400 },
        { name: 'Repairs & Maintenance', value: 600 }
      ];
    }
    
    const expenses = [
      { name: 'Property Management', value: results.propertyManagementExpense || 0 },
      { name: 'Property Tax', value: results.propertyTaxExpense || 0 },
      { name: 'Insurance', value: results.insuranceExpense || 0 },
      { name: 'Repairs & Maintenance', value: results.repairsMaintenanceExpense || 0 },
      { name: 'Capital Expenditures', value: results.capExExpense || 0 },
      { name: 'Utilities', value: (results.waterSewerExpense || 0) + 
                               (results.garbageExpense || 0) + 
                               (results.commonElectricityExpense || 0) },
      { name: 'Other', value: results.otherExpenses || 0 },
    ];
    
    // Filter out expenses with zero value and ensure at least 2 categories
    const filteredExpenses = expenses.filter(expense => expense.value > 0);
    return filteredExpenses.length >= 2 ? filteredExpenses : expenses.slice(0, 4);
  };

  // Prepare data for the cash flow projection line chart
  const getCashFlowData = () => {
    if (!results.annualCashFlow || !Array.isArray(results.annualCashFlow) || results.annualCashFlow.length === 0) {
      // Return sample data if real data is missing
      return [
        { year: 'Year 1', cashFlow: -12000 },
        { year: 'Year 2', cashFlow: -11500 },
        { year: 'Year 3', cashFlow: -11000 },
        { year: 'Year 4', cashFlow: -10500 },
        { year: 'Year 5', cashFlow: -10000 }
      ];
    }
    
    return results.annualCashFlow.map((cf, index) => ({
      year: `Year ${index + 1}`,
      cashFlow: cf,
    }));
  };

  // Prepare data for unit mix visualization
  const getUnitMixData = () => {
    if (!results.unitBreakdown || !Array.isArray(results.unitBreakdown) || results.unitBreakdown.length === 0) {
      // Return sample data if real data is missing
      return [
        { name: '1BR', units: 4, income: 60000 },
        { name: '2BR', units: 6, income: 108000 }
      ];
    }
    
    return results.unitBreakdown.map(unit => ({
      name: unit.type || `Unit Type ${unit.id || ''}`,
      units: unit.count || 0,
      income: unit.annualIncome || 0,
    }));
  };

  // AI Analysis section
  const renderAIAnalysis = () => {
    // If no AI analysis is available
    if (!results.aiAnalysis) {
      return (
        <Paper sx={{ p: 2, height: '100%', mt: 2 }}>
          <Typography variant="h6" gutterBottom>AI Analysis</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Typography variant="body1" color="text.secondary">
              AI analysis is not available for this property.
            </Typography>
          </Box>
        </Paper>
      );
    }

    const { 
      summary, 
      strengths, 
      weaknesses, 
      recommendations, 
      unitMixAnalysis, 
      marketPositionAnalysis, 
      valueAddOpportunities, 
      investmentScore, 
      recommendedHoldPeriod 
    } = results.aiAnalysis;

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">AI Investment Analysis</Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Investment Score */}
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
                  value={investmentScore || 0} 
                  size={100} 
                  thickness={5}
                  sx={{ 
                    color: getScoreColor(investmentScore),
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
                    color={getScoreColor(investmentScore)}
                  >
                    {investmentScore || 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {investmentScore >= 80 ? 'Excellent Investment' : 
                 investmentScore >= 70 ? 'Very Good Investment' :
                 investmentScore >= 60 ? 'Good Investment' :
                 investmentScore >= 50 ? 'Average Investment' :
                 'Below Average Investment'}
              </Typography>
              
              {recommendedHoldPeriod && (
                <Chip 
                  icon={<TrendingUpIcon />} 
                  label={`Recommended Hold: ${recommendedHoldPeriod}`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              )}
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
                {summary}
              </Typography>
              
              {unitMixAnalysis && (
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ApartmentIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                    Unit Mix Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {unitMixAnalysis}
                  </Typography>
                </Box>
              )}
              
              {marketPositionAnalysis && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                    Market Position
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {marketPositionAnalysis}
                  </Typography>
                </Box>
              )}
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
                {strengths.map((strength, index) => (
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
                {weaknesses.map((weakness, index) => (
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
                {recommendations.map((recommendation, index) => (
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
          
          {/* Value-Add Opportunities */}
          {valueAddOpportunities && valueAddOpportunities.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Value-Add Opportunities
                </Typography>
                <Grid container spacing={1}>
                  {valueAddOpportunities.map((opportunity, index) => (
                    <Grid item key={index}>
                      <Chip 
                        label={opportunity} 
                        color="primary"
                        variant="outlined" 
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };

  // Main financial metrics section
  const renderMainMetrics = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Key Returns</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Cash on Cash Return</Typography>
              <Typography variant="h6" color={results.cashOnCashReturn >= 8 ? 'success.main' : 'warning.main'}>
                {formatPercent(results.cashOnCashReturn)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Cap Rate</Typography>
              <Typography variant="h6">
                {formatPercent(results.capRate)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">5-Year ROI</Typography>
              <Typography variant="h6">
                {formatPercent(results.fiveYearROI)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Internal Rate of Return</Typography>
              <Typography variant="h6">
                {formatPercent(results.irr)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Cash Flow</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Monthly Cash Flow</Typography>
              <Typography 
                variant="h6" 
                color={results.monthlyCashFlow >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(results.monthlyCashFlow)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Annual Cash Flow</Typography>
              <Typography 
                variant="h6" 
                color={results.annualCashFlow ? (results.annualCashFlow[0] >= 0 ? 'success.main' : 'error.main') : 'text.primary'}
              >
                {formatCurrency(results.annualCashFlow ? results.annualCashFlow[0] : 0)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Cash Flow Per Unit</Typography>
              <Typography variant="h6">
                {formatCurrency(results.cashFlowPerUnit)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Price Per Unit</Typography>
              <Typography variant="h6">
                {formatCurrency(results.pricePerUnit)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  // Income and expenses section
  const renderIncomeExpenses = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Income</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Gross Potential Rent</Typography>
              <Typography variant="h6">
                {formatCurrency(results.grossPotentialRent)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Vacancy Loss</Typography>
              <Typography variant="h6" color="error.main">
                -{formatCurrency(results.vacancyLoss)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Effective Gross Income</Typography>
              <Typography variant="h6">
                {formatCurrency(results.effectiveGrossIncome)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Other Income</Typography>
              <Typography variant="h6">
                {formatCurrency(results.otherIncome || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Expenses</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Total Operating Expenses</Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(results.operatingExpenses)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">NOI</Typography>
              <Typography variant="h6" color={results.noi >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(results.noi)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Debt Service</Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(results.annualDebtService)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Expense Ratio</Typography>
              <Typography variant="h6">
                {formatPercent(results.expenseRatio)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  // Standardize card style with consistent padding, borders, and heights
  const cardStyle = {
    p: 3,
    height: '100%',
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: 1,
    borderRadius: 2,
    bgcolor: 'background.paper',
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: 3
    }
  };

  // Expense breakdown section with improved sizing
  const renderExpenseBreakdown = () => {
    const expenses = getExpenseBreakdownData();
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.value, 0);
    
    return (
      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Expense Breakdown</Typography>
        <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
          {expenses.map((expense, index) => {
            const percentage = ((expense.value / totalExpense) * 100).toFixed(1);
            return (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: COLORS[index % COLORS.length],
                        display: 'inline-block',
                        mr: 1
                      }} 
                    />
                    {expense.name}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(expense.value)} ({percentage}%)
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', backgroundColor: 'grey.100', borderRadius: 1, height: 16 }}>
                  <Box
                    sx={{
                      width: `${percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                      height: '100%',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  };

  // Unit mix visualization with consistent card size
  const renderUnitMix = () => {
    const unitData = getUnitMixData();
    const maxUnits = Math.max(...unitData.map(u => u.units)) || 1;
    const maxIncome = Math.max(...unitData.map(u => u.income)) || 1;
    
    return (
      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Unit Mix Analysis</Typography>
        <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
          {unitData.map((unit, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {unit.name} ({unit.units} units)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ width: 120 }}>Units:</Typography>
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: `${(unit.units / maxUnits) * 100}%`, 
                      maxWidth: '100%',
                      height: 30, 
                      backgroundColor: '#8884d8', 
                      borderRadius: 1,
                      mr: 2,
                      minWidth: '10%'
                    }} />
                    <Typography variant="body2" fontWeight="medium">
                      {unit.units} units
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 120 }}>Annual Income:</Typography>
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: `${(unit.income / maxIncome) * 100}%`, 
                      maxWidth: '100%',
                      height: 30, 
                      backgroundColor: '#82ca9d', 
                      borderRadius: 1,
                      mr: 2,
                      minWidth: '10%'
                    }} />
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(unit.income)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  };

  // Cash flow projection with consistent card size
  const renderCashFlowProjection = () => {
    const cashFlowData = getCashFlowData();
    
    return (
      <Paper sx={cardStyle}>
        <Typography variant="h6" gutterBottom>Cash Flow Projection</Typography>
        <TableContainer component={Box} sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell align="right">Cash Flow</TableCell>
                <TableCell sx={{ width: '50%' }}>Visualization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cashFlowData.map((data, index) => {
                const isPositive = data.cashFlow >= 0;
                const absValue = Math.abs(data.cashFlow);
                const maxValue = Math.max(...cashFlowData.map(d => Math.abs(d.cashFlow)));
                const percentage = (absValue / maxValue) * 100;
                
                return (
                  <TableRow key={index}>
                    <TableCell>{data.year}</TableCell>
                    <TableCell align="right" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 'medium' }}>
                      {formatCurrency(data.cashFlow)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: isPositive ? 'flex-start' : 'flex-end' }}>
                        <Box sx={{ 
                          width: `${percentage}%`, 
                          height: 24, 
                          backgroundColor: isPositive ? 'success.light' : 'error.light',
                          borderRadius: 1,
                          minWidth: '5%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isPositive ? 'flex-end' : 'flex-start',
                        }}>
                          {isPositive ? 
                            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 18, mr: 0.5 }} /> :
                            <TrendingDownIcon sx={{ color: 'error.main', fontSize: 18, ml: 0.5 }} />
                          }
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  // Improved financial metrics table with better styling
  const renderDetailedMetricsTable = () => (
    <Paper sx={cardStyle}>
      <Typography variant="h6" gutterBottom>Detailed Financial Metrics</Typography>
      <TableContainer sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: theme => theme.palette.primary.light,
              '& th': { 
                color: theme => theme.palette.primary.contrastText,
                fontWeight: 'bold' 
              }
            }}>
              <TableCell width="60%"><strong>Metric</strong></TableCell>
              <TableCell align="right" width="40%"><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getDetailedMetricsData().map((row, index) => (
              <TableRow key={index} sx={{ 
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.07)' }
              }}>
                <TableCell>{row.metric}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Helper function to organize metrics data
  const getDetailedMetricsData = () => {
    return [
      { metric: 'Purchase Price', value: formatCurrency(results.purchasePrice) },
      { metric: 'Down Payment', value: formatCurrency(results.downPayment) },
      { metric: 'Loan Amount', value: formatCurrency(results.loanAmount) },
      { metric: 'Monthly Mortgage Payment', value: formatCurrency(results.monthlyMortgagePayment) },
      { metric: 'Total Investment', value: formatCurrency(results.totalInvestment) },
      { metric: 'Debt Service Coverage Ratio', value: results.debtServiceCoverageRatio ? results.debtServiceCoverageRatio.toFixed(2) : 'N/A' },
      { metric: 'Operating Expense Ratio', value: formatPercent(results.expenseRatio) },
      { metric: 'Price per Square Foot', value: formatCurrency(results.pricePerSqft) },
      { metric: 'Gross Rent Multiplier', value: results.grossRentMultiplier ? results.grossRentMultiplier.toFixed(2) : 'N/A' },
      { metric: 'Annual ROI', value: formatPercent(results.annualROI) },
      { metric: 'Average Rent per Square Foot', value: results.totalSqft && results.grossPotentialRent 
        ? formatCurrency((results.grossPotentialRent / results.totalSqft) / 12) + '/month'
        : 'N/A' },
      { metric: 'Average Income per Unit', value: results.totalUnits && results.grossPotentialRent 
        ? formatCurrency(results.grossPotentialRent / results.totalUnits) + '/year'
        : 'N/A' },
      { metric: 'Average Expense per Unit', value: results.totalUnits && results.operatingExpenses 
        ? formatCurrency(results.operatingExpenses / results.totalUnits) + '/year'
        : 'N/A' },
      { metric: 'Projected 5-Year Value', value: formatCurrency(results.projectedFiveYearValue) },
      { metric: 'Projected 5-Year Equity', value: formatCurrency(results.projectedFiveYearEquity) },
      { metric: 'Break-even Occupancy', value: formatPercent(results.breakEvenOccupancy) }
    ];
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Multi-Family Property Analysis Results
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {/* Key Metrics section - in a 2-column grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={cardStyle}>
              <Typography variant="h6" gutterBottom>Key Returns</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cash on Cash Return</Typography>
                  <Typography variant="h6" color={results.cashOnCashReturn >= 8 ? 'success.main' : 'warning.main'}>
                    {formatPercent(results.cashOnCashReturn)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cap Rate</Typography>
                  <Typography variant="h6">
                    {formatPercent(results.capRate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">5-Year ROI</Typography>
                  <Typography variant="h6">
                    {formatPercent(results.fiveYearROI)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Internal Rate of Return</Typography>
                  <Typography variant="h6">
                    {formatPercent(results.irr)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={cardStyle}>
              <Typography variant="h6" gutterBottom>Cash Flow</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Monthly Cash Flow</Typography>
                  <Typography 
                    variant="h6" 
                    color={results.monthlyCashFlow >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(results.monthlyCashFlow)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Annual Cash Flow</Typography>
                  <Typography 
                    variant="h6" 
                    color={results.annualCashFlow ? (results.annualCashFlow[0] >= 0 ? 'success.main' : 'error.main') : 'text.primary'}
                  >
                    {formatCurrency(results.annualCashFlow ? results.annualCashFlow[0] : 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cash Flow Per Unit</Typography>
                  <Typography variant="h6">
                    {formatCurrency(results.cashFlowPerUnit)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Price Per Unit</Typography>
                  <Typography variant="h6">
                    {formatCurrency(results.pricePerUnit)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Income and Expenses section - 2-column grid */}
          <Grid item xs={12} md={6}>
            <Paper sx={cardStyle}>
              <Typography variant="h6" gutterBottom>Income</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Gross Potential Rent</Typography>
                  <Typography variant="h6">
                    {formatCurrency(results.grossPotentialRent)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Vacancy Loss</Typography>
                  <Typography variant="h6" color="error.main">
                    -{formatCurrency(results.vacancyLoss)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Effective Gross Income</Typography>
                  <Typography variant="h6">
                    {formatCurrency(results.effectiveGrossIncome)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Other Income</Typography>
                  <Typography variant="h6">
                    {formatCurrency(results.otherIncome || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={cardStyle}>
              <Typography variant="h6" gutterBottom>Expenses</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Operating Expenses</Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(results.operatingExpenses)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">NOI</Typography>
                  <Typography variant="h6" color={results.noi >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(results.noi)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Debt Service</Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(results.annualDebtService)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Expense Ratio</Typography>
                  <Typography variant="h6">
                    {formatPercent(results.expenseRatio)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Charts and metrics section - maintain same grid layout */}
          <Grid item xs={12} md={6}>
            {renderExpenseBreakdown()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderUnitMix()}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {renderCashFlowProjection()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderDetailedMetricsTable()}
          </Grid>
        </Grid>
        
        {/* AI Analysis Section - full width */}
        <Box sx={{ mt: 3 }}>
          {renderAIAnalysis()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MultiFamilyAnalysisResults; 