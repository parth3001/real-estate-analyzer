/**
 * Reusable Preview Mode Component
 * 
 * Provides consistent preview/commit UX pattern across Interactive Analysis,
 * Deal Optimizer, and Stress Testing features.
 * 
 * Created: 2025-07-28
 */

import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Stack,
  Chip
} from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';

interface PreviewModeComponentProps {
  /** Whether there are unsaved changes in preview mode */
  hasUnsavedChanges: boolean;
  
  /** Callback when user wants to apply/commit changes */
  onApplyChanges: () => void;
  
  /** Callback when user wants to discard/reset changes */
  onDiscardChanges: () => void;
  
  /** Feature name for contextual messaging (e.g., "Interactive Analysis", "Deal Optimizer") */
  featureName: string;
  
  /** Optional custom description for the feature */
  description?: string;
  
  /** Whether the feature is currently calculating/loading */
  isCalculating?: boolean;
  
  /** Optional performance metric to display */
  calculationTime?: number;
  
  /** Children content (typically the preview metrics/results) */
  children: React.ReactNode;
}

const PreviewModeComponent: React.FC<PreviewModeComponentProps> = ({
  hasUnsavedChanges,
  onApplyChanges,
  onDiscardChanges,
  featureName,
  description,
  isCalculating = false,
  calculationTime,
  children
}) => {
  const defaultDescription = `Changes shown below are previews only. Use "Apply Changes" to update your full analysis.`;
  
  return (
    <Box>
      {/* Preview Mode Banner */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3, 
          borderRadius: '12px',
          backgroundColor: '#EBF8FF',
          border: `1px solid #90CDF4`,
          '& .MuiAlert-icon': {
            color: '#3182CE'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2C5282' }}>
              🎛️ {featureName} - Preview Mode Active
            </Typography>
            <Typography variant="body2" sx={{ color: '#2C5282', mt: 0.5 }}>
              {description || defaultDescription}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              disabled={!hasUnsavedChanges}
              onClick={onApplyChanges}
              sx={{
                backgroundColor: hasUnsavedChanges ? '#3182CE' : appleColors.gray[400],
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: hasUnsavedChanges ? '#2C5282' : appleColors.gray[500]
                },
                '&:disabled': {
                  backgroundColor: appleColors.gray[300],
                  color: appleColors.gray[500]
                }
              }}
            >
              {hasUnsavedChanges ? 'Apply Changes' : 'No Changes'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={!hasUnsavedChanges}
              onClick={onDiscardChanges}
              sx={{
                borderColor: hasUnsavedChanges ? '#3182CE' : appleColors.gray[300],
                color: hasUnsavedChanges ? '#3182CE' : appleColors.gray[400],
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: hasUnsavedChanges ? '#EBF8FF' : 'transparent',
                  borderColor: hasUnsavedChanges ? '#2C5282' : appleColors.gray[300]
                },
                '&:disabled': {
                  borderColor: appleColors.gray[300],
                  color: appleColors.gray[400]
                }
              }}
            >
              {hasUnsavedChanges ? 'Discard Changes' : 'No Changes'}
            </Button>
          </Stack>
        </Box>
      </Alert>

      {/* Preview Results Container */}
      <Box sx={{ 
        p: 3, 
        bgcolor: '#FFF7ED', 
        borderRadius: '16px', 
        border: `2px dashed #FB923C` 
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#C2410C' }}>
              📊 Preview Results
            </Typography>
            <Typography variant="body2" sx={{ color: '#C2410C', mt: 0.5 }}>
              These metrics reflect your changes. Apply to update full analysis.
            </Typography>
          </Box>
          {calculationTime !== undefined && calculationTime > 0 && (
            <Chip
              label={`${calculationTime}ms`}
              size="small"
              sx={{
                bgcolor: calculationTime < 50 ? appleColors.success[100] : 
                        calculationTime < 100 ? appleColors.warning[100] : 
                        appleColors.error[100],
                color: calculationTime < 50 ? appleColors.success[700] : 
                       calculationTime < 100 ? appleColors.warning[700] : 
                       appleColors.error[700],
                fontWeight: 500
              }}
            />
          )}
        </Stack>
        
        {/* Preview Content */}
        {children}
        
        {/* Status Messages */}
        {isCalculating && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#C2410C', fontStyle: 'italic' }}>
              ⚡ Calculating preview metrics...
            </Typography>
          </Box>
        )}
        {!isCalculating && hasUnsavedChanges && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#C2410C', fontSize: '0.875rem' }}>
              💡 Preview metrics updated. Click "Apply Changes" to update your full analysis across all tabs.
            </Typography>
          </Box>
        )}
        {!isCalculating && !hasUnsavedChanges && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#C2410C', fontSize: '0.875rem' }}>
              📈 Make changes above to see instant preview updates. Click "Apply Changes" when ready.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PreviewModeComponent;