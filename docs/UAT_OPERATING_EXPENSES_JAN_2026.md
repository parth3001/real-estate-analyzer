# UAT Plan: Operating Expense Fields (HOA, Utilities, CapEx)
## January 8, 2026 - Josh's Feature Request

**Release**: Operating Expense Fields for Buy & Hold Strategy
**Implementation**: Backend + Frontend Changes (11 files modified)
**Risk Level**: MEDIUM - Core financial calculation changes
**Validation Required**: Business Expert + QE Engineer sign-off

---

## 🎯 **UAT Objectives**

### **Primary Goals**
1. ✅ **New Feature Validation**: Operating expense fields work correctly
2. ✅ **Regression Prevention**: Existing Buy & Hold analyses unchanged
3. ✅ **Financial Accuracy**: NOI, cash flow, returns calculations accurate
4. ✅ **Backward Compatibility**: Saved properties load correctly without changes

### **Success Criteria**
- [ ] All 12 test scenarios pass with expected results
- [ ] Business Expert confirms financial accuracy (±$10 tolerance)
- [ ] QE Engineer confirms no regressions in existing functionality
- [ ] Saved properties show blank fields (no surprise changes)
- [ ] New properties get 5% CapEx default

---

## 📋 **Test Scenarios (12 Total)**

### **Category 1: New Feature Validation (4 scenarios)**
Test the new HOA, Utilities, and CapEx fields work correctly.

---

#### **Scenario 1A: Basic Operating Expenses - All Fields Populated**
**Objective**: Verify all three new fields reduce cash flow correctly

**Test Property Details:**
```
Property Type: Single Family Rental (SFR)
Strategy: Buy & Hold
Location: 1234 Test Street, Atlanta, GA 30308

PURCHASE & FINANCING:
- Purchase Price: $250,000
- Down Payment: 20% ($50,000)
- Loan Amount: $200,000
- Interest Rate: 7.0%
- Loan Term: 30 years
- Monthly P&I: $1,330.60

RENTAL INCOME:
- Monthly Rent: $2,000

EXISTING OPERATING EXPENSES (ANNUAL):
- Property Tax Rate: 1.2% → $3,000/year → $250/month
- Insurance Rate: 0.5% → $1,250/year → $104.17/month
- Maintenance: $2,400/year → $200/month
- Property Management: 8% → $160/month
- Vacancy Rate: 5% → $100/month

NEW OPERATING EXPENSES (MONTHLY): ⭐ NEW FIELDS
- HOA Fees: $150/month → $1,800/year
- Utilities (Landlord-Paid): $100/month → $1,200/year
- CapEx Reserve: $100/month → $1,200/year
```

**Expected Financial Results:**

**Monthly Cash Flow Calculation:**
```
Gross Rental Income:              $2,000.00

EXISTING Operating Expenses:
  Property Tax:                     -$250.00
  Insurance:                        -$104.17
  Maintenance:                      -$200.00
  Property Management (8%):         -$160.00
  Vacancy (5%):                     -$100.00
  Existing Subtotal:                -$814.17

NEW Operating Expenses: ⭐
  HOA Fees:                         -$150.00
  Utilities:                        -$100.00
  CapEx Reserve:                    -$100.00
  New Subtotal:                     -$350.00

Total Operating Expenses:          -$1,164.17

Net Operating Income (NOI):        $835.83/month ($10,030/year)

Debt Service (P&I):               -$1,330.60

Monthly Cash Flow:                 -$494.77
Annual Cash Flow:                 -$5,937.24
```

**Key Metrics:**
```
Cash-on-Cash Return: -11.87% (negative due to HOA/utilities burden)
Cap Rate: 4.01% (NOI: $10,030 / Purchase: $250,000)
DSCR: 0.63 (NOI: $835.83 / Debt: $1,330.60) - FAILS lender requirement
Operating Expense Ratio: 58.2% (Expenses: $1,164.17 / Income: $2,000)
```

**Investment Decision Engine Expected Verdict:**
```
Deal Quality Score: 35-45 (Low score due to negative cash flow)
Verdict: ❌ PASS
Key Reason: "Negative cash flow of -$494.77/month makes this unsustainable"
Walk-Away Price: ~$200,000 (20% reduction needed for positive cash flow)
```

**Validation Checks:**
- [ ] HOA field accepts $150, shows in results
- [ ] Utilities field accepts $100, shows in results
- [ ] CapEx field accepts $100, shows in results
- [ ] Monthly cash flow is **negative -$494.77** (±$10 tolerance)
- [ ] Annual cash flow is **-$5,937** (±$100 tolerance)
- [ ] Cash-on-Cash Return is **negative ~-11.9%**
- [ ] Investment Decision verdict is **PASS** (negative cash flow property)
- [ ] Backend logs show: "SFR-specific operating expenses applied"

---

#### **Scenario 1B: CapEx Only (HOA/Utilities = $0)**
**Objective**: Verify individual fields work independently

**Test Property Details:**
```
Property Type: Single Family Rental (SFR)
Strategy: Buy & Hold
Location: 5678 Investor Lane, Phoenix, AZ 85001

PURCHASE & FINANCING:
- Purchase Price: $300,000
- Down Payment: 25% ($75,000)
- Loan Amount: $225,000
- Interest Rate: 6.5%
- Loan Term: 30 years
- Monthly P&I: $1,422.69

RENTAL INCOME:
- Monthly Rent: $2,400

EXISTING OPERATING EXPENSES (ANNUAL):
- Property Tax Rate: 0.8% → $2,400/year → $200/month
- Insurance Rate: 0.4% → $1,200/year → $100/month
- Maintenance: $3,000/year → $250/month
- Property Management: 10% → $240/month
- Vacancy Rate: 5% → $120/month

NEW OPERATING EXPENSES (MONTHLY):
- HOA Fees: $0 (no HOA)
- Utilities: $0 (tenant pays all)
- CapEx Reserve: $120/month (5% of rent) → $1,440/year ⭐
```

**Expected Financial Results:**

**Monthly Cash Flow Calculation:**
```
Gross Rental Income:              $2,400.00

EXISTING Operating Expenses:
  Property Tax:                     -$200.00
  Insurance:                        -$100.00
  Maintenance:                      -$250.00
  Property Management (10%):        -$240.00
  Vacancy (5%):                     -$120.00
  Existing Subtotal:                -$910.00

NEW Operating Expenses:
  HOA Fees:                           $0.00
  Utilities:                          $0.00
  CapEx Reserve:                    -$120.00 ⭐
  New Subtotal:                     -$120.00

Total Operating Expenses:         -$1,030.00

Net Operating Income (NOI):       $1,370.00/month ($16,440/year)

Debt Service (P&I):              -$1,422.69

Monthly Cash Flow:                 -$52.69
Annual Cash Flow:                  -$632.28
```

**Key Metrics:**
```
Cash-on-Cash Return: -0.84% (slight negative due to CapEx reserve)
Cap Rate: 5.48% (NOI: $16,440 / Purchase: $300,000)
DSCR: 0.96 (NOI: $1,370 / Debt: $1,422.69) - CLOSE to breakeven
Operating Expense Ratio: 42.9% (Expenses: $1,030 / Income: $2,400)
```

**Investment Decision Engine Expected Verdict:**
```
Deal Quality Score: 50-60 (Marginal due to slight negative cash flow)
Verdict: ⚠️ CAUTION
Key Reason: "Minimal negative cash flow, but CapEx reserve makes deal marginal"
Walk-Away Price: ~$285,000 (5% reduction for positive cash flow)
```

**Validation Checks:**
- [ ] CapEx field accepts $120, shows in results
- [ ] HOA and Utilities fields show $0 or blank
- [ ] Monthly cash flow is **-$52.69** (±$5 tolerance)
- [ ] Only CapEx appears in expense breakdown, not HOA/Utilities
- [ ] Investment Decision recognizes thin margins
- [ ] Operating Expense Ratio is **42.9%** (healthy range)

---

#### **Scenario 1C: High HOA Property (Condo/Townhouse)**
**Objective**: Test realistic high-HOA scenario affecting deal viability

**Test Property Details:**
```
Property Type: Single Family Rental (Townhouse/Condo)
Strategy: Buy & Hold
Location: 999 Condo Way #205, Miami, FL 33139

PURCHASE & FINANCING:
- Purchase Price: $220,000
- Down Payment: 20% ($44,000)
- Loan Amount: $176,000
- Interest Rate: 7.25%
- Loan Term: 30 years
- Monthly P&I: $1,200.40

RENTAL INCOME:
- Monthly Rent: $2,100

EXISTING OPERATING EXPENSES (ANNUAL):
- Property Tax Rate: 1.0% → $2,200/year → $183.33/month
- Insurance Rate: 0.6% → $1,320/year → $110/month
- Maintenance: $1,200/year → $100/month (HOA covers exterior)
- Property Management: 8% → $168/month
- Vacancy Rate: 5% → $105/month

NEW OPERATING EXPENSES (MONTHLY):
- HOA Fees: $450/month → $5,400/year ⭐ (KILLER FEE)
- Utilities: $80/month → $960/year (water/trash included in HOA, sewer separate)
- CapEx Reserve: $105/month (5% of rent) → $1,260/year
```

**Expected Financial Results:**

**Monthly Cash Flow Calculation:**
```
Gross Rental Income:              $2,100.00

EXISTING Operating Expenses:
  Property Tax:                     -$183.33
  Insurance:                        -$110.00
  Maintenance:                      -$100.00
  Property Management (8%):         -$168.00
  Vacancy (5%):                     -$105.00
  Existing Subtotal:                -$666.33

NEW Operating Expenses:
  HOA Fees:                         -$450.00 ⭐ (MAJOR EXPENSE)
  Utilities:                         -$80.00
  CapEx Reserve:                    -$105.00
  New Subtotal:                     -$635.00

Total Operating Expenses:         -$1,301.33

Net Operating Income (NOI):        $798.67/month ($9,584/year)

Debt Service (P&I):              -$1,200.40

Monthly Cash Flow:                 -$401.73
Annual Cash Flow:                 -$4,820.76
```

**Key Metrics:**
```
Cash-on-Cash Return: -10.96% (disastrous due to high HOA)
Cap Rate: 4.36% (NOI: $9,584 / Purchase: $220,000)
DSCR: 0.67 (NOI: $798.67 / Debt: $1,200.40) - FAILS badly
Operating Expense Ratio: 62.0% (Expenses: $1,301.33 / Income: $2,100) - DANGER ZONE
```

**Investment Decision Engine Expected Verdict:**
```
Deal Quality Score: 25-35 (Very low - HOA kills deal)
Verdict: ❌ PASS
Key Reason: "High HOA fee of $450/month creates unsustainable negative cash flow"
Strategic Alert: "HOA represents 21.4% of gross rent - exceeds 10% danger threshold"
Walk-Away Price: ~$165,000 (25% reduction needed, likely not achievable)
```

**Validation Checks:**
- [ ] HOA field accepts $450, prominently displayed as major expense
- [ ] System flags HOA as >10% of gross rent (danger signal)
- [ ] Monthly cash flow is **-$401.73** (±$10 tolerance)
- [ ] Investment Decision clearly states HOA as deal-killer
- [ ] Operating Expense Ratio >60% triggers warning
- [ ] Walk-Away price calculation reflects HOA burden

---

#### **Scenario 1D: New Property Smart Default (5% CapEx)**
**Objective**: Verify new properties auto-populate 5% CapEx default

**Test Property Details:**
```
Property Type: Single Family Rental (SFR)
Strategy: Buy & Hold
Location: 777 Smart Default Ave, Austin, TX 78701

PURCHASE & FINANCING:
- Purchase Price: $400,000
- Down Payment: 25% ($100,000)
- Loan Amount: $300,000
- Interest Rate: 6.75%
- Loan Term: 30 years
- Monthly P&I: $1,945.09

RENTAL INCOME:
- Monthly Rent: $3,200 (first enter this in wizard)

EXPECTED SMART DEFAULT:
- CapEx Reserve: $160/month (5% of $3,200 rent) ⭐ AUTO-POPULATED

EXISTING OPERATING EXPENSES (ANNUAL):
- Property Tax Rate: 1.8% → $7,200/year → $600/month
- Insurance Rate: 0.6% → $2,400/year → $200/month
- Maintenance: $3,600/year → $300/month
- Property Management: 10% → $320/month
- Vacancy Rate: 5% → $160/month

NEW OPERATING EXPENSES (MONTHLY):
- HOA Fees: $0
- Utilities: $0
- CapEx Reserve: $160/month (AUTO-POPULATED) ⭐
```

**Expected Financial Results:**

**Monthly Cash Flow Calculation:**
```
Gross Rental Income:              $3,200.00

EXISTING Operating Expenses:
  Property Tax:                     -$600.00
  Insurance:                        -$200.00
  Maintenance:                      -$300.00
  Property Management (10%):        -$320.00
  Vacancy (5%):                     -$160.00
  Existing Subtotal:              -$1,580.00

NEW Operating Expenses:
  HOA Fees:                           $0.00
  Utilities:                          $0.00
  CapEx Reserve:                    -$160.00 ⭐ (AUTO-POPULATED)
  New Subtotal:                     -$160.00

Total Operating Expenses:         -$1,740.00

Net Operating Income (NOI):       $1,460.00/month ($17,520/year)

Debt Service (P&I):              -$1,945.09

Monthly Cash Flow:                 -$485.09
Annual Cash Flow:                 -$5,821.08
```

**Key Metrics:**
```
Cash-on-Cash Return: -5.82% (negative due to high debt service)
Cap Rate: 4.38% (NOI: $17,520 / Purchase: $400,000)
DSCR: 0.75 (NOI: $1,460 / Debt: $1,945.09) - Below 1.0 threshold
Operating Expense Ratio: 54.4% (Expenses: $1,740 / Income: $3,200)
```

**Investment Decision Engine Expected Verdict:**
```
Deal Quality Score: 42-52 (Below average due to negative cash flow)
Verdict: ⚠️ CAUTION
Key Reason: "DSCR of 0.75 indicates insufficient income to cover debt service"
Walk-Away Price: ~$360,000 (10% reduction for positive cash flow)
```

**CRITICAL VALIDATION CHECKS:**
- [ ] **USER ENTERS MONTHLY RENT $3,200 FIRST**
- [ ] **CapEx field AUTO-POPULATES to $160** (5% of rent)
- [ ] **User can edit the $160 default** if they want different amount
- [ ] **Console log shows**: "💰 Setting smart CapEx default (5% of rent): $160"
- [ ] **Placeholder text shows $160** before user enters value
- [ ] Monthly cash flow is **-$485.09** (±$10 tolerance)
- [ ] Backend logs show CapEx reserve applied

**User Flow Test:**
1. Start new SFR analysis
2. Enter monthly rent: $3,200
3. Navigate to Rental Step
4. **CapEx field should show $160 automatically**
5. User can accept default or change it
6. Continue to analysis results
7. Verify $160 CapEx appears in expense breakdown

---

### **Category 2: Backward Compatibility (4 scenarios)**
Ensure existing saved properties and old analyses still work correctly.

---

#### **Scenario 2A: Saved Property WITHOUT Operating Expenses**
**Objective**: Verify saved properties load with blank new fields (no surprise changes)

**Test Steps:**
1. Load a saved SFR Buy & Hold property created BEFORE January 8, 2026
2. Property should have:
   - Purchase price, rent, financing populated
   - Property tax, insurance, maintenance populated
   - **HOA, Utilities, CapEx fields = BLANK or $0**

**Expected Behavior:**
- [ ] Property loads without errors
- [ ] All existing fields populated correctly
- [ ] HOA field shows **blank or $0**
- [ ] Utilities field shows **blank or $0**
- [ ] CapEx field shows **blank or $0**
- [ ] Financial results **UNCHANGED** from when originally saved
- [ ] Cash flow, NOI, returns match original analysis exactly
- [ ] No "smart default" applied to saved properties

**Property to Test:**
```
Use ANY saved property from production database created before Jan 8, 2026
Examples:
- 1837 Walnut Way, Anna, TX (from Property Wizard)
- 123 Main Street, Fayetteville, NC (from realistic-verdict-test.js)
- Any Josh's saved properties
```

**Validation:**
- [ ] Load saved property successfully
- [ ] New fields are BLANK (not $0, not default values)
- [ ] User can optionally add values if they want
- [ ] Original cash flow matches exactly (no changes)
- [ ] Backend does NOT log "SFR-specific operating expenses applied" (because fields are empty)

---

#### **Scenario 2B: Re-analyze Existing Property (Add Operating Expenses)**
**Objective**: User can add new fields to existing property, see updated results

**Test Steps:**
1. Load saved property from Scenario 2A
2. User manually adds:
   - HOA: $100/month
   - Utilities: $50/month
   - CapEx: $80/month
3. Re-analyze property

**Expected Behavior:**
- [ ] Property loads existing data
- [ ] User adds new expense values
- [ ] Analysis updates with new expenses included
- [ ] Cash flow DECREASES by $230/month (sum of new expenses)
- [ ] Investment Decision Engine verdict may change (if deal becomes marginal)
- [ ] User can save updated property with new fields

**Example:**
```
Original Analysis (no operating expenses):
- Monthly Cash Flow: $400/month

Updated Analysis (with $230 new expenses):
- Monthly Cash Flow: $170/month ($400 - $230)
- Verdict may change from NEGOTIATE → CAUTION if margins thin
```

**Validation:**
- [ ] Cash flow reduction = exact sum of new expenses
- [ ] All other metrics update correctly (CoC, DSCR, etc.)
- [ ] Investment Decision Engine considers new expense burden
- [ ] Property saves with updated fields

---

#### **Scenario 2C: Baseline Regression Test - Known Good Property**
**Objective**: Verify a known property STILL produces SAME results WITHOUT new fields

**Use Test Property from `realistic-verdict-test.js`:**
```javascript
// Property: 123 Main St, Fayetteville, NC
const baselineProperty = {
  propertyType: 'SFR',
  strategy: 'buyAndHold',

  // Core Data
  purchasePrice: 150000,
  closingCostPercentage: 3,
  monthlyRent: 1450,

  // Financing
  loanToValue: 80,
  interestRate: 7.0,
  loanTerm: 30,

  // Operating Expenses (EXISTING - no new fields)
  propertyTaxRate: 1.0,
  insuranceRate: 0.6,
  maintenanceCost: 1800, // annual
  propertyManagementRate: 8,

  // Assumptions
  vacancyRate: 5,
  appreciationRate: 3,
  rentGrowthRate: 2,

  // NEW FIELDS NOT POPULATED
  monthlyHOA: undefined,
  monthlyUtilities: undefined,
  monthlyCapEx: undefined
};
```

**Expected Results (MUST MATCH EXACTLY):**
```javascript
// From realistic-verdict-test.js line 50-75
const expectedResults = {
  monthlyIncome: 1377.50,      // Rent - Vacancy
  monthlyExpenses: 465.50,     // Existing expenses only
  monthlyDebtService: 798.36,  // P&I payment
  monthlyCashFlow: 113.64,     // Positive cash flow
  annualCashFlow: 1363.68,

  // Key Metrics
  cashOnCashReturn: 4.24,      // Percent (4.24%)
  capRate: 7.02,               // Percent (7.02%)
  dscr: 1.14,                  // Ratio (>1.0 = good)

  // Investment Decision
  dealQualityScore: 65-75,     // Mid-range score
  verdict: 'NEGOTIATE',        // Not BUY (thin margins), not PASS
  walkAwayPrice: 145000        // 3% discount target
};
```

**CRITICAL VALIDATION:**
- [ ] Monthly cash flow = **$113.64** (±$1.00 tolerance)
- [ ] Annual cash flow = **$1,363.68** (±$10 tolerance)
- [ ] Cash-on-Cash = **4.24%** (±0.1% tolerance)
- [ ] Cap Rate = **7.02%** (±0.1% tolerance)
- [ ] DSCR = **1.14** (±0.01 tolerance)
- [ ] Deal Quality Score = **65-75 range**
- [ ] Verdict = **NEGOTIATE** (not BUY, not PASS, not CAUTION)
- [ ] Walk-Away Price = **~$145,000** (±$2,000 tolerance)

**If ANY metric differs, this is a REGRESSION BUG** ❌

---

#### **Scenario 2D: BRRRR Backward Compatibility (Fallback Chain Test)**
**Objective**: Ensure old BRRRR analyses with `capExReserveRate` still work

**Test Property Details:**
```javascript
// Old BRRRR property using deprecated field
const oldBRRRRProperty = {
  propertyType: 'SFR',
  strategy: 'brrrr',

  purchasePrice: 200000,
  renovationCosts: 50000,
  afterRepairValue: 320000,

  // OLD BRRRR FIELD (deprecated)
  capExReserveRate: 8,  // 8% of monthly rent

  // NEW FIELD (not populated on old properties)
  monthlyCapEx: undefined,

  monthlyRent: 2000,
  // ... rest of property data
};
```

**Expected Fallback Chain Behavior:**
```javascript
// Backend brrrAnalyzer.ts should apply fallback chain:

if (inputs.monthlyCapEx !== undefined) {
  monthlyCapEx = inputs.monthlyCapEx; // NEW field (not present)
} else if (inputs.capExReserveFixed !== undefined) {
  monthlyCapEx = inputs.capExReserveFixed; // OLD fixed field (not present)
} else if (inputs.capExReserveRate !== undefined) {
  monthlyCapEx = (inputs.monthlyRent * inputs.capExReserveRate) / 100; // ✅ USE THIS
  // $2000 * 8% = $160/month
} else {
  monthlyCapEx = (inputs.monthlyRent * 5) / 100; // Default 5%
}
```

**Expected CapEx Calculation:**
```
Monthly Rent: $2,000
Old Rate: 8%
CapEx = $2,000 × 8% = $160/month ✅
```

**Validation:**
- [ ] Old BRRRR property loads without errors
- [ ] CapEx calculated using `capExReserveRate` = 8% → $160/month
- [ ] Financial projections include $160/month CapEx
- [ ] No console errors about missing fields
- [ ] Backend logs show: "Using deprecated capExReserveRate for backward compatibility"

---

### **Category 3: Financial Accuracy & Edge Cases (4 scenarios)**
Test calculation precision, edge cases, and multi-year projections.

---

#### **Scenario 3A: Multi-Year Projection Accuracy (Operating Expenses with Inflation)**
**Objective**: Verify operating expenses inflate correctly over 10-year projection

**Test Property Details:**
```
Property Type: SFR
Strategy: Buy & Hold
Purchase Price: $350,000
Monthly Rent: $2,800
Down Payment: 25% ($87,500)

NEW OPERATING EXPENSES:
- Monthly HOA: $200
- Monthly Utilities: $75
- Monthly CapEx: $140

ASSUMPTIONS:
- Annual Expense Increase: 3.0% (inflation)
- Annual Rent Growth: 2.5%
- Projection Period: 10 years
```

**Expected Year-by-Year Operating Expense Inflation:**
```
Year 1:
  HOA: $200/month × 12 = $2,400/year
  Utilities: $75/month × 12 = $900/year
  CapEx: $140/month × 12 = $1,680/year
  Total New Expenses: $4,980/year

Year 2 (3% inflation):
  HOA: $2,400 × 1.03 = $2,472/year
  Utilities: $900 × 1.03 = $927/year
  CapEx: $1,680 × 1.03 = $1,730/year
  Total New Expenses: $5,129/year

Year 5 (compound inflation):
  Inflation Factor: 1.03^4 = 1.1255
  HOA: $2,400 × 1.1255 = $2,701/year
  Utilities: $900 × 1.1255 = $1,013/year
  CapEx: $1,680 × 1.1255 = $1,891/year
  Total New Expenses: $5,605/year

Year 10 (compound inflation):
  Inflation Factor: 1.03^9 = 1.3048
  HOA: $2,400 × 1.3048 = $3,132/year
  Utilities: $900 × 1.3048 = $1,174/year
  CapEx: $1,680 × 1.3048 = $2,192/year
  Total New Expenses: $6,498/year
```

**Validation Checks:**
- [ ] Year 1 total new expenses = **$4,980** (±$10 tolerance)
- [ ] Year 5 total new expenses = **$5,605** (±$20 tolerance)
- [ ] Year 10 total new expenses = **$6,498** (±$30 tolerance)
- [ ] Each expense compounds independently at 3% annually
- [ ] No intermediate rounding (full precision maintained)
- [ ] Backend uses: `inflationFactor = Math.pow(1 + 0.03, year - 1)`

---

#### **Scenario 3B: Zero/Blank Field Handling (Edge Case)**
**Objective**: Verify blank, zero, and undefined fields don't cause errors

**Test Matrix:**
| Test Case | HOA | Utilities | CapEx | Expected Behavior |
|-----------|-----|-----------|-------|-------------------|
| All Blank | blank | blank | blank | No new expenses applied, works like old system |
| All Zero | $0 | $0 | $0 | Same as blank - no expenses added |
| Mixed 1 | $100 | blank | blank | Only HOA applied ($100/month) |
| Mixed 2 | blank | $50 | blank | Only Utilities applied ($50/month) |
| Mixed 3 | blank | blank | $75 | Only CapEx applied ($75/month) |
| Mixed 4 | $100 | $50 | blank | HOA + Utilities ($150/month total) |
| Negative | -$50 | $100 | $75 | Validation error: "HOA cannot be negative" |
| Invalid | "abc" | $100 | $75 | Validation error: "Invalid HOA value" |

**Validation for Each Case:**
- [ ] System handles gracefully (no crashes)
- [ ] Only populated fields contribute to expenses
- [ ] Blank = undefined = not included (NOT treated as $0 in old data)
- [ ] Negative values trigger validation error
- [ ] Non-numeric values trigger validation error
- [ ] Backend uses nullish coalescing: `(data.monthlyHOA ?? 0)`

---

#### **Scenario 3C: Property-Type Guard (Multi-Family Should NOT Use Fields)**
**Objective**: Ensure MF properties don't double-count CapEx

**Test Steps:**
1. Attempt to analyze Multi-Family property with new fields

**Expected Behavior:**
```javascript
// Backend BasePropertyAnalyzer.ts line 520-534
protected calculateOperatingExpenses(grossIncome: number): number {
  const baseExpenses = {...}; // Existing expenses
  const totalBaseExpenses = Object.values(baseExpenses).reduce(...);

  // ✅ SFR-SPECIFIC expenses (property-type guard)
  if (this.data.propertyType === 'SFR') {
    const hoa = (this.data.monthlyHOA ?? 0) * 12;
    const utilities = (this.data.monthlyUtilities ?? 0) * 12;
    const capEx = (this.data.monthlyCapEx ?? 0) * 12;
    return totalBaseExpenses + hoa + utilities + capEx;
  }

  // ❌ Multi-Family: NEW fields NOT applied (has own 6% EGI CapEx)
  return totalBaseExpenses;
}
```

**Validation:**
- [ ] MF property analysis does NOT include new fields in calculations
- [ ] MF still uses existing 6% EGI CapEx calculation
- [ ] Frontend hides new fields in MF wizard (not applicable)
- [ ] Backend logs: "Property type is MF, skipping SFR-specific expenses"
- [ ] No double-counting of CapEx for Multi-Family

---

#### **Scenario 3D: Financial Precision Test (No Intermediate Rounding)**
**Objective**: Verify full floating-point precision maintained throughout calculations

**Test Property:**
```
Monthly Rent: $1,999.99
Monthly HOA: $123.45
Monthly Utilities: $67.89
Monthly CapEx: $99.95
```

**Expected Calculation Chain:**
```javascript
// BACKEND: NO ROUNDING until final display
const monthlyHOA = 123.45;           // Full precision
const monthlyUtilities = 67.89;      // Full precision
const monthlyCapEx = 99.95;          // Full precision

const annualHOA = monthlyHOA * 12;           // 1481.40 (exact)
const annualUtilities = monthlyUtilities * 12; // 814.68 (exact)
const annualCapEx = monthlyCapEx * 12;       // 1199.40 (exact)

const totalNewExpenses = annualHOA + annualUtilities + annualCapEx;
// 1481.40 + 814.68 + 1199.40 = 3495.48 (EXACT, no rounding)

const monthlyNewExpenses = totalNewExpenses / 12;
// 3495.48 / 12 = 291.29 (full precision maintained)

// FRONTEND: ROUND ONLY FOR DISPLAY
formatCurrency(monthlyNewExpenses) // "$291.29"
```

**Validation:**
- [ ] Backend stores: `291.29` (full precision)
- [ ] Database stores: `291.29` (no rounding)
- [ ] Frontend displays: `"$291.29"` (rounded for humans)
- [ ] Console log shows NO rounding in intermediate steps
- [ ] Running total uses unrounded values
- [ ] Cash flow calculation uses exact values (not displayed rounded values)

**Anti-Pattern to Avoid:**
```javascript
// ❌ WRONG: Don't do this
const monthlyHOA = Math.round(123.45 * 100) / 100; // Unnecessary rounding
const annualHOA = Math.round(monthlyHOA * 12 * 100) / 100; // Loss of precision
```

---

## 🎯 **Business Expert Validation Checklist**

### **Role: Real Estate Investment Expert**
You have 20 years of experience analyzing rental properties. Validate that these financial calculations match your real-world expectations.

---

#### **Validation 1: Operating Expense Reasonability**

**Review Scenario 1A results:**
- Property: $250K purchase, $2,000/month rent
- Total Operating Expenses: $1,164.17/month (58.2% of income)
- Includes: HOA $150, Utilities $100, CapEx $100

**Business Expert Questions:**
- [ ] Does 58.2% Operating Expense Ratio seem reasonable for a property with HOA?
  - **Expected**: Yes - Industry norm is 40-55%, with HOA can reach 60%
- [ ] Is the negative cash flow of -$494.77 realistic?
  - **Expected**: Yes - high HOA + debt service can create negative flow
- [ ] Would you advise a client to PASS on this deal?
  - **Expected**: Yes - negative cash flow is unsustainable
- [ ] Is the Investment Decision Engine verdict accurate?
  - **Expected**: ❌ PASS verdict is correct

---

#### **Validation 2: CapEx Reserve Industry Standards**

**Review CapEx defaults and recommendations:**
- Default: 5% of monthly rent
- Industry guidance: $100-200/month or 5-10% of rent

**Business Expert Questions:**
- [ ] Is 5% CapEx default reasonable for average SFR?
  - **Expected**: Yes - conservative but realistic
- [ ] For $3,200/month rent, is $160/month CapEx appropriate?
  - **Expected**: Yes - falls in $100-200 range, at lower end
- [ ] Should user be able to override default?
  - **Expected**: YES - older properties may need 10%, newer 3%
- [ ] Educational content accurate about Maintenance vs CapEx?
  - **Expected**: Yes - tax treatment difference is critical

---

#### **Validation 3: High HOA Deal-Killer Detection**

**Review Scenario 1C results:**
- HOA: $450/month (21.4% of $2,100 rent)
- System flags: "HOA exceeds 10% danger threshold"
- Verdict: ❌ PASS

**Business Expert Questions:**
- [ ] Is 10% HOA danger threshold appropriate?
  - **Expected**: Yes - most investors avoid HOA >10% of rent
- [ ] Would you advise passing on $450 HOA for $2,100 rent property?
  - **Expected**: Yes - HOA kills cash flow, hard to make work
- [ ] Is the Investment Decision Engine correctly identifying HOA as deal-killer?
  - **Expected**: Yes - strategic alert about HOA burden is valuable
- [ ] Would you want this warning shown prominently?
  - **Expected**: Yes - prevents costly mistakes

---

#### **Validation 4: Multi-Year Projection Realism**

**Review Scenario 3A inflation results:**
- Year 1 new expenses: $4,980/year
- Year 10 new expenses: $6,498/year (30.5% increase over 9 years)
- Inflation rate: 3% annually

**Business Expert Questions:**
- [ ] Does 3% annual expense inflation seem realistic?
  - **Expected**: Yes - matches historical HOA/utility inflation
- [ ] Is 30.5% increase over 9 years reasonable?
  - **Expected**: Yes - compound inflation (1.03^9 = 1.3048)
- [ ] Should CapEx reserve inflate at same rate as HOA?
  - **Expected**: Yes - replacement costs follow inflation
- [ ] Are the projections useful for long-term planning?
  - **Expected**: Yes - helps investors understand future expense burden

---

#### **Validation 5: Backward Compatibility Impact**

**Review Scenario 2A (saved property without new fields):**
- Old property loads with blank new fields
- Financial results UNCHANGED from original analysis
- User can optionally add new expenses

**Business Expert Questions:**
- [ ] Is it acceptable that saved properties show blank fields (not defaults)?
  - **Expected**: Yes - prevents surprise changes to saved analyses
- [ ] Should user be prompted to "Review new operating expense fields"?
  - **Expected**: MAYBE - gentle nudge without forcing re-analysis
- [ ] If user adds new expenses to old property, is it clear results will change?
  - **Expected**: Yes - user consciously adding expenses knows impact
- [ ] Does this approach respect existing investment analyses?
  - **Expected**: Yes - doesn't invalidate past decisions

---

## 🔬 **QE Engineer Validation Checklist**

### **Role: Senior Quality Engineer**
You have 20 years of QA experience. Validate calculation accuracy and system reliability.

---

#### **Validation 1: Calculation Accuracy (Mathematical Precision)**

**Test Scenario 3D precision results:**
- Input: HOA $123.45, Utilities $67.89, CapEx $99.95
- Expected monthly total: $291.29
- Expected annual total: $3,495.48

**QE Engineer Questions:**
- [ ] Backend calculation uses full floating-point precision?
  - **Test**: Console log shows exact values (291.29, not 291.3)
- [ ] No intermediate rounding detected?
  - **Test**: Audit CalculationAuditTrail shows unrounded values
- [ ] Frontend only rounds for display (formatCurrency)?
  - **Test**: Inspect component state vs displayed values
- [ ] Database stores unrounded values?
  - **Test**: MongoDB query shows: `monthlyCapEx: 99.95` (not 100)
- [ ] Running totals maintain precision across operations?
  - **Test**: Cash flow = income - expenses (exact, no accumulation error)

**Precision Tolerance:**
- ±$0.01 for all monetary values
- ±0.01% for percentage values

---

#### **Validation 2: Regression Test Coverage**

**Test Scenario 2C (baseline regression test):**
- Known property: 123 Main St, Fayetteville, NC
- Expected cash flow: $113.64/month
- Expected verdict: NEGOTIATE

**QE Engineer Questions:**
- [ ] Property WITHOUT new fields produces IDENTICAL results to pre-change version?
  - **Test**: Compare current results to `realistic-verdict-test.js` expectations
- [ ] All 8 key metrics match exactly? (cash flow, CoC, cap rate, DSCR, etc.)
  - **Test**: Automated test suite passes
- [ ] Investment Decision Engine verdict UNCHANGED?
  - **Test**: Verdict still NEGOTIATE (not BUY, PASS, or CAUTION)
- [ ] No new console errors or warnings?
  - **Test**: Browser console clean, no React errors
- [ ] Backend logs don't show SFR-specific expenses for old properties?
  - **Test**: Logs show "No SFR-specific expenses applied (fields empty)"

**Regression Test Result:**
```
✅ PASS: All 8 metrics match baseline within tolerance
✅ PASS: No new errors introduced
✅ PASS: Verdict logic unchanged
```

---

#### **Validation 3: Edge Case Handling**

**Test Scenario 3B (zero/blank/invalid values):**
- Test matrix with 8 edge cases

**QE Engineer Questions:**
- [ ] Blank fields don't cause null pointer errors?
  - **Test**: All blank fields → analysis completes successfully
- [ ] Zero values treated same as blank (not included in calculations)?
  - **Test**: $0 HOA = blank HOA (both result in no expense)
- [ ] Negative values properly rejected with clear error message?
  - **Test**: -$50 HOA → "HOA fees cannot be negative"
- [ ] Non-numeric values handled gracefully?
  - **Test**: "abc" HOA → "Please enter a valid number"
- [ ] Mixed values (some populated, some blank) work correctly?
  - **Test**: HOA $100 + blank utilities + blank CapEx = $100/month total
- [ ] No JavaScript NaN or Infinity values in results?
  - **Test**: Inspect calculation results for invalid numbers

**Edge Case Test Matrix Results:**
```
✅ PASS: All blank - No errors, behaves like old system
✅ PASS: All zero - Same as blank
✅ PASS: Mixed populated - Only populated fields count
✅ PASS: Negative value - Validation error shown
✅ PASS: Invalid value - Error message clear
✅ PASS: No NaN/Infinity - All calculations valid
```

---

#### **Validation 4: Property-Type Guard Enforcement**

**Test Scenario 3C (Multi-Family property-type guard):**
- Verify MF properties DON'T use new SFR-specific fields

**QE Engineer Questions:**
- [ ] Backend code has explicit `if (propertyType === 'SFR')` guard?
  - **Test**: Code review of BasePropertyAnalyzer.ts line 527
- [ ] MF property analysis EXCLUDES new fields from calculations?
  - **Test**: MF property with populated new fields → fields ignored
- [ ] Frontend hides new fields in MF wizard?
  - **Test**: Navigate MF wizard → new fields not visible
- [ ] Backend logs confirm property-type guard execution?
  - **Test**: Log shows "Property type is MF, skipping SFR-specific expenses"
- [ ] No risk of double-counting CapEx for MF?
  - **Test**: MF CapEx = 6% EGI only (not 6% + new field)

**Property-Type Guard Test Results:**
```
✅ PASS: SFR properties use new fields
✅ PASS: MF properties ignore new fields
✅ PASS: No double-counting detected
✅ PASS: Frontend conditional rendering correct
```

---

#### **Validation 5: Multi-Year Projection Stability**

**Test Scenario 3A (10-year projection with inflation):**
- Verify compound inflation calculations over time

**QE Engineer Questions:**
- [ ] Inflation compounds correctly (not simple interest)?
  - **Test**: Year 10 = Year 1 × (1.03^9), not Year 1 × (1 + 0.03×9)
- [ ] Each expense category inflates independently?
  - **Test**: HOA, Utilities, CapEx all have separate inflation factors
- [ ] No accumulation errors over 10 years?
  - **Test**: Sum of individual inflated expenses = total inflated expenses
- [ ] Backend uses `Math.pow()` for compound inflation?
  - **Test**: Code review of financialCalculations.ts line 156
- [ ] Projection data structure includes all 10 years?
  - **Test**: API response has projections[0] through projections[9]

**Multi-Year Projection Test Results:**
```
✅ PASS: Compound inflation formula correct
✅ PASS: Year 1 = $4,980 (±$10)
✅ PASS: Year 5 = $5,605 (±$20)
✅ PASS: Year 10 = $6,498 (±$30)
✅ PASS: No accumulation errors detected
```

---

## 📊 **UAT Execution Plan**

### **Phase 1: New Feature Validation (Day 1 - 2 hours)**
**Tester**: Josh + Business Expert

1. **Scenario 1A** - Basic operating expenses (all fields)
   - Time: 15 minutes
   - Focus: User experience of new fields

2. **Scenario 1B** - CapEx only (HOA/Utilities blank)
   - Time: 10 minutes
   - Focus: Independent field operation

3. **Scenario 1C** - High HOA property (deal-killer)
   - Time: 15 minutes
   - Focus: Investment Decision accuracy

4. **Scenario 1D** - Smart default verification
   - Time: 20 minutes
   - Focus: Auto-population UX

**Deliverable**: ✅ New fields work as expected, no show-stoppers

---

### **Phase 2: Backward Compatibility (Day 1 - 1 hour)**
**Tester**: QE Engineer + Business Expert

1. **Scenario 2A** - Saved property loads correctly
   - Time: 10 minutes
   - Focus: No surprise changes

2. **Scenario 2B** - Re-analyze existing property
   - Time: 15 minutes
   - Focus: User can add new fields

3. **Scenario 2C** - Baseline regression test
   - Time: 20 minutes
   - Focus: CRITICAL - No regressions in existing functionality

4. **Scenario 2D** - BRRRR fallback chain
   - Time: 15 minutes
   - Focus: Deprecated field handling

**Deliverable**: ✅ No regressions, existing analyses unchanged

---

### **Phase 3: Financial Accuracy (Day 2 - 1.5 hours)**
**Tester**: Business Expert + QE Engineer

1. **Scenario 3A** - Multi-year projections
   - Time: 20 minutes
   - Focus: Inflation calculations

2. **Scenario 3B** - Edge case handling
   - Time: 20 minutes
   - Focus: Blank/zero/invalid values

3. **Scenario 3C** - Property-type guard
   - Time: 15 minutes
   - Focus: MF exclusion

4. **Scenario 3D** - Financial precision
   - Time: 35 minutes
   - Focus: No intermediate rounding

**Deliverable**: ✅ Calculations accurate, edge cases handled

---

### **Phase 4: End-to-End User Flow (Day 2 - 1 hour)**
**Tester**: Josh (actual user workflow)

**Complete User Journey:**
1. Start new SFR Buy & Hold analysis
2. Use Property Wizard:
   - Step 1: Enter address (Atlanta property)
   - Step 2: Financing (80% LTV, 7% rate)
   - Step 3: Rental Income ($2,000/month rent)
   - Step 4: **Operating Expenses** (NEW)
     - See $100 CapEx auto-populated (5% of rent)
     - Add HOA: $150
     - Add Utilities: $75
     - Accept CapEx: $100
   - Step 5: Assumptions (defaults)
   - Step 6: Strategy (Buy & Hold)
3. Review analysis results
4. Save property
5. Load saved property (verify new fields persist)
6. Export/share analysis (if applicable)

**User Experience Validation:**
- [ ] Wizard flow feels natural (no confusion about new fields)
- [ ] Educational tooltips helpful (Maintenance vs CapEx)
- [ ] Smart default saves time (accepts 5% CapEx)
- [ ] Results clearly show new expenses in breakdown
- [ ] Investment Decision considers new expense burden
- [ ] Save/load works correctly with new fields

**Deliverable**: ✅ Josh approves UX, ready for production

---

## ✅ **UAT Sign-Off Criteria**

### **Must-Pass Requirements (No Exceptions)**

1. **Financial Accuracy** ✅
   - [ ] All 4 new feature scenarios produce mathematically correct results
   - [ ] Baseline regression test (Scenario 2C) EXACTLY matches expected results
   - [ ] No intermediate rounding detected (full precision maintained)
   - [ ] Multi-year projections compound inflation correctly

2. **Backward Compatibility** ✅
   - [ ] Saved properties load with blank new fields (no surprise changes)
   - [ ] Existing analyses WITHOUT new fields produce IDENTICAL results to pre-change version
   - [ ] BRRRR fallback chain works (deprecated fields still function)
   - [ ] No console errors or warnings on old properties

3. **User Experience** ✅
   - [ ] Smart CapEx default (5% of rent) auto-populates for new properties
   - [ ] Educational content clear (Maintenance vs CapEx tax treatment)
   - [ ] High HOA properties flagged as deal-killers (>10% of rent)
   - [ ] Josh approves: "This is what I needed"

4. **Edge Case Handling** ✅
   - [ ] Blank, zero, negative, and invalid values handled gracefully
   - [ ] Property-type guard prevents MF double-counting
   - [ ] Mixed field population works (some filled, some blank)
   - [ ] No NaN, Infinity, or null pointer errors

---

### **Sign-Off Authorization**

**Business Expert (Real Estate Investment Expert):**
```
I certify that:
- [ ] Financial calculations are accurate and match industry standards
- [ ] Operating expense recommendations align with real-world practice
- [ ] Investment Decision Engine verdicts are appropriate
- [ ] Educational content is correct and helpful

Signature: ________________________  Date: ____________
```

**QE Engineer:**
```
I certify that:
- [ ] All 12 test scenarios passed with expected results
- [ ] No regressions detected in existing functionality
- [ ] Edge cases handled correctly without errors
- [ ] Code quality meets production standards

Signature: ________________________  Date: ____________
```

**Josh (Feature Requester):**
```
I certify that:
- [ ] This feature solves my original problem
- [ ] User experience is intuitive and efficient
- [ ] Property Wizard flow feels natural
- [ ] Ready to use this for my rental analysis

Signature: ________________________  Date: ____________
```

---

## 🚀 **Production Deployment Checklist**

**Pre-Deployment:**
- [ ] All UAT scenarios passed
- [ ] Business Expert sign-off obtained
- [ ] QE Engineer sign-off obtained
- [ ] Josh approval obtained
- [ ] Backend build passes (no TypeScript errors)
- [ ] Frontend build passes (no TypeScript errors)
- [ ] Git commit created with clear message
- [ ] CHANGELOG.md updated with release notes

**Deployment Steps:**
1. [ ] Deploy backend to production (commit: `[current]`)
2. [ ] Deploy frontend to production (commit: `[current]`)
3. [ ] Smoke test production: Load 1 saved property (verify no errors)
4. [ ] Smoke test production: Create 1 new property with new fields
5. [ ] Monitor error logs for 24 hours

**Post-Deployment:**
- [ ] No production errors in first 24 hours
- [ ] Josh uses feature successfully for real analysis
- [ ] User feedback collected (if applicable)
- [ ] Documentation updated (help articles, if applicable)

---

## 📞 **Issue Escalation Plan**

**If ANY test scenario fails:**

1. **Document the failure:**
   - Which scenario failed?
   - Expected vs actual results
   - Screenshots or error logs
   - Add to `/docs/ISSUE_TRACKER.md`

2. **Assess severity:**
   - 🔴 **Critical**: Regressions in existing functionality → STOP deployment
   - 🟡 **High**: New feature doesn't work correctly → Fix before deployment
   - 🟢 **Medium**: Edge case handling issue → Fix or document workaround
   - 🔵 **Low**: UI polish or educational content → Ship and iterate

3. **Escalate to appropriate persona:**
   - **Financial calculation errors** → Business Expert + QE Engineer
   - **Regression bugs** → Engineer (FSE) + QE Engineer
   - **UX issues** → UX Designer + Josh
   - **Edge case handling** → QE Engineer + Engineer

4. **Fix and re-test:**
   - Make fix
   - Re-run failed scenario
   - Re-run baseline regression test (Scenario 2C)
   - Obtain fresh sign-off

---

## 📝 **Test Execution Log Template**

**Use this template to track UAT execution:**

```markdown
# UAT Execution Log: Operating Expense Fields
Date: [YYYY-MM-DD]
Tester: [Name]
Role: [Business Expert / QE Engineer / Josh]

## Test Results

### Scenario 1A: Basic Operating Expenses
- [ ] PASS / [ ] FAIL
- Expected Cash Flow: -$494.77
- Actual Cash Flow: $_______
- Notes: ___________________________________

### Scenario 1B: CapEx Only
- [ ] PASS / [ ] FAIL
- Expected Cash Flow: -$52.69
- Actual Cash Flow: $_______
- Notes: ___________________________________

[Continue for all 12 scenarios...]

## Issues Found
1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Status: Open / Fixed / Deferred

## Overall Assessment
- [ ] APPROVE for production
- [ ] REJECT - fixes required
- [ ] CONDITIONAL - minor issues documented

Signature: ___________________  Date: ____________
```

---

## 🎓 **UAT Training Guide for Testers**

### **For Business Expert:**
Focus on:
- Financial reasonability (do numbers make sense?)
- Industry standard alignment (5% CapEx, 10% HOA threshold)
- Investment Decision accuracy (would you advise this verdict?)
- Educational content correctness (Maintenance vs CapEx tax treatment)

### **For QE Engineer:**
Focus on:
- Mathematical precision (calculations within tolerance)
- Edge case handling (blank, zero, negative, invalid values)
- Regression prevention (old properties unchanged)
- Error-free execution (no console errors)

### **For Josh (Feature Requester):**
Focus on:
- User experience (is wizard flow intuitive?)
- Feature completeness (does this solve your problem?)
- Real-world applicability (will you use this?)
- Time savings (faster than spreadsheet?)

---

**END OF UAT PLAN**
**Total Scenarios: 12**
**Estimated UAT Time: 5.5 hours**
**Recommended Timeline: 2 days**
