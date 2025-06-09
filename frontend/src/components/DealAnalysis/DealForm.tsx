import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { DealData, SFRDealData, LongTermAssumptions } from '../../types/deal';
import type { Analysis } from '../../types/analysis';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShowChartIcon from '@mui/icons-material/ShowChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`deal-tabpanel-${index}`}
      aria-labelledby={`deal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface DealFormProps {
  onSubmit: (dealData: DealData) => Promise<void>;
  initialData?: DealData;
  analysisResult?: Analysis | null;
}

const theme = createTheme();

// Default long term assumptions for SFR properties
const DEFAULT_SFR_ASSUMPTIONS: LongTermAssumptions = {
  projectionYears: 10,
  annualRentIncrease: 2,
  annualPropertyValueIncrease: 3,
  sellingCostsPercentage: 6,
  inflationRate: 2,
  vacancyRate: 5,
};

const DealForm: React.FC<DealFormProps> = ({ onSubmit, initialData, analysisResult }) => {
  const [dealData, setDealData] = useState<SFRDealData>(() => {
    if (initialData && initialData.propertyType === 'SFR') {
      // Ensure initialData has longTermAssumptions
      return {
        ...initialData,
        longTermAssumptions: initialData.longTermAssumptions 
          ? { ...initialData.longTermAssumptions } 
          : { ...DEFAULT_SFR_ASSUMPTIONS }
      };
    }
    // Default to SFR data
    return {
      propertyType: 'SFR',
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
      propertyManagementRate: 0,
      yearBuilt: 0,
      monthlyRent: 0,
      squareFootage: 0,
      bedrooms: 0,
      bathrooms: 0,
      maintenanceCost: 0,
      longTermAssumptions: { ...DEFAULT_SFR_ASSUMPTIONS },
      analysisResult: analysisResult || undefined
    };
  });

  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'info' | 'warning'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Always ensure dealData has longTermAssumptions
    setDealData(prev => {
      // If we already have longTermAssumptions defined, no need to change
      if (prev.longTermAssumptions) {
        return prev;
      }
      
      // Otherwise, initialize with default values
      return {
        ...prev,
        longTermAssumptions: DEFAULT_SFR_ASSUMPTIONS
      };
    });
    
    // If initialData is provided and it's an SFR, update with that data
    if (initialData && initialData.propertyType === 'SFR') {
      setDealData({
        ...initialData,
        longTermAssumptions: initialData.longTermAssumptions || DEFAULT_SFR_ASSUMPTIONS
      } as SFRDealData);
    }
  }, [initialData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleChange = (field: string, value: unknown) => {
    setDealData(prev => {
      const newData = { ...prev };
      const fields = field.split('.');
      
      // Special handling for longTermAssumptions
      if (fields[0] === 'longTermAssumptions' && !newData.longTermAssumptions) {
        newData.longTermAssumptions = { ...DEFAULT_SFR_ASSUMPTIONS };
      }
      
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < fields.length - 1; i++) {
        current[fields[i]] = current[fields[i]] !== undefined ? { ...current[fields[i]] as Record<string, unknown> } : {};
        current = current[fields[i]] as Record<string, unknown>;
      }
      current[fields[fields.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Make a deep copy of the dealData to avoid modifying the original state
      const preparedData = { ...dealData };
      
      // Ensure all numeric values are properly converted to numbers for API
      preparedData.purchasePrice = Number(preparedData.purchasePrice) || 0;
      preparedData.downPayment = Number(preparedData.downPayment) || 0;
      preparedData.interestRate = Number(preparedData.interestRate) || 0;
      preparedData.loanTerm = Number(preparedData.loanTerm) || 30;
      preparedData.propertyTaxRate = Number(preparedData.propertyTaxRate) || 0;
      preparedData.insuranceRate = Number(preparedData.insuranceRate) || 0;
      preparedData.propertyManagementRate = Number(preparedData.propertyManagementRate) || 0;
      preparedData.yearBuilt = Number(preparedData.yearBuilt) || 0;
      
      // Ensure longTermAssumptions is defined
      preparedData.longTermAssumptions = preparedData.longTermAssumptions 
        ? { ...preparedData.longTermAssumptions } 
        : { ...DEFAULT_SFR_ASSUMPTIONS };
      
      // Property type specific fields
      preparedData.monthlyRent = Number(preparedData.monthlyRent) || 0;
      preparedData.squareFootage = Number(preparedData.squareFootage) || 0;
      preparedData.bedrooms = Number(preparedData.bedrooms) || 0;
      preparedData.bathrooms = Number(preparedData.bathrooms) || 0;
      
      // Convert monthly maintenanceCost to annual value - this is crucial
      // First ensure it's a valid number, then multiply by 12
      const monthlyMaintenance = Number(preparedData.maintenanceCost) || 0;
      preparedData.maintenanceCost = monthlyMaintenance * 12;
      console.log(`Converting maintenance: Monthly $${monthlyMaintenance} → Annual $${preparedData.maintenanceCost}`);
      
      // Handle long term assumptions
      preparedData.longTermAssumptions.projectionYears = Number(preparedData.longTermAssumptions.projectionYears) || 10;
      preparedData.longTermAssumptions.annualRentIncrease = Number(preparedData.longTermAssumptions.annualRentIncrease) || 2;
      preparedData.longTermAssumptions.annualPropertyValueIncrease = Number(preparedData.longTermAssumptions.annualPropertyValueIncrease) || 3;
      preparedData.longTermAssumptions.sellingCostsPercentage = Number(preparedData.longTermAssumptions.sellingCostsPercentage) || 6;
      preparedData.longTermAssumptions.inflationRate = Number(preparedData.longTermAssumptions.inflationRate) || 2;
      preparedData.longTermAssumptions.vacancyRate = Number(preparedData.longTermAssumptions.vacancyRate) || 5;
      
      console.log('Submitting analysis with data:', preparedData);
      await onSubmit(preparedData);
      
      setSnackbar({
        open: true,
        message: 'Analysis completed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred during analysis',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log("Saving deal with data:", dealData);
      
      // Only save if we have analysis results
      if (!analysisResult) {
        setSnackbar({
          open: true,
          message: 'Please analyze the deal before saving',
          severity: 'warning'
        });
        return;
      }
      
      // Make a deep copy of the dealData to avoid modifying the original state
      const preparedData = { ...dealData };
      
      // Ensure all numeric values are properly converted to numbers for API
      preparedData.purchasePrice = Number(preparedData.purchasePrice) || 0;
      preparedData.downPayment = Number(preparedData.downPayment) || 0;
      preparedData.interestRate = Number(preparedData.interestRate) || 0;
      preparedData.loanTerm = Number(preparedData.loanTerm) || 30;
      preparedData.propertyTaxRate = Number(preparedData.propertyTaxRate) || 0;
      preparedData.insuranceRate = Number(preparedData.insuranceRate) || 0;
      preparedData.propertyManagementRate = Number(preparedData.propertyManagementRate) || 0;
      preparedData.yearBuilt = Number(preparedData.yearBuilt) || 0;
      
      // SFR specific fields
      preparedData.monthlyRent = Number(preparedData.monthlyRent) || 0;
      preparedData.squareFootage = Number(preparedData.squareFootage) || 0;
      preparedData.bedrooms = Number(preparedData.bedrooms) || 0;
      preparedData.bathrooms = Number(preparedData.bathrooms) || 0;
      
      // Convert monthly maintenanceCost to annual value - this is crucial
      // First ensure it's a valid number, then multiply by 12
      const monthlyMaintenance = Number(preparedData.maintenanceCost) || 0;
      preparedData.maintenanceCost = monthlyMaintenance * 12;
      console.log(`Converting maintenance: Monthly $${monthlyMaintenance} → Annual $${preparedData.maintenanceCost}`);
      
      // Ensure longTermAssumptions is defined
      if (!preparedData.longTermAssumptions) {
        preparedData.longTermAssumptions = { ...DEFAULT_SFR_ASSUMPTIONS };
      } else {
        // Create a new object to avoid modifying the existing one
        preparedData.longTermAssumptions = { ...preparedData.longTermAssumptions };
        
        // Handle long term assumptions
        preparedData.longTermAssumptions.projectionYears = Number(preparedData.longTermAssumptions.projectionYears) || 10;
        preparedData.longTermAssumptions.annualRentIncrease = Number(preparedData.longTermAssumptions.annualRentIncrease) || 2;
        preparedData.longTermAssumptions.annualPropertyValueIncrease = Number(preparedData.longTermAssumptions.annualPropertyValueIncrease) || 3;
        preparedData.longTermAssumptions.sellingCostsPercentage = Number(preparedData.longTermAssumptions.sellingCostsPercentage) || 6;
        preparedData.longTermAssumptions.inflationRate = Number(preparedData.longTermAssumptions.inflationRate) || 2;
        preparedData.longTermAssumptions.vacancyRate = Number(preparedData.longTermAssumptions.vacancyRate) || 5;
      }
      
      console.log("Saving prepared data:", preparedData);
      
      // Import the DealService
      const { DealService } = await import('../../services/dealService');
      
      // Save the deal using the service
      const savedDeal = await DealService.saveSFRDeal(preparedData, analysisResult);
      
      if (savedDeal) {
        console.log("Deal saved successfully:", savedDeal);
        setSnackbar({
          open: true,
          message: 'Deal saved successfully to database',
          severity: 'success'
        });
        
        // Force a refresh of the form with the saved data
        // This ensures we have the MongoDB ID for future updates
        if (!dealData.id && savedDeal.id) {
          console.log("New deal created with ID:", savedDeal.id);
          // Update form data with the new ID
          setDealData(prevData => ({
            ...prevData,
            id: savedDeal.id
          }));
        }
      } else {
        throw new Error('Failed to save deal');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save deal',
        severity: 'error'
      });
    }
  };

  // Function to close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Card sx={{ p: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Single-Family Property Analysis
            </Typography>
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab icon={<BusinessIcon />} label="PROPERTY" />
              <Tab icon={<AttachMoneyIcon />} label="FINANCIALS" />
              <Tab icon={<ReceiptIcon />} label="EXPENSES" />
              <Tab icon={<ShowChartIcon />} label="ASSUMPTIONS" />
            </Tabs>

            <form onSubmit={handleSubmit}>
              <TabPanel value={activeTab} index={0}>
                {/* Property Information Section */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={dealData.propertyAddress.street}
                    onChange={(e) => handleChange('propertyAddress.street', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="City"
                    value={dealData.propertyAddress.city}
                    onChange={(e) => handleChange('propertyAddress.city', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="State"
                    value={dealData.propertyAddress.state}
                    onChange={(e) => handleChange('propertyAddress.state', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={dealData.propertyAddress.zipCode}
                    onChange={(e) => handleChange('propertyAddress.zipCode', e.target.value)}
                    required
                  />
                  {dealData.propertyType === 'SFR' && (
                    <>
                      <TextField
                        label="Bedrooms"
                        type="number"
                        value={dealData.bedrooms}
                        onChange={(e) => handleChange('bedrooms', Number(e.target.value))}
                        required
                      />
                      <TextField
                        label="Bathrooms"
                        type="number"
                        value={dealData.bathrooms}
                        onChange={(e) => handleChange('bathrooms', Number(e.target.value))}
                        required
                      />
                      <TextField
                        label="Square Footage"
                        type="number"
                        value={dealData.squareFootage}
                        onChange={(e) => handleChange('squareFootage', Number(e.target.value))}
                        required
                      />
                      <TextField
                        label="Year Built"
                        type="number"
                        value={dealData.yearBuilt}
                        onChange={(e) => handleChange('yearBuilt', Number(e.target.value))}
                        required
                      />
                    </>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {/* Financial Details Section */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <TextField
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    value={dealData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Down Payment"
                    type="number"
                    value={dealData.downPayment}
                    onChange={(e) => handleChange('downPayment', Number(e.target.value))}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Interest Rate"
                    type="number"
                    value={dealData.interestRate}
                    onChange={(e) => handleChange('interestRate', Number(e.target.value))}
                    required
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  {dealData.propertyType === 'SFR' && (
                    <TextField
                      label="Monthly Rent"
                      type="number"
                      value={dealData.monthlyRent}
                      onChange={(e) => handleChange('monthlyRent', Number(e.target.value))}
                      required
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {/* Operating Expenses Section */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <TextField
                    fullWidth
                    label="Property Tax Rate"
                    type="number"
                    value={dealData.propertyTaxRate}
                    onChange={(e) => handleChange('propertyTaxRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Annual property tax rate as a percentage of property value"
                  />
                  <TextField
                    fullWidth
                    label="Insurance Rate"
                    type="number"
                    value={dealData.insuranceRate}
                    onChange={(e) => handleChange('insuranceRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Annual insurance rate as a percentage of property value"
                  />
                  {dealData.propertyType === 'SFR' && (
                    <TextField
                      label="Monthly Maintenance"
                      type="number"
                      value={dealData.maintenanceCost}
                      onChange={(e) => handleChange('maintenanceCost', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  )}
                  <TextField
                    fullWidth
                    label="Management Fee"
                    type="number"
                    value={dealData.propertyManagementRate}
                    onChange={(e) => handleChange('propertyManagementRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {/* Long Term Assumptions Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Annual Rent Increase"
                    type="number"
                    value={dealData.longTermAssumptions?.annualRentIncrease || 0}
                    onChange={(e) => handleChange('longTermAssumptions.annualRentIncrease', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Annual Property Value Increase"
                    type="number"
                    value={dealData.longTermAssumptions?.annualPropertyValueIncrease || 0}
                    onChange={(e) => handleChange('longTermAssumptions.annualPropertyValueIncrease', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Selling Costs"
                    type="number"
                    value={dealData.longTermAssumptions?.sellingCostsPercentage || 0}
                    onChange={(e) => handleChange('longTermAssumptions.sellingCostsPercentage', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Inflation Rate"
                    type="number"
                    value={dealData.longTermAssumptions?.inflationRate || 0}
                    onChange={(e) => handleChange('longTermAssumptions.inflationRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Vacancy Rate"
                    type="number"
                    value={dealData.longTermAssumptions?.vacancyRate || 0}
                    onChange={(e) => handleChange('longTermAssumptions.vacancyRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Projection Years"
                    type="number"
                    value={dealData.longTermAssumptions?.projectionYears || 10}
                    onChange={(e) => handleChange('longTermAssumptions.projectionYears', Number(e.target.value))}
                  />
                </Box>
              </TabPanel>

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  Save Deal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Analyze Deal'}
                </Button>
              </Box>
            </form>
          </Card>
        </Container>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default DealForm; 