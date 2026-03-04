/**
 * Email PDF Section Component
 *
 * Allows anonymous users to request PDF analysis via email
 * Feature #14: Anonymous PDF Email Storage
 *
 * Flow:
 * 1. User enters email
 * 2. Frontend sends { email, analysis, formData, strategy } to backend
 * 3. Backend generates PDF using React-PDF
 * 4. Backend sends email with PDF attachment via Resend
 * 5. Backend stores request in MongoDB for conversion tracking
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Analysis } from '../../types/analysis';
import type { CalculatorFormData } from './types';
import api from '../../services/api';
import { analytics } from '../../utils/analytics';

interface EmailPdfSectionProps {
  analysis: Analysis;
  formData: CalculatorFormData;
}

interface PdfError {
  type: 'rate-limit' | 'network' | 'validation-error' | 'generation-failed' | 'email-failed';
  message: string;
  retryAfter?: number;
}

export const EmailPdfSection: React.FC<EmailPdfSectionProps> = ({ analysis, formData }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<PdfError | null>(null);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({
        type: 'validation-error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Track PDF request
      analytics.trackPdfRequestInitiated(
        formData.investmentStrategy,
        analysis.investmentDecision?.professionalAssessment?.dealQuality
      );

      // Send request to backend
      const response = await api.post('/pdf/send-anonymous-pdf', {
        email,
        analysis,
        formData,
        strategy: formData.investmentStrategy,
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail(''); // Clear email field

        // Track success
        analytics.trackPdfRequestSuccess(
          formData.investmentStrategy,
          response.data.dealQualityScore
        );
      }
    } catch (err: any) {
      // Handle different error types from backend
      const errorResponse = err.response?.data;

      if (errorResponse?.type) {
        setError({
          type: errorResponse.type,
          message: errorResponse.error || 'Failed to send PDF. Please try again.',
          retryAfter: errorResponse.retryAfter,
        });
      } else {
        setError({
          type: 'network',
          message: 'Network error. Please check your connection and try again.',
        });
      }

      // Track error
      analytics.trackPdfRequestFailed(
        formData.investmentStrategy,
        errorResponse?.type || 'network'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format retry time for rate limit errors
  const formatRetryTime = (seconds: number): string => {
    const minutes = Math.ceil(seconds / 60);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: success ? 'success.main' : 'divider',
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Email Me This Analysis
        </Typography>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert
          icon={<CheckCircleIcon />}
          severity="success"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            PDF sent successfully! Check your email inbox (and spam folder).
          </Typography>
        </Alert>
      )}

      {/* Error Messages */}
      {error && (
        <Alert
          severity={error.type === 'rate-limit' ? 'warning' : 'error'}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error.type === 'rate-limit' && error.retryAfter
              ? `Rate limit exceeded. Please try again in ${formatRetryTime(error.retryAfter)}.`
              : error.message}
          </Typography>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'flex-start' }}>
          <TextField
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={handleEmailChange}
            disabled={loading || success}
            fullWidth
            size="medium"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            inputProps={{
              'aria-label': 'Email address',
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || success || !email}
            sx={{
              minWidth: { xs: '100%', sm: '180px' },
              height: '56px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Sending...
              </>
            ) : success ? (
              'Sent ✓'
            ) : (
              'Email PDF'
            )}
          </Button>
        </Box>
      </form>

      {/* Disclosure Text */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 2,
          color: 'text.secondary',
          fontSize: '0.75rem',
          lineHeight: 1.4,
        }}
      >
        📧 We'll email you the PDF analysis. We don't share your email with anyone.
        {' '}
        <Typography
          component="span"
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          (Limited to 5 PDFs per hour per user)
        </Typography>
      </Typography>
    </Paper>
  );
};
