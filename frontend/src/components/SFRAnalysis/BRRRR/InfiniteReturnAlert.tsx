/**
 * Infinite Return Alert Component
 *
 * Displays a celebratory alert when a BRRRR deal achieves infinite return
 * (100%+ capital recovery rate - investor recovers all invested capital)
 *
 * Features:
 * - 2-second pulse animation on first render
 * - Respects prefers-reduced-motion accessibility
 * - Auto-hides for non-infinite return deals
 *
 * @author FSE from CLAUDE.md
 * @date December 22, 2025
 */

import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { appleColors } from '../../../theme/appleDesignSystem';
import { formatPercent } from '../../../utils/formatters';

// Subtle pulse animation for celebration
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

interface InfiniteReturnAlertProps {
  capitalRecoveryRate: number;
  capitalRemaining: number;
}

export const InfiniteReturnAlert: React.FC<InfiniteReturnAlertProps> = ({
  capitalRecoveryRate,
  capitalRemaining
}) => {
  const [showAnimation, setShowAnimation] = useState(true);

  // Respect user's motion preferences (accessibility)
  const shouldAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-disable animation after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Only show for infinite return deals (100%+)
  if (capitalRecoveryRate < 100) return null;

  return (
    <Box
      sx={{
        animation: (showAnimation && shouldAnimate)
          ? `${pulseAnimation} 600ms ease-in-out`
          : 'none',
        mb: 3
      }}
    >
      <Alert
        severity="success"
        sx={{
          backgroundColor: appleColors.green[500],
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          '& .MuiAlert-icon': { color: 'white', fontSize: '32px' }
        }}
        icon={<span>🎉</span>}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'white', mb: 2 }}>
            INFINITE RETURN ACHIEVED!
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 400 }}>
            You'll own this property with $0 of your capital invested.
          </Typography>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
              Capital Recovery Rate
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white' }}>
              {formatPercent(capitalRecoveryRate)}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Box>
  );
};
