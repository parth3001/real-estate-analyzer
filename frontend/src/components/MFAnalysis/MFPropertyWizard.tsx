/**
 * MFPropertyWizard - Main wizard component for multi-family property guided data entry
 * Separate component from SFR wizard with MF-specific steps and logic
 *
 * Architecture: Same UX experience as SFR wizard but 100% MF-focused
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
  Apartment,
  TrendingUp,
  Psychology as GoalsIcon,
  ArrowBack,
  ArrowForward,
  Check
} from '@mui/icons-material';

import type { MultiFamilyPropertyData } from '../../types/property';
import type { Analysis } from '../../types/analysis';
import {
  MFWizardStep,
  type MFWizardState,
  type StepValidation,
  type MFWizardConfig,
  type MFWizardProgress,
  type MFWizardFormData
} from './mfWizardTypes';
import { transformMFWizardDataToBackend } from '../../utils/mfDataAdapter';

// Import MF-specific step components
import MFAddressStep from './MFAddressStep';
import MFFinancialsStep from './MFFinancialsStep';
import MFRentalStep from './MFRentalStep';
import MFAssumptionsStep from './MFAssumptionsStep';
import MFGoalsStrategyStep from './MFGoalsStrategyStep';

interface MFPropertyWizardProps {
  onComplete: (data: MultiFamilyPropertyData) => Promise<Analysis | null>;
  initialData?: Partial<MultiFamilyPropertyData>;
  config?: Partial<MFWizardConfig>;
  onCancel?: () => void;
}

// Default wizard configuration
const defaultConfig: MFWizardConfig = {
  enableExternalAPIs: true,
  enableSmartDefaults: true,
  enableAutoPopulation: true,
  showConfidenceScores: true,
  allowManualOverrides: true,
  apiTimeout: 10000,
  defaultUnitTemplateMode: 'template' // MF-specific: prefer template mode for faster setup
};

// Step definitions - MF-specific steps
const steps = [
  {
    label: 'Property Address',
    description: 'Enter multi-family property address and building details',
    icon: LocationOn
  },
  {
    label: 'Purchase & Financing',
    description: 'Purchase price, commercial loan terms, and down payment',
    icon: AttachMoney
  },
  {
    label: 'Unit Configuration',
    description: 'Configure rental units and market rents',
    icon: Apartment
  },
  {
    label: 'Operating Assumptions',
    description: 'Long-term growth rates and investment timeline',
    icon: TrendingUp
  },
  {
    label: 'Investment Goals & Strategy',
    description: 'Your multi-family investment approach and goals',
    icon: GoalsIcon
  }
];

// MF Property Defaults
const MF_PROPERTY_DEFAULTS: Partial<MFWizardFormData> = {
  propertyName: '',
  propertyAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  totalUnits: 8,
  totalSqft: 6400,
  yearBuilt: 2015,
  buildingType: 'GARDEN',
  purchasePrice: 1200000,
  downPaymentPercentage: 25,
  downPayment: 300000,
  interestRate: 7.625,
  loanTerm: 30,
  closingCostPercentage: 3.0,
  closingCosts: 36000,
  propertyTaxRate: 2.0,
  insurancePerUnit: 600,
  propertyManagementRate: 10,
  maintenanceCostPerUnit: 100,
  commonAreaUtilities: {
    electric: 150,
    water: 120,
    gas: 80,
    trash: 60
  },
  unitTypes: [],
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3,
    annualPropertyValueIncrease: 4,
    sellingCostsPercentage: 7,
    inflationRate: 2.5,
    vacancyRate: 5,
    capitalExpenditureRate: 6,
    commonAreaMaintenanceRate: 2
  }
};

// MF Smart Defaults
const MF_SMART_DEFAULTS = {
  downPaymentPercentage: 25, // Commercial loans require 25-30%
  closingCostPercentage: 3.0, // Higher for commercial
  propertyManagementRate: 10, // MF typical: 8-12%
  maintenanceCostPerUnit: 100, // Per unit per month
  commonAreaUtilitiesEstimate: {
    electric: 150,
    water: 120,
    gas: 80,
    trash: 60
  },
  vacancyRate: 5, // Multi-family typical: 5-8%
  inflationRate: 2.5, // Typical inflation assumption
  dataSource: 'Default',
  confidence: {
    score: 70,
    source: 'Industry Standards',
    lastUpdated: new Date(),
    reliability: 'medium' as const
  }
};

const MFPropertyWizard: React.FC<MFPropertyWizardProps> = ({
  onComplete,
  initialData,
  config = {},
  onCancel
}) => {
  // Wizard configuration
  const wizardConfig = { ...defaultConfig, ...config };

  // Wizard state management
  const [state, setState] = useState<MFWizardState>({
    currentStep: MFWizardStep.ADDRESS,
    completed: [false, false, false, false, false],
    data: {
      // Use MF defaults for consistency
      ...MF_PROPERTY_DEFAULTS,

      // Merge with any initial data provided (e.g., from saved property)
      ...initialData
    } as MFWizardFormData,
    autoPopulated: {},
    smartDefaults: {
      // Use MF smart defaults
      ...MF_SMART_DEFAULTS
    },
    manualOverrides: [],
    apiErrors: [],
    unitTemplateMode: 'template' // Start with template mode
  });

  const [validation, setValidation] = useState<StepValidation>({
    isValid: false,
    errors: {},
    warnings: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<MFWizardProgress>({
    completedSteps: 0,
    totalSteps: 5,
    estimatedTimeRemaining: 15,
    dataQualityScore: 60
  });

  // Update progress based on completed steps
  useEffect(() => {
    const completedCount = state.completed.filter(Boolean).length;
    const dataQuality = calculateDataQualityScore();

    setProgress(prev => ({
      ...prev,
      completedSteps: completedCount,
      estimatedTimeRemaining: Math.max(1, (5 - completedCount) * 3), // 3 min per step estimate
      dataQualityScore: dataQuality
    }));
  }, [state.completed, state.autoPopulated]);

  // Calculate data quality score based on auto-populated fields and confidence
  const calculateDataQualityScore = useCallback((): number => {
    const autoFields = Object.keys(state.autoPopulated).length;
    const totalPossibleFields = 12; // MF: totalUnits, totalSqft, buildingType, yearBuilt, unitTypeEstimates, etc.
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

  // Validate current step
  const validateCurrentStep = useCallback((): StepValidation => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    switch (state.currentStep) {
      case MFWizardStep.ADDRESS:
        // Address validation
        if (!state.data.propertyAddress?.street) {
          errors['propertyAddress.street'] = 'Street address is required';
        }
        if (!state.data.propertyAddress?.city) {
          errors['propertyAddress.city'] = 'City is required';
        }
        if (!state.data.propertyAddress?.state) {
          errors['propertyAddress.state'] = 'State is required';
        }
        if (!state.data.propertyAddress?.zipCode) {
          errors['propertyAddress.zipCode'] = 'ZIP code is required';
        }

        // Building details validation
        if (!state.data.totalUnits || state.data.totalUnits < 2) {
          errors['totalUnits'] = 'Multi-family properties must have at least 2 units';
        }
        if (!state.data.totalSqft || state.data.totalSqft <= 0) {
          errors['totalSqft'] = 'Total square footage is required';
        }
        if (!state.data.yearBuilt) {
          errors['yearBuilt'] = 'Year built is required';
        }
        break;

      case MFWizardStep.FINANCIALS:
        // Financial validation
        if (!state.data.purchasePrice || state.data.purchasePrice <= 0) {
          errors['purchasePrice'] = 'Purchase price is required';
        }
        if (!state.data.interestRate || state.data.interestRate <= 0) {
          errors['interestRate'] = 'Interest rate is required';
        }
        if (!state.data.loanTerm || state.data.loanTerm < 1) {
          errors['loanTerm'] = 'Loan term is required';
        }

        // LTV warnings
        const ltvRatio = ((state.data.purchasePrice - state.data.downPayment) / state.data.purchasePrice) * 100;
        if (ltvRatio > 80) {
          warnings['downPayment'] = `LTV ratio of ${ltvRatio.toFixed(1)}% is high. Commercial lenders typically prefer ≤75%.`;
        }
        break;

      case MFWizardStep.RENTAL:
        // Unit configuration validation
        if (!state.data.unitTypes || state.data.unitTypes.length === 0) {
          errors['unitTypes'] = 'At least one unit type must be configured';
        }
        break;

      case MFWizardStep.ASSUMPTIONS:
        // Long-term assumptions validation
        if (!state.data.longTermAssumptions?.projectionYears) {
          errors['projectionYears'] = 'Projection period is required';
        }
        break;

      case MFWizardStep.GOALS:
        // Goals are optional but validated if provided
        break;
    }

    const isValid = Object.keys(errors).length === 0;
    return { isValid, errors, warnings };
  }, [state.currentStep, state.data]);

  // Update validation whenever step or data changes
  useEffect(() => {
    const stepValidation = validateCurrentStep();
    setValidation(stepValidation);
  }, [state.currentStep, state.data, validateCurrentStep]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (state.currentStep < MFWizardStep.GOALS) {
      const newCompleted = [...state.completed];
      newCompleted[state.currentStep] = true;

      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as typeof MFWizardStep[keyof typeof MFWizardStep],
        completed: newCompleted
      }));
    }
  }, [state.currentStep, state.completed]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > MFWizardStep.ADDRESS) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as typeof MFWizardStep[keyof typeof MFWizardStep]
      }));
    }
  }, [state.currentStep]);

  const handleStepClick = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step as typeof MFWizardStep[keyof typeof MFWizardStep]
    }));
  }, []);

  // Update state handler
  const handleStateUpdate = useCallback((updates: Partial<MFWizardState>) => {
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
      finalCompleted[MFWizardStep.GOALS] = true;

      setState(prev => ({
        ...prev,
        completed: finalCompleted
      }));

      // Transform wizard data to backend format using MFDataAdapter
      const backendData = transformMFWizardDataToBackend(state.data);

      console.log('MFPropertyWizard: Submitting data to backend', {
        totalUnits: backendData.totalUnits,
        purchasePrice: backendData.purchasePrice,
        insuranceRate: backendData.insuranceRate, // Should be percentage
        propertyManagementRate: backendData.propertyManagementRate,
        maintenanceCostPerUnit: backendData.maintenanceCostPerUnit
      });

      // Submit the transformed data
      const analysis = await onComplete(backendData);

      if (analysis) {
        console.log('MFPropertyWizard: Analysis completed successfully');
      }

      return analysis;
    } catch (error) {
      console.error('MFPropertyWizard: Error submitting data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [state.data, state.completed, onComplete]);

  // Render current step component
  const renderStep = () => {
    const stepProps = {
      state,
      onUpdate: handleStateUpdate,
      onNext: handleNext,
      onPrevious: handlePrevious,
      validation
    };

    switch (state.currentStep) {
      case MFWizardStep.ADDRESS:
        return <MFAddressStep {...stepProps} />;
      case MFWizardStep.FINANCIALS:
        return <MFFinancialsStep {...stepProps} />;
      case MFWizardStep.RENTAL:
        return <MFRentalStep {...stepProps} />;
      case MFWizardStep.ASSUMPTIONS:
        return <MFAssumptionsStep {...stepProps} />;
      case MFWizardStep.GOALS:
        return <MFGoalsStrategyStep {...stepProps} />;
      default:
        return null;
    }
  };

  const isFirstStep = state.currentStep === MFWizardStep.ADDRESS;
  const isLastStep = state.currentStep === MFWizardStep.GOALS;

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Multi-Family Property Analysis Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Step-by-step guided analysis for your multi-family investment property
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress: {progress.completedSteps} of {progress.totalSteps} steps
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ~{progress.estimatedTimeRemaining} min remaining
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(progress.completedSteps / progress.totalSteps) * 100}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>

      {/* Stepper */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stepper activeStep={state.currentStep} sx={{ p: 3 }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Step key={step.label} completed={state.completed[index]}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: 'pointer' }}
                  icon={state.completed[index] ? <Check color="success" /> : <Icon />}
                >
                  <Typography variant="body2" fontWeight={state.currentStep === index ? 'bold' : 'normal'}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Data Quality Badge */}
      {progress.dataQualityScore > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Chip
            label={`Data Quality: ${Math.round(progress.dataQualityScore)}%`}
            color={progress.dataQualityScore >= 80 ? 'success' : progress.dataQualityScore >= 60 ? 'warning' : 'default'}
            size="small"
          />
        </Box>
      )}

      {/* Step Content */}
      <Paper elevation={2} sx={{ minHeight: 500 }}>
        {renderStep()}
      </Paper>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={onCancel || handlePrevious}
          disabled={isLoading}
          startIcon={<ArrowBack />}
        >
          {isFirstStep ? 'Cancel' : 'Previous'}
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isLastStep && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validation.isValid || isLoading}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}

          {isLastStep && (
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={!validation.isValid || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Check />}
            >
              {isLoading ? 'Analyzing...' : 'Complete Analysis'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Validation Errors */}
      {Object.keys(validation.errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following errors:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {Object.values(validation.errors).map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Validation Warnings */}
      {Object.keys(validation.warnings).length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Warnings:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {Object.values(validation.warnings).map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

export default MFPropertyWizard;
