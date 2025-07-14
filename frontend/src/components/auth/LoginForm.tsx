import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Container,
} from '@mui/material';
import type { LoginCredentials, AuthFormErrors } from '../../types/auth';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const { validateLoginForm } = useAuthValidation();

  // Form state
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});
  const [showPassword] = useState(false);

  // Handle input changes
  const handleChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const errors = validateLoginForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await login(formData);
      
      // Success - redirect or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login failed:', error);
    }
  };

  // Demo user login for development
  const handleDemoLogin = async () => {
    const demoCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'TestPassword123',
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
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your Real Estate Analyzer account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!formErrors.email}
              helperText={formErrors.email}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />

            <TextField
              fullWidth
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              error={!!formErrors.password}
              helperText={formErrors.password}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, height: 48 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Demo Login for Development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>
                
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  Demo Login (test@example.com)
                </Button>
              </>
            )}

            {/* Links */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#2563eb',
                    fontWeight: 500,
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  textDecoration: 'none',
                  color: '#666',
                  fontSize: '14px',
                }}
              >
                Forgot your password?
              </Link>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            © 2025 Real Estate Analyzer. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;