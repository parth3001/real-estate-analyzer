import { createTheme } from '@mui/material/styles';

// Create a modern, professional theme for the PropTech platform
const theme = createTheme({
  // Color Palette
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Professional blue
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED', // Accent purple
      light: '#A78BFA',
      dark: '#5B21B6',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Positive metrics/good investments
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B', // Attention/caution metrics
      light: '#FCD34D',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444', // Negative metrics/poor investments
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: '#E5E7EB',
  },

  // Typography
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none', // Remove uppercase transformation
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },

  // Spacing (8px base unit)
  spacing: 8,

  // Shape
  shape: {
    borderRadius: 8,
  },

  // Shadows
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
    '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
    '0 25px 50px rgba(0,0,0,0.12)',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
    '0 15px 25px rgba(0, 0, 0, 0.15)',
    '0 15px 35px rgba(0, 0, 0, 0.1)',
    '0 20px 40px rgba(0, 0, 0, 0.1)',
    '0 30px 60px rgba(0, 0, 0, 0.12)',
    '0 40px 80px rgba(0, 0, 0, 0.12)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
    '0 25px 50px rgba(0, 0, 0, 0.15)',
  ],

  // Component overrides
  components: {
    // Buttons
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
          },
        },
      },
    },

    // Cards
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
          },
        },
      },
    },

    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        },
      },
    },

    // Text Fields
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563EB',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },

    // Input
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
        input: {
          padding: '12px 14px',
          '&::placeholder': {
            color: '#9CA3AF',
            opacity: 1,
          },
        },
      },
    },

    // Input Label
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#374151',
          '&.Mui-focused': {
            color: '#2563EB',
          },
        },
      },
    },

    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        colorSuccess: {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
        },
        colorError: {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
        },
        colorWarning: {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        },
        colorInfo: {
          backgroundColor: '#DBEAFE',
          color: '#1E40AF',
        },
      },
    },

    // Table
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E5E7EB',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#F9FAFB',
          color: '#374151',
        },
      },
    },

    // Tabs
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E5E7EB',
        },
        indicator: {
          backgroundColor: '#2563EB',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          marginRight: 32,
          minHeight: 48,
          color: '#6B7280',
          '&.Mui-selected': {
            color: '#2563EB',
          },
          '&:hover': {
            color: '#2563EB',
            opacity: 0.8,
          },
        },
      },
    },

    // Alert
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
        },
        standardWarning: {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        },
        standardInfo: {
          backgroundColor: '#DBEAFE',
          color: '#1E40AF',
        },
      },
    },

    // Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1F2937',
          color: '#F9FAFB',
          fontSize: '0.8125rem',
          padding: '8px 12px',
          borderRadius: 6,
        },
        arrow: {
          color: '#1F2937',
        },
      },
    },

    // Container
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
          '@media (min-width: 600px)': {
            paddingLeft: 32,
            paddingRight: 32,
          },
        },
      },
    },

    // Divider
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
        },
      },
    },

    // Skeleton
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: '#E5E7EB',
        },
      },
    },

    // Link
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#2563EB',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },

  // Breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

// Add custom mixins
theme.mixins = {
  ...theme.mixins,
  toolbar: {
    minHeight: 64,
    '@media (min-width: 0px) and (orientation: landscape)': {
      minHeight: 48,
    },
    '@media (min-width: 600px)': {
      minHeight: 64,
    },
  },
};

export default theme;