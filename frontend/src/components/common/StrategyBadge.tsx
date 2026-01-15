/**
 * Strategy Badge Component
 *
 * Visual indicator showing which investment strategy is being analyzed:
 * - Buy & Hold (blue)
 * - BRRRR (purple)
 * - House Hacking (green)
 * - Fix & Flip (orange)
 *
 * Design Principles (Apple HIG):
 * - Clarity: Immediate visual strategy identification
 * - Deference: Subtle but informative, doesn't overwhelm
 * - Depth: Icon + color + text create clear hierarchy
 *
 * Issue #75: No strategy indicator on analysis results page
 *
 * @author Principal Software Architect from CLAUDE.md
 * @date January 14, 2026
 */

import React from 'react';
import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  Home,           // Buy & Hold
  Autorenew,      // BRRRR
  LocationCity,   // House Hacking
  Construction    // Fix & Flip
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface StrategyBadgeProps {
  strategy: 'buy-hold' | 'brrrr' | 'house-hack' | 'fix-and-flip';
  size?: 'small' | 'medium';
}

interface StrategyConfig {
  label: string;
  description: string;
  color: string;
  icon: React.ReactElement;
}

/**
 * Strategy Configuration Object
 * Maps each strategy to its visual identity
 */
const STRATEGY_CONFIG: Record<string, StrategyConfig> = {
  'buy-hold': {
    label: 'Buy & Hold Strategy',
    description: 'Traditional rental property investment for long-term cash flow',
    color: appleColors.blue[600],  // #2563EB
    icon: <Home fontSize="small" sx={{ color: 'white' }} />
  },
  'brrrr': {
    label: 'BRRRR Strategy',
    description: 'Buy, Rehab, Rent, Refinance, Repeat - capital recycling approach',
    color: '#7b1fa2',  // Purple (matches existing BRRRR tabs)
    icon: <Autorenew fontSize="small" sx={{ color: 'white' }} />
  },
  'house-hack': {
    label: 'House Hacking Strategy',
    description: 'Live in one unit, rent others to offset mortgage costs',
    color: appleColors.green[600],  // #059669
    icon: <LocationCity fontSize="small" sx={{ color: 'white' }} />
  },
  'fix-and-flip': {
    label: 'Fix & Flip Strategy',
    description: 'Short-term renovation and resale for profit',
    color: appleColors.orange[600],  // #EA580C
    icon: <Construction fontSize="small" sx={{ color: 'white' }} />
  }
};

/**
 * StrategyBadge Component
 *
 * Displays investment strategy with icon, label, and optional description.
 * Responsive: compact on mobile, full details on desktop.
 */
export const StrategyBadge: React.FC<StrategyBadgeProps> = ({
  strategy,
  size
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Auto-scale to small on mobile if size not explicitly provided
  const badgeSize = size || (isMobile ? 'small' : 'medium');

  // Get strategy configuration (fallback to buy-hold if unknown)
  const config = STRATEGY_CONFIG[strategy] || STRATEGY_CONFIG['buy-hold'];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: badgeSize === 'small' ? 1 : 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        maxWidth: isMobile ? '100%' : 'fit-content',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      {/* Strategy Icon */}
      <Avatar
        sx={{
          width: badgeSize === 'small' ? 28 : 32,
          height: badgeSize === 'small' ? 28 : 32,
          bgcolor: config.color,
          boxShadow: `0 2px 8px ${config.color}40`
        }}
      >
        {config.icon}
      </Avatar>

      {/* Strategy Label & Description */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: badgeSize === 'small' ? '12px' : '14px',
            lineHeight: 1.4,
            color: 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {config.label}
        </Typography>

        {/* Description - Desktop only */}
        {!isMobile && (
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              color: 'text.secondary',
              lineHeight: 1.4,
              mt: 0.25
            }}
          >
            {config.description}
          </Typography>
        )}
      </Box>

      {/* Strategy Color Indicator Dot */}
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: config.color,
          flexShrink: 0,
          ml: 1
        }}
      />
    </Box>
  );
};

export default StrategyBadge;
