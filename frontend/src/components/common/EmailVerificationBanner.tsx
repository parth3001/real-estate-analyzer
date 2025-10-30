/**
 * Gentle Email Verification Banner
 * Shows once after user's first analysis (dismissible)
 * Option A: Non-intrusive reminder to verify email
 */

import React, { useState, useEffect } from 'react';
import { Button, IconButton, Snackbar, Alert, Typography } from '@mui/material';
import { Close as CloseIcon, Email as EmailIcon } from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified: boolean;
  onResendVerification: () => Promise<void>;
  onDismiss: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  userEmail,
  isVerified,
  onResendVerification,
  onDismiss
}) => {
  const [open, setOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    const bannerDismissed = localStorage.getItem('emailVerificationBannerDismissed');
    const hasSeenAnalysis = localStorage.getItem('hasCompletedFirstAnalysis');

    // Show banner if:
    // 1. User is not verified
    // 2. Banner hasn't been dismissed
    // 3. User has completed at least one analysis
    if (!isVerified && !bannerDismissed && hasSeenAnalysis) {
      // Show after a short delay (2 seconds) so it doesn't interrupt analysis viewing
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVerified]);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem('emailVerificationBannerDismissed', 'true');
    onDismiss();
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResendVerification();
      setShowSuccessMessage(true);
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: { xs: '16px', sm: '24px' },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          maxWidth: { xs: '100%', sm: '600px' }
        }}
      >
        <Alert
          severity="info"
          icon={<EmailIcon />}
          action={
            <>
              <Button
                color="inherit"
                size="small"
                onClick={handleResend}
                disabled={resending}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  mr: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                {resending ? 'Sending...' : 'Verify Now'}
              </Button>
              <IconButton
                size="small"
                aria-label="dismiss"
                onClick={handleDismiss}
                sx={{ color: 'inherit' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          }
          sx={{
            width: '100%',
            backgroundColor: appleColors.primary[500],
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
            '& .MuiAlert-icon': {
              color: 'white'
            },
            '& .MuiAlert-message': {
              flexGrow: 1,
              py: 0.5
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            📧 Verify Your Email to Secure Your Account
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
            We sent a verification link to <strong>{userEmail}</strong>
          </Typography>
        </Alert>
      </Snackbar>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          sx={{
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
          }}
        >
          Verification email sent! Check your inbox.
        </Alert>
      </Snackbar>
    </>
  );
};

/**
 * Utility function to mark first analysis complete
 * Call this after user completes their first analysis
 */
export const markFirstAnalysisComplete = () => {
  localStorage.setItem('hasCompletedFirstAnalysis', 'true');
};
