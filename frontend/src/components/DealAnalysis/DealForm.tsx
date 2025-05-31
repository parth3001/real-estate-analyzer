import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Slider,
  Theme,
  ThemeOptions,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Analysis } from '../../types/analysis';
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface DealFormProps {
  onSubmit: (dealData: any) => Promise<void>;
  initialData?: any;
  analysisResult?: Analysis | null;
}

interface DealData {
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  propertyType: string;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  capitalInvestment: number;
  monthlyRent: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenance: number;
  sfrDetails: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    condition: string;
    propertyManagement: {
      feePercentage: number;
    };
    tenantTurnover: {
      assumedAnnualTurnover: boolean;
      realtorCommissionMonths: number;
      prepFeesMonths: number;
    };
    longTermAssumptions: {
      projectionYears: number;
      annualRentIncrease: number;
      annualPropertyValueIncrease: number;
      sellingCostsPercentage: number;
      inflationRate: number;
      vacancyRate: number;
    };
  };
}

const theme: ThemeOptions = {
  palette: {
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5'
    },
    secondary: {
      main: '#10B981',
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
          borderRadius: '8px',
          textTransform: 'none' as const,
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

const DealForm: React.FC<DealFormProps> = ({ onSubmit, initialData = {}, analysisResult = null }) => {
  const [dealData, setDealData] = useState<DealData>(() => ({
    propertyAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    propertyType: 'single_family',
    purchasePrice: 0,
    downPayment: 0,
    interestRate: 0,
    loanTerm: 30,
    capitalInvestment: 0,
    monthlyRent: 0,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maintenance: 0,
    sfrDetails: {
      bedrooms: 0,
      bathrooms: 0,
      squareFootage: 0,
      yearBuilt: 0,
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
  }));

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'info' | 'warning'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDealData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleChange = (field: string, value: any) => {
    setDealData(prev => {
      const newData = { ...prev };
      const fields = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < fields.length - 1; i++) {
        current[fields[i]] = { ...current[fields[i]] };
        current = current[fields[i]];
      }
      
      current[fields[fields.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(dealData);
      setSnackbar({
        open: true,
        message: 'Analysis completed successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={createTheme(theme)}>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Bedrooms"
                    type="number"
                    value={dealData.sfrDetails.bedrooms}
                    onChange={(e) => handleChange('sfrDetails.bedrooms', Number(e.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="Bathrooms"
                    type="number"
                    value={dealData.sfrDetails.bathrooms}
                    onChange={(e) => handleChange('sfrDetails.bathrooms', Number(e.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="Square Footage"
                    type="number"
                    value={dealData.sfrDetails.squareFootage}
                    onChange={(e) => handleChange('sfrDetails.squareFootage', Number(e.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="Year Built"
                    type="number"
                    value={dealData.sfrDetails.yearBuilt}
                    onChange={(e) => handleChange('sfrDetails.yearBuilt', Number(e.target.value))}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {/* Financial Details Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                  <TextField
                    fullWidth
                    label="Monthly Rent"
                    type="number"
                    value={dealData.monthlyRent}
                    onChange={(e) => handleChange('monthlyRent', Number(e.target.value))}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {/* Operating Expenses Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                  <TextField
                    fullWidth
                    label="Monthly Maintenance"
                    type="number"
                    value={dealData.maintenance}
                    onChange={(e) => handleChange('maintenance', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Management Fee"
                    type="number"
                    value={dealData.sfrDetails.propertyManagement.feePercentage}
                    onChange={(e) => handleChange('sfrDetails.propertyManagement.feePercentage', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
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
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {/* Long Term Assumptions Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Annual Rent Increase"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.annualRentIncrease}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.annualRentIncrease', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Annual Property Value Increase"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.annualPropertyValueIncrease}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.annualPropertyValueIncrease', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Selling Costs"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.sellingCostsPercentage}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.sellingCostsPercentage', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Inflation Rate"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.inflationRate}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.inflationRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Vacancy Rate"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.vacancyRate}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.vacancyRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Projection Years"
                    type="number"
                    value={dealData.sfrDetails.longTermAssumptions.projectionYears}
                    onChange={(e) => handleChange('sfrDetails.longTermAssumptions.projectionYears', Number(e.target.value))}
                  />
                </Box>
              </TabPanel>

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleChange('savedDeal', true)}
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default DealForm; 