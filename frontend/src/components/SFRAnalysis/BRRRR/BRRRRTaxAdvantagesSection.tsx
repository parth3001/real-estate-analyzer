/**
 * BRRRR Tax Advantages Section Component (Tab 5: Tax Intelligence)
 *
 * Educational accordion explaining BRRRR tax benefits:
 * - Cash-out refinance is TAX-FREE (loan proceeds not taxable income)
 * - Depreciation continues after refinance (no basis change)
 * - BRRRR vs Flipping tax comparison (tax-free scaling vs ordinary income)
 *
 * Business Context:
 * This is the "secret weapon" of BRRRR that many investors don't understand.
 * $90K cash-out = $0 tax vs $90K flip profit = $34K tax (38% rate)
 *
 * Design: Apple-inspired accordion with educational content, comparison cards
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { TaxComparisonCard } from './TaxComparisonCard';
import { brrrColors, brrrComponentStyles } from '../../../theme/brrrDesignTokens';

export interface BRRRRTaxAdvantagesSectionProps {
  /** Full analysis object from backend */
  analysis: any;

  /** Property data including BRRRR details */
  propertyData: any;
}

export const BRRRRTaxAdvantagesSection: React.FC<BRRRRTaxAdvantagesSectionProps> = ({
  analysis,
  propertyData,
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  // Extract data
  const purchasePrice = propertyData.purchasePrice || 0;
  const arv = propertyData.brrrr?.afterRepairValue || propertyData.afterRepairValue || 0;
  const rehabCosts = propertyData.renovationCosts || propertyData.brrrr?.rehabBudget || 0;
  const refinanceLTV = propertyData.brrrr?.refinanceLTV || 75;
  const downPaymentPct = propertyData.downPayment || 20;

  // Calculate refinance numbers
  const initialLoan = purchasePrice * (1 - downPaymentPct / 100);
  const refinanceLoan = arv * (refinanceLTV / 100);
  const cashOut = refinanceLoan - initialLoan;
  const totalInvestment = (purchasePrice * downPaymentPct / 100) + rehabCosts;

  // Calculate flipping comparison
  const flipGrossProfit = arv - (purchasePrice + rehabCosts);

  // Depreciation calculation
  const landValue = purchasePrice * 0.20; // 20% land (non-depreciable)
  const depreciableBasis = purchasePrice - landValue;
  const annualDepreciation = depreciableBasis / 27.5; // Residential real estate

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        BRRRR Tax Advantages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Understanding the tax-free nature of cash-out refinancing
      </Typography>

      {/* Professional Disclaimer */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 3,
          borderRadius: '12px',
          backgroundColor: brrrColors.initialPeriod.light,
        }}
      >
        <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
          Educational Information - Not Tax Advice
        </Typography>
        <Typography variant="caption">
          This analysis explains general BRRRR tax treatment based on current IRS rules.
          Always consult a qualified CPA or tax professional for your specific situation.
          Tax laws vary by state and individual circumstances.
        </Typography>
      </Alert>

      {/* Accordion 1: Cash-Out Refinance = Tax-Free */}
      <Accordion
        expanded={expanded === 'panel1'}
        onChange={handleChange('panel1')}
        sx={brrrComponentStyles.educationalAccordion}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={brrrComponentStyles.educationalAccordionHeader}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '6px',
                backgroundColor: brrrColors.taxFree.primary,
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                $0
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={600}>
              Cash-Out Refinance: TAX-FREE MONEY
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={brrrComponentStyles.educationalAccordionContent}>
          <Box>
            {/* Refinance Details */}
            <Box
              sx={{
                p: 2,
                backgroundColor: brrrColors.taxFree.light,
                borderRadius: '8px',
                mb: 3,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                Your Refinance Numbers:
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  After Repair Value (ARV):
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${arv.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Refinance Loan ({refinanceLTV}% LTV):
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${refinanceLoan.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Payoff Old Loan:
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: brrrColors.negative.dark }}>
                  -${initialLoan.toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight={700}>
                  Cash Out to You:
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  ${cashOut.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Tax Owed Badge */}
            <Box
              sx={{
                ...brrrComponentStyles.taxFreeBadge,
                justifyContent: 'center',
                mb: 3,
              }}
            >
              Tax Owed on ${cashOut.toLocaleString()}: $0 🎉
            </Box>

            {/* Why Tax-Free Explanation */}
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                Why Is This Tax-Free?
              </Typography>

              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                  <strong>1. Loan Proceeds Are Not Income</strong><br />
                  <Typography variant="caption" component="span">
                    The IRS treats refinance cash-out as borrowed money (debt), not earnings.
                    You must pay it back with interest, so it's not taxable income.
                  </Typography>
                </Typography>

                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                  <strong>2. Property Not Sold</strong><br />
                  <Typography variant="caption" component="span">
                    Capital gains tax only applies when you sell. Refinancing doesn't trigger a sale,
                    so no capital gains event occurs.
                  </Typography>
                </Typography>

                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                  <strong>3. No Depreciation Recapture</strong><br />
                  <Typography variant="caption" component="span">
                    Depreciation recapture (25% tax) only applies when you sell. Since you still
                    own the property, you continue getting depreciation deductions with no recapture.
                  </Typography>
                </Typography>

                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  <strong>4. Tax-Free to Reinvest</strong><br />
                  <Typography variant="caption" component="span">
                    You can use the ${cashOut.toLocaleString()} for your next BRRRR deal, pay off other debts,
                    or use it however you want - all tax-free.
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 2: BRRRR vs Flipping Tax Comparison */}
      <Accordion
        expanded={expanded === 'panel2'}
        onChange={handleChange('panel2')}
        sx={{ ...brrrComponentStyles.educationalAccordion, mt: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={brrrComponentStyles.educationalAccordionHeader}
        >
          <Typography variant="body1" fontWeight={600}>
            BRRRR vs Flipping: Tax Comparison
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={brrrComponentStyles.educationalAccordionContent}>
          <Box>
            <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.7 }}>
              If you had <strong>sold (flipped)</strong> this property instead of refinancing,
              you would pay significant taxes. Here's the side-by-side comparison:
            </Typography>

            <TaxComparisonCard
              brrrCashOut={cashOut}
              flipProfit={flipGrossProfit}
              showBreakdown={true}
            />

            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: brrrColors.capitalRecovery.light,
                borderRadius: '8px',
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: brrrColors.capitalRecovery.dark }}>
                💡 Key Business Insight:
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
                Flippers pay ordinary income tax (37-38%) on every deal, losing ~40% to taxes.
                BRRRR investors extract capital tax-free and reinvest 100% into the next property.
                Over 5 deals, this compounds to 2-3x more wealth due to tax efficiency.
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Accordion 3: Depreciation Continues */}
      <Accordion
        expanded={expanded === 'panel3'}
        onChange={handleChange('panel3')}
        sx={{ ...brrrComponentStyles.educationalAccordion, mt: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={brrrComponentStyles.educationalAccordionHeader}
        >
          <Typography variant="body1" fontWeight={600}>
            Depreciation After Refinance
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={brrrComponentStyles.educationalAccordionContent}>
          <Box>
            <Alert
              severity="success"
              icon={<InfoIcon />}
              sx={{ mb: 3, borderRadius: '8px' }}
            >
              <Typography variant="body2" fontWeight={500}>
                Critical Tax Rule: Refinancing does NOT change your depreciation basis
              </Typography>
            </Alert>

            {/* Depreciation Calculation */}
            <Box
              sx={{
                p: 2,
                backgroundColor: brrrColors.neutral.light,
                borderRadius: '8px',
                mb: 3,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                Your Depreciation Schedule:
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Purchase Price:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${purchasePrice.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Land Value (20% non-depreciable):
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  -${landValue.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  Depreciable Basis:
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ${depreciableBasis.toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight={600}>
                  Annual Depreciation:
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
                  ${annualDepreciation.toLocaleString()} / year
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                (${depreciableBasis.toLocaleString()} ÷ 27.5 years)
              </Typography>
            </Box>

            {/* After Refinance */}
            <Box
              sx={{
                p: 2,
                backgroundColor: brrrColors.taxFree.light,
                borderRadius: '8px',
                mb: 2,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                After Refinance:
              </Typography>

              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>New ARV:</strong> ${arv.toLocaleString()} ← Does NOT affect depreciation
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>New Loan:</strong> ${refinanceLoan.toLocaleString()} ← Does NOT affect depreciation
                </Typography>
                <Typography variant="body2">
                  <strong>Annual Depreciation:</strong> ${annualDepreciation.toLocaleString()}/year ← SAME as before!
                </Typography>
              </Box>
            </Box>

            {/* Why This Matters */}
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                Why This Matters for Your Taxes:
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, lineHeight: 1.6 }}>
                • <strong>Tax Shelter:</strong> Depreciation shields ${annualDepreciation.toLocaleString()}/year of rental income from taxes
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, lineHeight: 1.6 }}>
                • <strong>Continues Indefinitely:</strong> You keep getting this deduction every year you hold the property
              </Typography>

              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
                • <strong>Original Basis:</strong> Even though property is now worth ${arv.toLocaleString()}, you depreciate
                on the original ${depreciableBasis.toLocaleString()} basis (IRS rules)
              </Typography>
            </Box>

            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mt: 3, borderRadius: '8px' }}
            >
              <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                <strong>IMPORTANT:</strong> Depreciation is "recaptured" (taxed at 25%) when you SELL the property.
                But as long as you HOLD, you get the annual deduction without owing taxes. This is why BRRRR investors
                rarely sell - they refinance instead to avoid recapture.
              </Typography>
            </Alert>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default BRRRRTaxAdvantagesSection;
