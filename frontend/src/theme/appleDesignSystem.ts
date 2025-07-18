// Apple-Inspired Design System for PropTech Platform
// Complete design system foundation

// =============================================================================
// 1. COLOR PALETTE
// =============================================================================
const appleColors = {
  // Primary Blues (Apple-inspired)
  primary: {
    50: '#EBF4FF',   // Very light blue
    100: '#DBEAFE',  // Light blue
    200: '#BFDBFE',  // Lighter blue
    300: '#93C5FD',  // Light-medium blue
    400: '#60A5FA',  // Medium blue
    500: '#3B82F6',  // Main primary blue
    600: '#2563EB',  // Darker blue
    700: '#1D4ED8',  // Dark blue
    800: '#1E40AF',  // Very dark blue
    900: '#1E3A8A'   // Darkest blue
  },

  // Grays (Apple-style neutrals)
  gray: {
    50: '#F9FAFB',   // Almost white
    100: '#F3F4F6',  // Very light gray
    200: '#E5E7EB',  // Light gray
    300: '#D1D5DB',  // Light-medium gray
    400: '#9CA3AF',  // Medium gray
    500: '#6B7280',  // Medium-dark gray
    600: '#4B5563',  // Dark gray
    700: '#374151',  // Very dark gray
    800: '#1F2937',  // Almost black
    900: '#111827'   // Black
  },

  // Green (Success/Growth)
  green: {
    50: '#ECFDF5',   // Very light green
    100: '#D1FAE5',  // Light green
    200: '#A7F3D0',  // Lighter green
    300: '#6EE7B7',  // Light-medium green
    400: '#34D399',  // Medium green
    500: '#10B981',  // Main green
    600: '#059669',  // Darker green
    700: '#047857',  // Dark green
    800: '#065F46',  // Very dark green
    900: '#064E3B'   // Darkest green
  },

  // Red (Error/Danger)
  red: {
    50: '#FEF2F2',   // Very light red
    100: '#FEE2E2',  // Light red
    200: '#FECACA',  // Lighter red
    300: '#FCA5A5',  // Light-medium red
    400: '#F87171',  // Medium red
    500: '#EF4444',  // Main red
    600: '#DC2626',  // Darker red
    700: '#B91C1C',  // Dark red
    800: '#991B1B',  // Very dark red
    900: '#7F1D1D'   // Darkest red
  },

  // Orange (Warning/Attention)
  orange: {
    50: '#FFF7ED',   // Very light orange
    100: '#FFEDD5',  // Light orange
    200: '#FED7AA',  // Lighter orange
    300: '#FDBA74',  // Light-medium orange
    400: '#FB923C',  // Medium orange
    500: '#F97316',  // Main orange
    600: '#EA580C',  // Darker orange
    700: '#C2410C',  // Dark orange
    800: '#9A3412',  // Very dark orange
    900: '#7C2D12'   // Darkest orange
  },

  // Blue (Info/Primary Alternative)
  blue: {
    50: '#EFF6FF',   // Very light blue
    100: '#DBEAFE',  // Light blue
    200: '#BFDBFE',  // Lighter blue
    300: '#93C5FD',  // Light-medium blue
    400: '#60A5FA',  // Medium blue
    500: '#3B82F6',  // Main blue
    600: '#2563EB',  // Darker blue
    700: '#1D4ED8',  // Dark blue
    800: '#1E40AF',  // Very dark blue
    900: '#1E3A8A'   // Darkest blue
  },

  // Status Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B'
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F'
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D'
  },

  // Accent Colors
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    500: '#8B5CF6',
    600: '#7C3AED'
  },

  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5'
  }
};

// =============================================================================
// 2. TYPOGRAPHY SYSTEM
// =============================================================================
const appleTypography = {
  // Font Family (Apple-inspired)
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace'
  },

  // Font Sizes (Apple-like scale)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem'  // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// =============================================================================
// 3. SPACING SYSTEM
// =============================================================================
const appleSpacing = {
  // Base unit: 8px (Apple's approach)
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  7: '1.75rem',  // 28px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem'    // 256px
};

// =============================================================================
// 4. SHADOW SYSTEM
// =============================================================================
const appleShadows = {
  // Apple-inspired shadow system
  none: 'none',
  
  // Small shadows
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Default shadow
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Medium shadow
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // Large shadow
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Extra large shadow
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // 2xl shadow
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadow
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Focus shadow (Apple blue)
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  
  // Card hover shadow
  cardHover: '0 8px 25px -8px rgba(0, 0, 0, 0.15)'
};

// =============================================================================
// 5. BORDER RADIUS SYSTEM
// =============================================================================
const appleBorderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  default: '0.5rem', // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
  full: '9999px'
};

// =============================================================================
// 6. MATERIAL-UI THEME CONFIGURATION
// =============================================================================
const appleMaterialUITheme = {
  palette: {
    mode: 'light' as const,
    
    primary: {
      light: appleColors.primary[400],
      main: appleColors.primary[500],
      dark: appleColors.primary[600],
      contrastText: '#ffffff'
    },
    
    secondary: {
      light: appleColors.indigo[400],
      main: appleColors.indigo[500],
      dark: appleColors.indigo[600],
      contrastText: '#ffffff'
    },
    
    success: {
      light: appleColors.success[100],
      main: appleColors.success[500],
      dark: appleColors.success[700],
      contrastText: '#ffffff'
    },
    
    warning: {
      light: appleColors.warning[100],
      main: appleColors.warning[500],
      dark: appleColors.warning[700],
      contrastText: '#ffffff'
    },
    
    error: {
      light: appleColors.error[100],
      main: appleColors.error[500],
      dark: appleColors.error[700],
      contrastText: '#ffffff'
    },
    
    grey: appleColors.gray,
    
    background: {
      default: appleColors.gray[50],
      paper: '#ffffff'
    },
    
    text: {
      primary: appleColors.gray[900],
      secondary: appleColors.gray[600]
    }
  },

  typography: {
    fontFamily: appleTypography.fontFamily.primary,
    
    h1: {
      fontSize: appleTypography.fontSize['5xl'],
      fontWeight: appleTypography.fontWeight.bold,
      lineHeight: appleTypography.lineHeight.tight,
      color: appleColors.gray[900]
    },
    
    h2: {
      fontSize: appleTypography.fontSize['4xl'],
      fontWeight: appleTypography.fontWeight.semibold,
      lineHeight: appleTypography.lineHeight.tight,
      color: appleColors.gray[900]
    },
    
    h3: {
      fontSize: appleTypography.fontSize['3xl'],
      fontWeight: appleTypography.fontWeight.semibold,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[900]
    },
    
    h4: {
      fontSize: appleTypography.fontSize['2xl'],
      fontWeight: appleTypography.fontWeight.medium,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[900]
    },
    
    h5: {
      fontSize: appleTypography.fontSize.xl,
      fontWeight: appleTypography.fontWeight.medium,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[900]
    },
    
    h6: {
      fontSize: appleTypography.fontSize.lg,
      fontWeight: appleTypography.fontWeight.medium,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[900]
    },
    
    body1: {
      fontSize: appleTypography.fontSize.base,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[700]
    },
    
    body2: {
      fontSize: appleTypography.fontSize.sm,
      lineHeight: appleTypography.lineHeight.normal,
      color: appleColors.gray[600]
    }
  },

  shape: {
    borderRadius: parseInt(appleBorderRadius.md.replace('rem', '')) * 16 // Convert to px
  },

  shadows: [
    'none',                              // 0
    appleShadows.sm,                     // 1
    appleShadows.default,                // 2
    appleShadows.default,                // 3
    appleShadows.md,                     // 4
    appleShadows.md,                     // 5
    appleShadows.md,                     // 6
    appleShadows.md,                     // 7
    appleShadows.lg,                     // 8
    appleShadows.lg,                     // 9
    appleShadows.lg,                     // 10
    appleShadows.lg,                     // 11
    appleShadows.xl,                     // 12
    appleShadows.xl,                     // 13
    appleShadows.xl,                     // 14
    appleShadows.xl,                     // 15
    appleShadows['2xl'],                 // 16
    appleShadows['2xl'],                 // 17
    appleShadows['2xl'],                 // 18
    appleShadows['2xl'],                 // 19
    appleShadows['2xl'],                 // 20
    appleShadows['2xl'],                 // 21
    appleShadows['2xl'],                 // 22
    appleShadows['2xl'],                 // 23
    appleShadows['2xl']                  // 24
  ] as ["none", string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string],

  components: {
    // Button Component
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: appleBorderRadius.lg,
          textTransform: 'none' as const,
          fontWeight: appleTypography.fontWeight.medium,
          fontSize: appleTypography.fontSize.sm,
          padding: `${appleSpacing[3]} ${appleSpacing[6]}`,
          boxShadow: appleShadows.sm,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            boxShadow: appleShadows.md,
            transform: 'translateY(-1px)'
          }
        },
        
        containedPrimary: {
          background: `linear-gradient(135deg, ${appleColors.primary[500]} 0%, ${appleColors.primary[600]} 100%)`,
          
          '&:hover': {
            background: `linear-gradient(135deg, ${appleColors.primary[600]} 0%, ${appleColors.primary[700]} 100%)`
          }
        }
      }
    },

    // Card Component
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: appleBorderRadius.xl,
          boxShadow: appleShadows.sm,
          border: `1px solid ${appleColors.gray[100]}`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            boxShadow: appleShadows.lg,
            transform: 'translateY(-2px)',
            borderColor: appleColors.gray[200]
          }
        }
      }
    },

    // Paper Component
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: appleBorderRadius.xl,
          boxShadow: appleShadows.sm,
          border: `1px solid ${appleColors.gray[100]}`
        }
      }
    },

    // TextField Component
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: appleBorderRadius.lg,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            '&:hover fieldset': {
              borderColor: appleColors.primary[300]
            },
            
            '&.Mui-focused fieldset': {
              borderColor: appleColors.primary[500],
              boxShadow: appleShadows.focus
            }
          }
        }
      }
    },

    // Tab Component
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: appleTypography.fontWeight.medium,
          fontSize: appleTypography.fontSize.sm,
          borderRadius: appleBorderRadius.lg,
          margin: `0 ${appleSpacing[1]}`,
          minHeight: 44,
          
          '&.Mui-selected': {
            backgroundColor: appleColors.primary[50],
            color: appleColors.primary[600]
          }
        }
      }
    },

    // Chip Component
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: appleBorderRadius.full,
          fontWeight: appleTypography.fontWeight.medium,
          fontSize: appleTypography.fontSize.xs
        }
      }
    }
  }
};

// =============================================================================
// 7. CSS CUSTOM PROPERTIES (CSS Variables)
// =============================================================================
const appleCSSVariables = `
:root {
  /* Colors */
  --color-primary-50: ${appleColors.primary[50]};
  --color-primary-100: ${appleColors.primary[100]};
  --color-primary-500: ${appleColors.primary[500]};
  --color-primary-600: ${appleColors.primary[600]};
  --color-primary-700: ${appleColors.primary[700]};
  
  --color-gray-50: ${appleColors.gray[50]};
  --color-gray-100: ${appleColors.gray[100]};
  --color-gray-200: ${appleColors.gray[200]};
  --color-gray-500: ${appleColors.gray[500]};
  --color-gray-600: ${appleColors.gray[600]};
  --color-gray-700: ${appleColors.gray[700]};
  --color-gray-900: ${appleColors.gray[900]};
  
  --color-success-500: ${appleColors.success[500]};
  --color-warning-500: ${appleColors.warning[500]};
  --color-error-500: ${appleColors.error[500]};
  
  /* Typography */
  --font-family-primary: ${appleTypography.fontFamily.primary};
  --font-size-sm: ${appleTypography.fontSize.sm};
  --font-size-base: ${appleTypography.fontSize.base};
  --font-size-lg: ${appleTypography.fontSize.lg};
  --font-size-xl: ${appleTypography.fontSize.xl};
  --font-size-2xl: ${appleTypography.fontSize['2xl']};
  --font-size-3xl: ${appleTypography.fontSize['3xl']};
  
  /* Spacing */
  --spacing-1: ${appleSpacing[1]};
  --spacing-2: ${appleSpacing[2]};
  --spacing-3: ${appleSpacing[3]};
  --spacing-4: ${appleSpacing[4]};
  --spacing-6: ${appleSpacing[6]};
  --spacing-8: ${appleSpacing[8]};
  --spacing-12: ${appleSpacing[12]};
  --spacing-16: ${appleSpacing[16]};
  
  /* Shadows */
  --shadow-sm: ${appleShadows.sm};
  --shadow-default: ${appleShadows.default};
  --shadow-md: ${appleShadows.md};
  --shadow-lg: ${appleShadows.lg};
  --shadow-xl: ${appleShadows.xl};
  --shadow-focus: ${appleShadows.focus};
  --shadow-card-hover: ${appleShadows.cardHover};
  
  /* Border Radius */
  --radius-sm: ${appleBorderRadius.sm};
  --radius-md: ${appleBorderRadius.md};
  --radius-lg: ${appleBorderRadius.lg};
  --radius-xl: ${appleBorderRadius.xl};
  --radius-2xl: ${appleBorderRadius['2xl']};
  --radius-3xl: ${appleBorderRadius['3xl']};
  --radius-full: ${appleBorderRadius.full};
  
  /* Transitions */
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Apple-inspired global styles */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-primary);
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling (WebKit) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
  transition: var(--transition-normal);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* Focus styles */
*:focus {
  outline: none;
}

*:focus-visible {
  box-shadow: var(--shadow-focus);
}
`;

// =============================================================================
// 8. EXPORT CONFIGURATION
// =============================================================================

// Export the complete theme for Material-UI
export const appleTheme = appleMaterialUITheme;

// Export individual systems for use in components
export { 
  appleColors, 
  appleTypography, 
  appleSpacing, 
  appleShadows, 
  appleBorderRadius,
  appleCSSVariables 
};

// Export CSS string for injection
export const appleGlobalCSS = appleCSSVariables;