/**
 * Rental Property Calculator Page
 * Public landing page with custom hero section and calculator widget.
 * Includes PublicHeader navigation (Blog, Login, Pricing).
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Typography } from '@mui/material';
import { UniversalCalculator } from '../components/Calculator';
import PublicHeader from '../components/common/PublicHeader';
import { analytics } from '../utils/analytics';
import { appleColors } from '../theme/appleDesignSystem';

const RentalPropertyCalculatorPage: React.FC = () => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('rental_property_calculator');
  }, []);

  return (
    <>
      <Helmet>
        <title>Rental Property Investment Calculator - Free Deal Analysis | REanalyzr</title>
        <meta
          name="description"
          content="Analyze rental properties in minutes using 28 professional investment metrics. Get Deal Quality Scores that show if your deal meets institutional investment standards. Free calculator."
        />
        <meta
          name="keywords"
          content="rental property calculator, investment property calculator, real estate calculator, cap rate calculator, cash flow calculator, DSCR calculator, deal analyzer"
        />
        <link rel="canonical" href="https://reanalyzr.com/rental-property-calculator" />
        <meta property="og:title" content="Rental Property Investment Calculator - Free Deal Analysis | REanalyzr" />
        <meta
          property="og:description"
          content="Analyze rental properties in minutes using 28 professional investment metrics. Get Deal Quality Scores that show if your deal meets institutional investment standards."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/rental-property-calculator" />
      </Helmet>

      {/* Public Header with Navigation */}
      <PublicHeader />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          {/* H1 - Main Heading */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
              lineHeight: 1.1,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em'
            }}
          >
            Rental Property Investment Calculator
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 400,
              mb: 2,
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.375rem' },
              lineHeight: 1.5,
              color: appleColors.gray[700],
              maxWidth: '900px',
              mx: 'auto'
            }}
          >
            Analyze rental properties in minutes using 28 professional investment metrics and instantly see a Deal Quality Score that tells you if the deal meets institutional investment standards.
          </Typography>

          {/* Supporting Line */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.938rem', sm: '1rem' },
              color: appleColors.gray[600],
              fontWeight: 500,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Institutional-grade rental property analysis for individual investors.
            Not just numbers — understand if your deal is actually worth buying.
          </Typography>

          {/* Subtle Divider */}
          <Box
            sx={{
              width: { xs: '60px', md: '80px' },
              height: '2px',
              backgroundColor: appleColors.gray[300],
              mx: 'auto',
              mt: 4,
              mb: 4
            }}
          />
        </Box>

        {/* Calculator */}
        <UniversalCalculator />
      </Container>
    </>
  );
};

export default RentalPropertyCalculatorPage;
