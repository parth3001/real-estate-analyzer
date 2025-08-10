/**
 * Step 5: Investment Goals & Strategy
 * 
 * This step combines structured dropdowns with AI-powered free-text analysis
 * to create enhanced, personalized investment context for sophisticated investors.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Lightbulb as InsightIcon,
  AutoFixHigh as EnhancementIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';

// Enhanced goal context interface matching backend
export interface EnhancedGoalContext {
  // Original structured goals
  exitStrategy?: 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
  portfolioStrategy?: 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
  experienceLevel?: 'novice' | 'intermediate' | 'expert';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  
  // Enhanced AI-derived insights
  freeTextStrategy?: string;
  aiEnhancedStrategy?: string;
  strategicInsights?: string[];
  riskAdjustments?: string[];
  timeframeInsights?: string[];
  confidenceScore?: number;
  processingMethod?: 'pattern' | 'ai' | 'hybrid';
  
  // Advanced goal context
  capitalDeploymentStrategy?: string;
  portfolioPosition?: 'building' | 'optimizing' | 'scaling' | 'exiting';
  marketTimingPreference?: 'opportunistic' | 'systematic' | 'flexible';
  leveragePreference?: 'conservative' | 'moderate' | 'aggressive';
}

interface GoalsStrategyStepProps {
  goals: EnhancedGoalContext;
  onGoalsChange: (goals: EnhancedGoalContext) => void;
}

const GoalsStrategyStep: React.FC<GoalsStrategyStepProps> = ({
  goals,
  onGoalsChange
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Check if we have enhanced insights
  const hasEnhancement = !!(goals.aiEnhancedStrategy || (goals.strategicInsights && goals.strategicInsights.length > 0));

  // Update handlers for structured fields
  const handleStructuredGoalChange = (field: keyof EnhancedGoalContext, value: string) => {
    onGoalsChange({
      ...goals,
      [field]: value
    });
  };

  const handleFreeTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const freeText = event.target.value;
    onGoalsChange({
      ...goals,
      freeTextStrategy: freeText
    });

    // Trigger analysis if text is substantial
    if (freeText.length > 50 && !isAnalyzing) {
      analyzeGoalsDebounced(freeText);
    }
  };

  // Debounced goal analysis
  const analyzeGoalsDebounced = React.useCallback(
    debounce(async (freeText: string) => {
      if (freeText.length < 20) return;
      
      setIsAnalyzing(true);
      
      try {
        const response = await fetch('/api/deals/analyze-goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            structuredGoals: {
              exitStrategy: goals.exitStrategy,
              portfolioStrategy: goals.portfolioStrategy,
              experienceLevel: goals.experienceLevel,
              riskTolerance: goals.riskTolerance
            },
            freeTextStrategy: freeText
          })
        });

        if (response.ok) {
          const result = await response.json();
          const enhancedGoals = result.data.enhancedGoals;
          
          onGoalsChange({
            ...goals,
            ...enhancedGoals
          });
          
          setAnalysisComplete(true);
        }
      } catch (error) {
        console.error('Goal analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 2000),
    [goals]
  );


  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: appleColors.gray[900] }}>
        Investment Goals & Strategy
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: appleColors.gray[700] }}>
        Help us personalize your analysis by telling us about your investment approach
      </Typography>

      {/* Structured Goals Section */}
      <Card sx={{ mb: 3, borderRadius: '16px' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3, color: appleColors.gray[800] }}>
            Investment Strategy Basics
          </Typography>
          
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Exit Strategy</InputLabel>
                <Select
                  value={goals.exitStrategy || ''}
                  onChange={(e) => handleStructuredGoalChange('exitStrategy', e.target.value)}
                  label="Exit Strategy"
                >
                  <MenuItem value="sale">Sale (3-7 years)</MenuItem>
                  <MenuItem value="refinance">Refinance & Hold</MenuItem>
                  <MenuItem value="1031exchange">1031 Exchange</MenuItem>
                  <MenuItem value="estate">Estate Planning</MenuItem>
                  <MenuItem value="flexible">Keep Options Open</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Portfolio Focus</InputLabel>
                <Select
                  value={goals.portfolioStrategy || ''}
                  onChange={(e) => handleStructuredGoalChange('portfolioStrategy', e.target.value)}
                  label="Portfolio Focus"
                >
                  <MenuItem value="first">First Investment</MenuItem>
                  <MenuItem value="cashflow">Cash Flow Focus</MenuItem>
                  <MenuItem value="appreciation">Appreciation Focus</MenuItem>
                  <MenuItem value="geographic">Geographic Expansion</MenuItem>
                  <MenuItem value="diversification">Portfolio Diversification</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={goals.experienceLevel || ''}
                  onChange={(e) => handleStructuredGoalChange('experienceLevel', e.target.value)}
                  label="Experience Level"
                >
                  <MenuItem value="novice">New to Real Estate</MenuItem>
                  <MenuItem value="intermediate">Some Experience</MenuItem>
                  <MenuItem value="expert">Experienced Investor</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Risk Tolerance</InputLabel>
                <Select
                  value={goals.riskTolerance || ''}
                  onChange={(e) => handleStructuredGoalChange('riskTolerance', e.target.value)}
                  label="Risk Tolerance"
                >
                  <MenuItem value="conservative">Conservative</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="aggressive">Aggressive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Free Text Strategy Section */}
      <Card sx={{ mb: 3, borderRadius: '16px', border: `2px solid ${appleColors.primary[100]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AIIcon sx={{ mr: 1, color: appleColors.primary[600] }} />
            <Typography variant="h6" fontWeight={600} sx={{ color: appleColors.gray[800] }}>
              Describe Your Strategy 
            </Typography>
            <Chip 
              label="AI Enhanced" 
              size="small" 
              sx={{ ml: 2, backgroundColor: appleColors.primary[100], color: appleColors.primary[700] }} 
            />
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, color: appleColors.gray[600] }}>
            <strong>Optional:</strong> Describe your specific investment approach, timeline, or unique goals. 
            Our AI will analyze your strategy and provide personalized insights.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Example: I want to use the BRRRR strategy to build a portfolio of 5 rental properties in 3 years, focusing on Midwest markets while living in California. I plan to house hack my first property then scale using refinanced capital..."
            value={goals.freeTextStrategy || ''}
            onChange={handleFreeTextChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />

          {/* Analysis Status */}
          {isAnalyzing && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, p: 2, backgroundColor: appleColors.primary[50], borderRadius: '8px' }}>
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
        </CardContent>
      </Card>

      {/* Enhanced Insights Section */}
      {hasEnhancement && (
        <Card sx={{ mb: 3, borderRadius: '16px', backgroundColor: appleColors.green[50], border: `1px solid ${appleColors.green[200]}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InsightIcon sx={{ mr: 1, color: appleColors.green[600] }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: appleColors.green[800] }}>
                  Personalized Strategy Insights
                </Typography>
                <Chip 
                  icon={<SpeedIcon />}
                  label={`${goals.confidenceScore || 85}% Match`}
                  size="small" 
                  sx={{ ml: 2, backgroundColor: appleColors.green[100], color: appleColors.green[700] }} 
                />
              </Box>
            </Box>

            {/* AI Enhanced Strategy Summary */}
            {goals.aiEnhancedStrategy && (
              <Alert icon={<AIIcon />} severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
                <Typography variant="body2" fontWeight={500}>
                  {goals.aiEnhancedStrategy}
                </Typography>
              </Alert>
            )}

            {/* Strategic Insights */}
            {goals.strategicInsights && goals.strategicInsights.length > 0 && (
              <Accordion sx={{ mt: 2, borderRadius: '8px' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1, color: appleColors.blue[600] }} />
                    <Typography fontWeight={600}>
                      Strategic Insights ({goals.strategicInsights.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {goals.strategicInsights.map((insight, index) => (
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
            {goals.riskAdjustments && goals.riskAdjustments.length > 0 && (
              <Accordion sx={{ mt: 1, borderRadius: '8px' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1, color: appleColors.orange[600] }} />
                    <Typography fontWeight={600}>
                      Risk Considerations ({goals.riskAdjustments.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {goals.riskAdjustments.map((risk, index) => (
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
          </CardContent>
        </Card>
      )}

    </Box>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default GoalsStrategyStep;