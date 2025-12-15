/**
 * Step 0: Investment Strategy Selection
 *
 * Phase 1: Universal Simple - Simplified strategy selection moved to wizard start
 *
 * Key Changes from GoalsStrategyStep:
 * - Visual StrategyCard components instead of dropdowns
 * - Only 3 strategies: Buy & Hold, House Hack, BRRRR (Coming Soon)
 * - Preserved AI-enhanced free text strategy from original
 * - Simplified UI focused on novice investors
 * - Moved to Step 0 (first step) instead of Step 5
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Apartment as HouseHackIcon,
  Refresh as BRRRRIcon,
  Lightbulb as InsightIcon,
  AutoFixHigh as EnhancementIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { StrategyCard, type InvestmentStrategy } from '../common/StrategyCard';
import { TapToExpandField } from '../common/TapToExpandField';
import { SimplePortfolioSelector } from './SimplePortfolioSelector';
import type { EnhancedGoalContext } from './GoalsStrategyStep';

interface StrategySelectionStepProps {
  /** Selected strategy */
  strategy?: InvestmentStrategy;

  /** Callback when strategy changes */
  onStrategyChange: (strategy: InvestmentStrategy) => void;

  /** Enhanced goals (includes AI analysis) */
  enhancedGoals?: EnhancedGoalContext;

  /** Callback when enhanced goals change */
  onEnhancedGoalsChange?: (goals: EnhancedGoalContext) => void;

  /** Portfolio context (Option B: Portfolio in wizard Step 0) */
  selectedPortfolioId?: string | null;

  /** Callback when portfolio changes */
  onPortfolioChange?: (portfolioId: string | null) => void;
}

const StrategySelectionStep: React.FC<StrategySelectionStepProps> = ({
  strategy,
  onStrategyChange,
  enhancedGoals,
  onEnhancedGoalsChange,
  selectedPortfolioId,
  onPortfolioChange
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Check if we have enhanced insights
  const hasEnhancement = !!(
    enhancedGoals?.aiEnhancedStrategy ||
    (enhancedGoals?.strategicInsights && enhancedGoals.strategicInsights.length > 0)
  );

  const handleFreeTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const freeText = event.target.value;

    if (onEnhancedGoalsChange) {
      onEnhancedGoalsChange({
        ...enhancedGoals,
        freeTextStrategy: freeText
      });
    }

    // Trigger analysis if text is substantial
    if (freeText.length > 50 && !isAnalyzing) {
      analyzeGoalsDebounced(freeText);
    }
  };

  // Debounced goal analysis (preserve existing AI functionality)
  const analyzeGoalsDebounced = React.useCallback(
    debounce(async (freeText: string) => {
      if (freeText.length < 20 || !onEnhancedGoalsChange) return;

      setIsAnalyzing(true);

      try {
        const response = await fetch('/api/deals/analyze-goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            structuredGoals: {
              // Include selected strategy in AI analysis
              strategy,
              exitStrategy: enhancedGoals?.exitStrategy,
              portfolioStrategy: enhancedGoals?.portfolioStrategy,
              experienceLevel: enhancedGoals?.experienceLevel,
              riskTolerance: enhancedGoals?.riskTolerance
            },
            freeTextStrategy: freeText
          })
        });

        if (response.ok) {
          const result = await response.json();
          const aiEnhancedGoals = result.data.enhancedGoals;

          onEnhancedGoalsChange({
            ...enhancedGoals,
            ...aiEnhancedGoals
          });

          setAnalysisComplete(true);
        }
      } catch (error) {
        console.error('Goal analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 2000),
    [strategy, enhancedGoals, onEnhancedGoalsChange]
  );

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: appleColors.gray[900] }}>
        Choose Your Investment Strategy
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: appleColors.gray[700] }}>
        Select the strategy that best fits your investment goals
      </Typography>

      {/* Strategy Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StrategyCard
            strategy="buy-hold"
            title="Buy & Hold"
            description="Traditional long-term rental strategy for steady cash flow and appreciation"
            icon={<HomeIcon />}
            selected={strategy === 'buy-hold'}
            onSelect={() => onStrategyChange('buy-hold')}
            badgeText="Most Popular"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StrategyCard
            strategy="house-hack"
            title="House Hacking"
            description="Live in one unit while renting others to offset your housing costs"
            icon={<HouseHackIcon />}
            selected={strategy === 'house-hack'}
            onSelect={() => {}} // Disabled in Phase 1
            comingSoon={true}
            badgeText="Coming Soon"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StrategyCard
            strategy="brrrr"
            title="BRRRR"
            description="Buy, Rehab, Rent, Refinance, Repeat - Build portfolio with recycled capital"
            icon={<BRRRRIcon />}
            selected={strategy === 'brrrr'}
            onSelect={() => {}} // Disabled in Phase 1
            comingSoon={true}
            badgeText="Coming Soon"
          />
        </Grid>
      </Grid>

      {/* FIX Issue #26 (Option B): Portfolio selector in wizard Step 0 - Progressive disclosure */}
      {onPortfolioChange && (
        <Box sx={{ mb: 4 }}>
          <TapToExpandField
            label="Track in Portfolio (Optional)"
            helperText="Add this property to a portfolio for tracking and context-aware analysis"
            displayValue={selectedPortfolioId ? "Portfolio selected" : "Analyze without portfolio context"}
            defaultExpanded={false}
          >
            <Box sx={{ pt: 2 }}>
              <SimplePortfolioSelector
                selectedPortfolioId={selectedPortfolioId}
                onPortfolioSelected={onPortfolioChange}
                compact={true}
              />
            </Box>
          </TapToExpandField>
        </Box>
      )}

      {/* Free Text Strategy Section (Optional - Preserve existing AI functionality) */}
      {onEnhancedGoalsChange && (
        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            border: `2px solid ${appleColors.primary[100]}`,
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AIIcon sx={{ mr: 1, color: appleColors.primary[600] }} />
            <Typography variant="h6" fontWeight={600} sx={{ color: appleColors.gray[800] }}>
              Tell Us More (Optional)
            </Typography>
            <Chip
              label="AI Enhanced"
              size="small"
              sx={{
                ml: 2,
                backgroundColor: appleColors.primary[100],
                color: appleColors.primary[700]
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 2, color: appleColors.gray[600] }}>
            Describe your specific investment approach, timeline, or unique goals. Our AI will
            provide personalized insights throughout your analysis.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Example: I want to start with house hacking a duplex in Austin, then scale to 5 rental properties over 3 years..."
            value={enhancedGoals?.freeTextStrategy || ''}
            onChange={handleFreeTextChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />

          {/* Analysis Status */}
          {isAnalyzing && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 2,
                p: 2,
                backgroundColor: appleColors.primary[50],
                borderRadius: '8px'
              }}
            >
              <CircularProgress size={20} sx={{ mr: 2, color: appleColors.primary[600] }} />
              <Typography variant="body2" color={appleColors.primary[700]}>
                AI analyzing your strategy...
              </Typography>
            </Box>
          )}

          {analysisComplete && !isAnalyzing && (
            <Alert
              icon={<EnhancementIcon />}
              severity="success"
              sx={{ mt: 2, borderRadius: '8px' }}
            >
              Strategy analysis complete! Your personalized insights are ready.
            </Alert>
          )}
        </Box>
      )}

      {/* Enhanced Insights Section (Preserve from GoalsStrategyStep) */}
      {hasEnhancement && onEnhancedGoalsChange && (
        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            backgroundColor: appleColors.green[50],
            border: `1px solid ${appleColors.green[200]}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InsightIcon sx={{ mr: 1, color: appleColors.green[600] }} />
              <Typography variant="h6" fontWeight={600} sx={{ color: appleColors.green[800] }}>
                Personalized Strategy Insights
              </Typography>
              <Chip
                icon={<SpeedIcon />}
                label={`${enhancedGoals?.confidenceScore || 85}% Match`}
                size="small"
                sx={{
                  ml: 2,
                  backgroundColor: appleColors.green[100],
                  color: appleColors.green[700]
                }}
              />
            </Box>
          </Box>

          {/* AI Enhanced Strategy Summary */}
          {enhancedGoals?.aiEnhancedStrategy && (
            <Alert icon={<AIIcon />} severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
              <Typography variant="body2" fontWeight={500}>
                {enhancedGoals.aiEnhancedStrategy}
              </Typography>
            </Alert>
          )}

          {/* Strategic Insights */}
          {enhancedGoals?.strategicInsights && enhancedGoals.strategicInsights.length > 0 && (
            <Accordion sx={{ mt: 2, borderRadius: '8px' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, color: appleColors.blue[600] }} />
                  <Typography fontWeight={600}>
                    Strategic Insights ({enhancedGoals.strategicInsights.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {enhancedGoals.strategicInsights.map((insight, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <InsightIcon sx={{ fontSize: 20, color: appleColors.blue[500] }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={insight}
                        slotProps={{ primary: { sx: { fontSize: '14px' } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Risk Adjustments */}
          {enhancedGoals?.riskAdjustments && enhancedGoals.riskAdjustments.length > 0 && (
            <Accordion sx={{ mt: 1, borderRadius: '8px' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1, color: appleColors.orange[600] }} />
                  <Typography fontWeight={600}>
                    Risk Considerations ({enhancedGoals.riskAdjustments.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {enhancedGoals.riskAdjustments.map((risk, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <SecurityIcon sx={{ fontSize: 20, color: appleColors.orange[500] }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={risk}
                        slotProps={{ primary: { sx: { fontSize: '14px' } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

// Debounce utility function (reused from GoalsStrategyStep)
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default StrategySelectionStep;
