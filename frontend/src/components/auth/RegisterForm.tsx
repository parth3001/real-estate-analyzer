import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';
import type { RegisterData, AuthFormErrors } from '../../types/auth';
import analyzrLogo from '../../assets/analyzr-logo.png';
import { useResponsive } from '../../hooks/useResponsive';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo = '/dashboard'
}) => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const { validateRegisterForm } = useAuthValidation();
  const { isMobile, isTablet } = useResponsive();

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (confirmPassword !== formData.password) {
      setFormErrors({ general: 'Passwords do not match' });
      return;
    }

    if (!agreeToTerms) {
      setFormErrors({ general: 'You must agree to the terms and conditions' });
      return;
    }

    const errors = validateRegisterForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await register(formData);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  // Responsive styles (adapted from LoginForm)
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
    height: isMobile || isTablet ? '35vh' : '100vh', // Smaller hero for register (more form fields)
    minHeight: isMobile ? '250px' : isTablet ? '300px' : '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
    boxSizing: 'border-box' as const,
    overflow: 'auto'
  });

  const getHeroContentStyle = () => ({
    maxWidth: isMobile ? '100%' : isTablet ? '400px' : '500px',
    width: '100%',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  });

  const getLogoStyle = () => ({
    height: isMobile ? '50px' : isTablet ? '60px' : '100px',
    width: 'auto',
    marginBottom: isMobile ? '12px' : isTablet ? '16px' : '24px',
    objectFit: 'contain' as const,
    display: 'block'
  });

  const getTitleStyle = () => ({
    fontSize: isMobile ? '2rem' : isTablet ? '2.75rem' : '3.5rem',
    fontWeight: 700,
    margin: '0 0 8px 0',
    letterSpacing: isMobile ? '-0.5px' : isTablet ? '-1px' : '-2px',
    color: 'white',
    lineHeight: 0.9
  });

  const getSubtitleStyle = () => ({
    fontSize: isMobile ? '0.875rem' : isTablet ? '1rem' : '1.25rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: isMobile ? '16px' : isTablet ? '20px' : '32px',
    lineHeight: 1.3,
    fontWeight: 300
  });

  const getFeaturesStyle = () => ({
    display: isMobile ? 'none' : 'flex', // Hide features on mobile to save space
    flexDirection: 'column' as const,
    gap: isTablet ? '16px' : '24px',
    alignItems: 'flex-start',
    maxWidth: '350px',
    margin: '0 auto'
  });

  const getFeatureStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    gap: isTablet ? '12px' : '16px'
  });

  const getFeatureTextStyle = () => ({
    fontSize: isTablet ? '0.875rem' : '1rem',
    color: 'rgba(255, 255, 255, 0.9)'
  });

  const getFormContainerStyle = () => ({
    width: isMobile || isTablet ? '100%' : '50%',
    height: isMobile || isTablet ? '65vh' : '100vh', // More space for register form
    minHeight: isMobile || isTablet ? 'auto' : '100vh',
    background: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const
  });

  const getInputStyle = () => ({
    width: '100%',
    height: isMobile ? '48px' : isTablet ? '52px' : '56px', // Slightly smaller for register form
    padding: isMobile ? '0 12px' : isTablet ? '0 16px' : '0 20px',
    border: '2px solid #e5e7eb',
    borderRadius: isMobile ? '6px' : '12px',
    fontSize: isMobile ? '0.875rem' : isTablet ? '1rem' : '1rem',
    backgroundColor: 'white',
    color: '#000000',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const
  });

  const getLabelStyle = () => ({
    display: 'block',
    marginBottom: isMobile ? '4px' : '8px',
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    fontWeight: 500,
    color: '#374151'
  });

  const getFieldMarginStyle = () => ({
    marginBottom: isMobile ? '16px' : isTablet ? '20px' : '24px'
  });

  const getButtonStyle = () => ({
    width: '100%',
    height: isMobile ? '44px' : isTablet ? '48px' : '56px',
    borderRadius: isMobile ? '6px' : '12px',
    fontSize: isMobile ? '0.875rem' : isTablet ? '1rem' : '1.125rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  });

  const getBottomTextStyle = () => ({
    textAlign: 'center' as const,
    marginTop: isMobile ? '16px' : isTablet ? '24px' : '40px',
    fontSize: isMobile ? '0.75rem' : '1rem',
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
              <span style={{ fontSize: isTablet ? '20px' : '24px' }}>📊</span>
              <span style={getFeatureTextStyle()}>47+ Analysis Metrics</span>
            </div>
            <div style={getFeatureStyle()}>
              <span style={{ fontSize: isTablet ? '20px' : '24px' }}>🤖</span>
              <span style={getFeatureTextStyle()}>AI-Powered Market Insights</span>
            </div>
            <div style={getFeatureStyle()}>
              <span style={{ fontSize: isTablet ? '20px' : '24px' }}>🏠</span>
              <span style={getFeatureTextStyle()}>All Property Types</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM SECTION - Responsive */}
      <div style={getFormContainerStyle()}>
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '360px' : '480px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : isTablet ? '2.25rem' : '2.75rem',
            fontWeight: 600,
            color: '#0a0a0a',
            margin: '0 0 6px 0',
            letterSpacing: isMobile ? '-0.5px' : isTablet ? '-1px' : '-1.5px'
          }}>
            Sign Up
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: isMobile ? '0.875rem' : isTablet ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '20px' : isTablet ? '28px' : '40px',
            lineHeight: 1.4
          }}>
            Create your Real Estate Analyzer account
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

          {formErrors.general && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              marginBottom: '32px',
              color: '#dc2626'
            }}>
              {formErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0' : isTablet ? '12px' : '16px',
              marginBottom: isMobile ? '0' : isTablet ? '16px' : '24px'
            }}>
              <div style={{ flex: 1, marginBottom: isMobile ? '16px' : '0' }}>
                <label style={getLabelStyle()}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
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
              <div style={{ flex: 1 }}>
                <label style={getLabelStyle()}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
            </div>

            <div style={getFieldMarginStyle()}>
              <label style={getLabelStyle()}>
                Email Address *
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

            <div style={getFieldMarginStyle()}>
              <label style={getLabelStyle()}>
                Password *
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
              <p style={{
                marginTop: isMobile ? '4px' : '8px',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#6b7280'
              }}>
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div style={getFieldMarginStyle()}>
              <label style={getLabelStyle()}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {confirmPassword && confirmPassword !== formData.password && (
                <p style={{
                  marginTop: isMobile ? '4px' : '8px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#dc2626'
                }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <div style={{
              marginBottom: isMobile ? '20px' : isTablet ? '24px' : '32px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  style={{
                    marginRight: isMobile ? '8px' : '12px',
                    marginTop: '2px',
                    width: isMobile ? '16px' : '20px',
                    height: isMobile ? '16px' : '20px',
                    accentColor: '#6366f1'
                  }}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}>
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms}
              style={{
                ...getButtonStyle(),
                backgroundColor: isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms ? '#e5e7eb' : '#0a0a0a',
                color: isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms ? '#9ca3af' : 'white'
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={getBottomTextStyle()}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#0a0a0a',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: isMobile ? '0.75rem' : '1rem'
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;