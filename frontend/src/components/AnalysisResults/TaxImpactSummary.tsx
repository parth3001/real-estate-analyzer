/**
 * TaxImpactSummary - Hero Tax Intelligence Component
 *
 * Apple-inspired design showing before/after tax comparison with clear savings visualization
 * Progressive disclosure with primary insight prominently displayed
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  AccountBalance as TaxIcon,
  TrendingUp as OptimizeIcon,
  Savings as SavingsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Timeline as HoldPeriodIcon
} from '@mui/icons-material';

// Type definitions for tax analysis data
interface TaxAnalysisResult {
  userTaxProfile: {
    state: string;
    filingStatus: string;
    capitalGainsHoldingStrategy: string;
  };
  optimalHoldPeriod: number;
  totalTaxSavingsAtOptimal: number;
  holdPeriodAnalysis: Array<{
    holdPeriod: number;
    afterTaxIRR: number;
    totalTaxLiability: number;
    taxSavingsVsPreviousYear: number;
  }>;
  taxOptimizationRecommendations: string[];
  stateArbitrageOpportunities: string[];
  exchange1031Eligibility?: {
    eligible: boolean;
    deferralAmount: number;
  };
  expertInsights: {
    holdPeriodReasoning: string;
    riskConsiderations: string[];
    opportunityCost: string;
  };
}

interface ProfessionalAssessment {
  dealQuality: number;
  taxOptimization?: {
    afterTaxIRR: number;
    afterTaxDealQuality: number;
    optimalHoldPeriod: number;
    taxEfficiencyScore: number;
    stateTaxAdvantage: boolean;
    holdPeriodTaxSavings: number;
    exchange1031Eligible: boolean;
    primaryTaxInsight: string;
    taxOptimizationRecommendations: string[];
  };
}

interface TaxImpactSummaryProps {
  taxAnalysis: TaxAnalysisResult;
  professionalAssessment: ProfessionalAssessment;
  pretaxIRR: number; // From existing analysis
  purchasePrice: number;
}

const TaxImpactSummary: React.FC<TaxImpactSummaryProps> = ({
  taxAnalysis,
  professionalAssessment,
  pretaxIRR,
  purchasePrice
}) => {
  const [expanded, setExpanded] = useState(false);

  // Extract key metrics
  const optimalAnalysis = taxAnalysis.holdPeriodAnalysis.find(
    h => h.holdPeriod === taxAnalysis.optimalHoldPeriod
  );
  const year1Analysis = taxAnalysis.holdPeriodAnalysis[0];

  if (!optimalAnalysis || !year1Analysis) {
    return null;
  }

  const taxOptimization = professionalAssessment.taxOptimization;
  const afterTaxIRR = optimalAnalysis.afterTaxIRR;
  const totalTaxSavings = taxAnalysis.totalTaxSavingsAtOptimal;
  const optimalHoldPeriod = taxAnalysis.optimalHoldPeriod;

  // DOLLAR-FOCUSED CALCULATIONS - What users actually care about

  // Total cash flows over the hold periods
  const year1TotalCashFlow = taxAnalysis.holdPeriodAnalysis
    .filter(h => h.holdPeriod <= 1)
    .reduce((sum, h) => sum + (h.netProceedsFromSale || 0), 0);

  const optimalTotalCashFlow = taxAnalysis.holdPeriodAnalysis
    .filter(h => h.holdPeriod <= optimalHoldPeriod)
    .reduce((sum, h) => sum + (h.netProceedsFromSale || 0), 0);

  // Calculate total profit (what users actually make)
  const year1TotalProfit = year1Analysis.netProceedsFromSale - purchasePrice;
  const optimalTotalProfit = optimalAnalysis.netProceedsFromSale - purchasePrice;

  // Monthly averages (relatable to income)
  const year1MonthlyAverage = year1TotalProfit / 12;
  const optimalMonthlyAverage = optimalTotalProfit / (optimalHoldPeriod * 12);

  // The key comparison - how much more money they make
  const profitDifference = optimalTotalProfit - year1TotalProfit;
  const extraTaxes = Math.abs(totalTaxSavings);
  const netBenefit = profitDifference - (totalTaxSavings < 0 ? extraTaxes : -extraTaxes);

  // Visual progress calculation
  const maxProfit = Math.max(year1TotalProfit, optimalTotalProfit);
  const year1ProgressPercent = Math.max((year1TotalProfit / maxProfit) * 100, 5); // Min 5% for visibility
  const optimalProgressPercent = (optimalTotalProfit / maxProfit) * 100;

  // Quality assessments
  const getReturnQuality = (profit: number, months: number) => {
    const monthlyReturn = profit / months;
    if (monthlyReturn < 200) return { label: 'Poor', color: 'error' };
    if (monthlyReturn < 800) return { label: 'Fair', color: 'warning' };
    if (monthlyReturn < 1500) return { label: 'Good', color: 'info' };
    return { label: 'Excellent', color: 'success' };
  };

  const year1Quality = getReturnQuality(year1TotalProfit, 12);
  const optimalQuality = getReturnQuality(optimalTotalProfit, optimalHoldPeriod * 12);

  // Legacy calculations for backward compatibility
  const irrImprovement = afterTaxIRR - (year1Analysis.afterTaxIRR || 0);
  const isNegativeTaxSavings = totalTaxSavings < -5000;
  const dealQualityImprovement = taxOptimization ?
    taxOptimization.afterTaxDealQuality - professionalAssessment.dealQuality : 0;
  const taxSavingsLabel = isNegativeTaxSavings ? 'Higher Taxes' : 'Tax Savings';
  const taxSavingsColor = isNegativeTaxSavings ? 'warning.main' : 'success.main';
  const taxSavingsDescription = isNegativeTaxSavings ?
    'Additional taxes due to appreciation' :
    'Taxes saved vs Year 1 exit';

  // Get state info for display
  const stateCode = taxAnalysis.userTaxProfile.state;
  const isNoTaxState = ['FL', 'TX', 'NV', 'WA', 'WY', 'SD', 'TN', 'NH', 'AK'].includes(stateCode);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card sx={{
      mb: 3,
      background: 'linear-gradient(135deg, #f8fffe 0%, #f0fdf9 100%)',
      border: '1px solid',
      borderColor: 'success.200',
      borderRadius: 3
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'success.50',
              border: '1px solid',
              borderColor: 'success.200'
            }}>
              <TaxIcon sx={{ color: 'success.main', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} color="success.dark">
                Tax Intelligence Summary
              </Typography>
              <Typography variant="caption" color="text.secondary">
                After-tax analysis with hold period optimization
              </Typography>
            </Box>
          </Box>

          {/* State Advantage Indicator */}
          {isNoTaxState && (
            <Chip
              icon={<SuccessIcon />}
              label={`${stateCode} - No State Tax`}
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Primary Impact Metrics */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 3,
          mb: 3
        }}>
          {/* DOLLAR-FOCUSED PROFIT COMPARISON - PRIMARY DECISION */}
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
              💰 How much will you actually make?
            </Typography>

            {/* Recommended Strategy - Hold Optimal Years */}
            <Box sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: `${optimalQuality.color}.50`,
              border: '2px solid',
              borderColor: `${optimalQuality.color}.300`,
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color={`${optimalQuality.color}.dark`}>
                  Hold {optimalHoldPeriod} Years ⭐ RECOMMENDED
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color={`${optimalQuality.color}.main`} sx={{ mb: 0.5 }}>
                📈 {formatCurrency(optimalTotalProfit)} profit
              </Typography>
              <Typography variant="body2" color={`${optimalQuality.color}.dark`} sx={{ mb: 1 }}>
                ({formatCurrency(optimalMonthlyAverage)}/month average)
              </Typography>

              {/* Progress Bar */}
              <Box sx={{
                height: 8,
                backgroundColor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${optimalProgressPercent}%`,
                  backgroundColor: `${optimalQuality.color}.main`,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
              <Typography variant="caption" color={`${optimalQuality.color}.dark`} sx={{ mt: 0.5 }}>
                {optimalQuality.label} Returns
              </Typography>
            </Box>

            {/* Alternative - Sell Year 1 */}
            <Box sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: `${year1Quality.color}.50`,
              border: '1px solid',
              borderColor: `${year1Quality.color}.200`,
              opacity: 0.8
            }}>
              <Typography variant="body2" color={`${year1Quality.color}.dark`} sx={{ mb: 0.5 }}>
                Sell Year 1:
              </Typography>
              <Typography variant="h6" fontWeight={600} color={`${year1Quality.color}.main`}>
                📉 {formatCurrency(year1TotalProfit)} profit
              </Typography>
              <Typography variant="caption" color={`${year1Quality.color}.dark`}>
                ({formatCurrency(year1MonthlyAverage)}/month) - {year1Quality.label}
              </Typography>

              {/* Progress Bar */}
              <Box sx={{
                height: 6,
                backgroundColor: 'grey.200',
                borderRadius: 1,
                mt: 0.5,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  height: '100%',
                  width: `${year1ProgressPercent}%`,
                  backgroundColor: `${year1Quality.color}.main`,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>

            {/* Key Insight */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="success.main">
                💡 That's {formatCurrency(profitDifference)} more money!
              </Typography>
            </Box>
          </Box>

          {/* TAX REALITY CHECK - SECONDARY CONTEXT */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              🧮 The Tax Reality Check
            </Typography>

            <Box sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'info.50',
              border: '1px solid',
              borderColor: 'info.200'
            }}>
              {isNegativeTaxSavings ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Extra taxes if you hold:
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="warning.main" sx={{ mb: 1 }}>
                    ${formatCurrency(extraTaxes)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Extra profit if you hold:
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="success.main" sx={{ mb: 1 }}>
                    {formatCurrency(profitDifference)}
                  </Typography>

                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Your net gain:
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      +{formatCurrency(netBenefit)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="success.dark" sx={{ mb: 1 }}>
                    Great news! You get:
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="success.main" sx={{ mb: 0.5 }}>
                    {formatCurrency(profitDifference)} more profit
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="success.main">
                    + {formatCurrency(Math.abs(totalTaxSavings))} tax savings
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography variant="body2" fontWeight={600} color="success.dark" sx={{ mt: 1 }}>
              {isNegativeTaxSavings ?
                `The extra profit is ${Math.round(profitDifference / extraTaxes)}x the extra taxes!` :
                'Better returns AND tax savings!'}
            </Typography>
          </Box>

          {/* FOR THE NUMBERS PEOPLE - COLLAPSIBLE TERTIARY */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setExpanded(!expanded)}
            >
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
                📊 For the Numbers People
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to see IRR, appreciation, and technical details
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                <HoldPeriodIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  {optimalHoldPeriod} year{optimalHoldPeriod > 1 ? 's' : ''} commitment
                </Typography>
              </Box>
            </Box>

            {/* Collapsible Technical Details */}
            {expanded && (
              <Box sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                backgroundColor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Technical Details
                </Typography>
                <Box sx={{ textAlign: 'left', fontSize: '0.875rem' }}>
                  <Typography variant="body2" color="text.secondary">
                    • Year 1 IRR: {formatPercentage(year1Analysis.afterTaxIRR || 0)} annually
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Year {optimalHoldPeriod} IRR: {formatPercentage(afterTaxIRR)} annually
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Initial investment: {formatCurrency(purchasePrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Property value growth: {formatCurrency(optimalAnalysis.salePrice - purchasePrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Strategy: {optimalHoldPeriod === 1 ? 'Quick exit opportunity' : 'Patient investor approach'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* SIMPLE BOTTOM LINE - NO JARGON */}
        <Alert
          severity="success"
          sx={{
            mb: 2,
            backgroundColor: 'success.50',
            border: '2px solid',
            borderColor: 'success.300',
            '& .MuiAlert-icon': { color: 'success.main' }
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            <strong>The Bottom Line:</strong> Hold {optimalHoldPeriod} years to make{' '}
            <span style={{ color: 'green', fontWeight: 700 }}>
              {formatCurrency(profitDifference)} more
            </span>
            {isNegativeTaxSavings &&
              ` (even after paying ${formatCurrency(extraTaxes)} extra in taxes)`
            }.
          </Typography>
        </Alert>

        {/* Key Opportunities */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {taxAnalysis.exchange1031Eligibility?.eligible && (
            <Chip
              icon={<OptimizeIcon />}
              label={`1031 Exchange: Defer ${formatCurrency(taxAnalysis.exchange1031Eligibility.deferralAmount)}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          {taxOptimization?.stateTaxAdvantage && (
            <Chip
              icon={<SuccessIcon />}
              label="State Tax Advantage"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          {totalTaxSavings > 25000 && (
            <Chip
              icon={<SavingsIcon />}
              label="High Impact Optimization"
              color="warning"
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {/* Expandable Details */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Tax strategy affects deal quality by {dealQualityImprovement > 0 ? '+' : ''}{dealQualityImprovement} points
          </Typography>

          <Tooltip title={expanded ? 'Hide Details' : 'Show Tax Strategy Details'}>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          {/* Tax Optimization Recommendations */}
          {taxOptimization?.taxOptimizationRecommendations && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Tax Optimization Strategies
              </Typography>
              {taxOptimization.taxOptimizationRecommendations.slice(0, 3).map((recommendation, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <Box sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    mt: 1,
                    flexShrink: 0
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {recommendation}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* State Arbitrage Opportunities */}
          {taxAnalysis.stateArbitrageOpportunities.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                State Tax Opportunities
              </Typography>
              {taxAnalysis.stateArbitrageOpportunities.slice(0, 2).map((opportunity, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <Box sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'warning.main',
                    mt: 1,
                    flexShrink: 0
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {opportunity}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Expert Risk Considerations */}
          {taxAnalysis.expertInsights.riskConsiderations.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Risk Considerations
              </Typography>
              {taxAnalysis.expertInsights.riskConsiderations.slice(0, 2).map((risk, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {risk}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default TaxImpactSummary;