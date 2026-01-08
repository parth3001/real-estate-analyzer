# TIER 3: Data Flow Validation - Comprehensive Test Plan

**Issue**: #53 - Platform-Wide Silent Fallback Defaults
**Objective**: Verify all 35+ user-customizable fields reach backend correctly with NO silent fallbacks
**Target Confidence**: 95%+ (up from current 60-70%)
**Timeline**: 1-2 days full implementation

---

## Test Strategy Overview

### **Testing Approach**
1. **Integration Tests**: Frontend payload → Backend analyzers → Verify output
2. **Unit Tests**: Individual analyzer methods with mocked inputs
3. **Edge Case Tests**: Zero values, extreme values, boundary conditions
4. **Regression Tests**: Ensure fixes don't break existing functionality

### **Success Criteria**
- ✅ All 35 user-customizable fields verified reaching backend
- ✅ Zero values preserved correctly (0% vacancy, $0 HOA)
- ✅ Nested objects initialized properly (brrrr, longTermAssumptions)
- ✅ No silent fallbacks for user-provided values
- ✅ Clear error messages when required fields missing
- ✅ 100% test pass rate

---

## Test File Structure

```
/backend/src/tests/tier3/
├── brrrr-data-flow.test.ts           # BRRRR strategy fields (8 tests)
├── buyhold-data-flow.test.ts         # Buy & Hold fields (5 tests)
├── multifamily-data-flow.test.ts     # Multi-Family fields (10 tests)
├── longterm-assumptions.test.ts      # Long-term projections (7 tests)
├── edge-cases-zero-values.test.ts    # Zero value preservation (5 tests)
├── fixtures/
│   ├── baseBRRRProperty.ts           # Reusable BRRRR test data
│   ├── baseBuyHoldProperty.ts        # Reusable Buy & Hold data
│   └── baseMultiFamilyProperty.ts    # Reusable MF data
└── helpers/
    └── testHelpers.ts                # Shared test utilities
```

---

## Test Coverage Breakdown

### **1. BRRRR Strategy Data Flow** (8 Critical Fields)

**File**: `brrrr-data-flow.test.ts`

| Field | Test Case | Risk Level | Priority |
|-------|-----------|------------|----------|
| `refinanceInterestRate` | User: 9.25%, Verify: 9.25% used (NOT 7.5%) | 🔴 Critical | P0 |
| `seasoningPeriod` | User: 18 months, Verify: 18 (NOT 12) | 🟡 High | P1 |
| `refinanceLTV` | User: 80%, Verify: 80% (NOT 75%) | 🟡 High | P1 |
| `estimatedRehabTime` | User: 4 months, Verify: 4 (NOT 6) | 🟡 Medium | P2 |
| `refinanceClosingCostPercentage` | User: 3%, Verify: 3% (NOT 2%) | 🟡 Medium | P2 |
| `ARV` | User: $150K, Verify: $150K preserved | 🔴 Critical | P0 |
| `rehabBudget` | User: $30K, Verify: $30K preserved | 🔴 Critical | P0 |
| `cashOutAmount` | User: $10K, Verify: $10K preserved | 🟢 Low | P3 |

**Expected Tests**: 8 integration tests + 3 edge cases = **11 tests**

---

### **2. Long-Term Assumptions** (7 Critical Fields)

**File**: `longterm-assumptions.test.ts`

| Field | Test Case | Risk Level | Priority |
|-------|-----------|------------|----------|
| `appreciationRate` | User: 3.5%, Verify: 3.5% (NOT 3%) | 🟡 High | P1 |
| `rentGrowthRate` | User: 2%, Verify: 2% (NOT 3%) | 🟡 High | P1 |
| `expenseGrowthRate` | User: 2.5%, Verify: 2.5% (NOT 3%) | 🟡 High | P1 |
| `vacancyRate` | User: 0%, Verify: 0% (NOT 5%) | 🔴 Critical | P0 |
| `capExReserve` | User: 0%, Verify: 0% (NOT 5%) | 🟡 Medium | P2 |
| `turnoverFrequency` | User: 3 years, Verify: 3 (NOT 2) | 🟢 Low | P3 |
| `realtorCommission` | User: 0.6%, Verify: 0.6% (NOT 0.5%) | 🟢 Low | P3 |

**Expected Tests**: 7 integration tests + 2 edge cases (zero values) = **9 tests**

---

### **3. Buy & Hold Specific Fields** (5 Fields)

**File**: `buyhold-data-flow.test.ts`

| Field | Test Case | Risk Level | Priority |
|-------|-----------|------------|----------|
| `tenantTurnoverFees` | User: $1500, Verify: $1500 preserved | 🟡 Medium | P2 |
| `propertyManagementFee` | User: 8%, Verify: 8% (NOT 10%) | 🟡 Medium | P2 |
| `monthlyHOA` | User: $0, Verify: $0 (NOT default) | 🟡 Medium | P2 |
| `monthlyUtilities` | User: $0, Verify: $0 (owner-paid = 0) | 🟢 Low | P3 |
| `otherMonthlyExpenses` | User: $200, Verify: $200 preserved | 🟢 Low | P3 |

**Expected Tests**: 5 integration tests + 2 edge cases (zero values) = **7 tests**

---

### **4. Multi-Family Specific Fields** (10 Fields)

**File**: `multifamily-data-flow.test.ts`

| Field | Test Case | Risk Level | Priority |
|-------|-----------|------------|----------|
| `totalUnits` | User: 8 units, Verify: 8 preserved | 🔴 Critical | P0 |
| `totalSqft` | User: 6400 sqft, Verify: 6400 preserved | 🟡 High | P1 |
| `maintenanceCostPerUnit` | User: $150/unit, Verify: $150 (NOT $100) | 🔴 Critical | P0 |
| `vacancyRate` | User: 3%, Verify: 3% (NOT 5%) | 🟡 High | P1 |
| `units[]` (granular) | 8 units with individual rents, Verify: all preserved | 🟡 High | P1 |
| `unitTypes[]` (bulk) | 4 units @ $1200, 4 @ $1400, Verify: correct totals | 🟡 High | P1 |
| `commonAreaUtilities` | User: $400/month, Verify: $400 preserved | 🟢 Low | P3 |
| `parkingIncome` | User: $200/month, Verify: $200 preserved | 🟢 Low | P3 |
| `laundryIncome` | User: $100/month, Verify: $100 preserved | 🟢 Low | P3 |
| `otherIncome` | User: $50/month, Verify: $50 preserved | 🟢 Low | P3 |

**Expected Tests**: 10 integration tests + 3 edge cases = **13 tests**

---

### **5. Edge Cases & Zero Values** (Critical Risk Areas)

**File**: `edge-cases-zero-values.test.ts`

| Test Case | Scenario | Expected Behavior | Risk |
|-----------|----------|-------------------|------|
| **Zero Vacancy** | User: 0% vacancy (Section 8, 5-yr lease) | Preserve 0%, NOT 5% | 🔴 Critical |
| **Zero HOA** | User: $0 HOA (no HOA) | Preserve $0, NOT skip field | 🟡 Medium |
| **Zero CapEx** | User: 0% CapEx (new construction) | Preserve 0%, NOT 5% | 🟡 Medium |
| **Zero Interest Rate** | User: 0% interest (promo rate) | Preserve 0%, NOT fallback | 🔴 Critical |
| **Extreme Values** | User: 50% down payment | Preserve 50%, validate reasonable | 🟢 Low |
| **Negative Values** | User: -5% appreciation (declining market) | Preserve negative, validate | 🟡 Medium |
| **Boundary Values** | User: 100% LTV (no down payment) | Validate edge case handling | 🟢 Low |

**Expected Tests**: **7 edge case tests**

---

## Test Implementation Plan

### **Phase 1: Setup & Infrastructure** (2 hours)

#### **Task 1.1: Create Test Fixtures** (45 min)
**File**: `/backend/src/tests/tier3/fixtures/baseBRRRProperty.ts`

```typescript
export const baseBRRRProperty = {
  // Core property details
  address: '123 Test Street',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',

  // Purchase details
  purchasePrice: 100000,
  downPayment: 20000,
  closingCosts: 2000,
  interestRate: 7.5,
  loanTerm: 30,

  // Rental income
  monthlyRent: 1500,

  // BRRRR specific
  brrrr: {
    ARV: 150000,
    rehabBudget: 30000,
    refinanceInterestRate: 9.25,  // TEST: Should NOT fall back to 7.5
    refinanceLTV: 80,              // TEST: Should NOT fall back to 75
    seasoningPeriod: 18,           // TEST: Should NOT fall back to 12
    estimatedRehabTime: 4,         // TEST: Should NOT fall back to 6
    refinanceClosingCostPercentage: 3,
    cashOutAmount: 0
  },

  // Long-term assumptions
  longTermAssumptions: {
    appreciationRate: 3.5,
    rentGrowthRate: 2,
    expenseGrowthRate: 2.5,
    vacancyRate: 0,              // TEST: Zero value should be preserved
    capExReserve: 5,
    turnoverFrequency: 2,
    realtorCommission: 0.5
  },

  // Monthly expenses
  monthlyPropertyTax: 200,
  monthlyInsurance: 100,
  monthlyHOA: 0,                 // TEST: Zero value should be preserved
  monthlyUtilities: 0,
  propertyManagementFee: 10,
  maintenanceCostPerMonth: 150,
  tenantTurnoverFees: 1000,

  // Strategy
  investmentStrategy: 'BRRRR'
};
```

#### **Task 1.2: Create Test Helpers** (30 min)
**File**: `/backend/src/tests/tier3/helpers/testHelpers.ts`

```typescript
import { InvestmentDecisionEngine } from '../../../services/investment/investmentDecisionEngine';

/**
 * Helper to run analysis and extract specific field values
 */
export async function analyzeAndExtractField(
  propertyData: any,
  fieldPath: string
): Promise<any> {
  const engine = new InvestmentDecisionEngine();
  const result = await engine.analyze(propertyData);

  // Extract field using dot notation (e.g., 'brrrr.refinanceInterestRate')
  return fieldPath.split('.').reduce((obj, key) => obj?.[key], result.analysis);
}

/**
 * Helper to verify no fallback occurred
 */
export function expectNoFallback(
  userInput: any,
  actualValue: any,
  defaultValue: any,
  fieldName: string
) {
  expect(actualValue).toBe(userInput);
  expect(actualValue).not.toBe(defaultValue);
  console.log(`✅ ${fieldName}: User input ${userInput} preserved (NOT ${defaultValue})`);
}

/**
 * Helper to verify zero value preserved
 */
export function expectZeroPreserved(
  actualValue: any,
  fieldName: string
) {
  expect(actualValue).toBe(0);
  expect(actualValue).not.toBe(null);
  expect(actualValue).not.toBe(undefined);
  console.log(`✅ ${fieldName}: Zero value preserved correctly`);
}
```

#### **Task 1.3: Create Test Directory Structure** (15 min)
```bash
mkdir -p backend/src/tests/tier3/fixtures
mkdir -p backend/src/tests/tier3/helpers
```

---

### **Phase 2: BRRRR Data Flow Tests** (3 hours)

**File**: `/backend/src/tests/tier3/brrrr-data-flow.test.ts`

**Test Count**: 11 tests
**Coverage**: refinanceInterestRate, seasoningPeriod, refinanceLTV, estimatedRehabTime, ARV, rehabBudget, refinanceClosingCostPercentage, cashOutAmount

---

### **Phase 3: Long-Term Assumptions Tests** (2 hours)

**File**: `/backend/src/tests/tier3/longterm-assumptions.test.ts`

**Test Count**: 9 tests
**Coverage**: appreciationRate, rentGrowthRate, expenseGrowthRate, vacancyRate (including 0%), capExReserve, turnoverFrequency, realtorCommission

---

### **Phase 4: Buy & Hold Tests** (1.5 hours)

**File**: `/backend/src/tests/tier3/buyhold-data-flow.test.ts`

**Test Count**: 7 tests
**Coverage**: tenantTurnoverFees, propertyManagementFee, monthlyHOA (including $0), monthlyUtilities, otherMonthlyExpenses

---

### **Phase 5: Multi-Family Tests** (3 hours)

**File**: `/backend/src/tests/tier3/multifamily-data-flow.test.ts`

**Test Count**: 13 tests
**Coverage**: totalUnits, totalSqft, maintenanceCostPerUnit, vacancyRate, units[], unitTypes[], commonAreaUtilities, parking/laundry/other income

---

### **Phase 6: Edge Cases Tests** (2 hours)

**File**: `/backend/src/tests/tier3/edge-cases-zero-values.test.ts`

**Test Count**: 7 tests
**Coverage**: Zero vacancy, zero HOA, zero CapEx, zero interest rate, extreme values, negative values, boundary conditions

---

## Total Test Count: **47 Tests**

**Breakdown**:
- BRRRR: 11 tests
- Long-Term Assumptions: 9 tests
- Buy & Hold: 7 tests
- Multi-Family: 13 tests
- Edge Cases: 7 tests

---

## Implementation Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Setup & Infrastructure | 2 hours | 2 hours |
| Phase 2: BRRRR Tests | 3 hours | 5 hours |
| Phase 3: Long-Term Assumptions | 2 hours | 7 hours |
| Phase 4: Buy & Hold Tests | 1.5 hours | 8.5 hours |
| Phase 5: Multi-Family Tests | 3 hours | 11.5 hours |
| Phase 6: Edge Cases | 2 hours | 13.5 hours |
| **Bug Fixes** (contingency) | 2.5 hours | 16 hours |

**Total**: ~16 hours (2 full work days)

---

## Expected Outcomes

### **Confidence Level Increase**
- **Before TIER 3**: 60-70% confidence
- **After TIER 3**: 95%+ confidence

### **Bugs We Expect to Find**
1. **BRRRR Object Initialization Gap** (Issue #51 pattern)
   - Probability: 60%
   - Impact: Multiple BRRRR fields not reaching backend

2. **Long-Term Assumptions Zero Values**
   - Probability: 40%
   - Impact: Zero vacancy/CapEx incorrectly defaulting to 5%

3. **Multi-Family Maintenance Inconsistency** (Already found in audit)
   - Probability: 100% (known issue)
   - Impact: Years 2-10 showing $0 maintenance

4. **Edge Case Handling**
   - Probability: 30%
   - Impact: Extreme values causing calculation errors

### **Production Readiness After TIER 3**
- ✅ All user inputs verified reaching backend
- ✅ Zero value handling confirmed working
- ✅ Edge cases validated
- ✅ Regression prevention in place
- ✅ Clear error messages for missing required fields
- ✅ **SHIP WITH CONFIDENCE** 🚀

---

## Next Steps

1. **Approve Test Plan** ✅ (User approved: "lets do full tier 3 testing")
2. **Phase 1: Setup** - Create fixtures and helpers
3. **Phase 2-6: Implementation** - Write and run all 47 tests
4. **Bug Fixes** - Address any issues discovered
5. **Documentation** - Update ISSUE_TRACKER.md with results
6. **Production Deploy** - Ship with 95%+ confidence

---

**Status**: Ready to begin Phase 1
**Next Action**: Create test fixtures and infrastructure
