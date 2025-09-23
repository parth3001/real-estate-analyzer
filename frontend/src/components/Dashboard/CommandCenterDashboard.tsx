import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  AccountTree as PipelineIcon,
  Assessment as AnalysisIcon,
  Refresh as RefreshIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleButton, AppleCard } from '../ui/AppleComponents';
import { commandCenterApi } from '../../services/api';
import type {
  CommandCenterData,
  UrgentAction,
  ReviewItem,
  PipelineDealSummary,
  ActivityItem,
  PortfolioSummary
} from '../../types/commandCenter';

const CommandCenterDashboard: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [commandData, setCommandData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommandCenterData();
  }, []);

  const loadCommandCenterData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await commandCenterApi.getCommandCenterData();
      if (response.status === 200 && response.data.success) {
        setCommandData(response.data);
      } else {
        throw new Error('Failed to load command center data');
      }
    } catch (error: any) {
      console.error('Error loading command center data:', error);
      setError(error.message || 'Failed to load dashboard data');
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

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'medium': return <InfoIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'low': return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      default: return <InfoIcon sx={{ color: 'info.main', fontSize: 20 }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error.main';
      case 'medium': return 'warning.main';
      case 'low': return 'success.main';
      default: return 'info.main';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'LEAD': return 'info.main';
      case 'ANALYSIS': return 'warning.main';
      case 'NEGOTIATION': return 'primary.main';
      case 'CONTRACT': return 'success.main';
      case 'CLOSED': return 'success.dark';
      case 'LOST': return 'error.main';
      default: return 'grey.500';
    }
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Failed to Load Dashboard</Typography>
          {error}
        </Alert>
        <AppleButton
          variant="primary"
          onClick={loadCommandCenterData}
          icon={<RefreshIcon />}
        >
          Retry
        </AppleButton>
      </Box>
    );
  }

  if (!commandData) {
    return null;
  }

  // Hero Status Bar Component
  const HeroStatusBar = ({ portfolioSummary }: { portfolioSummary: PortfolioSummary }) => (
    <Box sx={{ mb: 4 }}>
      <AppleCard padding="medium">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Portfolio Command Center
          </Typography>
          <IconButton onClick={loadCommandCenterData} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={600} color="primary.main">
              {formatCurrency(portfolioSummary.totalValue)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Portfolio Value
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={600} color={portfolioSummary.monthlyNetCashFlow >= 0 ? 'success.main' : 'error.main'}>
              {portfolioSummary.monthlyNetCashFlow >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.monthlyNetCashFlow)}/mo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cash Flow
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={600}>
              {portfolioSummary.totalProperties}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Properties
            </Typography>
          </Box>
          <Box textAlign="center">
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <Badge badgeContent={portfolioSummary.alerts.urgent} color="error">
                <WarningIcon sx={{ color: 'error.main' }} />
              </Badge>
              <Badge badgeContent={portfolioSummary.alerts.review} color="warning">
                <InfoIcon sx={{ color: 'warning.main' }} />
              </Badge>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Alerts
            </Typography>
          </Box>
        </Box>
      </AppleCard>
    </Box>
  );

  // Priority Actions Component
  const PriorityActions = ({ urgentActions, reviewItems }: { urgentActions: UrgentAction[], reviewItems: ReviewItem[] }) => (
    <Box>
      {/* Urgent Actions */}
      {urgentActions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'error.main' }}>
            ⚠️ NEEDS ATTENTION ({urgentActions.length})
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {urgentActions.map((action) => (
              <AppleCard key={action.id} hover padding="medium">
                <Box display="flex" alignItems="flex-start" gap={2}>
                  {getSeverityIcon(action.severity)}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {action.description}
                    </Typography>
                    <AppleButton
                      variant="primary"
                      size="small"
                      onClick={() => navigate(action.actionUrl)}
                    >
                      {action.actionLabel}
                    </AppleButton>
                  </Box>
                  {action.daysUntilExpiry && (
                    <Chip
                      label={`${action.daysUntilExpiry}d left`}
                      size="small"
                      sx={{
                        backgroundColor: `${getSeverityColor(action.severity)}20`,
                        color: getSeverityColor(action.severity)
                      }}
                    />
                  )}
                </Box>
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}

      {/* Review Items */}
      {reviewItems.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            📊 READY TO REVIEW ({reviewItems.length})
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {reviewItems.map((item) => (
              <AppleCard key={item.id} hover padding="medium">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                  <AppleButton
                    variant="ghost"
                    size="small"
                    onClick={() => navigate(item.actionUrl)}
                    icon={<ArrowRightIcon />}
                  >
                    {item.actionLabel}
                  </AppleButton>
                </Box>
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Wins */}
      {commandData.quickWins.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            💡 QUICK WINS
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {commandData.quickWins.map((win) => (
              <AppleCard key={win.id} hover padding="medium">
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                  {win.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {win.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {win.estimatedValue > 0 && (
                    <Chip
                      label={`+${formatCurrency(win.estimatedValue)}`}
                      size="small"
                      sx={{ backgroundColor: 'success.50', color: 'success.main' }}
                    />
                  )}
                  <AppleButton
                    variant="primary"
                    size="small"
                    onClick={() => navigate(win.actionUrl)}
                  >
                    {win.actionLabel}
                  </AppleButton>
                </Box>
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  // Activity Feed Component
  const ActivityFeed = ({ activePipeline, recentActivity }: { activePipeline: PipelineDealSummary[], recentActivity: ActivityItem[] }) => (
    <Box>
      {/* Active Pipeline */}
      {activePipeline.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            🏃‍♂️ ACTIVE PIPELINE ({activePipeline.length})
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {activePipeline.map((deal) => (
              <AppleCard key={deal.id} padding="medium">
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {deal.dealName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deal.location} • {formatCurrency(deal.askingPrice)}
                    </Typography>
                  </Box>
                  {deal.isUrgent && (
                    <Chip label="Urgent" size="small" color="error" />
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Chip
                      label={deal.currentStage}
                      size="small"
                      sx={{
                        backgroundColor: `${getStageColor(deal.currentStage)}20`,
                        color: getStageColor(deal.currentStage)
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {deal.stageProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={deal.stageProgress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStageColor(deal.currentStage)
                      }
                    }}
                  />
                </Box>

                {deal.nextAction && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Next: {deal.nextAction}
                  </Typography>
                )}
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            📈 RECENT ACTIVITY
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {recentActivity.map((activity) => (
              <AppleCard key={activity.id} padding="medium">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'primary.50',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {activity.icon === 'analysis' ? <AnalysisIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : <AddIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(activity.timestamp)}
                  </Typography>
                </Box>
              </AppleCard>
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Actions */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          ⚡ QUICK ACTIONS
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          <AppleButton
            variant="primary"
            onClick={() => navigate('/sfr-analysis')}
            icon={<AnalysisIcon />}
          >
            Analyze Property
          </AppleButton>
          <AppleButton
            variant="secondary"
            onClick={() => navigate('/pipeline')}
            icon={<PipelineIcon />}
          >
            Add Deal
          </AppleButton>
          <AppleButton
            variant="ghost"
            onClick={() => navigate('/portfolio')}
            icon={<TrendingUpIcon />}
          >
            View Portfolio
          </AppleButton>
        </Box>
      </Box>
    </Box>
  );

  // Main Layout
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Hero Status Bar */}
      <HeroStatusBar portfolioSummary={commandData.portfolioSummary} />

      {/* Main Content Grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 4
      }}>
        {/* Left Column - Priority Actions */}
        <Box>
          <PriorityActions
            urgentActions={commandData.urgentActions}
            reviewItems={commandData.reviewItems}
          />
        </Box>

        {/* Right Column - Activity Feed */}
        <Box>
          <ActivityFeed
            activePipeline={commandData.activePipeline}
            recentActivity={commandData.recentActivity}
          />
        </Box>
      </Box>

      {/* Last Updated */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(commandData.lastUpdated).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default CommandCenterDashboard;