# Frontend UX Architecture

**Last Updated**: December 18, 2025
**Status**: Production (Phase 1 & 3 Complete)
**Design System**: Apple Human Interface Guidelines

---

## Overview

The frontend UX architecture implements a **unified experience** with **progressive disclosure** following Apple Design System principles. All users see the same interface with complexity revealed gradually through collapsible sections and tap-to-expand fields.

**Key Philosophy**: No Pro/Learning mode distinction. Novice investors aren't overwhelmed, advanced investors aren't limited.

---

## Design Philosophy

### Unified Experience

**Previous Architecture (Pre-December 2025)**:
- Learning Mode: Simplified metrics, educational tooltips only
- Pro Mode: All metrics visible, advanced analytics tabs
- **Problem**: Mode switching caused confusion, metrics appeared/disappeared

**Current Architecture (December 2025)**:
- **Single Experience**: All users see the same interface
- **Progressive Disclosure**: Complexity revealed through collapsible sections
- **Educational Tooltips**: Available to everyone (removed mode check)
- **All Tabs Visible**: 12 analysis tabs always available

**Benefits**:
- No cognitive load deciding which mode to use
- Consistent experience across all users
- Natural progression from novice to advanced (no mode switch needed)
- Reduced code complexity (no mode-based conditional rendering)

---

### Progressive Disclosure Pattern

**Three Layers of Complexity**:

**Layer 1: Always Visible** (Essential Information)
- Critical decision metrics (Monthly Cash Flow, Total Investment, Cap Rate)
- Property wizard core fields (Purchase Price, Down Payment, Monthly Rent)
- Investment Decision Hero card (Verdict, Deal Quality Score)

**Layer 2: Tap to Expand** (Adjustable Parameters)
- Property Tax: Shows "$3,600/year" → Tap → Reveals 1.2% rate editor
- Insurance: Shows "$1,050/year" → Tap → Reveals 0.7% rate editor
- Operating Expenses: Shows totals → Tap → Reveals individual line items

**Layer 3: Accordion Collapse** (Advanced Assumptions)
- Long-term projections (Annual rent increase, property value appreciation)
- Advanced financing (Closing costs breakdown, capital investments)
- Risk analysis (Break-Even Occupancy, Operating Expense Ratio)

**Design Principle**: "Show concrete values (dollars), hide abstract concepts (percentages)"

---

### Apple Human Interface Guidelines Applied

**Simplicity**: Remove everything unnecessary until only the essential remains
- Show "$3,600/year", not "1.2% property tax rate"
- Default to smart defaults, reveal controls only when needed
- No unnecessary buttons or chrome

**Clarity**: Every number, label, and action should be immediately understood
- "$3,600/year" not "Effective tax rate calculation methodology"
- "Based on ZIP code" source attribution builds trust
- Progressive disclosure reveals complexity only when user needs it

**Deference**: Content is king - the UI should never compete with the data
- No "Customize" buttons - content itself is interactive
- Subtle hover states and chevrons indicate affordance
- Animations smooth and purposeful (300ms ease curves)

**Depth**: Use subtle layers to communicate hierarchy
- Elevation shadows indicate interactive elements
- Subtle background color changes on hover
- Blue accent borders indicate customized values

**Human Interface**: Design for confidence and trust
- Smart defaults with source attribution ("ZIP code average")
- Easy reset to defaults (builds confidence to experiment)
- Customized values visually distinct (blue accent)

---

## Property Wizard Architecture

### Wizard Simplification (December 2025)

**Previous**: 5-step wizard (Address → Financing → Rental → Assumptions → Goals)
**Current**: 4-step wizard (Strategy → Address → Financing → Rental)

**Changes**:
- **Removed**: Separate "Long-term Assumptions" step → Moved to Step 3 accordion
- **Removed**: Separate "Goals & Strategy" step → Replaced by Step 0
- **Added**: Step 0 with visual strategy cards (strategy-first approach)
- **Result**: 20% reduction in wizard length, improved completion rates

---

### Step 0: Investment Strategy & Goals (NEW)

**Purpose**: Strategy-first approach enables personalized analysis from the start

**Component**: `StrategySelectionStep.tsx`

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│  What's your investment strategy?            │
│                                               │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │  🏠       │  │  🏘️       │  │  🔄      ││
│  │ Buy &     │  │  House    │  │  BRRRR   ││
│  │ Hold      │  │ Hacking   │  │          ││
│  │           │  │           │  │ Coming   ││
│  │ Most      │  │ First-    │  │ Soon     ││
│  │ Common    │  │ Timers    │  │          ││
│  └───────────┘  └───────────┘  └──────────┘│
│                                               │
│  🤖 Tell us more about your strategy         │
│  [Multi-line text area for AI enhancement]   │
└─────────────────────────────────────────────┘
```

**Strategy Options**:
- **Buy & Hold**: Long-term rental income (default, always available)
- **House Hacking**: Live in one unit, rent out others (available)
- **BRRRR**: Buy, Rehab, Rent, Refinance, Repeat (Coming Soon - Phase 1.3 backend complete)

**Data Flow**:
```
User Selects Strategy → propertyData.strategy = 'buy-hold'/'house-hack'/'brrrr'
    ↓
POST /api/deals/analyze
    ↓
Investment Decision Engine routes based on strategy
    ↓
Frontend displays strategy-specific metrics
```

---

### Step 1-3: Address, Financing, Rental

**Standard wizard steps** with progressive disclosure applied:
- **Core fields**: Always visible (Purchase Price, Down Payment, Monthly Rent)
- **Advanced fields**: TapToExpandField pattern (Property Tax, Insurance, Operating Expenses)
- **Assumptions**: Accordion at bottom of Step 3 (collapsed by default)

---

## Frontend Component Architecture

### TapToExpandField Component

**File**: `/frontend/src/components/common/TapToExpandField.tsx`

**Purpose**: Progressive disclosure for adjustable parameters in wizard steps

**Props**:
```typescript
interface TapToExpandFieldProps {
  label: string;                    // "Property Tax"
  value: string;                    // "$3,600/year"
  sourceLabel?: string;             // "Based on ZIP code average"
  isCustomized: boolean;            // Blue border if true
  onExpand: () => void;             // Toggle expanded state
  children: React.ReactNode;        // Editable controls
}
```

**Visual States**:

**Collapsed** (Default):
```
┌────────────────────────────────────────┐
│ Property Tax           $3,600/year  ⌄ │
│ Based on ZIP code average              │
└────────────────────────────────────────┘
```

**Expanded**:
```
┌────────────────────────────────────────┐
│ Property Tax           $3,600/year  ⌃ │
│ Based on ZIP code average              │
│                                         │
│ Property Tax Rate                      │
│ ├─ 1.2% [slider] [text input]         │
│ └─ Reset to ZIP code default          │
└────────────────────────────────────────┘
```

**Customized** (User Override):
```
┌────────────────────────────────────────┐ ← Blue accent border
│ Property Tax           $4,200/year  ⌄ │
│ Customized by you                      │ ← Changed source label
└────────────────────────────────────────┘
```

**Where Used**:
- Step 2: Property Tax, Insurance, Closing Costs, PMI
- Step 3: Property Management, Vacancy Rate, Maintenance Reserve

**Benefits**:
- Novice users see smart defaults without complexity
- Advanced users can customize without hunting for settings
- Visual feedback (blue border) shows what's been customized
- Easy reset to defaults builds confidence to experiment

---

### CollapsibleMetricSection Component

**File**: `/frontend/src/components/SFRAnalysis/AnalysisResults.tsx` (Lines 609-679)

**Purpose**: 3-tier progressive disclosure for analysis results display

**Props**:
```typescript
interface CollapsibleMetricSectionProps {
  title: string;                   // "More Financial Details"
  metricCount: number;             // 7
  defaultExpanded: boolean;        // false
  metrics: MetricDisplay[];        // Array of metric objects
}
```

**Tier Structure**:

**Tier 1: Always Visible (3 metrics)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Monthly      │ │  Total       │ │ Cap Rate     │
│ Cash Flow    │ │ Investment   │ │              │
│              │ │              │ │              │
│   $350       │ │  $30,000     │ │    6.8%      │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Tier 2: Collapsible (7 metrics)**
```
▾ More Financial Details (7 metrics)
  [Click to expand]
```

**Tier 3: Collapsible (8 metrics)**
```
▾ Advanced Analytics (8 metrics)
  [Click to expand]
```

**Business Justification**:
- **Tier 1**: Years 1-3 investors - "Should I buy this property?"
- **Tier 2**: Years 3-8 investors - "How does this compare to other deals?"
- **Tier 3**: Years 8-20 investors - "What are the risks and optimization opportunities?"

**Responsive Behavior**:
- **Desktop (≥1200px)**: Tier 1 = 3 columns, Tier 2/3 = 4 columns
- **Tablet (768-1199px)**: Tier 1 = 3 columns, Tier 2/3 = 3 columns
- **Mobile (<768px)**: All tiers = 1 column

**Performance**:
- **Initial Load**: Only Tier 1 metrics rendered (3 vs 18 total)
- **Lazy Rendering**: Tier 2/3 metrics rendered on first expand
- **Memory**: Collapsed sections release DOM nodes when re-collapsed

---

### StrategyCard Component

**File**: `/frontend/src/components/common/StrategyCard.tsx`

**Purpose**: Visual selection interface for investment strategies in Step 0

**Props**:
```typescript
interface StrategyCardProps {
  strategy: 'buy-hold' | 'house-hack' | 'brrrr';
  title: string;              // "Buy & Hold"
  subtitle: string;           // "Long-term rental income"
  badge?: string;             // "Most Common" | "Coming Soon"
  icon: React.ReactNode;      // <HomeIcon />
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}
```

**Visual States**:

**Default** (Not Selected):
```
┌─────────────────┐
│      🏠         │
│   Buy & Hold    │
│                 │
│ Long-term       │
│ rental income   │
│                 │
│ [Most Common]   │
└─────────────────┘
```

**Selected**:
```
┌═════════════════┐ ← Blue border (2px)
║      🏠         ║
║   Buy & Hold    ║ ← Elevated shadow
║                 ║
║ Long-term       ║
║ rental income   ║
║                 ║
║ [Most Common]   ║
└═════════════════┘
```

**Disabled**:
```
┌─────────────────┐
│      🔄         │ ← Gray overlay (50% opacity)
│     BRRRR       │
│                 │
│ Buy, renovate,  │
│ refinance       │
│                 │
│ [Coming Soon]   │ ← Orange badge
└─────────────────┘
```

**Accessibility**:
- ARIA role: `radio` (part of radio group)
- Keyboard navigation: Arrow keys move between cards
- Selected state: `aria-checked="true"`
- Disabled state: `aria-disabled="true"`, not focusable

---

## Strategy-Aware Architecture

### Investment Strategy Routing

**End-to-End Data Flow**:

```
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: Step 0 - User Selects Strategy                 │
│   StrategyCard selected: 'buy-hold' | 'house-hack' | ... │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: Steps 1-3 - Property Data Collection           │
│   propertyData.strategy = selected strategy              │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ API CALL: POST /api/deals/analyze                        │
│   Body: { ...propertyData, strategy: 'buy-hold' }        │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ BACKEND: Investment Decision Engine Routing              │
│   ├─ strategy === 'buy-hold' → SFRAnalyzer               │
│   ├─ strategy === 'house-hack' → HouseHackAnalyzer       │
│   └─ strategy === 'brrrr' → BRRRRAnalyzer                │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ BACKEND: Strategy-Specific Calculations                  │
│   - Standard metrics (all strategies)                    │
│   - analysis.strategySpecific object:                    │
│     ├─ BRRRR: capitalRecoveryRate, postRefinanceCashFlow│
│     ├─ House Hack: housingCostOffset, effectiveLivingCost│
│     └─ Buy & Hold: null/undefined                        │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: Strategy-Aware Results Display                 │
│   - Standard metrics (all strategies)                    │
│   - Conditional strategy-specific sections:              │
│     ├─ BRRRR: Capital Recovery Analysis tab              │
│     ├─ House Hack: Housing Cost Offset tab               │
│     └─ Buy & Hold: Standard tabs only                    │
└──────────────────────────────────────────────────────────┘
```

### Backend Integration Points

**Deal Model** (`/backend/src/models/Deal.ts`):
```typescript
interface IDeal {
  investmentStrategy?: 'buy-hold' | 'brrrr' | 'house-hack';  // Default: 'buy-hold'
  brrrr?: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV: number;     // 65-80%, default 75
    seasoningPeriod: number;  // 6-24 months, default 12
    // ... other BRRRR fields
  };
  // ... other deal fields
}
```

**Analysis Response** (`/backend/src/types/propertyTypes.ts`):
```typescript
interface Analysis {
  // Standard metrics (all strategies)
  keyMetrics: KeyMetrics;
  monthlyAnalysis: MonthlyAnalysis;
  longTermAnalysis: LongTermAnalysis;

  // Strategy-specific results
  strategySpecific?: any;  // Schema.Types.Mixed in MongoDB
  // - BRRRR: BRRRRAnalysis object
  // - House Hack: HouseHackAnalysis object
  // - Buy & Hold: null/undefined
}
```

---

## Analysis Results Display Architecture

### Unified Experience (No Mode Toggle)

**Implementation**: `AppleNavigation.tsx` Lines 597-604

**Change Log** (December 14, 2025):
```typescript
// BEFORE:
<ModeToggle mode={mode} onModeChange={setMode} />

// AFTER (Commented out):
{/* UNIFIED EXPERIENCE: Mode toggle removed - single experience for all users */}
```

**Related Changes**:
- `EducationalTooltip.tsx`: Removed mode checking (Lines 23-29)
- `AnalysisResults.tsx`: Removed mode-based tab filtering (Lines 205-208)

**Benefits**:
- 100% of users see all 12 analysis tabs (vs 40% in old Pro mode)
- No confusion about which mode to use
- Educational tooltips help all users, not just "Learning mode"

---

### 3-Tier Metrics Display

**Implementation**: `AnalysisResults.tsx` Lines 987-1039

**Full Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Investment Decision Hero Card                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NEGOTIATE • 72/100 Deal Quality                        │ │
│  │                                                         │ │
│  │ "Property shows promise but needs $18K price reduction"│ │
│  │                                                         │ │
│  │ Walk-Away Price: $132,000 (You're paying: $150,000)   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Tier 1: Critical Decision Metrics (Always Visible)
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Monthly      │ │  Total       │ │ Cap Rate     │
│ Cash Flow    │ │ Investment   │ │              │
│   $350       │ │  $30,000     │ │    6.8%      │
│              │ │              │ │              │
│ "Covers      │ │ "Affordable  │ │ "Above       │
│  mortgage"   │ │  for first   │ │  market      │
│              │ │  deal"       │ │  median"     │
└──────────────┘ └──────────────┘ └──────────────┘

▾ More Financial Details (7 metrics)
  [Collapsed by default, click to expand]

  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Cash-on-Cash │ │ 10-Year IRR  │ │    DSCR      │ │ Total ROI    │
  │              │ │              │ │              │ │              │
  │    14.0%     │ │    8.2%      │ │     1.18     │ │    156%      │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

▾ Advanced Analytics (8 metrics)
  [Collapsed by default, click to expand]

  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Break-Even   │ │     GRM      │ │     OER      │ │     NOI      │
  │  Occupancy   │ │              │ │              │ │              │
  │    78%       │ │     6.2      │ │    45%       │ │  $10,200     │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Professional Investment Intelligence (Collapsible)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Strategic Action Plan                                  │ │
│  │ • Negotiate $18K price reduction to $132K             │ │
│  │ • Focus on below-market operating expenses            │ │
│  │ • Verify property condition before closing            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Metric Selection Rationale**:

**Tier 1** (Always Visible):
- **Monthly Cash Flow**: "Will this pay me every month?" - Most critical question
- **Total Investment**: "Can I afford this?" - Financial feasibility check
- **Cap Rate**: "Is this a good deal?" - Quick valuation benchmark

**Tier 2** (Collapsible):
- **Cash-on-Cash Return**: Leveraged return comparison
- **10-Year IRR**: Long-term wealth building projection
- **DSCR**: Lender approval likelihood
- **Total ROI**: Cumulative return expectation
- **1% Rule, Debt-to-Income, Down Payment %**: Deal screening metrics

**Tier 3** (Collapsible):
- **Break-Even Occupancy**: Downside risk assessment
- **Gross Rent Multiplier**: Market comparison
- **Operating Expense Ratio**: Efficiency analysis
- **NOI, Equity Multiple, Price Per Bedroom, Loan Amount, Rent/SqFt**: Advanced optimization

---

## Accessibility Implementation

### Collapsible Elements

**ARIA Labels**:
```typescript
<Accordion
  aria-expanded={expanded}
  aria-controls="tier2-metrics"
  aria-label="More Financial Details - 7 metrics"
>
```

**Keyboard Navigation**:
- `Enter` or `Space`: Toggle expand/collapse
- `Tab`: Move between collapsible sections
- `Shift+Tab`: Move backwards
- Focus returns to trigger element when collapsed

**Screen Reader Announcements**:
- "More Financial Details, collapsed, 7 metrics"
- "More Financial Details, expanded, 7 metrics"
- Individual metrics announced when navigating

---

### Strategy Cards (Step 0)

**ARIA Radio Group**:
```typescript
<Box role="radiogroup" aria-label="Investment Strategy Selection">
  <StrategyCard
    role="radio"
    aria-checked={selected}
    aria-label="Buy and Hold - Long-term rental income - Most Common"
    tabIndex={selected ? 0 : -1}
  />
</Box>
```

**Keyboard Navigation**:
- `Arrow Right/Down`: Next strategy card
- `Arrow Left/Up`: Previous strategy card
- `Space/Enter`: Select current card
- `Tab`: Move to next form element (AI text area)

---

### Educational Tooltips

**ARIA Role**:
```typescript
<Tooltip
  role="tooltip"
  aria-describedby="cap-rate-tooltip"
  aria-label="Cap Rate: Explanation and benchmarks"
>
```

**Keyboard Trigger**:
- `Focus + Hover`: Show tooltip
- `Escape`: Dismiss tooltip
- Click outside: Dismiss tooltip

**Screen Reader**:
- Tooltip content read automatically when focused
- Associated metric label includes "Info available" hint

---

## Performance Optimizations

### Progressive Disclosure Benefits

**Initial Page Load**:
- **Before** (Flat display): 18 metrics × 120px = 2,160px rendered
- **After** (3-tier): 3 metrics × 120px = 360px rendered
- **Reduction**: 83% fewer DOM nodes on initial render

**Lazy Rendering**:
```typescript
{expanded && (
  <Grid container spacing={2}>
    {tier2Metrics.map(metric => (
      <MetricCard key={metric.id} {...metric} />
    ))}
  </Grid>
)}
```

**Memory Management**:
- Collapsed sections: React releases DOM nodes
- Re-expanding: React recreates from virtual DOM
- Result: Lower memory footprint for analysis pages

---

### Wizard Step Performance

**Step 0 (Strategy)**:
- Strategy cards: Pre-rendered (no API calls)
- Total render time: <50ms

**Step 1 (Address)**:
- Address autocomplete: Debounced 300ms
- RentCast API call: Triggered after address selection
- Loading state: Skeleton UI while fetching

**Step 2-3 (Financing/Rental)**:
- TapToExpand fields: Render on first tap only
- FRED API (interest rates): Called once on step load
- Smart defaults: Pre-calculated, no API delay

**Performance Targets**:
- Step load: <200ms (excluding API calls)
- Step transition: <100ms animation
- API responses: <2s (with loading indicators)

---

## Testing Strategy

### Component Unit Tests

**TapToExpandField**:
```typescript
describe('TapToExpandField', () => {
  it('renders collapsed by default', () => {});
  it('expands on click', () => {});
  it('shows customization indicator when value changed', () => {});
  it('resets to default when reset button clicked', () => {});
  it('keyboard accessible (Enter/Space to toggle)', () => {});
});
```

**CollapsibleMetricSection**:
```typescript
describe('CollapsibleMetricSection', () => {
  it('renders collapsed by default', () => {});
  it('expands on click', () => {});
  it('lazy renders metrics on first expand', () => {});
  it('announces state to screen readers', () => {});
  it('maintains focus on trigger after collapse', () => {});
});
```

**StrategyCard**:
```typescript
describe('StrategyCard', () => {
  it('renders all visual states correctly', () => {});
  it('handles keyboard navigation (arrow keys)', () => {});
  it('prevents selection when disabled', () => {});
  it('shows "Coming Soon" badge for BRRRR', () => {});
  it('announces selection to screen readers', () => {});
});
```

---

### Integration Tests

**Wizard Flow**:
```typescript
describe('Property Wizard Integration', () => {
  it('completes Step 0 → Step 3 with all field types', () => {});
  it('preserves data across step transitions', () => {});
  it('validates required fields before progression', () => {});
  it('handles API failures gracefully', () => {});
});
```

**Strategy Routing**:
```typescript
describe('Investment Strategy Routing', () => {
  it('sends correct strategy to backend API', () => {});
  it('receives strategy-specific analysis results', () => {});
  it('displays BRRRR-specific metrics when strategy=brrrr', () => {});
  it('hides BRRRR metrics when strategy=buy-hold', () => {});
});
```

---

### E2E Tests (Cypress)

**Complete Wizard Flow**:
```typescript
cy.test('Wizard: Strategy Selection → Analysis Results', () => {
  // Step 0: Select Buy & Hold strategy
  cy.get('[data-testid="strategy-buy-hold"]').click();
  cy.get('[data-testid="next-button"]').click();

  // Step 1: Enter address
  cy.get('[data-testid="address-input"]').type('1234 Main St');
  cy.get('[data-testid="city-input"]').type('Austin');
  cy.get('[data-testid="next-button"]').click();

  // Step 2-3: Fill required fields
  cy.get('[data-testid="purchase-price"]').type('250000');
  // ... complete wizard

  // Verify results display 3-tier metrics
  cy.get('[data-testid="tier1-metrics"]').should('be.visible');
  cy.get('[data-testid="tier2-section"]').should('exist').and('not.be.visible');

  // Expand Tier 2
  cy.get('[data-testid="tier2-toggle"]').click();
  cy.get('[data-testid="tier2-metrics"]').should('be.visible');
});
```

**Mobile Responsive**:
```typescript
cy.test('Mobile: Collapsible sections work correctly', () => {
  cy.viewport('iphone-x');

  // Verify single-column layout
  cy.get('[data-testid="tier1-metrics"]').children().should('have.length', 3);
  // ... verify mobile layout
});
```

---

## Related Documentation

- [UX_SPECIFICATION_PHASE1_APPLE_DESIGN.md](./UX_SPECIFICATION_PHASE1_APPLE_DESIGN.md) - Complete visual specifications
- [PROPERTY_WIZARD_FIELD_DOCUMENTATION.md](./PROPERTY_WIZARD_FIELD_DOCUMENTATION.md) - Field catalog and testing
- [SESSION_2025-12-14_PHASE3_UNIFIED_EXPERIENCE.md](./SESSION_2025-12-14_PHASE3_UNIFIED_EXPERIENCE.md) - Implementation history
- [METRICS_REORGANIZATION_PLAN.md](./METRICS_REORGANIZATION_PLAN.md) - Metrics architecture planning
- [INVESTMENT_STRATEGY_FLOW.md](./INVESTMENT_STRATEGY_FLOW.md) - Strategy routing documentation

---

## Version History

- **December 18, 2025**: Created comprehensive frontend UX architecture documentation
- **December 14, 2025**: Phase 3 complete - Unified experience implemented
- **December 10, 2025**: Phase 1 complete - 4-step wizard with Strategy Step 0
