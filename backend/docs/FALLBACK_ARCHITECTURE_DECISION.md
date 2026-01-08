# Issue #53 TIER 2 - Architectural Decision Record

**Date**: December 31, 2025
**Status**: APPROVED (Pending User Confirmation)
**Decision**: HYBRID APPROACH - Centralize User Inputs, Preserve Market Data Fallbacks

---

## Context

**Problem**: 417 risky `||` fallback patterns found across 49 user input fields

**User Question**: "Could there have been a reason where we did multiple defaults location for some reason?"

**Investigation**: Examined 4 distinct fallback patterns across controller, analyzers, and AI service

---

## Decision

### ✅ KEEP (Intentional Architecture)

**1. AI Service Market Data Fallbacks**
```typescript
// src/services/aiService.ts:191
vacancyRate: analysis.censusData.housing?.vacancyRate || 5
```

**Reasoning**:
- Different data source (Census API, not user input)
- Different context (market comparison, not user's property)
- Legitimate fallback if API unavailable

---

### 🔧 FIX (Centralize + Change Operator)

**2. Controller Dual-Source Fallbacks**
```typescript
// OLD (Line 278):
vacancyRate: dealData.vacancyRate || dealData.longTermAssumptions?.vacancyRate || 5

// NEW:
vacancyRate: dealData.vacancyRate ?? dealData.longTermAssumptions?.vacancyRate ?? 5
```

**Changes**:
- ✅ Keep dual-source logic (wizard OR manual form)
- ✅ Change `||` to `??` (fix zero-value bug)
- ✅ Add `_appliedDefaults` tracking

---

### ❌ REMOVE (Redundant Duplication)

**3. Assumptions Object Fallbacks**
```typescript
// REMOVE - Line 950:
vacancyRate: dealData.longTermAssumptions?.vacancyRate || 5

// REPLACE WITH - Just pass through:
vacancyRate: dealData.longTermAssumptions.vacancyRate  // Already enriched by convertWizardData
```

**Reasoning**:
- Redundant (convertWizardData already applied defaults)
- Maintenance burden (2 locations to update)

---

### ❌ REMOVE (Defensive Programming)

**4. Analyzer Service Fallbacks**
```typescript
// REMOVE - brrrAnalyzer.ts:489:
const vacancyRate = inputs.vacancyRate || 5;

// REPLACE WITH - Trust controller:
const vacancyRate = inputs.vacancyRate;  // Controller guarantees this exists

// ADD - Runtime validation (better than fallback):
if (vacancyRate === undefined) {
  throw new Error('CRITICAL BUG: Controller failed to provide vacancyRate');
}
```

**Reasoning**:
- Controller already provides enriched data
- Silent fallbacks hide bugs
- Runtime validation catches controller failures

---

## Implementation Priority

### P0 - CRITICAL (Fix Immediately) - 6 Fields
- `monthlyRent`, `downPayment`, `purchasePrice`, `vacancyRate`, `projectionYears`, `interestRate`
- **Estimated Effort**: 8-10 hours

### P1 - HIGH (Fix This Sprint) - 9 Fields
- `closingCosts`, `capitalInvestments`, `maintenanceCost`, etc.
- **Estimated Effort**: 6-8 hours

### P2 - MEDIUM (Defer Next Sprint) - 21 Fields
- Display-only fields
- **Estimated Effort**: 10-12 hours

---

## Bug Fixes Included

### 1. Zero-Value Corruption Bug ✅
**Problem**: `vacancyRate: 0 || 5` = `5` (user wanted 0%)
**Fix**: `vacancyRate: 0 ?? 5` = `0` (correct!)
**Impact**: 417 patterns fixed

### 2. BRRRR refinanceInterestRate Bug ✅
**Problem**: User provided 9.5%, system used 7.5%
**Root Cause**: Field not mapped in convertWizardData
**Fix**: Add BRRRR field mapping + use `??` operator
**Impact**: User-reported bug resolved

---

## Added Features

### Transparency: `_appliedDefaults` Tracking

**Backend Response**:
```json
{
  "analysis": { /* results */ },
  "_appliedDefaults": [
    "vacancyRate",
    "projectionYears",
    "closingCosts"
  ],
  "_dataSource": {
    "isWizardData": true,
    "userProvidedFields": 87,
    "defaultedFields": 6
  }
}
```

**Frontend Display**:
```
ℹ️ We Used These Defaults

You didn't provide these values, so we used industry standards:
• Vacancy Rate: 5% (industry average)
• Projection Years: 10 years (standard hold period)
• Closing Costs: 3% of purchase price

[Update These Values]
```

---

## Risk Assessment

### Current Architecture Risk (No Fix): HIGH ❌
- Zero-value corruption affects all 417 patterns
- User-reported BRRRR bug persists
- Inconsistent default application
- Users lose good deals due to incorrect assumptions

### Proposed Fix Risk: LOW ✅
- Centralized defaults reduce inconsistency
- `??` operator is standard JavaScript
- Comprehensive test coverage
- Incremental deployment (P0 → P1 → P2)

---

## Success Metrics

**Technical**:
- ✅ Zero-value bug fixed (417 patterns)
- ✅ Single source of truth for defaults
- ✅ BRRRR bug resolved
- ✅ 100% test coverage for fallback logic

**Business**:
- ✅ User trust increased (transparency)
- ✅ Correct calculations for edge cases
- ✅ Reduced support tickets (user understands defaults)

---

## Next Steps

1. **User Approval** ← CURRENT
2. **Phase 1 Implementation** (8-10 hours)
   - Fix P0 critical 6 fields
   - Add `_appliedDefaults` tracking
   - Fix BRRRR bug
   - Comprehensive testing
3. **Phase 2 Implementation** (6-8 hours)
   - Fix P1 high priority 9 fields
4. **Frontend Integration** (2 hours)
   - Display defaults to users

**Total Effort**: 16-20 hours (P0 + P1 + Frontend)

---

## References

- **Investigation Report**: `/docs/FALLBACK_ARCHITECTURE_INVESTIGATION.md`
- **Audit Report**: `/backend/fallback-audit-report.md`
- **Priority Matrix**: `/docs/FALLBACK_AUDIT_SUMMARY.md`
- **Original Issue**: Issue #53 (Platform-Wide Silent Fallback Defaults)
- **BRRRR Bug**: User-reported 9.5% → 7.5% refinance rate issue
