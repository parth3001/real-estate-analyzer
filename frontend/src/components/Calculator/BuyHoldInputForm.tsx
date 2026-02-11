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
} from '@mui/material';
import Grid from '@mui/system/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { CalculatorFormData } from './types';

interface BuyHoldInputFormProps {
  formData: CalculatorFormData;
  onChange: (field: keyof CalculatorFormData, value: any) => void;
}

export const BuyHoldInputForm: React.FC<BuyHoldInputFormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof CalculatorFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value === '' ? 0 : parseFloat(event.target.value);
    onChange(field, value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Purchase Section - Always Visible */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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

      {/* Long-Term Assumptions Accordion */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Long-Term Assumptions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Projection Years"
                type="number"
                value={formData.longTermAssumptions?.projectionYears || 10}
                onChange={(e) =>
                  onChange('longTermAssumptions', {
                    ...formData.longTermAssumptions,
                    projectionYears: parseInt(e.target.value) || 10,
                  })
                }
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Rent Increase"
                type="number"
                value={formData.longTermAssumptions?.annualRentIncrease || 2}
                onChange={(e) =>
                  onChange('longTermAssumptions', {
                    ...formData.longTermAssumptions,
                    annualRentIncrease: parseFloat(e.target.value) || 2,
                  })
                }
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Property Value Increase"
                type="number"
                value={formData.longTermAssumptions?.annualPropertyValueIncrease || 3}
                onChange={(e) =>
                  onChange('longTermAssumptions', {
                    ...formData.longTermAssumptions,
                    annualPropertyValueIncrease: parseFloat(e.target.value) || 3,
                  })
                }
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Annual Expense Increase"
                type="number"
                value={formData.longTermAssumptions?.annualExpenseIncrease || 2}
                onChange={(e) =>
                  onChange('longTermAssumptions', {
                    ...formData.longTermAssumptions,
                    annualExpenseIncrease: parseFloat(e.target.value) || 2,
                  })
                }
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
