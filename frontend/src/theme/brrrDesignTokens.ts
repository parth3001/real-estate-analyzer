/**
 * BRRRR Strategy Design Tokens
 *
 * Apple Design System-compliant design tokens for BRRRR-specific components
 * Used across tabs: Financial Details (Tab 2), Capital Recovery (Tab 3), Long-term Analysis (Tab 4), Tax Intelligence (Tab 5)
 *
 * Design Philosophy:
 * - Semantic Naming: Token names describe purpose, not implementation
 * - Dual-Period Distinction: Visual separation between Initial Hold vs Post-Refinance periods
 * - Celebration Moments: Special styling for capital recovery milestones
 * - Accessibility: WCAG 2.1 AA compliant (4.5:1 contrast ratio minimum)
 * - Apple Aesthetic: SF Pro typography, subtle shadows, smooth transitions
 */

/**
 * BRRRR Color Palette
 *
 * Semantic color assignments for BRRRR-specific UI elements
 */
export const brrrColors = {
  // Initial Hold Period (Blue family - Apple's primary action color)
  initialPeriod: {
    primary: '#007AFF', // Apple blue
    light: '#E5F2FF', // Background tint
    medium: '#B3D9FF', // Border/divider
    dark: '#0051D5', // Text emphasis
  },

  // Post-Refinance Period (Purple family - transformation/change)
  postRefinance: {
    primary: '#AF52DE', // Apple purple
    light: '#F5EBFF', // Background tint
    medium: '#D9B3FF', // Border/divider
    dark: '#8E44AD', // Text emphasis
  },

  // Capital Recovery (Green family - success/achievement)
  capitalRecovery: {
    primary: '#34C759', // Apple green
    light: '#E8F8EC', // Background tint
    medium: '#A8E6B8', // Progress bar
    dark: '#248A3D', // Text emphasis
  },

  // Infinite Return Celebration (Gradient green - special moment)
  infiniteReturn: {
    gradient: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
    glow: 'rgba(52, 199, 89, 0.25)',
    pulse: 'rgba(52, 199, 89, 0.15)',
  },

  // Tax-Free Refinance (Educational highlight)
  taxFree: {
    primary: '#34C759', // Green for $0 tax
    light: '#E8F8EC',
    celebration: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
  },

  // Warning/Caution (Orange family)
  caution: {
    primary: '#FF9500', // Apple orange
    light: '#FFF4E5',
    medium: '#FFD9A8',
    dark: '#CC7700',
  },

  // Negative/Decline (Red family)
  negative: {
    primary: '#FF3B30', // Apple red
    light: '#FFEBEA',
    medium: '#FFB3B0',
    dark: '#D32F2F',
  },

  // Neutral/Unchanged (Gray family)
  neutral: {
    primary: '#8E8E93', // Apple gray
    light: '#F2F2F7',
    medium: '#C7C7CC',
    dark: '#636366',
  },
};

/**
 * BRRRR Typography Scale
 *
 * Apple SF Pro-inspired typography hierarchy for BRRRR components
 */
export const brrrTypography = {
  // Hero Metrics (Capital Recovery Rate, Infinite Return badge)
  hero: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  // Section Titles (Initial Hold Period, Post-Refinance Period)
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },

  // Metric Labels (Monthly Mortgage, Cash Flow, NOI)
  metricLabel: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.4,
    color: '#8E8E93', // Apple secondary text
  },

  // Metric Values (Financial numbers)
  metricValue: {
    fontSize: '17px',
    fontWeight: 600,
    lineHeight: 1.4,
    fontFeatureSettings: '"tnum"', // Tabular numbers for alignment
  },

  // Delta Indicators (Change percentages)
  delta: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
  },

  // Educational Content (Tax Intelligence explanations)
  body: {
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#1D1D1F', // Apple primary text
  },

  // Captions/Helper Text
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
    color: '#8E8E93',
  },
};

/**
 * BRRRR Spacing System
 *
 * 8px grid system for consistent spacing
 */
export const brrrSpacing = {
  xs: '4px',   // 0.5 units
  sm: '8px',   // 1 unit
  md: '16px',  // 2 units
  lg: '24px',  // 3 units
  xl: '32px',  // 4 units
  xxl: '48px', // 6 units
};

/**
 * BRRRR Component Styles
 *
 * Reusable style objects for BRRRR components
 */
export const brrrComponentStyles = {
  // Period Card (Initial Hold vs Post-Refinance containers)
  periodCard: {
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Apple ease-out
  },

  // Metric Row (Label + Value pair)
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F2F2F7',
  },

  // Delta Indicator Badge
  deltaBadge: {
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },

  // Period Separator (Refinance Event divider)
  periodSeparator: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '32px 0',
  },

  periodSeparatorLine: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, #C7C7CC 50%, transparent 100%)',
  },

  periodSeparatorLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8E8E93',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap' as const,
  },

  // Infinite Return Badge (Celebration badge)
  infiniteReturnBadge: {
    background: brrrColors.infiniteReturn.gradient,
    color: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '24px',
    fontWeight: 700,
    textAlign: 'center' as const,
    boxShadow: `0 4px 12px ${brrrColors.infiniteReturn.glow}`,
    animation: 'tax-free-pulse 2s ease-in-out infinite',
  },

  // Capital Recovery Progress Bar
  capitalRecoveryBar: {
    height: '12px',
    borderRadius: '6px',
    backgroundColor: brrrColors.neutral.light,
    overflow: 'hidden' as const,
  },

  capitalRecoveryFill: {
    height: '100%',
    background: brrrColors.capitalRecovery.primary,
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 0 8px rgba(52, 199, 89, 0.3)',
  },

  // Tax-Free Celebration Badge
  taxFreeBadge: {
    background: brrrColors.taxFree.celebration,
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '17px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(52, 199, 89, 0.15)',
  },

  // Forced Appreciation Callout
  forcedAppreciationCallout: {
    backgroundColor: '#F5EBFF', // Purple tint
    border: `2px solid ${brrrColors.postRefinance.medium}`,
    borderRadius: '12px',
    padding: '16px',
  },

  // Educational Accordion
  educationalAccordion: {
    borderRadius: '12px',
    border: '1px solid #F2F2F7',
    overflow: 'hidden' as const,
  },

  educationalAccordionHeader: {
    padding: '16px',
    backgroundColor: '#FAFAFA',
    cursor: 'pointer' as const,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#F2F2F7',
    },
  },

  educationalAccordionContent: {
    padding: '16px',
    backgroundColor: 'white',
  },
};

/**
 * BRRRR Animation Keyframes
 *
 * CSS keyframes for BRRRR-specific animations
 */
export const brrrAnimations = {
  // Tax-Free Pulse Animation
  taxFreePulse: `
    @keyframes tax-free-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(52, 199, 89, 0.15);
      }
      50% {
        opacity: 0.95;
        transform: scale(1.02);
        box-shadow: 0 6px 16px rgba(52, 199, 89, 0.25);
      }
    }
  `,

  // Slide In from Right (for Post-Refinance period reveal)
  slideInRight: `
    @keyframes slide-in-right {
      0% {
        opacity: 0;
        transform: translateX(24px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  // Progress Bar Fill Animation
  progressBarFill: `
    @keyframes progress-bar-fill {
      0% {
        width: 0%;
      }
      100% {
        width: var(--target-width);
      }
    }
  `,

  // Celebration Bounce (for Infinite Return badge)
  celebrationBounce: `
    @keyframes celebration-bounce {
      0%, 100% {
        transform: scale(1);
      }
      25% {
        transform: scale(1.05);
      }
      50% {
        transform: scale(0.98);
      }
      75% {
        transform: scale(1.02);
      }
    }
  `,
};

/**
 * BRRRR Responsive Breakpoints
 *
 * Mobile-first responsive design breakpoints
 */
export const brrrBreakpoints = {
  mobile: '320px',   // iPhone SE
  tablet: '768px',   // iPad
  desktop: '1024px', // MacBook
  wide: '1440px',    // iMac
};

/**
 * BRRRR Z-Index Scale
 *
 * Consistent z-index layering for BRRRR components
 */
export const brrrZIndex = {
  base: 1,
  periodCard: 10,
  periodSeparator: 20,
  infiniteReturnBadge: 30,
  tooltip: 100,
  modal: 1000,
};

/**
 * Helper: Get period card styles
 *
 * Returns complete style object for Initial Hold or Post-Refinance period card
 *
 * @param period - 'initial' or 'postRefinance'
 * @returns Style object for Material-UI sx prop
 */
export function getPeriodCardStyles(period: 'initial' | 'postRefinance') {
  const colors = period === 'initial' ? brrrColors.initialPeriod : brrrColors.postRefinance;

  return {
    ...brrrComponentStyles.periodCard,
    backgroundColor: colors.light,
    border: `2px solid ${colors.medium}`,
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    },
  };
}

/**
 * Helper: Get delta badge styles
 *
 * Returns complete style object for delta indicator badge
 *
 * @param deltaPercent - Percentage change value
 * @param isExpense - True if metric represents an expense
 * @returns Style object for Material-UI sx prop
 */
export function getDeltaBadgeStyles(deltaPercent: number, isExpense: boolean = false) {
  let backgroundColor: string;
  let color: string;

  if (Math.abs(deltaPercent) < 0.5) {
    backgroundColor = brrrColors.neutral.light;
    color = brrrColors.neutral.dark;
  } else {
    const isIncrease = deltaPercent > 0;
    const isGood = isExpense ? !isIncrease : isIncrease;

    if (isGood) {
      backgroundColor = brrrColors.capitalRecovery.light;
      color = brrrColors.capitalRecovery.dark;
    } else {
      backgroundColor = brrrColors.negative.light;
      color = brrrColors.negative.dark;
    }
  }

  return {
    ...brrrComponentStyles.deltaBadge,
    backgroundColor,
    color,
  };
}
