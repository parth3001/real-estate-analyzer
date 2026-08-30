import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Badge
} from '@mui/material';
import {
  Assessment as AnalysisIcon,
  TrendingUp as BuyIcon,
  TrendingFlat as NegotiateIcon,
  TrendingDown as PassIcon,
  Warning as CautionIcon,
  Schedule as RecentIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleButton, AppleCard } from '../ui/AppleComponents';
import { ConfidenceIndicator } from '../ui/ConfidenceIndicator';
import api from '../../services/api';

// Recent Analyses Interfaces
interface RecentAnalysis {
  _id: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  purchasePrice: number;
  monthlyRent: number;
  propertyType: string;
  analysis: {
    verdict: 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS';
    dealQuality: number;
    keyMetrics: {
      capRate: number;
      cashFlow: number;
      cashOnCashReturn: number;
    };
    confidence: {
      level: 1 | 2 | 3;
      dataSource: string;
    };
  };
  createdAt: string;
  portfolioId?: string;
  portfolioName?: string;
}

const RecentAnalysesPanel: React.FC = () => {
  const navigate = useNavigate();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentAnalyses();
  }, []);

  const loadRecentAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the shared axios client. It already resolves the API base
      // URL (VITE_API_URL, which INCLUDES the /api suffix) and attaches
      // the auth token via its request interceptor. Building the URL by
      // hand here produced `/api/api/deals/recent` in production, and
      // read the token from the wrong storage key.
      const response = await api.get('/deals/recent?limit=6');

      if (response.data.success) {
        setRecentAnalyses(response.data.deals || []);
      }
    } catch (error: any) {
      console.error('Error loading recent analyses:', error);
      setError(error.message || 'Failed to load recent analyses');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'BUY': return <BuyIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'NEGOTIATE': return <NegotiateIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
      case 'CAUTION': return <CautionIcon sx={{ fontSize: 16, color: 'warning.dark' }} />;
      case 'PASS': return <PassIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default: return <AnalysisIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'BUY': return 'success.main';
      case 'NEGOTIATE': return 'warning.main';
      case 'CAUTION': return 'warning.dark';
      case 'PASS': return 'error.main';
      default: return 'grey.500';
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

  // Loading State
  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index}>
              <Skeleton variant="rounded" width="100%" height={150} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // No Analyses State
  if (!recentAnalyses.length && !error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Recent Analyses
          </Typography>
        </Box>

        <AppleCard padding="large">
          <Box textAlign="center" py={4}>
            <AnalysisIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No analyses yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start analyzing properties to see them here
            </Typography>
            <AppleButton
              variant="primary"
              onClick={() => navigate('/sfr-analysis')}
              icon={<AnalysisIcon />}
            >
              Analyze First Property
            </AppleButton>
          </Box>
        </AppleCard>
      </Box>
    );
  }

  // Recent Analyses Display
  return (
    <Box sx={{ mb: 6 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" fontWeight={600}>
            Recent Analyses
          </Typography>
          <Badge badgeContent={recentAnalyses.length} color="primary">
            <RecentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          </Badge>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={loadRecentAnalyses} size="small">
            <RefreshIcon />
          </IconButton>
          <AppleButton
            variant="ghost"
            size="small"
            onClick={() => navigate('/deals')}
            icon={<ArrowRightIcon />}
          >
            View All
          </AppleButton>
        </Box>
      </Box>

      {/* Analyses Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {recentAnalyses.slice(0, 6).map((analysis) => (
          <AppleCard key={analysis._id} hover padding="medium">
            {/* Property Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                  {analysis.propertyAddress.street}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analysis.propertyAddress.city}, {analysis.propertyAddress.state}
                </Typography>
              </Box>
              <ConfidenceIndicator
                level={analysis.analysis.confidence.level}
                size="small"
                source={analysis.analysis.confidence.dataSource}
              />
            </Box>

            {/* Verdict and Score */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Chip
                icon={getVerdictIcon(analysis.analysis.verdict)}
                label={analysis.analysis.verdict}
                size="small"
                sx={{
                  backgroundColor: `${getVerdictColor(analysis.analysis.verdict)}20`,
                  color: getVerdictColor(analysis.analysis.verdict),
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              />
              <Box display="flex" alignItems="baseline" gap={0.5}>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {analysis.analysis.dealQuality}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  /100
                </Typography>
              </Box>
            </Box>

            {/* Key Metrics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block">
                  Price
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(analysis.purchasePrice)}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block">
                  Cash Flow
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${Math.round(analysis.analysis.keyMetrics.cashFlow)}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block">
                  Cap Rate
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.analysis.keyMetrics.capRate.toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            {/* Portfolio Badge & Time */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              {analysis.portfolioName && (
                <Chip
                  label={analysis.portfolioName}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(analysis.createdAt)}
              </Typography>
            </Box>

            {/* Action Button */}
            <AppleButton
              variant="ghost"
              size="small"
              fullWidth
              onClick={() => navigate(`/deals/${analysis._id}`)}
            >
              View Analysis
            </AppleButton>
          </AppleCard>
        ))}
      </Box>

      {/* Quick Actions */}
      <Box display="flex" justifyContent="center" gap={2} sx={{ mt: 4 }}>
        <AppleButton
          variant="primary"
          onClick={() => navigate('/sfr-analysis')}
          icon={<AnalysisIcon />}
        >
          New Analysis
        </AppleButton>
        <AppleButton
          variant="secondary"
          onClick={() => navigate('/deals')}
        >
          View All Analyses
        </AppleButton>
      </Box>
    </Box>
  );
};

export default RecentAnalysesPanel;