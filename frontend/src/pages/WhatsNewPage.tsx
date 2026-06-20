/**
 * What's New / Release Notes Page
 *
 * Marketing Expert Approach:
 * - User-facing, benefit-oriented language
 * - Clear value propositions for each feature
 * - Visual showing product evolution
 * - Highlight ROI and time savings
 * - Competitive advantages emphasized
 * - Use engaging, action-oriented copy
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { appleColors } from '../theme/appleDesignSystem';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';

const WhatsNewPage: React.FC = () => {
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        {/* Primary Meta Tags */}
        <title>What's New - REanalyzr v4.2 | BRRRR Strategy Analysis Live</title>
        <meta
          name="title"
          content="What's New - REanalyzr v4.2 | BRRRR Strategy Analysis Live"
        />
        <meta
          name="description"
          content="Discover the latest features in REanalyzr v4.2: BRRRR strategy analysis now live! Plus simplified property wizard, unified analysis experience, and more. House hacking coming Q1 2026."
        />
        <meta
          name="keywords"
          content="real estate software updates, rental property calculator features, investment analysis tools, property analyzer changelog, REanalyzr updates, BRRRR analysis calculator, capital recovery rate, house hacking calculator, multi-family analysis, refinance calculator"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/whats-new" />
        <meta
          property="og:title"
          content="What's New in REanalyzr v4.2 - BRRRR Strategy Analysis Live"
        />
        <meta
          property="og:description"
          content="REanalyzr v4.2 brings BRRRR strategy analysis with capital recycling metrics. Plus v4.1 simplified wizard and unified experience. House hacking coming Q1 2026."
        />
        <meta property="og:image" content="https://reanalyzr.com/og-image-whats-new.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://reanalyzr.com/whats-new" />
        <meta
          property="twitter:title"
          content="What's New in REanalyzr v4.2 - BRRRR Strategy Analysis Live"
        />
        <meta
          property="twitter:description"
          content="REanalyzr v4.2: BRRRR strategy analysis with capital recovery metrics. Streamlined wizard, unified experience, progressive metrics. House hacking coming Q1 2026."
        />
        <meta property="twitter:image" content="https://reanalyzr.com/og-image-whats-new.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://reanalyzr.com/whats-new" />

        {/* Structured Data - SoftwareApplication */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'REanalyzr',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            softwareVersion: '4.2.0',
            releaseNotes: 'https://reanalyzr.com/whats-new',
            datePublished: '2025-04-01',
            dateModified: '2026-01-17',
            description: 'Professional real estate investment analysis platform with AI-powered insights',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            featureList: [
              'Simplified Property Wizard',
              'Multi-Family Analysis',
              'BRRRR Strategy Analysis',
              'Underwriting Engine',
              'AI-Enhanced Analysis',
              'Portfolio Intelligence',
              'Market Intelligence Integration'
            ]
          })}
        </script>

        {/* Structured Data - Article (for changelog/release notes) */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'REanalyzr v4.2 Release - BRRRR Strategy Analysis',
            description:
              'Version 4.2 adds BRRRR strategy analysis with capital recovery metrics and post-refi cash flow. Version 4.1 brought simplified wizard and unified experience. House hacking coming Q1 2026.',
            author: {
              '@type': 'Organization',
              name: 'REanalyzr'
            },
            publisher: {
              '@type': 'Organization',
              name: 'REanalyzr',
              logo: {
                '@type': 'ImageObject',
                url: 'https://reanalyzr.com/analyzr-logo.png'
              }
            },
            datePublished: '2026-01-17',
            dateModified: '2026-01-17',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://reanalyzr.com/whats-new'
            }
          })}
        </script>
      </Helmet>

      {/* Sticky Navigation Header */}
      <StickyHeader />

      <Container maxWidth="lg" sx={{ py: 4, pt: { xs: 10, md: 12 } }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          What's New in Analyzr
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          We're constantly improving to give you institutional-grade analysis with consumer-grade simplicity
        </Typography>
        <Chip
          label="Version 4.2 - Latest"
          color="primary"
          sx={{ mt: 2, fontSize: '14px', fontWeight: 600, px: 2, py: 1 }}
        />
      </Box>

      {/* Latest Release Highlight */}
      <Card sx={{ mb: 6, borderRadius: '24px', overflow: 'hidden', boxShadow: 6 }}>
        <Box sx={{
          background: `linear-gradient(135deg, ${appleColors.orange[500]} 0%, ${appleColors.orange[600]} 100%)`,
          p: 4,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AutoAwesomeIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>
                BRRRR Strategy Analysis
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Version 4.2 • Released January 2026
              </Typography>
            </Box>
          </Box>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Capital Recycling for Infinite Returns
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Analyze Buy, Rehab, Rent, Refinance, Repeat investments with the same institutional-grade metrics
            you trust for buy-and-hold properties. Model capital recovery and post-refinance cash flow.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Capital Recovery Rate</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track how much of your initial investment you recover through cash-out refinance. Target: 70%+
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Post-Refi Cash Flow</Typography>
                  <Typography variant="body2" color="text.secondary">
                    See monthly cash flow after refinancing with higher debt service. Ensure positive cash flow post-refi.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>70% Rule Validation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatic check: Purchase + Rehab ≤ 70% of ARV. Know if the deal qualifies for BRRRR before you buy.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Landing Page Sample</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try BRRRR analysis on our sample Dallas property. Compare side-by-side with buy-and-hold strategy.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 3, borderRadius: '12px' }}>
            <Typography variant="body2">
              <strong>Live Now:</strong> Visit the homepage and toggle between "Buy & Hold" and "BRRRR" strategies
              to see how capital recycling transforms your returns.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Version History */}
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
        Version History
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* v4.2 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.orange[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v4.2 - BRRRR Strategy Analysis
              </Typography>
              <Chip label="January 2026" size="small" variant="outlined" color="primary" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Analyze Buy, Rehab, Rent, Refinance, Repeat investments with capital recycling metrics and post-refinance cash flow projections.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Capital Recovery Rate calculation (target: 70%+ of initial investment)</Typography></li>
              <li><Typography variant="body2">Post-Refinance Cash Flow analysis with updated debt service</Typography></li>
              <li><Typography variant="body2">70% Rule validation for BRRRR viability check</Typography></li>
              <li><Typography variant="body2">After-Repair Value (ARV) and refinance scenario modeling</Typography></li>
              <li><Typography variant="body2">Sample BRRRR analysis on landing page (Dallas, TX property)</Typography></li>
              <li><Typography variant="body2">Strategy indicator badges throughout analysis results</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v4.1 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.blue[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v4.1 - Universal Simple Experience
              </Typography>
              <Chip label="December 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Dramatically simplified UX while maintaining professional-grade analysis. Removed Pro/Learning mode, streamlined wizard, enhanced property list.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Unified experience - removed Pro/Learning mode toggle</Typography></li>
              <li><Typography variant="body2">Streamlined Property Wizard with 4-step guided input</Typography></li>
              <li><Typography variant="body2">Progressive metric disclosure (3-tier system)</Typography></li>
              <li><Typography variant="body2">Strategy-aware metrics for Buy & Hold (BRRRR & House Hack coming Q1 2026)</Typography></li>
              <li><Typography variant="body2">Saved Properties list redesign with responsive layout and IRR column</Typography></li>
              <li><Typography variant="body2">Dynamic metric labels based on hold period (e.g., "10-Year IRR" vs "Total ROI")</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v4.0 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.purple[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v4.0 - Multi-Family Platform
              </Typography>
              <Chip label="November 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The biggest platform expansion yet. Analyze 2-32 unit properties with the same confidence as single-family.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Multi-Family Property Wizard with RentCast auto-population</Typography></li>
              <li><Typography variant="body2">Unit Mix Analysis - track individual unit performance</Typography></li>
              <li><Typography variant="body2">8 new MF-specific metrics (DSCR, GRM, Break-Even Occupancy, etc.)</Typography></li>
              <li><Typography variant="body2">Common area utilities and per-unit expense tracking</Typography></li>
              <li><Typography variant="body2">Commercial financing support (balloon payments, 5/25 structures)</Typography></li>
              <li><Typography variant="body2">Novice Mode support - first-time MF investors welcome</Typography></li>
              <li><Typography variant="body2">Basic Portfolio Management - create portfolios, set goals, track aggregate metrics</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v3.1 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.blue[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v3.1 - Professional Calibration
              </Typography>
              <Chip label="August 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fixed critical scoring issues and validated all financial calculations against industry standards.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Underwriting Engine accuracy improved to 75–100%</Typography></li>
              <li><Typography variant="body2">Deal Quality score range expanded from 3 to 41 points of differentiation</Typography></li>
              <li><Typography variant="body2">IRR scoring formula corrected (decimal to percentage consistency)</Typography></li>
              <li><Typography variant="body2">Cap rate scoring multiplier fix (proper 0-100 range)</Typography></li>
              <li><Typography variant="body2">AI content data pipeline fix (eliminated $0 corruption)</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v3.0 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.green[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v3.0 - Underwriting Engine v2.1
              </Typography>
              <Chip label="July 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete rebuild of scoring engine with strategy-aware analysis and conservative walk-away pricing.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">4-tier analytical labels: Above / Meets / Requires optimization / Below professional standards</Typography></li>
              <li><Typography variant="body2">0–100 Deal Quality Score with transparent methodology</Typography></li>
              <li><Typography variant="body2">Strategy-aware analysis (house hacking, geographic expansion, etc.)</Typography></li>
              <li><Typography variant="body2">Walk-away price calculation prevents overpaying</Typography></li>
              <li><Typography variant="body2">Comprehensive testing: 10/10 realistic scenarios passing</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v2.5 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.orange[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v2.5 - AI-Enhanced Analysis
              </Typography>
              <Chip label="May 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Integrated GPT-4o-mini for market intelligence and enhanced investment insights.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Strategic Action Plan with AI-powered recommendations</Typography></li>
              <li><Typography variant="body2">Capital Strategy optimization based on your goals</Typography></li>
              <li><Typography variant="body2">Market context analysis with economic indicators</Typography></li>
              <li><Typography variant="body2">Investment strategy adaptation (cash flow, appreciation, etc.)</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v2.0 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.indigo[500]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v2.0 - Deal Pipeline & Portfolio Tracking
              </Typography>
              <Chip label="March 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Organize your investment journey from research to ownership with professional deal flow management.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">5-stage pipeline: Researching to Active to Contract to Owned to Passed</Typography></li>
              <li><Typography variant="body2">Saved properties with notes and tags</Typography></li>
              <li><Typography variant="body2">Portfolio dashboard showing all owned properties</Typography></li>
              <li><Typography variant="body2">Side-by-side property comparison</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v1.5 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.gray[400]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v1.5 - Property Wizard
              </Typography>
              <Chip label="January 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reduced time-to-analysis from 15 minutes to 5 minutes with guided wizard and auto-population.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">4-step guided wizard with progress tracking</Typography></li>
              <li><Typography variant="body2">RentCast API integration for property data auto-fill</Typography></li>
              <li><Typography variant="body2">Smart defaults based on market data</Typography></li>
              <li><Typography variant="body2">85-95% accuracy on auto-populated fields</Typography></li>
            </Box>
          </CardContent>
        </Card>

        {/* v1.0 */}
        <Card sx={{ borderRadius: '16px', borderLeft: `4px solid ${appleColors.gray[400]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                v1.0 - Foundation
              </Typography>
              <Chip label="April 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Launched with core SFR analysis capabilities that transformed spreadsheet chaos into professional insights.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">Single-Family Rental (SFR) analysis engine</Typography></li>
              <li><Typography variant="body2">Financial Details: Monthly cash flow breakdown</Typography></li>
              <li><Typography variant="body2">Long-term Analysis: 10-year projections</Typography></li>
              <li><Typography variant="body2">Tax Intelligence: Hold period optimization</Typography></li>
              <li><Typography variant="body2">Interactive Analysis: Real-time assumption adjustments</Typography></li>
              <li><Typography variant="body2">Deal Optimizer: Maximum purchase price calculator</Typography></li>
              <li><Typography variant="body2">Scenario Manager: Side-by-side comparison</Typography></li>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Coming Soon Section */}
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Here's what we're working on next. Have a feature request? Contact us!
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 32, color: appleColors.orange[500] }} />
                  <Typography variant="h6" fontWeight={600}>
                    House Hacking Analysis
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Strategy-specific metrics for owner-occupied rental properties. Model live-in rental offsets,
                  FHA 3.5% down financing, and reduced qualifying income for house hacking investments.
                </Typography>
                <Chip label="Q1 2026" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: appleColors.blue[500] }} />
                  <Typography variant="h6" fontWeight={600}>
                    Enhanced Portfolio Intelligence
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Advanced what-if analysis, AI-powered recommendations, performance alerts, and side-by-side
                  portfolio comparison. See how each property impacts different portfolio goals.
                </Typography>
                <Chip label="Q1 2026" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon sx={{ fontSize: 32, color: appleColors.green[500] }} />
                  <Typography variant="h6" fontWeight={600}>
                    Advanced MF Features
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Interactive Analysis, Deal Optimizer, and Scenario Manager adapted for multi-family properties.
                  Model value-add renovations and operational improvements.
                </Typography>
                <Chip label="Q1 2026" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SpeedIcon sx={{ fontSize: 32, color: appleColors.orange[500] }} />
                  <Typography variant="h6" fontWeight={600}>
                    Mobile App
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Native iOS and Android apps for analyzing properties on-the-go during property tours.
                  Offline mode and photo uploads for inspection notes.
                </Typography>
                <Chip label="Q2 2026" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 32, color: appleColors.purple[500] }} />
                  <Typography variant="h6" fontWeight={600}>
                    Commercial Real Estate
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Expand beyond residential to analyze retail, office, and industrial properties.
                  Triple-net leases, tenant improvement allowances, and CAM charges.
                </Typography>
                <Chip label="Q3 2026" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Footer CTA */}
      <Box sx={{
        mt: 8,
        p: 4,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${appleColors.primary[50]} 0%, ${appleColors.purple[50]} 100%)`,
        borderRadius: '24px'
      }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Stay Updated
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          We release new features every quarter based on investor feedback.
          Follow our progress and request features you need.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Version 4.2.0 • Last updated: January 17, 2026
        </Typography>
      </Box>
    </Container>
    </>
  );
};

export default WhatsNewPage;
