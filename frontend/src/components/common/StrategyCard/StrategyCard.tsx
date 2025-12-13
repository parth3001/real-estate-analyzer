/**
 * StrategyCard Component
 *
 * Apple-compliant visual card for investment strategy selection (Phase 1: Universal Simple)
 *
 * Design Principles:
 * - Tap entire card to select (no explicit buttons)
 * - Visual hierarchy: Icon → Title → Description
 * - Selected state: Blue border + background
 * - Coming Soon state: Grayed out with badge
 * - Smooth hover and selection animations
 *
 * Usage:
 * <StrategyCard
 *   strategy="buy-hold"
 *   title="Buy & Hold"
 *   description="Traditional long-term rental strategy for steady cash flow"
 *   icon={<HomeIcon />}
 *   selected={selectedStrategy === 'buy-hold'}
 *   onSelect={() => setStrategy('buy-hold')}
 * />
 *
 * <StrategyCard
 *   strategy="brrrr"
 *   title="BRRRR"
 *   description="Buy, Rehab, Rent, Refinance, Repeat"
 *   icon={<RefreshIcon />}
 *   comingSoon={true}
 *   selected={false}
 *   onSelect={() => {}}
 * />
 */

import React from 'react';
import { Box, Typography, Chip, Card, CardContent } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { appleColors, appleEasing, appleDurations } from '../../../theme/appleDesignSystem';

export type InvestmentStrategy = 'buy-hold' | 'house-hack' | 'brrrr';

export interface StrategyCardProps {
  /** Strategy identifier */
  strategy: InvestmentStrategy;

  /** Card title (e.g., "Buy & Hold") */
  title: string;

  /** Short description of the strategy */
  description: string;

  /** Icon component to display */
  icon: React.ReactNode;

  /** Whether this strategy is currently selected */
  selected: boolean;

  /** Callback when card is selected */
  onSelect: () => void;

  /** Whether this strategy is coming soon (disabled) */
  comingSoon?: boolean;

  /** Badge text (e.g., "Most Popular", "Coming Soon") */
  badgeText?: string;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  title,
  description,
  icon,
  selected,
  onSelect,
  comingSoon = false,
  badgeText
}) => {
  const handleClick = () => {
    if (!comingSoon) {
      onSelect();
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        position: 'relative',
        p: 3,
        borderRadius: '16px',
        border: '2px solid',
        borderColor: selected ? appleColors.primary[500] : appleColors.gray[200],
        backgroundColor: selected
          ? appleColors.primary[50]
          : comingSoon
          ? appleColors.gray[50]
          : 'white',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        opacity: comingSoon ? 0.6 : 1,
        transition: `all ${appleDurations.shorter}ms ${appleEasing.standard}`,
        userSelect: 'none',

        '&:hover': comingSoon
          ? {}
          : {
              borderColor: selected ? appleColors.primary[600] : appleColors.primary[300],
              transform: 'translateY(-2px)',
              boxShadow: selected
                ? `0 8px 20px ${appleColors.primary[200]}`
                : '0 4px 12px rgba(0,0,0,0.1)'
            },

        '&:active': comingSoon
          ? {}
          : {
              transform: 'scale(0.98)',
              transition: `all ${appleDurations.shortest}ms ${appleEasing.sharp}`
            }
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Badge (Coming Soon / Most Popular) */}
        {badgeText && (
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Chip
              label={badgeText}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: comingSoon
                  ? appleColors.gray[200]
                  : appleColors.green[100],
                color: comingSoon ? appleColors.gray[600] : appleColors.green[700]
              }}
            />
          </Box>
        )}

        {/* Selected Checkmark */}
        {selected && !comingSoon && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: badgeText ? 100 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: appleColors.primary[500],
              color: 'white',
              boxShadow: `0 2px 8px ${appleColors.primary[300]}`
            }}
          >
            <CheckIcon sx={{ fontSize: 18 }} />
          </Box>
        )}

        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            mb: 2,
            borderRadius: '12px',
            backgroundColor: selected
              ? appleColors.primary[100]
              : comingSoon
              ? appleColors.gray[100]
              : appleColors.gray[50],
            color: selected
              ? appleColors.primary[600]
              : comingSoon
              ? appleColors.gray[400]
              : appleColors.primary[500],
            fontSize: 32,
            transition: `all ${appleDurations.shorter}ms ${appleEasing.standard}`
          }}
        >
          {icon}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mb: 1,
            color: comingSoon ? appleColors.gray[500] : appleColors.gray[900]
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: comingSoon ? appleColors.gray[400] : appleColors.gray[600],
            lineHeight: 1.6
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StrategyCard;
