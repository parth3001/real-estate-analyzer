/**
 * Scenario Comparison Modal Component
 *
 * Side-by-side comparison of selected exit scenarios (2-3 scenarios max).
 *
 * Tiered Metrics Display:
 * - Tier 1 (Headline): Total Wealth, IRR, Net Proceeds
 * - Tier 2 (Breakdown): Capital Recovered, Cash Flow, Appreciation, Principal Paid
 * - Tier 3 (Sale Details): Sale Price, Selling Costs, Mortgage Payoff
 *
 * Layout:
 * - Grid layout for 2-3 scenarios
 * - Responsive: Stacks vertically on mobile
 * - Highlights best IRR and highest total wealth
 *
 * @author FSE from CLAUDE.md
 * @date December 29, 2025
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as WinnerIcon,
} from '@mui/icons-material';
import type { ExitScenario } from '../../../types/brrrr';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface ScenarioComparisonModalProps {
  scenarios: ExitScenario[];
  open: boolean;
  onClose: () => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  scenarios,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Limit to 3 scenarios
  const displayScenarios = scenarios.slice(0, 3);

  // Find best metrics
  const bestIRR = Math.max(...displayScenarios.map(s => s.irr));
  const bestWealth = Math.max(...displayScenarios.map(s => s.totalWealthCreated));

  const renderMetricRow = (
    label: string,
    getValue: (scenario: ExitScenario) => string,
    highlightBest?: (scenario: ExitScenario) => boolean
  ) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : `200px repeat(${displayScenarios.length}, 1fr)`,
        gap: 2,
        mb: 2,
        alignItems: 'center',
      }}
    >
      {/* Metric Label */}
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.secondary"
        sx={{ mb: isMobile ? 1 : 0 }}
      >
        {label}
      </Typography>

      {/* Values for each scenario */}
      {displayScenarios.map((scenario) => {
        const isBest = highlightBest ? highlightBest(scenario) : false;
        return (
          <Box
            key={scenario.year}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'space-between' : 'center',
              backgroundColor: isBest ? brrrColors.capitalRecovery.light : 'transparent',
              borderRadius: '8px',
              p: 1,
              position: 'relative',
            }}
          >
            {isMobile && (
              <Typography variant="caption" fontWeight={600} sx={{ mr: 2 }}>
                Year {scenario.year}:
              </Typography>
            )}
            <Typography variant="body1" fontWeight={isBest ? 700 : 600}>
              {getValue(scenario)}
            </Typography>
            {isBest && (
              <WinnerIcon
                sx={{
                  ml: 1,
                  fontSize: 16,
                  color: brrrColors.capitalRecovery.dark,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '16px',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Exit Scenario Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Compare {displayScenarios.length} exit scenarios side-by-side
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 2 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Scenario Year Headers (Desktop only) */}
        {!isMobile && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${displayScenarios.length}, 1fr)`,
              gap: 2,
              mb: 3,
            }}
          >
            <Box /> {/* Empty cell for label column */}
            {displayScenarios.map((scenario) => (
              <Box key={scenario.year} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.postRefinance.dark }}>
                  Year {scenario.year}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* TIER 1: HEADLINE METRICS */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            fontWeight={700}
            sx={{ display: 'block', mb: 2, color: brrrColors.postRefinance.dark }}
          >
            Headline Metrics
          </Typography>

          {renderMetricRow(
            'Total Wealth Created',
            (s) => formatCurrency(Math.round(s.totalWealthCreated)),
            (s) => s.totalWealthCreated === bestWealth
          )}

          {renderMetricRow(
            'Internal Rate of Return (IRR)',
            (s) => formatPercent(s.irr, 1),
            (s) => s.irr === bestIRR
          )}

          {renderMetricRow(
            'Net Proceeds from Sale',
            (s) => formatCurrency(Math.round(s.netProceeds))
          )}

          {renderMetricRow(
            'Total Return on Investment',
            (s) => formatPercent(s.totalReturn, 1)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* TIER 2: WEALTH BREAKDOWN */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            fontWeight={700}
            sx={{ display: 'block', mb: 2, color: brrrColors.postRefinance.dark }}
          >
            Wealth Breakdown
          </Typography>

          {renderMetricRow(
            '💰 Capital Recovered (Refinance)',
            (s) => formatCurrency(Math.round(s.breakdown.capitalRecovered))
          )}

          {renderMetricRow(
            '💵 Cumulative Cash Flow',
            (s) => formatCurrency(Math.round(s.breakdown.cumulativeCashFlow))
          )}

          {renderMetricRow(
            '📈 Appreciation Gain',
            (s) => formatCurrency(Math.round(s.breakdown.appreciation))
          )}

          {renderMetricRow(
            '🏦 Principal Paid Down',
            (s) => formatCurrency(Math.round(s.breakdown.principalPaid))
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* TIER 3: SALE DETAILS */}
        <Box>
          <Typography
            variant="overline"
            fontWeight={700}
            sx={{ display: 'block', mb: 2, color: brrrColors.postRefinance.dark }}
          >
            Sale Transaction Details
          </Typography>

          {renderMetricRow(
            'Sale Price',
            (s) => formatCurrency(Math.round(s.salePrice))
          )}

          {renderMetricRow(
            'Selling Costs (6%)',
            (s) => `-${formatCurrency(Math.round(s.sellingCosts))}`
          )}

          {renderMetricRow(
            'Mortgage Payoff',
            (s) => `-${formatCurrency(Math.round(s.mortgagePayoff))}`
          )}
        </Box>

        {/* Winner Callout */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: '12px',
            backgroundColor: brrrColors.capitalRecovery.light,
            border: `2px solid ${brrrColors.capitalRecovery.primary}`,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: brrrColors.capitalRecovery.dark }}>
            💡 Best Overall Exit
          </Typography>
          <Typography variant="body2">
            Year {displayScenarios.find(s => s.totalWealthCreated === bestWealth)?.year} maximizes total wealth
            creation at {formatCurrency(Math.round(bestWealth))} with an IRR of{' '}
            {formatPercent(displayScenarios.find(s => s.totalWealthCreated === bestWealth)?.irr || 0, 1)}.
          </Typography>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            px: 4,
            backgroundColor: brrrColors.postRefinance.primary,
            '&:hover': {
              backgroundColor: brrrColors.postRefinance.dark,
            },
          }}
        >
          Close Comparison
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScenarioComparisonModal;
