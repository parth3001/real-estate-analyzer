// Apple-Style Dashboard Home Page
// Comprehensive dashboard with action cards, recent analyses, and market trends

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  Chip,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  BookmarkBorder as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  AutoAwesome as AIIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppleButton, AppleCard, AppleMetricCard } from '../components/ui/AppleComponents';
import { ConfidenceIndicator } from '../components/ui/ConfidenceIndicator';
import { propertyApi } from '../services/api';

// Dashboard data interfaces
interface RecentAnalysis {
  id: string;
  address: string;
  type: 'SFR' | 'MF';
  date: string;
  status: 'completed' | 'in-progress' | 'saved';
  aiScore?: number;
  monthlyFlow?: number;
  capRate?: number;
  confidence?: {
    level: 1 | 2 | 3;
    source: string;
  };
}

interface MarketTrend {
  metric: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ComponentType;
  color: string;
  change?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [savedPropertiesCount, setSavedPropertiesCount] = useState(0);

  // Calculate investment insights level for saved properties
  const calculateSavedPropertyInsightsLevel = (property: any): 1 | 2 | 3 => {
    // Check if backend confidence level is available
    if (property.confidence?.level) {
      return property.confidence.level as 1 | 2 | 3;
    }
    
    // Fallback calculation based on property analysis data
    // Level 3: Full analysis with complete metrics and AI insights
    if (property.analysis?.investmentDecision?.professionalAssessment?.dealQuality &&
        property.analysis?.cashFlow?.monthlyCashFlow !== undefined &&
        property.analysis?.keyMetrics?.capRate &&
        property.analysis?.aiEnhancedInsights) {
      return 3;
    }
    
    // Level 2: Basic analysis with some key metrics
    if (property.analysis?.cashFlow?.monthlyCashFlow !== undefined ||
        property.analysis?.keyMetrics?.capRate ||
        property.analysis?.investmentDecision?.professionalAssessment?.dealQuality) {
      return 2;
    }
    
    // Level 1: Basic property info only
    return 1;
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load saved properties
      const propertiesResponse = await propertyApi.getAllProperties();
      if (propertiesResponse.status === 200 && Array.isArray(propertiesResponse.data)) {
        const properties = propertiesResponse.data;
        setSavedPropertiesCount(properties.length);
        
        // Convert saved properties to recent analyses format
        const analyses: RecentAnalysis[] = properties.slice(0, 3).map((prop: any) => {
          const confidenceLevel = calculateSavedPropertyInsightsLevel(prop);
          return {
            id: prop._id,
            address: prop.propertyAddress ? 
              `${prop.propertyAddress.street || ''}, ${prop.propertyAddress.city || ''}, ${prop.propertyAddress.state || ''}` : 
              prop.propertyName || 'Unknown Property',
            type: prop.propertyType || 'SFR',
            date: prop.updatedAt || prop.createdAt,
            status: 'completed',
            aiScore: prop.analysis?.investmentDecision?.professionalAssessment?.dealQuality || undefined,
            monthlyFlow: prop.analysis?.cashFlow?.monthlyCashFlow || undefined,
            capRate: prop.analysis?.keyMetrics?.capRate ? prop.analysis.keyMetrics.capRate : undefined,
            confidence: {
              level: confidenceLevel,
              source: 'Direct Analysis'
            }
          };
        });
        
        setRecentAnalyses(analyses);
        
        // Calculate average AI score
        const totalAnalyses = properties.length;
        const avgAiScore = properties.reduce((sum: number, prop: any) => {
          return sum + (prop.analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0);
        }, 0) / (totalAnalyses || 1);
        
        // Find best cap rate
        const bestCapRate = properties.reduce((best: number, prop: any) => {
          const capRate = prop.analysis?.keyMetrics?.capRate || 0;
          return capRate > best ? capRate : best;
        }, 0);
        
        setQuickStats([
          { label: 'Total Analyses', value: totalAnalyses.toString(), icon: AnalyticsIcon, color: 'primary.500' },
          { label: 'Saved Properties', value: properties.length.toString(), icon: BookmarkIcon, color: 'success.500', change: 0 },
          { label: 'Avg. Deal Quality', value: Math.round(avgAiScore).toString(), icon: AIIcon, color: 'purple.500', change: 0 },
          { label: 'Best Cap Rate', value: `${bestCapRate.toFixed(2)}%`, icon: TrendingUpIcon, color: 'warning.500' }
        ]);
      }
      
      // Load market trends (mocked for now - can be replaced with actual API)
      setMarketTrends([
        { metric: 'Interest Rates', value: '7.125%', change: 0.25, trend: 'up' },
        { metric: 'Median Home Price', value: '$425k', change: 3.2, trend: 'up' },
        { metric: 'Rental Yields', value: '6.8%', change: -0.5, trend: 'down' },
        { metric: 'Days on Market', value: '28 days', change: -12, trend: 'down' }
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setQuickStats([
        { label: 'Total Analyses', value: '0', icon: AnalyticsIcon, color: 'primary.500' },
        { label: 'Saved Properties', value: '0', icon: BookmarkIcon, color: 'success.500' },
        { label: 'Avg. Deal Quality', value: '0', icon: AIIcon, color: 'purple.500' },
        { label: 'Best Cap Rate', value: '0%', icon: TrendingUpIcon, color: 'warning.500' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome Section
  const WelcomeSection = () => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
        Welcome back, {user?.firstName || 'Investor'}! 👋
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Ready to analyze your next investment opportunity? Start with one of the options below.
      </Typography>

      <Box
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            🚀 New Feature: AI-Powered Market Insights
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            Get intelligent recommendations based on current market conditions and comparable sales data.
          </Typography>
          <AppleButton
            variant="secondary"
            onClick={() => navigate('/market-data')}
          >
            Explore Market Data
          </AppleButton>
        </Box>
        
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            right: -50,
            top: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }}
        />
      </Box>
    </Box>
  );

  // Quick Action Cards
  const QuickActionCards = () => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Start New Analysis
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* SFR Analysis */}
        <Box>
          <AppleCard
            hover
            padding="large"
          >
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  backgroundColor: 'primary.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HomeIcon sx={{ fontSize: 28, color: 'primary.600' }} />
              </Box>
              
              <Chip
                label="Most Popular"
                size="small"
                sx={{
                  backgroundColor: 'success.100',
                  color: 'success.700',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Single-Family Rental
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Analyze single-family properties with detailed financial projections, 
              cash flow analysis, and AI-powered insights.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Features included:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {['Smart Wizard', 'AI Scoring', 'Market Data', '10-Year Projections'].map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '10px' }}
                  />
                ))}
              </Box>
            </Box>

            <AppleButton
              variant="primary"
              fullWidth
              onClick={() => navigate('/sfr-analysis')}
              icon={<ArrowForwardIcon />}
            >
              Start SFR Analysis
            </AppleButton>
          </AppleCard>
        </Box>

        {/* Multi-Family Analysis */}
        <Box>
          <AppleCard
            hover
            padding="large"
          >
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  backgroundColor: 'purple.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ApartmentIcon sx={{ fontSize: 28, color: 'purple.600' }} />
              </Box>
              
              <Chip
                label="Advanced"
                size="small"
                sx={{
                  backgroundColor: 'purple.100',
                  color: 'purple.700',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Multi-Family Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Evaluate apartment buildings and multi-unit properties with 
              unit mix optimization and detailed ROI calculations.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Features included:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {['Unit Mix Analysis', 'Bulk Discounts', 'Vacancy Modeling', 'Cap Ex Planning'].map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '10px' }}
                  />
                ))}
              </Box>
            </Box>

            <AppleButton
              variant="secondary"
              fullWidth
              onClick={() => navigate('/mf-analysis')}
              icon={<ArrowForwardIcon />}
            >
              Start MF Analysis
            </AppleButton>
          </AppleCard>
        </Box>

        {/* Quick Actions Row */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <Box>
              <AppleCard 
                hover 
                padding="medium"
                onClick={() => navigate('/saved-properties')}
              >
                <Box display="flex" alignItems="center">
                  <BookmarkIcon sx={{ color: 'warning.500', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Saved Properties
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {savedPropertiesCount} properties saved
                    </Typography>
                  </Box>
                </Box>
              </AppleCard>
            </Box>
            
            <Box>
              <AppleCard 
                hover 
                padding="medium"
                onClick={() => navigate('/market-data')}
              >
                <Box display="flex" alignItems="center">
                  <AssessmentIcon sx={{ color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Market Intelligence
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Latest trends & data
                    </Typography>
                  </Box>
                </Box>
              </AppleCard>
            </Box>
            
            <Box>
              <AppleCard 
                hover 
                padding="medium"
                onClick={() => navigate('/sfr-analysis')}
              >
                <Box display="flex" alignItems="center">
                  <AIIcon sx={{ color: 'purple.500', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      AI Insights
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Smart recommendations
                    </Typography>
                  </Box>
                </Box>
              </AppleCard>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Quick Stats Section
  const QuickStatsSection = () => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Your Investment Dashboard
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 3 }}>
        {quickStats.map((stat, index) => (
          <Box key={index}>
            <AppleMetricCard
              label={stat.label}
              value={stat.value}
              icon={React.createElement(stat.icon)}
              trend={stat.change}
              size="small"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );

  // Recent Analyses Section
  const RecentAnalysesSection = () => (
    <Box sx={{ mb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Recent Analyses
        </Typography>
        <AppleButton
          variant="ghost"
          size="small"
          onClick={() => navigate('/saved-properties')}
        >
          View All
        </AppleButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Box key={index}>
              <Card sx={{ borderRadius: '16px', p: 2 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
                <Box display="flex" gap={1} mb={2}>
                  <Skeleton variant="rounded" width={60} height={20} />
                  <Skeleton variant="rounded" width={60} height={20} />
                </Box>
                <Skeleton variant="rounded" width="100%" height={32} />
              </Card>
            </Box>
          ))
        ) : recentAnalyses.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <AppleCard padding="large">
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No analyses yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start your first property analysis to see it appear here
                </Typography>
                <AppleButton
                  variant="primary"
                  onClick={() => navigate('/sfr-analysis')}
                >
                  Start First Analysis
                </AppleButton>
              </Box>
            </AppleCard>
          </Box>
        ) : (
          recentAnalyses.map((analysis) => (
            <Box key={analysis.id}>
              <AppleCard hover padding="medium">
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                      {analysis.address}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                      <Chip
                        label={analysis.type}
                        size="small"
                        sx={{
                          backgroundColor: analysis.type === 'SFR' ? 'primary.100' : 'purple.100',
                          color: analysis.type === 'SFR' ? 'primary.700' : 'purple.700',
                          fontSize: '10px'
                        }}
                      />
                      <Chip
                        label={analysis.status}
                        size="small"
                        sx={{
                          backgroundColor: 
                            analysis.status === 'completed' ? 'success.100' : 
                            analysis.status === 'in-progress' ? 'warning.100' : 'grey.100',
                          color: 
                            analysis.status === 'completed' ? 'success.700' : 
                            analysis.status === 'in-progress' ? 'warning.700' : 'grey.700',
                          fontSize: '10px'
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {analysis.confidence && (
                      <ConfidenceIndicator
                        level={analysis.confidence.level}
                        size="small"
                        source={analysis.confidence.source}
                      />
                    )}
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {analysis.status === 'completed' && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                      {analysis.aiScore !== undefined && (
                        <Box>
                          <Box textAlign="center">
                            <Typography variant="h6" fontWeight={600} color="primary.600">
                              {analysis.aiScore}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Deal Quality
                            </Typography>
                            {analysis.confidence?.level === 3 && (
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.6rem',
                                color: 'text.secondary',
                                display: 'block',
                                mt: 0.25
                              }}>
                                ●●● Complete
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      {analysis.monthlyFlow !== undefined && (
                        <Box>
                          <Box textAlign="center">
                            <Typography variant="h6" fontWeight={600} color="success.600">
                              ${Math.round(analysis.monthlyFlow)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Cash Flow
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {analysis.capRate !== undefined && (
                        <Box>
                          <Box textAlign="center">
                            <Typography variant="h6" fontWeight={600} color="warning.600">
                              {analysis.capRate.toFixed(2)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Cap Rate
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                <AppleButton
                  variant="ghost"
                  size="small"
                  fullWidth
                  onClick={() => navigate(`/${analysis.type.toLowerCase()}-analysis?id=${analysis.id}`)}
                >
                  {analysis.status === 'completed' ? 'View Analysis' : 'Continue Analysis'}
                </AppleButton>
              </AppleCard>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );

  // Market Trends Section
  const MarketTrendsSection = () => (
    <Box>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Market Trends
      </Typography>
      
      <AppleCard padding="large">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          {marketTrends.map((trend, index) => (
            <Box key={index}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                  {trend.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {trend.metric}
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    color: trend.trend === 'up' ? 'success.600' : 
                           trend.trend === 'down' ? 'error.600' : 'grey.600'
                  }}
                >
                  {trend.trend === 'up' ? (
                    <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  ) : trend.trend === 'down' ? (
                    <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  ) : null}
                  <Typography variant="caption" fontWeight={500}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </AppleCard>
    </Box>
  );

  return (
    <Box sx={{ backgroundColor: 'grey.50', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <WelcomeSection />
          <QuickActionCards />
          <QuickStatsSection />
          <RecentAnalysesSection />
          <MarketTrendsSection />
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;