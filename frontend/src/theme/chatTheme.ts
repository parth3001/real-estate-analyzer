/**
 * Chat-surface theme — extends the existing appleTheme with chat-specific
 * overrides. Scoped via a nested ThemeProvider wrapping the chat surface
 * only, so wizard pages keep the unmodified appleTheme.
 *
 * Per the 2026-05-15 design-conversation decisions (UX Designer / Apple HIG
 * lens):
 *
 *   1. Neutral card background, color on FOCAL elements only — Apple Card
 *      details / Stocks detail pattern. Not a tinted whole-card.
 *
 *   2. Tinted button variant ("tinted" — iOS 17+ pattern) for the
 *      "Change any of these" CTA on the disclose-after assumptions row.
 *      Standard MUI v7 doesn't ship a tinted variant; we add it here.
 *
 *   3. Tabular-nums on the score number + financial figures so
 *      $425,000 / $385,000 align column-wise.
 *
 *   4. Score-band color helper — maps a 0-100 dealQuality to the
 *      Apple-system-color the band wears (green / yellow / orange / red,
 *      AA-tuned).
 */

import { createTheme, type Theme } from '@mui/material/styles';
import { appleTheme } from './appleTheme';

// ===== Score-band palette =====
//
// Apple system colors, contrast-tuned for AA on light backgrounds.
// `accent` is the color used on focal elements (score number,
// qualityLabel, LinearProgress fill, walk-away delta). `tint` is a
// very-low-alpha version reserved for the tinted Button background.

export interface ScoreBandTokens {
  accent: string;
  tint: string;
  label:
    | 'Above professional standards'
    | 'Meets professional standards'
    | 'Requires optimization'
    | 'Below professional standards';
}

const SCORE_BANDS = {
  green: { accent: '#1B8B3A', tint: 'rgba(52, 199, 89, 0.12)' },   // Apple system green, darkened to AA
  yellow: { accent: '#A66700', tint: 'rgba(255, 204, 0, 0.16)' },  // Apple system yellow, dark text for AA
  orange: { accent: '#C04A00', tint: 'rgba(255, 149, 0, 0.14)' },  // Apple system orange
  red: { accent: '#C7261C', tint: 'rgba(255, 59, 48, 0.12)' },     // Apple system red
} as const;

/**
 * Map a 0-100 dealQuality score to the band tokens for color treatment.
 * Bins per /docs/PRODUCT_2.0_ARCHITECTURE.md §1.5 (deterministic-scoring
 * display contract).
 */
export function bandForScore(dealQuality: number): ScoreBandTokens {
  if (dealQuality >= 80) {
    return { ...SCORE_BANDS.green, label: 'Above professional standards' };
  }
  if (dealQuality >= 65) {
    return { ...SCORE_BANDS.yellow, label: 'Meets professional standards' };
  }
  if (dealQuality >= 50) {
    return { ...SCORE_BANDS.orange, label: 'Requires optimization' };
  }
  return { ...SCORE_BANDS.red, label: 'Below professional standards' };
}

// ===== MUI module augmentation — tinted button variant =====
//
// Adds `<Button variant="tinted">` to MUI's type system so consumers
// get autocomplete + type-safety. The visual treatment is applied via
// MuiButton.styleOverrides below.

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    tinted: true;
  }
}

// ===== chatTheme — extends appleTheme =====

export const chatTheme: Theme = createTheme(appleTheme, {
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          // Apple HIG: neutral card background. Color lands on focal
          // elements (the score number, LinearProgress fills, etc.),
          // NOT on the card chrome.
          backgroundColor: appleTheme.palette.background.paper,
          borderRadius: 16,
          padding: 0, // we control internal padding via Box
          boxShadow: 'none',
          border: `1px solid ${appleTheme.palette.divider}`,
        },
      },
    },

    MuiButton: {
      variants: [
        {
          // iOS 17+ tinted button. Semi-transparent accent fill with
          // full-saturation accent text. Used as the "Change any of
          // these" CTA on the disclose-after assumptions row.
          //
          // The accent color comes from the score band — set via the
          // sx prop or style override at the call site (we provide the
          // SHAPE here; consumers provide the COLOR per-instance).
          props: { variant: 'tinted' },
          style: {
            backgroundColor: 'rgba(0, 122, 255, 0.12)', // default accent fallback
            color: '#0066CC',
            fontWeight: 600,
            textTransform: 'none',
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 999, // pill
            minHeight: 44, // HIG touch target
            '&:hover': {
              backgroundColor: 'rgba(0, 122, 255, 0.18)',
              boxShadow: 'none',
            },
            '&:active': {
              backgroundColor: 'rgba(0, 122, 255, 0.24)',
            },
          },
        },
      ],
      styleOverrides: {
        root: {
          textTransform: 'none', // Apple style; no SHOUTY caps
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 2,
          backgroundColor: appleTheme.palette.grey[200],
        },
        bar: {
          borderRadius: 2,
          // Bar color set per-instance via sx prop (matches the
          // band-accent on the parent card).
        },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: {
          // Apple convention: financial figures + scores ALWAYS use
          // tabular-nums so digits align column-wise. Components that
          // need this opt in via the `dealNumeric` class or sx:
          //   sx={{ fontVariantNumeric: 'tabular-nums' }}
          // The class form is exported below for convenience.
        },
      },
    },
  },
});

/**
 * sx-style snippet enabling tabular numerals. Apply to any Typography
 * that renders financial figures or the score.
 *
 * Usage:
 *   <Typography sx={tabularNumsSx}>$425,000</Typography>
 */
export const tabularNumsSx = {
  fontVariantNumeric: 'tabular-nums' as const,
};
