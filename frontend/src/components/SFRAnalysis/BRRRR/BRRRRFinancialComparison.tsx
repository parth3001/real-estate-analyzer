/**
 * BRRRR Financial Comparison Component (Tab 2: Financial Details)
 *
 * Displays dual-period financial analysis for BRRRR properties:
 * - Initial Hold Period (Month 1-12): Before refinance
 * - Post-Refinance Period (Month 13+): After cash-out refinance
 *
 * Business Context:
 * BRRRR investors need to understand the trade-off:
 * - Initial period: Often positive cash flow (smaller loan)
 * - Post-refi period: Often negative cash flow (larger loan from ARV refinance)
 * - Acceptable: -$200 to -$500/month is normal when recovering 80-100% of capital
 *
 * Design: Apple Design System with clear before/after comparison
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React from 'react';
import { Box, Typography, Card, CardContent, Alert, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import Grid from '@mui/system/Grid';
import { Info as InfoIcon, TrendingDown as TrendingDownIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { FinancialPeriodCard, type FinancialPeriodMetrics } from './FinancialPeriodCard';
import { PeriodSeparator } from './PeriodSeparator';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface BRRRRFinancialComparisonProps {
  analysis: any; // Full analysis object from backend
  propertyData: any; // Property data including BRRRR details
}

/**
 * Calculate monthly mortgage payment
 */
const calculateMonthlyPayment = (
  loanAmount: number,
  annualRate: number,
  termYears: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) return loanAmount / numPayments;

  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
};

export const BRRRRFinancialComparison: React.FC<BRRRRFinancialComparisonProps> = ({
  analysis,
  propertyData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Extract BRRRR-specific data
  // ✅ FSE FIX (Issue #43): Backend sends data in strategySpecific, not brrrAnalysis
  const brrrData = analysis?.strategySpecific || analysis?.brrrAnalysis;
  const purchasePrice = propertyData.purchasePrice || 0;
  const arv = propertyData.brrrr?.afterRepairValue || propertyData.afterRepairValue || 0;
  const downPaymentPct = propertyData.downPayment || 20;
  const purchaseRate = propertyData.interestRate || 7.5;
  const refinanceRate = propertyData.brrrr?.refinanceRate || purchaseRate;
  const loanTerm = propertyData.loanTerm || 30;
  const refinanceLTV = propertyData.brrrr?.refinanceLTV || 75;

  // ✅ ARCHITECTURE FIX (Issue #43): Use backend data (Single Source of Truth)
  // Backend handles ALL calculations - frontend ONLY displays

  // Get Initial Hold Period metrics from backend
  const initialLoan = brrrData?.loanAmount || (purchasePrice * (1 - downPaymentPct / 100));
  const initialPayment = brrrData?.seasoningCosts?.mortgagePayments
    ? (brrrData.seasoningCosts.mortgagePayments / (brrrData.seasoningCosts.months || 12))
    : calculateMonthlyPayment(initialLoan, purchaseRate, loanTerm); // Fallback only if backend missing

  // ✅ ISSUE #49 FIX (2025-12-30): Calculate Initial Hold operating expenses from backend seasoning data
  // ROOT CAUSE: Was using netRentalIncome / 12 (only deducts mgmt fees)
  // SOLUTION: Extract monthly opex from backend totals (backend provides 12-month totals)
  // REFERENCE: /docs/ISSUE_49_IMPLEMENTATION_PLAN.md
  const months = brrrData?.seasoningCosts?.months || 12;
  const initialHoldMonthlyOpEx = brrrData?.seasoningCosts ? {
    propertyTax: brrrData.seasoningCosts.propertyTax / months,
    insurance: brrrData.seasoningCosts.insurance / months,
    maintenance: brrrData.seasoningCosts.maintenance / months,
    propertyManagement: brrrData.seasoningCosts.propertyManagement / months,
    utilities: brrrData.seasoningCosts.utilities / months,
    hoa: 0, // TODO: Add to backend SeasoningCosts interface in future sprint
    total: (brrrData.seasoningCosts.propertyTax +
            brrrData.seasoningCosts.insurance +
            brrrData.seasoningCosts.maintenance +
            brrrData.seasoningCosts.propertyManagement +
            brrrData.seasoningCosts.utilities) / months
  } : null;

  // ✅ ISSUE #49 FIX: Calculate Initial Hold cash flow properly
  // Use gross rent - operating expenses - mortgage (NO vacancy - lender requirement)
  // BEFORE (WRONG): netRentalIncome / 12 - mortgage = $1,104 - $559 = $545/month
  // AFTER (CORRECT): rent - ALL opex - mortgage = $1,200 - $377 - $559 = $264/month
  const monthlyRent = analysis?.monthlyAnalysis?.income?.gross || 0;
  const monthlyExpenses = analysis?.monthlyAnalysis?.expenses?.operating || 0;
  const initialCashFlow = initialHoldMonthlyOpEx
    ? monthlyRent - initialHoldMonthlyOpEx.total - initialPayment
    : monthlyRent - monthlyExpenses - initialPayment; // Fallback if no seasoning data

  // Get Post-Refinance Period metrics from backend
  const refinanceLoan = brrrData?.refinanceResults?.newLoanAmount || (arv * (refinanceLTV / 100));
  const refinancePayment = brrrData?.postRefinanceMetrics?.newMonthlyPayment || 0;
  const postRefiCashFlow = brrrData?.postRefinanceMetrics?.monthlyCashFlow || 0; // ✅ ISSUE #45 FIX

  // Get expense breakdown from backend
  const expenseBreakdown = {
    propertyTax: analysis?.monthlyAnalysis?.expenses?.breakdown?.propertyTax || 0,
    insurance: analysis?.monthlyAnalysis?.expenses?.breakdown?.insurance || 0,
    maintenance: analysis?.monthlyAnalysis?.expenses?.breakdown?.maintenance || 0,
    propertyManagement: analysis?.monthlyAnalysis?.expenses?.breakdown?.propertyManagement || 0,
  };

  // Get capital recovery from backend (no frontend calculation)
  const capitalRecovered = brrrData?.capitalRecovery?.capitalRecovered || 0;
  const totalInvestment = brrrData?.totalInvestment || 0;
  const capitalRecoveryRate = brrrData?.capitalRecovery?.capitalRecoveryRate || 0;
  const remainingInvestment = brrrData?.capitalRecovery?.capitalRemaining || 0;
  const totalCapitalDeployed = brrrData?.capitalRecovery?.totalCapitalDeployed || totalInvestment;

  // ✅ ISSUE #48 FIX: Calculate seasoning profit/cost for breakdown display
  // If totalCapitalDeployed < totalInvestment, property generated profit during seasoning
  const seasoningProfit = totalInvestment - totalCapitalDeployed;
  const hasSeasoningProfit = seasoningProfit > 0;

  // Build metrics objects
  const initialMetrics: FinancialPeriodMetrics = {
    monthlyMortgage: initialPayment,
    monthlyExpenses: monthlyExpenses,
    monthlyCashFlow: initialCashFlow,
    annualCashFlow: initialCashFlow * 12,
    // ✅ ISSUE #49 FIX: Cash-on-Cash on TOTAL investment (not just down payment)
    // BEFORE (WRONG): CoC on down payment only ($20K) = artificially high
    // AFTER (CORRECT): CoC on total investment ($52K) = accurate capital efficiency
    cashOnCashReturn: totalInvestment > 0 ? (initialCashFlow * 12 / totalInvestment) * 100 : 0,
    expenseBreakdown,
    loanDetails: {
      loanAmount: initialLoan,
      interestRate: purchaseRate,
      loanTerm,
    },
  };

  const postRefiMetrics: FinancialPeriodMetrics = {
    monthlyMortgage: refinancePayment,
    monthlyExpenses: monthlyExpenses,
    monthlyCashFlow: postRefiCashFlow,
    annualCashFlow: postRefiCashFlow * 12,
    cashOnCashReturn: remainingInvestment > 0 && postRefiCashFlow > 0
      ? (postRefiCashFlow * 12 / remainingInvestment) * 100
      : undefined,
    expenseBreakdown,
    loanDetails: {
      loanAmount: refinanceLoan,
      interestRate: refinanceRate,
      loanTerm,
      previousPayment: initialPayment, // For delta display
    },
  };

  // Warning flags
  const highNegativeCashFlow = postRefiCashFlow < -1000;
  const unusualPaymentIncrease = refinancePayment > initialPayment * 1.5;
  const lowCapitalRecovery = capitalRecoveryRate < 50 && postRefiCashFlow < 0;

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        BRRRR Financial Comparison
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Compare cash flow before and after refinance to understand the capital recovery trade-off
      </Typography>

      {/* Educational Banner */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 4,
          borderRadius: '12px',
          backgroundColor: brrrColors.initialPeriod.light,
          '& .MuiAlert-icon': {
            color: brrrColors.initialPeriod.primary,
          },
        }}
      >
        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
          BRRRR Strategy: Two Distinct Financial Periods
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          <strong>Initial Hold:</strong> Smaller loan based on purchase price ({purchaseRate.toFixed(2)}%, ${initialLoan.toLocaleString()})
          <br />
          <strong>Post-Refinance:</strong> Larger loan based on ARV ({refinanceRate.toFixed(2)}%, ${refinanceLoan.toLocaleString()})
          <br />
          <strong>Capital Recovered:</strong> ${capitalRecovered.toLocaleString()} ({capitalRecoveryRate.toFixed(0)}% of total investment)
        </Typography>
      </Alert>

      {/* Dual-Period Comparison Cards */}
      <Grid container spacing={isMobile ? 3 : 4}>
        {/* Initial Hold Period Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FinancialPeriodCard
            period="initial"
            title="💰 Initial Hold Period"
            metrics={initialMetrics}
          />
        </Grid>

        {/* Post-Refinance Period Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FinancialPeriodCard
            period="postRefinance"
            title="🔄 Post-Refinance"
            metrics={postRefiMetrics}
          />
        </Grid>
      </Grid>

      {/* Period Separator (Mobile only - between stacked cards) */}
      {isMobile && (
        <PeriodSeparator label="REFINANCE EVENT" />
      )}

      {/* Capital Recovery Context Card */}
      <Card
        sx={{
          mt: 4,
          borderRadius: '16px',
          backgroundColor: brrrColors.capitalRecovery.light,
          border: `2px solid ${brrrColors.capitalRecovery.medium}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: brrrColors.capitalRecovery.dark }}>
            📊 BRRRR Trade-off Analysis
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Capital Recovered
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                ${capitalRecovered.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                {capitalRecoveryRate.toFixed(0)}% of ${totalInvestment.toLocaleString()} invested
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Net Capital at Risk
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 1 }}>
                        Capital Calculation Breakdown:
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        Total Investment: ${totalInvestment.toLocaleString()}
                        {hasSeasoningProfit && (
                          <>
                            <br />
                            Less: Seasoning Profit: -${seasoningProfit.toLocaleString()}
                            <br />
                            Capital Deployed: ${totalCapitalDeployed.toLocaleString()}
                          </>
                        )}
                        <br />
                        Less: Capital Recovered: -${capitalRecovered.toLocaleString()}
                        <br />
                        ───────────────────────
                        <br />
                        Net Capital at Risk: ${Math.max(0, remainingInvestment).toLocaleString()}
                      </Typography>
                      {hasSeasoningProfit && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                          Note: Property generated ${seasoningProfit.toLocaleString()} profit during the {brrrData?.seasoningCosts?.months || 12}-month seasoning period, reducing your capital at risk.
                        </Typography>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h6" fontWeight={700}>
                ${Math.max(0, remainingInvestment).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                {remainingInvestment <= 0 ? 'Infinite return achieved! 🎉' : 'Still at risk'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Monthly Holding Cost
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: postRefiCashFlow >= 0
                    ? brrrColors.capitalRecovery.dark
                    : Math.abs(postRefiCashFlow) <= 500
                    ? brrrColors.caution.dark
                    : brrrColors.negative.dark,
                }}
              >
                ${postRefiCashFlow.toLocaleString()}/mo
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                {postRefiCashFlow >= 0
                  ? 'Positive cash flow ✅'
                  : Math.abs(postRefiCashFlow) <= 500
                  ? 'Acceptable for BRRRR'
                  : 'Higher than typical BRRRR'}
              </Typography>
            </Grid>
          </Grid>

          {/* BRRRR Strategy Explanation */}
          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: `1px solid ${brrrColors.capitalRecovery.medium}`,
            }}
          >
            <Typography variant="body2" sx={{ color: brrrColors.capitalRecovery.dark, fontWeight: 500 }}>
              💡 BRRRR Investor Perspective:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, lineHeight: 1.6 }}>
              {postRefiCashFlow < 0
                ? `Negative cash flow of $${Math.abs(postRefiCashFlow).toLocaleString()}/month is the "cost" of recovering ${capitalRecoveryRate.toFixed(0)}% of your capital.
                   You own a $${arv.toLocaleString()} property with only $${Math.max(0, remainingInvestment).toLocaleString()} at risk.`
                : `Positive cash flow AND ${capitalRecoveryRate.toFixed(0)}% capital recovery - exceptional BRRRR execution!
                   You can redeploy $${capitalRecovered.toLocaleString()} into your next deal while this property cash flows.`}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Warning Alerts */}
      {(highNegativeCashFlow || unusualPaymentIncrease || lowCapitalRecovery) && (
        <Box sx={{ mt: 3 }}>
          {highNegativeCashFlow && (
            <Alert
              severity="warning"
              icon={<TrendingDownIcon />}
              sx={{ mb: 2, borderRadius: '12px' }}
            >
              <Typography variant="body2" fontWeight={500}>
                High Negative Cash Flow: ${Math.abs(postRefiCashFlow).toLocaleString()}/month
              </Typography>
              <Typography variant="caption">
                Post-refinance cash flow below -$1,000/month may not be sustainable long-term.
                Consider: Lower refinance LTV, higher rent, or reduce operating expenses.
              </Typography>
            </Alert>
          )}

          {unusualPaymentIncrease && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
              <Typography variant="body2" fontWeight={500}>
                Unusual Payment Increase: +{(((refinancePayment - initialPayment) / initialPayment) * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption">
                Refinance payment is {(refinancePayment / initialPayment).toFixed(1)}x higher than initial.
                Verify refinance LTV ({refinanceLTV}%) and ARV (${arv.toLocaleString()}) are accurate.
              </Typography>
            </Alert>
          )}

          {lowCapitalRecovery && (
            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
              <Typography variant="body2" fontWeight={500}>
                Low Capital Recovery with Negative Cash Flow
              </Typography>
              <Typography variant="caption">
                Only {capitalRecoveryRate.toFixed(0)}% capital recovery but negative cash flow.
                Consider if this deal justifies the negative monthly holding cost.
                Traditional Buy & Hold might be more suitable.
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BRRRRFinancialComparison;
