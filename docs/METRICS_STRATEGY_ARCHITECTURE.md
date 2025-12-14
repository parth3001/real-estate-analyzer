# Metrics & Strategy Architecture - Extensible Foundation

**Document Type**: Architecture Decision Record (ADR)
**Created**: December 13, 2024
**Last Updated**: December 14, 2025
**Status**: ✅ Phase 1 & Phase 3 Complete, Production Ready
**Authors**: Architect (from claude.md), FSE (from claude.md)
**Related Docs**: `/docs/METRICS_REORGANIZATION_PLAN.md`, `/docs/ISSUE_TRACKER.md` (Issue #25, #31)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Architecture Overview](#architecture-overview)
4. [File Structure & Organization](#file-structure--organization)
5. [Core Interfaces & Contracts](#core-interfaces--contracts)
6. [Strategy Selector Decision Logic](#strategy-selector-decision-logic)
7. [Adding New Strategies (Cookbook)](#adding-new-strategies-cookbook)
8. [Type System & Backend Integration](#type-system--backend-integration)
9. [Testing Strategy](#testing-strategy)
10. [Future Roadmap](#future-roadmap)
11. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Executive Summary

### What We Built
A **strategy-aware metric display system** that separates:
- **Backend**: Calculates ALL metrics (Single Source of Truth)
- **Frontend**: Displays strategy-specific metrics using progressive disclosure (3-tier pattern)

### Key Architectural Decisions
1. **Property Type First, Strategy Second**: Check `propertyType` (MF vs SFR) before checking `strategy`
2. **Composition Over Inheritance**: MetricDefinition interface supports ALL strategies via function composition
3. **Progressive Disclosure**: 3-tier pattern (Critical → Professional → Advanced)
4. **Zero Refactoring**: Adding new strategies requires creating 2 files, changing 1 line
5. **Fallback Safety**: Unsupported strategies display Buy & Hold metrics with warnings

### Current Status (Phase 1 & 3 Complete)
- ✅ **Buy & Hold**: Fully implemented (18 metrics, 3-tier display)
- ✅ **UI Integration**: Phase 3 complete - collapsible tiers, unified experience
- ✅ **Dynamic Labels**: Issue #25 resolved - IRR/Total ROI show actual hold period
- ⚠️ **BRRRR**: Foundation ready, falls back to Buy & Hold (Phase 2 & 4 needed)
- ⚠️ **House Hack**: Foundation ready, falls back to Buy & Hold (Phase 2 & 4 needed)
- ✅ **Multi-Family**: Existing implementation preserved, wrapper created

---

## Problem Statement

### Before (Problems)
```typescript
// AnalysisResults.tsx - 360 lines of mixed concerns
const metrics = [
  { label: 'Cash Flow', value: analysis.monthlyAnalysis.cashFlow },
  { label: 'Cap Rate', value: analysis.keyMetrics.capRate },
  // ... 18+ metrics hardcoded
];

// Problems:
❌ No strategy awareness (BRRRR shows Buy & Hold metrics)
❌ Information overload (18 metrics shown at once)
❌ No extensibility (adding BRRRR requires refactoring)
❌ Duplicate calculations (frontend re-calculates backend values - Issue #31)
❌ Property type confusion (MF vs SFR mixed logic)
```

### After (Solutions)
```typescript
// AnalysisResults.tsx - Strategy-aware, clean
import { getMetricTiers } from './metricDefinitions';

const result = getMetricTiers({
  propertyType: 'SFR',
  strategy: 'buy-hold',
  analysis,
  propertyData
});

// result.tiers = [
//   { title: 'Critical Metrics', metrics: [...3], defaultExpanded: true },
//   { title: 'Professional', metrics: [...7], defaultExpanded: false },
//   { title: 'Advanced', metrics: [...8], defaultExpanded: false }
// ];

// Solutions:
✅ Strategy-aware (BRRRR gets BRRRR metrics when implemented)
✅ Progressive disclosure (3-tier collapsible sections)
✅ Extensible (add BRRRR = create 2 files, change 1 line)
✅ Single Source of Truth (backend calculations only)
✅ Type-safe (property type checked first)
```

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INPUT (Frontend)                        │
│  StrategySelectionStep.tsx → User selects 'buy-hold'           │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND ANALYSIS (No Changes)                  │
│  SFRAnalyzer.analyze() → Calculates ALL 18+ metrics            │
│  Returns: { strategy: 'buy-hold', keyMetrics: {...} }          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│              STRATEGY SELECTOR (Frontend)                       │
│  getMetricTiers({ propertyType: 'SFR', strategy: 'buy-hold' }) │
│                                                                 │
│  Decision Tree:                                                 │
│  1. Is propertyType === 'MF'? → Return MF_TIERS               │
│  2. Is strategy === 'buy-hold'? → Return BUY_HOLD_TIERS       │
│  3. Is strategy === 'brrrr'? → Return BRRRR_TIERS (or fallback)│
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  TIER RENDERING (Frontend)                      │
│  Tier 1: [Cash Flow, Cap Rate, Total Investment] - Expanded    │
│  Tier 2: [CoC, IRR, DSCR, $/Sq, R/Sq, GRM, 1%] - Collapsed    │
│  Tier 3: [ROI, BEO, OER, $/Bed, DTI, Down%, EM, Loan] - Collapsed│
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

#### 1. **Single Source of Truth (Backend)**
```typescript
// ❌ WRONG - Frontend calculation
const capRate = (noi / purchasePrice) * 100;

// ✅ CORRECT - Backend provides, frontend displays
const capRate = analysis.keyMetrics.capRate;
```

#### 2. **Property Type Before Strategy**
```typescript
// ✅ CORRECT Decision Order
if (propertyType === 'MF') {
  return MF_TIERS;  // MF has different classification, not strategies
}
// Now we know it's SFR
switch (strategy) {
  case 'buy-hold': return BUY_HOLD_TIERS;
  case 'brrrr': return BRRRR_TIERS;
}
```

#### 3. **Composition Over Inheritance**
```typescript
// ✅ CORRECT - Same interface, different getValue implementations
interface MetricDefinition {
  getValue: (analysis: Analysis, propertyData?: SFRPropertyData) => number;
}

// Buy & Hold metric
{ getValue: (analysis) => analysis.keyMetrics.cashOnCashReturn }

// BRRRR metric (Phase 4)
{ getValue: (analysis) => analysis.keyMetrics.cashLeftInDeal }

// Same interface, different data extraction
```

#### 4. **Progressive Disclosure (3-Tier Pattern)**
```typescript
// Tier 1: Critical Decision Metrics (3) - Always visible
// Tier 2: Professional Financial Metrics (7) - Collapsible
// Tier 3: Advanced Risk & Operational (8) - Collapsible
//
// Pattern: 3-7-8 (Buy & Hold)
// Future: 3-6-9 (BRRRR - different priorities)
// Future: 4-5-7 (House Hack - different priorities)
```

#### 5. **Fallback Safety Net**
```typescript
// If BRRRR metrics not implemented yet:
case 'brrrr':
  console.warn('⚠️ BRRRR not implemented, showing Buy & Hold');
  return { tiers: BUY_HOLD_TIERS, isFallback: true };
// Result: Shows something (Buy & Hold) instead of crashing
```

---

## File Structure & Organization

### Current Structure (Phase 1 Complete)

```
frontend/src/components/SFRAnalysis/metricDefinitions/
│
├── index.ts                           ← Public API (what AnalysisResults.tsx imports)
├── strategySelector.ts                ← Decision logic (property type → strategy → tiers)
│
├── metrics/                           ← Metric Definitions (getValue functions)
│   ├── index.ts                       ← Metrics public API
│   ├── buyHoldMetrics.ts              ← ✅ 18 Buy & Hold metrics (Phase 1)
│   ├── brrrrMetrics.ts                ← 🔜 BRRRR metrics (Phase 4)
│   └── houseHackMetrics.ts            ← 🔜 House Hack metrics (Phase 4)
│
└── strategies/                        ← Tier Compositions (which metrics in which tier)
    ├── sfr/
    │   ├── buyHoldTiers.ts            ← ✅ 3-7-8 tier pattern (Phase 1)
    │   ├── brrrrTiers.ts              ← 🔜 BRRRR tier composition (Phase 4)
    │   └── houseHackTiers.ts          ← 🔜 House Hack tier composition (Phase 4)
    │
    └── mf/
        ├── coreMFTiers.ts             ← ✅ Minimal wrapper (Phase 1)
        ├── valueAddTiers.ts           ← 🔜 Future MF strategy variant
        └── opportunisticTiers.ts      ← 🔜 Future MF strategy variant
```

### Why This Structure?

1. **Separation of Concerns**:
   - `/metrics/` = WHAT to calculate (metric definitions)
   - `/strategies/` = HOW to organize (tier compositions)
   - `strategySelector.ts` = WHEN to show (decision logic)

2. **Extensibility**:
   - Add BRRRR = Create 2 files (`brrrrMetrics.ts` + `brrrrTiers.ts`)
   - No refactoring of existing files needed

3. **Discoverability**:
   - Want Buy & Hold metrics? → `/metrics/buyHoldMetrics.ts`
   - Want BRRRR tier structure? → `/strategies/sfr/brrrrTiers.ts`
   - Want decision logic? → `strategySelector.ts`

---

## Core Interfaces & Contracts

### MetricDefinition Interface

```typescript
export interface MetricDefinition {
  // Unique identifier (matches backend field when possible)
  id: string;

  // User-facing display name
  label: string;

  // Educational tooltip content
  description: string;

  // CRITICAL: Function to extract value from backend analysis object
  // This is the Single Source of Truth integration point
  getValue: (analysis: Analysis, propertyData?: SFRPropertyData) => number;

  // Display format (currency = $1,234.56, percent = 12.5%)
  format: 'currency' | 'percent' | 'decimal' | 'score' | 'number';

  // Progressive disclosure tier (1 = critical, 2 = professional, 3 = advanced)
  tier: 1 | 2 | 3;

  // Optional: Status logic for color coding (green/yellow/red)
  getStatus?: (value: number) => 'positive' | 'negative' | 'warning' | 'neutral';

  // Optional: Which strategies use this metric (undefined = all)
  applicableStrategies?: InvestmentStrategy[];
}
```

### Example: Buy & Hold Metric

```typescript
// /metrics/buyHoldMetrics.ts
{
  id: 'monthlyCashFlow',
  label: 'Monthly Cash Flow',
  description: 'Net monthly income after all expenses',

  // CRITICAL: Extract from backend, don't calculate
  getValue: (analysis) => analysis?.monthlyAnalysis?.cashFlow || 0,

  format: 'currency',
  tier: 1,  // Critical decision metric

  getStatus: (value) => value >= 0 ? 'positive' : 'negative',

  applicableStrategies: undefined  // All strategies use cash flow
}
```

### Example: BRRRR-Specific Metric (Phase 4)

```typescript
// /metrics/brrrrMetrics.ts (Future)
{
  id: 'cashLeftInDeal',
  label: 'Cash Left In Deal',
  description: 'Total cash remaining after refinance (negative = infinite return)',

  // Backend calculates this in Phase 2B
  getValue: (analysis) => analysis?.keyMetrics?.cashLeftInDeal || 0,

  format: 'currency',
  tier: 1,  // BRRRR critical metric

  getStatus: (value) => value <= 0 ? 'positive' : value < 10000 ? 'warning' : 'negative',

  applicableStrategies: ['brrrr']  // BRRRR-only metric
}
```

---

### MetricTier Interface

```typescript
export interface MetricTier {
  // Tier number for progressive disclosure
  tierNumber: 1 | 2 | 3;

  // Section title shown in UI
  title: string;

  // Section description (optional subtitle)
  description: string;

  // Array of metric definitions to display in this tier
  metrics: MetricDefinition[];

  // Whether section is expanded by default
  defaultExpanded: boolean;
}
```

### Example: Buy & Hold Tier Composition

```typescript
// /strategies/sfr/buyHoldTiers.ts
import {
  TIER_1_METRICS,  // [monthlyCashFlow, capRate, totalInvestment]
  TIER_2_METRICS,  // [cashOnCashReturn, irr, dscr, pricePerSqFt, ...]
  TIER_3_METRICS   // [totalROI, breakEvenOccupancy, operatingExpenseRatio, ...]
} from '../../metrics/buyHoldMetrics';

export const BUY_HOLD_TIER_1: MetricTier = {
  tierNumber: 1,
  title: 'Deal Decision Metrics',
  description: 'Critical metrics for initial investment decision',
  metrics: TIER_1_METRICS,  // 3 metrics
  defaultExpanded: true      // Always visible
};

export const BUY_HOLD_TIER_2: MetricTier = {
  tierNumber: 2,
  title: 'Financial Performance',
  description: 'Professional-grade financial analysis (7 metrics)',
  metrics: TIER_2_METRICS,  // 7 metrics
  defaultExpanded: false     // Collapsible
};

export const BUY_HOLD_TIER_3: MetricTier = {
  tierNumber: 3,
  title: 'Risk & Operational Analysis',
  description: 'Advanced analytics for experienced investors (8 metrics)',
  metrics: TIER_3_METRICS,  // 8 metrics
  defaultExpanded: false     // Collapsible
};

export const BUY_HOLD_TIERS: MetricTier[] = [
  BUY_HOLD_TIER_1,
  BUY_HOLD_TIER_2,
  BUY_HOLD_TIER_3
];
```

---

## Strategy Selector Decision Logic

### Decision Tree

```typescript
// /metricDefinitions/strategySelector.ts

export function getMetricTiers(options: StrategyOptions): StrategyResult {
  const { propertyType, strategy } = options;

  // ══════════════════════════════════════════════════════════════
  // STEP 1: Check Property Type FIRST (Critical!)
  // ══════════════════════════════════════════════════════════════
  if (propertyType === 'MF') {
    return {
      type: 'MF',
      tiers: MF_CORE_TIERS,
      info: MF_CORE_STRATEGY_INFO,
      renderExisting: true  // Use existing AnalysisResults.tsx rendering
    };
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: We know it's SFR, now check strategy
  // ══════════════════════════════════════════════════════════════
  const sfrStrategy = strategy || 'buy-hold';  // Default

  switch (sfrStrategy) {
    case 'buy-hold':
      return {
        type: 'SFR',
        strategy: 'buy-hold',
        tiers: BUY_HOLD_TIERS,
        info: BUY_HOLD_STRATEGY_INFO,
        isFallback: false
      };

    case 'brrrr':
      // ═══════════════════════════════════════════════════════════
      // Phase 4: Change this ONE line to enable BRRRR
      // FROM: tiers: BUY_HOLD_TIERS
      // TO:   tiers: BRRRR_TIERS
      // ═══════════════════════════════════════════════════════════
      console.warn('⚠️ BRRRR metrics not yet implemented');
      return {
        type: 'SFR',
        strategy: 'brrrr',
        tiers: BUY_HOLD_TIERS,  // ← Change this line in Phase 4
        info: { ...BUY_HOLD_STRATEGY_INFO, strategyName: 'BRRRR (Coming Soon)' },
        isFallback: true
      };

    case 'house-hack':
      // ═══════════════════════════════════════════════════════════
      // Phase 4: Change this ONE line to enable House Hack
      // FROM: tiers: BUY_HOLD_TIERS
      // TO:   tiers: HOUSEHACK_TIERS
      // ═══════════════════════════════════════════════════════════
      console.warn('⚠️ House Hacking metrics not yet implemented');
      return {
        type: 'SFR',
        strategy: 'house-hack',
        tiers: BUY_HOLD_TIERS,  // ← Change this line in Phase 4
        info: { ...BUY_HOLD_STRATEGY_INFO, strategyName: 'House Hack (Coming Soon)' },
        isFallback: true
      };

    default:
      console.warn(`⚠️ Unknown strategy "${sfrStrategy}"`);
      return {
        type: 'SFR',
        strategy: 'buy-hold',
        tiers: BUY_HOLD_TIERS,
        info: BUY_HOLD_STRATEGY_INFO,
        isFallback: true
      };
  }
}
```

### Why Property Type First?

```typescript
// ❌ WRONG - Strategy first leads to confusion
if (strategy === 'core') {
  // Is this SFR core? MF core? Property type unknown!
}

// ✅ CORRECT - Property type first prevents confusion
if (propertyType === 'MF') {
  // Now we know it's MF, check MF strategies (core, value-add, opportunistic)
  return getMFStrategyTiers(mfStrategy);
}
// Now we know it's SFR, check SFR strategies (buy-hold, brrrr, house-hack)
switch (sfrStrategy) { ... }
```

---

## Adding New Strategies (Cookbook)

### Scenario: Implementing BRRRR Strategy (Phase 4)

**Estimated Time**: 4-6 hours
**Files to Create**: 2
**Files to Modify**: 1 (strategySelector.ts, 1 line change)

#### Step 1: Create BRRRR Metric Definitions (2 hours)

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/metrics/brrrrMetrics.ts`

```typescript
import type { Analysis, SFRPropertyData } from '../../../../types';
import type { MetricDefinition, MetricFormat, MetricStatus } from './buyHoldMetrics';

/**
 * BRRRR Strategy Metrics
 * Focus: Forced equity, refinance potential, infinite return
 */

export const BRRRR_TIER_1_METRICS: MetricDefinition[] = [
  {
    id: 'cashLeftInDeal',
    label: 'Cash Left In Deal',
    description: 'Total cash remaining after refinance (negative = infinite return!)',
    getValue: (analysis) => analysis.keyMetrics?.cashLeftInDeal || 0,
    format: 'currency',
    tier: 1,
    getStatus: (value) => value <= 0 ? 'positive' : value < 10000 ? 'warning' : 'negative',
    applicableStrategies: ['brrrr']
  },
  {
    id: 'forcedEquity',
    label: 'Forced Equity',
    description: 'ARV minus all-in cost (purchase + rehab)',
    getValue: (analysis) => analysis.keyMetrics?.forcedEquity || 0,
    format: 'currency',
    tier: 1,
    getStatus: (value) => value >= 50000 ? 'positive' : value >= 25000 ? 'warning' : 'negative',
    applicableStrategies: ['brrrr']
  },
  {
    id: 'refinanceAmount',
    label: 'Refinance Amount',
    description: '75% of After Repair Value (typical)',
    getValue: (analysis) => analysis.keyMetrics?.refinanceAmount || 0,
    format: 'currency',
    tier: 1,
    getStatus: () => 'neutral',
    applicableStrategies: ['brrrr']
  }
];

export const BRRRR_TIER_2_METRICS: MetricDefinition[] = [
  // Reuse some Buy & Hold metrics
  {
    id: 'cashOnCashReturn',
    label: 'Cash-on-Cash Return (Post-Refinance)',
    description: 'Annual cash flow ÷ cash left in deal',
    getValue: (analysis) => analysis.keyMetrics?.cashOnCashReturn || 0,
    format: 'percent',
    tier: 2,
    getStatus: (value) => value >= 20 ? 'positive' : value >= 10 ? 'warning' : 'negative',
    applicableStrategies: ['brrrr']
  },
  // ... 5-6 more metrics (ARV validation, rehab ROI, etc.)
];

export const BRRRR_TIER_3_METRICS: MetricDefinition[] = [
  // ... 8-9 advanced metrics (refinance DSCR, equity on refinance, etc.)
];

export const ALL_BRRRR_METRICS: MetricDefinition[] = [
  ...BRRRR_TIER_1_METRICS,
  ...BRRRR_TIER_2_METRICS,
  ...BRRRR_TIER_3_METRICS
];
```

#### Step 2: Create BRRRR Tier Composition (1 hour)

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/strategies/sfr/brrrrTiers.ts`

```typescript
import {
  BRRRR_TIER_1_METRICS,
  BRRRR_TIER_2_METRICS,
  BRRRR_TIER_3_METRICS
} from '../../metrics/brrrrMetrics';
import type { MetricTier } from './buyHoldTiers';

export const BRRRR_TIER_1: MetricTier = {
  tierNumber: 1,
  title: 'BRRRR Critical Metrics',
  description: 'Forced equity and refinance analysis',
  metrics: BRRRR_TIER_1_METRICS,  // 3 metrics
  defaultExpanded: true
};

export const BRRRR_TIER_2: MetricTier = {
  tierNumber: 2,
  title: 'Post-Refinance Performance',
  description: 'Cash flow and returns after refinance (6 metrics)',
  metrics: BRRRR_TIER_2_METRICS,
  defaultExpanded: false
};

export const BRRRR_TIER_3: MetricTier = {
  tierNumber: 3,
  title: 'Refinance Risk Analysis',
  description: 'DSCR, LTV, and risk assessment (9 metrics)',
  metrics: BRRRR_TIER_3_METRICS,
  defaultExpanded: false
};

export const BRRRR_TIERS: MetricTier[] = [
  BRRRR_TIER_1,
  BRRRR_TIER_2,
  BRRRR_TIER_3
];

export const BRRRR_STRATEGY_INFO = {
  strategyName: 'BRRRR',
  strategyId: 'brrrr' as const,
  propertyType: 'SFR' as const,
  description: 'Buy, Rehab, Rent, Refinance, Repeat',
  targetInvestorProfile: 'Active investors seeking infinite returns',
  keyFocusAreas: [
    'Forced equity through value-add rehab',
    'Refinance potential at 75% LTV',
    'Cash-on-cash after refinance',
    'Infinite return opportunities'
  ],
  totalMetrics: 18,
  tierPattern: '3-6-9'
};
```

#### Step 3: Update Strategy Selector (5 minutes)

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/strategySelector.ts`

```typescript
// Add import at top
import { BRRRR_TIERS, BRRRR_STRATEGY_INFO } from './strategies/sfr/brrrrTiers';

// Update case 'brrrr' (line ~137)
case 'brrrr':
  // DELETE console.warn() line
  return {
    type: 'SFR',
    strategy: 'brrrr',
    tiers: BRRRR_TIERS,  // ← Changed from BUY_HOLD_TIERS
    info: BRRRR_STRATEGY_INFO,  // ← Changed from fallback info
    isFallback: false  // ← Changed from true
  };
```

#### Step 4: Test (1 hour)

```typescript
// Create test file: /frontend/src/components/SFRAnalysis/metricDefinitions/__tests__/brrrr.test.ts

import { getMetricTiers } from '../strategySelector';

describe('BRRRR Strategy Metrics', () => {
  it('should return BRRRR tiers when strategy is brrrr', () => {
    const result = getMetricTiers({
      propertyType: 'SFR',
      strategy: 'brrrr',
      analysis: mockAnalysis,
      propertyData: mockPropertyData
    });

    expect(result.type).toBe('SFR');
    expect(result.strategy).toBe('brrrr');
    expect(result.isFallback).toBe(false);
    expect(result.tiers).toHaveLength(3);
    expect(result.tiers[0].metrics[0].id).toBe('cashLeftInDeal');
  });

  it('should extract BRRRR metrics from backend analysis', () => {
    const mockAnalysis = {
      keyMetrics: {
        cashLeftInDeal: 5000,
        forcedEquity: 50000,
        refinanceAmount: 225000
      }
    };

    const result = getMetricTiers({ ... });
    const tier1Metrics = result.tiers[0].metrics;

    expect(tier1Metrics[0].getValue(mockAnalysis)).toBe(5000);
    expect(tier1Metrics[1].getValue(mockAnalysis)).toBe(50000);
    expect(tier1Metrics[2].getValue(mockAnalysis)).toBe(225000);
  });
});
```

#### Step 5: Done! (Total: ~4-6 hours)

**Files Created**: 2 (`brrrrMetrics.ts`, `brrrrTiers.ts`)
**Files Modified**: 1 (`strategySelector.ts`, ~5 lines)
**Zero Refactoring**: Existing Buy & Hold code untouched

---

### Scenario: Implementing House Hack Strategy

**Same process**, different metrics:

1. Create `/metrics/houseHackMetrics.ts` (2 hours)
   - Tier 1: Effective Housing Cost, Owner-Occupied Savings, FHA Down Payment
   - Tier 2: Cash flow from rental units, CoC on remaining investment
   - Tier 3: Risk analysis, loan qualification metrics

2. Create `/strategies/sfr/houseHackTiers.ts` (1 hour)
   - Pattern: 4-5-7 (different priorities than Buy & Hold)

3. Update `strategySelector.ts` case 'house-hack' (5 min)
   - Import, change 1 line

4. Test (1 hour)

**Total**: ~4 hours

---

### Scenario: Adding MF Strategy Variants (Core, Value-Add, Opportunistic)

**Same pattern**, MF-specific:

1. Create `/metrics/mfCoreMetrics.ts`, `/metrics/mfValueAddMetrics.ts`, etc.
2. Create `/strategies/mf/coreMetricsTiers.ts`, etc.
3. Update `strategySelector.ts` MF section with MF strategy switch
4. Test

**Key Difference**: MF strategies are NOT investment strategies (brrrr, buy-hold), they're property classifications (core, value-add, opportunistic)

---

## Type System & Backend Integration

### Frontend Types (Ready for Phase 2-4)

**File**: `/frontend/src/types/analysis.ts`

```typescript
export interface Analysis {
  // Existing fields...
  monthlyAnalysis: MonthlyAnalysis;
  annualAnalysis: AnnualAnalysis;
  longTermAnalysis: { ... };
  keyMetrics: KeyMetrics;
  aiInsights?: AIInsights;
  validationWarnings?: ValidationWarning[];

  // ✅ Phase 1: Strategy field added (backend echoes back user's selection)
  strategy?: 'buy-hold' | 'house-hack' | 'brrrr';
}

export interface KeyMetrics {
  // Existing Buy & Hold metrics (20 fields)
  dscr?: number;
  capRate?: number;
  cashOnCashReturn?: number;
  irr: number;
  totalROI: number;
  // ... 15 more

  // ✅ Phase 1: BRRRR-specific metrics added (backend will populate in Phase 2B)
  refinanceAmount?: number;
  cashLeftInDeal?: number;
  forcedEquity?: number;
  allInCost?: number;
  equityOnRefinance?: number;

  // ✅ Phase 1: House Hack-specific metrics added (backend will populate in Phase 2B)
  effectiveHousingCost?: number;
  ownerEquivalentRent?: number;
  housingCostReduction?: number;
}
```

### Backend Integration Points (Phase 2)

When backend is ready to support BRRRR/House Hack:

#### Backend Type Updates (Phase 2A)

**File**: `/backend/src/types/property.ts`

```typescript
export interface SFRPropertyData {
  // Existing fields...
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  // ... 60+ fields

  // ✅ Add strategy field
  strategy: 'buy-hold' | 'house-hack' | 'brrrr';

  // BRRRR-specific fields (optional)
  rehabBudget?: number;
  afterRepairValue?: number;
  refinanceDownPayment?: number;  // LTV for refinance (default 75%)

  // House Hack-specific fields (optional)
  ownerOccupiedUnit?: number;  // Which unit (1-4)
  ownerOccupiedSqft?: number;
}
```

#### Backend Calculation Strategy (Phase 2B)

**File**: `/backend/src/utils/financialCalculations.ts`

```typescript
static calculatePropertySpecificMetrics(data: SFRPropertyData, ...): KeyMetrics {
  let metrics = {
    // Calculate base metrics (all strategies)
    cashOnCashReturn: ...,
    capRate: ...,
    // ... etc
  };

  // Strategy-specific calculations
  if (data.strategy === 'brrrr') {
    const brrrrMetrics = BRRRRCalculator.calculate(data, metrics);
    metrics = { ...metrics, ...brrrrMetrics };
  } else if (data.strategy === 'house-hack') {
    const houseHackMetrics = HouseHackCalculator.calculate(data, metrics);
    metrics = { ...metrics, ...houseHackMetrics };
  }
  // 'buy-hold' or undefined: use base metrics only

  return metrics;
}
```

#### Backend Response (Phase 2C)

```typescript
// Backend returns
{
  strategy: 'brrrr',  // Echo back user's selection
  keyMetrics: {
    // Base metrics (all strategies)
    cashOnCashReturn: 8.5,
    capRate: 5.2,
    irr: 0.12,

    // BRRRR-specific metrics (only when strategy = 'brrrr')
    refinanceAmount: 225000,
    cashLeftInDeal: 5000,
    forcedEquity: 50000,
    allInCost: 250000,
    equityOnRefinance: 75000
  }
}
```

#### Frontend Receives & Displays

```typescript
// Frontend receives analysis
const analysis: Analysis = response.data;

// Strategy selector extracts strategy
const result = getMetricTiers({
  propertyType: 'SFR',
  strategy: analysis.strategy,  // 'brrrr' from backend
  analysis,
  propertyData
});

// Result: BRRRR tiers with BRRRR metrics
result.tiers[0].metrics.forEach(metric => {
  const value = metric.getValue(analysis);  // Extracts cashLeftInDeal, forcedEquity, etc.
  // Display: $5,000 Cash Left In Deal ✓ (green)
});
```

---

## Testing Strategy

### Unit Tests

#### 1. Metric Definition Tests

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/__tests__/buyHoldMetrics.test.ts`

```typescript
import { TIER_1_METRICS } from '../metrics/buyHoldMetrics';

describe('Buy & Hold Metric Definitions', () => {
  it('should extract monthly cash flow from backend analysis', () => {
    const mockAnalysis = {
      monthlyAnalysis: { cashFlow: 234 }
    };

    const metric = TIER_1_METRICS.find(m => m.id === 'monthlyCashFlow');
    expect(metric.getValue(mockAnalysis)).toBe(234);
  });

  it('should return 0 if backend data missing (defensive)', () => {
    const emptyAnalysis = {};

    const metric = TIER_1_METRICS.find(m => m.id === 'monthlyCashFlow');
    expect(metric.getValue(emptyAnalysis)).toBe(0);  // Fallback
  });

  it('should format currency correctly', () => {
    const metric = TIER_1_METRICS.find(m => m.id === 'monthlyCashFlow');
    expect(metric.format).toBe('currency');
  });

  it('should have correct tier assignment', () => {
    TIER_1_METRICS.forEach(metric => {
      expect(metric.tier).toBe(1);  // All Tier 1 metrics
    });
  });
});
```

#### 2. Strategy Selector Tests

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/__tests__/strategySelector.test.ts`

```typescript
import { getMetricTiers } from '../strategySelector';

describe('Strategy Selector Logic', () => {
  it('should return MF tiers for propertyType = MF', () => {
    const result = getMetricTiers({
      propertyType: 'MF',
      strategy: 'buy-hold',  // Ignored for MF
      analysis: {},
      propertyData: {}
    });

    expect(result.type).toBe('MF');
    expect(result.renderExisting).toBe(true);
  });

  it('should return Buy & Hold tiers for strategy = buy-hold', () => {
    const result = getMetricTiers({
      propertyType: 'SFR',
      strategy: 'buy-hold',
      analysis: {},
      propertyData: {}
    });

    expect(result.type).toBe('SFR');
    expect(result.strategy).toBe('buy-hold');
    expect(result.isFallback).toBe(false);
    expect(result.tiers).toHaveLength(3);
  });

  it('should fallback to Buy & Hold for unimplemented BRRRR (Phase 1)', () => {
    const result = getMetricTiers({
      propertyType: 'SFR',
      strategy: 'brrrr',
      analysis: {},
      propertyData: {}
    });

    expect(result.type).toBe('SFR');
    expect(result.strategy).toBe('brrrr');
    expect(result.isFallback).toBe(true);  // Fallback active
    expect(result.tiers[0].metrics[0].id).toBe('monthlyCashFlow');  // Buy & Hold metric
  });

  it('should check property type BEFORE strategy', () => {
    // Even if strategy = 'buy-hold', MF should return MF tiers
    const result = getMetricTiers({
      propertyType: 'MF',
      strategy: 'buy-hold',
      analysis: {},
      propertyData: {}
    });

    expect(result.type).toBe('MF');  // Property type wins
  });
});
```

#### 3. Tier Composition Tests

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/__tests__/buyHoldTiers.test.ts`

```typescript
import { BUY_HOLD_TIERS } from '../strategies/sfr/buyHoldTiers';

describe('Buy & Hold Tier Composition', () => {
  it('should have 3 tiers with 3-7-8 pattern', () => {
    expect(BUY_HOLD_TIERS).toHaveLength(3);
    expect(BUY_HOLD_TIERS[0].metrics).toHaveLength(3);  // Tier 1
    expect(BUY_HOLD_TIERS[1].metrics).toHaveLength(7);  // Tier 2
    expect(BUY_HOLD_TIERS[2].metrics).toHaveLength(8);  // Tier 3
  });

  it('should have Tier 1 expanded by default', () => {
    expect(BUY_HOLD_TIERS[0].defaultExpanded).toBe(true);
    expect(BUY_HOLD_TIERS[1].defaultExpanded).toBe(false);
    expect(BUY_HOLD_TIERS[2].defaultExpanded).toBe(false);
  });

  it('should have correct tier numbers', () => {
    expect(BUY_HOLD_TIERS[0].tierNumber).toBe(1);
    expect(BUY_HOLD_TIERS[1].tierNumber).toBe(2);
    expect(BUY_HOLD_TIERS[2].tierNumber).toBe(3);
  });
});
```

### Integration Tests (Phase 3)

#### E2E Test: Buy & Hold Analysis

```typescript
// /cypress/e2e/buy-hold-metrics-display.cy.js

describe('Buy & Hold Metrics Display', () => {
  it('should show 3 critical metrics expanded by default', () => {
    cy.visit('/analyze/buy-hold-property-id');

    // Tier 1 should be visible
    cy.contains('Deal Decision Metrics').should('be.visible');
    cy.contains('Monthly Cash Flow').should('be.visible');
    cy.contains('Cap Rate').should('be.visible');
    cy.contains('Total Cash Needed').should('be.visible');

    // Tier 2 should be collapsed
    cy.contains('Financial Performance (7 metrics)').should('be.visible');
    cy.contains('Cash-on-Cash Return').should('not.be.visible');
  });

  it('should expand Tier 2 when clicked', () => {
    cy.contains('Financial Performance').click();

    // Now Tier 2 metrics visible
    cy.contains('Cash-on-Cash Return').should('be.visible');
    cy.contains('10-Year IRR').should('be.visible');
    cy.contains('DSCR').should('be.visible');
  });
});
```

---

## Future Roadmap

### Phase 1: Foundation (✅ Complete - Dec 13, 2025)
- ✅ Buy & Hold metrics (18 metrics, 3-tier display)
- ✅ Strategy selector architecture
- ✅ MF wrapper (backward compatible)
- ✅ Type system ready for BRRRR/House Hack
- ✅ Documentation (this file)

### Phase 2: Backend Strategy Support (🔜 Next - Required for BRRRR)
- **Phase 2A**: Backend type system (1-2 days)
- **Phase 2B**: Strategy-aware calculations (3-5 days)
- **Phase 2C**: Strategy-aware decision engine (2-3 days)
- **Estimated Total**: 6-10 days

### Phase 3: UI Integration (✅ Complete - Dec 14, 2025)
- ✅ Updated AnalysisResults.tsx to use `getMetricTiers()`
- ✅ Implemented collapsible tier sections (Tier 2 & 3)
- ✅ Progressive disclosure with Apple Design System styling
- ✅ Mobile responsive tier display
- ✅ Unified experience (removed Pro/Learning mode toggle)
- ✅ Educational tooltips for all users
- ✅ Professional Investment Intelligence made collapsible
- ✅ Issue #25: Dynamic IRR/Total ROI labels based on hold period

### Phase 4: BRRRR & House Hack Frontend (🔜 Future)
- BRRRR metrics definitions (2 hours)
- BRRRR tier composition (1 hour)
- House Hack metrics (2 hours)
- House Hack tier composition (1 hour)
- Strategy selector integration (5 min)
- Testing (2 hours)

### Phase 5: MF Strategy Variants (🔮 Long-term)
- Core vs Value-Add vs Opportunistic metrics
- MF strategy selector logic
- Tier compositions for each MF strategy

---

## Common Pitfalls & Solutions

### Pitfall #1: Calculating in Frontend Instead of Backend

```typescript
// ❌ WRONG - Frontend calculation
{
  id: 'capRate',
  getValue: (analysis, propertyData) => {
    const noi = propertyData.monthlyRent * 12 - expenses;
    return (noi / propertyData.purchasePrice) * 100;
  }
}

// ✅ CORRECT - Extract from backend
{
  id: 'capRate',
  getValue: (analysis) => analysis.keyMetrics?.capRate || 0
}
```

**Why**: Backend is Single Source of Truth (See Issue #31)

---

### Pitfall #2: Strategy Before Property Type

```typescript
// ❌ WRONG - Strategy first
switch (strategy) {
  case 'core':  // Is this MF core or SFR core? Unknown!
}

// ✅ CORRECT - Property type first
if (propertyType === 'MF') {
  // Now we know it's MF core
}
```

**Why**: Prevents confusion between property types

---

### Pitfall #3: Hardcoding Tiers Instead of Using Composition

```typescript
// ❌ WRONG - Hardcoded tier
export const BRRRR_TIERS = [
  {
    metrics: [
      { id: 'cashLeft', getValue: ... },  // Inline metric definitions
      { id: 'forcedEquity', getValue: ... }
    ]
  }
];

// ✅ CORRECT - Composition pattern
import { BRRRR_TIER_1_METRICS } from '../../metrics/brrrrMetrics';

export const BRRRR_TIER_1: MetricTier = {
  metrics: BRRRR_TIER_1_METRICS  // Reusable metric definitions
};
```

**Why**: Metrics can be reused across strategies, easier to test

---

### Pitfall #4: Forgetting Fallback Logic

```typescript
// ❌ WRONG - No fallback
getValue: (analysis) => analysis.keyMetrics.cashLeftInDeal

// ✅ CORRECT - Defensive fallback
getValue: (analysis) => analysis.keyMetrics?.cashLeftInDeal || 0
```

**Why**: Backend might not send field yet, frontend shouldn't crash

---

### Pitfall #5: Modifying Existing Strategy Files When Adding New Strategy

```typescript
// ❌ WRONG - Modifying buyHoldMetrics.ts to add BRRRR metrics
// /metrics/buyHoldMetrics.ts
export const BRRRR_METRICS = [ ... ];  // Don't add here!

// ✅ CORRECT - Create new file
// /metrics/brrrrMetrics.ts
export const BRRRR_METRICS = [ ... ];  // New file
```

**Why**: Separation of concerns, easier to maintain

---

## Summary Checklist for New Strategies

When implementing a new strategy (BRRRR, House Hack, etc.), use this checklist:

### Backend Work (Phase 2)
- [ ] Add strategy type to `SFRPropertyData` interface
- [ ] Add strategy-specific input fields (e.g., `rehabBudget`, `ownerOccupiedUnit`)
- [ ] Add strategy-specific metric fields to `KeyMetrics` interface
- [ ] Create strategy calculator (e.g., `BRRRRCalculator.ts`)
- [ ] Update `financialCalculations.ts` to use strategy calculator
- [ ] Update Investment Decision Engine scoring for strategy
- [ ] Write backend unit tests for strategy calculations

### Frontend Work (Phase 4)
- [ ] Create metric definitions file (`/metrics/[strategy]Metrics.ts`)
- [ ] Define Tier 1 metrics (3-4 critical decision metrics)
- [ ] Define Tier 2 metrics (5-7 professional metrics)
- [ ] Define Tier 3 metrics (7-9 advanced metrics)
- [ ] Create tier composition file (`/strategies/sfr/[strategy]Tiers.ts`)
- [ ] Import in `strategySelector.ts`
- [ ] Update switch case in `strategySelector.ts` (change 1-2 lines)
- [ ] Write frontend unit tests for metric extraction
- [ ] Write E2E tests for tier display
- [ ] Update this documentation

### Testing Checklist
- [ ] Unit tests: Metric definitions extract correct backend values
- [ ] Unit tests: Strategy selector returns correct tiers
- [ ] Unit tests: Tier composition has correct metric count
- [ ] Integration tests: Backend returns strategy-specific metrics
- [ ] E2E tests: User selects strategy → sees correct metrics
- [ ] E2E tests: Tier expand/collapse works
- [ ] Regression tests: Buy & Hold still works (no breaking changes)

---

## Document Maintenance

**Last Updated**: December 13, 2024
**Next Review**: When Phase 2-4 starts (BRRRR/House Hack implementation)

**Update Triggers**:
- New strategy added (BRRRR, House Hack, MF variants)
- MetricDefinition interface changes
- Strategy selector decision logic changes
- Backend integration contract changes

**Document Owner**: Architect (from claude.md)

---

## Related Documentation

- `/docs/METRICS_REORGANIZATION_PLAN.md` - Phase 1 implementation plan
- `/docs/ISSUE_TRACKER.md` (Issue #31) - Frontend calculation duplication technical debt
- `/docs/README.md` - Documentation index
- `/frontend/src/types/analysis.ts` - Frontend type definitions
- `/backend/src/types/property.ts` - Backend type definitions (Phase 2)

---

**End of Document**
