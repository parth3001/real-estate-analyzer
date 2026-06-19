/**
 * SubstrateDealPdf — Task #65/#66 (2026-06-18).
 *
 * Single-page PDF mirroring the chat email summary (sendDealScoreSummary)
 * that users explicitly praised. The previous workspace PDF (#61) routed
 * through pdfService.generateAnalysisPdf which expects the wizard's 60+
 * field shape — substrate-derived 2.0 deals only populate a subset, so
 * the legacy renderer produced a 4.9KB mostly-empty document.
 *
 * This document is consumed by deals controller's exportDealPdf and
 * gets attached to the email PDF surface, giving DOWNLOAD and EMAIL
 * full parity (and they each look like what the user expects).
 *
 * Design intent: not a "report" — a "summary card." Score + factors +
 * key metrics + assumptions + projection milestones + walk-away vs offer
 * + AI disclaimer footer. One page, ~ 6-8 sections, scannable.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ===== Input shape =====

export interface SubstrateDealPdfInput {
  strategy: 'buy_hold' | 'brrrr';
  addressLine: string;
  dealQuality: number; // 0..100
  topFactors: Array<{ label: string; score: number }>;
  walkAwayPrice: number;
  purchasePrice: number;
  nextStep: string;
  assumptions?: Array<{ label: string; value?: string; source?: string }>;
  /**
   * Year-by-year milestones — caller picks 5 representative years
   * (e.g., 1/3/5/7/10). Each row shows the cash flow / value / equity
   * point so the reader sees the trajectory.
   */
  projection?: Array<{
    year: number;
    cashFlow: number;
    propertyValue: number;
    equity: number;
  }>;
  keyMetrics?: {
    monthlyCashFlow?: number;
    capRate?: number;
    irr?: number;
    dscr?: number;
    cashOnCashReturn?: number;
    annualNOI?: number;
    totalInvestment?: number;
    monthlyDebtService?: number;
  };
}

// ===== Helpers =====

const fmtUsd = (n: number | undefined): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

const fmtPct = (n: number | undefined, digits = 2): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
};

const scoreLabel = (q: number): string => {
  if (q >= 80) return 'Above professional standards';
  if (q >= 65) return 'Meets professional standards';
  if (q >= 50) return 'Requires optimization';
  return 'Below professional standards';
};

const scoreColor = (q: number): string => {
  if (q >= 80) return '#1B8B3A';
  if (q >= 65) return '#A66700';
  if (q >= 50) return '#C04A00';
  return '#C7261C';
};

// ===== Styles =====

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: 700,
    lineHeight: 1,
  },
  scoreOutOf: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginBottom: 6,
  },
  scoreLabel: {
    marginLeft: 18,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 600,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: { fontSize: 10, color: '#374151' },
  rowValue: { fontSize: 10, color: '#111827', fontWeight: 700 },
  rowValueSecondary: { fontSize: 9, color: '#6B7280', fontWeight: 400 },
  twoCol: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 4,
  },
  col: { flex: 1 },
  walkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    marginBottom: 6,
  },
  walkLabel: { fontSize: 10, color: '#374151' },
  walkValue: { fontSize: 12, fontWeight: 700, color: '#111827' },
  yearTable: { marginTop: 4 },
  yearHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#9CA3AF',
    paddingBottom: 3,
    marginBottom: 2,
  },
  yearHeaderCell: {
    flex: 1,
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: 700,
  },
  yearHeaderCellRight: { textAlign: 'right' },
  yearRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.3,
    borderBottomColor: '#F3F4F6',
  },
  yearCell: { flex: 1, fontSize: 9, color: '#374151' },
  yearCellRight: { textAlign: 'right' },
  nextStep: {
    marginTop: 18,
    padding: 10,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    fontSize: 10,
    color: '#0C4A6E',
  },
  footer: {
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
  },
  disclaimerHeader: {
    fontSize: 8,
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.4,
  },
});

// ===== Component =====

export const SubstrateDealPdfDocument: React.FC<{ data: SubstrateDealPdfInput }> = ({
  data,
}) => {
  const {
    strategy,
    addressLine,
    dealQuality,
    topFactors,
    walkAwayPrice,
    purchasePrice,
    nextStep,
    assumptions,
    projection,
    keyMetrics,
  } = data;

  const strategyLabel = strategy === 'brrrr' ? 'BRRRR Analysis' : 'Buy & Hold Analysis';
  const color = scoreColor(dealQuality);
  const label = scoreLabel(dealQuality);

  const offerDelta = walkAwayPrice > 0 ? (purchasePrice - walkAwayPrice) / walkAwayPrice : null;
  const offerDeltaPct = offerDelta !== null ? `${offerDelta >= 0 ? '+' : ''}${(offerDelta * 100).toFixed(0)}%` : '';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Brand */}
        <Text style={styles.brand}>REanalyzr</Text>
        <Text style={styles.tagline}>
          Institutional-grade underwriting for individual investors.
        </Text>

        {/* Address + strategy */}
        <Text style={styles.eyebrow}>{strategyLabel}</Text>
        <Text style={styles.address}>{addressLine}</Text>

        {/* Score block */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNumber, { color }]}>{Math.round(dealQuality)}</Text>
          <Text style={styles.scoreOutOf}>/ 100</Text>
          <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
        </View>

        {/* Top factors */}
        <Text style={styles.sectionTitle}>Top factors</Text>
        {topFactors.map((f, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowValue}>{f.score} / 100</Text>
          </View>
        ))}

        {/* Walk-away vs offer */}
        <Text style={styles.sectionTitle}>Walk-away vs offer</Text>
        <View style={styles.walkRow}>
          <Text style={styles.walkLabel}>Walk-away price</Text>
          <Text style={styles.walkValue}>{fmtUsd(walkAwayPrice)}</Text>
        </View>
        <View style={styles.walkRow}>
          <Text style={styles.walkLabel}>Your offer</Text>
          <Text style={styles.walkValue}>
            {fmtUsd(purchasePrice)}
            {offerDeltaPct ? ` · ${offerDeltaPct} vs walk-away` : ''}
          </Text>
        </View>

        {/* Key metrics */}
        {keyMetrics && (
          <>
            <Text style={styles.sectionTitle}>Key metrics</Text>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Monthly cash flow</Text>
                  <Text style={styles.rowValue}>{fmtUsd(keyMetrics.monthlyCashFlow)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Annual NOI</Text>
                  <Text style={styles.rowValue}>{fmtUsd(keyMetrics.annualNOI)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Cap rate</Text>
                  <Text style={styles.rowValue}>{fmtPct(keyMetrics.capRate)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>10-year IRR</Text>
                  <Text style={styles.rowValue}>{fmtPct(keyMetrics.irr)}</Text>
                </View>
              </View>
              <View style={styles.col}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Cash-on-cash</Text>
                  <Text style={styles.rowValue}>{fmtPct(keyMetrics.cashOnCashReturn)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>DSCR</Text>
                  <Text style={styles.rowValue}>
                    {typeof keyMetrics.dscr === 'number' ? keyMetrics.dscr.toFixed(2) : '—'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Monthly debt service</Text>
                  <Text style={styles.rowValue}>{fmtUsd(keyMetrics.monthlyDebtService)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Total cash invested</Text>
                  <Text style={styles.rowValue}>{fmtUsd(keyMetrics.totalInvestment)}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Year-by-year milestones */}
        {projection && projection.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Year-by-year milestones</Text>
            <View style={styles.yearTable}>
              <View style={styles.yearHeader}>
                <Text style={styles.yearHeaderCell}>Year</Text>
                <Text style={[styles.yearHeaderCell, styles.yearHeaderCellRight]}>Cash flow</Text>
                <Text style={[styles.yearHeaderCell, styles.yearHeaderCellRight]}>Value</Text>
                <Text style={[styles.yearHeaderCell, styles.yearHeaderCellRight]}>Equity</Text>
              </View>
              {projection.map((p, i) => (
                <View key={i} style={styles.yearRow}>
                  <Text style={styles.yearCell}>Y{p.year}</Text>
                  <Text style={[styles.yearCell, styles.yearCellRight]}>{fmtUsd(p.cashFlow)}</Text>
                  <Text style={[styles.yearCell, styles.yearCellRight]}>{fmtUsd(p.propertyValue)}</Text>
                  <Text style={[styles.yearCell, styles.yearCellRight]}>{fmtUsd(p.equity)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Standard assumptions */}
        {assumptions && assumptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Standard assumptions used</Text>
            {assumptions.map((a, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{a.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.rowValue}>{a.value ?? '—'}</Text>
                  {a.source && (
                    <Text style={styles.rowValueSecondary}> · {a.source}</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Next step */}
        {nextStep && (
          <View style={styles.nextStep}>
            <Text style={{ fontSize: 8, color: '#0369A1', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700, marginBottom: 4 }}>
              Next step
            </Text>
            <Text>{nextStep}</Text>
          </View>
        )}

        {/* Disclaimer footer (Task #76) */}
        <View style={styles.footer}>
          <Text style={styles.disclaimerHeader}>Important — educational tool only</Text>
          <Text style={styles.disclaimerText}>
            REanalyzr provides AI-assisted real estate analysis for educational purposes only. It is
            not investment, tax, legal, or real estate advice. AI-generated content can contain
            errors. Verify all numbers against the structured workspace before acting. Consult a
            licensed CPA, financial advisor, and real estate attorney. Past performance does not
            guarantee future results. Real estate carries risk including total loss of capital.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
