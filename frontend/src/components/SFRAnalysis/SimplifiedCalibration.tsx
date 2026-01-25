import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { appleColors } from '../../theme/appleDesignSystem';
import { getScoreColor } from '../../utils/scoreColors';

interface SimplifiedCalibrationProps {
  cashFlowScore: number;        // 0-100
  irrScore: number;             // 0-100
  marketStrengthScore: number;  // 0-100
  cashFlowValue: string;        // e.g., "-$667/month"
  irrValue: string;             // e.g., "14.32%" (IRR is inherently annualized)
  marketStrengthValue: string;  // e.g., "Strong market"
}

/**
 * SimplifiedCalibration Component
 *
 * Displays 3 key investment factors that drive Deal Quality score.
 * Shows Cash Flow, Total Return (IRR), and Market Strength with actual values.
 */
const SimplifiedCalibration: React.FC<SimplifiedCalibrationProps> = ({
  cashFlowScore,
  irrScore,
  marketStrengthScore,
  cashFlowValue,
  irrValue,
  marketStrengthValue,
}) => {
  const metrics = [
    {
      icon: '💰',
      label: 'Cash Flow',
      value: Math.round(cashFlowScore),
      actualValue: cashFlowValue,
      description: '35% weight',
    },
    {
      icon: '📈',
      label: 'IRR',
      value: Math.round(irrScore),
      actualValue: irrValue,
      description: '25% weight',
    },
    {
      icon: '🏙️',
      label: 'Market Strength',
      value: Math.round(marketStrengthScore),
      actualValue: marketStrengthValue,
      description: '15% weight',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '16px' }}>{metric.icon}</Typography>
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
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: getScoreColor(metric.value),
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
                    backgroundColor: getScoreColor(metric.value),
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

              {/* Actual Value */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '13px',
                  color: appleColors.gray[800],
                  fontWeight: 600,
                  mt: 0.5,
                }}
              >
                {metric.actualValue}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SimplifiedCalibration;
