/**
 * Calculator Results Component
 *
 * Displays analysis results with progressive disclosure (accordions)
 * Follows Apple UX principles: clarity, deference, depth
 */

import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  Button,
  Link as MuiLink,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Analysis } from '../../types/analysis';
import type { CalculatorFormData } from './types';
import { getScoreColor } from '../../utils/scoreColors';
import { getScoreContext } from '../../utils/verdictUtils';
import { CalculationAssumptions } from './CalculationAssumptions';
import { LockedAssumptionsCard } from './LockedAssumptionsCard';
import { HiddenSectionTeaser } from './HiddenSectionTeaser';
import { analytics } from '../../utils/analytics';

interface CalculatorResultsProps {
  analysis: Analysis | null;
  loading: boolean;
  formData: CalculatorFormData;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${value.toFixed(2)}%`;
};

export const CalculatorResults: React.FC<CalculatorResultsProps> = ({ analysis, loading, formData }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Calculating...
        </Typography>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Enter property details to see analysis
        </Typography>
      </Box>
    );
  }

  const { monthlyAnalysis, annualAnalysis, keyMetrics, longTermAnalysis, strategy, strategySpecific } = analysis;

  // Strategy-aware metric extraction (BRRRR vs Buy & Hold)
  // BRRRR: Use post-refinance metrics from strategySpecific
  // Buy & Hold: Use traditional metrics from keyMetrics and monthlyAnalysis
  const cashFlow = strategy === 'brrrr'
    ? (strategySpecific?.postRefinanceMetrics?.monthlyCashFlow ?? 0)
    : (monthlyAnalysis?.cashFlow ?? 0);

  const cashOnCash = strategy === 'brrrr'
    ? (strategySpecific?.postRefinanceMetrics?.cashOnCashReturn ?? 0)
    : (keyMetrics?.cashOnCashReturn ?? 0);

  const capRate = keyMetrics?.capRate ?? 0;

  const totalInvestment = strategy === 'brrrr'
    ? (strategySpecific?.totalInvestment ?? 0)
    : (keyMetrics?.totalInvestment ?? 0);

  // IRR comes as decimal (0.13 = 13%), convert to percentage for display
  const irr = strategy === 'brrrr'
    ? (strategySpecific?.exitScenarios?.[0]?.irr ?? 0) * 100  // BRRRR uses exit scenarios
    : (longTermAnalysis?.returns?.irr ?? 0) * 100;            // Buy & Hold uses returns

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* Deal Quality Score - Professional Credibility Signal */}
      {analysis.investmentDecision?.professionalAssessment?.dealQuality && (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            border: `2px solid ${getScoreColor(analysis.investmentDecision.professionalAssessment.dealQuality)}`,
            borderRadius: '16px',
            bgcolor: 'background.paper'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              color: 'text.secondary',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: 0.5
            }}
          >
            Deal Quality Score
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '72px', sm: '96px' },
              fontWeight: 800,
              color: getScoreColor(analysis.investmentDecision.professionalAssessment.dealQuality),
              lineHeight: 1,
              my: 1
            }}
          >
            {Math.round(analysis.investmentDecision.professionalAssessment.dealQuality)}
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '40px', sm: '56px' },
                color: 'text.secondary',
                fontWeight: 700,
                ml: 0.5
              }}
            >
              /100
            </Typography>
          </Typography>
          <Box
            sx={{
              width: '120px',
              height: '4px',
              backgroundColor: getScoreColor(analysis.investmentDecision.professionalAssessment.dealQuality),
              borderRadius: '2px',
              margin: '0 auto',
              mb: 2
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            {getScoreContext(analysis.investmentDecision.professionalAssessment.dealQuality)}
          </Typography>
        </Paper>
      )}

      {/* Key Metrics Summary - Always Visible (Above Fold) */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Investment Summary
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {strategy === 'brrrr' ? (
            // BRRRR Strategy: 4 key metrics (responsive: 1 col mobile, 2 col tablet, 4 col desktop)
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Post-Refi Cash Flow
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cashFlow >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(cashFlow)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Capital Recovery
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatPercent(strategySpecific?.capitalRecovery?.capitalRecoveryRate ?? 0)}
                  </Typography>
                  {strategySpecific?.capitalRecovery?.infiniteReturn && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                      🚀 Infinite Return
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Post-Refi CoC Return
                  </Typography>
                  {strategySpecific?.postRefinanceMetrics?.cashOnCashReturn === null ||
                   ((strategySpecific?.capitalRecovery?.capitalRemaining ?? 1) <= 0) ? (
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ∞%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Infinite Return
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatPercent(cashOnCash)}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Investment
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalInvestment)}
                  </Typography>
                </Box>
              </Grid>
            </>
          ) : (
            // Buy & Hold Strategy: 3 traditional metrics
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Cash Flow
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: cashFlow >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(cashFlow)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cash-on-Cash Return
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatPercent(cashOnCash)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cap Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {formatPercent(capRate)}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Buy & Hold: Locked Assumptions + Early CTA */}
      {strategy === 'buy-hold' && (
        <>
          {/* Locked Long-Term Assumptions - Buy & Hold Only */}
          <LockedAssumptionsCard
            strategy="buy-hold"
            assumptions={{
              rentGrowth: formData.longTermAssumptions?.annualRentIncrease || 2,
              propertyAppreciation: formData.longTermAssumptions?.annualPropertyValueIncrease || 3,
              expenseGrowth: formData.longTermAssumptions?.annualExpenseIncrease || 2,
              sellingCosts: formData.longTermAssumptions?.sellingCostsPercentage || 6,
            }}
            placementContext="early"
          />

          {/* Early CTA for Buy & Hold */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 3,
              mb: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                color: 'text.primary',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              Track your deal pipeline • See portfolio impact • Test market assumptions
            </Typography>

            <Button
              variant="contained"
              size="large"
              href="/register"
              onClick={() => {
                analytics.trackCTAClick('beta_signup', 'buy_hold_early_cta');
              }}
              sx={{
                minWidth: '280px',
                height: '48px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#0071E3',
                '&:hover': {
                  bgcolor: '#0077ED',
                }
              }}
            >
              Unlock Full Analysis - Free Beta Access
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              No credit card • $0/month forever
            </Typography>
          </Paper>
        </>
      )}

      {/* Monthly Analysis Accordion */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Monthly Analysis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Income
              </Typography>
              <Box sx={{ pl: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Gross Rent:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(monthlyAnalysis?.income?.gross)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Effective Rent:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(monthlyAnalysis?.income?.effective)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Expenses
              </Typography>
              <Box sx={{ pl: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {strategy === 'brrrr' ? 'Operating (Post-Refi):' : 'Operating:'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(
                      strategy === 'brrrr'
                        ? strategySpecific?.postRefinanceMetrics?.monthlyOperatingExpenses
                        : (monthlyAnalysis?.expenses ?
                            monthlyAnalysis.expenses.propertyTax +
                            monthlyAnalysis.expenses.insurance +
                            monthlyAnalysis.expenses.maintenance +
                            monthlyAnalysis.expenses.propertyManagement +
                            (monthlyAnalysis.expenses.hoa || 0) +
                            (monthlyAnalysis.expenses.landlordUtilities || 0) +
                            (monthlyAnalysis.expenses.sfrCapEx || 0)
                          : 0)
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    {strategy === 'brrrr' ? 'Post-Refi Mortgage:' : 'Mortgage:'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(
                      strategy === 'brrrr'
                        ? strategySpecific?.postRefinanceMetrics?.newMonthlyPayment
                        : monthlyAnalysis?.expenses?.mortgage?.total
                    )}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {strategy === 'brrrr' ? 'Total Expenses (Post-Refi):' : 'Total Expenses:'}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(
                      strategy === 'brrrr'
                        ? (strategySpecific?.postRefinanceMetrics?.monthlyOperatingExpenses || 0) +
                          (strategySpecific?.postRefinanceMetrics?.newMonthlyPayment || 0)
                        : monthlyAnalysis?.expenses?.total
                    )}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* BRRRR Pre-Refinance Cash Flow Warning */}
          {strategy === 'brrrr' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography
                variant="caption"
                color={monthlyAnalysis?.cashFlow && monthlyAnalysis.cashFlow < 0 ? 'warning.main' : 'text.secondary'}
                sx={{
                  display: 'block',
                  fontStyle: 'italic',
                  fontWeight: monthlyAnalysis?.cashFlow && monthlyAnalysis.cashFlow < 0 ? 600 : 400
                }}
              >
                {monthlyAnalysis?.cashFlow && monthlyAnalysis.cashFlow < 0 ? '⚠️ ' : 'ℹ️ '}
                <strong>Note:</strong> Post-refinance metrics shown above (operating expenses based on{' '}
                {formatCurrency(strategySpecific?.refinanceResults?.afterRepairValue)} ARV, not purchase price).
                Pre-refinance cash flow during{' '}
                {strategySpecific?.seasoningCosts?.months || 12}-month seasoning period:{' '}
                <strong>{formatCurrency(monthlyAnalysis?.cashFlow)}/mo</strong>
                {monthlyAnalysis?.cashFlow && monthlyAnalysis.cashFlow < 0
                  ? ' (temporary holding cost - budget accordingly)'
                  : ' (temporary income before refinance)'}
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Key Metrics Accordion - Buy & Hold ONLY */}
      {strategy !== 'brrrr' && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Key Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="NOI" value={formatCurrency(annualAnalysis?.noi)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="DSCR" value={keyMetrics?.dscr?.toFixed(2) || '-'} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="Gross Yield" value={formatPercent(keyMetrics?.capRate)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="Total Investment" value={formatCurrency(keyMetrics?.totalInvestment)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="GRM" value={keyMetrics?.grossRentMultiplier?.toFixed(2) || '-'} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard label="1% Rule" value={formatPercent(keyMetrics?.onePercentRuleValue || 0)} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* BRRRR Key Metrics - BRRRR Strategy ONLY */}
      {strategy === 'brrrr' && strategySpecific && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">BRRRR Key Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="Total Capital Deployed"
                  value={formatCurrency(strategySpecific.capitalRecovery?.totalCapitalDeployed)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="Capital Recovered"
                  value={formatCurrency(strategySpecific.capitalRecovery?.capitalRecovered)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="Capital Remaining"
                  value={formatCurrency(strategySpecific.capitalRecovery?.capitalRemaining)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="Total Investment"
                  value={formatCurrency(strategySpecific.totalInvestment)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="After Repair Value"
                  value={formatCurrency(strategySpecific.refinanceResults?.afterRepairValue)}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <MetricCard
                  label="Rehab Budget"
                  value={formatCurrency(strategySpecific.rehabBudget)}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Strategy-Specific Analysis - BRRRR or Buy & Hold */}
      {analysis.strategy === 'brrrr' && analysis.strategySpecific ? (
        <>
        <Accordion sx={{ mt: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">BRRRR Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Capital Recovery */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                  Capital Recovery
                </Typography>
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Amount Recovered:</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatCurrency(analysis.strategySpecific.capitalRecovery?.capitalRecovered)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Recovery Rate:</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatPercent(analysis.strategySpecific.capitalRecovery?.capitalRecoveryRate ?? 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Capital Remaining:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(analysis.strategySpecific.capitalRecovery?.capitalRemaining)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Post-Refinance Cash Flow */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                  Post-Refinance Metrics
                </Typography>
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Monthly Cash Flow:</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={(analysis.strategySpecific.postRefinanceMetrics?.monthlyCashFlow ?? 0) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(analysis.strategySpecific.postRefinanceMetrics?.monthlyCashFlow)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Annual Cash Flow:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(analysis.strategySpecific.postRefinanceMetrics?.annualCashFlow)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Cash-on-Cash Return:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatPercent(analysis.strategySpecific.postRefinanceMetrics?.cashOnCashReturn)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* 70% Rule Check - Hidden Behind Signup */}
              <Grid size={{ xs: 12 }}>
                <HiddenSectionTeaser
                  title="70% Rule Validation: Hidden"
                  description="Professional BRRRR investors use the 70% rule to ensure they don't overpay on purchase price. Did your purchase pass this institutional test?"
                  severity="warning"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Break-Even Occupancy Analysis - Hidden Behind Signup */}
        <HiddenSectionTeaser
          title="Risk Analysis: Break-Even Occupancy - Hidden"
          description="Your post-refinance break-even occupancy determines if this cash flow is sustainable. With high break-even occupancy, vacancy could wipe out your cash flow."
          severity="error"
        />

        {/* Locked Assumptions for BRRRR */}
        <LockedAssumptionsCard
          strategy="brrrr"
          assumptions={{
            refinanceLTV: formData.refinanceLTV || 75,
            refinanceRate: formData.refinanceRate || formData.interestRate,
          }}
          placementContext="late"
        />

        {/* Late CTA for BRRRR - After Hidden Sections */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            mb: 3,
            bgcolor: 'primary.main',
            color: 'white',
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Unlock Full BRRRR Analysis
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            • Track your deal pipeline from lead to close<br/>
            • See how this deal impacts your portfolio goals<br/>
            • Test different refinance scenarios<br/>
            • Adjust assumptions for YOUR market
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/register"
            onClick={() => {
              analytics.trackCTAClick('beta_signup', 'brrrr_late_cta');
            }}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': { bgcolor: 'grey.100' },
              minWidth: '280px',
              height: '56px',
              fontSize: '1.1rem',
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Test Your Assumptions - Free Beta Access
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.9 }}>
            No credit card • $0/month forever
          </Typography>
        </Paper>
        </>
      ) : longTermAnalysis ? (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {longTermAnalysis.projectionYears}-Year Projections
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Exit Analysis
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Projected Sale Price:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(longTermAnalysis.exitAnalysis?.projectedSalePrice)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Mortgage Payoff:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(longTermAnalysis.exitAnalysis?.mortgagePayoff)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Selling Costs:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(longTermAnalysis.exitAnalysis?.sellingCosts)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600}>
                      Net Proceeds:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatCurrency(longTermAnalysis.exitAnalysis?.netProceedsFromSale)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Returns
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Total Cash Flow:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(longTermAnalysis.returns?.totalCashFlow)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Total Appreciation:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(longTermAnalysis.returns?.totalAppreciation)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600}>
                      IRR:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatPercent(irr)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ) : null}

      {/* Calculation Assumptions - Transparency */}
      {/* TODO: calculationAssumptions property not yet in Analysis type
      {analysis?.calculationAssumptions && (
        <CalculationAssumptions assumptions={analysis.calculationAssumptions} />
      )} */}
    </Box>
  );
};

// Helper component for metric cards
const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
      {value}
    </Typography>
  </Box>
);
