import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { appleColors, appleBorderRadius, appleShadows, appleSpacing } from '../../theme/appleDesignSystem';

/**
 * Educational Modal Component
 *
 * Apple Design System-compliant modal for embedding partner educational videos
 * Supports subdomain multi-tenancy (theficouple.reanalyzr.com, etc.)
 *
 * Design Principles:
 * - Clarity: Clean video presentation with minimal distraction
 * - Deference: Modal enhances without competing with content
 * - Simplicity: Single purpose - watch educational video
 * - Depth: Layered approach with backdrop and shadow
 */

interface EducationalModalProps {
  /**
   * Controls modal visibility
   */
  open: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title (e.g., "Professional Investment Intelligence")
   */
  title: string;

  /**
   * Optional description shown below title
   */
  description?: string;

  /**
   * YouTube embed URL (e.g., "https://www.youtube.com/embed/VIDEO_ID")
   */
  videoUrl: string;

  /**
   * Optional partner name (e.g., "TheFiCouple")
   */
  partnerName?: string;

  /**
   * Optional partner website URL
   */
  partnerUrl?: string;

  /**
   * Optional partner tagline for attribution box
   */
  partnerTagline?: string;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({
  open,
  onClose,
  title,
  description,
  videoUrl,
  partnerName,
  partnerUrl,
  partnerTagline
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: appleBorderRadius.md,
          boxShadow: appleShadows.xl,
          maxWidth: '800px',
          width: {
            xs: '95vw',
            sm: '90vw',
            md: '800px'
          },
          margin: {
            xs: appleSpacing[2],
            sm: appleSpacing[6]
          }
        }
      }}
      // Backdrop styling
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)' // Glass morphism effect
        }
      }}
      // Transition timing
      transitionDuration={300}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${appleColors.gray[200]}`,
          padding: {
            xs: appleSpacing[4],
            sm: appleSpacing[6]
          },
          paddingBottom: appleSpacing[4]
        }}
      >
        <Box sx={{ flex: 1, paddingRight: appleSpacing[4] }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: appleColors.gray[900],
              marginBottom: description ? appleSpacing[1] : 0
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: appleColors.gray[600],
                marginTop: appleSpacing[1]
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          aria-label="Close modal"
          sx={{
            color: appleColors.gray[500],
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              color: appleColors.blue[500],
              backgroundColor: appleColors.gray[100],
              transform: 'scale(1.1)'
            },
            width: 44,
            height: 44
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent
        sx={{
          padding: {
            xs: appleSpacing[4],
            sm: appleSpacing[6]
          },
          paddingTop: appleSpacing[6]
        }}
      >
        {/* Video Embed Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            borderRadius: appleBorderRadius.default,
            overflow: 'hidden',
            backgroundColor: appleColors.gray[900],
            marginBottom: partnerName ? appleSpacing[6] : 0
          }}
        >
          <iframe
            src={videoUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </Box>

        {/* Partner Attribution (Optional) */}
        {partnerName && (
          <Box
            sx={{
              backgroundColor: appleColors.gray[50],
              borderRadius: appleBorderRadius.default,
              padding: appleSpacing[3],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: appleSpacing[2],
              marginBottom: appleSpacing[4]
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: appleColors.gray[700],
                  fontWeight: 500,
                  marginBottom: partnerTagline ? appleSpacing[1] : 0
                }}
              >
                📺 Educational Content by {partnerName}
              </Typography>
              {partnerTagline && (
                <Typography
                  variant="caption"
                  sx={{
                    color: appleColors.gray[600]
                  }}
                >
                  {partnerTagline}
                </Typography>
              )}
            </Box>
            {partnerUrl && (
              <Link
                href={partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: appleColors.blue[500],
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: appleSpacing[1],
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: appleColors.blue[600]
                  }
                }}
              >
                Visit {partnerName} →
              </Link>
            )}
          </Box>
        )}

        {/* Footer - REanalyzr Branding */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: appleSpacing[4],
            borderTop: `1px solid ${appleColors.gray[100]}`
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: appleColors.gray[500],
              textAlign: 'center'
            }}
          >
            Powered by REanalyzr
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EducationalModal;
