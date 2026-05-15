/**
 * EmailCtaModal — W6-S4.
 *
 * "Email me this analysis" CTA on the DealScoreCard. Captures the user's
 * email and POSTs to /api/chat/email-summary (W6-S4) which sends a
 * lightweight text summary via the existing Resend-backed emailService.
 *
 * NOT to be confused with the legacy `/api/pdf/send-anonymous-pdf`
 * endpoint — that one wants the wizard's analysis shape (60+ fields)
 * and isn't a clean fit for the chat surface's substrate-event shape.
 * The chat-side endpoint is intentionally minimal: an emailable summary,
 * not a full PDF (we can layer PDFs in later if conversion data supports
 * the work).
 *
 * Strategic role (per the 2026-05-14 conversation):
 *   The email CTA is the lowest-friction conversion mechanism — calculator-
 *   style "give us your email and we'll send you the deal." Captures into
 *   the User collection's anonymous-ghost record so the user can later
 *   sign up via magic-link and reclaim every deal under that email.
 *
 * Apple HIG:
 *   Modal centered, single-purpose, ~400-460px wide. One input, one
 *   primary action. Loading state inline on the button. Success state
 *   replaces the form with a confirmation message + dismiss.
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { sendChatEmailSummary } from '../../services/chatApi';
import type { DealScoreCardProps } from './DealScoreCard';

interface EmailCtaModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  conversationEventId: string | undefined;
  dealScoreCard: Omit<DealScoreCardProps, 'onChangeAssumptions'> | null;
}

type FormStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

/**
 * Trivial email-format check — defensive only; the backend validates
 * properly. The UX goal is to catch obvious typos before the round-trip,
 * not to enforce RFC-5321.
 */
function looksLikeEmail(s: string): boolean {
  return /^\S+@\S+\.\S+$/.test(s);
}

export function EmailCtaModal(props: EmailCtaModalProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });

  // Reset on (re-)open so a previous success state doesn't linger.
  useEffect(() => {
    if (props.open) {
      setEmail('');
      setStatus({ kind: 'idle' });
    }
  }, [props.open]);

  const canSubmit =
    status.kind === 'idle' &&
    looksLikeEmail(email) &&
    props.conversationEventId != null;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!canSubmit || !props.conversationEventId) return;
    setStatus({ kind: 'sending' });
    try {
      await sendChatEmailSummary({
        email,
        sessionId: props.sessionId,
        conversationEventId: props.conversationEventId,
      });
      setStatus({ kind: 'success' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error && err.message
            ? err.message
            : "Couldn't send the email. Try again in a moment.",
      });
    }
  };

  // Address snippet shown for context — gives the user confidence they're
  // emailing the RIGHT deal (not a stale card from earlier in the thread).
  const addressSnippet = props.dealScoreCard
    ? `${props.dealScoreCard.address.street}, ${props.dealScoreCard.address.city} ${props.dealScoreCard.address.state}`
    : '';

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
        // Identify the modal in tests + DOM inspectors.
        'data-testid': 'email-cta-modal',
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
          fontSize: 18,
        }}
      >
        <EmailOutlinedIcon sx={{ fontSize: 22 }} />
        Email me this analysis
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {addressSnippet && (
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {addressSnippet} · Deal Quality {props.dealScoreCard?.dealQuality}/100
          </Typography>
        )}

        {status.kind === 'success' ? (
          <Alert
            icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            severity="success"
            sx={{ borderRadius: 2 }}
            data-testid="email-cta-success"
          >
            Sent to <strong>{email}</strong>. Check your inbox.
          </Alert>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            id="email-cta-form"
          >
            <TextField
              fullWidth
              autoFocus
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status.kind === 'sending'}
              inputProps={{
                'aria-label': 'Email address',
                'data-testid': 'email-cta-input',
              }}
            />
            {status.kind === 'error' && (
              <Alert severity="error" sx={{ borderRadius: 2 }} role="alert">
                {status.message}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {status.kind === 'success' ? (
          <Button
            onClick={props.onClose}
            variant="contained"
            sx={{ minHeight: 44, textTransform: 'none', borderRadius: 2 }}
            data-testid="email-cta-done"
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={props.onClose}
              disabled={status.kind === 'sending'}
              sx={{ minHeight: 44, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="email-cta-form"
              variant="contained"
              disabled={!canSubmit || status.kind === 'sending'}
              startIcon={
                status.kind === 'sending' ? (
                  <CircularProgress size={16} thickness={5} color="inherit" />
                ) : null
              }
              sx={{
                minHeight: 44,
                textTransform: 'none',
                borderRadius: 2,
              }}
              data-testid="email-cta-send"
            >
              {status.kind === 'sending' ? 'Sending…' : 'Send'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
