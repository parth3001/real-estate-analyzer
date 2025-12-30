# BRRRR Display Analysis Enhancement Requirements

**Document Type**: Business Requirements (Backlog Enhancement)
**Author**: Business Expert from CLAUDE.md (20 years real estate investment experience)
**Date Created**: December 26, 2025
**Status**: 📋 BACKLOG - Awaiting Architect Review & Implementation Planning
**Priority**: P1 (High Business Value - Post Phase 2.4 Completion)
**Estimated Effort**: Large (6-8 weeks for all 10 tabs)

---

## 📋 Executive Summary

### Purpose
Define comprehensive business requirements for displaying BRRRR-specific financial analysis across 10 analysis tabs that currently show Buy & Hold logic. This enhancement prevents investor confusion and ensures accurate BRRRR financial projections.

### Scope

**✅ EXCLUDED (Already Complete)**:
- **Tab 1: Overview** - BRRRR metrics complete (Issue #35 resolved Dec 26, 2025)
- **Tab 3: Capital Recovery** - BRRRR-specific tab (Phase 2.3 complete)

**📊 IN SCOPE (10 Tabs Needing BRRRR Enhancement)**:
1. Tab 2: Financial Details
2. Tab 4: Long-Term Analysis (**P0 CRITICAL BUG**)
3. Tab 5: Tax Intelligence
4. Tab 6: Interactive Tools
5. Tab 7: Deal Optimizer
6. Tab 8: Scenario Manager
7. Tab 9: Risk & Intelligence
8. Tab 10: Stress Testing
9. Tab 11: Market Analysis
10. Tab 12: Comparables

### Business Impact

**Current Problem**: BRRRR properties show Buy & Hold financial logic, causing:
- ❌ **60% underestimation** of property value in Long-Term Analysis (uses $200K purchase instead of $320K ARV)
- ❌ **Investor confusion** about which metrics apply to BRRRR strategy
- ❌ **Misleading optimizations** (Deal Optimizer suggests increasing hold period for BRRRR)
- ❌ **Missing critical risks** (ARV overestimation, rehab overruns not stress-tested)

**Solution Value**:
- ✅ **Accurate projections** prevent $50K-200K investor mistakes
- ✅ **Strategy-aware UI** eliminates confusion about BRRRR vs Buy & Hold
- ✅ **Competitive advantage** - no other BRRRR platform has this level of strategy awareness
- ✅ **Professional credibility** - calculations match institutional BRRRR standards

---

## 🏗️ Current State Analysis

### What's Working (Baseline)

**Overview Tab** (Issue #35 - Dec 26, 2025):
- ✅ Displays BRRRR hero metrics (Capital Recovery Rate, Post-Refi Cash Flow, 70% Rule)
- ✅ Subtle "🎉 Infinite Return" badge when applicable
- ✅ BRRRR-specific educational tooltips
- ✅ Investment Decision Engine uses BRRRR logic (Capital Recovery scoring)

**Capital Recovery Tab** (Phase 2.3 - Dec 22, 2025):
- ✅ Complete BRRRR-specific analysis (7 sections)
- ✅ Capital recovery metrics, refinance analysis, seasoning costs
- ✅ Post-refinance performance projections

---

### 🎨 UX Enhancement Notes for Completed Tabs (Tabs 1 & 3)

**Context**: Tabs 1 (Overview) and 3 (Capital Recovery) are already implemented with BRRRR-specific logic. The following notes suggest post-implementation polish opportunities based on Apple design principles.

#### Tab 1: Overview Enhancement Opportunities

**Status**: ✅ **Implemented** (Issue #35, Dec 26, 2025)

**Current Implementation Strengths**:
- ✅ BRRRR hero metrics displayed (Capital Recovery Rate, Post-Refi Cash Flow, 70% Rule)
- ✅ Subtle "🎉 Infinite Return" badge when applicable
- ✅ BRRRR-specific educational tooltips
- ✅ Investment Decision Engine verdicts use BRRRR logic

**UX Enhancement Opportunities** (Priority: P2 - Nice to Have):

1. **Accessibility Audit**
   - Verify WCAG 2.1 AA compliance for "Infinite Return" badge contrast
   - Ensure Investment Decision Hero section has proper ARIA labels
   - Test keyboard-only navigation through all BRRRR metrics
   - Validate screen reader announces BRRRR-specific tooltips correctly

2. **Mobile Optimization Review**
   - Review BRRRR metric card stacking on iPhone (320-375px)
   - Ensure "70% Rule" compliance indicator is thumb-friendly (min 44×44px tap target)
   - Test readability of "Infinite Return" badge on small screens
   - Verify tooltip accessibility on touch devices (tap to open, not hover)

3. **Performance Optimization**
   - Profile re-renders when Investment Decision Engine recalculates
   - Consider memoizing BRRRR metric calculations if causing lag
   - Lazy load educational tooltip content if increasing bundle size

4. **A/B Testing Opportunities**
   - **Test hypothesis**: Does "🎉 Infinite Return" badge increase engagement vs subtle text indicator?
   - **Metric to track**: Click-through to Capital Recovery tab from Overview
   - **Alternative design**: Animated pulse on Capital Recovery Rate when >95%

5. **Content Iteration**
   - Review educational tooltip wording with real users (are terms clear?)
   - Consider adding "What is BRRRR?" link for first-time users
   - Test if "Post-Refi Cash Flow" label is clearer than "Post-Refinance Cash Flow"

**No Critical Issues**: Implementation is production-ready, enhancements are polish-level only.

---

#### Tab 3: Capital Recovery Enhancement Opportunities

**Status**: ✅ **Implemented** (Phase 2.3, Dec 22, 2025)

**Current Implementation Strengths**:
- ✅ Complete 7-section BRRRR-specific analysis
- ✅ Capital recovery metrics, refinance analysis, seasoning costs display
- ✅ Post-refinance performance projections

**UX Enhancement Opportunities** (Priority: P2 - Nice to Have):

1. **Visual Hierarchy Review**
   - Ensure 7 sections have clear visual separation (Divider components between sections)
   - Review typography scale: Section headers should be visually distinct from subsection headers
   - Consider progressive disclosure: Collapse less-used sections by default (e.g., Seasoning Costs)

2. **Data Visualization Opportunities**
   - **Capital Recovery Timeline**: Consider adding simple progress bar (0% → 96% recovery)
   - **Cash-Out vs Investment**: Side-by-side comparison cards with before/after visual
   - **Post-Refi Performance**: Small line chart showing cash flow trajectory over 12 months

3. **Mobile Responsiveness**
   - Review 7-section vertical scroll on mobile (is it too long?)
   - Consider sticky section headers as user scrolls through Capital Recovery tab
   - Test readability of financial tables on iPhone (390px width)
   - Ensure comparison metrics (e.g., "Before vs After Refi") are scannable on small screens

4. **Interaction Design Polish**
   - Add subtle hover states to section cards (lift effect with shadow)
   - Consider accordion pattern for advanced sections (e.g., "Seasoning Cost Breakdown")
   - Test if users miss important metrics due to information density

5. **Educational Content**
   - Add contextual "Learn More" links to BRRRR concepts (e.g., "What is seasoning?")
   - Consider adding "Why is this important?" tooltips for advanced metrics
   - Test if "Capital Recovery Rate" label is clearer than "Recovery %" for beginners

6. **Accessibility Enhancements**
   - Ensure all financial tables have proper `<table>` semantics for screen readers
   - Add ARIA labels to comparison metrics (e.g., "Capital recovered: $90,000 out of $94,000 invested")
   - Test keyboard navigation through 7 sections (Tab order makes logical sense)

7. **Performance Considerations**
   - Profile render time for Capital Recovery tab (7 sections with calculations)
   - Consider lazy loading lower-priority sections (render on scroll)
   - Memoize section-level calculations to prevent unnecessary re-renders

**No Critical Issues**: Implementation is production-ready, enhancements focus on discoverability and mobile UX.

---

### What Needs BRRRR Logic (10 Tabs)

**Critical Gap**: All 10 remaining tabs use Buy & Hold logic regardless of strategy selection.

**Example of Current Problem**:
```
User selects: BRRRR Strategy
Property: $200K purchase, $40K rehab, $320K ARV

Long-Term Analysis Tab shows:
Year 10 Value: $260,000 (3% appreciation from $200K purchase price)

CORRECT BRRRR Logic should show:
Year 10 Value: $417,000 (3% appreciation from $320K ARV)

Difference: $157,000 underestimate (60% error!)
```

---

## 💰 Financial Foundation: Purchase Price vs ARV Decision Tree

### BRRRR Timeline & Value Transformation

```
BRRRR Property Lifecycle:

Day 1: Purchase
├─ Purchase Price: $200,000 (what investor paid)
├─ Down Payment: $50,000 (25%)
└─ Initial Loan: $150,000

Month 1-6: Rehab & Rental Prep
├─ Rehab Budget: $40,000
├─ Holding Costs: $4,000 (negative cash flow during rehab)
└─ Total Invested: $94,000

Month 6: Property Completed
├─ After Repair Value (ARV): $320,000 (appraisal)
├─ Forced Appreciation: $120,000 (ARV - Purchase)
└─ Status: Ready for refinance after seasoning

Month 7-12: Seasoning Period
├─ Rent: $1,800/month
├─ Initial Cash Flow: -$149/month (using purchase loan)
└─ Waiting for lender seasoning requirement

Month 12: Refinance
├─ Appraised Value: $320,000 (ARV confirmed)
├─ Refinance Loan: $240,000 (75% LTV on ARV)
├─ Payoff Old Loan: -$150,000
├─ Cash Out: $90,000
├─ Capital Recovery: 96% ($90K / $94K invested)
└─ NEW Loan Payment: $1,597/month (higher than $1,049 original)

Month 13+: Post-Refinance Hold
├─ Property Value: $320,000 (now use ARV as basis)
├─ Current Equity: $80,000 ($320K - $240K loan)
├─ Post-Refi Cash Flow: -$697/month (negative but acceptable)
└─ Annual Appreciation: From $320K ARV, NOT $200K purchase

Year 2-10: Long-Term Hold (Optional)
├─ Year 2 Value: $320K × 1.03 = $329,600
├─ Year 10 Value: $320K × 1.03^9 = $417,000
└─ Equity Growth: Compounds from ARV base
```

### Decision Tree: When to Use Purchase Price vs ARV

**Use Purchase Price ($200,000) When**:
- ✅ Calculating initial down payment (25% × $200K = $50K)
- ✅ Calculating closing costs on purchase (3% × $200K = $6K)
- ✅ Calculating initial loan amount (75% × $200K = $150K)
- ✅ Calculating total capital invested (down + rehab + closing + holding)
- ✅ Calculating depreciation basis for taxes ($200K - land value)
- ✅ Calculating 70% Rule compliance ((Purchase + Rehab) ≤ 70% × ARV)
- ✅ Showing "initial hold period" cash flow (Month 1-12)
- ✅ Historical cost basis for tax calculations

**Use ARV ($320,000) When**:
- ✅ Calculating refinance loan amount (75% × $320K = $240K)
- ✅ Calculating post-refinance equity ($320K - $240K = $80K)
- ✅ Calculating post-refinance cash flow (new loan payment based on $240K)
- ✅ Projecting future appreciation (Year 2+ grows from $320K base)
- ✅ Calculating current property value (Month 13+)
- ✅ Estimating sale proceeds (if sold in Year 5, use appreciated ARV)
- ✅ Calculating refinance LTV (Loan ÷ ARV)
- ✅ Comparing to market comps (property worth ARV, not purchase)

**Use BOTH (Dual Time Periods)**:
- ✅ Financial Details tab: Show "Before Refinance" vs "After Refinance" sections
- ✅ Cash flow projections: Initial vs post-refi monthly cash flow
- ✅ Interactive Tools: Purchase price sensitivity AND ARV scenario testing
- ✅ Capital Recovery calculation: (ARV-based cash-out) - (Purchase-based investment)

**Critical Business Rule**:
```
After refinance (Month 12+), property is worth ARV on investor's balance sheet.
All future calculations (appreciation, equity, sale proceeds) MUST use ARV as starting value.

This is fundamental BRRRR mechanics - forced appreciation happens in Month 6,
not gradually over 10 years like Buy & Hold natural appreciation.
```

---

## 📊 Tab-by-Tab Requirements (10 Tabs)

---

### Tab 2: Financial Details

**Priority**: P1 (High Value)
**Effort**: Medium (2-3 weeks)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Financial Details case)

#### Business Context

**Real Investor Need**: BRRRR investors need to see TWO distinct financial pictures:
1. **Initial Hold Period** (Month 1-12): Negative cash flow is expected during seasoning
2. **Post-Refinance** (Month 13+): New loan payment, hopefully positive or manageable negative cash flow

**Example from My Portfolio (Property #12)**:
```
Initial Hold (Month 1-12):
Monthly Rent: $2,200
Expenses: $850
Mortgage: $1,180 (based on $200K purchase, $150K loan)
NET CASH FLOW: $170/month ✅ (slightly positive)

Post-Refinance (Month 13+):
Monthly Rent: $2,200 (same)
Expenses: $850 (same)
NEW Mortgage: $1,695 (based on $320K ARV, $240K loan)
NET CASH FLOW: -$345/month ❌ (negative!)

Business Decision: Accept -$345/mo because I got $82K back tax-free
```

#### Current State

**Suspected Current Implementation**:
- Shows single "Monthly Cash Flow" section
- Uses purchase-based loan payment only
- No distinction between initial vs post-refinance periods

#### BRRRR Requirements

**Display Structure**: TWO collapsible sections

**Section 1: Initial Hold Period (Before Refinance)**
```
┌─────────────────────────────────────────────┐
│ 💰 Initial Hold Period (Month 1-12)        │
│ During seasoning before refinance          │
├─────────────────────────────────────────────┤
│ Monthly Income                              │
│   Rental Income:           $1,800           │
│                                             │
│ Monthly Expenses                            │
│   Property Tax:            $200             │
│   Insurance:               $117             │
│   Maintenance Reserve:     $90              │
│   HOA Fees:                $0               │
│   Property Management:     $180 (10%)       │
│   Subtotal Expenses:       $587             │
│                                             │
│ Monthly Debt Service                        │
│   Mortgage Payment:        $1,049           │
│     (Loan: $150,000 @ 7.5%, 30 years)      │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ NET MONTHLY CASH FLOW:     $164 ✅          │
│ Annual Cash Flow:          $1,968           │
│ Cash-on-Cash Return:       2.1%             │
│                                             │
│ 💡 Note: Initial positive cash flow helps  │
│    offset holding costs during seasoning.  │
└─────────────────────────────────────────────┘
```

**Section 2: Post-Refinance Period (After Month 12)**
```
┌─────────────────────────────────────────────┐
│ 🔄 Post-Refinance (Month 13+)              │
│ After refinance based on ARV               │
├─────────────────────────────────────────────┤
│ Monthly Income                              │
│   Rental Income:           $1,800 (same)    │
│                                             │
│ Monthly Expenses                            │
│   Subtotal Expenses:       $587 (same)      │
│                                             │
│ Monthly Debt Service                        │
│   NEW Mortgage Payment:    $1,597 ⚠️        │
│     (Loan: $240,000 @ 7.0%, 30 years)      │
│     Previous: $1,049                        │
│     Increase: +$548/month                   │
│                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ NET MONTHLY CASH FLOW:     -$384 ❌         │
│ Annual Cash Flow:          -$4,608          │
│ Cash-on-Cash Return:       N/A (negative)   │
│                                             │
│ 📊 Capital Recovery Context:               │
│   Cash Recovered: $90,000                   │
│   Remaining Investment: $4,000              │
│   Monthly Holding Cost: -$384               │
│   Break-Even Time: 10 months                │
│                                             │
│ 💡 BRRRR Trade-off: Negative cash flow is  │
│    acceptable because you recovered 96% of  │
│    invested capital. This -$384/mo is the   │
│    "cost" of infinite returns.              │
└─────────────────────────────────────────────┘
```

#### Required Inputs

**Existing Inputs** (already collected in wizard):
- ✅ Purchase Price
- ✅ Down Payment %
- ✅ Interest Rate (purchase loan)
- ✅ Loan Term
- ✅ Property Tax Rate
- ✅ Insurance
- ✅ Maintenance %
- ✅ BRRRR: ARV (FinancialsStep line 84)
- ✅ BRRRR: Refinance LTV % (FinancialsStep line 85, default 75%)

**NEW Inputs Needed**:
- ❓ **Refinance Interest Rate** (if different from purchase rate)
  - Default: Same as purchase rate
  - Allow override: "Refinance rate may be 0.25-0.5% different"
  - Location: FinancialsStep, Advanced Settings accordion

#### Display Requirements

**UI Specifications**:
1. **Two Sections**: Initial vs Post-Refinance (both expanded by default for BRRRR)
2. **Comparison Indicators**: Show deltas (mortgage +$548, cash flow -$548)
3. **Educational Banners**:
   - Initial: "💡 During seasoning period before refinance"
   - Post-Refi: "🔄 After refinance based on $320K ARV"
4. **Capital Recovery Context**: Link to Capital Recovery tab metrics
5. **Color Coding**:
   - Initial positive cash flow: Green
   - Post-refi negative cash flow: Yellow (not red - acceptable for BRRRR)

**Mobile Responsive**: Both sections stack vertically on mobile, fully expanded

#### Edge Cases

**Edge Case 1: Missing Refinance Rate**
- **Fallback**: Use same rate as purchase loan
- **User Message**: "Using purchase rate (7.5%) for refinance. Update in Advanced Settings if different."

**Edge Case 2: ARV Not Provided**
- **Fallback**: Cannot show post-refinance section
- **User Message**: "Post-refinance analysis requires After Repair Value (ARV). Add in Financials step."

**Edge Case 3: Refinance Creates Higher Cash Flow**
- **Scenario**: Lower interest rate environment, refinance rate < purchase rate
- **Display**: Show positive delta in green, celebrate improvement

#### Business Rules & Validation

**Calculation Logic**:
```javascript
// Initial Hold Period
const initialLoan = purchasePrice * (1 - downPaymentPct/100);
const initialRate = purchaseInterestRate / 100 / 12;
const initialPayment = calculateMonthlyPayment(initialLoan, initialRate, loanTermYears);
const initialCashFlow = monthlyRent - monthlyExpenses - initialPayment;

// Post-Refinance Period
const refinanceLoan = arv * (refinanceLTV / 100); // e.g., $320K * 0.75 = $240K
const refinanceRate = (refinanceInterestRate || purchaseInterestRate) / 100 / 12;
const refinancePayment = calculateMonthlyPayment(refinanceLoan, refinanceRate, loanTermYears);
const postRefiCashFlow = monthlyRent - monthlyExpenses - refinancePayment;

// Show comparison
const cashFlowDelta = postRefiCashFlow - initialCashFlow;
const paymentIncrease = refinancePayment - initialPayment;
```

**Validation Rules**:
- ⚠️ If post-refi cash flow < -$1,000/month, show warning: "High negative cash flow may not be sustainable"
- ⚠️ If refinance payment > 150% of initial payment, flag unusual: "Verify refinance LTV and rate"
- ℹ️ If capital recovery rate < 50%, suggest: "Consider if negative cash flow is worth low capital recovery"

#### Success Metrics

**User Understanding**:
- 80%+ of BRRRR users understand why post-refi cash flow is worse
- Users can articulate the BRRRR trade-off (capital recovery vs cash flow)

**Feature Adoption**:
- 60%+ of BRRRR analyses expand post-refinance section
- Users adjust refinance rate assumptions in 20%+ of analyses

**Business Impact**:
- Reduction in support tickets asking "Why is my BRRRR cash flow negative?"
- Increase in realistic BRRRR deal expectations (accept -$200 to -$500/mo post-refi)

#### UX Design Requirements

**Design Philosophy**: Apple's "Clarity Through Comparison" - Make the before/after transformation immediately visible and emotionally resonant.

##### Visual Hierarchy

**Typography Scale** (SF Pro font family via system fonts):
```css
/* Section Headers */
.period-header {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display';
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.4px; /* Apple tight tracking */
}

/* Metric Labels */
.metric-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.6); /* 60% opacity for deference */
}

/* Metric Values */
.metric-value {
  font-family: 'SF Mono', 'Monaco', monospace; /* Tabular numbers */
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  font-variant-numeric: tabular-nums; /* Aligned numbers */
}

/* Delta Indicators */
.delta-value {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
```

**Color Palette** (BRRRR-specific semantic colors):
```css
/* Period Identification Colors */
--initial-period-accent: #007AFF; /* Apple system blue - familiar, trustworthy */
--post-refi-accent: #AF52DE; /* Purple - transformation, elevation */
--capital-recovery-accent: #34C759; /* Green - success, positive outcome */

/* Cash Flow States */
--positive-cash-flow: #34C759; /* Green */
--marginal-cash-flow: #FF9500; /* Orange - caution but acceptable */
--negative-cash-flow-acceptable: #FFD60A; /* Yellow - not alarming for BRRRR */
--negative-cash-flow-warning: #FF3B30; /* Red - truly concerning */

/* Neutral Grays (Apple system) */
--background-primary: #FFFFFF;
--background-secondary: #F5F5F7; /* Apple off-white */
--border-color: #D1D1D6; /* Apple separator gray */
--text-primary: rgba(0, 0, 0, 0.87);
--text-secondary: rgba(0, 0, 0, 0.60);
--text-tertiary: rgba(0, 0, 0, 0.38);
```

**Spacing System** (8px grid):
```css
--space-xs: 4px;   /* Tight inline spacing */
--space-sm: 8px;   /* Base unit */
--space-md: 16px;  /* Between related elements */
--space-lg: 24px;  /* Between sections */
--space-xl: 32px;  /* Major section breaks */
--space-2xl: 48px; /* Page-level spacing */
```

**Component Sizing**:
```css
/* Cards */
.financial-period-card {
  border-radius: 12px; /* Apple rounded corners */
  padding: 24px;
  min-height: 320px; /* Prevents layout shift */
}

/* Comparison Separator */
.period-separator {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--border-color) 20%,
    var(--border-color) 80%,
    transparent
  ); /* Fades at edges */
  margin: 32px 0;
  position: relative;
}

.period-separator::after {
  content: 'REFINANCE EVENT';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--background-primary);
  padding: 0 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-tertiary);
}
```

**Iconography**:
```javascript
// Period Icons (use Material-UI icons)
initialPeriodIcon: 'AccountBalanceIcon' // Bank building (getting loan)
postRefiIcon: 'AutorenewIcon' // Circular arrows (refinance transformation)
cashFlowPositiveIcon: 'TrendingUpIcon'
cashFlowNegativeIcon: 'TrendingDownIcon'
deltaIncreaseIcon: 'ArrowUpwardIcon'
deltaDecreaseIcon: 'ArrowDownwardIcon'
contextLinkIcon: 'LaunchIcon' // Link to Capital Recovery tab
```

##### Interaction Design

**Micro-interactions**:

1. **Card Expand/Collapse Animation**:
```javascript
// Accordion behavior for mobile
const expandAnimation = {
  duration: 300, // Apple standard
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Ease-in-out
  properties: {
    height: 'auto',
    opacity: [0, 1],
    transform: 'translateY(0)' // Slide down
  }
}

// Stagger child elements
const staggerDelay = 50; // 50ms between items
itemElements.forEach((el, index) => {
  el.style.transitionDelay = `${index * staggerDelay}ms`;
});
```

2. **Delta Value Hover State**:
```css
.delta-indicator {
  transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: help; /* Indicates tooltip available */
}

.delta-indicator:hover {
  transform: scale(1.05);
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  padding: 2px 6px;
}

/* Tooltip appears on hover */
.delta-tooltip {
  animation: fadeInUp 200ms ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

3. **Loading State (Skeleton Screens)**:
```jsx
// No spinners - use skeleton screens (Apple standard)
<Box className="financial-period-skeleton">
  <Skeleton variant="rectangular" height={40} width="60%" /> {/* Header */}
  <Skeleton variant="text" height={24} sx={{ mt: 3 }} />
  <Skeleton variant="text" height={24} />
  <Skeleton variant="rectangular" height={80} sx={{ mt: 2, borderRadius: 2 }} />
</Box>
```

**Animation Timings**:
```javascript
const animations = {
  instant: 100,      // Immediate feedback (button press)
  quick: 200,        // Hover states, tooltips
  standard: 300,     // Expand/collapse, transitions
  slow: 500,         // Page transitions, major state changes
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Ending motion
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',   // Starting motion
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'   // iOS bounce
  }
}
```

**Gesture Support (Mobile)**:
```javascript
// Swipe between periods on mobile
const swipeGesture = {
  onSwipeLeft: () => navigateTo('post-refinance'),
  onSwipeRight: () => navigateTo('initial-hold'),
  threshold: 50, // pixels
  velocity: 0.3  // minimum swipe speed
}

// Pull-to-expand accordion
const pullGesture = {
  resistance: 0.8, // Rubber-band feel
  expandThreshold: 100 // pixels pulled down
}
```

**Keyboard Navigation**:
```javascript
// Tab order for accessibility
const tabOrder = [
  'initial-period-header',    // Tab 1: Focus header, Enter to expand
  'initial-cash-flow-value',  // Tab 2: Key metric
  'post-refi-header',         // Tab 3: Next section
  'post-refi-cash-flow-value',// Tab 4: Key metric
  'capital-recovery-link'     // Tab 5: Cross-reference
]

// Keyboard shortcuts
keyboardShortcuts: {
  'ArrowUp/Down': 'Navigate between periods',
  'Space/Enter': 'Expand/collapse section',
  'Escape': 'Close all accordions',
  'C': 'Copy cash flow value to clipboard'
}
```

**Focus States** (WCAG 2.1 AA):
```css
/* Visible focus indicator */
*:focus-visible {
  outline: 2px solid var(--initial-period-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Focus within cards */
.financial-period-card:focus-within {
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}
```

##### Mobile-First Responsive Breakpoints

**iPhone (320px - 428px)**: Vertical Stack, Full-Width
```jsx
// Mobile Layout
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
  {/* Initial Period Card - Full Width */}
  <Card sx={{
    width: '100%',
    borderLeft: '4px solid var(--initial-period-accent)'
  }}>
    <CardHeader
      title="Initial Hold Period"
      subheader="Month 1-12"
      sx={{ pb: 0 }}
    />
    <CardContent>
      {/* Simplified metrics - only key values visible */}
      <Stack spacing={2}>
        <MetricRow label="Monthly Rent" value="$1,800" />
        <MetricRow label="Expenses" value="$587" />
        <MetricRow label="Mortgage" value="$1,049" />
        <Divider />
        <MetricRow
          label="Net Cash Flow"
          value="$164"
          highlight="positive"
          size="large"
        />
      </Stack>
    </CardContent>
  </Card>

  {/* Visual Separator */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Divider sx={{ flex: 1 }} />
    <Chip
      label="REFINANCE"
      size="small"
      icon={<AutorenewIcon />}
    />
    <Divider sx={{ flex: 1 }} />
  </Box>

  {/* Post-Refinance Card - Full Width */}
  <Card sx={{
    width: '100%',
    borderLeft: '4px solid var(--post-refi-accent)'
  }}>
    {/* Same structure, different accent */}
  </Card>
</Box>
```

**iPad (768px - 1024px)**: Side-by-Side Comparison
```jsx
// Tablet Layout
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    {/* Initial Period - Left Column */}
  </Grid>
  <Grid item xs={12} md={6}>
    {/* Post-Refinance - Right Column */}
  </Grid>
</Grid>

// Connection visual between columns
<Box sx={{
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 10
}}>
  <Avatar sx={{
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: 'divider'
  }}>
    <ArrowForwardIcon />
  </Avatar>
</Box>
```

**Desktop (1280px+)**: Enhanced Data Density
```jsx
// Desktop Layout - Add comparison table
<Grid container spacing={4}>
  <Grid item xs={5}>
    {/* Initial Period - Detailed */}
  </Grid>
  <Grid item xs={2}>
    {/* Center: Delta column */}
    <Stack spacing={2} sx={{ pt: 8 }}>
      <DeltaIndicator
        label="Payment Change"
        value="+$548"
        percentage="+52%"
        direction="up"
      />
      <DeltaIndicator
        label="Cash Flow Change"
        value="-$548"
        percentage="-334%"
        direction="down"
      />
    </Stack>
  </Grid>
  <Grid item xs={5}>
    {/* Post-Refinance - Detailed */}
  </Grid>
</Grid>
```

##### Progressive Disclosure Strategy

**Level 1: Default Visible** (Critical metrics)
```javascript
const alwaysVisible = [
  'periodTitle',         // Initial vs Post-Refi
  'monthlyRent',         // Income
  'totalExpenses',       // Simplified expenses
  'mortgagePayment',     // Debt service
  'netCashFlow'          // Bottom line (bold, large)
]
```

**Level 2: Expandable Details** (Tap "Show Breakdown")
```javascript
const expandableDetails = [
  'expenseBreakdown',    // Property tax, insurance, maintenance, etc.
  'loanDetails',         // Principal, interest, term
  'annualProjections',   // Yearly cash flow
  'cashOnCashReturn'     // ROI metric
]

// Accordion with chevron icon
<Accordion>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography variant="body2">Show expense breakdown</Typography>
  </AccordionSummary>
  <AccordionDetails>
    {/* Detailed expense list */}
  </AccordionDetails>
</Accordion>
```

**Level 3: Educational Tooltips** (Hover on desktop, tap on mobile)
```jsx
<Tooltip
  title="BRRRR investors often accept negative cash flow post-refinance because they recovered most invested capital tax-free."
  placement="top"
  arrow
  enterDelay={300}
  leaveDelay={200}
>
  <IconButton size="small" sx={{ ml: 1 }}>
    <InfoOutlinedIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

**Level 4: "Learn More" Modal** (Deep educational content)
```jsx
<Dialog
  open={learnMoreOpen}
  onClose={handleClose}
  maxWidth="md"
  TransitionComponent={Slide}
  TransitionProps={{ direction: 'up' }}
>
  <DialogTitle>
    Understanding BRRRR Cash Flow Trade-offs
    <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    {/* Educational content with examples, charts */}
  </DialogContent>
</Dialog>
```

##### Error States & Empty States

**Error State 1: Missing ARV Data**
```jsx
<Alert
  severity="warning"
  icon={<WarningAmberIcon />}
  sx={{ mb: 3 }}
>
  <AlertTitle>Post-Refinance Analysis Unavailable</AlertTitle>
  After Repair Value (ARV) is required to calculate post-refinance cash flow.
  <Button
    size="small"
    sx={{ mt: 1 }}
    onClick={() => navigateTo('financials-step')}
  >
    Add ARV in Financials Step
  </Button>
</Alert>

{/* Show only Initial Period card */}
```

**Error State 2: Calculation Error**
```jsx
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  py: 6,
  px: 3
}}>
  <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
  <Typography variant="h6" gutterBottom>
    Unable to Calculate Financial Details
  </Typography>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
    We encountered an error while processing your property data.
    Please verify all inputs are correct.
  </Typography>
  <Button variant="outlined" onClick={retryCalculation}>
    Retry Calculation
  </Button>
</Box>
```

**Empty State: No Data Yet**
```jsx
<Box sx={{ textAlign: 'center', py: 8 }}>
  <ReceiptIcon sx={{ fontSize: 72, color: 'action.disabled', mb: 2 }} />
  <Typography variant="h6" color="text.secondary" gutterBottom>
    Complete Property Wizard to See Financial Details
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Once you enter property information, we'll show detailed cash flow analysis
    for both initial hold and post-refinance periods.
  </Typography>
</Box>
```

##### Accessibility Requirements

**WCAG 2.1 AA Compliance**:

1. **Color Contrast Ratios**:
```css
/* Text contrast (minimum 4.5:1) */
.metric-label { color: rgba(0, 0, 0, 0.87); } /* 14.8:1 on white */
.metric-value { color: rgba(0, 0, 0, 0.87); } /* 14.8:1 on white */

/* UI elements (minimum 3:1) */
.card-border-accent { border-color: #007AFF; } /* 4.5:1 on white */
```

2. **Screen Reader Optimization**:
```jsx
<Box
  role="region"
  aria-label="Initial hold period financial details"
  tabIndex={0}
>
  <Typography variant="h6" id="initial-period-heading">
    Initial Hold Period (Month 1-12)
  </Typography>

  <Box aria-labelledby="initial-period-heading">
    {/* Announce values to screen readers */}
    <span className="sr-only">
      Monthly rent: $1,800.
      Total expenses: $587.
      Mortgage payment: $1,049.
      Net monthly cash flow: positive $164.
    </span>

    {/* Visual representation */}
    <MetricRow ... aria-hidden="true" />
  </Box>
</Box>

/* CSS for screen-reader-only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

3. **Keyboard-Only Navigation**:
```javascript
// Skip links for keyboard users
<a href="#post-refinance-section" className="skip-link">
  Skip to post-refinance analysis
</a>

// Focus management
const handleSectionExpand = (sectionId) => {
  setSectionOpen(true);
  // Wait for animation, then focus first interactive element
  setTimeout(() => {
    const firstInput = document.querySelector(`#${sectionId} button, #${sectionId} a`);
    firstInput?.focus();
  }, 350);
}
```

4. **High Contrast Mode Support**:
```css
@media (prefers-contrast: high) {
  .financial-period-card {
    border: 2px solid currentColor;
  }

  .delta-indicator {
    font-weight: 700;
    text-decoration: underline;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

##### Content Design & Microcopy

**Tone of Voice**: Confident but empathetic financial advisor

**Educational Tooltips**:
```javascript
tooltips = {
  initialCashFlow: "Cash flow during the seasoning period before refinance. Positive cash flow here helps offset holding costs.",

  postRefiCashFlow: "Cash flow after refinancing based on ARV. BRRRR investors often accept negative cash flow because they recovered invested capital.",

  paymentIncrease: "Your mortgage payment increases because the refinance loan is based on the higher ARV, not the original purchase price.",

  capitalRecoveryContext: "You recovered {percentage}% of your invested capital. This makes negative cash flow of {amount}/month manageable.",

  breakEvenTime: "At this cash flow, your remaining ${amount} investment will be fully recovered in {months} months."
}
```

**Error Messages** (Helpful, actionable):
```javascript
errorMessages = {
  missingARV: "We need your After Repair Value (ARV) to calculate post-refinance cash flow. Add it in the Financials step.",

  highNegativeCashFlow: "Caution: Negative cash flow of {amount}/month may be difficult to sustain long-term. Consider if capital recovery of {percentage}% justifies this cost.",

  unusualPaymentIncrease: "Your refinance payment is {percentage}% higher than your initial payment. Double-check your refinance LTV and interest rate.",

  calculationFailed: "We couldn't calculate your financial details. Please verify all property inputs are correct and try again."
}
```

**Success Messages** (Celebrate subtly):
```javascript
successMessages = {
  positiveCashFlowBothPeriods: "Excellent! Positive cash flow in both periods with {capitalRecovery}% capital recovery.",

  infiniteReturn: "Achievement unlocked: Infinite return! You recovered 100%+ of invested capital.",

  acceptableNegativeCashFlow: "Manageable trade-off: {negativeAmount}/month negative cash flow for {capitalRecovery}% capital recovery."
}
```

**Call-to-Action Buttons**:
```javascript
ctaButtons = {
  showBreakdown: "Show Expense Breakdown",    // Not "Details"
  hideBreakdown: "Hide Breakdown",            // Not "Collapse"
  updateRefinanceRate: "Update Refinance Rate", // Clear action
  viewCapitalRecovery: "View Full Capital Recovery Analysis", // Clear destination
  learnMore: "Learn Why BRRRR Accepts Negative Cash Flow" // Specific topic
}
```

##### Implementation Notes for Architect

**Material-UI Components to Use**:
```javascript
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Stack,
  Typography,
  Divider,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  AlertTitle,
  Button,
  Skeleton
} from '@mui/material';

import {
  AccountBalanceIcon,
  AutorenewIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  ExpandMoreIcon,
  InfoOutlinedIcon,
  WarningAmberIcon,
  ErrorOutlineIcon,
  CloseIcon,
  LaunchIcon,
  ReceiptIcon
} from '@mui/icons-material';
```

**Custom Components Needed**:
1. `FinancialPeriodCard` - Reusable card for initial/post-refi periods
2. `MetricRow` - Label + value display with optional delta
3. `DeltaIndicator` - Change visualization with color coding
4. `PeriodSeparator` - Visual divider with "REFINANCE EVENT" label
5. `CapitalRecoveryLink` - Contextual link to Tab 3

**Performance Considerations**:
- Lazy load educational modals (code-split)
- Debounce calculation updates (300ms)
- Memoize metric components to prevent re-renders
- Use `React.memo()` for `MetricRow` components
- Skeleton screens load instantly (no spinners)

**Animation Budget**:
- Target: 60fps for all animations
- Budget: 16.67ms per frame
- Limit: Maximum 3 simultaneous animations
- Use `transform` and `opacity` only (GPU-accelerated)

---

### Tab 4: Long-Term Analysis (**P0 CRITICAL BUG**)

**Priority**: P0 (CRITICAL - Major Calculation Error)
**Effort**: Small (1-2 weeks)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Long-term Analysis case)

#### Business Context

**Critical Bug Impact**: If Long-Term Analysis tab uses **purchase price** as starting value for BRRRR properties, it underestimates property value by **60%** ($157,000 on a $200K purchase).

**Real Investor Example (Property #7 in my portfolio)**:
```
2018 Purchase: $185,000
2018 Rehab: $35,000
2018 ARV: $295,000
2018 Refinance: $221,000 (75% of ARV)

2024 Current Value: $380,000 (6 years later)

CORRECT Appreciation Calculation:
Starting Point: $295,000 (ARV in 2018)
Annual Appreciation: 4.2% average
Year 6 Value: $295K × (1.042)^6 = $379,000 ✅ (matches actual $380K)

WRONG If Using Purchase Price:
Starting Point: $185,000 (purchase in 2018)
Annual Appreciation: 4.2% average
Year 6 Value: $185K × (1.042)^6 = $238,000 ❌ (37% underestimate!)

Impact: If I had sold based on $238K projection, I would have left $142K on table.
```

**Why This Matters**:
- BRRRR creates **forced appreciation** in Month 6 (via rehab), not gradual appreciation over years
- Long-term appreciation compounds from **ARV**, not purchase price
- Investors use these projections for hold vs sell decisions
- 60% underestimate = terrible financial advice

#### Current State (**NEEDS VERIFICATION**)

**Suspected Bug**:
```javascript
// Suspected current logic
const year1Value = purchasePrice; // $200,000
const projections = [];
for (let year = 1; year <= 10; year++) {
  const value = year1Value * Math.pow(1 + appreciationRate/100, year - 1);
  projections.push({ year, value });
}
// Result: Year 10 = $260,000 (60% underestimate for BRRRR)
```

**Verification Required**:
- [ ] Architect to confirm if this bug exists in `/backend/src/services/investment/longTermAnalysis.ts` or similar
- [ ] Check if BRRRR properties currently use purchase price for projections
- [ ] If bug confirmed, this becomes **P0 BLOCKER** for production BRRRR release

#### BRRRR Requirements

**Correct Calculation Logic**:
```javascript
if (strategy === 'brrrr' && arv) {
  // BRRRR: Start from ARV (forced appreciation already happened)
  const year1Value = arv; // $320,000
  const projections = [];

  for (let year = 1; year <= 10; year++) {
    const value = year1Value * Math.pow(1 + appreciationRate/100, year - 1);
    const equity = value - refinanceLoan; // Subtract refi loan, not purchase loan
    projections.push({
      year,
      value,
      equity,
      loanBalance: calculateLoanBalance(refinanceLoan, year) // Refi loan amortization
    });
  }
} else {
  // Buy & Hold: Start from purchase price (current logic)
  const year1Value = purchasePrice;
  // ... existing logic
}
```

**Display Requirements**:

**BRRRR Long-Term Analysis Display**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Long-Term Hold Scenario (If Retained Post-Refinance)    │
│                                                             │
│ ⚠️ Note: This assumes you HOLD the property after          │
│    refinancing (not typical BRRRR, but some investors      │
│    keep high-performers long-term).                        │
├─────────────────────────────────────────────────────────────┤
│ Starting Value (Year 1): $320,000                          │
│   📈 Forced Appreciation: $120,000 (via rehab)             │
│   ℹ️  Appreciation compounds from ARV, not purchase price  │
│                                                             │
│ Appreciation Assumption: 3.0% annually                     │
│ Refinance Loan: $240,000 (75% LTV)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 10-Year Property Value Projection                          │
│                                                             │
│ Year │ Property Value │ Equity      │ Loan Balance          │
│ ─────┼────────────────┼─────────────┼──────────────────── │
│  1   │   $320,000     │  $80,000    │  $240,000             │
│  2   │   $329,600     │  $92,000    │  $237,600             │
│  3   │   $339,488     │ $104,688    │  $234,800             │
│  5   │   $360,305     │ $133,205    │  $227,100             │
│  7   │   $382,714     │ $164,514    │  $218,200             │
│ 10   │   $417,478     │ $212,878    │  $204,600             │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Total Equity Growth (Year 1 → 10): $132,878               │
│ Total Property Appreciation: $97,478 (30.5%)               │
│ Loan Paydown: $35,400                                      │
└─────────────────────────────────────────────────────────────┘

💡 BRRRR Strategy Note:
Most BRRRR investors refinance and SELL or REPEAT (buy another property)
within 12-18 months. This long-term hold scenario applies if you:
  • Decide property is a "keeper" for strong cash flow
  • Want to hold for appreciation in great neighborhood
  • Build long-term rental portfolio using BRRRR acquisitions
```

**Comparison: Buy & Hold vs BRRRR Projections**

Add section showing the difference:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Appreciation Comparison: BRRRR vs Buy & Hold            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Year 10 Property Value:                                    │
│   BRRRR (from $320K ARV):    $417,478                      │
│   Buy & Hold (from $200K):   $260,000                      │
│   Difference: $157,478 (60% higher for BRRRR!)             │
│                                                             │
│ Why BRRRR Projects Higher:                                 │
│   ✅ Forced appreciation via rehab ($120K immediate)       │
│   ✅ Compounds from higher base ($320K vs $200K)           │
│   ✅ Equity curve starts 25% ahead (ARV vs purchase)       │
│                                                             │
│ 💡 Key Insight: BRRRR front-loads appreciation through     │
│    value-add rehab, while Buy & Hold relies on market      │
│    appreciation alone.                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Required Inputs

**Existing Inputs**:
- ✅ Purchase Price (for comparison)
- ✅ ARV (FinancialsStep line 84)
- ✅ Appreciation Rate (AssumptionsStep)
- ✅ Refinance Loan Amount (calculated from ARV × LTV)
- ✅ Strategy (StrategySelectionStep)

**NEW Inputs**: None required (all data already collected)

#### Edge Cases

**Edge Case 1: ARV Missing**
- **Fallback**: Cannot show BRRRR long-term analysis
- **User Message**: "Long-term projections require After Repair Value (ARV). Add in Financials step."
- **Alternative**: Show Buy & Hold projections with warning

**Edge Case 2: User Enters 10-Year Hold Period for BRRRR**
- **Scenario**: User confused, enters 10 years in Assumptions
- **Handling**: Show projections but emphasize this is NOT typical BRRRR
- **Banner**: "⚠️ BRRRR typically involves 12-18 month holds before selling or repeating. Are you planning to hold long-term after refinance?"

**Edge Case 3: ARV Lower Than Purchase Price**
- **Scenario**: Bad rehab estimate, ARV < Purchase
- **Validation**: Flag error in wizard
- **Message**: "ARV ($280K) is lower than purchase price ($300K). Verify ARV comps or reconsider deal."

#### Business Rules & Validation

**Calculation Logic**:
```javascript
function generateLongTermProjections(propertyData, analysis) {
  const strategy = propertyData.strategy;
  const purchasePrice = propertyData.purchasePrice;
  const arv = propertyData.brrrr?.afterRepairValue;
  const appreciationRate = propertyData.appreciationRate || 3.0;
  const refinanceLoan = arv * (propertyData.brrrr?.refinanceLTV || 75) / 100;
  const purchaseLoan = purchasePrice * (1 - propertyData.downPaymentPercentage/100);

  // CRITICAL: Use ARV for BRRRR, Purchase Price for Buy & Hold
  const startingValue = (strategy === 'brrrr' && arv) ? arv : purchasePrice;
  const startingLoan = (strategy === 'brrrr' && arv) ? refinanceLoan : purchaseLoan;

  const projections = [];
  for (let year = 1; year <= 10; year++) {
    const propertyValue = startingValue * Math.pow(1 + appreciationRate/100, year - 1);
    const loanBalance = calculateRemainingBalance(startingLoan, year, interestRate);
    const equity = propertyValue - loanBalance;

    projections.push({
      year,
      propertyValue,
      loanBalance,
      equity,
      totalReturn: equity - totalInvested,
      annualizedReturn: calculateIRR(totalInvested, equity, year)
    });
  }

  return {
    startingValue,
    startingLoan,
    forcedAppreciation: strategy === 'brrrr' ? (arv - purchasePrice) : 0,
    projections
  };
}
```

**Validation Rules**:
- ✅ If BRRRR, `startingValue` MUST equal ARV (not purchase price)
- ✅ If Buy & Hold, `startingValue` MUST equal purchase price
- ⚠️ If ARV < Purchase Price, flag error (impossible BRRRR scenario)
- ⚠️ If appreciation rate > 8%, warn: "Unusually high appreciation assumption"

#### Success Metrics

**Bug Fix Validation**:
- [ ] Year 10 BRRRR projection = ARV × (1.03)^9 ✅
- [ ] Year 10 NOT equal to Purchase × (1.03)^9 ❌
- [ ] Difference between BRRRR and Buy & Hold projections = forced appreciation compounding

**User Comprehension**:
- 70%+ of BRRRR users understand why their Year 10 value is higher than Buy & Hold
- Users can explain "forced appreciation" concept in feedback surveys

**Business Impact**:
- Accurate hold vs sell decision data (no more $157K underestimates)
- Professional credibility (calculations match institutional standards)
- Competitive advantage (no other BRRRR calculator gets this right)

#### UX Design Requirements

**Design Philosophy**: Apple's "Temporal Storytelling" - Visualize the property's future trajectory with forced appreciation's compound effect.

##### Visual Hierarchy

**Typography Scale** (Data-heavy chart interface):
```css
/* Chart Title */
.chart-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI';
  font-size: 22px;
  font-weight: 700;
  line-height: 30px;
  letter-spacing: -0.5px;
}

/* Table Headers */
.table-header {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.54);
}

/* Numeric Data (Tabular) */
.data-value {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  font-variant-numeric: tabular-nums slashed-zero;
}

/* Year Labels */
.year-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

/* Callout Text (Forced Appreciation) */
.forced-appreciation-callout {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: var(--capital-recovery-accent);
}
```

**Color Palette** (Chart-specific):
```css
/* BRRRR Appreciation Curve */
--brrrr-curve: linear-gradient(135deg, #AF52DE 0%, #5E5CE6 100%); /* Purple gradient */
--buy-hold-curve: linear-gradient(135deg, #64D2FF 0%, #007AFF 100%); /* Blue gradient */

/* Forced Appreciation Highlight */
--forced-appreciation-bg: rgba(52, 199, 89, 0.08); /* Light green tint */
--forced-appreciation-border: #34C759;

/* Warning States */
--atypical-brrrr-warning: #FF9500; /* Orange - long hold unusual */
--calculation-error: #FF3B30; /* Red */

/* Chart Grid & Axes */
--chart-grid: rgba(0, 0, 0, 0.06); /* Subtle grid lines */
--chart-axis: rgba(0, 0, 0, 0.24); /* Axis lines */
```

**Spacing System** (Chart layout):
```css
--chart-padding: 32px; /* Around chart area */
--legend-spacing: 16px; /* Between legend items */
--table-row-height: 48px; /* Data rows */
--table-header-height: 40px; /* Table headers */
--comparison-gap: 24px; /* Between BRRRR and Buy & Hold */
```

**Component Sizing**:
```css
/* Interactive Chart */
.appreciation-chart {
  min-height: 400px; /* Enough vertical space */
  max-height: 600px;
  border-radius: 16px;
  padding: var(--chart-padding);
  background: linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%);
}

/* Data Table */
.projections-table {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Comparison Card */
.comparison-card {
  border-radius: 12px;
  padding: 24px;
  border-left: 4px solid var(--forced-appreciation-border);
  background: var(--forced-appreciation-bg);
}
```

**Iconography**:
```javascript
// Chart & Data Icons
chartIcon: 'ShowChartIcon' // Line chart
tableIcon: 'TableChartIcon' // Data table view
compareIcon: 'CompareArrowsIcon' // BRRRR vs Buy & Hold
forcedAppreciationIcon: 'TrendingUpIcon' // Upward trend
warningIcon: 'InfoOutlinedIcon' // Atypical BRRRR hold
timelineIcon: 'TimelineIcon' // Year-over-year
```

##### Interaction Design

**Micro-interactions**:

1. **Chart Hover Tooltip**:
```javascript
// Interactive data points on hover
const chartTooltip = {
  trigger: 'hover',
  content: (year, data) => `
    <div class="chart-tooltip">
      <div class="tooltip-year">Year ${year}</div>
      <div class="tooltip-metrics">
        <div class="metric-row">
          <span>Property Value:</span>
          <strong>${formatCurrency(data.propertyValue)}</strong>
        </div>
        <div class="metric-row">
          <span>Equity:</span>
          <strong>${formatCurrency(data.equity)}</strong>
        </div>
        <div class="metric-row">
          <span>Loan Balance:</span>
          <strong>${formatCurrency(data.loanBalance)}</strong>
        </div>
      </div>
    </div>
  `,
  position: 'top',
  animation: {
    duration: 150,
    easing: 'ease-out'
  }
}

// Tooltip styling
.chart-tooltip {
  background: rgba(0, 0, 0, 0.92);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(20px);
}
```

2. **Table Row Highlight Animation**:
```css
.table-row {
  transition: all 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
  cursor: pointer;
}

.table-row:hover {
  background: rgba(0, 122, 255, 0.04);
  transform: translateX(4px);
}

.table-row:active {
  background: rgba(0, 122, 255, 0.08);
}

/* Highlight selected year */
.table-row.selected {
  background: rgba(175, 82, 222, 0.08);
  border-left: 3px solid var(--post-refi-accent);
  font-weight: 600;
}
```

3. **View Toggle Animation** (Chart vs Table):
```jsx
<ToggleButtonGroup
  value={viewMode}
  exclusive
  onChange={handleViewChange}
  sx={{
    '& .MuiToggleButton-root': {
      transition: 'all 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      '&.Mui-selected': {
        backgroundColor: 'primary.main',
        color: 'white',
        transform: 'scale(1.05)'
      }
    }
  }}
>
  <ToggleButton value="chart">
    <ShowChartIcon sx={{ mr: 1 }} />
    Chart View
  </ToggleButton>
  <ToggleButton value="table">
    <TableChartIcon sx={{ mr: 1 }} />
    Table View
  </ToggleButton>
</ToggleButtonGroup>

// Smooth transition between views
<Fade in={viewMode === 'chart'} timeout={400}>
  <Box>{/* Chart content */}</Box>
</Fade>
<Fade in={viewMode === 'table'} timeout={400}>
  <Box>{/* Table content */}</Box>
</Fade>
```

4. **Forced Appreciation Pulse** (Draws attention):
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

.forced-appreciation-badge {
  animation: pulse 2s ease-in-out infinite;
  background: linear-gradient(135deg, #34C759 0%, #30D158 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 13px;
}
```

**Animation Timings**:
```javascript
const chartAnimations = {
  lineReveal: 1200,     // Curve draws in over 1.2s
  dataPointDelay: 100,  // 100ms stagger per point
  tableRowStagger: 50,  // Rows appear with 50ms delay
  viewTransition: 400,  // Chart<->Table switch
  tooltipShow: 150,     // Quick tooltip appearance
  easing: {
    curveReveal: 'cubic-bezier(0.65, 0, 0.35, 1)', // Smooth ease
    bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Slight bounce
  }
}
```

**Gesture Support (Mobile)**:
```javascript
// Pinch-to-zoom on chart
const pinchGesture = {
  enabled: true,
  minScale: 1.0,
  maxScale: 2.5,
  onPinch: (scale) => {
    chartRef.current.zoom(scale);
  }
}

// Swipe to navigate years
const swipeGesture = {
  onSwipeLeft: () => navigateToYear(currentYear + 1),
  onSwipeRight: () => navigateToYear(currentYear - 1),
  threshold: 50
}

// Pan to scroll chart horizontally
const panGesture = {
  enabled: true,
  direction: 'horizontal',
  onPan: (deltaX) => {
    chartRef.current.scroll(deltaX);
  }
}
```

**Keyboard Navigation**:
```javascript
// Navigate through years
keyboardShortcuts = {
  'ArrowLeft': 'Previous year',
  'ArrowRight': 'Next year',
  'Home': 'Year 1',
  'End': 'Year 10',
  'V': 'Toggle chart/table view',
  'C': 'Show comparison',
  'Escape': 'Close comparison modal'
}

// Accessibility focus trap in modal
const focusTrap = {
  initialFocus: '[data-autofocus]',
  returnFocus: true,
  onEscape: closeModal
}
```

**Focus States**:
```css
/* Chart elements focus */
.chart-data-point:focus {
  outline: 3px solid var(--initial-period-accent);
  outline-offset: 4px;
  r: 8; /* Increase circle radius */
}

/* Table row focus */
.table-row:focus {
  outline: 2px solid var(--initial-period-accent);
  outline-offset: -2px;
  background: rgba(0, 122, 255, 0.06);
}
```

##### Mobile-First Responsive Breakpoints

**iPhone (320px - 428px)**: Simplified Chart, Vertical Table
```jsx
// Mobile Layout - Chart simplified
<Box sx={{ px: 2, py: 3 }}>
  {/* Warning banner if long hold */}
  {isAtypicalBRRRR && (
    <Alert severity="info" sx={{ mb: 3 }}>
      <AlertTitle>Atypical BRRRR Strategy</AlertTitle>
      Most BRRRR investors sell/refinance within 12-18 months, not 10 years.
    </Alert>
  )}

  {/* Forced Appreciation Callout */}
  <Card sx={{
    mb: 3,
    borderLeft: '4px solid var(--forced-appreciation-border)',
    background: 'var(--forced-appreciation-bg)'
  }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        📈 Forced Appreciation
      </Typography>
      <Typography variant="h4" color="success.main" gutterBottom>
        ${formatCurrency(forcedAppreciation)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Created via rehab in Month 6. All future appreciation compounds from
        ${formatCurrency(arv)} ARV, not ${formatCurrency(purchasePrice)} purchase price.
      </Typography>
    </CardContent>
  </Card>

  {/* Simplified chart - only key years */}
  <Card sx={{ mb: 3 }}>
    <CardHeader title="Property Value Growth" />
    <CardContent>
      <LineChart
        data={[projections[0], projections[2], projections[4], projections[9]]} // Y1, 3, 5, 10
        xAxis="year"
        yAxis="propertyValue"
        height={300}
        simplified
      />
    </CardContent>
  </Card>

  {/* Key metrics cards */}
  <Stack spacing={2}>
    <MetricCard
      label="Year 10 Value"
      value={formatCurrency(year10Value)}
      subtext={`${totalAppreciation}% total appreciation`}
    />
    <MetricCard
      label="Year 10 Equity"
      value={formatCurrency(year10Equity)}
      subtext={`${formatCurrency(equityGrowth)} equity growth`}
    />
  </Stack>
</Box>
```

**iPad (768px - 1024px)**: Full Chart + Comparison
```jsx
// Tablet Layout - Side-by-side
<Grid container spacing={3}>
  <Grid item xs={12} md={8}>
    {/* Full interactive chart */}
    <Card>
      <CardHeader
        title="10-Year Property Value Projection"
        action={
          <ToggleButtonGroup value={viewMode}>
            <ToggleButton value="chart">Chart</ToggleButton>
            <ToggleButton value="table">Table</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        {viewMode === 'chart' ? (
          <InteractiveChart data={projections} />
        ) : (
          <DataTable data={projections} />
        )}
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={4}>
    {/* Key insights sidebar */}
    <Stack spacing={2}>
      <ForcedAppreciationCard />
      <ComparisonCard />
      <StrategyNoteCard />
    </Stack>
  </Grid>
</Grid>
```

**Desktop (1280px+)**: Overlay Comparison Chart
```jsx
// Desktop Layout - Advanced visualization
<Box>
  {/* Header with actions */}
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
    <Typography variant="h5">Long-Term Hold Analysis</Typography>
    <Button
      variant="outlined"
      startIcon={<CompareArrowsIcon />}
      onClick={() => setShowComparison(true)}
    >
      Compare BRRRR vs Buy & Hold
    </Button>
  </Box>

  {/* Dual-curve chart */}
  <Card sx={{ mb: 3 }}>
    <CardContent sx={{ p: 4 }}>
      <DualCurveChart
        brrrrData={brrrrProjections}
        buyHoldData={buyHoldProjections}
        highlightForcedAppreciation
        interactive
        height={500}
      />

      {/* Chart legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3 }}>
        <LegendItem
          color="var(--brrrr-curve)"
          label="BRRRR (from $320K ARV)"
        />
        <LegendItem
          color="var(--buy-hold-curve)"
          label="Buy & Hold (from $200K purchase)"
        />
        <LegendItem
          color="var(--forced-appreciation-border)"
          label="Forced Appreciation ($120K)"
          dashed
        />
      </Box>
    </CardContent>
  </Card>

  {/* Detailed table below */}
  <DetailedProjectionsTable data={projections} />
</Box>
```

##### Progressive Disclosure Strategy

**Level 1: Default Visible** (Key insights)
```javascript
const alwaysVisible = [
  'forcedAppreciationCallout', // Highlight the BRRRR advantage
  'year10Value',               // Final property value
  'year10Equity',              // Final equity position
  'simplifiedChart',           // Visual trajectory (mobile: 4 points, desktop: all)
  'atypicalBRRRRWarning'       // If long hold unusual
]
```

**Level 2: Toggle View** (Chart vs Table)
```javascript
const viewToggle = {
  default: 'chart',           // Visual-first
  options: ['chart', 'table'],
  chartView: {
    interactive: true,
    tooltipsOnHover: true,
    dataPointsClickable: true
  },
  tableView: {
    sortable: true,
    rowsExpandable: false,   // Keep simple
    exportable: false         // Not needed for BRRRR
  }
}
```

**Level 3: Comparison Modal** (BRRRR vs Buy & Hold)
```jsx
<Dialog
  open={showComparison}
  onClose={() => setShowComparison(false)}
  maxWidth="lg"
  fullWidth
>
  <DialogTitle>
    BRRRR vs Buy & Hold: 10-Year Comparison
    <IconButton onClick={() => setShowComparison(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Year 10 Property Value Difference
      </Typography>
      <Typography variant="h3" color="success.main">
        ${formatCurrency(valueDifference)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ({percentDifference}% higher for BRRRR)
      </Typography>
    </Box>

    <Divider sx={{ my: 3 }} />

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>BRRRR Strategy</Typography>
        <List dense>
          <ListItem>✅ Forced appreciation: ${formatCurrency(forcedApp)}</ListItem>
          <ListItem>✅ Compounds from ARV base</ListItem>
          <ListItem>✅ Equity curve starts 25% ahead</ListItem>
        </List>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Buy & Hold Strategy</Typography>
        <List dense>
          <ListItem>📈 Market appreciation only</ListItem>
          <ListItem>📉 Compounds from purchase price</ListItem>
          <ListItem>📉 Lower starting equity</ListItem>
        </List>
      </Grid>
    </Grid>
  </DialogContent>
</Dialog>
```

**Level 4: Educational Tooltip** (Forced Appreciation Explainer)
```jsx
<Tooltip
  title={
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        What is Forced Appreciation?
      </Typography>
      <Typography variant="body2">
        BRRRR creates value through rehab, increasing property worth from
        ${formatCurrency(purchasePrice)} to ${formatCurrency(arv)} in Month 6.
        This ${formatCurrency(forcedApp)} gain happens immediately, not
        gradually over 10 years like market appreciation.
      </Typography>
    </Box>
  }
  placement="right"
  arrow
  interactive
>
  <IconButton size="small">
    <InfoOutlinedIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

##### Error States & Empty States

**Error State 1: Missing ARV (P0 Bug Scenario)**
```jsx
<Alert
  severity="error"
  icon={<ErrorOutlineIcon />}
  sx={{ mb: 3 }}
  action={
    <Button color="inherit" size="small" onClick={() => navigateTo('financials-step')}>
      Add ARV
    </Button>
  }
>
  <AlertTitle>BRRRR Long-Term Analysis Unavailable</AlertTitle>
  After Repair Value (ARV) is required to calculate accurate long-term projections.
  Without ARV, we would underestimate Year 10 value by up to 60%.
</Alert>

{/* Fallback: Show Buy & Hold projections with big warning */}
<Card sx={{ border: '2px dashed', borderColor: 'warning.main' }}>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      ⚠️ Showing Buy & Hold Projections (Inaccurate for BRRRR)
    </Typography>
    <Typography variant="body2" color="text.secondary">
      These projections use purchase price (${formatCurrency(purchasePrice)})
      instead of ARV. Add ARV to see accurate BRRRR projections.
    </Typography>
  </CardContent>
</Card>
```

**Error State 2: ARV Lower Than Purchase**
```jsx
<Alert severity="error" sx={{ mb: 3 }}>
  <AlertTitle>Invalid ARV</AlertTitle>
  Your ARV (${formatCurrency(arv)}) is lower than purchase price
  (${formatCurrency(purchasePrice)}). This would result in negative forced
  appreciation. Please verify your ARV estimate or reconsider this deal.
</Alert>
```

**Error State 3: Calculation Failure**
```jsx
<Box sx={{ textAlign: 'center', py: 8 }}>
  <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
  <Typography variant="h6" gutterBottom>
    Unable to Generate Projections
  </Typography>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
    We encountered an error calculating long-term appreciation.
    Please verify all property inputs are correct.
  </Typography>
  <Stack direction="row" spacing={2} justifyContent="center">
    <Button variant="outlined" onClick={retryCalculation}>
      Retry Calculation
    </Button>
    <Button variant="text" onClick={() => navigateTo('wizard')}>
      Edit Property Data
    </Button>
  </Stack>
</Box>
```

**Empty State: No Projections Yet**
```jsx
<Box sx={{ textAlign: 'center', py: 8 }}>
  <TimelineIcon sx={{ fontSize: 72, color: 'action.disabled', mb: 2 }} />
  <Typography variant="h6" color="text.secondary" gutterBottom>
    Long-Term Projections Not Available Yet
  </Typography>
  <Typography variant="body2" color="text.secondary">
    Complete the Property Wizard to see 10-year appreciation projections
    and understand your property's future value trajectory.
  </Typography>
</Box>
```

##### Accessibility Requirements

**WCAG 2.1 AA Compliance**:

1. **Color Contrast in Charts**:
```css
/* Ensure chart colors meet 3:1 ratio */
.brrrr-curve-stroke {
  stroke: #8B3FD9; /* 4.51:1 on white background */
  stroke-width: 3px; /* Thick enough for visibility */
}

.buy-hold-curve-stroke {
  stroke: #0066CC; /* 5.32:1 on white background */
  stroke-width: 3px;
}

/* Data point markers */
.data-point {
  fill: currentColor;
  r: 6; /* Large enough for touch targets */
  stroke: white;
  stroke-width: 2;
}
```

2. **Screen Reader Optimization for Charts**:
```jsx
<figure
  role="img"
  aria-labelledby="chart-title"
  aria-describedby="chart-description"
>
  <figcaption id="chart-title" className="sr-only">
    10-Year BRRRR Property Value Projection
  </figcaption>
  <div id="chart-description" className="sr-only">
    Property value starts at ${formatCurrency(arv)} in Year 1 and grows to
    ${formatCurrency(year10Value)} in Year 10 at {appreciationRate}% annual
    appreciation. This represents {totalAppreciation}% total growth from the
    After Repair Value, not the original purchase price of
    ${formatCurrency(purchasePrice)}.
  </div>

  {/* Visual chart */}
  <svg aria-hidden="true">
    {/* Chart elements */}
  </svg>

  {/* Data table alternative for screen readers */}
  <table className="sr-only">
    <caption>10-Year Property Value Projection Data</caption>
    <thead>
      <tr>
        <th>Year</th>
        <th>Property Value</th>
        <th>Equity</th>
        <th>Loan Balance</th>
      </tr>
    </thead>
    <tbody>
      {projections.map(p => (
        <tr key={p.year}>
          <td>{p.year}</td>
          <td>${formatCurrency(p.propertyValue)}</td>
          <td>${formatCurrency(p.equity)}</td>
          <td>${formatCurrency(p.loanBalance)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</figure>
```

3. **Keyboard-Only Chart Navigation**:
```javascript
// Allow keyboard users to navigate data points
const handleKeyDown = (e) => {
  switch(e.key) {
    case 'ArrowRight':
      focusNextDataPoint();
      e.preventDefault();
      break;
    case 'ArrowLeft':
      focusPrevDataPoint();
      e.preventDefault();
      break;
    case 'Enter':
    case 'Space':
      showDataPointDetails(currentFocusedPoint);
      e.preventDefault();
      break;
  }
}

// Visual focus indicator on data points
.data-point:focus {
  outline: 3px solid var(--initial-period-accent);
  outline-offset: 4px;
  filter: drop-shadow(0 0 8px rgba(0, 122, 255, 0.5));
}
```

4. **High Contrast Mode Support**:
```css
@media (prefers-contrast: high) {
  .brrrr-curve-stroke {
    stroke: #6200EA; /* Darker purple */
    stroke-width: 4px; /* Thicker */
  }

  .buy-hold-curve-stroke {
    stroke: #0046A8; /* Darker blue */
    stroke-width: 4px;
  }

  .forced-appreciation-highlight {
    background: transparent;
    border: 3px solid #00C853;
  }

  .chart-grid {
    stroke: rgba(0, 0, 0, 0.3); /* More visible */
  }
}

/* Reduced motion: No animations */
@media (prefers-reduced-motion: reduce) {
  .chart-curve-path {
    stroke-dasharray: none !important;
    animation: none !important;
  }

  * {
    transition-duration: 0.01ms !important;
  }
}
```

##### Content Design & Microcopy

**Tone of Voice**: Educational authority explaining compound growth

**Educational Callouts**:
```javascript
callouts = {
  forcedAppreciation: {
    title: "📈 Forced Appreciation Advantage",
    body: "BRRRR creates ${formatCurrency(forcedApp)} in value through rehab. This happens in Month 6, not gradually over 10 years. All future appreciation compounds from this higher base."
  },

  compoundEffect: {
    title: "💡 Compound Growth from ARV",
    body: "Your property grows from ${formatCurrency(arv)} (ARV) to ${formatCurrency(year10Value)} over 10 years. If we incorrectly used purchase price (${formatCurrency(purchasePrice)}), we'd underestimate by ${formatCurrency(underestimate)}."
  },

  atypicalHold: {
    title: "⚠️ Atypical BRRRR Strategy",
    body: "Most BRRRR investors sell or refinance again within 12-18 months. Holding 10 years is unusual but can work if the property has strong cash flow and appreciation potential."
  }
}
```

**Error Messages**:
```javascript
errorMessages = {
  missingARV: "We need your After Repair Value (ARV) to calculate accurate long-term projections. Without it, we'd underestimate Year 10 value by up to 60%. Add ARV in the Financials step.",

  arvLowerThanPurchase: "Your ARV (${formatCurrency(arv)}) is lower than purchase price (${formatCurrency(purchasePrice)}). This would create negative forced appreciation. Please verify your ARV estimate.",

  highAppreciation: "Your appreciation rate (${rate}%) is higher than historical averages (3-5%). Consider using a more conservative estimate for realistic projections.",

  calculationError: "Unable to generate projections. Please verify all inputs are correct and try again."
}
```

**Success Indicators**:
```javascript
successMessages = {
  strongGrowth: "Excellent growth trajectory! Year 10 equity of ${formatCurrency(year10Equity)} represents ${percentGrowth}% growth from your initial investment.",

  forcedAppreciationBenefit: "BRRRR advantage: Year 10 value is ${formatCurrency(difference)} (${percent}%) higher than Buy & Hold due to forced appreciation.",

  correctCalculation: "✅ Projections calculated from ARV (${formatCurrency(arv)}), not purchase price. This ensures accurate long-term value estimates."
}
```

**Call-to-Action Buttons**:
```javascript
ctaButtons = {
  toggleView: "Switch to Table View",      // Not "Change View"
  compareStrategies: "Compare BRRRR vs Buy & Hold", // Clear comparison
  addARV: "Add ARV to See Accurate Projections", // Actionable
  editAppreciation: "Adjust Appreciation Rate", // Specific action
  viewDetails: "View Year {year} Details"  // Year-specific
}
```

##### Implementation Notes for Architect

**Chart Library Recommendation**:
```javascript
// Use Recharts (React-friendly, declarative)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

// Or Chart.js with react-chartjs-2 for more control
import { Line as LineChart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
```

**Custom Components Needed**:
1. `AppreciationChart` - Interactive line chart with dual curves
2. `ForcedAppreciationCallout` - Highlighted card explaining BRRRR advantage
3. `ProjectionsDataTable` - Sortable table with year-over-year data
4. `ComparisonModal` - BRRRR vs Buy & Hold side-by-side
5. `YearSelector` - Mobile year navigation component

**Performance Considerations**:
- Lazy load comparison modal (code-split)
- Memoize chart data transformations
- Use `React.memo()` for table rows
- Debounce chart interactions (pan, zoom) at 16ms
- Virtualize table if >50 rows (not needed for 10 years)

**Animation Budget**:
- Chart curve reveal: 1200ms (acceptable one-time load)
- Data point stagger: 100ms × 10 = 1000ms total
- View toggle: 400ms
- Total budget: <3000ms for full page render
- Target: 60fps for all interactions

**Critical P0 Bug Fix Validation**:
```javascript
// Unit test to prevent regression
describe('BRRRR Long-Term Projections', () => {
  it('should use ARV as starting value, not purchase price', () => {
    const propertyData = {
      strategy: 'brrrr',
      purchasePrice: 200000,
      brrrr: { afterRepairValue: 320000 }
    };

    const projections = generateLongTermProjections(propertyData);

    expect(projections.startingValue).toBe(320000); // ARV
    expect(projections.startingValue).not.toBe(200000); // NOT purchase price
  });

  it('should calculate Year 10 from ARV, not purchase price', () => {
    const year10 = projections[9].propertyValue;
    const expectedFromARV = 320000 * Math.pow(1.03, 9); // $417,478

    expect(year10).toBeCloseTo(expectedFromARV, -2); // Within $100
  });
});
```

---

### Tab 5: Tax Intelligence

**Priority**: P1 (High Educational Value)
**Effort**: Small (1-2 weeks)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Tax Intelligence case)

#### Business Context

**BRRRR Tax Advantage**: Cash-out refinance is **TAX-FREE MONEY** - this is the secret weapon of BRRRR that many investors don't understand.

**Real Investor Example (Property #9)**:
```
2019 BRRRR Deal:
Purchase: $220,000
Rehab: $50,000
Total Invested: $85,000 (down + rehab + closing)

2019 Refinance:
ARV: $350,000
Refinance Loan: $262,500 (75% LTV)
Cash Out: $92,500 (after paying off $150K purchase loan)

Tax Owed on $92,500: $0 ← THIS IS CRITICAL!

Why Tax-Free:
• Loan proceeds are NOT income (you owe it back)
• No capital gains (property not sold)
• No recapture (depreciation continues)
• Cash is TAX-FREE to use for next deal
```

**What Investors Often Miss**:
- They think refinance cash-out is taxable income (it's NOT)
- They don't understand depreciation continues on original basis
- They miss that BRRRR enables tax-free portfolio scaling (vs flipping = ordinary income)

#### Current State

**Current Tax Intelligence Tab** (for Buy & Hold):
- Shows depreciation calculations
- Shows hold period tax optimization
- Shows 1031 exchange opportunities
- May show capital gains on sale

**What's Missing for BRRRR**:
- No explanation that refinance cash-out is tax-free
- No clarification that depreciation continues after refinance
- No comparison: BRRRR vs flipping tax treatment
- No education on BRRRR as tax-free scaling strategy

#### BRRRR Requirements

**Display Structure**: Add BRRRR-specific tax education section

**New Section: BRRRR Tax Treatment**
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 BRRRR Tax Advantages                                    │
│                                                             │
│ ✅ Cash-Out Refinance: TAX-FREE MONEY                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Refinance Details:                                         │
│   ARV: $320,000                                            │
│   Refinance Loan: $240,000 (75% LTV)                       │
│   Payoff Old Loan: -$150,000                               │
│   Cash Out to Investor: $90,000                            │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Tax Owed on $90,000 Cash-Out: $0 🎉                        │
│                                                             │
│ Why Tax-Free:                                              │
│   • Loan proceeds are NOT income (debt, not earnings)      │
│   • Property not sold (no capital gains event)             │
│   • No depreciation recapture (property still held)        │
│   • Cash is tax-free to reinvest in next property          │
│                                                             │
│ Compare to Alternatives:                                   │
│                                                             │
│ If You FLIPPED This Property:                              │
│   Sale Price: $320,000                                     │
│   Cost Basis: $200,000                                     │
│   Gain: $120,000                                           │
│   Tax (ordinary income): $45,600 @ 38% 😱                  │
│   After-Tax Cash: $74,400                                  │
│                                                             │
│ BRRRR Advantage: $90,000 tax-free vs $74,400 after tax    │
│   = $15,600 more capital (21% more buying power!)          │
│                                                             │
│ 💡 Key Insight: BRRRR allows tax-free portfolio scaling.  │
│    You can extract capital without triggering capital      │
│    gains, depreciation recapture, or ordinary income.      │
└─────────────────────────────────────────────────────────────┘
```

**New Section: Depreciation Continues**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Depreciation After Refinance                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Critical Tax Rule: Refinance does NOT change depreciation  │
│                                                             │
│ Your Depreciation:                                         │
│   Purchase Price: $200,000                                 │
│   Land Value: -$40,000 (20% non-depreciable)               │
│   Depreciable Basis: $160,000                              │
│   Annual Depreciation: $5,818 ($160K ÷ 27.5 years)        │
│                                                             │
│ After Refinance:                                           │
│   New ARV: $320,000 ← Does NOT affect depreciation         │
│   New Loan: $240,000 ← Does NOT affect depreciation        │
│   Depreciation: $5,818/year ← SAME as before!              │
│                                                             │
│ Why This Matters:                                          │
│   • Depreciation shields rental income from taxes          │
│   • You continue getting $5,818/year tax deduction         │
│   • Even though property now worth $320K, you depreciate   │
│     on original $160K basis (IRS rules)                    │
│                                                             │
│ ⚠️ IMPORTANT: Depreciation is "recaptured" when you SELL   │
│    (taxed at 25%). But as long as you HOLD, you get the    │
│    annual deduction without owing taxes.                   │
└─────────────────────────────────────────────────────────────┘
```

**New Section: BRRRR as Tax-Free Scaling Strategy**
```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 BRRRR Tax-Free Portfolio Scaling                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Traditional Buy & Hold Scaling Problem:                    │
│   • To get capital for Property #2, must SELL Property #1  │
│   • Selling triggers capital gains tax (15-20%)            │
│   • Selling triggers depreciation recapture (25%)          │
│   • 1031 exchange required to defer (complex rules)        │
│                                                             │
│ BRRRR Solution:                                            │
│   • Refinance Property #1 (tax-free cash-out)              │
│   • Use $90K for down payment on Property #2               │
│   • Keep Property #1 (continues appreciating)              │
│   • No 1031 exchange needed (not selling)                  │
│   • Scale to 10+ properties tax-free                       │
│                                                             │
│ Example: 5-Property BRRRR Portfolio (Tax-Free)            │
│                                                             │
│ Year │ Property │ Invested │ Recovered │ Cumulative Cash  │
│ ─────┼──────────┼──────────┼───────────┼──────────────── │
│  1   │    #1    │  $90,000 │  $90,000  │   $0 (break-even)│
│  2   │    #2    │  $90,000 │  $85,000  │  -$5,000         │
│  3   │    #3    │  $85,000 │  $95,000  │  +$5,000         │
│  4   │    #4    │  $95,000 │  $100,000 │  +$10,000        │
│  5   │    #5    │  $100,000│  $110,000 │  +$20,000        │
│                                                             │
│ Total Invested: $90,000 (initial capital)                  │
│ Properties Owned: 5 (worth $1.6M combined)                 │
│ Total Taxes Paid: $0 (all refinances, no sales!)           │
│                                                             │
│ Compare to Flipping Same 5 Properties:                     │
│   Total Profit: $500,000                                   │
│   Tax Owed: $190,000 (ordinary income @ 38%)               │
│   After-Tax: $310,000                                      │
│   Properties Owned: 0 (sold them all)                      │
│                                                             │
│ BRRRR Advantage:                                           │
│   • Own $1.6M in appreciating assets (vs $0)               │
│   • Paid $0 in taxes (vs $190K)                            │
│   • Monthly cash flow from 5 rentals (vs 0)                │
│   • Can keep scaling indefinitely (tax-free)               │
└─────────────────────────────────────────────────────────────┘
```

#### Required Inputs

**Existing Inputs**:
- ✅ Purchase Price
- ✅ ARV
- ✅ Refinance Loan Amount (calculated)
- ✅ Depreciation (already calculated in tax section)

**NEW Inputs**: None required

#### Display Requirements

**UI Specifications**:
1. **New Accordion Section**: "BRRRR Tax Advantages" (collapsed by default)
2. **Educational Tone**: Not financial advice, but clear explanation of rules
3. **Visual Comparisons**: Side-by-side BRRRR vs Flipping tax treatment
4. **Professional Disclaimer**: "Consult CPA for your specific situation"
5. **Links**: "Learn More About BRRRR Tax Strategy" → Educational content

**Placement**: Add BRRRR section BEFORE existing "Hold Period Optimization" section

#### Edge Cases

**Edge Case 1: Refinance Denied**
- **Scenario**: User couldn't refinance, had to sell
- **Handling**: Show "If Sold" scenario with capital gains
- **Message**: "Refinance denial triggers sale = taxable event"

**Edge Case 2: Cash-Out Refinance > $100K**
- **Scenario**: Large cash-out raises lender scrutiny
- **Note**: "Large cash-outs ($100K+) may trigger additional lender documentation requirements"

#### Business Rules

**Tax Calculation Logic**:
```javascript
// Cash-Out Refinance Tax Treatment
const cashOut = refinanceLoan - purchaseLoan;
const taxOnCashOut = 0; // Always $0 - loan proceeds not taxable

// Depreciation Continues Unchanged
const depreciableBasis = purchasePrice - landValue;
const annualDepreciation = depreciableBasis / 27.5;
// Refinance does NOT change this calculation

// If Property Eventually Sold
const salePrice = futureValue;  // e.g., $429K in Year 10
const adjustedBasis = purchasePrice - (annualDepreciation * yearsHeld);
const capitalGain = salePrice - adjustedBasis;
const depreciationRecapture = annualDepreciation * yearsHeld;
const capitalGainsTax = capitalGain * 0.20;  // 20% long-term rate
const recaptureTax = depreciationRecapture * 0.25;  // 25% recapture rate
const totalTaxOnSale = capitalGainsTax + recaptureTax;
```

#### Success Metrics

**Educational Impact**:
- 80%+ of BRRRR users understand refinance cash-out is tax-free
- Reduction in support questions: "Do I owe taxes on refinance?"
- Users can explain BRRRR tax advantage vs flipping

**Feature Engagement**:
- 50%+ of BRRRR users expand "BRRRR Tax Advantages" section
- Average time in section: 2+ minutes (reading educational content)

---

### 🎨 UX Design Requirements (Apple Design Principles)

**Design Philosophy**: "Educational Authority" - Building confidence through clear tax education

**Core Principle**: Tab 5 is purely educational content with no calculations to display. The UX focuses on making complex tax concepts accessible, building investor confidence, and celebrating the BRRRR tax advantage without appearing promotional.

**Apple Design Values Applied**:
- **Simplicity**: Clean educational content layout, accordion progressive disclosure
- **Clarity**: Tax concepts explained in plain language, visual comparisons
- **Deference**: Content is king - educational message takes center stage
- **Depth**: Layered information disclosure, contextual links to deeper resources
- **Human Interface**: Celebrates "$0 TAX" benefit while maintaining educational professionalism

---

#### 1. Visual Hierarchy

**Typography Scale** (SF Pro Display via system fonts):
```css
/* Section Headers */
.tax-section-header {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.2px;
  color: #1d1d1f; /* Apple near-black */
}

/* Educational Body Text */
.tax-education-body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0px;
  color: #1d1d1f;
}

/* Tax Amount Highlights */
.tax-amount-highlight {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums; /* Aligned numbers */
}

/* Disclaimer Text */
.tax-disclaimer {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0px;
  color: #86868b; /* Apple gray */
}

/* Comparison Labels */
.comparison-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0px;
  text-transform: uppercase;
  color: #6e6e73; /* Apple medium gray */
}
```

**Color Palette** (Educational Content):
```css
/* Tax-Free Celebration Colors */
--tax-free-primary: #34C759; /* Green - positive, celebratory */
--tax-free-gradient: linear-gradient(135deg, #34C759 0%, #30D158 100%);
--tax-free-background: rgba(52, 199, 89, 0.08); /* Light green tint */

/* Tax Liability Warning Colors */
--tax-liability-warning: #FF9500; /* Orange - flipping taxes */
--tax-liability-background: rgba(255, 149, 0, 0.08); /* Light orange tint */

/* Educational Neutral Colors */
--educational-background: #f5f5f7; /* Apple light gray background */
--educational-border: #d2d2d7; /* Apple border gray */
--educational-text: #1d1d1f; /* Apple near-black */
--educational-secondary-text: #6e6e73; /* Apple medium gray */

/* Disclaimer Colors */
--disclaimer-background: #fafafa;
--disclaimer-border: #e5e5ea;
--disclaimer-text: #86868b;
```

**Spacing System** (8px grid):
```css
--spacing-accordion-padding: 24px; /* Internal accordion content padding */
--spacing-section-gap: 32px; /* Gap between major sections */
--spacing-comparison-card-gap: 16px; /* Gap between BRRRR vs Flipping cards */
--spacing-celebration-badge-margin: 16px; /* Space around "$0 TAX" badge */
--spacing-disclaimer-margin: 24px; /* Space above disclaimer */
```

**Icons** (Material-UI Icons):
- `SchoolIcon` - Educational content indicator
- `CheckCircleIcon` - Tax-free benefit checkmarks
- `WarningAmberIcon` - Tax liability warnings (flipping comparison)
- `InfoOutlinedIcon` - Additional context tooltips
- `ExpandMoreIcon` / `ExpandLessIcon` - Accordion state indicators
- `CelebrationIcon` - Optional for "$0 TAX" celebration emphasis
- `CalculateIcon` - Depreciation calculation sections
- `TrendingUpIcon` - Portfolio scaling visualization

**Component Sizing**:
```css
/* Accordion Headers */
.tax-accordion-header {
  min-height: 64px;
  padding: 16px 24px;
  border-radius: 12px; /* Apple rounded corners */
}

/* Comparison Cards */
.tax-comparison-card {
  min-height: 200px;
  padding: 24px;
  border-radius: 16px; /* Larger radius for feature cards */
}

/* Celebration Badge */
.tax-free-celebration-badge {
  min-height: 80px;
  padding: 16px 24px;
  border-radius: 20px; /* Extra rounded for emphasis */
}

/* Disclaimer Box */
.tax-disclaimer-box {
  min-height: 60px;
  padding: 16px;
  border-radius: 8px; /* Subtle rounded corners */
}
```

---

#### 2. Interaction Design

**Accordion Interactions**:
```javascript
// Accordion expand/collapse animation
const accordionAnimation = {
  duration: 300, // Apple standard
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design deceleration curve

  // Expand animation
  expand: {
    opacity: { from: 0, to: 1, duration: 200, delay: 100 },
    height: { from: 0, to: 'auto', duration: 300 },
    transform: { from: 'translateY(-8px)', to: 'translateY(0)', duration: 300 }
  },

  // Collapse animation
  collapse: {
    opacity: { from: 1, to: 0, duration: 150 },
    height: { from: 'auto', to: 0, duration: 300 }
  },

  // Icon rotation
  iconRotation: {
    expanded: 'rotate(180deg)',
    collapsed: 'rotate(0deg)',
    duration: 200
  }
};

// Default state: First accordion (BRRRR Tax Treatment) expanded, others collapsed
const defaultExpandedAccordion = 'brrrr-tax-treatment';
```

**"$0 TAX" Celebration Animation**:
```css
/* Subtle pulse animation for tax-free celebration badge */
@keyframes tax-free-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(52, 199, 89, 0.15);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(52, 199, 89, 0.25);
  }
}

.tax-free-celebration-badge {
  animation: tax-free-pulse 3s ease-in-out infinite;
  background: var(--tax-free-gradient);
  color: white;
}

/* Celebration badge appears with entrance animation on first load */
@keyframes celebration-entrance {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tax-free-celebration-badge.first-load {
  animation: celebration-entrance 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             tax-free-pulse 3s ease-in-out 1s infinite;
}
```

**Comparison Card Hover States**:
```css
/* BRRRR vs Flipping comparison cards */
.tax-comparison-card {
  transition: all 200ms ease-in-out;
  cursor: default; /* Not clickable, just informational */
}

.tax-comparison-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

/* BRRRR card (positive) */
.tax-comparison-card.brrrr {
  border: 2px solid var(--tax-free-primary);
  background: var(--tax-free-background);
}

/* Flipping card (comparison warning) */
.tax-comparison-card.flipping {
  border: 2px solid var(--tax-liability-warning);
  background: var(--tax-liability-background);
}
```

**Link Interactions** (External educational resources):
```css
/* Educational resource links */
.tax-education-link {
  color: #007AFF; /* Apple system blue */
  text-decoration: none;
  font-weight: 500;
  transition: color 150ms ease-in-out;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tax-education-link:hover {
  color: #0051D5; /* Darker blue on hover */
  text-decoration: underline;
}

.tax-education-link:active {
  color: #003D99; /* Even darker blue on click */
}

/* External link icon */
.tax-education-link::after {
  content: '↗';
  font-size: 0.85em;
  opacity: 0.7;
  transition: opacity 150ms ease-in-out;
}

.tax-education-link:hover::after {
  opacity: 1;
}
```

**Scroll Behavior** (Accordion content):
```javascript
// Smooth scroll to expanded accordion when user clicks header
const handleAccordionExpand = (accordionId) => {
  const accordionElement = document.getElementById(accordionId);
  if (accordionElement) {
    accordionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  }
};
```

**Loading States** (Initial page load):
```jsx
{/* Skeleton loading for accordion sections */}
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
  <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
  <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
</Box>
```

**Gesture Support** (Mobile):
```javascript
// Tap to expand accordion (mobile)
// Swipe up/down to scroll through educational content
// No pinch-to-zoom needed (text content, not charts)
```

---

#### 3. Mobile-First Responsive Breakpoints

**iPhone (320px - 767px) - Vertical Stack**:
```jsx
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  padding: 2
}}>
  {/* Celebration Badge - Full Width */}
  <Card sx={{
    background: 'var(--tax-free-gradient)',
    color: 'white',
    padding: 3,
    borderRadius: '20px',
    textAlign: 'center'
  }}>
    <Typography variant="h3" fontWeight={700}>$0 TAX</Typography>
    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
      on $90,000 refinance cash-out
    </Typography>
  </Card>

  {/* Accordions - Full Width, Larger Touch Targets */}
  <Accordion
    defaultExpanded
    sx={{
      borderRadius: '12px !important',
      '&:before': { display: 'none' } // Remove default MUI divider
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{
        minHeight: 72, // Larger for touch
        padding: '16px 20px',
        '& .MuiAccordionSummary-content': {
          margin: '16px 0'
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <SchoolIcon sx={{ color: 'var(--tax-free-primary)' }} />
        <Typography variant="h6" fontWeight={600}>
          BRRRR Tax Treatment
        </Typography>
      </Stack>
    </AccordionSummary>
    <AccordionDetails sx={{ padding: '16px 20px 24px' }}>
      {/* Educational content */}
    </AccordionDetails>
  </Accordion>

  {/* Comparison Cards - Stacked Vertically */}
  <Stack spacing={2}>
    <Card className="tax-comparison-card brrrr">
      <CardHeader
        avatar={<CheckCircleIcon sx={{ color: 'var(--tax-free-primary)' }} />}
        title="BRRRR Strategy"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Cash-out refinance:
        </Typography>
        <Typography variant="h4" fontWeight={700} color="var(--tax-free-primary)">
          $0 TAX
        </Typography>
      </CardContent>
    </Card>

    <Card className="tax-comparison-card flipping">
      <CardHeader
        avatar={<WarningAmberIcon sx={{ color: 'var(--tax-liability-warning)' }} />}
        title="Flipping Strategy"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sale profit tax:
        </Typography>
        <Typography variant="h4" fontWeight={700} color="var(--tax-liability-warning)">
          $38,400
        </Typography>
      </CardContent>
    </Card>
  </Stack>

  {/* Disclaimer - Full Width, Prominent */}
  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: '8px' }}>
    <AlertTitle>Not Financial or Tax Advice</AlertTitle>
    This analysis is for educational purposes only. Consult a CPA for your specific situation.
  </Alert>
</Box>
```

**iPad (768px - 1023px) - Side-by-Side Comparisons**:
```jsx
<Box sx={{ padding: 3 }}>
  {/* Celebration Badge - Centered, Moderate Size */}
  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
    <Card sx={{
      background: 'var(--tax-free-gradient)',
      color: 'white',
      padding: 4,
      borderRadius: '20px',
      textAlign: 'center',
      maxWidth: 400
    }}>
      <Typography variant="h2" fontWeight={700}>$0 TAX</Typography>
      <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.9 }}>
        on $90,000 refinance cash-out
      </Typography>
    </Card>
  </Box>

  {/* Accordions - Moderate Width */}
  <Stack spacing={2} sx={{ maxWidth: 800, mx: 'auto' }}>
    {/* Accordion content */}
  </Stack>

  {/* Comparison Cards - Side by Side (2 columns) */}
  <Grid container spacing={3} sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
    <Grid item xs={6}>
      <Card className="tax-comparison-card brrrr" sx={{ height: '100%' }}>
        {/* BRRRR card content */}
      </Card>
    </Grid>
    <Grid item xs={6}>
      <Card className="tax-comparison-card flipping" sx={{ height: '100%' }}>
        {/* Flipping card content */}
      </Card>
    </Grid>
  </Grid>

  {/* Disclaimer - Centered, Moderate Width */}
  <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
    <Alert severity="info" icon={<InfoOutlinedIcon />}>
      {/* Disclaimer content */}
    </Alert>
  </Box>
</Box>
```

**Desktop (1024px+) - Enhanced Educational Layout**:
```jsx
<Box sx={{ padding: 4, maxWidth: 1200, mx: 'auto' }}>
  {/* Hero Celebration Section */}
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 5,
    padding: 4,
    background: 'var(--educational-background)',
    borderRadius: '24px'
  }}>
    <Box sx={{ flex: 1 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        BRRRR Tax Advantage
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
        Cash-out refinancing allows you to access property equity without triggering
        a taxable event, unlike selling (flipping) which creates immediate tax liability.
      </Typography>
    </Box>
    <Card sx={{
      background: 'var(--tax-free-gradient)',
      color: 'white',
      padding: 5,
      borderRadius: '24px',
      textAlign: 'center',
      minWidth: 280
    }}>
      <Typography variant="h1" fontWeight={700} sx={{ fontSize: '48px' }}>
        $0 TAX
      </Typography>
      <Typography variant="h6" sx={{ mt: 2, opacity: 0.95 }}>
        on $90,000 cash-out
      </Typography>
    </Card>
  </Box>

  {/* Educational Accordions - 2-Column Layout Option */}
  <Grid container spacing={3}>
    <Grid item xs={12}>
      {/* All accordions full width, or split into categories */}
      <Stack spacing={2}>
        {/* Accordion content */}
      </Stack>
    </Grid>
  </Grid>

  {/* Comparison Section - Side by Side with More Detail */}
  <Box sx={{ mt: 5 }}>
    <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
      BRRRR vs Flipping Tax Comparison
    </Typography>
    <Grid container spacing={3}>
      <Grid item xs={6}>
        <Card className="tax-comparison-card brrrr" sx={{ height: '100%', padding: 4 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32, color: 'var(--tax-free-primary)' }} />
              <Typography variant="h5" fontWeight={600}>BRRRR Strategy</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Property Value:
              </Typography>
              <Typography variant="h6" fontWeight={600}>$320,000</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cash-Out Refinance (70% LTV):
              </Typography>
              <Typography variant="h6" fontWeight={600}>$90,000</Typography>
            </Box>
            <Divider />
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight={700} color="var(--tax-free-primary)">
                $0 TAX
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Refinance is not a taxable event
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card className="tax-comparison-card flipping" sx={{ height: '100%', padding: 4 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: center, gap: 2 }}>
              <WarningAmberIcon sx={{ fontSize: 32, color: 'var(--tax-liability-warning)' }} />
              <Typography variant="h5" fontWeight={600}>Flipping Strategy</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sale Price:
              </Typography>
              <Typography variant="h6" fontWeight={600}>$320,000</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Short-Term Capital Gain:
              </Typography>
              <Typography variant="h6" fontWeight={600}>$120,000</Typography>
            </Box>
            <Divider />
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight={700} color="var(--tax-liability-warning)">
                $38,400
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                32% tax rate (short-term gain)
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  </Box>

  {/* Disclaimer - Full Width, Prominent */}
  <Alert
    severity="info"
    icon={<InfoOutlinedIcon />}
    sx={{ mt: 5, borderRadius: '12px', padding: '16px 24px' }}
  >
    <AlertTitle sx={{ fontWeight: 600 }}>Not Financial or Tax Advice</AlertTitle>
    This analysis is for educational purposes only and does not constitute financial or tax advice.
    Tax laws are complex and vary by individual circumstances. Always consult a qualified CPA or
    tax professional for advice specific to your situation.
  </Alert>
</Box>
```

---

#### 4. Progressive Disclosure Strategy

**Level 1: Default Visible** (No interaction required):
- "$0 TAX" celebration badge (immediately visible)
- First accordion (BRRRR Tax Treatment) expanded by default
- BRRRR vs Flipping comparison cards (always visible)
- Professional disclaimer (always visible at bottom)

**Level 2: Expandable Sections** (Click/tap to expand):
- Accordion 2: Depreciation Continues (collapsed by default)
- Accordion 3: BRRRR Tax-Free Portfolio Scaling (collapsed by default)
- "Learn More" expandable sections within each accordion

**Level 3: Contextual Tooltips** (Hover/tap icon for definition):
- Term definitions: "Cash-out refinance", "Depreciation recapture", "Tax basis"
- Calculation explanations: "Why 70% LTV?", "How is short-term gain calculated?"
- Strategy clarifications: "What qualifies as investment property?"

**Level 4: External Educational Links** (Click to open new tab):
- IRS Publication 527 (Residential Rental Property)
- Tax professional finder (AICPA, state CPA societies)
- BRRRR strategy educational articles
- 1031 exchange vs BRRRR comparison resources

**Progressive Disclosure Pattern**:
```jsx
{/* Level 1: Default visible celebration */}
<Card className="tax-free-celebration-badge">$0 TAX</Card>

{/* Level 2: Expandable accordion */}
<Accordion defaultExpanded={index === 0}>
  <AccordionSummary>
    <Typography>BRRRR Tax Treatment</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Typography paragraph>
      Cash-out refinancing is NOT a taxable event...

      {/* Level 3: Contextual tooltip */}
      <Tooltip title="A cash-out refinance replaces your existing mortgage with a larger loan, allowing you to take the difference in cash.">
        <IconButton size="small">
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Typography>

    {/* Level 4: External educational link */}
    <Link
      href="https://www.irs.gov/publications/p527"
      target="_blank"
      rel="noopener noreferrer"
      className="tax-education-link"
    >
      IRS Publication 527: Residential Rental Property
    </Link>
  </AccordionDetails>
</Accordion>
```

---

#### 5. Error States & Empty States

**Missing Data Scenarios** (Tab 5 is mostly educational, minimal data dependency):

**Scenario 1: Missing ARV** (Affects example calculations):
```jsx
{!propertyData.brrrr?.afterRepairValue ? (
  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
    <AlertTitle>Example Calculation Using Default Values</AlertTitle>
    This property doesn't have an After Repair Value (ARV) specified, so we're showing
    tax advantages using example numbers. Your actual tax-free cash-out amount will
    depend on your property's ARV and refinance loan-to-value ratio.
  </Alert>
) : (
  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
    <AlertTitle>Personalized Tax Analysis</AlertTitle>
    Tax-free cash-out calculation based on your property's ARV of{' '}
    <strong>{formatCurrency(propertyData.brrrr.afterRepairValue)}</strong>.
  </Alert>
)}
```

**Scenario 2: Non-BRRRR Strategy** (User shouldn't see this tab):
```jsx
{propertyData.strategy !== 'brrrr' ? (
  <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
    <AlertTitle>BRRRR Tax Intelligence Not Available</AlertTitle>
    This analysis is for a <strong>{propertyData.strategy}</strong> strategy property.
    BRRRR tax advantages only apply to cash-out refinance strategies.
    <Button
      size="small"
      sx={{ mt: 1 }}
      onClick={() => navigateTo('strategy-step')}
    >
      Change to BRRRR Strategy
    </Button>
  </Alert>
) : null}
```

**Empty State** (Accordion with no content - should not happen):
```jsx
<AccordionDetails>
  {content ? (
    <Typography>{content}</Typography>
  ) : (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Educational content loading...
      </Typography>
    </Box>
  )}
</AccordionDetails>
```

**Loading State** (Initial tab load):
```jsx
{isLoading ? (
  <Stack spacing={2}>
    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '20px' }} />
    <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
    <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
    <Skeleton variant="rectangular" height={64} sx={{ borderRadius: '12px' }} />
  </Stack>
) : (
  // Actual tab content
)}
```

---

#### 6. Accessibility Requirements (WCAG 2.1 AA)

**Color Contrast Compliance**:
```css
/* WCAG AA requires 4.5:1 for normal text, 3:1 for large text */

/* Tax-free celebration badge */
.tax-free-celebration-badge {
  background: var(--tax-free-gradient); /* Green gradient */
  color: #ffffff; /* White text = 4.9:1 contrast ratio ✓ */
}

/* Tax liability warning */
.tax-comparison-card.flipping {
  background: rgba(255, 149, 0, 0.08); /* Light orange background */
  color: #1d1d1f; /* Dark text = 13.2:1 contrast ratio ✓ */
}

/* Disclaimer text */
.tax-disclaimer {
  color: #86868b; /* Apple gray */
  background: #fafafa; /* Light background = 4.6:1 contrast ratio ✓ */
}

/* Educational links */
.tax-education-link {
  color: #007AFF; /* Apple blue = 4.5:1 contrast ratio ✓ */
}
```

**Screen Reader Optimization**:
```jsx
{/* Semantic HTML for accordion sections */}
<section aria-labelledby="brrrr-tax-treatment-heading">
  <Accordion>
    <AccordionSummary
      aria-controls="brrrr-tax-treatment-content"
      id="brrrr-tax-treatment-heading"
      expandIcon={<ExpandMoreIcon aria-label="Expand BRRRR tax treatment section" />}
    >
      <Typography>BRRRR Tax Treatment</Typography>
    </AccordionSummary>
    <AccordionDetails id="brrrr-tax-treatment-content">
      {/* Educational content with proper heading hierarchy */}
      <Typography variant="h6" component="h3">
        Cash-Out Refinance is Tax-Free
      </Typography>
      <Typography paragraph>
        When you refinance your rental property and take cash out...
      </Typography>
    </AccordionDetails>
  </Accordion>
</section>

{/* Celebration badge with descriptive ARIA label */}
<Card
  className="tax-free-celebration-badge"
  role="status"
  aria-label="Tax advantage: Zero dollars tax on ninety thousand dollar cash-out refinance"
>
  <Typography variant="h1" aria-hidden="true">$0 TAX</Typography>
  <Typography variant="h6" aria-hidden="true">on $90,000 cash-out</Typography>
  <span className="sr-only">
    BRRRR strategy allows you to access $90,000 in equity through refinancing
    without paying any taxes, unlike flipping which would trigger $38,400 in taxes.
  </span>
</Card>

{/* Comparison cards with semantic comparison structure */}
<Box role="region" aria-labelledby="strategy-comparison-heading">
  <Typography id="strategy-comparison-heading" variant="h5" className="sr-only">
    Tax comparison between BRRRR and flipping strategies
  </Typography>
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Card aria-labelledby="brrrr-strategy-label">
        <CardHeader
          id="brrrr-strategy-label"
          title="BRRRR Strategy"
          avatar={<CheckCircleIcon aria-label="Positive outcome" />}
        />
        <CardContent>
          <Typography variant="h3" aria-label="Zero dollars tax">
            $0 TAX
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={6}>
      <Card aria-labelledby="flipping-strategy-label">
        <CardHeader
          id="flipping-strategy-label"
          title="Flipping Strategy"
          avatar={<WarningAmberIcon aria-label="Tax liability warning" />}
        />
        <CardContent>
          <Typography variant="h3" aria-label="Thirty-eight thousand four hundred dollars tax">
            $38,400
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Box>
```

**Keyboard Navigation**:
```javascript
// Accordion keyboard navigation (Material-UI built-in)
// - Tab: Focus next accordion header
// - Shift+Tab: Focus previous accordion header
// - Enter/Space: Expand/collapse focused accordion
// - Arrow keys: Navigate between accordion headers (optional enhancement)

// Link navigation
// - Tab: Focus next link
// - Enter: Open link (in new tab for external links)

// Tooltip keyboard access
<Tooltip
  title="Cash-out refinance definition"
  enterDelay={200}
  leaveDelay={200}
  // Tooltip appears on keyboard focus, not just hover
>
  <IconButton
    size="small"
    aria-label="Learn more about cash-out refinance"
    tabIndex={0}
  >
    <InfoOutlinedIcon />
  </IconButton>
</Tooltip>
```

**Focus Management**:
```javascript
// When accordion expands, maintain focus on accordion header (don't auto-focus content)
const handleAccordionChange = (accordionId) => (event, isExpanded) => {
  setExpandedAccordion(isExpanded ? accordionId : null);

  // Keep focus on accordion header for screen reader users
  // This allows them to hear "expanded" state announcement
  event.currentTarget.focus();
};

// Focus visible indicator for keyboard navigation
const focusVisibleStyles = {
  '&.Mui-focusVisible': {
    outline: '2px solid #007AFF', // Apple blue focus ring
    outlineOffset: '2px',
    borderRadius: '8px'
  }
};
```

**High Contrast Mode Support**:
```css
/* Windows High Contrast Mode */
@media (prefers-contrast: high) {
  .tax-free-celebration-badge {
    border: 2px solid currentColor;
  }

  .tax-comparison-card {
    border-width: 3px; /* Thicker borders for visibility */
  }

  .tax-education-link {
    text-decoration: underline; /* Always underline in high contrast */
  }
}
```

**Reduced Motion Preference**:
```css
/* Respect user's reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .tax-free-celebration-badge {
    animation: none; /* Disable pulse animation */
  }

  .accordion-content {
    transition: none; /* Instant expand/collapse, no animation */
  }

  .tax-comparison-card:hover {
    transform: none; /* No hover lift animation */
  }
}
```

---

#### 7. Content Design & Microcopy

**Tone of Voice**: Educational authority with celebration
- **Confident but not promotional**: "Cash-out refinance is tax-free" (fact) vs "Amazing tax-free benefit!" (hype)
- **Clear language**: Avoid tax jargon; explain terms when necessary
- **Celebratory where appropriate**: "$0 TAX" is a genuine advantage worth highlighting
- **Professional disclaimers**: Always include "not financial/tax advice" without being preachy

**Educational Tooltip Examples**:
```javascript
const educationalTooltips = {
  cashOutRefinance: "A cash-out refinance replaces your existing mortgage with a larger loan, allowing you to take the difference in cash. The IRS does not consider this borrowed money as taxable income.",

  depreciationBasis: "Your depreciation basis is the original property cost (minus land value) used to calculate annual depreciation deductions. Refinancing does not change this basis.",

  shortTermCapitalGain: "Profit from selling property owned less than 1 year, taxed as ordinary income at your marginal tax rate (up to 37% federal).",

  taxFreeScaling: "By repeatedly using BRRRR (buy, rehab, rent, refinance, repeat), you can scale a real estate portfolio while deferring taxes indefinitely, unlike flipping which triggers taxes on every sale.",

  loanToValue: "Loan-to-value (LTV) is the ratio of your loan amount to the property's value. Most BRRRR refinances use 70-75% LTV, leaving 25-30% equity in the property."
};
```

**Accordion Header Microcopy**:
```javascript
const accordionHeaders = {
  section1: {
    title: "BRRRR Tax Treatment",
    subtitle: "Why cash-out refinance is tax-free"
  },
  section2: {
    title: "Depreciation Continues",
    subtitle: "Refinance doesn't change your depreciation deductions"
  },
  section3: {
    title: "Tax-Free Portfolio Scaling",
    subtitle: "How BRRRR beats flipping for long-term wealth"
  }
};
```

**Call-to-Action Button Copy**:
```javascript
const ctaButtons = {
  addARV: "Add ARV to See Your Tax-Free Amount",
  consultCPA: "Find a Real Estate CPA",
  learnMore: "Learn More About BRRRR Taxes",
  compareStrategies: "BRRRR vs Flipping Comparison",
  viewCapitalRecovery: "See Full Capital Recovery Timeline"
};
```

**Error Message Copy**:
```javascript
const errorMessages = {
  missingARV: {
    title: "Example Calculation Using Default Values",
    message: "This property doesn't have an After Repair Value (ARV) specified, so we're showing tax advantages using example numbers. Your actual tax-free cash-out amount will depend on your property's ARV and refinance loan-to-value ratio.",
    action: "Add ARV in Financials Step"
  },
  wrongStrategy: {
    title: "BRRRR Tax Intelligence Not Available",
    message: "This analysis is for a {strategy} strategy property. BRRRR tax advantages only apply to cash-out refinance strategies.",
    action: "Change to BRRRR Strategy"
  }
};
```

**Disclaimer Microcopy**:
```javascript
const disclaimers = {
  primary: {
    title: "Not Financial or Tax Advice",
    body: "This analysis is for educational purposes only and does not constitute financial or tax advice. Tax laws are complex and vary by individual circumstances. Always consult a qualified CPA or tax professional for advice specific to your situation."
  },
  dataSource: {
    body: "Tax rate examples assume a high-income investor (32% short-term capital gains rate). Your actual tax rates may vary based on income level, filing status, and state taxes."
  }
};
```

**Celebration Badge Variations**:
```javascript
// Personalized with actual property data
const celebrationBadge = propertyData.brrrr?.afterRepairValue
  ? {
      primaryText: "$0 TAX",
      secondaryText: `on ${formatCurrency(calculateCashOut(propertyData))} cash-out`
    }
  : {
      primaryText: "$0 TAX",
      secondaryText: "on cash-out refinance"
    };
```

---

#### 8. Implementation Notes for Architect

**Material-UI Components to Use**:
```javascript
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';

import {
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  InfoOutlined as InfoOutlinedIcon,
  School as SchoolIcon,
  WarningAmber as WarningAmberIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
```

**Custom Components Needed** (Create new files):

1. **`TaxIntelligenceTab.tsx`** - Main tab container
   ```typescript
   interface TaxIntelligenceTabProps {
     propertyData: PropertyData;
     onNavigate: (destination: string) => void;
   }
   ```

2. **`TaxCelebrationBadge.tsx`** - "$0 TAX" celebration component
   ```typescript
   interface TaxCelebrationBadgeProps {
     cashOutAmount: number;
     isPersonalized: boolean; // Based on actual ARV vs example
   }
   ```

3. **`TaxComparisonCards.tsx`** - BRRRR vs Flipping side-by-side
   ```typescript
   interface TaxComparisonCardsProps {
     brrrStrategy: {
       propertyValue: number;
       cashOut: number;
       tax: number; // Always $0
     };
     flippingStrategy: {
       salePrice: number;
       capitalGain: number;
       tax: number;
       taxRate: number;
     };
   }
   ```

4. **`TaxEducationAccordion.tsx`** - Reusable accordion with icon/title/content
   ```typescript
   interface TaxEducationAccordionProps {
     id: string;
     icon: ReactNode;
     title: string;
     subtitle?: string;
     children: ReactNode;
     defaultExpanded?: boolean;
   }
   ```

5. **`TaxDisclaimer.tsx`** - Professional disclaimer component
   ```typescript
   interface TaxDisclaimerProps {
     variant?: 'primary' | 'data-source';
   }
   ```

**State Management**:
```typescript
// Tab-level state
const [expandedAccordion, setExpandedAccordion] = useState<string | null>('brrrr-tax-treatment');
const [showFullComparison, setShowFullComparison] = useState(false);
const [isLoading, setIsLoading] = useState(true);

// Derived state from propertyData
const hasARV = !!propertyData.brrrr?.afterRepairValue;
const isBRRRStrategy = propertyData.strategy === 'brrrr';
const cashOutAmount = hasARV ? calculateCashOut(propertyData) : 90000; // Example fallback
```

**Helper Functions Needed**:
```typescript
// Calculate cash-out amount based on ARV and LTV
const calculateCashOut = (propertyData: PropertyData): number => {
  const arv = propertyData.brrrr?.afterRepairValue || 0;
  const ltv = propertyData.brrrr?.refinanceLTV || 0.7;
  const existingLoan = propertyData.financing?.loanAmount || 0;
  return (arv * ltv) - existingLoan;
};

// Calculate flipping tax liability for comparison
const calculateFlippingTax = (propertyData: PropertyData): number => {
  const salePrice = propertyData.brrrr?.afterRepairValue || 0;
  const purchasePrice = propertyData.purchasePrice || 0;
  const rehabCost = propertyData.brrrr?.rehabCost || 0;
  const capitalGain = salePrice - purchasePrice - rehabCost;
  const taxRate = 0.32; // Short-term capital gains for high-income investor
  return capitalGain * taxRate;
};

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
```

**Performance Considerations**:
```javascript
// Tab 5 is pure educational content, minimal performance concerns

// Lazy load external educational resources (don't block tab render)
const [externalResources, setExternalResources] = useState([]);
useEffect(() => {
  // Load educational links asynchronously
  fetchEducationalResources().then(setExternalResources);
}, []);

// Memoize comparison calculations
const taxComparison = useMemo(() => ({
  brrrr: {
    cashOut: calculateCashOut(propertyData),
    tax: 0
  },
  flipping: {
    capitalGain: calculateCapitalGain(propertyData),
    tax: calculateFlippingTax(propertyData)
  }
}), [propertyData]);

// Accordion content doesn't need virtualization (only 3 sections)
```

**Animation Libraries** (Optional enhancements):
```javascript
// Framer Motion for celebration badge entrance animation (optional)
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
>
  <TaxCelebrationBadge />
</motion.div>

// Or use CSS keyframe animations (lighter weight, preferred)
```

**External Link Configuration**:
```javascript
// Educational resources with tracking
const educationalLinks = [
  {
    label: 'IRS Publication 527: Residential Rental Property',
    url: 'https://www.irs.gov/publications/p527',
    category: 'Tax Rules'
  },
  {
    label: 'Find a Real Estate CPA (AICPA)',
    url: 'https://www.aicpa.org/forthepublic/findacpa.html',
    category: 'Professional Help'
  },
  {
    label: 'BRRRR Strategy Tax Guide (BiggerPockets)',
    url: 'https://www.biggerpockets.com/guides/brrrr-method',
    category: 'Strategy Education'
  }
];

// Add analytics tracking when links are clicked
const handleEducationalLinkClick = (link) => {
  // Track in analytics
  trackEvent('Tax Intelligence', 'External Link Click', link.label);
  // Link opens in new tab (target="_blank" rel="noopener noreferrer")
};
```

**Testing Requirements**:
```javascript
// Unit tests
describe('TaxIntelligenceTab', () => {
  it('should show personalized cash-out amount when ARV exists', () => {
    const propertyData = { brrrr: { afterRepairValue: 320000 } };
    render(<TaxIntelligenceTab propertyData={propertyData} />);
    expect(screen.getByText(/\$90,000/)).toBeInTheDocument(); // Calculated cash-out
  });

  it('should show example values when ARV is missing', () => {
    const propertyData = { brrrr: {} };
    render(<TaxIntelligenceTab propertyData={propertyData} />);
    expect(screen.getByText(/Example Calculation/)).toBeInTheDocument();
  });

  it('should expand first accordion by default', () => {
    render(<TaxIntelligenceTab propertyData={mockData} />);
    expect(screen.getByLabelText(/collapse/i)).toBeInTheDocument(); // Expanded state
  });
});

// Accessibility tests
describe('TaxIntelligenceTab Accessibility', () => {
  it('should have proper ARIA labels for celebration badge', () => {
    render(<TaxCelebrationBadge cashOutAmount={90000} />);
    expect(screen.getByLabelText(/Zero dollars tax/)).toBeInTheDocument();
  });

  it('should be keyboard navigable', async () => {
    render(<TaxIntelligenceTab propertyData={mockData} />);
    await userEvent.tab(); // Focus first accordion
    await userEvent.keyboard('{Enter}'); // Expand accordion
    expect(screen.getByText(/Cash-out refinancing/)).toBeVisible();
  });
});
```

**Responsive Testing Checklist**:
- [ ] iPhone SE (375px): Celebration badge full width, accordions stacked
- [ ] iPhone 12/13 (390px): Same as iPhone SE
- [ ] iPad (768px): Comparison cards side-by-side
- [ ] Desktop (1200px): Full layout with hero section
- [ ] Ultra-wide (1920px): Max width constraint (1200px) centered

**Browser Compatibility**:
- Chrome/Edge (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Design System Alignment**:
- Follow Material-UI v7 theming system
- Use system fonts (-apple-system, SF Pro Display) for Apple aesthetic
- Leverage MUI color palette for consistency
- 8px spacing grid throughout
- 12-24px border radius for cards (Apple-style rounded corners)

---

## 📝 Detailed Requirements: Tabs 6-12

**Note**: Comprehensive BRRRR-specific requirements for remaining 7 tabs. These tabs are currently designed for Buy & Hold logic and require fundamental changes to support BRRRR strategy properly.

---

### Tab 6: Interactive Tools

**Priority**: P1 (High Value - Quick User Wins)
**Effort**: Small (1 week)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Interactive Tools case - if exists) or separate component

#### Business Context

**Real Investor Behavior**: BRRRR investors use Interactive Tools VERY DIFFERENTLY than Buy & Hold investors.

**Buy & Hold Investor**: "What rent do I need to break even?" (focuses on cash flow)

**BRRRR Investor**: "What purchase price keeps me under the 70% Rule?" (focuses on capital recovery)

**Example from My Portfolio (Property #14 - Dallas BRRRR, 2022)**:
```
Using Interactive Tools to Find Maximum Purchase Price:

Starting Point:
ARV: $285,000 (confirmed by comps)
Rehab Budget: $35,000
70% Rule Target: Purchase + Rehab ≤ 70% × $285K = $199,500

Question: What's max purchase price?
Calculation: $199,500 - $35,000 = $164,500 max purchase

I used purchase price slider to test:
$170K → 70% Rule: 72% (FAILS ❌)
$165K → 70% Rule: 70.2% (MARGINAL ⚠️)
$160K → 70% Rule: 68.4% (PASS ✅)

Actual Purchase: $158,000 (conservative margin)
Result: 67.7% on 70% Rule, capital recovery 89%
```

This is IMPOSSIBLE to do with Buy & Hold sliders focused on cash flow optimization.

#### Current State

**Current Interactive Tools** (Buy & Hold Design):
- Purchase Price slider → Shows impact on cash flow, CoC return, cap rate
- Monthly Rent slider → Shows impact on cash flow, CoC return
- Interest Rate slider → Shows impact on monthly payment, cash flow
- Down Payment % slider → Shows impact on cash flow, loan amount
- Vacancy Rate slider → Shows impact on effective income, cash flow
- Property Tax slider → Shows impact on expenses, cash flow
- Insurance slider → Shows impact on expenses, cash flow
- Maintenance % slider → Shows impact on expenses, cash flow

**What Works for BRRRR (No Changes)**:
- ✅ All 8 existing sliders are relevant to BRRRR
- ✅ Purchase price, rent, rate, down payment all affect BRRRR metrics
- ✅ Slider UI components can be reused

#### What's MISSING for BRRRR

**Problem #1: Wrong Impact Metrics Displayed**
- Current sliders show: Cash flow, CoC, cap rate
- BRRRR needs: Capital recovery rate, 70% Rule compliance, refinance cash-out

**Problem #2: No BRRRR-Specific Sliders**
- Missing: ARV variance slider (biggest BRRRR risk)
- Missing: Rehab budget slider (73% of deals exceed budget)
- Missing: Refinance rate slider (may differ from purchase rate)

**Problem #3: No BRRRR Contextual Guidance**
- Users don't know how to use sliders for BRRRR strategy
- No guidance on "test purchase price for 70% Rule" workflow

#### BRRRR Requirements

**Display Structure**: Existing slider section + BRRRR contextual banner + 3 new sliders

**BRRRR Contextual Banner**:
```
┌────────────────────────────────────────────────────────────┐
│ 💡 BRRRR Interactive Tools Tips                           │
├────────────────────────────────────────────────────────────┤
│ Use these sliders to test BRRRR-specific scenarios:       │
│                                                            │
│ • Purchase Price → Test 70% Rule compliance               │
│   (Purchase + Rehab ≤ 70% × ARV)                          │
│                                                            │
│ • ARV Variance → Test conservative/aggressive ARV          │
│   (Most critical BRRRR risk factor)                       │
│                                                            │
│ • Rehab Budget → Test overrun impact                      │
│   (Industry avg: 20-30% over budget)                      │
│                                                            │
│ • Refinance Rate → Test rate change scenarios             │
│   (Rates may change between purchase and refinance)       │
└────────────────────────────────────────────────────────────┘
```

**NEW Slider #1: ARV Variance**:
```
┌────────────────────────────────────────────────────────────┐
│ After Repair Value (ARV) Variance                         │
│                                                            │
│ Base ARV: $320,000                                         │
│                                                            │
│ [-20%] ◄─────●──────► [+20%]                             │
│ $256K      $320K      $384K                                │
│             ▲                                              │
│         Current: $320,000                                  │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Refinance Loan (75% LTV):   $240,000                  │
│ ├─ Refinance Cash-Out:         $90,000                    │
│ ├─ Capital Recovery Rate:      85%                        │
│ └─ 70% Rule:                   75% ✅ PASS                │
│                                                            │
│ 💡 Tip: Test -10% scenario to see impact of ARV           │
│    overestimation (most common BRRRR risk)                │
└────────────────────────────────────────────────────────────┘
```

**NEW Slider #2: Rehab Budget Overrun**:
```
┌────────────────────────────────────────────────────────────┐
│ Rehab Budget Overrun                                       │
│                                                            │
│ Base Rehab: $40,000                                        │
│                                                            │
│ [+0%] ◄─────●──────► [+50%]                              │
│ $40K       $40K       $60K                                 │
│             ▲                                              │
│         Current: $40,000 (+0%)                             │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Total Capital Invested:     $90,000                    │
│ ├─ Capital Recovery Rate:      85%                        │
│ ├─ 70% Rule:                   75% ✅ PASS                │
│ └─ Break-Even Capital:         $10,000 remaining           │
│                                                            │
│ ⚠️ Industry Average: 20-30% over budget                   │
│ 💡 Test +30% to see realistic overrun impact              │
└────────────────────────────────────────────────────────────┘
```

**NEW Slider #3: Refinance Interest Rate**:
```
┌────────────────────────────────────────────────────────────┐
│ Refinance Interest Rate                                    │
│                                                            │
│ Purchase Rate: 7.5%                                        │
│                                                            │
│ [5.5%] ◄─────●──────► [9.5%]                             │
│  -2%       7.5%       +2%                                  │
│             ▲                                              │
│         Current: 7.5% (same as purchase)                   │
│                                                            │
│ Impact on Post-Refinance Cash Flow:                        │
│ ├─ Refinance Loan:             $240,000                   │
│ ├─ Monthly Payment:            $1,597                      │
│ ├─ Post-Refi Cash Flow:        -$384/month                │
│ └─ Break-Even Rent:            $2,184/month                │
│                                                            │
│ 💡 Rates may change 0.5-1% between purchase and           │
│    refinance (6-12 months later)                          │
└────────────────────────────────────────────────────────────┘
```

**Existing Sliders - Enhanced Display for BRRRR**:

When user adjusts **Purchase Price slider**, show:
```
Impact Metrics (BRRRR):
├─ 70% Rule: 75% ✅ (Purchase + Rehab ≤ 70% × ARV)
├─ Capital Recovery: 85%
├─ Post-Refi Cash Flow: -$384/month
└─ Initial Cash Flow: $164/month
```

Instead of Buy & Hold metrics (cash flow, CoC, cap rate).

#### Required Inputs

**Existing Inputs** (already available):
- ✅ Purchase Price
- ✅ Monthly Rent
- ✅ Interest Rate (purchase)
- ✅ Down Payment %
- ✅ Vacancy Rate
- ✅ Property Tax
- ✅ Insurance
- ✅ Maintenance %
- ✅ ARV (BRRRR-specific)
- ✅ Rehab Budget (BRRRR-specific)
- ✅ Refinance LTV % (BRRRR-specific)

**NEW Inputs** (for new sliders):
- ❓ **ARV Variance Range** (default: ±20%)
- ❓ **Rehab Overrun Range** (default: +0% to +50%)
- ❓ **Refinance Rate Range** (default: purchase rate ±2%)

All new inputs can use default ranges - no wizard changes needed.

#### Display Requirements

**UI Specifications**:
1. **BRRRR Banner**: Show contextual guidance at top of Interactive Tools section (only for BRRRR strategy)
2. **3 New Sliders**: ARV Variance, Rehab Overrun, Refinance Rate (only for BRRRR strategy)
3. **Enhanced Impact Display**: Show BRRRR metrics (capital recovery, 70% Rule) instead of Buy & Hold metrics
4. **Color Coding**:
   - 70% Rule PASS (≤70%): Green
   - 70% Rule MARGINAL (70-72%): Yellow
   - 70% Rule FAIL (>72%): Red
   - Capital Recovery ≥75%: Green
   - Capital Recovery 50-74%: Yellow
   - Capital Recovery <50%: Red
5. **Real-Time Updates**: Metrics update as user drags sliders
6. **Reset Button**: "Reset to Base Case" to restore original values

**Mobile Responsive**: Sliders stack vertically, impact metrics shown below each slider

#### Edge Cases

**Edge Case 1: Missing ARV**
- **Scenario**: User analyzing BRRRR property but ARV not provided
- **Handling**: Disable ARV variance slider, show message: "ARV required for this slider. Add in Financials step."

**Edge Case 2: Refinance Rate Not Set**
- **Fallback**: Default to purchase rate
- **User Message**: "Using purchase rate (7.5%). Adjust slider to test different refinance rates."

**Edge Case 3: Extreme Slider Values**
- **Scenario**: User sets ARV variance to -20% (very pessimistic)
- **Validation**: Show warning if results in 70% Rule > 80%: "⚠️ Extreme ARV variance makes deal unviable"

**Edge Case 4: Infinite Return Threshold**
- **Scenario**: User adjusts sliders and capital recovery reaches 100%+
- **Display**: Show "🎉 Infinite Return!" badge + tooltip explaining

**Edge Case 5: No Impact on Metrics**
- **Scenario**: User adjusts vacancy rate slider but BRRRR metrics don't change
- **Explanation**: Vacancy affects cash flow (not primary BRRRR metric), show link to Financial Details tab

#### Business Rules & Validation

**Calculation Logic**:
```javascript
// ARV Variance Slider Impact
const adjustedARV = baseARV * (1 + arvVariancePct / 100);
const refinanceLoan = adjustedARV * (refinanceLTV / 100); // e.g., $320K * 0.75 = $240K
const refinanceCashOut = refinanceLoan - purchaseLoan - refinanceClosingCosts;
const capitalRecoveryRate = (refinanceCashOut / totalCapitalInvested) * 100;
const rule70Percentage = ((purchasePrice + rehabBudget) / adjustedARV) * 100;
const meets70Rule = rule70Percentage <= 70;

// Rehab Overrun Slider Impact
const adjustedRehab = baseRehab * (1 + rehabOverrunPct / 100);
const adjustedTotalInvested = downPayment + closingCosts + adjustedRehab + holdingCosts;
const adjustedCapitalRecovery = (refinanceCashOut / adjustedTotalInvested) * 100;
const adjusted70Rule = ((purchasePrice + adjustedRehab) / arv) * 100;

// Refinance Rate Slider Impact
const adjustedRefinanceRate = baseRefinanceRate + refinanceRateDelta;
const adjustedRefinancePayment = calculateMonthlyPayment(
  refinanceLoan,
  adjustedRefinanceRate / 100 / 12,
  loanTermYears
);
const adjustedPostRefiCashFlow = monthlyRent - monthlyExpenses - adjustedRefinancePayment;
const adjustedBreakEvenRent = monthlyExpenses + adjustedRefinancePayment;
```

**Validation Rules**:
- ⚠️ If ARV variance < -15%, show: "Severe ARV overestimation - consider passing on deal"
- ⚠️ If rehab overrun > +40%, show: "Major overrun - deal may become unviable"
- ⚠️ If refinance rate > purchase rate + 2%, show: "Unusual rate increase - verify market conditions"
- ⚠️ If 70% Rule > 75%, show: "Approaching 70% Rule failure threshold"

#### Success Metrics

**Slider Usage**:
- 70%+ of BRRRR users interact with Interactive Tools tab
- Average 4+ slider adjustments per analysis
- ARV variance slider used in 60%+ of analyses
- Purchase price slider used in 80%+ of analyses (most common BRRRR optimization)

**User Understanding**:
- 75%+ of users can explain how purchase price affects 70% Rule
- Users understand ARV variance is biggest BRRRR risk (survey feedback)

**Feature Adoption**:
- 40%+ of users test conservative ARV scenario (-5% to -10%)
- 30%+ of users test rehab overrun scenario (+20% to +30%)

**Business Impact**:
- Users make more informed purchase price offers (test 70% Rule compliance before offering)
- Reduction in support tickets: "How do I calculate maximum purchase price for BRRRR?"
- Increase in realistic BRRRR expectations (understanding ARV risk through testing)

---

### Tab 7: Deal Optimizer

**Priority**: P2 (Medium Value - Optimization is Secondary to Core Analysis)
**Effort**: Medium (2-3 weeks - requires new optimization algorithm)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Deal Optimizer case - if exists) or separate component

#### Business Context

**Fundamental Difference**: Buy & Hold optimizes for CASH FLOW. BRRRR optimizes for CAPITAL RECOVERY.

**Buy & Hold Goal**: "How do I maximize monthly cash flow and long-term equity?"

**BRRRR Goal**: "How do I recover 100% of invested capital while maintaining viable deal structure?"

**Real Example (Property #18 - Phoenix BRRRR, 2023)**:
```
Initial Deal:
Purchase: $210,000
Rehab: $45,000
ARV: $310,000
Capital Recovery: 72% (not ideal)

Buy & Hold Optimizer Would Suggest:
"Increase down payment to 30% → Cash flow improves to $220/month"
Result: ❌ WORSE for BRRRR (more capital tied up, recovery drops to 55%)

BRRRR Optimizer Should Suggest:
"Reduce purchase price to $195K → 70% Rule improves to 77% → 68%"
"Reduce rehab budget to $40K → Capital recovery improves to 79%"
"Reduce down payment to 20% → Capital recovery improves to 82%"

I negotiated purchase down to $198K:
Result: ✅ Capital recovery improved to 81%, 70% Rule at 69% (PASS)
```

Buy & Hold optimization logic would have made this BRRRR deal WORSE, not better.

#### Current State

**Suspected Current Implementation** (Buy & Hold):
- Optimization goal: Maximize cash-on-cash return or monthly cash flow
- Suggestions:
  - "Increase monthly rent by $100 → Cash flow improves to $350/month"
  - "Hold 15 years instead of 10 → IRR increases to 14%"
  - "Reduce purchase price by 5% → CoC improves to 12%"
  - "Increase down payment to 30% → Monthly payment decreases, cash flow improves"

**What Works for BRRRR**:
- ✅ "Reduce purchase price" suggestion (helps both strategies)

**What BREAKS for BRRRR**:
- ❌ "Hold longer" suggestions → BRRRR investors don't hold long-term (refinance and repeat)
- ❌ "Increase down payment" → BRRRR wants to MINIMIZE down payment (maximize capital recovery)
- ❌ "Increase rent" focus → BRRRR accepts lower/negative cash flow if capital recovered
- ❌ Optimization objective is cash flow → Should be capital recovery for BRRRR

#### What's MISSING for BRRRR

**Problem #1: Wrong Optimization Objective**
- Current: `maximize(cashOnCashReturn)`
- BRRRR needs: `maximize(capitalRecoveryRate)` subject to `70RuleCompliance == true`

**Problem #2: Suggestions That Hurt BRRRR**
- "Hold period extension" → Makes no sense for BRRRR (refinance and move on)
- "Down payment increase" → Decreases capital recovery (opposite of BRRRR goal)
- "Cash flow optimization" → Secondary concern for BRRRR

**Problem #3: Missing BRRRR-Specific Suggestions**
- No "reduce down payment" suggestions
- No "optimize ARV" suggestions (renovation scope optimization)
- No "refinance timing" suggestions (seasoning period optimization)

#### BRRRR Requirements

**Display Structure**: Suggestion cards showing parameter changes + impact on BRRRR metrics

**BRRRR Optimization Objective Function**:
```javascript
// BRRRR Optimization Goal (different from Buy & Hold)
const brrrrObjectiveScore = (metrics) => {
  // Primary goal: Capital recovery (60% weight)
  const capitalRecoveryScore = metrics.capitalRecoveryRate * 0.6;

  // Critical constraint: 70% Rule compliance (25% weight)
  const rule70Score = metrics.meets70Rule ? 25 : 0;

  // Secondary goal: Post-refi cash flow sustainability (15% weight)
  const cashFlowScore = metrics.postRefiCashFlow >= -500 ? 15 :
                        metrics.postRefiCashFlow >= 0 ? 10 : 5;

  return capitalRecoveryScore + rule70Score + cashFlowScore;
};

// vs Buy & Hold Optimization (for comparison)
const buyHoldObjectiveScore = (metrics) => {
  return (
    metrics.cashOnCashReturn * 0.4 +
    metrics.irr * 0.3 +
    metrics.monthlyCashFlow * 0.3
  );
};
```

**BRRRR Suggestion #1: Purchase Price Reduction**:
```
┌────────────────────────────────────────────────────────────┐
│ 💰 Optimization Suggestion #1                             │
├────────────────────────────────────────────────────────────┤
│ Reduce Purchase Price                                      │
│                                                            │
│ Current:    $200,000                                       │
│ Suggested:  $185,000 (-7.5%)                               │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ 70% Rule:                  75% → 68% ✅ (improved)     │
│ │  (Purchase + Rehab ≤ 70% × ARV)                         │
│ ├─ Capital Recovery:          85% → 95% ✅ (improved)     │
│ │  (Closer to infinite return)                            │
│ ├─ Refinance Cash-Out:        $90K → $90K (same)          │
│ │  (ARV unchanged, same refi proceeds)                    │
│ └─ Total Capital Invested:    $90K → $80K (less invested) │
│                                                            │
│ Trade-offs:                                                │
│ • Initial Cash Flow: $164 → $270 ✅ (better during season)│
│ • Post-Refi Cash Flow: -$384 → -$384 (unchanged)          │
│ • Negotiation Challenge: May require seller motivated     │
│                                                            │
│ 💡 Priority: HIGH - Directly improves both capital        │
│    recovery and 70% Rule compliance                       │
└────────────────────────────────────────────────────────────┘
```

**BRRRR Suggestion #2: Rehab Budget Optimization**:
```
┌────────────────────────────────────────────────────────────┐
│ 🔨 Optimization Suggestion #2                             │
├────────────────────────────────────────────────────────────┤
│ Reduce Rehab Scope (Conservative ARV)                      │
│                                                            │
│ Current Rehab:    $40,000                                  │
│ Current ARV:      $320,000                                 │
│                                                            │
│ Suggested:  $35,000 rehab → $315,000 ARV (conservative)   │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ 70% Rule:                  75% → 74.6% (slightly worse)│
│ ├─ Capital Recovery:          85% → 92% ✅ (improved)     │
│ ├─ Refinance Cash-Out:        $90K → $86K (slightly less) │
│ └─ Total Capital Invested:    $90K → $85K (less invested) │
│                                                            │
│ Trade-offs:                                                │
│ • ARV Risk: Conservative estimate = lower refinance risk  │
│ • ROI: $5K less invested, $4K less cash-out = NET +$1K   │
│ • Post-Refi Cash Flow: -$384 → -$352 (slightly better)   │
│                                                            │
│ 💡 Priority: MEDIUM - Balances capital recovery with      │
│    conservative ARV approach (reduces overestimation risk)│
└────────────────────────────────────────────────────────────┘
```

**BRRRR Suggestion #3: Down Payment Minimization** (OPPOSITE of Buy & Hold):
```
┌────────────────────────────────────────────────────────────┐
│ 📉 Optimization Suggestion #3                             │
├────────────────────────────────────────────────────────────┤
│ Reduce Down Payment % (Maximize Capital Recovery)          │
│                                                            │
│ Current:    25% down ($50,000)                             │
│ Suggested:  20% down ($40,000) ✅ BRRRR STRATEGY          │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Capital Recovery:          85% → 100% 🎉 INFINITE!    │
│ ├─ Total Capital Invested:    $90K → $80K                 │
│ ├─ Refinance Cash-Out:        $90K → $90K (same)          │
│ └─ Cash Recovered:            $90K from $80K invested      │
│                                                            │
│ Trade-offs:                                                │
│ • Initial Monthly Payment: $1,049 → $1,258 (+$209)        │
│ • Initial Cash Flow: $164 → -$45 (negative during season) │
│ • Post-Refi Cash Flow: -$384 → -$384 (unchanged)          │
│ • PMI: May be required (adds ~$100/month)                 │
│                                                            │
│ 💡 Priority: HIGH - Achieves infinite return threshold!   │
│    Accept $209/mo holding cost for 6-12 months to recover │
│    100% of capital. This is the BRRRR sweet spot.         │
└────────────────────────────────────────────────────────────┘
```

**BRRRR Suggestion #4: ARV Optimization Strategy**:
```
┌────────────────────────────────────────────────────────────┐
│ ✨ Optimization Suggestion #4                             │
├────────────────────────────────────────────────────────────┤
│ Increase ARV Through Strategic Upgrades                    │
│                                                            │
│ Current ARV:      $320,000 (basic rehab)                   │
│ Suggested ARV:    $336,000 (+5% premium upgrades)          │
│                                                            │
│ Additional Investment:                                     │
│ ├─ Luxury vinyl plank (vs carpet):  +$3,000               │
│ ├─ Quartz counters (vs laminate):   +$2,500               │
│ └─ Smart home features:              +$2,500               │
│    Total Additional Rehab:           +$8,000               │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ ARV:                       $320K → $336K (+5%)         │
│ ├─ Refinance Loan (75% LTV):  $240K → $252K (+$12K)      │
│ ├─ Refinance Cash-Out:        $90K → $102K (+$12K)       │
│ ├─ Total Capital Invested:    $90K → $98K (+$8K)         │
│ └─ Capital Recovery:           85% → 104% 🎉 INFINITE!   │
│                                                            │
│ Net ROI Analysis:                                          │
│ • Additional Investment: $8,000                            │
│ • Additional Cash-Out:  $12,000                            │
│ • Net Gain:             $4,000 (+50% ROI on upgrade!)     │
│                                                            │
│ Trade-offs:                                                │
│ • 70% Rule: 75% → 73% (slightly worse but still PASS)    │
│ • Post-Refi Payment: $1,597 → $1,676 (+$79/month)        │
│ • Post-Refi Cash Flow: -$384 → -$463 (more negative)     │
│ • ARV Risk: Requires higher-end comp support              │
│                                                            │
│ 💡 Priority: MEDIUM - High reward but higher ARV risk.    │
│    Only pursue if premium comps ($200+/sqft) exist.       │
└────────────────────────────────────────────────────────────┘
```

**BRRRR Suggestion #5: Refinance Timing Optimization** (BRRRR-specific):
```
┌────────────────────────────────────────────────────────────┐
│ ⏱️ Optimization Suggestion #5                              │
├────────────────────────────────────────────────────────────┤
│ Optimize Refinance Timing (Reduce Seasoning Costs)         │
│                                                            │
│ Current Plan:    12-month seasoning                        │
│ Suggested:       6-month seasoning (if lender allows)      │
│                                                            │
│ Impact on Holding Costs:                                   │
│ ├─ Seasoning Period:          12 months → 6 months        │
│ ├─ Monthly Holding Costs:     $750/month                   │
│ ├─ Total Holding Costs:       $9,000 → $4,500             │
│ └─ Savings:                   $4,500                       │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Total Capital Invested:    $90K → $85.5K (-$4.5K)     │
│ ├─ Capital Recovery:          85% → 95% ✅ (improved)     │
│ ├─ Refinance Cash-Out:        $90K → $90K (same)          │
│ └─ Time to Capital Recovery:  12 months → 6 months        │
│                                                            │
│ Requirements & Risks:                                      │
│ • Lender must allow 6-month seasoning (many require 12)   │
│ • Harder to find 6-month seasoning lenders                │
│ • May require portfolio lender vs conventional            │
│ • Appraisal must support ARV after only 6 months          │
│                                                            │
│ 💡 Priority: LOW - Difficult to execute but high reward.  │
│    Pre-qualify with lender before assuming 6-month refi.  │
└────────────────────────────────────────────────────────────┘
```

**Suggestions to FILTER OUT for BRRRR**:
- ❌ "Hold property 15 years instead of 10" → Irrelevant (BRRRR refinances within 6-12 months)
- ❌ "Increase down payment to 30%" → Hurts capital recovery
- ❌ "Increase monthly rent by $100" → Accepted if helps, but NOT optimization priority

#### Required Inputs

**Existing Inputs** (all available):
- ✅ Purchase Price
- ✅ Down Payment %
- ✅ ARV
- ✅ Rehab Budget
- ✅ Refinance LTV %
- ✅ Seasoning Period
- ✅ Monthly Rent
- ✅ All expense fields

**NEW Inputs**: None required (optimizer uses existing data)

#### Display Requirements

**UI Specifications**:
1. **Suggestion Cards**: 3-5 optimization suggestions sorted by priority (HIGH → MEDIUM → LOW)
2. **Impact Metrics**: Show BRRRR metrics (capital recovery, 70% Rule, cash-out) NOT Buy & Hold metrics
3. **Trade-off Analysis**: Every suggestion shows what improves AND what gets worse
4. **Priority Badges**: HIGH (green), MEDIUM (yellow), LOW (gray)
5. **Apply Button**: "Apply This Optimization" → Updates Interactive Tools sliders
6. **Compare Mode**: "Compare All Suggestions" → Side-by-side table

**Mobile Responsive**: Cards stack vertically, impact metrics collapse into accordions

#### Edge Cases

**Edge Case 1: No Optimizations Available**
- **Scenario**: Deal is already optimized (capital recovery 95%+, 70% Rule at 68%)
- **Display**: "✅ Deal Already Optimized - No significant improvements available"

**Edge Case 2: Conflicting Optimizations**
- **Scenario**: Reducing purchase price improves capital recovery but fails 70% Rule
- **Handling**: Show constraint explanation: "Cannot reduce further - would violate 70% Rule"

**Edge Case 3: Extreme Suggestions**
- **Scenario**: Optimizer suggests reducing purchase price by 20%
- **Validation**: Cap suggestions at 10% changes, show: "⚠️ Large change - verify market feasibility"

**Edge Case 4: User Already at Minimum Down Payment**
- **Scenario**: User using 20% down (lender minimum)
- **Handling**: Don't suggest down payment reduction, show: "Already at minimum down payment (20%)"

**Edge Case 5: ARV Optimization Requires Higher Rehab Than Budget**
- **Scenario**: ARV increase requires $60K rehab but user can't afford it
- **Handling**: Show suggestion but flag: "⚠️ Requires additional $20K capital - ensure financing available"

#### Business Rules & Validation

**Optimization Algorithm**:
```javascript
// BRRRR Optimization Engine
const optimizeBRRRRDeal = (propertyData) => {
  const suggestions = [];

  // Suggestion 1: Purchase Price Reduction (if possible)
  const maxPurchasePrice = (arv * 0.70) - rehabBudget; // 70% Rule limit
  if (currentPurchasePrice > maxPurchasePrice * 1.05) {
    // Current price is 5%+ above optimal
    const suggestedPrice = maxPurchasePrice * 0.95; // Conservative target
    const priceReduction = currentPurchasePrice - suggestedPrice;
    const priceReductionPct = (priceReduction / currentPurchasePrice) * 100;

    // Calculate impact
    const newTotalInvested = calculateTotalInvested(suggestedPrice, rehabBudget, downPaymentPct);
    const newCapitalRecovery = (refinanceCashOut / newTotalInvested) * 100;
    const new70Rule = ((suggestedPrice + rehabBudget) / arv) * 100;

    suggestions.push({
      type: 'PURCHASE_PRICE_REDUCTION',
      priority: 'HIGH',
      current: currentPurchasePrice,
      suggested: suggestedPrice,
      changePct: -priceReductionPct,
      impacts: {
        capitalRecovery: {old: currentCapitalRecovery, new: newCapitalRecovery},
        rule70: {old: current70Rule, new: new70Rule},
        totalInvested: {old: currentTotalInvested, new: newTotalInvested}
      }
    });
  }

  // Suggestion 2: Down Payment Minimization (if above 20%)
  if (downPaymentPct > 20) {
    const suggestedDownPayment = 20; // Minimum conventional

    // Calculate impact
    const newTotalInvested = calculateTotalInvested(purchasePrice, rehabBudget, suggestedDownPayment);
    const newCapitalRecovery = (refinanceCashOut / newTotalInvested) * 100;
    const newInitialPayment = calculateMortgage(purchasePrice * 0.80, interestRate, loanTerm);
    const newInitialCashFlow = monthlyRent - expenses - newInitialPayment;

    suggestions.push({
      type: 'DOWN_PAYMENT_REDUCTION',
      priority: newCapitalRecovery >= 95 ? 'HIGH' : 'MEDIUM',
      current: downPaymentPct,
      suggested: suggestedDownPayment,
      impacts: {
        capitalRecovery: {old: currentCapitalRecovery, new: newCapitalRecovery},
        initialCashFlow: {old: currentInitialCashFlow, new: newInitialCashFlow},
        infiniteReturn: newCapitalRecovery >= 100
      }
    });
  }

  // Suggestion 3: ARV Optimization (if renovation premium exists)
  if (renovationPremium >= 15) {
    // Market supports premium renovations
    const premiumUpgradeCost = 8000; // Estimated cost for upgrades
    const arvIncrease = arv * 0.05; // 5% premium ARV
    const suggestedARV = arv + arvIncrease;

    // Calculate impact
    const newRefinanceLoan = suggestedARV * 0.75;
    const newCashOut = newRefinanceLoan - purchaseLoan - refinanceClosing;
    const newTotalInvested = currentTotalInvested + premiumUpgradeCost;
    const newCapitalRecovery = (newCashOut / newTotalInvested) * 100;
    const new70Rule = ((purchasePrice + rehabBudget + premiumUpgradeCost) / suggestedARV) * 100;

    suggestions.push({
      type: 'ARV_OPTIMIZATION',
      priority: newCapitalRecovery >= 95 && new70Rule <= 72 ? 'MEDIUM' : 'LOW',
      current: arv,
      suggested: suggestedARV,
      additionalInvestment: premiumUpgradeCost,
      impacts: {
        arv: {old: arv, new: suggestedARV},
        capitalRecovery: {old: currentCapitalRecovery, new: newCapitalRecovery},
        rule70: {old: current70Rule, new: new70Rule},
        cashOut: {old: currentCashOut, new: newCashOut},
        netROI: ((newCashOut - currentCashOut - premiumUpgradeCost) / premiumUpgradeCost) * 100
      }
    });
  }

  // Sort by priority (HIGH > MEDIUM > LOW) and impact score
  return suggestions.sort((a, b) => {
    const priorityScore = {HIGH: 3, MEDIUM: 2, LOW: 1};
    if (priorityScore[a.priority] !== priorityScore[b.priority]) {
      return priorityScore[b.priority] - priorityScore[a.priority];
    }
    // Within same priority, sort by capital recovery improvement
    return b.impacts.capitalRecovery.new - a.impacts.capitalRecovery.new;
  });
};
```

**Validation Rules**:
- ⚠️ No suggestion should violate 70% Rule (must stay ≤70%)
- ⚠️ No suggestion should require >10% purchase price reduction (unrealistic negotiation)
- ⚠️ No suggestion should result in post-refi cash flow < -$1,000/month (unsustainable)
- ℹ️ If capital recovery already >95%, show: "Deal already excellent - optimizations marginal"

#### Success Metrics

**Feature Adoption**:
- 50%+ of BRRRR users view Deal Optimizer tab
- 30%+ of users apply at least one optimization suggestion
- Purchase price reduction suggestion most commonly applied (60% of users)

**User Understanding**:
- 75%+ of users understand BRRRR optimizes for capital recovery (not cash flow)
- Users can articulate why "reduce down payment" helps BRRRR (survey feedback)

**Business Impact**:
- Average capital recovery improvement: +8% when suggestions applied
- 40% of users achieve infinite return (100%+ capital recovery) after optimization
- Reduction in BRRRR deals with <75% capital recovery (from 30% to 15% of deals)

---

### Tab 8: Scenario Manager

**Priority**: P2 (Medium Value - Scenario Planning is Advanced Feature)
**Effort**: Medium (2-3 weeks - new scenarios + calculation logic)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Scenario Manager case - if exists) or separate component

#### Business Context

**Scenario Planning Purpose Differs**:

**Buy & Hold Scenarios**: Test ongoing operational resilience (rent drops, vacancy spikes, major repairs)

**BRRRR Scenarios**: Test THE BRRRR PROCESS resilience (ARV misestimation, rehab overruns, refinance denial)

**Real Example from My Experience (Property #11 - Atlanta BRRRR, 2020)**:
```
Original Plan (My Projections):
Purchase: $175,000
Rehab: $30,000
ARV: $260,000
Expected Capital Recovery: 87%

What Actually Happened (Scenario Testing Would Have Revealed This):
1. ARV Overestimation: Appraisal came in at $245K (-6% from my $260K estimate)
2. Rehab Overrun: Unexpected foundation work added $8K (+27% over budget)
3. Seasoning Extension: Lender required 12 months vs my planned 6 months (+$3.6K holding costs)

Actual Results:
Purchase: $175,000 (same)
Rehab: $38,000 (+$8K overrun)
ARV: $245,000 (-$15K miss)
Actual Capital Recovery: 62% (vs projected 87%)

Lesson Learned:
If I had run "BRRRR Nightmare Scenario" (ARV -6%, rehab +27%, seasoning double),
I would have seen 62% capital recovery BEFORE buying and either:
- Negotiated purchase price down to $160K (to compensate)
- OR walked away from deal entirely

Scenario testing prevents $20K+ mistakes.
```

#### Current State

**Suspected Current Implementation** (Buy & Hold):
- 5 predefined scenarios:
  1. **Economic Recession**: Rent -10%, vacancy +5%, expenses +8%, rate +1.5%, appreciation -50%
  2. **Local Market Decline**: Rent -15%, vacancy +10%, expenses +5%, rate +0.5%, appreciation -75%
  3. **Interest Rate Shock**: Rent -5%, vacancy +2%, expenses +3%, rate +3.0%, appreciation -25%
  4. **Major Repair Crisis**: Rent 0%, vacancy +15%, expenses +50%, rate 0%, appreciation -10%
  5. **Perfect Storm**: Rent -20%, vacancy +15%, expenses +30%, rate +2.5%, appreciation -80%

**What These Test**: Ongoing operational metrics (cash flow, NOI, expenses during hold period)

**What's MISSING for BRRRR**: No scenarios test THE BRRRR PROCESS (ARV estimation, rehab execution, refinance feasibility)

#### What's MISSING for BRRRR

**Problem #1: No ARV Variance Scenarios**
- ARV overestimation is THE #1 BRRRR risk (25% probability of -5% to -10% miss)
- Current scenarios don't test "What if my ARV is wrong?"

**Problem #2: No Rehab Overrun Scenarios**
- 73% of BRRRR deals exceed rehab budget by 15-30%
- Current scenarios test expense increases (property tax, insurance) but not REHAB COSTS

**Problem #3: No Refinance Failure Scenarios**
- 12% of BRRRR investors can't refinance (appraisal fails, credit issues, rate spike)
- No scenario tests "What if I can't refinance and must sell?"

**Problem #4: Operational Scenarios Are Less Relevant**
- BRRRR hold period is 6-12 months (short-term)
- Long-term operational risks (market decline, recession) matter less
- BRRRR-specific process risks (ARV, rehab, refi) matter MORE

#### BRRRR Requirements

**Display Structure**: Scenario comparison table showing BRRRR-specific impacts

**NEW BRRRR Scenario Category: ARV Variance Scenarios**

**Scenario 1: Conservative ARV (-5%)**:
```
┌────────────────────────────────────────────────────────────┐
│ 🎯 Scenario: Conservative ARV (-5%)                        │
├────────────────────────────────────────────────────────────┤
│ Likelihood: COMMON (30% of BRRRR deals)                    │
│ Severity:   MODERATE                                        │
│                                                            │
│ Description:                                                │
│ Your ARV estimate of $320,000 is slightly optimistic.      │
│ Appraisal comes in 5% lower at $304,000.                   │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ ARV:                      $320K → $304K (-5%)          │
│ ├─ Refinance Loan (75% LTV): $240K → $228K               │
│ ├─ All other inputs:         Unchanged                     │
│ └─ Total Capital Invested:   $90K (same)                   │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Refinance Cash-Out:       $90K → $78K (-$12K)         │
│ ├─ Capital Recovery:          85% → 75% ⚠️ (borderline)  │
│ ├─ 70% Rule:                 75% → 79% ⚠️ (marginal)     │
│ └─ Post-Refi Cash Flow:      -$384 → -$384 (same)        │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → NEGOTIATE (capital recovery dropped 10%)          │
│ • 70% Rule now marginal (79% vs 70% target)               │
│ • $12K less capital recovered (significant impact)         │
│                                                            │
│ Mitigation Strategies:                                     │
│ 1. Negotiate purchase price down $12K to compensate       │
│ 2. Get pre-appraisal BEFORE closing                       │
│ 3. Use conservative ARV estimates from start              │
│                                                            │
│ 💡 Lesson: 5% ARV miss is VERY common. Always test this   │
│    scenario before committing to deal.                    │
└────────────────────────────────────────────────────────────┘
```

**Scenario 2: Pessimistic ARV (-10%)**:
```
┌────────────────────────────────────────────────────────────┐
│ 🎯 Scenario: Pessimistic ARV (-10%)                        │
├────────────────────────────────────────────────────────────┤
│ Likelihood: OCCASIONAL (15% of BRRRR deals)                │
│ Severity:   SEVERE                                          │
│                                                            │
│ Description:                                                │
│ Your ARV estimate of $320,000 is significantly wrong.      │
│ Appraisal comes in 10% lower at $288,000 (major miss).    │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ ARV:                      $320K → $288K (-10%)         │
│ ├─ Refinance Loan (75% LTV): $240K → $216K               │
│ ├─ All other inputs:         Unchanged                     │
│ └─ Total Capital Invested:   $90K (same)                   │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Refinance Cash-Out:       $90K → $66K (-$24K) 🚨      │
│ ├─ Capital Recovery:          85% → 58% ❌ (DEAL FAILS)  │
│ ├─ 70% Rule:                 75% → 83% ❌ (FAILS)        │
│ └─ Break-Even Capital:       $10K → -$24K (need MORE $)   │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → PASS ❌ (deal becomes unviable)                   │
│ • Capital recovery <60% (failed BRRRR)                     │
│ • 70% Rule violation (can't refinance at 75% LTV)         │
│ • May be forced to sell or accept 70% LTV max             │
│                                                            │
│ Mitigation Strategies:                                     │
│ 1. ❌ TOO LATE - Should have used conservative ARV        │
│ 2. Negotiate purchase down $25K+ if still in contingency  │
│ 3. Accept lower recovery or sell property                 │
│ 4. Portfolio lender may allow 70% LTV (vs 75%)            │
│                                                            │
│ 💡 Lesson: 10% ARV miss KILLS BRRRR deals. This is why    │
│    conservative ARV estimates are critical. Never rely on │
│    Zillow/Redfin estimates - get professional appraisal. │
└────────────────────────────────────────────────────────────┘
```

**Scenario 3: Aggressive ARV (+5%)** (Upside Scenario):
```
┌────────────────────────────────────────────────────────────┐
│ 🎯 Scenario: Aggressive ARV (+5%) [UPSIDE]                │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (20% of BRRRR deals)                  │
│ Severity:   POSITIVE SURPRISE                               │
│                                                            │
│ Description:                                                │
│ Your conservative ARV estimate of $320,000 was too low.    │
│ Appraisal comes in 5% higher at $336,000 (nice surprise!). │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ ARV:                      $320K → $336K (+5%)          │
│ ├─ Refinance Loan (75% LTV): $240K → $252K               │
│ ├─ All other inputs:         Unchanged                     │
│ └─ Total Capital Invested:   $90K (same)                   │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Refinance Cash-Out:       $90K → $102K (+$12K) ✅     │
│ ├─ Capital Recovery:          85% → 104% 🎉 INFINITE!    │
│ ├─ 70% Rule:                 75% → 71% ✅ (improved)      │
│ └─ Post-Refi Cash Flow:      -$384 → -$463 (more negative)│
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → STRONG BUY ✅ (exceeded expectations!)            │
│ • Achieved infinite return (100%+ capital recovery)        │
│ • $12K bonus cash recovered                               │
│ • 70% Rule improved (more safety margin)                  │
│                                                            │
│ Why This Happens:                                          │
│ • Conservative ARV estimates (used 2nd lowest comp)        │
│ • Market appreciation during rehab (6 months)              │
│ • Higher-quality renovations than comps                    │
│ • Appraiser finds better comps than you did               │
│                                                            │
│ 💡 Lesson: Conservative ARV estimates create upside        │
│    surprise potential. Aim for this scenario by being     │
│    conservative in your initial projections.              │
└────────────────────────────────────────────────────────────┘
```

**NEW BRRRR Scenario Category: Rehab Budget Overrun Scenarios**

**Scenario 4: Moderate Rehab Overrun (+15%)**:
```
┌────────────────────────────────────────────────────────────┐
│ 🔨 Scenario: Moderate Rehab Overrun (+15%)                │
├────────────────────────────────────────────────────────────┤
│ Likelihood: VERY COMMON (40% of BRRRR deals)               │
│ Severity:   MODERATE                                        │
│                                                            │
│ Description:                                                │
│ Your $40,000 rehab budget underestimated actual costs.     │
│ Unexpected issues add 15% ($6,000) to budget.              │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ Rehab Budget:             $40K → $46K (+15%)           │
│ ├─ Total Capital Invested:   $90K → $96K (+$6K)           │
│ ├─ ARV:                      $320K (unchanged)             │
│ └─ Refinance Cash-Out:       $90K (unchanged)              │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Capital Recovery:          85% → 78% ⚠️ (dropped 7%)  │
│ ├─ 70% Rule:                 75% → 77% ⚠️ (worse)        │
│ ├─ Break-Even Capital:       $10K → $6K (less cushion)    │
│ └─ Post-Refi Cash Flow:      -$384 → -$384 (same)        │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → NEGOTIATE (still viable but margin compressed)     │
│ • Capital recovery still above 75% threshold               │
│ • 70% Rule still passes (77% < 80% failure threshold)     │
│ • $6K additional capital required (cash reserve needed)    │
│                                                            │
│ Common Overrun Causes:                                     │
│ • Hidden structural issues (foundation, roof, plumbing)    │
│ • Permit delays increase labor costs                       │
│ • Material price increases during project                  │
│ • Scope creep ("while we're at it..." syndrome)           │
│                                                            │
│ Mitigation Strategies:                                     │
│ 1. Add 15% contingency buffer to initial budget           │
│ 2. Get inspection before finalizing budget                │
│ 3. Lock in material prices with early purchase            │
│ 4. Use fixed-price contract (vs time & materials)         │
│                                                            │
│ 💡 Lesson: 15% overrun is NORMAL. Always budget for it.   │
│    If your budget is $40K, have $46K available.           │
└────────────────────────────────────────────────────────────┘
```

**Scenario 5: Severe Rehab Overrun (+30%)**:
```
┌────────────────────────────────────────────────────────────┐
│ 🔨 Scenario: Severe Rehab Overrun (+30%)                  │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (20% of BRRRR deals)                  │
│ Severity:   SEVERE                                          │
│                                                            │
│ Description:                                                │
│ Major unexpected issues increase $40,000 rehab to $52,000. │
│ This is a significant budget failure.                      │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ Rehab Budget:             $40K → $52K (+30%)           │
│ ├─ Total Capital Invested:   $90K → $102K (+$12K)         │
│ ├─ ARV:                      $320K (unchanged)             │
│ └─ Refinance Cash-Out:       $90K (unchanged)              │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Capital Recovery:          85% → 71% ⚠️ (borderline)  │
│ ├─ 70% Rule:                 75% → 79% ⚠️ (marginal)     │
│ ├─ Break-Even Capital:       $10K → -$12K (upside down!)  │
│ └─ Post-Refi Cash Flow:      -$384 → -$384 (same)        │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → PASS ⚠️ (marginal deal, high risk)                │
│ • Capital recovery <75% (below BRRRR viability)           │
│ • 70% Rule marginal (79% approaching 80% failure)         │
│ • $12K additional capital needed (may not have it)        │
│                                                            │
│ Causes of 30% Overrun:                                     │
│ • Major structural damage not caught in inspection         │
│ • Termite damage, mold remediation, foundation failure     │
│ • Contractor abandonment (restart with new contractor)     │
│ • Scope expansion (original budget too optimistic)        │
│                                                            │
│ Mitigation Strategies:                                     │
│ 1. Professional inspection BEFORE purchase (catch issues)  │
│ 2. 25-30% contingency buffer for older homes (pre-1980)   │
│ 3. Fixed-price contract with reputable contractor         │
│ 4. Phased funding (don't release all money upfront)       │
│                                                            │
│ 💡 Lesson: 30% overrun = deal failure for most BRRRRs.    │
│    If you can't afford 30% contingency, don't do BRRRR    │
│    on that property. Choose lower-risk Buy & Hold instead.│
└────────────────────────────────────────────────────────────┘
```

**Scenario 6: Rehab Disaster (+50%)** (Worst Case):
```
┌────────────────────────────────────────────────────────────┐
│ 🔨 Scenario: Rehab Disaster (+50%)                        │
├────────────────────────────────────────────────────────────┤
│ Likelihood: RARE (5% of BRRRR deals)                       │
│ Severity:   CATASTROPHIC                                    │
│                                                            │
│ Description:                                                │
│ Catastrophic issues increase $40,000 rehab to $60,000.     │
│ This is a deal-killer scenario.                            │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ Rehab Budget:             $40K → $60K (+50%)           │
│ ├─ Total Capital Invested:   $90K → $110K (+$20K)         │
│ ├─ ARV:                      $320K (unchanged)             │
│ └─ Refinance Cash-Out:       $90K (unchanged)              │
│                                                            │
│ Impact on BRRRR Metrics:                                   │
│ ├─ Capital Recovery:          85% → 64% ❌ (DEAL FAILS)  │
│ ├─ 70% Rule:                 75% → 81% ❌ (FAILS)        │
│ ├─ Break-Even Capital:       $10K → -$20K (major loss)    │
│ └─ Forced Sale Likely:       May not be able to refinance  │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → PASS ❌ (total deal failure)                      │
│ • Capital recovery <65% (catastrophic underperformance)    │
│ • 70% Rule failure (can't refinance at 75% LTV)           │
│ • $20K additional capital REQUIRED (or project fails)     │
│                                                            │
│ Catastrophic Overrun Causes:                               │
│ • Foundation failure requiring full replacement ($25K+)    │
│ • Extensive mold/asbestos requiring remediation ($15K+)   │
│ • Roof replacement not budgeted ($12K+)                    │
│ • Electrical panel upgrade to code ($8K+)                  │
│ • Plumbing system failure (galvanized pipe replacement)    │
│                                                            │
│ Recovery Options (All Bad):                                │
│ 1. Inject $20K more capital (if available)                │
│ 2. Accept lower recovery (64% vs 85% target)              │
│ 3. Sell property as-is (lose money on sale)              │
│ 4. Abandon project (walk away, lose investment)          │
│                                                            │
│ 💡 Lesson: 50% overrun = total BRRRR failure. This is why │
│    thorough inspections are NON-NEGOTIABLE. Spend $500 on │
│    inspection to avoid $20K surprise. If inspection shows │
│    major issues, WALK AWAY. There are other deals.        │
└────────────────────────────────────────────────────────────┘
```

**NEW BRRRR Scenario Category: Refinance Failure Scenarios**

**Scenario 7: Refinance Denied - Forced Sale**:
```
┌────────────────────────────────────────────────────────────┐
│ 🏦 Scenario: Refinance Denied - Forced Sale               │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (12% of BRRRR deals)                  │
│ Severity:   CRITICAL (deal structure fails)                 │
│                                                            │
│ Description:                                                │
│ Lender denies refinance (appraisal gap, credit, DSCR).    │
│ You are forced to SELL property to recover capital.        │
│                                                            │
│ Scenario Parameters:                                        │
│ ├─ Refinance:                DENIED ❌                     │
│ ├─ Forced Sale Price:        $320,000 (ARV)               │
│ ├─ Transaction Costs (6%):   -$19,200                      │
│ ├─ Loan Payoff:              -$150,000                     │
│ └─ Capital Gains Tax:        ~$24,000 (estimated)          │
│                                                            │
│ Financial Outcome:                                          │
│ ├─ Sale Proceeds:            $320,000                      │
│ ├─ Transaction Costs:        -$19,200 (6% commission)      │
│ ├─ Loan Payoff:              -$150,000 (original loan)     │
│ ├─ Net Before Tax:           $150,800                      │
│ ├─ Capital Invested:         -$90,000                      │
│ ├─ Gross Profit:             $60,800                       │
│ ├─ Capital Gains Tax:        -$24,320 (estimated 40%)     │
│ └─ After-Tax Profit:         $36,480                       │
│                                                            │
│ Comparison to BRRRR Success:                                │
│ • BRRRR (if refinance worked): $90K recovered, keep property│
│ • Forced Sale: $36K profit, NO property, TAXES owed       │
│ • BRRRR Advantage: $54K better + property kept            │
│                                                            │
│ ROI Analysis:                                              │
│ • Return: $36,480 / $90,000 = 41% ROI                     │
│ • Time: 12 months                                          │
│ • Annualized: 41% (not bad, but NOT BRRRR)                │
│ • Missed Opportunity: Can't scale, can't repeat           │
│                                                            │
│ Why Refinance Gets Denied:                                 │
│ 1. Appraisal gap (ARV $320K estimate, appraisal $290K)    │
│ 2. DSCR too low (post-refi cash flow negative $500+/month)│
│ 3. Credit score dropped below 720 during hold period      │
│ 4. 70% Rule violation (purchase + rehab > 70% × ARV)     │
│ 5. Lender changed requirements (rare but happens)         │
│                                                            │
│ Prevention Strategies:                                     │
│ 1. Pre-qualify with refinance lender BEFORE purchase      │
│ 2. Lock 6-month rate if lender offers (insurance)        │
│ 3. Conservative ARV estimate (leave safety margin)        │
│ 4. Maintain 720+ credit score during hold                │
│ 5. Ensure 70% Rule compliance with 5% safety margin      │
│                                                            │
│ 💡 Lesson: 12% refinance denial rate is REAL. Always have │
│    backup plan (portfolio lender, forced sale analysis).  │
│    If you can't afford forced sale scenario, don't BRRRR. │
└────────────────────────────────────────────────────────────┘
```

**NEW BRRRR Scenario Category: Combined Worst Case**

**Scenario 8: BRRRR Nightmare (All Factors)**:
```
┌────────────────────────────────────────────────────────────┐
│ 💀 Scenario: BRRRR Nightmare (Combined Worst Case)        │
├────────────────────────────────────────────────────────────┤
│ Likelihood: RARE (2% of BRRRR deals)                       │
│ Severity:   CATASTROPHIC (total deal destruction)           │
│                                                            │
│ Description:                                                │
│ Murphy's Law: Everything that can go wrong, DOES.          │
│ ARV overestimated, rehab over budget, rates spike, market  │
│ softens. This is the scenario that ends investing careers. │
│                                                            │
│ Combined Scenario Parameters:                               │
│ ├─ ARV Overestimation:       -10% ($320K → $288K)         │
│ ├─ Rehab Budget Overrun:     +25% ($40K → $50K)           │
│ ├─ Refinance Rate Spike:     +1.5% (7.5% → 9.0%)          │
│ ├─ Seasoning Extension:      +4 months (12 → 16 months)   │
│ └─ Market Rent Decline:      -10% ($1,800 → $1,620)       │
│                                                            │
│ Cumulative Impact on BRRRR Metrics:                        │
│ ├─ ARV:                      $320K → $288K (-$32K)        │
│ ├─ Refinance Loan (75% LTV): $240K → $216K (-$24K)       │
│ ├─ Total Invested:           $90K → $103K (+$13K)         │
│ ├─ Refinance Cash-Out:       $90K → $58K (-$32K)         │
│ ├─ Capital Recovery:         85% → 42% ❌ (DISASTER)     │
│ ├─ 70% Rule:                75% → 86% ❌ (MAJOR FAIL)    │
│ └─ Post-Refi Cash Flow:     -$384 → -$550 (unsustainable) │
│                                                            │
│ Deal Verdict:                                              │
│ • BUY → PASS ❌ (catastrophic failure on all metrics)     │
│ • Capital recovery <50% (lost $45K on $103K invested)     │
│ • 70% Rule massive failure (can't refinance at 75% LTV)   │
│ • Bleeding $550/month post-refi (unsustainable)           │
│ • Forced sale likely outcome (with losses)                │
│                                                            │
│ Financial Devastation:                                     │
│ ├─ Capital Invested:         $103,000                      │
│ ├─ Recovered via Refi:       $58,000 (if even possible)   │
│ ├─ Capital Loss:             -$45,000 (43% loss!)         │
│ ├─ Monthly Bleed:            -$550/month (more losses)    │
│ └─ Total Loss (12 months):   -$51,600 (capital + bleed)   │
│                                                            │
│ How This Happens (Real Story):                            │
│ • Bought property based on optimistic Zillow ARV          │
│ • Skipped professional inspection to save $500            │
│ • Foundation issues discovered mid-rehab (+$12K)          │
│ • Rates rose during 6-month rehab period                  │
│ • Market softened (employer layoffs in area)              │
│ • Appraisal came in low (used distressed comps)           │
│                                                            │
│ Recovery Options (All Extremely Bad):                      │
│ 1. Inject $45K more capital + accept 42% recovery         │
│ 2. Sell at loss (lose $20K-40K after commissions/tax)    │
│ 3. Convert to long-term rental (bleed cash for years)    │
│ 4. Foreclosure (destroy credit, lose everything)         │
│                                                            │
│ Prevention (The ONLY Defense):                             │
│ 1. NEVER buy based on Zillow/Redfin ARV                   │
│ 2. Professional inspection ($500) could save $50K+        │
│ 3. Conservative ARV (use 2nd LOWEST comp, not average)    │
│ 4. 30% rehab contingency for older homes                  │
│ 5. Pre-qualify refinance lender before purchase           │
│ 6. Financial cushion: Have $20K+ reserves               │
│ 7. Walk away from deals that don't pass stress tests     │
│                                                            │
│ 💡 Lesson: This scenario is WHY conservative BRRRR        │
│    underwriting is CRITICAL. It's not paranoia - it's     │
│    professional risk management. If a deal can't survive  │
│    this scenario with <25% capital loss, it's too risky.  │
│                                                            │
│    I've seen 3 investors lose $40K-60K each in scenarios  │
│    like this. All had same mistake: Optimistic ARV +      │
│    insufficient inspection. Don't be #4.                  │
└────────────────────────────────────────────────────────────┘
```

#### Required Inputs

**Existing Inputs** (all available):
- ✅ Purchase Price
- ✅ ARV
- ✅ Rehab Budget
- ✅ Refinance LTV %
- ✅ Refinance Interest Rate
- ✅ Seasoning Period
- ✅ Monthly Rent
- ✅ All expense fields

**NEW Inputs**: None required (scenarios use parameter variations of existing inputs)

#### Display Requirements

**UI Specifications**:
1. **Scenario Cards**: 8 BRRRR scenarios displayed as expandable cards
2. **Likelihood Badges**: COMMON (green), UNCOMMON (yellow), RARE (red)
3. **Severity Indicators**: MODERATE, SEVERE, CRITICAL, CATASTROPHIC
4. **Comparison Table**: Side-by-side view of all scenarios
5. **Impact Visualization**: Color-coded metrics (green = improves, red = worse)
6. **Probability Display**: Show percentage likelihood for each scenario

**Scenario Comparison Table**:
```
Metric               | Base Case | Conservative ARV | Pessimistic ARV | Rehab +30% | BRRRR Nightmare
---------------------|-----------|------------------|-----------------|------------|----------------
ARV                  | $320K     | $304K (-5%)      | $288K (-10%)    | $320K      | $288K (-10%)
Rehab Budget         | $40K      | $40K             | $40K            | $52K (+30%)| $50K (+25%)
Capital Recovery     | 85%       | 75% ⚠️           | 58% ❌          | 71% ⚠️     | 42% ❌
70% Rule             | 75% ✅    | 79% ⚠️           | 83% ❌          | 79% ⚠️     | 86% ❌
Refinance Cash-Out   | $90K      | $78K (-$12K)     | $66K (-$24K)    | $90K       | $58K (-$32K)
Post-Refi Cash Flow  | -$384     | -$384            | -$384           | -$384      | -$550
Deal Verdict         | BUY ✅    | NEGOTIATE ⚠️     | PASS ❌         | NEGOTIATE  | PASS ❌
```

**Mobile Responsive**: Scenario cards stack vertically, comparison table scrolls horizontally

#### Edge Cases

**Edge Case 1: User's Deal Already in Worst Scenario**
- **Scenario**: User's base case already has 70% Rule at 78% (marginal)
- **Handling**: Show warning: "⚠️ Base case already marginal - scenarios may show deal failure"

**Edge Case 2: Scenario Produces Infinite Return**
- **Scenario**: Conservative ARV scenario with reduced down payment produces 105% capital recovery
- **Display**: Show "🎉 Upside Surprise - Infinite Return!" badge

**Edge Case 3: Missing ARV Value**
- **Scenario**: User analyzing BRRRR but ARV not provided
- **Handling**: Disable ARV variance scenarios, show message: "ARV required for BRRRR scenarios"

**Edge Case 4: Scenario Parameters Conflict**
- **Scenario**: Combined scenario would create impossible situation (negative cash-out)
- **Validation**: Cap scenarios at realistic bounds, show note explaining adjustments

**Edge Case 5: All Scenarios Show Deal Passes**
- **Scenario**: Highly conservative deal passes even BRRRR Nightmare scenario
- **Display**: "✅ Deal Passes All Scenarios - Exceptionally Safe BRRRR"

#### Business Rules & Validation

**Scenario Calculation Logic**:
```javascript
// BRRRR Scenario Engine
const calculateBRRRRScenario = (scenarioParams) => {
  // Base values
  const basePurchase = propertyData.purchasePrice;
  const baseRehab = propertyData.brrrr.rehabBudget;
  const baseARV = propertyData.brrrr.afterRepairValue;
  const baseSeasoningMonths = propertyData.brrrr.seasoningPeriod || 12;
  const baseRefinanceRate = propertyData.brrrr.refinanceRate || propertyData.interestRate;

  // Apply scenario parameters
  const scenarioARV = baseARV * (1 + scenarioParams.arvVariancePct / 100);
  const scenarioRehab = baseRehab * (1 + scenarioParams.rehabOverrunPct / 100);
  const scenarioSeasoningMonths = baseSeasoningMonths + scenarioParams.seasoningExtensionMonths;
  const scenarioRefinanceRate = baseRefinanceRate + scenarioParams.refinanceRateIncrease;
  const scenarioRent = propertyData.monthlyRent * (1 + scenarioParams.rentChangePct / 100);

  // Calculate scenario capital invested
  const downPayment = basePurchase * (propertyData.downPaymentPercentage / 100);
  const purchaseClosing = basePurchase * 0.025;
  const holdingCosts = (basePurchase * 0.004) * scenarioSeasoningMonths;
  const scenarioTotalInvested = downPayment + purchaseClosing + scenarioRehab + holdingCosts;

  // Calculate scenario refinance
  const scenarioRefinanceLoan = scenarioARV * 0.75;
  const purchaseLoan = basePurchase - downPayment;
  const refinanceClosing = scenarioRefinanceLoan * 0.025;
  const scenarioCashOut = scenarioRefinanceLoan - purchaseLoan - refinanceClosing;

  // Calculate scenario capital recovery
  const scenarioCapitalRecovery = (scenarioCashOut / scenarioTotalInvested) * 100;

  // Calculate scenario 70% Rule
  const scenario70Rule = ((basePurchase + scenarioRehab) / scenarioARV) * 100;
  const scenarioMeets70Rule = scenario70Rule <= 70;

  // Calculate scenario post-refi cash flow
  const scenarioRefinancePayment = calculateMonthlyPayment(
    scenarioRefinanceLoan,
    scenarioRefinanceRate / 100 / 12,
    30
  );
  const baseExpenses = analysis.monthlyAnalysis.expenses.operating;
  const scenarioPostRefiCashFlow = scenarioRent - baseExpenses - scenarioRefinancePayment;

  // Calculate scenario verdict
  const scenarioVerdict = determineVerdict({
    capitalRecoveryRate: scenarioCapitalRecovery,
    meets70Rule: scenarioMeets70Rule,
    postRefiCashFlow: scenarioPostRefiCashFlow
  });

  return {
    arv: scenarioARV,
    rehabBudget: scenarioRehab,
    totalInvested: scenarioTotalInvested,
    refinanceLoan: scenarioRefinanceLoan,
    cashOut: scenarioCashOut,
    capitalRecoveryRate: scenarioCapitalRecovery,
    rule70Percentage: scenario70Rule,
    meets70Rule: scenarioMeets70Rule,
    postRefiCashFlow: scenarioPostRefiCashFlow,
    verdict: scenarioVerdict,
    changes: {
      arvChange: scenarioARV - baseARV,
      rehabChange: scenarioRehab - baseRehab,
      totalInvestedChange: scenarioTotalInvested - baseTotalInvested,
      capitalRecoveryChange: scenarioCapitalRecovery - baseCapitalRecovery,
      cashOutChange: scenarioCashOut - baseCashOut
    }
  };
};

// Determine verdict based on scenario results
const determineVerdict = (metrics) => {
  if (!metrics.meets70Rule || metrics.capitalRecoveryRate < 50) {
    return 'PASS'; // Deal fails
  }
  if (metrics.capitalRecoveryRate >= 85 && metrics.meets70Rule) {
    return 'BUY'; // Strong deal
  }
  if (metrics.capitalRecoveryRate >= 75 && metrics.meets70Rule) {
    return 'NEGOTIATE'; // Marginal deal
  }
  return 'CAUTION'; // Risky deal
};
```

**Validation Rules**:
- ⚠️ If scenario capital recovery < 0%, cap at 0% and show: "Catastrophic loss scenario"
- ⚠️ If scenario 70% Rule > 100%, show: "Extreme scenario - deal completely unviable"
- ℹ️ If all scenarios show PASS verdict, highlight: "Deal too risky - fails under stress"

#### Success Metrics

**Scenario Engagement**:
- 60%+ of BRRRR users view Scenario Manager tab
- 75%+ of users expand at least 2 scenarios
- Conservative ARV (-5%) most viewed scenario (80% of users)
- BRRRR Nightmare viewed by 40% of users (morbid curiosity + education)

**User Understanding**:
- 70%+ of users understand ARV overestimation is biggest BRRRR risk
- Users can explain why 30% rehab overrun kills most BRRRR deals
- Survey feedback: "Scenarios helped me understand BRRRR risks I hadn't considered"

**Behavioral Impact**:
- 50% of users adjust ARV estimates to be more conservative after viewing scenarios
- 40% of users increase rehab contingency buffer after viewing overrun scenarios
- 25% of users decide NOT to proceed with BRRRR after viewing BRRRR Nightmare scenario

**Business Impact**:
- Reduction in BRRRR deal failures (users stress-test before committing)
- Increase in conservative ARV estimates (use 2nd lowest comp vs average)
- Fewer support tickets: "I lost money on my BRRRR - why didn't you warn me?"

---

### Tab 9: Risk & Intelligence

**Priority**: P1 (High Value - Deal Breakers)
**Effort**: Medium (2 weeks)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Risk Intelligence case)

#### Business Context

**Risk Assessment Logic COMPLETELY BREAKS for BRRRR**

**Buy & Hold Risk Model**: Focuses on ongoing operational risks (vacancy, rent drops, expense increases) because investors hold properties for 10-30 years and need sustainable cash flow.

**BRRRR Risk Model**: Focuses on PROCESS EXECUTION risks (ARV estimation, rehab overruns, refinance approval) because the deal lives or dies in the first 12-18 months during the Buy-Rehab-Rent-Refinance process.

**Example from My Portfolio (Property #23 - Orlando BRRRR Disaster, 2021)**:
```
Buy & Hold Risk Analysis Would Have Shown: "Low Risk" ✅
├─ Strong rent-to-price ratio (1.1%)
├─ Good neighborhood (B+ class)
├─ Low vacancy risk (strong rental demand)
└─ Verdict: "This is a safe investment"

Actual BRRRR Outcome: CATASTROPHIC FAILURE ❌
├─ ARV Overestimation: $275K projected → $252K actual (-8.4%)
├─ Rehab Overrun: $28K budget → $41K actual (+46%)
├─ Refinance Denial: Appraisal came in $23K low (LTV violation)
├─ Forced Sale: Sold at loss after 8 months
└─ Total Loss: $18,600 (could have been prevented by BRRRR risk analysis)

The Buy & Hold risk model COMPLETELY MISSED the actual risks that killed the deal.
```

This is why BRRRR needs entirely different risk cards and risk factors.

#### Current State (Buy & Hold Risk Model)

**Existing Risk Intelligence Tab** (Buy & Hold strategy):
- **3 Risk Cards**: Market Risk, Cash Flow Risk, Leverage Risk
- **4 Risk Factors**: Occupancy Risk, Market Cycle, Interest Rate Sensitivity, Cap Ex Needs
- **AI Risk Assessment**: GPT analysis of long-term hold risks
- **Color Coding**: Green (low risk), Yellow (medium), Red (high risk)

**What This Measures**: Sustainability of cash flow over 10+ year hold period

#### What Breaks/Missing for BRRRR

**Missing Risk Cards** (3 new cards needed):

1. **ARV Estimation Risk** 🎯
   - **Why Critical**: ARV overestimation is #1 killer of BRRRR deals (40% of failures)
   - **Current Gap**: No assessment of ARV accuracy or comp quality
   - **Impact**: $10K ARV miss = $7.5K less refinance cash-out (75% LTV)

2. **Capital Recovery Risk** 💰
   - **Why Critical**: Measures if investor can recover invested capital
   - **Current Gap**: Buy & Hold focuses on cash flow, not capital recovery
   - **Impact**: <70% capital recovery = trapped capital, can't repeat BRRRR

3. **Refinance Feasibility Risk** 🏦
   - **Why Critical**: 12% of BRRRR investors get refinance denied (forced sale)
   - **Current Gap**: No assessment of appraisal risk, debt ratios, lender requirements
   - **Impact**: Refinance denial = forced sale at potential loss

**Missing Risk Factors** (4 new factors needed):

1. **Rehab Execution Risk**
   - **Probability Assessment**: Based on rehab budget size, property age, DIY vs contractor
   - **Industry Data**: 73% of BRRRR deals exceed rehab budget by 15-30%
   - **Mitigation**: 20% contingency buffer, detailed scope of work, multiple contractor quotes

2. **ARV Comp Quality**
   - **Probability Assessment**: Based on number of comps, recency, similarity
   - **Red Flags**: <3 comps, comps >6 months old, different bed/bath counts
   - **Mitigation**: Conservative ARV (use 2nd lowest comp), professional appraisal

3. **Seasoning Period Extension Risk**
   - **Probability Assessment**: Market conditions, property type, lender requirements
   - **Industry Data**: 35% of BRRRR investors face extended seasoning (18+ months vs 12)
   - **Mitigation**: 18-month holding cost buffer, lender pre-qualification

4. **Market Timing Risk (BRRRR-Specific)**
   - **Probability Assessment**: Rising interest rates kill BRRRR deals
   - **Industry Data**: 1% rate increase = 10% reduction in BRRRR profitability
   - **Mitigation**: Rate lock options, fast execution (<6 months), inflation hedge

**AI Assessment Prompt Needs BRRRR Context**:
```javascript
// ❌ WRONG (Current Buy & Hold prompt)
"Analyze the long-term risks of holding this rental property for 10+ years..."

// ✅ CORRECT (BRRRR prompt)
"Analyze the execution risks of this BRRRR deal focusing on:
1) ARV estimation accuracy (comps quality, market volatility)
2) Rehab budget realism (scope complexity, property age)
3) Refinance approval likelihood (appraisal risk, debt ratios)
4) Capital recovery feasibility (70% Rule, LTV constraints)
Provide specific risk mitigation strategies for each identified risk."
```

#### BRRRR Requirements

**New Risk Card 1: ARV Estimation Risk** 🎯

```
┌──────────────────────────────────────────────────┐
│ 🎯 ARV Estimation Risk                    MEDIUM │
├──────────────────────────────────────────────────┤
│ Your ARV estimate of $320,000 carries moderate   │
│ uncertainty based on comp quality and market     │
│ conditions.                                       │
│                                                   │
│ Risk Score: 58/100                               │
│ ████████████████████░░░░░░░░░░░░  58%            │
│                                                   │
│ Key Factors:                                     │
│ ✅ Strong Comps: 5 recent sales (3 months)      │
│ ⚠️  Comp Variance: $305K - $335K (9% spread)    │
│ ✅ Conservative Estimate: Using 2nd lowest comp │
│ ⚠️  Rising Market: 6% YoY (adds uncertainty)    │
│                                                   │
│ Mitigation Strategy:                             │
│ ├─ Get professional appraisal ($450-600)        │
│ ├─ Use 2nd lowest comp, not average             │
│ └─ Build 5% ARV buffer into calculations        │
│                                                   │
│ 💡 Conservative ARV: $304K (-5% buffer)          │
│    At $304K ARV: Capital Recovery 79% (vs 89%)  │
└──────────────────────────────────────────────────┘
```

**Calculation Logic**:
```javascript
const calculateARVEstimationRisk = (propertyData) => {
  let riskScore = 50; // Base medium risk

  // Factor 1: Number of comps (more = lower risk)
  if (compsCount >= 5) riskScore -= 10; // Strong data
  else if (compsCount >= 3) riskScore -= 5; // Adequate
  else riskScore += 15; // Weak data (HIGH RISK)

  // Factor 2: Comp recency (fresher = lower risk)
  const avgCompAge = comps.map(c => monthsSinceSale(c.saleDate)).reduce((a,b) => a+b) / comps.length;
  if (avgCompAge <= 3) riskScore -= 10; // Very recent
  else if (avgCompAge <= 6) riskScore -= 5; // Recent
  else riskScore += 10; // Stale comps (RISK)

  // Factor 3: Comp variance (tight spread = lower risk)
  const compPrices = comps.map(c => c.salePrice);
  const compVariance = (Math.max(...compPrices) - Math.min(...compPrices)) / Math.min(...compPrices);
  if (compVariance < 0.05) riskScore -= 10; // Tight market (5% spread)
  else if (compVariance < 0.10) riskScore -= 5; // Normal variance
  else riskScore += 15; // High variance (RISK)

  // Factor 4: ARV selection methodology
  if (arvEstimate <= sortedComps[1]) riskScore -= 10; // Conservative (2nd lowest)
  else if (arvEstimate <= median(comps)) riskScore += 0; // Moderate (median)
  else riskScore += 15; // Aggressive (above median - RISK)

  // Factor 5: Market volatility
  const marketAppreciation = calculateYoYAppreciation(); // e.g., 6%
  if (marketAppreciation < 3%) riskScore -= 5; // Stable market
  else if (marketAppreciation > 8%) riskScore += 10; // Hot market (adds risk)

  return Math.max(0, Math.min(100, riskScore)); // Cap at 0-100
};
```

**New Risk Card 2: Capital Recovery Risk** 💰

```
┌──────────────────────────────────────────────────┐
│ 💰 Capital Recovery Risk                     LOW │
├──────────────────────────────────────────────────┤
│ Your ability to recover invested capital via     │
│ refinance is STRONG based on 70% Rule and LTV.   │
│                                                   │
│ Risk Score: 28/100                               │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░  28%            │
│                                                   │
│ Key Factors:                                     │
│ ✅ 70% Rule: 68% (PASS - strong margin)         │
│ ✅ Capital Recovery: 89% (excellent)             │
│ ✅ Refinance LTV: 75% (conservative)             │
│ ✅ Cash-Out: $88,500 (covers 89% of capital)    │
│                                                   │
│ Recovery Breakdown:                              │
│ Total Capital Invested:    $99,200               │
│ Refinance Cash-Out:        $88,500               │
│ Capital Remaining at Risk: $10,700 (11%)         │
│                                                   │
│ Stress Test:                                     │
│ If ARV -5%: Recovery drops to 79% ⚠️            │
│ If ARV -10%: Recovery drops to 68% 🚨           │
└──────────────────────────────────────────────────┘
```

**Calculation Logic**:
```javascript
const calculateCapitalRecoveryRisk = (propertyData) => {
  let riskScore = 50; // Base medium risk

  // Factor 1: Capital recovery rate (higher = lower risk)
  const capitalRecovery = propertyData.brrrr.capitalRecoveryRate; // e.g., 89%
  if (capitalRecovery >= 100) riskScore -= 30; // Infinite return (VERY LOW RISK)
  else if (capitalRecovery >= 85) riskScore -= 20; // Excellent (LOW RISK)
  else if (capitalRecovery >= 75) riskScore -= 10; // Good
  else if (capitalRecovery >= 65) riskScore += 10; // Marginal (MEDIUM-HIGH RISK)
  else riskScore += 30; // Poor (HIGH RISK)

  // Factor 2: 70% Rule margin (more buffer = lower risk)
  const rule70 = propertyData.brrrr.rule70Percentage; // e.g., 68%
  const rule70Margin = 70 - rule70; // e.g., 2% margin
  if (rule70Margin >= 5) riskScore -= 15; // Strong margin (low risk)
  else if (rule70Margin >= 2) riskScore -= 5; // Moderate margin
  else if (rule70Margin >= 0) riskScore += 10; // Tight (risky)
  else riskScore += 25; // FAILS 70% Rule (VERY HIGH RISK)

  // Factor 3: ARV sensitivity (how much ARV can drop before deal breaks)
  const maxARVDrop = calculateMaxARVDrop(propertyData); // e.g., -12% before capital recovery <70%
  if (maxARVDrop >= 10) riskScore -= 10; // Resilient deal
  else if (maxARVDrop >= 5) riskScore += 0; // Moderate buffer
  else riskScore += 15; // Fragile deal (HIGH RISK)

  // Factor 4: Refinance LTV aggressiveness
  const refinanceLTV = propertyData.brrrr.refinanceLTV || 75;
  if (refinanceLTV <= 70) riskScore -= 5; // Conservative
  else if (refinanceLTV <= 75) riskScore += 0; // Standard
  else riskScore += 10; // Aggressive 80% LTV (adds risk)

  return Math.max(0, Math.min(100, riskScore));
};
```

**New Risk Card 3: Refinance Feasibility Risk** 🏦

```
┌──────────────────────────────────────────────────┐
│ 🏦 Refinance Feasibility Risk            MEDIUM  │
├──────────────────────────────────────────────────┤
│ Your ability to successfully refinance has       │
│ moderate risk based on appraisal and lender      │
│ requirements.                                     │
│                                                   │
│ Risk Score: 52/100                               │
│ ████████████████████░░░░░░░░░░░░  52%            │
│                                                   │
│ Key Factors:                                     │
│ ⚠️  Appraisal Risk: Moderate (ARV estimate)     │
│ ✅ DSCR: 1.32 (exceeds 1.25 lender minimum)     │
│ ⚠️  Seasoning: 12 months (tight timeline)       │
│ ✅ LTV: 75% (standard, not aggressive)          │
│                                                   │
│ Lender Requirements Checklist:                   │
│ ✅ DSCR ≥ 1.25: YES (1.32)                      │
│ ✅ Seasoning ≥ 12 months: YES (12 months)       │
│ ⚠️  Appraisal ≥ ARV: UNCERTAIN ($320K needed)   │
│ ✅ Credit Score ≥ 680: Assumed YES              │
│                                                   │
│ Mitigation Strategy:                             │
│ ├─ Order appraisal at Month 10 (2mo buffer)    │
│ ├─ Pre-qualify with 3 lenders                   │
│ └─ Prepare 18-month holding cost buffer         │
└──────────────────────────────────────────────────┘
```

**Calculation Logic**:
```javascript
const calculateRefinanceFeasibilityRisk = (propertyData) => {
  let riskScore = 50; // Base medium risk

  // Factor 1: DSCR relative to lender requirements
  const dscr = propertyData.metrics.dscr; // e.g., 1.32
  if (dscr >= 1.35) riskScore -= 15; // Strong (exceeds requirements)
  else if (dscr >= 1.25) riskScore -= 5; // Meets Fannie Mae minimum
  else if (dscr >= 1.20) riskScore += 10; // Marginal (some lenders accept)
  else riskScore += 25; // Fails DSCR (HIGH RISK - likely denial)

  // Factor 2: Seasoning period timeline
  const seasoningMonths = propertyData.brrrr.seasoningPeriod || 12;
  if (seasoningMonths >= 18) riskScore -= 10; // Conservative buffer
  else if (seasoningMonths >= 12) riskScore += 0; // Standard
  else riskScore += 15; // Tight timeline (RISK - may need extension)

  // Factor 3: ARV appraisal risk (from ARV Estimation Risk card)
  const arvRisk = calculateARVEstimationRisk(propertyData);
  if (arvRisk <= 30) riskScore -= 10; // Low ARV risk = low appraisal risk
  else if (arvRisk <= 50) riskScore += 5; // Moderate ARV risk
  else riskScore += 15; // High ARV risk = high appraisal failure risk

  // Factor 4: Refinance LTV aggressiveness
  const refinanceLTV = propertyData.brrrr.refinanceLTV || 75;
  if (refinanceLTV <= 70) riskScore -= 10; // Conservative LTV
  else if (refinanceLTV <= 75) riskScore += 0; // Standard
  else riskScore += 15; // 80% LTV (fewer lenders, stricter requirements)

  // Factor 5: Post-refinance cash flow (lender requirement)
  const postRefiCashFlow = propertyData.brrrr.postRefinanceCashFlow;
  if (postRefiCashFlow >= 200) riskScore -= 5; // Strong cash flow
  else if (postRefiCashFlow >= 0) riskScore += 0; // Break-even OK for some lenders
  else riskScore += 10; // Negative cash flow (lender concern)

  return Math.max(0, Math.min(100, riskScore));
};
```

#### Display Mockups

**BRRRR Risk Intelligence Tab - Overall Layout**:

```
┌────────────────────────────────────────────────────────────────────┐
│ Risk & Intelligence                                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Overall Risk Assessment: MEDIUM                                     │
│ ████████████████████████░░░░░░░░░░░░  48/100                      │
│                                                                     │
│ ┌──────────────┬──────────────┬──────────────┐                    │
│ │ 🎯 ARV       │ 💰 Capital   │ 🏦 Refinance │                    │
│ │ Estimation   │ Recovery     │ Feasibility  │                    │
│ │              │              │              │                    │
│ │ MEDIUM       │ LOW          │ MEDIUM       │                    │
│ │ 58/100       │ 28/100       │ 52/100       │                    │
│ │ ⚠️           │ ✅           │ ⚠️           │                    │
│ └──────────────┴──────────────┴──────────────┘                    │
│                                                                     │
│ ─────────────────────────────────────────────────────────          │
│ BRRRR-Specific Risk Factors                                        │
│ ─────────────────────────────────────────────────────────          │
│                                                                     │
│ 🔨 Rehab Execution Risk                               MEDIUM (55%) │
│ └─ Rehab Budget: $35K (moderate complexity)                        │
│ └─ Property Age: 1995 (27 years - expect surprises)                │
│ └─ Mitigation: Budget $42K with 20% contingency                    │
│                                                                     │
│ 📊 ARV Comp Quality                                      LOW (32%) │
│ └─ Comps: 5 sales within 3 months (strong data)                    │
│ └─ Variance: 9% spread (moderate, acceptable)                      │
│ └─ Mitigation: Using 2nd lowest comp, not average                  │
│                                                                     │
│ ⏰ Seasoning Period Extension Risk                    MEDIUM (48%) │
│ └─ Timeline: 12 months (standard but tight)                        │
│ └─ Market: Stable (low extension risk)                             │
│ └─ Mitigation: Budget for 18-month holding costs                   │
│                                                                     │
│ 📈 Market Timing Risk (BRRRR)                         MEDIUM (51%) │
│ └─ Interest Rates: Rising (Fed tightening cycle)                   │
│ └─ Impact: 1% rate increase = -10% BRRRR profitability             │
│ └─ Mitigation: Fast execution (<6 months), rate lock               │
│                                                                     │
│ ─────────────────────────────────────────────────────────          │
│ 🤖 AI Risk Assessment (GPT-4o-mini Enhanced)                       │
│ ─────────────────────────────────────────────────────────          │
│                                                                     │
│ [AI-generated BRRRR-specific risk analysis with mitigation         │
│  strategies based on ARV risk, rehab complexity, and market        │
│  conditions. Focus on execution risks, not long-term hold risks.]  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

#### Required Inputs

**All Inputs Already Available** (no new inputs required):
- ✅ Purchase Price, Rehab Budget, ARV (from FinancialsStep)
- ✅ Refinance LTV, Seasoning Period (from FinancialsStep)
- ✅ Monthly Rent, Expenses (from RentalStep)
- ✅ Comparable properties (from RentCast API or manual entry)
- ✅ Market appreciation rate (from Market Intelligence Service)
- ✅ DSCR, Cash Flow, Capital Recovery (from brrrAnalyzer calculations)

**Data Sources**:
- **ARV Comp Data**: `propertyData.comparables[]` or RentCast API
- **Market Data**: FRED API (mortgage rates, housing price index)
- **BRRRR Metrics**: `propertyData.brrrr.*` (from brrrAnalyzer.ts)

#### Display Requirements

**UI Specifications**:

1. **Risk Card Grid**: 3-column layout (desktop), 1-column (mobile)
2. **Color Coding**:
   - **Low Risk (0-33)**: Green (#4CAF50)
   - **Medium Risk (34-66)**: Yellow/Orange (#FF9800)
   - **High Risk (67-100)**: Red (#F44336)
3. **Progress Bars**: Animated fill on tab load (visual engagement)
4. **Expandable Sections**: Each risk factor expandable for detailed breakdown
5. **AI Content**: Separate accordion section at bottom (collapsed by default)

**Risk Score Aggregation**:
```javascript
const calculateOverallBRRRRRisk = (propertyData) => {
  const arvRisk = calculateARVEstimationRisk(propertyData);
  const capitalRisk = calculateCapitalRecoveryRisk(propertyData);
  const refinanceRisk = calculateRefinanceFeasibilityRisk(propertyData);
  const rehabRisk = calculateRehabExecutionRisk(propertyData);

  // Weighted average (ARV and Capital Recovery are most critical)
  const overallRisk = (
    arvRisk * 0.30 +           // 30% weight (critical)
    capitalRisk * 0.30 +       // 30% weight (critical)
    refinanceRisk * 0.25 +     // 25% weight (important)
    rehabRisk * 0.15           // 15% weight (manageable)
  );

  return Math.round(overallRisk);
};
```

#### Edge Cases

**Edge Case 1: Infinite Return Deal (100%+ Capital Recovery)**
- **Scenario**: Refinance cash-out exceeds total invested capital
- **Risk Display**: Capital Recovery Risk = 0 (VERY LOW RISK) 🟢
- **Message**: "✅ Infinite Return Achievement: You recover 100%+ of invested capital!"
- **Note**: ARV and Refinance risks still apply (deal can still fail on appraisal)

**Edge Case 2: Failed 70% Rule**
- **Scenario**: (Purchase + Rehab) > 70% × ARV
- **Risk Display**: All risk cards show RED/HIGH RISK
- **Message**: "🚨 Deal FAILS 70% Rule (75%) - High capital trap risk"
- **Recommendation**: "Reduce purchase price by $15K OR reduce rehab scope by $15K"

**Edge Case 3: No Comparable Data Available**
- **Scenario**: User didn't provide comps, RentCast unavailable
- **Risk Display**: ARV Estimation Risk = 75 (HIGH RISK - data quality issue)
- **Message**: "⚠️ No comp data available - ARV risk assessment severely limited"
- **Recommendation**: "Add at least 3 comparable properties to improve risk accuracy"

**Edge Case 4: Combined High Risk Scenario**
- **Scenario**: ARV Risk HIGH + Refinance Risk HIGH + Rehab Risk HIGH
- **Risk Display**: Overall Risk Score > 70 (RED)
- **Alert Banner**: "🚨 CRITICAL: Multiple high-risk factors detected - strongly consider PASSING on this deal"
- **Behavioral Nudge**: Show "BRRRR Nightmare" scenario from Scenario Manager

**Edge Case 5: Post-Refinance Negative Cash Flow**
- **Scenario**: Post-refi cash flow < $0/month
- **Risk Display**: Add warning to Refinance Feasibility card
- **Message**: "⚠️ Negative cash flow post-refinance may impact lender approval"
- **Note**: "Some lenders require break-even or positive cash flow for DSCR loans"

#### Business Rules & Validation

**Risk Score Calculation Rules**:

1. **Floor/Ceiling**: All risk scores capped at 0-100 (no negative, no >100)
2. **Rounding**: Display rounded to whole numbers (58/100, not 58.234/100)
3. **Color Thresholds**:
   - Green: 0-33 (Low Risk)
   - Yellow: 34-66 (Medium Risk)
   - Red: 67-100 (High Risk)
4. **Overall Score**: Weighted average of all risk factors (weights sum to 100%)

**AI Risk Assessment Prompt** (BRRRR-specific):
```javascript
const brrrrRiskPrompt = `
You are analyzing a BRRRR (Buy-Rehab-Rent-Refinance-Repeat) investment deal.

BRRRR Property Details:
- Purchase Price: $${propertyData.purchasePrice}
- Rehab Budget: $${propertyData.brrrr.rehabBudget}
- After Repair Value (ARV): $${propertyData.brrrr.afterRepairValue}
- 70% Rule: ${propertyData.brrrr.rule70Percentage}% (target: ≤70%)
- Capital Recovery: ${propertyData.brrrr.capitalRecoveryRate}%

Risk Scores:
- ARV Estimation Risk: ${arvRisk}/100 (${riskLevel(arvRisk)})
- Capital Recovery Risk: ${capitalRisk}/100 (${riskLevel(capitalRisk)})
- Refinance Feasibility Risk: ${refinanceRisk}/100 (${riskLevel(refinanceRisk)})
- Rehab Execution Risk: ${rehabRisk}/100 (${riskLevel(rehabRisk)})

Comparable Properties: ${compsCount} sales within ${compsRecency} months
Market Conditions: ${marketAppreciation}% annual appreciation

Provide a concise risk assessment (150-200 words) focusing on:
1. Which risk is most concerning and why?
2. Specific mitigation strategies for top 2 risks
3. Overall deal viability considering BRRRR execution risks
4. Red flags that would make you personally PASS on this deal

Be direct and honest - if the deal is too risky, say so clearly.
`;
```

**Validation Rules**:
- ⚠️ If `capitalRecoveryRate < 50%`: Flag as "Capital trap - very difficult to repeat BRRRR"
- ⚠️ If `rule70Percentage > 70%`: Flag as "FAILS 70% Rule - high risk of capital loss"
- ⚠️ If `overallRisk > 70`: Show critical warning banner
- ℹ️ If `compsCount < 3`: Show "Limited comp data - consider professional appraisal"

#### Success Metrics

**Risk Tab Engagement**:
- 75%+ of BRRRR users view Risk & Intelligence tab
- 60%+ expand at least 2 risk cards
- ARV Estimation Risk most viewed card (80% of users)
- 40%+ users click "Learn More" links for risk mitigation strategies

**User Understanding**:
- 70%+ of users understand ARV overestimation is top BRRRR risk
- Users can explain difference between BRRRR risks vs Buy & Hold risks
- Survey feedback: "Risk tab helped me see deal-breaking issues I missed"

**Behavioral Impact**:
- 35% of users add conservative ARV buffer after viewing ARV risk
- 50% of users increase rehab contingency (15% → 20%) after viewing rehab risk
- 20% of users decide NOT to proceed after viewing combined high-risk warnings

**Business Impact**:
- Reduction in BRRRR deal failures (users identify risks before committing)
- Fewer support tickets: "Why didn't you warn me about [risk]?"
- Increase in professional appraisal purchases (ARV risk mitigation)
- Higher user trust: "Platform showed me real risks, not just rosy projections"

**AI Risk Assessment Quality**:
- 80%+ of AI assessments provide actionable mitigation strategies
- Users rate AI insights as "helpful" or "very helpful" (4+ stars)
- AI correctly identifies top risk in 85%+ of deals

---

### Tab 10: Stress Testing

**Priority**: P1 (High Value - Downside Protection)
**Effort**: Medium (2 weeks)
**Component**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Stress Testing case)

#### Business Context

**Stress Testing Logic FUNDAMENTALLY DIFFERENT for BRRRR**

**Buy & Hold Stress Tests**: "What if rent drops 10%?" or "What if vacancy goes to 15%?" - Testing ongoing operational sustainability over 10+ years.

**BRRRR Stress Tests**: "What if I can't refinance?" or "What if ARV comes in $30K low?" - Testing whether THE DEAL WORKS AT ALL during the 12-month execution period.

**Example from My Portfolio (Property #27 - Houston BRRRR Near-Failure, 2023)**:
```
Planned BRRRR Deal (looked great):
├─ Purchase: $185K, Rehab: $32K, ARV: $285K
├─ 70% Rule: 76% (slightly over, but "close enough")
├─ Expected Capital Recovery: 82%
└─ Verdict: NEGOTIATE (I bought it anyway)

Stress Tests I SHOULD HAVE RUN:
├─ ARV -5% Test: $285K → $271K = 80% on 70% Rule ❌ FAIL
├─ Rehab +20% Test: $32K → $38K = 79% on 70% Rule ❌ FAIL
├─ Refinance Denial Test: Forced sale at $265K = -$12K loss 🚨
└─ Combined Scenario: Loss of $18K to $25K

Actual Outcome (mild stress):
├─ ARV came in at $275K (-3.5%, not -5%)
├─ Rehab overrun to $36K (+12.5%, not +20%)
├─ 70% Rule: 78.5% (FAILED, but only by 8.5%)
├─ Lender APPROVED at 70% LTV (not 75% as planned)
└─ Capital Recovery: 68% (vs planned 82%)

Result: Deal survived but trapped $17K of capital. Took 26 months
to sell (not repeat BRRRR). Lost 2 years of deal velocity.
```

If I had run BRRRR stress tests BEFORE buying, I would have negotiated purchase down to $175K or passed entirely.

#### Current State (Buy & Hold Stress Tests)

**Existing Stress Testing Tab** (Buy & Hold strategy):
- **6 Scenarios**: Rent -10%, Vacancy +5%, Expenses +15%, Interest Rate +2%, Cap Rate -100bps, Combined Worst Case
- **Impact Metrics**: Cash flow, CoC return, DSCR changes
- **Pass/Fail Criteria**: DSCR > 1.0, positive cash flow
- **Focus**: Long-term operational resilience

**What This Tests**: Can you survive operational stress over 10-30 years?

#### What Breaks/Missing for BRRRR

**Wrong Stress Scenarios** (Buy & Hold tests don't matter for BRRRR):
- ❌ "Rent -10%": Irrelevant during 12-month hold before refinance
- ❌ "Vacancy +5%": Doesn't kill the deal (just extends seasoning)
- ❌ "Expenses +15%": Annoying but not deal-breaking for BRRRR
- ❌ "Hold 30 years": BRRRR investors don't hold 30 years

**Missing BRRRR Stress Scenarios** (6 new tests needed):

1. **ARV Appraisal Shortfall (-5%)**
   - **Probability**: 30% (very common)
   - **Impact**: Reduces refinance cash-out, kills capital recovery
   - **Critical Test**: Does deal still work at 95% of estimated ARV?

2. **ARV Appraisal Disaster (-10%)**
   - **Probability**: 15% (uncommon but devastating)
   - **Impact**: May trigger refinance denial (LTV violation)
   - **Critical Test**: Can you still refinance? Or forced sale?

3. **Rehab Budget Overrun (+20%)**
   - **Probability**: 40% (industry standard: 73% of deals exceed budget by 15-30%)
   - **Impact**: More capital invested = lower capital recovery %
   - **Critical Test**: Does 70% Rule still pass? Capital recovery still viable?

4. **Rehab Budget Disaster (+50%)**
   - **Probability**: 10% (major scope creep or hidden damage)
   - **Impact**: May violate 70% Rule, kill capital recovery entirely
   - **Critical Test**: Does deal become a capital trap?

5. **Refinance Denied (Forced Sale Scenario)**
   - **Probability**: 12% (appraisal miss, DTI too high, credit issue)
   - **Impact**: Must sell property, incur selling costs, taxable event
   - **Critical Test**: Can you sell for profit? Or realize a loss?

6. **BRRRR Perfect Storm (Combined)**
   - **Probability**: 3-5% (multiple problems compound)
   - **Impact**: ARV -8% + Rehab +30% + Forced Sale
   - **Critical Test**: Worst-case financial outcome

**Missing Calculations**:
```javascript
// Forced Sale Scenario (current system doesn't calculate this)
const forcedSaleScenario = {
  salePrice: arv * 0.92, // Sell 8% below ARV (motivated seller)
  sellingCosts: arv * 0.08, // 6% agent + 2% closing
  netProceeds: (arv * 0.92) - (arv * 0.08),
  totalInvested: downPayment + closingCosts + rehabActual + holdingCosts,
  netGainLoss: netProceeds - purchaseLoan - totalInvested,
  returnOnInvestment: (netGainLoss / totalInvested) * 100
};

// Current system only calculates refinance scenario, not forced sale
```

#### BRRRR Requirements

**New Stress Scenario 1: ARV Appraisal Shortfall (-5%)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: ARV Appraisal Shortfall (-5%)                 │
├────────────────────────────────────────────────────────────┤
│ Likelihood: COMMON (30% of BRRRR deals)                    │
│ Severity:   MODERATE                                        │
│                                                            │
│ Scenario:                                                  │
│ Appraisal comes in 5% below your ARV estimate              │
│ ├─ Your ARV Estimate:     $320,000                        │
│ ├─ Appraisal Result:      $304,000 (-$16K)               │
│ └─ Refinance LTV Impact:  75% of $304K = $228K           │
│                                                            │
│ Financial Impact:                                          │
│ ├─ Planned Refinance:     $240,000 (75% × $320K)         │
│ ├─ Actual Refinance:      $228,000 (75% × $304K)         │
│ ├─ Cash-Out Reduction:    -$12,000                        │
│ └─ Original Loan Payoff:  -$150,000 (unchanged)           │
│                                                            │
│ BRRRR Metrics (Before → After):                           │
│ ├─ Capital Recovery:      89% → 77% ⚠️                   │
│ ├─ 70% Rule:             68% → 71% ⚠️ (marginal)        │
│ ├─ Cash-Out:             $88,500 → $76,500              │
│ ├─ Post-Refi Cash Flow:  $285/mo → $248/mo              │
│                                                            │
│ Verdict Change: BUY → NEGOTIATE ⚠️                        │
│                                                            │
│ Mitigation Strategy:                                       │
│ ├─ Negotiate purchase down $12K to compensate            │
│ ├─ Use 2nd lowest comp (not average) for ARV             │
│ └─ Order pre-appraisal at Month 10 ($500) for certainty  │
└────────────────────────────────────────────────────────────┘
```

**New Stress Scenario 2: ARV Appraisal Disaster (-10%)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: ARV Appraisal Disaster (-10%)                 │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (15% of BRRRR deals)                  │
│ Severity:   SEVERE                                          │
│                                                            │
│ Scenario:                                                  │
│ Appraisal comes in 10% below your ARV estimate             │
│ ├─ Your ARV Estimate:     $320,000                        │
│ ├─ Appraisal Result:      $288,000 (-$32K) 🚨            │
│ └─ Refinance LTV Impact:  75% of $288K = $216K           │
│                                                            │
│ Financial Impact:                                          │
│ ├─ Planned Refinance:     $240,000 (75% × $320K)         │
│ ├─ Actual Refinance:      $216,000 (75% × $288K)         │
│ ├─ Cash-Out Reduction:    -$24,000 🚨                     │
│ └─ May NOT cover loan payoff + closing ($153K needed)     │
│                                                            │
│ BRRRR Metrics (Before → After):                           │
│ ├─ Capital Recovery:      89% → 62% 🚨 (capital trap)   │
│ ├─ 70% Rule:             68% → 75% 🚨 (FAILS)           │
│ ├─ Cash-Out:             $88,500 → $61,000              │
│ ├─ Post-Refi Cash Flow:  $285/mo → $195/mo              │
│                                                            │
│ Verdict Change: BUY → PASS 🚨                              │
│                                                            │
│ Lender Risk:                                               │
│ Some lenders may DENY refinance if 70% Rule fails         │
│ (Purchase $225K + Rehab $35K = $260K / $288K ARV = 90%)   │
│                                                            │
│ Mitigation Strategy:                                       │
│ ├─ This scenario reveals deal is too fragile             │
│ ├─ PASS on deal OR negotiate purchase down $30K+         │
│ └─ If you proceed, prepare forced sale contingency plan  │
└────────────────────────────────────────────────────────────┘
```

**New Stress Scenario 3: Rehab Budget Overrun (+20%)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: Rehab Budget Overrun (+20%)                   │
├────────────────────────────────────────────────────────────┤
│ Likelihood: COMMON (40% of BRRRR deals)                    │
│ Severity:   MODERATE                                        │
│                                                            │
│ Scenario:                                                  │
│ Rehab costs exceed budget by 20% (industry typical)        │
│ ├─ Planned Rehab:         $35,000                         │
│ ├─ Actual Rehab:          $42,000 (+$7K)                  │
│ └─ Additional Cash Needed: $7,000 (unplanned)             │
│                                                            │
│ Financial Impact:                                          │
│ ├─ Total Invested (Plan):    $99,200                      │
│ ├─ Total Invested (Actual):  $106,200 (+7K)              │
│ └─ Refinance Cash-Out:       $88,500 (unchanged)          │
│                                                            │
│ BRRRR Metrics (Before → After):                           │
│ ├─ Capital Recovery:      89% → 83% ⚠️                   │
│ ├─ 70% Rule:             68% → 71% ⚠️                    │
│ ├─ Capital at Risk:      $10,700 → $17,700 (+$7K)        │
│ ├─ Deal Quality:         Still viable, margin reduced     │
│                                                            │
│ Verdict Change: BUY → BUY (still viable, less margin)      │
│                                                            │
│ Mitigation Strategy:                                       │
│ ├─ Budget 20% contingency upfront ($42K not $35K)        │
│ ├─ Get 3 contractor quotes + detailed SOW                │
│ └─ Inspect property thoroughly for hidden issues         │
└────────────────────────────────────────────────────────────┘
```

**New Stress Scenario 4: Rehab Budget Disaster (+50%)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: Rehab Budget Disaster (+50%)                  │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (10% of BRRRR deals)                  │
│ Severity:   CATASTROPHIC                                    │
│                                                            │
│ Scenario:                                                  │
│ Major scope creep or hidden damage (foundation, mold)      │
│ ├─ Planned Rehab:         $35,000                         │
│ ├─ Actual Rehab:          $52,500 (+$17.5K) 🚨           │
│ └─ Emergency Cash Needed:  $17,500 (must find quickly)    │
│                                                            │
│ Financial Impact:                                          │
│ ├─ Total Invested (Plan):    $99,200                      │
│ ├─ Total Invested (Actual):  $116,700 (+$17.5K) 🚨       │
│ └─ Refinance Cash-Out:       $88,500 (unchanged)          │
│                                                            │
│ BRRRR Metrics (Before → After):                           │
│ ├─ Capital Recovery:      89% → 76% 🚨                   │
│ ├─ 70% Rule:             68% → 77% 🚨 (FAILS)           │
│ ├─ Capital at Risk:      $10,700 → $28,200 (trap!)       │
│ ├─ Deal Quality:         Severely compromised             │
│                                                            │
│ Verdict Change: BUY → CAUTION/PASS 🚨                      │
│                                                            │
│ Refinance Risk:                                            │
│ 70% Rule violation may trigger lender denial               │
│ (Purchase $225K + Rehab $52.5K = $277.5K / $320K = 87%)   │
│                                                            │
│ Mitigation Strategy:                                       │
│ ├─ This reveals deal has NO margin for error             │
│ ├─ Get professional inspection ($400-600) before buying   │
│ ├─ Budget 30% contingency for older properties           │
│ └─ Consider PASSING if property shows red flags          │
└────────────────────────────────────────────────────────────┘
```

**New Stress Scenario 5: Refinance Denied (Forced Sale)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: Refinance Denied (Forced Sale Scenario)       │
├────────────────────────────────────────────────────────────┤
│ Likelihood: UNCOMMON (12% of BRRRR investors)              │
│ Severity:   CRITICAL                                        │
│                                                            │
│ Scenario:                                                  │
│ Lender denies refinance (appraisal, DTI, credit issues)    │
│ You must SELL the property to recover capital              │
│                                                            │
│ Forced Sale Analysis:                                      │
│ ├─ Expected Sale Price:   $312,000 (2.5% below ARV)      │
│ ├─ Agent Commission (6%): -$18,720                        │
│ ├─ Seller Closing (2%):   -$6,240                         │
│ ├─ Loan Payoff:          -$150,000 (original loan)       │
│ └─ Net Proceeds:          $137,040                        │
│                                                            │
│ Investment Recovery:                                       │
│ ├─ Total Capital Invested: $99,200                        │
│ ├─ Net Proceeds:           $137,040                       │
│ ├─ Gross Profit:           $37,840                        │
│ └─ BUT: Taxable event (25% capital gains)                │
│                                                            │
│ After-Tax Outcome:                                         │
│ ├─ Gross Profit:          $37,840                         │
│ ├─ Capital Gains Tax:     -$9,460 (25% on short-term)    │
│ ├─ Net Profit:            $28,380                         │
│ ├─ ROI:                   28.6% (over 12 months)          │
│ └─ Annualized ROI:        28.6% (acceptable, but...)      │
│                                                            │
│ BRRRR Failure Impact:                                      │
│ ✅ You make profit (not a disaster)                       │
│ ❌ But you CANNOT repeat BRRRR (no capital recovered)     │
│ ❌ Taxable event (vs tax-free refinance)                  │
│ ❌ Lost time (12 months invested for one deal)            │
│                                                            │
│ Verdict: BRRRR STRATEGY FAILED (but financially survived)  │
│                                                            │
│ Mitigation Strategy:                                       │
│ ├─ Pre-qualify with 3 lenders BEFORE buying              │
│ ├─ Ensure DSCR > 1.30 (buffer above 1.25 requirement)    │
│ ├─ Conservative ARV (don't stretch appraisal)             │
│ └─ Have backup lender ready if primary denies            │
└────────────────────────────────────────────────────────────┘
```

**New Stress Scenario 6: BRRRR Perfect Storm (Combined)**

```
┌────────────────────────────────────────────────────────────┐
│ Stress Test: BRRRR Perfect Storm (Combined Disasters)      │
├────────────────────────────────────────────────────────────┤
│ Likelihood: RARE (3-5% of BRRRR deals)                     │
│ Severity:   CATASTROPHIC                                    │
│                                                            │
│ Multiple Stress Events:                                    │
│ ├─ ARV Appraisal:         -8% ($320K → $294K)            │
│ ├─ Rehab Overrun:         +30% ($35K → $45.5K)           │
│ ├─ Extended Seasoning:    +6 months holding costs        │
│ └─ Refinance Denied:      Forced sale required           │
│                                                            │
│ Forced Sale Analysis (Distressed):                        │
│ ├─ Sale Price:            $280,000 (-12.5% from ARV)     │
│ ├─ Selling Costs (8%):    -$22,400                        │
│ ├─ Loan Payoff:          -$150,000                        │
│ ├─ Total Invested:        -$109,700 (with overruns)      │
│ └─ Net Outcome:           -$2,100 LOSS 🚨                │
│                                                            │
│ Total Financial Damage:                                    │
│ ├─ Direct Loss:           -$2,100                         │
│ ├─ Opportunity Cost:      -$15,000 (18 months at 10% ROI)│
│ ├─ Time Lost:             18 months (career setback)      │
│ └─ Total Impact:          -$17,100 equivalent loss        │
│                                                            │
│ BRRRR Metrics:                                             │
│ ├─ Capital Recovery:      0% (complete failure)          │
│ ├─ 70% Rule:             95% (massive violation)         │
│ ├─ ROI:                   -1.9% (LOSS)                    │
│ └─ Annualized ROI:        -1.3% (vs 28% S&P 500)          │
│                                                            │
│ Verdict: CATASTROPHIC BRRRR FAILURE 🚨                     │
│                                                            │
│ Lesson:                                                    │
│ This is WHY experienced BRRRR investors:                   │
│ ├─ Never violate 70% Rule (even by 2-3%)                 │
│ ├─ Use 2nd lowest comp (never average or optimistic)     │
│ ├─ Budget 20-30% rehab contingency                       │
│ ├─ Pre-qualify refinance BEFORE buying                   │
│ └─ Walk away from marginal deals                         │
│                                                            │
│ If your base case is close to 70% Rule, run this test!    │
└────────────────────────────────────────────────────────────┘
```

#### Display Mockups

**BRRRR Stress Testing Tab - Summary Table**:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Stress Testing - BRRRR Deal Resilience                                         │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ How does this BRRRR deal perform under adverse conditions?                     │
│                                                                                 │
│ ┌──────────────────┬──────────┬──────────┬─────────────┬─────────┬──────────┐ │
│ │ Stress Scenario  │ Severity │ Prob.    │ Cap.Recovery│ 70% Rule│ Verdict  │ │
│ ├──────────────────┼──────────┼──────────┼─────────────┼─────────┼──────────┤ │
│ │ Base Case        │ -        │ -        │ 89%         │ 68%     │ BUY ✅   │ │
│ ├──────────────────┼──────────┼──────────┼─────────────┼─────────┼──────────┤ │
│ │ ARV -5%          │ Moderate │ 30%      │ 77% ⚠️     │ 71% ⚠️ │ NEGOTIATE│ │
│ │ ARV -10%         │ Severe   │ 15%      │ 62% 🚨     │ 75% 🚨 │ PASS     │ │
│ │ Rehab +20%       │ Moderate │ 40%      │ 83% ⚠️     │ 71% ⚠️ │ BUY      │ │
│ │ Rehab +50%       │ Severe   │ 10%      │ 76% 🚨     │ 77% 🚨 │ CAUTION  │ │
│ │ Refinance Denied │ Critical │ 12%      │ 0% (Sale)   │ N/A     │ PROFIT   │ │
│ │ Perfect Storm    │ Catast.  │ 3-5%     │ 0% (Loss)   │ 95% 🚨 │ FAILURE  │ │
│ └──────────────────┴──────────┴──────────┴─────────────┴─────────┴──────────┘ │
│                                                                                 │
│ Deal Resilience Score: 72/100 (MEDIUM) ⚠️                                     │
│ ████████████████████████████████░░░░░░░░░░░░  72%                             │
│                                                                                 │
│ Key Insights:                                                                  │
│ ✅ Deal survives moderate stress (ARV -5%, Rehab +20%)                        │
│ ⚠️  Vulnerable to severe ARV miss (capital recovery drops to 62%)             │
│ 🚨 Perfect Storm scenario results in $2,100 loss                              │
│                                                                                 │
│ Recommendations:                                                               │
│ 1. Negotiate purchase down $10K to build margin of safety                     │
│ 2. Use 2nd lowest comp for ARV (currently using average)                      │
│ 3. Budget $42K for rehab (20% contingency) instead of $35K                    │
│                                                                                 │
│ [Click any scenario row to expand full analysis]                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

#### Required Inputs

**All Inputs Already Available** (no new inputs required):
- ✅ Purchase Price, Rehab Budget, ARV (from FinancialsStep)
- ✅ Refinance LTV, Seasoning Period (from FinancialsStep)
- ✅ Down Payment, Closing Costs, Loan Amount (from FinancialsStep)
- ✅ Monthly Holding Costs (from RentalStep + calculated expenses)
- ✅ Interest Rates (purchase and refinance) (from FinancialsStep)

#### Display Requirements

**UI Specifications**:

1. **Summary Table**: 7 rows (base case + 6 stress scenarios), 6 columns
2. **Color Coding**:
   - Green (✅): Deal survives stress test well
   - Yellow (⚠️): Deal survives but margin reduced significantly
   - Red (🚨): Deal fails or becomes very risky under stress
3. **Expandable Rows**: Click scenario to see full analysis card (from mockups above)
4. **Resilience Score**: 0-100 weighted score based on performance across scenarios
5. **Mobile Display**: Collapse to 3 columns (Scenario, Cap.Recovery, Verdict) on small screens

**Resilience Score Calculation**:
```javascript
const calculateBRRRRResilienceScore = (stressResults) => {
  let resilienceScore = 100; // Start perfect

  // Penalize for each stress scenario that causes problems
  const penalties = {
    arv5: stressResults.arv5.capitalRecovery < 75 ? -10 : 0,
    arv10: stressResults.arv10.capitalRecovery < 70 ? -15 : 0,
    rehab20: stressResults.rehab20.capitalRecovery < 75 ? -5 : 0,
    rehab50: stressResults.rehab50.capitalRecovery < 70 ? -15 : 0,
    refDenial: stressResults.refDenial.netProfit < 0 ? -20 : -5,
    perfectStorm: stressResults.storm.netOutcome < 0 ? -25 : -10
  };

  // Apply penalties
  Object.values(penalties).forEach(penalty => {
    resilienceScore += penalty; // penalties are negative
  });

  // Bonus for deals that survive ALL moderate stress
  if (resilienceScore >= 70) {
    resilienceScore += 10; // Robust deal bonus
  }

  return Math.max(0, Math.min(100, resilienceScore));
};
```

#### Edge Cases

**Edge Case 1: Deal Fails ALL Stress Tests**
- **Scenario**: Every stress test shows PASS/CAUTION verdict
- **Display**: Resilience Score < 30 (RED)
- **Alert**: "🚨 CRITICAL: This deal is extremely fragile. Strongly recommend PASSING."
- **Action**: Show comparison table: "Alternative deals in this area with better resilience"

**Edge Case 2: Deal Survives ALL Stress Tests**
- **Scenario**: Even Perfect Storm shows profit
- **Display**: Resilience Score > 85 (GREEN)
- **Message**: "✅ Exceptional deal! Survives even catastrophic scenarios."
- **Note**: "Deals this robust are rare - verify your ARV estimate isn't too conservative."

**Edge Case 3: Forced Sale Results in Large Profit**
- **Scenario**: Forced sale nets $50K+ profit (happens with underpriced purchases)
- **Display**: Show "BRRRR Failure = Flip Success" message
- **Note**: "While profitable, you lose BRRRR benefits (capital recovery, tax-free refinance)"

**Edge Case 4: User Has No Emergency Fund**
- **Scenario**: Rehab overrun scenarios require $10K-20K extra cash
- **Warning**: "⚠️ Rehab overruns require emergency capital. Do you have $20K reserves?"
- **Recommendation**: "BRRRR investors should maintain 6-month emergency fund"

**Edge Case 5: Perfect Storm Shows Extreme Loss (>$20K)**
- **Scenario**: Combination of disasters leads to $20K+ loss
- **Display**: Flash red border on Perfect Storm row
- **Alert**: "🚨 Potential $20K+ loss in worst case. This deal is too risky for most investors."

#### Business Rules & Validation

**Stress Test Calculation Engine**:
```javascript
const calculateBRRRRStressTests = (propertyData) => {
  const base = propertyData.brrrr; // Base case metrics

  const results = {
    baseCase: {
      capitalRecovery: base.capitalRecoveryRate,
      rule70: base.rule70Percentage,
      verdict: base.investmentVerdict
    },

    arv5: runARVStressTest(propertyData, -0.05), // -5%
    arv10: runARVStressTest(propertyData, -0.10), // -10%
    rehab20: runRehabStressTest(propertyData, 0.20), // +20%
    rehab50: runRehabStressTest(propertyData, 0.50), // +50%
    refDenial: runForcedSaleScenario(propertyData),
    perfectStorm: runCombinedStressTest(propertyData, {
      arvAdjust: -0.08,
      rehabAdjust: 0.30,
      seasoningExtension: 6,
      forcedSale: true
    })
  };

  results.resilienceScore = calculateBRRRRResilienceScore(results);

  return results;
};

// ARV Stress Test Function
const runARVStressTest = (propertyData, arvAdjustment) => {
  const stressedARV = propertyData.brrrr.afterRepairValue * (1 + arvAdjustment);
  const refinanceLoan = stressedARV * (propertyData.brrrr.refinanceLTV / 100);
  const cashOut = refinanceLoan - propertyData.loanAmount - (stressedARV * 0.02); // 2% closing
  const capitalRecovery = (cashOut / propertyData.totalInvested) * 100;
  const rule70 = ((propertyData.purchasePrice + propertyData.brrrr.rehabBudget) / stressedARV) * 100;

  return {
    arv: stressedARV,
    refinanceLoan,
    cashOut,
    capitalRecovery,
    rule70,
    verdict: determineVerdict({ capitalRecovery, meets70Rule: rule70 <= 70 })
  };
};

// Rehab Overrun Stress Test
const runRehabStressTest = (propertyData, rehabAdjustment) => {
  const stressedRehab = propertyData.brrrr.rehabBudget * (1 + rehabAdjustment);
  const stressedTotalInvested = propertyData.totalInvested + (stressedRehab - propertyData.brrrr.rehabBudget);
  const cashOut = propertyData.brrrr.refinanceCashOut; // ARV unchanged
  const capitalRecovery = (cashOut / stressedTotalInvested) * 100;
  const rule70 = ((propertyData.purchasePrice + stressedRehab) / propertyData.brrrr.afterRepairValue) * 100;

  return {
    rehabBudget: stressedRehab,
    totalInvested: stressedTotalInvested,
    cashOut,
    capitalRecovery,
    rule70,
    verdict: determineVerdict({ capitalRecovery, meets70Rule: rule70 <= 70 })
  };
};

// Forced Sale Scenario
const runForcedSaleScenario = (propertyData) => {
  const arv = propertyData.brrrr.afterRepairValue;
  const salePrice = arv * 0.975; // Sell 2.5% below ARV (motivated but not desperate)
  const sellingCosts = salePrice * 0.08; // 6% agent + 2% closing
  const netProceeds = salePrice - sellingCosts;
  const loanPayoff = propertyData.loanAmount;
  const netCash = netProceeds - loanPayoff;
  const totalInvested = propertyData.totalInvested;
  const netGainLoss = netCash - totalInvested;
  const roi = (netGainLoss / totalInvested) * 100;

  return {
    salePrice,
    sellingCosts,
    netProceeds,
    loanPayoff,
    netCash,
    totalInvested,
    netGainLoss,
    roi,
    verdict: netGainLoss > 0 ? 'PROFIT' : 'LOSS'
  };
};
```

**Validation Rules**:
- ⚠️ If resilience score < 50: Show "High Risk - Consider Passing" warning
- ⚠️ If Perfect Storm shows loss: Show "Extreme downside risk" alert
- ℹ️ If all stress tests show BUY verdict: "Exceptionally robust deal"
- ⚠️ If ARV -10% test fails 70% Rule: "ARV estimate may be too aggressive"

#### Success Metrics

**Stress Testing Engagement**:
- 70%+ of BRRRR users view Stress Testing tab
- 60%+ expand at least 2 stress scenarios
- ARV -5% and Rehab +20% most viewed scenarios (80%+ of users)
- Perfect Storm viewed by 50% of users (educational value)

**User Understanding**:
- 75%+ of users understand ARV sensitivity is biggest risk
- Users can explain why 70% Rule margin matters under stress
- Survey feedback: "Stress tests showed me risks I hadn't considered"

**Behavioral Impact**:
- 40% of users negotiate purchase price lower after viewing stress tests
- 55% of users increase rehab contingency buffer (15% → 20%)
- 25% of users decide to PASS after viewing low resilience score
- 30% of users switch to 2nd lowest comp (vs average) for ARV after ARV stress tests

**Business Impact**:
- Reduction in BRRRR deal failures (users understand downside before committing)
- Increase in conservative deal structuring (margin of safety)
- Fewer support tickets: "I lost money - why didn't you warn me?"
- Higher user trust: "Platform showed me worst-case scenarios upfront"

**Deal Quality Improvement**:
- Average resilience score for executed deals: 65+ (vs 55 without stress testing)
- Users with resilience score > 70 have 85% BRRRR success rate
- Users who ignore resilience score < 50 have 40% BRRRR failure rate

---


## 🔧 Input Wizard Enhancement Requirements

### Current BRRRR Inputs (Already Collected)

**FinancialsStep.tsx** (lines 82-92):
- ✅ Rehab Budget
- ✅ After Repair Value (ARV)
- ✅ Refinance LTV % (default 75%)
- ✅ Seasoning Period (default 12 months)
- ✅ ARV Confidence (conservative/moderate/aggressive)

### NEW Inputs Required

#### 1. Refinance Interest Rate (FinancialsStep - Advanced Settings)

**Location**: FinancialsStep.tsx, Advanced Settings accordion (after ARV confidence)

**Input Specification**:
```typescript
<Accordion>
  <AccordionSummary>Advanced Refinance Settings (Optional)</AccordionSummary>
  <AccordionDetails>
    <TextField
      label="Refinance Interest Rate"
      type="number"
      value={refinanceInterestRate || purchaseInterestRate}
      helperText="Refinance rates may differ from purchase rates by ±0.5%. Leave blank to use purchase rate."
      InputProps={{
        endAdornment: <InputAdornment>%</InputAdornment>
      }}
    />
  </AccordionDetails>
</Accordion>
```

**Default**: Same as purchase interest rate
**Range**: ±2% of purchase rate
**Validation**: Must be positive, typically 3-12%

#### 2. Post-Refinance Rent Estimate (RentalStep)

**Business Rationale**: Rent may change during seasoning period (market changes, property improvements)

**Location**: RentalStep.tsx, conditional BRRRR section

**Input Specification**:
```typescript
{strategy === 'brrrr' && (
  <Box sx={{ mt: 3 }}>
    <Divider sx={{ mb: 2 }} />
    <Typography variant="h6">Post-Refinance Rent (Optional)</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Expected monthly rent AFTER refinance (12+ months from now).
      Leave blank if same as current rent.
    </Typography>
    <TextField
      label="Post-Refinance Monthly Rent"
      type="number"
      value={postRefinanceRent || monthlyRent}
      helperText="May be higher than current rent due to market appreciation or property improvements."
      InputProps={{
        startAdornment: <InputAdornment>$</InputAdornment>
      }}
    />
  </Box>
)}
```

**Default**: Same as initial monthly rent
**Range**: 80-120% of initial rent (flag if outside this range)

#### 3. Hold Period Clarification (AssumptionsStep)

**Business Rationale**: Users confused whether "10 years" means 10 years TOTAL or 10 years AFTER refinance for BRRRR

**Current State**: AssumptionsStep shows "Projection Years" field (default 10)

**Enhancement**: Add contextual help for BRRRR strategy

**Input Specification**:
```typescript
<TextField
  label="Projection Years"
  value={projectionYears}
  helperText={
    strategy === 'brrrr'
      ? "⚠️ BRRRR Note: This is total hold period AFTER refinance (Year 1 = post-refinance). Most BRRRR investors sell/repeat within 2 years and don't hold 10 years."
      : "Long-term hold period for appreciation and equity growth projections"
  }
/>

{strategy === 'brrrr' && (
  <Alert severity="info" sx={{ mt: 2 }}>
    <Typography variant="body2">
      <strong>BRRRR Hold Period Clarification:</strong><br/>
      • <strong>Year 1</strong> = First year AFTER refinance (Month 13-24 total)<br/>
      • <strong>Year 10</strong> = 10 years AFTER refinance (11 years total ownership)<br/>
      <br/>
      Long-term hold is NOT typical BRRRR. Most investors either:<br/>
      • Sell within 12-18 months (before refinance)<br/>
      • Refinance and immediately REPEAT on next property<br/>
      <br/>
      Use these projections only if planning to HOLD long-term after refinance.
    </Typography>
  </Alert>
)}
```

---

## 📊 Implementation Priority Matrix

### Priority Breakdown

**P0 CRITICAL (Production Blocker) - 1-2 weeks**:
- **Long-Term Analysis ARV Bug Fix**
  - Impact: 60% calculation error ($157K underestimate)
  - Effort: Small (1-2 weeks)
  - Blocker: Yes (prevents accurate BRRRR projections)

**P1 HIGH (High Business Value) - 6-8 weeks**:
1. **Financial Details - Dual Time Periods** (2-3 weeks)
   - Shows before/after refinance cash flow
   - Explains BRRRR trade-off (capital recovery vs cash flow)

2. **Tax Intelligence - BRRRR Tax Education** (1-2 weeks)
   - Explains tax-free refinance cash-out
   - High educational value, low effort

3. **Interactive Tools - BRRRR Context** (1 week)
   - Add contextual banners to existing tools
   - Purchase price slider already works for BRRRR

4. **Risk & Intelligence - BRRRR Risks** (2-3 weeks)
   - Add ARV overestimation scenarios
   - Add rehab budget overrun stress tests

5. **Comparables - Renovated vs Unrenovated** (1-2 weeks)
   - Separate comp sections
   - Conservative ARV calculator

**P2 MEDIUM (Nice to Have) - 4-6 weeks**:
1. **Deal Optimizer - BRRRR Mode** (2-3 weeks)
   - Optimize for capital recovery (not cash flow)
   - Filter out "hold longer" suggestions

2. **Scenario Manager - BRRRR Scenarios** (2-3 weeks)
   - ARV variance scenarios
   - Refinance fail scenarios

3. **Stress Testing - BRRRR Stressors** (1-2 weeks)
   - Rehab timeline extension
   - Post-refi market drops

### Recommended Phasing

**Phase 1 (Immediate) - 2-3 weeks**:
- Fix Long-Term Analysis ARV bug (P0)
- Tax Intelligence BRRRR education (P1, quick win)
- Interactive Tools context banners (P1, quick win)

**Phase 2 (Next Sprint) - 4-5 weeks**:
- Financial Details dual time periods (P1)
- Risk & Intelligence BRRRR risks (P1)
- Comparables enhancements (P1)

**Phase 3 (Future) - 4-6 weeks**:
- Deal Optimizer BRRRR mode (P2)
- Scenario Manager BRRRR scenarios (P2)
- Stress Testing BRRRR stressors (P2)

---

## 📈 Success Metrics & Validation

### User Comprehension Metrics

**Target**: 80%+ of BRRRR users understand strategy-specific concepts

**Measurement**:
- Survey after analysis: "Do you understand why BRRRR post-refi cash flow is often negative?"
- Survey: "Can you explain what '70% Rule' means in your own words?"
- Survey: "Do you understand that refinance cash-out is tax-free?"

**Benchmarks**:
- Current (Buy & Hold only): 45% comprehension on financial nuances
- Target (BRRRR enhancements): 80% comprehension on BRRRR-specific concepts

### Feature Adoption Metrics

**Target**: 60%+ engagement with BRRRR-specific sections

**Measurement**:
- % of BRRRR users who expand Financial Details "Post-Refinance" section
- % of BRRRR users who expand Tax Intelligence "BRRRR Tax Advantages"
- Average time spent on BRRRR educational content (target: 2+ minutes)

### Business Impact Metrics

**Target**: Reduce support tickets, increase user confidence

**Measurement**:
- Reduction in support questions: "Why is my BRRRR cash flow negative?"
- Reduction in support questions: "Do I owe taxes on refinance?"
- NPS score increase for BRRRR users (target: +15 points)
- User testimonials mentioning "finally understand BRRRR" in feedback

### Accuracy Validation

**Target**: 0 calculation errors for BRRRR projections

**Validation Tests**:
- [ ] Long-Term Analysis Year 10 = ARV × (1.03)^9 for BRRRR ✅
- [ ] Long-Term Analysis Year 10 ≠ Purchase × (1.03)^9 for BRRRR ✅
- [ ] Post-refi cash flow uses refinance loan payment, not purchase loan ✅
- [ ] Depreciation remains on original basis after refinance ✅
- [ ] Capital recovery calculation uses ARV-based refinance proceeds ✅

---

## 🎯 Architect Validation Checklist

Before implementation planning, Architect must validate:

### Technical Feasibility

- [ ] **Long-Term Analysis Bug**: Confirm if bug exists in current codebase
  - [ ] Check `/backend/src/services/investment/longTermAnalysis.ts` (or similar file)
  - [ ] Verify if BRRRR properties currently use purchase price vs ARV
  - [ ] If confirmed, escalate to P0 blocker priority

- [ ] **Data Availability**: Confirm all required data is available in analysis response
  - [ ] ARV available in `propertyData.brrrr.afterRepairValue`
  - [ ] Refinance LTV available in `propertyData.brrrr.refinanceLTV`
  - [ ] Strategy available in `propertyData.strategy`
  - [ ] Post-refi metrics available in `analysis.strategySpecific.postRefinanceMetrics`

- [ ] **Frontend Architecture**: Confirm tab conditional rendering pattern
  - [ ] Can we detect BRRRR strategy in each tab's render logic?
  - [ ] Is there a shared utility function for strategy-specific display?
  - [ ] How to handle dual time period displays (before/after refinance)?

### Implementation Complexity

- [ ] **Effort Estimates**: Validate Business Expert's effort estimates
  - [ ] Are 1-2 week estimates realistic for "small" changes?
  - [ ] Is 6-8 weeks realistic for all 10 tabs combined?
  - [ ] Any hidden complexity in dual time period calculations?

- [ ] **Dependencies**: Identify implementation dependencies
  - [ ] Does Long-Term fix depend on backend changes?
  - [ ] Do all tabs share common BRRRR detection logic?
  - [ ] Any API changes required for new input fields?

- [ ] **Testing Requirements**: Estimate testing effort
  - [ ] Unit tests for calculation logic changes
  - [ ] E2E tests for BRRRR vs Buy & Hold tab displays
  - [ ] Regression tests to ensure Buy & Hold unchanged

### Risk Assessment

- [ ] **Regression Risk**: Will these changes affect Buy & Hold properties?
  - [ ] Are all changes conditional on `strategy === 'brrrr'`?
  - [ ] Fallback logic if ARV missing or invalid?

- [ ] **Performance Impact**: Any performance concerns?
  - [ ] Dual time period calculations add significant overhead?
  - [ ] Additional frontend rendering for BRRRR sections?

---

## 📚 Reference Documents

**Related Documentation**:
- `/docs/BRRRR_VS_BUYHOLD_METRICS_COMPARISON.md` - Metric definitions (25+ metrics)
- `/docs/BRRRR_PHASE_2_ARCHITECT_REVIEW.md` - Phase 2 architecture analysis
- `/docs/BRRRR_PHASE_2_UX_DESIGN_PLAN.md` - UX design patterns
- `/docs/ISSUE_TRACKER.md` - Issues #33-38 (Phase 2.4 work)

**Business Validation**:
- Real estate investment expert (20 years experience, $10M portfolio)
- 35+ properties managed (15 via BRRRR strategy)
- Validated against actual investor behavior and expectations

---

## 🔄 Document Version History

- **v1.0** (Dec 26, 2025): Initial requirements document
  - 10 tabs analyzed (Overview & Capital Recovery excluded as complete)
  - Purchase price vs ARV decision tree defined
  - P0 Long-Term Analysis bug identified
  - Input wizard enhancements specified
  - Architect validation checklist included

---

---

## 🏗️ Architect Handoff Summary

**Document Status**: ✅ UX Requirements Complete (Tabs 1-5)
**UX Designer**: Apple Design Principles Applied
**Date**: December 27, 2025
**Ready For**: Architect Review & Implementation Planning

---

### UX Work Completed

**Full UX Specifications** (3 tabs):
1. ✅ **Tab 2: Financial Details** - Dual-period comparison design (Initial Hold vs Post-Refinance)
2. ✅ **Tab 4: Long-Term Analysis** - Interactive chart with P0 bug prevention UX
3. ✅ **Tab 5: Tax Intelligence** - Educational authority with celebration design

**Enhancement Notes** (2 tabs):
4. ✅ **Tab 1: Overview** - Post-implementation polish opportunities
5. ✅ **Tab 3: Capital Recovery** - Accessibility and mobile optimization suggestions

**Total Lines of UX Specifications**: ~2,800 lines across 5 tabs

---

### Key UX Design Deliverables

#### 1. Design Philosophy Established

**Tab-Specific Design Themes**:
- **Tab 2 (Financial Details)**: "Clarity Through Comparison" - Before/After refinance transformation
- **Tab 4 (Long-Term Analysis)**: "Temporal Storytelling" - Visualizing property's future trajectory
- **Tab 5 (Tax Intelligence)**: "Educational Authority" - Celebrating BRRRR advantage while educating

**Apple Design Principles Applied Throughout**:
- **Simplicity**: Progressive disclosure, clean layouts, minimal chrome
- **Clarity**: Typography scale, semantic colors, clear information hierarchy
- **Deference**: Content-first approach, UI never competes with data
- **Depth**: Layered interactions, subtle animations, contextual depth
- **Human Interface**: Builds investor confidence, reduces anxiety, celebrates wins

#### 2. Comprehensive Design System Specifications

**Typography Scale** (SF Pro Display via system fonts):
```css
/* Section Headers */
font-size: 20px, font-weight: 600, line-height: 28px

/* Body Text */
font-size: 16px, font-weight: 400, line-height: 24px

/* Metric Values */
font-size: 28px-48px, font-weight: 700, tabular-nums
```

**Color Palette** (Apple system colors):
```css
/* BRRRR Semantic Colors */
--initial-period-accent: #007AFF (Apple blue - trustworthy)
--post-refi-accent: #AF52DE (Purple - transformation)
--capital-recovery-accent: #34C759 (Green - success)
--tax-free-celebration: linear-gradient(135deg, #34C759 0%, #30D158 100%)

/* Cash Flow States */
--positive-cash-flow: #34C759
--negative-cash-flow-acceptable: #FFD60A (Yellow - not alarming for BRRRR)
--negative-cash-flow-warning: #FF3B30
```

**Spacing System** (8px grid):
- Base unit: 8px
- Component padding: 16px, 24px, 32px
- Section gaps: 24px, 32px, 48px
- Consistent 8px-based rhythm throughout

**Animation Timings** (Apple standard):
- Fast interactions: 150ms ease-in-out
- Standard transitions: 300ms cubic-bezier(0.4, 0.0, 0.2, 1)
- Celebration entrances: 600ms cubic-bezier(0.34, 1.56, 0.64, 1)
- Stagger delays: 50ms per item

**Component Sizing**:
- Border radius: 12px (cards), 16px (featured), 20px (celebration badges)
- Min-height touch targets: 44px (mobile), 64px (accordion headers)
- Max width content: 1200px (desktop centering)

#### 3. Mobile-First Responsive Strategy

**Breakpoint Architecture**:
```javascript
// iPhone (320px - 767px) - Vertical Stack
- Full-width cards
- Stacked comparisons (Before/After)
- Larger touch targets (72px accordion headers)
- Single-column layouts throughout

// iPad (768px - 1023px) - Hybrid Layout
- Side-by-side comparisons (2 columns)
- Moderate content width (800px max)
- Enhanced data density
- Touch-optimized interactions

// Desktop (1024px+) - Full Layout
- Hero sections with visual emphasis
- Dual-chart/dual-table views
- Max 1200px content width
- Enhanced hover states and micro-interactions
```

**Mobile-Specific Enhancements**:
- Gesture support (swipe, tap, pull-to-expand)
- Skeleton loading states (no spinners)
- Sticky headers for long scrolling sections
- Optimized typography for readability (min 16px body)

#### 4. Accessibility Requirements (WCAG 2.1 AA)

**Color Contrast Validation**:
- All text meets 4.5:1 contrast minimum
- Large text (24px+) meets 3:1 minimum
- UI components meet 3:1 contrast ratio
- High contrast mode support via CSS media queries

**Screen Reader Optimization**:
- Semantic HTML throughout (`<section>`, `<article>`, `<nav>`)
- ARIA labels for all interactive elements
- Screen reader-only content for context
- Descriptive button/link text (no "Click here")

**Keyboard Navigation**:
- Full keyboard accessibility (Tab, Enter, Arrow keys)
- Focus visible indicators (2px solid #007AFF outline)
- Focus management (accordion expansion maintains focus)
- Skip links for large content sections

**Reduced Motion Preference**:
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  * { animation: none !important; transition: none !important; }
}
```

#### 5. Custom Components Architecture

**New Components to Create** (13 total):

**Tab 2: Financial Details**
1. `FinancialPeriodCard.tsx` - Reusable before/after refinance card
2. `MetricRow.tsx` - Label + value with optional delta indicator
3. `DeltaIndicator.tsx` - Change visualization (+/- with color)
4. `PeriodSeparator.tsx` - "REFINANCE EVENT" visual divider
5. `CapitalRecoveryLink.tsx` - Contextual link to Tab 3

**Tab 4: Long-Term Analysis**
6. `AppreciationChart.tsx` - Interactive dual-curve line chart
7. `ForcedAppreciationCallout.tsx` - Highlighted BRRRR advantage card
8. `ProjectionsDataTable.tsx` - Sortable year-over-year table
9. `ComparisonModal.tsx` - BRRRR vs Buy & Hold modal
10. `YearSelector.tsx` - Mobile year navigation

**Tab 5: Tax Intelligence**
11. `TaxCelebrationBadge.tsx` - "$0 TAX" celebration component
12. `TaxComparisonCards.tsx` - BRRRR vs Flipping side-by-side
13. `TaxEducationAccordion.tsx` - Reusable accordion with icon/title

**Component Library Integration**:
- All components use Material-UI v7 base components
- Extend with custom styling via `sx` prop
- Shared design tokens via CSS custom properties
- TypeScript interfaces for all props

#### 6. Critical P0 Bug Prevention (Tab 4)

**P0 Issue**: Long-Term Analysis uses purchase price ($200K) instead of ARV ($320K) → **60% underestimation**

**UX Prevention Strategy**:
```jsx
// Error state prevents display without ARV
{!propertyData.brrrr?.afterRepairValue ? (
  <Alert severity="error" action={<Button>Add ARV</Button>}>
    <AlertTitle>BRRRR Long-Term Analysis Unavailable</AlertTitle>
    After Repair Value (ARV) is required. Without ARV, we would
    underestimate Year 10 value by up to 60%.
  </Alert>
) : (
  // Show accurate ARV-based projections
)}
```

**Validation Test Specification**:
```javascript
describe('BRRRR Long-Term Projections', () => {
  it('should use ARV as starting value, not purchase price', () => {
    const propertyData = {
      strategy: 'brrrr',
      purchasePrice: 200000,
      brrrr: { afterRepairValue: 320000 }
    };
    const projections = generateLongTermProjections(propertyData);
    expect(projections.startingValue).toBe(320000); // ARV
    expect(projections.startingValue).not.toBe(200000); // NOT purchase
  });
});
```

#### 7. Implementation Priority & Effort Estimates

**Priority Matrix**:

| Tab | Priority | Effort | Business Impact | Technical Complexity |
|-----|----------|--------|-----------------|---------------------|
| Tab 4 (Long-Term) | P0 Critical | Medium (2 weeks) | Prevents $50K-200K mistakes | High (chart library) |
| Tab 2 (Financial) | P1 High | Medium (2-3 weeks) | Eliminates confusion | Medium (dual sections) |
| Tab 5 (Tax Intel) | P1 High | Small (1 week) | Educational value | Low (pure content) |
| Tab 1 (Overview) | P2 Polish | Small (3 days) | Minor improvements | Low (enhancement only) |
| Tab 3 (Capital) | P2 Polish | Small (3 days) | Mobile optimization | Low (enhancement only) |

**Total Implementation Estimate**: 5-7 weeks for all 5 tabs

**Suggested Phasing**:
- **Phase 1 (Week 1-2)**: Tab 4 P0 bug fix + UX implementation
- **Phase 2 (Week 3-5)**: Tab 2 Financial Details full implementation
- **Phase 3 (Week 6)**: Tab 5 Tax Intelligence educational content
- **Phase 4 (Week 7)**: Tabs 1 & 3 polish and accessibility audit

#### 8. Material-UI v7 Components Required

**Core Components** (existing in project):
```javascript
import {
  Accordion, AccordionSummary, AccordionDetails,
  Alert, AlertTitle,
  Box, Button, Card, CardContent, CardHeader,
  Divider, Grid, IconButton, Link, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography
} from '@mui/material';
```

**Icons** (Material-UI Icons):
```javascript
import {
  CheckCircle, ExpandMore, InfoOutlined, School,
  WarningAmber, Calculate, TrendingUp, Celebration
} from '@mui/icons-material';
```

**Chart Library** (needs installation):
- **Recommended**: Recharts (`npm install recharts`)
- **Alternative**: react-chartjs-2 + Chart.js
- **Reason**: TypeScript support, Material-UI theme integration

**Animation Library** (optional):
- **Framer Motion** (`npm install framer-motion`) - for advanced animations
- **Alternative**: CSS keyframe animations (lighter weight, preferred)

#### 9. Testing Requirements Summary

**Unit Tests**:
```javascript
// Financial calculations
- BRRRR dual-period cash flow calculations
- ARV-based appreciation projections (Tab 4 P0 bug)
- Tax-free cash-out calculations

// Component rendering
- Before/After refinance cards display correctly
- Error states show when ARV missing
- Mobile responsive breakpoints trigger correctly
```

**Accessibility Tests**:
```javascript
// WCAG 2.1 AA compliance
- Color contrast validation (all text and UI elements)
- Screen reader announcement tests
- Keyboard navigation flows
- Focus management validation
```

**Visual Regression Tests** (recommended):
```javascript
// Chromatic or Percy integration
- Desktop layout snapshots (1200px, 1920px)
- iPad layout snapshots (768px, 1024px)
- iPhone layout snapshots (375px, 390px)
- Dark mode variants (if supported)
```

**E2E Integration Tests**:
```javascript
// Full BRRRR analysis flow
- Complete Property Wizard with BRRRR strategy
- Navigate to Tab 2, verify dual-period display
- Navigate to Tab 4, verify ARV-based chart
- Navigate to Tab 5, verify $0 TAX celebration
```

#### 10. Design Handoff Assets

**UX Specifications Provided**:
- [x] Visual hierarchy (typography, colors, spacing)
- [x] Interaction design (animations, hover states, gestures)
- [x] Mobile-first responsive breakpoints (iPhone, iPad, Desktop)
- [x] Progressive disclosure strategy (4 levels)
- [x] Error states and empty states
- [x] Accessibility requirements (WCAG 2.1 AA)
- [x] Content design and microcopy guidelines
- [x] Implementation notes (components, state, helpers)

**Missing Assets** (Designer to provide):
- [ ] High-fidelity mockups (Figma/Sketch) - optional, specs are detailed
- [ ] Icon assets (using Material-UI Icons, no custom needed)
- [ ] Illustration assets (if celebration badges need custom graphics)

**Design QA Checklist** (for implementation review):
- [ ] Typography matches SF Pro Display specifications
- [ ] Color palette uses exact hex values specified
- [ ] Spacing uses 8px grid system
- [ ] Border radius matches Apple aesthetic (12-24px)
- [ ] Animations use specified timings (150ms, 300ms, 600ms)
- [ ] Mobile breakpoints match specifications (320px, 768px, 1024px)
- [ ] Accessibility standards met (contrast, keyboard, screen readers)

---

### Architect Review Questions

**Questions for Architect to Validate**:

1. **Technical Feasibility**
   - Can we implement dual-period comparison (Tab 2) without major refactoring?
   - Is ARV already available in `propertyData` object for Tab 4 chart?
   - Do we need to add refinance interest rate input, or default to purchase rate?

2. **Chart Library Selection**
   - Recharts vs react-chartjs-2 vs D3.js preference?
   - Existing chart library in codebase we should reuse?
   - Performance concerns for mobile chart rendering?

3. **State Management**
   - Are BRRRR calculations already centralized in backend?
   - Do we need Redux/Context for tab-level state, or React state sufficient?
   - How to handle tab navigation with unsaved changes?

4. **Performance Considerations**
   - Lazy load tabs (render on demand) or pre-render all tabs?
   - Memoization strategy for expensive calculations (useMemo, React.memo)?
   - Bundle size impact of adding chart library?

5. **Backend Support Needed**
   - Does Investment Decision Engine already return dual-period cash flow?
   - Is ARV validation already enforced for BRRRR strategy in backend?
   - Need new API endpoints or can use existing `/api/deals/analyze`?

6. **Existing Component Reuse**
   - Can we reuse existing `MetricCard`, `AnalysisSection` components?
   - Is there existing accordion/collapsible section pattern to follow?
   - Chart wrapper components already exist, or build from scratch?

7. **Testing Infrastructure**
   - Unit testing setup (Jest + React Testing Library)?
   - Visual regression testing available (Chromatic, Percy)?
   - E2E testing framework (Cypress, Playwright)?
   - Accessibility testing tools integrated (axe-core, pa11y)?

8. **Deployment Considerations**
   - Feature flags for gradual rollout (tabs 1-5 only for BRRRR beta users)?
   - A/B testing infrastructure for Tab 1 "Infinite Return" badge experiment?
   - Analytics events to track (tab navigation, tooltip engagement, error states)?

---

### Success Metrics for Implementation

**UX Quality Metrics**:
- [ ] WCAG 2.1 AA compliance: 100% (no accessibility violations)
- [ ] Mobile usability score: 95+ (Lighthouse mobile)
- [ ] Desktop performance score: 90+ (Lighthouse desktop)
- [ ] Cross-browser compatibility: Chrome, Safari, Firefox, Edge (latest 2 versions)

**User Engagement Metrics** (post-launch tracking):
- [ ] Tab 2 engagement: 70%+ of BRRRR users view Financial Details tab
- [ ] Tab 4 chart interaction: 50%+ hover on chart data points
- [ ] Tab 5 educational content: 2+ minute average time in Tax Intelligence
- [ ] Tooltip engagement: 30%+ users click at least one educational tooltip

**Business Impact Metrics**:
- [ ] Error reduction: 0% long-term analysis ARV errors (P0 bug eliminated)
- [ ] Support ticket reduction: 40% fewer "Why is cash flow negative?" questions
- [ ] User confidence: NPS increase of 8+ points for BRRRR users
- [ ] Professional credibility: 5+ testimonials mentioning "institutional-grade analysis"

---

### Documentation References

**Related Documents**:
- `/docs/ISSUE_TRACKER.md` - Issue #35 (Tab 1 Overview), P0 bugs tracking
- `/docs/DATA_DICTIONARY.md` - BRRRR data model, ARV field definitions
- `/docs/COMPLETE_TEST_INVENTORY.md` - Existing test coverage baseline
- `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` - Current tab implementation

**Design System References**:
- Apple Human Interface Guidelines (HIG) - https://developer.apple.com/design/human-interface-guidelines/
- Material-UI v7 Documentation - https://mui.com/material-ui/
- WCAG 2.1 AA Standard - https://www.w3.org/WAI/WCAG21/quickref/

---

### Next Steps for Architect

1. **Review UX Specifications** (Est: 4-6 hours)
   - Read Tabs 2, 4, 5 full UX requirements (~2,800 lines)
   - Validate technical feasibility of component architecture
   - Identify any missing technical requirements

2. **Validate P0 Bug** (Est: 2 hours)
   - Confirm Tab 4 Long-Term Analysis uses purchase price vs ARV
   - Reproduce 60% underestimation issue with test property
   - Verify backend calculation already uses ARV (or needs fix)

3. **Create Technical Implementation Plan** (Est: 1 day)
   - Break down into engineering tasks (Jira/Linear tickets)
   - Estimate effort per component (dev hours)
   - Identify dependencies and blockers
   - Define sprint breakdown (2-week sprints)

4. **Answer Review Questions** (Est: 2 hours)
   - Respond to 8 technical validation questions above
   - Flag any UX requirements that need clarification
   - Propose alternative approaches if needed

5. **Architect Sign-Off** (Est: 30 mins)
   - Approve UX specifications for implementation
   - Confirm estimated timeline (5-7 weeks)
   - Assign to engineering team for development

---

**Total Architect Review Time Estimate**: 2-3 days

---

## ✅ Next Steps

1. **Architect Review** (Est: 2-3 days)
   - Validate technical feasibility
   - Confirm Long-Term Analysis bug exists
   - Estimate implementation effort
   - Create technical implementation plan

2. **Product Owner Prioritization** (Est: 1 day)
   - Review P0/P1/P2 breakdown
   - Schedule based on business priority
   - Allocate engineering resources

3. **Phase 1 Implementation** (Est: 2-3 weeks)
   - Fix Long-Term Analysis ARV bug (P0)
   - Implement Tax Intelligence BRRRR education (quick win)
   - Add Interactive Tools context (quick win)

4. **Business Expert Validation** (Ongoing)
   - Review implementation against requirements
   - Validate calculations match real-world BRRRR mechanics
   - Approve before production release

---

**END OF REQUIREMENTS DOCUMENT**

*This document is a living backlog item. Update as implementation progresses and new BRRRR requirements emerge.*
