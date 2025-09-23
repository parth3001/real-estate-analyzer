import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  LinearProgress
} from '@mui/material';
import {
  AccountTree as PipelineIcon,
  TrendingUp as LeadIcon,
  Analytics as AnalysisIcon,
  Handshake as NegotiationIcon,
  Description as ContractIcon,
  CheckCircle as ClosedIcon,
  Cancel as LostIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  KeyboardArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleButton, AppleCard } from '../ui/AppleComponents';
import { ConfidenceIndicator } from '../ui/ConfidenceIndicator';
import { pipelineApi } from '../../services/api';

// Pipeline Integration Panel Interfaces
interface PipelineDeal {
  _id: string;
  dealName: string;
  currentStage: 'LEAD' | 'ANALYSIS' | 'NEGOTIATION' | 'CONTRACT' | 'CLOSED' | 'LOST';
  propertyType: string;
  strategy: string;
  askingPrice: number;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  analysisStatus: 'NOT_ANALYZED' | 'IN_PROGRESS' | 'COMPLETE';
  analysisId?: string;
  quickMetrics?: {
    cashFlow: number;
    capRate: number;
    cashOnCashReturn: number;
    verdict?: 'BUY' | 'NEGOTIATE' | 'CAUTION' | 'PASS';
    dealQuality?: number;
  };
  confidence: {
    level: 1 | 2 | 3;
    dataSource: string;
  };
  updatedAt: string;
  nextAction?: string;
}

interface PipelineStats {
  totalDeals: number;
  activeDeals: number;
  dealsRequiringAction: number;
  averageDealTime: number;
  conversionRate: number;
}

const PipelineIntegrationPanel: React.FC = () => {
  const navigate = useNavigate();
  const [recentDeals, setRecentDeals] = useState<PipelineDeal[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recent deals and analytics in parallel
      const [recentDealsResponse, analyticsResponse] = await Promise.all([
        pipelineApi.getRecentDeals(5),
        pipelineApi.getAnalytics()
      ]);

      if (recentDealsResponse.status === 200) {
        setRecentDeals(recentDealsResponse.data.deals || []);
      }

      if (analyticsResponse.status === 200) {
        setPipelineStats(analyticsResponse.data.stats || null);
      }

    } catch (error: any) {
      console.error('Error loading pipeline data:', error);
      setError(error.message || 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'LEAD': return <LeadIcon sx={{ fontSize: 16 }} />;
      case 'ANALYSIS': return <AnalysisIcon sx={{ fontSize: 16 }} />;
      case 'NEGOTIATION': return <NegotiationIcon sx={{ fontSize: 16 }} />;
      case 'CONTRACT': return <ContractIcon sx={{ fontSize: 16 }} />;
      case 'CLOSED': return <ClosedIcon sx={{ fontSize: 16 }} />;
      case 'LOST': return <LostIcon sx={{ fontSize: 16 }} />;
      default: return <PipelineIcon sx={{ fontSize: 16 }} />;
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

  const getVerdictColor = (verdict?: string) => {
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

  const formatAddress = (address: any): string => {
    return `${address.city}, ${address.state}`;
  };

  const getStageProgress = (stage: string): number => {
    const stageOrder = ['LEAD', 'ANALYSIS', 'NEGOTIATION', 'CONTRACT', 'CLOSED'];
    const currentIndex = stageOrder.indexOf(stage);
    return currentIndex >= 0 ? ((currentIndex + 1) / stageOrder.length) * 100 : 0;
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index}>
              <Skeleton variant="rounded" width="100%" height={180} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // No Pipeline Data State
  if (!recentDeals.length && !error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Deal Pipeline
          </Typography>
          <AppleButton
            variant="primary"
            size="small"
            onClick={() => navigate('/pipeline')}
            icon={<AddIcon />}
          >
            Add Deal
          </AppleButton>
        </Box>

        <AppleCard padding="large">
          <Box textAlign="center" py={4}>
            <PipelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No deals in pipeline yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start tracking potential investments by adding them to your deal pipeline
            </Typography>
            <AppleButton
              variant="primary"
              onClick={() => navigate('/pipeline')}
              icon={<AddIcon />}
            >
              Add First Deal
            </AppleButton>
          </Box>
        </AppleCard>
      </Box>
    );
  }

  // Pipeline Data Display
  return (
    <Box sx={{ mb: 6 }}>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Deal Pipeline
          </Typography>
          {pipelineStats && (
            <Typography variant="body2" color="text.secondary">
              {pipelineStats.activeDeals} active deals • {pipelineStats.dealsRequiringAction} requiring action
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={loadPipelineData} size="small">
            <RefreshIcon />
          </IconButton>
          <AppleButton
            variant="ghost"
            size="small"
            onClick={() => navigate('/pipeline')}
            icon={<ArrowRightIcon />}
          >
            View All
          </AppleButton>
        </Box>
      </Box>

      {/* Pipeline Stats Bar */}
      {pipelineStats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600} color="primary.main">
              {pipelineStats.totalDeals}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Deals
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600} color="warning.main">
              {pipelineStats.activeDeals}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600} color="error.main">
              {pipelineStats.dealsRequiringAction}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Need Action
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600} color="success.main">
              {pipelineStats.conversionRate.toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Conversion
            </Typography>
          </Box>
        </Box>
      )}

      {/* Recent Deals */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {recentDeals.map((deal) => (
            <AppleCard hover padding="medium">
              {/* Deal Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                    {deal.dealName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatAddress(deal.address)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(deal.askingPrice)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <ConfidenceIndicator
                    level={deal.confidence.level}
                    size="small"
                    source={deal.confidence.dataSource}
                  />
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Stage and Progress */}
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    icon={getStageIcon(deal.currentStage)}
                    label={deal.currentStage.replace('_', ' ')}
                    size="small"
                    sx={{
                      backgroundColor: `${getStageColor(deal.currentStage)}20`,
                      color: getStageColor(deal.currentStage),
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {getStageProgress(deal.currentStage).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getStageProgress(deal.currentStage)}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStageColor(deal.currentStage)
                    }
                  }}
                />
              </Box>

              {/* Deal Metrics */}
              {deal.quickMetrics && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        ${Math.round(deal.quickMetrics.cashFlow)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cash Flow
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        {deal.quickMetrics.capRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Cap Rate
                      </Typography>
                    </Box>
                  </Box>

                  {deal.quickMetrics.verdict && (
                    <Box textAlign="center" sx={{ mt: 1 }}>
                      <Chip
                        label={deal.quickMetrics.verdict}
                        size="small"
                        sx={{
                          backgroundColor: `${getVerdictColor(deal.quickMetrics.verdict)}20`,
                          color: getVerdictColor(deal.quickMetrics.verdict),
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                      {deal.quickMetrics.dealQuality && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {deal.quickMetrics.dealQuality}/100
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {/* Next Action */}
              {deal.nextAction && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    Next Action:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {deal.nextAction}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box display="flex" gap={1}>
                <AppleButton
                  variant="ghost"
                  size="small"
                  fullWidth
                  onClick={() => navigate(`/pipeline/deal/${deal._id}`)}
                >
                  View Deal
                </AppleButton>
                {deal.analysisStatus === 'NOT_ANALYZED' && (
                  <AppleButton
                    variant="primary"
                    size="small"
                    onClick={() => navigate(`/sfr-analysis?pipelineId=${deal._id}`)}
                  >
                    Analyze
                  </AppleButton>
                )}
              </Box>
            </AppleCard>
        ))}
      </Box>

      {/* View All Pipeline Button */}
      <Box textAlign="center" sx={{ mt: 4 }}>
        <AppleButton
          variant="secondary"
          onClick={() => navigate('/pipeline')}
          icon={<PipelineIcon />}
        >
          View Full Pipeline
        </AppleButton>
      </Box>
    </Box>
  );
};

export default PipelineIntegrationPanel;