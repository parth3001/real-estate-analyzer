/**
 * Unit Mix Efficiency Score Card Component
 *
 * Displays the 0-100 unit mix efficiency score with breakdown.
 * Shows diversification, market alignment, and rent efficiency sub-scores.
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
  Alert
} from '@mui/material';

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
  // Determine score color and label
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
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
                <Typography variant="body2">Diversification</Typography>
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
                <Typography variant="body2">Market Alignment</Typography>
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
                <Typography variant="body2">Rent Efficiency</Typography>
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
          <strong>Industry Benchmark:</strong> 80+ is excellent, 60-79 is good, below 60 needs attention
        </Typography>
      </Alert>
    </Paper>
  );
};

export default UnitMixEfficiencyCard;
