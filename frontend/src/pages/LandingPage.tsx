/**
 * Landing Page - Calculator-First Homepage
 *
 * Ultra-minimal landing page with calculator embedded directly
 * Apple-inspired design with positive CTAs to sample analysis
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { UniversalCalculator } from '../components/Calculator';
import PublicHeader from '../components/common/PublicHeader';
import { analytics } from '../utils/analytics';

const LandingPage: React.FC = () => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  return (
    <>
      <Helmet>
        <title>BRRRR & Buy and Hold Calculator - Free Real Estate Analysis | Reanalyzr</title>
        <meta
          name="description"
          content="Analyze rental property deals in 5 minutes with professional-grade metrics. Get deal scores for BRRRR and Buy & Hold strategies. Free calculator with beta access."
        />
        <meta
          name="keywords"
          content="BRRRR calculator, buy and hold calculator, rental property calculator, real estate investment calculator, deal analyzer"
        />
      </Helmet>

      {/* Public Header */}
      <PublicHeader />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Ultra-minimal hero section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            Real Estate Investment Calculator
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              maxWidth: '700px',
              mx: 'auto'
            }}
          >
            Analyze BRRRR and Buy & Hold deals in 5 minutes with professional-grade metrics.
          </Typography>
        </Box>

        {/* Calculator embedded directly */}
        <UniversalCalculator />

        {/* Sample analysis CTA - positive framing */}
        <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 1,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' }
            }}
          >
            Want to see what a full analysis looks like?
          </Typography>
          <MuiLink
            href="/sample-analysis"
            sx={{
              color: '#0071E3',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
          >
            View example analysis from beta investor →
          </MuiLink>
        </Box>
      </Container>
    </>
  );
};

export default LandingPage;
