import React, { useState } from 'react';
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
} from '@mui/material';

const DealForm = ({ onSubmit, initialData = {} }) => {
  const [dealData, setDealData] = useState({
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
    monthlyRent: '',
    propertyTaxRate: '',
    insuranceRate: '',
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
      ...initialData,
    },
  });

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
      'sfrDetails.longTermAssumptions.projectionYears'
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
      const savedDeals = JSON.parse(localStorage.getItem('savedDeals') || '[]');
      const dealName = `${dealData.propertyAddress.street}, ${dealData.propertyAddress.city}`;
      savedDeals.push({
        name: dealName,
        data: dealData,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('savedDeals', JSON.stringify(savedDeals));
      setSnackbar({
        open: true,
        message: 'Deal saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save deal',
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
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Property Details
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleSave}
              sx={{ mr: 1 }}
            >
              Save Deal
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLoad}
            >
              Load Deal
            </Button>
          </Box>
        </Box>
        <Box component="form" noValidate>
          <Grid container spacing={3}>
            {/* Property Address Section */}
            <Grid item xs={12}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  mt: 2,
                  fontWeight: 500,
                  color: 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Property Address
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Street Address"
                value={dealData.propertyAddress.street}
                onChange={(e) => handleChange('propertyAddress.street', e.target.value)}
                error={!!errors['propertyAddress.street']}
                helperText={errors['propertyAddress.street']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={dealData.propertyAddress.city}
                onChange={(e) => handleChange('propertyAddress.city', e.target.value)}
                error={!!errors['propertyAddress.city']}
                helperText={errors['propertyAddress.city']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={dealData.propertyAddress.state}
                onChange={(e) => handleChange('propertyAddress.state', e.target.value)}
                error={!!errors['propertyAddress.state']}
                helperText={errors['propertyAddress.state']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Zip Code"
                value={dealData.propertyAddress.zipCode}
                onChange={(e) => handleChange('propertyAddress.zipCode', e.target.value)}
                error={!!errors['propertyAddress.zipCode']}
                helperText={errors['propertyAddress.zipCode']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
            </Grid>

            {/* Property Characteristics Section */}
            <Grid item xs={12}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  mt: 2,
                  fontWeight: 500,
                  color: 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Property Characteristics
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Purchase Price"
                value={dealData.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Down Payment"
                value={dealData.downPayment}
                onChange={(e) => handleChange('downPayment', e.target.value)}
                error={!!errors.downPayment}
                helperText={errors.downPayment}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Interest Rate (%)"
                value={dealData.interestRate}
                onChange={(e) => handleChange('interestRate', e.target.value)}
                error={!!errors.interestRate}
                helperText={errors.interestRate}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Rent"
                value={dealData.monthlyRent}
                onChange={(e) => handleChange('monthlyRent', e.target.value)}
                error={!!errors.monthlyRent}
                helperText={errors.monthlyRent}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Property Tax Rate (%)"
                value={dealData.propertyTaxRate}
                onChange={(e) => handleChange('propertyTaxRate', e.target.value)}
                error={!!errors.propertyTaxRate}
                helperText={errors.propertyTaxRate}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Insurance Rate (%)"
                value={dealData.insuranceRate}
                onChange={(e) => handleChange('insuranceRate', e.target.value)}
                error={!!errors.insuranceRate}
                helperText={errors.insuranceRate}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Maintenance (monthly)"
                value={dealData.maintenance}
                onChange={(e) => handleChange('maintenance', e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>

            {/* Property Details Section */}
            <Grid item xs={12}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  mt: 2,
                  fontWeight: 500,
                  color: 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Property Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Bedrooms"
                value={dealData.sfrDetails.bedrooms}
                onChange={(e) => handleChange('sfrDetails.bedrooms', e.target.value)}
                error={!!errors['sfrDetails.bedrooms']}
                helperText={errors['sfrDetails.bedrooms']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Bathrooms"
                value={dealData.sfrDetails.bathrooms}
                onChange={(e) => handleChange('sfrDetails.bathrooms', e.target.value)}
                error={!!errors['sfrDetails.bathrooms']}
                helperText={errors['sfrDetails.bathrooms']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Square Footage"
                value={dealData.sfrDetails.squareFootage}
                onChange={(e) => handleChange('sfrDetails.squareFootage', e.target.value)}
                error={!!errors['sfrDetails.squareFootage']}
                helperText={errors['sfrDetails.squareFootage']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Year Built"
                value={dealData.sfrDetails.yearBuilt}
                onChange={(e) => handleChange('sfrDetails.yearBuilt', e.target.value)}
                error={!!errors['sfrDetails.yearBuilt']}
                helperText={errors['sfrDetails.yearBuilt']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>

            {/* Property Management Section */}
            <Grid item xs={12}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  mt: 2,
                  fontWeight: 500,
                  color: 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Property Management
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Management Fee (%)"
                value={dealData.sfrDetails.propertyManagement.feePercentage}
                onChange={(e) => handleChange('sfrDetails.propertyManagement.feePercentage', e.target.value)}
                error={!!errors['sfrDetails.propertyManagement.feePercentage']}
                helperText={errors['sfrDetails.propertyManagement.feePercentage']}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    marginBottom: '8px',
                    transform: 'translate(14px, -8px) scale(0.75)',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.light',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    }
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -8px) scale(0.75)',
                  },
                  '& .MuiFormHelperText-root': {
                    marginLeft: 0,
                    marginTop: '4px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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

            {/* Long Term Assumptions Section */}
            <Grid item xs={12}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  mt: 2,
                  fontWeight: 500,
                  color: 'text.primary',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  pb: 1
                }}
              >
                Long Term Assumptions
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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

            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                sx={{ 
                  py: 1.5,
                  mt: 2
                }}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Analyze Deal'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default DealForm; 