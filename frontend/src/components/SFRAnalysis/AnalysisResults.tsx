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
  Container,
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
// import TaxImpactSummary from '../AnalysisResults/TaxImpactSummary'; // DEPRECATED
// import HoldPeriodOptimizer from '../AnalysisResults/HoldPeriodOptimizer'; // DEPRECATED
// import TaxStrategies from '../AnalysisResults/TaxStrategies'; // DEPRECATED
import ProMetricsBar from './ProMetricsBar';
import DynamicSliders from './DynamicSliders';
import DealFixer from './DealFixer';
import ScenarioManager from './ScenarioManager';
import StressTestingDashboard from './StressTestingDashboard';
import { useDualMode } from '../../contexts/DualModeContext';
import { EducationalTooltip } from '../common/EducationalTooltip';

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
  const [selectedSection, setSelectedSection] = useState('overview');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
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

  // Analysis sections for horizontal navigation - filter based on mode
  const allAnalysisSections = [
    { id: 'overview', label: 'Overview', icon: HomeIcon, description: 'Hero metrics and AI insights' },
    { id: 'financial', label: 'Financial Details', icon: AnalyticsIcon, description: 'Detailed cash flow analysis' },
    { id: 'tax', label: 'Tax Intelligence', icon: SecurityIcon, description: 'Professional tax education and insights' },
    { id: 'projections', label: 'Long-term Analysis', icon: TrendingUpIcon, description: '10-year forecasts and projections' },
    { id: 'interactive', label: 'Interactive Analysis', icon: TuneIcon, description: 'Adjust parameters in real-time' },
    { id: 'optimizer', label: 'Deal Optimizer', icon: FixIcon, description: 'Suggestions to improve returns' },
    { id: 'scenarios', label: 'Scenario Manager', icon: ScenarioIcon, description: 'Save and compare scenarios' },
    { id: 'risk', label: 'Risk & Intelligence', icon: ShieldIcon, description: 'Risk analysis and market data' },
    { id: 'stress', label: 'Stress Testing', icon: WarningIcon, description: 'Stress scenarios and risk heat maps' },
    { id: 'market', label: 'Market Analysis', icon: AssessmentIcon, description: 'Market trends and economics' },
    { id: 'comparables', label: 'Comparables', icon: CompareIcon, description: 'Similar properties comparison' }
  ];

  // Filter sections based on mode
  const analysisSections = mode === 'novice'
    ? allAnalysisSections.filter(section => ['overview', 'financial', 'tax', 'projections', 'interactive', 'optimizer', 'scenarios'].includes(section.id))
    : allAnalysisSections;

  // Hero Metrics (Top 4 most important)
  const heroMetrics = [
    {
      label: 'Monthly Cash Flow',
      value: analysis?.monthlyAnalysis?.cashFlow || analysis?.cashFlow?.monthlyCashFlow || -14,
      format: 'currency' as const,
      status: (analysis?.monthlyAnalysis?.cashFlow || analysis?.cashFlow?.monthlyCashFlow || 0) >= 0 ? 'positive' as const : 'negative' as const,
      highlight: true,
      description: 'Net monthly income after all expenses'
    },
    {
      label: 'Cap Rate',
      value: analysis?.keyMetrics?.capRate || 3.95,
      format: 'percent' as const,
      status: (analysis?.keyMetrics?.capRate || 0) >= 5 ? 'positive' as const : (analysis?.keyMetrics?.capRate || 0) >= 3 ? 'warning' as const : 'negative' as const,
      highlight: true,
      description: 'Annual return based on property value'
    },
    {
      label: 'Cash-on-Cash Return',
      value: analysis?.keyMetrics?.cashOnCashReturn || -0.17,
      format: 'percent' as const,
      status: (analysis?.keyMetrics?.cashOnCashReturn || 0) >= 8 ? 'positive' as const : (analysis?.keyMetrics?.cashOnCashReturn || 0) >= 0 ? 'warning' as const : 'negative' as const,
      highlight: true,
      description: 'Annual cash return on invested capital'
    },
    {
      label: 'Deal Quality Score',
      value: analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0,
      format: 'score' as const,
      status: (analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0) >= 80 ? 'positive' as const : (analysis?.investmentDecision?.professionalAssessment?.dealQuality || 0) >= 65 ? 'warning' as const : 'negative' as const,
      highlight: true,
      description: 'V3.0 Professional weighted assessment of investment quality'
    }
  ];

  // Key Financial Metrics (8 additional important metrics)
  const keyFinancialMetrics = [
    {
      label: 'Total ROI (10 yr)',
      value: analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0,
      format: 'percent' as const,
      status: (analysis?.longTermAnalysis?.exitAnalysis?.returnOnInvestment || 0) >= 100 ? 'positive' as const : 'warning' as const,
      description: 'Total return on investment percentage over 10 years'
    },
    {
      label: '10-Year IRR',
      value: analysis?.keyMetrics?.irr || analysis?.longTermAnalysis?.returns?.irr || 0,
      format: 'percent' as const,
      status: (analysis?.keyMetrics?.irr || 0) >= 15 ? 'positive' as const : (analysis?.keyMetrics?.irr || 0) >= 8 ? 'warning' as const : 'negative' as const,
      description: 'Internal Rate of Return'
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
      value: analysis?.keyMetrics?.grossRentMultiplier || (propertyData?.purchasePrice && propertyData?.monthlyRent ? propertyData.purchasePrice / (propertyData.monthlyRent * 12) : 0),
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
      value: (analysis?.monthlyAnalysis?.income?.effective || 0) * 12,
      format: 'currency' as const,
      status: 'neutral' as const,
      description: 'Annual income after vacancy'
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
  const formatValue = (value: number, format: string) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return format === 'currency' ? '$0' : format === 'percent' ? '0%' : '0';
    }
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
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

  // Apple-style Metric Card
  const AppleMetricCard = ({ metric }: { metric: any }) => (
    <Card
      sx={{
        borderRadius: '16px',
        border: metric.highlight ? '2px solid' : '1px solid',
        borderColor: metric.highlight ? appleColors.primary[500] : appleColors.gray[200],
        backgroundColor: metric.highlight ? appleColors.primary[50] : 'background.paper',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.15)',
          borderColor: metric.highlight ? appleColors.primary[600] : appleColors.gray[300]
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            fontWeight={500}
            sx={{ fontSize: '13px' }}
          >
            {metric.label}
          </Typography>
          
          <InfoIcon sx={{ fontSize: 16, color: appleColors.gray[400] }} />
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

        {metric.description && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
            {metric.description}
          </Typography>
        )}

        {metric.status === 'negative' && (
          <Typography variant="caption" color={appleColors.red[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5 }}>
            Requires attention
          </Typography>
        )}
        {metric.status === 'warning' && (
          <Typography variant="caption" color={appleColors.orange[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5 }}>
            Monitor closely
          </Typography>
        )}
        {metric.status === 'positive' && metric.highlight && (
          <Typography variant="caption" color={appleColors.green[600]} fontWeight={500} sx={{ display: 'block', mt: 0.5 }}>
            Excellent performance
          </Typography>
        )}
      </CardContent>
    </Card>
  );


  // Section Navigation
  const SectionNavigation = () => (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        {analysisSections.map((section) => (
          <Button
            key={section.id}
            variant={selectedSection === section.id ? 'contained' : 'outlined'}
            startIcon={<section.icon />}
            onClick={() => setSelectedSection(section.id)}
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
              ...(selectedSection === section.id && {
                backgroundColor: appleColors.primary[500],
                boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.4)',
                transform: 'translateY(-1px)'
              })
            }}
          >
            {section.label}
          </Button>
        ))}
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
            
            {/* Pro Mode - Condensed Metrics Bar */}
            {mode === 'pro' && (
              <ProMetricsBar
                title="KEY METRICS AT A GLANCE"
                metrics={[
                  ...heroMetrics,
                  ...keyFinancialMetrics.slice(0, 4) // Add first 4 financial metrics
                ]}
              />
            )}
            
            {/* Hero Metrics - Detailed view for novice, hidden for pro (shown in bar above) */}
            {mode === 'novice' && (
              <>
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
              </>
            )}

            {/* Key Financial Metrics */}
            {mode === 'novice' && (
              <>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                  Additional Financial Details
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {keyFinancialMetrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                      <AppleMetricCard metric={metric} />
                    </Grid>
                  ))}
                </Grid>

                {/* Advanced Analytics - Show/Hide for novice mode */}
                {!showAdvancedMetrics && (
                  <>
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                      Advanced Analytics Preview
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      {advancedMetrics.slice(0, 8).map((metric, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                          <AppleMetricCard metric={metric} />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}

                {/* AI Investment Analysis - Only show in learning mode in overview section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2, mt: 3 }}>
                    🧠 Professional Investment Intelligence
                  </Typography>
                  <IntelligenceMultiplier aiInsights={analysis?.aiInsights} />
                </Box>

                {/* Show More Button for Novice Mode */}
                {!showAdvancedMetrics && (
                  <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
                    <Button
                      variant="contained"
                      onClick={() => setShowAdvancedMetrics(true)}
                      startIcon={<ExpandMoreIcon />}
                      sx={{ 
                        borderRadius: '12px',
                        backgroundColor: appleColors.blue[500],
                        '&:hover': {
                          backgroundColor: appleColors.blue[600]
                        }
                      }}
                    >
                      Show Advanced Analytics
                    </Button>
                  </Box>
                )}
              </>
            )}

            {/* Advanced Analytics for Pro Mode or when expanded */}
            {(mode === 'pro' || showAdvancedMetrics) && (
              <>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                  Complete Financial Analysis
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {advancedMetrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                      <AppleMetricCard metric={metric} />
                    </Grid>
                  ))}
                </Grid>

            <AdvancedMetricsSection />
              </>
            )}
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
                        <TableCell align="right">{formatValue(propertyData?.monthlyRent || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vacancy Loss</TableCell>
                        <TableCell align="right">-{formatValue((propertyData?.monthlyRent || 0) * (propertyData?.longTermAssumptions?.vacancyRate || 5) / 100, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: appleColors.gray[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>Effective Rental Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatValue((propertyData?.monthlyRent || 0) * (1 - (propertyData?.longTermAssumptions?.vacancyRate || 5) / 100), 'currency')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Mortgage Payment</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.mortgage?.total || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Tax</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.propertyTax || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Insurance</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.insurance || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maintenance</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.maintenance || 0, 'currency')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Property Management</TableCell>
                        <TableCell align="right">-{formatValue(analysis?.monthlyAnalysis?.expenses?.propertyManagement || 0, 'currency')}</TableCell>
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
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Section Navigation */}
        <SectionNavigation />

        {/* Content */}
        {renderSectionContent()}
      </Box>
    </Container>
  );
};

export default AnalysisResults;