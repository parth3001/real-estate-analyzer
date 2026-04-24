/**
 * Verify page. Hits backend with ?token=..., stores JWT pair on success,
 * redirects to dashboard. Handles expired / used / invalid states with
 * in-line resend. Enforces 400ms minimum loading time to avoid a jarring
 * flash for fast verifies.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { authApi } from '../services/api';
import { appleColors } from '../theme/appleDesignSystem';

type ErrorReason = 'expired' | 'used' | 'invalid' | 'network';

const MIN_SPINNER_MS = 400;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MagicLinkVerifyPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorReason, setErrorReason] = useState<ErrorReason>('invalid');
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = params.get('token');
    if (!token) {
      setErrorReason('invalid');
      setStatus('error');
      return;
    }

    const startedAt = Date.now();

    (async () => {
      try {
        const res = await authApi.verifyMagicLink(token);
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_SPINNER_MS - elapsed);

        setTimeout(() => {
          if (res.data?.ok && res.data.accessToken) {
            setStatus('success');
            // Small beat so the success state is actually seen (reassurance)
            // before we navigate to the dashboard.
            setTimeout(() => navigate('/dashboard'), 200);
            return;
          }

          const reason = (res.data?.reason as ErrorReason) || 'invalid';
          const email = res.data?.email || '';
          setErrorReason(reason === 'expired' || reason === 'used' ? reason : 'invalid');
          setPrefillEmail(email);
          setResendEmail(email);
          setStatus('error');
        }, wait);
      } catch {
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_SPINNER_MS - elapsed);
        setTimeout(() => {
          setErrorReason('network');
          setStatus('error');
        }, wait);
      }
    })();
  }, [params, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = resendEmail.trim();
    if (!EMAIL_REGEX.test(email) || resending) return;

    setResending(true);
    setResendError(null);

    try {
      const res = await authApi.requestMagicLink(email);
      if (res.status >= 400) {
        setResendError(res.status === 429 ? 'Too many attempts. Try again later.' : 'Something went wrong. Try again.');
        setResending(false);
        return;
      }
      navigate(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setResendError('Something went wrong. Try again.');
      setResending(false);
    }
  };

  const errorCopy: Record<ErrorReason, { h1: string; body: string; icon: React.ReactNode }> = {
    expired: {
      h1: 'This link expired',
      body: 'Sign-in links expire after 15 minutes for security. Want a new one?',
      icon: <ScheduleOutlinedIcon sx={{ fontSize: 64, color: appleColors.gray[400], mb: 2 }} />,
    },
    used: {
      h1: "This link's already been used",
      body: "Looks like you signed in from another device or tab. If that wasn't you, request a fresh link below.",
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 64, color: appleColors.gray[400], mb: 2 }} />,
    },
    invalid: {
      h1: "Something's not right",
      body: "This link doesn't look valid. It might have been mistyped or copied incorrectly.",
      icon: <ErrorOutlineIcon sx={{ fontSize: 64, color: appleColors.gray[400], mb: 2 }} />,
    },
    network: {
      h1: "Couldn't sign in",
      body: 'A network error got in the way. Try again in a moment.',
      icon: <ErrorOutlineIcon sx={{ fontSize: 64, color: appleColors.gray[400], mb: 2 }} />,
    },
  };

  const shellSx = {
    backgroundColor: '#f5f5f7',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const cardSx = {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    p: { xs: 3, md: 5 },
    textAlign: 'center' as const,
  };

  if (status === 'loading' || status === 'success') {
    return (
      <Box sx={shellSx}>
        <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
          <Box sx={cardSx}>
            <Typography sx={{ fontSize: '20px', fontWeight: 700, color: appleColors.gray[900], mb: 4, textAlign: 'left', letterSpacing: '-0.02em' }}>
              REanalyzr
            </Typography>
            <CircularProgress size={32} sx={{ color: appleColors.primary[500], mb: 3 }} />
            <Typography sx={{ fontSize: '17px', fontWeight: 500, color: appleColors.gray[600] }}>
              {status === 'success' ? 'Signed in.' : 'Signing you in…'}
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  const copy = errorCopy[errorReason];

  return (
    <Box sx={shellSx}>
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
        <Box sx={cardSx}>
          <Typography sx={{ fontSize: '20px', fontWeight: 700, color: appleColors.gray[900], mb: 4, textAlign: 'left', letterSpacing: '-0.02em' }}>
            REanalyzr
          </Typography>

          {copy.icon}

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              fontWeight: 700,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em',
              mb: 2,
            }}
          >
            {copy.h1}
          </Typography>

          <Typography sx={{ fontSize: '15px', color: appleColors.gray[600], lineHeight: 1.6, mb: 3 }}>
            {copy.body}
          </Typography>

          {resendError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', textAlign: 'left' }} onClose={() => setResendError(null)}>
              {resendError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleResend} sx={{ textAlign: 'left' }}>
            {!prefillEmail && (
              <TextField
                fullWidth
                type="email"
                label="Email address"
                placeholder="you@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    height: 56,
                    fontSize: '17px',
                    '& fieldset': { borderColor: appleColors.gray[200] },
                    '&.Mui-focused fieldset': { borderColor: appleColors.primary[500], borderWidth: 2 },
                  },
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!EMAIL_REGEX.test(resendEmail.trim()) || resending}
              sx={{
                backgroundColor: appleColors.primary[500],
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '12px',
                height: 56,
                boxShadow: 'none',
                '&:hover': { backgroundColor: appleColors.primary[600], boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: appleColors.primary[500], opacity: 0.4, color: '#ffffff' },
              }}
            >
              {resending ? (
                <>
                  <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
                  Sending…
                </>
              ) : (
                'Send me a new link →'
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MagicLinkVerifyPage;
