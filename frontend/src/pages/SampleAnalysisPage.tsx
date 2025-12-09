import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Container,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/system/Grid';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home as HomeIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathtub as BathIcon,
  SquareFoot as SquareFootIcon,
  WarningAmber as WarningAmberIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';

import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';
import PropertyTypeSelector from '../components/SampleAnalysis/PropertyTypeSelector';
import { useAuth } from '../contexts/AuthContext';
import { appleColors, appleShadows, appleBorderRadius } from '../theme/appleDesignSystem';
import { formatCurrency } from '../utils/formatters';
import analyzrLogo from '../assets/analyzr-logo.png';
import api from '../services/api';
import type { SFRPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';

const SampleAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<'sfr' | 'mf'>('sfr');

  // Smart redirect: If user is logged in and visiting root path, redirect to dashboard
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Fetch real analysis from backend
  useEffect(() => {
    const fetchSampleAnalysis = async () => {
      try {
        // Use configured API service - handles environment URLs automatically
        // This endpoint is PUBLIC (no auth required) - backend allows anonymous access
        const response = await api.get('/deals/sample-analysis');
        const deal = response.data;

        // Property data is stored at root level in Deal schema, not nested
        // Construct SFRPropertyData from deal's root-level fields
        const constructedPropertyData: SFRPropertyData = {
          propertyType: 'SFR',
          propertyName: deal.propertyName || '',
          propertyAddress: deal.propertyAddress,
          purchasePrice: deal.purchasePrice,
          downPayment: deal.downPayment,
          interestRate: deal.interestRate,
          loanTerm: deal.loanTerm,
          propertyTaxRate: deal.propertyTaxRate,
          insuranceRate: deal.insuranceRate,
          propertyManagementRate: deal.propertyManagementRate,
          yearBuilt: deal.yearBuilt,
          closingCosts: deal.closingCosts,
          capitalInvestments: deal.capitalInvestments,
          monthlyRent: deal.monthlyRent,
          squareFootage: deal.squareFootage,
          bedrooms: deal.bedrooms,
          bathrooms: deal.bathrooms,
          maintenanceCost: deal.maintenanceCost,
          tenantTurnoverFees: deal.tenantTurnoverFees,
          longTermAssumptions: deal.longTermAssumptions
        };

        // Set state with constructed property data and analysis
        setPropertyData(constructedPropertyData);
        setAnalysis(deal.analysis);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sample analysis:', err);
        setError('Failed to load sample analysis. Please try again later.');
        setLoading(false);
      }
    };

    fetchSampleAnalysis();
  }, []);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: appleColors.gray[50]
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error || !propertyData || !analysis) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: appleColors.gray[50],
          p: 3
        }}
      >
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, color: appleColors.error[600] }}>
              Failed to Load Sample Analysis
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: appleColors.gray[700] }}>
              {error || 'Unable to load the sample property analysis. Please try again later.'}
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: appleColors.gray[50] }}>
      {/* Sticky Header */}
      <StickyHeader />

      {/* SEO Meta Tags */}
      <Helmet>
        {/* Primary Meta Tags */}
        <title>REanalyzr - Professional Real Estate Analysis Tool | Institutional-Grade Metrics</title>
        <meta
          name="description"
          content="Analyze rental properties in 5 minutes. Calculate cap rate, cash flow, IRR, DSCR. Free property calculator with AI insights. Try sample analysis now."
        />
        <meta
          name="keywords"
          content="rental property analysis example, cap rate analysis example, real estate investment sample, Charlotte NC rental property, property analysis breakdown, rental property calculator example, real estate investment analysis"
        />

        {/* Canonical URL - Always point to root for SEO consolidation */}
        <link rel="canonical" href="https://reanalyzr.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reanalyzr.com/" />
        <meta property="og:title" content="REanalyzr - Professional Real Estate Analysis Tool" />
        <meta
          property="og:description"
          content="Institutional-grade property analysis for individual investors. No spreadsheets. No guesswork. Get cap rate, IRR, DSCR, and AI-powered investment verdicts in 5 minutes."
        />
        <meta property="og:image" content="https://reanalyzr.com/og-image.png" />
        <meta property="og:site_name" content="REanalyzr" />

        {/* Twitter Card */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://reanalyzr.com/" />
        <meta property="twitter:title" content="REanalyzr - Professional Real Estate Analysis" />
        <meta
          property="twitter:description"
          content="Institutional-grade metrics for individual investors. Cap rate, IRR, DSCR, and AI insights in 5 minutes. No spreadsheets required."
        />
        <meta property="twitter:image" content="https://reanalyzr.com/twitter-card.png" />

        {/* Article Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Sample Rental Property Analysis - Charlotte, NC Investment Property',
            description:
              'Complete financial analysis of a $390K single-family rental property in Charlotte, NC including cap rate 7.2%, IRR 14.8%, cash flow projections, and AI-powered insights.',
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
            datePublished: '2025-12-06',
            dateModified: '2025-12-06',
            image: 'https://reanalyzr.com/og-image.png',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://reanalyzr.com/sample-analysis'
            }
          })}
        </script>

        {/* Software Application Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'REanalyzr',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            description: 'AI-powered rental property calculator and investment analysis tool',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '127',
              bestRating: '5',
              worstRating: '1'
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <Box
        sx={{
          backgroundColor: appleColors.gray[50],
          py: { xs: 6, md: 8 },
          px: 3,
          pt: { xs: 8, md: 10 } // Extra top padding to avoid sticky header overlap
        }}
      >
        <Container maxWidth="lg">
          {/* Brand Section - Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src={analyzrLogo}
              alt="REanalyzr"
              sx={{
                height: { xs: '60px', md: '80px' },
                width: 'auto',
                margin: '0 auto',
                display: 'block'
              }}
            />
          </Box>

          {/* Main Headline - Value Proposition */}
          <Typography
            variant="h1"
            sx={{
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              lineHeight: 1.1,
              color: appleColors.gray[900],
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}
          >
            Professional Real Estate Analysis
          </Typography>

          {/* Subheading - Enhanced Value Proposition */}
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              fontSize: { xs: '1.125rem', md: '1.5rem' },
              fontWeight: 400,
              maxWidth: '800px',
              mx: 'auto',
              color: appleColors.gray[700],
              textAlign: 'center',
              lineHeight: 1.4
            }}
          >
            Institutional-grade metrics for individual investors.{' '}
            <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
              No spreadsheets. No guesswork.
            </Box>
          </Typography>

          {/* Subtle Divider */}
          <Box
            sx={{
              width: { xs: '60px', md: '80px' },
              height: '2px',
              backgroundColor: appleColors.gray[300],
              mx: 'auto',
              mb: 4,
              mt: 2
            }}
          />

          {/* Demo Context Label */}
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              color: appleColors.gray[600],
              fontSize: '0.938rem',
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            See a live example analysis:
          </Typography>

          {/* Property Type Selector */}
          <PropertyTypeSelector
            selectedType={selectedPropertyType}
            onTypeChange={setSelectedPropertyType}
          />

          {/* Social Sharing Section */}
          <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: appleColors.gray[600],
                fontSize: '0.875rem',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <ShareIcon sx={{ fontSize: '18px' }} />
              Share this free tool:
            </Typography>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {/* Facebook Share */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<FacebookIcon />}
                onClick={() => {
                  const url = encodeURIComponent('https://reanalyzr.com/');
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                }}
                sx={{
                  borderColor: '#1877F2',
                  color: '#1877F2',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#1877F2',
                    backgroundColor: 'rgba(24, 119, 242, 0.04)'
                  }
                }}
              >
                Facebook
              </Button>

              {/* Twitter/X Share */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<TwitterIcon />}
                onClick={() => {
                  const text = encodeURIComponent('Check out REanalyzr - Free real estate investment calculator with AI insights!');
                  const url = encodeURIComponent('https://reanalyzr.com/');
                  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
                }}
                sx={{
                  borderColor: '#1DA1F2',
                  color: '#1DA1F2',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#1DA1F2',
                    backgroundColor: 'rgba(29, 161, 242, 0.04)'
                  }
                }}
              >
                Twitter
              </Button>

              {/* LinkedIn Share */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<LinkedInIcon />}
                onClick={() => {
                  const url = encodeURIComponent('https://reanalyzr.com/');
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
                }}
                sx={{
                  borderColor: '#0A66C2',
                  color: '#0A66C2',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#0A66C2',
                    backgroundColor: 'rgba(10, 102, 194, 0.04)'
                  }
                }}
              >
                LinkedIn
              </Button>
            </Stack>
          </Box>

          {/* Property Overview Card */}
          <Card
            sx={{
              borderRadius: appleBorderRadius.xl,
              boxShadow: appleShadows.xl,
              mt: 4
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <LocationIcon sx={{ color: appleColors.gray[600] }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {propertyData.propertyAddress.street}
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ color: appleColors.gray[700], mb: 3 }}>
                    {propertyData.propertyAddress.city}, {propertyData.propertyAddress.state}{' '}
                    {propertyData.propertyAddress.zipCode}
                  </Typography>

                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      icon={<BedIcon />}
                      label={`${propertyData.bedrooms} bed`}
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      icon={<BathIcon />}
                      label={`${propertyData.bathrooms} bath`}
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      icon={<SquareFootIcon />}
                      label={`${propertyData.squareFootage?.toLocaleString()} sqft`}
                      sx={{ fontWeight: 500 }}
                    />
                    <Chip
                      label={`Built ${propertyData.yearBuilt}`}
                      sx={{ fontWeight: 500 }}
                    />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                        Purchase Price
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
                        {formatCurrency(propertyData.purchasePrice)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                        Monthly Rent
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                        {formatCurrency(propertyData.monthlyRent)}/mo
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                        Monthly Cash Flow
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                        {formatCurrency(analysis.monthlyAnalysis.cashFlow || 0)}/mo
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              {/* Key Metrics Preview */}
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: `1px solid ${appleColors.gray[200]}`
                }}
              >
                <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 2 }}>
                  Key Investment Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      Cap Rate
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {analysis.keyMetrics.capRate?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      IRR (10yr)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {((analysis.keyMetrics.irr || 0) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      Cash on Cash
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {analysis.keyMetrics.cashOnCashReturn?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      Deal Quality
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                      {analysis.investmentDecision?.professionalAssessment?.dealQuality || analysis.investmentDecision?.score}/100
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* CTA */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                {/* Primary CTA */}
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: appleBorderRadius.lg,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: appleShadows.md,
                    '&:hover': {
                      boxShadow: appleShadows.lg,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Analyze YOUR Property Free →
                </Button>
                <Typography variant="body2" sx={{ mt: 2, color: appleColors.gray[600] }}>
                  No credit card required • 2-minute setup
                </Typography>

                {/* Secondary CTA - Login Link */}
                <Typography
                  variant="body2"
                  sx={{
                    mt: 2,
                    color: appleColors.gray[600],
                    textAlign: 'center'
                  }}
                >
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: appleColors.primary[500],
                      textDecoration: 'none',
                      fontWeight: 600,
                      borderBottom: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderBottomColor = appleColors.primary[500];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderBottomColor = 'transparent';
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Analysis Results Section */}
      <Container maxWidth="lg" sx={{ mt: 6, pb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
            Complete Analysis Breakdown
          </Typography>
          <Typography variant="body1" sx={{ color: appleColors.gray[700], maxWidth: '700px', mx: 'auto' }}>
            Below is the full professional analysis for this property. Every metric, AI insight, and
            strategic recommendation is included — exactly what you'll get when analyzing your own properties.
          </Typography>
        </Box>

        <AnalysisResults analysis={analysis} propertyData={propertyData} />
      </Container>

      {/* Educational Disclaimer Banner */}
      <Box
        sx={{
          backgroundColor: appleColors.warning[50],
          borderTop: `2px solid ${appleColors.warning[300]}`,
          borderBottom: `2px solid ${appleColors.warning[300]}`,
          py: 3,
          px: 3,
          mt: 6
        }}
      >
        <Container maxWidth="md">
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <WarningAmberIcon
              sx={{
                color: appleColors.warning[600],
                fontSize: '28px',
                flexShrink: 0,
                mt: 0.3
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: appleColors.gray[800],
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  mb: 1
                }}
              >
                <strong>Educational Tool Disclaimer:</strong> REanalyzr provides educational
                property analysis tools only. This platform does not provide financial, investment,
                tax, or legal advice. All results are estimates that may contain errors. Real estate
                investments carry significant risks including total loss of capital.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: appleColors.gray[700],
                  display: 'block',
                  lineHeight: 1.6
                }}
              >
                You must conduct independent due diligence and consult qualified professionals
                (financial advisors, CPAs, attorneys, real estate agents) before making investment
                decisions. See our{' '}
                <Link
                  to="/terms"
                  style={{
                    color: appleColors.primary[600],
                    textDecoration: 'underline'
                  }}
                >
                  Terms of Service
                </Link>{' '}
                for complete disclaimers.
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Bottom CTA Section */}
      <Box
        sx={{
          backgroundColor: appleColors.gray[100],
          py: { xs: 6, md: 8 },
          px: 3,
          mt: 6
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
            Want This Level of Insight for YOUR Property?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: appleColors.gray[700] }}>
            Get professional-grade analysis in 5 minutes. No spreadsheets. No guesswork.
          </Typography>

          {/* Feature highlights */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <HomeIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Clear BUY/PASS Verdicts
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                  No more analysis paralysis. Get instant investment decisions backed by data.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  AI-Powered Insights
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                  Market intelligence + strategic recommendations tailored to your goals.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <AnalyticsIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  80+ Financial Metrics
                </Typography>
                <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                  Cap rate, IRR, DSCR, cash flow, and more. CPA-validated calculations.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Primary CTA */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              borderRadius: appleBorderRadius.lg,
              px: 6,
              py: 2,
              fontSize: '1.25rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: appleShadows.lg,
              '&:hover': {
                boxShadow: appleShadows.xl,
                transform: 'translateY(-2px)'
              }
            }}
          >
            Start Analyzing Properties Free
          </Button>

          <Typography variant="body2" sx={{ mt: 2, color: appleColors.gray[600] }}>
            No credit card required • 2-minute setup • Join 100s of users
          </Typography>

          {/* Secondary CTA - Login Link */}
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: appleColors.gray[600],
              textAlign: 'center'
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: appleColors.primary[500],
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomColor = appleColors.primary[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
            >
              Sign in
            </Link>
          </Typography>

          {/* Sample disclaimer */}
          <Typography variant="caption" sx={{ mt: 4, display: 'block', color: appleColors.gray[500] }}>
            Sample data based on Charlotte, NC market as of December 2025. Analysis demonstrates platform
            capabilities with realistic market data. Actual results may vary based on local market
            conditions.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default SampleAnalysisPage;
