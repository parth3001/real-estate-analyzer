/**
 * Save Analysis CTA Component
 *
 * Call-to-action for anonymous users to create account and save their analysis
 * Part of anonymous → authenticated conversion flow
 */

import React from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { Analysis } from '../../types/analysis';

interface SaveAnalysisCTAProps {
  analysis: Analysis;
  formData: any;
}

export const SaveAnalysisCTA: React.FC<SaveAnalysisCTAProps> = ({ analysis, formData }) => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    // Navigate to registration page
    // The pending analysis is already saved to localStorage by calculatorService
    navigate('/register');
  };

  const handleLogin = () => {
    // Navigate to login page
    navigate('/login');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        mt: 4,
        p: 3,
        bgcolor: 'primary.50',
        border: '2px solid',
        borderColor: 'primary.main',
      }}
    >
      <Stack spacing={2}>
        {/* Headline */}
        <Box sx={{ textAlign: 'center' }}>
          <SaveIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Save This Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a free account to save this property, track your pipeline, and analyze unlimited deals.
          </Typography>
        </Box>

        {/* Benefits */}
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
          <Stack spacing={1}>
            <BenefitItem icon="✅" text="Save and compare unlimited properties" />
            <BenefitItem icon="📊" text="Build and track your deal pipeline" />
            <BenefitItem icon="🎯" text="Get Investment Decision Engine verdicts" />
            <BenefitItem icon="🤖" text="Access AI-powered market insights" />
            <BenefitItem icon="📈" text="Portfolio analytics and performance tracking" />
          </Stack>
        </Box>

        {/* CTA Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleCreateAccount}
            startIcon={<TrendingUpIcon />}
            sx={{ fontWeight: 600 }}
          >
            Create Free Account
          </Button>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleLogin}
          >
            Already Have Account? Log In
          </Button>
        </Stack>

        {/* Trust Signal */}
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
          Join hundreds of investors using REanalyzr | No credit card required
        </Typography>
      </Stack>
    </Paper>
  );
};

// Helper component for benefit items
const BenefitItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Typography variant="h6" component="span">
      {icon}
    </Typography>
    <Typography variant="body2">{text}</Typography>
  </Box>
);
