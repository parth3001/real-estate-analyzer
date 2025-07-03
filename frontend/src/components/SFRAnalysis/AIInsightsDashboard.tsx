import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  LinearProgress,
  GridLegacy as Grid,
  useTheme,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { AIInsights } from '../../types/analysis';

interface AIInsightsDashboardProps {
  aiInsights: AIInsights;
  formatInsightText: (text: string) => React.ReactNode;
}

const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({ aiInsights, formatInsightText }) => {
  const theme = useTheme();
  
  if (!aiInsights) {
    return <Typography>No AI insights available</Typography>;
  }

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

  return (
    <Box>
      {/* Executive Summary Card */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 0, 
          mb: 4, 
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: getScoreColor(aiInsights.investmentScore || 0),
          color: '#fff'
        }}>
          <Typography variant="h5" fontWeight="bold">Investment Analysis</Typography>
          <Typography variant="subtitle1">Executive Summary</Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {formatInsightText(aiInsights.summary || 'No summary available')}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  avatar={
                    <Avatar sx={{ bgcolor: getScoreColor(aiInsights.investmentScore || 0) }}>
                      <StarIcon />
                    </Avatar>
                  }
                  title="Investment Score"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h2" color={getScoreColor(aiInsights.investmentScore || 0)} fontWeight="bold">
                      {aiInsights.investmentScore || 0}
                    </Typography>
                    <Typography variant="subtitle1" color={getScoreColor(aiInsights.investmentScore || 0)}>
                      {getScoreLabel(aiInsights.investmentScore || 0)}
                    </Typography>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiInsights.investmentScore || 0} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 5,
                          backgroundColor: theme.palette.grey[300],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getScoreColor(aiInsights.investmentScore || 0)
                          }
                        }} 
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardHeader 
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <AccessTimeIcon />
                    </Avatar>
                  }
                  title="Hold Period Recommendation"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {aiInsights.recommendedHoldPeriod || 'Not specified'}
                    </Typography>
                    {aiInsights.optimalExitStrategy && (
                      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        {aiInsights.optimalExitStrategy.split('.')[0]}.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Strengths and Weaknesses */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <TrendingUpIcon />
                </Avatar>
              }
              title="Investment Strengths"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Tooltip title="Key advantages of this investment">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              {Array.isArray(aiInsights.strengths) && aiInsights.strengths.length > 0 ? (
                aiInsights.strengths.map((strength, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1, mt: 0.3 }} fontSize="small" />
                    <Typography variant="body2">{formatInsightText(strength)}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">No strengths available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardHeader 
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <TrendingDownIcon />
                </Avatar>
              }
              title="Investment Weaknesses"
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Tooltip title="Key risks and concerns">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              {Array.isArray(aiInsights.weaknesses) && aiInsights.weaknesses.length > 0 ? (
                aiInsights.weaknesses.map((weakness, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                    <WarningIcon sx={{ color: theme.palette.error.main, mr: 1, mt: 0.3 }} fontSize="small" />
                    <Typography variant="body2">{formatInsightText(weakness)}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">No weaknesses available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Strategic Analysis */}
      <Paper elevation={2} sx={{ p: 0, mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: theme.palette.primary.main,
          color: '#fff'
        }}>
          <Typography variant="h5" fontWeight="bold">Strategic Analysis</Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {aiInsights.strategicInsights && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Key Insights</Typography>
              <Typography variant="body2">{formatInsightText(aiInsights.strategicInsights)}</Typography>
            </Box>
          )}
          
          <Grid container spacing={3}>
            {aiInsights.competitiveAdvantage && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                        <EqualizerIcon />
                      </Avatar>
                    }
                    title="Competitive Advantage"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.competitiveAdvantage)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {aiInsights.wealthBuildingPotential && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                        <AccountBalanceIcon />
                      </Avatar>
                    }
                    title="Wealth Building Potential"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.wealthBuildingPotential)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {aiInsights.marketCycleAnalysis && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    title="Market Cycle Analysis"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.marketCycleAnalysis)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {aiInsights.opportunityCostAnalysis && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    title="Opportunity Cost Analysis"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.opportunityCostAnalysis)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
      
      {/* Recommendations */}
      <Paper elevation={2} sx={{ p: 0, mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: theme.palette.secondary.main,
          color: '#fff'
        }}>
          <Typography variant="h5" fontWeight="bold">Recommendations</Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {Array.isArray(aiInsights.recommendations) && aiInsights.recommendations.length > 0 ? (
            aiInsights.recommendations.map((rec, index) => (
              <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', p: 1, borderRadius: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <CheckCircleIcon sx={{ color: theme.palette.secondary.main, mr: 1, mt: 0.3 }} fontSize="small" />
                <Typography variant="body2">{formatInsightText(rec)}</Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2">No recommendations available</Typography>
          )}
          
          {aiInsights.financingRecommendations && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Financing Recommendations</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2">{formatInsightText(aiInsights.financingRecommendations)}</Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Risk Assessment */}
      {aiInsights.riskAssessment && (
        <Paper elevation={2} sx={{ p: 0, mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: theme.palette.warning.main,
            color: '#fff'
          }}>
            <Typography variant="h5" fontWeight="bold">Risk Assessment</Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Typography variant="body2">{formatInsightText(aiInsights.riskAssessment)}</Typography>
          </Box>
        </Paper>
      )}
      
      {/* Future Outlook */}
      <Paper elevation={2} sx={{ p: 0, mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: theme.palette.info.main,
          color: '#fff'
        }}>
          <Typography variant="h5" fontWeight="bold">Future Outlook</Typography>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {aiInsights.marketTrendPrediction && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    title="Market Trend Prediction"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.marketTrendPrediction)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {aiInsights.optimalExitStrategy && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardHeader 
                    title="Optimal Exit Strategy"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: 'bold' }}
                  />
                  <CardContent>
                    <Typography variant="body2">{formatInsightText(aiInsights.optimalExitStrategy)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
      
      {/* Additional Notes */}
      {aiInsights.notes && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Additional Notes</Typography>
          <Typography variant="body2">{formatInsightText(aiInsights.notes)}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AIInsightsDashboard; 