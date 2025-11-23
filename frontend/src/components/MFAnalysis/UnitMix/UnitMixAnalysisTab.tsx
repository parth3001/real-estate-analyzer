/**
 * Unit Mix Analysis Tab Component
 *
 * Main container for Unit Mix Analysis.
 * Transforms backend MF analysis data and renders all child components.
 *
 * @component
 */

import React, { useMemo } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import ValueAddOpportunityCard from './ValueAddOpportunityCard';
import UnitMixOverviewTable, { type UnitTypeData } from './UnitMixOverviewTable';
import UnitMixCharts from './UnitMixCharts';
import UnitMixEfficiencyCard from './UnitMixEfficiencyCard';

interface UnitType {
  type: string;
  count: number;
  sqft: number;
  monthlyRent: number;
  marketRent?: number;
}

interface PerUnitTypeMetric {
  unitType: string;
  income: number;
  opex: number;
  noi: number;
  cashFlow: number;
}

interface UnitMixAnalysisTabProps {
  // From propertyData
  unitTypes: UnitType[];
  totalUnits: number;
  totalSqft: number;

  // From analysis.keyMetrics (MultiFamilyMetrics)
  unitMixEfficiency: number;
  noiPerUnit: number;
  cashFlowPerUnit: number;
  operatingExpensePerUnit: number;
  averageRentPerUnit: number;

  // From analysis.longTermAnalysis.projections[0]
  year1GrossIncome: number;
  year1OperatingExpenses: number;
  year1NOI: number;
  year1CashFlow: number;

  // Issue #5: Per-unit-type metrics for profitability comparison
  perUnitTypeMetrics?: PerUnitTypeMetric[];
}

export const UnitMixAnalysisTab: React.FC<UnitMixAnalysisTabProps> = ({
  unitTypes,
  totalUnits,
  totalSqft,
  unitMixEfficiency,
  noiPerUnit,
  cashFlowPerUnit,
  operatingExpensePerUnit,
  // averageRentPerUnit, // Not used in current implementation
  year1GrossIncome,
  year1OperatingExpenses,
  // year1NOI, // Not used in current implementation
  // year1CashFlow // Not used in current implementation
  perUnitTypeMetrics = [] // Issue #5: Backend-calculated per-unit-type metrics
}) => {
  // Transform and calculate data
  const transformedData = useMemo(() => {
    // Calculate total current monthly rent
    const totalCurrentMonthlyRent = unitTypes.reduce(
      (sum, unit) => sum + unit.monthlyRent * unit.count,
      0
    );

    // Calculate total market monthly rent (if available)
    const hasMarketData = unitTypes.some(unit => unit.marketRent && unit.marketRent > 0);
    const totalMarketMonthlyRent = unitTypes.reduce(
      (sum, unit) => sum + (unit.marketRent || unit.monthlyRent) * unit.count,
      0
    );

    // Calculate totals
    const currentAnnualRent = totalCurrentMonthlyRent * 12;
    const marketAnnualRent = totalMarketMonthlyRent * 12;
    const annualUpside = marketAnnualRent - currentAnnualRent;
    const upsidePercentage = currentAnnualRent > 0 ? (annualUpside / currentAnnualRent) * 100 : 0;

    // Transform unit types for table
    const transformedUnitTypes: UnitTypeData[] = unitTypes.map(unit => {
      const monthlyRentTotal = unit.monthlyRent * unit.count;
      const marketRent = unit.marketRent || 0;
      // Issue #11: Gap should be Current - Market (positive when above market, negative when below)
      const rentGap = marketRent > 0 ? unit.monthlyRent - marketRent : 0;
      const rentPerSqft = unit.monthlyRent / unit.sqft;
      const incomePercentage = totalCurrentMonthlyRent > 0 ? (monthlyRentTotal / totalCurrentMonthlyRent) * 100 : 0;

      return {
        type: unit.type,
        count: unit.count,
        sqft: unit.sqft,
        currentRent: unit.monthlyRent,
        marketRent: unit.marketRent,
        rentGap,
        rentPerSqft,
        incomePercentage
      };
    });

    // Calculate table totals
    const totals = {
      count: totalUnits,
      sqft: totalSqft,
      currentRent: totalCurrentMonthlyRent,
      marketRent: totalMarketMonthlyRent,
      // Issue #11: Gap should be Current - Market (positive when above market, negative when below)
      rentGap: hasMarketData ? (totalCurrentMonthlyRent - totalMarketMonthlyRent) : 0,
      rentPerSqft: totalSqft > 0 ? totalCurrentMonthlyRent / totalSqft : 0
    };

    // Income distribution for pie chart
    const incomeDistribution = transformedUnitTypes.map(unit => ({
      name: unit.type,
      value: unit.incomePercentage,
      percentage: unit.incomePercentage
    }));

    // Per-unit metrics for bar chart (Issue #5: Use backend-calculated values)
    // 🔍 DIAGNOSTIC LOGGING - Issue #5 Investigation
    console.log('🔍 [UnitMixAnalysisTab] ========== DIAGNOSTIC START ==========');
    console.log('🔍 [UnitMixAnalysisTab] perUnitTypeMetrics prop:', perUnitTypeMetrics);
    console.log('🔍 [UnitMixAnalysisTab] perUnitTypeMetrics.length:', perUnitTypeMetrics?.length);
    console.log('🔍 [UnitMixAnalysisTab] Using backend data?', perUnitTypeMetrics.length > 0);

    const perUnitMetrics = perUnitTypeMetrics.length > 0
      ? perUnitTypeMetrics // Use backend-calculated per-unit-type metrics
      : transformedUnitTypes.map(unit => {
          // Fallback: Estimate per-unit economics (if backend data not available)
          console.warn('⚠️ [UnitMixAnalysisTab] FALLBACK CALCULATION TRIGGERED - Backend data not available!');
          console.warn('⚠️ [UnitMixAnalysisTab] This means perUnitTypeMetrics prop is empty or undefined');

          const incomeShare = unit.incomePercentage / 100;
          const grossIncomePerUnit = (year1GrossIncome / totalUnits) * (incomeShare * totalUnits / unit.count);
          const opexPerUnit = operatingExpensePerUnit * 12; // Convert monthly to annual
          const noiPerUnitCalc = noiPerUnit * 12; // Convert monthly to annual
          const cashFlowPerUnitCalc = cashFlowPerUnit * 12; // Convert monthly to annual

          console.warn(`⚠️ [UnitMixAnalysisTab] Fallback data for ${unit.type}:`, {
            income: grossIncomePerUnit,
            opex: opexPerUnit,
            noi: noiPerUnitCalc,
            cashFlow: cashFlowPerUnitCalc
          });

          return {
            unitType: unit.type,
            income: grossIncomePerUnit,
            opex: opexPerUnit,
            noi: noiPerUnitCalc,
            cashFlow: cashFlowPerUnitCalc
          };
        });

    console.log('🔍 [UnitMixAnalysisTab] Final perUnitMetrics:', perUnitMetrics);
    console.log('🔍 [UnitMixAnalysisTab] ========== DIAGNOSTIC END ==========');

    // Issue #9: Calculate efficiency breakdown with HHI algorithm and market alignment scoring

    // 1. DIVERSIFICATION SCORE (using Herfindahl-Hirschman Index)
    // HHI = Σ(share²) × 10,000
    // Measures concentration risk - higher HHI = higher concentration risk
    const totalMonthlyIncome = transformedUnitTypes.reduce(
      (sum, unit) => sum + (unit.currentRent * unit.count),
      0
    );

    const hhi = transformedUnitTypes.reduce((sum, unit) => {
      const incomeShare = totalMonthlyIncome > 0
        ? (unit.currentRent * unit.count) / totalMonthlyIncome
        : 0;
      return sum + (incomeShare * incomeShare * 10000);
    }, 0);

    // Score HHI thresholds (institutional standard)
    let diversificationScore: number;
    if (hhi < 2500) {
      diversificationScore = 100; // Low concentration - excellent diversification
    } else if (hhi < 3500) {
      diversificationScore = 85; // Moderate concentration
    } else if (hhi < 5000) {
      diversificationScore = 70; // Moderate-high concentration
    } else if (hhi < 6500) {
      diversificationScore = 60; // High concentration - single unit type dominant
    } else {
      diversificationScore = 50; // Very high concentration - significant risk
    }

    // 2. MARKET ALIGNMENT SCORE
    // Measures how current rents compare to market rates
    // Above market = risk of rent reduction on turnover
    // Below market = value-add opportunity
    let marketAlignmentScore: number;

    if (!hasMarketData) {
      // No market data available - use neutral score
      marketAlignmentScore = 75;
    } else {
      const avgCurrentRent = transformedUnitTypes.reduce((sum, u) => sum + u.currentRent * u.count, 0) / totalUnits;
      const avgMarketRent = transformedUnitTypes.reduce((sum, u) => sum + (u.marketRent || u.currentRent) * u.count, 0) / totalUnits;
      const marketDifferencePercent = avgMarketRent > 0 ? ((avgCurrentRent - avgMarketRent) / avgMarketRent) * 100 : 0;

      if (Math.abs(marketDifferencePercent) <= 2) {
        // At market (±2%) - optimal pricing
        marketAlignmentScore = 100;
      } else if (marketDifferencePercent < -10) {
        // More than 10% below market - significant upside opportunity
        marketAlignmentScore = 90;
      } else if (marketDifferencePercent < -5) {
        // 5-10% below market - moderate upside
        marketAlignmentScore = 95;
      } else if (marketDifferencePercent < 0) {
        // 0-5% below market - slight upside
        marketAlignmentScore = 98;
      } else if (marketDifferencePercent <= 5) {
        // 0-5% above market - slight risk
        marketAlignmentScore = 75;
      } else if (marketDifferencePercent <= 10) {
        // 5-10% above market - moderate risk
        marketAlignmentScore = 55;
      } else {
        // More than 10% above market - high risk
        marketAlignmentScore = 40;
      }
    }

    // 3. RENT EFFICIENCY SCORE
    // Measures rent per sqft relative to building efficiency
    const avgRentPerSqft = totalSqft > 0 ? totalCurrentMonthlyRent / totalSqft : 0;

    // Industry benchmarks for rent per sqft (monthly)
    // Varies by market and building type, using conservative estimates
    let rentEfficiencyScore: number;
    if (avgRentPerSqft >= 1.50) {
      rentEfficiencyScore = 100; // Excellent rent efficiency
    } else if (avgRentPerSqft >= 1.20) {
      rentEfficiencyScore = 90; // Good rent efficiency
    } else if (avgRentPerSqft >= 1.00) {
      rentEfficiencyScore = 80; // Average rent efficiency
    } else if (avgRentPerSqft >= 0.80) {
      rentEfficiencyScore = 70; // Below average
    } else {
      rentEfficiencyScore = 60; // Poor rent efficiency
    }

    // 4. CALCULATE WEIGHTED OVERALL SCORE
    // Market alignment weighted highest (40%) as it's most actionable
    // Diversification 35% (concentration risk is critical)
    // Rent efficiency 25% (less actionable short-term)
    const calculatedOverallScore =
      (diversificationScore * 0.35) +
      (marketAlignmentScore * 0.40) +
      (rentEfficiencyScore * 0.25);

    const efficiencyBreakdown = {
      diversification: diversificationScore,
      marketAlignment: marketAlignmentScore,
      rentEfficiency: rentEfficiencyScore
    };

    // Issue #13: Removed negative cash flow card (redundant - shown in Investment Decision Hero,
    // Monthly Analysis, and Per-Unit Economics chart already communicates this with red bars)
    // Calculation logic removed as it's no longer needed

    return {
      currentAnnualRent,
      marketAnnualRent,
      annualUpside,
      upsidePercentage,
      hasMarketData,
      transformedUnitTypes,
      totals,
      incomeDistribution,
      perUnitMetrics,
      efficiencyBreakdown,
      calculatedOverallScore // Issue #9: Use HHI-based calculated score
    };
  }, [unitTypes, totalUnits, totalSqft, unitMixEfficiency, noiPerUnit, cashFlowPerUnit, operatingExpensePerUnit, year1GrossIncome, year1OperatingExpenses, perUnitTypeMetrics]);

  // Validation - ensure we have data
  if (!unitTypes || unitTypes.length === 0) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="warning">
          <Typography variant="body2">
            No unit type data available. Unit mix analysis requires property to have unit type configuration.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Unit Mix Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Detailed breakdown of unit types, rent positioning, and profitability by unit configuration
      </Typography>

      {/* Value-Add Opportunity Card */}
      <ValueAddOpportunityCard
        currentAnnualRent={transformedData.currentAnnualRent}
        marketAnnualRent={transformedData.marketAnnualRent}
        annualUpside={transformedData.annualUpside}
        upsidePercentage={transformedData.upsidePercentage}
        hasMarketData={transformedData.hasMarketData}
      />

      {/* Unit Mix Overview Table */}
      <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>
        Unit Mix Overview
      </Typography>
      <UnitMixOverviewTable
        unitTypes={transformedData.transformedUnitTypes}
        totals={transformedData.totals}
      />

      {/* Charts: Income Concentration + Per-Unit Economics */}
      <UnitMixCharts
        incomeDistribution={transformedData.incomeDistribution}
        perUnitMetrics={transformedData.perUnitMetrics}
      />

      {/* Unit Mix Efficiency Score */}
      {/* Issue #9: Use calculated score with HHI algorithm instead of backend unitMixEfficiency */}
      <UnitMixEfficiencyCard
        overallScore={transformedData.calculatedOverallScore}
        breakdown={transformedData.efficiencyBreakdown}
      />
    </Box>
  );
};

export default UnitMixAnalysisTab;
