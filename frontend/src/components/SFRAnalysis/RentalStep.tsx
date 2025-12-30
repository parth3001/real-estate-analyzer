/**
 * RentalStep - Step 3 of Property Wizard
 * Handles rental income and property management details
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
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  Home,
  AttachMoney,
  BusinessCenter,
  TrendingUp,
  Assessment,
  AutoAwesome,
  CompareArrows,
  Info
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';
import type { LongTermAssumptions } from '../../types/property';
import { wizardApi } from '../../services/api';
import TapToExpandField from '../common/TapToExpandField/TapToExpandField';

const RentalStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  // Default long-term assumptions for type safety (matches backend defaults)
  const defaultLongTermAssumptions: LongTermAssumptions = {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    inflationRate: 2.5,
    vacancyRate: 5,
    sellingCostsPercentage: 6,
    turnoverFrequency: 2
  };

  const [selfManage, setSelfManage] = useState(false);
  const [loadingRentEstimate, setLoadingRentEstimate] = useState(false);

  // UX Enhancement: Dual input mode for Property Management (percentage vs dollar amount)
  const [mgmtInputMode, setMgmtInputMode] = useState<'percentage' | 'amount'>('percentage');
  const [mgmtMonthlyAmount, setMgmtMonthlyAmount] = useState(
    (state.data.monthlyRent || 0) * (state.data.propertyManagementRate || 8) / 100
  );

  // Calculate price to rent ratio
  const priceToRentRatio = state.data.purchasePrice && state.data.monthlyRent ?
    Math.round(state.data.purchasePrice / (state.data.monthlyRent * 12)) : 0;

  // Calculate gross rental yield
  const grossRentalYield = state.data.purchasePrice && state.data.monthlyRent ?
    ((state.data.monthlyRent * 12) / state.data.purchasePrice * 100).toFixed(2) : '0';

  // FIX Issue #28: Smart default for maintenance reserve (1% of property value annually)
  useEffect(() => {
    if (state.data.purchasePrice && !state.data.maintenanceCost) {
      const smartMaintenanceDefault = Math.round(state.data.purchasePrice * 0.01);

      console.log('🔧 ISSUE #28 FIX: Setting smart maintenance default:', {
        purchasePrice: state.data.purchasePrice,
        maintenanceDefault: smartMaintenanceDefault,
        formula: '1% of property value annually'
      });

      onUpdate({
        data: {
          ...state.data,
          maintenanceCost: smartMaintenanceDefault
        }
      });
    }
  }, [state.data.purchasePrice]); // Only run when purchase price changes

  // FIX Issue #28: Calculate maintenance as percentage of rent for validation
  const maintenancePercentOfRent = state.data.monthlyRent && state.data.maintenanceCost
    ? (state.data.maintenanceCost / 12 / state.data.monthlyRent) * 100
    : 0;

  // Real rent estimate lookup using RentCast + Census data
  useEffect(() => {
    if (!state.autoPopulated.rentEstimate && state.data.propertyAddress?.street && !loadingRentEstimate) {
      setLoadingRentEstimate(true);
      
      const fetchRentEstimate = async () => {
        try {
          console.log('RentalStep: Fetching real rent estimate for property');
          
          // Build address string
          const address = `${state.data.propertyAddress?.street}, ${state.data.propertyAddress?.city}, ${state.data.propertyAddress?.state}`;
          
          // Call real API
          const response = await wizardApi.getRentEstimate({
            address,
            squareFootage: state.data.squareFootage,
            bedrooms: state.data.bedrooms,
            bathrooms: state.data.bathrooms,
            yearBuilt: state.data.yearBuilt,
            zipCode: state.data.propertyAddress?.zipCode
          });

          if (response.data.success && response.data.data) {
            const rentData = response.data.data;
            
            console.log('RentalStep: Received rent estimate:', {
              value: rentData.value,
              confidence: rentData.confidence.score,
              source: rentData.confidence.source
            });
            
            onUpdate({
              data: {
                ...state.data,
                monthlyRent: state.data.monthlyRent || rentData.value
              },
              autoPopulated: {
                ...state.autoPopulated,
                rentEstimate: {
                  value: rentData.value,
                  confidence: {
                    score: rentData.confidence.score,
                    source: rentData.confidence.source,
                    lastUpdated: new Date(),
                    reliability: rentData.confidence.reliability
                  },
                  range: rentData.range
                }
              }
            });
          } else {
            console.warn('RentalStep: Failed to get rent estimate, using fallback');
            
            // Fallback to simple calculation if API fails
            const fallbackRent = state.data.squareFootage ? state.data.squareFootage * 1.2 : 2200;
            
            onUpdate({
              data: {
                ...state.data,
                monthlyRent: state.data.monthlyRent || Math.round(fallbackRent)
              },
              autoPopulated: {
                ...state.autoPopulated,
                rentEstimate: {
                  value: Math.round(fallbackRent),
                  confidence: {
                    score: 30,
                    source: 'Fallback Calculation',
                    lastUpdated: new Date(),
                    reliability: 'low' as const
                  },
                  range: {
                    low: Math.round(fallbackRent * 0.8),
                    high: Math.round(fallbackRent * 1.2)
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('RentalStep: Error fetching rent estimate:', error);
          
          // Fallback on error
          const fallbackRent = state.data.squareFootage ? state.data.squareFootage * 1.2 : 2200;
          
          onUpdate({
            data: {
              ...state.data,
              monthlyRent: state.data.monthlyRent || Math.round(fallbackRent)
            },
            autoPopulated: {
              ...state.autoPopulated,
              rentEstimate: {
                value: Math.round(fallbackRent),
                confidence: {
                  score: 25,
                  source: 'Error Fallback',
                  lastUpdated: new Date(),
                  reliability: 'low' as const
                },
                range: {
                  low: Math.round(fallbackRent * 0.8),
                  high: Math.round(fallbackRent * 1.2)
                }
              }
            }
          });
        } finally {
          setLoadingRentEstimate(false);
        }
      };

      fetchRentEstimate();
    }
  }, [state.data.propertyAddress?.street, state.data.squareFootage, state.data.bedrooms, state.data.yearBuilt]);

  // Handle self management toggle
  const handleSelfManageToggle = (checked: boolean) => {
    setSelfManage(checked);
    const newRate = checked ? 0 : 8;
    const calculatedAmount = (state.data.monthlyRent || 0) * newRate / 100;
    setMgmtMonthlyAmount(calculatedAmount);

    onUpdate({
      data: {
        ...state.data,
        propertyManagementRate: newRate
      }
    });
  };

  // UX Enhancement: Handle property management percentage change (% → $)
  const handleMgmtPercentageChange = (value: number) => {
    const calculatedAmount = (state.data.monthlyRent || 0) * value / 100;
    setMgmtMonthlyAmount(calculatedAmount);

    onUpdate({
      data: {
        ...state.data,
        propertyManagementRate: value
      }
    });
  };

  // UX Enhancement: Handle property management amount change ($ → %)
  const handleMgmtAmountChange = (value: number) => {
    setMgmtMonthlyAmount(value);

    // Auto-calculate percentage
    const calculatedPercentage = state.data.monthlyRent && state.data.monthlyRent > 0
      ? (value / state.data.monthlyRent * 100)
      : 8;

    onUpdate({
      data: {
        ...state.data,
        propertyManagementRate: calculatedPercentage
      }
    });
  };

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};
    
    if (state.autoPopulated.rentEstimate?.confidence) {
      confidence.monthlyRent = state.autoPopulated.rentEstimate.confidence;
    }
    
    return confidence;
  };

  const autoPopulatedFields = state.autoPopulated.rentEstimate ? ['monthlyRent'] : [];

  return (
    <WizardStep
      title="Rental Income & Management"
      description="Set up your rental income projections and property management strategy"
      validation={validation}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={autoPopulatedFields}
      isLoading={loadingRentEstimate}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Rental Income Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            Rental Income
            {state.autoPopulated.rentEstimate && (
              <Chip
                label="Market Rate Applied"
                size="small"
                color="success"
                variant="outlined"
                icon={<AutoAwesome />}
              />
            )}
          </Typography>
          
          {loadingRentEstimate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Analyzing local rental market...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={state.data.monthlyRent || ''}
                onChange={(e) => onUpdate({
                  data: { ...state.data, monthlyRent: parseInt(e.target.value) || 0 }
                })}
                error={!!validation.errors['monthlyRent']}
                helperText={validation.errors['monthlyRent'] || 
                  (state.autoPopulated.rentEstimate ? 
                    `Market range: $${state.autoPopulated.rentEstimate.range?.low?.toLocaleString()} - $${state.autoPopulated.rentEstimate.range?.high?.toLocaleString()}` : '')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="2200"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Annual Rent"
                value={(state.data.monthlyRent || 0) * 12}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
          </Grid>

          {state.autoPopulated.rentEstimate && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Based on comparable properties in your area, we estimate a monthly rent of{' '}
                <strong>${state.autoPopulated.rentEstimate.value?.toLocaleString()}</strong>.
                This represents the {state.autoPopulated.rentEstimate.confidence?.score}th percentile of market rents.
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Property Management Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenter color="primary" />
            Property Management
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selfManage}
                    onChange={(e) => handleSelfManageToggle(e.target.checked)}
                  />
                }
                label="I will self-manage this property"
              />
            </Grid>

            {!selfManage && (
              <Grid item xs={12}>
                <Box>
                  {/* UX Enhancement: Input mode toggle */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Property Management Fee Input Method:
                    </Typography>
                    <ToggleButtonGroup
                      value={mgmtInputMode}
                      exclusive
                      onChange={(_, value) => value && setMgmtInputMode(value)}
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
                      <ToggleButton value="percentage">% of Monthly Rent</ToggleButton>
                      <ToggleButton value="amount">$ Monthly Amount</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Conditional input based on mode */}
                  {mgmtInputMode === 'percentage' ? (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {state.data.strategy === 'brrrr' ? 'Property Management Fee (All Phases): ' : 'Management Fee: '}
                        {(state.data.propertyManagementRate || 8).toFixed(1)}% (${Math.round(mgmtMonthlyAmount)}/month)
                        {state.data.strategy === 'brrrr' && (
                          <Tooltip
                            title="Applied during both seasoning period and post-refinance operations. This fee is deducted from gross rental income."
                            arrow
                            placement="right"
                          >
                            <Info sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle', cursor: 'help', color: 'info.main' }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Slider
                        value={state.data.propertyManagementRate || 8}
                        onChange={(_, value) => handleMgmtPercentageChange(value as number)}
                        min={0}
                        max={15}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 8, label: '8%' },
                          { value: 10, label: '10%' },
                          { value: 12, label: '12%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </>
                  ) : (
                    <>
                      <TextField
                        label="Property Management Monthly Fee"
                        type="number"
                        value={Math.round(mgmtMonthlyAmount)}
                        onChange={(e) => handleMgmtAmountChange(parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                        inputProps={{
                          min: 0, // User can set to 0 if managing themselves
                          step: 10
                        }}
                        helperText={`Estimated rate: ${(state.data.propertyManagementRate || 8).toFixed(1)}% of ${(state.data.monthlyRent || 0).toLocaleString()}/month rent`}
                      />
                    </>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {state.data.strategy === 'brrrr' ? 'Post-Refinance ' : ''}Vacancy Rate: {state.data.vacancyRate || 5}%
                  {state.data.strategy === 'brrrr' && (
                    <Tooltip
                      title="Used for long-term cash flow projections after refinance. During seasoning period (6-12 months), property must be tenant-occupied per lender requirements."
                      arrow
                      placement="right"
                    >
                      <Info sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle', cursor: 'help', color: 'info.main' }} />
                    </Tooltip>
                  )}
                </Typography>
                <Slider
                  value={state.data.vacancyRate || 5}
                  onChange={(_, value) => onUpdate({
                    data: {
                      ...state.data,
                      vacancyRate: value as number,
                      // CRITICAL FIX: Sync vacancy rate to longTermAssumptions for backend calculations
                      // This maintains the pattern from the old AssumptionsStep that we deleted in Phase 1
                      longTermAssumptions: {
                        ...defaultLongTermAssumptions,
                        ...state.data.longTermAssumptions,
                        vacancyRate: value as number
                      }
                    }
                  })}
                  min={0}
                  max={20}
                  step={1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Typography variant="caption" color="text.secondary">
                  {state.data.strategy === 'brrrr'
                    ? `Post-refinance projection: ~${Math.round(365 * (state.data.vacancyRate || 5) / 100)} vacant days/year`
                    : `Expected vacant days/year: ${Math.round(365 * (state.data.vacancyRate || 5) / 100)}`
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Turnover Fees Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows color="primary" />
            Tenant Turnover Costs
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Prep Fees"
                type="number"
                value={state.data.tenantTurnoverFees?.prepFees || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    tenantTurnoverFees: {
                      ...state.data.tenantTurnoverFees,
                      prepFees: parseInt(e.target.value) || 0
                    }
                  }
                })}
                helperText="Cleaning, painting, minor repairs"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="500"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Realtor Commission"
                type="number"
                value={state.data.tenantTurnoverFees?.realtorCommission || ''}
                onChange={(e) => onUpdate({
                  data: {
                    ...state.data,
                    tenantTurnoverFees: {
                      ...state.data.tenantTurnoverFees,
                      realtorCommission: parseFloat(e.target.value) || 0
                    }
                  }
                })}
                helperText="Months of rent for finding tenants"
                InputProps={{
                  endAdornment: <InputAdornment position="end">months</InputAdornment>
                }}
                inputProps={{ step: 0.5, min: 0, max: 2 }}
                placeholder="0.5"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Advanced Assumptions Section - Collapsed by Default */}
        <Box>
          <TapToExpandField
            label="Advanced Assumptions"
            displayValue="Optional - Customize for more accurate long-term analysis"
            helperText="Using industry-standard defaults"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Long-term Projections */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  📈 Long-Term Projections
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Projection Years"
                      type="number"
                      value={state.data.longTermAssumptions?.projectionYears || 10}
                      onChange={(e) => onUpdate({
                        data: {
                          ...state.data,
                          longTermAssumptions: {
                            ...defaultLongTermAssumptions,
                            ...state.data.longTermAssumptions,
                            projectionYears: parseFloat(e.target.value) || 10
                          }
                        }
                      })}
                      helperText="Years to project cash flows and appreciation"
                      inputProps={{ min: 1, max: 30, step: 1 }}
                      placeholder="10"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Annual Rent Increase: {(state.data.longTermAssumptions?.annualRentIncrease || 3).toFixed(1)}%
                      </Typography>
                      <Slider
                        value={state.data.longTermAssumptions?.annualRentIncrease || 3}
                        onChange={(_, value) => onUpdate({
                          data: {
                            ...state.data,
                            longTermAssumptions: {
                              ...defaultLongTermAssumptions,
                              ...state.data.longTermAssumptions,
                              annualRentIncrease: value as number
                            }
                          }
                        })}
                        min={0}
                        max={10}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 3, label: '3%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Expected annual rent growth rate
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Property Appreciation: {(state.data.longTermAssumptions?.annualPropertyValueIncrease || 3).toFixed(1)}%
                      </Typography>
                      <Slider
                        value={state.data.longTermAssumptions?.annualPropertyValueIncrease || 3}
                        onChange={(_, value) => onUpdate({
                          data: {
                            ...state.data,
                            longTermAssumptions: {
                              ...defaultLongTermAssumptions,
                              ...state.data.longTermAssumptions,
                              annualPropertyValueIncrease: value as number
                            }
                          }
                        })}
                        min={0}
                        max={10}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 3, label: '3%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Expected annual property value growth
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Selling Costs: {(state.data.longTermAssumptions?.sellingCostsPercentage || 6).toFixed(1)}%
                      </Typography>
                      <Slider
                        value={state.data.longTermAssumptions?.sellingCostsPercentage || 6}
                        onChange={(_, value) => onUpdate({
                          data: {
                            ...state.data,
                            longTermAssumptions: {
                              ...defaultLongTermAssumptions,
                              ...state.data.longTermAssumptions,
                              sellingCostsPercentage: value as number
                            }
                          }
                        })}
                        min={0}
                        max={10}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 6, label: '6%' },
                          { value: 8, label: '8%' },
                          { value: 10, label: '10%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Agent fees and closing costs when selling
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Operating Reserves */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  💰 Operating Reserves (Optional - If not using actual costs)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Maintenance Reserve"
                      type="number"
                      value={state.data.maintenanceCost || ''}
                      onChange={(e) => onUpdate({
                        data: {
                          ...state.data,
                          maintenanceCost: parseFloat(e.target.value) || 0
                        }
                      })}
                      helperText="Annual maintenance and repairs budget (defaults to 1% of property value)"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        endAdornment: <InputAdornment position="end">/year</InputAdornment>
                      }}
                      inputProps={{ min: 0, step: 50 }}
                      placeholder={state.data.purchasePrice ? Math.round(state.data.purchasePrice * 0.01).toString() : "2000"}
                    />
                  </Grid>

                  {/* HOA Fees - TODO: Add to backend type first
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="HOA Fees (if applicable)"
                      type="number"
                      helperText="Monthly homeowners association fees (coming soon)"
                      disabled
                      placeholder="0"
                    />
                  </Grid>
                  */}
                </Grid>

                {/* FIX Issue #28: Validation warning for excessive maintenance */}
                {maintenancePercentOfRent > 15 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>High Maintenance Reserve:</strong> Your annual maintenance reserve (${state.data.maintenanceCost?.toLocaleString()}/year) equals{' '}
                    <strong>{maintenancePercentOfRent.toFixed(1)}%</strong> of monthly rent.
                    <br />
                    Industry standard is <strong>5-10% of monthly rent</strong> (${Math.round((state.data.monthlyRent || 0) * 0.05 * 12)}-${Math.round((state.data.monthlyRent || 0) * 0.10 * 12)}/year).
                    Consider reducing to avoid overstating expenses.
                  </Alert>
                )}
              </Box>

              {/* Economic Assumptions */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  📊 Economic Assumptions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Inflation Rate: {(state.data.longTermAssumptions?.inflationRate || 2.5).toFixed(1)}%
                      </Typography>
                      <Slider
                        value={state.data.longTermAssumptions?.inflationRate || 2.5}
                        onChange={(_, value) => onUpdate({
                          data: {
                            ...state.data,
                            longTermAssumptions: {
                              ...defaultLongTermAssumptions,
                              ...state.data.longTermAssumptions,
                              inflationRate: value as number
                            }
                          }
                        })}
                        min={0}
                        max={10}
                        step={0.5}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 2.5, label: '2.5%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Expected annual inflation for expenses
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Turnover Frequency"
                      type="number"
                      value={state.data.longTermAssumptions?.turnoverFrequency || 2}
                      onChange={(e) => onUpdate({
                        data: {
                          ...state.data,
                          longTermAssumptions: {
                            ...defaultLongTermAssumptions,
                            ...state.data.longTermAssumptions,
                            turnoverFrequency: parseFloat(e.target.value) || 2
                          }
                        }
                      })}
                      helperText="Years between tenant turnovers"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">years</InputAdornment>
                      }}
                      inputProps={{ min: 1, max: 10, step: 0.5 }}
                      placeholder="2"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </TapToExpandField>
        </Box>

        {/* Metrics Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <Assessment sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Price-to-Rent Ratio
                </Typography>
                <Typography variant="h4">
                  {priceToRentRatio || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {priceToRentRatio > 0 && priceToRentRatio < 15 && 'Good for rental'}
                  {priceToRentRatio >= 15 && priceToRentRatio < 20 && 'Moderate'}
                  {priceToRentRatio >= 20 && 'Consider carefully'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  <TrendingUp sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Gross Rental Yield
                </Typography>
                <Typography variant="h4">
                  {grossRentalYield}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Annual rent / Purchase price
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Information Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary">
              <Home sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Rental Strategy Tips
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Price-to-rent ratios below 15 typically favor renting out the property. 
              Management fees typically range from 8-10% for single-family homes. 
              Budget for 5-10% vacancy rate depending on your market conditions.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default RentalStep;