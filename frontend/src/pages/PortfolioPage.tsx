import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { AppleCard } from '../components/ui/AppleComponents';
import { appleColors } from '../theme/appleDesignSystem';

const PortfolioPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <AppleCard padding="large">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              color: appleColors.gray[900],
              mb: 3
            }}
          >
            Portfolio Intelligence
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: appleColors.blue[600],
              fontWeight: 600,
              mb: 4
            }}
          >
            Coming Soon
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: appleColors.gray[600],
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Get institutional-grade portfolio analytics, performance benchmarking, 
            strategic capital allocation recommendations, and risk management tools 
            for your real estate investments.
          </Typography>
        </Box>
      </AppleCard>
    </Container>
  );
};

export default PortfolioPage;