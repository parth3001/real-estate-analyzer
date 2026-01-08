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

import React, { useState, useMemo } from 'react';
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
  BarChart as ChartIcon,
  TableChart as TableIcon,
  ViewModule as BothIcon,
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
import { formatCurrency } from '../../../utils/formatters';

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
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  // Collapsible projections state (chart/table)
  const [projectionsView, setProjectionsView] = useState<'chart' | 'table' | 'both' | 'hidden'>('table');

  // Extract BRRRR-specific data
  const purchasePrice = propertyData.purchasePrice || 0;
  const arv = propertyData.brrrr?.afterRepairValue || propertyData.afterRepairValue || 0;
  const rehabCosts = propertyData.renovationCosts || propertyData.brrrr?.rehabBudget || 0;
  const appreciationRate = analysis?.assumptions?.appreciationRate || 3.0;

  // Get exit scenarios from backend (new Tab 4 redesign data)
  // Exit scenarios are in investmentDecision.strategySpecific.exitScenarios
  const exitScenarios: ExitScenario[] = analysis?.investmentDecision?.strategySpecific?.exitScenarios || [];
  const hasExitScenarios = exitScenarios && exitScenarios.length > 0;
  const brrrData = analysis?.investmentDecision?.strategySpecific;

  // Calculate optimal exit year (highest IRR)
  const optimalExitYear = useMemo(() => {
    if (!hasExitScenarios || exitScenarios.length === 0) return 10; // Default fallback

    // Find scenario with highest IRR
    const optimalScenario = exitScenarios.reduce((best, current) => {
      if (!best) return current;
      // Handle edge case: if IRRs are equal, prefer earlier exit year
      if (Math.abs(current.irr - best.irr) < 0.001) {
        return current.year < best.year ? current : best;
      }
      return current.irr > best.irr ? current : best;
    });

    return optimalScenario.year;
  }, [exitScenarios, hasExitScenarios]);

  // Progressive disclosure: Show 3 scenarios by default (Years 5, 7, 10)
  // Based on UX Brief requirement for progressive disclosure
  const defaultScenarioYears = [5, 7, 10];
  const displayedScenarios = useMemo(() => {
    if (showAllScenarios || exitScenarios.length <= 3) {
      return exitScenarios;
    }
    // Show default 3 scenarios (5, 7, 10) or first 3 if defaults not available
    return exitScenarios.filter(s => defaultScenarioYears.includes(s.year)).slice(0, 3);
  }, [exitScenarios, showAllScenarios]);

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

      {/* NEW DESIGN: Exit Scenarios Available */}
      {hasExitScenarios && brrrData ? (
        <>
          {/* BRRRR Timeline Visual - FIRST per UX Brief */}
          <Box sx={{ mb: 4 }}>
            <BRRRRTimelineVisual
              brrrData={brrrData}
              purchasePrice={purchasePrice}
              afterRepairValue={arv}
            />
          </Box>

          {/* Exit Scenarios Section - SECOND per UX Brief */}
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
              {displayedScenarios.map((scenario: ExitScenario) => (
                <ExitScenarioCard
                  key={scenario.year}
                  scenario={scenario}
                  isSelected={selectedScenarios.includes(scenario.year)}
                  onToggleSelection={() => toggleScenarioSelection(scenario.year)}
                  isRecommended={scenario.year === optimalExitYear}
                />
              ))}
            </Box>

            {/* Show All / Show Less Button */}
            {exitScenarios.length > 3 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowAllScenarios(!showAllScenarios)}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    borderColor: brrrColors.neutral.medium,
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: brrrColors.postRefinance.primary,
                      backgroundColor: brrrColors.postRefinance.light,
                    },
                  }}
                >
                  {showAllScenarios ? 'Show Less' : `Show All ${exitScenarios.length} Scenarios`}
                </Button>
              </Box>
            )}
          </Box>

          {/* Forced Appreciation Callout - THIRD per UX Brief */}
          <Box sx={{ mb: 4 }}>
            <ForcedAppreciationCallout
              purchasePrice={purchasePrice}
              arv={arv}
              rehabCosts={rehabCosts}
              appreciationRate={appreciationRate}
            />
          </Box>

          {/* BRRRR vs Buy & Hold Comparison - FOURTH per UX Brief */}
          {exitScenarios.length > 0 && buyHoldComparison && buyHoldComparison.length >= 15 && (
            <Card sx={{ mb: 4, borderRadius: '16px', border: `2px solid ${brrrColors.capitalRecovery.light}` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  BRRRR Advantage at Year 15
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Comparing BRRRR strategy vs traditional Buy & Hold
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 3 }}>
                  {/* BRRRR Column */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: brrrColors.capitalRecovery.primary }}>
                      BRRRR Strategy
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Property Value (Year 15)</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(brrrProjections[14]?.propertyValue || 0))}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Equity</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(brrrProjections[14]?.equity || 0))}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cumulative Cash Flow</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(brrrProjections.slice(0, 15).reduce((sum: number, p: any) => sum + (p.cashFlow || 0), 0)))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Buy & Hold Column */}
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                      Buy & Hold Strategy
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Property Value (Year 15)</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(buyHoldComparison[14]?.propertyValue || 0))}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Equity</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(buyHoldComparison[14]?.equity || 0))}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cumulative Cash Flow</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(Math.round(buyHoldComparison.slice(0, 15).reduce((sum: number, p: any) => sum + (p.cashFlow || 0), 0)))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Advantage Summary */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: brrrColors.capitalRecovery.light, borderRadius: '12px' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: brrrColors.capitalRecovery.dark }}>
                    BRRRR Advantage: {formatCurrency(Math.round(
                      (brrrProjections[14]?.equity || 0) - (buyHoldComparison[14]?.equity || 0)
                    ))} higher equity
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Detailed Projections: Chart & Table - FIFTH per UX Brief */}
          <Card sx={{ mb: 4, borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  15-Year Financial Projections
                </Typography>

                {/* View Toggle Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant={projectionsView === 'chart' ? 'contained' : 'outlined'}
                    onClick={() => setProjectionsView('chart')}
                    startIcon={<ChartIcon />}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Chart
                  </Button>
                  <Button
                    size="small"
                    variant={projectionsView === 'table' ? 'contained' : 'outlined'}
                    onClick={() => setProjectionsView('table')}
                    startIcon={<TableIcon />}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Table
                  </Button>
                  <Button
                    size="small"
                    variant={projectionsView === 'both' ? 'contained' : 'outlined'}
                    onClick={() => setProjectionsView('both')}
                    startIcon={<BothIcon />}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Both
                  </Button>
                </Box>
              </Box>

              {/* Chart View */}
              {(projectionsView === 'chart' || projectionsView === 'both') && (
                <Box sx={{ mb: projectionsView === 'both' ? 3 : 0 }}>
                  <AppreciationChart
                    brrrData={brrrProjectionData}
                    buyHoldData={buyHoldComparison}
                    height={isMobile ? 300 : 400}
                  />
                </Box>
              )}

              {/* Table View */}
              {(projectionsView === 'table' || projectionsView === 'both') && (
                <ProjectionsTable
                  projections={brrrProjectionData}
                  compact={isMobile}
                  highlightYear={15}
                />
              )}
            </CardContent>
          </Card>

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
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              Exit Scenario Analysis Not Available
            </Typography>
            <Typography variant="body2">
              This analysis was generated before the BRRRR exit scenario feature was released.
              Re-analyze this property to see exit scenarios at Years 3, 5, 7, 10, and 15 with IRR calculations.
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
