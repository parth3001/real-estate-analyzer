/**
 * Exit Scenario Card Component
 *
 * Displays a single BRRRR exit scenario with key metrics:
 * - Total Wealth Created (headline metric)
 * - IRR (Internal Rate of Return)
 * - Net Proceeds from Sale
 * - Expandable breakdown (capital recovered, cash flow, appreciation, principal paid)
 *
 * Controlled component:
 * - Parent manages selection state
 * - Props: isSelected, onToggleSelection
 *
 * Design:
 * - Year 10 is the "recommended" scenario (highlighted)
 * - Expandable inline details (not modal)
 * - Click card to select/deselect for comparison
 *
 * @author FSE from CLAUDE.md
 * @date December 29, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  CheckCircle as SelectedIcon,
  RadioButtonUnchecked as UnselectedIcon,
} from '@mui/icons-material';
import type { ExitScenario } from '../../../types/brrrr';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface ExitScenarioCardProps {
  scenario: ExitScenario;
  isSelected: boolean;
  onToggleSelection: () => void;
  isRecommended?: boolean; // Year 10 is recommended
}

export const ExitScenarioCard: React.FC<ExitScenarioCardProps> = ({
  scenario,
  isSelected,
  onToggleSelection,
  isRecommended = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when expanding
    setExpanded(!expanded);
  };

  const handleCardClick = () => {
    onToggleSelection();
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        borderRadius: '16px',
        border: isSelected
          ? `3px solid ${brrrColors.capitalRecovery.primary}`
          : isRecommended
          ? `2px solid ${brrrColors.postRefinance.primary}`
          : `1px solid ${brrrColors.postRefinance.medium}`,
        backgroundColor: isSelected
          ? brrrColors.capitalRecovery.light
          : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Recommended Badge */}
      {isRecommended && !isSelected && (
        <Chip
          label="Recommended"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: brrrColors.postRefinance.primary,
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      )}

      {/* Selection Checkbox */}
      <Checkbox
        checked={isSelected}
        icon={<UnselectedIcon />}
        checkedIcon={<SelectedIcon />}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: brrrColors.capitalRecovery.primary,
          '&.Mui-checked': {
            color: brrrColors.capitalRecovery.primary,
          },
        }}
        onClick={(e) => e.stopPropagation()} // Prevent double-trigger
      />

      <CardContent sx={{ p: 3, pt: isRecommended ? 5 : 3 }}>
        {/* Year Header */}
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            mb: 1,
            color: isSelected
              ? brrrColors.capitalRecovery.dark
              : brrrColors.postRefinance.dark,
          }}
        >
          Year {scenario.year} Exit
        </Typography>

        {/* Total Wealth Created (Headline Metric) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Total Wealth Created
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: brrrColors.capitalRecovery.dark }}>
            {formatCurrency(Math.round(scenario.totalWealthCreated))}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Metrics Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mb: 2,
          }}
        >
          {/* IRR */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              IRR
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatPercent(scenario.irr, 1)}
            </Typography>
          </Box>

          {/* Total Return */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Total Return
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {formatPercent(scenario.totalReturn, 1)}
            </Typography>
          </Box>

          {/* Net Proceeds */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Net Proceeds
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(Math.round(scenario.netProceeds))}
            </Typography>
          </Box>

          {/* Sale Price */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Sale Price
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(Math.round(scenario.salePrice))}
            </Typography>
          </Box>
        </Box>

        {/* Expand Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <IconButton
            onClick={handleExpandClick}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
            aria-expanded={expanded}
            aria-label="show breakdown"
          >
            <ExpandIcon />
          </IconButton>
        </Box>

        {/* Expandable Breakdown Details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Wealth Breakdown
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Capital Recovered */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                💰 Capital Recovered (Refinance)
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(Math.round(scenario.breakdown.capitalRecovered))}
              </Typography>
            </Box>

            {/* Cumulative Cash Flow */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                💵 Cumulative Cash Flow (Years 1-{scenario.year})
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(Math.round(scenario.breakdown.cumulativeCashFlow))}
              </Typography>
            </Box>

            {/* Appreciation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                📈 Appreciation (ARV → Sale Price)
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(Math.round(scenario.breakdown.appreciation))}
              </Typography>
            </Box>

            {/* Principal Paid Down */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                🏦 Principal Paid Down
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(Math.round(scenario.breakdown.principalPaid))}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Sale Details */}
            <Typography variant="caption" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
              Sale Transaction Details
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Selling Costs (6%)
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: brrrColors.negative.dark }}>
                -{formatCurrency(Math.round(scenario.sellingCosts))}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Mortgage Payoff
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: brrrColors.caution.dark }}>
                -{formatCurrency(Math.round(scenario.mortgagePayoff))}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ExitScenarioCard;
