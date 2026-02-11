/**
 * BRRRR Capital Recovery Analysis Tab
 *
 * Displays comprehensive BRRRR strategy analysis including:
 * - Infinite Return celebration alert (100%+ recovery)
 * - Capital recovery hero metrics (deployed, recovered, remaining)
 * - Capital recovery rate progress bar (0-150% scale)
 * - 70% Rule validation check
 * - Mortgage payment impact comparison
 * - Post-refinance metrics
 *
 * BRRRR: Buy, Rehab, Rent, Refinance, Repeat
 * Primary metric: Capital Recovery Rate (% of invested capital recovered via refinance)
 *
 * @author FSE from CLAUDE.md
 * @date December 22, 2025
 */

import React from 'react';
import { Box, Card, CardContent, Typography, Alert, LinearProgress } from '@mui/material';
import Grid from '@mui/system/Grid';
import { appleColors } from '../../../theme/appleDesignSystem';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { InfiniteReturnAlert } from './InfiniteReturnAlert';

interface BRRRRAnalysisTabProps {
  analysis: any;
  propertyData: any;
}

export const BRRRRAnalysisTab: React.FC<BRRRRAnalysisTabProps> = ({
  analysis,
  propertyData
}) => {
  // DEBUG: Log analysis structure
  console.log('🔍 BRRRRAnalysisTab - Analysis object:', analysis);
  console.log('🔍 BRRRRAnalysisTab - Property strategy:', propertyData.strategy);
  console.log('🔍 BRRRRAnalysisTab - strategySpecific exists:', !!analysis.strategySpecific);

  // Validate BRRRR data exists
  const brrrData = analysis.strategySpecific;
  if (!brrrData) {
    console.error('❌ BRRRRAnalysisTab - strategySpecific is missing!');
    console.error('❌ Analysis keys:', Object.keys(analysis));
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6" gutterBottom>
          BRRRR analysis data not available
        </Typography>
        <Typography variant="body2">
          Please re-run the analysis with BRRRR strategy selected. If the problem persists, contact support.
        </Typography>
        <Typography variant="caption" sx={{ mt: 2, display: 'block', fontFamily: 'monospace' }}>
          Debug: strategySpecific = {JSON.stringify(brrrData)}
        </Typography>
      </Alert>
    );
  }

  console.log('✅ BRRRRAnalysisTab - BRRRR data found:', brrrData);

  const capitalRecovery = brrrData.capitalRecovery;
  const postRefinance = brrrData.postRefinanceMetrics;
  const refinanceResults = brrrData.refinanceResults;
  const rule70Check = brrrData.rule70Check;

  const isInfiniteReturn = capitalRecovery.capitalRecoveryRate >= 100;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Infinite Return Alert (conditional - only shows for 100%+) */}
      <InfiniteReturnAlert
        capitalRecoveryRate={capitalRecovery.capitalRecoveryRate}
        capitalRemaining={capitalRecovery.capitalRemaining}
      />

      {/* Hero Metrics - 3 Column Grid */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Total Capital Deployed
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1.5rem', md: '2.125rem' },
                  color: appleColors.gray[900]
                }}
              >
                {formatCurrency(capitalRecovery.totalCapitalDeployed)}
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                Down Payment + Closing + Rehab + Seasoning
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            elevation={2}
            sx={{
              height: '100%',
              backgroundColor: isInfiniteReturn ? appleColors.green[50] : 'white'
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Capital Recovered
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1.5rem', md: '2.125rem' },
                  color: isInfiniteReturn ? appleColors.green[700] : appleColors.primary[700]
                }}
              >
                {formatCurrency(capitalRecovery.capitalRecovered)}
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                From refinance cash-out
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Capital Remaining in Deal
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1.5rem', md: '2.125rem' },
                  color: appleColors.gray[900]
                }}
              >
                {formatCurrency(capitalRecovery.capitalRemaining)}
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                Still invested in property
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Capital Recovery Rate Progress Bar */}
      <Card elevation={1} sx={{ p: 3, mb: 3, backgroundColor: appleColors.gray[50] }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Capital Recovery Rate
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{
              color: capitalRecovery.capitalRecoveryRate >= 100
                ? appleColors.green[700]
                : capitalRecovery.capitalRecoveryRate >= 70
                  ? appleColors.primary[700]
                  : appleColors.orange[700]
            }}
          >
            {formatPercent(capitalRecovery.capitalRecoveryRate)}
          </Typography>
          <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
            of invested capital recovered
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(capitalRecovery.capitalRecoveryRate, 150)}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: appleColors.gray[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: capitalRecovery.capitalRecoveryRate >= 100
                ? appleColors.green[500]
                : appleColors.primary[500],
              borderRadius: 6
            }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
            0%
          </Typography>
          <Typography variant="caption" sx={{ color: appleColors.green[700], fontWeight: 600 }}>
            ↑ 100% = Infinite Return
          </Typography>
          <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
            150%
          </Typography>
        </Box>
      </Card>

      {/* 70% Rule Check */}
      <Card elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          70% Rule Check
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              color: rule70Check.meets70Rule
                ? appleColors.green[700]
                : appleColors.red[700]
            }}
          >
            {rule70Check.meets70Rule ? '✅ PASS' : '❌ FAIL'}
          </Typography>
        </Box>

        {rule70Check.meets70Rule ? (
          <>
            <Typography variant="body2" sx={{ color: appleColors.gray[700], mb: 1 }}>
              Margin of Safety: {formatCurrency(rule70Check.margin)}
            </Typography>
            <Typography variant="caption" sx={{ color: appleColors.green[700] }}>
              You're {formatCurrency(Math.abs(rule70Check.margin))} under the 70% rule limit
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: appleColors.red[700], mb: 1, fontWeight: 600 }}>
              ⚠️ Exceeded 70% Rule by {formatCurrency(Math.abs(rule70Check.margin))}
            </Typography>
            <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
              Max purchase price: {formatCurrency(rule70Check.maxAllowablePurchase)}
            </Typography>
          </>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>70% Rule:</strong> Purchase price + rehab should not exceed 70% of ARV.
            This ensures you can refinance at 75% LTV and recover most of your capital.
          </Typography>
        </Alert>
      </Card>

      {/* Mortgage Payment Impact - CORRECTED per Architect */}
      <Card elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Mortgage Payment Impact
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: appleColors.gray[100], borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Original Mortgage Payment
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(brrrData.seasoningCosts.mortgagePayments / brrrData.seasoningCosts.months)}/month
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                {propertyData.downPayment || 20}% down, {propertyData.interestRate}% rate
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: appleColors.primary[50], borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                New Mortgage Payment
              </Typography>
              <Typography variant="h5" fontWeight={600} sx={{ color: appleColors.primary[700] }}>
                {formatCurrency(postRefinance.newMonthlyPayment)}/month
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                Increase: {formatCurrency(
                  postRefinance.newMonthlyPayment - (brrrData.seasoningCosts.mortgagePayments / brrrData.seasoningCosts.months)
                )}/month
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>BRRRR Trade-off:</strong> Your mortgage payment increases by{' '}
            {formatCurrency(
              postRefinance.newMonthlyPayment - (brrrData.seasoningCosts.mortgagePayments / brrrData.seasoningCosts.months)
            )}/month,
            but you recover {formatCurrency(capitalRecovery.capitalRecovered)} to invest in your next property.
          </Typography>
        </Alert>
      </Card>

      {/* Post-Refinance Metrics */}
      <Card elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Post-Refinance Performance
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Monthly Cash Flow
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrency(postRefinance.monthlyCashFlow)}/month
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Cash-on-Cash Return
              </Typography>
              {postRefinance.cashOnCashReturn === null || capitalRecovery.capitalRemaining <= 0 ? (
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ color: appleColors.green[700] }}>
                    ∞%
                  </Typography>
                  <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
                    Infinite Return
                  </Typography>
                </Box>
              ) : (
                <Typography variant="h5" fontWeight={600}>
                  {formatPercent(postRefinance.cashOnCashReturn)}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Post-Refi DSCR
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {postRefinance.postRefiDSCR.toFixed(2)}x
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            These metrics reflect the property's performance after refinancing with the new larger mortgage.
            Your remaining capital ({formatCurrency(capitalRecovery.capitalRemaining)}) continues to work for you.
          </Typography>
        </Alert>
      </Card>

      {/* Break-Even Occupancy Comparison (Issue #80) */}
      <Card elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Break-Even Occupancy Analysis
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
          {/* Initial Hold BEO */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                border: `1px solid ${appleColors.green[300]}`,
                backgroundColor: appleColors.green[50]
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    📊 Initial Hold (Months 1-12)
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={600} sx={{ color: appleColors.green[700] }}>
                  {formatPercent(analysis.keyMetrics?.breakEvenOccupancy ?? 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                  Low Risk ✅ - During seasoning period
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Post-Refinance BEO */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                border: postRefinance.postRefiBreakEvenOccupancy > 85
                  ? `2px solid ${appleColors.red[500]}`
                  : postRefinance.postRefiBreakEvenOccupancy > 75
                    ? `2px solid ${appleColors.orange[500]}`
                    : `1px solid ${appleColors.green[300]}`,
                backgroundColor: postRefinance.postRefiBreakEvenOccupancy > 85
                  ? appleColors.red[50]
                  : postRefinance.postRefiBreakEvenOccupancy > 75
                    ? appleColors.orange[50]
                    : appleColors.green[50]
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                    🏠 Post-Refinance (Years 1-30)
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  sx={{
                    color: postRefinance.postRefiBreakEvenOccupancy > 85
                      ? appleColors.red[700]
                      : postRefinance.postRefiBreakEvenOccupancy > 75
                        ? appleColors.orange[700]
                        : appleColors.green[700]
                  }}
                >
                  {formatPercent(postRefinance.postRefiBreakEvenOccupancy)}
                </Typography>
                <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                  {postRefinance.postRefiBreakEvenOccupancy > 85
                    ? 'High Risk ⚠️ - Tight operating margin'
                    : postRefinance.postRefiBreakEvenOccupancy > 75
                      ? 'Moderate Risk ⚠️ - Monitor vacancy closely'
                      : 'Low Risk ✅ - Healthy operating margin'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Educational Insight */}
        <Alert
          severity={postRefinance.postRefiBreakEvenOccupancy > 80 ? "warning" : "info"}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            <strong>BRRRR Break-Even Trade-off:</strong> After refinancing, your break-even occupancy increases from{' '}
            <strong>{(analysis.keyMetrics?.breakEvenOccupancy ?? 0).toFixed(1)}%</strong> to{' '}
            <strong>{postRefinance.postRefiBreakEvenOccupancy.toFixed(1)}%</strong>{' '}
            due to the higher mortgage payment. This is the long-term reality you'll operate under for the next{' '}
            {propertyData.loanTerm || 30} years.
            {postRefinance.postRefiBreakEvenOccupancy > 80 && (
              <span style={{ color: appleColors.orange[800] }}>
                {' '}⚠️ Monitor tenant retention carefully to maintain positive cash flow.
              </span>
            )}
          </Typography>
        </Alert>
      </Card>
    </Box>
  );
};
