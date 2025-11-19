/**
 * ValidationWarningsDisplay Component
 *
 * Displays validation warnings from backend analysis with severity indicators
 * Phase 1: Multi-Family Property Analysis
 */

import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { ValidationWarning } from '../../types/analysis';

interface ValidationWarningsDisplayProps {
  warnings: ValidationWarning[];
}

const ValidationWarningsDisplay: React.FC<ValidationWarningsDisplayProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  // Group warnings by severity
  const highWarnings = warnings.filter(w => w.severity === 'HIGH');
  const mediumWarnings = warnings.filter(w => w.severity === 'MEDIUM');
  const lowWarnings = warnings.filter(w => w.severity === 'LOW');

  // Get severity icon and color
  const getSeverityProps = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH':
        return {
          icon: <ErrorIcon />,
          color: 'error' as const,
          label: 'Critical',
          bgcolor: 'error.lighter'
        };
      case 'MEDIUM':
        return {
          icon: <WarningIcon />,
          color: 'warning' as const,
          label: 'Warning',
          bgcolor: 'warning.lighter'
        };
      case 'LOW':
        return {
          icon: <InfoIcon />,
          color: 'info' as const,
          label: 'Info',
          bgcolor: 'info.lighter'
        };
    }
  };

  // Get category display name
  const getCategoryName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      'OPERATING_EXPENSES': 'Operating Expenses',
      'FINANCING': 'Financing',
      'MARKET_DATA': 'Market Data',
      'INPUT_VALIDATION': 'Input Validation'
    };
    return categoryNames[category] || category;
  };

  // Render individual warning
  const renderWarning = (warning: ValidationWarning, index: number) => {
    const severityProps = getSeverityProps(warning.severity);

    return (
      <Accordion key={index} sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            {severityProps.icon}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {warning.message}
              </Typography>
            </Box>
            <Chip
              label={getCategoryName(warning.category)}
              size="small"
              variant="outlined"
              color={severityProps.color}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {warning.impact && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Impact:
              </Typography>
              <Typography variant="body2">
                {warning.impact}
              </Typography>
            </Box>
          )}

          {warning.recommendation && (
            <Box sx={{ mb: warning.affectedMetric ? 2 : 0 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recommendation:
              </Typography>
              <Typography variant="body2">
                {warning.recommendation}
              </Typography>
            </Box>
          )}

          {warning.affectedMetric && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Affected Metrics:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {warning.affectedMetric}
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ my: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Data Quality Warnings ({warnings.length})
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        The following warnings were detected during analysis. Review them to ensure accurate results.
      </Typography>

      {/* High severity warnings */}
      {highWarnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ mb: 1 }}>
            <AlertTitle>
              Critical Issues ({highWarnings.length})
            </AlertTitle>
            These issues strongly affect your analysis results. Please review and correct.
          </Alert>
          {highWarnings.map((warning, idx) => renderWarning(warning, idx))}
        </Box>
      )}

      {/* Medium severity warnings */}
      {mediumWarnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="warning" sx={{ mb: 1 }}>
            <AlertTitle>
              Warnings ({mediumWarnings.length})
            </AlertTitle>
            These issues may affect your analysis. Investigation recommended.
          </Alert>
          {mediumWarnings.map((warning, idx) => renderWarning(warning, idx + highWarnings.length))}
        </Box>
      )}

      {/* Low severity warnings */}
      {lowWarnings.length > 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 1 }}>
            <AlertTitle>
              Informational ({lowWarnings.length})
            </AlertTitle>
            Minor concerns for your awareness.
          </Alert>
          {lowWarnings.map((warning, idx) => renderWarning(warning, idx + highWarnings.length + mediumWarnings.length))}
        </Box>
      )}
    </Box>
  );
};

export default ValidationWarningsDisplay;
