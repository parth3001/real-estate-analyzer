/**
 * AssumptionsStep - Step 4 of Property Wizard
 * Handles long-term assumptions: taxes, insurance, maintenance, and growth rates
 */

import React, { useEffect, useState } from 'react';
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
  Divider,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack
} from '@mui/material';
import {
  AccountBalance,
  // Shield,
  Build,
  TrendingUp,
  CalendarToday,
  AutoAwesome,
  Info,
  RestoreOutlined,
  Psychology as StrategyIcon
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';
import { wizardApi } from '../../services/api';

const AssumptionsStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [useSmartDefaults] = useState(true);
  const [smartDefaultsApplied, setSmartDefaultsApplied] = useState(false);
  
  // Calculate annual costs
  const annualPropertyTax = (state.data.purchasePrice || 0) * (state.data.propertyTaxRate || 1.2) / 100;
  const annualInsurance = (state.data.purchasePrice || 0) * (state.data.insuranceRate || 0.7) / 100;
  const annualMaintenance = (state.data.monthlyRent || 0) * 12 * (state.data.maintenanceReservePercentage || 5) / 100;
  const totalAnnualExpenses = annualPropertyTax + annualInsurance + annualMaintenance;

  // Mock smart defaults lookup (Phase 1)
  useEffect(() => {
    if (useSmartDefaults && !state.smartDefaults.propertyTaxRate && state.data.propertyAddress?.zipCode && state.data.purchasePrice) {
      // Fetch real property tax data using hybrid validation
      const fetchTaxEstimate = async () => {
        try {
          console.log('AssumptionsStep: Fetching property tax estimate');
          
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
            
            console.log('AssumptionsStep: Received tax estimate:', {
              taxRate: taxData.effectiveTaxRate,
              confidence: taxData.confidence?.score,
              source: taxData.confidence?.source
            });
            
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
                },
                // Keep mock data for other fields for now
                insuranceRate: {
                  value: 0.7,
                  confidence: {
                    score: 85,
                    source: 'Regional Average',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                },
                appreciationRate: {
                  value: 3.5,
                  confidence: {
                    score: 80,
                    source: 'Historical Market Data',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                },
                rentGrowthRate: {
                  value: 3.0,
                  confidence: {
                    score: 82,
                    source: 'Market Trends',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                }
              }
            });
            
            // Auto-apply the smart default tax rate to the slider
            if (!smartDefaultsApplied && taxData.effectiveTaxRate) {
              onUpdate({
                data: {
                  ...state.data,
                  propertyTaxRate: taxData.effectiveTaxRate
                }
              });
              setSmartDefaultsApplied(true);
            }
          } else {
            // Fallback to default if API fails
            console.warn('AssumptionsStep: Tax estimate failed, using fallback');
            onUpdate({
              smartDefaults: {
                ...state.smartDefaults,
                propertyTaxRate: {
                  value: 1.2,
                  confidence: {
                    score: 50,
                    source: 'National Average (Fallback)',
                    lastUpdated: new Date(),
                    reliability: 'low' as const
                  }
                },
                insuranceRate: {
                  value: 0.7,
                  confidence: {
                    score: 85,
                    source: 'Regional Average',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                },
                appreciationRate: {
                  value: 3.5,
                  confidence: {
                    score: 80,
                    source: 'Historical Market Data',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                },
                rentGrowthRate: {
                  value: 3.0,
                  confidence: {
                    score: 82,
                    source: 'Market Trends',
                    lastUpdated: new Date(),
                    reliability: 'medium' as const
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('AssumptionsStep: Error fetching tax estimate:', error);
          // Use fallback on error
          onUpdate({
            smartDefaults: {
              ...state.smartDefaults,
              propertyTaxRate: {
                value: 1.2,
                confidence: {
                  score: 40,
                  source: 'Default Value',
                  lastUpdated: new Date(),
                  reliability: 'low' as const
                }
              },
              insuranceRate: {
                value: 0.7,
                confidence: {
                  score: 85,
                  source: 'Regional Average',
                  lastUpdated: new Date(),
                  reliability: 'medium' as const
                }
              },
              appreciationRate: {
                value: 3.5,
                confidence: {
                  score: 80,
                  source: 'Historical Market Data',
                  lastUpdated: new Date(),
                  reliability: 'medium' as const
                }
              },
              rentGrowthRate: {
                value: 3.0,
                confidence: {
                  score: 82,
                  source: 'Market Trends',
                  lastUpdated: new Date(),
                  reliability: 'medium' as const
                }
              }
            }
          });
        }
      };

      fetchTaxEstimate();
    }
  }, [state.data.propertyAddress?.zipCode, state.data.purchasePrice, useSmartDefaults, smartDefaultsApplied]);

  // Apply smart defaults
  const applySmartDefaults = () => {
    const updates: any = {};
    
    if (state.smartDefaults.propertyTaxRate?.value) {
      updates.propertyTaxRate = state.smartDefaults.propertyTaxRate.value;
    }
    if (state.smartDefaults.insuranceRate?.value) {
      updates.insuranceRate = state.smartDefaults.insuranceRate.value;
    }
    if (state.smartDefaults.appreciationRate?.value) {
      updates.longTermAssumptions = {
        ...state.data.longTermAssumptions,
        annualPropertyValueIncrease: state.smartDefaults.appreciationRate.value
      };
    }
    if (state.smartDefaults.rentGrowthRate?.value) {
      updates.longTermAssumptions = {
        ...state.data.longTermAssumptions,
        annualRentIncrease: state.smartDefaults.rentGrowthRate.value
      };
    }
    
    onUpdate({
      data: {
        ...state.data,
        ...updates
      }
    });
  };

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};
    
    if (state.smartDefaults.propertyTaxRate?.confidence) {
      confidence.propertyTaxRate = state.smartDefaults.propertyTaxRate.confidence;
    }
    if (state.smartDefaults.insuranceRate?.confidence) {
      confidence.insuranceRate = state.smartDefaults.insuranceRate.confidence;
    }
    if (state.smartDefaults.appreciationRate?.confidence) {
      confidence.appreciationRate = state.smartDefaults.appreciationRate.confidence;
    }
    if (state.smartDefaults.rentGrowthRate?.confidence) {
      confidence.rentGrowthRate = state.smartDefaults.rentGrowthRate.confidence;
    }
    
    return confidence;
  };

  const hasSmartDefaults = Object.keys(state.smartDefaults).length > 0;

  return (
    <WizardStep
      title="Operating Assumptions"
      description="Set your property taxes, insurance, maintenance reserves, and growth projections"
      validation={validation}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={hasSmartDefaults ? ['propertyTaxRate', 'insuranceRate'] : []}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Smart Defaults Alert */}
        {hasSmartDefaults && (
          <Alert 
            severity="info" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={applySmartDefaults}
                startIcon={<AutoAwesome />}
              >
                Apply All
              </Button>
            }
          >
            We've found location-specific defaults for your property. Click "Apply All" to use recommended values.
          </Alert>
        )}

        {/* Property Taxes & Insurance Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            Property Taxes & Insurance
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Property Tax Rate: {state.data.propertyTaxRate || state.smartDefaults.propertyTaxRate?.value || 1.2}%
                  {state.smartDefaults.propertyTaxRate?.value && 
                   state.data.propertyTaxRate === state.smartDefaults.propertyTaxRate.value && (
                    <Chip 
                      label="Smart Default Applied" 
                      size="small" 
                      color="success" 
                      sx={{ fontSize: '0.7rem', height: '20px' }} 
                    />
                  )}
                  <Tooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>How We Calculate Tax Rates:</Typography>
                        <Typography variant="body2" paragraph>
                          <strong>1. RentCast Data:</strong> We get property tax history from comparable properties
                        </Typography>
                        <Typography variant="body2" paragraph>
                          <strong>2. Official Ratios:</strong> We use state assessment ratios (e.g., IL: 33.33%, TX: 100%)
                        </Typography>
                        <Typography variant="body2" paragraph>
                          <strong>3. Hybrid Validation:</strong> We cross-check both sources to ensure accuracy
                        </Typography>
                        <Typography variant="body2">
                          <em>Formula: (Annual Tax ÷ Assessed Value) × (Assessed Value ÷ Market Value) = Effective Rate</em>
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Info fontSize="small" color="action" sx={{ cursor: 'help' }} />
                  </Tooltip>
                  {state.smartDefaults.propertyTaxRate && (
                    <Tooltip title="Apply smart default">
                      <IconButton 
                        size="small" 
                        onClick={() => onUpdate({
                          data: { ...state.data, propertyTaxRate: state.smartDefaults.propertyTaxRate?.value }
                        })}
                      >
                        <RestoreOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Typography>
                <Slider
                  value={state.data.propertyTaxRate || state.smartDefaults.propertyTaxRate?.value || 1.2}
                  onChange={(_, value) => onUpdate({
                    data: { ...state.data, propertyTaxRate: value as number }
                  })}
                  min={0.5}
                  max={3}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5%' },
                    { value: 1.2, label: '1.2%' },
                    { value: 2, label: '2%' },
                    { value: 3, label: '3%' },
                    ...(state.smartDefaults.propertyTaxRate?.value ? [{ 
                      value: state.smartDefaults.propertyTaxRate.value, 
                      label: `${state.smartDefaults.propertyTaxRate.value}%*` 
                    }] : [])
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Typography variant="caption" color="text.secondary">
                  Annual tax: ${Math.round(annualPropertyTax).toLocaleString()}
                  {state.smartDefaults.propertyTaxRate && (
                    <Chip 
                      label={`Recommended: ${state.smartDefaults.propertyTaxRate.value}%`}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Insurance Rate: {state.data.insuranceRate || 0.7}%
                  {state.smartDefaults.insuranceRate && (
                    <Tooltip title="Apply smart default">
                      <IconButton 
                        size="small" 
                        onClick={() => onUpdate({
                          data: { ...state.data, insuranceRate: state.smartDefaults.insuranceRate?.value }
                        })}
                      >
                        <RestoreOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Typography>
                <Slider
                  value={state.data.insuranceRate || 0.7}
                  onChange={(_, value) => onUpdate({
                    data: { ...state.data, insuranceRate: value as number }
                  })}
                  min={0.3}
                  max={1.5}
                  step={0.1}
                  marks={[
                    { value: 0.3, label: '0.3%' },
                    { value: 0.7, label: '0.7%' },
                    { value: 1, label: '1%' },
                    { value: 1.5, label: '1.5%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Typography variant="caption" color="text.secondary">
                  Annual insurance: ${Math.round(annualInsurance).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Maintenance & Reserves Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build color="primary" />
            Maintenance & Reserves
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Maintenance Reserve: {state.data.maintenanceReservePercentage || 5}% of rent
                </Typography>
                <Slider
                  value={state.data.maintenanceReservePercentage || 5}
                  onChange={(_, value) => onUpdate({
                    data: { ...state.data, maintenanceReservePercentage: value as number }
                  })}
                  min={3}
                  max={15}
                  step={1}
                  marks={[
                    { value: 3, label: '3%' },
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                    { value: 15, label: '15%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Typography variant="caption" color="text.secondary">
                  Annual reserve: ${Math.round(annualMaintenance).toLocaleString()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Turnover Frequency"
                type="number"
                value={state.data.longTermAssumptions?.turnoverFrequency || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
                      annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
                      annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
                      sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
                      inflationRate: state.data.longTermAssumptions?.inflationRate || 2,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      ...state.data.longTermAssumptions,
                      turnoverFrequency: parseInt(e.target.value) || 0
                    }
                  }
                })}
                helperText="Average years between tenant changes"
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>
                }}
                inputProps={{ min: 1, max: 10 }}
                placeholder="2"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Growth Projections Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" />
            Growth Projections
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Property Appreciation"
                type="number"
                value={state.data.longTermAssumptions?.annualPropertyValueIncrease || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
                      annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
                      annualPropertyValueIncrease: parseFloat(e.target.value) || 0,
                      sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
                      inflationRate: state.data.longTermAssumptions?.inflationRate || 2,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 2
                    }
                  }
                })}
                helperText={state.smartDefaults.appreciationRate ? 
                  `Market avg: ${state.smartDefaults.appreciationRate.value}%` : ''}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%/year</InputAdornment>
                }}
                inputProps={{ step: 0.5, min: -5, max: 15 }}
                placeholder="3.5"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Rent Growth"
                type="number"
                value={state.data.longTermAssumptions?.annualRentIncrease || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
                      annualRentIncrease: parseFloat(e.target.value) || 0,
                      annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
                      sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
                      inflationRate: state.data.longTermAssumptions?.inflationRate || 2,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 2
                    }
                  }
                })}
                helperText={state.smartDefaults.rentGrowthRate ? 
                  `Market avg: ${state.smartDefaults.rentGrowthRate.value}%` : ''}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%/year</InputAdornment>
                }}
                inputProps={{ step: 0.5, min: 0, max: 10 }}
                placeholder="3"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Inflation Rate"
                type="number"
                value={state.data.longTermAssumptions?.inflationRate || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
                      annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
                      annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
                      sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
                      inflationRate: parseFloat(e.target.value) || 0,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 2
                    }
                  }
                })}
                helperText="For expense growth"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%/year</InputAdornment>
                }}
                inputProps={{ step: 0.5, min: 0, max: 10 }}
                placeholder="2.5"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Analysis Period Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" />
            Analysis Period
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Projection Years"
                type="number"
                value={state.data.longTermAssumptions?.projectionYears || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: parseInt(e.target.value) || 0,
                      annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
                      annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
                      sellingCostsPercentage: state.data.longTermAssumptions?.sellingCostsPercentage || 6,
                      inflationRate: state.data.longTermAssumptions?.inflationRate || 2,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 2
                    }
                  }
                })}
                helperText="Years to project cash flows"
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>
                }}
                inputProps={{ min: 1, max: 30 }}
                placeholder="10"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Costs"
                type="number"
                value={state.data.longTermAssumptions?.sellingCostsPercentage || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    longTermAssumptions: {
                      projectionYears: state.data.longTermAssumptions?.projectionYears || 10,
                      annualRentIncrease: state.data.longTermAssumptions?.annualRentIncrease || 3,
                      annualPropertyValueIncrease: state.data.longTermAssumptions?.annualPropertyValueIncrease || 3,
                      sellingCostsPercentage: parseFloat(e.target.value) || 0,
                      inflationRate: state.data.longTermAssumptions?.inflationRate || 2,
                      vacancyRate: state.data.longTermAssumptions?.vacancyRate || 5,
                      turnoverFrequency: state.data.longTermAssumptions?.turnoverFrequency || 2
                    }
                  }
                })}
                helperText="For exit analysis"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
                inputProps={{ step: 0.5, min: 0, max: 10 }}
                placeholder="6"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Investment Strategy Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StrategyIcon color="primary" />
            Investment Strategy
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Help us provide more personalized investment recommendations by sharing your strategy and goals.
          </Typography>

          <Stack spacing={3}>
            {/* Primary Exit Strategy */}
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                What's your preferred exit strategy for this property?
              </FormLabel>
              <RadioGroup
                value={state.data.exitStrategy?.primaryExitStrategy || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    exitStrategy: {
                      ...state.data.exitStrategy,
                      primaryExitStrategy: e.target.value as any
                    }
                  }
                })}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="sale" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Traditional Sale</Typography>
                      <Typography variant="caption" color="text.secondary">Market timing dependent</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="refinance" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Cash-out Refinance</Typography>
                      <Typography variant="caption" color="text.secondary">Hold indefinitely, extract equity</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="1031exchange" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>1031 Exchange</Typography>
                      <Typography variant="caption" color="text.secondary">Reinvest into larger property</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="estate" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Estate/Generational Hold</Typography>
                      <Typography variant="caption" color="text.secondary">Never sell, pass to heirs</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="flexible" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Flexible</Typography>
                      <Typography variant="caption" color="text.secondary">Opportunistic based on market</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* Portfolio Strategy */}
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                How does this property fit your investment strategy?
              </FormLabel>
              <RadioGroup
                value={state.data.exitStrategy?.portfolioStrategy || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    exitStrategy: {
                      ...state.data.exitStrategy,
                      portfolioStrategy: e.target.value as any
                    }
                  }
                })}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="first" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>First Investment Property</Typography>
                      <Typography variant="caption" color="text.secondary">Learning/conservative approach</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="geographic" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Geographic Diversification</Typography>
                      <Typography variant="caption" color="text.secondary">New market expansion</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="cashflow" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Cash Flow Priority</Typography>
                      <Typography variant="caption" color="text.secondary">Income-focused portfolio</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="appreciation" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Appreciation Priority</Typography>
                      <Typography variant="caption" color="text.secondary">Wealth building focus</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="diversification" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Property Type Diversification</Typography>
                      <Typography variant="caption" color="text.secondary">Mixed portfolio strategy</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* Market Timing Flexibility */}
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                How flexible are you with market timing?
              </FormLabel>
              <RadioGroup
                value={state.data.exitStrategy?.marketTimingFlexibility || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    exitStrategy: {
                      ...state.data.exitStrategy,
                      marketTimingFlexibility: e.target.value as any
                    }
                  }
                })}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="flexible" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Very Flexible</Typography>
                      <Typography variant="caption" color="text.secondary">Can wait for optimal market conditions</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="somewhat" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Somewhat Flexible</Typography>
                      <Typography variant="caption" color="text.secondary">Prefer good timing but not critical</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="constrained" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Time-Constrained</Typography>
                      <Typography variant="caption" color="text.secondary">Must exit within projection period</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="independent" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Market Independent</Typography>
                      <Typography variant="caption" color="text.secondary">Cash flow focused, timing irrelevant</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* Risk Approach */}
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                What's your risk approach for this investment?
              </FormLabel>
              <RadioGroup
                value={state.data.exitStrategy?.riskApproach || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    exitStrategy: {
                      ...state.data.exitStrategy,
                      riskApproach: e.target.value as any
                    }
                  }
                })}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="conservative" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Conservative</Typography>
                      <Typography variant="caption" color="text.secondary">Stable cash flow, lower leverage</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="balanced" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Balanced</Typography>
                      <Typography variant="caption" color="text.secondary">Moderate risk for moderate returns</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="aggressive" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Aggressive</Typography>
                      <Typography variant="caption" color="text.secondary">Higher leverage for higher returns</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="opportunistic" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Opportunistic</Typography>
                      <Typography variant="caption" color="text.secondary">Willing to take calculated risks</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* Capital Deployment */}
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                What's your plan after exiting this property?
              </FormLabel>
              <RadioGroup
                value={state.data.exitStrategy?.capitalDeployment || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    exitStrategy: {
                      ...state.data.exitStrategy,
                      capitalDeployment: e.target.value as any
                    }
                  }
                })}
                sx={{ ml: 1 }}
              >
                <FormControlLabel 
                  value="reinvest_re" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Reinvest in Real Estate</Typography>
                      <Typography variant="caption" color="text.secondary">1031 or new purchase</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="diversify" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Diversify Investments</Typography>
                      <Typography variant="caption" color="text.secondary">Stocks, bonds, other assets</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="lifestyle" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Fund Lifestyle/Expenses</Typography>
                      <Typography variant="caption" color="text.secondary">Education, retirement, major purchases</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="business" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Business Investment</Typography>
                      <Typography variant="caption" color="text.secondary">Start or expand business</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="debt" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Pay Down Debts</Typography>
                      <Typography variant="caption" color="text.secondary">Mortgage, loans, other debts</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Stack>

          {/* Strategy Context Card */}
          {(state.data.exitStrategy?.primaryExitStrategy || state.data.exitStrategy?.portfolioStrategy) && (
            <Card variant="outlined" sx={{ mt: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  <Info sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                  Investment Strategy Impact
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {state.data.exitStrategy?.primaryExitStrategy === 'refinance' && 
                    'Your refinance strategy will influence our leverage recommendations and cash flow analysis.'}
                  {state.data.exitStrategy?.primaryExitStrategy === 'sale' && 
                    'Your sale strategy will emphasize market timing and appreciation potential in our analysis.'}
                  {state.data.exitStrategy?.primaryExitStrategy === '1031exchange' && 
                    'Your 1031 exchange strategy will focus on tax optimization and equity growth potential.'}
                  {state.data.exitStrategy?.primaryExitStrategy === 'estate' && 
                    'Your generational strategy will emphasize long-term stability and cash flow consistency.'}
                  {state.data.exitStrategy?.portfolioStrategy === 'first' && 
                    ' As your first property, we\'ll provide extra safety margins and educational insights.'}
                  {state.data.exitStrategy?.riskApproach === 'conservative' && 
                    ' Your conservative approach will prioritize stable returns over aggressive growth.'}
                  {state.data.exitStrategy?.riskApproach === 'aggressive' && 
                    ' Your aggressive approach will explore higher leverage opportunities for enhanced returns.'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Summary Card */}
        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Annual Operating Expenses
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Property Tax:</Typography>
                <Typography variant="h6">${Math.round(annualPropertyTax).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Insurance:</Typography>
                <Typography variant="h6">${Math.round(annualInsurance).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Maintenance:</Typography>
                <Typography variant="h6">${Math.round(annualMaintenance).toLocaleString()}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Total Annual Expenses: <strong>${totalAnnualExpenses.toLocaleString()}</strong>
            </Typography>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary">
              <Info sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Smart Assumptions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Our smart defaults are based on your property location, current market conditions, 
              and historical data. Property tax rates come from county assessor data, while 
              insurance rates reflect regional averages. Growth projections are based on 
              10-year historical trends for your market.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default AssumptionsStep;