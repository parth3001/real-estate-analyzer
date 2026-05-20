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
  /**
   * Canonical top-level investmentDecision. When supplied, both the
   * analytics track event AND the analysis payload sent to the PDF
   * backend use this value instead of the (potentially stale) nested
   * decision on `analysis.investmentDecision`. Critical because the
   * PDF backend reads `analysis.investmentDecision` to render the
   * score in the email — if we send stale data, the user receives an
   * email showing a different score than what they saw on screen.
   *
   * Day 11h Stage 2 (2026-05-19): introduced as part of the two-scores
   * bug fix.
   */
  investmentDecision?: any;
}

interface PdfError {
  type: 'rate-limit' | 'network' | 'validation-error' | 'generation-failed' | 'email-failed';
  message: string;
  retryAfter?: number;
}

export const EmailPdfSection: React.FC<EmailPdfSectionProps> = ({ analysis, formData, investmentDecision }) => {
  // Day 11h Stage 2 (2026-05-19): canonical decision resolution.
  // The PDF backend reads `analysis.investmentDecision` to render the
  // score, so we substitute the canonical decision into the analysis
  // payload before sending. Belt-and-suspenders: also use it for the
  // analytics track event below.
  const effectiveDecision = investmentDecision ?? analysis?.investmentDecision;
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
        effectiveDecision?.professionalAssessment?.dealQuality
      );

      // Day 11h Stage 2 (2026-05-19): substitute the canonical decision
      // into the analysis payload before sending to the PDF backend.
      // Without this override, a stale `analysis.investmentDecision`
      // would land on the email PDF — the user would receive a report
      // showing a different score than they saw on screen, which is a
      // trust catastrophe. Stage 1 backfill removes the divergence at
      // the source; this override is the runtime safety net.
      const response = await api.post('/pdf/send-anonymous-pdf', {
        email,
        analysis: { ...analysis, investmentDecision: effectiveDecision },
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
          Get Your Deal Analysis Report (Free)
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontSize: '14px',
          lineHeight: 1.6,
          mb: 2
        }}
      >
        Receive your deal summary including Deal Quality Score, cash flow analysis, cap rate, DSCR, and key investment metrics—delivered instantly to your inbox.
      </Typography>

      {/* Success Message */}
      {success && (
        <Alert
          icon={<CheckCircleIcon />}
          severity="success"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            On its way to your inbox!
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Check your email in the next 2 minutes. (Don't forget to check spam if you don't see it.)
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
            placeholder="Enter your email to receive the report"
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
            slotProps={{
              input: {
                'aria-label': 'Email address',
              }
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
              'Send My Report'
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
        We'll email your complete report instantly. No spam, ever.
      </Typography>
    </Paper>
  );
};
