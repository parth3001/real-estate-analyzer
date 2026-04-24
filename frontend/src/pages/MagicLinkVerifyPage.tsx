/**
 * Verify page. Two modes:
 *  - Loading / success: full-bleed dark splash with spinner and logo
 *    (strong transition moment; matches platform identity)
 *  - Error: split-screen shell (reuses LoginPage visual language) with
 *    contextual copy + inline resend form
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CircularProgress from '@mui/material/CircularProgress';
import { authApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import analyzrLogo from '../assets/analyzr-logo.png';

type ErrorReason = 'expired' | 'used' | 'invalid' | 'network';

const MIN_SPINNER_MS = 400;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MagicLinkVerifyPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
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
        setResendError(
          res.status === 429 ? 'Too many attempts. Try again later.' : 'Something went wrong. Try again.'
        );
        setResending(false);
        return;
      }
      navigate(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setResendError('Something went wrong. Try again.');
      setResending(false);
    }
  };

  // ---------- Full-bleed loading/success state ----------
  if (status === 'loading' || status === 'success') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}
      >
        <img
          src={analyzrLogo}
          alt="REanalyzr"
          style={{ height: isMobile ? '72px' : '120px', width: 'auto', marginBottom: '40px' }}
        />
        <CircularProgress size={32} sx={{ color: 'white', mb: 3 }} />
        <p style={{ fontSize: '1.063rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, margin: 0 }}>
          {status === 'success' ? 'Signed in.' : 'Signing you in…'}
        </p>
      </div>
    );
  }

  // ---------- Error state (split-screen shell) ----------
  const errorCopy: Record<ErrorReason, { heroH1: string; heroSub: string; h1: string; body: string; icon: React.ReactNode }> = {
    expired: {
      heroH1: 'This link expired.',
      heroSub: 'Sign-in links expire after 15 minutes for security.',
      h1: 'Get a fresh link',
      body: 'Links expire fast on purpose. Enter your email below and we\'ll send another.',
      icon: <ScheduleOutlinedIcon sx={{ fontSize: 56, color: '#0a0a0a', mb: 2 }} />,
    },
    used: {
      heroH1: "This link's been used.",
      heroSub: 'Looks like you signed in from another device or tab.',
      h1: 'Need a fresh link?',
      body: "If that wasn't you, request a new link below. Your account stays safe.",
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#0a0a0a', mb: 2 }} />,
    },
    invalid: {
      heroH1: "Something's not right.",
      heroSub: 'This link doesn\'t look valid.',
      h1: 'Request a new link',
      body: 'The link might have been mistyped or copied incorrectly. Enter your email and we\'ll send a fresh one.',
      icon: <ErrorOutlineIcon sx={{ fontSize: 56, color: '#0a0a0a', mb: 2 }} />,
    },
    network: {
      heroH1: "Couldn't sign in.",
      heroSub: 'A network error got in the way.',
      h1: 'Try again',
      body: 'Enter your email and we\'ll send a fresh sign-in link.',
      icon: <ErrorOutlineIcon sx={{ fontSize: 56, color: '#0a0a0a', mb: 2 }} />,
    },
  };
  const copy = errorCopy[errorReason];

  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: (isMobile || isTablet ? 'column' : 'row') as 'column' | 'row',
    margin: 0,
    padding: 0,
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  };

  const heroStyle: React.CSSProperties = {
    width: isMobile || isTablet ? '100%' : '50%',
    height: isMobile || isTablet ? 'auto' : '100vh',
    minHeight: isMobile ? '240px' : isTablet ? '300px' : '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '32px 20px' : isTablet ? '40px 30px' : '40px',
    boxSizing: 'border-box',
    overflow: 'auto',
  };

  const formContainerStyle: React.CSSProperties = {
    width: isMobile || isTablet ? '100%' : '50%',
    height: isMobile || isTablet ? 'auto' : '100vh',
    flex: isMobile || isTablet ? '1 0 auto' : 'none',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '32px 20px' : isTablet ? '40px 30px' : '48px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? '52px' : '56px',
    padding: isMobile ? '0 16px' : '0 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '1.063rem',
    backgroundColor: '#fff',
    color: '#000',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const buttonDisabled = !EMAIL_REGEX.test(resendEmail.trim()) || resending;
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? '52px' : '56px',
    borderRadius: '12px',
    fontSize: '1.063rem',
    fontWeight: 600,
    border: 'none',
    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
    backgroundColor: buttonDisabled ? '#e5e7eb' : '#0a0a0a',
    color: buttonDisabled ? '#9ca3af' : '#ffffff',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={heroStyle}>
        <div style={{ maxWidth: isMobile ? '100%' : '560px', textAlign: 'center' }}>
          <img
            src={analyzrLogo}
            alt="REanalyzr"
            style={{ height: isMobile ? '52px' : '100px', width: 'auto', marginBottom: '24px' }}
          />
          <h1
            style={{
              fontSize: isMobile ? '1.75rem' : isTablet ? '2.25rem' : '2.75rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 12px 0',
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
            }}
          >
            {copy.heroH1}
          </h1>
          {!isMobile && (
            <p
              style={{
                fontSize: isTablet ? '1rem' : '1.125rem',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            >
              {copy.heroSub}
            </p>
          )}
        </div>
      </div>

      <div style={formContainerStyle}>
        <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
          {copy.icon}

          <h2
            style={{
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: 700,
              color: '#0a0a0a',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {copy.h1}
          </h2>

          <p
            style={{
              fontSize: '0.938rem',
              color: '#6b7280',
              margin: '0 0 24px 0',
              lineHeight: 1.6,
            }}
          >
            {copy.body}
          </p>

          {resendError && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.813rem',
                marginBottom: '16px',
                border: '1px solid #fecaca',
                textAlign: 'left',
              }}
            >
              {resendError}
            </div>
          )}

          <form onSubmit={handleResend} style={{ textAlign: 'left' }}>
            {!prefillEmail && (
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="resend-email"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Email address
                </label>
                <input
                  id="resend-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  required
                  placeholder="you@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <button type="submit" style={buttonStyle} disabled={buttonDisabled}>
              {resending ? 'Sending…' : 'Send me a new link →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <RouterLink
              to="/login"
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                textDecoration: 'none',
              }}
            >
              ← Back to sign in
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkVerifyPage;
