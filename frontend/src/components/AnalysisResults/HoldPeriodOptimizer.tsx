/**
 * HoldPeriodOptimizer - Interactive Tax Timeline Visualization
 *
 * Apple-inspired timeline showing tax implications across different hold periods
 * Interactive hover states with detailed tax breakdown
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tooltip,
  Chip,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as IRRIcon,
  AccountBalance as TaxIcon,
  CheckCircle as OptimalIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface HoldPeriodAnalysis {
  holdPeriod: number;
  afterTaxIRR: number;
  totalTaxLiability: number;
  taxSavingsVsPreviousYear: number;
  netProceedsFromSale: number;
  capitalGain: number;
  federalCapitalGainsRate: number;
  stateCapitalGainsRate: number;
}

interface HoldPeriodOptimizerProps {
  holdPeriodAnalysis: HoldPeriodAnalysis[];
  optimalHoldPeriod: number;
  totalTaxSavingsAtOptimal: number;
}

const HoldPeriodOptimizer: React.FC<HoldPeriodOptimizerProps> = ({
  holdPeriodAnalysis,
  optimalHoldPeriod,
  totalTaxSavingsAtOptimal
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Calculate metrics for visualization
  const { maxIRR, minIRR, maxTaxLiability } = useMemo(() => {
    const irrs = holdPeriodAnalysis.map(h => h.afterTaxIRR);
    const taxes = holdPeriodAnalysis.map(h => h.totalTaxLiability);

    return {
      maxIRR: Math.max(...irrs),
      minIRR: Math.min(...irrs),
      maxTaxLiability: Math.max(...taxes)
    };
  }, [holdPeriodAnalysis]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getIRRHeight = (irr: number): number => {
    const range = maxIRR - minIRR;
    return range > 0 ? ((irr - minIRR) / range) * 100 : 50;
  };

  const getTaxHeight = (taxLiability: number): number => {
    return maxTaxLiability > 0 ? (taxLiability / maxTaxLiability) * 100 : 0;
  };

  const getHoldPeriodLabel = (years: number): string => {
    if (years === 1) return '1 Year';
    return `${years} Years`;
  };

  const getHoldPeriodDescription = (analysis: HoldPeriodAnalysis): string => {
    if (analysis.holdPeriod === 1) {
      return 'Short-term capital gains (taxed as ordinary income)';
    } else if (analysis.holdPeriod === 2) {
      return 'Long-term capital gains rate applies';
    } else {
      return 'Depreciation benefits and long-term rates';
    }
  };

  const getPeriodColor = (analysis: HoldPeriodAnalysis): string => {
    if (analysis.holdPeriod === optimalHoldPeriod) {
      return 'success';
    } else if (analysis.holdPeriod === 1) {
      return 'error';
    } else {
      return 'primary';
    }
  };

  const selectedAnalysis = selectedPeriod ?
    holdPeriodAnalysis.find(h => h.holdPeriod === selectedPeriod) :
    holdPeriodAnalysis.find(h => h.holdPeriod === optimalHoldPeriod);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <TimelineIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Hold Period Tax Optimizer
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Interactive timeline showing tax implications by exit year
            </Typography>
          </Box>
        </Box>

        {/* Timeline Visualization */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'end',
            gap: 1,
            height: 200,
            px: 2,
            py: 1
          }}>
            {holdPeriodAnalysis.map((analysis) => {
              const isOptimal = analysis.holdPeriod === optimalHoldPeriod;
              const isSelected = selectedPeriod === analysis.holdPeriod;
              const color = getPeriodColor(analysis);
              const irrHeight = getIRRHeight(analysis.afterTaxIRR);
              const taxHeight = getTaxHeight(analysis.totalTaxLiability);

              return (
                <Tooltip
                  key={analysis.holdPeriod}
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        {getHoldPeriodLabel(analysis.holdPeriod)}
                        {isOptimal && ' (Optimal)'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        After-tax IRR: {formatPercentage(analysis.afterTaxIRR)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Tax liability: {formatCurrency(analysis.totalTaxLiability)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Capital gains rate: {formatPercentage(analysis.federalCapitalGainsRate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getHoldPeriodDescription(analysis)}
                      </Typography>
                    </Box>
                  }
                  placement="top"
                  arrow
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                    onClick={() => setSelectedPeriod(
                      selectedPeriod === analysis.holdPeriod ? null : analysis.holdPeriod
                    )}
                  >
                    {/* IRR Bar */}
                    <Box
                      sx={{
                        width: 24,
                        height: `${Math.max(irrHeight, 10)}%`,
                        backgroundColor: `${color}.main`,
                        borderRadius: '4px 4px 0 0',
                        mb: 0.5,
                        position: 'relative',
                        opacity: isSelected ? 1 : 0.8,
                        boxShadow: isOptimal ? `0 0 8px ${color === 'success' ? '#4caf50' : '#2196f3'}` : 'none'
                      }}
                    >
                      {/* Optimal indicator */}
                      {isOptimal && (
                        <OptimalIcon
                          sx={{
                            position: 'absolute',
                            top: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 16,
                            color: 'success.main',
                            backgroundColor: 'white',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                    </Box>

                    {/* Tax liability indicator */}
                    <Box
                      sx={{
                        width: 16,
                        height: `${Math.max(taxHeight * 0.3, 5)}%`,
                        backgroundColor: 'error.light',
                        borderRadius: '0 0 2px 2px',
                        opacity: 0.6,
                        mb: 1
                      }}
                    />

                    {/* Period label */}
                    <Typography
                      variant="caption"
                      fontWeight={isOptimal ? 600 : 400}
                      color={isOptimal ? 'success.main' : 'text.secondary'}
                      sx={{ textAlign: 'center' }}
                    >
                      {analysis.holdPeriod}Y
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          {/* Legend */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 16,
                height: 16,
                backgroundColor: 'primary.main',
                borderRadius: 1
              }} />
              <Typography variant="caption" color="text.secondary">
                After-tax IRR
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 16,
                height: 16,
                backgroundColor: 'error.light',
                borderRadius: 1
              }} />
              <Typography variant="caption" color="text.secondary">
                Tax liability
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <OptimalIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Optimal period
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Selected Period Details */}
        {selectedAnalysis && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {getHoldPeriodLabel(selectedAnalysis.holdPeriod)} Analysis
                {selectedAnalysis.holdPeriod === optimalHoldPeriod && ' (Optimal)'}
              </Typography>

              {selectedAnalysis.holdPeriod === optimalHoldPeriod && (
                <Chip
                  icon={<OptimalIcon />}
                  label="Recommended"
                  color="success"
                  size="small"
                />
              )}
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 3
            }}>
              {/* After-tax IRR */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <IRRIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    After-tax IRR
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {formatPercentage(selectedAnalysis.afterTaxIRR)}
                </Typography>
              </Box>

              {/* Tax Liability */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TaxIcon sx={{ fontSize: 18, color: 'error.main' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Tax Liability
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  {formatCurrency(selectedAnalysis.totalTaxLiability)}
                </Typography>
              </Box>

              {/* Net Proceeds */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Net Proceeds from Sale
                </Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  {formatCurrency(selectedAnalysis.netProceedsFromSale)}
                </Typography>
              </Box>
            </Box>

            {/* Tax Rate Breakdown */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Tax Rate Breakdown
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Federal Capital Gains
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPercentage(selectedAnalysis.federalCapitalGainsRate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    State Capital Gains
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPercentage(selectedAnalysis.stateCapitalGainsRate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Capital Gain
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(selectedAnalysis.capitalGain)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Tax Impact vs Previous Year */}
            {Math.abs(selectedAnalysis.taxSavingsVsPreviousYear) > 1000 && (
              <Box sx={{
                mt: 2,
                p: 2,
                backgroundColor: selectedAnalysis.taxSavingsVsPreviousYear > 0 ? 'success.50' : 'warning.50',
                borderRadius: 1
              }}>
                <Typography variant="body2" color={selectedAnalysis.taxSavingsVsPreviousYear > 0 ? "success.dark" : "warning.dark"}>
                  <strong>Tax Impact:</strong> Holding one more year {
                    selectedAnalysis.taxSavingsVsPreviousYear > 0 ?
                    `saves ${formatCurrency(selectedAnalysis.taxSavingsVsPreviousYear)} in taxes` :
                    `costs ${formatCurrency(Math.abs(selectedAnalysis.taxSavingsVsPreviousYear))} more in taxes`
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Summary Insight */}
        <Box sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'primary.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.200'
        }}>
          <Typography variant="body2" color="primary.dark">
            <strong>Bottom Line:</strong> Hold {optimalHoldPeriod} year{optimalHoldPeriod > 1 ? 's' : ''} for much better returns.
            {totalTaxSavingsAtOptimal >= 0 ?
              ` You'll also save ${formatCurrency(totalTaxSavingsAtOptimal)} in taxes.` :
              ` Yes, you'll pay ${formatCurrency(Math.abs(totalTaxSavingsAtOptimal))} more in taxes, but your returns will be much higher.`
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HoldPeriodOptimizer;