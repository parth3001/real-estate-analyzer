/**
 * PropertyWizard - Main wizard component for guided property data entry
 * Replaces manual form with intelligent 4-step process
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  Home,
  TrendingUp,
  Psychology as GoalsIcon,
  ArrowBack,
  ArrowForward,
  Check
} from '@mui/icons-material';

import type { SFRPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';
import {
  WizardStep,
  type WizardState,
  type StepValidation,
  type WizardConfig,
  type WizardProgress
} from './wizardTypes';
import {
  SFR_PROPERTY_DEFAULTS,
  DEFAULT_WIZARD_PERCENTAGES,
  DEFAULT_SMART_DEFAULTS
} from '../../constants/sfrPropertyDefaults';

// Import step components
import AddressStep from './AddressStep';
import FinancialsStep from './FinancialsStep';
import RentalStep from './RentalStep';
import AssumptionsStep from './AssumptionsStep';
import GoalsStrategyStep from './GoalsStrategyStep';

interface PropertyWizardProps {
  onComplete: (data: SFRPropertyData) => Promise<Analysis | null>;
  initialData?: Partial<SFRPropertyData>;
  config?: Partial<WizardConfig>;
  onCancel?: () => void;
}

// Default wizard configuration (currently unused but kept for future use)
// const defaultConfig: WizardConfig = {
//   enableExternalAPIs: true,
//   enableSmartDefaults: true,
//   enableAutoPopulation: true,
//   showConfidenceScores: true,
//   allowManualOverrides: true,
//   apiTimeout: 10000
// };

// Step definitions
const steps = [
  {
    label: 'Property Address',
    description: 'Enter property address and basic details',
    icon: LocationOn
  },
  {
    label: 'Purchase & Financing',
    description: 'Purchase price, down payment, and financing',
    icon: AttachMoney
  },
  {
    label: 'Rental Analysis',
    description: 'Rent estimates and operating expenses',
    icon: Home
  },
  {
    label: 'Long-term Assumptions',
    description: 'Growth rates and investment timeline',
    icon: TrendingUp
  },
  {
    label: 'Investment Goals & Strategy',
    description: 'Your investment approach and goals',
    icon: GoalsIcon
  }
];

const PropertyWizard: React.FC<PropertyWizardProps> = ({
  onComplete,
  initialData,
  config: _config = {}, // Currently unused but kept for future use
  onCancel
}) => {
  // Wizard configuration
  // const wizardConfig = { ...defaultConfig, ...config };

  // Wizard state management
  const [state, setState] = useState<WizardState>({
    currentStep: WizardStep.ADDRESS,
    completed: [false, false, false, false, false],
    data: {
      // Use centralized defaults for consistency across all entry methods
      ...SFR_PROPERTY_DEFAULTS,
      
      // Wizard-specific percentage fields
      ...DEFAULT_WIZARD_PERCENTAGES,
      
      // Merge with any initial data provided (e.g., from saved property)
      ...initialData
    },
    autoPopulated: {},
    smartDefaults: {
      // Use centralized smart defaults for consistency
      ...DEFAULT_SMART_DEFAULTS
    },
    manualOverrides: [],
    apiErrors: []
  });

  const [validation, setValidation] = useState<StepValidation>({
    isValid: false,
    errors: {},
    warnings: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<WizardProgress>({
    completedSteps: 0,
    totalSteps: 5,
    estimatedTimeRemaining: 12,
    dataQualityScore: 60
  });

  // Update progress based on completed steps
  useEffect(() => {
    const completedCount = state.completed.filter(Boolean).length;
    const dataQuality = calculateDataQualityScore();
    
    setProgress(prev => ({
      ...prev,
      completedSteps: completedCount,
      estimatedTimeRemaining: Math.max(1, (5 - completedCount) * 2.5),
      dataQualityScore: dataQuality
    }));
  }, [state.completed, state.autoPopulated]);

  // Calculate data quality score based on auto-populated fields and confidence
  const calculateDataQualityScore = useCallback((): number => {
    const autoFields = Object.keys(state.autoPopulated).length;
    const totalPossibleFields = 15; // Approximate number of auto-populatable fields
    const coverageScore = (autoFields / totalPossibleFields) * 50;
    
    // Add confidence scoring
    const confidenceScores = Object.values(state.autoPopulated)
      .map(field => field?.confidence?.score || 0)
      .filter(score => score > 0);
    
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0;
    
    const confidenceBonus = (avgConfidence / 100) * 50;
    
    return Math.min(100, coverageScore + confidenceBonus);
  }, [state.autoPopulated]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (state.currentStep < WizardStep.GOALS) {
      const newCompleted = [...state.completed];
      newCompleted[state.currentStep] = true;
      
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as WizardStep,
        completed: newCompleted
      }));
    }
  }, [state.currentStep, state.completed]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > WizardStep.ADDRESS) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as WizardStep
      }));
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step as WizardStep
    }));
  }, []);

  // Update state handler
  const handleStateUpdate = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Complete wizard and submit data
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mark final step as completed
      const finalCompleted = [...state.completed];
      finalCompleted[WizardStep.GOALS] = true;
      
      setState(prev => ({
        ...prev,
        completed: finalCompleted
      }));

      // Submit the data with wizard flag
      const wizardData = {
        ...state.data,
        _isWizardData: true, // Flag to identify wizard data
        maintenanceReservePercentage: state.data.maintenanceReservePercentage,
        vacancyRate: state.data.vacancyRate,
        // Include exit strategy data for Investment Decision Engine (legacy support)
        exitStrategy: state.data.exitStrategy,
        // Include enhanced goals with AI analysis for personalized messaging
        enhancedGoals: state.data.enhancedGoals
      };
      const result = await onComplete(wizardData as SFRPropertyData);
      
      // Success handled by parent component
      return result;
    } catch (error) {
      console.error('Wizard completion error:', error);
      setState(prev => ({
        ...prev,
        apiErrors: [...prev.apiErrors, error instanceof Error ? error.message : 'Unknown error']
      }));
    } finally {
      setIsLoading(false);
    }
  }, [state, onComplete]);

  // Validate current step
  useEffect(() => {
    const validateCurrentStep = () => {
      const errors: Record<string, string> = {};
      const warnings: Record<string, string> = {};

      switch (state.currentStep) {
        case WizardStep.ADDRESS:
          if (!state.data.propertyAddress?.street) {
            errors['propertyAddress.street'] = 'Property address is required';
          }
          if (!state.data.propertyAddress?.city) {
            errors['propertyAddress.city'] = 'City is required';
          }
          if (!state.data.propertyAddress?.state) {
            errors['propertyAddress.state'] = 'State is required';
          }
          break;

        case WizardStep.FINANCIALS:
          if (!state.data.purchasePrice || state.data.purchasePrice <= 0) {
            errors.purchasePrice = 'Purchase price is required';
          }
          if (!state.data.downPayment || state.data.downPayment <= 0) {
            errors.downPayment = 'Down payment is required';
          }
          if (state.data.downPayment && state.data.purchasePrice && 
              state.data.downPayment >= state.data.purchasePrice) {
            warnings.downPayment = 'Down payment should be less than purchase price';
          }
          break;

        case WizardStep.RENTAL:
          if (!state.data.monthlyRent || state.data.monthlyRent <= 0) {
            errors.monthlyRent = 'Monthly rent is required';
          }
          break;

        case WizardStep.ASSUMPTIONS:
          if (!state.data.longTermAssumptions?.projectionYears || 
              state.data.longTermAssumptions.projectionYears < 1) {
            errors.projectionYears = 'Projection years must be at least 1';
          }
          break;

        case WizardStep.GOALS:
          // Basic validation - at least one exit strategy and portfolio strategy required
          if (!state.data.enhancedGoals?.exitStrategy) {
            errors.exitStrategy = 'Exit strategy is required';
          }
          if (!state.data.enhancedGoals?.portfolioStrategy) {
            errors.portfolioStrategy = 'Portfolio strategy is required';
          }
          
          // Optional but helpful warnings
          if (!state.data.enhancedGoals?.experienceLevel) {
            warnings.experienceLevel = 'Experience level helps personalize recommendations';
          }
          if (!state.data.enhancedGoals?.riskTolerance) {
            warnings.riskTolerance = 'Risk tolerance helps optimize investment advice';
          }
          break;
      }

      setValidation({
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      });
    };

    validateCurrentStep();
  }, [state.currentStep, state.data]);

  // Render step content (placeholder for now)
  const renderStepContent = () => {
    const stepProps = {
      state,
      onUpdate: handleStateUpdate,
      onNext: handleNext,
      onPrevious: handlePrevious,
      validation
    };

    switch (state.currentStep) {
      case WizardStep.ADDRESS:
        return <AddressStep {...stepProps} />;

      case WizardStep.FINANCIALS:
        return <FinancialsStep {...stepProps} />;

      case WizardStep.RENTAL:
        return <RentalStep {...stepProps} />;

      case WizardStep.ASSUMPTIONS:
        return <AssumptionsStep {...stepProps} />;

      case WizardStep.GOALS:
        return <GoalsStrategyStep
          goals={state.data.enhancedGoals || {}}
          onGoalsChange={(goals) => {
            setState(prev => ({
              ...prev,
              data: {
                ...prev.data,
                enhancedGoals: goals
              }
            }));
          }}
        />;

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Property Analysis Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Guided property analysis with intelligent data auto-population
        </Typography>
        
        {/* Progress Indicators */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<Check />}
            label={`${progress.completedSteps}/${progress.totalSteps} Steps`}
            color={progress.completedSteps === progress.totalSteps ? 'success' : 'default'}
            variant="outlined"
          />
          <Chip
            label={`${Math.round(progress.dataQualityScore)}% Data Quality`}
            color={progress.dataQualityScore > 80 ? 'success' : progress.dataQualityScore > 60 ? 'warning' : 'error'}
            variant="outlined"
          />
          <Chip
            label={`~${Math.round(progress.estimatedTimeRemaining)} min remaining`}
            variant="outlined"
          />
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={(progress.completedSteps / progress.totalSteps) * 100}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>

      {/* Stepper */}
      <Paper sx={{ mb: 3 }}>
        <Stepper activeStep={state.currentStep} sx={{ p: 3 }}>
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <Step 
                key={step.label} 
                completed={state.completed[index]}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleStepClick(index)}
              >
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: state.completed[index] ? 'success.main' : 
                                index === state.currentStep ? 'primary.main' : 'grey.300',
                        color: state.completed[index] || index === state.currentStep ? 'white' : 'grey.600'
                      }}
                    >
                      {state.completed[index] ? <Check /> : <StepIcon />}
                    </Box>
                  }
                >
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Error Display */}
      {state.apiErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>API Issues:</Typography>
          {state.apiErrors.map((error, index) => (
            <Typography key={index} variant="body2">{error}</Typography>
          ))}
        </Alert>
      )}

      {/* Step Content */}
      <Paper sx={{ mb: 3 }}>
        {renderStepContent()}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          onClick={onCancel || handlePrevious}
          startIcon={<ArrowBack />}
          disabled={state.currentStep === WizardStep.ADDRESS && !onCancel}
        >
          {onCancel && state.currentStep === WizardStep.ADDRESS ? 'Cancel' : 'Previous'}
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {state.currentStep === WizardStep.GOALS ? (
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={!validation.isValid || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Check />}
              size="large"
            >
              {isLoading ? 'Analyzing...' : 'Complete Analysis'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validation.isValid}
              endIcon={<ArrowForward />}
              size="large"
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PropertyWizard;