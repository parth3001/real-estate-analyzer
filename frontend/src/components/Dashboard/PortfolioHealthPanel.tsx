import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  AttachMoney as CashFlowIcon,
  Home as PropertiesIcon,
  Assessment as AnalyticsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppleButton, AppleCard, AppleMetricCard } from '../ui/AppleComponents';
import { portfolioApi } from '../../services/api';

// Portfolio Health Panel Interfaces
interface PortfolioHealth {
  totalValue: number;
  monthlyNetCashFlow: number;
  totalEquity: number;
  totalDebt: number;
  equityRatio: number;
}

interface QuickStats {
  totalProperties: number;
  avgDealQuality: number;
  bestCapRate: number;
  portfolioGrowth: number;
}

interface Alert {
  type: string;
  severity: 'warning' | 'info' | 'error';
  message: string;
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  portfolioId?: string;
}

interface DashboardSummary {
  success: boolean;
  hasPortfolios: boolean;
  portfolioCount: number;
  portfolioHealth: PortfolioHealth;
  quickStats: QuickStats;
  alerts: Alert[];
  recommendations: Recommendation[];
  lastUpdated: string;
}

const PortfolioHealthPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await portfolioApi.getDashboardSummary();
      if (response.status === 200 && response.data.success) {
        setDashboardData(response.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${Math.round(amount).toLocaleString()}`;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'warning': return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'info': return <InfoIcon sx={{ color: 'info.main' }} />;
      case 'error': return <WarningIcon sx={{ color: 'error.main' }} />;
      default: return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error.main';
      case 'medium': return 'warning.main';
      case 'low': return 'info.main';
      default: return 'info.main';
    }
  };

  const handleRecommendationAction = (recommendation: Recommendation) => {
    switch (recommendation.action) {
      case 'CREATE_PORTFOLIO':
        navigate('/portfolio/create');
        break;
      case 'VIEW_PORTFOLIO':
        if (recommendation.portfolioId) {
          navigate(`/portfolio/${recommendation.portfolioId}`);
        }
        break;
      case 'START_ANALYSIS':
        navigate('/sfr-analysis');
        break;
      default:
        console.log('Unknown action:', recommendation.action);
    }
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="60%" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="80%" height={32} sx={{ mb: 4 }} />
        <Skeleton variant="rounded" width="100%" height={300} />
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Failed to Load Portfolio Data</AlertTitle>
          {error}
        </Alert>
        <AppleButton
          variant="primary"
          onClick={loadDashboardData}
          icon={<RefreshIcon />}
        >
          Retry
        </AppleButton>
      </Box>
    );
  }

  // No Portfolios State
  if (!dashboardData?.hasPortfolios) {
    return (
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
          Welcome to Your Investment Journey! 🚀
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Ready to build your real estate portfolio? Let's start with creating your first portfolio.
        </Typography>

        <AppleCard padding="large">
          <Box
            sx={{
              p: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <PortfolioIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
              Create Your First Portfolio
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Start building your real estate empire by creating your first investment portfolio.
              Track performance, set goals, and make data-driven investment decisions.
            </Typography>
            <AppleButton
              variant="secondary"
              size="large"
              onClick={() => navigate('/portfolio/create')}
              icon={<AddIcon />}
            >
              Create Portfolio
            </AppleButton>
          </Box>
        </AppleCard>
      </Box>
    );
  }

  // Portfolio Health Display
  return (
    <Box sx={{ mb: 6 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
          Welcome back, {user?.firstName || 'Investor'}! 📊
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Your portfolio health summary and investment opportunities
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </Typography>
          <IconButton onClick={loadDashboardData} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Portfolio Health Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <AppleMetricCard
          label="Portfolio Value"
          value={formatCurrency(dashboardData.portfolioHealth.totalValue)}
          icon={<PortfolioIcon />}
          trend={dashboardData.quickStats.portfolioGrowth}
          size="medium"
        />
        <AppleMetricCard
          label="Monthly Cash Flow"
          value={formatCurrency(dashboardData.portfolioHealth.monthlyNetCashFlow)}
          icon={<CashFlowIcon />}
          trend={dashboardData.portfolioHealth.monthlyNetCashFlow > 0 ? 5 : -5}
          size="medium"
        />
        <AppleMetricCard
          label="Total Properties"
          value={dashboardData.quickStats.totalProperties.toString()}
          icon={<PropertiesIcon />}
          size="medium"
        />
        <AppleMetricCard
          label="Avg. Deal Quality"
          value={`${dashboardData.quickStats.avgDealQuality}/100`}
          icon={<AnalyticsIcon />}
          size="medium"
        />
      </Box>

      {/* Alerts Section */}
      {dashboardData.alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Portfolio Alerts
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {dashboardData.alerts.map((alert, index) => (
              <Alert
                key={index}
                severity={alert.severity}
                icon={getAlertIcon(alert.severity)}
                sx={{ borderRadius: '12px' }}
              >
                <Chip
                  label="Alert"
                  size="small"
                  sx={{ mb: 1, fontSize: '0.75rem' }}
                />
                <Typography variant="body2">{alert.message}</Typography>
              </Alert>
            ))}
          </Box>
        </Box>
      )}

      {/* Recommendations Section */}
      {dashboardData.recommendations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Smart Recommendations
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {dashboardData.recommendations.map((recommendation, index) => (
              <AppleCard key={index} hover padding="medium">
                <Box display="flex" justifyContent="between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <Chip
                        label={recommendation.priority}
                        size="small"
                        sx={{
                          backgroundColor: `${getPriorityColor(recommendation.priority)}20`,
                          color: getPriorityColor(recommendation.priority),
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      />
                      {recommendation.portfolioId && (
                        <Chip
                          label="Portfolio Rec"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {recommendation.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {recommendation.description}
                    </Typography>
                  </Box>
                </Box>

                <AppleButton
                  variant="ghost"
                  size="small"
                  fullWidth
                  onClick={() => handleRecommendationAction(recommendation)}
                >
                  {recommendation.action === 'CREATE_PORTFOLIO' ? 'Create Portfolio' :
                   recommendation.action === 'VIEW_PORTFOLIO' ? 'View Portfolio' :
                   recommendation.action === 'START_ANALYSIS' ? 'Start Analysis' : 'Take Action'}
                </AppleButton>
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}

      {/* Portfolio Summary */}
      <AppleCard padding="large">
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                Portfolio Performance Summary
              </Typography>
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Equity Ratio</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {dashboardData.portfolioHealth.equityRatio.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Best Cap Rate</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {dashboardData.quickStats.bestCapRate}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Portfolios</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {dashboardData.portfolioCount}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" gap={2} justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <AppleButton
                variant="secondary"
                onClick={() => navigate('/portfolio')}
              >
                View Portfolios
              </AppleButton>
              <AppleButton
                variant="secondary"
                onClick={() => navigate('/sfr-analysis')}
                icon={<AddIcon />}
              >
                Add Property
              </AppleButton>
            </Box>
          </Box>
        </Box>
      </AppleCard>
    </Box>
  );
};

export default PortfolioHealthPanel;