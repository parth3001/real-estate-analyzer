import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  Psychology,
  Assessment
} from '@mui/icons-material';

interface AIInsights {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  investmentScore?: number | null;
  riskAssessment?: string;
  marketTrendPrediction?: string;
  optimalExitStrategy?: string | { [key: string]: any };
  recommendedHoldPeriod?: string;
  investorFit?: string;
  strategicInsights?: string;
  strategicAnalysis?: string; // NEW: Single comprehensive analysis
  competitiveAdvantage?: string;
  wealthBuildingPotential?: string;
  marketCycleAnalysis?: string;
  financingRecommendations?: string;
  portfolioFitAnalysis?: string;
  opportunityCostAnalysis?: string;
  notes?: string;
  valueAddOpportunities?: any[];
  boldPredictions?: any;
  scoreBreakdown?: {
    cashFlow?: {
      score: number;
      max: number;
      reason: string;
    };
    marketPosition?: {
      score: number;
      max: number;
      reason: string;
    };
    riskAssessment?: {
      score: number;
      max: number;
      reason: string;
    };
    financialMetrics?: {
      score: number;
      max: number;
      reason: string;
    };
  };
}

interface EnhancedAIAnalysisProps {
  aiInsights: AIInsights;
  propertyData?: {
    propertyName?: string;
    propertyAddress?: {
      city?: string;
      state?: string;
    };
  };
}

export const EnhancedAIAnalysis: React.FC<EnhancedAIAnalysisProps> = ({
  aiInsights
}) => {
  // Simple formatting that removes markdown and preserves content
  const formatAIText = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      let text = String(value);
      
      // Remove ALL markdown formatting (bold, italic, etc)
      text = text.replace(/\*\*/g, '');
      text = text.replace(/\*/g, '');
      text = text.replace(/_{1,2}/g, '');
      
      // Clean up excessive line breaks
      text = text.replace(/\n{3,}/g, '\n\n');
      
      // Trim
      text = text.trim();
      
      return text;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => formatAIText(item)).filter(item => item).join('\n');
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Investment';
    if (score >= 60) return 'Good Investment';
    if (score >= 40) return 'Fair Investment';
    return 'Risky Investment';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Psychology sx={{ mr: 1 }} />
        AI Investment Analysis
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row - Investment Score and Score Breakdown */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '33%' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Investment Score</Typography>
                </Box>
                
                <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: `conic-gradient(
                        ${getScoreColor(aiInsights.investmentScore || 0)}.main ${(aiInsights.investmentScore || 0) * 3.6}deg,
                        #e0e0e0 0deg
                      )`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        backgroundColor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      top: '50%',
                      left: '50%',
                      transform: 'translateX(-50%) translateY(-50%)',
                    }}
                  >
                    <Typography variant="h4" color={`${getScoreColor(aiInsights.investmentScore || 0)}.main`}>
                      {aiInsights.investmentScore || 0}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                  {typeof aiInsights.investmentScore === 'number' ? `${aiInsights.investmentScore}/100` : 'Score unavailable'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Chip 
                    label={getScoreLabel(aiInsights.investmentScore || 0)}
                    color={getScoreColor(aiInsights.investmentScore || 0)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Score Breakdown</Typography>
                </Box>
                
                {/* 2x2 Grid Layout for Score Breakdown */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {[
                    { 
                      label: 'Cash Flow Score', 
                      score: aiInsights.scoreBreakdown?.cashFlow?.score || 0, 
                      maxScore: aiInsights.scoreBreakdown?.cashFlow?.max || 100,
                      description: aiInsights.scoreBreakdown?.cashFlow?.reason || 'Based on monthly and annual cash flow projections'
                    },
                    { 
                      label: 'Market Position', 
                      score: aiInsights.scoreBreakdown?.marketPosition?.score || 0, 
                      maxScore: aiInsights.scoreBreakdown?.marketPosition?.max || 100,
                      description: aiInsights.scoreBreakdown?.marketPosition?.reason || 'Property positioning relative to local market'
                    },
                    { 
                      label: 'Risk Assessment', 
                      score: aiInsights.scoreBreakdown?.riskAssessment?.score || 0, 
                      maxScore: aiInsights.scoreBreakdown?.riskAssessment?.max || 100,
                      description: aiInsights.scoreBreakdown?.riskAssessment?.reason || 'Overall investment risk profile analysis'
                    },
                    { 
                      label: 'Financial Metrics', 
                      score: aiInsights.scoreBreakdown?.financialMetrics?.score || 0, 
                      maxScore: aiInsights.scoreBreakdown?.financialMetrics?.max || 100,
                      description: aiInsights.scoreBreakdown?.financialMetrics?.reason || 'Cap rate, ROI, and other key financial indicators'
                    }
                  ].map((metric) => (
                    <Box key={metric.label} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {metric.label}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={getScoreColor((metric.score / metric.maxScore) * 100)}>
                          {metric.score}/{metric.maxScore}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(metric.score / metric.maxScore) * 100}
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          mb: 0.5,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: `${getScoreColor((metric.score / metric.maxScore) * 100)}.main`
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                        {metric.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Strategic AI Analysis - Single Comprehensive Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Psychology sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Strategic AI Analysis</Typography>
            </Box>
            
            {/* Display the complete AI analysis with proper formatting */}
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.8,
                color: 'text.primary',
                fontWeight: 'normal'
              }}
            >
              {formatAIText(aiInsights.strategicAnalysis || aiInsights.strategicInsights || aiInsights.summary)}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};