import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  useMediaQuery,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, Outlet, Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MapIcon from '@mui/icons-material/Map';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

interface MainLayoutProps {}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { text: 'Dashboard', path: '/', icon: <HomeIcon /> },
    { text: 'SFR Analysis', path: '/sfr-analysis', icon: <AnalyticsIcon /> },
    { text: 'Multi-Family Analysis', path: '/mf-analysis', icon: <ApartmentIcon /> },
    { text: 'Saved Properties', path: '/saved-properties', icon: <SavedSearchIcon /> },
  ];

  const drawer = (
    <Box sx={{
      overflow: 'auto',
      backgroundColor: '#ffffff', // Ensure white background
      color: '#000000', // Ensure black text
      height: '100%'
    }}>
      {/* DIAGNOSTIC TEST - Plain text with extreme visibility */}
      <div style={{
        backgroundColor: '#ff00ff',
        color: '#000000',
        fontSize: '24px',
        fontWeight: '900',
        padding: '20px',
        border: '5px solid #00ff00',
        margin: '10px',
        fontFamily: 'Arial, sans-serif'
      }}>
        TEST MENU TEXT
      </div>

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Real Estate Analyzer
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', padding: '8px 16px' }}>
              <Box
                component={Link}
                to={item.path}
                onClick={() => {
                  console.log(`Navigating to ${item.path}`);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textDecoration: 'none',
                  color: '#000000',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: isActive(item.path) ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'primary.light'
                  }
                }}
              >
                <Box sx={{ minWidth: 40, display: 'flex', color: '#374151' }}>
                  {item.icon}
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: '#000000 !important',
                    backgroundColor: '#00ff00 !important',
                    fontWeight: 700,
                    fontSize: '20px !important',
                    padding: '12px !important',
                    display: 'inline-block !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    border: '3px solid #ff0000 !important'
                  }}
                >
                  {item.text}
                </Box>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', padding: '8px 16px' }}>
            <Box
              component={Link}
              to="/census-test"
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                textDecoration: 'none',
                color: '#000000',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: isActive('/census-test') ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: 'primary.light'
                }
              }}
            >
              <Box sx={{ minWidth: 40, display: 'flex', color: '#374151' }}>
                <MapIcon />
              </Box>
              <Box
                component="span"
                sx={{
                  color: '#000000 !important',
                  backgroundColor: '#00ff00 !important',
                  fontWeight: 700,
                  fontSize: '20px !important',
                  padding: '12px !important',
                  display: 'inline-block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  border: '3px solid #ff0000 !important'
                }}
              >
                Census Data Test
              </Box>
            </Box>
          </Box>
        </ListItem>
        <ListItem disablePadding>
          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', padding: '8px 16px' }}>
            <Box
              component={Link}
              to="/help"
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                textDecoration: 'none',
                color: '#000000',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: isActive('/help') ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: 'primary.light'
                }
              }}
            >
              <Box sx={{ minWidth: 40, display: 'flex', color: '#374151' }}>
                <HelpOutlineIcon />
              </Box>
              <Box
                component="span"
                sx={{
                  color: '#000000 !important',
                  backgroundColor: '#00ff00 !important',
                  fontWeight: 700,
                  fontSize: '20px !important',
                  padding: '12px !important',
                  display: 'inline-block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  border: '3px solid #ff0000 !important'
                }}
              >
                Help & Documentation
              </Box>
            </Box>
          </Box>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            {navigationItems.find((item) => isActive(item.path))?.text || 'Real Estate Analyzer'}
          </Typography>
          
          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Welcome, {user.firstName}
                  </Typography>
                  {user.role === 'admin' && (
                    <Chip 
                      label="Admin" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                </Box>
                
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="small"
                  sx={{ ml: 1 }}
                  aria-controls={anchorEl ? 'user-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={anchorEl ? 'true' : undefined}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem'
                    }}
                  >
                    {getUserInitials(user.firstName, user.lastName)}
                  </Avatar>
                </IconButton>
                
                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    {user.role === 'admin' && (
                      <Chip 
                        label="Administrator" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                  
                  <MenuItem onClick={handleUserMenuClose} component={Link} to="/profile">
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    My Profile
                  </MenuItem>
                  
                  <MenuItem onClick={handleUserMenuClose} component={Link} to="/settings">
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  
                  {user.role === 'admin' && (
                    <>
                      <Divider />
                      <MenuItem onClick={handleUserMenuClose} component={Link} to="/admin/users">
                        <ListItemIcon>
                          <AdminPanelSettingsIcon fontSize="small" />
                        </ListItemIcon>
                        User Management
                      </MenuItem>
                    </>
                  )}
                  
                  <Divider />
                  
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: '#ff0000 !important',
              color: '#000000 !important',
              '& *': {
                color: '#000000 !important',
                fontSize: '20px !important',
                fontFamily: '-apple-system, Arial, sans-serif !important',
                webkitTextFillColor: '#000000 !important',
                textFillColor: '#000000 !important'
              }
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: '#ffffff',
              color: '#000000'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // AppBar height
          backgroundColor: 'background.default',
          position: 'relative',
          minHeight: '100vh'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>

        {/* Version Footer - Deployment Verification */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            backgroundColor: '#00ff00 !important',
            color: '#000000 !important',
            padding: '20px !important',
            fontSize: '24px !important',
            fontWeight: '900 !important',
            zIndex: 99999,
            border: '5px solid #ff0000 !important',
            boxShadow: '0 0 20px rgba(255,0,0,0.8) !important'
          }}
        >
          🔴 BUILD v2.0.0 🔴
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 