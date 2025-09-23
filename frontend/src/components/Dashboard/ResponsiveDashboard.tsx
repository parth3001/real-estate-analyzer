import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  SwipeableDrawer,
  IconButton,
  Fab,
  Badge,
  Collapse,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as PortfolioIcon,
  AccountTree as PipelineIcon,
  AutoAwesome as AIIcon,
  Assessment as AnalysisIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import all dashboard components
import PortfolioHealthPanel from './PortfolioHealthPanel';
import PipelineIntegrationPanel from './PipelineIntegrationPanel';
import SmartActionCards from './SmartActionCards';
import RecentAnalysesPanel from './RecentAnalysesPanel';
import { AppleButton } from '../ui/AppleComponents';

// Mobile Tab Interface
interface MobileTab {
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  badge?: number;
}

const ResponsiveDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // State
  const [mobileTabValue, setMobileTabValue] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeDeals: 0,
    highPriorityActions: 0,
    recentAnalyses: 0
  });

  // Load dashboard stats for badges
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    // In production, this would load from API
    setDashboardStats({
      activeDeals: 3,
      highPriorityActions: 2,
      recentAnalyses: 5
    });
  };

  // Mobile tabs configuration
  const mobileTabs: MobileTab[] = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      component: <PortfolioHealthPanel />
    },
    {
      label: 'Actions',
      icon: <AIIcon />,
      component: <SmartActionCards />,
      badge: dashboardStats.highPriorityActions
    },
    {
      label: 'Pipeline',
      icon: <PipelineIcon />,
      component: <PipelineIntegrationPanel />,
      badge: dashboardStats.activeDeals
    },
    {
      label: 'Analyses',
      icon: <AnalysisIcon />,
      component: <RecentAnalysesPanel />,
      badge: dashboardStats.recentAnalyses
    }
  ];

  // Quick Actions for FAB
  const quickActions = [
    { label: 'New Analysis', icon: <AnalysisIcon />, action: () => navigate('/sfr-analysis') },
    { label: 'Add Deal', icon: <PipelineIcon />, action: () => navigate('/pipeline/add') },
    { label: 'View Portfolio', icon: <PortfolioIcon />, action: () => navigate('/portfolio') }
  ];

  // Mobile Navigation Drawer
  const MobileDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      onOpen={() => setMobileMenuOpen(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '50vh'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Quick Actions
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        {quickActions.map((action, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <AppleButton
              variant="ghost"
              fullWidth
              icon={action.icon}
              onClick={() => {
                action.action();
                setMobileMenuOpen(false);
              }}
            >
              {action.label}
            </AppleButton>
          </Box>
        ))}
      </Box>
    </SwipeableDrawer>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <Box sx={{ py: 4 }}>
      {/* Welcome Alert (dismissible) */}
      {!alertDismissed && (
        <Collapse in={!alertDismissed}>
          <Alert
            severity="info"
            onClose={() => setAlertDismissed(true)}
            sx={{ mb: 4, borderRadius: '12px' }}
          >
            <Typography variant="body2">
              <strong>Welcome to your new portfolio-first dashboard!</strong> We've reorganized everything to give you better insights into your investment journey.
            </Typography>
          </Alert>
        </Collapse>
      )}

      {/* Main Layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, mb: 4 }}>
        {/* Left Column - Portfolio & Pipeline */}
        <Box>
          <Box sx={{ mb: 4 }}>
            <PortfolioHealthPanel />
          </Box>
          <Box sx={{ mb: 4 }}>
            <PipelineIntegrationPanel />
          </Box>
        </Box>

        {/* Right Column - Smart Actions */}
        <Box>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <SmartActionCards />
          </Box>
        </Box>
      </Box>

      {/* Full Width - Recent Analyses */}
      <Box>
        <RecentAnalysesPanel />
      </Box>
    </Box>
  );

  // Tablet Layout (2 columns)
  const TabletLayout = () => (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
        <Box>
          <PortfolioHealthPanel />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Box>
            <SmartActionCards />
          </Box>
          <Box>
            <PipelineIntegrationPanel />
          </Box>
        </Box>
        <Box>
          <RecentAnalysesPanel />
        </Box>
      </Box>
    </Box>
  );

  // Mobile Layout (Tabbed)
  const MobileLayout = () => (
    <Box sx={{ pb: 8 }}>
      {/* Mobile Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backgroundColor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Tabs
          value={mobileTabValue}
          onChange={(_, value) => setMobileTabValue(value)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.75rem'
            }
          }}
        >
          {mobileTabs.map((tab, index) => (
            <Tab
              key={index}
              icon={
                tab.badge ? (
                  <Badge badgeContent={tab.badge} color="error">
                    {tab.icon}
                  </Badge>
                ) : (
                  tab.icon
                ) as React.ReactElement
              }
              label={tab.label}
            />
          ))}
        </Tabs>
      </Box>

      {/* Mobile Content */}
      <Box sx={{ p: 2, mt: 2 }}>
        {mobileTabs[mobileTabValue].component}
      </Box>

      {/* Mobile FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1200
        }}
        onClick={() => setMobileMenuOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Mobile Drawer */}
      <MobileDrawer />
    </Box>
  );

  // Notification Badge (for all layouts)
  const NotificationBadge = () => (
    <IconButton
      onClick={() => setShowNotifications(!showNotifications)}
      sx={{
        position: 'fixed',
        top: isDesktop ? 80 : 16,
        right: isDesktop ? 32 : 16,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        boxShadow: 2,
        '&:hover': {
          backgroundColor: 'background.paper',
          transform: 'scale(1.1)'
        }
      }}
    >
      <Badge badgeContent={dashboardStats.highPriorityActions} color="error">
        <NotificationIcon />
      </Badge>
    </IconButton>
  );

  return (
    <Container maxWidth="xl" sx={{ position: 'relative' }}>
      {/* Conditional Layout Rendering */}
      {isMobile ? (
        <MobileLayout />
      ) : isTablet ? (
        <TabletLayout />
      ) : (
        <DesktopLayout />
      )}

      {/* Notification Badge (all layouts) */}
      {!isMobile && <NotificationBadge />}

      {/* Notification Panel (desktop/tablet only) */}
      {!isMobile && (
        <Collapse in={showNotifications}>
          <Box
            sx={{
              position: 'fixed',
              top: 130,
              right: 32,
              width: 320,
              backgroundColor: 'background.paper',
              borderRadius: '12px',
              boxShadow: 4,
              p: 2,
              zIndex: 1099
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Notifications
            </Typography>
            {dashboardStats.highPriorityActions > 0 ? (
              <Alert severity="warning" sx={{ mb: 1 }}>
                You have {dashboardStats.highPriorityActions} high-priority actions
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No new notifications
              </Typography>
            )}
          </Box>
        </Collapse>
      )}
    </Container>
  );
};

export default ResponsiveDashboard;