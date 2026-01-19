import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { formatCurrency } from '../../utils/formatters';

interface PropertyDataForVerification {
  monthlyRent?: number;
  propertyTax?: number;    // Annual
  insurance?: number;      // Annual
  maintenance?: number;    // Monthly
}

interface VerificationGuideProps {
  propertyData: PropertyDataForVerification;
}

/**
 * VerificationGuide Component
 *
 * Displays 3-step property-specific verification checklist.
 * Values are dynamically populated from property data.
 *
 * Steps:
 * 1. Monthly Rent verification
 * 2. Operating Expenses verification (tax + insurance + maintenance)
 * 3. Property Condition inspection recommendation
 *
 * Mobile: Expanded by default (critical verification info)
 */
const VerificationGuide: React.FC<VerificationGuideProps> = ({ propertyData }) => {
  // Calculate monthly operating expenses
  const monthlyTax = (propertyData.propertyTax || 0) / 12;
  const monthlyInsurance = (propertyData.insurance || 0) / 12;
  const monthlyMaintenance = propertyData.maintenance || 0;
  const totalMonthlyExpenses = monthlyTax + monthlyInsurance + monthlyMaintenance;

  const verificationSteps = [
    {
      id: 1,
      title: `Monthly Rent (${propertyData.monthlyRent ? formatCurrency(propertyData.monthlyRent) : '$0'} assumed)`,
      description: 'Confirm with property managers and current market listings',
      hasValue: !!propertyData.monthlyRent,
    },
    {
      id: 2,
      title: `Operating Expenses (${formatCurrency(totalMonthlyExpenses)}/month assumed)`,
      description: 'Verify property tax, insurance, and maintenance costs',
      hasValue: totalMonthlyExpenses > 0,
    },
    {
      id: 3,
      title: 'Property Condition (Average condition assumed)',
      description: 'Schedule professional inspection. Budget: $400-600',
      hasValue: true, // Always show
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: appleColors.blue[50],
        borderRadius: '12px',
        border: `1px solid ${appleColors.blue[200]}`,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          fontSize: '16px',
          color: appleColors.blue[800],
          mb: 2,
        }}
      >
        Professional Verification Guide
      </Typography>

      <List dense sx={{ p: 0 }}>
        {verificationSteps.map((step) => (
          <ListItem
            key={step.id}
            sx={{
              px: 0,
              py: 1,
              alignItems: 'flex-start',
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 20,
                  color: step.hasValue ? appleColors.blue[600] : appleColors.gray[400],
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: appleColors.gray[900],
                    fontSize: '14px',
                    mb: 0.5,
                  }}
                >
                  {step.title}
                </Typography>
              }
              secondary={
                <Typography
                  variant="caption"
                  sx={{
                    color: appleColors.gray[700],
                    fontSize: '13px',
                    lineHeight: 1.4,
                  }}
                >
                  {step.description}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Disclaimer */}
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${appleColors.blue[200]}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: appleColors.gray[600],
            fontSize: '12px',
            fontStyle: 'italic',
            display: 'block',
          }}
        >
          Always verify assumptions with local experts before making investment decisions.
        </Typography>
      </Box>
    </Box>
  );
};

export default VerificationGuide;
