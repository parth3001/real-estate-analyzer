/**
 * Public Header Component
 * Used for public pages (Landing, Calculator) - shows before user scrolls
 */

import React from 'react';
import { Box, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { appleColors } from '../../theme/appleDesignSystem';
import analyzrLogo from '../../assets/analyzr-logo.png';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: { xs: '56px', md: '64px' }
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src={analyzrLogo}
            alt="REanalyzr"
            onClick={() => navigate('/')}
            sx={{
              height: { xs: '28px', md: '32px' },
              width: 'auto',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8
              }
            }}
          />

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
            {/* Sample Analysis Link */}
            <Button
              onClick={() => navigate('/sample-analysis')}
              sx={{
                color: appleColors.gray[700],
                fontSize: { xs: '0.875rem', md: '0.938rem' },
                fontWeight: 500,
                textTransform: 'none',
                padding: { xs: '6px 12px', md: '8px 16px' },
                minWidth: 'auto',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: appleColors.primary[500],
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              Sample Analysis
            </Button>

            {/* Pricing Link */}
            <Button
              onClick={() => navigate('/pricing')}
              sx={{
                color: appleColors.gray[700],
                fontSize: { xs: '0.875rem', md: '0.938rem' },
                fontWeight: 500,
                textTransform: 'none',
                padding: { xs: '6px 12px', md: '8px 16px' },
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: appleColors.primary[500],
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              Pricing
            </Button>

            {/* What's New Link */}
            <Button
              onClick={() => navigate('/whats-new')}
              sx={{
                color: appleColors.gray[600],
                fontSize: { xs: '0.875rem', md: '0.938rem' },
                fontWeight: 500,
                textTransform: 'none',
                padding: { xs: '6px 12px', md: '8px 16px' },
                minWidth: 'auto',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: appleColors.primary[500],
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              What's New
            </Button>

            {/* Login Link */}
            <Button
              onClick={() => navigate('/login')}
              sx={{
                color: appleColors.gray[700],
                fontSize: { xs: '0.875rem', md: '0.938rem' },
                fontWeight: 500,
                textTransform: 'none',
                padding: { xs: '6px 12px', md: '8px 16px' },
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px'
                }
              }}
            >
              Login
            </Button>

            {/* Sign Up Button */}
            <Button
              onClick={() => navigate('/register')}
              variant="outlined"
              sx={{
                color: appleColors.primary[500],
                borderColor: appleColors.primary[500],
                fontSize: { xs: '0.875rem', md: '0.938rem' },
                fontWeight: 600,
                textTransform: 'none',
                padding: { xs: '6px 16px', md: '8px 20px' },
                borderRadius: '8px',
                borderWidth: '1.5px',
                '&:hover': {
                  backgroundColor: appleColors.primary[50],
                  borderColor: appleColors.primary[600],
                  borderWidth: '1.5px'
                }
              }}
            >
              Sign Up Free
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicHeader;
