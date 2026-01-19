import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';

interface SimplifiedCalibrationProps {
  dealQuality: number;        // 0-100
  executionDifficulty: number; // 0-100 (will be inverted to show ease)
  dataReliability: number;     // 0-100
}

/**
 * SimplifiedCalibration Component
 *
 * Displays 3 professional calibration metrics as bullet list.
 * Replaces old V3.0 calibration box with cleaner presentation.
 *
 * Note: Execution Difficulty is inverted (100 - difficulty) to show "Execution Ease"
 * Label update: "Data Quality" → "Data Completeness"
 */
const SimplifiedCalibration: React.FC<SimplifiedCalibrationProps> = ({
  dealQuality,
  executionDifficulty,
  dataReliability,
}) => {
  // Invert execution difficulty to show ease (higher = easier)
  const executionEase = 100 - executionDifficulty;

  const metrics = [
    {
      label: 'Deal Quality',
      value: Math.round(dealQuality),
      description: 'Weighted assessment of investment fundamentals',
    },
    {
      label: 'Execution Complexity',
      value: Math.round(executionEase),
      description: 'Difficulty level for executing this investment',
    },
    {
      label: 'Data Completeness',
      value: Math.round(dataReliability),
      description: 'Quality and reliability of input data',
    },
  ];

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: appleColors.primary[600],
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '11px',
          display: 'block',
          mb: 2,
        }}
      >
        Professional Calibration
      </Typography>

      {/* Responsive Grid: Vertical on mobile, Horizontal 3-column on desktop */}
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid key={index} size={{ xs: 12, md: 4 }}>
            <Box>
              {/* Label and Value */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '12px',
                    color: appleColors.gray[600],
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    fontWeight: 600,
                  }}
                >
                  {metric.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: appleColors.gray[900],
                  }}
                >
                  {metric.value}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '14px',
                      color: appleColors.gray[500],
                      fontWeight: 600,
                    }}
                  >
                    /100
                  </Typography>
                </Typography>
              </Box>

              {/* Progress Bar */}
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  backgroundColor: appleColors.gray[200],
                  borderRadius: '4px',
                  overflow: 'hidden',
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: `${metric.value}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${appleColors.primary[400]}, ${appleColors.primary[600]})`,
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </Box>

              {/* Description */}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  color: appleColors.gray[600],
                  display: 'block',
                  lineHeight: 1.3,
                }}
              >
                {metric.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimplifiedCalibration;
