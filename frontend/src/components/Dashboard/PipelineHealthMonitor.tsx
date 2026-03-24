import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  Warning as WarningIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { AppleCard } from '../ui/AppleComponents';
import { pipelineApi } from '../../services/api';
import type { PipelineDeal } from '../../types/pipeline';

interface StageMetrics {
  stage: string;
  count: number;
  value: number;
  avgDays: number;
  color: string;
}

const STAGE_CONFIG = {
  WATCHING: { label: 'Watching', color: '#E8F1FF', textColor: '#1976d2' },
  ANALYZING: { label: 'Analyzing', color: '#E3F2FD', textColor: '#1565C0' },
  NEGOTIATING: { label: 'Negotiating', color: '#FFF9E6', textColor: '#F57C00' },
  UNDER_CONTRACT: { label: 'Under Contract', color: '#E8F5E9', textColor: '#388E3C' },
  CLOSED: { label: 'Closed', color: '#C8E6C9', textColor: '#2E7D32' },
  LOST: { label: 'Lost', color: '#FFEBEE', textColor: '#C62828' }
};

const PipelineHealthMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [conversionRates, setConversionRates] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const response = await pipelineApi.getDeals();

      if (response.status === 200 && response.data) {
        // Handle different possible data structures
        let dealsList: any[] = [];

        if (Array.isArray(response.data)) {
          dealsList = response.data;
        } else if (response.data.deals && Array.isArray(response.data.deals)) {
          dealsList = response.data.deals;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dealsList = response.data.data;
        }

        console.log('Pipeline deals loaded:', dealsList.length);
        calculateMetrics(dealsList);
      }
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      // Set empty metrics on error
      setStageMetrics([]);
      setConversionRates({});
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (dealsList: PipelineDeal[]) => {
    // Calculate stage metrics
    const metrics: StageMetrics[] = [];
    const stages = ['WATCHING', 'ANALYZING', 'NEGOTIATING', 'UNDER_CONTRACT', 'CLOSED', 'LOST'];

    stages.forEach(stage => {
      const stageDeals = dealsList.filter(deal => deal.currentStage === stage);
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.askingPrice || 0), 0);

      // Calculate average days in stage based on stage history dates
      let totalDays = 0;
      let dealsWithHistory = 0;

      stageDeals.forEach(deal => {
        const stageEntry = deal.stageHistory?.find(h => h.stage === stage);
        if (stageEntry) {
          const entryDate = new Date(stageEntry.date);
          const now = new Date();
          const days = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          totalDays += days;
          dealsWithHistory++;
        }
      });

      const avgDays = dealsWithHistory > 0 ? totalDays / dealsWithHistory : 0;

      metrics.push({
        stage,
        count: stageDeals.length,
        value: totalValue,
        avgDays: Math.round(avgDays),
        color: STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]?.color || '#F5F5F5'
      });
    });

    setStageMetrics(metrics);

    // Calculate conversion rates (simplified)
    const watching = dealsList.filter(d => d.currentStage === 'WATCHING').length || 1;
    const analyzing = dealsList.filter(d => d.currentStage === 'ANALYZING').length;
    const negotiating = dealsList.filter(d => d.currentStage === 'NEGOTIATING').length;
    const contract = dealsList.filter(d => d.currentStage === 'UNDER_CONTRACT').length;
    const closed = dealsList.filter(d => d.currentStage === 'CLOSED').length;

    setConversionRates({
      watchToAnalyze: Math.round((analyzing / watching) * 100),
      analyzeToNegotiate: Math.round((negotiating / (analyzing || 1)) * 100),
      negotiateToContract: Math.round((contract / (negotiating || 1)) * 100),
      contractToClose: Math.round((closed / (contract || 1)) * 100)
    });
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <AppleCard padding="large">
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </AppleCard>
    );
  }

  // Calculate total pipeline value
  const totalPipelineValue = stageMetrics
    .filter(m => !['CLOSED', 'LOST'].includes(m.stage))
    .reduce((sum, m) => sum + m.value, 0);

  const activeDealsCount = stageMetrics
    .filter(m => !['CLOSED', 'LOST'].includes(m.stage))
    .reduce((sum, m) => sum + m.count, 0);

  return (
    <AppleCard padding="large">
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              Your Deal Pipeline
            </Typography>
            <Tooltip
              title="Stay organized with all your deals in one place. Track where each property stands and see conversion rates from initial screening to contract."
              placement="top"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${activeDealsCount} Active Deals`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={formatCurrency(totalPipelineValue)}
              color="success"
              variant="filled"
            />
          </Box>
        </Box>
      </Box>

      {/* Pipeline Stages Visualization */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, mb: 3 }}>
          {stageMetrics.map((metric) => {
            const config = STAGE_CONFIG[metric.stage as keyof typeof STAGE_CONFIG];
            const isInactive = ['CLOSED', 'LOST'].includes(metric.stage);

            return (
              <Box
                key={metric.stage}
                sx={{
                  backgroundColor: config.color,
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  opacity: isInactive ? 0.7 : 1,
                  position: 'relative'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: config.textColor,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  {config.label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: config.textColor,
                    fontWeight: 700,
                    my: 1
                  }}
                >
                  {metric.count}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: config.textColor }}
                >
                  {formatCurrency(metric.value)}
                </Typography>
                {metric.avgDays > 0 && !isInactive && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TimerIcon sx={{ fontSize: 14, color: config.textColor, mr: 0.5 }} />
                    <Typography variant="caption" sx={{ color: config.textColor }}>
                      {metric.avgDays}d avg
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Conversion Funnel */}
        <Box sx={{ px: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Conversion Rates
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {Object.entries(conversionRates).map(([key, rate]) => {
              const labels: { [key: string]: string } = {
                watchToAnalyze: 'Watch → Analyze',
                analyzeToNegotiate: 'Analyze → Negotiate',
                negotiateToContract: 'Negotiate → Contract',
                contractToClose: 'Contract → Close'
              };

              const isLow = rate < 30;
              const isHigh = rate > 70;

              return (
                <Box key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {labels[key]}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color={isLow ? 'error.main' : isHigh ? 'success.main' : 'text.primary'}
                    >
                      {rate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={rate}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: isLow ? 'error.main' : isHigh ? 'success.main' : 'primary.main',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Alerts Section */}
      {activeDealsCount > 10 && (
        <Box sx={{
          backgroundColor: 'warning.light',
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center'
        }}>
          <WarningIcon sx={{ color: 'warning.dark', mr: 2 }} />
          <Typography variant="body2" color="warning.dark">
            You have {activeDealsCount} active deals. Consider focusing on high-quality opportunities to maintain pipeline velocity.
          </Typography>
        </Box>
      )}
    </AppleCard>
  );
};

export default memo(PipelineHealthMonitor);