import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  Divider
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  TrendingUp as GrowthIcon,
  Security as SecurityIcon,
  MonetizationOn as MoneyIcon,
  LocationOn as LocationIcon,
  Timeline as GoalIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Lightbulb as InsightIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AppleButton, AppleCard } from '../ui/AppleComponents';
import { portfolioApi } from '../../services/api';

// Smart Action Cards Interfaces
interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  portfolioId?: string;
  portfolio?: string;
  actionSteps?: string[];
  expectedImpact?: string;
  timeframe?: string;
}

interface AIInsight {
  type: 'HEALTH_CHECK' | 'PEER_COMPARISON' | 'GOAL_PATH' | 'MARKET_OPPORTUNITY';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: 'risk' | 'opportunity' | 'optimization' | 'growth';
  metrics?: {
    label: string;
    value: string;
    trend?: number;
  }[];
}

interface SmartActionData {
  recommendations: Recommendation[];
  aiInsights: AIInsight[];
  totalActionableItems: number;
  highPriorityCount: number;
  lastUpdated: string;
}

const SmartActionCards: React.FC = () => {
  const navigate = useNavigate();
  const [actionData, setActionData] = useState<SmartActionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    loadSmartActions();
  }, []);

  const loadSmartActions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data which includes recommendations
      const response = await portfolioApi.getDashboardSummary();
      if (response.status === 200 && response.data.success) {
        const dashboardData = response.data;

        // Transform dashboard recommendations into smart actions
        const recommendations = dashboardData.recommendations || [];
        const aiInsights = generateAIInsights(dashboardData);

        setActionData({
          recommendations,
          aiInsights,
          totalActionableItems: recommendations.length + aiInsights.length,
          highPriorityCount: recommendations.filter((r: any) => r.priority === 'high').length,
          lastUpdated: dashboardData.lastUpdated
        });
      } else {
        throw new Error('Failed to load smart actions');
      }
    } catch (error: any) {
      console.error('Error loading smart actions:', error);
      setError(error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = (dashboardData: any): AIInsight[] => {
    const insights: AIInsight[] = [];
    const stats = dashboardData.quickStats;
    const health = dashboardData.portfolioHealth;

    // Portfolio Health Insight
    if (health?.monthlyNetCashFlow < 0) {
      insights.push({
        type: 'HEALTH_CHECK',
        title: 'Negative Cash Flow Detected',
        description: 'Your portfolio is currently generating negative monthly cash flow. Consider optimizing expenses or refinancing.',
        priority: 'high',
        actionable: true,
        category: 'risk',
        metrics: [
          { label: 'Monthly Cash Flow', value: formatCurrency(health.monthlyNetCashFlow), trend: -5 }
        ]
      });
    } else if (health?.monthlyNetCashFlow > 0 && health.monthlyNetCashFlow < 1000) {
      insights.push({
        type: 'HEALTH_CHECK',
        title: 'Low Cash Flow Opportunity',
        description: 'Your cash flow is positive but could be optimized. Consider rent increases or expense reduction.',
        priority: 'medium',
        actionable: true,
        category: 'optimization',
        metrics: [
          { label: 'Monthly Cash Flow', value: formatCurrency(health.monthlyNetCashFlow), trend: 2 }
        ]
      });
    }

    // Deal Quality Insight
    if (stats?.avgDealQuality && stats.avgDealQuality < 70) {
      insights.push({
        type: 'PEER_COMPARISON',
        title: 'Deal Quality Below Target',
        description: 'Your average deal quality is below the 70-point professional threshold. Focus on higher-quality opportunities.',
        priority: stats.avgDealQuality < 50 ? 'high' : 'medium',
        actionable: true,
        category: 'opportunity',
        metrics: [
          { label: 'Avg Deal Quality', value: `${stats.avgDealQuality}/100`, trend: -3 }
        ]
      });
    }

    // Growth Opportunity Insight
    if (stats?.totalProperties && stats.totalProperties >= 3 && health?.totalValue < 1000000) {
      insights.push({
        type: 'GOAL_PATH',
        title: 'Scale-Up Opportunity',
        description: 'With your current experience level, consider expanding to higher-value properties or different markets.',
        priority: 'medium',
        actionable: true,
        category: 'growth',
        metrics: [
          { label: 'Portfolio Value', value: formatCurrency(health.totalValue), trend: 8 },
          { label: 'Properties', value: stats.totalProperties.toString() }
        ]
      });
    }

    // Market Opportunity Insight (always show for engagement)
    insights.push({
      type: 'MARKET_OPPORTUNITY',
      title: 'Market Intelligence Available',
      description: 'Current market conditions present unique opportunities. Get personalized market insights for your investment strategy.',
      priority: 'low',
      actionable: true,
      category: 'opportunity'
    });

    return insights.slice(0, 3); // Limit to 3 insights for clean UI
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'DIVERSIFY':
      case 'CREATE_PORTFOLIO': return <LocationIcon sx={{ fontSize: 20 }} />;
      case 'OPTIMIZE':
      case 'REFINANCE': return <MoneyIcon sx={{ fontSize: 20 }} />;
      case 'GOAL_ALIGNMENT':
      case 'START_ANALYSIS': return <GoalIcon sx={{ fontSize: 20 }} />;
      default: return <StarIcon sx={{ fontSize: 20 }} />;
    }
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'risk': return <SecurityIcon sx={{ fontSize: 20, color: 'error.main' }} />;
      case 'opportunity': return <GrowthIcon sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'optimization': return <MoneyIcon sx={{ fontSize: 20, color: 'warning.main' }} />;
      case 'growth': return <StarIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
      default: return <InsightIcon sx={{ fontSize: 20 }} />;
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

  const handleInsightAction = (insight: AIInsight) => {
    switch (insight.type) {
      case 'HEALTH_CHECK':
        navigate('/portfolio');
        break;
      case 'PEER_COMPARISON':
      case 'GOAL_PATH':
        navigate('/portfolio');
        break;
      case 'MARKET_OPPORTUNITY':
        navigate('/sfr-analysis');
        break;
      default:
        console.log('Unknown insight type:', insight.type);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index}>
              <Skeleton variant="rounded" width="100%" height={200} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box sx={{ mb: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load smart recommendations: {error}
        </Alert>
        <AppleButton
          variant="primary"
          onClick={loadSmartActions}
          icon={<RefreshIcon />}
        >
          Retry
        </AppleButton>
      </Box>
    );
  }

  // No Actions State
  if (!actionData || (actionData.recommendations.length === 0 && actionData.aiInsights.length === 0)) {
    return (
      <Box sx={{ mb: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Smart Actions
          </Typography>
          <IconButton onClick={loadSmartActions} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        <AppleCard padding="large">
          <Box textAlign="center" py={4}>
            <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No actions available yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Complete your portfolio setup to receive personalized AI recommendations
            </Typography>
            <AppleButton
              variant="primary"
              onClick={() => navigate('/portfolio/create')}
              icon={<StarIcon />}
            >
              Complete Setup
            </AppleButton>
          </Box>
        </AppleCard>
      </Box>
    );
  }

  // Smart Actions Display
  return (
    <Box sx={{ mb: 6 }}>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Smart Actions
          </Typography>
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            <Badge
              badgeContent={actionData.highPriorityCount}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
            >
              <Chip
                label={`${actionData.totalActionableItems} recommendations`}
                size="small"
                icon={<AIIcon />}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontSize: '0.75rem',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Badge>
            <Typography variant="caption" color="text.secondary">
              AI-powered
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={loadSmartActions} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* AI Insights Cards */}
      {actionData.aiInsights.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            AI Insights
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
            {actionData.aiInsights.map((insight, index) => (
              <Box key={index}>
                <AppleCard hover padding="medium">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getInsightIcon(insight.category)}
                      <Chip
                        label={insight.priority}
                        size="small"
                        sx={{
                          backgroundColor: `${getPriorityColor(insight.priority)}20`,
                          color: getPriorityColor(insight.priority),
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleCardExpansion(`insight-${index}`)}
                    >
                      {expandedCard === `insight-${index}` ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {insight.description}
                  </Typography>

                  {/* Metrics */}
                  {insight.metrics && (
                    <Box sx={{ mb: 2 }}>
                      {insight.metrics.map((metric, metricIndex) => (
                        <Box
                          key={metricIndex}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {metric.label}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" fontWeight={600}>
                              {metric.value}
                            </Typography>
                            {metric.trend && (
                              <Typography
                                variant="caption"
                                color={metric.trend > 0 ? 'success.main' : 'error.main'}
                              >
                                {metric.trend > 0 ? '+' : ''}{metric.trend}%
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Collapse in={expandedCard === `insight-${index}`}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Category: {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                    </Typography>
                  </Collapse>

                  <AppleButton
                    variant="ghost"
                    size="small"
                    fullWidth
                    onClick={() => handleInsightAction(insight)}
                  >
                    Take Action
                  </AppleButton>
                </AppleCard>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Recommendations Section */}
      {actionData.recommendations.length > 0 && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Personalized Recommendations
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {actionData.recommendations.map((recommendation, index) => (
              <Box key={index}>
                <AppleCard hover padding="medium">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getRecommendationIcon(recommendation.action)}
                      <Chip
                        label={recommendation.priority}
                        size="small"
                        sx={{
                          backgroundColor: `${getPriorityColor(recommendation.priority)}20`,
                          color: getPriorityColor(recommendation.priority),
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                      {recommendation.portfolio && (
                        <Chip
                          label={recommendation.portfolio}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleCardExpansion(`rec-${index}`)}
                    >
                      {expandedCard === `rec-${index}` ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {recommendation.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {recommendation.description}
                  </Typography>

                  <Collapse in={expandedCard === `rec-${index}`}>
                    {recommendation.actionSteps && recommendation.actionSteps.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Action Steps:
                        </Typography>
                        <Stepper orientation="vertical" sx={{ pl: 0 }}>
                          {recommendation.actionSteps.slice(0, 3).map((step, stepIndex) => (
                            <Step key={stepIndex} active>
                              <StepLabel
                                icon={
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      backgroundColor: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Typography variant="caption" color="white" sx={{ fontSize: '0.6rem' }}>
                                      {stepIndex + 1}
                                    </Typography>
                                  </Box>
                                }
                              >
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                  {step}
                                </Typography>
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                    )}

                    {recommendation.expectedImpact && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Expected Impact:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          {recommendation.expectedImpact}
                        </Typography>
                      </Box>
                    )}
                  </Collapse>

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
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Last Updated */}
      <Box textAlign="center" sx={{ mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(actionData.lastUpdated).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default SmartActionCards;