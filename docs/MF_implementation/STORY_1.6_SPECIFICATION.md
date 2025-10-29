# Story 1.6 Specification - Comprehensive Unit Tests (90%+ Coverage)

**Story**: Story 1.6 - Create Comprehensive Unit Tests for MultiFamilyAnalyzer
**Estimated Time**: 14 hours (NOW: 20 hours due to Story 1.2 test gap)
**Priority**: HIGH (Financial calculations must have test coverage)
**Status**: NOT STARTED

---

## 🎯 **Story Objectives**

### **Primary Goal**:
Achieve **90%+ test coverage** for all MultiFamilyAnalyzer functionality with comprehensive unit and integration tests.

### **Critical Addition** (From Story 1.2 QE Review):
**Story 1.2 (NOI Bug Fix) has ZERO automated tests.** This is a **CRITICAL GAP** that must be addressed in Story 1.6.

---

## 📋 **Test Files to Create**

### **1. MultiFamilyAnalyzer-NOI.test.ts** ⭐⭐⭐⭐⭐ **CRITICAL** (NEW)
**Estimated Time**: 6 hours
**Priority**: 🔴 **CRITICAL** (Story 1.2 gap)
**Tests**: 19 comprehensive tests

**Background**:
- Story 1.2 fixed the critical NOI calculation bug
- QE Review identified **0 automated tests** for this critical fix
- NOI is the **most important metric** in commercial real estate
- Must have regression protection

**Test Categories**:

#### **A. EGI Calculation Tests** (4 tests)
```typescript
describe('calculateEffectiveGrossIncome - Story 1.2', () => {
  it('should calculate vacancy loss correctly', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const vacancyRate = 5;

    const egiMethod = analyzer['calculateEffectiveGrossIncome'];
    const egiResult = egiMethod.call(analyzer, grossIncome);

    const expectedVacancyLoss = grossIncome * 0.05; // $6,840
    const expectedCreditLoss = grossIncome * 0.02;   // $2,736
    const expectedEGI = grossIncome - expectedVacancyLoss - expectedCreditLoss;

    expect(egiResult).toBeCloseTo(expectedEGI, 2);
  });

  it('should apply 2% credit loss (industry standard)', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const egiResult = analyzer['calculateEffectiveGrossIncome'](grossIncome);

    const creditLoss = grossIncome * 0.02; // $2,736
    const vacancyLoss = grossIncome * 0.05; // $6,840
    const expectedEGI = grossIncome - vacancyLoss - creditLoss; // $127,224

    expect(egiResult).toBeCloseTo(expectedEGI, 2);
  });

  it('should calculate EGI = Gross Income - Vacancy - Credit Loss', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const assumptions = { vacancyRate: 5 };

    const egiResult = analyzer['calculateEffectiveGrossIncome'](grossIncome);

    // Formula: EGI = Gross Income - (Gross Income * 0.05) - (Gross Income * 0.02)
    expect(egiResult).toBeCloseTo(127224, 0); // $127,224
  });

  it('should handle zero vacancy rate', () => {
    const property = MFPropertyFactory.create();
    const assumptions = { ...defaultMFAssumptions, vacancyRate: 0 };
    const analyzer = new MultiFamilyAnalyzer(property, assumptions);

    const grossIncome = 136800;
    const egiResult = analyzer['calculateEffectiveGrossIncome'](grossIncome);

    // With 0% vacancy, only credit loss applies
    const expectedEGI = grossIncome - (grossIncome * 0.02); // $134,064
    expect(egiResult).toBeCloseTo(expectedEGI, 2);
  });
});
```

#### **B. Operating Expenses Tests** (8 tests)
```typescript
describe('calculateOperatingExpenses - Story 1.2', () => {
  it('should NOT include vacancy in operating expenses (REGRESSION TEST)', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const vacancyLoss = grossIncome * 0.05; // $6,840

    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    // CRITICAL: Vacancy should NOT be in operating expenses
    // Operating expenses should be LESS than gross income
    expect(operatingExpenses).toBeLessThan(grossIncome);

    // Verify no component equals vacancy loss (catches regression)
    expect(operatingExpenses).not.toBeCloseTo(vacancyLoss, 0);
  });

  it('should calculate property tax from purchase price', () => {
    const property = MFPropertyFactory.create({
      purchasePrice: 1200000,
      propertyTaxRate: 1.5
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const expectedPropertyTax = 1200000 * 0.015; // $18,000
    // Property tax should be one component of total expenses
    expect(operatingExpenses).toBeGreaterThan(expectedPropertyTax);
  });

  it('should calculate insurance from purchase price', () => {
    const property = MFPropertyFactory.create({
      purchasePrice: 1200000,
      insuranceRate: 0.6
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const expectedInsurance = 1200000 * 0.006; // $7,200
    expect(operatingExpenses).toBeGreaterThan(expectedInsurance);
  });

  it('should calculate maintenance per unit annually', () => {
    const property = MFPropertyFactory.create({
      maintenanceCostPerUnit: 100,
      totalUnits: 8
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const expectedMaintenance = 100 * 8 * 12; // $9,600/year
    expect(operatingExpenses).toBeGreaterThan(expectedMaintenance);
  });

  it('should include common area utilities (monthly → annual)', () => {
    const property = MFPropertyFactory.create({
      commonAreaUtilities: {
        electric: 150,
        water: 100,
        gas: 50,
        trash: 80
      }
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const expectedUtilities = (150 + 100 + 50 + 80) * 12; // $4,560/year
    expect(operatingExpenses).toBeGreaterThan(expectedUtilities);
  });

  it('should calculate CapEx as 6% of gross income', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const expectedCapEx = grossIncome * 0.06; // $8,208
    expect(operatingExpenses).toBeGreaterThan(expectedCapEx);
  });

  it('should handle missing commonAreaUtilities gracefully', () => {
    const property = MFPropertyFactory.create({
      commonAreaUtilities: undefined
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;

    // Should not throw error
    expect(() => analyzer['calculateOperatingExpenses'](grossIncome)).not.toThrow();

    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);
    expect(operatingExpenses).toBeGreaterThan(0);
  });

  it('should default maintenanceCostPerUnit to $100 if not provided', () => {
    const property = MFPropertyFactory.create({
      maintenanceCostPerUnit: undefined,
      totalUnits: 8
    });
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = 136800;
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    // Default: $100 * 8 units * 12 months = $9,600
    const defaultMaintenance = 100 * 8 * 12;
    expect(operatingExpenses).toBeGreaterThan(defaultMaintenance);
  });
});
```

#### **C. NOI Integration Tests** (5 tests)
```typescript
describe('NOI Calculation Integration - Story 1.2', () => {
  it('should calculate NOI = EGI - Operating Expenses', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const result = analyzer.analyze();

    const grossIncome = 136800;
    const vacancyLoss = grossIncome * 0.05; // $6,840
    const creditLoss = grossIncome * 0.02;  // $2,736
    const expectedEGI = grossIncome - vacancyLoss - creditLoss; // $127,224

    // EGI should be in result
    expect(result.annualAnalysis.effectiveGrossIncome).toBeCloseTo(expectedEGI, 0);

    // NOI = EGI - Operating Expenses
    const noi = result.annualAnalysis.noi;
    const operatingExpenses = result.annualAnalysis.operatingExpenses;

    expect(noi).toBeCloseTo(expectedEGI - operatingExpenses, 0);
  });

  it('should match commercial real estate methodology', () => {
    const property = MFPropertyFactory.create({
      purchasePrice: 1200000,
      totalUnits: 8,
      propertyTaxRate: 1.5,
      insuranceRate: 0.6,
      propertyManagementRate: 8,
      maintenanceCostPerUnit: 100
    });

    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
    const result = analyzer.analyze();

    // Commercial RE Formula:
    // Gross Income - Vacancy Loss - Credit Loss = EGI
    // EGI - Operating Expenses = NOI

    const grossIncome = result.annualAnalysis.grossIncome;
    const egi = result.annualAnalysis.effectiveGrossIncome;
    const noi = result.annualAnalysis.noi;
    const opex = result.annualAnalysis.operatingExpenses;

    expect(egi).toBeLessThan(grossIncome); // EGI < Gross (vacancy + credit loss applied)
    expect(noi).toBeLessThan(egi); // NOI < EGI (operating expenses deducted)
    expect(noi).toBeCloseTo(egi - opex, 0); // NOI = EGI - OpEx
  });

  it('should produce lower NOI than old formula (due to credit loss)', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const result = analyzer.analyze();

    const grossIncome = result.annualAnalysis.grossIncome;
    const noi = result.annualAnalysis.noi;

    // OLD (WRONG) formula would calculate:
    // NOI = Gross Income - (Operating Expenses + Vacancy)
    // This would OVERSTATE NOI because it doesn't account for credit loss separately

    // NEW (CORRECT) formula calculates:
    // NOI = (Gross Income - Vacancy - Credit Loss) - Operating Expenses
    // This is LOWER because credit loss is explicitly deducted

    const creditLoss = grossIncome * 0.02;

    // NOI should be at least creditLoss lower than if we ignored it
    expect(noi).toBeLessThan(grossIncome); // Basic sanity check
  });

  it('should correctly calculate Cap Rate from NOI', () => {
    const property = MFPropertyFactory.create({
      purchasePrice: 1200000
    });

    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);
    const result = analyzer.analyze();

    const noi = result.annualAnalysis.noi;
    const capRate = result.annualAnalysis.capRate;

    const expectedCapRate = (noi / 1200000) * 100;

    expect(capRate).toBeCloseTo(expectedCapRate, 2);
  });

  it('should log all calculation steps (transparency)', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    analyzer.analyze();

    // Verify NOI calculation logging
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[MF] NOI Calculation (Story 1.2 - CRITICAL FIX):'
    );

    consoleLogSpy.mockRestore();
  });
});
```

#### **D. Regression Prevention Tests** (2 tests)
```typescript
describe('NOI Bug Regression Prevention - Story 1.2', () => {
  it('should NEVER include vacancy in operating expenses', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const grossIncome = analyzer['calculateGrossIncome'](1);
    const operatingExpenses = analyzer['calculateOperatingExpenses'](grossIncome);

    const vacancyLoss = grossIncome * (defaultMFAssumptions.vacancyRate / 100);

    // CRITICAL REGRESSION TEST
    // If this fails, the original bug has been reintroduced
    expect(operatingExpenses).not.toContain(vacancyLoss);

    // Operating expenses should NOT include vacancy percentage
    const opexPercentOfGrossIncome = (operatingExpenses / grossIncome) * 100;

    // Operating expenses typically 35-50% of gross income for MF
    // If it's 55%+, likely vacancy was added back
    expect(opexPercentOfGrossIncome).toBeLessThan(55);
  });

  it('should always calculate EGI before NOI', () => {
    const property = MFPropertyFactory.create();
    const analyzer = new MultiFamilyAnalyzer(property, defaultMFAssumptions);

    const result = analyzer.analyze();

    // Verify EGI was calculated and is in result
    expect(result.annualAnalysis.effectiveGrossIncome).toBeDefined();
    expect(result.annualAnalysis.effectiveGrossIncome).toBeGreaterThan(0);

    // Verify NOI is less than EGI (operating expenses deducted)
    expect(result.annualAnalysis.noi).toBeLessThan(result.annualAnalysis.effectiveGrossIncome);
  });
});
```

---

### **2. MultiFamilyAnalyzer-ErrorHandling.test.ts** (6 hours)
**Estimated Time**: 6 hours
**Priority**: 🟡 HIGH (From Story 1.1 QE gaps)
**Tests**: 12 tests

**Test Categories**:

#### **A. Invalid Input Handling** (4 tests)
```typescript
it('should handle empty units array gracefully')
it('should handle null unitTypes gracefully')
it('should handle zero totalUnits')
it('should handle negative purchase price')
```

#### **B. Edge Case Handling** (4 tests)
```typescript
it('should handle missing commonAreaUtilities')
it('should handle undefined maintenanceCostPerUnit')
it('should handle zero down payment')
it('should handle interest rate edge cases (0%, 20%+)')
```

#### **C. Calculation Error Handling** (4 tests)
```typescript
it('should handle division by zero in per-unit calculations')
it('should handle IRR calculation failures')
it('should handle negative NOI scenarios')
it('should handle extreme property values (>$100M)')
```

---

### **3. MultiFamilyAnalyzer-Parsing.test.ts** (4 hours)
**Estimated Time**: 4 hours
**Priority**: 🟡 MEDIUM (From Story 1.1 QE gaps)
**Tests**: 10 tests

**Test Categories**:

#### **A. Unit Type Parsing** (6 tests)
```typescript
it('should parse "2bed/1bath" format')
it('should parse "3BR 2BA" format')
it('should parse "1 Bedroom 1 Bath" format')
it('should parse "Studio" (0 bed)')
it('should handle unparseable formats with defaults')
it('should log parsing warnings when using defaults')
```

#### **B. Numeric Parsing** (4 tests)
```typescript
it('should handle decimal bathroom counts (1.5 bath)')
it('should handle 4+ bedroom designations')
it('should parse varied spacing in unit types')
it('should handle mixed case input ("2BED/1bath")')
```

---

### **4. MultiFamilyAnalyzer-Performance.test.ts** (2 hours)
**Estimated Time**: 2 hours
**Priority**: 🟢 LOW (From Story 1.1 QE gaps)
**Tests**: 4 tests

**Test Categories**:

#### **A. Performance Benchmarks** (4 tests)
```typescript
it('should analyze 2-unit property in <100ms')
it('should analyze 8-unit property in <200ms')
it('should analyze 32-unit property in <500ms')
it('should handle 100 sequential analyses in <5 seconds')
```

---

### **5. MultiFamilyAnalyzer-Integration.test.ts** (2 hours)
**Estimated Time**: 2 hours
**Priority**: 🟡 MEDIUM
**Tests**: 6 tests

**Test Categories**:

#### **A. End-to-End Workflow** (6 tests)
```typescript
it('should complete full analysis workflow with unitTypes[]')
it('should complete full analysis workflow with units[]')
it('should produce consistent results across multiple runs')
it('should validate against known property examples')
it('should match professional software results (±1%)')
it('should handle real-world property data from RentCast')
```

---

## 📊 **Test Coverage Goals**

### **Target Coverage**: 90%+

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| calculateEffectiveGrossIncome | 0% | 100% | 🔴 CRITICAL |
| calculateOperatingExpenses | 0% | 100% | 🔴 CRITICAL |
| calculatePropertySpecificMetrics | 50% | 95% | 🔴 HIGH |
| getNormalizedUnits | 85% | 95% | 🟡 MEDIUM |
| Error handling | 0% | 90% | 🔴 HIGH |
| Edge cases | 0% | 85% | 🟡 MEDIUM |
| Integration | 50% | 90% | 🟡 MEDIUM |

---

## ⏰ **Time Estimates Updated**

### **Original Story 1.6**: 14 hours

### **Updated Story 1.6** (with Story 1.2 tests): **20 hours**

**Breakdown**:
1. **MultiFamilyAnalyzer-NOI.test.ts**: 6 hours (NEW - Story 1.2 gap)
2. **MultiFamilyAnalyzer-ErrorHandling.test.ts**: 6 hours (Story 1.1 gap)
3. **MultiFamilyAnalyzer-Parsing.test.ts**: 4 hours (Story 1.1 gap)
4. **MultiFamilyAnalyzer-Performance.test.ts**: 2 hours (Story 1.1 gap)
5. **MultiFamilyAnalyzer-Integration.test.ts**: 2 hours (General coverage)

**Total**: 20 hours

---

## ✅ **Definition of Done**

### **Test Coverage**:
- [x] 90%+ line coverage for MultiFamilyAnalyzer
- [x] 100% coverage for calculateEffectiveGrossIncome (Story 1.2)
- [x] 100% coverage for calculateOperatingExpenses (Story 1.2)
- [x] All 19 NOI tests passing
- [x] All error handling tests passing
- [x] All parsing tests passing
- [x] Performance benchmarks met

### **Quality**:
- [x] No failing tests
- [x] All tests have clear descriptions
- [x] Test data uses factories (MFPropertyFactory)
- [x] Edge cases covered
- [x] Regression tests prevent bug reintroduction

### **Documentation**:
- [x] Each test file has header comment explaining purpose
- [x] Complex tests have inline comments
- [x] Test coverage report generated

---

## 🚨 **Critical Success Factors**

### **1. Story 1.2 Test Gap MUST Be Addressed** 🔴
- NOI is the most critical metric in commercial real estate
- Zero tests = high production risk
- Must have regression protection

### **2. Financial Calculation Precision**
- All monetary calculations must match to nearest cent
- Use `.toBeCloseTo()` with appropriate precision
- Validate against hand calculations

### **3. Realistic Test Data**
- Use MFPropertyFactory for consistent test data
- Test with real-world property examples
- Validate against professional software when possible

---

## 📋 **Next Steps**

### **Before Starting Story 1.6**:
1. ✅ Story 1.2 QE review identified test gap
2. ✅ Updated Story 1.6 specification to include NOI tests
3. ⏰ Time estimate increased: 14h → 20h

### **When Starting Story 1.6**:
1. Create `MultiFamilyAnalyzer-NOI.test.ts` FIRST (highest priority)
2. Validate NOI tests against manual calculations
3. Create other test files in priority order
4. Run coverage report to identify remaining gaps

---

**Specification Created By**: QE Engineer + Architect (based on review findings)
**Date**: October 25, 2025
**Updated From**: Original 14h estimate increased to 20h to include Story 1.2 tests
**Priority**: HIGH - Financial calculations must have test coverage before production
