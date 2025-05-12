import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Alert,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Currency input component - reused from DealForm
const CurrencyInput = ({ value, onChange, label, fullWidth, error, helperText, ...props }) => {
  const formatValue = (val) => {
    if (!val) return '';
    
    // Remove non-numeric characters
    const numericValue = val.toString().replace(/[^0-9]/g, '');
    
    // Format with commas
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(rawValue ? Number(rawValue) : '');
  };

  return (
    <TextField
      label={label}
      value={formatValue(value)}
      onChange={handleChange}
      fullWidth={fullWidth}
      error={error}
      helperText={helperText}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <AttachMoneyIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

// Unit type definition for unit mix
const defaultUnitType = {
  type: '', // e.g., "1BR/1BA", "2BR/2BA"
  count: 1,
  sqft: 0,
  monthlyRent: 0,
};

const MultiFamilyForm = ({ onSubmit, initialData, analysisResult }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Property Information
    propertyName: '',
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    propertyType: 'multifamily', // Fixed for this form
    yearBuilt: new Date().getFullYear(),
    totalUnits: 0,
    
    // Unit Mix (dynamic list of unit types)
    unitTypes: [{ ...defaultUnitType }],
    
    // Financial Details
    purchasePrice: '',
    closingCosts: '',
    downPayment: '',
    loanAmount: '',
    interestRate: 5.0,
    loanTerm: 30,
    propertyTaxRate: 1.2,
    propertyInsurance: '',
    
    // Expenses
    repairsAndMaintenance: '',
    landscaping: '',
    propertyManagement: 8, // percentage of gross income
    utilities: '', // common area utilities
    garbage: '',
    waterSewer: '',
    commonAreaElectricity: '',
    marketingAndAdvertising: '',
    capEx: '', // capital expenditures reserve
    otherExpenses: '',
    
    // Assumptions
    vacancyRate: 5, // percentage
    annualRentGrowth: 3, // percentage
    annualExpenseGrowth: 2, // percentage
    annualPropertyValueGrowth: 3, // percentage
    holdingPeriod: 5, // years
    sellingCosts: 6, // percentage
    brokerCommission: 50, // percentage of first month's rent for tenant placement
  });

  // Update form data if initialData is provided
  useEffect(() => {
    if (initialData) {
      // Default unit types if not provided
      const unitTypes = initialData.unitTypes?.length > 0 
        ? initialData.unitTypes 
        : [{ ...defaultUnitType }];
        
      setFormData({
        ...formData,
        ...initialData,
        unitTypes,
      });
    }
  }, [initialData]);

  // Handle form tab changes
  const handleTabChange = (event, newValue) => {
    // Auto-save form data to localStorage when changing tabs
    try {
      const formKey = 'multiFamilyFormData_temp';
      localStorage.setItem(formKey, JSON.stringify(formData));
      console.log('Auto-saved form data when changing tabs');
    } catch (error) {
      console.error('Error auto-saving form data:', error);
    }
    
    setActiveTab(newValue);
  };

  // Add a useEffect to load any auto-saved data when the component mounts
  useEffect(() => {
    // Check for auto-saved data in localStorage (as a fallback to initialData)
    if (!initialData) {
      try {
        const formKey = 'multiFamilyFormData_temp';
        const savedFormData = localStorage.getItem(formKey);
        
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          console.log('Found auto-saved form data, restoring state');
          
          // Ensure unitTypes is properly structured
          const unitTypes = parsedData.unitTypes?.length > 0 
            ? parsedData.unitTypes 
            : [{ ...defaultUnitType }];
            
          setFormData({
            ...formData,
            ...parsedData,
            unitTypes,
          });
        }
      } catch (error) {
        console.error('Error loading auto-saved form data:', error);
      }
    }
  }, []);

  // Handle input changes for standard fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Handle unit type changes
  const handleUnitTypeChange = (index, field, value) => {
    const updatedUnitTypes = [...formData.unitTypes];
    updatedUnitTypes[index] = {
      ...updatedUnitTypes[index],
      [field]: value,
    };
    
    setFormData({
      ...formData,
      unitTypes: updatedUnitTypes,
    });
    
    // Recalculate total units
    const totalUnits = updatedUnitTypes.reduce((sum, unit) => sum + (unit.count || 0), 0);
    setFormData(prevData => ({
      ...prevData,
      totalUnits,
      unitTypes: updatedUnitTypes,
    }));
  };

  // Add a new unit type
  const handleAddUnitType = () => {
    setFormData({
      ...formData,
      unitTypes: [...formData.unitTypes, { ...defaultUnitType }],
    });
  };

  // Remove a unit type
  const handleRemoveUnitType = (index) => {
    const updatedUnitTypes = formData.unitTypes.filter((_, i) => i !== index);
    
    // Recalculate total units
    const totalUnits = updatedUnitTypes.reduce((sum, unit) => sum + (unit.count || 0), 0);
    
    setFormData({
      ...formData,
      unitTypes: updatedUnitTypes,
      totalUnits,
    });
  };

  // Calculate loan amount when down payment changes
  useEffect(() => {
    if (formData.purchasePrice && formData.downPayment) {
      const loanAmount = Number(formData.purchasePrice) - Number(formData.downPayment);
      setFormData(prevData => ({
        ...prevData,
        loanAmount: loanAmount > 0 ? loanAmount : 0,
      }));
    }
  }, [formData.purchasePrice, formData.downPayment]);

  // Calculate total units when unit types change
  useEffect(() => {
    const totalUnits = formData.unitTypes.reduce((sum, unit) => sum + (Number(unit.count) || 0), 0);
    if (totalUnits !== formData.totalUnits) {
      setFormData(prevData => ({
        ...prevData,
        totalUnits,
      }));
    }
  }, [formData.unitTypes]);

  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.propertyName) errors.propertyName = 'Property name is required';
    if (!formData.propertyAddress) errors.propertyAddress = 'Property address is required';
    if (!formData.propertyCity) errors.propertyCity = 'City is required';
    if (!formData.propertyState) errors.propertyState = 'State is required';
    if (!formData.purchasePrice) errors.purchasePrice = 'Purchase price is required';
    if (!formData.downPayment) errors.downPayment = 'Down payment is required';
    
    // Validation for unit types
    const unitTypeErrors = [];
    formData.unitTypes.forEach((unit, index) => {
      const unitError = {};
      if (!unit.type) unitError.type = 'Unit type is required';
      if (!unit.count || unit.count < 1) unitError.count = 'Count must be at least 1';
      if (!unit.sqft || unit.sqft < 1) unitError.sqft = 'Square footage is required';
      if (!unit.monthlyRent) unitError.monthlyRent = 'Monthly rent is required';
      
      if (Object.keys(unitError).length > 0) {
        unitTypeErrors[index] = unitError;
      }
    });
    
    if (unitTypeErrors.length > 0) {
      errors.unitTypes = unitTypeErrors;
    }
    
    // Check if total units is at least 2 for a multi-family property
    if (formData.totalUnits < 2) {
      errors.totalUnits = 'A multi-family property must have at least 2 units';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate some derived values
      const enhancedFormData = {
        ...formData,
        totalGrossRent: formData.unitTypes.reduce(
          (sum, unit) => sum + (unit.monthlyRent * unit.count || 0), 
          0
        ) * 12,
        totalSqft: formData.unitTypes.reduce(
          (sum, unit) => sum + (unit.sqft * unit.count || 0), 
          0
        ),
      };
      
      onSubmit(enhancedFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting the form: ' + error.message,
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving the deal
  const handleSave = () => {
    try {
      // Generate a deal name if not provided
      const dealName = formData.propertyName || 
        `${formData.totalUnits}-Unit ${formData.propertyCity}, ${formData.propertyState}`;
      
      // Create the deal object
      const deal = {
        name: dealName,
        data: {
          ...formData,
          analysisResult,
        },
        savedAt: new Date().toISOString(),
      };
      
      // Get existing saved deals
      const savedDealsStr = localStorage.getItem('savedDeals');
      let savedDeals = savedDealsStr ? JSON.parse(savedDealsStr) : [];
      
      // Add or update the deal
      const existingDealIndex = savedDeals.findIndex(d => d.name === dealName);
      if (existingDealIndex >= 0) {
        savedDeals[existingDealIndex] = deal;
      } else {
        savedDeals.push(deal);
      }
      
      // Save to localStorage
      localStorage.setItem('savedDeals', JSON.stringify(savedDeals));
      
      setSnackbar({
        open: true,
        message: 'Deal saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving deal:', error);
      setSnackbar({
        open: true,
        message: 'Error saving deal: ' + error.message,
        severity: 'error',
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Render form tabs
  const renderTabs = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<BusinessIcon />} label="Property" />
        <Tab icon={<HomeIcon />} label="Unit Mix" />
        <Tab icon={<AttachMoneyIcon />} label="Financials" />
        <Tab icon={<SettingsIcon />} label="Expenses" />
        <Tab icon={<TrendingUpIcon />} label="Assumptions" />
      </Tabs>
    </Box>
  );

  // Render Property Information tab
  const renderPropertyTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Property Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Property Name"
            name="propertyName"
            value={formData.propertyName}
            onChange={handleInputChange}
            fullWidth
            error={!!formErrors.propertyName}
            helperText={formErrors.propertyName}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Property Address"
            name="propertyAddress"
            value={formData.propertyAddress}
            onChange={handleInputChange}
            fullWidth
            error={!!formErrors.propertyAddress}
            helperText={formErrors.propertyAddress}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="City"
            name="propertyCity"
            value={formData.propertyCity}
            onChange={handleInputChange}
            fullWidth
            error={!!formErrors.propertyCity}
            helperText={formErrors.propertyCity}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="State"
            name="propertyState"
            value={formData.propertyState}
            onChange={handleInputChange}
            fullWidth
            error={!!formErrors.propertyState}
            helperText={formErrors.propertyState}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Zip Code"
            name="propertyZip"
            value={formData.propertyZip}
            onChange={handleInputChange}
            fullWidth
            error={!!formErrors.propertyZip}
            helperText={formErrors.propertyZip}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Year Built"
            name="yearBuilt"
            type="number"
            value={formData.yearBuilt}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 1800, max: new Date().getFullYear() }
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Total Units"
            name="totalUnits"
            type="number"
            value={formData.totalUnits}
            disabled
            fullWidth
            error={!!formErrors.totalUnits}
            helperText={formErrors.totalUnits}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Render Unit Mix tab
  const renderUnitMixTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Unit Mix Configuration</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Add the different unit types in your property (e.g., "1BR/1BA", "2BR/2BA", etc.)
        </Typography>
      </Box>
      
      {formData.unitTypes.map((unitType, index) => (
        <Paper 
          key={index} 
          sx={{ 
            p: 2, 
            mb: 2,
            border: formErrors.unitTypes?.[index] ? `1px solid ${theme.palette.error.main}` : 'none'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Unit Type"
                placeholder="e.g., 1BR/1BA"
                value={unitType.type}
                onChange={(e) => handleUnitTypeChange(index, 'type', e.target.value)}
                fullWidth
                error={!!formErrors.unitTypes?.[index]?.type}
                helperText={formErrors.unitTypes?.[index]?.type}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Count"
                type="number"
                value={unitType.count}
                onChange={(e) => handleUnitTypeChange(index, 'count', Number(e.target.value))}
                fullWidth
                InputProps={{
                  inputProps: { min: 1 }
                }}
                error={!!formErrors.unitTypes?.[index]?.count}
                helperText={formErrors.unitTypes?.[index]?.count}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Square Feet"
                type="number"
                value={unitType.sqft}
                onChange={(e) => handleUnitTypeChange(index, 'sqft', Number(e.target.value))}
                fullWidth
                InputProps={{
                  inputProps: { min: 1 }
                }}
                error={!!formErrors.unitTypes?.[index]?.sqft}
                helperText={formErrors.unitTypes?.[index]?.sqft}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <CurrencyInput
                label="Monthly Rent"
                value={unitType.monthlyRent}
                onChange={(value) => handleUnitTypeChange(index, 'monthlyRent', value)}
                fullWidth
                error={!!formErrors.unitTypes?.[index]?.monthlyRent}
                helperText={formErrors.unitTypes?.[index]?.monthlyRent}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <IconButton 
                color="error" 
                onClick={() => handleRemoveUnitType(index)}
                disabled={formData.unitTypes.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}
      
      <Button 
        startIcon={<AddIcon />} 
        onClick={handleAddUnitType}
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
      >
        Add Unit Type
      </Button>
      
      <Box sx={{ mt: 4, backgroundColor: theme.palette.background.paper, p: 2, borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Total Units</Typography>
            <Typography variant="h6">{formData.totalUnits}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Total Square Feet</Typography>
            <Typography variant="h6">
              {formData.unitTypes.reduce((sum, unit) => sum + (unit.sqft * unit.count || 0), 0).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Avg. Rent/Unit</Typography>
            <Typography variant="h6">
              {formData.totalUnits > 0 
                ? `$${Math.round(formData.unitTypes.reduce((sum, unit) => 
                    sum + (unit.monthlyRent * unit.count || 0), 0) / formData.totalUnits).toLocaleString()}`
                : '$0'}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  // Render Financial Details tab
  const renderFinancialsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Financial Details</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Purchase Price"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={(value) => handleInputChange({ target: { name: 'purchasePrice', value }})}
            fullWidth
            error={!!formErrors.purchasePrice}
            helperText={formErrors.purchasePrice}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Closing Costs"
            name="closingCosts"
            value={formData.closingCosts}
            onChange={(value) => handleInputChange({ target: { name: 'closingCosts', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Down Payment"
            name="downPayment"
            value={formData.downPayment}
            onChange={(value) => handleInputChange({ target: { name: 'downPayment', value }})}
            fullWidth
            error={!!formErrors.downPayment}
            helperText={formErrors.downPayment}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Loan Amount"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={(value) => handleInputChange({ target: { name: 'loanAmount', value }})}
            fullWidth
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Interest Rate (%)"
            name="interestRate"
            type="number"
            value={formData.interestRate}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0, max: 20, step: 0.125 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Loan Term (years)"
            name="loanTerm"
            type="number"
            value={formData.loanTerm}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 1, max: 40 }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Property Tax Rate (%)"
            name="propertyTaxRate"
            type="number"
            value={formData.propertyTaxRate}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0, max: 10, step: 0.01 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <CurrencyInput
            label="Property Insurance (annual)"
            name="propertyInsurance"
            value={formData.propertyInsurance}
            onChange={(value) => handleInputChange({ target: { name: 'propertyInsurance', value }})}
            fullWidth
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Render Expenses tab
  const renderExpensesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Operating Expenses</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Repairs & Maintenance (annual)"
            name="repairsAndMaintenance"
            value={formData.repairsAndMaintenance}
            onChange={(value) => handleInputChange({ target: { name: 'repairsAndMaintenance', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Landscaping (annual)"
            name="landscaping"
            value={formData.landscaping}
            onChange={(value) => handleInputChange({ target: { name: 'landscaping', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Property Management (%)"
            name="propertyManagement"
            type="number"
            value={formData.propertyManagement}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0, max: 20, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Capital Expenditures Reserve (annual)"
            name="capEx"
            value={formData.capEx}
            onChange={(value) => handleInputChange({ target: { name: 'capEx', value }})}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Common Area Utilities</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Water & Sewer (annual)"
            name="waterSewer"
            value={formData.waterSewer}
            onChange={(value) => handleInputChange({ target: { name: 'waterSewer', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Garbage Collection (annual)"
            name="garbage"
            value={formData.garbage}
            onChange={(value) => handleInputChange({ target: { name: 'garbage', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Common Area Electricity (annual)"
            name="commonAreaElectricity"
            value={formData.commonAreaElectricity}
            onChange={(value) => handleInputChange({ target: { name: 'commonAreaElectricity', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CurrencyInput
            label="Marketing & Advertising (annual)"
            name="marketingAndAdvertising"
            value={formData.marketingAndAdvertising}
            onChange={(value) => handleInputChange({ target: { name: 'marketingAndAdvertising', value }})}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <CurrencyInput
            label="Other Expenses (annual)"
            name="otherExpenses"
            value={formData.otherExpenses}
            onChange={(value) => handleInputChange({ target: { name: 'otherExpenses', value }})}
            fullWidth
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Render Assumptions tab
  const renderAssumptionsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Analysis Assumptions</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            These assumptions are used to project future cash flows and returns.
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Vacancy Rate"
            name="vacancyRate"
            type="number"
            value={formData.vacancyRate}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0, max: 100, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Annual Rent Growth"
            name="annualRentGrowth"
            type="number"
            value={formData.annualRentGrowth}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: -10, max: 20, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Annual Expense Growth"
            name="annualExpenseGrowth"
            type="number"
            value={formData.annualExpenseGrowth}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: -5, max: 20, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Annual Property Value Growth"
            name="annualPropertyValueGrowth"
            type="number"
            value={formData.annualPropertyValueGrowth}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: -10, max: 20, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Holding Period"
            name="holdingPeriod"
            type="number"
            value={formData.holdingPeriod}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 1, max: 30 },
              endAdornment: <InputAdornment position="end">years</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Selling Costs"
            name="sellingCosts"
            type="number"
            value={formData.sellingCosts}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              inputProps: { min: 0, max: 15, step: 0.1 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={12}>
          <TextField
            label="Broker Commission (for tenant placement)"
            name="brokerCommission"
            type="number"
            value={formData.brokerCommission}
            onChange={handleInputChange}
            fullWidth
            helperText="Percentage of first month's rent paid to broker for each new tenant placement"
            InputProps={{
              inputProps: { min: 0, max: 100, step: 5 },
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, p: 2, bgcolor: theme.palette.background.paper, borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>What These Assumptions Mean:</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Vacancy Rate:</strong> Expected percentage of time units will be vacant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Annual Rent Growth:</strong> Yearly percentage increase in rental income
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Annual Expense Growth:</strong> Yearly percentage increase in expenses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Broker Commission:</strong> Fee paid to rental agents for finding new tenants
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Property Value Growth:</strong> Yearly percentage increase in property value
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Holding Period:</strong> Number of years you plan to own the property
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Selling Costs:</strong> Percentage of property value paid in selling fees
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderPropertyTab();
      case 1: return renderUnitMixTab();
      case 2: return renderFinancialsTab();
      case 3: return renderExpensesTab();
      case 4: return renderAssumptionsTab();
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Multi-Family Property Analysis
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {renderTabs()}
        {renderTabContent()}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSubmitting || !analysisResult}
          >
            Save Deal
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{ minWidth: 150 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Analyze Deal'
            )}
          </Button>
        </Box>
      </CardContent>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default MultiFamilyForm; 