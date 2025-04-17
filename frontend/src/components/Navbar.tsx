import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Navbar = () => {
  const theme = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
    { path: '/analysis', label: 'Analyze Deal', icon: <AnalyticsIcon /> },
  ];

  const isActive = (path: string) => location.pathname === path;

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
          component={Link} 
          to="/"
          sx={{ 
            color: theme.palette.primary.main,
            textDecoration: 'none',
            fontWeight: 600,
            flexGrow: 1,
          }}
        >
          Real Estate Analyzer
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
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