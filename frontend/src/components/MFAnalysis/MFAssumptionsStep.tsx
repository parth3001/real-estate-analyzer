/**
 * MFAssumptionsStep - Step 4 of Multi-Family Property Wizard
 * Long-term growth assumptions and investment timeline
 *
 * MF-Specific Features:
 * - Commercial loan considerations (balloon payments)
 * - Higher default CapEx reserves (6% vs 3% for SFR)
 * - Turnover frequency assumptions
 * - Expense growth rates separate from rent growth
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Slider,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  InputAdornment,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  CalendarToday,
  Info,
  AutoAwesome
} from '@mui/icons-material';

import WizardStep from '../SFRAnalysis/WizardStep';
import type { MFWizardStepProps } from './mfWizardTypes';
import type { MFLongTermAssumptions } from '../../types/property';

const MFAssumptionsStep: React.FC<MFWizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  // Long-term assumptions with MF defaults
  const [assumptions, setAssumptions] = useState<MFLongTermAssumptions>({
    projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
    annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
    annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
    inflationRate: state.data.longTermAssumptions?.inflationRate || 2.5,
    vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
    sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
    turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 3,
    capitalExpenditureRate: state.data.longTermAssumptions?.capitalExpenditureRate || 6,
    commonAreaMaintenanceRate: state.data.longTermAssumptions?.commonAreaMaintenanceRate || 2
  });

  // Balloon payment tracking
  const [hasBalloonPayment, setHasBalloonPayment] = useState(
    !!state.data.balloonPayment?.years
  );
  const [balloonYears, setBalloonYears] = useState(
    state.data.balloonPayment?.years || 7
  );

  // Update parent state
  useEffect(() => {
    onUpdate({
      data: {
        ...state.data,
        longTermAssumptions: assumptions,
        loanType: state.data.totalUnits >= 5 ? 'COMMERCIAL' : 'RESIDENTIAL',
        balloonPayment: hasBalloonPayment ? { years: balloonYears } : undefined
      }
    });
  }, [assumptions, hasBalloonPayment, balloonYears]);

  const handleAssumptionChange = (field: keyof MFLongTermAssumptions, value: number) => {
    setAssumptions({
      ...assumptions,
      [field]: value
    });
  };

  return (
    <WizardStep
      title="Operating Assumptions"
      subtitle="Long-term growth rates, vacancy, and investment timeline"
      icon={<TrendingUp />}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Commercial Loan Notice */}
        {state.data.totalUnits >= 5 && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Commercial Property:</strong> Properties with 5+ units require commercial financing.
              These loans typically have different terms than residential mortgages.
            </Typography>
          </Alert>
        )}

        {/* Investment Timeline */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" />
            Investment Timeline
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Projection Period: {assumptions.projectionYears} years
              </Typography>
              <Slider
                value={assumptions.projectionYears}
                onChange={(_, value) => handleAssumptionChange('projectionYears', value as number)}
                min={1}
                max={30}
                step={1}
                marks={[
                  { value: 5, label: '5yr' },
                  { value: 10, label: '10yr' },
                  { value: 15, label: '15yr' },
                  { value: 20, label: '20yr' },
                  { value: 30, label: '30yr' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} years`}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Typical Turnover: Every {assumptions.turnoverFrequency} years
              </Typography>
              <Slider
                value={assumptions.turnoverFrequency}
                onChange={(_, value) => handleAssumptionChange('turnoverFrequency', value as number)}
                min={1}
                max={5}
                step={0.5}
                marks={[
                  { value: 1, label: '1yr' },
                  { value: 2, label: '2yr' },
                  { value: 3, label: '3yr' },
                  { value: 5, label: '5yr' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} yrs`}
              />
              <Typography variant="caption" color="text.secondary">
                Average time before tenant moves out
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Growth Rates */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" />
            Annual Growth Rates
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rent Growth Rate"
                type="number"
                value={assumptions.annualRentIncrease || ''}
                onChange={(e) => handleAssumptionChange('annualRentIncrease', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                helperText="Typical: 2-4% annually"
                inputProps={{ min: 0, max: 10, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Value Appreciation"
                type="number"
                value={assumptions.annualPropertyValueIncrease || ''}
                onChange={(e) => handleAssumptionChange('annualPropertyValueIncrease', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                helperText="Typical: 2-4% annually"
                inputProps={{ min: 0, max: 10, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Inflation Rate"
                type="number"
                value={assumptions.inflationRate || ''}
                onChange={(e) => handleAssumptionChange('inflationRate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                helperText="Affects expense growth"
                inputProps={{ min: 0, max: 10, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vacancy Rate"
                type="number"
                value={assumptions.vacancyRate || ''}
                onChange={(e) => handleAssumptionChange('vacancyRate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                helperText="Typical MF: 5-8%"
                error={!!validation.errors['vacancyRate']}
                inputProps={{ min: 0, max: 30, step: 1 }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Capital Expenditures & Reserves */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            Capital Reserves (MF-Specific)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CapEx Reserve Rate"
                type="number"
                value={assumptions.capitalExpenditureRate || ''}
                onChange={(e) => handleAssumptionChange('capitalExpenditureRate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of income</InputAdornment>
                }}
                helperText="MF typical: 5-8% (higher than SFR's 3%)"
                inputProps={{ min: 0, max: 15, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Common Area Maintenance Rate"
                type="number"
                value={assumptions.commonAreaMaintenanceRate || ''}
                onChange={(e) => handleAssumptionChange('commonAreaMaintenanceRate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of income</InputAdornment>
                }}
                helperText="Hallways, parking lots, landscaping"
                inputProps={{ min: 0, max: 10, step: 0.5 }}
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 <strong>Why higher CapEx for MF?</strong> Multi-family properties have shared systems
              (HVAC, roofs, parking lots) that require larger capital improvements. Budget 5-8% of income
              compared to 3% for single-family homes.
            </Typography>
          </Alert>
        </Box>

        <Divider />

        {/* Exit Strategy */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" />
            Exit Strategy
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Costs"
                type="number"
                value={assumptions.sellingCostsPercentage || ''}
                onChange={(e) => handleAssumptionChange('sellingCostsPercentage', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">% of sale price</InputAdornment>
                }}
                helperText="Broker fees, closing costs, repairs"
                inputProps={{ min: 0, max: 15, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Projected Holding Period</Typography>
                <Typography variant="h6">
                  {assumptions.projectionYears} years
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hasBalloonPayment ? `Balloon payment due: Year ${balloonYears}` : 'Standard amortization'}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Balloon Payment (Commercial Loans) */}
        {state.data.totalUnits >= 5 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                Balloon Payment
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasBalloonPayment}
                    onChange={(e) => setHasBalloonPayment(e.target.checked)}
                  />
                }
                label="Has Balloon Payment"
              />
            </Box>

            {hasBalloonPayment && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Balloon Due After: {balloonYears} years
                    </Typography>
                    <Slider
                      value={balloonYears}
                      onChange={(_, value) => setBalloonYears(value as number)}
                      min={3}
                      max={15}
                      step={1}
                      marks={[
                        { value: 5, label: '5yr' },
                        { value: 7, label: '7yr' },
                        { value: 10, label: '10yr' }
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value} years`}
                    />
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ⚠️ <strong>Balloon Payment Alert:</strong> Commercial loans often require a balloon payment
                    (paying off remaining balance) after 5-10 years. Plan to refinance or sell before this date.
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        )}

        {/* Smart Defaults Notice */}
        {state.smartDefaults && Object.keys(state.smartDefaults).length > 0 && (
          <Alert severity="success" icon={<AutoAwesome />}>
            <Typography variant="body2">
              Market-based defaults applied. Adjust these assumptions based on your local market and investment strategy.
            </Typography>
          </Alert>
        )}
      </Box>
    </WizardStep>
  );
};

export default MFAssumptionsStep;
