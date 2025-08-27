import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  InputAdornment,
  Chip
} from '@mui/material';
import { Edit, Flag, TrendingUp, Timeline } from '@mui/icons-material';
import { portfolioApi } from '../../services/api';

interface PortfolioGoals {
  primaryGoal: 'CASH_FLOW' | 'WEALTH_BUILDING' | 'ESTATE_BUILDING' | 'INFLATION_HEDGE' | 'DIVERSIFICATION' | 'REIT_ALTERNATIVE' | 'OPPORTUNISTIC';
  targetMonthlyIncome?: number;
  targetNetWorth?: number;
  targetTimeline?: string;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

interface Portfolio {
  id: string;
  name: string;
  goals: PortfolioGoals;
}

interface EditPortfolioTargetsProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onSuccess: () => void;
}

const EditPortfolioTargets: React.FC<EditPortfolioTargetsProps> = ({
  open,
  onClose,
  portfolio,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState<number | ''>('');
  const [targetNetWorth, setTargetNetWorth] = useState<number | ''>('');
  const [targetTimeline, setTargetTimeline] = useState<string>('10-15 years');

  // Initialize form with current portfolio data
  useEffect(() => {
    if (portfolio && open) {
      setTargetMonthlyIncome(portfolio.goals.targetMonthlyIncome || '');
      setTargetNetWorth(portfolio.goals.targetNetWorth || '');
      setTargetTimeline(portfolio.goals.targetTimeline || '10-15 years');
      setError(null);
    }
  }, [portfolio, open]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare updated goals
      const updatedGoals: PortfolioGoals = {
        ...portfolio.goals,
        targetTimeline
      };

      // Add target values based on primary goal
      if (portfolio.goals.primaryGoal === 'CASH_FLOW' && targetMonthlyIncome) {
        updatedGoals.targetMonthlyIncome = Number(targetMonthlyIncome);
      }

      if (portfolio.goals.primaryGoal === 'WEALTH_BUILDING' && targetNetWorth) {
        updatedGoals.targetNetWorth = Number(targetNetWorth);
      }

      // Update portfolio
      const response = await portfolioApi.updatePortfolio(portfolio.id, {
        goals: updatedGoals
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to update portfolio targets');
      }
    } catch (error: any) {
      console.error('Error updating portfolio targets:', error);
      setError(error.response?.data?.error || 'Failed to update portfolio targets');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getGoalDescription = (goal: string) => {
    const descriptions = {
      'CASH_FLOW': 'Generate consistent monthly income from properties',
      'WEALTH_BUILDING': 'Build long-term wealth through property appreciation',
      'ESTATE_BUILDING': 'Create generational wealth and legacy assets',
      'INFLATION_HEDGE': 'Protect against inflation with real assets',
      'DIVERSIFICATION': 'Diversify investment portfolio with real estate',
      'REIT_ALTERNATIVE': 'Direct property ownership vs REIT investments',
      'OPPORTUNISTIC': 'Capitalize on market opportunities and distressed assets'
    };
    return descriptions[goal as keyof typeof descriptions] || goal;
  };

  const formatCurrency = (value: number | string) => {
    if (!value) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Flag sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Edit Portfolio Targets
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {portfolio.name}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Current Goal Display */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUp sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight="medium">
              Current Primary Goal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip 
              label={portfolio.goals.primaryGoal.replace('_', ' ')} 
              color="primary" 
              size="small"
            />
            <Chip 
              label={portfolio.goals.riskTolerance} 
              variant="outlined" 
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {getGoalDescription(portfolio.goals.primaryGoal)}
          </Typography>
        </Box>

        {/* Target Fields Based on Goal Type */}
        {portfolio.goals.primaryGoal === 'CASH_FLOW' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Target Monthly Income"
              type="number"
              value={targetMonthlyIncome}
              onChange={(e) => setTargetMonthlyIncome(e.target.value ? Number(e.target.value) : '')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, max: 1000000, step: 100 }
              }}
              helperText={
                targetMonthlyIncome ? 
                `Annual target: ${formatCurrency(Number(targetMonthlyIncome) * 12)}` : 
                'Set your desired monthly cash flow from properties'
              }
              disabled={loading}
            />
          </Box>
        )}

        {portfolio.goals.primaryGoal === 'WEALTH_BUILDING' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Target Net Worth"
              type="number"
              value={targetNetWorth}
              onChange={(e) => setTargetNetWorth(e.target.value ? Number(e.target.value) : '')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, max: 100000000, step: 10000 }
              }}
              helperText={
                targetNetWorth ? 
                `Formatted: ${formatCurrency(targetNetWorth)}` : 
                'Set your target portfolio value'
              }
              disabled={loading}
            />
          </Box>
        )}

        {/* Timeline Selection - Always shown */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Timeline sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight="medium">
              Investment Timeline
            </Typography>
          </Box>
          <FormControl fullWidth disabled={loading}>
            <InputLabel>Target Timeline</InputLabel>
            <Select
              value={targetTimeline}
              label="Target Timeline"
              onChange={(e) => setTargetTimeline(e.target.value)}
            >
              <MenuItem value="5 years">
                <Box>
                  <Typography variant="body2" fontWeight="medium">5 years</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Short-term, aggressive growth focus
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="10-15 years">
                <Box>
                  <Typography variant="body2" fontWeight="medium">10-15 years</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Medium-term, balanced approach
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="long-term">
                <Box>
                  <Typography variant="body2" fontWeight="medium">Long-term (15+ years)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Generational wealth building
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Current Progress Hint */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="caption" color="info.main" fontWeight="medium">
            💡 Tip: Your AI insights will be recalculated based on these updated targets to provide personalized recommendations.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          variant="contained"
          startIcon={<Edit />}
        >
          {loading ? 'Updating...' : 'Update Targets'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPortfolioTargets;