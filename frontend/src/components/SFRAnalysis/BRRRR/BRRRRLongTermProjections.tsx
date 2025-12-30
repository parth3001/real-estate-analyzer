/**
 * BRRRR Long-Term Projections Component (Tab 4: Long-term Analysis)
 *
 * Redesigned to show multiple exit scenarios (3, 5, 7, 10, 15 years) instead of single timeline.
 *
 * Key Features:
 * - BRRRR Timeline Visual (4-phase stepper: Purchase/Rehab → Seasoning → Refinance → Hold)
 * - Multiple Exit Scenario Cards (3, 5, 7, 10, 15 years with total wealth, IRR, breakdown)
 * - Side-by-Side Comparison Modal (compare up to 3 selected scenarios)
 * - Forced Appreciation Callout (explains ARV starting point)
 * - Fallback to old chart/table view if exit scenarios not available
 *
 * Architecture:
 * - Backend calculates 15 years of projections for BRRRR (strategy-aware)
 * - Backend generates exit scenarios at years 3, 5, 7, 10, 15
 * - Frontend is pure display layer (no calculations)
 *
 * @author FSE from CLAUDE.md
 * @date December 29, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  useMediaQuery,
  useTheme,
  Alert,
} from '@mui/material';
import {
  Compare as CompareIcon,
} from '@mui/icons-material';
import { BRRRRTimelineVisual } from './BRRRRTimelineVisual';
import { ExitScenarioCard } from './ExitScenarioCard';
import { ScenarioComparisonModal } from './ScenarioComparisonModal';
import { ForcedAppreciationCallout } from './ForcedAppreciationCallout';
import { AppreciationChart } from './AppreciationChart';
import { ProjectionsTable } from './ProjectionsTable';
import type { ProjectionRow } from './types';
import type { ExitScenario } from '../../../types/brrrr';
import { brrrColors } from '../../../theme/brrrDesignTokens';

export interface BRRRRLongTermProjectionsProps {
  analysis: any; // Full analysis object from backend
  propertyData: any; // Property data including BRRRR details
}

export const BRRRRLongTermProjections: React.FC<BRRRRLongTermProjectionsProps> = ({
  analysis,
  propertyData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Selection state for scenario comparison
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>([]); // Array of scenario years
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  // Extract BRRRR-specific data
  const purchasePrice = propertyData.purchasePrice || 0;
  const arv = propertyData.brrrr?.afterRepairValue || propertyData.afterRepairValue || 0;
  const rehabCosts = propertyData.renovationCosts || propertyData.brrrr?.rehabBudget || 0;
  const appreciationRate = analysis?.assumptions?.appreciationRate || 3.0;

  // Get exit scenarios from backend (new Tab 4 redesign data)
  const exitScenarios: ExitScenario[] = analysis?.brrrAnalysis?.exitScenarios || [];
  const hasExitScenarios = exitScenarios && exitScenarios.length > 0;
  const brrrData = analysis?.brrrAnalysis;

  // Fallback: Old projection data for backward compatibility
  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
  const brrrProjections = analysis?.longTermAnalysis?.projections || [];

  // Selection handlers
  const toggleScenarioSelection = (year: number) => {
    setSelectedScenarios((prev) => {
      if (prev.includes(year)) {
        // Deselect
        return prev.filter((y) => y !== year);
      } else {
        // Select (max 3 scenarios)
        if (prev.length >= 3) {
          return [...prev.slice(1), year]; // Remove oldest, add newest
        }
        return [...prev, year];
      }
    });
  };

  const handleOpenComparison = () => {
    setComparisonModalOpen(true);
  };

  const handleCloseComparison = () => {
    setComparisonModalOpen(false);
  };

  // Get selected scenario objects for modal
  const selectedScenarioObjects = exitScenarios.filter((s) =>
    selectedScenarios.includes(s.year)
  );

  // Fallback: Generate Buy & Hold comparison data for old chart
  const generateBuyHoldComparison = (): ProjectionRow[] => {
    const buyHoldProjections: ProjectionRow[] = [];
    for (let year = 1; year <= projectionYears; year++) {
      const propertyValue = purchasePrice * Math.pow(1 + appreciationRate / 100, year - 1);
      buyHoldProjections.push({
        year,
        propertyValue,
      });
    }
    return buyHoldProjections;
  };

  const buyHoldComparison = generateBuyHoldComparison();

  // Fallback: Transform backend projections to component format
  const brrrProjectionData: ProjectionRow[] = brrrProjections.map((p: any) => ({
    year: p.year || 0,
    propertyValue: p.propertyValue || 0,
    equity: p.equity,
    loanBalance: p.mortgageBalance,  // Fix: Backend sends mortgageBalance, not loanBalance
    cashFlow: p.cashFlow,
    noi: p.noi,
    appreciationGain: p.year === 1 ? 0 : (p.propertyValue - brrrProjections[0]?.propertyValue),
  }));

  return (
    <Box>
      {/* Section Header */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
        BRRRR Long-Term Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {hasExitScenarios
          ? 'Explore multiple exit scenarios to discover optimal timing for your investment'
          : `${projectionYears}-year financial forecast starting from After Repair Value (ARV)`}
      </Typography>

      {/* Forced Appreciation Callout */}
      <ForcedAppreciationCallout
        purchasePrice={purchasePrice}
        arv={arv}
        rehabCosts={rehabCosts}
        appreciationRate={appreciationRate}
      />

      {/* NEW DESIGN: Exit Scenarios Available */}
      {hasExitScenarios && brrrData ? (
        <>
          {/* BRRRR Timeline Visual */}
          <Box sx={{ mb: 4 }}>
            <BRRRRTimelineVisual
              brrrData={brrrData}
              purchasePrice={purchasePrice}
              afterRepairValue={arv}
            />
          </Box>

          {/* Exit Scenarios Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Exit Scenarios: When Should You Sell?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedScenarios.length === 0
                    ? 'Select scenarios to compare (up to 3)'
                    : `${selectedScenarios.length} scenario${selectedScenarios.length > 1 ? 's' : ''} selected`}
                </Typography>
              </Box>

              {/* Compare Button (shows when 2+ selected) */}
              {selectedScenarios.length >= 2 && (
                <Button
                  variant="contained"
                  startIcon={<CompareIcon />}
                  onClick={handleOpenComparison}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    backgroundColor: brrrColors.capitalRecovery.primary,
                    '&:hover': {
                      backgroundColor: brrrColors.capitalRecovery.dark,
                    },
                  }}
                >
                  Compare {selectedScenarios.length} Scenarios
                </Button>
              )}
            </Box>

            {/* Exit Scenario Cards Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 3,
              }}
            >
              {exitScenarios.map((scenario) => (
                <ExitScenarioCard
                  key={scenario.year}
                  scenario={scenario}
                  isSelected={selectedScenarios.includes(scenario.year)}
                  onToggleSelection={() => toggleScenarioSelection(scenario.year)}
                  isRecommended={scenario.year === 10} // Year 10 is recommended
                />
              ))}
            </Box>
          </Box>

          {/* Scenario Comparison Modal */}
          <ScenarioComparisonModal
            scenarios={selectedScenarioObjects}
            open={comparisonModalOpen}
            onClose={handleCloseComparison}
          />
        </>
      ) : (
        /* FALLBACK: Old design for backward compatibility */
        <>
          {/* Show alert if no exit scenarios */}
          <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
            <Typography variant="body2">
              Exit scenarios not available for this analysis. Showing traditional projection table.
            </Typography>
          </Alert>

          {/* Old Chart View */}
          <Card sx={{ mb: 3, borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Property Value Appreciation: BRRRR vs Buy & Hold
              </Typography>
              <AppreciationChart
                brrrData={brrrProjectionData}
                buyHoldData={buyHoldComparison}
                height={isMobile ? 300 : 400}
              />
            </CardContent>
          </Card>

          {/* Old Table View */}
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                {projectionYears}-Year Financial Projections
              </Typography>
              <ProjectionsTable
                projections={brrrProjectionData}
                compact={isMobile}
                highlightYear={projectionYears}
              />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default BRRRRLongTermProjections;
