import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Import new dashboard components
import PipelineHealthMonitor from './PipelineHealthMonitor';
import DecisionQueue from './DecisionQueue';
import PortfolioDistribution from './PortfolioDistribution';
import PortfolioSummary from './PortfolioSummary';
import ActivityTimeline from './ActivityTimeline';
import FocusedDecisionCenter from './FocusedDecisionCenter';

const InvestmentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<'enhanced' | 'focused'>('enhanced');

  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Add visibility change listener to refresh when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show focused view if user prefers simplicity
  if (view === 'focused') {
    return (
      <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing simplified view
          </Typography>
          <Box>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={() => setView('enhanced')} size="small">
              <DashboardIcon />
            </IconButton>
          </Box>
        </Box>
        <FocusedDecisionCenter key={refreshKey} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Your Investment Command Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Screen deals, track your pipeline, and see portfolio impact in one place.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={() => setView('focused')} size="small">
            <TrendingUpIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Welcome Message */}
      {user && (
        <Box sx={{
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Welcome back, {user.firstName || 'Investor'} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay organized with all your deals tracked in one workflow.
          </Typography>
        </Box>
      )}

      {/* Pipeline Health Monitor - Full Width */}
      <Box
        sx={{
          mb: 3,
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          animationDelay: '0.1s'
        }}
        key={`pipeline-${refreshKey}`}
      >
        <PipelineHealthMonitor />
      </Box>

      {/* Decision Queue - Full Width */}
      <Box
        sx={{
          mb: 3,
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          animationDelay: '0.2s'
        }}
        key={`decisions-${refreshKey}`}
      >
        <DecisionQueue />
      </Box>

      {/* Two Column Layout: Saved Properties | Portfolio */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3,
        mb: 3
      }}>
        <Box
          sx={{
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: '0.3s'
          }}
          key={`saved-properties-${refreshKey}`}
        >
          <PortfolioDistribution />
        </Box>
        <Box
          sx={{
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: '0.35s'
          }}
          key={`portfolio-${refreshKey}`}
        >
          <PortfolioSummary />
        </Box>
      </Box>

      {/* Activity Timeline - Full Width */}
      <Box
        sx={{
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          animationDelay: '0.4s'
        }}
        key={`activity-${refreshKey}`}
      >
        <ActivityTimeline />
      </Box>

      {/* Last Updated */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default InvestmentDashboard;