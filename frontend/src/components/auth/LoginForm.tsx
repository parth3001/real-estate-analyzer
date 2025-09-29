import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  Container,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fade,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Analytics,
  TrendingUp,
  Home
} from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Form state
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Box>
            {/* Logo and Title Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  mb: 2,
                  boxShadow: 3,
                }}
              >
                <Home sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                reanalyzr
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Professional Property Investment Intelligence
              </Typography>
            </Box>

            {/* Login Card */}
            <Card
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'grey.100',
              }}
            >
              {/* Welcome Message */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Welcome back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to access your property analyses and portfolio
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Fade in>
                  <Alert 
                    severity="error" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={clearError}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {/* Email Field */}
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'grey.50',
                      },
                    }}
                  />

                  {/* Password Field */}
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'grey.50',
                      },
                    }}
                  />

                  {/* Remember Me & Forgot Password */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ marginRight: 8 }}
                      />
                      <Typography
                        component="label"
                        htmlFor="remember-me"
                        variant="body2"
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        Remember me
                      </Typography>
                    </Box>
                    <MuiLink
                      component={Link}
                      to="/forgot-password"
                      variant="body2"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Forgot password?
                    </MuiLink>
                  </Box>

                  {/* Submit Button */}
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading || !formData.email || !formData.password}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      position: 'relative',
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Stack>
              </form>

              {/* Demo Login for Development */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: 'grey.300',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'grey.400',
                        bgcolor: 'grey.50',
                      },
                    }}
                  >
                    Demo Login (Admin User)
                  </Button>
                </>
              )}

              {/* Sign Up Link */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <MuiLink
                    component={Link}
                    to="/register"
                    sx={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Sign up for free
                  </MuiLink>
                </Typography>
              </Box>
            </Card>

            {/* Features Section */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={3}
                justifyContent="center"
                alignItems="center"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    47+ Analysis Metrics
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    AI-Powered Insights
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Home sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    All Property Types
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                © 2025 Real Estate Analyzer. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginForm;