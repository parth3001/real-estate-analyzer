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

const WhatsNewPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          What's New in Analyzr
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          We're constantly improving to give you institutional-grade analysis with consumer-grade simplicity
        </Typography>
        <Chip
          label="Version 4.0 - Latest"
          color="primary"
          sx={{ mt: 2, fontSize: '14px', fontWeight: 600, px: 2, py: 1 }}
        />
      </Box>

      {/* Latest Release Highlight */}
      <Card sx={{ mb: 6, borderRadius: '24px', overflow: 'hidden', boxShadow: 6 }}>
        <Box sx={{
          background: `linear-gradient(135deg, ${appleColors.purple[500]} 0%, ${appleColors.purple[600]} 100%)`,
          p: 4,
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ApartmentIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Multi-Family Analysis Now Live
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Version 4.0 • Released November 2025
              </Typography>
            </Box>
          </Box>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Analyze Apartments & Duplexes Like a Pro
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Scale from single-family homes to multi-family complexes without changing platforms.
            Our new Multi-Family Analyzer brings institutional-grade metrics to individual investors.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Unit Mix Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track performance by unit type (1BR, 2BR, 3BR). See which units drive your returns.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Institutional Metrics</Typography>
                  <Typography variant="body2" color="text.secondary">
                    DSCR, Debt Yield, Break-Even Occupancy, GRM - the same metrics commercial lenders use.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Fannie/Freddie Standards</Typography>
                  <Typography variant="body2" color="text.secondary">
                    NOI calculations match industry underwriting standards. Get financing-ready analysis.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircleIcon sx={{ color: appleColors.green[500], flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={600}>Commercial Loan Support</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Model balloon payments and commercial loan structures unique to 5+ unit properties.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="success" sx={{ mt: 3, borderRadius: '12px' }}>
            <Typography variant="body2">
              <strong>Why it matters:</strong> The average multifamily property delivers 12-18% annual returns vs 8-12% for single-family.
              Now you can analyze both with the same confidence.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Version History */}
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 4 }}>
        Version History
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
              <li><Typography variant="body2">Investment Decision Engine accuracy improved to 75-100%</Typography></li>
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
                v3.0 - Investment Decision Engine v2.1
              </Typography>
              <Chip label="July 2025" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete rebuild of scoring engine with strategy-aware analysis and conservative walk-away pricing.
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, '& li': { mb: 0.5 } }}>
              <li><Typography variant="body2">4-tier verdict system: BUY, NEGOTIATE, CAUTION, PASS</Typography></li>
              <li><Typography variant="body2">0-100 Property Quality Score with transparent methodology</Typography></li>
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
              <Chip label="October 2024" size="small" variant="outlined" />
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
          Version 4.0.0 • Last updated: November 23, 2025
        </Typography>
      </Box>
    </Container>
  );
};

export default WhatsNewPage;
