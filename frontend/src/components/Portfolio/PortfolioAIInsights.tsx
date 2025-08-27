import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Divider,
  Container
} from '@mui/material';
import { AutoAwesome, Refresh, TrendingUp, CompareArrows, Timeline } from '@mui/icons-material';
import { PortfolioAIApi } from '../../services/portfolioAIApi';
import type { AIInsightsState } from '../../services/portfolioAIApi';
import HealthCheckCard from './HealthCheckCard';
import PeerComparisonCard from './PeerComparisonCard';
import GoalPathCard from './GoalPathCard';

interface PortfolioAIInsightsProps {
  portfolioId: string;
  portfolioName: string;
}

const PortfolioAIInsights: React.FC<PortfolioAIInsightsProps> = ({
  portfolioId,
  portfolioName
}) => {
  const [insights, setInsights] = useState<AIInsightsState>({
    healthCheck: { data: null, loading: false, error: null },
    peerComparison: { data: null, loading: false, error: null },
    goalPath: { data: null, loading: false, error: null },
    comprehensive: { data: null, loading: false, error: null }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadInsights = async () => {
    setIsRefreshing(true);
    
    // Reset all loading states
    setInsights(prev => ({
      healthCheck: { ...prev.healthCheck, loading: true, error: null },
      peerComparison: { ...prev.peerComparison, loading: true, error: null },
      goalPath: { ...prev.goalPath, loading: true, error: null },
      comprehensive: { ...prev.comprehensive, loading: true, error: null }
    }));

    try {
      // Load all insights in parallel
      const results = await PortfolioAIApi.getAllInsightsIndividually(portfolioId);
      
      setInsights({
        healthCheck: {
          data: results.healthCheck,
          loading: false,
          error: results.errors.find(e => e.includes('Health Check')) || null
        },
        peerComparison: {
          data: results.peerComparison,
          loading: false,
          error: results.errors.find(e => e.includes('Peer Comparison')) || null
        },
        goalPath: {
          data: results.goalPath,
          loading: false,
          error: results.errors.find(e => e.includes('Goal Path')) || null
        },
        comprehensive: {
          data: null,
          loading: false,
          error: null
        }
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading AI insights:', error);
      
      // Set all to error state
      const errorMessage = error instanceof Error ? error.message : 'Failed to load insights';
      setInsights({
        healthCheck: { data: null, loading: false, error: errorMessage },
        peerComparison: { data: null, loading: false, error: errorMessage },
        goalPath: { data: null, loading: false, error: errorMessage },
        comprehensive: { data: null, loading: false, error: errorMessage }
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load insights on component mount
  useEffect(() => {
    loadInsights();
  }, [portfolioId]);

  const hasAnyData = insights.healthCheck.data || insights.peerComparison.data || insights.goalPath.data;
  const hasAnyErrors = insights.healthCheck.error || insights.peerComparison.error || insights.goalPath.error;
  const isAnyLoading = insights.healthCheck.loading || insights.peerComparison.loading || insights.goalPath.loading;

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesome sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              AI Portfolio Intelligence
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadInsights}
            disabled={isRefreshing}
            sx={{ minWidth: 120 }}
          >
            {isRefreshing ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Professional-grade insights for <strong>{portfolioName}</strong>
        </Typography>
        
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Loading State */}
      {isAnyLoading && !hasAnyData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Generating AI Insights...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This may take 30-60 seconds for comprehensive analysis
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {hasAnyErrors && !hasAnyData && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadInsights}
              disabled={isRefreshing}
            >
              Retry
            </Button>
          }
        >
          Failed to load AI insights. Please try again or contact support if the issue persists.
        </Alert>
      )}

      {/* Insights Grid */}
      {hasAnyData && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' }, gap: 4 }}>
          {/* Health Check Card */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Portfolio Health Check
              </Typography>
            </Box>
            {insights.healthCheck.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : insights.healthCheck.error ? (
              <Alert severity="error">
                {insights.healthCheck.error}
              </Alert>
            ) : insights.healthCheck.data ? (
              <HealthCheckCard insights={insights.healthCheck.data} />
            ) : (
              <Alert severity="info">
                No health check data available
              </Alert>
            )}
          </Box>

          {/* Peer Comparison Card */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CompareArrows sx={{ color: 'info.main', mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Peer Comparison
              </Typography>
            </Box>
            {insights.peerComparison.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : insights.peerComparison.error ? (
              <Alert severity="error">
                {insights.peerComparison.error}
              </Alert>
            ) : insights.peerComparison.data ? (
              <PeerComparisonCard insights={insights.peerComparison.data} />
            ) : (
              <Alert severity="info">
                No peer comparison data available
              </Alert>
            )}
          </Box>

          {/* Goal Achievement Path Card */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Timeline sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="h6" fontWeight="medium">
                Goal Achievement Path
              </Typography>
            </Box>
            {insights.goalPath.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : insights.goalPath.error ? (
              <Alert severity="error">
                {insights.goalPath.error}
              </Alert>
            ) : insights.goalPath.data ? (
              <GoalPathCard insights={insights.goalPath.data} />
            ) : (
              <Alert severity="info">
                No goal path data available
              </Alert>
            )}
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!hasAnyData && !isAnyLoading && !hasAnyErrors && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No AI insights available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Refresh" to generate comprehensive AI analysis for your portfolio
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default PortfolioAIInsights;