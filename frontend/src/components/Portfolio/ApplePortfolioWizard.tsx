import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppleCard } from '../ui/AppleComponents';
import { appleColors } from '../../theme/appleDesignSystem';

export const ApplePortfolioWizard: React.FC = () => {
  return (
    <AppleCard padding="large">
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            color: appleColors.gray[900],
            mb: 3
          }}
        >
          Portfolio Creation Wizard
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: appleColors.gray[600],
            lineHeight: 1.6
          }}
        >
          Coming Soon - Create and manage your real estate portfolios 
          with institutional-grade intelligence and analytics.
        </Typography>
      </Box>
    </AppleCard>
  );
};