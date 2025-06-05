import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid as MuiGrid,
  IconButton,
  InputAdornment,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import type { MultiFamilyDealData } from '../../types/deal';
import type { Analysis } from '../../types/analysis';

const Grid = MuiGrid as React.ComponentType<{
  container?: boolean;
  item?: boolean;
  xs?: number;
  md?: number;
  sm?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  key?: React.Key;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
}>;

interface MultiFamilyFormProps {
  onSubmit: (dealData: MultiFamilyDealData) => Promise<void>;
  initialData?: MultiFamilyDealData;
  analysisResult?: Analysis | null;
}

const defaultUnitType = {
  type: '',
  count: 1,
  sqft: 0,
  monthlyRent: 0,
  occupied: 0,
};

const defaultFormData: MultiFamilyDealData = {
  propertyType: 'MF',
  propertyName: '',
  propertyAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
  purchasePrice: 0,
  downPayment: 0,
  interestRate: 0,
  loanTerm: 30,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  propertyManagementRate: 8,
  yearBuilt: new Date().getFullYear(),
  totalUnits: 2,
  totalSqft: 0,
  maintenanceCostPerUnit: 0,
  unitTypes: [defaultUnitType],
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 3,
    sellingCostsPercentage: 6,
    inflationRate: 2,
    vacancyRate: 5,
    capitalExpenditureRate: 0,
    commonAreaMaintenanceRate: 0,
  },
  commonAreaUtilities: {
    electric: 0,
    water: 0,
    gas: 0,
    trash: 0,
  },
};

const MultiFamilyForm: React.FC<MultiFamilyFormProps> = ({ onSubmit, initialData, analysisResult: _analysisResult }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  const [formData, setFormData] = useState<MultiFamilyDealData>(() => initialData || defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value,
    }));
  };

  const handleUnitTypeChange = (index: number, field: keyof typeof defaultUnitType, value: string | number) => {
    setFormData(prev => {
      const updatedUnitTypes = prev.unitTypes.map((unit, i) =>
        i === index ? { ...unit, [field]: value } : unit
      );
      return {
        ...prev,
        unitTypes: updatedUnitTypes,
        totalUnits: updatedUnitTypes.reduce((sum, unit) => sum + (Number(unit.count) || 0), 0),
      };
    });
  };

  const handleAddUnitType = () => {
    setFormData(prev => ({
      ...prev,
      unitTypes: [...prev.unitTypes, { ...defaultUnitType }],
    }));
  };

  const handleRemoveUnitType = (index: number) => {
    setFormData(prev => {
      const updatedUnitTypes = prev.unitTypes.filter((_, i) => i !== index);
      return {
        ...prev,
        unitTypes: updatedUnitTypes,
        totalUnits: updatedUnitTypes.reduce((sum, unit) => sum + (Number(unit.count) || 0), 0),
      };
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.propertyName) errors.propertyName = 'Property name is required';
    if (!formData.propertyAddress.street) errors.street = 'Street is required';
    if (!formData.propertyAddress.city) errors.city = 'City is required';
    if (!formData.propertyAddress.state) errors.state = 'State is required';
    if (!formData.propertyAddress.zipCode) errors.zipCode = 'Zip code is required';
    if (!formData.purchasePrice) errors.purchasePrice = 'Purchase price is required';
    if (!formData.downPayment) errors.downPayment = 'Down payment is required';
    if (formData.totalUnits < 2) errors.totalUnits = 'A multi-family property must have at least 2 units';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form', severity: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSnackbar({ open: true, message: 'Analysis completed successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'An error occurred', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Multi-Family Property Details
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Basic Info" />
            <Tab label="Unit Details" />
            <Tab label="Financials" />
            <Tab label="Assumptions" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property Name"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleInputChange}
                  error={!!formErrors.propertyName}
                  helperText={formErrors.propertyName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="propertyAddress.street"
                  value={formData.propertyAddress.street}
                  onChange={handleInputChange}
                  error={!!formErrors.street}
                  helperText={formErrors.street}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="propertyAddress.city"
                  value={formData.propertyAddress.city}
                  onChange={handleInputChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="State"
                  name="propertyAddress.state"
                  value={formData.propertyAddress.state}
                  onChange={handleInputChange}
                  error={!!formErrors.state}
                  helperText={formErrors.state}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="propertyAddress.zipCode"
                  value={formData.propertyAddress.zipCode}
                  onChange={handleInputChange}
                  error={!!formErrors.zipCode}
                  helperText={formErrors.zipCode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  error={!!formErrors.purchasePrice}
                  helperText={formErrors.purchasePrice}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Down Payment"
                  name="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={handleInputChange}
                  error={!!formErrors.downPayment}
                  helperText={formErrors.downPayment}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Unit Types</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddUnitType}
                    variant="outlined"
                    size="small"
                  >
                    Add Unit Type
                  </Button>
                </Box>
                {formData.unitTypes.map((unit, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Unit Type"
                          value={unit.type}
                          onChange={(e) => handleUnitTypeChange(index, 'type', e.target.value)}
                          placeholder="e.g., 1BR, 2BR"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Count"
                          type="number"
                          value={unit.count}
                          onChange={(e) => handleUnitTypeChange(index, 'count', Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Sq Ft"
                          type="number"
                          value={unit.sqft}
                          onChange={(e) => handleUnitTypeChange(index, 'sqft', Number(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Monthly Rent"
                          type="number"
                          value={unit.monthlyRent}
                          onChange={(e) => handleUnitTypeChange(index, 'monthlyRent', Number(e.target.value))}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton
                            onClick={() => handleRemoveUnitType(index)}
                            disabled={formData.unitTypes.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Interest Rate"
                  name="interestRate"
                  type="number"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Loan Term (Years)"
                  name="loanTerm"
                  type="number"
                  value={formData.loanTerm}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Property Tax Rate"
                  name="propertyTaxRate"
                  type="number"
                  value={formData.propertyTaxRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Insurance Rate"
                  name="insuranceRate"
                  type="number"
                  value={formData.insuranceRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Property Management Rate"
                  name="propertyManagementRate"
                  type="number"
                  value={formData.propertyManagementRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maintenance Cost per Unit"
                  name="maintenanceCostPerUnit"
                  type="number"
                  value={formData.maintenanceCostPerUnit}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Projection Years"
                  name="longTermAssumptions.projectionYears"
                  type="number"
                  value={formData.longTermAssumptions.projectionYears}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Annual Rent Increase"
                  name="longTermAssumptions.annualRentIncrease"
                  type="number"
                  value={formData.longTermAssumptions.annualRentIncrease}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Annual Property Value Increase"
                  name="longTermAssumptions.annualPropertyValueIncrease"
                  type="number"
                  value={formData.longTermAssumptions.annualPropertyValueIncrease}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Selling Costs Percentage"
                  name="longTermAssumptions.sellingCostsPercentage"
                  type="number"
                  value={formData.longTermAssumptions.sellingCostsPercentage}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Inflation Rate"
                  name="longTermAssumptions.inflationRate"
                  type="number"
                  value={formData.longTermAssumptions.inflationRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vacancy Rate"
                  name="longTermAssumptions.vacancyRate"
                  type="number"
                  value={formData.longTermAssumptions.vacancyRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capital Expenditure Rate"
                  name="longTermAssumptions.capitalExpenditureRate"
                  type="number"
                  value={formData.longTermAssumptions.capitalExpenditureRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Common Area Maintenance Rate"
                  name="longTermAssumptions.commonAreaMaintenanceRate"
                  type="number"
                  value={formData.longTermAssumptions.commonAreaMaintenanceRate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {isSubmitting ? 'Analyzing...' : 'Analyze Property'}
            </Button>
          </Box>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default MultiFamilyForm; 