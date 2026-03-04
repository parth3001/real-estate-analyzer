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
