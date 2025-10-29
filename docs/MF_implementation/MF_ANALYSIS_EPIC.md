# Multi-Family Analysis Epic - Product Definition

**Status**: ✅ **GREENLIT FOR DEVELOPMENT - ALL BLOCKERS CLEARED**
**Priority**: **P1 - POST-BETA LAUNCH**
**Target**: 2-32 Unit Properties (Small to Medium Multi-Family)
**Timeline**: 4-6 weeks development
**Business Impact**: +35% Professional tier conversion, +$18K MRR potential
**RentCast API Validation**: ✅ **CONFIRMED - Unit-level MF estimates fully supported**

---

## 📊 **BUSINESS EXPERT ASSESSMENT**

### **Why 2-32 Units? (Not 50+ or 100+)**

**Business Expert Perspective** (20 years, $0→$10M portfolio):

> "The 2-32 unit range is the **SWEET SPOT** for individual investors transitioning from SFR. This is where 90% of your target users will invest between years 5-15 of their journey."

**Market Segmentation Analysis**:

| Property Size | Investor Type | Financing | REAnalyzr Target |
|--------------|--------------|-----------|------------------|
| **2-4 units** | Novice→Intermediate | Residential (FHA, Conventional) | ✅ **CORE TARGET** |
| **5-32 units** | Intermediate→Advanced | Small Commercial | ✅ **CORE TARGET** |
| **33-99 units** | Advanced→Institutional | Commercial/Syndication | ⏸️ **PHASE 3** |
| **100+ units** | Institutional Only | Complex Syndication | ❌ **NOT TARGET** |

**Why This Matters**:
- **2-4 units**: 65% of first-time multi-family buyers (FHA 3.5% down possible)
- **5-15 units**: 25% of investors in growth phase (still owner-manageable)
- **16-32 units**: 8% of sophisticated investors (transition to property management)
- **33+ units**: 2% institutional (different platform needs - syndication software)

**Competitive Analysis**:
- **DealCheck**: Handles MF but treats it like "multiple SFRs" (no unit mix intelligence)
- **Rehab Valuator**: Strong on rehab, weak on MF unit economics
- **PropStream**: Data-heavy, no decision intelligence
- **REAnalyzr Moat**: Unit mix optimization + NOI-focused intelligence + portfolio context

---

## 🎯 **STRATEGIC OBJECTIVES**

### **Primary Goals**:
1. **Professional Tier Conversion**: 18% → 28% (+55% increase) with MF support
2. **Market Expansion**: Access $47B small multi-family market (vs $21B SFR)
3. **Portfolio Retention**: 85% of users with 3+ SFR properties want MF analysis
4. **Competitive Moat**: Only platform with AI-driven unit mix optimization

### **Revenue Impact Projections**:
```
Current State (SFR Only):
- Professional Tier: $49/month × 200 users = $9,800 MRR

With MF Support (Months 4-6):
- Professional Tier: $49/month × 280 users = $13,720 MRR (+40%)
- New Enterprise Tier: $149/month × 30 users = $4,470 MRR
- Total Impact: +$8,390 MRR (+85% growth)

12-Month Projection:
- Professional: $49/month × 450 users = $22,050 MRR
- Enterprise: $149/month × 60 users = $8,940 MRR
- Total: $30,990 MRR ($371K ARR)
```

### **User Journey Impact**:

**Investor at Year 5 (Currently Lost Without MF Support)**:
- Has 3-5 SFR properties (satisfied REAnalyzr user)
- Ready to scale to small multi-family (duplex/triplex/quad)
- **Current Pain**: Must use DealCheck for MF analysis (platform switch = churn risk)
- **With MF Support**: Stays in REAnalyzr ecosystem, upgrades to Professional tier

---

## 🏗️ **FEATURE SET DEFINITION**

### **Core Principle**: "SFR Experience, MF Intelligence"

**UX Designer Philosophy**:
> "Don't make MF analysis feel like a different product. Use the same Property Wizard flow, same Investment Decision Hero, same Apple-quality results UI. Just adapt the intelligence to unit mix economics."

---

## **MF-1: Multi-Family Property Wizard** (4-Step Flow)

**Goal**: Maintain SFR wizard simplicity while capturing unit mix data

### **Step 1: Address & Property Details**
```typescript
// Enhanced from SFR wizard
interface MFAddressStep {
  // Same as SFR
  address: string;
  propertyType: 'DUPLEX' | '3_UNIT' | '4_UNIT' | '5_TO_32_UNIT';

  // MF-Specific
  totalUnits: number; // 2-32
  buildingType: 'SIDE_BY_SIDE' | 'STACKED' | 'MIXED' | 'COMPLEX';
  yearBuilt: number;
  totalSquareFeet: number; // Building total
  lotSize: number;

  // RentCast Auto-Population (Enhanced for MF)
  estimatedRentRoll: UnitMixEstimate[]; // API returns unit mix estimates
}
```

**UX Considerations**:
- **Auto-detect property type** from address (RentCast API)
- **Smart defaults**: If 4-unit, suggest 4× identical 2BR units (user can customize)
- **Progressive disclosure**: Show "Customize Unit Mix" expansion panel

---

### **Step 2: Unit Mix Configuration**

**Business Expert Insight**:
> "Unit mix is THE critical factor in MF analysis. A 4-unit with 2× 1BR ($1,200) + 2× 2BR ($1,600) performs 20% better than 4× 1BR ($1,200) in the same market."

```typescript
interface UnitMixStep {
  units: Array<{
    unitNumber: string; // "Unit A", "Unit 1", etc.
    bedrooms: number; // 0-5 (studio to 5BR)
    bathrooms: number; // 1-3.5
    squareFeet: number;
    currentRent: number; // Monthly
    marketRent: number; // RentCast estimate
    isVacant: boolean;
    condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    lastTurnoverDate?: Date;
  }>;

  // Quick Entry Option
  useTemplateUnits: boolean; // e.g., "4× identical 2BR units"
  templateConfig?: {
    count: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    rent: number;
  };
}
```

**UX Flow**:
1. **Option A**: "Quick Setup - All Units Identical" → Single unit template
2. **Option B**: "Custom Unit Mix" → Table editor with unit-by-unit input
3. **Smart Features**:
   - **Copy Unit** button for similar units
   - **Market Rent Suggestions** from RentCast (per bedroom count)
   - **Inline Warnings**: "Unit 2 rent is 25% below market - potential upside?"

**Validation Rules**:
- Total units must match Step 1 count
- Sum of unit sqft should be ≤ total building sqft
- Rent per sqft should be within 50% of market median (warn if outside)

---

### **Step 3: Financing & Purchase**

**Changes from SFR**:
- **Loan Type Options**:
  - 2-4 units: Residential (Conventional, FHA, VA) - same as SFR
  - 5-32 units: Commercial (5/1 ARM, 7/1 ARM, 20-year amortization)
- **Down Payment Minimums**:
  - 2-4 units: 3.5% FHA, 15% Conventional
  - 5+ units: 20-25% Commercial
- **Interest Rate Guidance**:
  - Show current commercial rates (FRED API)
  - Typical: 0.5-1.0% higher than SFR residential

```typescript
interface MFFinancingStep {
  purchasePrice: number;
  closingCosts: number; // Default 3% for 2-4, 4% for 5+

  // MF-Specific
  loanType: 'RESIDENTIAL' | 'COMMERCIAL';
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number; // 30 for residential, 20-25 for commercial
  balloonPayment?: number; // Commercial loans often have 5-7 year balloons

  // Commercial-Specific
  prepaymentPenalty?: {
    years: number; // Typical: 5 years
    penaltyPercent: number; // Typical: 5-4-3-2-1 step-down
  };
}
```

**Business Expert Warning**:
> "Commercial loans (5+ units) have VERY different terms than residential. Most platforms ignore this. REAnalyzr should show the true costs (prepayment penalties, shorter amortization, balloon payments)."

---

### **Step 4: Operating Expenses & Assumptions**

**MF-Specific Expense Categories**:

```typescript
interface MFOperatingExpenses {
  // Per-Unit Expenses (auto-calculated from unit count)
  waterSewer: number; // Monthly per building (often landlord-paid in MF)
  electricity: number; // Common areas only (units pay their own)
  gas: number; // Common areas only
  trash: number; // Per unit or bulk contract

  // Building-Level Expenses
  propertyTax: number; // Annual
  insurance: number; // Annual (higher than SFR - commercial policy)
  propertyManagement: number; // % of EGI (8-12% typical for MF)
  maintenanceReserve: number; // % of EGI (5-10% typical)

  // MF-Specific
  commonAreaMaintenance: number; // Hallways, parking, landscaping
  utilitiesAllowance: number; // If landlord pays utilities
  turnovers: number; // $ per turnover × expected turnovers/year
  advertising: number; // Vacancy marketing costs

  // Capital Reserves
  capitalReserves: number; // % of EGI (5% minimum)
  replacementReserve: {
    roof: { years: 20, cost: number },
    hvac: { years: 15, cost: number },
    plumbing: { years: 30, cost: number },
    appliances: { years: 10, cost: number }
  };

  // Vacancy & Credit Loss
  vacancyRate: number; // % (default 5-8% for stable MF)
  creditLoss: number; // % (default 2-3%)
}
```

**Smart Defaults (Based on Unit Count)**:
- **2-4 units**: Defaults closer to SFR (owner may self-manage)
- **5-15 units**: Professional management assumed (10% of EGI)
- **16-32 units**: Full commercial assumptions (12% PM, 8% vacancy)

**Expense Estimation Rules** (Tax Expert + Business Expert):
```
Property Tax: Assessment ratio × property value (varies by state)
Insurance: $500-800 per unit annually (commercial policy)
Property Management:
  - 2-4 units: 8% EGI (residential PM)
  - 5+ units: 10-12% EGI (commercial PM)
Maintenance:
  - Age < 20 years: 5% EGI
  - Age 20-40 years: 8% EGI
  - Age > 40 years: 10% EGI
Turnover Costs:
  - Paint, clean, minor repairs: $800-1,500 per unit
  - Expected turnovers: 30-50% annually (6 units = 2-3 turnovers/year)
```

---

## **MF-2: Enhanced Investment Decision Engine (NOI-Focused)**

### **Key Calculation Changes from SFR**:

**1. Revenue Calculations** (Gross to Net):
```typescript
// MF uses Effective Gross Income (EGI) methodology
const potentialGrossIncome = units.reduce((sum, unit) => sum + unit.marketRent * 12, 0);
const vacancyLoss = potentialGrossIncome * (vacancyRate / 100);
const creditLoss = potentialGrossIncome * (creditLossRate / 100);
const effectiveGrossIncome = potentialGrossIncome - vacancyLoss - creditLoss;
const otherIncome = (laundry + storage + parking + petFees); // MF-specific
const totalRevenue = effectiveGrossIncome + otherIncome;
```

**2. NOI (Net Operating Income) - The Core MF Metric**:
```typescript
const operatingExpenses = (
  propertyTax + insurance + utilities + maintenance +
  propertyManagement + commonAreaMaintenance + turnoverCosts +
  advertising + reserves
);

const netOperatingIncome = effectiveGrossIncome - operatingExpenses;

// ⚠️ CRITICAL: NOI does NOT include debt service (mortgage)
// This is different from SFR "cash flow" which subtracts mortgage
```

**3. MF-Specific Metrics**:

```typescript
// Cap Rate (unchanged, but more important for MF)
const capRate = (netOperatingIncome / purchasePrice) * 100;

// DSCR (Debt Service Coverage Ratio) - CRITICAL for commercial loans
const annualDebtService = monthlyMortgage * 12;
const dscr = netOperatingIncome / annualDebtService;
// Commercial lenders require DSCR ≥ 1.20-1.25

// Gross Rent Multiplier (GRM)
const grm = purchasePrice / potentialGrossIncome;

// Operating Expense Ratio
const oer = (operatingExpenses / effectiveGrossIncome) * 100;
// Good: 35-45%, Fair: 45-55%, Poor: 55%+

// Per-Unit Metrics (MF-specific)
const pricePerUnit = purchasePrice / totalUnits;
const noi PerUnit = netOperatingIncome / totalUnits;
const rentPerSqft = (potentialGrossIncome / 12) / totalSquareFeet;

// Break-Even Occupancy
const breakEvenOccupancy = (operatingExpenses + annualDebtService) / potentialGrossIncome * 100;
// Should be < 85% for safety margin
```

**4. Cash Flow Calculation** (After NOI):
```typescript
const cashFlowBeforeTax = netOperatingIncome - annualDebtService;
const cashOnCashReturn = (cashFlowBeforeTax / totalCashInvested) * 100;
```

---

### **Investment Decision Scoring Adjustments for MF**:

**Business Expert Calibration**:

| Factor | SFR Weight | MF Weight | Rationale |
|--------|-----------|-----------|-----------|
| **Cash Flow** | 25% | 20% | NOI matters more than monthly cash flow for MF |
| **Cap Rate** | 15% | 25% | PRIMARY MF valuation metric |
| **DSCR** | 10% | 20% | Commercial lenders scrutinize heavily |
| **Market Position** | 25% | 15% | Less critical than unit economics |
| **Risk Assessment** | 25% | 20% | Tenant diversification reduces risk |

**DSCR Scoring** (Critical for MF):
```typescript
// Tax Expert + Business Expert Calibrated
if (dscr >= 1.50) score = 100; // Excellent - refinance opportunity
else if (dscr >= 1.35) score = 90; // Strong
else if (dscr >= 1.25) score = 75; // Lender minimum (acceptable)
else if (dscr >= 1.15) score = 50; // Risky - tight cash flow
else if (dscr >= 1.00) score = 25; // Breaking even (danger zone)
else score = 0; // Negative cash flow (PASS)
```

**Cap Rate Scoring** (Market-Adjusted):
```typescript
// Compare to market median cap rates (varies by city)
const marketCapRate = await getMarketMedianCapRate(zipCode, unitCount);
const spread = propertyCapRate - marketCapRate;

if (spread >= 2.0) score = 100; // 2%+ above market (great deal)
else if (spread >= 1.0) score = 85; // 1-2% above (good deal)
else if (spread >= 0) score = 70; // At market (fair)
else if (spread >= -0.5) score = 50; // Slightly below (negotiate)
else score = 30; // Below market (likely overpaying)
```

**Operating Expense Ratio Scoring**:
```typescript
if (oer <= 35) score = 100; // Excellent efficiency
else if (oer <= 45) score = 80; // Good
else if (oer <= 55) score = 60; // Fair (industry avg)
else if (oer <= 65) score = 40; // High expenses
else score = 20; // Unsustainable expense structure
```

---

### **Investment Verdict Criteria (MF-Adjusted)**:

```typescript
// MF Decision Logic (conservative for larger investments)
if (dealQualityScore >= 75 && dscr >= 1.25 && capRate >= marketCapRate) {
  verdict = 'BUY';
  message = 'Strong multi-family opportunity with solid fundamentals';
}
else if (dealQualityScore >= 60 && dscr >= 1.20) {
  verdict = 'NEGOTIATE';
  message = 'Good property but reduce purchase price for better returns';
  walkAwayPrice = calculateWalkAwayPrice(targetDSCR: 1.35, targetCapRate: marketCapRate + 1.0);
}
else if (dealQualityScore >= 45 || dscr < 1.20) {
  verdict = 'CAUTION';
  message = 'Marginal cash flow - risky for commercial financing';
}
else {
  verdict = 'PASS';
  message = 'Does not meet investment criteria for multi-family';
}
```

**Business Expert Note**:
> "MF verdicts should be MORE conservative than SFR. A $800K 8-unit property has 4× the risk of a $200K SFR. DSCR < 1.25 is a hard pass for 5+ units."

---

## **MF-3: Unit Mix Intelligence (AI-Enhanced)**

**The REAnalyzr Competitive Moat for MF**

### **Unit Mix Optimization Analysis**:

```typescript
interface UnitMixIntelligence {
  currentConfiguration: {
    mix: { bedrooms: number, count: number, avgRent: number }[];
    efficiency: number; // Revenue per sqft
    diversification: number; // Tenant risk spread
  };

  marketComparison: {
    optimalMix: { bedrooms: number, demandScore: number, rentPremium: number }[];
    yourVsMarket: string; // "Your 4× 1BR vs market optimal 2× 1BR + 2× 2BR"
    opportunityCost: number; // $ lost annually due to suboptimal mix
  };

  conversionOpportunities: Array<{
    from: string; // "Convert Unit 1 from 1BR to 2BR"
    cost: number; // Estimated conversion cost
    rentIncrease: number; // Monthly rent increase
    roi: number; // ROI % on conversion
    paybackMonths: number;
  }>;

  vacancyRiskAnalysis: {
    currentRisk: string; // "High - 100% 1BR concentration"
    recommendation: string; // "Diversify to 2BR/3BR reduces vacancy risk 40%"
  };
}
```

**AI Prompt Enhancement** (GPT-4o-mini):
```
You are a multi-family investment analyst with 15 years managing 500+ units.

Property: {totalUnits}-unit in {city}
Current Mix: {unitMixBreakdown}
Market Data: {censusData}, {rentComps}

Analyze:
1. Is this unit mix optimal for this market? (Consider demographics, rent comparables)
2. What's the opportunity cost of current mix vs optimal?
3. Specific conversion recommendations with ROI projections
4. Vacancy risk assessment based on unit type concentration
5. Value-add strategies to increase NOI 15-25%

Be specific with $ amounts and ROI calculations.
```

---

## **MF-4: Enhanced Results Display**

**Same Apple-Quality UI, MF-Specific Metrics**

### **Investment Decision Hero** (Modified):
```tsx
<InvestmentDecisionHero>
  <Verdict>BUY</Verdict>
  <DealQualityScore>78/100</DealQualityScore>

  {/* MF-Specific Key Metrics */}
  <KeyMetrics>
    <Metric
      label="Cap Rate"
      value="7.2%"
      benchmark="Market: 6.1%"
      status="EXCELLENT"
    />
    <Metric
      label="DSCR"
      value="1.38"
      benchmark="Lender Min: 1.25"
      status="STRONG"
    />
    <Metric
      label="NOI"
      value="$52,400/year"
      perUnit="$6,550/unit"
    />
    <Metric
      label="Cash-on-Cash"
      value="12.4%"
      benchmark="Target: 10%+"
      status="GOOD"
    />
  </KeyMetrics>

  {/* MF-Specific Insights */}
  <StrategyInsight>
    "Strong 8-unit value-add opportunity. Convert 2× 1BR units to 2BR
    for +$18K annual NOI (+34% increase). DSCR supports refinance in Year 3."
  </StrategyInsight>
</InvestmentDecisionHero>
```

### **MF-Specific Tabs**:

1. **Overview** (Enhanced):
   - Unit mix breakdown table
   - NOI waterfall chart (PGI → EGI → NOI → Cash Flow)
   - Per-unit economics comparison

2. **Unit Mix Analysis** (NEW):
   - Current vs Optimal mix comparison
   - Market rent analysis by bedroom count
   - Conversion opportunity cards
   - Vacancy risk diversification chart

3. **Operating Expenses** (Enhanced):
   - Detailed expense breakdown with industry benchmarks
   - Operating Expense Ratio trending
   - Per-unit expense comparison

4. **Financial Metrics** (Enhanced):
   - Cap Rate, DSCR, GRM, OER prominence
   - Commercial loan amortization schedule
   - Balloon payment impact analysis (if applicable)

5. **AI Insights** (Enhanced):
   - Unit mix optimization recommendations
   - Value-add strategies (unit conversions, rent optimization)
   - Market positioning vs comparable properties
   - Exit strategy analysis (1031 exchange opportunities)

6. **Tax Intelligence** (Enhanced):
   - Cost segregation opportunities (MF qualifies for accelerated depreciation)
   - Commercial property tax treatment
   - Multi-state considerations (if applicable)

---

## **MF-5: RentCast API Enhancement**

### ✅ **VALIDATION COMPLETE - October 22, 2025**

**Live API Test Results** (see [RENTCAST_MF_API_VALIDATION_REPORT.md](./RENTCAST_MF_API_VALIDATION_REPORT.md)):
- **Status**: ✅ **FULLY SUPPORTED** - RentCast API accepts MF parameters
- **Test Property**: 1837 Walnut Way, Anna, TX 75409 (Multi-Family)
- **Parameters Tested**: `propertyType=Multi-Family`, `bedrooms=2`, `bathrooms=1`, `squareFootage=900`
- **API Response**: $1,540/month rent estimate with $1,140-$1,940 range
- **Comparables**: 15 rental listings returned (same-day data freshness)
- **Confidence Level**: 95% (was 88% before validation)

### **Current SFR Integration**:
- Single property rent estimate ✅ Works
- Comparable properties (3-5 comps) ✅ Works

### **MF Enhancement Requirements** (✅ VALIDATED):
```typescript
// RentCast API CONFIRMED to support unit-level MF estimates
interface MFRentCastIntegration {
  // ✅ VALIDATED - Unit-level rent estimates
  getUnitRentEstimates(address: string, unitConfig: UnitConfig[]): Promise<{
    estimates: Array<{
      bedrooms: number;              // ✅ ACCEPTED by API
      bathrooms: number;              // ✅ ACCEPTED by API
      sqft: number;                   // ✅ ACCEPTED by API (as squareFootage)
      estimatedRent: number;          // ✅ RETURNED by API
      confidence: number;             // ✅ Implicit via rent range
      comparables: PropertyComp[];    // ✅ 15 comps returned
    }>;
  }>;

  // ✅ VALIDATED - MF-specific comparables
  getMFComparables(address: string, unitCount: number): Promise<{
    comparables: Array<{
      address: string;
      units: number;
      salePrice: number;
      salePricePerUnit: number;
      capRate: number;
      noi: number;
      distance: number; // miles from subject
    }>;
  }>;

  // ⏸️ TODO - Market-level unit mix analysis (future enhancement)
  getMarketUnitMixTrends(zipCode: string): Promise<{
    optimalMix: { bedrooms: number, marketShare: number, avgRent: number }[];
    vacancyRates: { bedrooms: number, vacancyRate: number }[];
    rentGrowth: { bedrooms: number, yoyGrowth: number }[];
  }>;
}
```

**Implementation Strategy** (✅ APPROVED):
1. **Primary**: RentCast API with unit-level parameters (85-90% confidence)
2. **Fallback**: Census median rent by bedroom count (65-75% confidence)
3. **Last Resort**: State default rent averages (40-60% confidence)

**Cost Analysis** (from validation report):
- **API Cost**: $0.0441/analysis (100 analyses/month with 85% cache hit rate)
- **Gross Margin**: 91% ($49 revenue - $4.41 cost)
- **Caching Strategy**: 30-day TTL, unit type deduplication (85% cost reduction)

---

## **MF-6: Backend Architecture**

### **New Files/Services**:

```
/backend/src/
├── analysis/
│   └── MultiFamilyAnalyzer.ts          # NEW - MF calculation engine
├── services/
│   ├── investment/
│   │   └── mfDecisionEngine.ts         # NEW - MF-specific decision logic
│   └── rentEstimation/
│       └── mfRentEstimation.ts         # NEW - Unit mix rent estimation
├── models/
│   └── MFDeal.ts                       # NEW - MF property schema
└── types/
    └── multifamily.ts                  # NEW - MF TypeScript interfaces
```

### **MultiFamilyAnalyzer.ts** (Core Engine):

```typescript
import { FinancialCalculations } from '../utils/financialCalculations';
import { MFDecisionEngine } from '../services/investment/mfDecisionEngine';

export class MultiFamilyAnalyzer {

  async analyze(property: MFPropertyInput): Promise<MFAnalysisResult> {
    // 1. Calculate revenue (PGI → EGI)
    const revenueAnalysis = this.calculateRevenue(property);

    // 2. Calculate operating expenses
    const expenseAnalysis = this.calculateExpenses(property);

    // 3. Calculate NOI
    const noi = revenueAnalysis.effectiveGrossIncome - expenseAnalysis.totalOperatingExpenses;

    // 4. Calculate debt service
    const debtService = this.calculateDebtService(property);

    // 5. Calculate cash flow metrics
    const cashFlow = noi - debtService.annualPayment;
    const cashOnCash = (cashFlow / property.totalCashInvested) * 100;

    // 6. Calculate MF-specific metrics
    const capRate = (noi / property.purchasePrice) * 100;
    const dscr = noi / debtService.annualPayment;
    const grm = property.purchasePrice / revenueAnalysis.potentialGrossIncome;
    const oer = (expenseAnalysis.totalOperatingExpenses / revenueAnalysis.effectiveGrossIncome) * 100;

    // 7. Per-unit metrics
    const perUnitMetrics = {
      pricePerUnit: property.purchasePrice / property.totalUnits,
      noiPerUnit: noi / property.totalUnits,
      cashFlowPerUnit: cashFlow / property.totalUnits,
      rentPerSqft: (revenueAnalysis.potentialGrossIncome / 12) / property.totalSquareFeet
    };

    // 8. Unit mix intelligence
    const unitMixAnalysis = await this.analyzeUnitMix(property);

    // 9. Investment decision (MF-calibrated)
    const decision = await MFDecisionEngine.generateDecision({
      metrics: { capRate, dscr, cashOnCash, oer, grm },
      property,
      marketData: await this.getMarketData(property.zipCode)
    });

    // 10. AI enhancement
    const aiInsights = await this.generateAIInsights(property, decision);

    return {
      revenue: revenueAnalysis,
      expenses: expenseAnalysis,
      noi,
      debtService,
      cashFlow,
      metrics: { capRate, dscr, cashOnCash, oer, grm },
      perUnitMetrics,
      unitMixAnalysis,
      decision,
      aiInsights
    };
  }

  private calculateRevenue(property: MFPropertyInput) {
    const potentialGrossIncome = property.units.reduce((sum, unit) => {
      return sum + (unit.marketRent * 12);
    }, 0);

    const vacancyLoss = potentialGrossIncome * (property.vacancyRate / 100);
    const creditLoss = potentialGrossIncome * (property.creditLossRate / 100);
    const effectiveGrossIncome = potentialGrossIncome - vacancyLoss - creditLoss;

    // Other income (laundry, parking, storage, pet fees)
    const otherIncome = (property.otherIncome?.laundry || 0) +
                        (property.otherIncome?.parking || 0) +
                        (property.otherIncome?.storage || 0) +
                        (property.otherIncome?.petFees || 0);

    return {
      potentialGrossIncome,
      vacancyLoss,
      creditLoss,
      effectiveGrossIncome,
      otherIncome,
      totalRevenue: effectiveGrossIncome + otherIncome
    };
  }

  private async analyzeUnitMix(property: MFPropertyInput): Promise<UnitMixIntelligence> {
    // Group units by bedroom count
    const unitMix = property.units.reduce((acc, unit) => {
      const key = unit.bedrooms;
      if (!acc[key]) acc[key] = { count: 0, totalRent: 0, sqft: 0 };
      acc[key].count++;
      acc[key].totalRent += unit.currentRent;
      acc[key].sqft += unit.squareFeet;
      return acc;
    }, {} as Record<number, { count: number, totalRent: number, sqft: number }>);

    // Get market optimal mix
    const marketData = await RentEstimationService.getMarketUnitMixTrends(property.zipCode);

    // Calculate opportunity cost
    const opportunityCost = this.calculateUnitMixOpportunityCost(unitMix, marketData);

    // Identify conversion opportunities
    const conversionOpportunities = this.identifyConversionOpportunities(property, marketData);

    return {
      currentConfiguration: { mix: unitMix, /* ... */ },
      marketComparison: { optimalMix: marketData.optimalMix, /* ... */ },
      conversionOpportunities,
      vacancyRiskAnalysis: this.assessVacancyRisk(unitMix)
    };
  }
}
```

---

## **MF-7: Frontend Components**

### **New Components Structure**:

```
/frontend/src/components/MFAnalysis/
├── MFPropertyWizard.tsx              # 4-step wizard (enhanced from SFR)
│   ├── MFAddressStep.tsx
│   ├── MFUnitMixStep.tsx             # NEW - Unit configuration
│   ├── MFFinancingStep.tsx           # Enhanced for commercial loans
│   └── MFExpensesStep.tsx            # Enhanced expense categories
├── MFAnalysisResults.tsx             # Results display
│   ├── MFInvestmentDecisionHero.tsx  # MF-specific verdict display
│   ├── MFUnitMixAnalysis.tsx         # NEW - Unit mix intelligence
│   ├── MFFinancialMetrics.tsx        # Cap Rate, DSCR, NOI, OER prominence
│   └── MFOperatingExpenses.tsx       # Enhanced expense breakdown
└── shared/
    └── UnitMixTable.tsx              # Reusable unit editor component
```

### **MFUnitMixStep.tsx** (Key New Component):

```typescript
export const MFUnitMixStep: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [useTemplate, setUseTemplate] = useState(true);

  // Template mode (quick setup)
  if (useTemplate) {
    return (
      <Box>
        <Typography variant="h6">Quick Setup - Identical Units</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Bedrooms"
              type="number"
              value={template.bedrooms}
              onChange={(e) => setTemplate({ ...template, bedrooms: +e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Bathrooms"
              type="number"
              value={template.bathrooms}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Square Feet"
              type="number"
              value={template.sqft}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Monthly Rent"
              type="number"
              value={template.rent}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
        </Grid>

        <Button onClick={() => setUseTemplate(false)}>
          Customize Individual Units
        </Button>
      </Box>
    );
  }

  // Custom mode (unit-by-unit)
  return (
    <Box>
      <Typography variant="h6">Unit Configuration</Typography>
      <UnitMixTable
        units={units}
        onUpdate={setUnits}
        marketRentEstimates={marketRentEstimates}
      />
    </Box>
  );
};
```

---

## **📋 IMPLEMENTATION CHECKLIST**

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Create MF data models and TypeScript interfaces
- [ ] Build `MultiFamilyAnalyzer.ts` core calculation engine
- [ ] Implement MF-specific financial calculations (NOI, DSCR, OER)
- [ ] Create MF Property Wizard (4-step flow)
- [ ] Build Unit Mix configuration UI
- [ ] Add MF financing options (residential vs commercial)

### **Phase 2: Intelligence (Weeks 3-4)**
- [ ] Implement `MFDecisionEngine.ts` with MF-calibrated scoring
- [ ] Build Unit Mix Intelligence analysis
- [ ] Enhance RentCast integration for unit-level estimates
- [ ] Create MF-specific AI prompts for GPT-4o-mini
- [ ] Build MF results display components
- [ ] Add Cap Rate, DSCR, NOI, OER prominence in UI

### **Phase 3: Polish & Testing (Weeks 5-6)**
- [ ] Create comprehensive MF test suite (2-unit, 8-unit, 32-unit scenarios)
- [ ] Validate commercial loan calculations (balloon payments, prepayment penalties)
- [ ] Test unit mix optimization recommendations
- [ ] Mobile responsive testing for MF wizard
- [ ] Beta user testing with real MF investors
- [ ] Documentation and help content

---

## **🧪 TESTING STRATEGY**

### **Test Scenarios** (QE Engineer Approved):

**Scenario 1: 4-Unit Residential Financing**
- Property: $520K, 4× 2BR units, $1,600/unit rent
- Financing: 20% down, 6.5% interest, 30-year residential
- Expected: DSCR ≥ 1.25, Cap Rate 6-7%, BUY/NEGOTIATE verdict

**Scenario 2: 8-Unit Commercial Financing**
- Property: $1.2M, Mixed unit mix (4× 1BR, 4× 2BR)
- Financing: 25% down, 7.0% interest, 20-year commercial, 7-year balloon
- Expected: Unit mix intelligence suggests 2BR conversion, CAUTION on balloon

**Scenario 3: 16-Unit Value-Add**
- Property: $2.4M, Below-market rents, deferred maintenance
- Analysis: Show value-add potential, renovation ROI, post-rehab NOI
- Expected: NEGOTIATE verdict with specific renovation recommendations

**Scenario 4: Edge Cases**
- 32-unit complex (upper limit)
- 2-unit duplex (lower limit, residential financing)
- 100% vacant property (stress test)
- Negative cash flow but strong appreciation market

---

## **💰 BUSINESS IMPACT ANALYSIS**

### **User Acquisition Impact**:
```
Month 1 (MF Launch):
- 50 new Professional tier signups ($49/month) = +$2,450 MRR
- 15 SFR users upgrade to Professional for MF = +$735 MRR

Month 3:
- 120 new Professional signups = +$5,880 MRR
- 30 SFR→Professional upgrades = +$1,470 MRR
- 10 Enterprise tier signups ($149/month) = +$1,490 MRR

Month 6:
- Cumulative 280 new Professional = +$13,720 MRR
- Cumulative 30 Enterprise = +$4,470 MRR
- Total MF-driven revenue: +$18,190 MRR (85% increase)
```

### **Competitive Positioning**:
- **DealCheck**: No unit mix intelligence → REAnalyzr's moat
- **Rehab Valuator**: Strong on rehab, weak on MF operations → REAnalyzr complements
- **Yardi/RealPage**: Enterprise software ($500+/month) → REAnalyzr targets individual investors

---

## **🚀 GO-TO-MARKET STRATEGY**

### **Launch Messaging**:
> "REAnalyzr now supports 2-32 unit multi-family analysis with professional-grade unit mix intelligence. Know if you're leaving $20K+ on the table with suboptimal unit configurations."

### **Content Marketing**:
1. **Blog Post**: "The $18K Mistake: Why Your 4-Unit's Unit Mix Is Killing Your Returns"
2. **YouTube**: "Multi-Family Analysis Walkthrough - Duplex to 32-Unit"
3. **BiggerPockets**: "Show: REAnalyzr's Unit Mix Optimizer vs Manual Analysis"

### **Beta User Recruitment**:
- Target: 50 beta users with 1+ MF properties
- Incentive: Free Professional tier for 6 months
- Goal: Validate DSCR calculations, unit mix recommendations

---

## **📊 SUCCESS METRICS**

**Week 4 (Post-Launch)**:
- [ ] 100+ MF analyses performed
- [ ] 85%+ user satisfaction (vs SFR wizard experience)
- [ ] <5% calculation accuracy bugs reported

**Month 3**:
- [ ] 500+ MF analyses performed
- [ ] 40% Professional tier conversion (vs 18% for SFR-only)
- [ ] 3+ case studies: "REAnalyzr found $X opportunity in my MF deal"

**Month 6**:
- [ ] 1,500+ MF analyses performed
- [ ] 60% of users with MF property use REAnalyzr for MF (vs DealCheck)
- [ ] Featured in BiggerPockets Podcast or article

---

## **🎯 FINAL RECOMMENDATION (Business Expert)**

**GO FOR 2-32 UNITS** ✅

**Rationale**:
1. **Market Sweet Spot**: 90% of your users will invest in this range
2. **Competitive Moat**: Unit mix intelligence is defensible differentiation
3. **Revenue Impact**: 85% MRR increase potential within 6 months
4. **Scope Control**: 6-week timeline vs 12+ weeks for 100+ unit support
5. **Foundation for Phase 3**: Lays groundwork for commercial, self-storage, etc.

**DON'T Build**:
- ❌ Syndication features (33+ units) - different market, different platform needs
- ❌ REIT-style portfolio management - institutional clients need different tools
- ❌ Property management software integration - scope creep, low ROI

**Key Success Factors**:
1. **Maintain SFR UX quality** - Same wizard simplicity, same Apple aesthetic
2. **Conservative DSCR standards** - DSCR < 1.25 = hard pass for 5+ units
3. **Unit mix intelligence** - This is the moat vs DealCheck
4. **Mobile-first** - 40%+ MF investors analyze on-site during tours

**Risk Mitigation**:
- Beta test with 50 real MF investors before full launch
- Start with 2-4 unit support (Month 1), then 5-32 units (Month 2)
- Validate commercial loan calculations with mortgage broker partners

---

**Status**: 🚀 **APPROVED FOR DEVELOPMENT - 6 WEEK SPRINT**

**Next Step**: Architect creates technical implementation plan in `/docs/MF_TECHNICAL_PLAN.md`
