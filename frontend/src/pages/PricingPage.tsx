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
      question: 'Is this really free forever?',
      answer: 'Yes. Join during beta and you keep $0/month pricing forever—even when we launch paid plans in Q3 2026. No credit card required. No strings attached.'
    },
    {
      question: 'What\'s included in "institutional-grade analysis"?',
      answer: 'You get the same 28 professional metrics that Wall Street uses: Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return, Gross Rent Multiplier, Debt Yield, Break-Even Occupancy, Operating Expense Ratio, and more. Plus real-time economic data from FRED and Census demographics for every US market.'
    },
    {
      question: 'What does "unlimited" really mean?',
      answer: 'Analyze as many properties as you want. Save all your deals. Track your entire pipeline. No artificial limits. No hidden fees. No "gotchas."'
    },
    {
      question: 'Why are you offering this for free?',
      answer: 'We\'re in beta and building the future of real estate analysis. Your feedback helps us create a better product. In exchange, early adopters get free access forever as a thank you for helping us improve.'
    },
    {
      question: 'Can I use this without creating an account?',
      answer: 'Yes! Use our public calculator for unlimited free analysis without signing up. Create an account to save your work, track deals over time, and access portfolio insights.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: appleColors.gray[50] }}>
      {/* Sticky Header */}
      <StickyHeader />

      {/* SEO Meta Tags */}
      <Helmet>
        <title>Free Beta Access - REanalyzr | Lock In $0/Month Forever</title>
        <meta
          name="description"
          content="Join REanalyzr beta and get institutional-grade real estate analysis free forever. Early adopters keep $0/month pricing even after paid plans launch in Q3 2026. No credit card required."
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
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              color: appleColors.gray[900],
              mb: 2,
              letterSpacing: '-0.02em'
            }}
          >
            Join Our Beta — Get Lifetime Free Access
          </Typography>

          {/* Page Subtitle */}
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontSize: { xs: '1.125rem', md: '1.375rem' },
              fontWeight: 400,
              color: appleColors.gray[600],
              mb: { xs: 6, md: 8 },
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            We're building the future of real estate investment analysis. Help us shape the product and lock in <Box component="span" sx={{ fontWeight: 600, color: appleColors.green[600] }}>$0/month pricing forever</Box>.
          </Typography>

          {/* Single Pricing Card - Centered */}
          <Box
            sx={{
              mb: { xs: 8, md: 12 },
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            <PricingCard
              tier="beta"
              title="Institutional-Grade Analysis"
              price="$0"
              priceUnit="per month, forever"
              badge="🎉 FREE BETA ACCESS"
              features={features}
              ctaLabel="Sign Up Free — Lock In $0 Forever"
              ctaAction={() => navigate('/register')}
              isPrimary={true}
              scarcityMessage={{
                primary: "🔒 Early adopters keep free access forever, even after we launch paid plans in Q3 2026",
                secondary: "No credit card required • Full access immediately"
              }}
            />
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
