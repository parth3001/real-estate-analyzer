/**
 * FeedbackWidget - Floating Feedback Collection Component
 *
 * Apple-inspired feedback widget with 5 questions for beta users
 * Appears as floating button in bottom-right corner
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  IconButton,
  Fab,
  Zoom,
  Snackbar,
  Alert,
  Slide
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  SentimentVeryDissatisfied
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { feedbackApi } from '../../services/feedbackApi';

interface FeedbackWidgetProps {
  dealId?: string;
  propertyAddress?: string;
  autoShowDelay?: number; // milliseconds to wait before auto-showing
}

interface FeedbackData {
  usefulnessRating: number;
  mostHelpfulFeature: string;
  easeOfUse: string;
  wouldRecommend: string;
  additionalFeedback: string;
  dealId?: string;
  propertyAddress?: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  dealId,
  propertyAddress,
  autoShowDelay = 15000 // 15 seconds default
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [formData, setFormData] = useState<FeedbackData>({
    usefulnessRating: 0,
    mostHelpfulFeature: '',
    easeOfUse: '',
    wouldRecommend: '',
    additionalFeedback: '',
    dealId,
    propertyAddress
  });

  // Auto-show logic - show button after delay if not previously submitted
  useEffect(() => {
    const hasSubmittedBefore = localStorage.getItem('feedbackSubmitted');
    if (hasSubmittedBefore) {
      setShowButton(true); // Show button but don't auto-open
      return;
    }

    const timer = setTimeout(() => {
      setShowButton(true);
      // Don't auto-open, just show the button - less intrusive
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [autoShowDelay]);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleClose();
    // Don't mark as submitted if they skip
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.usefulnessRating === 0) {
      alert('Please rate how useful this analysis was');
      return;
    }

    setIsSubmitting(true);

    try {
      await feedbackApi.submitFeedback({
        ...formData,
        dealId,
        propertyAddress,
        submittedAt: new Date().toISOString()
      });

      setHasSubmitted(true);
      setShowSuccessMessage(true);
      localStorage.setItem('feedbackSubmitted', 'true');

      // Close dialog after brief delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showButton) return null;

  return (
    <>
      {/* Floating Feedback Button */}
      <Zoom in={showButton && !hasSubmitted}>
        <Fab
          color="primary"
          aria-label="feedback"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: appleColors.primary[500],
            color: '#fff',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
            '&:hover': {
              backgroundColor: appleColors.primary[600],
              boxShadow: '0 12px 32px rgba(59, 130, 246, 0.45)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1300
          }}
        >
          <FeedbackIcon />
        </Fab>
      </Zoom>

      {/* Feedback Dialog */}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as any}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: appleColors.primary[50],
            borderBottom: `1px solid ${appleColors.primary[100]}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600} color={appleColors.primary[700]}>
              💬 Quick Feedback
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Help us improve your experience (30 seconds)
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {/* Question 1: Usefulness Rating */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              1. How useful was this analysis for your investment decision? *
            </Typography>
            <Rating
              value={formData.usefulnessRating}
              onChange={(_, value) => setFormData({ ...formData, usefulnessRating: value || 0 })}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: appleColors.primary[500]
                }
              }}
            />
          </Box>

          {/* Question 2: Most Helpful Feature */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              2. What feature helped you most?
            </Typography>
            <RadioGroup
              value={formData.mostHelpfulFeature}
              onChange={(e) => setFormData({ ...formData, mostHelpfulFeature: e.target.value })}
            >
              <FormControlLabel
                value="verdict"
                control={<Radio />}
                label="Investment Decision verdict (BUY/NEGOTIATE/PASS)"
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="metrics"
                control={<Radio />}
                label="Financial metrics & cash flow analysis"
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="ai"
                control={<Radio />}
                label="AI-powered insights & recommendations"
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="projections"
                control={<Radio />}
                label="Long-term projections"
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="interactive"
                control={<Radio />}
                label="Interactive sliders / scenario testing"
                sx={{ mb: 0.5 }}
              />
              <FormControlLabel
                value="tax"
                control={<Radio />}
                label="Tax intelligence"
                sx={{ mb: 0.5 }}
              />
            </RadioGroup>
          </Box>

          {/* Question 3: Ease of Use */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              3. How easy was it to use?
            </Typography>
            <RadioGroup
              row
              value={formData.easeOfUse}
              onChange={(e) => setFormData({ ...formData, easeOfUse: e.target.value })}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1
              }}
            >
              <FormControlLabel
                value="very-easy"
                control={<Radio />}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentVerySatisfied sx={{ fontSize: 32, color: appleColors.green[500] }} />
                    <Typography variant="caption" display="block">Very easy</Typography>
                  </Box>
                }
                labelPlacement="top"
                sx={{ mx: 0 }}
              />
              <FormControlLabel
                value="easy"
                control={<Radio />}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentSatisfied sx={{ fontSize: 32, color: appleColors.green[400] }} />
                    <Typography variant="caption" display="block">Easy</Typography>
                  </Box>
                }
                labelPlacement="top"
                sx={{ mx: 0 }}
              />
              <FormControlLabel
                value="okay"
                control={<Radio />}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentNeutral sx={{ fontSize: 32, color: appleColors.gray[400] }} />
                    <Typography variant="caption" display="block">Okay</Typography>
                  </Box>
                }
                labelPlacement="top"
                sx={{ mx: 0 }}
              />
              <FormControlLabel
                value="difficult"
                control={<Radio />}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentDissatisfied sx={{ fontSize: 32, color: appleColors.orange[400] }} />
                    <Typography variant="caption" display="block">Difficult</Typography>
                  </Box>
                }
                labelPlacement="top"
                sx={{ mx: 0 }}
              />
              <FormControlLabel
                value="very-difficult"
                control={<Radio />}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <SentimentVeryDissatisfied sx={{ fontSize: 32, color: appleColors.red[500] }} />
                    <Typography variant="caption" display="block">Very difficult</Typography>
                  </Box>
                }
                labelPlacement="top"
                sx={{ mx: 0 }}
              />
            </RadioGroup>
          </Box>

          {/* Question 4: Would Recommend */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              4. Would you recommend this to other investors?
            </Typography>
            <RadioGroup
              value={formData.wouldRecommend}
              onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.value })}
            >
              <FormControlLabel value="definitely" control={<Radio />} label="👍 Yes, definitely" />
              <FormControlLabel value="probably" control={<Radio />} label="👌 Probably" />
              <FormControlLabel value="not-sure" control={<Radio />} label="🤷 Not sure" />
              <FormControlLabel value="probably-not" control={<Radio />} label="👎 Probably not" />
              <FormControlLabel value="no" control={<Radio />} label="❌ No" />
            </RadioGroup>
          </Box>

          {/* Question 5: Additional Feedback */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              5. What's missing or confusing? (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Tell us what would make this better..."
              value={formData.additionalFeedback}
              onChange={(e) => setFormData({ ...formData, additionalFeedback: e.target.value })}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button
            onClick={handleSkip}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: appleColors.gray[300],
              color: appleColors.gray[700],
              '&:hover': {
                borderColor: appleColors.gray[400],
                backgroundColor: appleColors.gray[50]
              }
            }}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || formData.usefulnessRating === 0}
            startIcon={<SendIcon />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: appleColors.primary[500],
              px: 3,
              '&:hover': {
                backgroundColor: appleColors.primary[600]
              }
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          sx={{
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}
        >
          Thank you for your feedback! 🎉
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackWidget;
