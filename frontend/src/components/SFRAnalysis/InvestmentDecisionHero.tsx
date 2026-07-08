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
import { formatCurrency as standardFormatCurrency, formatPercent } from '../../utils/formatters';
import { roundCurrency } from '../../utils/precision';
// Architecture Fix: Removed InvestmentMessagingEngine - all messaging now from backend only
// This ensures Single Source of Truth principle compliance

// UI Redesign: New analytical components (non-directive presentation)
import DealQualityHeader from './DealQualityHeader';
import SimplifiedCalibration from './SimplifiedCalibration';
import KeyAnalysisInsights from './KeyAnalysisInsights';
import VerificationGuide from './VerificationGuide';
import InvestmentStandardsGuide from './InvestmentStandardsGuide';

// Minimal local interfaces (no business logic)
interface GoalContext {
  exitStrategy?: string;
  portfolioStrategy?: string;
  experienceLevel?: string;
  riskApproach?: string;
}

interface MessageResult {
  header: string;
  primaryReason: string;
  verdictLabel: string;
  warnings: string[];
}

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

// V3.0 Professional Assessment Interface
interface ProfessionalAssessment {
  dealQuality: number; // 0-100 weighted score of deal fundamentals
  executionDifficulty: number; // 0-100 complexity of executing this investment
  dataReliability: number; // 0-100 confidence in input data quality
  
  // Factor breakdown (sum = 100%)
  cashFlowScore: number; // 35% weight - monthly income stability
  irrScore: number; // 25% weight - total return potential
  marketStrengthScore: number; // 15% weight - market tier and trends
  debtStructureScore: number; // 10% weight - financing quality
  exitStrategyScore: number; // 10% weight - liquidity and exit options
  capRateScore: number; // 3% weight - current yield vs market
  propertyRiskScore: number; // 2% weight - property quality and age
  
  // Professional recommendations
  primaryInsight: string;
  strategicRecommendations: string[];
  riskMitigation: string[];
  opportunityMaximization: string[];
  
  // Enhanced debt structure analysis
  debtAnalysis?: {
    dscr: number;
    interestRate: number;
    marketSpread: number; // in basis points
    leverageRatio: number;
    loanTerm: number;
    isBalloonLoan: boolean;
    balloonYears?: number;
    riskFactors: string[];
    strengthFactors: string[];
  };

  // Tax Intelligence Enhancement
  taxOptimization?: {
    afterTaxIRR: number;
    afterTaxDealQuality: number;
    optimalHoldPeriod: number;
    taxEfficiencyScore: number;
    stateTaxAdvantage: boolean;
    holdPeriodTaxSavings: number;
    exchange1031Eligible: boolean;
    primaryTaxInsight: string;
    taxOptimizationRecommendations: string[];
  };
}

// AI-Enhanced Content Interface (80/20 approach)
interface AIEnhancedContent {
  reasoning: {
    explanation: string;
    keyStrengths: string[];
    keyConcerns: string[];
    verdict: string;
  };
  actionPlan: {
    immediateActions: string[];
    negotiationFocus: string[];
    preparationItems: string[];
    timeframe: string;
  };
  capitalStrategy: {
    currentAssessment: string;
    optimizedApproach: string;
    alternativeOptions: string[];
    recommendation: string;
  };
  timeline: {
    optimalHoldPeriod: string;
    rationale: string;
    exitIndicators: string[];
    marketTiming: string;
  };
  alternatives: {
    betterPropertyType: string;
    marketAlternative: string;
    timingStrategy: string;
    riskAdjustment: string;
  };
}

// Sensitivity Analysis Interface
interface SensitivityScenario {
  parameter: 'price' | 'rent' | 'interestRate' | 'downPayment';
  currentValue: number;
  newValue: number;
  change: number;
  changePercent: number;
  newDealQuality: number;
  newVerdict: 'BUY' | 'NEGOTIATE' | 'PASS';
  scoreImprovement: number;
  description: string;
}

interface SensitivityAnalysis {
  currentScore: number;
  currentVerdict: 'BUY' | 'NEGOTIATE' | 'PASS';
  buyThreshold: number;
  
  priceScenarios: SensitivityScenario[];
  rentScenarios: SensitivityScenario[];
  interestRateScenarios: SensitivityScenario[];
  
  pathToBuy: {
    easiest: SensitivityScenario;
    mostRealistic: SensitivityScenario;
    alternatives: SensitivityScenario[];
  };
  
  negotiationGuidance: {
    focus: 'price' | 'rent' | 'financing' | 'terms';
    rationale: string;
    specificTargets: string[];
  };
}

interface InvestmentDecisionHeroProps {
  investmentDecision: {
    verdict: 'BUY' | 'PASS' | 'NEGOTIATE';
    confidence: number; // LEGACY - deprecated
    score?: number; // LEGACY - property quality score 0-100
    professionalAssessment?: ProfessionalAssessment; // V3.0 Professional Calibration
    primaryReason: string;
    secondaryReasons: string[];
    keyRisks: string[];
    confidenceDescription?: string; // Backend-generated confidence explanation
    goalBasedReasoning?: string; // Backend-generated goal-based explanation
    portfolioContext?: {
      portfolioName: string;
      currentProperties: number;
      portfolioGoal: string;
      fitAnalysis: string;
      impactSummary: string;
    }; // Portfolio context when property analyzed in portfolio
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
    aiEnhancedContent?: AIEnhancedContent; // AI-enhanced tab content (80/20 approach)
    sensitivityAnalysis?: SensitivityAnalysis; // Deal sensitivity analysis for negotiation intelligence
  };
  analysis?: AnalysisData; // Analysis data for safe messaging
  propertyData?: any; // Sprint 4 Story 4.5: Property data for MF-specific alerts
}

const InvestmentDecisionHero: React.FC<InvestmentDecisionHeroProps> = ({
  investmentDecision,
  analysis,
  propertyData
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('reasoning');
  const [verificationOpen, setVerificationOpen] = useState(false); // UX Improvement: Collapse verification guide by default
  const [standardsOpen, setStandardsOpen] = useState(false); // Investment Standards Guide accordion
  
  // Fix floating-point precision in monetary values within text
  const formatPortfolioFitText = (text: string): string => {
    if (!text) return '';
    
    // Match monetary values like $19.650000000000002 and format them properly
    return text.replace(/\$(\d+\.?\d*)/g, (match, amount) => {
      const numericValue = parseFloat(amount);
      if (isNaN(numericValue)) return match;
      
      // Use roundCurrency to fix floating-point precision
      const roundedValue = roundCurrency(numericValue);
      return `$${roundedValue.toFixed(2)}`;
    });
  };
  
  // Helper function to get user-friendly confidence context
  const getConfidenceContext = (confidence: number, verdict: string): { label: string; description: string; color: string } => {
    if (verdict === 'BUY') {
      if (confidence >= 80) return {
        label: 'Strong Confidence',
        description: 'Multiple fundamentals align - institutional-quality opportunity',
        color: appleColors.green[600]
      };
      if (confidence >= 65) return {
        label: 'Moderate Confidence',
        description: 'Solid fundamentals with standard professional due diligence needed',
        color: appleColors.green[500]
      };
      return {
        label: 'Proceed with Caution',
        description: 'Some risk factors present - thorough analysis required',
        color: appleColors.orange[500]
      };
    } else if (verdict === 'NEGOTIATE') {
      if (confidence >= 70) return {
        label: 'Worth Negotiating',
        description: 'Strong fundamentals - specific price/terms adjustments needed',
        color: appleColors.orange[600]
      };
      if (confidence >= 50) return {
        label: 'Consider Carefully',
        description: 'Multiple factors require adjustment for viability',
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

  // ✅ ARCHITECTURE FIX: Use ONLY backend-generated messages (Single Source of Truth)
  // Removed all frontend business logic - backend Investment Decision Engine handles everything
  
  const getVerdictLabel = (verdict: string): string => {
    switch (verdict) {
      case 'BUY': return 'Recommended Investment';
      case 'NEGOTIATE': return 'Negotiate Terms';
      case 'CAUTION': return 'Consider With Strategy';
      case 'PASS': return 'Pass on This Property';
      default: return 'Investment Analysis';
    }
  };
  
  // Use ONLY backend-generated content - no frontend business logic
  const safeMessage: MessageResult = {
    header: "Professional Investment Analysis",
    primaryReason: investmentDecision.primaryReason,
    verdictLabel: getVerdictLabel(investmentDecision.verdict),
    warnings: investmentDecision.keyRisks || []
  };
  
  // Extract safe messaging values
  const goalContextualHeader = safeMessage.header;
  const goalContextualVerdictLabel = safeMessage.verdictLabel;
  // primaryReason comes directly from backend, not from safeMessage

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
      case 'CAUTION':
        return {
          icon: NegotiateIcon, // Reuse negotiate icon for now
          color: appleColors.blue[600],
          bgColor: appleColors.blue[50],
          borderColor: appleColors.blue[400],
          label: goalContextualVerdictLabel,
          description: 'Requires strategic consideration'
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

  // Use standardized currency formatting from utils
  const formatCurrency = standardFormatCurrency;

  // Issue #15 Fix: Conditional tab display based on content availability
  const hasTimeline = !!(investmentDecision.timeline?.immediateActions?.length > 0);
  const hasAlternatives = !!(investmentDecision.alternativeOptions?.length > 0);

  // Detail tabs - conditionally include based on content availability
  const detailTabs = [
    { id: 'reasoning', label: 'Reasoning', icon: AIIcon },
    ...(investmentDecision.professionalAssessment ? [{ id: 'professional', label: 'Professional Analysis', icon: CheckCircle }] : []),
    ...(investmentDecision.portfolioContext ? [{ id: 'portfolio', label: 'Portfolio Fit', icon: InfoIcon }] : []),
    { id: 'actions', label: 'Action Plan', icon: ActionIcon }, // Always show with fallback
    { id: 'capital', label: 'Capital Strategy', icon: CapitalIcon }, // Always show with fallback
    ...(hasTimeline ? [{ id: 'timeline', label: 'Timeline', icon: TimelineIcon }] : []),
    ...(hasAlternatives ? [{ id: 'alternatives', label: 'Alternatives', icon: AlternativeIcon }] : [])
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Main Hero Card - UX Fix: Neutral styling (removed verdict-based colors) */}
      <Card
        sx={{
          borderRadius: '20px',
          border: `1px solid ${appleColors.gray[200]}`, // UX Fix: Neutral gray (was verdict-based)
          backgroundColor: appleColors.gray[50], // UX Fix: Neutral background
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', // UX Fix: Subtle shadow for depth
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="flex-start">
            {/* UI Redesign: Deal Quality Score (left column - 50% on desktop) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                {/* NEW: Deal Quality Header */}
                {investmentDecision.professionalAssessment ? (
                  <DealQualityHeader score={investmentDecision.professionalAssessment.dealQuality} />
                ) : (
                  <Alert severity="info" sx={{ borderRadius: '12px' }}>
                    <Typography variant="body2" fontWeight={500}>
                      Professional assessment unavailable. Basic analysis provided.
                    </Typography>
                  </Alert>
                )}

                  {/* Educational Disclaimer - Legal Protection */}
                  <Box sx={{
                    mt: 2,
                    p: 1.5,
                    backgroundColor: appleColors.gray[50],
                    borderRadius: '8px',
                    border: `1px solid ${appleColors.gray[300]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <InfoIcon sx={{ fontSize: 16, color: appleColors.blue[500], flexShrink: 0 }} />
                    <Typography variant="caption" sx={{
                      color: appleColors.gray[700],
                      fontSize: '11px',
                      fontWeight: 500,
                      lineHeight: 1.4
                    }}>
                      For educational purposes only. Not financial advice. Consult qualified professionals before investing.
                    </Typography>
                  </Box>

                  {/* Minimal Tax Summary */}
                  {investmentDecision.professionalAssessment?.taxOptimization && (
                    <Box sx={{
                      p: 2,
                      mt: 2,
                      backgroundColor: appleColors.blue[50],
                      borderRadius: '8px',
                      borderLeft: `4px solid ${appleColors.blue[500]}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: appleColors.blue[700] }}>
                          Tax Intelligence
                        </Typography>
                        <Chip
                          label={`${investmentDecision.professionalAssessment.taxOptimization.optimalHoldPeriod}yr optimal`}
                          size="small"
                          sx={{
                            backgroundColor: appleColors.blue[100],
                            color: appleColors.blue[800],
                            fontWeight: 600,
                            fontSize: '10px'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{
                        color: appleColors.gray[700],
                        fontSize: '10px',
                        display: 'block'
                      }}>
                        {investmentDecision.professionalAssessment.taxOptimization.primaryTaxInsight}
                      </Typography>
                    </Box>
                  )}
              </Box>
            </Grid>

            {/* UI Redesign: Analysis + Actions Combined (right column - 50% on desktop) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                {/* View Details Button - Top Right */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                  <Stack spacing={2} alignItems={{ xs: 'center', md: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={() => setShowDetails(!showDetails)}
                      endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: appleColors.primary[600],
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: appleColors.primary[700],
                        }
                      }}
                    >
                      {showDetails ? 'Hide Details' : 'View Details'}
                    </Button>

                    {/* AI-Backed Badge */}
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
                  </Stack>
                </Box>

                {/* Analysis Content - NOW GOAL-AWARE */}
                {(() => {
                  // Check if user has goals
                  const hasGoals = investmentDecision.goalContext &&
                    (investmentDecision.goalContext.exitStrategy ||
                     investmentDecision.goalContext.portfolioStrategy ||
                     investmentDecision.goalContext.riskApproach);

                  // User has goals - show full AI analysis
                  if (hasGoals) {
                    if (investmentDecision.goalBasedReasoning) {
                      return <KeyAnalysisInsights content={investmentDecision.goalBasedReasoning} />;
                    } else if (investmentDecision.aiEnhancedContent?.reasoning?.explanation) {
                      return <KeyAnalysisInsights content={investmentDecision.aiEnhancedContent.reasoning.explanation} />;
                    }
                  }

                  // No goals - minimal text (don't repeat metrics)
                  const dealQuality = investmentDecision.professionalAssessment?.dealQuality || 0;

                  if (investmentDecision.aiEnhancedContent?.reasoning?.explanation) {
                    // If AI generated short no-goals text, show it
                    return <KeyAnalysisInsights content={investmentDecision.aiEnhancedContent.reasoning.explanation} />;
                  }

                  // Fallback minimal text
                  return (
                    <Box>
                      <Typography variant="body2" sx={{
                        fontSize: '14px',
                        color: appleColors.gray[600],
                        fontStyle: 'italic',
                        lineHeight: 1.6
                      }}>
                        {dealQuality >= 60
                          ? "Property meets professional standards. Review calibration metrics above for details."
                          : "Property shows challenges in current configuration. Review professional calibration metrics above."}
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            </Grid>
          </Grid>

          {/* UX Enhancement: Full-Width Professional Calibration (desktop horizontal layout) */}
          {investmentDecision.professionalAssessment && (
            <Box sx={{ mt: 4 }}>
              <SimplifiedCalibration
                cashFlowScore={investmentDecision.professionalAssessment.cashFlowScore || 0}
                irrScore={investmentDecision.professionalAssessment.irrScore || 0}
                marketStrengthScore={investmentDecision.professionalAssessment.marketStrengthScore || 0}
                cashFlowValue={
                  analysis?.monthlyAnalysis?.cashFlow !== undefined
                    ? `${analysis.monthlyAnalysis.cashFlow < 0 ? '-' : ''}$${Math.abs(Math.round(analysis.monthlyAnalysis.cashFlow))}/month`
                    : 'N/A'
                }
                irrValue={
                  (() => {
                    // Try multiple possible IRR locations
                    const irr = (analysis as any)?.longTermAnalysis?.irr ??
                                (analysis as any)?.keyMetrics?.irr ??
                                (analysis as any)?.irr;

                    if (irr !== undefined && irr !== null && !isNaN(irr)) {
                      return `${(irr * 100).toFixed(2)}%`;
                    }
                    return 'N/A';
                  })()
                }
                marketStrengthValue={
                  (investmentDecision.professionalAssessment.marketStrengthScore || 0) >= 70
                    ? 'Strong market'
                    : (investmentDecision.professionalAssessment.marketStrengthScore || 0) >= 50
                    ? 'Moderate market'
                    : 'Weak market'
                }
              />
            </Box>
          )}

          {/* UI Redesign: Two Accordions - Verification Guide + Investment Standards */}
          <Grid container spacing={1.5} sx={{ mt: 3, width: '100%', mx: 0 }}>
            {/* Professional Verification Guide */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                fullWidth
                onClick={() => setVerificationOpen(!verificationOpen)}
                endIcon={verificationOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  p: 2,
                  backgroundColor: appleColors.blue[50],
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: appleColors.blue[100],
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color={appleColors.blue[800]} sx={{ fontSize: '16px' }}>
                    📋 Professional Verification Guide
                  </Typography>
                  <Typography variant="caption" color={appleColors.gray[600]} sx={{ fontSize: '13px' }}>
                    3 steps to verify key assumptions
                  </Typography>
                </Box>
              </Button>

              <Collapse in={verificationOpen} timeout={300}>
                <Card
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: `1px solid ${appleColors.blue[200]}`,
                    maxHeight: { xs: 'none', md: '500px' },
                    overflowY: { xs: 'visible', md: 'auto' },
                  }}
                >
                  <VerificationGuide
                    propertyData={{
                      monthlyRent: propertyData?.monthlyRent,
                      propertyTax: propertyData?.propertyTax,
                      insurance: propertyData?.insurance,
                      maintenance: propertyData?.maintenance,
                    }}
                  />
                </Card>
              </Collapse>
            </Grid>

            {/* Investment Standards Guide */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                fullWidth
                onClick={() => setStandardsOpen(!standardsOpen)}
                endIcon={standardsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  p: 2,
                  backgroundColor: appleColors.gray[50],
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color={appleColors.primary[600]} sx={{ fontSize: '16px' }}>
                    📊 Investment Standards Guide
                  </Typography>
                  <Typography variant="caption" color={appleColors.gray[600]} sx={{ fontSize: '13px' }}>
                    Understanding score ranges
                  </Typography>
                </Box>
              </Button>

              <Collapse in={standardsOpen} timeout={300}>
                <Card
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: `1px solid ${appleColors.gray[200]}`,
                    maxHeight: { xs: 'none', md: '500px' },
                    overflowY: { xs: 'visible', md: 'auto' },
                  }}
                >
                  <InvestmentStandardsGuide
                    currentScore={investmentDecision.professionalAssessment?.dealQuality || 0}
                  />
                </Card>
              </Collapse>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Story 4.5: MF-Specific Alerts (conditionally shown for Multi-Family properties only) */}
      {propertyData?.propertyType === 'MF' && (
        <Box sx={{ mt: 2 }}>
          {/* Alert 1: DSCR < 1.25 (Fannie Mae requirement) */}
          {analysis?.dscr && analysis.dscr < 1.25 && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: '12px',
                border: `1px solid ${appleColors.orange[300]}`,
                '& .MuiAlert-icon': { color: appleColors.orange[600] }
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                DSCR Below Lender Threshold
              </Typography>
              <Typography variant="body2">
                Debt Service Coverage Ratio of {analysis.dscr.toFixed(2)}x is below the Fannie Mae requirement of 1.25x.
                This may impact financing approval. Consider increasing down payment or negotiating a lower price.
              </Typography>
            </Alert>
          )}

          {/* Alert 2: Small Property Warning (<10 units) */}
          {propertyData.units && propertyData.units.length < 10 && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '12px',
                border: `1px solid ${appleColors.blue[300]}`,
                '& .MuiAlert-icon': { color: appleColors.blue[600] }
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Small Multi-Family Property ({propertyData.units.length} units)
              </Typography>
              <Typography variant="body2">
                Properties with fewer than 10 units may have higher vacancy risk and less stable cash flow.
                Ensure strong reserves (6+ months of expenses) and conservative vacancy assumptions.
              </Typography>
            </Alert>
          )}

          {/* Alert 3: High Operating Expense Ratio (>55%) */}
          {analysis?.operatingExpenseRatio && analysis.operatingExpenseRatio > 55 && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: '12px',
                border: `1px solid ${appleColors.orange[300]}`,
                '& .MuiAlert-icon': { color: appleColors.orange[600] }
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                High Operating Expense Ratio
              </Typography>
              <Typography variant="body2">
                Operating Expense Ratio of {analysis.operatingExpenseRatio.toFixed(1)}% exceeds the 55% threshold for well-managed properties.
                Review expense breakdown for cost reduction opportunities or verify expense accuracy.
              </Typography>
            </Alert>
          )}
        </Box>
      )}

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
                  {/* AI-Enhanced Reasoning (80/20 approach) - Issue #78/#79 Fix: Use goalBasedReasoning */}
                  {investmentDecision.goalBasedReasoning ? (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                          Professional Analysis
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                          {investmentDecision.goalBasedReasoning}
                        </Typography>
                      </Grid>
                    </>
                  ) : investmentDecision.aiEnhancedContent?.reasoning ? (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                          Professional Analysis
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                          {investmentDecision.aiEnhancedContent.reasoning.explanation}
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: appleColors.gray[600], mb: 3 }}>
                          {investmentDecision.aiEnhancedContent.reasoning.verdict}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <OpportunityIcon sx={{ mr: 1, color: appleColors.green[600] }} />
                          Key Strengths
                        </Typography>
                        <List dense>
                          {investmentDecision.aiEnhancedContent.reasoning.keyStrengths.map((strength, index) => {
                            // Issue #14 Fix: Detect and transform misleading "Cash Flow scored" messaging
                            const monthlyCashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
                            const isCashFlowStrength = /cash flow score.*?100\/100/i.test(strength);
                            const hasNegativeCashFlow = monthlyCashFlow < 0;

                            // Skip misleading cash flow strength if negative cash flow
                            if (isCashFlowStrength && hasNegativeCashFlow) {
                              return null;
                            }

                            return (
                              <ListItem key={index} sx={{ pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <CheckCircle sx={{ fontSize: 20, color: appleColors.green[500] }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={strength}
                                  slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
                                />
                              </ListItem>
                            );
                          })}

                          {/* Issue #14 Fix: Add clarified Total Return strength for negative cash flow properties */}
                          {(() => {
                            const monthlyCashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
                            const hasCashFlowStrength = investmentDecision.aiEnhancedContent?.reasoning?.keyStrengths?.some(
                              s => /cash flow score.*?100\/100/i.test(s)
                            ) ?? false;

                            if (hasCashFlowStrength && monthlyCashFlow < 0) {
                              // Extract score from original messaging
                              const originalStrength = investmentDecision.aiEnhancedContent?.reasoning?.keyStrengths?.find(
                                s => /cash flow score.*?100\/100/i.test(s)
                              );
                              const scoreMatch = originalStrength?.match(/(\d+)\/100/);
                              const score = scoreMatch ? scoreMatch[1] : '100';

                              const appreciation = analysis?.longTermAnalysis?.totalAppreciation ?? 0;
                              const cumulativeCashFlow = analysis?.longTermAnalysis?.totalCashFlow ?? 0;

                              return (
                                <ListItem sx={{ pl: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <CheckCircle sx={{ fontSize: 20, color: appleColors.green[500] }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`Total Return scored ${score}/100, indicating strong appreciation potential over 10 years (${formatCurrency(appreciation)} appreciation + equity paydown), despite negative monthly operating cash flow of ${formatCurrency(Math.abs(monthlyCashFlow))} requiring ${formatCurrency(Math.abs(cumulativeCashFlow))} cumulative subsidy.`}
                                    slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
                                  />
                                </ListItem>
                              );
                            }
                            return null;
                          })()}
                        </List>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <RiskIcon sx={{ mr: 1, color: appleColors.orange[600] }} />
                          Key Concerns
                        </Typography>
                        <List dense>
                          {investmentDecision.aiEnhancedContent.reasoning.keyConcerns.map((concern, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <Warning sx={{ fontSize: 20, color: appleColors.orange[500] }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={concern}
                                slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
                              />
                            </ListItem>
                          ))}

                          {/* Issue #14 Fix: Add negative cash flow to concerns if present */}
                          {(() => {
                            const monthlyCashFlow = analysis?.monthlyAnalysis?.cashFlow ?? 0;
                            if (monthlyCashFlow < 0) {
                              const cumulativeCashFlow = analysis?.longTermAnalysis?.totalCashFlow ?? 0;
                              return (
                                <ListItem sx={{ pl: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Warning sx={{ fontSize: 20, color: appleColors.orange[500] }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`Negative Operating Cash Flow: ${formatCurrency(Math.abs(monthlyCashFlow))}/month requires ongoing capital subsidy (${formatCurrency(Math.abs(cumulativeCashFlow))} over 10 years).`}
                                    slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
                                  />
                                </ListItem>
                              );
                            }
                            return null;
                          })()}
                        </List>
                      </Grid>
                    </>
                  ) : (
                    // Fallback to original content if AI enhancement unavailable
                    <>
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
                                slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
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
                                slotProps={{ primary: { fontSize: '14px', fontWeight: 500 } }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </>
                  )}
                </Grid>
              )}

              {activeDetailTab === 'professional' && investmentDecision.professionalAssessment && (
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 1, color: appleColors.primary[600] }} />
                    V3.0 Professional Investment Assessment
                  </Typography>
                  
                  {/* Multi-Dimensional Overview */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 3, backgroundColor: appleColors.green[50], borderRadius: '12px', border: `2px solid ${appleColors.green[200]}` }}>
                        <Typography variant="h4" fontWeight={700} color={appleColors.green[700]}>
                          {investmentDecision.professionalAssessment.dealQuality}
                        </Typography>
                        <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                          Deal Quality (0-100)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '12px', color: appleColors.gray[700] }}>
                          Weighted assessment of investment fundamentals
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 3, backgroundColor: appleColors.blue[50], borderRadius: '12px', border: `2px solid ${appleColors.blue[200]}` }}>
                        <Typography variant="h4" fontWeight={700} color={appleColors.blue[700]}>
                          {100 - investmentDecision.professionalAssessment.executionDifficulty}
                        </Typography>
                        <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                          Execution Ease (0-100)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '12px', color: appleColors.gray[700] }}>
                          How easy this investment is to execute
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 3, backgroundColor: appleColors.blue[50], borderRadius: '12px', border: `2px solid ${appleColors.blue[200]}` }}>
                        <Typography variant="h4" fontWeight={700} color={appleColors.blue[700]}>
                          {investmentDecision.professionalAssessment.dataReliability}
                        </Typography>
                        <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                          Data Reliability (0-100)
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '12px', color: appleColors.gray[700] }}>
                          Quality and completeness of input data
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Professional Insight */}
                  <Alert severity="info" sx={{ mb: 4, borderRadius: '12px' }}>
                    <Typography variant="body1" fontWeight={500}>
                      {investmentDecision.professionalAssessment.primaryInsight}
                    </Typography>
                  </Alert>
                  
                  {/* Professional Factor Breakdown */}
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Professional Factor Weighting
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                      { name: 'Cash Flow', weight: 35, rawScore: investmentDecision.professionalAssessment.cashFlowScore, color: appleColors.green[600] },
                      { name: 'IRR', weight: 25, rawScore: investmentDecision.professionalAssessment.irrScore, color: appleColors.blue[600] },
                      { name: 'Market Strength', weight: 15, rawScore: investmentDecision.professionalAssessment.marketStrengthScore, color: appleColors.blue[700] },
                      { name: 'Debt Structure', weight: 10, rawScore: investmentDecision.professionalAssessment.debtStructureScore, color: appleColors.orange[600] },
                      { name: 'Exit Strategy', weight: 10, rawScore: investmentDecision.professionalAssessment.exitStrategyScore, color: appleColors.orange[500] },
                      { name: 'Cap Rate', weight: 3, rawScore: investmentDecision.professionalAssessment.capRateScore, color: appleColors.red[600] },
                      { name: 'Property Risk', weight: 2, rawScore: investmentDecision.professionalAssessment.propertyRiskScore, color: appleColors.gray[600] }
                    ]
                      // Issues #232 + #233 (2026-07-07): hide factors whose
                      // score is NaN/null — the engine deliberately emits
                      // non-finite for factors its framework doesn't score
                      // for the current strategy (e.g., IRR + Cap Rate on
                      // BRRRR). Showing 0/100 for an unscored factor reads
                      // as "your deal has zero IRR" (catastrophic misread).
                      .filter((f) => Number.isFinite(f.rawScore))
                      .map((f) => ({ ...f, score: Math.round(f.rawScore) }))
                      .map((factor) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={factor.name}>
                        <Box sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {factor.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                              {factor.weight}% weight
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box 
                              sx={{ 
                                flex: 1,
                                height: 8,
                                backgroundColor: appleColors.gray[200],
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{
                                  height: '100%',
                                  width: `${factor.score}%`,
                                  backgroundColor: factor.color,
                                  borderRadius: '4px'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: factor.color, minWidth: '40px' }}>
                              {factor.score}/100
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" sx={{ color: appleColors.gray[600], mt: 0.5, display: 'block' }}>
                            Contributes: {((factor.score * factor.weight) / 100).toFixed(1)} points
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* Professional Recommendations */}
                  {(investmentDecision.professionalAssessment.strategicRecommendations.length > 0 ||
                    investmentDecision.professionalAssessment.riskMitigation.length > 0 ||
                    investmentDecision.professionalAssessment.opportunityMaximization.length > 0) && (
                    <Grid container spacing={3}>
                      {investmentDecision.professionalAssessment.strategicRecommendations.length > 0 && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <ActionIcon sx={{ mr: 1, color: appleColors.blue[600] }} />
                            Strategic Actions
                          </Typography>
                          <List dense>
                            {investmentDecision.professionalAssessment.strategicRecommendations.map((rec, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CheckCircle fontSize="small" sx={{ color: appleColors.blue[600] }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={rec}
                                  primaryTypographyProps={{ 
                                    fontSize: '14px',
                                    color: appleColors.gray[700]
                                  }} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}
                      
                      {investmentDecision.professionalAssessment.riskMitigation.length > 0 && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <RiskIcon sx={{ mr: 1, color: appleColors.orange[600] }} />
                            Risk Mitigation
                          </Typography>
                          <List dense>
                            {investmentDecision.professionalAssessment.riskMitigation.map((risk, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <Warning fontSize="small" sx={{ color: appleColors.orange[600] }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={risk}
                                  primaryTypographyProps={{ 
                                    fontSize: '14px',
                                    color: appleColors.gray[700]
                                  }} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}
                      
                      {investmentDecision.professionalAssessment.opportunityMaximization.length > 0 && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <OpportunityIcon sx={{ mr: 1, color: appleColors.green[600] }} />
                            Opportunities
                          </Typography>
                          <List dense>
                            {investmentDecision.professionalAssessment.opportunityMaximization.map((opp, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <OpportunityIcon fontSize="small" sx={{ color: appleColors.green[600] }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={opp}
                                  primaryTypographyProps={{ 
                                    fontSize: '14px',
                                    color: appleColors.gray[700]
                                  }} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}
                    </Grid>
                  )}
                  
                  {/* Enhanced Debt Structure Analysis */}
                  {investmentDecision.professionalAssessment.debtAnalysis && (
                    <Box sx={{ mt: 4, p: 3, backgroundColor: appleColors.gray[50], borderRadius: '12px' }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                        <CapitalIcon sx={{ mr: 1, color: appleColors.blue[600] }} />
                        Professional Debt Structure Analysis
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                                DSCR
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {investmentDecision.professionalAssessment.debtAnalysis.dscr.toFixed(2)}x
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                                Interest Rate
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {(investmentDecision.professionalAssessment.debtAnalysis.interestRate * 100).toFixed(2)}%
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                                Market Spread
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {investmentDecision.professionalAssessment.debtAnalysis.marketSpread.toFixed(0)} bps
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                                Leverage
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {(investmentDecision.professionalAssessment.debtAnalysis.leverageRatio * 100).toFixed(1)}%
                              </Typography>
                            </Grid>
                          </Grid>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                            Loan Structure
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {investmentDecision.professionalAssessment.debtAnalysis.loanTerm} years
                            {investmentDecision.professionalAssessment.debtAnalysis.isBalloonLoan && 
                              ` (${investmentDecision.professionalAssessment.debtAnalysis.balloonYears}yr balloon)`
                            }
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {(investmentDecision.professionalAssessment.debtAnalysis.strengthFactors.length > 0 ||
                        investmentDecision.professionalAssessment.debtAnalysis.riskFactors.length > 0) && (
                        <Grid container spacing={3} sx={{ mt: 2 }}>
                          {investmentDecision.professionalAssessment.debtAnalysis.strengthFactors.length > 0 && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: appleColors.green[700], mb: 1 }}>
                                Debt Strengths:
                              </Typography>
                              {investmentDecision.professionalAssessment.debtAnalysis.strengthFactors.map((strength, index) => (
                                <Typography key={index} variant="body2" sx={{ color: appleColors.gray[700], fontSize: '13px', mb: 0.5 }}>
                                  + {strength}
                                </Typography>
                              ))}
                            </Grid>
                          )}
                          
                          {investmentDecision.professionalAssessment.debtAnalysis.riskFactors.length > 0 && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: appleColors.orange[700], mb: 1 }}>
                                Debt Risk Factors:
                              </Typography>
                              {investmentDecision.professionalAssessment.debtAnalysis.riskFactors.map((risk, index) => (
                                <Typography key={index} variant="body2" sx={{ color: appleColors.gray[700], fontSize: '13px', mb: 0.5 }}>
                                  - {risk}
                                </Typography>
                              ))}
                            </Grid>
                          )}
                        </Grid>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {activeDetailTab === 'portfolio' && investmentDecision.portfolioContext && (
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1, color: appleColors.blue[600] }} />
                    Portfolio Context Analysis
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ p: 3, backgroundColor: appleColors.blue[50], borderRadius: '12px', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: appleColors.blue[800] }}>
                          Target Portfolio
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {investmentDecision.portfolioContext.portfolioName}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Current Properties:</strong> {investmentDecision.portfolioContext.currentProperties}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Primary Goal:</strong> {investmentDecision.portfolioContext.portfolioGoal}
                          </Typography>
                        </Stack>
                      </Card>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ p: 3, backgroundColor: appleColors.green[50], borderRadius: '12px', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: appleColors.green[800] }}>
                          Portfolio Fit Analysis
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {formatPortfolioFitText(investmentDecision.portfolioContext.fitAnalysis)}
                        </Typography>
                      </Card>
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          backgroundColor: appleColors.gray[50],
                          border: `1px solid ${appleColors.gray[200]}`,
                          borderRadius: '12px'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Portfolio Impact
                        </Typography>
                        <Typography variant="body2">
                          {investmentDecision.portfolioContext.impactSummary}
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeDetailTab === 'actions' && (
                <Box>
                  {/* Issue #15 Fix: AI-Enhanced Action Plan with fallback */}
                  {investmentDecision.aiEnhancedContent?.actionPlan ? (
                    <>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                        Strategic Action Plan
                      </Typography>
                      
                      {/* Immediate Actions */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.red[600] }}>
                          🚨 Immediate Actions (24-48 hours)
                        </Typography>
                        <Stack spacing={1}>
                          {investmentDecision.aiEnhancedContent.actionPlan.immediateActions.map((action, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Box sx={{ 
                                minWidth: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: appleColors.red[500],
                                mt: '6px',
                                mr: 2
                              }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {action}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Negotiation Focus with Sensitivity Analysis */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.blue[600] }}>
                          🎯 Negotiation Strategy
                        </Typography>
                        
                        {/* Sensitivity Analysis Summary */}
                        {investmentDecision.sensitivityAnalysis && (
                          <Card sx={{ p: 2, mb: 2, backgroundColor: appleColors.blue[50], borderRadius: '12px' }}>
                            <Typography variant="caption" sx={{ color: appleColors.blue[700], fontWeight: 600, textTransform: 'uppercase' }}>
                              Deal Sensitivity Analysis
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                              Current Score: {investmentDecision.sensitivityAnalysis.currentScore}/100 
                              • Need {investmentDecision.sensitivityAnalysis.buyThreshold - investmentDecision.sensitivityAnalysis.currentScore} points for BUY
                            </Typography>
                            {investmentDecision.sensitivityAnalysis.pathToBuy.mostRealistic && (
                              <Typography variant="body2" sx={{ mt: 1, color: appleColors.gray[700] }}>
                                <strong>Best Path:</strong> {investmentDecision.sensitivityAnalysis.pathToBuy.mostRealistic.description}
                              </Typography>
                            )}
                          </Card>
                        )}

                        <Stack spacing={1}>
                          {investmentDecision.aiEnhancedContent.actionPlan.negotiationFocus.map((focus, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Box sx={{ 
                                minWidth: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: appleColors.blue[500],
                                mt: '6px',
                                mr: 2
                              }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {focus}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Preparation Items */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.green[600] }}>
                          📋 Preparation Checklist
                        </Typography>
                        <Stack spacing={1}>
                          {investmentDecision.aiEnhancedContent.actionPlan.preparationItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Box sx={{ 
                                minWidth: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: appleColors.green[500],
                                mt: '6px',
                                mr: 2
                              }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Timeline */}
                      <Card sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '12px' }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          ⏱️ Execution Timeline
                        </Typography>
                        <Typography variant="body2" sx={{ color: appleColors.gray[700] }}>
                          {investmentDecision.aiEnhancedContent.actionPlan.timeframe}
                        </Typography>
                      </Card>
                    </>
                  ) : investmentDecision.actionPlan?.length > 0 ? (
                    // Fallback to original action plan if AI enhancement unavailable
                    <>
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
                    </>
                  ) : (
                    // Issue #15 Fix: Fallback content when no action plan available
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: appleColors.blue[50],
                        border: `1px solid ${appleColors.blue[200]}`
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Recommended Next Steps
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Based on the {investmentDecision.verdict} recommendation, here are the key actions to consider:
                      </Typography>
                      <Stack spacing={1}>
                        {investmentDecision.verdict === 'BUY' && (
                          <>
                            <Typography variant="body2">• Schedule property inspection and professional appraisal</Typography>
                            <Typography variant="body2">• Review all Key Concerns in the Reasoning tab carefully</Typography>
                            <Typography variant="body2">• Verify all financial assumptions with actual data</Typography>
                            <Typography variant="body2">• Submit financing application to secure rates</Typography>
                          </>
                        )}
                        {investmentDecision.verdict === 'NEGOTIATE' && (
                          <>
                            <Typography variant="body2">• Focus negotiation on purchase price reduction</Typography>
                            <Typography variant="body2">• Review Key Concerns to identify specific negotiation points</Typography>
                            <Typography variant="body2">• Request seller concessions for inspection items</Typography>
                            <Typography variant="body2">• Explore creative financing to improve returns</Typography>
                          </>
                        )}
                        {investmentDecision.verdict === 'PASS' && (
                          <>
                            <Typography variant="body2">• Review Key Concerns to understand why this property doesn't meet criteria</Typography>
                            <Typography variant="body2">• Consider expanding search to different neighborhoods or property types</Typography>
                            <Typography variant="body2">• Revisit your investment criteria if patterns emerge across multiple properties</Typography>
                            <Typography variant="body2">• Continue analyzing properties to build deal recognition skills</Typography>
                          </>
                        )}
                      </Stack>
                    </Alert>
                  )}
                </Box>
              )}

              {activeDetailTab === 'capital' && (
                <Box>
                  {/* AI-Enhanced Capital Strategy with Professional Financing Analysis */}
                  {investmentDecision.aiEnhancedContent?.capitalStrategy ? (
                    <>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                        Professional Capital Strategy
                      </Typography>
                      
                      {/* Current Assessment */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.blue[600] }}>
                          📊 Current Structure Assessment
                        </Typography>
                        <Card sx={{ p: 2, mb: 2, backgroundColor: appleColors.blue[50], borderRadius: '12px' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {investmentDecision.aiEnhancedContent.capitalStrategy.currentAssessment}
                          </Typography>
                        </Card>
                      </Box>

                      {/* Optimization Approach */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.green[600] }}>
                          ⚙️ Structure Optimization
                        </Typography>
                        <Card sx={{ p: 2, mb: 2, backgroundColor: appleColors.green[50], borderRadius: '12px' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {investmentDecision.aiEnhancedContent.capitalStrategy.optimizedApproach}
                          </Typography>
                        </Card>
                      </Box>

                      {/* Alternative Options */}
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: appleColors.purple[600] }}>
                          💡 Creative Financing Alternatives
                        </Typography>
                        <Stack spacing={1}>
                          {investmentDecision.aiEnhancedContent.capitalStrategy.alternativeOptions.map((option, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Box sx={{ 
                                minWidth: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: appleColors.purple[500],
                                mt: '6px',
                                mr: 2
                              }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {option}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Final Recommendation */}
                      <Alert severity="info" sx={{ borderRadius: '12px' }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          🎯 Professional Recommendation
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {investmentDecision.aiEnhancedContent.capitalStrategy.recommendation}
                        </Typography>
                      </Alert>
                    </>
                  ) : investmentDecision.capitalStrategy?.currentApproach ? (
                    // Fallback to original capital strategy display if AI enhancement unavailable
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
                                {formatPercent(investmentDecision.capitalStrategy.currentApproach.expectedReturn, 1)}%
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
                                {formatPercent(investmentDecision.capitalStrategy.recommendedApproach.expectedReturn, 1)}%
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
                  ) : (
                    // Issue #15 Fix: Final fallback when no capital strategy available at all
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: appleColors.blue[50],
                        border: `1px solid ${appleColors.blue[200]}`
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Capital Deployment Analysis
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Based on the {investmentDecision.verdict} recommendation and financing details:
                      </Typography>

                      {/* Show basic financing info from analysis */}
                      {analysis?.financing?.totalInvestment && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">Total Investment Required</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {formatCurrency(analysis.financing.totalInvestment)}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      {/* Verdict-specific capital recommendations */}
                      <Stack spacing={1}>
                        {investmentDecision.verdict === 'PASS' && (
                          <>
                            <Typography variant="body2">• Deploy capital to better opportunities with higher returns</Typography>
                            <Typography variant="body2">• This property does not meet investment criteria - preserve capital for better deals</Typography>
                            <Typography variant="body2">• Review Professional Analysis tab for detailed scoring breakdown</Typography>
                          </>
                        )}
                        {investmentDecision.verdict === 'NEGOTIATE' && (
                          <>
                            <Typography variant="body2">• Negotiate price reduction to improve cash-on-cash return</Typography>
                            <Typography variant="body2">• Consider increasing down payment to improve DSCR and secure financing</Typography>
                            <Typography variant="body2">• Explore seller financing or creative structures to enhance returns</Typography>
                          </>
                        )}
                        {investmentDecision.verdict === 'BUY' && (
                          <>
                            <Typography variant="body2">• Secure financing at current interest rates before potential increases</Typography>
                            <Typography variant="body2">• Verify down payment and closing cost reserves are available</Typography>
                            <Typography variant="body2">• Review cash flow requirements for ongoing property management</Typography>
                          </>
                        )}
                      </Stack>

                      {/* DSCR warning if applicable */}
                      {analysis?.dscr && analysis.dscr < 1.25 && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            Financing Risk
                          </Typography>
                          <Typography variant="body2">
                            DSCR of {analysis.dscr.toFixed(2)}x is below commercial lender requirements (1.25x minimum).
                            This property may require higher down payment or alternative financing structures.
                          </Typography>
                        </Alert>
                      )}
                    </Alert>
                  )}
                </Box>
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