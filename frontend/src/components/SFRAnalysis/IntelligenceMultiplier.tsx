import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Tooltip,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  CompareArrows as CompareIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useDualMode } from '../../contexts/DualModeContext';

interface IntelligenceMultiplierProps {
  aiInsights: any;
}

const IntelligenceMultiplier: React.FC<IntelligenceMultiplierProps> = ({ aiInsights }) => {
  const { mode } = useDualMode();
  const [expandedSection, setExpandedSection] = useState<string>('metrics');

  const handleSectionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? section : '');
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced': return 'error';
      case 'intermediate': return 'warning';
      default: return 'success';
    }
  };

  const intelligenceScore = aiInsights?.intelligenceScore || 85;
  const metricCount = aiInsights?.metricIntelligence?.length || 0;
  const riskCount = aiInsights?.riskBlindSpots?.length || 0;
  const strategyCount = aiInsights?.advancedStrategies?.length || 0;
  const opportunityCount = aiInsights?.opportunityAlternatives?.length || 0;

  return (
    <Card sx={{ borderRadius: '16px', mb: 4, border: '2px solid #e3f2fd' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with Intelligence Score - Mode Aware */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <PsychologyIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box flex={1}>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Professional Investment Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'novice' 
                ? 'Detailed insights to help you understand your investment better'
                : 'Institutional-grade analysis with advanced metrics'}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {intelligenceScore}/100
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Investment Score
            </Typography>
          </Box>
        </Box>

        {/* Intelligence Score Progress - Hide sophistication in novice mode */}
        {mode === 'pro' && (
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight={600}>
                Analysis Sophistication Level
              </Typography>
              <Chip 
                label={aiInsights?.sophisticationLevel || 'Professional'}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={intelligenceScore} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: '#e3f2fd',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: intelligenceScore >= 80 ? '#4caf50' : intelligenceScore >= 60 ? '#ff9800' : '#f44336'
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {aiInsights?.transformationInsights || `Professional-grade analysis with ${metricCount + riskCount + strategyCount} insights`}
            </Typography>
          </Box>
        )}

        {/* Quick Stats - Only show in pro mode */}
        {mode === 'pro' && (
          <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 1, backgroundColor: '#f3e5f5' }}>
              <Typography variant="h6" fontWeight={700} color="purple">
                {metricCount}
              </Typography>
              <Typography variant="caption">
                Metric Insights
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 1, backgroundColor: '#fff3e0' }}>
              <Typography variant="h6" fontWeight={700} color="orange">
                {riskCount}
              </Typography>
              <Typography variant="caption">
                Risk Blind Spots
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 1, backgroundColor: '#e8f5e8' }}>
              <Typography variant="h6" fontWeight={700} color="green">
                {strategyCount}
              </Typography>
              <Typography variant="caption">
                Pro Strategies
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 1, backgroundColor: '#e3f2fd' }}>
              <Typography variant="h6" fontWeight={700} color="blue">
                {opportunityCount}
              </Typography>
              <Typography variant="caption">
                Alternatives
              </Typography>
            </Card>
          </Grid>
        </Grid>
        )}

        {/* Metric Intelligence Section */}
        <Accordion 
          expanded={expandedSection === 'metrics'} 
          onChange={handleSectionChange('metrics')}
          sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid #e0e0e0' }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#f8f9fa' }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <LightbulbIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Metric Intelligence Transformation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metricCount} metrics transformed from novice to professional insights
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {aiInsights?.metricIntelligence?.map((metric: any, index: number) => (
              <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      {metric.metricName}
                    </Typography>
                    <Chip 
                      label={metric.riskLevel?.toUpperCase() || 'MEDIUM'}
                      color={getRiskColor(metric.riskLevel)}
                      size="small"
                    />
                  </Box>
                  
                  {/* Show different content based on mode */}
                  {mode === 'novice' ? (
                    /* Novice View - Detailed explanations */
                    <>
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                          💡 What this means:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.noviceView}
                        </Typography>
                      </Box>
                      
                      {/* Action Items and Benchmarks for Novice */}
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} color="orange" mb={1}>
                              🎯 What to do:
                            </Typography>
                            <Typography variant="body2">
                              {metric.actionItem}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ p: 2, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} color="green" mb={1}>
                              📊 Good target:
                            </Typography>
                            <Typography variant="body2">
                              {metric.benchmark}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    /* Professional View - Condensed, data-only */
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            {/* Extract value from the proInsight text */}
                            {metric.proInsight?.split(' - ')[0] || metric.metricName}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Warning - Only show in novice mode */}
                  {metric.warning && mode === 'novice' && (
                    <Alert severity={getRiskColor(metric.riskLevel)} sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>⚠️ Warning:</strong> {metric.warning}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Risk Blind Spots Section */}
        <Accordion 
          expanded={expandedSection === 'risks'} 
          onChange={handleSectionChange('risks')}
          sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid #e0e0e0' }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#fff3e0' }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon sx={{ color: 'warning.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Risk Blind Spots Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'novice' 
                    ? `${riskCount} critical risks novice investors typically miss`
                    : `${riskCount} risk factors identified`}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {aiInsights?.riskBlindSpots?.map((risk: any, index: number) => (
              <Alert 
                key={index} 
                severity={getRiskColor(risk.priority)} 
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {risk.riskType}
                    </Typography>
                    <Chip 
                      label={`${risk.priority?.toUpperCase()} PRIORITY`}
                      size="small" 
                      color={getRiskColor(risk.priority)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  {mode === 'novice' && (
                    /* Novice View Only - Full explanations */
                    <>
                      <Typography variant="body2" mb={2}>
                        {risk.description}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            PROBABILITY:
                          </Typography>
                          <Typography variant="body2">
                            {risk.probability}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            IMPACT:
                          </Typography>
                          <Typography variant="body2">
                            {risk.impact}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            MITIGATION:
                          </Typography>
                          <Typography variant="body2">
                            {risk.mitigation}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  {/* Pro mode shows just the risk name and priority chip - no additional content */}
                </Box>
              </Alert>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Advanced Strategies Section */}
        <Accordion 
          expanded={expandedSection === 'strategies'} 
          onChange={handleSectionChange('strategies')}
          sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid #e0e0e0' }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#e8f5e8' }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <TrendingUpIcon sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Advanced Professional Strategies
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {strategyCount} sophisticated strategies professionals use
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {aiInsights?.advancedStrategies?.map((strategy: any, index: number) => (
              <Card key={index} sx={{ mb: 2, border: '1px solid #e8f5e8' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} color="success.main">
                        {strategy.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.strategyType}
                      </Typography>
                    </Box>
                    <Chip 
                      label={strategy.difficulty?.toUpperCase() || 'INTERMEDIATE'}
                      size="small" 
                      color={getDifficultyColor(strategy.difficulty)}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" mb={2}>
                    {strategy.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        IMPLEMENTATION:
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        {strategy.implementation}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        TIMEFRAME:
                      </Typography>
                      <Typography variant="body2" mb={1}>
                        {strategy.timeframe}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box display="flex" gap={2} mt={2}>
                    {strategy.costEstimate && (
                      <Chip 
                        label={`Cost: ${strategy.costEstimate}`}
                        size="small" 
                        color="info" 
                        variant="outlined" 
                      />
                    )}
                    {strategy.expectedROI && (
                      <Chip 
                        label={`ROI: ${strategy.expectedROI}`}
                        size="small" 
                        color="success" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Opportunity Cost Section */}
        <Accordion 
          expanded={expandedSection === 'opportunities'} 
          onChange={handleSectionChange('opportunities')}
          sx={{ borderRadius: '12px !important', border: '1px solid #e0e0e0' }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#f3e5f5' }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <CompareIcon sx={{ color: 'info.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Opportunity Cost Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {opportunityCount} alternative investments to consider
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {aiInsights?.opportunityAlternatives?.map((alt: any, index: number) => (
              <Card key={index} sx={{ mb: 2, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" fontWeight={600} color="info.main">
                      {alt.title}
                    </Typography>
                    <Chip 
                      label={alt.category?.toUpperCase().replace('_', ' ') || 'ALTERNATIVE'}
                      size="small" 
                      color="info" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {alt.description}
                  </Typography>
                  
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={`Return: ${alt.expectedReturn}`} 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Risk: ${alt.riskLevel}`} 
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={alt.benefit} 
                      size="small" 
                      color="info" 
                      variant="outlined" 
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default IntelligenceMultiplier;