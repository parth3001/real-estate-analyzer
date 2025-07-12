/**
 * AddressStep - Step 1 of Property Wizard
 * Handles property address input and basic property details
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  GridLegacy as Grid,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  LocationOn,
  Search,
  AutoAwesome,
  Home,
  SquareFoot,
  CalendarMonth
} from '@mui/icons-material';

import WizardStep from './WizardStep';
import type { WizardStepProps, DataConfidence } from './wizardTypes';
import { wizardApi, type WizardPropertyLookupRequest } from '../../services/api';
import type { PropertyAddress } from '../../types/property';

const AddressStep: React.FC<WizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [propertyFound, setPropertyFound] = useState(false);

  // Handle address field changes
  const handleAddressChange = (field: keyof PropertyAddress, value: string) => {
    onUpdate({
      data: {
        ...state.data,
        propertyAddress: {
          street: state.data.propertyAddress?.street || '',
          city: state.data.propertyAddress?.city || '',
          state: state.data.propertyAddress?.state || '',
          zipCode: state.data.propertyAddress?.zipCode || '',
          ...state.data.propertyAddress,
          [field]: value
        }
      }
    });
  };

  // Handle property details changes
  const handlePropertyChange = (field: string, value: number | string) => {
    onUpdate({
      data: {
        ...state.data,
        [field]: value
      }
    });
  };

  // Real property lookup using enhanced RentCast API (Phase 2)
  const handlePropertyLookup = async () => {
    const address = state.data.propertyAddress;
    
    if (!address || !address.street || !address.city || !address.state) {
      return;
    }

    setIsLookingUp(true);
    setLookupAttempted(true);

    try {
      // Format address for API call
      const formattedAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode || ''}`.trim();
      
      console.log('AddressStep: Starting real property lookup for:', formattedAddress);

      // Call the wizard API with enhanced RentCast backend
      const lookupRequest: WizardPropertyLookupRequest = {
        address: formattedAddress,
        includeComparables: true,
        includeMarketData: true
      };

      const response = await wizardApi.lookupProperty(lookupRequest);

      if (response.data.success && response.data.propertyDetails) {
        const propertyDetails = response.data.propertyDetails;
        
        console.log('AddressStep: Real property lookup successful:', {
          squareFootage: propertyDetails.squareFootage,
          bedrooms: propertyDetails.bedrooms,
          bathrooms: propertyDetails.bathrooms,
          yearBuilt: propertyDetails.yearBuilt,
          dataSource: 'RentCast Enhanced'
        });

        // Transform API response to match our state structure
        const transformedData: Record<string, any> = {};
        
        if (propertyDetails.squareFootage) {
          transformedData.squareFootage = {
            value: propertyDetails.squareFootage,
            confidence: propertyDetails.dataConfidence?.squareFootage || {
              score: 85,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          };
        }

        if (propertyDetails.bedrooms) {
          transformedData.bedrooms = {
            value: propertyDetails.bedrooms,
            confidence: propertyDetails.dataConfidence?.bedrooms || {
              score: 85,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          };
        }

        if (propertyDetails.bathrooms) {
          transformedData.bathrooms = {
            value: propertyDetails.bathrooms,
            confidence: propertyDetails.dataConfidence?.bathrooms || {
              score: 85,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          };
        }

        if (propertyDetails.yearBuilt) {
          transformedData.yearBuilt = {
            value: propertyDetails.yearBuilt,
            confidence: propertyDetails.dataConfidence?.yearBuilt || {
              score: 90,
              source: 'RentCast Enhanced',
              lastUpdated: new Date(),
              reliability: 'high' as const
            }
          };
        }

        // Update state with real auto-populated data from RentCast
        onUpdate({
          data: {
            ...state.data,
            squareFootage: transformedData.squareFootage?.value || state.data.squareFootage,
            bedrooms: transformedData.bedrooms?.value || state.data.bedrooms,
            bathrooms: transformedData.bathrooms?.value || state.data.bathrooms,
            yearBuilt: transformedData.yearBuilt?.value || state.data.yearBuilt
          },
          autoPopulated: {
            ...state.autoPopulated,
            ...transformedData
          }
        });

        setPropertyFound(true);
        
        console.log('AddressStep: Property data updated successfully with real RentCast data');
      } else {
        console.warn('AddressStep: No property found in RentCast database');
        onUpdate({
          apiErrors: [...state.apiErrors, 'Property not found in database. Please enter details manually.']
        });
      }
    } catch (error) {
      console.error('AddressStep: Real property lookup failed:', error);
      onUpdate({
        apiErrors: [...state.apiErrors, 'Property lookup failed. Please enter details manually.']
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Auto-trigger lookup when address is complete
  useEffect(() => {
    const address = state.data.propertyAddress;
    if (address && address.street && address.city && address.state && !lookupAttempted && !isLookingUp) {
      // Small delay to avoid excessive API calls
      const timer = setTimeout(() => {
        handlePropertyLookup();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.data.propertyAddress, lookupAttempted, isLookingUp]);

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};
    
    if (state.autoPopulated.squareFootage?.confidence) {
      confidence.squareFootage = state.autoPopulated.squareFootage.confidence;
    }
    if (state.autoPopulated.bedrooms?.confidence) {
      confidence.bedrooms = state.autoPopulated.bedrooms.confidence;
    }
    if (state.autoPopulated.bathrooms?.confidence) {
      confidence.bathrooms = state.autoPopulated.bathrooms.confidence;
    }
    if (state.autoPopulated.yearBuilt?.confidence) {
      confidence.yearBuilt = state.autoPopulated.yearBuilt.confidence;
    }
    
    return confidence;
  };

  const autoPopulatedFields = Object.keys(state.autoPopulated).filter(field => 
    ['squareFootage', 'bedrooms', 'bathrooms', 'yearBuilt'].includes(field)
  );

  return (
    <WizardStep
      title="Property Address & Details"
      description="Enter the property address to automatically look up property details"
      validation={validation}
      isLoading={isLookingUp}
      dataConfidence={getStepConfidence()}
      autoPopulatedFields={autoPopulatedFields}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Address Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Property Address
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={state.data.propertyAddress?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                error={!!validation.errors['propertyAddress.street']}
                helperText={validation.errors['propertyAddress.street']}
                placeholder="123 Main Street"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={state.data.propertyAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                error={!!validation.errors['propertyAddress.city']}
                helperText={validation.errors['propertyAddress.city']}
                placeholder="Austin"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="State"
                value={state.data.propertyAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                error={!!validation.errors['propertyAddress.state']}
                helperText={validation.errors['propertyAddress.state']}
                placeholder="TX"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={state.data.propertyAddress?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                error={!!validation.errors['propertyAddress.zipCode']}
                helperText={validation.errors['propertyAddress.zipCode']}
                placeholder="78701"
              />
            </Grid>
          </Grid>

          {/* Manual Lookup Button */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handlePropertyLookup}
              disabled={isLookingUp || !state.data.propertyAddress?.street}
              startIcon={isLookingUp ? <CircularProgress size={20} /> : <Search />}
            >
              {isLookingUp ? 'Looking up...' : 'Look up Property'}
            </Button>
          </Box>
        </Box>

        {/* Property Details Section */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            Property Details
            {propertyFound && (
              <Chip
                label="Auto-populated"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Typography>

          {propertyFound && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Great! We found your property and auto-populated the details below. You can modify any field if needed.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Square Footage"
                type="number"
                value={state.data.squareFootage || ''}
                onChange={(e) => handlePropertyChange('squareFootage', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SquareFoot />
                    </InputAdornment>
                  ),
                  endAdornment: state.autoPopulated.squareFootage?.confidence && (
                    <InputAdornment position="end">
                      <Chip
                        label={`${state.autoPopulated.squareFootage.confidence.score}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </InputAdornment>
                  )
                }}
                placeholder="1847"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Bedrooms"
                type="number"
                value={state.data.bedrooms || ''}
                onChange={(e) => handlePropertyChange('bedrooms', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 20 }}
                placeholder="3"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Bathrooms"
                type="number"
                value={state.data.bathrooms || ''}
                onChange={(e) => handlePropertyChange('bathrooms', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, max: 20, step: 0.5 }}
                placeholder="2"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year Built"
                type="number"
                value={state.data.yearBuilt || ''}
                onChange={(e) => handlePropertyChange('yearBuilt', parseInt(e.target.value) || 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth />
                    </InputAdornment>
                  )
                }}
                inputProps={{ 
                  min: 1800, 
                  max: new Date().getFullYear() + 1 
                }}
                placeholder="2018"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Name (Optional)"
                value={state.data.propertyName || ''}
                onChange={(e) => handlePropertyChange('propertyName', e.target.value)}
                placeholder="My Investment Property"
                helperText="Friendly name for this property"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Information Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom color="primary">
              💡 Smart Data Population
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phase 2: We now use real RentCast API data to automatically populate property details.
              This leverages comprehensive property databases with cached results to provide accurate 
              property information while minimizing API costs.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default AddressStep;