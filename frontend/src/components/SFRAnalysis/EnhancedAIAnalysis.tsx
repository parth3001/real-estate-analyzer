import React from 'react';
import {
  Box,
  Typography,
  GridLegacy as Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Warning,
  Lightbulb,
  ExpandMore,
  Star,
  Timeline,
  AccountBalance,
  Business,
  Psychology
} from '@mui/icons-material';
import type { AIInsights } from '../../types/analysis';

// Define proper TypeScript interfaces following architecture principles
interface EnhancedAIAnalysisProps {
  aiInsights: AIInsights;
  propertyData: {
    propertyName?: string;
    propertyAddress?: {
      city?: string;
      state?: string;
    };
  };
}

export const EnhancedAIAnalysis: React.FC<EnhancedAIAnalysisProps> = ({
  aiInsights,
  propertyData
}) => {
  // Error handling following architecture principles
  if (!aiInsights) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            AI Analysis Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enhanced AI analysis could not be generated for this property. 
            This may be due to insufficient data or API limitations.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Helper functions following architecture principles
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Investment';
    if (score >= 60) return 'Good Investment';
    if (score >= 40) return 'Fair Investment';
    return 'Challenging Investment';
  };

  const formatListItems = (items: string[]) => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 5); // Limit to 5 items for clean UI
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Enhanced AI Investment Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive analysis for {propertyData.propertyName || 'Property'} in{' '}
        {propertyData.propertyAddress?.city}, {propertyData.propertyAddress?.state}
      </Typography>

      <Grid container spacing={3}>
        {/* Investment Score Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Investment Score</Typography>
              </Box>
              
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={aiInsights.investmentScore || 0}
                  sx={{ 
                    height: 12, 
                    borderRadius: 6, 
                    width: 200,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: `${getScoreColor(aiInsights.investmentScore || 0)}.main`
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -25,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Typography variant="h4" color={`${getScoreColor(aiInsights.investmentScore || 0)}.main`}>
                    {aiInsights.investmentScore || 0}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 3 }}>
                {aiInsights.investmentScore ? `${aiInsights.investmentScore}/100` : 'Score unavailable'}
              </Typography>
              <Chip 
                label={getScoreLabel(aiInsights.investmentScore || 0)}
                color={getScoreColor(aiInsights.investmentScore || 0)}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Score Breakdown Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Score Breakdown</Typography>
              </Box>
              
              {/* Score metrics breakdown */}
              <Grid container spacing={2}>
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
                  <Grid item xs={12} sm={6} key={metric.label}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
                          height: 8, 
                          borderRadius: 4,
                          mb: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: `${getScoreColor((metric.score / metric.maxScore) * 100)}.main`
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {metric.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Executive Summary</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {aiInsights.summary || 'No summary available for this analysis.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Investment Strengths</Typography>
              </Box>
              <List dense>
                {formatListItems(aiInsights.strengths || []).map((strength, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Star sx={{ color: 'success.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strength}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              {(!aiInsights.strengths || aiInsights.strengths.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No specific strengths identified in this analysis.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Weaknesses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Areas of Concern</Typography>
              </Box>
              <List dense>
                {formatListItems(aiInsights.weaknesses || []).map((weakness, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={weakness}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              {(!aiInsights.weaknesses || aiInsights.weaknesses.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No specific concerns identified in this analysis.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Strategic Recommendations</Typography>
              </Box>
              <List>
                {formatListItems(aiInsights.recommendations || []).map((recommendation, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Lightbulb sx={{ color: 'info.main', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={recommendation}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              {(!aiInsights.recommendations || aiInsights.recommendations.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No specific recommendations provided in this analysis.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Analysis Sections */}
        {(aiInsights.strategicInsights || aiInsights.riskAssessment || aiInsights.investorFit) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timeline sx={{ mr: 1, color: 'primary.main' }} />
                  Advanced Strategic Analysis
                </Typography>

                {/* Strategic Insights */}
                {aiInsights.strategicInsights && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Strategic Insights</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {aiInsights.strategicInsights}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Risk Assessment */}
                {aiInsights.riskAssessment && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Risk Assessment</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {aiInsights.riskAssessment}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Investor Fit */}
                {aiInsights.investorFit && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Investor Profile Match</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {aiInsights.investorFit}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Market Cycle Analysis */}
                {aiInsights.marketCycleAnalysis && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Market Cycle Analysis</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {aiInsights.marketCycleAnalysis}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Financing Recommendations */}
                {aiInsights.financingRecommendations && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">Financing Optimization</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {aiInsights.financingRecommendations}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Exit Strategy and Hold Period */}
        {(aiInsights.optimalExitStrategy || aiInsights.recommendedHoldPeriod) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Exit Strategy</Typography>
                </Box>
                
                {aiInsights.recommendedHoldPeriod && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommended Hold Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aiInsights.recommendedHoldPeriod}
                    </Typography>
                  </Box>
                )}

                {aiInsights.optimalExitStrategy && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Exit Strategy Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aiInsights.optimalExitStrategy}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Portfolio Fit Analysis */}
        {aiInsights.portfolioFitAnalysis && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Portfolio Integration</Typography>
                </Box>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {aiInsights.portfolioFitAnalysis}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};