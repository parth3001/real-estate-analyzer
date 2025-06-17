import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  Alert,
  InputAdornment,
  Paper,
  CircularProgress
} from '@mui/material';
import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';

interface SFRPropertyFormProps {
  onSubmit: (data: SFRPropertyData) => Promise<Analysis | null>;
  initialData?: Partial<SFRPropertyData>;
  isLoading?: boolean;
  error?: string;
}

// Default values for form fields
const defaultFormValues: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: '',
  propertyAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 5.5,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  propertyManagementRate: 8,
  yearBuilt: new Date().getFullYear() - 20,
  monthlyRent: 0,
  squareFootage: 0,
  bedrooms: 3,
  bathrooms: 2,
  maintenanceCost: 0,
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    turnoverFrequency: 2
  },
  closingCosts: 0,
  capitalInvestments: 0,
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  }
};

// Validation rules
type ValidationErrors = {
  [K in keyof SFRPropertyData]?: string;
} & {
  'propertyAddress.street'?: string;
  'propertyAddress.city'?: string;
  'propertyAddress.state'?: string;
  'propertyAddress.zipCode'?: string;
  'longTermAssumptions.projectionYears'?: string;
  'longTermAssumptions.annualRentIncrease'?: string;
  'longTermAssumptions.annualPropertyValueIncrease'?: string;
  'longTermAssumptions.sellingCostsPercentage'?: string;
  'longTermAssumptions.inflationRate'?: string;
  'longTermAssumptions.vacancyRate'?: string;
  'tenantTurnoverFees.prepFees'?: string;
  'tenantTurnoverFees.realtorCommission'?: string;
};

const SFRPropertyForm: React.FC<SFRPropertyFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  error
}) => {
  const [formData, setFormData] = useState<SFRPropertyData>({
    ...defaultFormValues,
    ...initialData
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Watch for changes in initialData
  useEffect(() => {
    console.log('initialData changed:', initialData);
    if (initialData) {
      console.log('Updating form data with initialData');
      setFormData({
        ...defaultFormValues,
        ...initialData
      });
    }
  }, [initialData]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Required fields
    if (!formData.propertyName) newErrors.propertyName = 'Property name is required';
    if (!formData.propertyAddress.street) newErrors['propertyAddress.street'] = 'Street is required';
    if (!formData.propertyAddress.city) newErrors['propertyAddress.city'] = 'City is required';
    if (!formData.propertyAddress.state) newErrors['propertyAddress.state'] = 'State is required';
    if (!formData.propertyAddress.zipCode) newErrors['propertyAddress.zipCode'] = 'ZIP code is required';
    
    // Numeric validation
    if (formData.purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price must be greater than 0';
    if (formData.downPayment < 0) newErrors.downPayment = 'Down payment cannot be negative';
    if (formData.downPayment > formData.purchasePrice) {
      newErrors.downPayment = 'Down payment cannot be greater than purchase price';
    }
    if (formData.interestRate <= 0) newErrors.interestRate = 'Interest rate must be greater than 0';
    if (formData.loanTerm <= 0) newErrors.loanTerm = 'Loan term must be greater than 0';
    if (formData.monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    if (formData.squareFootage <= 0) newErrors.squareFootage = 'Square footage must be greater than 0';
    if (formData.bedrooms <= 0) newErrors.bedrooms = 'Bedrooms must be greater than 0';
    if (formData.bathrooms <= 0) newErrors.bathrooms = 'Bathrooms must be greater than 0';
    if (formData.propertyTaxRate < 0) newErrors.propertyTaxRate = 'Property tax rate cannot be negative';
    if (formData.insuranceRate < 0) newErrors.insuranceRate = 'Insurance rate cannot be negative';
    if (formData.maintenanceCost < 0) newErrors.maintenanceCost = 'Maintenance cost cannot be negative';
    
    // Additional Investment & Fees validation
    if (formData.capitalInvestments !== undefined && formData.capitalInvestments < 0) {
      newErrors.capitalInvestments = 'Capital investments cannot be negative';
    }
    if (formData.tenantTurnoverFees?.prepFees !== undefined && formData.tenantTurnoverFees.prepFees < 0) {
      newErrors['tenantTurnoverFees.prepFees'] = 'Preparation fees cannot be negative';
    }
    if (formData.tenantTurnoverFees?.realtorCommission !== undefined && formData.tenantTurnoverFees.realtorCommission < 0) {
      newErrors['tenantTurnoverFees.realtorCommission'] = 'Realtor commission cannot be negative';
    }
    
    // Long term assumptions validation
    if (formData.longTermAssumptions.projectionYears <= 0) {
      newErrors['longTermAssumptions.projectionYears'] = 'Projection years must be greater than 0';
    }
    if (formData.longTermAssumptions.annualRentIncrease < 0) {
      newErrors['longTermAssumptions.annualRentIncrease'] = 'Annual rent increase cannot be negative';
    }
    if (formData.longTermAssumptions.annualPropertyValueIncrease < 0) {
      newErrors['longTermAssumptions.annualPropertyValueIncrease'] = 'Annual property value increase cannot be negative';
    }
    if (formData.longTermAssumptions.sellingCostsPercentage < 0) {
      newErrors['longTermAssumptions.sellingCostsPercentage'] = 'Selling costs percentage cannot be negative';
    }
    if (formData.longTermAssumptions.inflationRate < 0) {
      newErrors['longTermAssumptions.inflationRate'] = 'Inflation rate cannot be negative';
    }
    if (formData.longTermAssumptions.vacancyRate < 0) {
      newErrors['longTermAssumptions.vacancyRate'] = 'Vacancy rate cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: 'propertyAddress' | 'longTermAssumptions'
  ) => {
    const { name, value } = e.target;
    
    if (section === 'propertyAddress') {
      setFormData({
        ...formData,
        propertyAddress: {
          ...formData.propertyAddress,
          [name]: value
        }
      });
    } else if (section === 'longTermAssumptions') {
      setFormData({
        ...formData,
        longTermAssumptions: {
          ...formData.longTermAssumptions,
          [name]: parseFloat(value) || 0
        }
      });
    } else {
      // Handle numeric fields
      if (['purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'monthlyRent', 
           'squareFootage', 'bedrooms', 'bathrooms', 'yearBuilt', 'propertyTaxRate', 
           'insuranceRate', 'propertyManagementRate', 'maintenanceCost', 'closingCosts',
           'capitalInvestments'].includes(name)) {
        setFormData({
          ...formData,
          [name]: parseFloat(value) || 0
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <form onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Typography variant="h6" gutterBottom>Property Information</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Property Name"
              name="propertyName"
              value={formData.propertyName}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.propertyName && formSubmitted}
              helperText={formSubmitted && errors.propertyName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Year Built"
              name="yearBuilt"
              type="number"
              value={formData.yearBuilt}
              onChange={handleChange}
              fullWidth
              error={!!errors.yearBuilt && formSubmitted}
              helperText={formSubmitted && errors.yearBuilt}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Street Address"
              name="street"
              value={formData.propertyAddress.street}
              onChange={(e) => handleChange(e, 'propertyAddress')}
              fullWidth
              required
              error={!!errors['propertyAddress.street'] && formSubmitted}
              helperText={formSubmitted && errors['propertyAddress.street']}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="City"
              name="city"
              value={formData.propertyAddress.city}
              onChange={(e) => handleChange(e, 'propertyAddress')}
              fullWidth
              required
              error={!!errors['propertyAddress.city'] && formSubmitted}
              helperText={formSubmitted && errors['propertyAddress.city']}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="State"
              name="state"
              value={formData.propertyAddress.state}
              onChange={(e) => handleChange(e, 'propertyAddress')}
              fullWidth
              required
              error={!!errors['propertyAddress.state'] && formSubmitted}
              helperText={formSubmitted && errors['propertyAddress.state']}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="ZIP Code"
              name="zipCode"
              value={formData.propertyAddress.zipCode}
              onChange={(e) => handleChange(e, 'propertyAddress')}
              fullWidth
              required
              error={!!errors['propertyAddress.zipCode'] && formSubmitted}
              helperText={formSubmitted && errors['propertyAddress.zipCode']}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Property Details</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Bedrooms"
              name="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.bedrooms && formSubmitted}
              helperText={formSubmitted && errors.bedrooms}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Bathrooms"
              name="bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.bathrooms && formSubmitted}
              helperText={formSubmitted && errors.bathrooms}
              inputProps={{ step: 0.5 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Square Footage"
              name="squareFootage"
              type="number"
              value={formData.squareFootage}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.squareFootage && formSubmitted}
              helperText={formSubmitted && errors.squareFootage}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Financial Details</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Purchase Price"
              name="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.purchasePrice && formSubmitted}
              helperText={formSubmitted && errors.purchasePrice}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Down Payment"
              name="downPayment"
              type="number"
              value={formData.downPayment}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.downPayment && formSubmitted}
              helperText={formSubmitted && errors.downPayment}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Closing Costs"
              name="closingCosts"
              type="number"
              value={formData.closingCosts}
              onChange={handleChange}
              fullWidth
              error={!!errors.closingCosts && formSubmitted}
              helperText={formSubmitted && errors.closingCosts}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Monthly Rent"
              name="monthlyRent"
              type="number"
              value={formData.monthlyRent}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.monthlyRent && formSubmitted}
              helperText={formSubmitted && errors.monthlyRent}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Interest Rate"
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.interestRate && formSubmitted}
              helperText={formSubmitted && errors.interestRate}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Loan Term"
              name="loanTerm"
              type="number"
              value={formData.loanTerm}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.loanTerm && formSubmitted}
              helperText={formSubmitted && errors.loanTerm}
              InputProps={{
                endAdornment: <InputAdornment position="end">years</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Maintenance Cost"
              name="maintenanceCost"
              type="number"
              value={formData.maintenanceCost}
              onChange={handleChange}
              fullWidth
              error={!!errors.maintenanceCost && formSubmitted}
              helperText={formSubmitted && errors.maintenanceCost}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/month</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Expenses</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Property Tax Rate"
              name="propertyTaxRate"
              type="number"
              value={formData.propertyTaxRate}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.propertyTaxRate && formSubmitted}
              helperText={formSubmitted && errors.propertyTaxRate}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Insurance Rate"
              name="insuranceRate"
              type="number"
              value={formData.insuranceRate}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.insuranceRate && formSubmitted}
              helperText={formSubmitted && errors.insuranceRate}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Property Management Rate"
              name="propertyManagementRate"
              type="number"
              value={formData.propertyManagementRate}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.propertyManagementRate && formSubmitted}
              helperText={formSubmitted && errors.propertyManagementRate}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Additional Investment & Fees</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Capital Investments ($)"
              name="capitalInvestments"
              type="number"
              value={formData.capitalInvestments || 0}
              onChange={handleChange}
              error={formData.capitalInvestments !== undefined && formData.capitalInvestments < 0}
              helperText={formData.capitalInvestments !== undefined && formData.capitalInvestments < 0 ? "Capital investments cannot be negative" : "One-time capital improvements or major upgrades"}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Tenant Turnover Fees</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Preparation Fees ($)"
              name="tenantTurnoverFees.prepFees"
              type="number"
              value={formData.tenantTurnoverFees?.prepFees || 0}
              onChange={handleChange}
              error={formData.tenantTurnoverFees?.prepFees !== undefined && formData.tenantTurnoverFees.prepFees < 0}
              helperText={formData.tenantTurnoverFees?.prepFees !== undefined && formData.tenantTurnoverFees.prepFees < 0 ? "Prep fees cannot be negative" : "Costs to prepare property between tenants"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Realtor Commission (as multiplier)"
              name="tenantTurnoverFees.realtorCommission"
              type="number"
              value={formData.tenantTurnoverFees?.realtorCommission || 0}
              onChange={handleChange}
              error={formData.tenantTurnoverFees?.realtorCommission !== undefined && formData.tenantTurnoverFees.realtorCommission < 0}
              helperText={formData.tenantTurnoverFees?.realtorCommission !== undefined && formData.tenantTurnoverFees.realtorCommission < 0 ? "Commission cannot be negative" : "Commission as a multiplier of monthly rent (e.g., 0.5 = half month's rent)"}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Long-Term Assumptions</Typography>
        <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Projection Years"
              name="projectionYears"
              type="number"
              value={formData.longTermAssumptions.projectionYears}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.projectionYears'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.projectionYears']}
              InputProps={{
                endAdornment: <InputAdornment position="end">years</InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Annual Rent Increase"
              name="annualRentIncrease"
              type="number"
              value={formData.longTermAssumptions.annualRentIncrease}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.annualRentIncrease'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.annualRentIncrease']}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Annual Property Value Increase"
              name="annualPropertyValueIncrease"
              type="number"
              value={formData.longTermAssumptions.annualPropertyValueIncrease}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.annualPropertyValueIncrease'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.annualPropertyValueIncrease']}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Selling Costs Percentage"
              name="sellingCostsPercentage"
              type="number"
              value={formData.longTermAssumptions.sellingCostsPercentage}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.sellingCostsPercentage'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.sellingCostsPercentage']}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Inflation Rate"
              name="inflationRate"
              type="number"
              value={formData.longTermAssumptions.inflationRate}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.inflationRate'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.inflationRate']}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Vacancy Rate"
              name="vacancyRate"
              type="number"
              value={formData.longTermAssumptions.vacancyRate}
              onChange={(e) => handleChange(e, 'longTermAssumptions')}
              fullWidth
              required
              error={!!errors['longTermAssumptions.vacancyRate'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.vacancyRate']}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              label="Tenant Turnover Frequency (years)"
              name="longTermAssumptions.turnoverFrequency"
              type="number"
              value={formData.longTermAssumptions?.turnoverFrequency || 2}
              onChange={handleChange}
              error={!!errors['longTermAssumptions.turnoverFrequency'] && formSubmitted}
              helperText={formSubmitted && errors['longTermAssumptions.turnoverFrequency'] || "Average tenant stay in years (e.g., 2 = tenant changes every 2 years)"}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="inherit"
            onClick={() => setFormData(defaultFormValues)}
            disabled={isLoading}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Property'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SFRPropertyForm; 