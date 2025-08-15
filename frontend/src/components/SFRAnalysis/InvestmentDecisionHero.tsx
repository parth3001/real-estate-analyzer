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
  Alert,
  Tooltip
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
  Warning,
  Info as InfoIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import InvestmentMessagingEngine, { type InvestmentMetrics, type GoalContext, type MessageResult } from '../../utils/investmentMessagingEngine';
// Professional Scoring Engine removed - all scoring logic in backend

interface AnalysisData {
  monthlyAnalysis?: {
    cashFlow?: number;
  };
  keyMetrics?: {
    capRate?: number;
    cashOnCashReturn?: number;
  };
  financing?: {
    totalInvestment?: number;
  };
  purchasePrice?: number;
  longTermAnalysis?: {
    totalAppreciation?: number;
    totalCashFlow?: number;
  };
  operatingExpenseRatio?: number;
  dscr?: number;
  rentToPriceRatio?: number;
}

interface InvestmentDecisionHeroProps {
  investmentDecision: {
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE';
    confidence: number;
    score?: number; // Property quality score 0-100
    primaryReason: string;
    secondaryReasons: string[];
    keyRisks: string[];
    confidenceDescription?: string; // Backend-generated confidence explanation
    goalBasedReasoning?: string; // Backend-generated goal-based explanation
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
    goalContext?: GoalContext; // Goal context for personalization
  };
  analysis?: AnalysisData; // Analysis data for safe messaging
}

const InvestmentDecisionHero: React.FC<InvestmentDecisionHeroProps> = ({ 
  investmentDecision,
  analysis 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('reasoning');
  
  // Helper function to get user-friendly confidence context
  const getConfidenceContext = (confidence: number, verdict: string): { label: string; description: string; color: string } => {
    if (verdict === 'BUY') {
      if (confidence >= 80) return {
        label: 'Strong Confidence',
        description: 'High certainty this is a good investment',
        color: appleColors.green[600]
      };
      if (confidence >= 65) return {
        label: 'Moderate Confidence',
        description: 'Good opportunity with standard due diligence',
        color: appleColors.green[500]
      };
      return {
        label: 'Proceed with Caution',
        description: 'Positive but requires careful review',
        color: appleColors.orange[500]
      };
    } else if (verdict === 'NEGOTIATE') {
      if (confidence >= 70) return {
        label: 'Worth Negotiating',
        description: 'Good potential if terms improve',
        color: appleColors.orange[600]
      };
      if (confidence >= 50) return {
        label: 'Consider Carefully',
        description: 'May work with significant adjustments',
        color: appleColors.orange[500]
      };
      return {
        label: 'Limited Potential',
        description: 'Unlikely to meet goals even with negotiation',
        color: appleColors.orange[400]
      };
    } else { // PASS
      if (confidence >= 80) return {
        label: 'Strong Warning',
        description: 'High certainty this property should be avoided',
        color: appleColors.red[600]
      };
      if (confidence >= 65) return {
        label: 'Not Recommended',
        description: 'Multiple concerns indicate poor investment',
        color: appleColors.red[500]
      };
      if (confidence >= 40) return {
        label: 'Review Alternative Options',
        description: 'Some concerns but may work for specific strategies',
        color: appleColors.orange[500]
      };
      // 30% confidence = High uncertainty
      return {
        label: 'High Risk Warning',
        description: 'Multiple serious issues - recommend avoiding unless you have specific expertise',
        color: appleColors.red[400]
      };
    }
  };

  // Convert analysis to InvestmentMetrics and generate safe messaging
  const goalContext = investmentDecision.goalContext || {};
  
  let safeMessage: MessageResult;
  
  if (analysis) {
    // Convert analysis data to InvestmentMetrics format
    const metrics: InvestmentMetrics = {
      monthlyFlow: analysis.monthlyAnalysis?.cashFlow || 0,
      annualFlow: (analysis.monthlyAnalysis?.cashFlow || 0) * 12,
      capRate: analysis.keyMetrics?.capRate || 0,
      cashOnCashReturn: analysis.keyMetrics?.cashOnCashReturn || 0,
      totalInvestment: analysis.financing?.totalInvestment || 0,
      purchasePrice: analysis.purchasePrice || 0,
      totalWealth: (analysis.longTermAnalysis?.totalAppreciation || 0) + (analysis.longTermAnalysis?.totalCashFlow || 0),
      operatingExpenseRatio: analysis.operatingExpenseRatio,
      dscr: analysis.dscr,
      rentToPriceRatio: analysis.rentToPriceRatio
    };
    
    // Backend already has all the analysis - no frontend scoring needed
    // Generate contextual messaging but preserve backend's primary reason
    const generatedMessage = InvestmentMessagingEngine.generateMessage(
      investmentDecision.verdict,
      goalContext,
      metrics
    );
    
    // CRITICAL FIX: Always use backend's primaryReason over frontend's generic message
    // The backend has sophisticated market intelligence, property classification, and strategy alignment
    // that generates specific, actionable reasons. The frontend's generic messages lose this context.
    safeMessage = {
      ...generatedMessage,
      primaryReason: investmentDecision.primaryReason || generatedMessage.primaryReason
    };
    
    // Fix applied: Backend's sophisticated reasoning now preserved over frontend's generic messages
  } else {
    // Fallback when no analysis data
    safeMessage = {
      header: "Professional Analysis",
      primaryReason: investmentDecision.primaryReason,
      verdictLabel: "Investment Analysis",
      warnings: [],
      sentiment: 'neutral',
      confidence: 'medium'
    };
  }
  
  // Extract safe messaging values
  const goalContextualHeader = safeMessage.header;
  const goalContextualReason = safeMessage.primaryReason;
  const goalContextualVerdictLabel = safeMessage.verdictLabel;
  // Simplified for now - insights come from safeMessage.warnings

  // Verdict styling configuration with goal-contextual labels
  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return {
          icon: BuyIcon,
          color: appleColors.green[600],
          bgColor: appleColors.green[50],
          borderColor: appleColors.green[200],
          label: goalContextualVerdictLabel,
          description: 'Strong investment opportunity'
        };
      case 'NEGOTIATE':
        return {
          icon: NegotiateIcon,
          color: appleColors.orange[600],
          bgColor: appleColors.orange[50],
          borderColor: appleColors.orange[200],
          label: goalContextualVerdictLabel,
          description: 'Potential with price adjustment'
        };
      case 'PASS':
        return {
          icon: PassIcon,
          color: appleColors.red[600],
          bgColor: appleColors.red[50],
          borderColor: appleColors.red[200],
          label: goalContextualVerdictLabel,
          description: investmentDecision.confidence < 50 
            ? 'Some concerns but may work for specific strategies'
            : 'Does not meet investment criteria'
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip 
                      title={`Our confidence in the ${investmentDecision.verdict} recommendation. Higher confidence means stronger conviction based on property fundamentals, market conditions, and risk assessment.`}
                      arrow
                      placement="top"
                    >
                      <Chip
                        label={`${investmentDecision.confidence}% Confidence`}
                        sx={{
                          backgroundColor: getConfidenceContext(investmentDecision.confidence, investmentDecision.verdict).color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '14px',
                          height: 32,
                          cursor: 'help'
                        }}
                      />
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ color: appleColors.gray[600], fontWeight: 500, maxWidth: 300 }}>
                    {investmentDecision.confidenceDescription || getConfidenceContext(investmentDecision.confidence, investmentDecision.verdict).description}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Primary Reason */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: verdictConfig.color }}>
                  {goalContextualHeader}
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
{investmentDecision.goalBasedReasoning || goalContextualReason}
                </Typography>
                
                {/* Display backend investment decision insights */}
                {investmentDecision.secondaryReasons && investmentDecision.secondaryReasons.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {investmentDecision.secondaryReasons.slice(0, 2).map((reason: string, index: number) => (
                      <Alert 
                        key={index}
                        icon={investmentDecision.verdict === 'BUY' ? <CheckCircle /> : <InfoIcon />}
                        severity={investmentDecision.verdict === 'BUY' ? 'success' : 'info'}
                        sx={{ 
                          mt: 0.5, 
                          fontSize: '13px',
                          py: 0.5,
                          '& .MuiAlert-icon': { fontSize: '16px' },
                          '& .MuiAlert-message': { py: 0.5 }
                        }}
                      >
                        {reason}
                      </Alert>
                    ))}
                  </Box>
                )}
                
                {/* Display key risks from backend */}
                {investmentDecision.keyRisks && investmentDecision.keyRisks.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {investmentDecision.keyRisks.slice(0, 2).map((risk: string, index: number) => (
                      <Alert 
                        key={index}
                        icon={<Warning />}
                        severity="warning" 
                        sx={{ 
                          mt: 1, 
                          fontSize: '13px',
                          py: 0.5,
                          '& .MuiAlert-icon': { fontSize: '16px' },
                          '& .MuiAlert-message': { py: 0.5 }
                        }}
                      >
                        {risk}
                      </Alert>
                    ))}
                  </Box>
                )}
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