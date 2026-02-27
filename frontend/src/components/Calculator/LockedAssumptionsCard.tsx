/**
 * Locked Assumptions Card Component
 *
 * Displays locked assumptions that free users cannot modify
 * Creates psychological urgency to unlock full analysis
 * Used in both BRRRR and Buy & Hold calculators with different assumptions
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Grid from '@mui/system/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface LockedAssumptionsCardProps {
  strategy: 'brrrr' | 'buy-hold';
  assumptions: {
    // BRRRR-specific
    refinanceLTV?: number;
    refinanceRate?: number;
    vacancy?: number;
    // Buy & Hold-specific
    rentGrowth?: number;
    propertyAppreciation?: number;
    expenseGrowth?: number;
    sellingCosts?: number;
  };
  placementContext: 'early' | 'late'; // For styling differences
}

export const LockedAssumptionsCard: React.FC<LockedAssumptionsCardProps> = ({
  strategy,
  assumptions,
  placementContext,
}) => {
  // BRRRR assumptions configuration
  const brrrAssumptions = [
    {
      label: 'Refinance LTV',
      value: `${assumptions.refinanceLTV}%`,
      question: 'could you negotiate 80%?',
      description: 'Typical range 70-80%',
    },
    {
      label: 'Refinance Rate',
      value: `${assumptions.refinanceRate}%`,
      question: 'what if rates change?',
      description: 'Current market rate',
    },
  ];

  // Buy & Hold assumptions configuration
  const buyHoldAssumptions = [
    {
      label: 'Annual Rent Increase',
      value: `${assumptions.rentGrowth}%`,
      question: 'Is your market growing faster?',
      description: 'per year',
    },
    {
      label: 'Property Appreciation',
      value: `${assumptions.propertyAppreciation}%`,
      question: 'Phoenix is appreciating 8%/year',
      description: 'per year',
    },
    {
      label: 'Annual Expense Increase',
      value: `${assumptions.expenseGrowth}%`,
      question: 'Insurance rising faster?',
      description: 'per year',
    },
    {
      label: 'Selling Costs',
      value: `${assumptions.sellingCosts}%`,
      question: 'Have a discount broker?',
      description: 'of sale price',
    },
  ];

  const displayAssumptions = strategy === 'brrrr' ? brrrAssumptions : buyHoldAssumptions;

  // Different messaging based on strategy and placement
  const getHeading = () => {
    if (strategy === 'brrrr') {
      return 'Key Assumptions Used in This Analysis';
    }
    return 'Long-Term Assumptions Used';
  };

  const getSubheading = () => {
    if (strategy === 'brrrr' && placementContext === 'late') {
      return 'Could You Get Better Terms in YOUR Market?';
    }
    return 'Are These Right for YOUR Market?';
  };

  const getBottomMessage = () => {
    if (strategy === 'brrrr') {
      return 'If your lender offers 80% LTV instead of 75%, you\'d recover $13,750 MORE capital. If rates drop 0.5%, your monthly cash flow could increase $50-100.';
    }
    return 'If your market has 4% rent growth instead of 2%, your 10-year returns could double. Test your actual market assumptions.';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: placementContext === 'late' ? 3 : 2,
        mb: placementContext === 'late' ? 2 : 3,
        p: 3,
        bgcolor: 'info.lighter',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'info.main',
      }}
    >
      {/* Header with lock icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LockOutlinedIcon
          sx={{
            fontSize: '1.5rem',
            color: 'text.secondary',
            mr: 1,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          {getHeading()}
        </Typography>
      </Box>

      {/* Assumptions grid */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {displayAssumptions.map((assumption, index) => (
          <Grid
            key={index}
            size={{ xs: 12, sm: strategy === 'brrrr' ? 4 : 6, md: strategy === 'brrrr' ? 4 : 4 }}
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem', mb: 0.5 }}
              >
                {assumption.label}:
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontSize: '1.125rem', mb: 0.5 }}
              >
                {assumption.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', fontSize: '0.75rem' }}
              >
                ({assumption.question})
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Subheading */}
      <Typography
        variant="body2"
        sx={{
          mt: 2,
          mb: 1,
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: '0.9375rem',
        }}
      >
        {getSubheading()}
      </Typography>

      {/* Bottom message */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: 'text.secondary',
          lineHeight: 1.5,
          fontSize: '0.8125rem',
        }}
      >
        {getBottomMessage()}
      </Typography>
    </Paper>
  );
};
