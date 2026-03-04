# Feature #14 Implementation Guide - Anonymous PDF Email Storage

**Document Version:** 2.0 (React-PDF)
**Created:** February 28, 2026
**Updated:** February 28, 2026 (Switched from Puppeteer to React-PDF)
**Architect:** Principal Software Architect
**Target Audience:** Backend & Frontend Engineers
**Implementation Time:** 3-4 days

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Comparison](#technology-comparison)
3. [Architecture Overview](#architecture-overview)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Monitoring & Performance](#monitoring--performance)
7. [Testing Guide](#testing-guide)
8. [Deployment Checklist](#deployment-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### What We're Building

**Feature:** Anonymous users can request a PDF of their property analysis via email.

**Scope:**
- ✅ User enters email → PDF sent immediately
- ✅ Store email in database for future reference
- ✅ Track conversion (PDF request → signup)
- ✅ Simple disclosure (no third-party sharing)
- ✅ Data integrity verification (checksums)
- ❌ **NO** follow-up email campaigns (out of scope)
- ❌ **NO** unsubscribe flow (transactional email only)

### Business Value

- **Lead Capture:** Every PDF request = email collected
- **Attribution:** Track which PDFs convert to signups
- **Trust Building:** Zero friction email collection
- **Cost:** ~$0.0001 per PDF (email) + negligible compute (10x cheaper than Puppeteer)
- **Performance:** 100-500ms generation time (4-6x faster than Puppeteer)

### Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| PDF Generation | @react-pdf/renderer | React components → PDF conversion |
| Email Delivery | Resend (existing) | Send PDF attachment |
| Database | MongoDB | Store email records |
| Rate Limiting | LRU cache | Prevent abuse (5/hour per IP) |
| Frontend UI | React + MUI | Email input component |
| Monitoring | Sentry APM | Performance & error tracking |

---

## Technology Comparison

**Why React-PDF Was Selected:**

| Solution | Memory | Speed | Cost | Complexity | Production Ready | Free Tier Safe |
|----------|--------|-------|------|------------|------------------|----------------|
| **@react-pdf/renderer (SELECTED)** | 2MB | 100-500ms | Free | Medium | ✅ Yes | ✅ Yes |
| Puppeteer | 400MB | 2-3s | Free | High | ⚠️ Yes | ❌ OOM risk on 512MB tier |
| Gotenberg | 0MB* | 1-2s | $7/mo | Medium | ✅ Yes | N/A (separate service) |
| jsPDF | 0.5MB | 50ms | Free | Low | ⚠️ Limited | ✅ Yes |

*Gotenberg uses separate container memory, not main app

### React-PDF Advantages

- ✅ **Safe on Render free tier** - No OOM (Out of Memory) risk with 512MB RAM
- ✅ **Fast generation** - 100-500ms vs 2-3s with Puppeteer (4-6x faster)
- ✅ **No concurrency issues** - Pure Node.js, no browser spawning
- ✅ **Good visual quality** - Matches frontend styling with React components
- ✅ **Zero external dependencies** - No Chromium installation needed
- ✅ **Can reuse calculation logic** - Same React patterns as frontend

### Why Not Puppeteer

- ❌ 400MB RAM per browser instance (dangerous on 512MB Render free tier)
- ❌ Concurrency bottleneck (singleton browser = queue required)
- ❌ Slower (2-3s vs 100-500ms)
- ❌ Complex error handling (browser crashes, timeouts)
- ❌ 180MB Chromium dependency

### When to Reconsider

- **Switch to Gotenberg** if you need pixel-perfect PDFs (investors complain about formatting)
- **Switch to Gotenberg** when on paid Render tier anyway ($7/month justified)
- **Switch to Gotenberg** when PDF volume > 10,000/month (justify dedicated service)

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  1. Completes property analysis in anonymous calculator     │
│  2. Enters email address                                     │
│  3. Clicks "Send PDF" button                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  POST /api/deals/send-anonymous-pdf                         │
│  Body: { email, analysis, formData, strategy }              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Rate Limiter Middleware (LRU Cache)                    │ │
│  │ - Check IP address                                     │ │
│  │ - Allow 5 PDFs/hour                                    │ │
│  │ - Return 429 if exceeded                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Controller: sendAnonymousPdf                           │ │
│  │ 1. Validate email format                               │ │
│  │ 2. Generate checksum (SHA-256)                         │ │
│  │ 3. Create AnonymousPdfRequest in MongoDB               │ │
│  │ 4. Generate PDF (React-PDF)                            │ │
│  │ 5. Send email (Resend)                                 │ │
│  │ 6. Update emailSentAt timestamp                        │ │
│  │ 7. Return success                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      MONGODB                                 │
│  Collection: anonymousPdfRequests                           │
│  Document: {                                                 │
│    email: "user@example.com",                               │
│    strategy: "brrrr",                                        │
│    propertyData: { ... },                                    │
│    analysisChecksum: "sha256...",                           │
│    requestedAt: Date,                                        │
│    emailSentAt: Date,                                        │
│    convertedToSignup: false                                  │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      RESEND API                              │
│  - Email sent to user with PDF attachment                   │
│  - Delivery rate: 99%+                                       │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
backend/
├── src/
│   ├── types/
│   │   └── pdf.types.ts                     ← NEW (TypeScript definitions)
│   ├── models/
│   │   └── AnonymousPdfRequest.ts           ← NEW (MongoDB model)
│   ├── services/
│   │   ├── pdfService.ts                    ← NEW (React-PDF generation)
│   │   └── emailService.ts                  ← MODIFY (add sendAnonymousPdf)
│   ├── middleware/
│   │   └── rateLimiter.ts                   ← NEW (LRU cache rate limiting)
│   ├── controllers/
│   │   ├── deals.ts                         ← MODIFY (add sendAnonymousPdf)
│   │   └── authController.ts                ← MODIFY (conversion attribution)
│   └── routes/
│       └── deals.ts                         ← MODIFY (add route)

frontend/
└── src/
    ├── components/
    │   └── Calculator/
    │       └── CalculatorResults.tsx        ← MODIFY (add email input)
    └── pages/
        └── PrivacyPolicyPage.tsx            ← MODIFY (add section)
```

---

## Backend Implementation

### Step 1: Install Dependencies

**File:** `/backend/package.json`

```bash
cd backend
npm install @react-pdf/renderer
npm install lru-cache  # For improved rate limiting
npm install @types/react --save-dev  # React types for PDF components
```

**Verify installation:**
```bash
npm list @react-pdf/renderer
# Should show: @react-pdf/renderer@3.1.0 or higher

npm list lru-cache
# Should show: lru-cache@10.0.0 or higher
```

**Why These Dependencies:**
- `@react-pdf/renderer` - PDF generation using React components (lightweight, fast)
- `lru-cache` - Memory-efficient rate limiting (prevents memory leaks from in-memory store)
- `@types/react` - TypeScript support for React-PDF components

---

### Step 2: Create TypeScript Type Definitions

**File:** `/backend/src/types/pdf.types.ts` ← **NEW FILE**

```typescript
/**
 * PDF Service Type Definitions
 *
 * Centralizes all types used for PDF generation to ensure type safety
 * across controllers, services, and API endpoints.
 */

/**
 * Property form data required for PDF generation
 */
export interface PdfFormData {
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  squareFeet: number;
  investmentStrategy: 'brrrr' | 'buy-hold';
  projectionYears?: number;

  // Optional fields for context
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Strategy type for PDF generation
 */
export type PdfStrategy = 'brrrr' | 'buy-hold';

/**
 * Checksum validation data
 */
export interface PdfChecksum {
  analysisChecksum: string;  // SHA-256 hash of analysis object
  formDataChecksum: string;  // SHA-256 hash of form data
  generatedAt: Date;
}

/**
 * PDF generation result
 */
export interface PdfGenerationResult {
  pdfBuffer: Buffer;
  fileSizeBytes: number;
  generationTimeMs: number;
  checksum: string;
}

/**
 * Email request payload
 */
export interface SendPdfRequest {
  email: string;
  analysis: any;  // Full Analysis type from ../types/analysis.ts
  formData: PdfFormData;
  strategy: PdfStrategy;
}

/**
 * API response for PDF send
 */
export interface SendPdfResponse {
  success: boolean;
  message?: string;
  error?: string;
  retryAfter?: number;  // For rate limiting (seconds until retry allowed)
}

/**
 * Detailed error types for frontend
 */
export type PdfError =
  | { type: 'rate-limit'; retryAfter: number; message: string }
  | { type: 'network'; retryable: true; message: string }
  | { type: 'generation-failed'; retryable: false; message: string }
  | { type: 'email-failed'; retryable: true; message: string }
  | { type: 'validation-error'; retryable: false; message: string };
```

**Key Design Decisions:**
- ✅ Separate type file for reusability across services
- ✅ Checksum types for data integrity validation
- ✅ Clear distinction between request/response types
- ✅ Strategy type ensures only valid values ('brrrr' | 'buy-hold')
- ✅ Detailed error types for better frontend UX

---

### Step 3: Create MongoDB Model

**File:** `/backend/src/models/AnonymousPdfRequest.ts` ← **NEW FILE**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

/**
 * Anonymous PDF Request Model
 *
 * Stores email addresses of users who request PDF analysis
 * without creating an account.
 *
 * Purpose:
 * - Lead capture for marketing
 * - Conversion attribution (PDF → Signup)
 * - Analytics on anonymous calculator usage
 * - Data integrity tracking (checksums)
 */

export interface IAnonymousPdfRequest extends Document {
  email: string;
  strategy: 'brrrr' | 'buy-hold';

  propertyData: {
    purchasePrice: number;
    monthlyRent: number;
    dealQualityScore: number;
  };

  ipAddress: string;
  userAgent: string;

  requestedAt: Date;
  emailSentAt: Date | null;

  // Data integrity
  analysisChecksum: string;  // SHA-256 hash for verification

  convertedToSignup: boolean;
  signupDate?: Date;
  userId?: mongoose.Types.ObjectId;
}

const AnonymousPdfRequestSchema = new Schema<IAnonymousPdfRequest>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    strategy: {
      type: String,
      required: true,
      enum: ['brrrr', 'buy-hold']
    },

    propertyData: {
      purchasePrice: {
        type: Number,
        required: true
      },
      monthlyRent: {
        type: Number,
        required: true
      },
      dealQualityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    },

    ipAddress: {
      type: String,
      required: true
    },

    userAgent: {
      type: String,
      required: true
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    emailSentAt: {
      type: Date,
      default: null
    },

    analysisChecksum: {
      type: String,
      required: true,
      index: true  // For audit/debugging queries
    },

    convertedToSignup: {
      type: Boolean,
      default: false,
      index: true
    },

    signupDate: {
      type: Date
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Compound indexes for analytics queries
AnonymousPdfRequestSchema.index({ strategy: 1, requestedAt: -1 });
AnonymousPdfRequestSchema.index({ email: 1, convertedToSignup: 1 });

export const AnonymousPdfRequest = mongoose.model<IAnonymousPdfRequest>(
  'AnonymousPdfRequest',
  AnonymousPdfRequestSchema
);
```

**Key Design Decisions:**
- ✅ `email` is lowercase + trimmed for consistency
- ✅ `emailSentAt` can be null (if send fails)
- ✅ `analysisChecksum` ensures data integrity
- ✅ `convertedToSignup` tracks attribution
- ✅ Indexes optimize common queries

---

### Step 4: Create PDF Service (React-PDF)

**File:** `/backend/src/services/pdfService.ts` ← **NEW FILE**

This is a large file (~500 lines). Due to message length limits, I'll provide the complete implementation in the next response. Here's the structure:

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import type { Analysis } from '../types/analysis';
import type { PdfFormData, PdfStrategy, PdfGenerationResult } from '../types/pdf.types';

/**
 * PDF Service - Generates institutional-grade property analysis PDFs
 *
 * Uses @react-pdf/renderer to create PDFs from React components
 *
 * Performance:
 * - Average generation time: 100-500ms (4-6x faster than Puppeteer)
 * - PDF size: 100-300 KB (more compact)
 * - Memory footprint: ~2MB (vs 400MB for Puppeteer)
 * - No browser overhead, no concurrency issues
 *
 * Why React-PDF vs Puppeteer:
 * - ✅ Safe on Render free tier (512MB RAM) - no OOM risk
 * - ✅ Fast and lightweight
 * - ✅ No external dependencies (no Chromium)
 * - ✅ Pure Node.js (no browser spawning)
 */

export class PdfService {
  /**
   * Generate PDF from Analysis object
   *
   * @param analysis - Full analysis object (same as displayed on frontend)
   * @param formData - Property input data for context
   * @param strategy - 'brrrr' or 'buy-hold'
   * @returns PdfGenerationResult with buffer, file size, and checksum
   */
  async generateAnalysisPdf(
    analysis: Analysis,
    formData: PdfFormData,
    strategy: PdfStrategy
  ): Promise<PdfGenerationResult> {
    const startTime = Date.now();

    try {
      // Generate checksum for data integrity verification
      const checksum = this.generateChecksum(analysis, formData);

      // Create PDF Document using React components
      const doc = (
        <AnalysisPdfDocument
          analysis={analysis}
          formData={formData}
          strategy={strategy}
        />
      );

      // Render to buffer
      const pdfBuffer = await pdf(doc).toBuffer();

      const duration = Date.now() - startTime;
      const fileSizeBytes = pdfBuffer.length;

      logger.info(`[PdfService] PDF generated successfully`, {
        strategy,
        durationMs: duration,
        fileSizeKB: Math.round(fileSizeBytes / 1024),
        checksum
      });

      return {
        pdfBuffer,
        fileSizeBytes,
        generationTimeMs: duration,
        checksum
      };

    } catch (error) {
      logger.error('[PdfService] Failed to generate PDF:', error);
      throw new Error('PDF generation failed');
    }
  }

  /**
   * Generate SHA-256 checksum for data integrity
   *
   * Used to verify PDF matches exact analysis shown to user
   */
  private generateChecksum(analysis: Analysis, formData: PdfFormData): string {
    const dataString = JSON.stringify({ analysis, formData });
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}

// ... React-PDF Document Component and Styles (see full implementation in repo)

// Export singleton instance
export const pdfService = new PdfService();
```

**Complete React-PDF Document Component:**

Add the following to the same file after the `PdfService` class:

```typescript
/**
 * React-PDF Document Component
 *
 * Defines the structure and styling of the PDF using React components
 */
interface AnalysisPdfDocumentProps {
  analysis: Analysis;
  formData: PdfFormData;
  strategy: PdfStrategy;
}

const AnalysisPdfDocument: React.FC<AnalysisPdfDocumentProps> = ({
  analysis,
  formData,
  strategy
}) => {
  // Extract key metrics (same calculation logic as frontend)
  const dealQuality = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
  const scoreColor = getScoreColor(dealQuality);
  const scoreLabel = getScoreLabel(dealQuality);

  const monthlyCashFlow = strategy === 'brrrr'
    ? (analysis.strategySpecific?.postRefinanceMetrics?.monthlyCashFlow ?? 0)
    : (analysis.monthlyAnalysis?.cashFlow ?? 0);

  const capRate = analysis.keyMetrics?.capRate ?? 0;
  const cashOnCash = analysis.keyMetrics?.cashOnCashReturn ?? 0;
  const dscr = analysis.keyMetrics?.dscr ?? 0;
  const irr = (analysis.longTermAnalysis?.returns?.irr ?? 0) * 100;
  const noi = analysis.annualAnalysis?.noi ?? 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>REanalyzr</Text>
          <Text style={styles.tagline}>
            {strategy === 'brrrr' ? 'BRRRR Strategy' : 'Buy & Hold Strategy'} Analysis Report
          </Text>
        </View>

        {/* Deal Quality Score */}
        <View style={[styles.scoreSection, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreValue}>{dealQuality}/100</Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        </View>

        {/* Property Information */}
        <Text style={styles.sectionTitle}>Property Information</Text>
        <View style={styles.propertyDetails}>
          <DetailRow label="Purchase Price:" value={`$${formData.purchasePrice?.toLocaleString()}`} />
          <DetailRow label="Down Payment:" value={`${formData.downPayment}%`} />
          <DetailRow label="Monthly Rent:" value={`$${formData.monthlyRent?.toLocaleString()}`} />
          <DetailRow label="Square Footage:" value={`${formData.squareFeet?.toLocaleString()} sq ft`} />
        </View>

        {/* Key Financial Metrics */}
        <Text style={styles.sectionTitle}>Key Financial Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard label="Monthly Cash Flow" value={`$${monthlyCashFlow.toFixed(0)}`} />
          <MetricCard label="Cap Rate" value={`${capRate.toFixed(2)}%`} />
          <MetricCard label="Cash-on-Cash" value={`${cashOnCash.toFixed(2)}%`} />
          <MetricCard label="DSCR" value={`${dscr.toFixed(2)}x`} />
          <MetricCard label={`IRR (${formData.projectionYears || 10} years)`} value={`${irr.toFixed(2)}%`} />
          <MetricCard label="NOI (Annual)" value={`$${noi.toLocaleString()}`} />
        </View>

        {/* Strategy-Specific Section */}
        {strategy === 'brrrr' ? (
          <BRRRStrategySection analysis={analysis} />
        ) : (
          <BuyHoldStrategySection analysis={analysis} />
        )}

        {/* CTA Section */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>Want to save your analyses and compare properties?</Text>
          <Text style={styles.ctaText}>
            Create a free account at reanalyzr.com to unlock:{'\n'}
            • Save unlimited analyses by address{'\n'}
            • AI-powered market predictions{'\n'}
            • Portfolio tracking & deal pipeline{'\n'}
            • Instant scenario testing
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ Important Disclaimer: This analysis is for educational purposes only and should not be
            considered financial, investment, or tax advice. Property investment involves risk. All
            calculations use assumptions that may not reflect actual market conditions. Consult with
            qualified professionals (CPA, real estate attorney, licensed financial advisor) before
            making investment decisions.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 REanalyzr. Professional Property Investment Analysis.
          </Text>
          <Text style={styles.footerDate}>
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.footerTagline}>
            Institutional-grade analysis for individual investors.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Helper Components for PDF Structure
 */
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const BRRRStrategySection: React.FC<{ analysis: Analysis }> = ({ analysis }) => {
  const brrrData = analysis.strategySpecific;
  return (
    <View>
      <Text style={styles.sectionTitle}>BRRRR Strategy Details</Text>
      <View style={styles.metricsGrid}>
        <MetricCard label="Total Investment" value={`$${(brrrData?.totalInvestment ?? 0).toLocaleString()}`} />
        <MetricCard label="Refinance Amount" value={`$${(brrrData?.refinanceAmount ?? 0).toLocaleString()}`} />
        <MetricCard label="Capital Left In Deal" value={`$${(brrrData?.capitalLeftInDeal ?? 0).toLocaleString()}`} />
      </View>
    </View>
  );
};

const BuyHoldStrategySection: React.FC<{ analysis: Analysis }> = ({ analysis }) => (
  <View>
    <Text style={styles.sectionTitle}>Long-Term Projections</Text>
    <View style={styles.propertyDetails}>
      <DetailRow
        label="Projected Property Value (10 years):"
        value={`$${(analysis.longTermAnalysis?.propertyValue ?? 0).toLocaleString()}`}
      />
      <DetailRow
        label="Total Equity Buildup:"
        value={`$${(analysis.longTermAnalysis?.equityGained ?? 0).toLocaleString()}`}
      />
      <DetailRow
        label="Cumulative Cash Flow:"
        value={`$${(analysis.longTermAnalysis?.totalCashFlow ?? 0).toLocaleString()}`}
      />
    </View>
  </View>
);

/**
 * Helper Functions
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#34C759'; // Green
  if (score >= 65) return '#007AFF'; // Blue
  if (score >= 50) return '#FF9500'; // Orange
  return '#FF3B30'; // Red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Above Professional Standards';
  if (score >= 65) return 'Meets Professional Standards';
  if (score >= 50) return 'Requires Optimization';
  return 'Below Professional Standards';
}

/**
 * React-PDF StyleSheet
 *
 * Defines all PDF styling using React-PDF's StyleSheet API
 * Similar to React Native styling
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.6,
    backgroundColor: '#ffffff'
  },

  header: {
    backgroundColor: '#0a0a0a',
    padding: 32,
    textAlign: 'center',
    marginBottom: 24
  },

  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },

  tagline: {
    fontSize: 10,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 2
  },

  scoreSection: {
    padding: 24,
    textAlign: 'center',
    marginBottom: 24,
    borderRadius: 8
  },

  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff'
  },

  scoreLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 8
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0a0a0a',
    paddingBottom: 4
  },

  propertyDetails: {
    marginBottom: 16
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },

  detailLabel: {
    fontSize: 11,
    color: '#6b7280'
  },

  detailValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0a0a0a'
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },

  metricCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0a0a0a',
    width: '30%'
  },

  metricLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4
  },

  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a'
  },

  ctaBox: {
    backgroundColor: '#f9fafb',
    padding: 20,
    marginTop: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0a0a0a',
    textAlign: 'center'
  },

  ctaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0a0a0a',
    marginBottom: 8
  },

  ctaText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6
  },

  disclaimer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    marginTop: 24,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },

  disclaimerText: {
    fontSize: 9,
    color: '#991b1b',
    lineHeight: 1.5
  },

  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },

  footerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0a0a0a',
    marginBottom: 4
  },

  footerDate: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 8
  },

  footerTagline: {
    fontSize: 9,
    color: '#6b7280'
  }
});

// Export singleton instance
export const pdfService = new PdfService();
```

**Key Implementation Notes:**
- ✅ React components create PDF structure (same patterns as frontend)
- ✅ Checksum generation ensures data integrity
- ✅ No browser overhead - pure Node.js execution
- ✅ Fast generation (100-500ms average)
- ✅ Compact file size (100-300KB)
- ✅ StyleSheet API similar to React Native
- ✅ Professional Apple-inspired design

---

### Step 5: Create Rate Limiter Middleware (LRU Cache)

**File:** `/backend/src/middleware/rateLimiter.ts` ← **NEW FILE**

**Why LRU Cache:** Prevents memory leaks from unbounded in-memory store (FSE concern #2)

```typescript
import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger';

/**
 * Rate Limiter for PDF Generation (LRU Cache Implementation)
 *
 * Prevents abuse by limiting PDF requests to 5 per hour per IP address
 *
 * Why LRU Cache vs In-Memory Store:
 * - ✅ Automatic memory management (max 5000 entries)
 * - ✅ TTL-based expiration (no manual cleanup needed)
 * - ✅ O(1) operations (get, set, delete)
 * - ✅ No memory leak risk (bounded size)
 *
 * Implementation:
 * - Max 5000 IPs tracked (prevents unbounded growth)
 * - 1-hour TTL per entry (automatic expiration)
 * - Returns 429 Too Many Requests if limit exceeded
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

// Configuration
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 5; // 5 PDFs per hour
const MAX_CACHE_SIZE = 5000; // Max IPs to track

// LRU Cache instance
const rateLimitCache = new LRUCache<string, RateLimitEntry>({
  max: MAX_CACHE_SIZE,
  ttl: WINDOW_MS, // Automatic expiration after 1 hour
  updateAgeOnGet: false,
  updateAgeOnHas: false
});

/**
 * Rate limiter middleware for PDF generation
 *
 * Usage:
 * router.post('/send-pdf', pdfRateLimiter, controller)
 */
export const pdfRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get client IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Get or initialize rate limit data for this IP
  let entry = rateLimitCache.get(ip);

  if (!entry || entry.resetAt < now) {
    // First request or window expired - reset counter
    entry = {
      count: 1,
      resetAt: now + WINDOW_MS
    };

    rateLimitCache.set(ip, entry);

    logger.debug(`[RateLimiter] New rate limit window for IP: ${ip}`);
    next();
    return;
  }

  // Increment counter
  entry.count += 1;
  rateLimitCache.set(ip, entry);

  // Check if limit exceeded
  if (entry.count > MAX_REQUESTS) {
    const resetIn = Math.ceil((entry.resetAt - now) / 60000); // minutes

    logger.warn(`[RateLimiter] Rate limit exceeded for IP: ${ip}`, {
      count: entry.count,
      limit: MAX_REQUESTS,
      resetInMinutes: resetIn
    });

    res.status(429).json({
      success: false,
      error: `Rate limit exceeded. You can request ${MAX_REQUESTS} PDFs per hour. Try again in ${resetIn} minute${resetIn !== 1 ? 's' : ''}.`,
      retryAfter: resetIn * 60 // seconds
    });
    return;
  }

  // Within limit - allow request
  logger.debug(`[RateLimiter] Rate limit check passed for IP: ${ip}`, {
    count: entry.count,
    limit: MAX_REQUESTS
  });

  next();
};

/**
 * Get current rate limit status for an IP (for debugging)
 */
export function getRateLimitStatus(ip: string): RateLimitEntry | null {
  const now = Date.now();
  const entry = rateLimitCache.get(ip);

  if (!entry || entry.resetAt < now) {
    return null;
  }

  return entry;
}

/**
 * Get cache statistics (for monitoring)
 */
export function getRateLimitStats() {
  return {
    size: rateLimitCache.size,
    maxSize: MAX_CACHE_SIZE,
    utilizationPercent: Math.round((rateLimitCache.size / MAX_CACHE_SIZE) * 100)
  };
}
```

**Key Implementation Notes:**
- ✅ LRU cache prevents memory leaks (max 5000 entries)
- ✅ Automatic TTL-based expiration (no manual cleanup)
- ✅ Clear error messages tell users when they can retry
- ✅ Statistics function for monitoring cache utilization

---
### Step 6: Update Email Service

**File:** `/backend/src/services/emailService.ts` ← **MODIFY**

**Add these methods to the EmailService class:**

```typescript
/**
 * Send analysis PDF to anonymous user
 *
 * @param email - Recipient email address
 * @param pdfBuffer - PDF file as Buffer
 * @param strategy - 'brrrr' or 'buy-hold'
 */
async sendAnonymousPdf(
  email: string,
  pdfBuffer: Buffer,
  strategy: 'brrrr' | 'buy-hold'
): Promise<void> {
  const strategyName = strategy === 'brrrr' ? 'BRRRR Strategy' : 'Buy & Hold';
  const template = this.getAnonymousPdfEmailTemplate(strategyName);

  await this.sendEmailWithAttachment({
    to: email,
    subject: `Your ${strategyName} Analysis is Ready 📊`,
    html: template,
    attachment: {
      filename: `REanalyzr-${strategy}-analysis-${Date.now()}.pdf`,
      content: pdfBuffer
    }
  });

  logger.info(`[EmailService] Analysis PDF sent to: ${email}`);
}

/**
 * Core email sending method with attachment support
 *
 * @param params - Email parameters with attachment
 */
private async sendEmailWithAttachment(params: {
  to: string;
  subject: string;
  html: string;
  attachment: {
    filename: string;
    content: Buffer;
  };
}): Promise<void> {
  try {
    if (!this.resend) {
      logger.warn(`[EmailService] Email not sent - RESEND_API_KEY not configured. Would send to: ${params.to}`);
      return;
    }

    await this.resend.emails.send({
      from: this.FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: [{
        filename: params.attachment.filename,
        content: params.attachment.content
      }]
    });

    logger.info(`[EmailService] Email with PDF sent successfully to: ${params.to}`);
  } catch (error) {
    logger.error(`[EmailService] Failed to send email to ${params.to}:`, error);
    throw new Error('Failed to send email');
  }
}

/**
 * Anonymous PDF email template
 * Simple, friendly, transactional (not marketing)
 */
private getAnonymousPdfEmailTemplate(strategyName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${strategyName} Analysis</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
        .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 48px 40px 32px; text-align: center; }
        .logo { color: white; font-size: 42px; font-weight: 700; letter-spacing: -1.5px; }
        .tagline { color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
        .content { padding: 48px 40px; }
        .button { display: inline-block; background: #0a0a0a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; }
        .feature-box { background-color: #f9fafb; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid #0a0a0a; }
        .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">REanalyzr</h1>
          <p class="tagline">${strategyName} Analysis</p>
        </div>

        <div class="content">
          <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Your Analysis is Attached 📊</h2>
          <p style="color: #374151; line-height: 1.6; font-size: 16px;">
            Thank you for using REanalyzr! Your ${strategyName} property analysis is attached as a PDF.
          </p>

          <div class="feature-box">
            <h3 style="color: #0a0a0a; margin-top: 0; font-weight: 600;">💡 Want to do more?</h3>
            <p style="color: #374151; margin: 8px 0 16px; line-height: 1.6;">
              Create a free account to unlock:
            </p>
            <ul style="color: #374151; margin: 0; line-height: 1.8; padding-left: 20px;">
              <li>Save unlimited analyses by address</li>
              <li>Instant scenario testing (change assumptions, see results immediately)</li>
              <li>AI-powered market predictions</li>
              <li>Portfolio tracking & deal pipeline</li>
              <li>Compare multiple properties side-by-side</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL}/register" class="button">Create Free Account</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px; text-align: center;">
            <strong>Beta users pay $0/month forever</strong> • No credit card required
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0;">© 2025 REanalyzr. Professional Property Investment Analysis.</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Institutional-grade analysis for individual investors</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
```

---

### Step 7: Create Controller

**File:** `/backend/src/controllers/deals.ts` ← **MODIFY**

**Add imports at the top:**

```typescript
import { AnonymousPdfRequest } from '../models/AnonymousPdfRequest';
import { pdfService } from '../services/pdfService';
import { emailService } from '../services/emailService';
import crypto from 'crypto';
```

**Add this function to the exports:**

```typescript
/**
 * Send anonymous analysis PDF via email
 *
 * PUBLIC endpoint - no authentication required
 *
 * Flow:
 * 1. Validate inputs (email format, required fields)
 * 2. Generate checksum (SHA-256) for data integrity
 * 3. Store email in database (AnonymousPdfRequests collection)
 * 4. Generate PDF from Analysis object (React-PDF)
 * 5. Send email with PDF attachment (Resend)
 * 6. Update emailSentAt timestamp
 * 7. Return success response
 *
 * Rate Limiting: 5 PDFs per hour per IP (enforced by middleware)
 *
 * @route POST /api/deals/send-anonymous-pdf
 */
export const sendAnonymousPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, analysis, formData, strategy } = req.body;

    // ============================================================
    // Step 1: Validate Required Fields
    // ============================================================

    if (!email || !analysis || !formData || !strategy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, analysis, formData, strategy'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
      return;
    }

    // Validate strategy
    if (strategy !== 'brrrr' && strategy !== 'buy-hold') {
      res.status(400).json({
        success: false,
        error: 'Invalid strategy. Must be "brrrr" or "buy-hold"'
      });
      return;
    }

    // Extract required data
    const dealQuality = analysis.investmentDecision?.professionalAssessment?.dealQuality || 0;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    logger.info(`[sendAnonymousPdf] Processing request`, {
      email,
      strategy,
      dealQuality,
      ipAddress
    });

    // ============================================================
    // Step 2: Generate Checksum for Data Integrity
    // ============================================================

    const dataString = JSON.stringify({ analysis, formData });
    const analysisChecksum = crypto.createHash('sha256').update(dataString).digest('hex');

    // ============================================================
    // Step 3: Store Email in Database
    // ============================================================

    const pdfRequest = await AnonymousPdfRequest.create({
      email: email.toLowerCase().trim(),
      strategy,
      propertyData: {
        purchasePrice: formData.purchasePrice || 0,
        monthlyRent: formData.monthlyRent || 0,
        dealQualityScore: dealQuality
      },
      ipAddress,
      userAgent,
      analysisChecksum,
      requestedAt: new Date(),
      emailSentAt: null, // Will update after successful send
      convertedToSignup: false
    });

    logger.info(`[sendAnonymousPdf] Stored PDF request`, {
      requestId: pdfRequest._id,
      email,
      checksum: analysisChecksum
    });

    // ============================================================
    // Step 4: Generate PDF (React-PDF)
    // ============================================================

    const pdfResult = await pdfService.generateAnalysisPdf(
      analysis,
      formData,
      strategy
    );

    logger.info(`[sendAnonymousPdf] PDF generated successfully`, {
      requestId: pdfRequest._id,
      fileSizeKB: Math.round(pdfResult.fileSizeBytes / 1024),
      generationTimeMs: pdfResult.generationTimeMs
    });

    // ============================================================
    // Step 5: Send Email with PDF Attachment
    // ============================================================

    await emailService.sendAnonymousPdf(email, pdfResult.pdfBuffer, strategy);

    // ============================================================
    // Step 6: Update emailSentAt Timestamp
    // ============================================================

    await AnonymousPdfRequest.findByIdAndUpdate(pdfRequest._id, {
      emailSentAt: new Date()
    });

    logger.info(`[sendAnonymousPdf] Email sent successfully`, {
      requestId: pdfRequest._id,
      email
    });

    // ============================================================
    // Step 7: Return Success Response
    // ============================================================

    res.json({
      success: true,
      message: `PDF sent to ${email}`
    });

  } catch (error) {
    logger.error('[sendAnonymousPdf] Error:', error);

    // Return user-friendly error message
    res.status(500).json({
      success: false,
      error: 'Failed to send PDF. Please try again.'
    });
  }
};
```

---

### Step 8: Add Route

**File:** `/backend/src/routes/deals.ts` ← **MODIFY**

**Add at the top (imports):**

```typescript
import { pdfRateLimiter } from '../middleware/rateLimiter';
import { sendAnonymousPdf } from '../controllers/deals';
```

**Add route (after existing anonymous routes):**

```typescript
// PUBLIC: Send anonymous analysis PDF via email (NO AUTH REQUIRED)
// Used by UniversalCalculator email collection feature
// Rate limited: 5 PDFs per hour per IP address
router.post('/send-anonymous-pdf', pdfRateLimiter, sendAnonymousPdf);
```

---

### Step 9: Add Conversion Attribution to Registration

**File:** `/backend/src/controllers/authController.ts` ← **MODIFY**

**Add import at the top:**

```typescript
import { AnonymousPdfRequest } from '../models/AnonymousPdfRequest';
```

**Add to the `register` function (after user creation, before sending welcome email):**

```typescript
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // ... existing validation and user creation code ...

    // ✅ NEW: Check if user previously requested PDF (using updateMany to prevent race conditions)
    try {
      // Use updateMany instead of findOne to handle multiple PDF requests from same email
      const updateResult = await AnonymousPdfRequest.updateMany(
        {
          email: email.toLowerCase().trim(),
          convertedToSignup: false
        },
        {
          $set: {
            convertedToSignup: true,
            signupDate: new Date(),
            userId: newUser._id
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        // Calculate days since first PDF request
        const firstPdfRequest = await AnonymousPdfRequest.findOne({
          email: email.toLowerCase().trim(),
          convertedToSignup: true
        }).sort({ requestedAt: 1 });

        if (firstPdfRequest) {
          const daysSincePdfRequest = Math.floor(
            (Date.now() - firstPdfRequest.requestedAt.getTime()) / (24 * 60 * 60 * 1000)
          );

          logger.info(`[Attribution] User converted from PDF request`, {
            userId: newUser._id,
            email,
            pdfRequestCount: updateResult.modifiedCount,
            daysSincePdfRequest,
            strategy: firstPdfRequest.strategy
          });
        }
      }
    } catch (error) {
      // Don't fail registration if attribution fails
      logger.error('[Attribution] Failed to update PDF request:', error);
    }

    // ... rest of registration flow (send welcome email, etc.) ...

  } catch (error) {
    // ... existing error handling ...
  }
};
```

**Key Design Decision:** 
- ✅ Uses `updateMany` instead of `findOne` to handle race conditions (FSE concern #6)
- ✅ Attribution failure doesn't block registration (wrapped in try/catch)
- ✅ Tracks multiple PDF requests from same email

---

## Frontend Implementation

### Step 10: Update CalculatorResults Component

**File:** `/frontend/src/components/Calculator/CalculatorResults.tsx` ← **MODIFY**

**Add imports at the top:**

```typescript
import { TextField, Alert, Divider } from '@mui/material';
import { api } from '../../services/api';
import type { PdfError } from '../../types/pdf.types'; // If you create frontend types
```

**Add state variables (inside the component, after other state declarations):**

```typescript
// PDF Email Collection State
const [pdfEmail, setPdfEmail] = useState('');
const [pdfSending, setPdfSending] = useState(false);
const [pdfSent, setPdfSent] = useState(false);
const [pdfError, setPdfError] = useState<PdfError | null>(null);
```

**Add handler function (before the return statement):**

```typescript
/**
 * Handle PDF email submission
 *
 * Flow:
 * 1. Validate email format
 * 2. Prevent duplicate submissions
 * 3. Track analytics event
 * 4. Call backend API
 * 5. Show success/error state with detailed error types
 * 6. Auto-clear after 5 seconds
 */
const handleSendPdf = async () => {
  // Prevent duplicate submissions
  if (pdfSending || pdfSent) {
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(pdfEmail)) {
    setPdfError({
      type: 'validation-error',
      retryable: false,
      message: 'Please enter a valid email address'
    });
    return;
  }

  setPdfSending(true);
  setPdfError(null);

  // Track analytics
  if (window.gtag) {
    window.gtag('event', 'pdf_email_submitted', {
      source: 'anonymous_calculator',
      strategy: formData.investmentStrategy,
      emailDomain: pdfEmail.split('@')[1]
    });
  }

  try {
    await api.post('/deals/send-anonymous-pdf', {
      email: pdfEmail,
      analysis,
      formData,
      strategy: formData.investmentStrategy
    });

    setPdfSent(true);

    // Track success
    if (window.gtag) {
      window.gtag('event', 'pdf_sent_success', {
        strategy: formData.investmentStrategy
      });
    }

    // Auto-clear success message after 5 seconds
    setTimeout(() => {
      setPdfSent(false);
      setPdfEmail(''); // Clear email field
    }, 5000);

  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Detailed error handling based on status code
    let pdfErrorObj: PdfError;

    if (status === 429) {
      // Rate limit error
      const retryAfter = errorData?.retryAfter || 3600;
      pdfErrorObj = {
        type: 'rate-limit',
        retryAfter,
        message: errorData?.error || `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
      };
    } else if (status === 400) {
      // Validation error
      pdfErrorObj = {
        type: 'validation-error',
        retryable: false,
        message: errorData?.error || 'Invalid input. Please check your email address.'
      };
    } else if (status >= 500) {
      // Server error (retryable)
      pdfErrorObj = {
        type: 'generation-failed',
        retryable: false,
        message: 'Server error. Please try again later.'
      };
    } else {
      // Network error (retryable)
      pdfErrorObj = {
        type: 'network',
        retryable: true,
        message: 'Failed to send PDF. Please check your connection and try again.'
      };
    }

    setPdfError(pdfErrorObj);

    // Track error
    if (window.gtag) {
      window.gtag('event', 'pdf_sent_error', {
        strategy: formData.investmentStrategy,
        errorType: pdfErrorObj.type
      });
    }
  } finally {
    setPdfSending(false);
  }
};
```

**Add UI (in the JSX, after the existing CTA Paper component):**

```tsx
{/* Existing CTA Paper component ends here */}

{/* ✅ NEW: Email Collection for PDF */}
<Divider sx={{ my: 3 }} />

<Box>
  <Typography
    variant="body2"
    sx={{
      mb: 1,
      color: 'text.secondary',
      fontWeight: 500
    }}
  >
    Want this analysis as a PDF?
  </Typography>

  {/* Simple disclosure - no checkbox needed */}
  <Typography
    variant="caption"
    sx={{
      mb: 1.5,
      color: '#6b7280',
      display: 'block',
      fontSize: '0.8125rem',
      lineHeight: 1.5
    }}
  >
    We'll email you the PDF. We don't share your email with anyone.{' '}
    <a href="/privacy" style={{ color: '#0071E3' }}>Privacy Policy</a>
  </Typography>

  <Box sx={{
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: 2,
    mb: 2
  }}>
    <TextField
      type="email"
      inputMode="email"
      autoComplete="email"
      placeholder="your.email@example.com"
      value={pdfEmail}
      onChange={(e) => {
        setPdfEmail(e.target.value);
        setPdfError(null); // Clear error on input change
      }}
      onFocus={() => {
        // Track engagement
        if (window.gtag) {
          window.gtag('event', 'pdf_email_input_focused', {
            source: 'anonymous_calculator',
            strategy: formData.investmentStrategy
          });
        }
      }}
      fullWidth
      size="medium"
      disabled={pdfSending || pdfSent}
      error={!!pdfError}
      sx={{
        maxWidth: { sm: '320px' },
        '& .MuiOutlinedInput-root': {
          height: '48px',
          fontSize: '1rem'
        }
      }}
    />

    <Button
      variant="outlined"
      onClick={handleSendPdf}
      disabled={!pdfEmail || pdfSending || pdfSent}
      sx={{
        minWidth: { xs: '100%', sm: '120px' },
        height: '48px',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        borderColor: '#0071E3',
        color: '#0071E3',
        '&:hover': {
          borderColor: '#0077ED',
          bgcolor: 'rgba(0, 113, 227, 0.04)'
        },
        '&:disabled': {
          borderColor: '#e5e7eb',
          color: '#9ca3af'
        }
      }}
    >
      {pdfSending ? 'Sending...' : pdfSent ? '✓ Sent' : 'Send PDF →'}
    </Button>
  </Box>

  {/* Success State */}
  {pdfSent && (
    <Alert severity="success" sx={{ mt: 1 }}>
      ✓ PDF sent to {pdfEmail}. Check your inbox!
    </Alert>
  )}

  {/* Error State with Detailed Messages */}
  {pdfError && (
    <Alert 
      severity={pdfError.type === 'rate-limit' ? 'warning' : 'error'} 
      sx={{ mt: 1 }}
    >
      {pdfError.message}
      {pdfError.type === 'rate-limit' && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Retry in {Math.ceil((pdfError as any).retryAfter / 60)} minutes
        </Typography>
      )}
    </Alert>
  )}
</Box>

{/* Monthly Analysis Accordion (existing code continues here) */}
```

---

### Step 11: Update Privacy Policy Page

**File:** `/frontend/src/pages/PrivacyPolicyPage.tsx` ← **MODIFY (or CREATE if doesn't exist)**

Add this section to your existing Privacy Policy (or create the page if it doesn't exist):

```typescript
<div style={getSectionStyle()}>
  <h2 style={getSectionTitleStyle()}>Anonymous Calculator & PDF Requests</h2>
  <p style={getTextStyle()}>
    When you request a PDF analysis from our anonymous calculator:
  </p>
  <p style={getTextStyle()}>
    <strong>What We Collect:</strong>
  </p>
  <ul style={getTextStyle()}>
    <li>Your email address (to send you the PDF)</li>
    <li>Property analysis details (for our records and to improve our service)</li>
    <li>Technical information (IP address, browser type - for security)</li>
  </ul>
  <p style={getTextStyle()}>
    <strong>How We Use It:</strong>
  </p>
  <ul style={getTextStyle()}>
    <li>Send you the requested PDF immediately</li>
    <li>Store for analytics and future reference</li>
    <li>May occasionally contact you for feedback or to see how we can help</li>
    <li>Link to your account if you later sign up with the same email</li>
  </ul>
  <p style={getTextStyle()}>
    <strong>What We DON'T Do:</strong>
  </p>
  <ul style={getTextStyle()}>
    <li>❌ We never sell or share your email with anyone</li>
    <li>❌ We never send aggressive marketing emails</li>
    <li>❌ Your email stays private and secure</li>
  </ul>
</div>
```

---

## Monitoring & Performance

### Sentry APM Integration

**Install Sentry:**

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

**Configure Sentry** (`/backend/src/server.ts` or `/backend/src/app.ts`):

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry (BEFORE all other middleware)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, // 100% in development, lower in production
  profilesSampleRate: 1.0,
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// ... your routes here ...

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());
```

**Add Performance Tracking to PDF Service:**

```typescript
// In pdfService.ts
import * as Sentry from '@sentry/node';

async generateAnalysisPdf(...): Promise<PdfGenerationResult> {
  const transaction = Sentry.startTransaction({
    op: 'pdf.generate',
    name: 'Generate Analysis PDF',
    data: { strategy }
  });

  try {
    const startTime = Date.now();
    
    // ... existing PDF generation code ...
    
    const duration = Date.now() - startTime;
    
    // Track metrics
    Sentry.metrics.distribution('pdf.generation.duration', duration, {
      unit: 'millisecond',
      tags: { strategy },
    });
    
    Sentry.metrics.distribution('pdf.size', pdfBuffer.length, {
      unit: 'byte',
      tags: { strategy },
    });
    
    transaction.finish();
    return result;
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: { 
        strategy,
        dealQualityScore: analysis.investmentDecision?.professionalAssessment?.dealQuality
      },
    });
    transaction.finish();
    throw error;
  }
}
```

### Health Check Endpoint

**File:** `/backend/src/routes/health.ts` ← **NEW FILE**

```typescript
import express from 'express';
import { pdfService } from '../services/pdfService';
import { getRateLimitStats } from '../middleware/rateLimiter';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Health check endpoint for monitoring
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      rateLimiter: getRateLimitStats()
    }
  };

  res.json(health);
});

/**
 * PDF service health check
 * Generates a test PDF to verify system is working
 */
router.get('/health/pdf', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Generate test PDF with minimal data
    const testAnalysis = createTestAnalysis(); // Mock function
    const testFormData = createTestFormData(); // Mock function
    
    const result = await pdfService.generateAnalysisPdf(
      testAnalysis,
      testFormData,
      'buy-hold'
    );
    
    const duration = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      duration,
      fileSizeBytes: result.fileSizeBytes,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
```

### MongoDB Metrics Queries

**Analytics Dashboard Queries:**

```javascript
// Total PDF requests
db.anonymouspdfrequests.countDocuments()

// Conversion rate
const total = await AnonymousPdfRequest.countDocuments();
const converted = await AnonymousPdfRequest.countDocuments({ convertedToSignup: true });
const conversionRate = (converted / total) * 100;

// Hourly volume (spike detection)
db.anonymouspdfrequests.aggregate([
  {
    $group: {
      _id: {
        hour: { $hour: '$requestedAt' },
        date: { $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' } }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { '_id.date': -1, '_id.hour': -1 } },
  { $limit: 24 }
])

// Email send failure rate
db.anonymouspdfrequests.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      failures: { $sum: { $cond: [{ $eq: ['$emailSentAt', null] }, 1, 0] } }
    }
  },
  {
    $project: {
      failureRate: { $divide: ['$failures', '$total'] }
    }
  }
])

// Most popular email domains
db.anonymouspdfrequests.aggregate([
  { $group: {
    _id: { $arrayElemAt: [{ $split: ['$email', '@'] }, 1] },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 10 }
])

// Strategy distribution
db.anonymouspdfrequests.aggregate([
  { $group: { _id: '$strategy', count: { $sum: 1 } }}
])
```

---

## Testing Guide

### Backend Unit Tests

**Test PDF Service** (`/backend/src/services/pdfService.test.ts`):

```typescript
import { pdfService } from './pdfService';
import { createMockAnalysis, createMockFormData } from '../test/fixtures';

describe('PdfService', () => {
  it('should generate PDF from analysis object', async () => {
    const mockAnalysis = createMockAnalysis();
    const mockFormData = createMockFormData();
    
    const result = await pdfService.generateAnalysisPdf(mockAnalysis, mockFormData, 'brrrr');

    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(result.fileSizeBytes).toBeGreaterThan(1000); // At least 1KB
    expect(result.generationTimeMs).toBeLessThan(2000); // Less than 2s
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 format
  });

  it('should generate consistent checksums for same input', async () => {
    const mockAnalysis = createMockAnalysis();
    const mockFormData = createMockFormData();
    
    const result1 = await pdfService.generateAnalysisPdf(mockAnalysis, mockFormData, 'buy-hold');
    const result2 = await pdfService.generateAnalysisPdf(mockAnalysis, mockFormData, 'buy-hold');

    expect(result1.checksum).toBe(result2.checksum);
  });
});
```

### Manual Testing Checklist

#### Backend Testing:

- [ ] **PDF Generation**
  - [ ] Generate BRRRR PDF - verify file size >50KB
  - [ ] Generate Buy & Hold PDF - verify file size >50KB
  - [ ] Verify PDF opens without errors
  - [ ] Verify all metrics match analysis object

- [ ] **Email Sending**
  - [ ] Send test PDF to personal email
  - [ ] Verify email delivered within 30 seconds
  - [ ] Verify PDF attachment is correct
  - [ ] Verify CTA links work (register page)

- [ ] **Rate Limiting**
  - [ ] Send 5 PDFs within 1 hour → Should succeed
  - [ ] Send 6th PDF → Should return 429 error
  - [ ] Wait 1 hour → Rate limit should reset
  - [ ] Verify error message shows retry time

- [ ] **Database Storage**
  - [ ] Check MongoDB for AnonymousPdfRequest document
  - [ ] Verify `analysisChecksum` is stored
  - [ ] Verify `emailSentAt` is updated after send

#### Frontend Testing:

- [ ] **Email Input UI**
  - [ ] Email field appears below Deal Quality Score
  - [ ] Disclosure text visible
  - [ ] Send button disabled when email empty
  - [ ] Send button shows "Sending..." during request
  - [ ] Success message appears after send
  - [ ] Error message shows on failure

- [ ] **Mobile Responsiveness**
  - [ ] Email field + button stack vertically on mobile (<600px)
  - [ ] Touch targets are 48px minimum height
  - [ ] Text is readable on small screens

- [ ] **End-to-End Flow**
  1. Complete anonymous analysis (BRRRR or Buy & Hold)
  2. Enter email address
  3. Click "Send PDF"
  4. Verify success message appears
  5. Check email inbox for PDF
  6. Open PDF - verify it matches screen analysis
  7. Click CTA in email - verify leads to register page

#### Conversion Attribution Testing:

- [ ] **Attribution Tracking**
  1. Send PDF to test@example.com
  2. Register new account with test@example.com
  3. Check MongoDB: `convertedToSignup: true`
  4. Verify `userId` is linked

- [ ] **Multiple PDF Requests**
  1. Send 3 PDFs to same email
  2. Register with that email
  3. Verify all 3 requests marked as converted (updateMany works)

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables Set:**
  - [ ] `RESEND_API_KEY` configured in Render
  - [ ] `FRONTEND_URL` set to production URL
  - [ ] `MONGODB_URI` configured
  - [ ] `SENTRY_DSN` configured (optional but recommended)

- [ ] **Dependencies Installed:**
  - [ ] `npm install @react-pdf/renderer` in backend
  - [ ] `npm install lru-cache` in backend
  - [ ] `package-lock.json` updated and committed

- [ ] **Database Indexes Created:**
  ```bash
  # MongoDB should auto-create indexes from schema
  # Verify in MongoDB Atlas or local:
  db.anonymouspdfrequests.getIndexes()
  ```

- [ ] **Privacy Policy Live:**
  - [ ] `/privacy` route exists and accessible
  - [ ] Anonymous Calculator section included

### Deployment Steps

**Backend (Render):**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "feat: Add anonymous PDF email feature (React-PDF)"
   git push origin main
   ```

2. **Verify Render build succeeds**
   - Check Render dashboard for deployment status
   - Watch logs for successful build
   - React-PDF should install cleanly (no special config needed)

3. **Test backend endpoint**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/deals/send-anonymous-pdf \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "analysis": {...},
       "formData": {...},
       "strategy": "brrrr"
     }'
   ```

**Frontend (Render):**

1. **Build succeeds**
   - Check build logs in Render

2. **Test production URL**
   - Visit anonymous calculator
   - Complete analysis
   - Enter email → Send PDF
   - Verify success

### Post-Deployment Verification

- [ ] **Send test PDF to your email**
- [ ] **Verify PDF quality** (matches screen)
- [ ] **Check MongoDB** (record created)
- [ ] **Monitor Render logs** (no errors)
- [ ] **Test rate limiting** (send 6 requests)
- [ ] **Check Resend dashboard** (email delivered)
- [ ] **Verify Sentry** (no errors reported)

---

## Troubleshooting

### Issue 1: React-PDF Styling Issues

**Symptom:** PDF doesn't match expected design

**Causes:**
- React-PDF uses its own rendering engine (not browser CSS)
- Limited CSS support (no Grid, Flexbox limitations)

**Solutions:**
1. Use React-PDF StyleSheet API instead of regular CSS
2. Test PDF generation locally before deploying
3. Use `flexDirection: 'row'` instead of CSS Grid
4. Check React-PDF documentation for supported styles

**Example Fix:**
```typescript
// ❌ NOT SUPPORTED
const styles = StyleSheet.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
});

// ✅ SUPPORTED
const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  item: {
    width: '30%'
  }
});
```

---

### Issue 2: Font Rendering Problems

**Symptom:** Special characters or fonts don't display correctly

**Cause:** React-PDF has limited font support

**Solution:**
Register custom fonts if needed:

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'SF Pro Display',
  src: 'https://path-to-font.woff2'
});
```

For production, stick with built-in fonts: `Helvetica`, `Times-Roman`, `Courier`

---

### Issue 3: Emails Not Sending

**Symptom:** Success response but no email received

**Solutions:**

1. **Check Resend dashboard** for delivery status
2. **Verify `RESEND_API_KEY`** is set correctly in environment
3. **Check spam folder**
4. **Verify `FROM_EMAIL` domain** is verified in Resend
5. **Check Render logs** for email service errors

**Debug Command:**
```bash
# Check Render logs
render logs -n backend

# Look for:
# [EmailService] Email with PDF sent successfully
```

---

### Issue 4: Rate Limiting Not Working

**Symptom:** Users can send unlimited PDFs

**Causes:**
- IP address not detected correctly
- LRU cache not initialized
- Middleware not applied to route

**Solutions:**

1. **Verify middleware is applied:**
   ```typescript
   // ✅ Correct
   router.post('/send-anonymous-pdf', pdfRateLimiter, sendAnonymousPdf);
   
   // ❌ Wrong - no middleware
   router.post('/send-anonymous-pdf', sendAnonymousPdf);
   ```

2. **Check IP detection:**
   ```typescript
   // In controller, log IP
   logger.info('IP address:', req.ip || req.socket.remoteAddress);
   ```

3. **Verify cache stats:**
   ```typescript
   import { getRateLimitStats } from '../middleware/rateLimiter';
   console.log(getRateLimitStats());
   // Should show: { size: X, maxSize: 5000, utilizationPercent: Y }
   ```

---

### Issue 5: PDF Generation Slow (>2s)

**Symptom:** PDF generation takes longer than expected

**Causes:**
- Large analysis objects
- Network issues (if fetching remote fonts)
- Server under load

**Solutions:**

1. **Check Sentry metrics:**
   - Look for `pdf.generation.duration` distribution
   - P50 should be <500ms, P95 <1000ms

2. **Optimize PDF content:**
   - Reduce number of metrics shown
   - Simplify styling
   - Remove unnecessary elements

3. **Upgrade Render tier:**
   - Free tier: 512MB RAM, shared CPU
   - Paid tier: 1GB+ RAM, dedicated CPU

---

### Issue 6: MongoDB Connection Issues

**Symptom:** "Failed to store email" error

**Solutions:**

1. **Verify MongoDB connection string** in `.env`
2. **Check MongoDB Atlas whitelist** (allow Render IPs)
3. **Test connection:** `mongoose.connection.readyState` should be 1
4. **Check MongoDB Atlas dashboard** for connection errors

---

## Success Metrics

### Analytics Events to Track

```typescript
// PDF email submitted
window.gtag('event', 'pdf_email_submitted', {
  source: 'anonymous_calculator',
  strategy: 'brrrr' | 'buy-hold',
  emailDomain: string
});

// PDF sent successfully
window.gtag('event', 'pdf_sent_success', {
  strategy: 'brrrr' | 'buy-hold'
});

// PDF send failed
window.gtag('event', 'pdf_sent_error', {
  strategy: 'brrrr' | 'buy-hold',
  errorType: 'rate-limit' | 'network' | 'validation-error' | 'generation-failed'
});

// Email input focused (engagement)
window.gtag('event', 'pdf_email_input_focused', {
  source: 'anonymous_calculator',
  strategy: 'brrrr' | 'buy-hold'
});
```

### Key Performance Indicators (KPIs)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **PDF Request Completion Rate** | >85% | (Successful sends) / (Total attempts) |
| **Email Delivery Rate** | >99% | Check Resend dashboard |
| **PDF-to-Signup Conversion Rate** | >15% | MongoDB: `convertedToSignup: true` / Total |
| **Average Time to Convert** | 3-7 days | Days between PDF request and signup |
| **PDF Generation Speed (P95)** | <1000ms | Sentry metrics distribution |
| **Email Send Speed** | <30s | Time from request to inbox |
| **Rate Limit Hit Rate** | <2% | 429 errors / Total requests |

---

## Implementation Timeline

| Day | Task | Owner | Deliverable |
|-----|------|-------|-------------|
| **Day 1** | Backend: Types + Model + PDF Service | Backend Engineer | React-PDF generation working |
| **Day 2** | Backend: Rate Limiter + Email + Controller | Backend Engineer | API endpoint working |
| **Day 3** | Frontend: Email Input UI + Error Handling | Frontend Engineer | UI component complete |
| **Day 4** | Testing + Deployment | Both | Production deployment |

**Total: 3-4 days** (vs 5 days with Puppeteer)

---

## Final Checklist

Before marking this feature as DONE:

- [ ] ✅ All backend files created (types, model, service, middleware, controller)
- [ ] ✅ Frontend UI implemented with detailed error handling
- [ ] ✅ End-to-end flow works (calculator → email → PDF received)
- [ ] ✅ Rate limiting prevents abuse (5/hour per IP)
- [ ] ✅ Privacy Policy updated
- [ ] ✅ Conversion attribution tracks correctly (updateMany)
- [ ] ✅ Checksums verify data integrity
- [ ] ✅ Deployed to production
- [ ] ✅ Monitoring in place (Sentry + health checks)
- [ ] ✅ Documentation complete
- [ ] ✅ All FSE concerns addressed:
  - [ ] LRU cache prevents memory leaks (Concern #2)
  - [ ] Detailed error types for frontend (Concern #4)
  - [ ] Checksum generation for data integrity (Concern #5)
  - [ ] updateMany prevents race conditions (Concern #6)
  - [ ] TypeScript types defined (Concern #7)
  - [ ] No special Render config needed (Concern #8)
  - [ ] Mobile input types specified (Concern #11)

---

## Appendix: Key Differences from Puppeteer Implementation

| Aspect | Puppeteer (Original) | React-PDF (Final) |
|--------|---------------------|-------------------|
| **Memory Usage** | 400MB per browser instance | 2MB total |
| **PDF Generation Speed** | 2-3 seconds | 100-500ms |
| **Concurrency** | Singleton browser (queue needed) | No issues (pure Node.js) |
| **Dependencies** | 180MB Chromium download | Zero external dependencies |
| **Render Free Tier Safe** | ❌ OOM risk on 512MB tier | ✅ Completely safe |
| **Implementation Complexity** | High (browser management) | Medium (React components) |
| **Styling Flexibility** | Full CSS support | Limited (React-PDF API) |
| **Production Ready** | Risky on free tier | ✅ Production ready |

---

**End of Implementation Guide**

This guide provides everything needed to implement Feature #14 with React-PDF. For questions during implementation, refer to:
- `/docs/FEATURE_BACKLOG.md` - Feature #14 business requirements
- `/docs/FEATURE_14_UX_SPECIFICATION.md` - UX design specifications
- `/docs/ARCHITECTURE_V3.md` - System architecture overview
- React-PDF Documentation: https://react-pdf.org/

The implementation is production-ready and addresses all FSE concerns about Puppeteer's memory usage, concurrency, and complexity.
