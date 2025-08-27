import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalance,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import { portfolioApi } from '../../services/api';
import type { CreatePortfolioRequest } from '../../types/portfolio';

interface CreatePortfolioModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreatePortfolioRequest>({
    name: '',
    description: '',
    goals: {
      primaryGoal: 'CASH_FLOW',
      riskTolerance: 'MODERATE'
    },
    settings: {
      includeInSFRAnalysis: true,
      alertsEnabled: true
    }
  });

  const steps = ['Basic Info', 'Investment Goals', 'Settings'];

  const goalOptions = [
    { value: 'CASH_FLOW', label: 'Cash Flow Focus', icon: <TrendingUp />, description: 'Maximize monthly rental income' },
    { value: 'WEALTH_BUILDING', label: 'Wealth Building', icon: <Assessment />, description: 'Long-term appreciation and equity growth' },
    { value: 'ESTATE_BUILDING', label: 'Estate Building', icon: <AccountBalance />, description: 'Build generational wealth' },
    { value: 'INFLATION_HEDGE', label: 'Inflation Hedge', icon: <TrendingUp />, description: 'Protect against inflation' },
    { value: 'DIVERSIFICATION', label: 'Diversification', icon: <Assessment />, description: 'Spread investment risk' },
    { value: 'REIT_ALTERNATIVE', label: 'REIT Alternative', icon: <AccountBalance />, description: 'Direct real estate ownership' },
    { value: 'OPPORTUNISTIC', label: 'Opportunistic', icon: <TrendingUp />, description: 'Take advantage of market opportunities' }
  ];

  const riskOptions = [
    { value: 'CONSERVATIVE', label: 'Conservative', color: appleColors.green[600], description: 'Lower risk, stable returns' },
    { value: 'MODERATE', label: 'Moderate', color: appleColors.orange[600], description: 'Balanced risk and return' },
    { value: 'AGGRESSIVE', label: 'Aggressive', color: appleColors.red[600], description: 'Higher risk, higher potential returns' }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('goals.')) {
      const goalField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        goals: {
          ...prev.goals,
          [goalField]: value
        }
      }));
    } else if (field.startsWith('settings.')) {
      const settingField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings!,
          [settingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.name.trim().length > 0;
      case 1:
        return formData.goals.primaryGoal !== undefined && formData.goals.riskTolerance !== undefined;
      case 2:
        return true; // Settings are optional
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set target timeline if not provided
      if (!formData.goals.targetTimeline) {
        formData.goals.targetTimeline = '10-15 years';
      }

      const response = await portfolioApi.createPortfolio(formData);
      
      if (response.data.success) {
        onSuccess();
        onClose();
        setActiveStep(0);
        setFormData({
          name: '',
          description: '',
          goals: {
            primaryGoal: 'CASH_FLOW',
            riskTolerance: 'MODERATE'
          },
          settings: {
            includeInSFRAnalysis: true,
            alertsEnabled: true
          }
        });
      } else {
        setError('Failed to create portfolio');
      }
    } catch (err: any) {
      console.error('Error creating portfolio:', err);
      setError(err.response?.data?.error || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Portfolio Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              required
              placeholder="e.g., My Rental Properties"
              sx={{ mb: 3 }}
              inputProps={{ maxLength: 50 }}
            />
            
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe your investment strategy or portfolio focus..."
              inputProps={{ maxLength: 200 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Primary Investment Goal
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              {goalOptions.map((goal) => (
                <Box
                  key={goal.value}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: `2px solid ${
                      formData.goals.primaryGoal === goal.value 
                        ? appleColors.blue[600] 
                        : appleColors.gray[200]
                    }`,
                    backgroundColor: formData.goals.primaryGoal === goal.value 
                      ? appleColors.blue[50] 
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: appleColors.blue[400],
                      backgroundColor: appleColors.blue[50]
                    }
                  }}
                  onClick={() => handleInputChange('goals.primaryGoal', goal.value)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {goal.icon}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                      {goal.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    {goal.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Risk Tolerance
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {riskOptions.map((risk) => (
                <Chip
                  key={risk.value}
                  label={risk.label}
                  onClick={() => handleInputChange('goals.riskTolerance', risk.value)}
                  sx={{
                    px: 2,
                    py: 1,
                    fontWeight: 600,
                    backgroundColor: formData.goals.riskTolerance === risk.value 
                      ? risk.color + '20' 
                      : appleColors.gray[100],
                    color: formData.goals.riskTolerance === risk.value 
                      ? risk.color 
                      : appleColors.gray[700],
                    border: `2px solid ${
                      formData.goals.riskTolerance === risk.value 
                        ? risk.color 
                        : 'transparent'
                    }`,
                    '&:hover': {
                      backgroundColor: risk.color + '20',
                      color: risk.color
                    }
                  }}
                />
              ))}
            </Box>

            {/* Goal-specific inputs */}
            {formData.goals.primaryGoal === 'CASH_FLOW' && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Target Monthly Income (Optional)"
                  type="number"
                  value={formData.goals.targetMonthlyIncome || ''}
                  onChange={(e) => handleInputChange('goals.targetMonthlyIncome', parseFloat(e.target.value) || undefined)}
                  fullWidth
                  placeholder="5000"
                  InputProps={{ startAdornment: '$' }}
                />
              </Box>
            )}

            {formData.goals.primaryGoal === 'WEALTH_BUILDING' && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Target Net Worth (Optional)"
                  type="number"
                  value={formData.goals.targetNetWorth || ''}
                  onChange={(e) => handleInputChange('goals.targetNetWorth', parseFloat(e.target.value) || undefined)}
                  fullWidth
                  placeholder="1000000"
                  InputProps={{ startAdornment: '$' }}
                />
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Portfolio Settings
            </Typography>

            <Box sx={{ 
              p: 3, 
              borderRadius: 2, 
              backgroundColor: appleColors.gray[50],
              border: `1px solid ${appleColors.gray[200]}`,
              mb: 3 
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Include in SFR Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    Show this portfolio in property analysis recommendations
                  </Typography>
                </Box>
                <Button
                  variant={formData.settings?.includeInSFRAnalysis ? "contained" : "outlined"}
                  onClick={() => handleInputChange('settings.includeInSFRAnalysis', !formData.settings?.includeInSFRAnalysis)}
                  sx={{
                    backgroundColor: formData.settings?.includeInSFRAnalysis ? appleColors.blue[600] : 'transparent',
                    color: formData.settings?.includeInSFRAnalysis ? 'white' : appleColors.blue[600],
                    '&:hover': {
                      backgroundColor: formData.settings?.includeInSFRAnalysis ? appleColors.blue[700] : appleColors.blue[50]
                    }
                  }}
                >
                  {formData.settings?.includeInSFRAnalysis ? 'Enabled' : 'Disabled'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Portfolio Alerts
                  </Typography>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    Receive notifications about portfolio performance and opportunities
                  </Typography>
                </Box>
                <Button
                  variant={formData.settings?.alertsEnabled ? "contained" : "outlined"}
                  onClick={() => handleInputChange('settings.alertsEnabled', !formData.settings?.alertsEnabled)}
                  sx={{
                    backgroundColor: formData.settings?.alertsEnabled ? appleColors.blue[600] : 'transparent',
                    color: formData.settings?.alertsEnabled ? 'white' : appleColors.blue[600],
                    '&:hover': {
                      backgroundColor: formData.settings?.alertsEnabled ? appleColors.blue[700] : appleColors.blue[50]
                    }
                  }}
                >
                  {formData.settings?.alertsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ backgroundColor: appleColors.blue[50], color: appleColors.blue[800] }}>
              You can modify these settings anytime after creating your portfolio.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 600
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: `1px solid ${appleColors.gray[200]}`
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: appleColors.gray[900] }}>
            Create New Portfolio
          </Typography>
          <Typography variant="body2" sx={{ color: appleColors.gray[600], mt: 0.5 }}>
            Set up your real estate investment portfolio
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 3, 
        borderTop: `1px solid ${appleColors.gray[200]}`,
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={activeStep === 0 ? onClose : handleBack}
          variant="outlined"
          sx={{
            borderColor: appleColors.gray[400],
            color: appleColors.gray[700],
            '&:hover': {
              borderColor: appleColors.gray[600],
              backgroundColor: appleColors.gray[50]
            }
          }}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Button
          onClick={handleNext}
          variant="contained"
          disabled={!validateStep(activeStep) || loading}
          sx={{
            backgroundColor: appleColors.blue[600],
            color: 'white',
            px: 3,
            '&:hover': {
              backgroundColor: appleColors.blue[700]
            },
            '&:disabled': {
              backgroundColor: appleColors.gray[300]
            }
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            activeStep === steps.length - 1 ? 'Create Portfolio' : 'Next'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePortfolioModal;