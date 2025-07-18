// Market Data Page
// Displays market intelligence and trends data

import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { AppleCard } from '../components/ui/AppleComponents';

const MarketDataPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Market Intelligence
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Real-time market data and intelligence for informed investment decisions.
        </Typography>

        <AppleCard padding="large">
          <Box textAlign="center" py={8}>
            <Typography variant="h5" gutterBottom>
              Market Intelligence Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Coming soon! This page will display comprehensive market data, trends, and intelligence.
            </Typography>
          </Box>
        </AppleCard>
      </Box>
    </Container>
  );
};

export default MarketDataPage;