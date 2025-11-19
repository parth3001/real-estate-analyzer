# Multi-Family Property Metrics Reference Guide

**Document Version**: 1.0
**Last Updated**: October 28, 2025
**Validated By**: Business Expert (20-year real estate investor, $10M AUM)
**Implementation**: MultiFamilyAnalyzer.ts (Lines 1-1078)
**Related Documents**:
- [MF Metrics Business Validation](./MF_METRICS_BUSINESS_VALIDATION.md) - Industry standard validation
- [Data Dictionary](./DATA_DICTIONARY.md) - Complete data field reference
- [SFR vs MF Isolation](./SFR_VS_MF_ISOLATION.md) - Property type separation

---

## Table of Contents

1. [Core Financial Metrics](#core-financial-metrics)
2. [Advanced Multi-Family Metrics](#advanced-multi-family-metrics)
3. [Per-Unit Metrics](#per-unit-metrics)
4. [Expense Components](#expense-components)
5. [Metric Hierarchy](#metric-hierarchy)
6. [Industry Benchmarks](#industry-benchmarks)
7. [When to Use Each Metric](#when-to-use-each-metric)

---

## Core Financial Metrics

### 1. Gross Income (GI)

**Definition**: Total potential rental income from all units if fully occupied for one year.

**Formula**:
```
Gross Income = Σ(Unit Rent × 12) for all units
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:221-235
protected calculateGrossIncome(year: number): number {
  const growthFactor = Math.pow(1 + this.assumptions.annualRentIncrease / 100, year - 1);
  const units = this.getNormalizedUnits();

  const totalRent = units.reduce((total, unit) => {
    return total + (unit.currentRent * 12 * growthFactor);
  }, 0);

  return totalRent;
}
```

**Data Dictionary Fields**:
- Input: `units[].currentRent` (monthly rent per unit)
- Output: `keyMetrics.grossIncome` (annual)

**Industry Standard**: Annualized potential rent at 100% occupancy
**Typical Range**: Varies by property size and market
**Business Use**: Revenue potential assessment, GRM calculation base

---

### 2. Effective Gross Income (EGI)

**Definition**: Actual income after accounting for vacancy losses and credit losses (tenant non-payment).

**Formula**:
```
EGI = Gross Income - Vacancy Loss - Credit Loss
Vacancy Loss = Gross Income × Vacancy Rate
Credit Loss = Gross Income × 2% (industry standard)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:243-253
protected calculateEffectiveGrossIncome(grossIncome: number): number {
  const vacancyLoss = grossIncome * (this.assumptions.vacancyRate / 100);
  const creditLoss = grossIncome * 0.02; // 2% bad debt (industry standard)

  return grossIncome - vacancyLoss - creditLoss;
}
```

**Data Dictionary Fields**:
- Input: `longTermAssumptions.vacancyRate` (percentage)
- Output: `keyMetrics.effectiveGrossIncome` (annual)

**Industry Standard**:
- Credit Loss: 2% of gross income (multifamily industry standard)
- Vacancy Rate: Typically 5-7% for stabilized properties

**Typical Range**:
- 93-95% of Gross Income for well-managed properties
- 85-90% for higher vacancy/credit loss properties

**Business Use**:
- More realistic income projection than Gross Income
- Used in NOI calculation
- Lender underwriting metric

**⚠️ Common Mistake**: Including vacancy as an operating expense (incorrect). Vacancy reduces income, not increases expenses.

---

### 3. Net Operating Income (NOI)

**Definition**: Income remaining after all operating expenses but before debt service (mortgage payments).

**Formula**:
```
NOI = Effective Gross Income - Operating Expenses

Where Operating Expenses include:
- Property Tax
- Insurance
- Property Management
- Maintenance
- Common Area Utilities
- Capital Reserves (CapEx)
- Landscaping, pest control, etc.

Operating Expenses EXCLUDE:
❌ Vacancy (this reduces income, not an expense)
❌ Mortgage payments (debt service is separate)
❌ Depreciation (non-cash accounting expense)
❌ Income taxes (owner-specific, not property-specific)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:310-311
const effectiveGrossIncome = this.calculateEffectiveGrossIncome(grossIncome);
const operatingExpenses = this.calculateOperatingExpenses(grossIncome);
const noi = effectiveGrossIncome - operatingExpenses;
```

**Data Dictionary Fields**:
- Output: `keyMetrics.noi` (annual)
- Output: `annualAnalysis.noi` (annual)

**Industry Standard**:
```
Potential Rental Income - Vacancy - Credit Loss - Operating Expenses = NOI
```

**Typical Range**:
- 40-60% of Gross Income for well-operated properties
- Higher NOI % = more profitable property

**Business Use**:
- Primary metric for property valuation (Cap Rate calculation)
- Lender underwriting (DSCR calculation)
- Property performance comparison
- Independent of financing structure

**🔥 Critical Note**: Story 1.2 fixed critical bug where vacancy was incorrectly included in operating expenses. NOI calculation now matches institutional standards.

---

### 4. Capitalization Rate (Cap Rate)

**Definition**: Annual return on investment if purchased with all cash (no financing).

**Formula**:
```
Cap Rate = (NOI ÷ Purchase Price) × 100
```

**Implementation**:
```typescript
// Inherited from BasePropertyAnalyzer
protected calculateCapRate(noi: number): number {
  return this.data.purchasePrice > 0
    ? (noi / this.data.purchasePrice) * 100
    : 0;
}
```

**Data Dictionary Fields**:
- Input: `purchasePrice`, `keyMetrics.noi`
- Output: `keyMetrics.capRate` (percentage)

**Industry Standard**: NOI ÷ Current Market Value × 100

**Typical Range**:
- **Class A Properties**: 4-6% (newer, better locations)
- **Class B Properties**: 5-7% (mid-tier)
- **Class C Properties**: 7-10% (older, higher risk)

**Interpretation**:
- **Lower Cap Rate** = Lower risk, lower return, premium property
- **Higher Cap Rate** = Higher risk, higher return, value-add opportunity

**Business Use**:
- Quick property valuation (Value = NOI ÷ Cap Rate)
- Compare properties across markets
- Determine if property is overpriced or underpriced
- Independent of financing (pure property performance)

**Example**:
```
NOI: $100,000
Purchase Price: $1,500,000
Cap Rate = ($100,000 ÷ $1,500,000) × 100 = 6.67%
```

---

### 5. Debt Service Coverage Ratio (DSCR)

**Definition**: How many times the property's NOI can cover the annual mortgage payments.

**Formula**:
```
DSCR = NOI ÷ Annual Debt Service

Where Annual Debt Service = Monthly Mortgage Payment × 12
```

**Implementation**:
```typescript
// Inherited from BasePropertyAnalyzer
protected calculateDSCR(noi: number, annualDebtService: number): number {
  return annualDebtService > 0
    ? noi / annualDebtService
    : 0;
}
```

**Data Dictionary Fields**:
- Input: `keyMetrics.noi`, `annualAnalysis.debtService`
- Output: `keyMetrics.dscr` (ratio)

**Industry Standard**: NOI ÷ Total Annual Debt Obligations

**Lender Minimum Requirements (2025)**:
- **Fannie Mae**: 1.25x minimum
- **Freddie Mac**: 1.20x minimum
- **HUD 221(d)(4)**: 1.18x (market-rate), 1.15x (affordable), 1.11x (subsidized)
- **General Multifamily**: 1.20x - 1.25x minimum

**Interpretation**:
- **DSCR = 1.00**: Property breaks even (NOI exactly equals debt service)
- **DSCR < 1.00**: Property loses money (cannot cover mortgage)
- **DSCR = 1.25**: Property generates 25% more income than needed for mortgage
- **DSCR > 1.35**: Strong cushion, preferred by conservative lenders

**Business Use**:
- Loan qualification (lenders require minimum DSCR)
- Risk assessment (higher = safer investment)
- Cash flow adequacy measurement

**Example**:
```
NOI: $120,000/year
Annual Debt Service: $96,000/year
DSCR = $120,000 ÷ $96,000 = 1.25x ✅ Meets Fannie Mae standards
```

**⚠️ Red Flag**: DSCR < 1.20x may face financing challenges in 2025 market

---

### 6. Cash Flow

**Definition**: Annual income remaining after all expenses including mortgage payments.

**Formula**:
```
Cash Flow = NOI - Annual Debt Service

Where Annual Debt Service = Monthly Mortgage Payment × 12
```

**Implementation**:
```typescript
// Via FinancialCalculations utility
static calculateCashFlow(noi: number, debtService: number): number {
  return noi - debtService;
}
```

**Data Dictionary Fields**:
- Input: `keyMetrics.noi`, `annualAnalysis.debtService`
- Output: `annualAnalysis.cashFlow` (annual)
- Output: `monthlyAnalysis.cashFlow` (monthly)

**Industry Standard**: Annual Cash Flow = NOI - Annual Debt Service

**Typical Range**:
- **Positive Cash Flow**: Goal for most investors
- **Negative Cash Flow**: Acceptable for appreciation plays or tax benefits
- **$200-500/unit/month**: Good performance for stabilized MF

**Interpretation**:
- **Positive**: Property makes money after all expenses
- **Negative**: Investor must contribute money monthly ("feeding the alligator")
- **Zero**: Break-even (no profit, no loss)

**Business Use**:
- Monthly budget planning
- Tax return calculation (before depreciation)
- Cash-on-Cash Return calculation
- Investment return assessment

**Example**:
```
NOI: $120,000/year
Debt Service: $90,000/year
Cash Flow = $120,000 - $90,000 = $30,000/year = $2,500/month
```

---

### 7. Cash-on-Cash Return (CoC Return)

**Definition**: Annual return percentage on actual cash invested.

**Formula**:
```
Cash-on-Cash Return = (Annual Cash Flow ÷ Total Cash Invested) × 100

Where Total Cash Invested = Down Payment + Closing Costs + Capital Investments
```

**Implementation**:
```typescript
// Via FinancialCalculations utility
static calculateCashOnCashReturn(cashFlow: number, totalInvestment: number): number {
  return totalInvestment > 0
    ? (cashFlow / totalInvestment) * 100
    : 0;
}
```

**Data Dictionary Fields**:
- Input: `annualAnalysis.cashFlow`, `keyMetrics.totalInvestment`
- Output: `keyMetrics.cashOnCashReturn` (percentage)

**Industry Standard**: (Annual Pre-Tax Cash Flow ÷ Total Cash Invested) × 100

**Target Range (2025)**:
- **8-12%**: Good performance for quality multifamily
- **12-15%**: Excellent performance
- **15%+**: Outstanding (or higher risk)
- **<8%**: Below expectations for most investors

**Interpretation**:
- Similar to dividend yield on stocks
- Measures return on capital deployed
- Higher leverage = potentially higher CoC (but higher risk)

**Business Use**:
- Compare investment opportunities
- Evaluate financing structures (leverage impact)
- Assess deal quality
- Year-over-year performance tracking

**Example**:
```
Annual Cash Flow: $30,000
Total Investment: $300,000 (down payment + closing costs)
CoC Return = ($30,000 ÷ $300,000) × 100 = 10% ✅ Good performance
```

---

### 8. Internal Rate of Return (IRR)

**Definition**: Annualized rate of return accounting for all cash flows over the investment period, including sale proceeds.

**Formula**:
```
NPV = Σ [Cash Flow_t ÷ (1 + IRR)^t] = 0

Where:
- Cash Flow_0 = -Total Investment (initial outlay)
- Cash Flow_1 to Cash Flow_n-1 = Annual cash flows
- Cash Flow_n = Final year cash flow + Net Sale Proceeds
```

**Implementation**:
```typescript
// Via FinancialCalculations utility using Newton-Raphson method
static calculateIRR(cashFlows: number[]): number {
  // Iterative calculation to find rate where NPV = 0
  // Typical precision: 0.01% (4 decimal places)
}
```

**Data Dictionary Fields**:
- Input: Array of annual cash flows including initial investment and sale proceeds
- Output: `keyMetrics.irr` (percentage)

**Industry Standard**: Time-weighted return solving for NPV = 0

**Target Range**:
- **12-15%**: Good multifamily investment
- **15-18%**: Excellent performance
- **18%+**: Outstanding (or higher risk)
- **<12%**: Below market expectations

**Interpretation**:
- **IRR > Required Return**: Accept investment
- **IRR < Required Return**: Reject investment
- Accounts for time value of money (unlike simple ROI)

**Business Use**:
- Compare investments of different durations
- Evaluate hold period strategy
- Assess total return potential
- More sophisticated than Cash-on-Cash

**Limitations**:
- Assumes reinvestment at IRR rate (often unrealistic)
- Can be misleading with irregular cash flows
- Requires sale price assumption

---

### 9. Operating Expense Ratio (OER)

**Definition**: Operating expenses as a percentage of effective gross income.

**Formula**:
```
OER = (Operating Expenses ÷ Effective Gross Income) × 100
```

**Implementation**:
```typescript
// Via FinancialCalculations utility
static calculateOperatingExpenseRatio(operatingExpenses: number, effectiveIncome: number): number {
  return effectiveIncome > 0
    ? (operatingExpenses / effectiveIncome) * 100
    : 0;
}
```

**Data Dictionary Fields**:
- Input: `keyMetrics.operatingExpenses`, `keyMetrics.effectiveGrossIncome`
- Output: `keyMetrics.operatingExpenseRatio` (percentage)

**Industry Standard**: (Operating Expenses ÷ EGI) × 100

**Typical Range**:
- **35-45%**: Well-managed property
- **45-55%**: Average management
- **55%+**: High expenses (investigate causes)
- **<35%**: Exceptional efficiency (or deferred maintenance)

**Interpretation**:
- **Lower OER** = More efficient operations, higher NOI
- **Higher OER** = Less efficient, lower profitability

**Business Use**:
- Benchmark property management efficiency
- Identify cost reduction opportunities
- Compare properties of similar type/market
- Detect potential maintenance issues

---

## Advanced Multi-Family Metrics

### 10. Gross Rent Multiplier (GRM)

**Definition**: Number of years for gross rental income to equal purchase price.

**Formula**:
```
GRM = Purchase Price ÷ Gross Annual Income
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:494-522
private calculateGrossRentMultiplier(purchasePrice: number, grossIncome: number): number {
  const grm = purchasePrice / grossIncome;

  // Validation warnings
  if (grm < 4) {
    console.warn(`Unusually low GRM - may indicate below-market rents`);
  } else if (grm > 7) {
    console.warn(`High GRM - property may be overpriced`);
  }

  return grm;
}
```

**Data Dictionary Fields**:
- Input: `purchasePrice`, calculated gross income
- Output: `keyMetrics.grm` (ratio)

**Industry Benchmark**: 4-7 for residential multifamily properties

**Interpretation**:
- **GRM = 5**: Takes 5 years of gross income to equal purchase price
- **Lower GRM** = Better value (fewer years to recoup investment)
- **Higher GRM** = Overpriced or below-market rents

**Business Use**:
- Quick valuation tool (faster than Cap Rate)
- Compare properties in same market
- Identify overpriced listings
- Back-of-envelope calculations

**Limitations**:
- Ignores expenses (use Cap Rate for net return)
- Market-specific (4 in one city may equal 6 in another)
- Not suitable for properties with below-market rents

**Example**:
```
Purchase Price: $1,200,000
Gross Annual Income: $150,000
GRM = $1,200,000 ÷ $150,000 = 8.0 ⚠️ High (property may be overpriced)
```

---

### 11. Debt Yield

**Definition**: NOI as a percentage of loan amount (lender's risk metric).

**Formula**:
```
Debt Yield = (NOI ÷ Loan Amount) × 100
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:532-565
private calculateDebtYield(noi: number, loanAmount: number): number {
  const debtYield = (noi / loanAmount) * 100;

  if (debtYield < 10 && debtYield > 0) {
    console.warn(`Low debt yield - lenders typically require 10%+`);
  }

  return debtYield;
}
```

**Data Dictionary Fields**:
- Input: `keyMetrics.noi`, calculated loan amount
- Output: `keyMetrics.debtYield` (percentage)

**Lender Minimum Requirements**:
- **Commercial Lenders**: 10%+ minimum
- **Conservative Lenders**: 12%+ preferred

**Interpretation**:
- **Higher Debt Yield** = Less risky for lender (lower LTV)
- **Lower Debt Yield** = Higher LTV, more risk

**Business Use**:
- Lender underwriting metric
- Independent of property value (unlike LTV)
- More stable than LTV during market fluctuations
- Maximum loan sizing calculation

**Why Lenders Use This**:
- LTV can fluctuate with property values
- Debt Yield is based on income (more stable)
- Protects lender if property value drops

**Example**:
```
NOI: $120,000
Loan Amount: $960,000
Debt Yield = ($120,000 ÷ $960,000) × 100 = 12.5% ✅ Meets lender standards
```

**Reverse Calculation (Max Loan)**:
```
If lender requires 10% debt yield:
Max Loan = NOI ÷ 0.10 = $120,000 ÷ 0.10 = $1,200,000
```

---

### 12. Break-Even Occupancy (BEO)

**Definition**: Minimum occupancy percentage needed to cover all operating expenses and debt service.

**Formula**:
```
BEO = ((Operating Expenses + Annual Debt Service) ÷ Gross Potential Income) × 100
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:575-603
private calculateBreakEvenOccupancy(
  operatingExpenses: number,
  annualDebtService: number,
  grossIncome: number
): number {
  const breakEvenOccupancy = ((operatingExpenses + annualDebtService) / grossIncome) * 100;

  if (breakEvenOccupancy > 85) {
    console.warn(`High break-even occupancy - very little cushion for vacancy`);
  } else if (breakEvenOccupancy < 60) {
    console.log(`Excellent break-even occupancy - strong cushion`);
  }

  return breakEvenOccupancy;
}
```

**Data Dictionary Fields**:
- Input: `keyMetrics.operatingExpenses`, `annualAnalysis.debtService`, gross income
- Output: `keyMetrics.breakEvenOccupancy` (percentage)

**Industry Benchmark**: 60-75% for stable multifamily properties

**Interpretation**:
- **BEO = 75%**: Need 75% occupancy to break even
- **Lower BEO** = More safety cushion for vacancy
- **Higher BEO** = Risky (little room for vacancy)

**Risk Assessment**:
- **<60%**: Excellent safety margin
- **60-75%**: Good (industry standard)
- **75-85%**: Moderate risk
- **>85%**: High risk (very tight margins)

**Business Use**:
- Risk assessment
- Stress testing vacancy scenarios
- Compare safety margins across properties
- Lender analysis (gap between historical occupancy and BEO)

**Example**:
```
Operating Expenses: $80,000/year
Debt Service: $90,000/year
Gross Income: $200,000/year
BEO = (($80,000 + $90,000) ÷ $200,000) × 100 = 85% ⚠️ High risk
```

**Safety Margin Analysis**:
```
If historical occupancy = 95%:
Safety Margin = 95% - 85% = 10%
Industry Preferred: 15% gap ⚠️ Below preferred margin
```

---

### 13. Rent per Square Foot

**Definition**: Average monthly rent charged per square foot of property.

**Formula**:
```
Rent per SF = (Gross Monthly Income ÷ Total Square Feet)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:612-626
private calculateRentPerSqft(grossIncome: number, totalSqft: number): number {
  const rentPerSqft = (grossIncome / 12) / totalSqft; // Monthly rent per sq ft
  return rentPerSqft;
}
```

**Data Dictionary Fields**:
- Input: calculated gross income, `totalSqft`
- Output: `keyMetrics.rentPerSqft` (dollars per sq ft per month)

**Typical Range** (varies significantly by market):
- **Urban Class A**: $2.00-4.00/sf/month
- **Suburban Class B**: $1.00-2.00/sf/month
- **Secondary Markets**: $0.80-1.50/sf/month

**Business Use**:
- Market comparison (compare to comps)
- Identify below-market or above-market rents
- Unit mix analysis
- Renovation ROI calculation

**Example**:
```
Gross Monthly Income: $12,000
Total Square Feet: 8,000 sf
Rent per SF = $12,000 ÷ 8,000 = $1.50/sf/month
```

---

### 14. Gross Yield

**Definition**: Annual gross rental income as percentage of purchase price (before expenses).

**Formula**:
```
Gross Yield = (Gross Annual Income ÷ Purchase Price) × 100
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:636-660
private calculateGrossYield(grossIncome: number, purchasePrice: number): number {
  const grossYield = (grossIncome / purchasePrice) * 100;

  if (grossYield < 8) {
    console.warn(`Low gross yield - typical range: 8-12%`);
  } else if (grossYield > 12) {
    console.log(`High gross yield - strong income potential`);
  }

  return grossYield;
}
```

**Data Dictionary Fields**:
- Input: calculated gross income, `purchasePrice`
- Output: `keyMetrics.grossYield` (percentage)

**Industry Benchmark**: 8-12% for multifamily properties

**Interpretation**:
- **Higher Gross Yield** = Better income potential (before expenses)
- **Lower Gross Yield** = Lower income relative to price

**Business Use**:
- Quick income assessment
- Compare to Cap Rate (difference shows expense impact)
- Market screening tool

**⚠️ Important**: Does NOT account for expenses. Use Cap Rate for net yield.

**Example**:
```
Gross Annual Income: $144,000
Purchase Price: $1,200,000
Gross Yield = ($144,000 ÷ $1,200,000) × 100 = 12% ✅ Strong income
```

---

### 15. Unit Mix Efficiency

**Definition**: How well unit rents are optimized relative to size and type.

**Formula**:
```
Unit Mix Efficiency = Rent Optimization Score (0-100)

Calculated as weighted average of:
- Rent per square foot variance across units
- Market rent vs actual rent comparison
- Unit type rent optimization
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:662-724
private calculateUnitMixEfficiency(): number {
  const units = this.getNormalizedUnits();

  // Calculate rent per square foot for each unit
  const rentPerSqftValues = units.map(unit => unit.currentRent / unit.squareFeet);

  // Calculate variance (lower variance = more efficient)
  // Score 0-100 based on consistency and market alignment
}
```

**Data Dictionary Fields**:
- Input: `units[]` array with rent and square footage
- Output: `keyMetrics.unitMixEfficiency` (score 0-100)

**Interpretation**:
- **90-100**: Highly optimized rents
- **70-89**: Good optimization
- **50-69**: Room for improvement
- **<50**: Significant rent optimization opportunity

**Business Use**:
- Identify rent raise opportunities
- Analyze unit type profitability
- Value-add strategy planning

---

### 16. Economic Vacancy Rate

**Definition**: Total income loss from vacant units AND below-market rents.

**Formula**:
```
Economic Vacancy = ((Potential Market Income - Actual Collected Income) ÷ Potential Market Income) × 100

Where:
- Potential Market Income = Σ(Market Rent × 12) for all units
- Actual Collected Income = Σ(Current Rent × 12) for occupied units
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:726-780
private calculateEconomicVacancyRate(): number {
  const units = this.getNormalizedUnits();

  // Calculate potential income at market rents
  const potentialIncome = units.reduce((sum, unit) =>
    sum + (unit.marketRent || unit.currentRent) * 12, 0
  );

  // Calculate actual income (current rents for occupied units)
  const actualIncome = units.reduce((sum, unit) =>
    unit.isVacant ? sum : sum + unit.currentRent * 12, 0
  );

  return ((potentialIncome - actualIncome) / potentialIncome) * 100;
}
```

**Data Dictionary Fields**:
- Input: `units[].marketRent`, `units[].currentRent`, `units[].isVacant`
- Output: `keyMetrics.economicVacancyRate` (percentage)

**Typical Range**:
- **0-5%**: Excellent (at or near market rents)
- **5-10%**: Good (minor loss to market)
- **10-20%**: Moderate (value-add opportunity)
- **>20%**: Significant loss to market (renovation/repositioning needed)

**Interpretation**:
- **Physical Vacancy**: Units are empty
- **Economic Vacancy**: Units occupied but below market rent
- **Total Loss**: Physical + Economic

**Business Use**:
- Value-add opportunity identification
- Renovation ROI calculation
- Acquisition underwriting (potential upside)

**Example**:
```
8 units, market rent $1,500/unit
- 2 units vacant (physical vacancy = 25%)
- 6 units occupied at $1,300/unit (below market)

Potential Income: 8 × $1,500 × 12 = $144,000
Actual Income: 6 × $1,300 × 12 = $93,600
Economic Vacancy = (($144,000 - $93,600) ÷ $144,000) × 100 = 35%

This reveals $50,400/year income loss opportunity!
```

---

### 17. Common Area Expense Ratio

**Definition**: Common area utility costs per square foot.

**Formula**:
```
Common Area Expense Ratio = (Common Area Utilities ÷ Total Square Feet) × 100
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:474-484
private calculateCommonAreaExpenseRatio(): number {
  if (!this.data.commonAreaUtilities || !this.data.totalSqft) return 0;

  const commonAreaExpenses =
    (this.data.commonAreaUtilities.electric || 0) +
    (this.data.commonAreaUtilities.water || 0) +
    (this.data.commonAreaUtilities.gas || 0) +
    (this.data.commonAreaUtilities.trash || 0);

  return this.data.totalSqft > 0
    ? (commonAreaExpenses / this.data.totalSqft) * 100
    : 0;
}
```

**Data Dictionary Fields**:
- Input: `commonAreaUtilities{electric, water, gas, trash}`, `totalSqft`
- Output: `keyMetrics.commonAreaExpenseRatio` (dollars per sq ft)

**Business Use**:
- Benchmark common area efficiency
- Identify utility cost reduction opportunities
- Compare similar properties

---

## Per-Unit Metrics

### 18. Price per Unit

**Definition**: Purchase price divided by number of units.

**Formula**:
```
Price per Unit = Purchase Price ÷ Total Units
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:345
const pricePerUnit = this.data.purchasePrice / this.data.totalUnits;
```

**Data Dictionary Fields**:
- Input: `purchasePrice`, `totalUnits`
- Output: `keyMetrics.pricePerUnit` (dollars)

**Typical Range** (varies by market and property type):
- **Small Properties (2-4 units)**: $100K-300K/unit
- **Mid-Size (5-20 units)**: $80K-200K/unit
- **Large (20+ units)**: $60K-150K/unit

**Business Use**:
- Quick property comparison
- Market valuation benchmarking
- Size-normalized pricing

---

### 19. NOI per Unit

**Definition**: Annual net operating income divided by number of units.

**Formula**:
```
NOI per Unit = NOI ÷ Total Units
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:346
const noiPerUnit = noi / this.data.totalUnits;  // Annual NOI per unit
```

**Data Dictionary Fields**:
- Input: `keyMetrics.noi`, `totalUnits`
- Output: `keyMetrics.noiPerUnit` (annual dollars per unit)

**Typical Range**:
- **Small Properties**: $8,000-15,000/unit/year
- **Mid-Size**: $6,000-12,000/unit/year
- **Large**: $5,000-10,000/unit/year

**Business Use**:
- Normalize NOI across different property sizes
- Compare properties with different unit counts
- Assess per-unit profitability

---

### 20. Cash Flow per Unit

**Definition**: Annual cash flow divided by number of units.

**Formula**:
```
Cash Flow per Unit = Annual Cash Flow ÷ Total Units
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:347
const cashFlowPerUnit = cashFlow / this.data.totalUnits;  // Annual cash flow per unit
```

**Data Dictionary Fields**:
- Input: `annualAnalysis.cashFlow`, `totalUnits`
- Output: `keyMetrics.cashFlowPerUnit` (annual dollars per unit)

**Typical Range**:
- **Good Performance**: $2,000-6,000/unit/year
- **Excellent Performance**: $6,000-10,000/unit/year
- **Outstanding**: $10,000+/unit/year

**Business Use**:
- Compare cash flow across property sizes
- Assess per-unit profitability after debt service
- Investment quality assessment

---

### 21. Average Rent per Unit

**Definition**: Average monthly rent across all units.

**Formula**:
```
Average Rent per Unit = (Annual Gross Income ÷ Total Units) ÷ 12
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:348
const averageRentPerUnit = grossIncome / (this.data.totalUnits * 12);  // Monthly average
```

**Data Dictionary Fields**:
- Input: calculated gross income, `totalUnits`
- Output: `keyMetrics.averageRentPerUnit` (monthly dollars per unit)

**Business Use**:
- Quick rent assessment
- Market comparison
- Mixed unit type analysis

---

### 22. Operating Expense per Unit

**Definition**: Annual operating expenses divided by number of units.

**Formula**:
```
Operating Expense per Unit = Operating Expenses ÷ Total Units
```

**Implementation**:
```typescript
// Calculated during metrics generation
const operatingExpensePerUnit = operatingExpenses / this.data.totalUnits;
```

**Data Dictionary Fields**:
- Input: `keyMetrics.operatingExpenses`, `totalUnits`
- Output: `keyMetrics.operatingExpensePerUnit` (annual dollars per unit)

**Typical Range**:
- **Efficient Properties**: $3,000-5,000/unit/year
- **Average**: $5,000-7,000/unit/year
- **High Expenses**: $7,000+/unit/year

**Business Use**:
- Benchmark operating efficiency
- Identify cost reduction opportunities
- Compare similar properties

---

## Expense Components

### 23. Property Tax

**Formula**:
```
Annual Property Tax = Purchase Price × (Property Tax Rate ÷ 100)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:265
const propertyTax = purchasePrice * (propertyTaxRate / 100);
```

**Data Dictionary Fields**:
- Input: `purchasePrice`, `propertyTaxRate`
- Output: Included in `keyMetrics.operatingExpenses`

**Typical Range** (varies by location):
- **Texas**: 1.5-2.5%
- **California**: 1.0-1.5%
- **Florida**: 0.8-1.2%

---

### 24. Insurance

**Formula**:
```
Annual Insurance = Purchase Price × (Insurance Rate ÷ 100)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:266
const insurance = purchasePrice * (insuranceRate / 100);
```

**Data Dictionary Fields**:
- Input: `purchasePrice`, `insuranceRate`
- Output: Included in `keyMetrics.operatingExpenses`

**Typical Range**:
- **Standard**: 0.5-0.8% of property value
- **Coastal/High Risk**: 1.0-2.0%

---

### 25. Property Management

**Formula**:
```
Annual Property Management = Gross Income × (Property Management Rate ÷ 100)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:267
const propertyManagement = grossIncome * (propertyManagementRate / 100);
```

**Data Dictionary Fields**:
- Input: calculated gross income, `propertyManagementRate`
- Output: Included in `keyMetrics.operatingExpenses`

**Typical Range**:
- **Small Properties (2-10 units)**: 8-10% of gross income
- **Mid-Size (10-50 units)**: 6-8%
- **Large (50+ units)**: 4-6%

---

### 26. Maintenance

**Formula**:
```
Annual Maintenance = (Maintenance Cost per Unit × Total Units) × 12
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:270
const maintenance = (maintenanceCostPerUnit || 100) * totalUnits * 12;
```

**Data Dictionary Fields**:
- Input: `maintenanceCostPerUnit`, `totalUnits`
- Output: Included in `keyMetrics.operatingExpenses`

**Typical Range**:
- **Newer Properties (<10 years)**: $50-100/unit/month
- **Mid-Age (10-20 years)**: $100-150/unit/month
- **Older (20+ years)**: $150-250/unit/month

---

### 27. Common Area Utilities

**Formula**:
```
Annual Common Area Utilities = (Electric + Water + Gas + Trash) × 12
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:274-281
const commonAreaTotal = (
  (this.data.commonAreaUtilities.electric || 0) +
  (this.data.commonAreaUtilities.water || 0) +
  (this.data.commonAreaUtilities.gas || 0) +
  (this.data.commonAreaUtilities.trash || 0)
) * 12; // Convert monthly to annual
```

**Data Dictionary Fields**:
- Input: `commonAreaUtilities{electric, water, gas, trash}`
- Output: Included in `keyMetrics.operatingExpenses`

**Components**:
- **Electric**: Hallways, parking, exterior lighting
- **Water**: Common area irrigation, pools
- **Gas**: Common area heating (if applicable)
- **Trash**: Dumpster service for entire property

---

### 28. Capital Expenditures (CapEx)

**Formula**:
```
Annual CapEx = Gross Income × 6%  (default rate)
```

**Implementation**:
```typescript
// MultiFamilyAnalyzer.ts:283-285
const capExRate = 0.06;  // 6% of gross income
const capEx = grossIncome * capExRate;
```

**Data Dictionary Fields**:
- Calculated internally based on gross income
- Output: Included in `keyMetrics.operatingExpenses`

**Industry Approaches**:
1. **Percentage of Income**: 5-10% of gross income
2. **Per-Unit**: $250-300/unit/year (institutional standard)
3. **Replacement Cost**: 1-2% of building replacement cost

**Current Implementation**: 6% of gross income

**Business Note**:
- Newer properties (<10 years): May only need 4%
- Older properties (20+ years): May need 8-10%
- Consider property-age adjustment for enhanced accuracy

---

## Metric Hierarchy

### Foundational Metrics (Everything depends on these)
1. **Gross Income** → Base revenue calculation
2. **Effective Gross Income** → Realistic income (Gross - Vacancy - Credit Loss)
3. **Operating Expenses** → All costs to operate property
4. **NOI** → EGI - Operating Expenses
5. **Cash Flow** → NOI - Debt Service
6. **Total Investment** → Down Payment + Closing Costs + Capital Investments

### Primary Derived Metrics (Direct calculations from foundational)
7. **Cap Rate** → NOI ÷ Purchase Price
8. **Cash-on-Cash Return** → Cash Flow ÷ Total Investment
9. **DSCR** → NOI ÷ Annual Debt Service
10. **Operating Expense Ratio** → Operating Expenses ÷ EGI

### Advanced Metrics (Complex calculations)
11. **IRR** → Time-weighted return (all cash flows)
12. **GRM** → Purchase Price ÷ Gross Income
13. **Debt Yield** → NOI ÷ Loan Amount
14. **Break-Even Occupancy** → (OpEx + Debt Service) ÷ Gross Income

### Per-Unit Normalizations
15. **Price per Unit** → Purchase Price ÷ Units
16. **NOI per Unit** → NOI ÷ Units
17. **Cash Flow per Unit** → Cash Flow ÷ Units
18. **Average Rent per Unit** → Gross Income ÷ Units ÷ 12

### Property-Specific Metrics
19. **Unit Mix Efficiency** → Rent optimization analysis
20. **Economic Vacancy Rate** → Total income loss (vacancy + below-market)
21. **Common Area Expense Ratio** → Common utilities per sq ft

---

## Industry Benchmarks

### Cap Rate by Property Class (2025)
| Property Class | Cap Rate Range | Description |
|----------------|----------------|-------------|
| Class A | 4-6% | New construction, best locations, institutional quality |
| Class B | 5-7% | Well-maintained, good locations, stable tenants |
| Class C | 7-10% | Older properties, workforce housing, higher risk |

### DSCR Requirements by Lender (2025)
| Lender Type | Minimum DSCR | Preferred DSCR |
|-------------|--------------|----------------|
| Fannie Mae | 1.25x | 1.30x+ |
| Freddie Mac | 1.20x | 1.25x+ |
| HUD 221(d)(4) Market-Rate | 1.18x | 1.25x+ |
| HUD 221(d)(4) Affordable | 1.15x | 1.20x+ |
| HUD 221(d)(4) Subsidized | 1.11x | 1.15x+ |
| Commercial Banks | 1.20-1.25x | 1.30x+ |

### Operating Expense Ratio Benchmarks
| Property Type | Good OER | Average OER | High OER |
|---------------|----------|-------------|----------|
| Small MF (2-10 units) | 35-40% | 40-50% | 50%+ |
| Mid-Size (10-50 units) | 35-45% | 45-55% | 55%+ |
| Large (50+ units) | 30-40% | 40-50% | 50%+ |

### Break-Even Occupancy Benchmarks
| Risk Level | BEO Range | Safety Margin |
|------------|-----------|---------------|
| Excellent | <60% | 35%+ cushion |
| Good | 60-75% | 20-35% cushion |
| Moderate | 75-85% | 10-20% cushion |
| High Risk | >85% | <10% cushion |

### Cash-on-Cash Return Targets (2025)
| Performance | CoC Range | Investor Type |
|-------------|-----------|---------------|
| Outstanding | 15%+ | Aggressive, higher risk |
| Excellent | 12-15% | Value-add investors |
| Good | 8-12% | Stabilized properties |
| Below Target | <8% | Likely underperforming |

### GRM Benchmarks by Market
| Market Tier | Typical GRM | Interpretation |
|-------------|-------------|----------------|
| Primary Markets (NYC, SF, LA) | 15-20 | Lower yields, appreciation play |
| Secondary Markets (Dallas, Atlanta) | 10-15 | Moderate yields |
| Tertiary Markets (Midwest) | 8-12 | Higher yields, less appreciation |
| **Residential Multifamily Standard** | **4-7** | Our platform focus |

---

## When to Use Each Metric

### Quick Property Screening (30 seconds)
1. **GRM** - Is price reasonable for income?
2. **Cap Rate** - What's the return without financing?
3. **Price per Unit** - Market comparison

### Pre-Offer Analysis (5 minutes)
1. **GRM** - Initial valuation check
2. **Cap Rate** - Unlevered return
3. **Cash-on-Cash Return** - Levered return on cash invested
4. **DSCR** - Can I get financing?
5. **NOI per Unit** - Is each unit profitable?

### Full Underwriting (1 hour)
1. **NOI** - Operating profitability
2. **Cash Flow** - Actual money in pocket
3. **Cap Rate** - Property valuation
4. **DSCR** - Lender qualification
5. **Debt Yield** - Loan sizing
6. **Break-Even Occupancy** - Risk assessment
7. **IRR** - Total return potential
8. **Cash-on-Cash Return** - Annual yield
9. **Economic Vacancy Rate** - Value-add opportunity
10. **Unit Mix Efficiency** - Rent optimization potential

### Property Management (Ongoing)
1. **Economic Vacancy Rate** - Are we leaving money on table?
2. **Operating Expense Ratio** - Are expenses in line?
3. **Average Rent per Unit** - Market rent tracking
4. **Cash Flow per Unit** - Per-unit profitability

### Value-Add Analysis
1. **Economic Vacancy Rate** - Income upside potential
2. **Unit Mix Efficiency** - Rent optimization opportunity
3. **Rent per Square Foot** - Compare to market comps
4. **Operating Expense Ratio** - Efficiency improvements

### Lender Presentation
1. **DSCR** - Primary underwriting metric
2. **Debt Yield** - Loan sizing metric
3. **Break-Even Occupancy** - Risk metric
4. **NOI** - Cash flow coverage
5. **Cap Rate** - Valuation validation

### Investment Committee Presentation
1. **IRR** - Total return over hold period
2. **Cash-on-Cash Return** - Annual yield
3. **Cap Rate** - Entry and exit pricing
4. **DSCR** - Financing qualification
5. **Economic Vacancy Rate** - Upside potential
6. **Break-Even Occupancy** - Downside protection

---

## Phase 1: Building Type Impact on Metrics (November 2025)

**Implementation Status**: ✅ **PRODUCTION READY**

**Scope**: Phase 1 Commercial MF (5+ units) - 3 building types

### Building Type Classification

| Building Type | Description | Typical Units | Stories | Key Features |
|---------------|-------------|---------------|---------|--------------|
| **GARDEN** | Garden-style apartments | 5-50 units | 2-3 stories | Outdoor corridors, surface parking, no elevator |
| **MID_RISE** | Mid-rise with elevator | 30-150 units | 4-9 stories | Elevator required, structured parking, higher density |
| **COMPLEX** | Multi-building complex | 25-200+ units | 2-3 stories | Multiple garden-style buildings, shared amenities |

---

### Operating Expense Impact by Building Type

**Business Reality**: Operating expenses vary 2-3x based on building type.

| Building Type | OpEx Range (per unit/month) | Key Drivers |
|---------------|------------------------------|-------------|
| **GARDEN** | $250-400 | Lower insurance (no elevator), simpler maintenance, moderate landscaping |
| **MID_RISE** | $450-700 | Elevator maintenance ($1,200-2,000/month), higher insurance, common area HVAC |
| **COMPLEX** | $300-500 | Larger landscaping, parking lot costs, shared amenities (pool, clubhouse) |

**Validation Rules** (MultiFamilyAnalyzer.ts):
- Operating expenses outside typical range generate **MEDIUM severity** warnings
- Warnings include financial impact and recommendations
- Non-blocking (user can proceed with analysis)

**Example Warning** (GARDEN building with low expenses):
```
Severity: MEDIUM
Category: OPERATING_EXPENSES
Message: Operating expenses ($200/unit/month) appear low for GARDEN building
Impact: Actual expenses may be $4,800 higher annually
Recommendation: Typical range for GARDEN: $250-400/unit/month. Verify all expense categories included.
Affected Metric: Cash Flow, NOI
```

---

### Cap Rate Target Adjustments by Building Type

**Implementation**: MFDecisionEngine.ts - `getTargetCapRate()` method

**Formula**:
```
Target Cap Rate = Base Market Rate + Building Type Adjustment
```

**Building Type Adjustments**:

| Building Type | Adjustment | Reasoning |
|---------------|-----------|-----------|
| **GARDEN** | 0 bps | Baseline (most common, 60% of market) |
| **MID_RISE** | -150 bps | Institutional buyers compress cap rates (better rent growth, lower vacancy, financing advantages) |
| **COMPLEX** | 0 bps | Baseline (similar to garden, just multi-building) |

**Market-Specific Examples**:

| Market Tier | Example City | GARDEN Target | MID_RISE Target | COMPLEX Target |
|-------------|--------------|---------------|-----------------|----------------|
| A-Class (Premium) | Dallas, Austin | 5.0% | 3.5% | 5.0% |
| B-Class (Balanced) | Phoenix, Tampa | 7.5% | 6.0% | 7.5% |
| C-Class (Cash Flow) | Memphis, Birmingham | 10.0% | 8.5% | 10.0% |

**Impact on Walk-Away Price**:

Walk-Away Price = NOI / Target Cap Rate

**Example** (Phoenix B-Class Market, $100K NOI):
- GARDEN: $100K / 0.075 = **$1,333,333** walk-away price
- MID_RISE: $100K / 0.06 = **$1,666,667** walk-away price (+$333K due to institutional appeal)
- COMPLEX: $100K / 0.075 = **$1,333,333** walk-away price

**Why MID_RISE Gets Lower Cap Rates**:
1. **Rent Growth**: Higher density urban locations = better rent growth (2-4% vs 1-2%)
2. **Vacancy**: Elevator buildings in urban cores = lower vacancy (3-5% vs 5-8%)
3. **Institutional Demand**: Pension funds, REITs prefer elevator buildings = cap rate compression
4. **Financing**: Better loan terms from Fannie Mae/Freddie Mac = higher valuations
5. **Exit Strategy**: Easier to sell to institutional buyers = more liquid asset

---

### Metric Differences by Building Type

**Cap Rate** (NOI / Purchase Price × 100):
- **GARDEN**: Match market baseline (5-10% depending on market tier)
- **MID_RISE**: 100-150 bps lower than garden (institutional compression)
- **COMPLEX**: Match garden baseline

**DSCR** (NOI / Annual Debt Service):
- **All building types**: Same calculation, but MID_RISE may achieve higher DSCR due to lower cap rate = lower debt
- **Lender Minimums**: Same across all types (1.25x Fannie Mae, 1.20x Freddie Mac)

**Operating Expense Ratio** ((OpEx / EGI) × 100):
- **GARDEN**: 35-45% (lower expenses, moderate income)
- **MID_RISE**: 40-50% (higher expenses, but higher rents offset partially)
- **COMPLEX**: 35-45% (similar to garden)

**Break-Even Occupancy** ((OpEx + Debt Service) / Gross Income × 100):
- **GARDEN**: 60-75% (baseline)
- **MID_RISE**: 55-70% (lower due to higher income, institutional financing)
- **COMPLEX**: 60-75% (baseline)

**Gross Rent Multiplier** (Purchase Price / Annual Gross Income):
- **GARDEN**: 4-7 (baseline)
- **MID_RISE**: 5-9 (higher due to institutional demand, better location)
- **COMPLEX**: 4-7 (baseline)

---

### When Building Type Matters Most

**High Impact Scenarios** (Building type significantly affects decision):

1. **Walk-Away Price Calculation**:
   - MID_RISE adjustment can change walk-away price by 20-30%
   - Example: $100K NOI → $1.33M (GARDEN) vs $1.67M (MID_RISE)
   - **Decision Impact**: Property that's PASS for GARDEN may be NEGOTIATE for MID_RISE

2. **Operating Expense Validation**:
   - $300/unit/month is LOW for MID_RISE but NORMAL for GARDEN
   - Prevents users from underestimating expenses by $50-200K/year
   - **Decision Impact**: Affects cash flow projections and investment verdict

3. **Exit Strategy Planning**:
   - MID_RISE = easier institutional exit (pension funds, REITs)
   - GARDEN/COMPLEX = local/regional investor exit
   - **Decision Impact**: Affects hold period and liquidity assumptions

**Low Impact Scenarios** (Building type doesn't matter much):

1. **DSCR Calculation**: Same formula regardless of building type
2. **Cash-on-Cash Return**: Based on actual cash flow, not building type
3. **IRR**: Based on actual projections, building type only affects inputs

---

### Backward Compatibility

**If buildingType NOT provided**:
- ✅ Cap rate uses base market rate only (no adjustment)
- ✅ Operating expense validation skipped (no warnings)
- ✅ All other calculations work normally
- ✅ Existing MF analyses continue to function

**Migration Path**:
- Phase 1: 3 building types (GARDEN, MID_RISE, COMPLEX)
- Phase 2 (Future): Add HIGH_RISE, MIXED_USE if needed
- Current 2-4 unit properties: Redirect to SFR Analyzer (better accuracy)

---

### Implementation References

**Backend Files**:
- `propertyTypes.ts` line 88 - Building type enum
- `MultiFamilyAnalyzer.ts` line 144-199 - Operating expense validation
- `MFDecisionEngine.ts` line 333-358 - Cap rate adjustments
- `validation.ts` - ValidationWarning interface

**Frontend Files** (Pending - Steps 7-12):
- `MFAddressStep.tsx` - Building type selector
- `AnalysisResults.tsx` - Validation warnings display
- `mfDataAdapter.ts` - Building type validation

**Test Files**:
- `MFPhase1-BuildingTypes.test.ts` - 18 tests (15 passing)
- Cap rate tests: 9 scenarios (3 types × 3 markets)
- Validation tests: 6 scenarios (low/normal/high for GARDEN/MID_RISE)

---

## Related Resources

### Platform Documentation
- [MF Metrics Business Validation](./MF_METRICS_BUSINESS_VALIDATION.md) - Industry validation report
- [Data Dictionary](./DATA_DICTIONARY.md) - All data fields
- [SFR vs MF Isolation](./SFR_VS_MF_ISOLATION.md) - Property type differences
- [Financial Calculations Architecture](./FINANCIAL_CALCULATIONS_ARCHITECTURE.md) - Calculation details

### Industry Standards Referenced
- Fannie Mae Multifamily Underwriting
- Freddie Mac Multifamily Guidelines
- HUD 221(d)(4) Loan Requirements
- Wall Street Prep Real Estate Financial Modeling
- PropertyMetrics Commercial Real Estate Analysis
- Multifamily Loans Industry Standards

### Technical Implementation
- `MultiFamilyAnalyzer.ts` - Full implementation
- `FinancialCalculations.ts` - Shared calculation utilities
- `propertyTypes.ts` - TypeScript interfaces

---

**Document Maintenance**:
- Review quarterly for market condition changes
- Update benchmarks annually (January)
- Validate formulas against industry standards annually
- Next review: January 2026

**Questions or Corrections**: Contact technical team or Business Expert validator
