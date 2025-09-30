import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
} from '@mui/material';
import { CheckCircle, Email, Refresh } from '@mui/icons-material';
import { authApi } from '../services/api';

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verificationState, setVerificationState] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationState('error');
      setMessage('No verification token found in URL');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const result = await authApi.verifyEmail(verificationToken);

      if (result.status === 200) {
        setVerificationState('success');
        setMessage(result.data.message || 'Email verified successfully!');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setVerificationState('error');
        setMessage(result.message || 'Email verification failed');
      }
    } catch (error) {
      setVerificationState('error');
      setMessage('Email verification failed. The link may be expired or invalid.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setResending(true);
    try {
      const result = await authApi.resendVerification(email);

      if (result.status === 200) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(result.message || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationState) {
      case 'verifying':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your email address.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirecting to dashboard in 3 seconds...
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              size="large"
            >
              Go to Dashboard
            </Button>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Email sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {message}
            </Alert>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Need a new verification link?
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                size="small"
              />
              <Button
                variant="outlined"
                onClick={handleResendVerification}
                disabled={resending}
                startIcon={resending ? <CircularProgress size={16} /> : <Refresh />}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text">
                  Back to Login
                </Button>
              </Link>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            REanalyzr
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Email Verification
          </Typography>
        </Box>

        {renderContent()}
      </Paper>
    </Container>
  );
};

export default EmailVerificationPage;