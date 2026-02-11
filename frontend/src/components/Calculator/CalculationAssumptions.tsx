/**
 * Calculation Assumptions Component
 *
 * Displays the assumptions used in calculator analysis with transparency
 * Includes CTA to create account for customization
 */

import React from 'react';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';

interface Assumption {
  label: string;
  value: string;
  monthlyImpact: number;
}

interface CalculationAssumptionsProps {
  assumptions: {
    vacancyRate: number;
    capExRate: number;
    turnoverFrequency: number;
    managementRate: number;
    hoaFees: number;
    utilities: number;
    monthlyImpacts: {
      vacancy: number;
      capEx: number;
      turnover: number;
      management: number;
      hoa: number;
      utilities: number;
    };
  };
}

export const CalculationAssumptions: React.FC<CalculationAssumptionsProps> = ({ assumptions }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const assumptionsList: Assumption[] = [
    {
      label: 'Vacancy Rate',
      value: `${assumptions.vacancyRate}% annually`,
      monthlyImpact: assumptions.monthlyImpacts.vacancy
    },
    {
      label: 'CapEx Reserve',
      value: `${assumptions.capExRate}% of rent`,
      monthlyImpact: assumptions.monthlyImpacts.capEx
    },
    {
      label: 'Turnover Costs',
      value: `Every ${assumptions.turnoverFrequency} years`,
      monthlyImpact: assumptions.monthlyImpacts.turnover
    },
    {
      label: 'Property Management',
      value: assumptions.managementRate > 0 ? `${assumptions.managementRate.toFixed(2)}%` : 'Self-managed',
      monthlyImpact: assumptions.monthlyImpacts.management
    },
    {
      label: 'HOA Fees',
      value: assumptions.hoaFees > 0 ? `${formatCurrency(assumptions.hoaFees)}/month` : 'None',
      monthlyImpact: assumptions.hoaFees
    },
    {
      label: 'Utilities (owner-paid)',
      value: assumptions.utilities > 0 ? `${formatCurrency(assumptions.utilities)}/month` : 'Tenant pays',
      monthlyImpact: assumptions.utilities
    }
  ];

  return (
    <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        📊 Calculation Assumptions
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        We used these industry-standard assumptions. Your property might be different.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {assumptionsList.map((assumption, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {assumption.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assumption.value}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(assumption.monthlyImpact)}/month
            </Typography>
          </Box>
        ))}
      </Box>

    </Paper>
  );
};
