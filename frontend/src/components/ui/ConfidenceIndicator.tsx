import React from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';

export type ConfidenceLevel = 1 | 2 | 3;

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  source?: string; // Optional source for tooltip
  interactive?: boolean;
}

const CONFIDENCE_CONFIG = {
  1: {
    label: 'Basic Insights',
    description: 'Property address, price, and basic information',
    shortLabel: 'Basic',
    color: '#8E8E93', // Gray
  },
  2: {
    label: 'Good Insights', 
    description: 'Cash flow and ROI metrics calculated',
    shortLabel: 'Good',
    color: '#FF9500', // Orange
  },
  3: {
    label: 'Complete Insights',
    description: 'Full analysis with market data and AI recommendations',
    shortLabel: 'Complete',
    color: '#34C759', // Green
  }
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ 
  level, 
  size = 'medium',
  showLabel = false,
  source,
  interactive = true
}) => {
  const theme = useTheme();
  
  // Size configurations
  const sizes = {
    small: { dot: 6, gap: 0.25, fontSize: '0.75rem' },
    medium: { dot: 8, gap: 0.35, fontSize: '0.8125rem' },
    large: { dot: 10, gap: 0.5, fontSize: '0.875rem' }
  };
  
  const config = CONFIDENCE_CONFIG[level];
  const sizeConfig = sizes[size];
  
  // Build tooltip content
  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {config.label}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
        {config.description}
      </Typography>
      {source && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
          Source: {source}
        </Typography>
      )}
    </Box>
  );
  
  const dots = (
    <Box sx={{ 
      display: 'flex', 
      gap: sizeConfig.gap,
      alignItems: 'center'
    }}>
      {[1, 2, 3].map((dot) => (
        <Box
          key={dot}
          sx={{
            width: sizeConfig.dot,
            height: sizeConfig.dot,
            borderRadius: '50%',
            backgroundColor: dot <= level 
              ? config.color 
              : theme.palette.grey[300],
            transition: 'all 0.2s ease',
            // Add subtle animation on load
            animation: dot <= level 
              ? `confidencePulse 0.3s ease ${dot * 0.1}s` 
              : 'none',
            '@keyframes confidencePulse': {
              '0%': { transform: 'scale(0)' },
              '50%': { transform: 'scale(1.2)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        />
      ))}
    </Box>
  );
  
  const content = (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 1,
      cursor: interactive ? 'help' : 'default'
    }}>
      {dots}
      {showLabel && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: sizeConfig.fontSize,
            color: theme.palette.text.secondary,
            fontWeight: 500
          }}
        >
          {config.shortLabel}
        </Typography>
      )}
    </Box>
  );
  
  return interactive ? (
    <Tooltip title={tooltipContent} placement="top" arrow>
      {content}
    </Tooltip>
  ) : content;
};

// Helper function to calculate confidence from property data
export const calculateConfidence = (property: any): ConfidenceLevel => {
  // Check for full analysis (Level 3)
  if (property.analysis?.investmentDecision?.verdict || 
      property.analysis?.keyMetrics?.irr) {
    return 3;
  }
  
  // Check for quick metrics (Level 2)
  if (property.quickMetrics?.cashFlow !== undefined || 
      property.quickMetrics?.capRate !== undefined ||
      property.monthlyAnalysis?.cashFlow !== undefined) {
    return 2;
  }
  
  // Basic data only (Level 1)
  return 1;
};

// Helper to get missing data points for confidence upgrade
export const getMissingDataPoints = (currentLevel: ConfidenceLevel): string[] => {
  switch(currentLevel) {
    case 1:
      return [
        'Monthly rent and expenses',
        'Financing details',
        'Cash flow calculations'
      ];
    case 2:
      return [
        'Market comparables',
        'Risk assessment',
        'AI-powered insights',
        'Long-term projections'
      ];
    case 3:
      return []; // Already complete
    default:
      return [];
  }
};

// Helper to get next action for confidence upgrade
export const getNextAction = (currentLevel: ConfidenceLevel): string => {
  switch(currentLevel) {
    case 1:
      return 'Run Quick Calculator';
    case 2:
      return 'Complete Full Analysis';
    case 3:
      return 'Analysis Complete';
    default:
      return '';
  }
};