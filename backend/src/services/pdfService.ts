/**
 * PDF Generation Service
 *
 * Purpose: Generate professional property analysis PDFs using React-PDF
 * Performance: Target P95 < 1000ms, typical 100-500ms
 * Memory: ~2MB per generation (safe for Render free tier)
 *
 * Created: 2026-03-01
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import crypto from 'crypto';
import {
  PdfFormData,
  PdfStrategy,
  PdfGenerationResult,
  PDF_CONSTANTS,
} from '../types/pdf.types';
import { AnalysisResult, SFRMetrics } from '../types/analysis';
import { logger } from '../utils/logger';

// ============================================================
// PDF Stylesheet (Material-UI inspired)
// ============================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },

  // Header Section
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #2196F3',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },

  // Deal Quality Score Section
  scoreSection: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',  // Green for good deals
    borderRadius: 4,
  },
  scoreSectionWarning: {
    backgroundColor: '#FFF3E0',  // Orange for moderate deals
  },
  scoreSectionDanger: {
    backgroundColor: '#FFEBEE',  // Red for poor deals
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreValueWarning: {
    color: '#FF9800',
  },
  scoreValueDanger: {
    color: '#F44336',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 5,
  },
  scoreLabelWarning: {
    color: '#E65100',
  },
  scoreLabelDanger: {
    color: '#C62828',
  },

  // Content Sections
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    borderBottom: '1pt solid #CCCCCC',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333333',
  },

  // Metrics Grid
  metricsGrid: {
    marginTop: 10,
  },
  metricItem: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTop: '1pt solid #CCCCCC',
    paddingTop: 10,
  },

  // Disclaimer
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.4,
  },
});

// ============================================================
// Helper Functions
// ============================================================

/**
 * Format currency values
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values
 */
function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get score styling based on Deal Quality Score
 */
function getScoreStyles(score: number) {
  if (score >= 80) {
    return {
      section: styles.scoreSection,
      value: styles.scoreValue,
      label: styles.scoreLabel,
    };
  } else if (score >= 65) {
    return {
      section: [styles.scoreSection, styles.scoreSectionWarning],
      value: [styles.scoreValue, styles.scoreValueWarning],
      label: [styles.scoreLabel, styles.scoreLabelWarning],
    };
  } else {
    return {
      section: [styles.scoreSection, styles.scoreSectionDanger],
      value: [styles.scoreValue, styles.scoreValueDanger],
      label: [styles.scoreLabel, styles.scoreLabelDanger],
    };
  }
}

/**
 * Get score label text
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return 'Above professional standards';
  if (score >= 65) return 'Meets professional standards';
  if (score >= 50) return 'Requires optimization';
  return 'Below professional standards';
}

// ============================================================
// React-PDF Components
// ============================================================

/**
 * Main PDF Document Component
 */
function AnalysisPdfDocument({
  analysis,
  formData,
  strategy
}: {
  analysis: AnalysisResult<SFRMetrics>;
  formData: PdfFormData;
  strategy: PdfStrategy;
}) {
  const dealQualityScore = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
  const scoreStyles = getScoreStyles(dealQualityScore);
  const scoreLabel = getScoreLabel(dealQualityScore);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'REanalyzr Property Analysis'),
        // Property address - only show if provided
        formData.propertyAddress && React.createElement(
          Text,
          { style: { ...styles.subtitle, color: '#424242', marginBottom: 8 } },
          `📍 ${formData.propertyAddress}`
        ),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `Strategy: ${strategy === 'brrrr' ? 'BRRRR' : 'Buy & Hold'} | Generated: ${new Date().toLocaleDateString()}`
        )
      ),

      // Deal Quality Score
      React.createElement(
        View,
        { style: scoreStyles.section },
        React.createElement(Text, { style: styles.scoreTitle }, 'Investment Decision Score'),
        React.createElement(Text, { style: scoreStyles.value }, `${dealQualityScore}/100`),
        React.createElement(Text, { style: scoreStyles.label }, scoreLabel)
      ),

      // Property Details Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Property Details'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Purchase Price'),
          React.createElement(Text, { style: styles.value }, formatCurrency(formData.purchasePrice))
        ),
        // Square Feet - only show if provided
        formData.squareFeet && React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Square Feet'),
          React.createElement(Text, { style: styles.value }, `${formData.squareFeet.toLocaleString()} sq ft`)
        ),
        // Price per Sq Ft - only show if square feet is provided
        formData.squareFeet && analysis.keyMetrics?.pricePerSqFt && React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Price per Sq Ft'),
          React.createElement(Text, { style: styles.value }, formatCurrency(analysis.keyMetrics.pricePerSqFt))
        )
      ),

      // Financing Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Financing'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Down Payment'),
          React.createElement(
            Text,
            { style: styles.value },
            `${formatCurrency(formData.downPayment)} (${((formData.downPayment / formData.purchasePrice) * 100).toFixed(0)}%)`
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Loan Amount'),
          React.createElement(Text, { style: styles.value }, formatCurrency(formData.purchasePrice - formData.downPayment))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Mortgage Payment'),
          React.createElement(Text, { style: styles.value }, analysis.monthlyAnalysis?.expenses?.debt ? formatCurrency(analysis.monthlyAnalysis.expenses.debt) : 'N/A')
        )
      ),

      // Rental Income Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Rental Income'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Rent'),
          React.createElement(Text, { style: styles.value }, formatCurrency(formData.monthlyRent))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Effective Monthly Income'),
          React.createElement(Text, { style: styles.value }, analysis.monthlyAnalysis?.income?.effective !== undefined ? formatCurrency(analysis.monthlyAnalysis.income.effective) : 'N/A')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Expenses'),
          React.createElement(Text, { style: styles.value }, analysis.monthlyAnalysis?.expenses?.total !== undefined ? formatCurrency(analysis.monthlyAnalysis.expenses.total) : 'N/A')
        )
      ),

      // Cash Flow Section (BRRRR shows post-refinance, Buy & Hold shows regular)
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, strategy === 'brrrr' ? 'Cash Flow Analysis (Post-Refinance)' : 'Cash Flow Analysis'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Monthly Net Cash Flow'),
          React.createElement(Text, { style: styles.value },
            strategy === 'brrrr' && (analysis as any).strategySpecific?.postRefinanceMetrics?.monthlyCashFlow !== undefined
              ? formatCurrency((analysis as any).strategySpecific.postRefinanceMetrics.monthlyCashFlow)
              : analysis.monthlyAnalysis?.cashFlow !== undefined
                ? formatCurrency(analysis.monthlyAnalysis.cashFlow)
                : 'N/A'
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Annual Net Cash Flow'),
          React.createElement(Text, { style: styles.value },
            strategy === 'brrrr' && (analysis as any).strategySpecific?.postRefinanceMetrics?.annualCashFlow !== undefined
              ? formatCurrency((analysis as any).strategySpecific.postRefinanceMetrics.annualCashFlow)
              : analysis.annualAnalysis?.cashFlow !== undefined
                ? formatCurrency(analysis.annualAnalysis.cashFlow)
                : 'N/A'
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Net Operating Income (NOI)'),
          React.createElement(Text, { style: styles.value }, analysis.annualAnalysis?.noi !== undefined ? formatCurrency(analysis.annualAnalysis.noi) : 'N/A')
        )
      ),

      // BRRRR Capital Recovery Section (only for BRRRR strategy)
      ...(strategy === 'brrrr' && (analysis as any).strategySpecific?.capitalRecovery ? [
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'BRRRR Capital Recovery'),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Amount Recovered'),
            React.createElement(Text, { style: styles.value }, formatCurrency((analysis as any).strategySpecific.capitalRecovery.capitalRecovered || 0))
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Recovery Rate'),
            React.createElement(Text, { style: styles.value }, `${((analysis as any).strategySpecific.capitalRecovery.capitalRecoveryRate || 0).toFixed(1)}%`)
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Capital Remaining'),
            React.createElement(Text, { style: styles.value }, formatCurrency((analysis as any).strategySpecific.capitalRecovery.capitalRemaining || 0))
          ),
          (analysis as any).strategySpecific.capitalRecovery.capitalRemaining === 0 && React.createElement(
            View,
            { style: { ...styles.row, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 4, marginTop: 8 } },
            React.createElement(Text, { style: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold' } }, '🚀 Infinite Return Achieved!')
          )
        )
      ] : []),

      // Key Investment Metrics Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Key Investment Metrics'),

        // Row 1
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Cap Rate'),
          React.createElement(Text, { style: styles.value }, analysis.keyMetrics?.capRate !== undefined ? formatPercent(analysis.keyMetrics.capRate) : 'N/A')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Cash-on-Cash Return'),
          React.createElement(Text, { style: styles.value }, analysis.keyMetrics?.cashOnCashReturn !== undefined ? formatPercent(analysis.keyMetrics.cashOnCashReturn) : 'N/A')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'IRR (Internal Rate of Return)'),
          React.createElement(Text, { style: styles.value }, analysis.keyMetrics?.irr !== undefined ? formatPercent(analysis.keyMetrics.irr) : 'N/A')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'DSCR (Debt Service Coverage Ratio)'),
          React.createElement(Text, { style: styles.value }, analysis.keyMetrics?.dscr !== undefined ? analysis.keyMetrics.dscr.toFixed(2) : 'N/A')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Gross Rent Multiplier'),
          React.createElement(Text, { style: styles.value }, analysis.keyMetrics?.grossRentMultiplier !== undefined ? analysis.keyMetrics.grossRentMultiplier.toFixed(2) : 'N/A')
        )
      ),

      // Disclaimer
      React.createElement(
        View,
        { style: styles.disclaimer },
        React.createElement(
          Text,
          { style: styles.disclaimerText },
          'This analysis is for educational and informational purposes only. REanalyzr provides professional-grade calculations but does not constitute financial, legal, or investment advice. Always consult with qualified professionals (CPA, attorney, financial advisor) before making investment decisions. Past performance does not guarantee future results. Real estate investing involves risk including loss of principal.'
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, 'Generated by REanalyzr - Institutional-Grade Analysis for Individual Investors'),
        React.createElement(Text, null, `reanalyzr.com | ${new Date().toLocaleDateString()}`)
      )
    )
  );
}

// ============================================================
// Professional Report Styles (multi-page banker/underwriter report)
// ============================================================

const proStyles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 15,
    borderBottom: '2pt solid #1565C0',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666666',
  },
  headerAddress: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
    marginTop: 12,
    borderBottom: '1pt solid #E0E0E0',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
    paddingVertical: 2,
  },
  rowAlt: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
    paddingVertical: 2,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 9,
    color: '#555555',
    flex: 1,
  },
  value: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'right' as const,
  },
  // Score section
  scoreBox: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center' as const,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  // Two-column layout
  twoCol: {
    flexDirection: 'row' as const,
    gap: 15,
  },
  col: {
    flex: 1,
  },
  // Metrics grid
  metricCard: {
    padding: 8,
    marginBottom: 6,
    backgroundColor: '#F5F7FA',
    borderRadius: 3,
    borderLeft: '3pt solid #1565C0',
  },
  metricLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#212121',
  },
  // Table styles
  table: {
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row' as const,
    backgroundColor: '#1565C0',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right' as const,
    flex: 1,
    paddingHorizontal: 2,
  },
  tableHeaderCellFirst: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left' as const,
    width: 30,
    paddingHorizontal: 2,
  },
  tableRow: {
    flexDirection: 'row' as const,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderBottom: '0.5pt solid #E0E0E0',
  },
  tableRowAlt: {
    flexDirection: 'row' as const,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderBottom: '0.5pt solid #E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    fontSize: 7,
    color: '#333333',
    textAlign: 'right' as const,
    flex: 1,
    paddingHorizontal: 2,
  },
  tableCellFirst: {
    fontSize: 7,
    color: '#333333',
    fontWeight: 'bold',
    textAlign: 'left' as const,
    width: 30,
    paddingHorizontal: 2,
  },
  // Footer
  footer: {
    position: 'absolute' as const,
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    borderTop: '0.5pt solid #CCCCCC',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#999999',
  },
  disclaimer: {
    marginTop: 15,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#888888',
    lineHeight: 1.4,
  },
  // BRRRR highlight
  brrrrSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 3,
    borderLeft: '3pt solid #4CAF50',
  },
});

// ============================================================
// Professional Report PDF Document (multi-page)
// ============================================================

function ProfessionalReportPdfDocument({
  analysis,
  formData,
  strategy,
  senderName,
  rawPropertyData,
}: {
  analysis: AnalysisResult<SFRMetrics>;
  formData: PdfFormData;
  strategy: PdfStrategy;
  senderName?: string;
  rawPropertyData?: any;
}) {
  const dealQualityScore = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
  const scoreStyles = getScoreStyles(dealQualityScore);
  const scoreLabel = getScoreLabel(dealQualityScore);
  const isBrrrr = strategy === 'brrrr';
  const projections = (analysis as any).longTermAnalysis?.projections || [];
  // Merge property data: prefer rawPropertyData (from frontend), then analysis.propertyData, then formData
  const propertyData = rawPropertyData || (analysis as any).propertyData || formData;
  const lta = propertyData?.longTermAssumptions || {};
  const userProjectionYears = lta.projectionYears
    || propertyData?.projectionYears
    || formData.projectionYears
    || (analysis as any).longTermAnalysis?.projectionYears;
  const projectionCount = Math.min(projections.length, userProjectionYears || (isBrrrr ? 15 : 10));
  const strategySpec = (analysis as any).strategySpecific;
  const keyMetrics = analysis.keyMetrics || {} as any;
  const monthly = analysis.monthlyAnalysis || {} as any;
  const annual = analysis.annualAnalysis || {} as any;
  const exitAnalysis = (analysis as any).longTermAnalysis?.exitAnalysis;
  const weightedComponents = analysis.investmentDecision?.professionalAssessment?.weightedComponents;

  const strategyLabel = isBrrrr ? 'BRRRR Strategy' : 'Buy & Hold';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const addressStr = formData.propertyAddress || propertyData?.address || propertyData?.propertyAddress?.street || 'Property Analysis';

  // Helper to create data row with alternating background
  const dataRow = (label: string, value: string, alt: boolean = false) =>
    React.createElement(View, { style: alt ? proStyles.rowAlt : proStyles.row },
      React.createElement(Text, { style: proStyles.label }, label),
      React.createElement(Text, { style: proStyles.value }, value)
    );

  // Page footer component
  const PageFooter = ({ pageNum }: { pageNum: number }) =>
    React.createElement(View, { style: proStyles.footer, fixed: true } as any,
      React.createElement(Text, { style: proStyles.footerText }, `REanalyzr | Institutional-Grade Analysis | reanalyzr.com | ${dateStr}`),
      React.createElement(Text, { style: proStyles.footerText }, `Page ${pageNum}`)
    );

  // Subtle page header for pages 2+ (light branding)
  const PageHeader = () =>
    React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '0.5pt solid #E0E0E0' } },
      React.createElement(Text, { style: { fontSize: 10, fontWeight: 'bold', color: '#1565C0' } }, 'REanalyzr'),
      React.createElement(Text, { style: { fontSize: 8, color: '#999999' } }, addressStr)
    );

  // ---- PAGE 1: Executive Summary ----
  const page1 = React.createElement(
    Page, { size: 'A4', style: proStyles.page },

    // Branded Header
    React.createElement(View, { style: proStyles.header },
      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
        React.createElement(View, null,
          React.createElement(Text, { style: { fontSize: 22, fontWeight: 'bold', color: '#1565C0', letterSpacing: -0.5 } }, 'REanalyzr'),
          React.createElement(Text, { style: { fontSize: 9, color: '#90A4AE', marginTop: 1 } }, 'Institutional-Grade Analysis')
        ),
        React.createElement(View, { style: { alignItems: 'flex-end' } },
          React.createElement(Text, { style: { fontSize: 8, color: '#999999' } }, 'reanalyzr.com'),
          React.createElement(Text, { style: { fontSize: 8, color: '#999999' } }, dateStr)
        )
      ),
      React.createElement(Text, { style: { fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 3 } }, 'Property Analysis Report'),
      React.createElement(Text, { style: proStyles.headerAddress }, addressStr),
      React.createElement(Text, { style: proStyles.headerSubtitle },
        `${strategyLabel}${senderName ? ` | Prepared by ${senderName}` : ''}`)
    ),

    // Deal Quality Score
    React.createElement(View, {
      style: {
        ...proStyles.scoreBox,
        backgroundColor: dealQualityScore >= 80 ? '#E8F5E9' : dealQualityScore >= 65 ? '#FFF3E0' : '#FFEBEE',
      }
    },
      React.createElement(Text, { style: { fontSize: 10, fontWeight: 'bold', color: '#555', marginBottom: 4 } }, 'Deal Quality Score'),
      React.createElement(Text, {
        style: {
          ...proStyles.scoreValue,
          color: dealQualityScore >= 80 ? '#2E7D32' : dealQualityScore >= 65 ? '#E65100' : '#C62828',
        }
      }, `${dealQualityScore}/100`),
      React.createElement(Text, {
        style: {
          ...proStyles.scoreLabel,
          color: dealQualityScore >= 80 ? '#2E7D32' : dealQualityScore >= 65 ? '#E65100' : '#C62828',
        }
      }, scoreLabel)
    ),

    // Professional Calibration
    ...(weightedComponents ? [
      React.createElement(View, { style: { marginTop: 8, marginBottom: 8 } },
        React.createElement(Text, { style: { fontSize: 10, fontWeight: 'bold', color: '#333', marginBottom: 6 } }, 'Professional Calibration'),
        ...(Object.entries(weightedComponents) as [string, any][]).map(([key, comp]) =>
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 }, key },
            React.createElement(Text, { style: { fontSize: 8, color: '#666', width: 80 } },
              key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())),
            React.createElement(View, { style: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginHorizontal: 6 } },
              React.createElement(View, { style: { width: `${Math.min(comp.score || 0, 100)}%`, height: 8, backgroundColor: '#1565C0', borderRadius: 4 } })
            ),
            React.createElement(Text, { style: { fontSize: 8, fontWeight: 'bold', color: '#333', width: 30, textAlign: 'right' } },
              `${Math.round(comp.score || 0)}/100`)
          )
        )
      )
    ] : []),

    // Hero Metrics
    React.createElement(Text, { style: proStyles.sectionTitle }, 'Key Highlights'),
    React.createElement(View, { style: proStyles.twoCol },
      React.createElement(View, { style: proStyles.col },
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Monthly Cash Flow'),
          React.createElement(Text, { style: proStyles.metricValue },
            isBrrrr && strategySpec?.postRefinanceMetrics?.monthlyCashFlow !== undefined
              ? formatCurrency(strategySpec.postRefinanceMetrics.monthlyCashFlow)
              : monthly?.cashFlow !== undefined ? formatCurrency(monthly.cashFlow) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Cap Rate'),
          React.createElement(Text, { style: proStyles.metricValue },
            keyMetrics.capRate !== undefined ? formatPercent(keyMetrics.capRate) : 'N/A')
        )
      ),
      React.createElement(View, { style: proStyles.col },
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Cash-on-Cash Return'),
          React.createElement(Text, { style: proStyles.metricValue },
            isBrrrr && strategySpec?.postRefinanceMetrics?.cashOnCashReturn !== undefined
              ? formatPercent(strategySpec.postRefinanceMetrics.cashOnCashReturn)
              : keyMetrics.cashOnCashReturn !== undefined ? formatPercent(keyMetrics.cashOnCashReturn) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'DSCR'),
          React.createElement(Text, { style: proStyles.metricValue },
            isBrrrr && strategySpec?.postRefinanceMetrics?.postRefiDSCR !== undefined
              ? strategySpec.postRefinanceMetrics.postRefiDSCR.toFixed(2)
              : keyMetrics.dscr !== undefined ? keyMetrics.dscr.toFixed(2) : 'N/A')
        )
      )
    ),

    PageFooter({ pageNum: 1 })
  );

  // ---- PAGE 2: Property & Financing ----
  const page2 = React.createElement(
    Page, { size: 'A4', style: proStyles.page },

    PageHeader(),
    React.createElement(Text, { style: proStyles.sectionTitle }, 'Property Details'),
    dataRow('Address', addressStr),
    dataRow('Purchase Price', formatCurrency(formData.purchasePrice), true),
    formData.squareFeet ? dataRow('Square Footage', `${formData.squareFeet.toLocaleString()} sq ft`) : null,
    formData.squareFeet ? dataRow('Price per Sq Ft', formatCurrency(formData.purchasePrice / formData.squareFeet), true) : null,
    propertyData?.bedrooms ? dataRow('Bedrooms / Bathrooms', `${propertyData.bedrooms} bed / ${propertyData.bathrooms || 'N/A'} bath`) : null,
    propertyData?.yearBuilt ? dataRow('Year Built', `${propertyData.yearBuilt}`, true) : null,
    propertyData?.propertyType ? dataRow('Property Type', propertyData.propertyType) : null,

    React.createElement(Text, { style: proStyles.sectionTitle }, 'Financing'),
    dataRow('Down Payment', `${formatCurrency(formData.downPayment)} (${((formData.downPayment / formData.purchasePrice) * 100).toFixed(0)}%)`),
    dataRow('Loan Amount', formatCurrency(formData.purchasePrice - formData.downPayment), true),
    propertyData?.interestRate !== undefined ? dataRow('Interest Rate', formatPercent(propertyData.interestRate)) : null,
    propertyData?.loanTerm ? dataRow('Loan Term', `${propertyData.loanTerm} years`, true) : null,
    monthly?.expenses?.debt ? dataRow('Monthly Mortgage', formatCurrency(monthly.expenses.debt)) : null,
    propertyData?.closingCosts !== undefined ? dataRow('Closing Costs', formatCurrency(propertyData.closingCosts), true) : null,

    // BRRRR-specific financing
    ...(isBrrrr ? [
      React.createElement(Text, { style: proStyles.sectionTitle }, 'BRRRR Strategy Details'),
      React.createElement(View, { style: proStyles.brrrrSection },
        dataRow('Rehab Budget', formData.rehabCost ? formatCurrency(formData.rehabCost) : 'N/A'),
        dataRow('After Repair Value (ARV)', formData.afterRepairValue ? formatCurrency(formData.afterRepairValue) : 'N/A', true),
        propertyData?.refinanceLTV ? dataRow('Refinance LTV', formatPercent(propertyData.refinanceLTV)) : null,
        propertyData?.seasoningPeriod ? dataRow('Seasoning Period', `${propertyData.seasoningPeriod} months`, true) : null,
        propertyData?.refinanceInterestRate !== undefined ? dataRow('Refinance Interest Rate', formatPercent(propertyData.refinanceInterestRate)) : null
      )
    ] : []),

    PageFooter({ pageNum: 2 })
  );

  // ---- PAGE 3: Income, Expenses & Assumptions ----
  const expenses = monthly?.expenses || {} as any;
  const breakdown = expenses.breakdown || {} as any;

  const page3 = React.createElement(
    Page, { size: 'A4', style: proStyles.page },

    PageHeader(),
    React.createElement(Text, { style: proStyles.sectionTitle }, 'Monthly Income'),
    dataRow('Gross Monthly Rent', formatCurrency(formData.monthlyRent)),
    monthly?.income?.effective !== undefined
      ? dataRow('Effective Gross Income', formatCurrency(monthly.income.effective), true) : null,

    React.createElement(Text, { style: proStyles.sectionTitle }, 'Monthly Expenses'),
    breakdown.propertyTax !== undefined ? dataRow('Property Tax', formatCurrency(breakdown.propertyTax)) : null,
    breakdown.insurance !== undefined ? dataRow('Insurance', formatCurrency(breakdown.insurance), true) : null,
    breakdown.maintenance !== undefined ? dataRow('Maintenance', formatCurrency(breakdown.maintenance)) : null,
    breakdown.propertyManagement !== undefined ? dataRow('Property Management', formatCurrency(breakdown.propertyManagement), true) : null,
    breakdown.vacancy !== undefined ? dataRow('Vacancy Reserve', formatCurrency(breakdown.vacancy)) : null,
    breakdown.hoa !== undefined && breakdown.hoa > 0 ? dataRow('HOA', formatCurrency(breakdown.hoa), true) : null,
    breakdown.landlordUtilities !== undefined && breakdown.landlordUtilities > 0 ? dataRow('Utilities', formatCurrency(breakdown.landlordUtilities)) : null,
    breakdown.sfrCapEx !== undefined && breakdown.sfrCapEx > 0 ? dataRow('CapEx Reserve', formatCurrency(breakdown.sfrCapEx), true) : null,
    expenses.total !== undefined ? dataRow('Total Monthly Expenses', formatCurrency(expenses.total)) : null,

    React.createElement(Text, { style: proStyles.sectionTitle }, 'Assumptions'),
    (() => {
      // lta already resolved at top of function from propertyData.longTermAssumptions
      const rows: any[] = [];
      if (lta.vacancyRate !== undefined) rows.push(dataRow('Vacancy Rate', formatPercent(lta.vacancyRate)));
      if (lta.annualRentIncrease !== undefined) rows.push(dataRow('Annual Rent Growth', formatPercent(lta.annualRentIncrease), true));
      if (lta.annualPropertyValueIncrease !== undefined) rows.push(dataRow('Annual Appreciation', formatPercent(lta.annualPropertyValueIncrease)));
      if (lta.inflationRate !== undefined) rows.push(dataRow('Inflation Rate', formatPercent(lta.inflationRate), true));
      if (lta.sellingCostsPercentage !== undefined) rows.push(dataRow('Selling Costs', formatPercent(lta.sellingCostsPercentage)));
      if (propertyData?.propertyTaxRate !== undefined) rows.push(dataRow('Property Tax Rate', formatPercent(propertyData.propertyTaxRate), true));
      if (propertyData?.propertyManagementRate !== undefined) rows.push(dataRow('Property Management', formatPercent(propertyData.propertyManagementRate)));
      if (lta.projectionYears) rows.push(dataRow('Projection Period', `${lta.projectionYears} years`, true));
      if (lta.turnoverFrequency) rows.push(dataRow('Tenant Turnover', `Every ${lta.turnoverFrequency} years`));
      return rows.length > 0 ? React.createElement(View, null, ...rows) : dataRow('Using default assumptions', 'Standard');
    })(),

    React.createElement(Text, { style: proStyles.sectionTitle }, 'Annual Summary'),
    annual?.noi !== undefined ? dataRow('Net Operating Income (NOI)', formatCurrency(annual.noi)) : null,
    annual?.debtService !== undefined ? dataRow('Annual Debt Service', formatCurrency(annual.debtService), true) : null,
    annual?.cashFlow !== undefined ? dataRow('Annual Cash Flow', formatCurrency(annual.cashFlow)) : null,

    PageFooter({ pageNum: 3 })
  );

  // ---- PAGE 4: Key Investment Metrics ----
  const page4 = React.createElement(
    Page, { size: 'A4', style: proStyles.page },

    PageHeader(),
    React.createElement(Text, { style: proStyles.sectionTitle }, 'Key Investment Metrics'),
    React.createElement(View, { style: proStyles.twoCol },
      React.createElement(View, { style: proStyles.col },
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Cap Rate'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.capRate !== undefined ? formatPercent(keyMetrics.capRate) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Cash-on-Cash Return'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.cashOnCashReturn !== undefined ? formatPercent(keyMetrics.cashOnCashReturn) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, `IRR (${userProjectionYears || 10}-Year)`),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.irr !== undefined ? formatPercent(keyMetrics.irr < 1 ? keyMetrics.irr * 100 : keyMetrics.irr) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'DSCR'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.dscr !== undefined ? keyMetrics.dscr.toFixed(2) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Gross Rent Multiplier'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.grossRentMultiplier !== undefined ? keyMetrics.grossRentMultiplier.toFixed(2) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Total ROI'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.totalROI !== undefined ? formatPercent(keyMetrics.totalROI) : 'N/A')
        )
      ),
      React.createElement(View, { style: proStyles.col },
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Break-Even Occupancy'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.breakEvenOccupancy !== undefined ? formatPercent(keyMetrics.breakEvenOccupancy) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Equity Multiple'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.equityMultiple !== undefined ? `${keyMetrics.equityMultiple.toFixed(2)}x` : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, '1% Rule'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.onePercentRuleValue !== undefined ? formatCurrency(keyMetrics.onePercentRuleValue) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Price per Sq Ft'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.pricePerSqft !== undefined ? formatCurrency(keyMetrics.pricePerSqft) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Debt Yield'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.debtYield !== undefined ? formatPercent(keyMetrics.debtYield) : 'N/A')
        ),
        React.createElement(View, { style: proStyles.metricCard },
          React.createElement(Text, { style: proStyles.metricLabel }, 'Gross Yield'),
          React.createElement(Text, { style: proStyles.metricValue }, keyMetrics.grossYield !== undefined ? formatPercent(keyMetrics.grossYield) : 'N/A')
        )
      )
    ),

    // BRRRR-specific metrics
    ...(isBrrrr && strategySpec ? [
      React.createElement(Text, { style: proStyles.sectionTitle }, 'BRRRR Capital Recovery'),
      React.createElement(View, { style: proStyles.brrrrSection },
        strategySpec.capitalRecovery?.capitalRecoveryRate !== undefined
          ? dataRow('Capital Recovery Rate', formatPercent(strategySpec.capitalRecovery.capitalRecoveryRate)) : null,
        strategySpec.capitalRecovery?.capitalRemaining !== undefined
          ? dataRow('Cash Left in Deal', formatCurrency(strategySpec.capitalRecovery.capitalRemaining), true) : null,
        keyMetrics.forcedEquity !== undefined
          ? dataRow('Forced Equity', formatCurrency(keyMetrics.forcedEquity)) : null,
        strategySpec.postRefinanceMetrics?.monthlyCashFlow !== undefined
          ? dataRow('Post-Refi Monthly Cash Flow', formatCurrency(strategySpec.postRefinanceMetrics.monthlyCashFlow), true) : null,
        strategySpec.postRefinanceMetrics?.postRefiDSCR !== undefined
          ? dataRow('Post-Refi DSCR', strategySpec.postRefinanceMetrics.postRefiDSCR.toFixed(2)) : null,
        strategySpec.postRefinanceMetrics?.cashOnCashReturn !== undefined
          ? dataRow('Post-Refi Cash-on-Cash', formatPercent(strategySpec.postRefinanceMetrics.cashOnCashReturn), true) : null,
        strategySpec.rule70Check
          ? dataRow('70% Rule', strategySpec.rule70Check.meets70Rule ? 'PASS' : 'FAIL') : null
      )
    ] : []),

    PageFooter({ pageNum: 4 })
  );

  // ---- PAGE 5: Projection Table ----
  const tableColumns = ['Year', 'Property Value', 'Gross Rent', 'Expenses', 'NOI', 'Debt Service', 'Cash Flow', 'Equity'];

  const projectionPages = projectionCount > 0 ? [
    React.createElement(
      Page, { size: 'A4', style: proStyles.page },

      PageHeader(),
      React.createElement(Text, { style: proStyles.sectionTitle },
        `${projectionCount}-Year Projection`),

      React.createElement(View, { style: proStyles.table },
        // Header row
        React.createElement(View, { style: proStyles.tableHeaderRow },
          ...tableColumns.map((col, i) =>
            React.createElement(Text, {
              style: i === 0 ? proStyles.tableHeaderCellFirst : proStyles.tableHeaderCell,
              key: `h-${i}`
            }, col)
          )
        ),

        // Data rows
        ...projections.slice(0, projectionCount).map((proj: any, i: number) =>
          React.createElement(View, {
            style: i % 2 === 0 ? proStyles.tableRow : proStyles.tableRowAlt,
            key: `r-${i}`
          },
            React.createElement(Text, { style: proStyles.tableCellFirst }, `${proj.year}`),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.propertyValue || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.grossIncome || proj.grossRent || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.operatingExpenses || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.noi || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.debtService || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.cashFlow || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(proj.equity || 0))
          )
        )
      ),

      // Exit Analysis
      ...(exitAnalysis ? [
        React.createElement(Text, { style: { ...proStyles.sectionTitle, marginTop: 15 } }, 'Exit Analysis'),
        exitAnalysis.projectedSalePrice !== undefined
          ? dataRow('Projected Sale Price', formatCurrency(exitAnalysis.projectedSalePrice)) : null,
        exitAnalysis.sellingCosts !== undefined
          ? dataRow('Selling Costs', formatCurrency(exitAnalysis.sellingCosts), true) : null,
        exitAnalysis.mortgagePayoff !== undefined
          ? dataRow('Mortgage Payoff', formatCurrency(exitAnalysis.mortgagePayoff)) : null,
        exitAnalysis.netProceeds !== undefined
          ? dataRow('Net Proceeds', formatCurrency(exitAnalysis.netProceeds), true) : null,
        exitAnalysis.totalProfit !== undefined
          ? dataRow('Total Profit', formatCurrency(exitAnalysis.totalProfit)) : null,
        exitAnalysis.roi !== undefined
          ? dataRow('ROI', formatPercent(exitAnalysis.roi), true) : null,
      ] : []),

      // BRRRR Exit Scenarios
      ...(isBrrrr && strategySpec?.exitScenarios?.length > 0 ? [
        React.createElement(Text, { style: { ...proStyles.sectionTitle, marginTop: 12 } }, 'BRRRR Exit Scenarios'),
        React.createElement(View, { style: proStyles.tableHeaderRow },
          React.createElement(Text, { style: proStyles.tableHeaderCellFirst }, 'Year'),
          React.createElement(Text, { style: proStyles.tableHeaderCell }, 'Sale Price'),
          React.createElement(Text, { style: proStyles.tableHeaderCell }, 'Net Proceeds'),
          React.createElement(Text, { style: proStyles.tableHeaderCell }, 'Total Return'),
          React.createElement(Text, { style: proStyles.tableHeaderCell }, 'IRR')
        ),
        ...strategySpec.exitScenarios.map((scenario: any, i: number) =>
          React.createElement(View, {
            style: i % 2 === 0 ? proStyles.tableRow : proStyles.tableRowAlt,
            key: `exit-${i}`
          },
            React.createElement(Text, { style: proStyles.tableCellFirst }, `Year ${scenario.year}`),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(scenario.salePrice || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(scenario.netProceeds || scenario.proceeds || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, formatCurrency(scenario.totalReturn || 0)),
            React.createElement(Text, { style: proStyles.tableCell }, scenario.irr !== undefined ? formatPercent(scenario.irr) : 'N/A')
          )
        )
      ] : []),

      // Disclaimer
      React.createElement(View, { style: proStyles.disclaimer },
        React.createElement(Text, { style: proStyles.disclaimerText },
          'This analysis is for educational and informational purposes only. REanalyzr provides professional-grade calculations but does not constitute financial, legal, or investment advice. Always consult with qualified professionals (CPA, attorney, financial advisor) before making investment decisions. Past performance does not guarantee future results. Real estate investing involves risk including loss of principal.')
      ),

      PageFooter({ pageNum: 5 })
    )
  ] : [];

  return React.createElement(Document, null, page1, page2, page3, page4, ...projectionPages);
}

// ============================================================
// PDF Service Class
// ============================================================

export class PdfService {
  /**
   * Generate checksum for data integrity verification
   *
   * @param analysis - Analysis result object
   * @param formData - User input form data
   * @returns string - SHA-256 hex checksum
   */
  private generateChecksum(
    analysis: AnalysisResult<SFRMetrics>,
    formData: PdfFormData
  ): string {
    const dataString = JSON.stringify({ analysis, formData });
    return crypto.createHash(PDF_CONSTANTS.CHECKSUM_ALGORITHM).update(dataString).digest('hex');
  }

  /**
   * Generate property analysis PDF
   *
   * @param analysis - Complete analysis result from backend
   * @param formData - Original user input (for display purposes)
   * @param strategy - Investment strategy ('brrrr' | 'buy-hold')
   * @returns Promise<PdfGenerationResult>
   */
  async generateAnalysisPdf(
    analysis: AnalysisResult<SFRMetrics>,
    formData: PdfFormData,
    strategy: PdfStrategy
  ): Promise<PdfGenerationResult> {
    const startTime = Date.now();

    try {
      // Generate checksum for data integrity
      const checksum = this.generateChecksum(analysis, formData);

      logger.info('[PdfService] Starting PDF generation', {
        strategy,
        dealQualityScore: analysis.investmentDecision?.professionalAssessment?.dealQuality || 0,
        checksum: checksum.substring(0, 16) + '...',
      });

      // Create PDF Document using React components
      const doc = AnalysisPdfDocument({
        analysis,
        formData,
        strategy,
      });

      // Render to blob
      const pdfBlob = await pdf(doc).toBlob();

      // Convert blob to buffer
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      const duration = Date.now() - startTime;
      const fileSizeBytes = pdfBuffer.length;
      const fileSizeKB = Math.round(fileSizeBytes / 1024);

      logger.info('[PdfService] PDF generated successfully', {
        strategy,
        durationMs: duration,
        fileSizeKB,
        checksum: checksum.substring(0, 16) + '...',
      });

      // Performance warning if exceeds target
      if (duration > PDF_CONSTANTS.PDF_PERFORMANCE_TARGET_MS) {
        logger.warn('[PdfService] PDF generation exceeded performance target', {
          durationMs: duration,
          targetMs: PDF_CONSTANTS.PDF_PERFORMANCE_TARGET_MS,
        });
      }

      // Size warning if exceeds target
      if (fileSizeKB > PDF_CONSTANTS.PDF_TARGET_SIZE_KB) {
        logger.warn('[PdfService] PDF file size exceeded target', {
          fileSizeKB,
          targetKB: PDF_CONSTANTS.PDF_TARGET_SIZE_KB,
        });
      }

      return {
        pdfBuffer,
        fileSizeBytes,
        generationTimeMs: duration,
        checksum,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('[PdfService] Failed to generate PDF', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: duration,
        strategy,
      });

      throw new Error('PDF generation failed');
    }
  }

  /**
   * Generate professional multi-page report PDF (for authenticated share)
   */
  async generateProfessionalReportPdf(
    analysis: AnalysisResult<SFRMetrics>,
    formData: PdfFormData,
    strategy: PdfStrategy,
    senderName?: string,
    rawPropertyData?: any
  ): Promise<PdfGenerationResult> {
    const startTime = Date.now();

    try {
      const checksum = this.generateChecksum(analysis, formData);

      logger.info('[PdfService] Starting professional report PDF generation', {
        strategy,
        dealQualityScore: analysis.investmentDecision?.professionalAssessment?.dealQuality || 0,
      });

      const doc = ProfessionalReportPdfDocument({ analysis, formData, strategy, senderName, rawPropertyData });
      const pdfBlob = await pdf(doc).toBlob();
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      const duration = Date.now() - startTime;
      const fileSizeBytes = pdfBuffer.length;

      logger.info('[PdfService] Professional report PDF generated', {
        durationMs: duration,
        fileSizeKB: Math.round(fileSizeBytes / 1024),
      });

      return { pdfBuffer, fileSizeBytes, generationTimeMs: duration, checksum };
    } catch (error) {
      logger.error('[PdfService] Failed to generate professional report PDF', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw new Error('Professional report PDF generation failed');
    }
  }

  /**
   * Generate filename for PDF attachment
   *
   * @param strategy - Investment strategy
   * @param address - Optional property address
   * @returns string - Filename (e.g., "REanalyzr-Analysis-BRRRR-2026-03-01.pdf")
   */
  generateFilename(strategy: PdfStrategy, address?: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const strategyLabel = strategy === 'brrrr' ? 'BRRRR' : 'BuyHold';

    if (address) {
      // Clean address for filename (remove special characters)
      const cleanAddress = address.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
      return `${PDF_CONSTANTS.PDF_FILENAME_PREFIX}-${strategyLabel}-${cleanAddress}-${date}.pdf`;
    }

    return `${PDF_CONSTANTS.PDF_FILENAME_PREFIX}-${strategyLabel}-${date}.pdf`;
  }
}

// ============================================================
// Export Singleton Instance
// ============================================================

const pdfService = new PdfService();
export default pdfService;
