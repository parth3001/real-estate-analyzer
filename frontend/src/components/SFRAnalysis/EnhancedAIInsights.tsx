import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  Rating,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  useTheme,
  GridLegacy as Grid
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import type { AIInsights, ValueAddOpportunity } from '../../types/analysis';

// Helper functions for formatting
const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(1)}%`;
};

const formatDecimal = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(2);
};

interface AIInsightsProps {
  aiInsights: AIInsights;
  formatInsightText: (text: string) => React.ReactNode;
}

const EnhancedAIInsights: React.FC<AIInsightsProps> = ({ aiInsights, formatInsightText }) => {
  const theme = useTheme();
  
  if (!aiInsights) {
    return <Typography>No AI insights available</Typography>;
  }

  // Helper function to render a section if the data exists
  const renderSection = (title: string, content?: string) => {
    if (!content) return null;
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body1">{formatInsightText(content)}</Typography>
        </Paper>
      </Box>
    );
  };

  // Helper to get color for investment score
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.success.light;
    if (score >= 40) return theme.palette.warning.main;
    if (score >= 20) return theme.palette.warning.dark;
    return theme.palette.error.main;
  };

  // Helper to get label for investment score
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    if (score >= 20) return "Below Average";
    return "Poor";
  };

  // Helper to render difficulty level
  const renderDifficultyLevel = (difficulty?: string) => {
    if (!difficulty) return null;
    
    const color = 
      difficulty.toLowerCase() === 'easy' ? theme.palette.success.main :
      difficulty.toLowerCase() === 'medium' ? theme.palette.warning.main :
      theme.palette.error.main;
    
    return (
      <Chip 
        size="small" 
        label={difficulty} 
        sx={{ 
          backgroundColor: color,
          color: theme.palette.getContrastText(color),
          fontWeight: 'bold'
        }} 
      />
    );
  };

  // Helper to render priority level
  const renderPriorityLevel = (priority?: string) => {
    if (!priority) return null;
    
    const color = 
      priority.toLowerCase() === 'low' ? theme.palette.info.main :
      priority.toLowerCase() === 'medium' ? theme.palette.warning.main :
      theme.palette.error.main;
    
    return (
      <Chip 
        size="small" 
        icon={priority.toLowerCase() === 'high' ? <PriorityHighIcon /> : undefined}
        label={priority} 
        sx={{ 
          backgroundColor: color,
          color: theme.palette.getContrastText(color),
          fontWeight: 'bold'
        }} 
      />
    );
  };

  // Helper to render value-add opportunities
  const renderValueAddOpportunities = () => {
    if (!aiInsights.valueAddOpportunities || !Array.isArray(aiInsights.valueAddOpportunities) || aiInsights.valueAddOpportunities.length === 0) {
      return null;
    }

    if (typeof aiInsights.valueAddOpportunities[0] === 'string') {
      return (
        <Box>
          {(aiInsights.valueAddOpportunities as string[]).map((opportunity, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              • {formatInsightText(opportunity)}
            </Box>
          ))}
        </Box>
      );
    }

    // Enhanced display for value-add opportunities
    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Improvement</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estimated Cost</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Potential ROI</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rent Increase</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Value Increase</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Difficulty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(aiInsights.valueAddOpportunities as ValueAddOpportunity[]).map((opportunity, index) => (
              <TableRow key={index} hover>
                <TableCell>{opportunity.improvement}</TableCell>
                <TableCell>{opportunity.estimatedCost}</TableCell>
                <TableCell>{opportunity.potentialRoiPercent}</TableCell>
                <TableCell>{opportunity.rentIncreasePotential}</TableCell>
                <TableCell>{opportunity.valueIncreasePotential}</TableCell>
                <TableCell>{renderDifficultyLevel(opportunity.implementationDifficulty)}</TableCell>
                <TableCell>{renderPriorityLevel(opportunity.strategicPriority)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderLeft: `4px solid ${getScoreColor(aiInsights.investmentScore || 0)}`,
          backgroundColor: theme.palette.grey[50]
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">Executive Summary</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{formatInsightText(aiInsights.summary || 'No summary available')}</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant="h6" gutterBottom>Investment Score</Typography>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={aiInsights.investmentScore || 0} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[300],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(aiInsights.investmentScore || 0)
                        }
                      }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="h4" color={getScoreColor(aiInsights.investmentScore || 0)}>
                      {aiInsights.investmentScore || 0}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" align="center" fontWeight="bold" color={getScoreColor(aiInsights.investmentScore || 0)}>
                  {getScoreLabel(aiInsights.investmentScore || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recommended Hold Period</Typography>
                <Typography variant="h5" align="center" fontWeight="bold">
                  {aiInsights.recommendedHoldPeriod || 'Not specified'}
                </Typography>
                {aiInsights.optimalExitStrategy && (
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {aiInsights.optimalExitStrategy.split('.')[0]}.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {renderSection('Investor Fit', aiInsights.investorFit)}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Investment Strengths</Typography>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderLeft: `4px solid ${theme.palette.success.main}` }}>
            {Array.isArray(aiInsights.strengths) && aiInsights.strengths.length > 0 ? (
              aiInsights.strengths.map((strength, index) => (
                <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 1, mt: 0.3 }} fontSize="small" />
                  <Typography>{formatInsightText(strength)}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2">No strengths available</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Investment Weaknesses</Typography>
          <Paper variant="outlined" sx={{ p: 2, height: '100%', borderLeft: `4px solid ${theme.palette.error.main}` }}>
            {Array.isArray(aiInsights.weaknesses) && aiInsights.weaknesses.length > 0 ? (
              aiInsights.weaknesses.map((weakness, index) => (
                <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, mr: 1, mt: 0.3 }} fontSize="small" />
                  <Typography>{formatInsightText(weakness)}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2">No weaknesses available</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Strategic Insights Section */}
      {renderSection('Strategic Insights', aiInsights.strategicInsights)}

      {/* Risk Assessment Section */}
      {aiInsights.riskAssessment && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <Typography variant="body1">{formatInsightText(aiInsights.riskAssessment)}</Typography>
          </Paper>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h5" gutterBottom>Strategic Analysis</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {renderSection('Competitive Advantage', aiInsights.competitiveAdvantage)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSection('Wealth Building Potential', aiInsights.wealthBuildingPotential)}
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {renderSection('Market Cycle Analysis', aiInsights.marketCycleAnalysis)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSection('Opportunity Cost Analysis', aiInsights.opportunityCostAnalysis)}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>Recommendations</Typography>

      {/* Recommendations Section */}
      <Box sx={{ mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {Array.isArray(aiInsights.recommendations) && aiInsights.recommendations.length > 0 ? (
            aiInsights.recommendations.map((rec, index) => (
              <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
                <CheckCircleIcon sx={{ color: theme.palette.info.main, mr: 1, mt: 0.3 }} fontSize="small" />
                <Typography>{formatInsightText(rec)}</Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2">No recommendations available</Typography>
          )}
        </Paper>
      </Box>

      {/* Financing Recommendations Section */}
      {renderSection('Financing Recommendations', aiInsights.financingRecommendations)}

      {/* Portfolio Fit Analysis Section */}
      {renderSection('Portfolio Fit Analysis', aiInsights.portfolioFitAnalysis)}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>Future Outlook</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {renderSection('Market Trend Prediction', aiInsights.marketTrendPrediction)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSection('Optimal Exit Strategy', aiInsights.optimalExitStrategy)}
        </Grid>
      </Grid>

      {/* Value-Add Opportunities Section */}
      {aiInsights.valueAddOpportunities && Array.isArray(aiInsights.valueAddOpportunities) && aiInsights.valueAddOpportunities.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>Value-Add Opportunities</Typography>
          {renderValueAddOpportunities()}
        </>
      )}

      {/* Additional Notes Section */}
      {renderSection('Additional Notes', aiInsights.notes)}
    </Box>
  );
};

export default EnhancedAIInsights;
