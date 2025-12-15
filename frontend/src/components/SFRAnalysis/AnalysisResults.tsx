// Enhanced Apple-Style AnalysisResults Component - COMPREHENSIVE WITH 80+ METRICS
// Complete replacement with all documented metrics and enhanced AI insights

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import Grid from '@mui/system/Grid';
import {
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  Compare as CompareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  Build as FixIcon,
  Assessment as ScenarioIcon
} from '@mui/icons-material';
import { appleColors } from '../../theme/appleDesignSystem';
import IntelligenceMultiplier from './IntelligenceMultiplier';
import InvestmentDecisionHero from './InvestmentDecisionHero';
import SimplePortfolioSelector from './SimplePortfolioSelector';
// Tax components replaced with educational versions
import TaxEducationSummary from '../AnalysisResults/TaxEducationSummary';
// Story 4.2: Unit Mix Analysis Tab
import { UnitMixAnalysisTab } from '../MFAnalysis/UnitMix';
// import TaxImpactSummary from '../AnalysisResults/TaxImpactSummary'; // DEPRECATED
// import HoldPeriodOptimizer from '../AnalysisResults/HoldPeriodOptimizer'; // DEPRECATED
// import TaxStrategies from '../AnalysisResults/TaxStrategies'; // DEPRECATED
// import ProMetricsBar from './ProMetricsBar'; // DEPRECATED - Replaced by unified Tier 1 metrics
import DynamicSliders from './DynamicSliders';
import DealFixer from './DealFixer';
import ScenarioManager from './ScenarioManager';
import StressTestingDashboard from './StressTestingDashboard';
import FeedbackWidget from '../common/FeedbackWidget';
import { EmailVerificationBanner, markFirstAnalysisComplete } from '../common/EmailVerificationBanner';
import { useDualMode } from '../../contexts/DualModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { EducationalTooltip } from '../common/EducationalTooltip';
// Phase 3A: Strategy-aware metrics integration
import { getMetricTiers } from './metricDefinitions';
import type { MetricDefinition } from './metricDefinitions';

interface AnalysisResultsProps {
  analysis: any; // Your existing Analysis type
  propertyData: any; // Your existing PropertyData type
  dealId?: string; // Required for MongoDB scenario persistence
  onParameterChange?: (data: any) => Promise<void>; // Handler for parameter changes
  onApplyFix?: (data: any, description: string) => Promise<void>; // Handler for deal fixes
  onLoadScenario?: (data: any) => Promise<void>; // Handler for loading scenarios
  isRecalculating?: boolean; // Loading state for real-time updates
  portfolioContext?: {
    portfolioId: string | null;
    portfolioName?: string;
    portfolioGoal?: string;
    currentProperties?: number;
    monthlyNetCashFlow?: number;
  }; // Portfolio context for displaying impact
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  propertyData,
  portfolioContext,
  dealId,
  onParameterChange,
  onApplyFix,
  onLoadScenario
}): React.ReactElement => {
  const { mode } = useDualMode();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('overview');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showProfessionalMetrics, setShowProfessionalMetrics] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showInvestmentIntelligence, setShowInvestmentIntelligence] = useState(false);

  // Mark first analysis complete (for email verification banner)
  React.useEffect(() => {
    markFirstAnalysisComplete();
  }, []);

  // ========================================
  // METRICS REORGANIZATION: Debug Logging (Phase 1)
  // Added: 2025-12-13
  // Purpose: Validate data availability for zero-risk refactoring
  // ========================================
  console.group('🔍 METRICS DEBUG - Reorganization Safety Check');
  console.log('Analysis object available:', !!analysis);
  console.log('Analysis keys:', analysis ? Object.keys(analysis) : 'MISSING');
  console.log('keyMetrics available:', !!analysis?.keyMetrics);
  console.log('keyMetrics count:', analysis?.keyMetrics ? Object.keys(analysis.keyMetrics).length : 0);
  console.log('propertyData available:', !!propertyData);
  console.log('propertyData keys:', propertyData ? Object.keys(propertyData) : 'MISSING');
  console.log('monthlyAnalysis available:', !!analysis?.monthlyAnalysis);
  console.log('longTermAnalysis available:', !!analysis?.longTermAnalysis);
  console.log('investmentDecision available:', !!analysis?.investmentDecision);
  console.log('Property type:', propertyData?.propertyType || 'UNKNOWN');
  console.log('Current mode:', mode);
  console.groupEnd();

  // Debug: Log the analysis structure
  console.log('AnalysisResults - analysis object:', analysis);
  console.log('AnalysisResults - keyMetrics:', analysis?.keyMetrics);
  console.log('AnalysisResults - monthlyAnalysis:', analysis?.monthlyAnalysis);
  console.log('AnalysisResults - annualAnalysis (removed - using longTermAnalysis):', 'REMOVED');
  console.log('AnalysisResults - longTermAnalysis:', analysis?.longTermAnalysis);

  // Tax Intelligence debugging - correct data path
  console.log('🔍 TAX COMPONENT DEBUG - Investment Decision Tax Analysis:', {
    hasInvestmentDecision: !!analysis?.investmentDecision,
    hasTaxAnalysis: !!analysis?.investmentDecision?.taxAnalysis,
    taxAnalysisKeys: analysis?.investmentDecision?.taxAnalysis ? Object.keys(analysis.investmentDecision.taxAnalysis) : [],
    optimalHoldPeriod: analysis?.investmentDecision?.taxAnalysis?.optimalHoldPeriod,
    taxSavings: analysis?.investmentDecision?.taxAnalysis?.totalTaxSavingsAtOptimal,
    willRenderTaxTab: !!analysis?.investmentDecision?.taxAnalysis || !!propertyData?.taxProfile,
    hasTaxProfile: !!propertyData?.taxProfile,
    hasTaxOptimization: !!analysis?.investmentDecision?.professionalAssessment?.taxOptimization
  });

  // Story 4.1 & 4.2: Determine property type for conditional rendering
  const propertyType = propertyData?.propertyType || analysis?.propertyData?.propertyType;

  // ========================================
  // Phase 3A: Strategy-Aware Metrics Integration
  // Get metric tiers based on property type and strategy
  // ========================================
  const strategyResult = getMetricTiers({
    propertyType: propertyType as 'SFR' | 'MF',
    strategy: analysis?.strategy || propertyData?.strategy || 'buy-hold',
    analysis,
    propertyData
  });

  console.log('📊 Strategy Selector Result:', {
    type: strategyResult.type,
    strategy: strategyResult.type === 'SFR' ? strategyResult.strategy : 'N/A',
    isFallback: strategyResult.type === 'SFR' ? strategyResult.isFallback : false,
    tierCount: strategyResult.tiers.length,
    ...(strategyResult.type === 'SFR' ? {
      tier1Metrics: (strategyResult.tiers[0] as any)?.metrics?.length || 0,
      tier2Metrics: (strategyResult.tiers[1] as any)?.metrics?.length || 0,
      tier3Metrics: (strategyResult.tiers[2] as any)?.metrics?.length || 0,
    } : {}),
    tier2Title: strategyResult.tiers[1]?.title || 'N/A',
    tier3Title: strategyResult.tiers[2]?.title || 'N/A'
  });

  // Phase 3B: Helper function to convert MetricDefinition to AppleMetricCard format
  // IMPORTANT: Must be declared before heroMetrics to avoid hoisting issues
  const buildMetricFromDefinition = (metricDef: MetricDefinition) => {
    const value = metricDef.getValue(analysis, propertyData);
    const status = metricDef.getStatus ? metricDef.getStatus(value) : 'neutral';

    // Handle dynamic labels and descriptions (Issue #25 fix)
    const label = typeof metricDef.label === 'function'
      ? metricDef.label(analysis, propertyData)
      : metricDef.label;

    const description = typeof metricDef.description === 'function'
      ? metricDef.description(analysis, propertyData)
      : metricDef.description;

    return {
      label: label,
      value: value,
      format: metricDef.format,
      status: status,
      highlight: metricDef.tier === 1,
      description: description
    };
  };

  // Story 4.2: Conditional tab injection for MF properties
  // Analysis sections for horizontal navigation - filter based on mode
  // TAB SEQUENCE (FSE requirement): Overview → Financial Details → Unit Mix (MF only) → Long-term Analysis → Tax Intelligence → Interactive → Optimizer → Scenarios → Other tabs
  const allAnalysisSections = [
    { id: 'overview', label: 'Overview', icon: HomeIcon, description: 'Hero metrics and AI insights', implemented: true },
    { id: 'financial', label: 'Financial Details', icon: AnalyticsIcon, description: 'Detailed cash flow analysis', implemented: true },
    // Story 4.2: Inject Unit Mix tab for MF properties only (after Financial Details, before Long-term Analysis)
    ...(propertyType === 'MF' ? [
      { id: 'unitMix', label: 'Unit Mix Analysis', icon: AssessmentIcon, description: 'Unit-level revenue breakdown and optimization', implemented: true }
    ] : []),
    { id: 'projections', label: 'Long-term Analysis', icon: TrendingUpIcon, description: '10-year forecasts and projections', implemented: true },
    { id: 'tax', label: 'Tax Intelligence', icon: SecurityIcon, description: 'Professional tax education and insights', implemented: true },
    { id: 'interactive', label: 'Interactive Analysis', icon: TuneIcon, description: 'Adjust parameters in real-time', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'optimizer', label: 'Deal Optimizer', icon: FixIcon, description: 'Suggestions to improve returns', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'scenarios', label: 'Scenario Manager', icon: ScenarioIcon, description: 'Save and compare scenarios', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'risk', label: 'Risk & Intelligence', icon: ShieldIcon, description: 'Risk analysis and market data', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'stress', label: 'Stress Testing', icon: WarningIcon, description: 'Stress scenarios and risk heat maps', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'market', label: 'Market Analysis', icon: AssessmentIcon, description: 'Market trends and economics', implemented: propertyType !== 'MF' }, // Not implemented for MF
    { id: 'comparables', label: 'Comparables', icon: CompareIcon, description: 'Similar properties comparison', implemented: propertyType !== 'MF' } // Not implemented for MF
  ];

  // UNIFIED EXPERIENCE: Show all tabs to everyone (no mode-based filtering)
  // Previously: Novice mode showed 8 tabs, Pro mode showed all 12 tabs
  // Now: Everyone sees all available tabs (formerly "Pro mode" tab set)
  const analysisSections = allAnalysisSections;

  // ========================================
  // Phase 3B: Strategy-Aware Hero Metrics (Tier 1)
  // MF: Use existing hardcoded metrics (backward compatible)
  // SFR: Use strategy selector Tier 1 metrics (3-7-8 pattern)
  // ========================================
  const heroMetrics = propertyType === 'MF'
    ? [
        // MF Hero Metric 1: Cap Rate (primary MF valuation metric)
        {
          label: 'Cap Rate',
          value: analysis?.keyMetrics?.capRate || 0,
          format: 'percent' as const,
          status: (analysis?.keyMetrics?.capRate || 0) >= 6 ? 'positive' as const : (analysis?.keyMetrics?.capRate || 0) >= 4 ? 'warning' as const : 'negative' as const,
          highlight: true,
          description: 'Annual NOI as % of property value (industry standard for MF)'
        },
        // MF Hero Metric 2: DSCR (lender financing requirement)
        {
          label: 'DSCR',
          value: analysis?.keyMetrics?.dscr || 0,
          format: 'multiplier' as const,
          status: (analysis?.keyMetrics?.dscr || 0) >= 1.25 ? 'positive' as const : (analysis?.keyMetrics?.dscr || 0) >= 1.0 ? 'warning' as const : 'negative' as const,
          highlight: true,
          description: 'Debt Service Coverage Ratio (1.25x+ required by Fannie Mae)'
        },
        // MF Hero Metric 3: Annual NOI (foundation of MF value)
        {
          label: 'Annual NOI',
          value: analysis?.keyMetrics?.noi || 0,
          format: 'currency' as const,
          status: (analysis?.keyMetrics?.noi || 0) >= 0 ? 'positive' as const : 'negative' as const,
          highlight: true,
          description: 'Net Operating Income (determines property value for MF)'
        },
        // MF Hero Metric 4: Cash-on-Cash Return (equity performance)
        {
          label: 'Cash-on-Cash Return',
          value: analysis?.keyMetrics?.cashOnCashReturn || 0,
          format: 'percent' as const,
          status: (analysis?.keyMetrics?.cashOnCashReturn || 0) >= 8 ? 'positive' as const : (analysis?.keyMetrics?.cashOnCashReturn || 0) >= 0 ? 'warning' as const : 'negative' as const,
          highlight: true,
          description: 'Annual cash return on invested capital'
        }
      ]
    : // SFR: Use Tier 1 from strategy selector (3 metrics for Buy & Hold)
      strategyResult.type === 'SFR'
        ? strategyResult.tiers[0]?.metrics.map(buildMetricFromDefinition) || []
        : []; // Fallback to empty if strategy selector fails

  console.log('🎯 Phase 3B - Hero Metrics Built:', {
    propertyType,
    heroMetricsCount: heroMetrics.length,
    usedStrategySelector: propertyType !== 'MF',
    tier1MetricsFromSelector: strategyResult.type === 'SFR' ? strategyResult.tiers[0]?.metrics.length : 0,
    heroMetricLabels: heroMetrics.map(m => m.label)
  });

  // Legacy hardcoded metrics (still used in Financial Details tab and other sections)
  // NOTE: Overview tab now uses strategy-aware metrics from metricDefinitions/
  // These will be migrated to strategy-aware system in future work
  const projectionYears = analysis?.longTermAnalysis?.projectionYears || 10;
  const keyFinancialMetrics = [
    {
      label: `${projectionYears}-Year IRR`,
      // Backend returns IRR as decimal (0.05 = 5%), convert to percentage for display
      value: ((analysis?.keyMetrics?.irr || analysis?.longTermAnalysis?.returns?.irr || 0) * 100),
      format: 'percent' as const,
      // Status thresholds: 15% (excellent), 8% (good), <8% (caution)
      status: ((analysis?.keyMetrics?.irr || analysis?.longTermAnalysis?.returns?.irr || 0) * 100) >= 15 ? 'positive' as const : ((analysis?.keyMetrics?.irr || analysis?.longTermAnalysis?.returns?.irr || 0) * 100) >= 8 ? 'warning' as const : 'negative' as const,
      description: 'Internal Rate of Return - Time-weighted annualized return rate'
    },
    {
      label: `Total ROI (${projectionYears} yr)`,
      value: analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0,
      format: 'percent' as const,
      status: (analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0) >= 100 ? 'positive' as const : (analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0) >= 50 ? 'warning' as const : 'negative' as const,
      description: `Total cumulative return percentage over ${projectionYears} years`
    },
    {
      label: 'DSCR',
      value: analysis?.keyMetrics?.dscr || 0.98,
      format: 'decimal' as const,
      status: (analysis?.keyMetrics?.dscr || 0) >= 1.25 ? 'positive' as const : (analysis?.keyMetrics?.dscr || 0) >= 1.0 ? 'warning' as const : 'negative' as const,
      description: 'Debt Service Coverage Ratio'
    },
    {
      label: 'Total Investment',
      value: analysis?.keyMetrics?.totalInvestment || ((propertyData?.downPayment || 0) + (propertyData?.closingCosts || 0) + (propertyData?.repairCosts || 0)) || 147500,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Total upfront investment required'
    },
    {
      label: 'Price/SqFt',
      value: propertyData?.squareFootage ? propertyData.purchasePrice / propertyData.squareFootage : 175,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Purchase price per square foot'
    },
    {
      label: 'Rent/SqFt',
      value: propertyData?.squareFootage ? (propertyData.monthlyRent || 0) / propertyData.squareFootage : 1,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Monthly rent per square foot'
    },
    {
      label: 'Net Operating Income',
      value: analysis?.keyMetrics?.noi || analysis?.longTermAnalysis?.projections?.[0]?.noi || 0,
      format: 'currency' as const,
      status: (analysis?.keyMetrics?.noi || analysis?.longTermAnalysis?.projections?.[0]?.noi || 0) > 0 ? 'positive' as const : 'negative' as const,
      description: 'Annual NOI after operating expenses'
    },
    {
      label: 'Equity Multiple',
      value: analysis?.keyMetrics?.equityMultiple || 0.64,
      format: 'multiplier' as const,
      status: (analysis?.keyMetrics?.equityMultiple || 0) >= 2.0 ? 'positive' as const : (analysis?.keyMetrics?.equityMultiple || 0) >= 1.5 ? 'warning' as const : 'negative' as const,
      description: 'Total return multiple on investment'
    }
  ];

  // Advanced Analytics (20+ sophisticated metrics)
  const advancedMetrics = [
    {
      label: 'Break-Even Occupancy',
      value: analysis?.keyMetrics?.breakEvenOccupancy || 101.07,
      format: 'percent' as const,
      status: (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 85 ? 'positive' as const : (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 95 ? 'warning' as const : 'negative' as const,
      description: 'Minimum occupancy for profitability'
    },
    {
      label: '1% Rule Value',
      value: analysis?.keyMetrics?.onePercentRuleValue || (propertyData?.monthlyRent && propertyData?.purchasePrice ? (propertyData.monthlyRent / propertyData.purchasePrice) * 100 : 0.69),
      format: 'percent' as const,
      status: (analysis?.keyMetrics?.onePercentRuleValue || 0) >= 1.0 ? 'positive' as const : (analysis?.keyMetrics?.onePercentRuleValue || 0) >= 0.8 ? 'warning' as const : 'negative' as const,
      description: 'Monthly rent as % of purchase price'
    },
    {
      label: 'Gross Rent Multiplier',
      value: analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm || (propertyData?.purchasePrice && propertyData?.monthlyRent ? propertyData.purchasePrice / (propertyData.monthlyRent * 12) : 0),
      format: 'decimal' as const,
      status: 'neutral' as const,
      description: 'Price to annual rent ratio'
    },
    {
      label: 'Operating Expense Ratio',
      value: analysis?.keyMetrics?.operatingExpenseRatio || 
        (analysis?.longTermAnalysis?.projections?.[0]?.operatingExpenses && analysis?.longTermAnalysis?.projections?.[0]?.grossIncome ? 
        (analysis.longTermAnalysis.projections[0].operatingExpenses / analysis.longTermAnalysis.projections[0].grossIncome) * 100 : 0),
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Operating expenses as % of income'
    },
    {
      label: 'Price Per Bedroom',
      value: propertyData?.bedrooms ? (propertyData.purchasePrice || 0) / propertyData.bedrooms : 0,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Purchase price divided by bedrooms'
    },
    {
      label: 'Debt-to-Income Ratio',
      value: analysis?.keyMetrics?.debtToIncomeRatio || 
        (analysis?.longTermAnalysis?.projections?.[0]?.debtService && analysis?.longTermAnalysis?.projections?.[0]?.grossIncome ? 
        (analysis.longTermAnalysis.projections[0].debtService / analysis.longTermAnalysis.projections[0].grossIncome) * 100 : 0),
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Annual debt service vs income'
    },
    {
      label: 'Down Payment %',
      value: propertyData?.downPayment && propertyData?.purchasePrice ? 
        (propertyData.downPayment / propertyData.purchasePrice) * 100 : 20,
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Down payment as % of purchase price'
    },
    {
      label: 'Loan Amount',
      value: (propertyData?.purchasePrice || 0) - (propertyData?.downPayment || 0),
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Total financed amount'
    },
    {
      label: 'Monthly Mortgage',
      value: analysis?.monthlyAnalysis?.expenses?.debt || analysis?.monthlyAnalysis?.expenses?.mortgage?.total || 0,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Monthly principal and interest'
    },
    {
      label: 'Projected Sale Price',
      value: analysis?.longTermAnalysis?.exitAnalysis?.projectedSalePrice || 0,
      format: 'currency' as const,
      status: 'positive',
      description: 'Estimated value at year 10'
    },
    {
      label: 'Total Appreciation',
      value: analysis?.longTermAnalysis?.returns?.totalAppreciation || 0,
      format: 'currency' as const,
      status: 'positive',
      description: 'Property value increase over 10 years'
    },
    {
      label: 'Cumulative Cash Flow',
      value: analysis?.longTermAnalysis?.returns?.totalCashFlow || 0,
      format: 'currency' as const,
      status: (analysis?.longTermAnalysis?.returns?.totalCashFlow || 0) > 0 ? 'positive' as const : 'negative' as const,
      description: 'Total cash flow over 10 years'
    },
    // Additional metrics from documentation
    {
      label: 'Effective Gross Income',
      value: (analysis?.keyMetrics as any)?.effectiveGrossIncome || (analysis?.monthlyAnalysis?.income?.effective || 0) * 12,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Annual income after vacancy and credit loss'
    },
    {
      label: 'Annual Debt Service',
      value: analysis?.longTermAnalysis?.projections?.[0]?.debtService || 0,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Total yearly mortgage payments'
    },
    {
      label: 'Principal Paid Off',
      value: analysis?.longTermAnalysis?.projections?.[9]?.mortgageBalance ? 
        (propertyData?.purchasePrice - propertyData?.downPayment) - analysis.longTermAnalysis.projections[9].mortgageBalance : 0,
      format: 'currency' as const,
      status: 'positive',
      description: 'Mortgage principal reduction over 10 years'
    },
    {
      label: 'Return on Improvements',
      value: propertyData?.repairCosts ? 8 : 0, // Standard 8% return estimate
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'ROI on capital improvements'
    },
    {
      label: 'Turnover Cost Impact',
      value: analysis?.longTermAnalysis?.projections?.[0]?.turnoverCosts && analysis?.monthlyAnalysis?.income?.effective ?
        (analysis.longTermAnalysis.projections[0].turnoverCosts / (analysis.monthlyAnalysis.income.effective * 12)) * 100 : 0,
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Turnover costs as % of income'
    },
    {
      label: 'Loan-to-Value Ratio',
      value: propertyData?.downPayment && propertyData?.purchasePrice ? 
        ((propertyData.purchasePrice - propertyData.downPayment) / propertyData.purchasePrice) * 100 : 80,
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Loan amount as % of property value'
    },
    {
      label: 'Interest Rate',
      value: propertyData?.interestRate || 7.125,
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Annual mortgage interest rate'
    },
    {
      label: 'Rent-to-Price Ratio',
      value: propertyData?.monthlyRent && propertyData?.purchasePrice ? 
        (propertyData.monthlyRent / propertyData.purchasePrice) * 100 : 0.8,
      format: 'percent' as const,
      status: 'neutral' as const,
      description: 'Monthly rent as % of purchase price'
    }
  ];

  // Format values based on type
  const formatValue = (value: number, format: string, preserveCents: boolean = false) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return format === 'currency' ? '$0' : format === 'percent' ? '0%' : '0';
    }

    switch (format) {
      case 'currency':
        // For small per-unit values (< $100), preserve cents to show precision
        const shouldPreserveCents = preserveCents || value < 100;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: shouldPreserveCents ? 2 : 0,
          maximumFractionDigits: shouldPreserveCents ? 2 : 0
        }).format(value);
      case 'percent':
        // Backend returns percentages as numbers (e.g., 167.17 for 167.17%)
        // Display as-is since backend handles the percentage conversion
        return `${value.toFixed(2)}%`;
      case 'decimal':
        return value.toFixed(2);
      case 'multiplier':
        return `${value.toFixed(2)}x`;
      case 'score':
        return `${Math.round(value)}/100`;
      default:
        return value.toLocaleString();
    }
  };

  // ========================================
  // Phase 3A: Helper function moved earlier in file (line 169) to avoid hoisting issues
  // ========================================

  // Apple-style Metric Card
  const AppleMetricCard = ({ metric }: { metric: any }) => (
    <Card
      sx={{
        borderRadius: '16px',
        border: metric.highlight ? '2px solid' : '1px solid',
        borderColor: metric.highlight ? appleColors.primary[500] : appleColors.gray[200],
        backgroundColor: metric.highlight ? appleColors.primary[50] : 'background.paper',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%', // Ensure all cards in a row have same height
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
          borderColor: metric.highlight ? appleColors.primary[600] : appleColors.gray[300]
        }
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{ fontSize: '13px' }}
          >
            {metric.label}
          </Typography>

          {metric.description && (
            <Tooltip
              title={metric.description}
              arrow
              placement="top"
              enterTouchDelay={0}
              leaveTouchDelay={3000}
            >
              <IconButton
                size="small"
                sx={{
                  ml: 0.5,
                  p: 0.25,
                  color: appleColors.gray[400],
                  '&:hover': {
                    color: appleColors.blue[500],
                    backgroundColor: 'rgba(0, 122, 255, 0.08)'
                  }
                }}
              >
                <InfoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="h5"
          fontWeight={700}
          color={
            metric.status === 'positive' ? appleColors.green[600] :
            metric.status === 'negative' ? appleColors.red[600] :
            metric.status === 'warning' ? appleColors.orange[600] :
            'text.primary'
          }
          sx={{ mb: 0.5 }}
        >
          {formatValue(metric.value, metric.format)}
        </Typography>

        {metric.status === 'negative' && (
          <Typography variant="caption" color={appleColors.red[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5, fontSize: '11px' }}>
            Requires attention
          </Typography>
        )}
        {metric.status === 'warning' && (
          <Typography variant="caption" color={appleColors.orange[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5, fontSize: '11px' }}>
            Monitor closely
          </Typography>
        )}
        {metric.status === 'positive' && metric.highlight && (
          <Typography variant="caption" color={appleColors.green[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5, fontSize: '11px' }}>
            Excellent performance
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // ========================================
  // Phase 3C: Collapsible Metric Section Component
  // Apple Design System: Subtle animation, clear hierarchy
  // ========================================
  const CollapsibleMetricSection = ({
    title,
    description,
    metrics,
    isExpanded,
    onToggle
  }: {
    title: string;
    description: string;
    metrics: any[];
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <Box sx={{ mb: 3 }}>
      <Card
        sx={{
          borderRadius: '16px',
          border: `1px solid ${appleColors.gray[200]}`,
          backgroundColor: 'background.paper',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            borderColor: appleColors.blue[300],
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header Button */}
          <Button
            onClick={onToggle}
            fullWidth
            sx={{
              justifyContent: 'space-between',
              textAlign: 'left',
              p: 3,
              borderRadius: 0,
              backgroundColor: isExpanded ? appleColors.gray[50] : 'transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: appleColors.gray[100]
              }
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary' }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>

          {/* Collapsible Content - INSIDE the Card */}
          <Collapse in={isExpanded} timeout="auto">
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
              <Grid container spacing={2}>
                {metrics.map((metric, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                    <AppleMetricCard metric={metric} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );


  // Section Navigation
  const SectionNavigation = () => (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 2,
          // Show scrollbar on hover for better UX
          '&::-webkit-scrollbar': {
            height: '8px',
            display: 'block'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: appleColors.gray[100],
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: appleColors.gray[300],
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: appleColors.gray[400]
            }
          },
          // For Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: `${appleColors.gray[300]} ${appleColors.gray[100]}`
        }}
      >
        {analysisSections.map((section) => {
          const isImplemented = section.implemented !== false;
          const isDisabled = !isImplemented;

          return (
            <Button
              key={section.id}
              variant={selectedSection === section.id ? 'contained' : 'outlined'}
              startIcon={<section.icon />}
              onClick={() => isImplemented && setSelectedSection(section.id)}
              disabled={isDisabled}
              sx={{
                minWidth: 'fit-content',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                px: 3,
                py: 1.5,
                whiteSpace: 'nowrap',
                borderColor: appleColors.gray[300],
                flexShrink: 0, // Prevent button shrinking
                position: 'relative',
                ...(selectedSection === section.id && isImplemented && {
                  backgroundColor: appleColors.primary[500],
                  boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.4)',
                  transform: 'translateY(-1px)'
                }),
                ...(isDisabled && {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                })
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{section.label}</span>
                {!isImplemented && (
                  <Chip
                    label="Coming Soon"
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '10px',
                      fontWeight: 600,
                      backgroundColor: appleColors.orange[100],
                      color: appleColors.orange[700],
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                )}
              </Box>
            </Button>
          );
        })}
      </Box>
    </Box>
  );

  // Advanced Metrics Section
  const AdvancedMetricsSection = () => (
    <Card sx={{ borderRadius: '16px', mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Market Intelligence & Risk Assessment
          </Typography>
          <Button
            variant="text"
            endIcon={showAdvancedMetrics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            sx={{ textTransform: 'none' }}
          >
            {showAdvancedMetrics ? 'Show Less' : 'Show More'}
          </Button>
        </Box>

        <Collapse in={showAdvancedMetrics}>
          <Grid container spacing={3}>
            {/* Market Data Section */}
            {analysis?.marketData && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 3, backgroundColor: appleColors.blue[50], borderRadius: '12px', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.blue[700] }}>
                    Market Intelligence
                  </Typography>
                  
                  {analysis.marketData.property?.rentEstimate && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Market Rent Estimate</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatValue(analysis.marketData.property.rentEstimate, 'currency')}/month
                      </Typography>
                    </Box>
                  )}
                  
                  {analysis.marketData.property?.capRateEstimate && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Market Cap Rate</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatValue(analysis.marketData.property.capRateEstimate, 'percent')}
                      </Typography>
                    </Box>
                  )}
                  
                  {analysis.marketData.property?.marketPosition && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Market Position</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {analysis.marketData.property.marketPosition}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
            
            {/* Investment Timing */}
            {analysis?.investmentTiming && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 3, backgroundColor: appleColors.green[50], borderRadius: '12px', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.green[700] }}>
                    Investment Timing
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Recommendation</Typography>
                    <Chip 
                      label={analysis.investmentTiming.recommendation || 'Analyze'}
                      color={analysis.investmentTiming.recommendation === 'Buy' ? 'success' : 
                             analysis.investmentTiming.recommendation === 'Hold' ? 'warning' as const : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  
                  {analysis.investmentTiming.timingScore && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Timing Score</Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {analysis.investmentTiming.timingScore}/100
                      </Typography>
                    </Box>
                  )}
                  
                  {analysis.investmentTiming.marketCycle && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Market Cycle</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {analysis.investmentTiming.marketCycle}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
          
          {/* Detailed Metrics Table */}
          <TableContainer sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Advanced Metric</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>50% Rule Analysis</TableCell>
                  <TableCell align="right">
                    {analysis?.keyMetrics?.fiftyRuleAnalysis !== undefined ? 
                      (analysis.keyMetrics.fiftyRuleAnalysis ? 'Pass' : 'Review') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={analysis?.keyMetrics?.fiftyRuleAnalysis ? "Pass" : "Review"} 
                      color={analysis?.keyMetrics?.fiftyRuleAnalysis ? "success" : "warning"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>Operating expense efficiency test</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Loan-to-Value Ratio</TableCell>
                  <TableCell align="right">
                    {propertyData?.downPayment && propertyData?.purchasePrice ? 
                      formatValue(((propertyData.purchasePrice - propertyData.downPayment) / propertyData.purchasePrice) * 100, 'percent') : 
                      '80%'}
                  </TableCell>
                  <TableCell>
                    <Chip label="Standard" color="info" size="small" />
                  </TableCell>
                  <TableCell>Loan amount as % of property value</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell align="right">{formatValue(propertyData?.interestRate || 7.125, 'percent')}</TableCell>
                  <TableCell>
                    <Chip label="Current" color="info" size="small" />
                  </TableCell>
                  <TableCell>Annual mortgage interest rate</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Loan Term</TableCell>
                  <TableCell align="right">{propertyData?.loanTerm || 30} years</TableCell>
                  <TableCell>
                    <Chip label="Standard" color="info" size="small" />
                  </TableCell>
                  <TableCell>Mortgage duration</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );

  // Financial projections chart data - commented out as charts are not currently used
  // const projectionData = analysis?.longTermAnalysis?.projections?.map((year: any) => ({
  //   year: year.year,
  //   cashFlow: year.cashFlow || 0,
  //   propertyValue: year.propertyValue || 0,
  //   equity: year.equity || 0
  // })) || [];

  // Render section content
  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'overview':
        return (
          <Box>
            {/* Investment Decision Hero Card - BOTH PRO AND LEARNING MODES */}
            {(() => {
              // CRITICAL DEBUG: Check what AnalysisResults component is receiving
              console.log('🎯 ANALYSIS RESULTS DEBUG - Hero card check:', {
                hasAnalysis: !!analysis,
                hasInvestmentDecision: !!analysis?.investmentDecision,
                investmentDecisionKeys: analysis?.investmentDecision ? Object.keys(analysis.investmentDecision) : 'MISSING',
                dealQuality: analysis?.investmentDecision?.dealQuality || 'MISSING',
                verdict: analysis?.investmentDecision?.verdict || 'MISSING'
              });
              return null;
            })()}
            {analysis?.investmentDecision && (
              <InvestmentDecisionHero
                investmentDecision={analysis.investmentDecision}
                analysis={analysis}
                propertyData={propertyData}
              />
            )}


            {/* Portfolio Context removed - now shown in Investment Decision Hero tabs */}
            
            {/* Explicit Save to Portfolio Section - Only show if portfolio was selected for impact analysis */}
            {portfolioContext?.portfolioId && !dealId && (
              <Box sx={{ mb: 3 }}>
                <SimplePortfolioSelector
                  onPortfolioSelected={(portfolioId) => {
                    // TODO: Implement explicit save to portfolio functionality
                    console.log('User wants to save to portfolio:', portfolioId);
                  }}
                  selectedPortfolioId={portfolioContext.portfolioId}
                  disabled={false}
                />
              </Box>
            )}
            
            {/* UNIFIED EXPERIENCE: Same layout for all users (no Pro/Learning mode difference) */}

            {/* Tier 1: Key Investment Numbers - Always visible for everyone */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>
                Key Investment Numbers
              </Typography>
              <EducationalTooltip
                title="Investment Metrics"
                description="These are the most important numbers to understand if this property is a good investment. Green means good, yellow means okay, red means be careful."
                whyItMatters="These metrics tell you if you'll make money on this property and how much risk you're taking."
              />
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {heroMetrics.map((metric, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <AppleMetricCard metric={metric} />
                </Grid>
              ))}
            </Grid>

            {/* Tier 2 & 3 Collapsible Sections - SFR Only, shown to everyone */}
            {propertyType === 'SFR' && strategyResult.type === 'SFR' && (
              <>
                {/* Tier 2: Financial Performance (7 metrics) */}
                {strategyResult.tiers[1] && (
                  <CollapsibleMetricSection
                    title={strategyResult.tiers[1].title}
                    description={strategyResult.tiers[1].description}
                    metrics={strategyResult.tiers[1].metrics.map(buildMetricFromDefinition)}
                    isExpanded={showProfessionalMetrics}
                    onToggle={() => setShowProfessionalMetrics(!showProfessionalMetrics)}
                  />
                )}

                {/* Tier 3: Risk & Operational Analysis (8 metrics) */}
                {strategyResult.tiers[2] && (
                  <CollapsibleMetricSection
                    title={strategyResult.tiers[2].title}
                    description={strategyResult.tiers[2].description}
                    metrics={strategyResult.tiers[2].metrics.map(buildMetricFromDefinition)}
                    isExpanded={showAdvancedAnalytics}
                    onToggle={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                  />
                )}
              </>
            )}

            {/* Professional Investment Intelligence - Collapsible for all users */}
            <Box sx={{ mb: 3 }}>
              <Card
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${appleColors.gray[200]}`,
                  backgroundColor: 'background.paper',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: appleColors.blue[300],
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  {/* Header Button */}
                  <Button
                    onClick={() => setShowInvestmentIntelligence(!showInvestmentIntelligence)}
                    fullWidth
                    sx={{
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      p: 3,
                      borderRadius: 0,
                      backgroundColor: showInvestmentIntelligence ? appleColors.gray[50] : 'transparent',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: appleColors.gray[100]
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary' }}>
                        🧠 Professional Investment Intelligence
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered insights and professional analysis (4 sections)
                      </Typography>
                    </Box>
                    {showInvestmentIntelligence ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Button>

                  {/* Collapsible Content */}
                  <Collapse in={showInvestmentIntelligence} timeout="auto">
                    <Box sx={{ px: 3, pb: 3, pt: 1 }}>
                      <IntelligenceMultiplier aiInsights={analysis?.aiInsights} />
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Box>

            {/* REMOVED: Old "Additional Financial Details" and "Advanced Analytics Preview" sections */}
            {/* These are replaced by Tier 2 and Tier 3 collapsible sections above */}
          </Box>
        );

      case 'financial':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Financial Deep Dive
            </Typography>
            
            {/* Monthly Cash Flow Breakdown */}
            <Card sx={{ borderRadius: '16px', mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Monthly Cash Flow Analysis
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Gross Rental Income</TableCell>
                        <TableCell align="right">{formatValue(analysis?.monthlyAnalysis?.income?.gross || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vacancy Loss</TableCell>
                        <TableCell align="right">-{formatValue((analysis?.monthlyAnalysis?.income?.gross || 0) - (analysis?.monthlyAnalysis?.income?.effective || 0), 'currency')}</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: appleColors.gray[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>Effective Rental Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatValue(analysis?.monthlyAnalysis?.income?.effective || 0, 'currency')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mortgage Payment</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.debt || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Tax</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.breakdown?.propertyTax || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Insurance</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.breakdown?.insurance || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maintenance</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.breakdown?.maintenance || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Management</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.breakdown?.propertyManagement || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: appleColors.primary[50] }}>
                        <TableCell sx={{ fontWeight: 700 }}>Monthly Cash Flow</TableCell>
                        <TableCell align="right" sx={{ 
                          fontWeight: 700,
                          color: (analysis?.monthlyAnalysis?.cashFlow || analysis?.cashFlow?.monthlyCashFlow || 0) >= 0 ? 
                            appleColors.green[600] : appleColors.red[600]
                        }}>
                          {formatValue(analysis?.monthlyAnalysis?.cashFlow || analysis?.cashFlow?.monthlyCashFlow || 0, 'currency')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Story 4.6: MF-Specific Advanced Metrics Table (8 institutional-grade metrics) */}
            {propertyType === 'MF' && (
              <Card sx={{ borderRadius: '16px', mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Multi-Family Advanced Metrics
                  </Typography>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Metric</strong></TableCell>
                          <TableCell align="right"><strong>Value</strong></TableCell>
                          <TableCell><strong>Industry Benchmark</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* 1. Gross Rent Multiplier (GRM) */}
                        <TableRow>
                          <TableCell>Gross Rent Multiplier (GRM)</TableCell>
                          <TableCell align="right">
                            {(analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm)?.toFixed(2) || 'N/A'}
                          </TableCell>
                          <TableCell>4-7 (Residential MF)</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                ((analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm) || 0) >= 4 && ((analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm) || 0) <= 7
                                  ? "Good"
                                  : ((analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm) || 0) < 4
                                    ? "Below Range"
                                    : "Above Range"
                              }
                              color={
                                ((analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm) || 0) >= 4 && ((analysis?.keyMetrics?.grossRentMultiplier || (analysis?.keyMetrics as any)?.grm) || 0) <= 7
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 2. Debt Yield */}
                        <TableRow>
                          <TableCell>Debt Yield</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.debtYield
                              ? `${(analysis.keyMetrics.debtYield).toFixed(2)}%`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>10%+ (Lender Requirement)</TableCell>
                          <TableCell>
                            <Chip
                              label={(analysis?.keyMetrics?.debtYield || 0) >= 10 ? "Meets Requirement" : "Below Threshold"}
                              color={(analysis?.keyMetrics?.debtYield || 0) >= 10 ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 3. Break-Even Occupancy (BEO) */}
                        <TableRow>
                          <TableCell>Break-Even Occupancy</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.breakEvenOccupancy
                              ? `${(analysis.keyMetrics.breakEvenOccupancy).toFixed(1)}%`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>60-75% (Stable Properties)</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 75
                                  ? "Good"
                                  : (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 85
                                    ? "Moderate"
                                    : "High Risk"
                              }
                              color={
                                (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 75
                                  ? "success"
                                  : (analysis?.keyMetrics?.breakEvenOccupancy || 0) <= 85
                                    ? "warning"
                                    : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 4. Operating Expense Ratio (OER) */}
                        <TableRow>
                          <TableCell>Operating Expense Ratio</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.operatingExpenseRatio
                              ? `${(analysis.keyMetrics.operatingExpenseRatio).toFixed(1)}%`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>35-55% (Well-Managed)</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                (analysis?.keyMetrics?.operatingExpenseRatio || 0) <= 55
                                  ? "Efficient"
                                  : "Review Expenses"
                              }
                              color={(analysis?.keyMetrics?.operatingExpenseRatio || 0) <= 55 ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 5. Economic Vacancy Rate */}
                        <TableRow>
                          <TableCell>Economic Vacancy Rate</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.economicVacancyRate
                              ? `${(analysis.keyMetrics.economicVacancyRate).toFixed(1)}%`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>5-10% (Market Dependent)</TableCell>
                          <TableCell>
                            <Chip
                              label="Market Rate"
                              color="info"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 6. NOI Per Unit */}
                        <TableRow>
                          <TableCell>NOI Per Unit (Annual)</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.noiPerUnit
                              ? formatValue(analysis.keyMetrics.noiPerUnit, 'currency')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>Market Dependent</TableCell>
                          <TableCell>
                            <Chip
                              label={(analysis?.keyMetrics?.noiPerUnit || 0) > 0 ? "Positive" : "Negative"}
                              color={(analysis?.keyMetrics?.noiPerUnit || 0) > 0 ? "success" : "error"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 7. Cash Flow Per Unit */}
                        <TableRow>
                          <TableCell>Cash Flow Per Unit (Monthly)</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.cashFlowPerUnit
                              ? formatValue(analysis.keyMetrics.cashFlowPerUnit, 'currency')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>$200-500/unit</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                (analysis?.keyMetrics?.cashFlowPerUnit || 0) >= 200
                                  ? "Strong"
                                  : (analysis?.keyMetrics?.cashFlowPerUnit || 0) >= 0
                                    ? "Modest"
                                    : "Negative"
                              }
                              color={
                                (analysis?.keyMetrics?.cashFlowPerUnit || 0) >= 200
                                  ? "success"
                                  : (analysis?.keyMetrics?.cashFlowPerUnit || 0) >= 0
                                    ? "warning"
                                    : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>

                        {/* 8. Rent Per Square Foot */}
                        <TableRow>
                          <TableCell>Rent Per Square Foot</TableCell>
                          <TableCell align="right">
                            {analysis?.keyMetrics?.rentPerSqft
                              ? formatValue(analysis.keyMetrics.rentPerSqft, 'currency')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>Market Dependent</TableCell>
                          <TableCell>
                            <Chip
                              label="Market Rate"
                              color="info"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Alert severity="info" sx={{ mt: 3, borderRadius: '12px' }}>
                    <Typography variant="body2">
                      <strong>Industry Benchmarks:</strong> These metrics are validated against Fannie Mae, Freddie Mac,
                      and institutional investor standards. Values outside benchmarks warrant further investigation.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Comprehensive Metrics Grid */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              All Financial Metrics
            </Typography>
            
            <Grid container spacing={3}>
              {advancedMetrics.map((metric, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                  <AppleMetricCard metric={metric} />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'tax':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Tax Intelligence
            </Typography>

            {/* Educational Disclaimer Card */}
            <Card sx={{
              borderRadius: '16px',
              border: `2px solid ${appleColors.blue[100]}`,
              backgroundColor: appleColors.blue[50],
              mb: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{
                  display: 'flex',
                  gap: 2
                }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: appleColors.blue[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>🎓</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 600,
                      color: appleColors.blue[800],
                      mb: 1
                    }}>
                      Professional Tax Education
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: appleColors.gray[700],
                      lineHeight: 1.5,
                      mb: 2
                    }}>
                      This content provides <strong>professional-grade tax education</strong> using your specific property data for context. This is not tax advice or investment recommendations.
                    </Typography>
                    <Typography variant="body2" sx={{
                      color: appleColors.gray[700],
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}>
                      📋 <strong>Always consult with a qualified CPA or tax professional</strong> before making tax-related investment decisions.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Tax Education Content */}
            <TaxEducationSummary
              purchasePrice={propertyData?.purchasePrice}
              propertyData={propertyData}
            />
          </Box>
        );

      case 'projections':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Long-term Analysis
            </Typography>

            {/* Financial Projections Content */}
            <Card sx={{ borderRadius: '16px', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Year-by-Year Projections
                </Typography>
                {analysis?.longTermAnalysis?.projections && analysis.longTermAnalysis.projections.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Year</TableCell>
                          <TableCell align="right">Property Value</TableCell>
                          <TableCell align="right">Gross Rent</TableCell>
                          <TableCell align="right">Property Tax</TableCell>
                          <TableCell align="right">Insurance</TableCell>
                          <TableCell align="right">Maintenance</TableCell>
                          <TableCell align="right">Property Management</TableCell>
                          <TableCell align="right">Vacancy</TableCell>
                          <TableCell align="right">Turnover Costs</TableCell>
                          <TableCell align="right">Capital Improvements</TableCell>
                          <TableCell align="right">Total Expenses</TableCell>
                          <TableCell align="right">NOI</TableCell>
                          <TableCell align="right">Debt Service</TableCell>
                          <TableCell align="right">Cash Flow</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysis.longTermAnalysis.projections.map((projection: any, index: number) => {
                          // Calculate total operating expenses
                          const totalExpenses = (projection.propertyTax || 0) + 
                                               (projection.insurance || 0) + 
                                               (projection.maintenance || 0) + 
                                               (projection.propertyManagement || 0) + 
                                               (projection.vacancy || 0) + 
                                               (projection.turnoverCosts || 0) + 
                                               (projection.capitalImprovements || 0);
                          
                          return (
                            <TableRow key={index} sx={{ 
                              backgroundColor: index % 2 === 0 ? 'transparent' : appleColors.gray[50] 
                            }}>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {projection.year || (index + 1)}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.propertyValue || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.grossRent || projection.grossIncome || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.propertyTax || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.insurance || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.maintenance || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.propertyManagement || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.vacancy || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.turnoverCosts || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.capitalImprovements || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(totalExpenses, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.noi || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right">
                                {formatValue(projection.debtService || 0, 'currency')}
                              </TableCell>
                              <TableCell align="right" sx={{
                                color: (projection.cashFlow || 0) >= 0 ? appleColors.green[600] : appleColors.red[600],
                                fontWeight: 600
                              }}>
                                {formatValue(projection.cashFlow || 0, 'currency')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', backgroundColor: appleColors.gray[50], borderRadius: '12px' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Projection Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Long-term projections will appear here when analysis data is available.
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                      Raw analysis object: {JSON.stringify(analysis?.longTermAnalysis, null, 2).substring(0, 200)}...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Exit Analysis Table - Restored from commit 05be81c (Sept 28, 2025) */}
            {analysis?.longTermAnalysis?.exitAnalysis && (
              <Card sx={{ borderRadius: '16px', mt: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Exit Analysis (Year {analysis?.longTermAnalysis?.projectionYears || 10} Sale)
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {/* Projected Sale Price */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none', fontWeight: 600 }}>
                            Projected Sale Price (Year {analysis?.longTermAnalysis?.projectionYears || 10})
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: appleColors.green[600],
                            borderBottom: 'none'
                          }}>
                            {formatValue(analysis.longTermAnalysis.exitAnalysis.projectedSalePrice || 0, 'currency')}
                          </TableCell>
                        </TableRow>

                        {/* Selling Costs */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>Selling Costs (6%)</TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 600,
                            color: appleColors.red[600],
                            borderBottom: 'none'
                          }}>
                            -{formatValue(analysis.longTermAnalysis.exitAnalysis.sellingCosts || 0, 'currency')}
                          </TableCell>
                        </TableRow>

                        {/* Mortgage Payoff */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: '2px solid', borderColor: appleColors.gray[300] }}>
                            Mortgage Payoff
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 600,
                            color: appleColors.orange[600],
                            borderBottom: '2px solid',
                            borderColor: appleColors.gray[300]
                          }}>
                            -{formatValue(analysis.longTermAnalysis.exitAnalysis.mortgagePayoff || 0, 'currency')}
                          </TableCell>
                        </TableRow>

                        {/* Net Proceeds - Highlighted */}
                        <TableRow sx={{ backgroundColor: appleColors.blue[50] }}>
                          <TableCell sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            borderBottom: 'none'
                          }}>
                            Net Proceeds from Sale
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            color: appleColors.blue[600],
                            borderBottom: 'none'
                          }}>
                            {formatValue(analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 0, 'currency')}
                          </TableCell>
                        </TableRow>

                        {/* Spacer Row */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{ borderBottom: 'none', p: 1 }}></TableCell>
                        </TableRow>

                        {/* Investment Returns Breakdown Header */}
                        <TableRow>
                          <TableCell colSpan={2} sx={{
                            fontWeight: 600,
                            backgroundColor: appleColors.gray[50],
                            borderBottom: 'none'
                          }}>
                            Investment Returns Breakdown
                          </TableCell>
                        </TableRow>

                        {/* Total Cash Flow */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            Total Cash Flow ({analysis?.longTermAnalysis?.projectionYears || 10} Years)
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 600,
                            color: appleColors.green[600],
                            borderBottom: 'none'
                          }}>
                            {formatValue(
                              analysis.longTermAnalysis.projections?.reduce((sum: number, p: any) => sum + (p.cashFlow || 0), 0) || 0,
                              'currency'
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Total Appreciation */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>Total Appreciation</TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 600,
                            color: appleColors.green[600],
                            borderBottom: 'none'
                          }}>
                            {formatValue(
                              (analysis.longTermAnalysis.exitAnalysis.projectedSalePrice || 0) - (propertyData?.purchasePrice || 0),
                              'currency'
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Initial Investment */}
                        <TableRow>
                          <TableCell sx={{ borderBottom: '2px solid', borderColor: appleColors.gray[300] }}>
                            Less: Initial Investment
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 600,
                            color: appleColors.red[600],
                            borderBottom: '2px solid',
                            borderColor: appleColors.gray[300]
                          }}>
                            -{formatValue(
                              (propertyData?.downPayment || 0) +
                              (propertyData?.closingCosts || 0) +
                              (propertyData?.capitalInvestments || 0),
                              'currency'
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Total Return - Highlighted */}
                        <TableRow sx={{ backgroundColor: appleColors.green[50] }}>
                          <TableCell sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            borderBottom: 'none'
                          }}>
                            Total Return
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            color: appleColors.green[600],
                            borderBottom: 'none'
                          }}>
                            {formatValue(
                              (analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 0) +
                              (analysis.longTermAnalysis.projections?.reduce((sum: number, p: any) => sum + (p.cashFlow || 0), 0) || 0) -
                              ((propertyData?.downPayment || 0) + (propertyData?.closingCosts || 0) + (propertyData?.capitalInvestments || 0)),
                              'currency'
                            )}
                          </TableCell>
                        </TableRow>

                        {/* ROI Percentage */}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Return on Investment (ROI)
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            color: (analysis.longTermAnalysis.exitAnalysis.returnOnInvestment || 0) >= 100
                              ? appleColors.green[600]
                              : appleColors.orange[600]
                          }}>
                            {formatValue(analysis.longTermAnalysis.exitAnalysis.returnOnInvestment || 0, 'percent')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Educational Note */}
                  <Box sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: appleColors.blue[50],
                    borderRadius: '8px',
                    borderLeft: `4px solid ${appleColors.blue[500]}`
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      💡 <strong>What This Means:</strong> If you sell this property after {analysis?.longTermAnalysis?.projectionYears || 10} years,
                      you'll receive <strong>{formatValue(analysis.longTermAnalysis.exitAnalysis.netProceedsFromSale || 0, 'currency')}</strong> from
                      the sale. Combined with your cumulative cash flow, your total return would be{' '}
                      <strong>
                        {formatValue(analysis.longTermAnalysis.exitAnalysis.returnOnInvestment || 0, 'percent')}
                      </strong> on your initial investment.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 'risk':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Risk Assessment & Market Intelligence
            </Typography>
            
            {/* Risk Metrics Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: '16px', border: `2px solid ${appleColors.red[200]}` }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <ShieldIcon sx={{ fontSize: 40, color: appleColors.red[500], mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      Overall Risk Level
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={appleColors.red[600]}>
                      {(analysis?.keyMetrics?.dscr || 0) >= 1.25 ? 'Low' : 
                       (analysis?.keyMetrics?.dscr || 0) >= 1.0 ? 'Medium' : 'High'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Based on DSCR and cash flow analysis
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: '16px', border: `2px solid ${appleColors.orange[200]}` }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <SecurityIcon sx={{ fontSize: 40, color: appleColors.orange[500], mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      Cash Flow Risk
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={appleColors.orange[600]}>
                      {(analysis?.monthlyAnalysis?.cashFlow || 0) >= 500 ? 'Low' : 
                       (analysis?.monthlyAnalysis?.cashFlow || 0) >= 0 ? 'Medium' : 'High'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly cash flow sustainability
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: '16px', border: `2px solid ${appleColors.blue[200]}` }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: appleColors.blue[500], mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      Market Risk
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={appleColors.blue[600]}>
                      {(analysis?.investmentTiming?.confidence || 0) >= 70 ? 'Low' : 
                       (analysis?.investmentTiming?.confidence || 0) >= 50 ? 'Medium' : 'High'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Market timing and conditions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* AI Risk Assessment */}
            {analysis?.aiInsights?.riskAssessment && (
              <Card sx={{ borderRadius: '16px', mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    AI Risk Analysis
                  </Typography>
                  <Typography variant="body1">
                    {analysis.aiInsights.riskAssessment}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Market Insights */}
            {analysis?.marketInsights?.length > 0 && (
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Market Insights
                  </Typography>
                  <Grid container spacing={2}>
                    {analysis.marketInsights.slice(0, 6).map((insight: any, index: number) => (
                      <Grid size={{ xs: 12, md: 6 }} key={index}>
                        <Box sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            {insight.category}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {insight.insight}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Impact: {insight.impact}
                            </Typography>
                            <Chip 
                              label={`${insight.confidence}% confidence`}
                              size="small"
                              color={insight.confidence >= 80 ? 'success' : insight.confidence >= 60 ? 'warning' as const : 'default'}
                            />
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 'market':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Market Intelligence
            </Typography>
            
            {/* Market Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {analysis?.marketData?.economicIndicators && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: '16px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                        Economic Indicators
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Current Mortgage Rate</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatValue(analysis.marketData.economicIndicators.currentMortgageRate || 7.125, 'percent')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">Inflation Rate</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatValue(analysis.marketData.economicIndicators.inflationRate || 3.2, 'percent')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {analysis?.marketData?.marketTrends && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ borderRadius: '16px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                        Local Market Trends
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Median Rent</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatValue(analysis.marketData.marketTrends.medianRent || 2200, 'currency')}/month
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Rent Growth Rate</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatValue(analysis.marketData.marketTrends.rentGrowthRate || 4.5, 'percent')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">Median Sale Price</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {formatValue(analysis.marketData.marketTrends.medianSalePrice || 425000, 'currency')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
            
            {/* Comparable Properties */}
            {analysis?.marketData?.comparables?.length > 0 && (
              <Card sx={{ borderRadius: '16px', mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Comparable Properties
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Address</TableCell>
                          <TableCell align="right">Sale Price</TableCell>
                          <TableCell align="right">Price/SqFt</TableCell>
                          <TableCell align="right">Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysis.marketData.comparables.slice(0, 5).map((comp: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{comp.address || `Property ${index + 1}`}</TableCell>
                            <TableCell align="right">{formatValue(comp.salePrice || 0, 'currency')}</TableCell>
                            <TableCell align="right">{formatValue(comp.pricePerSqft || 0, 'currency')}</TableCell>
                            <TableCell align="right">{comp.date || 'Recent'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
            
            {/* Market Position */}
            {analysis?.marketData?.property && (
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Property Market Position
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.blue[50], borderRadius: '8px' }}>
                        <Typography variant="h4" fontWeight={700} color={appleColors.blue[600]} sx={{ mb: 1 }}>
                          {analysis.marketData.property.confidence || 85}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Market Data Confidence
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.green[50], borderRadius: '8px' }}>
                        <Typography variant="h6" fontWeight={600} color={appleColors.green[600]} sx={{ mb: 1 }}>
                          {analysis.marketData.property.marketPosition || 'Competitive'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Relative to Market
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.purple[50], borderRadius: '8px' }}>
                        <Typography variant="h6" fontWeight={600} color={appleColors.purple[600]} sx={{ mb: 1 }}>
                          {formatValue(analysis.marketData.property.rentEstimate || 0, 'currency')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Market Rent Estimate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 'comparables':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Comparable Properties Analysis
            </Typography>
            
            {/* Property Comparison Summary */}
            <Card sx={{ borderRadius: '16px', mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Your Property vs Market
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.primary[50], borderRadius: '8px' }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {formatValue(propertyData?.purchasePrice || 0, 'currency')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Your Purchase Price
                      </Typography>
                      <Typography variant="caption" color={appleColors.primary[600]} fontWeight={500}>
                        Target Property
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {formatValue(analysis?.marketData?.marketTrends?.medianSalePrice || 425000, 'currency')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Market Median
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Local Market
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.green[50], borderRadius: '8px' }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {formatValue(propertyData?.monthlyRent || 0, 'currency')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Your Rent
                      </Typography>
                      <Typography variant="caption" color={appleColors.green[600]} fontWeight={500}>
                        Monthly
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box textAlign="center" sx={{ p: 2, backgroundColor: appleColors.gray[50], borderRadius: '8px' }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                        {formatValue(analysis?.marketData?.marketTrends?.medianRent || 2200, 'currency')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Market Rent
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Monthly Median
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Detailed Comparables Table */}
            {analysis?.marketData?.comparables?.length > 0 ? (
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Recent Comparable Sales
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell align="right">Sale Price</TableCell>
                          <TableCell align="right">Price/SqFt</TableCell>
                          <TableCell align="right">Size</TableCell>
                          <TableCell align="right">Bed/Bath</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analysis.marketData.comparables.map((comp: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {comp.address || `Property ${index + 1}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {comp.distance || '0.5'} miles away
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {formatValue(comp.salePrice || 0, 'currency')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {formatValue(comp.pricePerSqft || 0, 'currency')}
                            </TableCell>
                            <TableCell align="right">
                              {comp.squareFootage || 'N/A'} sqft
                            </TableCell>
                            <TableCell align="right">
                              {comp.bedrooms || 'N/A'}/{comp.bathrooms || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {comp.date || 'Recent'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label="Sold" 
                                color="success" 
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 48, color: appleColors.gray[400], mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Comparable Data Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comparable property data will appear here when available from market sources.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        );
        
      case 'interactive':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Interactive Analysis
            </Typography>
            {onParameterChange && (
              <DynamicSliders
                propertyData={propertyData}
                analysis={analysis}
                onParameterChange={onParameterChange}
              />
            )}
          </Box>
        );

      case 'optimizer':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Deal Optimizer
            </Typography>
            {onApplyFix && (
              <DealFixer
                analysis={analysis}
                propertyData={propertyData}
                onApplyFix={onApplyFix}
              />
            )}
          </Box>
        );

      case 'scenarios':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Scenario Manager
            </Typography>
            {onLoadScenario && dealId && (
              <ScenarioManager
                currentPropertyData={propertyData}
                currentAnalysis={analysis}
                dealId={dealId}
                onLoadScenario={onLoadScenario}
              />
            )}
          </Box>
        );

      case 'stress':
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Stress Testing Dashboard
            </Typography>
            <StressTestingDashboard
              analysis={analysis}
              propertyData={propertyData}
            />
          </Box>
        );

      // Story 4.4: Render Unit Mix Tab (MF-specific)
      case 'unitMix':
        // Story 4.2: Unit Mix Analysis Tab (COMPLETE)
        // Validate we have the required data for MF property
        if (propertyType !== 'MF' || !propertyData?.unitTypes || propertyData.unitTypes.length === 0) {
          return (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Unit Mix Analysis is only available for Multi-Family properties with unit type configuration.
                </Typography>
              </Alert>
            </Box>
          );
        }

        return (
          <UnitMixAnalysisTab
            // From propertyData
            unitTypes={propertyData.unitTypes}
            totalUnits={propertyData.totalUnits}
            totalSqft={propertyData.totalSqft}
            // From analysis.keyMetrics (MultiFamilyMetrics)
            unitMixEfficiency={analysis?.keyMetrics?.unitMixEfficiency || 0}
            noiPerUnit={analysis?.keyMetrics?.noiPerUnit || 0}
            cashFlowPerUnit={analysis?.keyMetrics?.cashFlowPerUnit || 0}
            operatingExpensePerUnit={analysis?.keyMetrics?.operatingExpensePerUnit || 0}
            averageRentPerUnit={analysis?.keyMetrics?.averageRentPerUnit || 0}
            // From analysis.longTermAnalysis.projections[0]
            year1GrossIncome={analysis?.longTermAnalysis?.projections?.[0]?.grossIncome || 0}
            year1OperatingExpenses={analysis?.longTermAnalysis?.projections?.[0]?.operatingExpenses || 0}
            year1NOI={analysis?.longTermAnalysis?.projections?.[0]?.noi || 0}
            year1CashFlow={analysis?.longTermAnalysis?.projections?.[0]?.cashFlow || 0}
            // Issue #5: Per-unit-type metrics for profitability comparison
            perUnitTypeMetrics={analysis?.keyMetrics?.perUnitTypeMetrics || []}
          />
        );

      default:
        return (
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              {analysisSections.find(s => s.id === selectedSection)?.label}
            </Typography>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Content for {selectedSection} section will be implemented here.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This section is part of the enhanced Apple-style analysis interface.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Navigation */}
      <SectionNavigation />

      {/* Content */}
      <Box sx={{
        width: '100%'
      }}>
        {renderSectionContent()}
      </Box>

      {/* Beta Feedback Widget */}
      <FeedbackWidget
        dealId={dealId}
        propertyAddress={propertyData?.address}
        autoShowDelay={15000}
      />

      {/* Email Verification Banner (Option A: Gentle Reminder) */}
      {user && (
        <EmailVerificationBanner
          userEmail={user.email}
          isVerified={user.isVerified || false}
          onResendVerification={async () => {
            // TODO: Call resend verification email API
            console.log('Resend verification email');
          }}
          onDismiss={() => {
            console.log('Email verification banner dismissed');
          }}
        />
      )}
    </Box>
  );
};

export default AnalysisResults;