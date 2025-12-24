/**
 * Affiliate Header Badge
 *
 * Small, unobtrusive badge showing "🏷️ Recommended by [Partner Name]".
 * Appears in header throughout user journey on affiliate subdomains.
 *
 * Design Principles:
 * - Deference: Subtle, doesn't compete with main navigation
 * - Clarity: Clear attribution to partner
 * - Simplicity: Minimal styling, neutral colors
 *
 * @author UX Designer + Architect from CLAUDE.md
 * @date December 23, 2025
 */

import React from 'react';
import { Chip, useTheme, useMediaQuery, Tooltip } from '@mui/material';
import LabelIcon from '@mui/icons-material/Label';
import type { AffiliatePartner } from '../../utils/affiliateDetector';

interface AffiliateHeaderBadgeProps {
  partner: AffiliatePartner;
  size?: 'small' | 'medium';
}

export default function AffiliateHeaderBadge({
  partner,
  size
}: AffiliateHeaderBadgeProps): React.ReactElement {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Determine badge size (mobile auto-scales to small)
  const badgeSize = size || (isMobile ? 'small' : 'medium');

  // Compact label for mobile (just first name)
  const label = isMobile
    ? partner.name.split(' ')[0] // "Josh" instead of "Josh Lupo"
    : `Recommended by ${partner.name}`;

  const handleClick = (): void => {
    if (partner.contact?.website) {
      window.open(partner.contact.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Tooltip
      title={`You're using ${partner.name}'s recommended tool`}
      arrow
      placement="bottom"
    >
      <Chip
        icon={<LabelIcon sx={{ fontSize: { xs: 14, md: 16 } }} />}
        label={label}
        size={badgeSize}
        clickable={!!partner.contact?.website}
        onClick={handleClick}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          color: '#666',
          fontSize: { xs: '11px', md: '12px' },
          fontWeight: 500,
          cursor: partner.contact?.website ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: partner.contact?.website ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            transform: partner.contact?.website ? 'translateY(-1px)' : 'none'
          },
          // Subtle border for definition
          border: '1px solid rgba(0, 0, 0, 0.08)',
          // Ensure badge doesn't wrap on small screens
          whiteSpace: 'nowrap',
          maxWidth: { xs: '100px', md: 'none' }
        }}
      />
    </Tooltip>
  );
}
