/**
 * Buy & Hold Input Form Component
 *
 * Input form for traditional Buy & Hold strategy
 * Fields: Purchase, Financing, Rental Income, Operating Expenses
 */

import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Button,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { CalculatorFormData } from './types';

interface BuyHoldInputFormProps {
  formData: CalculatorFormData;
  onChange: (field: keyof CalculatorFormData, value: any) => void;
  onCalculate: () => void;
  loading: boolean;
}

export const BuyHoldInputForm: React.FC<BuyHoldInputFormProps> = ({ formData, onChange, onCalculate, loading }) => {
  const handleChange = (field: keyof CalculatorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? 0 : parseFloat(event.target.value);
    onChange(field, value);
  };

  const handleTextChange = (field: keyof CalculatorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(field, event.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Property Address Section - Optional */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Property Identification (Optional)
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Property Address (Optional)"
            type="text"
            value={formData.propertyAddress || ''}
            onChange={handleTextChange('propertyAddress')}
            placeholder="1234 Main St, Austin, TX 78701"
            helperText="Add an address to easily identify this property in your PDF analysis"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">📍</InputAdornment>,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Purchase Section - Always Visible */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Purchase Details
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Purchase Price"
            type="number"
            value={formData.purchasePrice || ''}
            onChange={handleChange('purchasePrice')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Down Payment"
            type="number"
            value={formData.downPayment || ''}
            onChange={handleChange('downPayment')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Closing Costs"
            type="number"
            value={formData.closingCosts || ''}
            onChange={handleChange('closingCosts')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            helperText="Typical: 2-3% of purchase price"
          />
        </Grid>
      </Grid>

      {/* Financing Accordion - Progressive Disclosure */}
      <Accordion defaultExpanded sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Financing</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Interest Rate"
                type="number"
                value={formData.interestRate || ''}
                onChange={handleChange('interestRate')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Loan Term"
                type="number"
                value={formData.loanTerm || ''}
                onChange={handleChange('loanTerm')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  },
                }}
                helperText="Typical: 30 years"
                required
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Rental Income Accordion */}
      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Rental Income</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={formData.monthlyRent || ''}
                onChange={handleChange('monthlyRent')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Vacancy Rate"
                type="number"
                value={formData.vacancy || ''}
                onChange={handleChange('vacancy')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
                helperText="Typical: 5-8%"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Operating Expenses Accordion */}
      <Accordion defaultExpanded sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Operating Expenses</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Property Tax"
                type="number"
                value={formData.propertyTax || ''}
                onChange={handleChange('propertyTax')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Insurance"
                type="number"
                value={formData.insurance || ''}
                onChange={handleChange('insurance')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Maintenance"
                type="number"
                value={formData.maintenance || ''}
                onChange={handleChange('maintenance')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                helperText="Typical: 1% of property value annually"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Property Management"
                type="number"
                value={formData.propertyManagement || ''}
                onChange={handleChange('propertyManagement')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                helperText="Typical: 8-10% of rent"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly HOA Fees"
                type="number"
                value={formData.hoaFees || ''}
                onChange={handleChange('hoaFees')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Utilities (if paid by landlord)"
                type="number"
                value={formData.utilities || ''}
                onChange={handleChange('utilities')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly CapEx (Capital Expenditures)"
                type="number"
                value={formData.monthlyCapEx || ''}
                onChange={handleChange('monthlyCapEx')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                helperText="Reserve for major repairs (roof, HVAC). Typical: 5-10% of rent"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Calculate Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={onCalculate}
          disabled={loading || !formData.purchasePrice || !formData.monthlyRent || !formData.downPayment}
          sx={{
            minWidth: '200px',
            height: '56px',
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
              Calculating...
            </>
          ) : (
            'Calculate'
          )}
        </Button>
      </Box>
    </Box>
  );
};
