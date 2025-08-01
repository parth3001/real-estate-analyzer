import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Stack,
  Button,
  Alert,
  Divider
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  TrendingDown as StressIcon,
  Warning as WarningIcon,
  Speed as GaugeIcon,
  Timeline as TimelineIcon,
  Thermostat as HeatIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { EducationalTooltip } from '../common/EducationalTooltip';

interface StressTestingDashboardProps {
  analysis: any;
  propertyData: any;
  onParameterChange?: (parameters: any) => void;
}

interface StressTestScenario {
  name: string;
  description: string;
  parameters: {
    rentDecrease: number;
    vacancyIncrease: number;
    expenseIncrease: number;
    interestRateIncrease: number;
    appreciationDecrease: number;
  };
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  probability: number;
}

const StressTestingDashboard: React.FC<StressTestingDashboardProps> = ({
  analysis,
  propertyData,
  onParameterChange
}) => {
  const [, setSelectedScenario] = useState<string>('current');
  const [customParameters, setCustomParameters] = useState({
    rentDecrease: 0,
    vacancyIncrease: 0,
    expenseIncrease: 0,
    interestRateIncrease: 0,
    appreciationDecrease: 0
  });
  const [stressResults, setStressResults] = useState<any>(null);
  const [, setIsCalculating] = useState(false);

  // Predefined stress test scenarios
  const stressScenarios: StressTestScenario[] = [
    {
      name: 'Economic Recession',
      description: 'Moderate economic downturn with reduced rents and higher vacancy',
      parameters: {
        rentDecrease: 10,
        vacancyIncrease: 5,
        expenseIncrease: 8,
        interestRateIncrease: 1.5,
        appreciationDecrease: 50
      },
      severity: 'moderate',
      probability: 25
    },
    {
      name: 'Local Market Decline',
      description: 'Area-specific decline due to major employer leaving',
      parameters: {
        rentDecrease: 15,
        vacancyIncrease: 10,
        expenseIncrease: 5,
        interestRateIncrease: 0.5,
        appreciationDecrease: 75
      },
      severity: 'severe',
      probability: 15
    },
    {
      name: 'Interest Rate Shock',
      description: 'Rapid interest rate increases affecting refinancing',
      parameters: {
        rentDecrease: 5,
        vacancyIncrease: 2,
        expenseIncrease: 3,
        interestRateIncrease: 3.0,
        appreciationDecrease: 25
      },
      severity: 'moderate',
      probability: 30
    },
    {
      name: 'Major Repair Crisis',
      description: 'Unexpected major repairs and maintenance issues',
      parameters: {
        rentDecrease: 0,
        vacancyIncrease: 15,
        expenseIncrease: 50,
        interestRateIncrease: 0,
        appreciationDecrease: 10
      },
      severity: 'severe',
      probability: 20
    },
    {
      name: 'Perfect Storm',
      description: 'Multiple negative factors occurring simultaneously',
      parameters: {
        rentDecrease: 20,
        vacancyIncrease: 15,
        expenseIncrease: 30,
        interestRateIncrease: 2.5,
        appreciationDecrease: 80
      },
      severity: 'extreme',
      probability: 5
    }
  ];

  // Calculate stress test results
  const calculateStressImpact = (params: any) => {
    if (!analysis || !propertyData) return null;

    const baseRent = propertyData.monthlyRent;
    const baseVacancy = propertyData.longTermAssumptions?.vacancyRate || 5;
    const baseExpenses = analysis.monthlyAnalysis.expenses.operating;
    const baseRate = propertyData.interestRate;
    const baseAppreciation = propertyData.longTermAssumptions?.annualPropertyValueIncrease || 3;

    // Apply stress parameters
    const stressedRent = baseRent * (1 - params.rentDecrease / 100);
    const stressedVacancy = baseVacancy + params.vacancyIncrease;
    const stressedExpenses = baseExpenses * (1 + params.expenseIncrease / 100);
    const stressedRate = baseRate + params.interestRateIncrease;
    const stressedAppreciation = baseAppreciation * (1 - params.appreciationDecrease / 100);

    // Calculate stressed metrics
    const stressedEffectiveRent = stressedRent * (1 - stressedVacancy / 100);
    const stressedNOI = (stressedEffectiveRent * 12) - (stressedExpenses * 12);
    const stressedCapRate = (stressedNOI / propertyData.purchasePrice) * 100;
    
    // Calculate new mortgage payment if rate changed
    const loanAmount = propertyData.purchasePrice - propertyData.downPayment;
    const stressedMonthlyPayment = calculateMortgage(loanAmount, stressedRate, propertyData.loanTerm || 30);
    const stressedCashFlow = stressedEffectiveRent - stressedExpenses - stressedMonthlyPayment;
    const stressedCoCReturn = (stressedCashFlow * 12) / analysis.keyMetrics.totalInvestment * 100;

    return {
      metrics: {
        rent: stressedRent,
        vacancy: stressedVacancy,
        expenses: stressedExpenses,
        noi: stressedNOI,
        capRate: stressedCapRate,
        cashFlow: stressedCashFlow,
        cashOnCashReturn: stressedCoCReturn,
        appreciation: stressedAppreciation
      },
      changes: {
        rentChange: ((stressedRent - baseRent) / baseRent) * 100,
        noiChange: ((stressedNOI - analysis.keyMetrics.noi) / analysis.keyMetrics.noi) * 100,
        capRateChange: stressedCapRate - analysis.keyMetrics.capRate,
        cashFlowChange: stressedCashFlow - analysis.monthlyAnalysis.cashFlow,
        cocChange: stressedCoCReturn - analysis.keyMetrics.cashOnCashReturn
      }
    };
  };

  // Helper function for mortgage calculation
  const calculateMortgage = (principal: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 12 / 100;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Risk severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return appleColors.success[600];
      case 'moderate': return appleColors.warning[600];
      case 'severe': return appleColors.red[600];
      case 'extreme': return appleColors.red[800];
      default: return appleColors.gray[600];
    }
  };

  // Risk level assessment
  const assessRiskLevel = (changes: any) => {
    if (changes.cashFlowChange < -1000 || changes.cocChange < -10) return 'High Risk';
    if (changes.cashFlowChange < -500 || changes.cocChange < -5) return 'Medium Risk';
    if (changes.cashFlowChange < 0 || changes.cocChange < 0) return 'Low Risk';
    return 'Resilient';
  };

  // Format value helper
  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    if (format === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  // Calculate stress results when parameters change
  useEffect(() => {
    const results = calculateStressImpact(customParameters);
    setStressResults(results);
  }, [customParameters, analysis, propertyData]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <StressIcon sx={{ color: appleColors.red[600] }} />
        <Typography variant="h5" fontWeight={600}>
          Stress Testing & Risk Analysis
        </Typography>
        <EducationalTooltip
          title="What is Stress Testing?"
          description="Stress testing evaluates how your investment performs under adverse conditions. It helps identify potential weaknesses and prepare for market downturns."
          whyItMatters="Professional investors use stress testing to avoid investments that could fail during economic challenges."
        />
      </Stack>

      {/* Current vs Stressed Performance */}
      {stressResults && (
        <Card sx={{ borderRadius: '16px', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Performance Under Stress
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 3, bgcolor: appleColors.gray[50], borderRadius: '12px' }}>
                  <Typography variant="subtitle1" fontWeight={600} color={appleColors.gray[700]} sx={{ mb: 2 }}>
                    📊 Current Performance
                  </Typography>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Monthly Cash Flow</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatValue(analysis.monthlyAnalysis.cashFlow, 'currency')}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Cap Rate</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatValue(analysis.keyMetrics.capRate, 'percent')}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Cash-on-Cash Return</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatValue(analysis.keyMetrics.cashOnCashReturn, 'percent')}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 3, bgcolor: appleColors.red[50], borderRadius: '12px' }}>
                  <Typography variant="subtitle1" fontWeight={600} color={appleColors.red[700]} sx={{ mb: 2 }}>
                    ⚠️ Stressed Performance
                  </Typography>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Monthly Cash Flow</Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={600}
                        color={stressResults.metrics.cashFlow >= 0 ? appleColors.success[600] : appleColors.red[600]}
                      >
                        {formatValue(stressResults.metrics.cashFlow, 'currency')}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({stressResults.changes.cashFlowChange >= 0 ? '+' : ''}{formatValue(stressResults.changes.cashFlowChange, 'currency')})
                        </Typography>
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Cap Rate</Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={600}
                        color={stressResults.metrics.capRate >= 4 ? appleColors.success[600] : appleColors.red[600]}
                      >
                        {formatValue(stressResults.metrics.capRate, 'percent')}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({stressResults.changes.capRateChange >= 0 ? '+' : ''}{stressResults.changes.capRateChange.toFixed(2)}%)
                        </Typography>
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Cash-on-Cash Return</Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight={600}
                        color={stressResults.metrics.cashOnCashReturn >= 0 ? appleColors.success[600] : appleColors.red[600]}
                      >
                        {formatValue(stressResults.metrics.cashOnCashReturn, 'percent')}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({stressResults.changes.cocChange >= 0 ? '+' : ''}{stressResults.changes.cocChange.toFixed(2)}%)
                        </Typography>
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>

            {/* Risk Assessment */}
            <Box sx={{ mt: 3, p: 3, bgcolor: appleColors.warning[50], borderRadius: '12px' }}>
              <Typography variant="h6" fontWeight={600} color={appleColors.warning[700]} sx={{ mb: 2 }}>
                Risk Level: {assessRiskLevel(stressResults.changes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stressResults.changes.cashFlowChange < -500 && 
                  "This property shows significant vulnerability to market stress. Consider building larger cash reserves or seeking properties with better fundamentals."}
                {stressResults.changes.cashFlowChange >= -500 && stressResults.changes.cashFlowChange < 0 &&
                  "The property shows moderate resilience but could benefit from improved cash flow margins."}
                {stressResults.changes.cashFlowChange >= 0 &&
                  "This property demonstrates strong resilience to market stress."}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stress Test Scenarios */}
      <Card sx={{ borderRadius: '16px', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Predefined Stress Scenarios
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Scenario</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Probability</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stressScenarios.map((scenario, index) => {
                  const results = calculateStressImpact(scenario.parameters);
                  const riskLevel = results ? assessRiskLevel(results.changes) : 'Unknown';
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {scenario.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {scenario.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={scenario.severity}
                          size="small"
                          sx={{ 
                            bgcolor: getSeverityColor(scenario.severity) + '20',
                            color: getSeverityColor(scenario.severity),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={scenario.probability} 
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">
                            {scenario.probability}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={
                            riskLevel === 'High Risk' ? appleColors.red[600] :
                            riskLevel === 'Medium Risk' ? appleColors.warning[600] :
                            appleColors.success[600]
                          }
                          fontWeight={600}
                        >
                          {riskLevel}
                        </Typography>
                        {results && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Cash Flow: {formatValue(results.changes.cashFlowChange, 'currency')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setCustomParameters(scenario.parameters);
                            setSelectedScenario(scenario.name);
                          }}
                        >
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Custom Stress Testing Controls */}
      <Card sx={{ borderRadius: '16px', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Custom Stress Testing
          </Typography>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Rent Decrease: {customParameters.rentDecrease}%
                  </Typography>
                  <Slider
                    value={customParameters.rentDecrease}
                    onChange={(_, value) => setCustomParameters(prev => ({ ...prev, rentDecrease: value as number }))}
                    min={0}
                    max={30}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 10, label: '10%' },
                      { value: 20, label: '20%' },
                      { value: 30, label: '30%' }
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Vacancy Increase: +{customParameters.vacancyIncrease}%
                  </Typography>
                  <Slider
                    value={customParameters.vacancyIncrease}
                    onChange={(_, value) => setCustomParameters(prev => ({ ...prev, vacancyIncrease: value as number }))}
                    min={0}
                    max={20}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 5, label: '5%' },
                      { value: 10, label: '10%' },
                      { value: 20, label: '20%' }
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Expense Increase: +{customParameters.expenseIncrease}%
                  </Typography>
                  <Slider
                    value={customParameters.expenseIncrease}
                    onChange={(_, value) => setCustomParameters(prev => ({ ...prev, expenseIncrease: value as number }))}
                    min={0}
                    max={50}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 15, label: '15%' },
                      { value: 30, label: '30%' },
                      { value: 50, label: '50%' }
                    ]}
                  />
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Interest Rate Increase: +{customParameters.interestRateIncrease.toFixed(1)}%
                  </Typography>
                  <Slider
                    value={customParameters.interestRateIncrease}
                    onChange={(_, value) => setCustomParameters(prev => ({ ...prev, interestRateIncrease: value as number }))}
                    min={0}
                    max={5}
                    step={0.25}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 1, label: '1%' },
                      { value: 3, label: '3%' },
                      { value: 5, label: '5%' }
                    ]}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Appreciation Decrease: -{customParameters.appreciationDecrease}%
                  </Typography>
                  <Slider
                    value={customParameters.appreciationDecrease}
                    onChange={(_, value) => setCustomParameters(prev => ({ ...prev, appreciationDecrease: value as number }))}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                  />
                </Box>

                <Box sx={{ pt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setCustomParameters({
                      rentDecrease: 0,
                      vacancyIncrease: 0,
                      expenseIncrease: 0,
                      interestRateIncrease: 0,
                      appreciationDecrease: 0
                    })}
                    sx={{ mb: 2 }}
                  >
                    Reset to Baseline
                  </Button>
                  
                  {onParameterChange && (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onParameterChange(customParameters)}
                    >
                      Apply to Analysis
                    </Button>
                  )}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Risk Heat Map Summary */}
      <Card sx={{ borderRadius: '16px' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            🌡️ Risk Heat Map
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: appleColors.gray[50], borderRadius: '12px' }}>
                <Typography variant="h3" fontWeight={700} color={appleColors.blue[600]}>
                  {stressScenarios.filter(s => {
                    const result = calculateStressImpact(s.parameters);
                    return result?.changes.cashFlowChange ? result.changes.cashFlowChange >= -200 : false;
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Low Risk Scenarios
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: appleColors.warning[50], borderRadius: '12px' }}>
                <Typography variant="h3" fontWeight={700} color={appleColors.warning[600]}>
                  {stressScenarios.filter(s => {
                    const result = calculateStressImpact(s.parameters);
                    return result?.changes.cashFlowChange ? 
                      result.changes.cashFlowChange < -200 && result.changes.cashFlowChange >= -1000 : false;
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Medium Risk Scenarios
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: appleColors.red[50], borderRadius: '12px' }}>
                <Typography variant="h3" fontWeight={700} color={appleColors.red[600]}>
                  {stressScenarios.filter(s => {
                    const result = calculateStressImpact(s.parameters);
                    return result?.changes.cashFlowChange ? result.changes.cashFlowChange < -1000 : false;
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Risk Scenarios
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Stress Testing Recommendation:</strong> A well-balanced investment should maintain positive cash flow 
              in at least 60% of stress scenarios and should never result in monthly losses exceeding $1,000.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StressTestingDashboard;