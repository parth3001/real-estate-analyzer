import React, { useState, useEffect } from 'react';
import { Box, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { appleColors } from '../../theme/appleDesignSystem';
import analyzrLogo from '../../assets/analyzr-logo.png';

const StickyHeader: React.FC = () => {
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Sticky after 100px scroll
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: isSticky ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
        transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
        opacity: isSticky ? 1 : 0,
        pointerEvents: isSticky ? 'auto' : 'none',
        height: { xs: '56px', md: '64px' }
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
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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

          {/* Login + Sign Up CTAs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
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

export default StickyHeader;
