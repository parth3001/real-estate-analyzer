import React from 'react';
import { Box, Typography, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppleCard, AppleButton } from '../components/ui/AppleComponents';
import { appleColors } from '../theme/appleDesignSystem';
import { Apartment } from '@mui/icons-material';

const MFAnalysis: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <AppleCard padding="large">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: appleColors.primary[50],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Apartment sx={{ fontSize: 40, color: appleColors.primary[500] }} />
            </Box>
            
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontWeight: 700,
                color: appleColors.gray[900],
                mb: 1
              }}
            >
              Multi-Family Property Analysis
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: appleColors.gray[700],
                mb: 2
              }}
            >
              Coming Soon
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: appleColors.gray[600],
                maxWidth: '600px',
                lineHeight: 1.6,
                mb: 4
              }}
            >
              The Multi-Family Property analysis feature is currently being rebuilt with enhanced 
              unit mix optimization, detailed financial projections, and comprehensive market intelligence. 
              Please check back soon for a powerful multi-family analysis tool.
            </Typography>
            
            <AppleButton
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </AppleButton>
          </Stack>
        </AppleCard>
      </Box>
    </Container>
  );
};

export default MFAnalysis; 