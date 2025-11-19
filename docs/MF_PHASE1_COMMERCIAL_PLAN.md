# Multi-Family Phase 1: Commercial MF (5+ Units) Implementation Plan

**Document Version**: 1.0
**Date**: November 8, 2025
**Author**: Business Expert (Real Estate Investment Expert)
**Approved By**: Product Owner (Parth Patel)
**Status**: ✅ READY FOR IMPLEMENTATION

---

## Executive Summary

**Decision**: Launch MF feature focused on **commercial multi-family (5+ units)** only
**Timeline**: 3-4 weeks (ship right, not fast)
**Scope**: 3 building types (GARDEN, MID_RISE, COMPLEX)
**Excluded**: 2-4 unit properties (redirect to SFR analyzer), high-rise, townhouse, stacked, mixed-use

---

## The Three Questions - Business Expert Answers

### Question 1: Should Calculations Be Different Based on Building Type?

**Answer**: ❌ **NO** - Calculations stay the same, inputs change

**Rationale**:
- Same formulas for NOI, Cap Rate, DSCR, Cash Flow regardless of building type
- Building type affects INPUT VALUES (maintenance costs, insurance, utilities)
- User provides different values based on their building type
- Platform validates inputs are reasonable for that building type

**Implementation**: Add validation warnings, not calculation changes

---

### Question 2: Impact on Decision Engine?

**Answer**: ✅ **MINIMAL** - Only ONE method needs building type awareness

**Rationale**:
- Cap rate scoring (25% weight) needs building-type-specific targets
- All other metrics (Cash Flow, IRR, DSCR, Market, Exit, Risk) are universal
- ONE method change: `getTargetCapRate()` in MFDecisionEngine

**Implementation**: 2 hours (one method + tests)

**Code Change Required**:
```typescript
// MFDecisionEngine.ts - getTargetCapRate() method
private getTargetCapRate(): number {
  const marketTier = this.getMarketTier(); // A/B/C
  const buildingType = this.mfPropertyData.buildingType;

  // Base cap rate by market
  const baseCapRates = {
    'A': 0.05,   // 5% (premium markets)
    'B': 0.075,  // 7.5% (balanced markets)
    'C': 0.10    // 10% (cash flow markets)
  };

  const baseRate = baseCapRates[marketTier] || 0.08;

  // Building type adjustment (PHASE 1: Commercial MF only)
  if (!buildingType) return baseRate;

  const buildingTypeAdjustments = {
    'GARDEN': 0,        // Baseline (most common, 50%+ of commercial MF)
    'MID_RISE': -0.015, // -150 bps (elevator buildings, institutional)
    'COMPLEX': 0        // Similar to garden (multi-building garden-style)
  };

  return baseRate + (buildingTypeAdjustments[buildingType] || 0);
}
```

**Example**:
- Phoenix (B-market): Base = 7.5%
- Garden style: 7.5% + 0% = **7.5% target**
- Mid-rise: 7.5% - 1.5% = **6.0% target**
- Complex: 7.5% + 0% = **7.5% target**

---

### Question 3: Start with Most Common Building Types?

**Answer**: ✅ **YES** - Phase 1 = Commercial MF (5+ units) with 3 building types

**Rationale**:
1. **Market Split**:
   - 2-4 units: Residential financing, SFR-like (30% of market)
   - 5+ units: Commercial financing, NOI-based (70% of market) ← **OUR STRENGTH**

2. **Backend Optimization**:
   - Current backend designed for commercial MF (DSCR, NOI/Cap Rate, commercial loans)
   - 2-4 units better served by SFR analyzer (residential financing, comparable sales)

3. **Building Type Distribution** (5+ units):
   - Garden style: ~60% (2-3 story, outdoor corridors)
   - Multi-building complex: ~25% (multiple garden-style buildings)
   - Mid-rise: ~10% (4-9 stories with elevator)
   - High-rise: ~5% (10+ stories - rare, highly institutional)

4. **Phase 1 Scope** (Covers 95% of 5+ unit market):
   - ✅ GARDEN - Most common commercial MF
   - ✅ MID_RISE - Elevator buildings (institutional appeal)
   - ✅ COMPLEX - Multi-building properties

5. **Excluded from Phase 1** (Can add in Phase 2):
   - ❌ TOWNHOUSE (typically 2-4 units - use SFR)
   - ❌ STACKED (typically 2-4 units - use SFR)
   - ❌ HIGH_RISE (100-500+ units - rare, complex)
   - ❌ MIXED (retail + residential - different calculations)

---

## Phase 1 Scope: Commercial MF (5+ Units)

### User Segmentation

**In Scope - Professional Investors** (Target: $49-149/month subscribers):
- Properties: 5-200+ units
- Financing: Commercial loans (5/7/10 year terms, DSCR-based)
- Valuation: Income approach (NOI / Cap Rate)
- Management: Professional property management
- Experience: Scaling beyond first few properties

**Out of Scope - Beginners/House Hackers** (Use SFR Analyzer):
- Properties: 2-4 units (duplex, triplex, fourplex)
- Financing: Residential loans (30-year fixed, borrower income)
- Valuation: Comparable sales (like SFR)
- Management: Often owner-occupied, DIY-friendly
- Experience: First-time investors, house hacking

---

## Technical Implementation

### 1. Backend Changes (8 hours)

#### A. Update Building Type Enum (1 hour)
**File**: `/backend/src/types/propertyTypes.ts` line 109

**Change**:
```typescript
// BEFORE:
buildingType?: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';

// AFTER (Phase 1 - Commercial MF):
buildingType?: 'GARDEN' | 'MID_RISE' | 'COMPLEX';
```

**Rationale**:
- GARDEN: 2-3 story, outdoor corridors (most common)
- MID_RISE: 4-9 stories with elevator
- COMPLEX: Multi-building garden-style properties

#### B. Update Decision Engine Cap Rate Logic (2 hours)
**File**: `/backend/src/services/investment/MFDecisionEngine.ts` line 328

**Method**: `getTargetCapRate()`

**Implementation**: See Question 2 code above

**Tests Required**:
```typescript
// Test 1: Garden style cap rate targets
describe('getTargetCapRate - Garden Style', () => {
  it('should use base market rate for garden style (no adjustment)', () => {
    // A-market garden: 5.0%
    // B-market garden: 7.5%
    // C-market garden: 10.0%
  });
});

// Test 2: Mid-rise cap rate targets
describe('getTargetCapRate - Mid-Rise', () => {
  it('should apply -150 bps adjustment for mid-rise', () => {
    // A-market mid-rise: 3.5% (5.0% - 1.5%)
    // B-market mid-rise: 6.0% (7.5% - 1.5%)
    // C-market mid-rise: 8.5% (10.0% - 1.5%)
  });
});

// Test 3: Complex cap rate targets
describe('getTargetCapRate - Complex', () => {
  it('should use base market rate for complex (no adjustment)', () => {
    // Same as garden style
  });
});
```

#### C. Add Operating Expense Validation (3 hours)
**File**: `/backend/src/analysis/MultiFamilyAnalyzer.ts` (add to `validatePropertyData()`)

**Implementation**:
```typescript
// Add to validatePropertyData() method
private validatePropertyData(): void {
  // ... existing validations ...

  // NEW: Building-type-specific operating expense validation (5+ units only)
  if (this.data.totalUnits >= 5 && this.data.buildingType) {
    const operatingExpenses = this.calculateOperatingExpenses(this.calculateGrossIncome(1));
    const opExPerUnit = (operatingExpenses / 12) / this.data.totalUnits;

    const expectedRanges = {
      'GARDEN': {
        min: 250,
        max: 400,
        description: 'Garden-style properties (2-3 stories, outdoor corridors)'
      },
      'MID_RISE': {
        min: 450,
        max: 700,
        description: 'Mid-rise properties (4-9 stories with elevator)'
      },
      'COMPLEX': {
        min: 300,
        max: 500,
        description: 'Multi-building complex properties'
      }
    };

    const range = expectedRanges[this.data.buildingType];

    if (range && opExPerUnit < range.min * 0.7) {
      console.warn(
        `[MF] ⚠️ OPERATING EXPENSE WARNING: Low operating expenses for ${this.data.buildingType}\n` +
        `  Your operating expenses: $${opExPerUnit.toFixed(0)}/unit/month\n` +
        `  Typical range for ${range.description}: $${range.min}-${range.max}/unit/month\n` +
        `  → Your expenses may be understated by ~$${((range.min - opExPerUnit) * this.data.totalUnits * 12).toLocaleString()}/year\n` +
        `  → This affects NOI and property value calculations\n` +
        `  → Recommendation: Verify maintenance, insurance, utilities, and common area costs`
      );
    }

    if (range && opExPerUnit > range.max * 1.3) {
      console.warn(
        `[MF] ⚠️ OPERATING EXPENSE WARNING: High operating expenses for ${this.data.buildingType}\n` +
        `  Your operating expenses: $${opExPerUnit.toFixed(0)}/unit/month\n` +
        `  Typical range for ${range.description}: $${range.min}-${range.max}/unit/month\n` +
        `  → Your expenses are ${((opExPerUnit / range.max - 1) * 100).toFixed(0)}% above typical\n` +
        `  → This may indicate deferred maintenance or management inefficiency\n` +
        `  → Recommendation: Review expense breakdown for opportunities to reduce costs`
      );
    }
  }

  console.log('[MF] ✅ Data validation complete');
}
```

**Business Impact**:
- Prevents users from underestimating expenses by $50K-200K/year
- Warns about overpriced properties with inflated expense assumptions
- Educational - teaches users what to expect for their building type

#### D. Update Backend Tests (2 hours)
**Files**:
- `/backend/src/services/investment/__tests__/MFDecisionEngine.test.ts`
- `/backend/src/analysis/__tests__/MultiFamilyAnalyzer.test.ts`

**Test Coverage**:
1. Cap rate scoring with 3 building types × 3 market tiers = 9 test scenarios
2. Operating expense validation (low/normal/high for each building type)
3. Backward compatibility (no buildingType provided = uses defaults)

---

### 2. Frontend Changes (12 hours)

#### A. Update Building Type Selector (2 hours)
**File**: `/frontend/src/components/MFAnalysis/MFAddressStep.tsx` lines 44-49

**Change**:
```typescript
// BEFORE (6 types):
const BUILDING_TYPES = [
  { value: 'GARDEN', label: 'Garden Style (2-3 stories, outdoor corridors)', icon: '🏡' },
  { value: 'MID_RISE', label: 'Mid-Rise (4-9 stories)', icon: '🏢' },
  { value: 'HIGH_RISE', label: 'High-Rise (10+ stories)', icon: '🏙️' },
  { value: 'TOWNHOUSE', label: 'Townhouse Style', icon: '🏘️' },
  { value: 'STACKED', label: 'Stacked Flats (2-4 units per building)', icon: '🏠' },
  { value: 'MIXED', label: 'Mixed Use (Commercial + Residential)', icon: '🏬' }
];

// AFTER (3 types - Phase 1):
const BUILDING_TYPES = [
  {
    value: 'GARDEN',
    label: 'Garden Style',
    description: '2-3 stories, outdoor corridors, parking lot',
    details: 'Most common commercial MF (5-50 units typically)',
    icon: '🏡',
    operatingExpenseRange: '$250-400/unit/month'
  },
  {
    value: 'MID_RISE',
    label: 'Mid-Rise',
    description: '4-9 stories with elevator',
    details: 'Higher operating costs due to elevator maintenance',
    icon: '🏢',
    operatingExpenseRange: '$450-700/unit/month'
  },
  {
    value: 'COMPLEX',
    label: 'Multi-Building Complex',
    description: 'Multiple buildings on one property',
    details: 'Higher landscaping and parking lot costs',
    icon: '🏘️',
    operatingExpenseRange: '$300-500/unit/month'
  }
] as const;
```

**UI Enhancement**: Show operating expense range when building type is selected

#### B. Add Unit Count Gating (3 hours)
**File**: `/frontend/src/components/MFAnalysis/MFPropertyWizard.tsx`

**New Step**: Add unit count validation BEFORE building type selection

**Flow**:
```
Step 1: Address Entry
  ↓
Step 1.5: Unit Count & Property Type Check (NEW)
  - "How many units does this property have?"
  - If 2-4 units: "For 2-4 unit properties, we recommend using our Single-Family Analyzer..."
    - [Button: "Use SFR Analyzer"] → Redirect to /sfr-analysis
    - [Button: "Continue with MF Analyzer"] → Continue (advanced users)
  - If 5+ units: Continue to Step 2 (Financials + Building Type)
  ↓
Step 2: Financials + Building Type Selection
  - Show 3 building types (GARDEN, MID_RISE, COMPLEX)
  - Display operating expense ranges
  ↓
... continue with rest of wizard
```

**Benefits**:
- Clear segmentation (2-4 units = SFR, 5+ units = MF)
- Prevents beginners from using wrong tool
- Educational (explains why SFR analyzer is better for small properties)

#### C. Update MFDataAdapter (2 hours)
**File**: `/frontend/src/utils/mfDataAdapter.ts`

**Changes**:
1. Update building type validation to only accept: GARDEN, MID_RISE, COMPLEX
2. Add error handling for invalid building types
3. Add validation for commercial MF (5+ units) requirements

**Example**:
```typescript
// Validate building type
if (wizardData.buildingType) {
  const validTypes = ['GARDEN', 'MID_RISE', 'COMPLEX'];
  if (!validTypes.includes(wizardData.buildingType)) {
    throw new Error(
      `Invalid building type: ${wizardData.buildingType}. ` +
      `Phase 1 supports: ${validTypes.join(', ')}`
    );
  }
}

// Validate unit count for commercial MF
if (wizardData.totalUnits < 5) {
  console.warn(
    'MF Analyzer is optimized for commercial properties (5+ units). ' +
    'For 2-4 unit properties, consider using SFR Analyzer for better accuracy.'
  );
}
```

#### D. Update Frontend Tests (3 hours)
**Files**:
- `/frontend/src/components/MFAnalysis/__tests__/MFPropertyWizard.test.tsx`
- `/frontend/src/components/MFAnalysis/__tests__/MFAddressStep.test.tsx`
- `/frontend/src/utils/__tests__/mfDataAdapter.test.ts`

**Test Coverage**:
1. Unit count gating (2-4 units shows SFR recommendation)
2. Building type selector shows 3 options only
3. Operating expense range display
4. Data adapter validation for 3 building types

#### E. Add Educational Content (2 hours)
**File**: `/frontend/src/components/MFAnalysis/BuildingTypeInfoPanel.tsx` (NEW)

**Purpose**: Educate users on building type impact

**Content**:
```
Garden Style (Most Common)
- 2-3 stories, outdoor corridors
- Lower construction cost, easier maintenance
- Operating expenses: $250-400/unit/month
- Cap rates: Typically match market average
- Best for: Local investors, first commercial MF property

Mid-Rise (Institutional Appeal)
- 4-9 stories with elevator
- Higher operating costs (elevator maintenance $1,200-2,000/month)
- Operating expenses: $450-700/unit/month
- Cap rates: Typically 100-150 bps lower than garden (institutional buyers)
- Best for: Experienced investors, urban markets

Multi-Building Complex
- Multiple garden-style buildings on one property
- Higher landscaping and parking lot costs
- Operating expenses: $300-500/unit/month
- Cap rates: Similar to garden style
- Best for: Scaling investors (25-100+ units common)
```

---

### 3. Documentation Updates (4 hours)

#### A. Update Data Dictionary (1 hour)
**File**: `/docs/DATA_DICTIONARY.md`

**Changes**:
- Update `buildingType` enum: GARDEN | MID_RISE | COMPLEX
- Add operating expense ranges by building type
- Add cap rate target adjustments by building type

#### B. Update MF Metrics Reference (1 hour)
**File**: `/docs/MF_METRICS_REFERENCE.md`

**Changes**:
- Add building type impact section
- Document cap rate adjustments by building type
- Add operating expense validation rules

#### C. Create Phase 1 User Guide (2 hours)
**File**: `/docs/MF_PHASE1_USER_GUIDE.md` (NEW)

**Content**:
- What's included in Phase 1 (5+ units, 3 building types)
- Why 2-4 units should use SFR analyzer
- Building type selection guide
- Operating expense expectations
- Cap rate benchmarks by building type

---

## Timeline

**Total Effort**: 24 hours (3-4 weeks half-time, 1.5 weeks full-time)

### Week 1: Backend Foundation (8 hours)
- Day 1-2: Update building type enum, Decision Engine cap rate logic (4 hours)
- Day 3-4: Add operating expense validation (3 hours)
- Day 5: Backend tests (2 hours)

### Week 2: Frontend Implementation (12 hours)
- Day 1-2: Update building type selector, add unit count gating (5 hours)
- Day 3: Update MFDataAdapter (2 hours)
- Day 4: Add educational content (2 hours)
- Day 5: Frontend tests (3 hours)

### Week 3: QE Testing & Documentation (4 hours)
- Day 1-2: QE comprehensive testing (2 hours)
- Day 3-4: Documentation updates (2 hours)

### Week 4: Launch Prep
- User acceptance testing
- Final polish and bug fixes
- Deploy to production

---

## Success Metrics

**Technical**:
- ✅ 95%+ test coverage for building type logic
- ✅ <5% error rate on building type selection
- ✅ 100% backward compatibility (no buildingType = uses defaults)

**Business**:
- ✅ 70%+ of 5+ unit users select building type
- ✅ <10% users with 2-4 units try to use MF analyzer (gating works)
- ✅ Operating expense warnings trigger 15-25% of time (catching unrealistic inputs)

**User Experience**:
- ✅ Users understand why SFR analyzer is better for 2-4 units
- ✅ Building type selection takes <30 seconds (clear options, good labels)
- ✅ Users learn what operating expenses to expect

---

## Phase 2 Roadmap (Future)

**Phase 2A: Add 2-4 Unit Support** (if demand exists)
- Residential financing logic (30-year fixed)
- Comparable sales valuation option
- Owner-occupied scenarios (house hacking)

**Phase 2B: Add Remaining Building Types**
- HIGH_RISE (10+ stories) - rare but high value
- MIXED (retail + residential) - different calculation approach
- TOWNHOUSE (if market demand)

**Phase 2C: Property Class Integration**
- Class A/B/C classification
- Class-specific cap rate benchmarks
- Class-specific risk profiles

---

## Conclusion

**Ship Right, Not Fast**: 3-4 weeks to deliver professional-grade commercial MF analysis

**Key Decisions**:
1. ✅ Calculations don't change - only validation and scoring
2. ✅ Decision Engine: ONE method change (cap rate targets)
3. ✅ Phase 1: Commercial MF (5+ units) with 3 building types

**Business Impact**:
- Targets 70% of MF market (5+ units, professional investors)
- Prevents costly mistakes ($50K-200K overvaluation errors)
- Differentiates from competitors (building-type-aware analysis)
- Maintains brand promise: "Professional-grade, investor-level analysis"

**Ready to implement** - All questions answered, scope defined, timeline realistic.

---

**Approval Required**: Product Owner sign-off to proceed with implementation

**Status**: ✅ READY FOR IMPLEMENTATION
**Next Step**: Implement Week 1 backend changes (8 hours)
