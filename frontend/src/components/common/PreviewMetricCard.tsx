/**
 * Preview Metric Card Component
 * 
 * Displays individual metrics with clear preview/saved state indicators
 * Used within PreviewModeComponent for consistent metric display
 * 
 * Created: 2025-07-28
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip
} from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';

interface PreviewMetricCardProps {
  /** The metric value to display */
  value: string | number;
  
  /** The metric label/name */
  label: string;
  
  /** Whether this metric has been updated (shows PREVIEW badge) */
  isPreview: boolean;
  
  /** Optional color for the value (defaults to primary) */
  valueColor?: string;
  
  /** Optional formatting function for the value */
  formatValue?: (value: string | number) => string;
}

const PreviewMetricCard: React.FC<PreviewMetricCardProps> = ({
  value,
  label,
  isPreview,
  valueColor = appleColors.primary[600],
  formatValue
}) => {
  const displayValue = formatValue ? formatValue(value) : value;
  
  return (
    <Box sx={{ 
      textAlign: 'center', 
      p: 2, 
      bgcolor: 'white', 
      borderRadius: '12px', 
      position: 'relative' 
    }}>
      <Chip 
        label={isPreview ? "PREVIEW" : "SAVED"} 
        size="small" 
        sx={{ 
          position: 'absolute', 
          top: 4, 
          right: 4, 
          bgcolor: isPreview ? '#FED7AA' : appleColors.gray[200], 
          color: isPreview ? '#C2410C' : appleColors.gray[600], 
          fontSize: '10px',
          fontWeight: 600
        }} 
      />
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: valueColor,
          mt: 1
        }}
      >
        {displayValue}
      </Typography>
      <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
        {label}
      </Typography>
    </Box>
  );
};

export default PreviewMetricCard;