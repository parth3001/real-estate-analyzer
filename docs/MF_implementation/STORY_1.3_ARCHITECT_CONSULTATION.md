# Story 1.3 - Architect Consultation
# Add Missing Analyzer Methods for Multi-Family

**Consulted By**: Principal Software Architect (18 years experience)
**Consultation Date**: October 25, 2025
**Story**: Story 1.3 - Add Missing Analyzer Methods (24 hours)
**For**: Senior Full-Stack Engineer

---

## 📋 **Consultation Request**

**Engineer Question**: "I need to implement 4 missing methods to bring MultiFamilyAnalyzer to parity with SFRAnalyzer. What are the architectural patterns I should follow, and what MF-specific considerations should I account for?"

**Methods to Implement**:
1. `calculateSensitivityAnalysis()` - Best/worst case scenarios (12h)
2. `normalizeOutput()` - Flatten data for frontend (4h)
3. `fetchMarketData()` - RentCast integration (4h)
4. `analyzeWithMarketIntelligence()` - Combine analysis with market data (4h)

---

## 🏛️ **Architect Analysis**

### **Current State Assessment**

**MultiFamilyAnalyzer Completeness**: ~35% vs SFRAnalyzer
- ✅ Core metrics: NOI, Cap Rate, Cash Flow, DSCR (Story 1.2)
- ✅ Advanced MF metrics: GRM, Debt Yield, BEO, etc. (Story 1.4)
- ❌ Sensitivity analysis: Missing
- ❌ Output normalization: Missing
- ❌ Market data integration: Missing
- ❌ Enhanced analysis: Missing

**SFRAnalyzer Reference Implementation**: 549 lines
**MultiFamilyAnalyzer Current**: ~740 lines (but missing these 4 methods)

---

## 📐 **Method 1: calculateSensitivityAnalysis()**

### **SFR Pattern Analysis**

```typescript
// SFRAnalyzer.ts (lines 196-374)
protected calculateSensitivityAnalysis(): SensitivityAnalysis {
  // 1. Get base values
  const grossIncome = this.calculateGrossIncome(1);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
  const noi = this.calculateNOI(grossIncome, operatingExpenses);

  // 2. Best case: +5% income, -5% expenses, -2% vacancy, +20% appreciation, -0.5% interest
  const bestCaseIncome = grossIncome * 1.05;
  const bestCaseExpenses = operatingExpenses * 0.95;
  const bestCaseVacancy = Math.max(1, vacancyRate - 2);
  const bestCaseAppreciation = appreciation * 1.2;
  const bestCaseInterest = Math.max(interestRate - 0.5, 0);

  // 3. Worst case: -5% income, +10% expenses, +3% vacancy, -30% appreciation, +1% interest
  const worstCaseIncome = grossIncome * 0.95;
  const worstCaseExpenses = operatingExpenses * 1.1;
  const worstCaseVacancy = vacancyRate + 3;
  const worstCaseAppreciation = appreciation * 0.7;
  const worstCaseInterest = interestRate + 1.0;

  // 4. Calculate metrics for each scenario (NOI, Cash Flow, CoC, DSCR, Total Return)
  // 5. Return SensitivityAnalysis object
}
```

### **MF-Specific Architectural Guidance**

#### **✅ KEEP FROM SFR**:
- Same scenario parameters (±5% income, ±5-10% expenses)
- Interest rate scenarios (±0.5-1%)
- Appreciation scenarios (±20-30%)
- Calculate same metrics: NOI, Cash Flow, CoC, DSCR

#### **🔄 ADAPT FOR MF**:

**1. Use MF-Specific Methods**:
```typescript
// ✅ CORRECT - Use MF methods
const grossIncome = this.calculateGrossIncome(1);
const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
const noi = effectiveGrossIncome - operatingExpenses; // MF uses EGI, not gross income

// ❌ WRONG - Don't use SFR methods
const noi = this.calculateNOI(grossIncome, operatingExpenses); // This is SFR pattern
```

**2. MF-Specific Scenarios**:
```typescript
// Multi-family has different risk factors than SFR
// Best case:
const bestCaseVacancy = Math.max(3, this.assumptions.vacancyRate - 2); // Min 3% for MF (not 1%)
const bestCaseCreditLoss = 0.015; // 1.5% instead of 2% (better tenants)

// Worst case:
const worstCaseVacancy = this.assumptions.vacancyRate + 5; // +5% for MF (not +3%)
const worstCaseCreditLoss = 0.03; // 3% instead of 2% (more defaults)
const worstCaseMaintenancePerUnit = maintenanceCostPerUnit * 1.2; // 20% higher maintenance
```

**3. Per-Unit Metrics in Sensitivity**:
```typescript
// MF investors care about per-unit economics
return {
  baseCase: {
    noi,
    cashFlow,
    cashOnCashReturn,
    dscr,
    noiPerUnit: noi / this.data.totalUnits, // MF-specific
    cashFlowPerUnit: cashFlow / this.data.totalUnits // MF-specific
  },
  bestCase: { /* same metrics */ },
  worstCase: { /* same metrics */ }
};
```

#### **📊 MF Sensitivity Parameters (Commercial Real Estate)**

| Scenario | Income | Expenses | Vacancy | Credit Loss | Appreciation | Interest |
|----------|--------|----------|---------|-------------|--------------|----------|
| **Best** | +5% | -5% | -2% (min 3%) | -0.5% (1.5%) | +20% | -0.5% |
| **Base** | 0% | 0% | 5% | 2% | 0% | 0% |
| **Worst** | -5% | +10% | +5% (10%) | +1% (3%) | -30% | +1% |

**Rationale**:
- MF has higher baseline vacancy (5% vs 3% SFR) due to more units
- Credit loss matters more for MF (more tenants = more risk)
- Maintenance costs can spike with multiple units
- Commercial lenders care about DSCR in worst case (must stay >1.25)

---

### **Implementation Pattern**

```typescript
/**
 * Calculate Sensitivity Analysis for Multi-Family Property (Story 1.3)
 * Tests best/worst case scenarios for investment decision validation
 *
 * Scenarios:
 * - Best: +5% income, -5% expenses, -2% vacancy (min 3%), +20% appreciation
 * - Worst: -5% income, +10% expenses, +5% vacancy, -30% appreciation
 *
 * Commercial lenders require worst-case DSCR > 1.25 for loan approval
 */
protected calculateSensitivityAnalysis(): SensitivityAnalysis {
  console.log('[MF] ========== SENSITIVITY ANALYSIS ==========');

  // Base case metrics
  const grossIncome = this.calculateGrossIncome(1);
  const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
  const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
  const noi = effectiveGrossIncome - operatingExpenses;
  const annualDebtService = this.calculateMonthlyMortgage() * 12;
  const cashFlow = noi - annualDebtService;
  const totalInvestment = this.data.downPayment + (this.data.closingCosts || 0) + (this.data.capitalInvestments || 0);

  console.log('[MF] Base Case:');
  console.log('  Gross Income:', `$${grossIncome.toLocaleString()}`);
  console.log('  EGI:', `$${effectiveGrossIncome.toLocaleString()}`);
  console.log('  Operating Expenses:', `$${operatingExpenses.toLocaleString()}`);
  console.log('  NOI:', `$${noi.toLocaleString()}`);
  console.log('  Cash Flow:', `$${cashFlow.toLocaleString()}`);

  // Best case scenario (MF-specific parameters)
  const bestCaseIncome = grossIncome * 1.05;
  const bestCaseExpenses = operatingExpenses * 0.95;
  const bestCaseVacancy = Math.max(3, this.assumptions.vacancyRate - 2); // Min 3% for MF
  const bestCaseCreditLoss = 0.015; // 1.5% (better than 2% base)

  const bestCaseEGI = bestCaseIncome * (1 - bestCaseVacancy / 100) * (1 - bestCaseCreditLoss);
  const bestCaseNOI = bestCaseEGI - bestCaseExpenses;

  // Calculate best case mortgage with lower interest rate (-0.5%)
  const loanAmount = this.data.purchasePrice - this.data.downPayment;
  const bestCaseInterest = Math.max(this.data.interestRate - 0.5, 0);
  const bestCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
    loanAmount,
    bestCaseInterest,
    this.data.loanTerm
  );
  const bestCaseDebtService = bestCaseMonthlyMortgage * 12;
  const bestCaseCashFlow = bestCaseNOI - bestCaseDebtService;

  const bestCaseMetrics = {
    noi: bestCaseNOI,
    cashFlow: bestCaseCashFlow,
    cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(bestCaseCashFlow, totalInvestment),
    dscr: FinancialCalculations.calculateDSCR(bestCaseNOI, bestCaseDebtService),
    noiPerUnit: bestCaseNOI / this.data.totalUnits,
    cashFlowPerUnit: bestCaseCashFlow / this.data.totalUnits
  };

  console.log('[MF] Best Case (+5% income, -5% expenses, -2% vacancy):');
  console.log('  NOI:', `$${bestCaseNOI.toLocaleString()}`);
  console.log('  Cash Flow:', `$${bestCaseCashFlow.toLocaleString()}`);
  console.log('  CoC Return:', `${bestCaseMetrics.cashOnCashReturn.toFixed(2)}%`);
  console.log('  DSCR:', bestCaseMetrics.dscr.toFixed(2));

  // Worst case scenario (MF-specific parameters)
  const worstCaseIncome = grossIncome * 0.95;
  const worstCaseExpenses = operatingExpenses * 1.1;
  const worstCaseVacancy = this.assumptions.vacancyRate + 5; // +5% for MF (more risk)
  const worstCaseCreditLoss = 0.03; // 3% (higher defaults)

  const worstCaseEGI = worstCaseIncome * (1 - worstCaseVacancy / 100) * (1 - worstCaseCreditLoss);
  const worstCaseNOI = worstCaseEGI - worstCaseExpenses;

  // Calculate worst case mortgage with higher interest rate (+1%)
  const worstCaseInterest = this.data.interestRate + 1.0;
  const worstCaseMonthlyMortgage = FinancialCalculations.calculateMortgage(
    loanAmount,
    worstCaseInterest,
    this.data.loanTerm
  );
  const worstCaseDebtService = worstCaseMonthlyMortgage * 12;
  const worstCaseCashFlow = worstCaseNOI - worstCaseDebtService;

  const worstCaseMetrics = {
    noi: worstCaseNOI,
    cashFlow: worstCaseCashFlow,
    cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(worstCaseCashFlow, totalInvestment),
    dscr: FinancialCalculations.calculateDSCR(worstCaseNOI, worstCaseDebtService),
    noiPerUnit: worstCaseNOI / this.data.totalUnits,
    cashFlowPerUnit: worstCaseCashFlow / this.data.totalUnits
  };

  console.log('[MF] Worst Case (-5% income, +10% expenses, +5% vacancy):');
  console.log('  NOI:', `$${worstCaseNOI.toLocaleString()}`);
  console.log('  Cash Flow:', `$${worstCaseCashFlow.toLocaleString()}`);
  console.log('  CoC Return:', `${worstCaseMetrics.cashOnCashReturn.toFixed(2)}%`);
  console.log('  DSCR:', worstCaseMetrics.dscr.toFixed(2));

  // CRITICAL: Warn if worst-case DSCR < 1.25 (commercial lending requirement)
  if (worstCaseMetrics.dscr < 1.25) {
    console.warn(
      `[MF] ⚠️ CRITICAL: Worst-case DSCR (${worstCaseMetrics.dscr.toFixed(2)}) below lender requirement (1.25)\n` +
      `  → Property may not qualify for commercial financing\n` +
      `  → Recommendation: Increase down payment or negotiate lower price`
    );
  }

  console.log('[MF] ========== END SENSITIVITY ANALYSIS ==========');

  return {
    baseCase: {
      noi,
      cashFlow,
      cashOnCashReturn: FinancialCalculations.calculateCashOnCashReturn(cashFlow, totalInvestment),
      dscr: FinancialCalculations.calculateDSCR(noi, annualDebtService),
      noiPerUnit: noi / this.data.totalUnits,
      cashFlowPerUnit: cashFlow / this.data.totalUnits
    },
    bestCase: bestCaseMetrics,
    worstCase: worstCaseMetrics
  };
}
```

**Key Differences from SFR**:
1. Uses `calculateEffectiveGrossIncome()` instead of `calculateNOI()`
2. Min vacancy is 3% (not 1%) for MF properties
3. Includes credit loss scenarios (1.5-3%)
4. Calculates per-unit metrics (noiPerUnit, cashFlowPerUnit)
5. Warns if worst-case DSCR < 1.25 (commercial lending requirement)

---

## 📐 **Method 2: normalizeOutput()**

### **SFR Pattern Analysis**

```typescript
// SFRAnalyzer.ts (lines 376-465)
private normalizeOutput(result: AnalysisResult<SFRMetrics>): AnalysisResult<SFRMetrics> {
  // 1. Deep clone result to avoid mutations
  const normalized = JSON.parse(JSON.stringify(result));

  // 2. Flatten expense breakdown into expenses object
  if (normalized.monthlyAnalysis?.expenses?.breakdown) {
    normalized.monthlyAnalysis.expenses = {
      ...normalized.monthlyAnalysis.expenses,
      propertyTax: breakdown.propertyTax,
      insurance: breakdown.insurance,
      // ... flatten all breakdown items
    };
  }

  // 3. Ensure monthly expenses total is calculated
  // 4. Convert monthly income to object if it's a number
  // 5. Add sensitivity analysis
  // 6. Return normalized result
}
```

### **MF-Specific Architectural Guidance**

#### **✅ SAME AS SFR**:
- Deep clone result with `JSON.parse(JSON.stringify(result))`
- Flatten expense breakdown for frontend
- Calculate monthly expenses total
- Add sensitivity analysis to output

#### **🔄 ADAPT FOR MF**:

**1. MF Has Additional Expense Categories**:
```typescript
// MF-specific expenses to flatten
normalized.monthlyAnalysis.expenses = {
  ...normalized.monthlyAnalysis.expenses,
  propertyTax: breakdown.propertyTax,
  insurance: breakdown.insurance,
  maintenance: breakdown.maintenance,
  propertyManagement: breakdown.propertyManagement,
  commonAreaUtilities: breakdown.commonAreaElectricity + breakdown.waterSewer + breakdown.utilities + breakdown.garbage, // MF-specific
  capEx: breakdown.capEx, // MF-specific (6% of gross income)
  mortgage: normalized.monthlyAnalysis.expenses.debt || 0
};
```

**2. MF Income Structure**:
```typescript
// MF has Gross Income vs EGI distinction
if (normalized.monthlyAnalysis?.income) {
  normalized.monthlyAnalysis.income = {
    gross: normalized.keyMetrics.grossIncome / 12,
    effective: normalized.keyMetrics.effectiveGrossIncome / 12, // MF-specific
    vacancyLoss: (normalized.keyMetrics.grossIncome - normalized.keyMetrics.effectiveGrossIncome) / 12
  };
}
```

**3. Add Per-Unit Metrics**:
```typescript
// Frontend developers need per-unit breakdown for MF
normalized.keyMetrics.perUnit = {
  price: normalized.keyMetrics.pricePerUnit,
  noi: normalized.keyMetrics.noiPerUnit,
  cashFlow: normalized.keyMetrics.cashFlowPerUnit,
  rent: normalized.keyMetrics.averageRentPerUnit
};
```

### **Implementation Pattern**

```typescript
/**
 * Normalize MF Analysis Output for Frontend (Story 1.3)
 * Flattens nested data structures and ensures all required properties exist
 *
 * Frontend Requirements:
 * - Flat expense object (no nested breakdown)
 * - Monthly income as object (gross, effective, vacancyLoss)
 * - Per-unit metrics readily accessible
 * - Sensitivity analysis included
 */
private normalizeOutput(result: AnalysisResult<MultiFamilyMetrics>): AnalysisResult<MultiFamilyMetrics> {
  console.log('[MF] Normalizing analysis output for frontend...');

  // Deep clone to avoid mutating original
  const normalized = JSON.parse(JSON.stringify(result)) as AnalysisResult<MultiFamilyMetrics>;

  // Flatten expense breakdown for easier frontend access
  if (normalized.monthlyAnalysis?.expenses?.breakdown) {
    const breakdown = normalized.monthlyAnalysis.expenses.breakdown;

    normalized.monthlyAnalysis.expenses = {
      ...normalized.monthlyAnalysis.expenses,
      propertyTax: breakdown.propertyTax,
      insurance: breakdown.insurance,
      maintenance: breakdown.maintenance,
      propertyManagement: breakdown.propertyManagement,
      commonAreaElectricity: breakdown.commonAreaElectricity || 0,
      waterSewer: breakdown.waterSewer || 0,
      utilities: breakdown.utilities || 0,
      garbage: breakdown.garbage || 0,
      capEx: breakdown.capEx,
      mortgage: normalized.monthlyAnalysis.expenses.debt
        ? { total: normalized.monthlyAnalysis.expenses.debt }
        : (normalized.monthlyAnalysis.expenses as any).mortgage || { total: 0 }
    } as any;
  }

  // Calculate monthly expenses total (MF-specific categories)
  if (normalized.monthlyAnalysis?.expenses) {
    const exp = normalized.monthlyAnalysis.expenses as any;
    normalized.monthlyAnalysis.expenses.total =
      (exp.mortgage?.total || 0) +
      (exp.propertyTax || 0) +
      (exp.insurance || 0) +
      (exp.maintenance || 0) +
      (exp.propertyManagement || 0) +
      (exp.commonAreaElectricity || 0) +
      (exp.waterSewer || 0) +
      (exp.utilities || 0) +
      (exp.garbage || 0) +
      (exp.capEx || 0);
  }

  // Convert monthly income to object (MF has Gross vs EGI distinction)
  if (normalized.monthlyAnalysis?.income && typeof normalized.monthlyAnalysis.income === 'number') {
    const monthlyGross = normalized.keyMetrics.grossIncome / 12;
    const monthlyEffective = normalized.keyMetrics.effectiveGrossIncome / 12;

    normalized.monthlyAnalysis.income = {
      gross: monthlyGross,
      effective: monthlyEffective,
      vacancyLoss: monthlyGross - monthlyEffective
    };
  }

  // Add per-unit metrics for frontend (MF-specific)
  if (normalized.keyMetrics && !('perUnit' in normalized.keyMetrics)) {
    (normalized.keyMetrics as any).perUnit = {
      price: normalized.keyMetrics.pricePerUnit,
      noi: normalized.keyMetrics.noiPerUnit,
      cashFlow: normalized.keyMetrics.cashFlowPerUnit,
      rent: normalized.keyMetrics.averageRentPerUnit,
      operatingExpense: normalized.keyMetrics.operatingExpensePerUnit
    };
  }

  // Add sensitivity analysis
  normalized.sensitivityAnalysis = this.calculateSensitivityAnalysis();

  console.log('[MF] ✅ Output normalized for frontend:', {
    hasMonthlyExpenses: !!normalized.monthlyAnalysis?.expenses,
    hasFlattenedExpenses: !!(normalized.monthlyAnalysis?.expenses as any)?.propertyTax,
    hasIncomeObject: typeof normalized.monthlyAnalysis?.income === 'object',
    hasPerUnitMetrics: !!(normalized.keyMetrics as any)?.perUnit,
    hasSensitivityAnalysis: !!normalized.sensitivityAnalysis
  });

  return normalized;
}
```

**Key Differences from SFR**:
1. Flattens MF-specific expenses (commonAreaUtilities, capEx)
2. Income object includes `vacancyLoss` (MF distinction)
3. Adds `perUnit` metrics object
4. Total expenses calculation includes all MF categories

---

## 📐 **Method 3: fetchMarketData()**

### **SFR Pattern Analysis**

```typescript
// SFRAnalyzer.ts (lines 468-517)
private async fetchMarketData(): Promise<{
  marketData: MarketDataResponse | null;
  marketInsights: MarketInsight[];
  investmentTiming: InvestmentTimingAnalysis | null;
}> {
  try {
    const address = `${this.data.propertyAddress.street}, ${this.data.propertyAddress.city}, ${this.data.propertyAddress.state} ${this.data.propertyAddress.zipCode}`;

    // Fetch comprehensive market data
    const marketData = await marketIntelligenceService.getComprehensiveMarketData({
      address,
      zipCode: this.data.propertyAddress.zipCode,
      propertyType: 'SFR', // ← THIS CHANGES TO 'MF'
      includeEconomicData: true,
      maxComparables: 10,
      radius: 0.5
    });

    // Generate market insights
    const marketInsights = await marketIntelligenceService.generateMarketInsights(
      this.data,
      marketData
    );

    // Analyze investment timing
    const investmentTiming = await marketIntelligenceService.analyzeInvestmentTiming(marketData);

    return { marketData, marketInsights, investmentTiming };
  } catch (error) {
    logger.error('Failed to fetch market data:', error);
    return { marketData: null, marketInsights: [], investmentTiming: null };
  }
}
```

### **MF-Specific Architectural Guidance**

#### **✅ SAME AS SFR**:
- Use `marketIntelligenceService` (shared service)
- Same error handling pattern (return nulls, don't throw)
- Same return type structure

#### **🔄 ADAPT FOR MF**:

**1. Property Type Parameter**:
```typescript
// ✅ CORRECT
propertyType: 'MF' // Multi-family

// ❌ WRONG
propertyType: 'SFR' // This is for single-family
```

**2. MF-Specific Comparable Criteria**:
```typescript
// Multi-family comparables have different criteria
const marketData = await marketIntelligenceService.getComprehensiveMarketData({
  address,
  zipCode: this.data.propertyAddress.zipCode,
  propertyType: 'MF',
  includeEconomicData: true,
  maxComparables: 10,
  radius: 0.5, // MF: Can use larger radius (less inventory)
  minUnits: Math.max(2, this.data.totalUnits - 4), // ±4 units from target
  maxUnits: this.data.totalUnits + 4,
  yearBuilt: this.data.yearBuilt // Compare similar vintage
});
```

**3. MF Market Insights Parameters**:
```typescript
// MF insights focus on different metrics than SFR
const marketInsights = await marketIntelligenceService.generateMarketInsights(
  this.data,
  marketData,
  {
    compareCapRate: true, // MF-specific: Compare cap rates
    compareGRM: true, // MF-specific: Compare gross rent multipliers
    compareDebtYield: true, // MF-specific: Lender requirement comparison
    comparePerUnit: true // MF-specific: Per-unit price comparison
  }
);
```

### **Implementation Pattern**

```typescript
/**
 * Fetch Market Data for Multi-Family Property (Story 1.3)
 * Integrates with RentCast for market intelligence and comparable properties
 *
 * Returns:
 * - Market data: Comparable MF properties, cap rates, rent trends
 * - Market insights: "Above/below market" analysis
 * - Investment timing: Buy/hold/wait signals
 */
private async fetchMarketData(): Promise<{
  marketData: MarketDataResponse | null;
  marketInsights: MarketInsight[];
  investmentTiming: InvestmentTimingAnalysis | null;
}> {
  try {
    const address = `${this.data.propertyAddress.street}, ${this.data.propertyAddress.city}, ${this.data.propertyAddress.state} ${this.data.propertyAddress.zipCode}`;

    logger.info(`[MF] Fetching market data for multi-family property: ${address} (${this.data.totalUnits} units)`);

    // Fetch comprehensive market data (MF-specific parameters)
    const marketData = await marketIntelligenceService.getComprehensiveMarketData({
      address,
      zipCode: this.data.propertyAddress.zipCode,
      city: this.data.propertyAddress.city,
      state: this.data.propertyAddress.state,
      propertyType: 'MF', // ← CRITICAL: Multi-family
      includeEconomicData: true,
      maxComparables: 10,
      radius: 0.5,
      // MF-specific filters
      minUnits: Math.max(2, this.data.totalUnits - 4),
      maxUnits: this.data.totalUnits + 4,
      yearBuilt: this.data.yearBuilt
    });

    // Generate MF-specific market insights
    const marketInsights = await marketIntelligenceService.generateMarketInsights(
      this.data,
      marketData,
      {
        compareCapRate: true,
        compareGRM: true,
        compareDebtYield: true,
        comparePerUnit: true
      }
    );

    // Analyze investment timing (same as SFR)
    const investmentTiming = await marketIntelligenceService.analyzeInvestmentTiming(marketData);

    logger.info(`[MF] ✅ Successfully fetched market intelligence: ${marketInsights.length} insights generated`);

    return {
      marketData,
      marketInsights,
      investmentTiming
    };
  } catch (error) {
    logger.error('[MF] ❌ Failed to fetch market data for multi-family analysis:', error);

    // Return empty data to allow analysis to continue (graceful degradation)
    return {
      marketData: null,
      marketInsights: [],
      investmentTiming: null
    };
  }
}
```

**Key Differences from SFR**:
1. `propertyType: 'MF'` instead of `'SFR'`
2. Filters by unit count (±4 units)
3. Filters by year built (vintage matters for MF)
4. Requests MF-specific comparison metrics (capRate, GRM, debtYield, perUnit)

---

## 📐 **Method 4: analyzeWithMarketIntelligence()**

### **SFR Pattern Analysis**

```typescript
// SFRAnalyzer.ts (lines 526-548)
public async analyzeWithMarketIntelligence(): Promise<AnalysisResult<SFRMetrics> & {
  marketData?: MarketDataResponse;
  marketInsights?: MarketInsight[];
  investmentTiming?: InvestmentTimingAnalysis;
}> {
  // 1. Perform base analysis
  const result = super.analyze();

  // 2. Normalize output
  const normalizedResult = this.normalizeOutput(result);

  // 3. Fetch market intelligence
  const { marketData, marketInsights, investmentTiming } = await this.fetchMarketData();

  // 4. Enhance result with market data
  const enhancedResult = {
    ...normalizedResult,
    ...(marketData && { marketData }),
    ...(marketInsights.length > 0 && { marketInsights }),
    ...(investmentTiming && { investmentTiming })
  };

  logger.info('SFR analysis completed with market intelligence enhancement');

  return enhancedResult;
}
```

### **MF-Specific Architectural Guidance**

#### **✅ EXACT SAME AS SFR**:
- Call `super.analyze()` for base analysis
- Call `normalizeOutput()` to flatten data
- Call `fetchMarketData()` to get market intelligence
- Merge results with spread operator
- Use conditional spreading (`...(marketData && { marketData })`) to avoid nulls

#### **🔄 ONLY CHANGE**:
- Update return type from `AnalysisResult<SFRMetrics>` to `AnalysisResult<MultiFamilyMetrics>`
- Update logger message to say "Multi-family" instead of "SFR"

### **Implementation Pattern**

```typescript
/**
 * Analyze Multi-Family Property with Market Intelligence (Story 1.3)
 * Combines base analysis with market data for enhanced insights
 *
 * Returns:
 * - Full analysis result (metrics, projections, exit analysis)
 * - Market data (comparable properties, trends)
 * - Market insights ("12% below market cap rate - BUY signal!")
 * - Investment timing (buy/hold/wait recommendation)
 */
public async analyzeWithMarketIntelligence(): Promise<AnalysisResult<MultiFamilyMetrics> & {
  marketData?: MarketDataResponse;
  marketInsights?: MarketInsight[];
  investmentTiming?: InvestmentTimingAnalysis;
}> {
  logger.info('[MF] Starting multi-family analysis with market intelligence...');

  // Step 1: Perform base MF analysis
  const result = super.analyze();

  // Step 2: Normalize output for frontend
  const normalizedResult = this.normalizeOutput(result);

  // Step 3: Fetch market intelligence data
  const { marketData, marketInsights, investmentTiming } = await this.fetchMarketData();

  // Step 4: Enhance the result with market intelligence
  const enhancedResult = {
    ...normalizedResult,
    ...(marketData && { marketData }),
    ...(marketInsights.length > 0 && { marketInsights }),
    ...(investmentTiming && { investmentTiming })
  };

  logger.info('[MF] ✅ Multi-family analysis completed with market intelligence enhancement');

  return enhancedResult;
}
```

**Key Differences from SFR**:
1. Return type: `AnalysisResult<MultiFamilyMetrics>` (not `SFRMetrics`)
2. Logger message: "Multi-family" (not "SFR")
3. **EVERYTHING ELSE IS IDENTICAL** - this is intentional polymorphism!

---

## 🚦 **Implementation Order & Dependencies**

```
1. calculateSensitivityAnalysis() (12h)
   ↓ (no dependencies)

2. normalizeOutput() (4h)
   ↓ (depends on #1 for sensitivity analysis)

3. fetchMarketData() (4h)
   ↓ (no dependencies on #1 or #2)

4. analyzeWithMarketIntelligence() (4h)
   ↓ (depends on #2 and #3)
```

**Recommended Order**:
1. **Start with `calculateSensitivityAnalysis()`** - Most complex, self-contained
2. **Then `normalizeOutput()`** - Needs sensitivity analysis
3. **Then `fetchMarketData()`** - Independent, can be done in parallel with #1-2
4. **Finally `analyzeWithMarketIntelligence()`** - Orchestrates all 3 methods

---

## 📋 **Architectural Principles Summary**

### **✅ DO (Follow SFR Patterns)**:
1. **Method Visibility**: Keep same as SFR
   - `calculateSensitivityAnalysis()` - `protected` (can be overridden)
   - `normalizeOutput()` - `private` (internal only)
   - `fetchMarketData()` - `private` (internal only)
   - `analyzeWithMarketIntelligence()` - `public` (exposed to controllers)

2. **Error Handling**: Graceful degradation
   - `fetchMarketData()` returns nulls on error (doesn't throw)
   - Analysis continues even if market data fails

3. **Logging**: Comprehensive
   - Log start of each major operation
   - Log key metrics in sensitivity scenarios
   - Log success/failure of market data fetch

4. **Return Types**: Match SFR structure
   - `SensitivityAnalysis` interface (already defined)
   - `AnalysisResult<MultiFamilyMetrics>` (generic type)

### **🔄 ADAPT (MF-Specific)**:
1. **Sensitivity Scenarios**: MF has different risk profile
   - Min vacancy: 3% (not 1%)
   - Worst vacancy: +5% (not +3%)
   - Add credit loss scenarios (1.5-3%)
   - Include per-unit metrics

2. **Normalization**: MF has different expense structure
   - Flatten MF-specific expenses (common area, capEx)
   - Add per-unit metrics object
   - Income object includes vacancyLoss

3. **Market Data**: MF has different comparables
   - Filter by unit count (±4 units)
   - Compare cap rates, GRM, debt yield (not just price)
   - `propertyType: 'MF'`

4. **Calculations**: Use MF methods
   - Use `calculateEffectiveGrossIncome()` (not `calculateNOI()`)
   - Calculate NOI as `EGI - Operating Expenses`
   - Include per-unit metrics in sensitivity

---

## ✅ **Final Checklist for Engineer**

Before implementing, ensure you understand:

- [x] **Sensitivity Analysis**:
  - [x] Use MF-specific vacancy minimums (3%, not 1%)
  - [x] Include credit loss scenarios (1.5-3%)
  - [x] Calculate per-unit metrics in all scenarios
  - [x] Warn if worst-case DSCR < 1.25

- [x] **Output Normalization**:
  - [x] Flatten MF-specific expenses (common area, capEx)
  - [x] Add per-unit metrics object
  - [x] Income object includes gross, effective, vacancyLoss
  - [x] Call `calculateSensitivityAnalysis()` to add to output

- [x] **Market Data Fetch**:
  - [x] Use `propertyType: 'MF'` (not 'SFR')
  - [x] Filter by unit count (±4 units)
  - [x] Request MF-specific comparisons (capRate, GRM, debtYield)
  - [x] Return nulls on error (graceful degradation)

- [x] **Market Intelligence Method**:
  - [x] Call `super.analyze()` first
  - [x] Call `normalizeOutput()` second
  - [x] Call `fetchMarketData()` third
  - [x] Merge results with spread operator
  - [x] Return type is `AnalysisResult<MultiFamilyMetrics>`

---

## 🎯 **Success Criteria**

Story 1.3 is complete when:
1. ✅ All 4 methods implemented and following SFR patterns
2. ✅ MF-specific adaptations applied correctly
3. ✅ Comprehensive logging in each method
4. ✅ Error handling with graceful degradation
5. ✅ Tests pass (will be added in Story 1.6)
6. ✅ Architect review: APPROVED (5/5)
7. ✅ QE validation: APPROVED (4-5/5)

---

**Architect Signature**: Principal Software Architect
**Date**: October 25, 2025
**Consultation Time**: 2 hours (architectural guidance + pattern analysis)
**Implementation Time Estimate**: 24 hours (12h + 4h + 4h + 4h)
