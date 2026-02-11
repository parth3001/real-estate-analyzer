/**
 * BRRRR Input Form Component
 *
 * Input form for BRRRR strategy calculator
 * Fields: Purchase, Rehab, ARV, Refinance parameters
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

interface BRRRRInputFormProps {
  formData: CalculatorFormData;
  onChange: (field: keyof CalculatorFormData, value: any) => void;
}

export const BRRRRInputForm: React.FC<BRRRRInputFormProps> = ({ formData, onChange }) => {
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
          />
        </Grid>
      </Grid>

      {/* Rehab Section - BRRRR Specific */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Rehab Costs
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Rehab Budget"
            type="number"
            value={formData.rehabCosts || ''}
            onChange={handleChange('rehabCosts')}
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
            label="After Repair Value (ARV)"
            type="number"
            value={formData.arv || ''}
            onChange={handleChange('arv')}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            required
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
                label="Initial Interest Rate"
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
                label="Initial Loan Term"
                type="number"
                value={formData.loanTerm || ''}
                onChange={handleChange('loanTerm')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  },
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Refinance LTV"
                type="number"
                value={formData.refinanceLTV || ''}
                onChange={handleChange('refinanceLTV')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                }}
                helperText="Typically 70-75% of ARV"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Refinance Interest Rate"
                type="number"
                value={formData.refinanceRate || ''}
                onChange={handleChange('refinanceRate')}
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

      {/* Rental Income Accordion */}
      <Accordion sx={{ mt: 2 }}>
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
      <Accordion sx={{ mt: 2 }}>
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
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Property Management"
                type="number"
                value={formData.propertyManagement || ''}
                onChange={handleChange('propertyManagement')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                helperText="Monthly fee"
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
                helperText="Optional - Leave blank if no HOA"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Monthly Utilities (if owner-paid)"
                type="number"
                value={formData.utilities || ''}
                onChange={handleChange('utilities')}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                }}
                helperText="Optional - Leave blank if tenant pays"
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
    </Box>
  );
};
