import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import Grid from '@mui/system/Grid';
import { Close as CloseIcon, Home } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { propertyApi } from '../../services/api';

interface AddManualPropertyModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  onSuccess: () => void;
}

export const AddManualPropertyModal: React.FC<AddManualPropertyModalProps> = ({
  open,
  onClose,
  portfolioId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    propertyName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    purchasePrice: '',
    purchaseDate: '',
    monthlyRent: '',
    monthlyOperatingExpenses: '',
    mortgageBalance: '',
    currentEstimatedValue: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    yearBuilt: '',
    unitsDescription: '',
    propertyType: 'SFR',
    ownershipPercentage: '100',
    // MF specific fields
    totalUnits: '',
    totalSqft: '',
    commonAreaUtilities: {
      electric: '',
      water: '',
      gas: '',
      trash: ''
    }
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (field.startsWith('commonAreaUtilities.')) {
      const utilityField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        commonAreaUtilities: {
          ...prev.commonAreaUtilities,
          [utilityField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Basic validation
      if (!formData.propertyName.trim()) {
        setError('Property name is required');
        return;
      }

      if (!formData.address.street.trim() || !formData.address.city.trim() || !formData.address.state.trim()) {
        setError('Complete address is required');
        return;
      }

      if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
        setError('Valid purchase price is required');
        return;
      }

      if (!formData.purchaseDate) {
        setError('Purchase date is required');
        return;
      }

      if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
        setError('Valid monthly rent is required');
        return;
      }

      if (!formData.monthlyOperatingExpenses || Number(formData.monthlyOperatingExpenses) < 0) {
        setError('Valid monthly operating expenses is required (enter 0 if none)');
        return;
      }

      if (formData.mortgageBalance && Number(formData.mortgageBalance) < 0) {
        setError('Mortgage balance cannot be negative');
        return;
      }

      if (!formData.currentEstimatedValue || Number(formData.currentEstimatedValue) <= 0) {
        setError('Valid current estimated value is required');
        return;
      }

      // Create property data with all required fields for Deal schema and portfolio analytics
      const propertyData = {
        propertyName: formData.propertyName.trim(),
        propertyType: formData.propertyType,
        propertyAddress: formData.address,
        address: formData.address, // Also include flat address for compatibility
        purchasePrice: Number(formData.purchasePrice),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        squareFootage: formData.squareFootage ? Number(formData.squareFootage) : undefined,
        unitsDescription: formData.unitsDescription || undefined,
        portfolioId: portfolioId,
        
        // Portfolio Analytics - User Story P-1 fields
        purchaseDate: formData.purchaseDate,
        currentEstimatedValue: Number(formData.currentEstimatedValue),
        monthlyOperatingExpenses: Number(formData.monthlyOperatingExpenses),
        mortgageBalance: formData.mortgageBalance ? Number(formData.mortgageBalance) : 0,
        ownershipPercentage: Number(formData.ownershipPercentage) || 100,
        
        // Manual entry fields - NO DEFAULTS, use exactly what user provides
        downPayment: 0, // User should provide if they have a loan
        interestRate: 0, // User should provide if they have a loan
        loanTerm: 0, // User should provide if they have a loan
        propertyTaxRate: 0, // User should provide actual tax rate
        insuranceRate: 0, // User should provide actual insurance rate
        propertyManagementRate: 0, // User should provide if they have management
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : 0, // User input or 0
        
        // Use actual user inputs - the skinny calculator will use these exact values
        monthlyRent: Number(formData.monthlyRent),
        maintenanceCost: 0, // User should break this out from operating expenses if needed
        
        // Multi-family specific (if needed)
        maintenanceCostPerUnit: 0, // User should provide if applicable
        totalUnits: formData.totalUnits ? Number(formData.totalUnits) : undefined,
        totalSqft: formData.totalSqft ? Number(formData.totalSqft) : undefined,
        commonAreaUtilities: (formData.commonAreaUtilities.electric || formData.commonAreaUtilities.water || 
                             formData.commonAreaUtilities.gas || formData.commonAreaUtilities.trash) ? {
          electric: Number(formData.commonAreaUtilities.electric) || 0,
          water: Number(formData.commonAreaUtilities.water) || 0,
          gas: Number(formData.commonAreaUtilities.gas) || 0,
          trash: Number(formData.commonAreaUtilities.trash) || 0
        } : undefined,
        
        // Long term assumptions - zeros for manual entry (skinny calc doesn't use these)
        longTermAssumptions: {
          projectionYears: 0,
          annualRentIncrease: 0,
          annualPropertyValueIncrease: 0,
          sellingCostsPercentage: 0,
          inflationRate: 0,
          vacancyRate: 0,
          turnoverFrequency: 0,
          ...(formData.propertyType === 'MF' && {
            capitalExpenditureRate: 0,
            commonAreaMaintenanceRate: 0
          })
        },
        
        // Mark as manual entry (no analysis) - User Story P-1
        isManualEntry: true,
        isPortfolioProperty: true, // NEW: Flag to separate from deal pipeline
        source: 'PORTFOLIO_MANUAL_ENTRY', // NEW: Track source for filtering
        manualEntryData: {
          monthlyNetCashFlow: Number(formData.monthlyRent) - Number(formData.monthlyOperatingExpenses),
          currentEquity: Number(formData.currentEstimatedValue) - (formData.mortgageBalance ? Number(formData.mortgageBalance) : 0),
          purchaseAppreciation: Number(formData.currentEstimatedValue) - Number(formData.purchasePrice)
        },
        createdAt: new Date().toISOString()
      };

      // Create the property
      const response = await propertyApi.createProperty(propertyData);

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        onClose();
        
        // Reset form
        setFormData({
          propertyName: '',
          address: { street: '', city: '', state: '', zipCode: '' },
          purchasePrice: '',
          purchaseDate: '',
          monthlyRent: '',
          monthlyOperatingExpenses: '',
          mortgageBalance: '',
          currentEstimatedValue: '',
          bedrooms: '',
          bathrooms: '',
          squareFootage: '',
          yearBuilt: '',
          unitsDescription: '',
          propertyType: 'SFR',
          ownershipPercentage: '100',
          totalUnits: '',
          totalSqft: '',
          commonAreaUtilities: {
            electric: '',
            water: '',
            gas: '',
            trash: ''
          }
        });
      } else {
        setError('Failed to create property');
      }
    } catch (err: any) {
      console.error('Error creating manual property:', err);
      setError(err.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    return new Intl.NumberFormat('en-US').format(Number(number));
  };

  const handlePriceChange = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, purchasePrice: number }));
  };

  const handleRentChange = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, monthlyRent: number }));
  };

  const handleExpensesChange = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, monthlyOperatingExpenses: number }));
  };

  const handleMortgageChange = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, mortgageBalance: number }));
  };

  const handleCurrentValueChange = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, currentEstimatedValue: number }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 600
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: `1px solid ${appleColors.gray[200]}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Home sx={{ color: appleColors.blue[600] }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.gray[900] }}>
              Add Property Manually
            </Typography>
            <Typography variant="body2" sx={{ color: appleColors.gray[600], mt: 0.5 }}>
              Add a property to your portfolio without full analysis
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Property Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Property Name"
              value={formData.propertyName}
              onChange={(e) => handleInputChange('propertyName', e.target.value)}
              placeholder="e.g., 123 Main Street Property"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Property Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={formData.propertyType}
                label="Property Type"
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="SFR">Single Family Rental</MenuItem>
                <MenuItem value="MF">Multi-Family (2-4 units)</MenuItem>
                <MenuItem value="APARTMENT">Apartment Complex (5+ units)</MenuItem>
                <MenuItem value="CONDO">Condominium</MenuItem>
                <MenuItem value="TOWNHOUSE">Townhouse</MenuItem>
                <MenuItem value="COMMERCIAL_RETAIL">Commercial - Retail</MenuItem>
                <MenuItem value="COMMERCIAL_OFFICE">Commercial - Office</MenuItem>
                <MenuItem value="COMMERCIAL_INDUSTRIAL">Commercial - Industrial</MenuItem>
                <MenuItem value="COMMERCIAL_MIXED">Commercial - Mixed Use</MenuItem>
                <MenuItem value="SELF_STORAGE">Self Storage</MenuItem>
                <MenuItem value="MOBILE_HOME_PARK">Mobile Home Park</MenuItem>
                <MenuItem value="LAND">Land/Development</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Purchase Price */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Purchase Price"
              value={formatCurrency(formData.purchasePrice)}
              onChange={(e) => handlePriceChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Purchase Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Portfolio Performance Section */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: appleColors.gray[900] }}>
              Financial Details (For Portfolio Analytics)
            </Typography>
          </Grid>

          {/* Monthly Income */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={
                ['COMMERCIAL_RETAIL', 'COMMERCIAL_OFFICE', 'COMMERCIAL_INDUSTRIAL'].includes(formData.propertyType) 
                  ? "Monthly Lease Income" 
                  : ['SELF_STORAGE'].includes(formData.propertyType)
                  ? "Monthly Storage Income"
                  : "Current Monthly Rent"
              }
              value={formatCurrency(formData.monthlyRent)}
              onChange={(e) => handleRentChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Required for portfolio cash flow analysis"
            />
          </Grid>

          {/* Monthly Operating Expenses */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Monthly Operating Expenses"
              value={formatCurrency(formData.monthlyOperatingExpenses)}
              onChange={(e) => handleExpensesChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText={
                ['COMMERCIAL_RETAIL', 'COMMERCIAL_OFFICE', 'COMMERCIAL_INDUSTRIAL'].includes(formData.propertyType)
                  ? "Property taxes, insurance, CAM, maintenance"
                  : "Insurance, taxes, maintenance, management"
              }
            />
          </Grid>

          {/* Current Mortgage Balance */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Mortgage Balance"
              value={formatCurrency(formData.mortgageBalance)}
              onChange={(e) => handleMortgageChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Enter 0 if property is paid off"
            />
          </Grid>

          {/* Current Estimated Value */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Estimated Value"
              value={formatCurrency(formData.currentEstimatedValue)}
              onChange={(e) => handleCurrentValueChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Current market value estimate"
            />
          </Grid>

          {/* Ownership Percentage */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Ownership Percentage"
              type="number"
              value={formData.ownershipPercentage}
              onChange={(e) => handleInputChange('ownershipPercentage', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ min: 1, max: 100 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Your ownership share (100% for full ownership)"
            />
          </Grid>

          {/* Address Section */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: appleColors.gray[900] }}>
              Property Address
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              placeholder="e.g., 123 Main Street"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="State"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              placeholder="e.g., CA"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={formData.address.zipCode}
              onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* Property Details */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: appleColors.gray[900] }}>
              Property Details (Optional)
            </Typography>
          </Grid>

          {/* Show bedrooms/bathrooms for residential properties */}
          {['SFR', 'MF', 'APARTMENT', 'CONDO', 'TOWNHOUSE'].includes(formData.propertyType) && (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  inputProps={{ min: 0, max: 50 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText={['MF', 'APARTMENT'].includes(formData.propertyType) ? 'Total bedrooms' : ''}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  inputProps={{ min: 0, max: 50, step: 0.5 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  helperText={['MF', 'APARTMENT'].includes(formData.propertyType) ? 'Total bathrooms' : ''}
                />
              </Grid>
            </>
          )}

          {/* Show units description for commercial properties */}
          {['COMMERCIAL_RETAIL', 'COMMERCIAL_OFFICE', 'COMMERCIAL_INDUSTRIAL', 'COMMERCIAL_MIXED', 'SELF_STORAGE', 'MOBILE_HOME_PARK'].includes(formData.propertyType) && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Units/Space Description"
                value={formData.unitsDescription}
                onChange={(e) => handleInputChange('unitsDescription', e.target.value)}
                placeholder="e.g., 5 retail units, 15,000 sqft office space, 200 storage units"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                helperText="Describe the units, tenants, or space breakdown"
                multiline
                rows={2}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Square Footage"
              type="number"
              value={formData.squareFootage}
              onChange={(e) => handleInputChange('squareFootage', e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Year Built"
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
              inputProps={{ min: 1800, max: new Date().getFullYear() }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              helperText="Leave blank for default"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 3, 
        borderTop: `1px solid ${appleColors.gray[200]}`,
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: appleColors.gray[400],
            color: appleColors.gray[700],
            '&:hover': {
              borderColor: appleColors.gray[600],
              backgroundColor: appleColors.gray[50]
            }
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: appleColors.blue[600],
            color: 'white',
            px: 3,
            '&:hover': {
              backgroundColor: appleColors.blue[700]
            },
            '&:disabled': {
              backgroundColor: appleColors.gray[300]
            }
          }}
        >
          {loading ? 'Adding Property...' : 'Add to Portfolio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddManualPropertyModal;