# Sprint 1 Kickoff: MultiFamilyAnalyzer Core
## Ready to Begin Implementation

**Start Date**: Now
**Duration**: 2 weeks (80 hours)
**Status**: ✅ **ALL REVIEWS COMPLETE - READY TO CODE**

---

## 🎯 **SPRINT 1 GOAL**

Complete MultiFamilyAnalyzer to match SFR sophistication and output `AnalysisResult<MultiFamilyMetrics>`

**Why This Sprint Matters**:
> "This is the foundation. Sprint 2 (Investment Decision Engine) cannot start until MultiFamilyAnalyzer outputs the correct data structure." - Architect

**Business Impact**:
> "The NOI bug fix alone justifies Sprint 1. One wrong calculation shown to a lender = permanent credibility loss." - Business Expert

---

## 📋 **PRE-SPRINT CHECKLIST**

### **Must Complete BEFORE Starting Stories** (13 hours):

#### **Architect Tasks** (5 hours):
- [ ] **Create complete type definitions** (2 hours)
  - MultiFamilyMetrics interface with all 9 advanced metrics
  - SensitivityAnalysis interface
  - File: `/backend/src/types/propertyTypes.ts`

- [ ] **Document calculateUnitMixEfficiency() formula** (1 hour)
  - Clarify market average rent/sqft source
  - Add to technical spec

- [ ] **Add error handling specifications** (1 hour)
  - Division by zero handling
  - API failure handling
  - Negative value handling

- [ ] **Copy SFR reference implementations** (1 hour)
  - normalizeOutput() from SFRAnalyzer
  - flattenExpenseBreakdown() from SFRAnalyzer
  - createMortgageObject() from SFRAnalyzer

#### **QE Tasks** (8 hours):
- [ ] **Create test data factories** (4 hours)
  - MFPropertyFactory.create()
  - Factory methods for 2-unit, 8-unit, 32-unit
  - File: `/backend/src/tests/factories/MFPropertyFactory.ts`

- [ ] **Set up manual validation** (4 hours)
  - Create 3 Excel reference properties (2-unit, 8-unit, 32-unit)
  - Implement automated comparison test
  - toBeWithinPercent() custom matcher

---

## 📊 **SPRINT 1 STORIES**

### **Story Priority Order** (from QE + Business Expert):

**Priority 0 (CRITICAL - Day 1)**:
1. ✅ Story 1.2: Fix NOI Calculation Bug ⚠️ **MUST BE FIRST**

**Priority 1 (Week 1)**:
2. Story 1.1: Enhance MultiFamilyData Interface
3. Story 1.5: Add Comprehensive Logging

**Priority 2 (Week 2)**:
4. Story 1.4: Add 9 Advanced MF Metrics
5. Story 1.3: Add Missing Analyzer Methods
6. Story 1.6: Create Unit Tests

---

## 🚨 **STORY 1.2: FIX NOI CALCULATION BUG** (8 hours)

### **Why This is First**:
> "If you present an analysis with vacancy in operating expenses to a commercial lender, they'll reject your loan app and question your competence." - Business Expert

**Current Bug** (Lines 21 & 40 in MultiFamilyAnalyzer.ts):
```typescript
// ❌ WRONG
const vacancy = grossIncome * (this.assumptions.vacancyRate / 100);
return propertyTax + insurance + ... + vacancy; // ❌ DESTROYS INVESTOR TRUST
```

### **The Fix**:

**Step 1: Add calculateEffectiveGrossIncome() method** (2 hours)
```typescript
// /backend/src/analysis/MultiFamilyAnalyzer.ts
protected calculateEffectiveGrossIncome(grossIncome: number): number {
  const vacancyLoss = grossIncome * (this.assumptions.vacancyRate / 100);
  const creditLoss = grossIncome * 0.02;  // 2% bad debt (industry standard)

  console.log('[MF] Gross Income:', grossIncome);
  console.log('[MF] Vacancy Loss (5%):', vacancyLoss);
  console.log('[MF] Credit Loss (2%):', creditLoss);
  console.log('[MF] Effective Gross Income:', grossIncome - vacancyLoss - creditLoss);

  return grossIncome - vacancyLoss - creditLoss;
}
```

**Step 2: Fix calculateOperatingExpenses()** (2 hours)
```typescript
protected calculateOperatingExpenses(grossIncome: number): number {
  const { purchasePrice, propertyTaxRate, insuranceRate, propertyManagementRate, maintenanceCostPerUnit, totalUnits } = this.data;

  // ✅ FIXED: NO vacancy in expenses
  const propertyTax = purchasePrice * (propertyTaxRate / 100);
  const insurance = purchasePrice * (insuranceRate / 100);
  const propertyManagement = grossIncome * (propertyManagementRate / 100);
  const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;

  // Common area utilities
  const commonAreaTotal = Object.values(this.data.commonAreaUtilities || {})
    .reduce((sum, cost) => sum + (cost * 12), 0);

  // CapEx reserve (6% for MF - industry standard)
  const capExRate = 0.06;
  const capEx = grossIncome * capExRate;

  console.log('[MF] Operating Expenses (NO vacancy):');
  console.log('  Property Tax:', propertyTax);
  console.log('  Insurance:', insurance);
  console.log('  Property Management:', propertyManagement);
  console.log('  Maintenance:', maintenance);
  console.log('  Common Area:', commonAreaTotal);
  console.log('  CapEx Reserve:', capEx);
  console.log('  TOTAL:', propertyTax + insurance + propertyManagement + maintenance + commonAreaTotal + capEx);

  // ✅ NO vacancy
  return propertyTax + insurance + propertyManagement + maintenance + commonAreaTotal + capEx;
}
```

**Step 3: Update calculatePropertySpecificMetrics()** (1 hour)
```typescript
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  const grossIncome = this.calculateGrossIncome(1);

  // ✅ NEW: Calculate EGI first
  const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);

  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);

  // ✅ FIXED: NOI = EGI - Operating Expenses
  const noi = effectiveGrossIncome - operatingExpenses;

  console.log('[MF] NOI Calculation:');
  console.log('  Effective Gross Income:', effectiveGrossIncome);
  console.log('  Operating Expenses:', operatingExpenses);
  console.log('  NOI:', noi);

  // ... rest of metrics
}
```

**Step 4: Create unit tests** (3 hours)
```typescript
// /backend/src/tests/MultiFamilyAnalyzer.test.ts
describe('Story 1.2: NOI Bug Fix', () => {
  it('should not include vacancy in operating expenses', () => {
    const analyzer = new MultiFamilyAnalyzer(testData, assumptions);
    const expenses = analyzer['calculateOperatingExpenses'](100000);

    const vacancyAmount = 100000 * 0.05;
    expect(expenses).not.toBeCloseTo(vacancyAmount, -2);
  });

  it('should calculate EGI correctly', () => {
    const analyzer = new MultiFamilyAnalyzer(testData, assumptions);
    const egi = analyzer['calculateEffectiveGrossIncome'](100000);

    // EGI = 100K - 5% vacancy - 2% credit loss = 93,000
    expect(egi).toBeCloseTo(93000, -2);
  });

  it('should calculate NOI from EGI', () => {
    const analyzer = new MultiFamilyAnalyzer(testData, assumptions);
    const result = analyzer.analyze();

    const egi = result.analysis.effectiveGrossIncome;
    const opex = result.analysis.operatingExpenses;
    expect(result.analysis.noi).toBeCloseTo(egi - opex, -2);
  });

  it('should match lender OER calculation', () => {
    const analyzer = new MultiFamilyAnalyzer(testData, assumptions);
    const result = analyzer.analyze();

    // Lenders calculate OER = OpEx / EGI (not GI)
    const oer = (result.analysis.operatingExpenses / result.analysis.effectiveGrossIncome) * 100;
    expect(result.analysis.operatingExpenseRatio).toBeCloseTo(oer, 1);
    expect(oer).toBeLessThan(60); // Acceptable range for lenders
  });
});
```

### **Acceptance Criteria**:
- [ ] Vacancy NOT in operating expenses (line 40 fixed)
- [ ] calculateEffectiveGrossIncome() method added
- [ ] NOI = EGI - Operating Expenses
- [ ] All 4 unit tests passing
- [ ] Manual validation: 95%+ accuracy vs spreadsheet
- [ ] CPA review: Formula matches industry standards

**Estimated Time**: 8 hours
**Risk**: LOW (straightforward fix, comprehensive tests)

---

## 📝 **STORY 1.1: ENHANCE MULTIFAMILYDATA INTERFACE** (4 hours)

### **File**: `/backend/src/types/propertyTypes.ts`

**Current State**: Partial interface exists
**Goal**: Complete interface with all fields documented

### **Implementation**:

```typescript
export interface MultiFamilyData extends BasePropertyData {
  propertyType: 'MF';

  // Building Details
  totalUnits: number;  // 2-32 (target range)
  totalSqft: number;
  yearBuilt: number;
  buildingType?: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';

  // Unit Configuration (for unit-level intelligence)
  units: Array<{
    unitNumber?: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    currentRent: number;
    marketRent?: number;      // From RentCast API
    isVacant?: boolean;
    condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  }>;

  // Legacy support (for existing data)
  unitTypes?: Array<{
    type: string;
    count: number;
    sqft: number;
    monthlyRent: number;
  }>;

  // Operating Expenses
  commonAreaUtilities: {
    electric: number;
    water: number;
    gas: number;
    trash: number;
  };
  maintenanceCostPerUnit: number;

  // Financing (supports commercial loans)
  loanType?: 'RESIDENTIAL' | 'COMMERCIAL';
  balloonPayment?: {
    years: number;
    amount?: number;
  };
}
```

### **Also Add**: Complete MultiFamilyMetrics interface

```typescript
export interface MultiFamilyMetrics extends CommonMetrics {
  // Basic metrics
  noi: number;
  capRate: number;
  dscr: number;
  cashFlow: number;
  irr: number;
  totalROI: number;

  // 9 Advanced MF Metrics
  grm: number;                      // Gross Rent Multiplier
  debtYield: number;                // (NOI / Loan Amount) * 100
  breakEvenOccupancy: number;       // (OpEx + Debt Service) / GI * 100
  pricePerUnit: number;             // Purchase Price / Total Units
  noiPerUnit: number;               // NOI / Total Units
  cashFlowPerUnit: number;          // Cash Flow / Total Units
  rentPerSqft: number;              // (Gross Income / 12) / Total Sqft
  unitMixEfficiency: number;        // Rent optimization score
  economicVacancyRate: number;      // (GI - EGI) / GI * 100
  operatingExpenseRatio: number;    // OpEx / EGI * 100
  grossYield: number;               // (Gross Income / Purchase Price) * 100

  // Context fields
  effectiveGrossIncome: number;     // GI - Vacancy - Credit Loss
  operatingExpenses: number;        // Total OpEx (NO vacancy)
  grossIncome: number;              // Potential Gross Income
}

export interface SensitivityAnalysis {
  bestCase: {
    cashFlow: number;
    noi: number;
    dscr: number;
    capRate: number;
    totalReturn: number;
  };
  worstCase: {
    cashFlow: number;
    noi: number;
    dscr: number;
    capRate: number;
    totalReturn: number;
  };
}
```

### **Acceptance Criteria**:
- [ ] Interface compiles with no errors
- [ ] All fields documented with comments
- [ ] Type guards work correctly
- [ ] Validated against RentCast API structure

**Estimated Time**: 4 hours

---

## 📊 **STORY 1.4: ADD 9 ADVANCED MF METRICS** (24 hours)

### **Implementation Order** (by priority):

**Priority 0 (Day 1 - Critical for Lenders)**: 4 hours
1. Debt Yield - Lenders use this MORE than DSCR
2. Break-Even Occupancy - Identifies risky deals
3. Operating Expense Ratio - Lender benchmark

**Priority 1 (Day 2 - Competitive Moat)**: 8 hours
4. Per-Unit Metrics (price, NOI, cash flow per unit)
5. Rent Per Sqft - Identifies value-add opportunities
6. Unit Mix Efficiency - **NO OTHER PLATFORM HAS THIS**

**Priority 2 (Day 3 - Nice to Have)**: 12 hours
7. Gross Rent Multiplier - Quick screening
8. Economic Vacancy Rate - True vacancy cost
9. Gross Yield - Quick comparison

### **Implementation**:

```typescript
protected calculatePropertySpecificMetrics(): MultiFamilyMetrics {
  const grossIncome = this.calculateGrossIncome(1);
  const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
  const noi = effectiveGrossIncome - operatingExpenses;

  // Existing basic metrics
  const monthlyMortgage = this.calculateMonthlyMortgage();
  const annualDebtService = monthlyMortgage * 12;
  const capRate = (noi / this.data.purchasePrice) * 100;
  const dscr = noi / annualDebtService;
  const cashFlow = noi - annualDebtService;

  // ✅ 9 ADVANCED METRICS

  // 1. Gross Rent Multiplier
  const grm = this.data.purchasePrice / grossIncome;

  // 2. Debt Yield (CRITICAL FOR LENDERS)
  const loanAmount = this.data.purchasePrice - this.data.downPayment;
  const debtYield = loanAmount > 0 ? (noi / loanAmount) * 100 : 0;

  // 3. Break-Even Occupancy
  const breakEvenOccupancy = ((operatingExpenses + annualDebtService) / grossIncome) * 100;

  // 4. Per-Unit Metrics
  const pricePerUnit = this.data.totalUnits > 0
    ? this.data.purchasePrice / this.data.totalUnits
    : 0;
  const noiPerUnit = this.data.totalUnits > 0
    ? noi / this.data.totalUnits
    : 0;
  const cashFlowPerUnit = this.data.totalUnits > 0
    ? (cashFlow / 12) / this.data.totalUnits
    : 0;

  // 5. Rent Per Sqft
  const rentPerSqft = this.data.totalSqft > 0
    ? (grossIncome / 12) / this.data.totalSqft
    : 0;

  // 6. Unit Mix Efficiency (COMPETITIVE MOAT)
  const unitMixEfficiency = this.calculateUnitMixEfficiency();

  // 7. Economic Vacancy Rate
  const economicVacancyRate = grossIncome > 0
    ? ((grossIncome - effectiveGrossIncome) / grossIncome) * 100
    : 0;

  // 8. Operating Expense Ratio
  const operatingExpenseRatio = effectiveGrossIncome > 0
    ? (operatingExpenses / effectiveGrossIncome) * 100
    : 0;

  // 9. Gross Yield
  const grossYield = (grossIncome / this.data.purchasePrice) * 100;

  return {
    noi,
    capRate,
    dscr,
    cashFlow: cashFlow / 12, // Monthly
    irr: this.calculateIRR(),
    totalROI: this.calculateTotalROI(),

    // 9 Advanced Metrics
    grm,
    debtYield,
    breakEvenOccupancy,
    pricePerUnit,
    noiPerUnit,
    cashFlowPerUnit,
    rentPerSqft,
    unitMixEfficiency,
    economicVacancyRate,
    operatingExpenseRatio,
    grossYield,

    // Context
    effectiveGrossIncome,
    operatingExpenses,
    grossIncome
  };
}

private calculateUnitMixEfficiency(): number {
  if (!this.data.units || this.data.units.length === 0 || this.data.totalSqft === 0) {
    return 0;
  }

  const totalRent = this.data.units.reduce((sum, unit) => sum + unit.currentRent, 0);
  const avgRentPerSqft = totalRent / this.data.totalSqft;

  // Market average (can be enhanced with RentCast data later)
  const marketAvgRentPerSqft = 1.20; // Placeholder - TODO: Get from RentCast

  return (avgRentPerSqft / marketAvgRentPerSqft) * 100;
}
```

### **Acceptance Criteria**:
- [ ] All 9 metrics calculated correctly
- [ ] Division by zero handled gracefully
- [ ] Formulas match industry standards (CPA validated)
- [ ] Unit tests for each metric
- [ ] Manual validation: 95%+ accuracy

**Estimated Time**: 24 hours

---

## 🧪 **TESTING STRATEGY**

### **Daily Testing Cadence**:

**Day 1 (Story 1.2 - NOI Fix)**:
- [ ] Write tests FIRST (TDD approach)
- [ ] Run tests after each method change
- [ ] Manual calculation validation
- [ ] CPA review of NOI formula

**Week 1 (Stories 1.1, 1.2, 1.5)**:
- [ ] 60%+ test coverage achieved
- [ ] All NOI tests passing
- [ ] 0 P0 bugs found

**Week 2 (Stories 1.3, 1.4, 1.6)**:
- [ ] 90%+ test coverage achieved
- [ ] All 9 metrics tested
- [ ] Manual validation complete

### **Test Data Factories** (from QE):

```typescript
// /backend/src/tests/factories/MFPropertyFactory.ts
export class MFPropertyFactory {
  static create(overrides?: Partial<MultiFamilyData>): MultiFamilyData {
    return {
      propertyType: 'MF',
      totalUnits: 8,
      totalSqft: 7200,
      purchasePrice: 1200000,
      downPayment: 240000,
      propertyTaxRate: 1.2,
      insuranceRate: 0.5,
      propertyManagementRate: 10,
      maintenanceCostPerUnit: 100,
      units: Array(overrides?.totalUnits || 8).fill(null).map((_, i) => ({
        unitNumber: `${i + 1}`,
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 900,
        currentRent: 1500,
        isVacant: false,
        condition: 'GOOD'
      })),
      commonAreaUtilities: {
        electric: 150,
        water: 100,
        gas: 75,
        trash: 50
      },
      ...overrides
    };
  }

  static createDuplex(overrides?) {
    return this.create({ totalUnits: 2, ...overrides });
  }

  static create8Unit(overrides?) {
    return this.create({ totalUnits: 8, ...overrides });
  }

  static create32Unit(overrides?) {
    return this.create({ totalUnits: 32, ...overrides });
  }
}
```

---

## 📊 **SPRINT 1 SUCCESS METRICS**

### **Week 1 Checkpoint** (Day 5):
- [ ] Story 1.2 (NOI Fix) complete and tested ✅
- [ ] Story 1.1 (Interface) complete ✅
- [ ] 60%+ test coverage
- [ ] Manual validation setup complete

### **Week 2 Checkpoint** (Day 10):
- [ ] All 9 metrics implemented
- [ ] 90%+ test coverage
- [ ] Manual validation: 95%+ accuracy
- [ ] 3 CPA reviews complete

### **Sprint 1 Definition of Done**:
- [ ] MultiFamilyAnalyzer outputs `AnalysisResult<MultiFamilyMetrics>`
- [ ] All unit tests passing (90%+ coverage)
- [ ] NOI calculation verified by CPA
- [ ] Manual spreadsheet validation: 95%+ accuracy
- [ ] Code review complete
- [ ] No P0 bugs

---

## 🚀 **GETTING STARTED**

### **Step 1: Complete Pre-Sprint Tasks** (13 hours)
```bash
# Architect creates type definitions
# QE creates test factories
# Both work in parallel
```

### **Step 2: Story 1.2 - NOI Bug Fix** (Day 1)
```bash
# CRITICAL - This must be first
cd /Users/parthpatel/real-estate-analyzer/backend
npm test -- MultiFamilyAnalyzer.test.ts --watch
```

### **Step 3: Daily Standup Format**:
- What did I complete yesterday?
- What am I working on today?
- Any blockers?
- Test coverage percentage?

---

## 📁 **KEY REFERENCE DOCUMENTS**

**For Implementation**:
- `MF_SPRINT_PLAN_ENHANCED.md` - Full technical + business context
- `ARCHITECT_TECHNICAL_REVIEW.md` - Technical gaps and solutions
- `QE_TEST_STRATEGY_REVIEW.md` - Testing approach

**For Validation**:
- `MF_BUSINESS_EXPERT_SPRINT_REVIEW.md` - Business requirements
- Excel spreadsheets (3 reference properties)

---

## ✅ **YOU ARE READY TO START**

**All Expert Approvals**: ✅
- Business Expert: 95% confidence
- Architect: 95% confidence
- QE Engineer: 90% confidence

**Pre-Sprint Work**: 13 hours (1.5 days)
**Sprint 1 Duration**: 80 hours (2 weeks)
**Expected Outcome**: Institutional-grade MF analysis foundation

---

**🎉 LET'S BUILD IT! 🎉**

**First Task**: Complete pre-sprint tasks (13 hours)
**Then**: Story 1.2 - Fix NOI bug (CRITICAL - Day 1)
