import { createTheme } from '@mui/material/styles';
import { appleColors, appleTypography, appleShadows, appleBorderRadius } from './appleDesignSystem';

export const appleTheme = createTheme({
  palette: {
    mode: 'light',
    
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
      light: '#D1FAE5',
      main: '#10B981',
      dark: '#047857',
      contrastText: '#ffffff'
    },
    
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
      contrastText: '#ffffff'
    },
    
    error: {
      light: '#FEE2E2',
      main: '#EF4444',
      dark: '#DC2626',
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
    }
  },

  shape: {
    borderRadius: 12 // Apple-style default radius
  },

  shadows: appleShadows,

  components: {
    // Global component overrides for Apple style
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          padding: '12px 24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)'
          }
        }
      }
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9'
        }
      }
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            '& fieldset': {
              borderColor: '#e5e7eb'
            },
            
            '&:hover fieldset': {
              borderColor: '#93c5fd'
            },
            
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
              borderWidth: '2px',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }
          }
        }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          fontSize: '12px'
        }
      }
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          borderRadius: '12px',
          margin: '0 4px',
          
          '&.Mui-selected': {
            backgroundColor: '#eff6ff',
            color: '#2563eb'
          }
        }
      }
    }
  }
});