// Complete Apple-Style Navigation System
// Preserves all existing functionality, routes, and data flows

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Collapse,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Apartment as ApartmentIcon,
  BookmarkBorder as BookmarkIcon,
  Assessment as AssessmentIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDualMode } from '../../contexts/DualModeContext';
import { ModeToggle } from '../common/ModeToggle';
import { appleColors, appleBorderRadius } from '../../theme/appleDesignSystem';

// Apple-style constants
const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 72;

// Navigation items configuration - preserving all existing routes
const getNavigationItems = (userRole?: string, userMode?: 'novice' | 'pro') => {
  const allItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    path: '/dashboard',
    badge: null
  },
  {
    id: 'analysis',
    label: 'Property Analysis',
    icon: AnalyticsIcon,
    path: null, // This will have submenu
    badge: null,
    submenu: [
      {
        id: 'sfr-analysis',
        label: 'Single-Family Rental',
        icon: HomeIcon,
        path: '/sfr-analysis',
        description: 'Analyze SFR properties'
      },
      {
        id: 'mf-analysis',
        label: 'Multi-Family',
        icon: ApartmentIcon,
        path: '/mf-analysis',
        description: 'Analyze multi-family properties'
      }
    ]
  },
  {
    id: 'saved-properties',
    label: 'Saved Properties',
    icon: BookmarkIcon,
    path: '/saved-properties',
    badge: 3 // Dynamic count - will be populated from API
  },
  {
    id: 'portfolio',
    label: 'Portfolio Intelligence',
    icon: BusinessIcon,
    path: '/portfolio',
    badge: null
  },
  {
    id: 'pipeline',
    label: 'Deal Pipeline',
    icon: TrendingUpIcon,
    path: '/pipeline',
    badge: null
  },
  {
    id: 'market-data',
    label: 'Market Intelligence',
    icon: AssessmentIcon,
    path: '/market-data',
    badge: null
  },
  // Development/Testing routes
  ...(process.env.NODE_ENV === 'development' ? [{
    id: 'census-test',
    label: 'Census Data Test',
    icon: MapIcon,
    path: '/census-test',
    badge: null
  }] : []),
  // Admin routes
  ...(userRole === 'admin' ? [{
    id: 'admin',
    label: 'Administration',
    icon: AdminPanelSettingsIcon,
    path: null,
    badge: null,
    submenu: [
      {
        id: 'admin-users',
        label: 'User Management',
        icon: PersonIcon,
        path: '/admin/users',
        description: 'Manage users and permissions'
      }
    ]
  }] : []),
  {
    id: 'help',
    label: 'Help & Documentation',
    icon: HelpIcon,
    path: '/help',
    badge: null
  }
];

  // Filter navigation items based on mode
  if (userMode === 'novice') {
    return allItems.filter(item => {
      // Hide advanced features in novice mode
      const noviceHiddenItems = ['market-data', 'admin', 'census-test'];
      
      if (noviceHiddenItems.includes(item.id)) {
        return false;
      }
      
      // For analysis submenu, hide multi-family analysis in novice mode
      if (item.id === 'analysis' && item.submenu) {
        item.submenu = item.submenu.filter((subItem: any) => 
          subItem.id !== 'mf-analysis' // Hide multi-family for novice users
        );
      }
      
      return true;
    });
  }
  
  // Return all items for pro mode
  return allItems;
};

// Main Navigation Component
interface AppleNavigationProps {
  children?: React.ReactNode;
}

export const AppleNavigation: React.FC<AppleNavigationProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { mode } = useDualMode();
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Responsive default
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    analysis: true, // Default expanded
    admin: false
  });

  const navigationItems = getNavigationItems(user?.role, mode);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  // Handle mobile drawer close
  const handleMobileDrawerClose = () => {
    setMobileOpen(false);
  };

  // Handle submenu toggle
  const handleSubmenuToggle = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Check if current path is active
  const isPathActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get user initials (preserving existing logic)
  const getUserInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  // Handle logout (preserving existing logic)
  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
  };

  // Sidebar Logo Component
  const SidebarLogo = () => (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: appleBorderRadius.lg,
          backgroundColor: appleColors.primary[500],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: (sidebarOpen && !isMobile) ? 2 : 0
        }}
      >
        <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
      </Box>
      
      {(sidebarOpen && !isMobile) && (
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: 'white', lineHeight: 1.2 }}
          >
            Real Estate
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}
          >
            Deal Analyzer
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Navigation Item Component
  const NavigationItem = ({ item }: { item: any }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.id];
    const isActive = item.path ? isPathActive(item.path) : 
                    hasSubmenu ? item.submenu.some((sub: any) => isPathActive(sub.path)) : false;

    return (
      <>
        <ListItem
          onClick={() => {
            if (hasSubmenu) {
              handleSubmenuToggle(item.id);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          sx={{
            mx: 1,
            borderRadius: appleBorderRadius.lg,
            mb: 0.5,
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            '&:hover': {
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive ? 'primary.300' : 'rgba(255, 255, 255, 0.7)',
              minWidth: (sidebarOpen && !isMobile) ? 40 : 'auto',
              mr: (sidebarOpen && !isMobile) ? 2 : 0
            }}
          >
            <item.icon />
          </ListItemIcon>
          
          {(sidebarOpen && !isMobile) && (
            <>
              <ListItemText
                primary={item.label}
                sx={{
                  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  '& .MuiTypography-root': {
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '14px'
                  }
                }}
              />
              
              {item.badge && (
                <Badge
                  badgeContent={item.badge}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: 'primary.500',
                      color: 'white',
                      fontSize: '11px',
                      height: '18px',
                      minWidth: '18px'
                    }
                  }}
                />
              )}
              
              {hasSubmenu && (
                <IconButton
                  size="small"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </>
          )}
        </ListItem>

        {/* Submenu Items */}
        {hasSubmenu && (sidebarOpen && !isMobile) && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List sx={{ pl: 2 }}>
              {item.submenu.map((subItem: any) => (
                <ListItem
                  key={subItem.id}
                  onClick={() => handleNavigation(subItem.path)}
                  sx={{
                    mx: 1,
                    borderRadius: '8px',
                    backgroundColor: isPathActive(subItem.path) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isPathActive(subItem.path) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                    },
                    cursor: 'pointer'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isPathActive(subItem.path) ? 'primary.300' : 'rgba(255, 255, 255, 0.6)',
                      minWidth: 32
                    }}
                  >
                    <subItem.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={subItem.label}
                    secondary={subItem.description}
                    sx={{
                      color: isPathActive(subItem.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                      '& .MuiTypography-root': {
                        fontSize: '13px'
                      },
                      '& .MuiTypography-body2': {
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  // User Profile Section
  const UserProfileSection = () => (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        mt: 'auto'
      }}
    >
      <Box
        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: 'primary.500',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {getUserInitials(user?.firstName, user?.lastName)}
        </Avatar>
        
        {(sidebarOpen && !isMobile) && (
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: 'white', lineHeight: 1.2 }}
            >
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // Sidebar content
  const sidebarContent = (
    <>
      <SidebarLogo />
      
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {navigationItems.map((item) => (
          <NavigationItem key={item.id} item={item} />
        ))}
      </List>
      
      <UserProfileSection />
    </>
  );

  // Get page title (preserving existing logic)
  const getPageTitle = (pathname: string): string => {
    const titles: { [key: string]: string } = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/sfr-analysis': 'Single-Family Rental Analysis',
      '/mf-analysis': 'Multi-Family Analysis',
      '/saved-properties': 'Saved Properties',
      '/portfolio': 'Portfolio Intelligence',
      '/market-data': 'Market Intelligence',
      '/census-test': 'Census Data Test',
      '/help': 'Help & Documentation',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/admin/users': 'User Management'
    };
    
    // Handle dynamic portfolio routes
    if (pathname.startsWith('/portfolio/')) {
      return 'Portfolio Intelligence';
    }
    
    return titles[pathname] || 'Real Estate Analyzer';
  };

  // Top App Bar
  const TopAppBar = () => (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px)`,
        ml: isMobile ? 0 : `${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px`,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'grey.200',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight={600} color="text.primary">
            {getPageTitle(location.pathname)}
          </Typography>
          
          {/* Dual-Mode Toggle - only for authenticated users */}
          {user && (
            <Box sx={{ ml: 4 }}>
              <ModeToggle />
            </Box>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Welcome message for larger screens */}
          {user && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
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
          )}

          {/* Notifications - keeping for future functionality */}
          <IconButton
            onClick={(e) => setNotificationMenuAnchor(e.currentTarget)}
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={0} color="primary">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'primary.500',
                fontSize: '12px'
              }}
            >
              {getUserInitials(user?.firstName, user?.lastName)}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'grey.900', // Dark theme as requested
              border: 'none',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden'
            }
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'grey.900', // Dark theme as requested
              border: 'none'
            }
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Top App Bar */}
      <TopAppBar />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px)`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          mt: '64px' // AppBar height
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* User Menu - preserving all existing functionality */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
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
          }
        }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
          {user?.role === 'admin' && (
            <Chip 
              label="Administrator" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>

        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/profile'); }}>
          <PersonIcon sx={{ mr: 2 }} />
          My Profile
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/settings'); }}>
          <SettingsIcon sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        
        {/* Admin menu items */}
        {user?.role === 'admin' && (
          <>
            <Divider />
            <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/admin/users'); }}>
              <AdminPanelSettingsIcon sx={{ mr: 2 }} />
              User Management
            </MenuItem>
          </>
        )}
        
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Notifications Menu - placeholder for future functionality */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={() => setNotificationMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 300,
            maxHeight: 400
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem>
          <Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No new notifications
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AppleNavigation;