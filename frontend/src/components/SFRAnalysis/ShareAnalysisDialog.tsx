/**
 * ShareAnalysisDialog — Send branded analysis report via email
 *
 * UX Designer approved:
 * - Send as primary CTA, Preview as optional secondary
 * - Full-screen bottom sheet on mobile (40%+ property tour usage)
 * - Property context (address + score) shown at top for confirmation
 * - Personal note with placeholder guidance
 * - Success state shows recipient email prominently
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { appleColors } from '../../theme/appleDesignSystem';
import { useAuth } from '../../contexts/AuthContext';
import { pdfApi } from '../../services/api';

interface ShareAnalysisDialogProps {
  open: boolean;
  onClose: () => void;
  analysis: any;
  propertyData: any;
  strategy: string;
}

type DialogState = 'compose' | 'preview' | 'sending' | 'success' | 'error';

const ShareAnalysisDialog: React.FC<ShareAnalysisDialogProps> = ({
  open,
  onClose,
  analysis,
  propertyData,
  strategy,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [state, setState] = useState<DialogState>('compose');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');

  const dealQualityScore = analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0;
  const propertyAddress = propertyData?.address || propertyData?.propertyAddress?.street || '';
  const strategyLabel = strategy === 'brrrr' ? 'BRRRR' : 'Buy & Hold';
  const scoreColor = dealQualityScore >= 80 ? appleColors.green[600] : dealQualityScore >= 65 ? appleColors.orange[600] : appleColors.red[600];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (): boolean => {
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (ccEmail && !emailRegex.test(ccEmail)) {
      setEmailError('CC email address is invalid');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;

    setState('sending');
    setServerError('');

    try {
      await pdfApi.shareAnalysis({
        recipientEmail: recipientEmail.trim(),
        ccEmail: ccEmail.trim() || undefined,
        personalNote: personalNote.trim() || undefined,
        analysis,
        propertyData,
        strategy,
      });
      setState('success');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to send. Please try again.';
      setServerError(msg);
      setState('error');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setState('compose');
    setRecipientEmail('');
    setCcEmail('');
    setPersonalNote('');
    setEmailError('');
    setServerError('');
    onClose();
  };

  const keyMetrics = analysis?.keyMetrics || {};
  const isBrrrr = strategy === 'brrrr';
  const projectionYears = isBrrrr ? 15 : (propertyData?.projectionYears || 10);

  // ---- Compose View ----
  const renderCompose = () => (
    <>
      <DialogContent sx={{ px: isMobile ? 2 : 3, pt: 2 }}>
        {/* Property Context Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 2.5,
          backgroundColor: appleColors.gray[50],
          borderRadius: '12px',
          border: `1px solid ${appleColors.gray[200]}`,
        }}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: 220 }}>
              {propertyAddress || 'Property Analysis'}
            </Typography>
            <Chip
              label={strategyLabel}
              size="small"
              sx={{
                mt: 0.5,
                height: 22,
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: isBrrrr ? appleColors.green[50] : appleColors.blue[50],
                color: isBrrrr ? appleColors.green[700] : appleColors.blue[700],
              }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: scoreColor, lineHeight: 1 }}>
              {dealQualityScore}
            </Typography>
            <Typography variant="caption" color="text.secondary">/100</Typography>
          </Box>
        </Box>

        {/* Recipient Email */}
        <TextField
          label="Recipient Email"
          placeholder="banker@lendingpartner.com"
          fullWidth
          required
          value={recipientEmail}
          onChange={(e) => { setRecipientEmail(e.target.value); setEmailError(''); }}
          error={!!emailError}
          helperText={emailError}
          sx={{ mb: 2 }}
          autoFocus
          InputProps={{ sx: { borderRadius: '10px' } }}
        />

        {/* CC Email */}
        <TextField
          label="CC (optional)"
          placeholder="partner@email.com"
          fullWidth
          value={ccEmail}
          onChange={(e) => { setCcEmail(e.target.value); setEmailError(''); }}
          sx={{ mb: 2 }}
          InputProps={{ sx: { borderRadius: '10px' } }}
        />

        {/* Personal Note */}
        <TextField
          label="Personal Note (optional)"
          placeholder="Add a note for the recipient — e.g., 'Here's the deal we discussed'"
          fullWidth
          multiline
          rows={3}
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value.slice(0, 500))}
          helperText={`${personalNote.length}/500`}
          sx={{ mb: 1 }}
          InputProps={{ sx: { borderRadius: '10px' } }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          The recipient will receive a professional PDF report with property details, financing, key metrics, and {projectionYears}-year projections. No AI commentary is included.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, pb: 2, gap: 1 }}>
        <Button
          onClick={() => { if (validate()) setState('preview'); }}
          startIcon={<VisibilityIcon />}
          sx={{ textTransform: 'none', color: appleColors.gray[600] }}
        >
          Preview
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<SendIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
            backgroundColor: appleColors.primary[500],
            '&:hover': { backgroundColor: appleColors.primary[600] },
          }}
        >
          Send
        </Button>
      </DialogActions>
    </>
  );

  // ---- Preview View ----
  const renderPreview = () => (
    <>
      <DialogContent sx={{ px: isMobile ? 2 : 3, pt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>EMAIL SUBJECT</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, backgroundColor: appleColors.gray[50], borderRadius: '8px', fontSize: '13px' }}>
            Property Analysis: {propertyAddress || 'Property Analysis'} | Deal Score: {dealQualityScore}/100 — Shared by {user?.email?.split('@')[0] || 'User'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>TO</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{recipientEmail}</Typography>
          {ccEmail && (
            <>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 1, display: 'block' }}>CC</Typography>
              <Typography variant="body2">{ccEmail}</Typography>
            </>
          )}
        </Box>

        {personalNote && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>PERSONAL NOTE</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: appleColors.gray[600] }}>
              "{personalNote}"
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>PDF ATTACHMENT</Typography>
          <Box sx={{
            mt: 0.5,
            p: 2,
            backgroundColor: appleColors.gray[50],
            borderRadius: '8px',
            border: `1px solid ${appleColors.gray[200]}`,
          }}>
            <Typography variant="body2" fontWeight={600}>REanalyzr Property Analysis Report</Typography>
            <Typography variant="caption" color="text.secondary">
              5-6 pages: Executive Summary, Property & Financing, Income & Expenses, Key Metrics ({Object.keys(keyMetrics).length}+ metrics), {projectionYears}-Year Projections
              {isBrrrr ? ', BRRRR Capital Recovery & Exit Scenarios' : ''}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, pb: 2, gap: 1 }}>
        <Button
          onClick={() => setState('compose')}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none', color: appleColors.gray[600] }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<SendIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 3,
            backgroundColor: appleColors.primary[500],
            '&:hover': { backgroundColor: appleColors.primary[600] },
          }}
        >
          Confirm & Send
        </Button>
      </DialogActions>
    </>
  );

  // ---- Sending View ----
  const renderSending = () => (
    <DialogContent sx={{ textAlign: 'center', py: 6 }}>
      <CircularProgress size={48} sx={{ color: appleColors.primary[500], mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        Generating report and sending...
      </Typography>
    </DialogContent>
  );

  // ---- Success View ----
  const renderSuccess = () => (
    <>
      <DialogContent sx={{ textAlign: 'center', py: 5 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: appleColors.green[500], mb: 2 }} />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          Analysis Sent
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          Sent to <strong>{recipientEmail}</strong>
        </Typography>
        {ccEmail && (
          <Typography variant="body2" color="text.secondary">
            CC: {ccEmail}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          The recipient will receive an email with the attached PDF report.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            px: 4,
            backgroundColor: appleColors.primary[500],
            '&:hover': { backgroundColor: appleColors.primary[600] },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </>
  );

  // ---- Error View ----
  const renderError = () => (
    <>
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ borderRadius: '10px', mb: 2 }}>
          {serverError}
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => { setState('compose'); setServerError(''); }}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            backgroundColor: appleColors.primary[500],
          }}
        >
          Try Again
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={state === 'sending' ? undefined : handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          ...(isMobile && {
            position: 'fixed',
            bottom: 0,
            m: 0,
            borderRadius: '16px 16px 0 0',
            maxHeight: '90vh',
          }),
        },
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1,
        px: isMobile ? 2 : 3,
      }}>
        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '18px' }}>
          {state === 'preview' ? 'Preview' : state === 'success' ? '' : 'Share Analysis'}
        </Typography>
        {state !== 'sending' && state !== 'success' && (
          <IconButton onClick={handleClose} size="small" sx={{ color: appleColors.gray[400] }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      {state === 'compose' && renderCompose()}
      {state === 'preview' && renderPreview()}
      {state === 'sending' && renderSending()}
      {state === 'success' && renderSuccess()}
      {state === 'error' && renderError()}
    </Dialog>
  );
};

export default ShareAnalysisDialog;
