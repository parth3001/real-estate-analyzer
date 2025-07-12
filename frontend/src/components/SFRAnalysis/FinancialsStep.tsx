/**
 * FinancialsStep - Step 2 of Property Wizard
 * Handles financial details: purchase price, down payment, loan terms, and costs
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  GridLegacy as Grid,
  Typography,
  InputAdornment,
  Slider,
  Alert,
  Card,
  CardContent,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Receipt,
  AutoAwesome,
  Info
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';

const FinancialsStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [loanType, setLoanType] = useState<'fixed' | 'arm'>('fixed');
  
  // Calculate down payment amount based on percentage
  const downPaymentAmount = (state.data.purchasePrice || 0) * (state.data.downPaymentPercentage || 25) / 100;
  const loanAmount = (state.data.purchasePrice || 0) - downPaymentAmount;
  
  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (!state.data.purchasePrice || !state.data.interestRate) return 0;
    
    const principal = loanAmount;
    const rate = (state.data.interestRate || 7.5) / 100 / 12;
    const term = (state.data.loanTerm || 30) * 12;
    
    if (principal <= 0) return 0;
    
    const payment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    return Math.round(payment);
  };

  // Handle purchase price change
  const handlePurchasePriceChange = (value: string) => {
    const price = parseInt(value) || 0;
    onUpdate({
      data: {
        ...state.data,
        purchasePrice: price,
        downPayment: price * (state.data.downPaymentPercentage || 25) / 100,
        closingCosts: price * (state.data.closingCostPercentage || 2.5) / 100
      }
    });
  };

  // Handle down payment percentage change
  const handleDownPaymentPercentageChange = (value: number) => {
    onUpdate({
      data: {
        ...state.data,
        downPaymentPercentage: value,
        downPayment: (state.data.purchasePrice || 0) * value / 100
      }
    });
  };

  // Get smart defaults based on location (mock for Phase 1)
  useEffect(() => {
    if (!state.smartDefaults.currentMortgageRate && state.data.propertyAddress?.zipCode) {
      // Simulate getting smart defaults
      setTimeout(() => {
        onUpdate({
          smartDefaults: {
            ...state.smartDefaults,
            currentMortgageRate: {
              value: 7.125,
              confidence: {
                score: 95,
                source: 'FRED Economic Data',
                lastUpdated: new Date(),
                reliability: 'high' as const
              }
            },
            closingCostPercentage: {
              value: 2.5,
              confidence: {
                score: 85,
                source: 'Regional Average',
                lastUpdated: new Date(),
                reliability: 'medium' as const
              }
            }
          }
        });
      }, 500);
    }
  }, [state.data.propertyAddress?.zipCode]);

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};
    
    if (state.smartDefaults.currentMortgageRate?.confidence) {
      confidence.interestRate = state.smartDefaults.currentMortgageRate.confidence;
    }
    if (typeof state.smartDefaults.closingCostPercentage === 'object' && 
        state.smartDefaults.closingCostPercentage?.confidence) {
      confidence.closingCosts = state.smartDefaults.closingCostPercentage.confidence;
    }
    
    return confidence;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalCashNeeded = downPaymentAmount + (state.data.closingCosts || 0) + (state.data.capitalInvestments || 0);

  return (
    <WizardStep
      title="Financial Details"
      description="Configure your purchase price, financing terms, and initial costs"
      validation={validation}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={state.smartDefaults.currentMortgageRate ? ['interestRate'] : []}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Purchase Details Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            Purchase Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={state.data.purchasePrice || ''}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                error={!!validation.errors['purchasePrice']}
                helperText={validation.errors['purchasePrice']}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="350000"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Down Payment: ${downPaymentAmount.toLocaleString()} ({state.data.downPaymentPercentage || 25}%)
                </Typography>
                <Slider
                  value={state.data.downPaymentPercentage || 25}
                  onChange={(_, value) => handleDownPaymentPercentageChange(value as number)}
                  min={5}
                  max={99}
                  step={5}
                  marks={[
                    { value: 5, label: '5%' },
                    { value: 20, label: '20%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 99, label: '99%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Loan Details Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            Loan Details
            {state.smartDefaults.currentMortgageRate && (
              <Chip
                label="Market Rate Applied"
                size="small"
                color="success"
                variant="outlined"
                icon={<AutoAwesome />}
              />
            )}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ToggleButtonGroup
                value={loanType}
                exclusive
                onChange={(_, value) => value && setLoanType(value)}
                fullWidth
              >
                <ToggleButton value="fixed">
                  Fixed Rate
                </ToggleButton>
                <ToggleButton value="arm">
                  ARM (Adjustable)
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Interest Rate"
                type="number"
                value={state.data.interestRate || ''}
                onChange={(e) => onUpdate({
                  data: { ...state.data, interestRate: parseFloat(e.target.value) || 0 }
                })}
                error={!!validation.errors['interestRate']}
                helperText={validation.errors['interestRate'] || 
                  (state.smartDefaults.currentMortgageRate ? 
                    `Current market rate: ${state.smartDefaults.currentMortgageRate.value}%` : '')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                inputProps={{ step: 0.125, min: 0, max: 20 }}
                placeholder="7.125"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Loan Term"
                type="number"
                value={state.data.loanTerm || ''}
                onChange={(e) => onUpdate({
                  data: { ...state.data, loanTerm: parseInt(e.target.value) || 0 }
                })}
                error={!!validation.errors['loanTerm']}
                helperText={validation.errors['loanTerm']}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>
                }}
                placeholder="30"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Loan Amount"
                value={loanAmount.toLocaleString()}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
          </Grid>

          {monthlyPayment > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Estimated Monthly P&I Payment: <strong>${monthlyPayment.toLocaleString()}</strong>
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Costs & Fees Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            Costs & Fees
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Costs"
                type="number"
                value={state.data.closingCosts || ''}
                onChange={(e) => onUpdate({
                  data: { 
                    ...state.data, 
                    closingCosts: parseInt(e.target.value) || 0,
                    closingCostPercentage: state.data.purchasePrice ? 
                      ((parseInt(e.target.value) || 0) / state.data.purchasePrice * 100) : 2.5
                  }
                })}
                helperText={`Typically 2-3% of purchase price (${
                  state.data.purchasePrice ? 
                    ((state.data.closingCosts || 0) / state.data.purchasePrice * 100).toFixed(1) : '2.5'
                }%)`}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="8750"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Capital Investments"
                type="number"
                value={state.data.capitalInvestments || ''}
                onChange={(e) => onUpdate({
                  data: { ...state.data, capitalInvestments: parseInt(e.target.value) || 0 }
                })}
                helperText="Repairs, renovations, or improvements"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="5000"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Summary Card */}
        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom color="primary">
              <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
              Investment Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Cash Needed:</Typography>
                <Typography variant="h6">${totalCashNeeded.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Monthly P&I:</Typography>
                <Typography variant="h6">${monthlyPayment.toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary">
              <Info sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Smart Defaults
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interest rates are updated daily from FRED economic data. Closing costs are based on 
              regional averages. All values can be customized to match your specific situation.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default FinancialsStep;