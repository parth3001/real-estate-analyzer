/**
 * Forced Appreciation Callout Component
 *
 * Explains the critical BRRRR concept: Forced appreciation via rehab creates instant equity
 * This is why long-term projections start from ARV, not purchase price
 *
 * Business Context:
 * - Purchase Price: $200K
 * - Rehab Costs: $50K
 * - After Repair Value (ARV): $320K
 * - Forced Appreciation: $70K instant equity (not gradual market appreciation)
 * - Future appreciation compounds from $320K, not $200K
 *
 * Design: Purple callout box highlighting transformation/elevation
 *
 * @author FSE from CLAUDE.md
 * @date December 28, 2025
 */

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { brrrColors, brrrComponentStyles } from '../../../theme/brrrDesignTokens';

export interface ForcedAppreciationCalloutProps {
  /** Purchase price */
  purchasePrice: number;

  /** After Repair Value (ARV) */
  arv: number;

  /** Rehab/renovation costs */
  rehabCosts: number;

  /** Annual appreciation rate (for market appreciation context) */
  appreciationRate?: number;
}

export const ForcedAppreciationCallout: React.FC<ForcedAppreciationCalloutProps> = ({
  purchasePrice,
  arv,
  rehabCosts,
  appreciationRate = 3.0,
}) => {
  const forcedAppreciation = arv - purchasePrice;
  const forcedAppreciationPercent = (forcedAppreciation / purchasePrice) * 100;
  const totalInvestment = purchasePrice + rehabCosts;
  const instantEquity = arv - totalInvestment;
  const instantEquityPercent = (instantEquity / arv) * 100;

  // How many years would market appreciation take to achieve same gain?
  const yearsEquivalent = forcedAppreciation > 0 && appreciationRate > 0
    ? Math.log(arv / purchasePrice) / Math.log(1 + appreciationRate / 100)
    : 0;

  return (
    <Card
      sx={{
        ...brrrComponentStyles.forcedAppreciationCallout,
        mb: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: brrrColors.postRefinance.primary,
            }}
          >
            <BuildIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ color: brrrColors.postRefinance.dark }}>
              Forced Appreciation: ${forcedAppreciation.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Instant equity created via rehab (not gradual market appreciation)
            </Typography>
          </Box>
        </Box>

        {/* Calculation Breakdown */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '8px',
            p: 2,
            mb: 2,
          }}
        >
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
              + Rehab Costs:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              ${rehabCosts.toLocaleString()}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 1,
              borderTop: `2px solid ${brrrColors.postRefinance.medium}`,
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ color: brrrColors.postRefinance.dark }}>
              After Repair Value (ARV):
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: brrrColors.postRefinance.dark }}>
              ${arv.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Key Insight */}
        <Box
          sx={{
            backgroundColor: brrrColors.capitalRecovery.light,
            borderRadius: '8px',
            p: 2,
            border: `1px solid ${brrrColors.capitalRecovery.medium}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 20, color: brrrColors.capitalRecovery.dark, mt: 0.25 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: brrrColors.capitalRecovery.dark, mb: 0.5 }}>
                Instant Equity: ${instantEquity.toLocaleString()} ({instantEquityPercent.toFixed(0)}% of ARV)
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.5 }}>
                <strong>Key BRRRR Advantage:</strong> You created ${forcedAppreciation.toLocaleString()} in value
                {yearsEquivalent > 0 && (
                  <> in {(rehabCosts / 50000 * 6).toFixed(0)} months - equivalent to {yearsEquivalent.toFixed(1)} years
                  of market appreciation ({appreciationRate.toFixed(1)}% annually)</>
                )}.
                Long-term projections start from ${arv.toLocaleString()} ARV, not ${purchasePrice.toLocaleString()} purchase price.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Warning if forced appreciation is low */}
        {forcedAppreciationPercent < 15 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: brrrColors.caution.light,
              borderRadius: '8px',
              border: `1px solid ${brrrColors.caution.medium}`,
            }}
          >
            <Typography variant="caption" sx={{ color: brrrColors.caution.dark, fontWeight: 500 }}>
              ⚠️ Low forced appreciation ({forcedAppreciationPercent.toFixed(0)}%): BRRRR strategy works best with 20-40%
              forced appreciation. Consider if traditional Buy & Hold is more suitable.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ForcedAppreciationCallout;
