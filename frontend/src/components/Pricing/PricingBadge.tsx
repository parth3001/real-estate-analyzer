import React from 'react';
import { Chip, useMediaQuery, useTheme } from '@mui/material';
import { Diamond as DiamondIcon } from '@mui/icons-material';
import { appleColors, appleShadows } from '../../theme/appleDesignSystem';
import type { SxProps, Theme } from '@mui/system';

interface PricingBadgeProps {
  variant?: 'full' | 'compact';
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

const PricingBadge: React.FC<PricingBadgeProps> = ({
  variant = 'full',
  onClick,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Auto-detect variant based on screen size if not explicitly set
  const displayVariant = isMobile ? 'compact' : variant;

  const label = displayVariant === 'compact'
    ? '$14.99/mo | Free Beta'
    : 'Currently $14.99/month | Free in Beta';

  return (
    <Chip
      icon={<DiamondIcon sx={{ fontSize: { xs: '16px', md: '18px' } }} />}
      label={label}
      onClick={onClick}
      sx={{
        backgroundColor: appleColors.primary[50],
        color: appleColors.primary[700],
        borderRadius: '12px',
        padding: { xs: '6px 12px', md: '8px 16px' },
        height: 'auto',
        fontSize: { xs: '0.875rem', md: '1rem' },
        fontWeight: 600,
        border: `1px solid ${appleColors.primary[200]}`,
        boxShadow: appleShadows.sm,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          backgroundColor: appleColors.primary[100],
          borderColor: appleColors.primary[300],
          boxShadow: appleShadows.md,
          transform: 'translateY(-1px)'
        } : {},
        '& .MuiChip-icon': {
          color: appleColors.primary[600],
          marginLeft: '8px',
          marginRight: '-4px'
        },
        ...sx
      }}
    />
  );
};

export default PricingBadge;
