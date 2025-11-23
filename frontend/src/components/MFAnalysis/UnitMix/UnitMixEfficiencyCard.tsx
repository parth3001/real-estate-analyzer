/**
 * Unit Mix Efficiency Score Card Component
 *
 * Displays the 0-100 unit mix efficiency score with breakdown.
 * Shows diversification, market alignment, and rent efficiency sub-scores.
 *
 * INDUSTRY BENCHMARK SOURCE:
 * - IREM (Institute of Real Estate Management): Economic Occupancy ≥90% = Solid, ≥95% = Excellent
 * - NMHC (National Multifamily Housing Council): Pre-pandemic baseline 95.9% rent collection (2019)
 * - Industry Consensus: 90%+ optimal revenue generation, <90% indicates improvement opportunities
 * - Fannie Mae Minimum: 70% economic occupancy for financing eligibility
 *
 * Our calculation: (currentRent / marketRentPotential) × 100
 * This is identical to Economic Occupancy as defined by IREM and institutional investors.
 *
 * @component
 */

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface UnitMixEfficiencyCardProps {
  overallScore: number;
  breakdown?: {
    diversification?: number;
    marketAlignment?: number;
    rentEfficiency?: number;
  };
}

export const UnitMixEfficiencyCard: React.FC<UnitMixEfficiencyCardProps> = ({
  overallScore,
  breakdown
}) => {
  // Determine score color and label (Issue #24: Aligned with IREM standards)
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 90) return 'success';  // IREM: Solid performance
    if (score >= 70) return 'warning';  // Fannie Mae minimum threshold
    return 'error';                     // Below financing threshold
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 95) return 'Excellent';              // IREM: Excellent operational efficiency
    if (score >= 90) return 'Solid';                  // IREM: Solid performance
    if (score >= 80) return 'Below Benchmark';        // Close to IREM standard
    if (score >= 70) return 'Opportunity';            // Clear value-add, still financeable
    return 'Significant Opportunity';                 // Major value-add, financing challenges
  };

  const getProgressColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const scoreColor = getScoreColor(overallScore);
  const scoreLabel = getScoreLabel(overallScore);

  return (
    <Paper sx={{ padding: 3, marginBottom: 3 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" marginBottom={2}>
        <Typography variant="h6" flex={1}>
          Unit Mix Efficiency Score
          <Tooltip title="Measures how effectively current rents capture market potential. Calculated as (current rent / market rent potential) × 100. Based on IREM economic occupancy standards.">
            <InfoIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
          </Tooltip>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`${overallScore.toFixed(0)}/100`}
            color={scoreColor}
            size="medium"
            sx={{ fontSize: '1.2rem', fontWeight: 'bold', paddingX: 2, paddingY: 1 }}
          />
          <Chip label={scoreLabel} color={scoreColor} variant="outlined" />
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Measures optimization of unit mix, rent positioning, and diversification
      </Typography>

      {/* Overall Score Bar */}
      <Box sx={{ marginTop: 2, marginBottom: 3 }}>
        <LinearProgress
          variant="determinate"
          value={overallScore}
          color={getProgressColor(overallScore)}
          sx={{
            height: 12,
            borderRadius: 1,
            bgcolor: 'grey.200'
          }}
        />
      </Box>

      {/* Breakdown (if available) */}
      {breakdown && (
        <Stack spacing={2}>
          {breakdown.diversification !== undefined && (
            <Box>
              <Stack direction="row" justifyContent="space-between" marginBottom={0.5}>
                <Typography variant="body2">
                  Diversification
                  <Tooltip title="Measures income distribution across unit types using the Herfindahl-Hirschman Index (HHI). Lower concentration = higher diversification = lower risk. Industry standard: HHI < 2,500 is well-diversified.">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.9rem' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {breakdown.diversification.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={breakdown.diversification}
                color={getProgressColor(breakdown.diversification)}
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Mix of unit types and income distribution
              </Typography>
            </Box>
          )}

          {breakdown.marketAlignment !== undefined && (
            <Box>
              <Stack direction="row" justifyContent="space-between" marginBottom={0.5}>
                <Typography variant="body2">
                  Market Alignment
                  <Tooltip title="Compares current rents to market rates. Scores above 100% indicate above-market pricing (pricing risk). Scores 95-100% are optimal. Scores below 95% indicate value-add opportunity.">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.9rem' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {breakdown.marketAlignment.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={breakdown.marketAlignment}
                color={getProgressColor(breakdown.marketAlignment)}
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                How current rents compare to market rates
              </Typography>
            </Box>
          )}

          {breakdown.rentEfficiency !== undefined && (
            <Box>
              <Stack direction="row" justifyContent="space-between" marginBottom={0.5}>
                <Typography variant="body2">
                  Rent Efficiency
                  <Tooltip title="Rent per square foot relative to building type. Higher scores indicate better space utilization and rent optimization. Compares actual rent/sqft to optimal rent/sqft for the building type.">
                    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle', fontSize: '0.9rem' }} />
                  </Tooltip>
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {breakdown.rentEfficiency.toFixed(0)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={breakdown.rentEfficiency}
                color={getProgressColor(breakdown.rentEfficiency)}
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Rent per square foot relative to building type
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {/* Benchmark Context */}
      <Alert severity="info" sx={{ marginTop: 2 }}>
        <Typography variant="body2">
          <strong>Industry Benchmark (IREM):</strong> 90%+ is solid, 95%+ is excellent, below 90% indicates rent optimization opportunity
        </Typography>
      </Alert>
    </Paper>
  );
};

export default UnitMixEfficiencyCard;
