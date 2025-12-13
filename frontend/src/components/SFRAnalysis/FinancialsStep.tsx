/**
 * FinancialsStep - Step 2 of Property Wizard (Phase 1 Enhanced)
 * Handles financial details: purchase price, down payment, loan terms, taxes, and insurance
 *
 * Phase 1 Enhancements:
 * - TapToExpandField for Property Tax (with ZIP code API smart defaults)
 * - TapToExpandField for Insurance (with industry average estimates)
 * - Progressive disclosure pattern (Apple Design System)
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
  Divider,
  Button
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Receipt,
  AutoAwesome,
  Info,
  Home as HomeIcon
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';
import { TapToExpandField } from '../common/TapToExpandField';
import { HybridSliderInput } from '../common/HybridSliderInput';
import { wizardApi } from '../../services/api';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const FinancialsStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [loanType, setLoanType] = useState<'fixed' | 'arm'>('fixed');

  // Phase 1: Property tax state management
  const [propertyTaxRate, setPropertyTaxRate] = useState(state.data.propertyTaxRate || 1.2);
  const [isPropertyTaxCustomized, setIsPropertyTaxCustomized] = useState(false);
  const [propertyTaxSmartDefault, setPropertyTaxSmartDefault] = useState<any>(null);
  const [isFetchingTaxData, setIsFetchingTaxData] = useState(false);

  // Phase 1: Insurance state management
  const [monthlyInsurance, setMonthlyInsurance] = useState(
    (state.data.purchasePrice ? (state.data.purchasePrice * 0.0035 / 12) : 200)
  );
  const [isInsuranceCustomized, setIsInsuranceCustomized] = useState(false);

  // UX Enhancement: Dual input mode for Property Tax (percentage vs dollar amount)
  const [taxInputMode, setTaxInputMode] = useState<'rate' | 'annual'>('rate');
  const [annualPropertyTax, setAnnualPropertyTax] = useState(
    (state.data.purchasePrice || 0) * (state.data.propertyTaxRate || 1.2) / 100
  );

  // UX Enhancement: Dual input mode for Down Payment (percentage vs dollar amount)
  const [downPaymentInputMode, setDownPaymentInputMode] = useState<'percentage' | 'amount'>('percentage');
  const [downPaymentAmount, setDownPaymentAmount] = useState(
    (state.data.purchasePrice || 0) * (state.data.downPaymentPercentage || 25) / 100
  );
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

    // Phase 1: Recalculate insurance estimate if not customized
    if (!isInsuranceCustomized && price > 0) {
      const estimatedInsurance = (price * 0.0035 / 12);
      setMonthlyInsurance(estimatedInsurance);
    }
  };

  // UX Enhancement: Handle down payment percentage change (% → $)
  const handleDownPaymentPercentageChange = (value: number) => {
    const calculatedAmount = (state.data.purchasePrice || 0) * value / 100;
    setDownPaymentAmount(calculatedAmount);

    // DEBUG Issue #29: Track down payment values
    console.log('🔍 DOWN PAYMENT % → $ CONVERSION:', {
      percentage: value,
      purchasePrice: state.data.purchasePrice,
      calculatedAmount,
      loanAmount: (state.data.purchasePrice || 0) - calculatedAmount,
      formula: `${state.data.purchasePrice} * ${value}% = $${calculatedAmount}`
    });

    onUpdate({
      data: {
        ...state.data,
        downPaymentPercentage: value,
        downPayment: calculatedAmount
      }
    });
  };

  // UX Enhancement: Handle down payment amount change ($ → %)
  const handleDownPaymentAmountChange = (value: number) => {
    setDownPaymentAmount(value);

    // Auto-calculate percentage
    const calculatedPercentage = state.data.purchasePrice && state.data.purchasePrice > 0
      ? (value / state.data.purchasePrice * 100)
      : 25;

    // DEBUG Issue #29: Track down payment values
    console.log('🔍 DOWN PAYMENT $ → % CONVERSION:', {
      dollarAmount: value,
      purchasePrice: state.data.purchasePrice,
      calculatedPercentage,
      loanAmount: (state.data.purchasePrice || 0) - value,
      formula: `$${value} / ${state.data.purchasePrice} = ${calculatedPercentage}%`
    });

    onUpdate({
      data: {
        ...state.data,
        downPaymentPercentage: calculatedPercentage,
        downPayment: value
      }
    });
  };

  // UX Enhancement: Handle tax rate change (% → $)
  const handlePropertyTaxRateChange = (value: number) => {
    setPropertyTaxRate(value);
    setIsPropertyTaxCustomized(true);

    // Auto-calculate annual amount
    if (state.data.purchasePrice) {
      const calculatedAnnual = (state.data.purchasePrice * value / 100);
      setAnnualPropertyTax(calculatedAnnual);
    }
  };

  // UX Enhancement: Handle annual tax change ($ → %)
  const handleAnnualPropertyTaxChange = (value: number) => {
    setAnnualPropertyTax(value);
    setIsPropertyTaxCustomized(true);

    // Auto-calculate rate
    if (state.data.purchasePrice && state.data.purchasePrice > 0) {
      const calculatedRate = (value / state.data.purchasePrice * 100);
      setPropertyTaxRate(calculatedRate);
    }
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

  // Phase 1: Fetch property tax estimate (migrated from AssumptionsStep)
  useEffect(() => {
    if (state.data.propertyAddress?.zipCode && state.data.purchasePrice && !isFetchingTaxData) {
      const fetchTaxEstimate = async () => {
        setIsFetchingTaxData(true);
        try {
          console.log('FinancialsStep: Fetching property tax estimate');

          const address = `${state.data.propertyAddress?.street}, ${state.data.propertyAddress?.city}, ${state.data.propertyAddress?.state}`;

          const response = await wizardApi.getPropertyTaxEstimate({
            address,
            purchasePrice: state.data.purchasePrice || 0,
            zipCode: state.data.propertyAddress?.zipCode || '',
            state: state.data.propertyAddress?.state || '',
            county: state.data.propertyAddress?.county
          });

          if (response.data.success && response.data.data) {
            const taxData = response.data.data;

            console.log('FinancialsStep: Received tax estimate:', {
              taxRate: taxData.effectiveTaxRate,
              confidence: taxData.confidence?.score,
              source: taxData.confidence?.source
            });

            // Store smart default metadata
            setPropertyTaxSmartDefault({
              value: taxData.effectiveTaxRate,
              source: taxData.confidence?.source || 'Tax Estimation Service',
              confidence: { score: taxData.confidence?.score || 70 }
            });

            // Auto-apply tax rate if not customized
            if (!isPropertyTaxCustomized) {
              setPropertyTaxRate(taxData.effectiveTaxRate);
              // UX Enhancement: Also update annual amount for dual input mode sync
              const calculatedAnnual = (state.data.purchasePrice || 0) * taxData.effectiveTaxRate / 100;
              setAnnualPropertyTax(calculatedAnnual);
            }

            // Update wizard smart defaults
            onUpdate({
              smartDefaults: {
                ...state.smartDefaults,
                propertyTaxRate: {
                  value: taxData.effectiveTaxRate,
                  confidence: {
                    score: taxData.confidence?.score || 70,
                    source: taxData.confidence?.source || 'Tax Estimation Service',
                    lastUpdated: new Date(),
                    reliability: taxData.confidence?.reliability || 'medium' as const
                  }
                }
              }
            });
          } else {
            // Fallback to national average
            console.warn('FinancialsStep: Tax estimate failed, using fallback');
            setPropertyTaxSmartDefault({
              value: 1.2,
              source: 'National Average (Fallback)',
              confidence: { score: 50 }
            });

            if (!isPropertyTaxCustomized) {
              setPropertyTaxRate(1.2);
              // UX Enhancement: Also update annual amount for dual input mode sync
              const calculatedAnnual = (state.data.purchasePrice || 0) * 1.2 / 100;
              setAnnualPropertyTax(calculatedAnnual);
            }
          }
        } catch (error) {
          console.error('FinancialsStep: Error fetching tax estimate:', error);
          // Use fallback on error
          setPropertyTaxSmartDefault({
            value: 1.2,
            source: 'Default Value',
            confidence: { score: 40 }
          });

          if (!isPropertyTaxCustomized) {
            setPropertyTaxRate(1.2);
            // UX Enhancement: Also update annual amount for dual input mode sync
            const calculatedAnnual = (state.data.purchasePrice || 0) * 1.2 / 100;
            setAnnualPropertyTax(calculatedAnnual);
          }
        } finally {
          setIsFetchingTaxData(false);
        }
      };

      fetchTaxEstimate();
    }
  }, [state.data.propertyAddress?.zipCode, state.data.purchasePrice]);

  // Phase 1: Update wizard state when property tax changes
  useEffect(() => {
    if (state.data.purchasePrice) {
      onUpdate({
        data: {
          ...state.data,
          propertyTaxRate
        }
      });
    }
  }, [propertyTaxRate, state.data.purchasePrice]);

  // FIX Issue #27: Sync insurance to wizard data when monthlyInsurance changes
  useEffect(() => {
    if (state.data.purchasePrice && monthlyInsurance) {
      const annualInsurance = monthlyInsurance * 12;
      const insuranceRate = (annualInsurance / state.data.purchasePrice) * 100;

      onUpdate({
        data: {
          ...state.data,
          insuranceRate: insuranceRate
        }
      });
    }
  }, [monthlyInsurance, state.data.purchasePrice]);

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};

    if (state.smartDefaults.currentMortgageRate?.confidence) {
      confidence.interestRate = state.smartDefaults.currentMortgageRate.confidence;
    }
    if (state.smartDefaults.propertyTaxRate?.confidence) {
      confidence.propertyTaxRate = state.smartDefaults.propertyTaxRate.confidence;
    }
    if (typeof state.smartDefaults.closingCostPercentage === 'object' &&
        state.smartDefaults.closingCostPercentage?.confidence) {
      confidence.closingCosts = state.smartDefaults.closingCostPercentage.confidence;
    }

    return confidence;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const monthlyPropertyTax = (state.data.purchasePrice || 0) * propertyTaxRate / 100 / 12;
  // UX Enhancement: annualPropertyTax is now state variable (line 66-68)
  const annualInsurance = monthlyInsurance * 12;
  const totalCashNeeded = downPaymentAmount + (state.data.closingCosts || 0) + (state.data.capitalInvestments || 0);

  return (
    <WizardStep
      title="Financial Details"
      description="Configure your purchase price, financing terms, taxes, and insurance"
      validation={validation}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={[
        ...(state.smartDefaults.currentMortgageRate ? ['interestRate'] : []),
        ...(propertyTaxSmartDefault ? ['propertyTaxRate'] : [])
      ]}
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

            <Grid item xs={12}>
              <Box>
                {/* UX Enhancement: Input mode toggle */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    Down Payment Input Method:
                  </Typography>
                  <ToggleButtonGroup
                    value={downPaymentInputMode}
                    exclusive
                    onChange={(_, value) => value && setDownPaymentInputMode(value)}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        fontFamily: 'SF Pro Text',
                        fontSize: '14px',
                        fontWeight: 500,
                        textTransform: 'none',
                        borderRadius: '8px'
                      }
                    }}
                  >
                    <ToggleButton value="percentage">% of Purchase Price</ToggleButton>
                    <ToggleButton value="amount">$ Dollar Amount</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Conditional input based on mode */}
                {downPaymentInputMode === 'percentage' ? (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Down Payment: {formatCurrency(downPaymentAmount, 0)} at {(state.data.downPaymentPercentage || 25).toFixed(1)}%
                    </Typography>
                    <Slider
                      value={state.data.downPaymentPercentage || 25}
                      onChange={(_, value) => handleDownPaymentPercentageChange(value as number)}
                      min={0}
                      max={99}
                      step={1}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 20, label: '20%' },
                        { value: 25, label: '25%' },
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' }
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Down Payment Amount"
                      type="number"
                      value={downPaymentAmount}
                      onChange={(e) => handleDownPaymentAmountChange(parseFloat(e.target.value) || 0)}
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                      inputProps={{
                        min: 0, // User can do 0% down (though not recommended for investment properties)
                        step: 1000
                      }}
                      helperText={`Estimated rate: ${(state.data.downPaymentPercentage || 25).toFixed(1)}% of ${formatCurrency(state.data.purchasePrice || 0, 0)}`}
                    />
                  </>
                )}
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

        {/* Phase 1: Property Tax & Insurance Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeIcon color="primary" />
            Property Tax & Insurance
            {propertyTaxSmartDefault && (
              <Chip
                label="Smart Defaults Applied"
                size="small"
                color="success"
                variant="outlined"
                icon={<AutoAwesome />}
              />
            )}
          </Typography>

          <TapToExpandField
            label="Property Tax"
            displayValue={formatCurrency(annualPropertyTax, 0) + '/year'}
            helperText={`${formatPercent(propertyTaxRate, 2)} • ${propertyTaxSmartDefault?.source || 'Estimated'}`}
            smartDefault={propertyTaxSmartDefault}
            isCustomized={isPropertyTaxCustomized}
          >
            {/* UX Enhancement: Input mode toggle */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Input Method:
              </Typography>
              <ToggleButtonGroup
                value={taxInputMode}
                exclusive
                onChange={(_, value) => value && setTaxInputMode(value)}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    fontFamily: 'SF Pro Text',
                    fontSize: '14px',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: '8px'
                  }
                }}
              >
                <ToggleButton value="rate">% Rate</ToggleButton>
                <ToggleButton value="annual">$ Annual</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Conditional input based on mode */}
            {taxInputMode === 'rate' ? (
              <>
                <HybridSliderInput
                  label="Property Tax Rate"
                  value={propertyTaxRate}
                  onChange={handlePropertyTaxRateChange}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  unit="percentage"
                  marks={[
                    { value: 0.5, label: '0.5%' },
                    { value: 1.2, label: '1.2%' },
                    { value: 2.5, label: '2.5%' }
                  ]}
                  helperText="Adjust based on your property's actual tax rate"
                />

                {/* Show calculated annual amount */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Estimated: {formatCurrency(annualPropertyTax, 0)}/year at {formatCurrency(state.data.purchasePrice || 0, 0)} purchase price
                </Typography>
              </>
            ) : (
              <>
                <HybridSliderInput
                  label="Annual Property Tax"
                  value={annualPropertyTax}
                  onChange={handleAnnualPropertyTaxChange}
                  min={500}
                  max={10000}
                  step={50}
                  unit="currency"
                  marks={[
                    { value: 2000, label: formatCurrency(2000, 0) },
                    { value: 5000, label: formatCurrency(5000, 0) },
                    { value: 8000, label: formatCurrency(8000, 0) }
                  ]}
                  helperText="Enter the annual property tax from your tax bill"
                />

                {/* Show calculated rate */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Estimated rate: {formatPercent(propertyTaxRate, 2)} at {formatCurrency(state.data.purchasePrice || 0, 0)} purchase price
                </Typography>
              </>
            )}

            {propertyTaxSmartDefault && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const defaultRate = propertyTaxSmartDefault.value;
                    setPropertyTaxRate(defaultRate);
                    setIsPropertyTaxCustomized(false);

                    // UX Enhancement: Also reset annual amount
                    if (state.data.purchasePrice) {
                      const calculatedAnnual = (state.data.purchasePrice * defaultRate / 100);
                      setAnnualPropertyTax(calculatedAnnual);
                    }
                  }}
                >
                  Reset to {propertyTaxSmartDefault.source}
                </Button>
              </Box>
            )}
          </TapToExpandField>

          <Box sx={{ mt: 2 }}>
            <TapToExpandField
              label="Homeowners Insurance"
              displayValue={formatCurrency(monthlyInsurance, 0) + '/month'}
              helperText={`${formatCurrency(annualInsurance, 0)}/year • Industry average (0.35% rule)`}
              smartDefault={{
                value: state.data.purchasePrice ? (state.data.purchasePrice * 0.0035 / 12) : 200,
                source: 'Industry Average',
                confidence: { score: 60 }
              }}
              isCustomized={isInsuranceCustomized}
            >
              <HybridSliderInput
                label="Monthly Insurance"
                value={monthlyInsurance}
                onChange={(value) => {
                  setMonthlyInsurance(value);
                  setIsInsuranceCustomized(true);
                }}
                min={50}
                max={500}
                step={10}
                unit="currency"
                marks={[
                  { value: 100, label: formatCurrency(100, 0) },
                  { value: 200, label: formatCurrency(200, 0) },
                  { value: 300, label: formatCurrency(300, 0) }
                ]}
                helperText="Adjust based on quotes from insurance providers"
              />

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const estimatedInsurance = state.data.purchasePrice ? (state.data.purchasePrice * 0.0035 / 12) : 200;
                    setMonthlyInsurance(estimatedInsurance);
                    setIsInsuranceCustomized(false);
                  }}
                >
                  Reset to Industry Average
                </Button>
              </Box>
            </TapToExpandField>
          </Box>
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
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Monthly Tax:</Typography>
                <Typography variant="h6">${Math.round(monthlyPropertyTax).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Monthly Insurance:</Typography>
                <Typography variant="h6">${Math.round(monthlyInsurance).toLocaleString()}</Typography>
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
              Interest rates are updated daily from FRED economic data. Property tax rates are based on
              ZIP code data. Insurance estimates use industry averages (0.35% rule). All values can be
              customized by tapping to expand.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default FinancialsStep;