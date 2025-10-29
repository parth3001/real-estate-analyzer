# Multi-Family Formula Specifications & Error Handling

**Created**: October 25, 2025
**Purpose**: Complete formula specifications and error handling requirements for Multi-Family Analyzer
**Status**: Pre-Sprint 1 Technical Documentation

---

## 📐 **CORE FORMULAS**

### **1. NOI (Net Operating Income) - CRITICAL**

**Formula**:
```
EGI = Gross Income - Vacancy Loss - Credit Loss
NOI = EGI - Operating Expenses
```

**Step-by-Step Calculation**:
```typescript
// Step 1: Calculate Gross Income (Potential)
grossIncome = Σ(unit.monthlyRent × unit.count × 12)

// Step 2: Calculate Effective Gross Income
vacancyLoss = grossIncome × (vacancyRate / 100)       // Default: 5%
creditLoss = grossIncome × 0.02                        // Fixed: 2% (industry standard)
effectiveGrossIncome = grossIncome - vacancyLoss - creditLoss

// Step 3: Calculate Operating Expenses (NO VACANCY)
operatingExpenses = propertyTax + insurance + propertyManagement
                  + maintenance + commonAreaUtilities + capEx

// Step 4: Calculate NOI
noi = effectiveGrossIncome - operatingExpenses
```

**CRITICAL RULE**: Vacancy is an INCOME reduction, NOT an expense.

**Error Cases**:
- If `grossIncome === 0`: Return NOI = 0, log warning
- If `effectiveGrossIncome < 0`: Throw error "Invalid vacancy/credit loss - exceeds gross income"
- If `operatingExpenses < 0`: Throw error "Operating expenses cannot be negative"
- If `noi < 0`: Valid scenario (warn user, don't throw)

---

### **2. Cap Rate (Capitalization Rate)**

**Formula**:
```
Cap Rate = (NOI / Purchase Price) × 100
```

**Implementation**:
```typescript
calculateCapRate(noi: number): number {
  if (this.data.purchasePrice === 0) {
    console.error('[MF] Cap Rate: Purchase price is zero');
    return 0;
  }

  const capRate = (noi / this.data.purchasePrice) * 100;

  // Cap rate can be negative if NOI is negative (valid scenario)
  if (capRate < 0) {
    console.warn('[MF] Cap Rate: Negative value indicates negative NOI');
  }

  return capRate;
}
```

**Error Cases**:
- If `purchasePrice === 0`: Return 0, log error
- If `noi < 0`: Return negative cap rate (valid), log warning
- Valid range: -50% to +50% (outside range = log warning)

---

### **3. DSCR (Debt Service Coverage Ratio)**

**Formula**:
```
DSCR = NOI / Annual Debt Service
```

**Implementation**:
```typescript
calculateDSCR(noi: number, annualDebtService: number): number {
  if (annualDebtService === 0) {
    // All-cash purchase
    console.log('[MF] DSCR: All-cash purchase - no debt service');
    return 999; // Infinite DSCR represented as 999
  }

  const dscr = noi / annualDebtService;

  if (dscr < 1.0) {
    console.warn('[MF] DSCR: Below 1.0 - property does not cover debt service');
  }

  if (dscr < 1.25) {
    console.warn('[MF] DSCR: Below 1.25 - may not qualify for commercial financing');
  }

  return dscr;
}
```

**Error Cases**:
- If `annualDebtService === 0`: Return 999 (represents infinite DSCR for all-cash)
- If `noi < 0 && annualDebtService > 0`: Return negative DSCR (valid but problematic)
- Lender threshold: 1.25 minimum (log warning if below)

---

### **4. GRM (Gross Rent Multiplier)**

**Formula**:
```
GRM = Purchase Price / Gross Annual Income
```

**Implementation**:
```typescript
calculateGRM(): number {
  const grossAnnualIncome = this.calculateGrossIncome(1);

  if (grossAnnualIncome === 0) {
    console.error('[MF] GRM: Gross annual income is zero');
    return 0;
  }

  const grm = this.data.purchasePrice / grossAnnualIncome;

  // Typical range: 4-12 for residential MF
  if (grm < 2 || grm > 20) {
    console.warn(`[MF] GRM: Value ${grm.toFixed(2)} is outside typical range (4-12)`);
  }

  return grm;
}
```

**Error Cases**:
- If `grossAnnualIncome === 0`: Return 0, log error
- Typical range: 4-12 (warn if outside)
- Valid range: 0-100 (outside = log warning)

---

### **5. Debt Yield**

**Formula**:
```
Debt Yield = (NOI / Loan Amount) × 100
```

**Implementation**:
```typescript
calculateDebtYield(noi: number): number {
  const loanAmount = this.data.purchasePrice - this.data.downPayment;

  if (loanAmount === 0) {
    // All-cash purchase
    console.log('[MF] Debt Yield: All-cash purchase - no loan');
    return 0; // Or return null
  }

  const debtYield = (noi / loanAmount) * 100;

  // Lenders typically require 10%+ debt yield
  if (debtYield < 10) {
    console.warn('[MF] Debt Yield: Below 10% - may not meet lender requirements');
  }

  return debtYield;
}
```

**Error Cases**:
- If `loanAmount === 0`: Return 0 (all-cash purchase)
- If `noi < 0`: Return negative debt yield (valid but problematic)
- Lender threshold: 10% minimum (log warning if below)
- Typical range: 8-15%

---

### **6. Break-Even Occupancy**

**Formula**:
```
BEO = ((Operating Expenses + Debt Service) / Gross Income) × 100
```

**Implementation**:
```typescript
calculateBreakEvenOccupancy(): number {
  const grossIncome = this.calculateGrossIncome(1);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
  const annualDebtService = this.calculateMonthlyMortgage() * 12;

  if (grossIncome === 0) {
    console.error('[MF] Break-Even Occupancy: Gross income is zero');
    return 100; // 100% occupancy needed if no income
  }

  const beo = ((operatingExpenses + annualDebtService) / grossIncome) * 100;

  if (beo > 100) {
    console.warn('[MF] Break-Even Occupancy: Exceeds 100% - property cannot break even at full occupancy');
  }

  if (beo > 85) {
    console.warn('[MF] Break-Even Occupancy: Above 85% - high risk investment');
  }

  return beo;
}
```

**Error Cases**:
- If `grossIncome === 0`: Return 100, log error
- If `beo > 100`: Valid but problematic (property can't break even)
- Safe threshold: <85% (warn if above)

---

### **7. Unit Mix Efficiency**

**Purpose**: Measures rent optimization across unit types (competitive moat - no other platform has this)

**Formula**:
```
Unit Mix Efficiency = (Actual Rent/SF / Market Optimal Rent/SF) × 100
```

**Implementation**:
```typescript
calculateUnitMixEfficiency(): number {
  // Calculate total potential rent and total square footage
  let totalRent = 0;
  let totalSqft = 0;

  for (const unit of this.data.unitTypes) {
    totalRent += unit.monthlyRent * unit.count;
    totalSqft += unit.sqft * unit.count;
  }

  if (totalSqft === 0) {
    console.error('[MF] Unit Mix Efficiency: Total square footage is zero');
    return 0;
  }

  const actualRentPerSqft = totalRent / totalSqft;

  // Market benchmarks ($/sqft/month) by unit type
  const marketBenchmarks = {
    studio: 1.50,
    '1bed': 1.35,
    '2bed': 1.25,
    '3bed': 1.15,
    '4bed': 1.10
  };

  // Calculate market optimal rent/sqft for this property's unit mix
  let marketOptimalRent = 0;

  for (const unit of this.data.unitTypes) {
    const bedroomCount = this.extractBedroomCount(unit.type);
    const benchmark = this.getMarketBenchmark(bedroomCount, marketBenchmarks);
    marketOptimalRent += (benchmark * unit.sqft * unit.count);
  }

  const marketOptimalRentPerSqft = marketOptimalRent / totalSqft;

  if (marketOptimalRentPerSqft === 0) {
    console.warn('[MF] Unit Mix Efficiency: Market optimal is zero - using 100');
    return 100;
  }

  const efficiency = (actualRentPerSqft / marketOptimalRentPerSqft) * 100;

  // Efficiency interpretations
  if (efficiency > 110) {
    console.log('[MF] Unit Mix Efficiency: Above market (110%+) - strong value-add opportunity');
  } else if (efficiency < 85) {
    console.warn('[MF] Unit Mix Efficiency: Below market (85%-) - underperforming units');
  }

  return efficiency;
}

private extractBedroomCount(unitType: string): number {
  // Parse unit type string (e.g., "2bed/1bath", "Studio", "1BR")
  const match = unitType.match(/(\d+)\s*(bed|br|bedroom)/i);
  if (match) return parseInt(match[1]);
  if (unitType.toLowerCase().includes('studio')) return 0;
  return 2; // Default fallback
}

private getMarketBenchmark(bedrooms: number, benchmarks: Record<string, number>): number {
  switch (bedrooms) {
    case 0: return benchmarks.studio;
    case 1: return benchmarks['1bed'];
    case 2: return benchmarks['2bed'];
    case 3: return benchmarks['3bed'];
    case 4: return benchmarks['4bed'];
    default: return benchmarks['2bed']; // Default to 2bed benchmark
  }
}
```

**Error Cases**:
- If `totalSqft === 0`: Return 0, log error
- If `marketOptimalRentPerSqft === 0`: Return 100 (default), log warning
- Valid range: 50-150% (outside = log warning)
- Interpretation:
  - 110%+: Strong (above market)
  - 90-110%: Good (at market)
  - 85-90%: Fair (slightly below market)
  - <85%: Weak (underperforming)

---

### **8. Economic Vacancy Rate**

**Formula**:
```
Economic Vacancy Rate = ((Potential Income - Actual Income) / Potential Income) × 100
```

**Implementation**:
```typescript
calculateEconomicVacancyRate(grossIncome: number): number {
  const potentialIncome = this.calculateGrossIncome(1);

  if (potentialIncome === 0) {
    console.error('[MF] Economic Vacancy Rate: Potential income is zero');
    return 0;
  }

  // Actual income accounts for current occupancy
  const actualIncome = grossIncome; // This should come from actual rent roll

  const economicVacancy = ((potentialIncome - actualIncome) / potentialIncome) * 100;

  if (economicVacancy < 0) {
    console.warn('[MF] Economic Vacancy Rate: Negative value - actual income exceeds potential');
    return 0;
  }

  if (economicVacancy > 20) {
    console.warn('[MF] Economic Vacancy Rate: Above 20% - significant underperformance');
  }

  return economicVacancy;
}
```

**Error Cases**:
- If `potentialIncome === 0`: Return 0, log error
- If `economicVacancy < 0`: Return 0 (shouldn't happen, but protect)
- Typical range: 0-15%
- Warning threshold: >20%

---

### **9. Gross Yield**

**Formula**:
```
Gross Yield = (Gross Annual Income / Purchase Price) × 100
```

**Implementation**:
```typescript
calculateGrossYield(): number {
  const grossAnnualIncome = this.calculateGrossIncome(1);

  if (this.data.purchasePrice === 0) {
    console.error('[MF] Gross Yield: Purchase price is zero');
    return 0;
  }

  const grossYield = (grossAnnualIncome / this.data.purchasePrice) * 100;

  // Typical range: 5-15% for residential MF
  if (grossYield < 3 || grossYield > 20) {
    console.warn(`[MF] Gross Yield: Value ${grossYield.toFixed(2)}% is outside typical range (5-15%)`);
  }

  return grossYield;
}
```

**Error Cases**:
- If `purchasePrice === 0`: Return 0, log error
- Typical range: 5-15%
- Valid range: 0-30% (outside = log warning)

---

## 🚨 **ERROR HANDLING SPECIFICATIONS**

### **Division by Zero Protection**

**All division operations must check denominator:**

```typescript
// Template for all division operations
function safeDivide(numerator: number, denominator: number, metricName: string, defaultValue: number = 0): number {
  if (denominator === 0) {
    console.error(`[MF] ${metricName}: Division by zero (denominator = 0)`);
    return defaultValue;
  }

  return numerator / denominator;
}

// Usage examples:
const capRate = safeDivide(noi, purchasePrice, 'Cap Rate') * 100;
const dscr = safeDivide(noi, annualDebtService, 'DSCR', 999); // 999 = infinite DSCR
```

**Critical Division Operations to Protect**:
1. Cap Rate: `noi / purchasePrice`
2. DSCR: `noi / annualDebtService`
3. GRM: `purchasePrice / grossAnnualIncome`
4. Debt Yield: `noi / loanAmount`
5. BEO: `expenses / grossIncome`
6. Per-unit metrics: `value / totalUnits`
7. Per-sqft metrics: `value / totalSqft`

---

### **Input Validation**

**Validate all critical inputs in constructor:**

```typescript
constructor(data: MultiFamilyData, assumptions: AnalysisAssumptions) {
  // Validate critical fields
  if (data.totalUnits <= 0) {
    throw new Error('Total units must be greater than 0');
  }

  if (data.totalUnits < 2) {
    console.warn('[MF] Warning: Property has less than 2 units (not truly multi-family)');
  }

  if (data.totalUnits > 32) {
    console.warn('[MF] Warning: Property exceeds 32 units (outside target range)');
  }

  if (data.totalSqft <= 0) {
    throw new Error('Total square footage must be greater than 0');
  }

  if (data.purchasePrice <= 0) {
    throw new Error('Purchase price must be greater than 0');
  }

  if (data.downPayment < 0 || data.downPayment > data.purchasePrice) {
    throw new Error('Down payment must be between 0 and purchase price');
  }

  if (data.unitTypes.length === 0) {
    throw new Error('At least one unit type is required');
  }

  // Validate unit types sum to total units
  const unitSum = data.unitTypes.reduce((sum, unit) => sum + unit.count, 0);
  if (unitSum !== data.totalUnits) {
    console.warn(`[MF] Warning: Unit types sum (${unitSum}) does not match total units (${data.totalUnits})`);
  }

  super(data, assumptions);
}
```

---

### **API Failure Handling**

**RentCast API integration must gracefully degrade:**

```typescript
async analyzeWithMarketIntelligence(): Promise<AnalysisResult<MultiFamilyMetrics>> {
  let marketData = null;

  try {
    marketData = await marketIntelligenceService.getEnhancedMarketData(
      this.data.propertyAddress
    );
    console.log('[MF] Market intelligence data retrieved successfully');
  } catch (error) {
    console.error('[MF] Market intelligence API failed:', error.message);
    console.log('[MF] Continuing analysis without market data');
    // Continue with analysis even if API fails
  }

  const baseAnalysis = this.analyze();

  return {
    ...baseAnalysis,
    marketData: marketData || null,
    marketDataStatus: marketData ? 'available' : 'unavailable'
  };
}
```

---

### **Negative NOI Handling**

**Negative NOI is valid but problematic - warn, don't fail:**

```typescript
protected calculateNOI(grossIncome: number, operatingExpenses: number): number {
  const egi = this.calculateEffectiveGrossIncome(grossIncome);
  const noi = egi - operatingExpenses;

  if (noi < 0) {
    console.warn('[MF] NOI: NEGATIVE VALUE - Property expenses exceed income');
    console.warn('[MF] NOI: This property will lose money annually');
  }

  // Return negative NOI (don't throw error - valid scenario)
  return noi;
}
```

---

### **All-Cash Purchase Handling**

**Special handling when downPayment === purchasePrice:**

```typescript
calculateDSCR(noi: number, annualDebtService: number): number {
  const loanAmount = this.data.purchasePrice - this.data.downPayment;

  if (loanAmount === 0) {
    console.log('[MF] All-cash purchase detected - no debt service');
    return 999; // Represent infinite DSCR
  }

  // Normal DSCR calculation
  return noi / annualDebtService;
}

calculateDebtYield(noi: number): number {
  const loanAmount = this.data.purchasePrice - this.data.downPayment;

  if (loanAmount === 0) {
    console.log('[MF] All-cash purchase detected - debt yield not applicable');
    return 0; // Or null
  }

  return (noi / loanAmount) * 100;
}
```

---

## ✅ **VALIDATION RANGES**

### **Typical Ranges for MF Metrics**

```typescript
const MF_METRIC_RANGES = {
  capRate: { min: 3, max: 15, typical: [6, 10] },
  dscr: { min: 0.5, max: 3.0, lenderMin: 1.25 },
  grm: { min: 4, max: 12, typical: [6, 9] },
  debtYield: { min: 5, max: 20, lenderMin: 10 },
  breakEvenOccupancy: { min: 40, max: 100, safe: 85 },
  unitMixEfficiency: { min: 50, max: 150, good: [90, 110] },
  economicVacancy: { min: 0, max: 30, typical: [3, 10] },
  grossYield: { min: 3, max: 20, typical: [6, 12] }
};
```

### **Logging Recommendations**

```typescript
function validateAndLogMetric(
  metricName: string,
  value: number,
  range: { min: number, max: number, typical?: [number, number] }
): void {
  if (value < range.min || value > range.max) {
    console.warn(`[MF] ${metricName}: Value ${value.toFixed(2)} is outside valid range (${range.min}-${range.max})`);
  }

  if (range.typical && (value < range.typical[0] || value > range.typical[1])) {
    console.log(`[MF] ${metricName}: Value ${value.toFixed(2)} is outside typical range (${range.typical[0]}-${range.typical[1]})`);
  }
}
```

---

## 📋 **PRE-SPRINT 1 CHECKLIST**

**Type Definitions**:
- [x] MultiFamilyMetrics interface complete with 9 advanced metrics
- [x] SensitivityAnalysis interface created
- [x] All metrics have clear comments

**Formula Documentation**:
- [x] NOI calculation documented (EGI method)
- [x] All 9 advanced metrics formulas specified
- [x] Unit Mix Efficiency algorithm detailed
- [x] Typical ranges documented

**Error Handling**:
- [x] Division by zero protection specified
- [x] Input validation requirements documented
- [x] API failure handling strategy defined
- [x] Edge case handling (negative NOI, all-cash, etc.)

**Status**: ✅ **COMPLETE** - Ready for Story 1.2 (NOI Bug Fix)

---

**Next Step**: Begin Story 1.2 implementation (Fix NOI Calculation Bug)
