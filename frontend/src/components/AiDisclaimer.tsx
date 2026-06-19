/**
 * AiDisclaimer — Task #76 (2026-06-18).
 *
 * Single source of truth for the AI-accuracy / educational disclaimer
 * copy that must appear on every AI-generated or financial-analysis
 * surface. Centralized so we can update the wording once (e.g., after
 * legal review) and have it propagate to every render site.
 *
 * Three variants pick what's appropriate for the context:
 *
 *   compact   — one muted line, under inputs (chat send box, etc.)
 *   standard  — short paragraph, under workspace hero / cards
 *   full      — full block with bullets, for PDF / email footers
 *
 * Why this exists: today (2026-06-18) we discovered the chat agent
 * confabulates 10-year projections (#71) with numbers that materially
 * understate the deal's quality vs. the engine's own output. Until #71
 * lands across all surfaces, users could act on AI-generated content
 * that doesn't match the workspace. Disclosure is the legal floor.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export type AiDisclaimerVariant = 'compact' | 'standard' | 'full';

interface AiDisclaimerProps {
  variant?: AiDisclaimerVariant;
  /** Override default sx — useful when embedding in dark themes or constrained widths. */
  sx?: React.ComponentProps<typeof Box>['sx'];
}

const COMPACT_TEXT =
  'REanalyzr AI can make mistakes. Verify numbers and consult a licensed professional before acting.';

const STANDARD_TEXT =
  'Analysis is institutional-grade math but educational only. Not investment, tax, or legal advice. Verify all numbers against the workspace and consult a licensed professional before acting on this analysis.';

export function AiDisclaimer({
  variant = 'compact',
  sx,
}: AiDisclaimerProps): React.JSX.Element {
  if (variant === 'compact') {
    return (
      <Typography
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          textAlign: 'center',
          lineHeight: 1.4,
          ...sx,
        }}
        data-testid="ai-disclaimer-compact"
      >
        {COMPACT_TEXT}
      </Typography>
    );
  }

  if (variant === 'standard') {
    return (
      <Typography
        sx={{
          fontSize: 12,
          color: 'text.secondary',
          lineHeight: 1.5,
          fontStyle: 'italic',
          ...sx,
        }}
        data-testid="ai-disclaimer-standard"
      >
        {STANDARD_TEXT}{' '}
        <RouterLink
          to="/terms"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Terms
        </RouterLink>
        .
      </Typography>
    );
  }

  // full
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        ...sx,
      }}
      data-testid="ai-disclaimer-full"
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: 'text.primary',
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Important — Educational Tool Only
      </Typography>
      <Typography
        sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6, mb: 1 }}
      >
        REanalyzr provides AI-assisted real estate analysis for educational
        purposes only. It is not investment, tax, legal, or real estate
        advice. AI-generated content can contain errors, including incorrect
        numbers, projections, or claims.
      </Typography>
      <Typography
        component="ul"
        sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.6, pl: 2, mb: 0 }}
      >
        <li>Verify every number against the structured workspace before acting</li>
        <li>Consult a licensed CPA, financial advisor, and real estate attorney</li>
        <li>Past performance does not guarantee future results</li>
        <li>Real estate investments carry risk including total loss of capital</li>
      </Typography>
      <Typography
        sx={{ fontSize: 11, color: 'text.secondary', mt: 1.5 }}
      >
        See our{' '}
        <RouterLink
          to="/terms"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Terms of Service
        </RouterLink>{' '}
        and{' '}
        <RouterLink
          to="/privacy"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Privacy Policy
        </RouterLink>
        .
      </Typography>
    </Box>
  );
}
