/**
 * Post-submit screen. Same split-screen shell as LoginPage for visual
 * continuity. Right panel shows "check your email" with 60s resend
 * cooldown and spam-folder guidance.
 */

import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { authApi } from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import analyzrLogo from '../assets/analyzr-logo.png';

const COOLDOWN_SECONDS = 60;

const CheckEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const email = params.get('email') || '';
  const isUnlock = params.get('ref') === 'unlock';

  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleResend = async () => {
    if (resending || cooldown > 0 || !email) return;
    setResending(true);
    setError(null);

    try {
      const res = await authApi.requestMagicLink(email);
      if (res.status === 429) {
        setError("You've requested too many links. Try again in 15 minutes.");
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
    minHeight: isMobile ? '220px' : isTablet ? '280px' : '100vh',
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
    height: isMobile ? '48px' : isTablet ? '64px' : '100px',
    width: 'auto',
    marginBottom: isMobile ? '16px' : '28px',
    objectFit: 'contain',
    display: 'block',
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
    textAlign: 'center',
  };

  const buttonDisabled = cooldown > 0 || resending || !email;
  const resendButtonStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? '48px' : '52px',
    borderRadius: '12px',
    fontSize: isMobile ? '0.938rem' : '1rem',
    fontWeight: 500,
    border: `1.5px solid ${buttonDisabled ? '#e5e7eb' : '#d1d5db'}`,
    cursor: buttonDisabled ? 'not-allowed' : 'pointer',
    backgroundColor: '#fff',
    color: buttonDisabled ? '#9ca3af' : '#374151',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  };

  return (
    <div style={containerStyle}>
      {/* HERO */}
      <div style={heroStyle}>
        <div style={heroContentStyle}>
          <img src={analyzrLogo} alt="REanalyzr" style={logoStyle} />
          <h1
            style={{
              fontSize: isMobile ? '1.5rem' : isTablet ? '2rem' : '2.75rem',
              fontWeight: 700,
              margin: '0 0 12px 0',
              letterSpacing: isMobile ? '-0.5px' : '-1.5px',
              color: 'white',
              lineHeight: 1.15,
            }}
          >
            {isUnlock ? 'Almost there.' : "You're one click away."}
          </h1>
          {!isMobile && (
            <p
              style={{
                fontSize: isTablet ? '1rem' : '1.125rem',
                color: 'rgba(255,255,255,0.75)',
                margin: 0,
                lineHeight: 1.5,
                fontWeight: 300,
                maxWidth: '440px',
              }}
            >
              {isUnlock
                ? 'Click the link we just sent to unlock your full analysis.'
                : 'Click the link we just sent to sign in. No password needed.'}
            </p>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={formContainerStyle}>
        <div style={formInnerStyle}>
          <EmailOutlinedIcon
            sx={{
              fontSize: 56,
              color: '#0a0a0a',
              mb: 2,
            }}
            aria-hidden="true"
          />

          <h2
            style={{
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: 700,
              color: '#0a0a0a',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Check your email
          </h2>

          <p style={{ fontSize: '0.938rem', color: '#6b7280', margin: '0 0 4px 0', lineHeight: 1.5 }}>
            We sent a sign-in link to
          </p>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#0a0a0a',
              margin: '0 0 20px 0',
              wordBreak: 'break-all',
            }}
          >
            {email || 'your email'}
          </p>

          <p
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 28px 0',
              lineHeight: 1.6,
            }}
          >
            {isUnlock
              ? 'Click the link in the email to unlock your full analysis. It expires in 15 minutes.'
              : 'Click the link in the email to finish signing in. It expires in 15 minutes.'}
          </p>

          {error && (
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
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            style={resendButtonStyle}
            disabled={buttonDisabled}
            aria-live="polite"
          >
            {cooldown > 0 ? `Resend link (${cooldown}s)` : resending ? 'Sending…' : 'Resend link'}
          </button>

          <div style={{ marginTop: 14 }}>
            <RouterLink
              to="/login"
              style={{
                fontSize: '0.875rem',
                color: '#0a0a0a',
                textDecoration: 'none',
                fontWeight: 500,
                borderBottom: '1px solid transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = '#0a0a0a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
            >
              Use a different email
            </RouterLink>
          </div>

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              marginTop: 32,
              paddingTop: 20,
              textAlign: 'left',
            }}
          >
            <p style={{ fontSize: '0.813rem', fontWeight: 600, color: '#374151', margin: '0 0 6px 0' }}>
              Didn't get it?
            </p>
            <p style={{ fontSize: '0.813rem', color: '#6b7280', margin: 0, lineHeight: 1.55 }}>
              Check your spam folder, or search "REanalyzr" in your inbox.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0a0a0a',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.875rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            zIndex: 10000,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default CheckEmailPage;
