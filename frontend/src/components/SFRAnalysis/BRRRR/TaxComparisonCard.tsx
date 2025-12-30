/**
 * Tax Comparison Card Component
 *
 * Side-by-side comparison of BRRRR vs Flipping tax implications
 *
 * Business Context:
 * - BRRRR: $90K cash-out refinance = $0 tax (loan proceeds not taxable)
 * - Flipping: $90K profit = ~$34K tax (37% short-term capital gains + depreciation recapture)
 * - Tax Advantage: $34K saved by using BRRRR strategy instead of selling
 *
 * Design: Apple-inspired comparison card with green (BRRRR) vs neutral (Flipping)
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface TaxComparisonCardProps {
  /** Cash received from BRRRR refinance */
  brrrCashOut: number;

  /** Estimated profit if property was flipped instead */
  flipProfit: number;

  /** Tax rate for flipping (default: 37% short-term + 25% recapture) */
  flipTaxRate?: number;

  /** Show detailed breakdown (default: false) */
  showBreakdown?: boolean;
}

export const TaxComparisonCard: React.FC<TaxComparisonCardProps> = ({
  brrrCashOut,
  flipProfit,
  flipTaxRate = 0.38, // 37% short-term gains + 25% depreciation recapture (weighted average)
  showBreakdown = false,
}) => {
  const brrrTax = 0; // Refinance proceeds are not taxable
  const flipTax = flipProfit * flipTaxRate;
  const taxSavings = flipTax - brrrTax;
  const taxSavingsPercent = flipProfit > 0 ? (taxSavings / flipProfit) * 100 : 0;

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `2px solid ${brrrColors.capitalRecovery.medium}`,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Grid container>
          {/* BRRRR Column (Green - Tax-Free) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 3,
                backgroundColor: brrrColors.taxFree.light,
                borderRight: { md: `2px solid ${brrrColors.capitalRecovery.medium}` },
                borderBottom: { xs: `2px solid ${brrrColors.capitalRecovery.medium}`, md: 'none' },
                minHeight: { xs: 'auto', md: '300px' },
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CheckIcon sx={{ color: brrrColors.capitalRecovery.primary, fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  BRRRR (Refinance)
                </Typography>
              </Box>

              {/* Cash Out */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Cash Recovered (Tax-Free)
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  ${brrrCashOut.toLocaleString()}
                </Typography>
              </Box>

              {/* Tax Owed */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Tax Owed
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  $0
                </Typography>
              </Box>

              {/* Net Proceeds */}
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: `2px solid ${brrrColors.capitalRecovery.medium}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Net Cash in Your Pocket
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  ${brrrCashOut.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: brrrColors.capitalRecovery.dark }}>
                  ✅ 100% tax-free (refinance proceeds are not taxable income)
                </Typography>
              </Box>

              {/* Still Own Property */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  🏡 You Still Own the Property
                </Typography>
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                  Future appreciation, cash flow, and depreciation benefits continue.
                  You can sell later with long-term capital gains treatment (20% vs 37%).
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Flipping Column (Neutral - Taxable) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 3,
                backgroundColor: brrrColors.neutral.light,
                minHeight: { xs: 'auto', md: '300px' },
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CancelIcon sx={{ color: brrrColors.caution.primary, fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.neutral.dark }}>
                  Flipping (Sell Now)
                </Typography>
              </Box>

              {/* Gross Profit */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Gross Profit from Sale
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  ${flipProfit.toLocaleString()}
                </Typography>
              </Box>

              {/* Tax Owed */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Tax Owed ({(flipTaxRate * 100).toFixed(0)}%)
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ color: brrrColors.negative.dark }}>
                  ${flipTax.toLocaleString()}
                </Typography>
              </Box>

              {/* Net Proceeds */}
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: `2px solid ${brrrColors.neutral.medium}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Net Cash in Your Pocket
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ${(flipProfit - flipTax).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: brrrColors.caution.dark }}>
                  ⚠️ Lost ${flipTax.toLocaleString()} to taxes ({(flipTaxRate * 100).toFixed(0)}% rate)
                </Typography>
              </Box>

              {/* Lost Future Benefits */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  📉 Property Sold (No Future Benefits)
                </Typography>
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                  No future appreciation, cash flow, or depreciation benefits.
                  Must find another deal to redeploy capital.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Tax Savings Summary */}
        <Box
          sx={{
            p: 3,
            backgroundColor: brrrColors.capitalRecovery.light,
            borderTop: `2px solid ${brrrColors.capitalRecovery.medium}`,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: brrrColors.capitalRecovery.dark }}>
              💰 BRRRR Tax Advantage: ${taxSavings.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              By refinancing instead of selling, you avoid ${flipTax.toLocaleString()} in taxes ({taxSavingsPercent.toFixed(0)}% of profit).
              PLUS you keep the property for future appreciation and cash flow.
            </Typography>
          </Box>

          {/* Detailed Breakdown (Optional) */}
          {showBreakdown && (
            <Box
              sx={{
                mt: 3,
                pt: 3,
                borderTop: `1px solid ${brrrColors.capitalRecovery.medium}`,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                Tax Calculation Breakdown (Flipping):
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Short-Term Capital Gains (37%):</Typography>
                <Typography variant="caption" fontWeight={600}>
                  ${(flipProfit * 0.37).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Depreciation Recapture (25%):</Typography>
                <Typography variant="caption" fontWeight={600}>
                  Estimated ~${(flipProfit * 0.01).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Net Investment Income Tax (3.8%):</Typography>
                <Typography variant="caption" fontWeight={600}>
                  ${(flipProfit * 0.038).toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  pt: 1,
                  borderTop: `1px solid ${brrrColors.capitalRecovery.medium}`,
                }}
              >
                <Typography variant="body2" fontWeight={600}>Total Tax:</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: brrrColors.negative.dark }}>
                  ${flipTax.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaxComparisonCard;
