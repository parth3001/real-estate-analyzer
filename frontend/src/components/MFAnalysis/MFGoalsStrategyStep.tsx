/**
 * MFGoalsStrategyStep - Step 5 of Multi-Family Property Wizard
 * Investment goals, strategy, risk tolerance, and experience level
 *
 * Feeds Investment Decision Engine for personalized analysis
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  AccountBalance,
  Home,
  EmojiEvents,
  Security,
  Info
} from '@mui/icons-material';

import type { MFWizardStepProps } from './mfWizardTypes';

type ExitStrategy = 'sale' | 'refinance' | '1031exchange' | 'estate' | 'flexible';
type PortfolioStrategy = 'first' | 'geographic' | 'cashflow' | 'appreciation' | 'diversification';
type ExperienceLevel = 'novice' | 'intermediate' | 'expert';
type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

// Simple interface for goals data
interface GoalsData {
  exitStrategy: ExitStrategy;
  portfolioStrategy: PortfolioStrategy;
  experienceLevel: ExperienceLevel;
  riskTolerance: RiskTolerance;
  freeTextStrategy: string;
}

const MFGoalsStrategyStep: React.FC<MFWizardStepProps> = ({
  state,
  onUpdate
}) => {
  // Initialize from state data with type safety
  const currentGoals = (state.data.enhancedGoals as any) || {};

  const [exitStrategy, setExitStrategy] = useState<ExitStrategy>(
    currentGoals.exitStrategy || 'flexible'
  );

  const [portfolioStrategy, setPortfolioStrategy] = useState<PortfolioStrategy>(
    currentGoals.portfolioStrategy || 'cashflow'
  );

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    currentGoals.experienceLevel || 'novice'
  );

  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>(
    currentGoals.riskTolerance || 'moderate'
  );

  const [freeTextStrategy, setFreeTextStrategy] = useState(
    currentGoals.freeTextStrategy || ''
  );

  // Update parent state
  useEffect(() => {
    const goalsData: GoalsData = {
      exitStrategy,
      portfolioStrategy,
      experienceLevel,
      riskTolerance,
      freeTextStrategy
    };

    onUpdate({
      data: {
        ...state.data,
        enhancedGoals: goalsData as any
      }
    });
  }, [exitStrategy, portfolioStrategy, experienceLevel, riskTolerance, freeTextStrategy]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Exit Strategy */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" />
            Exit Strategy
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            How do you plan to exit this investment?
          </Typography>

          <ToggleButtonGroup
            value={exitStrategy}
            exclusive
            onChange={(_, value) => value && setExitStrategy(value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            <ToggleButton value="sale">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <TrendingUp />
                <Typography variant="caption" display="block">Sale</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="refinance">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <AccountBalance />
                <Typography variant="caption" display="block">Refinance</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="1031exchange">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Home />
                <Typography variant="caption" display="block">1031 Exchange</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="estate">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Security />
                <Typography variant="caption" display="block">Estate/Legacy</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="flexible">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Psychology />
                <Typography variant="caption" display="block">Flexible</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="body2">
                {exitStrategy === 'sale' && '🎯 Traditional exit: Sell property for profit after appreciation'}
                {exitStrategy === 'refinance' && '🏦 Cash-out refinance: Extract equity while keeping property'}
                {exitStrategy === '1031exchange' && '🔄 Tax-deferred exchange: Upgrade to larger property'}
                {exitStrategy === 'estate' && '👨‍👩‍👧 Long-term hold: Pass to heirs with step-up in basis'}
                {exitStrategy === 'flexible' && '🎪 Open-minded: Evaluate best option when time comes'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider />

        {/* Portfolio Strategy */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Home color="primary" />
            Portfolio Strategy
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            What's your multi-family investment approach?
          </Typography>

          <ToggleButtonGroup
            value={portfolioStrategy}
            exclusive
            onChange={(_, value) => value && setPortfolioStrategy(value)}
            fullWidth
            sx={{ mt: 2, flexWrap: 'wrap' }}
          >
            <ToggleButton value="first" sx={{ flexBasis: '50%' }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <EmojiEvents />
                <Typography variant="caption" display="block">First Property</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="geographic" sx={{ flexBasis: '50%' }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Home />
                <Typography variant="caption" display="block">Geographic Expansion</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="cashflow" sx={{ flexBasis: '50%' }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <TrendingUp />
                <Typography variant="caption" display="block">Cash Flow Focus</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="appreciation" sx={{ flexBasis: '50%' }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <AccountBalance />
                <Typography variant="caption" display="block">Appreciation Focus</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="diversification" sx={{ flex: '1 0 100%' }}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Security />
                <Typography variant="caption" display="block">Portfolio Diversification</Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="body2">
                {portfolioStrategy === 'first' && '🎓 First MF property: We\'ll focus on education and conservative assumptions'}
                {portfolioStrategy === 'geographic' && '🗺️ Expanding markets: We\'ll analyze market-specific risks and opportunities'}
                {portfolioStrategy === 'cashflow' && '💰 Cash flow first: We\'ll prioritize monthly income over appreciation'}
                {portfolioStrategy === 'appreciation' && '📈 Growth focus: We\'ll emphasize equity buildup and market timing'}
                {portfolioStrategy === 'diversification' && '🎯 Risk management: We\'ll assess how this fits your portfolio'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider />

        {/* Experience Level */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            Experience Level
          </Typography>

          <ToggleButtonGroup
            value={experienceLevel}
            exclusive
            onChange={(_, value) => value && setExperienceLevel(value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            <ToggleButton value="novice">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body1">🎓</Typography>
                <Typography variant="caption" display="block">Novice</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  0-2 properties
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="intermediate">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body1">📊</Typography>
                <Typography variant="caption" display="block">Intermediate</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  3-10 properties
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="expert">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body1">🎯</Typography>
                <Typography variant="caption" display="block">Expert</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  10+ properties
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Risk Tolerance */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            Risk Tolerance
          </Typography>

          <ToggleButtonGroup
            value={riskTolerance}
            exclusive
            onChange={(_, value) => value && setRiskTolerance(value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            <ToggleButton value="conservative">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Security />
                <Typography variant="caption" display="block">Conservative</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Safety first
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="moderate">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <AccountBalance />
                <Typography variant="caption" display="block">Moderate</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Balanced approach
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="aggressive">
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <TrendingUp />
                <Typography variant="caption" display="block">Aggressive</Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Growth focused
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="body2">
                {riskTolerance === 'conservative' && '🛡️ Conservative: We\'ll use higher reserve assumptions and stress test scenarios'}
                {riskTolerance === 'moderate' && '⚖️ Moderate: We\'ll balance risk and return with industry-standard assumptions'}
                {riskTolerance === 'aggressive' && '🚀 Aggressive: We\'ll focus on maximum returns and leverage opportunities'}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider />

        {/* Additional Strategy Notes */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            Additional Strategy Notes (Optional)
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={freeTextStrategy}
            onChange={(e) => setFreeTextStrategy(e.target.value)}
            placeholder="Tell us more about your investment goals, concerns, or specific strategies you're considering..."
            helperText="Our AI will analyze your strategy and provide personalized insights"
          />
        </Box>

        {/* Strategy Summary */}
        <Alert severity="info">
          <Typography variant="body2" gutterBottom>
            <strong>Your Investment Profile:</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip label={exitStrategy.replace('1031exchange', '1031 Exchange')} size="small" color="primary" variant="outlined" />
            <Chip label={portfolioStrategy.replace('_', ' ')} size="small" color="primary" variant="outlined" />
            <Chip label={experienceLevel} size="small" color="primary" variant="outlined" />
            <Chip label={riskTolerance} size="small" color="primary" variant="outlined" />
          </Box>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            This profile helps our AI provide personalized recommendations and risk assessments.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default MFGoalsStrategyStep;
