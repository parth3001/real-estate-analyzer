import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';
import type { RegisterData, AuthFormErrors } from '../../types/auth';
import analyzrLogo from '../../assets/analyzr-logo.png';

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

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
    }}>
      {/* LEFT SIDE - HERO - EXACTLY 50% */}
      <div style={{
        width: '50%',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        boxSizing: 'border-box',
        overflow: 'auto'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <img
            src={analyzrLogo}
            alt="REanalyzr"
            style={{
              height: '140px',
              width: 'auto',
              marginBottom: '40px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 700,
            margin: '0 0 24px 0',
            letterSpacing: '-3px',
            color: 'white',
            lineHeight: 0.9
          }}>
            REanalyzr
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '48px',
            lineHeight: 1.3,
            fontWeight: 300
          }}>
            Professional property investment analysis with AI-powered intelligence
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            alignItems: 'flex-start',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '32px' }}>📊</span>
              <span style={{ fontSize: '1.375rem', color: 'rgba(255, 255, 255, 0.9)' }}>47+ Analysis Metrics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '32px' }}>🤖</span>
              <span style={{ fontSize: '1.375rem', color: 'rgba(255, 255, 255, 0.9)' }}>AI-Powered Market Insights</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '32px' }}>🏠</span>
              <span style={{ fontSize: '1.375rem', color: 'rgba(255, 255, 255, 0.9)' }}>All Property Types</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM - EXACTLY 50% */}
      <div style={{
        width: '50%',
        height: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px'
        }}>
          <h2 style={{
            fontSize: '2.75rem',
            fontWeight: 600,
            color: '#0a0a0a',
            margin: '0 0 12px 0',
            letterSpacing: '-1.5px'
          }}>
            Sign Up
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '1.25rem',
            marginBottom: '40px',
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
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '56px',
                    padding: '0 20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
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
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '56px',
                    padding: '0 20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
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
                marginTop: '8px',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '56px',
                  padding: '0 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
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
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  Passwords do not match
                </p>
              )}
            </div>

            <div style={{
              marginBottom: '32px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  style={{
                    marginRight: '12px',
                    marginTop: '2px',
                    width: '20px',
                    height: '20px',
                    accentColor: '#6366f1'
                  }}
                />
                <span>
                  I agree to the{' '}
                  <a href="/terms" style={{
                    color: '#6366f1',
                    textDecoration: 'none'
                  }}>
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" style={{
                    color: '#6366f1',
                    textDecoration: 'none'
                  }}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms}
              style={{
                width: '100%',
                height: '64px',
                backgroundColor: isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms ? '#e5e7eb' : '#0a0a0a',
                color: isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !agreeToTerms ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '40px',
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Already have an account?{' '}
            <a href="/login" style={{
              color: '#0a0a0a',
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;