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
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  Home,
  Psychology as GoalsIcon, // Phase 1: Used for Strategy step icon
  ArrowBack,
  ArrowForward,
  Check
} from '@mui/icons-material';
// REMOVED Phase 1: TrendingUp (was used for Assumptions step, now deprecated)
// REMOVED Phase 1: TaxIcon (was used for Tax step, now deprecated)

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
import StrategySelectionStep from './StrategySelectionStep'; // Phase 1: NEW Step 0
import AddressStep from './AddressStep';
import FinancialsStep from './FinancialsStep';
import RentalStep from './RentalStep';
// DEPRECATED Phase 1: AssumptionsStep content moved to advanced accordion in RentalStep
// import AssumptionsStep from './AssumptionsStep';
// DEPRECATED Phase 1: GoalsStrategyStep replaced by StrategySelectionStep
// import GoalsStrategyStep from './GoalsStrategyStep';
// DEPRECATED: Tax profile collection being replaced with educational content
// import TaxProfileStep from './TaxProfileStep';

interface PropertyWizardProps {
  onComplete: (data: SFRPropertyData) => Promise<Analysis | null>;
  initialData?: Partial<SFRPropertyData>;
  config?: Partial<WizardConfig>;
  onCancel?: () => void;
  // FIX Issue #26 (Option B): Portfolio context in wizard
  selectedPortfolioId?: string | null;
  onPortfolioChange?: (portfolioId: string | null) => void;
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

// Phase 1: Universal Simple - 4-step wizard (down from 5 steps)
const steps = [
  {
    label: 'Investment Strategy',
    description: 'Choose your investment approach',
    icon: GoalsIcon
  },
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
    label: 'Rental & Operating',
    description: 'Rent estimates and operating expenses',
    icon: Home
  }
  // REMOVED: Long-term Assumptions step (content moved to advanced accordion in Rental step)
  // REMOVED: Investment Goals & Strategy step (replaced by Strategy step at beginning)
  // REMOVED: Tax Intelligence Profile step (deprecated)
];

const PropertyWizard: React.FC<PropertyWizardProps> = ({
  onComplete,
  initialData,
  config: _config = {}, // Currently unused but kept for future use
  onCancel,
  selectedPortfolioId,
  onPortfolioChange
}) => {
  // Wizard configuration
  // const wizardConfig = { ...defaultConfig, ...config };

  // Wizard state management (Phase 1: 4 steps instead of 6)
  const [state, setState] = useState<WizardState>({
    currentStep: WizardStep.STRATEGY, // Phase 1: Start with strategy selection
    completed: [false, false, false, false], // 4 steps: STRATEGY, ADDRESS, FINANCIALS, RENTAL
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
    totalSteps: 4, // Phase 1: 4 steps (STRATEGY, ADDRESS, FINANCIALS, RENTAL)
    estimatedTimeRemaining: 10, // ~2.5 min per step
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

  // Navigation handlers (Phase 1: 4-step wizard)
  const handleNext = useCallback(() => {
    const lastStep = WizardStep.RENTAL; // Phase 1: Last step is RENTAL (step 3)
    if (state.currentStep < lastStep) {
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
    if (state.currentStep > WizardStep.STRATEGY) { // Phase 1: First step is STRATEGY (step 0)
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

  // Complete wizard and submit data (Phase 1: Final step is RENTAL)
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mark final step as completed
      const finalCompleted = [...state.completed];
      finalCompleted[WizardStep.RENTAL] = true; // Phase 1: RENTAL is the last step

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

      // DEBUG Issue #29: Log final wizard data before submission
      console.log('🚀 WIZARD SUBMITTING DATA:', {
        purchasePrice: wizardData.purchasePrice,
        downPayment: wizardData.downPayment,
        downPaymentPercentage: wizardData.downPaymentPercentage,
        closingCosts: wizardData.closingCosts,
        loanAmount: (wizardData.purchasePrice || 0) - (wizardData.downPayment || 0),
        totalInvestment: (wizardData.downPayment || 0) + (wizardData.closingCosts || 0),
        _isWizardData: wizardData._isWizardData
      });

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

      // Phase 1: Simplified 4-step validation
      switch (state.currentStep) {
        case WizardStep.STRATEGY:
          // Phase 1: Strategy selection validation
          if (!state.data.strategy) {
            errors.strategy = 'Please select an investment strategy';
          }
          // Optional AI enhancement - no validation required
          break;

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
          // Phase 1: Assumptions moved to advanced accordion - no validation required
          break;

        // REMOVED Phase 1: WizardStep.ASSUMPTIONS validation
        // REMOVED Phase 1: WizardStep.GOALS validation (replaced by STRATEGY)
        // REMOVED: WizardStep.TAX validation (deprecated)
      }

      setValidation({
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      });
    };

    validateCurrentStep();
  }, [state.currentStep, state.data]);

  // Render step content - Phase 1: 4-step wizard
  const renderStepContent = () => {
    const stepProps = {
      state,
      onUpdate: handleStateUpdate,
      onNext: handleNext,
      onPrevious: handlePrevious,
      validation
    };

    switch (state.currentStep) {
      case WizardStep.STRATEGY:
        // Phase 1: NEW Step 0 - Investment Strategy Selection
        return (
          <StrategySelectionStep
            strategy={state.data.strategy}
            onStrategyChange={(strategy) => {
              setState(prev => ({
                ...prev,
                data: {
                  ...prev.data,
                  strategy
                }
              }));
            }}
            selectedPortfolioId={selectedPortfolioId}
            onPortfolioChange={onPortfolioChange}
            enhancedGoals={state.data.enhancedGoals}
            onEnhancedGoalsChange={(goals) => {
              setState(prev => ({
                ...prev,
                data: {
                  ...prev.data,
                  enhancedGoals: goals
                }
              }));
            }}
          />
        );

      case WizardStep.ADDRESS:
        return <AddressStep {...stepProps} />;

      case WizardStep.FINANCIALS:
        return <FinancialsStep {...stepProps} />;

      case WizardStep.RENTAL:
        return <RentalStep {...stepProps} />;

      // REMOVED Phase 1: WizardStep.ASSUMPTIONS (content moved to advanced accordion in RentalStep)
      // REMOVED Phase 1: WizardStep.GOALS (replaced by StrategySelectionStep above)
      // REMOVED Phase 1: WizardStep.TAX (deprecated in favor of educational content)

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* Stepper - immediately visible, no redundant header/badges */}
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
          onClick={state.currentStep === WizardStep.STRATEGY && onCancel ? onCancel : handlePrevious}
          startIcon={<ArrowBack />}
          disabled={state.currentStep === WizardStep.STRATEGY && !onCancel}
        >
          {onCancel && state.currentStep === WizardStep.STRATEGY ? 'Cancel' : 'Previous'}
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {state.currentStep === WizardStep.RENTAL ? ( // Phase 1: Last step is RENTAL
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