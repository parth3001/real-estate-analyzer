import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Skeleton,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assessment as AnalysisIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  KeyboardArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleButton, AppleCard } from '../ui/AppleComponents';
import { commandCenterApi } from '../../services/api';
import type {
  FocusedDashboardData,
  UrgentAction,
  ReviewItem,
  PipelineDealSummary,
  MarketContext
} from '../../types/commandCenter';

const FocusedDecisionCenter: React.FC = () => {
  const [data, setData] = useState<FocusedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFocusedData();
  }, []);

  // Add visibility change listener to refresh when user returns to dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh data
        loadFocusedData();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh data
      loadFocusedData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadFocusedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await commandCenterApi.getFocusedDashboardData();
      if (response.status === 200 && response.data.success) {
        setData(response.data);
      } else {
        throw new Error('Failed to load focused dashboard data');
      }
    } catch (error: any) {
      console.error('Error loading focused dashboard:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'today' : `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case 'BUY': return 'success.main';
      case 'NEGOTIATE': return 'warning.main';
      case 'CAUTION': return 'warning.dark';
      case 'PASS': return 'error.main';
      default: return 'text.primary';
    }
  };

  const getVerdictFromItem = (item: UrgentAction | ReviewItem): string => {
    if ('severity' in item) {
      // UrgentAction - check metadata
      return item.metadata?.verdict || 'REVIEW';
    } else {
      // ReviewItem - check metadata
      return item.metadata?.verdict || 'REVIEW';
    }
  };

  const getDealQualityFromItem = (item: UrgentAction | ReviewItem): number => {
    if ('severity' in item) {
      // UrgentAction
      return item.metadata?.dealQuality || 0;
    } else {
      // ReviewItem
      return item.metadata?.dealQuality || 0;
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 4, borderRadius: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>
          <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Failed to Load Investment Center</Typography>
          {error}
        </Alert>
        <AppleButton
          variant="primary"
          onClick={loadFocusedData}
          icon={<RefreshIcon />}
        >
          Retry
        </AppleButton>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Investment Decision Center
        </Typography>
        <IconButton onClick={loadFocusedData} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Hero Decision Section */}
      {data?.urgentDecision ? (
        <UrgentDecisionHero
          decision={data.urgentDecision}
          formatCurrency={formatCurrency}
          formatTimeAgo={formatTimeAgo}
          getVerdictColor={getVerdictColor}
          getVerdictFromItem={getVerdictFromItem}
          getDealQualityFromItem={getDealQualityFromItem}
        />
      ) : (
        <NoDecisionsPending />
      )}

      {/* Pipeline and Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4, mt: 4 }}>
        <NextInPipelineCard item={data?.nextInPipeline || null} formatCurrency={formatCurrency} />
        <QuickActionsCard />
      </Box>

      {/* Market Context */}
      {data?.marketContext && (
        <MarketContextBar context={data.marketContext} />
      )}

      {/* Last Updated */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

// Hero Component for Urgent Decisions
const UrgentDecisionHero: React.FC<{
  decision: UrgentAction | ReviewItem;
  formatCurrency: (amount: number) => string;
  formatTimeAgo: (date: string) => string;
  getVerdictColor: (verdict?: string) => string;
  getVerdictFromItem: (item: UrgentAction | ReviewItem) => string;
  getDealQualityFromItem: (item: UrgentAction | ReviewItem) => number;
}> = ({ decision, formatTimeAgo, getVerdictColor, getVerdictFromItem, getDealQualityFromItem }) => {
  const navigate = useNavigate();
  const verdict = getVerdictFromItem(decision);
  const dealQuality = getDealQualityFromItem(decision);

  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <AppleCard padding="large">
        <Typography variant="h4" color="error.main" sx={{ mb: 2 }}>
        🔴 DECISION NEEDED
      </Typography>

      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        {decision.title}
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        {decision.description}
      </Typography>

      {dealQuality > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" color={getVerdictColor(verdict)} sx={{ mb: 1 }}>
            ★ {verdict} Verdict ({dealQuality}/100)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analysis completed {formatTimeAgo('completedAt' in decision ? decision.completedAt : new Date().toISOString())}
          </Typography>
        </Box>
      )}

      <AppleButton
        variant="primary"
        size="large"
        onClick={() => navigate(decision.actionUrl)}
      >
        {decision.actionLabel}
      </AppleButton>
      </AppleCard>
    </Box>
  );
};

// No Decisions Pending State
const NoDecisionsPending: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <AppleCard padding="large">
        <Typography variant="h5" color="success.main" sx={{ mb: 2 }}>
        ✅ No Urgent Decisions
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        All your analyses are up to date. Ready to analyze a new property?
      </Typography>

      <AppleButton
        variant="primary"
        size="large"
        onClick={() => navigate('/sfr-analysis')}
        icon={<AnalysisIcon />}
      >
        Analyze New Property
      </AppleButton>
      </AppleCard>
    </Box>
  );
};

// Next in Pipeline Card
const NextInPipelineCard: React.FC<{
  item: PipelineDealSummary | null;
  formatCurrency: (amount: number) => string;
}> = ({ item, formatCurrency }) => {
  const navigate = useNavigate();

  if (!item) {
    return (
      <AppleCard padding="medium">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          📊 Next in Pipeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No properties currently in analysis pipeline
        </Typography>
        <AppleButton
          variant="ghost"
          fullWidth
          onClick={() => navigate('/sfr-analysis')}
          icon={<AddIcon />}
        >
          Start New Analysis
        </AppleButton>
      </AppleCard>
    );
  }

  return (
    <AppleCard padding="medium">
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        📊 Next in Pipeline
      </Typography>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {item.dealName}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {item.location} • {formatCurrency(item.askingPrice)}
      </Typography>

      <Typography variant="body2" sx={{ mb: 3 }}>
        Status: {item.nextAction || 'In Progress'}
      </Typography>

      <AppleButton
        variant="ghost"
        fullWidth
        onClick={() => navigate(`/analysis/${item.id}`)}
        icon={<ArrowRightIcon />}
      >
        Continue Analysis
      </AppleButton>
    </AppleCard>
  );
};

// Quick Actions Card
const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppleCard padding="medium">
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        🎯 Quick Actions
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <AppleButton
          variant="primary"
          fullWidth
          onClick={() => navigate('/sfr-analysis')}
          icon={<AnalysisIcon />}
        >
          Analyze Property
        </AppleButton>

        <AppleButton
          variant="secondary"
          fullWidth
          onClick={() => navigate('/mf-analysis')}
          icon={<AddIcon />}
        >
          Multi-Family Analysis
        </AppleButton>

        <AppleButton
          variant="ghost"
          fullWidth
          onClick={() => navigate('/saved-properties')}
          icon={<TrendingUpIcon />}
        >
          Saved Properties
        </AppleButton>
      </Box>
    </AppleCard>
  );
};

// Market Context Bar
const MarketContextBar: React.FC<{ context: MarketContext }> = ({ context }) => {
  return (
    <Box sx={{ mt: 4 }}>
      <AppleCard padding="medium">
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        📈 Market Context ({context.location})
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        <Box textAlign="center">
          <Typography variant="h6" fontWeight={600} color="primary.main">
            ${context.avgRent.toLocaleString()}/mo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Average Rent
          </Typography>
        </Box>

        <Box textAlign="center">
          <Typography variant="h6" fontWeight={600} color={context.trendPercentage >= 0 ? 'success.main' : 'error.main'}>
            {context.trendPercentage >= 0 ? '+' : ''}{context.trendPercentage}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            30-Day Trend
          </Typography>
        </Box>
      </Box>
      </AppleCard>
    </Box>
  );
};

export default FocusedDecisionCenter;