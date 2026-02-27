/**
 * Hidden Section Teaser Component
 *
 * Displays a teaser for content that's hidden behind signup
 * Creates curiosity gap and urgency to unlock full analysis
 * Reusable for any hidden section (70% Rule, Break-Even Occupancy, etc.)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface HiddenSectionTeaserProps {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error'; // Affects color scheme
  icon?: React.ReactNode;
}

export const HiddenSectionTeaser: React.FC<HiddenSectionTeaserProps> = ({
  title,
  description,
  severity,
  icon,
}) => {
  // Get color based on severity
  const getBgColor = () => {
    switch (severity) {
      case 'error':
        return 'error.lighter';
      case 'warning':
        return 'warning.lighter';
      case 'info':
      default:
        return 'info.lighter';
    }
  };

  const getBorderColor = () => {
    switch (severity) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'info':
      default:
        return 'info.main';
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 3,
        bgcolor: getBgColor(),
        borderRadius: 2,
        border: '1px dashed', // Dashed to indicate placeholder
        borderColor: getBorderColor(),
      }}
    >
      {/* Title with lock icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LockOutlinedIcon
          sx={{
            fontSize: '1.5rem',
            color: 'text.secondary',
            mr: 1,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          lineHeight: 1.6,
          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};
