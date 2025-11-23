/**
 * MFFinancialsStep - Step 2 of Multi-Family Property Wizard
 * Handles financial details for multi-family properties with commercial loan terms
 *
 * MF-Specific Enhancements:
 * - Higher down payment defaults (25-30% vs 20% for SFR)
 * - Commercial loan terms (15-30 years, sometimes balloon payments)
 * - Higher closing costs percentage (2.5-3.5% vs 2-3% for SFR)
 * - Loan-to-Value (LTV) ratio display
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
  Info,
  Business
} from '@mui/icons-material';

import WizardStep from '../SFRAnalysis/WizardStep';
import type { MFWizardStepProps, DataConfidence } from './mfWizardTypes';

const MFFinancialsStep: React.FC<MFWizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [loanType, setLoanType] = useState<'fixed' | 'arm'>('fixed');

  // Calculate down payment amount based on percentage
  const downPaymentAmount = (state.data.purchasePrice || 0) * (state.data.downPaymentPercentage || 25) / 100;
  const loanAmount = (state.data.purchasePrice || 0) - downPaymentAmount;

  // Calculate Loan-to-Value (LTV) ratio - critical for MF loans
  const ltvRatio = state.data.purchasePrice > 0 ? (loanAmount / state.data.purchasePrice) * 100 : 0;

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (!state.data.purchasePrice || !state.data.interestRate) return 0;

    const principal = loanAmount;
    const rate = (state.data.interestRate || 7.5) / 100 / 12;
    const term = (state.data.loanTerm || 30) * 12;

    if (principal <= 0 || rate <= 0 || term <= 0) return 0;

    const payment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    return isFinite(payment) ? Math.round(payment) : 0;
  };

  // Handle purchase price change
  const handlePurchasePriceChange = (value: string) => {
    const price = parseInt(value) || 0;
    onUpdate({
      data: {
        ...state.data,
        purchasePrice: price,
        downPayment: price * (state.data.downPaymentPercentage || 25) / 100,
        closingCosts: price * (state.data.closingCostPercentage || 3) / 100
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

  // Handle closing cost percentage change
  const handleClosingCostPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    onUpdate({
      data: {
        ...state.data,
        closingCostPercentage: percentage,
        closingCosts: (state.data.purchasePrice || 0) * percentage / 100
      }
    });
  };

  // Get smart defaults based on location (mock for Phase 1)
  useEffect(() => {
    if (!state.smartDefaults.currentMortgageRate && state.data.propertyAddress?.zipCode) {
      // Simulate getting smart defaults - MF loans typically 0.5-1% higher than residential
      setTimeout(() => {
        onUpdate({
          smartDefaults: {
            ...state.smartDefaults,
            currentMortgageRate: {
              value: 7.625, // Slightly higher for commercial/MF
              confidence: {
                score: 90,
                source: 'FRED Economic Data',
                lastUpdated: new Date(),
                reliability: 'high' as const
              }
            },
            closingCostPercentage: {
              value: 3.0, // Higher for commercial
              confidence: {
                score: 80,
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

  // Get LTV rating (commercial loan standards)
  const getLTVRating = () => {
    if (ltvRatio <= 65) return { text: 'Excellent (65% or less)', color: 'success' as const };
    if (ltvRatio <= 75) return { text: 'Good (65-75%)', color: 'success' as const };
    if (ltvRatio <= 80) return { text: 'Standard (75-80%)', color: 'info' as const };
    if (ltvRatio <= 85) return { text: 'High (80-85%)', color: 'warning' as const };
    return { text: 'Very High (85%+)', color: 'error' as const };
  };

  const ltvRating = getLTVRating();

  return (
    <WizardStep
      title="Financial Details"
      description="Configure your purchase price, commercial financing terms, and initial costs"
      validation={validation}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={state.smartDefaults.currentMortgageRate ? ['interestRate'] : []}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Multi-Family Financing Notice */}
        <Alert severity="info" icon={<Business />}>
          <Typography variant="subtitle2" gutterBottom>
            Commercial Financing for Multi-Family Properties
          </Typography>
          <Typography variant="body2">
            Multi-family properties (5+ units) typically require commercial loans with:
            • 25-30% down payment minimum
            • Slightly higher interest rates than residential mortgages
            • Underwriting based on property's income (DSCR), not just personal income
          </Typography>
        </Alert>

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
                placeholder="1200000"
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
                  min={10}
                  max={99}
                  step={5}
                  marks={[
                    { value: 20, label: '20%' },
                    { value: 25, label: '25%' },
                    { value: 30, label: '30%' },
                    { value: 40, label: '40%' },
                    { value: 50, label: '50%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
              </Box>
            </Grid>

            {/* LTV Ratio Display - MF Specific */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Loan-to-Value (LTV) Ratio
                    </Typography>
                    <Chip
                      label={`${ltvRatio.toFixed(1)}% - ${ltvRating.text}`}
                      color={ltvRating.color}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Commercial lenders prefer LTV ≤ 75%. Lower LTV = better loan terms.
                  </Typography>
                </CardContent>
              </Card>
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
                placeholder="7.625"
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
                helperText={validation.errors['loanTerm'] || 'Commercial loans: 15-30 years'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>
                }}
                inputProps={{ min: 1, max: 30 }}
                placeholder="30"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Monthly Payment (P&I)
                </Typography>
                <Typography variant="h6" color="primary">
                  ${monthlyPayment.toLocaleString()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp fontSize="small" />
                    Loan Summary
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Loan Amount
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${loanAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Total Interest (est.)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${((monthlyPayment * (state.data.loanTerm || 30) * 12) - loanAmount).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Total Paid
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${(monthlyPayment * (state.data.loanTerm || 30) * 12).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        LTV Ratio
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {ltvRatio.toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Initial Costs Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            Initial Costs
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Cost Percentage"
                type="number"
                value={state.data.closingCostPercentage || ''}
                onChange={(e) => handleClosingCostPercentageChange(e.target.value)}
                error={!!validation.errors['closingCostPercentage']}
                helperText={`Closing Costs: $${(state.data.closingCosts || 0).toLocaleString()} (Typical: 2.5-3.5% for MF)`}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                inputProps={{ step: 0.1, min: 0, max: 10 }}
                placeholder="3.0"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Capital Improvements (Optional)"
                type="number"
                value={state.data.capitalInvestments || ''}
                onChange={(e) => onUpdate({
                  data: { ...state.data, capitalInvestments: parseInt(e.target.value) || 0 }
                })}
                helperText="Immediate repairs or upgrades needed"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="0"
              />
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Total Cash Needed to Close
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Down payment + closing costs + capital improvements
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="primary">
                      ${totalCashNeeded.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Information Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info fontSize="small" />
              Commercial Loan Considerations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Minimum Down Payment:</strong> Most lenders require 25-30% for multi-family properties
              <br />
              • <strong>Interest Rates:</strong> Typically 0.5-1% higher than residential mortgages
              <br />
              • <strong>DSCR Requirement:</strong> Lenders want to see Debt Service Coverage Ratio ≥ 1.25
              <br />
              • <strong>LTV Sweet Spot:</strong> 65-75% LTV gets best terms; 80%+ may be difficult to qualify
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default MFFinancialsStep;
