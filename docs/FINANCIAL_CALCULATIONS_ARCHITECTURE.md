# Financial Calculations Architecture - Shared vs Separate

**Created**: October 25, 2025
**Question**: "So do we have separate financialCalculation for MF vs SFR?"
**Answer**: **YES - But also shared utilities**

---

## 🏗️ **Architecture Overview**

The `financialCalculations.ts` file has **THREE layers**:

```
┌─────────────────────────────────────────────────────────────┐
│  FinancialCalculations (Static Utility Class)              │
│  - Shared helper methods (IRR, NPV, PMT, etc.)             │
│  - Property-agnostic calculations                           │
│  - Used by BOTH SFR and MF                                  │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ (uses)
         ┌──────────────────┴──────────────────┐
         │                                     │
┌────────┴──────────┐              ┌──────────┴────────┐
│ SFRCalculationEngine│              │ MFCalculationEngine│
│ (Lines 745-831)     │              │ (Lines 833-893)    │
│ - SFR-specific logic│              │ - MF-specific logic│
│ - Uses base class   │              │ - Uses base class  │
└─────────────────────┘              └────────────────────┘
         ↑                                     ↑
         │ (calls)                             │ (calls)
┌────────┴──────────┐              ┌──────────┴────────┐
│   SFRAnalyzer     │              │ MultiFamilyAnalyzer│
│   (uses SFR       │              │ (uses MF methods   │
│    engine)        │              │  directly)         │
└───────────────────┘              └────────────────────┘
```

---

## 📊 **Current State Analysis**

### **1. Shared Utilities** (`FinancialCalculations` class - Lines 5-703)

**Used by BOTH SFR and MF**:
```typescript
export class FinancialCalculations {
  // Mortgage calculations
  static calculateMonthlyMortgage(principal, rate, term): number
  static calculateIRR(cashFlows): number
  static calculateNPV(cashFlows, rate): number

  // Financial metrics (property-agnostic)
  static calculateCashFlow(noi, debtService): number
  static calculateCapRate(noi, purchasePrice): number
  static calculateDSCR(noi, debtService): number
  static calculateCashOnCashReturn(cashFlow, investment): number

  // Utility functions
  static calculateOperatingExpenseRatio(opex, income): number
  static calculatePricePerSqFt(price, sqft): number
  static calculateEffectiveIncome(gross, vacancyRate): number
  static calculateNOI(effectiveIncome, opex): number

  // Projection helpers
  static calculateProjectedAmount(base, growthRate, year): number
  static calculateTurnoverCosts(...): number
}
```

**✅ These are SHARED** - same logic for both property types.

---

### **2. SFR-Specific Engine** (`SFRCalculationEngine` - Lines 745-831)

```typescript
export class SFRCalculationEngine extends BaseCalculationEngine {
  // SFR-specific implementations
  static calculateGrossIncome(data: SFRData, year: number): number {
    // Single property: monthlyRent * 12 * growth factor
  }

  static calculateOperatingExpenses(data: SFRData, grossIncome, year, assumptions): number {
    // SFR expenses: tax, insurance, management, maintenance
    // Uses baseCalculateBaseOperatingExpenses() + SFR turnover
    // ✅ NO vacancy in expenses (uses unified engine - fixed earlier)
  }

  static calculatePropertySpecificMetrics(data, commonMetrics, assumptions): SFRMetrics {
    // SFR-specific: pricePerSqFt, rentPerSqFt, GRM
  }
}
```

**Used by**: `SFRAnalyzer` (Line 14-17 in SFRAnalyzer.ts)
```typescript
export class SFRAnalyzer {
  protected calculateOperatingExpenses(grossIncome: number): number {
    return SFRCalculationEngine.calculateOperatingExpenses(
      this.data,
      grossIncome,
      1,
      this.assumptions
    );
  }
}
```

---

### **3. MF-Specific Engine** (`MFCalculationEngine` - Lines 833-893)

```typescript
export class MFCalculationEngine extends BaseCalculationEngine {
  // MF-specific implementations
  static calculateGrossIncome(data: MultiFamilyData, year: number): number {
    // Multiple units: sum all unit types * rent * count * 12
    return data.unitTypes.reduce((total, unit) =>
      total + (unit.monthlyRent * unit.count * 12), 0
    );
  }

  static calculateOperatingExpenses(data: MultiFamilyData, grossIncome, year, assumptions): number {
    // MF expenses: tax, insurance, management, maintenance
    // + commonAreaUtilities (MF-specific)
    // + turnoverCosts (scaled by unit count)
    // ⚠️ NOTE: This still has the OLD logic (may include vacancy)
  }

  static calculatePropertySpecificMetrics(data, commonMetrics, assumptions): MultiFamilyMetrics {
    // MF-specific: pricePerUnit, noiPerUnit, etc.
    // ⚠️ NOTE: Missing unitMixEfficiency, debtYield implementations
  }
}
```

**Currently USED by**: Nobody! (MultiFamilyAnalyzer implements its own methods)

---

## ⚠️ **Current Situation: MultiFamilyAnalyzer Does NOT Use MFCalculationEngine**

### **What MultiFamilyAnalyzer Actually Uses**:

**Line 2 in MultiFamilyAnalyzer.ts**:
```typescript
import { FinancialCalculations } from '../utils/financialCalculations';
// ✅ Imports shared utilities only
// ❌ Does NOT import MFCalculationEngine
```

**Lines 38-76, 82-148**:
```typescript
export class MultiFamilyAnalyzer {
  // ✅ Implements its OWN calculateOperatingExpenses()
  protected calculateOperatingExpenses(grossIncome: number): number {
    // MF-specific implementation directly in the analyzer
    // (not using MFCalculationEngine)
  }

  // ✅ Implements its OWN calculatePropertySpecificMetrics()
  protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
    // Calls shared FinancialCalculations for utilities:
    const cashFlow = FinancialCalculations.calculateCashFlow(noi, annualDebtService);
    const irr = FinancialCalculations.calculateIRR(cashFlows);

    // But does MF-specific calculations inline
  }
}
```

---

## 🎯 **Why This Hybrid Approach?**

### **Shared Utilities** ✅ GOOD:
```typescript
// These are universal - same for ALL property types
FinancialCalculations.calculateMonthlyMortgage()  // PMT formula
FinancialCalculations.calculateIRR()              // Internal rate of return
FinancialCalculations.calculateCashFlow()         // NOI - Debt Service
FinancialCalculations.calculateCapRate()          // (NOI / Price) * 100
```

### **Separate Engines** ✅ GOOD:
```typescript
// These are property-specific - different logic
SFRCalculationEngine.calculateGrossIncome()       // monthlyRent * 12
MFCalculationEngine.calculateGrossIncome()        // sum(unit.rent * count * 12)

SFRCalculationEngine.calculateOperatingExpenses() // Single-unit logic
MFCalculationEngine.calculateOperatingExpenses()  // Multi-unit + common area
```

---

## 🔍 **Key Findings**

### **1. MFCalculationEngine Exists But Is NOT Used** ⚠️

**Why?**
- Created in earlier iteration
- MultiFamilyAnalyzer evolved to implement methods directly
- MFCalculationEngine may have outdated logic (still includes vacancy in expenses?)

**Options**:
1. **Keep current approach**: MF implements methods directly (simpler, more control)
2. **Refactor to use MFCalculationEngine**: Move logic to engine (more consistent with SFR)

### **2. Shared FinancialCalculations IS Used** ✅

**MultiFamilyAnalyzer uses**:
- `FinancialCalculations.calculateCashFlow()`
- `FinancialCalculations.calculateIRR()`
- `FinancialCalculations.calculateOperatingExpenseRatio()`
- `FinancialCalculations.calculatePricePerSqFt()`

**This is GOOD** - avoids code duplication for universal formulas.

---

## 📋 **Comparison: How Each Analyzer Works**

### **SFRAnalyzer Pattern** (Delegation to Engine):
```typescript
export class SFRAnalyzer {
  protected calculateOperatingExpenses(grossIncome: number): number {
    // ✅ Delegates to SFRCalculationEngine
    return SFRCalculationEngine.calculateOperatingExpenses(
      this.data,
      grossIncome,
      1,
      this.assumptions
    );
  }
}
```

### **MultiFamilyAnalyzer Pattern** (Direct Implementation):
```typescript
export class MultiFamilyAnalyzer {
  protected calculateOperatingExpenses(grossIncome: number): number {
    // ✅ Implements logic directly
    const { purchasePrice, propertyTaxRate, ... } = this.data;

    const propertyTax = purchasePrice * (propertyTaxRate / 100);
    const insurance = purchasePrice * (insuranceRate / 100);
    // ... MF-specific calculations

    return totalExpenses;
  }
}
```

**Both approaches are valid!**
- **SFR**: Delegates to engine (separation of concerns)
- **MF**: Direct implementation (simplicity, full control)

---

## 🚦 **Recommendation: Which Approach to Use?**

### **Current State** (After Story 1.2):
```
✅ WORKS: MultiFamilyAnalyzer implements methods directly
✅ WORKS: Uses shared FinancialCalculations utilities
⚠️ UNUSED: MFCalculationEngine exists but is ignored
```

### **Decision: Keep Current Approach** ✅

**Reasons**:
1. **Story 1.2 NOI fix is working** - MF implements EGI method directly
2. **MFCalculationEngine may be outdated** - might still have old vacancy bug
3. **Direct implementation is clearer** - easier to debug and modify
4. **No duplication of shared utilities** - still uses FinancialCalculations

### **Optional Refactor** (NOT Sprint 1 priority):
```typescript
// Future: Could move MF logic to engine for consistency
export class MultiFamilyAnalyzer {
  protected calculateOperatingExpenses(grossIncome: number): number {
    // Option A: Current (direct implementation) ✅
    return this.calculateMFOperatingExpenses();

    // Option B: Future (delegate to engine)
    return MFCalculationEngine.calculateOperatingExpenses(
      this.data,
      grossIncome,
      1,
      this.assumptions
    );
  }
}
```

**But this is NOT necessary for Sprint 1** - current approach works perfectly.

---

## 📊 **Visual Summary**

### **What Gets Shared**:
```typescript
// ✅ SHARED by both SFR and MF
FinancialCalculations.calculateMonthlyMortgage()
FinancialCalculations.calculateIRR()
FinancialCalculations.calculateCashFlow()
FinancialCalculations.calculateCapRate()
FinancialCalculations.calculateDSCR()
FinancialCalculations.calculateOperatingExpenseRatio()
FinancialCalculations.calculatePricePerSqFt()
```

### **What's Separate**:
```typescript
// ❌ NOT SHARED - SFR-specific
SFRAnalyzer.calculateGrossIncome()          // monthlyRent * 12
SFRAnalyzer.calculateOperatingExpenses()    // Single-unit expenses
SFRAnalyzer.calculatePropertySpecificMetrics() // SFR metrics

// ❌ NOT SHARED - MF-specific
MultiFamilyAnalyzer.calculateGrossIncome()  // sum(units * rent)
MultiFamilyAnalyzer.calculateEffectiveGrossIncome()  // GI - vacancy - credit loss
MultiFamilyAnalyzer.calculateOperatingExpenses()     // Multi-unit + common area
MultiFamilyAnalyzer.calculatePropertySpecificMetrics() // MF metrics
```

---

## ✅ **Bottom Line**

**Question**: "So do we have separate financialCalculation for MF vs SFR?"

**Answer**: **YES and NO**:

1. **Shared Utilities** ✅
   - `FinancialCalculations` class with universal formulas
   - Used by BOTH SFR and MF
   - Examples: IRR, PMT, Cash Flow, Cap Rate

2. **Separate Calculation Engines** ✅
   - `SFRCalculationEngine` for SFR-specific logic
   - `MFCalculationEngine` for MF-specific logic (exists but currently unused)
   - Extends `BaseCalculationEngine` for common patterns

3. **Current Implementation**:
   - **SFR**: Delegates to `SFRCalculationEngine` ✅
   - **MF**: Implements methods directly ✅ (doesn't use `MFCalculationEngine`)

4. **No Risk to SFR** ✅
   - SFR uses `SFRCalculationEngine` exclusively
   - MF implements its own methods
   - Shared utilities are property-agnostic
   - **Complete isolation maintained**

**This architecture provides**:
- ✅ Code reuse for universal formulas (shared utilities)
- ✅ Separation for property-specific logic (separate engines/implementations)
- ✅ Flexibility to implement directly or delegate to engine
- ✅ Zero risk of cross-contamination between SFR and MF

**Sprint 1 Status**: Current approach is working perfectly - no changes needed! 🎯
