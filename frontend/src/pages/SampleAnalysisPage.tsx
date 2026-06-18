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
  CircularProgress,
  Fade
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
  Share as ShareIcon,
  Apartment as ApartmentIcon
} from '@mui/icons-material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';

import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import StickyHeader from '../components/SampleAnalysis/StickyHeader';
import PropertyTypeSelector from '../components/SampleAnalysis/PropertyTypeSelector';
import PricingBadge from '../components/Pricing/PricingBadge';
import { AppleButton } from '../components/ui/AppleComponents';
import { useAuth } from '../contexts/AuthContext';
import { appleColors, appleShadows, appleBorderRadius } from '../theme/appleDesignSystem';
import { formatCurrency } from '../utils/formatters';
import analyzrLogo from '../assets/analyzr-logo.png';
import api from '../services/api';
import type { SFRPropertyData, MultiFamilyPropertyData } from '../types/property';
import type { Analysis } from '../types/analysis';
import { analytics } from '../utils/analytics';

const SampleAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<SFRPropertyData | MultiFamilyPropertyData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<'sfr' | 'mf'>('sfr');
  const [selectedStrategy, setSelectedStrategy] = useState<'buy-hold' | 'brrrr'>('buy-hold');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Smart redirect: If user is logged in and visiting root path, redirect to dashboard
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('sample_analysis');
  }, []);

  // Helper function to construct SFR property data from deal object
  const constructSFRPropertyData = (deal: any): SFRPropertyData => {
    return {
      propertyType: 'SFR',
      strategy: deal.strategy || selectedStrategy,
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
  };

  // Helper function to construct MF property data from deal object
  const constructMFPropertyData = (deal: any): MultiFamilyPropertyData => {
    return {
      propertyType: 'MF',
      propertyName: deal.propertyName || '',
      propertyAddress: deal.propertyAddress,
      purchasePrice: deal.purchasePrice,
      downPayment: deal.downPayment,
      interestRate: deal.interestRate,
      loanTerm: deal.loanTerm,
      totalUnits: deal.totalUnits,
      totalSqft: deal.totalSqft,
      yearBuilt: deal.yearBuilt,
      buildingType: deal.buildingType,
      propertyTaxRate: deal.propertyTaxRate,
      insuranceRate: deal.insuranceRate,
      propertyManagementRate: deal.propertyManagementRate,
      maintenanceCostPerUnit: deal.maintenanceCostPerUnit,
      closingCosts: deal.closingCosts,
      capitalInvestments: deal.capitalInvestments,
      unitTypes: deal.unitTypes || [],
      commonAreaUtilities: deal.commonAreaUtilities || {},
      longTermAssumptions: deal.longTermAssumptions,
      tenantTurnoverFees: deal.tenantTurnoverFees
    };
  };

  // Fetch real analysis from backend based on selected property type and strategy
  useEffect(() => {
    const fetchSampleAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params based on property type
        let queryParams = '';
        if (selectedPropertyType === 'mf') {
          queryParams = '?propertyType=mf';
        } else {
          queryParams = `?propertyType=sfr&strategy=${selectedStrategy}`;
        }

        const response = await api.get(`/deals/sample-analysis${queryParams}`);
        const deal = response.data;

        // Construct property data based on type
        let constructedPropertyData;
        if (selectedPropertyType === 'mf') {
          constructedPropertyData = constructMFPropertyData(deal);
        } else {
          constructedPropertyData = constructSFRPropertyData(deal);
        }

        // Deep clone analysis to break all object references
        const freshAnalysis = deal.analysis ? JSON.parse(JSON.stringify(deal.analysis)) : null;

        setPropertyData(constructedPropertyData);
        setAnalysis(freshAnalysis);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sample analysis:', err);
        setError('Failed to load sample analysis. Please try again later.');
        setLoading(false);
      }
    };

    fetchSampleAnalysis();
  }, [selectedPropertyType, selectedStrategy]);

  // Handle strategy change with fade animation
  const handleStrategyChange = (newStrategy: 'buy-hold' | 'brrrr') => {
    if (newStrategy === selectedStrategy) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setSelectedStrategy(newStrategy);
      setIsTransitioning(false);
    }, 200); // Match fade-out duration
  };

  // Handle property type change with fade animation
  const handlePropertyTypeChange = (newType: 'sfr' | 'mf') => {
    if (newType === selectedPropertyType) return;

    // Set states immediately, React 19 batches updates
    setIsTransitioning(true);
    setSelectedPropertyType(newType);

    // Reset strategy to buy-hold when switching to MF
    if (newType === 'mf') {
      setSelectedStrategy('buy-hold');
    }

    // Clear transition flag after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

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
    <Box data-clarity-unmask="True" sx={{ minHeight: '100vh', backgroundColor: appleColors.gray[50] }}>
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

          {/* Main Headline - SEO Optimized H1 */}
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
            Rental Property Calculator
          </Typography>

          {/* Subheading - SEO Keywords */}
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
            Analyze buy & hold, BRRRR, and multi-family properties in 5 minutes.{' '}
            <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
              Calculate cap rate, cash flow, IRR, DSCR with institutional-grade metrics.
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

          {/* Pricing Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <PricingBadge onClick={() => navigate('/pricing')} />
          </Box>

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
            onTypeChange={handlePropertyTypeChange}
          />

          {/* Strategy Selector - Only show for SFR */}
          {selectedPropertyType === 'sfr' && (
            <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  color: appleColors.gray[600],
                  fontSize: '0.938rem',
                  fontWeight: 500
                }}
              >
                Choose Investment Strategy:
              </Typography>

              <Stack
                direction="row"
                spacing={2}
                sx={{
                  maxWidth: 400,
                  margin: '0 auto',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <AppleButton
                    variant={selectedStrategy === 'buy-hold' ? 'primary' : 'secondary'}
                    onClick={() => handleStrategyChange('buy-hold')}
                    fullWidth
                  >
                    Buy & Hold
                  </AppleButton>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <AppleButton
                    variant={selectedStrategy === 'brrrr' ? 'primary' : 'secondary'}
                    onClick={() => handleStrategyChange('brrrr')}
                    fullWidth
                  >
                    BRRRR
                  </AppleButton>
                </Box>
              </Stack>
            </Box>
          )}

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

          {/* Property Overview Card with Fade Animation */}
          <Fade in={!isTransitioning} timeout={selectedPropertyType === 'mf' ? 300 : 200}>
            <Card
              sx={{
                borderRadius: appleBorderRadius.xl,
                boxShadow: appleShadows.xl,
                mt: 4
              }}
            >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {/* Property Details - Different layout for MF vs SFR */}
              {selectedPropertyType === 'mf' ? (
                // Multi-Family Property Overview
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
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

                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      <Chip
                        icon={<ApartmentIcon />}
                        label={`${(propertyData as MultiFamilyPropertyData).totalUnits} units`}
                        sx={{ fontWeight: 500 }}
                      />
                      <Chip
                        icon={<SquareFootIcon />}
                        label={`${(propertyData as MultiFamilyPropertyData).totalSqft?.toLocaleString()} sqft`}
                        sx={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={`Built ${propertyData.yearBuilt}`}
                        sx={{ fontWeight: 500 }}
                      />
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                        Purchase Price
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
                        {formatCurrency(propertyData.purchasePrice)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                        Monthly Cash Flow
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                        {formatCurrency(analysis?.monthlyAnalysis?.cashFlow || 0)}/mo
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                // Single-Family Property Overview
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

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fit, minmax(110px, max-content))' },
                        gap: 1,
                      }}
                    >
                      <Chip
                        icon={<BedIcon />}
                        label={`${(propertyData as SFRPropertyData).bedrooms} bed`}
                        sx={{ fontWeight: 500, justifyContent: 'flex-start' }}
                      />
                      <Chip
                        icon={<BathIcon />}
                        label={`${(propertyData as SFRPropertyData).bathrooms} bath`}
                        sx={{ fontWeight: 500, justifyContent: 'flex-start' }}
                      />
                      <Chip
                        icon={<SquareFootIcon />}
                        label={`${(propertyData as SFRPropertyData).squareFootage?.toLocaleString()} sqft`}
                        sx={{ fontWeight: 500, justifyContent: 'flex-start' }}
                      />
                      <Chip
                        label={`Built ${propertyData.yearBuilt}`}
                        sx={{ fontWeight: 500, justifyContent: 'flex-start' }}
                      />
                    </Box>
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
                          {formatCurrency((propertyData as SFRPropertyData).monthlyRent)}/mo
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 0.5 }}>
                          Monthly Cash Flow
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                          {formatCurrency(analysis?.monthlyAnalysis?.cashFlow || 0)}/mo
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              )}

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
                      {analysis?.keyMetrics?.capRate?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      IRR (10yr)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {((analysis?.keyMetrics?.irr || 0) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      Cash on Cash
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {analysis?.keyMetrics?.cashOnCashReturn?.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      Deal Quality
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                      {analysis?.investmentDecision?.professionalAssessment?.dealQuality || analysis?.investmentDecision?.score}/100
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
          </Fade>
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

        <Fade in={!isTransitioning} timeout={selectedPropertyType === 'mf' ? 300 : 200}>
          <Box>
            <AnalysisResults
              key={`${selectedPropertyType}-${selectedStrategy}`}
              analysis={analysis}
              propertyData={propertyData}
            />
          </Box>
        </Fade>
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

          {/* SEO Content Section - Added for organic search optimization */}
          <Box sx={{ mt: 8, mb: 6, maxWidth: 900, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              How to Use This Rental Property Calculator
            </Typography>

            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Our rental property calculator helps you analyze buy and hold, BRRRR, and multi-family
              investment opportunities in minutes. Select a property type above to see a detailed financial
              analysis including cash flow projections, cap rate, cash-on-cash return, IRR, DSCR, and 60+
              institutional-grade metrics. No spreadsheets required.
            </Typography>

            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Whether you're evaluating your first rental property or expanding your real estate portfolio,
              our calculator provides professional-level analysis that would typically require expensive
              software or hours with spreadsheets. Switch between single-family (SFR) buy & hold, BRRRR
              strategy, and multi-family properties to see how different investment approaches perform.
            </Typography>
          </Box>

          <Box sx={{ mt: 6, mb: 6, maxWidth: 900, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Understanding Rental Property Metrics
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mb: 1.5,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Cap Rate (Capitalization Rate)
            </Typography>
            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              The cap rate measures your property's return on investment based on net operating income.
              Calculate it by dividing annual NOI by purchase price. A good cap rate for rental properties
              typically ranges from 5-10%, depending on location and property type. Higher cap rates
              indicate stronger cash flow relative to price.
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mb: 1.5,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Cash Flow
            </Typography>
            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Monthly cash flow is your rental income minus all expenses including mortgage, property taxes,
              insurance, maintenance, and property management. Positive cash flow means the property pays
              for itself and generates profit each month. Aim for at least $200-400 per property.
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mb: 1.5,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Cash-on-Cash Return
            </Typography>
            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              This metric shows your annual return on actual cash invested (down payment and closing costs).
              Investors typically target 8-12% cash-on-cash return for solid rental properties. This helps
              you compare rental property returns to other investment options.
            </Typography>
          </Box>

          <Box sx={{ mt: 6, mb: 6, maxWidth: 900, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Why Use a Rental Property Calculator?
            </Typography>

            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Real estate investing requires analyzing dozens of financial metrics to make informed decisions.
              Our calculator replaces complex spreadsheets with an intuitive interface that shows you exactly
              what matters: Is this property a good investment? Get instant analysis with professional-grade
              calculations used by institutional investors.
            </Typography>

            <Typography
              variant="body1"
              paragraph
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Beyond basic calculations, we integrate real market data from FRED and RentCast APIs and provide
              an Investment Decision Engine that scores each property (0-100) with a clear verdict: BUY,
              NEGOTIATE, or PASS. This transforms you from calculating numbers to making confident investment
              decisions backed by data.
            </Typography>
          </Box>

          <Box sx={{ mt: 6, mb: 6, maxWidth: 900, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                color: appleColors.gray[900]
              }}
            >
              Frequently Asked Questions
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: appleColors.gray[900]
                }}
              >
                What is a good cap rate for a rental property?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.063rem',
                  lineHeight: 1.7,
                  color: appleColors.gray[700]
                }}
              >
                A good cap rate typically ranges from 5-10%, but varies by market. High-demand urban areas
                may have 4-6% cap rates with strong appreciation, while emerging markets can offer 8-12%
                with higher cash flow. Higher isn't always better—consider appreciation potential, property
                quality, and market stability alongside cap rate.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: appleColors.gray[900]
                }}
              >
                How much cash flow should a rental property generate?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.063rem',
                  lineHeight: 1.7,
                  color: appleColors.gray[700]
                }}
              >
                Aim for at least $200-400 per month in cash flow per property after all expenses including
                mortgage, taxes, insurance, maintenance, and property management. This provides a buffer
                for unexpected repairs and vacancies while generating positive returns. Some investors use
                the 1% rule: monthly rent should be at least 1% of purchase price.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: appleColors.gray[900]
                }}
              >
                What's the difference between buy & hold and BRRRR?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.063rem',
                  lineHeight: 1.7,
                  color: appleColors.gray[700]
                }}
              >
                Buy & hold means purchasing a property and renting it long-term for cash flow and appreciation.
                BRRRR (Buy, Rehab, Rent, Refinance, Repeat) involves buying distressed properties, renovating
                to increase value, renting, then refinancing to pull cash out for the next investment. BRRRR
                can recycle capital faster but requires renovation expertise and higher risk tolerance.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: appleColors.gray[900]
                }}
              >
                Do I need to sign up to use the calculator?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.063rem',
                  lineHeight: 1.7,
                  color: appleColors.gray[700]
                }}
              >
                No signup required to view the sample analyses above. Switch between property types and
                strategies to see full analysis results. To analyze your own properties with custom inputs,
                create a free account to get 3 full analyses per month with all 60+ metrics, AI-powered
                investment guidance, and ability to save properties.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: appleColors.gray[900]
                }}
              >
                How accurate are the rental property calculations?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.063rem',
                  lineHeight: 1.7,
                  color: appleColors.gray[700]
                }}
              >
                Our calculations use institutional-grade formulas validated by CPAs and real estate
                professionals. We integrate live market data from FRED (Federal Reserve) and RentCast APIs
                for accurate rent estimates and economic indicators. The Investment Decision Engine analyzes
                60+ metrics to provide professional-level guidance that typically requires expensive software
                or financial advisors.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 6, mb: 8, maxWidth: 900, mx: 'auto', textAlign: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.063rem',
                lineHeight: 1.7,
                color: appleColors.gray[700]
              }}
            >
              Ready to analyze your property?{' '}
              <Link
                to="/register"
                style={{
                  color: appleColors.primary[500],
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${appleColors.primary[200]}`
                }}
              >
                Sign up free
              </Link>
              {' '}for 3 full analyses per month. Need help getting started? Visit our{' '}
              <Link
                to="/help"
                style={{
                  color: appleColors.primary[500],
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${appleColors.primary[200]}`
                }}
              >
                investment guide
              </Link>
              {' '}or explore{' '}
              <Link
                to="/market-data"
                style={{
                  color: appleColors.primary[500],
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${appleColors.primary[200]}`
                }}
              >
                current market data
              </Link>
              .
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SampleAnalysisPage;
