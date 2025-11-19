/**
 * MFAddressStep - Step 1 of Multi-Family Property Wizard
 * Handles property address input and multi-family building details
 *
 * MF-Specific Fields:
 * - Total Units (instead of bedrooms/bathrooms)
 * - Building Type selector (GARDEN, MID_RISE, HIGH_RISE, etc.)
 * - Total Square Footage (entire building)
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  GridLegacy as Grid,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  LocationOn,
  Search,
  AutoAwesome,
  Home,
  SquareFoot,
  CalendarMonth,
  Apartment,
  Business,
  Info,
  HelpOutline
} from '@mui/icons-material';

import WizardStep from '../SFRAnalysis/WizardStep';
import type { MFWizardStepProps, DataConfidence, MFWizardPropertyAddress } from './mfWizardTypes';
import { wizardApi, type WizardPropertyLookupRequest } from '../../services/api';
import { useAPIDebounce } from '../../hooks/useDebounce';

/**
 * Building Type Options for Multi-Family Properties (Phase 1: Commercial MF 5+ Units)
 *
 * Phase 1 focuses on commercial multi-family properties (5+ units) with three building types:
 * - GARDEN: Most common (60% of market), 2-3 stories, outdoor corridors, no elevator
 * - MID_RISE: Institutional grade, 4-9 stories, elevator required, structured parking
 * - COMPLEX: Multi-building campus, shared amenities, professional management
 *
 * Building type affects operating expenses and cap rate targets.
 */
const BUILDING_TYPES = [
  {
    value: 'GARDEN',
    label: 'Garden Style',
    description: '2-3 stories, outdoor corridors, surface parking, no elevator',
    details: 'Most common (60% of market). Operating expenses: $250-400/unit/month. Best for first-time multi-family investors and value-add opportunities.',
    icon: '🏘️'
  },
  {
    value: 'MID_RISE',
    label: 'Mid-Rise with Elevator',
    description: '4-9 stories, elevator required, structured parking, central HVAC',
    details: 'Institutional grade (25% of market). Operating expenses: $450-700/unit/month. Cap rate premium: -150 bps due to institutional appeal.',
    icon: '🏢'
  },
  {
    value: 'COMPLEX',
    label: 'Multi-Building Complex',
    description: 'Multiple garden-style buildings, shared amenities (pool, clubhouse), large campus',
    details: 'Campus-style developments (15% of market). Operating expenses: $300-500/unit/month. Suitable for investors seeking scale.',
    icon: '🏘️'
  }
] as const;

const MFAddressStep: React.FC<MFWizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  const [, setLookupAttempted] = useState(false);
  const [propertyFound, setPropertyFound] = useState(false);
  const [show24UnitWarning, setShow24UnitWarning] = useState(false);

  // Extracted API logic for debounced calls
  const handlePropertyLookupAPI = async (address: MFWizardPropertyAddress) => {
    if (!address || !address.street || !address.city || !address.state) {
      throw new Error('Incomplete address for lookup');
    }

    setLookupAttempted(true);

    // Format address for API call
    const formattedAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode || ''}`.trim();

    console.log('MFAddressStep: Starting debounced property lookup for:', formattedAddress);

    // Call the wizard API with enhanced RentCast backend
    const lookupRequest: WizardPropertyLookupRequest = {
      address: formattedAddress,
      includeComparables: true,
      includeMarketData: true
    };

    const response = await wizardApi.lookupProperty(lookupRequest);

    if (response.data.success && response.data.propertyDetails) {
      const propertyDetails = response.data.propertyDetails;

      console.log('MFAddressStep: Property lookup successful:', {
        totalUnits: propertyDetails.totalUnits,
        totalSqft: propertyDetails.totalSqft,
        buildingType: propertyDetails.buildingType,
        yearBuilt: propertyDetails.yearBuilt,
        dataSource: 'RentCast Enhanced'
      });

      // Auto-populate property data with API results
      const updatedSmartDefaults: Record<string, any> = {};

      if (propertyDetails.totalSqft) {
        updatedSmartDefaults.totalSqft = {
          value: propertyDetails.totalSqft,
          confidence: {
            score: 85,
            source: 'RentCast Enhanced',
            lastUpdated: new Date(),
            reliability: 'high' as const
          }
        };
      }

      if (propertyDetails.totalUnits) {
        updatedSmartDefaults.totalUnits = {
          value: propertyDetails.totalUnits,
          confidence: {
            score: 90,
            source: 'RentCast Enhanced',
            lastUpdated: new Date(),
            reliability: 'high' as const
          }
        };
      }

      if (propertyDetails.buildingType) {
        updatedSmartDefaults.buildingType = {
          value: propertyDetails.buildingType,
          confidence: {
            score: 75,
            source: 'RentCast Enhanced',
            lastUpdated: new Date(),
            reliability: 'medium' as const
          }
        };
      }

      if (propertyDetails.yearBuilt) {
        updatedSmartDefaults.yearBuilt = {
          value: propertyDetails.yearBuilt,
          confidence: {
            score: 90,
            source: 'RentCast Enhanced',
            lastUpdated: new Date(),
            reliability: 'high' as const
          }
        };
      }

      // Update the wizard state with both smart defaults and actual data values
      onUpdate({
        data: {
          ...state.data,
          totalUnits: propertyDetails.totalUnits || state.data.totalUnits,
          totalSqft: propertyDetails.totalSqft || state.data.totalSqft,
          buildingType: propertyDetails.buildingType || state.data.buildingType,
          yearBuilt: propertyDetails.yearBuilt || state.data.yearBuilt
        },
        smartDefaults: {
          ...state.smartDefaults,
          ...updatedSmartDefaults
        }
      });

      setPropertyFound(true);
      console.log('MFAddressStep: Auto-populated multi-family property details from API');

      return response.data;
    } else {
      console.log('MFAddressStep: Property lookup returned no results');
      setPropertyFound(false);
      throw new Error('Property not found');
    }
  };

  // Debounced API call for property lookup
  const {
    execute: debouncedPropertyLookup,
    isLoading: isLookingUp,
    cancel: cancelLookup
  } = useAPIDebounce(handlePropertyLookupAPI, {
    delay: 1500, // Wait 1.5s after user stops typing
    retryAttempts: 2,
    retryDelay: 1000
  });

  // Handle address field changes with auto-lookup
  const handleAddressChange = (field: keyof MFWizardPropertyAddress, value: string) => {
    const updatedAddress = {
      street: state.data.propertyAddress?.street || '',
      city: state.data.propertyAddress?.city || '',
      state: state.data.propertyAddress?.state || '',
      zipCode: state.data.propertyAddress?.zipCode || '',
      ...state.data.propertyAddress,
      [field]: value
    };

    onUpdate({
      data: {
        ...state.data,
        propertyAddress: updatedAddress
      }
    });

    // Trigger auto-lookup if address is complete enough
    if (isAddressCompleteForLookup(updatedAddress)) {
      console.log('MFAddressStep: Address complete, triggering auto-lookup...');
      debouncedPropertyLookup(updatedAddress);
    } else {
      // Cancel pending lookup if address becomes incomplete
      cancelLookup();
    }
  };

  // Check if address is complete enough for property lookup
  const isAddressCompleteForLookup = (address: MFWizardPropertyAddress) => {
    return !!(address.street && address.city && address.state &&
              address.street.length > 5 && address.city.length > 2);
  };

  // Handle property details changes
  const handlePropertyChange = (field: string, value: number | string) => {
    onUpdate({
      data: {
        ...state.data,
        [field]: value
      }
    });

    // Step 8-10: Show warning for 2-4 unit properties
    if (field === 'totalUnits') {
      const units = typeof value === 'number' ? value : parseInt(value as string);
      if (!isNaN(units) && units >= 2 && units <= 4) {
        setShow24UnitWarning(true);
      } else {
        setShow24UnitWarning(false);
      }
    }
  };

  // Manual property lookup (immediate, not debounced)
  const handleManualPropertyLookup = async () => {
    const address = state.data.propertyAddress;
    if (!address || !isAddressCompleteForLookup(address)) {
      console.warn('MFAddressStep: Cannot perform manual lookup - incomplete address');
      return;
    }

    try {
      await handlePropertyLookupAPI(address);
    } catch (error) {
      console.error('MFAddressStep: Manual lookup failed:', error);
    }
  };

  // Get data confidence for this step
  const getStepConfidence = (): Record<string, DataConfidence> => {
    const confidence: Record<string, DataConfidence> = {};

    if (state.autoPopulated.totalSqft?.confidence) {
      confidence.totalSqft = state.autoPopulated.totalSqft.confidence;
    }
    if (state.autoPopulated.totalUnits?.confidence) {
      confidence.totalUnits = state.autoPopulated.totalUnits.confidence;
    }
    if (state.autoPopulated.buildingType?.confidence) {
      confidence.buildingType = state.autoPopulated.buildingType.confidence;
    }
    if (state.autoPopulated.yearBuilt?.confidence) {
      confidence.yearBuilt = state.autoPopulated.yearBuilt.confidence;
    }

    return confidence;
  };

  const autoPopulatedFields = Object.keys(state.autoPopulated).filter(field =>
    ['totalSqft', 'totalUnits', 'buildingType', 'yearBuilt'].includes(field)
  );

  return (
    <WizardStep
      title="Multi-Family Property Address & Details"
      description="Enter the property address to automatically look up building details"
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
                placeholder="123 Oak Street"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Apartment />
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
              onClick={handleManualPropertyLookup}
              disabled={isLookingUp || !state.data.propertyAddress?.street}
              startIcon={isLookingUp ? <CircularProgress size={20} /> : <Search />}
            >
              {isLookingUp ? 'Looking up...' : 'Look up Property'}
            </Button>
          </Box>
        </Box>

        {/* Building Details Section - MF Specific */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            Building Details
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
              Great! We found your multi-family property and auto-populated the details below. You can modify any field if needed.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Total Units - MF Specific */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Units"
                type="number"
                value={state.data.totalUnits || ''}
                onChange={(e) => handlePropertyChange('totalUnits', parseInt(e.target.value) || 0)}
                error={!!validation.errors['totalUnits']}
                helperText={validation.errors['totalUnits'] || 'Total number of rental units in the property'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home />
                    </InputAdornment>
                  ),
                  endAdornment: state.autoPopulated.totalUnits?.confidence && (
                    <InputAdornment position="end">
                      <Chip
                        label={`${state.autoPopulated.totalUnits.confidence.score}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </InputAdornment>
                  )
                }}
                inputProps={{ min: 2, max: 1000 }}
                placeholder="8"
              />
            </Grid>

            {/* Total Square Footage - MF Specific */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Square Footage"
                type="number"
                value={state.data.totalSqft || ''}
                onChange={(e) => handlePropertyChange('totalSqft', parseInt(e.target.value) || 0)}
                error={!!validation.errors['totalSqft']}
                helperText={validation.errors['totalSqft'] || 'Total building square footage'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SquareFoot />
                    </InputAdornment>
                  ),
                  endAdornment: state.autoPopulated.totalSqft?.confidence && (
                    <InputAdornment position="end">
                      <Chip
                        label={`${state.autoPopulated.totalSqft.confidence.score}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </InputAdornment>
                  )
                }}
                placeholder="6400"
              />
            </Grid>

            {/* Building Type - MF Specific */}
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                error={!!validation.errors['buildingType']}
              >
                <InputLabel id="building-type-label">
                  Building Type (Phase 1: 5+ Units)
                </InputLabel>
                <Select
                  labelId="building-type-label"
                  value={state.data.buildingType || ''}
                  onChange={(e) => handlePropertyChange('buildingType', e.target.value)}
                  label="Building Type (Phase 1: 5+ Units)"
                  startAdornment={
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end" sx={{ mr: 3 }}>
                      <Tooltip
                        title={
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Building Type Affects:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              • Operating Expenses: $250-700/unit/month range
                            </Typography>
                            <Typography variant="body2" paragraph>
                              • Cap Rate Targets: Mid-rise gets -150 bps premium
                            </Typography>
                            <Typography variant="body2">
                              💡 Not sure? Select GARDEN (most common).
                            </Typography>
                          </Box>
                        }
                        arrow
                        placement="left"
                      >
                        <IconButton size="small" sx={{ p: 0 }}>
                          <HelpOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  }
                >
                  {BUILDING_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '1.2em' }}>{type.icon}</span>
                          <Typography variant="body1" fontWeight="medium">
                            {type.label}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {validation.errors['buildingType'] || (
                    state.data.buildingType
                      ? BUILDING_TYPES.find(t => t.value === state.data.buildingType)?.details || 'Building type selected'
                      : 'Affects operating expenses and cap rate targets'
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* Year Built */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year Built"
                type="number"
                value={state.data.yearBuilt || ''}
                onChange={(e) => handlePropertyChange('yearBuilt', parseInt(e.target.value) || 0)}
                error={!!validation.errors['yearBuilt']}
                helperText={validation.errors['yearBuilt']}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth />
                    </InputAdornment>
                  ),
                  endAdornment: state.autoPopulated.yearBuilt?.confidence && (
                    <InputAdornment position="end">
                      <Chip
                        label={`${state.autoPopulated.yearBuilt.confidence.score}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </InputAdornment>
                  )
                }}
                inputProps={{
                  min: 1800,
                  max: new Date().getFullYear() + 1
                }}
                placeholder="2015"
              />
            </Grid>

            {/* Property Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Name (Optional)"
                value={state.data.propertyName || ''}
                onChange={(e) => handlePropertyChange('propertyName', e.target.value)}
                placeholder="Oak Street Apartments"
                helperText="Friendly name for this multi-family property"
              />
            </Grid>
          </Grid>

          {/* Step 8-10: 2-4 Unit Warning Alert */}
          {show24UnitWarning && (
            <Alert
              severity="warning"
              sx={{ mt: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => window.location.href = '/sfr-analysis'}
                  variant="outlined"
                >
                  Use SFR Analyzer
                </Button>
              }
            >
              <AlertTitle>2-4 Unit Property Detected</AlertTitle>
              For properties with 2-4 units, we recommend using the <strong>SFR Analyzer</strong>.
              It's optimized for residential financing (FHA, conventional loans) with better accuracy for small multi-family properties.
              The MF Analyzer is designed for commercial financing (5+ units).
            </Alert>
          )}
        </Box>

        {/* Information Card - Phase 1 Guidance */}
        <Card variant="outlined" sx={{ backgroundColor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
              <Info color="primary" />
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                Phase 1: Commercial Multi-Family (5+ Units)
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>✅ Use this analyzer for:</strong> Commercial multi-family properties with <strong>5-32 units</strong> (garden-style, mid-rise, or multi-building complexes).
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>❌ For 2-4 unit properties:</strong> Please use the <strong>SFR Analyzer</strong> instead. Small multi-family properties (2-4 units) qualify for <em>residential financing</em> with different metrics and assumptions.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              💡 <strong>Auto-Population:</strong> We'll automatically look up building details as you type the address. You can override any auto-populated values if needed.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </WizardStep>
  );
};

export default MFAddressStep;
