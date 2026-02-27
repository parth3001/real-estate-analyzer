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
        <link rel="canonical" href="https://reanalyzr.com/" />
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
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Get institutional-grade analysis in 5 minutes—the same 28 metrics institutional investors use to evaluate properties. Not your basic calculator. Free forever for Beta users.
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

        {/* Why REanalyzr Is Different Section */}
        <Box sx={{ mt: 8, mb: 8 }}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 5, textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Why REanalyzr Is Different
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
            {/* Column 1: 5-Minute Analysis */}
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>⚡</Box>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                5-Minute Analysis
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Get a complete investment analysis in 5 minutes—not 2 hours in Excel. Enter your property details and get instant results.
              </Typography>
            </Box>

            {/* Column 2: 28 Professional Metrics */}
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>📊</Box>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                28 Professional Metrics
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return—the same formulas institutional investors use, validated by CPAs for accuracy.
              </Typography>
            </Box>

            {/* Column 3: AI-Powered Confidence */}
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Box sx={{ fontSize: '3rem', mb: 2 }}>🎯</Box>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                AI-Powered Confidence
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                Deal Quality Score (0-100) tells you instantly if this deal meets professional standards. Stop guessing. Start knowing.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* SEO Content Sections */}
        <Box sx={{ mt: 8, mb: 6 }}>
          {/* How It Works Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              How the Rental Property Calculator Works
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.7 }}>
              Our BRRRR calculator and Buy & Hold calculator provide institutional-grade real estate investment analysis in three simple steps:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>1. Enter Property Details:</strong> Input your purchase price, financing terms, and rental income estimates. Our calculator works for single-family rentals, BRRRR strategy properties, and traditional buy-and-hold investments.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>2. Get Professional Metrics:</strong> Instantly calculate cap rate, cash flow, IRR (Internal Rate of Return), DSCR (Debt Service Coverage Ratio), cash-on-cash return, and NOI (Net Operating Income). Our real estate investment calculator uses the same formulas professional investors rely on.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                <strong>3. Analyze Results:</strong> Review your investment property analysis with AI-powered insights and deal quality scoring. Compare BRRRR vs Buy & Hold strategies side-by-side to find the best approach for your investment goals.
              </Typography>
            </Box>
          </Box>

          {/* Why Professional Investors Use This Calculator */}
          <Box sx={{ mb: 6, py: 4, bgcolor: '#f9fafb', borderRadius: 2, px: 3 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Why Professional Investors Use This Real Estate Calculator
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>Cap Rate Calculator Accuracy:</strong> Calculate capitalization rates using institutional formulas. Understand if you're paying a fair price based on NOI and property value.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>Cash Flow Calculator with Operating Expenses:</strong> Factor in property taxes, insurance, HOA fees, utilities, maintenance, and CapEx reserves. Get realistic monthly cash flow projections.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>IRR Calculator for Long-Term Returns:</strong> See your annualized Internal Rate of Return over 10+ years. Compare investment property performance against stocks, bonds, and other asset classes.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                <strong>DSCR Calculator for Financing:</strong> Ensure lenders will approve your rental property loan. DSCR above 1.25x gives you negotiating power with banks.
              </Typography>
              <Typography component="li" variant="body1" sx={{ lineHeight: 1.7 }}>
                <strong>BRRRR Calculator with Refinance Analysis:</strong> Model the Buy, Rehab, Rent, Refinance, Repeat strategy. Calculate forced equity, post-refinance cash flow, and capital recovery timelines.
              </Typography>
            </Box>
          </Box>

          {/* Calculator Features Grid */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
              Investment Property Calculator Features
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  AI Deal Scoring Engine
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Get a 0-100 deal quality score powered by AI analysis. Our investment calculator evaluates cash flow, market conditions, and risk factors to give you clear BUY, NEGOTIATE, or PASS recommendations.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  BRRRR Strategy Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Model the entire BRRRR cycle with our specialized calculator. Track capital recovery, refinance scenarios, and post-rehab property values. See how much capital you can recycle into your next deal.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Multi-Strategy Support
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Switch between Buy & Hold calculator and BRRRR calculator instantly. Compare strategies side-by-side to determine which approach maximizes your ROI for each rental property.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Real-Time Market Data
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Our real estate investment calculator integrates mortgage rates, housing trends, and economic indicators. Make data-driven decisions based on current market conditions.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  10-Year Financial Projections
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Visualize rental income growth, property appreciation, and equity build-up over time. Our investment property calculator shows year-by-year cash flow, NOI, and total returns.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Free with Beta Access
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Join during beta and get unlimited property analysis forever. No credit card required. Save deals, compare properties, and access professional-grade rental property calculator tools.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
              Rental Property Calculator FAQ
            </Typography>
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  How is REanalyzr different from free calculators?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Free calculators give you basic math with generic assumptions. REanalyzr gives you the same 28 professional metrics that institutional investors use—Cap Rate, DSCR, IRR, NOI, Cash-on-Cash Return—plus real-time market data for your specific location. It's the difference between guessing and knowing.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Do I need real estate experience to use this?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  No. REanalyzr is designed for everyone from first-time investors to experienced portfolio builders. Our AI Deal Quality Score (0-100) gives you an instant verdict—this deal is above or below professional standards—so you can make confident decisions in 5 minutes, even if you've never analyzed a property before.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  How accurate is this BRRRR calculator?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Our BRRRR calculator uses institutional-grade formulas validated by professional real estate investors. We model the complete Buy-Rehab-Rent-Refinance-Repeat cycle including capital recovery, forced equity, and post-refinance cash flow. Accuracy depends on your input data quality - use realistic rehab costs and ARV estimates for best results.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  What is a good cap rate for rental property?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Good cap rates typically range from 5-10% depending on market and property class. Our cap rate calculator shows: 8-10%+ = strong cash flow market, 5-7% = appreciation-focused market, below 5% = premium or overheated market. Use our investment property calculator to compare your deal against local market benchmarks.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Can I use this for multi-family properties?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Yes! Our rental property calculator supports single-family homes, duplexes, triplexes, and small multi-family properties. Enter unit-level details for accurate cash flow analysis. Multi-family calculator features include per-unit metrics, vacancy rates, and operating expense ratios.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  What metrics does your investment calculator provide?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Our real estate calculator computes 25+ metrics including: Cap Rate, Cash-on-Cash Return, IRR, DSCR, NOI, Cash Flow, Total ROI, Payback Period, Gross Rent Multiplier, Operating Expense Ratio, Break-Even Occupancy, and Equity Multiple. Both Buy & Hold and BRRRR calculators include 10-year projections.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Do I need to create an account to use the calculator?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  No! Use our rental property calculator instantly without signing up. Anonymous analysis is free and unlimited. Create a free account to save deals, compare properties, and access AI insights. Beta users get lifetime free access to all calculator features.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  How is this different from Excel spreadsheets?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Our investment property calculator integrates real-time market data, provides AI-powered deal scoring, and offers instant analysis (5 minutes vs 2+ hours with Excel). No formulas to debug, no version conflicts. Get professional-grade rental property analysis with built-in validation and investor-friendly visualizations.
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  What is DSCR and why does it matter?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  DSCR (Debt Service Coverage Ratio) measures if rental income covers mortgage payments. Our DSCR calculator helps you qualify for investment property loans. Lenders require 1.25x minimum (Fannie Mae/Freddie Mac standard). Higher DSCR = stronger financing position and better loan terms.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                  Can I analyze fix-and-flip properties?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  Yes! Use our BRRRR calculator for fix-and-flip analysis. Model rehab costs, after-repair value (ARV), holding costs, and sale proceeds. Our calculator shows profit margins, ROI, and annualized returns. Perfect for flippers evaluating deals at auctions or wholesalers.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default LandingPage;
