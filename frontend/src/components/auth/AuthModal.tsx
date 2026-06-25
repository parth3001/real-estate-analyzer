/**
 * AuthModal — Issue #193 (#36 follow-on, 2026-06-24).
 *
 * Inline magic-link auth dialog. Replaces the full-page route to /login
 * during high-intent CTA flows (Save this deal, Sign in inline, etc.)
 * so the user keeps visual context of whatever they were just doing.
 *
 * Two visible states:
 *   - 'form' → email input + submit
 *   - 'sent' → "Check your email" success state with the address rendered
 *
 * Backend behavior is identical to the LoginPage form: hits
 * authApi.requestMagicLink with the anonymous chat sessionId pulled from
 * sessionStorage. The magic-link verify page handles the rest of the
 * auth + chat-session-claim flow regardless of which device opens the
 * email. So the modal doesn't auto-close on success — the user expects
 * to leave to their email anyway.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link as MuiLink,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { authApi } from '../../services/api';
import type { AuthModalSource } from '../../contexts/AuthModalContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADLINE: Record<AuthModalSource, string> = {
  'sign-in': 'Sign in to REanalyzr',
  'save-deal': 'Save this deal — free',
  'email-cta': 'Email me this analysis',
  generic: 'Sign in or sign up',
};

const SUBHEAD: Record<AuthModalSource, string> = {
  'sign-in':
    "One link gets you in. New here? We'll create your account.",
  'save-deal':
    'Your first full analysis is free. Sign up with email — no card, no password.',
  'email-cta':
    "Enter your email and we'll send the PDF along with a sign-in link.",
  generic:
    "One link gets you in. New here? We'll create your account.",
};

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  source: AuthModalSource;
  /** Optional ref tag — mirrors LoginPage ?ref=unlock for analytics + copy. */
  refTag: 'unlock' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  source,
  refTag,
}) => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'form' | 'sent'>('form');

  // Reset on close so a re-open starts fresh.
  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setTouched(false);
      setState('form');
      // Keep `email` so reopening within the same session preserves it
      // (lower friction than wiping every time).
    }
  }, [open]);

  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);
  const showInvalidMsg = touched && trimmed.length > 0 && !isValid;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Pull the anonymous chat sessionId from sessionStorage so the
      // server can bind the magic-link token to it — the verify page
      // then merges the ghost user's events into the new real user.
      // Same wire-up as LoginPage; the magic-link flow works
      // regardless of which device opens the email.
      const pendingChatSessionId =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('reanalyzr.chat.sessionId') ?? undefined
          : undefined;

      const res = await authApi.requestMagicLink(trimmed, {
        pendingChatSessionId,
      });

      if (res.status === 429) {
        setError('Too many sign-in attempts. Try again in 15 minutes.');
        setSubmitting(false);
        return;
      }
      if (res.status >= 400) {
        setError('Something went wrong. Try again.');
        setSubmitting(false);
        return;
      }

      setState('sent');
      setSubmitting(false);
    } catch {
      setError('Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          // Apple-style soft shadow, see UX designer notes
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative', p: 3.5, pb: 3 }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
          aria-label="Close"
          data-testid="auth-modal-close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {state === 'form' && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.75 }}>
              {HEADLINE[source]}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.5 }}
            >
              {SUBHEAD[source]}
            </Typography>

            <DialogContent sx={{ p: 0 }}>
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    type="email"
                    autoComplete="email"
                    autoFocus
                    fullWidth
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    error={showInvalidMsg}
                    helperText={
                      showInvalidMsg ? 'Please enter a valid email.' : ' '
                    }
                    disabled={submitting}
                    inputProps={{
                      'data-testid': 'auth-modal-email',
                      inputMode: 'email',
                    }}
                    size="small"
                  />

                  {error && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={!isValid || submitting}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1.25,
                      fontWeight: 600,
                    }}
                    data-testid="auth-modal-submit"
                  >
                    {submitting ? 'Sending…' : 'Send sign-in link'}
                  </Button>

                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textAlign: 'center' }}
                  >
                    No password to remember. No card required. New or returning,
                    same link.
                  </Typography>
                </Stack>
              </form>
            </DialogContent>
          </>
        )}

        {state === 'sent' && (
          <Box sx={{ textAlign: 'center', py: 1.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.50',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                color: 'primary.main',
              }}
            >
              <MarkEmailReadOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.75 }}>
              Check your email
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.5 }}
            >
              We sent a sign-in link to <strong>{trimmed}</strong>. Tap the link
              to finish signing in. The link works for 15 minutes.
            </Typography>
            <Stack spacing={1.25}>
              <MuiLink
                component="button"
                type="button"
                onClick={() => {
                  setState('form');
                  setError(null);
                }}
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  textDecorationStyle: 'dotted',
                }}
                data-testid="auth-modal-resend"
              >
                Wrong email? Try again.
              </MuiLink>
              <Button
                variant="text"
                onClick={onClose}
                sx={{ textTransform: 'none', fontSize: 13 }}
                data-testid="auth-modal-done"
              >
                Close
              </Button>
            </Stack>
            {/* Keep refTag analytics-tagged for downstream funnel reports. */}
            {refTag && <Box sx={{ display: 'none' }} data-ref={refTag} />}
          </Box>
        )}
      </Box>
    </Dialog>
  );
};
