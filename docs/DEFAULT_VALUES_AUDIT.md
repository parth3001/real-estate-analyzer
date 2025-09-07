# Default Values Inconsistency Audit
**Date**: September 6, 2025  
**Engineer**: Senior Implementation Engineer  
**Status**: CRITICAL - Pre-Production Fix Required

## Executive Summary
**FINDING**: 4 different default schemas exist across the application, causing financial calculation inconsistencies that directly impact user trust and investment decision accuracy.

**IMPACT**: Same property data produces different cash flows and investment verdicts depending on entry method.

## Detailed Inconsistency Matrix

| Field | PropertyWizard | SFRPropertyForm | Pipeline Prefill | Backend Schema | Financial Impact |
|-------|---------------|-----------------|------------------|----------------|------------------|
| **interestRate** | 0 | 5.5% | 7.0%* | none | **HIGH** - $240K loan: ~$300/mo diff |
| **insuranceRate** | 0.7% | 0.5% | 0.5% | none | **MEDIUM** - $300K: $50/mo diff |
| **inflationRate** | 2% | 2% | 2.5% | none | **LOW** - Long-term projection drift |
| **enhancedGoals** | none | none | defaults | none | **CRITICAL** - Strategy inconsistency |

*Pipeline prefill doesn't set interestRate explicitly, falls back to SFRPropertyForm defaults

## Critical Findings

### 1. Interest Rate Chaos
- **PropertyWizard**: `interestRate: 0` (user must enter)
- **SFRPropertyForm**: `interestRate: 5.5%` (outdated market rate)  
- **Pipeline**: Uses form fallback (5.5%) or user must re-enter

**User Impact**: Same loan amount shows different monthly payments depending on entry method.

### 2. Insurance Rate Mismatch  
- **PropertyWizard**: `insuranceRate: 0.7%`
- **SFRPropertyForm + Pipeline**: `insuranceRate: 0.5%`

**User Impact**: $300K property shows $50/month different expenses.

### 3. Enhanced Goals Missing
- **PropertyWizard**: No enhanced goals defaults (causes crashes)
- **SFRPropertyForm**: No enhanced goals support
- **Pipeline**: Recently added defaults (your fix on Sep 6)

**User Impact**: Strategy preferences lost when switching entry methods.

## Financial Impact Examples

### Scenario 1: $300K Property Analysis
```
Entry Method: PropertyWizard
- insuranceRate: 0.7% = $175/mo insurance
- User must enter interest rate (let's say 6.5%)
- Monthly payment: $1,896 (principal + interest)
- Result: Total monthly cost = $2,071

Entry Method: SFRForm → Pipeline
- insuranceRate: 0.5% = $125/mo insurance  
- interestRate: 5.5% (form default)
- Monthly payment: $1,362 (principal + interest)
- Result: Total monthly cost = $1,487

DIFFERENCE: $584/month ($7,008/year)
VERDICT IMPACT: Could change BUY → PASS
```

## Root Cause Analysis

### Technical Root Causes
1. **No centralized defaults** - Each component defines its own
2. **Copy-paste development** - Defaults duplicated and diverged
3. **No validation** - No checks for consistency across components
4. **Historical drift** - Market rates changed, only some components updated

### Process Root Causes  
1. **No design system** for default values
2. **No code review** for default consistency
3. **No testing** for cross-component consistency

## Risk Assessment

### **CRITICAL RISKS**
- ✅ **User Trust**: "My property analysis keeps changing" 
- ✅ **Financial Accuracy**: Wrong investment decisions due to incorrect defaults
- ✅ **Support Load**: Users will report "data corruption" bugs
- ✅ **Regulatory**: Inconsistent financial calculations in investment platform

### **MODERATE RISKS**  
- Form UX confusion (users re-entering same data)
- Developer productivity (maintaining 4 different schemas)
- QA complexity (testing all entry paths)

## Recommended Fix Strategy

### Phase 1: Create Single Source of Truth
```typescript
// frontend/src/constants/sfrPropertyDefaults.ts
export const SFR_PROPERTY_DEFAULTS = {
  // Market-current rates (as of Sep 2025)
  interestRate: 6.75,        // Current 30-year fixed average
  propertyTaxRate: 1.2,      // National average  
  insuranceRate: 0.7,        // Conservative estimate
  propertyManagementRate: 8, // Industry standard
  
  // Property characteristics
  loanTerm: 30,
  bedrooms: 3,
  bathrooms: 2,
  yearBuilt: new Date().getFullYear() - 20,
  
  // Financial defaults
  downPaymentPercentage: 25,
  closingCostPercentage: 2.5,
  maintenanceReservePercentage: 5,
  
  // Strategy defaults
  enhancedGoals: {
    exitStrategy: 'sale',
    portfolioStrategy: 'cashflow',
    experienceLevel: 'intermediate', 
    riskTolerance: 'moderate',
    freeTextStrategy: ''
  },
  
  // Long term assumptions
  longTermAssumptions: {
    projectionYears: 10,
    annualRentIncrease: 3.0,
    annualPropertyValueIncrease: 3.0,
    sellingCostsPercentage: 6.0,
    inflationRate: 2.5,          // Current economic environment
    vacancyRate: 5.0,
    turnoverFrequency: 2
  },
  
  // Fee structures
  tenantTurnoverFees: {
    prepFees: 500,
    realtorCommission: 0.5
  }
};
```

### Phase 2: Incremental Component Updates
1. **PropertyWizard.tsx** - Replace lines 107-149 with import
2. **SFRPropertyForm.tsx** - Replace lines 29-65 with import  
3. **SFRAnalysis.tsx** - Replace lines 270-291 with import

### Phase 3: Validation & Testing
- Cross-component consistency tests
- Financial calculation regression tests
- User journey testing (save → load → consistency)

## Implementation Timeline
- **Day 1**: Create constants file, update PropertyWizard
- **Day 2**: Update SFRPropertyForm  
- **Day 3**: Update Pipeline prefill
- **Day 4**: Testing and validation
- **Day 5**: Feature flag deployment

## Success Metrics
- ✅ Same property data → Same financial results (all entry methods)
- ✅ User loads saved property → No value changes
- ✅ Investment verdicts consistent across flows
- ✅ Zero "data corruption" support tickets

## Rollback Plan
- Keep old constants in separate file for 1 release cycle
- Feature flag to toggle between old/new defaults
- Database rollback not needed (frontend-only change)

---
**Engineering Assessment**: This is a **CRITICAL** pre-production fix. The financial inconsistencies directly undermine platform credibility and user trust.