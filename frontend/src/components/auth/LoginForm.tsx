import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';
import type { LoginCredentials } from '../../types/auth';
import analyzrLogo from '../../assets/analyzr-logo.png';

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
      email: 'admin@realestateanalyzer.com',
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
            Welcome back
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '1.25rem',
            marginBottom: '40px',
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
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  height: '64px',
                  padding: '0 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
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
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                style={{
                  width: '100%',
                  height: '64px',
                  padding: '0 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
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

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  style={{
                    marginRight: '12px',
                    width: '20px',
                    height: '20px',
                    accentColor: '#6366f1'
                  }}
                />
                Remember me
              </label>
              <a href="/forgot-password" style={{
                color: '#6366f1',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 500
              }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              style={{
                width: '100%',
                height: '64px',
                backgroundColor: isLoading || !formData.email || !formData.password ? '#e5e7eb' : '#0a0a0a',
                color: isLoading || !formData.email || !formData.password ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.125rem',
                fontWeight: 600,
                cursor: isLoading || !formData.email || !formData.password ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <>
              <div style={{
                textAlign: 'center',
                margin: '40px 0',
                position: 'relative'
              }}>
                <span style={{
                  backgroundColor: 'white',
                  padding: '0 16px',
                  position: 'relative',
                  zIndex: 1,
                  color: '#9ca3af'
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
                  width: '100%',
                  height: '64px',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Demo Login (Admin User)
              </button>
            </>
          )}

          <p style={{
            textAlign: 'center',
            marginTop: '48px',
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Don't have an account?{' '}
            <a href="/register" style={{
              color: '#0a0a0a',
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;