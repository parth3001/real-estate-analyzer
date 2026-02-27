import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Typography } from '@mui/material';
import Grid from '@mui/system/Grid';
import { useNavigate } from 'react-router-dom';
import { appleColors } from '../theme/appleDesignSystem';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';
import PricingCard from '../components/Pricing/PricingCard';
import PricingFAQ from '../components/Pricing/PricingFAQ';
import type { FAQItem } from '../components/Pricing/PricingFAQ';
import { analytics } from '../utils/analytics';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('pricing');
  }, []);

  // Both tiers have IDENTICAL features - only difference is price
  const features = [
    'Unlimited property analyses',
    'Single-family & multi-family properties (2-32 units)',
    '28 professional metrics (Cap Rate, DSCR, IRR, NOI, Cash-on-Cash)',
    'Real-time market intelligence (FRED + Census data)',
    'AI Deal Quality Score (0-100 professional benchmarking)',
    'Buy & Hold + BRRRR strategy analysis',
    'Track your deal pipeline from lead to close',
    'See deal impact to your portfolio goals',
    'Save and compare unlimited deals'
  ];

  const faqItems: FAQItem[] = [
    {
      question: 'What happens when beta ends?',
      answer: 'If you join during beta, you pay $0/month forever. No strings attached.\nNew users after launch pay $14.99/month.'
    },
    {
      question: 'What\'s included in "professional metrics"?',
      answer: 'You get the same 28 institutional-grade metrics that institutional investors use: Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return, Gross Rent Multiplier, Debt Yield, Break-Even Occupancy, Operating Expense Ratio, and more. Plus real-time market intelligence from FRED economic data and Census demographics.'
    },
    {
      question: 'Do I need a credit card?',
      answer: 'No. Create your free account and start analyzing deals immediately.'
    },
    {
      question: 'What\'s included in "unlimited analysis"?',
      answer: 'Analyze as many properties as you want. Save all your deals.\nNo artificial limits. No hidden fees.'
    },
    {
      question: 'Can I use this without creating an account?',
      answer: 'Yes! Use our anonymous calculator for unlimited free analysis.\nCreate an account to save your work and access saved deals anytime.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: appleColors.gray[50] }}>
      {/* Sticky Header */}
      <StickyHeader />

      {/* SEO Meta Tags */}
      <Helmet>
        <title>Pricing - REanalyzr | Free Beta Access</title>
        <meta
          name="description"
          content="Join REanalyzr beta and get free access forever. Professional real estate analysis for $0/month. Lock in before $14.99/month public launch."
        />
        <link rel="canonical" href="https://reanalyzr.com/pricing" />
      </Helmet>

      {/* Main Content */}
      <Box
        sx={{
          pt: { xs: 10, md: 12 },
          pb: { xs: 8, md: 12 },
          px: 3
        }}
      >
        <Container maxWidth="lg">
          {/* Page Title */}
          <Typography
            variant="h1"
            sx={{
              textAlign: 'center',
              fontSize: { xs: '2.5rem', md: '3rem' },
              fontWeight: 700,
              color: appleColors.gray[900],
              mb: 2,
              letterSpacing: '-0.02em'
            }}
          >
            Professional Analysis. Accessible Pricing.
          </Typography>

          {/* Page Subtitle */}
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              fontWeight: 400,
              color: appleColors.gray[600],
              mb: { xs: 6, md: 8 },
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.5
            }}
          >
            The tools that Wall Street uses cost $50,000+/year. REanalyzr gives you the same analysis—free forever when you join during Beta.
          </Typography>

          {/* Pricing Cards */}
          <Grid
            container
            spacing={{ xs: 3, md: 4 }}
            sx={{
              mb: { xs: 8, md: 12 },
              maxWidth: '1000px',
              mx: 'auto'
            }}
          >
            {/* Beta Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <PricingCard
                tier="beta"
                title="Beta Access"
                price="FREE"
                priceUnit="Forever"
                badge="🎉 LIMITED TIME"
                features={features}
                ctaLabel="Claim Free Beta Access"
                ctaAction={() => navigate('/register')}
                isPrimary={true}
                scarcityMessage={{
                  primary: "Limited beta spots — may close anytime",
                  secondary: "Beta members keep $0/mo pricing forever, even after we launch paid plans."
                }}
              />
            </Grid>

            {/* Post-Launch Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <PricingCard
                tier="post-launch"
                title="Professional"
                price="$14.99"
                priceUnit="per month"
                badge="AFTER BETA ENDS"
                features={features}
                hideButton={true}
                replacementText="Available when beta ends"
                isPrimary={false}
              />
            </Grid>
          </Grid>

          {/* Clarification Text - Apple Deference Principle */}
          <Box
            sx={{
              textAlign: 'center',
              mb: { xs: 8, md: 12 },
              px: 3,
              maxWidth: '700px',
              mx: 'auto'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.938rem', md: '1.063rem' },
                color: appleColors.gray[600],
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Both plans include identical features. The only difference is price:
              <Box
                component="span"
                sx={{
                  color: appleColors.gray[900],
                  fontWeight: 600,
                  display: { xs: 'block', sm: 'inline' },
                  mt: { xs: 1, sm: 0 }
                }}
              >
                {' '}Beta users pay $0/month forever and keep lifetime free access to all current features. New users after launch pay $14.99/month.
              </Box>
            </Typography>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 600,
                color: appleColors.gray[900],
                mb: { xs: 4, md: 6 }
              }}
            >
              Frequently Asked Questions
            </Typography>
            <PricingFAQ items={faqItems} />
          </Box>

          {/* Bottom CTA */}
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, md: 6 },
              px: 3,
              backgroundColor: appleColors.primary[50],
              borderRadius: '16px',
              border: `1px solid ${appleColors.primary[200]}`
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: appleColors.gray[900],
                mb: 2
              }}
            >
              Ready to Get Started?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.125rem' },
                color: appleColors.gray[700],
                mb: 3,
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Join beta now and lock in $0/month forever. No credit card required.
            </Typography>
            <Box
              component="button"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: appleColors.green[500],
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: { xs: '14px 28px', md: '16px 32px' },
                fontSize: { xs: '1rem', md: '1.125rem' },
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: appleColors.green[600],
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }
              }}
            >
              Create Free Account
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PricingPage;
