import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';
import type { LoginCredentials } from '../../types/auth';
import analyzrLogo from '../../assets/analyzr-logo.png';
import { useResponsive } from '../../hooks/useResponsive';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectTo = '/dashboard'
}) => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const { validateLoginForm } = useAuthValidation();
  const { isMobile, isTablet } = useResponsive();

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateLoginForm(formData);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await login(formData);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async () => {
    const demoCredentials: LoginCredentials = {
      email: 'admin@reanalyzr.com',
      password: 'Spring@2025',
    };
    setFormData(demoCredentials);
    try {
      await login(demoCredentials);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  // Responsive styles
  const getContainerStyle = () => ({
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: (isMobile || isTablet ? 'column' : 'row') as 'column' | 'row',
    margin: 0,
    padding: 0,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
  });

  const getHeroStyle = () => ({
    width: isMobile || isTablet ? '100%' : '50%',
    height: isMobile || isTablet ? '40vh' : '100vh',
    minHeight: isMobile ? '300px' : isTablet ? '350px' : '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '20px' : isTablet ? '30px' : '40px',
    boxSizing: 'border-box' as const,
    overflow: 'auto'
  });

  const getHeroContentStyle = () => ({
    maxWidth: isMobile ? '100%' : isTablet ? '500px' : '600px',
    width: '100%',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  });

  const getLogoStyle = () => ({
    height: isMobile ? '60px' : isTablet ? '80px' : '140px',
    width: 'auto',
    marginBottom: isMobile ? '16px' : isTablet ? '24px' : '40px',
    objectFit: 'contain' as const,
    display: 'block'
  });

  const getTitleStyle = () => ({
    fontSize: isMobile ? '2.5rem' : isTablet ? '3.5rem' : '4.5rem',
    fontWeight: 700,
    margin: '0 0 12px 0',
    letterSpacing: isMobile ? '-1px' : isTablet ? '-2px' : '-3px',
    color: 'white',
    lineHeight: 0.9
  });

  const getSubtitleStyle = () => ({
    fontSize: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: isMobile ? '24px' : isTablet ? '32px' : '48px',
    lineHeight: 1.3,
    fontWeight: 300
  });

  const getFeaturesStyle = () => ({
    display: isMobile ? 'none' : 'flex', // Hide features on mobile to save space
    flexDirection: 'column' as const,
    gap: isTablet ? '24px' : '32px',
    alignItems: 'flex-start',
    maxWidth: '400px',
    margin: '0 auto'
  });

  const getFeatureStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    gap: isTablet ? '16px' : '24px'
  });

  const getFeatureTextStyle = () => ({
    fontSize: isTablet ? '1.125rem' : '1.375rem',
    color: 'rgba(255, 255, 255, 0.9)'
  });

  const getFormContainerStyle = () => ({
    width: isMobile || isTablet ? '100%' : '50%',
    height: isMobile || isTablet ? '60vh' : '100vh',
    minHeight: isMobile || isTablet ? 'auto' : '100vh',
    background: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '20px' : isTablet ? '30px' : '40px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const
  });

  const getInputStyle = () => ({
    width: '100%',
    height: isMobile ? '52px' : isTablet ? '56px' : '64px', // Touch-friendly but responsive
    padding: isMobile ? '0 16px' : isTablet ? '0 20px' : '0 24px',
    border: '2px solid #e5e7eb',
    borderRadius: isMobile ? '8px' : '12px',
    fontSize: isMobile ? '1rem' : isTablet ? '1.063rem' : '1.125rem',
    backgroundColor: 'white',
    color: '#000000',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const
  });

  const getLabelStyle = () => ({
    display: 'block',
    marginBottom: isMobile ? '6px' : '8px',
    fontSize: isMobile ? '0.813rem' : '0.875rem',
    fontWeight: 500,
    color: '#374151'
  });

  const getFieldMarginStyle = () => ({
    marginBottom: isMobile ? '20px' : isTablet ? '24px' : '32px'
  });

  const getButtonStyle = () => ({
    width: '100%',
    height: isMobile ? '48px' : isTablet ? '56px' : '64px',
    borderRadius: isMobile ? '8px' : '12px',
    fontSize: isMobile ? '1rem' : isTablet ? '1.063rem' : '1.125rem',
    fontWeight: 600,
    border: 'none',
    cursor: isLoading || !formData.email || !formData.password ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s'
  });

  const getRememberForgotStyle = () => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: (isMobile ? 'column' : 'row') as 'column' | 'row',
    marginBottom: isMobile ? '24px' : isTablet ? '32px' : '40px',
    gap: isMobile ? '12px' : '0'
  });

  const getRememberLabelStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    fontSize: isMobile ? '0.875rem' : '1rem',
    color: '#374151',
    cursor: 'pointer'
  });

  const getCheckboxStyle = () => ({
    marginRight: isMobile ? '8px' : '12px',
    width: isMobile ? '16px' : '20px',
    height: isMobile ? '16px' : '20px',
    accentColor: '#6366f1'
  });

  const getForgotLinkStyle = () => ({
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: isMobile ? '0.875rem' : '1rem',
    fontWeight: 500
  });

  const getBottomTextStyle = () => ({
    textAlign: 'center' as const,
    marginTop: isMobile ? '24px' : isTablet ? '36px' : '48px',
    fontSize: isMobile ? '0.875rem' : '1rem',
    color: '#6b7280'
  });

  return (
    <div style={getContainerStyle()}>
      {/* HERO SECTION - Responsive */}
      <div style={getHeroStyle()}>
        <div style={getHeroContentStyle()}>
          <img
            src={analyzrLogo}
            alt="REanalyzr"
            style={getLogoStyle()}
          />
          <h1 style={getTitleStyle()}>
            REanalyzr
          </h1>
          <p style={getSubtitleStyle()}>
            Professional property investment analysis with AI-powered intelligence
          </p>

          <div style={getFeaturesStyle()}>
            <div style={getFeatureStyle()}>
              <span style={{ fontSize: isTablet ? '24px' : '32px' }}>📊</span>
              <span style={getFeatureTextStyle()}>47+ Analysis Metrics</span>
            </div>
            <div style={getFeatureStyle()}>
              <span style={{ fontSize: isTablet ? '24px' : '32px' }}>🤖</span>
              <span style={getFeatureTextStyle()}>AI-Powered Market Insights</span>
            </div>
            <div style={getFeatureStyle()}>
              <span style={{ fontSize: isTablet ? '24px' : '32px' }}>🏠</span>
              <span style={getFeatureTextStyle()}>All Property Types</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM SECTION - Responsive */}
      <div style={getFormContainerStyle()}>
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '400px' : '480px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.75rem',
            fontWeight: 600,
            color: '#0a0a0a',
            margin: '0 0 8px 0',
            letterSpacing: isMobile ? '-0.5px' : isTablet ? '-1px' : '-1.5px'
          }}>
            Welcome back
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
            marginBottom: isMobile ? '24px' : isTablet ? '32px' : '40px',
            lineHeight: 1.4
          }}>
            Sign in to access your property analyses and portfolio
          </p>

          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              marginBottom: '32px',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={getFieldMarginStyle()}>
              <label style={getLabelStyle()}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={getInputStyle()}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: isMobile ? '16px' : isTablet ? '20px' : '24px' }}>
              <label style={getLabelStyle()}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={getInputStyle()}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={getRememberForgotStyle()}>
              <label style={getRememberLabelStyle()}>
                <input
                  type="checkbox"
                  style={getCheckboxStyle()}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={getForgotLinkStyle()}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              style={{
                ...getButtonStyle(),
                backgroundColor: isLoading || !formData.email || !formData.password ? '#e5e7eb' : '#0a0a0a',
                color: isLoading || !formData.email || !formData.password ? '#9ca3af' : 'white'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <>
              <div style={{
                textAlign: 'center',
                margin: isMobile ? '24px 0' : isTablet ? '32px 0' : '40px 0',
                position: 'relative'
              }}>
                <span style={{
                  backgroundColor: 'white',
                  padding: isMobile ? '0 12px' : '0 16px',
                  position: 'relative',
                  zIndex: 1,
                  color: '#9ca3af',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  OR
                </span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  zIndex: 0
                }} />
              </div>
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                style={{
                  ...getButtonStyle(),
                  backgroundColor: 'transparent',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  fontWeight: 500
                }}
              >
                Demo Login (Admin User)
              </button>
            </>
          )}

          <p style={getBottomTextStyle()}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#0a0a0a',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;