/**
 * Affiliate Landing Page
 *
 * Custom branded landing page for affiliate partners (e.g., theficouple.reanalyzr.com).
 * Provides partner-specific branding while maintaining Reanalyzr's core design system.
 *
 * Features:
 * - Hero section with partner branding
 * - Primary CTA to property wizard
 * - Optional embedded YouTube video
 * - Trust signals section
 * - Fully responsive (mobile-first)
 *
 * @author Architect + UX Designer from CLAUDE.md
 * @date December 23, 2025
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Grid from '@mui/system/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAffiliate } from '../contexts/AffiliateContext';

export default function AffiliateLandingPage(): React.ReactElement {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { affiliatePartner } = useAffiliate();
  const [searchParams] = useSearchParams();

  // Get email/name from Flodesk redirect (if coming from Josh's email capture page)
  const userEmail = searchParams.get('email');
  const userName = searchParams.get('name');
  const firstName = userName ? userName.split(' ')[0] : '';

  // Fallback to main site if no partner detected (should not happen)
  if (!affiliatePartner) {
    console.warn('⚠️ AffiliateLandingPage rendered without partner, redirecting to home');
    navigate('/');
    return <></>;
  }

  const { brandingConfig, name } = affiliatePartner;

  const handleStartAnalysis = (): void => {
    // If coming from Flodesk with email, go to pre-filled signup
    if (userEmail) {
      const params = new URLSearchParams({
        email: userEmail,
        ...(userName && { name: userName })
      });
      navigate(`/register?${params.toString()}`);
    } else {
      // Regular flow - go to analysis (which redirects to login if needed)
      navigate('/sfr-analysis');
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '50vh', md: '65vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: {
            xs: `url(/partners/${affiliatePartner.subdomain}/hero-mobile.jpg)`,
            md: `url(/partners/${affiliatePartner.subdomain}/hero-desktop.jpg)`
          },
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          textAlign: 'center',
          // Gradient overlay for text readability
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
            zIndex: 1
          },
          // Fallback if image doesn't load
          backgroundColor: brandingConfig.primaryColor || '#1976d2'
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            position: 'relative',
            zIndex: 2,
            px: { xs: 2, md: 4 }
          }}
        >
          {/* Personalized welcome if coming from Flodesk */}
          {firstName && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                mb: 2,
                color: '#fff'
              }}
            >
              Welcome, {firstName}! 👋
            </Typography>
          )}

          <Typography
            variant={isMobile ? 'h3' : 'h2'}
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              mb: 3
            }}
          >
            {brandingConfig.tagline}
          </Typography>

          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            paragraph
            sx={{
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              mb: 4,
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            {brandingConfig.description}
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleStartAnalysis}
            sx={{
              px: { xs: 4, md: 6 },
              py: { xs: 1.5, md: 2 },
              fontSize: { xs: '1rem', md: '1.125rem' },
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backgroundColor: '#fff',
              color: brandingConfig.primaryColor || '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
              }
            }}
          >
            Start Free Analysis →
          </Button>
        </Container>
      </Box>

      {/* Trust Signals Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600, mb: 4 }}
        >
          Why {name} Trusts Reanalyzr
        </Typography>

        <Grid container spacing={3}>
          {/* Trust Signal 1 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <CheckCircleIcon
                    sx={{
                      color: '#4caf50',
                      fontSize: 32,
                      mr: 2
                    }}
                  />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Institutional-Grade Analysis
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Every formula matches institutional underwriting standards used by professional investors and lenders.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Trust Signal 2 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <CheckCircleIcon
                    sx={{
                      color: '#4caf50',
                      fontSize: 32,
                      mr: 2
                    }}
                  />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    5-Minute Analysis vs 2-Hour Spreadsheets
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Professional-grade analysis in minutes, not hours. Auto-populated property data and market intelligence save countless hours.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Trust Signal 3 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <CheckCircleIcon
                    sx={{
                      color: '#4caf50',
                      fontSize: 32,
                      mr: 2
                    }}
                  />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    Underwriting Engine
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Deal Quality Score (0–100) with contextual analytical labels tuned to YOUR goals. Conservative walk-away prices prevent costly mistakes.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Secondary CTA */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 500, mb: 3 }}
          >
            Ready to analyze your first deal?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartAnalysis}
            sx={{
              px: { xs: 4, md: 6 },
              py: { xs: 1.5, md: 2 },
              fontSize: { xs: '1rem', md: '1.125rem' },
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Start Your Free Analysis
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            No credit card required • 10 free analyses
          </Typography>
        </Box>
      </Container>

      {/* Optional: YouTube Video Section (Commented out for now, can enable when Josh provides video ID) */}
      {/*
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600, mb: 4 }}
        >
          Watch: How I Analyze Every Deal
        </Typography>
        <Box
          sx={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID_HERE"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </Box>
      </Container>
      */}
    </Box>
  );
}
