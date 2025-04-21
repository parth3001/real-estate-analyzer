import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  InputAdornment,
  FormControl,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = {
  palette: {
    primary: {
      main: '#6366F1', // Modern indigo
      light: '#818CF8',
      dark: '#4F46E5'
    },
    secondary: {
      main: '#10B981', // Modern emerald
      light: '#34D399',
      dark: '#059669'
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563'
    },
    error: {
      main: '#EF4444'
    },
    success: {
      main: '#10B981'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#6366F1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
        }
      }
    }
  }
};

const CurrencyInput = ({ value, onChange, label, required = false }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleChange = (event) => {
    const rawValue = event.target.value.replace(/[^0-9]/g, '');
    const numericValue = parseInt(rawValue, 10);
    
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    } else {
      onChange('');
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={displayValue}
      onChange={handleChange}
      required={required}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          },
        },
      }}
    />
  );
};

const PercentageInput = ({ value, onChange, label, required = false }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (event) => {
    const rawValue = event.target.value.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(rawValue);
    
    if (!isNaN(numericValue) && numericValue <= 100) {
      onChange(numericValue);
    } else {
      onChange('');
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={displayValue}
      onChange={handleChange}
      required={required}
      InputProps={{
        endAdornment: <InputAdornment position="end">%</InputAdornment>,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          },
        },
      }}
    />
  );
};

const DealForm = ({ onSubmit, initialData = {} }) => {
  console.log('DealForm initialData:', initialData);
  
  const [dealData, setDealData] = useState(() => {
    const initialState = {
      propertyAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      propertyType: 'single_family',
      purchasePrice: '',
      downPayment: '',
      interestRate: '',
      loanTerm: 30,
      capitalInvestment: '',
      monthlyRent: '',
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      maintenance: '',
      sfrDetails: {
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        yearBuilt: '',
        condition: 'good',
        propertyManagement: {
          feePercentage: 4,
        },
        tenantTurnover: {
          assumedAnnualTurnover: true,
          realtorCommissionMonths: 1,
          prepFeesMonths: 1,
        },
        longTermAssumptions: {
          projectionYears: 10,
          annualRentIncrease: 2,
          annualPropertyValueIncrease: 3,
          sellingCostsPercentage: 6,
          inflationRate: 2,
          vacancyRate: 5,
        },
      },
      ...initialData
    };
    console.log('DealForm initial state:', initialState);
    return initialState;
  });

  // Add useEffect to update dealData when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Updating dealData with initialData:', initialData);
      setDealData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field, value) => {
    switch (field) {
      case 'purchasePrice':
      case 'downPayment':
      case 'monthlyRent':
        return value > 0 ? '' : 'Must be greater than 0';
      case 'propertyTaxRate':
        return value > 0 && value < 10 ? '' : 'Must be between 0 and 10%';
      case 'insuranceRate':
        return value > 0 && value < 5 ? '' : 'Must be between 0 and 5%';
      case 'interestRate':
        return value > 0 && value < 30 ? '' : 'Must be between 0 and 30';
      case 'propertyAddress.street':
        return value.trim() ? '' : 'Required';
      case 'propertyAddress.city':
        return value.trim() ? '' : 'Required';
      case 'propertyAddress.state':
        return value.trim() ? '' : 'Required';
      case 'propertyAddress.zipCode':
        return /^\d{5}(-\d{4})?$/.test(value) ? '' : 'Invalid zip code';
      case 'sfrDetails.bedrooms':
      case 'sfrDetails.bathrooms':
        return value > 0 ? '' : 'Must be greater than 0';
      case 'sfrDetails.squareFootage':
        return value >= 100 ? '' : 'Must be at least 100 sq ft';
      case 'sfrDetails.yearBuilt':
        return value > 1800 && value <= new Date().getFullYear() ? '' : 'Invalid year';
      case 'sfrDetails.propertyManagement.feePercentage':
        return value >= 0 && value <= 15 ? '' : 'Must be between 0 and 15%';
      case 'sfrDetails.longTermAssumptions.annualRentIncrease':
        return value >= -5 && value <= 15 ? '' : 'Must be between -5% and 15%';
      case 'sfrDetails.longTermAssumptions.annualPropertyValueIncrease':
        return value >= -10 && value <= 15 ? '' : 'Must be between -10% and 15%';
      case 'sfrDetails.longTermAssumptions.sellingCostsPercentage':
        return value >= 0 && value <= 10 ? '' : 'Must be between 0 and 10%';
      case 'sfrDetails.longTermAssumptions.inflationRate':
        return value >= 0 && value <= 10 ? '' : 'Must be between 0 and 10%';
      case 'sfrDetails.longTermAssumptions.vacancyRate':
        return value >= 0 && value <= 20 ? '' : 'Must be between 0 and 20%';
      case 'capitalInvestment':
        return value >= 0 ? '' : 'Must be greater than or equal to 0';
      case 'loanTerm':
        return value >= 1 && value <= 30 ? '' : 'Must be between 1 and 30 years';
      default:
        return '';
    }
  };

  const handleChange = (fieldOrEvent, valueOrUndefined) => {
    // Determine field and value based on arguments
    let field, value;
    
    if (typeof fieldOrEvent === 'string') {
      // Direct field/value call
      field = fieldOrEvent;
      value = valueOrUndefined;
    } else if (fieldOrEvent?.target) {
      // Event object from TextField
      field = fieldOrEvent.target.name;
      value = fieldOrEvent.target.type === 'checkbox' ? 
        fieldOrEvent.target.checked : 
        fieldOrEvent.target.value;
    } else {
      console.error('Invalid arguments to handleChange');
      return;
    }

    // Convert string values to numbers for numeric fields
    const numericFields = [
      'purchasePrice',
      'downPayment',
      'interestRate',
      'monthlyRent',
      'propertyTaxRate',
      'insuranceRate',
      'maintenance',
      'sfrDetails.bedrooms',
      'sfrDetails.bathrooms',
      'sfrDetails.squareFootage',
      'sfrDetails.yearBuilt',
      'sfrDetails.propertyManagement.feePercentage',
      'sfrDetails.longTermAssumptions.annualRentIncrease',
      'sfrDetails.longTermAssumptions.annualPropertyValueIncrease',
      'sfrDetails.longTermAssumptions.sellingCostsPercentage',
      'sfrDetails.longTermAssumptions.inflationRate',
      'sfrDetails.longTermAssumptions.vacancyRate',
      'sfrDetails.longTermAssumptions.projectionYears',
      'loanTerm',
      'capitalInvestment'
    ];
    
    const processedValue = numericFields.includes(field) ? 
      (value === '' ? '' : Number(value)) : 
      value;

    // Handle nested properties
    const parts = field.split('.');
    setDealData(prev => {
      let newData = { ...prev };
      let current = newData;
      
      // Navigate through the object, creating nested objects if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      
      // Set the final value
      current[parts[parts.length - 1]] = processedValue;
      return newData;
    });

    const error = validateField(field, processedValue);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'propertyAddress.street',
      'propertyAddress.city',
      'propertyAddress.state',
      'propertyAddress.zipCode',
      'purchasePrice',
      'downPayment',
      'interestRate',
      'monthlyRent',
      'propertyTaxRate',
      'insuranceRate',
      'sfrDetails.bedrooms',
      'sfrDetails.bathrooms',
      'sfrDetails.squareFootage',
      'sfrDetails.yearBuilt'
    ];

    requiredFields.forEach(field => {
      let value;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        value = dealData[parent][child];
      } else {
        value = dealData[field];
      }
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(dealData);
      setSnackbar({
        open: true,
        message: 'Analysis completed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to analyze deal. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    try {
      // Get existing deals or initialize empty array
      const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      
      // Create deal name from address
      const dealName = dealData.propertyAddress.street && dealData.propertyAddress.city 
        ? `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`
        : `Deal ${savedDeals.length + 1}`;

      // Create new deal object
      const newDeal = {
        name: dealName,
        data: dealData,
        savedAt: new Date().toISOString()
      };

      // Add new deal to array
      savedDeals.push(newDeal);

      // Save back to localStorage
      localStorage.setItem('savedDeals', JSON.stringify(savedDeals));

      // Show success message with deal name
      setSnackbar({
        open: true,
        message: `Deal "${dealName}" saved successfully. Total deals: ${savedDeals.length}`,
        severity: 'success'
      });

      console.log('Saved deals:', savedDeals); // Debug log
    } catch (error) {
      console.error('Error saving deal:', error);
      setSnackbar({
        open: true,
        message: `Failed to save deal: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleLoad = () => {
    try {
      const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      if (savedDeals.length > 0) {
        const mostRecent = savedDeals[savedDeals.length - 1];
        setDealData(mostRecent.data);
        setSnackbar({
          open: true,
          message: 'Deal loaded successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No saved deals found',
          severity: 'info'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load deal',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={createTheme(theme)}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Card sx={{ p: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, color: 'text.primary', fontWeight: 600 }}>
              Property Analysis
            </Typography>
            
            <Grid container spacing={4}>
              {/* Property Information Section */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Property Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Property Address"
                      required
                      value={dealData.propertyAddress.street}
                      onChange={(e) => handleChange('propertyAddress.street', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={dealData.propertyAddress.city}
                      onChange={(e) => handleChange('propertyAddress.city', e.target.value)}
                      error={!!errors['propertyAddress.city']}
                      helperText={errors['propertyAddress.city']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={dealData.propertyAddress.state}
                      onChange={(e) => handleChange('propertyAddress.state', e.target.value)}
                      error={!!errors['propertyAddress.state']}
                      helperText={errors['propertyAddress.state']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Zip Code"
                      value={dealData.propertyAddress.zipCode}
                      onChange={(e) => handleChange('propertyAddress.zipCode', e.target.value)}
                      error={!!errors['propertyAddress.zipCode']}
                      helperText={errors['propertyAddress.zipCode']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bedrooms"
                      type="number"
                      value={dealData.sfrDetails.bedrooms}
                      onChange={(e) => handleChange('sfrDetails.bedrooms', e.target.value)}
                      error={!!errors['sfrDetails.bedrooms']}
                      helperText={errors['sfrDetails.bedrooms']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bathrooms"
                      type="number"
                      value={dealData.sfrDetails.bathrooms}
                      onChange={(e) => handleChange('sfrDetails.bathrooms', e.target.value)}
                      error={!!errors['sfrDetails.bathrooms']}
                      helperText={errors['sfrDetails.bathrooms']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Square Footage"
                      type="number"
                      value={dealData.sfrDetails.squareFootage}
                      onChange={(e) => handleChange('sfrDetails.squareFootage', e.target.value)}
                      error={!!errors['sfrDetails.squareFootage']}
                      helperText={errors['sfrDetails.squareFootage']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Year Built"
                      type="number"
                      value={dealData.sfrDetails.yearBuilt}
                      onChange={(e) => handleChange('sfrDetails.yearBuilt', e.target.value)}
                      error={!!errors['sfrDetails.yearBuilt']}
                      helperText={errors['sfrDetails.yearBuilt']}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Financial Details Section */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Financial Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <CurrencyInput
                      label="Purchase Price"
                      value={dealData.purchasePrice}
                      onChange={(value) => handleChange('purchasePrice', value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CurrencyInput
                      label="Down Payment"
                      value={dealData.downPayment}
                      onChange={(value) => handleChange('downPayment', value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CurrencyInput
                      label="Capital Investment"
                      value={dealData.capitalInvestment}
                      onChange={(value) => handleChange('capitalInvestment', value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Loan Term (Years)"
                      type="number"
                      value={dealData.loanTerm}
                      onChange={(e) => handleChange('loanTerm', e.target.value)}
                      required
                      inputProps={{ min: "1", max: "30", step: "1" }}
                      error={!!errors['loanTerm']}
                      helperText={errors['loanTerm']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CurrencyInput
                      label="Monthly Rental Income"
                      value={dealData.monthlyRent}
                      onChange={(value) => handleChange('monthlyRent', value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <PercentageInput
                      label="Interest Rate"
                      value={dealData.interestRate}
                      onChange={(value) => handleChange('interestRate', value)}
                      required
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Operating Expenses Section */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Operating Expenses
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth margin="normal">
                      <TextField
                        label="Property Tax Rate (%)"
                        name="propertyTaxRate"
                        type="number"
                        value={dealData.propertyTaxRate}
                        onChange={(e) => handleChange('propertyTaxRate', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        helperText="Annual property tax rate as a percentage of property value"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth margin="normal">
                      <TextField
                        label="Insurance Rate (%)"
                        name="insuranceRate"
                        type="number"
                        value={dealData.insuranceRate}
                        onChange={(e) => handleChange('insuranceRate', e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        helperText="Annual insurance rate as a percentage of property value"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CurrencyInput
                      label="Maintenance (Monthly)"
                      value={dealData.maintenance}
                      onChange={(value) => handleChange('maintenance', value)}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Property Management Section */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Property Management
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Management Fee (%)"
                      type="number"
                      value={dealData.sfrDetails.propertyManagement.feePercentage}
                      onChange={(e) => handleChange('sfrDetails.propertyManagement.feePercentage', e.target.value)}
                      error={!!errors['sfrDetails.propertyManagement.feePercentage']}
                      helperText={errors['sfrDetails.propertyManagement.feePercentage']}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dealData.sfrDetails.tenantTurnover.assumedAnnualTurnover}
                            onChange={(e) => handleChange('sfrDetails.tenantTurnover.assumedAnnualTurnover', e.target.checked)}
                          />
                        }
                        label="Assume Annual Tenant Turnover"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Long Term Assumptions Section */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mb: 3 }}>
                  Long Term Assumptions
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Annual Rent Increase (%)"
                      name="sfrDetails.longTermAssumptions.annualRentIncrease"
                      value={dealData.sfrDetails.longTermAssumptions.annualRentIncrease}
                      onChange={handleChange}
                      error={!!errors['sfrDetails.longTermAssumptions.annualRentIncrease']}
                      helperText={errors['sfrDetails.longTermAssumptions.annualRentIncrease']}
                      type="number"
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Annual Property Value Increase (%)"
                      name="sfrDetails.longTermAssumptions.annualPropertyValueIncrease"
                      value={dealData.sfrDetails.longTermAssumptions.annualPropertyValueIncrease}
                      onChange={handleChange}
                      error={!!errors['sfrDetails.longTermAssumptions.annualPropertyValueIncrease']}
                      helperText={errors['sfrDetails.longTermAssumptions.annualPropertyValueIncrease']}
                      type="number"
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Selling Costs (%)"
                      name="sfrDetails.longTermAssumptions.sellingCostsPercentage"
                      value={dealData.sfrDetails.longTermAssumptions.sellingCostsPercentage}
                      onChange={handleChange}
                      error={!!errors['sfrDetails.longTermAssumptions.sellingCostsPercentage']}
                      helperText={errors['sfrDetails.longTermAssumptions.sellingCostsPercentage']}
                      type="number"
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Inflation Rate (%)"
                      name="sfrDetails.longTermAssumptions.inflationRate"
                      value={dealData.sfrDetails.longTermAssumptions.inflationRate}
                      onChange={handleChange}
                      error={!!errors['sfrDetails.longTermAssumptions.inflationRate']}
                      helperText={errors['sfrDetails.longTermAssumptions.inflationRate']}
                      type="number"
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vacancy Rate (%)"
                      name="sfrDetails.longTermAssumptions.vacancyRate"
                      value={dealData.sfrDetails.longTermAssumptions.vacancyRate}
                      onChange={handleChange}
                      error={!!errors['sfrDetails.longTermAssumptions.vacancyRate']}
                      helperText={errors['sfrDetails.longTermAssumptions.vacancyRate']}
                      type="number"
                      inputProps={{ step: "0.1" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Projection Years"
                      value={dealData.sfrDetails.longTermAssumptions.projectionYears}
                      onChange={(e) => handleChange('sfrDetails.longTermAssumptions.projectionYears', e.target.value)}
                      error={!!errors['sfrDetails.longTermAssumptions.projectionYears']}
                      helperText={errors['sfrDetails.longTermAssumptions.projectionYears']}
                      type="number"
                      inputProps={{ min: "1", max: "30", step: "1" }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSubmit}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 16px -4px rgb(99 102 241 / 0.3)'
                      }
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Analyze Deal'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={handleSave}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 16px -4px rgb(99 102 241 / 0.3)'
                      }
                    }}
                  >
                    Save Deal
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Container>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default DealForm; 