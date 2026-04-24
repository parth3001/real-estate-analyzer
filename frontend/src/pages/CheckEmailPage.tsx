/**
 * Post-submit screen. Shows "we sent a link to <email>" with a 60s
 * cooldown resend and spam-folder guidance. Does not poll — the
 * verify page is the next touchpoint.
 */

import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Snackbar,
  Link,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { authApi } from '../services/api';
import { appleColors } from '../theme/appleDesignSystem';

const COOLDOWN_SECONDS = 60;

const CheckEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';

  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (resending || cooldown > 0 || !email) return;
    setResending(true);
    setError(null);

    try {
      const res = await authApi.requestMagicLink(email);
      if (res.status === 429) {
        const retry = (res.data as any)?.retryAfter || '15 minutes';
        setError(`You've requested too many links. Try again in ${retry}.`);
      } else if (res.status >= 400) {
        setError('Something went wrong. Try again.');
      } else {
        setToast('Link resent. Check your inbox.');
        setCooldown(COOLDOWN_SECONDS);
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
        <Box
          sx={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            p: { xs: 3, md: 5 },
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em',
              mb: { xs: 3, md: 4 },
              textAlign: 'left',
            }}
          >
            REanalyzr
          </Typography>

          <EmailOutlinedIcon
            sx={{
              fontSize: 64,
              color: appleColors.primary[500],
              mb: 2,
              display: 'block',
              mx: 'auto',
            }}
            aria-hidden="true"
          />

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.625rem', md: '2rem' },
              fontWeight: 700,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em',
              mb: 2,
            }}
          >
            Check your email
          </Typography>

          <Typography sx={{ fontSize: '16px', color: appleColors.gray[600], lineHeight: 1.6, mb: 1 }}>
            We sent a sign-in link to
          </Typography>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: appleColors.gray[900],
              wordBreak: 'break-all',
              mb: 3,
            }}
          >
            {email || 'your email'}
          </Typography>

          <Typography sx={{ fontSize: '15px', color: appleColors.gray[600], lineHeight: 1.7, mb: 4 }}>
            Click the link in the email to finish signing in. It expires in 15 minutes.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px', textAlign: 'left' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            onClick={handleResend}
            disabled={cooldown > 0 || resending || !email}
            aria-live="polite"
            sx={{
              borderColor: appleColors.gray[200],
              color: appleColors.gray[700],
              fontWeight: 500,
              fontSize: '15px',
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              py: 1.25,
              mb: 1.5,
              '&:hover': { borderColor: appleColors.gray[400], backgroundColor: 'transparent' },
              '&.Mui-disabled': { borderColor: appleColors.gray[200], color: appleColors.gray[400] },
            }}
          >
            {cooldown > 0 ? `Resend link (${cooldown}s)` : resending ? 'Sending…' : 'Resend link'}
          </Button>

          <Box>
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                fontSize: '14px',
                color: appleColors.primary[500],
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Use a different email
            </Link>
          </Box>

          <Box sx={{ borderTop: `1px solid ${appleColors.gray[200]}`, mt: 4, pt: 3, textAlign: 'left' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: appleColors.gray[700], mb: 1 }}>
              Didn't get it?
            </Typography>
            <Typography sx={{ fontSize: '13px', color: appleColors.gray[500], lineHeight: 1.6 }}>
              Check your spam folder, or search "REanalyzr" in your inbox.
            </Typography>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast || ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CheckEmailPage;
