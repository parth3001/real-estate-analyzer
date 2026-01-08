# Issue #53 - TIER 2: Backend Provenance Tracking Implementation

**Date**: December 31, 2025
**Status**: 🔄 IN PROGRESS
**Estimated Effort**: 12-15 hours
**Priority**: HIGH (Required for "Analysis Input Summary" modal)

---

## Executive Summary

**Goal**: Track and return the **actual values used** in analysis calculations, not just the original user input.

**Why This Matters**:
- Users need transparency into which values came from their input vs. defaults/APIs
- "Analysis Input Summary" modal can't be built without this data
- Builds trust by showing exactly what assumptions were made

**Current Problem**:
- Backend returns `propertyData` as original user input only
- When user doesn't provide `vacancyRate`, analysis uses 5% default internally
- Frontend has NO WAY to know 5% was used (field is `null` or missing in response)
- Documentation (Phases 0-4) shows WHAT SHOULD happen, but doesn't capture WHAT DID happen at runtime

**Solution**: Add `inputProvenance` object to backend response with source attribution for every field.

---

## Current vs. Desired State

### Current Backend Response (Line 1297 deals.ts)

```typescript
// ❌ CURRENT - Only returns original user input
return res.json({
  propertyData: req.body.propertyData,  // Missing fallback values
  analysis: analysisResults,
  marketData: marketDataResults
});
```

**What frontend sees**:
```json
{
  "propertyData": {
    "purchasePrice": 300000,
    "monthlyRent": 2000
    // vacancyRate: null or missing ❌
  },
  "analysis": {
    "monthly": {
      "expenses": {
        "vacancy": 833.33  // Calculated using 5%, but frontend doesn't know this!
      }
    }
  }
}
```

### Desired Backend Response

```typescript
// ✅ NEW - Returns original input + provenance tracking
return res.json({
  propertyData: req.body.propertyData,  // Original input preserved
  analysis: analysisResults,
  marketData: marketDataResults,

  // ✅ NEW: Input provenance with sources
  inputProvenance: {
    // User-provided fields
    purchasePrice: {
      value: 300000,
      source: 'USER_INPUT',
      providedAt: '2025-12-31T10:30:00Z'
    },
    monthlyRent: {
      value: 2000,
      source: 'USER_INPUT',
      providedAt: '2025-12-31T10:30:00Z'
    },

    // Default applied
    vacancyRate: {
      value: 5,
      source: 'DEFAULT',
      reason: 'Industry standard for residential rental',
      isOverridable: true
    },

    // API sourced
    currentMortgageRate: {
      value: 7.2,
      source: 'FRED_API',
      cachedDate: '2025-12-30T08:00:00Z',
      cacheTTL: '1 day'
    },
    marketRent: {
      value: 2100,
      source: 'RENTCAST_API',
      cachedDate: '2025-12-15T14:20:00Z',
      cacheTTL: '30 days',
      confidence: 'high'
    }
  }
});
```

---

## Implementation Architecture

### New TypeScript Interfaces

**File**: `/backend/src/types/provenance.ts` (NEW FILE)

```typescript
/**
 * Source attribution for input fields
 */
export type ProvenanceSource =
  | 'USER_INPUT'           // User explicitly provided this value
  | 'DEFAULT'              // Platform default applied (user didn't provide)
  | 'CALCULATED'           // Derived from other inputs (e.g., loanAmount from purchasePrice - downPayment)
  | 'FRED_API'             // FRED economic data API
  | 'RENTCAST_API'         // RentCast property data API
  | 'CENSUS_API'           // US Census demographic data
  | 'AI_GENERATED'         // GPT-4o-mini enhanced content
  | 'FALLBACK_CHAIN';      // Result of multi-step fallback (e.g., user → API → default)

/**
 * Provenance metadata for a single field
 */
export interface FieldProvenance {
  value: any;                      // The actual value used
  source: ProvenanceSource;        // Where it came from
  providedAt?: string;             // ISO timestamp when user provided (USER_INPUT only)
  reason?: string;                 // Why this default was applied (DEFAULT only)
  isOverridable?: boolean;         // Can user override this? (DEFAULT only)
  cachedDate?: string;             // When API data was fetched (API sources only)
  cacheTTL?: string;               // Cache lifetime (API sources only)
  confidence?: 'low' | 'medium' | 'high';  // Data confidence (API sources only)
  fallbackChain?: ProvenanceSource[];      // Ordered list of sources tried (FALLBACK_CHAIN only)
  calculationSource?: string;      // Which field(s) this was calculated from (CALCULATED only)
}

/**
 * Complete input provenance for an analysis
 */
export interface InputProvenance {
  // Core property fields
  purchasePrice?: FieldProvenance;
  monthlyRent?: FieldProvenance;
  downPayment?: FieldProvenance;
  interestRate?: FieldProvenance;
  closingCosts?: FieldProvenance;

  // Assumption fields
  vacancyRate?: FieldProvenance;
  propertyManagementRate?: FieldProvenance;
  maintenanceCost?: FieldProvenance;
  propertyTaxRate?: FieldProvenance;
  insuranceRate?: FieldProvenance;

  // Projection fields
  projectionYears?: FieldProvenance;
  annualRentIncrease?: FieldProvenance;
  annualExpenseIncrease?: FieldProvenance;
  annualPropertyValueIncrease?: FieldProvenance;

  // Market data fields
  currentMortgageRate?: FieldProvenance;
  marketRent?: FieldProvenance;
  medianCapRate?: FieldProvenance;
  unemployment?: FieldProvenance;
  housingPriceIndexYoY?: FieldProvenance;
  inflation?: FieldProvenance;

  // Census fields
  medianHouseholdIncome?: FieldProvenance;
  populationDensity?: FieldProvenance;

  // Multi-family specific
  totalUnits?: FieldProvenance;
  commonAreaUtilities?: FieldProvenance;

  // BRRRR specific
  afterRepairValue?: FieldProvenance;
  rehabBudget?: FieldProvenance;
  refinanceInterestRate?: FieldProvenance;

  // Metadata
  _generatedAt: string;            // ISO timestamp when provenance was generated
  _analysisId?: string;            // Reference to Deal._id if saved
}
```

---

### Implementation Steps

#### Step 1: Create Provenance Tracker Class (4 hours)

**File**: `/backend/src/services/ProvenanceTracker.ts` (NEW FILE)

```typescript
import { InputProvenance, FieldProvenance, ProvenanceSource } from '../types/provenance';
import { BasePropertyData } from '../types/propertyTypes';

/**
 * Tracks the source of every input field used in analysis
 *
 * Usage:
 *   const tracker = new ProvenanceTracker(originalUserInput);
 *   tracker.recordUserInput('purchasePrice', 300000);
 *   tracker.recordDefault('vacancyRate', 5, 'Industry standard for residential');
 *   tracker.recordApiData('currentMortgageRate', 7.2, 'FRED_API', cachedDate);
 *   const provenance = tracker.getProvenance();
 */
export class ProvenanceTracker {
  private userInput: any;
  private provenance: Partial<InputProvenance> = {};

  constructor(userInput: any) {
    this.userInput = userInput;
  }

  /**
   * Record a user-provided value
   */
  recordUserInput(fieldName: string, value: any): void {
    this.provenance[fieldName] = {
      value,
      source: 'USER_INPUT',
      providedAt: new Date().toISOString()
    };
  }

  /**
   * Record a platform default that was applied
   */
  recordDefault(
    fieldName: string,
    value: any,
    reason: string,
    isOverridable: boolean = true
  ): void {
    this.provenance[fieldName] = {
      value,
      source: 'DEFAULT',
      reason,
      isOverridable
    };
  }

  /**
   * Record a calculated value (derived from other inputs)
   */
  recordCalculated(
    fieldName: string,
    value: any,
    calculationSource: string
  ): void {
    this.provenance[fieldName] = {
      value,
      source: 'CALCULATED',
      calculationSource
    };
  }

  /**
   * Record an API-sourced value
   */
  recordApiData(
    fieldName: string,
    value: any,
    source: 'FRED_API' | 'RENTCAST_API' | 'CENSUS_API',
    cachedDate: Date,
    cacheTTL: string,
    confidence?: 'low' | 'medium' | 'high'
  ): void {
    this.provenance[fieldName] = {
      value,
      source,
      cachedDate: cachedDate.toISOString(),
      cacheTTL,
      confidence
    };
  }

  /**
   * Record a fallback chain (tried multiple sources)
   */
  recordFallbackChain(
    fieldName: string,
    value: any,
    chain: ProvenanceSource[],
    finalSource: ProvenanceSource,
    reason?: string
  ): void {
    this.provenance[fieldName] = {
      value,
      source: 'FALLBACK_CHAIN',
      fallbackChain: chain,
      reason
    };
  }

  /**
   * Get the complete provenance object
   */
  getProvenance(): InputProvenance {
    return {
      ...this.provenance,
      _generatedAt: new Date().toISOString()
    } as InputProvenance;
  }

  /**
   * Helper: Detect if field was provided by user or should use default
   */
  shouldUseDefault(fieldName: string): boolean {
    return this.userInput[fieldName] === undefined ||
           this.userInput[fieldName] === null ||
           this.userInput[fieldName] === '';
  }
}
```

---

#### Step 2: Update BasePropertyAnalyzer (3 hours)

**File**: `/backend/src/analysis/BasePropertyAnalyzer.ts` (MODIFY)

**Changes**:
1. Add `ProvenanceTracker` to constructor
2. Record provenance whenever a value is used
3. Return provenance in analysis result

```typescript
import { ProvenanceTracker } from '../services/ProvenanceTracker';
import { InputProvenance } from '../types/provenance';

export abstract class BasePropertyAnalyzer<T extends BasePropertyData, U extends CommonMetrics> {
  protected data: T;
  protected assumptions: AnalysisAssumptions;
  protected provenanceTracker: ProvenanceTracker;  // ✅ NEW

  constructor(data: T, assumptions: AnalysisAssumptions, userInput: any) {
    this.data = data;
    this.assumptions = assumptions;
    this.provenanceTracker = new ProvenanceTracker(userInput);  // ✅ NEW

    // Track user-provided core fields
    this.trackCoreFields(userInput);
    this.trackAssumptions(userInput, assumptions);
  }

  /**
   * Track core property fields
   */
  private trackCoreFields(userInput: any): void {
    // Purchase price - always required
    this.provenanceTracker.recordUserInput('purchasePrice', this.data.purchasePrice);

    // Monthly rent
    this.provenanceTracker.recordUserInput('monthlyRent', this.data.monthlyRent);

    // Down payment
    this.provenanceTracker.recordUserInput('downPayment', this.data.downPayment);

    // Interest rate
    if (userInput.interestRate) {
      this.provenanceTracker.recordUserInput('interestRate', this.data.interestRate);
    } else if (userInput.currentMortgageRate) {
      // Used market rate (tracked separately as API data)
      this.provenanceTracker.recordFallbackChain(
        'interestRate',
        this.data.interestRate,
        ['USER_INPUT', 'FRED_API'],
        'FRED_API',
        'User did not provide rate, used current market rate from FRED'
      );
    }

    // Closing costs
    if (userInput.closingCosts) {
      this.provenanceTracker.recordUserInput('closingCosts', this.data.closingCosts);
    } else {
      this.provenanceTracker.recordDefault(
        'closingCosts',
        this.data.closingCosts || (this.data.purchasePrice * 0.03),
        'Platform default: 3% of purchase price',
        true
      );
    }
  }

  /**
   * Track assumption fields
   */
  private trackAssumptions(userInput: any, assumptions: AnalysisAssumptions): void {
    // Vacancy rate
    if (userInput.vacancyRate !== undefined && userInput.vacancyRate !== null) {
      this.provenanceTracker.recordUserInput('vacancyRate', assumptions.vacancyRate);
    } else {
      this.provenanceTracker.recordDefault(
        'vacancyRate',
        assumptions.vacancyRate,
        'Industry standard for residential rental properties',
        true
      );
    }

    // Property management rate
    if (userInput.propertyManagementRate !== undefined) {
      this.provenanceTracker.recordUserInput('propertyManagementRate', userInput.propertyManagementRate);
    } else {
      this.provenanceTracker.recordDefault(
        'propertyManagementRate',
        8, // Assuming 8% default
        'Industry standard property management fee',
        true
      );
    }

    // Projection years
    if (userInput.projectionYears) {
      this.provenanceTracker.recordUserInput('projectionYears', assumptions.projectionYears);
    } else {
      this.provenanceTracker.recordDefault(
        'projectionYears',
        assumptions.projectionYears,
        'Platform default analysis period',
        true
      );
    }

    // Annual rent increase
    if (userInput.annualRentIncrease) {
      this.provenanceTracker.recordUserInput('annualRentIncrease', assumptions.annualRentIncrease);
    } else {
      this.provenanceTracker.recordDefault(
        'annualRentIncrease',
        assumptions.annualRentIncrease,
        'Historical average rent growth',
        true
      );
    }

    // Continue for all other assumption fields...
  }

  /**
   * Get provenance data
   */
  getProvenance(): InputProvenance {
    return this.provenanceTracker.getProvenance();
  }
}
```

---

#### Step 3: Update Analysis Controllers (2 hours)

**File**: `/backend/src/controllers/deals.ts` (MODIFY)

**Line 1297 - Update response to include provenance**:

```typescript
// BEFORE (Line 1297)
return res.json({
  propertyData,
  analysis: analysisResult,
  marketData: marketDataResult
});

// ✅ AFTER - Include provenance
return res.json({
  propertyData,           // Original user input (preserved for backwards compatibility)
  analysis: analysisResult,
  marketData: marketDataResult,
  inputProvenance: analyzer.getProvenance()  // ✅ NEW
});
```

**Additional changes**:
- Pass `req.body` (original user input) to analyzer constructor
- Track market data sources when fetched

```typescript
// Around line 850-900 in analyzeProperty function
const analyzer = new SFRAnalyzer(
  propertyData,
  assumptions,
  req.body  // ✅ NEW - Pass original user input
);

// After market data fetch (around line 920)
if (marketDataResult) {
  // Track FRED API data
  if (marketDataResult.currentMortgageRate) {
    analyzer.provenanceTracker.recordApiData(
      'currentMortgageRate',
      marketDataResult.currentMortgageRate,
      'FRED_API',
      new Date(marketDataResult.cachedAt || Date.now()),
      '1 day',
      'high'
    );
  }

  // Track RentCast data
  if (marketDataResult.rentEstimate) {
    analyzer.provenanceTracker.recordApiData(
      'marketRent',
      marketDataResult.rentEstimate,
      'RENTCAST_API',
      new Date(marketDataResult.cachedAt || Date.now()),
      '30 days',
      marketDataResult.confidence || 'medium'
    );
  }

  // Continue for all market data fields...
}
```

---

#### Step 4: Update Type Definitions (1 hour)

**File**: `/backend/src/types/analysis.ts` (MODIFY)

Add provenance to AnalysisResult interface:

```typescript
import { InputProvenance } from './provenance';

export interface AnalysisResult {
  monthly: MonthlyAnalysis;
  annual: AnnualAnalysis;
  keyMetrics: SFRMetrics | MultiFamilyMetrics;
  projections: YearlyProjection[];
  exitAnalysis: ExitAnalysis;

  // ✅ NEW
  inputProvenance?: InputProvenance;  // Optional for backwards compatibility
}
```

---

#### Step 5: Update Frontend Type Definitions (1 hour)

**File**: `/frontend/src/types/analysis.ts` (MODIFY)

Mirror the backend provenance types:

```typescript
export type ProvenanceSource =
  | 'USER_INPUT'
  | 'DEFAULT'
  | 'CALCULATED'
  | 'FRED_API'
  | 'RENTCAST_API'
  | 'CENSUS_API'
  | 'AI_GENERATED'
  | 'FALLBACK_CHAIN';

export interface FieldProvenance {
  value: any;
  source: ProvenanceSource;
  providedAt?: string;
  reason?: string;
  isOverridable?: boolean;
  cachedDate?: string;
  cacheTTL?: string;
  confidence?: 'low' | 'medium' | 'high';
  fallbackChain?: ProvenanceSource[];
  calculationSource?: string;
}

export interface InputProvenance {
  purchasePrice?: FieldProvenance;
  monthlyRent?: FieldProvenance;
  vacancyRate?: FieldProvenance;
  propertyManagementRate?: FieldProvenance;
  // ... all other fields

  _generatedAt: string;
  _analysisId?: string;
}

// Update AnalysisResult to include provenance
export interface AnalysisResult {
  // ... existing fields

  inputProvenance?: InputProvenance;  // ✅ NEW
}
```

---

#### Step 6: Add Comprehensive Tests (3-4 hours)

**File**: `/backend/src/tests/provenance-tracking.test.ts` (NEW FILE)

```typescript
import { ProvenanceTracker } from '../services/ProvenanceTracker';

describe('ProvenanceTracker', () => {
  describe('recordUserInput', () => {
    it('should track user-provided purchase price', () => {
      const userInput = { purchasePrice: 300000 };
      const tracker = new ProvenanceTracker(userInput);

      tracker.recordUserInput('purchasePrice', 300000);

      const provenance = tracker.getProvenance();
      expect(provenance.purchasePrice).toMatchObject({
        value: 300000,
        source: 'USER_INPUT'
      });
      expect(provenance.purchasePrice?.providedAt).toBeDefined();
    });
  });

  describe('recordDefault', () => {
    it('should track default vacancy rate when not provided', () => {
      const userInput = {};  // User didn't provide vacancyRate
      const tracker = new ProvenanceTracker(userInput);

      tracker.recordDefault('vacancyRate', 5, 'Industry standard', true);

      const provenance = tracker.getProvenance();
      expect(provenance.vacancyRate).toMatchObject({
        value: 5,
        source: 'DEFAULT',
        reason: 'Industry standard',
        isOverridable: true
      });
    });
  });

  describe('recordFallbackChain', () => {
    it('should track fallback from user → API → default', () => {
      const userInput = {};  // No interest rate provided
      const tracker = new ProvenanceTracker(userInput);

      tracker.recordFallbackChain(
        'interestRate',
        7.2,
        ['USER_INPUT', 'FRED_API', 'DEFAULT'],
        'FRED_API',
        'User did not provide, used FRED market rate'
      );

      const provenance = tracker.getProvenance();
      expect(provenance.interestRate).toMatchObject({
        value: 7.2,
        source: 'FALLBACK_CHAIN',
        fallbackChain: ['USER_INPUT', 'FRED_API', 'DEFAULT']
      });
    });
  });

  describe('Integration - Full Analysis', () => {
    it('should track all sources in realistic SFR analysis', () => {
      const userInput = {
        purchasePrice: 300000,
        monthlyRent: 2000,
        downPayment: 60000
        // vacancyRate NOT provided
        // propertyManagementRate NOT provided
      };

      const tracker = new ProvenanceTracker(userInput);

      // User inputs
      tracker.recordUserInput('purchasePrice', 300000);
      tracker.recordUserInput('monthlyRent', 2000);
      tracker.recordUserInput('downPayment', 60000);

      // Defaults applied
      tracker.recordDefault('vacancyRate', 5, 'Industry standard', true);
      tracker.recordDefault('propertyManagementRate', 8, 'Industry standard', true);

      // API data
      tracker.recordApiData(
        'currentMortgageRate',
        7.2,
        'FRED_API',
        new Date('2025-12-30'),
        '1 day',
        'high'
      );

      // Calculated
      tracker.recordCalculated('loanAmount', 240000, 'purchasePrice - downPayment');

      const provenance = tracker.getProvenance();

      expect(provenance.purchasePrice?.source).toBe('USER_INPUT');
      expect(provenance.vacancyRate?.source).toBe('DEFAULT');
      expect(provenance.currentMortgageRate?.source).toBe('FRED_API');
      expect(provenance.loanAmount?.source).toBe('CALCULATED');
      expect(provenance._generatedAt).toBeDefined();
    });
  });
});
```

**File**: `/backend/src/tests/provenance-integration.test.ts` (NEW FILE)

```typescript
import request from 'supertest';
import app from '../app';

describe('Provenance Integration Tests', () => {
  it('should return inputProvenance in analysis response', async () => {
    const response = await request(app)
      .post('/api/deals/analyze')
      .send({
        propertyType: 'SFR',
        address: '123 Main St, Austin, TX 78701',
        purchasePrice: 300000,
        monthlyRent: 2000,
        downPayment: 60000
        // Deliberately omit vacancyRate, propertyManagementRate
      });

    expect(response.status).toBe(200);
    expect(response.body.inputProvenance).toBeDefined();

    // Verify user inputs tracked
    expect(response.body.inputProvenance.purchasePrice).toMatchObject({
      value: 300000,
      source: 'USER_INPUT'
    });

    // Verify defaults tracked
    expect(response.body.inputProvenance.vacancyRate).toMatchObject({
      source: 'DEFAULT',
      isOverridable: true
    });

    // Verify API data tracked
    expect(response.body.inputProvenance.currentMortgageRate).toMatchObject({
      source: 'FRED_API',
      cacheTTL: '1 day'
    });
  });

  it('should preserve backwards compatibility (analysis still works without provenance)', async () => {
    const response = await request(app)
      .post('/api/deals/analyze')
      .send({
        propertyType: 'SFR',
        address: '123 Main St, Austin, TX 78701',
        purchasePrice: 300000,
        monthlyRent: 2000,
        downPayment: 60000
      });

    // Core analysis fields still present
    expect(response.body.analysis).toBeDefined();
    expect(response.body.analysis.keyMetrics).toBeDefined();
    expect(response.body.analysis.keyMetrics.capRate).toBeDefined();

    // Provenance is ADDITIONAL data
    expect(response.body.inputProvenance).toBeDefined();
  });
});
```

---

## Implementation Checklist

### Backend (10-12 hours)

- [ ] **Step 1**: Create `/backend/src/types/provenance.ts` (1 hour)
  - [ ] Define `ProvenanceSource` enum
  - [ ] Define `FieldProvenance` interface
  - [ ] Define `InputProvenance` interface

- [ ] **Step 2**: Create `/backend/src/services/ProvenanceTracker.ts` (4 hours)
  - [ ] Implement `ProvenanceTracker` class
  - [ ] Add `recordUserInput()` method
  - [ ] Add `recordDefault()` method
  - [ ] Add `recordCalculated()` method
  - [ ] Add `recordApiData()` method
  - [ ] Add `recordFallbackChain()` method
  - [ ] Add `getProvenance()` method

- [ ] **Step 3**: Update `/backend/src/analysis/BasePropertyAnalyzer.ts` (3 hours)
  - [ ] Add `provenanceTracker` property
  - [ ] Update constructor to accept `userInput` parameter
  - [ ] Add `trackCoreFields()` method
  - [ ] Add `trackAssumptions()` method
  - [ ] Add `getProvenance()` method
  - [ ] Track all 93 user input fields from Phase 1

- [ ] **Step 4**: Update `/backend/src/controllers/deals.ts` (2 hours)
  - [ ] Pass `req.body` to analyzer constructor (line ~890)
  - [ ] Track market data sources after API calls (line ~920)
  - [ ] Add `inputProvenance` to response (line 1297)
  - [ ] Add backwards compatibility check

- [ ] **Step 5**: Update type definitions (1 hour)
  - [ ] Update `/backend/src/types/analysis.ts` - add `inputProvenance` to `AnalysisResult`
  - [ ] Verify TypeScript compilation

- [ ] **Step 6**: Write comprehensive tests (3-4 hours)
  - [ ] Unit tests for `ProvenanceTracker` (15+ tests)
  - [ ] Integration tests for full analysis flow (5+ tests)
  - [ ] Test backwards compatibility
  - [ ] Test all provenance sources (USER_INPUT, DEFAULT, API, CALCULATED, FALLBACK_CHAIN)

### Frontend (2-3 hours)

- [ ] **Step 1**: Update `/frontend/src/types/analysis.ts` (1 hour)
  - [ ] Mirror backend provenance types
  - [ ] Add `inputProvenance` to `AnalysisResult` interface

- [ ] **Step 2**: Update API service (30 min)
  - [ ] Verify frontend correctly receives `inputProvenance` in response
  - [ ] Add TypeScript type checking

- [ ] **Step 3**: Add quick validation (30 min)
  - [ ] Console log provenance in AnalysisResults component
  - [ ] Verify data looks correct before building modal

---

## Testing Strategy

### Unit Tests (ProvenanceTracker)
1. ✅ Test `recordUserInput()` captures value and timestamp
2. ✅ Test `recordDefault()` includes reason and isOverridable flag
3. ✅ Test `recordCalculated()` references calculation source
4. ✅ Test `recordApiData()` includes cache metadata
5. ✅ Test `recordFallbackChain()` preserves chain order
6. ✅ Test `shouldUseDefault()` correctly detects missing values

### Integration Tests (Full Analysis Flow)
1. ✅ Test analysis with all user inputs (no defaults)
2. ✅ Test analysis with partial inputs (some defaults applied)
3. ✅ Test analysis with API data (FRED, RentCast, Census)
4. ✅ Test multi-family analysis provenance
5. ✅ Test BRRRR analysis provenance
6. ✅ Test backwards compatibility (old frontend still works)

### Edge Cases
1. ✅ User provides `vacancyRate: 0` (not null) - should track as USER_INPUT
2. ✅ API call fails - should track fallback to default
3. ✅ Multiple fallback attempts - should preserve full chain
4. ✅ Saved deal reload - provenance should be preserved in database

---

## Backwards Compatibility Strategy

**Goal**: Ensure old frontend versions continue to work while new frontend can use provenance.

**Approach**:
1. Make `inputProvenance` OPTIONAL in backend response
2. Old frontend ignores unknown field (`inputProvenance`)
3. New frontend checks if `inputProvenance` exists before using it

**Verification**:
```typescript
// Old frontend (no changes needed)
const analysis = response.data.analysis;  // Still works ✅

// New frontend (defensive programming)
const provenance = response.data.inputProvenance;
if (provenance) {
  // Use provenance data for modal
} else {
  // Fallback: Don't show modal or show limited info
}
```

---

## Database Schema Changes

**Do we need to save provenance to MongoDB?**

**Phase 1 (TIER 2)**: NO - Generate provenance on-demand only
- Provenance is calculated fresh each time analysis runs
- Not saved to `Deal` model
- Simpler implementation, faster delivery

**Phase 2 (Future)**: YES - Save provenance for historical accuracy
- Add `inputProvenance` field to `Deal` model
- Useful for "what values were used on Dec 15, 2025?"
- Useful for audit trail (regulatory compliance)

**Recommended**: Start with Phase 1 (no DB changes), evaluate need after user feedback.

---

## Performance Considerations

**Impact Analysis**:
- Provenance tracking adds minimal overhead (~5-10ms per analysis)
- Response payload increases by ~2-3 KB (inputProvenance object)
- No additional API calls required
- No additional database queries

**Optimization Opportunities**:
- Lazy initialization (only track if frontend requests it via query param)
- Compress provenance object (remove null/undefined fields)
- Cache provenance for saved deals (avoid recalculation)

---

## Success Metrics

**After Implementation**:
1. ✅ 100% of displayed fields (437) have provenance tracking
2. ✅ All 7 provenance sources properly attributed
3. ✅ Test coverage >90% for provenance code
4. ✅ No performance regression (analysis time <+10ms)
5. ✅ Backwards compatibility maintained (old frontend works)

**User-Facing Benefits**:
- "Analysis Input Summary" modal can be built (TIER 2 Phase 2)
- Users see exactly which values came from their input vs. defaults
- Transparency builds trust in platform calculations
- Users can identify which defaults to override for better accuracy

---

## Timeline

**Total Estimated Effort**: 12-15 hours

### Week 1 (8 hours)
- Day 1-2: Create provenance types and `ProvenanceTracker` class (5 hours)
- Day 3: Update `BasePropertyAnalyzer` (3 hours)

### Week 2 (7 hours)
- Day 4: Update controllers and response (2 hours)
- Day 5-6: Write comprehensive tests (4 hours)
- Day 7: Frontend types + validation (1 hour)

---

## Next Steps After This Implementation

Once backend provenance tracking is complete:

1. **TIER 2 Phase 2**: Build "Analysis Input Summary" modal UI
   - Design modal layout (UX Designer persona)
   - Create `AssumptionsModal.tsx` component
   - Group fields by source (User Input / Market Data / Assumptions)
   - Add "Override" buttons for editable defaults

2. **TIER 2 Phase 3**: Add override functionality
   - User clicks "Override vacancy rate"
   - Modal allows editing
   - Re-run analysis with new value
   - Show before/after comparison

3. **TIER 2 Phase 4**: Save provenance to database
   - Add `inputProvenance` field to `Deal` model
   - Preserve historical accuracy
   - Enable audit trail

---

## Questions for Product Owner

Before starting implementation:

1. **Scope**: Should we track provenance for ALL 856 fields or just the 437 displayed fields?
   - **Recommendation**: Start with 437 displayed fields (Phase 2 documented these)

2. **Database**: Should we save provenance to MongoDB in TIER 2 or defer to TIER 3?
   - **Recommendation**: Defer to TIER 3 (simpler, faster delivery)

3. **Performance**: Is +2-3 KB response payload acceptable?
   - **Note**: Can be optimized with compression if needed

4. **Backwards Compatibility**: Do we need to support frontend versions older than X?
   - **Recommendation**: Make provenance optional for 100% compatibility

---

**Status**: ✅ Ready to begin implementation

**Next Action**: Review this plan, get approval, and start with Step 1 (provenance types)
