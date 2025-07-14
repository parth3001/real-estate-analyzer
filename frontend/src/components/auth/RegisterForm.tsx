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
  Container,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import type { RegisterData, AuthFormErrors } from '../../types/auth';
import { useAuth, useAuthValidation } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const { validateRegisterForm } = useAuthValidation();

  // Form state
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword] = useState(false);

  // Handle input changes
  const handleChange = (field: keyof RegisterData) => (
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

  // Handle confirm password change
  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    
    // Clear password confirmation error
    if (formErrors.general) {
      setFormErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Validate password confirmation
  const validatePasswordConfirmation = (): boolean => {
    if (formData.password !== confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        general: 'Passwords do not match'
      }));
      return false;
    }
    return true;
  };

  // Validate terms agreement
  const validateTermsAgreement = (): boolean => {
    if (!agreeToTerms) {
      setFormErrors(prev => ({
        ...prev,
        general: 'Please agree to the Terms of Service and Privacy Policy'
      }));
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const errors = validateRegisterForm(formData);
    
    // Additional validations
    if (!validatePasswordConfirmation() || !validateTermsAgreement()) {
      return;
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await register(formData);
      
      // Success - redirect or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo);
      }
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Registration failed:', error);
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
            maxWidth: 500,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign Up
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your Real Estate Analyzer account
            </Typography>
          </Box>

          {/* Error Alert */}
          {(error || formErrors.general) && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => {
                clearError();
                setFormErrors(prev => ({ ...prev, general: undefined }));
              }}
            >
              {error || formErrors.general}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Name Fields */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  id="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  required
                  autoComplete="given-name"
                  disabled={isLoading}
                />
                <TextField
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  required
                  autoComplete="family-name"
                  disabled={isLoading}
                />
              </Box>

              {/* Email */}
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                autoComplete="email"
                disabled={isLoading}
              />

              {/* Password */}
              <TextField
                fullWidth
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                error={!!formErrors.password}
                helperText={formErrors.password || 'Must be at least 8 characters with uppercase, lowercase, and number'}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Confirm Password */}
              <TextField
                fullWidth
                id="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Terms Agreement */}
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      color="primary"
                      disabled={isLoading}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link 
                        to="/terms" 
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link 
                        to="/privacy" 
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                      >
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
              </Box>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !agreeToTerms}
              sx={{ mt: 3, mb: 2, height: 48 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#2563eb',
                    fontWeight: 500,
                  }}
                >
                  Sign in
                </Link>
              </Typography>
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

export default RegisterForm;