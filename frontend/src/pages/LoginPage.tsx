/**
 * Magic-link sign-in page (replaces both /login and /register).
 * One email field, one CTA, passive Terms acceptance.
 */

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { authApi } from '../services/api';
import { appleColors } from '../theme/appleDesignSystem';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = EMAIL_REGEX.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await authApi.requestMagicLink(email.trim());

      if (res.status === 429) {
        const retry = (res.data as any)?.retryAfter || '15 minutes';
        setError(`Too many sign-in attempts. Try again in ${retry}.`);
        setSubmitting(false);
        return;
      }

      if (res.status >= 400) {
        setError('Something went wrong. Try again.');
        setSubmitting(false);
        return;
      }

      navigate(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError('Something went wrong. Try again.');
      setSubmitting(false);
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
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em',
              mb: { xs: 4, md: 5 },
            }}
          >
            REanalyzr
          </Typography>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.875rem', md: '2.5rem' },
              fontWeight: 700,
              color: appleColors.gray[900],
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Run the numbers on your next deal
          </Typography>

          <Typography
            sx={{
              fontSize: '16px',
              color: appleColors.gray[600],
              lineHeight: 1.5,
              mb: 4,
            }}
          >
            Enter your email and we'll send you a one-click sign-in link. No password needed.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              type="email"
              label="Email address"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              inputMode="email"
              autoFocus
              inputProps={{ 'aria-label': 'Email address' }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  height: 56,
                  fontSize: '17px',
                  '& fieldset': { borderColor: appleColors.gray[200] },
                  '&:hover fieldset': { borderColor: appleColors.gray[400] },
                  '&.Mui-focused fieldset': { borderColor: appleColors.primary[500], borderWidth: 2 },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!isValid || submitting}
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
              {submitting ? (
                <>
                  <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
                  Sending…
                </>
              ) : (
                'Send me a link →'
              )}
            </Button>
          </Box>

          <Typography
            sx={{
              fontSize: '13px',
              color: appleColors.gray[500],
              textAlign: 'center',
              mt: 4,
              mb: 2,
            }}
          >
            🔒 Secure sign-in by email
          </Typography>

          <Typography
            sx={{
              fontSize: '12px',
              color: appleColors.gray[500],
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            By continuing you agree to our{' '}
            <Link component={RouterLink} to="/terms" sx={{ color: appleColors.gray[600] }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link component={RouterLink} to="/privacy" sx={{ color: appleColors.gray[600] }}>
              Privacy Policy
            </Link>
            .
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
