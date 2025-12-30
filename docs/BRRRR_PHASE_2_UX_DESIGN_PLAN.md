# BRRRR Phase 2: UX Design Implementation Plan

**Author**: Senior UX Designer (CLAUDE.md) - 18 years experience, 10 years at Apple
**Date**: December 21, 2025
**Status**: ✅ APPROVED - Ready for Implementation
**Design Philosophy**: Apple Human Interface Guidelines + Progressive Disclosure

---

## Executive Summary

This document defines the complete UX design approach for BRRRR Phase 2 Frontend Implementation. All designs follow Apple Design System principles (Simplicity, Clarity, Deference, Depth) and leverage existing proven patterns from the Multi-Family implementation.

**Key Design Decisions**:
1. **Three-Phase Progressive Disclosure** - Core → Details → Advanced
2. **Mobile-First Responsive** - 40%+ usage expected on mobile
3. **Infinite Return Celebration** - Apple-style achievement alert
4. **Before/After Comparison** - Clear visualization of BRRRR trade-off
5. **Reuse Existing Components** - TapToExpandField, MetricCard, ExpandableSection

**Estimated Implementation**: 19-25 hours (6 sub-phases)

---

## 📋 Design Review Summary

### ✅ Strengths Identified

1. **Solid Foundation Exists**
   - Apple Design System fully implemented (`appleDesignSystem.ts`)
   - Progressive disclosure pattern proven (`TapToExpandField`, Unit Mix tab)
   - Strategy card pattern established (`StrategySelectionStep.tsx`)
   - Multi-Family tab injection precedent (conditional rendering working)

2. **Clear User Journey Documented**
   - `BRRRR_VS_BUYHOLD_METRICS_COMPARISON.md` defines all 25+ metrics
   - Capital Recovery tab structure (7 sections) clearly documented
   - Business Expert validated user needs (15 real BRRRR deals)

3. **Design Principles Already Applied**
   - **Simplicity**: Progressive disclosure, smart defaults
   - **Clarity**: Dollar values shown, percentages hidden
   - **Deference**: Content-first, minimal chrome
   - **Depth**: Subtle elevation, layers communicate hierarchy

### ⚠️ Design Challenges Identified

1. **Information Density Risk**
   - Capital Recovery tab has 7 sections (Hero, Rehab/ARV, Refinance, Seasoning, Post-Refi, Sensitivity, Timeline)
   - **Risk**: Overwhelming BRRRR beginners with complexity
   - **Solution**: 3-phase progressive disclosure (Core → Details → Advanced)

2. **Mobile Experience Critical**
   - 40%+ users analyze properties on-site during tours
   - Capital Recovery tab must be fully functional on iPhone SE (375px width)
   - **Solution**: Mobile-first collapsible sections, priority metrics above fold

3. **Before/After Comparison Clarity**
   - BRRRR shows trade-off: Higher capital recovery, lower monthly cash flow
   - Users may not understand why cash flow drops after refinance
   - **Solution**: Visual side-by-side comparison with clear explanation

4. **Infinite Return Celebration**
   - 100%+ capital recovery is the "holy grail" of BRRRR
   - Current design doesn't convey magnitude of achievement
   - **Solution**: Apple-style celebration alert (inspired by Apple Pay success)

---

## 🎨 Design Improvements for Phase 2

### Improvement 1: Strategy Card Enhancement (Phase 2.1)

**Current State**: BRRRR card shows "Coming Soon" badge, disabled interaction

**Proposed Change**: Enable with "Advanced" badge, add confidence indicator

**Visual Design**:
```
┌─────────────────────────────┐
│  🔄 BRRRR                   │
│  ────────────────────────   │
│  Buy, Rehab, Rent,          │
│  Refinance, Repeat          │
│                             │
│  Build portfolio with       │
│  recycled capital           │
│                             │
│  💡 Best for: Investors     │
│     with rehab experience   │
│                             │
│  [ADVANCED] badge           │
└─────────────────────────────┘
```

**Design Rationale**:
- "Advanced" badge sets expectations (not for beginners)
- Confidence requirement prevents novice mistakes
- Maintains Apple simplicity (no overwhelming warnings)

**Component**: `StrategySelectionStep.tsx` (lines 184-195)

**Changes**:
```typescript
// BEFORE:
<StrategyCard
  strategy="brrrr"
  title="BRRRR"
  description="Buy, Rehab, Rent, Refinance, Repeat - Build portfolio with recycled capital"
  icon={<BRRRRIcon />}
  selected={strategy === 'brrrr'}
  onSelect={() => {}} // Disabled in Phase 1
  comingSoon={true}
  badgeText="Coming Soon"
/>

// AFTER:
<StrategyCard
  strategy="brrrr"
  title="BRRRR"
  description="Buy, Rehab, Rent, Refinance, Repeat - Build portfolio with recycled capital"
  subtitle="Best for: Investors with rehab experience"
  icon={<BRRRRIcon />}
  selected={strategy === 'brrrr'}
  onSelect={() => onStrategyChange('brrrr')}
  comingSoon={false}
  badgeText="Advanced"
  badgeColor={appleColors.orange[500]} // Orange = caution
/>
```

---

### Improvement 2: BRRRR Fields in Financials Step (Phase 2.2)

**Current State**: Standard financial fields only

**Proposed Change**: Conditional BRRRR section with progressive disclosure

**Visual Design**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard Financial Fields
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purchase Price: $200,000
Down Payment: 25% → $50,000
Interest Rate: 7.5%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 BRRRR Strategy Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rehab Budget *
┌──────────────────────────┐
│ $40,000                  │
└──────────────────────────┘
💡 Total renovation costs ($5K-500K)

After Repair Value (ARV) *
┌──────────────────────────┐
│ $320,000                 │
└──────────────────────────┘
💡 Property value after repairs
   Use recent comps to estimate

▼ Advanced Settings (Optional)
  │ Refinance LTV: 75% [────●──] 65-85%
  │ Seasoning Period: 12 months [──●────] 6-24
  │ ARV Confidence: ○ Conservative ● Moderate ○ Aggressive
```

**Design Principles Applied**:
- **Required fields first** (Rehab, ARV)
- **Optional fields collapsed** (LTV, Seasoning in accordion)
- **Smart defaults visible** (75% LTV, 12 months)
- **Contextual help** (Use comps for ARV)
- **Input validation inline** (ARV must exceed purchase price)

**Component**: `FinancialsStep.tsx`

**Implementation**:
```typescript
// After existing financial fields (around line 200)

{state.data.strategy === 'brrrr' && (
  <Box sx={{ mt: 4 }}>
    {/* Section Divider */}
    <Divider sx={{ my: 3 }} />

    {/* BRRRR Section Header */}
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <BRRRRIcon sx={{ mr: 1.5, color: appleColors.primary[600] }} />
      <Typography variant="h6" fontWeight={600} sx={{ color: appleColors.gray[900] }}>
        BRRRR Strategy Details
      </Typography>
      <Chip
        label="Advanced"
        size="small"
        sx={{
          ml: 2,
          backgroundColor: appleColors.orange[100],
          color: appleColors.orange[700]
        }}
      />
    </Box>

    {/* Required Fields */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Rehab Budget"
          type="number"
          value={state.data.brrrr?.rehabBudget || ''}
          onChange={(e) => handleBRRRRFieldChange('rehabBudget', e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          helperText="Total renovation/repair costs ($5K-500K)"
          error={validation?.errors?.brrrr?.rehabBudget}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="After Repair Value (ARV)"
          type="number"
          value={state.data.brrrr?.afterRepairValue || ''}
          onChange={(e) => handleBRRRRFieldChange('afterRepairValue', e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          helperText="Estimated property value after repairs (use recent comps)"
          error={validation?.errors?.brrrr?.afterRepairValue ||
                 (state.data.brrrr?.afterRepairValue <= state.data.purchasePrice)}
        />
        {state.data.brrrr?.afterRepairValue <= state.data.purchasePrice && (
          <Alert severity="error" sx={{ mt: 1 }}>
            ARV must exceed purchase price for BRRRR strategy
          </Alert>
        )}
      </Grid>
    </Grid>

    {/* Advanced Settings (Collapsed by default) */}
    <Accordion
      sx={{
        mt: 3,
        boxShadow: 'none',
        border: `1px solid ${appleColors.gray[200]}`,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" fontWeight={600}>
          Advanced Settings (Optional)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          {/* Refinance LTV Slider */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1, color: appleColors.gray[700] }}>
              Refinance LTV: {state.data.brrrr?.refinanceLTV || 75}%
            </Typography>
            <Slider
              value={state.data.brrrr?.refinanceLTV || 75}
              onChange={(e, value) => handleBRRRRFieldChange('refinanceLTV', value)}
              min={65}
              max={85}
              step={5}
              marks={[
                { value: 65, label: '65%' },
                { value: 75, label: '75%' },
                { value: 85, label: '85%' }
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
              Loan-to-value ratio for refinance (75% standard)
            </Typography>
          </Grid>

          {/* Seasoning Period Slider */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb: 1, color: appleColors.gray[700] }}>
              Seasoning Period: {state.data.brrrr?.seasoningPeriod || 12} months
            </Typography>
            <Slider
              value={state.data.brrrr?.seasoningPeriod || 12}
              onChange={(e, value) => handleBRRRRFieldChange('seasoningPeriod', value)}
              min={6}
              max={24}
              step={3}
              marks={[
                { value: 6, label: '6mo' },
                { value: 12, label: '12mo' },
                { value: 24, label: '24mo' }
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>
              Months required before refinancing (12 months standard)
            </Typography>
          </Grid>

          {/* ARV Confidence Toggle */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1, color: appleColors.gray[700] }}>
              ARV Confidence Level
            </Typography>
            <ToggleButtonGroup
              value={state.data.brrrr?.arvAppraisalConfidence || 'moderate'}
              exclusive
              onChange={(e, value) => value && handleBRRRRFieldChange('arvAppraisalConfidence', value)}
              fullWidth
            >
              <ToggleButton value="conservative">Conservative (-10%)</ToggleButton>
              <ToggleButton value="moderate">Moderate</ToggleButton>
              <ToggleButton value="aggressive">Optimistic (+10%)</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
              How certain are you of the ARV? Use recent comps for accurate estimates.
            </Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  </Box>
)}
```

---

### Improvement 3: Capital Recovery Tab Component (Phase 2.3)

**Three-Phase Progressive Disclosure**:

#### Phase A: Core Metrics (Always Visible - Above Fold Mobile)

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│ 🎉 INFINITE RETURN ACHIEVED!                │
│ You'll own this property with $0 invested   │
└─────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Total Capital│ Capital      │ Capital      │
│ Deployed     │ Recovered    │ Remaining    │
│              │              │              │
│ $78,768      │ $81,600      │ $0           │
│ Down+Rehab   │ Refinance    │ Infinite!    │
└──────────────┴──────────────┴──────────────┘

     Capital Recovery Rate
     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 105.6%
     ────────────────────────────
     0%         100%         150%
            ↑ Infinite Return
```

**Component**: `BRRRRAnalysisTab.tsx` (NEW)

**Implementation**:
```typescript
import React from 'react';
import { Box, Typography, Card, CardContent, Alert, LinearProgress } from '@mui/material';
import Grid from '@mui/system/Grid';
import { appleColors } from '../../theme/appleDesignSystem';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface BRRRRAnalysisTabProps {
  analysis: any;
  propertyData: any;
}

export const BRRRRAnalysisTab: React.FC<BRRRRAnalysisTabProps> = ({
  analysis,
  propertyData
}) => {
  const brrrData = analysis.strategySpecific;
  const capitalRecovery = brrrData.capitalRecovery;
  const isInfiniteReturn = capitalRecovery.capitalRecoveryRate >= 100;

  return (
    <Box sx={{ p: 3 }}>
      {/* Infinite Return Alert */}
      {isInfiniteReturn && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            backgroundColor: appleColors.green[500],
            color: 'white',
            fontSize: '18px',
            fontWeight: 600,
            '& .MuiAlert-icon': { color: 'white', fontSize: '28px' }
          }}
          icon={<span>🎉</span>}
        >
          <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
            INFINITE RETURN ACHIEVED!
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', mt: 0.5 }}>
            You'll own this property with $0 of your capital invested.
          </Typography>
        </Alert>
      )}

      {/* Hero Metrics - 3 Column Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Total Capital Deployed
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: appleColors.gray[900] }}>
                {formatCurrency(capitalRecovery.totalCapitalDeployed)}
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                Down Payment + Closing + Rehab
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%', borderColor: appleColors.green[500], borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Capital Recovered
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: appleColors.green[700] }}>
                {formatCurrency(capitalRecovery.capitalRecovered)}
              </Typography>
              <Typography variant="caption" sx={{ color: appleColors.gray[600], display: 'block', mt: 1 }}>
                Cash-out refinance proceeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: appleColors.gray[600], mb: 1 }}>
                Capital Remaining
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{
                color: isInfiniteReturn ? appleColors.green[700] : appleColors.gray[900]
              }}>
                {formatCurrency(capitalRecovery.capitalRemaining)}
              </Typography>
              <Typography variant="caption" sx={{
                color: isInfiniteReturn ? appleColors.green[700] : appleColors.gray[600],
                display: 'block',
                mt: 1,
                fontWeight: isInfiniteReturn ? 600 : 400
              }}>
                {isInfiniteReturn ? '✨ Infinite Return!' : 'Still invested in property'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Capital Recovery Rate Progress Bar */}
      <Card elevation={1} sx={{ p: 3, backgroundColor: appleColors.gray[50] }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: appleColors.gray[900] }}>
          Capital Recovery Rate
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h3" fontWeight={700} sx={{
            color: capitalRecovery.capitalRecoveryRate >= 100
              ? appleColors.green[700]
              : capitalRecovery.capitalRecoveryRate >= 70
                ? appleColors.primary[700]
                : appleColors.orange[700]
          }}>
            {formatPercent(capitalRecovery.capitalRecoveryRate)}
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, color: appleColors.gray[600] }}>
            of invested capital recovered
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(capitalRecovery.capitalRecoveryRate, 150)} // Cap at 150% for visual
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: appleColors.gray[200],
            '& .MuiLinearProgress-bar': {
              backgroundColor: capitalRecovery.capitalRecoveryRate >= 100
                ? appleColors.green[500]
                : appleColors.primary[500],
              borderRadius: 6
            }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>0%</Typography>
          <Typography variant="caption" sx={{ color: appleColors.green[700], fontWeight: 600 }}>
            ↑ 100% = Infinite Return
          </Typography>
          <Typography variant="caption" sx={{ color: appleColors.gray[600] }}>150%</Typography>
        </Box>
      </Card>

      {/* Phase B & C sections will be added in Phase 2.5 */}
    </Box>
  );
};
```

#### Phase B: Details (Tap to Expand)

**Visual Design**:
```
▼ Refinance Projections
  │ After Repair Value (ARV): $320,000
  │ New Loan Amount (75% LTV): $240,000
  │ Cash-Out Proceeds: $81,600
  │ Refinance Closing Costs: -$4,800
  │ Net Cash-Out: $76,800

▼ Before vs After Refinance
  │                    Before    After    Change
  │ Monthly Cash Flow  $450      $87      -$363 ↓
  │ Cash-on-Cash ROI   8.2%      ∞        ↑
  │ Capital Invested   $78,768   $0       -$78,768 ✅
```

**Component**: `BeforeAfterComparison.tsx` (NEW - Phase 2.5)

#### Phase C: Advanced Analysis (Accordion Collapsed)

**Visual Design**:
```
▼ Sensitivity Analysis
  │ ARV Pessimistic (-10%): 82% recovery ⚠️
  │ ARV Optimistic (+10%): 128% recovery 🎉
  │ Rehab Overrun (+20%): 86% recovery ⚠️

▼ 70% Rule Check
  │ Max Purchase: $184,000 ✅
  │ Actual Purchase: $170,000 ✅
  │ Margin of Safety: $14,000 (4.4% of ARV)

▼ BRRRR Timeline
  │ Month 0-4: Purchase & Rehab
  │ Month 5-12: Rent & Stabilize (Seasoning)
  │ Month 12: Refinance & Extract Capital
```

**Component**: `BRRRRAnalysisTab.tsx` (Expanded sections - Phase 2.5)

---

### Improvement 4: Infinite Return Visual Treatment

**Inspiration**: Apple Pay success animation, Apple Watch activity achievement

**Proposed Design**:
```
┌────────────────────────────────────────────┐
│  🎉  🎉  🎉  🎉  🎉  🎉  🎉  🎉  🎉  🎉    │
│                                            │
│      INFINITE RETURN ACHIEVED!             │
│      ═══════════════════════               │
│                                            │
│  You'll own this property with             │
│  $0 of your capital invested.              │
│                                            │
│  Capital Recovery: 105.6%                  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 105.6%              │
│                                            │
│  [ View Recovery Details → ]               │
└────────────────────────────────────────────┘
```

**Design Specifications**:
- **Color**: `appleColors.green[500]` background, white text
- **Elevation**: 8 (floating above content)
- **Animation**: Subtle pulse on load (600ms ease)
- **Typography**: SF Pro Display Bold, 24px
- **Spacing**: 24px padding, 16px border radius
- **Position**: Top of Capital Recovery tab

**Component**: `InfiniteReturnAlert.tsx` (NEW)

```typescript
import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import { keyframes } from '@mui/system';
import { appleColors } from '../../theme/appleDesignSystem';
import { formatPercent } from '../../utils/formatters';

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

interface InfiniteReturnAlertProps {
  capitalRecoveryRate: number;
  capitalRemaining: number;
}

export const InfiniteReturnAlert: React.FC<InfiniteReturnAlertProps> = ({
  capitalRecoveryRate,
  capitalRemaining
}) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Stop animation after 2 seconds
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (capitalRecoveryRate < 100) return null;

  return (
    <Box
      sx={{
        animation: showAnimation ? `${pulseAnimation} 600ms ease-in-out` : 'none',
        mb: 3
      }}
    >
      <Alert
        severity="success"
        sx={{
          backgroundColor: appleColors.green[500],
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          '& .MuiAlert-icon': {
            color: 'white',
            fontSize: '32px',
            marginRight: '16px'
          }
        }}
        icon={<span>🎉</span>}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: 'white',
              mb: 2,
              letterSpacing: '0.5px'
            }}
          >
            INFINITE RETURN ACHIEVED!
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 400,
              mb: 3,
              opacity: 0.95
            }}
          >
            You'll own this property with $0 of your capital invested.
          </Typography>

          <Box sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            mb: 2
          }}>
            <Typography variant="body2" sx={{ color: 'white', mb: 1, opacity: 0.9 }}>
              Capital Recovery Rate
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color: 'white' }}>
              {formatPercent(capitalRecoveryRate)}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: 'white',
              opacity: 0.85,
              display: 'block',
              fontSize: '14px'
            }}
          >
            This is the ultimate BRRRR achievement - recycle your capital into the next deal!
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
};
```

---

### Improvement 5: Mobile-First Responsive Design

**Mobile Breakpoint Strategy**:
```
iPhone SE (375px):
  - Hero metrics: 1 column
  - Capital Recovery Rate: Full width
  - Sections: Accordion collapsed by default
  - "Before/After" stacked vertically

iPad (768px):
  - Hero metrics: 2 columns
  - "Before/After" side-by-side
  - Sections: Expandable but not collapsed

Desktop (1024px+):
  - Hero metrics: 3 columns
  - All sections expanded by default
  - Timeline visualization horizontal
```

**Critical Mobile Optimizations**:
1. **Hero metric font size**: 32px → 24px mobile
2. **Padding reduction**: 24px → 16px mobile
3. **Tap targets**: Minimum 44px height (Apple HIG)
4. **Horizontal scroll**: Never (break into rows)
5. **Infinite Return alert**: Always visible above fold

**Responsive Grid Implementation**:
```typescript
// Mobile-first responsive grid
<Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
  <Grid size={{ xs: 12, md: 4 }}>
    {/* Hero Metric 1 */}
  </Grid>
  <Grid size={{ xs: 12, md: 4 }}>
    {/* Hero Metric 2 */}
  </Grid>
  <Grid size={{ xs: 12, md: 4 }}>
    {/* Hero Metric 3 */}
  </Grid>
</Grid>

// Typography responsive sizes
<Typography
  variant="h4"
  fontWeight={700}
  sx={{
    fontSize: { xs: '1.5rem', md: '2.125rem' }, // 24px mobile, 34px desktop
    color: appleColors.gray[900]
  }}
>
  {formatCurrency(value)}
</Typography>
```

---

## 📐 Component Architecture

### New Components to Create

1. **`BRRRRAnalysisTab.tsx`** (Main container - Phase 2.3)
   - **Location**: `/frontend/src/components/SFRAnalysis/BRRRRAnalysisTab.tsx`
   - **Receives**: `analysis.strategySpecific` + `propertyData`
   - **Renders**: 7 sections with progressive disclosure
   - **Mobile-first**: Responsive grid, collapsible sections

2. **`InfiniteReturnAlert.tsx`** (Celebration component - Phase 2.3)
   - **Location**: `/frontend/src/components/SFRAnalysis/InfiniteReturnAlert.tsx`
   - **Receives**: `capitalRecoveryRate`, `capitalRemaining`
   - **Renders**: Apple-style success alert with animation
   - **Conditional**: Only if recovery ≥100%

3. **`BeforeAfterComparison.tsx`** (Trade-off visualizer - Phase 2.5)
   - **Location**: `/frontend/src/components/SFRAnalysis/BeforeAfterComparison.tsx`
   - **Receives**: Before/after cash flow, CoC, capital
   - **Renders**: Side-by-side comparison card
   - **Mobile**: Stacks vertically on small screens

4. **`BRRRRMetricCard.tsx`** (Reusable metric display - Optional)
   - **Location**: `/frontend/src/components/SFRAnalysis/BRRRRMetricCard.tsx`
   - **Receives**: `label`, `value`, `description`, `icon`
   - **Renders**: Apple-style card with elevation
   - **Note**: May reuse existing `MetricCard` component instead

### Components to Reuse

1. **`TapToExpandField`** - For BRRRR fields in Financials Step
   - Already exists: `/frontend/src/components/common/TapToExpandField.tsx`
   - Pattern proven in Property Tax, Insurance fields

2. **`ExpandableSection`** - For accordion sections
   - Use Material-UI `Accordion` component with Apple styling

3. **`MetricCard`** - Base component for BRRRR metrics
   - Reuse existing pattern from Overview tab

4. **`EducationalTooltip`** - For educational context
   - Already exists: `/frontend/src/components/common/EducationalTooltip.tsx`

---

## 🎯 Implementation Priorities

### Phase 2.1: Enable BRRRR Strategy Card (2-3 hours)
**Design Focus**: Confidence-building, clear expectations

**File**: `/frontend/src/components/SFRAnalysis/StrategySelectionStep.tsx`

**Changes**:
1. Line 191-192: Change `onSelect={() => {}}` → `onSelect={() => onStrategyChange('brrrr')}`
2. Line 192: Change `comingSoon={true}` → `comingSoon={false}`
3. Line 193: Change `badgeText="Coming Soon"` → `badgeText="Advanced"`
4. Add new prop: `subtitle="Best for: Investors with rehab experience"`
5. Optional: `badgeColor={appleColors.orange[500]}`

**Success Criteria**:
- ✅ BRRRR card visually distinct (Advanced badge in orange)
- ✅ User understands this is for experienced investors
- ✅ Clickable with hover state feedback
- ✅ Strategy state updates to 'brrrr' on click

**Testing**:
```bash
# Manual test
1. Open Property Wizard
2. Navigate to Strategy Selection (Step 0)
3. Click BRRRR card
4. Verify strategy updates to 'brrrr'
5. Verify "Advanced" badge visible
6. Test on mobile (iPhone SE, 375px)
```

---

### Phase 2.2: Add BRRRR Fields to Financials Step (4-5 hours)
**Design Focus**: Progressive disclosure, smart defaults

**File**: `/frontend/src/components/SFRAnalysis/FinancialsStep.tsx`

**Changes**:
1. Add state management for BRRRR fields
2. Conditional section render (`state.data.strategy === 'brrrr'`)
3. 2 required fields: Rehab Budget, ARV
4. 1 accordion: "Advanced Settings" (LTV, Seasoning, ARV Confidence)
5. Inline validation (ARV > Purchase Price)
6. Smart defaults: 75% LTV, 12 months, Moderate confidence
7. Handler: `handleBRRRRFieldChange(field, value)`

**Success Criteria**:
- ✅ BRRRR fields only appear when strategy='brrrr'
- ✅ Required fields have clear error states
- ✅ Advanced settings collapsed by default
- ✅ Mobile: All fields stack vertically, tap-friendly (44px height)
- ✅ Validation prevents progression with missing/invalid fields

**Testing**:
```bash
# Unit test
describe('FinancialsStep - BRRRR Fields', () => {
  it('shows BRRRR fields when strategy is brrrr', () => {
    // Test conditional rendering
  });

  it('validates ARV > purchase price', () => {
    // Test validation logic
  });

  it('applies smart defaults', () => {
    // Test default values
  });
});

# Manual test
1. Select BRRRR strategy in Step 0
2. Progress to Financials Step (Step 2)
3. Verify BRRRR section appears
4. Enter Rehab: $40,000
5. Enter ARV: $150,000 (< purchase price)
6. Verify error message appears
7. Correct ARV to $320,000
8. Verify error clears
9. Expand Advanced Settings
10. Verify defaults: 75% LTV, 12 months
```

---

### Phase 2.3: Create Capital Recovery Tab (6-8 hours)
**Design Focus**: Scannable hierarchy, mobile-first, celebration

**File**: `/frontend/src/components/SFRAnalysis/BRRRRAnalysisTab.tsx` (NEW)

**MVP (Core Sections)**:
1. **Infinite Return Alert** (if achieved)
   - Component: `InfiniteReturnAlert.tsx`
   - Conditional: `capitalRecoveryRate >= 100`
   - Animation: Subtle pulse on load

2. **Capital Recovery Overview** (3 hero metrics)
   - Total Capital Deployed
   - Capital Recovered
   - Capital Remaining
   - Responsive grid: xs=12, md=4

3. **Capital Recovery Rate Progress Bar**
   - Linear progress (0-150%)
   - Color: Green if ≥100%, Primary if 70-99%, Orange if <70%
   - Labels: 0%, 100% (Infinite Return marker), 150%

**Future (Phase 2.5)**:
4. Refinance Projections (expandable)
5. Before/After Comparison (expandable)
6. Sensitivity Analysis (accordion)
7. 70% Rule Check (accordion)
8. BRRRR Timeline (accordion)

**Success Criteria**:
- ✅ Hero metrics scannable in <10 seconds (Business Expert requirement)
- ✅ Infinite Return alert prominent and celebratory (if achieved)
- ✅ Progress bar visually communicates recovery rate
- ✅ Mobile: Fully functional on iPhone SE, no horizontal scroll
- ✅ Component lazy loads (code splitting)

**Testing**:
```bash
# Unit test
describe('BRRRRAnalysisTab', () => {
  it('renders infinite return alert when recovery >= 100%', () => {
    // Test conditional rendering
  });

  it('calculates capital remaining correctly', () => {
    // Test: deployed - recovered = remaining
  });

  it('renders mobile responsive grid', () => {
    // Test responsive layout
  });
});

# Manual test
1. Complete BRRRR property wizard
2. Navigate to Analysis Results
3. Verify Capital Recovery tab appears at position #3
4. Verify infinite return alert (if recovery >= 100%)
5. Verify 3 hero metrics display correctly
6. Verify progress bar color and position
7. Test on mobile (iPhone SE)
8. Verify no horizontal scroll
```

---

### Phase 2.4: Integrate Tab into AnalysisResults (2-3 hours)
**Design Focus**: Seamless tab injection, consistent UX

**File**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx`

**Changes** (around lines 202-218):
```typescript
// Add import
import { BRRRRAnalysisTab } from './BRRRRAnalysisTab';

// Modify allAnalysisSections array
const allAnalysisSections = [
  { id: 'overview', label: 'Overview', icon: HomeIcon, ... },
  { id: 'financial', label: 'Financial Details', icon: AnalyticsIcon, ... },

  // BRRRR Capital Recovery Tab (Position #3)
  ...(propertyData.strategy === 'brrrr' ? [
    {
      id: 'capitalRecovery',
      label: 'Capital Recovery',
      icon: RefreshIcon,
      description: 'Capital recovery & refinance analysis',
      implemented: true
    }
  ] : []),

  { id: 'projections', label: 'Long-term Analysis', icon: TrendingUpIcon, ... },
  // ... rest of tabs
];

// Add tab content render case
{selectedSection === 'capitalRecovery' && propertyData.strategy === 'brrrr' && (
  <BRRRRAnalysisTab
    analysis={analysis}
    propertyData={propertyData}
  />
)}
```

**Success Criteria**:
- ✅ Tab appears only for BRRRR deals
- ✅ Tab order correct (1-Overview, 2-Financial, 3-Capital Recovery, 4-Long-term)
- ✅ Tab navigation smooth, no layout shift
- ✅ Icon consistent with design system
- ✅ Lazy load BRRRRAnalysisTab component

**Testing**:
```bash
# Integration test
describe('AnalysisResults - BRRRR Tab Integration', () => {
  it('injects Capital Recovery tab at position 3 for BRRRR', () => {
    // Test tab injection
  });

  it('does not show Capital Recovery tab for Buy & Hold', () => {
    // Test conditional rendering
  });

  it('maintains tab order', () => {
    // Test tab positions
  });
});

# Manual test
1. Analyze BRRRR property
2. Navigate to Analysis Results
3. Verify tab order: Overview, Financial, Capital Recovery, Long-term
4. Click Capital Recovery tab
5. Verify tab content renders
6. Switch to Overview tab
7. Verify no layout shift or console errors
```

---

### Phase 2.5: Add BRRRR Tier 2 Metrics (2-3 hours)
**Design Focus**: Context-aware metrics, discoverability

**File**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx`

**Changes** (Tier 2 collapsible section):
```typescript
// Add to Tier 2 metrics (when showAdvancedMetrics === true)
{propertyData.strategy === 'brrrr' && (
  <>
    <Grid size={{ xs: 12, md: 6 }}>
      <MetricCard
        label="Capital Recovery Rate"
        value={formatPercent(analysis.strategySpecific.capitalRecovery.capitalRecoveryRate)}
        tooltip="% of invested capital recovered via refinance. 100%+ = infinite return"
        color={analysis.strategySpecific.capitalRecovery.capitalRecoveryRate >= 100
          ? appleColors.green[500]
          : appleColors.primary[500]}
        linkTo="capitalRecovery" // Link to Capital Recovery tab
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <MetricCard
        label="Post-Refi Cash Flow"
        value={formatCurrency(analysis.strategySpecific.postRefinanceMetrics.monthlyCashFlow)}
        tooltip="Monthly cash flow after refinancing with new larger mortgage"
        subtext={`Change: ${formatCurrency(
          analysis.strategySpecific.postRefinanceMetrics.monthlyCashFlow -
          analysis.monthlyAnalysis.cashFlow
        )}/month`}
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <MetricCard
        label="70% Rule Margin"
        value={formatCurrency(analysis.strategySpecific.rule70Check.margin)}
        tooltip="Margin of safety: Max purchase - Actual purchase. Positive = good deal"
        color={analysis.strategySpecific.rule70Check.meets70Rule
          ? appleColors.green[500]
          : appleColors.red[500]}
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <MetricCard
        label="ARV Confidence"
        value={analysis.strategySpecific.arvAppraisalConfidence}
        tooltip="How certain are you of the ARV? Based on comparable sales data"
        badge={true}
      />
    </Grid>
  </>
)}
```

**Success Criteria**:
- ✅ BRRRR metrics appear in Tier 2 (Overview tab)
- ✅ Metrics have educational tooltips
- ✅ Metrics link to Capital Recovery tab ("View details →")
- ✅ Conditional rendering (only for BRRRR)

---

### Phase 2.6: Educational Tooltips (2-3 hours)
**Design Focus**: Confidence-building, concept education

**File**: `/frontend/src/components/SFRAnalysis/metricDefinitions/brrrrMetrics.ts` (NEW)

**New Tooltips**:
```typescript
export const brrrrMetricDefinitions = {
  infiniteReturn: {
    title: 'Infinite Return',
    description: 'When you recover 100%+ of your invested capital via refinancing, you own the property with $0 invested - the ultimate BRRRR goal.',
    example: 'Invested $78K, recovered $81K via refinance = $0 remaining. You now own a cash-flowing property with none of your capital tied up.',
    industryBenchmark: '100%+ = Excellent, 90-99% = Good, 70-89% = Acceptable'
  },

  seventyRule: {
    title: '70% Rule',
    description: 'Industry standard formula: Max purchase price = (ARV × 0.70) - Rehab Budget. Passing this rule ensures a profitable BRRRR deal.',
    formula: 'Max Purchase = (ARV × 70%) - Rehab',
    example: 'ARV $320K, Rehab $40K → Max purchase = ($320K × 0.70) - $40K = $184K. You paid $170K, so $14K margin of safety.',
    industryBenchmark: 'Positive margin = Good deal, Negative margin = Overpaid'
  },

  capitalRecoveryRate: {
    title: 'Capital Recovery Rate',
    description: '% of invested capital you\'ll get back through refinancing. This is the primary BRRRR metric that measures deal success.',
    formula: '(Capital Recovered ÷ Total Capital Deployed) × 100',
    example: 'Deployed $78,768, recovered $81,600 = 105.6% recovery rate',
    industryBenchmark: '100%+ = Infinite return (excellent), 90-99% = Very good, 70-89% = Good, <70% = Weak'
  },

  seasoningPeriod: {
    title: 'Seasoning Period',
    description: 'Number of months lenders require a property to be rented before you can refinance. Fannie Mae typically requires 6-12 months.',
    example: 'If you buy in January and complete rehab by April, you need to rent until June (6 months) or January (12 months) before refinancing.',
    industryBenchmark: '6 months minimum (Fannie Mae), 12 months standard, 24 months conservative'
  },

  arvConfidence: {
    title: 'ARV Confidence Level',
    description: 'How certain are you of the After Repair Value? Use recent comparable sales to estimate accurately.',
    levels: {
      conservative: 'ARV estimate is 10% below market comps (safe)',
      moderate: 'ARV matches recent comparable sales (typical)',
      aggressive: 'ARV is 10% above comps (requires strong justification)'
    },
    recommendation: 'Use "Moderate" when you have 3+ comparable sales within past 6 months. Use "Conservative" if uncertain.'
  }
};
```

**Success Criteria**:
- ✅ Tooltips appear on hover (desktop) and tap (mobile)
- ✅ Language simple, jargon-free
- ✅ Real-world context provided (examples)
- ✅ Industry benchmarks included
- ✅ Formulas shown for calculations

---

## 📱 Mobile-First Design Checklist

### iPhone SE (375px) Requirements:
- [ ] Capital Recovery tab fully functional
- [ ] Hero metrics: 1 column layout, readable font sizes
- [ ] Progress bar: Full width, clear labels
- [ ] Infinite Return alert: Visible above fold
- [ ] Before/After comparison: Stacked vertically
- [ ] All sections: Collapsed accordion by default
- [ ] Tap targets: Minimum 44px height (Apple HIG)
- [ ] No horizontal scroll at any breakpoint
- [ ] Font sizes: Minimum 16px body, 24px headings
- [ ] Spacing: Adequate for touch (16px padding)

### iPad (768px) Requirements:
- [ ] Hero metrics: 2 column layout
- [ ] Before/After comparison: Side-by-side
- [ ] Sections: Expandable but not collapsed
- [ ] Tap targets: Maintained 44px minimum
- [ ] Font sizes: Optimized for tablet viewing

### Desktop (1024px+) Requirements:
- [ ] Hero metrics: 3 column layout
- [ ] All sections: Expanded by default
- [ ] Timeline visualization: Horizontal layout
- [ ] Hover states: Visible on all interactive elements
- [ ] Font sizes: Full desktop sizing (32px headings)

---

## ✅ Design Review Checklist (Pre-Implementation)

### Simplicity
- [ ] Can first-time BRRRR investor understand infinite return in <2 minutes?
- [ ] Are only essential fields required? (Yes: Rehab, ARV only)
- [ ] Are advanced settings hidden by default? (Yes: LTV, Seasoning collapsed)
- [ ] Is navigation intuitive? (Yes: Tab at position #3, clear label)

### Clarity
- [ ] Is Before/After trade-off clear? (Lower CF, but capital recovered)
- [ ] Are dollar values shown, percentages hidden? (Yes: $81,600 not just "103%")
- [ ] Is infinite return achievement obvious? (Yes: Celebration alert, green color)
- [ ] Are error messages helpful? (Yes: "ARV must exceed purchase price")

### Deference
- [ ] Does UI compete with data? (No: Content-first design)
- [ ] Are metrics scannable? (Yes: Hero metrics, 3-column grid)
- [ ] Is chrome minimal? (Yes: Elevation only, no decorative borders)
- [ ] Do animations enhance or distract? (Enhance: Subtle 600ms pulse)

### Depth
- [ ] Do layers communicate hierarchy? (Yes: Alert > Hero > Details > Advanced)
- [ ] Are interactive elements obvious? (Yes: Hover states, chevrons on accordions)
- [ ] Are transitions smooth? (Yes: 300ms ease, Apple standard)
- [ ] Does elevation indicate importance? (Yes: Alert=8, Cards=2, Sections=1)

---

## 🎨 Design Specifications

### Color Palette (BRRRR-Specific)

**Infinite Return Alert**:
- Background: `appleColors.green[500]` (#10B981)
- Text: `white`
- Box Shadow: `0 8px 24px rgba(16, 185, 129, 0.3)`

**Capital Recovery Hero**:
- Background: `appleColors.primary[50]` (#EBF4FF)
- Border: `appleColors.primary[200]` (#BFDBFE)

**Warning (Low Recovery <70%)**:
- Background: `appleColors.orange[100]` (#FFEDD5)
- Text: `appleColors.orange[700]` (#C2410C)

**Danger (<70% Rule Failed)**:
- Background: `appleColors.red[100]` (#FEE2E2)
- Text: `appleColors.red[700]` (#B91C1C)

**Success (100%+ Recovery)**:
- Background: `appleColors.green[100]` (#D1FAE5)
- Text: `appleColors.green[700]` (#047857)

---

### Typography

**Hero Metrics**:
- Font Family: SF Pro Display Bold (fallback: Inter, system-ui)
- Desktop: 32px (2rem)
- Mobile: 24px (1.5rem)
- Line Height: 1.2
- Letter Spacing: -0.5px

**Section Headers**:
- Font Family: SF Pro Display Semibold
- Size: 20px (1.25rem)
- Line Height: 1.4
- Color: `appleColors.gray[900]`

**Body Text**:
- Font Family: SF Pro Text Regular
- Size: 16px (1rem)
- Line Height: 1.6
- Color: `appleColors.gray[700]`

**Helper Text**:
- Font Family: SF Pro Text Regular
- Size: 14px (0.875rem)
- Line Height: 1.5
- Color: `appleColors.gray[600]`

---

### Spacing

**Section Padding**:
- Desktop: 24px (3)
- Mobile: 16px (2)

**Metric Cards**:
- Padding: 16px (2)
- Gap Between: 8px (1)
- Border Radius: 8px

**Accordion Spacing**:
- Between Sections: 12px (1.5)
- Internal Padding: 16px (2)

**Grid Spacing**:
- Desktop: 24px (3)
- Mobile: 16px (2)

---

### Elevation (Box Shadow)

**Hero Alert (Infinite Return)**:
- Elevation: 8
- Shadow: `0 8px 24px rgba(16, 185, 129, 0.3)`

**Metric Cards**:
- Elevation: 2
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.08)`

**Expandable Sections**:
- Elevation: 1
- Shadow: `0 1px 4px rgba(0, 0, 0, 0.06)`

**Hover States**:
- Elevation: 4
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.1)`

---

### Animation

**Pulse (Infinite Return Alert)**:
```css
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

animation: pulse 600ms ease-in-out;
```

**Fade In (Tab Content)**:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

animation: fadeIn 300ms ease-out;
```

**Accordion Expand**:
- Duration: 300ms
- Easing: ease
- Properties: height, opacity

---

## 📊 Success Metrics

### User Experience Goals

1. **Time to Understanding**: <2 minutes
   - Metric: Time from landing on Capital Recovery tab to understanding infinite return
   - Target: 80% of users understand in <2 minutes

2. **Mobile Completion**: 40%+
   - Metric: % of BRRRR analyses completed on mobile devices
   - Target: 40%+ (matching overall platform usage)

3. **Feature Discovery**: 80%+
   - Metric: % of BRRRR users who view Capital Recovery tab
   - Target: 80%+ view tab within first analysis

4. **Confusion Rate**: <10%
   - Metric: % of users asking "What is infinite return?"
   - Target: <10% confusion (via support tickets, feedback)

---

### Technical Goals

1. **Load Performance**: <500ms
   - Metric: Time to render Capital Recovery tab content
   - Target: <500ms on 3G connection

2. **Mobile Performance**: 60fps
   - Metric: Frame rate during scrolling and animations
   - Target: No jank, maintain 60fps

3. **Accessibility**: WCAG 2.1 AA
   - Metric: Color contrast ratios, keyboard navigation
   - Target: 100% AA compliance

4. **Browser Support**:
   - Safari (last 2 versions)
   - Chrome (last 2 versions)
   - Firefox (last 2 versions)
   - Edge (last 2 versions)

---

## 🚀 Implementation Timeline

### Week 1 (Days 1-5): Core Implementation

**Day 1-2: Phase 2.1 & 2.2**
- Enable BRRRR Strategy Card (2-3 hours)
- Add BRRRR Fields to Financials Step (4-5 hours)
- Total: 6-8 hours

**Day 3-5: Phase 2.3**
- Create Capital Recovery Tab MVP (6-8 hours)
  - Infinite Return Alert component
  - Hero metrics (3 cards)
  - Progress bar
- Total: 6-8 hours

### Week 2 (Days 6-10): Integration & Polish

**Day 6-7: Phase 2.4**
- Integrate Tab into AnalysisResults (2-3 hours)
- Testing and debugging (2 hours)
- Total: 4-5 hours

**Day 8-9: Phase 2.5 & 2.6**
- Add BRRRR Tier 2 Metrics (2-3 hours)
- Educational Tooltips (2-3 hours)
- Total: 4-6 hours

**Day 10: Testing & QA**
- Cross-browser testing (2 hours)
- Mobile testing (iPhone SE, iPad) (2 hours)
- Accessibility testing (1 hour)
- Total: 5 hours

### Total Estimated Time: 25-32 hours

---

## 📝 Next Steps

1. **✅ User Approval** - APPROVED (December 21, 2025)
2. **Next: Architect Alignment** - Validate component architecture
3. **Next: Begin Phase 2.1** - Enable BRRRR Strategy Card
4. **Future: Figma Mockups** - If detailed visual designs requested

---

## 🎯 Design Confidence

**Overall Confidence**: 95%

**Reasoning**:
- ✅ Apple Design System principles applied consistently
- ✅ Proven patterns reused (TapToExpandField, tab injection)
- ✅ Mobile-first approach validated by Business Expert
- ✅ Progressive disclosure prevents information overwhelm
- ✅ Real-world user needs validated (15 BRRRR deals)

**5% Risk Buffer**:
- Infinite Return animation may need iteration
- ARV Confidence UI might require user testing
- Mobile layout may need adjustments based on real device testing

---

**Document Version**: 1.0
**Last Updated**: December 21, 2025
**Next Review**: After Phase 2.3 completion (Capital Recovery Tab MVP)
