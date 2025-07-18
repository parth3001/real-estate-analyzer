// Apple-Style Progress Indicator Component
// For wizard steps with animated progress

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProgressStep {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface AppleProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export const AppleProgressIndicator: React.FC<AppleProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}) => {
  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const statusStyles = {
    completed: {
      backgroundColor: 'success.500',
      color: 'white',
      boxShadow: '0 4px 12px -4px rgba(16, 185, 129, 0.4)'
    },
    current: {
      backgroundColor: 'primary.500',
      color: 'white',
      boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.4)',
      transform: 'scale(1.1)'
    },
    upcoming: {
      backgroundColor: 'grey.100',
      color: 'grey.600',
      border: '2px solid',
      borderColor: 'grey.200'
    }
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="space-between"
      sx={{ 
        padding: '24px',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'grey.100'
      }}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <Box 
            display="flex" 
            alignItems="center"
            sx={{ 
              cursor: onStepClick ? 'pointer' : 'default',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={() => onStepClick?.(step.id)}
          >
            {/* Step Circle */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...statusStyles[getStepStatus(step.id)]
              }}
            >
              {step.icon || (
                <Typography fontWeight={700} fontSize="16px">
                  {index + 1}
                </Typography>
              )}
            </Box>

            {/* Step Content */}
            <Box ml={2}>
              <Typography 
                variant="body1" 
                fontWeight={600}
                color={getStepStatus(step.id) === 'upcoming' ? 'text.secondary' : 'text.primary'}
              >
                {step.title}
              </Typography>
              {step.subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '12px' }}
                >
                  {step.subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <Box
              sx={{
                flex: 1,
                height: '2px',
                mx: 3,
                backgroundColor: completedSteps.includes(steps[index + 1].id) || 
                                 steps[index + 1].id === currentStep ? 
                                 'primary.300' : 'grey.200',
                borderRadius: '1px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default AppleProgressIndicator;