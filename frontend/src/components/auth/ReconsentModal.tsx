/**
 * ReconsentModal — Task #78 (2026-06-18).
 *
 * Forced re-consent modal shown after login when the user's stored
 * termsVersion is older than the latest material ToS version. Blocks
 * access to the app until they affirmatively re-accept.
 *
 * Material-change semantics: the backend's CURRENT_TOS_VERSION constant
 * + requiresReconsent helper decide when to surface this. Non-material
 * patches don't trigger the modal (silent update).
 *
 * Why this exists: passive "by continuing you agree" (browsewrap) is
 * increasingly struck down for material changes (arbitration, class
 * action waiver, pricing model, dispute resolution). Clickwrap with
 * affirmative acceptance is the legal standard.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';

interface ReconsentModalProps {
  open: boolean;
  newTosVersion: string;
  onAccepted: () => void;
}

export function ReconsentModal({
  open,
  newTosVersion,
  onAccepted,
}: ReconsentModalProps): React.JSX.Element {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (): Promise<void> => {
    if (!agreed) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/auth/reaccept-terms');
      onAccepted();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not record acceptance.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      // Forced modal — no close on backdrop / escape until accepted.
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      data-testid="reconsent-modal"
    >
      <DialogTitle sx={{ pb: 1 }}>We've updated our Terms</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2 }}>
          REanalyzr's Terms of Service have been updated in ways that affect
          your relationship with the platform. Please review and re-accept
          before continuing.
        </Typography>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            mb: 2,
            bgcolor: 'background.default',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
            What changed in v{newTosVersion}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Review the full document at{' '}
            <MuiLink
              component={RouterLink}
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </MuiLink>
            . If you do not agree, you can decline and your account will be
            locked from further use; contact{' '}
            <MuiLink href="mailto:legal@reanalyzr.com">
              legal@reanalyzr.com
            </MuiLink>{' '}
            for data export or deletion.
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              data-testid="reconsent-checkbox"
            />
          }
          label={
            <Typography sx={{ fontSize: 13 }}>
              I have read and agree to the updated{' '}
              <MuiLink
                component={RouterLink}
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </MuiLink>{' '}
              and{' '}
              <MuiLink
                component={RouterLink}
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </MuiLink>
              .
            </Typography>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          disabled={!agreed || submitting}
          onClick={handleAccept}
          data-testid="reconsent-accept"
          sx={{ minWidth: 160 }}
        >
          {submitting ? 'Recording…' : 'I Accept'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
