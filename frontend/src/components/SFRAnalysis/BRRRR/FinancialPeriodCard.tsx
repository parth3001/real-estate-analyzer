/**
 * BRRRR Financial Period Card Component
 *
 * Displays financial metrics for a specific period (Initial Hold or Post-Refinance)
 * Used in Tab 2 (Financial Details) to show before/after refinance comparison
 *
 * Design: Apple-inspired card with period-specific color coding
 * - Initial Hold: Blue accent (#007AFF)
 * - Post-Refinance: Purple accent (#AF52DE)
 *
 * @author FSE from CLAUDE.md
 * @date December 27, 2025
 */

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { brrrColors, getPeriodCardStyles } from '../../../theme/brrrDesignTokens';
import { MetricRow } from '../../common/MetricRow';
import type { FinancialPeriodMetrics, FinancialPeriodCardProps } from './types';

// Re-export types for convenience
export type { FinancialPeriodMetrics, FinancialPeriodCardProps };

export const FinancialPeriodCard: React.FC<FinancialPeriodCardProps> = ({
  period,
  title,
  metrics
}) => {
  const periodColors = period === 'initial' ? brrrColors.initialPeriod : brrrColors.postRefinance;

  return (
    <Card sx={getPeriodCardStyles(period)}>
      <CardContent sx={{ p: 3 }}>
        {/* Period Title */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              color: periodColors.dark,
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {period === 'initial' ? 'Before Refinance' : 'After Cash-Out Refinance'}
          </Typography>
        </Box>

        {/* Financial Metrics */}
        <Box>
          <MetricRow
            label="Monthly Mortgage Payment"
            value={metrics.monthlyMortgage}
            format="currency"
            isExpense={true}
            sublabel={metrics.loanDetails?.previousPayment
              ? `Previous: $${metrics.loanDetails.previousPayment.toLocaleString()}`
              : undefined
            }
            deltaValue={metrics.loanDetails?.previousPayment
              ? metrics.monthlyMortgage - metrics.loanDetails.previousPayment
              : undefined
            }
          />

          <MetricRow
            label="Monthly Operating Expenses"
            value={metrics.monthlyExpenses}
            format="currency"
            isExpense={true}
          />

          {/* Expense Breakdown (if provided) */}
          {metrics.expenseBreakdown && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {metrics.expenseBreakdown.propertyTax !== undefined && (
                <MetricRow
                  label="Property Tax"
                  value={metrics.expenseBreakdown.propertyTax}
                  format="currency"
                  isExpense={true}
                  showBorder={false}
                  emphasis="normal"
                />
              )}
              {metrics.expenseBreakdown.insurance !== undefined && (
                <MetricRow
                  label="Insurance"
                  value={metrics.expenseBreakdown.insurance}
                  format="currency"
                  isExpense={true}
                  showBorder={false}
                  emphasis="normal"
                />
              )}
              {metrics.expenseBreakdown.maintenance !== undefined && (
                <MetricRow
                  label="Maintenance"
                  value={metrics.expenseBreakdown.maintenance}
                  format="currency"
                  isExpense={true}
                  showBorder={false}
                  emphasis="normal"
                />
              )}
            </Box>
          )}

          {/* Cash Flow Highlight */}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `2px solid ${periodColors.medium}`
            }}
          >
            <MetricRow
              label="Monthly Cash Flow"
              value={metrics.monthlyCashFlow}
              format="currency"
              isExpense={false}
              emphasis="strong"
            />

            {metrics.annualCashFlow !== undefined && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  color: 'text.secondary',
                  mt: 0.5
                }}
              >
                ${(metrics.annualCashFlow).toLocaleString()}/year
              </Typography>
            )}

            {metrics.cashOnCashReturn !== undefined && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  color: 'text.secondary',
                  mt: 0.25
                }}
              >
                Cash-on-Cash: {metrics.cashOnCashReturn.toFixed(1)}%
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FinancialPeriodCard;
