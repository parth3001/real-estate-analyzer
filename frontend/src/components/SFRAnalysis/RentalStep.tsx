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
  LinearProgress
} from '@mui/material';
import {
  Home,
  AttachMoney,
  BusinessCenter,
  TrendingUp,
  Assessment,
  AutoAwesome,
  CompareArrows
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';

const RentalStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [selfManage, setSelfManage] = useState(false);
  const [loadingRentEstimate, setLoadingRentEstimate] = useState(false);
  
  // Calculate price to rent ratio
  const priceToRentRatio = state.data.purchasePrice && state.data.monthlyRent ? 
    Math.round(state.data.purchasePrice / (state.data.monthlyRent * 12)) : 0;
  
  // Calculate gross rental yield
  const grossRentalYield = state.data.purchasePrice && state.data.monthlyRent ?
    ((state.data.monthlyRent * 12) / state.data.purchasePrice * 100).toFixed(2) : '0';

  // Mock rent estimate lookup (Phase 1)
  useEffect(() => {
    if (!state.autoPopulated.rentEstimate && state.data.propertyAddress?.zipCode && !loadingRentEstimate) {
      setLoadingRentEstimate(true);
      
      // Simulate API call for rent estimate
      setTimeout(() => {
        const baseRent = state.data.squareFootage ? state.data.squareFootage * 1.2 : 2200;
        const rentEstimate = Math.round(baseRent);
        
        onUpdate({
          data: {
            ...state.data,
            monthlyRent: state.data.monthlyRent || rentEstimate
          },
          autoPopulated: {
            ...state.autoPopulated,
            rentEstimate: {
              value: rentEstimate,
              confidence: {
                score: 88,
                source: 'Market Analysis (Mock)',
                lastUpdated: new Date(),
                reliability: 'high' as const
              },
              range: {
                low: Math.round(rentEstimate * 0.9),
                high: Math.round(rentEstimate * 1.1)
              }
            }
          }
        });
        
        setLoadingRentEstimate(false);
      }, 1500);
    }
  }, [state.data.propertyAddress?.zipCode, state.data.squareFootage]);

  // Handle self management toggle
  const handleSelfManageToggle = (checked: boolean) => {
    setSelfManage(checked);
    onUpdate({
      data: {
        ...state.data,
        propertyManagementRate: checked ? 0 : 8
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
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Management Fee: {state.data.propertyManagementRate || 8}% of rent
                  </Typography>
                  <Slider
                    value={state.data.propertyManagementRate || 8}
                    onChange={(_, value) => onUpdate({
                      data: { ...state.data, propertyManagementRate: value as number }
                    })}
                    min={5}
                    max={12}
                    step={0.5}
                    marks={[
                      { value: 5, label: '5%' },
                      { value: 8, label: '8%' },
                      { value: 10, label: '10%' },
                      { value: 12, label: '12%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Monthly cost: ${Math.round((state.data.monthlyRent || 0) * (state.data.propertyManagementRate || 8) / 100).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vacancy Rate: {state.data.vacancyRate || 5}%
                </Typography>
                <Slider
                  value={state.data.vacancyRate || 5}
                  onChange={(_, value) => onUpdate({
                    data: { ...state.data, vacancyRate: value as number }
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
                  Expected vacant days/year: {Math.round(365 * (state.data.vacancyRate || 5) / 100)}
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