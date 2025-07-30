import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Build as FixIcon,
  TrendingUp as ImprovementIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  AttachMoney as MoneyIcon,
  Home as PropertyIcon,
  Schedule as TimingIcon,
  Assessment as AnalysisIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';
import PreviewModeComponent from '../common/PreviewModeComponent';
import PreviewMetricCard from '../common/PreviewMetricCard';

interface DealFixerProps {
  propertyData: SFRPropertyData;
  analysis: Analysis;
  onApplyFix: (updatedData: SFRPropertyData, fixDescription: string) => Promise<void>;
  isVisible?: boolean;
}

interface DealFixSuggestion {
  id: string;
  category: 'purchase' | 'financing' | 'income' | 'expenses' | 'timing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'hard';
  costEstimate: string;
  timeframe: string;
  expectedImprovement: {
    cashFlow: number;
    cocReturn: number;
    score: number;
  };
  updatedData: Partial<SFRPropertyData>;
  reasoning: string;
  risks: string[];
  pros: string[];
  cons: string[];
}

const DealFixer: React.FC<DealFixerProps> = ({
  propertyData,
  analysis,
  onApplyFix,
  isVisible = true
}) => {
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [expandedFix, setExpandedFix] = useState<string | null>(null);
  const [previewMetrics, setPreviewMetrics] = useState<any>(null);

  // Calculate current deal score and identify issues
  const currentScore = analysis?.aiInsights?.investmentScore || 0;
  const isDealPoor = currentScore < 55;
  const currentCashFlow = analysis?.monthlyAnalysis?.cashFlow || 0;
  const currentCoCReturn = analysis?.keyMetrics?.cashOnCashReturn || 0;
  const currentDSCR = analysis?.keyMetrics?.dscr || 0;

  // Generate deal fix suggestions based on analysis
  const suggestions = useMemo<DealFixSuggestion[]>(() => {
    const fixes: DealFixSuggestion[] = [];

    // Only show fixer if deal needs improvement
    if (!isDealPoor) return fixes;

    // Purchase Price Reduction
    if (currentCashFlow < 200) {
      const priceReduction = Math.min(50000, propertyData.purchasePrice * 0.15);
      const newPrice = propertyData.purchasePrice - priceReduction;
      
      fixes.push({
        id: 'reduce-purchase-price',
        category: 'purchase',
        title: 'Negotiate Purchase Price Down',
        description: `Reduce purchase price by $${priceReduction.toLocaleString()} to improve cash flow`,
        impact: 'high',
        difficulty: 'moderate',
        costEstimate: 'Negotiation time',
        timeframe: '1-2 weeks',
        expectedImprovement: {
          cashFlow: Math.round(priceReduction * 0.0035), // Rough mortgage payment impact
          cocReturn: 2.5,
          score: 15
        },
        updatedData: { purchasePrice: newPrice },
        reasoning: 'Lower purchase price reduces mortgage payments and improves cash flow metrics',
        risks: ['Seller may reject', 'May indicate overpriced market'],
        pros: ['Immediate cash flow improvement', 'Better entry point', 'Increased equity buffer'],
        cons: ['Requires successful negotiation', 'May delay closing']
      });
    }

    // Down Payment Optimization
    if (currentCoCReturn < 8 && propertyData.downPayment > propertyData.purchasePrice * 0.2) {
      const optimizedDP = Math.round(propertyData.purchasePrice * 0.2);
      const cashFreed = propertyData.downPayment - optimizedDP;
      
      fixes.push({
        id: 'optimize-down-payment',
        category: 'financing',
        title: 'Optimize Down Payment',
        description: `Reduce down payment to 20% and free up $${cashFreed.toLocaleString()} cash`,
        impact: 'medium',
        difficulty: 'easy',
        costEstimate: 'Possible PMI (~$100-200/mo)',
        timeframe: 'Immediate',
        expectedImprovement: {
          cashFlow: -150, // PMI impact
          cocReturn: 4.2,
          score: 8
        },
        updatedData: { downPayment: optimizedDP },
        reasoning: 'Leveraging more debt can improve cash-on-cash returns despite higher monthly costs',
        risks: ['PMI required', 'Higher monthly payments', 'Less equity buffer'],
        pros: ['Frees up capital', 'Better leverage', 'Improved CoC returns'],
        cons: ['Monthly PMI cost', 'Higher risk profile']
      });
    }

    // Rent Increase Potential
    if (currentCashFlow < 300) {
      const rentIncrease = Math.round(propertyData.monthlyRent * 0.1);
      
      fixes.push({
        id: 'increase-rent',
        category: 'income',
        title: 'Market Rent Analysis & Increase',
        description: `Research shows potential for $${rentIncrease}/month rent increase`,
        impact: 'high',
        difficulty: 'easy',
        costEstimate: '$200-500 (market analysis)',
        timeframe: '1-3 months',
        expectedImprovement: {
          cashFlow: Math.round(rentIncrease * 0.92), // After vacancy
          cocReturn: 1.8,
          score: 12
        },
        updatedData: { monthlyRent: propertyData.monthlyRent + rentIncrease },
        reasoning: 'Market analysis may reveal rent is below comparable properties',
        risks: ['Tenant turnover', 'Market resistance', 'Vacancy period'],
        pros: ['Direct income increase', 'Better market positioning', 'Compound annual benefit'],
        cons: ['May require tenant search', 'Market dependent']
      });
    }

    // Property Tax Appeal
    if (propertyData.propertyTaxRate > 1.5) {
      const taxReduction = propertyData.propertyTaxRate * 0.2;
      const newTaxRate = propertyData.propertyTaxRate - taxReduction;
      
      fixes.push({
        id: 'appeal-property-tax',
        category: 'expenses',
        title: 'Property Tax Appeal',
        description: `Contest property tax assessment to reduce by ${(taxReduction * 100).toFixed(1)}%`,
        impact: 'medium',
        difficulty: 'moderate',
        costEstimate: '$500-1,500 (attorney fees)',
        timeframe: '3-6 months',
        expectedImprovement: {
          cashFlow: Math.round((propertyData.purchasePrice * taxReduction / 100) / 12),
          cocReturn: 0.8,
          score: 6
        },
        updatedData: { propertyTaxRate: newTaxRate },
        reasoning: 'High property tax rate may be based on outdated or incorrect assessment',
        risks: ['Appeal may fail', 'Legal costs', 'Time intensive'],
        pros: ['Permanent savings', 'Often successful', 'Professional assistance available'],
        cons: ['Upfront costs', 'No guarantee', 'Bureaucratic process']
      });
    }

    // Self-Management Option
    if (propertyData.propertyManagementRate > 0) {
      fixes.push({
        id: 'self-manage',
        category: 'expenses',
        title: 'Self-Management Strategy',
        description: `Eliminate ${propertyData.propertyManagementRate}% management fee through self-management`,
        impact: 'medium',
        difficulty: 'hard',
        costEstimate: 'Time investment',
        timeframe: 'Next lease cycle',
        expectedImprovement: {
          cashFlow: Math.round(propertyData.monthlyRent * (propertyData.propertyManagementRate / 100)),
          cocReturn: 1.2,
          score: 7
        },
        updatedData: { propertyManagementRate: 0 },
        reasoning: 'Eliminating management fees directly improves cash flow',
        risks: ['Time commitment', 'Learning curve', 'Tenant issues', 'Legal compliance'],
        pros: ['Direct cost savings', 'Better tenant control', 'Learning opportunity'],
        cons: ['Significant time investment', 'Stress and responsibility', 'Legal liability']
      });
    }

    // Market Timing Strategy
    if (currentScore < 40) {
      fixes.push({
        id: 'wait-for-market',
        category: 'timing',
        title: 'Market Timing Strategy',
        description: 'Wait for better market conditions or alternative properties',
        impact: 'high',
        difficulty: 'easy',
        costEstimate: 'Opportunity cost',
        timeframe: '3-12 months',
        expectedImprovement: {
          cashFlow: 0,
          cocReturn: 0,
          score: 0
        },
        updatedData: {},
        reasoning: 'Sometimes the best investment decision is to wait for better opportunities',
        risks: ['Missed opportunity', 'Rising prices', 'Analysis paralysis'],
        pros: ['Avoid poor investment', 'Better opportunities may arise', 'Preserve capital'],
        cons: ['No immediate investment', 'Market may improve', 'Opportunity cost']
      });
    }

    return fixes.sort((a, b) => {
      // Sort by expected score improvement
      return b.expectedImprovement.score - a.expectedImprovement.score;
    });
  }, [propertyData, currentCashFlow, currentCoCReturn, currentScore, isDealPoor]);

  // Handle fix selection and calculate preview metrics
  const toggleFixSelection = useCallback(async (fixId: string) => {
    const newSelectedFixes = new Set(selectedFixes);
    if (newSelectedFixes.has(fixId)) {
      newSelectedFixes.delete(fixId);
    } else {
      newSelectedFixes.add(fixId);
    }
    setSelectedFixes(newSelectedFixes);

    // Calculate preview metrics if any fixes are selected
    if (newSelectedFixes.size > 0) {
      const selectedSuggestions = suggestions.filter(s => newSelectedFixes.has(s.id));
      
      // Calculate combined impact for preview
      const combinedCashFlowImprovement = selectedSuggestions.reduce((sum, fix) => 
        sum + fix.expectedImprovement.cashFlow, 0
      );
      const combinedCoCImprovement = selectedSuggestions.reduce((sum, fix) => 
        sum + fix.expectedImprovement.cocReturn, 0
      );
      const combinedScoreImprovement = selectedSuggestions.reduce((sum, fix) => 
        sum + fix.expectedImprovement.score, 0
      );

      // Create preview metrics
      setPreviewMetrics({
        monthlyAnalysis: {
          cashFlow: currentCashFlow + combinedCashFlowImprovement
        },
        keyMetrics: {
          cashOnCashReturn: currentCoCReturn + combinedCoCImprovement,
          capRate: analysis?.keyMetrics?.capRate || 0 // Cap rate doesn't change with these fixes
        },
        aiInsights: {
          investmentScore: Math.min(100, currentScore + combinedScoreImprovement)
        }
      });
    } else {
      setPreviewMetrics(null);
    }
  }, [selectedFixes, suggestions, currentCashFlow, currentCoCReturn, currentScore, analysis]);

  // Apply selected fixes (commit changes)
  const applySelectedFixes = useCallback(async () => {
    if (selectedFixes.size === 0) return;
    
    setIsApplying(true);
    
    try {
      const selectedSuggestions = suggestions.filter(s => selectedFixes.has(s.id));
      
      // Combine all selected fixes into updated property data
      let updatedData = { ...propertyData };
      const fixDescriptions: string[] = [];
      
      selectedSuggestions.forEach(fix => {
        updatedData = { ...updatedData, ...fix.updatedData };
        fixDescriptions.push(fix.title);
      });
      
      const combinedDescription = `Applied fixes: ${fixDescriptions.join(', ')}`;
      await onApplyFix(updatedData, combinedDescription);
      
      // Clear selections and preview after successful application
      setSelectedFixes(new Set());
      setPreviewMetrics(null);
    } catch (error) {
      console.error('Error applying fixes:', error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedFixes, suggestions, propertyData, onApplyFix]);

  // Discard selected fixes (reset to no selection)
  const discardSelectedFixes = useCallback(() => {
    setSelectedFixes(new Set());
    setPreviewMetrics(null);
  }, []);

  // Calculate combined impact
  const combinedImpact = useMemo(() => {
    const selectedSuggestions = suggestions.filter(s => selectedFixes.has(s.id));
    return selectedSuggestions.reduce((acc, fix) => ({
      cashFlow: acc.cashFlow + fix.expectedImprovement.cashFlow,
      cocReturn: acc.cocReturn + fix.expectedImprovement.cocReturn,
      score: acc.score + fix.expectedImprovement.score
    }), { cashFlow: 0, cocReturn: 0, score: 0 });
  }, [suggestions, selectedFixes]);

  // Don't show component if deal is already good
  if (!isVisible || !isDealPoor || suggestions.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'purchase': return <PropertyIcon />;
      case 'financing': return <MoneyIcon />;
      case 'income': return <ImprovementIcon />;
      case 'expenses': return <AnalysisIcon />;
      case 'timing': return <TimingIcon />;
      default: return <FixIcon />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return appleColors.success[500];
      case 'medium': return appleColors.warning[500];
      case 'low': return appleColors.gray[500];
      default: return appleColors.gray[400];
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return appleColors.success[500];
      case 'moderate': return appleColors.warning[500];
      case 'hard': return appleColors.error[500];
      default: return appleColors.gray[400];
    }
  };

  return (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FixIcon sx={{ color: appleColors.warning[500], fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: appleColors.gray[900] }}>
                Deal Optimization Suggestions
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Current score: {currentScore}/100 - Here's how to improve this deal
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Current Issues Alert */}
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: '12px' }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Deal Issues Identified:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {currentCashFlow < 100 && (
              <Chip size="small" label={`Low Cash Flow: $${currentCashFlow.toFixed(0)}/mo`} color="warning" />
            )}
            {currentCoCReturn < 6 && (
              <Chip size="small" label={`Low CoC Return: ${currentCoCReturn.toFixed(1)}%`} color="warning" />
            )}
            {currentDSCR < 1.2 && (
              <Chip size="small" label={`Poor DSCR: ${currentDSCR.toFixed(2)}`} color="warning" />
            )}
          </Stack>
        </Alert>

        {/* Selected Fixes Summary */}
        {selectedFixes.size > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: appleColors.primary[50], borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Selected Improvements Impact:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip 
                size="small" 
                label={`Cash Flow: +$${combinedImpact.cashFlow}/mo`} 
                color="primary" 
              />
              <Chip 
                size="small" 
                label={`CoC Return: +${combinedImpact.cocReturn.toFixed(1)}%`} 
                color="primary" 
              />
              <Chip 
                size="small" 
                label={`Score: +${combinedImpact.score} points`} 
                color="primary" 
              />
            </Stack>
          </Box>
        )}

        {/* Suggestions List */}
        <Box sx={{ mb: 3 }}>
          {suggestions.map((suggestion) => (
            <Accordion 
              key={suggestion.id}
              expanded={expandedFix === suggestion.id}
              onChange={() => setExpandedFix(expandedFix === suggestion.id ? null : suggestion.id)}
              sx={{ 
                mb: 1, 
                borderRadius: '12px !important',
                border: selectedFixes.has(suggestion.id) ? `2px solid ${appleColors.primary[300]}` : `1px solid ${appleColors.gray[200]}`,
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFixSelection(suggestion.id);
                    }}
                    sx={{ color: selectedFixes.has(suggestion.id) ? appleColors.primary[500] : appleColors.gray[400] }}
                  >
                    {selectedFixes.has(suggestion.id) ? <CheckIcon /> : <UncheckedIcon />}
                  </IconButton>
                  
                  <Box sx={{ mr: 2 }}>
                    {getCategoryIcon(suggestion.category)}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {suggestion.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                      {suggestion.description}
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      size="small" 
                      label={suggestion.impact} 
                      sx={{ 
                        bgcolor: `${getImpactColor(suggestion.impact)}20`,
                        color: getImpactColor(suggestion.impact)
                      }} 
                    />
                    <Chip 
                      size="small" 
                      label={suggestion.difficulty} 
                      sx={{ 
                        bgcolor: `${getDifficultyColor(suggestion.difficulty)}20`,
                        color: getDifficultyColor(suggestion.difficulty)
                      }} 
                    />
                  </Stack>
                </Stack>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ pl: 6 }}>
                  <Typography variant="body2" sx={{ mb: 2, color: appleColors.gray[700] }}>
                    {suggestion.reasoning}
                  </Typography>
                  
                  <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: appleColors.gray[600] }}>
                        Expected Impact:
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Cash Flow: +${suggestion.expectedImprovement.cashFlow}/mo
                        </Typography>
                        <Typography variant="body2">
                          CoC Return: +{suggestion.expectedImprovement.cocReturn.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Score: +{suggestion.expectedImprovement.score} points
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: appleColors.gray[600] }}>
                        Implementation:
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Cost: {suggestion.costEstimate}
                        </Typography>
                        <Typography variant="body2">
                          Timeframe: {suggestion.timeframe}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                  
                  {suggestion.pros.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: appleColors.success[600] }}>
                        Pros:
                      </Typography>
                      <List dense>
                        {suggestion.pros.map((pro, index) => (
                          <ListItem key={index} sx={{ py: 0, pl: 2 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <CheckIcon sx={{ fontSize: 16, color: appleColors.success[500] }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={pro} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {suggestion.risks.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: appleColors.error[600] }}>
                        Risks & Considerations:
                      </Typography>
                      <List dense>
                        {suggestion.risks.map((risk, index) => (
                          <ListItem key={index} sx={{ py: 0, pl: 2 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <WarningIcon sx={{ fontSize: 16, color: appleColors.warning[500] }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={risk} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Preview Mode for Selected Fixes */}
        {selectedFixes.size > 0 && previewMetrics && (
          <PreviewModeComponent
            hasUnsavedChanges={selectedFixes.size > 0}
            onApplyChanges={applySelectedFixes}
            onDiscardChanges={discardSelectedFixes}
            featureName="Deal Optimizer"
            description={`Preview shows projected results from ${selectedFixes.size} selected fix${selectedFixes.size > 1 ? 'es' : ''}. Apply to update your full analysis.`}
            isCalculating={isApplying}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PreviewMetricCard
                  value={`$${(previewMetrics.monthlyAnalysis?.cashFlow || 0).toFixed(0)}/mo`}
                  label="Monthly Cash Flow (After Fixes)"
                  isPreview={true}
                  valueColor={(previewMetrics.monthlyAnalysis?.cashFlow || 0) >= 0 ? appleColors.success[600] : appleColors.error[600]}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PreviewMetricCard
                  value={`${(previewMetrics.keyMetrics?.cashOnCashReturn || 0).toFixed(1)}%`}
                  label="Cash-on-Cash Return (After Fixes)"
                  isPreview={true}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PreviewMetricCard
                  value={`${(previewMetrics.keyMetrics?.capRate || 0).toFixed(2)}%`}
                  label="Cap Rate"
                  isPreview={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PreviewMetricCard
                  value={`${Math.round(previewMetrics.aiInsights?.investmentScore || 0)}/100`}
                  label="AI Investment Score (After Fixes)"
                  isPreview={true}
                  valueColor={(previewMetrics.aiInsights?.investmentScore || 0) >= 70 ? appleColors.success[600] : (previewMetrics.aiInsights?.investmentScore || 0) >= 50 ? appleColors.warning[600] : appleColors.error[600]}
                />
              </Grid>
            </Grid>
          </PreviewModeComponent>
        )}
      </CardContent>
    </Card>
  );
};

export default DealFixer;