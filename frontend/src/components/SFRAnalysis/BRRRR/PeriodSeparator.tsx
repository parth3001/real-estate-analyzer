/**
 * PeriodSeparator Component
 *
 * Visual separator between Initial Hold Period and Post-Refinance Period
 * Displays "REFINANCE EVENT" label with gradient lines
 *
 * Design Philosophy: Apple Design System - Subtle, elegant separation with clear semantic meaning
 *
 * Used in:
 * - BRRRR Financial Details (Tab 2) - between dual-period cards
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Autorenew as AutorenewIcon } from '@mui/icons-material';
import { brrrColors, brrrComponentStyles } from '../../../theme/brrrDesignTokens';

export interface PeriodSeparatorProps {
  /** Custom label (default: "REFINANCE EVENT") */
  label?: string;

  /** Show icon (default: true) */
  showIcon?: boolean;

  /** Custom margin (default: 32px vertical) */
  margin?: string;
}

export const PeriodSeparator: React.FC<PeriodSeparatorProps> = ({
  label = 'REFINANCE EVENT',
  showIcon = true,
  margin = '32px 0',
}) => {
  return (
    <Box
      sx={{
        ...brrrComponentStyles.periodSeparator,
        margin: margin,
      }}
    >
      {/* Left Line */}
      <Box sx={brrrComponentStyles.periodSeparatorLine} />

      {/* Center Label with Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {showIcon && (
          <AutorenewIcon
            sx={{
              fontSize: 18,
              color: brrrColors.postRefinance.primary,
            }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            ...brrrComponentStyles.periodSeparatorLabel,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Right Line */}
      <Box sx={brrrComponentStyles.periodSeparatorLine} />
    </Box>
  );
};

export default PeriodSeparator;
