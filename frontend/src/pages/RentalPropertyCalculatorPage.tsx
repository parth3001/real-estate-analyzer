/**
 * Rental Property Calculator Page
 * Public landing page with custom hero section and calculator widget.
 * Includes PublicHeader navigation (Blog, Login, Pricing).
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Link as MuiLink, Paper, Stack } from '@mui/material';
import Grid from '@mui/system/Grid';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PublicHeader from '../components/common/PublicHeader';
import { analytics } from '../utils/analytics';
import { appleColors } from '../theme/appleDesignSystem';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How is REanalyzr different from free calculators?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'REanalyzr gives you a structured workflow with 28 professional metrics—Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return—plus Deal Quality Score to help you screen deals based on your own standards and risk tolerance, with real-time market data for your specific location.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a good cap rate for rental property?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Good cap rates typically range from 5-10% depending on market and property class. Our cap rate calculator shows: 8-10%+ = strong cash flow market, 5-7% = appreciation-focused market, below 5% = premium or overheated market.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is DSCR and why does it matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'DSCR (Debt Service Coverage Ratio) measures if rental income covers mortgage payments. Our DSCR calculator helps you qualify for investment property loans. Lenders require 1.25x minimum (Fannie Mae/Freddie Mac standard).',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to create an account to analyze a property?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — start chatting anonymously. You get a full analysis and a few follow-up questions before we ask you to sign up. Signing up is free (no credit card), and your first full analysis workspace is included.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is REanalyzr\'s chat different from typing numbers into a form?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You describe the deal in plain English — paste a listing URL, type an address, or spell out the numbers. The AI runs the same 28-metric institutional underwrite as a form-based calculator, then answers follow-up questions conversationally: stress tests, walk-away price, portfolio comparisons.',
      },
    },
  ],
};

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
          content="Chat-first rental property analysis. Paste a listing or type an address — the AI runs a full 28-metric underwrite in about 30 seconds, then answers stress tests and follow-ups conversationally. Free to start."
        />
        <meta
          name="keywords"
          content="rental property calculator, investment property calculator, real estate calculator, cap rate calculator, cash flow calculator, DSCR calculator, deal analyzer"
        />
        <link rel="canonical" href="https://reanalyzr.com/rental-property-calculator" />
        <meta property="og:title" content="Rental Property Investment Calculator - Free Deal Analysis | REanalyzr" />
        <meta
          property="og:description"
          content="Screen rental deals faster with less guesswork. Structured workflow for analyzing rental properties with Deal Quality Score and portfolio impact insights."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/rental-property-calculator" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
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
            Rental Property Calculator & Deal Analyzer
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
            Analyze rental properties with a structured workflow, screen deals faster with Deal Quality Score, and see how each opportunity fits your investing strategy.
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
            Structured rental property analysis for individual investors.
            Reduce guesswork with a consistent screening framework.
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

        {/* Task #126 (2026-07-26) — chat-first hero replaces the
            UniversalCalculator widget. Keeps this page's SEO equity
            (URL, meta, canonical, FAQ schema, H1s tuned to search
            intent) but funnels the user into the actual product.
            Anonymous chat cap + signup rules apply as everywhere. */}
        <ChatFirstHero
          strategyPrime="Analyze this deal as a buy-and-hold rental. Paste a listing URL or type an address to start."
        />

        {/* Example Analysis CTA */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            mb: 6,
            p: 4,
            bgcolor: appleColors.gray[50],
            borderRadius: '16px'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              mb: 2,
              color: appleColors.gray[700],
              fontSize: { xs: '1rem', sm: '1.125rem' }
            }}
          >
            Want to see what a full analysis looks like?
          </Typography>
          <Button
            variant="outlined"
            href="/sample-analysis"
            sx={{
              borderColor: appleColors.gray[300],
              color: appleColors.gray[900],
              '&:hover': {
                borderColor: appleColors.gray[400],
                bgcolor: appleColors.gray[100]
              },
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: '8px'
            }}
          >
            View example analysis from beta investor →
          </Button>
        </Box>

        {/* Why REanalyzr Is Different */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              color: appleColors.gray[900]
            }}
          >
            Three Problems We Solve
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontSize: '2.5rem', mb: 2 }}>⚡</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: appleColors.gray[900] }}>
                  5-Minute Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600], lineHeight: 1.7 }}>
                  Get a complete investment analysis in 5 minutes—not 2 hours in Excel. Enter your property details and get instant results.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontSize: '2.5rem', mb: 2 }}>📊</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: appleColors.gray[900] }}>
                  Reduce Guesswork
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600], lineHeight: 1.7 }}>
                  Deal Quality Score (0-100) gives you a consistent way to screen rental deals based on your own standards, strategy, and risk tolerance.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontSize: '2.5rem', mb: 2 }}>🎯</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: appleColors.gray[900] }}>
                  Stay Organized
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600], lineHeight: 1.7 }}>
                  Track all your deals in one pipeline. Save analyses, compare properties side-by-side, and never rebuild the same work twice.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* How the Rental Property Calculator Works */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 4,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: appleColors.gray[900]
            }}
          >
            How the Rental Property Calculator Works
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: appleColors.gray[700], lineHeight: 1.8 }}>
            Our BRRRR calculator and Buy & Hold calculator provide structured rental property analysis in three simple steps:
          </Typography>
          <Box component="ol" sx={{ pl: 3, '& li': { mb: 3, color: appleColors.gray[700], lineHeight: 1.8 } }}>
            <li>
              <strong>Enter Property Details:</strong> Input your purchase price, financing terms, and rental income estimates. Our calculator works for single-family rentals, BRRRR strategy properties, and traditional buy-and-hold investments.
            </li>
            <li>
              <strong>Get Professional Metrics:</strong> Instantly calculate cap rate, cash flow, IRR (Internal Rate of Return), DSCR (Debt Service Coverage Ratio), cash-on-cash return, and NOI (Net Operating Income). Our real estate investment calculator uses the same formulas professional investors rely on.
            </li>
            <li>
              <strong>Analyze Results:</strong> Review your investment property analysis with AI-powered insights and deal quality scoring. Compare BRRRR vs Buy & Hold strategies side-by-side to find the best approach for your investment goals.
            </li>
          </Box>
        </Box>

        {/* Why Professional Investors Use This Real Estate Calculator */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 4,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: appleColors.gray[900]
            }}
          >
            Why Professional Investors Use This Real Estate Calculator
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 2.5, color: appleColors.gray[700], lineHeight: 1.8 } }}>
            <li>
              <strong>Cap Rate Calculator Accuracy:</strong> Calculate capitalization rates using institutional formulas. Understand if you're paying a fair price based on NOI and property value.
            </li>
            <li>
              <strong>Cash Flow Calculator with Operating Expenses:</strong> Factor in property taxes, insurance, HOA fees, utilities, maintenance, and CapEx reserves. Get realistic monthly cash flow projections.
            </li>
            <li>
              <strong>IRR Calculator for Long-Term Returns:</strong> See your annualized Internal Rate of Return over 10+ years. Compare investment property performance against stocks, bonds, and other asset classes.
            </li>
            <li>
              <strong>DSCR Calculator for Financing:</strong> Ensure lenders will approve your rental property loan. DSCR above 1.25x gives you negotiating power with banks.
            </li>
            <li>
              <strong>BRRRR Calculator with Refinance Analysis:</strong> Model the Buy, Rehab, Rent, Refinance, Repeat strategy. Calculate forced equity, post-refinance cash flow, and capital recovery timelines.
            </li>
          </Box>
        </Box>

        {/* Investment Property Calculator Features */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 5,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: appleColors.gray[900]
            }}
          >
            Investment Property Calculator Features
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                title: 'AI Deal Scoring Engine',
                description: 'Get a 0-100 deal quality score based on your own standards. Our investment calculator evaluates cash flow, market conditions, and risk factors to help you screen deals with less guesswork.'
              },
              {
                title: 'BRRRR Strategy Analysis',
                description: 'Model the entire BRRRR cycle with our specialized calculator. Track capital recovery, refinance scenarios, and post-rehab property values. See how much capital you can recycle into your next deal.'
              },
              {
                title: 'Multi-Strategy Support',
                description: 'Switch between Buy & Hold calculator and BRRRR calculator instantly. Compare strategies side-by-side to determine which approach maximizes your ROI for each rental property.'
              },
              {
                title: 'Real-Time Market Data',
                description: 'Our real estate investment calculator integrates mortgage rates, housing trends, and economic indicators. Make data-driven decisions based on current market conditions.'
              },
              {
                title: '10-Year Financial Projections',
                description: 'Visualize rental income growth, property appreciation, and equity build-up over time. Our investment property calculator shows year-by-year cash flow, NOI, and total returns.'
              },
              {
                title: 'Deal Pipeline & Portfolio Tracking',
                description: 'Track your deal pipeline from lead to close. See how each property impacts your portfolio goals. Monitor performance, visualize geographic diversification, and get AI-powered insights on portfolio health.'
              },
              {
                title: 'Free with Beta Access',
                description: 'Join during beta and get unlimited property analysis forever. No credit card required. Save deals, compare properties, and access professional-grade rental property calculator tools.'
              }
            ].map((feature, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={index}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: appleColors.gray[900] }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600], lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mt: 10, mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 5,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              color: appleColors.gray[900]
            }}
          >
            Rental Property Calculator FAQ
          </Typography>
          <Box sx={{ '& > div': { mb: 4 } }}>
            {[
              {
                q: 'How is REanalyzr different from free calculators?',
                a: 'REanalyzr gives you a structured workflow with 28 professional metrics—Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return—plus Deal Quality Score to help you screen deals based on your own standards and risk tolerance, with real-time market data for your specific location.'
              },
              {
                q: 'Do I need real estate experience to use this?',
                a: 'No. REanalyzr is designed for everyone from first-time investors to experienced portfolio builders. Our AI Deal Quality Score (0-100) gives you an instant verdict—this deal is above or below professional standards—so you can make confident decisions in 5 minutes, even if you\'ve never analyzed a property before.'
              },
              {
                q: 'How accurate is this BRRRR calculator?',
                a: 'Our BRRRR calculator uses consistent calculation methodology. We model the complete Buy-Rehab-Rent-Refinance-Repeat cycle including capital recovery, forced equity, and post-refinance cash flow. Accuracy depends on your input data quality - use realistic rehab costs and ARV estimates for best results.'
              },
              {
                q: 'What is a good cap rate for rental property?',
                a: 'Good cap rates typically range from 5-10% depending on market and property class. Our cap rate calculator shows: 8-10%+ = strong cash flow market, 5-7% = appreciation-focused market, below 5% = premium or overheated market. Use our investment property calculator to compare your deal against local market benchmarks.'
              },
              {
                q: 'Can I use this for multi-family properties?',
                a: 'Yes! Our rental property calculator supports single-family homes, duplexes, triplexes, and small multi-family properties. Enter unit-level details for accurate cash flow analysis. Multi-family calculator features include per-unit metrics, vacancy rates, and operating expense ratios.'
              },
              {
                q: 'What metrics does your investment calculator provide?',
                a: 'Our real estate calculator computes 25+ metrics including: Cap Rate, Cash-on-Cash Return, IRR, DSCR, NOI, Cash Flow, Total ROI, Payback Period, Gross Rent Multiplier, Operating Expense Ratio, Break-Even Occupancy, and Equity Multiple. Both Buy & Hold and BRRRR calculators include 10-year projections.'
              },
              {
                q: 'Do I need to create an account to use the calculator?',
                a: 'No! Use our rental property calculator instantly without signing up. Anonymous analysis is free and unlimited. Create a free account to save deals, compare properties, and access AI insights. Beta users get lifetime free access to all calculator features.'
              },
              {
                q: 'How is this different from Excel spreadsheets?',
                a: 'Our investment property calculator integrates real-time market data, provides AI-powered deal scoring, and offers instant analysis (5 minutes vs 2+ hours with Excel). No formulas to debug, no version conflicts. Get professional-grade rental property analysis with built-in validation and investor-friendly visualizations.'
              },
              {
                q: 'What is DSCR and why does it matter?',
                a: 'DSCR (Debt Service Coverage Ratio) measures if rental income covers mortgage payments. Our DSCR calculator helps you qualify for investment property loans. Lenders require 1.25x minimum (Fannie Mae/Freddie Mac standard). Higher DSCR = stronger financing position and better loan terms.'
              },
              {
                q: 'Can I analyze fix-and-flip properties?',
                a: 'Yes! Use our BRRRR calculator for fix-and-flip analysis. Model rehab costs, after-repair value (ARV), holding costs, and sale proceeds. Our calculator shows profit margins, ROI, and annualized returns. Perfect for flippers evaluating deals at auctions or wholesalers.'
              }
            ].map((faq, index) => (
              <Box key={index}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: appleColors.gray[900], fontSize: '1.125rem' }}>
                  {faq.q}
                </Typography>
                <Typography variant="body1" sx={{ color: appleColors.gray[700], lineHeight: 1.8 }}>
                  {faq.a}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </>
  );
};

// ===== ChatFirstHero (Task #126) =====
// Replaces the UniversalCalculator widget on public SEO landing pages.
// Anonymous users can start chatting immediately; the same 3-turn cap +
// signup wall from Model #6 applies once they get a score.
const ChatFirstHero: React.FC<{ strategyPrime: string }> = ({ strategyPrime }) => {
  const navigate = useNavigate();
  const openChat = (): void => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('reanalyzr.chat.sessionId');
      // Seed the composer with a strategy-appropriate opener the user
      // can edit before sending — Option A locked (see PR discussion).
      sessionStorage.setItem('reanalyzr.chat.prefill', strategyPrime);
    }
    navigate('/app');
  };
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        border: '1px solid',
        borderColor: appleColors.gray[200],
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        textAlign: 'center',
      }}
    >
      <ChatBubbleOutlineIcon
        sx={{ fontSize: 44, color: appleColors.primary[500], mb: 2 }}
      />
      <Typography
        sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, mb: 1.5 }}
      >
        Describe your deal to the AI.
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 15, md: 16 },
          color: appleColors.gray[700],
          maxWidth: 560,
          mx: 'auto',
          mb: 3.5,
          lineHeight: 1.6,
        }}
      >
        Paste a listing URL, type an address, or spell out the numbers.
        The AI runs the full 28-metric underwrite in about 30 seconds and
        answers whatever you ask next — stress tests, walk-away price,
        portfolio fit.
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
      >
        <Button
          variant="contained"
          size="large"
          onClick={openChat}
          startIcon={<ChatBubbleOutlineIcon />}
          sx={{
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Start analyzing free
        </Button>
        <Button
          variant="outlined"
          size="large"
          href="/sample-analysis"
          sx={{
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          See how it works
        </Button>
      </Stack>
      <Typography
        sx={{ fontSize: 13, color: appleColors.gray[500], mt: 3 }}
      >
        Free to start · No credit card · First full analysis included
      </Typography>
    </Paper>
  );
};

export default RentalPropertyCalculatorPage;
