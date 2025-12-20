# BRRRR Implementation - Architect Review Session
**Principal Software Architect Assessment**

**Date**: December 17, 2025
**Session Type**: Architecture Review & Implementation Planning
**Reviewer**: Principal Software Architect (from CLAUDE.md)
**Status**: ✅ APPROVED FOR BACKEND IMPLEMENTATION

---

## 🎯 Executive Summary

### **Architect's Verdict: PROCEED IMMEDIATELY** ✅

**Overall Architecture Score**: **95/100** 🏆

**Key Findings**:
1. ✅ **BRRRR is a sub-strategy of SFR property type** (NOT a separate property type)
2. ✅ **80% code reuse** - Extends existing SFRAnalyzer architecture
3. ✅ **Backend-first approach validated** - No UX Designer dependency for Week 1-2
4. ✅ **Strategy pattern implementation is textbook** - Clean, extensible, testable
5. ✅ **5-week timeline realistic** - With 50% buffer to 8 weeks acceptable

**Recommendation**: **START WEEK 1 BACKEND IMPLEMENTATION NOW**

---

## 📋 Critical Architecture Decisions Confirmed

### **Decision 1: BRRRR as SFR Sub-Strategy** ✅

**Question Resolved**: "Is BRRRR a sub-strategy of SFR RE type?"

**Answer**: **YES, CONFIRMED**

#### **Property Type Hierarchy:**
```
┌─────────────────────────────────────────────────┐
│ PROPERTY TYPES (Asset Classes)                  │
├─────────────────────────────────────────────────┤
│ 1. SFR (Single-Family Rental)    ← BRRRR here   │
│ 2. Multi-Family (2-32 units)                    │
│ 3. Commercial (future)                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ SFR INVESTMENT STRATEGIES (Sub-strategies)      │
├─────────────────────────────────────────────────┤
│ 1. Buy & Hold (traditional)                     │
│ 2. House Hacking (live-in rental)               │
│ 3. BRRRR (buy-rehab-rent-refinance-repeat)  ←   │
└─────────────────────────────────────────────────┘
```

#### **Data Model Relationship:**
```typescript
// BRRRR extends SFR (NOT separate type)
interface BRRRRPropertyData extends SFRData {
  propertyType: 'SFR';           // ← Property type
  investmentStrategy: 'brrrr';   // ← Strategy (sub-type)

  // Inherits all 60+ SFR fields
  purchasePrice: number;
  bedrooms: number;
  rentalIncome: number;
  // ... all standard SFR fields

  // Adds BRRRR-specific fields
  brrrr: {
    rehabBudget: number;
    afterRepairValue: number;
    refinanceLTV: number;
    seasoningPeriod: number;
    // ... other BRRRR fields
  };
}
```

#### **Why This Architecture is Correct:**

**BRRRR is NOT a property type because:**
- ❌ You don't buy "BRRRR properties" (you buy single-family homes)
- ❌ Property characteristics are same (bedrooms, bathrooms, sqft)
- ❌ Core financials are same (purchase price, taxes, insurance)

**BRRRR IS an investment strategy because:**
- ✅ Changes HOW you finance (buy → refinance)
- ✅ Changes WHAT metrics matter (capital recovery > IRR)
- ✅ Adds NEW data requirements (ARV, rehab budget)
- ✅ Affects Investment Decision Engine scoring weights

**Architectural Benefit**: **80% code reuse** from SFRAnalyzer

---

### **Decision 2: UX Designer Validation Status** 🔍

**Question**: Has UX Designer validated BRRRR wizard design?

**Answer**: **NO - Not yet validated, but NOT blocking**

**Evidence**:
- BRRRR_STRATEGY_PLANNING.md line 28: "next phase with Architect/UX Designer"
- BRRRR_STRATEGY_PLANNING.md line 1752: "Phase 1: UX Design (UX Designer Persona)"
- Planning documents anticipate UX review, hasn't happened yet

**Architect Decision**:
- ✅ **ACCEPTABLE** - Backend can proceed without UX validation
- ✅ **PARALLEL WORK** - UX Designer can validate during Week 1-2 backend work
- ✅ **NO BLOCKER** - Backend API testable via Postman without frontend

**Recommendation**: Activate UX Designer persona during Week 1-2 for wireframe validation while backend team builds BRRRRAnalyzer service.

---

### **Decision 3: Backend-First Implementation Sequence** ✅

**Approach Validated**: Start with backend (Week 1-2), then frontend (Week 3-4)

**Why This Works**:
```
Week 1-2: Backend (No UX dependencies)
├─ BRRRRAnalyzer service
├─ Capital recovery calculations
├─ ARV reliability scoring
├─ Investment Decision Engine integration
├─ MongoDB schema extensions
└─ API endpoint modifications
   └─ TESTABLE VIA POSTMAN (no frontend needed)

Week 3-4: Frontend (UX validation by then)
├─ Property Wizard conditional fields
├─ BRRRR results display
├─ Capital recovery hero section
└─ 4-phase timeline visualization
```

**Architectural Advantage**:
- ✅ Backend fully tested in isolation
- ✅ Frontend can iterate without backend changes
- ✅ UX Designer validates wireframes in parallel
- ✅ API contract defined early (frontend knows what to expect)

---

## 🏗️ Architecture Assessment Details

### **Strengths of BRRRR Plan (What I Love)** ❤️

**1. Strategy Pattern Implementation** ✅
```typescript
// TEXTBOOK strategy pattern:
export async function generateInvestmentDecision(
  propertyData: SFRData | BRRRRPropertyData,  // Union type
  analysisResults: AnalysisResults,
  marketData?: MarketDataResponse
): Promise<InvestmentDecision> {

  const strategy = propertyData.investmentStrategy || 'buy-hold';

  if (strategy === 'brrrr') {
    // BRRRR-specific scoring path
    const brrrAnalysis = await BRRRRAnalyzer.analyze(propertyData);
    professionalAssessment = await calculateBRRRRAssessment(...);
  } else {
    // Standard Buy & Hold path (existing)
    professionalAssessment = await calculateStandardAssessment(...);
  }

  return { verdict, score, professionalAssessment, strategySpecific };
}
```

**Why This is Excellent**:
- ✅ Clean separation of concerns
- ✅ Extensible (easy to add house-hacking, multi-family strategies)
- ✅ Testable (can unit test each strategy independently)
- ✅ Single source of truth (backend handles all logic)

---

**2. Data Model Extension (Backward Compatible)** ✅
```typescript
const dealSchema = new Schema({
  propertyData: {
    // Existing 60+ SFR fields (UNCHANGED)
    purchasePrice: Number,
    downPaymentPercent: Number,
    // ...

    // NEW: Strategy identifier (default preserves existing behavior)
    investmentStrategy: {
      type: String,
      enum: ['buy-hold', 'brrrr', 'house-hack'],
      default: 'buy-hold'  // ← Existing deals remain buy-hold
    },

    // NEW: Optional BRRRR fields (only populated if strategy = 'brrrr')
    brrrr: {
      rehabBudget: Number,
      afterRepairValue: Number,
      refinanceLTV: Number,
      // ... other BRRRR fields
    }
  }
});
```

**Why This is Excellent**:
- ✅ Zero migration required for existing MongoDB documents
- ✅ Existing SFR analyses continue working (default strategy = 'buy-hold')
- ✅ Optional `brrrr` field only populated when needed
- ✅ Ready for future strategies (house-hack next)

---

**3. Code Reuse Strategy (80/20 Rule)** ✅

**Architectural Efficiency**:
```
Existing Code Reused:        ~80%
├─ SFRAnalyzer calculations (mortgage, taxes, cash flow)
├─ Investment Decision Engine v2.1 framework
├─ Property Wizard conditional rendering pattern
├─ MongoDB persistence layer
└─ Apple Design System components

New Code Required:           ~20%
├─ BRRRRAnalyzer service (~500 lines)
├─ BRRRR scoring weights (~200 lines)
├─ Conditional wizard fields (~400 lines)
└─ BRRRR results display (~600 lines)
───────────────────────────────────────
Total New Lines:             ~2,100 lines
```

**Why This is Efficient**:
- ✅ Not reinventing the wheel
- ✅ 5-week timeline realistic
- ✅ Lower bug risk (reusing proven code)

---

**4. Single Source of Truth Maintained** ✅

**Lesson Learned**: Professional Scoring Engine removal (removed duplicate frontend logic)

**BRRRR Implementation**:
- ✅ Backend handles ALL business logic (BRRRRAnalyzer service)
- ✅ Frontend is pure presentation (displays backend results)
- ✅ No duplicate calculation logic
- ✅ Investment Decision Engine remains single decision authority

**Code Example**:
```typescript
// Backend (ONLY place with calculation logic):
export class BRRRRAnalyzer {
  async analyze(inputs: BRRRRInputs): Promise<BRRRRAnalysis> {
    const capitalRecovered = this.calculateCapitalRecovery(inputs);
    const arvReliabilityScore = this.calculateARVReliability(inputs);
    const rehabExecutionScore = this.calculateRehabExecution(inputs);

    return { capitalRecovered, arvReliabilityScore, ... };
  }
}

// Frontend (ONLY displays backend results):
<Typography>Capital Recovered: {formatCurrency(analysis.capitalRecovered)}</Typography>
<Typography>ARV Reliability: {analysis.arvReliabilityScore}/100</Typography>
```

---

### **Technical Risks Identified** ⚠️

**Risk 1: Frontend Wizard Complexity (MODERATE)**
- **Issue**: Conditional BRRRR fields add complexity to Property Wizard
- **Current Wizard**: 4 linear steps (Address → Financing → Rental → Assumptions)
- **BRRRR Wizard**: Needs conditional steps 2B (ARV) and 2C (Refinance)

**Mitigation**:
```typescript
// Clean conditional rendering pattern:
{investmentStrategy === 'brrrr' && (
  <>
    <ARVEstimationStep
      onNext={handleNext}
      initialData={formData.brrrr?.arv}
    />
    <RefinanceParametersStep
      onNext={handleNext}
      initialData={formData.brrrr?.refinance}
    />
  </>
)}
```

**Architectural Note**: UX Designer input critical here for progressive disclosure.

**Residual Risk**: LOW (conditional rendering pattern already used for house-hacking)

---

**Risk 2: ARV Reliability Scoring is Subjective (LOW)**
- **Issue**: No API to validate ARV accuracy (user self-reported)
- **Architectural Decision**: This is SCORING risk, not CALCULATION risk

**Mitigation**:
```typescript
// Conservative scoring protects users:
let score = 50;  // Start neutral

if (professionalAppraisal) {
  score += 20;  // Gold standard
} else if (compsProvided && compsCount >= 5) {
  score += 15;  // Strong evidence
} else {
  score -= 20;  // No proof, penalize heavily
}

// User sees warning:
if (arvReliabilityScore < 60) {
  warnings.push({
    severity: 'high',
    message: 'ARV estimate lacks comparable sales data. Consider professional appraisal ($400-600).'
  });
}
```

**Architectural Soundness**: Backend enforces skepticism, users can override but scores reflect risk.

**Residual Risk**: LOW (business logic risk, not technical risk)

---

**Risk 3: 5-Week Timeline Slippage (MODERATE)**
- **Business Review Prediction**: 50% chance of slipping to 8 weeks
- **Causes**: Frontend complexity, edge case discovery, testing iterations

**Mitigation - Phased Rollout**:
```
Phase 1 MVP (Week 5): LAUNCH
├─ ✅ BRRRR analysis functional
├─ ✅ Capital recovery displayed
├─ ✅ Investment Decision verdicts
├─ ❌ Advanced visualizations (defer to Phase 2)
└─ ❌ Sensitivity analysis tab (defer to Phase 2)

Phase 2 Polish (Week 6-8): ENHANCE
├─ ✅ 4-phase timeline visualization
├─ ✅ Sensitivity analysis tab
├─ ✅ 70% Rule check UI
└─ ✅ Mobile optimizations
```

**Architectural Benefit**: Backend API complete in Week 2, frontend can iterate without backend changes.

**Residual Risk**: MODERATE (typical software project risk, well-mitigated)

---

## 📅 Week 1-2 Backend Implementation Plan

### **Week 1: Backend Foundation** (START HERE)

**Objective**: Implement BRRRRAnalyzer service and core calculations

**File 1: `/backend/src/services/investment/brrrAnalyzer.ts` (NEW)**

```typescript
/**
 * BRRRR Strategy Analyzer
 *
 * Calculates BRRRR-specific metrics:
 * - Capital recovery analysis (40% of scoring weight)
 * - ARV reliability scoring (20% of scoring weight)
 * - Rehab execution scoring (15% of scoring weight)
 * - Post-refinance cash flow
 * - Refinance viability assessment
 */

export interface BRRRRInputs extends SFRData {
  investmentStrategy: 'brrrr';
  brrrr: {
    // Rehab details
    rehabBudget: number;
    rehabScope: 'cosmetic' | 'moderate' | 'major' | 'gut';
    contractorExperience: 'none' | 'diy' | 'experienced' | 'licensed';
    rehabTimeline: number;
    contingencyPercent: number;

    // ARV estimation
    afterRepairValue: number;
    arvConfidence?: {
      professionalAppraisal: boolean;
      comparableSalesProvided: boolean;
      comparablesCount?: number;
      comparablesDateRange?: number;
    };

    // Refinance parameters
    refinanceLTV: number;
    refinanceInterestRate: number;
    refinanceLoanTerm: number;
    refinanceClosingCostPercent: number;
    seasoningPeriod: number;
  };
}

export interface BRRRRAnalysis {
  // Investment phase
  purchasePrice: number;
  rehabBudget: number;
  acquisitionCosts: number;
  totalInvestment: number;

  // Stabilization phase
  seasoningPeriod: number;
  monthlyCashFlowDuringSeasoning: number;
  seasoningCosts: number;

  // Refinance phase
  afterRepairValue: number;
  refinanceLTV: number;
  refinanceLoanAmount: number;
  refinanceClosingCosts: number;
  netRefinanceProceeds: number;
  originalMortgageBalance: number;

  // Capital recovery (THE MAIN EVENT)
  capitalRecovered: number;
  capitalRemaining: number;
  capitalRecoveryRate: number;
  infiniteReturn: boolean;
  excessCashReturned: number;

  // Post-refinance financials
  newMortgageBalance: number;
  newMonthlyPayment: number;
  postRefinanceCashFlow: number;
  postRefinanceDSCR: number;
  effectiveCashOnCash: number;

  // Scoring (integrates with Investment Decision Engine)
  capitalRecoveryScore: number;  // 0-100
  arvReliabilityScore: number;   // 0-100
  rehabExecutionScore: number;   // 0-100
  overallBRRRRScore: number;     // Weighted combination

  // Risk assessment
  arvSensitivity: {
    minus10Percent: { capitalRemaining: number; capitalRecoveryRate: number };
    minus20Percent: { capitalRemaining: number; capitalRecoveryRate: number };
  };
  rehabOverrunSensitivity: {
    plus10Percent: { capitalRemaining: number; capitalRecoveryRate: number };
    plus20Percent: { capitalRemaining: number; capitalRecoveryRate: number };
  };

  // 70% Rule check
  maxPurchasePrice70Rule: number;
  above70Rule: number;
}

export class BRRRRAnalyzer {

  /**
   * Main analysis method
   */
  async analyze(inputs: BRRRRInputs): Promise<BRRRRAnalysis> {
    // Phase 1: Investment
    const totalInvestment = this.calculateTotalInvestment(inputs);
    const acquisitionCosts = this.calculateAcquisitionCosts(inputs.purchasePrice);

    // Phase 2: Stabilization
    const seasoningCosts = this.calculateSeasoningCosts(inputs);

    // Phase 3: Refinance
    const refinanceResults = this.calculateRefinance(inputs);
    const capitalRecovery = this.calculateCapitalRecovery(
      totalInvestment,
      seasoningCosts,
      refinanceResults
    );

    // Phase 4: Post-Refinance
    const postRefiMetrics = this.calculatePostRefinanceMetrics(inputs, refinanceResults);

    // Phase 5: Scoring
    const capitalRecoveryScore = this.calculateCapitalRecoveryScore(capitalRecovery);
    const arvReliabilityScore = this.calculateARVReliabilityScore(inputs);
    const rehabExecutionScore = this.calculateRehabExecutionScore(inputs);

    // Phase 6: Risk Assessment
    const arvSensitivity = this.calculateARVSensitivity(inputs);
    const rehabSensitivity = this.calculateRehabSensitivity(inputs);

    // Phase 7: 70% Rule Check
    const rule70 = this.calculate70RuleCheck(inputs);

    return {
      // All calculated metrics
      purchasePrice: inputs.purchasePrice,
      rehabBudget: inputs.brrrr.rehabBudget,
      acquisitionCosts,
      totalInvestment: totalInvestment + seasoningCosts,

      seasoningPeriod: inputs.brrrr.seasoningPeriod,
      monthlyCashFlowDuringSeasoning: seasoningCosts / inputs.brrrr.seasoningPeriod,
      seasoningCosts,

      afterRepairValue: inputs.brrrr.afterRepairValue,
      refinanceLTV: inputs.brrrr.refinanceLTV,
      refinanceLoanAmount: refinanceResults.loanAmount,
      refinanceClosingCosts: refinanceResults.closingCosts,
      netRefinanceProceeds: refinanceResults.netProceeds,
      originalMortgageBalance: refinanceResults.originalMortgageBalance,

      capitalRecovered: capitalRecovery.capitalRecovered,
      capitalRemaining: capitalRecovery.capitalRemaining,
      capitalRecoveryRate: capitalRecovery.capitalRecoveryRate,
      infiniteReturn: capitalRecovery.infiniteReturn,
      excessCashReturned: capitalRecovery.excessCash,

      newMortgageBalance: postRefiMetrics.mortgageBalance,
      newMonthlyPayment: postRefiMetrics.monthlyPayment,
      postRefinanceCashFlow: postRefiMetrics.cashFlow,
      postRefinanceDSCR: postRefiMetrics.dscr,
      effectiveCashOnCash: postRefiMetrics.effectiveCoC,

      capitalRecoveryScore,
      arvReliabilityScore,
      rehabExecutionScore,
      overallBRRRRScore: this.calculateOverallScore(
        capitalRecoveryScore,
        arvReliabilityScore,
        rehabExecutionScore
      ),

      arvSensitivity,
      rehabOverrunSensitivity: rehabSensitivity,

      maxPurchasePrice70Rule: rule70.maxPrice,
      above70Rule: rule70.above
    };
  }

  /**
   * Phase 1: Calculate total investment
   */
  private calculateTotalInvestment(inputs: BRRRRInputs): number {
    return inputs.purchasePrice +
           inputs.brrrr.rehabBudget +
           this.calculateAcquisitionCosts(inputs.purchasePrice);
  }

  private calculateAcquisitionCosts(purchasePrice: number): number {
    return purchasePrice * 0.03; // 3% typical closing costs
  }

  /**
   * Phase 2: Calculate seasoning costs (if cash flow negative during stabilization)
   */
  private calculateSeasoningCosts(inputs: BRRRRInputs): number {
    // Calculate monthly cash flow during seasoning period
    const monthlyRent = inputs.rentalIncome || 0;
    const originalMortgage = this.calculateOriginalMortgagePayment(inputs);
    const monthlyExpenses = this.calculateMonthlyOperatingExpenses(inputs);

    const monthlyCashFlow = monthlyRent - originalMortgage - monthlyExpenses;

    // If negative, seasoning costs accumulate
    if (monthlyCashFlow < 0) {
      return Math.abs(monthlyCashFlow) * inputs.brrrr.seasoningPeriod;
    }

    return 0; // No seasoning costs if property cash flows positive
  }

  private calculateOriginalMortgagePayment(inputs: BRRRRInputs): number {
    const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPercent / 100);
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numPayments = inputs.loanTerm;

    if (monthlyRate === 0) return loanAmount / numPayments;

    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  private calculateMonthlyOperatingExpenses(inputs: BRRRRInputs): number {
    const monthlyTax = (inputs.purchasePrice * inputs.propertyTaxRate / 100) / 12;
    const monthlyInsurance = inputs.insurance / 12;
    const monthlyMaintenance = inputs.maintenance || 0;
    const monthlyPM = inputs.propertyManagementRate
      ? (inputs.rentalIncome * inputs.propertyManagementRate / 100)
      : 0;

    return monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyPM;
  }

  /**
   * Phase 3: Calculate refinance
   */
  private calculateRefinance(inputs: BRRRRInputs) {
    const loanAmount = inputs.brrrr.afterRepairValue * (inputs.brrrr.refinanceLTV / 100);
    const closingCosts = loanAmount * (inputs.brrrr.refinanceClosingCostPercent / 100);
    const netProceeds = loanAmount - closingCosts;

    // Calculate original mortgage balance after seasoning period
    const originalMortgageBalance = this.calculateMortgageBalance(
      inputs,
      inputs.brrrr.seasoningPeriod
    );

    return {
      loanAmount,
      closingCosts,
      netProceeds,
      originalMortgageBalance
    };
  }

  private calculateMortgageBalance(inputs: BRRRRInputs, monthsPaid: number): number {
    const originalLoan = inputs.purchasePrice * (1 - inputs.downPaymentPercent / 100);
    const monthlyRate = inputs.interestRate / 100 / 12;
    const totalPayments = inputs.loanTerm;

    if (monthlyRate === 0) {
      return originalLoan - (originalLoan / totalPayments * monthsPaid);
    }

    const remainingPayments = totalPayments - monthsPaid;
    const monthlyPayment = this.calculateOriginalMortgagePayment(inputs);

    return monthlyPayment * (Math.pow(1 + monthlyRate, remainingPayments) - 1) /
           (monthlyRate * Math.pow(1 + monthlyRate, remainingPayments));
  }

  /**
   * Phase 4: Calculate capital recovery
   */
  private calculateCapitalRecovery(
    totalInvestment: number,
    seasoningCosts: number,
    refinanceResults: any
  ) {
    const totalInvested = totalInvestment + seasoningCosts;
    const cashToInvestor = refinanceResults.netProceeds - refinanceResults.originalMortgageBalance;
    const capitalRecovered = cashToInvestor;
    const capitalRemaining = totalInvested - capitalRecovered;
    const capitalRecoveryRate = (capitalRecovered / totalInvested) * 100;

    return {
      capitalRecovered: Math.max(0, capitalRecovered),
      capitalRemaining: Math.max(0, capitalRemaining),
      capitalRecoveryRate,
      infiniteReturn: capitalRecoveryRate >= 100,
      excessCash: capitalRecoveryRate >= 100 ? (capitalRecovered - totalInvested) : 0
    };
  }

  /**
   * Phase 5: Calculate post-refinance metrics
   */
  private calculatePostRefinanceMetrics(inputs: BRRRRInputs, refinanceResults: any) {
    const mortgageBalance = refinanceResults.loanAmount;
    const monthlyRate = inputs.brrrr.refinanceInterestRate / 100 / 12;
    const numPayments = inputs.brrrr.refinanceLoanTerm;

    const monthlyPayment = mortgageBalance *
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const monthlyExpenses = this.calculateMonthlyOperatingExpenses(inputs);
    const cashFlow = inputs.rentalIncome - monthlyPayment - monthlyExpenses;

    const annualDebtService = monthlyPayment * 12;
    const noi = (inputs.rentalIncome * 12) - (monthlyExpenses * 12);
    const dscr = noi / annualDebtService;

    const capitalRemaining = refinanceResults.originalMortgageBalance -
                            (refinanceResults.netProceeds - refinanceResults.originalMortgageBalance);
    const effectiveCoC = capitalRemaining > 0
      ? ((cashFlow * 12) / capitalRemaining) * 100
      : Infinity;

    return {
      mortgageBalance,
      monthlyPayment,
      cashFlow,
      dscr,
      effectiveCoC
    };
  }

  /**
   * Phase 6: Capital Recovery Score (40% weight in overall BRRRR score)
   */
  private calculateCapitalRecoveryScore(capitalRecovery: any): number {
    const { capitalRecoveryRate, capitalRemaining } = capitalRecovery;

    let baseScore = 0;

    if (capitalRecoveryRate >= 100) {
      baseScore = 100;  // Infinite return achieved!
    } else if (capitalRecoveryRate >= 90) {
      baseScore = 90 + (capitalRecoveryRate - 90);
    } else if (capitalRecoveryRate >= 75) {
      baseScore = 75 + ((capitalRecoveryRate - 75) / 15) * 15;
    } else if (capitalRecoveryRate >= 50) {
      baseScore = 50 + ((capitalRecoveryRate - 50) / 25) * 25;
    } else {
      baseScore = (capitalRecoveryRate / 50) * 50;
    }

    // Penalty for high capital remaining (absolute dollars matter)
    const capitalRemainingPenalty = Math.min(
      20,
      (capitalRemaining / 100000) * 10  // -10 points per $100K trapped
    );

    return Math.max(0, baseScore - capitalRemainingPenalty);
  }

  /**
   * Phase 7: ARV Reliability Score (20% weight)
   */
  private calculateARVReliabilityScore(inputs: BRRRRInputs): number {
    let score = 50; // Start neutral

    const { afterRepairValue } = inputs.brrrr;
    const { purchasePrice } = inputs;
    const arvLift = ((afterRepairValue - purchasePrice) / purchasePrice) * 100;

    // 1. ARV to Purchase Price Ratio
    if (arvLift < 15) {
      score -= 30;  // Insufficient spread
    } else if (arvLift >= 15 && arvLift <= 40) {
      score += 20;  // Realistic range
    } else if (arvLift > 40 && arvLift <= 60) {
      score += 10;  // Aggressive but possible
    } else if (arvLift > 60) {
      score -= 20;  // Unrealistic expectations
    }

    // 2. Rehab Budget to ARV Lift Ratio
    const arvGain = afterRepairValue - purchasePrice;
    const rehabROI = (arvGain / inputs.brrrr.rehabBudget) * 100;

    if (rehabROI >= 150 && rehabROI <= 250) {
      score += 15;  // Realistic rehab ROI
    } else if (rehabROI > 250) {
      score -= 10;  // Suspiciously high ROI
    } else if (rehabROI < 100) {
      score -= 15;  // Rehab costs too high for value add
    }

    // 3. Comparable Sales Evidence
    if (inputs.brrrr.arvConfidence?.professionalAppraisal) {
      score += 20;  // Pre-appraisal is gold standard
    } else if (inputs.brrrr.arvConfidence?.comparableSalesProvided) {
      const compsCount = inputs.brrrr.arvConfidence.comparablesCount || 0;
      const compsDateRange = inputs.brrrr.arvConfidence.comparablesDateRange || 365;

      if (compsCount >= 5 && compsDateRange <= 90) {
        score += 15;  // Strong comp evidence
      } else if (compsCount >= 3 && compsDateRange <= 180) {
        score += 10;  // Decent comp evidence
      } else {
        score += 5;   // Weak comp evidence
      }
    } else {
      score -= 20;  // No comp evidence (guessing)
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Phase 8: Rehab Execution Score (15% weight)
   */
  private calculateRehabExecutionScore(inputs: BRRRRInputs): number {
    let score = 50; // Start neutral

    const { rehabBudget, rehabScope, contractorExperience, contingencyPercent, rehabTimeline } = inputs.brrrr;
    const { purchasePrice } = inputs;

    // 1. Rehab Budget to Purchase Price Ratio
    const rehabRatio = (rehabBudget / purchasePrice) * 100;

    if (rehabRatio < 10) {
      score += 20;  // Cosmetic rehab (low risk)
    } else if (rehabRatio >= 10 && rehabRatio <= 30) {
      score += 10;  // Moderate rehab (manageable)
    } else if (rehabRatio > 30 && rehabRatio <= 50) {
      score -= 10;  // Major rehab (higher risk)
    } else {
      score -= 20;  // Gut rehab (very high risk)
    }

    // 2. Scope Complexity
    const scopeScores = {
      'cosmetic': 20,
      'moderate': 10,
      'major': -5,
      'gut': -15
    };
    score += scopeScores[rehabScope];

    // 3. Contractor Experience
    const contractorScores = {
      'none': -20,
      'diy': -10,
      'experienced': 10,
      'licensed': 15
    };
    score += contractorScores[contractorExperience];

    // 4. Contingency Buffer
    if (contingencyPercent >= 15) {
      score += 15;
    } else if (contingencyPercent >= 10) {
      score += 10;
    } else {
      score -= 15;
    }

    // 5. Timeline Realism
    const expectedTimeline = this.getExpectedTimeline(rehabScope);
    if (rehabTimeline >= expectedTimeline * 1.2) {
      score += 10;  // Conservative timeline
    } else if (rehabTimeline < expectedTimeline * 0.8) {
      score -= 15;  // Overly optimistic
    }

    return Math.max(0, Math.min(100, score));
  }

  private getExpectedTimeline(scope: string): number {
    const timelines = {
      'cosmetic': 1,
      'moderate': 2,
      'major': 4,
      'gut': 6
    };
    return timelines[scope as keyof typeof timelines] || 3;
  }

  /**
   * Phase 9: Overall BRRRR Score
   */
  private calculateOverallScore(
    capitalRecoveryScore: number,
    arvReliabilityScore: number,
    rehabExecutionScore: number
  ): number {
    // Weighted scoring (matches planning doc)
    return (
      capitalRecoveryScore * 0.40 +  // 40% - Capital Recovery
      arvReliabilityScore * 0.20 +   // 20% - ARV Reliability
      rehabExecutionScore * 0.15 +   // 15% - Rehab Execution
      // Note: Remaining 25% calculated in Investment Decision Engine
      // (Post-refi cash flow 10%, Market 8%, Refinance viability 5%, Property risk 2%)
      0  // Placeholder for remaining 25%
    );
  }

  /**
   * Phase 10: ARV Sensitivity Analysis
   */
  private calculateARVSensitivity(inputs: BRRRRInputs) {
    const { afterRepairValue } = inputs.brrrr;

    // Scenario 1: ARV 10% lower
    const arv10Lower = afterRepairValue * 0.90;
    const analysis10Lower = this.analyzeWithARV(inputs, arv10Lower);

    // Scenario 2: ARV 20% lower
    const arv20Lower = afterRepairValue * 0.80;
    const analysis20Lower = this.analyzeWithARV(inputs, arv20Lower);

    return {
      minus10Percent: {
        capitalRemaining: analysis10Lower.capitalRemaining,
        capitalRecoveryRate: analysis10Lower.capitalRecoveryRate
      },
      minus20Percent: {
        capitalRemaining: analysis20Lower.capitalRemaining,
        capitalRecoveryRate: analysis20Lower.capitalRecoveryRate
      }
    };
  }

  private analyzeWithARV(inputs: BRRRRInputs, arv: number) {
    const modifiedInputs = {
      ...inputs,
      brrrr: {
        ...inputs.brrrr,
        afterRepairValue: arv
      }
    };

    const totalInvestment = this.calculateTotalInvestment(modifiedInputs);
    const seasoningCosts = this.calculateSeasoningCosts(modifiedInputs);
    const refinanceResults = this.calculateRefinance(modifiedInputs);
    const capitalRecovery = this.calculateCapitalRecovery(totalInvestment, seasoningCosts, refinanceResults);

    return capitalRecovery;
  }

  /**
   * Phase 11: Rehab Overrun Sensitivity Analysis
   */
  private calculateRehabSensitivity(inputs: BRRRRInputs) {
    const { rehabBudget } = inputs.brrrr;

    // Scenario 1: Rehab 10% over budget
    const rehab10Over = rehabBudget * 1.10;
    const analysis10Over = this.analyzeWithRehabBudget(inputs, rehab10Over);

    // Scenario 2: Rehab 20% over budget
    const rehab20Over = rehabBudget * 1.20;
    const analysis20Over = this.analyzeWithRehabBudget(inputs, rehab20Over);

    return {
      plus10Percent: {
        capitalRemaining: analysis10Over.capitalRemaining,
        capitalRecoveryRate: analysis10Over.capitalRecoveryRate
      },
      plus20Percent: {
        capitalRemaining: analysis20Over.capitalRemaining,
        capitalRecoveryRate: analysis20Over.capitalRecoveryRate
      }
    };
  }

  private analyzeWithRehabBudget(inputs: BRRRRInputs, rehabBudget: number) {
    const modifiedInputs = {
      ...inputs,
      brrrr: {
        ...inputs.brrrr,
        rehabBudget
      }
    };

    const totalInvestment = this.calculateTotalInvestment(modifiedInputs);
    const seasoningCosts = this.calculateSeasoningCosts(modifiedInputs);
    const refinanceResults = this.calculateRefinance(modifiedInputs);
    const capitalRecovery = this.calculateCapitalRecovery(totalInvestment, seasoningCosts, refinanceResults);

    return capitalRecovery;
  }

  /**
   * Phase 12: 70% Rule Check
   */
  private calculate70RuleCheck(inputs: BRRRRInputs) {
    const { afterRepairValue, rehabBudget } = inputs.brrrr;
    const { purchasePrice } = inputs;

    const maxPurchasePrice = (afterRepairValue * 0.70) - rehabBudget;
    const above70Rule = purchasePrice - maxPurchasePrice;

    return {
      maxPrice: maxPurchasePrice,
      above: above70Rule
    };
  }
}
```

**Week 1 Testing**: Create unit tests for each calculation method.

---

**File 2: `/backend/src/services/investment/investmentDecisionEngine.ts` (MODIFY)**

Add BRRRR-specific assessment function:

```typescript
/**
 * Calculate BRRRR-specific professional assessment
 */
async function calculateBRRRRAssessment(
  propertyData: BRRRRPropertyData,
  analysisResults: AnalysisResults,
  brrrAnalysis: BRRRRAnalysis,
  marketData?: MarketDataResponse
): Promise<ProfessionalAssessment> {

  // BRRRR-specific scoring weights (from planning doc)
  const weights = {
    capitalRecovery: 0.40,    // 40% - Capital Recovery Score
    arvReliability: 0.20,     // 20% - ARV Reliability Score
    rehabExecution: 0.15,     // 15% - Rehab Execution Score
    postRefiCashFlow: 0.10,   // 10% - Post-Refinance Cash Flow
    marketStrength: 0.08,     // 8% - Market Support
    refinanceViability: 0.05, // 5% - Refinance Approval Risk
    propertyRisk: 0.02        // 2% - Property Condition
  };

  const capitalRecoveryScore = brrrAnalysis.capitalRecoveryScore;
  const arvReliabilityScore = brrrAnalysis.arvReliabilityScore;
  const rehabExecutionScore = brrrAnalysis.rehabExecutionScore;
  const postRefiCashFlowScore = calculateCashFlowScore(brrrAnalysis.postRefinanceCashFlow);
  const marketStrengthScore = await calculateMarketScore(marketData);
  const refinanceViabilityScore = calculateRefinanceScore(brrrAnalysis.postRefinanceDSCR);
  const propertyRiskScore = calculatePropertyRiskScore(propertyData);

  const dealQuality = (
    capitalRecoveryScore * weights.capitalRecovery +
    arvReliabilityScore * weights.arvReliability +
    rehabExecutionScore * weights.rehabExecution +
    postRefiCashFlowScore * weights.postRefiCashFlow +
    marketStrengthScore * weights.marketStrength +
    refinanceViabilityScore * weights.refinanceViability +
    propertyRiskScore * weights.propertyRisk
  );

  return {
    dealQuality,
    executionDifficulty: calculateExecutionDifficulty(brrrAnalysis),
    dataReliability: arvReliabilityScore,  // ARV confidence = data reliability

    // Factor breakdown
    cashFlowScore: postRefiCashFlowScore,
    irrScore: 0,  // IRR NOT RELEVANT for BRRRR (per Josh feedback)
    marketStrengthScore,
    debtStructureScore: refinanceViabilityScore,
    exitStrategyScore: 0,  // Not relevant for BRRRR (infinite hold)
    capRateScore: 0,       // Less relevant for BRRRR
    propertyRiskScore,

    // Recommendations
    primaryInsight: generateBRRRRInsight(brrrAnalysis),
    strategicRecommendations: generateBRRRRRecommendations(brrrAnalysis),
    riskMitigation: generateBRRRRRisks(brrrAnalysis),
    opportunityMaximization: generateBRRRROpportunities(brrrAnalysis)
  };
}

/**
 * Modify main function to handle BRRRR strategy
 */
export async function generateInvestmentDecision(
  propertyData: SFRData | BRRRRPropertyData,
  analysisResults: AnalysisResults,
  marketData?: MarketDataResponse
): Promise<InvestmentDecision> {

  // Detect strategy
  const strategy = propertyData.investmentStrategy || 'buy-hold';

  let professionalAssessment: ProfessionalAssessment;
  let strategySpecific: any = null;

  if (strategy === 'brrrr') {
    // Run BRRRR-specific analysis
    const brrrAnalysis = await BRRRRAnalyzer.analyze(propertyData as BRRRRPropertyData);
    strategySpecific = brrrAnalysis;

    // Calculate BRRRR professional assessment (different weights)
    professionalAssessment = await calculateBRRRRAssessment(
      propertyData as BRRRRPropertyData,
      analysisResults,
      brrrAnalysis,
      marketData
    );
  } else {
    // Standard Buy & Hold assessment (existing logic)
    professionalAssessment = await calculateStandardAssessment(
      propertyData,
      analysisResults,
      marketData
    );
  }

  // Generate verdict based on strategy-specific assessment
  const verdict = determineVerdict(professionalAssessment.dealQuality);

  return {
    verdict,
    score: professionalAssessment.dealQuality,
    professionalAssessment,
    strategySpecific,  // BRRRR analysis if applicable, null otherwise
    primaryReason: professionalAssessment.primaryInsight,
    secondaryReasons: professionalAssessment.strategicRecommendations,
    keyRisks: professionalAssessment.riskMitigation,
    actionPlan: professionalAssessment.opportunityMaximization
  };
}
```

---

**File 3: `/backend/src/models/Deal.ts` (MODIFY)**

Extend schema for BRRRR fields:

```typescript
// Add to existing dealSchema
propertyData: {
  // ... existing 60+ SFR fields (UNCHANGED)

  // NEW: Strategy identifier
  investmentStrategy: {
    type: String,
    enum: ['buy-hold', 'brrrr', 'house-hack'],
    default: 'buy-hold'  // Preserves existing behavior
  },

  // NEW: Optional BRRRR fields
  brrrr: {
    rehabBudget: Number,
    rehabScope: {
      type: String,
      enum: ['cosmetic', 'moderate', 'major', 'gut']
    },
    rehabBreakdown: {
      kitchenRenovation: Number,
      bathroomUpdates: Number,
      flooringAndPaint: Number,
      systemsUpgrades: Number,
      exteriorImprovements: Number,
      contingency: Number
    },
    contractorExperience: {
      type: String,
      enum: ['none', 'diy', 'experienced', 'licensed']
    },
    rehabTimeline: Number,
    contingencyPercent: Number,

    afterRepairValue: Number,
    arvConfidence: {
      professionalAppraisal: Boolean,
      appraisalCost: Number,
      comparableSalesProvided: Boolean,
      comparablesCount: Number,
      comparablesDateRange: Number
    },

    refinanceLTV: Number,
    refinanceInterestRate: Number,
    refinanceLoanTerm: Number,
    refinanceClosingCostPercent: Number,
    seasoningPeriod: Number,

    minimumDSCR: Number,
    minimumCreditScore: Number,
    reservesRequired: Number
  }
},

analysis: {
  // ... existing analysis fields

  // NEW: Strategy-specific analysis results
  strategySpecific: {
    type: Schema.Types.Mixed,  // Flexible for different strategies
    // For BRRRR: Contains BRRRRAnalysis object
  }
}
```

**Migration Notes**: No migration needed - `default: 'buy-hold'` preserves existing deals.

---

**File 4: `/backend/src/controllers/deals.ts` (MODIFY)**

Update analyze endpoint controller:

```typescript
export async function analyzeDeal(req: Request, res: Response) {
  try {
    const { propertyData } = req.body;

    // Detect strategy
    const strategy = propertyData.investmentStrategy || 'buy-hold';

    // Run standard SFR analysis (existing - all strategies need this)
    const analysisResults = await SFRAnalyzer.analyze(propertyData);

    // Fetch market data (existing)
    const marketData = await marketIntelligenceService.getMarketData(propertyData);

    // If BRRRR, run additional BRRRR-specific analysis
    let strategySpecific = null;
    if (strategy === 'brrrr') {
      const BRRRRAnalyzer = require('../services/investment/brrrAnalyzer').BRRRRAnalyzer;
      const analyzer = new BRRRRAnalyzer();
      strategySpecific = await analyzer.analyze(propertyData);
    }

    // Generate Investment Decision (handles both strategies)
    const investmentDecision = await generateInvestmentDecision(
      propertyData,
      analysisResults,
      marketData
    );

    // Return response with strategy-specific data
    res.json({
      verdict: investmentDecision.verdict,
      score: investmentDecision.score,
      metrics: analysisResults,
      strategySpecific,  // Present if BRRRR, null otherwise
      professionalAssessment: investmentDecision.professionalAssessment,
      primaryReason: investmentDecision.primaryReason,
      actionPlan: investmentDecision.actionPlan,
      keyRisks: investmentDecision.keyRisks
    });

  } catch (error) {
    console.error('Deal analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
```

---

### **Week 1 Deliverables Checklist:**

- [ ] Create `/backend/src/services/investment/brrrAnalyzer.ts`
- [ ] Implement all 12 calculation phases (investment, stabilization, refinance, etc.)
- [ ] Modify `/backend/src/services/investment/investmentDecisionEngine.ts`
- [ ] Add `calculateBRRRRAssessment()` function
- [ ] Update `generateInvestmentDecision()` to handle BRRRR
- [ ] Extend `/backend/src/models/Deal.ts` schema
- [ ] Modify `/backend/src/controllers/deals.ts` analyze endpoint
- [ ] Create unit tests for BRRRRAnalyzer calculations
- [ ] Test via Postman with sample BRRRR property data

**Success Criteria**: POST `/api/deals/analyze` with BRRRR property returns full `strategySpecific` analysis object.

---

### **Week 2: Testing + Investment Decision Engine Messaging**

**Priority 1: BRRRR Insight Generation Functions**

```typescript
// Add to investmentDecisionEngine.ts

function generateBRRRRInsight(brrrAnalysis: BRRRRAnalysis): string {
  const { capitalRecoveryRate, infiniteReturn, capitalRemaining } = brrrAnalysis;

  if (infiniteReturn) {
    return `🏆 INFINITE RETURN ACHIEVED! You've recovered 100% of invested capital (${formatCurrency(brrrAnalysis.capitalRecovered)}). This property generates ${formatCurrency(brrrAnalysis.postRefinanceCashFlow)}/month with $0 of your money remaining.`;
  }

  if (capitalRecoveryRate >= 85) {
    return `Strong BRRRR opportunity with ${capitalRecoveryRate.toFixed(1)}% capital recovery. Only ${formatCurrency(capitalRemaining)} remains invested after refinance.`;
  }

  if (capitalRecoveryRate >= 60) {
    return `Partial capital recovery (${capitalRecoveryRate.toFixed(1)}%). ${formatCurrency(capitalRemaining)} remains invested. Negotiate purchase price to improve recovery rate.`;
  }

  return `Low capital recovery (${capitalRecoveryRate.toFixed(1)}%). ${formatCurrency(capitalRemaining)} remains trapped. This is not a strong BRRRR deal.`;
}

function generateBRRRRRecommendations(brrrAnalysis: BRRRRAnalysis): string[] {
  const recommendations: string[] = [];

  // 70% Rule check
  if (brrrAnalysis.above70Rule > 0) {
    recommendations.push(
      `Negotiate purchase price to ${formatCurrency(brrrAnalysis.maxPurchasePrice70Rule)} to meet 70% Rule (currently ${formatCurrency(brrrAnalysis.above70Rule)} above).`
    );
  }

  // ARV reliability
  if (brrrAnalysis.arvReliabilityScore < 60) {
    recommendations.push(
      `Get professional appraisal ($400-600) to validate ARV estimate. Current confidence: ${brrrAnalysis.arvReliabilityScore}/100.`
    );
  }

  // Rehab execution
  if (brrrAnalysis.rehabExecutionScore < 60) {
    recommendations.push(
      `Increase contingency buffer to 15%+ and secure licensed contractor quotes before proceeding.`
    );
  }

  // Post-refi cash flow
  if (brrrAnalysis.postRefinanceCashFlow < 0) {
    recommendations.push(
      `Property will have negative cash flow (${formatCurrency(brrrAnalysis.postRefinanceCashFlow)}/month) after refinance. Negotiate higher rent or lower purchase price.`
    );
  }

  return recommendations;
}

function generateBRRRRRisks(brrrAnalysis: BRRRRAnalysis): string[] {
  const risks: string[] = [];

  // ARV sensitivity
  const arvRisk = brrrAnalysis.arvSensitivity.minus10Percent;
  if (arvRisk.capitalRecoveryRate < brrrAnalysis.capitalRecoveryRate - 20) {
    risks.push(
      `ARV Overestimation Risk: If ARV is 10% lower, capital recovery drops to ${arvRisk.capitalRecoveryRate.toFixed(1)}% (${formatCurrency(arvRisk.capitalRemaining)} trapped).`
    );
  }

  // Rehab overrun sensitivity
  const rehabRisk = brrrAnalysis.rehabOverrunSensitivity.plus20Percent;
  if (rehabRisk.capitalRecoveryRate < brrrAnalysis.capitalRecoveryRate - 15) {
    risks.push(
      `Rehab Overrun Risk: If rehab costs 20% over budget, capital recovery drops to ${rehabRisk.capitalRecoveryRate.toFixed(1)}%.`
    );
  }

  // DSCR risk
  if (brrrAnalysis.postRefinanceDSCR < 1.25) {
    risks.push(
      `Refinance Approval Risk: Post-refi DSCR (${brrrAnalysis.postRefinanceDSCR.toFixed(2)}) below Fannie Mae minimum (1.25). DSCR lenders may be required.`
    );
  }

  return risks;
}

function generateBRRRROpportunities(brrrAnalysis: BRRRRAnalysis): ActionItem[] {
  const opportunities: ActionItem[] = [];

  if (brrrAnalysis.above70Rule > 0) {
    opportunities.push({
      priority: 1,
      action: `Negotiate purchase price to ${formatCurrency(brrrAnalysis.maxPurchasePrice70Rule)}`,
      impact: `Increases capital recovery by ${((brrrAnalysis.above70Rule / brrrAnalysis.capitalRemaining) * 100).toFixed(0)}%`
    });
  }

  if (brrrAnalysis.arvReliabilityScore < 70) {
    opportunities.push({
      priority: 2,
      action: 'Get professional appraisal to validate ARV',
      impact: 'Reduces deal risk, improves lender approval odds'
    });
  }

  if (brrrAnalysis.postRefinanceCashFlow < 200) {
    opportunities.push({
      priority: 3,
      action: 'Negotiate rent increase with tenant or find higher-paying tenant',
      impact: `Each $100/month rent increase improves effective CoC by ${((1200 / brrrAnalysis.capitalRemaining) * 100).toFixed(1)}%`
    });
  }

  return opportunities;
}
```

**Priority 2: QE Test Suite**

Create `/backend/tests/brrrAnalyzer.test.ts`:

```typescript
import { BRRRRAnalyzer } from '../src/services/investment/brrrAnalyzer';

describe('BRRRR Analyzer - Capital Recovery', () => {
  it('calculates infinite return correctly (100%+ capital recovery)', async () => {
    const inputs = {
      purchasePrice: 100000,
      downPaymentPercent: 20,
      interestRate: 7.0,
      loanTerm: 360,
      rentalIncome: 1500,
      propertyTaxRate: 1.2,
      insurance: 1200,
      investmentStrategy: 'brrrr' as const,
      brrrr: {
        rehabBudget: 30000,
        rehabScope: 'moderate' as const,
        afterRepairValue: 200000,
        refinanceLTV: 75,
        refinanceInterestRate: 7.0,
        refinanceLoanTerm: 360,
        refinanceClosingCostPercent: 2.5,
        seasoningPeriod: 12,
        contractorExperience: 'licensed' as const,
        rehabTimeline: 3,
        contingencyPercent: 15
      }
    };

    const analyzer = new BRRRRAnalyzer();
    const result = await analyzer.analyze(inputs);

    expect(result.capitalRecoveryRate).toBeGreaterThan(100);
    expect(result.infiniteReturn).toBe(true);
    expect(result.excessCashReturned).toBeGreaterThan(0);
  });

  it('matches 70% rule expectations', async () => {
    const inputs = {
      purchasePrice: 150000,
      brrrr: {
        afterRepairValue: 250000,
        rehabBudget: 50000
      }
    };

    const analyzer = new BRRRRAnalyzer();
    const result = await analyzer.analyze(inputs);

    // 70% rule: Max purchase = (ARV × 0.70) - Rehab
    // = ($250K × 0.70) - $50K = $125K
    expect(result.maxPurchasePrice70Rule).toBe(125000);
    expect(result.above70Rule).toBe(25000);  // $150K - $125K
  });

  it('applies conservative ARV scoring when no comps provided', async () => {
    const inputs = {
      brrrr: {
        afterRepairValue: 250000,
        arvConfidence: {
          professionalAppraisal: false,
          comparableSalesProvided: false
        }
      }
    };

    const analyzer = new BRRRRAnalyzer();
    const result = await analyzer.analyze(inputs);

    expect(result.arvReliabilityScore).toBeLessThan(50);  // Penalized
  });

  it('rewards professional appraisal with high ARV reliability score', async () => {
    const inputs = {
      purchasePrice: 150000,
      brrrr: {
        rehabBudget: 50000,
        afterRepairValue: 250000,
        arvConfidence: {
          professionalAppraisal: true
        }
      }
    };

    const analyzer = new BRRRRAnalyzer();
    const result = await analyzer.analyze(inputs);

    expect(result.arvReliabilityScore).toBeGreaterThan(80);  // High score
  });
});
```

**Week 2 Deliverables**:
- [ ] BRRRR insight generation functions (4 functions)
- [ ] QE test suite (10+ test cases)
- [ ] Backend 100% complete and tested
- [ ] Postman collection with example BRRRR requests

---

## 🚀 Ready to Start Implementation

**Next Immediate Action**: Create `/backend/src/services/investment/brrrAnalyzer.ts` and begin Week 1 implementation.

**No Blockers**: UX Designer validation can happen in parallel, not required for backend work.

**Timeline Confidence**: 5 weeks realistic, 8 weeks with buffer.

**Architecture Verdict**: **EXCELLENT (95/100) - PROCEED IMMEDIATELY** ✅

---

**Document Status**: ✅ COMPLETE
**Next Action**: START WEEK 1 BACKEND IMPLEMENTATION
**Session Type**: Architecture review + implementation planning
**Confidence Level**: 95%

---

**End of Architect Review Session Document**
