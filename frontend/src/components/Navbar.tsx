import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Navbar = () => {
  console.log('Navbar component rendering');
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
    { path: '/analyze', label: 'Analyze Deal', icon: <AnalyticsIcon /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Force navigation function to ensure proper route handling
  const handleNavigation = (path: string) => {
    console.log('Navigation handler called for path:', path);
    
    // Clear any potentially interfering localStorage items
    if (path === '/') {
      console.log('Clearing currentDeal from localStorage');
      localStorage.removeItem('currentDeal');
      
      // For dashboard specifically, use a more direct approach to ensure navigation works
      window.location.href = window.location.origin + path;
      return;
    }
    
    // For other routes, use normal React Router navigation
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          onClick={() => handleNavigation('/')}
          sx={{ 
            color: theme.palette.primary.main,
            textDecoration: 'none',
            fontWeight: 600,
            flexGrow: 1,
            cursor: 'pointer'
          }}
        >
          Real Estate Analyzer
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              startIcon={item.icon}
              sx={{
                color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
                backgroundColor: isActive(item.path) ? theme.palette.primary.light + '10' : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light + '20',
                },
                borderRadius: '8px',
                padding: '8px 16px',
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 