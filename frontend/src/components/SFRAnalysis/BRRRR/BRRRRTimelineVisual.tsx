/**
 * BRRRR Timeline Visual Component
 *
 * Displays the 4-phase BRRRR timeline with key metrics at each phase:
 * 1. Purchase & Rehab (Months 0-6)
 * 2. Seasoning Period (Months 7-14)
 * 3. Refinance (Month 15)
 * 4. Post-Refinance Hold (Month 16+)
 *
 * Uses MUI Stepper component:
 * - Desktop (>=600px): Horizontal stepper
 * - Mobile (<600px): Vertical stepper
 *
 * @author FSE from CLAUDE.md
 * @date December 29, 2025
 */

import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as PurchaseIcon,
  Build as RehabIcon,
  HourglassEmpty as SeasoningIcon,
  AccountBalance as RefinanceIcon,
  TrendingUp as HoldIcon,
} from '@mui/icons-material';
import type { BRRRRAnalysis } from '../../../types/brrrr';
import { formatCurrency } from '../../../utils/formatters';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface BRRRRTimelineVisualProps {
  brrrData: BRRRRAnalysis;
  purchasePrice: number;
  afterRepairValue: number;
}

export const BRRRRTimelineVisual: React.FC<BRRRRTimelineVisualProps> = ({
  brrrData,
  purchasePrice,
  afterRepairValue,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Extract data from brrrData
  const rehabCosts = brrrData.inputs.brrrr.rehabBudget;
  const seasoningMonths = brrrData.inputs.brrrr.seasoningMonths || 9;
  const newLoanAmount = brrrData.refinanceResults.newLoanAmount;
  const capitalRecovered = brrrData.capitalRecovery.capitalRecovered;
  const postRefinanceCashFlow = brrrData.postRefinanceMetrics.monthlyCashFlow;

  // Define timeline steps
  const steps = [
    {
      label: 'Purchase & Rehab',
      timeframe: 'Months 0-6',
      icon: <RehabIcon />,
      color: brrrColors.initialPeriod.primary,
      metrics: [
        { label: 'Purchase Price', value: formatCurrency(Math.round(purchasePrice)) },
        { label: 'Rehab Budget', value: formatCurrency(Math.round(rehabCosts)) },
        { label: 'Target ARV', value: formatCurrency(Math.round(afterRepairValue)) },
      ],
      description: 'Acquire distressed property and complete renovations to increase value',
    },
    {
      label: 'Seasoning Period',
      timeframe: `Months 7-${6 + seasoningMonths}`,
      icon: <SeasoningIcon />,
      color: brrrColors.seasoning.primary,
      metrics: [
        { label: 'Duration', value: `${seasoningMonths} months` },
        { label: 'Property Value', value: formatCurrency(Math.round(afterRepairValue)) },
        { label: 'Monthly Cash Flow', value: formatCurrency(Math.round(brrrData.seasoningCosts.monthlyCashFlow)) },
      ],
      description: 'Stabilize property with rental income to meet lender requirements for refinance',
    },
    {
      label: 'Refinance',
      timeframe: `Month ${6 + seasoningMonths + 1}`,
      icon: <RefinanceIcon />,
      color: brrrColors.refinance.primary,
      metrics: [
        { label: 'New Loan Amount', value: formatCurrency(Math.round(newLoanAmount)) },
        { label: 'Capital Recovered', value: formatCurrency(Math.round(capitalRecovered)) },
        { label: 'Recovery %', value: `${brrrData.capitalRecovery.recoveryPercentage.toFixed(1)}%` },
      ],
      description: 'Cash-out refinance based on new appraised value to recover invested capital',
    },
    {
      label: 'Post-Refinance Hold',
      timeframe: 'Month 16+',
      icon: <HoldIcon />,
      color: brrrColors.postRefinance.primary,
      metrics: [
        { label: 'Monthly Cash Flow', value: formatCurrency(Math.round(postRefinanceCashFlow)) },
        { label: 'Property Value', value: formatCurrency(Math.round(afterRepairValue)) },
        { label: 'Capital Remaining', value: formatCurrency(Math.round(brrrData.capitalRecovery.capitalRemaining)) },
      ],
      description: 'Hold property long-term with recovered capital available for next investment',
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `2px solid ${brrrColors.postRefinance.medium}`,
        backgroundColor: 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          BRRRR Investment Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Four phases from acquisition through long-term hold
        </Typography>

        <Stepper
          activeStep={4} // All steps completed (showing full timeline)
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{
            '& .MuiStepLabel-root': {
              cursor: 'default',
            },
            '& .MuiStepConnector-line': {
              borderColor: brrrColors.postRefinance.medium,
            },
          }}
        >
          {steps.map((step, index) => (
            <Step key={step.label} completed>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.timeframe}
                </Typography>
              </StepLabel>

              {isMobile && (
                <StepContent>
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      {step.description}
                    </Typography>
                    {step.metrics.map((metric) => (
                      <Box
                        key={metric.label}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {metric.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {metric.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        {/* Desktop: Show metrics in cards below stepper */}
        {!isMobile && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
              mt: 4,
            }}
          >
            {steps.map((step) => (
              <Card
                key={step.label}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${step.color}`,
                  backgroundColor: `${step.color}10`,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                    {step.description}
                  </Typography>
                  {step.metrics.map((metric) => (
                    <Box key={metric.label} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {metric.value}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BRRRRTimelineVisual;
