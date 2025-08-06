import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Collapse,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  CheckCircle as BuyIcon,
  Cancel as PassIcon,
  Handshake as NegotiateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Psychology as AIIcon,
  TrendingUp as OpportunityIcon,
  Warning as RiskIcon,
  Assignment as ActionIcon,
  AccountBalance as CapitalIcon,
  Timeline as TimelineIcon,
  Compare as AlternativeIcon,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

interface InvestmentDecisionHeroProps {
  investmentDecision: {
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE';
    confidence: number;
    primaryReason: string;
    secondaryReasons: string[];
    keyRisks: string[];
    actionPlan: Array<{
      action: string;
      priority: 'immediate' | 'short-term' | 'long-term';
      impact: string;
      effort: 'low' | 'medium' | 'high';
      expectedOutcome: string;
      timeframe: string;
    }>;
    capitalStrategy: {
      currentApproach: {
        description: string;
        cashRequired: number;
        expectedReturn: number;
        efficiency: 'poor' | 'fair' | 'good' | 'excellent';
      };
      recommendedApproach: {
        description: string;
        cashRequired: number;
        expectedReturn: number;
        efficiency: 'poor' | 'fair' | 'good' | 'excellent';
      };
      opportunityCost: {
        annualCost: number;
        description: string;
        alternativeUse: string;
      };
      portfolioStrategy: string;
    };
    alternativeOptions: Array<{
      type: 'better_deal' | 'market_timing' | 'different_strategy' | 'diversification';
      title: string;
      description: string;
      expectedReturn: string;
      riskLevel: 'lower' | 'similar' | 'higher';
      timeframe: string;
    }>;
    marketContext: {
      marketStage: 'early' | 'mid' | 'late' | 'correction';
      pricingContext: 'undervalued' | 'fair' | 'overvalued' | 'bubble';
      competitiveIntensity: 'low' | 'moderate' | 'high' | 'extreme';
      recommendedStrategy: string;
    };
    timeline: {
      immediateActions: string[];
      shortTermActions: string[];
      longTermStrategy: string[];
    };
  };
}

const InvestmentDecisionHero: React.FC<InvestmentDecisionHeroProps> = ({ 
  investmentDecision 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('reasoning');

  // Verdict styling configuration
  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return {
          icon: BuyIcon,
          color: appleColors.green[600],
          bgColor: appleColors.green[50],
          borderColor: appleColors.green[200],
          label: 'Recommended Purchase',
          description: 'Strong investment opportunity'
        };
      case 'NEGOTIATE':
        return {
          icon: NegotiateIcon,
          color: appleColors.orange[600],
          bgColor: appleColors.orange[50],
          borderColor: appleColors.orange[200],
          label: 'Negotiate Price',
          description: 'Potential with price adjustment'
        };
      case 'PASS':
        return {
          icon: PassIcon,
          color: appleColors.red[600],
          bgColor: appleColors.red[50],
          borderColor: appleColors.red[200],
          label: 'Pass on Property',
          description: 'Does not meet investment criteria'
        };
      default:
        return {
          icon: BuyIcon,
          color: appleColors.gray[600],
          bgColor: appleColors.gray[50],
          borderColor: appleColors.gray[200],
          label: 'Analysis Complete',
          description: 'Review results below'
        };
    }
  };

  const verdictConfig = getVerdictConfig(investmentDecision.verdict);
  const VerdictIcon = verdictConfig.icon;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Detail tabs
  const detailTabs = [
    { id: 'reasoning', label: 'Reasoning', icon: AIIcon },
    { id: 'actions', label: 'Action Plan', icon: ActionIcon },
    { id: 'capital', label: 'Capital Strategy', icon: CapitalIcon },
    { id: 'timeline', label: 'Timeline', icon: TimelineIcon },
    { id: 'alternatives', label: 'Alternatives', icon: AlternativeIcon }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Main Hero Card */}
      <Card
        sx={{
          borderRadius: '20px',
          border: `3px solid ${verdictConfig.borderColor}`,
          backgroundColor: verdictConfig.bgColor,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '22px',
            background: `linear-gradient(135deg, ${verdictConfig.color}20, ${verdictConfig.color}10)`,
            zIndex: -1
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Verdict Icon and Label */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      backgroundColor: verdictConfig.color,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <VerdictIcon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color={verdictConfig.color}
                      sx={{ lineHeight: 1.1 }}
                    >
                      {investmentDecision.verdict}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {verdictConfig.label}
                    </Typography>
                  </Box>
                </Box>
                
                <Chip
                  label={`${investmentDecision.confidence}% Confidence`}
                  sx={{
                    backgroundColor: verdictConfig.color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    height: 32
                  }}
                />
              </Box>
            </Grid>

            {/* Primary Reason */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: verdictConfig.color }}>
                  Professional Analysis
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: '16px',
                    lineHeight: 1.6,
                    color: appleColors.gray[800],
                    fontWeight: 500
                  }}
                >
                  {investmentDecision.primaryReason}
                </Typography>
              </Box>
            </Grid>

            {/* Quick Actions */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Stack spacing={2} alignItems={{ xs: 'center', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => setShowDetails(!showDetails)}
                  endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: verdictConfig.color,
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: verdictConfig.color,
                      opacity: 0.9
                    }
                  }}
                >
                  {showDetails ? 'Hide Details' : 'View Details'}
                </Button>
                
                {/* AI-Backed Badge */}
                <Box sx={{ textAlign: 'center' }}>
                  <Chip
                    icon={<AIIcon />}
                    label="AI-Backed Analysis"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: appleColors.primary[300],
                      color: appleColors.primary[600],
                      fontWeight: 500,
                      '& .MuiChip-icon': {
                        color: appleColors.primary[500]
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Analysis Collapse */}
      <Collapse in={showDetails}>
        <Card sx={{ mt: 2, borderRadius: '16px', border: `1px solid ${verdictConfig.borderColor}` }}>
          <CardContent sx={{ p: 0 }}>
            {/* Detail Tab Navigation */}
            <Box sx={{ borderBottom: `1px solid ${appleColors.gray[200]}`, px: 3, pt: 3 }}>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 2 }}>
                {detailTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeDetailTab === tab.id ? 'contained' : 'outlined'}
                    startIcon={<tab.icon />}
                    onClick={() => setActiveDetailTab(tab.id)}
                    sx={{
                      minWidth: 'fit-content',
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '13px',
                      px: 2,
                      py: 1,
                      whiteSpace: 'nowrap',
                      ...(activeDetailTab === tab.id && {
                        backgroundColor: verdictConfig.color,
                        borderColor: verdictConfig.color
                      })
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Detail Content */}
            <Box sx={{ p: 3 }}>
              {activeDetailTab === 'reasoning' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <OpportunityIcon sx={{ mr: 1, color: appleColors.green[600] }} />
                      Supporting Factors
                    </Typography>
                    <List dense>
                      {investmentDecision.secondaryReasons.map((reason, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ fontSize: 20, color: appleColors.green[500] }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={reason} 
                            primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <RiskIcon sx={{ mr: 1, color: appleColors.orange[600] }} />
                      Key Risks
                    </Typography>
                    <List dense>
                      {investmentDecision.keyRisks.map((risk, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Warning sx={{ fontSize: 20, color: appleColors.orange[500] }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={risk} 
                            primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              )}

              {activeDetailTab === 'actions' && (
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Recommended Action Plan
                  </Typography>
                  
                  <Stack spacing={2}>
                    {investmentDecision.actionPlan.map((action, index) => (
                      <Card key={index} sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
                            {action.action}
                          </Typography>
                          <Chip
                            label={action.priority}
                            size="small"
                            color={action.priority === 'immediate' ? 'error' : action.priority === 'short-term' ? 'warning' : 'info'}
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Impact:</strong> {action.impact}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Expected: {action.expectedOutcome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Timeline: {action.timeframe}
                          </Typography>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {activeDetailTab === 'capital' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Current Approach
                    </Typography>
                    <Box sx={{ p: 2, backgroundColor: appleColors.orange[50], borderRadius: '12px', mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        {investmentDecision.capitalStrategy.currentApproach.description}
                      </Typography>
                      <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cash Required</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(investmentDecision.capitalStrategy.currentApproach.cashRequired)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Expected Return</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatPercentage(investmentDecision.capitalStrategy.currentApproach.expectedReturn)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={`${investmentDecision.capitalStrategy.currentApproach.efficiency} efficiency`}
                        size="small"
                        color={investmentDecision.capitalStrategy.currentApproach.efficiency === 'excellent' ? 'success' : 'warning'}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Recommended Approach
                    </Typography>
                    <Box sx={{ p: 2, backgroundColor: appleColors.green[50], borderRadius: '12px', mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        {investmentDecision.capitalStrategy.recommendedApproach.description}
                      </Typography>
                      <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cash Required</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(investmentDecision.capitalStrategy.recommendedApproach.cashRequired)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Expected Return</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatPercentage(investmentDecision.capitalStrategy.recommendedApproach.expectedReturn)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={`${investmentDecision.capitalStrategy.recommendedApproach.efficiency} efficiency`}
                        size="small"
                        color={investmentDecision.capitalStrategy.recommendedApproach.efficiency === 'excellent' ? 'success' : 'warning'}
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ borderRadius: '12px' }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Portfolio Strategy
                      </Typography>
                      <Typography variant="body2">
                        {investmentDecision.capitalStrategy.portfolioStrategy}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              )}

              {activeDetailTab === 'timeline' && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.red[600] }}>
                      Immediate (0-30 days)
                    </Typography>
                    <List dense>
                      {investmentDecision.timeline.immediateActions.map((action, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ fontSize: 18, color: appleColors.red[500] }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={action} 
                            primaryTypographyProps={{ fontSize: '14px' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.orange[600] }}>
                      Short-term (30-90 days)
                    </Typography>
                    <List dense>
                      {investmentDecision.timeline.shortTermActions.map((action, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ fontSize: 18, color: appleColors.orange[500] }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={action} 
                            primaryTypographyProps={{ fontSize: '14px' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.green[600] }}>
                      Long-term (90+ days)
                    </Typography>
                    <List dense>
                      {investmentDecision.timeline.longTermStrategy.map((action, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ fontSize: 18, color: appleColors.green[500] }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={action} 
                            primaryTypographyProps={{ fontSize: '14px' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              )}

              {activeDetailTab === 'alternatives' && (
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Alternative Investment Options
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {investmentDecision.alternativeOptions.map((alternative, index) => (
                      <Grid size={{ xs: 12, md: 6 }} key={index}>
                        <Card sx={{ p: 2, borderRadius: '12px', height: '100%' }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            {alternative.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {alternative.description}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip label={alternative.expectedReturn} size="small" color="info" />
                            <Chip 
                              label={`${alternative.riskLevel} risk`} 
                              size="small" 
                              color={alternative.riskLevel === 'lower' ? 'success' : alternative.riskLevel === 'higher' ? 'warning' : 'default'}
                            />
                            <Chip label={alternative.timeframe} size="small" variant="outlined" />
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
};

export default InvestmentDecisionHero;