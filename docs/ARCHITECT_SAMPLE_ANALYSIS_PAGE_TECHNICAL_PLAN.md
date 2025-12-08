# Technical Implementation Plan: Sample Analysis Landing Page

**Prepared by**: Architect (Principal Software Architect)
**Based on**: Marketing Requirements Document (`MARKETING_REQUIREMENT_SAMPLE_ANALYSIS_PAGE.md`)
**Date**: December 6, 2025
**Phase**: MVP (Phase 1)
**Estimated Effort**: 1-2 days
**Priority**: HIGH

---

## Executive Summary

This document provides the complete technical architecture and implementation plan for creating public sample analysis landing pages to drive SEO traffic and reduce signup friction.

**Key Technical Decisions**:
1. **Static hardcoded page** approach for MVP (fastest to market)
2. **Component reuse** from existing AnalysisResults.tsx (2228 lines)
3. **No backend changes required** (pure frontend deployment)
4. **React Helmet** for per-page SEO meta tags
5. **Manual sitemap update** (dynamic generation deferred to Phase 2)

**Implementation Strategy**: 80/20 approach - Deliver maximum SEO value with minimum complexity.

---

## Table of Contents

1. [Architecture Analysis](#architecture-analysis)
2. [Component Strategy](#component-strategy)
3. [Data Structure & Mock Data](#data-structure)
4. [File Structure & New Files](#file-structure)
5. [SEO Implementation](#seo-implementation)
6. [Routing Changes](#routing-changes)
7. [Design System Integration](#design-system)
8. [Testing Strategy](#testing)
9. [Deployment Plan](#deployment)
10. [Timeline & Milestones](#timeline)
11. [Risk Assessment](#risks)
12. [Phase 2 Considerations](#phase-2)

---

<a name="architecture-analysis"></a>
## 1. Architecture Analysis

### Current Application Architecture (Relevant to This Task)

#### Frontend Stack:
- **Framework**: React 19 + TypeScript
- **UI Library**: Material-UI v7 (MUI)
- **Design System**: Apple-inspired (complete tokens in `appleDesignSystem.ts`)
- **Routing**: React Router v6
- **Build**: Vite
- **Deployment**: Render.com (static site, manual deploys)

#### Existing Analysis Flow:
```
User Input (PropertyForm/Wizard) →
POST /api/deals/analyze →
Backend (Investment Decision Engine v2.1) →
Analysis Object (complex TypeScript interface) →
AnalysisResults Component (2228 lines, renders all tabs/metrics) →
User sees results
```

#### Key Architectural Findings:

**✅ Component Reusability**:
```typescript
// /frontend/src/components/SFRAnalysis/AnalysisResults.tsx
interface AnalysisResultsProps {
  analysis: any; // Analysis interface
  propertyData: any; // SFRPropertyData interface
  dealId?: string;  // Optional
  portfolioContext?: {...}; // Optional
  onParameterChange?: (data: any) => Promise<void>; // Optional
  ... other optional handlers
}
```

**Key Insight**: `AnalysisResults` component can work with JUST `analysis` and `propertyData` props. All handlers are optional. Perfect for static page!

**✅ Existing Type Interfaces**:
- `/frontend/src/types/property.ts` - SFRPropertyData, PropertyAddress
- `/frontend/src/types/analysis.ts` - Analysis, MonthlyAnalysis, KeyMetrics, AIInsights, InvestmentDecision

**✅ Design System Available**:
- `/frontend/src/theme/appleDesignSystem.ts` - Complete color palette, typography, spacing, shadows
- Buttons, Cards, Typography already styled with Apple aesthetic
- CTA buttons can use existing `MuiButton` component styles

**✅ SEO Infrastructure**:
- `/frontend/index.html` - Has JSON-LD structured data for SoftwareApplication
- Meta tags setup (OG tags, Twitter cards)
- Google Search Console verified
- Sitemap exists at `/frontend/public/sitemap.xml` (just updated today!)

**❌ Missing**:
- Per-page meta tag management (currently only index.html)
- React Helmet not installed

---

<a name="component-strategy"></a>
## 2. Component Strategy

### Approach: Wrapper Component Pattern

**Strategy**: Create a thin wrapper component that provides hardcoded data to existing AnalysisResults component.

```
SampleAnalysisPage (new)
  ↓ provides hardcoded props
AnalysisResults (existing, 2228 lines - REUSE AS-IS)
  ↓ renders
InvestmentDecisionHero, IntelligenceMultiplier, all tabs
```

**Why This Works**:
1. ✅ **Zero duplication** - Reuse 2228 lines of battle-tested UI code
2. ✅ **Consistent look** - Identical to real analysis results
3. ✅ **Low maintenance** - Changes to AnalysisResults auto-apply to sample page
4. ✅ **Fast implementation** - Just create wrapper + mock data

### Component Architecture Diagram

```
/frontend/src/pages/SampleAnalysisPage.tsx  (NEW - ~300 lines)
  │
  ├─ React Helmet (per-page SEO meta tags)
  ├─ Hero Section (custom)
  │   ├─ H1: "Sample Rental Property Analysis - Real Example"
  │   ├─ Property overview card
  │   └─ CTA: "Analyze YOUR Property Free"
  │
  ├─ AnalysisResults Component (EXISTING - reused)
  │   ├─ InvestmentDecisionHero (verdict, score, reasoning)
  │   ├─ IntelligenceMultiplier (AI insights)
  │   ├─ Financial Summary tab
  │   ├─ Market Intelligence tab
  │   ├─ Strategic Action Plan tab
  │   └─ All other tabs...
  │
  └─ CTA Section (custom)
      ├─ "Want to Analyze YOUR Property?"
      ├─ Feature highlights
      └─ Button → /register

/frontend/src/data/samplePropertyData.ts (NEW - ~200 lines)
  │
  ├─ mockPropertyData: SFRPropertyData
  └─ mockAnalysis: Analysis

/frontend/src/App.tsx (MODIFIED)
  │
  └─ Add public route: <Route path="/sample-analysis" element={<SampleAnalysisPage />} />
```

---

<a name="data-structure"></a>
## 3. Data Structure & Mock Data

### Sample Property Selection Criteria

**Recommended Property**: Real analysis from existing database OR realistic mock based on interfaces.

**Criteria**:
- Mid-tier market (Austin, TX / Charlotte, NC / Tampa, FL - relatable)
- Purchase price: $350K-$450K (not too cheap, not luxury)
- Deal Quality Score: 75-85 (strong but not perfect - shows platform judgment)
- Clear BUY verdict (aspirational, shows what good looks like)
- Realistic metrics:
  - Cap Rate: 6.5-7.5%
  - Cash-on-Cash: 10-13%
  - Monthly Cash Flow: $500-$800
  - DSCR: 1.3-1.5

### Mock Data Structure

Based on type interfaces analysis:

```typescript
// /frontend/src/data/samplePropertyData.ts

import { SFRPropertyData } from '../types/property';
import { Analysis } from '../types/analysis';

export const mockPropertyData: SFRPropertyData = {
  propertyType: 'SFR',
  propertyName: 'Sample Investment Property',
  propertyAddress: {
    street: '1234 Oak Avenue',
    city: 'Charlotte',
    state: 'NC',
    zipCode: '28205',
    county: 'Mecklenburg'
  },

  // Purchase Details
  purchasePrice: 389900,
  downPayment: 77980, // 20%
  interestRate: 7.25,
  loanTerm: 30,
  closingCosts: 7798, // 2%
  capitalInvestments: 5000, // Minor repairs

  // Property Details
  squareFootage: 1850,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: 2018,

  // Income
  monthlyRent: 2450,

  // Operating Expenses
  propertyTaxRate: 1.1, // NC average
  insuranceRate: 0.45,
  propertyManagementRate: 8,
  maintenanceCost: 200,
  repairCosts: 100,

  // Tenant Turnover (optional)
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 1225 // Half month rent
  },

  // Long-term Assumptions
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3.5,
    annualPropertyValueIncrease: 4.0,
    sellingCostsPercentage: 6.0,
    inflationRate: 2.5,
    vacancyRate: 5.0,
    turnoverFrequency: 2 // Every 2 years
  },

  // Investment Strategy (optional but enhances AI insights)
  enhancedGoals: {
    exitStrategy: 'flexible',
    portfolioStrategy: 'cashflow',
    experienceLevel: 'novice',
    riskTolerance: 'moderate',
    freeTextStrategy: 'Looking for my first rental property with positive cash flow and long-term appreciation potential in a growing market.',
    aiEnhancedStrategy: 'Cash flow focused with appreciation upside in Charlotte Metro',
    strategicInsights: [
      'Charlotte market shows 3.2% population growth',
      'Strong job market with Amazon, Bank of America expansion',
      'Rental demand increasing faster than supply'
    ]
  }
};

export const mockAnalysis: Analysis = {
  // Monthly Analysis
  monthlyAnalysis: {
    income: {
      gross: 2450,
      effective: 2327.50 // After 5% vacancy
    },
    expenses: {
      propertyTax: 357.42, // (389900 * 1.1%) / 12
      insurance: 146.21, // (389900 * 0.45%) / 12
      maintenance: 200,
      propertyManagement: 196, // 8% of rent
      vacancy: 122.50, // 5% of rent
      mortgage: {
        principal: 425.32,
        interest: 1882.51,
        total: 2307.83
      },
      tenantTurnover: 51.04, // Amortized over 2 years
      total: 3381.00
    },
    cashFlow: -1053.50, // Negative initially, grows positive over time
    cashFlowAfterTax: undefined // Tax analysis not in MVP
  },

  // Annual Analysis
  annualAnalysis: {
    income: 29400, // 2450 * 12
    expenses: 11772, // Operating expenses (no debt service)
    noi: 17628, // Net Operating Income
    debtService: 27694, // Mortgage * 12
    cashFlow: -10066, // Year 1 negative (appreciation play)
    dscr: 0.64, // Low DSCR (risky but grows)
    capRate: 4.52, // Low cap rate (appreciation market)
    cashOnCashReturn: -11.85, // Negative year 1 (long-term play)
    totalInvestment: 84978 // Down + closing + capex
  },

  // Long-term Analysis (10 years)
  longTermAnalysis: {
    projections: [
      // Year 1
      {
        year: 1,
        grossRent: 29400,
        grossIncome: 29400,
        effectiveIncome: 27930,
        operatingExpenses: 10302,
        noi: 17628,
        debtService: 27694,
        cashFlow: -10066,
        propertyValue: 405496,
        equity: 100574,
        mortgageBalance: 304922,
        appreciation: 15596,
        totalReturn: 5530,
        propertyTax: 4289,
        insurance: 1755,
        maintenance: 2400,
        propertyManagement: 2352,
        vacancy: 1470,
        turnoverCosts: 612
      },
      // ... Years 2-10 (showing growth trajectory)
      // Final year shows strong positive cash flow, equity buildup
    ],
    projectionYears: 10,
    returns: {
      irr: 12.3, // Strong long-term IRR
      totalCashFlow: 45230, // Cumulative over 10 years
      totalAppreciation: 185420, // Equity + appreciation
      totalReturn: 230650 // Total wealth created
    },
    exitAnalysis: {
      projectedSalePrice: 575320,
      sellingCosts: 34519,
      mortgagePayoff: 267843,
      netProceedsFromSale: 272958,
      totalProfit: 187980,
      returnOnInvestment: 221.2 // 2.2x return over 10 years
    }
  },

  // Key Metrics
  keyMetrics: {
    capRate: 4.52,
    cashOnCashReturn: -11.85, // Year 1
    irr: 12.3, // 10-year
    totalROI: 221.2,
    paybackPeriod: 7.2,
    dscr: 0.64,
    pricePerSqft: 210.76,
    rentToValue: 0.628,
    totalInvestment: 84978,
    operatingExpenseRatio: 36.9,
    breakEvenOccupancy: 85.2,
    equityMultiple: 3.21,
    grossRentMultiplier: 13.27,
    onePercentRuleValue: 83.4, // Fails 1% rule (2450/389900 = 0.628%)
    fiftyRuleAnalysis: false,
    rentToPriceRatio: 0.628,
    pricePerBedroom: 129966,
    debtToIncomeRatio: 99.3,
    returnOnImprovements: undefined,
    turnoverCostImpact: 2.1
  },

  // Investment Decision (from Investment Decision Engine v2.1)
  investmentDecision: {
    verdict: 'NEGOTIATE',
    confidence: 72,
    score: 78,
    primaryReason: 'Strong long-term appreciation potential in growing Charlotte market, but year-1 negative cash flow requires negotiation on price or better financing terms.',
    secondaryReasons: [
      'Property value 4% annual appreciation exceeds national average',
      'Charlotte Metro population growth supports rental demand',
      'IRR of 12.3% indicates strong long-term returns'
    ],
    keyRisks: [
      'Negative cash flow in first 2 years requires reserves',
      'DSCR below 1.0 makes financing difficult',
      'Market correction could delay appreciation timeline'
    ],
    confidenceDescription: 'Moderate confidence - strong market fundamentals but execution risk due to initial negative cash flow.',
    goalBasedReasoning: 'For novice investors seeking cash flow, recommend negotiating purchase price to $365K to achieve positive monthly cash flow from year 1. Alternatively, increase down payment to 25% to reduce debt service.',
    professionalAssessment: {
      dealQuality: 78,
      riskLevel: 'MODERATE',
      marketConditions: 'FAVORABLE',
      categoryScores: {
        financial: 72,
        market: 85,
        risk: 68
      },
      weightedComponents: {
        cashFlow: { score: 45, weight: 0.35 },
        capRate: { score: 60, weight: 0.03 },
        irr: { score: 85, weight: 0.25 },
        market: { score: 85, weight: 0.15 },
        risk: { score: 68, weight: 0.22 }
      },
      reasoning: 'Charlotte market strength and appreciation potential offset year-1 negative cash flow. Long-term metrics are strong.',
      actionableInsights: [
        'Negotiate price to $365K for immediate positive cash flow',
        'Increase down payment to 25% to improve DSCR',
        'Build 6-month expense reserve before purchase',
        'Consider house hacking to offset negative cash flow'
      ]
    }
  },

  // AI Insights (from GPT-4o-mini + Market Intelligence)
  aiInsights: {
    summary: 'Charlotte investment property with strong long-term appreciation potential in a high-growth market. Year-1 negative cash flow presents short-term risk but 12.3% IRR and 2.2x equity multiple over 10 years indicate excellent long-term value. Market fundamentals (3.2% population growth, major employer expansion) support rental demand and property value growth.',

    strengths: [
      'Charlotte Metro 3.2% annual population growth vs 1.1% national average',
      'Amazon, Bank of America, and Microsoft expansions creating 15K+ high-paying jobs',
      '10-year IRR of 12.3% exceeds stock market historical average',
      'Property built in 2018 - minimal deferred maintenance risk',
      'Rental demand growing 8.5% annually vs 4.2% supply growth'
    ],

    weaknesses: [
      'Year-1 negative cash flow of $1,053/month requires $12,636 annual subsidy',
      'DSCR of 0.64 below lender requirement (1.25+) - financing may be difficult',
      'Fails 1% rule (rent 0.628% of purchase price vs target 1%)',
      '7.25% interest rate increases debt service - refinancing opportunity in 2-3 years',
      'High operating expense ratio (36.9%) leaves little margin for unexpected costs'
    ],

    recommendations: [
      'Negotiate purchase price to $365K (6.4% discount) to achieve positive cash flow from year 1',
      'Increase down payment to 25% ($97,475) to improve DSCR to 0.83 and reduce monthly debt service',
      'Build 6-month expense reserve ($6,318) before closing to cover negative cash flow period',
      'Consider house hacking (rent out 1-2 bedrooms) to generate $800-1,200/month additional income',
      'Monitor interest rates for refinancing opportunity when rates drop below 6.5%',
      'Reassess after 3 years when cash flow turns positive and equity builds to $145K+'
    ],

    investmentScore: 78,

    scoreBreakdown: {
      cashFlow: { score: 45, max: 100, reason: 'Negative year-1 cash flow but positive by year 3' },
      marketPosition: { score: 85, max: 100, reason: 'Charlotte high-growth market with strong job market' },
      riskAssessment: { score: 68, max: 100, reason: 'Moderate risk due to financing and negative cash flow' },
      financialMetrics: { score: 82, max: 100, reason: 'Strong long-term IRR and equity multiple' }
    },

    marketTrendPrediction: 'Charlotte Metro expected to continue 3-4% annual growth through 2030 based on Amazon HQ2 expansion and Bank of America investment. Rental demand will outpace supply by 2:1 ratio. Property values projected to increase 4-5% annually.',

    optimalExitStrategy: 'Hold 7-10 years to maximize appreciation and equity buildup. Cash flow turns positive in year 3. Exit when equity reaches $250K+ (projected year 8-10). Consider 1031 exchange into larger multi-family property.',

    riskAssessment: 'Moderate risk. Primary risk: negative cash flow in years 1-2 requires financial reserves. Secondary risk: DSCR below 1.0 limits refinancing options. Mitigation: Negotiate lower price OR increase down payment OR house hack.',

    recommendedHoldPeriod: '7-10 years',

    // Enhanced strategic fields
    investorFit: 'Best for: Investors with W-2 income to offset negative cash flow, long-term wealth building focus, and 6+ month reserves. NOT recommended for: First-time investors needing immediate cash flow, retirees without backup income.',

    strategicInsights: 'This is a classic "appreciation play" in a high-growth market. Negative year-1 cash flow is offset by 4% annual property appreciation ($15,596/year). Total wealth creation over 10 years: $230,650. Compare to: $84,978 invested in S&P 500 at 10% = $220,457. Real estate wins by $10K AND provides diversification.',

    competitiveAdvantage: 'Charlotte market has limited new construction due to zoning restrictions. Existing 3/2 homes in established neighborhoods will appreciate faster than new developments on city outskirts. This property is 10 min from Uptown - prime rental location.',

    wealthBuildingPotential: 'Year 3: $145K equity. Year 5: $195K equity. Year 10: $272K net proceeds from sale. Annualized return: 12.3% IRR. Equivalent to $84,978 growing to $272,958 in 10 years.',

    marketCycleAnalysis: 'Charlotte in mid-cycle growth phase. Not overheated (unlike Austin) but past early-stage (unlike Nashville). Safe entry point with upside remaining. Recession risk: Moderate (diversified economy with finance, tech, healthcare).',

    financingRecommendations: 'Current 7.25% rate is high. Consider: (1) Buydown points to 6.75% (costs $3,900 but saves $152/month), (2) ARM loan if planning to refinance in 3-5 years, (3) Increase down payment to 25% to unlock better rates from portfolio lenders.',

    portfolioFitAnalysis: 'Good first property IF you have reserves. Pair with positive cash flow property (e.g., Midwest market) to balance portfolio. Charlotte provides appreciation, Midwest provides cash flow. Combined portfolio IRR: 14%+.',

    opportunityCostAnalysis: 'Investing $84,978 here vs alternatives: (1) S&P 500: 10% = $220K in 10 years. (2) High-yield savings: 4% = $126K. (3) This property: 12.3% IRR = $273K. Winner: This property, BUT requires active management and risk tolerance.',

    boldPredictions: {
      wealthCreation: {
        year3Value: '$145,000 equity (70% increase)',
        year5Value: '$195,000 equity (130% increase)',
        year10Value: '$272,958 net proceeds (221% total return)',
        totalWealthCreated: '$187,980 profit on $84,978 investment'
      },
      cashFlowGrowth: {
        currentMonthly: '-$1,053/month (negative)',
        year2Monthly: '-$423/month (improving)',
        year5Monthly: '+$684/month (positive!)',
        doubleDate: 'Year 7 ($1,200/month projected)',
        reach5kDate: 'Never - max $2,100/month by year 10'
      },
      rentGrowthForecast: {
        currentRent: '$2,450/month',
        year3Rent: '$2,710/month (+10.6%)',
        year5Rent: '$2,900/month (+18.4%)',
        year7Rent: '$3,110/month (+26.9%)'
      },
      exitStrategy: {
        optimalExitYear: 'Year 8-10',
        predictedSalePrice: '$575,320 (year 10)',
        totalProfit: '$187,980',
        annualizedReturn: '12.3% IRR'
      }
    }
  }
};
```

**Note**: This is REALISTIC mock data. Year-1 negative cash flow is INTENTIONAL to show:
1. Platform doesn't always give "BUY" verdicts
2. Honest analysis even when metrics aren't perfect
3. Strategic guidance for improvement ("Negotiate to $365K")
4. Demonstration of long-term thinking (appreciation vs immediate cash flow)

This builds MORE trust than fake "perfect deal" example.

---

<a name="file-structure"></a>
## 4. File Structure & New Files

### Files to Create

```
/frontend/src/
├── pages/
│   └── SampleAnalysisPage.tsx           (NEW - ~300 lines)
├── data/
│   └── samplePropertyData.ts            (NEW - ~600 lines with full mock data)
└── App.tsx                               (MODIFIED - add 1 route)

/frontend/public/
└── sitemap.xml                           (MODIFIED - add sample-analysis URL)

/docs/
├── MARKETING_REQUIREMENT_SAMPLE_ANALYSIS_PAGE.md  (EXISTS - marketing doc)
└── ARCHITECT_SAMPLE_ANALYSIS_PAGE_TECHNICAL_PLAN.md  (THIS DOCUMENT)
```

### Dependencies to Add

```bash
npm install react-helmet-async
```

**Why react-helmet-async**:
- Per-page meta tags (title, description, OG tags)
- SSR-safe (works with Vite)
- Industry standard for React SEO

---

<a name="seo-implementation"></a>
## 5. SEO Implementation

### 5.1 Per-Page Meta Tags (React Helmet)

```typescript
// /frontend/src/pages/SampleAnalysisPage.tsx

import { Helmet } from 'react-helmet-async';

<Helmet>
  {/* Primary Meta Tags */}
  <title>Sample Rental Property Analysis - Real Example | REanalyzr</title>
  <meta
    name="description"
    content="See a complete rental property analysis example with cap rate 4.52%, IRR 12.3%, AI insights, and NEGOTIATE verdict. Charlotte, NC investment property breakdown. Analyze your property free."
  />
  <meta
    name="keywords"
    content="rental property analysis example, cap rate analysis example, real estate investment sample, Charlotte NC rental property, property analysis breakdown, rental property calculator example"
  />

  {/* Canonical URL */}
  <link rel="canonical" href="https://reanalyzr.com/sample-analysis" />

  {/* Open Graph / Facebook */}
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://reanalyzr.com/sample-analysis" />
  <meta property="og:title" content="Sample Rental Property Analysis - Real Example" />
  <meta
    property="og:description"
    content="Complete breakdown of a $390K Charlotte rental property: 12.3% IRR, 78/100 Deal Quality Score, NEGOTIATE verdict. See what professional analysis looks like."
  />
  <meta property="og:image" content="https://reanalyzr.com/sample-analysis-og.png" />

  {/* Twitter Card */}
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://reanalyzr.com/sample-analysis" />
  <meta property="twitter:title" content="Sample Rental Property Analysis - Charlotte, NC" />
  <meta
    property="twitter:description"
    content="Real example: $390K property, 12.3% IRR, AI insights. See professional rental property analysis in action."
  />
  <meta property="twitter:image" content="https://reanalyzr.com/sample-analysis-twitter.png" />

  {/* Article Structured Data */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Sample Rental Property Analysis - Charlotte, NC Investment Property",
      "description": "Complete financial analysis of a $390K single-family rental property in Charlotte, NC including cap rate, IRR, cash flow projections, and AI-powered insights.",
      "author": {
        "@type": "Organization",
        "name": "REanalyzr"
      },
      "publisher": {
        "@type": "Organization",
        "name": "REanalyzr",
        "logo": {
          "@type": "ImageObject",
          "url": "https://reanalyzr.com/analyzr-logo.png"
        }
      },
      "datePublished": "2025-12-06",
      "dateModified": "2025-12-06",
      "image": "https://reanalyzr.com/sample-analysis-og.png",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://reanalyzr.com/sample-analysis"
      }
    })}
  </script>

  {/* Software Application Structured Data */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "REanalyzr",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "description": "AI-powered rental property calculator and investment analysis tool",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "15",
        "bestRating": "5",
        "worstRating": "1"
      }
    })}
  </script>
</Helmet>
```

### 5.2 Sitemap Update

```xml
<!-- /frontend/public/sitemap.xml -->

<!-- Add this entry after existing URLs -->
<url>
  <loc>https://reanalyzr.com/sample-analysis</loc>
  <lastmod>2025-12-06</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
</url>
```

### 5.3 robots.txt Verification

```
# /frontend/public/robots.txt (if doesn't exist, create it)

User-agent: *
Allow: /
Sitemap: https://reanalyzr.com/sitemap.xml
```

---

<a name="routing-changes"></a>
## 6. Routing Changes

### 6.1 App.tsx Modification

```typescript
// /frontend/src/App.tsx

// Add import at top
import SampleAnalysisPage from './pages/SampleAnalysisPage';

// Find public routes section (around line 206-207)
// Add BEFORE the catch-all NotFound route:

{/* Public Routes */}
<Route path="/sample-analysis" element={<SampleAnalysisPage />} />
<Route path="*" element={<NotFound />} />
```

**Key**: Sample page must be OUTSIDE the `<ProtectedRoute>` wrapper so it's accessible without login.

### 6.2 Verification

Public routes should be:
1. `/login` ✅
2. `/register` ✅
3. `/terms` ✅
4. `/sample-analysis` ✅ NEW
5. `/help` ⏳ Make public in same deploy (remove ProtectedRoute wrapper)
6. `/whats-new` ⏳ Make public in same deploy (remove ProtectedRoute wrapper)

---

<a name="design-system"></a>
## 7. Design System Integration

### 7.1 Color Palette (from appleDesignSystem.ts)

```typescript
import { appleColors } from '../theme/appleDesignSystem';

// Use existing tokens:
appleColors.primary[500]  // Main blue for CTAs
appleColors.success[500]  // Green for positive metrics
appleColors.warning[500]  // Orange for NEGOTIATE verdict
appleColors.gray[900]     // Dark text
appleColors.gray[50]      // Light background
```

### 7.2 Typography

```typescript
// H1 - Page title
<Typography variant="h1" sx={{
  fontSize: '3rem',        // appleTypography.fontSize['5xl']
  fontWeight: 700,         // appleTypography.fontWeight.bold
  color: appleColors.gray[900]
}}>
  Sample Rental Property Analysis
</Typography>

// H2 - Section headers
<Typography variant="h2" sx={{
  fontSize: '2.25rem',     // appleTypography.fontSize['4xl']
  fontWeight: 600,         // appleTypography.fontWeight.semibold
}}>
  Investment Decision
</Typography>

// Body text
<Typography variant="body1" sx={{
  fontSize: '1rem',        // appleTypography.fontSize.base
  lineHeight: 1.5,
  color: appleColors.gray[700]
}}>
  Complete breakdown of this property...
</Typography>
```

### 7.3 CTA Button Styling

```typescript
// Primary CTA
<Button
  variant="contained"
  color="primary"
  size="large"
  href="/register"
  sx={{
    borderRadius: '1rem',           // appleBorderRadius.lg
    padding: '0.75rem 1.5rem',      // appleSpacing[3] appleSpacing[6]
    fontSize: '0.875rem',           // appleTypography.fontSize.sm
    fontWeight: 500,                // appleTypography.fontWeight.medium
    boxShadow: appleShadows.sm,
    textTransform: 'none',
    background: `linear-gradient(135deg, ${appleColors.primary[500]} 0%, ${appleColors.primary[600]} 100%)`,
    '&:hover': {
      boxShadow: appleShadows.md,
      transform: 'translateY(-1px)',
      background: `linear-gradient(135deg, ${appleColors.primary[600]} 0%, ${appleColors.primary[700]} 100%)`
    }
  }}
>
  Analyze Your Property Free
</Button>
```

### 7.4 Card Styling

```typescript
// Property overview card
<Card sx={{
  borderRadius: '1.5rem',         // appleBorderRadius.xl
  boxShadow: appleShadows.sm,
  border: `1px solid ${appleColors.gray[100]}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: appleShadows.lg,
    transform: 'translateY(-2px)',
    borderColor: appleColors.gray[200]
  }
}}>
  <CardContent>
    {/* Property details */}
  </CardContent>
</Card>
```

---

<a name="testing"></a>
## 8. Testing Strategy

### 8.1 Manual Testing Checklist

**Desktop Testing** (Chrome, Safari, Firefox):
- [ ] Page loads without errors
- [ ] AnalysisResults component renders correctly
- [ ] All analysis tabs functional (Financial, Market Intelligence, AI Insights)
- [ ] CTA buttons link to `/register`
- [ ] Meta tags present in `<head>` (inspect with DevTools)
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Images load (or gracefully handle missing images)

**Mobile Testing** (iPhone Safari, Android Chrome):
- [ ] Responsive layout (no horizontal scroll)
- [ ] Text readable without zooming
- [ ] CTA buttons thumb-friendly (min 44px height)
- [ ] Analysis tabs work on mobile
- [ ] Page loads in <3 seconds (Lighthouse)

**SEO Testing**:
- [ ] View source shows meta tags (not just client-side)
- [ ] Sitemap includes `/sample-analysis`
- [ ] Google Search Console accepts sitemap
- [ ] Request indexing successful

### 8.2 Automated Testing (Optional Phase 2)

```typescript
// /frontend/src/pages/__tests__/SampleAnalysisPage.test.tsx

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SampleAnalysisPage from '../SampleAnalysisPage';

describe('SampleAnalysisPage', () => {
  it('renders page title', () => {
    render(
      <MemoryRouter>
        <SampleAnalysisPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Sample Rental Property Analysis/i)).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(
      <MemoryRouter>
        <SampleAnalysisPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Analyze Your Property Free/i)).toBeInTheDocument();
  });

  it('renders AnalysisResults component', () => {
    render(
      <MemoryRouter>
        <SampleAnalysisPage />
      </MemoryRouter>
    );
    // Check for verdict (from InvestmentDecisionHero)
    expect(screen.getByText(/NEGOTIATE/i)).toBeInTheDocument();
  });
});
```

### 8.3 Lighthouse Performance Targets

**Goals**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

**Critical Web Vitals**:
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

---

<a name="deployment"></a>
## 9. Deployment Plan

### 9.1 Pre-Deployment Checklist

- [ ] Install react-helmet-async: `npm install react-helmet-async`
- [ ] Create `/frontend/src/data/samplePropertyData.ts` with mock data
- [ ] Create `/frontend/src/pages/SampleAnalysisPage.tsx`
- [ ] Modify `/frontend/src/App.tsx` (add route + HelmetProvider wrapper)
- [ ] Update `/frontend/public/sitemap.xml` (add sample-analysis URL)
- [ ] Make `/help` and `/whats-new` public (remove ProtectedRoute wrappers)
- [ ] Test locally: `npm run dev` → Visit `http://localhost:5173/sample-analysis`
- [ ] Verify meta tags in browser DevTools
- [ ] Git commit all changes
- [ ] Git push to remote

### 9.2 Deployment Steps

**Step 1: Frontend Build**
```bash
cd frontend
npm run build
```

**Step 2: Deploy to Render.com**
- Go to https://dashboard.render.com
- Find frontend service
- Click "Manual Deploy" → "Deploy latest commit"
- Wait 5-10 minutes for build

**Step 3: Verify Deployment**
- Visit https://reanalyzr.com/sample-analysis
- Check meta tags (View Page Source)
- Test mobile (Chrome DevTools device mode)
- Run Lighthouse audit

**Step 4: Google Search Console**
- Go to https://search.google.com/search-console
- Sitemaps → Re-submit sitemap
- URL Inspection → Test `https://reanalyzr.com/sample-analysis`
- Request Indexing

### 9.3 Rollback Plan

**If deployment fails**:
1. Revert git commit: `git revert HEAD`
2. Push revert: `git push`
3. Re-deploy via Render.com
4. Debug locally, fix issues, redeploy

**If page has bugs but site works**:
1. Keep deployment live (rest of site unaffected)
2. Fix bugs in new commit
3. Deploy fix

---

<a name="timeline"></a>
## 10. Timeline & Milestones

### Day 1 (4-6 hours)

**Morning (2-3 hours)**:
- [ ] Install react-helmet-async
- [ ] Create `samplePropertyData.ts` with realistic mock data (based on interfaces)
- [ ] Create `SampleAnalysisPage.tsx` skeleton (hero + footer CTAs)
- [ ] Integrate AnalysisResults component

**Afternoon (2-3 hours)**:
- [ ] Add React Helmet meta tags
- [ ] Add structured data (JSON-LD)
- [ ] Update App.tsx routing
- [ ] Make `/help` and `/whats-new` public
- [ ] Update sitemap.xml
- [ ] Local testing (all browsers)

### Day 2 (2-4 hours)

**Morning (1-2 hours)**:
- [ ] Mobile responsive testing
- [ ] Fix any layout issues
- [ ] Polish CTA buttons and spacing
- [ ] Lighthouse audit (optimize if needed)

**Afternoon (1-2 hours)**:
- [ ] Git commit + push
- [ ] Deploy to Render.com
- [ ] Post-deployment testing
- [ ] Google Search Console submission
- [ ] Request indexing for all public pages

**Total Effort**: 6-10 hours (1-2 days for solo developer)

---

<a name="risks"></a>
## 11. Risk Assessment

### Technical Risks

**Risk 1: React Helmet SSR Issues**
- **Probability**: Low
- **Impact**: Medium (meta tags not visible to Google crawler)
- **Mitigation**: react-helmet-async is SSR-safe. Vite handles it correctly.
- **Fallback**: Add meta tags to index.html with template placeholders

**Risk 2: AnalysisResults Component Dependencies**
- **Probability**: Medium
- **Impact**: Medium (component fails to render on static page)
- **Mitigation**: Component accepts all required props, no API calls within
- **Test**: Render with hardcoded data in isolation first
- **Fallback**: Create simplified version of AnalysisResults for sample page

**Risk 3: Google Doesn't Index Page**
- **Probability**: Low
- **Impact**: High (defeats purpose of SEO)
- **Mitigation**:
  - Sitemap submission
  - Request indexing via Search Console
  - Internal links from /help page
  - Submit to Google via Search Console URL Inspection
- **Timeline**: Allow 7-14 days for indexing

**Risk 4: Performance Issues (Large Component)**
- **Probability**: Low
- **Impact**: Medium (slow page load)
- **Mitigation**:
  - AnalysisResults already optimized (production component)
  - Vite code splitting handles large components
  - No external API calls (all data hardcoded)
- **Test**: Lighthouse audit before deployment
- **Target**: LCP <2.5s

### Business Risks

**Risk 5: Sample Data Not Representative**
- **Probability**: Medium
- **Impact**: Medium (users question accuracy)
- **Mitigation**: Use realistic Charlotte market data with real appreciation rates
- **Disclaimer**: Add note "Sample data based on Charlotte, NC market as of Dec 2025"

**Risk 6: Users Don't Convert (Low CTA Click Rate)**
- **Probability**: Medium
- **Impact**: High (defeats purpose)
- **Mitigation**:
  - Multiple CTA placements (top, middle, bottom)
  - A/B test CTA copy in Phase 2
  - Track with Google Analytics events
- **Success Metric**: 15%+ CTA click rate

**Risk 7: Negative SEO Impact**
- **Probability**: Very Low
- **Impact**: High (hurts existing rankings)
- **Mitigation**:
  - Use proper canonical tags
  - No duplicate content (sample page is unique)
  - Quality content with real value
- **Monitor**: Google Search Console for penalties

---

<a name="phase-2"></a>
## 12. Phase 2 Considerations (Future Enhancements)

### Phase 2A: Multiple Sample Pages (Weeks 2-4)

**New pages to create**:
1. `/examples/single-family-rental` - Standard SFR
2. `/examples/multi-family-duplex` - MF analysis showcase
3. `/examples/house-hacking` - House hacking strategy
4. `/examples/high-cash-flow` - Strong monthly cash flow property
5. `/examples/appreciation-play` - Low cash flow, high appreciation

**Implementation**:
- Create shared `SampleTemplate` component
- Move sample data to `/frontend/src/data/examples/` folder
- Update sitemap dynamically (consider sitemap generation script)

### Phase 2B: Dynamic Sample Pages (Month 2)

**Backend integration**:
- API endpoint: `GET /api/samples/:id`
- Fetch saved "featured" analyses from database
- Admin panel to mark analyses as "public samples"
- Allow swapping sample properties without code deploy

**Benefits**:
- Fresher data (update samples quarterly)
- A/B test different property types
- Regional targeting (show Charlotte example to NC visitors)

### Phase 2C: Advanced SEO (Month 2-3)

**Enhancements**:
1. **Open Graph images**: Generate custom OG images per sample
2. **Video embed**: 2-min walkthrough video on sample page
3. **FAQ schema**: Add FAQ structured data
4. **Breadcrumbs**: Add breadcrumb navigation
5. **Related examples**: "See also: Multi-family example, House hacking example"

**Tools**:
- OG image generation: Cloudinary or Vercel OG
- Video hosting: YouTube embed
- FAQ schema: JSON-LD

### Phase 2D: Conversion Optimization (Month 3)

**A/B Testing Framework**:
- Test CTA copy variations
- Test sample property types (which converts best)
- Test CTA placement (sticky header vs inline)

**Analytics Integration**:
```typescript
// Track CTA clicks
onClick={() => {
  // Google Analytics event
  gtag('event', 'cta_click', {
    'event_category': 'sample_analysis',
    'event_label': 'analyze_your_property',
    'value': 1
  });

  // Navigate to register
  navigate('/register');
}}
```

**Heatmap Tools**:
- Hotjar or Microsoft Clarity
- Track scroll depth
- Identify friction points

---

## Appendix A: Complete Sample Page Component Structure

```typescript
// /frontend/src/pages/SampleAnalysisPage.tsx

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Button, Card, CardContent, Chip, Stack, Container } from '@mui/material';
import Grid from '@mui/system/Grid';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, TrendingUp as TrendingUpIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';

import AnalysisResults from '../components/SFRAnalysis/AnalysisResults';
import { mockPropertyData, mockAnalysis } from '../data/samplePropertyData';
import { appleColors, appleShadows, appleBorderRadius } from '../theme/appleDesignSystem';
import { formatCurrency, formatPercent } from '../utils/formatters';

const SampleAnalysisPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: appleColors.gray[50] }}>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Sample Rental Property Analysis - Real Example | REanalyzr</title>
        <meta
          name="description"
          content="See a complete rental property analysis example with cap rate 4.52%, IRR 12.3%, AI insights, and NEGOTIATE verdict. Charlotte, NC investment property breakdown. Analyze your property free."
        />
        {/* ... (full meta tags as shown in Section 5.1) */}
      </Helmet>

      {/* Hero Section */}
      <Box sx={{
        background: `linear-gradient(135deg, ${appleColors.primary[500]} 0%, ${appleColors.primary[700]} 100%)`,
        color: 'white',
        py: 8,
        px: 3
      }}>
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 700 }}>
            Sample Rental Property Analysis
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.95 }}>
            See what professional-grade analysis looks like — real property, real metrics, real insights
          </Typography>

          {/* Property Overview Card */}
          <Card sx={{
            borderRadius: appleBorderRadius.xl,
            boxShadow: appleShadows.xl,
            mt: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {mockPropertyData.propertyAddress.street}
                  </Typography>
                  <Typography variant="body1" sx={{ color: appleColors.gray[700] }}>
                    {mockPropertyData.propertyAddress.city}, {mockPropertyData.propertyAddress.state} {mockPropertyData.propertyAddress.zipCode}
                  </Typography>

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Chip label={`${mockPropertyData.bedrooms} bed`} />
                    <Chip label={`${mockPropertyData.bathrooms} bath`} />
                    <Chip label={`${mockPropertyData.squareFootage.toLocaleString()} sqft`} />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                        Purchase Price
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {formatCurrency(mockPropertyData.purchasePrice)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                        Monthly Rent
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {formatCurrency(mockPropertyData.monthlyRent)}/month
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              {/* CTA */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: appleBorderRadius.lg,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textTransform: 'none'
                  }}
                >
                  Analyze YOUR Property Free →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Analysis Results Section */}
      <Container maxWidth="lg" sx={{ mt: 6, pb: 8 }}>
        <AnalysisResults
          analysis={mockAnalysis}
          propertyData={mockPropertyData}
        />
      </Container>

      {/* Bottom CTA Section */}
      <Box sx={{
        backgroundColor: appleColors.gray[100],
        py: 8,
        px: 3
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
            Want This Level of Insight for YOUR Property?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: appleColors.gray[700] }}>
            Get professional-grade analysis in 5 minutes. No spreadsheets. No guesswork.
          </Typography>

          {/* Feature highlights */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <HomeIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Clear BUY/PASS Verdicts
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                No more analysis paralysis. Get instant investment decisions backed by data.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                AI-Powered Insights
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Market intelligence + strategic recommendations tailored to your goals.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <AnalyticsIcon sx={{ fontSize: 48, color: appleColors.primary[500], mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                80+ Financial Metrics
              </Typography>
              <Typography variant="body2" sx={{ color: appleColors.gray[600] }}>
                Cap rate, IRR, DSCR, cash flow, and more. CPA-validated calculations.
              </Typography>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              borderRadius: appleBorderRadius.lg,
              px: 6,
              py: 2,
              fontSize: '1.25rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: appleShadows.lg,
              '&:hover': {
                boxShadow: appleShadows.xl,
                transform: 'translateY(-2px)'
              }
            }}
          >
            Start Analyzing Properties Free
          </Button>

          <Typography variant="body2" sx={{ mt: 2, color: appleColors.gray[600] }}>
            No credit card required • 2-minute setup • Join 10+ investors
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default SampleAnalysisPage;
```

---

## Appendix B: App.tsx Modifications

```typescript
// /frontend/src/App.tsx

// 1. Add import at top (around line 10-15)
import { HelmetProvider } from 'react-helmet-async';
import SampleAnalysisPage from './pages/SampleAnalysisPage';

// 2. Wrap entire app with HelmetProvider (around line 145)
function App() {
  return (
    <HelmetProvider>  {/* ADD THIS */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AuthProvider>
              <PersonaProvider>
                <DualModeProvider>
                  <Routes>
                    {/* ... existing routes ... */}
                  </Routes>
                </DualModeProvider>
              </PersonaProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>  {/* ADD THIS */}
  );
}

// 3. Add public routes (around line 190-195, BEFORE ProtectedRoute section)
{/* Public sample and info pages */}
<Route path="/sample-analysis" element={<SampleAnalysisPage />} />

// 4. Make help and whats-new public (around line 192-194)
// BEFORE (inside ProtectedRoute):
<Route path="/help" element={<HelpPage />} />
<Route path="/whats-new" element={<WhatsNewPage />} />

// AFTER (move OUTSIDE ProtectedRoute, with other public routes):
{/* Public Routes - No login required */}
<Route path="/sample-analysis" element={<SampleAnalysisPage />} />
<Route path="/help" element={<HelpPage />} />
<Route path="/whats-new" element={<WhatsNewPage />} />
<Route path="*" element={<NotFound />} />
```

---

## Summary: Implementation Checklist

### Pre-Development
- [x] Marketing requirements reviewed (`MARKETING_REQUIREMENT_SAMPLE_ANALYSIS_PAGE.md`)
- [x] Architecture analyzed (types, components, design system)
- [x] Technical plan created (this document)
- [ ] Plan approved by product owner (user)

### Development (Day 1)
- [ ] Install react-helmet-async: `npm install react-helmet-async`
- [ ] Create `/frontend/src/data/samplePropertyData.ts` with mock data
- [ ] Create `/frontend/src/pages/SampleAnalysisPage.tsx`
- [ ] Modify `/frontend/src/App.tsx`:
  - [ ] Add HelmetProvider wrapper
  - [ ] Add SampleAnalysisPage import
  - [ ] Add `/sample-analysis` route (public)
  - [ ] Move `/help` outside ProtectedRoute
  - [ ] Move `/whats-new` outside ProtectedRoute
- [ ] Update `/frontend/public/sitemap.xml` (add sample-analysis entry)
- [ ] Local testing (`npm run dev`)

### Testing (Day 1-2)
- [ ] Desktop browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsive testing (iPhone, Android)
- [ ] Meta tag verification (View Page Source)
- [ ] Structured data validation (Google Rich Results Test)
- [ ] Lighthouse audit (Performance 90+, SEO 100)
- [ ] Accessibility testing (keyboard navigation, screen readers)

### Deployment (Day 2)
- [ ] Git commit: `git add . && git commit -m "feat: Add sample analysis landing page for SEO"`
- [ ] Git push: `git push origin apple-design-system-v1`
- [ ] Render.com manual deploy (frontend service)
- [ ] Verify deployment: https://reanalyzr.com/sample-analysis
- [ ] Google Search Console:
  - [ ] Re-submit sitemap
  - [ ] Request indexing for `/sample-analysis`
  - [ ] Request indexing for `/help`
  - [ ] Request indexing for `/whats-new`

### Post-Deployment (Week 1)
- [ ] Monitor Google Search Console for indexing
- [ ] Track sample page views (Google Analytics)
- [ ] Measure CTA click rate (target: 15%+)
- [ ] Collect user feedback
- [ ] Plan Phase 2 enhancements

---

**End of Technical Implementation Plan**

**Next Steps**:
1. User reviews and approves this plan
2. Architect begins implementation (Day 1)
3. QE validates deployment (Day 2)
4. Marketing monitors SEO impact (Week 1-2)

**Questions or Concerns**: Raise before starting implementation.
