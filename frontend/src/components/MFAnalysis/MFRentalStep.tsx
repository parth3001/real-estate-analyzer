/**
 * MFRentalStep - Step 3 of Multi-Family Property Wizard
 * Unit Configuration: Unit types, rents, common area utilities, maintenance
 *
 * MF-Specific Features:
 * - Template-based unit type entry (2BR/1BA, 1BR/1BA, Studio, etc.)
 * - Market rent suggestions (if RentCast data available)
 * - Common area utilities (electric, water, gas, trash)
 * - Per-unit maintenance budgeting
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Apartment,
  Add,
  Delete,
  Info,
  AutoAwesome,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';

import WizardStep from '../SFRAnalysis/WizardStep';
import type { MFWizardStepProps } from './mfWizardTypes';
import type { UnitType, CommonAreaUtilities } from '../../types/property';
import { tokenUtils } from '../../services/api';

const MFRentalStep: React.FC<MFWizardStepProps> = ({
  state,
  onUpdate,
  validation
}) => {
  // Unit Types Management
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(
    state.data.unitTypes && state.data.unitTypes.length > 0
      ? state.data.unitTypes
      : [
          { type: '2BR/1BA', count: 0, sqft: 850, monthlyRent: 0 },
          { type: '1BR/1BA', count: 0, sqft: 650, monthlyRent: 0 }
        ]
  );

  // Common Area Utilities
  const [utilities, setUtilities] = useState<CommonAreaUtilities>(
    state.data.commonAreaUtilities || {
      electric: 0,
      water: 0,
      gas: 0,
      trash: 0
    }
  );

  // Maintenance
  const [maintenanceCostPerUnit, setMaintenanceCostPerUnit] = useState<number>(
    state.data.maintenanceCostPerUnit || 100
  );

  // Auto-populate state (Story 3.1)
  const [isLoadingRents, setIsLoadingRents] = useState(false);
  const [autoPopulateResults, setAutoPopulateResults] = useState<{
    success: boolean;
    message: string;
    unitsUpdated: number;
  } | null>(null);

  // Update parent state when data changes
  useEffect(() => {
    // Only update if we have at least one unit type with count > 0
    const validUnitTypes = unitTypes.filter(ut => ut.count > 0);

    onUpdate({
      data: {
        ...state.data,
        unitTypes: validUnitTypes.length > 0 ? validUnitTypes : unitTypes,
        commonAreaUtilities: utilities,
        maintenanceCostPerUnit
      }
    });
  }, [unitTypes, utilities, maintenanceCostPerUnit]);

  // Add new unit type
  const handleAddUnitType = () => {
    setUnitTypes([
      ...unitTypes,
      { type: 'Studio', count: 0, sqft: 500, monthlyRent: 0 }
    ]);
  };

  // Remove unit type
  const handleRemoveUnitType = (index: number) => {
    if (unitTypes.length > 1) {
      setUnitTypes(unitTypes.filter((_, i) => i !== index));
    }
  };

  // Update unit type field
  const handleUnitTypeChange = (index: number, field: keyof UnitType, value: string | number) => {
    const newUnitTypes = [...unitTypes];
    newUnitTypes[index] = {
      ...newUnitTypes[index],
      [field]: field === 'type' ? value : Number(value) || 0
    };
    setUnitTypes(newUnitTypes);
  };

  /**
   * Auto-populate unit rents using RentCast API (Story 3.1)
   */
  const handleAutoPopulateRents = async () => {
    setIsLoadingRents(true);
    setAutoPopulateResults(null);

    try {
      // Build full address from wizard state
      const address = `${state.data.propertyAddress.street}, ${state.data.propertyAddress.city}, ${state.data.propertyAddress.state} ${state.data.propertyAddress.zipCode}`;

      // Extract bedroom/bathroom from unit type string (e.g., "2BR/1BA" → 2 bedrooms, 1 bathroom)
      const parseUnitType = (type: string): { bedrooms: number; bathrooms: number } => {
        const brMatch = type.match(/(\d+)BR/i);
        const baMatch = type.match(/(\d+)BA/i);
        return {
          bedrooms: brMatch ? parseInt(brMatch[1]) : 2,
          bathrooms: baMatch ? parseInt(baMatch[1]) : 1
        };
      };

      // Build units array for API request
      const units = unitTypes.map(ut => {
        const { bedrooms, bathrooms } = parseUnitType(ut.type);
        return {
          bedrooms,
          bathrooms,
          squareFootage: ut.sqft || 850
        };
      });

      // Get auth token
      const token = tokenUtils.getAccessToken();
      if (!token) {
        throw new Error('Access token required');
      }

      // Call backend API
      const response = await fetch('/api/market-data/mf-unit-rents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address, units })
      });

      const data = await response.json();

      if (response.ok && data.success && data.estimates) {
        // Update unit rents with estimates
        const updatedUnits = unitTypes.map(ut => {
          const { bedrooms, bathrooms } = parseUnitType(ut.type);
          const configKey = `${bedrooms}BR_${bathrooms}BA_${ut.sqft || 850}sqft`;
          const estimate = data.estimates[configKey];

          if (estimate && estimate.rentEstimate) {
            // Issue #6: Store market rent separately from current rent
            // This allows users to override monthlyRent while preserving RentCast data
            return {
              ...ut,
              monthlyRent: ut.monthlyRent || Math.round(estimate.rentEstimate), // Keep current if already set
              marketRent: Math.round(estimate.rentEstimate) // Always update with RentCast data
            };
          }
          return ut;
        });

        setUnitTypes(updatedUnits);
        setAutoPopulateResults({
          success: true,
          message: `Updated ${data.unitsUpdated} unit type${data.unitsUpdated !== 1 ? 's' : ''} with market rent estimates`,
          unitsUpdated: data.unitsUpdated
        });
      } else {
        throw new Error(data.error || 'Failed to fetch rent estimates');
      }
    } catch (error) {
      console.error('Error auto-populating rents:', error);
      setAutoPopulateResults({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch rent estimates. Please try again.',
        unitsUpdated: 0
      });
    } finally {
      setIsLoadingRents(false);
    }
  };

  // Calculate total units from unit types
  const totalUnitsEntered = unitTypes.reduce((sum, ut) => sum + ut.count, 0);
  const expectedTotalUnits = state.data.totalUnits || 0;
  const unitCountMismatch = expectedTotalUnits > 0 && totalUnitsEntered !== expectedTotalUnits;

  // Calculate total monthly rent
  const totalMonthlyRent = unitTypes.reduce((sum, ut) => sum + (ut.count * ut.monthlyRent), 0);
  const averageRentPerUnit = totalUnitsEntered > 0 ? totalMonthlyRent / totalUnitsEntered : 0;

  // Calculate total utilities
  const totalMonthlyUtilities = utilities.electric + utilities.water + utilities.gas + utilities.trash;

  return (
    <WizardStep
      title="Unit Configuration"
      description="Configure unit types, rental income, and operating expenses"
      validation={validation}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Unit Count Validation Alert */}
        {unitCountMismatch && (
          <Alert severity="warning">
            <Typography variant="body2">
              Total units entered ({totalUnitsEntered}) doesn't match property total ({expectedTotalUnits}).
              Please adjust unit counts below.
            </Typography>
          </Alert>
        )}

        {/* Unit Types Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Apartment color="primary" />
              Unit Types & Rents
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleAutoPopulateRents}
                disabled={isLoadingRents || unitTypes.length === 0}
                startIcon={isLoadingRents ? <CircularProgress size={20} /> : <AutoAwesome />}
                size="small"
              >
                {isLoadingRents ? 'Fetching Market Rents...' : 'Auto-Populate Rents'}
              </Button>
              <Button
                startIcon={<Add />}
                onClick={handleAddUnitType}
                variant="outlined"
                size="small"
              >
                Add Unit Type
              </Button>
            </Box>
          </Box>

          {/* Auto-populate feedback */}
          {autoPopulateResults && (
            <Alert
              severity={autoPopulateResults.success ? 'success' : 'error'}
              sx={{ mb: 2 }}
              onClose={() => setAutoPopulateResults(null)}
            >
              {autoPopulateResults.message}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Unit Type</TableCell>
                  <TableCell align="center">Count</TableCell>
                  <TableCell align="right">Sqft/Unit</TableCell>
                  <TableCell align="right">Monthly Rent</TableCell>
                  <TableCell align="right">Total Rent</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unitTypes.map((unitType, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        value={unitType.type}
                        onChange={(e) => handleUnitTypeChange(index, 'type', e.target.value)}
                        placeholder="2BR/1BA"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={unitType.count || ''}
                        onChange={(e) => handleUnitTypeChange(index, 'count', e.target.value)}
                        size="small"
                        inputProps={{ min: 0, max: 100 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={unitType.sqft || ''}
                        onChange={(e) => handleUnitTypeChange(index, 'sqft', e.target.value)}
                        size="small"
                        inputProps={{ min: 0 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={unitType.monthlyRent || ''}
                        onChange={(e) => handleUnitTypeChange(index, 'monthlyRent', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${(unitType.count * unitType.monthlyRent).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleRemoveUnitType(index)}
                        disabled={unitTypes.length === 1}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Rental Summary */}
          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Total Units</Typography>
                  <Typography variant="h6">
                    {totalUnitsEntered}
                    {unitCountMismatch && <Chip label="Mismatch" size="small" color="warning" sx={{ ml: 1 }} />}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Potential Gross Income</Typography>
                  <Typography variant="h6" color="primary.main">
                    ${totalMonthlyRent.toLocaleString()}/mo
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    (100% occupancy)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Average Rent/Unit</Typography>
                  <Typography variant="h6">
                    ${averageRentPerUnit.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Vacancy Guidance Alert */}
          <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={500} gutterBottom>
              Vacancy & Credit Loss
            </Typography>
            <Typography variant="caption">
              Income above assumes 100% occupancy. Industry standard: Apply 5-10% vacancy + 2% credit loss in analysis assumptions
              (matches Fannie Mae/Freddie Mac underwriting). You'll set these rates in the Assumptions step.
            </Typography>
          </Alert>
        </Box>

        <Divider />

        {/* Common Area Utilities */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" />
            Common Area Utilities (Monthly)
            <Tooltip title="Utilities for hallways, lobbies, parking lots, landscaping, etc.">
              <Info fontSize="small" color="action" />
            </Tooltip>
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Electric"
                type="number"
                value={utilities.electric || ''}
                onChange={(e) => setUtilities({ ...utilities, electric: Number(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="200"
                helperText="Common area lighting, hallways"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Water/Sewer"
                type="number"
                value={utilities.water || ''}
                onChange={(e) => setUtilities({ ...utilities, water: Number(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="150"
                helperText="Landscaping, common areas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Gas"
                type="number"
                value={utilities.gas || ''}
                onChange={(e) => setUtilities({ ...utilities, gas: Number(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="100"
                helperText="Heating common areas (if applicable)"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Trash"
                type="number"
                value={utilities.trash || ''}
                onChange={(e) => setUtilities({ ...utilities, trash: Number(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="80"
                helperText="Dumpsters, bulk pickup"
              />
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Common Area Utilities</Typography>
              <Typography variant="h6">${totalMonthlyUtilities.toLocaleString()}/month</Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider />

        {/* Maintenance Budget */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="primary" />
            Maintenance Budget
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maintenance Cost Per Unit (Monthly)"
                type="number"
                value={maintenanceCostPerUnit || ''}
                onChange={(e) => setMaintenanceCostPerUnit(Number(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                placeholder="100"
                helperText="Typical range: $50-200/unit/month"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Monthly Maintenance</Typography>
                <Typography variant="h6">
                  ${(maintenanceCostPerUnit * totalUnitsEntered).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({totalUnitsEntered} units × ${maintenanceCostPerUnit})
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 <strong>Tip:</strong> Maintenance typically includes repairs, landscaping, snow removal, HVAC service,
              and preventive maintenance. Budget $50-100 for newer properties, $100-200 for older properties.
            </Typography>
          </Alert>
        </Box>

        {/* Validation Errors */}
        {validation.errors['unitTypes'] && (
          <Alert severity="error">
            {validation.errors['unitTypes']}
          </Alert>
        )}
      </Box>
    </WizardStep>
  );
};

export default MFRentalStep;
