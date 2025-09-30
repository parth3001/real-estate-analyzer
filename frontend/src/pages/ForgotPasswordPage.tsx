import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { authApi } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await authApi.forgotPassword(email);

      if (result.status === 200) {
        setMessage(
          'If an account with this email exists, you will receive a password reset link shortly. Please check your inbox and spam folder.'
        );
        setMessageType('success');
        setEmailSent(true);
      } else {
        // Show generic message for security (don't reveal if email exists)
        setMessage(
          'If an account with this email exists, you will receive a password reset link shortly. Please check your inbox and spam folder.'
        );
        setMessageType('info');
        setEmailSent(true);
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again later.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setMessage('');
    handleSubmit(new Event('submit') as any);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            REanalyzr
          </Typography>
          <Typography variant="h5" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {emailSent
              ? 'Check your email for reset instructions'
              : 'Enter your email address and we\'ll send you a reset link'
            }
          </Typography>
        </Box>

        {message && (
          <Alert severity={messageType} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {!emailSent ? (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              placeholder="Enter your email address"
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !email}
              sx={{ mt: 3, mb: 2 }}
              size="large"
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text" startIcon={<ArrowBack />}>
                  Back to Login
                </Button>
              </Link>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              We've sent password reset instructions to <strong>{email}</strong> if an account exists.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Didn't receive the email? Check your spam folder, or try again with a different email address.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleResendEmail}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Another Email'}
              </Button>

              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text" startIcon={<ArrowBack />}>
                  Back to Login
                </Button>
              </Link>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Remember your password?{' '}
            <Link to="/login" style={{ color: 'inherit' }}>
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPasswordPage;