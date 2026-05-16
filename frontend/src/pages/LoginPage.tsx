/**
 * Magic-link sign-in page. Preserves the platform's split-screen design
 * language (dark hero + white form panel) while replacing the password
 * form with a single email input.
 *
 * Context-aware copy via ?ref query param:
 *   - ref=unlock → headline reframed as "Unlock your analysis"
 *     (the user just clicked Unlock Full Analysis on the calculator)
 *   - default → neutral "Sign in or sign up" framing (same magic-link flow
 *     handles both new accounts and returning users)
 */

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import analyzrLogo from '../assets/analyzr-logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();

  const refMode = params.get('ref'); // 'unlock' | null
  const isUnlock = refMode === 'unlock';

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const showInvalidMsg = touched && trimmed.length > 0 && !isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // W6-S5b — if the user came from /app's "Add to my portfolio" CTA,
      // their anonymous chat sessionId is in sessionStorage. Pass it
      // through so the server can bind a chat-claim to this magic-link
      // token row — merge happens automatically on verify, regardless
      // of which device opens the email.
      const pendingChatSessionId =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('reanalyzr.chat.sessionId') ?? undefined
          : undefined;
      const res = await authApi.requestMagicLink(trimmed, {
        pendingChatSessionId,
      });

      if (res.status === 429) {
        setError('Too many sign-in attempts. Try again in 15 minutes.');
        setSubmitting(false);
        return;
      }
      if (res.status >= 400) {
        setError('Something went wrong. Try again.');
        setSubmitting(false);
        return;
      }

      const refParam = isUnlock ? '&ref=unlock' : '';
      navigate(`/auth/check-email?email=${encodeURIComponent(trimmed)}${refParam}`);
    } catch {
      setError('Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  // ---------- Copy ----------
  const rightH1 = isUnlock ? 'Unlock your analysis' : 'Sign in or sign up';
  const rightSubhead = isUnlock
    ? "Enter your email — we'll send you a one-click link so you can see your full analysis."
    : "Enter your email — we'll send you a one-click link. No password needed. New here? We'll create your account automatically.";

  // ---------- Styles (mirrors old LoginForm shell to preserve brand) ----------
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
    minHeight: isMobile ? '320px' : isTablet ? '380px' : '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '32px 20px' : isTablet ? '40px 30px' : '40px',
    boxSizing: 'border-box',
    overflow: 'auto',
  };

  const heroContentStyle: React.CSSProperties = {
    maxWidth: isMobile ? '100%' : isTablet ? '500px' : '560px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const logoStyle: React.CSSProperties = {
    height: isMobile ? '52px' : isTablet ? '72px' : '120px',
    width: 'auto',
    marginBottom: isMobile ? '16px' : isTablet ? '24px' : '36px',
    objectFit: 'contain',
    display: 'block',
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.75rem' : isTablet ? '2.5rem' : '3.25rem',
    fontWeight: 700,
    margin: '0 0 8px 0',
    letterSpacing: isMobile ? '-0.5px' : isTablet ? '-1.5px' : '-2px',
    color: 'white',
    lineHeight: 1.05,
  };

  const heroSubtitleStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.938rem' : isTablet ? '1.125rem' : '1.25rem',
    color: 'rgba(255,255,255,0.75)',
    margin: isMobile ? '12px 0 0' : isTablet ? '16px 0 28px' : '20px 0 36px',
    lineHeight: 1.5,
    fontWeight: 300,
    maxWidth: '520px',
  };

  const featuresStyle: React.CSSProperties = {
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    gap: isTablet ? '20px' : '28px',
    alignItems: 'flex-start',
    maxWidth: '400px',
    margin: '0 auto',
  };

  const featureStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: isTablet ? '14px' : '20px',
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

  const formInnerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '440px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? '52px' : '56px',
    padding: isMobile ? '0 16px' : '0 20px',
    border: `2px solid ${showInvalidMsg ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: '12px',
    fontSize: isMobile ? '1rem' : '1.063rem',
    backgroundColor: '#fff',
    color: '#000',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  };

  const buttonDisabled = !isValid || submitting;
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? '52px' : '56px',
    borderRadius: '12px',
    fontSize: isMobile ? '1rem' : '1.063rem',
    fontWeight: 600,
    border: 'none',
    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    backgroundColor: buttonDisabled ? '#e5e7eb' : '#0a0a0a',
    color: buttonDisabled ? '#9ca3af' : '#ffffff',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div style={containerStyle}>
      {/* HERO — preserves platform identity */}
      <div style={heroStyle}>
        <div style={heroContentStyle}>
          <img src={analyzrLogo} alt="REanalyzr" style={logoStyle} />

          <h1 style={heroTitleStyle}>
            {isUnlock ? 'Unlock Your Full Analysis' : 'Sign In or Sign Up'}
          </h1>

          {!isMobile && (
            <h2
              style={{
                ...heroTitleStyle,
                fontSize: isTablet ? '1.625rem' : '2.25rem',
                letterSpacing: isTablet ? '-1px' : '-1.5px',
                margin: '0 0 12px 0',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: 600,
              }}
            >
              Screen Deals. Track Pipeline. See Portfolio Impact.
            </h2>
          )}

          <p style={heroSubtitleStyle}>
            {isUnlock
              ? "You're seconds away from the full analysis — break-even, 10-year projections, editable assumptions, and side-by-side deal comparisons."
              : 'Structured rental property analysis to screen deals faster with less guesswork. Your pipeline, your numbers, one workflow.'}
          </p>

          <div style={featuresStyle}>
            {[
              { title: 'Instant Analysis', sub: 'Professional metrics in seconds, not hours' },
              { title: 'No Spreadsheets', sub: 'Automated calculations prevent costly mistakes' },
              { title: 'Deal Quality Score', sub: 'Screen deals against your own standards — not just numbers' },
            ].map((f) => (
              <div key={f.title} style={featureStyle}>
                <span
                  style={{
                    fontSize: isTablet ? '20px' : '22px',
                    color: '#10b981',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <span
                    style={{
                      fontSize: isTablet ? '1.063rem' : '1.125rem',
                      color: 'rgba(255,255,255,0.95)',
                      fontWeight: 600,
                    }}
                  >
                    {f.title}
                  </span>
                  <span
                    style={{
                      fontSize: isTablet ? '0.875rem' : '0.938rem',
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1.5,
                    }}
                  >
                    {f.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORM */}
      <div style={formContainerStyle}>
        <div style={formInnerStyle}>
          <h2
            style={{
              fontSize: isMobile ? '1.75rem' : '2rem',
              fontWeight: 700,
              color: '#0a0a0a',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {rightH1}
          </h2>
          <p
            style={{
              fontSize: isMobile ? '0.938rem' : '1rem',
              color: '#6b7280',
              margin: '0 0 32px 0',
              lineHeight: 1.55,
            }}
          >
            {rightSubhead}
          </p>

          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                marginBottom: '20px',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: showInvalidMsg ? '6px' : '20px' }}>
              <label htmlFor="magic-email" style={labelStyle}>
                Email address
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                required
                value={email}
                placeholder="you@email.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={submitting}
                style={inputStyle}
                onFocus={(e) => {
                  if (!showInvalidMsg) e.currentTarget.style.borderColor = '#0a0a0a';
                }}
              />
            </div>

            {showInvalidMsg && (
              <p
                style={{
                  fontSize: '0.813rem',
                  color: '#b91c1c',
                  margin: '0 0 16px 0',
                }}
              >
                Please enter a valid email address.
              </p>
            )}

            <button type="submit" style={buttonStyle} disabled={buttonDisabled}>
              {submitting ? 'Sending…' : 'Send me a link →'}
            </button>
          </form>

          <p
            style={{
              fontSize: '0.813rem',
              color: '#6b7280',
              margin: '20px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
            Secure sign-in by email
          </p>

          <p
            style={{
              fontSize: '0.813rem',
              color: '#6b7280',
              margin: '8px 0 0 0',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            New or returning — we'll get you to the right place.
          </p>

          <p
            style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginTop: '32px',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            By continuing you agree to our{' '}
            <RouterLink to="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>
              Terms
            </RouterLink>{' '}
            and{' '}
            <RouterLink to="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>
              Privacy Policy
            </RouterLink>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
