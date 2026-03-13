/**
 * WizardStep - Common wrapper component for all wizard steps
 * Provides consistent layout, validation display, and navigation
 */

import React from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  Warning,
  Error,
  CheckCircle,
  Info,
  DataUsage
} from '@mui/icons-material';

import type { StepValidation, DataConfidence } from './wizardTypes';

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  validation: StepValidation;
  isLoading?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  dataConfidence?: Record<string, DataConfidence>;
  autoPopulatedFields?: string[];
  className?: string;
}

const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  children,
  validation,
  isLoading = false,
  showProgress = false,
  progressValue = 0,
  dataConfidence = {},
  autoPopulatedFields = [],
  className
}) => {
  // Calculate overall data confidence for this step
  const calculateStepConfidence = (): { score: number; count: number } => {
    const confidenceValues = Object.values(dataConfidence)
      .map(conf => conf.score)
      .filter(score => score > 0);
    
    if (confidenceValues.length === 0) {
      return { score: 0, count: 0 };
    }
    
    const averageScore = confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length;
    return { score: Math.round(averageScore), count: confidenceValues.length };
  };

  const stepConfidence = calculateStepConfidence();

  // Get confidence color
  const getConfidenceColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Get validation icon
  const getValidationIcon = () => {
    // Defensive: handle undefined validation
    if (!validation || !validation.errors || !validation.warnings) {
      return <Info color="info" />;
    }

    if (Object.keys(validation.errors).length > 0) {
      return <Error color="error" />;
    }
    if (Object.keys(validation.warnings).length > 0) {
      return <Warning color="warning" />;
    }
    if (validation.isValid) {
      return <CheckCircle color="success" />;
    }
    return <Info color="info" />;
  };

  return (
    <Card className={className} sx={{ height: '100%' }}>
      {/* Loading Progress */}
      <Collapse in={isLoading || showProgress}>
        <LinearProgress
          variant={isLoading ? 'indeterminate' : 'determinate'}
          value={progressValue}
          sx={{ height: 4 }}
        />
      </Collapse>

      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            
            {/* Step Status Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getValidationIcon()}
              {stepConfidence.count > 0 && (
                <Chip
                  icon={<DataUsage />}
                  label={`${stepConfidence.score}% confidence`}
                  size="small"
                  color={getConfidenceColor(stepConfidence.score)}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}

          {/* Auto-population Summary */}
          {autoPopulatedFields.length > 0 && (
            <Alert 
              severity="info" 
              variant="outlined" 
              sx={{ mb: 2 }}
              icon={<DataUsage />}
            >
              <Typography variant="body2">
                {autoPopulatedFields.length} field{autoPopulatedFields.length !== 1 ? 's' : ''} auto-populated from external data sources
              </Typography>
            </Alert>
          )}

          <Divider />
        </Box>

        {/*
          Validation Messages: Removed redundant top-level alerts
          Errors are shown inline via TextField error prop + helperText
          This provides cleaner UI and follows Apple HIG contextual error principle
        */}

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>

        {/* Data Sources Footer */}
        {Object.keys(dataConfidence).length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Data Sources:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(dataConfidence).map(([field, conf]) => (
                <Chip
                  key={field}
                  label={`${field}: ${conf.source}`}
                  size="small"
                  variant="outlined"
                  color={getConfidenceColor(conf.score)}
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WizardStep;