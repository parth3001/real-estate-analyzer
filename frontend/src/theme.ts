import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#334155', // Slate-700 - Professional dark blue-gray
      light: '#64748b', // Slate-500
      dark: '#1e293b', // Slate-800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#475569', // Slate-600 - Sophisticated gray
      light: '#94a3b8', // Slate-400
      dark: '#334155', // Slate-700
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate-50 - Very light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#334155', // Slate-700
      secondary: '#64748b', // Slate-500
    },
    success: {
      main: '#0f766e', // Teal-700 - Muted green
      light: '#14b8a6', // Teal-500
      dark: '#115e59', // Teal-800
    },
    error: {
      main: '#9f1239', // Rose-800 - Deep red
      light: '#e11d48', // Rose-600
      dark: '#881337', // Rose-900
    },
    warning: {
      main: '#b45309', // Amber-700 - Deep amber
      light: '#d97706', // Amber-600
      dark: '#92400e', // Amber-800
    },
    info: {
      main: '#0369a1', // Sky-700 - Professional blue
      light: '#0284c7', // Sky-600
      dark: '#075985', // Sky-800
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      color: '#1e293b', // Slate-800
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#1e293b',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#1e293b',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#1e293b',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#1e293b',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1e293b',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontWeight: 500,
          padding: '0.5rem 1rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
          },
        },
      },
    },
  },
});

export default theme; 