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
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  // Shield,
  Build,
  TrendingUp,
  CalendarToday,
  AutoAwesome,
  Info,
  RestoreOutlined
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